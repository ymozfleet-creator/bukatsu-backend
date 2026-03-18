// 10-admin-operations.js — Admin ops
async function _fetchSystemData(){
  if(!window._sysData) window._sysData = {};
  window._sysData._loaded = true;
  window._sysData._error = null;
  if(!API_BASE){ window._sysData._error = 'バックエンドサーバー未設定'; if(curPage==='dashboard' && window._adminDashTab==='system') refreshPage(); return; }
  const headers = {'Content-Type':'application/json'};
  try {
    const hRes = await fetch(API_BASE+'/health');
    window._sysData.health = await hRes.json();

    if(!window._fbToken && typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser){
      window._fbToken = await firebase.auth().currentUser.getIdToken();
    }
    if(window._fbToken){
      headers.Authorization = 'Bearer ' + window._fbToken;
      const [stRes, lgRes, epRes, blRes] = await Promise.all([
        fetch(API+'/api/admin/stats', {headers}).catch(()=>null),
        fetch(API+'/api/admin/logs?limit=100', {headers}).catch(()=>null),
        fetch(API+'/api/admin/endpoints', {headers}).catch(()=>null),
        fetch(API+'/api/admin/blocked', {headers}).catch(()=>null),
      ]);
      if(stRes?.ok) window._sysData.stats = await stRes.json();
      if(lgRes?.ok) window._sysData.logs = await lgRes.json();
      if(epRes?.ok) window._sysData.endpoints = await epRes.json();
      if(blRes?.ok) window._sysData.blocked = await blRes.json();
    }
    window._sysData._loaded = true;
  } catch(e) {
    window._sysData._error = e.message;
    window._sysData._loaded = true;
  }
  if(curPage==='dashboard' && window._adminDashTab==='system') refreshPage();
}

async function _unblockIP(ip){
  if(!API_BASE){ toast('バックエンドサーバー未設定','e'); return; }
  if(!window._fbToken){ toast('認証トークンが必要です','e'); return; }
  try {
    await fetch(API_BASE+'/api/admin/unblock',{
      method:'POST', headers:{Authorization:'Bearer '+window._fbToken,'Content-Type':'application/json'},
      body:JSON.stringify({ip})
    });
    toast('IP '+ip+' のブロックを解除しました','s');
    _fetchSystemData();
  } catch(e){ toast('解除に失敗しました','e'); }
}

// 監査ログCSVエクスポート
function exportAuditLogCSV(){
  if(DB.currentUser?.role!=='admin'){toast('権限がありません','e');return;}
  const rows=[['日時','操作','詳細','ユーザー名','ロール','UA']];
  (DB.auditLog||[]).forEach(l=>{
    rows.push([l.timestamp||'',l.action||'',l.detail||'',l.user?.name||'system',l.user?.role||'',l.ua||'']);
  });
  _downloadCSV(rows,'audit_log_'+curMonth()+'.csv');
  toast('監査ログをエクスポートしました','s');
}

