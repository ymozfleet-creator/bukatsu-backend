// 03 - API設定, DB定義, デモデータ, ロール定数, ページルーティング定義
// ==================== API 設定 ====================
// バックエンドURL: window.MC_API_BASE で環境ごとに切り替え可能
// バックエンドなしの場合: Gemini API直接呼出し + フォールバックUI
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

// ==================== PAGE ROUTING ====================
// ==================== AUTH ENTRY ====================
// ================================================================
// DEMO MODE — 本番データと完全分離
// デモモードでは本番DBを退避し、独立したデモ専用DBで動作。
// Firestore/localStorage/リスナーには一切触れない。終了時に本番DBを復元。
// ================================================================

var _prodDB_backup = null;

var _demoRoles = [
  {id:'demo_team',  name:'デモ チーム管理者', role:'team',   email:'team@demo.app',   label:'チーム管理者', icon:'fa-users',           color:'#0ea5e9'},
  {id:'demo_c1',    name:'山田 太郎（コーチ）',role:'coach',  email:'coach@demo.app',  label:'コーチ',       icon:'fa-chalkboard-user', color:'#f97316'},
  {id:'demo_p1',    name:'佐藤 健太（選手）',  role:'player', email:'player@demo.app', label:'選手',         icon:'fa-running',         color:'#16a34a'},
  {id:'demo_parent',name:'佐藤（保護者）',     role:'parent', email:'parent@demo.app', label:'保護者',       icon:'fa-user-friends',    color:'#a855f7'},
  {id:'demo_al1',   name:'田中 一郎（OBOG）',  role:'alumni', email:'al1@demo.app',    label:'OB/OG',        icon:'fa-graduation-cap',  color:'#64748b'}
];

