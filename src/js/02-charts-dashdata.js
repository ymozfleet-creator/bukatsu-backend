// 02 - Chart.js設定, ダッシュボードデータ計算, 栄養履歴, カレンダー状態
  Chart.defaults.color = '#7ea3c4';
  Chart.defaults.font.family = "'DM Sans', sans-serif";
  Chart.defaults.font.size = 12;
  Chart.defaults.plugins.legend.labels.boxWidth = 12;
  Chart.defaults.plugins.legend.labels.padding = 14;
}

// ページ遷移時にグラフを再描画するためのフック
function initPageCharts(page) {
  setTimeout(() => {
    if (page === 'earnings')    _initEarningsCharts();
    if (page === 'stats')       _initStatsCharts();
    if (page === 'nutrition')   _initNutritionCharts();
    if (page === 'training')    _initTrainingCharts();
    if (page === 'admin')       _initAdminCharts();
    if (page === 'coachDash')   _initCoachDashCharts();
    if (page === 'parentReport')_initParentCharts();
    if (page === 'teamDash')    _initTeamDashCharts();
    if (page === 'feeMgmt')     _initFeeMgmtCharts();
    if (page === 'coachReport') _initCoachReportCharts();
    if (page === 'coachPlayers') _initCoachPlayersCharts();
    if (page === 'playerDash')  _initPlayerDashCharts();
  }, 80);
}

// ───────────────────────────────────────────────────────────
//  AI 会話履歴の永続化
// ───────────────────────────────────────────────────────────
function _aiHistoryKey() {
  var uid = DB.currentUser?.id || 'anon';
  return 'mc_ai_history_' + uid;
}
function loadAIHistory() {
  try {
    var key = _aiHistoryKey();
    var raw = localStorage.getItem(key);
    // Migrate: if per-user key is empty, try legacy key as one-time migration
    if(!raw) {
      raw = localStorage.getItem('mc_ai_history_v1');
      if(raw) {
        localStorage.setItem(key, raw);
        localStorage.removeItem('mc_ai_history_v1');
      }
    }
    if (raw) try{aiHistory = JSON.parse(raw).slice(-40);}catch(e){aiHistory=[];}
  } catch(e) {}
}
function saveAIHistory() {
  try {
    localStorage.setItem(_aiHistoryKey(), JSON.stringify(aiHistory.slice(-40)));
  } catch(e) {}
}

// ═══════════════════════════════════════════════════════════
//  CHART INIT FUNCTIONS  ─  各ページのグラフ実装
// ═══════════════════════════════════════════════════════════

// ── 収益管理 (coach) ────────────────────────────────────────
function _initEarningsCharts() {
  const me = getMyCoach(); if(!me) return;
  const paid = _dbArr('coachPay').filter(p=>p.coach===me.id && p.status==='paid');
  const months = Array.from({length:6},(_,i)=>{
    const d=new Date(); d.setMonth(d.getMonth()-5+i);
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
  });
  const amounts = months.map(m=>paid.filter(p=>p.month===m).reduce((s,p)=>s+(p.coachReceives||0),0));
  renderChart('earnings-bar-chart',{
    type:'bar',
    data:{labels:months.map(m=>m.slice(5)+'月'),datasets:[{
      label:'月収益(¥)',data:amounts,
      backgroundColor:'rgba(255,107,43,.75)',borderColor:'#ff6b2b',
      borderWidth:2,borderRadius:8,borderSkipped:false
    }]},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>'¥'+c.raw.toLocaleString()}}},
      scales:{y:{grid:{color:'rgba(255,255,255,.06)'},ticks:{callback:v=>'¥'+v.toLocaleString()}},x:{grid:{display:false}}}}
  });
  let cum=0;
  renderChart('earnings-line-chart',{
    type:'line',
    data:{labels:months.map(m=>m.slice(5)+'月'),datasets:[{
      label:'累積収益',data:amounts.map(a=>(cum+=a,cum)),
      borderColor:'#00cfaa',backgroundColor:'rgba(0,207,170,.1)',
      fill:true,tension:0.4,pointBackgroundColor:'#00cfaa',pointRadius:5
    }]},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>'¥'+c.raw.toLocaleString()}}},
      scales:{y:{grid:{color:'rgba(255,255,255,.06)'},ticks:{callback:v=>'¥'+v.toLocaleString()}},x:{grid:{display:false}}}}
  });
}

// ── 成績統計 (player) ────────────────────────────────────────
function _initStatsCharts() {
  const p = DB.players.find(x=>x.id===(DB.currentUser?.id));
  if(!p) return;
  const log = DB.trainingLog[p.id]||{};
  const entries = Object.values(log).sort((a,b)=>a.date>b.date?1:-1).slice(-8);
  if(!entries.length) return;

  // 練習時間・消費カロリー バーチャート
  renderChart('stats-training-chart',{
    type:'bar',
    data:{
      labels:entries.map(e=>e.date?e.date.slice(5):'--'),
      datasets:[
        {label:'練習時間(分)',data:entries.map(e=>e.duration||e.time||0),
         backgroundColor:'rgba(59,130,246,.7)',borderColor:'#3b82f6',borderWidth:2,borderRadius:6,yAxisID:'y'},
        {label:'消費kcal',data:entries.map(e=>e.kcal||0),
         backgroundColor:'rgba(255,107,43,.7)',borderColor:'#ff6b2b',borderWidth:2,borderRadius:6,yAxisID:'y2'},
      ]
    },
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{labels:{color:'#7ea3c4'}}},
      scales:{
        y:{position:'left',grid:{color:'rgba(255,255,255,.06)'},ticks:{color:'#3b82f6'}},
        y2:{position:'right',grid:{display:false},ticks:{color:'#ff6b2b'}},
        x:{grid:{display:false}}
      }}
  });

  // コンディションスコア ラインチャート
  renderChart('stats-cond-chart',{
    type:'line',
    data:{
      labels:entries.map(e=>e.date?e.date.slice(5):'--'),
      datasets:[{
        label:'コンディション(1-10)',
        data:entries.map(e=>e.cond||0),
        borderColor:'#10b981',backgroundColor:'rgba(16,185,129,.15)',
        fill:true,tension:0.4,pointBackgroundColor:'#10b981',pointRadius:5
      }]
    },
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:false}},
      scales:{y:{min:0,max:10,grid:{color:'rgba(255,255,255,.06)'}},x:{grid:{display:false}}}}
  });

  // コンディション推移（30日）チャート
  const p2=DB.players.find(x=>x.id===(DB.currentUser?.id));
  if(p2){
    const log2=DB.trainingLog[p2.id]||{};
    const last30=[];
    const labels30=[];
    for(let i=29;i>=0;i--){
      const d=new Date(); d.setDate(d.getDate()-i);
      const k=d.toISOString().slice(0,10);
      labels30.push(i%5===0?k.slice(5):'');
      last30.push(log2[k]?.cond||null);
    }
    renderChart('stats-cond-chart',{
      type:'line',
      data:{
        labels:labels30,
        datasets:[{label:'コンディション',data:last30,borderColor:'var(--org)',backgroundColor:'rgba(249,115,22,.1)',fill:true,tension:.4,spanGaps:true,pointRadius:3}]
      },
      options:{plugins:{legend:{display:false}},scales:{y:{min:0,max:5,ticks:{stepSize:1},grid:{color:'rgba(255,255,255,.05)'}},x:{grid:{display:false}}}}
    });
  }
}

