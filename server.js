// ============================================================
// 部勝（ブカツ）Backend Server v33 - Production Complete
// ============================================================
// デプロイ先: Render (https://bukatsu-backend.onrender.com)
//
// 環境変数（Render Dashboard → Environment で設定）:
//   GEMINI_API_KEY         - Google Gemini API キー（必須: AI機能）
//   STRIPE_SECRET_KEY      - Stripe シークレットキー（必須: 決済）
//   STRIPE_WEBHOOK_SECRET  - Stripe Webhook署名シークレット（推奨）
//   SENDGRID_API_KEY       - SendGrid API キー（任意: メール通知）
//   FIREBASE_PROJECT_ID    - Firebase プロジェクトID（デフォルト: myteam-mycoach）
//   FIREBASE_SERVICE_ACCOUNT - Firebase Admin SDK サービスアカウントJSON（必須: Webhook→DB）
//   ALLOWED_ORIGINS        - CORS許可オリジン（カンマ区切り）
//   ADMIN_EMAILS           - 管理者メール（カンマ区切り, 管理者API用）
//   NODE_ENV               - production / development
// ============================================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const app = express();

// ── 環境変数 ──
const GEMINI_KEY = process.env.GEMINI_API_KEY || '';
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WH_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const SENDGRID_KEY = process.env.SENDGRID_API_KEY || '';
const FB_PROJECT = process.env.FIREBASE_PROJECT_ID || 'myteam-mycoach';
const FB_SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT || '';
const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = process.env.PORT || 3000;
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim()).filter(Boolean);

// ── Firebase Admin SDK（Webhook→Firestore書込み用）──
let firebaseAdmin, firestoreDb;
try {
  firebaseAdmin = require('firebase-admin');
  if (FB_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(FB_SERVICE_ACCOUNT);
    firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.cert(serviceAccount),
      projectId: FB_PROJECT
    });
    firestoreDb = firebaseAdmin.firestore();
    console.log('✅ Firebase Admin SDK 初期化完了');
  } else {
    console.warn('⚠️  FIREBASE_SERVICE_ACCOUNT 未設定 → Webhook→DB書込み停止');
  }
} catch (e) {
  console.warn('⚠️  Firebase Admin SDK 初期化失敗:', e.message);
}

// 起動時チェック
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🏟️  部勝 Backend v33');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
if (!GEMINI_KEY) console.warn('⚠️  GEMINI_API_KEY 未設定 → AI機能停止');
if (!STRIPE_KEY) console.warn('⚠️  STRIPE_SECRET_KEY 未設定 → 決済停止');
if (!STRIPE_WH_SECRET) console.warn('⚠️  STRIPE_WEBHOOK_SECRET 未設定 → Webhook署名検証なし');
if (!SENDGRID_KEY) console.warn('⚠️  SENDGRID_API_KEY 未設定 → メール停止');

// ================================================================
// セキュリティヘッダー (Helmet)
// ================================================================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.stripe.com", "https://api.sendgrid.com", "https://generativelanguage.googleapis.com"],
      frameSrc: ["'self'", "https://checkout.stripe.com", "https://connect.stripe.com"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: { maxAge: 31536000, includeSubDomains: true },
}));
app.disable('x-powered-by');

// ── CORS ──
const allowedOrigins = (process.env.ALLOWED_ORIGINS ||
  'https://myteam-mycoach.web.app,https://myteam-mycoach.firebaseapp.com,http://localhost:5000,http://localhost:3000'
).split(',').map(s => s.trim());

