// ============================================================
// 部勝（ブカツ）バックエンド サーバー v34 - マルチ AI プロバイダー
// ============================================================
// デプロイ先: レンダリング (https://bukka-backend.onrender.com)
//
// 環境変数（レンダリングダッシュボード→環境で設定）:
// GEMINI_API_KEY - Google Gemini API キー（AI機能:プライマリ）
// GROQ_API_KEY - Groq API キー（AI機能:フォールバック1）★新規追加
// OPENROUTER_API_KEY - OpenRouter API キー（AI機能:フォールバック2）★新規追加
// STRIPE_SECRET_KEY - ストライプシークレットキー（必須：決済）
// STRIPE_WEBHOOK_SECRET - Stripe Webhook 手動シークレット（推奨）
// SENDGRID_API_KEY - SendGrid API キー（任意：メール通知）
// FIREBASE_PROJECT_ID - Firebase プロジェクトID（確実: myteam-mycoach）
// FIREBASE_SERVICE_ACCOUNT - Firebase Admin SDK サービスアカウントJSON（必須：Webhook→DB）
// ALLOWED_ORIGINS - CORS許可オリジン（カンマ区切り）
// ADMIN_EMAILS - 管理者メール（カンマ区切り、管理者API用）
// NODE_ENV - 本番環境 / 開発環境
// ============================================================

const express = require('express');
const cors = require('cors');
const ヘルメット = require('ヘルメット');
const app = express();

// ── 環境変数 ──
const GEMINI_KEY = process.env.GEMINI_API_KEY || '';
const GROQ_KEY = process.env.GROQ_API_KEY || ''; // ★新規追加
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || ''; // ★新規追加
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WH_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const SENDGRID_KEY = process.env.SENDGRID_API_KEY || '';
const FB_PROJECT = process.env.FIREBASE_PROJECT_ID || 'myteam-mycoach';
const FB_SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT || '';
const NODE_ENV = process.env.NODE_ENV || '開発';
定数 PORT = process.env.PORT || 3000;
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim()).filter(Boolean);

// ── Firebase Admin SDK（Webhook→Firestore書込み用）──
firebaseAdmin、firestoreDb を作成します。
試す {
  firebaseAdmin = require('firebase-admin');
  FB_SERVICE_ACCOUNTの場合{
    const サービス アカウント = JSON.parse(FB_SERVICE_ACCOUNT);
    firebaseAdmin.initializeApp({
      資格情報: firebaseAdmin.credential.cert(serviceAccount)、
      プロジェクトID: FB_PROJECT
    });
    firestoreDb = firebaseAdmin.firestore();
    console.log('✅ Firebase Admin SDK 初期化完了');
  } それ以外 {
    console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT 未設定 → Webhook→DB書込み停止');
  }
} キャッチ (e) {
  console.warn('⚠️ Firebase Admin SDK 初期化失敗:', e.message);
}

// 起動時チェック
コンソールログ('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🏟️部勝 バックエンド v34 (マルチ AI)');
コンソールログ('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
if (!GEMINI_KEY) console.warn('⚠️ GEMINI_API_KEY 未設定');
if (!GROQ_KEY) console.warn('⚠️ GROQ_API_KEY 未設定');
if (!OPENROUTER_KEY) console.warn('⚠️ OPENROUTER_API_KEY 未設定');
if (!GEMINI_KEY && !GROQ_KEY && !OPENROUTER_KEY) console.warn('❌ AI APIキーが1つも設定されていない → AI機能停止');
if (!STRIPE_KEY) console.warn('⚠️ STRIPE_SECRET_KEY 未設定 → 決済停止');
if (!STRIPE_WH_SECRET) console.warn('⚠️ STRIPE_WEBHOOK_SECRET 未設定 → Webhook 検証なし');
if (!SENDGRID_KEY) console.warn('⚠️ SENDGRID_API_KEY 未設定 → メール停止');

// ================================================================
// セキュリティヘッダー (ヘルメット)
// ================================================================
app.use(ヘルメット({
  コンテンツセキュリティポリシー: {
    ディレクティブ: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.stripe.com", "https://api.sendgrid.com",
        「https://generativelanguage.googleapis.com」、
        "https://api.groq.com", // ★新規追加
        "https://openrouter.ai" // ★新規追加
      ],
      フレームソース: ["'self'", "https://checkout.stripe.com", "https://connect.stripe.com"],
      objectSrc: ["'なし'"],
      ベースUri: ["'self'"]
    }
  },
  クロスオリジン埋め込みポリシー: false、
  hsts: { maxAge: 31536000, includeSubDomains: true },
}));
app.disable('x-powered-by');

// ── CORS ──
const allowedOrigins = (process.env.ALLOWED_ORIGINS ||
  'https://myteam-mycoach.web.app、https://myteam-mycoach.firebaseapp.com、http://localhost:5000、http://localhost:3000'
).split(',').map(s => s.trim());

