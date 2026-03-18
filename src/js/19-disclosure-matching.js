// 19-disclosure-matching.js — Disclosure, matching
function openDisclosureModal(coachId){
  const team=getMyTeam();
  if(!team){toast('チーム情報が見つかりません','e');return;}
  const coach=DB.coaches.find(c=>c.id===coachId);
  if(!coach){toast('コーチが見つかりません','e');return;}
  const allTeamPlayers=DB.players.filter(p=>p.team===team.id);
  const assignedPlayers=allTeamPlayers.filter(p=>p.coachId===coachId);
  // If no specific assignment, offer to disclose all team players
  const targetPlayers = assignedPlayers.length > 0 ? assignedPlayers : allTeamPlayers;
  const isAllPlayers = assignedPlayers.length === 0 && allTeamPlayers.length > 0;

  openM('選手情報の開示',`
    <div style="text-align:center;margin-bottom:16px">
      <div style="font-size:32px;margin-bottom:10px"><i class="fas fa-share-alt" style="color:var(--teal)"></i></div>
      <div style="font-size:15px;font-weight:800;margin-bottom:4px">${sanitize(coach.name,20)} コーチに選手情報を開示</div>
      <div style="font-size:12px;color:var(--txt3);line-height:1.7">
        コーチが選手のコンディション・食事・トレーニングデータを<br>閲覧できるようになります。
      </div>
    </div>
    ${targetPlayers.length?`<div style="padding:10px 14px;background:var(--surf2);border-radius:10px;margin-bottom:12px">
      <div style="font-size:11px;color:var(--txt3);margin-bottom:6px">${isAllPlayers?'開示対象: チーム全選手':'開示対象の担当選手'} (${targetPlayers.length}名)</div>
      <div style="display:flex;flex-wrap:wrap;gap:4px">${targetPlayers.map(function(p){return '<span style="font-size:11px;padding:2px 8px;background:var(--surf);border-radius:6px;font-weight:600">'+sanitize(p.name,10)+'</span>';}).join('')}</div>
      ${isAllPlayers?'<div style="font-size:10px;color:var(--org);margin-top:6px"><i class="fas fa-info-circle" style="margin-right:3px"></i>担当選手を個別に設定する場合は「担当選手を設定」から先に設定してください</div>':''}
    </div>`:`<div style="padding:10px 14px;background:rgba(249,115,22,.06);border:1px solid rgba(249,115,22,.2);border-radius:10px;margin-bottom:12px;font-size:12px;color:var(--org)">
      <i class="fas fa-info-circle" style="margin-right:4px"></i>チームに選手が登録されていません。
    </div>`}
    <div style="padding:10px 14px;background:rgba(14,165,233,.06);border-radius:10px;margin-bottom:14px;font-size:11px;color:var(--txt2);line-height:1.7">
      <b>開示される情報:</b> 選手の基本情報、コンディション記録、トレーニング履歴、食事記録、ケガ履歴<br>
      <b>注意:</b> コーチには個人情報保護誓約への署名が求められます。
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-ghost flex-1" onclick="closeM()">キャンセル</button>
      <button class="btn btn-primary flex-1" ${assignedPlayers.length?'':`disabled style="opacity:.5"`} onclick="sendDisclosure('${coachId}')">選手情報を開示する</button>
    </div>
  `);
}

function sendDisclosure(coachId){
  const team=getMyTeam();
  if(!team){toast('チーム情報が見つかりません','e');closeM();return;}
  const coach=DB.coaches.find(c=>c.id===coachId);
  // 既存の開示がある場合はスキップ
  if(_dbArr('disclosures').find(d=>d.coachId===coachId&&d.teamId===team.id&&d.status==='active')){
    toast('既に開示済みです','w');closeM();return;
  }
  // FIX: Use assigned players, or ALL team players if none assigned
  const allTeamPlayers=DB.players.filter(p=>p.team===team.id);
  const assignedPlayers=allTeamPlayers.filter(p=>p.coachId===coachId);
  const targetPlayers = assignedPlayers.length > 0 ? assignedPlayers : allTeamPlayers;
  if(!targetPlayers.length){toast('チームに選手が登録されていません','e');closeM();return;}

  DB.disclosures=DB.disclosures||[];
  DB.disclosures.push({
    id:'disc'+Date.now(),
    teamId:team.id,
    coachId:coachId,
    status:'active',
    playerIds:targetPlayers.map(p=>p.id),
    createdAt:new Date().toISOString(),
    coachAgreedAt:null
  });

  addNotif(sanitize(team.name||'チーム',15)+'から選手情報の開示許可が届きました。同意確認をお願いします。','fa-share-alt','dashboard',coachId);
  addAuditLog('disclosure_send','選手情報開示: '+sanitize(team.name||'',15)+' → '+sanitize(coach?.name||'',15)+' ('+targetPlayers.length+'名)',{coachId,teamId:team.id});
  saveDB();
  closeM();
  toast('選手情報をコーチに開示しました。コーチの同意確認をお待ちください。','s');
  refreshPage();
}

function openCoachDetail(id){
  const c=DB.coaches.find(x=>x.id===id);
  if(!c){toast('コーチ情報が見つかりません','e');return;}
  const isTeam=DB.currentUser?.role==='team';
  const team=isTeam?getMyTeam():null;
  const alreadyReq=team?_dbArr('requests').find(r=>r.coachId===id&&r.teamId===team.id&&(r.status==='pending'||r.status==='matched')):null;
  const isMyCoach=team?.coach===id;
  const stars='★'.repeat(Math.round(c.rating||0))+'☆'.repeat(5-Math.round(c.rating||0));
  const price=c.price||0;


  // ステータスバッジ
  let statusBadge='';
  if(isMyCoach) statusBadge='<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 12px;border-radius:20px;background:rgba(34,197,94,.12);color:var(--grn);font-size:11px;font-weight:700"><i class="fa fa-check-circle"></i> 契約中</span>';
  else if(alreadyReq?.status==='matched') statusBadge='<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 12px;border-radius:20px;background:rgba(0,207,170,.12);color:var(--teal);font-size:11px;font-weight:700"><i class="fa fa-handshake"></i> マッチ済み</span>';
  else if(alreadyReq?.status==='pending') statusBadge='<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 12px;border-radius:20px;background:rgba(249,115,22,.12);color:var(--org);font-size:11px;font-weight:700"><i class="fa fa-clock"></i> 交渉中</span>';

  // アクションボタン
  let actionBtn='';
  if(isTeam){
    if(isMyCoach) actionBtn='<button class="btn btn-ghost w-full" disabled style="opacity:.7">✅ 契約中のコーチです</button>';
    else if(alreadyReq) actionBtn='<button class="btn btn-ghost w-full" disabled style="opacity:.7">📩 既に依頼済みです</button>';
    else actionBtn=`<button class="btn btn-primary w-full" style="padding:14px;font-size:14px;font-weight:700;border-radius:14px" onclick="closeM();openM('🤝 マッチングを申請する',requestCoachForm('${c.id}'))">🤝 マッチングを申請する</button><button class="btn btn-ghost w-full" style="margin-top:8px;color:#8b5cf6;border-color:rgba(168,85,247,.25)" onclick="closeM();openTrialLessonModal('${c.id}')">🎯 まずはトライアルレッスン</button>`;
  }
  if(DB.currentUser?.role==='admin'&&!c.verified){
    actionBtn+=`<button class="btn btn-success w-full" style="margin-top:8px" onclick="approveCoach('${c.id}')">✓ コーチを承認する</button>`;
  }
  if(DB.currentUser?.role==='admin'){
    actionBtn+=`<button class="btn btn-secondary w-full" style="margin-top:8px" onclick="closeM();adminEditCoach('${c.id}')">✏️ コーチ情報を編集</button>`;
    actionBtn+=`<button class="btn btn-ghost w-full" style="margin-top:8px;color:#ef4444;border-color:rgba(239,68,68,.3)" onclick="confirmDeleteCoach('${c.id}')">🗑 コーチを削除</button>`;
  }

  const html=`
    <!-- ヘッダー: 写真 + 基本情報 -->
    <div style="margin:-32px -32px 0;padding:32px 32px 24px;background:linear-gradient(135deg,${c.color||'var(--org)'}18,${c.color||'var(--org)'}08);border-bottom:1px solid var(--b1);position:relative">
      <div style="display:flex;gap:20px;align-items:center;flex-wrap:wrap">
        <!-- アバター -->
        <div style="position:relative;flex-shrink:0">
          <div style="width:96px;height:96px;border-radius:24px;background:${c.color||'var(--org)'};${c.photo?'background-image:url('+c.photo+');background-size:cover;background-position:center':'display:flex;align-items:center;justify-content:center;font-size:38px;font-weight:800;color:#fff'};box-shadow:0 8px 24px ${c.color||'var(--org)'}40">
            ${c.photo?'':((c.name||'?')[0])}
          </div>
          ${c.verified?'<div style="position:absolute;bottom:-4px;right:-4px;width:28px;height:28px;background:var(--teal);border-radius:50%;border:3px solid var(--surf);display:flex;align-items:center;justify-content:center"><i class="fa fa-check" style="font-size:11px;color:#fff"></i></div>':''}
        </div>
        <!-- 名前・種目 -->
        <div style="flex:1;min-width:160px">
          <div style="font-size:20px;font-weight:800;color:var(--txt1);line-height:1.3;margin-bottom:4px">${sanitize(c.name,24)}${!c.verified?' <span style="font-size:10px;padding:2px 8px;border-radius:6px;background:rgba(245,158,11,.12);color:var(--yel);vertical-align:middle">審査中</span>':''}</div>
          <div style="font-size:13px;color:var(--org);font-weight:600;margin-bottom:6px">${sanitize(c.sport,15)}${c.spec?' · '+sanitize(c.spec,15):''}</div>
          <div style="font-size:13px;color:var(--yel);margin-bottom:4px">${stars} <span style="color:var(--txt3);font-size:12px">${c.rating||'--'} (${c.reviews||0}件)</span></div>
          <div style="font-size:12px;color:var(--txt3)"><i class="fa fa-map-marker-alt" style="margin-right:4px;color:var(--org)"></i>${c.area||'未設定'}</div>
          ${statusBadge?'<div style="margin-top:8px">'+statusBadge+'</div>':''}
        </div>
      </div>
    </div>

    <!-- 料金・指導歴 3カラム -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--b1);border-radius:14px;overflow:hidden;margin:20px 0">
      <div style="background:var(--surf);padding:16px;text-align:center">
        <div style="font-size:${c.monthlyNegotiable?'13':'20'}px;font-weight:800;color:var(--org)">${c.monthlyNegotiable?'ご相談ください':('¥'+(price?fmtNum(price):'--'))}</div>
        <div style="font-size:11px;color:var(--txt3);margin-top:3px">月額契約</div>
      </div>
      <div style="background:var(--surf);padding:16px;text-align:center">
        <div style="font-size:${c.onetimeNegotiable?'13':'20'}px;font-weight:800;color:var(--teal)">${c.onetimeNegotiable?'ご相談ください':('¥'+(c.priceOnetime?fmtNum(c.priceOnetime):'--'))}</div>
        <div style="font-size:11px;color:var(--txt3);margin-top:3px">都度払い（1回）</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--b1);border-radius:14px;overflow:hidden;margin:0 0 20px">
      <div style="background:var(--surf);padding:14px;text-align:center">
        <div style="font-size:18px;font-weight:800">${c.exp||'--'}<span style="font-size:12px;color:var(--txt3)">年</span></div>
        <div style="font-size:11px;color:var(--txt3);margin-top:3px">指導歴</div>
      </div>
      <div style="background:var(--surf);padding:14px;text-align:center">
        <div style="font-size:18px;font-weight:800;color:${c.avail?'var(--grn)':'var(--red)'}">${c.avail?'募集中':'契約中'}</div>
        <div style="font-size:11px;color:var(--txt3);margin-top:3px">ステータス</div>
      </div>
    </div>
    <!-- 自己紹介 -->
    ${c.bio?`<div style="margin-bottom:20px">
      <div style="font-size:12px;font-weight:700;color:var(--txt3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">📝 自己紹介</div>
      <div style="font-size:14px;color:var(--txt2);line-height:1.8;padding:14px 16px;background:var(--surf2);border-radius:12px">${sanitize(c.bio,500)}</div>
    </div>`:''}

    <!-- 詳細情報 -->
    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px">
      ${c.spec?`<span style="font-size:11px;padding:4px 10px;border-radius:8px;background:var(--org)10;color:var(--org)">🎯 ${sanitize(c.spec,15)}</span>`:''}
      <span style="font-size:11px;padding:4px 10px;border-radius:8px;background:var(--surf2);color:var(--txt2)">📍 ${c.area||'未設定'}</span>
      <span style="font-size:11px;padding:4px 10px;border-radius:8px;background:${c.avail?'rgba(34,197,94,.1)':'rgba(239,68,68,.1)'};color:${c.avail?'var(--grn)':'#ef4444'}">${c.avail?'🟢 募集中':'🔴 契約中'}</span>
    </div>

    <!-- レビュー -->
    ${(()=>{
      var rvHtml=renderCoachReviewSummary(id);
      var canReview=isTeam&&(isMyCoach||_dbArr('requests').some(r=>r.coachId===id&&r.teamId===team?.id&&r.status==='contracted'));
      var hasReviewed=(DB.coachReviews||[]).some(r=>r.coachId===id&&r.createdBy===DB.currentUser?.id);
      if(!rvHtml&&!canReview) return '';
      return '<div style="margin-bottom:16px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><div style="font-size:12px;font-weight:700;color:var(--txt3);text-transform:uppercase;letter-spacing:.5px">⭐ レビュー</div>'+(canReview&&!hasReviewed?'<button class="btn btn-ghost btn-xs" onclick="closeM();openCoachReviewForm(\''+id+'\')">✏️ レビューを書く</button>':'')+'</div>'+(rvHtml||'<div style="font-size:12px;color:var(--txt3);padding:12px;text-align:center">まだレビューがありません</div>')+'</div>';
    })()}

    <!-- アクションボタン -->
    <div style="display:flex;flex-direction:column;gap:8px">
      ${actionBtn}
      ${isTeam&&!isMyCoach&&!alreadyReq?`<button class="btn btn-ghost w-full" onclick="closeM()">戻る</button>`:`<button class="btn btn-secondary w-full" onclick="closeM()">閉じる</button>`}
    </div>
  `;

  openM('', html, true);
  // タイトルを非表示にする（カスタムヘッダーがあるため）
  const titleEl=document.querySelector('#modal-inner .modal-title');
  if(titleEl) titleEl.style.display='none';
}
function approveCoach(id){if(DB.currentUser?.role!=='admin'){toast('この操作は事務局のみ実行できます','e');return;}const c=DB.coaches.find(c=>c.id===id);if(!c){toast('コーチが見つかりません','e');return;}c.verified=true;c.verifiedAt=new Date().toISOString();addNotif('🏅 '+sanitize(c.name,15)+'コーチが承認されました。全機能が利用可能です。','fa-check-circle','dashboard',c.id);addAuditLog('coach_approve','コーチ承認: '+sanitize(c.name,20),{coachId:id});saveDB();closeM();toast('✅ '+sanitize(c.name,15)+'コーチを承認しました','s');if(curPage==='coaches')goTo('coaches')}

function adminEditCoach(cid){
  const c=DB.coaches.find(x=>x.id===cid);
  if(!c){toast('コーチが見つかりません','e');return;}
  openM('✏️ コーチ編集: '+sanitize(c.name,15),`
    <div class="grid-2">
      <div class="form-group"><label class="label">氏名</label><input id="ace-name" class="input" value="${sanitize(c.name||'')}"></div>
      <div class="form-group"><label class="label">種目</label><input id="ace-sport" class="input" value="${sanitize(c.sport||'')}"></div>
      <div class="form-group"><label class="label">専門分野</label><input id="ace-spec" class="input" value="${sanitize(c.spec||'')}"></div>
      <div class="form-group"><label class="label">地域</label><input id="ace-area" class="input" value="${sanitize(c.area||'')}"></div>
      <div class="form-group"><label class="label">月額（¥）</label><input id="ace-price" class="input" type="number" value="${c.price||0}" min="0"></div>
      <div class="form-group"><label class="label">指導歴（年）</label><input id="ace-exp" class="input" type="number" value="${c.exp||0}" min="0"></div>
    </div>
    <div class="form-group"><label class="label">メール</label><input id="ace-email" class="input" type="email" value="${sanitize(c.email||'')}"></div>
    <div class="form-group"><label class="label">自己紹介</label><textarea id="ace-bio" class="input" rows="3">${sanitize(c.bio||'')}</textarea></div>
    <div class="payment-method-row"><div><div class="text-sm fw7">募集中</div></div><label class="toggle-switch"><input type="checkbox" id="ace-avail" ${c.avail?'checked':''}><span class="toggle-slider"></span></label></div>
    <div class="payment-method-row"><div><div class="text-sm fw7">承認済み</div></div><label class="toggle-switch"><input type="checkbox" id="ace-verified" ${c.verified?'checked':''}><span class="toggle-slider"></span></label></div>
    <div class="flex gap-8 mt-16">
      <button class="btn btn-primary flex-1" onclick="adminSaveCoach('${c.id}')">💾 保存</button>
      <button class="btn btn-ghost flex-1" onclick="closeM()">キャンセル</button>
    </div>
  `);
}
function adminSaveCoach(cid){
  const c=DB.coaches.find(x=>x.id===cid);if(!c)return;
  c.name=sanitize(document.getElementById('ace-name')?.value||c.name,50);
  c.sport=sanitize(document.getElementById('ace-sport')?.value||'',30);
  c.spec=sanitize(document.getElementById('ace-spec')?.value||'',50);
  c.area=sanitize(document.getElementById('ace-area')?.value||'',50);
  c.price=Math.max(0,parseInt(document.getElementById('ace-price')?.value)||0);
  c.exp=Math.max(0,parseInt(document.getElementById('ace-exp')?.value)||0);
  c.email=sanitize(document.getElementById('ace-email')?.value||'',100);
  c.bio=sanitize(document.getElementById('ace-bio')?.value||'',500);
  c.avail=document.getElementById('ace-avail')?.checked??true;
  c.verified=document.getElementById('ace-verified')?.checked??false;
  addAuditLog('coach_edit','コーチ編集: '+sanitize(c.name,20),{coachId:cid});
  saveDB();closeM();toast('コーチ情報を更新しました','s');refreshPage();
}

function confirmDeleteCoach(id){
  const c=DB.coaches.find(x=>x.id===id);
  if(!c){toast('コーチが見つかりません','e');return;}
  const linkedTeams=DB.teams.filter(t=>t.coach===id);
  const linkedRequests=_dbArr('requests').filter(r=>r.coachId===id&&(r.status==='pending'||r.status==='matched'));
  closeM();
  openM('⚠️ コーチを削除',`<div style="text-align:center;padding:16px">
    <div style="font-size:40px;margin-bottom:12px">⚠️</div>
    <div class="fw7 mb-8">${sanitize(c.name,20)}を削除しますか？</div>
    <div class="text-sm text-muted mb-16" style="line-height:1.7">この操作は取り消せません。
    ${linkedTeams.length?'<br><span style="color:#ef4444;font-weight:600">'+linkedTeams.length+'チームとの契約が解除されます</span>':''}
    ${linkedRequests.length?'<br><span style="color:var(--org);font-weight:600">'+linkedRequests.length+'件の申請が削除されます</span>':''}</div>
    <div class="flex gap-10">
      <button class="btn btn-ghost flex-1" onclick="closeM()">キャンセル</button>
      <button class="btn btn-primary flex-1" style="background:#ef4444;border-color:#ef4444" onclick="deleteCoach('${c.id}')">🗑 削除する</button>
    </div>
  </div>`);
}

