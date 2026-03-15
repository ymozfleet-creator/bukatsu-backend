// 14 - 選手画面: playerDash, コンディション入力, 体組成
function playerDash(){
  var u=DB.currentUser;
  var p=DB.players.find(function(x){return x.id===u?.id;});
  var team=p?DB.teams.find(function(t){return t.id===p.team;}):null;
  var coach=team?DB.coaches.find(function(c){return c.id===team.coach;}):null;

  // 有効化チェック
  if(u?.role==='player'&&!isPlayerActivated()){
    var s=getPlayerActivationStatus();
    var hh=new Date().getHours();
    var greetText2=hh<12?'おはようございます':hh<18?'こんにちは':'お疲れさまです';
    return '<div class="dash-greeting" style="background:linear-gradient(135deg,#ff6b2b 0%,#f59e0b 100%)">'+
      '<div><div class="dash-greeting-sub">'+greetText2+' ⚡</div>'+
      '<div class="dash-greeting-name">'+sanitize(p?.name||u?.name||'選手',14)+'</div>'+
      '<div class="dash-greeting-sub" style="margin-top:4px">'+(team?team.name:'チーム未所属')+'</div></div></div>'+
      playerLockedPage()+
      (!s.hasTeam?'<div style="text-align:center;margin-top:16px"><button class="btn btn-primary" onclick="goTo(\'profile\')">🏟️ チームに参加する</button></div>':'');
  }

  var pid=p?.id||'';
  var log=p?(DB.trainingLog[pid]||{}):{};
  var today=new Date().toISOString().slice(0,10);
  var todayLog=log[today];
  var hh=new Date().getHours();
  var greetText=hh<12?'おはよう':hh<18?'こんにちは':'お疲れさま';

  // 直近7日
  var last7=[];
  for(var i=0;i<7;i++){var dd=new Date();dd.setDate(dd.getDate()-6+i);last7.push(dd.toISOString().slice(0,10));}
  var weekSessions=0, weekKcal=0;
  for(var j=0;j<7;j++){var we=log[last7[j]];if(we){weekSessions++;weekKcal+=(we.kcal||0);}}

  var thisM=curMonth();
  var mLogs=Object.values(log).filter(function(e){return e?.date?.startsWith(thisM);});
  
  // 連続記録
  var streak=0;
  (function(){var d=new Date();while(true){var k=d.toISOString().slice(0,10);if(log[k]){streak++;d.setDate(d.getDate()-1);}else break;}})();

  // 体重・コンディション
  var bLog=DB.bodyLog[pid]||{};
  var cLog=DB.conditionLog[pid]||{};
  var todayBody=bLog[today];
  var todayCond=cLog[today];
  var latestWeight=todayBody?.weight||p?.weight||'--';
  var latestFat=todayBody?.bodyFat||'--';
  var todayMood=todayCond?.mood||0;
  var condEmoji=['','😣','😐','🙂','😊','😄'];

  // 栄養データ
  var nt=calcTotals();
  var targetKcal=p?.targetKcal||2200;
  var targetProtein=p?.targetProtein||Math.round((p?.weight||65)*1.6);
  var targetCarb=p?.targetCarb||Math.round(targetKcal*0.55/4);
  var targetFat=p?.targetFat||Math.round(targetKcal*0.25/9);
  var kcalPct=Math.min(Math.round(nt.kcal/targetKcal*100),150);
  var protPct=Math.min(Math.round(nt.protein/targetProtein*100),150);
  var carbPct=Math.min(Math.round(nt.carb/targetCarb*100),150);
  var fatPct=Math.min(Math.round(nt.fat/targetFat*100),150);
  var waterCount=DB.meals?.water||0;

  // 今日のスコア (0-100)
  var score=_calcDailyScore(todayLog,nt,targetKcal,targetProtein,todayCond,waterCount);
  var scoreColor=score>=80?'var(--teal)':score>=50?'var(--org)':'var(--red)';
  var scoreLabel=score>=80?'絶好調！':score>=60?'いい感じ':score>=40?'まだ伸びしろ':'今日はこれから';
  var scoreEmoji=score>=80?'🔥':score>=60?'💪':score>=40?'📈':'🌅';

  // コーチコメント
  var latestComment=p?.coachComments?.slice(-1)[0];

  // パーソナルベスト
  var pb=_getPersonalBests(log);

  var h='';

  // ── ヒーローセクション（スコア統合型） ──
  h+='<div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);border-radius:16px;padding:16px;margin-bottom:10px;color:#fff;position:relative;overflow:hidden">';
  h+='<div style="position:absolute;top:-20px;right:-20px;width:100px;height:100px;border-radius:50%;background:rgba(255,107,43,.15)"></div>';
  h+='<div style="position:absolute;bottom:-10px;left:-10px;width:60px;height:60px;border-radius:50%;background:rgba(0,207,170,.1)"></div>';
  // 上段: 挨拶 + 日付
  h+='<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">';
  h+='<div><div style="font-size:12px;color:rgba(255,255,255,.6)">'+greetText+' '+scoreEmoji+'</div>';
  h+='<div style="font-size:22px;font-weight:800;margin-top:2px">'+sanitize(p?.name||u?.name||'選手',14)+'</div>';
  h+='<div style="font-size:11px;color:rgba(255,255,255,.5);margin-top:2px">'+(team?team.name:'チーム未所属')+(coach?' · '+coach.name+' コーチ':'')+'</div></div>';
  h+='<div style="text-align:center;position:relative">';
  // スコアリング
  h+='<div style="width:54px;height:54px;border-radius:50%;border:2px solid '+scoreColor+';display:flex;align-items:center;justify-content:center;flex-direction:column;background:rgba(0,0,0,.3)">';
  h+='<div style="font-family:Montserrat,sans-serif;font-size:20px;font-weight:900;color:'+scoreColor+';line-height:1">'+score+'</div>';
  h+='<div style="font-size:8px;color:rgba(255,255,255,.5);letter-spacing:.05em">TODAY</div></div>';
  h+='<div style="font-size:9px;color:'+scoreColor+';margin-top:4px;font-weight:600">'+scoreLabel+'</div>';
  h+='</div></div>';

  // 中段: 3つのミニ指標
  h+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">';
  // 連続記録
  h+='<div style="text-align:center;background:rgba(255,255,255,.06);border-radius:12px;padding:10px 4px">';
  h+='<div style="font-family:Montserrat,sans-serif;font-size:20px;font-weight:800">'+(streak>0?'🔥 '+streak:'—')+'</div>';
  h+='<div style="font-size:9px;color:rgba(255,255,255,.5)">連続記録日</div></div>';
  // 今月の練習
  h+='<div style="text-align:center;background:rgba(255,255,255,.06);border-radius:12px;padding:10px 4px">';
  h+='<div style="font-family:Montserrat,sans-serif;font-size:20px;font-weight:800">'+mLogs.length+'<span style="font-size:11px;color:rgba(255,255,255,.4)">回</span></div>';
  h+='<div style="font-size:9px;color:rgba(255,255,255,.5)">今月の練習</div></div>';
  // コンディション
  h+='<div style="text-align:center;background:rgba(255,255,255,.06);border-radius:12px;padding:10px 4px">';
  h+='<div style="font-size:20px">'+(todayMood?condEmoji[todayMood]:'📝')+'</div>';
  h+='<div style="font-size:9px;color:rgba(255,255,255,.5)">'+(todayMood?'⭐'.repeat(todayMood):'未記録')+'</div></div>';
  h+='</div>';
  // 週間スコア推移（ミニスパークライン）
  var scoreTrend=[];
  for(var si2=0;si2<7;si2++){
    var sd=last7[si2];
    var sLog=log[sd];
    var sCond=cLog[sd];
    var sWater=(sd===today)?waterCount:0;
    var sNt=(sd===today)?nt:{kcal:0,protein:0};
    var sMealCount=(sd===today)?(DB.meals?.today||[]).length:0;
    if(sd!==today){
      var sMH=DB.mealHistory?.[sd]||[];
      sMealCount=sMH.length;
      var sMKcal=0,sMProt=0;for(var smi=0;smi<sMH.length;smi++){sMKcal+=(sMH[smi].kcal||0);sMProt+=(sMH[smi].protein||0);}
      sNt={kcal:sMKcal,protein:sMProt};
    }
    var ds=_calcDailyScore(sLog||null,sNt,targetKcal,targetProtein,sCond||null,sWater);
    scoreTrend.push(ds);
  }
  h+='<div style="display:flex;gap:3px;align-items:flex-end;height:18px;margin-top:12px;padding-top:10px;border-top:1px solid rgba(255,255,255,.08)">';
  for(var sti=0;sti<7;sti++){
    var sv=scoreTrend[sti];
    var sh=Math.max(3,sv/100*100);
    var sColor2=sv>=80?'#00cfaa':sv>=50?'#ff6b2b':sv>0?'#ef4444':'rgba(255,255,255,.15)';
    var sDay=['日','月','火','水','木','金','土'][new Date(last7[sti]+'T12:00').getDay()];
    h+='<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px">';
    if(sv>0) h+='<div style="font-size:7px;color:rgba(255,255,255,.4)">'+sv+'</div>';
    h+='<div style="width:100%;height:'+sh+'%;min-height:2px;background:'+sColor2+';border-radius:2px;opacity:'+(last7[sti]===today?1:.7)+'"></div>';
    h+='<div style="font-size:7px;color:rgba(255,255,255,.3)">'+sDay+'</div></div>';
  }
  h+='</div>';
  h+='</div>';

  // ── チーム未所属アラート ──
  if(!team){
    h+='<div class="dash-alert dash-alert-warn" onclick="goTo(\'profile\')" style="cursor:pointer">';
    h+='<i class="fa fa-users"></i><span>チームに参加していません</span>';
    h+='<button class="btn btn-primary btn-sm" style="margin-left:auto;flex-shrink:0" onclick="event.stopPropagation();goTo(\'profile\')">参加する</button></div>';
  }

  // ── コーチからの配信メニュー ──
  h += _renderAssignedWorkout(pid);

  // ── 今日のアクションカード ──
  if(todayLog){
    h+='<div class="today-action today-action-done">';
    h+='<div style="font-size:28px;flex-shrink:0">✅</div>';
    h+='<div style="flex:1;min-width:0"><div style="font-size:14px;font-weight:700;color:var(--teal)">トレーニング記録済み</div>';
    h+='<div style="font-size:12px;color:var(--txt3);margin-top:2px">'+(todayLog.exercises?.length?todayLog.exercises.length+'種目 · ':'')+''+(todayLog.duration||todayLog.time||0)+'分 · '+(todayLog.kcal||0)+'kcal</div></div>';
    h+='<button class="btn btn-ghost btn-sm" onclick="openLogDetail(\''+today+'\')">詳細</button></div>';
  } else {
    h+='<div class="today-action today-action-todo" style="cursor:pointer" onclick="startTrainingSession()">';
    h+='<div style="font-size:28px;flex-shrink:0">🏋️</div>';
    h+='<div style="flex:1;min-width:0"><div style="font-size:14px;font-weight:700">トレーニングを始めよう</div>';
    h+='<div style="font-size:12px;color:var(--txt3);margin-top:2px">種目を選んで重量・回数を記録</div></div>';
    h+='<button class="btn btn-primary btn-sm" onclick="event.stopPropagation();startTrainingSession()">開始</button></div>';
  }

  // ── 直近のイベント カウントダウン ──
  var nextEvt=_getNextUpcomingEvent();
  if(nextEvt){
    var evtIcons={practice:'🏃',match:'⚽',payment:'💰',event:'🎉',meeting:'📋',other:'📌'};
    var evtIcon=evtIcons[nextEvt.type]||'📌';
    h+='<div class="card" style="padding:10px 12px;margin-bottom:8px;display:flex;align-items:center;gap:10px;border-left:3px solid var(--blue)">';
    h+='<div style="font-size:24px">'+evtIcon+'</div>';
    h+='<div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:700">'+sanitize(nextEvt.title,30)+'</div>';
    h+='<div style="font-size:11px;color:var(--txt3)">'+nextEvt.dateLabel+'</div></div>';
    h+='<div style="text-align:right"><div style="font-family:Montserrat,sans-serif;font-size:18px;font-weight:800;color:var(--blue)">'+nextEvt.countdown+'</div>';
    h+='<div style="font-size:9px;color:var(--txt3)">'+nextEvt.countUnit+'</div></div></div>';
  }

  // ── 今日のミッション ──
  var missions=[];
  missions.push({id:'train',icon:'🏋️',label:'トレーニングを記録',done:!!todayLog,action:'startTrainingSession()'});
  missions.push({id:'meal3',icon:'🍽️',label:'3食記録する',done:(DB.meals?.today||[]).length>=3,progress:(DB.meals?.today||[]).length,max:3,action:"goTo('nutrition')"});
  missions.push({id:'water',icon:'💧',label:'水分6杯以上',done:waterCount>=6,progress:waterCount,max:6,action:"goTo('nutrition')"});
  missions.push({id:'cond',icon:'💪',label:'コンディションを記録',done:!!todayCond,action:"openConditionLogModal('"+pid+"','"+today+"')"});
  missions.push({id:'injury',icon:'🩹',label:'ケガ履歴を確認',done:((DB.injuryHistory||{})[pid]||[]).length>0,action:"openInjuryHistory('"+pid+"')"});
  missions.push({id:'stats',icon:'📈',label:'試合スタッツ',done:(DB.matchHistory||[]).length>0,action:"openPlayerStatsModal('"+pid+"')"});
  missions.push({id:'mental',icon:'🧠',label:'メンタルチェック',done:!!(DB.conditionLog?.[pid]?.[today]?.mentalMood),action:"openMentalCheckModal('"+pid+"')"});
  missions.push({id:'body',icon:'⚖️',label:'体重を記録',done:!!todayBody,action:"openBodyLogModal('"+pid+"','"+today+"')"});
  var missionDone=0;
  for(var mi=0;mi<missions.length;mi++){if(missions[mi].done) missionDone++;}
  var missionPct=Math.round(missionDone/missions.length*100);

  h+='<div class="card" style="padding:14px 16px;margin-bottom:12px">';
  h+='<div class="flex justify-between items-center mb-10">';
  h+='<div class="fw7 text-sm">🎯 今日のミッション</div>';
  h+='<div style="display:flex;align-items:center;gap:6px"><span style="font-size:12px;font-weight:700;color:'+(missionPct===100?'var(--teal)':'var(--org)')+'">'+missionDone+'/'+missions.length+'</span>';
  h+='<div style="width:50px;height:5px;background:var(--b2);border-radius:3px;overflow:hidden"><div style="height:100%;width:'+missionPct+'%;background:'+(missionPct===100?'var(--teal)':'var(--org)')+';border-radius:3px;transition:width .3s"></div></div></div></div>';
  for(var mi2=0;mi2<missions.length;mi2++){
    var ms=missions[mi2];
    h+='<div onclick="'+ms.action+'" style="display:flex;align-items:center;gap:10px;padding:8px 0;cursor:pointer;border-bottom:'+(mi2<missions.length-1?'1px solid var(--b1)':'none')+'">';
    h+='<div style="width:22px;height:22px;border-radius:7px;border:2px solid '+(ms.done?'var(--teal)':'var(--b2)')+';background:'+(ms.done?'var(--teal)':'transparent')+';display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .2s">';
    if(ms.done) h+='<svg width="12" height="12" viewBox="0 0 24 24" fill="#fff"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
    h+='</div>';
    h+='<span style="font-size:12px;flex:1;color:'+(ms.done?'var(--txt3)':'var(--txt1)')+';text-decoration:'+(ms.done?'line-through':'none')+'">'+ms.icon+' '+ms.label+'</span>';
    if(ms.progress!==undefined && !ms.done){
      h+='<span style="font-size:10px;color:var(--org);font-weight:600">'+ms.progress+'/'+ms.max+'</span>';
    }
    if(ms.done) h+='<span style="font-size:10px;color:var(--teal)">✓</span>';
    h+='</div>';
  }
  if(missionPct===100){
    h+='<div style="text-align:center;padding:8px 0 2px;font-size:12px;color:var(--teal);font-weight:700">🎉 全ミッション達成！素晴らしい一日です！</div>';
  }
  h+='</div>';

  // ── 栄養サマリー ──
  h+='<div class="card" style="padding:12px 14px;margin-bottom:8px">';
  h+='<div class="flex justify-between items-center mb-8">';
  h+='<div class="fw7 text-sm">🍽️ 今日の栄養</div>';
  h+='<button class="btn btn-ghost btn-xs" onclick="goTo(\'nutrition\')" style="font-size:11px">詳細 →</button></div>';
  // カロリー進捗
  h+='<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">';
  h+='<div style="font-family:Montserrat,sans-serif;font-size:28px;font-weight:800">'+Math.round(nt.kcal)+'</div>';
  h+='<div style="flex:1"><div style="font-size:10px;color:var(--txt3);margin-bottom:3px">/ '+targetKcal+' kcal ('+kcalPct+'%)</div>';
  h+='<div style="height:6px;background:var(--b2);border-radius:3px;overflow:hidden">';
  h+='<div style="height:100%;width:'+Math.min(kcalPct,100)+'%;background:'+(kcalPct>100?'var(--org)':'var(--teal)')+';border-radius:3px;transition:width .3s"></div></div></div></div>';
  // PFC バー
  h+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px">';
  var pfcData=[
    {label:'タンパク質',val:Math.round(nt.protein),target:targetProtein,pct:protPct,color:'#3b82f6'},
    {label:'炭水化物',val:Math.round(nt.carb),target:targetCarb,pct:carbPct,color:'#f59e0b'},
    {label:'脂質',val:Math.round(nt.fat),target:targetFat,pct:fatPct,color:'#ef4444'}
  ];
  for(var pi=0;pi<3;pi++){
    var pf=pfcData[pi];
    h+='<div><div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:3px">';
    h+='<span style="color:var(--txt3)">'+pf.label+'</span><span style="font-weight:700">'+pf.val+'<span style="color:var(--txt3);font-weight:400">g</span></span></div>';
    h+='<div style="height:4px;background:var(--b2);border-radius:2px;overflow:hidden">';
    h+='<div style="height:100%;width:'+Math.min(pf.pct,100)+'%;background:'+pf.color+';border-radius:2px"></div></div></div>';
  }
  h+='</div>';
  // 水分
  h+='<div style="display:flex;align-items:center;gap:6px;margin-top:10px;padding-top:10px;border-top:1px solid var(--b1)">';
  h+='<span style="font-size:13px">💧</span>';
  for(var wi=0;wi<8;wi++){
    h+='<div onclick="setWater('+(wi+1)+')" style="width:20px;height:20px;border-radius:50%;background:'+(wi<waterCount?'var(--blue)':'var(--b2)')+';cursor:pointer;transition:background .15s"></div>';
  }
  h+='<span style="font-size:11px;color:var(--txt3);margin-left:auto">'+waterCount+'/8</span></div>';
  h+='</div>';

  // ── 今日の予定 + 食事リマインダー ──
  h+=todayEventsWidget();
  h+=mealReminderWidget();

  // ── 週間アクティビティ + 体重/コンディション 横並び ──
  h+='<div class="dash-grid dash-grid-2" style="margin-bottom:12px">';
  
  // 左: 週間アクティビティ
  h+='<div class="card" style="padding:14px 16px;margin-bottom:0">';
  h+='<div class="flex justify-between items-center mb-8">';
  h+='<span class="fw7 text-sm">📊 週間トレーニング</span>';
  h+='<span class="text-xs text-muted">'+weekSessions+'/7日</span></div>';
  h+='<div style="display:flex;gap:4px;align-items:flex-end;height:55px">';
  for(var ai=0;ai<7;ai++){
    var dk=last7[ai];
    var entry=log[dk];
    var hasData=entry&&(entry.time||entry.duration||entry.cond);
    var mins=entry?.duration||entry?.time||0;
    var barH=mins?Math.max(15,Math.min(100,mins/90*100)):(hasData?15:4);
    var isToday=dk===today;
    var dayL=['日','月','火','水','木','金','土'][new Date(dk+'T12:00').getDay()];
    h+='<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px">';
    if(hasData) h+='<div style="font-size:8px;color:var(--txt3)">'+mins+'</div>';
    h+='<div style="width:100%;border-radius:5px 5px 2px 2px;background:'+(isToday?'var(--org)':hasData?'var(--teal)':'var(--b2)')+';height:'+barH+'%;min-height:3px;opacity:'+(isToday||hasData?1:.35)+'"></div>';
    h+='<div style="font-size:9px;color:'+(isToday?'var(--org)':'var(--txt3)')+';font-weight:'+(isToday?'700':'400')+'">'+dayL+'</div></div>';
  }
  h+='</div></div>';

  // 右: 体重 + コンディション
  h+='<div class="card" style="padding:14px 16px;margin-bottom:0">';
  h+='<div class="flex justify-between items-center mb-8">';
  h+='<span class="fw7 text-sm">⚖️ 体重・コンディション</span>';
  h+='<button class="btn btn-ghost btn-xs" onclick="openBodyLogModal(\''+pid+'\',\''+today+'\')">記録</button></div>';
  h+='<div style="display:flex;gap:16px;align-items:center;margin-bottom:8px">';
  h+='<div style="text-align:center"><div style="font-family:Montserrat,sans-serif;font-size:24px;font-weight:800">'+latestWeight+'<span style="font-size:11px;color:var(--txt3)">kg</span></div>';
  h+='<div style="font-size:9px;color:var(--txt3)">体重</div></div>';
  if(latestFat!=='--'){
    h+='<div style="text-align:center"><div style="font-family:Montserrat,sans-serif;font-size:20px;font-weight:800;color:var(--teal)">'+latestFat+'<span style="font-size:11px;color:var(--txt3)">%</span></div>';
    h+='<div style="font-size:9px;color:var(--txt3)">体脂肪</div></div>';
  }
  h+='<div style="text-align:center"><div style="font-size:24px">'+(todayMood?condEmoji[todayMood]:'📝')+'</div>';
  h+='<div style="font-size:9px;color:var(--txt3)">'+(todayCond?'睡眠'+todayCond.sleep+'h':'コンディション')+'</div></div>';
  h+='</div>';
  // ミニ体重グラフ
  var bLast7=last7.map(function(dk2){return bLog[dk2]?.weight||null;});
  var bMin=999,bMax=0;
  for(var bi=0;bi<7;bi++){if(bLast7[bi]){bMin=Math.min(bMin,bLast7[bi]);bMax=Math.max(bMax,bLast7[bi]);}}
  if(bMin>bMax){bMin=0;bMax=1;}
  var bRange=(bMax-bMin+4)||1;
  h+='<div style="display:flex;gap:3px;align-items:flex-end;height:30px">';
  for(var bj=0;bj<7;bj++){
    var bw=bLast7[bj];
    var bh=bw?Math.max(10,((bw-(bMin-2))/bRange)*100):0;
    h+='<div style="flex:1;height:'+bh+'%;min-height:'+(bw?3:1)+'px;background:'+(last7[bj]===today?'var(--org)':bw?'var(--teal)':'var(--b2)')+';border-radius:2px;opacity:'+(bw?.85:.25)+'"></div>';
  }
  h+='</div></div></div>';

  // ── レーダーチャート（5角形） ──
  h+='<div class="card" style="padding:14px 16px;margin-bottom:12px">';
  h+='<div class="flex justify-between items-center mb-8">';
  h+='<div class="fw7 text-sm">🎯 総合バランス</div>';
  h+='<span class="text-xs text-muted">今週の状態</span></div>';
  h+='<div style="height:180px"><canvas id="player-dash-kcal-chart"></canvas></div></div>';

  // ── コーチコメント ──
  if(latestComment){
    h+='<div class="card" style="padding:14px 16px;border-left:3px solid var(--org);margin-bottom:12px">';
    h+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">';
    h+='<span style="font-size:13px;font-weight:700">💬 コーチからのコメント</span>';
    h+='<span style="font-size:10px;color:var(--txt3)">'+(latestComment.date||'')+'</span></div>';
    h+='<div style="font-size:13px;color:var(--txt2);line-height:1.7">'+sanitize(latestComment.comment||'',200)+'</div></div>';
  }

  // ── パーソナルベスト ──
  if(pb.length>0){
    h+='<div class="card" style="padding:14px 16px;margin-bottom:12px">';
    h+='<div class="fw7 text-sm mb-8">🏆 パーソナルベスト</div>';
    h+='<div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:4px">';
    for(var pbi=0;pbi<Math.min(pb.length,4);pbi++){
      var rec=pb[pbi];
      h+='<div style="flex-shrink:0;background:linear-gradient(135deg,rgba(249,115,22,.08),rgba(0,207,170,.05));border:1px solid var(--b1);border-radius:12px;padding:10px 14px;min-width:120px">';
      h+='<div style="font-size:10px;color:var(--org);font-weight:700;margin-bottom:4px">'+sanitize(rec.name,15)+'</div>';
      h+='<div style="font-family:Montserrat,sans-serif;font-size:18px;font-weight:800">'+rec.val+'</div>';
      h+='<div style="font-size:9px;color:var(--txt3)">'+rec.unit+'</div></div>';
    }
    h+='</div></div>';
  }

  // ── 実績バッジ ──
  var badges=_getPlayerBadges(log,streak,mLogs.length,pb.length);
  if(badges.length>0){
    h+='<div class="card" style="padding:14px 16px;margin-bottom:12px">';
    h+='<div class="fw7 text-sm mb-8">🏅 実績</div>';
    h+='<div style="display:flex;flex-wrap:wrap;gap:8px">';
    for(var bdi=0;bdi<badges.length;bdi++){
      var bd=badges[bdi];
      h+='<div style="display:flex;align-items:center;gap:6px;padding:6px 12px;background:'+bd.bg+';border-radius:20px;border:1px solid '+bd.border+'">';
      h+='<span style="font-size:14px">'+bd.icon+'</span>';
      h+='<span style="font-size:11px;font-weight:600;color:'+bd.color+'">'+bd.label+'</span></div>';
    }
    h+='</div></div>';
  }

  // ── チームメイト活動 ──
  var teammates=_getTeammateActivity(p,team);
  if(teammates.length>0){
    h+='<div class="card" style="padding:14px 16px;margin-bottom:12px">';
    h+='<div class="flex justify-between items-center mb-8">';
    h+='<div class="fw7 text-sm">👥 チームメイトの活動</div>';
    h+='<button class="btn btn-ghost btn-xs" onclick="goTo(\'chat\')" style="font-size:11px">チャット →</button></div>';
    for(var ti2=0;ti2<Math.min(teammates.length,3);ti2++){
      var tm=teammates[ti2];
      h+='<div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:'+(ti2<Math.min(teammates.length,3)-1?'1px solid var(--b1)':'none')+'">';
      h+='<div style="width:28px;height:28px;border-radius:50%;background:'+tm.color+';display:flex;align-items:center;justify-content:center;font-size:12px;color:#fff;font-weight:700">'+tm.initial+'</div>';
      h+='<div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:600">'+sanitize(tm.name,12)+'</div>';
      h+='<div style="font-size:10px;color:var(--txt3)">'+tm.activity+'</div></div>';
      h+='<span style="font-size:14px">'+tm.icon+'</span></div>';
    }
    h+='</div>';
  }

  // ── AI ミニアドバイス ──
  var tip=_getDashTip(nt,targetKcal,targetProtein,todayLog,todayCond,waterCount);
  if(tip){
    h+='<div style="display:flex;align-items:center;gap:10px;padding:12px 16px;background:linear-gradient(90deg,rgba(0,207,170,.06),rgba(59,130,246,.04));border:1px solid rgba(0,207,170,.12);border-radius:14px;margin-bottom:12px;cursor:pointer" onclick="goTo(\'ai\')">';
    h+='<span style="font-size:20px">🤖</span>';
    h+='<div style="flex:1;font-size:12px;color:var(--txt2);line-height:1.5">'+tip+'</div>';
    h+='<span style="font-size:10px;color:var(--teal);flex-shrink:0">相談 →</span></div>';
  }

  // ── クイックアクション ──
  h+='<div class="action-grid">';
  var actions=[
    {icon:'🏋️',label:'トレーニング',sub:todayLog?(todayLog.exercises?.length||0)+'種目記録済':'メニューを確認',page:'training',done:!!todayLog},
    {icon:'🥗',label:'栄養管理',sub:Math.round(nt.kcal)+'/'+targetKcal+'kcal',page:'nutrition',done:kcalPct>=80},
    {icon:'📊',label:'マイ成績',sub:'記録を振り返る',page:'stats',done:false},
    {icon:'🤖',label:'AIアドバイス',sub:'相談する',page:'ai',done:false},
    {icon:'📅',label:'カレンダー',sub:'予定を確認',page:'calendar',done:false}
  ];
  for(var qi=0;qi<actions.length;qi++){
    var act=actions[qi];
    h+='<div class="action-card" onclick="goTo(\''+act.page+'\')" style="position:relative">';
    if(act.done) h+='<div style="position:absolute;top:6px;right:8px;width:8px;height:8px;border-radius:50%;background:var(--teal)"></div>';
    h+='<span style="font-size:28px;display:block;margin-bottom:6px">'+act.icon+'</span>';
    h+='<div style="font-size:12px;font-weight:700">'+act.label+'</div>';
    h+='<div style="font-size:10px;color:var(--txt3);margin-top:2px">'+act.sub+'</div></div>';
  }
  h+='</div>';

  return h;
}

