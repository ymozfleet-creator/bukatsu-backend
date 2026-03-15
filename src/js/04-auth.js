// 04 - 認証: show/switchAuth, PIN, パスワードハッシュ, ログイン, 登録, Google, 削除
// getMyKey/getMyCoach/getMyTeam → see REQUEST MATCHING SECTION
function show(id) {
  const map={loader:'flex',landing:'block',auth:'flex',onboarding:'flex',app:'block','page-legal':'block'};
  ['loader','landing','auth','onboarding','app','page-legal'].forEach(i=>{
    const el=document.getElementById(i);
    if(el) el.style.display=i===id?(map[i]||'block'):'none';
  });
}
function showLanding(){show('landing');window.scrollTo({top:0,behavior:'smooth'})}
function showLegal(t){show('page-legal');document.getElementById('legal-body').innerHTML=t==='terms'?termsHTML():t==='tokusho'?tokushoHTML():t==='contact'?contactHTML():privacyHTML();window.scrollTo({top:0})}

// ==================== AUTH ====================
let loginRole='team',regRole='team',sigSigned=false;
function selRole(r,btn){loginRole=r;document.querySelectorAll('#role-tabs-l .role-tab').forEach(b=>b.classList.remove('active'));btn.classList.add('active');}
function selRegRole(r,btn){regRole=r;document.querySelectorAll('#auth-register .role-tab').forEach(b=>b.classList.remove('active'));btn.classList.add('active');['team','coach','player','parent'].forEach(x=>{const el=document.getElementById('reg-'+x);if(el)el.style.display=x===r?'block':'none'});}
function switchAuth(v){document.getElementById('auth-login').style.display=v==='login'?'block':'none';document.getElementById('auth-register').style.display=v==='register'?'block':'none'}

// ==================== 新登録フロー ====================

// ロールカード選択
function selectRegRole(r){
  regRole = r;
  const colors = {team:'#f97316', coach:'#0ea5e9', player:'#00cfaa', parent:'#a855f7', alumni:'#64748b'};
  const labels = {team:'チーム管理者', coach:'コーチ・指導者', player:'選手', parent:'保護者', alumni:'OBOG（卒業生）'};
  // 全カードリセット
  ['team','coach','player','parent','alumni'].forEach(x=>{
    const el = document.getElementById('rcard-'+x);
    if(!el) return;
    el.style.borderColor = 'rgba(255,255,255,.1)';
    el.style.background = 'rgba(255,255,255,.04)';
  });
  // 選択カードをハイライト
  const sel = document.getElementById('rcard-'+r);
  if(sel){
    const c = colors[r];
    sel.style.borderColor = c;
    sel.style.background = `${c}15`;
  }
  // 次へボタンを有効化
  const btn = document.getElementById('reg-role-next');
  if(btn){ btn.disabled = false; btn.style.opacity = '1'; }
}

// カードクリックで即Step2へ（ワンタップ）
function selectRegRoleAndNext(r){
  selectRegRole(r);
  // カード選択アニメ後に次ステップへ
  const colors = {team:'#f97316', coach:'#0ea5e9', player:'#00cfaa', parent:'#a855f7'};
  const c = colors[r] || 'var(--org)';
  const card = document.getElementById('rcard-'+r);
  if(card){ card.style.borderColor=c; card.style.background=c+'15'; }
  setTimeout(()=>goToRegStep2(), 200);
}

// ロール選択 → フォーム入力へ
function goToRegStep2(){
  if(!regRole){ toast('立場を選択してください','e'); return; }
  const labels = {team:'チームを登録', coach:'コーチとして登録', player:'選手として登録', parent:'保護者として登録', alumni:'OBOGとして登録'};
  const colors = {team:'#f97316', coach:'#0ea5e9', player:'#00cfaa', parent:'#a855f7', alumni:'#64748b'};
  const icons  = {team:'🏟️', coach:'🏆', player:'⚽', parent:'👨‍👩‍👧', alumni:'🎓'};
  document.getElementById('reg-step-role').style.display = 'none';
  document.getElementById('reg-step-form').style.display = 'block';
  const sp = document.getElementById('auth-social-proof');
  if(sp) sp.style.display = 'none';
  const titleEl = document.getElementById('reg-form-title');
  if(titleEl) titleEl.textContent = labels[regRole] || '情報を入力';
  const badge = document.getElementById('reg-role-badge');
  if(badge){
    badge.textContent = (icons[regRole]||'') + ' ' + {team:'チーム',coach:'コーチ',player:'選手',parent:'保護者',alumni:'OBOG'}[regRole];
    badge.style.background = colors[regRole]+'22';
    badge.style.color = colors[regRole];
    badge.style.border = '1px solid '+colors[regRole]+'44';
  }
  renderRegDynamicForm(regRole);
  const vp = document.getElementById('reg-value-prop');
  if(vp) vp.style.display = 'none';
  setTimeout(()=>{
    const first = document.querySelector('#reg-dynamic-form input');
    if(first) first.focus();
  }, 100);
}

// ロール選択に戻る
function backToRoleSelect(){
  document.getElementById('reg-step-role').style.display = 'block';
  document.getElementById('reg-step-form').style.display = 'none';
  // ロール選択に戻ったらsocial proofを表示
  const sp = document.getElementById('auth-social-proof');
  if(sp) sp.style.display = 'flex';
}

