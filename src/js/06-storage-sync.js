// 06-storage-sync.js — Storage, Firestore sync
const STORAGE_KEY = 'mycoach_myteam_db_v1';
const BUILD_VERSION = 'v3.4.0-20260306'; // デプロイ確認用
// NOTE: バージョンチェックはPROD_VERSIONで一元管理（重複クリア防止）

// 保存対象フィールド（個人情報を含むため慎重に管理）
const PERSIST_FIELDS = [
  'coaches', 'teams', 'players', 'payments', 'coachPay',
  'payThreads', 'requests', 'disclosures', 'notifs', 'events',
  'chats', 'currentUser', 'meals', 'mealHistory', 'myFoods',
  'trainingLog', 'doneSets', 'bodyLog', 'conditionLog', 'injuryHistory', 'matchHistory', 'mealTemplates',
  'stripeSetupNeeded', 'settings',
  'moderationLog', 'userWarnings', 'suspendedUsers',
  'teamMatches', 'teamEvents', 'teamReviews', 'adhocInvoices', 'emailLog', 'teamFeeRates',
  'pendingRole', 'pendingEmail', 'pendingName', 'pendingUserId', 'pendingTeamId',
  'announcements', 'customWorkouts', 'nutritionLog', 'inventory',
  'pendingTeamCode', 'pendingProfile', 'pendingParentTeamId', 'teamFiles', 'nutriGoals', 'consentLog', 'auditLog', '_syncedAt',
  'playerMealHistory','alumni','foodKnowledge','paymentAuditLog','paymentTrail'];
const SHARED_FIELDS = [
  'coaches','teams','players','payments','coachPay','payThreads','requests',
  'disclosures','events','chats','teamMatches','teamEvents','teamReviews',
  'adhocInvoices','teamFeeRates','announcements','inventory','teamFiles',
  'notifs','moderationLog','userWarnings','suspendedUsers','emailLog','consentLog','auditLog','alumni',
  'trainingLog','conditionLog','bodyLog','injuryHistory','playerMealHistory','foodKnowledge',
  'paymentAuditLog','paymentTrail'
];
const PRIVATE_FIELDS = [
  'currentUser','meals','mealHistory','myFoods','doneSets',
  'matchHistory','mealTemplates',
  'stripeSetupNeeded','settings','nutriGoals','customWorkouts','nutritionLog',
  'pendingRole','pendingEmail','pendingName','pendingUserId','pendingTeamId',
  'pendingTeamCode','pendingProfile','pendingParentTeamId'
];

// DBをlocalStorageに保存

// 写真圧縮（localStorageサイズ制限対策）
function _compressPhoto(dataUrl,maxW=200){
  if(!dataUrl||!dataUrl.startsWith('data:image'))return dataUrl;
  try{
    var img=new Image();var c=document.createElement('canvas');
    img.src=dataUrl;
    var w=img.naturalWidth||maxW,h=img.naturalHeight||maxW;
    if(w>maxW){var r=maxW/w;w=maxW;h=Math.round(h*r);}
    c.width=w;c.height=h;
    var ctx=c.getContext('2d');ctx.drawImage(img,0,0,w,h);
    return c.toDataURL('image/jpeg',0.7);
  }catch(e){return dataUrl;}
}

// 非同期版画像圧縮（全アップロードで使用）— ④画像ストレージ対策
function _compressPhotoAsync(fileOrDataUrl, maxW=300, quality=0.7){
  return new Promise((resolve,reject)=>{
    const img=new Image();
    img.onload=()=>{
      let w=img.naturalWidth, h=img.naturalHeight;
      if(w<=maxW && h<=maxW){
        const c=document.createElement('canvas');c.width=w;c.height=h;
        c.getContext('2d').drawImage(img,0,0);resolve(c.toDataURL('image/jpeg',quality));return;
      }
      if(w>h){h=Math.round(h*(maxW/w));w=maxW;}else{w=Math.round(w*(maxW/h));h=maxW;}
      const c=document.createElement('canvas');c.width=w;c.height=h;
      const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
      ctx.drawImage(img,0,0,w,h);
      const result=c.toDataURL('image/jpeg',quality);
      if(result.length>68000&&quality>0.4) resolve(_compressPhotoAsync(fileOrDataUrl,maxW,quality-0.15));
      else resolve(result);
    };
    img.onerror=()=>reject(new Error('画像読み込みエラー'));
    if(typeof fileOrDataUrl==='string') img.src=fileOrDataUrl;
    else{ const r=new FileReader();r.onload=e=>{img.src=e.target.result;};r.onerror=()=>reject(new Error('ファイル読み込みエラー'));r.readAsDataURL(fileOrDataUrl); }
  });
}

// ================================================================
// データ整合性チェック — ⑧テストの部分代替
// ================================================================
function runDataIntegrityCheck(){
  const issues=[];
  const warn=(area,msg)=>issues.push({area,msg,level:'warn'});
  const err=(area,msg)=>issues.push({area,msg,level:'error'});
  // コーチ参照
  (DB.coaches||[]).forEach(c=>{if(c.team&&!DB.teams.find(t=>t.id===c.team))warn('coach','コーチ '+sanitize(c.name,10)+' の所属チームが不在');});
  // 選手チーム参照
  DB.players.forEach(p=>{if(p.team&&!DB.teams.find(t=>t.id===p.team))warn('player','選手 '+sanitize(p.name,10)+' のチームが不在');});
  // 支払い参照
  _dbArr('payments').forEach(p=>{if(p.player&&!DB.players.find(x=>x.id===p.player))warn('payment','支払い('+p.id+')の選手が不在');});
  // リクエスト参照
  _dbArr('requests').forEach(r=>{
    if(r.coachId&&!DB.coaches.find(c=>c.id===r.coachId))warn('request','リクエストのコーチが不在');
    if(r.teamId&&!DB.teams.find(t=>t.id===r.teamId))warn('request','リクエストのチームが不在');
  });
  // データサイズ
  try{
    const sz=JSON.stringify(DB).length;const kb=Math.round(sz/1024);
    if(kb>800)err('size','DBサイズ '+kb+'KB — Firestore上限に接近');
    else if(kb>500)warn('size','DBサイズ '+kb+'KB — 肥大化傾向');
    let photoBytes=0;
    [...DB.coaches,...DB.teams,...DB.players].forEach(x=>{if(x.photo&&x.photo.length>500)photoBytes+=x.photo.length;if(x.logo&&x.logo.length>500)photoBytes+=x.logo.length;});
    const pkb=Math.round(photoBytes*0.75/1024);
    if(pkb>200)warn('photos','画像合計 '+pkb+'KB — 圧縮推奨');
  }catch(e){}
  // 重複ID
  ['coaches','teams','players'].forEach(key=>{
    const ids=DB[key].map(x=>x.id).filter(Boolean);
    const dupes=ids.filter((id,i)=>ids.indexOf(id)!==i);
    if(dupes.length)err('duplicate',key+'に重複ID');
  });
  return issues;
}