// ── ヘルパー: 日次スコア計算 ──
function calcWellnessScore(playerId){
  var cLog=DB.conditionLog[playerId]||{};
  var dates=Object.keys(cLog).sort().slice(-7);
  if(dates.length<1) return null;
  var latestDate=dates[dates.length-1];
  var c=cLog[latestDate];
  if(!c) return null;
  var score=0;var max=0;
  // Mood (0-5) → 0-20pt
  score+=(c.mood||0)*4; max+=20;
  // Sleep hours (7-9 optimal) → 0-20pt
  var sh=c.sleep||0;
  if(sh>=7&&sh<=9) score+=20;
  else if(sh>=6) score+=14;
  else if(sh>=5) score+=8;
  else score+=2;
  max+=20;
  // Sleep quality → 0-15pt
  var sqMap={excellent:15,good:12,fair:8,poor:4,insomnia:0};
  score+=(sqMap[c.sleepQuality]||8); max+=15;
  // Fatigue (low=better, 1-5) → 0-15pt
  var fat=c.fatigue||3;
  score+=Math.max(0,(6-fat)*3); max+=15;
  // Pain (0=best) → 0-15pt
  var pain=c.painLevel||0;
  score+=Math.max(0,15-pain*1.5); max+=15;
  // RPE appropriateness (3-7 is ideal range) → 0-15pt
  var rpe=c.rpe||0;
  if(rpe>=3&&rpe<=7) score+=15;
  else if(rpe>=1&&rpe<=8) score+=10;
  else score+=5;
  max+=15;
  var pct=max>0?Math.round(score/max*100):0;
  return {score:pct,mood:c.mood,sleep:c.sleep,sleepQuality:c.sleepQuality,fatigue:c.fatigue,pain:c.painLevel,rpe:c.rpe,date:latestDate};
}

