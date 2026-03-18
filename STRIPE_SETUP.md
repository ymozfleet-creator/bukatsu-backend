# MyCOACH-MyTEAM Stripe決済バックエンド

## セットアップ手順（初回のみ・約30分）

### 前提条件
- Node.js 20以上
- Firebase CLI (`npm install -g firebase-tools`)
- Stripeアカウント（https://dashboard.stripe.com）

### Step 1: Stripeキーの取得

1. https://dashboard.stripe.com/apikeys にアクセス
2. 以下をメモ:
   - **Secret key**: `sk_test_xxx` または `sk_live_xxx`
   - **Publishable key**: `pk_test_xxx`（フロントエンドでは使用しない）

### Step 2: Firebase Functions の設定

```bash
cd stripe-backend

# Firebase プロジェクトに接続
firebase use myteam-mycoach

# Stripe秘密鍵を設定（テスト用）
firebase functions:config:set stripe.secret_key="sk_test_ここにテスト秘密鍵"

# 本番移行時は sk_live に変更
# firebase functions:config:set stripe.secret_key="sk_live_ここに本番秘密鍵"

# アプリURLを設定
firebase functions:config:set app.url="https://myteam-mycoach.web.app"
```

### Step 3: デプロイ

```bash
cd functions
npm install

cd ..
firebase deploy --only functions --project myteam-mycoach
```

デプロイ完了後、以下のURLが発行されます:
- API: `https://us-central1-myteam-mycoach.cloudfunctions.net/api`
- Webhook: `https://us-central1-myteam-mycoach.cloudfunctions.net/stripeWebhook`

### Step 4: Stripe Webhook の設定

1. https://dashboard.stripe.com/webhooks にアクセス
2. 「エンドポイントを追加」をクリック
3. URL: `https://us-central1-myteam-mycoach.cloudfunctions.net/stripeWebhook`
4. 監視するイベント:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `customer.subscription.deleted`
   - `charge.refunded`
   - `payment_intent.payment_failed`
5. 作成後「署名シークレット」(`whsec_xxx`)をコピー
6. Firebase に設定:

```bash
firebase functions:config:set stripe.webhook_secret="whsec_ここにWebhookシークレット"
firebase deploy --only functions
```

### Step 5: フロントエンドの接続

`src/js/03-config-data.js` の `API_BASE` を変更:

```javascript
const API_BASE = 'https://us-central1-myteam-mycoach.cloudfunctions.net/api';
```

ビルド → デプロイ:
```bash
cd ../mycoach-project
bash build.sh
firebase deploy --only hosting
```

---

## API一覧

| メソッド | エンドポイント | 認証 | 説明 |
|---------|-------------|------|------|
| POST | `/api/create-tuition-session` | ✅ | 月謝Checkout Session作成 |
| POST | `/api/create-coach-payment-session` | ✅ | コーチ代Checkout Session作成 |
| POST | `/api/create-adhoc-payment-session` | ✅ | 単発請求Checkout Session作成 |
| GET | `/api/session-status/:id` | ✅ | 決済状態確認 |
| POST | `/api/refund` | ✅管理者 | 返金処理 |
| POST | `/api/cancel-subscription` | ✅ | サブスクリプション停止 |
| GET | `/api/payment-history` | ✅ | 請求履歴取得 |
| GET | `/api/admin/stripe-dashboard` | ✅管理者 | 管理者ダッシュボード |
| GET | `/api/health` | - | ヘルスチェック |
| POST | `/stripeWebhook` | Stripe署名 | Webhook受信 |

## 5つの課題の解決状況

| 課題 | 解決方法 |
|------|---------|
| 決済済みなのに反映されない | Webhook `checkout.session.completed` でFirestore直接更新 |
| 退会後も課金が続く | `/api/cancel-subscription` でStripe即時キャンセル |
| 返金漏れ | `/api/refund` でStripe Refund API + ログ記録 |
| 請求履歴が追えない | 全決済をFirestore `payment_logs` に永続記録 |
| 証跡が出せない | サーバー側タイムスタンプ付きログ（改ざん不可） |