// 管理者ヘルスチェックパネル
function openAdminHealthCheck(){
  if(DB.currentUser?.role!=='admin'){toast('管理者権限が必要です','e');return;}
  const issues=runDataIntegrityCheck();
  const dbSize=Math.round(JSON.stringify(DB).length/1024);
  const syncAge=DB._syncedAt?Math.round((Date.now()-new Date(DB._syncedAt))/60000):'不明';
  const photoCount=[...DB.coaches,...DB.teams,...DB.players].filter(x=>x.photo&&x.photo.length>500).length;
  let h='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px">';
  [{l:'DBサイズ',v:dbSize+'KB',c:dbSize>500?'var(--red)':dbSize>300?'var(--yel)':'var(--grn)'},
   {l:'コーチ',v:(DB.coaches||[]).length,c:'var(--org)'},{l:'チーム',v:(DB.teams||[]).length,c:'var(--teal)'},
   {l:'選手',v:(DB.players||[]).length,c:'var(--blue)'},{l:'画像',v:photoCount+'件',c:photoCount>10?'var(--yel)':'var(--grn)'},
   {l:'支払い',v:_dbArr('payments').length,c:'var(--org)'},{l:'最終同期',v:syncAge+(typeof syncAge==='number'?'分前':''),c:typeof syncAge==='number'&&syncAge<10?'var(--grn)':'var(--yel)'},
   {l:'監査ログ',v:(DB.auditLog||[]).length,c:'var(--blue)'},{l:'ユーザー数',v:_getUsers().length,c:'var(--blue)'}
  ].forEach(s=>{h+=`<div style="text-align:center;padding:10px;background:var(--surf2);border-radius:8px"><div style="font-size:16px;font-weight:800;color:${s.c}">${s.v}</div><div style="font-size:9px;color:var(--txt3)">${s.l}</div></div>`;});
  h+='</div><div style="font-weight:700;font-size:13px;margin-bottom:8px">🔍 整合性チェック</div>';
  if(!issues.length){
    h+='<div style="background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.2);border-radius:10px;padding:14px;text-align:center;margin-bottom:12px"><span style="font-size:20px">✅</span><div class="fw7 text-sm" style="color:var(--grn);margin-top:6px">問題なし</div></div>';
  } else {
    ['error','warn'].forEach(lv=>{
      const items=issues.filter(i=>i.level===lv);if(!items.length)return;
      const icon=lv==='error'?'❌':'⚠️';const col=lv==='error'?'var(--red)':'var(--yel)';
      h+=`<div style="background:${lv==='error'?'rgba(239,68,68,.06)':'rgba(245,158,11,.06)'};border:1px solid ${lv==='error'?'rgba(239,68,68,.2)':'rgba(245,158,11,.2)'};border-radius:10px;padding:12px;margin-bottom:8px">`;
      h+=`<div class="fw7 text-sm" style="color:${col};margin-bottom:6px">${icon} ${items.length}件</div>`;
      items.forEach(i=>h+=`<div style="font-size:11px;color:var(--txt2);padding:2px 0">• [${i.area}] ${sanitize(i.msg,60)}</div>`);
      h+='</div>';
    });
  }
  h+='<div style="display:flex;gap:8px;margin-top:12px"><button class="btn btn-secondary btn-sm flex-1" onclick="autoFixData();closeM()">🔧 自動修復</button><button class="btn btn-ghost btn-sm flex-1" onclick="closeM()">閉じる</button></div>';
  openM('🏥 システムヘルスチェック',h,true);
}
function autoFixData(){
  if(DB.currentUser?.role!=='admin'){toast('権限がありません','e');return;}
  let fixed=0;
  DB.players.forEach(p=>{if(p.team&&!DB.teams.find(t=>t.id===p.team)){p.team='';fixed++;}});
  DB.coaches.forEach(c=>{if(c.team&&!DB.teams.find(t=>t.id===c.team)){c.team='';fixed++;}});
  [...DB.coaches,...DB.teams,...DB.players].forEach(item=>{
    if(item.photo&&item.photo.length>100000){item.photo=_compressPhoto(item.photo,200);fixed++;}
    if(item.logo&&item.logo.length>100000){item.logo=_compressPhoto(item.logo,200);fixed++;}
  });
  ['coaches','teams','players'].forEach(key=>{
    const seen=new Set();const before=DB[key].length;
    DB[key]=DB[key].filter(x=>{if(!x.id||seen.has(x.id))return false;seen.add(x.id);return true;});
    fixed+=before-DB[key].length;
  });
  addAuditLog('auto_fix','自動修復: '+fixed+'件');saveDB();
  toast(fixed>0?'🔧 '+fixed+'件修復':'✅ 問題なし','s');refreshPage();
}

// ================================================================
// オフライン検知 + 接続状態インジケーター — ⑫ 部分対策
// ================================================================
(function(){
  let _offlineBanner=null;
  function showOfflineBanner(){
    if(_offlineBanner)return;
    _offlineBanner=document.createElement('div');
    _offlineBanner.id='offline-banner';
    _offlineBanner.setAttribute('role','alert');
    _offlineBanner.style.cssText='position:fixed;top:0;left:0;right:0;z-index:99998;background:linear-gradient(90deg,#ef4444,#dc2626);color:#fff;text-align:center;padding:6px 16px;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 2px 8px rgba(0,0,0,.15)';
    _offlineBanner.innerHTML='<i class="fa fa-wifi" style="opacity:.7"></i> オフラインです — 変更はローカルに保存され、復帰後に同期されます';
    document.body.prepend(_offlineBanner);
    // アプリのtop paddingを調整
    const app=document.getElementById('app');if(app)app.style.paddingTop='32px';
  }
  function hideOfflineBanner(){
    if(!_offlineBanner)return;
    _offlineBanner.remove();_offlineBanner=null;
    const app=document.getElementById('app');if(app)app.style.paddingTop='';
    // 復帰時にFirestore同期・リスナー再開
    if(DB.currentUser){
      toast('🌐 オンライン復帰 — クラウド同期中...','i');
      setTimeout(()=>{
        try{_syncToFirestore();}catch(e){}
        // リスナーが切れていたら再開
        _startAllListeners();
      },1000);
    }
  }
  window.addEventListener('offline',showOfflineBanner);
  window.addEventListener('online',hideOfflineBanner);
  if(!navigator.onLine) showOfflineBanner();
})();
async function _fbDiag(){
  const r = {fbReady: !!window._fbReady, auth: null, uid: null, uidCache: _fbUidCache, 
    appdataExists: false, usersDocExists: false, usersByEmailExists: false,
    localCoaches: DB.coaches?.length||0, localTeams: DB.teams?.length||0, 
    localPlayers: DB.players?.length||0, currentUser: DB.currentUser?.email||null};
  try {
    r.auth = !!window._fbAuth?.currentUser;
    r.uid = window._fbAuth?.currentUser?.uid || null;
    if(r.uid && window._fbFn){
      const fn = window._fbFn;
      // Check appdata
      try {
        const snap = await fn.getDoc(fn.doc(window._fbDB,'appdata',r.uid));
        r.appdataExists = snap.exists();
        if(snap.exists()){
          const d = snap.data();
          r.remoteCoaches = d.coaches?.length||0;
          r.remoteTeams = d.teams?.length||0;
          r.remotePlayers = d.players?.length||0;
          r.remoteSyncedAt = d._syncedAt||'none';
        }
      } catch(e){ r.appdataError = e.message; }
      // Check users
      try {
        const snap2 = await fn.getDoc(fn.doc(window._fbDB,'users',r.uid));
        r.usersDocExists = snap2.exists();
        if(snap2.exists()) r.usersDoc = snap2.data();
      } catch(e){ r.usersError = e.message; }
    }
    if(DB.currentUser?.email && window._fbFn){
      try {
        const ek = DB.currentUser.email.replace(/[.]/g,'_');
        const snap3 = await window._fbFn.getDoc(window._fbFn.doc(window._fbDB,'users_by_email',ek));
        r.usersByEmailExists = snap3.exists();
        if(snap3.exists()) r.usersByEmail = snap3.data();
      } catch(e){ r.usersByEmailError = e.message; }
    }
  } catch(e){ r.error = e.message; }
  console.table(r);
  return r;
}
// 自動診断: ログイン後5秒で実行
function _autodiag(){
  setTimeout(async ()=>{
    if(!DB.currentUser) return;
    const r = await _fbDiag();
    if(!r.appdataExists && r.uid){
      try {
        await _syncToFirestore();
        toast('☁️ データをクラウドに同期しました','s');
      } catch(e){ console.error('[DIAG] 手動同期失敗:', e); }
    } else if(r.appdataExists){
    }
  }, 5000);
}
window._fbDiag = _fbDiag;