function deleteCoach(id){
  if(DB.currentUser?.role!=='admin'){toast('この操作は事務局のみ実行できます','e');return;}
  const c=DB.coaches.find(x=>x.id===id);
  if(!c){toast('コーチが見つかりません','e');return;}
  const name=c.name;
  // チームとの紐づけ解除
  DB.teams.forEach(t=>{
    if(t.coach===id){t.coach=null;}
  });
  // マッチング申請を削除
  DB.requests=DB.requests.filter(r=>r.coachId!==id);
  // コーチ代支払いスレッドを削除
  DB.payThreads=DB.payThreads.filter(pt=>pt.coachId!==id);
  // コーチ代支払い履歴を削除
  DB.coachPay=(DB.coachPay||[]).filter(cp=>cp.coachId!==id);
  // ユーザーリストから削除
  const users=_getUsers();
  const uidx=users.findIndex(u=>u.id===id);
  if(uidx>=0) users.splice(uidx,1);
  _saveUsers(users);
  // コーチ配列から削除
  const idx=DB.coaches.findIndex(x=>x.id===id);
  if(idx>=0) DB.coaches.splice(idx,1);
  saveDB();closeM();
  toast(name+'を削除しました','s');
  addNotif(name+'（コーチ）を削除しました','fa-trash','coaches');
  goTo('coaches');
}
function openMatchModal(tid){const t=DB.teams.find(x=>x.id===tid);if(!t){toast('チームが見つかりません','e');return;}const avail=DB.coaches.filter(c=>c.avail&&c.verified);openM('コーチマッチング',`<p class="text-muted text-sm mb-18">${t.name} に最適なコーチを選択</p>${avail.map(c=>`<div class="flex justify-between items-center" style="padding:12px 0;border-bottom:1px solid var(--b1)"><div class="flex items-center gap-10"><div class="avi" style="width:30px;height:30px;font-size:11px;background:${c.color}">${(c.name||'?')[0]}</div><div><div class="fw7 text-sm">${c.name}</div><div class="text-xs text-muted">¥${fmtNum(c.price)}/月</div></div></div><button class="btn btn-success btn-xs" onclick="doMatch('${tid}','${c.id}')">🤝 マッチ</button></div>`).join('')}<button class="btn btn-ghost w-full mt-12" onclick="closeM()">閉じる</button>`)}
function doMatch(tid,cid){
  // DB更新のみ（UI操作はapproveRequestが担当）
  const team=DB.teams.find(t=>t.id===tid);
  const coach=DB.coaches.find(x=>x.id===cid);
  if(!team||!coach) return;
  team.coach=cid;
  coach.avail=false; coach.team=tid;
  const price=coach.monthlyNegotiable?0:(coach.price||0);
  const isNeg=coach.monthlyNegotiable;
  const teamFee=Math.round(price*.1);
  const teamTax=Math.round(teamFee*.1);
  const threadId='pt'+Date.now();
  // chatKeyをreqから逆引き
  const _req=_dbArr('requests').find(r=>r.coachId===cid&&r.teamId===tid&&r.status==='matched');
  const _ck=_req?Object.keys(DB.chats).find(k=>DB.chats[k].reqId===_req.id):'';
  _dbArr('payThreads').push({
    id:threadId, teamId:tid, coachId:cid,
    chatKey:_ck||'',
    status:isNeg?'pending_negotiation':'pending_contract',
    negotiable:isNeg,
    contractAmount:price,
    teamPays:price+teamFee+teamTax,
    coachReceives:price-Math.round(price*.1),
    month:new Date().toISOString().slice(0,7),
    createdAt:new Date().toISOString().slice(0,10),
    invoices:[],
    messages:[{from:'system',text:isNeg
      ?'マッチングが成立しました！\n💬 月額料金は未確定です。チャットで料金・指導内容を確認してください。\n合意後、コーチが「料金確定」ボタンで金額を設定し、指導完了後に請求書を発行してください。'
      :'マッチングが成立しました！コーチ代の請求・支払いはこのスレッドで行います。',
      time:new Date().toLocaleString('ja-JP')}]
  });
  saveDB();
}

// ==================== 本契約フロー ====================
// マッチング成立(matched) → チャットで相談 → チームが本契約申請(contract_requested) → コーチ承諾(contracted) → doMatch実行

function sendContractRequest(reqId){
  if(DB.currentUser?.role!=='team'){toast('チーム管理者のみ実行できます','e');return;}
  const req=_dbArr('requests').find(r=>r.id===reqId);
  if(!req||req.status!=='matched'){toast('マッチング済みの申請が見つかりません','e');return;}
  req.status='contract_requested';
  req.contractRequestedAt=new Date().toISOString();
  const coach=DB.coaches.find(c=>c.id===req.coachId);
  const team=DB.teams.find(t=>t.id===req.teamId);
  // コーチに通知
  addNotif(sanitize(team?.name||'チーム',15)+'から本契約の申請が届きました。確認してください。','fa-file-contract','chat',req.coachId);
  // チャットに通知
  const ck=Object.keys(DB.chats).find(k=>DB.chats[k].reqId===reqId);
  if(ck&&DB.chats[ck]){
    DB.chats[ck].msgs.push({mid:_genMsgId(),from:'system',name:'システム',
      text:sanitize(team?.name||'チーム',20)+'が本契約を申請しました。コーチは内容を確認し、承諾してください。',
      time:now_time(),date:new Date().toISOString().slice(0,10),read:false});
  }
  addAuditLog('contract_request','本契約申請: '+sanitize(team?.name||'',15)+' → '+sanitize(coach?.name||'',15),{reqId});
  saveDB();closeM();
  toast('本契約の申請を送信しました','s');
  refreshPage();
}

function acceptContract(reqId){
  if(DB.currentUser?.role!=='coach'){toast('コーチのみ実行できます','e');return;}
  const req=_dbArr('requests').find(r=>r.id===reqId);
  if(!req||req.status!=='contract_requested'){toast('契約申請が見つかりません','e');return;}
  req.status='contracted';
  req.contractedAt=new Date().toISOString();
  const coach=DB.coaches.find(c=>c.id===req.coachId);
  const team=DB.teams.find(t=>t.id===req.teamId);
  // 本契約成立 → doMatch(チーム・コーチ紐付け + 支払いスレッド作成)
  doMatch(req.teamId, req.coachId);
  // チームに通知
  addNotif(sanitize(coach?.name||'コーチ',15)+'が本契約を承諾しました。契約コーチとして登録されました。','fa-check-circle','threads',req.teamId);
  // チャットに通知
  const ck=Object.keys(DB.chats).find(k=>DB.chats[k].reqId===reqId);
  if(ck&&DB.chats[ck]){
    DB.chats[ck].msgs.push({mid:_genMsgId(),from:'system',name:'システム',
      text:'本契約が成立しました。'+sanitize(coach?.name||'コーチ',15)+'が'+sanitize(team?.name||'チーム',15)+'の契約コーチとして登録されました。\n\n料金の確定と指導開始は「お支払い」ページから行えます。',
      time:now_time(),date:new Date().toISOString().slice(0,10),read:false});
    DB.chats[ck].sub='本契約成立';
  }
  addAuditLog('contract_accept','本契約成立: '+sanitize(coach?.name||'',15)+' ↔ '+sanitize(team?.name||'',15),{reqId});
  saveDB();closeM();
  toast('本契約が成立しました','s');
  refreshPage();
}

function declineContract(reqId){
  const req=_dbArr('requests').find(r=>r.id===reqId);
  if(!req){toast('申請が見つかりません','e');return;}
  req.status='matched'; // マッチング状態に戻す
  const ck=Object.keys(DB.chats).find(k=>DB.chats[k].reqId===reqId);
  if(ck&&DB.chats[ck]){
    DB.chats[ck].msgs.push({mid:_genMsgId(),from:'system',name:'システム',
      text:'本契約の申請が見送られました。引き続きチャットでご相談いただけます。',
      time:now_time(),date:new Date().toISOString().slice(0,10),read:false});
  }
  saveDB();closeM();toast('契約申請を見送りました','s');refreshPage();
}

function openContractRequestModal(reqId){
  const req=_dbArr('requests').find(r=>r.id===reqId);
  if(!req){toast('申請が見つかりません','e');return;}
  const coach=DB.coaches.find(c=>c.id===req.coachId);
  const _trialInfo=req.trialCompleted?`<div style="padding:10px 14px;background:rgba(168,85,247,.06);border:1px solid rgba(168,85,247,.15);border-radius:10px;margin-bottom:12px;display:flex;align-items:center;gap:8px"><span style="font-size:18px">🧪</span><div><div style="font-size:12px;font-weight:700;color:#a855f7">トライアル完了済み</div><div style="font-size:11px;color:var(--txt3)">評価: ${'⭐'.repeat(req.trialRating||0)}</div></div></div>`:'';
  openM('本契約の申請',`
    <div style="text-align:center;margin-bottom:20px">
      <div style="font-size:36px;margin-bottom:12px"><i class="fas fa-file-contract" style="color:var(--org)"></i></div>
      <div style="font-size:16px;font-weight:800;margin-bottom:6px">${sanitize(coach?.name||'コーチ',20)} へ本契約を申請</div>
      <div style="font-size:12px;color:var(--txt3);line-height:1.7">
        コーチが承諾すると、契約コーチとして登録され<br>
        料金確定・指導開始・請求書発行のフローが始まります。
      </div>
    </div>
    ${_trialInfo}
    <div style="padding:14px;background:var(--surf2);border-radius:10px;margin-bottom:16px;font-size:12px;color:var(--txt2);line-height:1.7">
      <b>契約後のフロー:</b><br>
      1. コーチが料金を確定<br>
      2. コーチが指導を開始・完了報告<br>
      3. チームが指導完了を確認<br>
      4. コーチが請求書を発行 → チームが支払い
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-ghost flex-1" onclick="closeM()">キャンセル</button>
      <button class="btn btn-primary flex-1" onclick="sendContractRequest('${reqId}')">本契約を申請する</button>
    </div>
  `);
}

function openContractAcceptModal(reqId){
  const req=_dbArr('requests').find(r=>r.id===reqId);
  if(!req){toast('申請が見つかりません','e');return;}
  const team=DB.teams.find(t=>t.id===req.teamId);
  openM('本契約の確認',`
    <div style="text-align:center;margin-bottom:20px">
      <div style="font-size:36px;margin-bottom:12px"><i class="fas fa-handshake" style="color:var(--teal)"></i></div>
      <div style="font-size:16px;font-weight:800;margin-bottom:6px">${sanitize(team?.name||'チーム',20)} からの本契約申請</div>
      <div style="font-size:12px;color:var(--txt3);line-height:1.7">
        承諾すると、契約コーチとして登録されます。<br>
        料金確定・指導・請求のフローが利用可能になります。
      </div>
    </div>
    <div style="padding:14px;background:var(--surf2);border-radius:10px;margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="font-size:12px;color:var(--txt3)">チーム名</span>
        <span style="font-size:13px;font-weight:700">${sanitize(team?.name||'',20)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:12px;color:var(--txt3)">競技</span>
        <span style="font-size:13px;font-weight:700">${sanitize(team?.sport||'',15)}</span>
      </div>
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-ghost flex-1" onclick="declineContract('${reqId}')">見送る</button>
      <button class="btn btn-primary flex-1" onclick="acceptContract('${reqId}')">契約を承諾する</button>
    </div>
  `);
}

function openContractTemplate(){
  openM('業務委託契約書（雛形）',`
    <div style="padding:4px 0;margin-bottom:12px">
      <div style="font-size:10px;color:var(--org);font-weight:700;margin-bottom:8px;padding:6px 10px;background:rgba(249,115,22,.06);border-radius:6px;text-align:center">
        <i class="fas fa-info-circle"></i> この雛形は参考資料です。法的効力はありません。各項目を編集して印刷できます。
      </div>
    </div>
    <div style="padding:20px;background:#fff;border:1px solid #e2e8f0;border-radius:10px;font-size:12px;color:#334155;line-height:1.8;max-height:60vh;overflow-y:auto" id="contract-template-body">
      <div style="text-align:center;font-size:16px;font-weight:800;margin-bottom:20px;color:#0f172a">業務委託契約書</div>
      <p><input type="text" placeholder="（甲：チーム名）" style="border:none;border-bottom:1px dashed #94a3b8;font-size:12px;width:150px;padding:2px 4px;background:rgba(14,165,233,.04)">（以下「甲」という）と<input type="text" placeholder="（乙：コーチ名）" style="border:none;border-bottom:1px dashed #94a3b8;font-size:12px;width:150px;padding:2px 4px;background:rgba(14,165,233,.04)">（以下「乙」という）は、以下の通り業務委託契約を締結する。</p>
      <p style="font-weight:700;margin-top:14px">第1条（目的）</p>
      <p>甲は乙に対し、スポーツ指導業務（以下「本業務」という）を委託し、乙はこれを受託する。</p>
      <p style="font-weight:700;margin-top:14px">第2条（業務内容）</p>
      <p>1. 甲のチーム（<input type="text" placeholder="（競技名）" style="border:none;border-bottom:1px dashed #94a3b8;font-size:12px;width:100px;padding:2px 4px;background:rgba(14,165,233,.04)">）に対するスポーツ指導<br>2. 練習メニューの作成・指導<br>3. その他甲乙間で合意した業務</p>
      <p style="font-weight:700;margin-top:14px">第3条（契約期間）</p>
      <p>本契約の有効期間は、<input type="text" placeholder="（開始日）" style="border:none;border-bottom:1px dashed #94a3b8;font-size:12px;width:90px;padding:2px 4px;background:rgba(14,165,233,.04)">から<input type="text" placeholder="（期間）" style="border:none;border-bottom:1px dashed #94a3b8;font-size:12px;width:80px;padding:2px 4px;background:rgba(14,165,233,.04)">とする。ただし、期間満了の1ヶ月前までに甲乙いずれからも書面による解約の申し出がない場合、同一条件で自動更新されるものとする。</p>
      <p style="font-weight:700;margin-top:14px">第4条（報酬）</p>
      <p>1. 報酬額は月額 <input type="text" placeholder="（金額）" style="border:none;border-bottom:1px dashed #94a3b8;font-size:12px;width:90px;padding:2px 4px;background:rgba(14,165,233,.04)"> 円とする。<br>2. 甲はMyCOACH-MyTEAMプラットフォームを通じて乙に報酬を支払う。<br>3. 支払い時期は指導完了確認後とする。</p>
      <p style="font-weight:700;margin-top:14px">第5条（秘密保持）</p>
      <p>甲及び乙は、本契約に関連して知り得た相手方の秘密情報を、第三者に開示・漏洩してはならない。</p>
      <p style="font-weight:700;margin-top:14px">第6条（反社会的勢力の排除）</p>
      <p>甲及び乙は、自己が反社会的勢力に該当しないことを表明し、保証する。</p>
      <p style="font-weight:700;margin-top:14px">第7条（解約）</p>
      <p>甲又は乙は、<input type="text" placeholder="（期間）" style="border:none;border-bottom:1px dashed #94a3b8;font-size:12px;width:70px;padding:2px 4px;background:rgba(14,165,233,.04)">前の書面通知により、本契約を解約することができる。</p>
      <p style="font-weight:700;margin-top:14px">第8条（税務処理）</p>
      <p>1. 乙は個人事業主として本契約に基づく報酬を受領し、所得税の確定申告等の税務処理は乙の責任において行う。</p>
      <p>2. 消費税の取り扱いは、乙の課税事業者区分に応じて甲乙間で協議の上決定する。</p>
      <p>3. 適格請求書（インボイス）の発行が必要な場合は、乙の適格請求書発行事業者登録番号を甲に通知する。</p>
      <p style="font-weight:700;margin-top:14px">第9条（損害賠償）</p>
      <p>甲又は乙が本契約に違反し相手方に損害を与えた場合、直接かつ通常の損害を賠償する。賠償額の上限は過去12ヶ月間に甲が乙に支払った報酬の総額とする。</p>
      <p style="font-weight:700;margin-top:14px">第10条（準拠法）</p>
      <p>本契約は日本法に準拠する。</p>
      <div style="margin-top:30px;display:flex;justify-content:space-between">
        <div><div style="font-weight:700;margin-bottom:6px">甲（委託者）</div><div><input type="text" placeholder="（チーム名）" style="border:none;border-bottom:1px dashed #94a3b8;font-size:12px;width:140px;padding:2px 4px;background:rgba(14,165,233,.04)"></div><div style="margin-top:20px;border-top:1px solid #94a3b8;width:150px;padding-top:4px;font-size:10px;color:#94a3b8">署名・押印</div></div>
        <div><div style="font-weight:700;margin-bottom:6px">乙（受託者）</div><div><input type="text" placeholder="（コーチ名）" style="border:none;border-bottom:1px dashed #94a3b8;font-size:12px;width:140px;padding:2px 4px;background:rgba(14,165,233,.04)"></div><div style="margin-top:20px;border-top:1px solid #94a3b8;width:150px;padding-top:4px;font-size:10px;color:#94a3b8">署名・押印</div></div>
      </div>
      <div style="text-align:center;margin-top:20px;font-size:10px;color:#94a3b8">日付: <input type="text" placeholder="（日付）" style="border:none;border-bottom:1px dashed #94a3b8;font-size:10px;width:90px;padding:2px 4px;color:#94a3b8;background:rgba(14,165,233,.04)"></div>
    </div>
    <div style="display:flex;gap:8px;margin-top:14px">
      <button class="btn btn-ghost flex-1" onclick="closeM()">閉じる</button>
      <button class="btn btn-secondary flex-1" onclick="_printContractTemplate()"><i class="fas fa-print" style="margin-right:4px"></i>印刷/PDF保存</button>
    </div>
  `);
}

function _printContractTemplate(){
  var body=document.getElementById('contract-template-body');
  if(!body) return;
  var w=window.open('','_blank','width=800,height=900');
  w.document.write('<html><head><title>業務委託契約書</title><style>body{font-family:serif;padding:40px;font-size:14px;line-height:2;color:#000}p{margin:0 0 8px}</style></head><body>'+body.innerHTML+'</body></html>');
  w.document.close();
  w.print();
}

// ==================== TOAST & NOTIFY ====================
function toast(msg, type='i', duration=3200){
  const c=document.getElementById('toast-c');
  if(!c) return;
  const icons={s:'fa-check-circle',e:'fa-times-circle',i:'fa-info-circle',w:'fa-exclamation-triangle'};
  const colors={s:'var(--teal)',e:'#ef4444',i:'var(--org)',w:'var(--yel)'};
  const t=document.createElement('div');
  t.className=`toast ${type}`;
  t.style.cursor='pointer';
  t.title='クリックして閉じる';
  t.setAttribute('role', type==='e'?'alert':'status');
  t.setAttribute('aria-live', type==='e'?'assertive':'polite');
  // アイコン
  const ico=document.createElement('i');
  ico.className=`fa ${icons[type]||icons.i} ti`;
  // テキスト
  const sp=document.createElement('span');
  sp.textContent=msg;
  // 閉じるボタン
  const cls=document.createElement('span');
  cls.textContent='×';
  cls.style.cssText='margin-left:auto;color:var(--txt3);font-size:16px;line-height:1;padding-left:8px;flex-shrink:0';
  t.appendChild(ico); t.appendChild(sp); t.appendChild(cls);
  c.appendChild(t);
  // プログレスバー
  const pb=document.createElement('div');
  pb.style.cssText=`position:absolute;bottom:0;left:0;height:2px;border-radius:0 0 12px 12px;background:${colors[type]||colors.i};width:100%;transition:width ${duration}ms linear`;
  t.style.position='relative';
  t.style.overflow='hidden';
  t.appendChild(pb);
  setTimeout(()=>pb.style.width='0',30);
  // 消去
  const dismiss=()=>{
    t.style.opacity='0';t.style.transform='translateX(24px)';t.style.transition='all .25s';
    setTimeout(()=>t.remove(),260);
  };
  t.addEventListener('click',dismiss);
  setTimeout(dismiss, duration);
}

// ==================== PAYMENT THREADS ====================
function payThreadPage(){
  const u=DB.currentUser, role=u.role;
  let threads=[];
  if(role==='team'){const mt=getMyTeam();if(mt)threads=_dbArr('payThreads').filter(pt=>pt.teamId===mt.id);}
  else if(role==='coach'){const me=getMyCoach();if(me)threads=_dbArr('payThreads').filter(pt=>pt.coachId===me.id);}
  else threads=[...DB.payThreads];
  const pendingTotal=threads.reduce((s,pt)=>s+(pt.invoices||[]).filter(i=>i.status==='unpaid').length,0);
  const stMap={pending_negotiation:{l:'相談中',c:'var(--blue)'},pending_contract:{l:'契約確認中',c:'var(--yel)'},active:{l:'料金確定',c:'var(--teal)'},coaching:{l:'指導中',c:'#0ea5e9'},coaching_done:{l:'完了報告済',c:'#8b5cf6'},confirmed:{l:'チーム確認済',c:'var(--teal)'},payment_requested:{l:'お支払い待ち',c:'var(--org)'},paid:{l:'支払い完了',c:'var(--grn)'},completed:{l:'完了',c:'var(--txt3)'}};
  const threadCards=threads.map(pt=>{
    const team=DB.teams.find(t=>t.id===pt.teamId);
    const coach=DB.coaches.find(c=>c.id===pt.coachId);
    const st=stMap[pt.status]||stMap.active;
    const pending=(pt.invoices||[]).filter(i=>i.status==='unpaid');
    const lastMsg=(pt.messages||[]).slice(-1)[0];
    const lastTxt=lastMsg?(lastMsg.from==='system'?'🤖 ':'')+(lastMsg.text||'').slice(0,40):'メッセージなし';
    const _myAmt = role==='coach' ? pt.coachReceives : pt.teamPays;
    const amtLabel = role==='coach' ? '受取' : 'お支払い';
    return `<div class="thread-card" onclick="openThreadDetail('${pt.id}')" style="background:var(--surf);border:1px solid ${pending.length?'rgba(255,107,43,.3)':'var(--b1)'};border-radius:14px;padding:16px;margin-bottom:0;cursor:pointer;transition:all .15s">
      <div style="display:flex;align-items:center;gap:12px">
        <div class="avi" style="background:${coach?.color||'var(--org)'};width:44px;height:44px;font-size:17px;flex-shrink:0">${(coach?.name||'?')[0]}</div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:700;font-size:14px;margin-bottom:3px">${role==='coach'?team?.name||'チーム':coach?.name||'コーチ'}</div>
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
            <span style="font-size:10px;padding:2px 8px;border-radius:6px;background:${st.c}20;color:${st.c};font-weight:600">${st.l}</span>
            ${pending.length?`<span style="font-size:10px;padding:2px 8px;border-radius:6px;background:rgba(255,107,43,.12);color:var(--org);font-weight:700">${pending.length}件 未払い</span>`:''}
          </div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div style="font-size:10px;color:var(--txt3)">${amtLabel}</div>
          <div style="font-size:18px;font-weight:800;color:${role==='coach'?'var(--teal)':'var(--org)'};font-family:Montserrat,sans-serif">¥${fmtNum(_myAmt)}</div>
          <div style="font-size:10px;color:var(--txt3)">/月</div>
        </div>
      </div>
      ${lastTxt!=='メッセージなし'?`<div style="font-size:11px;color:var(--txt3);margin-top:8px;padding-top:8px;border-top:1px solid var(--b1);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">💬 ${lastTxt}</div>`:''}
    </div>`;
  }).join('');
  const emptyHtml=`<div class="empty-state">
    <div class="empty-state-icon">💬</div>
    <h3>まだお支払いはありません</h3>
    <div style="max-width:300px;margin:0 auto 20px;font-size:13px;color:var(--txt3);line-height:2">
      ${role==='team'
        ?'コーチとの契約が成立すると<br>ここからお支払いできます'
        :'チームとの契約が成立すると<br>ここで売上を管理できます'}
    </div>
    ${role==='team'?`<button class="btn btn-primary" onclick="goTo('coach-search')">🔍 コーチを探す</button>`:
      role==='coach'?`<button class="btn btn-primary" onclick="goTo('team-search')">🔍 チームを探す</button>`:
      ''}
  </div>`;
  return`<div class="pg-head flex justify-between items-center">
    <div><div class="pg-title">${role==='coach'?'売上・請求':'お支払い'}</div><div class="pg-sub">${pendingTotal>0?`<span style="color:var(--org);font-weight:700">${pendingTotal}件のお支払い待ちがあります</span>`:'お支払い履歴と管理'}</div></div>
    ${role==='coach'?`<button class="btn btn-primary btn-sm" onclick="openNewInvoiceModal(null,null)">📄 請求する</button>`:''}
  </div>
  <div style="display:flex;flex-direction:column;gap:10px">${threads.length===0?emptyHtml:threadCards}</div>`;
}

