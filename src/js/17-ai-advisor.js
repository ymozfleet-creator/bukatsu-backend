// 17-ai-advisor.js — AI advisor
function aiPage(){
  var p = DB.players.find(function(x){return x.id===DB.currentUser?.id;});
  var log = p ? DB.trainingLog[p.id]||{} : {};
  var lastLog = Object.values(log).sort(function(a,b){return a.date>b.date?-1:1;})[0];
  var meals = DB.meals?.today||[];
  var totalKcal = meals.reduce(function(s,m){return s+(m.kcal||0);},0);
  var totalProt = meals.reduce(function(s,m){return s+(m.protein||0);},0);
  var pid=p?.id||'';
  var today3=new Date().toISOString().slice(0,10);
  var todayCond=DB.conditionLog[pid]?.[today3];
  var todayTrain=log[today3];
  var hh2=new Date().getHours();

  // コーチングモード別チップ
  var modeChips={
    all:[
      '最近調子が良くなくて...',
      '何から始めればいい？',
      '目標を一緒に考えて',
      'チームでの悩みがある'
    ],
    nutrition:[
      hh2<10?'朝食のおすすめは？':'練習後の栄養補給は？',
      '今日の食事を評価して',
      '今週の栄養バランスはどう？',
      'タンパク質が足りない時は？'
    ],
    training:[
      todayTrain?'今日のトレーニングを分析して':'今日のトレーニングメニューを提案して',
      '週間トレーニングプランを作って',
      '筋肉痛を早く治したい',
      'ウォームアップの最適解は？'
    ],
    mental:[
      'メンタルを整えたい',
      todayCond&&todayCond.mood<=3?'コンディションが悪い':'集中力を高める方法は？',
      '試合前の緊張を抑えるには？',
      '睡眠の質を上げたい'
    ],
    recovery:[
      'コンディションをチェックして',
      '疲労回復のアドバイスがほしい',
      'オフ日の過ごし方は？',
      '怪我を予防するには？'
    ],
    study:[
      '勉強と練習を両立するには？',
      'テスト前の練習量の調整は？',
      '時間管理が上手くなりたい',
      '進路について相談したい'
    ],
    team:[
      'チームメイトとの関係で悩んでいる',
      'レギュラーになれなくてつらい',
      'コーチに相談しづらいことがある',
      '部活を続けるか迷っている'
    ]
  };
  var currentMode=window._aiMode||'all';
  var modeInfo={
    all:{icon:'💬',label:'何でも相談',color:'#0f172a'},
    nutrition:{icon:'🍽️',label:'栄養',color:'var(--teal)'},
    training:{icon:'🏋️',label:'トレーニング',color:'var(--org)'},
    mental:{icon:'🧠',label:'メンタル',color:'#a855f7'},
    recovery:{icon:'💆',label:'リカバリー',color:'var(--blue)'},
    study:{icon:'📚',label:'学業・進路',color:'#16a34a'},
    team:{icon:'🤝',label:'チーム・人間関係',color:'#dc2626'}
  };

  var h='<div class="pg-head"><div class="pg-title">AI パーソナルアドバイザー</div><div class="pg-sub">あなたのデータをもとに、どんな悩みにも寄り添います</div></div>';

  // ── コーチングモードセレクター ──
  h+='<div style="display:flex;gap:6px;margin-bottom:14px;overflow-x:auto;padding-bottom:4px">';
  var modes=['all','nutrition','training','mental','recovery','study','team'];
  for(var mi=0;mi<modes.length;mi++){
    var mk=modes[mi]; var mv=modeInfo[mk]; var isActive=mk===currentMode;
    h+='<button onclick="window._aiMode=\''+mk+'\';goTo(\'ai\')" style="display:flex;align-items:center;gap:5px;padding:8px 14px;border-radius:20px;border:'+(isActive?'2px solid '+mv.color:'1px solid var(--b1)')+';background:'+(isActive?mv.color+'15':'var(--surf)')+';cursor:pointer;white-space:nowrap;font-size:12px;font-weight:'+(isActive?'700':'500')+';color:'+(isActive?mv.color:'var(--txt2)')+';transition:all .2s">';
    h+='<span>'+mv.icon+'</span> '+mv.label+'</button>';
  }
  h+='</div>';

  // ── メインチャットエリア ──
  h+='<div style="display:grid;grid-template-columns:1fr;gap:14px">';
  h+='<div class="card" style="padding:0;display:flex;flex-direction:column;height:520px">';

  // チャットヘッダー
  var cm=modeInfo[currentMode];
  h+='<div class="chat-rhead" style="background:linear-gradient(135deg,#e4eefb,#1e3a5f)">';
  h+='<div class="avi" style="background:linear-gradient(135deg,var(--teal),var(--org));font-size:18px;width:40px;height:40px">🤖</div>';
  h+='<div><div class="fw7 text-sm" style="color:#fff">AI パーソナルアドバイザー</div>';
  h+='<div class="flex items-center gap-5 text-xs" style="color:var(--teal)"><div class="online-dot"></div> '+cm.icon+' '+cm.label+'モード</div></div>';
  h+='<div style="margin-left:auto;display:flex;gap:4px">';
  h+='<button class="btn btn-ghost btn-xs" onclick="clearAIHistory()" title="クリア" style="color:rgba(255,255,255,.6);font-size:11px">🗑️</button></div></div>';

  // メッセージエリア
  h+='<div class="msgs" id="ai-msgs" style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:8px">';
  if(aiHistory.length<=1){
    h+='<div style="text-align:center;margin:auto;color:var(--txt3);padding:20px">';
    h+='<div style="font-size:36px;margin-bottom:10px">'+cm.icon+'</div>';
    h+='<div class="fw7 mb-6" style="font-size:14px">'+cm.label+'</div>';
    h+='<div class="text-xs text-muted" style="line-height:1.7">練習・食事・メンタル・チームの悩みまで<br>何でも気軽に相談してください</div></div>';
  } else {
    for(var hi=0;hi<aiHistory.length;hi++){
      var msg=aiHistory[hi];
      if(msg.role==='ai'){
        h+='<div style="background:rgba(0,207,170,.06);border:1px solid rgba(0,207,170,.18);border-radius:14px;padding:12px 14px;max-width:90%;align-self:flex-start">';
        h+='<div class="text-xs fw7 mb-4" style="color:var(--teal)">🤖 AI</div>';
        h+='<div style="font-size:13px;line-height:1.8">'+msg.text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\*\*(.*?)\*\*/g,'<b>$1</b>').replace(/\n/g,'<br>')+'</div></div>';
      } else {
        h+='<div class="bubble mine" style="max-width:85%;align-self:flex-end;font-size:13px">'+msg.text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</div>';
      }
    }
  }
  if(aiLoading){
    h+='<div style="background:rgba(0,207,170,.06);border:1px solid rgba(0,207,170,.18);border-radius:14px;padding:12px 14px;max-width:85%;align-self:flex-start">';
    h+='<div class="text-xs fw7 mb-4" style="color:var(--teal)">🤖 AI</div>';
    h+='<div class="flex gap-4 items-center"><div style="width:6px;height:6px;border-radius:50%;background:var(--teal);animation:bounce 1s infinite"></div><div style="width:6px;height:6px;border-radius:50%;background:var(--teal);animation:bounce 1s .2s infinite"></div><div style="width:6px;height:6px;border-radius:50%;background:var(--teal);animation:bounce 1s .4s infinite"></div></div></div>';
  }
  h+='</div>';

  // クイックチップス（モード別）
  var chips2=modeChips[currentMode]||[];
  h+='<div style="display:flex;gap:5px;flex-wrap:wrap;padding:8px 12px;border-top:1px solid var(--b1)">';
  for(var ci2=0;ci2<chips2.length;ci2++){
    h+='<button onclick="quickAI(\''+chips2[ci2]+'\')" style="font-size:11px;padding:5px 10px;border-radius:16px;border:1px solid var(--b1);background:var(--surf);color:var(--txt2);cursor:pointer;transition:all .15s;white-space:nowrap" onmouseover="this.style.borderColor=\''+cm.color+'\'" onmouseout="this.style.borderColor=\'var(--b1)\'">';
    h+=chips2[ci2]+'</button>';
  }
  h+='</div>';

  // 入力エリア
  h+='<div class="chat-input-row" style="border-top:1px solid var(--b1)">';
  h+='<textarea id="ai-inp" placeholder="'+cm.label+'に質問... (Shift+Enterで改行)" maxlength="1000" rows="2"';
  h+=' style="flex:1;resize:none;border:none;background:transparent;padding:10px;font-size:13px;font-family:inherit;outline:none;color:var(--txt)"';
  h+=' onkeydown="if(event.key===\'Enter\'&&!event.shiftKey&&!event.isComposing){event.preventDefault();sendAI()}"></textarea>';
  h+='<button class="btn btn-primary btn-sm" onclick="sendAI()" '+(aiLoading?'disabled':'')+' style="align-self:flex-end;margin:8px">';
  h+=(aiLoading?'<span style="opacity:.7">送信中</span>':'📩')+' </button></div>';
  h+='</div>';

  // ── サイドパネル（デスクトップ表示、データ参照） ──
  h+='<div class="ai-side-panel">';
  
  // 今日のサマリー
  h+='<div class="card" style="padding:12px">';
  h+='<div class="fw7 mb-8 text-sm">📊 今日のデータ</div>';
  h+='<div style="display:grid;gap:4px;font-size:12px">';
  h+='<div class="flex justify-between"><span class="text-muted">カロリー</span><span class="fw7">'+Math.round(totalKcal)+'/'+Math.round((p?.weight||65)*35)+'kcal</span></div>';
  h+='<div class="flex justify-between"><span class="text-muted">タンパク質</span><span class="fw7">'+fmtN(totalProt)+'/'+Math.round((p?.weight||65)*1.8)+'g</span></div>';
  h+='<div class="flex justify-between"><span class="text-muted">水分</span><span class="fw7">'+(DB.meals?.water||0)+'/8杯</span></div>';
  h+='<div class="flex justify-between"><span class="text-muted">トレーニング</span><span class="fw7">'+(todayTrain?(todayTrain.duration||0)+'分':'未記録')+'</span></div>';
  h+='<div class="flex justify-between"><span class="text-muted">コンディション</span><span class="fw7">'+(todayCond?'⭐'.repeat(Math.min(5,Math.round(todayCond.mood/2)))+' '+todayCond.mood+'/10':'未記録')+'</span></div>';
  h+='</div></div>';

  // 危険シグナル
  var alerts=_getAIAlerts(pid);
  if(alerts.length>0){
    h+='<div class="card" style="padding:12px;border-left:3px solid var(--red)">';
    h+='<div class="fw7 mb-6 text-sm" style="color:var(--red)">⚠️ 注意シグナル</div>';
    for(var ali=0;ali<alerts.length;ali++){
      h+='<div style="font-size:11px;color:var(--txt2);margin-bottom:4px;line-height:1.4">'+alerts[ali].icon+' '+alerts[ali].msg+'</div>';
    }
    h+='</div>';
  }

  // ボタン
  h+='<div style="display:grid;gap:6px">';
  h+='<button class="btn btn-secondary btn-sm w-full" onclick="openWeeklyReportModal()" style="font-size:11px;justify-content:flex-start">📊 週間レポートを見る</button>';
  h+='<button class="btn btn-secondary btn-sm w-full" onclick="openAILearningDashboard()" style="font-size:11px;justify-content:flex-start">🧠 AI学習データ</button>';
  h+='<button class="btn btn-secondary btn-sm w-full" onclick="quickAI(\'1週間のプランを作って\')" style="font-size:11px;justify-content:flex-start">📋 週間プラン生成</button>';
  h+='</div>';
  h+='</div></div>';
  return h;
}
function initAI(){const el=document.getElementById('ai-msgs');if(el)el.scrollTop=el.scrollHeight}
function sendAI(){
  const inp=document.getElementById('ai-inp');
  if(!inp||!inp.value.trim()||aiLoading)return;
  if(!RateLimit.check('ai_chat', 10, 60000)){ toast('AI問い合わせが頻繁すぎます。1分後に再試行してください。','e'); return; }
  const text=sanitizeStrict(inp.value.trim(), 2000);inp.value='';
  _callClaudeAI(text);
}
function clearAIHistory(){aiHistory=[];aiLoading=false;saveAIHistory();goTo('ai');}