// ── 栄養管理 (player) ────────────────────────────────────────
function _initNutritionCharts() {
  const t=calcTotals();
  const goal={kcal:2800,protein:130,carb:380,fat:70};

  // PFC ドーナツチャート
  renderChart('nutrition-pfc-chart',{
    type:'doughnut',
    data:{
      labels:['タンパク質(g)','炭水化物(g)','脂質(g)'],
      datasets:[{
        data:[t.protein||1,t.carb||1,t.fat||1],
        backgroundColor:['rgba(0,207,170,.8)','rgba(59,130,246,.8)','rgba(245,158,11,.8)'],
        borderColor:['#00cfaa','#3b82f6','#f59e0b'],
        borderWidth:2,hoverOffset:6
      }]
    },
    options:{responsive:true,maintainAspectRatio:false,
      cutout:'62%',
      plugins:{legend:{position:'bottom'},
        tooltip:{callbacks:{label:c=>`${c.label}: ${c.raw}g`}}}}
  });

  // カロリー達成ゲージ
  const pct=Math.min(Math.round((t.kcal||0)/goal.kcal*100),150);
  renderChart('nutrition-kcal-gauge',{
    type:'doughnut',
    data:{
      datasets:[{
        data:[pct,Math.max(0,100-pct)],
        backgroundColor:[pct>=100?'rgba(16,185,129,.8)':'rgba(255,107,43,.8)','rgba(255,255,255,.06)'],
        borderWidth:0,cutout:'78%'
      }]
    },
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:false},tooltip:{enabled:false}}}
  });

  // 過去7日間のカロリー推移
  const hist = getNutritionHistory();
  const days7 = Array.from({length:7},(_,i)=>{
    const d=new Date(); d.setDate(d.getDate()-6+i); return d.toDateString();
  });
  const kcal7 = days7.map(dk=>{
    if(dk===new Date().toDateString()) return t.kcal||0;
    return hist[dk]?.meals?.reduce((s,m)=>s+(m.kcal||0),0)||0;
  });
  renderChart('nutrition-history-chart',{
    type:'bar',
    data:{
      labels:days7.map(dk=>{const d=new Date(dk);return(d.getMonth()+1)+'/'+(d.getDate());}),
      datasets:[{
        label:'摂取kcal',data:kcal7,
        backgroundColor:kcal7.map(k=>k>=goal.kcal*0.8?'rgba(0,207,170,.7)':'rgba(255,107,43,.5)'),
        borderRadius:6
      },{
        label:'目標',data:Array(7).fill(goal.kcal),
        type:'line',borderColor:'rgba(255,255,255,.3)',borderDash:[6,4],
        pointRadius:0,fill:false
      }]
    },
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:false}},
      scales:{y:{grid:{color:'rgba(255,255,255,.06)'},ticks:{callback:v=>v+'kcal'}},x:{grid:{display:false}}}}
  });
}

// ── トレーニング (player) ────────────────────────────────────
function _initTrainingCharts() {
  const p = DB.players.find(x=>x.id===(DB.currentUser?.id));
  if(!p) return;
  const log = DB.trainingLog[p.id]||{};
  const entries = Object.values(log).sort((a,b)=>a.date>b.date?1:-1);

  // 月次達成率: 各ワークアウトのdoneSetsから計算
  const allWo = getAllWorkouts();
  const totalPlanned = allWo.reduce((s,w)=>s+w.exercises.reduce((ss,e)=>ss+e.sets,0),0);
  const doneSetsAll = Object.values(DB.doneSets||{}).reduce((s,v)=>s+v,0);
  const achievePct = totalPlanned ? Math.min(Math.round(doneSetsAll/totalPlanned*100),100) : 0;

  renderChart('training-achieve-gauge',{
    type:'doughnut',
    data:{datasets:[{
      data:[achievePct, 100-achievePct],
      backgroundColor:['rgba(16,185,129,.85)','rgba(255,255,255,.06)'],
      borderWidth:0,cutout:'72%'
    }]},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:false},tooltip:{enabled:false}}}
  });

  // 週別セッション数ヒートマップ用バーチャート（直近8週）
  const weeks = Array.from({length:8},(_,i)=>{
    const d=new Date(); d.setDate(d.getDate()-7*(7-i));
    const wStart=d.toISOString().slice(0,10).slice(5);
    return wStart;
  });
  const weekCounts = weeks.map(ws=>{
    return entries.filter(e=>e.date&&e.date.slice(5)>=ws).length;
  });
  renderChart('training-week-chart',{
    type:'bar',
    data:{
      labels:weeks.map(w=>w+'〜'),
      datasets:[{
        label:'週練習回数',data:weekCounts,
        backgroundColor:'rgba(59,130,246,.7)',borderColor:'#3b82f6',
        borderWidth:2,borderRadius:6
      }]
    },
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:false}},
      scales:{y:{min:0,grid:{color:'rgba(255,255,255,.06)'}},x:{grid:{display:false}}}}
  });
}