function openAdminMsgMonitor(){
  var allRooms=Object.entries(DB.chats);
  var totalMsgs=allRooms.reduce(function(s,e){return s+(e[1].msgs||[]).length;},0);
  var modLog=DB.moderationLog||[];
  var suspUsers=Object.keys(DB.suspendedUsers||{}).filter(function(k){return (DB.suspendedUsers||{})[k]?.suspended;});
  var warnedUsers=Object.keys(DB.userWarnings||{}).filter(function(k){return (DB.userWarnings||{})[k]?.count>0;});
  // 最近のメッセージ（全ルーム横断）
  var recentMsgs=[];
  allRooms.forEach(function(e){
    var rk=e[0],ch=e[1];
    (ch.msgs||[]).forEach(function(m,i){
      if(m.from==='system')return;
      recentMsgs.push({roomKey:rk,roomName:ch.name||rk,idx:i,msg:m});
    });
  });
  recentMsgs.sort(function(a,b){return (b.msg.time||'')>(a.msg.time||'')?1:-1;});

  var h='<div style="display:grid;gap:12px">';
  // KPI
  h+='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">';
  h+='<div style="text-align:center;padding:10px;background:var(--surf2);border-radius:8px"><div style="font-size:18px;font-weight:800">'+totalMsgs+'</div><div style="font-size:9px;color:var(--txt3)">総メッセージ</div></div>';
  h+='<div style="text-align:center;padding:10px;background:var(--surf2);border-radius:8px"><div style="font-size:18px;font-weight:800">'+allRooms.length+'</div><div style="font-size:9px;color:var(--txt3)">会話数</div></div>';
  h+='<div style="text-align:center;padding:10px;background:var(--surf2);border-radius:8px"><div style="font-size:18px;font-weight:800;color:'+(warnedUsers.length?'var(--yel)':'var(--grn)')+'">'+warnedUsers.length+'</div><div style="font-size:9px;color:var(--txt3)">忠告済み</div></div>';
  h+='<div style="text-align:center;padding:10px;background:var(--surf2);border-radius:8px"><div style="font-size:18px;font-weight:800;color:'+(suspUsers.length?'var(--red)':'var(--grn)')+'">'+suspUsers.length+'</div><div style="font-size:9px;color:var(--txt3)">停止中</div></div>';
  h+='</div>';

  // 停止中ユーザー
  if(suspUsers.length){
    h+='<div style="padding:10px;background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.12);border-radius:10px">';
    h+='<div style="font-size:12px;font-weight:700;color:var(--red);margin-bottom:6px">🚫 停止中のアカウント</div>';
    suspUsers.forEach(function(uid){
      var info=(DB.suspendedUsers||{})[uid]||{};
      var name=uid;
      // ユーザー名検索
      var u=_getUsers().find(function(x){return x.id===uid;});
      if(u)name=u.name;
      h+='<div style="display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid rgba(239,68,68,.08)">';
      h+='<span style="font-size:12px;font-weight:600;flex:1">'+name+'</span>';
      h+='<span style="font-size:9px;color:var(--txt3)">'+info.reason+'</span>';
      h+='<span style="font-size:9px;color:var(--red)">'+(info.until==='permanent'?'永久':'〜'+(info.until||'').slice(0,10))+'</span>';
      h+='<button class="btn btn-ghost btn-xs" style="font-size:9px" onclick="adminUnsuspendUser(\''+uid+'\');closeM();">解除</button>';
      h+='</div>';
    });
    h+='</div>';
  }

  // 全会話一覧
  h+='<div><div style="font-size:12px;font-weight:700;margin-bottom:6px">💬 全会話一覧</div>';
  h+='<div style="max-height:180px;overflow-y:auto">';
  allRooms.sort(function(a,b){return (b[1].msgs||[]).length-(a[1].msgs||[]).length;}).forEach(function(e){
    var rk=e[0],ch=e[1];
    var mc=(ch.msgs||[]).length;
    var lastMsg=(ch.msgs||[]).slice(-1)[0];
    h+='<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--b1);cursor:pointer" onclick="closeM();activeRoom=\''+rk+'\';goTo(\'chat\')">';
    h+='<span style="font-size:16px">'+ch.avi+'</span>';
    h+='<div style="flex:1"><div style="font-size:11px;font-weight:600">'+(ch.name||rk)+'</div>';
    h+='<div style="font-size:9px;color:var(--txt3)">'+mc+'件 · 最終: '+(lastMsg?.name||'')+'</div></div>';
    h+='<i class="fa fa-chevron-right" style="font-size:9px;color:var(--txt3)"></i>';
    h+='</div>';
  });
  h+='</div></div>';

  // 最近のメッセージ
  h+='<div><div style="font-size:12px;font-weight:700;margin-bottom:6px">📋 最新メッセージ（全ルーム）</div>';
  h+='<div style="max-height:200px;overflow-y:auto">';
  recentMsgs.slice(0,20).forEach(function(r){
    var m=r.msg;
    var isSusp=(DB.suspendedUsers||{})[m.from]?.suspended;
    h+='<div style="display:flex;align-items:flex-start;gap:6px;padding:5px 0;border-bottom:1px solid var(--b1)'+(m.adminDeleted?';opacity:.4':'')+'">';
    h+='<div style="flex:1;min-width:0">';
    h+='<div style="font-size:9px;color:var(--txt3)"><b>'+(m.name||'?')+'</b>'+(isSusp?' <span style="color:var(--red)">[停止中]</span>':'')+' in '+r.roomName+' · '+m.time+'</div>';
    h+='<div style="font-size:11px;color:var(--txt1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+sanitize(m.text||'',60)+'</div>';
    h+='</div>';
    if(!m.deleted&&!m.adminDeleted){
      h+='<button class="btn btn-ghost btn-xs" style="font-size:9px;color:var(--red);flex-shrink:0" onclick="closeM();adminDeleteMsg(\''+r.roomKey+'\','+r.idx+')">削除</button>';
      h+='<button class="btn btn-ghost btn-xs" style="font-size:9px;color:#f59e0b;flex-shrink:0" onclick="closeM();adminWarnUser(\''+r.roomKey+'\','+r.idx+')">忠告</button>';
    }
    h+='</div>';
  });
  h+='</div></div>';

  // モデレーション履歴
  if(modLog.length){
    h+='<div><div style="font-size:12px;font-weight:700;margin-bottom:6px">📜 モデレーション履歴</div>';
    modLog.slice(-10).reverse().forEach(function(l){
      var icon=l.type==='delete'?'🗑️':l.type==='warn'?'⚠️':l.type==='suspend'?'🚫':'🧹';
      var label=l.type==='delete'?'削除':l.type==='warn'?'忠告':l.type==='suspend'?'停止':'全削除';
      h+='<div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:10px;border-bottom:1px solid var(--b1)">';
      h+='<span>'+icon+'</span><span style="font-weight:700">'+label+'</span>';
      h+='<span style="flex:1;color:var(--txt3)">'+(l.userName||'')+(l.originalText?' 「'+l.originalText.slice(0,20)+'…」':'')+'</span>';
      h+='<span style="color:var(--txt3)">'+(l.date||'').slice(0,10)+'</span>';
      h+='</div>';
    });
    h+='</div>';
  }

  h+='</div>';
  openM('🛡️ メッセージ監視ダッシュボード', h, true);
}