function _createDemoDB(){
  return {
    currentUser:null,
    teams:[{id:'demo_team',name:'FC サンプル',sport:'サッカー',area:'東京都',members:12,fee:5000,code:'DEMO01',coach:'demo_c1',color:'#0ea5e9',createdAt:'2025-01-01'}],
    coaches:[
      {id:'demo_c1',name:'山田 太郎',sport:'サッカー',spec:'フィジカル',area:'東京都',price:30000,rating:4.8,reviews:23,exp:8,bio:'JFA公認C級。ジュニアユース指導歴8年。',avail:false,team:'demo_team',verified:true,color:'#0ea5e9',createdAt:'2025-01-15'},
      {id:'demo_c2',name:'佐藤 花子',sport:'サッカー',spec:'GKコーチ',area:'神奈川県',price:25000,rating:4.5,reviews:11,exp:5,bio:'元なでしこリーグGK。キーパー専門指導。',avail:true,team:null,verified:true,color:'#7c3aed',createdAt:'2025-02-01'}
    ],
    players:[
      {id:'demo_p1',name:'佐藤 健太',team:'demo_team',pos:'FW',number:10,joinedAt:'2025-01-01',createdAt:'2025-01-01',parentId:'demo_parent'},
      {id:'demo_p2',name:'田中 翔',team:'demo_team',pos:'MF',number:11,joinedAt:'2025-01-01',createdAt:'2025-01-01'},
      {id:'demo_p3',name:'鈴木 陽向',team:'demo_team',pos:'DF',number:12,joinedAt:'2025-01-01',createdAt:'2025-01-01'},
      {id:'demo_p4',name:'高橋 蓮',team:'demo_team',pos:'GK',number:13,joinedAt:'2025-01-01',createdAt:'2025-01-01'},
      {id:'demo_p5',name:'伊藤 悠真',team:'demo_team',pos:'MF',number:14,joinedAt:'2025-01-01',createdAt:'2025-01-01'}
    ],
    alumni:[
      {id:'demo_al1',name:'田中 一郎',email:'al1@demo.app',teamId:'demo_team',teamName:'FC サンプル',gradYear:2018,currentJob:'エンジニア',company:'IT企業',industry:'IT・テクノロジー',canVisit:true,visitTopics:['キャリア相談'],createdAt:'2025-01-01',userId:'demo_al1'},
      {id:'demo_al2',name:'鈴木 花子',email:'al2@demo.app',teamId:'demo_team',teamName:'FC サンプル',gradYear:2020,currentJob:'営業',company:'メーカー',industry:'メーカー',canVisit:true,visitTopics:['業界研究'],createdAt:'2025-02-01',userId:'demo_al2'},
      {id:'demo_al3',name:'高橋 健',email:'al3@demo.app',teamId:'demo_team',teamName:'FC サンプル',gradYear:2015,currentJob:'コンサルタント',company:'外資系コンサル',industry:'コンサル',canVisit:false,createdAt:'2025-01-15',userId:'demo_al3'}
    ],
    requests:[{id:'demo_req1',teamId:'demo_team',coachId:'demo_c1',status:'contracted',type:'team_to_coach',contractType:'monthly',createdAt:'2025-01-20',contractedAt:'2025-01-25'}],
    payThreads:[{id:'demo_pt1',teamId:'demo_team',coachId:'demo_c1',status:'active',contractAmount:30000,teamPays:33000,coachReceives:27000,month:'2025-03',createdAt:'2025-01-25',invoices:[{id:'demo_inv1',month:'2025-02',status:'paid',teamPays:33000,coachReceives:27000,platformFee:3000,paidAt:'2025-02-28',note:'2月分 指導料'}],messages:[{from:'system',text:'本契約が成立しました。',time:'2025/1/25 10:00'}]}],
    payments:[{id:'demo_pay1',teamId:'demo_team',coachId:'demo_c1',amount:33000,fee:3000,month:'2025-02',status:'paid',paidAt:'2025-02-28'}],
    coachPay:[],disclosures:[],
    events:[{id:'demo_ev1',title:'練習',type:'practice',year:2025,month:2,date:'15',time:'16:00',teamId:'demo_team'}],
    notifs:[],
    chats:{demo_chat1:{name:'山田太郎コーチ',sub:'契約中',type:'match',coachId:'demo_c1',teamId:'demo_team',reqId:'demo_req1',msgs:[{mid:'m1',from:'demo_team',name:'FC サンプル',text:'よろしくお願いします！',time:'10:00',date:'2025-01-25',read:true},{mid:'m2',from:'demo_c1',name:'山田太郎',text:'来週から練習に参加します。よろしくお願いします。',time:'10:05',date:'2025-01-25',read:true}],unread:0}},
    meals:{},mealHistory:{},myFoods:[],doneSets:{},settings:{},
    trainingLog:{},conditionLog:{},bodyLog:{},injuryHistory:{},
    moderationLog:[],userWarnings:{},suspendedUsers:{},
    teamMatches:[],teamEvents:[],teamReviews:[],coachReviews:[],attendance:{},
    adhocInvoices:[],emailLog:[],teamFeeRates:{},
    announcements:[],customWorkouts:[],nutritionLog:{},
    inventory:[{id:'di1',name:'サッカーボール 5号',quantity:8,condition:'良好',teamId:'demo_team'},{id:'di2',name:'ビブス（赤）',quantity:15,condition:'良好',teamId:'demo_team'},{id:'di3',name:'マーカーコーン',quantity:2,condition:'残少',teamId:'demo_team'}],
    teamFiles:[],matchHistory:{},mealTemplates:[],
    stripeSetupNeeded:false,playerMealHistory:{},nutriGoals:{},
    consentLog:[],auditLog:[],
    foodKnowledge:{}
  };
}