app.use(cors({
  origin: function(origin, cb) {
    if (!origin || allowedOrigins.includes(origin)) cb(null, true);
    else { console.warn('[CORS] Blocked:', origin); cb(new Error('CORS blocked')); }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Webhook用: raw bodyが必要（他のルートより先に定義）
app.post('/api/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// 通常のルート用
app.use(express.json({ limit: '5mb' }));
// URLエンコードも対応
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ================================================================
// レート制限（強化版）
// ================================================================
const _rl = {};
function rateLimit(key, limit = 30, windowMs = 60000) {
  const now = Date.now();
  if (!_rl[key]) _rl[key] = [];
  _rl[key] = _rl[key].filter(t => t > now - windowMs);
  if (_rl[key].length >= limit) return false;
  _rl[key].push(now);
  return true;
}

// ブルートフォース防止（認証失敗5回で15分ブロック）
const _authFails = {};
function checkBruteForce(ip) {
  const now = Date.now();
  if (!_authFails[ip]) return true;
  const recent = _authFails[ip].filter(t => t > now - 900000); // 15分
  _authFails[ip] = recent;
  return recent.length < 5;
}
function recordAuthFail(ip) {
  if (!_authFails[ip]) _authFails[ip] = [];
  _authFails[ip].push(Date.now());
}

// 定期クリーンアップ（5分ごと）
setInterval(() => {
  const cutoff = Date.now() - 300000;
  Object.keys(_rl).forEach(k => {
    _rl[k] = _rl[k].filter(t => t > cutoff);
    if (!_rl[k].length) delete _rl[k];
  });
  const bfCutoff = Date.now() - 900000;
  Object.keys(_authFails).forEach(k => {
    _authFails[k] = _authFails[k].filter(t => t > bfCutoff);
    if (!_authFails[k].length) delete _authFails[k];
  });
}, 300000);

// ================================================================
// Firebase IDトークン検証
// ================================================================
async function verifyFirebaseToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  if (!token || token.length < 100) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) return null;
    if (payload.iss !== `https://securetoken.google.com/${FB_PROJECT}`) return null;
    if (payload.aud !== FB_PROJECT) return null;
    if (!payload.user_id && !payload.sub) return null;
    return { uid: payload.user_id || payload.sub, email: payload.email || '' };
  } catch (e) {
    console.warn('[Auth] Token error:', e.message);
    return null;
  }
}

// ── 認証ミドルウェア（厳密: AI/メール/管理者用）──
async function requireAuth(req, res, next) {
  if (NODE_ENV === 'development' && !req.headers.authorization) {
    req.user = { uid: 'dev-user', email: 'dev@localhost' };
    return next();
  }
  const ip = req.ip;
  if (!checkBruteForce(ip)) {
    return res.status(429).json({ error: '認証試行が多すぎます。15分後に再試行してください。' });
  }
  const user = await verifyFirebaseToken(req.headers.authorization);
  if (!user) {
    recordAuthFail(ip);
    return res.status(401).json({ error: '認証が必要です' });
  }
  req.user = user;
  next();
}

// ── 認証ミドルウェア（柔軟: Stripe用）──
async function optionalAuth(req, res, next) {
  const user = await verifyFirebaseToken(req.headers.authorization);
  if (user) {
    req.user = user;
  } else {
    req.user = { uid: 'anonymous', email: '' };
  }
  next();
}

// ── 管理者認証ミドルウェア ──
async function requireAdmin(req, res, next) {
  await requireAuth(req, res, () => {
    if (!req.user) return;
    if (ADMIN_EMAILS.length && !ADMIN_EMAILS.includes(req.user.email)) {
      return res.status(403).json({ error: '管理者権限が必要です' });
    }
    next();
  });
}

// ================================================================
// リクエストログ・監視
// ================================================================
const _requestLog = [];
const _stats = {
  startedAt: new Date().toISOString(),
  totalRequests: 0,
  errors: 0,
  endpoints: {},
  payments: { total: 0, success: 0, failed: 0, amount: 0 },
  emails: { total: 0, success: 0, failed: 0 },
  ai: { total: 0, success: 0, failed: 0 }
};

app.use((req, res, next) => {
  const start = Date.now();
  _stats.totalRequests++;
  _stats.endpoints[req.path] = (_stats.endpoints[req.path] || 0) + 1;

  if (req.path !== '/health' && req.path !== '/') {
    console.log(`[${new Date().toISOString().slice(11, 19)}] ${req.method} ${req.path}`);
  }

  // レスポンス完了時にログ記録
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (res.statusCode >= 400) _stats.errors++;
    // 直近1000件のリクエストログを保持
    _requestLog.push({
      t: new Date().toISOString(),
      m: req.method,
      p: req.path,
      s: res.statusCode,
      d: duration,
      ip: req.ip,
      uid: req.user?.uid || null
    });
    if (_requestLog.length > 1000) _requestLog.splice(0, _requestLog.length - 1000);
  });

  next();
});

// ================================================================
// ヘルスチェック（強化版）
// ================================================================
app.get('/health', (req, res) => {
  const uptime = Math.round(process.uptime());
  const mem = process.memoryUsage();
  res.json({
    status: 'ok',
    version: 'v33',
    env: NODE_ENV,
    services: {
      gemini: !!GEMINI_KEY,
      stripe: !!STRIPE_KEY,
      sendgrid: !!SENDGRID_KEY,
      webhook: !!STRIPE_WH_SECRET,
      firestore: !!firestoreDb,
    },
    uptime,
    uptimeFormatted: `${Math.floor(uptime/3600)}h ${Math.floor((uptime%3600)/60)}m`,
    memory: {
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(mem.heapTotal / 1024 / 1024) + 'MB',
      rss: Math.round(mem.rss / 1024 / 1024) + 'MB',
    },
    stats: {
      totalRequests: _stats.totalRequests,
      errors: _stats.errors,
      errorRate: _stats.totalRequests ? ((_stats.errors / _stats.totalRequests) * 100).toFixed(1) + '%' : '0%',
    },
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({ name: '部勝 Backend API', version: 'v33', docs: '/health' });
});

// ================================================================
// 管理者用API
// ================================================================

// サーバー統計
app.get('/api/admin/stats', requireAdmin, (req, res) => {
  res.json({
    ..._stats,
    uptime: Math.round(process.uptime()),
    memory: process.memoryUsage(),
    activeRateLimits: Object.keys(_rl).length,
    blockedIPs: Object.keys(_authFails).filter(ip => (_authFails[ip]||[]).length >= 5).length,
  });
});

// リクエストログ（直近N件）
app.get('/api/admin/logs', requireAdmin, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 100, 1000);
  const logs = _requestLog.slice(-limit);
  res.json({ count: logs.length, total: _requestLog.length, logs });
});

// エンドポイント別アクセスランキング
app.get('/api/admin/endpoints', requireAdmin, (req, res) => {
  const sorted = Object.entries(_stats.endpoints)
    .sort((a, b) => b[1] - a[1])
    .map(([path, count]) => ({ path, count }));
  res.json({ endpoints: sorted });
});