function _calcDailyScore(todayLog,nt,targetKcal,targetProtein,todayCond,waterCount){
  var score=0;
  // トレーニング (0-30)
  if(todayLog){
    var dur=todayLog.duration||todayLog.time||0;
    score+=Math.min(30, dur>=60?30:dur>=30?22:dur>=15?15:10);
  }
  // 栄養 (0-30)
  var kcalRatio=targetKcal>0?nt.kcal/targetKcal:0;
  if(kcalRatio>=0.8&&kcalRatio<=1.2) score+=15; else if(kcalRatio>=0.5) score+=8;
  var protRatio=targetProtein>0?nt.protein/targetProtein:0;
  if(protRatio>=0.8) score+=15; else if(protRatio>=0.5) score+=8;
  // コンディション (0-20)
  if(todayCond){
    score+=Math.min(20, (todayCond.mood||0)*4);
  }
  // 水分 (0-10)
  score+=Math.min(10, waterCount>=6?10:waterCount>=4?6:waterCount>=2?3:0);
  // 食事記録回数 (0-10)
  var mealCount=(DB.meals?.today||[]).length;
  score+=Math.min(10, mealCount>=3?10:mealCount>=2?6:mealCount>=1?3:0);
  return Math.min(100,Math.max(0,Math.round(score)));
}

