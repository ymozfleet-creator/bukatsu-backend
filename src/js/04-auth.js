// 04-auth.js — Auth, login, register, PIN
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

// getMyKey/getMyCoach/getMyTeam → see REQUEST MATCHING SECTION
function show(id) {
  const map={loader:'flex',landing:'block',auth:'flex',onboarding:'flex',app:'block','page-legal':'block'};
  ['loader','landing','auth','onboarding','app','page-legal'].forEach(i=>{
    const el=document.getElementById(i);
    if(el) el.style.display=i===id?(map[i]||'block'):'none';
  });
}
function showLanding(){show('landing');window.scrollTo({top:0,behavior:'smooth'})}
function showLegal(t){show('page-legal');document.getElementById('legal-body').innerHTML=t==='terms'?termsHTML():t==='tokusho'?tokushoHTML():t==='contact'?contactHTML():privacyHTML();window.scrollTo({top:0})}

// ==================== AUTH ====================
let loginRole='team',regRole='team',sigSigned=false;
function selRole(r,btn){loginRole=r;document.querySelectorAll('#role-tabs-l .role-tab').forEach(b=>b.classList.remove('active'));btn.classList.add('active');}
function selRegRole(r,btn){regRole=r;document.querySelectorAll('#auth-register .role-tab').forEach(b=>b.classList.remove('active'));btn.classList.add('active');['team','coach','player','parent'].forEach(x=>{const el=document.getElementById('reg-'+x);if(el)el.style.display=x===r?'block':'none'});}
function switchAuth(v){document.getElementById('auth-login').style.display=v==='login'?'block':'none';document.getElementById('auth-register').style.display=v==='register'?'block':'none'}

// ==================== 新登録フロー ====================

// ロールカード選択
function selectRegRole(r){
  regRole = r;
  const colors = {team:'#f97316', coach:'#0ea5e9', player:'#00cfaa', parent:'#a855f7', alumni:'#64748b'};
  const labels = {team:'チーム管理者', coach:'コーチ・指導者', player:'選手', parent:'保護者', alumni:'OBOG（卒業生）'};
  // 全カードリセット
  ['team','coach','player','parent','alumni'].forEach(x=>{
    const el = document.getElementById('rcard-'+x);
    if(!el) return;
    el.style.borderColor = 'rgba(255,255,255,.1)';
    el.style.background = 'rgba(255,255,255,.04)';
  });
  // 選択カードをハイライト
  const sel = document.getElementById('rcard-'+r);
  if(sel){
    const c = colors[r];
    sel.style.borderColor = c;
    sel.style.background = `${c}15`;
  }
  // 次へボタンを有効化
  const btn = document.getElementById('reg-role-next');
  if(btn){ btn.disabled = false; btn.style.opacity = '1'; }
}

// カードクリックで即Step2へ（ワンタップ）
function selectRegRoleAndNext(r){
  selectRegRole(r);
  // カード選択アニメ後に次ステップへ
  const colors = {team:'#f97316', coach:'#0ea5e9', player:'#00cfaa', parent:'#a855f7'};
  const c = colors[r] || 'var(--org)';
  const card = document.getElementById('rcard-'+r);
  if(card){ card.style.borderColor=c; card.style.background=c+'15'; }
  setTimeout(()=>goToRegStep2(), 200);
}

// ロール選択 → フォーム入力へ
function goToRegStep2(){
  if(!regRole){ toast('立場を選択してください','e'); return; }
  const labels = {team:'チームを登録', coach:'コーチとして登録', player:'選手として登録', parent:'保護者として登録', alumni:'OBOGとして登録'};
  const colors = {team:'#f97316', coach:'#0ea5e9', player:'#00cfaa', parent:'#a855f7', alumni:'#64748b'};
  const icons  = {team:'🏟️', coach:'🏆', player:'⚽', parent:'👨‍👩‍👧', alumni:'🎓'};
  document.getElementById('reg-step-role').style.display = 'none';
  document.getElementById('reg-step-form').style.display = 'block';
  const sp = document.getElementById('auth-social-proof');
  if(sp) sp.style.display = 'none';
  const titleEl = document.getElementById('reg-form-title');
  if(titleEl) titleEl.textContent = labels[regRole] || '情報を入力';
  const badge = document.getElementById('reg-role-badge');
  if(badge){
    badge.textContent = (icons[regRole]||'') + ' ' + {team:'チーム',coach:'コーチ',player:'選手',parent:'保護者',alumni:'OBOG'}[regRole];
    badge.style.background = colors[regRole]+'22';
    badge.style.color = colors[regRole];
    badge.style.border = '1px solid '+colors[regRole]+'44';
  }
  renderRegDynamicForm(regRole);
  const vp = document.getElementById('reg-value-prop');
  if(vp) vp.style.display = 'none';
  setTimeout(()=>{
    const first = document.querySelector('#reg-dynamic-form input');
    if(first) first.focus();
  }, 100);
}

// ロール選択に戻る
function backToRoleSelect(){
  document.getElementById('reg-step-role').style.display = 'block';
  document.getElementById('reg-step-form').style.display = 'none';
  // ロール選択に戻ったらsocial proofを表示
  const sp = document.getElementById('auth-social-proof');
  if(sp) sp.style.display = 'flex';
}