// ロール別入力フォーム（最小限の必須項目のみ）
function renderRegDynamicForm(role){
  const container = document.getElementById('reg-dynamic-form');
  if(!container) return;

  const cfg = {
    team: { label:'チーム名', ph:'例：FC Tokyo Youth', note:'' },
    coach: { label:'お名前（氏名）', ph:'例：田中 雄一', note:'' },
    player: { label:'お名前（氏名）', ph:'例：佐藤 太郎', note:'',
      extra:`<div style="margin-bottom:14px">
        <label style="font-size:12px;font-weight:600;color:rgba(255,255,255,.6);display:block;margin-bottom:6px">招待コード <span style="color:#f97316">*</span></label>
        <input id="rf-code" type="text" placeholder="例：FCT001" autocomplete="off" maxlength="10"
          style="width:100%;padding:12px 14px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:10px;color:#fff;font-size:16px;font-weight:700;letter-spacing:3px;text-transform:uppercase;outline:none;box-sizing:border-box"
          onfocus="this.style.borderColor='#f97316'" onblur="this.style.borderColor='rgba(255,255,255,.1)'" oninput="this.value=this.value.toUpperCase()">
        <div style="font-size:10px;color:rgba(255,255,255,.3);margin-top:4px">チーム管理者から発行されたコード</div>
      </div>`,
    },
    parent: { label:'保護者のお名前', ph:'例：佐藤 一郎', note:'',
      extra:`<div style="margin-bottom:14px">
        <label style="font-size:12px;font-weight:600;color:rgba(255,255,255,.6);display:block;margin-bottom:6px">招待コード <span style="color:#f97316">*</span></label>
        <input id="rf-code" type="text" placeholder="例：FCT001" autocomplete="off" maxlength="10"
          style="width:100%;padding:12px 14px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:10px;color:#fff;font-size:16px;font-weight:700;letter-spacing:3px;text-transform:uppercase;outline:none;box-sizing:border-box"
          onfocus="this.style.borderColor='#f97316'" onblur="this.style.borderColor='rgba(255,255,255,.1)'" oninput="this.value=this.value.toUpperCase()">
        <div style="font-size:10px;color:rgba(255,255,255,.3);margin-top:4px">チーム管理者から発行されたコード</div>
      </div>`,
    },
    alumni: { label:'お名前（氏名）', ph:'例：山田 太郎', note:'',
      extra:`<div style="margin-bottom:14px">
        <label style="font-size:12px;font-weight:600;color:rgba(255,255,255,.6);display:block;margin-bottom:6px">招待コード <span style="color:#f97316">*</span></label>
        <input id="rf-code" type="text" placeholder="例：T123456" autocomplete="off" maxlength="10"
          style="width:100%;padding:12px 14px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:10px;color:#fff;font-size:16px;font-weight:700;letter-spacing:3px;text-transform:uppercase;outline:none;box-sizing:border-box"
          onfocus="this.style.borderColor='#64748b'" onblur="this.style.borderColor='rgba(255,255,255,.1)'" oninput="this.value=this.value.toUpperCase()">
        <div style="font-size:10px;color:rgba(255,255,255,.3);margin-top:4px">チーム管理者から発行されたOBOG招待コード</div>
      </div>
      <div style="padding:14px;background:rgba(100,116,139,.08);border-radius:12px;margin-bottom:14px">
        <div style="font-size:12px;font-weight:700;color:rgba(255,255,255,.7);margin-bottom:10px">🎓 OBOG情報（あとから編集可能）</div>
        <div style="margin-bottom:10px">
          <label style="font-size:11px;font-weight:600;color:rgba(255,255,255,.5);display:block;margin-bottom:4px">卒業年度</label>
          <input id="rf-grad-year" type="number" min="1970" max="2030" placeholder="例：2020"
            style="width:100%;padding:10px 12px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:8px;color:#fff;font-size:15px;outline:none;box-sizing:border-box"
            onfocus="this.style.borderColor='#64748b'" onblur="this.style.borderColor='rgba(255,255,255,.1)'">
        </div>
        <div style="margin-bottom:10px">
          <label style="font-size:11px;font-weight:600;color:rgba(255,255,255,.5);display:block;margin-bottom:4px">現在の職業</label>
          <input id="rf-job" type="text" placeholder="例：エンジニア、営業、教員" maxlength="30"
            style="width:100%;padding:10px 12px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:8px;color:#fff;font-size:14px;outline:none;box-sizing:border-box"
            onfocus="this.style.borderColor='#64748b'" onblur="this.style.borderColor='rgba(255,255,255,.1)'">
        </div>
        <div>
          <label style="font-size:11px;font-weight:600;color:rgba(255,255,255,.5);display:block;margin-bottom:4px">会社・組織名（任意）</label>
          <input id="rf-company" type="text" placeholder="例：株式会社〇〇" maxlength="30"
            style="width:100%;padding:10px 12px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:8px;color:#fff;font-size:14px;outline:none;box-sizing:border-box"
            onfocus="this.style.borderColor='#64748b'" onblur="this.style.borderColor='rgba(255,255,255,.1)'">
        </div>
      </div>`,
    },
  };
  const c = cfg[role] || cfg.team;

  container.innerHTML = `
    <div style="margin-bottom:16px">
      <label style="font-size:12px;font-weight:600;color:rgba(255,255,255,.6);display:block;margin-bottom:6px">${c.label} <span style="color:#f97316">*</span></label>
      <input id="rf-name" type="text" placeholder="${c.ph}" autocomplete="name"
        style="width:100%;padding:12px 14px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:10px;color:#fff;font-size:15px;outline:none;box-sizing:border-box"
        onfocus="this.style.borderColor='#f97316'" onblur="this.style.borderColor='rgba(255,255,255,.1)'">
    </div>
    ${c.extra||''}
  `;
  const noteEl = document.getElementById('reg-agree-note');
  if(noteEl) noteEl.textContent = c.note;
}

// パスワード強度インジケーター
function updatePwStrength(pw){
  const fill = document.getElementById('pw-strength-fill');
  const label = document.getElementById('pw-strength-label');
  if(!fill||!label) return;
  let score=0;
  if(pw.length>=8) score++;
  if(/[A-Z]/.test(pw)) score++;
  if(/[0-9]/.test(pw)) score++;
  if(/[^A-Za-z0-9]/.test(pw)) score++;
  const configs=[
    {w:'0%',bg:'transparent',t:''},
    {w:'25%',bg:'#ef4444',t:'弱い'},
    {w:'50%',bg:'#f59e0b',t:'普通'},
    {w:'75%',bg:'#3b82f6',t:'強い'},
    {w:'100%',bg:'#22c55e',t:'非常に強い'},
  ];
  const cfg=configs[score]||configs[0];
  fill.style.width=cfg.w; fill.style.background=cfg.bg;
  label.textContent=cfg.t; label.style.color=cfg.bg;
}

function syncLoginEmail(v){ /* メールは自由入力 */ }

// 登録フォーム: 同意チェックボックス
let regAgreed = false;
function toggleRegAgree(){
  regAgreed = !regAgreed;
  const chk = document.getElementById('reg-agree-check');
  const wrap = document.getElementById('reg-agree-wrap');
  if(chk){
    chk.style.background = regAgreed ? 'var(--org)' : 'transparent';
    chk.style.borderColor = regAgreed ? 'var(--org)' : 'rgba(255,255,255,.25)';
    chk.innerHTML = regAgreed ? '<svg width="11" height="11" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>' : '';
  }
  if(wrap) wrap.style.borderColor = regAgreed ? 'rgba(249,115,22,.4)' : 'rgba(255,255,255,.08)';
}


// ============================================================
// 本番認証: doLogin / doRegister
// パスワードはSHA-256でハッシュ化して保存（平文保存なし）
// ============================================================