// LP インラインデモ画面（登録不要プレビュー）
var _lpDemoIdx = 0;
var _lpDemoScreens = [
  // 0: チーム管理者
  function(){return '<div style="display:flex;gap:12px;margin-bottom:14px">'+
    '<div style="flex:1;padding:12px;background:#f0fdf4;border-radius:10px;text-align:center"><div style="font-size:22px;font-weight:800;color:#16a34a">12</div><div style="font-size:10px;color:#16a34a;font-weight:600">選手</div></div>'+
    '<div style="flex:1;padding:12px;background:#eff6ff;border-radius:10px;text-align:center"><div style="font-size:22px;font-weight:800;color:#0ea5e9">2</div><div style="font-size:10px;color:#0ea5e9;font-weight:600">契約コーチ</div></div>'+
    '<div style="flex:1;padding:12px;background:#fff7ed;border-radius:10px;text-align:center"><div style="font-size:22px;font-weight:800;color:#f97316">¥120k</div><div style="font-size:10px;color:#f97316;font-weight:600">今月の月謝</div></div>'+
    '<div style="flex:1;padding:12px;background:#f1f5f9;border-radius:10px;text-align:center"><div style="font-size:22px;font-weight:800;color:#64748b">3</div><div style="font-size:10px;color:#64748b;font-weight:600">OBOG</div></div>'+
    '</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'+
    '<div style="padding:12px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0"><div style="font-size:11px;font-weight:700;color:#0f172a;margin-bottom:8px"><i class="fas fa-chalkboard-user" style="color:#0ea5e9;margin-right:4px"></i>契約コーチ</div>'+
    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><div style="width:28px;height:28px;border-radius:50%;background:#0ea5e9;color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700">山</div><div><div style="font-size:11px;font-weight:600">山田 太郎</div><div style="font-size:9px;color:#64748b">担当 5名 · 選手情報開示中</div></div></div>'+
    '<div style="display:flex;gap:4px"><span style="font-size:9px;padding:2px 6px;background:#eff6ff;color:#0284c7;border-radius:4px;font-weight:600">担当選手を設定</span><span style="font-size:9px;padding:2px 6px;background:#f0fdf4;color:#16a34a;border-radius:4px;font-weight:600">レポート確認</span></div></div>'+
    '<div style="padding:12px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0"><div style="font-size:11px;font-weight:700;color:#0f172a;margin-bottom:8px"><i class="fas fa-credit-card" style="color:#16a34a;margin-right:4px"></i>月謝状況</div>'+
    '<div style="display:flex;gap:6px;margin-bottom:6px"><div style="flex:1;text-align:center;padding:4px;background:#f0fdf4;border-radius:6px"><div style="font-size:14px;font-weight:800;color:#16a34a">9</div><div style="font-size:8px;color:#16a34a">支払済</div></div><div style="flex:1;text-align:center;padding:4px;background:#fef3c7;border-radius:6px"><div style="font-size:14px;font-weight:800;color:#d97706">2</div><div style="font-size:8px;color:#d97706">未払い</div></div><div style="flex:1;text-align:center;padding:4px;background:#f8fafc;border-radius:6px"><div style="font-size:14px;font-weight:800;color:#94a3b8">1</div><div style="font-size:8px;color:#94a3b8">請求前</div></div></div>'+
    '<div style="height:4px;background:#e2e8f0;border-radius:2px;overflow:hidden"><div style="width:75%;height:100%;background:#16a34a;border-radius:2px"></div></div></div>'+
    '</div>';},
  // 1: コーチ
  function(){return '<div style="display:flex;gap:12px;margin-bottom:14px">'+
    '<div style="flex:1;padding:12px;background:#eff6ff;border-radius:10px;text-align:center"><div style="font-size:22px;font-weight:800;color:#0ea5e9">5</div><div style="font-size:10px;color:#0ea5e9;font-weight:600">担当選手</div></div>'+
    '<div style="flex:1;padding:12px;background:#f0fdf4;border-radius:10px;text-align:center"><div style="font-size:22px;font-weight:800;color:#16a34a">¥30k</div><div style="font-size:10px;color:#16a34a;font-weight:600">今月の報酬</div></div>'+
    '<div style="flex:1;padding:12px;background:#fef3c7;border-radius:10px;text-align:center"><div style="font-size:22px;font-weight:800;color:#d97706">4.8</div><div style="font-size:10px;color:#d97706;font-weight:600">評価 ★</div></div>'+
    '</div>'+
    '<div style="padding:12px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0"><div style="font-size:11px;font-weight:700;color:#0f172a;margin-bottom:8px"><i class="fas fa-running" style="color:#f97316;margin-right:4px"></i>担当選手コンディション</div>'+
    '<div style="display:flex;flex-direction:column;gap:6px">'+
    '<div style="display:flex;align-items:center;gap:8px"><div style="width:24px;height:24px;border-radius:50%;background:#16a34a;color:#fff;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700">佐</div><div style="flex:1;font-size:11px;font-weight:600">佐藤 健太</div><div style="padding:2px 8px;background:#f0fdf4;border-radius:4px;font-size:10px;font-weight:700;color:#16a34a">92</div><div style="font-size:9px;color:#64748b">良好</div></div>'+
    '<div style="display:flex;align-items:center;gap:8px"><div style="width:24px;height:24px;border-radius:50%;background:#0ea5e9;color:#fff;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700">田</div><div style="flex:1;font-size:11px;font-weight:600">田中 翔</div><div style="padding:2px 8px;background:#fef3c7;border-radius:4px;font-size:10px;font-weight:700;color:#d97706">68</div><div style="font-size:9px;color:#d97706">注意</div></div>'+
    '<div style="display:flex;align-items:center;gap:8px"><div style="width:24px;height:24px;border-radius:50%;background:#f97316;color:#fff;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700">鈴</div><div style="flex:1;font-size:11px;font-weight:600">鈴木 陽向</div><div style="padding:2px 8px;background:#f0fdf4;border-radius:4px;font-size:10px;font-weight:700;color:#16a34a">85</div><div style="font-size:9px;color:#64748b">良好</div></div>'+
    '</div></div>';},
  // 2: 選手
  function(){return '<div style="text-align:center;margin-bottom:12px"><div style="font-size:11px;color:#64748b;margin-bottom:4px">今日のコンディション</div><div style="font-size:42px;font-weight:900;color:#16a34a">92<span style="font-size:14px;color:#64748b">/100</span></div></div>'+
    '<div style="display:flex;gap:8px;margin-bottom:14px">'+
    '<div style="flex:1;padding:8px;background:#eff6ff;border-radius:8px;text-align:center"><div style="font-size:14px;font-weight:800;color:#0ea5e9">7.5h</div><div style="font-size:9px;color:#0ea5e9">睡眠</div></div>'+
    '<div style="flex:1;padding:8px;background:#fef3c7;border-radius:8px;text-align:center"><div style="font-size:14px;font-weight:800;color:#d97706">3/5</div><div style="font-size:9px;color:#d97706">疲労</div></div>'+
    '<div style="flex:1;padding:8px;background:#fce7f3;border-radius:8px;text-align:center"><div style="font-size:14px;font-weight:800;color:#db2777">4/5</div><div style="font-size:9px;color:#db2777">メンタル</div></div>'+
    '</div>'+
    '<div style="padding:10px 12px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0">'+
    '<div style="font-size:11px;font-weight:700;margin-bottom:6px"><i class="fas fa-utensils" style="color:#f97316;margin-right:4px"></i>今日の食事 <span style="font-weight:400;color:#64748b">2,180 kcal</span></div>'+
    '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px"><div style="font-size:9px;color:#64748b;width:20px">PFC</div><div style="flex:1;height:10px;border-radius:5px;overflow:hidden;display:flex"><div style="width:35%;background:#3b82f6"></div><div style="width:30%;background:#f97316"></div><div style="width:35%;background:#22c55e"></div></div></div>'+
    '<div style="display:flex;justify-content:space-around;font-size:9px;margin-top:4px"><span style="color:#3b82f6;font-weight:600">P 82g</span><span style="color:#f97316;font-weight:600">F 65g</span><span style="color:#22c55e;font-weight:600">C 290g</span></div>'+
    '</div>';},
  // 3: 保護者
  function(){return '<div style="padding:12px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:12px">'+
    '<div style="font-size:11px;font-weight:700;margin-bottom:8px"><i class="fas fa-child" style="color:#a855f7;margin-right:4px"></i>佐藤 健太 の状況</div>'+
    '<div style="display:flex;gap:8px">'+
    '<div style="flex:1;text-align:center;padding:8px;background:#f0fdf4;border-radius:8px"><div style="font-size:16px;font-weight:800;color:#16a34a">92</div><div style="font-size:9px;color:#16a34a">体調</div></div>'+
    '<div style="flex:1;text-align:center;padding:8px;background:#eff6ff;border-radius:8px"><div style="font-size:16px;font-weight:800;color:#0ea5e9">7.5h</div><div style="font-size:9px;color:#0ea5e9">睡眠</div></div>'+
    '<div style="flex:1;text-align:center;padding:8px;background:#fef3c7;border-radius:8px"><div style="font-size:16px;font-weight:800;color:#d97706">2,180</div><div style="font-size:9px;color:#d97706">kcal</div></div>'+
    '</div></div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'+
    '<div style="padding:10px;background:#fff7ed;border-radius:10px;border:1px solid #fed7aa;text-align:center"><div style="font-size:18px;margin-bottom:2px"><i class="fas fa-yen-sign" style="color:#f97316"></i></div><div style="font-size:11px;font-weight:700;color:#0f172a">月謝支払い</div><div style="font-size:9px;color:#16a34a;font-weight:600;margin-top:2px">3月分 支払済</div></div>'+
    '<div style="padding:10px;background:#f5f3ff;border-radius:10px;border:1px solid #ddd6fe;text-align:center"><div style="font-size:18px;margin-bottom:2px"><i class="fas fa-comments" style="color:#7c3aed"></i></div><div style="font-size:11px;font-weight:700;color:#0f172a">チームチャット</div><div style="font-size:9px;color:#7c3aed;font-weight:600;margin-top:2px">2件の新着</div></div>'+
    '</div>';},
  // 4: OBOG
  function(){return '<div style="padding:12px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:12px">'+
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><div style="font-size:11px;font-weight:700"><i class="fas fa-graduation-cap" style="color:#64748b;margin-right:4px"></i>マイ OBOG情報</div><div style="font-size:9px;color:#64748b">2018年卒</div></div>'+
    '<div style="display:flex;gap:8px">'+
    '<div style="flex:1;text-align:center;padding:8px;background:#f0fdf4;border-radius:8px"><div style="font-size:12px;font-weight:800;color:#16a34a">訪問OK</div><div style="font-size:9px;color:#16a34a">ステータス</div></div>'+
    '<div style="flex:1;text-align:center;padding:8px;background:#eff6ff;border-radius:8px"><div style="font-size:12px;font-weight:800;color:#0ea5e9">IT企業</div><div style="font-size:9px;color:#0ea5e9">勤務先</div></div>'+
    '</div></div>'+
    '<div style="padding:12px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0">'+
    '<div style="font-size:11px;font-weight:700;margin-bottom:8px"><i class="fas fa-school" style="margin-right:4px;color:#64748b"></i>FC サンプル の現況</div>'+
    '<div style="display:flex;gap:6px;margin-bottom:6px">'+
    '<div style="flex:1;text-align:center;padding:6px;background:#fff;border-radius:6px;border:1px solid #e2e8f0"><div style="font-size:14px;font-weight:800">12</div><div style="font-size:8px;color:#64748b">選手数</div></div>'+
    '<div style="flex:1;text-align:center;padding:6px;background:#fff;border-radius:6px;border:1px solid #e2e8f0"><div style="font-size:14px;font-weight:800">3</div><div style="font-size:8px;color:#64748b">OB/OG</div></div>'+
    '<div style="flex:1;text-align:center;padding:6px;background:#fff;border-radius:6px;border:1px solid #e2e8f0"><div style="font-size:14px;font-weight:800;color:#f97316">2</div><div style="font-size:8px;color:#64748b">支援リスト</div></div>'+
    '</div></div>';}
];