// ロール別入力フォーム（最小限の必須項目のみ）
function renderRegDynamicForm(role){
  const container = document.getElementById('reg-dynamic-form');
  if(!container) return;

  const cfg = {
    team: { label:'チーム名', ph:'例：FC Tokyo Youth', note:'' },
    coach: { label:'お名前（氏名）', ph:'例：田中 雄一', note:'' },
    player: { label:'お名前（氏名）', ph:'例：佐藤 太郎', note:'',
      extra:`<div style="margin-bottom:14px">
        <label style="font-size:12px;font-weight:600;color:rgba(255,255,255,.6);display:block;margin-bottom:6px">招待コード <span style="color:#f97316">*</span></label>
        <input id="rf-code" type="text" placeholder="例：FCT001" autocomplete="off" maxlength="10"
          style="width:100%;padding:12px 14px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:10px;color:#fff;font-size:16px;font-weight:700;letter-spacing:3px;text-transform:uppercase;outline:none;box-sizing:border-box"
          onfocus="this.style.borderColor='#f97316'" onblur="this.style.borderColor='rgba(255,255,255,.1)'" oninput="this.value=this.value.toUpperCase()">
        <div style="font-size:10px;color:rgba(255,255,255,.3);margin-top:4px">チーム管理者から発行されたコード</div>
      </div>`,
    },
    parent: { label:'保護者のお名前', ph:'例：佐藤 一郎', note:'',
      extra:`<div style="margin-bottom:14px">
        <label style="font-size:12px;font-weight:600;color:rgba(255,255,255,.6);display:block;margin-bottom:6px">招待コード <span style="color:#f97316">*</span></label>
        <input id="rf-code" type="text" placeholder="例：FCT001" autocomplete="off" maxlength="10"
          style="width:100%;padding:12px 14px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:10px;color:#fff;font-size:16px;font-weight:700;letter-spacing:3px;text-transform:uppercase;outline:none;box-sizing:border-box"
          onfocus="this.style.borderColor='#f97316'" onblur="this.style.borderColor='rgba(255,255,255,.1)'" oninput="this.value=this.value.toUpperCase()">
        <div style="font-size:10px;color:rgba(255,255,255,.3);margin-top:4px">チーム管理者から発行されたコード</div>
      </div>`,
    },
    alumni: { label:'お名前（氏名）', ph:'例：山田 太郎', note:'',
      extra:`<div style="margin-bottom:14px">
        <label style="font-size:12px;font-weight:600;color:rgba(255,255,255,.6);display:block;margin-bottom:6px">招待コード <span style="color:#f97316">*</span></label>
        <input id="rf-code" type="text" placeholder="例：T123456" autocomplete="off" maxlength="10"
          style="width:100%;padding:12px 14px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:10px;color:#fff;font-size:16px;font-weight:700;letter-spacing:3px;text-transform:uppercase;outline:none;box-sizing:border-box"
          onfocus="this.style.borderColor='#64748b'" onblur="this.style.borderColor='rgba(255,255,255,.1)'" oninput="this.value=this.value.toUpperCase()">
        <div style="font-size:10px;color:rgba(255,255,255,.3);margin-top:4px">チーム管理者から発行されたOBOG招待コード</div>
      </div>
      <div style="padding:14px;background:rgba(100,116,139,.08);border-radius:12px;margin-bottom:14px">
        <div style="font-size:12px;font-weight:700;color:rgba(255,255,255,.7);margin-bottom:10px">🎓 OBOG情報（あとから編集可能）</div>
        <div style="margin-bottom:10px">
          <label style="font-size:11px;font-weight:600;color:rgba(255,255,255,.5);display:block;margin-bottom:4px">卒業年度</label>
          <input id="rf-grad-year" type="number" min="1970" max="2030" placeholder="例：2020"
            style="width:100%;padding:10px 12px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:8px;color:#fff;font-size:15px;outline:none;box-sizing:border-box"
            onfocus="this.style.borderColor='#64748b'" onblur="this.style.borderColor='rgba(255,255,255,.1)'">
        </div>
        <div style="margin-bottom:10px">
          <label style="font-size:11px;font-weight:600;color:rgba(255,255,255,.5);display:block;margin-bottom:4px">現在の職業</label>
          <input id="rf-job" type="text" placeholder="例：エンジニア、営業、教員" maxlength="30"
            style="width:100%;padding:10px 12px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:8px;color:#fff;font-size:14px;outline:none;box-sizing:border-box"
            onfocus="this.style.borderColor='#64748b'" onblur="this.style.borderColor='rgba(255,255,255,.1)'">
        </div>
        <div>
          <label style="font-size:11px;font-weight:600;color:rgba(255,255,255,.5);display:block;margin-bottom:4px">会社・組織名（任意）</label>
          <input id="rf-company" type="text" placeholder="例：株式会社〇〇" maxlength="30"
            style="width:100%;padding:10px 12px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:8px;color:#fff;font-size:14px;outline:none;box-sizing:border-box"
            onfocus="this.style.borderColor='#64748b'" onblur="this.style.borderColor='rgba(255,255,255,.1)'">
        </div>
      </div>`,
    },
  };
  const c = cfg[role] || cfg.team;

  container.innerHTML = `
    <div style="margin-bottom:16px">
      <label style="font-size:12px;font-weight:600;color:rgba(255,255,255,.6);display:block;margin-bottom:6px">${c.label} <span style="color:#f97316">*</span></label>
      <input id="rf-name" type="text" placeholder="${c.ph}" autocomplete="name"
        style="width:100%;padding:12px 14px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:10px;color:#fff;font-size:15px;outline:none;box-sizing:border-box"
        onfocus="this.style.borderColor='#f97316'" onblur="this.style.borderColor='rgba(255,255,255,.1)'">
    </div>
    ${c.extra||''}
  `;
  const noteEl = document.getElementById('reg-agree-note');
  if(noteEl) noteEl.textContent = c.note;
}

// パスワード強度インジケーター
function updatePwStrength(pw){
  const fill = document.getElementById('pw-strength-fill');
  const label = document.getElementById('pw-strength-label');
  if(!fill||!label) return;
  let score=0;
  if(pw.length>=8) score++;
  if(/[A-Z]/.test(pw)) score++;
  if(/[0-9]/.test(pw)) score++;
  if(/[^A-Za-z0-9]/.test(pw)) score++;
  const configs=[
    {w:'0%',bg:'transparent',t:''},
    {w:'25%',bg:'#ef4444',t:'弱い'},
    {w:'50%',bg:'#f59e0b',t:'普通'},
    {w:'75%',bg:'#3b82f6',t:'強い'},
    {w:'100%',bg:'#22c55e',t:'非常に強い'},
  ];
  const cfg=configs[score]||configs[0];
  fill.style.width=cfg.w; fill.style.background=cfg.bg;
  label.textContent=cfg.t; label.style.color=cfg.bg;
}

function syncLoginEmail(v){ /* メールは自由入力 */ }

// 登録フォーム: 同意チェックボックス
let regAgreed = false;
function toggleRegAgree(){
  regAgreed = !regAgreed;
  const chk = document.getElementById('reg-agree-check');
  const wrap = document.getElementById('reg-agree-wrap');
  if(chk){
    chk.style.background = regAgreed ? 'var(--org)' : 'transparent';
    chk.style.borderColor = regAgreed ? 'var(--org)' : 'rgba(255,255,255,.25)';
    chk.innerHTML = regAgreed ? '<svg width="11" height="11" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>' : '';
  }
  if(wrap) wrap.style.borderColor = regAgreed ? 'rgba(249,115,22,.4)' : 'rgba(255,255,255,.08)';
}


// ============================================================
// 本番認証: doLogin / doRegister
// パスワードはSHA-256でハッシュ化して保存（平文保存なし）
// ============================================================

