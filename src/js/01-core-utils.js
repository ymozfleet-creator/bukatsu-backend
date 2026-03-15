// 01 - ユーティリティ: Validate, sanitize, Session, RateLimit, GDPR, Audit


// ================================================================
// Production API Abstraction Layer
// localStorage → Supabase/REST API 切替可能な抽象化レイヤー
// ================================================================
const API = {
  mode: 'local', // 'local' | 'supabase' | 'rest'
  baseUrl: '',
  token: null,
  
  // データ保存（localStorage + Firestore ハイブリッド）
  async save(key, data) {
    try {
      // ローカルキャッシュに保存
      localStorage.setItem(key, JSON.stringify(data));
      // Firestoreにも同期
      if(window._fbReady && window._fbAuth?.currentUser){
        const fn = window._fbFn;
        const uid = window._fbAuth.currentUser.uid;
        await fn.setDoc(fn.doc(window._fbDB, 'userdata', uid + '_' + key), 
          {data: JSON.stringify(data), updatedAt: new Date().toISOString()}, {merge:true});
      }
      return {ok: true};
    } catch(e) {
      console.error('API.save error:', key, e);
      return {ok: false, error: e.message};
    }
  },
  
  // データ読み込み（ローカル → Firestoreフォールバック）
  async load(key, defaultVal) {
    try {
      // ローカルキャッシュから取得
      var raw = localStorage.getItem(key);
      if(raw) return JSON.parse(raw);
      // ローカルにない場合、Firestoreから取得
      if(window._fbReady && window._fbAuth?.currentUser){
        const fn = window._fbFn;
        const uid = window._fbAuth.currentUser.uid;
        const snap = await fn.getDoc(fn.doc(window._fbDB, 'userdata', uid + '_' + key));
        if(snap.exists()){
          const d = snap.data();
          try { const parsed = JSON.parse(d.data);
          localStorage.setItem(key, d.data);
          return parsed; } catch(e){ return null; }
        }
      }
      return defaultVal;
    } catch(e) {
      console.error('API.load error:', key, e);
      return defaultVal;
    }
  },
  
  // データ削除
  async remove(key) {
    try {
      if (this.mode === 'local') {
        localStorage.removeItem(key);
        return {ok: true};
      }
    } catch(e) {
      return {ok: false, error: e.message};
    }
  }
};

// ================================================================
// Session Manager — セッション管理・自動ログアウト
// ================================================================
const SessionMgr = {
  TIMEOUT: 30 * 60 * 1000, // 30分
  _timer: null,
  _lastActivity: Date.now(),
  
  init: function() {
    var self = this;
    ['click','keydown','scroll','touchstart'].forEach(function(ev) {
      document.addEventListener(ev, function() { self.touch(); }, {passive:true});
    });
    this._timer = setInterval(function() { self.check(); }, 60000);
  },
  
  touch: function() {
    this._lastActivity = Date.now();
  },
  
  check: function() {
    if (!DB.currentUser) return;
    var elapsed = Date.now() - this._lastActivity;
    // 5分前に警告
    if (elapsed > this.TIMEOUT - 5*60*1000 && elapsed < this.TIMEOUT) {
      var remaining = Math.ceil((this.TIMEOUT - elapsed) / 60000);
      var warn = document.getElementById('session-warn');
      if (!warn) {
        warn = document.createElement('div');
        warn.id = 'session-warn';
        warn.className = 'session-warn';
        if(document.body) document.body.appendChild(warn);
      }
      warn.textContent = '⏱ セッション切れまであと' + remaining + '分';
      warn.style.display = 'block';
    } else {
      var warn = document.getElementById('session-warn');
      if (warn) warn.style.display = 'none';
    }
    if (elapsed > this.TIMEOUT) {
      this.logout();
    }
  },
  
  logout: function() {
    clearInterval(this._timer);
    DB.currentUser = null;
    saveDB();
    toast('セッションがタイムアウトしました。再度ログインしてください。', 'e');
    showAuth();
  }
};

