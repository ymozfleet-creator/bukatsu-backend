// 05-onboarding.js — Onboarding
// ==================== ONBOARDING ====================
const OB_STEPS=['利用規約への同意','プロフィール設定','登録完了'];
let obStep=0,legalScrolled=[false,false],sigText='';
const agreeState={terms:false,privacy:false,age:false,sig:false};
let profileData={teamName:'',teamSport:'',teamArea:'',teamLevel:'',teamMembers:'',teamFee:'',teamIntro:'',teamImgUrl:'',
  coachName:'',coachSport:'',coachSpec:'',coachArea:'',coachExp:'',coachPrice:'',coachIntro:'',coachCertifications:'',coachImgUrl:'',
  playerName:'',playerPos:'',playerAge:'',playerHeight:'',playerWeight:'',playerIntro:'',playerImgUrl:''};

function startOnboarding(){window._isOnboarding=true;obStep=0;agreeState.terms=false;agreeState.privacy=false;agreeState.age=false;agreeState.sig=false;sigText='';show('onboarding');renderWizard();}
function renderWizard(){
  // Steps indicator
  const stepsEl=document.getElementById('wizard-steps');
  stepsEl.innerHTML=OB_STEPS.map((s,i)=>{
    const cls=i<obStep?'done':i===obStep?'active':'';
    const ico=i<obStep?'<i class="fa fa-check" style="font-size:10px"></i>':i+1;
    return `<div class="ws"><div class="ws-dot ${cls}">${ico}</div>${i<OB_STEPS.length-1?`<div class="ws-line ${i<obStep?'done':''}"></div>`:''}</div>`;
  }).join('');
  // Content
  const wc=document.getElementById('wizard-content');
  if(obStep===0){ wc.innerHTML=renderObTermsAndSign(); if(sigText){updateSig(sigText);} }
  else if(obStep===1) wc.innerHTML=renderObProfile();
  else wc.innerHTML=renderObDone();
  // Scroll listeners
  if(obStep===0||obStep===1){
    setTimeout(()=>{
      const ls=document.getElementById('legal-scroll-'+obStep);
      if(ls)ls.addEventListener('scroll',()=>{if(ls.scrollTop+ls.clientHeight>=ls.scrollHeight-20){legalScrolled[obStep]=true;checkLegalBtn(obStep)}});
    },100);
  }
}
function renderObTermsAndSign(){
  const role = DB.pendingRole || 'team';
  const isBiz = role === 'team' || role === 'coach'; // 手数料が発生するロール

  // ロール別の重要事項
  const points = isBiz ? [
    {bg:'#f97316', svg:'<path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>',
     t:'登録・マッチングは完全無料', d:'月謝・コーチ代の成立時のみ手数料10%。登録費・紹介料は0円。'},
    {bg:'#0ea5e9', svg:'<path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>',
     t:'決済はStripeで安全に管理', d:'カード情報は当社サーバーに保存されません。'},
    {bg:'#22c55e', svg:'<path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>',
     t:'選手の個人情報は許可制で保護', d:'コーチへの開示にはチームの許可＋コーチの誓約が必要です。'},
  ] : [
    {bg:'#22c55e', svg:'<path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>',
     t:'個人情報は安全に保護されます', d:'あなたの情報はチーム管理者の許可なく外部に開示されません。'},
    {bg:'#0ea5e9', svg:'<path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>',
     t:'トレーニング・食事データを記録', d:'記録したデータはコーチが指導に活用します。いつでも削除できます。'},
    {bg:'#f97316', svg:'<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>',
     t:'いつでも退会できます', d:'退会は設定画面からいつでも可能です。チーム管理者にご連絡ください。'},
  ];

  // ロール別の電子署名セクションの説明
  const sigNote = isBiz
    ? '部勝（ブカツ）利用規約・手数料規定・プライバシーポリシーへの同意として法的に記録されます'
    : '部勝（ブカツ）利用規約・プライバシーポリシーへの同意として記録されます';

  // 「18歳以上」チェックの表示（ビジネスロールのみ）
  const ageCheckHTML = isBiz ? `
    <div style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:rgba(59,100,180,.03);border:1.5px solid ${agreeState.age?'var(--grn)':'var(--bdr)'};border-radius:10px;cursor:pointer;transition:border-color .2s" onclick="toggleAgree('age',this)">
      <div id="chk-age" style="width:20px;height:20px;border-radius:6px;border:2px solid ${agreeState.age?'var(--grn)':'var(--bdr)'};background:${agreeState.age?'var(--grn)':'transparent'};flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all .15s">${agreeState.age?'<svg width="11" height="11" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>':''}</div>
      <div>
        <div style="font-size:13px;font-weight:600;color:var(--txt1)">18歳以上です（法人・団体としての利用を含む）</div>
        <div style="font-size:11px;color:var(--txt3);margin-top:2px">未成年の方は保護者の同意のもとご利用ください</div>
      </div>
    </div>` : '';

  return `<div style="text-align:center;margin-bottom:18px">
    <div style="display:inline-flex;align-items:center;gap:6px;background:rgba(249,115,22,.1);border:1px solid rgba(249,115,22,.25);border-radius:20px;padding:4px 14px;margin-bottom:10px">
      <span style="font-size:11px;font-weight:700;color:var(--org)">ステップ 1 / 3</span>
    </div>
    <div style="font-size:20px;font-weight:800;color:var(--txt1);margin-bottom:4px">利用規約への同意 ✍️</div>
    <div style="font-size:12px;color:var(--txt3)">${isBiz ? '3つの重要事項を確認してお名前を入力してください' : 'サービス内容を確認してお名前を入力してください'}</div>
  </div>

  <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:18px">
    ${points.map(p=>`<div style="display:flex;align-items:center;gap:12px;padding:11px 14px;background:${p.bg}12;border:1px solid ${p.bg}30;border-radius:10px">
      <div style="width:36px;height:36px;border-radius:10px;background:${p.bg};display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 2px 10px ${p.bg}50">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">${p.svg}</svg>
      </div>
      <div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:700;color:var(--txt1);margin-bottom:2px">${p.t}</div><div style="font-size:11px;color:var(--txt3);line-height:1.5">${p.d}</div></div>
    </div>`).join('')}
  </div>

  <div style="border-top:1px solid rgba(255,255,255,.08);padding-top:16px;margin-bottom:14px">
    <div style="font-size:13px;font-weight:700;color:var(--txt1);margin-bottom:4px">✍️ 電子署名（お名前の入力のみ）</div>
    <div style="font-size:11px;color:var(--txt3);margin-bottom:10px">${sigNote}</div>
    <input class="input" id="sig-name" placeholder="例：田中 太郎" oninput="updateSig(this.value)"
      style="font-size:16px;margin-bottom:10px;width:100%;box-sizing:border-box" value="${DB.pendingName||''}">
    <div id="sig-pad" style="background:rgba(59,100,180,.04);border:1.5px dashed ${sigText?'var(--grn)':'var(--bdr)'};border-radius:12px;padding:14px;text-align:center;min-height:52px;display:flex;align-items:center;justify-content:center;margin-bottom:12px;transition:border-color .2s">
      <span id="sig-display" style="font-family:cursive;font-size:22px;color:${sigText?'var(--grn)':'var(--txt3)'}">${sigText||'お名前をご入力ください'}</span>
    </div>
    <p style="font-size:10px;color:var(--txt3);line-height:1.6;margin-bottom:14px">この署名は、利用規約・プライバシーポリシーへの同意として法的に記録されます（${new Date().toLocaleDateString('ja-JP')}）</p>
  </div>

  <div style="margin-bottom:16px;display:flex;flex-direction:column;gap:8px">
    <div style="display:flex;align-items:flex-start;gap:10px;padding:12px 14px;background:rgba(59,100,180,.03);border:1.5px solid ${agreeState.terms?'var(--grn)':'var(--bdr)'};border-radius:10px;cursor:pointer;transition:border-color .2s" id="chk-terms-wrap" onclick="toggleAgree('terms',this)">
      <div id="chk-terms" style="width:20px;height:20px;border-radius:6px;border:2px solid ${agreeState.terms?'var(--grn)':'var(--bdr)'};background:${agreeState.terms?'var(--grn)':'transparent'};flex-shrink:0;display:flex;align-items:center;justify-content:center;margin-top:1px;transition:all .15s">${agreeState.terms?'<svg width="11" height="11" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>':''}</div>
      <div style="flex:1">
        <div style="font-size:13px;font-weight:600;color:var(--txt1)">利用規約・プライバシーポリシーに同意します</div>
        <div style="font-size:11px;color:var(--txt3);margin-top:3px"><a href="#" onclick="event.stopPropagation();showLegal('terms')" style="color:var(--org)">利用規約</a>・<a href="#" onclick="event.stopPropagation();showLegal('privacy')" style="color:var(--org)">プライバシーポリシー</a>をご確認ください</div>
      </div>
    </div>
    ${ageCheckHTML}
  </div>

  <button class="btn btn-primary w-full" id="ob-next-0"
    ${!(agreeState.terms && (isBiz ? agreeState.age : true) && sigText)?'disabled':''}
    onclick="obNext()" style="font-size:15px;padding:14px">同意して次へ →</button>
  <p style="text-align:center;font-size:11px;color:var(--txt3);margin-top:8px">次はプロフィール設定です（任意・後から変更OK）</p>
`}