function adminUnsuspendUser(uid){
  if(DB.currentUser?.role!=='admin'){toast('管理者権限が必要です','e');return;}
  if(DB.suspendedUsers&&DB.suspendedUsers[uid]){
    DB.suspendedUsers[uid].suspended=false;
    if(!DB.moderationLog)DB.moderationLog=[];
    _dbArr('moderationLog').push({type:'unsuspend',userId:uid,date:new Date().toISOString()});
    saveDB();
    toast('アカウント停止を解除しました','s');
  }
}

function openAdminUserMgmt(){
  const allUsers=_getUsers();
  const roleLabels={admin:'事務局',team:'チーム',coach:'コーチ',player:'選手',parent:'保護者'};
  const roleColors={admin:'#ef4444',team:'#3b82f6',coach:'#f97316',player:'#00cfaa',parent:'#a855f7'};
  let h='<div style="margin-bottom:12px"><input class="input" placeholder="🔍 名前・メールで検索..." oninput="filterAdminUsers(this.value)" style="font-size:12px;height:36px"></div>';
  h+='<div id="admin-user-list" style="max-height:500px;overflow-y:auto">';
  const roleCounts={};
  allUsers.forEach(u=>{roleCounts[u.role]=(roleCounts[u.role]||0)+1;});
  h+='<div style="display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap">';
  Object.entries(roleCounts).forEach(([r,c])=>{
    h+='<span style="padding:3px 10px;border-radius:12px;background:'+(roleColors[r]||'#888')+'18;color:'+(roleColors[r]||'#888')+';font-size:11px;font-weight:700">'+(roleLabels[r]||r)+' '+c+'</span>';
  });
  h+='</div>';
  allUsers.forEach(u=>{
    const rc=roleColors[u.role]||'#888';
    h+='<div class="admin-user-row" data-name="'+(u.name||'').toLowerCase()+'" data-email="'+(u.email||'').toLowerCase()+'" style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--b1)">';
    h+='<div class="avi" style="background:'+rc+';width:30px;height:30px;font-size:11px;flex-shrink:0">'+((u.name||'?')[0])+'</div>';
    h+='<div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:700">'+sanitize(u.name||'--',20)+'</div><div style="font-size:10px;color:var(--txt3)">'+sanitize(u.email||'',24)+'</div></div>';
    h+='<span class="badge" style="background:'+rc+'18;color:'+rc+';font-size:9px">'+(roleLabels[u.role]||u.role)+'</span>';
    h+='</div>';
  });
  h+='</div>';
  openM('👥 ユーザー管理 ('+allUsers.length+'名)', h, true);
}
function filterAdminUsers(q){
  const rows=document.querySelectorAll('.admin-user-row');
  const query=q.toLowerCase();
  rows.forEach(r=>{
    const name=r.getAttribute('data-name')||'';
    const email=r.getAttribute('data-email')||'';
    r.style.display=(name.includes(query)||email.includes(query))?'flex':'none';
  });
}

function sendBroadcastMsg(){
  if(DB.currentUser?.role!=='admin'){toast('権限がありません','e');return;}
  const inp=document.getElementById('broadcast-msg');
  const msg=(inp?.value||'').trim();
  if(!msg){toast('メッセージを入力してください','e');return;}
  // g1チャットに追加
  const ch=DB.chats['g1'];
  if(ch){
    const now=new Date();
    const time=now.getHours().toString().padStart(2,'0')+':'+now.getMinutes().toString().padStart(2,'0');
    ch.msgs.push({mid:_genMsgId(),from:'admin',name:'事務局',text:msg,time,date:new Date().toISOString().slice(0,10),read:false});
  }
  // 全ユーザーにnotif
  addNotif('📢 事務局より: '+msg.slice(0,40)+(msg.length>40?'…':''),'fa-bullhorn','chat');
  saveDB();
  if(inp) inp.value='';
  toast('全体連絡を送信しました','s');
}

