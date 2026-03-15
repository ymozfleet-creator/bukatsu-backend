// 12 - チーム画面: teamDash, 選手管理, コンディション, アナウンス, カレンダー
function teamDash(){
  const t=getMyTeam();
  if(!t) return '<div class="pg-head"><div class="pg-title">チームダッシュボード</div></div>'+emptyState('🏟️','チームが未登録です','プロフィール設定からチーム情報を登録してください','プロフィールを設定する',"goTo('profile-settings')");
  const c=t?.coach?DB.coaches.find(x=>x.id===t.coach):null;
  const _contractedReqs=_dbArr('requests').filter(r=>r.teamId===t.id&&r.status==='contracted');
  const _contractedCoaches=_contractedReqs.map(r=>DB.coaches.find(co=>co.id===r.coachId)).filter(Boolean);
  if(c && !_contractedCoaches.find(x=>x.id===c.id)) _contractedCoaches.unshift(c);
  const pls=DB.players.filter(p=>p.team===t.id);
  const paid=_dbArr('payments').filter(p=>p.team===t.id&&p.status==='paid').length;
  const tot=_dbArr('payments').filter(p=>p.team===t.id&&p.status==='paid').reduce((s,p)=>s+p.amount,0);
  const unpaidPls=pls.filter(p=>p.status!=='paid'&&p.status!=='free');
  const announcements=(DB.announcements||[]).filter(a=>a.teamId===t.id).sort((a,b)=>b.createdAt>a.createdAt?1:-1).slice(0,3);
  const collectRate=pls.length?Math.round(paid/pls.length*100):0;
  const pendReqs=_dbArr('requests').filter(r=>r.teamId===t.id&&r.status==='pending').length;

  // 時間帯に応じた挨拶
  const h=new Date().getHours();
  const greetText=h<12?'おはようございます':h<18?'こんにちは':'お疲れさまです';

  return`
  <!-- グリーティングヘッダー -->
  <div class="dash-greeting">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">
      <div>
        <div class="dash-greeting-sub">${greetText}</div>
        <div class="dash-greeting-name">${sanitize(t.name,30)}</div>
        <div class="dash-greeting-sub" style="margin-top:6px">${t.sport||''} ${t.area?'· '+t.area:''} · 招待コード: <b style="color:#fff;letter-spacing:.5px">${t.code||'---'}</b></div>
      </div>
      <div class="dash-greeting-actions">
        <button class="btn btn-sm" onclick="openM('📢 アナウンス投稿',teamAnnouncementForm())"><i class="fa fa-bullhorn" style="margin-right:4px"></i>投稿</button>
        <button class="btn btn-secondary btn-sm" onclick="openTeamTrendAnalysis()">📊 傾向分析</button>
        <button class="btn btn-secondary btn-sm" onclick="openBulkConditionInput()">❤️ 一括体調入力</button>
        <button class="btn btn-secondary btn-sm" onclick="generateTeamWeeklyReport()">📋 週次レポート</button>
        <button class="btn btn-secondary btn-sm" onclick="openCSVImportModal()">📥 CSV取込</button>
        <button class="btn btn-primary btn-sm" onclick="goTo('coach-search')"><i class="fa fa-search" style="margin-right:4px"></i>コーチを探す</button>
        <button class="btn btn-ghost btn-sm" onclick="openWidgetSettings()" title="ダッシュボード設定" style="padding:6px 10px"><i class="fa fa-cog"></i></button>
      </div>
    </div>
  </div>

  ${demoModeWidget()}
  ${flowStepper('team')}
  ${renderProfileCompletionWidget()}
  ${requestsPanel('team')}

  <!-- アラート -->
  ${unpaidPls.length>0?`<div class="dash-alert dash-alert-error" onclick="goTo('fee')" style="cursor:pointer"><i class="fa fa-exclamation-circle"></i><span><b>${unpaidPls.length}名</b>の月謝未払いがあります</span><i class="fa fa-chevron-right" style="margin-left:auto;opacity:.4;font-size:11px"></i></div>`:''}
  ${(()=>{const noGuard=pls.filter(p=>!p.guardianId);const noPay=pls.filter(p=>{if(!p.guardianId)return false;const g=_getUsers().find(u=>u.id===p.guardianId);return g&&!g.paymentSetup;});return (noGuard.length>0?`<div class="dash-alert dash-alert-warn" onclick="goTo('my-team')" style="cursor:pointer"><i class="fa fa-user-friends"></i><span><b>${noGuard.length}名</b>の選手が保護者未紐づけです</span><i class="fa fa-chevron-right" style="margin-left:auto;opacity:.4;font-size:11px"></i></div>`:'')+(noPay.length>0?`<div class="dash-alert dash-alert-warn" onclick="goTo('my-team')" style="cursor:pointer"><i class="fa fa-credit-card"></i><span><b>${noPay.length}名</b>の保護者がクレカ未登録（選手の機能制限中）</span><i class="fa fa-chevron-right" style="margin-left:auto;opacity:.4;font-size:11px"></i></div>`:'')})()}
  ${pendReqs>0?`<div class="dash-alert dash-alert-info" onclick="goTo('coach-search')" style="cursor:pointer"><i class="fa fa-handshake"></i><span><b>${pendReqs}件</b>のマッチング申請があります</span><i class="fa fa-chevron-right" style="margin-left:auto;opacity:.4;font-size:11px"></i></div>`:''}

  ${isWidgetVisible('condition-alerts')?renderConditionAlerts():''}

  <!-- KPIカード -->
  ${isWidgetVisible('kpi')?`<div class="hero-kpi">
    <div class="hero-kpi-card" style="border-left:3px solid var(--teal)">
      <div class="kpi-icon" style="background:rgba(0,207,170,.1)">👥</div>
      <div class="kpi-value" style="color:var(--teal)">${pls.length}</div>
      <div class="kpi-label">登録選手</div>
      <div class="kpi-sub" style="color:var(--txt3)">チーム在籍中</div>
    </div>
    <div class="hero-kpi-card" style="border-left:3px solid ${unpaidPls.length?'var(--red)':'var(--grn)'}">
      <div class="kpi-icon" style="background:${unpaidPls.length?'rgba(239,68,68,.1)':'rgba(34,197,94,.1)'}">${unpaidPls.length?'⚠️':'✅'}</div>
      <div class="kpi-value" style="color:${unpaidPls.length?'var(--red)':'var(--grn)'}">${unpaidPls.length>0?unpaidPls.length+'名':paid+'名'}</div>
      <div class="kpi-label">${unpaidPls.length>0?'月謝未払い':'今月支払済'}</div>
      <div class="kpi-sub">${pls.length>0?`<div style="flex:1;height:4px;background:var(--b2);border-radius:2px;overflow:hidden"><div style="width:${collectRate}%;height:100%;background:${collectRate>=80?'var(--grn)':collectRate>=50?'var(--yel)':'var(--red)'};border-radius:2px;transition:width .3s"></div></div><span style="color:var(--txt3);margin-left:6px">${collectRate}%</span>`:''}</div>
    </div>
    <div class="hero-kpi-card" style="border-left:3px solid var(--org)" onclick="goTo('fee')" role="button" tabindex="0">
      <div class="kpi-icon" style="background:rgba(249,115,22,.1)">💴</div>
      <div class="kpi-value">¥${fmtNum(tot)}</div>
      <div class="kpi-label">累計回収額</div>
      <div class="kpi-sub" style="color:var(--org)">詳細を見る →</div>
    </div>
  </div>`:''}

  ${todayEventsWidget()}

  <!-- メインコンテンツ 2カラム -->
  <div class="dash-grid dash-grid-2" style="margin-bottom:16px">
    <!-- 月謝回収推移 -->
    <div class="dash-section" style="margin-bottom:0">
      <div class="dash-section-head">
        <span class="dash-section-title">📊 月謝回収推移</span>
        <button class="btn btn-ghost btn-xs" onclick="goTo('fee')">詳細 →</button>
      </div>
      <div style="height:160px;position:relative"><div class="skel-overlay"><div class="skel" style="height:100%;border-radius:8px"></div></div><canvas id="team-fee-chart"></canvas></div>
    </div>
    <!-- 契約コーチ -->
    <div class="dash-section" style="margin-bottom:0">
      <div class="dash-section-head"><span class="dash-section-title"><i class="fas fa-chalkboard-user" style="margin-right:4px"></i> 契約コーチ</span>${_contractedCoaches.length?`<button class="btn btn-ghost btn-xs" onclick="window._csTab='contract';goTo('coach-search')">管理 →</button>`:''}</div>
      ${_contractedCoaches.length?_contractedCoaches.map(function(co){
        const _disc=_dbArr('disclosures').find(d=>d.coachId===co.id&&d.teamId===t.id&&d.status==='active');
        const _pledged=_disc&&_disc.coachAgreedAt;
        const _waiting=_disc&&!_disc.coachAgreedAt;
        const _assignedCount=(co._assignedPlayers||[]).length||DB.players.filter(p=>p.team===t.id&&p.coachId===co.id).length;
        return `<div style="background:var(--surf2);border-radius:12px;padding:14px;margin-bottom:10px">
        <div class="flex gap-12 items-center" style="margin-bottom:10px">
          <div class="avi" style="width:44px;height:44px;font-size:18px;background:${co.color||'var(--org)'}22;color:${co.color||'var(--org)'};flex-shrink:0">${co.name?.slice(0,1)||'?'}</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:14px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${sanitize(co.name,20)} ${co.verified?'<i class="fa fa-check-circle" style="color:var(--teal);font-size:11px"></i>':''}</div>
            <div style="font-size:11px;color:var(--txt3);margin-top:2px">${sanitize(co.sport,12)} · ${sanitize(co.area,12)}</div>
          </div>
          <button class="btn btn-ghost btn-xs" onclick="openCoachDetail('${co.id}')">詳細</button>
        </div>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;font-size:11px">
          <span style="padding:2px 8px;border-radius:6px;background:${_pledged?'rgba(0,207,170,.1)':_waiting?'rgba(14,165,233,.1)':'rgba(239,68,68,.06)'};color:${_pledged?'var(--teal)':_waiting?'var(--blue)':'#ef4444'};font-weight:600">
            <i class="fa ${_pledged?'fa-unlock':_waiting?'fa-file-signature':'fa-lock'}" style="margin-right:3px;font-size:9px"></i>
            ${_pledged?'選手情報開示中':_waiting?'同意確認待ち':'選手情報 未開示'}
          </span>
          <span style="padding:2px 8px;border-radius:6px;background:rgba(14,165,233,.08);color:var(--blue);font-weight:600">
            <i class="fa fa-users" style="margin-right:3px;font-size:9px"></i>担当 ${_assignedCount}名
          </span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
          <button class="btn btn-secondary btn-sm" onclick="openAssignPlayersModal('${co.id}')"><i class="fas fa-user-plus" style="margin-right:4px"></i>担当選手を設定</button>
          ${!_disc?`<button class="btn btn-primary btn-sm" onclick="openDisclosureModal('${co.id}')"><i class="fas fa-share-alt" style="margin-right:4px"></i>選手情報を開示</button>`
          :`<button class="btn btn-ghost btn-sm" onclick="goTo('coach-report')"><i class="fas fa-chart-bar" style="margin-right:4px"></i>レポート確認</button>`}
        </div>
      </div>`;}).join('')
      :`<div style="text-align:center;padding:24px 0">
        <div style="font-size:32px;margin-bottom:12px;opacity:.5"><i class="fas fa-chalkboard-user"></i></div>
        <div class="text-sm text-muted" style="margin-bottom:8px">契約コーチがいません</div>
        <div class="text-xs" style="color:var(--org);margin-bottom:14px">${(DB.coaches||[]).length}名のコーチが登録中</div>
        <button class="btn btn-primary btn-sm" onclick="goTo('coach-search')">コーチを探す →</button>
      </div>`}
    </div>
  </div>

  <!-- 🔒 選手情報開示管理 -->
  ${_renderTeamDisclosureSection(t, _contractedCoaches, pls)}

  <!-- 選手コンディション + アナウンス -->
  <div class="dash-grid dash-grid-2" style="margin-bottom:16px">
    <div class="dash-section" style="margin-bottom:0">
      <div class="dash-section-head">
        <span class="dash-section-title">💪 選手コンディション</span>
        <button class="btn btn-ghost btn-xs" onclick="goTo('my-team')">全員 →</button>
      </div>
      ${pls.length?pls.slice(0,5).map(p=>{
        const plog=DB.trainingLog[p.id]||{};
        const cLogData=DB.conditionLog[p.id]||{};
        const todayStr=new Date().toISOString().slice(0,10);
        const todayCond=cLogData[todayStr];
        const bLogData=DB.bodyLog[p.id]||{};
        const latestBody=Object.values(bLogData).sort((a,b)=>a.date>b.date?-1:1)[0];
        const latestCond=todayCond?.mood||0;
        const condEmoji=['😶','😣','😐','🙂','😊','😄'][latestCond]||'😶';
        const condColor=latestCond>=4?'var(--grn)':latestCond>=3?'var(--yel)':latestCond>=1?'var(--org)':'var(--txt3)';
        const paidNow=_dbArr('payments').find(pay=>pay.player===p.id&&pay.month===curMonth()&&pay.status==='paid');
        const hasPain=todayCond?.pain;
        return`<div class="dash-list-item" style="cursor:pointer;padding:12px 4px" onclick="openPlayerCondDetail('${p.id}')">
          <div class="avi" style="width:38px;height:38px;font-size:14px;background:${p.color||'var(--org)'}18;color:${p.color||'var(--org)'};flex-shrink:0">${(p.name||'?')[0]}</div>
          <div style="flex:1;min-width:0"><div class="fw7" style="font-size:14px">${sanitize(p.name,16)}</div><div style="font-size:12px;color:var(--txt2);margin-top:1px">${p.pos||'--'}${latestBody?' · '+latestBody.weight+'kg':''}</div></div>
          <span style="font-size:20px" title="コンディション">${condEmoji}</span>
          ${hasPain?'<span style="font-size:12px;color:var(--red);font-weight:700" title="痛み報告あり">⚠️</span>':''}
          <div style="width:10px;height:10px;border-radius:50%;background:${paidNow?'var(--grn)':'#ef4444'};flex-shrink:0;box-shadow:0 0 0 2px ${paidNow?'rgba(34,197,94,.2)':'rgba(239,68,68,.2)'}" title="${paidNow?'月謝済':'月謝未払い'}"></div>
        </div>`;
      }).join(''):'<div class="text-muted text-sm text-center" style="padding:24px">選手がいません<br><button class="btn btn-primary btn-sm mt-12" onclick="goTo(\'my-team\')">選手を追加</button></div>'}
    </div>
    <div class="dash-section" style="margin-bottom:0">
      <div class="dash-section-head">
        <span class="dash-section-title">📢 アナウンス</span>
        <button class="btn btn-ghost btn-xs" onclick="openM('📢 アナウンス投稿',teamAnnouncementForm())">+ 投稿</button>
      </div>
      ${announcements.length?announcements.map(a=>`<div style="padding:14px 16px;border-left:3px solid var(--org);margin-bottom:8px;border-radius:0 10px 10px 0;background:var(--surf2)">
        <div class="fw7" style="font-size:14px">${sanitize(a.title,24)}</div>
        <div style="font-size:11px;color:var(--txt2);margin-top:4px">${a.createdAt?.slice(0,10)||''}</div>
      </div>`).join(''):'<div class="text-muted text-center" style="padding:24px;font-size:13px">アナウンスはまだありません<br><button class="btn btn-ghost btn-sm mt-12" onclick="openM(\'📢 アナウンス投稿\',teamAnnouncementForm())">最初のアナウンスを投稿 →</button></div>'}
    </div>
  </div>

  <!-- コンディションヒートマップ -->
  <div class="dash-section">
    <div class="dash-section-head">
      <span class="dash-section-title">🌡️ コンディション ヒートマップ</span>
      <div class="flex gap-6 items-center">
        <select id="hm-range-sel" class="input" style="padding:4px 8px;font-size:11px;width:auto;min-width:80px" onchange="renderCondHeatmap()">
          <option value="7">7日間</option>
          <option value="14" selected>14日間</option>
          <option value="30">30日間</option>
        </select>
        <button class="btn btn-ghost btn-xs" onclick="goTo('my-team')">全選手 →</button>
      </div>
    </div>
    <div id="cond-heatmap-container" class="cond-heatmap-wrap"></div>
  </div>

  <!-- 選手成長トラッカー + チーム活動レーダー -->
  <div class="dash-grid dash-grid-2" style="margin-bottom:16px">
    <div class="dash-section" style="margin-bottom:0">
      <div class="dash-section-head">
        <span class="dash-section-title">📈 選手成長トラッカー</span>
        <select id="growth-player-sel" class="input" style="padding:4px 8px;font-size:11px;width:auto;max-width:120px" onchange="renderGrowthTracker()">
          ${pls.map((p,i)=>'<option value="'+p.id+'"'+(i===0?' selected':'')+'>'+sanitize(p.name,12)+'</option>').join('')}
        </select>
      </div>
      <div id="growth-stats-row" class="flex gap-8 mb-12"></div>
      <div class="growth-tabs" id="growth-tabs">
        <button class="growth-tab active" data-gt="weight" onclick="switchGrowthTab('weight')">体重</button>
        <button class="growth-tab" data-gt="cond" onclick="switchGrowthTab('cond')">体調</button>
        <button class="growth-tab" data-gt="kcal" onclick="switchGrowthTab('kcal')">消費kcal</button>
      </div>
      <div style="height:180px;position:relative"><div class="skel-overlay"><div class="skel" style="height:100%;border-radius:8px"></div></div><canvas id="growth-tracker-chart"></canvas></div>
    </div>
    <div class="dash-section" style="margin-bottom:0">
      <div class="dash-section-head">
        <span class="dash-section-title">🎯 チーム活動レーダー</span>
      </div>
      <div style="height:220px;position:relative;display:flex;align-items:center;justify-content:center"><canvas id="team-radar-chart"></canvas></div>
      <div id="team-activity-sparkline" style="margin-top:12px">
        <div class="flex justify-between items-center mb-4">
          <span class="text-xs text-muted">直近14日の活動量</span>
          <span class="text-xs fw7" id="spark-total" style="color:var(--teal)"></span>
        </div>
        <div class="spark-row" id="spark-bars"></div>
      </div>
    </div>
  </div>

  ${renderActivityTimeline()}

  <!-- クイックアクション -->
  <div class="qa-grid">
    <button class="qa-pill" onclick="goTo('fee')"><i style="background:rgba(0,207,170,.1);color:var(--teal)" class="fa fa-money-bill-wave"></i>月謝管理</button>
    <button class="qa-pill" onclick="goTo('coach-search')"><i style="background:rgba(249,115,22,.1);color:var(--org)" class="fa fa-search"></i>コーチ検索</button>
    <button class="qa-pill" onclick="goTo('my-team')"><i style="background:rgba(96,165,250,.1);color:#60a5fa" class="fa fa-users"></i>選手管理</button>
    <button class="qa-pill" onclick="goTo('player-compare')"><i style="background:rgba(234,179,8,.1);color:#d97706" class="fa fa-chart-bar"></i>選手比較</button>
    <button class="qa-pill" onclick="goTo('weekly-report')"><i style="background:rgba(99,102,241,.1);color:#6366f1" class="fa fa-file-alt"></i>週次レポート</button>
    <button class="qa-pill" onclick="goTo('calendar')"><i style="background:rgba(168,85,247,.1);color:#a855f7" class="fa fa-calendar-alt"></i>スケジュール</button>
  </div>
  ${(()=>{
    const _tm=getMyTeam();if(!_tm)return'';
    const pendingIn=(DB.teamMatches||[]).filter(m=>m.teamBId===_tm.id&&m.status==='pending');
    const upEv=(DB.teamEvents||[]).filter(e=>(e.teamAId===_tm.id||e.teamBId===_tm.id)&&(e.status==='confirmed'||e.status==='pending')&&e.date&&e.date>=new Date().toISOString().slice(0,10)).sort((a,b)=>a.date>b.date?1:-1).slice(0,3);
    const matchedCnt=(DB.teamMatches||[]).filter(m=>(m.teamAId===_tm.id||m.teamBId===_tm.id)&&m.status==='matched').length;
    if(!upEv.length&&!pendingIn.length&&!matchedCnt)return'';
    return `<div class="dash-section" style="margin-top:4px">
      <div class="dash-section-head">
        <span class="dash-section-title">🏟️ チームマッチング</span>
        <button class="btn btn-ghost btn-xs" onclick="goTo('team-match')">すべて見る →</button>
      </div>
      ${pendingIn.length?pendingIn.map(m=>{const other=DB.teams.find(t=>t.id===m.teamAId);return`<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:rgba(249,115,22,.06);border:1px solid rgba(249,115,22,.2);border-radius:10px;margin-bottom:6px;cursor:pointer" onclick="window._tmTab='inbox';goTo('team-match')">
        <span style="font-size:16px">📩</span>
        <div style="flex:1"><div class="fw7 text-sm">${sanitize(other?.name||'?',18)} <span style="font-size:10px;color:var(--org)">NEW</span></div>
          <div class="text-xs text-muted">マッチング申請</div></div>
        <span class="text-xs" style="color:var(--org);font-weight:600">対応する →</span>
      </div>`;}).join(''):''}
      ${upEv.map(e=>{const otherId=e.teamAId===_tm.id?e.teamBId:e.teamAId;const other=DB.teams.find(t=>t.id===otherId);const days=Math.round((new Date(e.date)-new Date())/(86400000));return`<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--surf2);border-radius:10px;margin-bottom:6px;cursor:pointer" onclick="window._tmTab='events';goTo('team-match')">
        <div style="text-align:center;min-width:40px"><div style="font-size:16px;font-weight:800;color:${days<=3?'var(--org)':'var(--txt1)'}">${days}</div><div style="font-size:9px;color:var(--txt3)">日後</div></div>
        <div style="flex:1"><div class="fw7 text-sm">${sanitize(e.purpose||'',10)} vs ${sanitize(other?.name||'?',15)} ${e.status==='pending'?'<span style="font-size:9px;color:var(--org)">承認待ち</span>':''}</div>
          <div class="text-xs text-muted">📅 ${e.date}${e.time?' · '+e.time:''}${e.place?' · 📍 '+sanitize(e.place,12):''}</div></div>
        <span class="text-xs" style="color:var(--blue)">詳細 →</span>
      </div>`;}).join('')}
    </div>`;
  })()}

  ${(()=>{
    const _alList=_dbArr('alumni').filter(a=>a.teamId===(t||{}).id);
    const _alVisit=_alList.filter(a=>a.canVisit);
    if(!_alList.length) return `<div class="card mb-16" style="text-align:center;padding:28px"><div style="font-size:32px;margin-bottom:8px">🎓</div><div class="fw7 text-sm mb-4">OBOG連携</div><div class="text-xs text-muted mb-12">卒業生を招待してOB/OG訪問やキャリア情報を共有</div><button class="btn btn-primary btn-sm" onclick="goTo('alumni-mgmt')">🎓 OBOGを招待する</button></div>`;
    return `<div class="card mb-16"><div class="flex justify-between items-center mb-12"><span class="dash-section-title">🎓 OBOG連携</span><button class="btn btn-ghost btn-xs" onclick="goTo('alumni-mgmt')">管理 →</button></div><div style="display:flex;gap:12px;margin-bottom:12px"><div style="flex:1;padding:10px;background:var(--surf2);border-radius:10px;text-align:center"><div style="font-size:18px;font-weight:800">${_alList.length}</div><div style="font-size:10px;color:var(--txt3)">OBOG</div></div><div style="flex:1;padding:10px;background:rgba(0,207,170,.06);border-radius:10px;text-align:center"><div style="font-size:18px;font-weight:800;color:var(--teal)">${_alVisit.length}</div><div style="font-size:10px;color:var(--teal)">訪問OK</div></div></div>${_alList.slice(0,3).map(a=>`<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--b1)"><div class="avi" style="background:#64748b;width:32px;height:32px;font-size:12px">${(a.name||'?')[0]}</div><div style="flex:1;min-width:0"><div class="fw7" style="font-size:12px">${sanitize(a.name,15)}</div><div style="font-size:10px;color:var(--txt3)">${sanitize(a.currentJob||'未登録',15)}</div></div>${a.canVisit?'<span class="badge b-teal" style="font-size:8px">訪問OK</span>':''}</div>`).join('')}</div>`;
  })()}`;
}