async function _callClaudeAI(text){
  if(aiLoading)return;
  aiLoading=true;
  aiHistory.push({role:'user',text});
  goTo('ai');  // UIを更新（ローディング表示）

  // ユーザーデータをシステムプロンプトに組み込む
  const p = DB.players.find(x=>x.id===DB.currentUser?.id);
  const log = p ? DB.trainingLog[p.id]||{} : {};
  const recentLogs = Object.values(log).sort((a,b)=>a.date>b.date?-1:1).slice(0,5);
  const meals = DB.meals?.today||[];
  const totalKcal = meals.reduce((s,m)=>s+(m.kcal||0),0);
  const totalProt = meals.reduce((s,m)=>s+(m.protein||0),0);
  const totalCarb = meals.reduce((s,m)=>s+(m.carb||0),0);
  const totalFat = meals.reduce((s,m)=>s+(m.fat||0),0);

  // ── 拡張データ収集 ──
  const pid=p?.id||'';
  const bLog=DB.bodyLog[pid]||{};
  const cLog=DB.conditionLog[pid]||{};
  const today_k=new Date().toISOString().slice(0,10);
  const todayCond=cLog[today_k];
  const todayBody=bLog[today_k];
  const team_k=DB.teams?.find(t=>t.id===p?.team);
  const tLog=DB.trainingLog[pid]||{};
  const recentExercises=(()=>{
    const exMap={};
    Object.values(tLog).sort((a,b)=>a.date>b.date?-1:1).slice(0,10).forEach(l=>{
      (l.exercises||[]).forEach(ex=>{
        if(!exMap[ex.name]) exMap[ex.name]={name:ex.name,maxW:0,count:0};
        exMap[ex.name].count++;
        (ex.sets||[]).forEach(s=>{const w=parseFloat(s.weight)||0;if(w>exMap[ex.name].maxW)exMap[ex.name].maxW=w;});
      });
    });
    return Object.values(exMap).sort((a,b)=>b.count-a.count).slice(0,8);
  })();
  // 過去7日の栄養平均
  const hist7=(()=>{
    const h=DB.mealHistory||{};const ks=Object.keys(h).sort().slice(-7);
    let tk=0,tp=0,tc=0,tf=0,cnt=0;
    ks.forEach(k=>{(h[k]||[]).forEach(m=>{tk+=m.kcal||0;tp+=m.protein||0;tc+=m.carb||0;tf+=m.fat||0;});cnt++;});
    return cnt?{days:cnt,avgK:Math.round(tk/cnt),avgP:Math.round(tp/cnt),avgC:Math.round(tc/cnt),avgF:Math.round(tf/cnt)}:null;
  })();
  // 連続記録
  let streak_k=0;
  (()=>{const d=new Date();while(tLog[d.toISOString().slice(0,10)]){streak_k++;d.setDate(d.getDate()-1);}})();
  // 直近コンディション平均
  const condAvg=(()=>{
    const vals=Object.values(cLog).filter(c=>c?.mood).slice(-7);
    if(!vals.length)return null;
    return{mood:Math.round(vals.reduce((s,c)=>s+c.mood,0)/vals.length*10)/10,
           sleep:Math.round(vals.reduce((s,c)=>s+(c.sleep||0),0)/vals.length*10)/10};
  })();

  const systemPrompt = `あなたは「MyCOACH-MyTEAM」の専属パーソナルAIアドバイザーです。選手一人ひとりに寄り添い、スポーツ・健康・メンタル・学業・人間関係まで幅広い悩みに真摯に向き合います。

## あなたの性格
- 温かく、共感的で、選手の気持ちに寄り添う
- 質問には必ず「なぜそうなのか」の理由・メカニズムを説明する
- 具体的な数値・食材名・メニュー例・セット数などを含める
- 選手を一人の人間として尊重し、上から目線にならない
- 悩みが深刻な場合は傾聴し、適切な専門家への相談も促す

## 対応できる相談カテゴリ
1. **栄養・食事** — PFCバランス、試合前後の食事、減量・増量、サプリメント
2. **トレーニング** — メニュー作成、フォーム改善、筋力UP、持久力向上
3. **メンタル** — 試合前の緊張、モチベーション低下、チーム内の人間関係
4. **コンディション** — 疲労回復、睡眠改善、ケガ予防、リハビリ
5. **学業との両立** — 勉強と練習の両立、時間管理、進路相談
6. **チーム・人間関係** — コーチとの関係、チームメイトとの悩み、保護者との関係
7. **目標設定** — 短期・中期・長期の目標設定、振り返り、成長プラン

## 回答ルール
- 日本語で800〜1500文字程度で丁寧に回答する
- 重要ポイントは**太字**で強調
- 具体的なアクションプランを必ず提案する
- 医療行為に該当する診断はしない（「医師やトレーナーに相談を」と促す）
- 選手の現在のデータを踏まえた個別化されたアドバイスをする
- 回答の最後に「他にも気になることがあれば、何でも聞いてください」と添える

## 選手プロフィール
- 名前: ${p?.name||'未設定'}
- 競技: ${team_k?.sport||'未設定'}
- チーム: ${team_k?.name||'未所属'}
- 年齢: ${p?.age||'未設定'}歳 / 体重: ${p?.weight||'?'}kg / 身長: ${p?.height||'?'}cm
- ポジション: ${p?.pos||'未設定'}
- トレーニング連続記録: ${streak_k}日

## 今日のデータ（${today_k}）
【食事】
- 摂取: ${totalKcal}kcal / P${fmtN(totalProt)}g / C${fmtN(totalCarb)}g / F${fmtN(totalFat)}g
- 記録食数: ${meals.length}食 / 水分: ${DB.meals?.water||0}/8杯
- 目標: 約${Math.round((p?.weight||65)*35)}kcal / P${Math.round((p?.weight||65)*1.8)}g

【コンディション】${todayCond?`
- 調子: ${'⭐'.repeat(Math.min(5,Math.round((todayCond.mood||0)/2)))} (${todayCond.mood||0}/10)
- 睡眠: ${todayCond.sleep||'?'}時間 / 疲労度: ${todayCond.fatigue||'?'}/5
${todayCond.pain?'- 痛み・不調: '+todayCond.pain:''}`:' 未記録'}

【体重】${todayBody?`${todayBody.weight}kg${todayBody.bodyFat?' / 体脂肪'+todayBody.bodyFat+'%':''}`:p?.weight?p.weight+'kg（プロフィール値）':'未記録'}

【直近のトレーニング】
${recentLogs.length>0?recentLogs.slice(0,5).map(l=>'- '+l.date+': '+(l.duration||l.time||'--')+'分 '+(l.kcal||'--')+'kcal '+(l.exercises?l.exercises.length+'種目':'')).join('\n'):'記録なし'}

${recentExercises.length?'【よく行う種目】\n'+recentExercises.map(e=>e.name+(e.maxW?'(MAX '+e.maxW+'kg)':'')).join('、'):''}

${hist7?'【過去7日の栄養平均（'+hist7.days+'日分）】\n- '+hist7.avgK+'kcal / P'+hist7.avgP+'g / C'+hist7.avgC+'g / F'+hist7.avgF+'g':''}

${condAvg?'【直近コンディション平均】調子'+condAvg.mood+'/5 睡眠'+condAvg.sleep+'時間':''}
`;

  try {
    const messages = [
      ...aiHistory.slice(0,-1).map(m=>({role:m.role==='ai'?'assistant':'user',content:m.text})),
      {role:'user',content:text}
    ];

    // セキュリティ: AI呼び出しは必ずバックエンドプロキシ経由
    if(typeof API_BASE === 'undefined' || !API_BASE){
      throw new Error('AI機能はバックエンドサーバーが必要です');
    }
    var _fbToken2 = '';
    try { _fbToken2 = await window._fbAuth?.currentUser?.getIdToken() || ''; } catch(e){}
    var res, data, reply;

    // FIX: Try Gemini API directly first (user's own API key)
    var _aiKey = _getGeminiKey();
    if(_aiKey) {
      try {
        var gemResp = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
          method:'POST',
          headers:{'Content-Type':'application/json','x-goog-api-key':_aiKey},
          body:JSON.stringify({
            contents: [
              {role:'user', parts:[{text: systemPrompt + '\n\n---\n\n' + messages.map(m=>((m.role==='user'?'選手':'AI')+': '+m.content)).join('\n\n')}]}
            ],
            generationConfig:{temperature:0.7,maxOutputTokens:2048}
          })
        });
        if(gemResp.ok) {
          var gemData = await gemResp.json();
          reply = gemData?.candidates?.[0]?.content?.parts?.map(function(p){return p.text||'';}).join('') || '';
        }
      } catch(gemErr) { }
    }

    // Fallback to backend server if Gemini failed
    if(!reply && typeof API_BASE !== 'undefined' && API_BASE) {
      try {
        res = await fetch(API_BASE+'/api/ai/chat',{
          method:'POST',
          headers:{'Content-Type':'application/json','Authorization':'Bearer '+_fbToken2},
          body:JSON.stringify({system:systemPrompt,messages,maxTokens:2048})
        });
        data = await res.json();
        if(data.error) throw new Error(data.error.message);
        reply = data.text || '';
      } catch(backendErr) { }
    }

    if(reply) {
      aiHistory.push({role:'ai',text:reply});
    } else {
      throw new Error('No AI response available');
    }
    saveAIHistory();
  } catch(e) {
    // APIキーなし環境ではフォールバック回答
    const fallback = _smartAIFallback(text);
    aiHistory.push({role:'ai',text:fallback});
    saveAIHistory();
  } finally {
    aiLoading=false;
    goTo('ai');
  }
}