// ── ヘルパー: パーソナルベスト ──
function _getPersonalBests(log){
  var bests={};
  var entries=Object.values(log);
  for(var i=0;i<entries.length;i++){
    var e=entries[i];
    if(!e?.exercises) continue;
    for(var j=0;j<e.exercises.length;j++){
      var ex=e.exercises[j];
      if(!ex.name||!ex.sets) continue;
      for(var k=0;k<ex.sets.length;k++){
        var s=ex.sets[k];
        var w=parseFloat(s.weight)||0;
        if(w>0){
          var key=ex.name;
          if(!bests[key]||w>bests[key].w){
            bests[key]={w:w,reps:s.reps||0};
          }
        }
      }
    }
  }
  var result=[];
  for(var name in bests){
    if(bests.hasOwnProperty(name)){
      result.push({name:name,val:bests[name].w+'kg',unit:bests[name].reps+'reps'});
    }
  }
  result.sort(function(a,b){return parseFloat(b.val)-parseFloat(a.val);});
  return result.slice(0,4);
}

// ── ヘルパー: AIミニTip ──
function _getDashTip(nt,targetKcal,targetProtein,todayLog,todayCond,waterCount){
  var hh=new Date().getHours();
  if(hh<10 && (DB.meals?.today||[]).length===0) return '朝食はまだですか？練習前のエネルギー補給が大切です。';
  if(hh>=12 && hh<14 && nt.kcal<targetKcal*0.3) return 'お昼を食べましょう。午後の練習に向けて炭水化物を中心に。';
  if(waterCount<3 && hh>12) return '水分補給を忘れずに！練習中は15分ごとにコップ1杯が目安です。';
  if(nt.protein<targetProtein*0.5 && hh>16) return 'タンパク質が不足気味です。練習後30分以内にプロテインや鶏肉を摂りましょう。';
  if(todayLog && !todayCond) return 'トレーニングお疲れさま！今日のコンディションを記録しておきましょう。';
  if(todayCond && todayCond.mood<=2) return '調子が優れないようですね。無理せず軽めの運動やストレッチがおすすめです。';
  if(todayCond && todayCond.sleep && todayCond.sleep<6) return '睡眠時間が短めです。7-9時間の睡眠で回復力がアップします。';
  if(nt.kcal>targetKcal*1.2) return 'カロリーが目標を超えています。夕食は野菜中心にするとバランスが良くなります。';
  if(todayLog && todayLog.duration>=60) return 'ハードトレーニングお疲れさま！しっかり休息と栄養補給で明日に備えましょう。';
  if(hh>=21 && !todayCond) return '寝る前にコンディションを記録しましょう。翌日の体調管理に役立ちます。';
  if(nt.carb<(targetKcal*0.55/4)*0.3 && hh<17) return '炭水化物が不足気味。練習前はおにぎりやパンでエネルギーチャージを。';
  if(hh>=6 && hh<9) return '朝の時間はストレッチに最適。5分間の柔軟で怪我予防につながります。';
  return null;
}
// ── ヘルパー: 次のイベント取得 ──
function _getNextUpcomingEvent(){
  var now=new Date();
  var allEvents=(DB.events||[]).concat(DB.teamEvents||[]);
  var upcoming=[];
  for(var ei=0;ei<allEvents.length;ei++){
    var ev=allEvents[ei];
    var evDate;
    if(ev.date && typeof ev.date==='number' && ev.year!==undefined){
      evDate=new Date(ev.year,ev.month,ev.date);
    } else if(typeof ev.date==='string' && ev.date.includes('-')){
      evDate=new Date(ev.date+'T'+(ev.time||'23:59'));
    } else continue;
    if(evDate>now){
      var diff=evDate-now;
      var days=Math.floor(diff/(1000*60*60*24));
      var hours=Math.floor((diff%(1000*60*60*24))/(1000*60*60));
      upcoming.push({
        title:ev.title||ev.name||'予定',
        type:ev.type||'other',
        dateObj:evDate,
        dateLabel:evDate.toLocaleDateString('ja-JP',{month:'short',day:'numeric',weekday:'short'})+(ev.time?' '+ev.time:''),
        countdown:days>0?days:hours,
        countUnit:days>0?'日後':hours+'時間後',
        diff:diff
      });
    }
  }
  upcoming.sort(function(a,b){return a.diff-b.diff;});
  return upcoming[0]||null;
}