function renderPayThread(pt){
  const team=DB.teams.find(t=>t.id===pt.teamId);
  const coach=DB.coaches.find(c=>c.id===pt.coachId);
  const role=DB.currentUser?.role;
  const pendingInv=pt.invoices.filter(i=>i.status==='unpaid');
  const lastMsg=pt.messages[pt.messages.length-1];
  const stMap={pending_contract:{l:'⏳ 確認中',c:'var(--yel)'},active:{l:'✅ 契約中',c:'var(--teal)'},payment_requested:{l:'📄 お支払い待ち',c:'var(--org)'},paid:{l:'✓ 支払い完了',c:'var(--green)'},completed:{l:'完了',c:'var(--txt3)'}};
  const st=stMap[pt.status]||stMap.active;
  const amtLabel=role==='coach'
    ?`<span style="color:var(--teal);font-weight:700">¥${pt.coachReceives.toLocaleString()}</span>`
    :role==='team'
    ?`<span style="color:var(--org);font-weight:700">¥${pt.teamPays.toLocaleString()}</span>`
    :`<span style="color:var(--org);font-weight:700">¥${pt.teamPays.toLocaleString()}</span><span style="color:var(--txt3);margin:0 4px">→</span><span style="color:var(--teal);font-weight:700">¥${pt.coachReceives.toLocaleString()}</span>`;
  return`<div class="thread-card" onclick="openThreadDetail('${pt.id}')" style="padding:12px 16px">
    <div style="display:flex;align-items:center;gap:10px">
      <div class="avi" style="background:${coach?.color||'var(--org)'};width:36px;height:36px;font-size:14px;flex-shrink:0">${(coach?.name||'?')[0]}</div>
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
          <span class="fw7 text-sm">${coach?.name||'コーチ'} × ${team?.name||'チーム'}</span>
          <span style="font-size:10px;padding:1px 7px;border-radius:6px;background:${st.c}20;color:${st.c};border:1px solid ${st.c}40">${st.l}</span>
          ${pendingInv.length?`<span class="badge b-org" style="font-size:10px">未払${pendingInv.length}</span>`:''}
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:2px">
          <span class="text-xs text-muted">${pt.month}〜 /月</span>
          <span class="text-xs">${amtLabel}</span>
        </div>
        ${lastMsg?`<div class="text-xs text-muted" style="margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">💬 ${lastMsg.teamText||lastMsg.coachText||lastMsg.text||''}</div>`:''}
      </div>
      <div style="flex-shrink:0;color:var(--txt3);font-size:12px">›</div>
    </div>
  </div>`;
}

let activeThreadId=null;
function openThreadDetail(ptId){
  activeThreadId=ptId;
  const pt=_dbArr('payThreads').find(p=>p.id===ptId);
  if(!pt){toast('スレッドが見つかりません','e');return;}
  const team=DB.teams.find(t=>t.id===pt.teamId);
  const coach=DB.coaches.find(c=>c.id===pt.coachId);
  const role=DB.currentUser.role;
  const isCoach=role==='coach', isTeam=role==='team';
  const stMap={pending_negotiation:{l:'相談中',c:'var(--blue)',i:'<i class="fas fa-comments"></i>'},pending_contract:{l:'契約確認中',c:'var(--yel)',i:'<i class="fas fa-clock"></i>'},active:{l:'料金確定',c:'var(--teal)',i:'<i class="fas fa-check"></i>'},coaching:{l:'指導中',c:'#0ea5e9',i:'<i class="fas fa-chalkboard-user"></i>'},coaching_done:{l:'完了報告済',c:'#8b5cf6',i:'<i class="fas fa-clipboard-check"></i>'},confirmed:{l:'チーム確認済',c:'var(--teal)',i:'<i class="fas fa-check-double"></i>'},payment_requested:{l:'お支払い待ち',c:'var(--org)',i:'<i class="fas fa-file-invoice-dollar"></i>'},paid:{l:'支払い完了',c:'var(--grn)',i:'<i class="fas fa-circle-check"></i>'},completed:{l:'完了',c:'var(--txt3)',i:'<i class="fas fa-flag-checkered"></i>'}};
  const st=stMap[pt.status]||stMap.active;
  const feeRate=getFeeRate(pt.teamId,'coachFee');
  // 請求書リスト
  const invoicesHTML=!(pt.invoices||[]).length
    ?`<div style="text-align:center;padding:32px 16px;color:var(--txt3)">
        <div style="font-size:36px;margin-bottom:10px;opacity:.5">📄</div>
        <div style="font-size:13px;font-weight:600;margin-bottom:4px">請求書はまだありません</div>
        ${isCoach?'<div style="font-size:12px;color:var(--txt3)">上のボタンから請求書を発行してください</div>':'<div style="font-size:12px;color:var(--txt3)">コーチからの請求をお待ちください</div>'}
      </div>`
    :(pt.invoices||[]).map(inv=>{
      const isPending=inv.status==='unpaid';
      const isPaid=inv.status==='paid';
      return `<div style="padding:14px 16px;border-bottom:1px solid var(--b1);${isPending?'background:rgba(255,107,43,.04)':''}">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:${isPending&&isTeam?'12px':'0'}">
          <div style="flex:1;min-width:0">
            <div style="font-weight:700;font-size:15px">${inv.month}分</div>
            ${inv.note?`<div style="font-size:12px;color:var(--txt3);margin-top:2px">${sanitize(inv.note,60)}</div>`:''}
          </div>
          <div style="text-align:right;flex-shrink:0">
            ${isPaid?`<div style="font-size:11px;color:var(--teal);font-weight:600">✓ 支払い済み</div><div style="font-size:10px;color:var(--txt3)">${(inv.paidAt||'').slice(5,10)}</div>`
              :isPending?`<div style="font-size:11px;color:var(--org);font-weight:600">未払い</div>`:''}
            <div style="font-weight:800;font-size:18px;color:${isPaid?'var(--txt2)':isCoach?'var(--teal)':'var(--org)'};font-family:Montserrat,sans-serif;margin-top:2px">¥${fmtNum(isCoach?inv.coachReceives:inv.teamPays)}</div>
          </div>
        </div>
        ${isPending&&isTeam?`<button class="btn btn-primary w-full" onclick="event.stopPropagation();payInvoice('${ptId}','${inv.id}',event)" style="font-size:15px;padding:14px;border-radius:12px">💳 この請求を支払う</button>`:''}
      </div>`;
    }).join('');
  // 支払いサマリー
  const paidCount=(pt.invoices||[]).filter(i=>i.status==='paid').length;
  const pendingCount=(pt.invoices||[]).filter(i=>i.status==='unpaid').length;
  const totalPaid=(pt.invoices||[]).filter(i=>i.status==='paid').reduce((s,i)=>s+(isCoach?i.coachReceives:i.teamPays),0);
  // チャット
  // チャットルームのメッセージも統合表示
  const _ck2=pt.chatKey||Object.keys(DB.chats).find(k=>{const c=DB.chats[k];return c.type==='match'&&c.coachId===pt.coachId&&c.teamId===pt.teamId;});
  // chatKeyが逆引きで見つかった場合は永続化
  if(_ck2&&!pt.chatKey){pt.chatKey=_ck2;saveDB();}
  // チャットメッセージを統合（fromThread=trueは除外して重複防止）
  const chatMsgs=(_ck2&&DB.chats[_ck2])?(DB.chats[_ck2].msgs||[]).filter(m=>!m.fromThread).map(m=>({
    from:m.from===pt.coachId?'coach':m.from===pt.teamId?'team':m.from==='system'?'system':'other',
    text:(m.text||''),
    time:m.time||'',
    isoTime:m.date?(m.date+'T'+(m.time||'00:00')):('9999'+m.time), // ISO化してソート可能に
    chatName:m.name||'',
    isChat:true
  })):[];
  // pt.messagesにもisoTimeを補完
  const threadMsgs=(pt.messages||[]).map(m=>({...m,isChat:false,isoTime:m.isoTime||m.time||''}));
  const allMsgs=[...threadMsgs,...chatMsgs].sort((a,b)=>(a.isoTime||a.time||'')>(b.isoTime||b.time||'')?1:-1);
  const msgsHTML=allMsgs.map(m=>{
    if(m.from==='system') return`<div class="tmsg-sys">🤖 ${sanitize(m.text||'',300)}</div>`;
    const isMine=m.from===role||(isCoach&&m.from==='coach')||(isTeam&&m.from==='team');
    const senderName=m.chatName||(m.from==='coach'?'コーチ':m.from==='team'?'チーム':'');
    return`<div class="tmsg-wrap ${isMine?'tmsg-mine':'tmsg-theirs'}">
      ${!isMine?`<div style="font-size:10px;color:var(--txt3);margin-bottom:2px">${senderName}${m.isChat?' <span style="opacity:.5">💬チャット</span>':''}</div>`:''}
      <div class="tmsg-bubble">${sanitize(m.text||'',300).replace(/\\n/g,'<br>')}</div>
      <div class="tmsg-time">${(m.time||'').slice(0,16)}</div>
    </div>`;
  }).join('');
  document.getElementById('page-body').innerHTML=`<div class="page">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap">
      <button onclick="goTo('threads')" style="display:flex;align-items:center;gap:6px;background:var(--surf2);border:1px solid var(--bdr);border-radius:10px;padding:8px 14px;color:var(--txt2);font-size:13px;font-weight:600;cursor:pointer">← 一覧</button>
      <div style="flex:1;min-width:0">
        <div style="font-weight:800;font-size:15px">${coach?.name||'コーチ'} × ${team?.name||'チーム'}</div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:2px">
          <span style="font-size:12px;padding:2px 8px;border-radius:6px;background:${st.c}20;color:${st.c};border:1px solid ${st.c}40">${st.i} ${st.l}</span>
          <span style="font-size:11px;color:var(--txt3)">${pt.month}〜</span>
        </div>
      </div>
      ${isCoach&&pt.negotiable&&pt.status==='pending_negotiation'?`<button class="btn btn-primary btn-sm" onclick="openSetPriceModal('${ptId}')">料金を確定する</button>`:''}
      ${isCoach&&pt.status==='active'?`<button class="btn btn-primary btn-sm" onclick="openStartCoachingModal('${ptId}')">指導を開始する</button>`:''}
      ${isCoach&&pt.status==='coaching'?`<button class="btn btn-primary btn-sm" onclick="openCoachingReportModal('${ptId}')">指導完了を報告</button>`:''}
      ${isTeam&&pt.status==='coaching_done'?`<button class="btn btn-primary btn-sm" onclick="confirmCoachingReceived('${ptId}')">指導を確認する</button>`:''}
      ${isCoach&&(pt.status==='confirmed'||pt.status==='active'&&(pt.invoices||[]).length>0)?`<button class="btn btn-primary btn-sm" onclick="openNewInvoiceModal('${ptId}',event)">請求書を発行</button>`:''}
      ${_ck2?`<button class="btn btn-ghost btn-sm" onclick="activeRoom='${_ck2}';goTo('chat')">チャットを開く</button>`:''}
    </div>
    ${_coachingStepperHTML(pt)}
    <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap">
      <div style="flex:1;min-width:100px;background:var(--surf);border:1px solid var(--b1);border-radius:12px;padding:14px;text-align:center">
        <div style="font-size:11px;color:var(--txt3);margin-bottom:4px">${isCoach?'月額の受取':'月額のお支払い'}</div>
        <div style="font-size:22px;font-weight:800;color:${isCoach?'var(--teal)':'var(--org)'};font-family:Montserrat,sans-serif">¥${fmtNum(isCoach?pt.coachReceives:pt.teamPays)}</div>
      </div>
      ${pendingCount>0?`<div style="flex:1;min-width:100px;background:rgba(255,107,43,.06);border:1.5px solid rgba(255,107,43,.3);border-radius:12px;padding:14px;text-align:center">
        <div style="font-size:11px;color:var(--org);margin-bottom:4px">未払い</div>
        <div style="font-size:22px;font-weight:800;color:var(--org);font-family:Montserrat,sans-serif">${pendingCount}件</div>
      </div>`:
      `<div style="flex:1;min-width:100px;background:var(--surf);border:1px solid var(--b1);border-radius:12px;padding:14px;text-align:center">
        <div style="font-size:11px;color:var(--txt3);margin-bottom:4px">累計</div>
        <div style="font-size:22px;font-weight:800;color:var(--teal);font-family:Montserrat,sans-serif">¥${fmtNum(totalPaid)}</div>
      </div>`}
    </div>
    ${pt.status==='pending_negotiation'?`<div style="background:rgba(14,165,233,.08);border:1px solid rgba(14,165,233,.25);border-radius:12px;padding:16px 18px;margin-bottom:14px">
      <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
        <div style="font-size:28px">💬</div>
        <div style="flex:1;min-width:180px">
          <div style="font-weight:700;font-size:14px;color:var(--txt1)">💬 料金を相談中です</div>
          <div style="font-size:12px;color:var(--txt3);margin-top:2px;line-height:1.6">${isCoach?'チームとチャットで料金を決めてください。決まったら「料金を確定する」ボタンを押してください。':'コーチと料金を相談中です。確定したら通知が届きます。'}</div>
        </div>
      </div>
      ${isCoach?`<button class="btn btn-primary w-full" style="margin-top:12px" onclick="openSetPriceModal('${ptId}')">💰 料金を確定する</button>`:``}
    </div>`:``}
    ${isTeam&&pendingCount>0?`<div style="background:rgba(255,107,43,.08);border:1px solid rgba(255,107,43,.25);border-radius:12px;padding:14px 18px;margin-bottom:14px;display:flex;align-items:center;gap:14px;flex-wrap:wrap">
      <div style="font-size:28px">💳</div>
      <div style="flex:1;min-width:180px">
        <div style="font-weight:700;font-size:14px;color:var(--txt1)">未払いの請求書が ${pendingCount}件 あります</div>
        <div style="font-size:12px;color:var(--txt3);margin-top:2px">下の請求書一覧から「支払う」ボタンで決済してください</div>
      </div>
    </div>`:''}
    ${pt.status==='active'&&isCoach?`<div style="background:rgba(14,165,233,.08);border:1px solid rgba(14,165,233,.25);border-radius:12px;padding:14px 18px;margin-bottom:14px;display:flex;align-items:center;gap:14px;flex-wrap:wrap">
      <div style="font-size:28px"><i class="fas fa-play-circle" style="color:#0ea5e9"></i></div>
      <div style="flex:1;min-width:180px">
        <div style="font-weight:700;font-size:14px;color:var(--txt1)">料金が確定しました</div>
        <div style="font-size:12px;color:var(--txt3);margin-top:2px;line-height:1.6">指導を開始する準備ができたら「指導を開始する」ボタンを押してください。</div>
      </div>
    </div>`:``}
    ${pt.status==='active'&&isTeam?`<div style="background:rgba(14,165,233,.08);border:1px solid rgba(14,165,233,.25);border-radius:12px;padding:14px 18px;margin-bottom:14px;display:flex;align-items:center;gap:14px;flex-wrap:wrap">
      <div style="font-size:28px"><i class="fas fa-clock" style="color:#0ea5e9"></i></div>
      <div style="flex:1;min-width:180px">
        <div style="font-weight:700;font-size:14px;color:var(--txt1)">コーチの指導開始をお待ちください</div>
        <div style="font-size:12px;color:var(--txt3);margin-top:2px">料金が確定しました。コーチが指導を開始すると通知が届きます。</div>
      </div>
    </div>`:``}
    ${pt.status==='coaching'?`<div style="background:rgba(14,165,233,.08);border:1px solid rgba(14,165,233,.25);border-radius:12px;padding:14px 18px;margin-bottom:14px;display:flex;align-items:center;gap:14px;flex-wrap:wrap">
      <div style="font-size:28px"><i class="fas fa-chalkboard-user" style="color:#0ea5e9"></i></div>
      <div style="flex:1;min-width:180px">
        <div style="font-weight:700;font-size:14px;color:#0ea5e9">指導中</div>
        <div style="font-size:12px;color:var(--txt3);margin-top:2px;line-height:1.6">${isCoach?'指導が完了したら「指導完了を報告」ボタンで報告してください。':'コーチが指導を実施中です。完了後に報告が届きます。'}</div>
      </div>
    </div>`:``}
    ${pt.status==='coaching_done'?`<div style="background:rgba(139,92,246,.08);border:1px solid rgba(139,92,246,.25);border-radius:12px;padding:14px 18px;margin-bottom:14px;display:flex;align-items:center;gap:14px;flex-wrap:wrap">
      <div style="font-size:28px"><i class="fas fa-clipboard-check" style="color:#8b5cf6"></i></div>
      <div style="flex:1;min-width:180px">
        <div style="font-weight:700;font-size:14px;color:#8b5cf6">コーチが指導完了を報告しました</div>
        <div style="font-size:12px;color:var(--txt3);margin-top:2px;line-height:1.6">${isTeam?'内容を確認して「指導を確認する」ボタンを押してください。確認後、コーチが請求書を発行できます。':'チーム管理者の確認をお待ちください。確認後に請求書を発行できます。'}${pt.coachingReport?'<br><b>報告:</b> '+sanitize(pt.coachingReport,200):''}</div>
      </div>
      ${isTeam?`<button class="btn btn-primary btn-sm" style="flex-shrink:0" onclick="confirmCoachingReceived('${ptId}')">指導を確認する</button>`:``}
    </div>`:``}
    ${pt.status==='confirmed'&&isCoach?`<div style="background:rgba(0,207,170,.08);border:1px solid rgba(0,207,170,.25);border-radius:12px;padding:14px 18px;margin-bottom:14px;display:flex;align-items:center;gap:14px;flex-wrap:wrap">
      <div style="font-size:28px"><i class="fas fa-file-invoice-dollar" style="color:var(--teal)"></i></div>
      <div style="flex:1;min-width:180px">
        <div style="font-weight:700;font-size:14px;color:var(--teal)">チームが指導を確認しました</div>
        <div style="font-size:12px;color:var(--txt3);margin-top:2px">「請求書を発行」ボタンから今月分の指導料を請求してください。</div>
      </div>
    </div>`:``}
    <div style="display:flex;gap:4px;background:var(--surf2);border-radius:10px;padding:3px;margin-bottom:14px">
      <button onclick="switchThreadTab('invoices')" id="tab-invoices" class="btn btn-xs" style="flex:1;border-radius:8px;padding:8px;font-size:13px;font-weight:600;background:var(--org);color:#fff">📄 お支払い明細${pendingCount>0?' ('+pendingCount+'件)':''}</button>
      <button onclick="switchThreadTab('chat')" id="tab-chat" class="btn btn-xs" style="flex:1;border-radius:8px;padding:8px;font-size:13px;font-weight:600;background:transparent;color:var(--txt2)">💬 メッセージ</button>
    </div>
    <div id="thread-panel-invoices" style="background:var(--surf);border:1px solid var(--bdr);border-radius:14px;overflow:hidden">
      <div style="overflow-y:auto;max-height:500px">${invoicesHTML}</div>
    </div>
    <div id="thread-panel-chat" style="display:none;background:var(--surf);border:1px solid var(--bdr);border-radius:14px;overflow:hidden">
      <div class="tmsg-area" id="tmsgs-${ptId}" style="min-height:250px;max-height:450px">${msgsHTML}</div>
      <div style="padding:12px;border-top:1px solid var(--bdr);display:flex;gap:8px;align-items:flex-end">
        <textarea id="tinput-${ptId}" placeholder="メッセージを入力… (Enter送信)" maxlength="500" rows="1"
          onkeydown="if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();sendThreadMsg('${ptId}')}"
          oninput="this.style.height='auto';this.style.height=Math.min(this.scrollHeight,80)+'px'"
          style="flex:1;resize:none;border:1px solid var(--bdr);background:var(--surf2);border-radius:10px;padding:10px 12px;color:var(--txt1);font-size:13px;line-height:1.5"></textarea>
        <button class="btn btn-primary" onclick="sendThreadMsg('${ptId}')" style="padding:10px 18px;flex-shrink:0;border-radius:10px">送信</button>
      </div>
    </div>
  </div>`;
  setTimeout(()=>{const el=document.getElementById('tmsgs-'+ptId);if(el)el.scrollTop=el.scrollHeight;},80);
}
function switchThreadTab(tab){
  const invP=document.getElementById('thread-panel-invoices');
  const chatP=document.getElementById('thread-panel-chat');
  const tI=document.getElementById('tab-invoices');
  const tC=document.getElementById('tab-chat');
  if(!invP||!chatP)return;
  if(tab==='invoices'){
    invP.style.display='';chatP.style.display='none';
    tI.style.background='var(--org)';tI.style.color='#fff';
    tC.style.background='transparent';tC.style.color='var(--txt2)';
  } else {
    invP.style.display='none';chatP.style.display='';
    tC.style.background='var(--org)';tC.style.color='#fff';
    tI.style.background='transparent';tI.style.color='var(--txt2)';
    setTimeout(()=>{const el=document.querySelector('.tmsg-area');if(el)el.scrollTop=el.scrollHeight;},50);
  }
}
function sendThreadMsg(ptId){
  const inp=document.getElementById('tinput-'+ptId);
  const text=(inp?.value||'').trim();
  if(!text)return;
  const pt=_dbArr('payThreads').find(p=>p.id===ptId);
  if(!pt){toast('スレッドが見つかりません','e');return;}
  const role=DB.currentUser.role;
  const isoNow=new Date().toISOString();
  const time=new Date().toLocaleString('ja-JP');
  if(!pt.messages)pt.messages=[];
  pt.messages.push({from:role,text,time,isoTime:isoNow});
  // チャットルームにも同期
  const ck=pt.chatKey||Object.keys(DB.chats).find(k=>{
    const c=DB.chats[k];
    return c.type==='match'&&c.coachId===pt.coachId&&c.teamId===pt.teamId;
  });
  if(ck&&DB.chats[ck]){
    const senderName=role==='coach'?(DB.coaches.find(c=>c.id===pt.coachId)?.name||'コーチ'):(DB.teams.find(t=>t.id===pt.teamId)?.name||'チーム');
    DB.chats[ck].msgs.push({mid:_genMsgId(),from:DB.currentUser.id,name:sanitize(senderName,30),text:sanitize('💬 '+text,2000),time:now_time(),date:isoNow.slice(0,10),read:false,fromThread:true});
    DB.chats[ck].unread=(DB.chats[ck].unread||0)+1;
    if(!pt.chatKey){pt.chatKey=ck;} // chatKey永続化
  }
  inp.value='';
  saveDB();
  const area=document.getElementById('tmsgs-'+ptId);
  if(area){
    const div=document.createElement('div');
    div.className='tmsg-wrap tmsg-mine';
    div.innerHTML=`<div class="tmsg-bubble">${sanitize(text,300)}</div><div class="tmsg-time">${time.slice(0,16)}</div>`;
    area.appendChild(div);
    area.scrollTop=area.scrollHeight;
  }
}