function saveDB() {
  if(window._demoMode) return;
  try {
    const data = {};
    PERSIST_FIELDS.forEach(k => { data[k] = DB[k]; });
    const json = JSON.stringify(data);
    if(json.length > 900000 && !window._dbSizeWarned){
      window._dbSizeWarned = true;
      if(DB.currentUser?.role==='admin') toast('データサイズが上限に接近しています','w');
    }
    localStorage.setItem(STORAGE_KEY, json);
    // Integrity hash for tamper detection
    _setIntegrityHash(json);
  } catch(e) {
    if(e.name==='QuotaExceededError') toast('ストレージ容量不足です','e');
  }
  // 同一端末の他タブに通知（BroadcastChannel）
  try { if(typeof broadcastDBUpdate==='function') broadcastDBUpdate(); } catch(e){}
  // ローカル変更フラグをON（onSnapshotからの上書きを一時防止）
  _localDirty = true;
  if(_dirtyTimer) clearTimeout(_dirtyTimer);
  _dirtyTimer = setTimeout(() => { _localDirty = false; _dirtyTimer = null; }, 5000);
  // Firestore sync（絶対に到達させる）
  // _justLoadedFromFirestore: 初回は少し遅延して同期（write-back loop防止）
  if(window._justLoadedFromFirestore){
    window._justLoadedFromFirestore = false;
    setTimeout(() => { _debouncedFirestoreSync(); }, 1500);
    return;
  }
  // _suppressSync中でも遅延同期をキュー（絶対にデータを失わない）
  if(window._suppressSync){
    setTimeout(() => { if(_localDirty) { _debouncedFirestoreSync(); } }, 1500);
    return;
  }
  if(!window._fbInitialSyncDone){
    _syncToFirestore().then(()=>{
      window._fbInitialSyncDone = true;
    }).catch(()=>{});
  } else {
    _debouncedFirestoreSync();
  }
}

var _fsTimer = null;
var _fbUidCache = null;
var _suppressSnapshot = false; // onSnapshotコールバック抑制フラグ
var _lastSyncedAt = ''; // 最後に自分が同期したタイムスタンプ
var _localDirty = false; // ローカルに未同期の変更がある
var _sessionId = 'ses_' + Date.now() + '_' + Math.random().toString(36).slice(2,8); // セッション固有ID
var _dirtyTimer = null; // dirty自動解除タイマー
 // Firebase UID cache
function _debouncedFirestoreSync(){
  if(window._demoMode) return; // デモモードではFirestore同期をスキップ
  if(_fsTimer) clearTimeout(_fsTimer);
  _fsTimer = setTimeout(_syncToFirestore, 800);
}

// FIX: プロフィール保存など重要操作用の即時同期
function saveDBAndSync() {
  saveDB();
  // 即座にFirestore同期を実行（デバウンスなし）
  if(!window._demoMode && window._fbReady) {
    if(_fsTimer) clearTimeout(_fsTimer);
    _syncToFirestore().catch(function(e){ });
  }
}
var _lastSyncTime = 0;
var _syncDebounceTimer = null;
async function _syncToFirestore(){
  if(window._demoMode) return;
  // Rate limit: max 1 sync per 3 seconds
  var now = Date.now();
  if(now - _lastSyncTime < 3000) {
    if(_syncDebounceTimer) clearTimeout(_syncDebounceTimer);
    _syncDebounceTimer = setTimeout(function(){ _syncToFirestore(); }, 3000);
    return;
  }
  _lastSyncTime = now;
  try {
    if(!window._fbReady) return;
    const uid = window._fbAuth?.currentUser?.uid || _fbUidCache;
    if(!uid) return;
    _showSyncStatus('syncing');
    const fn = window._fbFn;
    const _stripPhotos = (arr) => {
      if(!Array.isArray(arr)) return arr;
      return arr.map(item => {
        if(!item || typeof item !== 'object') return item;
        const clean = {...item};
        if(clean.photo && clean.photo.length > 500) clean.photo = '';
        if(clean.avatar && clean.avatar.length > 500) clean.avatar = '';
        if(clean.logo && clean.logo.length > 500) clean.logo = '';
        return clean;
      });
    };
    // ── 共有データ → appdata/shared ──
    // 選手の食事データを共有フィールドに同期
    if(typeof _syncPlayerMealsToShared === 'function') _syncPlayerMealsToShared();
    const shared = {};
    SHARED_FIELDS.forEach(k => { if(DB[k] !== undefined) shared[k] = DB[k]; });
    if(shared.coaches) shared.coaches = _stripPhotos(shared.coaches);
    if(shared.teams) shared.teams = _stripPhotos(shared.teams);
    if(shared.players) shared.players = _stripPhotos(shared.players);
    // 大量データの日付トリミング（Firestoreの1MBドキュメント制限対策）
    const _trimDays = 60; // 直近60日分のみ同期
    const _cutoff = new Date(Date.now() - _trimDays*86400000).toISOString().slice(0,10);
    ['trainingLog','conditionLog','bodyLog','playerMealHistory'].forEach(fk => {
      if(shared[fk] && typeof shared[fk] === 'object'){
        const trimmed = {};
        Object.keys(shared[fk]).forEach(pid => {
          if(typeof shared[fk][pid] === 'object' && !Array.isArray(shared[fk][pid])){
            const pData = {};
            Object.keys(shared[fk][pid]).forEach(dk => { if(dk >= _cutoff) pData[dk] = shared[fk][pid][dk]; });
            if(Object.keys(pData).length > 0) trimmed[pid] = pData;
          } else {
            trimmed[pid] = shared[fk][pid];
          }
        });
        shared[fk] = trimmed;
      }
    });
    shared._syncedAt = new Date().toISOString();
    shared._syncedBy = _sessionId;
    shared._dataVersion = window._currentDataVersion || 'prod_v5_launch';
    // チャットメッセージのトリミング（Firestoreサイズ制限対策）
    if(shared.chats && typeof shared.chats === 'object'){
      const _maxMsgsPerRoom = 200; // 各ルーム最新200件のみ同期
      Object.keys(shared.chats).forEach(rk => {
        const room = shared.chats[rk];
        if(room && Array.isArray(room.msgs)){
          // 古いメッセージを切り捨て
          if(room.msgs.length > _maxMsgsPerRoom){
            room.msgs = room.msgs.slice(-_maxMsgsPerRoom);
          }
          // 画像データをストリップ（容量削減）
          room.msgs = room.msgs.map(m => {
            if(m.img && m.img.length > 500) return {...m, img: '[image]'};
            return m;
          });
        }
      });
    }
    _suppressSnapshot = true;
    _lastSyncedAt = shared._syncedAt;
    await fn.setDoc(fn.doc(window._fbDB, 'appdata', 'shared'), shared, {merge:true});
    setTimeout(() => { _suppressSnapshot = false; }, 500);
    _localDirty = false; // 同期完了 → dirty解除
    if(_dirtyTimer){ clearTimeout(_dirtyTimer); _dirtyTimer = null; }
    // ── 個人データ → appdata/{uid} ──
    const priv = {};
    PRIVATE_FIELDS.forEach(k => { if(k!=='currentUser' && DB[k] !== undefined) priv[k] = DB[k]; });
    priv._syncedAt = shared._syncedAt;
    await fn.setDoc(fn.doc(window._fbDB, 'appdata', uid), priv, {merge:true});
    _showSyncStatus('synced');
  } catch(e) {
    if(!window._syncRetried){
      window._syncRetried = true;
      setTimeout(() => { window._syncRetried = false; _syncToFirestore(); }, 5000);
    }
    _showSyncStatus('error');
  }
}