function lpDemoSwitch(idx){
  window._lpDemoIdx = idx;
  var screen = document.getElementById('lp-demo-screen');
  if(screen){
    screen.style.opacity = '0';
    setTimeout(function(){
      screen.innerHTML = _lpDemoScreens[idx]();
      screen.style.opacity = '1';
    }, 150);
  }
  // ボタンのスタイル更新
  var colors = ['#0ea5e9','#f97316','#16a34a','#a855f7','#64748b'];
  var btns = document.querySelectorAll('.lp-demo-btn');
  btns.forEach(function(btn, i){
    if(i === idx){
      btn.style.border = '1.5px solid ' + colors[i];
      btn.style.background = colors[i] + '12';
      btn.style.color = colors[i];
    } else {
      btn.style.border = '1px solid #e2e8f0';
      btn.style.background = '#fff';
      btn.style.color = '#64748b';
    }
  });
}

// 初期表示
document.addEventListener('DOMContentLoaded', function(){
  setTimeout(function(){
    var s = document.getElementById('lp-demo-screen');
    if(s && !s.innerHTML.trim()) s.innerHTML = _lpDemoScreens[0]();
  }, 500);
});

function openDemoMode(roleIndex){
  _prodDB_backup = JSON.stringify(DB);
  window._demoMode = true;
  var demoDB = _createDemoDB();
  Object.keys(DB).forEach(function(k){ delete DB[k]; });
  Object.keys(demoDB).forEach(function(k){ DB[k] = demoDB[k]; });
  var ri = roleIndex || 0;
  var dr = _demoRoles[ri];
  DB.currentUser = {id:dr.id, name:dr.name, role:dr.role, email:dr.email};
  if(dr.role==='parent'){ DB.currentUser.childId='demo_p1'; DB.currentUser.childName='佐藤 健太'; DB.currentUser.teamId='demo_team'; }
  document.getElementById('landing').style.display='none';
  document.getElementById('app').style.display='';
  launchApp();
  setTimeout(function(){_showDemoBanner(ri);},300);
}