// 料金確定モーダル（ご相談後にコーチが金額を設定）
function openSetPriceModal(ptId){
  const pt=_dbArr('payThreads').find(p=>p.id===ptId);
  if(!pt){toast('スレッドが見つかりません','e');return;}
  const team=DB.teams.find(t=>t.id===pt.teamId);
  const isOnetime=pt.contractType==='onetime';
  openM('💰 料金を確定する',`<div>
    <div style="font-size:13px;color:var(--txt2);line-height:1.7;margin-bottom:16px">
      ${team?team.name:'チーム'}との${isOnetime?'都度':'月額'}料金を確定します。<br>
      チャットで合意した金額を入力してください。
    </div>
    <div class="form-group" style="margin-bottom:12px">
      <label class="label">${isOnetime?'都度払い報酬額（円）':'月額料金（円）'}</label>
      <input id="sp-amount" class="input" type="number" min="1000" max="9999999" placeholder="例: ${isOnetime?'15000':'50000'}" style="font-size:16px;font-weight:700">
    </div>
    <div style="background:var(--surf2);border-radius:10px;padding:12px 14px;margin-bottom:16px">
      <div style="font-size:11px;color:var(--txt3)">手数料10%を差し引いた金額があなたの受取額になります</div>
      <div style="font-size:11px;color:var(--txt3);margin-top:4px">例: ¥50,000 → 受取: ¥45,000</div>
    </div>
    <div class="form-group" style="margin-bottom:14px">
      <label class="label">備考（任意）</label>
      <input id="sp-note" class="input" placeholder="例: 週2回のGK指導" maxlength="100">
    </div>
    <div style="display:flex;gap:10px">
      <button class="btn btn-primary" style="flex:1" onclick="confirmSetPrice('${ptId}')">✓ 料金を確定する</button>
      <button class="btn btn-ghost" onclick="closeM()">キャンセル</button>
    </div>
  </div>`);
}
function confirmSetPrice(ptId){
  const pt=_dbArr('payThreads').find(p=>p.id===ptId);
  if(!pt){toast('スレッドが見つかりません','e');return;}
  const amount=parseInt(document.getElementById('sp-amount')?.value)||0;
  if(amount<1000){toast('1,000円以上で入力してください','e');return;}
  const note=(document.getElementById('sp-note')?.value||'').trim();
  const feeRate=getFeeRate(pt.teamId,'coachFee');
  const fee=getFeeAmount(amount,pt.teamId,'coachFee');
  pt.contractAmount=amount;
  pt.teamPays=amount+Math.round(amount*feeRate/100)+Math.round(amount*feeRate/100*0.1);
  pt.coachReceives=amount-fee;
  pt.status='active';
  pt.negotiable=false;
  if(!pt.messages)pt.messages=[];
  pt.messages.push({from:'system',text:`💰 料金が確定されました！\n${pt.contractType==='onetime'?'都度払い':'月額'}料金: ¥${amount.toLocaleString()}\nコーチ受取: ¥${(amount-fee).toLocaleString()}${note?'\n📝 '+note:''}\n\n指導完了後、「📄 請求書を発行」ボタンから請求してください。`,time:new Date().toLocaleString('ja-JP')});
  // チャットにも通知
  const ck=pt.chatKey||Object.keys(DB.chats).find(k=>{const c=DB.chats[k];return c.type==='match'&&c.coachId===pt.coachId&&c.teamId===pt.teamId;});
  if(ck&&DB.chats[ck]){
    const coach=DB.coaches.find(c=>c.id===pt.coachId);
    DB.chats[ck].msgs.push({mid:_genMsgId(),from:'system',name:'システム',text:`💰 ${coach?.name||'コーチ'}が料金を確定しました。\n${pt.contractType==='onetime'?'都度払い':'月額'}料金: ¥${amount.toLocaleString()}${note?' ('+note+')':''}`,time:now_time(),read:false,date:new Date().toISOString().slice(0,10)});
  }
  saveDB();
  closeM();
  toast('料金を確定しました！','s');
  // チーム・コーチ双方に通知
  const _teamForNotif=DB.teams.find(t=>t.id===pt.teamId);
  const _coachForNotif=DB.coaches.find(c=>c.id===pt.coachId);
  addNotif(`💰 ${_coachForNotif?.name||'コーチ'}が料金を確定しました（¥${amount.toLocaleString()}/月）`,'fa-yen-sign','threads',_teamForNotif?.id||pt.teamId);
  addNotif(`💰 料金を確定しました（¥${amount.toLocaleString()}/月）`,'fa-check','threads',pt.coachId);
  addAuditLog('price_confirm',`${_coachForNotif?.name||'コーチ'}が料金確定: ¥${amount.toLocaleString()}`,{ptId,amount});
  openThreadDetail(ptId);
}

function payInvoice(ptId,invId,e){
  if(e){e.stopPropagation();e.preventDefault();}
  const pt=_dbArr('payThreads').find(p=>p.id===ptId);
  const inv=pt&&(pt.invoices||[]).find(i=>i.id===invId);
  if(!inv){toast('請求書が見つかりません','e');return;}
  openM('💳 支払い確認',`<div style="text-align:center;padding:8px 0">
    <div style="font-size:42px;margin-bottom:12px">💳</div>
    <div style="font-weight:700;font-size:15px;margin-bottom:6px">${inv.month}分 指導料</div>
    <div style="font-size:38px;font-weight:900;color:var(--org);font-family:Montserrat,sans-serif;margin:14px 0">¥${fmtNum(inv.teamPays)}</div>
    <div style="font-size:12px;color:var(--txt3);margin-bottom:20px">支払い後、コーチへ <b style="color:var(--teal)">¥${fmtNum(inv.coachReceives)}</b> が送金されます</div>
    <div style="display:flex;gap:10px;justify-content:center">
      <button class="btn btn-primary" onclick="confirmPayment('${ptId}','${invId}')">🔒 安全に支払う</button>
      <button class="btn btn-ghost" onclick="closeM()">キャンセル</button>
    </div>
  </div>`);
}

async function confirmPayment(ptId, invId){
  const pt  = _dbArr('payThreads').find(p => p.id === ptId);
  const inv = pt && (pt.invoices||[]).find(i => i.id === invId);
  if(!inv) return;
  const btn = document.querySelector('#overlay .btn-primary');
  if(btn){ btn.disabled=true; btn.innerHTML='⏳ 処理中...'; }

  // Stripe本番モード
  if(typeof API_BASE !== 'undefined' && API_BASE && !API_BASE.includes('localhost') && !API_BASE.includes('127.0.0.1')){
    const coach=DB.coaches.find(c=>c.id===pt.coachId);
    const team=DB.teams.find(t=>t.id===pt.teamId);
    try {
      const res=await fetch(`${API_BASE}/create-coach-payment-session`,{
        method:'POST',headers:await _apiHeaders(),
        body:JSON.stringify({coachName:coach?.name||'コーチ',teamName:team?.name||'チーム',
          amount:pt.contractAmount,month:inv.month,coachId:pt.coachId,teamId:pt.teamId,threadId:pt.id,
          feeRate:getFeeRate(pt.teamId,'coachFee')}),
      });
      if(!res.ok)throw new Error((await res.json().catch(()=>({}))).error||`HTTP ${res.status}`);
      const data=await res.json();
      if(!data.sessionUrl)throw new Error('決済URLが取得できませんでした');
      toast('Stripeの決済画面に移動します...','i');
      setTimeout(()=>{if(data.sessionUrl&&data.sessionUrl.startsWith('https://checkout.stripe.com'))window.open(data.sessionUrl,'_blank');else toast('不正なURLです','e');},400);
      return;
    } catch(err){
      if(btn){btn.disabled=false;btn.innerHTML='🔒 安全に支払う';}
      toast('決済処理に失敗しました','e');
      return;
    }
  }

  // デモ・開発モード（Stripe未接続時はローカルDB更新）
  await new Promise(r=>setTimeout(r,800));
  inv.status='paid';
  inv.paidAt=new Date().toISOString().slice(0,10);
  pt.status='active';
  const _payIsoNow=new Date().toISOString();
  if(!pt.messages)pt.messages=[];
  pt.messages.push({from:'system',text:`${inv.month}分の指導料（¥${fmtNum(inv.teamPays)}）の支払いが完了しました。`,time:new Date().toLocaleString('ja-JP'),isoTime:_payIsoNow});
  _dbArr('payments').push({id:'pay'+Date.now(),teamId:pt.teamId,coachId:pt.coachId,
    amount:inv.teamPays,fee:Math.round(inv.teamPays-inv.coachReceives),
    month:inv.month,status:'paid',paidAt:inv.paidAt,threadId:ptId});
  
  // コーチに通知
  const _payCoach=DB.coaches.find(c=>c.id===pt.coachId);
  const _payTeam=DB.teams.find(t=>t.id===pt.teamId);
  addNotif(`✅ ${_payTeam?.name||'チーム'}から${inv.month}分の支払いが完了しました（¥${fmtNum(inv.coachReceives)}）`,'fa-check-circle','threads',pt.coachId);
  addNotif(`✅ ${inv.month}分の支払いが完了しました`,'fa-check-circle','threads');
  
  // チャットルームに通知
  const _payCk=pt.chatKey||Object.keys(DB.chats).find(k=>{const c=DB.chats[k];return c.type==='match'&&c.coachId===pt.coachId&&c.teamId===pt.teamId;});
  if(_payCk&&DB.chats[_payCk]){
    DB.chats[_payCk].msgs.push({mid:_genMsgId(),from:'system',name:'システム',text:`✅ ${inv.month}分の指導料（¥${fmtNum(inv.teamPays)}）の支払いが完了しました。\nコーチへ ¥${fmtNum(inv.coachReceives)} が送金されます。`,time:now_time(),date:_payIsoNow.slice(0,10),read:false});
    if(!pt.chatKey)pt.chatKey=_payCk;
  }
  
  // メール通知
  if(_payCoach?.email) notifyByEmail('payment_complete',{email:_payCoach.email,name:_payCoach.name},{teamName:_payTeam?.name||'チーム',month:inv.month,amount:fmtNum(inv.coachReceives)});
  
  saveDB();
  closeM();
  toast('✅ 支払いが完了しました！','s');
  addAuditLog('payment_complete',`${_payTeam?.name||'チーム'}→${_payCoach?.name||'コーチ'} ¥${fmtNum(inv.teamPays)}`,{ptId,invId,amount:inv.teamPays});
  openThreadDetail(ptId);
}

// ==================== 指導ワークフロー ====================
// マッチング成立後のスキーム:
// active(料金確定) → coaching(指導中) → coaching_done(完了報告) → confirmed(チーム確認) → payment_requested(請求) → paid(支払完了) → active(次月)

function startCoaching(ptId){
  const pt=_dbArr('payThreads').find(p=>p.id===ptId);
  if(!pt){toast('スレッドが見つかりません','e');return;}
  if(DB.currentUser?.role!=='coach'){toast('コーチのみ実行できます','e');return;}
  pt.status='coaching';
  pt.coachingStartedAt=new Date().toISOString();
  if(!pt.messages)pt.messages=[];
  pt.messages.push({from:'system',text:'コーチが指導を開始しました。指導完了後に「指導完了報告」を行ってください。',time:new Date().toLocaleString('ja-JP'),isoTime:new Date().toISOString()});
  const team=DB.teams.find(t=>t.id===pt.teamId);
  const coach=DB.coaches.find(c=>c.id===pt.coachId);
  addNotif(sanitize(coach?.name||'コーチ',15)+'が指導を開始しました','fa-play-circle','threads',team?.id||pt.teamId);
  const ck=pt.chatKey||Object.keys(DB.chats).find(k=>{const c=DB.chats[k];return c.type==='match'&&c.coachId===pt.coachId&&c.teamId===pt.teamId;});
  if(ck&&DB.chats[ck]){
    DB.chats[ck].msgs.push({mid:_genMsgId(),from:'system',name:'システム',text:sanitize(coach?.name||'コーチ',15)+'が指導を開始しました。',time:now_time(),date:new Date().toISOString().slice(0,10),read:false});
  }
  saveDB();closeM();toast('指導開始を記録しました','s');openThreadDetail(ptId);
}

function reportCoachingComplete(ptId){
  const pt=_dbArr('payThreads').find(p=>p.id===ptId);
  if(!pt){toast('スレッドが見つかりません','e');return;}
  if(DB.currentUser?.role!=='coach'){toast('コーチのみ実行できます','e');return;}
  const report=(document.getElementById('coaching-report')?.value||'').trim();
  pt.status='coaching_done';
  pt.coachingCompletedAt=new Date().toISOString();
  pt.coachingReport=report;
  if(!pt.messages)pt.messages=[];
  pt.messages.push({from:'coach',text:'指導完了を報告しました。'+(report?'\n--- 報告内容 ---\n'+report:''),time:new Date().toLocaleString('ja-JP'),isoTime:new Date().toISOString()});
  const team=DB.teams.find(t=>t.id===pt.teamId);
  const coach=DB.coaches.find(c=>c.id===pt.coachId);
  addNotif(sanitize(coach?.name||'コーチ',15)+'が指導完了を報告しました。確認をお願いします。','fa-clipboard-check','threads',team?.id||pt.teamId);
  const ck=pt.chatKey||Object.keys(DB.chats).find(k=>{const c=DB.chats[k];return c.type==='match'&&c.coachId===pt.coachId&&c.teamId===pt.teamId;});
  if(ck&&DB.chats[ck]){
    DB.chats[ck].msgs.push({mid:_genMsgId(),from:'system',name:'システム',text:sanitize(coach?.name||'コーチ',15)+'が指導完了を報告しました。チーム管理者は確認をお願いします。',time:now_time(),date:new Date().toISOString().slice(0,10),read:false});
  }
  saveDB();closeM();toast('指導完了を報告しました','s');openThreadDetail(ptId);
}

function confirmCoachingReceived(ptId){
  const pt=_dbArr('payThreads').find(p=>p.id===ptId);
  if(!pt){toast('スレッドが見つかりません','e');return;}
  if(DB.currentUser?.role!=='team'&&DB.currentUser?.role!=='admin'){toast('チーム管理者のみ実行できます','e');return;}
  pt.status='confirmed';
  pt.teamConfirmedAt=new Date().toISOString();
  if(!pt.messages)pt.messages=[];
  pt.messages.push({from:'system',text:'チームが指導完了を確認しました。コーチは請求書を発行してください。',time:new Date().toLocaleString('ja-JP'),isoTime:new Date().toISOString()});
  const coach=DB.coaches.find(c=>c.id===pt.coachId);
  addNotif('チームが指導完了を確認しました。請求書を発行してください。','fa-file-invoice-dollar','threads',pt.coachId);
  const ck=pt.chatKey||Object.keys(DB.chats).find(k=>{const c=DB.chats[k];return c.type==='match'&&c.coachId===pt.coachId&&c.teamId===pt.teamId;});
  if(ck&&DB.chats[ck]){
    DB.chats[ck].msgs.push({mid:_genMsgId(),from:'system',name:'システム',text:'チームが指導完了を確認しました。コーチは請求書を発行できます。',time:now_time(),date:new Date().toISOString().slice(0,10),read:false});
  }
  saveDB();toast('指導完了を確認しました','s');openThreadDetail(ptId);
}

function openCoachingReportModal(ptId){
  openM('指導完了報告',`
    <div style="margin-bottom:14px;font-size:13px;color:var(--txt2);line-height:1.7">
      指導内容の概要を記録してください。チーム管理者が確認後、請求書を発行できるようになります。
    </div>
    <div class="form-group">
      <label class="label">報告内容（任意）</label>
      <textarea id="coaching-report" class="input" rows="4" placeholder="例: 基礎練習・ポジショニング指導を実施。参加者12名。"></textarea>
    </div>
    <button class="btn btn-primary w-full" onclick="reportCoachingComplete('${ptId}')">指導完了を報告する</button>
  `);
}

function openStartCoachingModal(ptId){
  const pt=_dbArr('payThreads').find(p=>p.id===ptId);
  const team=DB.teams.find(t=>t.id===pt?.teamId);
  openM('指導開始の確認',`
    <div style="text-align:center;margin-bottom:20px">
      <div style="font-size:40px;margin-bottom:12px"><i class="fas fa-play-circle" style="color:var(--teal)"></i></div>
      <div style="font-size:15px;font-weight:700;margin-bottom:6px">${sanitize(team?.name||'チーム',20)} への指導を開始しますか？</div>
      <div style="font-size:12px;color:var(--txt3);line-height:1.7">
        指導開始を記録すると、チーム管理者に通知されます。<br>
        指導完了後に「完了報告」を行い、チーム確認後に請求書を発行できます。
      </div>
    </div>
    <button class="btn btn-primary w-full" onclick="startCoaching('${ptId}')">指導を開始する</button>
  `);
}