// 決済統計
app.get('/api/admin/payments', requireAdmin, (req, res) => {
  res.json(_stats.payments);
});

// ブロック中IPの確認
app.get('/api/admin/blocked', requireAdmin, (req, res) => {
  const blocked = Object.entries(_authFails)
    .filter(([, times]) => times.length >= 5)
    .map(([ip, times]) => ({
      ip,
      attempts: times.length,
      lastAttempt: new Date(Math.max(...times)).toISOString(),
      unblockAt: new Date(Math.max(...times) + 900000).toISOString()
    }));
  res.json({ count: blocked.length, blocked });
});

// 手動IPブロック解除
app.post('/api/admin/unblock', requireAdmin, (req, res) => {
  const { ip } = req.body;
  if (ip && _authFails[ip]) {
    delete _authFails[ip];
    res.json({ ok: true, message: `${ip} のブロックを解除しました` });
  } else {
    res.json({ ok: false, message: '該当IPが見つかりません' });
  }
});

// ================================================================
// AI チャット（Gemini プロキシ）
// ================================================================
app.post('/api/ai/chat', requireAuth, async (req, res) => {
  const ip = req.ip;
  if (!rateLimit(ip + '_ai', 20, 60000)) {
    return res.status(429).json({ error: 'リクエスト制限に達しました。1分後に再試行してください。' });
  }
  if (!GEMINI_KEY) {
    return res.status(503).json({ error: 'AI機能は現在利用できません。' });
  }

  _stats.ai.total++;
  try {
    const { messages, system, image, maxTokens } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages is required' });
    }
    // 入力サイズ制限
    const totalLen = JSON.stringify(messages).length;
    if (totalLen > 100000) {
      return res.status(400).json({ error: 'リクエストが大きすぎます (max 100KB)' });
    }

    const geminiMessages = [];
    if (system) {
      geminiMessages.push({ role: 'user', parts: [{ text: system }] });
      geminiMessages.push({ role: 'model', parts: [{ text: 'はい、承知しました。' }] });
    }

    messages.forEach(m => {
      const parts = [];
      if (image && m.role === 'user' && m === messages[messages.length - 1]) {
        parts.push({ inlineData: { mimeType: image.mimeType || 'image/jpeg', data: image.data } });
      }
      parts.push({ text: m.content || m.text || '' });
      geminiMessages.push({ role: m.role === 'assistant' ? 'model' : 'user', parts });
    });

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: geminiMessages,
          generationConfig: { maxOutputTokens: maxTokens || 1024, temperature: 0.7 }
        })
      }
    );

    const data = await geminiRes.json();
    if (data.error) {
      console.error('[Gemini] Error:', data.error.message);
      _stats.ai.failed++;
      return res.status(500).json({ error: data.error.message });
    }

    const text = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
    _stats.ai.success++;
    res.json({ text, candidates: data.candidates });

  } catch (e) {
    console.error('[AI] Error:', e.message);
    _stats.ai.failed++;
    res.status(500).json({ error: 'AI処理エラー' });
  }
});

// ================================================================
// Stripe 決済
// ================================================================
let stripe;
if (STRIPE_KEY) {
  stripe = require('stripe')(STRIPE_KEY);
}

function stripeUnavailable(res) {
  return res.status(503).json({ error: 'Stripe決済は現在利用できません。管理者に連絡してください。' });
}

function getOrigin(req) {
  return req.headers.origin || allowedOrigins[0];
}

// 金額バリデーション
function validateAmount(amount) {
  const n = parseInt(amount);
  if (isNaN(n) || n < 100 || n > 10000000) return null; // 100円〜1000万円
  return n;
}

// 手数料率バリデーション（プラットフォーム最低保証: 5%）
const PLATFORM_MIN_FEE_RATE = 5;  // プラットフォーム最低手数料 5%
const PLATFORM_MAX_FEE_RATE = 50; // 最大50%
const PLATFORM_DEFAULT_FEE_RATE = 10; // デフォルト10%

function validateFeeRate(feeRate) {
  const rate = parseFloat(feeRate);
  if (isNaN(rate)) return PLATFORM_DEFAULT_FEE_RATE;
  return Math.max(PLATFORM_MIN_FEE_RATE, Math.min(PLATFORM_MAX_FEE_RATE, rate));
}

// ── 日本向け決済手段設定（クレカ・コンビニ・銀行振込） ──
const JP_PAYMENT_CONFIG = {
  payment_method_types: ['card', 'konbini', 'customer_balance'],
  payment_method_options: {
    konbini: {
      expires_after_days: 3  // コンビニ払い期限: 3日
    },
    customer_balance: {
      funding_type: 'bank_transfer',
      bank_transfer: {
        type: 'jp_bank_transfer'  // 日本の銀行振込
      }
    }
  }
};