// ── 管理者ダッシュボード ─────────────────────────────────────
function _initAdminCharts() {
  // 月次手数料収入
  const months = Array.from({length:6},(_,i)=>{
    const d=new Date(); d.setMonth(d.getMonth()-5+i);
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
  });
  const feePay = months.map(m=>
    _dbArr('payments').filter(p=>p.status==='paid'&&(p.paidAt||'').startsWith(m.replace('-','/'))||false)
      .reduce((s,p)=>s+(p.fee||getFeeAmount(p.amount,p.team||p.teamId||'','monthlyFee')),0)
  );
  const feeCoach = months.map(m=>
    _dbArr('coachPay').filter(p=>p.status==='paid')
      .reduce((s,p)=>s+(p.platformTotal||getFeeAmount(p.amount,p.teamId||'','coachFee')),0)/months.length
  );

  if(document.getElementById('admin-fee-chart')){
    renderChart('admin-fee-chart',{
      type:'bar',
      data:{
        labels:months.map(m=>m.slice(5)+'月'),
        datasets:[
          {label:'月謝手数料',data:feePay,backgroundColor:'rgba(255,107,43,.75)',borderRadius:6},
          {label:'コーチ代手数料',data:feeCoach,backgroundColor:'rgba(0,207,170,.75)',borderRadius:6},
        ]
      },
      options:{responsive:true,maintainAspectRatio:false,
        plugins:{legend:{labels:{color:'#7ea3c4'}}},
        scales:{
          x:{stacked:true,grid:{display:false}},
          y:{stacked:true,grid:{color:'rgba(255,255,255,.06)'},ticks:{callback:v=>'¥'+v.toLocaleString()}}
        }}
    });
  }

  // 登録者数ドーナツ
  if(document.getElementById('admin-users-chart')){
    const parentCount=_getUsers().filter(u=>u.role==='parent').length;
    renderChart('admin-users-chart',{
      type:'doughnut',
      data:{
        labels:['コーチ','チーム','選手','保護者'],
        datasets:[{
          data:[(DB.coaches||[]).length||0,(DB.teams||[]).length||0,(DB.players||[]).length||0,parentCount||0],
          backgroundColor:['rgba(255,107,43,.8)','rgba(59,130,246,.8)','rgba(0,207,170,.8)','rgba(168,85,247,.8)'],
          borderWidth:2,borderColor:['#ff6b2b','#3b82f6','#00cfaa','#a855f7'],hoverOffset:6
        }]
      },
      options:{responsive:true,maintainAspectRatio:false,
        cutout:'55%',
        plugins:{legend:{position:'bottom'}}}
    });
  }

  // payMgmt月謝収入推移チャート
  if(document.getElementById('paymgmt-chart')){
    const months=[];const paid=[];
    for(let i=5;i>=0;i--){
      const d=new Date(); d.setMonth(d.getMonth()-i);
      const m=d.getFullYear()+'-'+(d.getMonth()+1).toString().padStart(2,'0');
      months.push((d.getMonth()+1)+'月');
      const sum=_dbArr('payments').filter(p=>p.status==='paid'&&(p.paidAt||'').startsWith(m)).reduce((s,p)=>s+(p.amount||0),0);
      paid.push(sum);
    }
    renderChart('paymgmt-chart',{
      type:'bar',
      data:{labels:months,datasets:[{label:'入金額',data:paid,backgroundColor:'rgba(249,115,22,.7)',borderRadius:6}]},
      options:{plugins:{legend:{display:false}},scales:{y:{grid:{color:'rgba(255,255,255,.05)'},ticks:{callback:v=>'¥'+v.toLocaleString()}},x:{grid:{display:false}}}}
    });
  }
}

// ── コーチダッシュボード ─────────────────────────────────────
function _initCoachDashCharts() {
  const me=getMyCoach(); if(!me) return;
  // ─ 収益チャート ─
  const paid=_dbArr('coachPay').filter(p=>p.coach===me.id&&p.status==='paid');
  const months=Array.from({length:4},(_,i)=>{
    const d=new Date();d.setMonth(d.getMonth()-3+i);
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
  });
  const amounts=months.map(m=>paid.filter(p=>p.month===m).reduce((s,p)=>s+(p.coachReceives||0),0));
  renderChart('coach-mini-earnings-chart',{
    type:'bar',
    data:{labels:months.map(m=>m.slice(5)+'月'),datasets:[{
      data:amounts,
      backgroundColor:amounts.map(a=>a>0?'rgba(255,107,43,.75)':'rgba(255,107,43,.2)'),
      borderRadius:6,borderSkipped:false,
    }]},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>'¥'+c.raw.toLocaleString()}}},
      scales:{y:{grid:{color:'rgba(0,0,0,.04)'},ticks:{callback:v=>'¥'+(v/1000).toFixed(0)+'k',font:{size:9}}},
              x:{grid:{display:false},ticks:{font:{size:9}}}}}
  });
  // ─ 選手トレーニング達成率チャート ─
  const players = DB.players.filter(p=>p.team===me.team);
  if(players.length && document.getElementById('coach-mini-training-chart')){
    const labels = players.slice(0,5).map(p=>p.name?.slice(0,3)||'?');
    const scores = players.slice(0,5).map(p=>{
      const log = DB.trainingLog[p.id]||{};
      const entries = Object.values(log);
      if(!entries.length) return 0;
      const recent = entries.sort((a,b)=>a.date>b.date?-1:1).slice(0,4);
      return Math.min(100, Math.round(recent.length/4*100));
    });
    renderChart('coach-mini-training-chart',{
      type:'bar',
      data:{labels,datasets:[{
        data:scores,
        backgroundColor:scores.map(s=>s>=75?'rgba(0,207,170,.75)':s>=50?'rgba(245,158,11,.75)':'rgba(239,68,68,.75)'),
        borderRadius:6,borderSkipped:false,
      }]},
      options:{responsive:true,maintainAspectRatio:false,
        plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>c.raw+'%'}}},
        scales:{y:{min:0,max:100,grid:{color:'rgba(0,0,0,.04)'},ticks:{callback:v=>v+'%',font:{size:9}}},
                x:{grid:{display:false},ticks:{font:{size:9}}}}}
    });
  }
}

function _initParentCharts() {
  const child=DB.players.find(p=>p.guardianId===(DB.currentUser?.id))||DB.players.find(p=>p.guardian===(DB.currentUser?.name));
  if(!child) return;
  const log=DB.trainingLog[child.id]||{};
  const entries=Object.values(log).sort((a,b)=>a.date>b.date?1:-1).slice(-7);

  // コンディション推移
  renderChart('parent-cond-chart',{
    type:'line',
    data:{
      labels:entries.length?entries.map(e=>e.date?e.date.slice(5):'--'):['データなし'],
      datasets:[{
        label:'コンディション',
        data:entries.length?entries.map(e=>e.cond||5):[5],
        borderColor:'#00cfaa',backgroundColor:'rgba(0,207,170,.15)',
        fill:true,tension:0.4,pointBackgroundColor:'#00cfaa',pointRadius:5
      }]
    },
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:false}},
      scales:{y:{min:0,max:10,grid:{color:'rgba(255,255,255,.06)'}},x:{grid:{display:false}}}}
  });

  // 栄養摂取
  const hist=getNutritionHistory();
  const days7=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-6+i);return d.toDateString();});
  const kcal7=days7.map(dk=>hist[dk]?.meals?.reduce((s,m)=>s+(m.kcal||0),0)||0);
  renderChart('parent-kcal-chart',{
    type:'bar',
    data:{
      labels:days7.map(dk=>{const d=new Date(dk);return(d.getMonth()+1)+'/'+(d.getDate());}),
      datasets:[{label:'摂取kcal',data:kcal7,backgroundColor:'rgba(59,130,246,.7)',borderRadius:6}]
    },
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:false}},
      scales:{y:{grid:{color:'rgba(255,255,255,.06)'}},x:{grid:{display:false}}}}
  });
}

// ── チームダッシュボード ─────────────────────────────────────

function _initTeamDashCharts() {
  const t=getMyTeam(); if(!t) return;
  const payments=_dbArr('payments').filter(p=>p.team===t.id);
  const months=Array.from({length:6},(_,i)=>{
    const d=new Date();d.setMonth(d.getMonth()-5+i);
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
  });
  const collected=months.map(m=>payments.filter(p=>p.status==='paid'&&(p.paidAt||'').slice(0,7)===m).reduce((s,p)=>s+(p.amount||0),0));
  const uncollected=months.map(m=>payments.filter(p=>p.status==='unpaid').reduce((s,p)=>s+(p.amount||0),0)/6);

  renderChart('team-fee-chart',{
    type:'bar',
    data:{
      labels:months.map(m=>m.slice(5)+'月'),
      datasets:[
        {label:'回収済み',data:collected,backgroundColor:'rgba(0,207,170,.75)',borderRadius:6},
        {label:'未回収',data:uncollected,backgroundColor:'rgba(239,68,68,.5)',borderRadius:6},
      ]
    },
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{labels:{color:'#7ea3c4'}}},
      scales:{x:{stacked:true,grid:{display:false}},y:{stacked:true,grid:{color:'rgba(255,255,255,.06)'},ticks:{callback:v=>'¥'+v.toLocaleString()}}}}
  });

  // v35: 新チャート群
  try{ renderCondHeatmap(); }catch(e){}
  try{ renderGrowthTracker(); }catch(e){}
  try{ renderTeamRadarChart(); }catch(e){}
  try{ renderActivitySparkline(); }catch(e){}
}

