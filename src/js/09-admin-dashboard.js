// 09-admin-dashboard.js — Admin dashboard
function adminDash(){
  const adhocFeeTotal=(!DB.adhocInvoices?[]:DB.adhocInvoices).filter(i=>i.status==='paid').reduce((s,i)=>s+(i.fee||0),0);
  const tf=_dbArr('payments').filter(p=>p.status==='paid').reduce((s,p)=>s+(p.fee||getFeeAmount(p.amount,p.team||p.teamId||'','monthlyFee')),0)
    +_dbArr('coachPay').filter(p=>p.status==='paid').reduce((s,p)=>s+(p.platformTotal||getFeeAmount(p.amount,p.teamId||'','coachFee')),0)
    +adhocFeeTotal;
  const unp=_dbArr('payments').filter(p=>p.status==='unpaid').length;
  const pendCoaches=DB.coaches.filter(c=>!c.verified).length;
  const thisM=curMonth();
  const thisMonthFee=_dbArr('payments').filter(p=>p.status==='paid'&&(p.paidAt||'').slice(0,7)===thisM.replace('-','/')).reduce((s,p)=>s+(p.fee||getFeeAmount(p.amount,p.team||p.teamId||'','monthlyFee')),0);
  const totalUsers=(DB.coaches||[]).length+(DB.teams||[]).length+(DB.players||[]).length;
  const parentCount=_getUsers().filter(u=>u.role==='parent').length;
  const totalAllUsers=totalUsers+parentCount;
  const matchedCount=_dbArr('requests').filter(r=>r.status==='matched').length;
  const pendReqs=_dbArr('requests').filter(r=>r.status==='pending').length;
  const verifiedCoaches=DB.coaches.filter(c=>c.verified).length;
  const totalMonthlyRevenue=_dbArr('payments').filter(p=>p.status==='paid').reduce((s,p)=>s+(p.amount||0),0);
  const coachPayTotal=_dbArr('coachPay').filter(p=>p.status==='paid').reduce((s,p)=>s+(p.amount||0),0);
  const matchRate=_dbArr('requests').length?(matchedCount/_dbArr('requests').length*100).toFixed(0):0;
  const avgCoachPrice=(DB.coaches||[]).length?Math.round(DB.coaches.reduce((s,c)=>s+(c.price||0),0)/(DB.coaches||[]).length):0;
  const coachApprovalRate=(DB.coaches||[]).length?Math.round(verifiedCoaches/(DB.coaches||[]).length*100):0;
  const payCollectionRate=(DB.payments||[]).length?Math.round(_dbArr('payments').filter(p=>p.status==='paid').length/(DB.payments||[]).length*100):0;
  const coachPayRate=(DB.coachPay||[]).length?Math.round(_dbArr('coachPay').filter(p=>p.status==='paid').length/(DB.coachPay||[]).length*100):0;

  // 前月比較
  const prevM=(()=>{const d=new Date();d.setMonth(d.getMonth()-1);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');})();
  const prevMonthFee=_dbArr('payments').filter(p=>p.status==='paid'&&(p.paidAt||'').slice(0,7)===prevM.replace('-','/')).reduce((s,p)=>s+(p.fee||getFeeAmount(p.amount,p.team||p.teamId||'','monthlyFee')),0);
  const feeGrowth=prevMonthFee>0?Math.round((thisMonthFee-prevMonthFee)/prevMonthFee*100):0;

  // アラート
  const alerts=[];
  if(pendCoaches>=1) alerts.push({cls:'dash-alert-warn',icon:'fa-clock',msg:`${pendCoaches}件のコーチ承認が保留中`,btn:'確認する',action:`onclick="goTo('coaches')"`});
  if(unp>=2) alerts.push({cls:'dash-alert-error',icon:'fa-exclamation-circle',msg:`${unp}件の月謝が未払い`,btn:'確認する',action:`onclick="goTo('payments')"`});
  if(pendReqs>0) alerts.push({cls:'dash-alert-info',icon:'fa-handshake',msg:`${pendReqs}件のマッチング申請あり`,btn:'対応する',action:`onclick="goTo('coaches')"`});
  const noCoachTeams=DB.teams.filter(t=>!t.coach).length;
  if(noCoachTeams>0) alerts.push({cls:'dash-alert-info',icon:'fa-user-slash',msg:`${noCoachTeams}チームがコーチ未配置`,btn:'確認',action:`onclick="goTo('teams')"`});
  if(DB._emailNotVerified) alerts.push({cls:'dash-alert-warn',icon:'fa-envelope',msg:'メールアドレスが未確認です。受信箱の確認メールをクリックしてください。',btn:'再送信',action:`onclick="resendVerificationEmail()"`});

  // 直近アクティビティ（タイムライン形式）
  const activities=[];
  _dbArr('requests').forEach(r=>{activities.push({date:r.createdAt||'',icon:'🤝',text:(r.teamName||'?')+'→'+(r.coachName||'?'),type:r.status,cat:'match',color:'#a855f7'});});
  _dbArr('coachPay').filter(p=>p.status==='paid').forEach(p=>{activities.push({date:p.paidAt||'',icon:'💰',text:(p.coachName||'コーチ')+'へ ¥'+(p.amount||0).toLocaleString(),type:'paid',cat:'pay',color:'var(--teal)'});});
  _dbArr('payments').filter(p=>p.status==='paid').slice(-5).forEach(p=>{const pl=DB.players.find(x=>x.id===p.player);activities.push({date:p.paidAt||'',icon:'💴',text:(pl?.name||'選手')+'月謝 ¥'+(p.amount||0).toLocaleString(),type:'paid',cat:'fee',color:'var(--org)'});});
  DB.coaches.filter(c=>!c.verified).forEach(c=>{activities.push({date:c.createdAt||'',icon:'🏅',text:sanitize(c.name,10)+'（新規申請）',type:'pending',cat:'coach',color:'var(--yel)'});});
  activities.sort((a,b)=>(b.date||'')>(a.date||'')?1:-1);

  // タブ状態
  const tab=window._adminDashTab||'overview';

  // ── SVGリングヘルパー ──
  function svgRing(pct,color,size){
    size=size||64;const r=size/2-5;const circ=2*Math.PI*r;const off=circ*(1-Math.min(pct,100)/100);
    return`<div class="admin-stat-ring" style="width:${size}px;height:${size}px"><svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="var(--b1)" stroke-width="4"/><circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${off}" style="transition:stroke-dashoffset .8s ease"/></svg><div class="admin-stat-ring-val" style="color:${color}">${pct}%</div></div>`;
  }

  return`
  <!-- ヘッダー -->
  <div class="dash-greeting" style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 50%,#0f2847 100%)">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">
      <div>
        <div class="dash-greeting-sub" style="display:flex;align-items:center;gap:6px"><i class="fa fa-shield-alt" style="font-size:10px"></i> 管理コンソール v3.2</div>
        <div class="dash-greeting-name">MyCOACH-MyTEAM 事務局</div>
        <div class="dash-greeting-sub" style="margin-top:4px">${new Date().toLocaleDateString('ja-JP',{year:'numeric',month:'long',day:'numeric',weekday:'short'})} · <span style="color:rgba(0,207,170,.8)">全${totalAllUsers}名稼働中</span></div>
      </div>
      <div class="dash-greeting-actions" style="display:flex;gap:6px;flex-wrap:wrap">
        <button class="btn btn-sm" onclick="openAdminMsgMonitor()"><i class="fa fa-shield-alt" style="margin-right:4px"></i>監視</button>
        <button class="btn btn-sm" onclick="openAdminUserMgmt()"><i class="fa fa-users" style="margin-right:4px"></i>ユーザー</button>
        <div class="relative">
          <button class="btn btn-sm" onclick="toggleAdminExportMenu()" id="admin-export-btn"><i class="fa fa-download" style="margin-right:4px"></i>エクスポート ▾</button>
          <div class="admin-export-menu" id="admin-export-menu">
            <div class="admin-export-item" onclick="exportAdminReport();toggleAdminExportMenu()"><i class="fa fa-file-csv"></i> 全データCSV</div>
            <div class="admin-export-item" onclick="exportAdminCoachCSV();toggleAdminExportMenu()"><i class="fa fa-user-tie"></i> コーチ一覧CSV</div>
            <div class="admin-export-item" onclick="exportAdminTeamCSV();toggleAdminExportMenu()"><i class="fa fa-users"></i> チーム一覧CSV</div>
            <div class="admin-export-item" onclick="exportAdminPayCSV();toggleAdminExportMenu()"><i class="fa fa-yen-sign"></i> 支払いデータCSV</div>
            <div class="admin-export-item" onclick="exportAdminMatchCSV();toggleAdminExportMenu()"><i class="fa fa-handshake"></i> マッチング履歴CSV</div>
            <div class="admin-export-item" onclick="exportAdminSummaryPDF();toggleAdminExportMenu()"><i class="fa fa-file-pdf" style="color:var(--red)"></i> サマリーPDF</div>
            <div style="border-top:1px solid var(--b1);margin:4px 0"></div>
            <div class="admin-export-item" onclick="adminFullBackup();toggleAdminExportMenu()"><i class="fa fa-database" style="color:var(--teal)"></i> フルバックアップ</div>
          </div>
        </div>
        <button class="btn btn-primary btn-sm" onclick="openM('コーチ追加',coachAddForm())"><i class="fa fa-plus" style="margin-right:4px"></i>コーチ追加</button>
        <button class="btn btn-sm" style="background:rgba(16,185,129,.1);color:var(--grn);border:1px solid rgba(16,185,129,.2)" onclick="openAdminHealthCheck()"><i class="fa fa-heartbeat" style="margin-right:4px"></i>ヘルス</button>
      </div>
    </div>
  </div>

  <!-- アラート -->
  ${alerts.map(a=>`<div class="dash-alert ${a.cls}" ${a.action} style="cursor:pointer"><i class="fa ${a.icon}"></i><div style="flex:1"><span>${a.msg}</span></div><span style="font-size:11px;font-weight:700;opacity:.7">${a.btn} →</span></div>`).join('')}

  <!-- ダッシュボードタブ -->
  <div class="admin-dash-tabs">
    <button class="admin-dash-tab ${tab==='overview'?'active':''}" onclick="window._adminDashTab='overview';refreshPage()">📊 概要</button>
    <button class="admin-dash-tab ${tab==='coaches'?'active':''}" onclick="window._adminDashTab='coaches';refreshPage()">🏅 コーチ</button>
    <button class="admin-dash-tab ${tab==='teams'?'active':''}" onclick="window._adminDashTab='teams';refreshPage()">🏟️ チーム</button>
    <button class="admin-dash-tab ${tab==='finance'?'active':''}" onclick="window._adminDashTab='finance';refreshPage()">💴 収益</button>
    <button class="admin-dash-tab ${tab==='activity'?'active':''}" onclick="window._adminDashTab='activity';refreshPage()">📜 ログ</button>
    <button class="admin-dash-tab ${tab==='system'?'active':''}" onclick="window._adminDashTab='system';refreshPage();_fetchSystemData()">🖥️ システム</button>
  </div>

  ${tab==='overview'?`
  <!-- ===== 概要タブ ===== -->
  <!-- メインKPI -->
  <div class="hero-kpi" style="grid-template-columns:repeat(auto-fit,minmax(155px,1fr))">
    <div class="hero-kpi-card" style="border-left:3px solid var(--org)">
      <div class="kpi-label">💴 総手数料収入</div>
      <div class="kpi-value" style="color:var(--org)">¥${tf.toLocaleString()}</div>
      <div class="kpi-sub" style="color:${feeGrowth>=0?'var(--grn)':'var(--red)'}"><i class="fa fa-arrow-${feeGrowth>=0?'up':'down'}" style="font-size:10px"></i> 今月 ¥${thisMonthFee.toLocaleString()} (${feeGrowth>=0?'+':''}${feeGrowth}%)</div>
    </div>
    <div class="hero-kpi-card" style="border-left:3px solid var(--blue)">
      <div class="kpi-label">👥 登録ユーザー</div>
      <div class="kpi-value" style="color:var(--blue)">${totalAllUsers}</div>
      <div class="kpi-sub">コーチ${(DB.coaches||[]).length} チーム${(DB.teams||[]).length} 選手${(DB.players||[]).length} 保護者${parentCount}</div>
    </div>
    <div class="hero-kpi-card" style="border-left:3px solid var(--teal)">
      <div class="kpi-label">🤝 マッチング</div>
      <div class="kpi-value" style="color:var(--teal)">${matchedCount}<span style="font-size:14px">件</span></div>
      <div class="kpi-sub" style="color:var(--teal)">成立率 ${matchRate}% · ${pendReqs}件保留</div>
    </div>
    <div class="hero-kpi-card" style="border-left:3px solid ${unp?'var(--red)':'var(--grn)'}">
      <div class="kpi-label">${unp?'⚠️':'✅'} 未払い月謝</div>
      <div class="kpi-value" style="color:${unp?'var(--red)':'var(--grn)'}">${unp}件</div>
      <div class="kpi-sub">総月謝 ¥${totalMonthlyRevenue.toLocaleString()}</div>
    </div>
    <div class="hero-kpi-card" style="border-left:3px solid #a855f7">
      <div class="kpi-label">🏅 コーチ承認</div>
      <div class="kpi-value" style="color:#a855f7">${verifiedCoaches}/${(DB.coaches||[]).length}</div>
      <div class="kpi-sub" style="color:${pendCoaches?'var(--yel)':'var(--grn)'}">${pendCoaches?pendCoaches+'件 審査待ち':'全員承認済'}</div>
    </div>
    <div class="hero-kpi-card" style="border-left:3px solid #f59e0b">
      <div class="kpi-label">💰 コーチ平均料金</div>
      <div class="kpi-value" style="color:#f59e0b">¥${avgCoachPrice?Math.round(avgCoachPrice/10000)+'万':'--'}</div>
      <div class="kpi-sub">報酬総額 ¥${coachPayTotal.toLocaleString()}</div>
    </div>
  </div>

  <!-- チャート + 健全性 -->
  <div class="dash-grid dash-grid-2" style="margin-bottom:16px">
    <div class="dash-section" style="margin-bottom:0">
      <div class="dash-section-head"><span class="dash-section-title">📊 手数料収入推移</span></div>
      <div style="height:200px"><canvas id="admin-fee-chart"></canvas></div>
    </div>
    <div class="dash-section" style="margin-bottom:0">
      <div class="dash-section-head"><span class="dash-section-title">🩺 プラットフォーム健全性</span></div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px;padding:8px 0">
        <div style="display:flex;align-items:center;gap:12px">${svgRing(coachApprovalRate,'var(--teal)')}<div><div style="font-size:11px;font-weight:700">コーチ承認率</div><div style="font-size:10px;color:var(--txt3)">${verifiedCoaches}/${(DB.coaches||[]).length}名</div></div></div>
        <div style="display:flex;align-items:center;gap:12px">${svgRing(parseInt(matchRate)||0,'var(--blue)')}<div><div style="font-size:11px;font-weight:700">マッチング成立率</div><div style="font-size:10px;color:var(--txt3)">${matchedCount}件成立</div></div></div>
        <div style="display:flex;align-items:center;gap:12px">${svgRing(payCollectionRate,'var(--org)')}<div><div style="font-size:11px;font-weight:700">月謝回収率</div><div style="font-size:10px;color:var(--txt3)">${unp}件未回収</div></div></div>
        <div style="display:flex;align-items:center;gap:12px">${svgRing(coachPayRate,'#a855f7')}<div><div style="font-size:11px;font-weight:700">報酬支払率</div><div style="font-size:10px;color:var(--txt3)">¥${coachPayTotal.toLocaleString()}</div></div></div>
      </div>
    </div>
  </div>

  <!-- ユーザー内訳 + クイックアクション -->
  <div class="dash-grid dash-grid-2" style="margin-bottom:16px">
    <div class="dash-section" style="margin-bottom:0">
      <div class="dash-section-head"><span class="dash-section-title">👥 ユーザー内訳</span></div>
      <div style="height:200px"><canvas id="admin-users-chart"></canvas></div>
    </div>
    <div class="dash-section" style="margin-bottom:0">
      <div class="dash-section-head"><span class="dash-section-title">⚡ クイックアクション</span></div>
      <div class="admin-quick-grid">
        ${[
          {icon:'🏅',label:'コーチ承認',sub:pendCoaches+'件待ち',action:"goTo('coaches')",bg:'rgba(249,115,22,.08)'},
          {icon:'💴',label:'収益管理',sub:'月謝・支払確認',action:"goTo('payments')",bg:'rgba(37,99,235,.08)'},
          {icon:'📢',label:'全体連絡',sub:'通知配信',action:"document.getElementById('broadcast-msg')?.focus()",bg:'rgba(0,207,170,.08)'},
          {icon:'🤝',label:'マッチング',sub:pendReqs+'件保留',action:"goTo('threads')",bg:'rgba(168,85,247,.08)'},
          {icon:'👦',label:'選手管理',sub:(DB.players||[]).length+'名',action:"goTo('admin-players')",bg:'rgba(236,72,153,.08)'},
          {icon:'⚙️',label:'設定',sub:'手数料率・規約',action:"goTo('settings')",bg:'rgba(100,116,139,.08)'},
        ].map(q=>`<div class="admin-quick-btn" onclick="${q.action}">
          <div class="q-icon" style="background:${q.bg}">${q.icon}</div>
          <div class="q-label">${q.label}</div>
          <div class="q-sub">${q.sub}</div>
        </div>`).join('')}
      </div>
    </div>
  </div>

  <!-- マッチング + アクティビティタイムライン -->
  <div class="dash-grid dash-grid-2" style="margin-bottom:16px">
    <div class="dash-section" style="margin-bottom:0">
      <div class="dash-section-head">
        <span class="dash-section-title">🤝 マッチング状況</span>
        <span class="badge b-blue">${pendReqs}件保留</span>
      </div>
      ${(()=>{
        const reqs=[...DB.requests].sort((a,b)=>b.createdAt>a.createdAt?1:-1).slice(0,5);
        if(!reqs.length) return '<div class="text-muted text-sm text-center" style="padding:24px">申請なし</div>';
        return reqs.map(r=>{
          const stBadge=r.status==='pending'?'<span class="badge b-yel">保留</span>':r.status==='matched'?'<span class="badge b-green">成立</span>':'<span class="badge b-org">却下</span>';
          return`<div class="dash-list-item">
            <div style="flex:1;min-width:0"><div class="fw7 text-sm">${sanitize(r.coachName||'--',14)} × ${sanitize(r.teamName||'--',14)}</div><div class="text-xs text-muted">${r.type==='team_to_coach'?'チーム→コーチ':'コーチ→チーム'}</div></div>
            ${stBadge}
            ${r.status==='pending'?`<div class="flex gap-4"><button class="btn btn-primary btn-xs" onclick="adminAcceptMatch('${r.id}')">承認</button><button class="btn btn-ghost btn-xs" onclick="rejectRequest('${r.id}')">却下</button></div>`:''}
          </div>`;
        }).join('');
      })()}
    </div>
    <div class="dash-section" style="margin-bottom:0">
      <div class="dash-section-head"><span class="dash-section-title">📜 最新アクティビティ</span></div>
      <div class="admin-timeline">
      ${activities.length?activities.slice(0,8).map(a=>`<div class="admin-timeline-item">
        <div class="admin-timeline-dot" style="background:${a.color}"></div>
        <div style="flex:1;min-width:0">
          <div style="font-size:11px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${a.icon} ${sanitize(a.text,40)}</div>
          <div style="font-size:9px;color:var(--txt3)">${a.date?(a.date).slice(0,10):''}</div>
        </div>
        <span class="badge ${a.type==='pending'?'b-yel':a.type==='matched'?'b-green':'b-blue'}" style="font-size:9px;flex-shrink:0">${a.type==='pending'?'保留':a.type==='matched'?'成立':'完了'}</span>
      </div>`).join(''):'<div class="text-muted text-sm text-center" style="padding:24px">アクティビティなし</div>'}
      </div>
    </div>
  </div>

  <!-- 全体連絡 -->
  <div class="dash-section">
    <div class="dash-section-head">
      <span class="dash-section-title">📢 全体連絡を送信</span>
      <span class="text-xs text-muted">全ユーザーに通知</span>
    </div>
    <div style="display:flex;gap:10px">
      <input id="broadcast-msg" class="input" placeholder="全体連絡メッセージを入力…" style="flex:1">
      <button class="btn btn-primary btn-sm" onclick="sendBroadcastMsg()">📢 送信</button>
    </div>
  </div>
  `:''}

  ${tab==='coaches'?`
  <!-- ===== コーチタブ ===== -->
  <div class="dash-section">
    <div class="dash-section-head">
      <span class="dash-section-title">🏅 コーチ一覧 (${(DB.coaches||[]).length}名)</span>
      <div class="flex gap-6">
        <button class="btn btn-ghost btn-xs" onclick="exportAdminCoachCSV()"><i class="fa fa-download" style="margin-right:3px"></i>CSV</button>
        <button class="btn btn-primary btn-xs" onclick="openM('コーチ追加',coachAddForm())">+ 追加</button>
      </div>
    </div>
    <div style="margin-bottom:12px"><input class="input" placeholder="🔍 名前・種目・エリアで検索…" oninput="adminFilterCoachTable(this.value)" style="font-size:12px;height:36px"></div>
    <div style="overflow-x:auto;max-height:480px;overflow-y:auto">
    <table class="admin-data-table" id="admin-coach-table">
      <thead><tr><th>コーチ名</th><th>種目</th><th>エリア</th><th>指導歴</th><th>料金</th><th>評価</th><th>ステータス</th><th style="text-align:center">操作</th></tr></thead>
      <tbody>
      ${(DB.coaches||[]).map(c=>{
        const teamCount=DB.teams.filter(t=>t.coach===c.id).length;
        return`<tr class="admin-coach-row" data-search="${(c.name||'').toLowerCase()} ${(c.sport||'').toLowerCase()} ${(c.area||'').toLowerCase()}">
          <td><div style="display:flex;align-items:center;gap:8px"><div class="avi" style="background:${c.color||'var(--org)'};${c.photo?'background-image:url('+c.photo+');background-size:cover;background-position:center':''};width:32px;height:32px;font-size:12px;flex-shrink:0">${c.photo?'':(c.name||'?')[0]}</div><div><div class="fw7">${sanitize(c.name||'',20)}</div><div class="text-xs text-muted">${teamCount}チーム担当</div></div></div></td>
          <td><span class="badge b-org" style="font-size:10px">${sanitize(c.sport||'--',12)}</span></td>
          <td style="font-size:11px">${sanitize(c.area||'--',15)}</td>
          <td style="font-weight:700">${c.exp||'--'}年</td>
          <td><div class="fw7" style="color:var(--org)">¥${(c.price||0).toLocaleString()}</div><div class="text-xs text-muted">都度: ¥${(c.priceOnetime||0).toLocaleString()}</div></td>
          <td style="color:#f59e0b;font-weight:700">${'★'.repeat(Math.round(c.rating||0))} ${c.rating||'--'}</td>
          <td>${c.verified?'<span class="badge b-green">承認済</span>':'<span class="badge b-yel">審査中</span>'} ${c.avail?'<span class="badge b-blue" style="font-size:9px">募集中</span>':''}</td>
          <td style="text-align:center"><div class="flex gap-4 justify-center">
            <button class="btn btn-ghost btn-xs" onclick="openCoachDetail('${c.id}')" title="詳細">📋</button>
            <button class="btn btn-ghost btn-xs" onclick="adminEditCoach('${c.id}')" title="編集">✏️</button>
            ${!c.verified?`<button class="btn btn-primary btn-xs" onclick="approveCoach('${c.id}')">承認</button>`:''}
          </div></td>
        </tr>`;
      }).join('')}
      </tbody>
    </table></div>
    ${!(DB.coaches||[]).length?'<div class="text-muted text-sm text-center" style="padding:32px">コーチ未登録</div>':''}
    <!-- コーチ集計 -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin-top:16px;padding-top:16px;border-top:1px solid var(--b1)">
      <div style="text-align:center"><div style="font-size:20px;font-weight:800;color:var(--org)">${(DB.coaches||[]).length}</div><div style="font-size:10px;color:var(--txt3)">総コーチ数</div></div>
      <div style="text-align:center"><div style="font-size:20px;font-weight:800;color:var(--grn)">${verifiedCoaches}</div><div style="font-size:10px;color:var(--txt3)">承認済</div></div>
      <div style="text-align:center"><div style="font-size:20px;font-weight:800;color:var(--yel)">${pendCoaches}</div><div style="font-size:10px;color:var(--txt3)">審査中</div></div>
      <div style="text-align:center"><div style="font-size:20px;font-weight:800;color:var(--blue)">¥${avgCoachPrice?Math.round(avgCoachPrice/1000)+'K':'--'}</div><div style="font-size:10px;color:var(--txt3)">平均月額</div></div>
    </div>
  </div>
  `:''}

  ${tab==='teams'?`
  <!-- ===== チームタブ ===== -->
  <div class="dash-section">
    <div class="dash-section-head">
      <span class="dash-section-title">🏟️ チーム一覧 (${(DB.teams||[]).length}チーム)</span>
      <div class="flex gap-6">
        <button class="btn btn-ghost btn-xs" onclick="exportAdminTeamCSV()"><i class="fa fa-download" style="margin-right:3px"></i>CSV</button>
      </div>
    </div>
    <div style="margin-bottom:12px"><input class="input" placeholder="🔍 チーム名・種目で検索…" oninput="adminFilterTeamTable(this.value)" style="font-size:12px;height:36px"></div>
    <div style="overflow-x:auto;max-height:480px;overflow-y:auto">
    <table class="admin-data-table" id="admin-team-table">
      <thead><tr><th>チーム名</th><th>種目</th><th>エリア</th><th>選手数</th><th>コーチ</th><th>月謝</th><th>回収状況</th></tr></thead>
      <tbody>
      ${(DB.teams||[]).map(t=>{
        const playerCount=DB.players.filter(p=>p.team===t.id).length;
        const coach=DB.coaches.find(c=>c.id===t.coach);
        const teamPay=_dbArr('payments').filter(p=>(p.team===t.id||p.teamId===t.id));
        const teamPaid=teamPay.filter(p=>p.status==='paid').length;
        const teamTotal=teamPay.length;
        const collectRate=teamTotal?Math.round(teamPaid/teamTotal*100):0;
        return`<tr class="admin-team-row" data-search="${(t.name||'').toLowerCase()} ${(t.sport||'').toLowerCase()}">
          <td><div style="display:flex;align-items:center;gap:8px"><div class="avi" style="background:var(--blue);width:32px;height:32px;font-size:12px">${(t.name||'?')[0]}</div><div><div class="fw7">${sanitize(t.name||'',20)}</div><div class="text-xs text-muted">${t.id}</div></div></div></td>
          <td><span class="badge b-blue" style="font-size:10px">${sanitize(t.sport||'--',12)}</span></td>
          <td style="font-size:11px">${sanitize(t.area||'--',15)}</td>
          <td style="font-weight:700;text-align:center">${playerCount}名</td>
          <td>${coach?'<span class="badge b-green" style="font-size:10px">'+sanitize(coach.name,10)+'</span>':'<span class="badge b-yel" style="font-size:10px">未配置</span>'}</td>
          <td style="font-weight:700">¥${(t.fee||0).toLocaleString()}</td>
          <td><div style="display:flex;align-items:center;gap:6px"><div class="admin-progress" style="width:60px"><div class="admin-progress-bar" style="width:${collectRate}%;background:${collectRate>=80?'var(--grn)':collectRate>=50?'var(--yel)':'var(--red)'}"></div></div><span style="font-size:11px;font-weight:700">${collectRate}%</span></div></td>
        </tr>`;
      }).join('')}
      </tbody>
    </table></div>
    ${!(DB.teams||[]).length?'<div class="text-muted text-sm text-center" style="padding:32px">チーム未登録</div>':''}
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin-top:16px;padding-top:16px;border-top:1px solid var(--b1)">
      <div style="text-align:center"><div style="font-size:20px;font-weight:800;color:var(--blue)">${(DB.teams||[]).length}</div><div style="font-size:10px;color:var(--txt3)">総チーム数</div></div>
      <div style="text-align:center"><div style="font-size:20px;font-weight:800;color:var(--teal)">${(DB.players||[]).length}</div><div style="font-size:10px;color:var(--txt3)">総選手数</div></div>
      <div style="text-align:center"><div style="font-size:20px;font-weight:800;color:${noCoachTeams?'var(--red)':'var(--grn)'}">${noCoachTeams}</div><div style="font-size:10px;color:var(--txt3)">コーチ未配置</div></div>
      <div style="text-align:center"><div style="font-size:20px;font-weight:800;color:var(--org)">${(DB.players||[]).length&&(DB.teams||[]).length?Math.round((DB.players||[]).length/(DB.teams||[]).length):0}</div><div style="font-size:10px;color:var(--txt3)">平均選手数</div></div>
    </div>
  </div>
  `:''}

  ${tab==='finance'?`
  <!-- ===== 収益タブ ===== -->
  <div class="hero-kpi" style="grid-template-columns:repeat(auto-fit,minmax(155px,1fr))">
    <div class="hero-kpi-card" style="border-left:3px solid var(--org)">
      <div class="kpi-label">💴 総手数料収入</div>
      <div class="kpi-value" style="color:var(--org)">¥${tf.toLocaleString()}</div>
      <div class="kpi-sub" style="color:${feeGrowth>=0?'var(--grn)':'var(--red)'}"><i class="fa fa-arrow-${feeGrowth>=0?'up':'down'}" style="font-size:10px"></i> 前月比 ${feeGrowth>=0?'+':''}${feeGrowth}%</div>
    </div>
    <div class="hero-kpi-card" style="border-left:3px solid var(--blue)">
      <div class="kpi-label">📥 月謝収入（総額）</div>
      <div class="kpi-value" style="color:var(--blue)">¥${totalMonthlyRevenue.toLocaleString()}</div>
      <div class="kpi-sub">回収率 ${payCollectionRate}%</div>
    </div>
    <div class="hero-kpi-card" style="border-left:3px solid var(--teal)">
      <div class="kpi-label">💸 コーチ報酬総額</div>
      <div class="kpi-value" style="color:var(--teal)">¥${coachPayTotal.toLocaleString()}</div>
      <div class="kpi-sub">支払率 ${coachPayRate}%</div>
    </div>
    <div class="hero-kpi-card" style="border-left:3px solid ${unp?'var(--red)':'var(--grn)'}">
      <div class="kpi-label">⚠️ 未回収</div>
      <div class="kpi-value" style="color:${unp?'var(--red)':'var(--grn)'}">${unp}件</div>
      <div class="kpi-sub">¥${_dbArr('payments').filter(p=>p.status==='unpaid').reduce((s,p)=>s+(p.amount||0),0).toLocaleString()} 未回収</div>
    </div>
  </div>
  <div class="dash-section">
    <div class="dash-section-head"><span class="dash-section-title">📊 手数料収入推移（6ヶ月）</span></div>
    <div style="height:260px"><canvas id="admin-fee-chart"></canvas></div>
  </div>
  <div class="dash-grid dash-grid-2" style="margin-bottom:16px">
    <div class="dash-section" style="margin-bottom:0">
      <div class="dash-section-head">
        <span class="dash-section-title">💴 未払い月謝</span>
        <button class="btn btn-ghost btn-xs" onclick="goTo('payments')">全件 →</button>
      </div>
      ${_dbArr('payments').filter(p=>p.status==='unpaid').slice(0,8).map(p=>{
        const pl=DB.players.find(x=>x.id===p.player);
        const tm=DB.teams.find(x=>x.id===p.team);
        return`<div class="dash-list-item">
          <div style="flex:1;min-width:0"><div class="fw7 text-sm">${sanitize(pl?.name||'--',20)}</div><div class="text-xs text-muted">${sanitize(tm?.name||'--',16)} / ¥${(p.amount||0).toLocaleString()}</div></div>
          <button class="btn btn-secondary btn-xs" onclick="markPaid('${p.id}')">入金確認</button>
        </div>`;
      }).join('') || '<div class="text-muted text-sm text-center" style="padding:24px">未払いなし ✅</div>'}
    </div>
    <div class="dash-section" style="margin-bottom:0">
      <div class="dash-section-head"><span class="dash-section-title">💰 コーチ報酬履歴</span></div>
      ${_dbArr('coachPay').slice(-8).reverse().map(p=>{
        return`<div class="dash-list-item">
          <div style="flex:1;min-width:0"><div class="fw7 text-sm">${sanitize(p.coachName||'コーチ',16)}</div><div class="text-xs text-muted">¥${(p.amount||0).toLocaleString()} · ${(p.paidAt||'').slice(0,10)}</div></div>
          <span class="badge ${p.status==='paid'?'b-green':'b-yel'}" style="font-size:9px">${p.status==='paid'?'支払済':'未払い'}</span>
        </div>`;
      }).join('') || '<div class="text-muted text-sm text-center" style="padding:24px">支払い履歴なし</div>'}
    </div>
  </div>
  <div class="flex gap-8 justify-center" style="padding:8px 0">
    <button class="btn btn-ghost btn-sm" onclick="exportAdminPayCSV()"><i class="fa fa-download" style="margin-right:4px"></i>支払いCSV</button>
    <button class="btn btn-ghost btn-sm" onclick="exportAdminSummaryPDF()"><i class="fa fa-file-pdf" style="margin-right:4px;color:var(--red)"></i>収益レポートPDF</button>
  </div>
  `:''}

  ${tab==='activity'?`
  <!-- ===== アクティビティログタブ ===== -->
  <div class="dash-section">
    <div class="dash-section-head">
      <span class="dash-section-title">📜 操作・イベントログ</span>
      <span class="text-xs text-muted">${activities.length}件のイベント</span>
    </div>
    <div style="display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap">
      <button class="btn btn-xs ${!window._adminLogFilter?'btn-primary':'btn-ghost'}" onclick="window._adminLogFilter='';refreshPage()">全て</button>
      <button class="btn btn-xs ${window._adminLogFilter==='match'?'btn-primary':'btn-ghost'}" onclick="window._adminLogFilter='match';refreshPage()">🤝 マッチング</button>
      <button class="btn btn-xs ${window._adminLogFilter==='fee'?'btn-primary':'btn-ghost'}" onclick="window._adminLogFilter='fee';refreshPage()">💴 月謝</button>
      <button class="btn btn-xs ${window._adminLogFilter==='pay'?'btn-primary':'btn-ghost'}" onclick="window._adminLogFilter='pay';refreshPage()">💰 報酬</button>
      <button class="btn btn-xs ${window._adminLogFilter==='coach'?'btn-primary':'btn-ghost'}" onclick="window._adminLogFilter='coach';refreshPage()">🏅 コーチ</button>
    </div>
    <div class="admin-timeline" style="max-height:500px;overflow-y:auto">
    ${(()=>{
      const filtered=window._adminLogFilter?activities.filter(a=>a.cat===window._adminLogFilter):activities;
      if(!filtered.length) return '<div class="text-muted text-sm text-center" style="padding:32px">該当するログがありません</div>';
      return filtered.slice(0,30).map(a=>`<div class="admin-timeline-item">
        <div class="admin-timeline-dot" style="background:${a.color}"></div>
        <div style="flex:1;min-width:0">
          <div style="font-size:12px;font-weight:600">${a.icon} ${sanitize(a.text,50)}</div>
          <div style="font-size:10px;color:var(--txt3);margin-top:2px">${a.date?(a.date).slice(0,16).replace('T',' '):''} · ${a.cat==='match'?'マッチング':a.cat==='fee'?'月謝':a.cat==='pay'?'報酬':'コーチ'}</div>
        </div>
        <span class="badge ${a.type==='pending'?'b-yel':a.type==='matched'?'b-green':'b-blue'}" style="font-size:9px;flex-shrink:0">${a.type==='pending'?'保留':a.type==='matched'?'成立':'完了'}</span>
      </div>`).join('');
    })()}
    </div>
  </div>
  <!-- モデレーション履歴 -->
  <div class="dash-section">
    <div class="dash-section-head"><span class="dash-section-title">🛡️ モデレーション履歴</span></div>
    ${(()=>{
      const modLog=DB.moderationLog||[];
      if(!modLog.length) return '<div class="text-muted text-sm text-center" style="padding:20px">モデレーション記録なし</div>';
      return modLog.slice(-15).reverse().map(l=>{
        const icon=l.type==='delete'?'🗑️':l.type==='warn'?'⚠️':l.type==='suspend'?'🚫':'🧹';
        const label=l.type==='delete'?'削除':l.type==='warn'?'忠告':l.type==='suspend'?'停止':'全削除';
        const color=l.type==='delete'?'var(--red)':l.type==='warn'?'var(--yel)':l.type==='suspend'?'var(--red)':'var(--txt3)';
        return`<div class="dash-list-item">
          <span style="font-size:16px">${icon}</span>
          <div style="flex:1;min-width:0"><div class="fw7 text-sm" style="color:${color}">${label}</div><div class="text-xs text-muted">${sanitize(l.userName||'',15)} ${l.originalText?'「'+sanitize(l.originalText,25)+'…」':''}</div></div>
          <span style="font-size:10px;color:var(--txt3)">${(l.date||'').slice(0,10)}</span>
        </div>`;
      }).join('');
    })()}
  </div>
  <!-- 監査ログ -->
  <div class="dash-section">
    <div class="dash-section-head">
      <span class="dash-section-title">📋 監査ログ (Audit Trail)</span>
      <div class="flex gap-4">
        <span class="text-xs text-muted">${(DB.auditLog||[]).length}件</span>
        <button class="btn btn-ghost btn-xs" onclick="exportAuditLogCSV()"><i class="fa fa-download" style="margin-right:3px"></i>CSV</button>
      </div>
    </div>
    <div style="display:flex;gap:4px;margin-bottom:10px;flex-wrap:wrap">
      ${['','login','logout','user_register','coach_approve','payment_confirm','gdpr_delete','error','data_export'].map(f=>{
        const labels={'':'全て',login:'ログイン',logout:'ログアウト',user_register:'登録',coach_approve:'承認',payment_confirm:'入金',gdpr_delete:'削除',error:'エラー',data_export:'エクスポート'};
        return`<button class="btn btn-xs ${(window._auditFilter||'')===f?'btn-primary':'btn-ghost'}" onclick="window._auditFilter='${f}';refreshPage()">${labels[f]}</button>`;
      }).join('')}
    </div>
    <div style="max-height:400px;overflow-y:auto">
    ${(()=>{
      const logs=(DB.auditLog||[]).slice(-100).reverse();
      const filtered=window._auditFilter?logs.filter(l=>l.action===window._auditFilter):logs;
      if(!filtered.length) return '<div class="text-muted text-sm text-center" style="padding:20px">監査ログなし</div>';
      const actionIcons={login:'🔓',logout:'🔒',user_register:'👤',coach_approve:'✅',payment_confirm:'💰',gdpr_delete:'🗑️',error:'❌',data_export:'📤',settings_change:'⚙️'};
      const actionColors={login:'var(--blue)',logout:'var(--txt3)',user_register:'var(--teal)',coach_approve:'var(--grn)',payment_confirm:'var(--org)',gdpr_delete:'var(--red)',error:'var(--red)',data_export:'var(--blue)',settings_change:'var(--yel)'};
      return filtered.slice(0,40).map(l=>`<div class="dash-list-item" style="padding:8px 0">
        <span style="font-size:14px">${actionIcons[l.action]||'📋'}</span>
        <div style="flex:1;min-width:0">
          <div style="font-size:11px;font-weight:600">${sanitize(l.detail||l.action,50)}</div>
          <div style="font-size:9px;color:var(--txt3)">${l.user?sanitize(l.user.name||'',12)+' ('+l.user.role+')':'system'} · ${(l.timestamp||'').slice(0,16).replace('T',' ')}</div>
        </div>
        <span class="badge" style="background:${actionColors[l.action]||'var(--txt3)'}18;color:${actionColors[l.action]||'var(--txt3)'};font-size:9px">${l.action||'--'}</span>
      </div>`).join('');
    })()}
    </div>
  </div>
  `:''}
  ${tab==='system'? adminSystemTab() :''}
  `;
}

// ── システム監視タブ（バックエンドAPI接続）──
function adminSystemTab(){
  const sd = window._sysData || {};
  const h = sd.health || {};
  const st = sd.stats || {};
  const srv = h.services || {};
  const aiP = st.ai?.providers || h.stats?.aiProviderStats || {};
  const logs = (sd.logs?.logs || []).slice(-50).reverse();
  const eps = (sd.endpoints?.endpoints || []).slice(0, 10);
  const blocked = sd.blocked?.blocked || [];
  const loading = !sd._loaded;
  const sysTab = window._sysSubTab || 'overview';

  function svcBadge(name, on, emoji){
    const c = on ? 'var(--grn)' : 'var(--red)';
    const bg = on ? 'rgba(22,163,74,.08)' : 'rgba(220,38,38,.08)';
    const bdr = on ? 'rgba(22,163,74,.15)' : 'rgba(220,38,38,.15)';
    return '<div style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:8px;background:'+bg+';border:1px solid '+bdr+'"><span>'+emoji+'</span><span style="font-size:12px;font-weight:600;color:'+c+'">'+name+'</span><span class="badge" style="background:'+bg+';color:'+c+';border:1px solid '+bdr+';font-size:9px">'+(on?'ON':'OFF')+'</span></div>';
  }

  if(loading) return '<div class="card text-center" style="padding:40px"><div style="font-size:36px;margin-bottom:12px">\u23F3</div><div class="fw7">バックエンドに接続中...</div><div class="text-xs text-muted mt-8">初回読み込みに数秒かかります</div></div>';

  if(sd._error) return '<div class="card text-center" style="padding:40px"><div style="font-size:36px;margin-bottom:12px">\u26A0\uFE0F</div><div class="fw7" style="color:var(--red)">接続エラー</div><div class="text-xs text-muted mt-8">'+sanitize(sd._error,100)+'</div><button class="btn btn-primary btn-sm mt-16" onclick="_fetchSystemData()">\uD83D\uDD04 再試行</button></div>';

  let out = '';

  // サブタブ
  out += '<div style="display:flex;gap:4px;margin-bottom:14px;flex-wrap:wrap">';
  ['overview','ai','logs','security'].forEach(function(t){
    const labels = {overview:'📊 概要',ai:'🤖 AI分析',logs:'📋 リクエストログ',security:'🛡️ セキュリティ'};
    out += '<button class="btn btn-xs '+(sysTab===t?'btn-primary':'btn-ghost')+'" onclick="window._sysSubTab=\''+t+'\';refreshPage()">'+labels[t]+'</button>';
  });
  out += '<button class="btn btn-xs btn-ghost" onclick="_fetchSystemData()" style="margin-left:auto">🔄 更新</button>';
  out += '</div>';

  if(sysTab==='overview'){
    out += '<div class="dash-section"><div class="dash-section-head"><span class="dash-section-title">🖥️ サービス状態</span><span class="badge b-blue">'+(h.version||'?')+'</span></div>';
    out += '<div style="display:flex;gap:8px;flex-wrap:wrap">';
    out += svcBadge('Gemini',srv.gemini,'🧠')+svcBadge('Groq',srv.groq,'⚡')+svcBadge('OpenRouter',srv.openrouter,'🌐');
    out += svcBadge('Stripe',srv.stripe,'💳')+svcBadge('Firestore',srv.firestore,'🗄️')+svcBadge('SendGrid',srv.sendgrid,'📧');
    out += '</div></div>';

    var errRate = st.totalRequests ? ((st.errors||0)/st.totalRequests*100).toFixed(1) : '0';
    var aiRate = st.ai?.total ? ((st.ai.success||0)/st.ai.total*100).toFixed(0) : '--';
    out += '<div class="hero-kpi" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">';
    out += '<div class="hero-kpi-card" style="border-left:3px solid var(--org)"><div class="kpi-label">📡 総リクエスト</div><div class="kpi-value" style="color:var(--org)">'+(st.totalRequests||0).toLocaleString()+'</div><div class="kpi-sub">uptime '+(h.uptimeFormatted||'--')+'</div></div>';
    out += '<div class="hero-kpi-card" style="border-left:3px solid '+(parseFloat(errRate)>10?'var(--red)':'var(--grn)')+'"><div class="kpi-label">⚠️ エラー率</div><div class="kpi-value" style="color:'+(parseFloat(errRate)>10?'var(--red)':'var(--grn)')+'">'+errRate+'%</div><div class="kpi-sub">'+(st.errors||0)+' errors</div></div>';
    out += '<div class="hero-kpi-card" style="border-left:3px solid #a855f7"><div class="kpi-label">🤖 AI成功率</div><div class="kpi-value" style="color:#a855f7">'+aiRate+'%</div><div class="kpi-sub">'+(st.ai?.success||0)+'/'+(st.ai?.total||0)+' requests</div></div>';
    out += '<div class="hero-kpi-card" style="border-left:3px solid var(--blue)"><div class="kpi-label">💾 メモリ</div><div class="kpi-value" style="color:var(--blue)">'+(h.memory?.heapUsed||'--')+'</div><div class="kpi-sub">/ '+(h.memory?.heapTotal||'--')+'</div></div>';
    out += '</div>';

    if(eps.length){
      out += '<div class="dash-section"><div class="dash-section-head"><span class="dash-section-title">🏆 エンドポイント ランキング</span></div>';
      var maxCount = Math.max(...eps.map(function(e){return e.count;}));
      eps.forEach(function(e){
        var pct = maxCount ? Math.round(e.count/maxCount*100) : 0;
        out += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">';
        out += '<div style="width:160px;font-size:11px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-family:monospace">'+sanitize(e.path,30)+'</div>';
        out += '<div style="flex:1;height:8px;background:var(--b1);border-radius:4px;overflow:hidden"><div style="height:100%;width:'+pct+'%;background:linear-gradient(90deg,var(--org),var(--org2));border-radius:4px"></div></div>';
        out += '<div style="font-size:11px;font-weight:700;color:var(--org);min-width:40px;text-align:right">'+e.count+'</div>';
        out += '</div>';
      });
      out += '</div>';
    }
  }

  if(sysTab==='ai'){
    out += '<div class="hero-kpi" style="grid-template-columns:repeat(3,1fr)">';
    out += '<div class="hero-kpi-card" style="border-left:3px solid #a855f7"><div class="kpi-label">📊 AI総数</div><div class="kpi-value" style="color:#a855f7">'+(st.ai?.total||0)+'</div></div>';
    out += '<div class="hero-kpi-card" style="border-left:3px solid var(--grn)"><div class="kpi-label">✅ 成功</div><div class="kpi-value" style="color:var(--grn)">'+(st.ai?.success||0)+'</div></div>';
    out += '<div class="hero-kpi-card" style="border-left:3px solid var(--red)"><div class="kpi-label">❌ 失敗</div><div class="kpi-value" style="color:var(--red)">'+(st.ai?.failed||0)+'</div></div>';
    out += '</div>';

    out += '<div class="dash-section"><div class="dash-section-head"><span class="dash-section-title">⚡ プロバイダー別使用状況</span></div>';
    out += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">';
    [{k:'gemini',l:'Gemini',e:'🧠',c:'var(--blue)',m:'gemini-2.0-flash'},{k:'groq',l:'Groq',e:'⚡',c:'var(--grn)',m:'llama-3.3-70b'},{k:'openrouter',l:'OpenRouter',e:'🌐',c:'var(--org)',m:'llama-3.1-8b:free'}].forEach(function(p){
      var active = srv[p.k];
      out += '<div style="padding:16px;border-radius:14px;background:'+(active?'rgba(37,99,235,.04)':'rgba(220,38,38,.04)')+';border:1px solid '+(active?'var(--b2)':'rgba(220,38,38,.12)')+';text-align:center">';
      out += '<div style="font-size:28px;margin-bottom:4px">'+p.e+'</div>';
      out += '<div style="font-size:14px;font-weight:700;color:'+p.c+'">'+p.l+'</div>';
      out += '<div style="font-size:28px;font-weight:800;margin:6px 0;font-family:Montserrat,sans-serif">'+(aiP[p.k]||0)+'</div>';
      out += '<div style="font-size:10px;color:var(--txt3)">'+p.m+'</div>';
      out += '<div style="margin-top:6px"><span class="badge '+(active?'b-green':'b-org')+'" style="font-size:9px">'+(active?'Active':'Off')+'</span></div>';
      out += '</div>';
    });
    out += '</div></div>';

    out += '<div class="dash-section"><div class="dash-section-head"><span class="dash-section-title">🔄 フォールバック順序</span></div>';
    out += '<div style="display:flex;align-items:center;gap:8px;justify-content:center;flex-wrap:wrap">';
    ['Gemini 🧠','Groq ⚡','OpenRouter 🌐'].forEach(function(p,i){
      out += '<div style="padding:10px 18px;border-radius:10px;background:var(--surf2);border:1px solid var(--b2);font-weight:700;font-size:13px">';
      out += '<span style="color:var(--org);font-size:11px;margin-right:4px">'+(i+1)+'.</span>'+p+'</div>';
      if(i<2) out += '<span style="font-size:14px;color:var(--txt3)">→</span>';
    });
    out += '</div>';
    out += '<div style="margin-top:12px;padding:10px;border-radius:8px;background:rgba(22,163,74,.05);border:1px solid rgba(22,163,74,.1);font-size:11px;color:var(--txt2);text-align:center">1つのAPIが失敗しても次のプロバイダーに自動で切り替わります</div>';
    out += '</div>';
  }

  if(sysTab==='logs'){
    out += '<div class="dash-section"><div class="dash-section-head"><span class="dash-section-title">📋 リクエストログ（直近'+logs.length+'件）</span></div>';
    if(logs.length){
      out += '<div style="overflow-x:auto;max-height:500px;overflow-y:auto"><table class="admin-data-table"><thead><tr><th>時刻</th><th>メソッド</th><th>パス</th><th>ステータス</th><th>応答時間</th><th>UID</th></tr></thead><tbody>';
      logs.forEach(function(l){
        var sc = l.s<300?'var(--grn)':l.s<400?'var(--blue)':l.s<500?'var(--yel)':'var(--red)';
        var time = l.t ? new Date(l.t).toLocaleTimeString('ja-JP') : '--';
        out += '<tr>';
        out += '<td style="font-family:monospace;font-size:11px">'+time+'</td>';
        out += '<td><span class="badge '+(l.m==='POST'?'b-org':'b-blue')+'" style="font-size:10px">'+(l.m||'')+'</span></td>';
        out += '<td style="font-family:monospace;font-size:11px">'+sanitize(l.p||'',40)+'</td>';
        out += '<td><span class="badge" style="background:transparent;color:'+sc+';border:1px solid '+sc+';font-size:10px">'+l.s+'</span></td>';
        out += '<td style="font-family:monospace;font-size:11px">'+(l.d||0)+'ms</td>';
        out += '<td style="font-size:10px;color:var(--txt3)">'+sanitize(l.uid||'--',12)+'</td>';
        out += '</tr>';
      });
      out += '</tbody></table></div>';
    } else {
      out += '<div class="text-muted text-sm text-center" style="padding:32px">ログデータなし</div>';
    }
    out += '</div>';
  }

  if(sysTab==='security'){
    out += '<div class="hero-kpi" style="grid-template-columns:repeat(3,1fr)">';
    out += '<div class="hero-kpi-card" style="border-left:3px solid var(--yel)"><div class="kpi-label">🔒 レート制限</div><div class="kpi-value" style="color:var(--yel)">'+(st.activeRateLimits||0)+'</div><div class="kpi-sub">active keys</div></div>';
    out += '<div class="hero-kpi-card" style="border-left:3px solid var(--red)"><div class="kpi-label">🚫 ブロック中IP</div><div class="kpi-value" style="color:var(--red)">'+blocked.length+'</div></div>';
    out += '<div class="hero-kpi-card" style="border-left:3px solid var(--blue)"><div class="kpi-label">🌐 環境</div><div class="kpi-value" style="color:var(--blue);font-size:18px">'+(h.env||'--')+'</div><div class="kpi-sub">'+(h.version||'')+'</div></div>';
    out += '</div>';

    out += '<div class="dash-section"><div class="dash-section-head"><span class="dash-section-title">🚫 ブロック中IPアドレス</span></div>';
    if(blocked.length){
      out += '<table class="admin-data-table"><thead><tr><th>IP</th><th>試行回数</th><th>最終試行</th><th>解除予定</th><th>操作</th></tr></thead><tbody>';
      blocked.forEach(function(b){
        out += '<tr><td style="font-family:monospace">'+sanitize(b.ip,20)+'</td><td style="font-weight:700">'+b.attempts+'</td>';
        out += '<td style="font-size:11px">'+(b.lastAttempt?new Date(b.lastAttempt).toLocaleString('ja-JP'):'--')+'</td>';
        out += '<td style="font-size:11px">'+(b.unblockAt?new Date(b.unblockAt).toLocaleString('ja-JP'):'--')+'</td>';
        out += '<td><button class="btn btn-danger btn-xs" onclick="_unblockIP(\''+b.ip+'\')">解除</button></td></tr>';
      });
      out += '</tbody></table>';
    } else {
      out += '<div class="text-center" style="padding:30px"><div style="font-size:32px;margin-bottom:8px">✅</div><div class="text-sm text-muted">ブロック中のIPはありません</div></div>';
    }
    out += '</div>';
  }

  return out;
}

// ── バックエンドデータ取得 ──