// SHA-256ハッシュ（Web Crypto API + 純粋JSフォールバック）
// file://プロトコルではcrypto.subtleが使えないためフォールバックを実装
// ── パスワードハッシュ（PBKDF2 + ユーザー別ソルト）──
async function _hashPassword(pw, email){
  const salt = 'bukatsu_' + (email || '').toLowerCase().trim();
  // PBKDF2（Web Crypto API使用、100,000回反復）
  if(typeof crypto !== 'undefined' && crypto.subtle){
    try{
      const enc = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']);
      const bits = await crypto.subtle.deriveBits({
        name: 'PBKDF2',
        salt: enc.encode(salt),
        iterations: 100000,
        hash: 'SHA-256'
      }, keyMaterial, 256);
      return 'pbkdf2$' + Array.from(new Uint8Array(bits)).map(b=>b.toString(16).padStart(2,'0')).join('');
    }catch(e){}
  }
  // フォールバック: SHA-256（既存互換）
  return await _sha256Legacy(pw);
}
// 既存ハッシュ検証（旧SHA-256方式との互換性維持）
async function _verifyPassword(pw, email, storedHash){
  if(!storedHash || storedHash === 'firebase') return storedHash === 'firebase';
  // PBKDF2ハッシュの場合
  if(storedHash.startsWith('pbkdf2$')){
    const newHash = await _hashPassword(pw, email);
    return newHash === storedHash;
  }
  // 旧SHA-256ハッシュの場合（移行互換）
  const legacyHash = await _sha256Legacy(pw);
  return legacyHash === storedHash;
}
// 旧方式SHA-256（既存ユーザー互換用）
async function _sha256Legacy(str){
  const data = str + '__mc2026';
  if(typeof crypto !== 'undefined' && crypto.subtle){
    try{
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
      return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
    }catch(e){}
  }
  return _sha256Pure(data);
}
// 旧方式互換のエイリアス
async function _sha256(str){ return _sha256Legacy(str); }
// 純粋JS SHA-256（RFC 6234準拠）
function _sha256Pure(s){
  function rr(n,r){return(n>>>r)|(n<<(32-r));}
  const K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  let H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  const msg=unescape(encodeURIComponent(s));
  const ml=msg.length;
  let ba=[];
  for(let i=0;i<ml;i++)ba.push(msg.charCodeAt(i));
  ba.push(0x80);
  while((ba.length%64)!==56)ba.push(0);
  const bl=ml*8;
  ba.push((bl/0x100000000|0)>>>24,(bl/0x100000000|0)>>16&0xff,(bl/0x100000000|0)>>8&0xff,(bl/0x100000000|0)&0xff,bl>>>24,bl>>16&0xff,bl>>8&0xff,bl&0xff);
  for(let i=0;i<ba.length;i+=64){
    const W=[];
    for(let j=0;j<16;j++)W.push((ba[i+j*4]<<24)|(ba[i+j*4+1]<<16)|(ba[i+j*4+2]<<8)|ba[i+j*4+3]);
    for(let j=16;j<64;j++){const s0=rr(W[j-15],7)^rr(W[j-15],18)^(W[j-15]>>>3);const s1=rr(W[j-2],17)^rr(W[j-2],19)^(W[j-2]>>>10);W.push((W[j-16]+s0+W[j-7]+s1)>>>0);}
    let[a,b,c,d,e,f,g,h]=H;
    for(let j=0;j<64;j++){const S1=rr(e,6)^rr(e,11)^rr(e,25);const ch=(e&f)^(~e&g);const T1=(h+S1+ch+K[j]+W[j])>>>0;const S0=rr(a,2)^rr(a,13)^rr(a,22);const maj=(a&b)^(a&c)^(b&c);const T2=(S0+maj)>>>0;h=g;g=f;f=e;e=(d+T1)>>>0;d=c;c=b;b=a;a=(T1+T2)>>>0;}
    H[0]=(H[0]+a)>>>0;H[1]=(H[1]+b)>>>0;H[2]=(H[2]+c)>>>0;H[3]=(H[3]+d)>>>0;H[4]=(H[4]+e)>>>0;H[5]=(H[5]+f)>>>0;H[6]=(H[6]+g)>>>0;H[7]=(H[7]+h)>>>0;
  }
  return H.map(n=>n.toString(16).padStart(8,'0')).join('');
}

// 登録済みユーザー一覧をlocalStorageから取得
function _getUsers(){ try{ return JSON.parse(localStorage.getItem('mycoach_users_v1')||'[]'); }catch(e){return[];} }
function _saveUsers(u){ localStorage.setItem('mycoach_users_v1', JSON.stringify(u)); }

// デモ機能は本番では無効
function showDemoModal(){ showAuth('register'); }
function doQuickLogin(){ showAuth('register'); }