function quickAI(q){const inp=document.getElementById('ai-inp');if(inp){inp.value=q;sendAI()}}

// ── コンテキスト対応クイックチップ生成 ──
function _getAIQuickChips(){
  var chips=[];
  var hh=new Date().getHours();
  var p=DB.players.find(function(x){return x.id===(DB.currentUser||{}).id;});
  var pid=p?.id||'';
  var tLog=DB.trainingLog[pid]||{};
  var today=new Date().toISOString().slice(0,10);
  var hasTrain=!!tLog[today];
  var meals=DB.meals?.today||[];
  var cond=DB.conditionLog[pid]?.[today];
  var water=DB.meals?.water||0;

  // 時間帯別
  if(hh<10) chips.push('練習前に何を食べる？');
  if(hh>=11&&hh<14&&meals.length<2) chips.push('昼食のおすすめは？');
  if(hh>=16&&hh<20) chips.push('練習後の栄養補給は？');
  if(hh>=20) chips.push('睡眠の質を上げたい');

  // データ状態別
  if(!hasTrain) chips.push('今日のトレーニングメニューを提案して');
  if(hasTrain) chips.push('今日のトレーニングを評価して');
  if(cond&&cond.mood<=2) chips.push('コンディションが悪い');
  if(cond&&cond.fatigue>=4) chips.push('疲労回復のアドバイスがほしい');
  if(!cond) chips.push('コンディション管理のコツは？');
  if(water<3&&hh>12) chips.push('水分補給の目安は？');

  // 一般的
  var general=['筋肉をつけたい','体重を減らすには？','試合前の食事は？','メンタルを整えたい','怪我を予防するには？'];
  for(var i=0;i<general.length&&chips.length<6;i++){
    if(chips.indexOf(general[i])===-1) chips.push(general[i]);
  }
  return chips.slice(0,6);
}

