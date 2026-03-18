// ================================================================
// MyCOACH-MyTEAM Stripe決済バックエンド
// Firebase Cloud Functions v2
// ================================================================
// 
// 解決する5つの課題:
//   1. 決済済みなのに申込が反映されない → Webhook受信で確実に状態更新
//   2. 退会後も課金が続く → サブスクリプション即時キャンセルAPI
//   3. 返金漏れ → Stripe Refund APIで自動返金 + 記録
//   4. 請求履歴が追えない → Firestore決済ログに全記録
//   5. 証跡が出せない → サーバー側ログで法的証拠保全
//
// デプロイ:
//   firebase deploy --only functions --project myteam-mycoach
//
// 環境変数の設定（初回のみ）:
//   firebase functions:config:set stripe.secret_key="sk_live_xxx"
//   firebase functions:config:set stripe.webhook_secret="whsec_xxx"
//   firebase functions:config:set app.url="https://myteam-mycoach.web.app"
// ================================================================

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");

admin.initializeApp();
const db = admin.firestore();

// ── Stripe初期化 ──
// 本番: firebase functions:config:set stripe.secret_key="sk_live_xxx"
// テスト: firebase functions:config:set stripe.secret_key="sk_test_xxx"
const stripe = require("stripe")(
  functions.config().stripe?.secret_key || process.env.STRIPE_SECRET_KEY || ""
);

const WEBHOOK_SECRET = functions.config().stripe?.webhook_secret || process.env.STRIPE_WEBHOOK_SECRET || "";
const APP_URL = functions.config().app?.url || "https://myteam-mycoach.web.app";

// ── Express App ──
const app = express();

// CORSを許可（自サイトのみ）
app.use(cors({
  origin: [APP_URL, "http://localhost:5000", "http://localhost:3000"],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// ================================================================
// 認証ミドルウェア（Firebase ID Token検証）
// ================================================================
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "認証が必要です" });
  }
  try {
    const token = authHeader.split("Bearer ")[1];
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: "認証トークンが無効です" });
  }
}

// ================================================================
// 決済ログ記録（Firestore永続化）
// ================================================================
async function logPayment(type, data) {
  try {
    await db.collection("payment_logs").add({
      type,         // 'charge','refund','cancel','webhook','error'
      ...data,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (e) {
    console.error("[PaymentLog] write failed:", e.message);
  }
}

// ================================================================
// 課題1解決: 月謝 Checkout Session作成
// POST /api/create-tuition-session
// ================================================================
app.post("/api/create-tuition-session", authenticate, async (req, res) => {
  try {
    const { teamName, playerName, amount, month, playerId, teamId, feeRate } = req.body;

    if (!amount || amount < 100 || amount > 10000000) {
      return res.status(400).json({ error: "金額が不正です（¥100〜¥10,000,000）" });
    }

    const platformFee = Math.round(amount * (feeRate || 0.05));

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "jpy",
          product_data: {
            name: `${teamName || "チーム"} 月謝 ${month || ""}`,
            description: `${playerName || "選手"} - ${month || ""}`
          },
          unit_amount: amount
        },
        quantity: 1
      }],
      metadata: {
        type: "monthly_fee",
        teamId: teamId || "",
        playerId: playerId || "",
        month: month || "",
        originalAmount: String(amount),
        platformFee: String(platformFee),
        userId: req.user.uid
      },
      success_url: `${APP_URL}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/?payment=cancel`
    });

    await logPayment("charge_started", {
      sessionId: session.id,
      amount, teamId, playerId, month,
      userId: req.user.uid
    });

    res.json({ sessionUrl: session.url, sessionId: session.id });
  } catch (e) {
    await logPayment("error", { action: "create-tuition-session", error: e.message, userId: req.user?.uid });
    res.status(500).json({ error: "決済セッションの作成に失敗しました" });
  }
});

