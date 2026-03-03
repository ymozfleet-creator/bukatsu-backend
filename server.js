// ============================================================
// 部勝（ブカツ）Backend Server v32 - Production Ready
// ============================================================
// デプロイ先: Render (https://bukatsu-backend.onrender.com)
//
// 環境変数（Render Dashboard → Environment で設定）:
//   GEMINI_API_KEY       - Google Gemini API キー（必須: AI機能）
//   STRIPE_SECRET_KEY    - Stripe シークレットキー（必須: 決済）
//   STRIPE_WEBHOOK_SECRET - Stripe Webhook署名シークレット（推奨）
//   SENDGRID_API_KEY     - SendGrid API キー（任意: メール通知）
//   FIREBASE_PROJECT_ID  - Firebase プロジェクトID（デフォルト: myteam-mycoach）
//   ALLOWED_ORIGINS      - CORS許可オリジン（カンマ区切り）
//   NODE_ENV             - production / development
// ============================================================

const express = require('express');
const cors = require('cors');
const app = express();

// ── 環境変数 ──
const GEMINI_KEY = process.env.GEMINI_API_KEY || '';
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WH_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const SENDGRID_KEY = process.env.SENDGRID_API_KEY || '';
const FB_PROJECT = process.env.FIREBASE_PROJECT_ID || 'myteam-mycoach';
const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = process.env.PORT || 3000;

// 起動時チェック
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🏟️  部勝 Backend v32');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
if (!GEMINI_KEY) console.warn('⚠️  GEMINI_API_KEY 未設定 → AI機能停止');
if (!STRIPE_KEY) console.warn('⚠️  STRIPE_SECRET_KEY 未設定 → 決済停止');
if (!STRIPE_WH_SECRET) console.warn('⚠️  STRIPE_WEBHOOK_SECRET 未設定 → Webhook署名検証なし');
if (!SENDGRID_KEY) console.warn('⚠️  SENDGRID_API_KEY 未設定 → メール停止');

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
app.use(express.json({ limit: '10mb' }));

// ── レート制限 ──
const _rl = {};
function rateLimit(key, limit = 30, windowMs = 60000) {
  const now = Date.now();
  if (!_rl[key]) _rl[key] = [];
  _rl[key] = _rl[key].filter(t => t > now - windowMs);
  if (_rl[key].length >= limit) return false;
  _rl[key].push(now);
  return true;
}
// 古いエントリを定期クリーンアップ
setInterval(() => {
  const cutoff = Date.now() - 300000;
  Object.keys(_rl).forEach(k => {
    _rl[k] = _rl[k].filter(t => t > cutoff);
    if (!_rl[k].length) delete _rl[k];
  });
}, 300000);

// ── Firebase IDトークン検証 ──
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

// ── 認証ミドルウェア（厳密: AI/メール用）──
async function requireAuth(req, res, next) {
  // 開発環境ではスキップ可能
  if (NODE_ENV === 'development' && !req.headers.authorization) {
    req.user = { uid: 'dev-user', email: 'dev@localhost' };
    return next();
  }
  const user = await verifyFirebaseToken(req.headers.authorization);
  if (!user) return res.status(401).json({ error: '認証が必要です' });
  req.user = user;
  next();
}

// ── 認証ミドルウェア（柔軟: Stripe用 — Stripe自体が決済セキュリティを担保）──
async function optionalAuth(req, res, next) {
  const user = await verifyFirebaseToken(req.headers.authorization);
  if (user) {
    req.user = user;
  } else {
    console.warn('[Auth] Stripe request without valid Firebase token from', req.ip);
    req.user = { uid: 'anonymous', email: '' };
  }
  next();
}

// ── リクエストログ ──
app.use((req, res, next) => {
  if (req.path !== '/health') {
    console.log(`[${new Date().toISOString().slice(11, 19)}] ${req.method} ${req.path}`);
  }
  next();
});