// ── コンディション ヒートマップ ───────────────────────────────
function _hmCondColor(mood){
  if(!mood||mood===0) return {bg:'rgba(148,163,184,.12)',fg:'#94a3b8'};
  if(mood<=1) return {bg:'rgba(239,68,68,.2)',fg:'#ef4444'};
  if(mood<=2) return {bg:'rgba(249,115,22,.2)',fg:'#f97316'};
  if(mood<=3) return {bg:'rgba(234,179,8,.2)',fg:'#eab308'};
  if(mood<=4) return {bg:'rgba(34,197,94,.2)',fg:'#22c55e'};
  return {bg:'rgba(0,207,170,.25)',fg:'#00cfaa'};
}
function _hmCondEmoji(mood){
  return ['—','😣','😐','🙂','😊','😄'][mood]||'—';
}
function renderCondHeatmap(){
  const container=document.getElementById('cond-heatmap-container');
  if(!container) return;
  const t=getMyTeam(); if(!t) return;
  const pls=DB.players.filter(p=>p.team===t.id);
  if(!pls.length){container.innerHTML='<div class="text-muted text-sm text-center" style="padding:24px">選手データがありません</div>';return;}
  const range=parseInt(document.getElementById('hm-range-sel')?.value||14);
  const dates=[];
  for(let i=range-1;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);dates.push(d.toISOString().slice(0,10));}
  const cols=dates.length+1;
  let html='<div class="cond-heatmap" style="grid-template-columns:minmax(90px,130px) repeat('+(dates.length)+',1fr)">';
  // Header row
  html+='<div class="cond-hm-header" style="text-align:left;padding-left:4px">選手名</div>';
  dates.forEach(d=>{const day=new Date(d);const wd=['日','月','火','水','木','金','土'][day.getDay()];const isToday=d===new Date().toISOString().slice(0,10);
    html+='<div class="cond-hm-header" style="'+(isToday?'color:var(--org);font-weight:800':'')+'">'+d.slice(8)+' <span style="font-size:7px">'+(wd)+'</span></div>';
  });
  // Player rows
  pls.forEach(p=>{
    const cLog=DB.conditionLog[p.id]||{};
    html+='<div class="cond-hm-name"><span class="hm-avi" style="background:'+(p.color||'var(--org)')+'22;color:'+(p.color||'var(--org)')+'">'+((p.name||'?')[0])+'</span><span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis">'+sanitize(p.name,10)+'</span></div>';
    dates.forEach(d=>{
      const c=cLog[d];
      const mood=c?.mood||0;
      const col=_hmCondColor(mood);
      const emoji=_hmCondEmoji(mood);
      const hasPain=c?.pain||c?.painLevel>0;
      const sleepInfo=c?.sleep?'💤'+c.sleep+'h':'';
      const tipText=d.slice(5)+' '+sanitize(p.name,8)+': '+(mood?'体調'+mood+'/5':'未記録')+(hasPain?' ⚠️痛み':'')+(sleepInfo?' '+sleepInfo:'');
      html+='<div class="cond-hm-cell" style="background:'+col.bg+';color:'+col.fg+'" '+(hasPain?'data-pain="true"':'')+' onclick="openPlayerCondDetail(\''+p.id+'\')"><span style="font-size:12px">'+emoji+'</span><div class="cond-hm-tooltip">'+tipText+'</div></div>';
    });
  });
  html+='</div>';
  // Legend
  html+='<div class="cond-hm-legend">';
  [{l:'未記録',c:'rgba(148,163,184,.12)'},{l:'悪い',c:'rgba(239,68,68,.2)'},{l:'やや不調',c:'rgba(249,115,22,.2)'},{l:'普通',c:'rgba(234,179,8,.2)'},{l:'良い',c:'rgba(34,197,94,.2)'},{l:'最高',c:'rgba(0,207,170,.25)'}].forEach(x=>{
    html+='<div class="cond-hm-legend-item"><div class="lg-box" style="background:'+x.c+'"></div>'+x.l+'</div>';
  });
  html+='<div class="cond-hm-legend-item" style="margin-left:8px"><div style="width:7px;height:7px;border-radius:50%;background:#ef4444"></div>痛み報告</div>';
  html+='</div>';
  container.innerHTML=html;
}