function renderObTerms(){return renderObTermsAndSign();}
function renderObTermsOLD(){return`<div class="wizard-title" style="margin-bottom:4px">📋 利用規約・プライバシーポリシー</div>
<div class="wizard-sub" style="margin-bottom:20px">3つのポイントをご確認ください</div>
<div style="display:flex;flex-direction:column;gap:10px;margin-bottom:22px">
  ${[
    {bg:'#f97316', svg:'<path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>',c:'rgba(249,115,22,.15)',t:'登録・マッチングは完全無料',d:'月謝・コーチ代の10%が手数料。登録費・マッチング費は0円。'},
    {bg:'#0ea5e9', svg:'<path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>',c:'rgba(14,165,233,.12)',t:'個人情報は安全に管理',d:'SSL暗号化・Stripe決済。カード情報は当社サーバーに保存しません。'},
    {bg:'#22c55e', svg:'<path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>',c:'rgba(34,197,94,.1)',t:'選手情報は厳格に保護',d:'コーチへの開示はチームの許可＋コーチの誓約署名の両方が必要です。'},
  ].map(p=>`<div style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:${p.c};border:1px solid rgba(255,255,255,.07);border-radius:12px">
    <div style="width:38px;height:38px;border-radius:10px;background:${p.bg};display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 2px 10px ${p.bg}55">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="white">${p.svg}</svg>
    </div>
    <div><div style="font-size:13px;font-weight:700;color:var(--txt1);margin-bottom:2px">${p.t}</div><div style="font-size:11px;color:var(--txt3);line-height:1.5">${p.d}</div></div>
  </div>`).join('')}
</div>
<div class="agree-checks" style="margin-bottom:20px">
  <div class="checkbox-wrap" id="chk-terms-wrap" onclick="toggleAgree('terms',this)">
    <div class="checkbox ${agreeState.terms?'checked':''}" id="chk-terms">✓</div>
    <div>
      <div class="fw7 text-sm">利用規約・プライバシーポリシーに同意します</div>
      <div style="font-size:11px;color:var(--txt3);margin-top:3px">
        <a href="#" onclick="showLegal('terms')" style="color:var(--org)">利用規約</a>・<a href="#" onclick="showLegal('privacy')" style="color:var(--org)">プライバシーポリシー</a>の全文はリンクからご確認いただけます
      </div>
    </div>
  </div>
  <div class="checkbox-wrap" onclick="toggleAgree('age',this)" style="margin-top:10px">
    <div class="checkbox ${agreeState.age?'checked':''}" id="chk-age">✓</div>
    <div><div class="fw7 text-sm">18歳以上、または保護者の同意があります</div></div>
  </div>
</div>
<button class="btn btn-primary w-full" id="ob-next-0" ${!(agreeState.terms)?'disabled':''} onclick="obNext()">同意して次へ →</button>`}
function renderObPrivacy(){return`<div class="wizard-title">🔒 プライバシーポリシー</div><div class="wizard-sub">個人情報の取り扱いについてご確認ください。</div><div class="legal-scroll" id="legal-scroll-1">${privacyHTML()}</div><div class="agree-checks"><div class="checkbox-wrap" onclick="toggleAgree('privacy',this)"><div class="checkbox ${agreeState.privacy?'checked':''}" id="chk-priv">✓</div><div><div class="fw7 text-sm">プライバシーポリシーに同意します</div><div class="text-xs text-muted mt-4">個人情報の取り扱いについて理解し、同意します。</div></div></div><div class="checkbox-wrap" onclick="toggleAgree('age',this)"><div class="checkbox ${agreeState.age?'checked':''}" id="chk-age">✓</div><div><div class="fw7 text-sm">年齢確認（18歳以上 または 保護者の同意あり）</div><div class="text-xs text-muted mt-4">18歳以上、または保護者の同意を得ていることを確認します。</div></div></div></div><button class="btn btn-primary w-full" id="ob-next-1" ${!(agreeState.privacy&&agreeState.age)?'disabled':''} onclick="obNext()">→ 次へ（本人確認）</button>`}
function renderObSign(){return`<div class="wizard-title" style="margin-bottom:4px">✍️ 電子署名</div>
<div class="wizard-sub" style="margin-bottom:20px">お名前を入力するだけで完了します</div>
<div style="background:rgba(59,100,180,.03);border:1px solid rgba(59,100,180,.12);border-radius:12px;padding:14px;margin-bottom:18px;font-size:12px;color:var(--txt3)">
  <div style="display:flex;justify-content:space-between;padding:4px 0"><span>同意日時</span><b style="color:var(--txt2)">${new Date().toLocaleString('ja-JP',{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</b></div>
  <div style="display:flex;justify-content:space-between;padding:4px 0"><span>同意内容</span><b style="color:var(--txt2)">利用規約・プライバシーポリシー</b></div>
</div>
<div class="form-group">
  <label class="label" style="margin-bottom:8px">氏名を入力（電子署名として記録されます）</label>
  <input class="input" id="sig-name" placeholder="例：田中 太郎" oninput="updateSig(this.value)" style="font-size:16px">
</div>
<div class="sig-pad ${sigText?'signed':''}" id="sig-pad" style="margin-bottom:12px">
  <span class="sig-text" id="sig-display" style="font-family:cursive;font-size:24px;color:${sigText?'var(--green)':'var(--txt3)'}">${sigText||'お名前を上の入力欄に入力してください'}</span>
</div>
<p class="text-xs text-muted" style="line-height:1.7;margin-bottom:20px">署名は法的証明として安全に保存されます。</p>
<button class="btn btn-primary w-full" ${!sigText?'disabled':''} id="ob-sign-btn" onclick="obNext()">署名して次へ →</button>`}
const PREFS_SPORTS=[
  'サッカー','フットサル','野球','ソフトボール',
  'バスケットボール','バレーボール','テニス','ソフトテニス','卓球','バドミントン',
  '水泳','競泳','シンクロナイズドスイミング',
  '陸上競技','マラソン','駅伝','ハードル','投擲',
  'ラグビー','アメリカンフットボール','ハンドボール',
  '体操','新体操','トランポリン',
  '柔道','剣道','空手','レスリング','ボクシング',
  'バスケ3×3','スケートボード','自転車','トライアスロン',
  'ゴルフ','ボウリング','弓道','ウエイトリフティング',
  'チアリーディング','ダンス','ヨガ','フィットネス',
  'クライミング','サーフィン','スキー','スノーボード',
  'その他'
];
const PREFS_PREFS=['北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県','茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県','新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県','静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県','奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県','徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県','熊本県','大分県','宮崎県','鹿児島県','沖縄県'];