// ================================================================
// Input Validator — 入力バリデーション共通関数
// ================================================================
const Validate = {
  // メールアドレス
  email: function(v) {
    if (!v || typeof v !== 'string') return {ok:false, msg:'メールアドレスを入力してください'};
    var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(v.trim())) return {ok:false, msg:'正しいメールアドレス形式で入力してください'};
    return {ok:true, val:v.trim().toLowerCase()};
  },
  
  // パスワード
  password: function(v) {
    if (!v || v.length < 6) return {ok:false, msg:'パスワードは6文字以上で入力してください'};
    if (v.length > 100) return {ok:false, msg:'パスワードが長すぎます'};
    return {ok:true, val:v};
  },
  
  // 名前
  name: function(v, maxLen) {
    maxLen = maxLen || 30;
    if (!v || !v.trim()) return {ok:false, msg:'名前を入力してください'};
    var trimmed = v.trim().substring(0, maxLen);
    return {ok:true, val:trimmed};
  },
  
  // 数値（金額・体重等）
  number: function(v, min, max, label) {
    var n = parseFloat(v);
    if (isNaN(n)) return {ok:false, msg:(label||'値') + 'は数値で入力してください'};
    if (min !== undefined && n < min) return {ok:false, msg:(label||'値') + 'は' + min + '以上にしてください'};
    if (max !== undefined && n > max) return {ok:false, msg:(label||'値') + 'は' + max + '以下にしてください'};
    return {ok:true, val:n};
  },
  
  // テキスト（汎用）
  text: function(v, maxLen, label) {
    maxLen = maxLen || 500;
    if (!v || !v.trim()) return {ok:false, msg:(label||'入力') + 'を入力してください'};
    return {ok:true, val:sanitize(v.trim(), maxLen)};
  },
  
  // 電話番号
  phone: function(v) {
    if (!v) return {ok:true, val:''};
    var cleaned = v.replace(/[\s\-()]/g, '');
    if (!/^[0-9]{10,11}$/.test(cleaned)) return {ok:false, msg:'正しい電話番号を入力してください'};
    return {ok:true, val:cleaned};
  },
  
  // ファイル（画像）
  imageFile: function(file, maxSizeMB) {
    maxSizeMB = maxSizeMB || 5;
    if (!file) return {ok:false, msg:'ファイルを選択してください'};
    var allowed = ['image/jpeg','image/png','image/gif','image/webp'];
    if (allowed.indexOf(file.type) === -1) return {ok:false, msg:'JPEG, PNG, GIF, WebP形式のみアップロードできます'};
    if (file.size > maxSizeMB * 1024 * 1024) return {ok:false, msg:'ファイルサイズは' + maxSizeMB + 'MB以下にしてください'};
    return {ok:true, val:file};
  }
};

// ================================================================
// Loading State Manager — ローディング状態管理
// ================================================================
const LoadingUI = {
  show: function(target) {
    var el = typeof target === 'string' ? document.getElementById(target) : target;
    if (!el) return;
    el.setAttribute('data-prev-html', el.innerHTML);
    el.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;padding:40px;gap:10px">' +
      '<div class="loading-spinner"></div>' +
      '<span style="font-size:13px;color:var(--txt3)">読み込み中...</span></div>';
  },
  
  hide: function(target) {
    var el = typeof target === 'string' ? document.getElementById(target) : target;
    if (!el) return;
    var prev = el.getAttribute('data-prev-html');
    if (prev) el.innerHTML = prev;
  },
  
  // ボタンの読み込み中状態
  btnStart: function(btn, text) {
    if (!btn) return;
    btn.disabled = true;
    btn.setAttribute('data-prev-text', btn.innerHTML);
    btn.innerHTML = '<span style="opacity:.6">' + (text || '処理中...') + '</span>';
  },
  
  btnEnd: function(btn) {
    if (!btn) return;
    btn.disabled = false;
    var prev = btn.getAttribute('data-prev-text');
    if (prev) btn.innerHTML = prev;
  }
};


// ================================================================
// Global Error Handler — エラー監視 (Sentry連携)
// ================================================================
window.onerror = function(msg, src, line, col, err) {
  console.error('[GlobalError]', msg, 'at', src, ':', line);
  if (window.Sentry && Sentry.captureException) Sentry.captureException(err || new Error(msg));
  if (typeof addAuditLog === 'function') addAuditLog('error', String(msg).slice(0,120), {src:String(src).slice(-40),line});
  return false;
};
window.addEventListener('unhandledrejection', function(e) {
  console.error('[UnhandledPromise]', e.reason);
  if (window.Sentry && Sentry.captureException) Sentry.captureException(e.reason);
});