// ── 選手成長トラッカー ──────────────────────────────────────
window._growthTab='weight';
function switchGrowthTab(tab){
  window._growthTab=tab;
  document.querySelectorAll('.growth-tab').forEach(el=>{el.classList.toggle('active',el.dataset.gt===tab);});
  renderGrowthTracker();
}
function renderGrowthTracker(){
  const sel=document.getElementById('growth-player-sel');
  if(!sel) return;
  const pid=sel.value;
  if(!pid) return;
  const p=DB.players.find(x=>x.id===pid);
  if(!p) return;
  const tab=window._growthTab||'weight';
  const bodyLog=DB.bodyLog[p.id]||{};
  const trainLog=DB.trainingLog[p.id]||{};
  const condLog=DB.conditionLog[p.id]||{};
  const bodyEntries=Object.values(bodyLog).sort((a,b)=>a.date>b.date?1:-1);
  const trainEntries=Object.values(trainLog).sort((a,b)=>(a.date||'')>(b.date||'')?1:-1);
  const condEntries=Object.entries(condLog).map(([d,v])=>({date:d,...v})).sort((a,b)=>a.date>b.date?1:-1);

  // Stats row
  const statsEl=document.getElementById('growth-stats-row');
  if(statsEl){
    let statsHtml='';
    if(tab==='weight'){
      const latest=bodyEntries[bodyEntries.length-1];
      const prev=bodyEntries[bodyEntries.length-2];
      const delta=latest&&prev?(latest.weight-prev.weight).toFixed(1):null;
      statsHtml+='<div class="growth-stat-mini"><div class="gs-val" style="color:var(--blue)">'+(latest?.weight||'--')+'</div><div class="gs-label">体重 (kg)</div>'+(delta?'<div class="gs-delta '+(delta>0?'up':delta<0?'down':'flat')+'">'+(delta>0?'▲':delta<0?'▼':'→')+Math.abs(delta)+'kg</div>':'')+'</div>';
      statsHtml+='<div class="growth-stat-mini"><div class="gs-val" style="color:var(--teal)">'+(latest?.bodyFat||'--')+'</div><div class="gs-label">体脂肪率 (%)</div></div>';
      statsHtml+='<div class="growth-stat-mini"><div class="gs-val" style="color:var(--org)">'+(latest?.muscle||'--')+'</div><div class="gs-label">筋肉量 (kg)</div></div>';
    } else if(tab==='cond'){
      const recent=condEntries.slice(-7);
      const avgM=recent.length?(recent.reduce((s,e)=>s+(e.mood||0),0)/recent.length).toFixed(1):'--';
      const avgS=recent.filter(e=>e.sleep).length?(recent.reduce((s,e)=>s+(e.sleep||0),0)/recent.filter(e=>e.sleep).length).toFixed(1):'--';
      const painDays=recent.filter(e=>e.pain||e.painLevel>0).length;
      statsHtml+='<div class="growth-stat-mini"><div class="gs-val" style="color:var(--grn)">'+avgM+'</div><div class="gs-label">平均体調 (7日)</div></div>';
      statsHtml+='<div class="growth-stat-mini"><div class="gs-val" style="color:var(--blue)">'+avgS+'</div><div class="gs-label">平均睡眠 (h)</div></div>';
      statsHtml+='<div class="growth-stat-mini"><div class="gs-val" style="color:'+(painDays?'var(--red)':'var(--teal)')+'">'+painDays+'</div><div class="gs-label">痛み報告日</div></div>';
    } else {
      const recent=trainEntries.slice(-7);
      const avgK=recent.length?Math.round(recent.reduce((s,e)=>s+(e.kcal||0),0)/recent.length):'--';
      const totalSessions=trainEntries.length;
      const maxK=trainEntries.reduce((m,e)=>Math.max(m,e.kcal||0),0);
      statsHtml+='<div class="growth-stat-mini"><div class="gs-val" style="color:var(--org)">'+avgK+'</div><div class="gs-label">平均消費 (kcal)</div></div>';
      statsHtml+='<div class="growth-stat-mini"><div class="gs-val" style="color:var(--blue)">'+totalSessions+'</div><div class="gs-label">総練習数</div></div>';
      statsHtml+='<div class="growth-stat-mini"><div class="gs-val" style="color:var(--teal)">'+maxK+'</div><div class="gs-label">最高 (kcal)</div></div>';
    }
    statsEl.innerHTML=statsHtml;
  }

  // Chart
  let chartData={labels:[],datasets:[]};
  if(tab==='weight'){
    const entries=bodyEntries.slice(-20);
    chartData={
      labels:entries.map(e=>e.date?.slice(5)||'--'),
      datasets:[{
        label:'体重 (kg)',data:entries.map(e=>e.weight||null),
        borderColor:'#3b82f6',backgroundColor:'rgba(59,130,246,.1)',
        fill:true,tension:0.4,pointRadius:4,pointBackgroundColor:'#3b82f6',spanGaps:true
      },{
        label:'筋肉量 (kg)',data:entries.map(e=>e.muscle||null),
        borderColor:'#00cfaa',backgroundColor:'transparent',
        borderDash:[4,4],tension:0.4,pointRadius:3,pointBackgroundColor:'#00cfaa',spanGaps:true
      }]
    };
  } else if(tab==='cond'){
    const entries=condEntries.slice(-20);
    chartData={
      labels:entries.map(e=>e.date?.slice(5)||'--'),
      datasets:[{
        label:'体調',data:entries.map(e=>e.mood||0),
        borderColor:'#22c55e',backgroundColor:'rgba(34,197,94,.1)',
        fill:true,tension:0.3,pointRadius:4,pointBackgroundColor:entries.map(e=>{const m=e.mood||0;return m>=4?'#22c55e':m>=3?'#eab308':'#ef4444';}),
        yAxisID:'y'
      },{
        label:'睡眠 (h)',data:entries.map(e=>e.sleep||null),
        borderColor:'#6366f1',backgroundColor:'transparent',
        borderDash:[4,4],tension:0.4,pointRadius:3,pointBackgroundColor:'#6366f1',spanGaps:true,
        yAxisID:'y2'
      }]
    };
  } else {
    const entries=trainEntries.slice(-20);
    chartData={
      labels:entries.map(e=>(e.date||'').slice(5)||'--'),
      datasets:[{
        label:'消費kcal',data:entries.map(e=>e.kcal||0),
        borderColor:'#f97316',backgroundColor:'rgba(249,115,22,.1)',
        fill:true,tension:0.3,pointRadius:4,pointBackgroundColor:'#f97316'
      }]
    };
  }
  const scalesOpt=tab==='cond'?{
    y:{min:0,max:5,grid:{color:'rgba(0,0,0,.04)'},title:{display:true,text:'体調',color:'#22c55e',font:{size:9}},ticks:{font:{size:9}}},
    y2:{position:'right',grid:{display:false},title:{display:true,text:'睡眠(h)',color:'#6366f1',font:{size:9}},ticks:{font:{size:9}}},
    x:{grid:{display:false},ticks:{font:{size:9},maxRotation:45}}
  }:{y:{grid:{color:'rgba(0,0,0,.04)'},ticks:{font:{size:9}}},x:{grid:{display:false},ticks:{font:{size:9},maxRotation:45}}};

  renderChart('growth-tracker-chart',{
    type:'line',data:chartData,
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{labels:{font:{size:10},boxWidth:10,padding:8}},
        tooltip:{callbacks:{label:function(c){return c.dataset.label+': '+c.raw}}}},
      scales:scalesOpt,
      interaction:{mode:'index',intersect:false}}
  });
}

// ── チーム活動レーダーチャート ───────────────────────────────
function renderTeamRadarChart(){
  const t=getMyTeam(); if(!t) return;
  const pls=DB.players.filter(p=>p.team===t.id);
  if(!pls.length) return;
  const todayStr=new Date().toISOString().slice(0,10);
  // Calculate 5 axes: 出席率, 体調平均, 練習強度, 食事管理, 月謝回収
  let attendTotal=0,attendMax=0,condSum=0,condN=0,kcalSum=0,kcalN=0,mealScore=0,mealN=0;
  pls.forEach(p=>{
    const cLog=DB.conditionLog[p.id]||{};
    const last7=[];for(let i=0;i<7;i++){const d=new Date();d.setDate(d.getDate()-i);last7.push(d.toISOString().slice(0,10));}
    last7.forEach(d=>{attendMax++;if(cLog[d])attendTotal++;});
    const recent=Object.values(cLog).slice(-7);
    recent.forEach(c=>{if(c.mood){condSum+=c.mood;condN++;}});
    const tLog=DB.trainingLog[p.id]||{};
    Object.values(tLog).slice(-7).forEach(e=>{if(e.kcal){kcalSum+=e.kcal;kcalN++;}});
    const fsSummary=window._teamPlayerSummaries?.[p.id];
    if(fsSummary?.nutrition?.todayCount>0){mealScore+=Math.min(fsSummary.nutrition.todayCount/3,1);mealN++;}else{mealN++;}
  });
  const paidCount=_dbArr('payments').filter(p=>p.team===t.id&&p.status==='paid'&&p.month===curMonth()).length;
  const attendRate=attendMax?Math.round(attendTotal/attendMax*100):0;
  const condAvg=condN?(condSum/condN/5*100):50;
  const kcalAvg=kcalN?Math.min(kcalSum/kcalN/500*100,100):0;
  const mealRate=mealN?Math.round(mealScore/mealN*100):0;
  const feeRate=pls.length?Math.round(paidCount/pls.length*100):0;

  renderChart('team-radar-chart',{
    type:'radar',
    data:{
      labels:['出席率','体調','練習強度','食事管理','月謝回収'],
      datasets:[{
        label:'チームスコア',
        data:[attendRate,Math.round(condAvg),Math.round(kcalAvg),mealRate,feeRate],
        backgroundColor:'rgba(37,99,235,.12)',
        borderColor:'#2563eb',borderWidth:2,
        pointBackgroundColor:['#22c55e','#00cfaa','#f97316','#3b82f6','#8b5cf6'],
        pointRadius:5,pointHoverRadius:7
      }]
    },
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:false},
        tooltip:{callbacks:{label:c=>c.label+': '+c.raw+'%'}}},
      scales:{r:{min:0,max:100,
        grid:{color:'rgba(59,100,180,.08)'},
        angleLines:{color:'rgba(59,100,180,.08)'},
        pointLabels:{font:{size:11,weight:'700'},color:'var(--txt2)'},
        ticks:{display:false,stepSize:25}
      }}
    }
  });
}