// 指導ワークフロー ステッパーHTML生成
function _coachingStepperHTML(pt){
  var steps = [
    {key:'matched',    label:'マッチング',icon:'fa-handshake'},
    {key:'active',     label:'料金確定',  icon:'fa-yen-sign'},
    {key:'coaching',   label:'指導中',    icon:'fa-chalkboard-user'},
    {key:'coaching_done',label:'完了報告', icon:'fa-clipboard-check'},
    {key:'confirmed',  label:'チーム確認',icon:'fa-check-double'},
    {key:'invoiced',   label:'請求',      icon:'fa-file-invoice-dollar'},
    {key:'paid',       label:'支払完了',  icon:'fa-circle-check'}
  ];
  var statusOrder = {pending_negotiation:0,pending_contract:1,active:1,coaching:2,coaching_done:3,confirmed:4,payment_requested:5,paid:6};
  var current = statusOrder[pt.status] !== undefined ? statusOrder[pt.status] : 1;
  return '<div style="display:flex;align-items:flex-start;gap:0;margin-bottom:20px;overflow-x:auto;padding-bottom:4px">' +
    steps.map(function(s,i){
      var done = i < current;
      var active = i === current;
      var color = done ? 'var(--teal)' : active ? 'var(--org)' : 'var(--b2)';
      var textColor = done ? 'var(--teal)' : active ? 'var(--org)' : 'var(--txt3)';
      return '<div style="display:flex;flex-direction:column;align-items:center;min-width:60px;flex:1;position:relative">' +
        '<div style="width:28px;height:28px;border-radius:50%;background:' + (done?'var(--teal)':active?'var(--org)':'var(--surf2)') + ';display:flex;align-items:center;justify-content:center;border:2px solid ' + color + ';z-index:1">' +
          '<i class="fas ' + (done?'fa-check':s.icon) + '" style="font-size:10px;color:' + (done||active?'#fff':'var(--txt3)') + '"></i>' +
        '</div>' +
        '<div style="font-size:9px;color:' + textColor + ';font-weight:' + (active?'700':'500') + ';margin-top:4px;text-align:center;line-height:1.2">' + s.label + '</div>' +
        (i < steps.length-1 ? '<div style="position:absolute;top:13px;left:calc(50% + 14px);width:calc(100% - 28px);height:2px;background:' + (done?'var(--teal)':'var(--b2)') + '"></div>' : '') +
      '</div>';
    }).join('') +
  '</div>';
}

function openNewInvoiceModal(ptId,e){
  if(e&&e.stopPropagation)e.stopPropagation();
  const tid=ptId||activeThreadId;
  let pt=tid?_dbArr('payThreads').find(p=>p.id===tid):null;
  if(!pt&&DB.currentUser?.role==='coach'){
    const me=getMyCoach();
    if(me)pt=_dbArr('payThreads').find(p=>p.coachId===me.id);
  }
  if(!pt){toast('マッチング済みのスレッドがありません。先にチームとマッチングしてください。','w');return;}
  const now=new Date();
  const month=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const baseAmt=pt.contractAmount||0;
  const feeRate=getFeeRate(pt.teamId,'coachFee');
  const platformFee=Math.round(baseAmt*feeRate/100);
  const teamName=DB.teams.find(t=>t.id===pt.teamId)?.name||'チーム';
  const coachName=DB.coaches.find(c=>c.id===pt.coachId)?.name||'コーチ';
  openM('📄 請求書を発行',`<div>
    <div style="background:var(--surf2);border-radius:10px;padding:10px 14px;margin-bottom:14px;font-size:12px;color:var(--txt3);display:flex;align-items:center;gap:8px">
      <span style="font-size:16px">🤝</span> ${sanitize(teamName,20)} × ${sanitize(coachName,20)}
    </div>
    <div class="form-group"><label class="label">対象月</label><input class="input" type="month" value="${month}" id="inv-month"></div>
    <div class="form-group"><label class="label">コーチ指導料（コーチが受け取る金額）</label><input class="input" type="number" value="${baseAmt}" id="inv-amount" min="0" max="99999999" oninput="calcInvPreview(this.value,'${pt.teamId}')" style="font-size:16px;font-weight:700"></div>
    <div style="background:var(--surf2);border-radius:12px;padding:16px;margin:14px 0">
      <div style="font-size:12px;font-weight:700;color:var(--txt3);margin-bottom:10px">💰 お支払い内訳</div>
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--b1);font-size:13px">
        <span style="color:var(--txt3)">コーチ受取額</span><b style="color:var(--teal)" id="inv-cr">¥${fmtNum(baseAmt)}</b>
      </div>
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--b1);font-size:13px">
        <span style="color:var(--txt3)">プラットフォーム手数料（${feeRate}%）</span><span style="color:var(--txt2)" id="inv-fee">¥${fmtNum(platformFee)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:10px 0 0;font-size:15px">
        <span style="font-weight:700">チームお支払い合計</span><b style="color:var(--org);font-size:18px" id="inv-tp">¥${fmtNum(baseAmt+platformFee)}</b>
      </div>
    </div>
    <div class="form-group"><label class="label">備考（任意）</label><input class="input" id="inv-note" placeholder="例: 2月分 通常指導"></div>
    <button class="btn btn-primary w-full mt-12" onclick="createInvoice('${pt.id}')" style="font-size:15px;padding:14px">📩 請求書を送付する</button>
  </div>`);
}

function calcInvPreview(v,teamId){
  const a=parseInt(v)||0;
  const rate=getFeeRate(teamId||'','coachFee');
  const fee=Math.round(a*rate/100);
  const cr=document.getElementById('inv-cr');
  const feeEl=document.getElementById('inv-fee');
  const tp=document.getElementById('inv-tp');
  if(cr)cr.textContent='¥'+fmtNum(a);
  if(feeEl)feeEl.textContent='¥'+fmtNum(fee);
  if(tp)tp.textContent='¥'+fmtNum(a+fee);
}

function createInvoice(ptId){
  if(!DB.currentUser||!['coach','admin'].includes(DB.currentUser.role)){toast('この操作はコーチまたは事務局のみ実行できます','e');return;}
  if(window._creatingInv){return;}window._creatingInv=true;setTimeout(()=>{window._creatingInv=false;},3000);
  const pt=_dbArr('payThreads').find(p=>p.id===ptId);
  if(!pt){toast('スレッドが見つかりません','e');return;}
  const amt=parseInt(document.getElementById('inv-amount')?.value||pt.contractAmount||0);
  if(!amt||amt<=0){toast('正しい金額を入力してください','e');return;}
  if(amt>10000000){toast('金額が上限を超えています（上限: ¥10,000,000）','e');return;}
  const month=document.getElementById('inv-month')?.value||pt.month;
  const note=document.getElementById('inv-note')?.value||`${month}分 指導料`;
  const feeRate=getFeeRate(pt.teamId,'coachFee');
  const platformFee=Math.round(amt*feeRate/100);
  const inv={id:'inv'+Date.now(),month,status:'unpaid',teamPays:amt+platformFee,coachReceives:amt,platformFee,paidAt:null,note};
  if(!pt.invoices)pt.invoices=[];
  pt.invoices.push(inv);
  pt.status='payment_requested';
  const isoNow=new Date().toISOString();
  if(!pt.messages)pt.messages=[];
  pt.messages.push({from:'coach',text:`${month}分の請求書を送付しました。\n指導料: ¥${fmtNum(amt)} ＋ 手数料${feeRate}% → チームお支払額: ¥${fmtNum(inv.teamPays)}`,time:new Date().toLocaleString('ja-JP'),isoTime:isoNow});
  
  // チームに通知
  const team=DB.teams.find(t=>t.id===pt.teamId);
  const coach=DB.coaches.find(c=>c.id===pt.coachId);
  const teamUserId=team?.id||pt.teamId;
  addNotif(`📄 ${coach?.name||'コーチ'}から${month}分の請求書が届きました（¥${fmtNum(inv.teamPays)}）`,'fa-file-invoice-dollar','threads',teamUserId);
  
  // チャットルームにも通知メッセージ
  const ck=pt.chatKey||Object.keys(DB.chats).find(k=>{const c=DB.chats[k];return c.type==='match'&&c.coachId===pt.coachId&&c.teamId===pt.teamId;});
  if(ck&&DB.chats[ck]){
    DB.chats[ck].msgs.push({mid:_genMsgId(),from:'system',name:'システム',text:`📄 ${coach?.name||'コーチ'}から請求書が届きました\n${month}分 指導料: ¥${fmtNum(inv.teamPays)}\nお支払いページから決済してください。`,time:now_time(),date:isoNow.slice(0,10),read:false});
    DB.chats[ck].unread=(DB.chats[ck].unread||0)+1;
    if(!pt.chatKey)pt.chatKey=ck;
  }
  
  // メール通知
  if(team?.email) notifyByEmail('invoice_created',{email:team.email,name:team.name},{coachName:coach?.name||'コーチ',month,amount:fmtNum(inv.teamPays)});
  
  saveDB();
  closeM();
  toast('請求書を送付しました！','s');
  _sendPushNotification('📄 請求書', (coach?.name||'コーチ')+'から請求書: ¥'+fmtNum(inv.teamPays));
  addAuditLog('invoice_create',`${coach?.name||'コーチ'}が${team?.name||'チーム'}へ請求書発行: ¥${fmtNum(inv.teamPays)}`,{ptId,invId:inv.id,amount:inv.teamPays});
  openThreadDetail(ptId);
}

// ==================== PROFILE SETTINGS ====================
function profileSettingsPage(){
  const u=DB.currentUser, role=u.role;
  if(role==='coach'){
    const coach=getMyCoach();
    if(!coach) return `<div class="pg-head"><div class="pg-title">プロフィール・設定</div></div><div class="card text-center" style="padding:40px"><div style="font-size:48px">🏆</div><div class="fw7 mt-16">コーチ情報が見つかりません</div><div class="text-sm text-muted mt-8">再ログインをお試しください</div></div>`;
    const feeRate=10;
    return`<div class="pg-head flex justify-between items-center">
      <div><div class="pg-title">プロフィール・設定</div><div class="pg-sub">コーチ情報の編集・公開管理</div></div>
      <button class="btn btn-primary btn-sm" onclick="saveCoachProfileUnified()">💾 保存する</button>
    </div>
    <div style="display:grid;grid-template-columns:210px 1fr;gap:20px;align-items:start">
      <div class="card text-center" style="padding:24px">
        <div onclick="document.getElementById('cp-img-file').click()" style="cursor:pointer">
          <div id="cp-img" class="avi" style="width:90px;height:90px;font-size:32px;margin:0 auto;background:${coach.color||'var(--org)'};${coach.photo?'background-image:url('+coach.photo+');background-size:cover;background-position:center':''}">${coach.photo?'':(coach.name||'?')[0]}</div>
          <div style="font-size:12px;color:var(--teal);margin-top:8px;font-weight:600">📷 写真を変更</div>
          <input type="file" id="cp-img-file" accept="image/*" style="display:none" onchange="_loadProfilePhoto(this,'cp-img','cp')">
        </div>
        <div class="fw7 mt-12" style="font-size:15px">${coach.name}</div>
        <div class="text-muted text-xs">${coach.sport||''} / ${coach.area||''}</div>
        <div class="mt-12">${coach.verified?'<span class="badge b-teal">✅ 認定コーチ</span>':'<span class="badge b-yel">審査中</span>'}</div>
        <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--b1);font-size:13px">
          <div style="color:var(--yel);font-size:20px;font-weight:900">★ ${coach.rating||0}</div>
          <div class="text-xs text-muted">${coach.reviews||0}件のレビュー</div>
        </div>
      </div>
      <div>
        <div class="card mb-16">
          <div class="fw7 mb-16" style="font-size:15px">📋 基本情報</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
            <div class="form-group"><label class="label">氏名</label><input class="input" value="${sanitize(coach.name||'')}" id="cp-name"></div>
            <div class="form-group"><label class="label">指導種目</label><input class="input" value="${sanitize(coach.sport||'')}" id="cp-sport"></div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
            <div class="form-group"><label class="label">専門・得意分野</label><input class="input" value="${sanitize(coach.spec||'')}" id="cp-spec"></div>
            <div class="form-group"><label class="label">活動地域</label><input class="input" value="${sanitize(coach.area||'')}" id="cp-area"></div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
            <div class="form-group"><label class="label">指導歴（年）</label><input class="input" type="number" min="0" max="60" value="${coach.exp||0}" id="cp-exp"></div>
          </div>
          <!-- 料金設定カード -->
          <div style="background:var(--surf2);border:1px solid var(--b1);border-radius:12px;padding:16px;margin-bottom:16px">
            <div class="fw7 mb-12" style="font-size:14px">💰 料金設定</div>
            <div style="font-size:12px;color:var(--txt3);margin-bottom:14px;line-height:1.6">チームに表示される料金を設定します。「ご相談ください」をONにすると金額の代わりに相談ボタンが表示され、チャットで事前にすり合わせた後、指導完了後に請求書を発行できます。</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
              <!-- 月額契約 -->
              <div style="background:var(--surf);border:1px solid var(--b1);border-radius:10px;padding:14px">
                <div style="font-size:12px;font-weight:700;color:var(--org);margin-bottom:10px">📅 月額契約</div>
                <div class="form-group" style="margin-bottom:10px"><label class="label" style="font-size:11px">料金（円）</label><input class="input" type="number" min="0" max="9999999" value="${coach.price||0}" id="cp-price" oninput="updateFeePreview(this.value)" ${coach.monthlyNegotiable?'disabled style="opacity:.5"':''}></div>
                <div style="display:flex;align-items:center;gap:6px"><label class="toggle-switch"><input type="checkbox" id="cp-monthlyNeg" ${coach.monthlyNegotiable?'checked':''} onchange="const el=document.getElementById('cp-price');el.disabled=this.checked;el.style.opacity=this.checked?'.5':'1'"><span class="toggle-slider"></span></label><span style="font-size:11px;color:var(--txt3)">ご相談ください</span></div>
              </div>
              <!-- 都度払い -->
              <div style="background:var(--surf);border:1px solid var(--b1);border-radius:10px;padding:14px">
                <div style="font-size:12px;font-weight:700;color:var(--teal);margin-bottom:10px">⚡ 都度払い</div>
                <div class="form-group" style="margin-bottom:10px"><label class="label" style="font-size:11px">料金（1回・円）</label><input class="input" type="number" min="0" max="9999999" value="${coach.priceOnetime||0}" id="cp-priceOnetime" placeholder="例: 15000" ${coach.onetimeNegotiable?'disabled style="opacity:.5"':''}></div>
                <div style="display:flex;align-items:center;gap:6px"><label class="toggle-switch"><input type="checkbox" id="cp-onetimeNeg" ${coach.onetimeNegotiable?'checked':''} onchange="const el=document.getElementById('cp-priceOnetime');el.disabled=this.checked;el.style.opacity=this.checked?'.5':'1'"><span class="toggle-slider"></span></label><span style="font-size:11px;color:var(--txt3)">ご相談ください</span></div>
              </div>
            </div>
          </div>
          <div class="form-group mb-12"><label class="label">自己紹介・指導方針</label><textarea class="input" rows="4" id="cp-bio">${sanitize(coach.bio||'')}</textarea></div>
          <div style="background:rgba(0,212,170,.06);border:1px solid rgba(0,212,170,.2);border-radius:10px;padding:12px 14px;font-size:12px">
            <div class="fw7" style="color:var(--teal);margin-bottom:6px">💰 チームへの表示金額（自動計算）</div>
            <div class="flex gap-20 flex-wrap"><span class="text-muted">チーム支払額：</span><b style="color:var(--org)" id="fp-tp">¥${Math.round((coach.price||0)*1.1).toLocaleString()}</b>
            <span class="text-muted">あなたの受取：</span><b style="color:var(--teal)" id="fp-cr">¥${Math.round((coach.price||0)*0.9).toLocaleString()}</b></div>
            <div id="fp-tax-note" style="font-size:10px;color:var(--txt3);margin-top:6px;line-height:1.5">プラットフォーム手数料10% · 表示金額は税込想定です。実際の税額はStripeの明細をご確認ください。</div>
          </div>
        </div>
        <div class="card mb-16">
          <div class="fw7 mb-12" style="font-size:15px">🎨 アバターカラー</div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px">
          ${['#ff6b2b','#00cfaa','#3b82f6','#a855f7','#ef4444','#f59e0b'].map(col=>'<div onclick="document.getElementById(\'cp-color\').value=\''+col+'\';this.parentElement.querySelectorAll(\'.copt\').forEach(x=>x.style.borderColor=\'transparent\');this.style.borderColor=\'#fff\'" class="copt" style="width:30px;height:30px;border-radius:50%;background:'+col+';cursor:pointer;border:3px solid '+((coach.color||'#ff6b2b')===col?'#fff':'transparent')+'"></div>').join('')}
          <input type="hidden" id="cp-color" value="${coach.color||'#ff6b2b'}"></div>
          <div class="fw7 mb-12" style="font-size:15px">🌐 SNS</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
            <div class="form-group"><label class="label">Instagram</label><input id="cp-ig" class="input" value="${sanitize(coach.instagram||'')}" placeholder="@handle" maxlength="50"></div>
            <div class="form-group"><label class="label">X (Twitter)</label><input id="cp-tw" class="input" value="${sanitize(coach.twitter||'')}" placeholder="@handle" maxlength="50"></div>
          </div>
          <div class="fw7 mb-12" style="font-size:15px">🔒 公開設定</div>
          <div class="payment-method-row mb-10"><div><div class="text-sm fw7">プロフィールを公開</div><div class="text-xs text-muted">チーム検索結果に表示されます</div></div><label class="toggle-switch"><input type="checkbox" id="cp-public" ${coach.isPublic!==false?'checked':''}><span class="toggle-slider"></span></label></div>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:10px;padding-top:16px;border-top:1px solid var(--b1)">
          <button class="btn btn-ghost" onclick="refreshPage()">← 変更を破棄</button>
          <button class="btn btn-primary" onclick="saveCoachProfileUnified()">💾 変更を保存する</button>
        </div>
      </div>
    </div>`;
  }
  if(role==='team'){
    const team=getMyTeam();
    if(!team) return `<div class="pg-head"><div class="pg-title">チームプロフィール</div></div><div class="card text-center" style="padding:40px"><div style="font-size:48px">🏟️</div><div class="fw7 mt-16">チーム情報が見つかりません</div><div class="text-sm text-muted mt-8">再ログインをお試しください</div></div>`;
    return`<div class="pg-head flex justify-between items-center">
      <div><div class="pg-title">チームプロフィール</div><div class="pg-sub">チーム情報を編集</div></div>
      <button class="btn btn-primary btn-sm" onclick="saveTeamProfile()">💾 保存する</button>
    </div>
    <div style="display:grid;grid-template-columns:210px 1fr;gap:20px;align-items:start">
      <div class="card text-center" style="padding:24px">
        <div onclick="document.getElementById('tp-img-file').click()" style="cursor:pointer">
          <div id="tp-img" class="avi" style="width:90px;height:90px;font-size:32px;margin:0 auto;background:var(--blue);${team.photo?`background-image:url(${team.photo});background-size:cover;background-position:center`:''}">${team.photo?'':(team.name||'?')[0]}</div>
          <div style="font-size:12px;color:var(--teal);margin-top:8px;font-weight:600">📷 ロゴを変更</div>
          <input type="file" id="tp-img-file" accept="image/*" style="display:none" onchange="_loadProfilePhoto(this,'tp-img','tp')">
        </div>
        <div class="fw7 mt-12" style="font-size:15px">${team.name}</div>
        <div class="text-muted text-xs">${team.sport} / ${team.area}</div>
        <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--b1);font-size:13px">
          <div class="flex justify-between mt-4"><span class="text-muted">登録コード</span><b>${team.code}</b></div>
          <div class="flex justify-between mt-4"><span class="text-muted">選手数</span><b>${DB.players.filter(p=>p.team===team.id).length}名</b></div>
          <div class="flex justify-between mt-4"><span class="text-muted">月謝</span><b>¥${fmtNum(team.fee)}</b></div>
        </div>
      </div>
      <div class="card">
        <div class="fw7 mb-16" style="font-size:15px">チーム情報</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
          <div class="form-group"><label class="label">チーム名</label><input id="tp-name" class="input" value="${sanitize(team.name||'',50)}" maxlength="50"></div>
          <div class="form-group"><label class="label">種目</label><input id="tp-sport" class="input" value="${sanitize(team.sport||'',30)}" maxlength="30"></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
          <div class="form-group"><label class="label">活動地域</label><input id="tp-area" class="input" value="${sanitize(team.area||'',50)}" maxlength="50"></div>
          <div class="form-group"><label class="label">月謝（円）</label><input id="tp-fee" class="input" type="number" min="0" max="9999999" value="${team.fee||0}"></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
          <div class="form-group"><label class="label">カテゴリ</label><input id="tp-ageGroup" class="input" value="${sanitize(team.ageGroup||'',30)}" placeholder="U-12 等" maxlength="30"></div>
          <div class="form-group"><label class="label">活動日</label><input id="tp-practiceDays" class="input" value="${sanitize(team.practiceDays||'',30)}" placeholder="土・日" maxlength="30"></div>
        </div>
        <div class="form-group" style="margin-bottom:12px"><label class="label">練習場所</label><input id="tp-homeGround" class="input" value="${sanitize(team.homeGround||'',50)}" placeholder="○○公園グラウンド" maxlength="50"></div>
        <div class="form-group" style="margin-bottom:12px"><label class="label">公式サイト</label><input id="tp-web" class="input" value="${sanitize(team.website||'',100)}" placeholder="https://" maxlength="100"></div>
        <div class="form-group"><label class="label">チーム紹介</label><textarea id="tp-desc" class="input" rows="3" maxlength="300" placeholder="チームの特徴、目標、求めるコーチのスタイル...">${sanitize(team.description||'',300)}</textarea></div>
      </div>
      <!-- マッチング設定 -->
      <div class="card" style="grid-column:1/-1">
        <div class="fw7 mb-16" style="font-size:15px">🤝 チームマッチング設定</div>
        <div class="text-xs text-muted mb-12">他チームがあなたのチーム情報を見たとき、この内容が表示されます</div>
        <div class="form-group" style="margin-bottom:12px"><label class="label">マッチング紹介文</label><textarea id="tp-matchMessage" class="input" rows="3" maxlength="300" placeholder="例: 練習試合の相手を探しています！同じU-12のサッカーチームとの合同練習も大歓迎です。">${sanitize(team.matchMessage||'',300)}</textarea></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
          <div class="form-group"><label class="label">求めている対戦相手</label><input id="tp-lookingFor" class="input" value="${sanitize(team.lookingFor||'',60)}" placeholder="例: 同レベルのU-12サッカーチーム" maxlength="60"></div>
          <div class="form-group"><label class="label">対戦可能な曜日</label><input id="tp-matchDays" class="input" value="${sanitize(team.matchDays||'',30)}" placeholder="例: 土日祝" maxlength="30"></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
          <div class="form-group"><label class="label">対戦可能な場所</label><input id="tp-matchLocation" class="input" value="${sanitize(team.matchLocation||'',50)}" placeholder="例: ホームグラウンドまたは都内近郊" maxlength="50"></div>
          <div class="form-group"><label class="label">チームレベル</label>
            <select id="tp-teamLevel" class="input">
              <option value="">未設定</option>
              <option value="初心者" ${team.teamLevel==='初心者'?'selected':''}>初心者（始めたばかり）</option>
              <option value="初級" ${team.teamLevel==='初級'?'selected':''}>初級（基礎練習中心）</option>
              <option value="中級" ${team.teamLevel==='中級'?'selected':''}>中級（大会出場レベル）</option>
              <option value="上級" ${team.teamLevel==='上級'?'selected':''}>上級（大会上位レベル）</option>
            </select>
          </div>
        </div>
        <div class="payment-method-row"><div><div class="text-sm fw7">マッチング受付中</div><div class="text-xs text-muted">オフにすると他チームの検索結果に表示されなくなります</div></div><label class="toggle-switch"><input type="checkbox" id="tp-matchAvailable" ${team.matchAvailable!==false?'checked':''}><span class="toggle-slider"></span></label></div>
      </div>
      <!-- 下部保存ボタン -->
      <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:20px;padding-top:16px;border-top:1px solid var(--b1)">
        <button class="btn btn-ghost" onclick="refreshPage()">← 変更を破棄</button>
        <button class="btn btn-primary" onclick="saveTeamProfile()">💾 変更を保存する</button>
      </div>
    </div>`;
  }
  if(role==='player') return playerProfileEditPage();
  if(role==='parent') return parentProfileEditPage();
  return`<div class="pg-title">プロフィール</div>`;
}