// ── スマートフォールバック（データ分析対応） ──
function _smartAIFallback(text){
  // 完全一致
  if(AI_DB[text]) return AI_DB[text];

  var tl=text.toLowerCase();

  // ── データ分析型回答を最優先（パーソナライズ） ──
  // 「評価」「分析」「どう」「チェック」「プラン」系は個人データを使った回答を優先
  var p=DB.players.find(function(x){return x.id===(DB.currentUser||{}).id;});
  var sport=DB.teams?.find(function(t){return t.id===p?.team;})?.sport||'スポーツ';
  var w=p?.weight||65;
  var pid=p?.id||'';
  var nt=calcTotals();
  var today2=new Date().toISOString().slice(0,10);
  var tLog=DB.trainingLog[pid]||{};
  var cLog=DB.conditionLog[pid]||{};
  var bLog=DB.bodyLog[pid]||{};
  var todayCond=cLog[today2];
  var todayTrain=tLog[today2];
  var hh=new Date().getHours();
  var targetK=Math.round(w*35);
  var targetP=Math.round(w*1.8);

  // 「評価」「分析」「どう」系 → データベースの実分析
  if(tl.includes('評価')||tl.includes('分析')||tl.includes('どう')||tl.includes('チェック')){
    if(tl.includes('食事')||tl.includes('栄養')){
      var reply='**📊 今日の栄養分析レポート**\n\n';
      reply+='カロリー: **'+Math.round(nt.kcal)+'kcal** / 目標'+targetK+'kcal';
      var kcalPct=Math.round(nt.kcal/targetK*100);
      reply+=' ('+kcalPct+'%)\n';
      if(kcalPct<50) reply+='→ ⚠️ 大幅に不足。エネルギー切れに注意\n';
      else if(kcalPct<80) reply+='→ やや不足。あと'+Math.round(targetK-nt.kcal)+'kcal\n';
      else if(kcalPct<=120) reply+='→ ✅ 良いペース！\n';
      else reply+='→ ⚠️ オーバー気味\n';
      reply+='\nタンパク質: **'+fmtN(nt.protein)+'g** / 目標'+targetP+'g';
      if(nt.protein<targetP*0.5) reply+=' → ⚠️ 大幅不足\n';
      else if(nt.protein<targetP*0.8) reply+=' → あと'+Math.round(targetP-nt.protein)+'g\n';
      else reply+=' → ✅ OK\n';
      reply+='\n**💡 アドバイス**: ';
      if(nt.protein<targetP*0.7) reply+='鶏むね肉200g(P44g)やプロテイン1杯(P20g)でタンパク質を補いましょう。';
      else if(nt.kcal<targetK*0.7) reply+='おにぎり2個(約400kcal)やパスタで炭水化物を中心に補給を。';
      else reply+='バランス良く摂れています！野菜も意識すると◎';
      reply+='\n\n水分: '+(DB.meals?.water||0)+'/8杯';
      if((DB.meals?.water||0)<4) reply+=' → もう少し飲みましょう💧';
      return reply;
    }
    if(tl.includes('トレーニング')||tl.includes('練習')){
      if(!todayTrain){
        return '**📊 今日のトレーニング**: まだ記録がありません。\n\n'+_generateSmartTrainingSuggestion(pid,sport,todayCond);
      }
      var reply2='**📊 今日のトレーニング分析**\n\n';
      reply2+='⏱️ '+( todayTrain.duration||todayTrain.time||0)+'分 / 🔥 '+(todayTrain.kcal||0)+'kcal\n';
      if(todayTrain.exercises){
        reply2+='種目数: '+todayTrain.exercises.length+'\n\n';
        for(var ei=0;ei<todayTrain.exercises.length;ei++){
          var ex=todayTrain.exercises[ei];
          var maxW=0;
          (ex.sets||[]).forEach(function(s){var ww=parseFloat(s.weight)||0;if(ww>maxW)maxW=ww;});
          reply2+='**'+sanitize(ex.name,20)+'**: '+(ex.sets?.length||0)+'セット'+(maxW?' (MAX '+maxW+'kg)':'')+'\n';
        }
      }
      reply2+='\n**💡 評価**: ';
      var dur=todayTrain.duration||todayTrain.time||0;
      if(dur>=60) reply2+='十分な練習量です！しっかりストレッチとタンパク質摂取で回復を。';
      else if(dur>=30) reply2+='適度な練習量。種目数を増やすとさらに効果的。';
      else reply2+='短めの練習でした。時間がない日は複合種目（スクワット・デッドリフト）を優先しましょう。';
      return reply2;
    }
    if(tl.includes('コンディション')||tl.includes('体調')){
      var recov=generateRecoveryAdvice();
      if(!recov) return 'コンディションデータが不足しています。毎日のコンディション記録を2日以上続けると分析できます！📝';
      var reply3='**📊 コンディション分析 (直近'+recov.days+'日)**\n\n';
      reply3+='平均調子: **'+recov.avgMood+'/5** '+'⭐'.repeat(Math.round(recov.avgMood))+'\n';
      reply3+='平均睡眠: **'+recov.avgSleep+'時間**\n';
      reply3+='平均疲労: **'+recov.avgFatigue+'/5**\n\n';
      if(recov.tips.length>0){
        for(var ri=0;ri<recov.tips.length;ri++){
          reply3+=recov.tips[ri].icon+' '+recov.tips[ri].msg+'\n';
        }
      } else {
        reply3+='✅ 全体的にコンディション良好です！';
      }
      return reply3;
    }
    if(tl.includes('体重')||tl.includes('体脂肪')){
      var bEntries=Object.entries(bLog).sort(function(a,b){return b[0].localeCompare(a[0]);});
      if(bEntries.length<1) return '体重データがまだありません。ダッシュボードから体重を記録してみましょう！⚖️';
      var latest=bEntries[0][1];
      var reply4='**⚖️ 体重推移分析**\n\n';
      reply4+='最新: **'+latest.weight+'kg**'+(latest.bodyFat?' / 体脂肪率 '+latest.bodyFat+'%':'')+'\n';
      if(bEntries.length>=3){
        var first=bEntries[bEntries.length-1][1];
        var diff=Math.round((latest.weight-first.weight)*10)/10;
        reply4+=bEntries.length+'回分のデータ: '+(diff>0?'+':'')+diff+'kg ('+(diff>0?'増量':diff<0?'減量':'維持')+'傾向)\n';
      }
      reply4+='\n**💡 '+sport+'選手の目安**:\n';
      reply4+='- 適正体脂肪率: 男性8〜15% / 女性15〜22%\n';
      reply4+='- 増量ペース: 月+0.5〜1.0kg\n';
      reply4+='- 減量ペース: 月-0.5〜0.7kg（体重の1%以下）';
      return reply4;
    }
  }

  // 「提案」「おすすめ」「何食べ」系 → データベースのパーソナル提案
  if(tl.includes('提案')||tl.includes('おすすめ')||tl.includes('何食べ')||tl.includes('何を食べ')){
    var reply5='';
    if(tl.includes('食事')||tl.includes('食べ')){
      reply5='**🍽️ '+sport+'選手のおすすめ食事**\n\n';
      var remK=Math.max(0,targetK-nt.kcal);
      var remP=Math.max(0,targetP-nt.protein);
      if(hh<10) reply5+='**朝食**: オートミール+プロテイン+バナナ (約400kcal/P30g)\n';
      else if(hh<14) reply5+='**昼食**: 鶏むね定食 or 鮭弁当 (約600kcal/P35g)\n';
      else if(hh<18) reply5+='**間食**: ギリシャヨーグルト+ナッツ (約200kcal/P15g)\n';
      else reply5+='**夕食**: 鶏もも焼き+雑穀米+味噌汁 (約550kcal/P30g)\n';
      reply5+='\n残り目標: **'+Math.round(remK)+'kcal / P'+Math.round(remP)+'g**\n';
      if(remP>50) reply5+='\n⚠️ タンパク質が大幅に不足。肉・魚・プロテインを積極的に。';
      return reply5;
    }
    return _generateSmartTrainingSuggestion(pid,sport,todayCond);
  }

  // 「週間」「1週間」系 → 週間プラン
  if(tl.includes('週間')||tl.includes('1週間')||tl.includes('プラン')||tl.includes('スケジュール')){
    return _generateWeeklyPlan(sport,w,todayCond);
  }

  // ── キーワードマッチ（AI_DBの定型回答） ──
  var kwMap={
    '試合':['試合前の食事は？','試合前の緊張を抑えるには？'],
    'タンパク質':['減量中のタンパク質量は？','筋肉をつけたい'],
    'プロテイン':['プロテインのタイミングは？','筋肉をつけたい'],
    '筋肉':['筋肉をつけたい','筋肉痛を早く治したい'],
    '減量':['体重を減らすには？','減量中のタンパク質量は？'],
    '痩':['体重を減らすには？'],'増量':['体重を増やすには？'],
    '疲労':['疲労が抜けない'],'疲れ':['疲労が抜けない'],
    '睡眠':['睡眠の質を上げたい'],'眠':['睡眠の質を上げたい'],
    'メンタル':['メンタルを整えたい'],'緊張':['試合前の緊張を抑えるには？'],
    '筋肉痛':['筋肉痛を早く治したい'],'スプリント':['スプリント力を上げたい'],
    '持久':['持久力をつけたい'],'怪我':['怪我を予防するには？'],
    'ウォームアップ':['ウォームアップの最適解は？'],
    'オフ':['オフ日の過ごし方は？'],
    '集中':['集中力を高める方法は？']
  };
  for(var kw in kwMap){
    if(tl.includes(kw)){
      for(var ci=0;ci<kwMap[kw].length;ci++){
        if(AI_DB[kwMap[kw][ci]]) return AI_DB[kwMap[kw][ci]];
      }
    }
  }

  // デフォルト: パーソナルな一般回答
  var reply6='**'+sport+'選手として「'+sanitize(text,20)+'」についてアドバイスします。**\n\n';
  if(nt.kcal>0){
    reply6+='📊 現在の栄養: '+Math.round(nt.kcal)+'kcal / P'+fmtN(nt.protein)+'g (目標: '+targetK+'kcal/P'+targetP+'g)\n';
    if(nt.kcal<targetK*0.5) reply6+='→ エネルギーが不足しています。まず食事をしっかり摂りましょう。\n\n';
    else reply6+='\n';
  }
  if(todayCond){
    reply6+='💪 今日のコンディション: '+'⭐'.repeat(Math.min(5,Math.round(todayCond.mood/2)))+todayCond.mood+'/10'+' 睡眠'+todayCond.sleep+'h\n';
    if(todayCond.mood<=2) reply6+='→ 体調が優れないようです。無理は禁物です。\n\n';
    else reply6+='\n';
  }
  reply6+='具体的なアドバイスが欲しい場合は、以下のように聞いてみてください:\n';
  reply6+='• 「今日の食事を評価して」\n• 「今日のトレーニングを分析して」\n• 「1週間のプランを作って」\n• 「コンディションをチェックして」\n\n';
  reply6+='📈 毎日データを記録するとAIの分析精度が向上します！';
  return reply6;
}