// ── 月謝 Checkout ──
async function createTuitionSession(req, res) {
  if (!stripe) return stripeUnavailable(res);
  const ip = req.ip;
  if (!rateLimit(ip + '_pay', 5, 60000)) {
    return res.status(429).json({ error: '決済リクエストが多すぎます。1分後に再試行してください。' });
  }
  try {
    const amount = validateAmount(req.body.amount);
    if (!amount) return res.status(400).json({ error: '金額が不正です (100〜10,000,000円)' });
    const { teamId, playerId, guardianId, month, teamName, playerName, feeRate } = req.body;

    const rate = validateFeeRate(feeRate);
    const platformFee = Math.round(amount * rate / 100);
    const session = await stripe.checkout.sessions.create({
      ...JP_PAYMENT_CONFIG,
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'jpy',
          unit_amount: amount + platformFee,
          product_data: { name: `${teamName || 'チーム'} 月謝 ${month || ''}`.trim() }
        },
        quantity: 1
      }],
      success_url: `${getOrigin(req)}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getOrigin(req)}?payment=cancel`,
      metadata: {
        type: 'monthly_fee', teamId: teamId || '', playerId: playerId || '',
        guardianId: guardianId || '', month: month || '',
        originalAmount: String(amount), platformFee: String(platformFee)
      }
    });
    _stats.payments.total++;
    res.json({ sessionUrl: session.url, url: session.url, sessionId: session.id });
  } catch (e) {
    console.error('[Stripe/Monthly]', e.message);
    res.status(500).json({ error: '決済セッションの作成に失敗しました' });
  }
}
app.post('/create-tuition-session', requireAuth, createTuitionSession);
app.post('/api/stripe/monthly', requireAuth, createTuitionSession);

// ── コーチ代 Checkout ──
async function createCoachSession(req, res) {
  if (!stripe) return stripeUnavailable(res);
  const ip = req.ip;
  if (!rateLimit(ip + '_pay', 5, 60000)) {
    return res.status(429).json({ error: '決済リクエストが多すぎます。1分後に再試行してください。' });
  }
  try {
    const amount = validateAmount(req.body.amount);
    if (!amount) return res.status(400).json({ error: '金額が不正です' });
    const { threadId, month, coachName, coachId, teamId, teamName, feeRate } = req.body;

    const rate = validateFeeRate(feeRate);
    const platformFee = Math.round(amount * rate / 100);
    const session = await stripe.checkout.sessions.create({
      ...JP_PAYMENT_CONFIG,
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'jpy',
          unit_amount: amount + platformFee,
          product_data: { name: `${coachName || 'コーチ'} 指導料 ${month || ''}`.trim() }
        },
        quantity: 1
      }],
      success_url: `${getOrigin(req)}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getOrigin(req)}?payment=cancel`,
      metadata: {
        type: 'coach_fee', threadId: threadId || '', coachId: coachId || '',
        teamId: teamId || '', month: month || '',
        originalAmount: String(amount), platformFee: String(platformFee)
      }
    });
    _stats.payments.total++;
    res.json({ sessionUrl: session.url, url: session.url, sessionId: session.id });
  } catch (e) {
    console.error('[Stripe/Coach]', e.message);
    res.status(500).json({ error: '決済セッションの作成に失敗しました' });
  }
}
app.post('/create-coach-payment-session', requireAuth, createCoachSession);
app.post('/api/stripe/coach', requireAuth, createCoachSession);

// ── 都度請求 Checkout ──
async function createAdhocSession(req, res) {
  if (!stripe) return stripeUnavailable(res);
  const ip = req.ip;
  if (!rateLimit(ip + '_pay', 5, 60000)) {
    return res.status(429).json({ error: '決済リクエストが多すぎます。1分後に再試行してください。' });
  }
  try {
    const amount = validateAmount(req.body.amount);
    if (!amount) return res.status(400).json({ error: '金額が不正です' });
    const { invoiceId, title, teamId, playerId, feeRate } = req.body;

    const rate = validateFeeRate(feeRate);
    const platformFee = Math.round(amount * rate / 100);
    const session = await stripe.checkout.sessions.create({
      ...JP_PAYMENT_CONFIG,
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'jpy',
          unit_amount: amount + platformFee,
          product_data: { name: title || '都度請求' }
        },
        quantity: 1
      }],
      success_url: `${getOrigin(req)}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getOrigin(req)}?payment=cancel`,
      metadata: {
        type: 'adhoc', invoiceId: invoiceId || '', teamId: teamId || '',
        playerId: playerId || '',
        originalAmount: String(amount), platformFee: String(platformFee)
      }
    });
    _stats.payments.total++;
    res.json({ sessionUrl: session.url, url: session.url, sessionId: session.id });
  } catch (e) {
    console.error('[Stripe/Adhoc]', e.message);
    res.status(500).json({ error: '決済セッションの作成に失敗しました' });
  }
}
app.post('/create-adhoc-payment-session', requireAuth, createAdhocSession);
app.post('/api/stripe/adhoc', requireAuth, createAdhocSession);

// ── セッション状態確認 ──
async function getSessionStatus(req, res) {
  if (!stripe) return stripeUnavailable(res);
  try {
    const sessionId = req.params.id;
    // セッションIDのバリデーション
    if (!sessionId || !sessionId.startsWith('cs_')) {
      return res.status(400).json({ error: '無効なセッションIDです' });
    }
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    res.json({ status: session.payment_status, metadata: session.metadata });
  } catch (e) {
    console.error('[Stripe/Session]', e.message);
    res.status(500).json({ error: 'セッション情報の取得に失敗しました' });
  }
}
app.get('/session-status/:id', requireAuth, getSessionStatus);
app.get('/api/stripe/session/:id', requireAuth, getSessionStatus);