function saveCoachProfileUnified(){
  const coach=getMyCoach();if(!coach){toast('コーチ情報が見つかりません','e');return;}
  const nameVal=document.getElementById('cp-name')?.value?.trim();
  if(!nameVal){toast('氏名を入力してください','e');return;}
  coach.name=sanitize(nameVal,50);
  ['sport','spec','area'].forEach(k=>{const el=document.getElementById('cp-'+k);if(el)coach[k]=sanitize(el.value,50);});
  const expEl=document.getElementById('cp-exp');if(expEl)coach.exp=Math.max(0,parseInt(expEl.value)||0);
  const priceEl=document.getElementById('cp-price');if(priceEl)coach.price=Math.max(0,parseInt(priceEl.value)||0);
  const priceOtEl=document.getElementById('cp-priceOnetime');if(priceOtEl)coach.priceOnetime=Math.max(0,parseInt(priceOtEl.value)||0);
  const negEl=document.getElementById('cp-onetimeNeg');if(negEl)coach.onetimeNegotiable=negEl.checked;
  const mNegEl=document.getElementById('cp-monthlyNeg');if(mNegEl)coach.monthlyNegotiable=mNegEl.checked;
  const bioEl=document.getElementById('cp-bio');if(bioEl)coach.bio=sanitize(bioEl.value,500);
  const colorEl=document.getElementById('cp-color');if(colorEl)coach.color=colorEl.value||coach.color||'#ff6b2b';
  const igEl=document.getElementById('cp-ig');if(igEl)coach.instagram=sanitize(igEl.value,50);
  const twEl=document.getElementById('cp-tw');if(twEl)coach.twitter=sanitize(twEl.value,50);
  const pubEl=document.getElementById('cp-public');if(pubEl)coach.isPublic=pubEl.checked;
  if(window._profilePhotos?.cp){
    coach.photo=window._profilePhotos.cp;
    window._profilePhotos.cp=null;
    if(DB.currentUser&&DB.currentUser.id===coach.id)DB.currentUser.photo=coach.photo;
  }
  if(DB.currentUser)DB.currentUser.name=coach.name;
  // ユーザーアカウント名も同期
  const _usrs=_getUsers();const _mu2=_usrs.find(u=>u.id===DB.currentUser?.id);
  if(_mu2){_mu2.name=coach.name;_saveUsers(_usrs);}
  saveDBAndSync();_updateAvi();toast('プロフィールを保存しました！','s');goTo('profile-settings');
}

function saveCoachProfile(){
  const coach=getMyCoach();
  if(!coach){toast('コーチ情報が見つかりません','e');return;}
  const nameVal=document.getElementById('cp-name')?.value?.trim();
  if(!nameVal){toast('氏名を入力してください','e');return;}
  coach.name=sanitize(nameVal,50);
  ['sport','spec','area'].forEach(k=>{const el=document.getElementById('cp-'+k);if(el)coach[k]=sanitize(el.value,50);});
  const expEl=document.getElementById('cp-exp');if(expEl)coach.exp=Math.max(0,parseInt(expEl.value)||0);
  const priceEl=document.getElementById('cp-price');if(priceEl)coach.price=Math.max(0,parseInt(priceEl.value)||0);
  const bioEl=document.getElementById('cp-bio');if(bioEl)coach.bio=sanitize(bioEl.value,500);
  const priceOtEl2=document.getElementById('cp-priceOnetime');if(priceOtEl2)coach.priceOnetime=Math.max(0,parseInt(priceOtEl2.value)||0);
  // DB.currentUserの名前も同期
  const negEl2=document.getElementById('cp-onetimeNeg');if(negEl2)coach.onetimeNegotiable=negEl2.checked;
  if(DB.currentUser)DB.currentUser.name=coach.name;
  const mNegEl2=document.getElementById('cp-monthlyNeg');if(mNegEl2)coach.monthlyNegotiable=mNegEl2.checked;
  // 写真保存
  if(window._profilePhotos?.cp){
    coach.photo=window._profilePhotos.cp;
    window._profilePhotos.cp=null;
    if(DB.currentUser&&DB.currentUser.id===coach.id)DB.currentUser.photo=coach.photo;
  }
  saveDBAndSync();
  _updateAvi();
  toast('プロフィールを保存しました！','s');
  goTo('profile');
}

function saveTeamProfile(){
  const team=getMyTeam();
  if(!team){toast('チーム情報が見つかりません','e');return;}
  const nameVal=document.getElementById('tp-name')?.value?.trim();
  if(!nameVal){toast('チーム名を入力してください','e');return;}
  team.name=sanitize(nameVal,50);
  const sportEl=document.getElementById('tp-sport');if(sportEl)team.sport=sanitize(sportEl.value,30);
  const areaEl=document.getElementById('tp-area');if(areaEl)team.area=sanitize(areaEl.value,50);
  const feeEl=document.getElementById('tp-fee');if(feeEl)team.fee=Math.min(1000000,Math.max(0,parseInt(feeEl.value)||0));
  // 追加フィールド
  const descEl=document.getElementById('tp-desc');if(descEl)team.description=sanitize(descEl.value,300);
  const ageEl=document.getElementById('tp-ageGroup');if(ageEl)team.ageGroup=sanitize(ageEl.value,30);
  const dayEl=document.getElementById('tp-practiceDays');if(dayEl)team.practiceDays=sanitize(dayEl.value,30);
  const groundEl=document.getElementById('tp-homeGround');if(groundEl)team.homeGround=sanitize(groundEl.value,50);
  const webEl=document.getElementById('tp-web');if(webEl)team.website=sanitize(webEl.value,100);
  // マッチング設定
  const mmEl=document.getElementById('tp-matchMessage');if(mmEl)team.matchMessage=sanitize(mmEl.value,300);
  const lfEl=document.getElementById('tp-lookingFor');if(lfEl)team.lookingFor=sanitize(lfEl.value,60);
  const mdEl=document.getElementById('tp-matchDays');if(mdEl)team.matchDays=sanitize(mdEl.value,30);
  const mlEl=document.getElementById('tp-matchLocation');if(mlEl)team.matchLocation=sanitize(mlEl.value,50);
  const tlEl=document.getElementById('tp-teamLevel');if(tlEl)team.teamLevel=tlEl.value||'';
  const maEl=document.getElementById('tp-matchAvailable');if(maEl)team.matchAvailable=maEl.checked;
  // 写真保存
  if(window._profilePhotos?.tp){
    team.photo=window._profilePhotos.tp;
    window._profilePhotos.tp=null;
    if(DB.currentUser&&DB.currentUser.id===team.id)DB.currentUser.photo=team.photo;
  }
  if(DB.currentUser)DB.currentUser.name=team.name;
  // ユーザーアカウント名も同期
  const _users=_getUsers();const _mu=_users.find(u=>u.id===DB.currentUser?.id);
  if(_mu){_mu.name=team.name;_saveUsers(_users);}
  saveDBAndSync();
  _updateAvi();
  toast('チームプロフィールを保存しました！','s');
  goTo('profile-settings');
}

function joinTeamByCode(){
  const codeEl=document.getElementById('pl-invite-code');
  const code=(codeEl?.value||'').trim().toUpperCase();
  if(!code){toast('招待コードを入力してください','e');codeEl?.focus();return;}
  const team=DB.teams.find(t=>t.code===code);
  if(!team){toast('この招待コードは存在しません','e');codeEl?.focus();return;}
  const p=DB.players.find(x=>x.id===DB.currentUser?.id);
  if(!p){toast('選手データが見つかりません','e');return;}
  if(p.team){toast('すでにチームに所属しています','e');return;}
  p.team=team.id;
  team.members=(team.members||0)+1;
  // 月謝レコード生成
  if(team.fee>0){
    if(!DB.payments)DB.payments=[];
  _dbArr('payments').push({id:genId('pay'),player:p.id,team:team.id,
      amount:team.fee,month:curMonth(),status:'unpaid',at:null});
  }
  saveDB();
  toast(team.name+'に参加しました！','s');
  addNotif(team.name+'に参加しました','fa-users','dashboard');
  refreshPage();
}

// ── 招待コード管理 ──
function copyInviteCode(){
  const t=getMyTeam();
  if(!t||!t.code){toast('招待コードがありません','e');return;}
  const code=String(t.code||'').trim();
  if(!code){toast('招待コードがありません','e');return;}
  // コードのみをコピー（数字含む完全なコード）
  var copied=false;
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(code).then(function(){toast('📋 招待コードをコピーしました: '+code,'s');}).catch(function(){_fallbackCopy(code,code);});
    copied=true;
  }
  if(!copied) _fallbackCopy(code,code);
}
function _fallbackCopy(text,code){
  try{
    var ta=document.createElement('textarea');
    ta.value=String(text);
    ta.setAttribute('readonly','');
    ta.style.cssText='position:fixed;left:-9999px;top:-9999px;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0,String(text).length);
    document.execCommand('copy');
    document.body.removeChild(ta);
    toast('📋 招待コードをコピーしました: '+code,'s');
  }catch(e){
    // 最終手段: コードをプロンプトで表示
    prompt('招待コードをコピーしてください:',code);
  }
}
function shareInviteLink(){
  const t=getMyTeam();
  if(!t||!t.code){toast('招待コードがありません','e');return;}
  const code=String(t.code||'');
  const url='https://myteam-mycoach.web.app?join='+code;
  const text=t.name+'に参加しよう！\n招待コード: '+code;
  if(navigator.share){
    navigator.share({title:t.name+'への招待',text:text,url:url}).catch(function(){});
  } else {
    _fallbackCopy(url,code);
  }
}
function regenerateTeamCode(){
  const t=getMyTeam();
  if(!t){toast('チーム情報がありません','e');return;}
  if(!confirm('招待コードを再発行しますか？\n旧コードは無効になります。'))return;
  t.code='T'+Date.now().toString().slice(-6);
  saveDB();
  toast('🔄 新しい招待コード: '+t.code,'s');
  refreshPage();
}

// ── 招待リンクからの自動参加処理（URLパラメータ ?join=XXXXXX）──
function handleJoinParam(){
  const params=new URLSearchParams(location.search);
  const joinCode=params.get('join');
  if(!joinCode)return;
  history.replaceState({},'',location.pathname);
  // ログイン済みの場合
  if(DB.currentUser){
    const team=DB.teams.find(t=>t.code===joinCode.toUpperCase());
    if(!team){toast('この招待コードは存在しません','e');return;}
    const role=DB.currentUser.role;
    // OBOG: 既存ユーザーがOBOGとしてチーム連携
    if(role==='alumni'){
      const me=_getMyAlumni();
      if(me&&!me.teamId){
        me.teamId=team.id;me.teamName=team.name;
        // チャットルーム作成
        const ck='alumni_'+me.id;
        if(!DB.chats[ck]){
          DB.chats[ck]={name:me.name+'（OBOG）',sub:team.name+' 卒業生',avi:'🎓',type:'alumni',alumniId:me.id,teamId:team.id,
            msgs:[{mid:_genMsgId(),from:'system',name:'システム',text:`🎓 ${me.name}さんがOBOGとして${team.name}に連携しました！`,time:now_time(),date:new Date().toISOString().slice(0,10),read:false}],unread:0};
        }
        addNotif(`🎓 ${me.name}さんがOBOGとして連携しました`,'fa-graduation-cap','alumni-mgmt',team.id);
        saveDB();toast(`${team.name}にOBOGとして連携しました！`,'s');refreshPage();
      } else {
        toast('既にチームと連携済みです','i');
      }
      return;
    }
    // 選手: チーム参加
    const p=DB.players.find(x=>x.id===DB.currentUser?.id);
    if(p&&!p.team){
      p.team=team.id;team.members=(team.members||0)+1;
      if(team.fee>0){_dbArr('payments').push({id:genId('pay'),player:p.id,team:team.id,amount:team.fee,month:curMonth(),status:'unpaid',at:null});}
      saveDB();toast(team.name+'に参加しました！','s');refreshPage();
    } else {
      toast('既にチームに所属しています','i');
    }
  } else {
    // 未ログイン: 保存して登録後に処理
    DB.pendingJoinCode=joinCode.toUpperCase();
    DB.pendingTeamCode=joinCode.toUpperCase();
    saveDB();
    toast('アカウント登録後にチームに参加できます','i');
  }
}

// ── セッションタイムアウト（30分操作なしで自動ログアウト）──
let _sessionTimer=null;
const SESSION_TIMEOUT=30*60*1000; // 30分
function resetSessionTimer(){
  if(_sessionTimer)clearTimeout(_sessionTimer);
  if(!DB.currentUser)return;
  _sessionTimer=setTimeout(()=>{
    if(DB.currentUser){
      toast('⏰ セッションがタイムアウトしました。再度ログインしてください。','w');
      doLogout();
    }
  },SESSION_TIMEOUT);
}
// ユーザー操作でタイマーリセット
['click','keydown','touchstart','scroll'].forEach(ev=>{
  document.addEventListener(ev,()=>resetSessionTimer(),{passive:true});
});

// ── メール確認再送信 ──
async function resendVerificationEmail(){
  if(!window._fbAuth?.currentUser){toast('Firebase未接続です','e');return;}
  try{
    await window._fbFn.sendEmailVerification(window._fbAuth.currentUser);
    toast('📧 確認メールを再送信しました。受信箱をご確認ください。','s');
  }catch(e){
    if(e.code==='auth/too-many-requests') toast('送信制限に達しました。しばらくお待ちください。','w');
    else toast('送信に失敗しました','e');
  }
}

// ── Firestore決済ステータス同期（ポーリング: 3分ごと）──
let _paymentSyncInterval=null;
function startPaymentSync(){
  if(_paymentSyncInterval) clearInterval(_paymentSyncInterval);
  _paymentSyncInterval=setInterval(syncPaymentsFromFirestore, 3*60*1000);
  // 初回は10秒後
  setTimeout(syncPaymentsFromFirestore, 10000);
}
async function syncPaymentsFromFirestore(){
  if(!window._fbDB||!window._fbFn) return;
  try{
    // 自チームの決済記録を取得
    const myTeamId = getMyTeam()?.id || DB.currentUser?.id;
    if(!myTeamId) return;
    const snap = await window._fbFn.getDocs(
      window._fbFn.query(
        window._fbFn.collection(window._fbDB,'payments'),
        window._fbFn.where('teamId','==',myTeamId),
        window._fbFn.where('status','==','paid')
      )
    );
    let updated=0;
    snap.forEach(doc=>{
      const d=doc.data();
      // ローカルDB内の月謝レコードを更新
      if(d.type==='monthly_fee' && d.playerId && d.month){
        const local=_dbArr('payments').find(p=>p.player===d.playerId && p.team===d.teamId && p.month===d.month && p.status!=='paid');
        if(local){
          local.status='paid';
          local.paidAt=d.createdAt?.toDate?.()?.toISOString()||new Date().toISOString();
          local.stripeSessionId=d.stripeSessionId||'';
          local.method=d.method||'card';
          local.fee=d.platformFee||0;
          updated++;
        }
      }
      // 都度請求
      if(d.type==='adhoc' && d.invoiceId){
        const inv=_dbArr('adhocInvoices').find(i=>i.id===d.invoiceId && i.status!=='paid');
        if(inv){
          inv.status='paid';
          inv.paidAt=d.createdAt?.toDate?.()?.toISOString()||new Date().toISOString();
          inv.stripeSessionId=d.stripeSessionId||'';
          inv.fee=d.platformFee||0;
          updated++;
        }
      }
    });
    if(updated>0){
      saveDB();
      if(document.querySelector('.pg-title')?.textContent?.includes('月謝')||
         document.querySelector('.pg-title')?.textContent?.includes('支払い')){
        refreshPage();
      }
    }
  }catch(e){
  }
}

function savePlayerProfile(){
  const p=DB.players.find(x=>x.id===DB.currentUser?.id);
  if(!p){toast('選手情報が見つかりません','e');return;}
  const nameEl=document.getElementById('pl-name');if(nameEl&&nameEl.value.trim())p.name=sanitize(nameEl.value,50);
  const posEl=document.getElementById('pl-pos');if(posEl)p.pos=sanitize(posEl.value,20);
  const ageEl=document.getElementById('pl-age');if(ageEl)p.age=Math.max(0,Math.min(100,parseInt(ageEl.value)||0));
  const htEl=document.getElementById('pl-height');if(htEl)p.height=Math.max(0,Math.min(250,parseInt(htEl.value)||0));
  const wtEl=document.getElementById('pl-weight');if(wtEl)p.weight=Math.max(0,Math.min(200,parseInt(wtEl.value)||0));
  if(DB.currentUser&&nameEl?.value.trim())DB.currentUser.name=p.name;
  // 写真保存
  if(window._profilePhotos?.pl){
    p.photo = window._profilePhotos.pl;
    window._profilePhotos.pl = null;
    if(DB.currentUser && DB.currentUser.id === p.id) DB.currentUser.photo = p.photo;
  }
  saveDBAndSync();
  _updateAvi();
  toast('プロフィールを保存しました！','s');
  goTo('profile-settings');
}