// ── トレーニング提案生成 ──
function _generateSmartTrainingSuggestion(pid,sport,todayCond){
  var rec=generateTrainingRecommendation();
  if(!rec) return '**🏋️ トレーニング提案**\n\nプロフィールを設定するとパーソナルな提案ができます。';
  var reply='**🏋️ 今日のトレーニング提案**\n\n';
  reply+='推奨強度: **'+rec.intensity+'**\n';
  if(todayCond&&todayCond.mood<=2) reply+='⚠️ コンディションが低めなので軽めの内容をおすすめします\n';
  reply+='\n**対象部位**: '+rec.targetMuscles.join('・')+'\n\n';
  var menus={
    '胸':['ベンチプレス 3×8-10','インクラインダンベルプレス 3×10-12','ケーブルフライ 3×12-15'],
    '脚':['スクワット 4×6-8','ブルガリアンスクワット 3×10-12','レッグカール 3×12-15'],
    '背中':['デッドリフト 3×5-6','懸垂 3×MAX','ダンベルロウ 3×10-12'],
    '肩':['ショルダープレス 3×8-10','サイドレイズ 3×12-15','フェイスプル 3×15'],
    '腕':['バーベルカール 3×10','トライセプスプッシュダウン 3×12','ハンマーカール 3×10'],
    '腹筋':['プランク 3×60秒','クランチ 3×20','レッグレイズ 3×15'],
    '全身':['スクワット 3×8','ベンチプレス 3×8','デッドリフト 3×5','懸垂 3×MAX']
  };
  for(var mi2=0;mi2<rec.targetMuscles.length&&mi2<2;mi2++){
    var mg=rec.targetMuscles[mi2];
    if(menus[mg]){
      reply+='**'+mg+'**:\n';
      for(var mi3=0;mi3<menus[mg].length;mi3++){
        reply+='  • '+menus[mg][mi3]+'\n';
      }
    }
  }
  reply+='\n✅ ウォームアップ10分 → メイン → クールダウン10分';
  return reply;
}

