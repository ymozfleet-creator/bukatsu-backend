// 18-chat.js — Chat
function chatPage(){
  _pollFirestoreUpdates();
  // ── 重複チャットルーム統合 ──
  _deduplicateChatRooms();
  const rooms=Object.entries(DB.chats);
  const myKey=getMyKey();
  const role=DB.currentUser?.role;
  const myId=DB.currentUser?.id;

  // ── チャットルーム表示制限 ──
  // admin: すべて見える（モニタリング用）
  // それ以外: 自分が当事者のルームのみ
  const filteredRooms=rooms.filter(([k,ch])=>{
    // アーカイブ済みは非表示
    if(ch.archived) return false;
    // 管理者はすべて閲覧可能
    if(role==='admin') return true;

    // g1（全体連絡）は管理者専用
    if(k==='g1') return false;

    // 問い合わせチャット: 自分のもののみ
    if(ch.isInquiry) return ch.userId===myId;

    // コーチマッチングチャット (type:'match'): coachId or teamId が自分
    if(ch.type==='match'){
      if(role==='team'){
        const mt=getMyTeam();
        return mt && ch.teamId===mt.id;
      }
      if(role==='coach'){
        const mc=getMyCoach();
        return mc && ch.coachId===mc.id;
      }
      // player/parentはコーチマッチングチャットに参加しない
      return false;
    }

    // チームマッチングチャット (type:'team_match'): teamAId or teamBId が自分
    if(ch.type==='team_match'){
      if(role==='team'){
        const mt=getMyTeam();
        return mt && (ch.teamAId===mt.id || ch.teamBId===mt.id);
      }
      // コーチ・選手・保護者はチームマッチングチャットに参加しない
      return false;
    }

    // ダイレクトメッセージ (dm_): 自分が送信者 or 受信者
    if(k.startsWith('dm_')){
      return k.includes(myId) || ch.userId===myId || ch.senderId===myId;
    }

    // グループチャット: メンバーに含まれている
    if(ch.isGroup&&ch.members?.includes(myId)) return true;

    // その他: msgs内に自分のメッセージがあるか、userId等が自分のもの
    if(ch.userId===myId) return true;
    if(ch.msgs && ch.msgs.some(m=>m.from===myId || m.from===myKey)) return true;

    return false;
  });
  const filteredKeys=filteredRooms.map(([k])=>k);
  if(!filteredKeys.includes(activeRoom)&&filteredKeys.length>0) activeRoom=filteredKeys[0];
  if(activeRoom==='g1'&&role!=='admin'&&filteredKeys.length>0) activeRoom=filteredKeys.find(k=>k!=='g1')||filteredKeys[0];
  const totalUnread = filteredRooms.reduce((s,[,ch])=>{
    if(!ch.msgs)return s;
    return s+ch.msgs.filter(m=>m.from!==myKey&&!m.read).length;
  },0);

  return`<div class="pg-head flex justify-between items-center">
    <div>
      <div class="pg-title">メッセージ${totalUnread>0?` <span class="badge b-org" style="font-size:11px">${totalUnread}</span>`:''}</div>
      <div class="pg-sub">${filteredRooms.length}件の会話</div>
    </div>
    ${role==='admin'?`<div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn btn-primary btn-sm" onclick="openNewChatModal()">+ 新規</button><button class="btn btn-secondary btn-sm" onclick="openGroupChatModal()">👥 グループ</button>${totalUnread>0?`<button class="btn btn-ghost btn-sm" onclick="markAllChatsRead()">✓ 全既読</button>`:''}  <button class="btn btn-sm" onclick="openAdminMsgMonitor()"><i class="fa fa-shield-alt" style="margin-right:4px"></i>監視</button></div>`:`<div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn btn-primary btn-sm" onclick="openNewChatModal()">+ 新規</button><button class="btn btn-secondary btn-sm" onclick="openGroupChatModal()">👥 グループ</button>${totalUnread>0?`<button class="btn btn-ghost btn-sm" onclick="markAllChatsRead()">✓ 全既読</button>`:''}</div>`}
  </div>
  <div class="chat-layout">
    <div class="chat-left">
      <div class="chat-left-head">
        <div class="fw7 text-sm">会話</div>
        ${role==='admin'?`<button class="btn btn-ghost btn-icon btn-xs" onclick="openNewChatModal()" style="font-size:12px" title="新規チャット">+</button>`:`<button class="btn btn-ghost btn-icon btn-xs" onclick="openNewChatModal()" style="font-size:12px" title="新規チャット">+</button>`}
      </div>
      <div class="chat-search" style="position:relative">
        <i class="fa fa-search" style="position:absolute;left:24px;top:50%;transform:translateY(-50%);font-size:11px;color:var(--txt3);pointer-events:none"></i>
        <input class="input" id="chat-search-inp" placeholder="会話を検索..." style="font-size:12px;padding:9px 12px 9px 36px"
          oninput="filterChatRooms(this.value)">
      </div>
      <div class="chat-rooms" id="chat-rooms-list">
        ${filteredRooms.length === 0 ? `
          <div style="text-align:center;padding:32px 16px;color:var(--txt3)">
            <div style="font-size:32px;margin-bottom:8px">💬</div>
            <div style="font-size:12px">会話がありません</div>
          </div>` :
        filteredRooms.sort((a,b)=>{
          // ピン留めルーム優先
          if(a[1].pinRoom&&!b[1].pinRoom)return -1;
          if(!a[1].pinRoom&&b[1].pinRoom)return 1;
          // 未読ありを上に
          const au=(a[1].msgs||[]).filter(m=>m.from!==myKey&&!m.read).length;
          const bu=(b[1].msgs||[]).filter(m=>m.from!==myKey&&!m.read).length;
          if(au>0&&!bu)return -1;if(!au&&bu>0)return 1;
          // 最終メッセージ日時でソート
          const aLast=a[1].msgs?.slice(-1)[0];
          const bLast=b[1].msgs?.slice(-1)[0];
          const aSort=(aLast?.date||'')+'T'+(aLast?.time||'');
          const bSort=(bLast?.date||'')+'T'+(bLast?.time||'');
          return bSort>aSort?1:bSort<aSort?-1:0;
        }).map(([k,ch])=>{
          const lastMsg=ch.msgs[ch.msgs.length-1];
          // 最終メッセージの送信者名（自分以外）
          const lastSenderName=lastMsg&&lastMsg.from!==myKey&&lastMsg.from!==myId&&lastMsg.from!=='system'?sanitize(lastMsg.name||'',8)+': ':'';
          const lastText=lastMsg?.img?'🖼️ 画像':lastMsg?.file?('📄 '+sanitize(lastMsg.file.name||'ファイル',14)):lastMsg?.forwarded?'↗️ 転送':lastMsg?.deleted?'🗑️ 削除済み':lastSenderName+sanitize(lastMsg?.text||'',26-lastSenderName.length);
          // 日時表示（今日→時刻、昨日→昨日、それ以外→日付）
          const _today=new Date().toISOString().slice(0,10);
          const _yest=new Date(Date.now()-86400000).toISOString().slice(0,10);
          const msgDate=lastMsg?.date||'';
          const msgTime=lastMsg?.time||'';
          const displayTime=msgDate===_today?msgTime.slice(0,5):msgDate===_yest?'昨日':msgDate?msgDate.slice(5).replace('-','/'):msgTime.slice(0,5);
          const isActive=activeRoom===k;
          const unreadCnt=ch.msgs?ch.msgs.filter(m=>m.from!==myKey&&!m.read).length:0;
          const hasUnread=unreadCnt>0;
          const isMuted=ch.muted;
          // DM: 相手の名前を表示（自分じゃない方）
          let displayName=ch.name;
          let displayAvi=ch.avi||'💬';
          if(k.startsWith('dm_')){
            const otherId=ch.senderId===myId?ch.userId:ch.senderId;
            if(otherId){
              const otherUser=_getUsers().find(u=>u.id===otherId);
              if(otherUser){ displayName=otherUser.name||displayName; displayAvi=(otherUser.name||'?')[0]; }
            }
          }
          if(ch.isGroup){displayAvi='👥';}
          return`<div class="chat-room ${isActive?'active':''}" id="room-${k}" onclick="switchRoom('${k}','${myKey}')" style="${hasUnread&&!isActive?'background:rgba(249,115,22,.04)':''}">
            <div style="position:relative;flex-shrink:0">
              <div class="avi" style="width:40px;height:40px;font-size:18px;background:var(--surf3)">${displayAvi}</div>
              ${hasUnread?`<div style="position:absolute;top:-2px;right:-2px;width:10px;height:10px;background:var(--org);border-radius:50%;border:2px solid var(--bg)"></div>`:''}
            </div>
            <div style="flex:1;min-width:0;overflow:hidden">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:4px;margin-bottom:3px">
                <div style="font-size:13px;font-weight:${hasUnread?700:600};color:var(--txt1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:flex;align-items:center;gap:4px">
                  ${isMuted?'<span style="font-size:10px;color:var(--txt3)">🔕</span>':''}
                  ${sanitize(displayName,22)}
                </div>
                <div style="font-size:10px;color:${hasUnread?'var(--org)':'var(--txt3)'};flex-shrink:0;font-weight:${hasUnread?700:400}">${displayTime}</div>
              </div>
              <div style="display:flex;align-items:center;gap:6px">
                <div style="font-size:12px;color:${hasUnread&&!isActive?'var(--txt2)':'var(--txt3)'};font-weight:${hasUnread?600:400};flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${lastText||'—'}</div>
                ${hasUnread?`<div style="flex-shrink:0;min-width:18px;height:18px;background:var(--org);border-radius:9px;color:#fff;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;padding:0 4px">${unreadCnt>99?'99+':unreadCnt}</div>`:''}
              </div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>
    <div class="chat-right" id="chat-right">${renderRoom(activeRoom,myKey)}</div>
  </div>`;
}

function filterChatRooms(query){
  const q = query.toLowerCase();
  document.querySelectorAll('.chat-room').forEach(el=>{
    const name = el.querySelector('div[style*="font-size:13px"]')?.textContent?.toLowerCase()||'';
    el.style.display = (!q || name.includes(q)) ? '' : 'none';
  });
}

function openNewChatModal(){
  const role=DB.currentUser?.role;
  const myId=DB.currentUser?.id;
  const allUsers = _getUsers().filter(u=>u.id!==myId);
  const roleLabels={admin:'事務局',team:'チーム',coach:'コーチ',player:'選手',parent:'保護者'};

  // ロール別に送信可能な相手を決定
  let candidates=[];
  if(role==='admin'){
    candidates=allUsers;
  } else if(role==='team'){
    // チーム: コーチ、他チーム、所属選手、事務局
    const myTeam=getMyTeam();
    const teamPlayers=DB.players.filter(p=>p.team===myTeam?.id);
    const playerIds=new Set(teamPlayers.map(p=>p.id));
    candidates=allUsers.filter(u=>u.role==='coach'||u.role==='admin'||u.role==='team'||playerIds.has(u.id));
  } else if(role==='coach'){
    // コーチ: 担当チーム、担当選手、事務局
    const myCoach=getMyCoach();
    const myTeams=DB.teams.filter(t=>t.coach===myCoach?.id);
    const teamIds=new Set(myTeams.map(t=>t.id));
    const teamPlayerIds=new Set(DB.players.filter(p=>teamIds.has(p.team)).map(p=>p.id));
    candidates=allUsers.filter(u=>u.role==='admin'||teamIds.has(u.id)||teamPlayerIds.has(u.id)||u.role==='team');
  } else if(role==='player'){
    // 選手: 所属チーム、担当コーチ、事務局
    const p=DB.players.find(x=>x.id===myId);
    const myTeam=p?DB.teams.find(t=>t.id===p.team):null;
    candidates=allUsers.filter(u=>u.role==='admin'||(myTeam&&u.id===myTeam.id)||(myTeam?.coach&&u.id===myTeam.coach));
  } else if(role==='parent'){
    // 保護者: 子供のチーム管理者、担当コーチ、事務局
    const children=DB.players.filter(p=>p.guardianId===myId);
    const childTeamIds=new Set(children.map(p=>p.team).filter(Boolean));
    const childCoachIds=new Set(DB.teams.filter(t=>childTeamIds.has(t.id)).map(t=>t.coach).filter(Boolean));
    candidates=allUsers.filter(u=>u.role==='admin'||childTeamIds.has(u.id)||childCoachIds.has(u.id));
  }

  // 既存DMがある相手を除外しない（同じ相手への追加メッセージは既存ルームに送る）
  const grouped={};
  candidates.forEach(u=>{
    const rl=roleLabels[u.role]||u.role;
    if(!grouped[rl])grouped[rl]=[];
    grouped[rl].push(u);
  });

  const roleIcons={admin:'🏢',team:'🏟️',coach:'🏅',player:'⚡',parent:'👤'};

  const options=Object.entries(grouped).map(([label,users])=>
    `<div style="font-size:11px;font-weight:700;color:var(--txt3);padding:8px 0 4px;text-transform:uppercase;letter-spacing:.5px">${label}</div>`+
    users.map(u=>{
      const existingRoom=Object.keys(DB.chats).find(k=>k==='dm_'+myId+'_'+u.id||k==='dm_'+u.id+'_'+myId);
      return `<div class="new-chat-user" onclick="selectChatTarget('${u.id}',this)" data-uid="${u.id}" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;cursor:pointer;transition:background .15s;border:2px solid transparent">
        <div class="avi" style="width:36px;height:36px;font-size:14px;background:var(--surf3);flex-shrink:0">${(u.name||'?')[0]}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:600;color:var(--txt1)">${sanitize(u.name,25)}</div>
          <div style="font-size:11px;color:var(--txt3)">${roleIcons[u.role]||''} ${label}${existingRoom?' · 💬 会話あり':''}</div>
        </div>
      </div>`;
    }).join('')
  ).join('');

  openM('💬 新規メッセージ', `
    <input class="input mb-12" id="new-chat-search" placeholder="🔍 名前で検索..." oninput="filterNewChatUsers(this.value)" style="font-size:13px">
    <div id="new-chat-list" style="max-height:280px;overflow-y:auto;margin-bottom:12px">
      ${options||'<div style="text-align:center;padding:24px;color:var(--txt3)">送信可能な相手がいません</div>'}
    </div>
    <input type="hidden" id="new-chat-target" value="">
    <div class="form-group"><label class="label">メッセージ</label>
      <textarea class="input" id="new-chat-msg" rows="3" placeholder="メッセージを入力..." style="font-size:13px"></textarea>
    </div>
    <button class="btn btn-primary w-full mt-8" onclick="createNewChat()">📩 送信</button>
  `);
}

function selectChatTarget(uid,el){
  document.querySelectorAll('.new-chat-user').forEach(e=>{e.style.borderColor='transparent';e.style.background='';});
  el.style.borderColor='var(--org)';el.style.background='rgba(255,107,43,.04)';
  document.getElementById('new-chat-target').value=uid;
}
function filterNewChatUsers(q){
  q=q.toLowerCase();
  document.querySelectorAll('.new-chat-user').forEach(el=>{
    const name=el.querySelector('[style*="font-weight:600"]')?.textContent?.toLowerCase()||'';
    el.style.display=(!q||name.includes(q))?'flex':'none';
  });
}

function createNewChat(){
  const targetId = document.getElementById('new-chat-target')?.value;
  const msg = document.getElementById('new-chat-msg')?.value?.trim();
  if(!targetId){ toast('送信先を選択してください','e'); return; }
  if(!msg){ toast('メッセージを入力してください','e'); return; }
  const target = _getUsers().find(u=>u.id===targetId);
  if(!target) return;
  const me = DB.currentUser;
  // 既存のDMルームを検索（双方向）
  let chatKey = Object.keys(DB.chats).find(k=>
    k==='dm_'+me.id+'_'+targetId || k==='dm_'+targetId+'_'+me.id
  );
  if(!chatKey){
    chatKey = 'dm_'+me.id+'_'+targetId;
    DB.chats[chatKey] = {
      name: target.name,
      sub: 'ダイレクトメッセージ',
      avi: (target.name||'?')[0],
      userId: targetId,
      senderId: me.id,
      msgs: [],
      unread: 0
    };
  }
  const _chatMsg = { from: me.id, name: sanitize(me.name,30), text: sanitize(msg,2000), time: now_time(), read: false };
  DB.chats[chatKey].msgs.push(_chatMsg);
  _sendChatToFirestore(chatKey, _chatMsg);
  saveDB();
  activeRoom = chatKey;
  closeM();
  toast('メッセージを送信しました','s');
  goTo('chat');
}

function renderRoom(roomKey,myKey){
  _startChatListener(roomKey);
  const ch=DB.chats[roomKey];if(!ch)return`<div class="chat-empty-state"><div style="font-size:48px;margin-bottom:16px">💬</div><div style="font-size:16px;font-weight:700;margin-bottom:8px">メッセージを選択</div><div style="font-size:13px;color:var(--txt3)">左のリストから会話を選んでください</div></div>`;
  if(ch.msgs){
    let hadUnread=false;
    ch.msgs.forEach(m=>{ if(m.from!==myKey&&!m.read){m.read=true;hadUnread=true;} });
    if(ch.unread>0||hadUnread){ch.unread=0;saveDB();updateNotifBadge();}
  }
  const role=DB.currentUser?.role;
  const approvalBanner=_buildApprovalBanner(ch,roomKey,role);
  // ピン留めメッセージ
  const pinnedIdx=ch.pinnedMsg!=null?ch.pinnedMsg:null;
  const pinnedMsg=pinnedIdx!=null&&ch.msgs[pinnedIdx]?ch.msgs[pinnedIdx]:null;
  const pinBanner=pinnedMsg?`<div class="pin-banner" onclick="scrollToMsg(${pinnedIdx})"><div style="display:flex;align-items:center;gap:6px;font-size:12px"><span>📌</span><span class="fw7">ピン留め:</span><span style="color:var(--txt2)">${sanitize(pinnedMsg.text||'',60)}</span></div></div>`:'';
  // 名前解決
  let _rName=ch.name,_rAvi=ch.avi||'💬',_rSub=ch.sub||'';
  if(roomKey.startsWith('dm_')){
    const _myId=DB.currentUser?.id;
    const _otherId=ch.senderId===_myId?ch.userId:ch.senderId;
    if(_otherId){const _ou=_getUsers().find(u=>u.id===_otherId);if(_ou){_rName=_ou.name||_rName;_rAvi=(_ou.name||'?')[0];}}
  }
  if(ch.isGroup){_rSub=`${(ch.members||[]).length}人のメンバー`;_rAvi='👥';}
  // 日付グループ化
  const today=new Date().toISOString().slice(0,10);
  const yesterday=new Date(Date.now()-86400000).toISOString().slice(0,10);
  const dateLabel=(d)=>d===today?'今日':d===yesterday?'昨日':d?d.slice(5).replace('-','/'):'';
  let msgsHtml='';
  let lastDate='';
  ch.msgs.forEach((m,i)=>{
    const d=m.date||today;
    if(d!==lastDate){msgsHtml+=`<div class="date-sep"><span>${dateLabel(d)}</span></div>`;lastDate=d;}
    const isMine=m.from===myKey;
    const isSys=m.from==='system';
    const prevMsg=i>0?ch.msgs[i-1]:null;
    const showName=!isMine&&!isSys&&(!prevMsg||prevMsg.from!==m.from);
    if(isSys){msgsHtml+=`<div class="msg-system-line"><span>${sanitize(m.text,500)}</span></div>`;return;}
    if(m.deleted){msgsHtml+=`<div class="msg-group ${isMine?'mine':'theirs'}" id="msg-${i}"><div class="bubble ${isMine?'mine':'theirs'}" style="opacity:.5;font-style:italic;font-size:12px">🗑️ このメッセージは削除されました</div></div>`;return;}
    const reactions=m.reactions||{};
    const reactionHtml=Object.entries(reactions).map(([e,users])=>{const _se=sanitize(e,8);const _su=sanitize(users.join(', '),100);return`<span class="reaction-badge" onclick="addReaction('${sanitize(roomKey,50)}',${i},'${_se}')" title="${_su}">${_se} ${users.length}</span>`;}).join('');
    const replyQuote=m.replyTo!=null&&ch.msgs[m.replyTo]?`<div class="reply-quote" onclick="scrollToMsg(${m.replyTo})">↩️ ${sanitize(ch.msgs[m.replyTo]?.name||'',12)}: ${sanitize(ch.msgs[m.replyTo]?.text||'',40)}</div>`:'';
    const editedTag=m.editedAt?`<span class="msg-edited">(編集済)</span>`:'';
    const fileHtml=m.file?`<div class="msg-file"><span style="font-size:20px">${{'pdf':'📄','doc':'📝','xlsx':'📊','pptx':'📽️','csv':'📋','txt':'📃','zip':'🗜️'}[m.file.ext]||'📎'}</span><div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${sanitize(m.file.name||'ファイル',30)}</div><div style="font-size:10px;color:var(--txt3)">${m.file.size||''}</div></div></div>`:'';
    const _safeVoiceUrl=m.voice&&m.voice.url&&(m.voice.url.startsWith('data:audio/')||m.voice.url.startsWith('blob:'))?m.voice.url:'';
    const voiceHtml=_safeVoiceUrl?`<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:rgba(255,107,43,.06);border-radius:10px;margin-bottom:4px"><span style="font-size:18px">🎤</span><audio controls src="${_safeVoiceUrl}" style="height:32px;flex:1;max-width:200px"></audio><span style="font-size:10px;color:var(--txt3)">${m.voice.size||''}</span></div>`:'';
    const _safeImg=m.img&&(m.img.startsWith('data:image/')||m.img.startsWith('blob:')||m.img.startsWith('https://'))?m.img:'';
    const _escapedImg=_safeImg.replace(/'/g,'%27').replace(/"/g,'%22');
    const imgHtml=_safeImg?`<img src="${_safeImg}" style="max-width:220px;border-radius:10px;display:block;margin-bottom:6px;cursor:pointer" alt="image" onclick="openImagePreview('${_escapedImg}')">`:'';
    const linkedText=_linkifyText(sanitize(m.text||'',2000));
    const isPinned=pinnedIdx===i;
    msgsHtml+=`<div class="msg-group ${isMine?'mine':'theirs'}" id="msg-${i}" style="position:relative${isPinned?';background:rgba(249,115,22,.04);border-radius:10px;padding:4px':''}" onmouseenter="showMsgActions(this,'${roomKey}',${i},'${isMine}')" onmouseleave="hideMsgActions(this)" ontouchstart="msgTouchStart(this,'${roomKey}',${i},'${isMine}')" ontouchend="msgTouchEnd()">
      ${showName?`<div class="msg-sender">${sanitize(m.name,50)}</div>`:''}
      <div class="bubble ${isMine?'mine':'theirs'}" style="position:relative">${replyQuote}${voiceHtml}${fileHtml}${imgHtml}${linkedText}${editedTag}</div>
      <div class="bubble-meta"><span>${m.time||''}</span>${isMine?`<span class="read-check" style="color:${m.read?'var(--teal)':'var(--txt3)'}">${m.read?'✓✓':'✓'}</span>`:''}${isPinned?'<span style="font-size:10px">📌</span>':''}${reactionHtml}</div>
      <div class="msg-actions" id="ma-${i}">
        <button class="btn btn-ghost btn-icon btn-xs" onclick="setReply('${roomKey}',${i})" title="返信">↩️</button>
        <button class="btn btn-ghost btn-icon btn-xs" onclick="quickReact('${roomKey}',${i})" title="リアクション">😊</button>
        ${isMine?`<button class="btn btn-ghost btn-icon btn-xs" onclick="editMsg('${roomKey}',${i})" title="編集">✏️</button>`:''}
        ${isMine?`<button class="btn btn-ghost btn-icon btn-xs" onclick="deleteMsg('${roomKey}',${i})" title="削除">🗑️</button>`:''}
        <button class="btn btn-ghost btn-icon btn-xs" onclick="forwardMsg('${roomKey}',${i})" title="転送">↗️</button>
        ${role==='admin'||isMine?`<button class="btn btn-ghost btn-icon btn-xs" onclick="pinMsg('${roomKey}',${i})" title="${isPinned?'ピン解除':'ピン留め'}">📌</button>`:''}
        ${role==='admin'&&!isMine?`<button class="btn btn-ghost btn-icon btn-xs" onclick="adminDeleteMsg('${roomKey}',${i})" style="color:var(--red)">🗑️</button><button class="btn btn-ghost btn-icon btn-xs" onclick="adminWarnUser('${roomKey}',${i})">⚠️</button>`:''}
      </div>
    </div>`;
  });
  const typingHtml=window._typingUsers?.[roomKey]?`<div class="typing-ind"><div class="typing-dots"><span></span><span></span><span></span></div> 入力中...</div>`:'';
  return`<div class="chat-rhead">
    <button class="back-btn" onclick="chatGoBack()">←</button>
    <div class="avi" style="width:38px;height:38px;font-size:16px;background:var(--surf3);flex-shrink:0">${_rAvi}</div>
    <div style="flex:1;min-width:0"><div class="fw7 text-sm" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${_rName}</div><div class="text-xs text-muted" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${_rSub}</div></div>
    <div style="display:flex;align-items:center;gap:6px;margin-left:auto">
      <button class="btn btn-ghost btn-xs" onclick="openChatSearch('${roomKey}')" title="メッセージ検索" style="font-size:12px">🔍</button>
      <button class="btn btn-ghost btn-xs" onclick="openTemplateManager()" title="テンプレート管理" style="font-size:12px">📝</button>
      <button class="btn btn-ghost btn-xs" onclick="openRoomInfo('${roomKey}')" title="ルーム情報" style="font-size:12px">ℹ️</button>
      <button onclick="startVideoCall('${roomKey}')" class="btn btn-ghost btn-xs" title="ビデオ通話" style="font-size:12px">📹</button>
      ${(ch.type==='match'&&_dbArr('payThreads').find(pt=>pt.chatKey===roomKey||(pt.coachId===ch.coachId&&pt.teamId===ch.teamId)))?`<button class="btn btn-ghost btn-xs" onclick="openLinkedThread('${roomKey}')" title="お支払いスレッド" style="font-size:12px;color:var(--org)">💰</button>`:''}
      ${role==='admin'?`<button class="btn btn-ghost btn-xs" onclick="openAdminChatInfo('${roomKey}')" style="font-size:10px">⚙️</button>`:''}
    </div>
  </div>
  <div class="msgs" id="msgs-area" onscroll="_onMsgsScroll(this)">${pinBanner}${approvalBanner}${msgsHtml}${typingHtml}</div>
  <div id="scroll-bottom-btn" style="display:none;position:absolute;bottom:80px;right:30px;z-index:10"><button onclick="document.getElementById('msgs-area').scrollTop=document.getElementById('msgs-area').scrollHeight" style="width:36px;height:36px;border-radius:50%;background:var(--org);color:#fff;border:none;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.2);font-size:16px;display:flex;align-items:center;justify-content:center">↓</button></div>
  <div id="typing-indicator" style="display:none;padding:2px 14px"></div>
      ${renderQuickReplyBar(roomKey)}
      <div class="chat-input-area">
    <div id="reply-preview" style="display:none;padding:6px 12px;background:var(--surf2);border-left:3px solid var(--org);margin-bottom:4px;font-size:11px;color:var(--txt3);border-radius:0 6px 6px 0"><div class="flex justify-between items-center"><span id="reply-preview-text"></span><button onclick="clearReply()" style="background:none;border:none;cursor:pointer;color:var(--txt3)">&times;</button></div></div>
    <div id="edit-preview" style="display:none;padding:6px 12px;background:rgba(59,130,246,.08);border-left:3px solid var(--blue);margin-bottom:4px;font-size:11px;color:var(--blue);border-radius:0 6px 6px 0"><div class="flex justify-between items-center"><span>✏️ メッセージを編集中</span><button onclick="cancelEdit()" style="background:none;border:none;cursor:pointer;color:var(--txt3)">&times;</button></div></div>
    <div style="position:relative">
      <div id="emoji-picker-wrap" style="display:none;position:absolute;bottom:48px;right:0;z-index:20">
        <div style="background:var(--surf);border:1px solid var(--b1);border-radius:14px;box-shadow:0 12px 36px rgba(0,0,0,.2);width:320px;overflow:hidden">
          <div style="display:flex;overflow-x:auto;padding:6px 8px;gap:2px;border-bottom:1px solid var(--b1);scrollbar-width:none">${Object.keys(EMOJI_CATS).map(c=>`<button class="emoji-cat-tab${c===_emojiCat?' active':''}" onclick="_emojiCat='${c}';_renderEmojiGrid()">${c.split(' ')[0]}</button>`).join('')}</div>
          <div id="emoji-grid" style="display:grid;grid-template-columns:repeat(8,1fr);gap:2px;padding:8px;max-height:200px;overflow-y:auto">${(EMOJI_CATS[_emojiCat]||[]).map(e=>`<button class="emoji-btn-item" onclick="insertEmoji('${e}')">${e}</button>`).join('')}</div>
        </div>
      </div>
      <div id="attach-menu" style="display:none;position:absolute;bottom:48px;left:0;background:var(--surf);border:1px solid var(--b1);border-radius:12px;padding:8px;box-shadow:0 8px 24px rgba(0,0,0,.15);z-index:20;flex-direction:column;gap:2px;min-width:160px">
        <button class="attach-menu-item" onclick="document.getElementById('chat-img-inp').click();hideAttachMenu()">🖼️ 画像</button>
        <button class="attach-menu-item" onclick="document.getElementById('chat-file-inp').click();hideAttachMenu()">📄 ファイル</button>
        <button class="attach-menu-item" onclick="startVoiceRecord();hideAttachMenu()">🎤 音声メッセージ</button>
      </div>
    </div>
    <div class="chat-input-row" style="align-items:flex-end">
      <button class="emoji-btn" onclick="toggleAttachMenu()" title="添付" style="font-size:16px">📎</button>
      <input type="file" id="chat-img-inp" accept="image/*" style="display:none" onchange="attachImage(this)">
      <input type="file" id="chat-file-inp" accept=".pdf,.doc,.docx,.xlsx,.csv,.pptx,.txt,.zip" style="display:none" onchange="attachFile(this)">
      <button class="emoji-btn" onclick="toggleEmoji()" title="絵文字">😊</button>
      <textarea id="chat-inp" oninput="_onChatInput()" placeholder="メッセージを入力... (Enter送信)" maxlength="2000" rows="1" style="flex:1;resize:none;border:none;background:transparent;padding:6px 8px;color:var(--txt1);font-size:16px;line-height:1.5;outline:none"
        onkeydown="if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();sendChat()}"
        oninput="this.style.height='auto';this.style.height=Math.min(this.scrollHeight,100)+'px';_emitTyping()"></textarea>
      <button class="btn btn-primary btn-xs" onclick="sendChat()" style="align-self:flex-end;border-radius:50%;width:32px;height:32px;padding:0;display:flex;align-items:center;justify-content:center"><svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button>
    </div>
  </div>`;
}
// ── 承認バナー ──
function _buildApprovalBanner(ch,roomKey,role){
  let b='';
  if(ch.type==='match'&&ch.reqId){const req=_dbArr('requests').find(r=>r.id===ch.reqId);if(req?.status==='pending'){const isRec=(role==='coach'&&req.type==='team_to_coach')||(role==='team'&&req.type==='coach_to_team')||(role==='admin');if(isRec){if(role==='admin')b=`<div style="background:var(--surf2);border:1px solid var(--bdr);border-radius:10px;padding:14px;margin-bottom:12px"><div class="fw7 text-sm mb-8">マッチング申請</div><div class="flex gap-8"><button class="btn btn-primary btn-sm" onclick="approveRequest('${req.id}')">承認</button><button class="btn btn-ghost btn-sm" onclick="rejectRequest('${req.id}')">辞退</button></div></div>`;else b=`<div style="background:rgba(249,115,22,.06);border:1.5px solid rgba(249,115,22,.25);border-radius:12px;padding:14px 16px;margin-bottom:12px"><div class="fw7" style="font-size:14px;color:var(--org);margin-bottom:6px"><i class="fas fa-handshake" style="margin-right:6px"></i>マッチング申請が届いています</div><div style="font-size:12px;color:var(--txt2);line-height:1.7;margin-bottom:10px">${role==='coach'?'チームからの申請内容を確認し、承認するとチャットで詳細を相談できます。':'コーチからの応募内容を確認し、承認するとチャットで詳細を相談できます。'}</div><div class="flex gap-8"><button class="btn btn-primary btn-sm" onclick="approveRequest('${req.id}')">✓ マッチングを承認</button><button class="btn btn-ghost btn-sm" onclick="rejectRequest('${req.id}')">&times; 断る</button></div></div>`;}}
  else if(req?.status==='matched'){
    const _hasTrial=req.trialCompleted;
    b=`<div style="background:linear-gradient(135deg,rgba(14,165,233,.06),rgba(0,207,170,.04));border:1.5px solid rgba(14,165,233,.2);border-radius:12px;padding:14px 16px;margin-bottom:12px">
      <div class="fw7" style="font-size:14px;color:#0ea5e9;margin-bottom:6px"><i class="fas fa-comments" style="margin-right:6px"></i>マッチング成立！チャットで相談しましょう</div>
      ${_hasTrial?'<div style="margin-bottom:8px">'+trialStatusBadge(req)+'</div>':''}
      <div style="font-size:12px;color:var(--txt2);line-height:1.7;margin-bottom:8px">${role==='team'
        ?'指導内容・スケジュール・料金についてコーチと相談してください。<br>相談がまとまったら「本契約」に進めます。'
        :'チームと指導内容・条件をご相談ください。チームが納得したら本契約の申請が届きます。'}</div>
      <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--txt3);margin-bottom:8px">
        <span style="padding:2px 8px;border-radius:4px;background:rgba(0,207,170,.12);color:var(--teal);font-weight:700">STEP 2</span>
        チャットで相談中 → 次: 本契約
      </div>
      ${role==='team'?`<div class="flex gap-8 flex-wrap"><button class="btn btn-ghost btn-xs" style="font-size:11px" onclick="openTrialRequestModal('${req.id}')">🧪 トライアルを依頼</button><button class="btn btn-ghost btn-xs" style="font-size:11px" onclick="window._csTab='matched';goTo('coach-search')">コーチ管理 →</button></div>`:''}
    </div>`;
  }
  else if(req?.status==='trial_requested'){
    b=`<div style="background:linear-gradient(135deg,rgba(168,85,247,.06),rgba(236,72,153,.04));border:1.5px solid rgba(168,85,247,.2);border-radius:12px;padding:14px 16px;margin-bottom:12px">
      <div class="fw7" style="font-size:14px;color:#a855f7;margin-bottom:6px"><i class="fas fa-flask" style="margin-right:6px"></i>トライアルレッスン依頼中</div>
      <div style="font-size:12px;color:var(--txt2);line-height:1.7;margin-bottom:8px">📅 ${req.trialDate||''} ${req.trialTime||''}${req.trialNote?'<br>📝 '+req.trialNote:''}</div>
      ${role==='coach'?`<div class="flex gap-8"><button class="btn btn-primary btn-sm" onclick="approveTrialLesson('${req.id}')">✓ 承諾</button><button class="btn btn-ghost btn-sm" onclick="declineTrialLesson('${req.id}')">辞退</button></div>`
        :'<div style="font-size:11px;color:var(--txt3)">コーチの回答をお待ちください</div>'}
    </div>`;
  }
  else if(req?.status==='trial_approved'){
    b=`<div style="background:linear-gradient(135deg,rgba(34,197,94,.06),rgba(0,207,170,.04));border:1.5px solid rgba(34,197,94,.2);border-radius:12px;padding:14px 16px;margin-bottom:12px">
      <div class="fw7" style="font-size:14px;color:var(--grn);margin-bottom:6px"><i class="fas fa-check" style="margin-right:6px"></i>トライアルレッスン承諾済み</div>
      <div style="font-size:12px;color:var(--txt2);line-height:1.7;margin-bottom:8px">📅 ${req.trialDate||''} ${req.trialTime||''}<br>レッスン後に評価して本契約に進めます。</div>
      ${role==='team'?`<div class="flex gap-8"><button class="btn btn-primary btn-sm" onclick="openTrialCompleteModal('${req.id}')">🧪 レッスン完了・評価</button></div>`
        :'<div style="font-size:11px;color:var(--txt3)">レッスン後、チームが評価を行います</div>'}
    </div>`;
  }
  else if(req?.status==='contract_requested'){
    b=`<div style="background:rgba(249,115,22,.06);border:1.5px solid rgba(249,115,22,.2);border-radius:12px;padding:14px 16px;margin-bottom:12px">
      <div class="fw7" style="font-size:14px;color:var(--org);margin-bottom:4px"><i class="fas fa-file-contract" style="margin-right:6px"></i>本契約を申請中</div>
      <div style="font-size:12px;color:var(--txt2);line-height:1.7;margin-bottom:${role==='coach'?'10':'0'}px">${role==='coach'
        ?'チームから本契約の申請が届いています。承諾すると契約コーチとして登録されます。'
        :'コーチの承諾をお待ちください。承諾後、契約コーチとして登録されます。'}</div>
      ${role==='coach'?`<div class="flex gap-8"><button class="btn btn-primary btn-sm" onclick="acceptContract('${req.id}')">✓ 契約を承諾する</button><button class="btn btn-ghost btn-sm" onclick="declineContract('${req.id}')">見送る</button></div>`:''}
    </div>`;
  }
  else if(req?.status==='contracted') b=`<div style="background:rgba(0,207,170,.06);border:1.5px solid rgba(0,207,170,.2);border-radius:12px;padding:14px 16px;margin-bottom:12px"><div class="fw7" style="font-size:14px;color:var(--teal);margin-bottom:4px"><i class="fas fa-check-circle" style="margin-right:6px"></i>本契約成立</div><div style="font-size:12px;color:var(--txt2);line-height:1.7">「お支払い」ページから料金確定・指導管理が行えます。 <button class="btn btn-ghost btn-xs" style="font-size:11px" onclick="goTo('threads')">お支払いへ →</button></div></div>`;
  }
  if(ch.type==='team_match'&&ch.matchId){const tm=(DB.teamMatches||[]).find(x=>x.id===ch.matchId);if(tm?.status==='pending'){const mt=getMyTeam();if(mt&&tm.teamBId===mt.id)b=`<div style="background:var(--surf2);border:1px solid var(--bdr);border-radius:10px;padding:14px;margin-bottom:12px"><div class="fw7 text-sm mb-8">${sanitize(tm.teamAName||'チーム',20)}からマッチング申請</div><div class="flex gap-8"><button class="btn btn-primary btn-sm" onclick="acceptTeamMatch('${tm.id}')">承認</button><button class="btn btn-ghost btn-sm" onclick="rejectTeamMatch('${tm.id}')">辞退</button></div></div>`;}else if(tm?.status==='matched')b=`<div style="background:var(--surf2);border:1px solid var(--bdr);border-radius:10px;padding:12px 14px;margin-bottom:12px"><div class="text-sm fw7">✅ マッチング成立</div></div>`;}
  return b;
}
// ── URL自動リンク ──
function _linkifyText(text){return text.replace(/(https?:\/\/[^\s<>"']+)/g,'<a href="$1" target="_blank" rel="noopener" class="msg-link" onclick="event.stopPropagation()">$1</a>');}
// ── 日付抽出 ──
function _extractDate(t){return t?new Date().toISOString().slice(0,10):'';}
function initChat(){
  const el=document.getElementById('msgs-area');
  if(el)el.scrollTop=el.scrollHeight;
  // アクティブルームのメッセージを既読マーク
  const ch=DB.chats[activeRoom];
  if(ch){
    const myKey=getMyKey();
    ch.msgs.forEach(m=>{ if(m.from!==myKey) m.read=true; });
    ch.unread=0;
    saveDB();
    // バッジ更新
    const badge=document.querySelector('.chat-room.active .unread-badge');
    if(badge)badge.remove();
  }
  updateNotifBadge();
}
function switchRoom(key,myKey){
  activeRoom=key;
  const ch=DB.chats[key];
  if(ch){
    ch.unread=0;
    const myKeyVal=myKey||getMyKey();
    ch.msgs.forEach(m=>{ if(m.from!==myKeyVal) m.read=true; });
    saveDB();
  }
  // Update room list active state
  document.querySelectorAll('.chat-room').forEach(el=>el.classList.remove('active'));
  const roomEl=document.getElementById('room-'+key);
  if(roomEl){
    roomEl.classList.add('active');
    // Clear unread badge visually
    const badge=roomEl.querySelector('.room-unread-badge');
    if(badge)badge.remove();
    const dot=roomEl.querySelector('.room-unread-dot');
    if(dot)dot.remove();
  }
  const cr=document.getElementById('chat-right');
  if(cr){cr.innerHTML=renderRoom(key,myKey||getMyKey());initChat();}
  // Mobile: slide to chat view
  const layout=document.querySelector('.chat-layout');
  if(layout)layout.classList.add('room-open');
  updateNotifBadge();
}

function chatGoBack(){
  const layout=document.querySelector('.chat-layout');
  if(layout)layout.classList.remove('room-open');
}
function sendChat(){
  if(!RateLimit.check('chat', 30, 60000)){ toast('メッセージ送信が速すぎます','e'); return; }
  const inp=document.getElementById('chat-inp');
  if(!inp||!inp.value.trim()){return;}
  const text=inp.value.trim();
  inp.value='';inp.style.height='auto';
  const myKey=getMyKey();
  const now=new Date();
  const time=`${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
  const name=DB.currentUser?.name||'自分';
  if(!DB.chats[activeRoom])DB.chats[activeRoom]={msgs:[]};
  // 編集モード
  if(window._editMsgIdx!=null){
    const ch=DB.chats[activeRoom];
    if(ch&&ch.msgs[window._editMsgIdx]){
      ch.msgs[window._editMsgIdx].text=sanitize(text,2000);
      ch.msgs[window._editMsgIdx].editedAt=now.toISOString();
    }
    cancelEdit();
  } else {
    const replyTo=window._replyToIdx!=null?window._replyToIdx:undefined;
    const msg={mid:_genMsgId(),from:myKey,name:sanitize(name,30),text:sanitize(text,2000),time,read:true,date:now.toISOString().slice(0,10)};
    if(replyTo!=null)msg.replyTo=replyTo;
    if(window._pendingImg){msg.img=window._pendingImg;window._pendingImg=null;}
    if(window._pendingFile){msg.file=window._pendingFile;window._pendingFile=null;}
    if(window._pendingVoice){msg.voice=window._pendingVoice;window._pendingVoice=null;if(!msg.text)msg.text='🎤 音声メッセージ';}
    DB.chats[activeRoom].msgs.push(msg);
    _sendChatToFirestore(activeRoom, msg);
    clearReply();
  }
  // UIリフレッシュ
  const cr=document.getElementById('chat-right');
  if(cr){cr.innerHTML=renderRoom(activeRoom,myKey);initChat();}
  if(activeRoom==='g1' && DB.currentUser?.role==='admin'){
    addNotif('📢 事務局から全体連絡: '+text.slice(0,30)+(text.length>30?'…':''), 'fa-bullhorn', 'chat');
  }
  saveDB();
  updateNotifBadge();
  // メール通知
  const _chatNotifKey='_lastChatNotif_'+activeRoom;
  const _lastNotif=window[_chatNotifKey]||0;
  if(Date.now()-_lastNotif>300000){
    window[_chatNotifKey]=Date.now();
    const ch=DB.chats[activeRoom];
    if(ch){
      const _recip=ch.coachId?DB.coaches.find(c=>c.id===ch.coachId):ch.teamAId?DB.teams.find(t=>t.id!==(getMyTeam()?.id)&&(t.id===ch.teamAId||t.id===ch.teamBId)):null;
      if(_recip?.email){notifyByEmail('chat_message',{email:_recip.email,name:_recip.name},{fromName:name,text});}
    }
  }
}
window._replyToIdx=null;
window._pendingImg=null;
window._pendingFile=null;
window._editMsgIdx=null;
function setReply(roomKey,msgIdx){
  const ch=DB.chats[roomKey];if(!ch||!ch.msgs[msgIdx])return;
  window._replyToIdx=msgIdx;
  const prev=document.getElementById('reply-preview');
  const prevText=document.getElementById('reply-preview-text');
  if(prev&&prevText){
    prev.style.display='block';
    prevText.textContent='↩️ 返信: '+sanitize(ch.msgs[msgIdx].text||'',40);
  }
  document.getElementById('chat-inp')?.focus();
}
function clearReply(){
  window._replyToIdx=null;
  const prev=document.getElementById('reply-preview');
  if(prev)prev.style.display='none';
}
function attachImage(input){
  const file=input.files[0];if(!file)return;
  if(!file.type.startsWith('image/')){toast('画像ファイルのみアップロード可能です','e');return;}
  if(file.size>2*1024*1024){toast('画像は2MB以下にしてください','e');return;}
  const reader=new FileReader();
  reader.onload=e=>{
    window._pendingImg=e.target.result;
    toast('画像を添付しました。メッセージを送信してください','s');
  };
  reader.readAsDataURL(file);
}
function addReaction(roomKey,msgIdx,emoji){
  const ch=DB.chats[roomKey];if(!ch||!ch.msgs[msgIdx])return;
  const msg=ch.msgs[msgIdx];
  if(!msg.reactions)msg.reactions={};
  if(!msg.reactions[emoji])msg.reactions[emoji]=[];
  const myKey=getMyKey();
  const pos=msg.reactions[emoji].indexOf(myKey);
  if(pos>=0)msg.reactions[emoji].splice(pos,1); // トグル（取り消し）
  else msg.reactions[emoji].push(myKey);
  if(msg.reactions[emoji].length===0)delete msg.reactions[emoji];
  saveDB();
  const cr=document.getElementById('chat-right');
  if(cr){cr.innerHTML=renderRoom(roomKey,myKey);initChat();}
}
function quickReact(roomKey,msgIdx){
  const emojis=['👍','❤️','😂','😮','👏','🔥'];
  openM('リアクション',`<div class="flex gap-10 justify-center flex-wrap" style="padding:10px">${emojis.map(e=>`<button onclick="addReaction('${roomKey}',${msgIdx},'${e}');closeM()" style="font-size:28px;background:none;border:none;cursor:pointer;padding:8px;border-radius:8px" onmouseover="this.style.background='var(--surf2)'" onmouseout="this.style.background='none'">${e}</button>`).join('')}</div>`);
}
function deleteMsg(roomKey,msgIdx){
  const ch=DB.chats[roomKey];if(!ch||!ch.msgs[msgIdx])return;
  ch.msgs[msgIdx].text='（このメッセージは削除されました）';
  ch.msgs[msgIdx].deleted=true;
  delete ch.msgs[msgIdx].img;
  saveDB();
  const cr=document.getElementById('chat-right');
  const myKey=getMyKey();
  if(cr){cr.innerHTML=renderRoom(roomKey,myKey);initChat();}
}

// ── 管理者メッセージ管理 ──
function adminDeleteMsg(roomKey,msgIdx){
  if(DB.currentUser?.role!=='admin'){toast('権限がありません','e');return;}
  const ch=DB.chats[roomKey];if(!ch||!ch.msgs[msgIdx])return;
  const msg=ch.msgs[msgIdx];
  openM('🗑️ メッセージ削除',`
    <div style="padding:12px;background:var(--surf2);border-radius:10px;margin-bottom:16px">
      <div style="font-size:11px;color:var(--txt3);margin-bottom:4px">送信者: <b>${sanitize(msg.name||'不明',20)}</b> (${msg.time||''})</div>
      <div style="font-size:13px;color:var(--txt1);line-height:1.6">${sanitize(msg.text||'',200)}</div>
    </div>
    <div class="form-group"><label class="label">削除理由（記録用）</label>
      <select class="input" id="admin-del-reason">
        <option value="inappropriate">不適切な内容</option>
        <option value="spam">スパム・宣伝</option>
        <option value="harassment">ハラスメント</option>
        <option value="privacy">個人情報の漏洩</option>
        <option value="other">その他</option>
      </select>
    </div>
    <div style="display:flex;gap:8px;margin-top:12px">
      <button class="btn btn-primary w-full" style="background:var(--red);border-color:var(--red)" onclick="confirmAdminDeleteMsg('${roomKey}',${msgIdx})">🗑️ メッセージを削除する</button>
      <button class="btn btn-ghost" onclick="closeM()">キャンセル</button>
    </div>
  `);
}
function confirmAdminDeleteMsg(roomKey,msgIdx){
  const ch=DB.chats[roomKey];if(!ch||!ch.msgs[msgIdx])return;
  const reason=document.getElementById('admin-del-reason')?.value||'inappropriate';
  const reasonLabels={inappropriate:'不適切な内容',spam:'スパム',harassment:'ハラスメント',privacy:'個人情報漏洩',other:'その他'};
  const msg=ch.msgs[msgIdx];
  // 削除ログ保存
  if(!DB.moderationLog)DB.moderationLog=[];
  _dbArr('moderationLog').push({
    type:'delete',roomKey,msgIdx,
    userName:msg.name||'',userId:msg.from||'',
    originalText:msg.text||'',reason,
    deletedBy:DB.currentUser?.name||'事務局',
    date:new Date().toISOString()
  });
  // メッセージ置換
  ch.msgs[msgIdx].text='（このメッセージは事務局により削除されました — 理由: '+reasonLabels[reason]+'）';
  ch.msgs[msgIdx].deleted=true;
  ch.msgs[msgIdx].adminDeleted=true;
  delete ch.msgs[msgIdx].img;
  saveDB();
  closeM();
  toast('メッセージを削除しました','s');
  const cr=document.getElementById('chat-right');
  if(cr){cr.innerHTML=renderRoom(roomKey,getMyKey());initChat();}
}

function adminWarnUser(roomKey,msgIdx){
  if(DB.currentUser?.role!=='admin'){toast('権限がありません','e');return;}
  const ch=DB.chats[roomKey];if(!ch||!ch.msgs[msgIdx])return;
  const msg=ch.msgs[msgIdx];
  openM('⚠️ ユーザーへの忠告',`
    <div style="padding:12px;background:var(--surf2);border-radius:10px;margin-bottom:16px">
      <div style="font-size:11px;color:var(--txt3);margin-bottom:4px">対象ユーザー: <b>${sanitize(msg.name||'不明',20)}</b></div>
      <div style="font-size:12px;color:var(--txt2);line-height:1.5">問題のメッセージ: 「${sanitize(msg.text||'',100)}」</div>
    </div>
    <div class="form-group"><label class="label">忠告の種類</label>
      <select class="input" id="admin-warn-type">
        <option value="language">不適切な言葉遣い</option>
        <option value="harassment">ハラスメント行為</option>
        <option value="spam">スパム・宣伝行為</option>
        <option value="privacy">個人情報の取り扱い</option>
        <option value="rules">利用規約違反</option>
        <option value="other">その他</option>
      </select>
    </div>
    <div class="form-group"><label class="label">忠告メッセージ</label>
      <textarea class="input" id="admin-warn-msg" rows="3" placeholder="忠告内容を入力...">部勝（ブカツ）利用規約第11条（禁止事項）に基づき、適切なコミュニケーションをお願いいたします。繰り返しの違反はアカウント停止の対象となります（第13条）。</textarea>
    </div>
    <div style="display:flex;gap:8px;margin-top:12px">
      <button class="btn btn-primary w-full" style="background:#f59e0b;border-color:#f59e0b" onclick="confirmAdminWarn('${roomKey}',${msgIdx})">⚠️ 忠告を送信する</button>
      <button class="btn btn-ghost" onclick="closeM()">キャンセル</button>
    </div>
  `);
}
function confirmAdminWarn(roomKey,msgIdx){
  const ch=DB.chats[roomKey];if(!ch||!ch.msgs[msgIdx])return;
  const msg=ch.msgs[msgIdx];
  const warnType=document.getElementById('admin-warn-type')?.value||'other';
  const warnMsg=document.getElementById('admin-warn-msg')?.value?.trim()||'部勝（ブカツ）利用規約に沿ったご利用をお願いします。詳細は利用規約第11条をご確認ください。';
  const typeLabels={language:'不適切な言葉遣い',harassment:'ハラスメント',spam:'スパム',privacy:'個人情報',rules:'利用規約違反',other:'その他'};
  // ログ保存
  if(!DB.moderationLog)DB.moderationLog=[];
  _dbArr('moderationLog').push({type:'warn',roomKey,msgIdx,userName:msg.name||'',userId:msg.from||'',warnType,warnMsg,date:new Date().toISOString()});
  // ユーザーの警告カウント
  if(!DB.userWarnings)DB.userWarnings={};
  if(!DB.userWarnings[msg.from])DB.userWarnings[msg.from]={count:0,warnings:[]};
  DB.userWarnings[msg.from].count++;
  DB.userWarnings[msg.from].warnings.push({type:warnType,msg:warnMsg,date:new Date().toISOString()});
  // チャットに忠告メッセージ
  ch.msgs.push({mid:_genMsgId(),from:'system',name:'事務局',text:'⚠️ 事務局からの忠告 (' + typeLabels[warnType] + '): ' + warnMsg,time:new Date().toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'}),read:false,isWarning:true,date:new Date().toISOString().slice(0,10)});
  // 通知
  addNotif('⚠️ 事務局から忠告を受けました','fa-exclamation-triangle','chat');
  saveDB();
  closeM();
  toast('忠告を送信しました（累計' + DB.userWarnings[msg.from].count + '回目）','s');
  const cr=document.getElementById('chat-right');
  if(cr){cr.innerHTML=renderRoom(roomKey,getMyKey());initChat();}
}

function adminSuspendUser(roomKey,msgIdx){
  if(DB.currentUser?.role!=='admin'){toast('権限がありません','e');return;}
  const ch=DB.chats[roomKey];if(!ch||!ch.msgs[msgIdx])return;
  const msg=ch.msgs[msgIdx];
  const warnCount=(DB.userWarnings||{})[msg.from]?.count||0;
  openM('🚫 アカウント停止',`
    <div style="padding:12px;background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.15);border-radius:10px;margin-bottom:16px">
      <div style="font-size:14px;font-weight:700;color:var(--red);margin-bottom:4px">⚠️ この操作は重大です</div>
      <div style="font-size:12px;color:var(--txt2)">対象ユーザーのアカウントを停止します。停止中はログイン・メッセージ送信ができなくなります。</div>
    </div>
    <div style="padding:12px;background:var(--surf2);border-radius:10px;margin-bottom:16px">
      <div style="font-size:13px;font-weight:700">${sanitize(msg.name||'不明',20)}</div>
      <div style="font-size:11px;color:var(--txt3);margin-top:4px">累計忠告: <b style="color:${warnCount>=2?'var(--red)':'var(--txt2)}'}">${warnCount}回</b></div>
      ${warnCount>0?`<div style="font-size:10px;color:var(--txt3);margin-top:4px">${((DB.userWarnings||{})[msg.from]?.warnings||[]).map(w=>'• '+w.type+' ('+w.date.slice(0,10)+')').join('<br>')}</div>`:''}
    </div>
    <div class="form-group"><label class="label">停止理由</label>
      <select class="input" id="admin-suspend-reason">
        <option value="repeated_violation">繰り返しの利用規約違反</option>
        <option value="harassment">深刻なハラスメント</option>
        <option value="fraud">不正行為・詐欺</option>
        <option value="spam">継続的なスパム行為</option>
        <option value="other">その他</option>
      </select>
    </div>
    <div class="form-group"><label class="label">停止期間</label>
      <select class="input" id="admin-suspend-duration">
        <option value="7">7日間</option>
        <option value="30">30日間</option>
        <option value="90">90日間</option>
        <option value="0">永久停止</option>
      </select>
    </div>
    <div style="display:flex;gap:8px;margin-top:12px">
      <button class="btn btn-primary w-full" style="background:var(--red);border-color:var(--red)" onclick="confirmAdminSuspend('${roomKey}',${msgIdx})">🚫 アカウントを停止する</button>
      <button class="btn btn-ghost" onclick="closeM()">キャンセル</button>
    </div>
  `);
}
function confirmAdminSuspend(roomKey,msgIdx){
  const ch=DB.chats[roomKey];if(!ch||!ch.msgs[msgIdx])return;
  const msg=ch.msgs[msgIdx];
  const reason=document.getElementById('admin-suspend-reason')?.value||'other';
  const duration=parseInt(document.getElementById('admin-suspend-duration')?.value)||30;
  const reasonLabels={repeated_violation:'繰り返しの違反',harassment:'ハラスメント',fraud:'不正行為',spam:'スパム',other:'その他'};
  // ログ保存
  if(!DB.moderationLog)DB.moderationLog=[];
  _dbArr('moderationLog').push({type:'suspend',roomKey,userName:msg.name||'',userId:msg.from||'',reason,duration,date:new Date().toISOString()});
  // アカウント停止フラグ
  if(!DB.suspendedUsers)DB.suspendedUsers={};
  var suspendUntil=duration>0?new Date(Date.now()+duration*86400000).toISOString():'permanent';
  DB.suspendedUsers[msg.from]={suspended:true,reason,duration,until:suspendUntil,date:new Date().toISOString()};
  // チャットに通知
  ch.msgs.push({mid:_genMsgId(),from:'system',name:'事務局',text:'🚫 ' + (msg.name||'ユーザー') + ' のアカウントが停止されました（理由: '+reasonLabels[reason]+'、期間: '+(duration>0?duration+'日間':'永久')+'）',time:new Date().toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'}),read:false,isSuspension:true,date:new Date().toISOString().slice(0,10)});
  saveDB();
  closeM();
  toast(msg.name + 'のアカウントを停止しました','s');
  const cr=document.getElementById('chat-right');
  if(cr){cr.innerHTML=renderRoom(roomKey,getMyKey());initChat();}
}

// 管理者チャット情報パネル
function openAdminChatInfo(roomKey){
  const ch=DB.chats[roomKey];if(!ch)return;
  const msgs=ch.msgs||[];
  // 参加者分析
  var participants={};
  msgs.forEach(function(m){
    if(m.from==='system')return;
    if(!participants[m.from])participants[m.from]={name:m.name||'?',count:0,lastTime:''};
    participants[m.from].count++;
    if(m.time)participants[m.from].lastTime=m.time;
  });
  var warnCount=((DB.moderationLog||[]).filter(function(l){return l.roomKey===roomKey&&l.type==='warn';})).length;
  var delCount=((DB.moderationLog||[]).filter(function(l){return l.roomKey===roomKey&&l.type==='delete';})).length;

  var h='<div style="display:grid;gap:12px">';
  // サマリー
  h+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">';
  h+='<div style="text-align:center;padding:10px;background:var(--surf2);border-radius:8px"><div style="font-size:18px;font-weight:800">'+msgs.length+'</div><div style="font-size:9px;color:var(--txt3)">メッセージ</div></div>';
  h+='<div style="text-align:center;padding:10px;background:var(--surf2);border-radius:8px"><div style="font-size:18px;font-weight:800">'+Object.keys(participants).length+'</div><div style="font-size:9px;color:var(--txt3)">参加者</div></div>';
  h+='<div style="text-align:center;padding:10px;background:var(--surf2);border-radius:8px"><div style="font-size:18px;font-weight:800;color:'+(warnCount?'var(--red)':'var(--grn)')+'">'+warnCount+'</div><div style="font-size:9px;color:var(--txt3)">警告履歴</div></div>';
  h+='</div>';

  // 参加者
  h+='<div><div style="font-size:12px;font-weight:700;margin-bottom:6px">👥 参加者</div>';
  Object.entries(participants).forEach(function(e){
    var uid=e[0],p=e[1];
    var isSuspended=(DB.suspendedUsers||{})[uid]?.suspended;
    var warns=((DB.userWarnings||{})[uid]?.count)||0;
    h+='<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--b1)">';
    h+='<div class="avi" style="width:28px;height:28px;font-size:10px;background:var(--org)">'+(p.name||'?')[0]+'</div>';
    h+='<div style="flex:1"><div style="font-size:12px;font-weight:600">'+p.name+'</div>';
    h+='<div style="font-size:9px;color:var(--txt3)">'+p.count+'件のメッセージ</div></div>';
    if(isSuspended)h+='<span class="badge b-red" style="font-size:9px">停止中</span>';
    if(warns>0)h+='<span class="badge b-yel" style="font-size:9px">忠告'+warns+'回</span>';
    h+='</div>';
  });
  h+='</div>';

  // モデレーション履歴
  var modLogs=(DB.moderationLog||[]).filter(function(l){return l.roomKey===roomKey;});
  if(modLogs.length){
    h+='<div><div style="font-size:12px;font-weight:700;margin-bottom:6px">📜 モデレーション履歴</div>';
    modLogs.slice(-8).reverse().forEach(function(l){
      var icon=l.type==='delete'?'🗑️':l.type==='warn'?'⚠️':'🚫';
      var label=l.type==='delete'?'削除':l.type==='warn'?'忠告':'停止';
      h+='<div style="display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid var(--b1)">';
      h+='<span>'+icon+'</span>';
      h+='<div style="flex:1;font-size:11px"><b>'+label+'</b> — '+(l.userName||'?');
      if(l.originalText)h+=' 「'+l.originalText.slice(0,30)+'…」';
      h+='</div>';
      h+='<span style="font-size:9px;color:var(--txt3)">'+(l.date||'').slice(0,10)+'</span>';
      h+='</div>';
    });
    h+='</div>';
  }

  // 全チャット削除
  h+='<div style="border-top:1px solid var(--b1);padding-top:12px">';
  h+='<button class="btn btn-ghost w-full" style="color:var(--red);border-color:rgba(239,68,68,.2)" onclick="if(confirm(\'この会話の全メッセージを削除しますか？\')){adminClearChat(\''+roomKey+'\');closeM();}">🗑️ この会話のメッセージを全削除</button>';
  h+='</div>';

  h+='</div>';
  openM('⚙️ チャット管理: '+ch.name, h, true);
}

function adminClearChat(roomKey){
  if(DB.currentUser?.role!=='admin')return;
  var ch=DB.chats[roomKey];if(!ch)return;
  ch.msgs=[{from:'system',name:'事務局',text:'事務局によりこの会話のメッセージが全削除されました。',time:new Date().toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'}),read:false}];
  if(!DB.moderationLog)DB.moderationLog=[];
  _dbArr('moderationLog').push({type:'clear_chat',roomKey,date:new Date().toISOString()});
  saveDB();
  toast('チャットを削除しました','s');
  var cr=document.getElementById('chat-right');
  if(cr){cr.innerHTML=renderRoom(roomKey,getMyKey());initChat();}
}
function scrollToMsg(idx){
  const el=document.getElementById(`msg-${idx}`);
  if(el){el.scrollIntoView({behavior:'smooth',block:'center'});el.style.background='rgba(255,107,43,.1)';setTimeout(()=>el.style.background='',1500);}
}
function showMsgActions(el,roomKey,idx,isMine){
  const ma=document.getElementById(`ma-${idx}`);
  if(ma)ma.style.display='flex';
}
function hideMsgActions(el){
  el.querySelectorAll('.msg-actions').forEach(ma=>ma.style.display='none');
}
let _longPressTimer=null;
function msgTouchStart(el,roomKey,idx,isMine){
  _longPressTimer=setTimeout(()=>{showMsgActions(el,roomKey,idx,isMine);},400);
}
function msgTouchEnd(){if(_longPressTimer){clearTimeout(_longPressTimer);_longPressTimer=null;}}

// ── メッセージ編集 ──
function editMsg(roomKey,msgIdx){
  const ch=DB.chats[roomKey];if(!ch||!ch.msgs[msgIdx])return;
  const msg=ch.msgs[msgIdx];
  const myKey=getMyKey();
  if(msg.from!==myKey && msg.from!==DB.currentUser?.id){toast('自分のメッセージのみ編集できます','e');return;}
  window._editMsgIdx=msgIdx;
  const inp=document.getElementById('chat-inp');
  if(inp){inp.value=msg.text||'';inp.focus();inp.style.height='auto';inp.style.height=Math.min(inp.scrollHeight,100)+'px';}
  const ep=document.getElementById('edit-preview');
  if(ep)ep.style.display='block';
  clearReply();
}
function cancelEdit(){
  window._editMsgIdx=null;
  const ep=document.getElementById('edit-preview');
  if(ep)ep.style.display='none';
}

// ── メッセージ転送 ──
function forwardMsg(roomKey,msgIdx){
  const ch=DB.chats[roomKey];if(!ch||!ch.msgs[msgIdx])return;
  const msg=ch.msgs[msgIdx];
  const rooms=Object.entries(DB.chats).filter(([k])=>k!==roomKey);
  const myId=DB.currentUser?.id;
  if(rooms.length===0){toast('転送先がありません','w');return;}
  let html=`<div style="font-size:12px;color:var(--txt3);margin-bottom:10px;padding:8px 12px;background:var(--surf2);border-radius:8px;border-left:3px solid var(--org)">
    <div class="fw7" style="color:var(--txt1);margin-bottom:2px">転送するメッセージ:</div>${sanitize(msg.text||'',80)}</div>
    <div style="max-height:260px;overflow-y:auto">`;
  rooms.forEach(([k,r])=>{
    let name=r.name||k;
    if(k.startsWith('dm_')){const otherId=r.senderId===myId?r.userId:r.senderId;const ou=_getUsers().find(u=>u.id===otherId);if(ou)name=ou.name||name;}
    html+=`<div class="fwd-room" onclick="doForwardMsg('${roomKey}',${msgIdx},'${k}')">
      <div class="avi" style="width:32px;height:32px;font-size:13px;background:var(--surf3);flex-shrink:0">${(r.avi||name[0]||'?')}</div>
      <div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${sanitize(name,25)}</div></div>
    </div>`;
  });
  html+='</div>';
  openM('↗️ メッセージを転送',html);
}
function doForwardMsg(srcRoom,srcIdx,targetRoom){
  const ch=DB.chats[srcRoom];if(!ch||!ch.msgs[srcIdx])return;
  const orig=ch.msgs[srcIdx];
  const myKey=getMyKey();
  const now=new Date();
  const fwd={from:myKey,name:DB.currentUser?.name||'自分',text:`↗️ 転送: ${orig.text||''}`,time:`${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`,read:true,date:now.toISOString().slice(0,10),forwarded:true};
  if(orig.img)fwd.img=orig.img;
  if(orig.file)fwd.file=orig.file;
  if(!DB.chats[targetRoom])DB.chats[targetRoom]={msgs:[]};
  DB.chats[targetRoom].msgs.push(fwd);
  _sendChatToFirestore(targetRoom,fwd);
  saveDB();closeM();
  toast('メッセージを転送しました','s');
  activeRoom=targetRoom;
  goTo('chat');
}

// ── ピン留め ──
function pinMsg(roomKey,msgIdx){
  const ch=DB.chats[roomKey];if(!ch)return;
  if(ch.pinnedMsg===msgIdx){ch.pinnedMsg=null;toast('ピン留めを解除しました','s');}
  else{ch.pinnedMsg=msgIdx;toast('メッセージをピン留めしました','s');}
  saveDB();
  const cr=document.getElementById('chat-right');
  if(cr){cr.innerHTML=renderRoom(roomKey,getMyKey());initChat();}
}

// ── チャット内メッセージ検索 ──
function openChatSearch(roomKey){
  const ch=DB.chats[roomKey];if(!ch)return;
  openM('🔍 メッセージ検索',`
    <input class="input mb-12" id="msg-search-inp" placeholder="検索ワードを入力..." oninput="_searchMsgs('${roomKey}',this.value)" autofocus style="font-size:13px">
    <div id="msg-search-results" style="max-height:320px;overflow-y:auto"></div>
  `);
  setTimeout(()=>document.getElementById('msg-search-inp')?.focus(),100);
}
function _searchMsgs(roomKey,q){
  const ch=DB.chats[roomKey];if(!ch)return;
  const el=document.getElementById('msg-search-results');if(!el)return;
  if(!q||q.length<2){el.innerHTML='<div style="text-align:center;padding:20px;color:var(--txt3);font-size:12px">2文字以上入力してください</div>';return;}
  const ql=q.toLowerCase();
  const hits=[];
  ch.msgs.forEach((m,i)=>{if(!m.deleted&&m.text&&m.text.toLowerCase().includes(ql))hits.push({m,i});});
  if(hits.length===0){el.innerHTML='<div style="text-align:center;padding:20px;color:var(--txt3);font-size:12px">見つかりませんでした</div>';return;}
  el.innerHTML=hits.slice(0,20).map(({m,i})=>{
    const hl=sanitize(m.text,80).replace(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`,'gi'),'<mark style="background:rgba(249,115,22,.3);padding:0 2px;border-radius:2px">$1</mark>');
    return`<div class="chat-search-result" onclick="closeM();scrollToMsg(${i})">
      <div style="font-size:11px;color:var(--txt3);margin-bottom:2px">${sanitize(m.name||'',16)} · ${m.time||''} · ${m.date||''}</div>
      <div style="font-size:13px;line-height:1.5">${hl}</div>
    </div>`;
  }).join('')+`<div style="text-align:center;padding:8px;font-size:11px;color:var(--txt3)">${hits.length}件ヒット</div>`;
}

// ── 画像プレビュー ──
function openImagePreview(src){
  openM('🖼️ 画像プレビュー',`<div style="text-align:center"><img src="${src}" style="max-width:100%;max-height:70vh;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,.2)"><div style="margin-top:12px"><a href="${src}" download="image.png" class="btn btn-ghost btn-sm" style="display:inline-flex;align-items:center;gap:6px">⬇️ ダウンロード</a></div></div>`);
}

// ── 絵文字カテゴリ ──
function _renderEmojiGrid(){
  const grid=document.getElementById('emoji-grid');if(!grid)return;
  grid.innerHTML=(EMOJI_CATS[_emojiCat]||[]).map(e=>`<button class="emoji-btn-item" onclick="insertEmoji('${e}')">${e}</button>`).join('');
  document.querySelectorAll('.emoji-cat-tab').forEach(t=>{
    t.classList.toggle('active',t.textContent===_emojiCat.split(' ')[0]);
  });
}
function toggleEmoji(){
  const el=document.getElementById('emoji-picker-wrap');
  if(!el)return;
  const show=el.style.display==='none'||!el.style.display;
  el.style.display=show?'block':'none';
  hideAttachMenu();
}
function insertEmoji(e){
  const inp=document.getElementById('chat-inp');
  if(inp){inp.value+=e;inp.focus();}
  const ep=document.getElementById('emoji-picker-wrap');
  if(ep)ep.style.display='none';
}

// ── 添付メニュー ──
function toggleAttachMenu(){
  const el=document.getElementById('attach-menu');
  if(!el)return;
  const show=el.style.display==='none'||!el.style.display||el.style.display==='';
  el.style.display=show?'flex':'none';
  const ep=document.getElementById('emoji-picker-wrap');
  if(ep)ep.style.display='none';
}
function hideAttachMenu(){
  const el=document.getElementById('attach-menu');
  if(el)el.style.display='none';
}

// ── ファイル添付 ──
function attachFile(input){
  const file=input.files[0];if(!file)return;
  if(file.size>5*1024*1024){toast('ファイルは5MB以下にしてください','e');return;}
  const ext=file.name.split('.').pop().toLowerCase();
  const sizeStr=file.size<1024?file.size+'B':file.size<1048576?Math.round(file.size/1024)+'KB':Math.round(file.size/1048576*10)/10+'MB';
  const reader=new FileReader();
  reader.onload=e=>{
    window._pendingFile={name:file.name,ext,size:sizeStr,url:e.target.result};
    toast(`📄 ${file.name}を添付しました`,'s');
  };
  reader.readAsDataURL(file);
  input.value='';
}

// ── タイピングインジケーター ──
var _typingTimer=null;
function _emitTyping(){
  if(!window._typingUsers)window._typingUsers={};
  // ローカルデモ用（将来Firestore連携可能）
  clearTimeout(_typingTimer);
  _typingTimer=setTimeout(()=>{},3000);
}

// ── 音声メッセージ録音 ──
var _mediaRecorder=null,_audioChunks=[];
function startVoiceRecord(){
  if(_mediaRecorder&&_mediaRecorder.state==='recording'){stopVoiceRecord();return;}
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){toast('このブラウザは音声録音に対応していません','e');return;}
  navigator.mediaDevices.getUserMedia({audio:true}).then(stream=>{
    _audioChunks=[];
    _mediaRecorder=new MediaRecorder(stream,{mimeType:MediaRecorder.isTypeSupported('audio/webm')?'audio/webm':'audio/mp4'});
    _mediaRecorder.ondataavailable=e=>{if(e.data.size>0)_audioChunks.push(e.data);};
    _mediaRecorder.onstop=()=>{
      stream.getTracks().forEach(t=>t.stop());
      const blob=new Blob(_audioChunks,{type:_mediaRecorder.mimeType});
      if(blob.size<100){toast('録音が短すぎます','w');return;}
      if(blob.size>3*1024*1024){toast('音声は3MB以下にしてください','e');return;}
      const reader=new FileReader();
      reader.onload=()=>{
        window._pendingVoice={url:reader.result,size:Math.round(blob.size/1024)+'KB',type:_mediaRecorder.mimeType};
        toast('🎤 音声メッセージを録音しました。送信で添付されます','s');
      };
      reader.readAsDataURL(blob);
      const ind=document.getElementById('voice-indicator');if(ind)ind.remove();
    };
    _mediaRecorder.start(500);
    toast('🎤 録音中... (最大30秒)','i');
    const ia=document.querySelector('.chat-input-area');
    if(ia&&!document.getElementById('voice-indicator')){
      const d=document.createElement('div');d.id='voice-indicator';
      d.innerHTML='<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);border-radius:10px;margin-bottom:6px"><span style="display:inline-block;width:8px;height:8px;background:#ef4444;border-radius:50%;animation:blink 1s infinite"></span><span style="font-size:12px;color:#ef4444;font-weight:600">録音中...</span><button onclick="stopVoiceRecord()" style="margin-left:auto;background:#ef4444;color:#fff;border:none;border-radius:6px;padding:4px 10px;font-size:11px;cursor:pointer">⏹ 停止</button></div>';
      ia.insertBefore(d,ia.firstChild);
    }
    setTimeout(()=>{if(_mediaRecorder&&_mediaRecorder.state==='recording')_mediaRecorder.stop();},30000);
  }).catch(e=>{toast('マイクへのアクセスが許可されていません','e');});
}
function stopVoiceRecord(){if(_mediaRecorder&&_mediaRecorder.state==='recording')_mediaRecorder.stop();const i=document.getElementById('voice-indicator');if(i)i.remove();}