// ================================================================
// 監査ログシステム (Admin Audit Log)
// ================================================================
function addAuditLog(action, detail, meta){
  if(!DB.auditLog) DB.auditLog = [];
  const entry = {
    id: 'aud_' + Date.now() + '_' + Math.random().toString(36).slice(2,6),
    action: action,
    detail: String(detail||'').slice(0,200),
    meta: meta || {},
    user: DB.currentUser ? {id:DB.currentUser.id, name:DB.currentUser.name, role:DB.currentUser.role} : null,
    timestamp: new Date().toISOString(),
    ua: navigator.userAgent.slice(0,80)
  };
  DB.auditLog.push(entry);
  // 最大500件に制限
  if(DB.auditLog.length > 500) DB.auditLog = DB.auditLog.slice(-500);
  // saveDBは呼び出し元で行うため、ここでは保存しない（循環防止）
  return entry;
}

// 主要操作をラップする監査ログヘルパー
function auditWrap(action, detail, fn){
  addAuditLog(action, detail);
  try { const result = fn(); saveDB(); return result; }
  catch(e){ addAuditLog('error', action + ' failed: ' + e.message); throw e; }
}

// ================================================================
// GDPR / 個人情報管理
// ================================================================
function adminDeleteUserAllData(userId){
  if(DB.currentUser?.role !== 'admin'){ toast('管理者権限が必要です','e'); return; }
  if(!userId){ toast('ユーザーIDが不明です','e'); return; }

  const user = _getUsers().find(u => u.id === userId);
  if(!user){ toast('ユーザーが見つかりません','e'); return; }
  const userName = user.name || 'ユーザー';

  openM('🗑️ 個人データ完全削除', `
    <div style="padding:8px 0">
      <div style="background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);border-radius:12px;padding:16px;margin-bottom:16px">
        <div style="font-size:14px;font-weight:700;color:var(--red);margin-bottom:8px">⚠️ この操作は取り消せません</div>
        <div style="font-size:12px;color:var(--txt2);line-height:1.6">
          <b>${sanitize(userName,20)}</b>（${user.role}）の以下のデータが完全に削除されます：
        </div>
        <ul style="font-size:11px;color:var(--txt2);margin:8px 0 0 16px;line-height:1.8">
          <li>ユーザーアカウント情報</li>
          <li>関連する支払い履歴</li>
          <li>チャットメッセージ</li>
          <li>通知・イベント履歴</li>
          <li>コンディション・栄養ログ</li>
          ${user.role==='coach'?'<li>コーチプロフィール・マッチング履歴</li>':''}
          ${user.role==='player'?'<li>トレーニング・栄養データ</li>':''}
          ${user.role==='team'?'<li>チーム情報・所属選手の紐付け</li>':''}
        </ul>
      </div>
      <div class="form-group">
        <label class="label">確認のため「削除」と入力してください</label>
        <input id="gdpr-confirm" class="input" placeholder="削除" autocomplete="off">
      </div>
      <div class="flex gap-8 mt-16">
        <button class="btn btn-danger flex-1" onclick="executeGDPRDelete('${userId}')">🗑️ 完全削除を実行</button>
        <button class="btn btn-ghost flex-1" onclick="closeM()">キャンセル</button>
      </div>
    </div>
  `);
}