// ── ログイン ──────────────────────────────────
function togglePw(inputId, btn){
  var i=document.getElementById(inputId);
  if(!i)return;
  i.type=i.type==='password'?'text':'password';
  btn.innerHTML=i.type==='password'?'<i class="fas fa-eye" style="font-size:14px"></i>':'<i class="fas fa-eye-slash" style="font-size:14px"></i>';
}
async function doLogin(){
  if(!RateLimit.check('login', 5, 60000)){ toast('ログイン試行回数の上限です。1分後に再試行してください。','e'); return; }
  var emailCheck = Validate.email(document.getElementById('l-email')?.value);
  if (!emailCheck.ok) { toast(emailCheck.msg, 'e'); return; }
  // ── ブルートフォース対策 ──
  const limit = checkLoginLimit();
  if(limit.locked){
    toast(`ログイン試行が多すぎます。${limit.remain}分後に再試行してください。`,'e');
    return;
  }

  const emailEl = document.getElementById('l-email');
  const pwEl    = document.getElementById('l-pw');
  const btn     = document.querySelector('#auth-login .btn-login-submit') || document.querySelector('#auth-login .btn-primary');
  const email   = (emailEl?.value||'').trim().toLowerCase();
  const pw      = pwEl?.value||'';

  // ── バリデーション ──
  if(!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){
    emailEl && (emailEl.style.borderColor='#ef4444');
    toast('正しいメールアドレスを入力してください','e');
    emailEl?.focus(); return;
  }
  if(!pw || pw.length < 8){
    pwEl && (pwEl.style.borderColor='#ef4444');
    toast('パスワードは8文字以上で入力してください','e');
    pwEl?.focus(); return;
  }

  // ── ローディング開始 ──
  if(btn){ btn.disabled=true; btn.innerHTML='<span style="opacity:.7">確認中...</span>'; }

  // ── 登録済みユーザー検索（ローカル → Firebase） ──
  const users = _getUsers();
  // FIX: Find LATEST user with matching email (not first/oldest)
  // Sort matching users by createdAt descending, take newest
  const matchingUsers = users.filter(u => u.email === email);
  let found = null;
  if(matchingUsers.length > 1) {
    // Multiple registrations with same email → use newest
    matchingUsers.sort((a,b) => (b.createdAt||'') > (a.createdAt||'') ? 1 : -1);
    found = matchingUsers[0];
    // Deduplicate: remove older entries with same email
    const deduped = users.filter(u => u.email !== email);
    deduped.push(found);
    _saveUsers(deduped);
  } else {
    found = matchingUsers[0] || null;
  }

  // ローカルにユーザーがない場合、Firebase経由で認証
  if(!found && !window._fbReady){
    for(let _w=0; _w<30 && !window._fbReady; _w++) await new Promise(r=>setTimeout(r,100));
  }
  if(!found && window._fbReady){
    let fbLoginOk = false;
    // 方法1: Firebase Auth
    if(window._fbAuth){
      try {
        const cred = await window._fbFn.signInWithEmailAndPassword(window._fbAuth, email, pw);
        const userDoc = await window._fbFn.getDoc(window._fbFn.doc(window._fbDB, 'users', cred.user.uid));
        if(userDoc.exists()){
          const u = userDoc.data();
          found = { id:u.id, role:u.role, name:u.name, email:u.email, createdAt:u.createdAt, pwHash:'firebase' };
          users.push(found);
          _saveUsers(users);
          await _loadFromFirestore(cred.user.uid);
          _fbUidCache = cred.user.uid;
          fbLoginOk = true;
        }
      } catch(e){}
    }
    // 方法2: Firestoreのusers_by_emailコレクションから直接検索
    if(!fbLoginOk){
      try {
        const emailKey = email.replace(/[.]/g,'_');
        const userDoc = await window._fbFn.getDoc(window._fbFn.doc(window._fbDB, 'users_by_email', emailKey));
        if(userDoc.exists()){
          const u = userDoc.data();
          // パスワードハッシュ照合（PBKDF2/旧SHA-256両対応）
          const pwOk = await _verifyPassword(pw, email, u.pwHash);
          if(pwOk){
            found = { id:u.id, role:u.role, name:u.name, email:u.email, createdAt:u.createdAt, pwHash:u.pwHash };
            users.push(found);
            _saveUsers(users);
            // Firebase Authアカウントがあればデータ復元
            if(u.fbUid){
              await _loadFromFirestore(u.fbUid);
            }
            fbLoginOk = true;
          } else {
            if(btn){ btn.disabled=false; btn.innerHTML='ログイン'; }
            pwEl && (pwEl.style.borderColor='#ef4444');
            toast('パスワードが間違っています','e');
            return;
          }
        }
      } catch(e){}
    }
    // どちらも見つからない
    if(!found){
      if(btn){ btn.disabled=false; btn.innerHTML='ログイン'; }
      emailEl && (emailEl.style.borderColor='#ef4444');
      toast('このメールアドレスは登録されていません。新規登録をお試しください。','e');
      return;
    }
  }

  if(!found){
    if(btn){ btn.disabled=false; btn.innerHTML='ログイン'; }
    emailEl && (emailEl.style.borderColor='#ef4444');
    addAuditLog('login_fail','未登録メールでログイン試行',{email:email.slice(0,3)+'***'});
    toast('このメールアドレスは登録されていません。新規登録をお試しください。','e');
    return;
  }

  // ローカル認証（Firebaseフォールバック済みの場合はスキップ）
  if(found.pwHash !== 'firebase'){
    const pwOk = await _verifyPassword(pw, email, found.pwHash);
    if(!pwOk){
      if(btn){ btn.disabled=false; btn.innerHTML='ログイン'; }
      pwEl && (pwEl.style.borderColor='#ef4444');
      recordLoginFail();
      addAuditLog('login_fail','パスワード不一致: '+sanitize(found.name||'',15),{userId:found.id});
      toast('パスワードが間違っています','e');
      return;
    }
    // 旧ハッシュ→PBKDF2に自動アップグレード
    if(!found.pwHash.startsWith('pbkdf2$')){
      const newHash = await _hashPassword(pw, email);
      found.pwHash = newHash;
      const users = _getUsers();
      const u = users.find(x=>x.id===found.id);
      if(u){ u.pwHash = newHash; _saveUsers(users); }
    }
    // Firebase Auth にもサインイン（アプリ初期化前に完了を待つ）
    if(window._fbReady && window._fbAuth){
      try {
        const cred = await window._fbFn.signInWithEmailAndPassword(window._fbAuth, email, pw);
        _fbUidCache = cred.user.uid;
        // メール確認チェック
        if(!cred.user.emailVerified){
          try {
            await window._fbFn.sendEmailVerification(cred.user);
          } catch(ev){}
          DB._emailNotVerified = true;
        } else {
          DB._emailNotVerified = false;
        }
        await _loadFromFirestore(cred.user.uid);
      } catch(e){
        try {
          const cred = await window._fbFn.createUserWithEmailAndPassword(window._fbAuth, email, pw);
          _fbUidCache = cred.user.uid;
          await window._fbFn.setDoc(window._fbFn.doc(window._fbDB,'users',cred.user.uid),{
            id:found.id, role:found.role, name:found.name, email, createdAt:found.createdAt
          });
          await _syncToFirestore();
        } catch(e2){ 
          // Firebase Auth完全失敗 → ユーザーに警告
          window._fbAuthFailed = true;
          setTimeout(function(){
            toast('⚠️ クラウド同期に接続できませんでした。データはこの端末にのみ保存されます。','w');
          }, 2000);
        }
      }
    }
  }

    // ✅ 認証成功 — 登録済みユーザーのrolでアプリを起動
    DB.currentUser = {
      role:      found.role,
      name:      found.name,
      email:     found.email,
      id:        found.id,
      createdAt: found.createdAt,
    };
    // Session security: record login time
    if(!DB.settings) DB.settings = {};
    DB.settings.loginTimestamp = new Date().toISOString();
    // FIX: Reset AI history and load per-user data
    if(typeof aiHistory !== 'undefined') aiHistory = [];
    if(typeof loadAIHistory === 'function') loadAIHistory();
    // ── 保護者: リンク情報を復元 ──
    if(found.role==='parent'){
      DB.currentUser.linkedPlayers=found.linkedPlayers||[];
      DB.currentUser.linkedPlayerId=found.linkedPlayerId||null;
      DB.currentUser.linkedTeamId=found.linkedTeamId||null;
      // players配列からもguardianIdで逆引き復元
      const _lc=DB.players.find(p=>p.guardianId===found.id);
      if(_lc){
        if(!DB.currentUser.linkedPlayers.includes(_lc.id))DB.currentUser.linkedPlayers.push(_lc.id);
        if(!DB.currentUser.linkedPlayerId)DB.currentUser.linkedPlayerId=_lc.id;
        if(!DB.currentUser.linkedTeamId)DB.currentUser.linkedTeamId=_lc.team||null;
      }
      // pendingParentTeamIdも復元
      if(!DB.pendingParentTeamId && DB.currentUser.linkedTeamId) DB.pendingParentTeamId=DB.currentUser.linkedTeamId;
    }
    // ロールに対応するDB内オブジェクトが存在するか確認
    const _checkProfile = (role, uid) => {
      if(role==='coach')  return !!DB.coaches.find(c=>c.id===uid);
      if(role==='team')   return !!DB.teams.find(t=>t.id===uid);
      if(role==='player') return !!DB.players.find(p=>p.id===uid);
      if(role==='parent') return true;
      if(role==='admin')  return true;
      return false;
    };
    let profileOk = _checkProfile(found.role, found.id);

    // プロフィールが見つからない場合、Firestoreから再取得を試みる
    if(!profileOk && window._fbReady){
      const _uid = window._fbAuth?.currentUser?.uid || _fbUidCache;
      if(_uid){
        await _loadFromFirestore(_uid);
        profileOk = _checkProfile(found.role, found.id);
      }
    }
    // それでも見つからない場合、users_by_emailからfbUidで再取得
    if(!profileOk && window._fbReady){
      try {
        const emailKey = found.email.replace(/[.]/g,'_');
        const uDoc = await window._fbFn.getDoc(window._fbFn.doc(window._fbDB,'users_by_email',emailKey));
        if(uDoc.exists()){
          const fbUid = uDoc.data().fbUid;
          if(fbUid){
            await _loadFromFirestore(fbUid);
            _fbUidCache = fbUid;
            profileOk = _checkProfile(found.role, found.id);
          }
        }
      } catch(e){}
    }
    // 最終手段: 3秒待ってもう一度試す
    if(!profileOk && window._fbReady){
      await new Promise(r => setTimeout(r, 3000));
      const _uid2 = window._fbAuth?.currentUser?.uid || _fbUidCache;
      if(_uid2){
        await _loadFromFirestore(_uid2);
        profileOk = _checkProfile(found.role, found.id);
      }
    }

    if(!profileOk){
      // Firestoreにデータがない場合、最低限のプロフィールを自動作成してアプリに入れる
      const now = new Date().toLocaleString('ja-JP');
      if(found.role==='coach' && !DB.coaches.find(c=>c.id===found.id)){
        DB.coaches.push({id:found.id, name:found.name, email:found.email, sport:'',spec:'',area:'',
          price:0, rating:0, reviews:0, exp:0, bio:'', avail:true, team:null, verified:false,
          color:'#'+Math.floor(Math.random()*0xffffff).toString(16).padStart(6,'0'), createdAt:now});
      }
      if(found.role==='team' && !DB.teams.find(t=>t.id===found.id)){
        DB.teams.push({id:found.id, name:found.name, email:found.email, sport:'',area:'',
          members:0, fee:0, coach:null, wins:0, losses:0,
          code:'T'+Date.now().toString().slice(-6), createdAt:now});
      }
      if(found.role==='player' && !DB.players.find(p=>p.id===found.id)){
        DB.players.push({id:found.id, name:found.name, email:found.email,
          team:null, pos:'', age:0, weight:0, height:0, status:'unpaid',
          guardian:'', guardianId:null, createdAt:now});
      }
      saveDB();
      toast('クラウドデータが見つかりません。プロフィールを再設定してください。','w');
    }

    clearLoginLimit();
    if(btn){ btn.disabled=false; btn.innerHTML='ログイン'; }
    window._needsFirestoreClear = false;
    
    // ── Firebase Auth必須: 未認証なら再試行 → 失敗ならブロック ──
    if(!window._fbAuth?.currentUser && window._fbReady){
      let authOk = false;
      // 試行1: signIn
      try {
        const cred = await window._fbFn.signInWithEmailAndPassword(window._fbAuth, email, pw);
        _fbUidCache = cred.user.uid;
        await _loadFromFirestore(cred.user.uid);
        authOk = true;
      } catch(retryErr){
        // 試行2: create
        try {
          const cred = await window._fbFn.createUserWithEmailAndPassword(window._fbAuth, email, pw);
          _fbUidCache = cred.user.uid;
          await window._fbFn.setDoc(window._fbFn.doc(window._fbDB,'users',cred.user.uid),{
            id:found.id, role:found.role, name:found.name, email, createdAt:found.createdAt
          });
          authOk = true;
        } catch(createErr){
          console.error('[Login] Firebase Auth completely failed:', createErr.code);
        }
      }
      // Auth完全失敗 → ログインをブロック
      if(!authOk){
        toast('⚠️ サーバーに接続できません。インターネット接続を確認して再度お試しください。','e');
        DB.currentUser = null;
        return; // ← launchApp()を呼ばない！
      }
    }
    
    // ── Firebase Auth未接続（fbReady=false）の場合も待つ ──
    if(!window._fbReady){
      toast('⚠️ サーバー初期化中...少々お待ちください','w');
      let waited = 0;
      while(!window._fbReady && waited < 10000){
        await new Promise(r=>setTimeout(r,500));
        waited += 500;
      }
      if(!window._fbReady){
        toast('⚠️ サーバーに接続できません。ページを再読み込みしてください。','e');
        DB.currentUser = null;
        return;
      }
      // fbReady後にAuth
      if(!window._fbAuth?.currentUser){
        try {
          const cred = await window._fbFn.signInWithEmailAndPassword(window._fbAuth, email, pw);
          _fbUidCache = cred.user.uid;
          await _loadFromFirestore(cred.user.uid);
        } catch(e){
          try {
            const cred = await window._fbFn.createUserWithEmailAndPassword(window._fbAuth, email, pw);
            _fbUidCache = cred.user.uid;
          } catch(e2){
            toast('⚠️ サーバー認証に失敗しました。再度お試しください。','e');
            DB.currentUser = null;
            return;
          }
        }
      }
    }
    
    saveDB();
    launchApp();
}