// ── ビデオ通話（Google Meet） ──
// ── チャット→支払いスレッド遷移 ──
function openLinkedThread(roomKey){
  const ch=DB.chats[roomKey];
  if(!ch) return;
  const pt=_dbArr('payThreads').find(p=>p.chatKey===roomKey||(p.coachId===ch.coachId&&p.teamId===ch.teamId));
  if(pt){
    // chatKeyを永続化
    if(!pt.chatKey) pt.chatKey=roomKey;
    goTo('threads');
    setTimeout(()=>openThreadDetail(pt.id),100);
  } else {
    toast('関連するお支払いスレッドが見つかりません','i');
  }
}

function startVideoCall(roomKey){
  const ch=DB.chats[roomKey];if(!ch){toast('チャットが見つかりません','e');return;}
  DB.chats[roomKey].msgs.push({mid:_genMsgId(),from:DB.currentUser?.id,name:DB.currentUser?.name||'',text:'📹 ビデオ通話を開始しました\n参加: https://meet.google.com/new',time:now_time(),date:new Date().toISOString().slice(0,10),read:true,isVideoCall:true});
  saveDB();window.open('https://meet.google.com/new','_blank');
  const cr=document.getElementById('chat-right');if(cr&&typeof renderRoom==='function'){cr.innerHTML=renderRoom(roomKey,getMyKey());_scrollChatBottom();}
}