// ── 活動スパークライン ────────────────────────────────────────
function renderActivitySparkline(){
  const t=getMyTeam(); if(!t) return;
  const pls=DB.players.filter(p=>p.team===t.id);
  const barsEl=document.getElementById('spark-bars');
  const totalEl=document.getElementById('spark-total');
  if(!barsEl) return;
  const days=14;
  const data=[];
  for(let i=days-1;i>=0;i--){
    const d=new Date();d.setDate(d.getDate()-i);
    const ds=d.toISOString().slice(0,10);
    let count=0;
    pls.forEach(p=>{
      const c=DB.conditionLog[p.id]||{};
      const t2=DB.trainingLog[p.id]||{};
      if(c[ds]) count++;
      Object.values(t2).forEach(e=>{if(e.date===ds)count++;});
    });
    data.push({date:ds,count});
  }
  const maxVal=Math.max(...data.map(d=>d.count),1);
  const totalAct=data.reduce((s,d)=>s+d.count,0);
  if(totalEl) totalEl.textContent=totalAct+'件';
  barsEl.innerHTML=data.map(d=>{
    const h=Math.max(d.count/maxVal*100,4);
    const isToday=d.date===new Date().toISOString().slice(0,10);
    const c=d.count===0?'rgba(148,163,184,.15)':d.count>=maxVal*0.7?'rgba(0,207,170,.7)':d.count>=maxVal*0.3?'rgba(37,99,235,.5)':'rgba(37,99,235,.25)';
    return '<div class="spark-bar" style="height:'+h+'%;background:'+c+';'+(isToday?'box-shadow:0 0 6px rgba(0,207,170,.4);border:1px solid rgba(0,207,170,.5)':'')+'" title="'+d.date.slice(5)+': '+d.count+'件"></div>';
  }).join('');
}

// ── 月謝管理 (team) ──────────────────────────────────────────
function _initFeeMgmtCharts() {
  const t=getMyTeam(); if(!t) return;
  const pls=DB.players.filter(p=>p.team===t.id);
  const pays=_dbArr('payments').filter(p=>p.team===t.id);
  const paidN=pays.filter(p=>p.status==='paid').length;
  const unpaidN=Math.max(0,pls.length-paidN);

  // Donutチャート
  renderChart('fee-donut-chart',{
    type:'doughnut',
    data:{labels:['支払済','未払い'],datasets:[{data:[paidN,unpaidN],
      backgroundColor:['rgba(0,207,170,.8)','rgba(239,68,68,.7)'],
      borderColor:['#00cfaa','#ef4444'],borderWidth:2,hoverOffset:6}]},
    options:{responsive:true,maintainAspectRatio:false,cutout:'60%',
      plugins:{legend:{position:'bottom',labels:{font:{size:11}}},
        tooltip:{callbacks:{label:c=>`${c.label}: ${c.raw}名`}}}}
  });

  // 月次棒グラフ
  const months=Array.from({length:6},(_,i)=>{const d=new Date();d.setMonth(d.getMonth()-5+i);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');});
  const collected=months.map(m=>pays.filter(p=>p.status==='paid'&&(p.paidAt||p.month||'').slice(0,7)===m).reduce((s,p)=>s+(p.amount||0),0));
  renderChart('fee-monthly-chart',{
    type:'bar',
    data:{labels:months.map(m=>m.slice(5)+'月'),datasets:[{
      label:'回収額',data:collected,
      backgroundColor:collected.map(v=>v>0?'rgba(0,207,170,.75)':'rgba(0,207,170,.2)'),
      borderRadius:6,borderSkipped:false}]},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>'¥'+c.raw.toLocaleString()}}},
      scales:{y:{grid:{color:'rgba(0,0,0,.04)'},ticks:{callback:v=>'¥'+(v/1000).toFixed(0)+'k',font:{size:9}}},
              x:{grid:{display:false},ticks:{font:{size:9}}}}}
  });
}

function _initCoachReportCharts() {
  const disc=getMyDisclosure(); if(!disc) return;
  const teamId=getMyCoach()?.team; if(!teamId) return;
  const selId=window.coachReportView||DB.players.filter(p=>p.team===teamId)[0]?.id;
  const p=DB.players.find(x=>x.id===selId); if(!p) return;
  const log=DB.trainingLog[p.id]||{};
  const entries=Object.values(log).sort((a,b)=>a.date>b.date?1:-1).slice(-10);
  if(!entries.length) return;

  // コンディション・kcal推移チャート
  if(document.getElementById('coach-report-cond-chart')){
    renderChart('coach-report-cond-chart',{
      type:'line',
      data:{
        labels:entries.map(e=>e.date?e.date.slice(5):'--'),
        datasets:[{
          label:'コンディション',data:entries.map(e=>e.cond||0),
          borderColor:'#00cfaa',backgroundColor:'rgba(0,207,170,.1)',
          fill:true,tension:0.4,pointBackgroundColor:'#00cfaa',pointRadius:4,yAxisID:'y'
        },{
          label:'消費kcal',data:entries.map(e=>e.kcal||0),
          borderColor:'#ff6b2b',backgroundColor:'rgba(255,107,43,.05)',
          fill:false,tension:0.4,pointBackgroundColor:'#ff6b2b',pointRadius:4,yAxisID:'y2'
        }]
      },
      options:{responsive:true,maintainAspectRatio:false,
        plugins:{legend:{labels:{color:'#7ea3c4',font:{size:10}}}},
        scales:{
          y:{min:0,max:10,grid:{color:'rgba(0,0,0,.04)'},title:{display:true,text:'コンディション',color:'#00cfaa',font:{size:10}},ticks:{font:{size:9}}},
          y2:{position:'right',grid:{display:false},title:{display:true,text:'kcal',color:'#ff6b2b',font:{size:10}},ticks:{font:{size:9}}},
          x:{grid:{display:false},ticks:{font:{size:9}}}
        }}
    });
  }

  // 体重推移チャート（身体データ）
  if(document.getElementById('coach-report-body-chart')){
    const bodyEntries=entries.filter(e=>e.weight||e.bodyFat);
    if(bodyEntries.length>=2){
      renderChart('coach-report-body-chart',{
        type:'line',
        data:{
          labels:bodyEntries.map(e=>e.date?.slice(5)||'--'),
          datasets:[{
            label:'体重(kg)',data:bodyEntries.map(e=>e.weight||null),
            borderColor:'#3b82f6',backgroundColor:'rgba(59,130,246,.08)',
            fill:true,tension:0.4,pointRadius:4,spanGaps:true
          }]
        },
        options:{responsive:true,maintainAspectRatio:false,
          plugins:{legend:{labels:{font:{size:10}}}},
          scales:{y:{grid:{color:'rgba(0,0,0,.04)'},ticks:{callback:v=>v+'kg',font:{size:9}}},
                  x:{grid:{display:false},ticks:{font:{size:9}}}}}
      });
    }
  }
}