app.use(cors({
  原点: 関数(原点, cb) {
    if (!origin || allowedOrigins.includes(origin)) cb(null, true);
    それ以外 {
      console.warn('[CORS] ブロックされました:', origin);
      cb(新しいエラー('CORSがブロックされました'));
    }
  },
  メソッド: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Webhook 用: raw bodyが必要（他のルートより先に定義）
app.post('/api/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// 通常のルート用
app.use(express.json({ 制限: '5mb' }));
// URLエンコードも対応
app.use(express.urlencoded({ 拡張: true、制限: '1mb' }));

// ================================================================
// レート制限（強化版）
// ================================================================
定数_rl = {};
関数 rateLimit(キー, limit = 30, windowMs = 60000) {
  const now = Date.now();
  if (!_rl[キー]) _rl[キー] = [];
  _rl[key] = _rl[key].filter(t => t > now - windowMs);
  _rl[key].length >= limit の場合は false を返します。
  _rl[キー].push(今);
  true を返します。
}

// ブルートフォース防止（認証失敗5回で15分ブロック）
const _authFails = {};
関数 checkBruteForce(ip) {
  const now = Date.now();
  if (!_authFails[ip]) は true を返します。
  const recent = _authFails[ip].filter(t => t > now - 900000); // 15分
  _authFails[ip] = 最近;
  戻り値は recent.length < 5 です。
}
関数 recordAuthFail(ip) {
  _authFails[ip] が失敗した場合、 _authFails[ip] = [];
  _authFails[ip].push(Date.now());
}

// 定期クリーンアップ（5分ごと）
setInterval(() => {
  const カットオフ = Date.now() - 300000;
  Object.keys(_rl).forEach(k => {
    _rl[k] = _rl[k].filter(t => t > カットオフ);
    if (!_rl[k].length) _rl[k]を削除します。
  });
  const bfCutoff = Date.now() - 900000;
  Object.keys(_authFails).forEach(k => {
    _authFails[k] = _authFails[k].filter(t => t > bfCutoff);
    if (!_authFails[k].length) _authFails[k]を削除します。
  });
}, 300000);

// ================================================================
// Firebase ID検証
// ================================================================
非同期関数 verifyFirebaseToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) は null を返します。
  const トークン = authHeader.split(' ')[1];
  if (!token || token.length < 100) の場合は null を返します。
  試す {
    const parts = token.split('.');
    (parts.length !== 3) の場合は null を返します。
    const ペイロード = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) は null を返します。
    payload.iss !== `https://securetoken.google.com/${FB_PROJECT}` の場合、null を返します。
    if (payload.aud !== FB_PROJECT) は null を返します。
    if (!payload.user_id && !payload.sub) は null を返します。
    戻り値 { uid: payload.user_id || payload.sub、 email: payload.email || '' };
  } キャッチ (e) {
    console.warn('[Auth] トークンエラー:', e.message);
    null を返します。
  }
}

// ── 認証ミドルウェア（厳密：AI/メール/管理者用）──
非同期関数 requireAuth(req, res, next) {
  NODE_ENV === 'development' && !req.headers.authorization の場合 {
    req.user = { uid: 'dev-user', email: 'dev@localhost' };
    next() を返します。
  }
  const ip = req.ip;
  if (!checkBruteForce(ip)) {
    return res.status(429).json({ error: '認証試行が多すぎます。15分後に再試行してください。' });
  }
  const ユーザー = FirebaseToken の検証を待機します (req.headers.authorization);
  if (!ユーザー) {
    recordAuthFail(ip);
    return res.status(401).json({ error: '認証が必要です' });
  }
  req.user = ユーザー;
  次（）;
}

// ── 認証ミドルウェア（柔軟: Stripe用）──
非同期関数optionalAuth(req, res, next) {
  const ユーザー = FirebaseToken の検証を待機します (req.headers.authorization);
  if (ユーザー) {
    req.user = ユーザー;
  } それ以外 {
    req.user = { uid: 'anonymous', email: '' };
  }
  次（）;
}

// ── 管理者認証ミドルウェア ──
非同期関数 requireAdmin(req, res, next) {
  requireAuth(req, res, () => { を待機します。
    if (!req.user) 戻り値:
    ADMIN_EMAILS.length と ADMIN_EMAILS.includes(req.user.email) の場合 {
      return res.status(403).json({ error: '管理者権限が必要です' });
    }
    次（）;
  });
}

// ================================================================
// リクエストログ・監視
// ================================================================
const _requestLog = [];
定数_stats = {
  開始時刻: 新しいDate().toISOString(),
  合計リクエスト数: 0、エラー数: 0、
  エンドポイント: {},
  支払い: { 合計: 0、成功: 0、失敗: 0、金額: 0 },
  メール: { 合計: 0、成功: 0、失敗: 0 },
  ai: { total: 0, success: 0, failed: 0, Providers: { gemini: 0, groq: 0, openrouter: 0 } } // ★providers追加
};

app.use((req, res, next) => {
  const start = Date.now();
  _stats.totalRequests++;
  _stats.endpoints[req.path] = (_stats.endpoints[req.path] || 0) + 1;
  if (req.path !== '/health' && req.path !== '/') {
    console.log(`[${new Date().toISOString().slice(11, 19)}] ${req.method} ${req.path}`);
  }
  // 応答完了時にログ記録
  res.on('終了', () => {
    const duration = Date.now() - 開始;
    res.statusCode >= 400 の場合、_stats.errors++;
    _requestLog.push({
      t: 新しい Date().toISOString()、m: 要求メソッド、p: 要求パス、
      s: res.statusCode、d: 期間、ip: req.ip、uid: req.user?.uid || null
    });
    _requestLog.length > 1000 の場合、_requestLog.splice(0、_requestLog.length - 1000);
  });
  次（）;
});

// ================================================================
// ヘルスチェック（強化版）
// ================================================================
app.get('/health', (req, res) => {
  定数 uptime = Math.round(process.uptime());
  const mem = プロセス.memoryUsage();

  // ★ AI利用可能プロバイダー一覧
  定数 aiProviders = [];
  (GEMINI_KEY) aiProviders.push('gemini');
  GROQ_KEY の場合、 aiProviders.push('groq');
  OPENROUTER_KEY の場合、 aiProviders.push('openrouter');

  res.json({
    ステータス: 'OK'、
    バージョン: 'v34',
    環境: NODE_ENV,
    サービス: {
      ジェミニ: !!GEMINI_KEY,
      groq: !!GROQ_KEY, // ★新規追加
      openrouter: !!OPENROUTER_KEY, // ★新規追加
      ai_providers: aiProviders, // ★新規追加
      ストライプ: !!STRIPE_KEY,
      送信グリッド: !!SENDGRID_KEY,
      ウェブフック: !!STRIPE_WH_SECRET,
      ファイアストア: !!firestoreDb,
    },
    稼働時間、
    稼働時間フォーマット: `${Math.floor(稼働時間/3600)}h ${Math.floor((稼働時間%3600)/60)}m`,
    メモリ： {
      ヒープ使用率: Math.round(mem.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(mem.heapTotal / 1024 / 1024) + 'MB',
      rss: Math.round(mem.rss / 1024 / 1024) + 'MB',
    },
    統計: {
      合計リクエスト数: _stats.totalRequests,
      エラー: _stats.errors、
      エラー率: _stats.totalRequests ? ((_stats.errors / _stats.totalRequests) * 100).toFixed(1) + '%' : '0%',
      aiProviderStats: _stats.ai.providers, // ★新規追加
    },
    タイムスタンプ: 新しい Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({ name: 'バックエンド API', version: 'v34', docs: '/health' });
});

// ================================================================
// 管理者用API
// ================================================================
// サーバー統計
app.get('/api/admin/stats', requireAdmin, (req, res) => {
  res.json({
    ..._統計、
    稼働時間: Math.round(process.uptime()),
    メモリ: process.memoryUsage(),
    アクティブレート制限: Object.keys(_rl).length,
    ブロックされたIP: Object.keys(_authFails).filter(ip => (_authFails[ip]||[]).length >= 5).length,
  });
});

// リクエストログ（いつもN件）
app.get('/api/admin/logs', requireAdmin, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 100, 1000);
  const ログ = _requestLog.slice(-limit);
  res.json({ count: logs.length, total: _requestLog.length, logs });
});

// エンドポイント別アクセスランキング
app.get('/api/admin/endpoints', requireAdmin, (req, res) => {
  const sorted = Object.entries(_stats.endpoints)
    .sort((a, b) => b[1] - a[1])
    .map(([パス、カウント]) => ({パス、カウント}));
  res.json({ エンドポイント: ソート済み });
});

// 決済統計
app.get('/api/admin/payments', requireAdmin, (req, res) => {
  res.json(_stats.payments);
});

// Stripe決済詳細（Firestoreの支払い/送金/返金）
app.get('/api/admin/stripe-dashboard', requireAdmin, async(req, res) => {
  if (!firestoreDb) {
    res.json({ 支払い: [], 振替: [], 返金: [], firestoreConnected: false }); を返します。
  }
  試す {
    // 支払いコレクション取得
    const paySnap = firestoreDb.collection('payments').orderBy('createdAt', 'desc').limit(500).get(); を待機します。
    const 支払い = [];
    paySnap.forEach(doc => {
      const d = doc.data();
      支払い.push({
        id: doc.id,
        ストライプセッションID: d.stripeSessionId || doc.id,
        タイプ: d.type || ''、
        金額: d.amount || 0,
        プラットフォーム手数料: d.platformFee || 0,
        合計請求額: d.totalCharged || 0,
        メソッド: d.method || 'カード',
        ステータス: d.status || '不明',
        チームID: d.teamId || ''、
        プレイヤーID: d.playerId || ''、
        ガーディアンID: d.guardianId || ''、
        コーチID: d.coachId || ''、
        月: d.month || ''、
        請求書ID: d.invoiceId || ''、
        スレッドID: d.threadId || ''、
        createdAt: d.createdAt?._seconds ? 新しい Date(d.createdAt._seconds * 1000).toISOString() : '',
        更新日時: d.updatedAt?._seconds ? 新しい Date(d.updatedAt._seconds * 1000).toISOString() : '',
      });
    });

    //転送コレクション取得
    const trSnap = firestoreDb.collection('transfers').orderBy('createdAt', 'desc').limit(200).get(); を待機します。
    const 転送 = [];
    trSnap.forEach(doc => {
      const d = doc.data();
      転送.push({
        id: doc.id,
        転送ID: d.transferId || doc.id,
        金額: d.amount || 0,
        コーチID: d.coachId || ''、
        チームID: d.teamId || ''、
        月: d.month || ''、
        ステータス: d.status || ''、
        接続アカウントID: d.connectedAccountId || ''、
        createdAt: d.createdAt?._seconds ? 新しい Date(d.createdAt._seconds * 1000).toISOString() : '',
      });
    });

    // 返金コレクション取得
    const rfSnap = firestoreDb.collection('refunds').orderBy('createdAt', 'desc').limit(200).get(); を待機します。
    const 払い戻し = [];
    rfSnap.forEach(doc => {
      const d = doc.data();
      払い戻し.push({
        id: doc.id,
        払い戻しID: d.refundId || doc.id,
        セッションID: d.sessionId || ''、
        金額: d.amount || 0,
        ステータス: d.status || ''、
        理由: d.reason || ''、
        支払いインテントID: d.paymentIntentId || ''、
        メタデータ: d.metadata || {},
        createdAt: d.createdAt?._seconds ? 新しい Date(d.createdAt._seconds * 1000).toISOString() : '',
      });
    });

    // ストライプ手数料率（日本市場）
    const ストライプ手数料率 = {
      カード: { レート: 3.6、固定: 0、ラベル: 'クレジットカード 3.6%' }、
      コンビニ: { レート: 0, 固定: 120, ラベル: 'コンビニ ¥120/件' },
      Bank_transfer: { rate: 0, fix: 0, label: '銀行振込 ¥0' },
      customer_balance: { rate: 0, fix: 0, label: '銀行振込 ¥0' },
    };

    res.json({
      firestoreConnected: true、
      支払い、送金、払い戻し、stripeFeeRates、
      サーバー統計: _stats.payments、
      取得日時: 新しいDate().toISOString(),
    });
  } キャッチ (e) {
    console.error('[Admin/StripeDashboard]', e.message);
    res.status(500).json({ error: '決済データの取得に失敗しました' });
  }
});

// ブロック中IPの確認
app.get('/api/admin/blocked', requireAdmin, (req, res) => {

  // ── 選手トレーニング・食事データ取得（チーム管理者用）──
  app.get('/api/team/player-data/:localId', requireAuth, async(req, res) => {
    if (!firestoreDb) {
      return res.status(503).json({ error: 'Firestore未接続' });
    }
    試す {
      定数 localId = req.params.localId;
      if (!localId) return res.status(400).json({ error: 'プレイヤーIDが必要です' });

      // users コレクションから localId → firebase UID を検索
      const usersSnap = firestoreDb.collection('users').where('id', '==', localId).limit(1).get(); を待機します。
      if (usersSnap.empty) {
        return res.json({ 見つかった: false, メッセージ: 'この選手はアプリ未登録です' });
      }
      const fbUid = usersSnap.docs[0].id;

      // appdata/{uid} から個人データを取得
      const appDoc = firestoreDb.collection('appdata').doc(fbUid).get() を待機します。
      もし (!appDoc.exists) {
        return res.json({ 見つかった: true, fbUid, データ: null, メッセージ: 'データ未同期' });
      }
      const d = appDoc.data();

      // 必要なフィールドのみ出発（プライバシー配慮）
      res.json({
        見つかりました: 真、
        fbUid、
        データ： {
          トレーニングログ: d.trainingLog || {},
          食事履歴: d.mealHistory || {},
          食事: d.meals || { 今日: [], 水: 0 },
          ボディログ: d.bodyLog || {},
          条件ログ: d.conditionLog || {},
          栄養目標: d.栄養目標 || {},
          傷害履歴: d.injuryHistory || [],
          完了セット: d.doneSets || {},
        },
        同期日時: d._syncedAt || ''、
      });
    } キャッチ (e) {
      console.error('[Team/PlayerData]', e.message);
      res.status(500).json({ error: '選手データの取得に失敗しました' });
    }
  });

  // ── 複数選手の概要一括取得（チーム一覧用）──
  app.post('/api/team/players-summary', requireAuth, async (req, res) => {
    if (!firestoreDb) {
      return res.status(503).json({ error: 'Firestore未接続' });
    }
    試す {
      const { playerIds } = req.body;
      if (!Array.isArray(playerIds) || playerIds.length === 0) {
        return res.status(400).json({ error: 'playerIdsが必要です' });
      }

      // 最大30名まで
      const ids = playerIds.slice(0, 30);

      // 一括でusersコレクションを検索
      const usersSnap = firestoreDb.collection('users').where('id', 'in', ids).get(); を待機します。
      定数 idToUid = {};
      usersSnap.forEach(doc => { idToUid[doc.data().id] = doc.id; });

      const サマリー = {};
      for (const localId of ids) {
        const uid = idToUid[localId];
        if (!uid) { summaries[localId] = { registered: false }; 続行; }
        試す {
          const appDoc = firestoreDb.collection('appdata').doc(uid).get() を待機します。
          if (!appDoc.exists) { summaries[localId] = { registered: true, synced: false }; 続行; }
          const d = appDoc.data();
          const tLog = d.trainingLog || {};
          const pLogs = tLog[localId] || {};
          const recent = Object.values(pLogs).sort((a, b) => (b.date || '') > (a.date || '') ? 1 : -1).slice(0, 7);
          const mealH = d.mealHistory || {};
          const mealDays = Object.keys(mealH).length;
          const todayMeals = d.meals?.today || [];
          const water = d.meals?.water || 0;
          サマリー[localId] = {
            登録済み: true、同期済み: true、
            同期日時: d._syncedAt || ''、
            トレーニング： {
              totalDays: Object.keys(pLogs).length,
              recentDays: recent.length,
              avgCond: recent.length ? +(recent.reduce((s, e) => s + (e.cond || 0), 0) / recent.length).toFixed(1): null,
              平均Kcal: recent.length ? Math.round(recent.reduce((s, e) => s + (e.kcal || 0), 0) / recent.length): null,
              lastDate: recent[0]?.date || ''、
            },
            栄養： {
              食事日、
              todayCount: todayMeals.length,
              水、
              今日のKcal: todayMeals.reduce((s, m) => s + (m.kcal || m.cal || 0), 0),
            },
          };
        } キャッチ (e) {
          summaries[localId] = { 登録済み: true、同期済み: false、エラー: true };
        }
      }
      res.json({ サマリー });
    } キャッチ (e) {
      console.error('[チーム/プレイヤーサマリー]', e.message);
      res.status(500).json({ error: '選手データの取得に失敗しました' });
    }
  });

  const ブロック = Object.entries(_authFails)
    .filter(([, times]) => times.length >= 5)
    .map(([ip, times]) => ({
      ip、試行回数: 回.長さ、
      最後の試行: 新しいDate(Math.max(...times)).toISOString(),
      ブロック解除: 新しい Date(Math.max(...times) + 900000).toISOString()
    }));
  res.json({ count: ブロックされた長さ、ブロックされた });
});

// 手動IPブロック解除
app.post('/api/admin/unblock', requireAdmin, (req, res) => {
  const { ip } = req.body;
  if (ip && _authFails[ip]) {
    _authFails[ip]を削除します。
    res.json({ ok: true, message: `${ip} のブロックを解除しました` });
  } それ以外 {
    res.json({ ok: false, message: '該当IPが見つかりません' });
  }
});


// ================================================================
// ★★★ AI マルチプロバイダー エンジン（v34 新機能）★★★
// ================================================================
// フォールバック順: Gemini → Groq → OpenRouter
// 1つが失敗（クォータ超過・エラー等）また次のプロバイダーに自動切替
// ================================================================

/**
 * Gemini API でのテキスト生成
 */
非同期関数callGemini(メッセージ、システム、イメージ、maxTokens) {
  if (!GEMINI_KEY) throw new Error('GEMINI_API_KEY not configured');

  const ジェミニメッセージ = [];
  if (システム) {
    geminiMessages.push({ role: 'user', parts: [{ text: system }] });
    geminiMessages.push({ role: 'model', Parts: [{ text: 'はい、承知しました。' }] });
  }
  メッセージ.forEach(m => {
    const パーツ = [];
    if (image && m.role === 'user' && m === messages[messages.length - 1]) {
      parts.push({ inlineData: { mimeType: image.mimeType || 'image/jpeg', data: image.data } });
    }
    parts.push({ テキスト: m.content || m.text || '' });
    geminiMessages.push({ role: m.role === 'assistant' ? 'model' : 'user', parts });
  });

  const res = フェッチを待つ(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`、
    {
      メソッド: 'POST'、
      ヘッダー: { 'Content-Type': 'application/json' },
      本文: JSON.stringify({
        内容: geminiMessages、
        generationConfig: { maxOutputTokens: maxTokens || 1024、温度: 0.7 }
      })
    }
  ）;

  const データ = res.json() を待機します。
  if (データ.エラー) {
    新しいエラーをスローします(`Gemini: ${data.error.message}`);
  }
  const text = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
  if (!text) throw new Error('Gemini: 空の応答');
  戻り値: { テキスト、プロバイダー: 'gemini'、候補: data.candidates };
}

/**
 * Groq API でテキスト生成（OpenAI互換フォーマット）
 */
非同期関数callGroq(メッセージ、システム、maxTokens) {
  if (!GROQ_KEY) throw new Error('GROQ_API_KEY not configured');

  const groqMessages = [];
  if (システム) {
    groqMessages.push({ ロール: 'system'、コンテンツ: system });
  }
  メッセージ.forEach(m => {
    groqMessages.push({
      ロール: m.role === 'アシスタント' ? 'アシスタント' : 'ユーザー',
      コンテンツ: m.content || m.text || ''
    });
  });

  const res = フェッチを待機('https://api.groq.com/openai/v1/chat/completions', {
    メソッド: 'POST'、
    ヘッダー: {
      'コンテンツタイプ': 'application/json',
      「承認」: `ベアラー ${GROQ_KEY}`
    },
    本文: JSON.stringify({
      モデル: 'llama-3.3-70b-versatile',
      メッセージ: groqMessages、
      max_tokens: 最大トークン数 || 1024,
      温度: 0.7
    })
  });

  const データ = res.json() を待機します。
  if (データ.エラー) {
    新しいエラーをスローします(`Groq: ${data.error.message}`);
  }
  const テキスト = data.choices?.[0]?.message?.content || '';
  if (!text) throw new Error('Groq: 空の応答');
  戻り値: { テキスト、プロバイダー: 'groq' };
}

/**
 * OpenRouter APIでテキスト生成無料（モデル使用）
 */
非同期関数callOpenRouter(メッセージ、システム、maxTokens) {
  if (!OPENROUTER_KEY) throw new Error('OPENROUTER_API_KEY not configured');

  const orMessages = [];
  if (システム) {
    またはMessages.push({ ロール: 'system'、コンテンツ: system });
  }
  メッセージ.forEach(m => {
    またはメッセージ.push({
      ロール: m.role === 'アシスタント' ? 'アシスタント' : 'ユーザー',
      コンテンツ: m.content || m.text || ''
    });
  });

  const res = フェッチを待機('https://openrouter.ai/api/v1/chat/completions', {
    メソッド: 'POST'、
    ヘッダー: {
      'コンテンツタイプ': 'application/json',
      「承認」: `ベアラー ${OPENROUTER_KEY}`,
      'HTTPリファラー': 'https://myteam-mycoach.web.app',
      「X-タイトル」: 「MyCOACH-MyTEAM AI アドバイザー」
    },
    本文: JSON.stringify({
      モデル: 'meta-llama/llama-3.1-8b-instruct:free',
      メッセージ: またはメッセージ、
      max_tokens: 最大トークン数 || 1024,
      温度: 0.7
    })
  });

  const データ = res.json() を待機します。
  if (データ.エラー) {
    新しいエラーをスローします(`OpenRouter: ${data.error.message || JSON.stringify(data.error)}`);
  }
  const テキスト = data.choices?.[0]?.message?.content || '';
  if (!text) throw new Error('OpenRouter: 空の応答');
  戻り値: { テキスト、プロバイダー: 'openrouter' };
}

/**
 *マルチプロバイダー AI 呼び出し（フォールバック付き）
 * Gemini → Groq → OpenRouter の順に試行
 */
非同期関数callAIWithFallback(メッセージ、システム、画像、maxTokens) {
  const プロバイダー = [];

  // 利用可能なプロバイダーを優先順に追加
  if (GEMINI_KEY) providers.push({ name: 'gemini', fn: () => callGemini(messages, system, image, maxTokens) });
  if (GROQ_KEY) プロバイダー.push({ name: 'groq', fn: () => callGroq(messages, system, maxTokens) });
  if (OPENROUTER_KEY) providers.push({ name: 'openrouter', fn: () => callOpenRouter(messages, system, maxTokens) });

  プロバイダの長さが 0 の場合
    throw new Error('AI APIキーが1つも設定されていない');
  }

  定数エラー = [];

  for (const provider of providers) {
    試す {
      console.log(`[AI] ${provider.name} を試行しています...`);
      const 結果 = プロバイダー.fn() を待機します。
      console.log(`[AI] ✅ ${provider.name} 成功`);
      _stats.ai.providers[プロバイダー名] = (_stats.ai.providers[プロバイダー名] || 0) + 1;
      結果を返します。
    } キャッチ (e) {
      console.warn(`[AI] ❌ ${provider.name} が失敗しました: ${e.message}`);
      errors.push({ プロバイダー: provider.name、エラー: e.message });
    }
  }

  // すべてのプロバイダーが失敗
  throw new Error(`全AIプロバイダーが失敗: ${errors.map(e => `${e.provider}(${e.error})`).join(', ')}`);
}


// ================================================================
// AIチャット（マルチプロバイダー対応） ★v34で書き換え
// ================================================================
app.post('/api/ai/chat', requireAuth, async(req, res) => {
  const ip = req.ip;
  if (!rateLimit(ip + '_ai', 20, 60000)) {
    return res.status(429).json({ error: 'リクエスト制限に達しました。1分後に再試行してください。' });
  }

  // ★全体プロバイダーが未設定の場合のみ503
  if (!GEMINI_KEY && !GROQ_KEY && !OPENROUTER_KEY) {
    return res.status(503).json({ error: 'AI機能は現在利用できません。' });
  }

  _stats.ai.total++;

  試す {
    const { メッセージ、システム、イメージ、maxTokens } = req.body;
    if (!メッセージ || !Array.isArray(メッセージ)) {
      res.status(400).json({ エラー: 'messages is required' }); を返します。
    }

    // 入力サイズ制限
    const totalLen = JSON.stringify(メッセージ).length;
    合計長さ > 100000 の場合 {
      return res.status(400).json({ error: 'リクエストが大きすぎます (max 100KB)' });
    }

    // ★マルチプロバイダーで呼び出し
    const 結果 = callAIWithFallback(メッセージ、システム、イメージ、maxTokens) を待機します。

    _stats.ai.success++;
    res.json({
      テキスト: 結果.テキスト、
      Provider: result.provider, // ★どのプロバイダーが応答したかを返します
      候補: result.candidates || null
    });

  } キャッチ (e) {
    console.error('[AI] エラー:', e.message);
    _stats.ai.failed++;
    res.status(500).json({ error: e.message || 'AI処理エラー' });
  }
});


// ================================================================
// ストライプ決済
// ================================================================
ストライプにします。
(STRIPE_KEY) の場合 {
  ストライプ = require('stripe')(STRIPE_KEY);
}

関数stripeUnavailable(res) {
  return res.status(503).json({ error: 'Stripe決済は現在利用できません。管理者に連絡してください。' });
}

関数 getOrigin(req) {
  req.headers.origin || allowedOrigins[0]を返します。
}

// 金額バリデーション
関数validateAmount(金額) {
  const n = parseInt(量);
  if (isNaN(n) || n < 100 || n > 10000000) null を返します。 // 100円〜1000万円
  n を返します。
}

// 手数料率バリデーション（プラットフォーム最低保証: 5%）
const PLATFORM_MIN_FEE_RATE = 5; // プラットフォーム最低手数料 5%
const PLATFORM_MAX_FEE_RATE = 50; // 最大50%
const PLATFORM_DEFAULT_FEE_RATE = 10; // 余裕10%

関数validateFeeRate(手数料率) {
  const rate = parseFloat(feeRate);
  if (isNaN(rate)) は PLATFORM_DEFAULT_FEE_RATE を返します。
  Math.max(PLATFORM_MIN_FEE_RATE, Math.min(PLATFORM_MAX_FEE_RATE, レート)) を返します。
}

// ── 日本向け決済手段設定（クレカ・コンビニ・振込銀行） ──
定数 JP_PAYMENT_CONFIG = {
  支払い方法の種類: ['カード', 'コンビニ', '顧客残高'],
  支払い方法のオプション: {
    コンビニ: { 有効期限: 3 },
    顧客残高: {
      資金調達の種類: '銀行振込'、
      銀行振込: { タイプ: 'jp_bank_transfer' }
    }
  }
};

// ── 月謝チェックアウト ──
非同期関数createTuitionSession(req, res) {
  if (!stripe) は stripeUnavailable(res); を返します。
  const ip = req.ip;
  if (!rateLimit(ip + '_pay', 5, 60000)) {
    return res.status(429).json({ error: '決済リクエストが多すぎます。1分後に再試行してください。' });
  }
  試す {
    定数 amount = 検証量(req.body.amount);
    if (!amount) return res.status(400).json({ error: '金額が不正です (100〜10,000,000円)' });
    const { teamId、 playerId、 guardianId、 month、 teamName、 playerName、 feeRate } = req.body;
    定数レート = 手数料レートを検証します(手数料レート);
    const platformFee = Math.round(金額 * レート / 100);
    const セッション = stripe.checkout.sessions.create({
      ...JP_PAYMENT_CONFIG、
      モード: '支払い'、
      line_items: [{ 価格データ: { 通貨: '円', 単位金額: 金額 + プラットフォーム手数料, 製品データ: { 名前: `${チーム名 || 'チーム'} 月謝 ${month || ''}`.trim() } }、数量: 1 }]、
      success_url: `${getOrigin(req)}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getOrigin(req)}?payment=cancel`,
      メタデータ: { type: 'monthly_fee'、teamId: teamId || ''、playerId: playerId || ''、guardianId: guardianId || ''、month: month || ''、originalAmount: String(amount)、platformFee: String(platformFee) }
    });
    _stats.payments.total++;
    res.json({ セッションUrl: session.url, url: session.url, セッションID: session.id });
  } キャッチ (e) {
    console.error('[Stripe/Monthly]', e.message);
    res.status(500).json({ error: '決済セッションの作成に失敗しました' });
  }
}
app.post('/create-tuition-session', requireAuth, createTuitionSession);
app.post('/api/stripe/monthly', requireAuth, createTuitionSession);

// ── コーチ代 チェックアウト ──
非同期関数 createCoachSession(req, res) {
  if (!stripe) は stripeUnavailable(res); を返します。
  const ip = req.ip;
  if (!rateLimit(ip + '_pay', 5, 60000)) {
    return res.status(429).json({ error: '決済リクエストが多すぎます。1分後に再試行してください。' });
  }
  試す {
    定数 amount = 検証量(req.body.amount);
    if (!amount) return res.status(400).json({ error: '金額が不正です' });
    const { threadId、month、coachName、coachId、teamId、teamName、feeRate } = req.body;
    定数レート = 手数料レートを検証します(手数料レート);
    const platformFee = Math.round(金額 * レート / 100);
    const セッション = stripe.checkout.sessions.create({
      ...JP_PAYMENT_CONFIG、
      モード: '支払い'、
      line_items: [{ 価格データ: { 通貨: '円', 単位金額: 金額 + プラットフォーム手数料, 製品データ: { 名前: `${コーチ名 || 'コーチ'} 指導料 ${month || ''}`.trim() } }、数量: 1 }]、
      success_url: `${getOrigin(req)}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getOrigin(req)}?payment=cancel`,
      メタデータ: { type: 'coach_fee'、threadId: threadId || ''、coachId: coachId || ''、teamId: teamId || ''、month: month || ''、originalAmount: String(amount)、platformFee: String(platformFee) }
    });
    _stats.payments.total++;
    res.json({ セッションUrl: session.url, url: session.url, セッションID: session.id });
  } キャッチ (e) {
    console.error('[Stripe/Coach]', e.message);
    res.status(500).json({ error: '決済セッションの作成に失敗しました' });
  }
}
app.post('/create-coach-payment-session', requireAuth, createCoachSession);
app.post('/api/stripe/coach'、requireAuth、createCoachSession);

// ── 都度請求 チェックアウト ──
非同期関数createAdhocSession(req, res) {
  if (!stripe) は stripeUnavailable(res); を返します。
  const ip = req.ip;
  if (!rateLimit(ip + '_pay', 5, 60000)) {
    return res.status(429).json({ error: '決済リクエストが多すぎます。1分後に再試行してください。' });
  }
  試す {
    定数 amount = 検証量(req.body.amount);
    if (!amount) return res.status(400).json({ error: '金額が不正です' });
    const { 請求書ID、タイトル、チームID、プレーヤーID、手数料 } = req.body;
    定数レート = 手数料レートを検証します(手数料レート);
    const platformFee = Math.round(金額 * レート / 100);
    const セッション = stripe.checkout.sessions.create({
      ...JP_PAYMENT_CONFIG、
      モード: '支払い'、
      line_items: [{ 価格データ: { 通貨: '円', 単位金額: 金額 + プラットフォーム手数料, 製品データ: { 名前: タイトル || 「都度請求」 } }、数量: 1 }]、
      success_url: `${getOrigin(req)}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getOrigin(req)}?payment=cancel`,
      メタデータ: { タイプ: 'adhoc'、請求書ID: invoiceId || ''、チームID: teamId || ''、プレイヤーID: playerId || ''、元の金額: 文字列(金額)、プラットフォーム料金: 文字列(プラットフォーム料金) }
    });
    _stats.payments.total++;
    res.json({ セッションUrl: session.url, url: session.url, セッションID: session.id });
  } キャッチ (e) {
    console.error('[Stripe/Adhoc]', e.message);
    res.status(500).json({ error: '決済セッションの作成に失敗しました' });
  }
}
app.post('/create-adhoc-payment-session', requireAuth, createAdhocSession);
app.post('/api/stripe/adhoc', requireAuth, createAdhocSession);

// ── セッション状態確認 ──
非同期関数 getSessionStatus(req, res) {
  if (!stripe) は stripeUnavailable(res); を返します。
  試す {
    const セッション ID = req.params.id;
    if (!セッションID || !セッションID.startsWith('cs_')) {
      return res.status(400).json({ error: '無効なセッションIDです' });
    }
    const session = stripe.checkout.sessions.retrieve(sessionId); を待機します。
    res.json({ ステータス: session.payment_status、メタデータ: session.metadata });
  } キャッチ (e) {
    console.error('[Stripe/Session]', e.message);
    res.status(500).json({ error: 'セッション情報の取得に失敗しました' });
  }
}
app.get('/session-status/:id', requireAuth, getSessionStatus);
app.get('/api/stripe/session/:id', requireAuth, getSessionStatus);

// ── Stripe Connect（コーチ登録）──
非同期関数createConnectAccount(req, res) {
  if (!stripe) は stripeUnavailable(res); を返します。
  const ip = req.ip;
  if (!rateLimit(ip + '_connect', 3, 60000)) {
    return res.status(429).json({ error: '独自作成リクエストが多すぎます。1分後に再試行してください。' });
  }
  試す {
    const アカウント = ストライプ.アカウント.作成({
      タイプ: 'エクスプレス'、国: 'JP'、
      機能: { カード支払い: { 要求: true }、送金: { 要求: true } }
    });
    const link = stripe.accountLinks.create({
      アカウント: account.id,
      refresh_url: `${getOrigin(req)}?stripe_connect=refresh`,
      return_url: `${getOrigin(req)}?stripe_connect=success`,
      タイプ: 'account_onboarding'
    });
    res.json({ url: link.url, アカウントID: account.id });
  } キャッチ (e) {
    console.error('[Stripe/Connect]', e.message);
    res.status(500).json({ error: 'Connectアカウントの作成に失敗しました' });
  }
}
app.post('/create-connect-account', requireAuth, createConnectAccount);
app.post('/api/stripe/connect', requireAuth, createConnectAccount);

// ── Stripe Transfer（コーチへの送金）──
非同期関数 createTransfer(req, res) {
  if (!stripe) は stripeUnavailable(res); を返します。
  試す {
    const { 金額、接続アカウントID、コーチID、チームID、月、説明 } = req.body;
    const n = parseInt(量);
    if (!n || n < 100) return res.status(400).json({ error: '送金額は100円以上が必要です' });
    if (!接続アカウントID || !接続アカウントID.startsWith('acct_')) {
      return res.status(400).json({ error: '有効なStripe ConnectIDが必要です' });
    }
    const アカウント = stripe.accounts.retrieve(connectedAccountId); を待機します。
    アカウントの請求が有効になっている場合 || アカウントの支払いが有効になっている場合
      return res.status(400).json({ error: 'コーチの設定が完了していません。' });
    }
    const 転送 = ストライプ.転送.作成を待機します({
      金額: n、通貨: 'jpy'、送信先: connectedAccountId、
      説明: 説明 || `部勝コーチ報酬 ${month || ''}''.trim()、
      メタデータ: { coachId: coachId || ''、 teamId: teamId || ''、 month: month || '' }
    });
    if (firestoreDb) {
      firestoreDb.collection('transfers').doc(transfer.id).set({ を待機します。
        転送ID: transfer.id、金額: n、コーチID: coachId || ''、チームID: teamId || ''
        connectedAccountId、月: month || ''、ステータス: '完了'、
        作成日時: firebaseAdmin.firestore.FieldValue.serverTimestamp()
      });
    }
    console.log(`[Stripe/Transfer] ¥${n} → ${connectedAccountId}`);
    res.json({ 転送ID: transfer.id, 金額: n, ステータス: '完了' });
  } キャッチ (e) {
    console.error('[Stripe/Transfer]', e.message);
    res.status(500).json({ error: '送金処理に失敗しました' });
  }
}
app.post('/api/stripe/transfer', requireAdmin, createTransfer);