// SHA-256ハッシュ（Web Crypto API + 純粋JSフォールバック）
// file://プロトコルではcrypto.subtleが使えないためフォールバックを実装
// ── パスワードハッシュ（PBKDF2 + ユーザー別ソルト）──
async function _hashPassword(pw, email){
  const salt = 'bukatsu_' + (email || '').toLowerCase().trim();
  // PBKDF2（Web Crypto API使用、100,000回反復）
  if(typeof crypto !== 'undefined' && crypto.subtle){
    try{
      const enc = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']);
      const bits = await crypto.subtle.deriveBits({
        name: 'PBKDF2',
        salt: enc.encode(salt),
        iterations: 100000,
        hash: 'SHA-256'
      }, keyMaterial, 256);
      return 'pbkdf2$' + Array.from(new Uint8Array(bits)).map(b=>b.toString(16).padStart(2,'0')).join('');
    }catch(e){}
  }
  // フォールバック: SHA-256（既存互換）
  return await _sha256Legacy(pw);
}
// 既存ハッシュ検証（旧SHA-256方式との互換性維持）
async function _verifyPassword(pw, email, storedHash){
  if(!storedHash || storedHash === 'firebase') return storedHash === 'firebase';
  // PBKDF2ハッシュの場合
  if(storedHash.startsWith('pbkdf2$')){
    const newHash = await _hashPassword(pw, email);
    return newHash === storedHash;
  }
  // 旧SHA-256ハッシュの場合（移行互換）
  const legacyHash = await _sha256Legacy(pw);
  return legacyHash === storedHash;
}
// 旧方式SHA-256（既存ユーザー互換用）
async function _sha256Legacy(str){
  const data = str + '__mc2026';
  if(typeof crypto !== 'undefined' && crypto.subtle){
    try{
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
      return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
    }catch(e){}
  }
  return _sha256Pure(data);
}
// 旧方式互換のエイリアス
async function _sha256(str){ return _sha256Legacy(str); }
// 純粋JS SHA-256（RFC 6234準拠）
function _sha256Pure(s){
  function rr(n,r){return(n>>>r)|(n<<(32-r));}
  const K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  let H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  const msg=unescape(encodeURIComponent(s));
  const ml=msg.length;
  let ba=[];
  for(let i=0;i<ml;i++)ba.push(msg.charCodeAt(i));
  ba.push(0x80);
  while((ba.length%64)!==56)ba.push(0);
  const bl=ml*8;
  ba.push((bl/0x100000000|0)>>>24,(bl/0x100000000|0)>>16&0xff,(bl/0x100000000|0)>>8&0xff,(bl/0x100000000|0)&0xff,bl>>>24,bl>>16&0xff,bl>>8&0xff,bl&0xff);
  for(let i=0;i<ba.length;i+=64){
    const W=[];
    for(let j=0;j<16;j++)W.push((ba[i+j*4]<<24)|(ba[i+j*4+1]<<16)|(ba[i+j*4+2]<<8)|ba[i+j*4+3]);
    for(let j=16;j<64;j++){const s0=rr(W[j-15],7)^rr(W[j-15],18)^(W[j-15]>>>3);const s1=rr(W[j-2],17)^rr(W[j-2],19)^(W[j-2]>>>10);W.push((W[j-16]+s0+W[j-7]+s1)>>>0);}
    let[a,b,c,d,e,f,g,h]=H;
    for(let j=0;j<64;j++){const S1=rr(e,6)^rr(e,11)^rr(e,25);const ch=(e&f)^(~e&g);const T1=(h+S1+ch+K[j]+W[j])>>>0;const S0=rr(a,2)^rr(a,13)^rr(a,22);const maj=(a&b)^(a&c)^(b&c);const T2=(S0+maj)>>>0;h=g;g=f;f=e;e=(d+T1)>>>0;d=c;c=b;b=a;a=(T1+T2)>>>0;}
    H[0]=(H[0]+a)>>>0;H[1]=(H[1]+b)>>>0;H[2]=(H[2]+c)>>>0;H[3]=(H[3]+d)>>>0;H[4]=(H[4]+e)>>>0;H[5]=(H[5]+f)>>>0;H[6]=(H[6]+g)>>>0;H[7]=(H[7]+h)>>>0;
  }
  return H.map(n=>n.toString(16).padStart(8,'0')).join('');
}

// 登録済みユーザー一覧をlocalStorageから取得
function _getUsers(){ try{ return JSON.parse(localStorage.getItem('mycoach_users_v1')||'[]'); }catch(e){return[];} }
function _saveUsers(u){ localStorage.setItem('mycoach_users_v1', JSON.stringify(u)); }

// デモ機能は本番では無効
function showDemoModal(){ showAuth('register'); }
function doQuickLogin(){ showAuth('register'); }