// ── 週間プラン生成 ──
function _generateWeeklyPlan(sport,weight,todayCond){
  var targetK=Math.round(weight*35);
  var targetP=Math.round(weight*1.8);
  var days=['月','火','水','木','金','土','日'];
  var reply='**📋 '+sport+'選手の週間プラン**\n\n';
  reply+='目標: '+targetK+'kcal/日 · P'+targetP+'g/日\n\n';
  var plans=[
    {d:'月',train:'上半身（胸・肩）',meal:'高タンパク（鶏むね+玄米+ブロッコリー）',note:'週の始まりは胸トレ'},
    {d:'火',train:'下半身（脚・臀部）',meal:'高炭水化物（パスタ+鮭+サラダ）',note:'脚トレ日は糖質多め'},
    {d:'水',train:'アクティブレスト',meal:'バランス食（和定食・魚中心）',note:'ストレッチ重視'},
    {d:'木',train:'上半身（背中・腕）',meal:'高タンパク（牛もも+オートミール+卵）',note:'プルデー'},
    {d:'金',train:'競技練習+体幹',meal:'高エネルギー（豚ヒレ+うどん+果物）',note:'試合を意識した動き'},
    {d:'土',train:'フルボディ or 試合',meal:'試合食（消化良い糖質中心）',note:'ピーク日'},
    {d:'日',train:'完全休養',meal:'リカバリー食（鍋物・野菜たっぷり）',note:'睡眠をしっかり'}
  ];
  for(var pi=0;pi<plans.length;pi++){
    var pl=plans[pi];
    reply+='**'+pl.d+'** '+pl.train+'\n  食事: '+pl.meal+'\n  💡 '+pl.note+'\n';
  }
  reply+='\n⚠️ コンディションに応じて強度を調整してください。\n';
  reply+='⭐2以下の日は休養優先！';
  return reply;
}