// ── Googleカレンダー連携(.icsエクスポート) ──
// ── メンタルチェック記録 ──
function openMentalCheckModal(playerId){
  const pid=playerId||DB.currentUser?.id;const today=new Date().toISOString().slice(0,10);
  const ex=DB.conditionLog?.[pid]?.[today];
  openM('🧠 メンタルチェック',`
    <div style="text-align:center;margin-bottom:16px"><div class="text-xs text-muted">${today}</div><div class="fw7">今の気持ちを教えてください</div></div>
    <div class="form-group"><label class="label">気分</label>
      <div style="display:flex;justify-content:center;gap:12px;margin:8px 0">
        ${[{v:1,e:'😫',l:'最悪'},{v:2,e:'😟',l:'悪い'},{v:3,e:'😐',l:'普通'},{v:4,e:'😊',l:'良い'},{v:5,e:'🤩',l:'最高'}].map(x=>`<label style="text-align:center;cursor:pointer" onclick="document.getElementById('mc-mood').value=${x.v};document.querySelectorAll('.mc-mood-btn').forEach(b=>b.style.opacity='.4');this.querySelector('.mc-mood-btn').style.opacity='1'"><div class="mc-mood-btn" style="font-size:32px;transition:opacity .2s;opacity:${ex?.mentalMood===x.v?'1':'.4'}">${x.e}</div><div style="font-size:10px;color:var(--txt3)">${x.l}</div></label>`).join('')}
      </div><input type="hidden" id="mc-mood" value="${ex?.mentalMood||3}">
    </div>
    <div class="form-group"><label class="label">ストレス (1〜10)</label><input type="range" id="mc-stress" min="1" max="10" value="${ex?.stressLevel||5}" style="width:100%" oninput="document.getElementById('mc-sv').textContent=this.value"><div style="display:flex;justify-content:space-between;font-size:11px;color:var(--txt3)"><span>低い</span><span id="mc-sv">${ex?.stressLevel||5}</span><span>高い</span></div></div>
    <div class="form-group"><label class="label">自信度 (1〜10)</label><input type="range" id="mc-conf" min="1" max="10" value="${ex?.confidence||5}" style="width:100%" oninput="document.getElementById('mc-cv').textContent=this.value"><div style="display:flex;justify-content:space-between;font-size:11px;color:var(--txt3)"><span>低い</span><span id="mc-cv">${ex?.confidence||5}</span><span>高い</span></div></div>
    <div class="form-group"><label class="label">モチベーション (1〜10)</label><input type="range" id="mc-moti" min="1" max="10" value="${ex?.motivation||5}" style="width:100%" oninput="document.getElementById('mc-mv').textContent=this.value"><div style="display:flex;justify-content:space-between;font-size:11px;color:var(--txt3)"><span>低い</span><span id="mc-mv">${ex?.motivation||5}</span><span>高い</span></div></div>
    <div class="form-group"><label class="label">今日のひとこと（任意）</label><textarea id="mc-note" class="input" rows="2" placeholder="気になること、嬉しかったこと..." maxlength="200">${ex?.mentalNote||''}</textarea></div>
    <button class="btn btn-primary w-full mt-8" onclick="saveMentalCheck('${pid}','${today}')">💾 記録する</button>`);
}
function saveMentalCheck(pid,dateStr){
  const mentalMood=parseInt(document.getElementById('mc-mood')?.value)||3;
  const stressLevel=parseInt(document.getElementById('mc-stress')?.value)||5;
  const confidence=parseInt(document.getElementById('mc-conf')?.value)||5;
  const motivation=parseInt(document.getElementById('mc-moti')?.value)||5;
  const mentalNote=sanitize(document.getElementById('mc-note')?.value||'',200);
  if(!DB.conditionLog)DB.conditionLog={};if(!DB.conditionLog[pid])DB.conditionLog[pid]={};if(!DB.conditionLog[pid][dateStr])DB.conditionLog[pid][dateStr]={};
  Object.assign(DB.conditionLog[pid][dateStr],{mentalMood,stressLevel,confidence,motivation,mentalNote,mentalUpdatedAt:new Date().toISOString()});
  saveDB();closeM();toast('🧠 メンタルチェックを記録しました','s');goTo('dashboard');
}

// ── グループチャット作成 ──
function openGroupChatModal(){
  const myId=DB.currentUser?.id;
  const allUsers=_getUsers().filter(u=>u.id!==myId);
  if(allUsers.length<2){toast('グループチャットには2人以上必要です','w');return;}
  window._groupChatMembers=new Set();
  const roleLabels={admin:'事務局',team:'チーム',coach:'コーチ',player:'選手',parent:'保護者'};
  const html=`
    <div class="form-group"><label class="label">グループ名</label><input id="gc-name" class="input" placeholder="グループ名を入力" maxlength="30"></div>
    <div class="text-xs fw7 mb-6" style="color:var(--txt2)">メンバーを選択（2人以上）</div>
    <input class="input mb-8" placeholder="🔍 名前で検索..." oninput="_filterGroupMembers(this.value)" style="font-size:12px">
    <div id="gc-members-list" style="max-height:220px;overflow-y:auto">
      ${allUsers.map(u=>`<div class="fwd-room" id="gc-u-${u.id}" onclick="_toggleGroupMember('${u.id}',this)">
        <div class="avi" style="width:28px;height:28px;font-size:11px;background:var(--surf3)">${(u.name||'?')[0]}</div>
        <div style="flex:1"><div style="font-size:13px;font-weight:600">${sanitize(u.name,20)}</div><div style="font-size:10px;color:var(--txt3)">${roleLabels[u.role]||u.role}</div></div>
        <div id="gc-chk-${u.id}" style="width:20px;height:20px;border:2px solid var(--bdr);border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:12px"></div>
      </div>`).join('')}
    </div>
    <div id="gc-selected-count" style="font-size:11px;color:var(--txt3);margin-top:8px">0人選択中</div>
    <button class="btn btn-primary w-full mt-12" onclick="createGroupChat()">👥 グループ作成</button>
  `;
  openM('👥 グループチャット作成',html);
}
function _toggleGroupMember(uid,el){
  if(!window._groupChatMembers)window._groupChatMembers=new Set();
  if(window._groupChatMembers.has(uid)){window._groupChatMembers.delete(uid);el?.classList.remove('selected');}
  else{window._groupChatMembers.add(uid);el?.classList.add('selected');}
  const chk=document.getElementById('gc-chk-'+uid);
  if(chk)chk.innerHTML=window._groupChatMembers.has(uid)?'✅':'';
  const cnt=document.getElementById('gc-selected-count');
  if(cnt)cnt.textContent=window._groupChatMembers.size+'人選択中';
}
function _filterGroupMembers(q){
  q=q.toLowerCase();
  document.querySelectorAll('#gc-members-list .fwd-room').forEach(el=>{
    const name=el.querySelector('[style*="font-weight:600"]')?.textContent?.toLowerCase()||'';
    el.style.display=(!q||name.includes(q))?'flex':'none';
  });
}
function createGroupChat(){
  const name=document.getElementById('gc-name')?.value?.trim();
  if(!name){toast('グループ名を入力してください','e');return;}
  if(!window._groupChatMembers||window._groupChatMembers.size<2){toast('2人以上選択してください','e');return;}
  const myId=DB.currentUser?.id;
  const members=[myId,...window._groupChatMembers];
  const gKey='grp_'+Date.now();
  DB.chats[gKey]={
    name:sanitize(name,30),sub:'グループチャット',avi:'👥',isGroup:true,
    members,createdBy:myId,createdAt:new Date().toISOString(),msgs:[{mid:_genMsgId(),from:'system',text:`${DB.currentUser?.name||''}がグループ「${sanitize(name,20)}」を作成しました`,time:now_time(),date:new Date().toISOString().slice(0,10)}
    ]
  };
  saveDB();closeM();activeRoom=gKey;
  toast('グループを作成しました','s');
  goTo('chat');
}