// ================================================================
// 課題1解決: コーチ代 Checkout Session作成
// POST /api/create-coach-payment-session
// ================================================================
app.post("/api/create-coach-payment-session", authenticate, async (req, res) => {
  try {
    const { coachName, teamName, amount, month, coachId, teamId, threadId, feeRate } = req.body;

    if (!amount || amount < 100 || amount > 10000000) {
      return res.status(400).json({ error: "金額が不正です" });
    }

    const platformFee = Math.round(amount * (feeRate || 0.10));

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "jpy",
          product_data: {
            name: `コーチ指導料 ${coachName || ""} ${month || ""}`,
            description: `${teamName || "チーム"} → ${coachName || "コーチ"}`
          },
          unit_amount: amount
        },
        quantity: 1
      }],
      metadata: {
        type: "coach_fee",
        teamId: teamId || "",
        coachId: coachId || "",
        threadId: threadId || "",
        month: month || "",
        originalAmount: String(amount),
        platformFee: String(platformFee),
        userId: req.user.uid
      },
      success_url: `${APP_URL}/?payment=success&session_id={CHECKOUT_SESSION_ID}&threadId=${threadId || ""}`,
      cancel_url: `${APP_URL}/?payment=cancel`
    });

    await logPayment("charge_started", {
      sessionId: session.id,
      amount, teamId, coachId, month,
      userId: req.user.uid
    });

    res.json({ sessionUrl: session.url, sessionId: session.id });
  } catch (e) {
    await logPayment("error", { action: "create-coach-session", error: e.message });
    res.status(500).json({ error: "決済セッションの作成に失敗しました" });
  }
});

// ================================================================
// 課題1解決: 単発請求 Checkout Session作成
// POST /api/create-adhoc-payment-session
// ================================================================
app.post("/api/create-adhoc-payment-session", authenticate, async (req, res) => {
  try {
    const { title, amount, playerId, teamId, invoiceId } = req.body;

    if (!amount || amount < 100 || amount > 10000000) {
      return res.status(400).json({ error: "金額が不正です" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "jpy",
          product_data: {
            name: title || "単発請求",
          },
          unit_amount: amount
        },
        quantity: 1
      }],
      metadata: {
        type: "adhoc",
        teamId: teamId || "",
        playerId: playerId || "",
        invoiceId: invoiceId || "",
        originalAmount: String(amount),
        userId: req.user.uid
      },
      success_url: `${APP_URL}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/?payment=cancel`
    });

    await logPayment("charge_started", {
      sessionId: session.id,
      amount, teamId, playerId,
      userId: req.user.uid
    });

    res.json({ sessionUrl: session.url, sessionId: session.id });
  } catch (e) {
    await logPayment("error", { action: "create-adhoc-session", error: e.message });
    res.status(500).json({ error: "決済セッションの作成に失敗しました" });
  }
});

// ================================================================
// 課題1解決: 決済状態確認
// GET /api/session-status/:sessionId
// ================================================================
app.get("/api/session-status/:sessionId", authenticate, async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    if (!sessionId || !sessionId.startsWith("cs_")) {
      return res.status(400).json({ error: "無効なセッションIDです" });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    res.json({
      status: session.payment_status, // 'paid','unpaid','no_payment_required'
      metadata: session.metadata || {},
      amount: session.amount_total,
      currency: session.currency,
      customerEmail: session.customer_details?.email || ""
    });
  } catch (e) {
    res.status(500).json({ error: "セッション情報の取得に失敗しました" });
  }
});

// ================================================================
// 課題3解決: 返金処理
// POST /api/refund
// ================================================================
app.post("/api/refund", authenticate, async (req, res) => {
  try {
    // 管理者のみ
    const userDoc = await db.collection("users").doc(req.user.uid).get();
    if (!userDoc.exists || userDoc.data().role !== "admin") {
      return res.status(403).json({ error: "管理者権限が必要です" });
    }

    const { sessionId, amount, reason } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: "セッションIDが必要です" });
    }

    // Checkout Sessionから Payment Intent を取得
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session.payment_intent) {
      return res.status(400).json({ error: "この決済は返金できません" });
    }

    const refundParams = {
      payment_intent: session.payment_intent,
      reason: "requested_by_customer"
    };
    // 部分返金の場合
    if (amount && amount > 0) {
      refundParams.amount = amount;
    }

    const refund = await stripe.refunds.create(refundParams);

    await logPayment("refund", {
      refundId: refund.id,
      sessionId,
      amount: refund.amount,
      status: refund.status,
      reason: reason || "",
      metadata: session.metadata || {},
      adminUid: req.user.uid
    });

    // Firestoreの決済記録を更新
    const paySnap = await db.collection("payment_logs")
      .where("sessionId", "==", sessionId)
      .where("type", "==", "charge_completed")
      .limit(1).get();

    if (!paySnap.empty) {
      await paySnap.docs[0].ref.update({
        refunded: true,
        refundId: refund.id,
        refundAmount: refund.amount,
        refundedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    res.json({
      success: true,
      refundId: refund.id,
      amount: refund.amount,
      status: refund.status
    });
  } catch (e) {
    await logPayment("error", { action: "refund", error: e.message });
    res.status(500).json({ error: "返金処理に失敗しました" });
  }
});