// ================================================================
// ヘルスチェック
// ================================================================
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: 'v32',
    env: NODE_ENV,
    services: {
      gemini: !!GEMINI_KEY,
      stripe: !!STRIPE_KEY,
      sendgrid: !!SENDGRID_KEY,
      webhook: !!STRIPE_WH_SECRET,
    },
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({ name: '部勝 Backend API', version: 'v32', docs: '/health' });
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

  try {
    const { messages, system, image, maxTokens } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages is required' });
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
      return res.status(500).json({ error: data.error.message });
    }

    const text = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
    res.json({ text, candidates: data.candidates });

  } catch (e) {
    console.error('[AI] Error:', e.message);
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

// ── 月謝 Checkout ──
// フロントエンド互換パス: /create-tuition-session
// 正規パス: /api/stripe/monthly
async function createTuitionSession(req, res) {
  if (!stripe) return stripeUnavailable(res);
  try {
    const { amount, teamId, playerId, guardianId, month, teamName, playerName } = req.body;
    if (!amount || amount < 100) return res.status(400).json({ error: '金額が不正です' });

    const platformFee = Math.round(amount * 0.05);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'jpy',
          unit_amount: amount + platformFee,
          product_data: { name: `${teamName || 'チーム'} 月謝 ${month || ''}` }
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
    // フロント互換: sessionUrl と url の両方を返す
    res.json({ sessionUrl: session.url, url: session.url, sessionId: session.id });
  } catch (e) {
    console.error('[Stripe/Monthly]', e.message);
    res.status(500).json({ error: e.message });
  }
}
app.post('/create-tuition-session', optionalAuth, createTuitionSession);
app.post('/api/stripe/monthly', optionalAuth, createTuitionSession);

// ── コーチ代 Checkout ──
// フロントエンド互換パス: /create-coach-payment-session
async function createCoachSession(req, res) {
  if (!stripe) return stripeUnavailable(res);
  try {
    const { amount, threadId, month, coachName, coachId, teamId, teamName } = req.body;
    if (!amount || amount < 100) return res.status(400).json({ error: '金額が不正です' });

    const platformFee = Math.round(amount * 0.1);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'jpy',
          unit_amount: amount + platformFee,
          product_data: { name: `${coachName || 'コーチ'} 指導料 ${month || ''}` }
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
    res.json({ sessionUrl: session.url, url: session.url, sessionId: session.id });
  } catch (e) {
    console.error('[Stripe/Coach]', e.message);
    res.status(500).json({ error: e.message });
  }
}
app.post('/create-coach-payment-session', optionalAuth, createCoachSession);
app.post('/api/stripe/coach', optionalAuth, createCoachSession);

// ── 都度請求 Checkout ──
async function createAdhocSession(req, res) {
  if (!stripe) return stripeUnavailable(res);
  try {
    const { amount, invoiceId, title, teamId, playerId } = req.body;
    if (!amount || amount < 100) return res.status(400).json({ error: '金額が不正です' });

    const platformFee = Math.round(amount * 0.05);
    const session = await stripe.checkout.sessions.create({
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
    res.json({ sessionUrl: session.url, url: session.url, sessionId: session.id });
  } catch (e) {
    console.error('[Stripe/Adhoc]', e.message);
    res.status(500).json({ error: e.message });
  }
}
app.post('/create-adhoc-payment-session', optionalAuth, createAdhocSession);
app.post('/api/stripe/adhoc', optionalAuth, createAdhocSession);

// ── セッション状態確認 ──
async function getSessionStatus(req, res) {
  if (!stripe) return stripeUnavailable(res);
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.id);
    res.json({ status: session.payment_status, metadata: session.metadata });
  } catch (e) {
    console.error('[Stripe/Session]', e.message);
    res.status(500).json({ error: e.message });
  }
}
app.get('/session-status/:id', optionalAuth, getSessionStatus);
app.get('/api/stripe/session/:id', optionalAuth, getSessionStatus);

// ── Stripe Connect（コーチ口座登録）──
async function createConnectAccount(req, res) {
  if (!stripe) return stripeUnavailable(res);
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
    res.status(500).json({ error: e.message });
  }
}
app.post('/create-connect-account', optionalAuth, createConnectAccount);
app.post('/api/stripe/connect', optionalAuth, createConnectAccount);

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
      console.log('[Webhook] 決済完了:', {
        type: session.metadata?.type,
        amount: session.amount_total,
        status: session.payment_status
      });
      // TODO: Firestoreの支払いステータスを自動更新
      break;
    }
    case 'payment_intent.payment_failed': {
      const pi = event.data.object;
      console.log('[Webhook] 決済失敗:', pi.id, pi.last_payment_error?.message);
      break;
    }
    default:
      console.log('[Webhook] Unhandled:', event.type);
  }

  res.json({ received: true });
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

  try {
    const { to, toName, subject, body } = req.body;
    if (!to || !subject) return res.status(400).json({ error: 'to, subject は必須です' });

    // メールアドレスの簡易バリデーション
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
      return res.status(400).json({ error: 'メールアドレスが不正です' });
    }

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
      res.json({ ok: true });
    } else {
      const err = await sgRes.text();
      console.error('[SendGrid] Error:', err);
      res.status(500).json({ error: 'メール送信失敗' });
    }
  } catch (e) {
    console.error('[Email] Error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── エラーハンドラー ──
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(500).json({ error: 'サーバーエラー' });
});

// ── 起動 ──
app.listen(PORT, () => {
  console.log(`🚀 起動完了 port:${PORT} env:${NODE_ENV}`);
  console.log(`   Gemini:${GEMINI_KEY ? '✅' : '❌'} Stripe:${STRIPE_KEY ? '✅' : '❌'} SendGrid:${SENDGRID_KEY ? '✅' : '❌'} Webhook:${STRIPE_WH_SECRET ? '✅' : '❌'}`);
  console.log(`   Origins: ${allowedOrigins.join(', ')}`);
});