function teamAnnouncementForm(){
  return`<div style="display:grid;gap:12px">
    <div class="form-group"><label class="label">タイトル <span style="color:#ef4444">*</span></label><input id="ann-title" class="input" placeholder="大会日程のお知らせ" maxlength="40" oninput="clearFieldError('ann-title')"></div>
    <div class="form-group"><label class="label">内容</label><textarea id="ann-body" class="input" rows="4" placeholder="詳細をここに..." maxlength="400" style="resize:vertical"></textarea></div>
    <button class="btn btn-primary w-full" onclick="submitAnnouncement()">📢 投稿する</button>
  </div>`;
}
function submitAnnouncement(){
  var valid = validateForm([
    ['ann-title', {required: true, requiredMsg: 'タイトルを入力してください'}]
  ]);
  if (!valid) return;
  const title=(document.getElementById('ann-title')?.value||'').trim();
  const body=(document.getElementById('ann-body')?.value||'').trim();
  const t=getMyTeam();if(!t)return;
  if(!DB.announcements)DB.announcements=[];
  DB.announcements.push({id:genId('ann'),teamId:t.id,title:sanitize(title,40),body:sanitize(body,400),createdAt:new Date().toISOString(),createdBy:DB.currentUser?.id});
  saveDB();closeM();toast('アナウンスを投稿しました','s');goTo('dashboard');
}

function myTeam(){
  const t=getMyTeam();
  if(!t) return '<div class="card text-center" style="padding:40px">チーム情報が見つかりません</div>';
  if(!t) return `<div class="pg-head"><div class="pg-title">選手管理</div></div><div class="card text-center" style="padding:40px"><div style="font-size:48px">🏟️</div><div class="fw7 mt-12">チームが未登録です</div></div>`;
  const c=DB.coaches.find(x=>x.id===t.coach);
  const contractedCoachReqs=_dbArr('requests').filter(r=>r.teamId===t.id&&r.status==='contracted');
  const contractedCoachList=contractedCoachReqs.map(r=>DB.coaches.find(co=>co.id===r.coachId)).filter(Boolean);
  // t.coach も含める（レガシー互換）
  if(c && !contractedCoachList.find(x=>x.id===c.id)) contractedCoachList.unshift(c);
  const pls=DB.players.filter(p=>p.team===t.id);
  const fq=(window._playerFilter||'').toLowerCase();
  const fp=window._playerPosFilter||'all';
  const filtered=pls.filter(p=>{
    const matchQ=!fq||p.name?.toLowerCase().includes(fq)||p.pos?.toLowerCase().includes(fq);
    const matchP=fp==='all'||p.pos===fp;
    return matchQ&&matchP;
  });
  const positions=[...new Set(pls.map(p=>p.pos).filter(Boolean))];

  const playerCards=filtered.map(p=>{
    const log=DB.trainingLog[p.id]||{};
    const entries=Object.values(log).sort((a,b)=>a.date>b.date?-1:1).slice(0,7);
    // Firestore から取得した概要データがあれば優先
    const fsSummary=window._teamPlayerSummaries?.[p.id];
    const fsTraining=fsSummary?.training;
    const fsNutrition=fsSummary?.nutrition;
    const avgCond=fsTraining?.avgCond||(entries.length?(entries.reduce((s,e)=>s+(e.cond||0),0)/entries.length).toFixed(1):null);
    const condColor=avgCond>=8?'var(--teal)':avgCond>=6?'var(--yel)':avgCond>0?'var(--red)':'var(--txt3)';
    const recentDays=fsTraining?.recentDays||entries.length;
    const avgKcal=fsTraining?.avgKcal||(entries.length?Math.round(entries.reduce((s,e)=>s+(e.kcal||0),0)/entries.length):null);
    const lastTrainDate=fsTraining?.lastDate||entries[0]?.date||'';
    const paidNow=_dbArr('payments').find(pay=>pay.player===p.id&&pay.status==='paid'&&pay.month===curMonth());
    const guardianUser=p.guardianId?_getUsers().find(u=>u.id===p.guardianId):null;
    const goals=p.goals||{};
    const shortPct=p.goalProgress?.short||0;
    // 食事データ
    const todayMealCount=fsNutrition?.todayCount||0;
    const todayKcal=fsNutrition?.todayKcal||0;
    const mealDays=fsNutrition?.mealDays||0;
    const water=fsNutrition?.water||0;
    // 登録・同期状態
    const isRegistered=fsSummary?.registered;
    const isSynced=fsSummary?.synced;

    return`<div class="card" style="padding:0;overflow:hidden;cursor:pointer;"
      onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 24px rgba(0,0,0,.15)'"
      onmouseout="this.style.transform='';this.style.boxShadow=''"
      onclick="window._pdTab='overview';openPlayerDetailModal('${p.id}')">
      <div style="height:6px;background:${condColor}"></div>
      <div style="padding:16px">
        <div class="flex justify-between items-start mb-12">
          <div class="flex gap-12 items-center">
            <div class="avi" style="width:46px;height:46px;font-size:18px;background:${p.color||'var(--org)'}22;color:${p.color||'var(--org)'}">${p.name?.slice(0,1)||'?'}</div>
            <div>
              <div class="fw7" style="font-size:15px">${sanitize(p.name,16)}</div>
              <div style="font-size:12px;color:var(--txt2);margin-top:2px">${p.pos||'--'} · ${p.age||'--'}歳</div>
              ${guardianUser?`<div style="font-size:11px;color:var(--teal);margin-top:2px">👤 ${sanitize(guardianUser.name,12)} ${guardianUser.paymentSetup?'<span style="color:var(--grn)">💳✓</span>':'<span style="color:var(--yel)">💳未</span>'}</div>`:`<div style="font-size:11px;color:var(--yel);margin-top:2px">⚠ 保護者未設定</div>`}
            </div>
          </div>
          <div class="flex flex-col items-end gap-4">
            <span class="badge ${paidNow?'b-teal':'b-red'}" style="font-size:11px;padding:3px 10px">${paidNow?'✅ 支払済':'⚠️ 未払い'}</span>
            ${p.status==='free'?'<span class="badge b-gray">免除</span>':''}
            ${fsSummary!==undefined?`<span class="badge ${isSynced?'b-teal':isRegistered?'b-yel':'b-gray'}">${isSynced?'📱同期済':isRegistered?'📱未同期':'未登録'}</span>`:''}
          </div>
        </div>

        <!-- トレーニング・コンディション -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:6px;margin-bottom:8px">
          <div style="text-align:center;padding:8px 4px;background:var(--surf2);border-radius:8px">
            <div style="font-size:18px;font-weight:800;color:${condColor}">${avgCond||'--'}</div>
            <div style="font-size:10px;color:var(--txt2);font-weight:600">体調</div>
          </div>
          <div style="text-align:center;padding:8px 4px;background:var(--surf2);border-radius:8px">
            <div style="font-size:18px;font-weight:800;color:var(--blue)">${recentDays}</div>
            <div style="font-size:10px;color:var(--txt2);font-weight:600">練習回数</div>
          </div>
          <div style="text-align:center;padding:8px 4px;background:var(--surf2);border-radius:8px">
            <div style="font-size:18px;font-weight:800;color:var(--org)">${avgKcal||'--'}</div>
            <div style="font-size:10px;color:var(--txt2);font-weight:600">消費kcal</div>
          </div>
          <div style="text-align:center;padding:8px 4px;background:var(--surf2);border-radius:8px">
            <div style="font-size:18px;font-weight:800">${lastTrainDate?lastTrainDate.slice(5):'--'}</div>
            <div style="font-size:10px;color:var(--txt2);font-weight:600">最終練習</div>
          </div>
        </div>

        <!-- 食事データ -->
        ${fsSummary?`<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:8px">
          <div style="text-align:center;padding:6px 4px;background:rgba(34,197,94,.06);border:1px solid rgba(34,197,94,.12);border-radius:8px">
            <div style="font-size:15px;font-weight:700;color:var(--green)">${todayMealCount}</div>
            <div style="font-size:10px;color:var(--txt2);font-weight:600">🍽今日</div>
          </div>
          <div style="text-align:center;padding:6px 4px;background:rgba(59,130,246,.06);border:1px solid rgba(59,130,246,.12);border-radius:8px">
            <div style="font-size:15px;font-weight:700;color:var(--blue)">${todayKcal||'--'}</div>
            <div style="font-size:10px;color:var(--txt2);font-weight:600">摂取kcal</div>
          </div>
          <div style="text-align:center;padding:6px 4px;background:rgba(14,165,233,.06);border:1px solid rgba(14,165,233,.12);border-radius:8px">
            <div style="font-size:15px;font-weight:700">💧${water}</div>
            <div style="font-size:10px;color:var(--txt2);font-weight:600">水分</div>
          </div>
        </div>`:''}

        ${goals.short?`<div style="margin-bottom:10px"><div class="flex justify-between mb-3" style="font-size:12px"><span class="text-muted">🎯 ${sanitize(goals.short,22)}</span><span class="fw7" style="color:var(--org)">${shortPct}%</span></div><div style="height:5px;background:var(--surf2);border-radius:3px"><div style="width:${shortPct}%;height:100%;background:var(--org);border-radius:3px"></div></div></div>`:''}
        <div class="flex gap-6" onclick="event.stopPropagation()">
          <button class="btn btn-ghost btn-xs flex-1" style="font-size:12px" onclick="openM('✏️ ${sanitize(p.name,10)}を編集',editPlayerForm('${p.id}'))">✏️ 編集</button>
          <button class="btn btn-ghost btn-xs flex-1" style="font-size:12px" onclick="openPlayerGoals('${p.id}')">🎯 目標</button>
          <button class="btn btn-ghost btn-xs flex-1" style="font-size:12px" onclick="confirmDeletePlayer('${p.id}')">🗑️</button>
        </div>
      </div>
    </div>`;
  }).join('');

  return`<div class="pg-head flex justify-between items-center">
    <div><div class="pg-title">${sanitize(t.name,20)}</div><div class="pg-sub">${t.sport} · 招待コード: <b style="color:var(--org)">${t.code||'未設定'}</b></div></div>
    <div class="flex gap-8" style="flex-wrap:wrap">
      <button class="btn btn-ghost btn-sm" onclick="loadTeamPlayersSummary()">📊 選手データ同期</button>
      <button class="btn btn-ghost btn-sm" onclick="openPlayerCompare()">⚖️ 選手比較</button>
      <button class="btn btn-ghost btn-sm" onclick="exportRosterCSV()">⬇️ 名簿CSV</button>
      <button class="btn btn-ghost btn-sm" onclick="openCSVImportModal()">📥 CSV取込</button>
      <button class="btn btn-secondary btn-sm" onclick="goTo('fee')">💴 月謝管理</button>
      <button class="btn btn-primary btn-sm" onclick="openM('👤 選手追加',addPlayerForm())">👤+ 追加</button>
    </div>
  </div>

  <!-- 招待コード共有カード -->
  <div class="card" style="padding:14px;margin-bottom:14px;border:1px solid rgba(99,91,255,.15);background:rgba(99,91,255,.03)">
    <div class="flex justify-between items-center mb-10">
      <div class="fw7 text-sm" style="color:var(--org)">📨 選手・保護者を招待する</div>
      <button class="btn btn-ghost btn-xs" onclick="regenerateTeamCode()" title="コード再発行">🔄 再発行</button>
    </div>
    <div class="flex gap-8 items-center flex-wrap">
      <div style="flex:1;min-width:180px;background:var(--surf2);border:1.5px dashed var(--org);border-radius:8px;padding:10px 14px;text-align:center">
        <div style="font-size:22px;font-weight:800;letter-spacing:4px;color:var(--org)">${t.code||'---'}</div>
        <div style="font-size:10px;color:var(--txt3);margin-top:2px">招待コード</div>
      </div>
      <button class="btn btn-primary btn-sm" onclick="copyInviteCode()" style="white-space:nowrap">📋 コピー</button>
      <button class="btn btn-secondary btn-sm" onclick="shareInviteLink()" style="white-space:nowrap">📤 共有</button>
    </div>
    <div style="font-size:11px;color:var(--txt3);margin-top:8px;line-height:1.6">
      選手または保護者にこのコードを伝えてください。アカウント登録時、またはプロフィール画面から入力して参加できます。
    </div>
  </div>
  ${pls.filter(p=>p.status!=='paid'&&p.status!=='free').length>0?`<div style="background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);border-radius:12px;padding:12px 16px;margin-bottom:14px;display:flex;align-items:center;gap:10px">
    <i class="fa fa-exclamation-circle" style="color:#ef4444;flex-shrink:0"></i>
    <div style="flex:1;font-size:13px">月謝未払いの選手が <b style="color:#ef4444">${pls.filter(p=>p.status!=='paid'&&p.status!=='free').length}名</b> います</div>
    <button class="btn btn-primary btn-sm" onclick="goTo('fee')">一括請求する →</button>
  </div>`:''}

  <!-- 検索・フィルター -->
  <div class="card" style="padding:12px;margin-bottom:14px">
    <div class="flex gap-10 items-center flex-wrap">
      <input id="player-search" class="input" style="flex:1;min-width:160px;padding:8px 12px" placeholder="🔍 選手名・ポジションで検索..."
        oninput="window._playerFilter=this.value;goTo('my-team')" value="${fq}">
      <select id="player-pos-filter" class="input" style="width:120px;padding:8px" onchange="window._playerPosFilter=this.value;goTo('my-team')">
        <option value="all" ${fp==='all'?'selected':''}>全ポジション</option>
        ${positions.map(pos=>`<option value="${pos}" ${fp===pos?'selected':''}>${pos}</option>`).join('')}
      </select>
      <div class="text-xs text-muted">${filtered.length}/${pls.length}名</div>
    </div>
  </div>

  <!-- コーチ情報 -->
  ${contractedCoachList.length?`<div class="card" style="padding:12px;margin-bottom:14px">
    <div class="fw7 text-sm mb-8">契約コーチ (${contractedCoachList.length}名)</div>
    ${contractedCoachList.map(function(co){return `<div class="flex gap-12 items-center" style="padding:8px 0;${contractedCoachList.length>1?'border-bottom:1px solid var(--b1)':''}">
      <div class="avi" style="width:38px;height:38px;background:${co.color||'var(--org)'}22;color:${co.color||'var(--org)'}"><i class="fas fa-chalkboard-user" style="font-size:14px"></i></div>
      <div class="flex-1"><div class="fw7 text-sm">${sanitize(co.name,20)}</div><div class="text-xs text-muted">${sanitize(co.sport,12)} · ${sanitize(co.area,12)}</div></div>
      <button class="btn btn-secondary btn-sm" onclick="goTo('chat')">連絡</button>
    </div>`;}).join('')}
  </div>`:''}

  <!-- 選手データ同期ステータス -->
  ${!window._teamPlayerSummaries&&pls.length>0?`<div style="background:rgba(59,130,246,.06);border:1px solid rgba(59,130,246,.15);border-radius:10px;padding:10px 14px;margin-bottom:14px;display:flex;align-items:center;gap:10px">
    <span style="font-size:18px">📊</span>
    <div style="flex:1;font-size:12px;color:var(--txt2)">選手のトレーニング・食事データを表示するには <b>「📊 選手データ同期」</b>を押してください</div>
    <button class="btn btn-primary btn-sm" onclick="loadTeamPlayersSummary()" style="white-space:nowrap;font-size:11px">📊 同期</button>
  </div>`:''}

  <!-- 選手グリッド -->
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px">
    ${playerCards||`<div class="card text-center" style="padding:40px;grid-column:1/-1"><div style="font-size:40px">🔍</div><div class="fw7 mt-12">${fq?'選手が見つかりません':'選手が登録されていません'}</div></div>`}
  </div>

  <!-- 招待コードで登録済みのアカウント一覧 -->
  ${(()=>{
    const allUsers=_getUsers();
    const teamPlayerAccounts=allUsers.filter(u=>u.role==='player'&&(DB.players||[]).some(pl=>pl.id===u.id&&pl.team===t.id));
    const teamParentAccounts=allUsers.filter(u=>u.role==='parent');
    const linkedParentIds=new Set(pls.filter(pl=>pl.guardianId).map(pl=>pl.guardianId));
    const unlinkedParents=teamParentAccounts.filter(u=>!linkedParentIds.has(u.id));
    if(teamPlayerAccounts.length===0&&teamParentAccounts.length===0) return '';
    return `<div class="dash-section" style="margin-top:16px">
      <div class="dash-section-head"><span class="dash-section-title">📱 アカウント登録状況</span></div>
      ${teamPlayerAccounts.length>0?`<div style="margin-bottom:12px">
        <div style="font-size:12px;font-weight:600;color:var(--txt2);margin-bottom:8px">選手アカウント（${teamPlayerAccounts.length}名）</div>
        ${teamPlayerAccounts.map(u=>{const pl=DB.players.find(x=>x.id===u.id);return `<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--surf2);border-radius:8px;margin-bottom:4px">
          <div class="avi" style="width:28px;height:28px;font-size:11px">⚡</div>
          <div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:600">${sanitize(u.name,20)}</div><div style="font-size:11px;color:var(--txt3)">${u.email||''}</div></div>
          <span class="badge b-teal" style="font-size:10px">アプリ登録済</span>
        </div>`;}).join('')}
      </div>`:''}
      ${teamParentAccounts.length>0?`<div>
        <div style="font-size:12px;font-weight:600;color:var(--txt2);margin-bottom:8px">保護者アカウント（${teamParentAccounts.length}名 / 未紐づけ${unlinkedParents.length}名）</div>
        ${teamParentAccounts.map(u=>{
          const linked=linkedParentIds.has(u.id);
          const linkedTo=linked?pls.find(pl=>pl.guardianId===u.id):null;
          return `<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--surf2);border-radius:8px;margin-bottom:4px">
          <div class="avi" style="width:28px;height:28px;font-size:11px;background:${linked?'rgba(34,197,94,.15)':'rgba(245,158,11,.15)'};color:${linked?'var(--grn)':'var(--yel)'}">👤</div>
          <div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:600">${sanitize(u.name,20)}</div><div style="font-size:11px;color:var(--txt3)">${u.email||''}${linked?' → '+sanitize(linkedTo?.name||'',12):''}</div></div>
          ${linked?`<span class="badge b-teal" style="font-size:10px">✅ 紐づけ済</span>`
          :`<span class="badge b-yel" style="font-size:10px">未紐づけ</span>`}
        </div>`;}).join('')}
      </div>`:''}
    </div>`;
  })()}`;
}