// ── ヘルパー: 実績バッジ ──
function _getPlayerBadges(log,streak,monthSessions,pbCount){
  var badges=[];
  if(streak>=7) badges.push({icon:'🔥',label:streak+'日連続',bg:'rgba(249,115,22,.08)',border:'rgba(249,115,22,.2)',color:'var(--org)'});
  else if(streak>=3) badges.push({icon:'⚡',label:streak+'日連続',bg:'rgba(249,115,22,.06)',border:'rgba(249,115,22,.15)',color:'var(--org)'});
  if(monthSessions>=20) badges.push({icon:'🏆',label:'月間20回達成',bg:'rgba(234,179,8,.08)',border:'rgba(234,179,8,.2)',color:'#b45309'});
  else if(monthSessions>=10) badges.push({icon:'🥇',label:'月間10回達成',bg:'rgba(234,179,8,.06)',border:'rgba(234,179,8,.15)',color:'#b45309'});
  if(pbCount>=5) badges.push({icon:'💎',label:'PB '+pbCount+'種目',bg:'rgba(139,92,246,.08)',border:'rgba(139,92,246,.2)',color:'#7c3aed'});
  var totalSessions=Object.keys(log).length;
  if(totalSessions>=100) badges.push({icon:'👑',label:'通算100回',bg:'rgba(234,179,8,.1)',border:'rgba(234,179,8,.25)',color:'#92400e'});
  else if(totalSessions>=50) badges.push({icon:'🌟',label:'通算50回',bg:'rgba(59,130,246,.08)',border:'rgba(59,130,246,.2)',color:'#2563eb'});
  var waterOk=(DB.meals?.water||0)>=6;
  if(waterOk) badges.push({icon:'💧',label:'水分OK',bg:'rgba(59,130,246,.06)',border:'rgba(59,130,246,.15)',color:'#2563eb'});
  return badges.slice(0,5);
}