// ── グループ情報 ──
function openGroupInfo(roomKey){
  const ch=DB.chats[roomKey];if(!ch||!ch.isGroup)return;
  const myId=DB.currentUser?.id;
  const members=(ch.members||[]).map(id=>{const u=_getUsers().find(x=>x.id===id);return u||{id,name:'不明',role:'?'};});
  const roleLabels={admin:'事務局',team:'チーム',coach:'コーチ',player:'選手',parent:'保護者'};
  const images=ch.msgs.filter(m=>m.img&&!m.deleted);
  const files=ch.msgs.filter(m=>m.file&&!m.deleted);
  const totalMsgs=ch.msgs.filter(m=>!m.deleted&&m.from!=='system').length;
  const isMuted=ch.muted;
  const isCreator=ch.createdBy===myId;

  openM('👥 '+sanitize(ch.name,20),`
    <div style="text-align:center;margin-bottom:16px">
      <div style="font-size:40px;margin-bottom:8px">👥</div>
      <div class="fw7" style="font-size:16px">${sanitize(ch.name,25)}</div>
      <div class="text-xs text-muted">${members.length}人のメンバー · ${totalMsgs}件のメッセージ</div>
    </div>

    <!-- アクション -->
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:16px">
      <button class="btn btn-ghost btn-sm" onclick="closeM();toggleMuteRoom('${roomKey}')">${isMuted?'🔔 通知ON':'🔕 ミュート'}</button>
      <button class="btn btn-ghost btn-sm" onclick="closeM();openChatSearch('${roomKey}')">🔍 検索</button>
      <button class="btn btn-ghost btn-sm" onclick="closeM();addGroupMember('${roomKey}')">➕ 追加</button>
    </div>

    <!-- メンバー -->
    <div class="text-xs fw7 mb-6" style="color:var(--txt2)">メンバー（${members.length}人）</div>
    <div style="max-height:200px;overflow-y:auto;margin-bottom:12px">
      ${members.map(u=>`<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:8px;margin-bottom:4px;background:var(--surf2)">
        <div class="avi" style="width:32px;height:32px;font-size:13px;background:var(--surf3)">${(u.name||'?')[0]}</div>
        <div style="flex:1"><div style="font-size:13px;font-weight:600">${sanitize(u.name||'不明',20)}</div><div style="font-size:10px;color:var(--txt3)">${roleLabels[u.role]||u.role}${u.id===ch.createdBy?' · 作成者':''}</div></div>
        ${isCreator&&u.id!==myId?`<button class="btn btn-ghost btn-xs" style="color:var(--red);font-size:10px" onclick="removeGroupMember('${roomKey}','${u.id}')">&times;</button>`:''}
      </div>`).join('')}
    </div>

    ${images.length?`<div style="margin-bottom:12px">
      <div class="text-xs fw7 mb-6">🖼️ 共有画像（${images.length}件）</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;max-height:120px;overflow-y:auto">
        ${images.slice(-8).filter(m=>m.img&&(m.img.startsWith('data:image/')||m.img.startsWith('blob:')||m.img.startsWith('https://'))).map(m=>`<div style="aspect-ratio:1;overflow:hidden;border-radius:6px;cursor:pointer" onclick="openImagePreview(this.querySelector('img').src)"><img src="${m.img}" style="width:100%;height:100%;object-fit:cover"></div>`).join('')}
      </div>
    </div>`:''}

    ${files.length?`<div style="margin-bottom:12px">
      <div class="text-xs fw7 mb-6">📄 共有ファイル（${files.length}件）</div>
      ${files.slice(-3).map(m=>`<div style="display:flex;align-items:center;gap:6px;padding:6px 10px;background:var(--surf2);border-radius:6px;margin-bottom:3px;font-size:11px">
        <span>${{'pdf':'📄','doc':'📝','xlsx':'📊'}[m.file?.ext]||'📎'}</span>
        <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${sanitize(m.file?.name||'',22)}</span>
        <span style="color:var(--txt3)">${m.file?.size||''}</span>
      </div>`).join('')}
    </div>`:''}

    <div style="padding-top:12px;border-top:1px solid var(--b1);display:flex;gap:8px">
      <button class="btn btn-ghost btn-sm flex-1" style="color:var(--red)" onclick="closeM();leaveGroup('${roomKey}')">🚪 退出</button>
      ${isCreator?`<button class="btn btn-ghost btn-sm flex-1" style="color:var(--red)" onclick="closeM();archiveChatRoom('${roomKey}')">🗑️ 削除</button>`:''}
    </div>
  `);
}

// ── グループメンバー削除 ──
function removeGroupMember(roomKey,uid){
  const ch=DB.chats[roomKey];if(!ch||!ch.isGroup)return;
  const idx=ch.members?.indexOf(uid);if(idx<0)return;
  const u=_getUsers().find(x=>x.id===uid);
  ch.members.splice(idx,1);
  ch.msgs.push({mid:_genMsgId(),from:'system',text:`${u?.name||'ユーザー'}がグループから削除されました`,time:now_time(),date:new Date().toISOString().slice(0,10)});
  saveDB();closeM();toast(`${u?.name||''}を削除しました`,'s');
  openGroupInfo(roomKey);
}
// ── ルーム情報パネル ──
function openRoomInfo(roomKey){
  const ch=DB.chats[roomKey];if(!ch)return;
  if(ch.isGroup) return openGroupInfo(roomKey);
  const myId=DB.currentUser?.id;
  const roleLabels={admin:'事務局',team:'チーム',coach:'コーチ',player:'選手',parent:'保護者'};

  // 相手の情報取得
  let partner=null;
  if(roomKey.startsWith('dm_')){
    const otherId=ch.senderId===myId?ch.userId:ch.senderId;
    partner=_getUsers().find(u=>u.id===otherId);
  }

  // 共有メディア・ファイル
  const images=ch.msgs.filter(m=>m.img&&!m.deleted);
  const files=ch.msgs.filter(m=>m.file&&!m.deleted);
  const totalMsgs=ch.msgs.filter(m=>!m.deleted&&m.from!=='system').length;
  const firstDate=ch.msgs.find(m=>m.date)?.date||'';
  const isMuted=ch.muted;

  let html=`<div style="text-align:center;margin-bottom:16px">
    <div class="avi" style="width:64px;height:64px;font-size:28px;margin:0 auto 10px;background:var(--surf3)">${partner?(partner.name||'?')[0]:(ch.avi||'💬')}</div>
    <div class="fw7" style="font-size:18px">${sanitize(partner?.name||ch.name||'',25)}</div>
    <div class="text-xs text-muted" style="margin-top:4px">${partner?roleLabels[partner.role]||'':ch.sub||''}</div>
  </div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px">
    <div class="stat-box" style="padding:10px;text-align:center"><div class="fw7" style="font-size:18px">${totalMsgs}</div><div class="text-xs text-muted">メッセージ</div></div>
    <div class="stat-box" style="padding:10px;text-align:center"><div class="fw7" style="font-size:18px">${images.length}</div><div class="text-xs text-muted">画像</div></div>
    <div class="stat-box" style="padding:10px;text-align:center"><div class="fw7" style="font-size:18px">${files.length}</div><div class="text-xs text-muted">ファイル</div></div>
  </div>

  <!-- アクション -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">
    <button class="btn btn-ghost btn-sm" onclick="closeM();toggleMuteRoom('${roomKey}')">
      ${isMuted?'🔔 通知ON':'🔕 ミュート'}
    </button>
    <button class="btn btn-ghost btn-sm" onclick="closeM();openChatSearch('${roomKey}')">🔍 検索</button>
  </div>

  <!-- チャット情報 -->
  <div style="padding:10px 14px;background:var(--surf2);border-radius:10px;margin-bottom:12px">
    <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px"><span class="text-muted">開始日</span><span class="fw7">${firstDate||'不明'}</span></div>
    <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px"><span class="text-muted">ルームタイプ</span><span class="fw7">${ch.type==='match'?'コーチマッチング':ch.type==='team_match'?'チームマッチング':ch.isInquiry?'お問い合わせ':'ダイレクトメッセージ'}</span></div>
    ${ch.pinnedMsg!=null?`<div style="display:flex;justify-content:space-between;font-size:12px"><span class="text-muted">📌 ピン留め</span><span class="fw7">${sanitize(ch.msgs[ch.pinnedMsg]?.text||'',20)}</span></div>`:''}
  </div>`;

  // 共有画像ギャラリー
  if(images.length>0){
    html+=`<div style="margin-bottom:12px">
      <div class="text-xs fw7 mb-6">🖼️ 共有画像（${images.length}件）</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;max-height:160px;overflow-y:auto">
        ${images.slice(-12).filter(m=>m.img&&(m.img.startsWith('data:image/')||m.img.startsWith('blob:')||m.img.startsWith('https://'))).map(m=>`<div style="aspect-ratio:1;overflow:hidden;border-radius:6px;cursor:pointer" onclick="openImagePreview(this.querySelector('img').src)"><img src="${m.img}" style="width:100%;height:100%;object-fit:cover"></div>`).join('')}
      </div>
    </div>`;
  }

  // 共有ファイル
  if(files.length>0){
    html+=`<div style="margin-bottom:12px">
      <div class="text-xs fw7 mb-6">📄 共有ファイル（${files.length}件）</div>
      ${files.slice(-5).map(m=>`<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:var(--surf2);border-radius:6px;margin-bottom:4px;font-size:12px">
        <span>${{'pdf':'📄','doc':'📝','xlsx':'📊','csv':'📋','pptx':'📽️'}[m.file?.ext]||'📎'}</span>
        <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${sanitize(m.file?.name||'',25)}</span>
        <span style="color:var(--txt3)">${m.file?.size||''}</span>
      </div>`).join('')}
    </div>`;
  }

  // 危険ゾーン
  html+=`<div style="padding-top:12px;border-top:1px solid var(--b1)">
    <button class="btn btn-ghost btn-sm w-full" style="color:var(--red)" onclick="closeM();archiveChatRoom('${roomKey}')">🗑️ チャットを非表示にする</button>
  </div>`;

  openM('ℹ️ チャット情報',html);
}

// ── スクロール制御 ──
function _onMsgsScroll(el){
  if(!el)return;
  const btn=document.getElementById('scroll-bottom-btn');
  if(!btn)return;
  const atBottom=el.scrollHeight-el.scrollTop-el.clientHeight<120;
  btn.style.display=atBottom?'none':'block';
}

// ── ミュート管理 ──
function toggleMuteRoom(roomKey){
  const ch=DB.chats[roomKey];if(!ch)return;
  ch.muted=!ch.muted;
  saveDB();
  toast(ch.muted?'ミュートしました':'ミュートを解除しました','s');
}

// ── チャット非表示（アーカイブ） ──
function archiveChatRoom(roomKey){
  const ch=DB.chats[roomKey];if(!ch)return;
  openM('⚠️ チャットを非表示にする',`<div style="text-align:center;padding:16px">
    <div style="font-size:40px;margin-bottom:12px">🗑️</div>
    <div class="fw7 mb-8">「${sanitize(ch.name||'',20)}」を非表示にしますか？</div>
    <div class="text-sm text-muted mb-16">メッセージ履歴は保持されますが、チャット一覧に表示されなくなります。</div>
    <div class="flex gap-10">
      <button class="btn btn-ghost flex-1" onclick="closeM()">キャンセル</button>
      <button class="btn btn-primary flex-1" style="background:var(--red)" onclick="ch=DB.chats['${roomKey}'];if(ch)ch.archived=true;saveDB();closeM();toast('非表示にしました','s');goTo('chat')">非表示にする</button>
    </div>
  </div>`);
}

// ── 全既読 ──
function markAllChatsRead(){
  const myKey=getMyKey();
  Object.values(DB.chats).forEach(ch=>{
    if(ch.msgs)ch.msgs.forEach(m=>{if(m.from!==myKey)m.read=true;});
    ch.unread=0;
  });
  saveDB();updateNotifBadge();
  toast('すべて既読にしました','s');
  goTo('chat');
}

// ── グループにメンバー追加 ──
function addGroupMember(roomKey){
  const ch=DB.chats[roomKey];if(!ch||!ch.isGroup)return;
  const myId=DB.currentUser?.id;
  const currentMembers=new Set(ch.members||[]);
  const candidates=_getUsers().filter(u=>u.id!==myId&&!currentMembers.has(u.id));
  const roleLabels={admin:'事務局',team:'チーム',coach:'コーチ',player:'選手',parent:'保護者'};
  if(candidates.length===0){toast('追加可能なメンバーがいません','w');return;}
  openM('➕ メンバー追加',`
    <input class="input mb-8" placeholder="🔍 名前で検索..." oninput="_filterAddMembers(this.value)" style="font-size:12px">
    <div id="add-member-list" style="max-height:260px;overflow-y:auto">
      ${candidates.map(u=>`<div class="fwd-room" onclick="doAddGroupMember('${roomKey}','${u.id}')">
        <div class="avi" style="width:32px;height:32px;font-size:13px;background:var(--surf3)">${(u.name||'?')[0]}</div>
        <div style="flex:1"><div style="font-size:13px;font-weight:600">${sanitize(u.name,20)}</div><div style="font-size:10px;color:var(--txt3)">${roleLabels[u.role]||u.role}</div></div>
        <button class="btn btn-primary btn-xs">追加</button>
      </div>`).join('')}
    </div>
  `);
}
function _filterAddMembers(q){
  q=q.toLowerCase();
  document.querySelectorAll('#add-member-list .fwd-room').forEach(el=>{
    const name=el.querySelector('[style*="font-weight:600"]')?.textContent?.toLowerCase()||'';
    el.style.display=(!q||name.includes(q))?'flex':'none';
  });
}
function doAddGroupMember(roomKey,uid){
  const ch=DB.chats[roomKey];if(!ch||!ch.isGroup)return;
  if(!ch.members)ch.members=[];
  if(ch.members.includes(uid)){toast('既にメンバーです','w');return;}
  ch.members.push(uid);
  const u=_getUsers().find(x=>x.id===uid);
  ch.msgs.push({mid:_genMsgId(),from:'system',text:`${u?.name||'ユーザー'}がグループに参加しました`,time:now_time(),date:new Date().toISOString().slice(0,10)});
  saveDB();closeM();
  toast(`${u?.name||''}を追加しました`,'s');
  const cr=document.getElementById('chat-right');
  if(cr){cr.innerHTML=renderRoom(roomKey,getMyKey());initChat();}
}

// ── グループ退出 ──
function leaveGroup(roomKey){
  const ch=DB.chats[roomKey];if(!ch||!ch.isGroup)return;
  const myId=DB.currentUser?.id;
  const idx=ch.members?.indexOf(myId);
  if(idx>=0)ch.members.splice(idx,1);
  ch.msgs.push({mid:_genMsgId(),from:'system',text:`${DB.currentUser?.name||''}がグループを退出しました`,time:now_time(),date:new Date().toISOString().slice(0,10)});
  ch.archived=true;
  saveDB();closeM();
  toast('グループを退出しました','s');
  goTo('chat');
}