function _showDemoBanner(activeIdx){
  var existing=document.getElementById('demo-banner');
  if(existing)existing.remove();
  var banner=document.createElement('div');
  banner.id='demo-banner';
  banner.style.cssText='position:fixed;top:0;left:0;right:0;z-index:9999;background:#0f172a;color:#fff;padding:6px 12px;font-size:11px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap;box-shadow:0 2px 8px rgba(0,0,0,.3)';
  var btns=_demoRoles.map(function(dr,i){
    var active=i===activeIdx;
    return '<button onclick="switchDemoRole('+i+')" style="padding:4px 10px;border-radius:6px;font-size:10px;font-weight:'+(active?'700':'500')+';cursor:pointer;border:'+(active?'1.5px solid '+dr.color:'1px solid rgba(255,255,255,.2)')+';background:'+(active?dr.color+'22':'transparent')+';color:'+(active?dr.color:'rgba(255,255,255,.6)')+';display:flex;align-items:center;gap:4px"><i class="fas '+dr.icon+'" style="font-size:9px"></i>'+dr.label+'</button>';
  }).join('');
  banner.innerHTML='<span style="opacity:.6;margin-right:4px"><i class="fas fa-play-circle"></i> デモ</span>'+btns+'<button onclick="exitDemoMode()" style="background:rgba(239,68,68,.2);border:1px solid rgba(239,68,68,.4);color:#fca5a5;border-radius:6px;padding:4px 10px;font-size:10px;font-weight:600;cursor:pointer;margin-left:6px">終了</button>';
  document.body.appendChild(banner);
  document.getElementById('app').style.paddingTop='40px';
}

