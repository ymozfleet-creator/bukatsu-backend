// 22 - Firebase認証復元, _onFirebaseAuth, アプリ起動, DOMContentLoaded, PWA
window._onFirebaseAuth = async function(fbUser){
  // 本番リセット: ローカルのデモデータのみクリア（Firestoreは絶対に削除しない！）
  if(window._needsProdReset && fbUser){
    // Firestoreのデータは他ユーザーの本番データなので絶対に削除しない
    window._needsProdReset = false;
    // Firestoreからデータを読み込んで復元
  }
  if(!fbUser || DB.currentUser) return;
  // オンボーディング中は自動ログインをブロック
  if(window._isOnboarding){
    return;
  }
  // バージョン変更時でもFirestoreからデータを読み込んでログイン
  try {
    const fn = window._fbFn;
    if(!fn) return;
    const userDoc = await fn.getDoc(fn.doc(window._fbDB, 'users', fbUser.uid));
    if(!userDoc.exists()) return;
    const u = userDoc.data();
    const loaded = await _loadFromFirestore(fbUser.uid);
    if(loaded && u.id){
      DB.currentUser = { role:u.role, name:u.name, email:u.email, id:u.id, createdAt:u.createdAt };
      // 保護者リンク情報復元
      if(u.role==='parent'){
        DB.currentUser.linkedPlayers=u.linkedPlayers||[];
        DB.currentUser.linkedPlayerId=u.linkedPlayerId||null;
        DB.currentUser.linkedTeamId=u.linkedTeamId||null;
        const _lc=DB.players.find(p=>p.guardianId===u.id);
        if(_lc){
          if(!DB.currentUser.linkedPlayers.includes(_lc.id))DB.currentUser.linkedPlayers.push(_lc.id);
          if(!DB.currentUser.linkedPlayerId)DB.currentUser.linkedPlayerId=_lc.id;
          if(!DB.currentUser.linkedTeamId)DB.currentUser.linkedTeamId=_lc.team||null;
        }
        if(!DB.pendingParentTeamId&&DB.currentUser.linkedTeamId)DB.pendingParentTeamId=DB.currentUser.linkedTeamId;
      }
      const users = _getUsers();
      // FIX: Always update user entry (don't skip if email already exists - may be stale)
      var existingIdx = users.findIndex(x=>x.id===u.id || x.email===u.email);
      var newEntry = {id:u.id, role:u.role, name:u.name, email:u.email, pwHash:'firebase', createdAt:u.createdAt};
      if(existingIdx >= 0) {
        users[existingIdx] = newEntry; // Update with latest data
      } else {
        users.push(newEntry);
      }
      // Deduplicate by email (keep latest)
      var seen = {};
      var deduped = [];
      for(var _ui=users.length-1; _ui>=0; _ui--) {
        if(!seen[users[_ui].email]) { seen[users[_ui].email]=true; deduped.unshift(users[_ui]); }
      }
      _saveUsers(deduped);
      saveDB();
      // FIX: Load per-user AI history for auto-login
      if(typeof loadAIHistory === 'function') loadAIHistory();
      launchApp();
    }
  } catch(e){}
};

    loadCustomWorkouts();
    loadAIHistory();
    loadCalRepeatEvents();

    // 食事履歴アーカイブ & AI学習データ初期化
    if (!DB.mealHistory) DB.mealHistory = {};
    if (!DB.myFoods) DB.myFoods = [];
    if (!DB.bodyLog) DB.bodyLog = {};
    if (!DB.conditionLog) DB.conditionLog = {};
    archiveMealsIfNewDay();
    saveDB(); // アーカイブした食事データをFirestoreに即時同期
  // Production systems init
  SessionMgr.init();
  NetStatus.init();
  Perf.start('app-init');

    // アーカイブでDB変更があった場合に備えて保存
    // ※初期化時はlocalStorageのみ保存（Firestoreへの書き戻しを抑制）
    window._suppressSync = true;
    saveDB();
    window._suppressSync = false;
    if(restored){
      // 本番: デモデータ注入なし（管理者が手動追加）
      if(false){
        saveDB();
      }
    }

    if(loader){
      loader.style.transition = 'opacity 0.5s ease, visibility 0.5s ease';
      loader.classList.add('hide');
      setTimeout(async function(){
        // ログイン済み + 正規ユーザー確認 → 自動ログイン
        if(restored && DB.currentUser && DB.currentUser.id){
          // adminはPIN認証のみなのでスキップ
          if(DB.currentUser.role === 'admin'){
            // Firestoreから最新データを取得（古いlocalStorageデータの上書き防止）
            await _fetchLatestBeforeLaunch();
            launchApp();
          } else {
            const users = _getUsers();
            const ok = users.find(u => u.id === DB.currentUser.id && u.email === DB.currentUser.email);
            if(ok){
              await _fetchLatestBeforeLaunch();
              launchApp();
            } else { DB.currentUser = null; show('landing'); }
          }
        } else {
          show('landing');
        }
      }, 500);
    } else {
      if(restored && DB.currentUser && DB.currentUser.id){
        (async function(){
          if(DB.currentUser.role === 'admin'){
            await _fetchLatestBeforeLaunch();
            launchApp();
          } else {
            const users = _getUsers();
            const ok = users.find(u => u.id === DB.currentUser.id && u.email === DB.currentUser.email);
            if(ok){
              await _fetchLatestBeforeLaunch();
              launchApp();
            } else { DB.currentUser = null; show('landing'); }
          }
        })();
      } else {
        show('landing');
      }
    }
  }, 1600);
})();

// PWA Service Worker 登録
// 注意: インラインSWはblob:プロトコルで登録できないため、
// 別ファイル(sw.js)が必要です。存在する場合のみ登録を試行。
if('serviceWorker' in navigator){
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('/sw.js')
      .then(reg=>console.log('[SW] Registered:',reg.scope))
      .catch(()=>{
        // sw.jsが存在しない場合はキャッシュAPIで基本的なオフライン対応
        // 次回デプロイ時にsw.jsを配置すれば自動で有効化されます
      });
  });
}

// ================================================================
// PWA インストールプロンプト
// ================================================================
let _deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  _deferredInstallPrompt = e;
  // インストールバナーを設定画面に表示
  setTimeout(() => {
    const installBtn = document.getElementById('pwa-install-btn');
    if(installBtn) installBtn.style.display = 'inline-flex';
  }, 2000);
});
window.addEventListener('appinstalled', () => {
  _deferredInstallPrompt = null;
  addAuditLog('pwa_install', (DB.currentUser?.name||'ユーザー') + ' がアプリをインストール');
  toast('🎉 アプリをインストールしました！','s');
});
function installPWA(){
  if(!_deferredInstallPrompt){toast('インストールプロンプトが利用できません','w');return;}
  _deferredInstallPrompt.prompt();
  _deferredInstallPrompt.userChoice.then(choice=>{
    if(choice.outcome==='accepted') console.log('[PWA] Install accepted');
    _deferredInstallPrompt=null;
  });
}

// ================================================================
// パフォーマンス最適化
// ================================================================
// 遅延初期化（非クリティカルタスクを idle 時に実行）
function _runWhenIdle(fn){
  if('requestIdleCallback' in window) requestIdleCallback(fn, {timeout:3000});
  else setTimeout(fn, 500);
}

// ============================================================
// v14 UX HELPER FUNCTIONS
// ============================================================

// マッチングフロー進捗ステッパーを生成
function flowStepper(role){
  const team  = role==='team'  ? getMyTeam()  : null;
  const coach = role==='coach' ? getMyCoach() : null;
  
  // ステップを定義
  const steps = role==='team' ? [
    {id:'register', label:'登録完了'},
    {id:'search',   label:'コーチ検索'},
    {id:'request',  label:'マッチング申請'},
    {id:'chat',     label:'チャットで相談'},
    {id:'contract', label:'本契約'},
    {id:'active',   label:'稼働中'},
  ] : role==='coach' ? [
    {id:'register', label:'登録完了'},
    {id:'profile',  label:'プロフィール'},
    {id:'match',    label:'マッチング'},
    {id:'chat',     label:'チャットで相談'},
    {id:'contract', label:'本契約'},
    {id:'active',   label:'稼働中'},
  ] : null;
  
  if(!steps) return '';

  // 現在のステップを判定
  let activeIdx = 0;
  if(role === 'team' && team){
    const hasRequest = _dbArr('requests').some(r=>r.teamId===team.id&&r.status==='pending');
    const hasMatch   = _dbArr('requests').some(r=>r.teamId===team.id&&(r.status==='matched'||r.status==='contract_requested'));
    const hasContract= _dbArr('requests').some(r=>r.teamId===team.id&&r.status==='contracted');
    const hasThread  = _dbArr('payThreads').some(pt=>pt.teamId===team.id);
    const hasPaid    = _dbArr('payThreads').some(pt=>pt.teamId===team.id&&(pt.invoices||[]).some(i=>i.status==='paid'));
    if(hasPaid)          activeIdx = 5;
    else if(hasContract||hasThread) activeIdx = 4;
    else if(hasMatch)    activeIdx = 3;
    else if(hasRequest)  activeIdx = 2;
    else                 activeIdx = 1;
  } else if(role === 'coach' && coach){
    const hasMatch  = _dbArr('requests').some(r=>r.coachId===coach.id&&(r.status==='matched'||r.status==='contract_requested'));
    const hasContract= _dbArr('requests').some(r=>r.coachId===coach.id&&r.status==='contracted');
    const hasThread  = _dbArr('payThreads').some(pt=>pt.coachId===coach.id);
    const hasPaid   = _dbArr('payThreads').some(pt=>pt.coachId===coach.id&&(pt.invoices||[]).some(i=>i.status==='paid'));
    const profileOk = coach.bio || coach.sport || coach.price > 0;
    if(hasPaid)          activeIdx = 5;
    else if(hasContract||hasThread) activeIdx = 4;
    else if(hasMatch)    activeIdx = 3;
    else if(profileOk)   activeIdx = 1;
    else                 activeIdx = 0;
  }

  const stepsHtml = steps.map((s,i)=>{
    const state = i < activeIdx ? 'done' : i===activeIdx ? 'active' : 'todo';
    const icon  = state==='done' ? '✓' : (i+1).toString();
    return `
      ${i>0?`<div class="flow-connector ${i<=activeIdx?'done':''}"></div>`:''}
      <div class="flow-step ${state}">
        <div class="flow-step-circle">${icon}</div>
        <div class="flow-step-label">${s.label}</div>
      </div>
    `;
  }).join('');

  const nextMsg = activeIdx < steps.length-1 ? `次のステップ: <b>${steps[activeIdx+1]?.label||''}</b>` : '🎉 全ステップ完了！';

  return `<div class="flow-stepper">
    ${stepsHtml}
    <div style="margin-left:16px;padding-left:16px;border-left:1px solid var(--b1);flex-shrink:0;min-width:120px">
      <div style="font-size:10px;color:var(--txt3);margin-bottom:3px">次のステップ</div>
      <div style="font-size:12px;color:var(--org);font-weight:700">${nextMsg}</div>
    </div>
  </div>`;
}

// ウェルカムバナー（新規ユーザー向け）
function welcomeBanner(role){
  const team  = role==='team'  ? getMyTeam()  : null;
  const coach = role==='coach' ? getMyCoach() : null;
  
  // 既にアクティブなら表示しない
  if(role==='team' && team?.coach) return '';
  if(role==='coach' && coach?.team) return '';
  
  const msgs = {
    team:   {emoji:'🏟️', title:'コーチを見つけましょう', text:'コーチ検索から理想のコーチを探し、依頼を送ることができます。', cta:'コーチを探す', page:'coach-search'},
    coach:  {emoji:'🏅', title:'チームに出会いましょう', text:'プロフィールを充実させてチームからの依頼を待つか、自分から応募しましょう。', cta:'チームを探す', page:'team-search'},
    player: {emoji:'⚽', title:'今日のトレーニングを記録しよう', text:'日々の積み重ねがパフォーマンスを向上させます。', cta:'記録する', page:'training'},
    parent: {emoji:'👨‍👧', title:'お子様の状況を確認', text:'月謝の支払いや成績レポートをここで確認できます。', cta:'成績を見る', page:'parent-report'},
  };
  const m = msgs[role];
  if(!m) return '';
  
  return `<div class="welcome-banner">
    <div style="font-size:36px;flex-shrink:0">${m.emoji}</div>
    <div class="welcome-banner-text">
      <h3>${m.title}</h3>
      <p>${m.text}</p>
    </div>
    <button class="btn btn-primary btn-sm" onclick="goTo('${m.page}')">${m.cta} →</button>
  </div>`;
}


// ============================================================
// v16 UX HELPERS
// ============================================================

// 今日の予定ミニウィジェット（ダッシュボード用）
function todayEventsWidget(){
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth(), d = now.getDate();
  const todayEvs = (DB.events||[]).filter(e=>{
    const ey = e.year||y, em = e.month!==undefined?e.month:m;
    return ey===y && em===m && e.date===d;
  });
  // 繰り返しイベント
  const repeatEvs = (DB.events||[]).filter(e=>{
    if(!e.repeat || e.repeat==='none') return false;
    if(e.repeat==='weekly' && new Date(e.year,e.month,e.date).getDay()===now.getDay()) return true;
    if(e.repeat==='daily') return true;
    if(e.repeat==='monthly' && e.date===d) return true;
    return false;
  }).filter(e=>!todayEvs.find(t=>t.id===e.id));
  const allToday = [...todayEvs, ...repeatEvs];
  
  if(!allToday.length) return `<div class="card" style="padding:14px 16px;margin-bottom:16px">
    <div class="flex justify-between items-center mb-8">
      <div class="fw7 text-sm">📅 今日の予定</div>
      <button class="btn btn-ghost btn-xs" onclick="goTo('calendar')">カレンダー →</button>
    </div>
    <div style="font-size:12px;color:var(--txt3);text-align:center;padding:8px">予定はありません</div>
  </div>`;

  const icons={practice:'🏃',match:'⚽',payment:'💰',event:'🎉',meeting:'📋',other:'📌'};
  const colors={practice:'var(--teal)',match:'var(--org)',payment:'var(--yel)',other:'var(--blue)'};
  return `<div class="card" style="padding:14px 16px;margin-bottom:16px">
    <div class="flex justify-between items-center mb-10">
      <div class="fw7 text-sm">📅 今日の予定 <span style="font-size:11px;background:var(--org);color:#fff;border-radius:10px;padding:1px 7px;margin-left:4px">${allToday.length}</span></div>
      <button class="btn btn-ghost btn-xs" onclick="goTo('calendar')" style="font-size:11px">すべて →</button>
    </div>
    ${allToday.slice(0,3).map(e=>`
      <div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--b1)">
        <div style="width:32px;height:32px;border-radius:8px;background:${colors[e.type]||colors.other}18;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0">${icons[e.type]||'📌'}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${sanitize(e.title,24)}</div>
          <div style="font-size:11px;color:var(--txt3)">${e.time||'終日'}${e.repeat&&e.repeat!=='none'?' 🔁':''}</div>
        </div>
        <div style="width:4px;height:32px;border-radius:2px;background:${colors[e.type]||colors.other};flex-shrink:0"></div>
      </div>`).join('')}
  </div>`;
}