// ── チャット リアルタイム同期 ──
var _chatListeners = {};

function _startChatListener(roomKey){
  _startTypingListener(roomKey);
  if(_chatListeners[roomKey]) return;
  if(!window._fbReady || !window._fbAuth?.currentUser) return;
  const fn = window._fbFn;
  const uid = window._fbAuth.currentUser.uid;
  const chatRef = fn.collection(window._fbDB, 'chats', roomKey, 'messages');
  const q = fn.query(chatRef, fn.orderBy('timestamp','asc'));
  let isInitialLoad = true;
  _chatListeners[roomKey] = fn.onSnapshot(q, (snapshot) => {
    if(!snapshot) return;
    const ch = DB.chats[roomKey];
    if(!ch){ if(!ch) DB.chats[roomKey] = {msgs:[], unread:0}; }
    const chatData = DB.chats[roomKey];
    if(!chatData.msgs) chatData.msgs = [];
    let hasNew = false;
    const myKey = getMyKey();
    snapshot.docChanges().forEach(change => {
      if(change.type === 'added'){
        const d = change.doc.data();
        // mid（メッセージID）またはFirestore doc IDで重複チェック
        const isDup = chatData.msgs.some(m => 
          (m.mid && d.mid && m.mid === d.mid) || 
          (m._fid && m._fid === change.doc.id)
        );
        if(!isDup){
          chatData.msgs.push({
            _fid: change.doc.id,
            mid: d.mid || change.doc.id,
            from: d.from||'', name: d.name||'', text: d.text||'',
            time: d.time||'', date: d.date||'', read: d.read||false,
            img: d.img||null, file: d.file||null, voice: d.voice||null,
            replyTo: d.replyTo!=null ? d.replyTo : undefined,
            isWarning: d.isWarning, isSuspension: d.isSuspension
          });
          hasNew = true;
          // 他ユーザーからの新着 → 未読カウント増加 + 通知音
          if(!isInitialLoad && d.from !== myKey && d.senderUid !== uid){
            chatData.unread = (chatData.unread||0) + 1;
            _playChatSound();
            // プッシュ通知
            if(typeof _sendPushNotification === 'function' && 
               (typeof activeRoom === 'undefined' || activeRoom !== roomKey || document.visibilityState === 'hidden')){
              _sendPushNotification('💬 ' + (d.name||'メッセージ'), (d.text||'').substring(0,50));
            }
          }
        }
      }
    });
    isInitialLoad = false;
    if(hasNew){
      // アクティブルームなら再描画
      if(typeof activeRoom !== 'undefined' && activeRoom === roomKey){
        const roomEl = document.querySelector('.chat-right');
        if(roomEl){
          roomEl.innerHTML = renderRoom(roomKey, DB.currentUser?.id);
          _scrollChatBottom();
        }
        // 既読マーク
        chatData.msgs.forEach(m => { if(m.from !== myKey) m.read = true; });
        chatData.unread = 0;
      }
      // チャットリスト更新
      _updateChatList();
      updateNotifBadge();
    }
  }, (err) => { });
}

function _stopChatListener(roomKey){
  if(_chatListeners[roomKey]){
    _chatListeners[roomKey](); // unsubscribe
    delete _chatListeners[roomKey];
  }
}

// ── リアルタイムリスナー（onSnapshot）──
// ── チャットメッセージ用ユニークID生成 ──
function _genMsgId(){
  return 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2,6);
}

// ── 汎用Array型フィールドのマージ（IDベース重複排除） ──
// id付きレコード: IDで重複排除、updatedAtがあれば新しい方を採用
// id無しレコード: 内容ハッシュで重複排除（ログ系データ用）
function _mergeArrayField(localArr, remoteArr){
  if(!Array.isArray(remoteArr)) return localArr || [];
  if(!Array.isArray(localArr) || localArr.length === 0) return remoteArr;
  if(remoteArr.length === 0) return []; // リモートが空 = 全削除 → 空を返す
  // id付きか判定
  const hasId = (localArr[0]?.id || remoteArr[0]?.id);
  if(hasId){
    // リモートを正（ソースオブトゥルース）として使用
    // リモートにあるIDのみ残す + ローカルのみにある新規(未同期)アイテムも追加
    const remoteIds = new Set(remoteArr.map(function(x){return x?.id}).filter(Boolean));
    const byId = {};
    // まずリモートを全て採用
    remoteArr.forEach(function(item){ if(item?.id) byId[item.id] = item; });
    // ローカルのみ(未同期の新規追加)があればマージ
    localArr.forEach(function(item){
      if(!item?.id) return;
      if(!remoteIds.has(item.id)){
        // ローカルにのみ存在 = 新規追加 or 他端末で削除済み
        // createdAtが直近60秒以内なら新規追加と判断して残す
        var created = item.createdAt ? new Date(item.createdAt).getTime() : 0;
        var now = Date.now();
        if(created && (now - created) < 60000){
          byId[item.id] = item; // 新規追加（未同期）
        }
        // それ以外は他端末で削除された → 含めない
      }
    });
    return Object.values(byId);
  }
  // IDなしの場合はリモートで上書き
  return remoteArr;
}

// マージが必要なArray型共有フィールド一覧
const ARRAY_MERGE_FIELDS = [
  'coaches','teams','players','payments','coachPay','payThreads',
  'requests','disclosures','events','teamMatches','teamEvents',
  'teamReviews','adhocInvoices','announcements','inventory',
  'teamFiles','notifs','moderationLog','emailLog','consentLog','auditLog','alumni'
];