function openPlayerDetailModal(pid){
  const p=DB.players.find(x=>x.id===pid);
  if(!p) return;
  const log=DB.trainingLog[p.id]||{};
  const entries=Object.values(log).sort((a,b)=>a.date>b.date?-1:1).slice(0,14);
  const avgCond=entries.length?(entries.reduce((s,e)=>s+(e.cond||0),0)/entries.length).toFixed(1):'--';
  const avgKcal=entries.length?Math.round(entries.reduce((s,e)=>s+(e.kcal||0),0)/entries.length):'--';
  const goals=p.goals||{};
  const hist=(p.commentHistory||[]).slice(-3).reverse();

  // タブ初期化
  if(!window._pdTab) window._pdTab='overview';
  const tab=window._pdTab;
  const tBtn=(k,ico,l)=>`<button style="padding:6px 12px;border-radius:6px;font-size:12px;border:none;cursor:pointer;font-weight:600;background:${tab===k?'var(--org)':'var(--surf2)'};color:${tab===k?'#fff':'var(--txt2)'}" onclick="window._pdTab='${k}';openPlayerDetailModal('${pid}')">${ico} ${l}</button>`;

  let body=`<div style="display:grid;gap:12px">
    <div class="flex gap-12 items-center">
      <div class="avi" style="width:52px;height:52px;font-size:22px;background:${p.color||'var(--org)'}22;color:${p.color||'var(--org)'}">${p.name?.slice(0,1)||'?'}</div>
      <div style="flex:1">
        <div class="fw7" style="font-size:16px">${sanitize(p.name,20)}</div>
        <div class="text-xs text-muted">${p.pos||'--'} · ${p.age||'--'}歳 · ${p.weight||'--'}kg/${p.height||'--'}cm</div>
      </div>
      ${bookmarkStar('player',pid,p.name,'👤')}
      <button class="btn btn-ghost btn-xs" onclick="loadPlayerFirestoreData('${pid}')" id="pd-sync-btn" title="Firestoreからデータ取得"><i class="fas fa-sync-alt"></i></button>
    </div>
    <div class="flex gap-4" style="flex-wrap:wrap">${tBtn('overview','📊','概要')}${tBtn('training','🏋️','トレーニング')}${tBtn('nutrition','🍽️','食事')}${tBtn('condition','❤️','コンディション')}${tBtn('goals','🎯','目標')}</div>`;

  // ━━━━ 概要タブ ━━━━
  if(tab==='overview'){
    body+=`
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
      <div class="stat-box" style="padding:10px"><div class="text-xs text-muted">コンディション</div><div style="font-size:20px;font-weight:700;color:${avgCond!=='--'&&avgCond>=7?'var(--teal)':avgCond>=5?'var(--yel)':'var(--red)'}">${avgCond}</div></div>
      <div class="stat-box" style="padding:10px"><div class="text-xs text-muted">平均kcal</div><div style="font-size:20px;font-weight:700">${avgKcal}</div></div>
      <div class="stat-box" style="padding:10px"><div class="text-xs text-muted">直近練習</div><div style="font-size:20px;font-weight:700;color:var(--blue)">${entries.length}回</div></div>
      <div class="stat-box" style="padding:10px"><div class="text-xs text-muted">最終練習</div><div style="font-size:14px;font-weight:700">${entries[0]?.date?.slice(5)||'--'}</div></div>
    </div>
    ${entries.length>0?`<div><div class="text-xs fw7 mb-6" style="color:var(--txt2)">📅 直近コンディション推移</div>
      <div style="display:flex;gap:4px;align-items:end;height:60px">
        ${entries.slice(0,14).reverse().map(e=>{const h=Math.max(8,(e.cond||0)*12);const c=e.cond>=8?'var(--teal)':e.cond>=6?'var(--yel)':'var(--red)';
        return`<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px" title="${e.date||''} ${e.cond||0}/10">
          <div style="font-size:8px;color:var(--txt3)">${e.cond||0}</div>
          <div style="width:100%;height:${h}px;background:${c};border-radius:3px"></div>
          <div style="font-size:7px;color:var(--txt3)">${(e.date||'').slice(5)}</div>
        </div>`;}).join('')}
      </div></div>`:'<div style="padding:16px;text-align:center;color:var(--txt3);font-size:12px">トレーニングデータなし — 「🔄」で同期してください</div>'}
    ${_renderPlayerNutritionSummary(pid)}
    ${hist.length?`<div><div class="text-xs fw7 mb-6">💬 コーチメモ</div>${hist.map(c=>`<div style="padding:6px 10px;background:var(--surf2);border-radius:6px;margin-bottom:4px;border-left:2px solid var(--teal)"><div class="text-xs fw7" style="color:var(--teal)">${c.date||''}</div><div class="text-xs text-muted mt-1">${sanitize(c.text||'',60)}</div></div>`).join('')}</div>`:''}`;
  }

  // ━━━━ トレーニングタブ ━━━━
  else if(tab==='training'){
    const fsData=window._playerFsData?.[pid];
    const tLog=fsData?.trainingLog?.[pid]||log;
    const allEntries=Object.values(tLog).sort((a,b)=>(b.date||'')>(a.date||'')?1:-1);
    if(allEntries.length===0){
      body+=`<div style="padding:24px;text-align:center;color:var(--txt3)"><div style="font-size:32px;margin-bottom:8px">🏋️</div><div class="fw7">トレーニングデータなし</div><div style="font-size:12px;margin-top:4px">「🔄」ボタンでFirestoreから同期してください</div></div>`;
    } else {
      const totalDays=allEntries.length;
      const totalKcal=allEntries.reduce((s,e)=>s+(e.kcal||0),0);
      const totalMin=allEntries.reduce((s,e)=>s+(e.duration||e.time||0),0);
      body+=`
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px">
        <div class="stat-box" style="padding:10px"><div style="font-size:18px;font-weight:700">${totalDays}日</div><div class="text-xs text-muted">総トレーニング日数</div></div>
        <div class="stat-box" style="padding:10px"><div style="font-size:18px;font-weight:700">${totalKcal.toLocaleString()}kcal</div><div class="text-xs text-muted">総消費カロリー</div></div>
        <div class="stat-box" style="padding:10px"><div style="font-size:18px;font-weight:700">${Math.round(totalMin/60*10)/10}h</div><div class="text-xs text-muted">総トレーニング時間</div></div>
      </div>
      <div style="max-height:300px;overflow-y:auto">
        ${allEntries.slice(0,30).map(e=>`<div style="padding:10px 12px;background:var(--surf2);border-radius:8px;margin-bottom:6px">
          <div class="flex justify-between items-center mb-4">
            <div class="fw7 text-sm">${e.date||'--'}</div>
            <div class="flex gap-8" style="font-size:11px;color:var(--txt3)">
              <span>⏱ ${e.duration||e.time||0}分</span>
              <span>🔥 ${e.kcal||0}kcal</span>
              <span>⭐ ${e.cond||0}/10</span>
            </div>
          </div>
          <div style="font-size:12px;color:var(--txt2)">${sanitize(e.memo||'',50)}</div>
          ${e.exercises?.length?`<div style="margin-top:6px;display:flex;gap:4px;flex-wrap:wrap">${e.exercises.map(ex=>`<span style="font-size:10px;padding:2px 6px;background:var(--b1);border-radius:4px">${sanitize(ex.name||'',15)} ×${ex.sets?.length||0}</span>`).join('')}</div>`:''}
          ${e.note?`<div style="margin-top:4px;font-size:11px;color:var(--txt3);font-style:italic">📝 ${sanitize(e.note,60)}</div>`:''}
        </div>`).join('')}
      </div>`;
    }
  }

  // ━━━━ 食事タブ ━━━━
  else if(tab==='nutrition'){
    const fsData=window._playerFsData?.[pid];
    const pmh=(DB.playerMealHistory||{})[pid]||{};
    const mealH=fsData?.mealHistory||pmh;
    const todayStr2=new Date().toISOString().slice(0,10);
    const todayMeals=fsData?.meals?.today||(pmh[todayStr2]||[]);
    const water=fsData?.meals?.water||0;
    const mealDates=Object.keys(mealH).sort().reverse().slice(0,14);
    const hasData=mealDates.length>0||todayMeals.length>0;

    if(!hasData){
      body+=`<div style="padding:24px;text-align:center;color:var(--txt3)"><div style="font-size:32px;margin-bottom:8px">🍽️</div><div class="fw7">食事データなし</div><div style="font-size:12px;margin-top:4px">「🔄」ボタンでFirestoreから同期してください</div></div>`;
    } else {
      const allMealDays=mealDates.map(d=>{const ms=mealH[d]||[];return{date:d,meals:ms,totalKcal:ms.reduce((s,m)=>s+(m.kcal||m.cal||0),0),protein:ms.reduce((s,m)=>s+(m.protein||m.p||0),0)};});
      const avgDailyCal=allMealDays.length?Math.round(allMealDays.reduce((s,d)=>s+d.totalKcal,0)/allMealDays.length):0;

      body+=`
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px">
        <div class="stat-box" style="padding:10px"><div style="font-size:18px;font-weight:700">${mealDates.length}日</div><div class="text-xs text-muted">記録日数</div></div>
        <div class="stat-box" style="padding:10px"><div style="font-size:18px;font-weight:700">${avgDailyCal}kcal</div><div class="text-xs text-muted">平均カロリー/日</div></div>
        <div class="stat-box" style="padding:10px"><div style="font-size:18px;font-weight:700">💧 ${water}</div><div class="text-xs text-muted">今日の水分</div></div>
      </div>

      ${todayMeals.length?`<div style="margin-bottom:12px"><div class="text-xs fw7 mb-6" style="color:var(--org)">🍽️ 今日の食事（${todayMeals.length}件 / ${todayMeals.reduce((s,m)=>s+(m.kcal||m.cal||0),0)}kcal）</div>
        ${todayMeals.map(m=>`<div style="padding:6px 10px;background:var(--surf2);border-radius:6px;margin-bottom:4px;display:flex;justify-content:space-between;align-items:center">
          <div><div style="font-size:12px;font-weight:600">${sanitize(m.name||m.menu||'',20)}</div><div style="font-size:10px;color:var(--txt3)">${m.time||m.category||''}</div></div>
          <div style="text-align:right;font-size:11px"><div class="fw7">${m.kcal||m.cal||0}kcal</div><div style="color:var(--txt3)">P${m.protein||m.p||0} F${m.fat||m.f||0} C${m.carb||m.c||0}</div></div>
        </div>`).join('')}</div>`:''}

      <div style="max-height:250px;overflow-y:auto">
        <div class="text-xs fw7 mb-6">📅 過去の食事記録</div>
        ${allMealDays.slice(0,14).map(d=>`<div style="padding:8px 12px;background:var(--surf2);border-radius:8px;margin-bottom:6px">
          <div class="flex justify-between items-center">
            <div class="fw7 text-sm">${d.date}</div>
            <div style="font-size:12px"><span class="fw7">${d.totalKcal}kcal</span> <span style="color:var(--txt3)">P${d.protein}g · ${d.meals.length}食</span></div>
          </div>
          ${d.meals.length?`<div style="margin-top:4px;display:flex;gap:4px;flex-wrap:wrap">${d.meals.map(m=>`<span style="font-size:10px;padding:2px 6px;background:var(--b1);border-radius:4px">${sanitize(m.name||m.menu||'',12)} ${m.kcal||m.cal||0}kcal</span>`).join('')}</div>`:''}
        </div>`).join('')}
      </div>`;
    }
  }

  // ━━━━ コンディションタブ ━━━━
  else if(tab==='condition'){
    const fsData=window._playerFsData?.[pid];
    const tLog=fsData?.trainingLog?.[pid]||DB.trainingLog[pid]||log;
    const condEntries=Object.values(tLog).filter(e=>e.cond).sort((a,b)=>(b.date||'')>(a.date||'')?1:-1);
    const bodyLog=fsData?.bodyLog||DB.bodyLog[pid]||{};
    const bodyEntries=Object.values(bodyLog).sort((a,b)=>(b.date||'')>(a.date||'')?1:-1).slice(0,14);
    const injuries=fsData?.injuryHistory||(DB.injuryHistory||{})[pid]||[];

    body+=`
    ${condEntries.length?`<div style="margin-bottom:14px">
      <div class="text-xs fw7 mb-6">⭐ コンディション推移（直近14回）</div>
      <div style="display:flex;gap:3px;align-items:end;height:70px;margin-bottom:8px">
        ${condEntries.slice(0,14).reverse().map(e=>{const h=Math.max(8,(e.cond||0)*7);const c=e.cond>=8?'var(--teal)':e.cond>=6?'var(--yel)':'var(--red)';
        return`<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:1px" title="${e.date} ${e.cond}/10">
          <div style="font-size:9px;font-weight:700;color:${c}">${e.cond}</div>
          <div style="width:100%;height:${h}px;background:${c};border-radius:3px"></div>
          <div style="font-size:7px;color:var(--txt3)">${(e.date||'').slice(5)}</div>
        </div>`;}).join('')}
      </div>
      <div style="overflow-y:auto;max-height:150px">
        ${condEntries.slice(0,10).map(e=>`<div style="display:flex;justify-content:space-between;padding:6px 10px;background:var(--surf2);border-radius:6px;margin-bottom:3px;font-size:12px">
          <span>${e.date||'--'}</span><span>⭐${e.cond}/10</span><span style="color:var(--txt3)">${sanitize(e.note||'',30)}</span>
        </div>`).join('')}
      </div>
    </div>`:'<div style="padding:16px;text-align:center;color:var(--txt3);font-size:12px">コンディションデータなし</div>'}

    ${bodyEntries.length?`<div style="margin-bottom:14px">
      <div class="text-xs fw7 mb-6">📏 体組成記録</div>
      ${bodyEntries.map(b=>`<div style="display:flex;justify-content:space-between;padding:6px 10px;background:var(--surf2);border-radius:6px;margin-bottom:3px;font-size:12px">
        <span class="fw7">${b.date||'--'}</span>
        <span>${b.weight||'--'}kg</span>
        <span>${b.bodyFat||'--'}%</span>
        <span>${b.muscle||'--'}kg筋</span>
      </div>`).join('')}
    </div>`:''}

    ${injuries.length?`<div>
      <div class="text-xs fw7 mb-6" style="color:var(--red)">🩹 怪我・故障歴</div>
      ${injuries.slice(-5).reverse().map(inj=>`<div style="padding:6px 10px;background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.15);border-radius:6px;margin-bottom:4px;font-size:12px">
        <div class="fw7">${sanitize(inj.part||inj.name||'',20)} <span style="color:var(--txt3);font-weight:400">${inj.date||''}</span></div>
        ${inj.note?`<div style="color:var(--txt3);font-size:11px">${sanitize(inj.note,50)}</div>`:''}
      </div>`).join('')}
    </div>`:''}`;
  }

  // ━━━━ 目標タブ ━━━━
  else if(tab==='goals'){
    body+=`
    ${goals.short||goals.long?`<div style="padding:12px;background:var(--surf2);border-radius:8px;margin-bottom:12px">
      ${goals.short?`<div style="margin-bottom:10px">
        <div class="text-xs fw7 mb-4">🎯 短期目標</div>
        <div style="font-size:13px;margin-bottom:4px">${sanitize(goals.short,50)}</div>
        <div style="height:6px;background:var(--b1);border-radius:3px"><div style="width:${p.goalProgress?.short||0}%;height:100%;background:var(--org);border-radius:3px"></div></div>
        <div style="text-align:right;font-size:11px;color:var(--org);font-weight:700;margin-top:2px">${p.goalProgress?.short||0}%</div>
      </div>`:''}
      ${goals.long?`<div>
        <div class="text-xs fw7 mb-4">🏆 長期目標</div>
        <div style="font-size:13px;margin-bottom:4px">${sanitize(goals.long,50)}</div>
        <div style="height:6px;background:var(--b1);border-radius:3px"><div style="width:${p.goalProgress?.long||0}%;height:100%;background:var(--blue);border-radius:3px"></div></div>
        <div style="text-align:right;font-size:11px;color:var(--blue);font-weight:700;margin-top:2px">${p.goalProgress?.long||0}%</div>
      </div>`:''}
    </div>`:'<div style="padding:16px;text-align:center;color:var(--txt3)">目標未設定</div>'}
    <div class="flex gap-8">
      <button class="btn btn-primary flex-1" onclick="closeM();openPlayerGoals('${pid}')">🎯 目標設定</button>
      <button class="btn btn-secondary flex-1" onclick="closeM();openM('✏️ 編集',editPlayerForm('${pid}'))">✏️ 編集</button>
    </div>`;
  }

  body+='</div>';
  openM(`👤 ${sanitize(p.name,16)}`,body);
}