// ── Stripe Connect ログインステータス確認 ──
app.get('/api/stripe/account-status/:accountId', requireAuth, async(req, res) => {
  if (!stripe) は stripeUnavailable(res); を返します。
  試す {
    const { アカウントID } = 必須パラメータ;
    アカウントIDがacct_で始まる場合
      return res.status(400).json({ error: '有効な不正IDです' });
    }
    const アカウント = stripe.accounts.retrieve(accountId); を待機します。
    res.json({
      アカウントID: account.id、charges_enabled: account.charges_enabled、
      支払いが有効: account.payouts_enabled、詳細が送信されました: account.details_submitted、
      国: account.country、デフォルト通貨: account.default_currency
    });
  } キャッチ (e) {
    console.error('[Stripe/AccountStatus]', e.message);
    res.status(500).json({ error: '口座情報の取得に失敗しました' });
  }
});

// ── ストライプ返済 ──
非同期関数createRefund(req, res) {
  if (!stripe) は stripeUnavailable(res); を返します。
  試す {
    const { sessionId, reason } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'sessionIdが必要です' });
    const session = stripe.checkout.sessions.retrieve(sessionId); を待機します。
    if (!session.payment_intent) {
      return res.status(400).json({ error: 'この決済は返金できません（PaymentIntentなし）' });
    }
    const refund = stripe.refunds.create({
      支払い意図: session.payment_intent、
      理由: 理由 || 'requested_by_customer'
    });
    if (firestoreDb) {
      firestoreDb.collection('refunds').doc(refund.id).set({ を待機します。
        払い戻しID: refund.id、セッションID、支払いインテントID: session.payment_intent、
        金額: refund.amount、ステータス: refund.status、理由: reason || 'requested_by_customer'、
        メタデータ: session.metadata || {},
        作成日時: firebaseAdmin.firestore.FieldValue.serverTimestamp()
      });
      firestoreDb.collection('payments').doc(sessionId).update({ を待機します。
        ステータス: '払い戻し済み'、払い戻しID: refund.id、
        更新日時: firebaseAdmin.firestore.FieldValue.serverTimestamp()
      }).catch(() => {});
    }
    console.log(`[Stripe/Refund] ${refund.id} ¥${refund.amount}`);
    res.json({ refundId: refund.id, amount: refund.amount, status: refund.status });
  } キャッチ (e) {
    console.error('[Stripe/Refund]', e.message);
    res.status(500).json({ error: '返済処理に失敗しました' });
  }
}
app.post('/api/stripe/refund', requireAdmin, createRefund);