// ── ログイン ──────────────────────────────────
function togglePw(inputId, btn){
  var i=document.getElementById(inputId);
  if(!i)return;
  i.type=i.type==='password'?'text':'password';
  btn.innerHTML=i.type==='password'?'<i class="fas fa-eye" style="font-size:14px"></i>':'<i class="fas fa-eye-slash" style="font-size:14px"></i>';
}
async function doLogin(){
  if(!RateLimit.check('login', 5, 60000)){ toast('ログイン試行回数の上限です。1分後に再試行してください。','e'); return; }
  var emailCheck = Validate.email(document.getElementById('l-email')?.value);
  if (!emailCheck.ok) { toast(emailCheck.msg, 'e'); return; }
  // ── ブルートフォース対策 ──
  const limit = checkLoginLimit();
  if(limit.locked){
    toast(`ログイン試行が多すぎます。${limit.remain}分後に再試行してください。`,'e');
    return;
  }

  const emailEl = document.getElementById('l-email');
  const pwEl    = document.getElementById('l-pw');
  const btn     = document.querySelector('#auth-login .btn-login-submit') || document.querySelector('#auth-login .btn-primary');
  const email   = (emailEl?.value||'').trim().toLowerCase();
  const pw      = pwEl?.value||'';

  // ── バリデーション ──
  if(!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){
    emailEl && (emailEl.style.borderColor='#ef4444');
    toast('正しいメールアドレスを入力してください','e');
    emailEl?.focus(); return;
  }
  if(!pw || pw.length < 8){
    pwEl && (pwEl.style.borderColor='#ef4444');
    toast('パスワードは8文字以上で入力してください','e');
    pwEl?.focus(); return;
  }

  // ── ローディング開始 ──
  if(btn){ btn.disabled=true; btn.innerHTML='<span style="opacity:.7">確認中...</span>'; }

  // ── 登録済みユーザー検索（ローカル → Firebase） ──
  const users = _getUsers();
  // FIX: Find LATEST user with matching email (not first/oldest)
  // Sort matching users by createdAt descending, take newest
  const matchingUsers = users.filter(u => u.email === email);
  let found = null;
  if(matchingUsers.length > 1) {
    // Multiple registrations with same email → use newest
    matchingUsers.sort((a,b) => (b.createdAt||'') > (a.createdAt||'') ? 1 : -1);
    found = matchingUsers[0];
    // Deduplicate: remove older entries with same email
    const deduped = users.filter(u => u.email !== email);
    deduped.push(found);
    _saveUsers(deduped);
  } else {
    found = matchingUsers[0] || null;
  }

  // ローカルにユーザーがない場合、Firebase経由で認証
  if(!found && !window._fbReady){
    for(let _w=0; _w<30 && !window._fbReady; _w++) await new Promise(r=>setTimeout(r,100));
  }
  if(!found && window._fbReady){
    let fbLoginOk = false;
    // 方法1: Firebase Auth
    if(window._fbAuth){
      try {
        const cred = await window._fbFn.signInWithEmailAndPassword(window._fbAuth, email, pw);
        const userDoc = await window._fbFn.getDoc(window._fbFn.doc(window._fbDB, 'users', cred.user.uid));
        if(userDoc.exists()){
          const u = userDoc.data();
          found = { id:u.id, role:u.role, name:u.name, email:u.email, createdAt:u.createdAt, pwHash:'firebase' };
          users.push(found);
          _saveUsers(users);
          await _loadFromFirestore(cred.user.uid);
          _fbUidCache = cred.user.uid;
          fbLoginOk = true;
        }
      } catch(e){}
    }
    // 方法2: Firestoreのusers_by_emailコレクションから直接検索
    if(!fbLoginOk){
      try {
        const emailKey = email.replace(/[.]/g,'_');
        const userDoc = await window._fbFn.getDoc(window._fbFn.doc(window._fbDB, 'users_by_email', emailKey));
        if(userDoc.exists()){
          const u = userDoc.data();
          // パスワードハッシュ照合（PBKDF2/旧SHA-256両対応）
          const pwOk = await _verifyPassword(pw, email, u.pwHash);
          if(pwOk){
            found = { id:u.id, role:u.role, name:u.name, email:u.email, createdAt:u.createdAt, pwHash:u.pwHash };
            users.push(found);
            _saveUsers(users);
            // Firebase Authアカウントがあればデータ復元
            if(u.fbUid){
              await _loadFromFirestore(u.fbUid);
            }
            fbLoginOk = true;
          } else {
            if(btn){ btn.disabled=false; btn.innerHTML='ログイン'; }
            pwEl && (pwEl.style.borderColor='#ef4444');
            toast('パスワードが間違っています','e');
            return;
          }
        }
      } catch(e){}
    }
    // どちらも見つからない
    if(!found){
      if(btn){ btn.disabled=false; btn.innerHTML='ログイン'; }
      emailEl && (emailEl.style.borderColor='#ef4444');
      toast('このメールアドレスは登録されていません。新規登録をお試しください。','e');
      return;
    }
  }

  if(!found){
    if(btn){ btn.disabled=false; btn.innerHTML='ログイン'; }
    emailEl && (emailEl.style.borderColor='#ef4444');
    addAuditLog('login_fail','未登録メールでログイン試行',{email:email.slice(0,3)+'***'});
    toast('このメールアドレスは登録されていません。新規登録をお試しください。','e');
    return;
  }

  // ローカル認証（Firebaseフォールバック済みの場合はスキップ）
  if(found.pwHash !== 'firebase'){
    const pwOk = await _verifyPassword(pw, email, found.pwHash);
    if(!pwOk){
      if(btn){ btn.disabled=false; btn.innerHTML='ログイン'; }
      pwEl && (pwEl.style.borderColor='#ef4444');
      recordLoginFail();
      addAuditLog('login_fail','パスワード不一致: '+sanitize(found.name||'',15),{userId:found.id});
      toast('パスワードが間違っています','e');
      return;
    }
    // 旧ハッシュ→PBKDF2に自動アップグレード
    if(!found.pwHash.startsWith('pbkdf2$')){
      const newHash = await _hashPassword(pw, email);
      found.pwHash = newHash;
      const users = _getUsers();
      const u = users.find(x=>x.id===found.id);
      if(u){ u.pwHash = newHash; _saveUsers(users); }
    }
    // Firebase Auth にもサインイン（アプリ初期化前に完了を待つ）
    if(window._fbReady && window._fbAuth){
      try {
        const cred = await window._fbFn.signInWithEmailAndPassword(window._fbAuth, email, pw);
        _fbUidCache = cred.user.uid;
        // メール確認チェック
        if(!cred.user.emailVerified){
          try {
            await window._fbFn.sendEmailVerification(cred.user);
          } catch(ev){}
          DB._emailNotVerified = true;
        } else {
          DB._emailNotVerified = false;
        }
        await _loadFromFirestore(cred.user.uid);
      } catch(e){
        try {
          const cred = await window._fbFn.createUserWithEmailAndPassword(window._fbAuth, email, pw);
          _fbUidCache = cred.user.uid;
          await window._fbFn.setDoc(window._fbFn.doc(window._fbDB,'users',cred.user.uid),{
            id:found.id, role:found.role, name:found.name, email, createdAt:found.createdAt
          });
          await _syncToFirestore();
        } catch(e2){ 
          // Firebase Auth完全失敗 → ユーザーに警告
          window._fbAuthFailed = true;
          setTimeout(function(){
            toast('⚠️ クラウド同期に接続できませんでした。データはこの端末にのみ保存されます。','w');
          }, 2000);
        }
      }
    }
  }

    // ✅ 認証成功 — 登録済みユーザーのrolでアプリを起動
    DB.currentUser = {
      role:      found.role,
      name:      found.name,
      email:     found.email,
      id:        found.id,
      createdAt: found.createdAt,
    };
    // Session security: record login time
    if(!DB.settings) DB.settings = {};
    DB.settings.loginTimestamp = new Date().toISOString();
    // FIX: Reset AI history and load per-user data
    if(typeof aiHistory !== 'undefined') aiHistory = [];
    if(typeof loadAIHistory === 'function') loadAIHistory();
    // ── 保護者: リンク情報を復元 ──
    if(found.role==='parent'){
      DB.currentUser.linkedPlayers=found.linkedPlayers||[];
      DB.currentUser.linkedPlayerId=found.linkedPlayerId||null;
      DB.currentUser.linkedTeamId=found.linkedTeamId||null;
      // players配列からもguardianIdで逆引き復元
      const _lc=DB.players.find(p=>p.guardianId===found.id);
      if(_lc){
        if(!DB.currentUser.linkedPlayers.includes(_lc.id))DB.currentUser.linkedPlayers.push(_lc.id);
        if(!DB.currentUser.linkedPlayerId)DB.currentUser.linkedPlayerId=_lc.id;
        if(!DB.currentUser.linkedTeamId)DB.currentUser.linkedTeamId=_lc.team||null;
      }
      // pendingParentTeamIdも復元
      if(!DB.pendingParentTeamId && DB.currentUser.linkedTeamId) DB.pendingParentTeamId=DB.currentUser.linkedTeamId;
    }
    // ロールに対応するDB内オブジェクトが存在するか確認
    const _checkProfile = (role, uid) => {
      if(role==='coach')  return !!DB.coaches.find(c=>c.id===uid);
      if(role==='team')   return !!DB.teams.find(t=>t.id===uid);
      if(role==='player') return !!DB.players.find(p=>p.id===uid);
      if(role==='parent') return true;
      if(role==='admin')  return true;
      return false;
    };
    let profileOk = _checkProfile(found.role, found.id);

    // プロフィールが見つからない場合、Firestoreから再取得を試みる
    if(!profileOk && window._fbReady){
      const _uid = window._fbAuth?.currentUser?.uid || _fbUidCache;
      if(_uid){
        await _loadFromFirestore(_uid);
        profileOk = _checkProfile(found.role, found.id);
      }
    }
    // それでも見つからない場合、users_by_emailからfbUidで再取得
    if(!profileOk && window._fbReady){
      try {
        const emailKey = found.email.replace(/[.]/g,'_');
        const uDoc = await window._fbFn.getDoc(window._fbFn.doc(window._fbDB,'users_by_email',emailKey));
        if(uDoc.exists()){
          const fbUid = uDoc.data().fbUid;
          if(fbUid){
            await _loadFromFirestore(fbUid);
            _fbUidCache = fbUid;
            profileOk = _checkProfile(found.role, found.id);
          }
        }
      } catch(e){}
    }
    // 最終手段: 3秒待ってもう一度試す
    if(!profileOk && window._fbReady){
      await new Promise(r => setTimeout(r, 3000));
      const _uid2 = window._fbAuth?.currentUser?.uid || _fbUidCache;
      if(_uid2){
        await _loadFromFirestore(_uid2);
        profileOk = _checkProfile(found.role, found.id);
      }
    }

    if(!profileOk){
      // Firestoreにデータがない場合、最低限のプロフィールを自動作成してアプリに入れる
      const now = new Date().toLocaleString('ja-JP');
      if(found.role==='coach' && !DB.coaches.find(c=>c.id===found.id)){
        DB.coaches.push({id:found.id, name:found.name, email:found.email, sport:'',spec:'',area:'',
          price:0, rating:0, reviews:0, exp:0, bio:'', avail:true, team:null, verified:false,
          color:'#'+Math.floor(Math.random()*0xffffff).toString(16).padStart(6,'0'), createdAt:now});
      }
      if(found.role==='team' && !DB.teams.find(t=>t.id===found.id)){
        DB.teams.push({id:found.id, name:found.name, email:found.email, sport:'',area:'',
          members:0, fee:0, coach:null, wins:0, losses:0,
          code:'T'+Date.now().toString().slice(-6), createdAt:now});
      }
      if(found.role==='player' && !DB.players.find(p=>p.id===found.id)){
        DB.players.push({id:found.id, name:found.name, email:found.email,
          team:null, pos:'', age:0, weight:0, height:0, status:'unpaid',
          guardian:'', guardianId:null, createdAt:now});
      }
      saveDB();
      toast('クラウドデータが見つかりません。プロフィールを再設定してください。','w');
    }

    clearLoginLimit();
    if(btn){ btn.disabled=false; btn.innerHTML='ログイン'; }
    window._needsFirestoreClear = false;
    
    // ── Firebase Auth必須: 未認証なら再試行 → 失敗ならブロック ──
    if(!window._fbAuth?.currentUser && window._fbReady){
      let authOk = false;
      // 試行1: signIn
      try {
        const cred = await window._fbFn.signInWithEmailAndPassword(window._fbAuth, email, pw);
        _fbUidCache = cred.user.uid;
        await _loadFromFirestore(cred.user.uid);
        authOk = true;
      } catch(retryErr){
        // 試行2: create
        try {
          const cred = await window._fbFn.createUserWithEmailAndPassword(window._fbAuth, email, pw);
          _fbUidCache = cred.user.uid;
          await window._fbFn.setDoc(window._fbFn.doc(window._fbDB,'users',cred.user.uid),{
            id:found.id, role:found.role, name:found.name, email, createdAt:found.createdAt
          });
          authOk = true;
        } catch(createErr){
          console.error('[Login] Firebase Auth completely failed:', createErr.code);
        }
      }
      // Auth完全失敗 → ログインをブロック
      if(!authOk){
        toast('⚠️ サーバーに接続できません。インターネット接続を確認して再度お試しください。','e');
        DB.currentUser = null;
        return; // ← launchApp()を呼ばない！
      }
    }
    
    // ── Firebase Auth未接続（fbReady=false）の場合も待つ ──
    if(!window._fbReady){
      toast('⚠️ サーバー初期化中...少々お待ちください','w');
      let waited = 0;
      while(!window._fbReady && waited < 10000){
        await new Promise(r=>setTimeout(r,500));
        waited += 500;
      }
      if(!window._fbReady){
        toast('⚠️ サーバーに接続できません。ページを再読み込みしてください。','e');
        DB.currentUser = null;
        return;
      }
      // fbReady後にAuth
      if(!window._fbAuth?.currentUser){
        try {
          const cred = await window._fbFn.signInWithEmailAndPassword(window._fbAuth, email, pw);
          _fbUidCache = cred.user.uid;
          await _loadFromFirestore(cred.user.uid);
        } catch(e){
          try {
            const cred = await window._fbFn.createUserWithEmailAndPassword(window._fbAuth, email, pw);
            _fbUidCache = cred.user.uid;
          } catch(e2){
            toast('⚠️ サーバー認証に失敗しました。再度お試しください。','e');
            DB.currentUser = null;
            return;
          }
        }
      }
    }
    
    saveDB();
    launchApp();
}