// ── 全SHARED_FIELDSの安全なマージ ──
function _mergeSharedData(sd){
  SHARED_FIELDS.forEach(k => {
    if(sd[k] === undefined) return;
    // chats → 専用マージ
    if(k === 'chats'){ DB.chats = _mergeChatsData(DB.chats, sd[k]); return; }
    // 日付キーObject → ディープマージ
    if(['trainingLog','conditionLog','bodyLog','injuryHistory','playerMealHistory'].includes(k)){
      if(typeof sd[k] === 'object' && !Array.isArray(sd[k])){
        if(!DB[k] || typeof DB[k] !== 'object') DB[k] = {};
        Object.keys(sd[k]).forEach(pid => {
          if(typeof sd[k][pid] === 'object' && !Array.isArray(sd[k][pid]) && typeof DB[k][pid] === 'object' && !Array.isArray(DB[k][pid])){
            Object.keys(sd[k][pid]).forEach(dk => {
              var remote = sd[k][pid][dk];
              var local = DB[k][pid]?.[dk];
              if(!local || (remote?.updatedAt && (!local?.updatedAt || remote.updatedAt > local.updatedAt))){
                if(!DB[k][pid]) DB[k][pid] = {};
                DB[k][pid][dk] = remote;
              }
            });
          } else {
            DB[k][pid] = sd[k][pid];
          }
        });
        return;
      }
    }
    // Array型 → IDベースマージ
    if(ARRAY_MERGE_FIELDS.includes(k) && Array.isArray(sd[k])){
      DB[k] = _mergeArrayField(DB[k], sd[k]);
      return;
    }
    // Object型（teamFeeRates, userWarnings, suspendedUsers等）→ キーマージ
    if(typeof sd[k] === 'object' && !Array.isArray(sd[k])){
      if(!DB[k] || typeof DB[k] !== 'object') DB[k] = {};
      Object.keys(sd[k]).forEach(key => { DB[k][key] = sd[k][key]; });
      return;
    }
    // その他 → 上書き
    DB[k] = sd[k];
  });
}
// ── チャットデータの安全なマージ（メッセージを失わない） ──
function _mergeChatsData(localChats, remoteChats){
  if(!remoteChats || typeof remoteChats !== 'object') return localChats || {};
  if(!localChats || typeof localChats !== 'object') return remoteChats;
  const merged = {...localChats};
  Object.keys(remoteChats).forEach(roomKey => {
    const remote = remoteChats[roomKey];
    if(!remote || typeof remote !== 'object') return;
    if(!merged[roomKey]){
      // ローカルにないルーム → そのまま追加
      merged[roomKey] = remote;
      return;
    }
    const local = merged[roomKey];
    // メタデータはリモート優先で更新
    if(remote.name) local.name = remote.name;
    if(remote.sub !== undefined) local.sub = remote.sub;
    if(remote.avi !== undefined) local.avi = remote.avi;
    // msgs配列をマージ（重複排除・メッセージを絶対に失わない）
    const localMsgs = Array.isArray(local.msgs) ? local.msgs : [];
    const remoteMsgs = Array.isArray(remote.msgs) ? remote.msgs : [];
    // メッセージの一意キーを生成
    const _msgKey = (m) => {
      if(m.mid) return m.mid;  // IDがあればそれを使う
      if(m._fid) return '_f:' + m._fid;
      // フォールバック: from+time+textの先頭30文字
      return (m.from||'')+'|'+(m.date||m.time||'')+'|'+(m.text||'').slice(0,30);
    };
    const seen = new Set();
    const allMsgs = [];
    // ローカルメッセージを先に追加
    localMsgs.forEach(m => {
      const key = _msgKey(m);
      if(!seen.has(key)){ seen.add(key); allMsgs.push(m); }
    });
    // リモートメッセージで新しいものを追加
    remoteMsgs.forEach(m => {
      const key = _msgKey(m);
      if(!seen.has(key)){ seen.add(key); allMsgs.push(m); }
    });
    local.msgs = allMsgs;
    // unreadは大きい方を採用
    if((remote.unread||0) > (local.unread||0)) local.unread = remote.unread;
    merged[roomKey] = local;
  });
  return merged;
}

var _sharedUnsub = null;
function _startSharedListener(){
  if(_sharedUnsub) return; // 既にリスナーあり
  if(!window._fbReady || !window._fbFn) return;
  // Firebase Auth が未完了の場合はリトライ（最大60秒）
  if(!window._fbAuth?.currentUser){
    if(!window._sharedRetryCount) window._sharedRetryCount = 0;
    window._sharedRetryCount++;
    if(window._sharedRetryCount <= 30){
      setTimeout(_startSharedListener, 2000);
    } else {
      // ポーリングフォールバック：10秒ごとにFirestoreから手動読込
      if(!window._pollingFallback){
        window._pollingFallback = setInterval(async function(){
          if(window._fbAuth?.currentUser){
            // Auth復活 → リスナーに切替
            clearInterval(window._pollingFallback);
            window._pollingFallback = null;
            window._sharedRetryCount = 0;
            _startSharedListener();
            return;
          }
          // Auth無しでもローカルデータは保持
        }, 10000);
      }
    }
    return;
  }
  window._sharedRetryCount = 0;
  const fn = window._fbFn;
  _sharedUnsub = fn.onSnapshot(fn.doc(window._fbDB, 'appdata', 'shared'), (snap) => {
    if(!snap.exists()) return;
    if(_suppressSnapshot) return; // 自分の書き込み中はスキップ
    const sd = snap.data();
    const remoteTime = sd._syncedAt || '';
    const syncedBySession = sd._syncedBy || '';
    // 同一セッションからの更新はスキップ（ループ防止）
    if(syncedBySession === _sessionId) return;
    if(remoteTime === _lastSyncedAt) return;
    if(!remoteTime) return;
    // _localDirtyでもタイムスタンプが新しければ受け入れ（他ユーザーの更新を逃さない）
    if(_localDirty && remoteTime <= (DB._syncedAt || '')) return;
    // 他のデバイス/ユーザーからの更新 → 全フィールド安全マージ
    _mergeSharedData(sd);
    DB._syncedAt = remoteTime;
    // localStorageにキャッシュ（saveDBは呼ばない！ループ防止）
    try {
      const cache = {};
      PERSIST_FIELDS.forEach(k => { cache[k] = DB[k]; });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
    } catch(e){}
    // 画面を再描画（ただしsaveDBはトリガーしない）
    _refreshCurrentPage();
    // 同期バッジ表示
    _showSyncBadge();
  }, (err) => { });
}
// 同期受信バッジ
function _showSyncBadge(){
  var badge = document.getElementById('sync-badge');
  if(!badge){
    badge = document.createElement('div');
    badge.id = 'sync-badge';
    badge.style.cssText = 'position:fixed;top:8px;right:8px;z-index:99999;background:var(--teal);color:#fff;font-size:10px;font-weight:700;padding:4px 10px;border-radius:12px;opacity:0;transition:opacity .3s;pointer-events:none';
    if(document.body) document.body.appendChild(badge);
  }
  badge.textContent = '☁️ 同期完了';
  badge.style.opacity = '1';
  setTimeout(() => { badge.style.opacity = '0'; }, 2000);
}
async function _clearFirestoreShared(){
  // 共有データの削除は危険なため無効化（全ユーザーのデータが消える）
}
function _stopSharedListener(){
  if(_sharedUnsub){ _sharedUnsub(); _sharedUnsub = null; }
}