// ==================== PLAYER STATS ====================
function statsPage(){
  const p=DB.players.find(x=>x.id===(DB.currentUser?.id));
  if(!p) return `<div class="pg-head"><div class="pg-title">マイ成績</div></div><div class="card" style="text-align:center;padding:48px"><div style="font-size:40px">📊</div><div class="fw7 mt-16">データなし</div><p class="text-muted text-sm mt-8">選手プロフィールの設定後に利用できます</p><button class="btn btn-primary mt-16" onclick="goTo('profile')">プロフィールを設定する</button></div>`;
  const team=DB.teams.find(t=>t.id===p.team);
  const log=DB.trainingLog[p.id]||{};
  const logEntries=Object.values(log).filter(e=>e&&e.date).sort((a,b)=>a.date>b.date?1:-1);
  const totalSessions=logEntries.length;
  const totalKcal=logEntries.reduce((s,e)=>s+(e.kcal||0),0);
  const avgCond=totalSessions?Math.round(logEntries.reduce((s,e)=>s+(e.cond||0),0)/totalSessions*10)/10:0;
  const _thisM=curMonth();
  const _mLogs=logEntries.filter(e=>e.date&&e.date.startsWith(_thisM));
  const _mTime=_mLogs.reduce((s,e)=>s+(e.duration||e.time||0),0);
  const _mKcal=_mLogs.reduce((s,e)=>s+(e.kcal||0),0);
  const streak=(()=>{let s=0,d=new Date();while(true){const k=d.toISOString().slice(0,10);if(log[k]){s++;d.setDate(d.getDate()-1);}else break;}return s;})();
  const pbs=p.pbs||{};
  const latestComment=p.coachComments?.slice(-1)[0];
  const goals=p.goals||[];
  const activeGoals=goals.filter(g=>g.status!=='done');

  // 月別練習回数（過去6ヶ月）
  const last6months=Array.from({length:6},(_,i)=>{
    const d=new Date();d.setMonth(d.getMonth()-5+i);
    return d.toISOString().slice(0,7);
  });

  return`<div class="pg-head flex justify-between items-center">
    <div><div class="pg-title">マイ成績</div><div class="pg-sub">${team?sanitize(team.name,20):'所属なし'} / ${sanitize(p.position||p.sport||'--',15)}</div></div>
    <div class="flex gap-8">
      <button class="btn btn-secondary btn-sm" onclick="openGrowthChart('${p.id}')">📈 成長グラフ</button>
      <button class="btn btn-ghost btn-sm" onclick="openGoalModal()">🎯 目標設定</button>
      <button class="btn btn-primary btn-sm" onclick="openPBModal()">📝 記録を更新</button>
    </div>
  </div>

  <!-- KPIカード -->
  <div class="stat-row" style="grid-template-columns:repeat(4,1fr);margin-bottom:20px">
    <div class="stat-box"><div class="stat-ico">🏋️</div><div class="stat-n">${totalSessions}</div><div class="stat-l">総練習回数</div></div>
    <div class="stat-box"><div class="stat-ico">🔥</div><div class="stat-n">${_mKcal.toLocaleString()}</div><div class="stat-l">今月消費kcal</div></div>
    <div class="stat-box"><div class="stat-ico">⏱️</div><div class="stat-n">${_mTime}</div><div class="stat-l">今月練習時間(分)</div></div>
    <div class="stat-box" style="${streak>=3?'border:1px solid var(--org)':''}"><div class="stat-ico">${streak>=7?'🔥':streak>=3?'⚡':'📅'}</div><div class="stat-n" style="${streak>=3?'color:var(--org)':''}">${streak}</div><div class="stat-l">連続記録日数</div></div>
  </div>

  <div style="display:grid;grid-template-columns:2fr 1fr;gap:20px;margin-bottom:20px">
    <!-- コンディション推移 -->
    <div class="card">
      <div class="fw7 mb-14" style="font-size:14px">📈 コンディション推移（30日）</div>
      <div style="height:180px"><canvas id="stats-cond-chart"></canvas></div>
    </div>
    <!-- 月別練習回数 -->
    <div class="card">
      <div class="fw7 mb-12" style="font-size:14px">📊 月別練習回数</div>
      <div style="display:flex;gap:6px;align-items:flex-end;height:120px;margin-bottom:8px">
        ${last6months.map(m=>{
          const cnt=logEntries.filter(e=>e.date&&e.date.startsWith(m)).length;
          const maxCnt=Math.max(...last6months.map(mm=>logEntries.filter(e=>e.date&&e.date.startsWith(mm)).length),1);
          const h=Math.round((cnt/maxCnt)*100);
          const isThis=m===_thisM;
          return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
            <div style="font-size:10px;color:var(--txt3);font-weight:700">${cnt}</div>
            <div style="width:100%;border-radius:4px 4px 0 0;background:${isThis?'var(--org)':'var(--teal)'};height:${h}%;min-height:4px;opacity:${isThis?1:.7}"></div>
            <div style="font-size:9px;color:var(--txt3)">${m.slice(5)}月</div>
          </div>`;
        }).join('')}
      </div>
      <div style="text-align:center;font-size:11px;color:var(--txt3)">今月: ${_mLogs.length}回 / 平均: ${Math.round(last6months.reduce((s,m)=>s+logEntries.filter(e=>e.date&&e.date.startsWith(m)).length,0)/6*10)/10}回</div>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px">
    <!-- PB -->
    <div class="card">
      <div class="flex justify-between items-center mb-12">
        <div class="fw7" style="font-size:14px">🏆 パーソナルベスト</div>
        <button class="btn btn-ghost btn-xs" onclick="openPBModal()">編集</button>
      </div>
      ${Object.keys(pbs).length?`<div style="display:grid;gap:8px">`+Object.entries(pbs).map(([item,val])=>`
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:var(--surf2);border-radius:10px">
          <span style="font-size:12px;color:var(--txt2)">${sanitize(item,20)}</span>
          <b style="color:var(--org);font-size:15px">${sanitize(String(val),15)}</b>
        </div>`).join('')+`</div>`
      :`<div style="text-align:center;padding:20px;color:var(--txt3)"><div style="font-size:28px;margin-bottom:8px">🏆</div><div class="text-sm">まだ記録がありません</div><button class="btn btn-primary btn-sm mt-12" onclick="openPBModal()">記録を入力する</button></div>`}
    </div>

    <!-- 目標管理 -->
    <div class="card">
      <div class="flex justify-between items-center mb-12">
        <div class="fw7" style="font-size:14px">🎯 目標管理</div>
        <button class="btn btn-ghost btn-xs" onclick="openGoalModal()">+ 追加</button>
      </div>
      ${activeGoals.length?activeGoals.slice(0,4).map(g=>{
        const pct=Math.min(Math.round((g.current||0)/(g.target||1)*100),100);
        return `<div style="margin-bottom:12px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
            <span style="font-size:12px;font-weight:600">${sanitize(g.title,20)}</span>
            <span style="font-size:11px;color:var(--org);font-weight:700">${g.current||0} / ${g.target||0} ${g.unit||''}</span>
          </div>
          <div style="height:6px;background:var(--b2);border-radius:3px">
            <div style="width:${pct}%;height:100%;background:${pct>=100?'var(--grn)':'var(--org)'};border-radius:3px;transition:width .6s"></div>
          </div>
          <div style="font-size:10px;color:var(--txt3);margin-top:2px">期限: ${g.deadline||'なし'} ${pct>=100?'✅ 達成！':''}</div>
        </div>`;
      }).join(''):`<div style="text-align:center;padding:20px;color:var(--txt3)"><div style="font-size:28px;margin-bottom:8px">🎯</div><div class="text-sm">目標を設定しましょう</div><button class="btn btn-primary btn-sm mt-12" onclick="openGoalModal()">目標を追加する</button></div>`}
    </div>
  </div>

  <!-- コーチコメント + 直近ログ -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px">
    <div class="card">
      <div class="fw7 mb-12" style="font-size:14px">💬 コーチからのコメント</div>
      ${p.coachComments?.length?p.coachComments.slice(-3).reverse().map(c=>`
        <div style="padding:10px 12px;background:rgba(249,115,22,.06);border-radius:10px;border-left:3px solid var(--org);margin-bottom:8px">
          <div class="text-sm">${sanitize(c.comment||'',200)}</div>
          <div class="text-xs text-muted mt-4">${c.date||''} ${c.coachName?'— '+sanitize(c.coachName,15):''}</div>
        </div>`).join('')
      :`<div style="text-align:center;padding:20px;color:var(--txt3)"><div style="font-size:28px;margin-bottom:8px">💬</div><div class="text-sm">コーチからのコメントを待っています</div></div>`}
    </div>
    <div class="card">
      <div class="fw7 mb-12" style="font-size:14px">📅 直近のトレーニング記録</div>
      ${logEntries.length?logEntries.slice(-6).reverse().map(e=>`
        <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--b1)">
          <div style="width:56px;font-size:10px;color:var(--txt3);flex-shrink:0">${(e.date||'').slice(5)}</div>
          <div style="flex:1">
            <div style="font-size:12px;font-weight:600">${sanitize(e.memo||e.type||'練習',24)}</div>
            <div style="font-size:10px;color:var(--txt3)">${e.duration||e.time||0}分 · ${e.kcal||0}kcal</div>
          </div>
          <div style="display:flex;gap:1px;font-size:11px">${'⭐'.repeat(Math.min(e.cond||0,5))}</div>
        </div>`).join('')
      :`<div style="text-align:center;padding:20px;color:var(--txt3)"><div style="font-size:28px;margin-bottom:8px">📅</div><div class="text-sm">トレーニングを記録しましょう</div></div>`}
    </div>
  </div>`;
}


function openPBModal(){
  const p=DB.players.find(x=>x.id===DB.currentUser?.id);
  if(!p){toast('選手データが見つかりません','e');return;}
  const pbs=p.pbs||{};
  const pbItems=['50m走','100m走','垂直跳び','握力','反復横跳び','シャトルラン','1500m走','立ち幅跳び','ハンドボール投げ'];
  openM('🏆 パーソナルベスト記録',`
    <div style="display:grid;gap:10px;max-height:60vh;overflow-y:auto;padding-right:4px">
      ${pbItems.map(item=>`
        <div style="display:flex;align-items:center;gap-10;gap:10px">
          <label style="flex:1;font-size:13px">${item}</label>
          <input id="pb-${item}" class="input" style="width:120px;text-align:right" placeholder="${pbs[item]||'未記録'}" value="${pbs[item]||''}">
        </div>`).join('')}
      <div style="display:flex;align-items:center;gap:10px">
        <label style="flex:1;font-size:13px">カスタム項目名</label>
        <input id="pb-custom-name" class="input" style="width:120px" placeholder="種目名">
        <input id="pb-custom-val" class="input" style="width:80px" placeholder="記録">
      </div>
    </div>
    <div class="flex gap-10 mt-16">
      <button class="btn btn-primary" onclick="_savePBs(${JSON.stringify(pbItems)})">💾 保存</button>
      <button class="btn btn-ghost" onclick="closeM()">閉じる</button>
    </div>
  `);
}

function _savePBs(items){
  const p=DB.players.find(x=>x.id===DB.currentUser?.id);
  if(!p){toast('エラー','e');return;}
  if(!p.pbs)p.pbs={};
  items.forEach(item=>{
    const val=(document.getElementById('pb-'+item)?.value||'').trim();
    if(val) p.pbs[item]=val;
    else delete p.pbs[item];
  });
  const cName=(document.getElementById('pb-custom-name')?.value||'').trim();
  const cVal=(document.getElementById('pb-custom-val')?.value||'').trim();
  if(cName&&cVal) p.pbs[cName]=cVal;
  saveDB();
  closeM();
  toast('パーソナルベストを保存しました','s');
  goTo('stats');
}

function coachPlayersPage(){
  const me=getMyCoach();
  if(!me) return `<div class="pg-head"><div class="pg-title">担当選手</div></div><div class="card text-center" style="padding:48px"><div style="font-size:40px;margin-bottom:12px">🏃</div><div class="fw7 mb-8">コーチ情報が見つかりません</div><p class="text-sm text-muted">プロフィールを設定してください</p><button class="btn btn-primary mt-16" onclick="goTo('profile')">プロフィールを設定</button></div>`;
  const t=DB.teams.find(x=>x.id===me.team);
  // ======== 開示チェック ========
  const myDisc=getMyDisclosure();
  if(!me.team||!t){
    return`<div style="text-align:center;padding:60px 20px;color:var(--txt3)"><i class="fa fa-lock" style="font-size:48px;display:block;margin-bottom:16px;color:var(--txt3)"></i><div class="fw7" style="font-size:16px;margin-bottom:8px">チームに未所属</div><div class="text-sm">チームとマッチング後に担当選手が表示されます。</div></div>`;
  }
  if(!myDisc){
    // 開示待ち or 未署名
    const pendingDisc=_dbArr('disclosures').find(d=>d.coachId===me.id&&d.teamId===me.team&&d.status==='active'&&!d.coachAgreedAt);
    if(pendingDisc){
      return`<div style="text-align:center;padding:60px 20px"><div style="width:80px;height:80px;background:rgba(14,165,233,.1);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px"><i class="fa fa-file-signature" style="font-size:36px;color:var(--blue)"></i></div><div class="fw7" style="font-size:17px;margin-bottom:8px">選手情報の同意確認が必要です</div><div class="text-sm text-muted" style="margin-bottom:24px;line-height:1.7">${t.name}から選手情報の開示許可が届いています。<br>同意確認を行うことでアクセスが有効になります。</div><button class="btn btn-primary" onclick="openCoachPledgeModal()">✍️ 同意確認書を確認する</button></div>`;
    }
    return renderDisclosureLockScreen('players', t);
  }
  // ======== 開示済み・署名済み → 通常表示 ========
  // アクセスログを記録
  const discForLog = _dbArr('disclosures').find(d=>d.coachId===me.id&&d.teamId===me.team&&d.status==='active'&&d.coachAgreedAt);
  if(discForLog){ if(!discForLog.accessLog) discForLog.accessLog=[]; discForLog.accessLog.push({at:new Date().toLocaleString('ja-JP'),page:'coach-players',action:'担当選手一覧を閲覧',ip:discForLog.coachAgreedIp||'記録済'}); }
  const players=DB.players.filter(p=>p.team===me.team);
  // 実際のDBから各選手のコンディションデータを取得
  function getPlayerCond(pid){
    const log=DB.trainingLog[pid]||{};
    const entries=Object.values(log);
    if(entries.length===0) return null;
    const latest=entries.sort((a,b)=>b.date>a.date?1:-1)[0];
    return latest.cond||null;
  }
  function getPlayerKcal(pid){
    const meals=DB.meals[pid]||DB.meals;
    const today=Array.isArray(meals.today)?meals.today:[];
    return today.reduce((s,m)=>s+(m.kcal||0),0)||null;
  }
  function getCondStatus(c){
    if(c===null) return '未記録';
    if(c>=8) return '好調';
    if(c>=6) return '普通';
    return '要注意';
  }
  function getCondColor(c){
    if(c===null) return 'var(--txt3)';
    if(c>=8) return 'var(--grn)';
    if(c>=6) return '#f59e0b';
    return '#ef4444';
  }
  return`<div class="pg-head"><div class="pg-title">担当選手一覧</div><div class="pg-sub">${t?t.name:''}・${players.length}名</div>
    <div style="display:flex;gap:8px">
    <button class="btn btn-primary btn-sm" onclick="openShareWorkoutModal()">📋 メニュー配信</button>
    <button class="btn btn-secondary btn-sm" onclick="goTo('coach-report')">📊 全員レポート</button>
    </div>
  </div>
  <!-- 全体サマリー -->
  <div style="display:grid;grid-template-columns:2fr 1fr;gap:14px;margin-bottom:16px">
    <div class="card" style="padding:14px">
      <div class="fw7 mb-8 text-sm">📊 選手コンディション推移（平均）</div>
      <div style="height:110px"><canvas id="coach-players-cond-chart"></canvas></div>
    </div>
    <div class="card" style="padding:14px">
      <div class="fw7 mb-8 text-sm">🎯 目標達成率</div>
      <div style="height:110px"><canvas id="coach-players-goal-chart"></canvas></div>
    </div>
  </div>
  <div class="stat-row" style="grid-template-columns:repeat(4,1fr);margin-bottom:16px">
    <div class="stat-box"><div style="font-size:11px;color:var(--txt3);margin-bottom:4px">在籍人数</div><div style="font-size:22px;font-weight:700;color:var(--txt1)">${players.length}<span style="font-size:13px;color:var(--txt3)"> 名</span></div></div>
    <div class="stat-box"><div style="font-size:11px;color:var(--txt3);margin-bottom:4px">平均コンディション</div><div style="font-size:22px;font-weight:700;color:var(--grn)">${(()=>{const cs=players.map(p=>getPlayerCond(p.id)).filter(c=>c!==null);return cs.length?(cs.reduce((a,b)=>a+b,0)/cs.length).toFixed(1):'--';})()}<span style="font-size:13px;color:var(--txt3)">/10</span></div></div>
    <div class="stat-box"><div style="font-size:11px;color:var(--txt3);margin-bottom:4px">好調選手</div><div style="font-size:22px;font-weight:700;color:var(--org)">${players.filter(p=>{const c=getPlayerCond(p.id);return c!==null&&c>=8;}).length}<span style="font-size:13px;color:var(--txt3)"> 名</span></div></div>
    <div class="stat-box"><div style="font-size:11px;color:var(--txt3);margin-bottom:4px">要注意</div><div style="font-size:22px;font-weight:700;color:#ef4444">${players.filter(p=>{const c=getPlayerCond(p.id);return c!==null&&c<6;}).length}<span style="font-size:13px;color:var(--txt3)"> 名</span></div></div>
  </div>
  <!-- 選手リスト -->
  <div class="section-card">
    <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr auto;gap:8px;padding:8px 12px;border-bottom:1px solid var(--b2);font-size:11px;color:var(--txt3);font-weight:600">
      <span>選手</span><span style="text-align:center">コンディション</span><span style="text-align:center">kcal</span><span style="text-align:center">睡眠</span><span style="text-align:center">状態</span><span></span>
    </div>
    ${players.map((p,i)=>{
      const c=getPlayerCond(p.id);
      const cc=getCondColor(c);
      return`<div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr auto;gap:8px;align-items:center;padding:12px;border-bottom:1px solid var(--b1);cursor:pointer" 
        onmouseover="this.style.background='var(--surf2)'" onmouseout="this.style.background=''">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:36px;height:36px;background:linear-gradient(135deg,var(--org),#f59e0b);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#fff;flex-shrink:0">${(p.name||'?')[0]}</div>
          <div>
            <div style="font-size:13px;font-weight:600;color:var(--txt1)">${p.name}</div>
            <div style="font-size:11px;color:var(--txt3)">${p.pos} · ${p.age}歳 · ${p.weight}kg/${p.height}cm</div>
          </div>
        </div>
        <div style="text-align:center">
          <div style="font-size:16px;font-weight:700;color:${cc}">${c!==null?c:'--'}</div>
          <div style="height:4px;background:var(--b2);border-radius:2px;margin:3px 4px 0"><div style="width:${c!==null?c*10:0}%;height:100%;background:${cc};border-radius:2px"></div></div>
        </div>
        <div style="text-align:center;font-size:13px;color:var(--txt2)">${getPlayerKcal(p.id)||'--'}kcal</div>
        <div style="text-align:center;font-size:13px;color:var(--txt2)">${DB.trainingLog[p.id]?.today?.sleep||'--'}h</div>
        <div style="text-align:center"><span style="font-size:11px;padding:3px 10px;border-radius:20px;background:${cc}22;color:${cc};font-weight:600">${getCondStatus(c)}</span></div>
        <div style="display:flex;gap:6px">
          <button class="btn btn-ghost btn-sm" style="font-size:11px;padding:4px 10px" onclick="event.stopPropagation();showPlayerCoachComment('${p.id}')" title="コーチノート">✏️</button>
          <button class="btn btn-ghost btn-sm" style="font-size:11px;padding:4px 10px" onclick="event.stopPropagation();openGrowthChart('${p.id}')" title="成長グラフ">📈</button>
          <button class="btn btn-ghost btn-sm" style="font-size:11px;padding:4px 10px" onclick="event.stopPropagation();openPlayerGoals('${p.id}')" title="目標設定">🎯</button>
          <button class="btn btn-ghost btn-sm" style="font-size:11px;padding:4px 10px" onclick="event.stopPropagation();window.coachReportView='${p.id}';goTo('coach-report')" title="レポート">📊</button>
        </div>
      </div>`;
    }).join('')}
  </div>`;
}


// ─── 選手目標設定・コーチングノート ───────────────────────────────
function openPlayerGoals(pid){
  const p=DB.players.find(x=>x.id===pid);
  if(!p) return;
  const goals=p.goals||{short:'',long:'',notes:''};
  const progress=p.goalProgress||{short:0,long:0};
  openM(`🎯 ${sanitize(p.name||'選手',10)}の目標設定`,`<div style="display:grid;gap:14px">
    <div>
      <label class="label">短期目標（1ヶ月）</label>
      <input id="goal-short" class="input" value="${sanitize(goals.short,60)}" placeholder="例: 体重を2kg増量する" maxlength="60">
      <div class="flex items-center gap-8 mt-8">
        <span class="text-xs text-muted">達成度</span>
        <input type="range" id="goal-short-pct" min="0" max="100" value="${progress.short||0}" style="flex:1" oninput="document.getElementById('goal-short-pct-val').textContent=this.value+'%'">
        <span id="goal-short-pct-val" class="text-xs fw7" style="width:36px;text-align:right">${progress.short||0}%</span>
      </div>
    </div>
    <div>
      <label class="label">長期目標（3ヶ月）</label>
      <input id="goal-long" class="input" value="${sanitize(goals.long,60)}" placeholder="例: レギュラーポジションを獲得する" maxlength="60">
      <div class="flex items-center gap-8 mt-8">
        <span class="text-xs text-muted">達成度</span>
        <input type="range" id="goal-long-pct" min="0" max="100" value="${progress.long||0}" style="flex:1" oninput="document.getElementById('goal-long-pct-val').textContent=this.value+'%'">
        <span id="goal-long-pct-val" class="text-xs fw7" style="width:36px;text-align:right">${progress.long||0}%</span>
      </div>
    </div>
    <div>
      <label class="label">コーチングノート（非公開）</label>
      <textarea id="goal-notes" class="input" rows="3" maxlength="300" placeholder="指導方針・気づき・次回の重点ポイント...">${sanitize(goals.notes,300)}</textarea>
      <div class="text-xs text-muted mt-4"><i class="fa fa-lock"></i> このメモはコーチのみ閲覧できます</div>
    </div>
    <button class="btn btn-primary w-full" onclick="savePlayerGoals('${pid}')">💾 保存する</button>
  </div>`);
}
function savePlayerGoals(pid){
  const p=DB.players.find(x=>x.id===pid);
  if(!p) return;
  const short=(document.getElementById('goal-short')?.value||'').trim();
  const long=(document.getElementById('goal-long')?.value||'').trim();
  const notes=(document.getElementById('goal-notes')?.value||'').trim();
  const shortPct=parseInt(document.getElementById('goal-short-pct')?.value||'0');
  const longPct=parseInt(document.getElementById('goal-long-pct')?.value||'0');
  p.goals={short:sanitize(short,60),long:sanitize(long,60),notes:sanitize(notes,300)};
  p.goalProgress={short:shortPct,long:longPct};
  p.goalUpdatedAt=new Date().toISOString();
  saveDB();closeM();toast('目標を保存しました','s');
}

function showPlayerCoachComment(pid){
  const p=DB.players.find(x=>x.id===pid)||{id:pid,name:'選手'};
  const hist=(p.commentHistory||[]).slice(-3).reverse();
  openM(`✏️ ${sanitize(p.name||'選手',10)}へのコーチメモ`,`
    <div style="display:grid;gap:12px">
      <div class="form-group">
        <label class="label">コメント・フィードバック</label>
        <textarea id="cc-txt" rows="4" class="input" style="resize:vertical" placeholder="例：今日はスプリントの改善が見られました。明日は持久力トレーニングを重点的に..." maxlength="300"></textarea>
      </div>
      <div class="form-group">
        <label class="label">取り組み評価</label>
        <div style="display:flex;gap:6px">
          ${['◎ 優秀','○ 良い','△ 普通','&times; 要改善'].map((l,i)=>`<button id="eval-${i}" onclick="document.querySelectorAll('.eval-btn').forEach(b=>{b.style.background='var(--surf2)';b.style.color='var(--txt2)'});this.style.background='rgba(249,115,22,.2)';this.style.color='var(--org)'" class="eval-btn" style="flex:1;padding:7px 4px;border-radius:8px;border:1px solid var(--bdr);background:var(--surf2);color:var(--txt2);font-size:11px;cursor:pointer">${l}</button>`).join('')}
        </div>
      </div>
      ${hist.length?`<div style="border-top:1px solid var(--bdr);padding-top:10px">
        <div class="text-xs text-muted mb-6">📜 過去のメモ</div>
        ${hist.map(c=>`<div style="padding:7px 10px;background:var(--surf2);border-radius:6px;margin-bottom:5px">
          <div class="text-xs fw7" style="color:var(--teal)">${c.date||''} ${c.eval||''}</div>
          <div class="text-xs text-muted mt-2">${sanitize(c.text||'',80)}</div>
        </div>`).join('')}
      </div>`:''}
      <button class="btn btn-primary w-full" onclick="_saveCoachComment('${p.id}')">💾 保存する</button>
    </div>
  `);
}
function _saveCoachComment(pid){
  const p=DB.players.find(x=>x.id===pid);
  if(!p){toast('選手が見つかりません','e');return;}
  const text=(document.getElementById('cc-txt')?.value||'').trim();
  if(!text){toast('コメントを入力してください','e');return;}
  const evalBtn=document.querySelector('.eval-btn[style*="rgba(249,115,22"]');
  const evalText=evalBtn?evalBtn.textContent:'';
  if(!p.commentHistory) p.commentHistory=[];
  p.commentHistory.push({
    date:new Date().toLocaleDateString('ja-JP',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}),
    text:sanitize(text,300),
    eval:evalText,
  });
  // 最新50件のみ保持
  if(p.commentHistory.length>50) p.commentHistory=p.commentHistory.slice(-50);
  p.coachComment=sanitize(text,300);
  saveDB();closeM();toast('コメントを保存しました','s');
}

function coachReportPage(){
  const me=getMyCoach();
  if(!me) return `<div class="pg-head"><div class="pg-title">選手レポート</div></div><div class="card text-center" style="padding:48px"><div style="font-size:40px;margin-bottom:12px">📊</div><div class="fw7 mb-8">コーチ情報が見つかりません</div><p class="text-sm text-muted">プロフィールを設定してください</p><button class="btn btn-primary mt-16" onclick="goTo('profile')">プロフィールを設定</button></div>`;
  const t=DB.teams.find(x=>x.id===me.team);
  // ======== 開示チェック ========
  if(!getMyDisclosure()){
    const pendingDisc=_dbArr('disclosures').find(d=>d.coachId===me.id&&d.teamId===me.team&&d.status==='active'&&!d.coachAgreedAt);
    if(pendingDisc){
      return`<div style="text-align:center;padding:60px 20px"><div style="width:80px;height:80px;background:rgba(14,165,233,.1);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px"><i class="fa fa-file-signature" style="font-size:36px;color:var(--blue)"></i></div><div class="fw7" style="font-size:17px;margin-bottom:8px">選手情報の同意確認が必要です</div><div class="text-sm text-muted" style="margin-bottom:24px">${t?t.name:'チーム'}から開示許可が届いています。署名するとレポートにアクセスできます。</div><button class="btn btn-primary" onclick="openCoachPledgeModal()">✍️ 同意確認書を確認する</button></div>`;
    }
    return renderDisclosureLockScreen('report', t);
  }
  // ======== 開示済み → 通常表示 ========
  // アクセスログを記録
  const discForLog2 = _dbArr('disclosures').find(d=>d.coachId===me.id&&d.teamId===me.team&&d.status==='active'&&d.coachAgreedAt);
  if(discForLog2){ if(!discForLog2.accessLog) discForLog2.accessLog=[]; const selId0=window.coachReportView||'all'; const pname=selId0==='all'?'全選手':((DB.players.find(p=>p.id===selId0)||{}).name||selId0); discForLog2.accessLog.push({at:new Date().toLocaleString('ja-JP'),page:'coach-report',action:`選手レポート閲覧: ${pname}`,ip:discForLog2.coachAgreedIp||'記録済'}); }
  const players=DB.players.filter(p=>p.team===me.team);
  const selId=window.coachReportView||'all';
  const days=['月','火','水','木','金','土','日'];
  // 選手のコンディションデータをDBから取得するヘルパー
  function getPlayerData(pid){
    const log = DB.trainingLog[pid] || {};
    const entries = Object.values(log).sort((a,b)=>a.date>b.date?-1:1).slice(0,7);
    const bLog = DB.bodyLog[pid] || {};
    const cLogData = DB.conditionLog[pid] || {};
    const cEntries = Object.values(cLogData).sort((a,b)=>a.date>b.date?-1:1).slice(0,7);
    const cond  = cEntries.length ? cEntries.map(e=>e.mood||3) : entries.map(e=>e.cond||8);
    const kcal  = entries.map(e=>e.kcal  || 0);
    const sleep = cEntries.length ? cEntries.map(e=>e.sleep||0) : entries.map(e=>e.sleep || 0);
    const fatigue = cEntries.map(e=>e.fatigue||0);
    const pain = cEntries.filter(e=>e.pain).map(e=>e.pain);
    const training = entries.length ? '記録あり' : '未記録';
    const memo  = entries[0]?.memo || '';
    // 体重データ
    const bodyEntries = Object.values(bLog).sort((a,b)=>a.date>b.date?-1:1);
    const latestWeight = bodyEntries[0]?.weight || null;
    const latestFat = bodyEntries[0]?.bodyFat || null;
    return { cond, kcal, sleep, fatigue, pain, training, memo, latestWeight, latestFat };
  };

  const tabHTML=`<div style="display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap;align-items:center">
    <span style="font-size:11px;color:var(--txt3);margin-right:4px">表示：</span>
    <button onclick="window.coachReportView='all';goTo('coach-report')"
      style="padding:7px 16px;border-radius:20px;border:1px solid ${selId==='all'?'var(--org)':'var(--b2)'};background:${selId==='all'?'rgba(249,115,22,.15)':'transparent'};color:${selId==='all'?'var(--org)':'var(--txt3)'};font-size:12px;cursor:pointer;font-weight:${selId==='all'?700:400}">
      👥 全選手まとめ
    </button>
    ${players.map(p=>`<button onclick="window.coachReportView='${p.id}';goTo('coach-report')"
      style="padding:7px 16px;border-radius:20px;border:1px solid ${selId===p.id?'var(--org)':'var(--b2)'};background:${selId===p.id?'rgba(249,115,22,.15)':'transparent'};color:${selId===p.id?'var(--org)':'var(--txt3)'};font-size:12px;cursor:pointer;font-weight:${selId===p.id?700:400}">
      ${p.name}
    </button>`).join('')}
  </div>`;

  let contentHTML='';
  if(selId==='all'){
    contentHTML=`
      <div class="section-card" style="margin-bottom:16px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <span class="section-card-title">📋 今週の選手サマリー</span>
          <span style="font-size:11px;color:var(--txt3)">行をクリックで個別詳細</span>
        </div>
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <thead><tr style="border-bottom:2px solid var(--b2)">
              <th style="text-align:left;padding:8px 12px;color:var(--txt3);font-weight:600">選手名</th>
              <th style="text-align:center;padding:8px;color:var(--txt3);font-weight:600">POS</th>
              <th style="text-align:center;padding:8px;color:var(--txt3);font-weight:600">コンディション</th>
              <th style="text-align:center;padding:8px;color:var(--txt3);font-weight:600">平均kcal</th>
              <th style="text-align:center;padding:8px;color:var(--txt3);font-weight:600">平均睡眠</th>
              <th style="text-align:center;padding:8px;color:var(--txt3);font-weight:600">練習</th>
              <th style="text-align:center;padding:8px;color:var(--txt3);font-weight:600">状態</th>
            </tr></thead>
            <tbody>
              ${players.map((p,i)=>{
                const d=getPlayerData(p.id);
                const avg=(arr)=>(arr.reduce((a,b)=>a+b,0)/arr.length);
                const ac=avg(d.cond).toFixed(1),ak=Math.round(avg(d.kcal)),as=avg(d.sleep).toFixed(1);
                const cc=ac>=8?'var(--grn)':ac>=6?'#f59e0b':'#ef4444';
                const sl=ac>=8?'好調':ac>=6?'普通':'要注意';
                return`<tr style="border-bottom:1px solid var(--b1);cursor:pointer;transition:background .15s" 
                  onmouseover="this.style.background='var(--surf2)'" onmouseout="this.style.background=''"
                  onclick="window.coachReportView='${p.id}';goTo('coach-report')">
                  <td style="padding:10px 12px">
                    <div style="display:flex;align-items:center;gap:8px">
                      <div style="width:28px;height:28px;background:linear-gradient(135deg,var(--org),#f59e0b);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff">${(p.name||'?')[0]}</div>
                      <span style="color:var(--txt1);font-weight:600">${p.name}</span>
                    </div>
                  </td>
                  <td style="text-align:center;padding:10px 8px;color:var(--txt3)">${p.pos}</td>
                  <td style="text-align:center;padding:10px 8px">
                    <div style="display:flex;align-items:center;justify-content:center;gap:6px">
                      <span style="font-weight:700;color:${cc}">${ac}</span>
                      <div style="width:40px;height:4px;background:var(--b2);border-radius:2px"><div style="width:${ac*10}%;height:100%;background:${cc};border-radius:2px"></div></div>
                    </div>
                  </td>
                  <td style="text-align:center;padding:10px 8px;color:var(--txt2)">${ak}kcal</td>
                  <td style="text-align:center;padding:10px 8px;color:var(--txt2)">${as}h</td>
                  <td style="text-align:center;padding:10px 8px;font-size:15px">${d.training}</td>
                  <td style="text-align:center;padding:10px 8px"><span style="font-size:11px;padding:3px 10px;border-radius:20px;background:${cc}22;color:${cc};font-weight:600">${sl}</span></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(${Math.min(players.length,4)},1fr);gap:12px">
        ${players.map(p=>{
          const d=getPlayerData(p.id);
          return`<div class="section-card" style="cursor:pointer" onclick="window.coachReportView='${p.id}';goTo('coach-report')"
            onmouseover="this.style.borderColor='var(--org)'" onmouseout="this.style.borderColor='var(--b2)'">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
              <span style="font-size:13px;font-weight:700;color:var(--txt1)">${p.name}</span>
              <span style="font-size:11px;color:var(--blue)">詳細 →</span>
            </div>
            <div style="font-size:10px;color:var(--txt3);margin-bottom:6px">コンディション推移</div>
            <div style="display:flex;align-items:flex-end;gap:3px;height:48px">
              ${d.cond.map((v,i)=>{const c=v>=8?'var(--grn)':v>=6?'#f59e0b':'#ef4444';return`<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:1px"><div style="width:100%;background:${c};border-radius:2px 2px 0 0;height:${Math.round(v/10*44)}px;opacity:.8"></div><span style="font-size:8px;color:var(--txt3)">${days[i]}</span></div>`;}).join('')}
            </div>
          </div>`;
        }).join('')}
      </div>`;
  } else {
    const p=players.find(x=>x.id===selId)||players[0];
    if(!p) return `<div class="pg-head"><div class="pg-title">選手レポート</div></div><p class="text-muted">選手が見つかりません</p>`;
    const d=getPlayerData(selId);
    const avg=(arr)=>(arr.reduce((a,b)=>a+b,0)/arr.length);
    const ac=avg(d.cond).toFixed(1),ak=Math.round(avg(d.kcal)),as=avg(d.sleep).toFixed(1);
    const cc=ac>=8?'var(--grn)':ac>=6?'#f59e0b':'#ef4444';
    contentHTML=`
      <div class="section-card" style="margin-bottom:16px">
        <div style="display:flex;align-items:center;gap:16px">
          <div style="width:56px;height:56px;background:linear-gradient(135deg,var(--org),#f59e0b);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;color:#fff">${(p.name||'?')[0]}</div>
          <div style="flex:1">
            <div style="font-size:18px;font-weight:700;color:var(--txt1)">${p.name}</div>
            <div style="font-size:13px;color:var(--txt3)">${p.pos} · ${p.age}歳 · ${p.weight}kg / ${p.height}cm · ${t?t.name:''}</div>
          </div>
          <span style="font-size:13px;padding:5px 14px;border-radius:20px;background:${cc}22;color:${cc};font-weight:600">今週 ${ac>=8?'好調':ac>=6?'普通':'要注意'}</span>
        </div>
      </div>
      <div class="stat-row" style="grid-template-columns:repeat(4,1fr);margin-bottom:16px">
        <div class="stat-box"><div style="font-size:11px;color:var(--txt3);mb:4px">平均コンディション</div><div style="font-size:22px;font-weight:700;color:${cc};margin-top:4px">${ac}<span style="font-size:12px">/10</span></div></div>
        <div class="stat-box"><div style="font-size:11px;color:var(--txt3)">平均摂取kcal</div><div style="font-size:22px;font-weight:700;color:var(--blue);margin-top:4px">${ak}<span style="font-size:12px">kcal</span></div></div>
        <div class="stat-box"><div style="font-size:11px;color:var(--txt3)">平均睡眠時間</div><div style="font-size:22px;font-weight:700;color:var(--grn);margin-top:4px">${as}<span style="font-size:12px">h</span></div></div>
        <div class="stat-box"><div style="font-size:11px;color:var(--txt3)">練習取組み</div><div style="font-size:22px;font-weight:700;color:var(--org);margin-top:4px">${d.training}</div></div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px">
        ${[{label:'コンディション推移',data:d.cond,color:'var(--grn)',max:10},{label:'摂取カロリー (×100kcal)',data:d.kcal.map(v=>Math.round(v/100)),color:'var(--blue)',max:30},{label:'睡眠時間 (h)',data:d.sleep,color:'#a855f7',max:10}].map(g=>`
          <div class="section-card">
            <div style="font-size:12px;font-weight:600;color:var(--txt2);margin-bottom:10px">${g.label}</div>
            <div style="display:flex;align-items:flex-end;gap:3px;height:70px">
              ${g.data.map((v,i)=>`<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px">
                <div style="font-size:8px;color:var(--txt3)">${v}</div>
                <div style="width:100%;background:${g.color};border-radius:3px 3px 0 0;height:${Math.round(v/g.max*62)}px;opacity:.8"></div>
                <span style="font-size:8px;color:var(--txt3)">${days[i]}</span>
              </div>`).join('')}
            </div>
          </div>`).join('')}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
        <div class="section-card">
          <span class="section-card-title">📈 コンディション・kcal推移</span>
          <div style="height:150px"><canvas id="coach-report-cond-chart"></canvas></div>
        </div>
        <div class="section-card">
          <span class="section-card-title">📐 体重推移</span>
          <div style="height:150px"><canvas id="coach-report-body-chart"></canvas></div>
        </div>
      </div>
      ${p.goals?.short||p.goals?.long?`<div class="section-card" style="margin-bottom:12px">
        <span class="section-card-title">🎯 目標・達成状況</span>
        <div style="display:grid;gap:10px;margin-top:8px">
          ${p.goals.short?`<div><div class="flex justify-between mb-4 text-xs"><span class="fw7">短期: ${sanitize(p.goals.short,40)}</span><span class="fw7" style="color:var(--org)">${p.goalProgress?.short||0}%</span></div><div style="height:8px;background:var(--surf2);border-radius:4px"><div style="width:${p.goalProgress?.short||0}%;height:100%;background:var(--org);border-radius:4px"></div></div></div>`:''}
          ${p.goals.long?`<div><div class="flex justify-between mb-4 text-xs"><span class="fw7">長期: ${sanitize(p.goals.long,40)}</span><span class="fw7" style="color:var(--blue)">${p.goalProgress?.long||0}%</span></div><div style="height:8px;background:var(--surf2);border-radius:4px"><div style="width:${p.goalProgress?.long||0}%;height:100%;background:var(--blue);border-radius:4px"></div></div></div>`:''}
        </div>
        <button class="btn btn-ghost btn-xs mt-10" onclick="openPlayerGoals('${selId}')">🎯 目標を編集</button>
      </div>`:''}
      <div class="section-card">
        <span class="section-card-title">📝 コーチメモ・指導記録</span>
        <div style="background:var(--surf2);border-radius:8px;padding:12px;margin:10px 0;font-size:13px;color:var(--txt2);line-height:1.6;min-height:60px">${d.memo||p.coachComment||'（コメントなし）'}</div>
        ${(()=>{const hist=DB.players.find(x=>x.id===selId)?.commentHistory||[];return hist.length?`<div style="border-top:1px solid var(--bdr);padding-top:10px;margin-bottom:8px"><div class="text-xs text-muted mb-6">💬 履歴（直近3件）</div>${hist.slice(-3).reverse().map(c=>`<div style="padding:6px 10px;background:var(--surf2);border-radius:6px;margin-bottom:4px;border-left:2px solid var(--teal)"><div class="text-xs fw7" style="color:var(--teal)">${c.date||''} ${c.eval||''}</div><div class="text-xs text-muted mt-1">${sanitize(c.text||'',80)}</div></div>`).join('')}</div>`:'';})()}
        <button class="btn btn-ghost btn-sm" onclick="showPlayerCoachComment('${selId}')">✏️ コメントを追加・編集</button>
      </div>`;
  }
  return`<div class="pg-head"><div class="pg-title">選手レポート</div><div class="pg-sub">${t?t.name:''} · 今週のデータ</div>
    <button class="btn btn-ghost btn-sm" onclick="goTo('coach-players')">← 選手一覧</button>
    <button class="btn btn-secondary btn-sm" onclick="exportReportPDF(selId)"><i class="fa fa-file-pdf" style="color:#ef4444"></i> PDF出力</button>
  </div>
  ${tabHTML}${contentHTML}`;
}

// ==================== PARENT PAGES ====================
function parentDash(){
  const child = DB.players.find(p=>p.guardianId===(DB.currentUser?.id)) || DB.players.find(p=>p.guardian===(DB.currentUser?.name));
  if(!child) {
  // 保護者のチームID取得（pendingTeamIdまたはusersテーブル）
  const _parentTeamId = DB.pendingParentTeamId || DB.pendingTeamId || (function(){var us=_getUsers();var gu=us.find(function(x){return x.id===DB.currentUser?.id;});return gu?.linkedTeamId||null;})();
  const _parentTeam = _parentTeamId ? DB.teams.find(function(t){return t.id===_parentTeamId;}) : null;
  // 該当チームの未紐づけ選手のみ表示（チーム不明の場合は全未紐づけ選手）
  const _unlinkedPlayers = _parentTeamId
    ? DB.players.filter(function(p){return p.team===_parentTeamId && !p.guardianId;})
    : DB.players.filter(function(p){return !p.guardianId && p.team;});

  return `<div class="pg-head"><div class="pg-title">保護者ダッシュボード</div></div>
  <div class="dash-section text-center" style="padding:48px">
    <div style="font-size:48px;margin-bottom:16px">👨‍👩‍👧</div>
    <div class="fw7 mb-8" style="font-size:16px">お子様との紐づけ</div>
    <div class="text-sm text-muted" style="margin-bottom:20px;line-height:1.8">
      ${_parentTeam ? 'チーム: <b>'+sanitize(_parentTeam.name,20)+'</b><br>' : ''}
      お子様のアカウントと紐づけを行うと、月謝の確認・支払いができるようになります。
    </div>
    <div style="background:var(--surf2);border-radius:12px;padding:20px;max-width:400px;margin:0 auto;text-align:left">
      <div style="font-size:14px;font-weight:700;margin-bottom:12px">🔗 お子様と紐づける</div>
      <div class="form-group" style="margin-bottom:10px">
        <label class="label">お子様の選手名</label>
        <select id="parent-link-player" class="input">
          <option value="">選手を選択...</option>
          ${_unlinkedPlayers.map(function(p){var t=DB.teams.find(function(x){return x.id===p.team;});return '<option value="'+p.id+'">'+sanitize(p.name,20)+' ('+(t?sanitize(t.name,15):'')+')</option>';}).join('')}
        </select>
      </div>
      ${_unlinkedPlayers.length===0 ? '<div style="padding:12px;background:rgba(234,179,8,.08);border:1px solid rgba(234,179,8,.25);border-radius:8px;margin-bottom:10px;font-size:12px;color:var(--txt2);line-height:1.6">紐づけ可能な選手がいません。お子様に先に選手として登録してもらうか、チーム管理者に選手追加を依頼してください。</div>' : ''}
      <div class="form-group" style="margin-bottom:12px">
        <label class="label">チーム招待コード</label>
        <input id="parent-link-code" class="input" placeholder="例: T100001" style="text-transform:uppercase;letter-spacing:2px;font-weight:700" maxlength="10"${_parentTeam ? ' value="'+(_parentTeam.code||'')+'"' : ''}>
      </div>
      <button class="btn btn-primary w-full" onclick="parentLinkChild()">🔗 紐づける</button>
      <div style="font-size:10px;color:var(--txt3);margin-top:6px;text-align:center">招待コードはチーム管理者にお問い合わせください</div>
    </div>
    <div style="margin-top:16px;padding:12px;background:rgba(168,85,247,.04);border:1px solid rgba(168,85,247,.15);border-radius:10px;max-width:400px;margin-left:auto;margin-right:auto">
      <div style="font-size:12px;color:var(--txt3)">または、チーム管理者に「マイチーム」→選手の「編集」から紐づけを依頼することもできます</div>
    </div>
  </div>`;
  }
  const team = DB.teams.find(t=>t.id===child.team);
  const guardian = _getUsers().find(u=>u.id===DB.currentUser?.id);
  const myPayments = _dbArr('payments').filter(p=>p.player===child.id);
  const unpaid = myPayments.filter(p=>p.status==='unpaid');
  const paid = myPayments.filter(p=>p.status==='paid');
  const adhocU = (DB.adhocInvoices||[]).filter(i=>(i.playerId===child.id||i.guardianId===DB.currentUser?.id)&&i.status==='unpaid');
  const totalUnpaid = unpaid.reduce((s,p)=>s+p.amount,0) + adhocU.reduce((s,i)=>s+i.total,0);
  const h=new Date().getHours();
  const greetText=h<12?'おはようございます':h<18?'こんにちは':'お疲れさまです';

  return`
  <div class="dash-greeting" style="background:linear-gradient(135deg,#7c3aed 0%,#a855f7 100%)">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">
      <div>
        <div class="dash-greeting-sub">${greetText}</div>
        <div class="dash-greeting-name">${sanitize(DB.currentUser?.name||'保護者',14)} さん</div>
        <div class="dash-greeting-sub" style="margin-top:4px">${child.name} の保護者 ${team?' · '+team.name:''}</div>
      </div>
    </div>
  </div>

  ${!guardian?.paymentSetup?`<div class="dash-alert dash-alert-warn" onclick="goTo('parent-fee')" style="cursor:pointer">
    <i class="fa fa-credit-card"></i>
    <span><b>月謝管理の初期設定が未完了です</b><br><span style="font-size:11px;font-weight:400">クレカ登録を完了すると、${sanitize(child.name,8)}の全機能が有効になります</span></span>
    <button class="btn btn-primary btn-sm" style="margin-left:auto;flex-shrink:0" onclick="event.stopPropagation();goTo('parent-fee')">登録する</button>
  </div>`:''}

  ${totalUnpaid>0?`<div class="dash-alert dash-alert-error" onclick="goTo('parent-fee')" style="cursor:pointer">
    <i class="fa fa-exclamation-circle"></i>
    <span><b>¥${totalUnpaid.toLocaleString()}</b> の未払いがあります${unpaid.length?'（月謝'+unpaid.length+'件）':''}${adhocU.length?'（請求'+adhocU.length+'件）':''}</span>
    <button class="btn btn-primary btn-sm" style="margin-left:auto;flex-shrink:0" onclick="event.stopPropagation();goTo('parent-fee')">支払う</button>
  </div>`:`<div class="dash-alert" style="background:rgba(34,197,94,.06);border:1px solid rgba(34,197,94,.2)">
    <i class="fa fa-check-circle" style="color:var(--grn)"></i>
    <span style="color:var(--grn);font-weight:600">未払いはありません</span>
  </div>`}

  <div class="hero-kpi">
    <div class="hero-kpi-card" style="border-left:3px solid ${unpaid.length>0?'#ef4444':'var(--grn)'}">
      <div class="kpi-icon" style="background:${unpaid.length>0?'rgba(239,68,68,.1)':'rgba(34,197,94,.1)'}">💴</div>
      <div class="kpi-value" style="color:${unpaid.length>0?'#ef4444':'var(--grn)'}">${unpaid.length>0?unpaid.length+'件':'✓'}</div>
      <div class="kpi-label">未払い月謝</div>
    </div>
    <div class="hero-kpi-card" style="border-left:3px solid var(--grn)">
      <div class="kpi-icon" style="background:rgba(34,197,94,.1)">✅</div>
      <div class="kpi-value">${paid.length}<span style="font-size:14px;color:var(--txt3)"> 件</span></div>
      <div class="kpi-label">支払済み</div>
    </div>
    <div class="hero-kpi-card" style="border-left:3px solid #a855f7">
      <div class="kpi-icon" style="background:rgba(168,85,247,.1)">🧾</div>
      <div class="kpi-value">${adhocU.length}<span style="font-size:14px;color:var(--txt3)"> 件</span></div>
      <div class="kpi-label">都度請求</div>
    </div>
  </div>

  <!-- お子様 & チーム情報 -->
  <div class="dash-section">
    <div class="dash-section-head"><span class="dash-section-title">👦 お子様情報</span></div>
    <div class="mini-profile">
      <div style="width:48px;height:48px;background:linear-gradient(135deg,var(--org),#f59e0b);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:#fff;flex-shrink:0">${(child.name||'?')[0]}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:15px;font-weight:700">${child.name}</div>
        <div style="font-size:12px;color:var(--txt3);margin-top:2px">${child.pos||'--'} · ${child.age||'--'}歳 · ${team?team.name:'未所属'}</div>
        ${team?`<div style="font-size:12px;color:var(--txt3);margin-top:2px">月謝: ¥${fmtNum(team.fee||0)}/月</div>`:''}
      </div>
    </div>
  </div>

  <!-- 直近の支払い履歴 -->
  ${myPayments.length>0?`<div class="dash-section">
    <div class="dash-section-head">
      <span class="dash-section-title">💳 直近の支払い</span>
      <button class="btn btn-ghost btn-xs" onclick="goTo('parent-fee')">すべて見る →</button>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px">
      ${myPayments.slice(-5).reverse().map(p=>`
        <div style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:var(--surf2);border-radius:10px;border-left:3px solid ${p.status==='paid'?'var(--grn)':'#ef4444'}">
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:600">${p.month||'--'}</div>
            <div style="font-size:11px;color:var(--txt3)">${p.paidDate||'未払い'}</div>
          </div>
          <div style="font-size:15px;font-weight:700">¥${fmtNum(p.amount)}</div>
          <span style="font-size:11px;padding:3px 10px;border-radius:20px;background:${p.status==='paid'?'rgba(34,197,94,.12)':p.status==='overdue'?'rgba(239,68,68,.2)':'rgba(239,68,68,.12)'};color:${p.status==='paid'?'var(--grn)':'#ef4444'};font-weight:600">${p.status==='paid'?'済':p.status==='overdue'?'延滞':'未払'}</span>
          ${p.status!=='paid'?`<button class="btn btn-primary btn-xs" onclick="event.stopPropagation();payMonthlyFee('${p.id}')" style="margin-left:4px">💳 支払う</button>`:``}
        </div>`).join('')}
    </div>
    ${unpaid.length>0?`<button class="btn btn-primary w-full" style="margin-top:14px" onclick="goTo('parent-fee')">💳 支払いページへ (¥${unpaid.reduce((s,p)=>s+p.amount,0).toLocaleString()})</button>`:''}</div>
  `:''}`
;
}

function parentFeePage(){
  _autoGenerateMonthlyFees();
  const child = DB.players.find(p=>p.guardianId===(DB.currentUser?.id)) || DB.players.find(p=>p.guardian===(DB.currentUser?.name));
  if(!child) return `<div class="pg-head"><div class="pg-title">月謝・支払い</div></div><div class="card text-center" style="padding:48px"><div style="font-size:48px">👶</div><div class="fw7 mt-16">お子様との紐づけがまだです</div><div class="text-sm text-muted" style="margin-top:8px">チーム管理者にお子様のアカウントとの紐づけを依頼してください。</div></div>`;
  const team = DB.teams.find(t=>t.id===child.team);
  const guardian = _getUsers().find(u=>u.id===DB.currentUser?.id);
  const paymentSetup = guardian?.paymentSetup;

  // クレカ未登録の場合: セットアップ画面を表示
  if(!paymentSetup){
    return `<div class="pg-head"><div class="pg-title">月謝・支払い</div><div class="pg-sub">${child.name} / ${team?team.name:''}</div></div>
    <div class="card" style="padding:32px;text-align:center">
      <div style="font-size:48px;margin-bottom:16px">💳</div>
      <div style="font-size:18px;font-weight:800;margin-bottom:8px">月謝管理の初期設定</div>
      <div style="font-size:13px;color:var(--txt3);line-height:1.7;margin-bottom:24px">
        クレジットカードを登録すると、月謝の支払い管理が開始されます。<br>
        登録が完了すると、<b>${sanitize(child.name,10)}</b>さんの全機能が有効になります。
      </div>
      <div style="background:var(--surf2);border-radius:12px;padding:20px;margin-bottom:20px;text-align:left">
        <div style="font-size:13px;font-weight:700;margin-bottom:12px">💰 お支払い情報</div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--b1);font-size:13px">
          <span style="color:var(--txt3)">月謝</span><b>¥${fmtNum(team?.fee||0)}/月</b>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--b1);font-size:13px">
          <span style="color:var(--txt3)">チーム</span><b>${sanitize(team?.name||'',20)}</b>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:13px">
          <span style="color:var(--txt3)">選手</span><b>${sanitize(child.name,20)}</b>
        </div>
      </div>
      <div style="background:rgba(59,130,246,.04);border:1px solid rgba(59,130,246,.15);border-radius:12px;padding:16px;margin-bottom:20px;text-align:left">
        <div style="font-size:12px;font-weight:700;color:var(--blue);margin-bottom:8px">🔒 カード情報入力</div>
        <div style="display:grid;gap:10px">
          <input class="input" placeholder="カード番号（例: 4242 4242 4242 4242）" style="font-size:14px;letter-spacing:1px">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <input class="input" placeholder="有効期限（MM/YY）">
            <input class="input" placeholder="CVC">
          </div>
        </div>
        <div style="font-size:10px;color:var(--txt3);margin-top:8px">🔐 カード情報はStripeで安全に処理されます（本番環境で有効）</div>
      </div>
      <button class="btn btn-primary w-full" style="font-size:15px;padding:14px" onclick="completePaymentSetup()">
        💳 カードを登録して月謝管理を開始する
      </button>
      <div style="font-size:11px;color:var(--txt3);margin-top:10px">登録後、お子様の全機能が有効になります</div>
    </div>`;
  }

  const myPayments = _dbArr('payments').filter(p=>p.player===child.id);
  const totalPaid = myPayments.filter(p=>p.status==='paid').reduce((s,p)=>s+p.amount,0);
  const unpaid = myPayments.filter(p=>p.status==='unpaid'||p.status==='overdue');
  const monthlyFee = team?.fee||5000;

  // 今年の月別支払い状況
  const year = new Date().getFullYear();
  const months = Array.from({length:12},(_,i)=>(`${year}-${String(i+1).padStart(2,'0')}`));

  return`<div class="pg-head flex justify-between items-center">
    <div><div class="pg-title">月謝・支払い</div><div class="pg-sub">${child.name} / ${team?team.name:''}</div></div>
  </div>

  <!-- KPIカード -->
  ${(()=>{const adhocU=(!DB.adhocInvoices?[]:DB.adhocInvoices).filter(i=>(i.playerId===child.id||i.guardianId===DB.currentUser?.id)&&i.status==='unpaid');const adhocAmt=adhocU.reduce((s,i)=>s+i.total,0);const allUnpaidAmt=(unpaid.length?unpaid.reduce((s,p)=>s+p.amount,0):0)+adhocAmt;const hasUnpaid=unpaid.length>0||adhocU.length>0;return `
  <div class="stat-row" style="grid-template-columns:repeat(3,1fr);margin-bottom:${hasUnpaid?'12px':'20px'}">
    <div class="stat-box">
      <div style="font-size:11px;color:var(--txt3);margin-bottom:6px">今年の支払い合計</div>
      <div style="font-size:24px;font-weight:800;color:var(--txt1)">¥${totalPaid.toLocaleString()}</div>
    </div>
    <div class="stat-box">
      <div style="font-size:11px;color:var(--txt3);margin-bottom:6px">月謝</div>
      <div style="font-size:24px;font-weight:800;color:var(--txt1)">¥${fmtNum(monthlyFee)}<span style="font-size:13px;color:var(--txt3)">/月</span></div>
    </div>
    <div class="stat-box" style="border-left:3px solid ${hasUnpaid?'#ef4444':'var(--grn)'}">
      <div style="font-size:11px;color:var(--txt3);margin-bottom:6px">未払い</div>
      <div style="font-size:24px;font-weight:800;color:${hasUnpaid?'#ef4444':'var(--grn)'}">
        ${hasUnpaid?`¥${fmtNum(allUnpaidAmt)}`:'✓ なし'}
      </div>
      ${adhocU.length?`<div style="font-size:10px;color:var(--txt3);margin-top:2px">都度請求${adhocU.length}件含む</div>`:''}
    </div>
  </div>`;})()}

  ${unpaid.length>0?`
  <div style="background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.25);border-radius:14px;padding:16px;margin-bottom:20px">
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
      <div>
        <div style="font-size:14px;font-weight:700;color:#ef4444;margin-bottom:4px">⚠️ 未払いの月謝があります</div>
        <div style="font-size:12px;color:var(--txt2)">${unpaid.map(p=>p.month+'分 ¥'+fmtNum(p.amount)).join(' / ')}</div>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-primary" style="background:#ef4444;border-color:#ef4444"
          onclick="payMonthlyFee('${unpaid[0].id}')">
          💳 今すぐ支払う（¥${fmtNum(unpaid[0].amount)}）
        </button>
        ${unpaid.length>1?`<button class="btn btn-secondary"
          onclick="payAllUnpaid()">
          📦 まとめて支払う（${unpaid.length}件）
        </button>`:''}
      </div>
      <div style="margin-top:10px">
        ${!_dbArr('payments').find(p=>p.player===child.id&&p.subscription)?
          `<button class="btn btn-ghost btn-sm" style="color:#0ea5e9;border-color:#0ea5e9" onclick="enableSubscription('${child.id}')">💳 定期課金に登録（毎月自動引落し）</button>`:
          `<span class="badge b-teal" style="font-size:11px">✅ 定期課金登録済み（毎月自動引落し）</span>`
        }
      </div>
        ${unpaid.length>1?`<button class="btn btn-ghost" style="color:#ef4444;border-color:rgba(239,68,68,.3)"
          onclick="payAllUnpaid()">
          📋 ${unpaid.length}件一括（¥${fmtNum(unpaid.reduce((s,p)=>s+p.amount,0))}）
        </button>`:``}
      </div>
    </div>
  </div>`:``}

  <!-- 年間カレンダー（月別支払い状況） -->
  <div class="card" style="margin-bottom:20px">
    <div class="fw7 mb-14" style="font-size:14px">📅 ${year}年 月謝カレンダー</div>
    <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px">
      ${months.map(m=>{
        const pay = myPayments.find(p=>p.month===m);
        const isPaid = pay?.status==='paid';
        const isUnpaid = pay&&pay.status!=='paid';
        const isFuture = m > curMonth();
        return `<div style="text-align:center;padding:10px 4px;border-radius:10px;background:${isPaid?'rgba(34,197,94,.12)':isUnpaid?'rgba(239,68,68,.1)':isFuture?'var(--surf2)':'var(--surf2)'};border:1px solid ${isPaid?'rgba(34,197,94,.3)':isUnpaid?'rgba(239,68,68,.3)':'var(--b1)'}">
          <div style="font-size:18px;margin-bottom:2px">${isPaid?'✅':isUnpaid?'❌':isFuture?'📅':'➖'}</div>
          <div style="font-size:11px;font-weight:600;color:${isPaid?'var(--grn)':isUnpaid?'#ef4444':'var(--txt3)'}">${m.slice(5)}月</div>
          <div style="font-size:9px;color:var(--txt3)">${isPaid?'支払済':isUnpaid?'未払い':isFuture?'予定':'-'}</div>
          ${isUnpaid&&pay?`<button onclick="payMonthlyFee('${pay.id}')" style="margin-top:3px;padding:2px 6px;border-radius:4px;background:#ef4444;color:#fff;border:none;font-size:8px;font-weight:700;cursor:pointer">支払う</button>`:``}
        </div>`;
      }).join('')}
    </div>
  </div>

  <!-- 支払い履歴 -->
  <div class="card">
    <div class="fw7 mb-12" style="font-size:14px">📋 支払い履歴</div>

    ${/* 都度請求（未払い） */(()=>{
      if(!DB.adhocInvoices)DB.adhocInvoices=[];
      const myAdhocs=_dbArr('adhocInvoices').filter(i=>(i.playerId===child.id||i.guardianId===DB.currentUser?.id));
      const unpaidAdhocs=myAdhocs.filter(i=>i.status==='unpaid');
      const paidAdhocs=myAdhocs.filter(i=>i.status==='paid');
      let html='';
      if(unpaidAdhocs.length){
        html+=unpaidAdhocs.map(inv=>`
          <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--b1)">
            <div style="display:flex;align-items:center;gap:12px">
              <div style="width:36px;height:36px;border-radius:10px;background:rgba(249,115,22,.15);display:flex;align-items:center;justify-content:center;font-size:16px">🧾</div>
              <div>
                <div style="font-size:13px;font-weight:600">${sanitize(inv.title,30)}</div>
                <div style="font-size:11px;color:var(--txt3)">${inv.teamName||''} · 都度請求</div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:10px">
              <div style="text-align:right">
                <div style="font-size:15px;font-weight:800;color:var(--org)">¥${fmtNum(inv.total)}</div>
                <span style="font-size:9px;color:var(--txt3)">内手数料¥${fmtNum(inv.fee)}</span>
              </div>
              <button class="btn btn-primary btn-xs" onclick="payAdhocInvoice('${inv.id}')">💳 支払う</button>
            </div>
          </div>`).join('');
      }
      if(paidAdhocs.length){
        html+=paidAdhocs.slice().reverse().map(inv=>`
          <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--b1)">
            <div style="display:flex;align-items:center;gap:12px">
              <div style="width:36px;height:36px;border-radius:10px;background:rgba(34,197,94,.15);display:flex;align-items:center;justify-content:center;font-size:16px">✅</div>
              <div>
                <div style="font-size:13px;font-weight:600">${sanitize(inv.title,30)}</div>
                <div style="font-size:11px;color:var(--txt3)">${inv.teamName||''} · 都度請求 · ${(inv.paidAt||'').slice(0,10)}</div>
              </div>
            </div>
            <div style="text-align:right">
              <div style="font-size:15px;font-weight:800">¥${fmtNum(inv.total)}</div>
              <span style="font-size:10px;padding:2px 8px;border-radius:20px;background:rgba(34,197,94,.15);color:var(--grn)">支払済</span>
            </div>
          </div>`).join('');
      }
      return html;
    })()}
    ${myPayments.length ? myPayments.slice().reverse().map(p=>`
      <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--b1)">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:36px;height:36px;border-radius:10px;background:${p.status==='paid'?'rgba(34,197,94,.15)':'rgba(239,68,68,.15)'};display:flex;align-items:center;justify-content:center;font-size:16px">
            ${p.status==='paid'?'✅':'❌'}
          </div>
          <div>
            <div style="font-size:13px;font-weight:600">${p.month}分 月謝</div>
            <div style="font-size:11px;color:var(--txt3)">${p.at?p.at+' 支払い完了':'未払い'}</div>
          </div>
        </div>
        <div style="text-align:right">
          <div style="font-size:15px;font-weight:800">¥${fmtNum(p.amount)}</div>
          <span style="font-size:10px;padding:2px 8px;border-radius:20px;background:${p.status==='paid'?'rgba(34,197,94,.15)':'rgba(239,68,68,.15)'};color:${p.status==='paid'?'var(--grn)':'#ef4444'}">
            ${p.status==='paid'?'支払済':'未払い'}
          </span>
        </div>
      </div>`).join('')
    :`<div style="text-align:center;padding:24px;color:var(--txt3)"><div style="font-size:28px;margin-bottom:8px">📋</div><div class="text-sm">まだ支払い履歴がありません</div></div>`}
  </div>`;
}