// ── 食事サマリ（概要タブ用） ──
function _renderPlayerNutritionSummary(pid){
  const fs=window._playerFsData?.[pid];
  // 共有データからも食事履歴を取得
  const pmh=(DB.playerMealHistory||{})[pid]||{};
  const mealH=fs?.mealHistory||pmh;
  const todayStr=new Date().toISOString().slice(0,10);
  const todayM=fs?.meals?.today||(pmh[todayStr]||[]);
  const mDays=Object.keys(mealH).length;
  if(!fs && mDays===0) return `<div style="padding:10px;background:var(--surf2);border-radius:8px;font-size:12px;color:var(--txt3);text-align:center">🍽️ 食事データ: 「🔄」で取得</div>`;
  const todayKcal=todayM.reduce((s,m)=>s+(m.kcal||m.cal||0),0);
  return`<div style="padding:10px;background:var(--surf2);border-radius:8px">
    <div class="text-xs fw7 mb-6">🍽️ 食事概要</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;font-size:12px;text-align:center">
      <div><div class="fw7" style="font-size:16px">${todayM.length}</div><div class="text-xs text-muted">今日の食事</div></div>
      <div><div class="fw7" style="font-size:16px">${todayKcal}</div><div class="text-xs text-muted">今日kcal</div></div>
      <div><div class="fw7" style="font-size:16px">${mDays}</div><div class="text-xs text-muted">記録日数</div></div>
    </div>
  </div>`;
}

// ── Firestoreから選手データ取得 ──
async function loadPlayerFirestoreData(pid){
  const btn=document.getElementById('pd-sync-btn');
  if(btn){btn.disabled=true;btn.innerHTML='⏳';}
  try{
    const res=await fetch(`${API_BASE}/api/team/player-data/${encodeURIComponent(pid)}`,{headers:await _apiHeaders()});
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const json=await res.json();
    if(!json.found){toast('この選手はアプリ未登録です','w');return;}
    if(!json.data){toast('選手データは未同期です','w');return;}
    if(!window._playerFsData) window._playerFsData={};
    window._playerFsData[pid]=json.data;
    toast('選手データを取得しました','s');
    openPlayerDetailModal(pid);
  }catch(err){
    toast('データの取得に失敗しました','e');
  }finally{
    if(btn){btn.disabled=false;btn.innerHTML='🔄';}
  }
}

// ── チーム全選手の概要一括取得 ──
async function loadTeamPlayersSummary(){
  const t=getMyTeam();if(!t)return;
  const pls=DB.players.filter(p=>p.team===t.id);
  if(!pls.length){toast('選手がいません','w');return;}
  const btn=event?.target;
  if(btn){btn.disabled=true;btn.innerHTML='⏳ 取得中...';}
  try{
    const res=await fetch(`${API_BASE}/api/team/players-summary`,{
      method:'POST',headers:await _apiHeaders(),
      body:JSON.stringify({playerIds:pls.map(p=>p.id)})
    });
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const json=await res.json();
    window._teamPlayerSummaries=json.summaries||{};
    toast(`${Object.keys(json.summaries).length}名のデータを取得`,'s');
    goTo('my-team');
  }catch(err){
    toast('データの一括取得に失敗しました','e');
  }finally{
    if(btn){btn.disabled=false;btn.innerHTML='📊 選手データ一括取得';}
  }
}