// ── Webhook（ストライプ→サーバー）──
関数handleWebhook(req, res) {
  イベントを発生させます。
  試す {
    if (STRIPE_WH_SECRET && ストライプ) {
      const sig = req.headers['stripe-signature'];
      イベント = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WH_SECRET);
    } それ以外 {
      イベント = JSON.parse(req.body.toString());
    }
  } キャッチ (e) {
    console.error('[Webhook] 意思検証失敗:', e.message);
    res.status(400).json({ error: 'Webhook署名の検証に失敗しました' }); を返します。
  }

  console.log(`[Webhook] ${event.type} (${event.id})`);

  スイッチ (イベントタイプ) {
    ケース 'checkout.session.completed': {
      const セッション = イベント.データ.オブジェクト;
      const meta = session.metadata || {};
      const paymentMethod = session.payment_method_types?.[0] || 'カード';
      console.log('[Webhook]決済セッション完了:', { type:meta.type, amount:session.amount_total,payment_status:session.payment_status,payment_method:paymentMethod });
      if (session.payment_status === 'paid') {
        _stats.payments.success++;
        _stats.payments.amount += (session.amount_total || 0);
        _writePaymentToFirestore(meta, session, 'card').catch(e => console.error('[Webhook] Firestore書込み失敗:', e.message));
        if (SENDGRID_KEY && meta.type) {
          _sendPaymentNotification(meta, session.amount_total, 'card').catch(e => console.error('[Webhook] 通知メール送信失敗:', e.message));
        }
      } そうでない場合 (session.payment_status === '未払い') {
        console.log('[Webhook] 非同期決済: 入金待ち (' +paymentMethod + ')');
        _writePaymentToFirestore(meta, session,paymentMethod, 'pending').catch(e => console.error('[Webhook] Firestore書込み失敗:', e.message));
      }
      壊す;
    }
    ケース 'checkout.session.async_payment_succeeded': {
      const セッション = イベント.データ.オブジェクト;
      const meta = session.metadata || {};
      const methodLabel = (session.payment_method_types || []).includes('konbini') ? 'konbini' : 'bank_transfer';
      console.log('[Webhook] 非同期決済入金完了:', { type: meta.type, amount: session.amount_total, method: methodLabel });
      _stats.payments.success++;
      _stats.payments.amount += (session.amount_total || 0);
      _writePaymentToFirestore(meta, session, methodLabel).catch(e => console.error('[Webhook] Firestore書込み失敗:', e.message));
      if (SENDGRID_KEY && meta.type) {
        const label = methodLabel === 'コンビニ' ? 'コンビニ' : '銀行振込';
        _sendPaymentNotification(meta, session.amount_total, label).catch(e => console.error('[Webhook] 通知メール送信失敗:', e.message));
      }
      壊す;
    }
    ケース 'checkout.session.async_payment_failed': {
      const セッション = イベント.データ.オブジェクト;
      const meta = session.metadata || {};
      console.log('[Webhook] 非同期決済失敗/期限切れ:', { type: meta.type, amount: session.amount_total });
      _stats.payments.failed++;
      _writePaymentToFirestore(meta, session, 'async', 'failed').catch(e => console.error('[Webhook] Firestore書込み失敗:', e.message));
      壊す;
    }
    ケース 'checkout.session.expired': {
      console.log('[Webhook] セッション期限切れ:',event.data.object.id);
      壊す;
    }
    ケース 'payment_intent.payment_failed': {
      const pi = イベント.データ.オブジェクト;
      console.log('[Webhook] 決済失敗:', pi.id, pi.last_payment_error?.message);
      _stats.payments.failed++;
      壊す;
    }
    デフォルト：
      console.log('[Webhook] 未処理:', event.type);
  }
  res.json({ 受信: true });
}