function _initCoachPlayersCharts() {
  const me=getMyCoach(); if(!me||!me.team) return;
  const players=DB.players.filter(p=>p.team===me.team);
  if(!players.length) return;

  // コンディション推移（チーム平均）
  const weeks=Array.from({length:6},(_,i)=>{const d=new Date();d.setDate(d.getDate()-35+i*7);return d.toISOString().slice(0,10);});
  const avgConds=weeks.map(w=>{
    const conds=players.map(p=>{
      const log=DB.trainingLog[p.id]||{};
      const entries=Object.values(log).filter(e=>e.date&&e.date>=w&&e.date<=(new Date(new Date(w).getTime()+7*86400000)).toISOString().slice(0,10));
      return entries.length?entries.reduce((s,e)=>s+(e.cond||0),0)/entries.length:null;
    }).filter(c=>c!==null);
    return conds.length?(conds.reduce((a,b)=>a+b,0)/conds.length).toFixed(1):null;
  });
  const condEl=document.getElementById('coach-players-cond-chart');
  if(condEl){
    renderChart('coach-players-cond-chart',{
      type:'line',
      data:{
        labels:weeks.map(w=>w.slice(5)),
        datasets:[{label:'平均コンディション',data:avgConds,
          borderColor:'#00cfaa',backgroundColor:'rgba(0,207,170,.08)',
          fill:true,tension:0.4,pointBackgroundColor:'#00cfaa',pointRadius:4,spanGaps:true}]
      },
      options:{responsive:true,maintainAspectRatio:false,
        plugins:{legend:{display:false}},
        scales:{y:{min:0,max:10,grid:{color:'rgba(0,0,0,.04)'},ticks:{font:{size:9}}},
                x:{grid:{display:false},ticks:{font:{size:9}}}}}
    });
  }

  // 目標達成率（選手別）
  const goalEl=document.getElementById('coach-players-goal-chart');
  if(goalEl){
    const withGoals=players.filter(p=>p.goals?.short||p.goals?.long).slice(0,5);
    if(!withGoals.length){
      renderChart('coach-players-goal-chart',{type:'bar',data:{labels:['目標未設定'],datasets:[{data:[0],backgroundColor:'rgba(0,0,0,.06)'}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}}}});
    } else {
      const labels=withGoals.map(p=>p.name?.slice(0,4)||'?');
      const shortPcts=withGoals.map(p=>p.goalProgress?.short||0);
      const longPcts=withGoals.map(p=>p.goalProgress?.long||0);
      renderChart('coach-players-goal-chart',{
        type:'bar',
        data:{labels,datasets:[
          {label:'短期',data:shortPcts,backgroundColor:'rgba(255,107,43,.7)',borderRadius:4},
          {label:'長期',data:longPcts,backgroundColor:'rgba(59,130,246,.7)',borderRadius:4},
        ]},
        options:{responsive:true,maintainAspectRatio:false,
          plugins:{legend:{labels:{font:{size:9}}}},
          scales:{y:{min:0,max:100,grid:{color:'rgba(0,0,0,.04)'},ticks:{callback:v=>v+'%',font:{size:9}}},
                  x:{grid:{display:false},ticks:{font:{size:9}}}}}
      });
    }
  }
}


function _initPlayerDashCharts() {
  var p=DB.players.find(function(x){return x.id===(DB.currentUser?.id);}); if(!p) return;
  var pid=p.id;
  var log=DB.trainingLog[pid]||{};
  var cLog=DB.conditionLog[pid]||{};
  var today3=new Date().toISOString().slice(0,10);
  // 直近7日のデータを集計
  var last7d=[];
  for(var di=0;di<7;di++){var dd2=new Date();dd2.setDate(dd2.getDate()-6+di);last7d.push(dd2.toISOString().slice(0,10));}
  var weekTrain=0,weekCond=0,weekCondN=0,weekSleep=0,weekSleepN=0;
  for(var di2=0;di2<7;di2++){
    var dLog=log[last7d[di2]];
    var dCond=cLog[last7d[di2]];
    if(dLog) weekTrain++;
    if(dCond?.mood){weekCond+=dCond.mood;weekCondN++;}
    if(dCond?.sleep){weekSleep+=dCond.sleep;weekSleepN++;}
  }
  var nt2=calcTotals();
  var tgtP=p.targetProtein||Math.round((p.weight||65)*1.6);
  var tgtK=p.targetKcal||2200;
  var nutritionScore=Math.min(10,Math.round(nt2.kcal/tgtK*10));
  var proteinScore=Math.min(10,Math.round(nt2.protein/tgtP*10));
  var condScore=weekCondN>0?Math.round(weekCond/weekCondN*2):5;
  var sleepScore=weekSleepN>0?Math.min(10,Math.round(weekSleep/weekSleepN/8*10)):5;
  var trainScore=Math.min(10,weekTrain*2);
  var waterScore2=Math.min(10,Math.round((DB.meals?.water||0)/8*10));

  renderChart('player-dash-kcal-chart',{
    type:'radar',
    data:{
      labels:['コンディション','栄養バランス','睡眠','練習頻度','タンパク質','水分'],
      datasets:[{
        label:'今週の状態',
        data:[condScore,nutritionScore,sleepScore,trainScore,proteinScore,waterScore2],
        borderColor:'#00cfaa',backgroundColor:'rgba(0,207,170,.15)',
        pointBackgroundColor:'#00cfaa',pointBorderColor:'#00cfaa',
        borderWidth:2,pointRadius:3
      },{
        label:'目標',
        data:[8,8,8,8,8,8],
        borderColor:'rgba(255,107,43,.3)',backgroundColor:'rgba(255,107,43,.03)',
        borderDash:[4,4],pointRadius:0,borderWidth:1
      }]
    },
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:false}},
      scales:{r:{min:0,max:10,grid:{color:'rgba(255,255,255,.08)'},
        angleLines:{color:'rgba(255,255,255,.06)'},
        pointLabels:{color:'var(--txt3)',font:{size:10}},ticks:{display:false}}}}
  });
}