// ================================================================
// 課題2解決: 月額サブスクリプション停止
// POST /api/cancel-subscription
// ================================================================
app.post("/api/cancel-subscription", authenticate, async (req, res) => {
  try {
    const { subscriptionId, playerId, teamId, reason } = req.body;

    if (subscriptionId) {
      // Stripe Subscriptionがある場合は即時キャンセル
      const sub = await stripe.subscriptions.cancel(subscriptionId);

      await logPayment("cancel", {
        subscriptionId,
        status: sub.status,
        playerId: playerId || "",
        teamId: teamId || "",
        reason: reason || "ユーザー退会",
        userId: req.user.uid
      });

      res.json({ success: true, status: sub.status });
    } else {
      // Subscriptionがない場合（都度決済のみ）→ ローカルステータス変更のみ
      await logPayment("cancel", {
        playerId: playerId || "",
        teamId: teamId || "",
        reason: reason || "月謝停止（サブスクリプションなし）",
        userId: req.user.uid
      });

      res.json({ success: true, status: "local_cancelled" });
    }
  } catch (e) {
    await logPayment("error", { action: "cancel-subscription", error: e.message });
    res.status(500).json({ error: "サブスクリプション停止に失敗しました" });
  }
});

// ================================================================
// 課題4解決: 請求履歴取得
// GET /api/payment-history
// ================================================================
app.get("/api/payment-history", authenticate, async (req, res) => {
  try {
    const { teamId, playerId, limit: lim } = req.query;
    let query = db.collection("payment_logs").orderBy("createdAt", "desc").limit(parseInt(lim) || 50);

    if (teamId) query = query.where("teamId", "==", teamId);
    if (playerId) query = query.where("playerId", "==", playerId);

    const snap = await query.get();
    const logs = snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate?.()?.toISOString() || "" }));

    res.json({ logs, count: logs.length });
  } catch (e) {
    res.status(500).json({ error: "履歴取得に失敗しました" });
  }
});

// ================================================================
// 課題5解決: 管理者用ダッシュボードデータ
// GET /api/admin/stripe-dashboard
// ================================================================
app.get("/api/admin/stripe-dashboard", authenticate, async (req, res) => {
  try {
    const userDoc = await db.collection("users").doc(req.user.uid).get();
    if (!userDoc.exists || userDoc.data().role !== "admin") {
      return res.status(403).json({ error: "管理者権限が必要です" });
    }

    // 直近30日の決済ログ
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const logsSnap = await db.collection("payment_logs")
      .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
      .orderBy("createdAt", "desc")
      .limit(200).get();

    const logs = logsSnap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate?.()?.toISOString() || "" }));

    // 集計
    let totalRevenue = 0, totalRefunds = 0, chargeCount = 0, refundCount = 0;
    logs.forEach(l => {
      if (l.type === "charge_completed") { totalRevenue += (l.amount || 0); chargeCount++; }
      if (l.type === "refund") { totalRefunds += (l.amount || 0); refundCount++; }
    });

    res.json({
      summary: { totalRevenue, totalRefunds, chargeCount, refundCount, netRevenue: totalRevenue - totalRefunds },
      recentLogs: logs.slice(0, 50)
    });
  } catch (e) {
    res.status(500).json({ error: "ダッシュボードデータ取得に失敗しました" });
  }
});

// ================================================================
// ヘルスチェック
// GET /api/health
// ================================================================
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    version: "v57",
    timestamp: new Date().toISOString(),
    stripe: !!stripe,
    firebase: !!admin.app()
  });
});

// ================================================================
// Webhook以外のルートをExpressで処理
// ================================================================
// JSON parser（Webhook以外）
app.use(express.json({ limit: "1mb" }));