// ── Webhook → Firestore 書き込み ──
非同期関数 _writePaymentToFirestore(meta, session, method, overrideStatus) {
  if (!firestoreDb) { console.log('[Firestore] Admin SDK 未初期化 → スキップ');戻る; }
  const status = overrideStatus || '支払済み';
  定数レコード = {
    stripeSessionId: session.id、タイプ: meta.type || '不明'、
    金額: Number(meta.originalAmount) || 0, プラットフォーム手数料: Number(meta.platformFee) || 0,
    totalCharged: session.amount_total || 0, メソッド: method || 'card', ステータス,
    チーム ID:meta.teamId || ''、プレイヤー ID:meta.playerId || ''、guardianId: meta.guardianId || ”、
    コーチID: meta.coachId || ''、月: meta.month || ''、請求書ID: meta.invoiceId || ''
    スレッドID: meta.threadId || ''、
    作成日時: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
    更新日時: firebaseAdmin.firestore.FieldValue.serverTimestamp()
  };
  firestoreDb.collection('payments').doc(session.id).set(record, { merge: true }); を待機します。
  console.log(`[Firestore] 決済記録書込み: ${session.id} (${meta.type}, ${status})`);
}

// 決済完了通知メール
非同期関数 _sendPaymentNotification(メタ、金額、メソッド) {
  if (!SENDGRID_KEY) が return;
  const typeLabel = {monthly_fee: '月謝', Coach_fee: 'コーチ指導料', adhoc: '都度請求' };
  const メソッドラベル = メソッド || 'カード';
  const subject = `【部勝】${typeLabel[meta.type] || '決済'}が完了しました（${methodLabel}）`;
  const 本体 = `
  <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px">
    <h2 style="color:#0ea5e9">💳決済完了のお知らせ</h2>
    <表スタイル="幅:100%;境界線折りたたみ:折りたたみ;余白:16px 0">
      <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666">種別</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">${typeLabel[meta.type] || meta.type></td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666">金額</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold">¥${(amount||0).toLocaleString()} </td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666">決済方法</td><td style="padding:8px;border-bottom:1px solid #eee">${methodLabel}</td></tr>
      ${meta.month ? `<tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666">対象月</td><td style="padding:8px;border-bottom:1px solid #eee">${meta.monthtd></tr>` : ''}
    </テーブル>
    <p style="color:#666;font-size:12px">このメールは自動送信です。部勝（ブカツ）プラットフォーム</p>
  </div>`;
  for (ADMIN_EMAILSのconstメールアドレス) {
    フェッチを待機します('https://api.sendgrid.com/v3/mail/send', {
      メソッド: 'POST'、
      ヘッダー: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SENDGRID_KEY}` },
      本文: JSON.stringify({
        パーソナライズ: [{ to: [{ email }] }],
        from: { email: 'noreply@bukka.app', name: '部勝（ブカツ）' },
        件名、内容: [{ type: 'text/html', value: body }]
      })
    });
  }
}