// ── 新規登録 ──────────────────────────────────
function doRegister(){
  if(!RateLimit.check('register', 3, 60000)){ toast('登録の試行回数が上限です。しばらくお待ちください。','e'); return; }
  // Input validation
  var emailCheck = Validate.email(document.getElementById('reg-email')?.value);
  if (!emailCheck.ok) { toast(emailCheck.msg, 'e'); return; }
  var passCheck = Validate.password(document.getElementById('reg-pw')?.value);
  if (!passCheck.ok) { toast(passCheck.msg, 'e'); return; }
  var nameCheck = Validate.name(document.getElementById('rf-name')?.value);
  if (!nameCheck.ok) { toast(nameCheck.msg, 'e'); return; }
  const emailEl = document.getElementById('reg-email');
  const pwEl    = document.getElementById('reg-pw');
  const nameEl  = document.getElementById('rf-name');
  const btn     = document.getElementById('do-register-btn');
  const email   = (emailEl?.value||'').trim().toLowerCase();
  const pw      = pwEl?.value||'';
  const name    = (nameEl?.value||'').trim();

  if(!email||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ emailEl&&(emailEl.style.borderColor='#ef4444'); toast('正しいメールアドレスを入力してください','e'); emailEl?.focus(); return; }
  if(pw.length<8){ pwEl&&(pwEl.style.borderColor='#ef4444'); toast('パスワードは8文字以上で入力してください','e'); pwEl?.focus(); return; }
  if(!name){ nameEl&&(nameEl.style.borderColor='#ef4444'); toast('お名前を入力してください','e'); nameEl?.focus(); return; }
  if(!regAgreed){
    const wrap=document.getElementById('reg-agree-wrap');
    if(wrap){wrap.style.borderColor='#ef4444';wrap.style.animation='shake .3s';setTimeout(()=>wrap.style.animation='',400);}
    toast('利用規約への同意が必要です','e'); return;
  }

  // メール重複チェック
  if(_getUsers().some(u=>u.email===email)){ emailEl&&(emailEl.style.borderColor='#ef4444'); toast('このメールアドレスはすでに登録されています','e'); return; }

  // 招待コード必須チェック（選手・保護者・OBOG）
  const codeEl = document.getElementById('rf-code');
  if((regRole==='player'||regRole==='parent'||regRole==='alumni') && codeEl){
    const code = (codeEl.value||'').trim().toUpperCase();
    if(!code){
      codeEl.style.borderColor='#ef4444';
      toast('チームの招待コードを入力してください','e');
      codeEl.focus(); return;
    }
    const team = DB.teams.find(t=>t.code===code);
    if(!team){
      codeEl.style.borderColor='#ef4444';
      toast('この招待コードは存在しません。チーム管理者にご確認ください。','e');
      codeEl.focus(); return;
    }
  }

  if(btn){ btn.disabled=true; btn.textContent='登録中...'; }
  _hashPassword(pw, email).then(pwHash=>{
    const uid = genId(regRole);
    const now = new Date().toLocaleString('ja-JP');
    const users = _getUsers();
    users.push({ id:uid, role:regRole, name, email, pwHash, createdAt:now });
    _saveUsers(users);
    // Firestoreにユーザー情報を保存（クロスデバイス用）
    const _fbRegister = async () => {
      if(!window._fbReady){
        for(let _w=0; _w<50 && !window._fbReady; _w++) await new Promise(r=>setTimeout(r,100));
      }
      if(!window._fbReady) { return; }
      try {
        // Firebase Authに登録
        const cred = await window._fbFn.createUserWithEmailAndPassword(window._fbAuth, email, pw);
        const fbUid = cred.user.uid;
        // Firestoreにユーザー情報保存
        await window._fbFn.setDoc(window._fbFn.doc(window._fbDB,'users',fbUid),{
          id:uid, role:regRole, name, email, pwHash, createdAt:now
        });
        // メールでも引けるように別コレクションにも保存
        await window._fbFn.setDoc(window._fbFn.doc(window._fbDB,'users_by_email',email.replace(/[.]/g,'_')),{
          id:uid, role:regRole, name, email, pwHash, createdAt:now, fbUid
        });
        _fbUidCache = fbUid;
        // 即座に初回同期
        await _syncToFirestore();
      } catch(e){
        // Auth失敗でもFirestoreに直接保存を試みる（匿名書き込み）
        try {
          await window._fbFn.setDoc(window._fbFn.doc(window._fbDB,'users_by_email',email.replace(/[.]/g,'_')),{
            id:uid, role:regRole, name, email, pwHash, createdAt:now
          });
        } catch(e2){ }
      }
    };
    _fbRegister();

    DB.pendingRole   = regRole;
    DB.pendingEmail  = email;
    DB.pendingName   = name;
    DB.pendingUserId = uid;

    // 招待コード処理（選手・保護者・OBOG）- 上で既にバリデーション済み
    const codeElPost = document.getElementById('rf-code');
    if(codeElPost && codeElPost.value.trim()){
      const code = codeElPost.value.trim().toUpperCase();
      const team = DB.teams.find(t=>t.code===code);
      if(team){
        DB.pendingTeamId = team.id;
        DB.pendingTeamCode = code;
      }
    }

    // OBOG追加情報の保存
    if(regRole === 'alumni'){
      if(!DB.pendingProfile) DB.pendingProfile = {};
      const gradEl = document.getElementById('rf-grad-year');
      const jobEl = document.getElementById('rf-job');
      const companyEl = document.getElementById('rf-company');
      if(gradEl) DB.pendingProfile.gradYear = parseInt(gradEl.value) || 0;
      if(jobEl) DB.pendingProfile.currentJob = (jobEl.value || '').trim();
      if(companyEl) DB.pendingProfile.company = (companyEl.value || '').trim();
    }

    if(btn){ btn.disabled=false; btn.textContent='🚀 アカウントを作成する（無料）'; }
    startOnboarding();
  });
}
// ── Googleログイン ──
async function doGoogleLogin(){
  if(!window._fbReady || !window._fbAuth){
    toast('Firebase初期化中です。数秒後にもう一度お試しください','w');
    return;
  }
  try {
    const fn = window._fbFn;
    const provider = new fn.GoogleAuthProvider();
    const result = await fn.signInWithPopup(window._fbAuth, provider);
    const fbUser = result.user;
    const email = fbUser.email;
    const name = fbUser.displayName || email.split('@')[0];
    
    // Firestoreにユーザーデータがあるか確認
    const userDoc = await fn.getDoc(fn.doc(window._fbDB, 'users', fbUser.uid));
    if(userDoc.exists()){
      // 既存ユーザー → データ読み込んでログイン
      const u = userDoc.data();
      await _loadFromFirestore(fbUser.uid);
      _fbUidCache = fbUser.uid;
      DB.currentUser = { role:u.role, name:u.name, email:u.email, id:u.id, createdAt:u.createdAt };
      if(u.role==='parent'){
        DB.currentUser.linkedPlayers=u.linkedPlayers||[];
        DB.currentUser.linkedPlayerId=u.linkedPlayerId||null;
        DB.currentUser.linkedTeamId=u.linkedTeamId||null;
      }
      const users = _getUsers();
      if(!users.find(x=>x.email===u.email)){
        users.push({id:u.id, role:u.role, name:u.name, email:u.email, pwHash:'google', createdAt:u.createdAt});
        _saveUsers(users);
      }
      saveDB();
      launchApp();
      return;
    }
    
    // 新規ユーザー → ロール選択してオンボーディングへ
    DB.pendingEmail = email;
    DB.pendingName = name;
    DB.pendingUserId = genId('g');
    _fbUidCache = fbUser.uid;
    // ユーザーをusersテーブルに仮登録
    const users = _getUsers();
    if(!users.find(x=>x.email===email)){
      users.push({id:DB.pendingUserId, role:'player', name, email, pwHash:'google', createdAt:new Date().toLocaleString('ja-JP')});
      _saveUsers(users);
    }
    toast('Googleアカウントで認証しました。立場を選んで登録してください！','s');
    switchAuth('register');
    // メール・名前を自動入力
    setTimeout(()=>{
      const emailEl = document.getElementById('reg-email');
      const nameEl = document.getElementById('rf-name');
      if(emailEl) emailEl.value = email;
      if(nameEl) nameEl.value = name;
    }, 300);
  } catch(e){
    if(e.code === 'auth/popup-closed-by-user'){
      toast('ログインがキャンセルされました','i');
    } else if(e.code === 'auth/popup-blocked'){
      toast('ポップアップがブロックされました。ブラウザの設定を確認してください','e');
    } else {
      toast('Googleログインに失敗しました','e');
    }
  }
}