// ── 個人データ リアルタイムリスナー（同一ユーザー・別デバイス間同期） ──
var _privateUnsub = null;
function _startPrivateListener(){
  if(_privateUnsub) return;
  if(!window._fbReady || !window._fbFn) return;
  const uid = window._fbAuth?.currentUser?.uid || _fbUidCache;
  if(!uid){
    // Firebase Auth未完了 → リトライ
    setTimeout(_startPrivateListener, 2000);
    return;
  }
  const fn = window._fbFn;
  _privateUnsub = fn.onSnapshot(fn.doc(window._fbDB, 'appdata', uid), (snap) => {
    if(!snap.exists()) return;
    if(_suppressSnapshot) return;
    const pd = snap.data();
    const remoteTime = pd._syncedAt || '';
    // 自分の同期はスキップ
    if(remoteTime === _lastSyncedAt) return;
    if(!remoteTime) return;
    // 個人データをマージ
    let updated = false;
    PRIVATE_FIELDS.forEach(k => {
      if(k === 'currentUser') return;
      if(pd[k] === undefined) return;
      // Array型(myFoods, customWorkouts等) → IDベースマージ
      if(Array.isArray(pd[k]) && Array.isArray(DB[k]) && DB[k].length > 0){
        DB[k] = _mergeArrayField(DB[k], pd[k]);
      }
      // Object型(meals, mealHistory, settings等) → キーマージ
      else if(typeof pd[k] === 'object' && !Array.isArray(pd[k]) && typeof DB[k] === 'object' && !Array.isArray(DB[k])){
        Object.keys(pd[k]).forEach(dk => { DB[k][dk] = pd[k][dk]; });
      } else {
        DB[k] = pd[k];
      }
      updated = true;
    });
    if(updated){
      try { const c={}; PERSIST_FIELDS.forEach(k=>{c[k]=DB[k];}); localStorage.setItem(STORAGE_KEY,JSON.stringify(c)); } catch(e){}
      _refreshCurrentPage();
    }
  }, (err) => { });
}
function _stopPrivateListener(){
  if(_privateUnsub){ _privateUnsub(); _privateUnsub = null; }
}

// ── 接続状態監視 & 自動再接続 ──
var _heartbeatTimer = null;
function _startSyncHeartbeat(){
  if(_heartbeatTimer) return;
  _heartbeatTimer = setInterval(async () => {
    if(!DB.currentUser || !window._fbReady) return;
    // リスナーが切れていたら再開
    if(!_sharedUnsub){
      _startSharedListener();
    }
    const uid = window._fbAuth?.currentUser?.uid || _fbUidCache;
    if(uid && !_privateUnsub){
      _startPrivateListener();
    }
    // 未同期のローカル変更があればプッシュ
    if(_localDirty && uid){
      try { await _syncToFirestore(); } catch(e){}
    }
  }, 15000); // 15秒間隔でリスナー確認 + 未同期プッシュ
}
function _stopSyncHeartbeat(){
  if(_heartbeatTimer){ clearInterval(_heartbeatTimer); _heartbeatTimer = null; }
}

// ============================================================
// ★ データ常時最新化システム
// ============================================================

// ── 1. タブ復帰時にFirestoreから最新データを自動取得 ──
var _lastVisibilitySync = 0;
document.addEventListener('visibilitychange', async function(){
  if(document.visibilityState !== 'visible') return;
  if(!DB.currentUser || !window._fbReady) return;
  // 最低10秒間隔（連続切替対策）
  const now = Date.now();
  if(now - _lastVisibilitySync < 10000) return;
  _lastVisibilitySync = now;
  await _forceRefreshFromFirestore();
});

// ── 1.5. ウィンドウフォーカス復帰時にFirestoreリフレッシュ ──
var _lastFocusSync = 0;
window.addEventListener('focus', async function(){
  if(!DB.currentUser || !window._fbReady) return;
  const now = Date.now();
  if(now - _lastFocusSync < 15000) return; // 15秒間隔
  _lastFocusSync = now;
  try { await _forceRefreshFromFirestore(); } catch(e){}
});

// ── 2. ネットワーク復帰時に自動同期 ──
window.addEventListener('online', async function(){
  if(!DB.currentUser || !window._fbReady) return;
  _showSyncStatus('syncing');
  try {
    // まずローカル未同期データをプッシュ
    if(_localDirty) await _syncToFirestore();
    // 次にFirestoreから最新データを取得
    await _forceRefreshFromFirestore();
  } catch(e) {
  }
});

// ── 3. Firestoreから強制再読込（メイン関数）──
async function _forceRefreshFromFirestore(){
  if(!window._fbReady || !window._fbFn) return;
  const uid = window._fbAuth?.currentUser?.uid || _fbUidCache;
  if(!uid) return;
  
  _showSyncStatus('syncing');
  try {
    const fn = window._fbFn;
    let updated = false;
    
    // 共有データ読込
    const sharedSnap = await fn.getDoc(fn.doc(window._fbDB, 'appdata', 'shared'));
    if(sharedSnap.exists()){
      const sd = sharedSnap.data();
      const remoteTime = sd._syncedAt || '';
      // リモートが新しければマージ
      if(remoteTime && remoteTime > (DB._syncedAt || '')){
        _mergeSharedData(sd);
        DB._syncedAt = remoteTime;
        updated = true;
      }
    }
    
    // 個人データ読込
    const privSnap = await fn.getDoc(fn.doc(window._fbDB, 'appdata', uid));
    if(privSnap.exists()){
      const pd = privSnap.data();
      PRIVATE_FIELDS.forEach(k => {
        if(k === 'currentUser' || pd[k] === undefined) return;
        if(Array.isArray(pd[k]) && Array.isArray(DB[k]) && DB[k].length > 0){
          DB[k] = _mergeArrayField(DB[k], pd[k]);
        } else if(typeof pd[k]==='object' && !Array.isArray(pd[k]) && typeof DB[k]==='object' && !Array.isArray(DB[k]) && Object.keys(DB[k]).length>0){
          Object.keys(pd[k]).forEach(dk => { DB[k][dk] = pd[k][dk]; });
        } else {
          DB[k] = pd[k];
        }
      });
      updated = true;
    }
    
    if(updated){
      // localStorageキャッシュ更新（saveDBは呼ばない→ループ防止）
      try {
        const cache = {};
        PERSIST_FIELDS.forEach(k => { cache[k] = DB[k]; });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
      } catch(e){}
      // 画面を再描画
      _refreshCurrentPage();
    }
    _showSyncStatus('synced');
  } catch(e){
    _showSyncStatus('error');
  }
}