// ── Stripe Connect（コーチ口座登録）──
async function createConnectAccount(req, res) {
  if (!stripe) return stripeUnavailable(res);
  const ip = req.ip;
  if (!rateLimit(ip + '_connect', 3, 60000)) {
    return res.status(429).json({ error: '口座作成リクエストが多すぎます。1分後に再試行してください。' });
  }
  try {
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'JP',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true }
      }
    });
    const link = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${getOrigin(req)}?stripe_connect=refresh`,
      return_url: `${getOrigin(req)}?stripe_connect=success`,
      type: 'account_onboarding'
    });
    res.json({ url: link.url, accountId: account.id });
  } catch (e) {
    console.error('[Stripe/Connect]', e.message);
    res.status(500).json({ error: 'Connect口座の作成に失敗しました' });
  }
  }
}
app.post('/create-connect-account', requireAuth, createConnectAccount);
app.post('/api/stripe/connect', requireAuth, createConnectAccount);

// ── Stripe Transfer（コーチへの送金）──
async function createTransfer(req, res) {
  if (!stripe) return stripeUnavailable(res);
  try {
    const { amount, connectedAccountId, coachId, teamId, month, description } = req.body;
    const n = parseInt(amount);
    if (!n || n < 100) return res.status(400).json({ error: '送金額は100円以上が必要です' });
    if (!connectedAccountId || !connectedAccountId.startsWith('acct_')) {
      return res.status(400).json({ error: '有効なStripe Connect口座IDが必要です' });
    }

    // Connect口座の状態確認
    const account = await stripe.accounts.retrieve(connectedAccountId);
    if (!account.charges_enabled || !account.payouts_enabled) {
      return res.status(400).json({ error: 'コーチの口座設定が完了していません。銀行口座の登録・本人確認を完了してください。' });
    }

    const transfer = await stripe.transfers.create({
      amount: n,
      currency: 'jpy',
      destination: connectedAccountId,
      description: description || `部勝 コーチ報酬 ${month || ''}`.trim(),
      metadata: { coachId: coachId || '', teamId: teamId || '', month: month || '' }
    });

    // Firestoreに送金記録
    if (firestoreDb) {
      await firestoreDb.collection('transfers').doc(transfer.id).set({
        transferId: transfer.id,
        amount: n,
        coachId: coachId || '',
        teamId: teamId || '',
        connectedAccountId,
        month: month || '',
        status: 'completed',
        createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp()
      });
    }

    console.log(`[Stripe/Transfer] ¥${n} → ${connectedAccountId}`);
    res.json({ transferId: transfer.id, amount: n, status: 'completed' });
  } catch (e) {
    console.error('[Stripe/Transfer]', e.message);
    res.status(500).json({ error: '送金処理に失敗しました' });
  }
}
app.post('/api/stripe/transfer', requireAdmin, createTransfer);

// ── Stripe Connect口座ステータス確認 ──
app.get('/api/stripe/account-status/:accountId', requireAuth, async (req, res) => {
  if (!stripe) return stripeUnavailable(res);
  try {
    const { accountId } = req.params;
    if (!accountId || !accountId.startsWith('acct_')) {
      return res.status(400).json({ error: '無効な口座IDです' });
    }
    const account = await stripe.accounts.retrieve(accountId);
    res.json({
      accountId: account.id,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
      country: account.country,
      default_currency: account.default_currency
    });
  } catch (e) {
    console.error('[Stripe/AccountStatus]', e.message);
    res.status(500).json({ error: '口座情報の取得に失敗しました' });
  }
});

// ── Stripe 返金 ──
async function createRefund(req, res) {
  if (!stripe) return stripeUnavailable(res);
  try {
    const { sessionId, reason } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'sessionIdが必要です' });

    // セッションからPaymentIntentを取得
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session.payment_intent) {
      return res.status(400).json({ error: 'この決済は返金できません（PaymentIntentなし）' });
    }

    const refund = await stripe.refunds.create({
      payment_intent: session.payment_intent,
      reason: reason || 'requested_by_customer'
    });

    // Firestoreに返金記録
    if (firestoreDb) {
      await firestoreDb.collection('refunds').doc(refund.id).set({
        refundId: refund.id,
        sessionId,
        paymentIntentId: session.payment_intent,
        amount: refund.amount,
        status: refund.status,
        reason: reason || 'requested_by_customer',
        metadata: session.metadata || {},
        createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp()
      });
      // payments コレクションのステータスも更新
      await firestoreDb.collection('payments').doc(sessionId).update({
        status: 'refunded',
        refundId: refund.id,
        updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp()
      }).catch(() => {});
    }

    console.log(`[Stripe/Refund] ${refund.id} ¥${refund.amount}`);
    res.json({ refundId: refund.id, amount: refund.amount, status: refund.status });
  } catch (e) {
    console.error('[Stripe/Refund]', e.message);
    res.status(500).json({ error: '返金処理に失敗しました' });
  }
}
app.post('/api/stripe/refund', requireAdmin, createRefund);

// ── Webhook（Stripe → サーバー）──
function handleWebhook(req, res) {
  let event;
  try {
    if (STRIPE_WH_SECRET && stripe) {
      const sig = req.headers['stripe-signature'];
      event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WH_SECRET);
    } else {
      event = JSON.parse(req.body.toString());
    }
  } catch (e) {
    console.error('[Webhook] 署名検証失敗:', e.message);
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  console.log(`[Webhook] ${event.type} (${event.id})`);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const meta = session.metadata || {};
      const paymentMethod = session.payment_method_types?.[0] || 'card';
      console.log('[Webhook] 決済セッション完了:', {
        type: meta.type,
        amount: session.amount_total,
        payment_status: session.payment_status,
        payment_method: paymentMethod
      });

      if (session.payment_status === 'paid') {
        // クレカ等の即時決済 → 完了処理
        _stats.payments.success++;
        _stats.payments.amount += (session.amount_total || 0);
        _writePaymentToFirestore(meta, session, 'card').catch(e =>
          console.error('[Webhook] Firestore書込み失敗:', e.message)
        );
        if (SENDGRID_KEY && meta.type) {
          _sendPaymentNotification(meta, session.amount_total, 'card').catch(e =>
            console.error('[Webhook] 通知メール送信失敗:', e.message)
          );
        }
      } else if (session.payment_status === 'unpaid') {
        // コンビニ・銀行振込 → 入金待ち
        console.log('[Webhook] 非同期決済: 入金待ち (' + paymentMethod + ')');
        _writePaymentToFirestore(meta, session, paymentMethod, 'pending').catch(e =>
          console.error('[Webhook] Firestore書込み失敗:', e.message)
        );
      }
      break;
    }
    case 'checkout.session.async_payment_succeeded': {
      // コンビニ払い・銀行振込の入金完了
      const session = event.data.object;
      const meta = session.metadata || {};
      const methodLabel = (session.payment_method_types || []).includes('konbini') ? 'konbini' : 'bank_transfer';
      console.log('[Webhook] 非同期決済 入金完了:', {
        type: meta.type, amount: session.amount_total, method: methodLabel
      });
      _stats.payments.success++;
      _stats.payments.amount += (session.amount_total || 0);
      _writePaymentToFirestore(meta, session, methodLabel).catch(e =>
        console.error('[Webhook] Firestore書込み失敗:', e.message)
      );
      if (SENDGRID_KEY && meta.type) {
        const label = methodLabel === 'konbini' ? 'コンビニ' : '銀行振込';
        _sendPaymentNotification(meta, session.amount_total, label).catch(e =>
          console.error('[Webhook] 通知メール送信失敗:', e.message)
        );
      }
      break;
    }
    case 'checkout.session.async_payment_failed': {
      const session = event.data.object;
      const meta = session.metadata || {};
      console.log('[Webhook] 非同期決済 失敗/期限切れ:', {
        type: meta.type, amount: session.amount_total
      });
      _stats.payments.failed++;
      _writePaymentToFirestore(meta, session, 'async', 'failed').catch(e =>
        console.error('[Webhook] Firestore書込み失敗:', e.message)
      );
      break;
    }
    case 'checkout.session.expired': {
      console.log('[Webhook] セッション期限切れ:', event.data.object.id);
      break;
    }
    case 'payment_intent.payment_failed': {
      const pi = event.data.object;
      console.log('[Webhook] 決済失敗:', pi.id, pi.last_payment_error?.message);
      _stats.payments.failed++;
      break;
    }
    default:
      console.log('[Webhook] Unhandled:', event.type);
  }

  res.json({ received: true });
}

// ── Webhook → Firestore 書込み ──
async function _writePaymentToFirestore(meta, session, method, overrideStatus) {
  if (!firestoreDb) {
    console.log('[Firestore] Admin SDK未初期化 → スキップ');
    return;
  }
  const status = overrideStatus || 'paid';
  const record = {
    stripeSessionId: session.id,
    type: meta.type || 'unknown',
    amount: Number(meta.originalAmount) || 0,
    platformFee: Number(meta.platformFee) || 0,
    totalCharged: session.amount_total || 0,
    method: method || 'card',
    status,
    teamId: meta.teamId || '',
    playerId: meta.playerId || '',
    guardianId: meta.guardianId || '',
    coachId: meta.coachId || '',
    month: meta.month || '',
    invoiceId: meta.invoiceId || '',
    threadId: meta.threadId || '',
    createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp()
  };

  // payments コレクションに書込み
  await firestoreDb.collection('payments').doc(session.id).set(record, { merge: true });
  console.log(`[Firestore] 決済記録書込み: ${session.id} (${meta.type}, ${status})`);
}

// 決済完了通知メール
async function _sendPaymentNotification(meta, amount, method) {
  if (!SENDGRID_KEY) return;
  const typeLabel = { monthly_fee: '月謝', coach_fee: 'コーチ指導料', adhoc: '都度請求' };
  const methodLabel = method || 'カード';
  const subject = `【部勝】${typeLabel[meta.type] || '決済'}が完了しました（${methodLabel}）`;
  const body = `
    <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px">
      <h2 style="color:#0ea5e9">💳 決済完了のお知らせ</h2>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666">種別</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">${typeLabel[meta.type] || meta.type}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666">金額</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">¥${(amount||0).toLocaleString()}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666">決済方法</td><td style="padding:8px;border-bottom:1px solid #eee">${methodLabel}</td></tr>
        ${meta.month ? `<tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666">対象月</td><td style="padding:8px;border-bottom:1px solid #eee">${meta.month}</td></tr>` : ''}
      </table>
      <p style="color:#666;font-size:12px">このメールは自動送信です。部勝（ブカツ）プラットフォーム</p>
    </div>`;

  // 管理者に通知
  for (const email of ADMIN_EMAILS) {
    await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SENDGRID_KEY}` },
      body: JSON.stringify({
        personalizations: [{ to: [{ email }] }],
        from: { email: 'noreply@bukatsu.app', name: '部勝（ブカツ）' },
        subject,
        content: [{ type: 'text/html', value: body }]
      })
    });
  }
}