// ================================================================
// メール送信（SendGrid）
// ================================================================
app.post('/api/email/send', requireAuth, async(req, res) => {
  if (!SENDGRID_KEY) return res.status(503).json({ error: 'メール機能未設定' });
  const ip = req.ip;
  if (!rateLimit(ip + '_email', 10, 60000)) {
    return res.status(429).json({ error: 'メール送信制限に達しました' });
  }
  _stats.emails.total++;
  試す {
    const { to、toName、subject、body } = req.body;
    if (!to || !subject) return res.status(400).json({ error: 'to, subject は必須です' });
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
      return res.status(400).json({ error: 'メールアドレスが不正です' });
    }
    if (subject.length > 200) return res.status(400).json({ error: '件名が長すぎます' });
    if (body && body.length > 50000) return res.status(400).json({ error: '本文が大きすぎます' });
    const sgRes = フェッチを待機('https://api.sendgrid.com/v3/mail/send', {
      メソッド: 'POST'、
      ヘッダー: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SENDGRID_KEY}` },
      本文: JSON.stringify({
        パーソナライズ: [{ to: [{ email: to, name: toName || '' }] }],
        from: { email: 'noreply@bukka.app', name: '部勝（ブカツ）' },
        件名、内容: [{ type: 'text/html', value: body }]
      })
    });
    sgRes.ok || sgRes.status === 202 の場合
      _stats.emails.success++;
      res.json({ ok: true });
    } それ以外 {
      const err = sgRes.text() を待機します。
      console.error('[SendGrid] エラー:', err);
      _stats.emails.failed++;
      res.status(500).json({ エラー: 'メール送信失敗' });
    }
  } キャッチ (e) {
    console.error('[メール] エラー:', e.message);
    _stats.emails.failed++;
    res.status(500).json({ error: 'メール処理に失敗しました' });
  }
});

// ================================================================
// メールテンプレート（定型メール送信）
// ================================================================
定数EMAIL_TEMPLATES = {
  支払いリマインダー: {
    subject: '【部勝】月謝のお支払いのお願い',
    本文: (データ) => `
    <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px">
      <h2 style="color:#0ea5e9">📋 月謝のお支払いのお願い</h2>
      <p>${data.playerName || '保護者'}様</p>
      <p>${データ.チーム名 || 'チーム'}の${data.month || '今月'}分の月謝（¥${(data.amount||0).toLocaleString()}）のお支払いがまだ確認できません。</p>
      <p>有効ですが、アプリからお支払いをお願いいたします。</p>
      <p style="color:#666;font-size:12px;margin-top:24px">部勝（ブカツ）プラットフォーム</p>
    </div>`
  },
  いらっしゃいませ： {
    subject: '【部勝】ようこそ！登録が完了しました',
    本文: (データ) => `
    <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px">
      <h2 style="color:#0ea5e9">🎉 ようこそ！</h2>
      <p>${data.name || 'ユーザー'}様</p>
      <p>部勝（ブカツ）への登録が完了しました。</p>
      <p>ロール: <strong>${data.role || '未設定'}</strong></p>
      <p>アプリにログインして、チーム運営を始めましょう！</p>
      <p style="color:#666;font-size:12px;margin-top:24px">部勝（ブカツ）プラットフォーム</p>
    </div>`
  },
  イベントリマインダー: {
    subject: '【部勝】イベントのお知らせ',
    本文: (データ) => `
    <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px">
      <h2 style="color:#0ea5e9">📅イベントのお知らせ</h2>
      <p>${データ.チーム名 || 'チーム'}のイベントが予定されています。</p>
      <p><strong>${data.eventTitle || 'イベント'}</strong></p>
      <p>日時: ${data.date || '未定'}</p>
      <p>場所: ${data.location || '未定'}</p>
      <p style="color:#666;font-size:12px;margin-top:24px">部勝（ブカツ）プラットフォーム</p>
    </div>`
  }
};

app.post('/api/email/template', requireAuth, async(req, res) => {
  if (!SENDGRID_KEY) return res.status(503).json({ error: 'メール機能未設定' });
  const ip = req.ip;
  if (!rateLimit(ip + '_email', 10, 60000)) {
    return res.status(429).json({ error: 'メール送信制限に達しました' });
  }
  試す {
    const { to、toName、テンプレート、データ } = req.body;
    if (!to || !template) return res.status(400).json({ error: 'to, template は必須です' });
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
      return res.status(400).json({ error: 'メールアドレスが不正です' });
    }
    const tmpl = EMAIL_TEMPLATES[テンプレート];
    if (!tmpl) return res.status(400).json({ error: `不明なテンプレート: ${template}`, available: Object.keys(EMAIL_TEMPLATES) });
    const sgRes = フェッチを待機('https://api.sendgrid.com/v3/mail/send', {
      メソッド: 'POST'、
      ヘッダー: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SENDGRID_KEY}` },
      本文: JSON.stringify({
        パーソナライズ: [{ to: [{ email: to, name: toName || '' }] }],
        from: { email: 'noreply@bukka.app', name: '部勝（ブカツ）' },
        件名: tmpl.subject、コンテンツ: [{ タイプ: 'text/html'、値: tmpl.body(data || {}) }]
      })
    });
    sgRes.ok || sgRes.status === 202 の場合
      _stats.emails.success++;
      res.json({ ok: true, テンプレート });
    } それ以外 {
      _stats.emails.failed++;
      res.status(500).json({ エラー: 'メール送信失敗' });
    }
  } キャッチ (e) {
    _stats.emails.failed++;
    res.status(500).json({ error: 'メールテンプレートに送信失敗しました' });
  }
});

