// Security hardening
// ================================================================
// ① セッションタイムアウト（30分無操作で自動ログアウト）
// ================================================================
(function(){
  const TIMEOUT_MS = 30 * 60 * 1000; // 30分
  let _timer = null;
  function resetTimer(){
    clearTimeout(_timer);
    if(!DB.currentUser) return;
    _timer = setTimeout(()=>{
      if(!DB.currentUser) return;
      const name = DB.currentUser.name || '';
      addAuditLog('session_timeout', name + ' がセッションタイムアウト');
      DB.currentUser = null;
      saveDB();
      toast('⏰ 30分間操作がなかったためログアウトしました','w');
      location.reload();
    }, TIMEOUT_MS);
  }
  ['click','keydown','scroll','touchstart','mousemove'].forEach(ev => {
    document.addEventListener(ev, resetTimer, {passive:true});
  });
  resetTimer();
})();

// ================================================================
// ② パフォーマンスモニタリング
// ================================================================
window.addEventListener('load', () => {
  _runWhenIdle(() => {
    try {
      const perf = performance.getEntriesByType('navigation')[0];
      if(perf){
        const metrics = {
          dns: Math.round(perf.domainLookupEnd - perf.domainLookupStart),
          tcp: Math.round(perf.connectEnd - perf.connectStart),
          ttfb: Math.round(perf.responseStart - perf.requestStart),
          domLoad: Math.round(perf.domContentLoadedEventEnd - perf.startTime),
          fullLoad: Math.round(perf.loadEventEnd - perf.startTime),
        };
        // 3秒以上かかった場合に警告
        if(metrics.fullLoad > 3000){
        }
      }
    } catch(e){}
    // LCP (Largest Contentful Paint)
    try {
      new PerformanceObserver(list => {
        const entries = list.getEntries();
        const last = entries[entries.length-1];
        if(last) console.log('[Perf] LCP:', Math.round(last.startTime) + 'ms');
      }).observe({type:'largest-contentful-paint',buffered:true});
    } catch(e){}
  });
});

// ================================================================
// ③ キーボードショートカット
// ================================================================
document.addEventListener('keydown', (e) => {
  // モーダル中はEscapeで閉じる（既存のcloseM()を利用）
  if(e.key === 'Escape'){
    const modal = document.querySelector('.modal-bg');
    if(modal && typeof closeM === 'function') closeM();
    return;
  }
  // Ctrl/Cmd + K: グローバル検索
  if((e.ctrlKey || e.metaKey) && e.key === 'k'){
    e.preventDefault();
    if(typeof openGlobalSearch === 'function') {
      if(_gsearchOpen) closeGlobalSearch();
      else openGlobalSearch();
    }
  }
  // Ctrl/Cmd + S: データ保存
  if((e.ctrlKey || e.metaKey) && e.key === 's'){
    e.preventDefault();
    if(typeof saveDB === 'function'){ saveDB(); toast('💾 データを保存しました','s'); }
  }
});

// ================================================================
// ④ 同期インジケーター
// ================================================================
document.addEventListener('DOMContentLoaded', function(){
  var el = document.createElement('div');
  el.className = 'sync-indicator';
  el.id = 'sync-indicator';
  el.innerHTML = '<span class="sync-dot" style="background:var(--org)"></span><span>同期中...</span>';
  if(document.body) document.body.appendChild(el);

  // saveDB呼び出し時に表示
  setTimeout(function(){
    if(typeof window.saveDB !== 'function') return;
    var origFn = window.saveDB;
    window.saveDB = function(){
      var indicator = document.getElementById('sync-indicator');
      if(indicator) indicator.classList.add('show');
      origFn.apply(this, arguments);
      setTimeout(function(){
        if(indicator) indicator.classList.remove('show');
      }, 1500);
    };
  }, 3000);
});

// ================================================================
// ================================================================
if(location.hostname !== 'localhost' && location.hostname !== '127.0.0.1'){
  const _origLog = console.log;
  const _origWarn = console.warn;
  console.log = function(){
    // [Perf]と[Login]は残す、それ以外は抑制
    if(arguments[0] && typeof arguments[0] === 'string' &&
       (arguments[0].includes('[Perf]') || arguments[0].includes('[Login]') || arguments[0].includes('[SW]'))){
      _origLog.apply(console, arguments);
    }
  };
  // console.warn と console.error はそのまま保持
}