// ── 4. 手動同期ボタン ──
function manualSync(){
  if(!DB.currentUser){toast('ログインしてください','e');return;}
  toast('🔄 データを同期中...','i');
  _forceRefreshFromFirestore().then(()=>{
    toast('✅ 最新データに更新しました','s');
  }).catch(()=>{
    toast('⚠️ 同期に失敗しました。ネットワークを確認してください。','e');
  });
}

// ── 5. 同期ステータス表示 ──
function _showSyncStatus(status){
  let el = document.getElementById('sync-status-badge');
  if(!el){
    el = document.createElement('div');
    el.id = 'sync-status-badge';
    el.style.cssText = 'position:fixed;top:6px;right:60px;z-index:999;font-size:10px;padding:3px 8px;border-radius:12px;pointer-events:none;transition:opacity .3s;opacity:0';
    document.body.appendChild(el);
  }
  if(status === 'syncing'){
    el.textContent = '🔄 同期中...';
    el.style.background = 'rgba(14,165,233,.15)';
    el.style.color = '#0ea5e9';
    el.style.opacity = '1';
  } else if(status === 'synced'){
    el.textContent = '✅ 同期完了';
    el.style.background = 'rgba(0,207,170,.15)';
    el.style.color = '#00cfaa';
    el.style.opacity = '1';
    setTimeout(()=>{ el.style.opacity = '0'; }, 2000);
  } else if(status === 'error'){
    el.textContent = '⚠️ 同期失敗';
    el.style.background = 'rgba(239,68,68,.15)';
    el.style.color = '#ef4444';
    el.style.opacity = '1';
    setTimeout(()=>{ el.style.opacity = '0'; }, 3000);
  } else {
    el.style.opacity = '0';
  }
}

// ── 6. リスナー切断検知・自動復帰 ──
var _listenerCheckTimer = null;
function _startListenerWatchdog(){
  if(_listenerCheckTimer) return;
  _listenerCheckTimer = setInterval(function(){
    if(!DB.currentUser || !window._fbReady) return;
    if(!_sharedUnsub){ _startSharedListener(); }
    var uid = window._fbAuth?.currentUser?.uid || _fbUidCache;
    if(uid && !_privateUnsub){ _startPrivateListener(); }
  }, 20000);
}

// ── Firebase Auth復旧メカニズム ──
var _authRecoveryTimer = null;
function _startFirebaseAuthRecovery(email, pw){
  if(_authRecoveryTimer) return;
  var attempts = 0;
  var maxAttempts = 10;
  // 同期ステータス表示
  _showSyncStatus('offline');
  toast('⚠️ クラウド同期に接続中...','w');
  
  _authRecoveryTimer = setInterval(async function(){
    attempts++;
    if(attempts > maxAttempts || window._fbAuth?.currentUser){
      clearInterval(_authRecoveryTimer);
      _authRecoveryTimer = null;
      if(window._fbAuth?.currentUser){
        window._fbAuthFailed = false;
        _showSyncStatus('synced');
        toast('✅ クラウド同期が復旧しました','s');
        _startAllListeners();
        try { await _syncToFirestore(); } catch(e){}
        try { await _forceRefreshFromFirestore(); } catch(e){}
      } else {
        _showSyncStatus('offline');
        _showOfflineBanner();
      }
      return;
    }
    try {
      if(!email || !pw) return;
      var cred = await window._fbFn.signInWithEmailAndPassword(window._fbAuth, email, pw);
      _fbUidCache = cred.user.uid;
      clearInterval(_authRecoveryTimer);
      _authRecoveryTimer = null;
      window._fbAuthFailed = false;
      _showSyncStatus('synced');
      toast('✅ クラウド同期が復旧しました','s');
      _startAllListeners();
      await _loadFromFirestore(cred.user.uid);
      await _syncToFirestore();
    } catch(e){
    }
  }, 5000); // 5秒ごとにリトライ
}

function _showOfflineBanner(){
  var existing = document.getElementById('offline-sync-banner');
  if(existing) return;
  var banner = document.createElement('div');
  banner.id = 'offline-sync-banner';
  banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;background:#ef4444;color:#fff;text-align:center;padding:8px 16px;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:8px';
  banner.innerHTML = '⚠️ クラウド同期に接続できていません。データはこの端末のみに保存されます。 <button onclick="location.reload()" style="background:#fff;color:#ef4444;border:none;border-radius:6px;padding:4px 12px;font-size:11px;font-weight:700;cursor:pointer">再接続</button>';
  document.body.appendChild(banner);
}

// launchApp後のAuth確認（5秒後に自動チェック）
function _checkAuthAfterLaunch(){
  if(window._demoMode) return; // デモモードではAuth確認をスキップ
  if(!window._fbAuth?.currentUser){
    if(!window._fbAuthFailed){
      // onAuthStateChangedで自動復元を待つ（最大10秒）
      var waitCount = 0;
      var waitTimer = setInterval(function(){
        waitCount++;
        if(window._fbAuth?.currentUser){
          clearInterval(waitTimer);
          _startAllListeners();
          _forceRefreshFromFirestore();
          _showSyncStatus('synced');
          var banner = document.getElementById('offline-sync-banner');
          if(banner) banner.remove();
        } else if(waitCount >= 10){
          clearInterval(waitTimer);
          _showOfflineBanner();
        }
      }, 1000);
    }
  }
}

// ── 全リスナー一括開始/停止 ──
function _startAllListeners(){
  if(window._demoMode) return; // デモモードではリスナーをスキップ
  _startSharedListener();
  _startPrivateListener();
  _startSyncHeartbeat();
}
function _stopAllListeners(){
  _stopSharedListener();
  _stopPrivateListener();
  _stopSyncHeartbeat();
  _stopAllChatListeners();
}
var _lastRefreshTime = 0;
function _refreshCurrentPage(){
  try {
    // 最低2秒間隔で再描画（高速ループ防止）
    const now = Date.now();
    if(now - _lastRefreshTime < 2000) return;
    _lastRefreshTime = now;
    if(window._isRefreshing) return;
    window._isRefreshing = true;
    // 通知バッジは常に更新
    updateNotifBadge();
    // 現在のページを特定
    const curP = typeof curPage !== 'undefined' ? curPage : null;
    if(curP){
      // 設定ページはフォーム入力中の可能性があるため再描画しない
      if(curP === 'profile-settings') {
        window._isRefreshing = false;
        return;
      }
      // チャットページ: アクティブルームのメッセージも更新
      if(curP === 'chat') {
        try {
          // サイドバーのunreadバッジ更新
          var chatLeft = document.querySelector('.chat-left');
          if(chatLeft){
            chatLeft.querySelectorAll('.room-item,.chat-room').forEach(el => {
              var rk = el.getAttribute('data-room') || el.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
              if(rk && DB.chats[rk]){
                var unread = DB.chats[rk].unread || 0;
                var badge = el.querySelector('.room-badge,.unread-badge');
                if(badge) badge.textContent = unread > 0 ? unread : '';
              }
            });
          }
          // アクティブルームのメッセージリストを再描画（入力中テキストを保護）
          if(typeof activeRoom !== 'undefined' && activeRoom && DB.chats[activeRoom]){
            var chatRight = document.getElementById('chat-right');
            if(chatRight && typeof renderRoom === 'function'){
              // 入力中テキストを退避
              var inp = document.getElementById('chat-inp');
              var savedText = inp ? inp.value : '';
              var savedCursor = inp ? inp.selectionStart : 0;
              // 再描画
              var myKey = typeof getMyKey === 'function' ? getMyKey() : (DB.currentUser?.id || '');
              chatRight.innerHTML = renderRoom(activeRoom, myKey);
              // 入力中テキストを復元
              if(savedText){
                var newInp = document.getElementById('chat-inp');
                if(newInp){ newInp.value = savedText; newInp.selectionStart = newInp.selectionEnd = savedCursor; }
              }
              _scrollChatBottom();
            }
          }
        } catch(e){}
        window._isRefreshing = false;
        return;
      }
      window._suppressSync = true;
      goTo(curP);
      setTimeout(() => { window._suppressSync = false; }, 1000);
    }
    window._isRefreshing = false;
  } catch(e){ window._isRefreshing = false; }
}
// 後方互換: ポーリング関数はリスナー開始にリダイレクト
async function _pollFirestoreUpdates(){
  _startAllListeners();
}