function switchDemoRole(roleIndex){
  var dr=_demoRoles[roleIndex];
  DB.currentUser={id:dr.id,name:dr.name,role:dr.role,email:dr.email};
  if(dr.role==='parent'){ DB.currentUser.childId='demo_p1'; DB.currentUser.childName='佐藤 健太'; DB.currentUser.teamId='demo_team'; }
  document.getElementById('sb-name').textContent=dr.name;
  document.getElementById('sb-role').textContent=ROLE_LABEL[dr.role]||dr.role;
  _updateAvi(); buildNav(dr.role); goTo('dashboard');
  _showDemoBanner(roleIndex);
  toast(dr.label+'の画面に切り替えました','s');
}

function exitDemoMode(){
  window._demoMode = false;
  var banner=document.getElementById('demo-banner');
  if(banner)banner.remove();
  document.getElementById('app').style.paddingTop='';
  if(_prodDB_backup){
    try { var restored=JSON.parse(_prodDB_backup);
    Object.keys(DB).forEach(function(k){ delete DB[k]; });
    Object.keys(restored).forEach(function(k){ DB[k] = restored[k]; }); } catch(e){}
    _prodDB_backup=null;
  }
  document.getElementById('app').style.display='none';
  showLanding();
}


function showAuth(mode, preRole) {
  show('auth');
  if (mode === 'register') {
    switchAuth('register');
    // ランディングページからroleプリセット
    if(preRole && ['team','coach','player','parent'].includes(preRole)){
      setTimeout(()=>selectRegRole(preRole), 100);
    }
  } else {
    switchAuth('login');
  }
  window.scrollTo({top: 0, behavior: 'smooth'});
}