function editPlayerForm(pid){
  const p=DB.players.find(x=>x.id===pid)||{};
  const allUsers=_getUsers();
  const myTeam=getMyTeam();
  // 保護者ロールのユーザー（同チーム招待コード使用 or 全保護者）
  const parentUsers=allUsers.filter(u=>u.role==='parent');
  // 選手ロールのユーザー（自分以外、保護者未設定の別選手は除く - 誤紐づけ防止）
  const linkedParent=parentUsers.find(u=>u.id===p.guardianId) || allUsers.find(u=>u.id===p.guardianId);

  // 紐づけ候補: 保護者ロール全員 + 未紐づけの他ロールは含めない
  const candidates=parentUsers;

  // 選手自身のアカウント情報（招待コードで自己登録した場合）
  const playerAccount=allUsers.find(u=>u.id===p.id && u.role==='player');

  return`<div style="display:grid;gap:10px">
    <div class="form-group"><label class="label">名前</label><input id="ep-name" class="input" value="${sanitize(p.name||'',20)}"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div class="form-group"><label class="label">ポジション</label><input id="ep-pos" class="input" value="${sanitize(p.pos||'',10)}"></div>
      <div class="form-group"><label class="label">年齢</label><input id="ep-age" class="input" type="number" min="5" max="30" value="${p.age||''}"></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div class="form-group"><label class="label">体重(kg)</label><input id="ep-weight" class="input" type="number" value="${p.weight||''}"></div>
      <div class="form-group"><label class="label">身長(cm)</label><input id="ep-height" class="input" type="number" value="${p.height||''}"></div>
    </div>
    <div class="form-group"><label class="label">月謝ステータス</label>
      <select id="ep-status" class="input">
        <option value="unpaid" ${p.status==='unpaid'?'selected':''}>未払い</option>
        <option value="paid" ${p.status==='paid'?'selected':''}>支払済</option>
        <option value="free" ${p.status==='free'?'selected':''}>免除</option>
      </select>
    </div>
    ${playerAccount?`<div style="padding:8px 12px;background:rgba(59,130,246,.06);border:1px solid rgba(59,130,246,.2);border-radius:8px;font-size:12px;color:var(--blue)">
      📱 本人アカウント登録済み（${sanitize(playerAccount.email||'',25)}）
    </div>`:''}
    <div class="form-group">
      <label class="label">👨‍👩‍👧 保護者アカウント</label>
      <select id="ep-guardian-id" class="input">
        <option value="">未設定</option>
        ${candidates.map(u=>`<option value="${u.id}" ${p.guardianId===u.id?'selected':''}>${sanitize(u.name,25)}（${u.email||'メール未登録'}）</option>`).join('')}
      </select>
      ${linkedParent?`<div style="margin-top:6px;padding:8px 12px;background:rgba(34,197,94,.06);border:1px solid rgba(34,197,94,.2);border-radius:8px;font-size:12px;color:var(--grn)">✅ ${sanitize(linkedParent.name,20)} と紐づけ済み</div>`
      :candidates.length>0?`<div style="margin-top:6px;font-size:11px;color:var(--org)">⬆ 登録済み保護者${candidates.length}名から選択してください</div>`
      :`<div style="margin-top:6px;font-size:11px;color:var(--txt3)">💡 保護者にアカウント登録（招待コード: <b>${myTeam?.code||'---'}</b>）を依頼してください</div>`}
    </div>
    <button class="btn btn-primary w-full" onclick="_saveEditPlayer('${pid}')">💾 保存</button>
  </div>`;
}
function _saveEditPlayer(pid){
  const p=DB.players.find(x=>x.id===pid);if(!p)return;
  p.name=sanitize(document.getElementById('ep-name')?.value||p.name,20);
  p.pos=sanitize(document.getElementById('ep-pos')?.value||p.pos,10);
  p.age=parseInt(document.getElementById('ep-age')?.value)||p.age;
  p.weight=parseFloat(document.getElementById('ep-weight')?.value)||p.weight;
  p.height=parseFloat(document.getElementById('ep-height')?.value)||p.height;
  p.status=document.getElementById('ep-status')?.value||p.status;
  // 保護者紐づけ
  const gid=document.getElementById('ep-guardian-id')?.value||'';
  const oldGid=p.guardianId||'';
  p.guardianId=gid||null;
  // usersテーブルも同期（保護者側からも参照されるため必須）
  if(gid!==oldGid){
    const users=_getUsers();
    // 旧保護者のリンク解除
    if(oldGid){
      const oldGu=users.find(u=>u.id===oldGid);
      if(oldGu){
        if(oldGu.linkedPlayerId===pid) oldGu.linkedPlayerId=null;
        if(oldGu.linkedPlayers) oldGu.linkedPlayers=oldGu.linkedPlayers.filter(id=>id!==pid);
        oldGu.linkedTeamId=null;
      }
    }
    // 新保護者のリンク設定
    if(gid){
      const newGu=users.find(u=>u.id===gid);
      if(newGu){
        newGu.linkedPlayerId=pid;
        if(!newGu.linkedPlayers) newGu.linkedPlayers=[];
        if(!newGu.linkedPlayers.includes(pid)) newGu.linkedPlayers.push(pid);
        newGu.linkedTeamId=p.team||null;
        p.guardian=newGu.name||'';
        addNotif(p.name+'の保護者に'+newGu.name+'を紐づけました','fa-link','team');
      }
    } else {
      p.guardian='';
    }
    _saveUsers(users);
    // 共有データ同期はsaveDB()経由で自動実行
  }
  saveDB();closeM();toast(p.name+'の情報を更新しました','s');goTo('my-team');
}
function confirmDeletePlayer(pid){
  const p=DB.players.find(x=>x.id===pid);if(!p)return;
  openM('⚠️ 選手を削除',`<div style="text-align:center;padding:16px">
    <div style="font-size:40px;margin-bottom:12px">⚠️</div>
    <div class="fw7 mb-8">${sanitize(p.name,20)}を削除しますか？</div>
    <div class="text-sm text-muted mb-16">この操作は取り消せません</div>
    <div class="flex gap-10">
      <button class="btn btn-ghost flex-1" onclick="closeM()">キャンセル</button>
      <button class="btn btn-primary flex-1" style="background:var(--red)" onclick="_deletePlayer('${pid}')">🗑️ 削除する</button>
    </div>
  </div>`);
}
function _deletePlayer(pid){
  const idx=DB.players.findIndex(x=>x.id===pid);
  if(idx<0)return;
  const p=DB.players[idx];
  const name=p.name;
  // チーム人数を同期
  if(p.team){const team=DB.teams.find(t=>t.id===p.team);if(team&&team.members>0)team.members--;}
  DB.players.splice(idx,1);
  saveDB();closeM();toast(`${name}を削除しました`,'s');goTo('my-team');
}
function exportRosterCSV(){
  if(!DB.currentUser){toast('ログインが必要です','e');return;}
  const t=getMyTeam();if(!t)return;
  const pls=DB.players.filter(p=>p.team===t.id);
  const rows=[['名前','ポジション','年齢','体重','身長','月謝状況','入会日'],...pls.map(p=>[p.name,p.pos,p.age,p.weight,p.height,p.status,p.createdAt?.slice(0,10)||'--'])];
  const csv=rows.map(r=>r.map(v=>'"'+String(v||'').replace(/"/g,'""')+'"').join(',')).join('\n');
  const a=document.createElement('a');
  a.href='data:text/csv;charset=utf-8,\uFEFF'+encodeURIComponent(csv);
  a.download=`roster_${t.name}_${curMonth()}.csv`;
  a.click();toast('名簿CSVを出力しました','s');
}

function coachSearch(){
  const team=getMyTeam();
  const teamId=team?.id||null;
  const myReqs=teamId?_dbArr('requests').filter(r=>r.teamId===teamId):[];
  const pendingCoachIds=new Set(myReqs.filter(r=>r.status==='pending').map(r=>r.coachId));
  const matchedCoachIds=new Set(myReqs.filter(r=>r.status==='matched'||r.status==='trial_requested'||r.status==='trial_approved').map(r=>r.coachId));
  const contractRequestedIds=new Set(myReqs.filter(r=>r.status==='contract_requested').map(r=>r.coachId));
  const contractedIds=new Set(myReqs.filter(r=>r.status==='contracted').map(r=>r.coachId));
  const contractCoachId=team?.coach||null;

  const tab=window._csTab||'search';
  const q=(window._csQ||'').toLowerCase().trim();
  const sportF=window._csSport||'all';
  const sortF=window._csSort||'default';

  // 検索・フィルタ・ソート
  function applyFilters(coaches){
    let list=[...coaches];
    if(q) list=list.filter(c=>
      (c.name||'').toLowerCase().includes(q)||
      (c.sport||'').toLowerCase().includes(q)||
      (c.area||'').toLowerCase().includes(q)||
      (c.bio||'').toLowerCase().includes(q)
    );
    if(sportF!=='all') list=list.filter(c=>(c.sport||'').includes(sportF));
    if(sortF==='price_asc')  list.sort((a,b)=>a.price-b.price);
    if(sortF==='price_desc') list.sort((a,b)=>b.price-a.price);
    if(sortF==='rating')     list.sort((a,b)=>b.rating-a.rating);
    if(sortF==='exp')        list.sort((a,b)=>b.exp-a.exp);
    return list;
  }

  // スポーツ種目一覧
  const sports=[...new Set(DB.coaches.map(c=>c.sport).filter(Boolean))].slice(0,8);

  // 検索バー HTML
  const searchBar=`<div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:20px;align-items:center">
    <div style="flex:1;min-width:200px;position:relative">
      <i class="fa fa-search" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--txt3);font-size:13px"></i>
      <input class="input" id="cs-search-inp" placeholder="名前・種目・エリアで検索…"
        value="${(window._csQ||'').replace(/"/g,'&quot;')}"
        oninput="window._csQ=this.value;refreshPage()"
        style="padding-left:36px;height:40px;font-size:13px">
    </div>
    <select class="input" id="cs-sport-sel" onchange="window._csSport=this.value;refreshPage()"
      style="height:40px;font-size:12px;padding:0 12px;min-width:130px;cursor:pointer">
      <option value="all" ${sportF==='all'?'selected':''}>種目：すべて</option>
      ${sports.map(s=>`<option value="${s}" ${sportF===s?'selected':''}>${s}</option>`).join('')}
    </select>
    <select class="input" id="cs-sort-sel" onchange="window._csSort=this.value;refreshPage()"
      style="height:40px;font-size:12px;padding:0 12px;min-width:140px;cursor:pointer">
      <option value="default"  ${sortF==='default'?'selected':''}>並び順：おすすめ</option>
      <option value="rating"   ${sortF==='rating'?'selected':''}>評価が高い順</option>
      <option value="exp"      ${sortF==='exp'?'selected':''}>指導歴が長い順</option>
    </select>
    ${q||sportF!=='all'?`<button class="btn btn-ghost btn-sm" onclick="window._csQ='';window._csSport='all';window._csSort='default';refreshPage()">&times; リセット</button>`:''}
  </div>`;

  // コーチカード
  function coachCard(c){
    const isPending=pendingCoachIds.has(c.id);
    const isMatched=matchedCoachIds.has(c.id);
    const isContractRequested=contractRequestedIds.has(c.id);
    const isContracted=contractedIds.has(c.id);
    const isContract=contractCoachId===c.id;
    const _req=myReqs.find(r=>r.coachId===c.id);
    let btn='';
    if(isContract){
      btn=`<button class="btn btn-ghost w-full btn-sm" disabled style="color:var(--grn)"><i class="fas fa-check-circle" style="margin-right:4px"></i>契約中</button>`;
    } else if(isContracted){
      btn=`<button class="btn btn-ghost w-full btn-sm" disabled style="color:var(--teal)"><i class="fas fa-file-contract" style="margin-right:4px"></i>本契約成立</button>`;
    } else if(isContractRequested){
      btn=`<button class="btn btn-ghost w-full btn-sm" disabled style="color:var(--org)"><i class="fas fa-clock" style="margin-right:4px"></i>本契約 · コーチ確認中</button>`;
    } else if(isMatched){
      var _trialStat = _req ? trialStatusBadge(_req) : '';
      var _trialBtn = '';
      if(_req && _req.status==='trial_requested'){
        _trialBtn = '<button class="btn btn-ghost w-full btn-sm" style="color:#a855f7" disabled><i class="fas fa-flask" style="margin-right:4px"></i>🧪 トライアル依頼中</button>';
      } else if(_req && _req.status==='trial_approved'){
        _trialBtn = '<button class="btn btn-secondary w-full btn-sm" onclick="event.stopPropagation();openTrialCompleteModal(\''+_req.id+'\')"><i class="fas fa-flask" style="margin-right:4px"></i>🧪 レッスン完了・評価</button>';
      } else if(_req && _req.trialCompleted){
        _trialBtn = '<button class="btn btn-ghost w-full btn-sm" style="color:var(--grn)" disabled><i class="fas fa-check" style="margin-right:4px"></i>✅ トライアル済 ⭐'+(_req.trialRating||0)+'</button>';
      } else if(_req){
        _trialBtn = '<button class="btn btn-outline w-full btn-sm" style="border-color:rgba(168,85,247,.3);color:#8b5cf6" onclick="event.stopPropagation();openTrialRequestModal(\''+_req.id+'\')" title="本契約前にお試しレッスン"><i class="fas fa-flask" style="margin-right:4px"></i>🧪 トライアルレッスン</button>';
      }
      btn=`<div style="display:flex;flex-direction:column;gap:6px;width:100%">
        <button class="btn btn-primary w-full btn-sm" onclick="event.stopPropagation();var ck=Object.keys(DB.chats).find(function(k){return DB.chats[k].coachId==='${c.id}'&&DB.chats[k].teamId==='${teamId}';});if(ck){activeRoom=ck;goTo('chat')}else{toast('チャットが見つかりません','e')}"><i class="fas fa-comments" style="margin-right:4px"></i>💬 チャットで相談する</button>
        ${_trialBtn}
        <button class="btn btn-ghost w-full btn-sm" style="color:var(--txt2)" onclick="event.stopPropagation();openContractRequestModal('${_req?.id||''}')"><i class="fas fa-file-contract" style="margin-right:4px"></i>相談済み → 本契約へ進む</button>
      </div>`;
    } else if(isPending){
      btn=`<button class="btn btn-ghost w-full btn-sm" style="color:var(--org);border-color:var(--org)" onclick="event.stopPropagation();openMatchChatByKey(Object.keys(DB.chats).find(k=>DB.chats[k].coachId==='${c.id}'&&DB.chats[k].teamId==='${teamId}')||'')"><i class="fas fa-clock" style="margin-right:4px"></i>承認待ち · チャット</button>`;
    } else if(!c.avail){
      btn=`<button class="btn btn-ghost w-full btn-sm" disabled style="opacity:.5">現在契約中</button>`;
    } else {
      btn=teamId?`<button class="btn btn-primary w-full btn-sm" onclick="event.stopPropagation();openM('🤝 マッチングを申請する',requestCoachForm('${c.id}'))"><i class="fas fa-handshake" style="margin-right:4px"></i>マッチングを申請</button>`:`<button class="btn btn-secondary w-full btn-sm" onclick="event.stopPropagation();toast('先にプロフィール設定でチーム情報を登録してください','w');goTo('profile-settings')"><i class="fas fa-handshake" style="margin-right:4px"></i>マッチングを申請</button>`;
    }
    const stars='★'.repeat(Math.round(c.rating||0))+'☆'.repeat(5-Math.round(c.rating||0));
    const statusDot=isContract?`<span style="position:absolute;bottom:2px;right:2px;width:14px;height:14px;background:var(--grn);border-radius:50%;border:2px solid var(--surf);display:flex;align-items:center;justify-content:center"><i class="fa fa-check" style="font-size:7px;color:#fff"></i></span>`
      :isContracted?`<span style="position:absolute;bottom:2px;right:2px;width:14px;height:14px;background:var(--teal);border-radius:50%;border:2px solid var(--surf);display:flex;align-items:center;justify-content:center"><i class="fa fa-check" style="font-size:7px;color:#fff"></i></span>`
      :isContractRequested?`<span style="position:absolute;bottom:2px;right:2px;width:14px;height:14px;background:var(--org);border-radius:50%;border:2px solid var(--surf)"></span>`
      :isMatched?`<span style="position:absolute;bottom:2px;right:2px;width:14px;height:14px;background:var(--teal);border-radius:50%;border:2px solid var(--surf)"></span>`
      :isPending?`<span style="position:absolute;bottom:2px;right:2px;width:14px;height:14px;background:var(--org);border-radius:50%;border:2px solid var(--surf)"></span>`
      :'';
    return`<div class="profile-card" onclick="openCoachDetail('${c.id}')">
      <div style="position:relative;display:inline-block;margin:0 auto 10px">
        <div class="avi avi-lg" style="background:${c.color||'var(--org)'};${c.photo?`background-image:url(${c.photo});background-size:cover;background-position:center`:''}">
          ${c.photo?'':(c.name||'?')[0]}
        </div>
        ${statusDot}
      </div>
      <div class="fw7 mb-2" style="font-size:15px">${sanitize(c.name,20)}${c.verified?` <i class="fa fa-check-circle" style="color:var(--teal);font-size:12px" title="認証済み"></i>`:' <span style="font-size:10px;padding:1px 6px;border-radius:6px;background:rgba(245,158,11,.12);color:var(--yel)">審査中</span>'}</div>
      <div style="font-size:12px;color:var(--org);margin-bottom:6px;font-weight:600">${sanitize(c.sport,12)}${c.area?` · ${sanitize(c.area,10)}`:''}</div>
      <div style="color:var(--yel);font-size:13px;margin-bottom:6px">${stars} <span style="font-size:11px;color:var(--txt2)">${c.rating||'--'} (${c.reviews||0}件)</span></div>
      <p style="font-size:12px;color:var(--txt2);line-height:1.6;margin-bottom:12px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${sanitize(c.bio||'',80)}</p>
      <div style="display:flex;justify-content:space-around;margin-bottom:12px;padding:10px 0;border-top:1px solid var(--b1);border-bottom:1px solid var(--b1)">
        <div style="text-align:center">
          <div style="font-size:16px;font-weight:800">${c.exp||'--'}<span style="font-size:11px;color:var(--txt3)">年</span></div>
          <div style="font-size:11px;color:var(--txt2);font-weight:600">指導歴</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:16px;font-weight:800;color:${c.avail?'var(--grn)':'var(--red)'}">${c.avail?'●':'●'}</div>
          <div style="font-size:11px;color:var(--txt2);font-weight:600">${c.avail?'募集中':'契約中'}</div>
        </div>
      </div>
      ${btn}

    </div>`;
  }

  const allCoaches=DB.coaches.filter(c=>!contractedIds.has(c.id));
  const verifiedCoaches=applyFilters(allCoaches);
  const matchedList=DB.coaches.filter(c=>matchedCoachIds.has(c.id)&&!contractedIds.has(c.id));
  const contractCoaches=DB.coaches.filter(c=>contractedIds.has(c.id)||contractCoachId===c.id);

  function tabContent(){
    if(tab==='search'){
      if(!verifiedCoaches.length){
        return`<div class="empty-state">
          <div class="empty-state-icon">${q?'<i class="fas fa-search" style="font-size:32px;color:var(--txt3)"></i>':'<i class="fas fa-chalkboard-user" style="font-size:32px;color:var(--txt3)"></i>'}</div>
          <h3>${q?'該当するコーチが見つかりません':'コーチがまだ登録されていません'}</h3>
          <p class="text-sm text-muted" style="max-width:300px;margin:0 auto 16px">${q?'別のキーワードで検索してみてください':'コーチが本サービスに登録するとここに表示されます。'}</p>
          <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
            ${q?`<button class="btn btn-ghost btn-sm" onclick="window._csQ='';refreshPage()">検索をクリア</button>`:''}
          </div>
        </div>`;
      }
      return`<div style="font-size:12px;color:var(--txt3);margin-bottom:12px">${verifiedCoaches.length}件のコーチ</div>
      <div class="pcard-grid">${verifiedCoaches.map(c=>coachCard(c)).join('')}</div>`;
    }
    if(tab==='matched'){
      const pendingList=DB.coaches.filter(c=>pendingCoachIds.has(c.id)&&!contractedIds.has(c.id));
      const contractReqList=DB.coaches.filter(c=>contractRequestedIds.has(c.id)&&!contractedIds.has(c.id));
      const allList=[...contractReqList,...pendingList,...matchedList.filter(c=>!pendingCoachIds.has(c.id)&&!contractRequestedIds.has(c.id))];
      if(!allList.length) return`<div class="empty-state">
        <div class="empty-state-icon"><i class="fas fa-handshake" style="font-size:32px;color:var(--txt3)"></i></div>
        <h3>マッチング中・依頼済みのコーチはいません</h3>
        <p>「コーチを探す」タブから依頼を送ってみましょう</p>
        <button class="btn btn-primary" onclick="window._csTab='search';refreshPage()">コーチを探す</button>
      </div>`;
      return`<div style="font-size:12px;color:var(--txt3);margin-bottom:12px">
        ${contractReqList.length?'<span style="color:var(--org);font-weight:700">'+contractReqList.length+'件 契約申請中</span> / ':''}
        ${matchedList.length}件 マッチング済み${pendingList.length?' / '+pendingList.length+'件 交渉中':''}
      </div>
      <div class="pcard-grid">${allList.map(c=>coachCard(c)).join('')}</div>`;
    }
    if(tab==='contract'){
      if(!contractCoaches.length) return`<div class="empty-state">
        <div class="empty-state-icon"><i class="fas fa-star" style="font-size:32px;color:var(--txt3)"></i></div>
        <h3>現在契約中のコーチはいません</h3>
        <p>マッチング済みタブから本契約を進めると、ここに表示されます</p>
      </div>`;
      return`<div style="font-size:12px;color:var(--txt3);margin-bottom:12px">${contractCoaches.length}名の契約コーチ</div>
      <div class="pcard-grid">${contractCoaches.map(c=>coachCard(c)).join('')}</div>`;
    }
    return '';
  }

  const tabs=[
    {k:'search', l:'コーチを探す',   i:'fa-search',   count:null},
    {k:'matched',l:'相談・契約中', i:'fa-handshake',count:(matchedList.length+pendingCoachIds.size+contractRequestedIds.size)||null},
    {k:'contract',l:'契約コーチ',    i:'fa-star',     count:contractCoaches.length||null},
  ];

  const teamNotSetBanner=!teamId?`<div class="dash-alert dash-alert-warn" style="margin-bottom:16px;cursor:pointer" onclick="goTo('profile-settings')"><i class="fa fa-info-circle"></i><span>チーム情報が未登録です。コーチへの依頼を送るには、まず<b>プロフィール設定</b>でチーム情報を登録してください。</span><i class="fa fa-chevron-right" style="margin-left:auto;opacity:.4;font-size:11px"></i></div>`:'';

  return`<div class="pg-head"><div class="pg-title">コーチ管理</div><div class="pg-sub">依頼・マッチング・契約を一元管理</div></div>
  ${teamNotSetBanner}

  <div style="display:flex;gap:0;border-bottom:2px solid var(--b1);margin-bottom:20px">
    ${tabs.map(t=>`<button onclick="window._csTab='${t.k}';refreshPage()"
      style="padding:10px 18px;background:none;border:none;cursor:pointer;font-size:13px;font-weight:600;
      color:${tab===t.k?'var(--org)':'var(--txt3)'};
      border-bottom:${tab===t.k?'2px solid var(--org)':'2px solid transparent'};margin-bottom:-2px;
      display:flex;align-items:center;gap:7px;transition:color .15s">
      <i class="fa ${t.i}"></i>${t.l}
      ${t.count?`<span style="background:${tab===t.k?'var(--org)':'var(--txt3)'};color:#fff;border-radius:999px;font-size:10px;padding:1px 7px;font-weight:700">${t.count}</span>`:''}
    </button>`).join('')}
  </div>

  ${tab==='search' ? searchBar : ''}
  ${tabContent()}`;
}

function _autoGenerateMonthlyFees(){
  // 全チームの全選手に対して、当月の月謝レコードを自動生成
  if(!DB.payments)DB.payments=[];
  var now=new Date();
  var thisMonth=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0');
  DB.teams.forEach(function(team){
    if(!team.fee||team.fee<=0)return;
    var players=DB.players.filter(function(p){return p.team===team.id;});
    players.forEach(function(p){
      // 保護者紐付け確認
      var hasGuardian=!!p.guardianId;
      // 今月分がなければ生成
      var existing=_dbArr('payments').find(function(pay){
        return pay.player===p.id && pay.team===team.id && pay.month===thisMonth;
      });
      if(!existing){
        _dbArr('payments').push({
          id:genId('pay'), player:p.id, team:team.id,
          amount:team.fee, month:thisMonth,
          status:'unpaid', createdAt:new Date().toISOString(),
          playerName:p.name, teamName:team.name,
          guardianId:p.guardianId||null
        });
      }
    });
  });
  // 過去月の未払いを overdue に
  _dbArr('payments').forEach(function(pay){
    if(pay.status==='unpaid'&&pay.month&&pay.month<thisMonth){
      pay.status='overdue';
    }
  });
  saveDB();
}

// ── 定期課金（サブスクリプション）管理 ──
function generateInvoicePDF(paymentId){
  const pay = _dbArr('payments').find(p=>p.id===paymentId);
  if(!pay){ toast('支払いデータが見つかりません','e'); return; }
  const player = DB.players.find(p=>p.id===pay.player);
  const team = DB.teams.find(t=>t.id===pay.team);
  
  if(typeof jspdf==='undefined'&&typeof window.jspdf==='undefined'){
    toast('PDF生成ライブラリを読み込み中…','i'); return;
  }
  const {jsPDF} = window.jspdf;
  const doc = new jsPDF({orientation:'portrait', unit:'mm', format:'a4'});
  const W=210, M=20;
  const now = new Date();
  const invNo = 'INV-' + (pay.month||'').replace('-','') + '-' + pay.id.slice(-6).toUpperCase();
  
  // ヘッダー
  doc.setFillColor(14,30,50); doc.rect(0,0,W,28,'F');
  doc.setTextColor(255,107,43); doc.setFontSize(22); doc.setFont('helvetica','bold');
  doc.text('INVOICE', M, 18);
  doc.setTextColor(255,255,255); doc.setFontSize(10); doc.setFont('helvetica','normal');
  doc.text('MyCOACH-MyTEAM', W-M, 12, {align:'right'});
  doc.text(invNo, W-M, 18, {align:'right'});
  doc.text(now.toLocaleDateString('ja-JP'), W-M, 24, {align:'right'});
  
  // 請求先
  let y = 40;
  doc.setTextColor(30,30,30);
  doc.setFontSize(11); doc.setFont('helvetica','bold');
  doc.text('Bill To:', M, y);
  doc.setFont('helvetica','normal'); doc.setFontSize(10);
  y += 8; doc.text(player?.name || 'N/A', M, y);
  y += 6; doc.text('Team: ' + (team?.name||'N/A'), M, y);
  y += 6; doc.text('Email: ' + (player?.email||DB.currentUser?.email||''), M, y);
  
  // 発行元
  doc.setFont('helvetica','bold'); doc.setFontSize(11);
  doc.text('From:', W/2+10, 40);
  doc.setFont('helvetica','normal'); doc.setFontSize(10);
  doc.text(team?.name || 'MyCOACH-MyTEAM', W/2+10, 48);
  doc.text(team?.email || '', W/2+10, 54);
  
  // テーブル
  y = 78;
  doc.setFillColor(248,250,252); doc.rect(M, y, W-M*2, 10, 'F');
  doc.setFont('helvetica','bold'); doc.setFontSize(9);
  doc.setTextColor(100,100,100);
  doc.text('Description', M+4, y+7);
  doc.text('Period', M+80, y+7);
  doc.text('Amount', W-M-4, y+7, {align:'right'});
  
  y += 14;
  doc.setFont('helvetica','normal'); doc.setTextColor(30,30,30); doc.setFontSize(10);
  const desc = pay.fromSubscription ? 'Monthly Fee (Auto)' : 'Monthly Fee';
  doc.text(desc, M+4, y);
  doc.text(pay.month || curMonth(), M+80, y);
  doc.setFont('helvetica','bold');
  doc.text('JPY ' + (pay.amount||0).toLocaleString(), W-M-4, y, {align:'right'});
  
  // 手数料
  if(pay.fee){
    y += 8;
    doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(100,100,100);
    doc.text('Platform Fee', M+4, y);
    doc.text('JPY ' + pay.fee.toLocaleString(), W-M-4, y, {align:'right'});
  }
  
  // 合計
  y += 14;
  doc.setDrawColor(200,200,200); doc.line(M, y-4, W-M, y-4);
  doc.setFont('helvetica','bold'); doc.setFontSize(14); doc.setTextColor(255,107,43);
  doc.text('Total: JPY ' + (pay.amount||0).toLocaleString(), W-M-4, y+4, {align:'right'});
  
  // ステータス
  y += 16;
  const isPaid = pay.status === 'paid';
  doc.setFillColor(isPaid?236:254, isPaid?253:226, isPaid?245:226);
  doc.roundedRect(M, y, 50, 12, 3, 3, 'F');
  doc.setFontSize(11); doc.setTextColor(isPaid?22:202, isPaid?163:138, isPaid?74:4);
  doc.text(isPaid ? 'PAID' : 'UNPAID', M+25, y+8, {align:'center'});
  if(isPaid && pay.paidAt){
    doc.setFontSize(8); doc.setTextColor(100,100,100);
    doc.text('Paid on: ' + new Date(pay.paidAt).toLocaleDateString('ja-JP'), M+55, y+8);
  }
  
  // フッター
  doc.setFontSize(8); doc.setTextColor(150,150,150);
  doc.text('This invoice was automatically generated by MyCOACH-MyTEAM.', W/2, 280, {align:'center'});
  
  doc.save(`invoice_${invNo}.pdf`);
  toast('請求書PDFを生成しました','s');
}

// 月次請求書一括生成
function generateMonthlyInvoices(){
  const team = getMyTeam();
  if(!team){ toast('チーム情報が見つかりません','e'); return; }
  const month = curMonth();
  const pays = _dbArr('payments').filter(p => p.team === team.id && p.month === month);
  
  if(!pays.length){ toast('今月の請求データがありません','i'); return; }
  
  openM('📄 請求書一括生成', `
    <div class="fw7 mb-12">今月（${month}）の請求書を生成</div>
    <div style="max-height:250px;overflow-y:auto;margin-bottom:16px">
      ${pays.map(p => {
        const pl = DB.players.find(x=>x.id===p.player);
        return `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--b1)">
          <div>
            <div class="text-sm fw7">${sanitize(pl?.name||'不明',20)}</div>
            <div class="text-xs text-muted">${p.status==='paid'?'✅ 支払済':'⏳ 未払い'}</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span class="text-sm fw7">¥${(p.amount||0).toLocaleString()}</span>
            <button class="btn btn-ghost btn-xs" onclick="generateInvoicePDF('${p.id}')">📄</button>
          </div>
        </div>`;
      }).join('')}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <button class="btn btn-primary" onclick="_generateAllInvoices('${month}')">📄 全${pays.length}件を一括生成</button>
      <button class="btn btn-ghost" onclick="closeM()">閉じる</button>
    </div>
  `);
}

function _generateAllInvoices(month){
  const team = getMyTeam();
  if(!team) return;
  const pays = _dbArr('payments').filter(p => p.team === team.id && p.month === month);
  let count = 0;
  pays.forEach((p, i) => {
    setTimeout(() => {
      generateInvoicePDF(p.id);
      count++;
      if(count === pays.length) toast(`✅ ${count}件の請求書を生成しました`,'s');
    }, i * 500);
  });
  closeM();
}

// ── 定期課金（Stripe Subscription）──────────────────
function openSubscriptionSetup(){
  const team = getMyTeam();
  if(!team){ toast('チーム情報が見つかりません','e'); return; }
  const players = DB.players.filter(p => p.team === team.id);
  const fee = team.fee || 0;
  if(fee <= 0){ toast('月謝金額を先に設定してください','w'); goTo('profile-settings'); return; }
  
  const subscribed = players.filter(p => {
    const pay = _dbArr('payments').find(x => x.player === p.id && x.subscription);
    return !!pay;
  });
  const unsubscribed = players.filter(p => !subscribed.find(s => s.id === p.id));
  
  openM('💳 定期課金（サブスクリプション）', `
    <div style="margin-bottom:16px;padding:14px;background:rgba(14,165,233,.06);border:1px solid rgba(14,165,233,.15);border-radius:12px;font-size:12px;line-height:1.7;color:var(--txt2)">
      <div class="fw7" style="color:#0ea5e9;margin-bottom:4px">📅 自動引落しについて</div>
      毎月${fee.toLocaleString()}円を自動的にカード決済します。保護者がクレジットカードを登録すると、毎月の月謝が自動引落しされます。
    </div>
    
    <div class="fw7 mb-8" style="font-size:14px">登録済み（${subscribed.length}名）</div>
    ${subscribed.length ? subscribed.map(p => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--b1)">
        <div><span class="text-sm fw7">${sanitize(p.name,20)}</span> <span class="badge b-teal" style="font-size:9px">自動引落し</span></div>
        <button class="btn btn-ghost btn-xs" style="color:var(--red)" onclick="cancelSubscription('${p.id}')">解除</button>
      </div>
    `).join('') : '<div class="text-sm text-muted mb-12">まだ登録者がいません</div>'}
    
    <div class="fw7 mb-8 mt-16" style="font-size:14px">未登録（${unsubscribed.length}名）</div>
    ${unsubscribed.length ? unsubscribed.map(p => {
      const guardian = p.guardianId ? _getUsers().find(u => u.id === p.guardianId) : null;
      return `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--b1)">
        <div>
          <span class="text-sm fw7">${sanitize(p.name,20)}</span>
          ${guardian ? '<span class="text-xs text-muted"> (保護者: '+sanitize(guardian.name,15)+')</span>' : '<span class="text-xs" style="color:var(--red)">保護者未紐付</span>'}
        </div>
        <button class="btn btn-primary btn-xs" onclick="setupSubscription('${p.id}')">📧 案内を送る</button>
      </div>`;
    }).join('') : '<div class="text-sm text-muted">全選手が登録済みです</div>'}
    
    <div style="margin-top:20px;display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <button class="btn btn-primary" onclick="sendSubscriptionInviteAll()">📧 全員に案内を送る</button>
      <button class="btn btn-ghost" onclick="closeM()">閉じる</button>
    </div>
  `);
}

function setupSubscription(playerId){
  const player = DB.players.find(p => p.id === playerId);
  const team = getMyTeam();
  if(!player || !team) return;
  
  // サブスクリプション案内をチャット・通知で送信
  const guardian = player.guardianId ? _getUsers().find(u => u.id === player.guardianId) : null;
  const targetName = guardian?.name || player.name;
  const msg = `【定期課金のご案内】\n${player.name}さんの月謝（¥${(team.fee||0).toLocaleString()}/月）を自動引落しに切り替えませんか？\nお支払い画面から「定期課金に登録」ボタンをタップしてください。`;
  
  // 通知送信
  const targetId = guardian?.id || player.id;
  addNotif('💳 ' + msg.split('\n')[0], 'fa-credit-card', 'parent-fee', targetId);
  
  // チャットで案内
  const inqKey = 'inquiry-' + targetId;
  if(DB.chats[inqKey]){
    DB.chats[inqKey].msgs.push({mid:_genMsgId(), from:'admin', name:'事務局', text:msg, time:now_time(), date:new Date().toISOString().slice(0,10), read:false});
    DB.chats[inqKey].unread = (DB.chats[inqKey].unread||0) + 1;
  }
  saveDB();
  toast(targetName + 'に定期課金の案内を送りました','s');
}

function sendSubscriptionInviteAll(){
  const team = getMyTeam();
  if(!team) return;
  const players = DB.players.filter(p => p.team === team.id);
  let sent = 0;
  players.forEach(p => {
    const existing = _dbArr('payments').find(x => x.player === p.id && x.subscription);
    if(!existing){
      setupSubscription(p.id);
      sent++;
    }
  });
  closeM();
  toast(`${sent}名に定期課金の案内を送りました`,'s');
}

function enableSubscription(playerId){
  // 保護者/選手が自分の定期課金を有効化
  const player = DB.players.find(p => p.id === playerId);
  const team = player ? DB.teams.find(t => t.id === player.team) : null;
  if(!player || !team){ toast('情報が見つかりません','e'); return; }
  
  // 月謝レコードにsubscriptionフラグを設定
  const month = curMonth();
  let pay = _dbArr('payments').find(p => p.player === playerId && p.month === month);
  if(!pay){
    pay = { id:genId('pay'), player:playerId, team:team.id, amount:team.fee||0, month, status:'unpaid', createdAt:new Date().toISOString() };
    _dbArr('payments').push(pay);
  }
  pay.subscription = true;
  pay.subscriptionStarted = new Date().toISOString();
  
  // Stripe決済を開始
  processStripePayment(document.createElement('button'), {
    type:'tuition', amount:team.fee, teamId:team.id, teamName:team.name,
    playerName:player.name, playerId:player.id, month,
    subscription:true
  });
  
  saveDB();
  addAuditLog('subscription_enable', player.name + ' が定期課金を開始', {playerId, teamId:team.id, amount:team.fee});
}

function cancelSubscription(playerId){
  if(!confirm('定期課金を解除しますか？次月以降は手動でお支払いが必要になります。')) return;
  const pays = _dbArr('payments').filter(p => p.player === playerId && p.subscription);
  pays.forEach(p => { delete p.subscription; delete p.subscriptionStarted; });
  saveDB();
  toast('定期課金を解除しました','s');
  addAuditLog('subscription_cancel', 'playerId=' + playerId + ' の定期課金を解除');
  refreshPage();
}

// ── 請求書自動生成（月初自動実行）──────────────────
function _autoGenerateInvoices(){
  const role = DB.currentUser?.role;
  if(role !== 'team' && role !== 'admin') return;
  
  const now = new Date();
  const thisMonth = curMonth();
  const lastGenKey = '_lastInvoiceGen_' + thisMonth;
  
  // 今月分は1回だけ実行
  if(DB.settings && DB.settings[lastGenKey]) return;
  
  const team = getMyTeam();
  if(!team || !team.fee || team.fee <= 0) return;
  
  // 月謝レコードを自動生成
  _autoGenerateMonthlyFees();
  
  // 設定で自動請求書が有効な場合、PDFも自動生成
  if(DB.settings?.autoInvoice){
    const pays = _dbArr('payments').filter(p => p.team === team.id && p.month === thisMonth && p.status === 'unpaid');
    if(pays.length > 0){
      // 保護者・選手に通知
      pays.forEach(p => {
        const player = DB.players.find(x => x.id === p.player);
        if(!player) return;
        const targetId = player.guardianId || player.id;
        addNotif(`📄 ${thisMonth}の月謝請求書が発行されました（¥${(p.amount||0).toLocaleString()}）`, 'fa-file-invoice-dollar', 'parent-fee', targetId);
        // 定期課金者は自動支払い処理をマーク
        if(p.subscription){
          p.autoPayScheduled = true;
          p.autoPayDate = new Date(now.getFullYear(), now.getMonth(), 5).toISOString(); // 毎月5日に引落し
        }
      });
    }
  }
  
  // 実行フラグを保存
  if(!DB.settings) DB.settings = {};
  DB.settings[lastGenKey] = true;
  saveDB();
}

// 請求書自動生成の設定UI
function openAutoInvoiceSettings(){
  const team = getMyTeam();
  if(!team){ toast('チーム情報が見つかりません','e'); return; }
  const enabled = DB.settings?.autoInvoice || false;
  const autoDay = DB.settings?.autoInvoiceDay || 1;
  
  openM('📄 請求書自動生成 設定', `
    <div style="margin-bottom:16px;padding:14px;background:var(--surf2);border-radius:12px;font-size:12px;line-height:1.7">
      <div class="fw7 mb-4">毎月の月謝請求を自動化</div>
      毎月1日に全選手の請求書を自動生成し、保護者・選手に通知します。定期課金（サブスクリプション）を有効にした選手は自動で決済が行われます。
    </div>
    
    <div style="display:flex;justify-content:space-between;align-items:center;padding:14px;background:var(--surf);border:1px solid var(--b1);border-radius:12px;margin-bottom:16px">
      <div>
        <div class="fw7">自動請求書生成</div>
        <div class="text-xs text-muted mt-2">毎月1日に自動で請求書を発行</div>
      </div>
      <label class="toggle-switch"><input type="checkbox" id="ai-toggle" ${enabled?'checked':''}><span class="toggle-slider"></span></label>
    </div>
    
    <div style="padding:14px;background:var(--surf);border:1px solid var(--b1);border-radius:12px;margin-bottom:16px">
      <div class="fw7 mb-8">月謝金額: ¥${(team.fee||0).toLocaleString()}/月</div>
      <div class="text-xs text-muted">対象選手: ${DB.players.filter(p=>p.team===team.id).length}名</div>
      <div class="text-xs text-muted mt-4">定期課金登録者: ${_dbArr('payments').filter(p=>p.team===team.id&&p.subscription).length}名</div>
    </div>
    
    <div class="flex gap-10">
      <button class="btn btn-primary flex-1" onclick="saveAutoInvoiceSettings()">💾 保存</button>
      <button class="btn btn-ghost flex-1" onclick="closeM()">キャンセル</button>
    </div>
  `);
}

function saveAutoInvoiceSettings(){
  if(!DB.settings) DB.settings = {};
  DB.settings.autoInvoice = document.getElementById('ai-toggle')?.checked || false;
  saveDB();
  closeM();
  toast(DB.settings.autoInvoice ? '✅ 自動請求書生成を有効にしました' : '自動請求書生成を無効にしました', 's');
  addAuditLog('auto_invoice_setting', '自動請求書: ' + (DB.settings.autoInvoice ? 'ON' : 'OFF'));
}

function feeMgmt(){
  _autoGenerateMonthlyFees();
  const _myTeam=getMyTeam();
  if(!_myTeam) return '<div class="card text-center" style="padding:40px">チーム情報が見つかりません</div>';
  if(!_myTeam) return '<div class="pg-head"><div class="pg-title">月謝管理</div></div>'+emptyState('💰','チーム情報が未設定です','プロフィールを設定してチーム情報を登録してください','プロフィールを設定する',"goTo('profile-settings')");
  const pls=DB.players.filter(p=>p.team===_myTeam.id);
  const allPays=_dbArr('payments').filter(p=>p.team===_myTeam.id);
  const paidPays=allPays.filter(p=>p.status==='paid');
  const paid=paidPays.length, tot=paidPays.reduce((s,p)=>s+(p.amount||0),0);
  const unpaid=pls.filter(p=>p.status!=='paid'&&p.status!=='free').length;

  // 月次回収データ（6ヶ月）
  const months=Array.from({length:6},(_,i)=>{const d=new Date();d.setMonth(d.getMonth()-5+i);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');});
  const monthlyPaid=months.map(m=>paidPays.filter(p=>(p.paidAt||p.month||'').slice(0,7)===m).reduce((s,p)=>s+(p.amount||0),0));
  const collectRate=pls.length?Math.round(paid/Math.max(pls.length,1)*100):0;

  // 選手別支払状況
  const rows=pls.map(p=>{
    const pay=allPays.filter(pay=>pay.player===p.id).sort((a,b)=>b.createdAt>a.createdAt?1:-1)[0];
    const statusBadge=p.status==='paid'?'<span class="badge b-teal">支払済</span>':p.status==='free'?'<span class="badge b-gray">免除</span>':'<span class="badge b-red">未払い</span>';
    const lastPaid=paidPays.filter(pay=>pay.player===p.id).sort((a,b)=>a.paidAt>b.paidAt?-1:1)[0];
    return`<tr>
      <td style="padding:10px 12px"><div class="fw7 text-sm">${sanitize(p.name,16)}</div><div class="text-xs text-muted">${p.pos||'--'}</div></td>
      <td style="padding:10px 12px">${statusBadge}</td>
      <td style="padding:10px 12px;text-align:right" class="text-sm">¥${fmtNum(_myTeam.fee||0)}</td>
      <td style="padding:10px 12px;text-align:center" class="text-xs text-muted">${lastPaid?.paidAt?.slice(0,10)||'--'}</td>
      <td style="padding:10px 12px">
        <div class="flex gap-6">
          ${p.status==='paid'?`<button class="btn btn-ghost btn-xs" onclick="exportPlayerReceiptPDF('${p.id}','${_myTeam.id}')">🧾 領収書</button>`
            :`<button class="btn btn-primary btn-xs" onclick="requestPayment('${p.id}')">📧 請求</button>`}
          <button class="btn btn-ghost btn-xs" onclick="openAdhocInvoiceModal('${p.id}')">🧾 都度</button>
        </div>
      </td>
    </tr>`;
  }).join('');

  return`<div class="pg-head flex justify-between items-center" style="flex-wrap:wrap;gap:10px">
    <div><div class="pg-title">月謝管理</div><div class="pg-sub">${sanitize(_myTeam.name,20)} · ${new Date().toLocaleDateString('ja-JP',{year:'numeric',month:'long'})}</div></div>
    <div class="flex gap-8 flex-wrap">
      <button class="btn btn-secondary btn-sm" onclick="exportFeeCSV()">⬇️ CSV</button>
      <button class="btn btn-secondary btn-sm" onclick="exportReceiptPDF()"><i class="fa fa-file-pdf" style="color:#ef4444"></i> 領収書PDF</button>
      <button class="btn btn-primary btn-sm" onclick="bulkRequest()">📧 一括請求</button>
      <button class="btn btn-secondary btn-sm" onclick="openAdhocInvoiceModal()">🧾 都度請求</button>
      <button class="btn btn-secondary btn-sm" onclick="openSubscriptionSetup()">💳 定期課金</button>
      <button class="btn btn-secondary btn-sm" onclick="openAutoInvoiceSettings()">📄 自動請求書</button>
      <button class="btn btn-secondary btn-sm" onclick="generateMonthlyInvoices()">🖨️ 請求書一括</button>
      ${_myTeam.stripeSetupNeeded===false?'':`<button class="btn btn-ghost btn-sm" onclick="openStripeSetup()">⚡ Stripe設定</button>`}
    </div>
  </div>

  <!-- KPIカード -->
  <div class="stat-row" style="grid-template-columns:repeat(4,1fr);margin-bottom:16px">
    <div class="stat-box" style="border-left:3px solid var(--teal)">
      <div class="stat-ico" style="color:var(--teal)">✅</div>
      <div class="stat-n">${paid}</div>
      <div class="stat-l">今月支払済</div>
    </div>
    <div class="stat-box" style="border-left:3px solid var(--red)">
      <div class="stat-ico" style="color:var(--red)">⏰</div>
      <div class="stat-n" style="color:${unpaid>0?'var(--red)':'inherit'}">${unpaid}</div>
      <div class="stat-l">未払い</div>
    </div>
    <div class="stat-box" style="border-left:3px solid var(--org)">
      <div class="stat-ico" style="color:var(--org)">💴</div>
      <div class="stat-n">¥${fmtNum(tot)}</div>
      <div class="stat-l">今月累計</div>
    </div>
    <div class="stat-box" style="border-left:3px solid var(--blue)">
      <div class="stat-ico" style="color:var(--blue)">📈</div>
      <div class="stat-n" style="color:${collectRate>=80?'var(--teal)':collectRate>=50?'var(--yel)':'var(--red)'}">${collectRate}%</div>
      <div class="stat-l">回収率</div>
      <div style="margin-top:8px;height:6px;background:var(--b1);border-radius:3px;overflow:hidden"><div style="width:${collectRate}%;height:100%;background:${collectRate>=80?'var(--teal)':collectRate>=50?'var(--yel)':'var(--red)'};border-radius:3px;transition:width .6s"></div></div>
    </div>
  </div>

  <!-- グラフエリア -->
  <div class="dash-grid dash-grid-2" style="margin-bottom:16px">
    <div class="card" style="padding:16px">
      <div class="fw7 mb-10" style="font-size:14px">📊 月次回収推移（6ヶ月）</div>
      <div style="height:160px;position:relative"><div class="skel-overlay"><div class="skel" style="height:100%;border-radius:8px"></div></div><canvas id="fee-monthly-chart"></canvas></div>
    </div>
    <div class="card" style="padding:16px">
      <div class="fw7 mb-10" style="font-size:14px">🥧 今月の状況</div>
      <div style="height:160px;position:relative"><div class="skel-overlay"><div class="skel" style="height:100%;border-radius:8px"></div></div><canvas id="fee-donut-chart"></canvas></div>
    </div>
  </div>

  <!-- 選手別テーブル -->
  <div class="card" style="padding:0">
    <div class="flex justify-between items-center" style="padding:16px 18px;border-bottom:1.5px solid var(--bdr)">
      <div class="fw7" style="font-size:14px">👥 選手別月謝状況（${pls.length}名）</div>
      <div class="flex gap-8">
        <button class="btn btn-ghost btn-xs" onclick="openM('⏰ リマインダー設定',reminderForm('${_myTeam.id}'))">⏰ リマインダー設定</button>
      </div>
    </div>
    <div style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="background:var(--surf2)">
          <th style="padding:8px 12px;text-align:left;font-size:12px;color:var(--txt3)">選手</th>
          <th style="padding:8px 12px;text-align:left;font-size:12px;color:var(--txt3)">状況</th>
          <th style="padding:8px 12px;text-align:right;font-size:12px;color:var(--txt3)">月謝</th>
          <th style="padding:8px 12px;text-align:center;font-size:12px;color:var(--txt3)">最終支払日</th>
          <th style="padding:8px 12px;font-size:12px;color:var(--txt3)">アクション</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    ${pls.length===0?'<div class="text-center text-muted" style="padding:30px">まだ選手が登録されていません</div>':''}
  </div>

  <!-- 都度請求一覧 -->
  ${(()=>{
    if(!DB.adhocInvoices)DB.adhocInvoices=[];
    const adhocs=_dbArr('adhocInvoices').filter(i=>i.teamId===_myTeam.id);
    if(!adhocs.length) return '';
    const adhocUnpaid=adhocs.filter(i=>i.status==='unpaid');
    const adhocPaid=adhocs.filter(i=>i.status==='paid');
    return `<div class="card" style="padding:0;margin-top:16px">
      <div class="flex justify-between items-center" style="padding:14px 16px;border-bottom:1px solid var(--bdr)">
        <div class="fw7 text-sm">🧾 都度請求一覧（${adhocs.length}件）
          ${adhocUnpaid.length?`<span class="badge b-org" style="margin-left:6px">${adhocUnpaid.length}件未払い</span>`:''}
        </div>
        <button class="btn btn-primary btn-xs" onclick="openAdhocInvoiceModal()">+ 新規</button>
      </div>
      <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse">
          <thead><tr style="background:var(--surf2)">
            <th style="padding:8px 12px;text-align:left;font-size:12px;color:var(--txt3)">件名</th>
            <th style="padding:8px 12px;text-align:left;font-size:12px;color:var(--txt3)">対象</th>
            <th style="padding:8px 12px;text-align:right;font-size:12px;color:var(--txt3)">金額</th>
            <th style="padding:8px 12px;text-align:right;font-size:12px;color:var(--txt3)">手数料5%</th>
            <th style="padding:8px 12px;text-align:center;font-size:12px;color:var(--txt3)">状況</th>
            <th style="padding:8px 12px;font-size:12px;color:var(--txt3)">日時</th>
          </tr></thead>
          <tbody>${adhocs.slice().reverse().map(inv=>`<tr>
            <td style="padding:10px 12px"><div class="fw7 text-sm">${sanitize(inv.title,30)}</div>${inv.note?`<div class="text-xs text-muted">${sanitize(inv.note,30)}</div>`:''}</td>
            <td style="padding:10px 12px" class="text-sm">${sanitize(inv.playerName||'--',16)}</td>
            <td style="padding:10px 12px;text-align:right;font-weight:700">¥${fmtNum(inv.total)}</td>
            <td style="padding:10px 12px;text-align:right;font-size:12px;color:var(--txt3)">¥${fmtNum(inv.fee)}</td>
            <td style="padding:10px 12px;text-align:center">${inv.status==='paid'?'<span class="badge b-teal">支払済</span>':'<span class="badge b-org">未払い</span>'}</td>
            <td style="padding:10px 12px;font-size:11px;color:var(--txt3)">${(inv.status==='paid'?inv.paidAt:inv.createdAt||'').slice(0,10)}</td>
          </tr>`).join('')}</tbody>
        </table>
      </div>
    </div>`;
  })()}`;
}

function reminderForm(teamId){
  const t=DB.teams.find(x=>x.id===teamId);
  const current=t?.reminderDays||7;
  return`<div style="display:grid;gap:14px">
    <div class="form-group">
      <label class="label">督促タイミング</label>
      <select id="rem-days" class="input">
        <option value="3" ${current===3?'selected':''}>支払期限3日前</option>
        <option value="7" ${current===7?'selected':''}>支払期限7日前</option>
        <option value="14" ${current===14?'selected':''}>支払期限14日前</option>
        <option value="0">手動のみ（自動なし）</option>
      </select>
    </div>
    <div class="form-group">
      <label class="label">督促メッセージ</label>
      <textarea id="rem-msg" class="input" rows="3" maxlength="200" style="resize:vertical" placeholder="月謝のお支払いをお願いします。">${t?.reminderMsg||'月謝のお支払い期限が近づいています。マイページからお手続きください。'}</textarea>
    </div>
    <div style="padding:12px;background:rgba(0,207,170,.06);border-radius:8px;font-size:12px;color:var(--teal)">
      <i class="fa fa-circle-info"></i> 設定後、未払い選手の保護者にチャット経由で自動通知します
    </div>
    <button class="btn btn-primary w-full" onclick="saveReminder('${teamId}')">💾 保存</button>
  </div>`;
}
function saveReminder(teamId){
  const t=DB.teams.find(x=>x.id===teamId);if(!t)return;
  const days=parseInt(document.getElementById('rem-days')?.value||'7');
  const msg=(document.getElementById('rem-msg')?.value||'').trim();
  t.reminderDays=days;
  t.reminderMsg=sanitize(msg,200);
  saveDB();closeM();toast('リマインダー設定を保存しました','s');
}
function requestPayment(pid){
  const p=DB.players.find(x=>x.id===pid);
  const t=getMyTeam();
  if(!p||!t)return;
  addNotif(`${p.name}さんへ月謝請求を送りました（¥${fmtNum(t.fee||0)}）`,'fa-yen-sign','fee');
  toast(`${p.name}に請求を送信しました`,'s');
}

// ====== 都度請求（アドホック請求）======
function openAdhocInvoiceModal(prePlayerId){
  const t=getMyTeam();if(!t)return;
  if(!DB.adhocInvoices)DB.adhocInvoices=[];
  const pls=DB.players.filter(p=>p.team===t.id);
  if(!pls.length){toast('選手（保護者）が登録されていません','e');return;}
  const playerOpts=pls.map(p=>`<option value="${p.id}" ${p.id===prePlayerId?'selected':''}>${sanitize(p.name,20)}${p.guardian?' ('+sanitize(p.guardian,10)+')':''}</option>`).join('');
  openM('🧾 都度請求を作成',`<div style="display:grid;gap:14px">
    <div style="background:rgba(14,165,233,.08);border:1px solid rgba(14,165,233,.2);border-radius:10px;padding:10px 12px;font-size:12px;color:var(--txt2)">
      グッズ・用品・イベント費用等の都度請求を保護者へ送信します。<br>
      <span style="color:var(--txt3);font-size:11px">事務手数料（${getFeeRate(t.id,'adhocFee')}%）は事務局に自動計上されます。</span>
    </div>
    <div class="form-group"><label class="label">請求先</label>
      <select id="adhoc-target" class="input" ${prePlayerId?'':''}>${prePlayerId?playerOpts:`<option value="all">全員に一括送信</option>${playerOpts}`}</select>
    </div>
    <div class="form-group"><label class="label">件名 *</label>
      <input id="adhoc-title" class="input" placeholder="例：ユニフォーム購入費、合宿参加費" maxlength="60">
    </div>
    <div class="form-group"><label class="label">金額（円）*</label>
      <input id="adhoc-amount" class="input" type="number" placeholder="3000" min="100" max="9999999" oninput="updateAdhocPreview()">
    </div>
    <div id="adhoc-preview" style="display:none;background:var(--surf2);border-radius:10px;padding:12px;font-size:13px">
      <div style="display:flex;justify-content:space-between;padding:3px 0"><span style="color:var(--txt3)">請求金額</span><b id="adhoc-pv-amt">-</b></div>
      <div style="display:flex;justify-content:space-between;padding:3px 0"><span style="color:var(--txt3)">事務手数料（<span id="adhoc-pv-rate">${getFeeRate(t.id,'adhocFee')}</span>%）</span><span id="adhoc-pv-fee" style="color:var(--txt3)">-</span></div>
      <div style="border-top:1px solid var(--bdr);margin:4px 0"></div>
      <div style="display:flex;justify-content:space-between;padding:3px 0"><span style="font-weight:700">保護者お支払額</span><b id="adhoc-pv-total" style="color:var(--org)">-</b></div>
    </div>
    <div class="form-group"><label class="label">備考（任意）</label>
      <input id="adhoc-note" class="input" placeholder="例：サイズはL、3/1までにお願いします" maxlength="120">
    </div>
    <button class="btn btn-primary w-full" onclick="createAdhocInvoice()">📩 請求を送信する</button>
  </div>`);
}

function updateAdhocPreview(){
  const amt=parseInt(document.getElementById('adhoc-amount')?.value)||0;
  const pv=document.getElementById('adhoc-preview');
  if(!pv)return;
  if(amt<100){pv.style.display='none';return;}
  pv.style.display='block';
  const fee=getFeeAmount(amt,getMyTeam()?.id||'','adhocFee');
  const total=amt+fee;
  document.getElementById('adhoc-pv-amt').textContent='¥'+amt.toLocaleString();
  document.getElementById('adhoc-pv-fee').textContent='¥'+fee.toLocaleString();
  document.getElementById('adhoc-pv-total').textContent='¥'+total.toLocaleString();
}

function createAdhocInvoice(){
  const t=getMyTeam();if(!t)return;
  if(!DB.adhocInvoices)DB.adhocInvoices=[];
  const target=document.getElementById('adhoc-target')?.value;
  const title=(document.getElementById('adhoc-title')?.value||'').trim();
  const amount=parseInt(document.getElementById('adhoc-amount')?.value)||0;
  const note=(document.getElementById('adhoc-note')?.value||'').trim();
  if(!title){toast('件名を入力してください','e');return;}
  if(amount<100){toast('金額は100円以上で入力してください','e');return;}
  if(amount>9999999){toast('金額が上限を超えています','e');return;}
  const fee=getFeeAmount(amount,t.id,'adhocFee');
  const total=amount+fee;
  const pls=target==='all'?DB.players.filter(p=>p.team===t.id):[DB.players.find(p=>p.id===target)].filter(Boolean);
  if(!pls.length){toast('請求先が見つかりません','e');return;}
  const now=new Date().toISOString();
  pls.forEach(p=>{
    _dbArr('adhocInvoices').push({
      id:'adh'+Date.now()+Math.random().toString(36).slice(2,6),
      teamId:t.id, teamName:t.name||'',
      playerId:p.id, playerName:p.name||'',
      guardianId:p.guardianId||'', guardianName:p.guardian||'',
      title:sanitize(title,60),
      amount, fee, total,
      note:sanitize(note,120),
      status:'unpaid',
      createdAt:now, paidAt:null
    });
  });
  saveDB();closeM();
  toast(`${pls.length}件の都度請求を送信しました`,'s');
  addNotif(`都度請求「${title}」を${pls.length}名に送信（¥${fmtNum(total)}/件）`,'fa-receipt','fee');
  // 各選手/保護者に通知
  pls.forEach(p => {
    const targetId = p.guardianId || p.id;
    addNotif(`📄 都度請求「${sanitize(title,20)}」が届きました（¥${fmtNum(total)}）`, 'fa-receipt', 'parent-fee', targetId);
  });
  goTo(curPage);
}

function payAdhocInvoice(invId,btnEl){
  if(!DB.adhocInvoices)return;
  const inv=_dbArr('adhocInvoices').find(i=>i.id===invId);
  if(!inv){toast('請求が見つかりません','e');return;}
  openM('💳 お支払い確認',`<div style="text-align:center;padding:8px 0">
    <div style="font-size:38px;margin-bottom:10px">🧾</div>
    <div style="font-size:14px;font-weight:700;margin-bottom:4px">${sanitize(inv.title,40)}</div>
    <div style="font-size:12px;color:var(--txt3);margin-bottom:14px">${inv.teamName||'チーム'}</div>
    <div style="font-size:12px;color:var(--txt3);margin-bottom:4px">商品代金 ¥${fmtNum(inv.amount)}＋事務手数料 ¥${fmtNum(inv.fee)}</div>
    <div style="font-size:32px;font-weight:900;color:var(--org);font-family:Montserrat,sans-serif;margin:10px 0">¥${fmtNum(inv.total)}</div>
    ${inv.note?`<div style="font-size:11px;color:var(--txt3);margin-bottom:14px;background:var(--surf2);border-radius:8px;padding:8px">📝 ${sanitize(inv.note,100)}</div>`:''}
    <div style="display:flex;gap:10px;justify-content:center;margin-top:12px">
      <button class="btn btn-primary" onclick="confirmAdhocPayment('${inv.id}')">🔒 支払う</button>
      <button class="btn btn-ghost" onclick="closeM()">キャンセル</button>
    </div>
  </div>`);
}

async function confirmAdhocPayment(invId){
  if(!DB.adhocInvoices)return;
  const inv=_dbArr('adhocInvoices').find(i=>i.id===invId);
  if(!inv){toast('請求が見つかりません','e');return;}

  const btn=document.querySelector('#overlay .btn-primary');
  if(btn){btn.disabled=true;btn.innerHTML='⏳ Stripeに接続中...';}

  // Stripe本番モード
  if(typeof API_BASE !== 'undefined' && API_BASE && !API_BASE.includes('localhost') && !API_BASE.includes('127.0.0.1')){
    try {
      const res=await fetch(`${API_BASE}/create-adhoc-payment-session`,{
        method:'POST',headers:await _apiHeaders(),
        body:JSON.stringify({
          title:inv.title||'都度請求',
          amount:inv.amount,
          invoiceId:inv.id,
          teamId:inv.teamId||'',
          playerId:inv.playerId||'',
          feeRate:getFeeRate(inv.teamId,'adhocFee')
        }),
      });
      if(!res.ok)throw new Error((await res.json().catch(()=>({}))).error||`HTTP ${res.status}`);
      const data=await res.json();
      if(!data.sessionUrl)throw new Error('決済URLが取得できませんでした');
      toast('Stripeの決済画面に移動します...','i');
      setTimeout(()=>{if(data.sessionUrl&&data.sessionUrl.startsWith('https://checkout.stripe.com'))window.open(data.sessionUrl,'_blank');else toast('不正なURLです','e');},400);
      closeM();
      return;
    } catch(err){
      if(btn){btn.disabled=false;btn.innerHTML='🔒 支払う';}
      toast('決済処理に失敗しました','e');
      return;
    }
  }

  // デモ・開発モード（Stripe未接続時）
  inv.status='paid';
  inv.paidAt=new Date().toISOString();
  saveDB();closeM();
  toast('お支払いが完了しました','s');
  addNotif(`「${inv.title}」¥${fmtNum(inv.total)}の支払いが完了しました`,'fa-check-circle','fee');
  goTo(curPage);
}

function getAdhocStats(teamId){
  if(!DB.adhocInvoices)DB.adhocInvoices=[];
  const invs=_dbArr('adhocInvoices').filter(i=>i.teamId===teamId);
  const paid=invs.filter(i=>i.status==='paid');
  const unpaid=invs.filter(i=>i.status==='unpaid');
  return{
    total:invs.length,
    paidCount:paid.length,unpaidCount:unpaid.length,
    paidAmount:paid.reduce((s,i)=>s+i.total,0),
    unpaidAmount:unpaid.reduce((s,i)=>s+i.total,0),
    feeTotal:paid.reduce((s,i)=>s+i.fee,0)
  };
}

function exportPlayerReceiptPDF(pid,teamId){
  const p=DB.players.find(x=>x.id===pid);
  const t=DB.teams.find(x=>x.id===teamId);
  if(!p||!t){toast('データが見つかりません','e');return;}
  const pay=_dbArr('payments').filter(x=>x.player===pid&&x.status==='paid').sort((a,b)=>b.createdAt>a.createdAt?1:-1)[0];
  if(!pay){toast('支払い済みデータがありません','e');return;}
  const {jsPDF}=window.jspdf;
  const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
  const W=210,M=20;
  doc.setFillColor(14,30,50);doc.rect(0,0,W,22,'F');
  doc.setTextColor(255,107,43);doc.setFontSize(18);doc.setFont('helvetica','bold');
  doc.text('RECEIPT',M,14);
  doc.setTextColor(255,255,255);doc.setFontSize(9);doc.setFont('helvetica','normal');
  doc.text('MyCOACH-MyTEAM',W-M,14,{align:'right'});
  doc.setTextColor(30,30,30);
  let y=36;
  doc.setFillColor(248,249,250);doc.rect(M,y-6,W-M*2,52,'F');
  doc.setFontSize(11);doc.setFont('helvetica','bold');doc.text('Receipt Details',M+4,y+2);
  const items=[['No.',`RCP-${pay.id.slice(-8).toUpperCase()}`],['Date',pay.paidAt||new Date().toLocaleDateString()],['Player',p.name],['Team',t.name],['Month',pay.month||curMonth()]];
  doc.setFont('helvetica','normal');doc.setFontSize(10);
  items.forEach(([k,v],i)=>{doc.setTextColor(120,120,120);doc.text(k,M+4,y+10+i*7);doc.setTextColor(30,30,30);doc.text(String(v),M+50,y+10+i*7);});
  y+=60;
  doc.setFillColor(255,107,43);doc.rect(M,y,W-M*2,18,'F');
  doc.setTextColor(255,255,255);doc.setFontSize(10);doc.setFont('helvetica','bold');
  doc.text('Amount',M+4,y+7);doc.setFontSize(16);
  doc.text('¥'+Number(pay.amount||t.fee||0).toLocaleString(),W-M-4,y+12,{align:'right'});
  y+=26;doc.setFont('helvetica','normal');doc.setFontSize(9);doc.setTextColor(150,150,150);
  doc.text('Thank you for your payment. - MyCOACH-MyTEAM',M,y+6);
  doc.setFontSize(7);doc.setTextColor(180,180,180);
  doc.text('* This is a payment confirmation issued by MyCOACH-MyTEAM platform.',M,y+12);
  doc.text('* This document is not a qualified invoice (適格請求書) under Japanese tax law.',M,y+16);
  doc.text('* For tax purposes, please consult your tax advisor.',M,y+20);
  doc.save(`receipt_${p.name}_${pay.month||'latest'}.pdf`);
  toast('領収書PDFを出力しました','s');
}

// 自分に見えるイベントを返す（チーム共有 + 個人）
function _getVisibleEvents(){
  const u=DB.currentUser;if(!u)return DB.events||[];
  const r=u.role;
  if(r==='admin') return DB.events||[];
  const myTeamIds=_getMyTeamIds();
  const myId=u.id;
  return (DB.events||[]).filter(e=>{
    // チームが作成したチームスコープのイベント → チーム所属者全員に見える
    if(e.scope==='team' && e.teamId && myTeamIds.includes(e.teamId)) return true;
    // 自分が作成した個人イベント
    if(e.createdBy===myId) return true;
    // レガシー（scope無し）：自分が作成 or チーム一致
    if(!e.scope && !e.teamId) return e.createdBy===myId || !e.createdBy;
    if(!e.scope && e.teamId && myTeamIds.includes(e.teamId)) return true;
    return false;
  });
}

function calPage(){
  return calView==='week' ? _calWeekView() : _calMonthView();
}

function _calMonthView(){
  const today=new Date();
  const tgt=new Date(today.getFullYear(), today.getMonth()+calOffset, 1);
  const y=tgt.getFullYear(), m=tgt.getMonth(), d=today.getDate();
  const days=new Date(y,m+1,0).getDate(), first=new Date(y,m,1).getDay();
  const mns=['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
  const visibleEvents=_getVisibleEvents();
  let cells='';
  for(let i=0;i<first;i++) cells+=`<div class="cal-day other-month"></div>`;
  for(let x=1;x<=days;x++){
    const isT=calOffset===0&&x===d;
    const dayEvs=visibleEvents.filter(e=>{
      if(e.year&&e.month!==undefined){ return e.year===y&&e.month===m&&e.date===x; }
      return e.date===x; // 旧形式
    });
    const evDots=dayEvs.slice(0,3).map(e=>{
      const evC={practice:'var(--teal)',match:'var(--org)',payment:'var(--yel)',event:'var(--blue)',meeting:'var(--grn)',other:'var(--blue)'}[e.type]||'var(--blue)';
      return `<div style="width:6px;height:6px;border-radius:50%;background:${evC}"></div>`;
    }).join('');
    cells+=`<div class="cal-day ${isT?'today':''} ${dayEvs.length?'has-event':''}" onclick="showDayEvt(${x},${y},${m})" style="flex-direction:column;gap:2px">
      <span>${x}</span>
      ${evDots?`<div style="display:flex;gap:2px;flex-wrap:wrap;justify-content:center">${evDots}</div>`:''}
    </div>`;
  }
  // 今日のイベント件数
  const todayEvCount = visibleEvents.filter(e=>{const ey=e.year||new Date().getFullYear(),em=e.month!==undefined?e.month:new Date().getMonth();return ey===new Date().getFullYear()&&em===new Date().getMonth()&&e.date===new Date().getDate();}).length;
  return`<div class="pg-head flex justify-between items-center" style="flex-wrap:wrap;gap:10px">
    <div><div class="pg-title">スケジュール</div><div class="pg-sub">${y}年 ${mns[m]}${todayEvCount>0?` <span style="font-size:11px;background:var(--org);color:#fff;border-radius:10px;padding:1px 8px;margin-left:6px">今日 ${todayEvCount}件</span>`:''}</div></div>
    <div class="flex gap-8 items-center flex-wrap">
      <div class="flex" style="background:var(--surf2);border-radius:8px;padding:3px">
        <button onclick="calView='month';calOffset=0;goTo('calendar')" class="btn btn-xs" style="${calView==='month'?'background:var(--org);color:#fff;':'background:transparent;color:var(--txt2);'}border-radius:6px;padding:4px 10px">月</button>
        <button onclick="calView='week';calOffset=0;goTo('calendar')" class="btn btn-xs" style="${calView==='week'?'background:var(--org);color:#fff;':'background:transparent;color:var(--txt2);'}border-radius:6px;padding:4px 10px">週</button>
      </div>
      <button class="btn btn-ghost btn-sm" onclick="calOffset--;goTo('calendar')">‹</button>
      <button class="btn btn-ghost btn-sm" onclick="calOffset=0;goTo('calendar')">今月</button>
      <button class="btn btn-ghost btn-sm" onclick="calOffset++;goTo('calendar')">›</button>
      <button class="btn btn-ghost btn-sm" onclick="openMatchHistoryModal()">⚽ 戦績</button>
      <button class="btn btn-primary btn-sm" onclick="openEventModal()">+ イベント追加</button>
      <button class="btn btn-ghost btn-sm" onclick="exportAllEventsToICS()">📅 .ics出力</button>
    </div>
  </div>
  <div class="cal-wrap">
    <div class="card">
      <div class="cal-header-row mb-4">${['日','月','火','水','木','金','土'].map(x=>`<span>${x}</span>`).join('')}</div>
      <div class="cal-grid">${cells}</div>
    </div>
    <div>
      ${_renderEventList(y,m)}
    </div>
  </div>`;
}

function _calWeekView(){
  const today=new Date();
  const weekStart=new Date(today);
  weekStart.setDate(today.getDate()-today.getDay()+calOffset*7);
  const mns=['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
  const days=['日','月','火','水','木','金','土'];
  const visibleEvents=_getVisibleEvents();
  let cols='';
  for(let i=0;i<7;i++){
    const d=new Date(weekStart);d.setDate(weekStart.getDate()+i);
    const isT=d.toDateString()===today.toDateString();
    const dayEvs=visibleEvents.filter(e=>{
      const ey=e.year||today.getFullYear(),em=e.month!==undefined?e.month:today.getMonth();
      return ey===d.getFullYear()&&em===d.getMonth()&&e.date===d.getDate();
    });
    cols+=`<div style="flex:1;min-width:0">
      <div style="text-align:center;padding:6px;border-radius:8px;margin-bottom:6px;${isT?'background:var(--org);color:#fff;font-weight:700':''}">
        <div class="text-xs">${days[d.getDay()]}</div>
        <div style="font-size:18px;font-weight:700">${d.getDate()}</div>
      </div>
      ${dayEvs.map(e=>{
        const evC={practice:'var(--teal)',match:'var(--org)',payment:'var(--yel)',event:'var(--blue)',meeting:'var(--grn)'}[e.type]||'var(--blue)';
      const hasResult=e.matchResult&&e.matchResult.homeScore!==undefined;
      const matchBtn=e.type==='match'?('<button onclick="event.stopPropagation();openMatchResultModal(\''+e.id+'\')' + '" style="font-size:9px;padding:2px 6px;border-radius:4px;border:1px solid '+(hasResult?'var(--teal)':'var(--org)')+';background:'+(hasResult?'rgba(0,207,170,.08)':'rgba(249,115,22,.08)')+';color:'+(hasResult?'var(--teal)':'var(--org)')+';cursor:pointer;flex-shrink:0">'+(hasResult?(e.matchResult.homeScore+'-'+e.matchResult.awayScore):'結果入力')+'</button>'):'';
        return `<div onclick="showDayEvt(${d.getDate()},${d.getFullYear()},${d.getMonth()})" style="background:${evC}15;border-left:3px solid ${evC};border-radius:0 6px 6px 0;padding:5px 8px;margin-bottom:4px;cursor:pointer">
          <div style="display:flex;align-items:center;gap:4px"><div style="font-size:11px;font-weight:600;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${sanitize(e.title,20)}</div>${matchBtn}</div>
          <div style="font-size:10px;color:var(--txt3)">${e.time||''}</div>
        </div>`;
      }).join('')||`<div style="height:4px"></div>`}
    </div>`;
  }
  const ws=weekStart, we=new Date(weekStart);we.setDate(we.getDate()+6);
  const y=weekStart.getFullYear(),m=weekStart.getMonth();
  return`<div class="pg-head flex justify-between items-center" style="flex-wrap:wrap;gap:10px">
    <div><div class="pg-title">スケジュール</div><div class="pg-sub">${ws.getMonth()+1}/${ws.getDate()} – ${we.getMonth()+1}/${we.getDate()}</div></div>
    <div class="flex gap-8 items-center flex-wrap">
      <div class="flex" style="background:var(--surf2);border-radius:8px;padding:3px">
        <button onclick="calView='month';calOffset=0;goTo('calendar')" class="btn btn-xs" style="${calView==='month'?'background:var(--org);color:#fff;':'background:transparent;color:var(--txt2);'}border-radius:6px;padding:4px 10px">月</button>
        <button onclick="calView='week';calOffset=0;goTo('calendar')" class="btn btn-xs" style="${calView==='week'?'background:var(--org);color:#fff;':'background:transparent;color:var(--txt2);'}border-radius:6px;padding:4px 10px">週</button>
      </div>
      <button class="btn btn-ghost btn-sm" onclick="calOffset--;goTo('calendar')">‹</button>
      <button class="btn btn-ghost btn-sm" onclick="calOffset=0;goTo('calendar')">今週</button>
      <button class="btn btn-ghost btn-sm" onclick="calOffset++;goTo('calendar')">›</button>
      <button class="btn btn-ghost btn-sm" onclick="openMatchHistoryModal()">⚽ 戦績</button>
      <button class="btn btn-ghost btn-sm" onclick="exportAllEventsToICS()">📅 .ics出力</button>
      <button class="btn btn-primary btn-sm" onclick="openEventModal()">+ イベント追加</button>
    </div>
  </div>
  <div class="card">
    <div style="display:flex;gap:8px">${cols}</div>
  </div>
  <div>${_renderEventList(y,m)}</div>`;
}

function _renderEventList(y,m){
  const evs=_getVisibleEvents().filter(e=>{
    const ey=e.year||new Date().getFullYear(),em=e.month!==undefined?e.month:new Date().getMonth();
    return ey===y&&em===m;
  }).sort((a,b)=>a.date-b.date);
  if(!evs.length) return `<div class="card text-center" style="padding:24px">
    <div style="font-size:30px;margin-bottom:8px">📅</div>
    <div class="text-sm fw7" style="margin-bottom:4px">この月の予定はありません</div>
    <div class="text-xs text-muted" style="margin-bottom:12px">右上の「+ イベント追加」から練習・試合を登録しましょう</div>
    <button class="btn btn-primary btn-sm" onclick="openEventModal()">+ 予定を追加する</button>
  </div>`;
  const icons={practice:'🏃',match:'⚽',payment:'💰',event:'🎉',meeting:'📋',other:'📌'};
  const bcs={practice:'b-teal',match:'b-org',payment:'b-yel',event:'b-blue',meeting:'b-green',other:'b-gray'};
  const lbls={practice:'練習',match:'試合',payment:'支払',event:'イベント',meeting:'MTG',other:'その他'};
  const myId=DB.currentUser?.id;
  return evs.map(e=>{
    const isTeamEvent=e.scope==='team';
    const isMine=e.createdBy===myId;
    const teamName=isTeamEvent?DB.teams.find(t=>t.id===e.teamId)?.name||'チーム':'';
    return `<div class="card card-sm mb-10">
    <div class="flex gap-10 items-center">
      <div style="font-size:22px;width:36px;text-align:center">${icons[e.type]||'📌'}</div>
      <div style="flex:1">
        <div class="fw7 text-sm">${sanitize(e.title,40)}</div>
        <div class="text-xs text-muted">${y}/${String(m+1).padStart(2,'0')}/${String(e.date).padStart(2,'0')} ${e.time||''} ${e.repeat&&e.repeat!=='none'?`<span class="badge b-gray" style="font-size:9px">🔁 ${{'weekly':'毎週','monthly':'毎月','daily':'毎日'}[e.repeat]||''}</span>`:''}</div>
        ${e.place?`<div class="text-xs text-muted mt-4">📍 ${sanitize(e.place,40)}</div>`:''}
        ${e.note?`<div class="text-xs text-muted mt-4">${sanitize(e.note,60)}</div>`:''}
        ${isTeamEvent?`<div class="text-xs mt-4" style="color:var(--blue)">🏟️ ${sanitize(teamName,20)} のチーム予定</div>`:''}
      </div>
      <div class="flex items-center gap-8">
        <span class="badge ${bcs[e.type]||'b-gray'}">${lbls[e.type]||e.type}</span>
        ${(DB.currentUser?.role==='team'||DB.currentUser?.role==='admin')?`<button class="btn btn-ghost btn-xs" onclick="event.stopPropagation();openAttendanceModal('${e.id}')" title="出欠管理" style="font-size:11px">📋</button>`:''}
        ${isMine||DB.currentUser?.role==='admin'?`<button class="btn btn-ghost btn-xs" onclick="deleteEvent('${e.id}')" style="color:var(--red);font-size:11px" title="削除">&times;</button>`:''}
      </div>
    </div>
  </div>`;}).join('');
}

// ── Googleカレンダー連携 ──────────────────
function exportEventToICS(eventId){
  const ev = DB.events.find(e => e.id === eventId);
  if(!ev){ toast('イベントが見つかりません','e'); return; }
  
  const y = ev.year || new Date().getFullYear();
  const m = ev.month !== undefined ? ev.month : new Date().getMonth();
  const d = ev.date || 1;
  const dateStr = `${y}${String(m+1).padStart(2,'0')}${String(d).padStart(2,'0')}`;
  
  // 時間パース
  let dtStart, dtEnd;
  if(ev.time){
    const [h,mi] = ev.time.split(':').map(Number);
    dtStart = `${dateStr}T${String(h).padStart(2,'0')}${String(mi||0).padStart(2,'0')}00`;
    const endH = h + 1; // デフォルト1時間
    dtEnd = `${dateStr}T${String(endH).padStart(2,'0')}${String(mi||0).padStart(2,'0')}00`;
  } else {
    dtStart = dateStr;
    dtEnd = dateStr;
  }
  
  const team = DB.teams.find(t => t.id === ev.teamId);
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MyCOACH-MyTEAM//JP',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${(ev.title||'イベント').replace(/[,;\\]/g,' ')}`,
    `DESCRIPTION:${(ev.note||'').replace(/\n/g,'\\n').replace(/[,;\\]/g,' ')}${team?' ('+team.name+')':''}`,
    ev.place ? `LOCATION:${ev.place.replace(/[,;\\]/g,' ')}` : '',
    `UID:${ev.id}@mycoach-myteam`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').split('.')[0]}Z`,
    ev.repeat === 'weekly' ? 'RRULE:FREQ=WEEKLY' :
    ev.repeat === 'monthly' ? 'RRULE:FREQ=MONTHLY' :
    ev.repeat === 'daily' ? 'RRULE:FREQ=DAILY' : '',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean).join('\r\n');
  
  const blob = new Blob([ics], {type:'text/calendar;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = (ev.title||'event').replace(/[^a-zA-Z0-9ぁ-んァ-ヶ一-龥]/g,'_') + '.ics';
  a.click();
  URL.revokeObjectURL(a.href);
  toast('📅 .icsファイルをダウンロードしました','s');
}

function addToGoogleCalendar(eventId){
  const ev = DB.events.find(e => e.id === eventId);
  if(!ev) return;
  
  const y = ev.year || new Date().getFullYear();
  const m = ev.month !== undefined ? ev.month : new Date().getMonth();
  const d = ev.date || 1;
  const dateStr = `${y}${String(m+1).padStart(2,'0')}${String(d).padStart(2,'0')}`;
  
  let dates;
  if(ev.time){
    const [h,mi] = ev.time.split(':').map(Number);
    const start = `${dateStr}T${String(h).padStart(2,'0')}${String(mi||0).padStart(2,'0')}00`;
    const endH = h + 1;
    const end = `${dateStr}T${String(endH).padStart(2,'0')}${String(mi||0).padStart(2,'0')}00`;
    dates = `${start}/${end}`;
  } else {
    dates = `${dateStr}/${dateStr}`;
  }
  
  const team = DB.teams.find(t => t.id === ev.teamId);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: ev.title || 'イベント',
    dates: dates,
    details: (ev.note||'') + (team ? '\n' + team.name : ''),
    location: ev.place || '',
  });
  
  window.open('https://calendar.google.com/calendar/render?' + params.toString(), '_blank');
  toast('📅 Googleカレンダーに追加します','s');
}