// ================================================================
// 定期タスク（Cron の処理）
// ================================================================
NODE_ENV === 'production'の場合{
  setInterval(非同期() => {
    試す {
      `https://bukatsu-backend.onrender.com/health` の取得を待機します。
      console.log('[KeepAlive] ping 正常');
    } キャッチ (e) {
      console.warn('[KeepAlive] ping に失敗しました:', e.message);
    }
  }, 14 * 60 * 1000);
}

setInterval(() => {
  const mem = プロセス.memoryUsage();
  console.log(`[統計] 要求:${_stats.totalRequests} エラー:${_stats.errors} ヒープ:${Math.round(mem.heapUsed/1024/1024)}MB 支払い:${_stats.payments.success}/${_stats.payments.total} AI:${_stats.ai.success}/${_stats.ai.total} (G:${_stats.ai.providers.gemini||0} Q:${_stats.ai.providers.groq||0} O:${_stats.ai.providers.openrouter||0})`);
}, 3600000);

// ================================================================
// APIバージョニング・ドキュメント
// ================================================================
app.get('/api/v1/docs', (req, res) => {
  res.json({
    バージョン: 'v34',
    エンドポイント: {
      health: { メソッド: 'GET', パス: '/health', auth: false, desc: 'サーバー確認状態' },
      ai_chat: { メソッド: 'POST', パス: '/api/ai/chat', auth: 'required', desc: 'AI会話（マルチプロバイダー: Gemini/Groq/OpenRouter）' },
      Stripe_monthly: { メソッド: 'POST', パス: '/create-tuition-session', auth: 'optional', desc: '月謝決済セッション作成' },
      ストライプ_コーチ: { メソッド: 'POST', パス: '/create-coach-payment-session', auth: 'optional', desc: 'コーチ代決済セッション作成' },
      ストライプ_アドホック: { メソッド: 'POST', パス: '/create-adhoc-payment-session', auth: 'optional', desc: '都度請求決済セッション作成' },
      ストライプステータス: { メソッド: 'GET', パス: '/session-status/:id', auth: 'optional', desc: '決済セッション状態確認' },
      stripe_connect: { method: 'POST', path: '/create-connect-account', auth: 'optional', desc: 'Stripe Connectアカウント作成' },
      email_send: { メソッド: 'POST', パス: '/api/email/send', 認証: '必須', 説明: 'メール送信' },
      email_template: { メソッド: 'POST', パス: '/api/email/template', 認証: '必須', 説明: 'テンプレートメール送信' },
      webhook: { メソッド: 'POST'、パス: '/api/webhook'、認証: 'stripe'、説明: 'Stripe Webhook' },
      admin_stats: { メソッド: 'GET', パス: '/api/admin/stats', 認証: 'admin', desc: 'サーバー統計' },
      admin_logs: { メソッド: 'GET', パス: '/api/admin/logs', 認証: 'admin', desc: 'リクエストログ' },
      admin_endpoints: { メソッド: 'GET', パス: '/api/admin/endpoints', auth: 'admin', desc: 'エンドポイント統計' },
      admin_payments: { メソッド: 'GET', パス: '/api/admin/payments', auth: 'admin', desc: '決済統計' },
      admin_blocked: { メソッド: 'GET', パス: '/api/admin/blocked', 認証: 'admin', desc: 'ブロックIP一覧' },
      Team_player_data: { メソッド: 'GET', パス: '/api/team/player-data/:localId', auth: 'required', desc: '選手トレーニング・データ食事取得' },
      Team_players_summary: { method: 'POST', path: '/api/team/players-summary', auth: 'required', desc: '複数選手概要一括取得' },
      admin_unblock: { メソッド: 'POST', パス: '/api/admin/unblock', 認証: 'admin', desc: 'IPブロック解除' },
    }
  });
});