// ── 新規登録 ──────────────────────────────────
function doRegister(){
  if(!RateLimit.check('register', 3, 60000)){ toast('登録の試行回数が上限です。しばらくお待ちください。','e'); return; }
  // Input validation
  var emailCheck = Validate.email(document.getElementById('reg-email')?.value);
  if (!emailCheck.ok) { toast(emailCheck.msg, 'e'); return; }
  var passCheck = Validate.password(document.getElementById('reg-pw')?.value);
  if (!passCheck.ok) { toast(passCheck.msg, 'e'); return; }
  var nameCheck = Validate.name(document.getElementById('rf-name')?.value);
  if (!nameCheck.ok) { toast(nameCheck.msg, 'e'); return; }
  const emailEl = document.getElementById('reg-email');
  const pwEl    = document.getElementById('reg-pw');
  const nameEl  = document.getElementById('rf-name');
  const btn     = document.getElementById('do-register-btn');
  const email   = (emailEl?.value||'').trim().toLowerCase();
  const pw      = pwEl?.value||'';
  const name    = (nameEl?.value||'').trim();

  if(!email||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ emailEl&&(emailEl.style.borderColor='#ef4444'); toast('正しいメールアドレスを入力してください','e'); emailEl?.focus(); return; }
  if(pw.length<8){ pwEl&&(pwEl.style.borderColor='#ef4444'); toast('パスワードは8文字以上で入力してください','e'); pwEl?.focus(); return; }
  if(!name){ nameEl&&(nameEl.style.borderColor='#ef4444'); toast('お名前を入力してください','e'); nameEl?.focus(); return; }
  if(!regAgreed){
    const wrap=document.getElementById('reg-agree-wrap');
    if(wrap){wrap.style.borderColor='#ef4444';wrap.style.animation='shake .3s';setTimeout(()=>wrap.style.animation='',400);}
    toast('利用規約への同意が必要です','e'); return;
  }

  // メール重複チェック
  if(_getUsers().some(u=>u.email===email)){ emailEl&&(emailEl.style.borderColor='#ef4444'); toast('このメールアドレスはすでに登録されています','e'); return; }

  // 招待コード必須チェック（選手・保護者・OBOG）
  const codeEl = document.getElementById('rf-code');
  if((regRole==='player'||regRole==='parent'||regRole==='alumni') && codeEl){
    const code = (codeEl.value||'').trim().toUpperCase();
    if(!code){
      codeEl.style.borderColor='#ef4444';
      toast('チームの招待コードを入力してください','e');
      codeEl.focus(); return;
    }
    const team = DB.teams.find(t=>t.code===code);
    if(!team){
      codeEl.style.borderColor='#ef4444';
      toast('この招待コードは存在しません。チーム管理者にご確認ください。','e');
      codeEl.focus(); return;
    }
  }

  if(btn){ btn.disabled=true; btn.textContent='登録中...'; }
  _hashPassword(pw, email).then(pwHash=>{
    const uid = genId(regRole);
    const now = new Date().toLocaleString('ja-JP');
    const users = _getUsers();
    users.push({ id:uid, role:regRole, name, email, pwHash, createdAt:now });
    _saveUsers(users);
    // Firestoreにユーザー情報を保存（クロスデバイス用）
    const _fbRegister = async () => {
      if(!window._fbReady){
        for(let _w=0; _w<50 && !window._fbReady; _w++) await new Promise(r=>setTimeout(r,100));
      }
      if(!window._fbReady) { return; }
      try {
        // Firebase Authに登録
        const cred = await window._fbFn.createUserWithEmailAndPassword(window._fbAuth, email, pw);
        const fbUid = cred.user.uid;
        // Firestoreにユーザー情報保存
        await window._fbFn.setDoc(window._fbFn.doc(window._fbDB,'users',fbUid),{
          id:uid, role:regRole, name, email, pwHash, createdAt:now
        });
        // メールでも引けるように別コレクションにも保存
        await window._fbFn.setDoc(window._fbFn.doc(window._fbDB,'users_by_email',email.replace(/[.]/g,'_')),{
          id:uid, role:regRole, name, email, pwHash, createdAt:now, fbUid
        });
        _fbUidCache = fbUid;
        // 即座に初回同期
        await _syncToFirestore();
      } catch(e){
        // Auth失敗でもFirestoreに直接保存を試みる（匿名書き込み）
        try {
          await window._fbFn.setDoc(window._fbFn.doc(window._fbDB,'users_by_email',email.replace(/[.]/g,'_')),{
            id:uid, role:regRole, name, email, pwHash, createdAt:now
          });
        } catch(e2){ }
      }
    };
    _fbRegister();

    DB.pendingRole   = regRole;
    DB.pendingEmail  = email;
    DB.pendingName   = name;
    DB.pendingUserId = uid;

    // 招待コード処理（選手・保護者・OBOG）- 上で既にバリデーション済み
    const codeElPost = document.getElementById('rf-code');
    if(codeElPost && codeElPost.value.trim()){
      const code = codeElPost.value.trim().toUpperCase();
      const team = DB.teams.find(t=>t.code===code);
      if(team){
        DB.pendingTeamId = team.id;
        DB.pendingTeamCode = code;
      }
    }

    // OBOG追加情報の保存
    if(regRole === 'alumni'){
      if(!DB.pendingProfile) DB.pendingProfile = {};
      const gradEl = document.getElementById('rf-grad-year');
      const jobEl = document.getElementById('rf-job');
      const companyEl = document.getElementById('rf-company');
      if(gradEl) DB.pendingProfile.gradYear = parseInt(gradEl.value) || 0;
      if(jobEl) DB.pendingProfile.currentJob = (jobEl.value || '').trim();
      if(companyEl) DB.pendingProfile.company = (companyEl.value || '').trim();
    }

    if(btn){ btn.disabled=false; btn.textContent='🚀 アカウントを作成する（無料）'; }
    addAuditLog('register','新規登録: '+sanitize(DB.pendingName||'',20),{role:DB.pendingRole,email:(DB.pendingEmail||'').slice(0,3)+'***'});
    startOnboarding();
  });
}
// ── Googleログイン ──
async function doGoogleLogin(){
  if(!window._fbReady || !window._fbAuth){
    toast('Firebase初期化中です。数秒後にもう一度お試しください','w');
    return;
  }
  try {
    const fn = window._fbFn;
    const provider = new fn.GoogleAuthProvider();
    const result = await fn.signInWithPopup(window._fbAuth, provider);
    const fbUser = result.user;
    const email = fbUser.email;
    const name = fbUser.displayName || email.split('@')[0];
    
    // Firestoreにユーザーデータがあるか確認
    const userDoc = await fn.getDoc(fn.doc(window._fbDB, 'users', fbUser.uid));
    if(userDoc.exists()){
      // 既存ユーザー → データ読み込んでログイン
      const u = userDoc.data();
      await _loadFromFirestore(fbUser.uid);
      _fbUidCache = fbUser.uid;
      DB.currentUser = { role:u.role, name:u.name, email:u.email, id:u.id, createdAt:u.createdAt };
      if(u.role==='parent'){
        DB.currentUser.linkedPlayers=u.linkedPlayers||[];
        DB.currentUser.linkedPlayerId=u.linkedPlayerId||null;
        DB.currentUser.linkedTeamId=u.linkedTeamId||null;
      }
      const users = _getUsers();
      if(!users.find(x=>x.email===u.email)){
        users.push({id:u.id, role:u.role, name:u.name, email:u.email, pwHash:'google', createdAt:u.createdAt});
        _saveUsers(users);
      }
      saveDB();
      launchApp();
      return;
    }
    
    // 新規ユーザー → ロール選択してオンボーディングへ
    DB.pendingEmail = email;
    DB.pendingName = name;
    DB.pendingUserId = genId('g');
    _fbUidCache = fbUser.uid;
    // ユーザーをusersテーブルに仮登録
    const users = _getUsers();
    if(!users.find(x=>x.email===email)){
      users.push({id:DB.pendingUserId, role:'player', name, email, pwHash:'google', createdAt:new Date().toLocaleString('ja-JP')});
      _saveUsers(users);
    }
    toast('Googleアカウントで認証しました。立場を選んで登録してください！','s');
    switchAuth('register');
    // メール・名前を自動入力
    setTimeout(()=>{
      const emailEl = document.getElementById('reg-email');
      const nameEl = document.getElementById('rf-name');
      if(emailEl) emailEl.value = email;
      if(nameEl) nameEl.value = name;
    }, 300);
  } catch(e){
    if(e.code === 'auth/popup-closed-by-user'){
      toast('ログインがキャンセルされました','i');
    } else if(e.code === 'auth/popup-blocked'){
      toast('ポップアップがブロックされました。ブラウザの設定を確認してください','e');
    } else {
      toast('Googleログインに失敗しました','e');
    }
  }
}