// ================================================================
// ⑥ ダークモード自動検知（初回訪問時のみ）
// ================================================================
(function(){
  if(DB.settings?.theme) return; // 既にユーザーが選択済み
  if(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches){
    document.documentElement.setAttribute('data-theme','dark');
  }
  // OS設定変更時にも追従（ユーザー選択がない場合のみ）
  window.matchMedia?.('(prefers-color-scheme: dark)')?.addEventListener('change', (e) => {
    if(DB.settings?.theme) return;
    document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
  });
})();

// ================================================================
// ⑦ 管理者フルバックアップ・リストア
// ================================================================
function adminFullBackup(){
  if(DB.currentUser?.role !== 'admin'){ toast('管理者権限が必要です','e'); return; }
  const backup = {
    version: '3.3.0',
    exportedAt: new Date().toISOString(),
    exportedBy: DB.currentUser.name,
    data: {}
  };
  PERSIST_FIELDS.forEach(k => { backup.data[k] = DB[k]; });
  backup.data.auditLog = DB.auditLog || [];
  backup.data.consentLog = DB.consentLog || [];
  const json = JSON.stringify(backup, null, 2);
  const sizeKB = Math.round(json.length / 1024);
  const blob = new Blob([json], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'bukatsu_fullbackup_' + new Date().toISOString().slice(0,10) + '.json';
  a.click();
  addAuditLog('full_backup', '管理者フルバックアップ実行 ('+sizeKB+'KB)');
  toast('📦 フルバックアップを保存しました ('+sizeKB+'KB)','s');
}

function adminRestoreBackup(){
  if(DB.currentUser?.role !== 'admin'){ toast('管理者権限が必要です','e'); return; }
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async (e) => {
    const file = e.target.files?.[0];
    if(!file) return;
    try {
      const text = await file.text();
      const backup = JSON.parse(text);
      if(!backup.version || !backup.data){
        toast('無効なバックアップファイルです','e');
        return;
      }
      // 確認ダイアログ
      const h = `<div style="text-align:center">
        <div style="font-size:40px;margin-bottom:12px">⚠️</div>
        <div class="fw7" style="margin-bottom:8px">データの復元</div>
        <div class="text-sm text-muted" style="margin-bottom:4px">バックアップ日時: ${new Date(backup.exportedAt).toLocaleString('ja-JP')}</div>
        <div class="text-sm text-muted" style="margin-bottom:4px">バージョン: ${backup.version}</div>
        <div class="text-sm text-muted" style="margin-bottom:12px">作成者: ${backup.exportedBy||'不明'}</div>
        <div style="background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);border-radius:8px;padding:10px;font-size:12px;color:var(--red);margin-bottom:16px">
          現在のデータは全て上書きされます。この操作は取り消せません。
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-ghost btn-sm flex-1" onclick="closeM()">キャンセル</button>
          <button class="btn btn-sm flex-1" style="background:var(--red);color:#fff" onclick="_executeRestore(window._pendingRestore);closeM()">復元する</button>
        </div>
      </div>`;
      window._pendingRestore = backup;
      openM('🔄 データ復元', h, true);
    } catch(err){
      toast('ファイルの読み込みに失敗しました','e');
    }
  };
  input.click();
}

function _executeRestore(backup){
  if(!backup?.data) return;
  addAuditLog('restore_start', '管理者データ復元開始');
  PERSIST_FIELDS.forEach(k => {
    if(backup.data[k] !== undefined) DB[k] = backup.data[k];
  });
  if(backup.data.auditLog) DB.auditLog = backup.data.auditLog;
  if(backup.data.consentLog) DB.consentLog = backup.data.consentLog;
  addAuditLog('restore_complete', '管理者データ復元完了 (v'+backup.version+' from '+backup.exportedAt+')');
  saveDB();
  toast('✅ データを復元しました。ページを再読み込みします...','s');
  setTimeout(()=>location.reload(), 1500);
  window._pendingRestore = null;
}

// ================================================================
// ⑧ 接続状態のリアルタイム監視
// ================================================================
(function(){
  let _fbConnected = false;
  setInterval(()=>{
    const isOnline = navigator.onLine;
    const hasFbAuth = !!window._fbAuth?.currentUser;
    const newState = isOnline && hasFbAuth;
    if(newState !== _fbConnected){
      _fbConnected = newState;
    }
  }, 10000);
})();

// ================================================================
// ⑨ API通信リトライ + タイムアウト
// ================================================================
const _origFetch = window.fetch;
window.fetch = async function(url, opts = {}){
  // API_BASEへのリクエストのみリトライ対象
  const isApi = typeof url === 'string' && url.includes(API_BASE) && API_BASE;
  if(!isApi) return _origFetch.call(this, url, opts);

  const MAX_RETRIES = 2;
  const TIMEOUT_MS = 15000;

  for(let attempt = 0; attempt <= MAX_RETRIES; attempt++){
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
      const res = await _origFetch.call(this, url, {...opts, signal: controller.signal});
      clearTimeout(timeoutId);

      // 5xx はリトライ、4xx はそのまま返す
      if(res.status >= 500 && attempt < MAX_RETRIES){
        await new Promise(r => setTimeout(r, 1000 * (attempt+1)));
        continue;
      }
      return res;
    } catch(e){
      if(e.name === 'AbortError'){
      }
      if(attempt < MAX_RETRIES){
        await new Promise(r => setTimeout(r, 1000 * (attempt+1)));
        continue;
      }
      throw e;
    }
  }
};