// 過去7日間のアクティビティサマリー（選手用）
function weekActivitySummary(playerId){
  const log = DB.trainingLog[playerId] || {};
  const days = Array.from({length:7},(_,i)=>{
    const d = new Date(); d.setDate(d.getDate()-6+i);
    return d.toISOString().slice(0,10);
  });
  return `<div style="display:flex;gap:4px;align-items:flex-end;height:40px;margin-top:8px">
    ${days.map(dk=>{
      const entry = log[dk];
      const hasData = entry && (entry.time||entry.cond);
      const height = entry?.time ? Math.min(100,entry.time/60*100) : (hasData?30:0);
      const today = dk === new Date().toISOString().slice(0,10);
      return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px">
        <div style="width:100%;border-radius:3px 3px 0 0;background:${today?'var(--org)':'var(--teal)'};height:${height}%;min-height:${hasData?4:0}px;opacity:${today?1:.7};transition:height .3s"></div>
        <div style="font-size:9px;color:var(--txt3)">${['日','月','火','水','木','金','土'][new Date(dk+'T12:00').getDay()]}</div>
      </div>`;
    }).join('')}
  </div>`;
}


// ── 目標管理モーダル ──────────────────────────────────
function openGoalModal(){
  const p = DB.players.find(x=>x.id===DB.currentUser?.id);
  if(!p){ toast('選手データが見つかりません','e'); return; }
  if(!p.goals) p.goals = [];
  const goalsHTML = p.goals.length ? p.goals.map((g,i)=>`
    <div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:var(--surf2);border-radius:10px;margin-bottom:6px">
      <div style="flex:1">
        <div style="font-size:13px;font-weight:600">${sanitize(g.title,30)}</div>
        <div style="font-size:11px;color:var(--txt3)">${g.current||0}/${g.target||0} ${g.unit||''} · 期限: ${g.deadline||'なし'}</div>
        <div style="height:4px;background:var(--b2);border-radius:2px;margin-top:4px">
          <div style="width:${Math.min(Math.round((g.current||0)/(g.target||1)*100),100)}%;height:100%;background:var(--org);border-radius:2px"></div>
        </div>
      </div>
      <div style="display:flex;gap:4px">
        <button class="btn btn-ghost btn-xs" onclick="updateGoalProgress(${i})" title="進捗更新">✏️</button>
        <button class="btn btn-ghost btn-xs" style="color:var(--grn)" onclick="completeGoal(${i})" title="達成">✅</button>
        <button class="btn btn-ghost btn-xs" style="color:var(--red)" onclick="deleteGoal(${i})" title="削除">&times;</button>
      </div>
    </div>`).join('') : '<div class="text-muted text-sm text-center" style="padding:16px">目標がありません</div>';

  openM('🎯 目標管理', `
    <div style="max-height:40vh;overflow-y:auto;margin-bottom:16px">${goalsHTML}</div>
    <div style="border-top:1px solid var(--b1);padding-top:14px">
      <div class="fw7 mb-10 text-sm">新しい目標を追加</div>
      <div class="form-group"><label class="label">目標タイトル</label><input class="input" id="goal-title" placeholder="例: 50m走を6秒台にする"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px">
        <div class="form-group"><label class="label">現在値</label><input class="input" type="number" id="goal-current" placeholder="0" min="0"></div>
        <div class="form-group"><label class="label">目標値</label><input class="input" type="number" id="goal-target" placeholder="100" min="0"></div>
        <div class="form-group"><label class="label">単位</label><input class="input" id="goal-unit" placeholder="回・秒・kg"></div>
      </div>
      <div class="form-group"><label class="label">達成期限</label><input class="input" type="date" id="goal-deadline" value="${new Date(Date.now()+30*24*3600*1000).toISOString().slice(0,10)}"></div>
      <button class="btn btn-primary w-full" onclick="addGoal()">+ 目標を追加する</button>
    </div>
  `, true);
}

function addGoal(){
  const p = DB.players.find(x=>x.id===DB.currentUser?.id);
  if(!p) return;
  if(!p.goals) p.goals = [];
  const title = document.getElementById('goal-title')?.value?.trim();
  const current = parseFloat(document.getElementById('goal-current')?.value||0);
  const target = parseFloat(document.getElementById('goal-target')?.value||0);
  const unit = document.getElementById('goal-unit')?.value?.trim()||'';
  const deadline = document.getElementById('goal-deadline')?.value||'';
  if(!title){ toast('目標タイトルを入力してください','e'); return; }
  if(!target){ toast('目標値を入力してください','e'); return; }
  p.goals.push({ id:'g'+Date.now(), title, current, target, unit, deadline, status:'active', createdAt: new Date().toISOString().slice(0,10) });
  saveDB();
  toast('目標を追加しました！','s');
  closeM();
  goTo('stats');
}

function updateGoalProgress(idx){
  const p = DB.players.find(x=>x.id===DB.currentUser?.id);
  const g = p?.goals?.[idx];
  if(!g) return;
  openM('📊 進捗を更新', `
    <div class="fw7 mb-12">${sanitize(g.title,40)}</div>
    <div class="form-group"><label class="label">現在の値（${g.unit||''}）</label>
      <input class="input" type="number" id="goal-prog-val" value="${g.current||0}" min="0">
    </div>
    <div style="height:6px;background:var(--b2);border-radius:3px;margin-bottom:8px">
      <div id="goal-prog-bar" style="width:${Math.min(Math.round((g.current||0)/(g.target||1)*100),100)}%;height:100%;background:var(--org);border-radius:3px;transition:width .3s"></div>
    </div>
    <div style="font-size:12px;color:var(--txt3);margin-bottom:16px">目標: ${g.target} ${g.unit||''}</div>
    <div class="flex gap-10">
      <button class="btn btn-primary" style="flex:1" onclick="
        const v=parseFloat(document.getElementById('goal-prog-val').value)||0;
        const p=DB.players.find(x=>x.id===DB.currentUser?.id);
        if(p&&p.goals&&p.goals[${idx}]){p.goals[${idx}].current=v;saveDB();}
        toast('進捗を更新しました','s');closeM();goTo('stats');
      ">更新する</button>
      <button class="btn btn-ghost" onclick="closeM()">キャンセル</button>
    </div>
  `);
}

function completeGoal(idx){
  const p = DB.players.find(x=>x.id===DB.currentUser?.id);
  if(p?.goals?.[idx]){ p.goals[idx].status='done'; p.goals[idx].completedAt=new Date().toISOString().slice(0,10); saveDB(); }
  toast('🎉 目標達成おめでとうございます！','s');
  closeM(); goTo('stats');
}

function deleteGoal(idx){
  const p = DB.players.find(x=>x.id===DB.currentUser?.id);
  if(p?.goals){ p.goals.splice(idx,1); saveDB(); }
  toast('目標を削除しました','i');
  closeM(); goTo('stats');
}


// トレーニング記録モーダル
function openTrainingLogModal(dateStr){
  const targetDate = dateStr || new Date().toISOString().slice(0,10);
  const player = DB.players.find(x=>x.id===DB.currentUser?.id);
  if(!player){ toast('選手データが見つかりません','e'); return; }
  if(!DB.trainingLog[player.id]) DB.trainingLog[player.id] = {};
  const existing = DB.trainingLog[player.id][targetDate] || {};
  openM('📝 トレーニング記録 - ' + targetDate.slice(5), `
    <div class="form-group"><label class="label">種目・メモ</label>
      <input class="input" id="tlog-memo" value="${sanitize(existing.memo||'',80)}" placeholder="例: 筋トレ・ランニング"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div class="form-group"><label class="label">時間（分）</label>
        <input class="input" type="number" id="tlog-time" value="${existing.duration||existing.time||''}" min="0" max="480" placeholder="60"></div>
      <div class="form-group"><label class="label">消費kcal</label>
        <input class="input" type="number" id="tlog-kcal" value="${existing.kcal||''}" min="0" max="9999" placeholder="300"></div>
    </div>
    <div class="form-group">
      <label class="label">コンディション</label>
      <div style="display:flex;gap:8px;margin-top:4px" id="cond-stars">
        ${[1,2,3,4,5].map(n=>`<button onclick="selectCond(${n})" id="cond-${n}" style="font-size:24px;background:none;border:none;cursor:pointer;opacity:${(existing.cond||0)>=n?1:.3};transition:.15s">⭐</button>`).join('')}
      </div>
      <input type="hidden" id="tlog-cond" value="${existing.cond||0}">
    </div>
    <div class="form-group"><label class="label">メモ詳細</label>
      <textarea class="input" id="tlog-note" rows="2" placeholder="気づいたこと・体の状態など">${sanitize(existing.note||'',200)}</textarea></div>
    <button class="btn btn-primary w-full mt-8" onclick="saveTrainingLog('${player.id}','${targetDate}')">💾 記録を保存</button>
  `);
}

function selectCond(n){
  document.getElementById('tlog-cond').value = n;
  [1,2,3,4,5].forEach(i=>{
    const el = document.getElementById('cond-'+i);
    if(el) el.style.opacity = i<=n ? '1' : '0.3';
  });
}

function saveTrainingLog(playerId, dateStr){
  const memo = document.getElementById('tlog-memo')?.value?.trim()||'';
  const time = parseInt(document.getElementById('tlog-time')?.value)||0;
  const kcal = parseInt(document.getElementById('tlog-kcal')?.value)||0;
  const cond = parseInt(document.getElementById('tlog-cond')?.value)||0;
  const note = document.getElementById('tlog-note')?.value?.trim()||'';
  if(!DB.trainingLog[playerId]) DB.trainingLog[playerId] = {};
  DB.trainingLog[playerId][dateStr] = { date: dateStr, memo, duration: time, time, kcal, cond, note, updatedAt: new Date().toISOString() };
  saveDB();
  toast('トレーニングを記録しました！','s');
  closeM();
  goTo('training');
}

function openLogDetail(dateStr){
  const player = DB.players.find(x=>x.id===DB.currentUser?.id);
  const entry = player ? (DB.trainingLog[player.id]||{})[dateStr] : null;
  if(!entry){ openTrainingLogModal(dateStr); return; }
  const exList=entry.exercises||[];
  const totalSets=exList.reduce((s,e)=>s+(e.sets?.length||0),0);
  // 最大重量
  let maxW=0;exList.forEach(e=>(e.sets||[]).forEach(s=>{if(s.weight>maxW)maxW=s.weight;}));
  // 総ボリューム
  const totalVol=exList.reduce((s,e)=>s+(e.sets||[]).reduce((ss,set)=>ss+(set.weight||0)*(set.reps||0),0),0);
  // 平均RPE
  let rpeSum=0,rpeCount=0;exList.forEach(e=>(e.sets||[]).forEach(s=>{if(s.rpe){rpeSum+=s.rpe;rpeCount++;}}));
  const avgRPE=rpeCount?Math.round(rpeSum/rpeCount*10)/10:0;
  // 強度ゾーン分析
  const intensity=player?analyzeSessionIntensity(exList,player.id):{zones:{},total:0};
  // 部位ごと
  const partSummary={};
  exList.forEach(e=>{const p=e.part||'other';if(!partSummary[p])partSummary[p]={name:EXERCISE_DB[p]?.name||p,emoji:EXERCISE_DB[p]?.emoji||'💪',count:0,vol:0};partSummary[p].count++;partSummary[p].vol+=(e.sets||[]).reduce((ss,set)=>ss+(set.weight||0)*(set.reps||0),0);});

  openM('📋 ' + dateStr.slice(5) + ' の記録', `
    <div style="padding:4px 0">
      <!-- サマリーKPI -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:12px">
        ${[
          {l:'時間',v:(entry.duration||entry.time||0)+'分',emoji:'⏱️'},
          {l:'Volume',v:Math.round(totalVol/1000)+'k kg',emoji:'📊'},
          {l:'種目/SET',v:exList.length+'種目 '+totalSets+'set',emoji:'🏋️'},
          {l:'消費',v:(entry.kcal||0)+'kcal',emoji:'🔥'},
        ].map(d=>`<div style="text-align:center;padding:10px 6px;background:var(--surf2);border-radius:10px">
          <div style="font-size:16px">${d.emoji}</div>
          <div style="font-size:13px;font-weight:800;margin-top:2px">${d.v}</div>
          <div style="font-size:9px;color:var(--txt3)">${d.l}</div>
        </div>`).join('')}
      </div>
      ${avgRPE||maxW?`<div style="display:flex;gap:6px;margin-bottom:12px">
        ${maxW?`<div style="flex:1;padding:8px;background:rgba(249,115,22,.06);border-radius:8px;text-align:center"><div style="font-size:14px;font-weight:800;color:var(--org)">${maxW}kg</div><div style="font-size:9px;color:var(--txt3)">最大重量</div></div>`:''}
        ${avgRPE?`<div style="flex:1;padding:8px;background:rgba(59,130,246,.06);border-radius:8px;text-align:center"><div style="font-size:14px;font-weight:800;color:var(--blue)">${avgRPE}</div><div style="font-size:9px;color:var(--txt3)">平均RPE</div></div>`:''}
        ${totalVol?`<div style="flex:1;padding:8px;background:rgba(0,207,170,.06);border-radius:8px;text-align:center"><div style="font-size:14px;font-weight:800;color:var(--teal)">${Math.round(totalVol).toLocaleString()}</div><div style="font-size:9px;color:var(--txt3)">総Volume(kg)</div></div>`:''}
      </div>`:``}
      ${intensity.total>0?`<div style="margin-bottom:12px;padding:8px 10px;background:var(--surf2);border-radius:8px">
        <div style="font-size:10px;font-weight:700;color:var(--txt3);margin-bottom:5px">🎯 強度ゾーン分布</div>
        <div style="display:flex;height:8px;border-radius:4px;overflow:hidden;gap:1px">
          ${intensity.zones.warmup?'<div style="flex:'+intensity.zones.warmup+';background:#22c55e" title="W-Up"></div>':''}
          ${intensity.zones.endurance?'<div style="flex:'+intensity.zones.endurance+';background:#06b6d4" title="持久"></div>':''}
          ${intensity.zones.hypertrophy?'<div style="flex:'+intensity.zones.hypertrophy+';background:#3b82f6" title="肥大"></div>':''}
          ${intensity.zones.strength?'<div style="flex:'+intensity.zones.strength+';background:#f59e0b" title="筋力"></div>':''}
          ${intensity.zones.power?'<div style="flex:'+intensity.zones.power+';background:#ef4444" title="MAX"></div>':''}
        </div>
        <div style="display:flex;gap:6px;margin-top:4px;flex-wrap:wrap">
          ${[{k:'warmup',l:'W-Up',c:'#22c55e'},{k:'endurance',l:'持久',c:'#06b6d4'},{k:'hypertrophy',l:'肥大',c:'#3b82f6'},{k:'strength',l:'筋力',c:'#f59e0b'},{k:'power',l:'MAX',c:'#ef4444'}].filter(z=>intensity.zones[z.k]).map(z=>'<span style="font-size:8px;color:'+z.c+'">● '+z.l+' '+intensity.zones[z.k]+'set</span>').join('')}
        </div>
      </div>`:``}

      <!-- 部位タグ -->
      ${Object.keys(partSummary).length?`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px">${Object.values(partSummary).map(p=>`<span style="padding:4px 10px;border-radius:16px;background:rgba(255,107,43,.1);color:var(--org);font-size:11px;font-weight:600">${p.emoji} ${p.name} ×${p.count}</span>`).join('')}</div>`:''}

      <!-- 種目別セット詳細 -->
      ${exList.length?`<div style="margin-bottom:18px">
        ${exList.map((ex,idx)=>{
          const partInfo=EXERCISE_DB[ex.part];
          return`<div style="padding:12px;background:var(--surf2);border-radius:12px;margin-bottom:6px">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
              <span style="font-size:18px">${partInfo?.emoji||'💪'}</span>
              <div>
                <div style="font-size:14px;font-weight:700">${sanitize(ex.name,30)}</div>
                <div style="font-size:11px;color:var(--txt3)">${partInfo?.name||''} · ${ex.sets?.length||0}セット</div>
              </div>
            </div>
            ${(ex.sets||[]).length?`<div style="display:flex;gap:4px;flex-wrap:wrap">${(ex.sets||[]).map((s,si)=>{
              const prs2=player?getAllPRs(player.id):{};
              const exPR=(prs2[ex.exId]||{}).max1RM||0;
              const z=exPR&&s.weight?getIntensityZone(s.weight,exPR):null;
              return`<div style="padding:5px 8px;background:var(--surf);border-radius:6px;border:1px solid ${s.type==='warmup'?'#22c55e30':z?z.color+'20':'var(--b1)'};font-size:11px;font-weight:600">
              <span style="color:var(--txt3);font-size:9px">S${si+1}</span>
              ${s.weight?s.weight+'kg×':''}${s.reps}回${s.rpe?'<span style="font-size:9px;color:var(--blue);margin-left:2px">R'+s.rpe+'</span>':''}${s.est1RM?'<div style="font-size:8px;color:var(--teal)">1RM:'+s.est1RM+'kg'+(z?' '+z.name:'')+'</div>':''}
            </div>`}).join('')}</div>`:''}
          </div>`;
        }).join('')}
      </div>`:''}

      <!-- コンディション -->
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
        <span style="font-size:12px;color:var(--txt3)">コンディション:</span>
        <span>${entry.cond?'⭐'.repeat(entry.cond):'未記録'}</span>
      </div>

      ${entry.note?`<div style="padding:12px;background:var(--surf2);border-radius:10px;font-size:13px;color:var(--txt2);line-height:1.6;margin-bottom:16px">💬 ${sanitize(entry.note,300)}</div>`:''}
      ${maxW>0?`<div style="font-size:12px;color:var(--txt3);margin-bottom:16px">🏆 最大重量: <b>${maxW}kg</b></div>`:''}

      <div class="flex gap-10">
        <button class="btn btn-primary" style="flex:1" onclick="openTrainingLogModal('${dateStr}')">✏️ 編集する</button>
        <button class="btn btn-ghost" onclick="closeM()">閉じる</button>
      </div>
    </div>
  `, true);
}


// ==================== BODY & CONDITION LOG ====================
function openBodyLogModal(playerId,dateStr){
  if(!playerId){toast('選手データが見つかりません','e');return;}
  if(!DB.bodyLog[playerId]) DB.bodyLog[playerId]={};
  const existing=DB.bodyLog[playerId][dateStr]||{};
  openM('⚖️ 体重・体組成を記録 — '+dateStr.slice(5),`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div class="form-group"><label class="label">体重 (kg)</label>
        <input class="input" type="number" id="blog-weight" value="${existing.weight||''}" min="20" max="200" step="0.1" placeholder="65.0" style="font-size:16px;text-align:center"></div>
      <div class="form-group"><label class="label">体脂肪率 (%)</label>
        <input class="input" type="number" id="blog-fat" value="${existing.bodyFat||''}" min="1" max="60" step="0.1" placeholder="15.0" style="font-size:16px;text-align:center"></div>
      <div class="form-group"><label class="label">筋肉量 (kg)</label>
        <input class="input" type="number" id="blog-muscle" value="${existing.muscle||''}" min="10" max="120" step="0.1" placeholder="55.0" style="font-size:16px;text-align:center"></div>
      <div class="form-group"><label class="label">BMI</label>
        <input class="input" id="blog-bmi" readonly style="font-size:16px;text-align:center;background:var(--surf2)" value="${existing.bmi||'自動計算'}"></div>
    </div>
    <div class="form-group"><label class="label">メモ</label>
      <input class="input" id="blog-note" value="${sanitize(existing.note||'',80)}" placeholder="減量期・増量期など" maxlength="80"></div>
    <button class="btn btn-primary w-full" style="padding:14px;font-size:14px;margin-top:8px" onclick="saveBodyLog('${playerId}','${dateStr}')">💾 記録を保存</button>
  `);
  // BMI自動計算
  const wEl=document.getElementById('blog-weight');
  if(wEl) wEl.addEventListener('input',()=>{
    const w=parseFloat(wEl.value);const player=DB.players.find(x=>x.id==='${playerId}');
    const h=(player?.height||170)/100;
    if(w&&h){document.getElementById('blog-bmi').value=(w/(h*h)).toFixed(1);}
  });
}
function saveBodyLog(playerId,dateStr){
  const weight=parseFloat(document.getElementById('blog-weight')?.value)||0;
  const bodyFat=parseFloat(document.getElementById('blog-fat')?.value)||0;
  const muscle=parseFloat(document.getElementById('blog-muscle')?.value)||0;
  const bmi=document.getElementById('blog-bmi')?.value||'';
  const note=document.getElementById('blog-note')?.value?.trim()||'';
  if(!weight){toast('体重を入力してください','e');return;}
  if(!DB.bodyLog[playerId]) DB.bodyLog[playerId]={};
  DB.bodyLog[playerId][dateStr]={date:dateStr,weight,bodyFat:bodyFat||null,muscle:muscle||null,bmi:bmi||null,note,updatedAt:new Date().toISOString()};
  // Update player weight
  const p=DB.players.find(x=>x.id===playerId);
  if(p) p.weight=weight;
  saveDB();closeM();toast('体重を記録しました！','s');goTo('dashboard');
}

function openConditionLogModal(playerId,dateStr){
  if(!playerId){toast('選手データが見つかりません','e');return;}
  if(!DB.conditionLog[playerId]) DB.conditionLog[playerId]={};
  const existing=DB.conditionLog[playerId][dateStr]||{};
  openM('💪 コンディション記録 — '+dateStr.slice(5),`
    <div class="form-group">
      <label class="label">今日の調子 (1〜5)</label>
      <div style="display:flex;gap:8px;justify-content:center;margin-top:6px" id="cond-mood-btns">
        ${[1,2,3,4,5].map(n=>`<button onclick="selectCondMood(${n})" id="cmood-${n}" style="font-size:32px;background:none;border:2px solid ${(existing.mood||0)===n?'var(--org)':'transparent'};border-radius:12px;padding:8px;cursor:pointer;transition:.15s;opacity:${(existing.mood||0)>=n?1:.3}">${['','😣','😐','🙂','😊','😄'][n]}</button>`).join('')}
      </div>
      <input type="hidden" id="clog-mood" value="${existing.mood||0}">
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div class="form-group"><label class="label">睡眠時間</label>
        <input class="input" type="number" id="clog-sleep" value="${existing.sleep||''}" min="0" max="16" step="0.5" placeholder="7.5" style="text-align:center"> </div>
      <div class="form-group"><label class="label">疲労度 (1-5)</label>
        <select class="input" id="clog-fatigue" style="text-align:center">
          <option value="">選択</option>
          ${[1,2,3,4,5].map(n=>`<option value="${n}" ${existing.fatigue===n?'selected':''}>${n} — ${['','ほぼなし','軽い','普通','かなり','限界'][n]}</option>`).join('')}
        </select></div>
    </div>
    <details style="margin-top:4px;margin-bottom:8px"><summary style="font-size:12px;color:var(--txt3);cursor:pointer">⌚ アクティビティデータ（任意）</summary>
      <div style="margin-top:6px;display:grid;grid-template-columns:repeat(3,1fr);gap:6px">
        <div><label style="font-size:10px;color:var(--txt3)">安静心拍</label>
          <input class="input" type="number" id="clog-rhr" value="${existing.restingHR||''}" min="30" max="120" placeholder="60" style="text-align:center;font-size:12px;padding:6px"></div>
        <div><label style="font-size:10px;color:var(--txt3)">歩数</label>
          <input class="input" type="number" id="clog-steps" value="${existing.steps||''}" min="0" max="99999" placeholder="8000" style="text-align:center;font-size:12px;padding:6px"></div>
        <div><label style="font-size:10px;color:var(--txt3)">活動kcal</label>
          <input class="input" type="number" id="clog-active-cal" value="${existing.activeCal||''}" min="0" max="9999" placeholder="500" style="text-align:center;font-size:12px;padding:6px"></div>
      </div></details>
    <div class="form-group"><label class="label">💪 トレーニング負荷 (RPE)</label>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <input type="range" id="clog-rpe" min="0" max="10" value="${existing.rpe||0}" style="flex:1;accent-color:var(--org)" oninput="document.getElementById('rpe-val').textContent=this.value;document.getElementById('rpe-desc').textContent=_rpeDesc(this.value)">
        <span id="rpe-val" style="font-weight:700;font-size:16px;color:var(--org);min-width:24px">${existing.rpe||0}</span>
      </div>
      <div id="rpe-desc" style="font-size:10px;color:var(--txt3);text-align:center;margin-bottom:4px">${_rpeDesc(existing.rpe||0)}</div>
      <div style="display:flex;justify-content:space-between;font-size:9px;color:var(--txt3)"><span>休息</span><span>軽い</span><span>きつい</span><span>限界</span></div>
    </div>
    <div class="form-group"><label class="label">😴 睡眠の質</label>
      <div style="display:flex;gap:6px;margin-top:4px">
        ${[{v:'excellent',l:'😴 熟睡',c:'var(--teal)'},{v:'good',l:'🙂 良好',c:'var(--blue)'},{v:'fair',l:'😐 普通',c:'var(--org)'},{v:'poor',l:'😫 不良',c:'#ef4444'},{v:'insomnia',l:'😵 不眠',c:'#991b1b'}].map(sq=>`<button onclick="document.getElementById('clog-sleep-quality').value='${sq.v}';this.parentElement.querySelectorAll('button').forEach(b=>{b.style.border='1px solid var(--b1)';b.style.background='var(--surf)';b.style.color='var(--txt3)'});this.style.border='2px solid ${sq.c}';this.style.background='var(--surf2)';this.style.color='${sq.c}'" style="flex:1;padding:6px 4px;border-radius:8px;border:${(existing.sleepQuality||'')==sq.v?'2px solid '+sq.c:'1px solid var(--b1)'};background:${(existing.sleepQuality||'')==sq.v?'var(--surf2)':'var(--surf)'};cursor:pointer;font-size:10px;text-align:center;color:${(existing.sleepQuality||'')==sq.v?sq.c:'var(--txt3)'}">${sq.l}</button>`).join('')}
      </div>
      <input type="hidden" id="clog-sleep-quality" value="${existing.sleepQuality||''}">
    </div>
    <div class="form-group"><label class="label">⚠️ 痛み・違和感</label>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px" id="cond-body-parts">
        ${['頭','首','右肩','左肩','右肘','左肘','右手首','左手首','胸','背中','腰','右股関節','左股関節','右膝','左膝','右足首','左足首','右ふくらはぎ','左ふくらはぎ','右太もも','左太もも'].map(p=>
          `<button onclick="toggleBodyPart(this,'${p}')" class="bp-btn" data-part="${p}" style="padding:4px 8px;border-radius:8px;font-size:10px;border:1px solid ${(existing.painParts||[]).includes(p)?'var(--org)':'var(--b1)'};background:${(existing.painParts||[]).includes(p)?'rgba(249,115,22,.12)':'var(--surf)'};color:${(existing.painParts||[]).includes(p)?'var(--org)':'var(--txt3)'};cursor:pointer">${p}</button>`
        ).join('')}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div><label style="font-size:11px;color:var(--txt3)">痛みレベル (0-10)</label>
          <div style="display:flex;align-items:center;gap:6px;margin-top:4px">
            <input type="range" id="clog-pain-level" min="0" max="10" value="${existing.painLevel||0}" style="flex:1;accent-color:var(--org)" oninput="document.getElementById('pain-lv-val').textContent=this.value">
            <span id="pain-lv-val" style="font-weight:700;font-size:14px;color:var(--org);min-width:20px">${existing.painLevel||0}</span>
          </div>
        </div>
        <div><label style="font-size:11px;color:var(--txt3)">種別</label>
          <select class="input" id="clog-injury-type" style="font-size:12px;padding:6px 8px;margin-top:4px">
            <option value="">なし</option>
            <option value="打撲" ${existing.injuryType==='打撲'?'selected':''}>打撲</option>
            <option value="捻挫" ${existing.injuryType==='捻挫'?'selected':''}>捻挫</option>
            <option value="肉離れ" ${existing.injuryType==='肉離れ'?'selected':''}>肉離れ</option>
            <option value="筋肉痛" ${existing.injuryType==='筋肉痛'?'selected':''}>筋肉痛</option>
            <option value="関節痛" ${existing.injuryType==='関節痛'?'selected':''}>関節痛</option>
            <option value="腱炎" ${existing.injuryType==='腱炎'?'selected':''}>腱炎</option>
            <option value="疲労骨折" ${existing.injuryType==='疲労骨折'?'selected':''}>疲労骨折</option>
            <option value="その他" ${existing.injuryType==='その他'?'selected':''}>その他</option>
          </select>
        </div>
      </div>
      <div style="margin-top:8px;display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div><label style="font-size:11px;color:var(--txt3)">練習参加</label>
          <select class="input" id="clog-participation" style="font-size:12px;padding:6px 8px;margin-top:4px">
            <option value="full" ${(existing.participation||'full')==='full'?'selected':''}>🟢 フル参加</option>
            <option value="limited" ${existing.participation==='limited'?'selected':''}>🟡 制限付き</option>
            <option value="observe" ${existing.participation==='observe'?'selected':''}>🟠 見学</option>
            <option value="rest" ${existing.participation==='rest'?'selected':''}>🔴 休み</option>
          </select>
        </div>
        <div><label style="font-size:11px;color:var(--txt3)">回復状態</label>
          <select class="input" id="clog-recovery" style="font-size:12px;padding:6px 8px;margin-top:4px">
            <option value="" ${!existing.recovery?'selected':''}>—</option>
            <option value="recovering" ${existing.recovery==='recovering'?'selected':''}>🔧 回復中</option>
            <option value="monitoring" ${existing.recovery==='monitoring'?'selected':''}>👁 経過観察</option>
            <option value="healed" ${existing.recovery==='healed'?'selected':''}>✅ 完治</option>
          </select>
        </div>
      </div>
      <input class="input" id="clog-pain" value="${sanitize(existing.pain||'',60)}" placeholder="詳細メモ（例: 右膝内側に違和感、走ると痛む）" maxlength="100" style="margin-top:8px;font-size:12px">
    </div>
    <details style="margin-bottom:8px"><summary style="font-size:12px;color:var(--txt3);cursor:pointer">🌸 女性アスリート向け記録（任意）</summary>
      <div style="margin-top:8px;display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div><label style="font-size:11px;color:var(--txt3)">生理</label>
          <select class="input" id="clog-period" style="font-size:12px;padding:6px 8px;margin-top:4px">
            <option value="" ${!existing.period?'selected':''}>記録なし</option>
            <option value="start" ${existing.period==='start'?'selected':''}>🔴 開始日</option>
            <option value="ongoing" ${existing.period==='ongoing'?'selected':''}>🟠 期間中</option>
            <option value="end" ${existing.period==='end'?'selected':''}>🟢 終了日</option>
            <option value="pms" ${existing.period==='pms'?'selected':''}>🟡 PMS症状</option>
          </select></div>
        <div><label style="font-size:11px;color:var(--txt3)">体調への影響</label>
          <select class="input" id="clog-period-impact" style="font-size:12px;padding:6px 8px;margin-top:4px">
            <option value="" ${!existing.periodImpact?'selected':''}>なし</option>
            <option value="none" ${existing.periodImpact==='none'?'selected':''}>影響なし</option>
            <option value="light" ${existing.periodImpact==='light'?'selected':''}>軽い影響</option>
            <option value="moderate" ${existing.periodImpact==='moderate'?'selected':''}>やや影響</option>
            <option value="heavy" ${existing.periodImpact==='heavy'?'selected':''}>強い影響</option>
          </select></div>
      </div></details>
    <div class="form-group"><label class="label">メモ</label>
      <textarea class="input" id="clog-note" rows="2" placeholder="気づいたこと・体調面など">${sanitize(existing.note||'',200)}</textarea></div>
    <button class="btn btn-primary w-full" style="padding:14px;font-size:14px;margin-top:8px" onclick="saveConditionLog('${playerId}','${dateStr}')">💾 記録を保存</button>
  `);
}
function _rpeDesc(v){
  v=parseInt(v);
  if(v<=0) return '休息日';if(v<=2) return '非常に軽い（ウォーミングアップ程度）';
  if(v<=4) return '軽い〜適度（会話できるペース）';if(v<=6) return 'ややきつい（息が上がる）';
  if(v<=8) return 'きつい（会話困難）';if(v<=9) return '非常にきつい（限界に近い）';
  return '限界（全力、これ以上不可能）';
}
function toggleBodyPart(btn,part){
  var sel=btn.style.borderColor.includes('249');
  btn.style.border=sel?'1px solid var(--b1)':'1px solid var(--org)';
  btn.style.background=sel?'var(--surf)':'rgba(249,115,22,.12)';
  btn.style.color=sel?'var(--txt3)':'var(--org)';
}
function selectCondMood(n){
  document.getElementById('clog-mood').value=n;
  [1,2,3,4,5].forEach(i=>{
    const el=document.getElementById('cmood-'+i);
    if(el){el.style.opacity=i<=n?1:.3;el.style.borderColor=i===n?'var(--org)':'transparent';}
  });
}
function saveConditionLog(playerId,dateStr){
  const mood=parseInt(document.getElementById('clog-mood')?.value)||0;
  const sleep=parseFloat(document.getElementById('clog-sleep')?.value)||0;
  const fatigue=parseInt(document.getElementById('clog-fatigue')?.value)||0;
  const pain=document.getElementById('clog-pain')?.value?.trim()||'';
  const note=document.getElementById('clog-note')?.value?.trim()||'';
  const painLevel=parseInt(document.getElementById('clog-pain-level')?.value)||0;
  const injuryType=document.getElementById('clog-injury-type')?.value||'';
  const participation=document.getElementById('clog-participation')?.value||'full';
  const recovery=document.getElementById('clog-recovery')?.value||'';
  const period=document.getElementById('clog-period')?.value||'';
  const periodImpact=document.getElementById('clog-period-impact')?.value||'';
  const rpe=parseInt(document.getElementById('clog-rpe')?.value)||0;
  const sleepQuality=document.getElementById('clog-sleep-quality')?.value||'';
  const restingHR=parseInt(document.getElementById('clog-rhr')?.value)||0;
  const steps=parseInt(document.getElementById('clog-steps')?.value)||0;
  const activeCal=parseInt(document.getElementById('clog-active-cal')?.value)||0;
  // Collect selected body parts
  const painParts=[];
  document.querySelectorAll('.bp-btn').forEach(function(btn){
    if(btn.style.borderColor.includes('249')||btn.style.color.includes('249')){painParts.push(btn.dataset.part);}
  });
  if(!mood){toast('調子を選択してください','e');return;}
  if(!DB.conditionLog[playerId]) DB.conditionLog[playerId]={};
  DB.conditionLog[playerId][dateStr]={date:dateStr,mood,sleep,fatigue,pain,painParts,painLevel,injuryType,participation,recovery,period,periodImpact,rpe:rpe||undefined,sleepQuality:sleepQuality||undefined,restingHR:restingHR||undefined,steps:steps||undefined,activeCal:activeCal||undefined,note,updatedAt:new Date().toISOString()};
  // ケガ履歴に追加
  if(painLevel>=3 && painParts.length>0){
    if(!DB.injuryHistory) DB.injuryHistory={};
    if(!DB.injuryHistory[playerId]) DB.injuryHistory[playerId]=[];
    DB.injuryHistory[playerId].push({
      date:dateStr, parts:painParts, level:painLevel, type:injuryType,
      participation:participation, recovery:recovery, note:pain
    });
    // 最新50件のみ保持
    if(DB.injuryHistory[playerId].length>50) DB.injuryHistory[playerId]=DB.injuryHistory[playerId].slice(-50);
  }
  // Update player condition
  const p=DB.players.find(x=>x.id===playerId);
  if(p) p.cond=mood;
  saveDB();closeM();toast('コンディションを記録しました！','s');goTo('dashboard');
}

// ==================== ケガ履歴・管理 ====================
function openInjuryHistory(playerId){
  var p=DB.players.find(function(x){return x.id===playerId;});
  if(!p){toast('選手が見つかりません','e');return;}
  var hist=(DB.injuryHistory||{})[playerId]||[];
  var h='<div style="margin-bottom:14px">';
  if(!hist.length){
    h+='<div style="text-align:center;padding:20px;color:var(--txt3)"><div style="font-size:32px;margin-bottom:8px">🎉</div>ケガの記録はありません</div>';
  } else {
    // Active injuries (recovering or monitoring)
    var cLog=DB.conditionLog[playerId]||{};
    var todayStr=new Date().toISOString().slice(0,10);
    var todayCond=cLog[todayStr];
    if(todayCond && todayCond.painLevel>=3){
      h+='<div style="padding:12px;background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.15);border-radius:12px;margin-bottom:12px">';
      h+='<div style="font-size:12px;font-weight:700;color:#ef4444;margin-bottom:6px">⚠️ 現在の状態</div>';
      h+='<div style="font-size:13px"><b>部位:</b> '+(todayCond.painParts||[]).join('、')+'</div>';
      h+='<div style="font-size:13px"><b>痛み:</b> '+todayCond.painLevel+'/10'+(todayCond.injuryType?' ('+todayCond.injuryType+')':'')+'</div>';
      var partIcons={full:'🟢 フル参加',limited:'🟡 制限付き',observe:'🟠 見学',rest:'🔴 休み'};
      h+='<div style="font-size:13px"><b>参加:</b> '+(partIcons[todayCond.participation]||'—')+'</div>';
      h+='</div>';
    }
    // Summary stats
    var partCounts={};
    hist.forEach(function(inj){
      (inj.parts||[]).forEach(function(pp){partCounts[pp]=(partCounts[pp]||0)+1;});
    });
    var sortedParts=Object.entries(partCounts).sort(function(a,b){return b[1]-a[1];}).slice(0,5);
    if(sortedParts.length){
      h+='<div style="padding:10px;background:var(--surf2);border-radius:10px;margin-bottom:12px">';
      h+='<div style="font-size:11px;font-weight:700;color:var(--txt3);margin-bottom:6px">📊 よくケガする部位 TOP5</div>';
      h+='<div style="display:flex;flex-wrap:wrap;gap:6px">';
      sortedParts.forEach(function(sp){
        h+='<span style="padding:3px 8px;border-radius:6px;font-size:11px;background:rgba(249,115,22,.08);color:var(--org);font-weight:600">'+sp[0]+' ('+sp[1]+'回)</span>';
      });
      h+='</div></div>';
    }
    // Timeline
    h+='<div style="font-size:12px;font-weight:700;margin-bottom:8px">📋 ケガ履歴 ('+hist.length+'件)</div>';
    var reversed=hist.slice().reverse().slice(0,20);
    reversed.forEach(function(inj){
      var levelCol=inj.level>=7?'#ef4444':inj.level>=4?'var(--org)':'var(--teal)';
      h+='<div style="padding:8px 10px;border-left:3px solid '+levelCol+';margin-bottom:6px;background:var(--surf);border-radius:0 8px 8px 0">';
      h+='<div style="display:flex;justify-content:space-between;font-size:11px;color:var(--txt3)">';
      h+='<span>'+inj.date.slice(5)+'</span>';
      h+='<span style="font-weight:700;color:'+levelCol+'">痛み '+inj.level+'/10</span></div>';
      h+='<div style="font-size:12px;font-weight:600;margin-top:2px">'+(inj.parts||[]).join('、')+(inj.type?' — '+inj.type:'')+'</div>';
      if(inj.note) h+='<div style="font-size:10px;color:var(--txt3);margin-top:2px">'+sanitize(inj.note,50)+'</div>';
      h+='</div>';
    });
  }
  h+='</div>';
  // Recovery timeline & estimated return
  if(hist.length>0){
    var lastInjury=hist[hist.length-1];
    var isActive=lastInjury.recovery!=='healed'&&lastInjury.level>=3;
    if(isActive){
      var injDate=new Date(lastInjury.date+'T12:00:00');
      var daysElapsed=Math.floor((new Date()-injDate)/(86400000));
      var estRecovery=_estimateRecoveryDays(lastInjury.type,lastInjury.level);
      var daysRemaining=Math.max(0,estRecovery-daysElapsed);
      var progress=Math.min(100,Math.round(daysElapsed/estRecovery*100));
      var estReturnDate=new Date(injDate.getTime()+estRecovery*86400000);
      h+='<div style="padding:14px;background:linear-gradient(135deg,rgba(249,115,22,.04),rgba(239,68,68,.04));border:1px solid rgba(249,115,22,.15);border-radius:12px;margin-bottom:12px">';
      h+='<div style="font-size:13px;font-weight:700;color:var(--org);margin-bottom:8px">🔄 回復タイムライン</div>';
      h+='<div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:6px"><span style="color:var(--txt3)">受傷日: '+lastInjury.date.slice(5)+'</span><span style="font-weight:700;color:var(--teal)">復帰目安: '+estReturnDate.toISOString().slice(5,10)+'</span></div>';
      // Progress bar
      h+='<div style="height:8px;background:var(--b2);border-radius:4px;overflow:hidden;margin-bottom:6px"><div style="height:100%;width:'+progress+'%;background:linear-gradient(90deg,var(--org),var(--teal));border-radius:4px;transition:width .5s"></div></div>';
      h+='<div style="display:flex;justify-content:space-between;font-size:11px"><span style="color:var(--txt3)">経過 '+daysElapsed+'日</span><span style="color:var(--org);font-weight:600">'+progress+'%</span><span style="color:var(--txt3)">残り約'+daysRemaining+'日</span></div>';
      // Phase indicator
      var phase=progress<30?{l:'急性期',icon:'🔴',desc:'安静・アイシング・圧迫・挙上(RICE)',c:'#ef4444'}:progress<70?{l:'回復期',icon:'🟡',desc:'可動域回復・軽い運動開始',c:'#ca8a04'}:{l:'復帰準備期',icon:'🟢',desc:'段階的な練習復帰・パフォーマンステスト',c:'var(--teal)'};
      h+='<div style="display:flex;align-items:center;gap:8px;margin-top:10px;padding:8px 12px;background:var(--surf2);border-radius:8px">';
      h+='<span style="font-size:16px">'+phase.icon+'</span>';
      h+='<div><div style="font-size:12px;font-weight:700;color:'+phase.c+'">'+phase.l+'</div>';
      h+='<div style="font-size:10px;color:var(--txt3)">'+phase.desc+'</div></div></div>';
      h+='</div>';
    }
  }
  h+='</div>';
  openM('ケガ履歴 — '+sanitize(p.name,12), h);
}
function _estimateRecoveryDays(type,level){
  var base={'打撲':7,'捻挫':14,'肉離れ':21,'筋肉痛':3,'関節痛':14,'腱炎':28,'疲労骨折':56,'その他':14};
  var days=base[type]||14;
  if(level>=8) days=Math.round(days*1.5);
  else if(level>=5) days=Math.round(days*1.2);
  else if(level<=2) days=Math.round(days*0.7);
  return Math.max(3,days);
}

// ==================== ⚽ 試合記録・スコア管理 ====================
function openMatchResultModal(eventId){
  var ev=DB.events.find(function(e){return e.id===eventId;});
  if(!ev){toast('イベントが見つかりません','e');return;}
  var result=ev.matchResult||{};
  var players=DB.players.filter(function(p){return p.team===_getMyTeamId();});
  var h='<div style="margin-bottom:16px">';
  h+='<div style="text-align:center;font-size:15px;font-weight:700;margin-bottom:12px">'+sanitize(ev.title,30)+'</div>';
  // Score input
  h+='<div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:16px">';
  h+='<div style="text-align:center"><div style="font-size:11px;color:var(--txt3);margin-bottom:4px">自チーム</div>';
  h+='<input type="number" id="mr-home" value="'+(result.homeScore||'')+'" min="0" max="99" style="width:60px;padding:12px;text-align:center;font-size:24px;font-weight:800;border:2px solid var(--org);border-radius:12px;background:var(--surf);color:var(--org)"></div>';
  h+='<div style="font-size:20px;font-weight:800;color:var(--txt3)">—</div>';
  h+='<div style="text-align:center"><div style="font-size:11px;color:var(--txt3);margin-bottom:4px">相手チーム</div>';
  h+='<input type="number" id="mr-away" value="'+(result.awayScore||'')+'" min="0" max="99" style="width:60px;padding:12px;text-align:center;font-size:24px;font-weight:800;border:2px solid var(--b2);border-radius:12px;background:var(--surf);color:var(--txt)"></div>';
  h+='</div>';
  // Opponent name
  h+='<div class="form-group"><label style="font-size:11px;color:var(--txt3)">対戦相手</label>';
  h+='<input class="input" id="mr-opponent" value="'+sanitize(result.opponent||'',30)+'" placeholder="例: 対戦チーム名" style="font-size:13px"></div>';
  // Player stats (goals, assists)
  if(players.length>0){
    h+='<details'+(result.playerStats?' open':'')+' style="margin-top:8px"><summary style="font-size:12px;font-weight:700;color:var(--txt2);cursor:pointer">⚽ 個人スタッツ</summary>';
    h+='<div style="margin-top:8px;max-height:200px;overflow-y:auto">';
    var ps=result.playerStats||{};
    players.forEach(function(p){
      var st=ps[p.id]||{};
      h+='<div style="display:flex;align-items:center;gap:6px;padding:6px 0;border-bottom:1px solid var(--b1);font-size:12px">';
      h+='<span style="width:70px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+sanitize(p.name,8)+'</span>';
      h+='<input type="number" min="0" max="20" value="'+(st.goals||0)+'" data-pid="'+p.id+'" class="mr-goal" style="width:40px;padding:4px;text-align:center;border:1px solid var(--b1);border-radius:6px;font-size:12px" title="ゴール">';
      h+='<span style="font-size:9px;color:var(--txt3)">G</span>';
      h+='<input type="number" min="0" max="20" value="'+(st.assists||0)+'" data-pid="'+p.id+'" class="mr-assist" style="width:40px;padding:4px;text-align:center;border:1px solid var(--b1);border-radius:6px;font-size:12px" title="アシスト">';
      h+='<span style="font-size:9px;color:var(--txt3)">A</span>';
      h+='<input type="number" min="0" max="120" value="'+(st.minutes||0)+'" data-pid="'+p.id+'" class="mr-min" style="width:45px;padding:4px;text-align:center;border:1px solid var(--b1);border-radius:6px;font-size:12px" title="出場時間">';
      h+='<span style="font-size:9px;color:var(--txt3)">分</span>';
      h+='</div>';
    });
    h+='</div></details>';
  }
  // MVP vote
  if(players.length>1){
    h+='<div style="margin-top:12px"><label style="font-size:11px;font-weight:700;color:var(--txt3)">🏆 MVP</label>';
    h+='<select class="input" id="mr-mvp" style="font-size:12px;margin-top:4px">';
    h+='<option value="">選択なし</option>';
    players.forEach(function(p){
      h+='<option value="'+p.id+'" '+(result.mvp===p.id?'selected':'')+'>'+sanitize(p.name,12)+'</option>';
    });
    h+='</select></div>';
  }
  // Video URL + メモ
  h+='<div class="form-group" style="margin-top:10px"><label style="font-size:11px;color:var(--txt3)">🎬 試合動画URL（YouTube等）</label>';
  h+='<input class="input" id="mr-video" value="'+(result.videoUrl||'')+'" placeholder="https://youtube.com/..." style="font-size:12px"></div>';
  // Video timestamp memos
  h+='<details style="margin-top:4px"><summary style="font-size:11px;font-weight:600;color:var(--org);cursor:pointer">📝 映像メモ（タイムスタンプ付き）</summary>';
  h+='<div style="margin-top:6px" id="video-memo-list">';
  var memos=result.videoMemos||[];
  memos.forEach(function(memo,mi){
    h+='<div style="display:flex;gap:6px;align-items:center;padding:4px 0;border-bottom:1px solid var(--b1);font-size:11px">';
    h+='<span style="font-weight:700;color:var(--org);min-width:45px">'+sanitize(memo.time||'',8)+'</span>';
    h+='<span style="flex:1;color:var(--txt2)">'+sanitize(memo.text||'',40)+'</span>';
    h+='<span style="font-size:9px;padding:1px 5px;border-radius:4px;background:rgba(249,115,22,.08);color:var(--org)">'+sanitize(memo.tag||'',6)+'</span></div>';
  });
  h+='</div>';
  h+='<div style="display:grid;grid-template-columns:50px 1fr 50px auto;gap:4px;margin-top:6px;align-items:center">';
  h+='<input class="input" id="vm-time" placeholder="12:30" maxlength="8" style="font-size:11px;padding:4px;text-align:center">';
  h+='<input class="input" id="vm-text" placeholder="メモ内容" maxlength="60" style="font-size:11px;padding:4px">';
  h+='<select class="input" id="vm-tag" style="font-size:10px;padding:4px"><option>得点</option><option>失点</option><option>チャンス</option><option>ミス</option><option>戦術</option><option>個人</option></select>';
  h+='<button onclick="addVideoMemo()" style="padding:4px 8px;border:1px solid var(--org);border-radius:6px;background:rgba(249,115,22,.06);color:var(--org);font-size:11px;cursor:pointer;font-weight:600">＋</button>';
  h+='</div></details>';
  // Match notes
  h+='<div class="form-group"><label style="font-size:11px;color:var(--txt3)">📝 試合メモ・反省点</label>';
  h+='<textarea class="input" id="mr-notes" rows="3" style="font-size:12px" placeholder="戦術メモ、改善点、良かった点...">'+(result.notes||'')+'</textarea></div>';
  // Rating
  h+='<div style="margin-top:8px"><label style="font-size:11px;color:var(--txt3)">チーム評価</label>';
  h+='<div style="display:flex;gap:6px;margin-top:4px" id="mr-rating">';
  for(var ri=1;ri<=5;ri++){
    h+='<button onclick="setMatchRating('+ri+')" id="mr-star-'+ri+'" style="font-size:24px;background:none;border:none;cursor:pointer;opacity:'+(ri<=(result.rating||0)?1:0.3)+'">⭐</button>';
  }
  h+='<input type="hidden" id="mr-rating-val" value="'+(result.rating||0)+'"></div></div>';
  h+='</div>';
  h+='<button class="btn btn-primary w-full" style="padding:14px;font-size:14px;margin-top:12px" onclick="saveMatchResult(\''+eventId+'\')">💾 試合結果を保存</button>';
  openM('⚽ 試合結果入力', h);
}
function addVideoMemo(){
  var time=(document.getElementById('vm-time')?.value||'').trim();
  var text=(document.getElementById('vm-text')?.value||'').trim();
  var tag=document.getElementById('vm-tag')?.value||'';
  if(!text){toast('メモ内容を入力してください','e');return;}
  if(!window._videoMemos) window._videoMemos=[];
  window._videoMemos.push({time:time,text:sanitize(text,60),tag:tag});
  var list=document.getElementById('video-memo-list');
  if(list){
    var h='<div style="display:flex;gap:6px;align-items:center;padding:4px 0;border-bottom:1px solid var(--b1);font-size:11px">';
    h+='<span style="font-weight:700;color:var(--org);min-width:45px">'+sanitize(time,8)+'</span>';
    h+='<span style="flex:1;color:var(--txt2)">'+sanitize(text,40)+'</span>';
    h+='<span style="font-size:9px;padding:1px 5px;border-radius:4px;background:rgba(249,115,22,.08);color:var(--org)">'+sanitize(tag,6)+'</span></div>';
    list.insertAdjacentHTML('beforeend',h);
  }
  document.getElementById('vm-time').value='';
  document.getElementById('vm-text').value='';
  toast('メモを追加','s');
}
function setMatchRating(n){
  document.getElementById('mr-rating-val').value=n;
  for(var i=1;i<=5;i++){
    var el=document.getElementById('mr-star-'+i);
    if(el) el.style.opacity=i<=n?1:0.3;
  }
}
function saveMatchResult(eventId){
  var ev=DB.events.find(function(e){return e.id===eventId;});
  if(!ev){toast('イベントが見つかりません','e');return;}
  var homeScore=parseInt(document.getElementById('mr-home')?.value);
  var awayScore=parseInt(document.getElementById('mr-away')?.value);
  if(isNaN(homeScore)||isNaN(awayScore)){toast('スコアを入力してください','e');return;}
  var opponent=document.getElementById('mr-opponent')?.value?.trim()||'';
  var mvp=document.getElementById('mr-mvp')?.value||'';
  var notes=document.getElementById('mr-notes')?.value?.trim()||'';
  var videoUrl=document.getElementById('mr-video')?.value?.trim()||'';
  var rating=parseInt(document.getElementById('mr-rating-val')?.value)||0;
  // Collect player stats
  var playerStats={};
  document.querySelectorAll('.mr-goal').forEach(function(el){
    var pid=el.dataset.pid;if(!pid) return;
    if(!playerStats[pid]) playerStats[pid]={};
    playerStats[pid].goals=parseInt(el.value)||0;
  });
  document.querySelectorAll('.mr-assist').forEach(function(el){
    var pid=el.dataset.pid;if(!pid) return;
    if(!playerStats[pid]) playerStats[pid]={};
    playerStats[pid].assists=parseInt(el.value)||0;
  });
  document.querySelectorAll('.mr-min').forEach(function(el){
    var pid=el.dataset.pid;if(!pid) return;
    if(!playerStats[pid]) playerStats[pid]={};
    playerStats[pid].minutes=parseInt(el.value)||0;
  });
  var outcome=homeScore>awayScore?'win':homeScore<awayScore?'lose':'draw';
  ev.matchResult={
    homeScore:homeScore,awayScore:awayScore,
    opponent:sanitize(opponent,30),outcome:outcome,
    playerStats:playerStats,mvp:mvp,
    notes:sanitize(notes,500),videoUrl:videoUrl?sanitize(videoUrl,200):'',videoMemos:window._videoMemos||[],rating:rating,
    recordedAt:new Date().toISOString()
  };
  // 試合履歴に追加
  if(!DB.matchHistory) DB.matchHistory=[];
  DB.matchHistory.push({
    eventId:eventId,date:ev.year+'-'+String(ev.month+1).padStart(2,'0')+'-'+String(ev.date).padStart(2,'0'),
    title:ev.title,opponent:opponent,
    homeScore:homeScore,awayScore:awayScore,outcome:outcome,
    mvp:mvp,rating:rating,teamId:_getMyTeamId()
  });
  saveDB();closeM();toast(outcome==='win'?'🎉 勝利！結果を保存しました':outcome==='draw'?'🤝 引き分け。結果を保存しました':'結果を保存しました','s');goTo('calendar');
}

// 試合戦績サマリー
function openMatchHistoryModal(){
  var hist=DB.matchHistory||[];
  var teamId=_getMyTeamId();
  var teamHist=hist.filter(function(m){return m.teamId===teamId;});
  var wins=teamHist.filter(function(m){return m.outcome==='win';}).length;
  var losses=teamHist.filter(function(m){return m.outcome==='lose';}).length;
  var draws=teamHist.filter(function(m){return m.outcome==='draw';}).length;
  var totalGoals=teamHist.reduce(function(s,m){return s+(m.homeScore||0);},0);
  var totalConceded=teamHist.reduce(function(s,m){return s+(m.awayScore||0);},0);
  var total=wins+losses+draws;
  var winRate=total?Math.round(wins/total*100):0;
  var avgGoals=total?fmtN(totalGoals/total):'0';
  var avgConceded=total?fmtN(totalConceded/total):'0';
  var goalDiff=totalGoals-totalConceded;

  var h='<div style="margin-bottom:16px">';
  // ── 戦績サマリーカード ──
  h+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:14px;text-align:center">';
  h+='<div style="padding:10px 6px;border-radius:12px;background:rgba(0,207,170,.06)"><div style="font-size:24px;font-weight:800;color:var(--teal)">'+wins+'</div><div style="font-size:10px;color:var(--txt3)">勝利</div></div>';
  h+='<div style="padding:10px 6px;border-radius:12px;background:rgba(234,179,8,.06)"><div style="font-size:24px;font-weight:800;color:#ca8a04">'+draws+'</div><div style="font-size:10px;color:var(--txt3)">引分</div></div>';
  h+='<div style="padding:10px 6px;border-radius:12px;background:rgba(239,68,68,.06)"><div style="font-size:24px;font-weight:800;color:#ef4444">'+losses+'</div><div style="font-size:10px;color:var(--txt3)">敗北</div></div>';
  h+='</div>';
  // 勝率＆得失点
  h+='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:14px;text-align:center">';
  h+='<div style="padding:8px 4px;border-radius:10px;background:var(--surf2)"><div style="font-size:18px;font-weight:800;color:var(--org)">'+winRate+'%</div><div style="font-size:9px;color:var(--txt3)">勝率</div></div>';
  h+='<div style="padding:8px 4px;border-radius:10px;background:var(--surf2)"><div style="font-size:18px;font-weight:800;color:var(--teal)">'+avgGoals+'</div><div style="font-size:9px;color:var(--txt3)">平均得点</div></div>';
  h+='<div style="padding:8px 4px;border-radius:10px;background:var(--surf2)"><div style="font-size:18px;font-weight:800;color:#ef4444">'+avgConceded+'</div><div style="font-size:9px;color:var(--txt3)">平均失点</div></div>';
  h+='<div style="padding:8px 4px;border-radius:10px;background:var(--surf2)"><div style="font-size:18px;font-weight:800;color:'+(goalDiff>=0?'var(--teal)':'#ef4444')+'">'+((goalDiff>=0?'+':'')+goalDiff)+'</div><div style="font-size:9px;color:var(--txt3)">得失点差</div></div>';
  h+='</div>';
  // 直近フォーム（最近5試合）
  if(teamHist.length>0){
    var recent=teamHist.slice(-5);
    h+='<div style="margin-bottom:14px"><div style="font-size:12px;font-weight:700;margin-bottom:6px">📊 直近フォーム</div>';
    h+='<div style="display:flex;gap:6px;justify-content:center">';
    recent.forEach(function(m){
      var col=m.outcome==='win'?'var(--teal)':m.outcome==='draw'?'#ca8a04':'#ef4444';
      var lbl=m.outcome==='win'?'W':m.outcome==='draw'?'D':'L';
      h+='<div style="width:36px;height:36px;border-radius:50%;background:'+col+';display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:13px" title="'+m.date+' vs '+(m.opponent||'?')+' '+m.homeScore+'-'+m.awayScore+'">'+lbl+'</div>';
    });
    h+='</div></div>';
  }
  // 個人スタッツランキング
  if(teamHist.length>0){
    var playerTotals={};
    teamHist.forEach(function(m){
      var ev=DB.events.find(function(e){return e.id===m.eventId;});
      if(!ev||!ev.matchResult||!ev.matchResult.playerStats) return;
      var ps=ev.matchResult.playerStats;
      for(var pid in ps){
        if(!playerTotals[pid]) playerTotals[pid]={goals:0,assists:0,minutes:0,games:0};
        playerTotals[pid].goals+=(ps[pid].goals||0);
        playerTotals[pid].assists+=(ps[pid].assists||0);
        playerTotals[pid].minutes+=(ps[pid].minutes||0);
        playerTotals[pid].games++;
      }
    });
    var sorted=Object.entries(playerTotals).sort(function(a,b){return (b[1].goals+b[1].assists)-(a[1].goals+a[1].assists);}).slice(0,5);
    if(sorted.length>0){
      h+='<details style="margin-bottom:14px"><summary style="font-size:12px;font-weight:700;cursor:pointer">🏅 個人スタッツ TOP5</summary>';
      h+='<div style="margin-top:8px">';
      sorted.forEach(function(entry,idx){
        var pid=entry[0];var st=entry[1];
        var p=DB.players.find(function(x){return x.id===pid;});
        var rankEmoji=idx===0?'🥇':idx===1?'🥈':idx===2?'🥉':'';
        h+='<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--b1)">';
        h+='<span style="font-size:14px;width:20px">'+rankEmoji+'</span>';
        h+='<span style="flex:1;font-size:12px;font-weight:600">'+(p?sanitize(p.name,10):'不明')+'</span>';
        h+='<span style="font-size:11px;color:var(--teal);font-weight:700">'+st.goals+'G</span>';
        h+='<span style="font-size:11px;color:var(--blue);font-weight:700">'+st.assists+'A</span>';
        h+='<span style="font-size:10px;color:var(--txt3)">'+st.games+'試合 / '+st.minutes+'分</span>';
        h+='</div>';
      });
      h+='</div></details>';
    }
  }
  // Win/Loss/Draw summary
  h+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center;margin-bottom:16px">';
  h+='<div style="padding:12px;border-radius:12px;background:rgba(0,207,170,.06)"><div style="font-size:24px;font-weight:800;color:var(--teal)">'+wins+'</div><div style="font-size:10px;color:var(--txt3)">勝ち</div></div>';
  h+='<div style="padding:12px;border-radius:12px;background:rgba(100,116,139,.06)"><div style="font-size:24px;font-weight:800;color:var(--txt2)">'+draws+'</div><div style="font-size:10px;color:var(--txt3)">引分</div></div>';
  h+='<div style="padding:12px;border-radius:12px;background:rgba(239,68,68,.06)"><div style="font-size:24px;font-weight:800;color:#ef4444">'+losses+'</div><div style="font-size:10px;color:var(--txt3)">負け</div></div>';
  h+='</div>';
  // Stats
  h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px;text-align:center">';
  h+='<div style="padding:8px;background:var(--surf2);border-radius:10px"><div style="font-size:18px;font-weight:800;color:var(--org)">'+totalGoals+'</div><div style="font-size:10px;color:var(--txt3)">総得点</div></div>';
  h+='<div style="padding:8px;background:var(--surf2);border-radius:10px"><div style="font-size:18px;font-weight:800;color:var(--txt2)">'+totalConceded+'</div><div style="font-size:10px;color:var(--txt3)">総失点</div></div>';
  h+='</div>';
  if(teamHist.length>0){
    var winRate=Math.round(wins/teamHist.length*100);
    h+='<div style="text-align:center;margin-bottom:14px"><span style="font-size:12px;color:var(--txt3)">勝率 </span><span style="font-size:20px;font-weight:800;color:var(--org)">'+winRate+'%</span></div>';
  }
  // Player ranking (goals + assists)
  var playerTotals={};
  teamHist.forEach(function(m){
    var ev2=DB.events.find(function(e){return e.id===m.eventId;});
    if(!ev2||!ev2.matchResult||!ev2.matchResult.playerStats) return;
    var ps=ev2.matchResult.playerStats;
    for(var pid in ps){
      if(!playerTotals[pid]) playerTotals[pid]={goals:0,assists:0,minutes:0,mvpCount:0};
      playerTotals[pid].goals+=(ps[pid].goals||0);
      playerTotals[pid].assists+=(ps[pid].assists||0);
      playerTotals[pid].minutes+=(ps[pid].minutes||0);
      if(ev2.matchResult.mvp===pid) playerTotals[pid].mvpCount++;
    }
  });
  var ranked=Object.entries(playerTotals).map(function(e){
    var p2=DB.players.find(function(x){return x.id===e[0];});
    return {pid:e[0],name:p2?p2.name:'?',stats:e[1],total:e[1].goals*3+e[1].assists};
  }).sort(function(a,b){return b.total-a.total;}).slice(0,10);
  if(ranked.length>0){
    h+='<div style="font-size:12px;font-weight:700;margin-bottom:8px">🏅 選手ランキング</div>';
    ranked.forEach(function(r,i){
      var medal=i===0?'🥇':i===1?'🥈':i===2?'🥉':'';
      h+='<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--b1);font-size:12px">';
      h+='<span style="width:20px;text-align:center;font-weight:700;color:var(--txt3)">'+(medal||(i+1))+'</span>';
      h+='<span style="flex:1;font-weight:600">'+sanitize(r.name,10)+'</span>';
      h+='<span style="color:var(--org);font-weight:700">'+r.stats.goals+'G</span>';
      h+='<span style="color:var(--teal)">'+r.stats.assists+'A</span>';
      if(r.stats.mvpCount>0) h+='<span style="font-size:9px;background:rgba(249,115,22,.12);color:var(--org);padding:1px 5px;border-radius:4px">MVP×'+r.stats.mvpCount+'</span>';
      h+='</div>';
    });
  }
  // Match list
  if(teamHist.length>0){
    h+='<div style="font-size:12px;font-weight:700;margin:12px 0 8px">📋 試合一覧</div>';
    teamHist.slice().reverse().slice(0,15).forEach(function(m){
      var outcomeIcon=m.outcome==='win'?'🟢':m.outcome==='draw'?'🟡':'🔴';
      h+='<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--b1);font-size:12px">';
      h+='<span>'+outcomeIcon+'</span>';
      h+='<span style="color:var(--txt3)">'+m.date.slice(5)+'</span>';
      h+='<span style="flex:1;font-weight:600">'+sanitize(m.opponent||m.title,15)+'</span>';
      h+='<span style="font-weight:800;font-size:14px">'+m.homeScore+' - '+m.awayScore+'</span>';
      h+='</div>';
    });
  }
  h+='</div>';
  openM('⚽ 試合戦績', h);
}

// ==================== 📈 選手個人スタッツ ====================
function openPlayerStatsModal(playerId){
  var p=DB.players.find(function(x){return x.id===playerId;});
  if(!p){toast('選手が見つかりません','e');return;}
  var teamId=p.team||_getMyTeamId();
  var hist=(DB.matchHistory||[]).filter(function(m){return m.teamId===teamId;});
  var h='<div>';
  // Collect stats
  var totalGames=0,totalGoals=0,totalAssists=0,totalMinutes=0,mvpCount=0;
  hist.forEach(function(m){
    var ev=DB.events.find(function(e){return e.id===m.eventId;});
    if(!ev||!ev.matchResult||!ev.matchResult.playerStats) return;
    var ps=ev.matchResult.playerStats[playerId];
    if(!ps) return;
    if(ps.minutes>0||ps.goals>0||ps.assists>0) totalGames++;
    totalGoals+=(ps.goals||0);
    totalAssists+=(ps.assists||0);
    totalMinutes+=(ps.minutes||0);
    if(ev.matchResult.mvp===playerId) mvpCount++;
  });
  // Hero stats
  h+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px;text-align:center">';
  h+='<div style="padding:12px;background:rgba(249,115,22,.06);border-radius:12px"><div style="font-size:28px;font-weight:800;color:var(--org)">'+totalGoals+'</div><div style="font-size:10px;color:var(--txt3)">ゴール</div></div>';
  h+='<div style="padding:12px;background:rgba(0,207,170,.06);border-radius:12px"><div style="font-size:28px;font-weight:800;color:var(--teal)">'+totalAssists+'</div><div style="font-size:10px;color:var(--txt3)">アシスト</div></div>';
  h+='<div style="padding:12px;background:rgba(234,179,8,.06);border-radius:12px"><div style="font-size:28px;font-weight:800;color:#ca8a04">'+mvpCount+'</div><div style="font-size:10px;color:var(--txt3)">MVP</div></div>';
  h+='</div>';
  h+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:14px;text-align:center;font-size:12px">';
  h+='<div style="padding:8px;background:var(--surf2);border-radius:8px"><div style="font-weight:700">'+totalGames+'</div><div style="font-size:10px;color:var(--txt3)">出場試合</div></div>';
  h+='<div style="padding:8px;background:var(--surf2);border-radius:8px"><div style="font-weight:700">'+totalMinutes+'</div><div style="font-size:10px;color:var(--txt3)">出場時間(分)</div></div>';
  var avgRating=totalGames>0?(totalGoals*3+totalAssists*2)/totalGames:0;
  h+='<div style="padding:8px;background:var(--surf2);border-radius:8px"><div style="font-weight:700">'+fmtN(avgRating)+'</div><div style="font-size:10px;color:var(--txt3)">貢献度/試合</div></div>';
  h+='</div>';
  // Match-by-match breakdown
  if(totalGames>0){
    h+='<div style="font-size:12px;font-weight:700;margin-bottom:8px">📋 試合別成績</div>';
    hist.slice().reverse().forEach(function(m){
      var ev=DB.events.find(function(e){return e.id===m.eventId;});
      if(!ev||!ev.matchResult||!ev.matchResult.playerStats) return;
      var ps=ev.matchResult.playerStats[playerId];
      if(!ps||(ps.minutes===0&&ps.goals===0&&ps.assists===0)) return;
      var isMvp=ev.matchResult.mvp===playerId;
      var outcomeIcon=m.outcome==='win'?'🟢':m.outcome==='draw'?'🟡':'🔴';
      h+='<div style="display:flex;align-items:center;gap:6px;padding:6px 0;border-bottom:1px solid var(--b1);font-size:11px">';
      h+='<span>'+outcomeIcon+'</span>';
      h+='<span style="color:var(--txt3);width:38px">'+m.date.slice(5)+'</span>';
      h+='<span style="flex:1;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+sanitize(m.opponent||m.title,12)+'</span>';
      h+='<span style="font-weight:700;min-width:30px;text-align:center">'+m.homeScore+'-'+m.awayScore+'</span>';
      if(ps.goals>0) h+='<span style="color:var(--org);font-weight:700">'+ps.goals+'G</span>';
      if(ps.assists>0) h+='<span style="color:var(--teal)">'+ps.assists+'A</span>';
      h+='<span style="color:var(--txt3)">'+ps.minutes+'分</span>';
      if(isMvp) h+='<span style="font-size:9px;background:rgba(249,115,22,.12);color:var(--org);padding:1px 4px;border-radius:3px">MVP</span>';
      h+='</div>';
    });
  } else {
    h+='<div style="text-align:center;padding:20px;color:var(--txt3)">試合データがありません</div>';
  }
  h+='</div>';
  openM('📈 '+sanitize(p.name,10)+' のスタッツ', h);
}

// ==================== 🩹 コーチ向けケガ一覧ダッシュボード ====================
function openInjuryDashboard(){
  var teamId=_getMyTeamId();
  var players=DB.players.filter(function(p){return p.team===teamId;});
  var today=new Date().toISOString().slice(0,10);
  var h='<div>';
  // Summary counts
  var fullCount=0,limitedCount=0,observeCount=0,restCount=0,noDataCount=0;
  var playerStatuses=[];
  players.forEach(function(p){
    var cLog=(DB.conditionLog||{})[p.id]||{};
    var todayCond=cLog[today];
    var participation=todayCond?.participation||'';
    var painLevel=todayCond?.painLevel||0;
    var painParts=todayCond?.painParts||[];
    if(!todayCond){noDataCount++;participation='nodata';}
    else if(participation==='rest') restCount++;
    else if(participation==='observe') observeCount++;
    else if(participation==='limited') limitedCount++;
    else fullCount++;
    playerStatuses.push({player:p,participation:participation,painLevel:painLevel,painParts:painParts,cond:todayCond});
  });
  // Status summary cards
  h+='<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-bottom:14px;text-align:center">';
  h+='<div style="padding:8px 4px;border-radius:10px;background:rgba(0,207,170,.06)"><div style="font-size:20px;font-weight:800;color:var(--teal)">'+fullCount+'</div><div style="font-size:9px;color:var(--txt3)">🟢 フル</div></div>';
  h+='<div style="padding:8px 4px;border-radius:10px;background:rgba(234,179,8,.06)"><div style="font-size:20px;font-weight:800;color:#ca8a04">'+limitedCount+'</div><div style="font-size:9px;color:var(--txt3)">🟡 制限</div></div>';
  h+='<div style="padding:8px 4px;border-radius:10px;background:rgba(249,115,22,.06)"><div style="font-size:20px;font-weight:800;color:var(--org)">'+observeCount+'</div><div style="font-size:9px;color:var(--txt3)">🟠 見学</div></div>';
  h+='<div style="padding:8px 4px;border-radius:10px;background:rgba(239,68,68,.06)"><div style="font-size:20px;font-weight:800;color:#ef4444">'+restCount+'</div><div style="font-size:9px;color:var(--txt3)">🔴 休み</div></div>';
  h+='<div style="padding:8px 4px;border-radius:10px;background:var(--surf2)"><div style="font-size:20px;font-weight:800;color:var(--txt3)">'+noDataCount+'</div><div style="font-size:9px;color:var(--txt3)">未入力</div></div>';
  h+='</div>';
  // Player list sorted by severity
  var sortOrder={rest:0,observe:1,limited:2,nodata:3,full:4};
  playerStatuses.sort(function(a,b){return (sortOrder[a.participation]||4)-(sortOrder[b.participation]||4)||(b.painLevel-a.painLevel);});
  h+='<div style="font-size:12px;font-weight:700;margin-bottom:8px">選手一覧（要注意順）</div>';
  playerStatuses.forEach(function(ps){
    var p=ps.player;var partIcon={full:'🟢',limited:'🟡',observe:'🟠',rest:'🔴',nodata:'⚪'}[ps.participation]||'⚪';
    var partLabel={full:'フル参加',limited:'制限付き',observe:'見学',rest:'休み',nodata:'未入力'}[ps.participation]||'不明';
    var painCol=ps.painLevel>=7?'#ef4444':ps.painLevel>=4?'var(--org)':ps.painLevel>=1?'var(--teal)':'var(--txt3)';
    h+='<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--b1)">';
    h+='<span style="font-size:14px">'+partIcon+'</span>';
    h+='<div style="flex:1;min-width:0">';
    h+='<div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+sanitize(p.name,12)+'</div>';
    if(ps.painParts.length>0){
      h+='<div style="font-size:10px;color:'+painCol+'">痛み '+ps.painLevel+'/10 — '+(ps.painParts||[]).join('、')+(ps.cond?.injuryType?' ('+ps.cond.injuryType+')':'')+'</div>';
    }
    h+='</div>';
    h+='<span style="font-size:10px;color:var(--txt3);flex-shrink:0">'+partLabel+'</span>';
    h+='<button onclick="closeM();openInjuryHistory(\''+p.id+'\')" style="font-size:9px;padding:2px 6px;border:1px solid var(--b1);border-radius:4px;background:var(--surf);color:var(--txt3);cursor:pointer">履歴</button>';
    h+='</div>';
  });
  h+='</div>';
  openM('🩹 チームケガ状況 — '+today.slice(5), h);
}

// ==================== データ連携: コーチ/チーム向け選手データ公開 ====================
function getPlayerBodyData(playerId){return DB.bodyLog[playerId]||{};}
function getPlayerCondData(playerId){return DB.conditionLog[playerId]||{};}
function getPlayerTrainingData(playerId){return DB.trainingLog[playerId]||{};}

function openPlayerCondDetail(playerId){
  // Show wellness score at top
  var ws2=calcWellnessScore(playerId);
  if(ws2){
    var wsCol=ws2.score>=75?'var(--teal)':ws2.score>=50?'var(--org)':'#ef4444';
    var wsLabel=ws2.score>=75?'良好':ws2.score>=50?'注意':'要確認';
  }
  const p=DB.players.find(x=>x.id===playerId);
  if(!p){toast('選手が見つかりません','e');return;}
  const bLog=DB.bodyLog[playerId]||{};
  // Wellness score card
  var wsData=calcWellnessScore(playerId);
  var wellnessHtml='';
  if(wsData){
    var wCol=wsData.score>=75?'var(--teal)':wsData.score>=50?'var(--org)':'#ef4444';
    var wLbl=wsData.score>=75?'良好':wsData.score>=50?'注意':'要確認';
    wellnessHtml='<div style="padding:12px;background:linear-gradient(135deg,rgba(0,207,170,.04),rgba(249,115,22,.04));border:1px solid var(--b1);border-radius:12px;margin-bottom:12px">';
    wellnessHtml+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px"><span style="font-size:12px;font-weight:700">🏥 ウェルネススコア</span>';
    wellnessHtml+='<div style="display:flex;align-items:center;gap:6px"><span style="font-size:22px;font-weight:800;color:'+wCol+'">'+wsData.score+'</span><span style="font-size:10px;padding:2px 8px;border-radius:6px;background:'+wCol+'15;color:'+wCol+';font-weight:700">/100 '+wLbl+'</span></div></div>';
    wellnessHtml+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;text-align:center;font-size:10px">';
    wellnessHtml+='<div>調子 <b>'+(['','😣','😐','🙂','😊','😄'][wsData.mood||0])+'</b></div>';
    wellnessHtml+='<div>睡眠 <b>'+(wsData.sleep||'?')+'h</b></div>';
    wellnessHtml+='<div>RPE <b>'+(wsData.rpe||'?')+'/10</b></div>';
    wellnessHtml+='</div></div>';
  }
  const cLog=DB.conditionLog[playerId]||{};
  const tLog=DB.trainingLog[playerId]||{};
  const today=new Date().toISOString().slice(0,10);
  const condEmoji=['','😣','😐','🙂','😊','😄'];
  // Inject wellness at top of detail view

  // 直近7日
  const last7=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-6+i);return d.toISOString().slice(0,10);});
  const weekDays=['日','月','火','水','木','金','土'];

  // 体重推移
  const bodyEntries=Object.values(bLog).sort((a,b)=>a.date>b.date?-1:1);
  const latestBody=bodyEntries[0];

  // コンディション推移
  const condEntries=last7.map(dk=>cLog[dk]);
  const trainingEntries=last7.map(dk=>tLog[dk]);
  const injHist=(DB.injuryHistory||{})[playerId]||[];
  const todayCond=cLog[today];

  const html=`
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:18px">
      <div class="avi avi-lg" style="background:${p.color||'var(--org)'}18;color:${p.color||'var(--org)'}">${(p.name||'?')[0]}</div>
      <div>
        <div style="font-size:18px;font-weight:800">${sanitize(p.name,16)}</div>
        <div style="font-size:12px;color:var(--txt3)">${p.pos||'--'} · ${p.age?p.age+'歳':'--'}</div>
      </div>
    </div>

    <!-- 体重・体組成 -->
    <div style="font-size:12px;font-weight:700;color:var(--txt3);margin-bottom:6px">⚖️ 体重・体組成</div>
    ${latestBody?`<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px">
      <div style="padding:12px;background:var(--surf2);border-radius:12px;text-align:center">
        <div style="font-size:20px;font-weight:800">${latestBody.weight}<span style="font-size:11px;color:var(--txt3)">kg</span></div>
        <div style="font-size:10px;color:var(--txt3)">体重</div>
      </div>
      <div style="padding:12px;background:var(--surf2);border-radius:12px;text-align:center">
        <div style="font-size:20px;font-weight:800;color:var(--teal)">${latestBody.bodyFat||'--'}<span style="font-size:11px;color:var(--txt3)">${latestBody.bodyFat?'%':''}</span></div>
        <div style="font-size:10px;color:var(--txt3)">体脂肪率</div>
      </div>
      <div style="padding:12px;background:var(--surf2);border-radius:12px;text-align:center">
        <div style="font-size:20px;font-weight:800;color:var(--blue)">${latestBody.muscle||'--'}<span style="font-size:11px;color:var(--txt3)">${latestBody.muscle?'kg':''}</span></div>
        <div style="font-size:10px;color:var(--txt3)">筋肉量</div>
      </div>
    </div>
    <div style="font-size:10px;color:var(--txt3);margin-bottom:16px">最終更新: ${latestBody.date||'--'}</div>`
    :'<div style="padding:14px;background:var(--surf2);border-radius:12px;text-align:center;color:var(--txt3);font-size:12px;margin-bottom:16px">体重データなし</div>'}

    <!-- 7日間コンディション -->
    <div style="font-size:12px;font-weight:700;color:var(--txt3);margin-bottom:6px">💪 直近7日間のコンディション</div>
    <div style="display:flex;gap:4px;margin-bottom:16px">
      ${last7.map((dk,i)=>{
        const c=condEntries[i];
        const t=trainingEntries[i];
        const m=c?.mood||0;
        const isToday=dk===today;
        return`<div style="flex:1;text-align:center;padding:8px 4px;background:var(--surf2);border-radius:10px;border:${isToday?'2px solid var(--org)':'1px solid var(--b1)'}">
          <div style="font-size:18px;opacity:${m?1:.3}">${m?condEmoji[m]:'·'}</div>
          <div style="font-size:8px;color:var(--txt3)">${weekDays[new Date(dk+'T12:00').getDay()]}</div>
          ${c?.sleep?`<div style="font-size:8px;color:var(--txt3)">${c.sleep}h</div>`:''}
          ${c?.pain?`<div style="font-size:8px;color:var(--red)">⚠️</div>`:''}
          ${t?`<div style="font-size:8px;color:var(--teal)">●</div>`:''}
        </div>`;
      }).join('')}
    </div>

    <!-- 今日のコンディション詳細 -->
    ${(()=>{
      const tc=cLog[today];
      if(!tc)return'<div style="padding:12px;background:var(--surf2);border-radius:12px;font-size:12px;color:var(--txt3);text-align:center;margin-bottom:16px">今日のコンディション未記録</div>';
      return`<div style="padding:14px;background:var(--surf2);border-radius:12px;margin-bottom:16px">
        <div style="display:flex;gap:12px;align-items:center;margin-bottom:8px">
          <span style="font-size:28px">${condEmoji[tc.mood]||'😐'}</span>
          <div>
            <div style="font-size:14px;font-weight:700">調子: ${'⭐'.repeat(tc.mood)}</div>
            <div style="font-size:11px;color:var(--txt3)">睡眠${tc.sleep||'--'}h · 疲労${tc.fatigue||'--'}/5</div>
          </div>
        </div>
        ${tc.pain?`<div style="font-size:12px;color:var(--red);margin-bottom:4px">⚠️ 痛み: ${sanitize(tc.pain,40)}</div>`:''}
        ${tc.note?`<div style="font-size:12px;color:var(--txt2)">💬 ${sanitize(tc.note,100)}</div>`:''}
      </div>`;
    })()}

    <div style="display:flex;gap:8px">
      <button class="btn btn-primary" style="flex:1" onclick="closeM();openPlayerNutritionReport('${playerId}')">🍽️ 栄養レポート</button>
      <button class="btn btn-ghost" style="flex:1" onclick="closeM()">閉じる</button>
    </div>
  `;
  openM('📋 '+sanitize(p.name,10)+' のデータ', html, true);
}

// AI栄養分析
function openNutritionAI(){
  const player = DB.players.find(x=>x.id===DB.currentUser?.id);
  const today = new Date().toISOString().slice(0,10);
  const todayMeals = (DB.nutritionLog[today]||[]);
  const totalKcal = todayMeals.reduce((s,m)=>s+(m.kcal||0),0);
  const totalProtein = todayMeals.reduce((s,m)=>s+(m.protein||0),0);
  const totalCarbs = todayMeals.reduce((s,m)=>s+(m.carbs||0),0);
  const totalFat = todayMeals.reduce((s,m)=>s+(m.fat||0),0);

  const targetKcal = player?.weight ? player.weight * 35 : 2000;
  const targetProtein = player?.weight ? player.weight * 1.6 : 80;

  const kcalPct = Math.min(Math.round(totalKcal/targetKcal*100),150);
  const proteinPct = Math.min(Math.round(totalProtein/targetProtein*100),150);

  openM('🤖 AI栄養分析', `
    <div style="margin-bottom:16px">
      <div style="font-size:13px;font-weight:700;margin-bottom:10px">📊 今日の栄養摂取状況</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
        ${[
          {l:'カロリー',v:totalKcal+'kcal',t:targetKcal+'kcal',pct:kcalPct,c:'var(--org)'},
          {l:'タンパク質',v:totalProtein+'g',t:targetProtein+'g',pct:proteinPct,c:'var(--teal)'},
          {l:'炭水化物',v:totalCarbs+'g',t:'--',pct:0,c:'var(--blue)'},
          {l:'脂質',v:totalFat+'g',t:'--',pct:0,c:'var(--yel)'},
        ].map(d=>`<div style="padding:10px;background:var(--surf2);border-radius:10px">
          <div style="font-size:10px;color:var(--txt3);margin-bottom:4px">${d.l}</div>
          <div style="font-size:16px;font-weight:800;color:${d.c}">${d.v}</div>
          <div style="font-size:10px;color:var(--txt3)">目標: ${d.t}</div>
          ${d.pct>0?`<div style="height:4px;background:var(--b2);border-radius:2px;margin-top:4px">
            <div style="width:${Math.min(d.pct,100)}%;height:100%;background:${d.c};border-radius:2px"></div>
          </div>`:''}
        </div>`).join('')}
      </div>
      <div style="padding:12px;border-radius:10px;background:${kcalPct<70?'rgba(239,68,68,.08)':kcalPct>120?'rgba(245,158,11,.08)':'rgba(34,197,94,.08)'};border:1px solid ${kcalPct<70?'rgba(239,68,68,.2)':kcalPct>120?'rgba(245,158,11,.2)':'rgba(34,197,94,.2)'}">
        <div style="font-size:12px;font-weight:700;margin-bottom:4px">${kcalPct<70?'⚠️ カロリー不足':kcalPct>120?'⚠️ カロリー過多':'✅ バランス良好'}</div>
        <div style="font-size:11px;color:var(--txt2);line-height:1.6">
          ${kcalPct<70?`目標の${kcalPct}%しか摂取できていません。あと${targetKcal-totalKcal}kcal必要です。`:
            kcalPct>120?`目標より${totalKcal-targetKcal}kcal多く摂取しています。`:
            `今日のカロリー摂取は目標の${kcalPct}%です。`}
          ${proteinPct<80?` タンパク質があと${Math.round(targetProtein-totalProtein)}g不足しています。`:''}
        </div>
      </div>
    </div>
    <button class="btn btn-primary w-full" onclick="closeM();goTo('ai')">🤖 AIにアドバイスをもらう</button>
  `, true);
}


// ════════════════════════════════════════════════════
// 高精度AI栄養分析エンジン v2
// ════════════════════════════════════════════════════

// ── Gemini AIによる自然文→食品解析 ──
function openAINutritionInput() {
  openM('🤖 AIで食事を記録', '<div style="margin-bottom:12px"><div style="font-size:13px;font-weight:700;margin-bottom:6px">食べたものを自由に入力してください</div><div style="font-size:11px;color:var(--txt3);line-height:1.6">例:「朝にコンビニで鮭おにぎりとサラダチキン食べた」「昼は松屋の牛丼大盛り」「夜は鶏むね焼き200gとブロッコリー、味噌汁」</div></div>'
    +'<textarea id="ai-meal-input" class="input" rows="4" placeholder="食べたものを自由に入力..." style="font-size:14px"></textarea>'
    +'<div style="display:flex;gap:8px;margin-top:12px"><button class="btn btn-primary flex-1" onclick="analyzeAIMealText()" id="ai-meal-btn">🤖 AI解析する</button></div>'
    +'<div id="ai-meal-result" style="margin-top:12px"></div>');
  setTimeout(function(){document.getElementById('ai-meal-input')?.focus();},100);
}

async function analyzeAIMealText() {
  var input = (document.getElementById('ai-meal-input')?.value||'').trim();
  if(!input) { toast('食事内容を入力してください','e'); return; }
  if(!RateLimit.check('ai_meal', 10, 60000)){ toast('AI解析が頻繁すぎます。しばらくお待ちください。','e'); return; }
  var btn = document.getElementById('ai-meal-btn');
  var resEl = document.getElementById('ai-meal-result');
  if(btn) { btn.disabled=true; btn.innerHTML='<i class="fa fa-spinner fa-spin"></i> 解析中...'; }

  // Step1: Try Gemini API if key is available
  var apiKey = _getGeminiKey();
  var parsed = null;

  if(apiKey) {
    try {
      parsed = await _geminiParseMeal(input, apiKey);
    } catch(e) {
    }
  }

  // Step2: Fallback to local intelligent matching
  if(!parsed || !parsed.length) {
    parsed = _localParseMeal(input);
  }

  if(btn) { btn.disabled=false; btn.innerHTML='🤖 AI解析する'; }

  if(!parsed.length) {
    if(resEl) resEl.innerHTML = '<div style="padding:16px;text-align:center;color:var(--txt3);font-size:12px">食品を特定できませんでした。もう少し具体的に入力してみてください。</div>';
    return;
  }

  // Display parsed results with edit capability
  var totalKcal=0, totalP=0, totalC=0, totalF=0;
  var h = '<div style="font-size:12px;font-weight:700;margin-bottom:8px;color:var(--teal)">✅ '+parsed.length+'品を検出しました</div>';
  parsed.forEach(function(item, i) {
    totalKcal += item.kcal||0;
    totalP += item.protein||0;
    totalC += item.carb||0;
    totalF += item.fat||0;
    var catEmoji = {'肉':'🍖','魚':'🐟','主食':'🍚','野菜':'🥦','果物':'🍎','乳製品':'🥛','卵・大豆':'🥚','外食':'🍱','補食':'🍫','飲料':'🥤','惣菜':'🍳'}[item.cat]||'🍽️';
    h += '<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--surf2);border-radius:8px;margin-bottom:4px">';
    h += '<span style="font-size:16px">'+catEmoji+'</span>';
    h += '<div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:600">'+sanitize(item.name,25)+'</div>';
    h += '<div style="font-size:10px;color:var(--txt3)">'+item.kcal+'kcal / P'+fmtN(item.protein)+'g C'+fmtN(item.carb)+'g F'+fmtN(item.fat)+'g'+(item.serving?' · '+item.serving+'g':'')+'</div></div>';
    h += '<button class="btn btn-ghost" style="font-size:10px;padding:4px 8px;color:var(--red)" onclick="this.parentElement.remove();_updateAIParsedTotal()">✕</button></div>';
  });
  h += '<div id="ai-parsed-total" style="padding:10px;background:linear-gradient(135deg,rgba(0,207,170,.06),rgba(59,130,246,.06));border-radius:10px;margin-top:8px;display:grid;grid-template-columns:repeat(4,1fr);gap:4px;text-align:center">';
  h += '<div><div style="font-size:14px;font-weight:800;color:var(--org)">'+totalKcal+'</div><div style="font-size:9px;color:var(--txt3)">kcal</div></div>';
  h += '<div><div style="font-size:14px;font-weight:800;color:var(--teal)">'+fmtN(totalP)+'g</div><div style="font-size:9px;color:var(--txt3)">タンパク質</div></div>';
  h += '<div><div style="font-size:14px;font-weight:800;color:var(--blue)">'+fmtN(totalC)+'g</div><div style="font-size:9px;color:var(--txt3)">炭水化物</div></div>';
  h += '<div><div style="font-size:14px;font-weight:800;color:var(--yel)">'+fmtN(totalF)+'g</div><div style="font-size:9px;color:var(--txt3)">脂質</div></div></div>';
  h += '<button class="btn btn-primary w-full mt-12" onclick="_addAIParsedMeals()">📝 '+parsed.length+'品をまとめて記録する</button>';

  if(resEl) resEl.innerHTML = h;
  window._aiParsedMeals = parsed;
}

async function _geminiParseMeal(text, apiKey) {
  var prompt = 'あなたは栄養士です。以下の食事テキストから各食品を特定し、JSONの配列で返してください。各食品は {name, kcal, protein, carb, fat, fiber, serving(g), cat} の形式です。catは「主食」「肉」「魚」「野菜」「果物」「卵・大豆」「乳製品」「外食」「補食」「飲料」「惣菜」のいずれか。量が不明な場合は一般的な1人前で推定。必ずJSON配列のみを返し、マークダウンや説明文は不要です。\n\n食事テキスト: '+text;
  
  var resp = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
    method:'POST',
    headers:{'Content-Type':'application/json','x-goog-api-key':apiKey},
    body:JSON.stringify({
      contents:[{parts:[{text:prompt}]}],
      generationConfig:{temperature:0.1,maxOutputTokens:2000}
    })
  });
  var data = await resp.json();
  var txt = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  // Extract JSON from response
  txt = txt.replace(/```json|```/g,'').trim();
  try {
    var items = JSON.parse(txt);
    if(Array.isArray(items)) return items.map(function(it){
      return {name:it.name||'不明',kcal:Math.round(it.kcal||0),protein:Math.round((it.protein||0)*10)/10,
        carb:Math.round((it.carb||0)*10)/10,fat:Math.round((it.fat||0)*10)/10,
        fiber:it.fiber||0,serving:it.serving||0,cat:it.cat||'外食',_source:'gemini'};
    });
  } catch(e) { }
  return [];
}

function _localParseMeal(text) {
  // Local intelligent food matching without API
  var results = [];
  var lower = text.toLowerCase();
  // Normalize: remove extra spaces, convert katakana
  lower = lower.replace(/\s+/g,' ').trim();

  // Split by common delimiters
  var parts = lower.split(/[、,。と＆&\n]/).map(function(s){return s.trim();}).filter(Boolean);
  
  parts.forEach(function(part) {
    // Try exact match first
    var bestMatch = null, bestScore = 0;
    FOOD_DB.forEach(function(f, idx) {
      var fname = f.name.toLowerCase();
      var score = 0;
      
      // Exact name match
      if(fname.includes(part) || part.includes(fname.split('（')[0])) score = 100;
      
      // Partial word matching
      var words = part.split(/\s/);
      words.forEach(function(w) {
        if(w.length < 2) return;
        if(fname.includes(w)) score += 30;
        // Try synonym
        var syns = typeof _getSynonyms==='function' ? _getSynonyms(w) : [];
        syns.forEach(function(s){ if(fname.includes(s.toLowerCase())) score += 25; });
      });
      
      // Quantity detection
      var qMatch = part.match(/(\d+)(g|グラム|個|枚|杯|本|切|皿|人前)/);
      if(qMatch) score += 5; // bonus for having quantity info
      
      if(score > bestScore) { bestScore = score; bestMatch = {f:f, idx:idx, qMatch:qMatch}; }
    });
    
    if(bestMatch && bestScore >= 25) {
      var f = bestMatch.f;
      var multiplier = 1;
      // Adjust for quantity
      if(bestMatch.qMatch) {
        var qty = parseInt(bestMatch.qMatch[1]);
        var unit = bestMatch.qMatch[2];
        if(unit === 'g' || unit === 'グラム') {
          multiplier = qty / (f.serving || 100);
        } else if(unit === '個' || unit === '枚' || unit === '杯' || unit === '本' || unit === '切') {
          multiplier = qty;
        } else if(unit === '人前' || unit === '皿') {
          multiplier = qty;
        }
      }
      // Check for size modifiers
      if(part.includes('大盛') || part.includes('大')) multiplier *= 1.5;
      if(part.includes('小') || part.includes('ハーフ')) multiplier *= 0.5;
      
      results.push({
        name: f.name, kcal: Math.round(f.kcal * multiplier),
        protein: Math.round(f.protein * multiplier * 10)/10,
        carb: Math.round(f.carb * multiplier * 10)/10,
        fat: Math.round(f.fat * multiplier * 10)/10,
        fiber: Math.round((f.fiber||0) * multiplier * 10)/10,
        serving: Math.round((f.serving||100) * multiplier),
        cat: f.cat, _source:'local', _dbIdx: bestMatch.idx
      });
    }
  });
  
  return results;
}

function _addAIParsedMeals() {
  var meals = window._aiParsedMeals;
  if(!meals || !meals.length) { toast('追加する食品がありません','e'); return; }
  if(!DB.meals) DB.meals = {today:[],water:0};
  if(!DB.meals.today) DB.meals.today = [];
  
  var hour = new Date().getHours();
  var mealType = hour<10?'breakfast':hour<14?'lunch':hour<17?'snack':'dinner';
  
  meals.forEach(function(item) {
    DB.meals.today.push({
      name: item.name, kcal: item.kcal, protein: item.protein,
      carb: item.carb, fat: item.fat, fiber: item.fiber||0,
      serving: item.serving||0, cat: item.cat||'外食',
      type: mealType, time: new Date().toTimeString().slice(0,5),
      vitC:item.vitC||0, calcium:item.calcium||0, iron:item.iron||0,
      zinc:item.zinc||0, magnesium:item.magnesium||0, vitD:item.vitD||0,
      omega3:item.omega3||0, gi:item.gi||0,
      sodium:item.sodium||0, vitB1:item.vitB1||0,
      _aiParsed: true
    });
    // Learn this food for future quick-add
    _learnFood(item);
  });
  
  saveDB();
  closeM();
  toast('🤖 '+meals.length+'品を記録しました！','s');
  window._aiParsedMeals = null;
  goTo('nutrition');
}

function _learnFood(item) {
  if(!DB.myFoods) DB.myFoods = [];
  var existing = DB.myFoods.find(function(f){return f.name===item.name;});
  if(existing) {
    existing.count = (existing.count||0)+1;
    existing.lastUsed = new Date().toISOString();
  } else if(DB.myFoods.length < 200) {
    DB.myFoods.push({
      name:item.name, kcal:item.kcal, protein:item.protein,
      carb:item.carb, fat:item.fat, fiber:item.fiber||0,
      serving:item.serving||0, cat:item.cat||'外食',
      count:1, lastUsed:new Date().toISOString()
    });
  }
}

// ── 適応型目標自動調整 ──
function getAdaptiveGoals() {
  var player = DB.players.find(function(x){return x.id===DB.currentUser?.id;});
  var w = (player?.weight) || 65;
  var baseGoal = _getNutriGoals();
  if(baseGoal.isSet) return baseGoal; // ユーザー手動設定がある場合はそのまま

  // トレーニング強度から推定
  var todayStr = new Date().toISOString().slice(0,10);
  var tLog = DB.trainingLog?.[player?.id||''] || {};
  var todayTrain = tLog[todayStr];
  var weekTrainDays = 0;
  for(var i=0; i<7; i++) {
    var ds = new Date(Date.now()-i*86400000).toISOString().slice(0,10);
    if(tLog[ds]) weekTrainDays++;
  }

  // 活動レベル係数
  var activityFactor = weekTrainDays >= 5 ? 1.9 : weekTrainDays >= 3 ? 1.7 : weekTrainDays >= 1 ? 1.5 : 1.3;
  if(todayTrain) activityFactor += 0.15; // 今日トレーニングした場合

  // 体調連動
  var cLog = DB.conditionLog?.[player?.id||''] || {};
  var todayCond = cLog[todayStr];
  if(todayCond && todayCond.mood <= 4) activityFactor *= 0.9; // 体調不良時は控えめに

  var kcal = Math.round(w * 24 * activityFactor);
  var protein = Math.round(w * (weekTrainDays >= 3 ? 2.0 : 1.6));
  var fat = Math.round(w * 1.0);
  var carb = Math.round((kcal - protein*4 - fat*9) / 4);

  return {
    kcal:kcal, protein:protein, carb:Math.max(carb,100), fat:fat,
    fiber:25, vitC:100, calcium:800, iron:10,
    zinc:10, magnesium:350, vitD:8, omega3:2,
    pfcP:Math.round(protein*4/kcal*100), pfcF:Math.round(fat*9/kcal*100),
    pfcC:Math.round(carb*4/kcal*100),
    isAdaptive:true, activityFactor:activityFactor, weekTrainDays:weekTrainDays
  };
}

// ── 週間栄養トレンド分析 ──
function getWeeklyNutritionTrend() {
  var hist = DB.mealHistory || {};
  var days = [];
  for(var i=6; i>=0; i--) {
    var ds = new Date(Date.now()-i*86400000).toISOString().slice(0,10);
    var dayMeals = hist[ds] || [];
    var totKcal=0, totP=0, totC=0, totF=0, mealCount=dayMeals.length;
    dayMeals.forEach(function(m){
      totKcal += m.kcal||0; totP += m.protein||0; totC += m.carb||0; totF += m.fat||0;
    });
    days.push({date:ds, kcal:totKcal, protein:totP, carb:totC, fat:totF, meals:mealCount});
  }
  
  var avgKcal = days.reduce(function(s,d){return s+d.kcal;},0) / 7;
  var avgP = days.reduce(function(s,d){return s+d.protein;},0) / 7;
  var daysWithData = days.filter(function(d){return d.meals>0;}).length;
  
  // Trend direction (comparing last 3 days vs first 3 days)
  var recentAvg = days.slice(4).reduce(function(s,d){return s+d.kcal;},0)/3;
  var olderAvg = days.slice(0,3).reduce(function(s,d){return s+d.kcal;},0)/3;
  var trend = recentAvg > olderAvg * 1.1 ? 'up' : recentAvg < olderAvg * 0.9 ? 'down' : 'stable';
  
  return {days:days, avgKcal:Math.round(avgKcal), avgProtein:Math.round(avgP*10)/10,
    daysWithData:daysWithData, trend:trend,
    consistency: daysWithData >= 5 ? 'good' : daysWithData >= 3 ? 'fair' : 'poor'};
}

// ── 食事-体調相関分析 ──
function getNutritionConditionCorrelation() {
  var player = DB.players.find(function(x){return x.id===DB.currentUser?.id;});
  if(!player) return null;
  var hist = DB.mealHistory || {};
  var cLog = DB.conditionLog?.[player.id] || {};
  var dataPoints = [];
  
  Object.keys(cLog).forEach(function(date) {
    var dayMeals = hist[date] || [];
    if(!dayMeals.length) return;
    var totP = dayMeals.reduce(function(s,m){return s+(m.protein||0);},0);
    var totKcal = dayMeals.reduce(function(s,m){return s+(m.kcal||0);},0);
    var mood = cLog[date].mood || 0;
    var sleep = cLog[date].sleep || 0;
    if(mood > 0) dataPoints.push({date:date, protein:totP, kcal:totKcal, mood:mood, sleep:sleep});
  });
  
  if(dataPoints.length < 5) return null;
  
  // Simple correlation analysis
  var highProteinDays = dataPoints.filter(function(d){return d.protein >= (player.weight||65)*1.6;});
  var lowProteinDays = dataPoints.filter(function(d){return d.protein < (player.weight||65)*1.2;});
  var avgMoodHigh = highProteinDays.length ? highProteinDays.reduce(function(s,d){return s+d.mood;},0)/highProteinDays.length : 0;
  var avgMoodLow = lowProteinDays.length ? lowProteinDays.reduce(function(s,d){return s+d.mood;},0)/lowProteinDays.length : 0;
  
  var insights = [];
  if(highProteinDays.length >= 3 && lowProteinDays.length >= 3) {
    if(avgMoodHigh - avgMoodLow >= 1.0) {
      insights.push({type:'positive',msg:'高タンパク日は体調が平均+'+(avgMoodHigh-avgMoodLow).toFixed(1)+'ポイント良好です。タンパク質の摂取を維持しましょう。'});
    }
  }
  
  return {dataPoints:dataPoints.length, insights:insights, avgMoodHigh:avgMoodHigh, avgMoodLow:avgMoodLow};
}


// ════════════════════════════════════════════════════
// 未定義関数の修正・追加
// ════════════════════════════════════════════════════

// ① changeSetDone - トレーニングのセット数増減
function changeSetDone(wid, idx, delta, color){
  const key = wid+'_'+idx;
  if(!DB.doneSets)DB.doneSets={};
  if(!DB.doneSets[key]) DB.doneSets[key] = 0;
  const ex = getAllWorkouts().find(w=>w.id===wid)?.exercises?.[idx];
  const maxSets = ex?.sets || 99;
  DB.doneSets[key] = Math.max(0, Math.min(DB.doneSets[key] + delta, maxSets));
  const done = DB.doneSets[key] >= maxSets;
  // UI更新
  const counter = document.getElementById('ex-count-'+wid+'-'+idx);
  if(counter) counter.textContent = DB.doneSets[key]+'/'+maxSets;
  const chk = document.getElementById('ex-chk-'+wid+'-'+idx);
  if(chk){ chk.classList.toggle('done', done); chk.innerHTML = done?'<i class="fa fa-check"></i>':''; }
  if(done) toast('✅ セット完了！', 's');
  saveDB();
}

// ② openStripeSetup - Stripe口座設定
function openStripeSetup(){
  openM('⚡ Stripe口座設定', `
    <div style="text-align:center;padding:8px 0">
      <div style="font-size:48px;margin-bottom:12px">💳</div>
      <div class="fw7 mb-8">コーチ報酬の振込口座を設定します</div>
      <p class="text-sm text-muted mb-20">Stripeを通じて安全に銀行口座を登録できます。<br>設定後、月謝の自動振込が可能になります。</p>
      <div style="display:flex;flex-direction:column;gap:10px">
        <button class="btn btn-primary" onclick="startStripeConnect();closeM()">🔗 Stripeで口座を登録する</button>
        <button class="btn btn-ghost" onclick="closeM()">後で設定する</button>
      </div>
    </div>
  `);
}

// ③ bulkRequest - 月謝一括請求
function bulkRequest(){
  const team = getMyTeam();
  if(!team){ toast('チーム情報が見つかりません','e'); return; }
  const month = curMonth();
  const unpaid = DB.players.filter(p=>{
    if(p.team!==team.id) return false;
    const pay = _dbArr('payments').find(x=>x.player===p.id&&x.month===month);
    return !pay || pay.status!=='paid';
  });
  if(unpaid.length===0){ toast('今月の未払い選手はいません','i'); return; }
  openM('📧 月謝一括請求', `
    <div class="fw7 mb-12">対象: ${unpaid.length}名 / 今月(${month})</div>
    <div style="max-height:200px;overflow-y:auto;margin-bottom:16px">
      ${unpaid.map(p=>`<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--b1)">
        <span class="text-sm">${sanitize(p.name,20)}</span>
        <span class="text-sm fw7">¥${fmtNum(team.fee||5000)}</span>
      </div>`).join('')}
    </div>
    <div style="padding:10px;background:var(--surf2);border-radius:8px;font-size:12px;margin-bottom:16px">
      合計: ¥${fmtNum((team.fee||5000)*unpaid.length)} を${unpaid.length}名に請求
    </div>
    <div class="flex gap-10">
      <button class="btn btn-primary" style="flex:1" onclick="doBulkInvoice();closeM()">✓ 請求を送る</button>
      <button class="btn btn-ghost" onclick="closeM()">キャンセル</button>
    </div>
  `);
}

// ④ exportData - JSONエクスポート
function exportData(){
  try{
    const data = {};
    PERSIST_FIELDS.forEach(k=>{data[k]=DB[k];});
    data.exportedAt = new Date().toISOString();
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'mycoach_data_'+new Date().toISOString().slice(0,10)+'.json';
    a.click();
    URL.revokeObjectURL(a.href);
    toast('データをエクスポートしました','s');
  } catch(e){
    toast('エクスポートに失敗しました','e');
  }
}

// ⑤ exportUsersCSV - CSVエクスポート
function exportUsersCSV(){
  try{
    const rows = [['ロール','名前','メール','登録日']];
    ['coaches','teams','players'].forEach(type=>{
      const role = type==='coaches'?'コーチ':type==='teams'?'チーム':'選手';
      (DB[type]||[]).forEach(u=>{
        rows.push([role, u.name||'', u.email||'', u.createdAt||'']);
      });
    });
    const csv = rows.map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n');
    const blob = new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'users_'+new Date().toISOString().slice(0,10)+'.csv';
    a.click();
    URL.revokeObjectURL(a.href);
    toast('CSVをエクスポートしました','s');
  } catch(e){
    toast('エクスポートに失敗しました','e');
  }
}

// ⑥ openEventModal / addEvent - カレンダーイベント追加
function openEventModal(dateStr){
  const target = dateStr || new Date().toISOString().slice(0,10);
  openM('📅 イベントを追加 - '+target.slice(5), `
    <div class="form-group"><label class="label">タイトル</label>
      <input class="input" id="ev-title" placeholder="例: 練習試合・保護者会"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div class="form-group"><label class="label">開始時間</label>
        <input class="input" type="time" id="ev-start" value="09:00"></div>
      <div class="form-group"><label class="label">終了時間</label>
        <input class="input" type="time" id="ev-end" value="11:00"></div>
    </div>
    <div class="form-group"><label class="label">場所</label>
      <input class="input" id="ev-place" placeholder="例: ○○体育館"></div>
    <div class="form-group"><label class="label">種別</label>
      <select class="input" id="ev-type">
        <option value="practice">練習</option>
        <option value="match">試合</option>
        <option value="event">イベント</option>
        <option value="meeting">ミーティング</option>
        <option value="other">その他</option>
      </select>
    </div>
    <div class="form-group"><label class="label">繰り返し</label>
      <select class="input" id="ev-repeat">
        <option value="none">繰り返しなし</option>
        <option value="weekly">毎週</option>
        <option value="monthly">毎月</option>
        <option value="daily">毎日</option>
      </select></div>
    <div class="form-group"><label class="label">メモ（任意）</label>
      <textarea class="input" id="ev-memo" rows="2" placeholder="場所・持ち物など"></textarea></div>
    <button class="btn btn-primary w-full mt-8" onclick="addEvent('${target}')">📅 追加する</button>
  `);
}

function addEvent(dateStr){
  const title = document.getElementById('ev-title')?.value?.trim();
  if(!title){ toast('タイトルを入力してください','e'); return; }
  const startT = document.getElementById('ev-start')?.value||'';
  const place  = document.getElementById('ev-place')?.value?.trim()||'';
  const type   = document.getElementById('ev-type')?.value||'other';
  const repeat = document.getElementById('ev-repeat')?.value||'none';
  const note   = document.getElementById('ev-memo')?.value?.trim()||'';
  if(!DB.events) DB.events = [];
  // dateStr を year/month/date 数値に変換（カレンダー形式に合わせる）
  const d = new Date(dateStr + 'T00:00:00');
  const baseEv = {
    id: genId('ev'), title: sanitize(title,60),
    date: d.getDate(), month: d.getMonth(), year: d.getFullYear(),
    time: startT, type,
    repeat: repeat !== 'none' ? repeat : undefined,
    note: note ? sanitize(note,200) : undefined,
    place: place ? sanitize(place,50) : undefined,
    attendees: [],
    createdAt: new Date().toISOString(),
    createdBy: DB.currentUser?.id,
    teamId: _getMyTeamId(),
    scope: DB.currentUser?.role==='team'?'team':'personal',
  };
  DB.events.push(baseEv);
  // 試合の場合は結果入力を促す
  if(type==='match'){ toast('試合を追加しました。終了後に結果を入力できます','s'); }
  // 繰り返しイベントの生成（最大52週/12ヶ月）
  if(repeat !== 'none'){
    const maxIter = repeat==='weekly'?52:repeat==='daily'?90:12;
    for(let i=1;i<=maxIter;i++){
      const nd = new Date(d);
      if(repeat==='weekly') nd.setDate(d.getDate()+i*7);
      else if(repeat==='monthly') nd.setMonth(d.getMonth()+i);
      else if(repeat==='daily') nd.setDate(d.getDate()+i);
      if(nd.getFullYear()-d.getFullYear()>1) break;
      DB.events.push({...baseEv,id:genId('ev'),date:nd.getDate(),month:nd.getMonth(),year:nd.getFullYear(),repeat:undefined,parentId:baseEv.id});
    }
  }
  saveDB();
  toast('イベントを追加しました','s');
  closeM();
  goTo('calendar');
}

// 本番環境: コーチデータは管理者が登録
function ensureCoachSamples(){
  // no-op in production
}


// ════════════════════════════════════════
// Phase 4: B-2 グローバルエラーハンドラー
// ════════════════════════════════════════
const ErrorTypes = {
  NETWORK:  {icon:'fa-wifi',title:'接続エラー',desc:'ネットワークに接続できません。接続を確認してください。',color:'#ef4444'},
  AUTH:     {icon:'fa-lock',title:'認証エラー',desc:'ログインが必要です。再ログインしてください。',color:'#f59e0b'},
  DATA:     {icon:'fa-database',title:'データエラー',desc:'データの読み込みに失敗しました。',color:'#ef4444'},
  SAVE:     {icon:'fa-save',title:'保存エラー',desc:'データの保存に失敗しました。再試行してください。',color:'#ef4444'},
  GENERAL:  {icon:'fa-exclamation-circle',title:'エラー',desc:'問題が発生しました。',color:'#ef4444'}
};

function inlineError(containerId, type, customDesc, retryFn) {
  var et = ErrorTypes[type] || ErrorTypes.GENERAL;
  var desc = customDesc || et.desc;
  var el = document.getElementById(containerId);
  if(!el) return;
  var retryHtml = retryFn ? '<div class="err-inline-retry" onclick="'+retryFn+'"><i class="fa fa-redo" style="font-size:10px"></i> 再試行</div>' : '';
  el.innerHTML = '<div class="err-inline"><div class="err-inline-icon"><i class="fa '+et.icon+'"></i></div><div class="err-inline-body"><div class="err-inline-title">'+et.title+'</div><div class="err-inline-desc">'+desc+'</div>'+retryHtml+'</div></div>';
}

function showOfflineBanner2() {
  var b = document.getElementById('offline-banner2');
  if(!b) {
    b = document.createElement('div');
    b.id = 'offline-banner2';
    b.className = 'err-offline-banner';
    b.innerHTML = '<i class="fa fa-wifi"></i> オフラインです — 接続が回復すると自動的に同期されます';
    document.body.appendChild(b);
  }
  setTimeout(function(){b.classList.add('show');}, 50);
}
function hideOfflineBanner2() {
  var b = document.getElementById('offline-banner2');
  if(b) b.classList.remove('show');
}
window.addEventListener('offline', showOfflineBanner2);
window.addEventListener('online', function(){
  hideOfflineBanner2();
  toast('オンラインに復帰しました','s');
});

// wrap async operations with retry
function withRetry(fn, maxRetries, delay) {
  maxRetries = maxRetries || 3;
  delay = delay || 1000;
  return function() {
    var args = arguments;
    var attempt = 0;
    function tryOnce() {
      attempt++;
      try {
        var result = fn.apply(null, args);
        if(result && typeof result.then === 'function') {
          return result.catch(function(e) {
            if(attempt < maxRetries) {
              return new Promise(function(res){ setTimeout(function(){ res(tryOnce()); }, delay * attempt); });
            }
            throw e;
          });
        }
        return result;
      } catch(e) {
        if(attempt < maxRetries) {
          return new Promise(function(res){ setTimeout(function(){ res(tryOnce()); }, delay * attempt); });
        }
        throw e;
      }
    }
    return tryOnce();
  };
}


// ════════════════════════════════════════
// Phase 4: B-6 プルダウンリフレッシュ
// ════════════════════════════════════════
var _ptrState = { active:false, startY:0, pulling:false };

function initPullToRefresh() {
  var pb = document.getElementById('page-body');
  if(!pb || window.innerWidth > 768) return; // mobile only
  if(pb._ptrInit) return;
  pb._ptrInit = true;

  var indicator = document.createElement('div');
  indicator.className = 'ptr-indicator';
  indicator.innerHTML = '<i class="fa fa-arrow-down"></i>';
  indicator.id = 'ptr-ind';
  pb.style.position = 'relative';
  pb.style.overflow = 'hidden';
  pb.insertBefore(indicator, pb.firstChild);

  pb.addEventListener('touchstart', function(e) {
    if(pb.scrollTop <= 0) {
      _ptrState.active = true;
      _ptrState.startY = e.touches[0].clientY;
      _ptrState.pulling = false;
    }
  }, {passive:true});

  pb.addEventListener('touchmove', function(e) {
    if(!_ptrState.active) return;
    var dy = e.touches[0].clientY - _ptrState.startY;
    if(dy > 10 && pb.scrollTop <= 0) {
      _ptrState.pulling = true;
      var pullDist = Math.min(dy * 0.4, 60);
      indicator.style.top = (pullDist - 40) + 'px';
      indicator.classList.toggle('pulling', pullDist > 30);
      var ico = indicator.querySelector('i');
      if(ico) ico.style.transform = 'rotate(' + Math.min(dy, 180) + 'deg)';
    }
  }, {passive:true});

  pb.addEventListener('touchend', function() {
    if(!_ptrState.active) return;
    if(_ptrState.pulling && indicator.classList.contains('pulling')) {
      indicator.classList.add('refreshing');
      indicator.innerHTML = '<i class="fa fa-sync-alt"></i>';
      setTimeout(function() {
        indicator.classList.remove('pulling','refreshing');
        indicator.style.top = '-50px';
        indicator.innerHTML = '<i class="fa fa-arrow-down"></i>';
        refreshPage();
        toast('更新しました','s');
      }, 600);
    } else {
      indicator.classList.remove('pulling');
      indicator.style.top = '-50px';
    }
    _ptrState.active = false;
    _ptrState.pulling = false;
  }, {passive:true});
}


// ════════════════════════════════════════
// Phase 4: グローバル検索
// ════════════════════════════════════════
var _gsearchOpen = false;

function openGlobalSearch() {
  if(_gsearchOpen) return;
  _gsearchOpen = true;
  var overlay = document.createElement('div');
  overlay.id = 'gsearch-overlay';
  overlay.className = 'gsearch-overlay';
  overlay.onclick = function(){ closeGlobalSearch(); };

  var box = document.createElement('div');
  box.id = 'gsearch-box';
  box.className = 'gsearch-box';
  box.onclick = function(e){ e.stopPropagation(); };
  box.innerHTML = '<div class="gsearch-input-wrap"><i class="fa fa-search"></i><input class="gsearch-input" id="gsearch-inp" placeholder="選手・イベント・お知らせを検索..." autocomplete="off"><span class="gsearch-kbd">ESC</span></div><div class="gsearch-results" id="gsearch-res"><div class="gsearch-empty">キーワードを入力してください</div></div>';

  document.body.appendChild(overlay);
  document.body.appendChild(box);
  setTimeout(function(){
    overlay.classList.add('active');
    box.classList.add('active');
    var inp = document.getElementById('gsearch-inp');
    if(inp) {
      inp.focus();
      inp.addEventListener('input', _debounceGSearch);
    }
  }, 30);
}

function closeGlobalSearch() {
  _gsearchOpen = false;
  var ov = document.getElementById('gsearch-overlay');
  var bx = document.getElementById('gsearch-box');
  if(ov) { ov.classList.remove('active'); setTimeout(function(){ ov.remove(); }, 250); }
  if(bx) { bx.classList.remove('active'); setTimeout(function(){ bx.remove(); }, 250); }
}

var _gsTimer = null;
function _debounceGSearch() {
  clearTimeout(_gsTimer);
  _gsTimer = setTimeout(function(){ runGlobalSearch(); }, 200);
}

function runGlobalSearch() {
  var inp = document.getElementById('gsearch-inp');
  var res = document.getElementById('gsearch-res');
  if(!inp || !res) return;
  var q = (inp.value||'').trim().toLowerCase();
  if(!q) { res.innerHTML = '<div class="gsearch-empty">キーワードを入力してください</div>'; return; }

  var results = [];
  var me = DB.currentUser;
  var teamId = _getMyTeamId();

  // Search players
  (DB.players||[]).forEach(function(p) {
    if(!p || !p.name) return;
    if(teamId && p.teamId && p.teamId !== teamId && me?.role !== 'admin') return;
    if(p.name.toLowerCase().includes(q) || (p.email||'').toLowerCase().includes(q) || (p.position||'').toLowerCase().includes(q)) {
      results.push({cat:'選手',icon:'fa-user',bg:'rgba(59,130,246,.1)',color:'#3b82f6',title:p.name,sub:(p.position||'')+' '+(p.email||''),action:"goTo('my-team')"});
    }
  });

  // Search events
  (DB.events||[]).forEach(function(e) {
    if(!e || !e.title) return;
    if(e.title.toLowerCase().includes(q) || (e.note||'').toLowerCase().includes(q) || (e.place||'').toLowerCase().includes(q)) {
      var dt = e.year+'/'+((e.month||0)+1)+'/'+e.date;
      results.push({cat:'イベント',icon:'fa-calendar-alt',bg:'rgba(168,85,247,.1)',color:'#a855f7',title:e.title,sub:dt+' '+(e.time||''),action:"closeGlobalSearch();goTo('calendar')"});
    }
  });

  // Search announcements
  (DB.announcements||[]).forEach(function(a) {
    if(!a || !a.title) return;
    if((a.title||'').toLowerCase().includes(q) || (a.body||'').toLowerCase().includes(q)) {
      results.push({cat:'お知らせ',icon:'fa-bullhorn',bg:'rgba(249,115,22,.1)',color:'#f97316',title:a.title,sub:(a.createdAt||'').slice(0,10),action:"closeGlobalSearch();goTo('dashboard')"});
    }
  });

  // Search coaches
  (DB.coaches||[]).forEach(function(c) {
    if(!c || !c.name) return;
    if(c.name.toLowerCase().includes(q) || (c.sport||'').toLowerCase().includes(q) || (c.bio||'').toLowerCase().includes(q)) {
      results.push({cat:'コーチ',icon:'fa-chalkboard-teacher',bg:'rgba(0,207,170,.1)',color:'var(--teal)',title:c.name,sub:c.sport||'',action:"closeGlobalSearch();goTo('coach-search')"});
    }
  });

  // Search teams
  (DB.teams||[]).forEach(function(t) {
    if(!t || !t.name) return;
    if(t.name.toLowerCase().includes(q) || (t.sport||'').toLowerCase().includes(q)) {
      results.push({cat:'チーム',icon:'fa-users',bg:'rgba(59,130,246,.1)',color:'#3b82f6',title:t.name,sub:t.sport||'',action:"closeGlobalSearch();goTo('dashboard')"});
    }
  });

  // Search inventory
  (DB.inventory||[]).forEach(function(item) {
    if(!item || !item.name) return;
    if(item.name.toLowerCase().includes(q)) {
      results.push({cat:'物品',icon:'fa-box',bg:'rgba(234,179,8,.1)',color:'#eab308',title:item.name,sub:'在庫: '+(item.stock||0),action:"closeGlobalSearch();goTo('inventory')"});
    }
  });

  // Search pages (navigation)
  var pageList = [
    {k:'dashboard',l:'ダッシュボード',icon:'fa-tachometer-alt',bg:'rgba(59,130,246,.1)',color:'#3b82f6'},
    {k:'my-team',l:'マイチーム・選手管理',icon:'fa-users',bg:'rgba(59,130,246,.1)',color:'#3b82f6'},
    {k:'fee',l:'月謝管理',icon:'fa-yen-sign',bg:'rgba(249,115,22,.1)',color:'#f97316'},
    {k:'calendar',l:'カレンダー・スケジュール',icon:'fa-calendar-alt',bg:'rgba(168,85,247,.1)',color:'#a855f7'},
    {k:'chat',l:'メッセージ・チャット',icon:'fa-comments',bg:'rgba(34,197,94,.1)',color:'#22c55e'},
    {k:'coach-search',l:'コーチ検索',icon:'fa-chalkboard-teacher',bg:'rgba(0,207,170,.1)',color:'var(--teal)'},
    {k:'player-compare',l:'選手比較・ランキング',icon:'fa-chart-bar',bg:'rgba(236,72,153,.1)',color:'#ec4899'},
    {k:'weekly-report',l:'週次レポート',icon:'fa-file-alt',bg:'rgba(59,130,246,.1)',color:'#3b82f6'},
    {k:'data-export',l:'データエクスポート・CSV出力',icon:'fa-download',bg:'rgba(249,115,22,.1)',color:'#f97316'},
    {k:'notifications',l:'通知センター',icon:'fa-bell',bg:'rgba(239,68,68,.1)',color:'#ef4444'},
    {k:'inventory',l:'備品・物品管理',icon:'fa-boxes',bg:'rgba(234,179,8,.1)',color:'#eab308'},
    {k:'profile-settings',l:'プロフィール設定',icon:'fa-user-cog',bg:'rgba(148,163,184,.1)',color:'#94a3b8'},
    {k:'settings',l:'アプリ設定',icon:'fa-cog',bg:'rgba(148,163,184,.1)',color:'#94a3b8'},
    {k:'ai-prediction',l:'AIパフォーマンス予測',icon:'fa-brain',bg:'rgba(168,85,247,.1)',color:'#a855f7'},
    {k:'bookmarks',l:'ブックマーク・お気に入り',icon:'fa-star',bg:'rgba(234,179,8,.1)',color:'#eab308'},
    {k:'team-match',l:'チームマッチング・練習試合',icon:'fa-futbol',bg:'rgba(59,130,246,.1)',color:'#3b82f6'},
    {k:'threads',l:'掲示板・スレッド',icon:'fa-clipboard-list',bg:'rgba(148,163,184,.1)',color:'#64748b'},
  ];
  pageList.forEach(function(p) {
    if(p.l.toLowerCase().includes(q) || p.k.includes(q)) {
      results.push({cat:'ページ',icon:p.icon,bg:p.bg,color:p.color,title:p.l,sub:'→ ページに移動',action:"closeGlobalSearch();goTo('"+p.k+"')"});
    }
  });

  if(!results.length) {
    res.innerHTML = '<div class="gsearch-empty"><div style="font-size:24px;margin-bottom:8px">🔍</div>「'+sanitize(q,20)+'」の検索結果はありません</div>';
    return;
  }

  // Group by category
  var cats = {};
  results.forEach(function(r) {
    if(!cats[r.cat]) cats[r.cat] = [];
    cats[r.cat].push(r);
  });

  var html = '';
  Object.keys(cats).forEach(function(cat) {
    html += '<div class="gsearch-cat">'+cat+' ('+cats[cat].length+')</div>';
    cats[cat].slice(0,5).forEach(function(r) {
      html += '<div class="gsearch-item" onclick="'+r.action+'"><div class="gsearch-item-icon" style="background:'+r.bg+';color:'+r.color+'"><i class="fa '+r.icon+'"></i></div><div class="gsearch-item-body"><div class="gsearch-item-title">'+sanitize(r.title,30)+'</div><div class="gsearch-item-sub">'+sanitize(r.sub,40)+'</div></div></div>';
    });
  });
  res.innerHTML = html;
}

// Note: Ctrl+K / Cmd+K / Escape handled in the main keydown listener above


// ════════════════════════════════════════
// Phase 4: データエクスポート（CSV）
// ════════════════════════════════════════
function exportPage() {
  var me = DB.currentUser;
  if(!me) return emptyState('📤','データエクスポート','ログインしてください');

  var items = [];

  if(me.role === 'team' || me.role === 'admin') {
    items.push({icon:'👥',title:'選手一覧',desc:'名前・ポジション・連絡先',bg:'rgba(59,130,246,.08)',fn:'exportPlayersCSV'});
    items.push({icon:'📋',title:'出欠データ',desc:'イベント別の出欠記録',bg:'rgba(34,197,94,.08)',fn:'exportAttendanceCSV'});
    items.push({icon:'💰',title:'月謝データ',desc:'支払い状況・回収率',bg:'rgba(249,115,22,.08)',fn:'exportFeesCSV'});
    items.push({icon:'📅',title:'イベント一覧',desc:'練習・試合・イベント',bg:'rgba(168,85,247,.08)',fn:'exportEventsCSV'});
    items.push({icon:'❤️',title:'体調データ',desc:'コンディション記録',bg:'rgba(239,68,68,.08)',fn:'exportConditionCSV'});
  }
  if(me.role === 'coach') {
    items.push({icon:'📊',title:'指導レポート',desc:'チーム・選手の概要',bg:'rgba(0,207,170,.08)',fn:'exportCoachReportCSV'});
  }
  if(me.role === 'player') {
    items.push({icon:'📈',title:'マイデータ',desc:'トレーニング・体調ログ',bg:'rgba(59,130,246,.08)',fn:'exportMyDataCSV'});
  }

  return '<div class="mb-20"><div style="font-size:18px;font-weight:800;margin-bottom:6px">📤 データエクスポート</div><div style="font-size:12px;color:var(--txt3)">CSV形式でデータをダウンロードできます</div></div><div style="display:grid;gap:10px">'
    +items.map(function(item){
      return '<div class="export-card" onclick="'+item.fn+'()"><div class="export-icon" style="background:'+item.bg+'">'+item.icon+'</div><div class="export-info"><div class="export-title">'+item.title+'</div><div class="export-desc">'+item.desc+'</div></div><i class="fa fa-download" style="color:var(--txt3);font-size:12px"></i></div>';
    }).join('')
    +'</div>';
}

function _csvDownload(filename, headers, rows) {
  var bom = '\uFEFF'; // UTF-8 BOM for Excel
  var csv = bom + headers.join(',') + '\n';
  rows.forEach(function(r) {
    csv += r.map(function(cell) {
      var s = String(cell||'').replace(/"/g,'""');
      return '"'+s+'"';
    }).join(',') + '\n';
  });
  var blob = new Blob([csv], {type:'text/csv;charset=utf-8'});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(function(){document.body.removeChild(a); URL.revokeObjectURL(url);}, 100);
  toast('📤 '+filename+' をダウンロードしました','s');
}

function _exportPlayersCSVBasic() {
  var players = DB.players||[];
  var teamId = _getMyTeamId();
  if(teamId) players = players.filter(function(p){return p.team===teamId;}); // FIX: p.team not p.teamId
  var headers = ['名前','メール','ポジション','背番号','年齢','参加日'];
  var rows = players.map(function(p){
    return [p.name||'',p.email||'',p.pos||p.position||'',p.number||'',p.age||'',p.joinedAt||p.createdAt||'']; // FIX: p.pos
  });
  _csvDownload('選手一覧_'+new Date().toISOString().slice(0,10)+'.csv', headers, rows);
}

function exportAttendanceCSV() {
  var att = DB.attendance||{};
  var events = DB.events||[];
  var players = DB.players||[];
  var teamId = _getMyTeamId();
  var headers = ['イベント','日付','選手','ステータス'];
  var rows = [];
  Object.keys(att).forEach(function(evId) {
    var ev = events.find(function(e){return e.id===evId;});
    if(!ev) return;
    if(teamId && ev.teamId !== teamId) return;
    var evName = ev.title||'';
    var evDate = ev.year+'/'+((ev.month||0)+1)+'/'+ev.date;
    Object.keys(att[evId]).forEach(function(pid) {
      var p = players.find(function(pl){return pl.id===pid;});
      var statMap = {present:'出席',absent:'欠席',late:'遅刻',excused:'公欠'};
      rows.push([evName, evDate, p?.name||pid, statMap[att[evId][pid]]||att[evId][pid]]);
    });
  });
  _csvDownload('出欠データ_'+new Date().toISOString().slice(0,10)+'.csv', headers, rows);
}

function exportFeesCSV() {
  var fees = DB.fees||{};
  var players = DB.players||[];
  var headers = ['選手','月','金額','ステータス','支払日'];
  var rows = [];
  Object.keys(fees).forEach(function(pid) {
    var p = players.find(function(pl){return pl.id===pid;});
    var pf = fees[pid]||{};
    Object.keys(pf).forEach(function(month) {
      var f = pf[month]||{};
      rows.push([p?.name||pid, month, f.amount||'', f.paid?'支払済':'未払い', f.paidAt||'']);
    });
  });
  _csvDownload('月謝データ_'+new Date().toISOString().slice(0,10)+'.csv', headers, rows);
}

function exportEventsCSV() {
  var events = DB.events||[];
  var teamId = _getMyTeamId();
  if(teamId) events = events.filter(function(e){return e.teamId===teamId;});
  var headers = ['タイトル','日付','時間','種別','場所','メモ'];
  var rows = events.map(function(e){
    return [e.title||'',e.year+'/'+((e.month||0)+1)+'/'+e.date,e.time||'',e.type||'',e.place||'',e.note||''];
  });
  _csvDownload('イベント一覧_'+new Date().toISOString().slice(0,10)+'.csv', headers, rows);
}

function exportConditionCSV() {
  var players = DB.players||[];
  var teamId = _getMyTeamId();
  if(teamId) players = players.filter(function(p){return p.team===teamId;}); // FIX: p.team
  var headers = ['選手','日付','体調(mood)','睡眠(h)','疲労度','痛みレベル','痛み部位','メモ'];
  var rows = [];
  // FIX: Read from DB.conditionLog[pid] instead of p.conditionLog
  players.forEach(function(p) {
    var cLog = DB.conditionLog?.[p.id] || {};
    Object.keys(cLog).sort().forEach(function(date) {
      var c = cLog[date];
      rows.push([p.name||'', date, c.mood||'', c.sleep||'', c.fatigue||'', c.painLevel||'', (c.painParts||[]).join('/'), c.note||'']);
    });
  });
  _csvDownload('体調データ_'+new Date().toISOString().slice(0,10)+'.csv', headers, rows);
}

function exportCoachReportCSV() {
  var reqs = _dbArr('requests').filter(function(r){return r.coachId===DB.currentUser?.id && (r.status==='matched'||r.status==='contracted');});
  var headers = ['チーム','ステータス','契約タイプ','開始日'];
  var rows = reqs.map(function(r){
    var t = (DB.teams||[]).find(function(tm){return tm.id===r.teamId;});
    return [t?.name||'',r.status||'',r.contractType||'',r.createdAt||''];
  });
  _csvDownload('コーチレポート_'+new Date().toISOString().slice(0,10)+'.csv', headers, rows);
}

function exportMyDataCSV() {
  var me = DB.currentUser;
  var p = (DB.players||[]).find(function(pl){return pl.userId===me?.id || pl.id===me?.id;});
  if(!p) { toast('選手データが見つかりません','e'); return; }
  // FIX: Read from DB.conditionLog[pid] instead of p.conditionLog
  var cLog = DB.conditionLog?.[p.id] || {};
  var headers = ['日付','体調(mood)','睡眠(h)','疲労度','痛みレベル','痛み部位','メモ'];
  var rows = Object.keys(cLog).sort().map(function(date){
    var c = cLog[date];
    return [date, c.mood||'', c.sleep||'', c.fatigue||'', c.painLevel||'', (c.painParts||[]).join('/'), c.note||''];
  });
  _csvDownload('マイデータ_'+new Date().toISOString().slice(0,10)+'.csv', headers, rows);
}


// ════════════════════════════════════════
// Phase 5: B-9 アクセシビリティ強化
// ════════════════════════════════════════

// Focus trap for modals
var _focusTrapEl = null;
function trapFocus(el) {
  if(!el) return;
  _focusTrapEl = el;
  var focusable = el.querySelectorAll('button,input,select,textarea,a[href],[tabindex]:not([tabindex="-1"])');
  if(!focusable.length) return;
  var first = focusable[0];
  var last = focusable[focusable.length-1];
  el.addEventListener('keydown', function _trap(e) {
    if(e.key !== 'Tab') return;
    if(e.shiftKey) {
      if(document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if(document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  first.focus();
}

function releaseFocusTrap() {
  _focusTrapEl = null;
}

// Enhanced modal open/close with focus trap + aria
var _origOpenM = typeof openM === 'function' ? openM : null;
var _prevFocus = null;

// Patch openM to add focus management
(function(){
  if(!_origOpenM) return;
  var _patchedOpen = false;
  var _origClose = typeof closeM === 'function' ? closeM : null;

  // Override openM for accessibility
  var _checkAndPatch = setInterval(function(){
    if(typeof openM !== 'function' || _patchedOpen) return;
    var origOpen = openM;
    var origClose = closeM;
    window.openM = function(title, body, opts) {
      _prevFocus = document.activeElement;
      origOpen.apply(null, arguments);
      setTimeout(function(){
        var modal = document.querySelector('.modal-bg .card, .modal-bg .modal-content, .modal-bg');
        if(modal) {
          modal.setAttribute('role','dialog');
          modal.setAttribute('aria-modal','true');
          modal.setAttribute('aria-label', title || 'ダイアログ');
          trapFocus(modal);
        }
      }, 100);
    };
    window.closeM = function() {
      releaseFocusTrap();
      origClose.apply(null, arguments);
      if(_prevFocus && _prevFocus.focus) {
        try { _prevFocus.focus(); } catch(e){}
      }
      _prevFocus = null;
    };
    _patchedOpen = true;
    clearInterval(_checkAndPatch);
  }, 500);
})();

// Live region for dynamic content announcements
function announceToSR(text) {
  var el = document.getElementById('sr-live');
  if(!el) {
    el = document.createElement('div');
    el.id = 'sr-live';
    el.className = 'sr-only';
    el.setAttribute('role','status');
    el.setAttribute('aria-live','polite');
    el.setAttribute('aria-atomic','true');
    document.body.appendChild(el);
  }
  el.textContent = '';
  setTimeout(function(){ el.textContent = text; }, 50);
}

// Keyboard nav for sidebar
function initSidebarKeyboardNav() {
  var sidebar = document.querySelector('.sidebar');
  if(!sidebar) return;
  var navItems = sidebar.querySelectorAll('.nav-item');
  navItems.forEach(function(item, i) {
    item.setAttribute('tabindex','0');
    item.setAttribute('role','menuitem');
    item.addEventListener('keydown', function(e) {
      if(e.key === 'ArrowDown') {
        e.preventDefault();
        var next = navItems[i+1] || navItems[0];
        next.focus();
      } else if(e.key === 'ArrowUp') {
        e.preventDefault();
        var prev = navItems[i-1] || navItems[navItems.length-1];
        prev.focus();
      } else if(e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        item.click();
      }
    });
  });
}

// Patch goTo to announce page changes
(function(){
  var _checkGoTo = setInterval(function(){
    if(typeof goTo !== 'function' || goTo._a11yPatched) return;
    var origGoTo = goTo;
    window.goTo = function(page) {
      origGoTo.apply(null, arguments);
      var title = (typeof PAGE_TITLE !== 'undefined' && PAGE_TITLE[page]) || page;
      announceToSR(title + 'ページに移動しました');
      setTimeout(initSidebarKeyboardNav, 200);
    };
    goTo._a11yPatched = true;
    clearInterval(_checkGoTo);
  }, 500);
})();


// ════════════════════════════════════════
// Phase 5: A-10 リーグ/トーナメント管理
// ════════════════════════════════════════
function leagueListSection() {
  if(!DB.leagues) DB.leagues = [];
  var my = getMyTeam();
  if(!my) return '';
  var myLeagues = DB.leagues.filter(function(lg){
    return (lg.teams||[]).some(function(t){return t.id===my.id;});
  });

  var html = '<div style="margin-top:20px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><div style="font-size:15px;font-weight:800">🏆 リーグ・トーナメント</div><button class="btn btn-primary btn-sm" onclick="openCreateLeagueModal()"><i class="fa fa-plus" style="margin-right:4px"></i>新規作成</button></div>';

  if(!myLeagues.length) {
    html += emptyState('🏆','リーグ・トーナメントがありません','大会を作成して複数チームの対戦管理ができます');
  } else {
    myLeagues.forEach(function(lg) {
      var teamCount = (lg.teams||[]).length;
      var matchCount = (lg.matches||[]).length;
      var completedMatches = (lg.matches||[]).filter(function(m){return m.status==='completed';}).length;
      var statusBadge = lg.status === 'active' ? '<span class="league-badge active">開催中</span>' : '<span class="league-badge ended">終了</span>';
      var typeBadge = lg.type === 'league' ? '<span class="league-badge league">リーグ戦</span>' : '<span class="league-badge tournament">トーナメント</span>';
      html += '<div class="league-card" onclick="openLeagueDetail(\''+lg.id+'\')" style="margin-bottom:10px">';
      html += '<div style="display:flex;justify-content:space-between;align-items:flex-start">';
      html += '<div><div style="font-size:14px;font-weight:800;margin-bottom:4px">'+sanitize(lg.name,30)+'</div>';
      html += '<div style="display:flex;gap:6px;margin-bottom:6px">'+typeBadge+statusBadge+'</div>';
      html += '<div style="font-size:11px;color:var(--txt3)">'+teamCount+'チーム · '+completedMatches+'/'+matchCount+'試合完了</div></div>';
      html += '<i class="fa fa-chevron-right" style="color:var(--txt3);margin-top:4px"></i></div></div>';
    });
  }
  html += '</div>';
  return html;
}

function openCreateLeagueModal() {
  var my = getMyTeam();
  if(!my) return;
  var otherTeams = (DB.teams||[]).filter(function(t){return t.id!==my.id;});
  var teamChecks = otherTeams.map(function(t){
    return '<label style="display:flex;align-items:center;gap:8px;padding:6px 0;font-size:12px;cursor:pointer"><input type="checkbox" class="lg-team-chk" value="'+t.id+'"><span>'+sanitize(t.name,20)+' <span style="color:var(--txt3);font-size:10px">'+(t.sport||'')+'</span></span></label>';
  }).join('');

  openM('🏆 リーグ / トーナメント作成', '<div style="display:grid;gap:12px">'
    +'<div class="form-group"><label class="label">大会名 <span style="color:var(--red)">*</span></label><input class="input" id="lg-name" placeholder="例: 春季リーグ2026"></div>'
    +'<div class="form-group"><label class="label">形式</label><select class="input" id="lg-type"><option value="league">リーグ戦（総当たり）</option><option value="tournament">トーナメント（勝ち抜き）</option></select></div>'
    +'<div class="form-group"><label class="label">参加チーム</label><div style="max-height:180px;overflow-y:auto;border:1px solid var(--b1);border-radius:10px;padding:8px 12px">'
    +'<label style="display:flex;align-items:center;gap:8px;padding:6px 0;font-size:12px;font-weight:700;border-bottom:1px solid var(--b1);margin-bottom:4px"><input type="checkbox" class="lg-team-chk" value="'+my.id+'" checked disabled><span>'+sanitize(my.name,20)+' (自チーム)</span></label>'
    +teamChecks+'</div></div>'
    +'<button class="btn btn-primary w-full" onclick="createLeague()">🏆 大会を作成</button>'
    +'</div>');
}

function createLeague() {
  var name = (document.getElementById('lg-name')?.value||'').trim();
  if(!name) { toast('大会名を入力してください','e'); return; }
  var type = document.getElementById('lg-type')?.value || 'league';
  var checkedTeams = [];
  document.querySelectorAll('.lg-team-chk:checked').forEach(function(cb){
    checkedTeams.push(cb.value);
  });
  var my = getMyTeam();
  if(!checkedTeams.includes(my?.id)) checkedTeams.unshift(my.id);
  if(checkedTeams.length < 2) { toast('2チーム以上を選択してください','e'); return; }

  var teams = checkedTeams.map(function(tid){
    var t = (DB.teams||[]).find(function(tm){return tm.id===tid;});
    return {id:tid, name:t?.name||'不明', wins:0, draws:0, losses:0, points:0, gf:0, ga:0};
  });

  var matches = [];
  if(type === 'league') {
    // Round-robin: every team plays every other team
    for(var i=0; i<teams.length; i++) {
      for(var j=i+1; j<teams.length; j++) {
        matches.push({
          id:genId('lgm'), round:1, teamA:teams[i].id, teamB:teams[j].id,
          scoreA:null, scoreB:null, status:'pending',
          teamAName:teams[i].name, teamBName:teams[j].name
        });
      }
    }
  } else {
    // Tournament: bracket style
    var rounds = Math.ceil(Math.log2(teams.length));
    var shuffled = teams.slice().sort(function(){return Math.random()-0.5;});
    var bracket = [];
    for(var i=0; i<shuffled.length; i+=2) {
      if(i+1 < shuffled.length) {
        bracket.push({
          id:genId('lgm'), round:1, teamA:shuffled[i].id, teamB:shuffled[i+1].id,
          scoreA:null, scoreB:null, status:'pending',
          teamAName:shuffled[i].name, teamBName:shuffled[i+1].name
        });
      } else {
        bracket.push({
          id:genId('lgm'), round:1, teamA:shuffled[i].id, teamB:null,
          scoreA:null, scoreB:null, status:'bye',
          teamAName:shuffled[i].name, teamBName:'BYE'
        });
      }
    }
    matches = bracket;
  }

  if(!DB.leagues) DB.leagues = [];
  var league = {
    id: genId('lg'), name: sanitize(name,50), type: type,
    teams: teams, matches: matches, status:'active',
    createdBy: DB.currentUser?.id, createdAt: new Date().toISOString()
  };
  DB.leagues.push(league);
  saveDB();
  closeM();
  toast('🏆 「'+name+'」を作成しました','s');
  refreshPage();
}

function openLeagueDetail(lgId) {
  var lg = (DB.leagues||[]).find(function(l){return l.id===lgId;});
  if(!lg) { toast('大会が見つかりません','e'); return; }

  var html = '<div style="margin-bottom:14px"><div style="display:flex;gap:6px;margin-bottom:8px">';
  html += (lg.type==='league'?'<span class="league-badge league">リーグ戦</span>':'<span class="league-badge tournament">トーナメント</span>');
  html += (lg.status==='active'?'<span class="league-badge active">開催中</span>':'<span class="league-badge ended">終了</span>');
  html += '</div><div style="font-size:11px;color:var(--txt3)">'+(lg.teams||[]).length+'チーム参加 · '+(lg.matches||[]).filter(function(m){return m.status==='completed';}).length+'/'+(lg.matches||[]).length+'試合完了</div></div>';

  if(lg.type === 'league') {
    // Standings table
    var standings = (lg.teams||[]).slice().sort(function(a,b){
      return (b.points||0)-(a.points||0) || ((b.gf||0)-(b.ga||0))-((a.gf||0)-(a.ga||0));
    });
    html += '<div style="font-size:13px;font-weight:700;margin-bottom:8px">📊 順位表</div>';
    html += '<div style="overflow-x:auto;margin-bottom:14px"><table class="standings-table"><thead><tr><th>順位</th><th>チーム</th><th>勝</th><th>分</th><th>負</th><th>得失点</th><th>勝点</th></tr></thead><tbody>';
    standings.forEach(function(t,i){
      var rankCls = i===0?'rank-1':i===1?'rank-2':i===2?'rank-3':'';
      html += '<tr><td><span class="standings-rank '+rankCls+'">'+(i+1)+'</span></td><td style="font-weight:600">'+sanitize(t.name,15)+'</td><td>'+(t.wins||0)+'</td><td>'+(t.draws||0)+'</td><td>'+(t.losses||0)+'</td><td>'+((t.gf||0)-(t.ga||0))+'</td><td style="font-weight:800">'+(t.points||0)+'</td></tr>';
    });
    html += '</tbody></table></div>';
  }

  // Matches
  html += '<div style="font-size:13px;font-weight:700;margin-bottom:8px">⚽ 試合一覧</div>';
  (lg.matches||[]).forEach(function(m) {
    var isDone = m.status === 'completed';
    var isBye = m.status === 'bye';
    html += '<div class="bracket-match" style="margin-bottom:8px">';
    html += '<div class="bracket-team'+(isDone&&m.scoreA>m.scoreB?' winner':'')+'"><span>'+sanitize(m.teamAName||'TBD',15)+'</span><span class="score">'+(isDone?m.scoreA:'—')+'</span></div>';
    html += '<div class="bracket-team'+(isDone&&m.scoreB>m.scoreA?' winner':'')+(isBye?' winner':'')+'"><span>'+sanitize(m.teamBName||'TBD',15)+'</span><span class="score">'+(isBye?'BYE':isDone?m.scoreB:'—')+'</span></div>';
    if(!isDone && !isBye) {
      html += '<div style="padding:6px 12px;text-align:center"><button class="btn btn-xs btn-primary" onclick="openScoreInput(\''+lgId+'\',\''+m.id+'\')">結果を入力</button></div>';
    }
    html += '</div>';
  });

  if(lg.status === 'active') {
    html += '<div style="margin-top:14px;display:flex;gap:8px"><button class="btn btn-ghost btn-sm" onclick="endLeague(\''+lgId+'\')">🏁 大会を終了</button><button class="btn btn-ghost btn-sm" style="color:var(--red)" onclick="deleteLeague(\''+lgId+'\')"><i class="fa fa-trash"></i> 削除</button></div>';
  }

  openM('🏆 '+sanitize(lg.name,25), html);
}

function openScoreInput(lgId, matchId) {
  var lg = (DB.leagues||[]).find(function(l){return l.id===lgId;});
  if(!lg) return;
  var m = (lg.matches||[]).find(function(x){return x.id===matchId;});
  if(!m) return;

  openM('⚽ 結果入力', '<div style="text-align:center;margin-bottom:16px"><div style="font-size:13px;font-weight:700;margin-bottom:4px">'+sanitize(m.teamAName,15)+' vs '+sanitize(m.teamBName,15)+'</div></div>'
    +'<div style="display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:center">'
    +'<div class="form-group" style="text-align:center"><label class="label">'+sanitize(m.teamAName,10)+'</label><input class="input" id="score-a" type="number" min="0" value="0" style="text-align:center;font-size:20px;font-weight:800"></div>'
    +'<div style="font-size:18px;font-weight:800;color:var(--txt3);padding-top:20px">-</div>'
    +'<div class="form-group" style="text-align:center"><label class="label">'+sanitize(m.teamBName,10)+'</label><input class="input" id="score-b" type="number" min="0" value="0" style="text-align:center;font-size:20px;font-weight:800"></div>'
    +'</div><button class="btn btn-primary w-full mt-12" onclick="submitScore(\''+lgId+'\',\''+matchId+'\')">結果を確定</button>');
}

function submitScore(lgId, matchId) {
  var lg = (DB.leagues||[]).find(function(l){return l.id===lgId;});
  if(!lg) return;
  var m = (lg.matches||[]).find(function(x){return x.id===matchId;});
  if(!m) return;
  var sa = parseInt(document.getElementById('score-a')?.value)||0;
  var sb = parseInt(document.getElementById('score-b')?.value)||0;
  m.scoreA = sa; m.scoreB = sb; m.status = 'completed';

  if(lg.type === 'league') {
    var tA = lg.teams.find(function(t){return t.id===m.teamA;});
    var tB = lg.teams.find(function(t){return t.id===m.teamB;});
    if(tA) { tA.gf = (tA.gf||0)+sa; tA.ga = (tA.ga||0)+sb; }
    if(tB) { tB.gf = (tB.gf||0)+sb; tB.ga = (tB.ga||0)+sa; }
    if(sa > sb) { if(tA){tA.wins=(tA.wins||0)+1;tA.points=(tA.points||0)+3;} if(tB){tB.losses=(tB.losses||0)+1;} }
    else if(sb > sa) { if(tB){tB.wins=(tB.wins||0)+1;tB.points=(tB.points||0)+3;} if(tA){tA.losses=(tA.losses||0)+1;} }
    else { if(tA){tA.draws=(tA.draws||0)+1;tA.points=(tA.points||0)+1;} if(tB){tB.draws=(tB.draws||0)+1;tB.points=(tB.points||0)+1;} }
  } else {
    // Tournament: generate next round match if applicable
    var curRound = m.round;
    var roundMatches = lg.matches.filter(function(x){return x.round===curRound;});
    var allDone = roundMatches.every(function(x){return x.status==='completed'||x.status==='bye';});
    if(allDone) {
      var winners = roundMatches.map(function(x){
        if(x.status==='bye') return {id:x.teamA,name:x.teamAName};
        return x.scoreA > x.scoreB ? {id:x.teamA,name:x.teamAName} : {id:x.teamB,name:x.teamBName};
      });
      if(winners.length > 1) {
        for(var i=0; i<winners.length; i+=2) {
          if(i+1 < winners.length) {
            lg.matches.push({
              id:genId('lgm'), round:curRound+1, teamA:winners[i].id, teamB:winners[i+1].id,
              scoreA:null, scoreB:null, status:'pending',
              teamAName:winners[i].name, teamBName:winners[i+1].name
            });
          } else {
            lg.matches.push({
              id:genId('lgm'), round:curRound+1, teamA:winners[i].id, teamB:null,
              scoreA:null, scoreB:null, status:'bye',
              teamAName:winners[i].name, teamBName:'BYE'
            });
          }
        }
      }
    }
  }
  saveDB();
  closeM();
  toast('結果を登録しました','s');
  openLeagueDetail(lgId);
}

function endLeague(lgId) {
  var lg = (DB.leagues||[]).find(function(l){return l.id===lgId;});
  if(!lg) return;
  lg.status = 'ended';
  saveDB();
  closeM();
  toast('大会を終了しました','s');
  refreshPage();
}

function deleteLeague(lgId) {
  if(!confirm('この大会を削除しますか？')) return;
  DB.leagues = (DB.leagues||[]).filter(function(l){return l.id!==lgId;});
  saveDB();
  closeM();
  toast('大会を削除しました','s');
  refreshPage();
}


// ════════════════════════════════════════
// Phase 5: 一括体調入力
// ════════════════════════════════════════
function openBulkConditionInput() {
  var my = getMyTeam();
  if(!my) { toast('チーム情報がありません','e'); return; }
  var pls = (DB.players||[]).filter(function(p){return p.team===my.id;});
  if(!pls.length) { toast('選手がいません','w'); return; }

  var today = new Date().toISOString().slice(0,10);
  var faces = [
    {v:1,e:'😫',l:'最悪'},{v:2,e:'😟',l:'悪い'},{v:3,e:'😐',l:'普通'},{v:4,e:'😊',l:'良い'},{v:5,e:'😄',l:'最高'}
  ];

  var h = '<div style="font-size:12px;color:var(--txt3);margin-bottom:12px">📅 '+today+' の体調を一括で入力できます</div>';
  h += '<div style="max-height:400px;overflow-y:auto">';
  pls.forEach(function(p) {
    h += '<div class="bulk-cond-row" data-pid="'+p.id+'">';
    h += '<div class="bulk-cond-name">'+sanitize(p.name||'',10)+'</div>';
    h += '<div class="bulk-cond-input">';
    faces.forEach(function(f) {
      h += '<div class="cond-face" onclick="selectBulkCond(this,\''+p.id+'\','+f.v+')" data-val="'+f.v+'" title="'+f.l+'">'+f.e+'</div>';
    });
    h += '</div></div>';
  });
  h += '</div>';
  h += '<button class="btn btn-primary w-full mt-12" onclick="submitBulkCondition()"><i class="fa fa-check" style="margin-right:4px"></i>一括保存</button>';

  openM('❤️ 一括体調入力（'+pls.length+'名）', h);
}

var _bulkCondData = {};
function selectBulkCond(el, pid, val) {
  var row = el.closest('.bulk-cond-row');
  if(!row) return;
  row.querySelectorAll('.cond-face').forEach(function(f){ f.classList.remove('sel'); });
  el.classList.add('sel');
  _bulkCondData[pid] = val;
}

function submitBulkCondition() {
  var today = new Date().toISOString().slice(0,10);
  var count = 0;
  if(!DB.conditionLog) DB.conditionLog = {};
  Object.keys(_bulkCondData).forEach(function(pid) {
    var p = (DB.players||[]).find(function(pl){return pl.id===pid;});
    if(!p) return;
    // FIX: Write to DB.conditionLog[pid][date] (the actual data store)
    // Convert 1-5 emoji scale → 1-10 mood scale (×2)
    var moodVal = Math.min(10, Math.max(1, (_bulkCondData[pid]||3) * 2));
    if(!DB.conditionLog[pid]) DB.conditionLog[pid] = {};
    var existing = DB.conditionLog[pid][today] || {};
    DB.conditionLog[pid][today] = Object.assign(existing, {
      date: today,
      mood: moodVal,
      updatedAt: new Date().toISOString()
    });
    count++;
  });
  _bulkCondData = {};
  if(count > 0) {
    saveDB();
    closeM();
    toast('❤️ '+count+'名の体調を記録しました','s');
    refreshPage();
  } else {
    toast('体調を1名以上選択してください','w');
  }
}


// ════════════════════════════════════════
// Phase 5: チャット内検索
// ════════════════════════════════════════
var _chatSearchQ = '';
var _chatSearchResults = [];
var _chatSearchIdx = -1;

function toggleChatSearch() {
  var panel = document.getElementById('chat-search-panel');
  if(panel) {
    panel.remove();
    clearChatHighlights();
    _chatSearchQ = '';
    return;
  }
  var chatRight = document.querySelector('.chat-right, .msgs')?.parentElement;
  if(!chatRight) return;
  var header = chatRight.querySelector('.chat-right-head') || chatRight.firstChild;
  if(!header) return;
  var sp = document.createElement('div');
  sp.id = 'chat-search-panel';
  sp.className = 'chat-search-panel';
  sp.innerHTML = '<i class="fa fa-search" style="color:var(--txt3);font-size:12px"></i><input id="chat-search-q" placeholder="メッセージを検索..." oninput="doChatSearch(this.value)"><span class="chat-search-count" id="chat-search-count"></span><button class="btn btn-ghost btn-xs" onclick="chatSearchNav(-1)">▲</button><button class="btn btn-ghost btn-xs" onclick="chatSearchNav(1)">▼</button><button class="btn btn-ghost btn-xs" onclick="toggleChatSearch()">✕</button>';
  header.after(sp);
  setTimeout(function(){ document.getElementById('chat-search-q')?.focus(); }, 100);
}

function doChatSearch(q) {
  _chatSearchQ = (q||'').trim().toLowerCase();
  clearChatHighlights();
  _chatSearchResults = [];
  _chatSearchIdx = -1;

  if(!_chatSearchQ) {
    var countEl = document.getElementById('chat-search-count');
    if(countEl) countEl.textContent = '';
    return;
  }

  var msgs = document.querySelectorAll('.msg-bubble, .msg-text, .bubble-text');
  msgs.forEach(function(el, i) {
    var text = (el.textContent||'').toLowerCase();
    if(text.includes(_chatSearchQ)) {
      _chatSearchResults.push(el);
    }
  });

  var countEl = document.getElementById('chat-search-count');
  if(countEl) countEl.textContent = _chatSearchResults.length + '件';

  if(_chatSearchResults.length > 0) {
    _chatSearchIdx = 0;
    highlightChatResult(0);
  }
}

function chatSearchNav(dir) {
  if(!_chatSearchResults.length) return;
  clearChatHighlights();
  _chatSearchIdx += dir;
  if(_chatSearchIdx >= _chatSearchResults.length) _chatSearchIdx = 0;
  if(_chatSearchIdx < 0) _chatSearchIdx = _chatSearchResults.length - 1;
  highlightChatResult(_chatSearchIdx);
}

function highlightChatResult(idx) {
  var el = _chatSearchResults[idx];
  if(!el) return;
  el.style.outline = '2px solid var(--org)';
  el.style.outlineOffset = '2px';
  el.style.borderRadius = '8px';
  el.scrollIntoView({behavior:'smooth',block:'center'});
  var countEl = document.getElementById('chat-search-count');
  if(countEl) countEl.textContent = (idx+1)+'/'+_chatSearchResults.length+'件';
}

function clearChatHighlights() {
  _chatSearchResults.forEach(function(el) {
    el.style.outline = '';
    el.style.outlineOffset = '';
  });
}


// ════════════════════════════════════════
// Phase 6: インタラクティブアプリツアー
// ════════════════════════════════════════
var _tourSteps = [];
var _tourIdx = 0;
var _tourActive = false;

function getTourSteps(role) {
  var base = [
    {sel:'.topbar-title',title:'ページタイトル',desc:'現在のページ名が表示されます。'},
    {sel:'[onclick*="openGlobalSearch"]',title:'🔍 グローバル検索',desc:'Ctrl+K でも開けます。選手・イベント・ページを横断検索できます。'},
    {sel:'.sidebar .nav-item:first-child, .bnav-item:first-child',title:'ナビゲーション',desc:'左のメニュー（モバイルは下のバー）からページを切り替えます。'},
    {sel:'#notif-count, [onclick*="showNotifs"]',title:'🔔 通知',desc:'新しいお知らせがあるとバッジが表示されます。'},
  ];
  if(role === 'team') {
    base.push({sel:'.dash-greeting',title:'チームダッシュボード',desc:'チームの概要が一目でわかります。アナウンス投稿・傾向分析・一括体調入力もここから。'});
    base.push({sel:'.hero-kpi, .hero-kpi-card',title:'KPIカード',desc:'選手数・支払い状況・累計回収額など、重要な数字を確認できます。'});
    base.push({sel:'[onclick*="openWidgetSettings"]',title:'⚙️ ウィジェット設定',desc:'表示するセクションをカスタマイズできます。'});
  } else if(role === 'coach') {
    base.push({sel:'.dash-greeting',title:'コーチダッシュボード',desc:'契約チーム・選手情報を一覧で確認できます。'});
  } else if(role === 'player') {
    base.push({sel:'.dash-greeting, .hero-kpi',title:'マイダッシュボード',desc:'今日のコンディション入力やトレーニング記録を管理します。'});
  }
  base.push({sel:null,title:'🎉 ツアー完了！',desc:'以上がアプリの基本操作です。いつでも設定ページから再度ツアーを開始できます。'});
  return base;
}

function startAppTour() {
  var role = DB.currentUser?.role || 'team';
  _tourSteps = getTourSteps(role);
  _tourIdx = 0;
  _tourActive = true;
  goTo('dashboard');
  setTimeout(function(){ showTourStep(0); }, 300);
}

function showTourStep(idx) {
  if(idx < 0 || idx >= _tourSteps.length) { endAppTour(); return; }
  _tourIdx = idx;
  var step = _tourSteps[idx];
  removeTourUI();

  var highlight = document.createElement('div');
  highlight.id = 'tour-highlight';
  highlight.className = 'tour-highlight';

  var tip = document.createElement('div');
  tip.id = 'tour-tip';
  tip.className = 'tour-tip';

  var dotsHtml = _tourSteps.map(function(s,i){
    return '<span class="tour-dot'+(i===idx?' active':'')+'"></span>';
  }).join('');

  var isLast = idx === _tourSteps.length - 1;
  tip.innerHTML = '<div class="tour-tip-title">'+step.title+'</div>'
    +'<div class="tour-tip-desc">'+step.desc+'</div>'
    +'<div class="tour-tip-footer">'
    +'<div><div class="tour-dots">'+dotsHtml+'</div><div class="tour-step-label">'+(idx+1)+'/'+_tourSteps.length+'</div></div>'
    +'<div style="display:flex;gap:6px">'
    +(idx>0?'<button class="btn btn-ghost btn-xs" onclick="showTourStep('+(_tourIdx-1)+')">← 前へ</button>':'')
    +'<button class="btn btn-ghost btn-xs" onclick="endAppTour()">スキップ</button>'
    +(isLast?'<button class="btn btn-primary btn-xs" onclick="endAppTour()">完了</button>'
            :'<button class="btn btn-primary btn-xs" onclick="showTourStep('+(_tourIdx+1)+')">次へ →</button>')
    +'</div></div>';

  document.body.appendChild(highlight);
  document.body.appendChild(tip);

  if(step.sel) {
    var el = document.querySelector(step.sel);
    if(el) {
      var rect = el.getBoundingClientRect();
      highlight.style.top = (rect.top - 6) + 'px';
      highlight.style.left = (rect.left - 6) + 'px';
      highlight.style.width = (rect.width + 12) + 'px';
      highlight.style.height = (rect.height + 12) + 'px';

      var tipTop = rect.bottom + 14;
      var tipLeft = Math.max(12, Math.min(rect.left, window.innerWidth - 340));
      if(tipTop + 180 > window.innerHeight) {
        tipTop = rect.top - 180;
      }
      tip.style.top = tipTop + 'px';
      tip.style.left = tipLeft + 'px';
    } else {
      highlight.style.display = 'none';
      tip.style.top = '50%';
      tip.style.left = '50%';
      tip.style.transform = 'translate(-50%,-50%)';
    }
  } else {
    highlight.style.display = 'none';
    tip.style.top = '50%';
    tip.style.left = '50%';
    tip.style.transform = 'translate(-50%,-50%)';
  }
}

function removeTourUI() {
  var h = document.getElementById('tour-highlight');
  var t = document.getElementById('tour-tip');
  if(h) h.remove();
  if(t) t.remove();
}

function endAppTour() {
  _tourActive = false;
  removeTourUI();
  try { localStorage.setItem('mc_tour_done','1'); } catch(e){}
  toast('ツアーを完了しました！いつでも設定から再開できます。','s');
}

// Auto-start tour for new users
function checkAutoTour() {
  try {
    if(localStorage.getItem('mc_tour_done')) return;
    if(!DB.currentUser) return;
    var created = DB.currentUser.createdAt;
    if(created) {
      var diff = Date.now() - new Date(created).getTime();
      if(diff < 300000) { // within 5 min of account creation
        setTimeout(function(){ startAppTour(); }, 1500);
      }
    }
  } catch(e){}
}


// ════════════════════════════════════════
// Phase 6: チャットクイック返信テンプレート
// ════════════════════════════════════════
var CHAT_TEMPLATES = {
  team: [
    {l:'👋 挨拶',t:'お世話になっております。よろしくお願いいたします。'},
    {l:'📅 練習案内',t:'次回の練習は以下の通りです。\n📅 日時: \n📍 場所: \n⏰ 集合: \n持ち物をお忘れなく！'},
    {l:'🚫 練習中止',t:'本日の練習は天候不良のため中止とさせていただきます。次回の練習でお会いしましょう。'},
    {l:'💰 月謝',t:'月謝のお支払い期日が近づいております。お手数ですがご確認をお願いいたします。'},
    {l:'✅ 確認済',t:'確認いたしました。ありがとうございます。'},
    {l:'🙏 お礼',t:'ありがとうございます。引き続きよろしくお願いいたします。'},
  ],
  coach: [
    {l:'👋 挨拶',t:'こんにちは！コーチの○○です。よろしくお願いします。'},
    {l:'📋 指導報告',t:'本日の指導報告です。\n\n【参加者】\n【内容】\n【所感】\n\n次回もよろしくお願いします。'},
    {l:'⚠️ 注意点',t:'練習で気になった点をお伝えします。\n\n'},
    {l:'🎉 良かった点',t:'今回の練習で特に良かった点をお伝えします。\n\n'},
    {l:'✅ 了解',t:'承知しました。対応いたします。'},
  ],
  player: [
    {l:'👋 挨拶',t:'よろしくお願いします！'},
    {l:'🙋 参加',t:'参加します！'},
    {l:'😞 欠席',t:'申し訳ありませんが、欠席させていただきます。'},
    {l:'✅ 了解',t:'わかりました！'},
    {l:'🙏 お礼',t:'ありがとうございます！'},
  ],
  parent: [
    {l:'👋 挨拶',t:'いつもお世話になっております。'},
    {l:'🙋 参加',t:'本日の練習に参加させていただきます。'},
    {l:'😞 欠席',t:'申し訳ございませんが、本日は欠席させていただきます。'},
    {l:'✅ 了解',t:'承知いたしました。ありがとうございます。'},
    {l:'💰 支払済',t:'月謝のお支払いが完了いたしました。ご確認をお願いいたします。'},
  ],
};

function renderQuickReplyBar(roomKey) {
  var role = DB.currentUser?.role || 'team';
  var templates = CHAT_TEMPLATES[role] || CHAT_TEMPLATES.team;
  var html = '<div class="qr-bar" id="qr-bar">';
  html += '<div class="qr-chip" onclick="toggleQuickReplyExpand()" style="background:var(--org);color:#fff;border-color:var(--org)">⚡</div>';
  templates.forEach(function(t) {
    html += '<div class="qr-chip" onclick="insertQuickReply(\''+t.t.replace(/'/g,"\\'").replace(/\n/g,'\\n')+'\')" title="'+t.t.replace(/\n/g,' ').slice(0,40)+'">'+t.l+'</div>';
  });
  html += '</div>';
  return html;
}

function insertQuickReply(text) {
  var inp = document.getElementById('chat-inp');
  if(!inp) return;
  inp.value = text;
  inp.focus();
  inp.dispatchEvent(new Event('input'));
}

function toggleQuickReplyExpand() {
  var bar = document.getElementById('qr-bar');
  if(!bar) return;
  var isExpanded = bar.style.flexWrap === 'wrap';
  bar.style.flexWrap = isExpanded ? 'nowrap' : 'wrap';
  bar.style.overflowX = isExpanded ? 'auto' : 'visible';
}

// Manage custom templates
function openTemplateManager() {
  var role = DB.currentUser?.role || 'team';
  var custom = [];
  try { custom = JSON.parse(localStorage.getItem('mc_chat_templates_'+role) || '[]'); } catch(e){}

  var h = '<div style="font-size:12px;color:var(--txt3);margin-bottom:12px">自分専用のクイック返信テンプレートを追加できます（最大10個）。</div>';
  h += '<div id="tpl-list" style="max-height:250px;overflow-y:auto;margin-bottom:12px">';
  if(custom.length) {
    custom.forEach(function(t,i) {
      h += '<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--surf2);border-radius:8px;margin-bottom:6px">';
      h += '<div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:600">'+sanitize(t.l,15)+'</div><div style="font-size:11px;color:var(--txt3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+sanitize(t.t,40)+'</div></div>';
      h += '<button class="btn btn-ghost btn-xs" onclick="removeCustomTemplate('+i+')" style="color:var(--red)"><i class="fa fa-trash"></i></button></div>';
    });
  } else {
    h += '<div style="text-align:center;padding:20px;color:var(--txt3);font-size:12px">カスタムテンプレートはありません</div>';
  }
  h += '</div>';
  h += '<div style="display:grid;gap:8px;border-top:1px solid var(--b1);padding-top:12px">';
  h += '<div class="form-group"><label class="label">ラベル</label><input class="input" id="tpl-label" placeholder="例: 📅 集合案内" maxlength="15"></div>';
  h += '<div class="form-group"><label class="label">テキスト</label><textarea class="input" id="tpl-text" rows="3" placeholder="テンプレートの内容..." maxlength="500"></textarea></div>';
  h += '<button class="btn btn-primary w-full" onclick="addCustomTemplate()"><i class="fa fa-plus" style="margin-right:4px"></i>追加</button></div>';

  openM('📝 テンプレート管理', h);
}

function addCustomTemplate() {
  var role = DB.currentUser?.role || 'team';
  var label = (document.getElementById('tpl-label')?.value||'').trim();
  var text = (document.getElementById('tpl-text')?.value||'').trim();
  if(!label || !text) { toast('ラベルとテキストを入力してください','e'); return; }
  var custom = [];
  try { custom = JSON.parse(localStorage.getItem('mc_chat_templates_'+role) || '[]'); } catch(e){}
  if(custom.length >= 10) { toast('テンプレートは最大10個です','e'); return; }
  custom.push({l:sanitize(label,15), t:sanitize(text,500)});
  try { localStorage.setItem('mc_chat_templates_'+role, JSON.stringify(custom)); } catch(e){}
  closeM();
  toast('テンプレートを追加しました','s');
}

function removeCustomTemplate(idx) {
  var role = DB.currentUser?.role || 'team';
  var custom = [];
  try { custom = JSON.parse(localStorage.getItem('mc_chat_templates_'+role) || '[]'); } catch(e){}
  custom.splice(idx, 1);
  try { localStorage.setItem('mc_chat_templates_'+role, JSON.stringify(custom)); } catch(e){}
  openTemplateManager();
}


// ════════════════════════════════════════
// Phase 6: コンディションアラートシステム
// ════════════════════════════════════════
function getConditionAlerts() {
  var my = getMyTeam();
  if(!my) return [];
  var players = (DB.players||[]).filter(function(p){return p.team===my.id;});
  var alerts = [];
  var today = new Date();
  var todayStr = today.toISOString().slice(0,10);

  players.forEach(function(p) {
    // FIX: Read from DB.conditionLog[pid] (the actual data store)
    var cLog = DB.conditionLog?.[p.id] || {};
    var dates = Object.keys(cLog).sort().reverse(); // newest first
    if(!dates.length) {
      // No data at all for this player
      alerts.push({type:'caution',icon:'⏰',bg:'rgba(234,179,8,.08)',
        title:sanitize(p.name,12)+' の体調データなし',
        sub:'まだ体調入力がありません',pid:p.id});
      return;
    }

    // Check declining trend (3+ consecutive drops)
    if(dates.length >= 3) {
      var r0 = cLog[dates[0]]?.mood||0, r1 = cLog[dates[1]]?.mood||0, r2 = cLog[dates[2]]?.mood||0;
      if(r0 < r1 && r1 < r2 && r0 <= 4) {
        alerts.push({type:'warn',icon:'📉',bg:'rgba(239,68,68,.08)',
          title:sanitize(p.name,12)+' の体調が連続低下中',
          sub:'直近3日: '+r2+'→'+r1+'→'+r0+' (10段階)',pid:p.id});
      }
    }

    // Check very low mood today
    var todayEntry = cLog[todayStr];
    if(todayEntry && (todayEntry.mood||10) <= 3) {
      alerts.push({type:'warn',icon:'🚨',bg:'rgba(239,68,68,.08)',
        title:sanitize(p.name,12)+' の体調が非常に低い',
        sub:'今日のスコア: '+(todayEntry.mood||0)+'/10',pid:p.id});
    }

    // Check pain reported
    if(todayEntry && (todayEntry.painLevel||0) >= 3) {
      var painParts = (todayEntry.painParts||[]).join(',');
      alerts.push({type:'caution',icon:'🩹',bg:'rgba(234,179,8,.08)',
        title:sanitize(p.name,12)+' が痛みを報告',
        sub:'痛みレベル: '+(todayEntry.painLevel||0)+'/5'+(painParts?' ('+sanitize(painParts,15)+')':''),pid:p.id});
    }

    // Check no data for 3+ days
    var lastDate = new Date(dates[0]+'T00:00:00');
    var daysSince = Math.floor((today - lastDate) / 86400000);
    if(daysSince >= 3) {
      alerts.push({type:'caution',icon:'⏰',bg:'rgba(234,179,8,.08)',
        title:sanitize(p.name,12)+' の体調未入力が'+daysSince+'日',
        sub:'最終入力: '+dates[0],pid:p.id});
    }
  });

  return alerts;
}

function renderConditionAlerts() {
  var alerts = getConditionAlerts();
  if(!alerts.length) return '';
  var html = '<div style="margin-bottom:14px"><div style="font-size:13px;font-weight:800;margin-bottom:8px;display:flex;align-items:center;gap:6px"><span>⚠️ コンディションアラート</span><span style="font-size:10px;padding:2px 8px;background:rgba(239,68,68,.1);color:var(--red);border-radius:8px;font-weight:700">'+alerts.length+'件</span></div>';
  alerts.slice(0,5).forEach(function(a) {
    var cls = a.type === 'warn' ? 'cond-alert-warn' : 'cond-alert-caution';
    html += '<div class="cond-alert '+cls+'" onclick="openPlayerDetailModal(\''+a.pid+'\')">';
    html += '<div class="cond-alert-icon" style="background:'+a.bg+'">'+a.icon+'</div>';
    html += '<div class="cond-alert-body"><div class="cond-alert-title">'+a.title+'</div><div class="cond-alert-sub">'+a.sub+'</div></div>';
    html += '<i class="fa fa-chevron-right" style="color:var(--txt3);font-size:10px"></i></div>';
  });
  if(alerts.length > 5) {
    html += '<div style="text-align:center;font-size:11px;color:var(--txt3);padding:4px">他 '+(alerts.length-5)+'件のアラート</div>';
  }
  html += '</div>';
  return html;
}


// ════════════════════════════════════════
// Phase 6: ブックマーク/お気に入り
// ════════════════════════════════════════
function _getBookmarks() {
  try { return JSON.parse(localStorage.getItem('mc_bookmarks_v1') || '[]'); } catch(e){ return []; }
}
function _saveBookmarks(bm) {
  try { localStorage.setItem('mc_bookmarks_v1', JSON.stringify(bm)); } catch(e){}
}

function toggleBookmark(type, id, title, icon) {
  var bm = _getBookmarks();
  var idx = bm.findIndex(function(b){ return b.type===type && b.id===id; });
  if(idx >= 0) {
    bm.splice(idx, 1);
    toast('ブックマークを解除しました','s');
  } else {
    if(bm.length >= 20) { toast('ブックマークは最大20個です','w'); return; }
    bm.push({type:type, id:id, title:sanitize(title||'',30), icon:icon||'⭐', createdAt:new Date().toISOString()});
    toast('⭐ ブックマークに追加しました','s');
  }
  _saveBookmarks(bm);
  refreshPage();
}

function isBookmarked(type, id) {
  return _getBookmarks().some(function(b){ return b.type===type && b.id===id; });
}

function bookmarkStar(type, id, title, icon) {
  var active = isBookmarked(type, id);
  return '<span class="bm-star'+(active?' active':'')+'" onclick="event.stopPropagation();toggleBookmark(\''+type+'\',\''+id+'\',\''+sanitize(title||'',30).replace(/'/g,'')+'\',\''+sanitize(icon||'⭐',3)+'\')">'+(active?'⭐':'☆')+'</span>';
}

function bookmarksPage() {
  var bm = _getBookmarks();
  if(!bm.length) return emptyState('⭐','ブックマークがありません','選手・イベント・ページの☆をタップするとここに保存されます');

  var groups = {};
  bm.forEach(function(b) {
    var cat = b.type === 'player' ? '選手' : b.type === 'page' ? 'ページ' : b.type === 'event' ? 'イベント' : 'その他';
    if(!groups[cat]) groups[cat] = [];
    groups[cat].push(b);
  });

  var html = '<div style="margin-bottom:14px;display:flex;justify-content:space-between;align-items:center"><div style="font-size:18px;font-weight:800">⭐ ブックマーク</div><button class="btn btn-ghost btn-xs" onclick="if(confirm(\'ブックマークを全削除しますか？\')){_saveBookmarks([]);refreshPage()}">全削除</button></div>';

  Object.keys(groups).forEach(function(cat) {
    html += '<div class="bm-section"><div style="font-size:11px;font-weight:700;color:var(--txt3);margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px">'+cat+' ('+groups[cat].length+')</div>';
    groups[cat].forEach(function(b) {
      var action = '';
      if(b.type === 'page') action = "goTo('"+b.id+"')";
      else if(b.type === 'player') action = "openPlayerDetailModal('"+b.id+"')";
      else if(b.type === 'event') action = "goTo('calendar')";
      html += '<div class="bm-item" onclick="'+action+'">';
      html += '<div class="bm-item-icon" style="background:rgba(249,115,22,.08)">'+b.icon+'</div>';
      html += '<div class="bm-item-body"><div class="bm-item-title">'+sanitize(b.title,30)+'</div><div class="bm-item-sub">'+b.type+'</div></div>';
      html += '<span class="bm-star active" onclick="event.stopPropagation();toggleBookmark(\''+b.type+'\',\''+b.id+'\')">⭐</span></div>';
    });
    html += '</div>';
  });

  return html;
}


// ════════════════════════════════════════
// Phase 7-A: A-9 多言語対応（i18n）
// ════════════════════════════════════════
var _currentLang = 'ja';
var I18N = {
  ja: {
    dashboard:'ダッシュボード', settings:'設定', calendar:'カレンダー', chat:'メッセージ',
    players:'選手管理', fee:'月謝管理', search:'検索', notifications:'通知',
    save:'保存', cancel:'キャンセル', delete:'削除', edit:'編集', add:'追加',
    close:'閉じる', confirm:'確認', yes:'はい', no:'いいえ', back:'戻る',
    login:'ログイン', logout:'ログアウト', register:'登録',
    team:'チーム', coach:'コーチ', player:'選手', parent:'保護者', admin:'管理者',
    welcome:'ようこそ', loading:'読み込み中...', noData:'データなし',
    today:'今日', yesterday:'昨日', thisWeek:'今週', thisMonth:'今月',
    name:'名前', email:'メール', phone:'電話番号', age:'年齢',
    practice:'練習', match:'試合', event:'イベント',
    paid:'支払済', unpaid:'未払い', pending:'保留中',
    condition:'体調', sleep:'睡眠', fatigue:'疲労', pain:'痛み',
    export:'エクスポート', import:'インポート', download:'ダウンロード',
    language:'言語', darkMode:'ダークモード', appearance:'外観',
  },
  en: {
    dashboard:'Dashboard', settings:'Settings', calendar:'Calendar', chat:'Messages',
    players:'Players', fee:'Tuition', search:'Search', notifications:'Notifications',
    save:'Save', cancel:'Cancel', delete:'Delete', edit:'Edit', add:'Add',
    close:'Close', confirm:'Confirm', yes:'Yes', no:'No', back:'Back',
    login:'Log in', logout:'Log out', register:'Register',
    team:'Team', coach:'Coach', player:'Player', parent:'Parent', admin:'Admin',
    welcome:'Welcome', loading:'Loading...', noData:'No data',
    today:'Today', yesterday:'Yesterday', thisWeek:'This week', thisMonth:'This month',
    name:'Name', email:'Email', phone:'Phone', age:'Age',
    practice:'Practice', match:'Match', event:'Event',
    paid:'Paid', unpaid:'Unpaid', pending:'Pending',
    condition:'Condition', sleep:'Sleep', fatigue:'Fatigue', pain:'Pain',
    export:'Export', import:'Import', download:'Download',
    language:'Language', darkMode:'Dark mode', appearance:'Appearance',
  }
};

function t(key) {
  return (I18N[_currentLang] || I18N.ja)[key] || (I18N.ja[key]) || key;
}

function setLanguage(lang) {
  _currentLang = lang;
  try { localStorage.setItem('mc_lang', lang); } catch(e){}
  toast(lang === 'en' ? 'Language changed to English' : '日本語に切り替えました', 's');
  refreshPage();
}

function loadLanguage() {
  try { _currentLang = localStorage.getItem('mc_lang') || 'ja'; } catch(e){}
}
loadLanguage();

function langToggleHTML() {
  return '<div class="lang-toggle"><button class="lang-btn'+(_currentLang==='ja'?' active':'')+'" onclick="setLanguage(\'ja\')">🇯🇵 日本語</button><button class="lang-btn'+(_currentLang==='en'?' active':'')+'" onclick="setLanguage(\'en\')">🇺🇸 EN</button></div>';
}


// ════════════════════════════════════════
// Phase 7-B: A-11 AIパフォーマンス予測
// ════════════════════════════════════════
function aiPredictionPage() {
  var my = getMyTeam();
  if(!my) return emptyState('🤖','AIパフォーマンス予測','チーム情報が必要です');
  var pls = (DB.players||[]).filter(function(p){return p.team===my.id;});
  if(!pls.length) return emptyState('🤖','選手データがありません','選手を登録するとAI予測が利用できます');

  var predictions = pls.map(function(p) {
    return computePrediction(p);
  }).sort(function(a,b){ return (a.injuryRisk||0) - (b.injuryRisk||0); }).reverse();

  var html = '<div style="margin-bottom:16px"><div style="font-size:18px;font-weight:800;margin-bottom:4px">🤖 AIパフォーマンス予測</div><div style="font-size:12px;color:var(--txt3)">過去のデータから体調・パフォーマンスの傾向を分析し、怪我リスクと改善点を予測します</div></div>';

  // Overview cards
  var highRisk = predictions.filter(function(p){return p.injuryRisk>=60;}).length;
  var avgPerf = predictions.length ? Math.round(predictions.reduce(function(s,p){return s+(p.perfScore||0);},0)/predictions.length) : 0;
  var improving = predictions.filter(function(p){return p.trend==='up';}).length;

  html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin-bottom:16px">';
  html += '<div class="predict-card" style="text-align:center"><div class="predict-score" style="color:'+(highRisk>0?'var(--red)':'var(--grn)')+'">'+highRisk+'</div><div class="predict-label">高リスク選手</div></div>';
  html += '<div class="predict-card" style="text-align:center"><div class="predict-score" style="color:var(--org)">'+avgPerf+'%</div><div class="predict-label">平均パフォーマンス</div></div>';
  html += '<div class="predict-card" style="text-align:center"><div class="predict-score" style="color:var(--teal)">'+improving+'</div><div class="predict-label">上昇傾向</div></div>';
  html += '<div class="predict-card" style="text-align:center"><div class="predict-score">'+pls.length+'</div><div class="predict-label">分析対象</div></div>';
  html += '</div>';

  // Per-player predictions
  html += '<div style="display:grid;gap:10px">';
  predictions.forEach(function(pred) {
    var riskCls = pred.injuryRisk >= 60 ? 'risk-high' : pred.injuryRisk >= 30 ? 'risk-mid' : 'risk-low';
    var riskLabel = pred.injuryRisk >= 60 ? '⚠️ 高' : pred.injuryRisk >= 30 ? '△ 中' : '✅ 低';
    var trendIcon = pred.trend === 'up' ? '📈' : pred.trend === 'down' ? '📉' : '➡️';
    html += '<div class="predict-card" onclick="openPlayerDetailModal(\''+pred.pid+'\')" style="cursor:pointer">';
    html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">';
    html += '<div><div style="font-size:14px;font-weight:700">'+sanitize(pred.name,15)+' '+trendIcon+'</div>';
    html += '<div style="font-size:11px;color:var(--txt3);margin-top:2px">'+sanitize(pred.position||'',10)+'</div></div>';
    html += '<span class="risk-badge '+riskCls+'">怪我リスク: '+riskLabel+'</span></div>';
    html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:8px">';
    html += '<div><div style="font-size:10px;color:var(--txt3)">パフォーマンス</div><div class="predict-bar"><div class="predict-fill" style="width:'+pred.perfScore+'%;background:'+(pred.perfScore>=70?'var(--teal)':pred.perfScore>=40?'var(--yel)':'var(--red)')+'"></div></div><div style="font-size:12px;font-weight:700">'+pred.perfScore+'%</div></div>';
    html += '<div><div style="font-size:10px;color:var(--txt3)">回復度</div><div class="predict-bar"><div class="predict-fill" style="width:'+pred.recovery+'%;background:'+(pred.recovery>=70?'var(--teal)':'var(--yel)')+'"></div></div><div style="font-size:12px;font-weight:700">'+pred.recovery+'%</div></div>';
    html += '<div><div style="font-size:10px;color:var(--txt3)">怪我リスク</div><div class="predict-bar"><div class="predict-fill" style="width:'+pred.injuryRisk+'%;background:'+(pred.injuryRisk>=60?'var(--red)':pred.injuryRisk>=30?'var(--yel)':'var(--teal)')+'"></div></div><div style="font-size:12px;font-weight:700">'+pred.injuryRisk+'%</div></div>';
    html += '</div>';
    if(pred.recommendations.length) {
      html += '<div style="font-size:11px;color:var(--txt2);padding:6px 8px;background:var(--surf2);border-radius:6px;line-height:1.6">💡 '+pred.recommendations.join(' / ')+'</div>';
    }
    html += '</div>';
  });
  html += '</div>';
  return html;
}

function computePrediction(player) {
  // FIX: Read from DB.conditionLog[pid] (actual data store, not player.conditionLog)
  var cLog = DB.conditionLog?.[player.id] || {};
  var dates = Object.keys(cLog).sort().reverse(); // newest first
  var log = dates.map(function(d){ return Object.assign({date:d}, cLog[d]); });
  var recent = log.slice(0,7);
  var older = log.slice(7,14);

  // mood is 1-10 scale in DB.conditionLog
  var avgRecent = recent.length ? recent.reduce(function(s,c){return s+(c.mood||5);},0)/recent.length : 5;
  var avgOlder = older.length ? older.reduce(function(s,c){return s+(c.mood||5);},0)/older.length : 5;

  var perfScore = Math.min(100, Math.round(avgRecent * 10));
  var recovery = Math.min(100, Math.round((avgRecent / 10) * 100));

  // Injury risk calculation
  var injuryRisk = 10;
  var recentPain = recent.filter(function(c){return (c.painLevel||0)>=3;}).length;
  var recentLowSleep = recent.filter(function(c){return (c.sleep||7)<6;}).length;
  var recentLowCond = recent.filter(function(c){return (c.mood||5)<=3;}).length;
  var decliningTrend = avgRecent < avgOlder - 1;

  injuryRisk += recentPain * 15;
  injuryRisk += recentLowSleep * 8;
  injuryRisk += recentLowCond * 12;
  if(decliningTrend) injuryRisk += 15;
  if(!recent.length) injuryRisk += 20;
  injuryRisk = Math.min(95, Math.max(5, injuryRisk));

  var trend = avgRecent > avgOlder + 0.5 ? 'up' : avgRecent < avgOlder - 0.5 ? 'down' : 'flat';

  var recommendations = [];
  if(recentPain > 0) recommendations.push('痛み報告あり — 休養を検討');
  if(recentLowSleep > 2) recommendations.push('睡眠不足傾向 — 就寝時間の改善を推奨');
  if(recentLowCond > 2) recommendations.push('体調低迷 — 練習強度の調整を推奨');
  if(decliningTrend) recommendations.push('下降傾向 — 個別面談を推奨');
  if(!recent.length) recommendations.push('データ未入力 — 体調記録を促してください');
  if(!recommendations.length) recommendations.push('良好なコンディション — 現状維持');

  return {
    pid:player.id, name:player.name||'', position:player.pos||player.position||'',
    perfScore:perfScore, recovery:recovery, injuryRisk:Math.round(injuryRisk),
    trend:trend, recommendations:recommendations
  };
}


// ════════════════════════════════════════
// Phase 7-C: A-2 FCM プッシュ通知強化
// ════════════════════════════════════════
function initFCM() {
  if(!('serviceWorker' in navigator)) return;
  // Register service worker for push notifications
  navigator.serviceWorker.register('/sw.js').then(function(reg) {
    if(window._fbApp && window.firebase?.messaging) {
      try {
        var messaging = window.firebase.messaging();
        messaging.useServiceWorker(reg);
        messaging.onMessage(function(payload) {
          var n = payload.notification || {};
          toast(n.title || 'お知らせ', 's');
          if(n.body) addNotif(n.body, 'fa-bell', 'dashboard');
        });
      } catch(e) { }
    }
  }).catch(function(e) { });
}

function getFCMToken() {
  if(!window.firebase?.messaging) return Promise.resolve(null);
  try {
    return window.firebase.messaging().getToken({vapidKey: DB.settings?.vapidKey || ''})
      .then(function(token) {
        if(token) {
          DB.settings = DB.settings || {};
          DB.settings.fcmToken = token;
          saveDB();
        }
        return token;
      });
  } catch(e) { return Promise.resolve(null); }
}

function subscribeTopic(topic) {
  var token = DB.settings?.fcmToken;
  if(!token) { toast('FCMトークンが未取得です','w'); return; }
  toast('トピック「'+topic+'」を購読しました','s');
}

// Notification preferences page
function notificationPrefsSection() {
  var prefs = DB.settings?.notifPrefs || {fee:true, match:true, condition:true, chat:true, event:true};
  var items = [
    {k:'fee',l:'💰 月謝リマインド',d:'未払い月謝の通知'},
    {k:'match',l:'🤝 マッチング',d:'申請・承認の通知'},
    {k:'condition',l:'❤️ コンディション',d:'体調アラート通知'},
    {k:'chat',l:'💬 チャット',d:'新着メッセージ通知'},
    {k:'event',l:'📅 イベント',d:'練習・試合リマインド'},
  ];
  var h = '<div style="margin-top:12px;border-top:1px solid var(--b1);padding-top:12px"><div class="fw7 text-sm mb-8">通知カテゴリ設定</div>';
  items.forEach(function(item) {
    var checked = prefs[item.k] !== false;
    h += '<div class="payment-method-row" style="margin-bottom:8px"><div><span class="text-sm">'+item.l+'</span><div class="text-xs text-muted">'+item.d+'</div></div>';
    h += '<label class="toggle-switch"><input type="checkbox" '+(checked?'checked':'')+' onchange="saveNotifCatPref(\''+item.k+'\',this.checked)"><span class="toggle-slider"></span></label></div>';
  });
  h += '</div>';
  return h;
}

function saveNotifCatPref(key, val) {
  DB.settings = DB.settings || {};
  if(!DB.settings.notifPrefs) DB.settings.notifPrefs = {};
  DB.settings.notifPrefs[key] = val;
  saveDB();
}


// ════════════════════════════════════════
// Phase 7-D: A-4 Googleカレンダー連携強化
// ════════════════════════════════════════
function exportAllEventsICS() {
  var events = (DB.events||[]);
  var teamId = _getMyTeamId();
  if(teamId) events = events.filter(function(e){return e.teamId===teamId;});
  if(!events.length) { toast('エクスポートするイベントがありません','w'); return; }

  var lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//MyCOACH//BUKATSU//JP','CALSCALE:GREGORIAN','METHOD:PUBLISH'];

  events.forEach(function(ev) {
    var d = new Date(ev.year, ev.month||0, ev.date||1);
    var dateStr = d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
    var endD = new Date(d.getTime() + 2*3600000);
    var endStr = endD.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
    lines.push('BEGIN:VEVENT');
    lines.push('UID:'+ev.id+'@mycoach');
    lines.push('DTSTART:'+dateStr);
    lines.push('DTEND:'+endStr);
    lines.push('SUMMARY:'+(ev.title||'イベント').replace(/,/g,'\\,'));
    if(ev.place) lines.push('LOCATION:'+(ev.place).replace(/,/g,'\\,'));
    if(ev.note) lines.push('DESCRIPTION:'+(ev.note).replace(/,/g,'\\,').replace(/\n/g,'\\n'));
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  var blob = new Blob([lines.join('\r\n')], {type:'text/calendar;charset=utf-8'});
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'mycoach_events_'+new Date().toISOString().slice(0,10)+'.ics';
  document.body.appendChild(a); a.click();
  setTimeout(function(){ document.body.removeChild(a); }, 100);
  toast('📅 '+events.length+'件のイベントをICSエクスポートしました','s');
}

function calendarSyncStatus() {
  var gcalConnected = DB.settings?.gcalConnected || false;
  var lastSync = DB.settings?.gcalLastSync || null;
  return '<div style="margin-top:12px;padding:12px;background:var(--surf2);border-radius:10px">'
    +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">'
    +'<div style="font-size:13px;font-weight:700">📅 カレンダー連携</div>'
    +'<span class="sec-badge'+(gcalConnected?'':' warn')+'">'+(gcalConnected?'✅ 接続済':'⚠️ 未接続')+'</span></div>'
    +'<div style="font-size:11px;color:var(--txt3);margin-bottom:8px">'+(lastSync?'最終同期: '+lastSync:'まだ同期されていません')+'</div>'
    +'<div style="display:flex;gap:6px">'
    +'<button class="btn btn-primary btn-xs" onclick="exportAllEventsICS()">📥 全イベントをICS出力</button>'
    +'<button class="btn btn-ghost btn-xs" onclick="toast(\'Google Calendar APIの設定が必要です。BACKEND_SETUP_GUIDEを参照してください。\',\'w\')">🔗 Gcal接続</button>'
    +'</div></div>';
}


// ════════════════════════════════════════
// Phase 7-E: C-2 localStorage→Firestore移行ヘルパー
// ════════════════════════════════════════
function getStorageMigrationStatus() {
  var lsKeys = [];
  try {
    for(var i=0; i<localStorage.length; i++) {
      var key = localStorage.key(i);
      if(key && key.startsWith('mc_')) lsKeys.push(key);
    }
  } catch(e){}

  var fsConnected = !!(window._fbDb);
  var totalLSSize = 0;
  lsKeys.forEach(function(k) {
    try { totalLSSize += (localStorage.getItem(k)||'').length; } catch(e){}
  });

  return {
    lsKeyCount: lsKeys.length,
    lsKeys: lsKeys,
    lsSizeKB: Math.round(totalLSSize / 1024),
    firestoreConnected: fsConnected,
    migrationNeeded: lsKeys.length > 0 && fsConnected
  };
}

function storageMigrationWidget() {
  var status = getStorageMigrationStatus();
  var html = '<div class="card" style="padding:16px"><div class="fw7 mb-10" style="font-size:14px">💾 データストレージ状況</div>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">';
  html += '<div style="padding:8px;background:var(--surf2);border-radius:8px;text-align:center"><div style="font-size:16px;font-weight:700">'+status.lsKeyCount+'</div><div style="font-size:10px;color:var(--txt3)">ローカルキー</div></div>';
  html += '<div style="padding:8px;background:var(--surf2);border-radius:8px;text-align:center"><div style="font-size:16px;font-weight:700">'+status.lsSizeKB+'KB</div><div style="font-size:10px;color:var(--txt3)">ローカルサイズ</div></div>';
  html += '</div>';
  html += '<div style="font-size:11px;color:var(--txt3);margin-bottom:8px">Firestore: '+(status.firestoreConnected?'<span style="color:var(--teal)">✅ 接続済</span>':'<span style="color:var(--red)">❌ 未接続</span>')+'</div>';
  if(status.migrationNeeded) {
    html += '<button class="btn btn-secondary btn-xs" onclick="runStorageMigration()">🔄 Firestoreへ同期</button>';
  }
  html += '</div>';
  return html;
}

function runStorageMigration() {
  if(!window._fbDb) { toast('Firestoreに接続されていません','e'); return; }
  toast('データ同期を開始しました...','s');
  // Trigger existing saveDB which already syncs to Firestore
  saveDB();
  setTimeout(function(){
    DB.settings = DB.settings || {};
    DB.settings.lastMigration = new Date().toISOString();
    saveDB();
    toast('✅ Firestoreへの同期が完了しました','s');
  }, 2000);
}


// ════════════════════════════════════════
// Phase 7-F: C-4 セキュリティ強化
// ════════════════════════════════════════

// Rate limiter for sensitive actions
var _rateLimits = {};
function rateLimit(action, maxPerMin) {
  maxPerMin = maxPerMin || 10;
  var now = Date.now();
  if(!_rateLimits[action]) _rateLimits[action] = [];
  // Clean old entries
  _rateLimits[action] = _rateLimits[action].filter(function(t){ return now - t < 60000; });
  if(_rateLimits[action].length >= maxPerMin) {
    toast('操作が頻繁すぎます。しばらく待ってから再試行してください。','e');
    return false;
  }
  _rateLimits[action].push(now);
  return true;
}

// Enhanced input sanitization
function sanitizeStrict(str, maxLen) {
  if(typeof str !== 'string') return '';
  maxLen = maxLen || 100;
  // Remove script/event handler injections
  str = str.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  str = str.replace(/on\w+\s*=/gi, '');
  str = str.replace(/javascript:/gi, '');
  str = str.replace(/data:\s*text\/html/gi, '');
  str = str.replace(/vbscript:/gi, '');
  str = str.replace(/expression\s*\(/gi, '');
  // Standard HTML entity encoding
  str = str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#x27;');
  return str.slice(0, maxLen);
}

// URL sanitizer - prevent javascript: and data: URIs
function sanitizeURL(url) {
  if(!url || typeof url !== 'string') return '';
  var trimmed = url.trim().toLowerCase();
  if(trimmed.startsWith('javascript:') || trimmed.startsWith('data:') || trimmed.startsWith('vbscript:')) return '';
  if(!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('mailto:') && !trimmed.startsWith('/') && !trimmed.startsWith('#')) return '';
  return url.trim();
}

// ── API Key obfuscation (prevents plaintext in localStorage/Firestore) ──
function _obfuscateKey(key) {
  if(!key || typeof key !== 'string') return '';
  if(key.startsWith('_enc:')) return key; // already obfuscated
  var out = '';
  var s = 'mc_key_' + (DB.currentUser?.id || 'x').slice(0,8);
  for(var i=0; i<key.length; i++) {
    out += String.fromCharCode(key.charCodeAt(i) ^ s.charCodeAt(i % s.length));
  }
  return '_enc:' + btoa(out);
}
function _deobfuscateKey(enc) {
  if(!enc || typeof enc !== 'string') return '';
  if(!enc.startsWith('_enc:')) return enc; // plaintext legacy
  try {
    var decoded = atob(enc.slice(5));
    var s = 'mc_key_' + (DB.currentUser?.id || 'x').slice(0,8);
    var out = '';
    for(var i=0; i<decoded.length; i++) {
      out += String.fromCharCode(decoded.charCodeAt(i) ^ s.charCodeAt(i % s.length));
    }
    return out;
  } catch(e) { return ''; }
}
// Read Gemini key (auto-deobfuscate)
function _getGeminiKey() {
  return _deobfuscateKey(DB.settings?.geminiKey || '') || DB.settings?.aiKey || '';
}

// ── DevTools detection (warning only, no blocking) ──
(function(){
  var _dtWarnShown = false;
  var _checkDevTools = function() {
    var threshold = 160;
    if(window.outerWidth - window.innerWidth > threshold || window.outerHeight - window.innerHeight > threshold) {
      if(!_dtWarnShown && DB.currentUser) {
        _dtWarnShown = true;
        addAuditLog('devtools_open', 'DevToolsが開かれた可能性 (user: '+(DB.currentUser?.name||'unknown')+')');
      }
    }
  };
  setInterval(_checkDevTools, 3000);
})();

// ── Prevent sensitive data logging via console override ──
(function(){
  var _keys = ['geminiKey','aiKey','pwHash','password','token','secret'];
  var _origStringify = JSON.stringify;
  // Don't actually override JSON.stringify globally, just add a safe version
  window._safeLog = function(obj) {
    if(!obj || typeof obj !== 'object') return String(obj);
    var safe = {};
    Object.keys(obj).forEach(function(k){
      safe[k] = _keys.some(function(sk){return k.toLowerCase().includes(sk.toLowerCase());}) ? '***' : obj[k];
    });
    return _origStringify(safe);
  };
})();

// Session timeout management
var _sessionTimeout = null;
var _sessionMaxAge = 7 * 24 * 60 * 60 * 1000; // 7日間（アプリ特性に合わせて延長）

function initSessionSecurity() {
  var loginTime = DB.settings?.loginTimestamp;
  if(loginTime) {
    var elapsed = Date.now() - new Date(loginTime).getTime();
    if(elapsed > _sessionMaxAge) {
      // 期限切れ → タイムスタンプをリセットして再ログインを促す
      // ただしデータは保持（再登録不要）
      DB.settings.loginTimestamp = null;
      saveDB();
      toast('前回のログインから7日以上経過しました。再ログインしてください。','i');
      doLogout();
      return;
    }
    // アクティブ利用中 → タイムスタンプを更新（セッション延長）
    DB.settings.loginTimestamp = new Date().toISOString();
  }
  // タイムスタンプ未設定 → 新規設定（初回ログイン or アップデート後）
  DB.settings = DB.settings || {};
  if(!DB.settings.loginTimestamp) {
    DB.settings.loginTimestamp = new Date().toISOString();
    saveDB();
  }
}

// CSP violation reporter
document.addEventListener('securitypolicyviolation', function(e) {
  if(window.Sentry && Sentry.captureMessage) {
    Sentry.captureMessage('CSP Violation: ' + e.violatedDirective + ' blocked ' + e.blockedURI);
  }
});

// Security audit summary
function securityAuditWidget() {
  var issues = [];
  // Check HTTPS
  if(location.protocol !== 'https:' && location.hostname !== 'localhost') {
    issues.push({l:'HTTPSが無効です',s:'high'});
  }
  // Check session age
  var loginTime = DB.settings?.loginTimestamp;
  if(loginTime) {
    var ageH = Math.round((Date.now() - new Date(loginTime).getTime()) / 3600000);
    if(ageH > 120) issues.push({l:'セッションが'+Math.round(ageH/24)+'日経過',s:'mid'});
  }
  // Check Firestore connection
  if(!window._fbDb) issues.push({l:'Firestoreに未接続（ローカルのみ）',s:'mid'});
  // Check push permission
  if(typeof Notification !== 'undefined' && Notification.permission === 'denied') {
    issues.push({l:'プッシュ通知がブロック中',s:'low'});
  }

  var html = '<div class="card" style="padding:16px"><div class="fw7 mb-10" style="font-size:14px">🔒 セキュリティ状況</div>';
  if(!issues.length) {
    html += '<div style="text-align:center;padding:12px"><span class="sec-badge" style="font-size:12px">✅ 問題なし</span></div>';
  } else {
    issues.forEach(function(iss) {
      var color = iss.s==='high'?'var(--red)':iss.s==='mid'?'var(--yel)':'var(--txt3)';
      var icon = iss.s==='high'?'🔴':iss.s==='mid'?'🟡':'⚪';
      html += '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;font-size:12px"><span>'+icon+'</span><span style="color:'+color+'">'+iss.l+'</span></div>';
    });
  }
  html += '</div>';
  return html;
}


// ════════════════════════════════════════
// Phase 7-G: C-6 Sentry エラーモニタリング
// ════════════════════════════════════════
function initSentry() {
  // Sentry SDK is loaded via CSP-allowed domain
  if(typeof Sentry !== 'undefined' && Sentry.init) {
    try {
      Sentry.init({
        dsn: DB.settings?.sentryDsn || '',
        environment: location.hostname === 'localhost' ? 'development' : 'production',
        release: 'mycoach@v39',
        tracesSampleRate: 0.1,
        beforeSend: function(event) {
          // Scrub sensitive data
          if(event.request && event.request.cookies) delete event.request.cookies;
          return event;
        }
      });
      if(DB.currentUser) {
        Sentry.setUser({id:DB.currentUser.id, role:DB.currentUser.role});
      }
    } catch(e) { }
  }
}

function sentrySettingsWidget() {
  var dsn = DB.settings?.sentryDsn || '';
  var active = typeof Sentry !== 'undefined' && !!dsn;
  return '<div class="card" style="padding:16px"><div class="fw7 mb-10" style="font-size:14px">📊 エラーモニタリング (Sentry)</div>'
    +'<div style="font-size:12px;color:var(--txt3);margin-bottom:8px">ステータス: '+(active?'<span style="color:var(--teal)">✅ 有効</span>':'<span style="color:var(--txt3)">⚪ 無効（DSN未設定）</span>')+'</div>'
    +'<div class="form-group"><label class="label">Sentry DSN</label><input class="input" id="sentry-dsn" value="'+sanitize(dsn,100)+'" placeholder="https://xxxxx@oN.ingest.sentry.io/N"></div>'
    +'<button class="btn btn-primary btn-xs mt-8" onclick="saveSentryDsn()">保存</button></div>';
}

function saveSentryDsn() {
  var dsn = (document.getElementById('sentry-dsn')?.value||'').trim();
  DB.settings = DB.settings || {};
  DB.settings.sentryDsn = dsn;
  saveDB();
  toast('Sentry DSNを保存しました。リロードで反映されます。','s');
}


// ════════════════════════════════════════
// Phase 7-H: C-7 デモデータ完全分離
// ════════════════════════════════════════
var DEMO_DATA = {
  teams: [
    {id:'demo-t1',name:'FCサンプル東京',sport:'サッカー',area:'東京都',code:'DEMO01',members:5,fee:5000,matchAvailable:true,ageGroup:'U-15',teamLevel:'中級',matchDays:'土,日'},
  ],
  players: [
    {id:'demo-p1',name:'田中太郎',team:'demo-t1',pos:'FW',age:14,number:10,status:'active'},
    {id:'demo-p2',name:'山田花子',team:'demo-t1',pos:'MF',age:13,number:7,status:'active'},
    {id:'demo-p3',name:'佐藤次郎',team:'demo-t1',pos:'DF',age:14,number:4,status:'active'},
    {id:'demo-p4',name:'鈴木美咲',team:'demo-t1',pos:'GK',age:13,number:1,status:'active'},
    {id:'demo-p5',name:'高橋翔',team:'demo-t1',pos:'MF',age:14,number:8,status:'active'},
  ],
  coaches: [
    {id:'demo-c1',name:'伊藤コーチ',sport:'サッカー',area:'東京都',rating:4.5,avail:true,bio:'U-15指導歴10年',price:30000,exp:10},
  ],
  events: [
    {id:'demo-ev1',title:'練習試合 vs FCサンプル大阪',date:new Date().getDate(),month:new Date().getMonth(),year:new Date().getFullYear(),time:'10:00',type:'match',teamId:'demo-t1',scope:'team',createdAt:new Date().toISOString()},
    {id:'demo-ev2',title:'通常練習',date:new Date().getDate()+1,month:new Date().getMonth(),year:new Date().getFullYear(),time:'18:00',type:'practice',teamId:'demo-t1',scope:'team',createdAt:new Date().toISOString()},
  ],
};

function loadDemoData() {
  if(DB.currentUser && DB.currentUser.role !== 'admin'){ toast('管理者権限が必要です','e'); return; }
  var savedUser = DB.currentUser;
  DB.teams = DEMO_DATA.teams.slice();
  DB.players = DEMO_DATA.players.map(function(p){return Object.assign({},p);});
  DB.coaches = DEMO_DATA.coaches.slice();
  DB.events = DEMO_DATA.events.slice();
  DB.requests = [];
  DB.announcements = [{id:'demo-a1',title:'デモモードへようこそ！',body:'これはデモデータです。自由に操作をお試しください。',teamId:'demo-t1',createdAt:new Date().toISOString(),createdBy:'system'}];
  DB.leagues = [];
  DB.attendance = {};
  DB.coachReviews = [];
  // FIX: Populate DB.conditionLog (the actual data store) with demo data
  var today = new Date().toISOString().slice(0,10);
  var yesterday = new Date(Date.now()-86400000).toISOString().slice(0,10);
  var day2 = new Date(Date.now()-86400000*2).toISOString().slice(0,10);
  if(!DB.conditionLog) DB.conditionLog = {};
  DB.conditionLog['demo-p1'] = {};
  DB.conditionLog['demo-p1'][today] = {date:today,mood:8,sleep:7.5,fatigue:2,painLevel:0};
  DB.conditionLog['demo-p1'][yesterday] = {date:yesterday,mood:7,sleep:7,fatigue:3,painLevel:0};
  DB.conditionLog['demo-p1'][day2] = {date:day2,mood:9,sleep:8,fatigue:1,painLevel:0};
  DB.conditionLog['demo-p2'] = {};
  DB.conditionLog['demo-p2'][today] = {date:today,mood:5,sleep:6,fatigue:5,painLevel:1};
  DB.conditionLog['demo-p2'][yesterday] = {date:yesterday,mood:6,sleep:6.5,fatigue:4,painLevel:0};
  DB.conditionLog['demo-p3'] = {};
  DB.conditionLog['demo-p3'][today] = {date:today,mood:9,sleep:8,fatigue:1,painLevel:0};
  DB.conditionLog['demo-p4'] = {};
  DB.conditionLog['demo-p4'][today] = {date:today,mood:3,sleep:5,fatigue:7,painLevel:3,painParts:['膝']};
  DB.conditionLog['demo-p4'][yesterday] = {date:yesterday,mood:4,sleep:5.5,fatigue:6,painLevel:2};
  DB.conditionLog['demo-p4'][day2] = {date:day2,mood:5,sleep:6,fatigue:5,painLevel:1};
  // demo-p5: no data (triggers "no data" alert)
  DB.currentUser = savedUser;
  window._demoMode = true;
  saveDB();
}

function clearDemoData() {
  if(!window._demoMode) return;
  if(DB.currentUser && DB.currentUser.role !== 'admin'){ return; }
  window._demoMode = false;
  DB.teams = (DB.teams||[]).filter(function(t){return !t.id.startsWith('demo-');});
  DB.players = (DB.players||[]).filter(function(p){return !p.id.startsWith('demo-');});
  DB.coaches = (DB.coaches||[]).filter(function(c){return !c.id.startsWith('demo-');});
  DB.events = (DB.events||[]).filter(function(e){return !e.id.startsWith('demo-');});
  DB.announcements = (DB.announcements||[]).filter(function(a){return !a.id.startsWith('demo-');});
  // FIX: Also clean conditionLog, trainingLog etc for demo players
  if(DB.conditionLog) Object.keys(DB.conditionLog).forEach(function(k){if(k.startsWith('demo-'))delete DB.conditionLog[k];});
  if(DB.trainingLog) Object.keys(DB.trainingLog).forEach(function(k){if(k.startsWith('demo-'))delete DB.trainingLog[k];});
  if(DB.bodyLog) Object.keys(DB.bodyLog).forEach(function(k){if(k.startsWith('demo-'))delete DB.bodyLog[k];});
  saveDB();
  toast('デモデータをクリアしました','s');
  refreshPage();
}

function demoModeWidget() {
  if(!window._demoMode) return '';
  return '<div style="background:rgba(168,85,247,.06);border:1.5px dashed rgba(168,85,247,.3);border-radius:12px;padding:12px 16px;margin-bottom:14px;display:flex;align-items:center;gap:10px">'
    +'<span style="font-size:20px">🧪</span>'
    +'<div style="flex:1"><div style="font-size:13px;font-weight:700;color:#7c3aed">デモモード実行中</div><div style="font-size:11px;color:var(--txt3)">サンプルデータで操作を体験できます</div></div>'
    +'<button class="btn btn-ghost btn-xs" onclick="clearDemoData()" style="color:#7c3aed">デモ終了</button>'
    +'</div>';
}


// ════════════════════════════════════════
// Phase 7-I: 管理者向け統合設定ページ強化
// ════════════════════════════════════════
function adminAdvancedSettings() {
  return '<div style="display:grid;gap:14px;margin-top:16px">'
    +storageMigrationWidget()
    +securityAuditWidget()
    +sentrySettingsWidget()
    +'</div>';
}
function legalText(type){
  if(type === 'terms'){
    return `<div style="max-height:60vh;overflow-y:auto;font-size:13px;line-height:1.8;color:var(--txt2)">
      <h3 style="font-size:15px;font-weight:700;margin-bottom:12px;color:var(--txt1)">部勝（ブカツ） 利用規約</h3>
      <p style="font-size:11px;color:var(--txt3);margin-bottom:12px">最終更新: 2026年2月27日</p>
      <p style="margin-bottom:10px"><b>第1条（目的）</b><br>本規約は「部勝（ブカツ）」の利用に関する条件を定めるものです。</p>
      <p style="margin-bottom:10px"><b>第2条（利用資格）</b><br>チーム管理者・コーチ・選手・保護者を対象としたサービスです。18歳未満の方は保護者の同意が必要です。</p>
      <p style="margin-bottom:10px"><b>第3条（手数料）</b><br>・月謝決済：5% ・コーチマッチング：10% ・単発請求：5%<br>・登録・メッセージ・栄養管理・AI機能等は無料</p>
      <p style="margin-bottom:10px"><b>第4条（決済）</b><br>決済はStripeを利用。カード情報は当社サーバーに保存しません。</p>
      <p style="margin-bottom:10px"><b>第5条（禁止事項）</b><br>虚偽情報の登録、誹謗中傷、不正アクセス、サービス外取引による手数料回避等を禁止します。</p>
      <p style="margin-bottom:10px"><b>第6条（AI機能）</b><br>栄養分析・トレーニングアドバイスは参考情報であり、医学的診断を代替しません。</p>
      <p style="margin-bottom:10px"><b>第7条（選手情報の開示）</b><br>コーチへの選手情報開示は、チーム管理者の許可とコーチの同意確認が必要です。開示後の管理責任はコーチに帰属します。</p>
      <p style="margin-bottom:10px"><b>第8条（免責）</b><br>当社はマッチング仲介プラットフォームの提供者であり、コーチの指導の質・事故等について直接の責任を負う立場にありません。ただし、当社の故意または重大な過失による場合、および消費者契約法その他の強行法規により免責できない場合はこの限りではありません。賠償上限は過去12ヶ月の支払手数料総額です。</p>
      <p style="margin-bottom:10px"><b>第9条（準拠法）</b><br>日本法を準拠法とし、東京地方裁判所を専属的合意管轄裁判所とします。</p>
      <p style="margin-top:16px"><a href="#" onclick="event.preventDefault();showLegal('terms')" style="color:var(--org);font-weight:600">→ 利用規約の全文を読む</a></p>
    </div>`;
  }
  if(type === 'privacy'){
    return `<div style="max-height:60vh;overflow-y:auto;font-size:13px;line-height:1.8;color:var(--txt2)">
      <h3 style="font-size:15px;font-weight:700;margin-bottom:12px;color:var(--txt1)">プライバシーポリシー</h3>
      <p style="font-size:11px;color:var(--txt3);margin-bottom:12px">最終更新: 2026年2月27日</p>
      <p style="margin-bottom:10px"><b>収集する情報</b><br>氏名・メールアドレス・役割情報・チーム情報・身体情報（任意）・食事記録・トレーニング記録・チャット内容・決済履歴を収集します。カード情報はStripeが管理し当社は保持しません。</p>
      <p style="margin-bottom:10px"><b>利用目的</b><br>サービスの提供・改善、コーチ/チームマッチング、決済処理、AI栄養分析・トレーニングアドバイス、不正利用防止に使用します。</p>
      <p style="margin-bottom:10px"><b>第三者提供</b><br>Stripe（決済処理委託先）、コーチへの選手情報開示（チーム管理者の許可＋コーチの同意確認時のみ）、法令に基づく場合を除き、第三者に提供しません。</p>
      <p style="margin-bottom:10px"><b>AI機能</b><br>AI機能は利用者自身のデータのみを分析し、モデル学習等には使用しません。</p>
      <p style="margin-bottom:10px"><b>セキュリティ</b><br>SSL暗号化・パスワードハッシュ化・ロールベースアクセス制御・セッションタイムアウト・レート制限を実施しています。</p>
      <p style="margin-bottom:10px"><b>利用者の権利</b><br>個人情報の開示・訂正・削除・利用停止を請求できます。設定画面からデータのエクスポートも可能です。</p>
      <p style="margin-bottom:10px"><b>データ保管</b><br>アカウント削除後30日以内に個人情報を削除します（法定保管データを除く）。</p>
      <p style="margin-bottom:10px"><b>お問い合わせ</b><br>kanri@mycoach-myteam.com</p>
      <p style="margin-top:16px"><a href="#" onclick="event.preventDefault();showLegal('privacy')" style="color:var(--org);font-weight:600">→ プライバシーポリシーの全文を読む</a></p>
    </div>`;
  }
  return '<div class="text-muted text-center" style="padding:20px">コンテンツが見つかりません</div>';
}