// ── パスワード変更（ログイン中）──
async function changePasswordLoggedIn(){
  const oldPw = document.getElementById('cpw-old')?.value || '';
  const newPw = document.getElementById('cpw-new')?.value || '';
  const confirmPw = document.getElementById('cpw-confirm')?.value || '';
  
  if(!oldPw){ toast('現在のパスワードを入力してください','e'); return; }
  if(newPw.length < 8){ toast('新しいパスワードは8文字以上にしてください','e'); return; }
  if(newPw !== confirmPw){ toast('新しいパスワードが一致しません','e'); return; }
  if(oldPw === newPw){ toast('現在と同じパスワードです','e'); return; }
  
  const btn = document.querySelector('#cpw-btn');
  if(btn){ btn.disabled = true; btn.textContent = '変更中...'; }
  
  try {
    const email = DB.currentUser?.email || '';
    
    // 1. Firebase Authのパスワード変更
    if(window._fbAuth?.currentUser){
      const fn = window._fbFn;
      // 再認証
      const credential = fn.EmailAuthProvider.credential(email, oldPw);
      await fn.reauthenticateWithCredential(window._fbAuth.currentUser, credential);
      // パスワード更新
      await fn.updatePassword(window._fbAuth.currentUser, newPw);
    }
    
    // 2. ローカルのパスワードハッシュも更新
    const users = _getUsers();
    const me = users.find(u => u.id === DB.currentUser?.id);
    if(me && me.pwHash !== 'google'){
      const newHash = await _hashPassword(newPw, email);
      me.pwHash = newHash;
      _saveUsers(users);
    }
    
    // 3. Firestoreのusers_by_emailも更新
    if(window._fbReady && window._fbFn){
      try {
        const emailKey = email.replace(/[.]/g, '_');
        const fn = window._fbFn;
        const newHash2 = await _hashPassword(newPw, email);
        await fn.setDoc(fn.doc(window._fbDB, 'users_by_email', emailKey), {pwHash: newHash2}, {merge:true});
      } catch(e){}
    }
    
    addAuditLog('password_change', DB.currentUser?.name + ' がパスワードを変更');
    closeM();
    toast('✅ パスワードを変更しました','s');
  } catch(e){
    if(e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential'){
      toast('現在のパスワードが正しくありません','e');
    } else if(e.code === 'auth/requires-recent-login'){
      toast('セキュリティのため再ログインが必要です。一度ログアウトしてください','w');
    } else {
      toast('パスワード変更に失敗しました','e');
    }
  } finally {
    if(btn){ btn.disabled = false; btn.textContent = '🔑 変更する'; }
  }
}