let customWorkouts = [];
function loadCustomWorkouts() {
  try {
    // Firestoreから復元されたDB.customWorkoutsがあればそちらを優先
    if(DB.customWorkouts && (DB.customWorkouts||[]).length > 0){
      customWorkouts = DB.customWorkouts.slice();
      return;
    }
    const raw = localStorage.getItem('mc_custom_workouts_v1');
    if (raw) try{customWorkouts = JSON.parse(raw);}catch(e){customWorkouts=[];}
  } catch(e) { customWorkouts = []; }
}
function saveCustomWorkouts() {
  try {
    localStorage.setItem('mc_custom_workouts_v1', JSON.stringify(customWorkouts));
  } catch(e) {}
  // DB.customWorkoutsにも同期（Firestore連携用）
  DB.customWorkouts = customWorkouts.slice();
  saveDB();
}
function getAllWorkouts() {
  return [...WORKOUTS, ...customWorkouts];
}

// カスタムメニュー追加
function openAddWorkoutForm() {
  openM('カスタムメニュー追加', `
    <div class="form-group"><label class="label">メニュー名</label>
      <input class="input" id="cw-name" placeholder="例: 体幹強化メニュー"></div>
    <div class="form-group"><label class="label">曜日</label>
      <select class="input" id="cw-day">
        <option value="月曜日">月曜日</option><option value="火曜日">火曜日</option>
        <option value="水曜日">水曜日</option><option value="木曜日">木曜日</option>
        <option value="金曜日">金曜日</option><option value="土曜日">土曜日</option>
        <option value="日曜日">日曜日</option>
      </select></div>
    <div class="form-group"><label class="label">強度（%）</label>
      <input class="input" type="number" id="cw-intensity" value="70" min="0" max="100"></div>
    <div class="fw7 text-sm mb-8">種目（最大5件）</div>
    <div id="cw-exercises">
      ${[0,1,2].map(i=>`
        <div class="grid-2 mb-8" style="grid-template-columns:2fr 1fr 1fr 1fr">
          <input class="input" placeholder="種目名" id="cw-ex-name-${i}">
          <input class="input" type="number" min="1" max="20" placeholder="セット" id="cw-ex-sets-${i}" value="3">
          <input class="input" type="number" min="1" max="100" placeholder="回数" id="cw-ex-reps-${i}" value="10">
          <input class="input" type="number" min="0" max="300" placeholder="休憩秒" id="cw-ex-rest-${i}" value="60">
        </div>`).join('')}
    </div>
    <button class="btn btn-primary w-full mt-8" onclick="saveCustomWorkout()">💾 保存</button>
  `);
}

function saveCustomWorkout() {
  const name = sanitize(document.getElementById('cw-name')?.value||'', 30);
  const day  = document.getElementById('cw-day')?.value || '月曜日';
  const intensity = parseInt(document.getElementById('cw-intensity')?.value)||70;
  if (!name) { toast('メニュー名を入力してください', 'e'); return; }
  const exercises = [];
  for (let i = 0; i < 3; i++) {
    const n = sanitize(document.getElementById(`cw-ex-name-${i}`)?.value||'', 30);
    if (!n) continue;
    const sets = parseInt(document.getElementById(`cw-ex-sets-${i}`)?.value)||3;
    const reps = parseInt(document.getElementById(`cw-ex-reps-${i}`)?.value)||10;
    const rest = parseInt(document.getElementById(`cw-ex-rest-${i}`)?.value)||60;
    exercises.push({name: n, sets, reps, unit:'回', rest});
  }
  if (!exercises.length) { toast('種目を1件以上入力してください', 'e'); return; }
  const colors = ['#ff6b2b','#00cfaa','#3b82f6','#a855f7','#f59e0b'];
  const cw = {
    id: 'cw_' + Date.now(),
    day, type: name, intensity,
    color: colors[customWorkouts.length % colors.length],
    exercises, custom: true,
  };
  customWorkouts.push(cw);
  saveCustomWorkouts();
  closeM();
  toast('カスタムメニューを追加しました', 's');
  goTo('training');
}

function deleteCustomWorkout(id) {
  if (!confirm('このメニューを削除しますか？')) return;
  customWorkouts = customWorkouts.filter(w => w.id !== id);
  saveCustomWorkouts();
  toast('削除しました', 's');
  goTo('training');
}

// ───────────────────────────────────────────────────────────
//  栄養履歴 日付別保存
// ───────────────────────────────────────────────────────────
let nutritionViewDate = new Date().toDateString(); // 表示中の日付

function getNutritionHistory() {
  try {
    var userKey = 'mc_nutrition_history_' + (DB.currentUser?.id||'anon');
    var raw = localStorage.getItem(userKey);
    // Migrate legacy key
    if(!raw) {
      raw = localStorage.getItem('mc_nutrition_history_v1');
      if(raw) { localStorage.setItem(userKey, raw); localStorage.removeItem('mc_nutrition_history_v1'); }
    }
    var local = {};
    try { local = raw ? JSON.parse(raw) : {}; } catch(e){ local = {}; }
    const remote = DB.nutritionLog || {};
    const merged = {...remote, ...local};
    return merged;
  } catch(e) { return DB.nutritionLog || {}; }
}
function saveNutritionHistory() {
  try {
    const hist = getNutritionHistory();
    hist[new Date().toDateString()] = {
      meals: [...DB.meals.today],
      water: DB.meals.water,
      date: new Date().toISOString(),
    };
    const keys = Object.keys(hist).sort((a,b)=>new Date(b)-new Date(a));
    const trimmed = {};
    keys.slice(0,30).forEach(k=>trimmed[k]=hist[k]);
    var userKey = 'mc_nutrition_history_' + (DB.currentUser?.id||'anon');
    localStorage.setItem(userKey, JSON.stringify(trimmed));
    if(!DB.nutritionLog) DB.nutritionLog = {};
    Object.keys(trimmed).forEach(k => { DB.nutritionLog[k] = trimmed[k]; });
    saveDB();
  } catch(e) {}
}

// カレンダー状態
let calViewMode = 'month'; // 'month' | 'week'
let calViewDate = new Date();
let calRepeatEvents = []; // 繰り返しイベント
function loadCalRepeatEvents() {
  try {
    const r = localStorage.getItem('mc_repeat_events_v1');
    if(r) try{calRepeatEvents = JSON.parse(r);}catch(e){calRepeatEvents=[];}
  } catch(e){ calRepeatEvents=[]; }
}
function saveCalRepeatEvents() {
  try { localStorage.setItem('mc_repeat_events_v1', JSON.stringify(calRepeatEvents)); } catch(e){}
  // DB.eventsの繰り返しイベント属性で同期（Firestore連携）
  // Note: calRepeatEventsの変更後にsaveDBを呼ぶ
  saveDB();
}

// ───────────────────────────────────────────────────────────
//  初期化フック（launchApp後に実行）
// ───────────────────────────────────────────────────────────
const _origLaunchApp = typeof launchApp === 'function' ? launchApp : null;