// ===== 事務局 秘密アクセス（ロゴ5回タップ） =====
let _adminKnocks=0,_adminTimer=null;
function adminKnock(){
  clearTimeout(_adminTimer);
  _adminKnocks++;
  if(_adminKnocks>=5){
    _adminKnocks=0;
    openM('\uD83D\uDD10 管理者アクセス',`
      <div style="text-align:center;margin-bottom:20px">
        <div style="width:56px;height:56px;background:linear-gradient(135deg,#f97316,#ef4444);border-radius:16px;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;box-shadow:0 4px 16px rgba(249,115,22,.4)">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="white"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
        </div>
        <div style="font-size:15px;font-weight:700;color:var(--txt1);margin-bottom:4px">管理者専用アクセス</div>
        <div style="font-size:12px;color:var(--txt3)">6〜8桁PINコードを入力してください</div>
      </div>
      <div id="admin-pin-dots" style="display:flex;justify-content:center;gap:8px;align-items:center;margin-bottom:20px;min-height:20px"></div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;max-width:240px;margin:0 auto 12px">
        ${[1,2,3,4,5,6,7,8,9,'',0,'\u232B'].map((n,i)=>n===''?'<div></div>':`<button onclick="pinInput('${n}')" style="padding:14px;border-radius:10px;border:1px solid var(--b2);background:var(--surf2);font-size:18px;font-weight:700;color:var(--txt1);cursor:pointer;transition:background .15s" onmouseover="this.style.background='var(--surf3)'" onmouseout="this.style.background='var(--surf2)'">${n}</button>`).join('')}
      </div>
      <div id="pin-error" style="text-align:center;color:#ef4444;font-size:12px;margin-top:8px;display:none">PINコードが違います</div>
        <b id="pin-plain-val" style="color:var(--org);letter-spacing:6px;font-size:22px;font-family:monospace">••••</b>
      </div>
      <div style="display:flex;gap:8px;margin-top:10px;justify-content:center">
        <button onclick="openM('🔑 PIN変更',adminPinChangeForm())" style="background:none;border:1px solid var(--bdr);color:var(--txt3);font-size:11px;cursor:pointer;padding:6px 12px;border-radius:8px">🔑 PINを変更</button>
        <button onclick="forceResetAdminPin().then(()=>{const el=document.getElementById('pin-plain-val');if(el)el.textContent='••••';})" style="background:none;border:1px solid rgba(239,68,68,.3);color:#ef4444;font-size:11px;cursor:pointer;padding:6px 12px;border-radius:8px">↩ デフォルトにリセット</button>
      </div>
    `);
    // PIN平文を表示（非同期初期化完了後）
    _initAdminPin().then(()=>{
      const pinEl=document.getElementById('pin-plain-val');
      if(pinEl) pinEl.textContent='••••';
    });
    window._pinVal='';
    updatePinDots();
  }
  _adminTimer=setTimeout(()=>_adminKnocks=0,2000);
}
let _pinVal='';
function pinInput(v){
  if(v==='\u232B'){_pinVal=_pinVal.slice(0,-1);}
  else if(String(v).trim()&&_pinVal.length<8){_pinVal+=v;}
  updatePinDots();
}
function updatePinDots(){
  var dotsEl = document.getElementById('admin-pin-dots');
  if(!dotsEl) return;
  var h = '';
  for(var i=0;i<8;i++){
    var filled = i < _pinVal.length;
    h += '<div style="width:12px;height:12px;border-radius:50%;background:'+(filled?'var(--org)':'var(--b2)')+';border:2px solid var(--b2);transition:background .2s"></div>';
  }
  if(_pinVal.length >= 4) {
    h += '<button onclick="submitPin()" style="margin-left:8px;padding:4px 12px;border-radius:8px;border:1px solid var(--org);background:var(--org);color:#fff;font-size:12px;font-weight:700;cursor:pointer">→ 確認</button>';
  }
  dotsEl.innerHTML = h;
}
function submitPin(){
  if(_pinVal.length >= 4){
    var enteredPin = _pinVal;
    verifyAdminPin(enteredPin).then(function(ok){
      if(ok){
        closeM();
        // Direct admin login (don't use doLogin with fake password)
        var adminUser = _getUsers().find(function(u){return u.role==='admin';});
        if(adminUser){
          DB.currentUser = {
            role: adminUser.role,
            name: adminUser.name,
            email: adminUser.email,
            id: adminUser.id,
            createdAt: adminUser.createdAt
          };
          if(!DB.settings) DB.settings = {};
          DB.settings.loginTimestamp = new Date().toISOString();
          if(typeof aiHistory !== 'undefined') aiHistory = [];
          if(typeof loadAIHistory === 'function') loadAIHistory();
          saveDB();
          if(typeof addAuditLog === 'function') addAuditLog('admin_login','管理者PINでログイン');
          toast('管理者としてログインしました','s');
          launchApp();
        } else {
          _setupAdminAccount();
        }
      } else {
        var errEl=document.getElementById('pin-error');
        if(errEl){errEl.style.display='block';errEl.textContent='PINが違います（残り'+Math.max(0,PIN_MAX_ATTEMPTS-_pinAttempts.count)+'回）';}
        setTimeout(function(){_pinVal='';updatePinDots();if(errEl)errEl.style.display='none';},1500);
      }
    });
  }
}

function toggleSpMenu() {
  const m = document.getElementById('sp-menu');
  if (m) m.classList.toggle('open');
}