function _stopAllChatListeners(){
  Object.keys(_chatListeners).forEach(k => _stopChatListener(k));
}

// チャットメッセージをFirestoreに送信
async function _sendChatToFirestore(roomKey, msg){
  if(!window._fbReady || !window._fbAuth?.currentUser) return;
  try {
    const fn = window._fbFn;
    const chatRef = fn.collection(window._fbDB, 'chats', roomKey, 'messages');
    await fn.addDoc(chatRef, {
      mid: msg.mid || '',
      from: msg.from || '',
      name: msg.name || '',
      text: msg.text || '',
      time: msg.time || '',
      date: msg.date || '',
      read: msg.read || false,
      img: msg.img || null,
      file: msg.file || null,
      voice: msg.voice || null,
      replyTo: msg.replyTo != null ? msg.replyTo : null,
      timestamp: fn.serverTimestamp(),
      senderUid: window._fbAuth.currentUser.uid,
      roomKey: roomKey
    });
  } catch(e){}
}

function _scrollChatBottom(){
  setTimeout(()=>{
    const mc = document.querySelector('.msg-container');
    if(mc) mc.scrollTop = mc.scrollHeight;
  }, 50);
}

// localStorageからDBを復元
// DB配列安全ガード
// ── チャット通知音 ──
function _onChatInput(){
  if(!activeRoom) return;
  _sendTypingIndicator(activeRoom, true);
  if(_typingTimeout) clearTimeout(_typingTimeout);
  _typingTimeout = setTimeout(function(){ _sendTypingIndicator(activeRoom, false); }, 3000);
}

function _playChatSound(){
  try {
    if(DB.settings?.chatSoundEnabled === false) return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine'; osc.frequency.value = 800;
    gain.gain.value = 0.1;
    osc.start(); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.stop(ctx.currentTime + 0.3);
  } catch(e){}
}

// ── チャットリスト更新（ルーム一覧を再描画） ──
function _updateChatList(){
  const listEl = document.querySelector('.chat-left .chat-rooms');
  if(!listEl) return;
  // 最終メッセージ時刻でソート
  const rooms = Object.entries(DB.chats||{}).sort((a,b) => {
    const lastA = a[1].msgs?.length ? a[1].msgs[a[1].msgs.length-1] : null;
    const lastB = b[1].msgs?.length ? b[1].msgs[b[1].msgs.length-1] : null;
    const tA = lastA?.date ? lastA.date + ' ' + (lastA.time||'') : '';
    const tB = lastB?.date ? lastB.date + ' ' + (lastB.time||'') : '';
    return tB > tA ? 1 : -1;
  });
  // 未読バッジだけ更新（全体再描画だとフォーカス失う）
  rooms.forEach(([k, ch]) => {
    const roomEl = document.querySelector('[data-room="'+k+'"] .unread-badge');
    const unread = ch.unread || 0;
    if(roomEl){
      if(unread > 0){ roomEl.textContent = unread > 99 ? '99+' : unread; roomEl.style.display = 'flex'; }
      else { roomEl.style.display = 'none'; }
    }
    // 最終メッセージプレビュー更新
    const previewEl = document.querySelector('[data-room="'+k+'"] .cr-last');
    if(previewEl && ch.msgs?.length){
      const last = ch.msgs[ch.msgs.length-1];
      previewEl.textContent = (last.text||'').substring(0,30);
    }
  });
}

// ── タイピングインジケーター(Firestore経由) ──
var _typingTimeout = null;
function _sendTypingIndicator(roomKey, isTyping){
  if(!window._fbReady || !window._fbAuth?.currentUser) return;
  try {
    const fn = window._fbFn;
    fn.setDoc(fn.doc(window._fbDB, 'chats', roomKey, 'typing', window._fbAuth.currentUser.uid), {
      name: DB.currentUser?.name || '', isTyping: isTyping, updatedAt: Date.now()
    }, {merge:true}).catch(function(){});
  } catch(e){}
}
function _startTypingListener(roomKey){
  if(window._typingUnsub) { try{window._typingUnsub();}catch(e){} }
  if(!window._fbReady || !window._fbAuth?.currentUser) return;
  const fn = window._fbFn;
  const uid = window._fbAuth.currentUser.uid;
  window._typingUnsub = fn.onSnapshot(
    fn.collection(window._fbDB, 'chats', roomKey, 'typing'),
    function(snap){
      const typingUsers = [];
      snap.forEach(function(doc){
        const d = doc.data();
        if(doc.id !== uid && d.isTyping && (Date.now() - (d.updatedAt||0)) < 10000){
          typingUsers.push(d.name || '...');
        }
      });
      const el = document.getElementById('typing-indicator');
      if(el){
        if(typingUsers.length > 0){
          el.innerHTML = '<div class="typing-indicator"><div class="typing-dots"><span></span><span></span><span></span></div><span>'+typingUsers.join(', ')+'が入力中...</span></div>';
          el.style.display = 'block';
        } else {
          el.style.display = 'none';
        }
      }
    }
  );
}

// ── オンライン状態の更新 ──
function _updateOnlinePresence(){
  if(!window._fbReady || !window._fbAuth?.currentUser) return;
  try {
    const fn = window._fbFn;
    fn.setDoc(fn.doc(window._fbDB, 'presence', window._fbAuth.currentUser.uid), {
      name: DB.currentUser?.name || '',
      role: DB.currentUser?.role || '',
      lastSeen: Date.now(),
      online: true
    }, {merge:true}).catch(function(){});
  } catch(e){}
}
// 30秒ごとにオンライン状態を更新
setInterval(function(){ if(DB.currentUser) _updateOnlinePresence(); }, 30000);
// ページ離脱時にオフライン
window.addEventListener('beforeunload', function(){
  if(!window._fbReady || !window._fbAuth?.currentUser) return;
  try {
    const fn = window._fbFn;
    navigator.sendBeacon && fn.setDoc(fn.doc(window._fbDB, 'presence', window._fbAuth.currentUser.uid), {
      online: false, lastSeen: Date.now()
    }, {merge:true}).catch(function(){});
  } catch(e){}
});


function _dbArr(key){if(!DB[key]||!Array.isArray(DB[key]))DB[key]=[];return DB[key];}