// ── 404ハンドラー ──
app.use((req, res) => {
  res.status(404).json({ error: 'エンドポイントが見つかりません', path: req.path, docs: '/api/v1/docs' });
});

// ── エラーハンドラー ──
app.use((err, req, res, next) => {
  console.error('[エラー]', err.message);
  _stats.errors++;
  if (err.message?.includes('CORS')) {
    return res.status(403).json({ error: 'CORS: このオリジンからのアクセスは許可されていない' });
  }
  res.status(500).json({ error: 'サーバーエラー' });
});

// ── 未処理例外のキャッチ ──
プロセス.on('uncaughtException', (err) => {
  console.error('[FATAL] キャッチされない例外:', err.message);
  _stats.errors++;
});
process.on('unhandledRejection', (理由) => {
  console.error('[致命的] 未処理の拒否:', 理由);
  _stats.errors++;
});

// ── 起動 ──
app.listen(PORT, () => {
  const aiProviders = [GEMINI_KEY && 'Gemini', GROQ_KEY && 'Groq', OPENROUTER_KEY && 'OpenRouter'].filter(Boolean);
  console.log(`🚀 起動完了 port:${PORT} env:${NODE_ENV}`);
  console.log(` AI: ${aiProviders.length ? aiProviders.join(' → ') + ' (フォールバック順)' : '❌ 全プロバイダー未設定'}`);
  console.log(` Stripe: ${STRIPE_KEY ? '✅' : '❌'} SendGrid: ${SENDGRID_KEY ? '✅' : '❌'} Webhook: ${STRIPE_WH_SECRET ? '✅' : '❌'}`);
  console.log(` Admin: ${ADMIN_EMAILS.length ? ADMIN_EMAILS.join(', ') : '未設定'}`);
  console.log(` オリジン: ${allowedOrigins.join(', ')}`);
});