function exportAllEventsToICS(){
  const visibleEvents = _getVisibleEvents();
  if(!visibleEvents.length){ toast('エクスポートするイベントがありません','i'); return; }
  
  let ics = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//MyCOACH-MyTEAM//JP\r\nCALSCALE:GREGORIAN\r\n';
  
  visibleEvents.forEach(ev => {
    const y = ev.year || new Date().getFullYear();
    const m = ev.month !== undefined ? ev.month : new Date().getMonth();
    const d = ev.date || 1;
    const dateStr = `${y}${String(m+1).padStart(2,'0')}${String(d).padStart(2,'0')}`;
    
    let dtStart, dtEnd;
    if(ev.time){
      const [h,mi] = (ev.time||'00:00').split(':').map(Number);
      dtStart = `${dateStr}T${String(h).padStart(2,'0')}${String(mi||0).padStart(2,'0')}00`;
      dtEnd = `${dateStr}T${String(h+1).padStart(2,'0')}${String(mi||0).padStart(2,'0')}00`;
    } else {
      dtStart = dateStr;
      dtEnd = dateStr;
    }
    
    ics += 'BEGIN:VEVENT\r\n';
    ics += `DTSTART:${dtStart}\r\n`;
    ics += `DTEND:${dtEnd}\r\n`;
    ics += `SUMMARY:${(ev.title||'').replace(/[,;\\]/g,' ')}\r\n`;
    if(ev.note) ics += `DESCRIPTION:${ev.note.replace(/\n/g,'\\n').replace(/[,;\\]/g,' ')}\r\n`;
    if(ev.place) ics += `LOCATION:${ev.place.replace(/[,;\\]/g,' ')}\r\n`;
    ics += `UID:${ev.id}@mycoach-myteam\r\n`;
    ics += 'END:VEVENT\r\n';
  });
  
  ics += 'END:VCALENDAR';
  
  const blob = new Blob([ics], {type:'text/calendar;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'mycoach_calendar_' + curMonth() + '.ics';
  a.click();
  URL.revokeObjectURL(a.href);
  toast(`📅 ${visibleEvents.length}件のイベントをエクスポートしました`,'s');
}

function deleteEvent(id){
  const ev=DB.events.find(e=>e.id===id);
  if(!ev)return;
  const myId=DB.currentUser?.id;
  const role=DB.currentUser?.role;
  if(ev.createdBy!==myId && role!=='admin' && role!=='team'){toast('自分が作成したイベントのみ削除できます','e');return;}
  if(!confirm('このイベントを削除しますか？'))return;
  // 繰り返しイベントの子も削除
  DB.events=DB.events.filter(e=>e.id!==id && e.parentId!==id);
  saveDB();goTo('calendar');
}