function exportAdminReport(){
  addAuditLog('admin_export','管理者エクスポート: exportAdminReport');
  if(DB.currentUser?.role!=='admin'){toast('権限がありません','e');return;}
  const rows=[['種別','名前','スポーツ','地域','ステータス','メール','登録日']];
  DB.coaches.forEach(c=>rows.push(['コーチ',c.name,c.sport,c.area,c.verified?'承認済':'審査中',c.email||'',c.createdAt||'']));
  DB.teams.forEach(t=>rows.push(['チーム',t.name,t.sport,t.area,'登録済',t.email||'',t.createdAt||'']));
  DB.players.forEach(p=>{const t=DB.teams.find(x=>x.id===p.team);rows.push(['選手',p.name,t?.sport||'--',t?.area||'--',p.status==='paid'?'支払済':'未払い','',p.createdAt||'']);});
  _getUsers().filter(u=>u.role==='parent').forEach(u=>rows.push(['保護者',u.name,'--','--','登録済',u.email||'',u.createdAt||'']));
  const csv=rows.map(r=>r.map(v=>'"'+(v||'').toString().replace(/"/g,'""')+'"').join(',')).join('\n');
  const blob=new Blob(['﻿'+csv],{type:'text/csv;charset=utf-8;'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);
  a.download='admin_full_report_'+curMonth()+'.csv';a.click();
  toast('全データレポートをダウンロードしました','s');
}

function exportAdminCoachCSV(){
  addAuditLog('admin_export','管理者エクスポート: exportAdminCoachCSV');
  if(DB.currentUser?.role!=='admin'){toast('権限がありません','e');return;}
  const rows=[['名前','種目','エリア','指導歴','月額料金','都度料金','評価','レビュー数','承認','募集中','担当チーム数','メール','自己紹介']];
  DB.coaches.forEach(c=>{
    const teamCount=DB.teams.filter(t=>t.coach===c.id).length;
    rows.push([c.name,c.sport,c.area,(c.exp||'')+'年',c.price||0,c.priceOnetime||0,c.rating||'',c.reviews||0,c.verified?'承認済':'審査中',c.avail?'募集中':'契約中',teamCount,c.email||'',c.bio||c.pr||'']);
  });
  _downloadCSV(rows,'coaches_'+curMonth()+'.csv');
  toast('コーチ一覧CSVをダウンロードしました','s');
}

function exportAdminTeamCSV(){
  addAuditLog('admin_export','管理者エクスポート: exportAdminTeamCSV');
  if(DB.currentUser?.role!=='admin'){toast('権限がありません','e');return;}
  const rows=[['チーム名','種目','エリア','選手数','コーチ','月謝','月謝回収率','代表者メール']];
  DB.teams.forEach(t=>{
    const playerCount=DB.players.filter(p=>p.team===t.id).length;
    const coach=DB.coaches.find(c=>c.id===t.coach);
    const teamPay=_dbArr('payments').filter(p=>(p.team===t.id||p.teamId===t.id));
    const rate=teamPay.length?Math.round(teamPay.filter(p=>p.status==='paid').length/teamPay.length*100):0;
    rows.push([t.name,t.sport,t.area,playerCount,coach?.name||'未配置',t.fee||0,rate+'%',t.email||'']);
  });
  _downloadCSV(rows,'teams_'+curMonth()+'.csv');
  toast('チーム一覧CSVをダウンロードしました','s');
}

function exportAdminPayCSV(){
  addAuditLog('admin_export','管理者エクスポート: exportAdminPayCSV');
  if(DB.currentUser?.role!=='admin'){toast('権限がありません','e');return;}
  const rows=[['種別','選手/コーチ名','チーム','金額','手数料','ステータス','月','支払日']];
  _dbArr('payments').forEach(p=>{
    const pl=DB.players.find(x=>x.id===p.player);
    const tm=DB.teams.find(x=>x.id===p.team);
    rows.push(['月謝',pl?.name||'不明',tm?.name||'--',p.amount||0,p.fee||0,p.status,p.month||'',p.paidAt||'']);
  });
  _dbArr('coachPay').forEach(p=>{
    rows.push(['コーチ報酬',p.coachName||'不明',p.teamName||'--',p.amount||0,p.platformTotal||0,p.status,'',p.paidAt||'']);
  });
  _downloadCSV(rows,'payments_'+curMonth()+'.csv');
  toast('支払いデータCSVをダウンロードしました','s');
}

function exportAdminMatchCSV(){
  addAuditLog('admin_export','管理者エクスポート: exportAdminMatchCSV');
  if(DB.currentUser?.role!=='admin'){toast('権限がありません','e');return;}
  const rows=[['コーチ名','チーム名','申請種別','ステータス','申請日']];
  _dbArr('requests').forEach(r=>{
    rows.push([r.coachName||'不明',r.teamName||'不明',r.type==='team_to_coach'?'チーム→コーチ':'コーチ→チーム',r.status==='pending'?'保留':r.status==='matched'?'成立':'却下',r.createdAt||'']);
  });
  _downloadCSV(rows,'matching_'+curMonth()+'.csv');
  toast('マッチング履歴CSVをダウンロードしました','s');
}

function _downloadCSV(rows,filename){
  const csv=rows.map(r=>r.map(v=>'"'+(v||'').toString().replace(/"/g,'""')+'"').join(',')).join('\n');
  const blob=new Blob(['﻿'+csv],{type:'text/csv;charset=utf-8;'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;a.click();
}

function exportAdminSummaryPDF(){
  addAuditLog('admin_export','管理者エクスポート: exportAdminSummaryPDF');
  if(DB.currentUser?.role!=='admin'){toast('権限がありません','e');return;}
  if(typeof jspdf==='undefined'&&typeof window.jspdf==='undefined'){toast('PDF生成ライブラリを読み込み中…','i');return;}
  try{
    const {jsPDF}=window.jspdf;
    const doc=new jsPDF('p','mm','a4');
    const now=new Date();
    const dateStr=now.toLocaleDateString('ja-JP',{year:'numeric',month:'long',day:'numeric'});
    // ヘッダー
    doc.setFillColor(15,23,42);doc.rect(0,0,210,40,F='F');
    doc.setTextColor(255,255,255);doc.setFontSize(18);
    doc.text('MyCOACH-MyTEAM 管理レポート',15,20);
    doc.setFontSize(10);doc.text(dateStr,15,30);
    // KPI
    doc.setTextColor(30,50,86);doc.setFontSize(12);
    let y=55;
    const tf2=_dbArr('payments').filter(p=>p.status==='paid').reduce((s,p)=>s+(p.fee||0),0)+_dbArr('coachPay').filter(p=>p.status==='paid').reduce((s,p)=>s+(p.platformTotal||0),0);
    const kpis=[
      ['Total Fee Revenue','¥'+tf2.toLocaleString()],
      ['Coaches',(DB.coaches||[]).length+' (Verified: '+DB.coaches.filter(c=>c.verified).length+')'],
      ['Teams',(DB.teams||[]).length+''],
      ['Players',(DB.players||[]).length+''],
      ['Unpaid',_dbArr('payments').filter(p=>p.status==='unpaid').length+' items'],
      ['Match Rate',(_dbArr('requests').length?((_dbArr('requests').filter(r=>r.status==='matched').length/_dbArr('requests').length)*100).toFixed(0):0)+'%'],
    ];
    doc.setFontSize(14);doc.text('Key Metrics',15,y);y+=8;
    kpis.forEach(k=>{doc.setFontSize(10);doc.text(k[0]+': '+k[1],20,y);y+=6;});
    // コーチ一覧
    y+=8;doc.setFontSize(14);doc.text('Coach List',15,y);y+=8;
    doc.setFontSize(9);
    (DB.coaches||[]).slice(0,15).forEach(c=>{
      if(y>270){doc.addPage();y=20;}
      doc.text(c.name+' | '+c.sport+' | '+(c.verified?'Approved':'Pending')+' | ¥'+(c.price||0).toLocaleString(),20,y);
      y+=5;
    });
    // チーム
    y+=8;if(y>250){doc.addPage();y=20;}
    doc.setFontSize(14);doc.text('Team List',15,y);y+=8;
    doc.setFontSize(9);
    (DB.teams||[]).slice(0,15).forEach(t=>{
      if(y>270){doc.addPage();y=20;}
      const pc=DB.players.filter(p=>p.team===t.id).length;
      doc.text(t.name+' | '+t.sport+' | '+pc+' players | Fee: ¥'+(t.fee||0).toLocaleString(),20,y);
      y+=5;
    });
    doc.save('admin_summary_'+curMonth()+'.pdf');
    toast('サマリーPDFをダウンロードしました','s');
  }catch(e){
    console.error('PDF export error:',e);
    toast('PDF生成に失敗しました','e');
  }
}

function toggleAdminExportMenu(){
  const m=document.getElementById('admin-export-menu');
  if(m)m.classList.toggle('show');
  // 外側クリックで閉じる
  if(m?.classList.contains('show')){
    setTimeout(()=>{
      const handler=function(e){if(!m.contains(e.target)&&e.target.id!=='admin-export-btn'){m.classList.remove('show');document.removeEventListener('click',handler);}};
      document.addEventListener('click',handler);
    },10);
  }
}

function adminFilterCoachTable(q){
  const query=q.toLowerCase();
  document.querySelectorAll('.admin-coach-row').forEach(r=>{
    r.style.display=(r.getAttribute('data-search')||'').includes(query)?'':'none';
  });
}
function adminFilterTeamTable(q){
  const query=q.toLowerCase();
  document.querySelectorAll('.admin-team-row').forEach(r=>{
    r.style.display=(r.getAttribute('data-search')||'').includes(query)?'':'none';
  });
}
function coachMgmt(){if(DB.currentUser?.role!=='admin'){toast('このページは事務局のみ利用できます','e');return '<div class="pg-head"><div class="pg-title">アクセス拒否</div></div><div class="card text-center" style="padding:40px"><div style="font-size:40px;margin-bottom:12px">🔒</div><div class="fw7">このページへのアクセス権がありません</div></div>';}
  return`<div class="pg-head flex justify-between items-center"><div><div class="pg-title">コーチ管理</div><div class="pg-sub">登録コーチの審査・管理</div></div><button class="btn btn-primary btn-sm" onclick="openM(&quot;コーチ追加&quot;,coachAddForm())">+ コーチ追加</button></div>
<div class="pcard-grid">${DB.coaches.map(c=>`<div class="profile-card" onclick="openCoachDetail('${c.id}')"><div style="position:relative;display:inline-block;margin-bottom:12px"><div class="avi avi-lg" style="background:${c.color||'var(--org)'};${c.photo?'background-image:url('+c.photo+');background-size:cover;background-position:center':''}">${c.photo?'':(c.name||'?')[0]}</div>${c.verified?`<div style="position:absolute;bottom:2px;right:2px;width:16px;height:16px;background:var(--green);border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid var(--surf)"><i class="fa fa-check" style="font-size:7px;color:#fff"></i></div>`:''}</div><div class="fw7 mb-4">${sanitize(c.name||'',30)}</div><div class="text-xs" style="color:var(--org);margin-bottom:8px">${c.sport} / ${c.spec}</div><div class="stars mb-8">${'★'.repeat(Math.round(c.rating))} <span class="text-xs text-muted">${c.rating}（${c.reviews}件）</span></div><div class="flex gap-6 justify-center flex-wrap mb-12"><span class="badge ${c.avail?'b-green':'b-red'}">${c.avail?'募集中':'契約中'}</span><span class="badge b-gray">${c.area}</span>${!c.verified?`<span class="badge b-yel">審査中</span>`:''}</div><div style="text-align:center;margin-bottom:12px"><div class="fw8 text-sm">${c.exp}年</div><div class="text-xs text-muted">指導歴</div></div>${!c.verified?`<button class="btn btn-success btn-sm w-full" onclick="event.stopPropagation();approveCoach('${c.id}')">✓ 承認する</button>`:''}</div>`).join('')}</div>
  <div class="card mt-20">
    <div class="fw7 mb-14" style="font-size:15px"><i class="fa fa-handshake" style="color:var(--org)"></i> マッチング申請一覧</div>
    ${_dbArr('requests').length===0
      ? '<div class="text-muted text-sm">申請はありません</div>'
      : '<div class="tbl-wrap"><table><thead><tr><th>チーム</th><th>コーチ</th><th>申請日</th><th>状態</th><th>操作</th></tr></thead><tbody>'+
        _dbArr('requests').map(req=>{
          const team=DB.teams.find(t=>t.id===req.teamId);
          const coach=DB.coaches.find(co=>co.id===req.coachId);
          const stMap={pending:'<span class="badge b-yel">承認待ち</span>',accepted:'<span class="badge b-teal">成立</span>',rejected:'<span class="badge b-gray">却下</span>'};
          return '<tr><td>'+(team?team.name:'不明')+'</td><td>'+(coach?coach.name:'不明')+'</td><td>'+req.createdAt+'</td><td>'+(stMap[req.status]||req.status)+'</td><td>'+
            (req.status==='pending'?'<button class="btn btn-primary btn-sm" onclick="adminAcceptMatch(\''+req.id+'\')">✓ 承認</button>':'')+'</td></tr>';
        }).join('')+
        '</tbody></table></div>'
    }
  </div>`;
}

// ==================== TEAM MGMT ====================
function teamMgmt(){
  if(DB.currentUser?.role!=='admin'){toast('このページは事務局のみ利用できます','e');return '<div class="pg-head"><div class="pg-title">アクセス拒否</div></div><div class="card text-center" style="padding:40px"><div style="font-size:40px;margin-bottom:12px">🔒</div></div>';}
  const teams=DB.teams;
  const totalMembers=teams.reduce((s,t)=>s+(t.members||0),0);
  const matchedTeams=teams.filter(t=>_dbArr('requests').some(r=>r.status==='matched'&&r.teamId===t.id)).length;
  return`<div class="pg-head flex justify-between items-center">
    <div><div class="pg-title">チーム管理</div><div class="pg-sub">登録チームの管理・マッチング確認</div></div>
    <div class="flex gap-8">
      <button class="btn btn-primary btn-sm" onclick="openM('チーム追加',adminAddTeamForm())">+ チーム追加</button>
      <button class="btn btn-secondary btn-sm" onclick="exportAllUsersCSV()">⬇ CSV</button>
    </div>
  </div>

  <div class="stat-row" style="grid-template-columns:repeat(4,1fr);margin-bottom:20px">
    <div class="stat-box"><div class="stat-l">登録チーム数</div><div class="stat-n">${teams.length}</div></div>
    <div class="stat-box"><div class="stat-l">総選手数</div><div class="stat-n">${totalMembers}名</div></div>
    <div class="stat-box"><div class="stat-l">マッチング済</div><div class="stat-n">${matchedTeams}</div></div>
    <div class="stat-box"><div class="stat-l">コーチ未配置</div><div class="stat-n" style="color:var(--red)">${teams.length-matchedTeams}</div></div>
  </div>

  <div class="card" style="padding:0;overflow:hidden">
    <div style="padding:14px 16px;border-bottom:1px solid var(--bdr);font-weight:700;font-size:14px">チーム一覧</div>
    ${teams.length===0?'<div class="text-muted text-sm text-center" style="padding:40px">チーム未登録</div>':''}
    <div style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;min-width:780px">
        <thead><tr style="background:var(--surf2);font-size:12px;color:var(--txt3)">
          <th style="padding:10px 14px;text-align:left;min-width:120px">チーム名</th>
          <th style="padding:10px 8px;text-align:left;min-width:60px">種目</th>
          <th style="padding:10px 8px;text-align:center;min-width:50px">選手数</th>
          <th style="padding:10px 8px;text-align:left;min-width:80px">担当コーチ</th>
          <th style="padding:10px 8px;text-align:right;min-width:70px">月謝</th>
          <th style="padding:10px 8px;text-align:center;min-width:60px">手数料率</th>
          <th style="padding:10px 8px;text-align:center;min-width:70px">ステータス</th>
          <th style="padding:10px 8px;text-align:center;min-width:100px">操作</th>
        </tr></thead>
        <tbody>
          ${teams.map(t=>{
            const matchedReq=_dbArr('requests').find(r=>r.status==='matched'&&r.teamId===t.id);
            const coach=matchedReq?DB.coaches.find(c=>c.id===matchedReq.coachId):null;
            const players=DB.players.filter(p=>p.team===t.id);
            const unpaid=_dbArr('payments').filter(p=>p.team===t.id&&p.status==='unpaid').length;
            return`<tr style="border-bottom:1px solid var(--bdr);font-size:13px">
              <td style="padding:12px 16px">
                <div class="fw7">${sanitize(t.name,20)}</div>
                <div class="text-xs text-muted">${sanitize(t.code||'',12)}</div>
              </td>
              <td style="padding:12px 8px"><span class="badge b-blue" style="font-size:10px">${sanitize(t.sport||'--',12)}</span></td>
              <td style="padding:12px 8px">${players.length}名</td>
              <td style="padding:12px 8px">${coach?`<span class="badge b-green" style="font-size:10px">${sanitize(coach.name,10)}</span>`:'<span class="badge b-yel" style="font-size:10px">未配置</span>'}</td>
              <td style="padding:12px 8px">¥${(t.fee||0).toLocaleString()}</td>
              <td style="padding:12px 8px;text-align:center"><span style="font-size:11px;font-weight:700;color:${DB.teamFeeRates?.[t.id]?'var(--org)':'var(--txt3)'}">${getFeeRate(t.id,'monthlyFee')}%</span>${DB.teamFeeRates?.[t.id]?'<div style="font-size:8px;color:var(--org)">カスタム</div>':''}</td>
              <td style="padding:12px 8px">${unpaid?`<span class="badge b-org" style="font-size:10px">未払 ${unpaid}件</span>`:'<span class="badge b-green" style="font-size:10px">正常</span>'}</td>
              <td style="padding:12px 8px;text-align:center">
                <button class="btn btn-ghost btn-xs" onclick="openAdminTeamDetail('${t.id}')">詳細</button>
                <button class="btn btn-ghost btn-xs" onclick="adminEditTeam('${t.id}')">✏️</button>
                <button class="btn btn-ghost btn-xs" style="color:var(--red)" onclick="adminDeleteTeam('${t.id}')">🗑️</button>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function openAdminTeamDetail(teamId){
  const t=DB.teams.find(x=>x.id===teamId);
  if(!t){toast('チームが見つかりません','e');return;}
  const players=DB.players.filter(p=>p.team===teamId);
  const req=_dbArr('requests').find(r=>r.status==='matched'&&r.teamId===teamId);
  const coach=req?DB.coaches.find(c=>c.id===req.coachId):null;
  const unpaidPays=_dbArr('payments').filter(p=>p.team===teamId&&p.status==='unpaid');
  const fr=DB.teamFeeRates?.[teamId]||{};
  const mfr=fr.monthlyFee??DB.settings?.feeRate??10;
  const cfr=fr.coachFee??DB.settings?.coachRate??10;
  const afr=fr.adhocFee??DB.settings?.feeRate??10;
  const gfr=fr.goodsFee??DB.settings?.feeRate??10;
  const isCustom=DB.teamFeeRates?.[teamId]!==undefined;

  openM(`📋 ${t.name}`,`
    <div style="display:grid;gap:12px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="card" style="padding:12px"><div class="text-xs text-muted">種目</div><div class="fw7">${sanitize(t.sport||'--',20)}</div></div>
        <div class="card" style="padding:12px"><div class="text-xs text-muted">担当コーチ</div><div class="fw7">${coach?sanitize(coach.name,20):'未配置'}</div></div>
        <div class="card" style="padding:12px"><div class="text-xs text-muted">登録選手数</div><div class="fw7">${players.length}名</div></div>
        <div class="card" style="padding:12px"><div class="text-xs text-muted">月謝</div><div class="fw7">¥${(t.fee||0).toLocaleString()}</div></div>
      </div>

      <!-- 手数料設定 -->
      <div style="background:var(--surf2);border-radius:10px;padding:14px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
          <div class="fw7 text-sm">💴 手数料設定</div>
          ${isCustom?'<span style="font-size:9px;padding:2px 8px;border-radius:6px;background:var(--org)12;color:var(--org);font-weight:700">カスタム</span>':'<span style="font-size:9px;padding:2px 8px;border-radius:6px;background:var(--surf3);color:var(--txt3)">デフォルト</span>'}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          ${[
            {k:'monthlyFee',l:'月謝手数料',v:mfr},
            {k:'coachFee',l:'コーチ代手数料',v:cfr},
            {k:'adhocFee',l:'都度請求手数料',v:afr},
            {k:'goodsFee',l:'用品・一般手数料',v:gfr},
          ].map(s=>`<div style="display:flex;align-items:center;gap:6px">
            <span style="font-size:11px;color:var(--txt3);flex:1">${s.l}</span>
            <input type="number" min="0" max="100" value="${s.v}" id="tfr-${s.k}-${teamId}" style="width:48px;padding:4px 6px;text-align:center;border:1px solid var(--bdr);border-radius:6px;background:var(--surf);color:var(--txt1);font-size:12px;font-weight:700">
            <span style="font-size:11px;color:var(--txt3)">%</span>
          </div>`).join('')}
        </div>
        <div style="display:flex;gap:6px;margin-top:10px">
          <button class="btn btn-primary btn-xs" onclick="saveTeamFeeRates('${teamId}')">保存</button>
          ${isCustom?`<button class="btn btn-ghost btn-xs" onclick="resetTeamFeeRates('${teamId}')">デフォルトに戻す</button>`:''}
        </div>
      </div>

      ${players.length?`<div><div class="fw7 text-sm mb-8">選手一覧</div>${players.map(p=>`<div class="payment-method-row"><div><div class="fw7 text-sm">${sanitize(p.name,20)}</div><div class="text-xs text-muted">${sanitize(p.position||p.pos||'--',15)} / ${p.age||'--'}歳</div></div></div>`).join('')}</div>`:''}
      ${unpaidPays.length?`<div class="card" style="padding:12px;border:1px solid rgba(239,68,68,.3)"><div class="fw7 text-sm" style="color:var(--red)">⚠️ 未払い ${unpaidPays.length}件</div>${unpaidPays.map(p=>{const pl=DB.players.find(x=>x.id===p.player);return`<div class="payment-method-row" style="margin-top:6px"><span class="text-sm">${sanitize(pl?.name||'--',15)}: ¥${(p.amount||0).toLocaleString()}</span><button class="btn btn-primary btn-xs" onclick="markPaid('${p.id}');closeM();openAdminTeamDetail('${teamId}')">確認</button></div>`;}).join('')}</div>`:''}
    </div>
  `);
}

function saveTeamFeeRates(teamId){
  if(!DB.teamFeeRates)DB.teamFeeRates={};
  const rates={};
  ['monthlyFee','coachFee','adhocFee','goodsFee'].forEach(k=>{
    const el=document.getElementById('tfr-'+k+'-'+teamId);
    if(el) rates[k]=Math.min(100,Math.max(0,parseInt(el.value)||10));
  });
  DB.teamFeeRates[teamId]=rates;
  saveDB();
  toast('手数料率を保存しました','s');
  closeM();
  setTimeout(()=>openAdminTeamDetail(teamId),200);
}

function resetTeamFeeRates(teamId){
  if(!DB.teamFeeRates)return;
  delete DB.teamFeeRates[teamId];
  saveDB();
  toast('デフォルトに戻しました','s');
  closeM();
  setTimeout(()=>openAdminTeamDetail(teamId),200);
}

