// 07 - アプリコア: loadDB, afterPage, goTo, refreshPage, 通知バッジ, イベント処理
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

function loadDB() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    // Tamper detection
    if(!_verifyIntegrityHash(raw)){
      addAuditLog('data_tamper','localStorageデータの改ざんが検知されました');
    }
    const data = JSON.parse(raw);
    PERSIST_FIELDS.forEach(k => {
      if (data[k] !== undefined) DB[k] = data[k];
    });
    return true;
  } catch(e) { return false; }
}

// Data integrity hash (simple FNV-1a for speed)
function _fnvHash(str) {
  var h = 0x811c9dc5;
  for(var i=0; i<str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h.toString(36);
}
function _setIntegrityHash(json) {
  try { localStorage.setItem('_mc_ih', _fnvHash(json)); } catch(e){}
}
function _verifyIntegrityHash(json) {
  try {
    var stored = localStorage.getItem('_mc_ih');
    if(!stored) return true; // First time, no hash yet
    return stored === _fnvHash(json);
  } catch(e){ return true; }
}

async function _loadFromFirestore(uid){
  try {
    if(!window._fbReady) return false;
    const fn = window._fbFn;
    let loaded = false;
    // ── 共有データを読み込み ──
    const sharedSnap = await fn.getDoc(fn.doc(window._fbDB, 'appdata', 'shared'));
    if(sharedSnap.exists()){
      const sd = sharedSnap.data();
      // データバージョンチェック（不一致でも削除しない、ログで警告のみ）
      const remoteVer = sd._dataVersion || '';
      const localVer = window._currentDataVersion || '';
      if(localVer && remoteVer && remoteVer !== localVer){
      }
      SHARED_FIELDS.forEach(k => {
        if(sd[k] === undefined) return;
        // Firestoreをソースオブトゥルース（正）とする
        // chats → メッセージ保持のため専用マージ
        if(k === 'chats'){ DB.chats = _mergeChatsData(DB.chats||{}, sd[k]); return; }
        // Array型 → Firestoreを正としてマージ（削除反映 + 未同期ローカル新規を保持）
        if(Array.isArray(sd[k]) && ARRAY_MERGE_FIELDS.includes(k)){
          DB[k] = _mergeArrayField(DB[k]||[], sd[k]);
          return;
        }
        // Object型(trainingLog等) → キーマージ（リモート優先）
        if(typeof sd[k] === 'object' && !Array.isArray(sd[k])){
          if(!DB[k] || typeof DB[k] !== 'object' || Array.isArray(DB[k])) DB[k] = {};
          // リモートのキーを全て適用
          Object.keys(sd[k]).forEach(key => { DB[k][key] = sd[k][key]; });
          return;
        }
        // その他 → リモートで上書き
        DB[k] = sd[k];
      });
      DB._syncedAt = sd._syncedAt || '';
      loaded = true;
      window._justLoadedFromFirestore = true; // 即座のwrite-back抑制フラグ
    }
    // ── 個人データを読み込み ──
    const privSnap = await fn.getDoc(fn.doc(window._fbDB, 'appdata', uid));
    if(privSnap.exists()){
      const pd = privSnap.data();
      PRIVATE_FIELDS.forEach(k => {
        if(k==='currentUser' || pd[k] === undefined) return;
        // Array型 → IDベースマージ
        if(Array.isArray(pd[k]) && Array.isArray(DB[k]) && DB[k].length > 0){
          DB[k] = _mergeArrayField(DB[k], pd[k]);
        }
        // Object型 → キーマージ
        else if(typeof pd[k] === 'object' && !Array.isArray(pd[k]) && typeof DB[k] === 'object' && !Array.isArray(DB[k]) && Object.keys(DB[k]).length > 0){
          Object.keys(pd[k]).forEach(dk => { DB[k][dk] = pd[k][dk]; });
        }
        // それ以外 or ローカルが空 → 上書き
        else { DB[k] = pd[k]; }
      });
      loaded = true;
    }
    // localStorageキャッシュ
    if(loaded){
      try {
        const cache = {};
        PERSIST_FIELDS.forEach(k => { cache[k] = DB[k]; });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
      } catch(e){}
    }
    return loaded;
  } catch(e) {
    return false;
  }
}

// データを完全リセット（事務局用・開発用）
function resetAllData() {
  if(DB.currentUser?.role!=='admin'){toast('この操作は事務局のみ実行できます','e');return;}
  if(!confirm('⚠️ 全データを削除します。この操作は取り消せません。\n本当にリセットしますか？')) return;
  // リセット前にSentry/コンソールに記録（リセット後はDB消去のため）
  const resetInfo = {admin:DB.currentUser?.name, coaches:(DB.coaches||[]).length, teams:(DB.teams||[]).length, players:(DB.players||[]).length};
  if(window.Sentry) Sentry.captureMessage('Full data reset by ' + (DB.currentUser?.name||'unknown'), {extra:resetInfo});
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('mycoach_users_v1');
  DB.coaches    = [];
  DB.teams      = [];
  DB.players    = [];
  DB.payments   = [];
  DB.coachPay   = [];
  DB.adhocInvoices = [];
  DB.teamMatches = [];
  DB.inventory = [];
  DB.emailLog = [];
  DB.teamEvents = [];
  DB.teamReviews = [];
  DB.requests = [];
  DB.disclosures = [];
  DB.payThreads = [];
  DB.doneSets = {};
  DB.notifications = [];
  DB.moderationLog = [];
  DB.auditLog = [];
  DB.userWarnings = {};  DB.suspendedUsers = {};
  DB.customWorkouts = [];
  DB.nutritionLog = {};
  DB.teamFiles = [];
  DB.events = [];
  DB.notifs = [];
  DB.announcements = [];
  DB.chats = {};
  DB.conditionLog = {};
  DB.trainingLog = {};
  DB.bodyLog = {};
  DB.injuryHistory = {};
  DB.matchHistory = [];
  DB.mealHistory = {};
  DB.playerMealHistory = {};
  DB.myFoods = [];
  DB.meals = { today: [], water: 0 };
  DB.mealTemplates = [];
  DB.teamFeeRates = {};
  DB.settings = {};
  DB.userWarnings = {};
  DB.suspendedUsers = {};
  DB.chats      = {'g1':{name:'全体連絡',sub:'事務局・全チーム',avi:'📢',msgs:[{mid:_genMsgId(),from:'admin',name:'事務局',text:'データをリセットしました。',time:new Date().toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'}),read:false}],unread:1}};
  DB.currentUser= null;
  try { localStorage.removeItem('mycoach_myteam_db_v1'); } catch(e){}
  // 管理者リセット: ローカルデータのみクリア（共有データは保持）
  try { localStorage.removeItem('mycoach_users_v1'); } catch(e){}
  toast('全データをリセットしました','s');
  location.reload();
}

// ユーザー別データリセット（ログアウト時）
function clearCurrentUserSession() {
  // FIX: Save current user ID before clearing
  var prevUserId = DB.currentUser?.id;
  DB.currentUser = null;
  // Reset in-memory AI history
  if(typeof aiHistory !== 'undefined') aiHistory = [];
  // Clear user-specific meals/nutrition from memory
  if(DB.meals) DB.meals = {today:[], water:0};
  if(DB.mealHistory) DB.mealHistory = {};
  if(DB.nutritionLog) DB.nutritionLog = {};
  if(DB.myFoods) DB.myFoods = [];
  if(DB.settings) DB.settings = {};
  // Save cleaned state to localStorage
  try {
    const data = {};
    PERSIST_FIELDS.forEach(k => { data[k] = DB[k]; });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch(e){}
}

// IDジェネレーター（重複しないユニークID）
function genId(prefix='id') {
  return prefix + '_' + Date.now() + '_' + Math.random().toString(36).slice(2,7);
}

// 数値をカンマ区切りに安全にフォーマット（NaN/null対策）
function fmtNum(n, fallback='0') {
  const v = Number(n);
  return isNaN(v) ? fallback : v.toLocaleString('ja-JP');
}
// 栄養素用フォーマッタ: 見やすい数字表記
function fmtN(n) {
  if (n === null || n === undefined || isNaN(n)) return '0';
  var v = Number(n);
  if (v === 0) return '0';
  if (Number.isInteger(v)) return String(v);
  if (Math.abs(v) >= 10) return String(Math.round(v));
  if (Math.abs(v) >= 1) return String(Math.round(v * 10) / 10);
  return String(Math.round(v * 100) / 100);
}

// 金額表示（¥付き）
function fmtYen(n, fallback='¥0') {
  const v = Number(n);
  return isNaN(v) ? fallback : '¥' + v.toLocaleString('ja-JP');
}

// XSS対策: HTMLエスケープ
function escHtml(s) {
  if(s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#x27;');
}

// 入力値サニタイズ（名前・テキスト系）
// sanitize関数は上部で定義済み

// ── Phase1: 空状態コンポーネント ──
function emptyState(icon, title, desc, ctaText, ctaAction) {
  var html = '<div class="empty-state">';
  html += '<div class="empty-state-icon">' + (icon || '📭') + '</div>';
  html += '<div class="empty-state-title">' + sanitize(title || 'データがありません', 40) + '</div>';
  if (desc) html += '<div class="empty-state-desc">' + sanitize(desc, 100) + '</div>';
  if (ctaText && ctaAction) {
    html += '<button class="btn btn-primary btn-sm" onclick="' + ctaAction + '">' + sanitize(ctaText, 30) + '</button>';
  }
  html += '</div>';
  return html;
}

// ── Phase1: スケルトンローディング ──
function skelKPI(count) {
  var html = '<div class="hero-kpi">';
  for (var i = 0; i < (count || 3); i++) {
    html += '<div class="skel skel-kpi"></div>';
  }
  html += '</div>';
  return html;
}
function skelChart() {
  return '<div class="skel skel-chart" style="margin-bottom:16px"></div>';
}
function skelList(count) {
  var html = '';
  for (var i = 0; i < (count || 4); i++) {
    html += '<div class="skel-row">';
    html += '<div class="skel skel-circle" style="width:38px;height:38px;flex-shrink:0"></div>';
    html += '<div style="flex:1">';
    html += '<div class="skel skel-text w60"></div>';
    html += '<div class="skel skel-text w40" style="height:10px"></div>';
    html += '</div>';
    html += '</div>';
  }
  return html;
}
function skelCard() {
  return '<div class="skel-card" style="margin-bottom:14px"><div class="skel skel-text w80" style="height:18px;margin-bottom:14px"></div><div class="skel skel-text w100" style="height:12px"></div><div class="skel skel-text w60" style="height:12px"></div></div>';
}

// ── Phase1: フォームバリデーション ──
function validateField(inputId, rules) {
  var el = document.getElementById(inputId);
  if (!el) return true;
  var val = (el.value || '').trim();
  var errEl = document.getElementById(inputId + '-err');

  // Clear previous state
  el.classList.remove('is-error', 'is-valid');
  if (errEl) errEl.remove();

  // Run rules
  var error = '';
  if (rules.required && !val) {
    error = rules.requiredMsg || 'この項目は必須です';
  } else if (rules.minLength && val.length < rules.minLength) {
    error = rules.minLength + '文字以上で入力してください';
  } else if (rules.maxLength && val.length > rules.maxLength) {
    error = rules.maxLength + '文字以内で入力してください';
  } else if (rules.pattern && !rules.pattern.test(val)) {
    error = rules.patternMsg || '入力形式が正しくありません';
  } else if (rules.min && Number(val) < rules.min) {
    error = rules.min + '以上の値を入力してください';
  } else if (rules.custom && typeof rules.custom === 'function') {
    error = rules.custom(val) || '';
  }

  if (error) {
    el.classList.add('is-error');
    var errDiv = document.createElement('div');
    errDiv.className = 'field-error';
    errDiv.id = inputId + '-err';
    errDiv.textContent = error;
    el.parentNode.insertBefore(errDiv, el.nextSibling);
    return false;
  } else {
    if (val) el.classList.add('is-valid');
    return true;
  }
}

function validateForm(fieldRules) {
  var allValid = true;
  for (var i = 0; i < fieldRules.length; i++) {
    var ok = validateField(fieldRules[i][0], fieldRules[i][1]);
    if (!ok) allValid = false;
  }
  return allValid;
}

function clearFieldError(inputId) {
  var el = document.getElementById(inputId);
  if (el) { el.classList.remove('is-error'); }
  var errEl = document.getElementById(inputId + '-err');
  if (errEl) errEl.remove();
}

// ── Phase2: 出欠管理 ──────────────────────────────────────────
function openAttendanceModal(eventId) {
  var ev = (DB.events||[]).find(function(e){return e.id===eventId;});
  if (!ev) { toast('イベントが見つかりません','e'); return; }
  var teamId = ev.teamId || _getMyTeamId();
  var pls = DB.players.filter(function(p){return p.team===teamId;});
  if (!pls.length) { toast('選手がいません','w'); return; }
  if (!DB.attendance) DB.attendance = {};
  var att = DB.attendance[eventId] || {};
  var dateStr = ev.year+'-'+String((ev.month||0)+1).padStart(2,'0')+'-'+String(ev.date).padStart(2,'0');

  var html = '<div style="margin-bottom:14px">';
  html += '<div style="font-size:14px;font-weight:700;margin-bottom:4px">'+sanitize(ev.title||'イベント',30)+'</div>';
  html += '<div style="font-size:12px;color:var(--txt3)">'+dateStr+(ev.time?' '+ev.time:'')+'</div>';
  html += '</div>';

  // Stats summary
  var present=0,late=0,absent=0,excused=0,noResp=0;
  pls.forEach(function(p){var s=att[p.id]||'';if(s==='present')present++;else if(s==='late')late++;else if(s==='absent')absent++;else if(s==='excused')excused++;else noResp++;});
  html += '<div class="att-summary" style="margin-bottom:14px">';
  html += '<div class="att-chip" style="background:rgba(34,197,94,.1);color:var(--grn)">✓ '+present+'</div>';
  html += '<div class="att-chip" style="background:rgba(234,179,8,.1);color:var(--yel)">△ '+late+'</div>';
  html += '<div class="att-chip" style="background:rgba(239,68,68,.08);color:var(--red)">✗ '+absent+'</div>';
  html += '<div class="att-chip" style="background:rgba(148,163,184,.1);color:#64748b">— '+excused+'</div>';
  if(noResp>0) html += '<div class="att-chip" style="background:var(--surf2);color:var(--txt3)">未回答 '+noResp+'</div>';
  html += '</div>';

  // Player grid
  html += '<div class="att-grid" id="att-grid">';
  pls.forEach(function(p) {
    var st = att[p.id] || '';
    html += '<div class="att-row">';
    html += '<div class="att-name"><div class="avi" style="width:28px;height:28px;font-size:10px;flex-shrink:0;background:'+(p.color||'var(--org)')+'22;color:'+(p.color||'var(--org)')+'">'+((p.name||'?')[0])+'</div>'+sanitize(p.name,16)+'</div>';
    html += '<div class="att-btns">';
    html += '<button class="att-btn'+(st==='present'?' active-present':'')+'" onclick="setAttendance(\''+eventId+'\',\''+p.id+'\',\'present\')" title="出席">✓</button>';
    html += '<button class="att-btn'+(st==='late'?' active-late':'')+'" onclick="setAttendance(\''+eventId+'\',\''+p.id+'\',\'late\')" title="遅刻">△</button>';
    html += '<button class="att-btn'+(st==='absent'?' active-absent':'')+'" onclick="setAttendance(\''+eventId+'\',\''+p.id+'\',\'absent\')" title="欠席">✗</button>';
    html += '<button class="att-btn'+(st==='excused'?' active-excused':'')+'" onclick="setAttendance(\''+eventId+'\',\''+p.id+'\',\'excused\')" title="公欠">—</button>';
    html += '</div></div>';
  });
  html += '</div>';

  // Bulk actions
  html += '<div class="flex gap-8 mt-16">';
  html += '<button class="btn btn-ghost btn-sm flex-1" onclick="bulkAttendance(\''+eventId+'\',\'present\')">全員出席</button>';
  html += '<button class="btn btn-ghost btn-sm flex-1" onclick="closeM()">閉じる</button>';
  html += '</div>';

  openM('📋 出欠管理', html);
}

function setAttendance(eventId, playerId, status) {
  if (!DB.attendance) DB.attendance = {};
  if (!DB.attendance[eventId]) DB.attendance[eventId] = {};
  var cur = DB.attendance[eventId][playerId];
  DB.attendance[eventId][playerId] = (cur === status) ? '' : status;
  saveDB();
  openAttendanceModal(eventId);
}

function bulkAttendance(eventId, status) {
  if (!DB.attendance) DB.attendance = {};
  if (!DB.attendance[eventId]) DB.attendance[eventId] = {};
  var teamId = (DB.events||[]).find(function(e){return e.id===eventId;})?.teamId || _getMyTeamId();
  DB.players.filter(function(p){return p.team===teamId;}).forEach(function(p) {
    if (!DB.attendance[eventId][p.id]) DB.attendance[eventId][p.id] = status;
  });
  saveDB();
  openAttendanceModal(eventId);
}

function getAttendanceRate(playerId, days) {
  if (!DB.attendance) return null;
  var cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - (days || 30));
  var total = 0, present = 0;
  Object.entries(DB.attendance).forEach(function(entry) {
    var evId = entry[0]; var att = entry[1];
    var ev = (DB.events||[]).find(function(e){return e.id===evId;});
    if (!ev) return;
    var evDate = new Date(ev.year, ev.month||0, ev.date);
    if (evDate < cutoff) return;
    if (att[playerId]) {
      total++;
      if (att[playerId] === 'present' || att[playerId] === 'late') present++;
    }
  });
  return total > 0 ? Math.round(present / total * 100) : null;
}

// ── Phase2: コーチレビュー ──────────────────────────────────────
function openCoachReviewForm(coachId, reqId) {
  var coach = DB.coaches.find(function(c){return c.id===coachId;});
  if (!coach) { toast('コーチが見つかりません','e'); return; }
  if (!DB.coachReviews) DB.coachReviews = [];
  var existing = DB.coachReviews.find(function(r){return r.coachId===coachId && r.createdBy===DB.currentUser?.id;});
  if (existing) { toast('既にレビュー済みです','i'); return; }

  var html = '<div style="text-align:center;margin-bottom:20px">';
  html += '<div class="avi" style="width:56px;height:56px;font-size:22px;margin:0 auto 10px;background:'+(coach.color||'var(--org)')+'22;color:'+(coach.color||'var(--org)')+'">'+(coach.name||'?')[0]+'</div>';
  html += '<div style="font-size:16px;font-weight:800">'+sanitize(coach.name,20)+'</div>';
  html += '<div style="font-size:12px;color:var(--txt3)">'+sanitize(coach.sport||'',15)+'</div>';
  html += '</div>';

  // Star rating
  html += '<div class="form-group"><label class="label">総合評価</label>';
  html += '<div class="review-stars" id="rv-stars">';
  for (var i = 1; i <= 5; i++) {
    html += '<span class="review-star" data-v="'+i+'" onclick="setReviewStars('+i+')">★</span>';
  }
  html += '</div></div>';

  // Category ratings
  var cats = [{k:'skill',l:'指導力'},{k:'communication',l:'コミュニケーション'},{k:'punctuality',l:'時間・約束'}];
  cats.forEach(function(cat) {
    html += '<div class="form-group"><label class="label">'+cat.l+'</label>';
    html += '<div class="review-stars" id="rv-'+cat.k+'">';
    for (var i = 1; i <= 5; i++) {
      html += '<span class="review-star" data-v="'+i+'" onclick="setReviewCatStars(\''+cat.k+'\','+i+')">★</span>';
    }
    html += '</div></div>';
  });

  html += '<div class="form-group"><label class="label">コメント</label>';
  html += '<textarea id="rv-comment" class="input" placeholder="コーチの指導について感想をお書きください..." rows="3"></textarea></div>';

  html += '<div class="flex gap-8">';
  html += '<button class="btn btn-ghost flex-1" onclick="closeM()">キャンセル</button>';
  html += '<button class="btn btn-primary flex-1" onclick="submitCoachReview(\''+coachId+'\',\''+(reqId||'')+'\')">レビューを投稿</button>';
  html += '</div>';

  window._rvRating = 0;
  window._rvCats = {skill:0,communication:0,punctuality:0};
  openM('⭐ コーチレビュー', html);
}

function setReviewStars(n) {
  window._rvRating = n;
  var container = document.getElementById('rv-stars');
  if (!container) return;
  container.querySelectorAll('.review-star').forEach(function(s) {
    s.classList.toggle('active', parseInt(s.dataset.v) <= n);
  });
}

function setReviewCatStars(cat, n) {
  if (!window._rvCats) window._rvCats = {};
  window._rvCats[cat] = n;
  var container = document.getElementById('rv-'+cat);
  if (!container) return;
  container.querySelectorAll('.review-star').forEach(function(s) {
    s.classList.toggle('active', parseInt(s.dataset.v) <= n);
  });
}

function submitCoachReview(coachId, reqId) {
  var rating = window._rvRating || 0;
  if (rating < 1) { toast('評価を選択してください','e'); return; }
  var comment = (document.getElementById('rv-comment')?.value || '').trim();
  if (!DB.coachReviews) DB.coachReviews = [];
  var review = {
    id: genId('rv'),
    coachId: coachId,
    teamId: _getMyTeamId(),
    reqId: reqId || '',
    rating: rating,
    categories: window._rvCats || {},
    comment: sanitize(comment, 300),
    createdAt: new Date().toISOString(),
    createdBy: DB.currentUser?.id,
    createdByName: DB.currentUser?.name || ''
  };
  DB.coachReviews.push(review);

  // Update coach average rating
  var coach = DB.coaches.find(function(c){return c.id===coachId;});
  if (coach) {
    var allReviews = DB.coachReviews.filter(function(r){return r.coachId===coachId;});
    coach.rating = Math.round(allReviews.reduce(function(s,r){return s+r.rating;},0) / allReviews.length * 10) / 10;
    coach.reviews = allReviews.length;
  }
  saveDB();
  closeM();
  toast('レビューを投稿しました','s');
  addNotif(sanitize(DB.currentUser?.name||'',10)+'がレビューを投稿しました','fa-star','dashboard',coachId);
  refreshPage();
}

function getCoachReviews(coachId) {
  if (!DB.coachReviews) return [];
  return DB.coachReviews.filter(function(r){return r.coachId===coachId;}).sort(function(a,b){return b.createdAt>a.createdAt?1:-1;});
}

function renderCoachReviewSummary(coachId) {
  var reviews = getCoachReviews(coachId);
  if (!reviews.length) return '';
  var avgRating = reviews.reduce(function(s,r){return s+r.rating;},0) / reviews.length;
  var catAvg = {skill:0,communication:0,punctuality:0};
  var catN = {skill:0,communication:0,punctuality:0};
  reviews.forEach(function(r) {
    if (r.categories) {
      ['skill','communication','punctuality'].forEach(function(k) {
        if (r.categories[k]) { catAvg[k] += r.categories[k]; catN[k]++; }
      });
    }
  });
  ['skill','communication','punctuality'].forEach(function(k) {
    catAvg[k] = catN[k] ? Math.round(catAvg[k] / catN[k] * 10) / 10 : 0;
  });

  var html = '<div style="margin-bottom:16px">';
  html += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">';
  html += '<div style="font-size:32px;font-weight:800;font-family:Montserrat,sans-serif;color:var(--yel)">'+(Math.round(avgRating*10)/10)+'</div>';
  html += '<div><div style="color:#fbbf24;font-size:14px;letter-spacing:1px">'+'★'.repeat(Math.round(avgRating))+'☆'.repeat(5-Math.round(avgRating))+'</div>';
  html += '<div style="font-size:11px;color:var(--txt3)">'+reviews.length+'件のレビュー</div></div></div>';

  var catLabels = {skill:'指導力',communication:'コミュニケーション',punctuality:'時間・約束'};
  ['skill','communication','punctuality'].forEach(function(k) {
    var v = catAvg[k];
    html += '<div class="review-cat-bar"><span class="rcb-label">'+catLabels[k]+'</span>';
    html += '<div class="rcb-track"><div class="rcb-fill" style="width:'+(v/5*100)+'%;background:'+(v>=4?'var(--grn)':v>=3?'var(--yel)':'var(--red)')+'"></div></div>';
    html += '<span class="rcb-val">'+(v||'--')+'</span></div>';
  });
  html += '</div>';

  // Recent reviews
  reviews.slice(0,3).forEach(function(r) {
    html += '<div class="review-card"><div class="rc-head"><span class="rc-stars">'+'★'.repeat(r.rating)+'☆'.repeat(5-r.rating)+'</span>';
    html += '<span class="rc-meta">'+sanitize(r.createdByName||'匿名',12)+'</span></div>';
    if (r.comment) html += '<div class="rc-text">'+sanitize(r.comment,200)+'</div>';
    html += '<div class="rc-meta">'+(r.createdAt||'').slice(0,10)+'</div></div>';
  });
  return html;
}

// ── Phase2: 通知センター ────────────────────────────────────────
function notificationCenterPage() {
  var myN = _myNotifs();
  var tab = window._ncTab || 'all';
  var filtered = myN;
  if (tab === 'unread') filtered = myN.filter(function(n){return !n.read;});

  var unreadCount = myN.filter(function(n){return !n.read;}).length;

  var html = '<div class="pg-head flex justify-between items-center">';
  html += '<div><div class="pg-title">🔔 通知センター</div>';
  html += '<div class="pg-sub">'+(unreadCount>0?unreadCount+'件の未読':'すべて既読')+'</div></div>';
  html += '<div class="flex gap-8">';
  if (unreadCount > 0) html += '<button class="btn btn-ghost btn-sm" onclick="markAllNotifsRead()">すべて既読</button>';
  html += '<button class="btn btn-ghost btn-sm" onclick="clearOldNotifs()">古い通知を削除</button>';
  html += '</div></div>';

  // Tabs
  html += '<div class="nc-tabs">';
  html += '<button class="nc-tab'+(tab==='all'?' active':'')+'" onclick="window._ncTab=\'all\';refreshPage()">すべて <span style="opacity:.6">'+myN.length+'</span></button>';
  html += '<button class="nc-tab'+(tab==='unread'?' active':'')+'" onclick="window._ncTab=\'unread\';refreshPage()">未読'+(unreadCount>0?' <span style="background:var(--red);color:#fff;padding:1px 6px;border-radius:8px;font-size:10px">'+unreadCount+'</span>':'')+'</button>';
  html += '</div>';

  if (!filtered.length) {
    html += emptyState('🔔', tab==='unread'?'未読の通知はありません':'通知はまだありません', 'アクティビティがあるとここに通知が届きます');
    return html;
  }

  html += '<div class="card" style="padding:0">';
  filtered.forEach(function(n) {
    var iconBg = 'rgba(37,99,235,.08)';
    var iconColor = 'var(--blue)';
    if ((n.icon||'').includes('check')||n.icon==='fa-handshake') { iconBg='rgba(0,207,170,.08)'; iconColor='var(--teal)'; }
    else if ((n.icon||'').includes('exclamation')||n.icon==='fa-times-circle') { iconBg='rgba(239,68,68,.06)'; iconColor='var(--red)'; }
    else if ((n.icon||'').includes('star')) { iconBg='rgba(234,179,8,.08)'; iconColor='var(--yel)'; }

    html += '<div class="nc-item'+(n.read?'':' unread')+'" onclick="readNotif(\''+n.id+'\');'+(n.link?'goTo(\''+n.link+'\')':'')+';">';
    html += '<div class="nc-icon" style="background:'+iconBg+';color:'+iconColor+'"><i class="fa '+(n.icon||'fa-bell')+'"></i></div>';
    html += '<div class="nc-text">'+sanitize(n.text,100)+'</div>';
    html += '<div class="nc-time">'+(n.time||'')+'</div>';
    html += '</div>';
  });
  html += '</div>';
  return html;
}

function readNotif(notifId) {
  var n = (DB.notifs||[]).find(function(x){return x.id===notifId;});
  if (n) n.read = true;
  saveDB();
  updateNotifBadge();
}

function markAllNotifsRead() {
  _myNotifs().forEach(function(n){n.read=true;});
  saveDB();
  updateNotifBadge();
  toast('すべての通知を既読にしました','s');
  refreshPage();
}

function clearOldNotifs() {
  var uid = DB.currentUser?.id || '';
  var myN = DB.notifs.filter(function(n){return !n.uid || n.uid===uid;});
  var keep = myN.slice(0,20);
  var keepIds = new Set(keep.map(function(n){return n.id;}));
  DB.notifs = DB.notifs.filter(function(n){
    if (n.uid && n.uid !== uid) return true;
    return keepIds.has(n.id);
  });
  saveDB();
  toast('古い通知を削除しました','s');
  refreshPage();
}

// ── Phase2: 選手比較機能 ──────────────────────────────────────
function openPlayerCompare() {
  var team = getMyTeam();
  if (!team) { toast('チーム情報がありません','e'); return; }
  var pls = DB.players.filter(function(p){ return p.team === team.id; });
  if (pls.length < 2) { toast('比較するには2名以上の選手が必要です','w'); return; }
  var selA = window._cmpA || pls[0]?.id || '';
  var selB = window._cmpB || pls[1]?.id || '';

  function getStats(pid) {
    var p = DB.players.find(function(x){return x.id===pid;});
    if (!p) return null;
    var tLog = DB.trainingLog[pid] || {};
    var cLog = DB.conditionLog[pid] || {};
    var bLog = DB.bodyLog[pid] || {};
    var tEntries = Object.values(tLog).slice(-14);
    var cEntries = Object.values(cLog).slice(-14);
    var bEntries = Object.values(bLog).sort(function(a,b){return a.date>b.date?-1:1;});
    var attRate = getAttendanceRate(pid, 30);
    return {
      name: p.name, pos: p.pos || '--', color: p.color || 'var(--org)',
      avgCond: cEntries.length ? Math.round(cEntries.reduce(function(s,e){return s+(e.mood||0);},0)/cEntries.length*10)/10 : null,
      avgKcal: tEntries.length ? Math.round(tEntries.reduce(function(s,e){return s+(e.kcal||0);},0)/tEntries.length) : null,
      trainDays: tEntries.length,
      weight: bEntries[0]?.weight || null,
      bodyFat: bEntries[0]?.bodyFat || null,
      muscle: bEntries[0]?.muscle || null,
      attRate: attRate
    };
  }

  var a = getStats(selA);
  var b = getStats(selB);

  function cmpBar(label, vA, vB, maxVal, unit, higher) {
    var pA = vA ? Math.round(vA / maxVal * 100) : 0;
    var pB = vB ? Math.round(vB / maxVal * 100) : 0;
    var colorA = (higher === 'higher' && vA >= vB) || (higher === 'lower' && vA <= vB) ? 'var(--teal)' : 'var(--blue)';
    var colorB = (higher === 'higher' && vB >= vA) || (higher === 'lower' && vB <= vA) ? 'var(--teal)' : 'var(--org)';
    return '<div style="margin-bottom:14px"><div style="font-size:11px;color:var(--txt3);font-weight:600;margin-bottom:4px">'+label+'</div>'
      +'<div style="display:flex;gap:12px;align-items:center">'
      +'<div style="flex:1;text-align:right"><span style="font-size:14px;font-weight:800;color:'+colorA+'">'+(vA !== null ? vA+unit : '--')+'</span>'
      +'<div class="compare-bar"><div class="compare-bar-fill" style="width:'+pA+'%;background:'+colorA+';margin-left:auto"></div></div></div>'
      +'<div style="width:1px;height:24px;background:var(--b2)"></div>'
      +'<div style="flex:1"><span style="font-size:14px;font-weight:800;color:'+colorB+'">'+(vB !== null ? vB+unit : '--')+'</span>'
      +'<div class="compare-bar"><div class="compare-bar-fill" style="width:'+pB+'%;background:'+colorB+'"></div></div></div>'
      +'</div></div>';
  }

  var html = '<div style="display:flex;gap:12px;margin-bottom:20px">';
  html += '<select class="input" style="flex:1;font-size:13px" onchange="window._cmpA=this.value;closeM();openPlayerCompare()">';
  pls.forEach(function(p){ html += '<option value="'+p.id+'"'+(p.id===selA?' selected':'')+'>'+sanitize(p.name,16)+'</option>'; });
  html += '</select>';
  html += '<div style="display:flex;align-items:center;font-weight:800;color:var(--txt3)">VS</div>';
  html += '<select class="input" style="flex:1;font-size:13px" onchange="window._cmpB=this.value;closeM();openPlayerCompare()">';
  pls.forEach(function(p){ html += '<option value="'+p.id+'"'+(p.id===selB?' selected':'')+'>'+sanitize(p.name,16)+'</option>'; });
  html += '</select></div>';

  if (a && b) {
    html += '<div style="display:flex;gap:10px;margin-bottom:16px;text-align:center">';
    html += '<div style="flex:1;padding:12px;background:rgba(37,99,235,.06);border-radius:12px"><div class="avi" style="width:42px;height:42px;margin:0 auto 6px;background:'+a.color+'22;color:'+a.color+'">'+((a.name||'?')[0])+'</div><div style="font-size:13px;font-weight:700">'+sanitize(a.name,12)+'</div><div style="font-size:11px;color:var(--txt3)">'+a.pos+'</div></div>';
    html += '<div style="flex:1;padding:12px;background:rgba(249,115,22,.06);border-radius:12px"><div class="avi" style="width:42px;height:42px;margin:0 auto 6px;background:'+b.color+'22;color:'+b.color+'">'+((b.name||'?')[0])+'</div><div style="font-size:13px;font-weight:700">'+sanitize(b.name,12)+'</div><div style="font-size:11px;color:var(--txt3)">'+b.pos+'</div></div>';
    html += '</div>';

    html += cmpBar('体調（平均）', a.avgCond, b.avgCond, 5, '', 'higher');
    html += cmpBar('消費kcal（平均）', a.avgKcal, b.avgKcal, 800, 'kcal', 'higher');
    html += cmpBar('練習回数（14日）', a.trainDays, b.trainDays, 14, '日', 'higher');
    html += cmpBar('体重', a.weight, b.weight, 100, 'kg', 'none');
    html += cmpBar('体脂肪率', a.bodyFat, b.bodyFat, 30, '%', 'lower');
    if (a.attRate !== null || b.attRate !== null) {
      html += cmpBar('出席率（30日）', a.attRate, b.attRate, 100, '%', 'higher');
    }
  }

  html += '<div style="margin-top:12px"><button class="btn btn-ghost w-full btn-sm" onclick="closeM()">閉じる</button></div>';
  openM('📊 選手比較', html);
}

// ── Phase2: チーム週次レポート ──────────────────────────────────
function generateTeamWeeklyReport() {
  var team = getMyTeam();
  if (!team) { toast('チーム情報がありません','e'); return; }
  var pls = DB.players.filter(function(p){ return p.team === team.id; });
  if (!pls.length) { toast('選手がいません','w'); return; }

  var now = new Date();
  var weekAgo = new Date(); weekAgo.setDate(now.getDate() - 7);
  var periodStr = weekAgo.toLocaleDateString('ja-JP',{month:'numeric',day:'numeric'}) + ' ~ ' + now.toLocaleDateString('ja-JP',{month:'numeric',day:'numeric'});

  // Gather stats
  var totalTrainSessions = 0, totalCondReports = 0;
  var condSum = 0, condN = 0, painCount = 0;
  var attTotal = 0, attPresent = 0;
  var playerStats = [];

  pls.forEach(function(p) {
    var tLog = DB.trainingLog[p.id] || {};
    var cLog = DB.conditionLog[p.id] || {};
    var sessions = 0, pCond = 0, pCondN = 0, hasPain = false;

    for (var i = 0; i < 7; i++) {
      var d = new Date(); d.setDate(now.getDate() - i);
      var ds = d.toISOString().slice(0,10);
      Object.values(tLog).forEach(function(e){ if (e.date === ds) sessions++; });
      if (cLog[ds]) {
        totalCondReports++;
        if (cLog[ds].mood) { condSum += cLog[ds].mood; condN++; pCond += cLog[ds].mood; pCondN++; }
        if (cLog[ds].pain || cLog[ds].painLevel > 0) { painCount++; hasPain = true; }
      }
    }
    totalTrainSessions += sessions;

    // Attendance
    Object.entries(DB.attendance || {}).forEach(function(entry) {
      var ev = (DB.events||[]).find(function(e){return e.id===entry[0];});
      if (!ev) return;
      var evDate = new Date(ev.year, ev.month||0, ev.date);
      if (evDate >= weekAgo && evDate <= now && entry[1][p.id]) {
        attTotal++;
        if (entry[1][p.id] === 'present' || entry[1][p.id] === 'late') attPresent++;
      }
    });

    playerStats.push({
      name: p.name, pos: p.pos,
      sessions: sessions,
      avgCond: pCondN ? Math.round(pCond / pCondN * 10) / 10 : null,
      hasPain: hasPain
    });
  });

  var avgCond = condN ? Math.round(condSum / condN * 10) / 10 : null;
  var attRate = attTotal > 0 ? Math.round(attPresent / attTotal * 100) : null;

  // Fee stats
  var payments = _dbArr('payments').filter(function(p){return p.team===team.id;});
  var paidThisMonth = payments.filter(function(p){return p.status==='paid' && p.month===curMonth();}).length;
  var unpaidThisMonth = pls.length - paidThisMonth;

  // Build report HTML
  var html = '<div style="margin-bottom:16px">';
  html += '<div style="font-size:16px;font-weight:800;margin-bottom:4px">📋 '+sanitize(team.name,20)+' 週次レポート</div>';
  html += '<div style="font-size:12px;color:var(--txt3)">'+periodStr+'</div></div>';

  // KPIs
  html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px">';
  html += '<div style="text-align:center;padding:12px;background:rgba(37,99,235,.06);border-radius:10px"><div style="font-size:20px;font-weight:800;color:var(--blue)">'+totalTrainSessions+'</div><div style="font-size:10px;color:var(--txt3)">練習数</div></div>';
  html += '<div style="text-align:center;padding:12px;background:rgba(0,207,170,.06);border-radius:10px"><div style="font-size:20px;font-weight:800;color:var(--teal)">'+(avgCond||'--')+'</div><div style="font-size:10px;color:var(--txt3)">体調平均</div></div>';
  html += '<div style="text-align:center;padding:12px;background:'+(painCount>0?'rgba(239,68,68,.06)':'rgba(34,197,94,.06)')+';border-radius:10px"><div style="font-size:20px;font-weight:800;color:'+(painCount>0?'var(--red)':'var(--grn)')+'">'+painCount+'</div><div style="font-size:10px;color:var(--txt3)">痛み報告</div></div>';
  html += '<div style="text-align:center;padding:12px;background:rgba(249,115,22,.06);border-radius:10px"><div style="font-size:20px;font-weight:800;color:var(--org)">'+(attRate!==null?attRate+'%':'--')+'</div><div style="font-size:10px;color:var(--txt3)">出席率</div></div>';
  html += '</div>';

  // Player table
  html += '<div style="font-size:13px;font-weight:700;margin-bottom:8px">選手別サマリー</div>';
  html += '<div style="overflow-x:auto"><table class="admin-data-table"><thead><tr><th>選手</th><th>練習数</th><th>体調</th><th>痛み</th></tr></thead><tbody>';
  playerStats.sort(function(a,b){return (b.avgCond||0)-(a.avgCond||0);}).forEach(function(ps) {
    html += '<tr><td>'+sanitize(ps.name,14)+'</td><td style="text-align:center">'+ps.sessions+'</td>';
    html += '<td style="text-align:center;color:'+(ps.avgCond>=4?'var(--grn)':ps.avgCond>=3?'var(--yel)':'var(--red)')+';font-weight:700">'+(ps.avgCond||'--')+'</td>';
    html += '<td style="text-align:center">'+(ps.hasPain?'<span style="color:var(--red)">⚠️</span>':'✅')+'</td></tr>';
  });
  html += '</tbody></table></div>';

  // Fee summary
  html += '<div style="margin-top:14px;padding:12px;background:var(--surf2);border-radius:10px">';
  html += '<div style="font-size:12px;font-weight:700;margin-bottom:6px">💰 月謝状況（'+new Date().toLocaleDateString('ja-JP',{month:'long'})+'）</div>';
  html += '<div style="display:flex;gap:12px;font-size:13px"><span style="color:var(--grn)">支払済: <b>'+paidThisMonth+'名</b></span>';
  if (unpaidThisMonth > 0) html += '<span style="color:var(--red)">未払い: <b>'+unpaidThisMonth+'名</b></span>';
  html += '</div></div>';

  html += '<div class="flex gap-8 mt-16"><button class="btn btn-primary flex-1" onclick="exportWeeklyReportPDF()">📄 PDF保存</button><button class="btn btn-secondary flex-1" onclick="_printReport()">🖨️ 印刷</button><button class="btn btn-ghost flex-1" onclick="closeM()">閉じる</button></div>';
  openM('📋 週次レポート', html);
}

function _printReport() {
  var body = document.getElementById('modal-inner');
  if (!body) return;
  var w = window.open('','_blank','width=800,height=900');
  w.document.write('<html><head><title>週次レポート</title><style>body{font-family:sans-serif;padding:30px;font-size:13px;color:#333;line-height:1.8}table{width:100%;border-collapse:collapse;margin:12px 0}th,td{padding:6px 10px;border-bottom:1px solid #e2e8f0;text-align:left;font-size:12px}th{background:#f8fafc;font-weight:700}</style></head><body>'+body.innerHTML+'</body></html>');
  w.document.close();
  setTimeout(function(){w.print();},300);
}

// ── Phase3: 選手ランキングページ ──────────────────────────────
function playerRankingPage() {
  var team = getMyTeam();
  if (!team) return emptyState('🏆','チーム情報が未設定です','プロフィール設定からチーム情報を登録してください','プロフィールを設定する',"goTo('profile-settings')");
  var pls = DB.players.filter(function(p){return p.team===team.id;});
  if (!pls.length) return emptyState('🏆','選手がいません','選手を追加してランキングを確認しましょう','選手を追加',"goTo('my-team')");

  var metric = window._rankMetric || 'condition';
  var period = window._rankPeriod || '7';
  var days = parseInt(period);

  // Calculate stats for all players
  var rankings = pls.map(function(p) {
    var tLog = DB.trainingLog[p.id] || {};
    var cLog = DB.conditionLog[p.id] || {};
    var bLog = DB.bodyLog[p.id] || {};
    var tEntries = []; var cEntries = [];
    var now = new Date();
    for (var i = 0; i < days; i++) {
      var d = new Date(); d.setDate(now.getDate() - i);
      var ds = d.toISOString().slice(0,10);
      Object.values(tLog).forEach(function(e){if(e.date===ds) tEntries.push(e);});
      if (cLog[ds]) cEntries.push(cLog[ds]);
    }
    var bEntries = Object.values(bLog).sort(function(a,b){return a.date>b.date?-1:1;});
    var avgCond = cEntries.length ? Math.round(cEntries.reduce(function(s,e){return s+(e.mood||0);},0)/cEntries.length*10)/10 : 0;
    var totalKcal = tEntries.reduce(function(s,e){return s+(e.kcal||0);},0);
    var trainDays = tEntries.length;
    var attRate = getAttendanceRate(p.id, days);
    var avgSleep = cEntries.filter(function(e){return e.sleep;}).length ?
      Math.round(cEntries.reduce(function(s,e){return s+(e.sleep||0);},0)/cEntries.filter(function(e){return e.sleep;}).length*10)/10 : 0;

    return {
      id: p.id, name: p.name, pos: p.pos, color: p.color || 'var(--org)',
      avgCond: avgCond,
      totalKcal: totalKcal,
      trainDays: trainDays,
      attRate: attRate || 0,
      avgSleep: avgSleep,
      weight: bEntries[0]?.weight || 0,
      condEntries: cEntries.length
    };
  });

  // Sort by selected metric
  var sortKey = {condition:'avgCond',training:'trainDays',kcal:'totalKcal',attendance:'attRate',sleep:'avgSleep'}[metric] || 'avgCond';
  rankings.sort(function(a,b){return (b[sortKey]||0) - (a[sortKey]||0);});

  var metricLabel = {condition:'体調スコア',training:'練習回数',kcal:'消費kcal',attendance:'出席率',sleep:'睡眠時間'}[metric];
  var metricUnit = {condition:'',training:'回',kcal:'kcal',attendance:'%',sleep:'h'}[metric];
  var metricColor = {condition:'var(--teal)',training:'var(--blue)',kcal:'var(--org)',attendance:'var(--grn)',sleep:'#6366f1'}[metric];
  var maxVal = rankings.length ? Math.max(rankings[0][sortKey]||1, 1) : 1;

  // Header
  var html = '<div class="pg-head flex justify-between items-center"><div><div class="pg-title">🏆 選手ランキング</div>';
  html += '<div class="pg-sub">'+sanitize(team.name,20)+' · 直近'+days+'日間</div></div>';
  html += '<div class="flex gap-8"><button class="btn btn-ghost btn-sm" onclick="openPlayerCompare()">⚖️ 1対1比較</button>';
  html += '<button class="btn btn-secondary btn-sm" onclick="generateTeamWeeklyReport()">📋 週次レポート</button></div></div>';

  // Period selector
  html += '<div class="flex gap-8 mb-16 items-center">';
  html += '<select class="input" style="width:auto;padding:6px 12px;font-size:12px" onchange="window._rankPeriod=this.value;refreshPage()">';
  ['7','14','30'].forEach(function(d){html += '<option value="'+d+'"'+(period===d?' selected':'')+'>'+d+'日間</option>';});
  html += '</select></div>';

  // Metric tabs
  html += '<div class="rank-tabs">';
  [{k:'condition',l:'🧠 体調',e:'😊'},{k:'training',l:'🏋️ 練習',e:'💪'},{k:'kcal',l:'🔥 消費kcal',e:'🔥'},{k:'attendance',l:'📋 出席率',e:'✓'},{k:'sleep',l:'💤 睡眠',e:'😴'}].forEach(function(t){
    html += '<button class="rank-tab'+(metric===t.k?' active':'')+'" onclick="window._rankMetric=\''+t.k+'\';refreshPage()">'+t.l+'</button>';
  });
  html += '</div>';

  // Top 3 podium
  if (rankings.length >= 3) {
    html += '<div style="display:flex;gap:10px;margin-bottom:20px;align-items:flex-end">';
    [1,0,2].forEach(function(idx){
      var r = rankings[idx];
      var isFirst = idx===0;
      var medal = ['🥇','🥈','🥉'][idx];
      var h = isFirst ? '140px' : idx===1 ? '120px' : '100px';
      html += '<div style="flex:1;text-align:center">';
      html += '<div class="avi" style="width:'+(isFirst?'52':'42')+'px;height:'+(isFirst?'52':'42')+'px;font-size:'+(isFirst?'20':'16')+'px;margin:0 auto '+(isFirst?'8':'6')+'px;background:'+r.color+'22;color:'+r.color+'">'+((r.name||'?')[0])+'</div>';
      html += '<div style="font-size:'+(isFirst?'14':'12')+'px;font-weight:800;margin-bottom:4px">'+sanitize(r.name,10)+'</div>';
      html += '<div style="font-size:24px;margin-bottom:4px">'+medal+'</div>';
      html += '<div style="height:'+h+';background:linear-gradient(180deg,'+(isFirst?'rgba(234,179,8,.2)':'rgba(148,163,184,.1)')+','+(isFirst?'rgba(234,179,8,.08)':'rgba(148,163,184,.04)')+');border-radius:12px 12px 0 0;display:flex;align-items:center;justify-content:center;flex-direction:column;padding:10px">';
      html += '<div style="font-size:'+(isFirst?'22':'18')+'px;font-weight:800;color:'+metricColor+'">'+(r[sortKey]||0)+metricUnit+'</div>';
      html += '<div style="font-size:10px;color:var(--txt3)">'+metricLabel+'</div>';
      html += '</div></div>';
    });
    html += '</div>';
  }

  // Full ranking list
  html += '<div class="card" style="padding:0">';
  rankings.forEach(function(r, idx) {
    var posClass = idx===0?'gold':idx===1?'silver':idx===2?'bronze':'';
    var barW = maxVal > 0 ? Math.round((r[sortKey]||0)/maxVal*100) : 0;
    html += '<div class="rank-row">';
    html += '<div class="rank-pos '+ posClass+'">'+(idx<3?['🥇','🥈','🥉'][idx]:(idx+1))+'</div>';
    html += '<div class="avi" style="width:36px;height:36px;font-size:13px;background:'+r.color+'22;color:'+r.color+';flex-shrink:0">'+((r.name||'?')[0])+'</div>';
    html += '<div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:700">'+sanitize(r.name,16)+'</div>';
    html += '<div style="font-size:11px;color:var(--txt3)">'+sanitize(r.pos||'--',10)+'</div>';
    html += '<div style="height:5px;background:var(--b1);border-radius:3px;margin-top:4px;overflow:hidden"><div style="width:'+barW+'%;height:100%;background:'+metricColor+';border-radius:3px;transition:width .4s"></div></div>';
    html += '</div>';
    html += '<div class="rank-metric"><div class="rm-val" style="color:'+metricColor+'">'+(r[sortKey]||0)+'</div><div class="rm-label">'+metricUnit+'</div></div>';
    html += '</div>';
  });
  html += '</div>';

  return html;
}

// ── Phase3: 週次レポートPDF出力 ──────────────────────────────