// ================================================================
// メール送信（SendGrid）
// ================================================================
app.post('/api/email/send', requireAuth, async (req, res) => {
  if (!SENDGRID_KEY) return res.status(503).json({ error: 'メール機能未設定' });

  const ip = req.ip;
  if (!rateLimit(ip + '_email', 10, 60000)) {
    return res.status(429).json({ error: 'メール送信制限に達しました' });
  }

  _stats.emails.total++;
  try {
    const { to, toName, subject, body } = req.body;
    if (!to || !subject) return res.status(400).json({ error: 'to, subject は必須です' });
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
      return res.status(400).json({ error: 'メールアドレスが不正です' });
    }
    // subject/body長さ制限
    if (subject.length > 200) return res.status(400).json({ error: '件名が長すぎます' });
    if (body && body.length > 50000) return res.status(400).json({ error: '本文が大きすぎます' });

    const sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SENDGRID_KEY}`
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to, name: toName || '' }] }],
        from: { email: 'noreply@bukatsu.app', name: '部勝（ブカツ）' },
        subject,
        content: [{ type: 'text/html', value: body }]
      })
    });

    if (sgRes.ok || sgRes.status === 202) {
      _stats.emails.success++;
      res.json({ ok: true });
    } else {
      const err = await sgRes.text();
      console.error('[SendGrid] Error:', err);
      _stats.emails.failed++;
      res.status(500).json({ error: 'メール送信失敗' });
    }
  } catch (e) {
    console.error('[Email] Error:', e.message);
    _stats.emails.failed++;
    res.status(500).json({ error: 'メール処理に失敗しました' });
  }
});

// ================================================================
// メールテンプレート（定型メール送信）
// ================================================================
const EMAIL_TEMPLATES = {
  payment_reminder: {
    subject: '【部勝】月謝のお支払いのお願い',
    body: (data) => `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px">
        <h2 style="color:#0ea5e9">📋 月謝のお支払いのお願い</h2>
        <p>${data.playerName || '保護者'}様</p>
        <p>${data.teamName || 'チーム'}の${data.month || '今月'}分の月謝（¥${(data.amount||0).toLocaleString()}）のお支払いがまだ確認できておりません。</p>
        <p>お手数ですが、アプリからお支払いをお願いいたします。</p>
        <p style="color:#666;font-size:12px;margin-top:24px">部勝（ブカツ）プラットフォーム</p>
      </div>`
  },
  welcome: {
    subject: '【部勝】ようこそ！登録が完了しました',
    body: (data) => `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px">
        <h2 style="color:#0ea5e9">🎉 ようこそ！</h2>
        <p>${data.name || 'ユーザー'}様</p>
        <p>部勝（ブカツ）への登録が完了しました。</p>
        <p>ロール: <strong>${data.role || '未設定'}</strong></p>
        <p>アプリにログインして、チーム運営を始めましょう！</p>
        <p style="color:#666;font-size:12px;margin-top:24px">部勝（ブカツ）プラットフォーム</p>
      </div>`
  },
  event_reminder: {
    subject: '【部勝】イベントのお知らせ',
    body: (data) => `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px">
        <h2 style="color:#0ea5e9">📅 イベントのお知らせ</h2>
        <p>${data.teamName || 'チーム'}のイベントが予定されています。</p>
        <p><strong>${data.eventTitle || 'イベント'}</strong></p>
        <p>日時: ${data.date || '未定'}</p>
        <p>場所: ${data.location || '未定'}</p>
        <p style="color:#666;font-size:12px;margin-top:24px">部勝（ブカツ）プラットフォーム</p>
      </div>`
  }
};

app.post('/api/email/template', requireAuth, async (req, res) => {
  if (!SENDGRID_KEY) return res.status(503).json({ error: 'メール機能未設定' });

  const ip = req.ip;
  if (!rateLimit(ip + '_email', 10, 60000)) {
    return res.status(429).json({ error: 'メール送信制限に達しました' });
  }

  try {
    const { to, toName, template, data } = req.body;
    if (!to || !template) return res.status(400).json({ error: 'to, template は必須です' });
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
      return res.status(400).json({ error: 'メールアドレスが不正です' });
    }

    const tmpl = EMAIL_TEMPLATES[template];
    if (!tmpl) return res.status(400).json({ error: `不明なテンプレート: ${template}`, available: Object.keys(EMAIL_TEMPLATES) });

    const sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SENDGRID_KEY}` },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to, name: toName || '' }] }],
        from: { email: 'noreply@bukatsu.app', name: '部勝（ブカツ）' },
        subject: tmpl.subject,
        content: [{ type: 'text/html', value: tmpl.body(data || {}) }]
      })
    });

    if (sgRes.ok || sgRes.status === 202) {
      _stats.emails.success++;
      res.json({ ok: true, template });
    } else {
      _stats.emails.failed++;
      res.status(500).json({ error: 'メール送信失敗' });
    }
  } catch (e) {
    _stats.emails.failed++;
    res.status(500).json({ error: 'メールテンプレート送信に失敗しました' });
  }
});