function parentReportPage(){
  const child = DB.players.find(p=>p.guardianId===(DB.currentUser?.id)) || DB.players.find(p=>p.guardian===(DB.currentUser?.name)) ;
  if(!child) return `<div class="pg-head"><div class="pg-title">子供の成績・レポート</div></div><div class="card text-center" style="padding:48px"><div style="font-size:48px">👶</div><div class="fw7 mt-16">お子様の情報が未登録です</div><button class="btn btn-primary mt-16" onclick="goTo('profile')">設定する</button></div>`;
  const team = DB.teams.find(t=>t.id===child.team);
  const coach = DB.coaches.find(c=>c.id===team?.coach);
  const log = DB.trainingLog[child.id]||{};
  const logEntries = Object.values(log).filter(e=>e&&e.date).sort((a,b)=>a.date>b.date?1:-1);
  const thisM = curMonth();
  const _mLogs = logEntries.filter(e=>e.date&&e.date.startsWith(thisM));
  const avgCond = _mLogs.length ? Math.round(_mLogs.reduce((s,e)=>s+(e.cond||0),0)/_mLogs.length*10)/10 : 0;
  const totalKcal = _mLogs.reduce((s,e)=>s+(e.kcal||0),0);
  const latestLog = logEntries[logEntries.length-1];
  const latestComment = child.coachComments?.slice(-1)[0];
  const streak=(()=>{let s=0,d=new Date();while(true){const k=d.toISOString().slice(0,10);if(log[k]){s++;d.setDate(d.getDate()-1);}else break;}return s;})();

  // 過去7日間のコンディション
  const last7days = Array.from({length:7},(_,i)=>{
    const d=new Date(); d.setDate(d.getDate()-6+i);
    return d.toISOString().slice(0,10);
  });

  const condStatus = avgCond>=4?{label:'好調',color:'var(--grn)',icon:'😄'}:avgCond>=3?{label:'普通',color:'var(--yel)',icon:'😊'}:avgCond>=1?{label:'注意',color:'var(--org)',icon:'😐'}:{label:'未記録',color:'var(--txt3)',icon:'😶'};

  return`<div class="pg-head flex justify-between items-center">
    <div><div class="pg-title">子供の成績・レポート</div><div class="pg-sub">${child.name} / ${team?team.name:''}</div></div>
    <button class="btn btn-ghost btn-sm" onclick="goTo('parent-fee')">💴 月謝確認</button>
  </div>

  <!-- 選手プロフィール -->
  <div class="card" style="margin-bottom:16px;padding:16px">
    <div style="display:flex;align-items:center;gap:16px">
      <div style="width:60px;height:60px;background:linear-gradient(135deg,var(--org),#f59e0b);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;color:#fff;flex-shrink:0">${(child.name||'?')[0]}</div>
      <div style="flex:1">
        <div style="font-size:18px;font-weight:800">${child.name}</div>
        <div style="font-size:12px;color:var(--txt3)">${child.pos||child.position||''} · ${child.age||''}歳 · ${child.weight||''}kg / ${child.height||''}cm</div>
        <div style="font-size:12px;color:var(--txt3);margin-top:2px">${team?'🏆 '+team.name:'チーム未所属'} ${coach?'· 👨‍🏫 '+coach.name:''}</div>
      </div>
      <div style="text-align:center">
        <div style="font-size:28px">${condStatus.icon}</div>
        <div style="font-size:11px;font-weight:700;color:${condStatus.color}">${condStatus.label}</div>
      </div>
    </div>
  </div>

  <!-- 今月のKPI -->
  <div class="stat-row" style="grid-template-columns:repeat(4,1fr);margin-bottom:20px">
    <div class="stat-box"><div class="stat-ico">🏋️</div><div class="stat-n">${_mLogs.length}</div><div class="stat-l">今月の練習回数</div></div>
    <div class="stat-box"><div class="stat-ico">⭐</div><div class="stat-n">${avgCond||'--'}</div><div class="stat-l">平均コンディション</div></div>
    <div class="stat-box"><div class="stat-ico">🔥</div><div class="stat-n">${totalKcal.toLocaleString()}</div><div class="stat-l">今月消費kcal</div></div>
    <div class="stat-box" style="${streak>=3?'border-left:3px solid var(--org)':''}"><div class="stat-ico">${streak>=5?'🔥':'📅'}</div><div class="stat-n" style="${streak>=3?'color:var(--org)':''}">${streak}</div><div class="stat-l">連続記録日数</div></div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px">
    <!-- 過去7日コンディション -->
    <div class="card">
      <div class="fw7 mb-12" style="font-size:14px">📈 直近7日のコンディション</div>
      <div style="display:flex;gap:6px;align-items:flex-end;height:100px">
        ${last7days.map(dk=>{
          const entry = log[dk];
          const cond = entry?.cond||0;
          const h = Math.round((cond/5)*100);
          const isToday = dk===new Date().toISOString().slice(0,10);
          const dayNames=['日','月','火','水','木','金','土'];
          return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px">
            <div style="font-size:10px;color:${isToday?'var(--org)':'var(--txt3)'};font-weight:${isToday?'700':'400'}">${cond||''}</div>
            <div style="width:100%;border-radius:3px 3px 0 0;background:${isToday?'var(--org)':'var(--teal)'};height:${h}%;min-height:${cond>0?4:2}px;opacity:${isToday?1:.7}"></div>
            <div style="font-size:9px;color:var(--txt3)">${dayNames[new Date(dk+'T12:00').getDay()]}</div>
          </div>`;
        }).join('')}
      </div>
    </div>

    <!-- コーチからのコメント -->
    <div class="card">
      <div class="fw7 mb-12" style="font-size:14px">💬 コーチからのコメント</div>
      ${child.coachComments?.length ? child.coachComments.slice(-3).reverse().map(c=>`
        <div style="padding:10px 12px;background:rgba(249,115,22,.06);border-radius:10px;border-left:3px solid var(--org);margin-bottom:8px">
          <div style="font-size:12px;line-height:1.6">${sanitize(c.comment||'',150)}</div>
          <div style="font-size:10px;color:var(--txt3);margin-top:4px">${c.date||''}</div>
        </div>`).join('')
      :`<div style="text-align:center;padding:20px;color:var(--txt3)"><div style="font-size:28px;margin-bottom:8px">💬</div><div style="font-size:12px">コーチからのコメント待ちです</div></div>`}
    </div>
  </div>

  <!-- 最近のトレーニング履歴 -->
  <div class="card" style="margin-bottom:20px">
    <div class="fw7 mb-12" style="font-size:14px">📅 最近のトレーニング記録</div>
    ${logEntries.length ? logEntries.slice(-8).reverse().map(e=>`
      <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--b1)">
        <div style="width:50px;font-size:10px;color:var(--txt3);flex-shrink:0">${(e.date||'').slice(5)}</div>
        <div style="flex:1">
          <div style="font-size:13px;font-weight:600">${sanitize(e.memo||e.type||'練習',30)}</div>
          <div style="font-size:11px;color:var(--txt3)">${e.duration||e.time||0}分 · ${e.kcal||0}kcal</div>
        </div>
        <div style="display:flex;gap:1px;font-size:12px">${'⭐'.repeat(Math.min(e.cond||0,5))}</div>
      </div>`).join('')
    :`<div style="text-align:center;padding:24px;color:var(--txt3)"><div style="font-size:28px;margin-bottom:8px">📅</div><div style="font-size:12px">まだ記録がありません</div></div>`}
  </div>

  <!-- PBデータ -->
  ${Object.keys(child.pbs||{}).length?`<div class="card">
    <div class="fw7 mb-12" style="font-size:14px">🏆 パーソナルベスト記録</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
      ${Object.entries(child.pbs||{}).map(([item,val])=>`
        <div style="text-align:center;padding:12px;background:var(--surf2);border-radius:10px">
          <div style="font-size:11px;color:var(--txt3);margin-bottom:4px">${sanitize(item,16)}</div>
          <div style="font-size:18px;font-weight:800;color:var(--org)">${sanitize(String(val),12)}</div>
        </div>`).join('')}
    </div>
  </div>`:''}`;
}


function coachAddForm(){return`<div class="grid-2">
  <div class="form-group"><label class="label">氏名</label><input id="ca-name" class="input" placeholder="氏名"></div>
  <div class="form-group"><label class="label">種目</label><input id="ca-sport" class="input" placeholder="サッカー"></div>
  <div class="form-group"><label class="label">専門分野</label><input id="ca-spec" class="input" placeholder="DF/MF"></div>
  <div class="form-group"><label class="label">地域</label><input id="ca-area" class="input" placeholder="東京都"></div>
  <div class="form-group"><label class="label">月額（¥）</label><input id="ca-price" class="input" type="number" placeholder="30000" min="0" max="9999999"></div>
  <div class="form-group"><label class="label">指導歴（年）</label><input id="ca-exp" class="input" type="number" placeholder="10" min="0" max="60"></div>
  </div>
  <div class="form-group"><label class="label">メール</label><input id="ca-email" class="input" type="email" placeholder="コーチのメールアドレス"></div>
  <button class="btn btn-primary w-full mt-4" onclick="addCoachToDB()">✓ 追加する</button>`}

function addCoachToDB(){
  const name  = document.getElementById('ca-name')?.value.trim();
  const sport = document.getElementById('ca-sport')?.value.trim()||'';
  const spec  = document.getElementById('ca-spec')?.value.trim()||'';
  const area  = document.getElementById('ca-area')?.value.trim()||'';
  const price = parseInt(document.getElementById('ca-price')?.value)||0;
  const exp   = parseInt(document.getElementById('ca-exp')?.value)||0;
  const email = document.getElementById('ca-email')?.value.trim()||'';
  if(!name){ toast('氏名を入力してください','e'); return; }
  if(email && !email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)){
    toast('正しいメールアドレスを入力してください','e'); return;
  }
  const safeName = sanitize(name, 50);
  const colors=['#ff6b2b','#00cfaa','#3b82f6','#f59e0b','#8b5cf6','#ec4899'];
  DB.coaches.push({
    id: genId('c'), name: safeName, sport: sanitize(sport,30), spec: sanitize(spec,50),
    area: sanitize(area,50), price, exp,
    email: sanitize(email,100), bio:'', rating:0, reviews:0, avail:true, team:null,
    verified:false, color:colors[(DB.coaches||[]).length%colors.length],
    createdAt: new Date().toLocaleString('ja-JP'),
  });
  saveDB();
  toast(name+'をコーチとして追加しました','s');
  addNotif(name+'コーチが追加されました','fa-user-plus','coaches');
  closeM();
  refreshPage();
}
function addPlayerForm(){
  const parents=_getUsers().filter(u=>u.role==='parent');
  const myTeam=getMyTeam();
  return`<div class="form-group"><label class="label">選手氏名 <span style="color:#ef4444">*</span></label><input id="ap-name" class="input" placeholder="山田 太郎" oninput="clearFieldError('ap-name')"></div>
  <div class="form-group"><label class="label">ポジション</label><input id="ap-pos" class="input" placeholder="FW"></div>
  <div class="form-group"><label class="label">👨‍👩‍👧 保護者アカウント</label>
    <select id="ap-guardian-id" class="input">
      <option value="">後で設定する</option>
      ${parents.map(u=>`<option value="${u.id}">${sanitize(u.name,25)}（${u.email||'メール未登録'}）</option>`).join('')}
    </select>
    ${parents.length>0
      ?`<div style="font-size:11px;color:var(--teal);margin-top:4px">✅ 登録済み保護者 ${parents.length}名</div>`
      :`<div style="font-size:11px;color:var(--txt3);margin-top:4px">💡 保護者に招待コード <b>${myTeam?.code||'---'}</b> で登録を依頼してください</div>`}
  </div>
  <button class="btn btn-primary w-full" onclick="addPlayerToDB()">+ 追加する</button>`
}

function addPlayerToDB(){
  // Phase1: インラインバリデーション
  var valid = validateForm([
    ['ap-name', {required: true, requiredMsg: '選手氏名を入力してください', minLength: 1}]
  ]);
  if (!valid) return;
  const nameEl    = document.getElementById('ap-name');
  const posEl     = document.getElementById('ap-pos');
  const guardIdEl = document.getElementById('ap-guardian-id');
  const name    = sanitize(nameEl?.value, 50);
  const pos     = sanitize(posEl?.value, 30);
  const guardianId = guardIdEl?.value||null;
  const team = getMyTeam();
  if(!team){ toast('チームが見つかりません','e'); return; }
  const pid = genId('p');
  const guardianUser = guardianId ? _getUsers().find(u=>u.id===guardianId) : null;
  DB.players.push({
    id: pid, name, pos, team: team.id,
    age:0, weight:0, height:0, status:'unpaid',
    guardianId: guardianId||null,
    guardian: guardianUser?.name||'',
    guardianEmail: guardianUser?.email||'',
    createdAt: new Date().toLocaleString('ja-JP'),
  });
  // 保護者のusersテーブルも更新
  if(guardianId && guardianUser){
    const users=_getUsers();
    const gu=users.find(u=>u.id===guardianId);
    if(gu){
      gu.linkedPlayerId=pid;
      if(!gu.linkedPlayers)gu.linkedPlayers=[];
      if(!gu.linkedPlayers.includes(pid))gu.linkedPlayers.push(pid);
      gu.linkedTeamId=team.id;
      _saveUsers(users);
    }
  }
  team.members=(team.members||0)+1;
  // 月謝レコード生成
  if(team.fee>0){
    _dbArr('payments').push({id:genId('pay'), player:pid, team:team.id,
      amount:team.fee, month:curMonth(), status:'unpaid', at:null, fee:getFeeAmount(team.fee,team.id,'monthlyFee')});
  }
  saveDB();
  toast(name+'を追加しました','s');
  addNotif(name+'が選手登録されました','fa-user-plus','fee');
  if(guardianUser) addNotif(`${name}の保護者: ${guardianUser.name}`,'fa-link','team');
  closeM();
  refreshPage();
}


function addEventForm(){
  return`<div style="display:grid;gap:12px">
    <div class="form-group"><label class="label">タイトル</label><input id="ev-title" class="input" placeholder="練習試合 vs ○○FC" maxlength="60"></div>
    <div class="grid-2">
      <div class="form-group"><label class="label">日付</label><input id="ev-date" class="input" type="date" value="${new Date().toISOString().slice(0,10)}"></div>
      <div class="form-group"><label class="label">時刻</label><input id="ev-time" class="input" type="time" value="18:00"></div>
    </div>
    <div class="form-group"><label class="label">種別</label>
      <select id="ev-type" class="input">
        <option value="practice">🏃 練習</option>
        <option value="match">⚽ 試合</option>
        <option value="payment">💰 支払</option>
        <option value="other">📌 その他</option>
      </select>
    </div>
    <div class="form-group"><label class="label">繰り返し</label>
      <select id="ev-repeat" class="input">
        <option value="none">繰り返しなし</option>
        <option value="weekly">毎週</option>
        <option value="monthly">毎月</option>
        <option value="daily">毎日</option>
      </select>
    </div>
    <div class="form-group"><label class="label">メモ（任意）</label><input id="ev-note" class="input" placeholder="場所・持ち物など" maxlength="100"></div>
    <button class="btn btn-primary w-full" onclick="addEventToDB()">📅 追加する</button>
  </div>`;
}

function addEventToDB(){
  const title=(document.getElementById('ev-title')?.value||'').trim();
  const dateVal=document.getElementById('ev-date')?.value||'';
  const time=document.getElementById('ev-time')?.value||'';
  const type=document.getElementById('ev-type')?.value||'practice';
  const repeat=document.getElementById('ev-repeat')?.value||'none';
  const note=(document.getElementById('ev-note')?.value||'').trim();
  if(!title||!dateVal){toast('タイトルと日付を入力してください','e');return;}
  const d=new Date(dateVal);
  const ev={
    id:genId('ev'),
    title:sanitize(title,60),
    date:d.getDate(),
    month:d.getMonth(),
    year:d.getFullYear(),
    time,type,
    repeat:repeat!=='none'?repeat:undefined,
    note:note?sanitize(note,100):undefined,
    attendees:[],
    createdAt:new Date().toISOString(),
    createdBy:DB.currentUser?.id,
    teamId: _getMyTeamId(),
    scope: DB.currentUser?.role==='team'?'team':'personal',
  };
  DB.events.push(ev);
  // 繰り返しイベントの生成（3ヶ月分）
  if(repeat!=='none'){
    for(let i=1;i<=12;i++){
      const nd=new Date(d);
      if(repeat==='weekly') nd.setDate(d.getDate()+i*7);
      else if(repeat==='monthly') nd.setMonth(d.getMonth()+i);
      else if(repeat==='daily') nd.setDate(d.getDate()+i);
      if(nd.getFullYear()-d.getFullYear()>1) break;
      DB.events.push({...ev,id:genId('ev'),date:nd.getDate(),month:nd.getMonth(),year:nd.getFullYear(),repeat:undefined,parentId:ev.id});
    }
  }
  saveDB();closeM();toast('イベントを追加しました','s');goTo('calendar');
}

function requestCoachForm(id){
  const c=DB.coaches.find(x=>x.id===id);
  if(!c){toast('コーチが見つかりません','e');return '';}
  const price=c.price||0;
  const team=getMyTeam();
  const _cfRate=getFeeRate(team?.id||'','coachFee');
  const teamFee=Math.round(price*_cfRate/100);
  const teamTax=Math.round(teamFee*0.1);
  const teamPays=price+teamFee+teamTax;
  const coachFee=Math.round(price*_cfRate/100);
  const coachReceives=price-coachFee;
  return`
  <!-- 3ステップ フロー説明 -->
  <div style="display:flex;gap:0;align-items:center;margin-bottom:20px;padding:14px 16px;background:linear-gradient(135deg,rgba(37,99,235,.05),rgba(0,207,170,.04));border:1px solid rgba(37,99,235,.12);border-radius:14px">
    <div style="text-align:center;flex:1">
      <div style="font-size:20px;margin-bottom:4px">🤝</div>
      <div style="font-size:11px;font-weight:700;color:var(--blue)">STEP 1</div>
      <div style="font-size:10px;color:var(--txt2)">マッチング<br>申請</div>
    </div>
    <div style="flex-shrink:0;color:var(--txt3);font-size:12px;padding:0 4px">→</div>
    <div style="text-align:center;flex:1">
      <div style="font-size:20px;margin-bottom:4px">💬</div>
      <div style="font-size:11px;font-weight:700;color:var(--txt3)">STEP 2</div>
      <div style="font-size:10px;color:var(--txt2)">チャットで<br>相談</div>
    </div>
    <div style="flex-shrink:0;color:var(--txt3);font-size:12px;padding:0 4px">→</div>
    <div style="text-align:center;flex:1">
      <div style="font-size:20px;margin-bottom:4px">📝</div>
      <div style="font-size:11px;font-weight:700;color:var(--txt3)">STEP 3</div>
      <div style="font-size:10px;color:var(--txt2)">本契約</div>
    </div>
  </div>
  <div style="font-size:12px;color:var(--txt2);margin-bottom:16px;line-height:1.7;padding:10px 14px;background:var(--surf2);border-radius:10px">
    <i class="fa fa-info-circle" style="color:var(--blue);margin-right:4px"></i>
    まずはマッチング申請を送ります。コーチが承認後、<b>チャットで指導内容・スケジュール・料金を相談</b>できます。納得いただけたら本契約に進みます。
  </div>

  <div style="margin-bottom:16px">
    <div style="font-size:12px;font-weight:700;color:var(--txt2);margin-bottom:8px">依頼タイプ</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px" id="contract-type-grid">
      <div id="ct-monthly" onclick="selectContractType('monthly')" style="padding:14px 12px;background:var(--org)15;border:2px solid var(--org);border-radius:12px;cursor:pointer;text-align:center;transition:all .2s">
        <div style="font-size:20px;margin-bottom:4px">📅</div>
        <div style="font-size:13px;font-weight:700;color:var(--txt1)">継続指導</div>
        <div style="font-size:11px;color:var(--txt3)">月単位の指導</div>
      </div>
      <div id="ct-onetime" onclick="selectContractType('onetime')" style="padding:14px 12px;background:var(--surf2);border:2px solid var(--bdr);border-radius:12px;cursor:pointer;text-align:center;transition:all .2s">
        <div style="font-size:20px;margin-bottom:4px">⚡</div>
        <div style="font-size:13px;font-weight:700;color:var(--txt1)">単発・臨時</div>
        <div style="font-size:11px;color:var(--txt3)">1回のみ</div>
      </div>
    </div>
  </div>
  <div id="onetime-fields" style="display:none;margin-bottom:14px">
    <div class="form-group"><label class="label">依頼内容 *</label>
      <input id="ot-title" class="input" placeholder="例：3/15 練習試合の審判、GKコーチ1日依頼" maxlength="60" oninput="clearFieldError('ot-title')">
    </div>
    ${c.onetimeNegotiable?`<div style="padding:14px;background:rgba(0,212,170,.06);border:1px solid rgba(0,212,170,.2);border-radius:12px;margin-bottom:14px">
      <div style="font-size:13px;font-weight:700;color:var(--teal);margin-bottom:4px">💬 料金はマッチング後に相談</div>
      <div style="font-size:12px;color:var(--txt2);line-height:1.6">チャットで詳細・金額を相談した上で決定します。</div>
      <input type="hidden" id="ot-price" value="0">
    </div>`:`<div class="form-group"><label class="label">報酬額（円）*</label>
      <input id="ot-price" class="input" type="number" placeholder="例：10000" min="1000" max="999999" value="${c.priceOnetime||Math.round(price/2)}">
      <div style="font-size:10px;color:var(--txt3);margin-top:3px">手数料10%を差し引いた金額がコーチに届きます</div>
    </div>`}
    <div class="form-group"><label class="label">希望日</label>
      <input id="ot-date" class="input" type="date" value="${new Date(Date.now()+7*86400000).toISOString().slice(0,10)}">
    </div>
    <div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(14,165,233,.08);border:1px solid rgba(14,165,233,.2);border-radius:10px;margin-bottom:14px;cursor:pointer" onclick="document.getElementById('ot-online').checked=!document.getElementById('ot-online').checked">
      <input type="checkbox" id="ot-online" style="width:18px;height:18px;accent-color:var(--blue)" onclick="event.stopPropagation()">
      <div><div style="font-size:13px;font-weight:600;color:var(--txt1)">💻 オンラインコーチング</div>
      <div style="font-size:11px;color:var(--txt3)">Google Meetでオンライン指導</div></div>
    </div>
  </div>
  <div id="monthly-fee-info" style="background:var(--surf2);border-radius:var(--r);padding:14px 16px;margin-bottom:16px">
    ${c.monthlyNegotiable?`<div style="display:flex;align-items:center;gap:10px">
      <div style="font-size:24px">💬</div>
      <div><div style="font-size:13px;font-weight:700;color:var(--teal)">料金はマッチング後に相談</div>
      <div style="font-size:11px;color:var(--txt3);line-height:1.5">承認後のチャットで料金・指導内容を確認し、合意後に本契約へ進みます。</div></div>
    </div>`:`<div style="display:flex;justify-content:space-between;align-items:center;font-size:13px">
      <span style="color:var(--txt3)">コーチ掲示料金（目安）</span>
      <span style="font-weight:800;color:var(--org);font-size:16px">¥${(c?.price||0).toLocaleString()}<span style="font-size:11px;color:var(--txt3);font-weight:400">/月</span></span>
    </div>
    <div style="font-size:10px;color:var(--txt3);margin-top:6px">※ 実際の料金はマッチング後のチャットで相談の上、本契約時に確定します</div>`}
  </div>
  </div>
  <div class="form-group"><label class="label">コーチへのメッセージ（任意）</label><textarea id="match-msg" class="input" placeholder="チームの状況・目標・ご要望など自由にお書きください..."></textarea></div>
  <div class="flex gap-10"><button class="btn btn-primary" onclick="sendMatchRequest('${c.id}')">🤝 マッチングを申請する</button><button class="btn btn-ghost" onclick="closeM()">キャンセル</button></div>`;
}
window._contractType='monthly';
function selectContractType(t){
  window._contractType=t;
  document.getElementById('ct-monthly').style.borderColor=t==='monthly'?'var(--org)':'var(--bdr)';
  document.getElementById('ct-monthly').style.background=t==='monthly'?'var(--org)15':'var(--surf2)';
  document.getElementById('ct-onetime').style.borderColor=t==='onetime'?'var(--blue)':'var(--bdr)';
  document.getElementById('ct-onetime').style.background=t==='onetime'?'rgba(14,165,233,.1)':'var(--surf2)';
  document.getElementById('onetime-fields').style.display=t==='onetime'?'block':'none';
  document.getElementById('monthly-fee-info').style.display=t==='monthly'?'block':'none';
}
// sendMatchRequest → see REQUEST MATCHING SECTION
function applyTeamForm(id){const t=DB.teams.find(x=>x.id===id);return`<p class="text-muted text-sm mb-18">${t.name}（${t.sport}）に応募します</p><div class="form-group"><label class="label">自己PR・指導方針</label><textarea class="input" placeholder="あなたの指導スタイル・実績・メッセージ..." style="min-height:120px"></textarea></div><div class="flex gap-10"><button class="btn btn-primary" onclick="sendTeamApplication('${t.id}')">✓ 応募する</button><button class="btn btn-ghost" onclick="closeM()">キャンセル</button></div>`}
// sendTeamApplication → see REQUEST MATCHING SECTION

// ============================================================
// Stripe Checkout 決済処理（本物のAPI呼び出し）
// ============================================================
function parentLinkChild(){
  var pid=document.getElementById('parent-link-player')?.value;
  var code=(document.getElementById('parent-link-code')?.value||'').trim().toUpperCase();
  if(!pid){toast('お子様を選択してください','e');return;}
  if(!code){toast('招待コードを入力してください','e');return;}
  var player=DB.players.find(function(p){return p.id===pid;});
  if(!player){toast('選手が見つかりません','e');return;}
  var team=DB.teams.find(function(t){return t.id===player.team;});
  if(!team||team.code!==code){toast('招待コードが正しくありません','e');return;}
  if(player.guardianId){toast('この選手は既に保護者と紐づけ済みです','e');return;}
  // 紐付け実行 - player側
  player.guardianId=DB.currentUser?.id;
  player.guardian=DB.currentUser?.name||'';
  // currentUserにも保存
  if(!DB.currentUser.linkedPlayers)DB.currentUser.linkedPlayers=[];
  if(!DB.currentUser.linkedPlayers.includes(player.id))DB.currentUser.linkedPlayers.push(player.id);
  // usersテーブルにもlinkedPlayerIdを保存（永続化のため）
  var users=_getUsers();
  var gu=users.find(function(u){return u.id===DB.currentUser?.id;});
  if(gu){
    gu.linkedPlayerId=player.id;
    if(!gu.linkedPlayers)gu.linkedPlayers=[];
    if(!gu.linkedPlayers.includes(player.id))gu.linkedPlayers.push(player.id);
    gu.linkedTeamId=team.id;
    _saveUsers(users);
  }
  saveDB();
  // Firestore同期（クロスデバイス対応）
  if(typeof _syncToFirestore==='function') _syncToFirestore().catch(function(e){console.warn('[Sync] parent link sync error:',e);});
  // Firestoreのユーザーレコードにもlinked情報を永続化
  _syncParentLinkToFirestore(player.id,team.id);
  toast('✅ '+sanitize(player.name,10)+'さんと紐づけが完了しました！','s');
  addNotif(sanitize(player.name,10)+'の保護者として紐づけが完了しました','fa-link','dashboard');
  addNotif(sanitize(player.name,10)+'の保護者（'+sanitize(DB.currentUser?.name||'',10)+'）が紐づけを完了しました','fa-user-friends','my-team');
  refreshPage();
}
function parentUnlinkChild(playerId){
  var player=DB.players.find(function(p){return p.id===playerId;});
  if(!player){toast('選手が見つかりません','e');return;}
  if(player.guardianId!==DB.currentUser?.id){toast('紐づけ解除の権限がありません','e');return;}
  if(!confirm(sanitize(player.name,10)+'さんとの紐づけを解除しますか？'))return;
  player.guardianId=null;
  player.guardian='';
  if(DB.currentUser.linkedPlayers){
    DB.currentUser.linkedPlayers=DB.currentUser.linkedPlayers.filter(function(id){return id!==playerId;});
  }
  // usersテーブルも更新
  var users=_getUsers();
  var gu=users.find(function(u){return u.id===DB.currentUser?.id;});
  if(gu){
    if(gu.linkedPlayerId===playerId) gu.linkedPlayerId=null;
    if(gu.linkedPlayers) gu.linkedPlayers=gu.linkedPlayers.filter(function(id){return id!==playerId;});
    gu.linkedTeamId=null;
    _saveUsers(users);
  }
  saveDB();
  if(typeof _syncToFirestore==='function') _syncToFirestore().catch(function(e){console.warn('[Sync] unlink sync error:',e);});
  toast(sanitize(player.name,10)+'さんとの紐づけを解除しました','i');
  refreshPage();
}
function payMonthlyFee(paymentId){
  if(!RateLimit.check('payment',5,60000)){toast('支払い操作が速すぎます。しばらくお待ちください','e');return;}
  var pay=_dbArr('payments').find(function(p){return p.id===paymentId;});
  if(!pay){toast('支払い情報が見つかりません','e');return;}
  if(pay.status==='paid'){toast('すでに支払い済みです','i');return;}
  var team=DB.teams.find(function(t){return t.id===pay.team;});
  var player=DB.players.find(function(p){return p.id===pay.player;});
  // Stripe対応: processStripePaymentを呼び出し
  var btn=event?.target;
  if(btn){
    processStripePayment(btn,{
      type:'tuition',
      amount:pay.amount,
      teamId:pay.team,
      teamName:team?.name||'',
      playerName:player?.name||'',
      playerId:pay.player,
      month:pay.month
    }).catch(function(){
      // Stripe接続失敗時: デモモードで即時完了
      _demoPayMonthly(paymentId);
    });
  } else {
    _demoPayMonthly(paymentId);
  }
}
function _demoPayMonthly(paymentId){
  var pay=_dbArr('payments').find(function(p){return p.id===paymentId;});
  if(!pay)return;
  var feeRate=getFeeRate(pay.team,'monthlyFee');
  var fee=getFeeAmount(pay.amount,pay.team,'monthlyFee');
  pay.status='paid';
  pay.paidAt=new Date().toISOString();
  pay.paidDate=new Date().toLocaleDateString('ja-JP');
  pay.fee=fee;
  pay.netAmount=pay.amount-fee;
  pay.method='card';
  pay.demoMode=true;
  saveDB();
  toast('✅ ¥'+fmtNum(pay.amount)+' の月謝を支払いました（'+pay.month+'）','s');
  addNotif(pay.month+'分の月謝（¥'+fmtNum(pay.amount)+'）を支払いました','fa-check-circle','parent-fee');
  // チーム側にも通知
  var player=DB.players.find(function(p){return p.id===pay.player;});
  addNotif((player?.name||'選手')+'の'+pay.month+'分月謝（¥'+fmtNum(pay.amount)+'）が支払われました','fa-yen-sign','fee');
  refreshPage();
}
function payAllUnpaid(){
  var child=DB.players.find(function(p){return p.guardianId===(DB.currentUser?.id);})||DB.players.find(function(p){return p.guardian===(DB.currentUser?.name);});
  if(!child)return;
  var unpaid=_dbArr('payments').filter(function(p){return p.player===child.id&&(p.status==='unpaid'||p.status==='overdue');});
  if(!unpaid.length){toast('未払いはありません','i');return;}
  var total=unpaid.reduce(function(s,p){return s+p.amount;},0);
  if(!confirm('¥'+fmtNum(total)+' をまとめて支払いますか？（'+unpaid.length+'件）'))return;
  unpaid.forEach(function(p){_demoPayMonthly(p.id);});
  toast('✅ '+unpaid.length+'件（¥'+fmtNum(total)+'）を一括支払いしました','s');
  refreshPage();
}
function payAdhocFromParent(invId){
  var inv=(DB.adhocInvoices||[]).find(function(i){return i.id===invId;});
  if(!inv){toast('請求が見つかりません','e');return;}
  if(inv.status==='paid'){toast('すでに支払い済みです','i');return;}
  inv.status='paid';
  inv.paidAt=new Date().toISOString();
  inv.paidDate=new Date().toLocaleDateString('ja-JP');
  inv.demoMode=true;
  saveDB();
  toast('✅ ¥'+fmtNum(inv.total)+' を支払いました','s');
  addNotif(sanitize(inv.title||'',20)+'（¥'+fmtNum(inv.total)+'）を支払いました','fa-check-circle','parent-fee');
  refreshPage();
}
function completePaymentSetup(){
  if(DB.currentUser?.role!=='parent'){toast('保護者のみ利用可能です','e');return;}
  const users=_getUsers();
  const me=users.find(u=>u.id===DB.currentUser?.id);
  if(!me){toast('ユーザー情報が見つかりません','e');return;}
  me.paymentSetup=true;
  me.paymentSetupAt=new Date().toLocaleString('ja-JP');
  _saveUsers(users);
  // 紐づいた選手の通知
  const child=DB.players.find(p=>p.guardianId===me.id);
  if(child){
    addNotif(`${child.name}の保護者が月謝管理登録を完了しました`,'fa-credit-card','fee');
  }
  saveDB();
  toast('💳 クレジットカード登録が完了しました！月謝管理を開始します。','s');
  refreshPage();
}

var _paymentProcessing = false;
async function processStripePayment(btn, opts={}){
  // Payment state machine check
  var payKey = (opts.type||'tuition') + '_' + (opts.teamId||'') + '_' + (opts.month||'');
  if(!PaymentGuard.canPay(payKey)){ return; }
  if(_paymentProcessing){ toast('決済処理中です。しばらくお待ちください。','w'); return; }
  _paymentProcessing = true;
  setTimeout(function(){ _paymentProcessing = false; }, 30000);
  PaymentGuard.start(payKey, {type:opts.type, amount:opts.amount, teamId:opts.teamId});
  btn.disabled = true;
  const origText = btn.innerHTML;
  btn.innerHTML = '<span style="opacity:.7">⏳ Stripeに接続中...</span>';

  try {
    const me   = DB.currentUser;
    const type = opts.type || 'tuition';

    let endpoint, payload;

    if(type === 'tuition'){
      // 月謝支払い（保護者 or 選手 → チーム）
      const myPlayer = DB.players.find(p=>p.id===me?.id);
      const myTeam   = myPlayer ? DB.teams.find(t=>t.id===myPlayer.team) : null;
      endpoint = '/create-tuition-session';
      const _tid = opts.teamId || myTeam?.id || '';
      payload  = {
        teamName:   opts.teamName   || myTeam?.name || 'チーム',
        playerName: opts.playerName || myPlayer?.name || me?.name || '選手',
        amount:     opts.amount     || myTeam?.fee  || 5000,
        month:      opts.month      || new Date().toISOString().slice(0,7),
        playerId:   opts.playerId   || me?.id || '',
        teamId:     _tid,
        feeRate:    getFeeRate(_tid, 'monthlyFee'),
      };
    } else if(type === 'coach'){
      // コーチ代支払い（チーム → コーチ）
      endpoint = '/create-coach-payment-session';
      const _ctid = opts.teamId || me?.id || '';
      payload  = {
        coachName:  opts.coachName  || 'コーチ',
        teamName:   opts.teamName   || me?.name || 'チーム',
        amount:     opts.amount     || 30000,
        month:      opts.month      || new Date().toISOString().slice(0,7),
        coachId:    opts.coachId    || '',
        teamId:     _ctid,
        threadId:   opts.threadId   || '',
        feeRate:    getFeeRate(_ctid, 'coachFee'),
      };
    } else {
      throw new Error('不明な決済タイプ: ' + type);
    }

    // バックエンドAPIを呼び出してStripe Checkoutセッションを作成
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method:  'POST',
      headers: await _apiHeaders(),
      body:    JSON.stringify(payload),
    });

    if(!res.ok){
      const errData = await res.json().catch(()=>({error:'サーバーエラー'}));
      throw new Error(errData.error || `HTTP ${res.status}`);
    }

    const data = await res.json();
    if(!data.sessionUrl) throw new Error('決済URLが取得できませんでした');

    // Stripe Checkout ページへリダイレクト
    PaymentGuard.complete(payKey, {sessionUrl:data.sessionUrl});
    PaymentTrail.record('charge', {amount:opts.amount||0, playerId:opts.playerId||'', teamId:opts.teamId||'', coachId:opts.coachId||'', month:opts.month||'', sessionId:data.sessionId||'', status:'redirect'});
    toast('Stripeの決済画面に移動します...','i');
    setTimeout(()=>{if(data.sessionUrl&&data.sessionUrl.startsWith('https://checkout.stripe.com'))window.open(data.sessionUrl,'_blank');else toast('不正なURLです','e');},500);

  } catch(err) {
    _paymentProcessing = false;
    PaymentGuard.fail(payKey, err.message||'unknown');
    ErrorTracker.capture('payment', err.message||'決済エラー', {type:opts.type, amount:opts.amount});
    btn.disabled = false;
    btn.innerHTML = origText;

    const isNetwork = err.message.includes('fetch') || err.message.includes('Failed to fetch') || err.message.includes('NetworkError') || err.message.includes('ERR_CONNECTION');
    if(isNetwork){
      toast('決済サーバーに接続できませんでした。しばらくしてから再試行してください。','e');
    } else {
      toast('決済エラーが発生しました。管理者にお問い合わせください。','e');
    }
  }
}

// 決済サーバー接続エラー表示
function showPaymentDemoFallback(btn, origText){
  btn.disabled = false;
  btn.innerHTML = origText;
  toast('決済サーバーに接続できませんでした。管理者にお問い合わせください。','e');
}
function stripeSetupForm(){return`<div class="stripe-card mb-16">
  <div class="flex items-center gap-8 mb-14 text-sm text-muted"><span style="font-size:18px">⚡</span> Stripe Connect 口座設定</div>
  <p class="text-sm text-muted mb-16" style="line-height:1.7">Stripeの安全な画面で銀行口座を登録します。カード情報はこの画面に入力しません。</p>
  <div style="background:rgba(99,91,255,.08);border-radius:10px;padding:14px;margin-bottom:16px;font-size:12px;color:var(--txt2);line-height:1.8">
    <div>✅ PCI DSS Level 1 準拠</div>
    <div>✅ 銀行振込・カード両対応</div>
    <div>✅ 入金は自動で指定口座へ</div>
  </div>
  <div class="flex gap-10">
    <button class="btn btn-stripe" onclick="startStripeConnect();closeM()">⚡ 口座を登録する</button>
    <button class="btn btn-ghost" onclick="closeM()">後で設定</button>
  </div>
