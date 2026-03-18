// 13-coach-pages.js — Coach pages
function coachDash(){
  const me=getMyCoach();
  if(!me) return '<div class="pg-head"><div class="pg-title">コーチダッシュボード</div></div>'+emptyState('🏅','コーチプロフィールが未設定です','プロフィール設定から情報を登録してください','プロフィールを設定する',"goTo('profile')");
  
  // ── 未承認コーチ: 制限付きダッシュボード ──
  if(!me.verified){
    const profileComplete = !!(me.sport && me.area && me.bio);
    return `
    <div class="dash-greeting" style="background:linear-gradient(135deg,#475569 0%,#1e293b 100%)">
      <div><div class="dash-greeting-sub">ようこそ 🏅</div>
      <div class="dash-greeting-name">${sanitize(DB.currentUser?.name||me.name,20)}</div>
      <div class="dash-greeting-sub" style="margin-top:4px"><span style="background:rgba(249,115,22,.2);color:#f97316;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:700">⏳ 承認待ち</span></div></div>
    </div>
    
    <div style="padding:16px;background:linear-gradient(135deg,rgba(249,115,22,.06),rgba(234,179,8,.04));border:2px dashed #f97316;border-radius:14px;margin-bottom:14px">
      <div style="font-size:14px;font-weight:800;color:#f97316;margin-bottom:8px">⏳ 管理者の承認をお待ちください</div>
      <div style="font-size:12px;color:var(--txt2);line-height:1.7;margin-bottom:12px">
        システム管理者がプロフィールを確認後、承認されます。<br>
        承認が完了するとチーム検索・マッチング・指導管理など全機能が利用可能になります。
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:6px;padding:6px 10px;background:rgba(0,207,170,.06);border-radius:8px;font-size:11px;font-weight:600;color:var(--teal)">✅ アカウント登録完了</div>
        <div style="display:flex;align-items:center;gap:6px;padding:6px 10px;background:rgba(249,115,22,.06);border-radius:8px;font-size:11px;font-weight:600;color:#f97316">⏳ 管理者承認待ち</div>
      </div>
    </div>
    
    <div class="card mb-16">
      <div class="fw7 mb-12" style="font-size:14px">📝 承認前にできること</div>
      <div style="display:grid;gap:10px">
        <div style="display:flex;align-items:center;gap:10px;padding:12px;background:var(--surf2);border-radius:10px;cursor:pointer" onclick="goTo('profile-settings')">
          <div style="width:36px;height:36px;background:${profileComplete?'rgba(0,207,170,.1)':'rgba(249,115,22,.1)'};border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px">${profileComplete?'✅':'📝'}</div>
          <div style="flex:1"><div class="fw7 text-sm">プロフィールを充実させる</div>
          <div style="font-size:11px;color:var(--txt3)">${profileComplete?'入力済み — 承認率が上がります':'スポーツ・指導歴・自己紹介を入力しましょう'}</div></div>
          <span style="font-size:12px;color:var(--txt3)">→</span>
        </div>
      </div>
    </div>
    
    <div class="card">
      <div class="fw7 mb-12" style="font-size:14px">🔒 承認後に利用可能</div>
      <div style="display:grid;gap:8px">
        ${[
          ['🔍','チームを探す','チーム検索・マッチング'],
          ['🏃','担当選手','選手管理・指導'],
          ['📊','選手レポート','成績・コンディション分析'],
          ['💰','収益管理','報酬・支払い管理'],
          ['💬','メッセージ','チームとのコミュニケーション'],
        ].map(function(f){return '<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--surf2);border-radius:8px;opacity:.5"><span style="font-size:16px">'+f[0]+'</span><div><div class="fw7" style="font-size:12px">'+f[1]+'</div><div style="font-size:10px;color:var(--txt3)">'+f[2]+'</div></div><span style="margin-left:auto;font-size:12px">🔒</span></div>';}).join('')}
      </div>
    </div>`;
  }
  const t=DB.teams.find(x=>x.id===me.team);
  const myDisc=getMyDisclosure();
  const pendingDisc=me.team?_dbArr('disclosures').find(d=>d.coachId===me.id&&d.teamId===me.team&&d.status==='active'&&!d.coachAgreedAt):null;
  const players=DB.players.filter(p=>p.team===me.team);
  const earned=_dbArr('coachPay').filter(p=>p.coach===me.id&&p.status==='paid').reduce((s,p)=>s+(p.coachReceives||(p.amount-getFeeAmount(p.amount,p.teamId||'','coachFee'))),0);
  const pending=_dbArr('requests').filter(r=>(r.coachId===me.id||r.teamId===me.team)&&r.status==='pending').length;
  const now=new Date();
  const thisMonthEvents=(DB.events||[]).filter(e=>{const y=e.year||now.getFullYear();const m=e.month!==undefined?e.month:now.getMonth();return y===now.getFullYear()&&m===now.getMonth();}).length;

  const h=now.getHours();
  const greetText=h<12?'おはようございます':h<18?'こんにちは':'お疲れさまです';

  // 誓約バナー
  const discBanner=pendingDisc
    ?`<div class="dash-alert dash-alert-info"><i class="fa fa-file-signature"></i><div style="flex:1"><b>選手情報の同意確認をお待ちしています</b><div style="font-size:12px;margin-top:2px">${t?t.name:'チーム'}から選手情報の開示許可が届いています。</div></div><button class="btn btn-primary btn-sm" onclick="openCoachPledgeModal()" style="flex-shrink:0">署名する</button></div>`
    :myDisc
    ?`<div class="dash-alert dash-alert-success"><i class="fa fa-unlock"></i><span><b>選手情報開示中</b> — ${t?t.name:''} · ${myDisc.coachAgreedAt}署名済み</span></div>`
    :me.team
    ?`<div class="dash-alert dash-alert-warn"><i class="fa fa-lock"></i><span>選手情報は<b>非公開</b>です。${t?t.name:'チーム'}の開示許可をお待ちください。</span></div>`
    :'';

  return`
  <!-- グリーティング -->
  <div class="dash-greeting" style="background:linear-gradient(135deg,#1e3256 0%,#0f766e 100%)">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">
      <div>
        <div class="dash-greeting-sub">${greetText}</div>
        <div class="dash-greeting-name">${me.name} コーチ</div>
        <div class="dash-greeting-sub" style="margin-top:4px">${me.sport||''} ${me.area?'· '+me.area:''} ${t?'· '+t.name:''}</div>
      </div>
      <div class="dash-greeting-actions">
        <button class="btn btn-sm" onclick="goTo('profile')"><i class="fa fa-user-circle" style="margin-right:4px"></i>プロフィール</button>
        <button class="btn btn-primary btn-sm" onclick="goTo('team-search')"><i class="fa fa-search" style="margin-right:4px"></i>チームを探す</button>
      </div>
    </div>
  </div>

  ${flowStepper('coach')}
  ${renderProfileCompletionWidget()}
  ${discBanner}

  <!-- KPIカード -->
  <div class="hero-kpi">
    <div class="hero-kpi-card" style="border-left:3px solid var(--org)">
      <div class="kpi-icon" style="background:rgba(249,115,22,.1)">💴</div>
      <div class="kpi-value">¥${earned.toLocaleString()}</div>
      <div class="kpi-label">累計収入</div>
      <div class="kpi-sub" style="color:var(--grn)">手数料10%控除後</div>
    </div>
    <div class="hero-kpi-card" style="border-left:3px solid var(--blue)">
      <div class="kpi-icon" style="background:rgba(14,165,233,.1)">🏃</div>
      <div class="kpi-value">${players.length}<span style="font-size:14px;color:var(--txt3)"> 名</span></div>
      <div class="kpi-label">担当選手</div>
      <div class="kpi-sub" style="color:var(--txt3)">${t?t.name:'未所属'}</div>
    </div>
    <div class="hero-kpi-card" style="border-left:3px solid var(--grn)">
      <div class="kpi-icon" style="background:rgba(34,197,94,.1)">📅</div>
      <div class="kpi-value">${thisMonthEvents}<span style="font-size:14px;color:var(--txt3)"> 件</span></div>
      <div class="kpi-label">今月の予定</div>
    </div>
    <div class="hero-kpi-card" style="border-left:3px solid #a855f7">
      <div class="kpi-icon" style="background:rgba(168,85,247,.1)">⭐</div>
      <div class="kpi-value">${me.rating||'--'}<span style="font-size:14px;color:var(--txt3)"> / 5.0</span></div>
      <div class="kpi-label">平均評価</div>
      <div class="kpi-sub" style="color:#a855f7">${me.reviews||0}件のレビュー</div>
    </div>
  </div>

  ${todayEventsWidget()}

  <!-- チャート -->
  <div class="dash-grid dash-grid-2" style="margin-bottom:16px">
    <div class="dash-section" style="margin-bottom:0">
      <div class="dash-section-head">
        <span class="dash-section-title">📈 収益推移</span>
        <button class="btn btn-ghost btn-xs" onclick="goTo('earnings')">詳細 →</button>
      </div>
      <div style="height:150px"><canvas id="coach-mini-earnings-chart"></canvas></div>
    </div>
    <div class="dash-section" style="margin-bottom:0">
      <div class="dash-section-head"><span class="dash-section-title">🏋️ トレーニング達成率</span></div>
      <div style="height:150px"><canvas id="coach-mini-training-chart"></canvas></div>
    </div>
  </div>

  <!-- 選手コンディション -->
  <div class="dash-section">
    <div class="dash-section-head">
      <span class="dash-section-title">🏃 担当選手コンディション</span>
      <button class="btn btn-ghost btn-xs" onclick="goTo('coach-players')">全員 →</button>
    </div>
    ${players.length?players.slice(0,5).map(p=>{
      const plog=Object.values(DB.trainingLog[p.id]||{}).sort((a,b)=>a.date>b.date?-1:1);
      const cond=plog.length?(plog[0].cond||0):0;
      const condEmoji=cond>=4?'😄':cond>=3?'😊':cond>=1?'😐':'😶';
      const cc=cond>=4?'var(--grn)':cond>=3?'var(--yel)':cond>=1?'var(--org)':'var(--txt3)';
      return`<div class="dash-list-item" style="cursor:pointer" onclick="window.coachReportView='${p.id}';goTo('coach-report')">
        <div class="avi" style="width:34px;height:34px;font-size:12px;background:linear-gradient(135deg,var(--org),#f59e0b);color:#fff;flex-shrink:0">${(p.name||'?')[0]}</div>
        <div style="flex:1;min-width:0"><div class="fw7 text-sm">${sanitize(p.name,16)}</div><div class="text-xs text-muted">${p.pos||'--'} · ${p.age||'--'}歳</div></div>
        <span style="font-size:18px">${condEmoji}</span>
        <i class="fa fa-chevron-right" style="color:var(--txt3);font-size:11px;opacity:.4"></i>
      </div>`;
    }).join(''):'<div class="text-muted text-sm text-center" style="padding:24px">担当選手はまだいません</div>'}
  </div>

  ${pending>0?requestsPanel('coach'):''}

  <!-- クイックアクション -->
  <div class="qa-grid">
    <button class="qa-pill" onclick="goTo('team-search')"><i style="background:rgba(249,115,22,.1);color:var(--org)" class="fa fa-search"></i>チームを探す</button>
    <button class="qa-pill" onclick="goTo('coach-report')"><i style="background:rgba(14,165,233,.1);color:var(--blue)" class="fa fa-chart-bar"></i>選手レポート</button>
    <button class="qa-pill" onclick="goTo('schedule')"><i style="background:rgba(0,207,170,.1);color:var(--teal)" class="fa fa-calendar-plus"></i>スケジュール</button>
    <button class="qa-pill" onclick="goTo('chat')"><i style="background:rgba(34,197,94,.1);color:var(--grn)" class="fa fa-comments"></i>メッセージ</button>
    <button class="qa-pill" onclick="goTo('earnings')"><i style="background:rgba(168,85,247,.1);color:#a855f7" class="fa fa-yen-sign"></i>収益確認</button>
  </div>`;
}
function teamSearch(){
  const coach=getMyCoach();
  if(!coach) return '<div class="pg-head"><div class="pg-title">チーム検索</div></div><div class="card text-center" style="padding:40px"><div style="font-size:48px"><i class="fas fa-search" style="color:var(--txt3)"></i></div><div class="fw7 mt-12">コーチ情報が見つかりません</div></div>';
  const myReqs=_dbArr('requests').filter(r=>r.coachId===coach.id);
  const pendingTeamIds=new Set(myReqs.filter(r=>r.status==='pending').map(r=>r.teamId));
  const matchedTeamIds=new Set(myReqs.filter(r=>r.status==='matched'||r.status==='trial_requested'||r.status==='trial_approved').map(r=>r.teamId));
  const contractRequestedTeamIds=new Set(myReqs.filter(r=>r.status==='contract_requested').map(r=>r.teamId));
  const contractedTeamIds=new Set(myReqs.filter(r=>r.status==='contracted').map(r=>r.teamId));
  const contractTeamId=coach.team;

  function teamCard(t){
    const isPending=pendingTeamIds.has(t.id);
    const isMatched=matchedTeamIds.has(t.id);
    const isContractRequested=contractRequestedTeamIds.has(t.id);
    const isContracted=contractedTeamIds.has(t.id);
    const isContract=contractTeamId===t.id;
    const _req=myReqs.find(r=>r.teamId===t.id);
    let btn='';
    if(isContract){
      const disc2=_dbArr('disclosures').find(d=>d.coachId===coach.id&&d.teamId===t.id&&d.status==='active');
      const pledged2=disc2&&disc2.coachAgreedAt;
      const waiting2=disc2&&!disc2.coachAgreedAt;
      if(waiting2){
        btn=`<button class="btn btn-primary w-full btn-sm" onclick="openCoachPledgeModal()"><i class="fa fa-pen" style="margin-right:4px"></i>同意確認する</button>`;
      } else {
        btn=`<button class="btn btn-ghost w-full btn-sm" disabled style="color:var(--green)"><i class="fas fa-check-circle" style="margin-right:4px"></i>契約中</button>`;
      }
    } else if(isContractRequested){
      btn=`<button class="btn btn-primary w-full btn-sm" onclick="openContractAcceptModal('${_req?.id||''}')"><i class="fas fa-file-contract" style="margin-right:4px"></i>本契約を確認・承諾</button>`;
    } else if(isMatched){
      const _ck=Object.keys(DB.chats).find(k=>DB.chats[k].reqId===_req?.id);
      const _trBadge=_req?trialStatusBadge(_req):'';
      let _trBtn='';
      if(_req&&_req.status==='trial_requested'){
        _trBtn=`<div class="flex gap-8"><button class="btn btn-primary btn-sm flex-1" onclick="approveTrialLesson('${_req.id}')">✓ トライアル承諾</button><button class="btn btn-ghost btn-sm flex-1" onclick="declineTrialLesson('${_req.id}')">辞退</button></div>`;
      } else if(_req&&_req.status==='trial_approved'){
        _trBtn=`<div style="font-size:10px;color:var(--grn);text-align:center;font-weight:700">✅ トライアル承諾済み · レッスン実施後、チームが評価します</div>`;
      }
      btn=`<div style="display:flex;flex-direction:column;gap:6px;width:100%">
        ${_trBadge?`<div style="text-align:center">${_trBadge}</div>`:''}
        ${_ck?`<button class="btn btn-primary w-full btn-sm" onclick="activeRoom='${_ck}';goTo('chat')"><i class="fas fa-comments" style="margin-right:4px"></i>💬 チャットで相談する</button>`
        :`<button class="btn btn-ghost w-full btn-sm" disabled style="color:var(--teal)"><i class="fas fa-handshake" style="margin-right:4px"></i>マッチング成立</button>`}
        ${_trBtn||`<div style="font-size:10px;color:var(--txt3);text-align:center">チームから本契約の申請が届きます</div>`}
      </div>`;
    } else if(isPending){
      const _isReceived=_req?.type==='team_to_coach';
      if(_isReceived){
        const _pendCk=Object.keys(DB.chats).find(k=>DB.chats[k].reqId===_req?.id)||'';
        btn=`<div style="display:flex;flex-direction:column;gap:6px;width:100%">
          <button class="btn btn-primary w-full btn-sm" onclick="approveRequest('${_req?.id||''}')"><i class="fas fa-handshake" style="margin-right:4px"></i>マッチングを承認</button>
          <div style="display:flex;gap:4px">
            <button class="btn btn-ghost btn-sm flex-1" onclick="rejectRequest('${_req?.id||''}')">&times; 断る</button>
            ${_pendCk?`<button class="btn btn-ghost btn-sm flex-1" onclick="activeRoom='${_pendCk}';goTo('chat')">💬 チャット</button>`:''}
          </div>
        </div>`;
      } else {
        btn=`<button class="btn btn-ghost w-full btn-sm" disabled style="color:var(--org)"><i class="fas fa-clock" style="margin-right:4px"></i>応募済み · 承認待ち</button>`;
      }
    } else {
      btn=`<button class="btn btn-primary w-full btn-sm" onclick="openM('チームに応募',applyTeamForm('${t.id}'))"><i class="fas fa-paper-plane" style="margin-right:4px"></i>応募する</button>`;
    }
    return`<div class="profile-card">
      <div style="position:relative;display:inline-block;margin:0 auto 12px">
        <div class="avi avi-lg" style="background:linear-gradient(135deg,var(--ink2),var(--teal))">${(t.name||'?')[0]}</div>
        ${isContract?`<div style="position:absolute;bottom:0;right:0;width:18px;height:18px;background:var(--green);border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid var(--surf)"><i class="fa fa-check" style="font-size:8px;color:#fff"></i></div>`:''}
        ${isContractRequested?`<div style="position:absolute;bottom:0;right:0;width:18px;height:18px;background:var(--org);border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid var(--surf)"><i class="fa fa-file-contract" style="font-size:7px;color:#fff"></i></div>`:''}
        ${isPending&&!isMatched&&!isContract&&!isContractRequested?`<div style="position:absolute;bottom:0;right:0;width:18px;height:18px;background:var(--org);border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid var(--surf)"><i class="fa fa-clock" style="font-size:7px;color:#fff"></i></div>`:''}
      </div>
      <div class="fw7 mb-4">${t.name}</div>
      <div class="text-xs text-muted mb-10">${t.sport} / ${t.area}</div>
      <div class="grid-2 text-center mb-12">
        <div><div class="fw8 text-sm">${t.members}名</div><div class="text-xs text-muted">選手数</div></div>
        <div><div class="fw8 text-sm">¥${(t.fee/1000).toFixed(1)}k</div><div class="text-xs text-muted">月謝</div></div>
      </div>
      ${t.coach?`<span class="badge b-red mb-12">コーチ在籍中</span>`:`<span class="badge b-yel mb-12">コーチ募集中</span>`}
      ${isContract?(()=>{
        const disc=_dbArr('disclosures').find(d=>d.coachId===coach.id&&d.teamId===t.id&&d.status==='active');
        const pledged=disc&&disc.coachAgreedAt;
        const waiting=disc&&!disc.coachAgreedAt;
        if(pledged) return`<div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:12px;background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.2);border-radius:20px;padding:5px 10px"><i class="fa fa-unlock" style="font-size:10px;color:var(--grn)"></i><span style="font-size:11px;color:var(--grn)">選手情報 開示・署名済み</span></div>`;
        if(waiting) return`<div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:12px;background:rgba(14,165,233,.1);border:1px solid rgba(14,165,233,.2);border-radius:20px;padding:5px 10px"><i class="fa fa-file-signature" style="font-size:10px;color:var(--blue)"></i><span style="font-size:11px;color:var(--blue)">同意確認が必要</span></div>`;
        return`<div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:12px;background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.2);border-radius:20px;padding:5px 10px"><i class="fa fa-lock" style="font-size:10px;color:#ef4444"></i><span style="font-size:11px;color:#ef4444">選手情報 未開示</span></div>`;
      })():''}
      ${btn}
    </div>`;
  }

  const tq=(window._tsQ||'').toLowerCase().trim();
  const tsportF=window._tsSport||'all';
  const allTeams=DB.teams.filter(t=>{
    if(tq && !(t.name||'').toLowerCase().includes(tq) && !(t.sport||'').toLowerCase().includes(tq) && !(t.area||'').toLowerCase().includes(tq)) return false;
    if(tsportF!=='all' && !(t.sport||'').includes(tsportF)) return false;
    return true;
  });
  const tsports=[...new Set(DB.teams.map(t=>t.sport).filter(Boolean))].slice(0,8);
  const searchBar=`<div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:20px;align-items:center">
    <div style="flex:1;min-width:180px;position:relative">
      <i class="fa fa-search" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--txt3);font-size:13px"></i>
      <input class="input" placeholder="チーム名・種目・エリアで検索…" value="${(window._tsQ||'').replace(/"/g,'&quot;')}"
        oninput="window._tsQ=this.value;refreshPage()" style="padding-left:36px;height:40px;font-size:13px">
    </div>
    <select class="input" onchange="window._tsSport=this.value;refreshPage()"
      style="height:40px;font-size:12px;padding:0 12px;min-width:130px;cursor:pointer">
      <option value="all" ${tsportF==='all'?'selected':''}>種目：すべて</option>
      ${tsports.map(s=>`<option value="${s}" ${tsportF===s?'selected':''}>${s}</option>`).join('')}
    </select>
    <select class="input" onchange="window._tsShowOnly=this.value;refreshPage()"
      style="height:40px;font-size:12px;padding:0 12px;min-width:130px;cursor:pointer">
      <option value="all">すべて表示</option>
      <option value="recruiting" ${window._tsShowOnly==='recruiting'?'selected':''}>募集中のみ</option>
    </select>
    ${tq||tsportF!=='all'?`<button class="btn btn-ghost btn-sm" onclick="window._tsQ='';window._tsSport='all';refreshPage()">&times; リセット</button>`:''}
  </div>`;
  const displayTeams = window._tsShowOnly==='recruiting' ? allTeams.filter(t=>!t.coach) : allTeams;
  const contractReqCount=myReqs.filter(r=>r.status==='contract_requested').length;
  const contractReqAlert=contractReqCount>0?`<div class="dash-alert dash-alert-warn" style="margin-bottom:16px"><i class="fa fa-file-contract"></i><span><b>${contractReqCount}件</b>の本契約申請が届いています。チーム一覧で確認してください。</span></div>`:'';
  return`<div class="pg-head"><div class="pg-title">チームを探す</div><div class="pg-sub">コーチを必要としているチームに応募</div></div>
  ${contractReqAlert}
  ${searchBar}
  ${displayTeams.length===0?`<div class="empty-state"><div class="empty-state-icon">${tq?'🔍':'🏟️'}</div><h3>${tq?'該当するチームが見つかりません':'チームがいません'}</h3><p>${tq?'別のキーワードで検索してみてください':''}</p></div>`
  :`<div style="font-size:12px;color:var(--txt3);margin-bottom:12px">${displayTeams.length}チーム</div><div class="pcard-grid">${displayTeams.map(t=>teamCard(t)).join('')}</div>`}`;
}
function earningsPage(){
  const me = getMyCoach();
  if(!me) return `<div class="pg-head"><div class="pg-title">収益管理</div></div><div class="card text-center" style="padding:48px"><div style="font-size:40px">💴</div><div class="fw7 mt-16">コーチ情報なし</div></div>`;
  const pays = _dbArr('coachPay').filter(p=>p.coach===me.id);
  const totalReceived = pays.filter(p=>p.status==='paid').reduce((s,p)=>s+(p.coachReceives||0),0);
  const thisM = curMonth();
  const thisMonthPay = pays.filter(p=>p.month===thisM&&p.status==='paid').reduce((s,p)=>s+(p.coachReceives||0),0);
  const pendingPay = _dbArr('payThreads').filter(pt=>pt.coachId===me.id).reduce((s,pt)=>{return s+(pt.invoices||[]).filter(i=>i.status==='unpaid').reduce((ss,i)=>ss+(i.coachReceives||0),0);},0);

  // 過去6ヶ月の収益
  const last6 = Array.from({length:6},(_,i)=>{
    const d=new Date(); d.setMonth(d.getMonth()-5+i);
    return d.toISOString().slice(0,7);
  });
  const monthlyData = last6.map(m=>({
    month: m,
    amount: pays.filter(p=>p.month===m&&p.status==='paid').reduce((s,p)=>s+(p.coachReceives||0),0)
  }));
  const maxAmt = Math.max(...monthlyData.map(d=>d.amount), 1);

  // チーム別収益
  const teamBreakdown = {};
  pays.filter(p=>p.status==='paid').forEach(p=>{
    const t = DB.teams.find(x=>x.id===p.team);
    const name = t?.name || p.team || '不明';
    teamBreakdown[name] = (teamBreakdown[name]||0) + (p.coachReceives||0);
  });

  return`<div class="pg-head flex justify-between items-center">
    <div><div class="pg-title">収益管理</div><div class="pg-sub">コーチ報酬・振込履歴</div></div>
    <button class="btn btn-primary btn-sm" onclick="openStripeSetup()">⚡ 口座設定</button>
  </div>

  <!-- KPIカード -->
  <div class="stat-row" style="grid-template-columns:repeat(4,1fr);margin-bottom:20px">
    <div class="stat-box">
      <div style="font-size:11px;color:var(--txt3);margin-bottom:6px">今月の収益</div>
      <div style="font-size:24px;font-weight:800;color:var(--teal)">¥${fmtNum(thisMonthPay)}</div>
    </div>
    <div class="stat-box">
      <div style="font-size:11px;color:var(--txt3);margin-bottom:6px">累計収益</div>
      <div style="font-size:24px;font-weight:800;color:var(--txt1)">¥${fmtNum(totalReceived)}</div>
    </div>
    <div class="stat-box" style="${pendingPay>0?'border-left:3px solid var(--yel)':''}">
      <div style="font-size:11px;color:var(--txt3);margin-bottom:6px">振込待ち</div>
      <div style="font-size:24px;font-weight:800;color:${pendingPay>0?'var(--yel)':'var(--txt3)'}">¥${fmtNum(pendingPay)}</div>
    </div>
    <div class="stat-box">
      <div style="font-size:11px;color:var(--txt3);margin-bottom:6px">担当チーム数</div>
      <div style="font-size:24px;font-weight:800;color:var(--txt1)">${new Set(pays.map(p=>p.team)).size}</div>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:2fr 1fr;gap:20px;margin-bottom:20px">
    <!-- 月別収益バーチャート -->
    <div class="card">
      <div class="fw7 mb-14" style="font-size:14px">📊 月別収益推移</div>
      <div style="display:flex;gap:8px;align-items:flex-end;height:140px;margin-bottom:12px">
        ${monthlyData.map(d=>{
          const h = Math.round((d.amount/maxAmt)*100);
          const isThis = d.month===thisM;
          return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
            <div style="font-size:9px;color:${isThis?'var(--teal)':'var(--txt3)'};font-weight:700">${d.amount>0?'¥'+fmtNum(d.amount):''}</div>
            <div style="width:100%;border-radius:6px 6px 0 0;background:${isThis?'var(--teal)':'rgba(0,207,170,.35)'};height:${h}%;min-height:${d.amount>0?4:0}px;transition:height .6s"></div>
            <div style="font-size:9px;color:var(--txt3)">${d.month.slice(5)}月</div>
          </div>`;
        }).join('')}
      </div>
      <div style="display:grid;grid-template-columns:canvas;height:0"><canvas id="earnings-chart" style="display:none"></canvas></div>
    </div>

    <!-- チーム別内訳 -->
    <div class="card">
      <div class="fw7 mb-14" style="font-size:14px">🏆 チーム別収益</div>
      ${Object.entries(teamBreakdown).length ? Object.entries(teamBreakdown).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([name,amt],i)=>{
        const pct = Math.round(amt/totalReceived*100)||0;
        const colors = ['var(--teal)','var(--org)','var(--blue)','var(--yel)','var(--grn)'];
        return `<div style="margin-bottom:12px">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px">
            <span style="font-size:12px;font-weight:600">${sanitize(name,18)}</span>
            <span style="font-size:12px;color:var(--teal);font-weight:700">¥${fmtNum(amt)}</span>
          </div>
          <div style="height:6px;background:var(--b2);border-radius:3px">
            <div style="width:${pct}%;height:100%;background:${colors[i%5]};border-radius:3px"></div>
          </div>
        </div>`;
      }).join('') : '<div class="text-muted text-sm text-center" style="padding:20px">データなし</div>'}
    </div>
  </div>

  <!-- 収益履歴テーブル -->
  <div class="card">
    <div class="fw7 mb-14" style="font-size:14px">📋 収益履歴</div>
    ${pays.length ? `<div style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead>
          <tr style="border-bottom:2px solid var(--b1)">
            <th style="text-align:left;padding:8px 12px;color:var(--txt3);font-size:11px;font-weight:600">月</th>
            <th style="text-align:left;padding:8px 12px;color:var(--txt3);font-size:11px;font-weight:600">チーム</th>
            <th style="text-align:right;padding:8px 12px;color:var(--txt3);font-size:11px;font-weight:600">請求額</th>
            <th style="text-align:right;padding:8px 12px;color:var(--txt3);font-size:11px;font-weight:600">手数料</th>
            <th style="text-align:right;padding:8px 12px;color:var(--txt3);font-size:11px;font-weight:600">受取額</th>
            <th style="text-align:center;padding:8px 12px;color:var(--txt3);font-size:11px;font-weight:600">状態</th>
          </tr>
        </thead>
        <tbody>
          ${pays.slice().reverse().map(p=>{
            const team=DB.teams.find(t=>t.id===p.team);
            return `<tr style="border-bottom:1px solid var(--b1);transition:background .15s" onmouseover="this.style.background='var(--surf2)'" onmouseout="this.style.background=''">
              <td style="padding:10px 12px;font-weight:600">${p.month||'--'}</td>
              <td style="padding:10px 12px;color:var(--txt2)">${sanitize(team?.name||p.team||'--',20)}</td>
              <td style="padding:10px 12px;text-align:right">¥${fmtNum(p.teamPays||p.amount||0)}</td>
              <td style="padding:10px 12px;text-align:right;color:var(--txt3)">¥${fmtNum(p.platformTotal||0)}</td>
              <td style="padding:10px 12px;text-align:right;font-weight:800;color:var(--teal)">¥${fmtNum(p.coachReceives||0)}</td>
              <td style="padding:10px 12px;text-align:center">
                <span style="font-size:11px;padding:3px 10px;border-radius:20px;background:${p.status==='paid'?'rgba(34,197,94,.15)':'rgba(245,158,11,.15)'};color:${p.status==='paid'?'var(--grn)':'var(--yel)'}">
                  ${p.status==='paid'?'✓ 入金済':'⏳ 処理中'}
                </span>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>` : `<div class="text-center text-muted" style="padding:32px 0"><div style="font-size:32px;margin-bottom:12px">💴</div><div class="text-sm">まだ収益データがありません</div><p class="text-xs mt-8">チームとマッチングして請求書を発行しましょう</p></div>`}
  </div>

  <!-- 税務・会計に関するご案内 -->
  <div class="card" style="margin-top:16px;border-left:3px solid var(--yel)">
    <div style="font-size:14px;font-weight:800;margin-bottom:10px"><i class="fa fa-calculator" style="color:var(--yel);margin-right:6px"></i>税務・確定申告に関するご案内</div>
    <div style="font-size:12px;color:var(--txt2);line-height:1.8">
      <div style="margin-bottom:10px;padding:10px;background:rgba(234,179,8,.06);border-radius:8px">
        <b>⚠️ 本サービスは税務処理を代行するものではありません。</b>以下の情報は一般的な参考情報です。具体的な税務処理については税理士等の専門家にご相談ください。
      </div>
      <div style="display:grid;gap:8px">
        <div style="padding:8px 10px;background:var(--surf2);border-radius:8px">
          <div style="font-size:11px;font-weight:700;color:var(--txt1);margin-bottom:3px">📋 確定申告について</div>
          <div style="font-size:11px">業務委託としてコーチ報酬を受け取る場合、原則として確定申告が必要になる場合があります。年間の報酬額や他の所得状況によります。</div>
        </div>
        <div style="padding:8px 10px;background:var(--surf2);border-radius:8px">
          <div style="font-size:11px;font-weight:700;color:var(--txt1);margin-bottom:3px">🧾 インボイス制度（適格請求書等保存方式）</div>
          <div style="font-size:11px">2023年10月より開始されたインボイス制度への対応が必要な場合があります。適格請求書発行事業者の登録状況により、消費税の取り扱いが異なります。</div>
        </div>
        <div style="padding:8px 10px;background:var(--surf2);border-radius:8px">
          <div style="font-size:11px;font-weight:700;color:var(--txt1);margin-bottom:3px">💰 消費税について</div>
          <div style="font-size:11px">本サービスに表示される金額は税込想定の参考金額です。実際の消費税額の計算・申告は、ご自身の課税事業者区分に応じてご対応ください。</div>
        </div>
        <div style="padding:8px 10px;background:var(--surf2);border-radius:8px">
          <div style="font-size:11px;font-weight:700;color:var(--txt1);margin-bottom:3px">📄 帳簿・記録の保管</div>
          <div style="font-size:11px">Stripeの決済明細や本サービスの収益データは、帳簿記録の参考としてご活用いただけますが、正式な会計帳簿の代替にはなりません。</div>
        </div>
      </div>
    </div>
  </div>`;
}


function profilePage(){
  const r = DB.currentUser?.role;
  if(r==='coach')  return coachProfileEditPage();
  if(r==='team')   return teamProfileEditPage();
  if(r==='player') return playerProfileEditPage();
  if(r==='parent') return parentProfileEditPage();
  const u = DB.currentUser||{};
  return '<div class="pg-head"><div class="pg-title">プロフィール</div></div>'
    +'<div class="card text-center" style="padding:40px">'
    +'<div class="avi avi-xl" style="margin:0 auto 16px">'+sanitize((u.name||'?')[0])+'</div>'
    +'<div class="fw7">'+sanitize(u.name||'')+'</div>'
    +'<div class="text-xs text-muted mt-4">'+sanitize(u.email||'')+'</div></div>';
}

function coachProfileEditPage(){
  const c = getMyCoach();
  if(!c) return `<div class="pg-head"><div class="pg-title">プロフィール編集</div></div><div class="card text-center" style="padding:40px"><div class="fw7">プロフィールデータがありません</div><button class="btn btn-primary mt-16" onclick="goTo(&quot;dashboard&quot;)">ダッシュボードへ</button></div>`;
  const color = c.color||'var(--org)';
  return '<div class="pg-head"><div class="pg-title">プロフィール編集</div><div class="pg-sub">'+sanitize(c.name)+'</div></div>'
    +'<div style="display:grid;grid-template-columns:240px 1fr;gap:20px">'
    +'<div class="card text-center">'
    +'<div class="avi avi-xl" style="margin:0 auto 14px;background:'+color+'">'+sanitize((c.name||'?')[0])+'</div>'
    +'<div class="fw7 mb-4">'+sanitize(c.name)+'</div>'
    +'<div class="text-xs" style="color:var(--org)">'+sanitize(c.sport||'')+'</div>'
    +'<div class="stars mt-8 mb-16">'+'★'.repeat(Math.round(c.rating||0))+' '+(c.rating||0)+'</div>'
    +'</div>'
    +'<div class="card">'
    +'<div class="fw7 mb-16" style="font-size:16px">📸 プロフィール写真</div>'
    +'<div style="display:flex;align-items:center;gap:20px;margin-bottom:20px">'
    +'<div style="position:relative;width:80px;height:80px;flex-shrink:0">'
    +'<div id="cp-photo-preview" style="width:80px;height:80px;border-radius:50%;background:var(--surf2);display:flex;align-items:center;justify-content:center;overflow:hidden;border:2px solid var(--bdr)">'
    +(c.photo?'<img src="'+c.photo+'" style="width:100%;height:100%;object-fit:cover">':('<span style="font-size:28px;color:var(--txt3)">'+((c.name||'?')[0])+'</span>'))
    +'</div>'
    +'<label style="position:absolute;bottom:0;right:0;width:24px;height:24px;background:var(--org);border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;border:2px solid var(--surf);font-size:12px" title="写真を変更">'
    +'📷<input type="file" accept="image/*" style="display:none" onchange="_loadProfilePhoto(this,&quot;cp-photo-preview&quot;,&quot;cp&quot;)"></label>'
    +'</div>'
    +'<div class="text-xs text-muted"><div class="fw7 mb-4">写真をアップロード</div><div>JPG/PNG・5MB以下</div><div class="mt-4" style="color:var(--org)">クリックまたはタップして選択</div></div>'
    +'</div>'
    +'<div class="fw7 mb-20" style="font-size:16px">基本情報</div>'
    +'<div class="grid-2">'
    +'<div class="form-group"><label class="label">氏名</label><input id="cp-name" class="input" value="'+sanitize(c.name)+'"></div>'
    +'<div class="form-group"><label class="label">専門種目</label><input id="cp-sport" class="input" value="'+sanitize(c.sport||'')+'"></div>'
    +'<div class="form-group"><label class="label">専門分野</label><input id="cp-spec" class="input" value="'+sanitize(c.spec||'')+'"></div>'
    +'<div class="form-group"><label class="label">地域</label><input id="cp-area" class="input" value="'+sanitize(c.area||'')+'"></div>'
    +'<div class="form-group"><label class="label">指導歴（年）</label><input id="cp-exp" class="input" type="number" min="0" max="60" min="0" max="60" value="'+(c.exp||0)+'"></div>'
    +'</div>'
    +'<div style="background:var(--surf2);border:1px solid var(--b1);border-radius:10px;padding:14px;margin-bottom:16px">'
    +'<div class="fw7 mb-12" style="font-size:13px">💰 料金設定</div>'
    +'<div class="grid-2" style="gap:12px">'
    +'<div><div class="form-group"><label class="label">月額契約（¥）</label><input id="cp-price" class="input" type="number" min="0" max="9999999" value="'+(c.price||0)+'" '+(c.monthlyNegotiable?'disabled style="opacity:.5"':'')+' ></div>'
    +'<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px"><label class="toggle-switch"><input type="checkbox" id="cp-monthlyNeg" '+(c.monthlyNegotiable?'checked':'')+' onchange="var el=document.getElementById(\'cp-price\');el.disabled=this.checked;el.style.opacity=this.checked?\'.5\':\'1\'"><span class="toggle-slider"></span></label><span style="font-size:11px;color:var(--txt3)">ご相談ください</span></div></div>'
    +'<div><div class="form-group"><label class="label">都度払い（1回・¥）</label><input id="cp-priceOnetime" class="input" type="number" min="0" max="9999999" value="'+(c.priceOnetime||0)+'" '+(c.onetimeNegotiable?'disabled style="opacity:.5"':'')+' ></div>'
    +'<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px"><label class="toggle-switch"><input type="checkbox" id="cp-onetimeNeg" '+(c.onetimeNegotiable?'checked':'')+' onchange="var el=document.getElementById(\'cp-priceOnetime\');el.disabled=this.checked;el.style.opacity=this.checked?\'.5\':\'1\'"><span class="toggle-slider"></span></label><span style="font-size:11px;color:var(--txt3)">ご相談ください</span></div></div>'
    +'</div></div>'
    +'<div class="form-group"><label class="label">自己紹介</label><textarea id="cp-bio" class="input" rows="4">'+sanitize(c.bio||'')+'</textarea></div>'
    +'<div class="fw7 mb-12" style="margin-top:20px;font-size:15px">🎨 アバターカラー</div>'
    +'<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px">'
    +['#ff6b2b','#00cfaa','#3b82f6','#a855f7','#ef4444','#f59e0b'].map(col=>`<div onclick="document.getElementById('cp-color').value='${col}';this.parentElement.querySelectorAll('.copt').forEach(x=>x.style.borderColor='transparent');this.style.borderColor='#fff'" class="copt" style="width:30px;height:30px;border-radius:50%;background:${col};cursor:pointer;border:3px solid ${(c.color||'#ff6b2b')===col?'#fff':'transparent'}"></div>`).join('')
    +'<input type="hidden" id="cp-color" value="'+(c.color||'#ff6b2b')+'"></div>'
    +'<div class="fw7 mb-12" style="font-size:15px">🌐 SNS</div>'
    +'<div class="grid-2">'
    +'<div class="form-group"><label class="label">Instagram</label><input id="cp-ig" class="input" value="'+sanitize(c.instagram||'')+'" placeholder="@handle" maxlength="50"></div>'
    +'<div class="form-group"><label class="label">X (Twitter)</label><input id="cp-tw" class="input" value="'+sanitize(c.twitter||'')+'" placeholder="@handle" maxlength="50"></div>'
    +'</div>'
    +'<div class="fw7 mb-12" style="font-size:15px">🔒 公開設定</div>'
    +'<div class="payment-method-row mb-10"><div><div class="text-sm fw7">プロフィールを公開</div><div class="text-xs text-muted">チーム検索に表示</div></div><label class="toggle-switch"><input type="checkbox" id="cp-public" '+(c.isPublic!==false?'checked':'')+'><span class="toggle-slider"></span></label></div>'
    +'<button class="btn btn-primary w-full" style="margin-top:8px" onclick="saveCoachProfileFull()">💾 保存する</button>'
    +'</div></div>';
}
function saveCoachProfileFull(){
  const me=getMyCoach();if(!me)return;
  const fields={name:'cp-name',sport:'cp-sport',spec:'cp-spec',area:'cp-area'};
  Object.entries(fields).forEach(([k,id])=>{const v=document.getElementById(id)?.value;if(v!==undefined)me[k]=sanitize(v,40);});
  me.exp=parseInt(document.getElementById('cp-exp')?.value)||me.exp;
  me.price=Math.max(0,parseInt(document.getElementById('cp-price')?.value)||me.price);
  me.priceOnetime=Math.max(0,parseInt(document.getElementById('cp-priceOnetime')?.value)||0);
  const _negEl=document.getElementById('cp-onetimeNeg');if(_negEl)me.onetimeNegotiable=_negEl.checked;
  const _mNegEl=document.getElementById('cp-monthlyNeg');if(_mNegEl)me.monthlyNegotiable=_mNegEl.checked;
  me.bio=sanitize(document.getElementById('cp-bio')?.value||'',300);
  me.color=document.getElementById('cp-color')?.value||me.color||'#ff6b2b';
  me.instagram=sanitize(document.getElementById('cp-ig')?.value||'',50);
  me.twitter=sanitize(document.getElementById('cp-tw')?.value||'',50);
  me.isPublic=document.getElementById('cp-public')?.checked!==false;
  // 写真保存
  if(window._profilePhotos&&window._profilePhotos['cp']){
    me.photo=window._profilePhotos['cp'];
    window._profilePhotos['cp']=null;
    if(DB.currentUser&&DB.currentUser.id===me.id)DB.currentUser.photo=me.photo;
  }
  if(DB.currentUser)DB.currentUser.name=me.name;
  saveDBAndSync();_updateAvi();toast('プロフィールを保存しました','s');goTo('profile');
}

function teamProfileEditPage(){
  const t=getMyTeam();
  if(!t) return `<div class="pg-head"><div class="pg-title">チームプロフィール</div></div><div class="card text-center" style="padding:40px"><div class="fw7">チームデータがありません</div></div>`;
  const colors=['#ff6b2b','#00cfaa','#3b82f6','#a855f7','#ef4444','#f59e0b','#10b981','#ec4899'];
  return`<div class="pg-head"><div class="pg-title">チームプロフィール編集</div></div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
    <div class="card" style="padding:18px">
      <div class="fw7 mb-16" style="font-size:15px">📋 基本情報</div>
      <div class="form-group"><label class="label">チーム名</label><input id="tp-name" class="input" value="${sanitize(t.name||'',30)}" maxlength="30"></div>
      <div class="form-group"><label class="label">種目</label><input id="tp-sport" class="input" value="${sanitize(t.sport||'',20)}" maxlength="20"></div>
      <div class="form-group"><label class="label">地域</label><input id="tp-area" class="input" value="${sanitize(t.area||'',20)}" maxlength="20"></div>
      <div class="form-group"><label class="label">月謝（¥）</label><input id="tp-fee" class="input" type="number" min="0" max="9999999" value="${t.fee||0}"></div>
      <div class="form-group"><label class="label">チーム紹介</label><textarea id="tp-bio" class="input" rows="3" maxlength="200" placeholder="チームの特徴や理念...">${sanitize(t.bio||'',200)}</textarea></div>
    </div>
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="card" style="padding:18px">
        <div class="fw7 mb-12" style="font-size:15px">📸 チームロゴ・写真</div>
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px">
          <div style="position:relative;width:72px;height:72px;flex-shrink:0">
            <div id="tp-photo-preview" style="width:72px;height:72px;border-radius:14px;background:${t.color||'var(--org)'}22;display:flex;align-items:center;justify-content:center;overflow:hidden;border:2px solid var(--bdr)">
              ${t.photo?`<img src="${t.photo}" style="width:100%;height:100%;object-fit:cover">`:`<span style="font-size:26px;font-weight:700;color:${t.color||'var(--org)'}">${(t.name||'T')[0]}</span>`}
            </div>
            <label style="position:absolute;bottom:-4px;right:-4px;width:22px;height:22px;background:var(--org);border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;border:2px solid var(--surf);font-size:10px" title="ロゴを変更">
              📷<input type="file" accept="image/*" style="display:none" onchange="_loadProfilePhoto(this,'tp-photo-preview','tp')">
            </label>
          </div>
          <div class="text-xs text-muted"><div class="fw7 mb-4">チームロゴをアップロード</div><div>JPG/PNG・5MB以下</div><div class="mt-4" style="color:var(--org)">クリックして選択</div></div>
        </div>
        <div class="fw7 mb-12" style="font-size:15px">🎨 チームカラー</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px">
          ${colors.map(c=>`<div onclick="document.querySelectorAll('.color-opt').forEach(x=>x.style.transform='');this.style.transform='scale(1.25)';document.getElementById('tp-color').value='${c}'" class="color-opt" style="width:30px;height:30px;border-radius:50%;background:${c};cursor:pointer;border:3px solid ${(t.color||'#ff6b2b')===c?'#fff':'transparent'};transition:transform .2s,border .2s"></div>`).join('')}
        </div>
        <input type="hidden" id="tp-color" value="${t.color||'#ff6b2b'}">
        <div style="width:60px;height:60px;border-radius:50%;background:${t.color||'#ff6b2b'};margin:0 auto;display:flex;align-items:center;justify-content:center;color:#fff;font-size:22px;font-weight:700">${(t.name||'T')[0]}</div>
      </div>
      <div class="card" style="padding:18px">
        <div class="fw7 mb-12" style="font-size:15px">🏟️ マッチング設定</div>
        <div class="payment-method-row mb-12">
          <div><div class="text-sm fw7">マッチング機能を有効にする</div><div class="text-xs text-muted">他チームからの申請を受け付ける</div></div>
          <label class="toggle-switch"><input type="checkbox" id="tp-match-avail" ${t.matchAvailable!==false?'checked':''}><span class="toggle-slider"></span></label>
        </div>
        <div class="form-group"><label class="label">🎯 カテゴリ（年齢層）</label><input id="tp-age-group" class="input" value="${sanitize(t.ageGroup||'',30)}" placeholder="例: U-12 / U-15" maxlength="30"></div>
        <div class="form-group"><label class="label">📊 チームレベル</label>
          <select id="tp-team-level" class="input">
            <option value="" ${!t.teamLevel?'selected':''}>未設定</option>
            <option value="初級" ${t.teamLevel==='初級'?'selected':''}>初級（始めたばかり）</option>
            <option value="中級" ${t.teamLevel==='中級'?'selected':''}>中級（区大会レベル）</option>
            <option value="上級" ${t.teamLevel==='上級'?'selected':''}>上級（都大会以上）</option>
          </select>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <div class="form-group"><label class="label">📅 活動日</label><input id="tp-practice-days" class="input" value="${sanitize(t.practiceDays||'',20)}" placeholder="例: 火・木・土" maxlength="20"></div>
          <div class="form-group"><label class="label">⚡ 対戦可能日</label><input id="tp-match-days" class="input" value="${sanitize(t.matchDays||'',20)}" placeholder="例: 土日祝" maxlength="20"></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <div class="form-group"><label class="label">🏠 練習場所</label><input id="tp-home-ground" class="input" value="${sanitize(t.homeGround||'',40)}" placeholder="例: 〇〇公園グラウンド" maxlength="40"></div>
          <div class="form-group"><label class="label">📍 対戦可能場所</label><input id="tp-match-location" class="input" value="${sanitize(t.matchLocation||'',40)}" placeholder="例: 都内近郊" maxlength="40"></div>
        </div>
        <div class="form-group"><label class="label">💬 募集メッセージ <span style="font-size:10px;color:var(--org);font-weight:400">※マッチング画面に表示されます</span></label>
          <textarea id="tp-match-msg" class="input" rows="2" maxlength="200" placeholder="例: 練習試合の相手を常に探しています！同レベルのU-12チーム大歓迎！">${sanitize(t.matchMessage||'',200)}</textarea>
        </div>
        <div class="form-group"><label class="label">🔍 求める対戦相手</label><input id="tp-looking-for" class="input" value="${sanitize(t.lookingFor||'',60)}" placeholder="例: 同レベルのU-12サッカーチーム" maxlength="60"></div>
      </div>
      <div class="card" style="padding:18px">
        <div class="fw7 mb-12" style="font-size:15px">🌐 SNS・連絡先</div>
        <div class="form-group"><label class="label">公式サイト</label><input id="tp-web" class="input" value="${sanitize(t.website||'',80)}" placeholder="https://" maxlength="100"></div>
        <div class="form-group"><label class="label">Instagram</label><input id="tp-ig" class="input" value="${sanitize(t.instagram||'',40)}" placeholder="@handle" maxlength="50"></div>
        <div class="form-group"><label class="label">X (Twitter)</label><input id="tp-tw" class="input" value="${sanitize(t.twitter||'',40)}" placeholder="@handle" maxlength="50"></div>
      </div>
      <div class="card" style="padding:18px">
        <div class="fw7 mb-12" style="font-size:15px">🔒 公開設定</div>
        <div class="payment-method-row mb-8">
          <div><div class="text-sm fw7">プロフィールを公開</div><div class="text-xs text-muted">コーチ検索に表示</div></div>
          <label class="toggle-switch"><input type="checkbox" id="tp-public" ${t.isPublic!==false?'checked':''}><span class="toggle-slider"></span></label>
        </div>
        <div class="payment-method-row">
          <div><div class="text-sm fw7">選手データを公開</div><div class="text-xs text-muted">承認コーチのみ閲覧可</div></div>
          <label class="toggle-switch"><input type="checkbox" id="tp-data-public" ${t.dataPublic!==false?'checked':''}><span class="toggle-slider"></span></label>
        </div>
      </div>
    </div>
  </div>
  <button class="btn btn-primary w-full mt-16" style="font-size:15px" onclick="saveTeamProfileFull()">💾 プロフィールを保存</button>`;
}
function saveTeamProfileFull(){
  const t=getMyTeam();if(!t)return;
  t.name=sanitize(document.getElementById('tp-name')?.value||t.name,30);
  t.sport=sanitize(document.getElementById('tp-sport')?.value||t.sport,20);
  t.area=sanitize(document.getElementById('tp-area')?.value||t.area,20);
  t.fee=parseInt(document.getElementById('tp-fee')?.value||t.fee)||t.fee;
  t.bio=sanitize(document.getElementById('tp-bio')?.value||'',200);
  t.color=document.getElementById('tp-color')?.value||t.color||'#ff6b2b';
  t.website=sanitize(document.getElementById('tp-web')?.value||'',100);
  t.instagram=sanitize(document.getElementById('tp-ig')?.value||'',50);
  t.twitter=sanitize(document.getElementById('tp-tw')?.value||'',50);
  // Matching profile fields
  t.matchAvailable=document.getElementById('tp-match-avail')?.checked!==false;
  t.ageGroup=sanitize(document.getElementById('tp-age-group')?.value||'',30);
  t.teamLevel=document.getElementById('tp-team-level')?.value||'';
  t.practiceDays=sanitize(document.getElementById('tp-practice-days')?.value||'',20);
  t.matchDays=sanitize(document.getElementById('tp-match-days')?.value||'',20);
  t.homeGround=sanitize(document.getElementById('tp-home-ground')?.value||'',40);
  t.matchLocation=sanitize(document.getElementById('tp-match-location')?.value||'',40);
  t.matchMessage=sanitize(document.getElementById('tp-match-msg')?.value||'',200);
  t.lookingFor=sanitize(document.getElementById('tp-looking-for')?.value||'',60);
  t.updatedAt=new Date().toISOString();
  t.isPublic=document.getElementById('tp-public')?.checked!==false;
  t.dataPublic=document.getElementById('tp-data-public')?.checked!==false;
  // 写真保存
  if(window._profilePhotos && window._profilePhotos['tp']){
    t.photo = window._profilePhotos['tp'];
    window._profilePhotos['tp'] = null;
    if(DB.currentUser&&DB.currentUser.id===t.id)DB.currentUser.photo=t.photo;
  }
  if(DB.currentUser)DB.currentUser.name=t.name;
  saveDB();
  _updateAvi();
  toast('プロフィールを保存しました','s');
  goTo('profile');
}

function playerProfileEditPage(){
  const p = DB.players.find(x=>x.id===DB.currentUser?.id);
  if(!p) return '<div class="pg-head"><div class="pg-title">プロフィール編集</div></div><div class="card text-center" style="padding:40px"><div class="fw7">データがありません</div></div>';
  const team = p.team ? DB.teams.find(t=>t.id===p.team) : null;
  let teamSection = '';
  if(team){
    teamSection = '<div class="form-group" style="margin-bottom:16px"><label class="label">所属チーム</label>'
      +'<div style="padding:10px 14px;background:rgba(34,197,94,.06);border:1px solid rgba(34,197,94,.2);border-radius:8px;font-size:13px">'
      +'<span style="font-weight:700;color:var(--grn)">✅ '+sanitize(team.name,20)+'</span>'
      +'<span style="color:var(--txt3);margin-left:8px;font-size:11px">'+sanitize(team.sport||'',10)+' · '+sanitize(team.area||'',10)+'</span></div></div>';
  } else {
    teamSection = '<div class="form-group" style="margin-bottom:16px"><label class="label">チームに参加する</label>'
      +'<div style="display:flex;gap:8px"><input id="pl-invite-code" class="input" placeholder="招待コードを入力" style="flex:1;text-transform:uppercase;letter-spacing:2px;font-weight:700">'
      +'<button class="btn btn-primary btn-sm" onclick="joinTeamByCode()">参加</button></div>'
      +'<div style="font-size:11px;color:var(--txt3);margin-top:4px">チーム管理者から発行された招待コードを入力してください</div></div>';
  }
  return '<div class="pg-head"><div class="pg-title">プロフィール編集</div></div>'
    +'<div class="card">'
    +'<div class="fw7 mb-12" style="font-size:15px">📸 プロフィール写真</div>'
    +'<div style="display:flex;align-items:center;gap:16px;margin-bottom:20px">'
    +'<div style="position:relative;width:72px;height:72px;flex-shrink:0">'
    +'<div id="pl-photo-preview" style="width:72px;height:72px;border-radius:50%;background:var(--surf2);display:flex;align-items:center;justify-content:center;overflow:hidden;border:2px solid var(--bdr)">'
    +(p.photo?'<img src="'+p.photo+'" style="width:100%;height:100%;object-fit:cover">':('<span style="font-size:26px">'+((p.name||'?')[0])+'</span>'))
    +'</div>'
    +'<label style="position:absolute;bottom:-4px;right:-4px;width:22px;height:22px;background:var(--org);border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;border:2px solid var(--surf);font-size:10px">'
    +'📷<input type="file" accept="image/*" style="display:none" onchange="_loadProfilePhoto(this,\'pl-photo-preview\',\'pl\')"></label>'
    +'</div>'
    +'<div class="text-xs text-muted"><div class="fw7 mb-4">写真をアップロード</div><div>JPG/PNG・5MB以下</div></div>'
    +'</div>'
    + teamSection
    +'<div class="grid-2">'
    +'<div class="form-group"><label class="label">氏名</label><input id="pl-name" class="input" value="'+sanitize(p.name||'')+'"></div>'
    +'<div class="form-group"><label class="label">ポジション</label><input id="pl-pos" class="input" value="'+sanitize(p.pos||'')+'"></div>'
    +'<div class="form-group"><label class="label">年齢</label><input id="pl-age" class="input" type="number" min="0" max="100" value="'+(p.age||0)+'"></div>'
    +'<div class="form-group"><label class="label">身長（cm）</label><input id="pl-height" class="input" type="number" min="0" max="250" value="'+(p.height||0)+'"></div>'
    +'<div class="form-group"><label class="label">体重（kg）</label><input id="pl-weight" class="input" type="number" min="0" max="200" value="'+(p.weight||0)+'"></div>'
    +'</div>'
    +'<button class="btn btn-primary" onclick="savePlayerProfile()">💾 保存する</button>'
    +'</div>';
}

function parentProfileEditPage(){
  const u = DB.currentUser||{};
  const child = DB.players.find(p=>p.guardianId===u.id)||DB.players.find(p=>p.guardian===u.name);
  return '<div class="pg-head"><div class="pg-title">プロフィール編集</div></div>'
    +'<div class="card">'
    +'<div class="form-group"><label class="label">お名前</label><input id="pa-name" class="input" value="'+sanitize(u.name||'')+'"></div>'
    +'<div class="form-group"><label class="label">メールアドレス</label><input id="pa-email" class="input" type="email" value="'+sanitize(u.email||'')+'"></div>'
    +(child?'<div class="form-group mt-12"><label class="label">お子様の氏名</label><input id="pa-child" class="input" value="'+sanitize(child.name||'')+'"></div>':'')
    +'<button class="btn btn-primary" onclick="saveParentProfile()">💾 保存する</button>'
    +'</div>';
}


// ==================== PLAYER ACTIVATION GATE ====================
// 選手は保護者の月謝管理（クレカ登録）完了まで機能制限
function isPlayerActivated(){
  const cu=DB.currentUser;
  if(!cu||cu.role!=='player') return true;
  const p=DB.players.find(x=>x.id===cu.id);
  if(!p) return false;
  // Step1: チーム所属
  if(!p.team) return false;
  // Step2: 保護者紐づけ済み
  if(!p.guardianId) return false;
  // Step3: 保護者が月謝管理登録（クレカ登録）完了
  const guardian=_getUsers().find(gu=>gu.id===p.guardianId);
  if(!guardian) return false;
  if(!guardian.paymentSetup) return false;
  return true;
}

function getPlayerActivationStatus(){
  const cu=DB.currentUser;
  const p=cu?DB.players.find(x=>x.id===cu.id):null;
  const team=p?.team?DB.teams.find(t=>t.id===p.team):null;
  const guardian=p?.guardianId?_getUsers().find(gu=>gu.id===p.guardianId):null;
  return {
    hasTeam: !!p?.team,
    teamName: team?.name||'',
    hasGuardian: !!p?.guardianId,
    guardianName: guardian?.name||'',
    guardianPaymentReady: !!(guardian?.paymentSetup),
  };
}

function playerLockedPage(){
  const s=getPlayerActivationStatus();
  return `<div style="max-width:480px;margin:0 auto;padding:20px 0">
    <div class="card text-center" style="padding:32px 24px">
      <div style="font-size:48px;margin-bottom:16px">🔒</div>
      <div style="font-size:18px;font-weight:800;margin-bottom:8px">機能が制限されています</div>
      <div style="font-size:13px;color:var(--txt3);line-height:1.7;margin-bottom:24px">
        保護者の月謝管理登録が完了するまで<br>この機能はご利用いただけません。
      </div>

      <div style="text-align:left;display:flex;flex-direction:column;gap:12px">
        <div style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:${s.hasTeam?'rgba(34,197,94,.06)':'var(--surf2)'};border:1px solid ${s.hasTeam?'rgba(34,197,94,.2)':'var(--b1)'};border-radius:10px">
          <div style="width:32px;height:32px;border-radius:50%;background:${s.hasTeam?'var(--grn)':'var(--surf2)'};color:${s.hasTeam?'#fff':'var(--txt3)'};display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0">${s.hasTeam?'✓':'1'}</div>
          <div style="flex:1">
            <div style="font-size:13px;font-weight:${s.hasTeam?600:700};color:${s.hasTeam?'var(--grn)':'var(--txt1)'}">チームに参加</div>
            ${s.hasTeam?`<div style="font-size:11px;color:var(--grn)">${sanitize(s.teamName,20)}に所属中</div>`
            :`<div style="font-size:11px;color:var(--txt3)">チーム管理者から招待コードを受け取ってください</div>`}
          </div>
        </div>

        <div style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:${s.hasGuardian?'rgba(34,197,94,.06)':'var(--surf2)'};border:1px solid ${s.hasGuardian?'rgba(34,197,94,.2)':'var(--b1)'};border-radius:10px">
          <div style="width:32px;height:32px;border-radius:50%;background:${s.hasGuardian?'var(--grn)':'var(--surf2)'};color:${s.hasGuardian?'#fff':'var(--txt3)'};display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0">${s.hasGuardian?'✓':'2'}</div>
          <div style="flex:1">
            <div style="font-size:13px;font-weight:${s.hasGuardian?600:700};color:${s.hasGuardian?'var(--grn)':'var(--txt1)'}">保護者の紐づけ</div>
            ${s.hasGuardian?`<div style="font-size:11px;color:var(--grn)">${sanitize(s.guardianName,12)}と紐づけ済み</div>`
            :`<div style="font-size:11px;color:var(--txt3)">チーム管理者が保護者アカウントと紐づけます</div>`}
          </div>
        </div>

        <div style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:${s.guardianPaymentReady?'rgba(34,197,94,.06)':'var(--surf2)'};border:1px solid ${s.guardianPaymentReady?'rgba(34,197,94,.2)':'var(--b1)'};border-radius:10px">
          <div style="width:32px;height:32px;border-radius:50%;background:${s.guardianPaymentReady?'var(--grn)':'var(--surf2)'};color:${s.guardianPaymentReady?'#fff':'var(--txt3)'};display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0">${s.guardianPaymentReady?'✓':'3'}</div>
          <div style="flex:1">
            <div style="font-size:13px;font-weight:${s.guardianPaymentReady?600:700};color:${s.guardianPaymentReady?'var(--grn)':'var(--txt1)'}">保護者の月謝管理登録</div>
            ${s.guardianPaymentReady?`<div style="font-size:11px;color:var(--grn)">クレジットカード登録完了</div>`
            :`<div style="font-size:11px;color:var(--txt3)">保護者がクレジットカードを登録すると利用開始</div>`}
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

// ==================== コーチ承認制 ====================
function isCoachApproved(){
  const cu=DB.currentUser;
  if(!cu||cu.role!=='coach') return true;
  const c=DB.coaches.find(x=>x.id===cu.id);
  return c ? !!c.verified : false;
}

function coachPendingPage(){
  const me=getMyCoach();
  return `<div style="max-width:480px;margin:0 auto;padding:20px 0">
    <div class="card text-center" style="padding:32px 24px">
      <div style="font-size:48px;margin-bottom:16px">⏳</div>
      <div style="font-size:18px;font-weight:800;margin-bottom:8px">承認待ち</div>
      <div style="font-size:13px;color:var(--txt3);line-height:1.7;margin-bottom:24px">
        システム管理者による承認が完了するまで<br>この機能はご利用いただけません。
      </div>
      <div style="text-align:left;display:flex;flex-direction:column;gap:12px">
        <div style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:rgba(0,207,170,.06);border:1px solid rgba(0,207,170,.15);border-radius:10px">
          <span style="font-size:18px">✅</span>
          <div><div class="fw7 text-sm">アカウント登録</div><div class="text-xs text-muted">完了</div></div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:rgba(249,115,22,.06);border:1px solid rgba(249,115,22,.15);border-radius:10px">
          <span style="font-size:18px">⏳</span>
          <div><div class="fw7 text-sm" style="color:var(--org)">管理者による承認</div><div class="text-xs text-muted">審査中です。しばらくお待ちください。</div></div>
        </div>
      </div>
      <div style="margin-top:20px;padding:14px;background:var(--surf2);border-radius:10px;font-size:12px;color:var(--txt3);line-height:1.7">
        <b>承認待ちの間にできること：</b><br>
        📝 プロフィールの充実<br>
        💳 Stripe決済設定<br>
        承認後、チーム検索・マッチング・指導管理など全機能が利用可能になります。
      </div>
      <div style="display:flex;gap:8px;margin-top:16px">
        <button class="btn btn-primary btn-sm flex-1" onclick="goTo('profile-settings')">📝 プロフィール編集</button>
      </div>
    </div>
  </div>`;
}

// ==================== PLAYER PAGES ====================