function executeGDPRDelete(userId){
  const confirmVal = (document.getElementById('gdpr-confirm')?.value||'').trim();
  if(confirmVal !== '削除'){ toast('「削除」と入力してください','e'); return; }

  const user = _getUsers().find(u => u.id === userId);
  if(!user){ toast('ユーザーが見つかりません','e'); return; }
  const userName = user.name || userId;

  addAuditLog('gdpr_delete', userName + '(' + user.role + ') の全データを削除', {targetId:userId, role:user.role});

  // ロールに応じたデータ削除
  if(user.role === 'coach'){
    DB.coaches = (DB.coaches||[]).filter(c => c.id !== userId && c.userId !== userId);
    DB.requests = (DB.requests||[]).filter(r => r.coachId !== userId);
    DB.coachPay = (DB.coachPay||[]).filter(p => p.coachId !== userId);
    // 情報開示の削除
    DB.disclosures = (DB.disclosures||[]).filter(d => d.coachId !== userId);
  }
  if(user.role === 'player'){
    DB.players = (DB.players||[]).filter(p => p.id !== userId && p.userId !== userId);
    DB.payments = (DB.payments||[]).filter(p => p.player !== userId);
    // 全ログデータ完全削除
    if(DB.conditionLog) delete DB.conditionLog[userId];
    if(DB.trainingLog) delete DB.trainingLog[userId];
    if(DB.bodyLog) delete DB.bodyLog[userId];
    if(DB.injuryHistory) delete DB.injuryHistory[userId];
    if(DB.playerMealHistory) delete DB.playerMealHistory[userId];
    if(DB.nutritionLog) delete DB.nutritionLog[userId];
  }
  if(user.role === 'team'){
    const teamId = (DB.teams||[]).find(t => t.userId === userId || t.id === userId)?.id;
    if(teamId){
      // チーム所属選手の紐付け解除（選手データ自体は残す）
      (DB.players||[]).forEach(p => { if(p.team === teamId) p.team = ''; });
      DB.teams = (DB.teams||[]).filter(t => t.id !== teamId);
      DB.payments = (DB.payments||[]).filter(p => p.team !== teamId && p.teamId !== teamId);
      DB.requests = (DB.requests||[]).filter(r => r.teamId !== teamId);
    }
  }
  if(user.role === 'parent'){
    // 保護者紐付け解除
    DB.players.forEach(p => { if(p.guardianId === userId) p.guardianId = ''; });
  }

  // チャットからメッセージ削除
  Object.values(DB.chats||{}).forEach(ch => {
    if(ch.msgs) ch.msgs = ch.msgs.filter(m => m.from !== userId);
  });

  // 通知の削除
  DB.notifs = (DB.notifs||[]).filter(n => n.userId !== userId);

  // イベントの削除
  DB.events = (DB.events||[]).filter(e => e.createdBy !== userId);

  // 同意ログに削除記録を追加（GDPR対応証跡）
  if(!DB.consentLog) DB.consentLog = [];
  DB.consentLog.push({
    type: 'data_deletion',
    userId: userId,
    userName: userName,
    role: user.role,
    deletedAt: new Date().toISOString(),
    deletedBy: DB.currentUser?.id || 'admin',
    scope: 'full_account'
  });

  // ユーザーアカウント削除
  const users = _getUsers().filter(u => u.id !== userId);
  _saveUsers(users);

  saveDB();
  closeM();
  toast(userName + ' のデータを完全削除しました','s');
  refreshPage();
}