// ── パスワード変更（ログイン中）──
async function changePasswordLoggedIn(){
  const oldPw = document.getElementById('cpw-old')?.value || '';
  const newPw = document.getElementById('cpw-new')?.value || '';
  const confirmPw = document.getElementById('cpw-confirm')?.value || '';
  
  if(!oldPw){ toast('現在のパスワードを入力してください','e'); return; }
  if(newPw.length < 8){ toast('新しいパスワードは8文字以上にしてください','e'); return; }
  if(newPw !== confirmPw){ toast('新しいパスワードが一致しません','e'); return; }
  if(oldPw === newPw){ toast('現在と同じパスワードです','e'); return; }
  
  const btn = document.querySelector('#cpw-btn');
  if(btn){ btn.disabled = true; btn.textContent = '変更中...'; }
  
  try {
    const email = DB.currentUser?.email || '';
    
    // 1. Firebase Authのパスワード変更
    if(window._fbAuth?.currentUser){
      const fn = window._fbFn;
      // 再認証
      const credential = fn.EmailAuthProvider.credential(email, oldPw);
      await fn.reauthenticateWithCredential(window._fbAuth.currentUser, credential);
      // パスワード更新
      await fn.updatePassword(window._fbAuth.currentUser, newPw);
    }
    
    // 2. ローカルのパスワードハッシュも更新
    const users = _getUsers();
    const me = users.find(u => u.id === DB.currentUser?.id);
    if(me && me.pwHash !== 'google'){
      const newHash = await _hashPassword(newPw, email);
      me.pwHash = newHash;
      _saveUsers(users);
    }
    
    // 3. Firestoreのusers_by_emailも更新
    if(window._fbReady && window._fbFn){
      try {
        const emailKey = email.replace(/[.]/g, '_');
        const fn = window._fbFn;
        const newHash2 = await _hashPassword(newPw, email);
        await fn.setDoc(fn.doc(window._fbDB, 'users_by_email', emailKey), {pwHash: newHash2}, {merge:true});
      } catch(e){}
    }
    
    addAuditLog('password_change', DB.currentUser?.name + ' がパスワードを変更');
    closeM();
    toast('✅ パスワードを変更しました','s');
  } catch(e){
    if(e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential'){
      toast('現在のパスワードが正しくありません','e');
    } else if(e.code === 'auth/requires-recent-login'){
      toast('セキュリティのため再ログインが必要です。一度ログアウトしてください','w');
    } else {
      toast('パスワード変更に失敗しました','e');
    }
  } finally {
    if(btn){ btn.disabled = false; btn.textContent = '🔑 変更する'; }
  }
}