function openChangePasswordModal(){
  openM('🔑 パスワードを変更', `
    <div style="display:grid;gap:14px">
      <div class="form-group"><label class="label">現在のパスワード</label><input type="password" id="cpw-old" class="input" placeholder="現在のパスワード" autocomplete="current-password"></div>
      <div class="form-group"><label class="label">新しいパスワード（8文字以上）</label><input type="password" id="cpw-new" class="input" placeholder="新しいパスワード" autocomplete="new-password"></div>
      <div class="form-group"><label class="label">新しいパスワード（確認）</label><input type="password" id="cpw-confirm" class="input" placeholder="もう一度入力" autocomplete="new-password"></div>
      <button id="cpw-btn" class="btn btn-primary w-full" onclick="changePasswordLoggedIn()">🔑 変更する</button>
      <div style="font-size:11px;color:var(--txt3);text-align:center">※ Firebase認証とローカルの両方のパスワードが更新されます</div>
    </div>
  `);
}

// ── アカウント削除（改善版）──
async function _doDeleteAccountFull(){
  const inp = document.getElementById('del-confirm')?.value;
  if(inp !== '削除する'){ toast('「削除する」と入力してください','e'); return; }
  
  const uid = DB.currentUser?.id;
  const email = DB.currentUser?.email;
  const name = DB.currentUser?.name;
  const role = DB.currentUser?.role;
  if(!uid){ toast('ユーザー情報が取得できません','e'); return; }
  
  const btn = document.querySelector('#del-exec-btn');
  if(btn){ btn.disabled = true; btn.textContent = '削除中...'; }
  
  try {
    // 1. 監査ログに記録
    addAuditLog('account_delete', name + '(' + role + ') がアカウントを削除', {userId:uid, email});
    
    // 2. ローカルDBからユーザーデータを削除
    DB.coaches = DB.coaches.filter(c => c.id !== uid);
    DB.teams = DB.teams.filter(t => t.id !== uid);
    DB.players = DB.players.filter(p => p.id !== uid);
    // 関連する月謝・リクエスト・通知も削除
    DB.payments = (DB.payments||[]).filter(p => p.player !== uid);
    DB.requests = (DB.requests||[]).filter(r => r.coachId !== uid && r.teamId !== uid);
    DB.notifs = (DB.notifs||[]).filter(n => n.uid !== uid);
    // チーム紐づけ解除
    (DB.teams||[]).forEach(t => { if(t.coach === uid) t.coach = null; });
    DB.players.forEach(p => { if(p.guardianId === uid) p.guardianId = null; });
    
    // 3. usersテーブルから削除
    const users = _getUsers();
    const idx = users.findIndex(u => u.id === uid);
    if(idx >= 0) users.splice(idx, 1);
    _saveUsers(users);
    
    // 4. currentUserクリア
    DB.currentUser = null;
    saveDB();
    
    // 5. Firestoreから個人データ削除
    if(window._fbReady && window._fbAuth?.currentUser){
      const fn = window._fbFn;
      const fbUid = window._fbAuth.currentUser.uid;
      try {
        await fn.deleteDoc(fn.doc(window._fbDB, 'appdata', fbUid));
        await fn.deleteDoc(fn.doc(window._fbDB, 'users', fbUid));
        if(email){
          await fn.deleteDoc(fn.doc(window._fbDB, 'users_by_email', email.replace(/[.]/g, '_')));
        }
      } catch(e){}
      
      // 6. Firebase Authアカウント削除
      try {
        await fn.fbDeleteUser(window._fbAuth.currentUser);
      } catch(e){}
    }
    
    // 7. リスナー停止 & 画面遷移
    _stopAllListeners();
    closeM();
    show('landing');
    toast('アカウントを削除しました。ご利用ありがとうございました。','s');
  } catch(e){
    toast('削除中にエラーが発生しました','e');
    if(btn){ btn.disabled = false; btn.textContent = '🗑️ 削除する'; }
  }
}