// ================================================================
// 定期タスク（Cron的処理）
// ================================================================

// Render無料プランのスリープ防止（14分ごとに自己ping）
if (NODE_ENV === 'production') {
  setInterval(async () => {
    try {
      await fetch(`https://bukatsu-backend.onrender.com/health`);
      console.log('[KeepAlive] ping ok');
    } catch (e) {
      console.warn('[KeepAlive] ping failed:', e.message);
    }
  }, 14 * 60 * 1000); // 14分
}

// 毎時の統計ログ出力
setInterval(() => {
  const mem = process.memoryUsage();
  console.log(`[Stats] Reqs:${_stats.totalRequests} Errs:${_stats.errors} Heap:${Math.round(mem.heapUsed/1024/1024)}MB Pay:${_stats.payments.success}/${_stats.payments.total} AI:${_stats.ai.success}/${_stats.ai.total}`);
}, 3600000); // 1時間

// ================================================================
// API バージョニング・ドキュメント
// ================================================================
app.get('/api/v1/docs', (req, res) => {
  res.json({
    version: 'v33',
    endpoints: {
      health: { method: 'GET', path: '/health', auth: false, desc: 'サーバー状態確認' },
      ai_chat: { method: 'POST', path: '/api/ai/chat', auth: 'required', desc: 'AI会話 (Gemini)' },
      stripe_monthly: { method: 'POST', path: '/create-tuition-session', auth: 'optional', desc: '月謝決済セッション作成' },
      stripe_coach: { method: 'POST', path: '/create-coach-payment-session', auth: 'optional', desc: 'コーチ代決済セッション作成' },
      stripe_adhoc: { method: 'POST', path: '/create-adhoc-payment-session', auth: 'optional', desc: '都度請求決済セッション作成' },
      stripe_status: { method: 'GET', path: '/session-status/:id', auth: 'optional', desc: '決済セッション状態確認' },
      stripe_connect: { method: 'POST', path: '/create-connect-account', auth: 'optional', desc: 'Stripe Connect口座作成' },
      email_send: { method: 'POST', path: '/api/email/send', auth: 'required', desc: 'メール送信' },
      email_template: { method: 'POST', path: '/api/email/template', auth: 'required', desc: 'テンプレートメール送信' },
      webhook: { method: 'POST', path: '/api/webhook', auth: 'stripe', desc: 'Stripe Webhook' },
      admin_stats: { method: 'GET', path: '/api/admin/stats', auth: 'admin', desc: 'サーバー統計' },
      admin_logs: { method: 'GET', path: '/api/admin/logs', auth: 'admin', desc: 'リクエストログ' },
      admin_endpoints: { method: 'GET', path: '/api/admin/endpoints', auth: 'admin', desc: 'エンドポイント統計' },
      admin_payments: { method: 'GET', path: '/api/admin/payments', auth: 'admin', desc: '決済統計' },
      admin_blocked: { method: 'GET', path: '/api/admin/blocked', auth: 'admin', desc: 'ブロックIP一覧' },
      admin_unblock: { method: 'POST', path: '/api/admin/unblock', auth: 'admin', desc: 'IPブロック解除' },
    }
  });
});