function openChangePasswordModal(){
  openM('🔑 パスワードを変更', `
    <div style="display:grid;gap:14px">
      <div class="form-group"><label class="label">現在のパスワード</label><input type="password" id="cpw-old" class="input" placeholder="現在のパスワード" autocomplete="current-password"></div>
      <div class="form-group"><label class="label">新しいパスワード（8文字以上）</label><input type="password" id="cpw-new" class="input" placeholder="新しいパスワード" autocomplete="new-password"></div>
      <div class="form-group"><label class="label">新しいパスワード（確認）</label><input type="password" id="cpw-confirm" class="input" placeholder="もう一度入力" autocomplete="new-password"></div>
      <button id="cpw-btn" class="btn btn-primary w-full" onclick="changePasswordLoggedIn()">🔑 変更する</button>
      <div style="font-size:11px;color:var(--txt3);text-align:center">※ Firebase認証とローカルの両方のパスワードが更新されます</div>
    </div>
  `);
}

// ── アカウント削除（改善版）──
async function _doDeleteAccountFull(){
  const inp = document.getElementById('del-confirm')?.value;
  if(inp !== '削除する'){ toast('「削除する」と入力してください','e'); return; }
  
  const uid = DB.currentUser?.id;
  const email = DB.currentUser?.email;
  const name = DB.currentUser?.name;
  const role = DB.currentUser?.role;
  if(!uid){ toast('ユーザー情報が取得できません','e'); return; }
  
  const btn = document.querySelector('#del-exec-btn');
  if(btn){ btn.disabled = true; btn.textContent = '削除中...'; }
  
  try {
    // 1. 監査ログに記録
    addAuditLog('account_delete', name + '(' + role + ') がアカウントを削除', {userId:uid, email});
    
    // 2. ローカルDBからユーザーデータを削除
    DB.coaches = DB.coaches.filter(c => c.id !== uid);
    DB.teams = DB.teams.filter(t => t.id !== uid);
    DB.players = DB.players.filter(p => p.id !== uid);
    // 関連する月謝・リクエスト・通知も削除
    DB.payments = (DB.payments||[]).filter(p => p.player !== uid);
    DB.requests = (DB.requests||[]).filter(r => r.coachId !== uid && r.teamId !== uid);
    DB.notifs = (DB.notifs||[]).filter(n => n.uid !== uid);
    // チーム紐づけ解除
    (DB.teams||[]).forEach(t => { if(t.coach === uid) t.coach = null; });
    DB.players.forEach(p => { if(p.guardianId === uid) p.guardianId = null; });
    
    // 3. usersテーブルから削除
    const users = _getUsers();
    const idx = users.findIndex(u => u.id === uid);
    if(idx >= 0) users.splice(idx, 1);
    _saveUsers(users);
    
    // 4. currentUserクリア
    DB.currentUser = null;
    saveDB();
    
    // 5. Firestoreから個人データ削除
    if(window._fbReady && window._fbAuth?.currentUser){
      const fn = window._fbFn;
      const fbUid = window._fbAuth.currentUser.uid;
      try {
        await fn.deleteDoc(fn.doc(window._fbDB, 'appdata', fbUid));
        await fn.deleteDoc(fn.doc(window._fbDB, 'users', fbUid));
        if(email){
          await fn.deleteDoc(fn.doc(window._fbDB, 'users_by_email', email.replace(/[.]/g, '_')));
        }
      } catch(e){}
      
      // 6. Firebase Authアカウント削除
      try {
        await fn.fbDeleteUser(window._fbAuth.currentUser);
      } catch(e){}
    }
    
    // 7. リスナー停止 & 画面遷移
    _stopAllListeners();
    closeM();
    show('landing');
    toast('アカウントを削除しました。ご利用ありがとうございました。','s');
  } catch(e){
    toast('削除中にエラーが発生しました','e');
    if(btn){ btn.disabled = false; btn.textContent = '🗑️ 削除する'; }
  }
}