// ── AI危険シグナル検知 ──
function _getAIAlerts(pid){
  var alerts=[];
  var cLog=DB.conditionLog[pid]||{};
  var tLog=DB.trainingLog[pid]||{};
  var bLog=DB.bodyLog[pid]||{};
  var today4=new Date().toISOString().slice(0,10);

  // オーバートレーニング検知
  var consecTrain=0;
  (function(){var d=new Date();for(var i=0;i<10;i++){if(tLog[d.toISOString().slice(0,10)]){consecTrain++;}else break;d.setDate(d.getDate()-1);}})();
  if(consecTrain>=7) alerts.push({icon:'🔴',msg:'7日連続トレーニング中。休養日を設けましょう（オーバートレーニング予防）'});
  else if(consecTrain>=5) alerts.push({icon:'🟡',msg:consecTrain+'日連続トレーニング。そろそろ休養日を検討'});

  // コンディション低下
  var lowMoodDays=0;
  (function(){var d=new Date();for(var i=0;i<5;i++){var c=cLog[d.toISOString().slice(0,10)];if(c&&c.mood<=2)lowMoodDays++;d.setDate(d.getDate()-1);}})();
  if(lowMoodDays>=3) alerts.push({icon:'🔴',msg:'コンディション⭐2以下が'+lowMoodDays+'日。練習量を50%に落とし回復を優先'});

  // 睡眠不足
  var poorSleepDays=0;
  (function(){var d=new Date();for(var i=0;i<5;i++){var c=cLog[d.toISOString().slice(0,10)];if(c&&c.sleep&&c.sleep<6)poorSleepDays++;d.setDate(d.getDate()-1);}})();
  if(poorSleepDays>=3) alerts.push({icon:'🟡',msg:'6時間未満の睡眠が'+poorSleepDays+'日。免疫力低下と怪我リスク増加に注意'});

  // 体重急変
  var bEntries=Object.entries(bLog).sort(function(a,b){return b[0].localeCompare(a[0]);});
  if(bEntries.length>=3){
    var recent=bEntries[0][1].weight;
    var older=bEntries[Math.min(6,bEntries.length-1)][1].weight;
    var wDiff=Math.abs(recent-older);
    if(wDiff>3) alerts.push({icon:'🟡',msg:'体重が短期間で'+Math.round(wDiff*10)/10+'kg変動。急激な変化は体調不良の可能性'});
  }

  // 栄養不足
  var nt3=calcTotals();
  var tgt2=Math.round((DB.players?.find(function(x){return x.id===pid;})?.weight||65)*35);
  if(nt3.kcal>0 && nt3.kcal<tgt2*0.4 && new Date().getHours()>16){
    alerts.push({icon:'🟡',msg:'摂取カロリーが目標の40%以下。エネルギー不足で練習効果が低下'});
  }

  // 痛み報告
  var todayCond3=cLog[today4];
  if(todayCond3?.pain) alerts.push({icon:'🔴',msg:'痛み報告: '+sanitize(todayCond3.pain,40)+'。無理な練習は避け、必要なら医師に相談'});

  return alerts;
}

// ── トレーニング推奨生成 ──
function generateTrainingRecommendation(){
  var p=DB.players.find(function(x){return x.id===(DB.currentUser||{}).id;});
  if(!p) return null;
  var pid=p.id;
  var log=DB.trainingLog[pid]||{};
  var cond=DB.conditionLog[pid]||{};
  var today=new Date().toISOString().slice(0,10);
  var todayCond=cond[today];

  // 直近3日のトレーニング部位を分析
  var recentMuscles={};
  for(var di=1;di<=3;di++){
    var d=new Date();d.setDate(d.getDate()-di);
    var dk=d.toISOString().slice(0,10);
    var dayLog=log[dk];
    if(dayLog&&dayLog.exercises){
      dayLog.exercises.forEach(function(ex){
        var name=ex.name.toLowerCase();
        if(name.includes('ベンチ')||name.includes('腕立て')||name.includes('チェスト')) recentMuscles['胸']=di;
        if(name.includes('スクワット')||name.includes('レッグ')||name.includes('ランジ')) recentMuscles['脚']=di;
        if(name.includes('デッドリフト')||name.includes('背中')||name.includes('ロウ')||name.includes('懸垂')) recentMuscles['背中']=di;
        if(name.includes('ショルダー')||name.includes('肩')||name.includes('プレス')&&!name.includes('ベンチ')) recentMuscles['肩']=di;
        if(name.includes('アーム')||name.includes('カール')||name.includes('腕')) recentMuscles['腕']=di;
        if(name.includes('腹')||name.includes('クランチ')||name.includes('プランク')) recentMuscles['腹筋']=di;
      });
    }
  }

  var suggestions=[];
  var allGroups=['胸','脚','背中','肩','腕','腹筋'];
  for(var gi=0;gi<allGroups.length;gi++){
    if(!recentMuscles[allGroups[gi]]) suggestions.push(allGroups[gi]);
  }

  var intensity='通常';
  if(todayCond){
    if(todayCond.mood<=2||todayCond.fatigue>=4) intensity='軽め';
    else if(todayCond.mood>=4&&todayCond.fatigue<=2) intensity='高め';
  }

  return {
    targetMuscles:suggestions.length>0?suggestions:['全身'],
    recentMuscles:recentMuscles,
    intensity:intensity,
    condMood:todayCond?.mood||0,
    restDays:Object.keys(log).length>0?Math.max(0,Math.floor((new Date()-new Date(Object.keys(log).sort().pop()))/(1000*60*60*24))):99
  };
}