// ユーザー自身によるデータエクスポート（GDPR データポータビリティ）
function exportMyData(){
  const me = DB.currentUser;
  if(!me){ toast('ログインが必要です','e'); return; }

  const myData = {
    account: { id:me.id, name:me.name, email:me.email, role:me.role, createdAt:me.createdAt },
    profile: {},
    payments: [],
    events: [],
    consentLog: (DB.consentLog||[]).filter(c => c.userId === me.id)
  };

  if(me.role === 'coach') myData.profile = (DB.coaches||[]).find(c => c.id === me.id || c.userId === me.id) || {};
  if(me.role === 'player'){
    myData.profile = (DB.players||[]).find(p => p.id === me.id || p.userId === me.id) || {};
    myData.payments = _dbArr('payments').filter(p => p.player === me.id);
  }
  if(me.role === 'team'){
    const team = DB.teams.find(t => t.userId === me.id || t.id === me.id);
    if(team) myData.profile = team;
    myData.payments = _dbArr('payments').filter(p => p.team === team?.id || p.teamId === team?.id);
  }
  myData.events = (DB.events||[]).filter(e => e.createdBy === me.id);

  const json = JSON.stringify(myData, null, 2);
  const blob = new Blob([json], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'mydata_' + me.id + '_' + new Date().toISOString().slice(0,10) + '.json';
  a.click();
  addAuditLog('data_export', me.name + ' が個人データをエクスポート');
  saveDB();
  toast('個人データをエクスポートしました','s');
}

// 自分の同意ログ表示
function showMyConsentLog(){
  const me = DB.currentUser;
  if(!me){ toast('ログインが必要です','e'); return; }
  const logs = (DB.consentLog||[]).filter(c => c.userId === me.id);
  let h = '<div style="max-height:400px;overflow-y:auto">';
  if(!logs.length){
    h += '<div class="text-muted text-sm text-center" style="padding:24px">同意履歴はありません</div>';
  } else {
    logs.reverse().forEach(l => {
      const icon = l.type==='registration'?'📝':l.type==='data_deletion'?'🗑️':'📋';
      h += `<div style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid var(--b1);font-size:12px">
        <span style="font-size:16px">${icon}</span>
        <div style="flex:1"><div class="fw7">${l.type==='registration'?'利用規約への同意':l.type==='data_deletion'?'データ削除':l.type||'同意'}</div>
        <div class="text-xs text-muted">${(l.agreedAt||l.deletedAt||l.timestamp||'').slice(0,16).replace('T',' ')}</div></div>
      </div>`;
    });
  }
  h += '</div>';
  openM('📋 同意・データ処理履歴', h);
}

// 管理者用: 全ユーザー同意ログ
function showConsentLogAdmin(){
  if(DB.currentUser?.role!=='admin'){ toast('管理者権限が必要です','e'); return; }
  const logs = (DB.consentLog||[]).slice(-50).reverse();
  let h = '<div style="max-height:500px;overflow-y:auto">';
  if(!logs.length){
    h += '<div class="text-muted text-sm text-center" style="padding:24px">同意ログなし</div>';
  } else {
    logs.forEach(l => {
      const icon = l.type==='registration'?'📝':l.type==='data_deletion'?'🗑️':'📋';
      h += `<div style="display:flex;gap:10px;padding:8px 0;border-bottom:1px solid var(--b1);font-size:11px">
        <span style="font-size:14px">${icon}</span>
        <div style="flex:1">
          <div class="fw7">${sanitize(l.userName||l.userId||'不明',20)} <span class="badge b-gray" style="font-size:9px">${l.role||'--'}</span></div>
          <div class="text-xs text-muted">${l.type||'consent'} · ${(l.agreedAt||l.deletedAt||l.timestamp||'').slice(0,16).replace('T',' ')}</div>
        </div>
      </div>`;
    });
  }
  h += '</div>';
  openM('📋 全ユーザー同意ログ (' + (DB.consentLog||[]).length + '件)', h, true);
}

// 管理者用: GDPR削除パネル
function openAdminGDPRPanel(){
  if(DB.currentUser?.role!=='admin'){ toast('管理者権限が必要です','e'); return; }
  const allUsers = _getUsers().filter(u => u.role !== 'admin');
  let h = '<div style="margin-bottom:12px;font-size:12px;color:var(--txt3);line-height:1.6">ユーザーを選択して個人データを完全に削除します。この操作はGDPR「忘れられる権利」に基づきます。</div>';
  h += '<div style="margin-bottom:12px"><input class="input" placeholder="🔍 名前で検索…" oninput="filterGDPRUsers(this.value)" style="font-size:12px;height:36px"></div>';
  h += '<div id="gdpr-user-list" style="max-height:400px;overflow-y:auto">';
  const roleLabels = {coach:'コーチ',team:'チーム',player:'選手',parent:'保護者'};
  const roleColors = {coach:'var(--org)',team:'var(--blue)',player:'var(--teal)',parent:'#a855f7'};
  allUsers.forEach(u => {
    h += `<div class="gdpr-user-row" data-name="${(u.name||'').toLowerCase()}" style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--b1)">
      <div class="avi" style="background:${roleColors[u.role]||'var(--txt3)'};width:32px;height:32px;font-size:12px;flex-shrink:0">${(u.name||'?')[0]}</div>
      <div style="flex:1;min-width:0"><div class="fw7 text-sm">${sanitize(u.name||'--',20)}</div><div class="text-xs text-muted">${sanitize(u.email||'',24)}</div></div>
      <span class="badge" style="background:${roleColors[u.role]||'#888'}18;color:${roleColors[u.role]||'#888'};font-size:10px">${roleLabels[u.role]||u.role}</span>
      <button class="btn btn-ghost btn-xs" style="color:var(--red);border-color:rgba(239,68,68,.3);flex-shrink:0" onclick="closeM();adminDeleteUserAllData('${u.id}')">削除</button>
    </div>`;
  });
  h += '</div>';
  if(!allUsers.length) h += '<div class="text-muted text-sm text-center" style="padding:20px">削除対象のユーザーがいません</div>';
  openM('🛡️ GDPR データ削除パネル', h, true);
}
function filterGDPRUsers(q){
  const query = q.toLowerCase();
  document.querySelectorAll('.gdpr-user-row').forEach(r => {
    r.style.display = (r.getAttribute('data-name')||'').includes(query) ? 'flex' : 'none';
  });
}

// ================================================================
// Performance Monitor — パフォーマンス計測
// ================================================================
const Perf = {
  marks: {},
  start: function(label) { this.marks[label] = performance.now(); },
  end: function(label) {
    if (!this.marks[label]) return 0;
    var dur = Math.round(performance.now() - this.marks[label]);
    if (dur > 500) console.warn('[Perf] ' + label + ': ' + dur + 'ms (slow)');
    delete this.marks[label];
    return dur;
  }
};

// ================================================================
// Network Status — オフライン検知
// ================================================================
const NetStatus = {
  _online: navigator.onLine !== false,
  init: function() {
    var self = this;
    window.addEventListener('online', function() { self._online = true; self.notify(true); });
    window.addEventListener('offline', function() { self._online = false; self.notify(false); });
  },
  isOnline: function() { return this._online; },
  notify: function(online) {
    if (online) {
      toast('インターネット接続が復旧しました', 's');
    var ob = document.getElementById('offline-banner'); if(ob) ob.classList.remove('show');
    } else {
      toast('オフラインです。一部の機能が制限されます', 'e');
    var ob = document.getElementById('offline-banner'); if(ob) ob.classList.add('show');
    }
  }
};

// ================================================================
// Data Export Utility — データエクスポート
// ================================================================
const ExportUtil = {
  // CSV生成
  toCSV: function(headers, rows, filename) {
    var csv = [headers.map(function(h){ return '"' + String(h).replace(/"/g,'""') + '"'; }).join(',')];
    for (var i = 0; i < rows.length; i++) {
      csv.push(rows[i].map(function(v){ return '"' + String(v||'').replace(/"/g,'""') + '"'; }).join(','));
    }
    var blob = new Blob(['\uFEFF' + csv.join('\n')], {type:'text/csv;charset=utf-8;'});
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename || 'export.csv';
    a.click();
    URL.revokeObjectURL(a.href);
    toast('CSVをダウンロードしました', 's');
  },
  
  // JSON エクスポート（バックアップ）
  toJSON: function(data, filename) {
    var blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename || 'backup.json';
    a.click();
    URL.revokeObjectURL(a.href);
    toast('データをエクスポートしました', 's');
  },
  
  // ユーザーデータバックアップ
  backupMyData: function() {
    if (!DB.currentUser) { toast('ログインしてください', 'e'); return; }
    var uid = DB.currentUser.id;
    var role = DB.currentUser.role;
    var data = {
      exportedAt: new Date().toISOString(),
      user: DB.currentUser,
      role: role
    };
    if (role === 'player') {
      var me = DB.players.find(function(p){return p.id===uid;});
      data.profile = me;
      data.meals = DB.meals;
      data.mealHistory = DB.mealHistory;
      data.trainingLog = DB.trainingLog;
      data.bodyLog = DB.bodyLog;
      data.conditionLog = DB.conditionLog;
    } else if (role === 'team') {
      data.team = DB.teams.find(function(t){return t.email===DB.currentUser.email;});
      data.players = DB.players.filter(function(p){return p.team===data.team?.id;});
      data.events = DB.events.filter(function(e){return e.teamId===data.team?.id;});
      data.inventory = (DB.inventory||[]).filter(function(i){return i.teamId===data.team?.id;});
    }
    this.toJSON(data, 'bukatsu_backup_' + new Date().toISOString().slice(0,10) + '.json');
  }
};

// ================================================================
// Rate Limiter — レート制限（フロントエンド）
// ================================================================
const RateLimit = {
  _actions: {},
  
  // action: アクション名, maxCount: 最大回数, windowMs: 時間窓(ms)
  check: function(action, maxCount, windowMs) {
    var now = Date.now();
    if (!this._actions[action]) this._actions[action] = [];
    // 古いエントリを削除
    this._actions[action] = this._actions[action].filter(function(t){ return now - t < windowMs; });
    if (this._actions[action].length >= maxCount) {
      return false; // レート制限超過
    }
    this._actions[action].push(now);
    return true;
  },
  
  // ラッパー: レート制限付きでアクション実行
  throttle: function(action, maxCount, windowMs, fn) {
    if (!this.check(action, maxCount, windowMs)) {
      toast('操作が頻繁すぎます。しばらくお待ちください。', 'e');
      return false;
    }
    fn();
    return true;
  }
};


// ═══════════════════════════════════════════════════════════
//  CHART UTILITIES  ─  全ページ共通グラフヘルパー
// ═══════════════════════════════════════════════════════════
const _chartRegistry = {};  // canvas id → Chart インスタンス

function renderChart(canvasId, config) {
  // 既存インスタンスを破棄してから再生成（無限増殖防止）
  if (_chartRegistry[canvasId]) {
    try { _chartRegistry[canvasId].destroy(); } catch(e){}
    delete _chartRegistry[canvasId];
  }
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  // スケルトンオーバーレイを除去
  var skelOverlay = canvas.parentNode.querySelector('.skel-overlay');
  if (skelOverlay) skelOverlay.remove();
  const chart = new Chart(canvas, config);
  _chartRegistry[canvasId] = chart;
  return chart;
}

// Chart.js グローバルデフォルト設定
if (typeof Chart !== 'undefined') {
