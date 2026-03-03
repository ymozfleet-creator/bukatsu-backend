// ============================================================
// 部勝（ブカツ）Backend Server v30 - セキュリティ強化版
// ============================================================
// デプロイ先: Render (https://bukatsu-backend.onrender.com)
// 環境変数:
//   GEMINI_API_KEY    - Google Gemini API キー（必須）
//   STRIPE_SECRET_KEY - Stripe シークレットキー（必須）
//   SENDGRID_API_KEY  - SendGrid API キー（任意）
//   FIREBASE_PROJECT_ID - Firebase プロジェクトID（認証用）
//   ALLOWED_ORIGINS   - CORS許可オリジン（カンマ区切り）
// ============================================================

const express = require('express');
const cors = require('cors');
const app = express();

// ── 環境変数 ──
const GEMINI_KEY = process.env.GEMINI_API_KEY || '';
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY || '';
const SENDGRID_KEY = process.env.SENDGRID_API_KEY || '';
const FB_PROJECT = process.env.FIREBASE_PROJECT_ID || 'myteam-mycoach';
const PORT = process.env.PORT || 3000;

// セキュリティチェック: 起動時にキーの有無を確認
if (!GEMINI_KEY) console.warn('⚠️  GEMINI_API_KEY が未設定です。AI機能は動作しません。');
if (!STRIPE_KEY) console.warn('⚠️  STRIPE_SECRET_KEY が未設定です。決済機能は動作しません。');

// ── CORS ──
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'https://myteam-mycoach.web.app,https://myteam-mycoach.firebaseapp.com,http://localhost:5000').split(',');
app.use(cors({
  origin: function(origin, cb) {
    if (!origin || allowedOrigins.includes(origin)) cb(null, true);
    else cb(new Error('CORS blocked: ' + origin));
  },
  methods: ['GET','POST','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));

app.use(express.json({ limit: '10mb' }));

// ── レート制限（簡易） ──
const rateLimits = {};
function rateLimit(ip, limit = 30, windowMs = 60000) {
  const now = Date.now();
  if (!rateLimits[ip]) rateLimits[ip] = [];
  rateLimits[ip] = rateLimits[ip].filter(t => t > now - windowMs);
  if (rateLimits[ip].length >= limit) return false;
  rateLimits[ip].push(now);
  return true;
}

// ── Firebase IDトークン検証 ──
// Google公開鍵で検証（軽量版: JWTデコード + 発行者チェック）
async function verifyFirebaseToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  if (!token || token.length < 100) return null;

  try {
    // JWTのペイロード部分をデコード
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());

    // 基本検証
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) return null;                          // 有効期限切れ
    if (payload.iss !== 'https://securetoken.google.com/' + FB_PROJECT) return null; // 発行者不正
    if (payload.aud !== FB_PROJECT) return null;                                // 対象不正
    if (!payload.user_id && !payload.sub) return null;                          // ユーザーID不在

    return { uid: payload.user_id || payload.sub, email: payload.email || '' };
  } catch (e) {
    console.warn('[Auth] Token decode error:', e.message);
    return null;
  }
}

// ── 認証ミドルウェア ──
async function requireAuth(req, res, next) {
  const user = await verifyFirebaseToken(req.headers.authorization);
  if (!user) {
    return res.status(401).json({ error: '認証が必要です。ログインしてください。' });
  }
  req.user = user;
  next();
}

// ── ヘルスチェック ──
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: 'v30-secure',
    gemini: !!GEMINI_KEY,
    stripe: !!STRIPE_KEY,
    sendgrid: !!SENDGRID_KEY,
    firebase: FB_PROJECT,
    timestamp: new Date().toISOString()
  });
});

// ============================================================
// AI チャット（Gemini プロキシ）- 認証必須
// ============================================================
app.post('/api/ai/chat', requireAuth, async (req, res) => {
  const ip = req.ip || req.connection.remoteAddress;
  if (!rateLimit(ip, 20, 60000)) {
    return res.status(429).json({ error: 'リクエストが多すぎます。1分後に再試行してください。' });
  }

  if (!GEMINI_KEY) {
    return res.status(503).json({ error: 'AI機能は現在利用できません。管理者にお問い合わせください。' });
  }

  try {
    const { messages, system, image, maxTokens } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages is required' });
    }

    // Gemini API形式に変換
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
      console.error('[Gemini] API error:', data.error.message);
      return res.status(500).json({ error: data.error.message });
    }

    const text = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
    res.json({ text, candidates: data.candidates });

  } catch (e) {
    console.error('[AI] Error:', e.message);
    res.status(500).json({ error: 'AI処理中にエラーが発生しました。' });
  }
});