// ── 404ハンドラー ──
app.use((req, res) => {
  res.status(404).json({ error: 'エンドポイントが見つかりません', path: req.path, docs: '/api/v1/docs' });
});

// ── エラーハンドラー ──
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  _stats.errors++;
  if (err.message?.includes('CORS')) {
    return res.status(403).json({ error: 'CORS: このオリジンからのアクセスは許可されていません' });
  }
  res.status(500).json({ error: 'サーバーエラー' });
});

// ── 未処理例外のキャッチ ──
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err.message);
  _stats.errors++;
});
process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled Rejection:', reason);
  _stats.errors++;
});

// ── 起動 ──
app.listen(PORT, () => {
  console.log(`🚀 起動完了 port:${PORT} env:${NODE_ENV}`);
  console.log(`   Gemini:${GEMINI_KEY ? '✅' : '❌'} Stripe:${STRIPE_KEY ? '✅' : '❌'} SendGrid:${SENDGRID_KEY ? '✅' : '❌'} Webhook:${STRIPE_WH_SECRET ? '✅' : '❌'}`);
  console.log(`   Admin: ${ADMIN_EMAILS.length ? ADMIN_EMAILS.join(', ') : '未設定'}`);
  console.log(`   Origins: ${allowedOrigins.join(', ')}`);
  console.log(`   Endpoints: ${Object.keys(app._router?.stack?.filter(r => r.route) || []).length || 'N/A'} routes`);
});