// ================================================================
// ⑩ window.open 安全ラッパー（noopener強制）
// ================================================================
const _origOpen = window.open;
window.open = function(url, target, features){
  // 外部URLには必ずnoopenerを付与
  if(target === '_blank' || !target){
    return _origOpen.call(this, url, '_blank', 'noopener,noreferrer' + (features ? ','+features : ''));
  }
  return _origOpen.call(this, url, target, features);
};

// ================================================================
// ⑪ 機密データのlocalStorage難読化
// ================================================================
(function(){
  const SENSITIVE_KEYS = ['mc_login_attempts','mc_users_v1','mycoach_users_v1','mc_admin_pin_hash'];
  const _k = location.hostname.split('.').reverse().join('');

  // 簡易XOR難読化（暗号化ではないが平文よりは安全）
  function _obf(str){
    try {
      return btoa(str.split('').map((c,i) => String.fromCharCode(c.charCodeAt(0) ^ _k.charCodeAt(i % _k.length))).join(''));
    } catch(e){ return str; }
  }
  function _deobf(str){
    try {
      const decoded = atob(str);
      return decoded.split('').map((c,i) => String.fromCharCode(c.charCodeAt(0) ^ _k.charCodeAt(i % _k.length))).join('');
    } catch(e){ return str; }
  }

  const _origSet = localStorage.setItem.bind(localStorage);
  const _origGet = localStorage.getItem.bind(localStorage);
  localStorage.setItem = function(key, val){
    if(SENSITIVE_KEYS.includes(key)){
      return _origSet(key, '_obf:' + _obf(val));
    }
    return _origSet(key, val);
  };
  localStorage.getItem = function(key){
    const raw = _origGet(key);
    if(raw && raw.startsWith('_obf:') && SENSITIVE_KEYS.includes(key)){
      return _deobf(raw.slice(5));
    }
    return raw;
  };
})();

// ================================================================
// ⑫ Subresource Integrity チェック（CDN改ざん検知）
// ================================================================
window.addEventListener('load', () => {
  _runWhenIdle(() => {
    document.querySelectorAll('script[src*="cdnjs.cloudflare.com"]').forEach(el => {
      if(!el.integrity && !el.dataset.sriChecked){
        el.dataset.sriChecked = 'warned';
      }
    });
  });
});