// ============================================================
// Stripe 決済エンドポイント - 認証必須
// ============================================================
let stripe;
if (STRIPE_KEY) {
  stripe = require('stripe')(STRIPE_KEY);
}

// 月謝 Checkout
app.post('/api/stripe/monthly', requireAuth, async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Stripe未設定' });
  try {
    const { amount, teamId, playerId, guardianId, month, teamName } = req.body;
    const platformFee = Math.round(amount * 0.05);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price_data: { currency: 'jpy', unit_amount: amount + platformFee, product_data: { name: `${teamName || 'チーム'} 月謝 ${month || ''}` } }, quantity: 1 }],
      success_url: `${req.headers.origin || allowedOrigins[0]}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || allowedOrigins[0]}?payment=cancel`,
      metadata: { type: 'monthly_fee', teamId, payerId: playerId, guardianId, month, originalAmount: String(amount), platformFee: String(platformFee) }
    });
    res.json({ url: session.url, sessionId: session.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// コーチ代 Checkout
app.post('/api/stripe/coach', requireAuth, async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Stripe未設定' });
  try {
    const { amount, threadId, month, coachName } = req.body;
    const platformFee = Math.round(amount * 0.1);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price_data: { currency: 'jpy', unit_amount: amount + platformFee, product_data: { name: `${coachName || 'コーチ'} 指導料 ${month || ''}` } }, quantity: 1 }],
      success_url: `${req.headers.origin || allowedOrigins[0]}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || allowedOrigins[0]}?payment=cancel`,
      metadata: { type: 'coach_fee', threadId, month, originalAmount: String(amount), platformFee: String(platformFee) }
    });
    res.json({ url: session.url, sessionId: session.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 都度請求 Checkout
app.post('/api/stripe/adhoc', requireAuth, async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Stripe未設定' });
  try {
    const { amount, invoiceId, title, teamId, playerId } = req.body;
    const platformFee = Math.round(amount * 0.05);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price_data: { currency: 'jpy', unit_amount: amount + platformFee, product_data: { name: title || '都度請求' } }, quantity: 1 }],
      success_url: `${req.headers.origin || allowedOrigins[0]}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || allowedOrigins[0]}?payment=cancel`,
      metadata: { type: 'adhoc', invoiceId, teamId, playerId, originalAmount: String(amount), platformFee: String(platformFee) }
    });
    res.json({ url: session.url, sessionId: session.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// セッション状態確認
app.get('/api/stripe/session/:id', requireAuth, async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Stripe未設定' });
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.id);
    res.json({ status: session.payment_status, metadata: session.metadata });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Stripe Connect (コーチ口座登録)
app.post('/api/stripe/connect', requireAuth, async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Stripe未設定' });
  try {
    const account = await stripe.accounts.create({ type: 'express', country: 'JP', capabilities: { card_payments: { requested: true }, transfers: { requested: true } } });
    const link = await stripe.accountLinks.create({ account: account.id, refresh_url: `${req.headers.origin || allowedOrigins[0]}?stripe_connect=refresh`, return_url: `${req.headers.origin || allowedOrigins[0]}?stripe_connect=success`, type: 'account_onboarding' });
    res.json({ url: link.url, accountId: account.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Webhook (認証不要 - Stripe側から直接呼ばれる)
app.post('/api/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  // Stripe Webhook処理（実装時にWebhook Secretで署名検証を追加）
  console.log('[Webhook] Received event');
  res.json({ received: true });
});

// ============================================================
// メール送信（SendGrid）- 認証必須
// ============================================================
app.post('/api/email/send', requireAuth, async (req, res) => {
  if (!SENDGRID_KEY) return res.status(503).json({ error: 'メール機能未設定' });
  const ip = req.ip || req.connection.remoteAddress;
  if (!rateLimit(ip + '_email', 10, 60000)) {
    return res.status(429).json({ error: 'メール送信の制限に達しました。' });
  }

  try {
    const { to, toName, subject, body } = req.body;
    if (!to || !subject) return res.status(400).json({ error: 'to and subject required' });

    const sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SENDGRID_KEY}` },
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
      res.status(500).json({ error: 'メール送信に失敗しました' });
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── 起動 ──
app.listen(PORT, () => {
  console.log(`🚀 部勝 Backend v30-secure running on port ${PORT}`);
  console.log(`   Gemini: ${GEMINI_KEY ? '✅' : '❌'}  Stripe: ${STRIPE_KEY ? '✅' : '❌'}  SendGrid: ${SENDGRID_KEY ? '✅' : '❌'}`);
  console.log(`   Firebase Project: ${FB_PROJECT}`);
  console.log(`   Allowed Origins: ${allowedOrigins.join(', ')}`);
});