// ── モバイルユーザーメニュー ──
function toggleMobileUserMenu(){
  var m=document.getElementById('mobile-user-menu');
  if(!m) return;
  var showing = m.style.display !== 'none';
  if(showing){ m.style.display='none'; return; }
  // ユーザー情報を更新
  var nameEl=document.getElementById('mu-name');
  var roleEl=document.getElementById('mu-role');
  var aviEl=document.getElementById('mu-avi');
  var RLABELS={admin:'事務局',team:'チーム管理者',coach:'コーチ',player:'選手',parent:'保護者'};
  if(nameEl) nameEl.textContent=DB.currentUser?.name||'';
  if(roleEl) roleEl.textContent=RLABELS[DB.currentUser?.role]||'';
  if(aviEl) aviEl.textContent=(DB.currentUser?.name||'?')[0];
  m.style.display='block';
  // 外側クリックで閉じる
  setTimeout(()=>{
    var _close=function(e){ if(!m.contains(e.target)&&!e.target.closest('#top-avi')){ closeMobileUserMenu(); document.removeEventListener('click',_close); }};
    document.addEventListener('click',_close);
  },10);
}
function closeMobileUserMenu(){
  var m=document.getElementById('mobile-user-menu');
  if(m) m.style.display='none';
}

function doLogout(){
  addAuditLog('logout', (DB.currentUser?.name||'') + ' がログアウト');
  _stopAllListeners();
  // 個人データのみクリア（共有データは残す）
  _localDirty = false;
  clearCurrentUserSession();
  if(window._fbAuth) window._fbFn.signOut(window._fbAuth).catch(()=>{});
  closeM();show('landing');toast('ログアウトしました','i');
}

// ──────────────────────────────────────
// パスワードリセット機能
// ──────────────────────────────────────
function showForgotPassword(){
  const emailEl = document.getElementById('l-email');
  const prefillEmail = emailEl?.value?.trim() || '';
  openM('パスワードをリセット', `
    <div style="margin-bottom:16px;font-size:13px;color:var(--txt3);line-height:1.7">
      登録時のメールアドレスを入力してください。<br>
      新しいパスワードを設定できます。
    </div>
    <div class="form-group">
      <label class="label">登録済みメールアドレス</label>
      <input class="input" id="fr-email" type="email" placeholder="your@email.com" value="${escHtml(prefillEmail)}">
    </div>
    <div class="form-group" id="fr-pw-group" style="display:none">
      <label class="label">新しいパスワード（8文字以上）</label>
      <input class="input" id="fr-new-pw" type="password" placeholder="新しいパスワード">
    </div>
    <div class="form-group" id="fr-pw-confirm-group" style="display:none">
      <label class="label">新しいパスワード（確認）</label>
      <input class="input" id="fr-new-pw2" type="password" placeholder="もう一度入力">
    </div>
    <div id="fr-step1-btn">
      <button class="btn btn-primary w-full" onclick="verifyResetEmail()">メールを確認する</button>
    </div>
    <div id="fr-step2-btn" style="display:none">
      <button class="btn btn-primary w-full" onclick="doResetPassword()">パスワードを変更する</button>
    </div>
  `);
}

function verifyResetEmail(){
  const email = (document.getElementById('fr-email')?.value||'').trim().toLowerCase();
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){
    toast('正しいメールアドレスを入力してください','e'); return;
  }
  const users = _getUsers();
  const found = users.find(u => u.email === email);
  if(!found){
    toast('このメールアドレスは登録されていません','e'); return;
  }
  // メール確認OK → 新パスワード入力欄を表示
  document.getElementById('fr-email').disabled = true;
  document.getElementById('fr-pw-group').style.display = 'block';
  document.getElementById('fr-pw-confirm-group').style.display = 'block';
  document.getElementById('fr-step1-btn').style.display = 'none';
  document.getElementById('fr-step2-btn').style.display = 'block';
  toast('メールアドレスを確認しました。新しいパスワードを設定してください。','s');
}

async function doResetPassword(){
  const email  = (document.getElementById('fr-email')?.value||'').trim().toLowerCase();
  const newPw  = document.getElementById('fr-new-pw')?.value || '';
  const newPw2 = document.getElementById('fr-new-pw2')?.value || '';
  if(newPw.length < 8){ toast('パスワードは8文字以上で入力してください','e'); return; }
  if(newPw !== newPw2){ toast('パスワードが一致しません','e'); return; }
  const users = _getUsers();
  const found = users.find(u => u.email === email);
  if(!found){ toast('エラーが発生しました。再度お試しください','e'); return; }
  const pwHash = await _hashPassword(newPw, email);
  found.pwHash = pwHash;
  _saveUsers(users);
  closeM();
  toast('パスワードを変更しました。新しいパスワードでログインしてください。','s');
  const emailEl = document.getElementById('l-email');
  if(emailEl) emailEl.value = email;
}