function saveParentProfile(){
  const u=DB.currentUser;
  if(!u){toast('ログイン情報が見つかりません','e');return;}
  const nameEl=document.getElementById('pa-name');
  const emailEl=document.getElementById('pa-email');
  if(nameEl&&nameEl.value.trim())u.name=sanitize(nameEl.value,50);
  if(emailEl&&emailEl.value.trim()){
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailEl.value.trim())){
      toast('正しいメールアドレスを入力してください','e');return;
    }
    u.email=emailEl.value.trim().toLowerCase();
  }
  const child=DB.players.find(p=>p.guardianId===u.id||p.guardian===u.name);
  const childEl=document.getElementById('pa-child');
  if(child&&childEl&&childEl.value.trim())child.name=sanitize(childEl.value,50);
  // usersリストも更新
  const users=_getUsers();
  const idx=users.findIndex(x=>x.id===u.id);
  if(idx>=0){users[idx].name=u.name;users[idx].email=u.email;_saveUsers(users);}
  saveDBAndSync();
  toast('プロフィールを保存しました！','s');
  goTo('profile-settings');
}
function updateFeePreview(v){
  const p=parseInt(v)||0;
  const rate = getFeeRate('','coachFee') || 10;
  const teamPays = Math.round(p * (1 + rate/100));
  const coachGets = Math.round(p * (1 - rate/100));
  const tp=document.getElementById('fp-tp');const cr=document.getElementById('fp-cr');
  if(tp)tp.textContent='¥'+teamPays.toLocaleString();
  if(cr)cr.textContent='¥'+coachGets.toLocaleString();
  // Update tax note
  const tn=document.getElementById('fp-tax-note');
  if(tn)tn.innerHTML='プラットフォーム手数料'+rate+'% · 表示金額は税込想定です。実際の税額はStripeの明細をご確認ください。';
}

// ==================== PLAYER DATA DISCLOSURE SYSTEM ====================
// 選手個人情報開示管理システム
// チームが明示的に開示を許可し、コーチが個人情報保護誓約に電子署名した場合のみ
// 担当選手・選手レポートへのアクセスを許可する

// 開示状態チェック

// ============================================================
// 個人情報開示ロック画面 — コーチ向け共通UI
// page: 'players' | 'report'
// t: チームオブジェクト (nullの場合はチーム未所属)
// ============================================================
function renderDisclosureLockScreen(page, t){
  const me = getMyCoach();
  const pendingDisc = me && me.team
    ? _dbArr('disclosures').find(d => d.coachId===me.id && d.teamId===me.team && d.status==='active' && !d.coachAgreedAt)
    : null;

  if(pendingDisc){
    // チームが開示済み・コーチの署名待ち
    const teamObj = DB.teams.find(x => x.id === me.team);
    return`<div style="text-align:center;padding:48px 20px 60px">
      <div style="width:88px;height:88px;background:linear-gradient(135deg,rgba(14,165,233,.15),rgba(14,165,233,.05));border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;border:2px solid rgba(14,165,233,.3)">
        <i class="fa fa-file-signature" style="font-size:36px;color:var(--blue)"></i>
      </div>
      <div class="fw7" style="font-size:18px;margin-bottom:8px;color:var(--txt1)">誓約書への署名が必要です</div>
      <div class="text-sm text-muted" style="margin-bottom:24px;line-height:1.8">
        <b style="color:var(--blue)">${teamObj ? teamObj.name : 'チーム'}</b> から選手情報の開示許可が届いています。<br>
        選手情報の同意確認後、担当選手・レポートにアクセスできます。
      </div>
      <div style="background:rgba(14,165,233,.06);border:1px solid rgba(14,165,233,.2);border-radius:12px;padding:16px;max-width:380px;margin:0 auto 24px;text-align:left">
        <div style="font-size:11px;font-weight:700;color:var(--blue);margin-bottom:10px;text-transform:uppercase;letter-spacing:.5px">署名後にアクセスできる情報</div>
        ${['選手氏名・年齢・身体情報（身長・体重）','ポジション・トレーニング記録・コンディション','食事記録・栄養データ','選手ごとのパフォーマンス推移'].map(s=>`
          <div style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:12px;color:var(--txt2)">
            <i class="fa fa-check-circle" style="color:var(--blue);font-size:11px;flex-shrink:0"></i>${s}
          </div>`).join('')}
      </div>
      <div style="background:rgba(249,115,22,.06);border:1px solid rgba(249,115,22,.2);border-radius:10px;padding:12px;max-width:380px;margin:0 auto 24px;text-align:left;font-size:11px;color:var(--txt2);line-height:1.8">
        <i class="fa fa-info-circle" style="color:var(--org);margin-right:6px"></i>
        <b>ご確認ください：</b>選手情報の取り扱いに関する責任は閲覧するコーチに帰属します。
        運営は情報の仲介プラットフォームとしての役割に限られます。
      </div>
      <button class="btn btn-primary" onclick="openCoachPledgeModal()">
        <i class="fa fa-pen" style="margin-right:8px"></i>同意確認書を確認・署名する
      </button>
    </div>`;
  }

  // チームが未開示 or チーム未所属
  const hasTeam = me && me.team && t;
  return`<div style="text-align:center;padding:48px 20px 60px">
    <div style="width:88px;height:88px;background:rgba(239,68,68,.07);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;border:2px solid rgba(239,68,68,.2)">
      <i class="fa fa-lock" style="font-size:36px;color:#ef4444"></i>
    </div>
    <div class="fw7" style="font-size:18px;margin-bottom:8px;color:var(--txt1)">選手情報は保護されています</div>
    <div class="text-sm text-muted" style="margin-bottom:20px;line-height:1.8">
      ${hasTeam
        ? `<b style="color:var(--txt1)">${t.name}</b> がまだ選手情報の開示を許可していません。<br>チームに開示を依頼してください。`
        : 'チームとマッチング後、チームが開示許可をすることでアクセスできます。'
      }
    </div>

    <!-- 開示フローの説明 -->
    <div style="max-width:400px;margin:0 auto 24px;text-align:left">
      <div style="font-size:11px;font-weight:700;color:var(--txt3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px">アクセスまでの手順</div>
      ${[
        {icon:'fa-handshake',color:'var(--teal)',label:'契約完了',desc:'チームとのマッチング・契約が成立', done:hasTeam},
        {icon:'fa-unlock',color:'var(--org)',label:'チームが開示許可',desc:'チームの「コーチ管理」から開示ボタンを押す', done:false},
        {icon:'fa-file-signature',color:'var(--blue)',label:'同意確認',desc:'選手情報の取り扱いに同意', done:false},
        {icon:'fa-user',color:'var(--grn)',label:'選手情報にアクセス可能',desc:'担当選手・選手レポートが閲覧できます', done:false}
      ].map((s,i)=>`
        <div style="display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:1px solid var(--b1)">
          <div style="width:32px;height:32px;background:${s.done?'rgba(34,197,94,.15)':s.color+'22'};border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px">
            <i class="fa ${s.done?'fa-check':s.icon}" style="font-size:12px;color:${s.done?'var(--grn)':s.color}"></i>
          </div>
          <div style="flex:1">
            <div style="font-size:12px;font-weight:700;color:${s.done?'var(--grn)':'var(--txt1)'}">${i+1}. ${s.label}${s.done?' ✓':''}</div>
            <div style="font-size:11px;color:var(--txt3);margin-top:2px">${s.desc}</div>
          </div>
        </div>`).join('')}
    </div>

    <!-- 情報管理について -->
    <div style="background:var(--surf2);border-radius:10px;padding:14px;max-width:400px;margin:0 auto 20px;text-align:left;font-size:11px;color:var(--txt3);line-height:1.8">
      <i class="fa fa-shield-alt" style="color:var(--teal);margin-right:6px"></i>
      <b style="color:var(--txt2)">選手情報の保護について</b><br>
      選手情報は個人情報として大切に管理されています。チーム管理者の明示的な開示許可と、
      コーチによる同意確認がある場合にのみ閲覧できます。
      情報の適切な取り扱いにご協力ください。
    </div>

    <div class="flex gap-10 justify-center flex-wrap">
      ${hasTeam ? `<button class="btn btn-ghost btn-sm" onclick="goTo('threads')">💬 スレッドで依頼する</button>` : ''}
      <button class="btn btn-ghost btn-sm" onclick="goTo('team-search')">🔍 チームを探す</button>
    </div>
  </div>`;
}

function hasDisclosure(coachId, teamId){
  if(!DB.disclosures)DB.disclosures=[];
  return _dbArr('disclosures').some(d =>
    d.coachId === coachId &&
    d.teamId === teamId &&
    d.status === 'active' &&
    d.coachAgreedAt  // コーチの署名済みであること
  );
}

// コーチ: 担当チームへの開示があるか確認
function getMyDisclosure(){
  const me = getMyCoach();
  if(!me || !me.team) return null;
  return _dbArr('disclosures').find(d =>
    d.coachId === me.id &&
    d.teamId === me.team &&
    d.status === 'active' &&
    d.coachAgreedAt
  ) || null;
}

// チーム: 契約コーチへ開示ボタン → 開示確認モーダル
function executeDisclosure(coachId){
  const team = getMyTeam();
  const coach = DB.coaches.find(c => c.id === coachId);
  if(!team || !coach) return;
  // 既存があれば更新、なければ新規作成
  const existing = _dbArr('disclosures').find(d => d.coachId === coachId && d.teamId === team.id);
  if(existing){
    existing.status = 'active';
    existing.disclosedAt = new Date().toLocaleString('ja-JP');
    existing.revokedAt = null;
    existing.coachAgreedAt = null;
    existing.coachSignature = null;
  } else {
    _dbArr('disclosures').push({
      id: 'dc' + Date.now(),
      coachId, teamId: team.id,
      coachName: coach.name, teamName: team.name,
      disclosedAt: new Date().toLocaleString('ja-JP'),
      revokedAt: null,
      coachSignature: null,
      coachAgreedAt: null,
      coachAgreedIp: null,
      status: 'active',
      accessLog: []
    });
  saveDB();
  }
  // スレッドチャットに通知メッセージ
  const pt = _dbArr('payThreads').find(p => p.teamId === team.id && p.coachId === coachId);
  if(pt){
    pt.messages.push({
      from: 'system',
      teamText: `選手情報の開示を${coach.name}コーチに許可しました。`,
      coachText: `${team.name}から選手情報の開示許可が届きました。内容確認の上、同意確認をお願いします。`,
      time: new Date().toLocaleString('ja-JP')
    });
  }
  addNotif(team.name+'が選手情報の開示を許可しました','fa-unlock','threads');
  saveDB();
  closeM();
  toast('開示を許可しました。コーチの署名後にアクセスが有効になります。','s');
  refreshPage();
}

// 開示取消モーダル（チーム側）
function openRevokeDisclosureModal(coachId){
  const team = getMyTeam();
  const coach = DB.coaches.find(c => c.id === coachId);
  const d = _dbArr('disclosures').find(x => x.coachId === coachId && x.teamId === team.id && x.status === 'active');
  openM('🔒 開示の取消', `
    <div style="background:rgba(249,115,22,.08);border:1px solid rgba(249,115,22,.25);border-radius:10px;padding:14px;margin-bottom:18px">
      <div style="font-size:13px;font-weight:700;color:var(--org);margin-bottom:6px">現在 開示中</div>
      <div style="font-size:12px;color:var(--txt2);line-height:1.8">
        開示日時：${d ? d.disclosedAt : '不明'}<br>
        コーチ署名：${d && d.coachSignature ? '✓ 署名済み（' + d.coachSignature + '）' : '未署名'}
      </div>
    </div>
    <p style="font-size:12px;color:var(--txt3);margin-bottom:16px">
      開示を取り消すと、${coach.name}コーチは担当選手・選手レポートに即座にアクセスできなくなります。<br>
      過去の開示記録は法的証跡として保存されます。
    </p>
    <div class="flex gap-10">
      <button class="btn btn-primary" onclick="revokeDisclosure('${coachId}')">🔒 開示を取り消す</button>
      <button class="btn btn-ghost" onclick="closeM()">キャンセル</button>
    </div>
  `);
}

// 開示取消実行
function revokeDisclosure(coachId){
  const team = getMyTeam();
  const d = _dbArr('disclosures').find(x => x.coachId === coachId && x.teamId === team.id && x.status === 'active');
  if(d){
    d.status = 'revoked';
    d.revokedAt = new Date().toLocaleString('ja-JP');
  }
  const pt = _dbArr('payThreads').find(p => p.teamId === team.id && p.coachId === coachId);
  if(pt){
    pt.messages.push({
      from: 'system',
      teamText: '選手情報の開示を取り消しました。',
      coachText: `${team.name}が選手情報の開示を取り消しました。担当選手・レポートへのアクセスが停止されました。`,
      time: new Date().toLocaleString('ja-JP')
    });
  }
  saveDB();
  closeM();
  toast('開示を取り消しました。','i');
  refreshPage();
}

// コーチ: 個人情報保護誓約への署名モーダル
function openCoachPledgeModal(){
  const me = getMyCoach();
  const team = DB.teams.find(t => t.id === me.team);
  const d = _dbArr('disclosures').find(x => x.coachId === me.id && x.teamId === me.team && x.status === 'active' && !x.coachAgreedAt);
  if(!d){
    toast('署名が必要な開示許可が見つかりません','i');
    return;
  }
  _pledgeChecks=[false,false,false,false];
  openM('✍️ 選手情報取り扱い同意確認書', `
    <div style="background:rgba(14,165,233,.06);border:1px solid rgba(14,165,233,.2);border-radius:10px;padding:14px;margin-bottom:14px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <i class="fa fa-shield-alt" style="color:var(--blue);font-size:16px"></i>
        <span style="font-size:13px;font-weight:700;color:var(--blue)">個人情報保護誓約書（電子契約）</span>
      </div>
      <div id="pledge-scroll" style="max-height:240px;overflow-y:auto;font-size:12px;color:var(--txt2);line-height:1.9;padding-right:8px;border:1px solid var(--b1);border-radius:8px;padding:12px;background:var(--surf)" onscroll="checkPledgeScroll(this)">
        <div style="font-size:11px;color:var(--txt3);margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid var(--b2)">
          <div style="background:rgba(14,165,233,.06);border:1px solid rgba(14,165,233,.15);border-radius:6px;padding:8px 10px;margin-bottom:10px;font-size:10px;color:var(--blue)">
            ⚠️ <b>ご注意:</b> 本書面はMyCOACH-MyTEAMサービス上での同意確認を目的としたものであり、弁護士による法的助言に代わるものではありません。法的な拘束力や効力については、必要に応じて専門家にご相談ください。
          </div>
          確認日：${new Date().toLocaleDateString('ja-JP')}<br>
          確認者：<b style="color:var(--txt1)">${me.name}</b>（登録コーチ）<br>
          開示元：<b style="color:var(--txt1)">${team ? team.name : ''}（チーム）</b><br>
          サービス運営：<b style="color:var(--txt1)">株式会社ark（MyCOACH-MyTEAM 運営事務局、以下「運営」）</b>
        </div>
        
        コーチは、チームが管理する選手の個人情報（以下「選手情報」）の閲覧にあたり、以下の事項を確認・同意します。<br><br>
        
        <b style="color:var(--txt1)">【対象となる情報】</b><br>
        選手の氏名・年齢・身長・体重・ポジション・トレーニング記録・コンディションデータ・食事・栄養記録・その他指導に関連する情報<br><br>
        
        <b style="color:var(--txt1)">第1条（利用目的の限定）</b><br>
        選手情報は、本チームにおける指導・コーチング業務の目的に限り使用するものとし、他の目的に利用しないよう努めること。<br><br>
        
        <b style="color:var(--txt1)">第2条（第三者への提供禁止）</b><br>
        選手情報を、チームの事前承諾なく、第三者に提供・開示しないこと。SNS・ブログ等への投稿も含みます。<br><br>
        
        <b style="color:var(--txt1)">第3条（安全管理）</b><br>
        選手情報を含むデータを適切に管理し、不正アクセス・紛失の防止に努めること。<br><br>
        
        <b style="color:var(--txt1)">第4条（関連法令の尊重）</b><br>
        個人情報の保護に関する法律その他の関連法令を尊重し、適切な取り扱いに努めること。未成年の選手に係る情報については、特に慎重な管理を行うこと。<br><br>
        
        <b style="color:var(--txt1)">第5条（責任の所在について）</b><br>
        <span style="background:rgba(249,115,22,.06);border:1px solid rgba(249,115,22,.2);border-radius:6px;padding:6px 8px;display:block;margin-bottom:6px">選手情報の取り扱いに関する責任は、原則としてコーチご本人に帰属します。運営（株式会社ark）はプラットフォームの提供者として、コーチによる情報の取り扱いについて直接的な管理を行う立場にないことをご理解ください。なお、個人情報の不適切な取り扱いについては、関連法令に基づく対応が求められる場合があります。</span><br><br>
        
        <b style="color:var(--txt1)">第6条（問題発生時の報告）</b><br>
        選手情報の漏洩またはそのおそれが生じた場合、速やかにチームおよび運営にご連絡いただき、被害の拡大防止にご協力ください。<br><br>
        
        <b style="color:var(--txt1)">第7条（利用終了後の対応）</b><br>
        チームとの指導関係終了後は、不要になった選手情報を速やかに削除・破棄するよう努めること。<br><br>
        
        <b style="color:var(--txt1)">第8条（同意の記録）</b><br>
        本同意確認における氏名入力・日時は、サービス上でコーチが内容を確認し同意した記録として保管されます。ただし、本記録は電子署名法に基づく法的な電子署名ではなく、サービス上の同意確認の記録です。<br><br>
        
        <b style="color:var(--txt1)">第9条（準拠法）</b><br>
        本同意確認は日本法に基づくものとします。
      </div>
    </div>
    
    <div id="pledge-sign-area" style="opacity:.35;pointer-events:none;transition:opacity .4s">
      <!-- チェックボックス確認 -->
      <div style="background:var(--surf2);border-radius:10px;padding:12px;margin-bottom:12px">
        <div style="font-size:11px;font-weight:700;color:var(--txt3);margin-bottom:10px;text-transform:uppercase;letter-spacing:.5px">署名前の確認事項（全項目必須）</div>
        ${['上記の内容を最後まで読み、理解しました',
           '選手情報を指導目的に限って使用し、適切に管理することに同意します',
           '情報の取り扱いに関する責任が自身にあることを理解しています',
           '利用終了後は不要な選手情報を速やかに削除するよう努めます'].map((label,i)=>`
          <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:8px;cursor:pointer" onclick="togglePledgeCheck(${i},this)">
            <div id="pchk-${i}" style="width:18px;height:18px;border:2px solid var(--b2);border-radius:4px;flex-shrink:0;display:flex;align-items:center;justify-content:center;margin-top:1px;transition:.2s"></div>
            <div style="font-size:11px;color:var(--txt2);line-height:1.6">${label}</div>
          </div>`).join('')}
      </div>
      
      <!-- 電子署名 -->
      <div class="form-group" style="margin-bottom:10px">
        <label style="font-size:12px;color:var(--txt3);display:block;margin-bottom:6px">フルネームを入力（電子署名として記録）</label>
        <input class="input" id="pledge-sig" placeholder="例：山田 太郎" oninput="updatePledgeSig(this.value)">
      </div>
      <div id="pledge-pad" style="border:2px dashed var(--b2);border-radius:10px;padding:14px;text-align:center;margin-bottom:12px;background:var(--surf2)">
        <div style="font-size:10px;color:var(--txt3);margin-bottom:4px">署名プレビュー</div>
        <span id="pledge-sig-display" style="font-family:cursive;font-size:24px;color:var(--txt3)">← 上のフォームに名前を入力</span>
      </div>
      <div style="background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.2);border-radius:8px;padding:10px 12px;margin-bottom:12px;font-size:11px;color:var(--txt2);line-height:1.7">
        <i class="fa fa-exclamation-triangle" style="color:#ef4444;margin-right:6px"></i>
        この電子署名は法的拘束力を持ち、署名日時（${new Date().toLocaleString('ja-JP')}）・IPアドレスと共にサーバーに5年間保管されます。<b>情報漏洩が発生した際はこの署名記録をもってコーチ側の責任が立証されます。</b>
      </div>
      <button class="btn btn-primary w-full" id="pledge-btn" disabled onclick="submitPledge('${d.id}')">
        <i class="fa fa-pen" style="margin-right:8px"></i>上記内容に同意し、選手情報の閲覧を開始する
      </button>
    </div>
    <p style="font-size:10px;color:var(--txt3);text-align:center;margin-top:10px">
      <i class="fa fa-scroll"></i> 最後までスクロールすると同意欄が有効になります
    </p>
  `);
}

// 誓約書スクロールチェック
function checkPledgeScroll(el){
  if(el.scrollTop + el.clientHeight >= el.scrollHeight - 10){
    const area = document.getElementById('pledge-sign-area');
    if(area){ area.style.opacity='1'; area.style.pointerEvents='auto'; }
  }
}

// 誓約チェックボックストグル
let _pledgeChecks=[false,false,false,false,false];
function togglePledgeCheck(i,el){
  _pledgeChecks[i]=!_pledgeChecks[i];
  const box=document.getElementById('pchk-'+i);
  if(box){
    box.style.background=_pledgeChecks[i]?'var(--grn)':'';
    box.style.borderColor=_pledgeChecks[i]?'var(--grn)':'var(--b2)';
    box.innerHTML=_pledgeChecks[i]?'<i class="fa fa-check" style="font-size:10px;color:#fff"></i>':'';
  }
  _updatePledgeBtn();
}