// ── ヘルパー: チームメイト活動 ──
function _getTeammateActivity(myPlayer,team){
  if(!team||!myPlayer) return [];
  var result=[];
  var teamPlayers=DB.players.filter(function(pl){return pl.team===team.id && pl.id!==myPlayer.id;});
  var today2=new Date().toISOString().slice(0,10);
  for(var tpi=0;tpi<teamPlayers.length;tpi++){
    var tp=teamPlayers[tpi];
    var tLog=DB.trainingLog[tp.id]||{};
    var hasTodayLog=!!tLog[today2];
    var tCond=DB.conditionLog[tp.id]||{};
    var hasTodayCond=!!tCond[today2];
    var activity='';var icon='';
    if(hasTodayLog){activity='トレーニング記録済み';icon='🏋️';}
    else if(hasTodayCond){activity='コンディション記録済み';icon='💪';}
    else{activity='まだ記録なし';icon='💤';}
    result.push({
      name:tp.name||'選手',
      initial:(tp.name||'?')[0],
      color:tp.color||'#64748b',
      activity:activity,
      icon:icon,
      hasLog:hasTodayLog
    });
  }
  result.sort(function(a,b){return (b.hasLog?1:0)-(a.hasLog?1:0);});
  return result;
}


// ==================== FOOD DATABASE ====================