// ── モバイルユーザーメニュー ──
function toggleMobileUserMenu(){
  var m=document.getElementById('mobile-user-menu');
  if(!m) return;
  var showing = m.style.display !== 'none';
  if(showing){ m.style.display='none'; return; }
  // ユーザー情報を更新
  var nameEl=document.getElementById('mu-name');
  var roleEl=document.getElementById('mu-role');
  var aviEl=document.getElementById('mu-avi');
  var RLABELS={admin:'事務局',team:'チーム管理者',coach:'コーチ',player:'選手',parent:'保護者'};
  if(nameEl) nameEl.textContent=DB.currentUser?.name||'';
  if(roleEl) roleEl.textContent=RLABELS[DB.currentUser?.role]||'';
  if(aviEl) aviEl.textContent=(DB.currentUser?.name||'?')[0];
  m.style.display='block';
  // 外側クリックで閉じる
  setTimeout(()=>{
    var _close=function(e){ if(!m.contains(e.target)&&!e.target.closest('#top-avi')){ closeMobileUserMenu(); document.removeEventListener('click',_close); }};
    document.addEventListener('click',_close);
  },10);
}
function closeMobileUserMenu(){
  var m=document.getElementById('mobile-user-menu');
  if(m) m.style.display='none';
}

function doLogout(){
  addAuditLog('logout', (DB.currentUser?.name||'') + ' がログアウト');
  _stopAllListeners();
  _localDirty = false;
  // Clear session data
  if(DB.settings) {
    DB.settings.loginTimestamp = null;
  }
  clearCurrentUserSession();
  // Clear sensitive per-user caches
  if(typeof aiHistory !== 'undefined') aiHistory = [];
  window._pinVal = '';
  window._photoState = {file:null,result:null};
  window._aiParsedMeals = null;
  window._typingUsers = {};
  // Firebase sign out
  if(window._fbAuth) window._fbFn.signOut(window._fbAuth).catch(()=>{});
  // Notify other tabs
  if(typeof _syncChannel!=='undefined'&&_syncChannel){try{_syncChannel.postMessage({type:'logout',from:typeof _tabId!=='undefined'?_tabId:'',ts:Date.now()});}catch(e){}}
  closeM();show('landing');toast('ログアウトしました','i');
}

// ──────────────────────────────────────
// パスワードリセット機能
// ──────────────────────────────────────
function showForgotPassword(){
  const emailEl = document.getElementById('l-email');
  const prefillEmail = emailEl?.value?.trim() || '';
  openM('パスワードをリセット', `
    <div style="margin-bottom:16px;font-size:13px;color:var(--txt3);line-height:1.7">
      登録時のメールアドレスを入力してください。<br>
      新しいパスワードを設定できます。
    </div>
    <div class="form-group">
      <label class="label">登録済みメールアドレス</label>
      <input class="input" id="fr-email" type="email" placeholder="your@email.com" value="${escHtml(prefillEmail)}">
    </div>
    <div class="form-group" id="fr-pw-group" style="display:none">
      <label class="label">新しいパスワード（8文字以上）</label>
      <input class="input" id="fr-new-pw" type="password" placeholder="新しいパスワード">
    </div>
    <div class="form-group" id="fr-pw-confirm-group" style="display:none">
      <label class="label">新しいパスワード（確認）</label>
      <input class="input" id="fr-new-pw2" type="password" placeholder="もう一度入力">
    </div>
    <div id="fr-step1-btn">
      <button class="btn btn-primary w-full" onclick="verifyResetEmail()">メールを確認する</button>
    </div>
    <div id="fr-step2-btn" style="display:none">
      <button class="btn btn-primary w-full" onclick="doResetPassword()">パスワードを変更する</button>
    </div>
  `);
}

function verifyResetEmail(){
  const email = (document.getElementById('fr-email')?.value||'').trim().toLowerCase();
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){
    toast('正しいメールアドレスを入力してください','e'); return;
  }
  const users = _getUsers();
  const found = users.find(u => u.email === email);
  if(!found){
    toast('このメールアドレスは登録されていません','e'); return;
  }
  // メール確認OK → 新パスワード入力欄を表示
  document.getElementById('fr-email').disabled = true;
  document.getElementById('fr-pw-group').style.display = 'block';
  document.getElementById('fr-pw-confirm-group').style.display = 'block';
  document.getElementById('fr-step1-btn').style.display = 'none';
  document.getElementById('fr-step2-btn').style.display = 'block';
  toast('メールアドレスを確認しました。新しいパスワードを設定してください。','s');
}

async function doResetPassword(){
  const email  = (document.getElementById('fr-email')?.value||'').trim().toLowerCase();
  const newPw  = document.getElementById('fr-new-pw')?.value || '';
  const newPw2 = document.getElementById('fr-new-pw2')?.value || '';
  if(newPw.length < 8){ toast('パスワードは8文字以上で入力してください','e'); return; }
  if(newPw !== newPw2){ toast('パスワードが一致しません','e'); return; }
  const users = _getUsers();
  const found = users.find(u => u.email === email);
  if(!found){ toast('エラーが発生しました。再度お試しください','e'); return; }
  const pwHash = await _hashPassword(newPw, email);
  found.pwHash = pwHash;
  _saveUsers(users);
  closeM();
  toast('パスワードを変更しました。新しいパスワードでログインしてください。','s');
  const emailEl = document.getElementById('l-email');
  if(emailEl) emailEl.value = email;
}

