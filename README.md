# MyCOACH-MyTEAM ソースコード管理ガイド

## プロジェクト構造

```
mycoach-project/
├── build.sh                  ← ビルドスクリプト（これを実行）
├── README.md                 ← このファイル
├── firebase.json             ← Firebase Hosting設定（セキュリティヘッダー含む）
├── firestore.rules           ← Firestoreセキュリティルール
├── public/
│   └── index.html            ← ビルド出力（デプロイ対象）
└── src/
    ├── html/
    │   ├── head.html          ← HTMLヘッダー、メタタグ、OGP、CSP
    │   └── body.html          ← ランディングページ、アプリ構造HTML
    ├── styles/
    │   └── main.css           ← 全CSSスタイル（2,589行）
    ├── js/
    │   ├── 01-core-utils.js       ← ユーティリティ、セキュリティ基盤
    │   ├── 02-charts-dashdata.js  ← Chart.js、ダッシュボードデータ
    │   ├── 03-config-data.js      ← DB定義、API設定、デモデータ
    │   ├── 04-auth.js             ← 認証（ログイン/登録/PIN/Google）
    │   ├── 05-onboarding.js       ← オンボーディングウィザード
    │   ├── 06-storage-sync.js     ← localStorage + Firestore同期
    │   ├── 07-app-navigation.js   ← ルーティング、ナビ、ページ遷移
    │   ├── 08-reports-widgets.js  ← レポート、Stripe決済、プロフィール
    │   ├── 09-admin-dashboard.js  ← 管理者ダッシュボード
    │   ├── 10-admin-operations.js ← 管理者操作（エクスポート等）
    │   ├── 11-payments.js         ← 決済管理、手数料計算
    │   ├── 12-team-pages.js       ← チーム管理画面
    │   ├── 13-coach-pages.js      ← コーチ画面、収益管理
    │   ├── 14-player-pages.js     ← 選手画面、コンディション
    │   ├── 15-nutrition.js        ← 栄養管理、食品DB（176品）
    │   ├── 16-training.js         ← トレーニング管理
    │   ├── 17-ai-advisor.js       ← AIアドバイザー（Gemini）
    │   ├── 18-chat.js             ← チャット、メッセージング
    │   ├── 19-disclosure-matching.js ← 情報開示、マッチング
    │   ├── 20-misc-export.js      ← 物品管理、エクスポート、設定
    │   ├── 21-legal.js            ← 利用規約、プライバシーポリシー
    │   ├── 22-firebase-startup.js ← Firebase初期化、アプリ起動
    │   └── 90-hardening.js        ← セキュリティ強化（本番用）
    ├── vendor/
    │   └── sentry-ga.html         ← Sentry + Google Analytics
    └── firebase/
        └── firebase-module.html   ← Firebase SDK初期化
```

## ビルド & デプロイ

```bash
# 1. ビルド（分割ソース → 1つのHTML）
bash build.sh

# 2. デプロイ
firebase deploy --only hosting

# 3. Firestoreルールも更新する場合
firebase deploy --only firestore:rules
```

## 修正の手順

### 例: 栄養管理の食品DBに新しい食品を追加したい
→ `src/js/15-nutrition.js` を編集 → `bash build.sh` → デプロイ

### 例: ログイン処理を修正したい
→ `src/js/04-auth.js` を編集 → `bash build.sh` → デプロイ

### 例: CSSデザインを変更したい
→ `src/styles/main.css` を編集 → `bash build.sh` → デプロイ

### 例: ランディングページを更新したい
→ `src/html/body.html` を編集 → `bash build.sh` → デプロイ

## モジュール依存関係

```
01-core-utils ← 全モジュールが依存（sanitize, RateLimit, SessionMgr）
03-config-data ← DB定義。ほぼ全モジュールが参照
06-storage-sync ← saveDB/loadDB。データを変更する全モジュールが使用
07-app-navigation ← goTo/refreshPage。画面遷移する全モジュールが使用
04-auth → 06-storage-sync（ログイン後のデータ読込）
05-onboarding → 04-auth（登録フロー）
12-team-pages → 19-disclosure-matching（情報開示ボタン）
17-ai-advisor → 15-nutrition（栄養データ参照）
22-firebase-startup → 全モジュール（起動時に各機能を初期化）
```

## セキュリティ管理

| 変更対象 | ファイル |
|---------|---------|
| CSPヘッダー | `src/html/head.html` |
| Firestoreルール | `firestore.rules` |
| HTTPヘッダー | `firebase.json` |
| 認証・PIN | `src/js/04-auth.js` |
| セキュリティ強化 | `src/js/90-hardening.js` |
| セッション管理 | `src/js/01-core-utils.js` + `src/js/22-firebase-startup.js` |

## 管理者PIN（デフォルト: 000000）

初回デプロイ後、管理者ダッシュボードから必ず6桁以上に変更してください。