// ── リカバリーアドバイス生成 ──
function generateRecoveryAdvice(){
  var p=DB.players.find(function(x){return x.id===(DB.currentUser||{}).id;});
  if(!p) return null;
  var pid=p.id;
  var cLog=DB.conditionLog[pid]||{};
  var entries=Object.entries(cLog).sort(function(a,b){return b[0].localeCompare(a[0]);}).slice(0,7);
  if(entries.length<2) return null;

  var avgMood=0,avgSleep=0,avgFatigue=0,cnt=0;
  var lowDays=0,poorSleep=0;
  entries.forEach(function(e){
    var c=e[1];
    if(c.mood){avgMood+=c.mood;cnt++;}
    if(c.mood<=2) lowDays++;
    if(c.sleep){avgSleep+=c.sleep;if(c.sleep<6) poorSleep++;}
    if(c.fatigue) avgFatigue+=c.fatigue;
  });
  if(!cnt) return null;
  avgMood=Math.round(avgMood/cnt*10)/10;
  avgSleep=entries.length?Math.round(avgSleep/entries.length*10)/10:0;
  avgFatigue=entries.length?Math.round(avgFatigue/entries.length*10)/10:0;

  var tips=[];
  if(avgMood<3) tips.push({icon:'⚠️',msg:'直近の平均コンディションが'+avgMood+'/5と低め。練習量を50%に落とし回復を優先しましょう',type:'warn'});
  if(avgSleep<6.5) tips.push({icon:'😴',msg:'平均睡眠'+avgSleep+'時間。7〜9時間を目標に就寝時間を30分早めてみましょう',type:'warn'});
  if(avgFatigue>3.5) tips.push({icon:'🔋',msg:'疲労度が高い状態が続いています。アクティブレスト（軽い散歩・ストレッチ）を取り入れましょう',type:'warn'});
  if(poorSleep>=3) tips.push({icon:'🛏️',msg:'6時間未満の睡眠が'+poorSleep+'日。就寝前のスマホオフとカフェイン制限を',type:'warn'});
  if(lowDays>=3) tips.push({icon:'📉',msg:'低コンディションが'+lowDays+'日続いています。完全休養日の確保を検討してください',type:'warn'});
  if(avgMood>=4&&avgSleep>=7) tips.push({icon:'✨',msg:'コンディション良好！このペースを維持しましょう',type:'good'});

  return {avgMood:avgMood,avgSleep:avgSleep,avgFatigue:avgFatigue,tips:tips,days:entries.length};
}

// ==================== CHAT (REAL) ====================
let activeRoom='g1',showEmoji=false;
const EMOJIS=['😊','😂','👍','🎉','⚽','🏃','💪','🔥','👏','❤️','😅','🙏','💯','🎯','🏆','✨','😄','👋','🤝','📣'];
const EMOJI_CATS={
  '😊 顔'   :['😊','😂','😄','🤣','😍','🥰','😎','🤔','😅','😢','😤','😱','🥳','😴','🤗','🙄','😏','🫡','🥺','😇'],
  '👍 手'   :['👍','👎','👏','🙌','✋','👋','🤝','🙏','💪','✌️','🤞','👊','🫶','☝️','🫵','✊'],
  '⚽ スポーツ':['⚽','🏃','🏋️','🤸','⛹️','🚴','🏊','🎯','🏆','🥇','🥈','🥉','🏅','🎖️','💪','⚾','🏀','🏈','🎾','🏐'],
  '❤️ 記号' :['❤️','🔥','✨','💯','⭐','💫','🎉','🎊','💡','📌','📎','🔗','✅','❌','⚠️','💬','📢','🔔','📣','🏁'],
  '🍽️ 食事' :['🍽️','🍚','🍙','🍜','🍕','🥗','🍎','🍌','🥩','🍗','🥛','💧','☕','🍵','🧃','🥤','🍺','🎂','🍰','🧁'],
  '😺 動物' :['🐶','🐱','🐻','🐼','🦁','🐮','🐷','🐸','🐵','🐔','🦄','🐲','🐍','🐢','🦋','🐝']
};
var _emojiCat='😊 顔';
// ── 重複チャットルーム統合 ──
// 同じ type + 同じ当事者ペアのルームをマージ（メッセージ統合・古い方を削除）
function _deduplicateChatRooms(){
  const keys=Object.keys(DB.chats);
  const merged=new Set();
  for(let i=0;i<keys.length;i++){
    if(merged.has(keys[i]))continue;
    const a=DB.chats[keys[i]];
    for(let j=i+1;j<keys.length;j++){
      if(merged.has(keys[j]))continue;
      const b=DB.chats[keys[j]];
      let isDup=false;
      // type='match': same coachId + teamId
      if(a.type==='match'&&b.type==='match'&&a.coachId&&a.teamId){
        isDup=(a.coachId===b.coachId&&a.teamId===b.teamId);
      }
      // type='team_match': same team pair (either direction)
      if(a.type==='team_match'&&b.type==='team_match'&&a.teamAId&&a.teamBId){
        isDup=((a.teamAId===b.teamAId&&a.teamBId===b.teamBId)||(a.teamAId===b.teamBId&&a.teamBId===b.teamAId));
      }
      if(isDup){
        // マージ: bのメッセージをaに統合、bを削除
        const bMsgs=(b.msgs||[]).filter(m=>{
          // 完全に同じメッセージは除外
          return !(a.msgs||[]).some(am=>am.text===m.text&&am.time===m.time&&am.from===m.from);
        });
        if(bMsgs.length>0){
          a.msgs=a.msgs||[];
          a.msgs.push({mid:_genMsgId(),from:'system',name:'システム',text:'── 会話を統合しました ──',time:now_time(),date:new Date().toISOString().slice(0,10),read:true});
          a.msgs.push(...bMsgs);
        }
        // 最新のreqId/matchIdを保持
        if(b.reqId)a.reqId=b.reqId;
        if(b.matchId)a.matchId=b.matchId;
        if(b.online)a.online=true;
        if(b.contractType)a.contractType=b.contractType;
        // subを最新に
        if(b.sub&&b.sub!=='マッチング申請中')a.sub=b.sub;
        // activeRoomがマージ先を指すように
        if(activeRoom===keys[j])activeRoom=keys[i];
        delete DB.chats[keys[j]];
        merged.add(keys[j]);
      }
    }
  }
  if(merged.size>0)saveDB();
}