// 署名プレビュー更新
function updatePledgeSig(v){
  const disp = document.getElementById('pledge-sig-display');
  const pad = document.getElementById('pledge-pad');
  if(disp) disp.textContent = v || '← 上のフォームに名前を入力';
  if(disp) disp.style.color = v ? 'var(--grn)' : 'var(--txt3)';
  if(pad) pad.style.borderColor = v ? 'var(--grn)' : 'var(--b2)';
  _updatePledgeBtn();
}

function _updatePledgeBtn(){
  const btn = document.getElementById('pledge-btn');
  const sig = document.getElementById('pledge-sig');
  const allChecked = _pledgeChecks.every(Boolean);
  const hasSig = sig && sig.value.trim();
  if(btn) btn.disabled = !(allChecked && hasSig);
}

// 誓約書署名実行（コーチ）
function submitPledge(disclosureId){
  const sigEl = document.getElementById('pledge-sig');
  const sig = sigEl ? sigEl.value.trim() : '';
  if(!sig){ toast('署名を入力してください','e'); return; }
  const d = _dbArr('disclosures').find(x => x.id === disclosureId);
  if(!d){ toast('開示情報が見つかりません','e'); return; }
  d.coachSignature = sig;
  d.coachAgreedAt = new Date().toLocaleString('ja-JP');
  d.coachAgreedIp = 'クライアント端末（記録済）';
  d.legalAckVersion = '1.0';
  d.userAgent = navigator.userAgent.slice(0,50)||'記録済';
  d.pledgeHash = 'SHA256:' + Array.from(sig+d.coachAgreedAt).reduce((a,c)=>a+c.charCodeAt(0),0).toString(16) + '（証跡）';
  // スレッドに通知
  const pt = _dbArr('payThreads').find(p => p.teamId === d.teamId && p.coachId === d.coachId);
  if(pt){
    pt.messages.push({
      from: 'system',
      teamText: `${d.coachName}コーチが個人情報保護同意確認が完了しました。選手情報へのアクセスが有効になりました。`,
      coachText: '個人情報保護誓約書への署名が完了しました。担当選手・選手レポートにアクセスできます。',
      time: new Date().toLocaleString('ja-JP')
    });
  }
  addNotif('選手情報へのアクセスが有効になりました','fa-unlock','coach-players');
  saveDB();
  closeM();
  toast('同意確認が完了しました。担当選手・レポートにアクセスできます。','s');
  goTo('coach-players');
}

// ==================== REQUEST & MATCHING SYSTEM ====================

// ユーザーキー取得（myKeyMap は APP セクションで定義済み）
function getMyKey(){
  const u=DB.currentUser;
  if(!u) return 'admin';
  return u.id||u.role;
}
// チーム取得（ログイン中のチームユーザーに紐づくチーム）
function getMyTeam(){
  const u=DB.currentUser;
  if(!u) return null;
  return DB.teams.find(t=>t.id===u.id) || DB.teams.find(t=>t.name===u.name) || null;
}
// コーチ取得
function getMyCoach(){
  const u=DB.currentUser;
  if(!u) return null;
  return DB.coaches.find(c=>c.id===u.id) || DB.coaches.find(c=>c.name===u.name) || null;
}

// 自分が所属するチームIDを返す（全ロール対応）
function _getMyTeamId(){
  const u=DB.currentUser;if(!u)return null;
  const r=u.role;
  if(r==='team'){ const t=getMyTeam(); return t?t.id:null; }
  if(r==='coach'){ const c=getMyCoach(); if(!c)return null; const t=DB.teams.find(t=>t.coach===c.id); if(t)return t.id; const mR=_dbArr('requests').find(r=>r.coachId===c.id&&r.status==='matched'); return mR?mR.teamId:null; }
  if(r==='player'){ const p=DB.players.find(x=>x.id===u.id); return p?p.team:null; }
  if(r==='parent'){
    // 方法1: players配列のguardianIdから直接チームを取得（最も信頼性が高い）
    const childP=DB.players.find(x=>x.guardianId===u.id);
    if(childP) return childP.team||null;
    // 方法2: currentUserのlinkedPlayersから取得
    if(DB.currentUser?.linkedPlayers?.length){
      const cp=DB.players.find(x=>x.id===DB.currentUser.linkedPlayers[0]);
      if(cp) return cp.team||null;
    }
    // 方法3: usersテーブルのlinkedPlayerIdから取得（旧互換）
    const users=_getUsers();
    const gu=users.find(x=>x.id===u.id);
    if(gu?.linkedPlayerId){
      const p=DB.players.find(x=>x.id===gu.linkedPlayerId);
      return p?p.team:null;
    }
    return null;
  }
  return null; // admin
}

// 自分が見える全チームIDリストを返す（コーチは複数チーム担当の場合あり）
function _getMyTeamIds(){
  const u=DB.currentUser;if(!u)return [];
  const r=u.role;
  if(r==='admin') return DB.teams.map(t=>t.id);
  if(r==='team'){ const t=getMyTeam(); return t?[t.id]:[]; }
  if(r==='coach'){ const c=getMyCoach(); if(!c)return []; const ids=new Set(DB.teams.filter(t=>t.coach===c.id).map(t=>t.id)); _dbArr('requests').filter(r=>r.coachId===c.id&&r.status==='matched').forEach(r=>{if(r.teamId)ids.add(r.teamId);}); return [...ids]; }
  if(r==='player'){ const p=DB.players.find(x=>x.id===u.id); return p&&p.team?[p.team]:[]; }
  if(r==='parent'){
    const tid=_getMyTeamId();
    return tid?[tid]:[];
  }
  return [];
}

// チーム → コーチへ依頼送信
function sendMatchRequest(coachId){
  if(window._sendingMatch){return;}window._sendingMatch=true;setTimeout(()=>{window._sendingMatch=false;},3000);
  if(!DB.requests)DB.requests=[];
  const msgEl=document.getElementById('match-msg');
  const msg=msgEl?msgEl.value.trim()||'指導をお願いしたいです。':'指導をお願いしたいです。';
  const team=getMyTeam();
  if(!team){toast('チーム情報が取得できません','e');return;}
  const coach=DB.coaches.find(x=>x.id===coachId);
  if(!coach){toast('コーチが見つかりません','e');return;}
  
  const contractType=window._contractType||'monthly';
  let otTitle='',otPrice=0,otDate='',otOnline=false;
  if(contractType==='onetime'){
    var otValid = validateForm([
      ['ot-title', {required: true, requiredMsg: '依頼内容を入力してください'}]
    ]);
    if (!otValid) return;
    otTitle=(document.getElementById('ot-title')?.value||'').trim();
    otPrice=parseInt(document.getElementById('ot-price')?.value)||0;
    otDate=document.getElementById('ot-date')?.value||'';
    otOnline=document.getElementById('ot-online')?.checked||false;
    const _isNeg=coach.onetimeNegotiable;
    if(!_isNeg&&otPrice<1000){
      validateField('ot-price', {min: 1000});
      return;
    }
  }
  
  const dup=_dbArr('requests').find(r=>r.coachId===coachId&&r.teamId===team.id&&r.status==='pending');
  if(dup){toast('既にこのコーチへ申請済みです','e');return;}
  
  const reqId='mr'+Date.now();
  const reqObj={
    id:reqId, type:'team_to_coach',
    coachId, teamId:team.id,
    coachName:coach.name, teamName:team.name,
    status:'pending', msg,
    contractType,
    createdAt:new Date().toISOString().slice(0,10)
  };
  if(contractType==='onetime'){
    reqObj.onetimeTitle=otTitle;
    reqObj.onetimePrice=otPrice;
    reqObj.onetimeDate=otDate;
    reqObj.online=otOnline;
  }
  _dbArr('requests').push(reqObj);
  
  const sysMsg=contractType==='onetime'
    ?`${team.name}から臨時コーチ依頼が届きました。\n📋 ${otTitle}${otPrice>0?'\n💰 報酬: ¥'+otPrice.toLocaleString():'\n💬 報酬: 要相談'}\n📅 ${otDate||'日程調整中'}${otOnline?'\n💻 オンライン（Google Meet）':''}`
    :`${team.name}からコーチ依頼が届きました。${coach.monthlyNegotiable?'\n💬 月額料金は要相談。チャットで条件を確認してください。':'\n💰 月額: ¥'+(coach.price||0).toLocaleString()}`;
  
  // 同じコーチ×チームの既存チャットを探す（統合表示）
  let chatKey=Object.keys(DB.chats).find(k=>{
    const c=DB.chats[k];
    return c.type==='match'&&c.coachId===coachId&&c.teamId===team.id;
  });
  if(chatKey){
    // 既存ルームに追加
    const ec=DB.chats[chatKey];
    ec.reqId=reqId; // 最新のreqIdに更新
    ec.contractType=contractType;
    ec.sub=contractType==='onetime'?'臨時コーチ依頼':'🤝 マッチング申請中';
    if(contractType==='onetime'&&otOnline) ec.online=true;
    ec.msgs.push({mid:_genMsgId(),from:'system',name:'システム',text:'── 新しい依頼 ──',time:now_time(),date:new Date().toISOString().slice(0,10),read:false});
    ec.msgs.push({mid:_genMsgId(),from:'system',name:'システム',text:sysMsg,time:now_time(),date:new Date().toISOString().slice(0,10),read:false});
    ec.msgs.push({mid:_genMsgId(),from:team.id,name:team.name,text:msg,time:now_time(),date:new Date().toISOString().slice(0,10),read:false});
    ec.unread=(ec.unread||0)+3;
  } else {
    chatKey='req_'+reqId;
    DB.chats[chatKey]={
      name:coach.name+' ↔ '+team.name,
      sub:contractType==='onetime'?'臨時コーチ依頼':'🤝 マッチング申請中', avi:contractType==='onetime'?'⚡':'🤝',
      coachId, teamId:team.id, reqId, type:'match',
      contractType, online:contractType==='onetime'&&otOnline,
      msgs:[{mid:_genMsgId(),from:'system',name:'システム',text:sysMsg,time:now_time(),read:false},
        {from:team.id,name:team.name,text:msg,time:now_time(),read:false},
      ],
      unread:2
    };
  }
  
  saveDB();
  addNotif(team.name+'からコーチ依頼が届きました','fa-handshake','chat');
  notifyByEmail('coach_request',{email:coach.email,name:coach.name},{teamName:team.name});
  closeM();
  toast(coach.name+'にマッチング申請を送りました！承認されるとチャットで相談を開始できます。','s');
  window._csTab='matched';
  window._contractType='monthly';
  activeRoom=chatKey;
  refreshPage();
}

// コーチ → チームへ応募送信
function sendTeamApplication(teamId){
  if(window._sendingApp){return;}window._sendingApp=true;setTimeout(()=>{window._sendingApp=false;},3000);
  const msgEl=document.querySelector('#modal-body textarea');
  const msg=msgEl?msgEl.value.trim()||'ぜひ指導させてください。':'ぜひ指導させてください。';
  const coach=getMyCoach();
  if(!coach){toast('コーチ情報が取得できません','e');return;}
  const team=DB.teams.find(t=>t.id===teamId);
  if(!team){toast('チームが見つかりません','e');return;}
  
  const dup=_dbArr('requests').find(r=>r.coachId===coach.id&&r.teamId===teamId&&r.status==='pending');
  if(dup){toast('既にこのチームへ応募済みです','e');return;}
  
  const reqId='mr'+Date.now();
  _dbArr('requests').push({
    id:reqId, type:'coach_to_team',
    coachId:coach.id, teamId,
    coachName:coach.name, teamName:team.name,
    status:'pending', msg,
    createdAt:new Date().toISOString().slice(0,10)
  });
  
  // 同じコーチ×チームの既存チャットを探す（統合表示）
  let chatKey=Object.keys(DB.chats).find(k=>{
    const c=DB.chats[k];
    return c.type==='match'&&c.coachId===coach.id&&c.teamId===teamId;
  });
  if(chatKey){
    const ec=DB.chats[chatKey];
    ec.reqId=reqId;
    ec.sub='マッチング申請中';
    ec.msgs.push({mid:_genMsgId(),from:'system',name:'システム',text:'── 新しい応募 ──',time:now_time(),date:new Date().toISOString().slice(0,10),read:false});
    ec.msgs.push({mid:_genMsgId(),from:'system',name:'システム',text:coach.name+'コーチから応募が届きました。',time:now_time(),date:new Date().toISOString().slice(0,10),read:false});
    ec.msgs.push({mid:_genMsgId(),from:coach.id,name:coach.name,text:msg,time:now_time(),date:new Date().toISOString().slice(0,10),read:false});
    ec.unread=(ec.unread||0)+3;
  } else {
    chatKey='req_'+reqId;
    DB.chats[chatKey]={
      name:coach.name+' ↔ '+team.name,
      sub:'マッチング申請中', avi:'🤝',
      coachId:coach.id, teamId, reqId, type:'match',
      msgs:[{mid:_genMsgId(),from:'system',name:'システム',text:coach.name+'コーチから応募が届きました。',time:now_time(),read:false},
        {from:coach.id,name:coach.name,text:msg,time:now_time(),read:false},
      ],
      unread:2
    };
  }
  
  saveDB();
  addNotif(coach.name+'コーチから応募が届きました','fa-user-check','chat');
  closeM();
  toast(team.name+'に応募しました！チームの承認をお待ちください。','s');
  // 応募済みバッジを即時表示するためページ再描画
  activeRoom=chatKey;
  refreshPage();
}

// ヘルパー：現在時刻
function now_time(){return new Date().toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'});}

// オンラインミーティング有効化
function enableOnlineMeeting(roomKey){
  const ch=DB.chats[roomKey];if(!ch)return;
  ch.online=true;
  ch.msgs.push({mid:_genMsgId(),from:'system',name:'システム',text:'💻 オンラインコーチングが有効になりました。「Meet開始」ボタンからGoogle Meetを開始できます。',time:now_time(),date:new Date().toISOString().slice(0,10),read:false});
  saveDB();refreshPage();
  toast('オンラインMeetを有効にしました','s');
}

// ====== 手数料率ヘルパー ======
// type: 'monthlyFee'(月謝), 'coachFee'(コーチ代), 'adhocFee'(都度請求), 'goodsFee'(用品等)
function getFeeRate(teamId, type){
  if(!DB.teamFeeRates) DB.teamFeeRates={};
  const custom=DB.teamFeeRates[teamId];
  if(custom && custom[type]!==undefined && custom[type]!==null) return custom[type];
  // グローバルデフォルト（設定画面の値 or 10%）
  const defaults={monthlyFee:DB.settings?.feeRate||10, coachFee:DB.settings?.coachRate||10, adhocFee:DB.settings?.feeRate||10, goodsFee:DB.settings?.feeRate||10};
  return defaults[type]||10;
}
function getFeeAmount(amount, teamId, type){
  return Math.round(amount * getFeeRate(teamId, type) / 100);
}
function setTeamFeeRate(teamId, type, val){
  if(!DB.teamFeeRates) DB.teamFeeRates={};
  if(!DB.teamFeeRates[teamId]) DB.teamFeeRates[teamId]={};
  DB.teamFeeRates[teamId][type]=Math.min(100,Math.max(0,parseInt(val)||10));
  saveDB();
}

// ====== チームマッチング ======
if(!DB.teamMatches) DB.teamMatches=[];
if(!DB.leagues) DB.leagues=[];
if(!DB.teamReviews) DB.teamReviews=[];
if(!DB.teamEvents)  DB.teamEvents=[];

function _tmOnboardingNeeded(my){
  if(!my) return false;
  // ユーザーが「閉じる」で非表示にした場合
  if(DB.settings?._tmOnboardDismissed) return false;
  var missing=0;
  if(!my.matchMessage) missing++;
  if(!my.matchDays) missing++;
  if(!my.teamLevel) missing++;
  if(!my.ageGroup) missing++;
  if(!my.homeGround) missing++;
  return missing > 0;
}
function dismissTmOnboard(){
  if(!DB.settings)DB.settings={};
  DB.settings._tmOnboardDismissed=true;
  saveDB();refreshPage();
}
function _tmOnboardingChecklist(my){
  var items=[
    {k:'matchMessage',l:'募集メッセージ',i:'💬'},
    {k:'matchDays',l:'対戦可能日',i:'📅'},
    {k:'teamLevel',l:'チームレベル',i:'📊'},
    {k:'ageGroup',l:'カテゴリ',i:'🎯'},
    {k:'homeGround',l:'練習場所',i:'🏠'},
    {k:'lookingFor',l:'求める相手',i:'🔍'}
  ];
  return items.map(function(item){
    var done=!!my[item.k];
    return '<span style="padding:3px 8px;border-radius:6px;font-size:10px;font-weight:600;background:'+(done?'rgba(0,207,170,.08)':'rgba(239,68,68,.06)')+';color:'+(done?'var(--teal)':'#ef4444')+'">'+item.i+' '+(done?'✓ ':'✗ ')+item.l+'</span>';
  }).join('');
}
function _tmFilterChips(teams, my){
  // Extract unique values for level, area, age
  var levels=[...new Set(teams.map(t=>t.teamLevel).filter(Boolean))];
  var areas=[...new Set(teams.map(t=>{var a=t.area||'';return a.includes('区')?a.split('区')[0].split('都').pop()+'区':a.includes('市')?a.split('市')[0].split('県').pop()+'市':a.slice(0,6);}).filter(Boolean))];
  var ages=[...new Set(teams.flatMap(t=>(t.ageGroup||'').split(/[\s\/・,]+/).filter(a=>a.startsWith('U-'))))];
  var chips=[];
  var flv=window._tmLevel||'';var far=window._tmArea||'';var fag=window._tmAge||'';
  // Level chips
  levels.forEach(function(l){
    var active=flv===l;
    chips.push('<button onclick="window._tmLevel=\''+(active?'':l)+'\';goTo(\'team-match\')" style="padding:4px 10px;border-radius:20px;font-size:10px;font-weight:'+(active?'700':'500')+';border:'+(active?'2px solid var(--teal)':'1px solid var(--b1)')+';background:'+(active?'rgba(0,207,170,.08)':'var(--surf)')+';color:'+(active?'var(--teal)':'var(--txt3)')+';cursor:pointer">📊 '+l+'</button>');
  });
  // Area chips
  areas.slice(0,5).forEach(function(a){
    var active=far===a;
    chips.push('<button onclick="window._tmArea=\''+(active?'':a)+'\';goTo(\'team-match\')" style="padding:4px 10px;border-radius:20px;font-size:10px;font-weight:'+(active?'700':'500')+';border:'+(active?'2px solid var(--blue)':'1px solid var(--b1)')+';background:'+(active?'rgba(59,130,246,.08)':'var(--surf)')+';color:'+(active?'var(--blue)':'var(--txt3)')+';cursor:pointer">📍 '+a+'</button>');
  });
  // Age chips
  ages.forEach(function(a){
    var active=fag===a;
    chips.push('<button onclick="window._tmAge=\''+(active?'':a)+'\';goTo(\'team-match\')" style="padding:4px 10px;border-radius:20px;font-size:10px;font-weight:'+(active?'700':'500')+';border:'+(active?'2px solid var(--org)':'1px solid var(--b1)')+';background:'+(active?'rgba(249,115,22,.08)':'var(--surf)')+';color:'+(active?'var(--org)':'var(--txt3)')+';cursor:pointer">🎯 '+a+'</button>');
  });
  return chips.join('');
}

function _tmOther(m){const my=getMyTeam();return m.teamAId===my?.id?m.teamBId:m.teamAId;}
function _tmOtherT(m){return DB.teams.find(t=>t.id===_tmOther(m));}
function _tmDaysAgo(t){
  var d=t.createdAt||t.updatedAt||'';
  if(!d) return 999;
  return Math.floor((Date.now()-new Date(d).getTime())/86400000);
}
function _tmActiveLabel(t){
  var d=_tmDaysAgo(t);
  if(d<=1) return '今日';if(d<=3) return d+'日前';if(d<=7) return '今週';
  if(d<=14) return '2週間内';if(d<=30) return '今月';return '1ヶ月+';
}
function _tmNewTeams(list,allM){
  return list.filter(function(t){
    var ex=allM.find(function(m){return(m.teamAId===t.id||m.teamBId===t.id)&&(m.status==='pending'||m.status==='matched');});
    return !ex && _tmDaysAgo(t)<=14;
  }).slice(0,5);
}
function _tmLookingForMatch(list,allM){
  return list.filter(function(t){
    var ex=allM.find(function(m){return(m.teamAId===t.id||m.teamBId===t.id)&&(m.status==='pending'||m.status==='matched');});
    return !ex && t.matchMessage && t.matchMessage.length>10;
  }).slice(0,5);
}
function _quickMatch(tid){
  var t=DB.teams.find(x=>x.id===tid);
  if(!t){toast('チームが見つかりません','e');return;}
  if(!confirm(t.name+'にマッチング申請を送りますか？'))return;
  sendTeamMatchRequest(tid,'練習試合をお願いしたいです。よろしくお願いします！');
}
function _tmCnt(tid){return(DB.teamMatches||[]).filter(m=>(m.teamAId===tid||m.teamBId===tid)&&m.status==='matched').length;}

// ==================== 📦 物品管理 ====================