</div>`}
function paymentForm(){
  const t=getMyTeam()||{name:'未設定',fee:0,id:''};
  return`<div style="background:var(--surf2);border-radius:var(--r);padding:14px;margin-bottom:18px">
    <div class="flex justify-between text-sm mb-6"><span class="text-muted">チーム</span><b>${t.name}</b></div>
    <div class="flex justify-between text-sm mb-6"><span class="text-muted">月謝</span><b>¥${fmtNum(t.fee)}</b></div>
    <div class="flex justify-between text-sm"><span class="text-muted">対象月</span><b>${curMonthJP()}</b></div>
  </div>
  <div class="stripe-card mb-16">
    <div class="flex items-center gap-8 mb-14 text-sm text-muted"><span style="font-size:18px">⚡</span> Stripe による安全な決済処理</div>
    <div class="card-field-label">カード番号</div>
    <div class="card-field-group mb-10"><div class="card-field-val"><i class="fa fa-credit-card" style="color:var(--txt3)"></i><input class="input" id="stripe-card-num" style="background:none;border:none;padding:0;box-shadow:none;font-size:14px" placeholder="カード番号を入力"><div class="card-brands"><div class="card-brand" style="background:#1434CB;color:#fff">VISA</div><div class="card-brand" style="background:#FF5F00;color:#fff">MC</div><div class="card-brand" style="background:#fff;color:#f3f7fe;font-size:7px">JCB</div></div></div></div>
    <div class="grid-2">
      <div><div class="card-field-label">有効期限</div><div class="card-field-group"><input class="input" style="background:none;border:none;padding:0;box-shadow:none;font-size:14px" placeholder="MM / YY"></div></div>
      <div><div class="card-field-label">CVC</div><div class="card-field-group"><div class="card-field-val"><i class="fa fa-lock" style="color:var(--txt3);font-size:12px"></i><input class="input" style="background:none;border:none;padding:0;box-shadow:none;font-size:14px" placeholder="•••"></div></div></div>
    </div>
    <div class="form-group mt-10"><div class="card-field-label">カード名義人（半角ローマ字）</div><div class="card-field-group"><input class="input" style="background:none;border:none;padding:0;box-shadow:none;font-size:14px" placeholder="TARO YAMADA"></div></div>
  </div>
  <div style="font-size:11px;color:var(--txt3);margin-bottom:16px"><i class="fa fa-lock" style="color:var(--green)"></i> PCI DSS Level 1 準拠 · 256bit SSL暗号化 · カード情報は当社に保存されません</div>
  <div class="flex gap-10">
    <button class="btn btn-primary" style="flex:1" onclick="processStripePayment(this,{type:'tuition',amount:${t.fee},teamId:'${t.id}',teamName:decodeURIComponent('${encodeURIComponent(t.name||'')}'),month:curMonth()})">🔒 ¥${fmtNum(t.fee)} を支払う</button>
    <button class="btn btn-ghost" onclick="closeM()">キャンセル</button>
  </div>`
}

function openM(title,body,large=false){
  const box=document.getElementById('modal-box');
  box.className='modal'+(large?' modal-lg':'');
  box.setAttribute('role','dialog');
  box.setAttribute('aria-modal','true');
  box.setAttribute('aria-label',title);
  const inner=document.getElementById('modal-inner');
  // XSS対策: titleはtextContent、bodyは信頼済みHTML（ページ関数が生成）
  const titleEl=document.createElement('div');
  titleEl.className='modal-title';
  titleEl.id='modal-title-text';
  titleEl.textContent=title;  // textContentでXSS完全防止
  inner.innerHTML='';
  inner.appendChild(titleEl);
  const bodyEl=document.createElement('div');
  bodyEl.innerHTML=body;      // bodyはアプリ内関数が生成する信頼済みHTML
  inner.appendChild(bodyEl);
  const ov=document.getElementById('overlay');
  ov.classList.add('open');
  // フォーカストラップ: モーダル内の最初のフォーカス可能要素にフォーカス
  setTimeout(()=>{
    const focusable=box.querySelector('input,button,textarea,select,[tabindex]');
    if(focusable) focusable.focus();
    // モーダル内もモバイル修正
    if(window.innerWidth<=768) _mobileFixModal();
  },100);
}
function _mobileFixModal(){
  const box=document.getElementById('modal-inner');
  if(!box) return;
  box.querySelectorAll('[style]').forEach(el=>{
    const s=el.style;
    if(s.gridTemplateColumns && s.gridTemplateColumns!=='1fr'){
      if(/\d{2,}px|1fr 1fr 1fr|repeat\([3-9]/.test(s.gridTemplateColumns)){
        s.gridTemplateColumns='1fr';
      }
    }
    if(s.display==='flex'&&s.gap&&!s.flexWrap) s.flexWrap='wrap';
    if(parseInt(s.padding)>24) s.padding='12px';
    if(parseInt(s.width)>300) s.maxWidth='100%';
    if(parseInt(s.minWidth)>200) s.minWidth='unset';
  });
}
function closeM(){
  document.getElementById('overlay').classList.remove('open');
  // フォーカスを戻す
  const trigger=document.activeElement;
  if(trigger) try{trigger.blur();}catch(e){}
}
function handleOverlayClick(e){if(e.target===document.getElementById('overlay'))closeM()}
// キーボードナビゲーション
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){
    const ov=document.getElementById('overlay');
    if(ov&&ov.classList.contains('open')){closeM();e.preventDefault();}
  }
});
// ================================================================
// ■ コーチ←→選手 連携管理
// ================================================================

function openAssignPlayersModal(coachId){
  const team=getMyTeam();
  if(!team){toast('チーム情報が見つかりません','e');return;}
  const coach=DB.coaches.find(c=>c.id===coachId);
  if(!coach){toast('コーチが見つかりません','e');return;}
  const players=DB.players.filter(p=>p.team===team.id);
  if(!players.length){toast('選手が登録されていません','e');return;}

  const html=`
    <div style="margin-bottom:14px">
      <div style="font-size:13px;color:var(--txt2);line-height:1.7">
        <b>${sanitize(coach.name,20)}</b> コーチの担当選手を選択してください。<br>
        <span style="font-size:11px;color:var(--txt3)">選択した選手の情報がコーチに共有されます。</span>
      </div>
    </div>
    <div style="max-height:50vh;overflow-y:auto;display:flex;flex-direction:column;gap:6px" id="assign-player-list">
      ${players.map(function(p){
        const assigned=p.coachId===coachId;
        return '<label style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--surf2);border-radius:10px;cursor:pointer;border:1.5px solid '+(assigned?'var(--teal)':'transparent')+'">'+
          '<input type="checkbox" value="'+p.id+'" '+(assigned?'checked':'')+' style="width:18px;height:18px;accent-color:var(--teal)">'+
          '<div style="flex:1"><div style="font-size:13px;font-weight:700">'+sanitize(p.name,20)+'</div>'+
          '<div style="font-size:11px;color:var(--txt3)">'+(p.pos||'--')+' / No.'+(p.number||'--')+'</div></div>'+
          '</label>';
      }).join('')}
    </div>
    <div style="display:flex;gap:8px;margin-top:14px">
      <button class="btn btn-ghost flex-1" onclick="closeM()">キャンセル</button>
      <button class="btn btn-primary flex-1" onclick="saveAssignedPlayers('${coachId}')">保存する</button>
    </div>
  `;
  openM('担当選手の設定 — '+sanitize(coach.name,15), html);
}

function saveAssignedPlayers(coachId){
  const list=document.getElementById('assign-player-list');
  if(!list){closeM();return;}
  const checks=list.querySelectorAll('input[type=checkbox]');
  const team=getMyTeam();
  // 全選手のcoachId割当を更新
  DB.players.filter(p=>p.team===team?.id).forEach(function(p){
    if(p.coachId===coachId) p.coachId=''; // 一旦解除
  });
  let count=0;
  checks.forEach(function(cb){
    if(cb.checked){
      const p=DB.players.find(function(pl){return pl.id===cb.value;});
      if(p){p.coachId=coachId;count++;}
    }
  });
  // コーチの担当情報も更新
  const coach=DB.coaches.find(c=>c.id===coachId);
  if(coach) coach._assignedPlayers=DB.players.filter(p=>p.coachId===coachId).map(p=>p.id);

  saveDB();
  closeM();
  toast(count+'名の選手を'+sanitize(coach?.name||'コーチ',15)+'に割り当てました','s');
  addAuditLog('assign_players','担当選手設定: '+sanitize(coach?.name||'',15)+' → '+count+'名',{coachId,count});
  refreshPage();
}

// ════════════════════════════════════════
// 選手情報開示管理セクション（チームダッシュボード用）
// ════════════════════════════════════════
function _renderTeamDisclosureSection(team, contractedCoaches, players) {
  if(!team) return '';
  
  // All coaches that have any relationship with this team (matched, contracted, or team.coach)
  var allRelatedCoaches = [];
  var seenIds = {};
  
  // 1. contracted coaches
  (contractedCoaches||[]).forEach(function(co){
    if(co && !seenIds[co.id]) { seenIds[co.id]=true; allRelatedCoaches.push({coach:co, status:'contracted'}); }
  });
  
  // 2. matched coaches (not yet contracted)
  _dbArr('requests').filter(function(r){ return r.teamId===team.id && (r.status==='matched'||r.status==='trial_approved'||r.status==='contract_requested'); })
    .forEach(function(r){
      var co = DB.coaches.find(function(c){return c.id===r.coachId;});
      if(co && !seenIds[co.id]) { seenIds[co.id]=true; allRelatedCoaches.push({coach:co, status:r.status}); }
    });
  
  // 3. team.coach (legacy)
  if(team.coach && !seenIds[team.coach]) {
    var co = DB.coaches.find(function(c){return c.id===team.coach;});
    if(co) { seenIds[co.id]=true; allRelatedCoaches.push({coach:co, status:'contracted'}); }
  }
  
  // Get all disclosures for this team
  var disclosures = _dbArr('disclosures').filter(function(d){return d.teamId===team.id && d.status==='active';});
  var signedCount = disclosures.filter(function(d){return !!d.coachAgreedAt;}).length;
  var pendingCount = disclosures.filter(function(d){return !d.coachAgreedAt;}).length;
  var notDisclosedCount = allRelatedCoaches.filter(function(rc){return !disclosures.find(function(d){return d.coachId===rc.coach.id;});}).length;
  
  // Don't render if no coaches at all
  if(!allRelatedCoaches.length && !disclosures.length) return '';
  
  var h = '<div class="dash-section" style="margin-bottom:16px;border:1.5px solid rgba(14,165,233,.2);border-radius:14px;overflow:hidden">';
  
  // Header
  h += '<div style="padding:14px 16px;background:linear-gradient(135deg,rgba(14,165,233,.06),rgba(0,207,170,.04));border-bottom:1px solid var(--b1)">';
  h += '<div style="display:flex;justify-content:space-between;align-items:center">';
  h += '<div><span style="font-size:14px;font-weight:800"><i class="fas fa-shield-alt" style="color:var(--blue);margin-right:6px"></i>選手情報開示管理</span>';
  h += '<div style="font-size:11px;color:var(--txt3);margin-top:2px">コーチへの選手データ開示と同意確認管理</div></div>';
  h += '<div style="display:flex;gap:6px">';
  if(signedCount > 0) h += '<span style="padding:3px 8px;border-radius:6px;background:rgba(0,207,170,.1);color:var(--teal);font-size:10px;font-weight:700">✅ 署名済 '+signedCount+'</span>';
  if(pendingCount > 0) h += '<span style="padding:3px 8px;border-radius:6px;background:rgba(14,165,233,.1);color:var(--blue);font-size:10px;font-weight:700">⏳ 署名待ち '+pendingCount+'</span>';
  if(notDisclosedCount > 0) h += '<span style="padding:3px 8px;border-radius:6px;background:rgba(239,68,68,.08);color:#ef4444;font-size:10px;font-weight:700">🔒 未開示 '+notDisclosedCount+'</span>';
  h += '</div></div></div>';
  
  // Coach list with disclosure status
  h += '<div style="padding:12px 16px">';
  
  if(!allRelatedCoaches.length) {
    h += '<div style="text-align:center;padding:16px 0;font-size:12px;color:var(--txt3)">';
    h += '<div style="font-size:28px;margin-bottom:8px;opacity:.4"><i class="fas fa-user-shield"></i></div>';
    h += 'マッチング・契約中のコーチがいません</div>';
  } else {
    allRelatedCoaches.forEach(function(rc) {
      var co = rc.coach;
      var disc = disclosures.find(function(d){return d.coachId===co.id;});
      var signed = disc && disc.coachAgreedAt;
      var waiting = disc && !disc.coachAgreedAt;
      var assignedCount = (DB.players||[]).filter(function(p){return p.team===team.id && p.coachId===co.id;}).length;
      
      h += '<div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--surf2);border-radius:10px;margin-bottom:8px">';
      
      // Avatar
      h += '<div style="width:42px;height:42px;border-radius:50%;background:'+(co.color||'var(--blue)')+'22;color:'+(co.color||'var(--blue)')+';display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;flex-shrink:0">'+sanitize((co.name||'?')[0])+'</div>';
      
      // Info
      h += '<div style="flex:1;min-width:0">';
      h += '<div style="font-size:13px;font-weight:700">'+sanitize(co.name,18)+' '+(co.verified?'<i class="fa fa-check-circle" style="color:var(--teal);font-size:10px"></i>':'')+'</div>';
      h += '<div style="font-size:10px;color:var(--txt3);margin-top:2px">';
      h += sanitize(co.sport||'',10)+' · '+(rc.status==='contracted'?'契約中':rc.status==='matched'?'マッチング中':rc.status==='trial_approved'?'トライアル承認':'申請中');
      if(assignedCount > 0) h += ' · 担当'+assignedCount+'名';
      h += '</div>';
      
      // Status badge
      h += '<div style="margin-top:4px">';
      if(signed) {
        h += '<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:6px;background:rgba(0,207,170,.1);color:var(--teal);font-size:10px;font-weight:700"><i class="fa fa-unlock" style="font-size:8px"></i> 開示中 · 署名済 ('+(disc.coachAgreedAt||'').slice(0,10)+')</span>';
      } else if(waiting) {
        h += '<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:6px;background:rgba(14,165,233,.1);color:var(--blue);font-size:10px;font-weight:700"><i class="fa fa-file-signature" style="font-size:8px"></i> 開示済 · コーチの署名待ち</span>';
      } else {
        h += '<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:6px;background:rgba(239,68,68,.06);color:#ef4444;font-size:10px;font-weight:700"><i class="fa fa-lock" style="font-size:8px"></i> 未開示 · 選手データにアクセスできません</span>';
      }
      h += '</div></div>';
      
      // Action button
      h += '<div style="flex-shrink:0">';
      if(!disc) {
        h += '<button class="btn btn-primary btn-sm" style="font-size:11px;padding:6px 12px" onclick="openDisclosureModal(\''+co.id+'\')"><i class="fas fa-share-alt" style="margin-right:3px"></i>開示する</button>';
      } else if(signed) {
        h += '<button class="btn btn-ghost btn-sm" style="font-size:11px;padding:6px 10px;color:var(--red)" onclick="openRevokeDisclosureModal(\''+co.id+'\')"><i class="fas fa-ban" style="margin-right:3px"></i>取消</button>';
      } else {
        h += '<span style="font-size:10px;color:var(--blue)"><i class="fa fa-clock"></i> 待機中</span>';
      }
      h += '</div></div>';
    });
  }
  
  // Explanation
  h += '<div style="margin-top:8px;padding:10px 12px;background:rgba(14,165,233,.04);border:1px solid rgba(14,165,233,.12);border-radius:8px;font-size:11px;color:var(--txt3);line-height:1.7">';
  h += '<b style="color:var(--blue)">ℹ️ 情報開示のしくみ</b><br>';
  h += '① チーム管理者が「開示する」を実行 → ② コーチに通知が届く → ③ コーチが選手情報の同意確認を実施 → ④ コーチが選手データにアクセス可能に<br>';
  h += '開示はいつでも取り消せます。取り消すとコーチは選手データにアクセスできなくなります。';
  h += '</div>';
  
  h += '</div></div>';
  return h;
}