function obImgPreview(input,previewId,key){
  if(!input.files||!input.files[0])return;
  const file=input.files[0];
  if(file.size>5*1024*1024){toast('画像は5MB以下にしてください','e');return;}
  _compressPhotoAsync(file,300,0.7).then(compressed=>{
    const el=document.getElementById(previewId);
    if(el){el.innerHTML=`<img src="${compressed}" alt="プロフィール写真" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;}
    profileData[key]=compressed;
  }).catch(()=>toast('画像の読み込みに失敗しました','e'));
}
function chkProfBtn(){
  const role=DB.pendingRole||'team';
  const btn=document.getElementById('ob-prof-btn');
  if(!btn)return;
  let ok=false;
  if(role==='team') ok=!!(profileData.teamName&&profileData.teamSport&&profileData.teamArea);
  else if(role==='coach') ok=!!(profileData.coachName&&profileData.coachSport&&profileData.coachSpec&&profileData.coachArea&&profileData.coachPrice);
  else ok=!!(profileData.playerName&&profileData.playerPos);
  btn.disabled=!ok;
}

function renderObPayment(){return`
  <div style="text-align:center;margin-bottom:20px">
    <div style="font-size:13px;font-weight:700;color:var(--org);letter-spacing:.05em;text-transform:uppercase;margin-bottom:6px">ステップ 3/5</div>
    <div style="font-size:20px;font-weight:800;color:var(--txt1);margin-bottom:4px">💳 Stripe 決済設定</div>
    <div style="font-size:12px;color:var(--txt3)">本番稼働前にStripeアカウントとの連携が必要です</div>
  </div>

  <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:18px">
    ${[
      {ico:'💳',t:'クレジットカード',d:'VISA・Mastercard・JCB・AMEX対応'},
      {ico:'🏦',t:'銀行振込',d:'バーチャル口座への振込で自動消込'},
      {ico:'🏪',t:'コンビニ払い',d:'セブン・ファミマ・ローソン等で支払い可能'},
    ].map(m=>`<div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:rgba(99,91,255,.07);border:1px solid rgba(99,91,255,.15);border-radius:10px">
      <span style="font-size:20px;flex-shrink:0">${m.ico}</span>
      <div><div style="font-size:12px;font-weight:700;color:var(--txt1)">${m.t}</div><div style="font-size:11px;color:var(--txt3)">${m.d}</div></div>
    </div>`).join('')}
  </div>

  <div style="background:rgba(249,115,22,.06);border:1px solid rgba(249,115,22,.2);border-radius:12px;padding:14px;margin-bottom:16px">
    <div style="font-size:12px;font-weight:700;color:var(--org);margin-bottom:10px">📋 本番稼働時のStripe連携手順</div>
    <ol style="margin:0;padding-left:18px;font-size:12px;color:var(--txt2);line-height:2.1">
      <li><a href="https://dashboard.stripe.com/register" target="_blank" rel="noopener noreferrer" style="color:var(--org)">dashboard.stripe.com</a> でアカウント作成（無料）</li>
      <li>「開発者 → APIキー」から秘密鍵（シークレットキー）を取得</li>
      <li>バックエンドの <b>.env</b> に <code style="background:var(--surf2);padding:1px 5px;border-radius:4px;font-size:10px">STRIPE_SECRET_KEY</code> を設定してデプロイ</li>
      <li>Stripe側で Webhook URL <code style="background:var(--surf2);padding:1px 5px;border-radius:4px;font-size:10px">/api/webhook</code> を登録</li>
    </ol>
  </div>

  <div style="background:rgba(34,197,94,.06);border:1px solid rgba(34,197,94,.15);border-radius:10px;padding:11px 14px;margin-bottom:20px;font-size:12px;color:var(--txt2);line-height:1.7">
    <i class="fa fa-lock" style="color:var(--grn);margin-right:6px"></i>
    カード情報は当社サーバーに<b>一切保存されません</b>。PCI DSS Level 1 準拠のStripeが暗号化処理します。
  </div>

  <button class="btn btn-primary w-full" onclick="obNext()" style="font-size:15px;padding:14px">
    → 確認しました。次へ進む
  </button>
  <p style="text-align:center;font-size:11px;color:var(--txt3);margin-top:8px">
    Stripe連携はダッシュボードの設定からいつでも行えます
  </p>
`}

function renderPayForm(){
  return`<div class="stripe-card"><div class="flex items-center gap-8 mb-14" style="font-size:13px;color:var(--txt2)"><span style="font-size:18px">⚡</span> Stripe による安全な決済処理</div>
  <div class="form-group"><div class="card-field-label">カード番号</div><div class="card-field-group"><div class="card-field-val"><i class="fa fa-credit-card" style="color:var(--txt3)"></i><input class="input" style="background:none;border:none;box-shadow:none;padding:0;font-size:14px" placeholder="1234 5678 9012 3456"><div class="card-brands"><div class="card-brand" style="background:#1434CB;color:#fff">VISA</div><div class="card-brand" style="background:#FF5F00;color:#fff">MC</div><div class="card-brand" style="background:#fff;color:#f3f7fe;font-size:7px">JCB</div></div></div></div></div>
  <div class="grid-2"><div class="form-group"><div class="card-field-label">有効期限</div><div class="card-field-group"><input class="input" style="background:none;border:none;box-shadow:none;padding:0;font-size:14px" placeholder="MM / YY"></div></div><div class="form-group"><div class="card-field-label">CVC</div><div class="card-field-group"><div class="card-field-val"><i class="fa fa-lock" style="color:var(--txt3);font-size:12px"></i><input class="input" style="background:none;border:none;box-shadow:none;padding:0;font-size:14px" placeholder="•••"></div></div></div></div>
  <div class="form-group"><div class="card-field-label">カード名義人（半角ローマ字）</div><div class="card-field-group"><input class="input" style="background:none;border:none;box-shadow:none;padding:0;font-size:14px" placeholder="TARO YAMADA"></div></div></div>`
}

function renderObDone(){
  const roleName={team:'チーム管理者',coach:'コーチ',player:'選手',parent:'保護者'}[DB.pendingRole||'team']||'ユーザー';
  const isTeamOrCoach = DB.pendingRole==='team'||DB.pendingRole==='coach';
  // ロール別のウェルカムメッセージ
  const nextSteps = {
    team: ['コーチを探してマッチングしよう', '月謝の設定をしよう', '選手を招待しよう'],
    coach: ['チームを探して応募しよう', 'プロフィールを充実させよう', '収益管理を確認しよう'],
    player: ['トレーニングを記録しよう', '食事・栄養を記録しよう', 'AIアドバイザーに相談しよう'],
    parent: ['お子様のコンディションを確認しよう', 'スケジュールを確認しよう', 'コーチへメッセージを送ろう'],
  };
  const steps = nextSteps[DB.pendingRole||'team'] || nextSteps.team;
  
  return`<div style="text-align:center;padding:8px 0">
    <!-- アニメーション付き完了アイコン -->
    <div style="width:80px;height:80px;background:linear-gradient(135deg,#22c55e,#16a34a);border-radius:24px;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;box-shadow:0 10px 32px rgba(34,197,94,.4);animation:pop .4s cubic-bezier(.34,1.56,.64,1) both">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
    </div>
    <div style="font-size:24px;font-weight:800;color:var(--txt1);margin-bottom:6px">ようこそ！🎉</div>
    <div style="font-size:13px;color:var(--txt3);margin-bottom:22px">${roleName}として MyCOACH-MyTEAM に登録完了しました</div>
    
    <!-- 次のステップ -->
    <div style="text-align:left;background:rgba(59,100,180,.04);border:1px solid rgba(59,100,180,.12);border-radius:14px;padding:16px;margin-bottom:20px">
      <div style="font-size:12px;font-weight:700;color:var(--org);letter-spacing:.05em;text-transform:uppercase;margin-bottom:12px">まずやること</div>
      ${(()=>{
      const links={team:['coach-search','fee','my-team'],coach:['team-search','profile','earnings'],player:['training','nutrition','ai'],parent:['parent-fee','profile-settings','chat']};
      const ls=links[DB.pendingRole||'team']||links.team;
      return steps.map((s,i)=>`<div style="display:flex;align-items:center;gap:10px;padding:10px 0;${i<steps.length-1?'border-bottom:1px solid rgba(255,255,255,.06)':''};cursor:pointer;border-radius:6px" onclick="completeOnboarding();setTimeout(()=>goTo('${ls[i]}'),300)">
        <div style="width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,rgba(249,115,22,.2),rgba(249,115,22,.1));color:var(--org);font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;border:1px solid rgba(249,115,22,.3)">${i+1}</div>
        <div style="font-size:13px;color:var(--txt1);font-weight:500;flex:1">${s}</div>
        <span style="font-size:16px;color:var(--org)">→</span>
      </div>`).join('');
    })()}
    </div>
    
    <button class="btn btn-primary w-full" onclick="completeOnboarding()" style="font-size:16px;padding:16px;border-radius:14px;box-shadow:0 6px 24px rgba(249,115,22,.4)">
      🚀 ダッシュボードへ →
    </button>
    ${isTeamOrCoach?`<p style="font-size:11px;color:var(--txt3);margin-top:10px">💳 Stripeによる決済設定はダッシュボードの設定から行えます</p>`:''}
  </div>`
}


// ========== PROFILE SETUP (ONBOARDING) ==========
let obProfile={name:'',photo:null,sport:'',area:'',pr:'',certs:[],avail:[],experience:'',coachName:'',coachPrice:'',teamName:'',memberCount:'',monthlyFee:'',teamArea:''};

function renderObProfile(){
  const role = DB.pendingRole || 'team';
  const areaOpts = `<option value="">都道府県を選択</option>
  <option>北海道</option><option>青森県</option><option>岩手県</option><option>宮城県</option><option>秋田県</option><option>山形県</option><option>福島県</option>
  <option>茨城県</option><option>栃木県</option><option>群馬県</option><option>埼玉県</option><option>千葉県</option><option>東京都</option><option>神奈川県</option>
  <option>新潟県</option><option>富山県</option><option>石川県</option><option>福井県</option><option>山梨県</option><option>長野県</option><option>岐阜県</option>
  <option>静岡県</option><option>愛知県</option><option>三重県</option><option>滋賀県</option><option>京都府</option><option>大阪府</option><option>兵庫県</option>
  <option>奈良県</option><option>和歌山県</option><option>鳥取県</option><option>島根県</option><option>岡山県</option><option>広島県</option><option>山口県</option>
  <option>徳島県</option><option>香川県</option><option>愛媛県</option><option>高知県</option>
  <option>福岡県</option><option>佐賀県</option><option>長崎県</option><option>熊本県</option><option>大分県</option><option>宮崎県</option><option>鹿児島県</option><option>沖縄県</option>
  <option>全国対応</option>`;
  const sportPills = PREFS_SPORTS.map(s=>`<span class="tag-pill" onclick="obToggleSport(this,'${s}')">${s}</span>`).join('');
  const stepHdr = (title, sub, emoji) => `
    <div style="text-align:center;margin-bottom:18px">
      <div style="font-size:13px;font-weight:700;color:var(--org);letter-spacing:.05em;text-transform:uppercase;margin-bottom:6px">ステップ 2 / 3</div>
      <div style="font-size:19px;font-weight:800;color:var(--txt1);margin-bottom:4px">${emoji} ${title}</div>
      <div style="font-size:12px;color:var(--txt3)">${sub}</div>
    </div>`;
  const skipBtns = `
    <div style="display:flex;gap:10px;margin-top:20px">
      <button class="btn btn-primary" style="flex:1;padding:13px;font-weight:700" onclick="obSaveProfile()">保存して完了 →</button>
      <button class="btn btn-ghost" style="padding:13px 16px;font-size:12px;white-space:nowrap;flex-shrink:0" onclick="obStep=2;renderWizard()">スキップ →</button>
    </div>
    <p style="font-size:11px;color:var(--txt3);text-align:center;margin-top:10px">入力はいつでも後から変更・追加できます</p>`;

  // ── コーチ ──────────────────────────────────────────
  if(role === 'coach') return `
    ${stepHdr('コーチプロフィール','後でいつでも変更できます。今はスキップもOK。','🏆')}
    <div style="background:rgba(14,165,233,.06);border:1px solid rgba(14,165,233,.2);border-radius:10px;padding:10px 14px;margin-bottom:20px;font-size:12px;color:rgba(14,165,233,.9)">
      💡 プロフィールを充実させると、チームから選ばれやすくなります
    </div>
    <div style="display:flex;flex-direction:column;gap:14px">
      <div style="padding:10px 14px;background:var(--surf2);border-radius:10px;display:flex;align-items:center;gap:10px">
        <div class="avi" style="width:36px;height:36px;font-size:16px;background:var(--org)22;color:var(--org);flex-shrink:0">${(DB.pendingName||'?')[0]}</div>
        <div><div class="fw7 text-sm">${sanitize(DB.pendingName||'',30)}</div><div class="text-xs text-muted">登録名（後から変更可能）</div></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="form-group"><label class="label">月額指導料（円）</label>
          <input class="input" type="number" placeholder="30000" min="0" max="9999999" oninput="obProfile.coachPrice=this.value"></div>
        <div class="form-group"><label class="label">活動エリア</label>
          <select class="input" onchange="obProfile.area=this.value"><option value="">選択</option>${areaOpts}</select></div>
      </div>
      <div class="form-group"><label class="label">専門種目</label>
        <div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:6px;max-height:160px;overflow-y:auto;padding:2px;scrollbar-width:thin">${sportPills}</div></div>
      <div class="form-group"><label class="label">自己PR（後で追記できます）</label>
        <textarea class="input" rows="3" placeholder="指導歴・得意なことを一言..." oninput="obProfile.pr=this.value" style="resize:vertical"></textarea></div>
    </div>
    ${skipBtns}`;

  // ── チーム管理者 ──────────────────────────────────────────
  if(role === 'team') return `
    ${stepHdr('チームプロフィール','後でいつでも変更できます。今はスキップもOK。','🏟️')}
    <div style="background:rgba(249,115,22,.06);border:1px solid rgba(249,115,22,.2);border-radius:10px;padding:10px 14px;margin-bottom:20px;font-size:12px;color:rgba(249,115,22,.9)">
      💡 プロフィールを充実させると、優秀なコーチに見つけてもらいやすくなります
    </div>
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="form-group"><label class="label">チーム名 <span style="color:var(--org)">*</span></label>
        <input class="input" placeholder="例: FC Tokyo Youth" oninput="obProfile.teamName=this.value" value="${DB.pendingName||''}"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="form-group"><label class="label">活動エリア</label>
          <select class="input" onchange="obProfile.teamArea=this.value"><option value="">選択</option>${areaOpts}</select></div>
        <div class="form-group"><label class="label">月謝（円／人）</label>
          <input class="input" type="number" placeholder="5000" min="0" max="9999999" oninput="obProfile.monthlyFee=this.value"></div>
      </div>
      <div class="form-group"><label class="label">種目</label>
        <div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:6px;max-height:160px;overflow-y:auto;padding:2px;scrollbar-width:thin">${sportPills}</div></div>
      <div class="form-group"><label class="label">チームPR（後で追記できます）</label>
        <textarea class="input" rows="3" placeholder="チームの雰囲気・目標を一言..." oninput="obProfile.pr=this.value" style="resize:vertical"></textarea></div>
    </div>
    ${skipBtns}`;

  // ── 選手（シンプル） ──
  if(role === 'player'){
    const pColor = '#00cfaa';
    const pFeatures = [['📊','トレーニング記録','練習内容・時間・コンディションを毎日記録'],
       ['🍱','食事・栄養管理','PFCバランスをAIが分析・アドバイス'],
       ['🤖','AI相談','いつでも質問できるスポーツAIアドバイザー']];
    return `
      ${stepHdr('選手としての利用開始','以下の機能が利用できます。','🏃')}
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:20px">
        ${pFeatures.map(([ico,t,d])=>`<div style="display:flex;align-items:center;gap:12px;padding:11px 14px;background:${pColor}12;border:1px solid ${pColor}25;border-radius:10px">
          <span style="font-size:22px;flex-shrink:0">${ico}</span>
          <div><div style="font-size:12px;font-weight:700;color:var(--txt1)">${t}</div><div style="font-size:11px;color:var(--txt3)">${d}</div></div>
        </div>`).join('')}
      </div>
      <div style="padding:12px 14px;background:var(--surf2);border-radius:10px;margin-bottom:20px;display:flex;align-items:center;gap:10px">
        <div class="avi" style="width:36px;height:36px;font-size:16px;background:${pColor}22;color:${pColor};flex-shrink:0">${(DB.pendingName||'?')[0]}</div>
        <div><div class="fw7 text-sm">${sanitize(DB.pendingName||'',30)}</div><div class="text-xs text-muted">選手として登録済み ✓</div></div>
      </div>
      <button class="btn btn-primary w-full" style="padding:14px;font-size:15px;font-weight:700" onclick="obStep=2;renderWizard()">
        ダッシュボードへ進む →
      </button>`;
  }

  // ── OBOG：登録確認（情報は登録時に入力済み） ──
  if(role === 'alumni'){
    const teamCode = DB.pendingTeamCode || '';
    const team = teamCode ? DB.teams.find(t => t.code === teamCode.toUpperCase()) : null;
    const pp = DB.pendingProfile || {};
    return `
    ${stepHdr('OBOG登録確認','入力内容を確認してください。','🎓')}
    
    ${team?`<div style="padding:12px 14px;background:rgba(100,116,139,.08);border:1px solid rgba(100,116,139,.2);border-radius:10px;margin-bottom:16px;display:flex;align-items:center;gap:10px">
      <div style="width:36px;height:36px;border-radius:10px;background:#47556922;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:16px">🏟️</div>
      <div><div style="font-size:13px;font-weight:700">${sanitize(team.name,25)}</div><div style="font-size:11px;color:var(--txt3)">チームと連携されます</div></div>
      <span style="margin-left:auto;color:#16a34a;font-size:14px">✓</span>
    </div>`:`<div style="padding:12px;background:rgba(239,68,68,.06);border-radius:10px;margin-bottom:16px;font-size:12px;color:#ef4444">⚠️ 招待コードに該当するチームが見つかりませんでした。登録後に管理者へお問い合わせください。</div>`}
    
    <div style="padding:16px;background:var(--surf2);border-radius:12px;margin-bottom:16px">
      <div style="display:grid;gap:10px">
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--b1)">
          <span style="font-size:12px;color:var(--txt3)">お名前</span>
          <span style="font-size:13px;font-weight:700">${sanitize(DB.pendingName||'',20)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--b1)">
          <span style="font-size:12px;color:var(--txt3)">卒業年度</span>
          <span style="font-size:13px;font-weight:700">${pp.gradYear||'未入力'}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--b1)">
          <span style="font-size:12px;color:var(--txt3)">職業</span>
          <span style="font-size:13px;font-weight:700">${sanitize(pp.currentJob||'未入力',20)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px 0">
          <span style="font-size:12px;color:var(--txt3)">会社・組織</span>
          <span style="font-size:13px;font-weight:700">${sanitize(pp.company||'未入力',20)}</span>
        </div>
      </div>
    </div>
    
    <div style="font-size:11px;color:var(--txt3);text-align:center;margin-bottom:16px;line-height:1.6">
      登録後、ダッシュボードでプロフィールの編集やOB訪問設定が可能です。
    </div>
    
    ${skipBtns}
  `;
  }

  // ── 保護者：お子様（選手）の紐づけ ──
  const parentColor = '#a855f7';
  const teamId = DB.pendingTeamId || null;
  const team = teamId ? DB.teams.find(t=>t.id===teamId) : null;
  // 該当チームの未紐づけ選手を取得
  const teamPlayers = teamId ? _dbArr('players').filter(p => p.team === teamId) : [];
  const unlinkedPlayers = teamPlayers.filter(p => !p.guardianId);

  return `
    ${stepHdr('お子様の選択','チームに登録されているお子様を選んでください。','👨‍👩‍👧')}

    ${team ? `<div style="padding:12px 14px;background:${parentColor}10;border:1px solid ${parentColor}30;border-radius:10px;margin-bottom:16px;display:flex;align-items:center;gap:10px">
      <div style="width:36px;height:36px;border-radius:10px;background:var(--org)22;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:16px">🏟️</div>
      <div>
        <div style="font-size:13px;font-weight:700;color:var(--txt1)">${sanitize(team.name||'',30)}</div>
        <div style="font-size:11px;color:var(--txt3)">招待コード: ${sanitize(team.code||'',10)} ✓</div>
      </div>
    </div>` : ''}

    <div style="font-size:13px;font-weight:700;color:var(--txt1);margin-bottom:10px">
      👧 お子様を選択してください
    </div>

    ${unlinkedPlayers.length > 0 ? `
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px" id="ob-player-list">
        ${unlinkedPlayers.map(p => `
          <div class="ob-player-card" id="ob-pc-${p.id}"
            onclick="obSelectPlayer('${p.id}')"
            style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:var(--surf2);border:2px solid var(--bdr);border-radius:12px;cursor:pointer;transition:all .2s">
            <div class="avi" style="width:38px;height:38px;font-size:15px;background:#00cfaa22;color:#00cfaa;flex-shrink:0">${(p.name||'?')[0]}</div>
            <div style="flex:1;min-width:0">
              <div style="font-size:13px;font-weight:700;color:var(--txt1)">${sanitize(p.name||'',20)}</div>
              <div style="font-size:11px;color:var(--txt3)">${p.pos ? sanitize(p.pos,10)+' / ' : ''}${p.age ? p.age+'歳' : '年齢未設定'}</div>
            </div>
            <div id="ob-chk-${p.id}" style="width:22px;height:22px;border-radius:50%;border:2px solid var(--bdr);display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .15s"></div>
          </div>
        `).join('')}
      </div>
    ` : `
      <div style="padding:20px;background:rgba(234,179,8,.08);border:1px solid rgba(234,179,8,.25);border-radius:12px;margin-bottom:16px;text-align:center">
        <div style="font-size:28px;margin-bottom:8px">📭</div>
        <div style="font-size:13px;font-weight:600;color:var(--txt1);margin-bottom:4px">紐づけ可能な選手がいません</div>
        <div style="font-size:11px;color:var(--txt3);line-height:1.6">
          ${teamPlayers.length === 0
            ? 'このチームにはまだ選手が登録されていません。<br>先にお子様に選手として登録してもらうか、<br>チーム管理者に選手の追加をご依頼ください。'
            : '全ての選手が既に保護者と紐づけ済みです。<br>チーム管理者にご確認ください。'}
        </div>
      </div>
    `}

    <div style="padding:10px 14px;background:var(--surf2);border-radius:10px;margin-bottom:16px;display:flex;align-items:center;gap:10px">
      <div class="avi" style="width:36px;height:36px;font-size:16px;background:${parentColor}22;color:${parentColor};flex-shrink:0">${(DB.pendingName||'?')[0]}</div>
      <div>
        <div class="fw7 text-sm">${sanitize(DB.pendingName||'',30)}</div>
        <div class="text-xs text-muted">保護者として登録</div>
      </div>
    </div>

    <button class="btn btn-primary w-full" id="ob-parent-next"
      style="padding:14px;font-size:15px;font-weight:700;opacity:${unlinkedPlayers.length > 0 ? '.5' : '1'}"
      ${unlinkedPlayers.length > 0 ? 'disabled' : ''}
      onclick="obStep=2;renderWizard()">
      ${unlinkedPlayers.length > 0 ? 'お子様を選択してください' : 'ダッシュボードへ進む →'}
    </button>
    ${unlinkedPlayers.length > 0 ? '' : '<p style="font-size:11px;color:var(--txt3);text-align:center;margin-top:8px">紐づけは後からチーム管理者が行えます</p>'}
  `;
}

// 保護者オンボーディング: 選手選択
var _obSelectedPlayerId = null;
function obSelectPlayer(pid){
  _obSelectedPlayerId = (_obSelectedPlayerId === pid) ? null : pid;
  // 全カードの選択状態をリセット
  document.querySelectorAll('.ob-player-card').forEach(el => {
    el.style.borderColor = 'var(--bdr)';
    el.style.background = 'var(--surf2)';
  });
  document.querySelectorAll('[id^="ob-chk-"]').forEach(el => {
    el.style.background = 'transparent';
    el.style.borderColor = 'var(--bdr)';
    el.innerHTML = '';
  });
  // 選択されたカードをハイライト
  if(_obSelectedPlayerId){
    const card = document.getElementById('ob-pc-'+pid);
    const chk = document.getElementById('ob-chk-'+pid);
    if(card){
      card.style.borderColor = '#a855f7';
      card.style.background = 'rgba(168,85,247,.08)';
    }
    if(chk){
      chk.style.background = '#a855f7';
      chk.style.borderColor = '#a855f7';
      chk.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
    }
  }
  // ボタン状態を更新
  const btn = document.getElementById('ob-parent-next');
  if(btn){
    btn.disabled = !_obSelectedPlayerId;
    btn.style.opacity = _obSelectedPlayerId ? '1' : '.5';
    btn.textContent = _obSelectedPlayerId ? 'この選手と紐づけて進む →' : 'お子様を選択してください';
  }
}

function obPhotoLoad(input){
  if(!input||!input.files||!input.files[0])return;
  const reader=new FileReader();
  reader.onload=e=>{
    obProfile.photo=e.target.result;
    const z=document.getElementById('ob-photo-zone');
    if(z)z.innerHTML='<img src="'+e.target.result+'" alt="チームロゴ" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">';
    toast('\u5199\u771F\u3092\u30A2\u30C3\u30D7\u30ED\u30FC\u30C9\u3057\u307E\u3057\u305F','s');
  };
  reader.readAsDataURL(input.files[0]);
}
function obToggleSport(el,s){el.classList.toggle('sel');const sp=obProfile.sport;obProfile.sport=el.classList.contains('sel')?(sp?sp+','+s:s):sp.split(',').filter(function(x){return x!==s;}).join(',');}
function obToggleCert(el,s){el.classList.toggle('sel');if(el.classList.contains('sel'))obProfile.certs.push(s);else obProfile.certs=obProfile.certs.filter(function(x){return x!==s;});}
function obToggleDay(el,d){el.classList.toggle('sel');if(el.classList.contains('sel'))obProfile.avail.push(d);else obProfile.avail=obProfile.avail.filter(function(x){return x!==d;});}
function obSaveProfile(){
  const role=DB.pendingRole||'team';
  // alumni の場合、登録フォームで入力した卒業年度等を保持する
  const _savedAlumniData = (role === 'alumni' && DB.pendingProfile) ? {
    gradYear: DB.pendingProfile.gradYear,
    currentJob: DB.pendingProfile.currentJob,
    company: DB.pendingProfile.company
  } : null;
  DB.pendingProfile=obProfile;
  // alumni データを復元
  if(_savedAlumniData){
    DB.pendingProfile.gradYear = _savedAlumniData.gradYear;
    DB.pendingProfile.currentJob = _savedAlumniData.currentJob;
    DB.pendingProfile.company = _savedAlumniData.company;
  }
  if(role==='coach'){
    const coach=DB.coaches.find(c=>c.id===(DB.pendingUserId||DB.currentUser?.id));
    if(coach){
      if(obProfile.coachName)coach.name=sanitize(obProfile.coachName,50);
      else if(DB.pendingName)coach.name=sanitize(DB.pendingName,50);
      if(obProfile.sport)coach.sport=sanitize(obProfile.sport.split(',')[0],30);
      if(obProfile.area)coach.area=sanitize(obProfile.area,50);
      if(obProfile.pr)coach.pr=sanitize(obProfile.pr,500);
      if(obProfile.coachPrice)coach.price=parseInt(obProfile.coachPrice)||coach.price;
      if(obProfile.certs&&obProfile.certs.length)coach.certs=obProfile.certs;
      if(obProfile.avail&&obProfile.avail.length)coach.avail=obProfile.avail;
      if(obProfile.photo)coach.photo=obProfile.photo;
    }
  }
  if(role==='team'){
    const team=DB.teams.find(t=>t.id===(DB.pendingUserId||DB.currentUser?.id));
    if(team){
      if(obProfile.teamName)team.name=sanitize(obProfile.teamName,50);
      if(obProfile.sport)team.sport=sanitize(obProfile.sport.split(',')[0],30);
      if(obProfile.teamArea)team.area=sanitize(obProfile.teamArea,50);
      if(obProfile.monthlyFee)team.fee=parseInt(obProfile.monthlyFee)||team.fee;
      if(obProfile.memberCount)team.members=parseInt(obProfile.memberCount)||team.members;
      if(obProfile.pr)team.pr=sanitize(obProfile.pr,500);
      if(obProfile.photo)team.photo=obProfile.photo;
    }
  }
  saveDB();
  obStep++;renderWizard();
}
function obNext(){
  const role = DB.pendingRole || 'team';
  const isBiz = role === 'team' || role === 'coach';
  if(obStep === 0){
    if(!agreeState.terms){ toast('利用規約への同意が必要です','e'); return; }
    if(isBiz && !agreeState.age){ toast('年齢確認の同意が必要です','e'); return; }
    if(!sigText.trim()){ toast('お名前（電子署名）を入力してください','e'); return; }
  }
  if(obStep >= OB_STEPS.length - 1){ completeOnboarding(); return; }
  obStep++; renderWizard(); window.scrollTo({top:0,behavior:'smooth'});
}

function checkLegalBtn(step){const btn=document.getElementById('ob-next-'+step);if(btn&&legalScrolled[step]){/* allow scrolling to enable */}}
function toggleAgree(key, wrap){
  agreeState[key] = !agreeState[key];
  const v = agreeState[key];
  // チェックボックス本体を直接更新
  const chkId = {'terms':'chk-terms','age':'chk-age','privacy':'chk-privacy'}[key] || ('chk-'+key);
  const chk = document.getElementById(chkId);
  if(chk){
    chk.style.background = v ? 'var(--grn)' : 'transparent';
    chk.style.borderColor = v ? 'var(--grn)' : 'var(--bdr)';
    chk.innerHTML = v ? '<svg width="11" height="11" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>' : '';
  }
  // 「同意して次へ」ボタンの有効/無効を更新
  const _obBtn = document.getElementById('ob-next-0');
  if(_obBtn){
    const _role = DB.pendingRole || 'team';
    const _isBiz = _role === 'team' || _role === 'coach';
    const _canGo = agreeState.terms && (_isBiz ? agreeState.age : true) && sigText;
    _obBtn.disabled = !_canGo;
    _obBtn.style.opacity = _canGo ? '1' : '.5';
  }
  // ラッパーのボーダー更新
  if(wrap){
    wrap.style.borderColor = v ? 'var(--grn)' : 'var(--bdr)';
  }
  // ボタン活性化更新
  const btn0 = document.getElementById('ob-next-0');
  if(btn0 && obStep === 0){
    const role = DB.pendingRole || 'team';
    const isBiz = role === 'team' || role === 'coach';
    btn0.disabled = !(agreeState.terms && (isBiz ? agreeState.age : true) && sigText.trim());
  }
}

function updateObBtn(){
  if(obStep===0){
    const btn=document.getElementById('ob-next-0');
    if(btn)btn.disabled=!(agreeState.terms&&agreeState.age&&sigText.trim());
  }
}
function completeOnboarding(){
  const r = DB.pendingRole || 'team';
  const isBiz = r === 'team' || r === 'coach';
  const now = new Date().toLocaleString('ja-JP');
  const uid = DB.pendingUserId || genId(r);

  // ── 最終バリデーション: 利用規約同意の確認 ──
  if(!agreeState.terms){
    toast('利用規約への同意が必要です。ステップ1に戻ります。','e');
    obStep=0; renderWizard(); return;
  }
  if(isBiz && !agreeState.age){
    toast('年齢確認の同意が必要です。ステップ1に戻ります。','e');
    obStep=0; renderWizard(); return;
  }
  if(!sigText.trim()){
    toast('電子署名（お名前）の入力が必要です。ステップ1に戻ります。','e');
    obStep=0; renderWizard(); return;
  }

  // 新規ユーザーオブジェクト
  const user = {
    role:      r,
    name:      DB.pendingName  || ROLE_NAMES[r] || 'ユーザー',
    email:     DB.pendingEmail || '',
    id:        uid,
    createdAt: now,
  };
  DB.currentUser = user;

  // ロール別にDBに登録
  if(r === 'coach'){
    const _obP = DB.pendingProfile || {};
    DB.coaches.push({
      id: uid, name: user.name, email: user.email,
      sport: (_obP.sport||DB.pendingSport||'').split(',')[0] || '',
      spec:  '',
      area:  _obP.area || _obP.teamArea || DB.pendingArea || '',
      price: parseInt(_obP.coachPrice)||0,
      rating: 0, reviews: 0, exp: 0,
      bio:   sanitize(_obP.pr||'',300),
      avail: true, team: null, verified: false,
      color: '#' + Math.floor(Math.random()*0xffffff).toString(16).padStart(6,'0'),
      createdAt: now,
    });
  } else if(r === 'team'){
    const _obT = DB.pendingProfile || {};
    DB.teams.push({
      id: uid,
      name: _obT.teamName ? sanitize(_obT.teamName,50) : user.name,
      email: user.email,
      sport: (_obT.sport||DB.pendingSport||'').split(',')[0] || '',
      area:  _obT.teamArea || DB.pendingArea || '',
      members: 0,
      fee:   parseInt(_obT.monthlyFee)||0,
      coach: null,
      wins: 0, losses: 0,
      code: 'T' + Date.now().toString().slice(-6),
      createdAt: now,
    });
  } else if(r === 'player'){
    const teamId = DB.pendingTeamId || null;
    const team = teamId ? DB.teams.find(t=>t.id===teamId) : null;
    DB.players.push({
      id: uid, name: user.name, email: user.email,
      team: teamId, pos: '', age: 0,
      weight: 0, height: 0, status: 'unpaid',
      guardian: '', guardianId: null, createdAt: now,
    });
    // チームの選手数を更新
    if(team){ team.members = (team.members||0) + 1; }
    // 月謝レコード生成
    if(team && team.fee > 0){
      _dbArr('payments').push({id:genId('pay'), player:uid, team:teamId,
        amount:team.fee, month:curMonth(), status:'unpaid', at:null});
    }
  } else if(r === 'parent'){
    DB.pendingParentTeamId = DB.pendingTeamId || null;
    // 選手との紐づけ
    if(_obSelectedPlayerId){
      const linkedPlayer = _dbArr('players').find(p => p.id === _obSelectedPlayerId);
      if(linkedPlayer){
        linkedPlayer.guardianId = uid;
        linkedPlayer.guardian = user.name || '';
        // currentUserにも保存
        if(!user.linkedPlayers) user.linkedPlayers = [];
        if(!user.linkedPlayers.includes(linkedPlayer.id)) user.linkedPlayers.push(linkedPlayer.id);
        // usersテーブルにもlinkedPlayerIdを保存（永続化）
        const _parentUsers = _getUsers();
        const _parentU = _parentUsers.find(x => x.id === uid);
        if(_parentU){
          _parentU.linkedPlayerId = linkedPlayer.id;
          if(!_parentU.linkedPlayers) _parentU.linkedPlayers = [];
          if(!_parentU.linkedPlayers.includes(linkedPlayer.id)) _parentU.linkedPlayers.push(linkedPlayer.id);
          _parentU.linkedTeamId = linkedPlayer.team || null;
          _saveUsers(_parentUsers);
        }
        addNotif(linkedPlayer.name + 'の保護者として' + user.name + 'が紐づけされました', 'fa-link', 'team', null);
        // Firestoreにもリンク情報を保存（_ensureFirestoreSync後に実行）
        setTimeout(()=>_syncParentLinkToFirestore(linkedPlayer.id, linkedPlayer.team||null), 5000);
      }
      _obSelectedPlayerId = null;
    }
  }

  // ── 同意記録を保存（法的証跡） ──
  if(!DB.consentLog) DB.consentLog = [];
  DB.consentLog.push({
    userId: uid,
    role: r,
    name: user.name,
    email: user.email,
    termsAgreed: agreeState.terms,
    ageConfirmed: agreeState.age,
    signature: sigText.trim(),
    agreedAt: now,
    userAgent: navigator.userAgent.slice(0,120),
  });
  window._isOnboarding = false; // オンボーディング完了

  // ウェルカム通知
  addNotif(`ようこそ、${user.name}さん！登録が完了しました。`, 'fa-check-circle', 'dashboard');
  addAuditLog('user_register', user.name + ' が' + (ROLE_NAMES[user.role]||user.role) + 'として登録', {userId:user.id, role:user.role});

  // Stripe設定フラグ（チーム・コーチのみ）- 通知ではなくダッシュボードでガイド
  if(r === 'team' || r === 'coach'){
    DB.stripeSetupNeeded = true;
  }
  
  // OBOG登録
  if(r === 'alumni'){
    const teamCode = DB.pendingTeamCode || '';
    const team = teamCode ? DB.teams.find(t => t.code === teamCode.toUpperCase()) : null;
    // 登録フォームから入力値を取得（pendingProfileに保存されている場合もある）
    const _alGrad = parseInt(DB.pendingProfile?.gradYear || 0);
    const _alJob = sanitize(DB.pendingProfile?.currentJob || '', 30);
    const _alCompany = sanitize(DB.pendingProfile?.company || '', 30);
    DB.alumni.push({
      id: uid, name: user.name, email: user.email || DB.pendingEmail || '',
      teamId: team?.id || '', teamName: team?.name || '',
      gradYear: _alGrad || '', currentJob: _alJob, company: _alCompany, industry: '',
      message: '', canVisit: false, visitTopics: [],
      photo: '', createdAt: new Date().toISOString(), userId: uid
    });
    if(team){
      // チャットルーム作成
      const ck = 'alumni_' + uid;
      DB.chats[ck] = {
        name: user.name + '（OBOG）', sub: team.name + ' 卒業生',
        avi: '🎓', type: 'alumni', alumniId: uid, teamId: team.id,
        msgs: [{mid:_genMsgId(), from:'system', name:'システム',
          text: `🎓 ${user.name}さんがOBOGとして${team.name}に連携しました！`,
          time: now_time(), date: new Date().toISOString().slice(0,10), read: false}],
        unread: 0
      };
      // チーム管理者に通知
      addNotif(`🎓 ${user.name}さんがOBOGとして連携しました`, 'fa-graduation-cap', 'alumni-mgmt', team.id);
    }
  }

  saveDB();  // localStorageに保存

  // Firestoreへの確実な同期（リトライ付き）
  _ensureFirestoreSync();

  launchApp();
}

// Firebase Auth完了を待ってからFirestoreに確実に同期する
async function _ensureFirestoreSync(){
  const maxRetries = 10;
  for(let i=0; i<maxRetries; i++){
    await new Promise(r => setTimeout(r, 2000 + i*1000));
    if(window._fbAuth?.currentUser || _fbUidCache){
      try {
        await _syncToFirestore();
        toast('☁️ クラウドに同期しました','s');
        // リスナーも確実に開始（Auth完了後なので接続可能）
        _startAllListeners();
        return;
      } catch(e){}
    } else {
    }
  }
}

// ── 保護者リンク情報をFirestoreユーザーレコードに永続化 ──
async function _syncParentLinkToFirestore(playerId, teamId){
  try {
    if(!window._fbReady) return;
    const uid = window._fbAuth?.currentUser?.uid || _fbUidCache;
    if(!uid) return;
    const fn = window._fbFn;
    const email = DB.currentUser?.email||'';
    // users/{uid} を更新
    await fn.setDoc(fn.doc(window._fbDB, 'users', uid), {
      linkedPlayerId: playerId||null,
      linkedPlayers: DB.currentUser?.linkedPlayers||[],
      linkedTeamId: teamId||null,
    }, {merge:true});
    // users_by_email/{email} も更新
    if(email){
      await fn.setDoc(fn.doc(window._fbDB, 'users_by_email', email.replace(/[.]/g,'_')), {
        linkedPlayerId: playerId||null,
        linkedPlayers: DB.currentUser?.linkedPlayers||[],
        linkedTeamId: teamId||null,
      }, {merge:true});
    }
  } catch(e){}
}
function updateSig(v){
  sigText=v.trim();
  // 署名入力に応じてボタンの有効/無効を更新
  const role = DB.pendingRole || 'team';
  const isBiz = role === 'team' || role === 'coach';
  const btn = document.getElementById('ob-next-0');
  if(btn){
    const canProceed = agreeState.terms && (isBiz ? agreeState.age : true) && sigText;
    btn.disabled = !canProceed;
    btn.style.opacity = canProceed ? '1' : '.5';
  }
  const d=document.getElementById('sig-display');
  const b=document.getElementById('ob-sign-btn');
  const p=document.getElementById('sig-pad');
  if(d){
    d.textContent=v||'← お名前を入力してください';
    d.style.color=v?'var(--grn)':'var(--txt3)';
  }
  if(p){
    p.style.borderColor=v?'var(--grn)':'var(--bdr)';
  }
  if(b)b.disabled=!v;
}


// ==================== APP ====================
// 現在月を返すユーティリティ
function curMonth(){
  const d=new Date();
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
}
function curMonthJP(){
  const d=new Date();
  return d.getFullYear()+'年'+(d.getMonth()+1)+'月';
}


// ============================================================
// セキュリティユーティリティ
// ============================================================

// XSSサニタイズ（ユーザー入力を表示する際に使用）
function sanitize(s, maxLen=200){
  if(s === null || s === undefined) return '';
  const str = String(s).trim().slice(0, maxLen);
  return str
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#x27;');
}

// ログイン試行回数制限（ブルートフォース対策）
const LOGIN_LIMIT = 5;   // 最大試行回数
const LOGIN_LOCKOUT = 15; // ロックアウト時間（分）
function checkLoginLimit(){
  try {
    const data = JSON.parse(localStorage.getItem('mc_login_attempts')||'{"count":0,"since":0}');
    const elapsed = (Date.now() - data.since) / 60000;
    if(data.count >= LOGIN_LIMIT && elapsed < LOGIN_LOCKOUT){
      const remain = Math.ceil(LOGIN_LOCKOUT - elapsed);
      return { locked: true, remain };
    }
    if(elapsed >= LOGIN_LOCKOUT){
      localStorage.setItem('mc_login_attempts', JSON.stringify({count:0, since:Date.now()}));
    }
    return { locked: false };
  } catch(e){ return { locked: false }; }
}
function recordLoginFail(){
  try {
    const data = JSON.parse(localStorage.getItem('mc_login_attempts')||'{"count":0,"since":0}');
    if(data.since === 0) data.since = Date.now();
    data.count++;
    localStorage.setItem('mc_login_attempts', JSON.stringify(data));
  } catch(e){}
}
function clearLoginLimit(){
  localStorage.removeItem('mc_login_attempts');
}

// ============================================================
// データ永続化システム（localStorage）
// ブラウザを閉じても登録データが保持される
// ============================================================