// ================================================================
// ⑬ コピーペースト保護（パスワード欄）
// ================================================================
document.addEventListener('DOMContentLoaded', () => {
  // パスワード入力欄へのペースト警告
  document.addEventListener('paste', (e) => {
    const target = e.target;
    if(target?.type === 'password'){
      // ペースト自体は許可（パスワードマネージャー対応）
      // ただし手動ペーストの場合は監査ログ
      if(typeof addAuditLog === 'function'){
        addAuditLog('paste_password', 'パスワード欄へのペースト検知', {field: target.id||'unknown'});
      }
    }
  });
});

// ================================================================
// ⑭ フォーム自動入力攻撃防止
// ================================================================
(function(){
  // 不可視のhoneypot fieldを検知
  document.addEventListener('submit', (e) => {
    const form = e.target;
    if(!form || form.tagName !== 'FORM') return;
    const honeypot = form.querySelector('[name="hp_field"], [name="website"], .hp-field');
    if(honeypot && honeypot.value){
      e.preventDefault();
      if(typeof addAuditLog === 'function'){
        addAuditLog('bot_blocked', 'ボットフォーム送信をブロック');
      }
    }
  });
})();

// ================================================================
// ⑮ デバッグツール検知（本番のみ）
// ================================================================
if(location.hostname !== 'localhost' && location.hostname !== '127.0.0.1'){
  // DevTools open検知（コンソール経由のデータ窃取を監査）
  let _devToolsOpen = false;
  const _devCheck = setInterval(() => {
    const threshold = 160;
    const isOpen = (window.outerWidth - window.innerWidth > threshold) ||
                   (window.outerHeight - window.innerHeight > threshold);
    if(isOpen && !_devToolsOpen){
      _devToolsOpen = true;
      if(typeof addAuditLog === 'function'){
        addAuditLog('devtools_open', '開発者ツールが開かれました');
      }
    } else if(!isOpen && _devToolsOpen){
      _devToolsOpen = false;
    }
  }, 3000);
}

// ================================================================
// ⑯ グローバルエラーハンドラ（スタックトレース漏洩防止 + 構造化ログ）
// ================================================================
window.addEventListener('error', function(e) {
  if(typeof addAuditLog === 'function') addAuditLog('js_error', (e.message||'').slice(0,100));
  if(typeof ErrorTracker !== 'undefined') ErrorTracker.capture('runtime', (e.message||'').slice(0,100), {file:(e.filename||'').slice(-40), line:e.lineno});
});
window.addEventListener('unhandledrejection', function(e) {
  if(typeof addAuditLog === 'function') addAuditLog('promise_error', String(e.reason||'').slice(0,100));
  if(typeof ErrorTracker !== 'undefined') ErrorTracker.capture('promise', String(e.reason||'').slice(0,100));
  e.preventDefault();
});

// ================================================================
// ⑰ コンテキストメニュー制限（本番のみ・ソース閲覧抑止）
// ================================================================
if(location.hostname !== 'localhost' && location.hostname !== '127.0.0.1'){
  document.addEventListener('contextmenu', function(e){
    // input/textarea上では許可（コピペ用）
    var t = e.target;
    if(t && (t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.isContentEditable)) return;
    e.preventDefault();
  });
  // Ctrl+U / Ctrl+S / F12 を抑制
  document.addEventListener('keydown', function(e){
    if((e.ctrlKey||e.metaKey) && (e.key==='u'||e.key==='U'||e.key==='s'||e.key==='S')){e.preventDefault();}
    if(e.key==='F12'){e.preventDefault();}
  });
}

// ================================================================
// ⑱ グローバル変数の隠蔽（window経由のデータアクセス防止）
// ================================================================
(function(){
  // 重要な内部変数をenumerable:falseに設定
  var _hideProps = ['_fbAuth','_fbDB','_fbFn','_fbUidCache','_photoState','_aiParsedMeals','_sysData','_pinAttempts'];
  _hideProps.forEach(function(prop){
    if(window.hasOwnProperty(prop)){
      try {
        var val = window[prop];
        Object.defineProperty(window, prop, {value:val, writable:true, enumerable:false, configurable:false});
      } catch(e){}
    }
  });
})();