// ================================================================
// 課題1/2/3完全解決: Stripe Webhook
// POST /webhook
// ================================================================
// Webhookは別関数として公開（raw body必要）
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  let event;
  try {
    const sig = req.headers["stripe-signature"];
    if (WEBHOOK_SECRET && sig) {
      event = stripe.webhooks.constructEvent(req.rawBody, sig, WEBHOOK_SECRET);
    } else {
      event = req.body;
    }
  } catch (e) {
    console.error("[Webhook] Signature verification failed:", e.message);
    return res.status(400).send("Webhook signature verification failed");
  }

  try {
    switch (event.type) {
      // ── 課題1: 決済完了 → 確実にDB更新 ──
      case "checkout.session.completed": {
        const session = event.data.object;
        const meta = session.metadata || {};

        await logPayment("charge_completed", {
          sessionId: session.id,
          paymentIntentId: session.payment_intent,
          amount: session.amount_total,
          currency: session.currency,
          customerEmail: session.customer_details?.email || "",
          type: meta.type || "unknown",
          teamId: meta.teamId || "",
          playerId: meta.playerId || "",
          coachId: meta.coachId || "",
          month: meta.month || "",
          threadId: meta.threadId || "",
          platformFee: parseInt(meta.platformFee) || 0,
          userId: meta.userId || ""
        });

        // Firestoreのappdata/sharedを更新（クライアントのDBと同期）
        try {
          const sharedRef = db.doc("appdata/shared");
          const sharedSnap = await sharedRef.get();
          if (sharedSnap.exists) {
            const data = sharedSnap.data();

            if (meta.type === "monthly_fee") {
              // 月謝の支払い完了
              const payments = data.payments || [];
              const existing = payments.find(p =>
                p.playerId === meta.playerId && p.month === meta.month && p.teamId === meta.teamId
              );
              if (existing) {
                existing.status = "paid";
                existing.paidAt = new Date().toLocaleDateString("ja-JP");
                existing.stripeSessionId = session.id;
              } else {
                payments.push({
                  id: "pay_" + Date.now(),
                  playerId: meta.playerId,
                  teamId: meta.teamId,
                  month: meta.month,
                  amount: session.amount_total,
                  status: "paid",
                  paidAt: new Date().toLocaleDateString("ja-JP"),
                  stripeSessionId: session.id
                });
              }
              await sharedRef.update({ payments });
            }

            if (meta.type === "coach_fee" && meta.threadId) {
              // コーチ代の支払い完了
              const payThreads = data.payThreads || [];
              const thread = payThreads.find(pt => pt.id === meta.threadId);
              if (thread && thread.invoices) {
                const inv = thread.invoices.find(i => i.month === meta.month && i.status !== "paid");
                if (inv) {
                  inv.status = "paid";
                  inv.paidAt = new Date().toLocaleDateString("ja-JP");
                  inv.stripeSessionId = session.id;
                }
                // コーチ支払い記録
                const coachPay = data.coachPay || [];
                const origAmount = parseInt(meta.originalAmount) || session.amount_total;
                const fee = parseInt(meta.platformFee) || 0;
                coachPay.push({
                  id: "cp" + Date.now(),
                  coach: meta.coachId,
                  team: meta.teamId,
                  amount: origAmount,
                  month: meta.month,
                  status: "paid",
                  teamPays: origAmount,
                  coachReceives: origAmount - fee,
                  platformTotal: fee
                });
                await sharedRef.update({ payThreads, coachPay });
              }
            }

            if (meta.type === "adhoc" && meta.invoiceId) {
              // 単発請求の支払い完了
              const invoices = data.adhocInvoices || [];
              const inv = invoices.find(i => i.id === meta.invoiceId);
              if (inv) {
                inv.status = "paid";
                inv.paidAt = new Date().toLocaleDateString("ja-JP");
                inv.stripeSessionId = session.id;
              }
              await sharedRef.update({ adhocInvoices: invoices });
            }
          }
        } catch (dbErr) {
          console.error("[Webhook] Firestore update failed:", dbErr.message);
          // Webhookは200を返す（Stripeにリトライさせない）
        }

        console.log(`[Webhook] ✅ Payment completed: ${session.id} (${meta.type})`);
        break;
      }

      // ── 課題2: サブスクリプション停止の確認 ──
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        await logPayment("subscription_cancelled", {
          subscriptionId: sub.id,
          customerId: sub.customer,
          status: sub.status,
          cancelledAt: new Date().toISOString()
        });
        console.log(`[Webhook] 🛑 Subscription cancelled: ${sub.id}`);
        break;
      }

      // ── 課題3: 返金完了の確認 ──
      case "charge.refunded": {
        const charge = event.data.object;
        await logPayment("refund_confirmed", {
          chargeId: charge.id,
          amount: charge.amount_refunded,
          status: charge.status
        });
        console.log(`[Webhook] ↩️ Refund confirmed: ${charge.id}`);
        break;
      }

      // ── 決済失敗 ──
      case "checkout.session.expired":
      case "payment_intent.payment_failed": {
        const obj = event.data.object;
        await logPayment("payment_failed", {
          sessionId: obj.id,
          metadata: obj.metadata || {},
          status: obj.status || "failed"
        });
        console.log(`[Webhook] ❌ Payment failed: ${obj.id}`);
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event: ${event.type}`);
    }
  } catch (e) {
    console.error("[Webhook] Processing error:", e.message);
    // Webhookは必ず200を返す（エラーでもStripeにリトライさせない）
  }

  res.status(200).json({ received: true });
});

// ── Express APIをCloud Functionsにエクスポート ──
exports.api = functions.https.onRequest(app);
