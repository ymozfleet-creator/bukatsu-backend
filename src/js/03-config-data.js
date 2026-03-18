// 03-config-data.js — API, DB schema, data
const API_BASE = (typeof window !== 'undefined' && window.MC_API_BASE)
  ? window.MC_API_BASE
  : '';

// API認証ヘッダー取得ヘルパー
async function _apiHeaders(){
  let token='';
  try{ token=await window._fbAuth?.currentUser?.getIdToken()||''; }catch(e){}
  return {'Content-Type':'application/json','Authorization':'Bearer '+token};
}

// ==================== DATA ====================
const DEMO_COACHES = [];
const DEMO_TEAMS = [];
const DB = {
  currentUser: null,
  currentRole: 'admin',
  onboardingStep: 0,
  pendingRole: 'team',

  // ============================================================
  // 本番環境: すべてのデータは空の状態で開始
  // 管理者がコーチ・チーム・選手を手動で登録します
  // ============================================================
  coaches:    [],
  teams:      [],
  players:    [],
  payments:   [],
  coachPay:   [],
  adhocInvoices: [],  // 都度請求: [{id,teamId,playerId,guardianId,title,amount,fee,status,createdAt,paidAt}]
  teamMatches: [],    // マッチング申請: [{id,teamAId,teamBId,status:pending|matched|rejected,...}]
  teamEvents: [],      // 試合・練習イベント: [{id,matchId,teamAId,teamBId,purpose,date,status,...}]
  teamFeeRates: {},   // チーム別手数料率: {teamId: {monthlyFee:10, coachFee:10, adhocFee:10, goodsFee:10}}
  teamReviews: [],    // チームレビュー: [{id,matchId,fromTeamId,toTeamId,rating,comment,createdAt}]
  coachReviews: [],   // コーチレビュー
  attendance: {},      // 出欠管理
  moderationLog: [],
  userWarnings: {},
  suspendedUsers: {},
  payThreads: [],

  meals: { today: [], water: 0 },
  // AI学習: 食事履歴・マイ食品
  mealHistory: {},   // { '2026-02-26': [{name,kcal,protein,...,type,time},...] }
  myFoods: [],       // [{name,kcal,protein,...,count,lastUsed,source}] ユーザー学習済み食品
  foodKnowledge: {}, // チーム共有AI食品学習DB: {正規化名: {name,kcal,protein,carb,fat,...,samples:n,confidence:0-100,corrections:[],lastUpdated}}
  // Training log
  trainingLog: {},
  // Body & condition log (体重・体脂肪・コンディション記録)
  bodyLog: {},      // { playerId: { '2026-02-25': {weight:65,bodyFat:12,muscle:55,...} } }
  conditionLog: {}, // { playerId: { '2026-02-25': {mood:4,fatigue:2,sleep:8,pain:'',painParts:[],painLevel:0,injuryType:'',participation:'full',recovery:'',note:''} } }
  injuryHistory: {}, // { playerId: [{date,parts,level,type,participation,recovery,note}] }
  matchHistory: [], // [{eventId,date,title,opponent,homeScore,awayScore,outcome,mvp,rating,teamId}]
  // Exercises done today
  doneSets: {},
  chats: {
    'g1': {name:'全体連絡（事務局)',sub:'管理者専用・全ユーザーへの連絡',avi:'📢',msgs:[{mid:_genMsgId(),from:'admin',name:'事務局',text:'MyCOACH-MyTEAMへようこそ！ご不明点は事務局までお問い合わせください。',time:new Date().toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'}),read:false},
    ],unread:1},
  },
  requests: [],
  alumni: [], // OBOG: [{id,name,email,teamId,gradYear,currentJob,company,industry,message,photo,canVisit,visitTopics,createdAt,userId}]

  disclosures: [],

  notifs: [],
  events: [],
  settings: { theme: 'light', accent: null },
  announcements: [],
  customWorkouts: [],
  nutritionLog: {},
  inventory: [],
  teamFiles: [],
  emailLog: [],
  auditLog: [],
};

const ROLE_NAV = {
  admin:[
    {cat:'メイン'},
    {k:'dashboard',i:'fa-chart-line',l:'ダッシュボード'},
    {cat:'ユーザー管理'},
    {k:'coaches',i:'fa-whistle',l:'コーチ管理'},
    {k:'teams',i:'fa-shield-alt',l:'チーム管理'},
    {k:'admin-players',i:'fa-running',l:'選手・保護者管理'},
    {cat:'収益管理'},
    {k:'payments',i:'fa-yen-sign',l:'決済管理'},
    {k:'threads',i:'fa-yen-sign',l:'お支払い'},
    {k:'admin-data',i:'fa-database',l:'データ管理'},
    {cat:'コミュニケーション'},
    {k:'chat',i:'fa-comments',l:'メッセージ'},
    {cat:'システム'},
    {k:'calendar',i:'fa-calendar-alt',l:'スケジュール'},
    {k:'settings',i:'fa-cog',l:'設定'},
  ],
  team:[
    {cat:'メイン'},
    {k:'dashboard',i:'fa-chart-line',l:'ダッシュボード'},
    {cat:'マッチング'},
    {k:'coach-search',i:'fa-users',l:'コーチ管理'},
    {k:'team-match',i:'fa-futbol',l:'チームマッチング'},
    {k:'threads',i:'fa-yen-sign',l:'お支払い'},
    {cat:'チーム管理'},
    {k:'my-team',i:'fa-users-cog',l:'マイチーム'},
    {k:'player-ranking',i:'fa-trophy',l:'選手ランキング'},
    {k:'fee',i:'fa-money-bill-wave',l:'月謝管理'},
    {k:'inventory',i:'fa-boxes',l:'物品管理'},
    {k:'team-files',i:'fa-folder-open',l:'資料・動画共有'},
    {k:'alumni-mgmt',i:'fa-graduation-cap',l:'OBOG管理'},
    {cat:'分析'},
    {k:'player-compare',i:'fa-chart-bar',l:'選手比較'},
    {k:'weekly-report',i:'fa-file-alt',l:'週次レポート'},
    {k:'data-export',i:'fa-download',l:'データエクスポート'},
    {k:'ai-prediction',i:'fa-brain',l:'AI予測'},
    {cat:'コミュニケーション'},
    {k:'chat',i:'fa-comments',l:'メッセージ'},
    {k:'calendar',i:'fa-calendar-alt',l:'スケジュール'},
    {cat:'アカウント'},
    {k:'bookmarks',i:'fa-star',l:'ブックマーク'},
    {k:'profile-settings',i:'fa-user-edit',l:'設定・プロフィール'},
  ],
  coach:[
    {cat:'メイン'},
    {k:'dashboard',i:'fa-chart-line',l:'ダッシュボード'},
    {cat:'指導管理'},
    {k:'coach-players',i:'fa-running',l:'担当選手'},
    {k:'coach-report',i:'fa-chart-bar',l:'選手レポート'},
    {cat:'マッチング'},
    {k:'team-search',i:'fa-search',l:'チームを探す'},
    {k:'threads',i:'fa-yen-sign',l:'お支払い'},
    {k:'earnings',i:'fa-yen-sign',l:'収益管理'},
    {cat:'コミュニケーション'},
    {k:'shared-files',i:'fa-folder-open',l:'チーム資料'},
    {k:'chat',i:'fa-comments',l:'メッセージ'},
    {k:'schedule',i:'fa-calendar-check',l:'スケジュール'},
    {cat:'アカウント'},
    {k:'profile-settings',i:'fa-user-circle',l:'プロフィール・設定'},
  ],
  player:[
    {cat:'メイン'},
    {k:'dashboard',i:'fa-chart-line',l:'ダッシュボード'},
    {cat:'トレーニング'},
    {k:'nutrition',i:'fa-utensils',l:'食事管理'},
    {k:'training',i:'fa-dumbbell',l:'トレーニング'},
    {k:'stats',i:'fa-running',l:'マイ成績'},
    {cat:'サポート'},
    {k:'shared-files',i:'fa-folder-open',l:'チーム資料'},
    {k:'ai',i:'fa-robot',l:'AI アドバイザー'},
    {k:'chat',i:'fa-comments',l:'メッセージ'},
    {k:'calendar',i:'fa-calendar-alt',l:'スケジュール'},
    {cat:'アカウント'},
    {k:'profile-settings',i:'fa-user-circle',l:'プロフィール・設定'},
  ],
  parent:[
    {cat:'メイン'},
    {k:'dashboard',i:'fa-chart-line',l:'ダッシュボード'},
    {cat:'支払い管理'},
    {k:'parent-fee',i:'fa-yen-sign',l:'月謝・支払い'},
    {k:'parent-report',i:'fa-chart-bar',l:'お子様のレポート'},
    {cat:'コミュニケーション'},
    {k:'chat',i:'fa-comments',l:'メッセージ'},
    {k:'calendar',i:'fa-calendar-alt',l:'スケジュール'},
    {cat:'アカウント'},
    {k:'profile-settings',i:'fa-user-edit',l:'設定'},
  ],
  alumni:[
    {cat:'メイン'},
    {k:'dashboard',i:'fa-chart-line',l:'ダッシュボード'},
    {cat:'チーム情報'},
    {k:'alumni-team',i:'fa-shield-alt',l:'チーム情報'},
    {k:'alumni-news',i:'fa-bullhorn',l:'お知らせ'},
    {cat:'コミュニケーション'},
    {k:'chat',i:'fa-comments',l:'メッセージ'},
    {cat:'アカウント'},
    {k:'alumni-profile',i:'fa-id-card',l:'OBOGプロフィール'},
    {k:'profile-settings',i:'fa-user-edit',l:'設定'},
  ],
};
const ROLE_NAMES={admin:'管理者',team:'チーム代表',coach:'コーチ',player:'選手',parent:'保護者'};
const ROLE_EMAILS={}; // 本番: デモアドレス自動入力なし
const ROLE_LABEL={admin:'事務局',team:'チーム管理者',coach:'コーチ',player:'選手',parent:'保護者',alumni:'OBOG'};
const PAGE_TITLE={
  dashboard:'ダッシュボード',
  coaches:'コーチ管理',
  teams:'チーム管理',
  payments:'決済管理',
  threads:'お支払い',
  chat:'メッセージ',
  settings:'設定',
  'my-team':'マイチーム',
  'coach-search':'コーチを探す',
  'team-match':'チームマッチング',
  fee:'月謝管理',
  inventory:'物品管理',
  calendar:'スケジュール',
  schedule:'スケジュール',
  'team-search':'チームを探す',
  earnings:'収益管理',
  profile:'プロフィール',
  'profile-settings':'設定・プロフィール',
  'coach-players':'担当選手一覧',
  'coach-report':'選手レポート',
  'parent-fee':'月謝・支払い',
  'parent-report':'お子様の成績',
  nutrition:'食事管理',
  training:'トレーニング管理',
  ai:'AIアドバイザー',
  stats:'マイ成績',
  'admin-players':'選手管理',
  'admin-data':'データ管理',
  'shared-files':'共有ファイル',
  'team-files':'チームファイル',
  'team-profile-edit':'チームプロフィール編集',
  'alumni-team':'チーム情報',
  'alumni-news':'お知らせ',
  'alumni-profile':'OBOGプロフィール',
  'alumni-mgmt':'OBOG管理',
  'notifications':'通知センター',
  'player-ranking':'選手ランキング',
  'player-compare':'選手比較',
  'weekly-report':'週次レポート',
  'data-export':'データエクスポート',
  'bookmarks':'ブックマーク',
  'ai-prediction':'AIパフォーマンス予測',
};

