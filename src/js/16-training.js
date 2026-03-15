// 16 - トレーニング: trainingPage, ワークアウト, エクササイズDB, セット管理
function trainingPage(){
  const player=DB.players.find(x=>x.id===DB.currentUser?.id);
  const log=player?(DB.trainingLog[player.id]||{}):{}; 
  const today=new Date().toISOString().slice(0,10);
  const todayLog=log[today];
  const session=window._trSession;

  // 今週データ
  const weekStart=new Date();weekStart.setDate(weekStart.getDate()-weekStart.getDay());
  const last7=Array.from({length:7},(_,i)=>{const d=new Date(weekStart);d.setDate(weekStart.getDate()+i);return d.toISOString().slice(0,10);});
  const weekDays=['日','月','火','水','木','金','土'];
  const weekLogs=last7.map(dk=>log[dk]||null);
  const weekSessions=weekLogs.filter(Boolean).length;
  const weekMin=weekLogs.reduce((s,e)=>s+(e?.duration||e?.time||0),0);
  const weekKcal=weekLogs.reduce((s,e)=>s+(e?.kcal||0),0);
  const weekTotalVol=weekLogs.reduce((s,e)=>{
    if(!e||!e.exercises)return s;
    return s+e.exercises.reduce((ss,ex)=>(ex.sets||[]).reduce((sss,set)=>sss+(set.weight||0)*(set.reps||0),ss),0);
  },0);

  // 今月
  const thisM=curMonth();
  const mLogs=Object.values(log).filter(e=>e?.date?.startsWith(thisM));
  const mSessions=mLogs.length;
  const mKcal=mLogs.reduce((s,e)=>s+(e?.kcal||0),0);

  // 全件
  const allEntries=Object.values(log).filter(e=>e&&e.date);

  // ストリーク
  let streak=0;const dd=new Date();
  for(let i=0;i<365;i++){const dk=new Date(dd);dk.setDate(dd.getDate()-i);if(log[dk.toISOString().slice(0,10)]){streak++;}else if(i>0){break;}}

  return`<div class="pg-head flex justify-between items-center" style="flex-wrap:wrap;gap:10px">
    <div><div class="pg-title">トレーニング管理</div><div class="pg-sub">エリートレベルの記録・分析・プログラム管理</div></div>
    <div class="flex gap-8 flex-wrap">
      <button class="btn btn-primary btn-sm" onclick="startTrainingSession()" style="padding:10px 16px;font-size:13px"><i class="fa fa-play" style="margin-right:5px"></i> ${session.active?'セッション継続':'トレーニング開始'}</button>
      <button class="btn btn-ghost btn-sm" onclick="openPRDashboard()" style="padding:10px 12px;font-size:12px">🏆 PR分析</button>
      <button class="btn btn-ghost btn-sm" onclick="openVolumeGuide()" style="padding:10px 12px;font-size:12px">📊 ボリューム</button>
      <button class="btn btn-ghost btn-sm" onclick="openProgramTemplates()" style="padding:10px 12px;font-size:12px">📋 プログラム</button>
    </div>
  </div>

  ${session.active?`<div class="dash-alert dash-alert-success" style="margin-bottom:16px">
    <i class="fa fa-dumbbell" style="font-size:18px"></i>
    <div style="flex:1">
      <div style="font-weight:700">トレーニング中 🔥</div>
      <div style="font-size:12px;margin-top:2px">${session.exercises.length}種目 · ${Math.round((Date.now()-(session.startTime||Date.now()))/60000)}分経過</div>
    </div>
    <button class="btn btn-primary btn-sm" onclick="startTrainingSession()">記録を続ける</button>
    <button class="btn btn-ghost btn-sm" onclick="finishTrainingSession()">完了</button>
  </div>`:''}

  <div class="dash-section" style="margin-bottom:16px">
    <div class="flex justify-between items-center mb-14">
      <div class="fw7" style="font-size:14px">📅 今週のトレーニング</div>
      <div style="font-size:12px;color:var(--txt3)">${weekSessions}日 · ${weekMin}分 · ${Math.round(weekTotalVol/1000)}t</div>
    </div>
    <div style="display:flex;gap:6px">
      ${last7.map((dk,i)=>{
        const entry=weekLogs[i];const isToday=dk===today;
        return`<div style="flex:1;text-align:center">
          <div style="width:100%;aspect-ratio:1;border-radius:12px;background:${entry?'linear-gradient(135deg,var(--org),#f59e0b)':isToday?'var(--surf3)':'var(--surf2)'};border:${isToday?'2px solid var(--org)':'1px solid var(--b1)'};display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;transition:all .2s"
            onclick="${entry?`openLogDetail('${dk}')`:`openTrainingLogModal('${dk}')`}"
            onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform=''">
            ${entry?`<div style="font-size:16px;color:#fff">✓</div><div style="font-size:8px;color:rgba(255,255,255,.85)">${entry.duration||entry.time||0}分</div>`:isToday?`<div style="font-size:20px;color:var(--org)">+</div>`:`<div style="font-size:14px;color:var(--txt3);opacity:.4">-</div>`}
          </div>
          <div style="font-size:10px;color:${isToday?'var(--org)':'var(--txt3)'};font-weight:${isToday?'700':'400'};margin-top:4px">${weekDays[i]}</div>
        </div>`;
      }).join('')}
    </div>
  </div>

  <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-bottom:16px">
    ${[
      {v:mSessions,u:'回',l:'今月の練習',c:'var(--org)',ic:'🏋️'},
      {v:(mKcal/1000).toFixed(1),u:'k',l:'消費kcal',c:'var(--teal)',ic:'🔥'},
      {v:Math.round(weekMin/60*10)/10,u:'h',l:'今週時間',c:'var(--blue)',ic:'⏱️'},
      {v:weekSessions,u:'/7',l:'今週達成',c:'#a855f7',ic:'✅'},
      {v:Math.round(weekTotalVol/1000),u:'t',l:'週間Volume',c:'#ef4444',ic:'📊'},
      {v:streak,u:'日',l:'連続記録',c:'#eab308',ic:'🔥'},
    ].map(d=>`<div style="text-align:center;padding:12px 6px;background:var(--surf2);border-radius:12px;border-top:3px solid ${d.c}">
      <div style="font-size:10px">${d.ic}</div>
      <div style="font-size:18px;font-weight:800;color:${d.c};margin-top:2px">${d.v}<span style="font-size:10px;color:var(--txt3)">${d.u}</span></div>
      <div style="font-size:9px;color:var(--txt3);margin-top:2px">${d.l}</div>
    </div>`).join('')}
  </div>

  ${(()=>{
    if(!player) return '';
    const wv=getWeeklyVolume(player.id);const overload=detectProgressiveOverload(player.id);
    const volParts=Object.keys(wv.volume).filter(p=>wv.volume[p]>0);
    if(!volParts.length && !overload.length) return '';
    let h='<div class="dash-grid dash-grid-2" style="margin-bottom:16px">';
    h+='<div class="dash-section" style="margin-bottom:0"><div class="dash-section-head"><span class="dash-section-title">🏋️ 今週の部位別ボリューム</span></div>';
    if(volParts.length){const maxV=Math.max(...volParts.map(p=>wv.volume[p]))||1;
      volParts.forEach(vp=>{const v=wv.volume[vp];const s=wv.sets[vp];const bW=Math.max(10,v/maxV*100);
        h+='<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px"><span style="width:22px;font-size:14px">'+(EXERCISE_DB[vp]?.emoji||'💪')+'</span><div style="flex:1;height:6px;background:var(--b2);border-radius:3px"><div style="width:'+bW+'%;height:100%;background:var(--org);border-radius:3px"></div></div><span style="font-size:9px;color:var(--txt3);min-width:50px;text-align:right">'+Math.round(v/1000)+'k · '+s+'set</span></div>';
      });
    } else {h+='<div style="text-align:center;padding:12px;color:var(--txt3);font-size:11px">今週はまだ記録がありません</div>';}
    h+='</div>';
    h+='<div class="dash-section" style="margin-bottom:0"><div class="dash-section-head"><span class="dash-section-title">📈 成長トラッカー</span><button class="btn btn-ghost btn-xs" onclick="openPRDashboard()">詳細 →</button></div>';
    if(overload.length){overload.slice(0,4).forEach(o=>{
      h+='<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--b1)"><span style="font-size:14px">'+(EXERCISE_DB[o.part]?.emoji||'💪')+'</span><span style="flex:1;font-size:12px;font-weight:600">'+sanitize(o.name,20)+'</span><span style="font-size:12px;font-weight:800;color:var(--teal)">+'+o.pct+'%</span></div>';
    });}else{h+='<div style="text-align:center;padding:12px;color:var(--txt3);font-size:11px">4週間分のデータで成長を検知</div>';}
    h+='</div></div>';return h;
  })()}

  <div class="dash-grid dash-grid-2" style="margin-bottom:16px">
    <div class="dash-section" style="margin-bottom:0">
      <div class="dash-section-head">
        <span class="dash-section-title">📋 メニュー&プログラム</span>
        <button class="btn btn-ghost btn-xs" onclick="openProgramTemplates()">テンプレ →</button>
      </div>
      ${getAllWorkouts().map(w=>`<div style="padding:10px 12px;background:var(--surf2);border-radius:10px;margin-bottom:6px;cursor:pointer;border-left:3px solid ${w.color};transition:all .15s" onclick="toggleWD('${w.id}')" onmouseover="this.style.background='var(--surf3)'" onmouseout="this.style.background='var(--surf2)'">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div><div style="font-size:12px;font-weight:700">${sanitize(w.day,10)} — ${sanitize(w.type,20)}</div>
          <div style="font-size:10px;color:var(--txt3)">${w.exercises.length}種目${w.custom?' · カスタム':''}</div></div>
          <div style="display:flex;align-items:center;gap:8px">
            <div style="width:40px;height:4px;background:var(--b2);border-radius:2px;overflow:hidden"><div style="width:${w.intensity||50}%;height:100%;background:${w.color};border-radius:2px"></div></div>
            ${w.custom?`<button class="btn btn-ghost btn-xs" onclick="event.stopPropagation();deleteCustomWorkout('${w.id}')" style="padding:4px 6px">🗑</button>`:''}
          </div>
        </div>
        <div id="wd-${w.id}" style="display:none;margin-top:10px;padding-top:10px;border-top:1px solid var(--b1)">
          ${w.exercises.map(ex=>`<div style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:11px"><span style="color:var(--org)">•</span><span style="flex:1;font-weight:600">${sanitize(ex.name,30)}</span><span style="color:var(--txt3)">${ex.sets}×${ex.reps}${ex.unit||'回'}${ex.weight?' · '+ex.weight+'kg':''}</span></div>`).join('')}
        </div>
      </div>`).join('')}
      <button class="btn btn-ghost btn-sm w-full" onclick="openAddWorkoutForm()" style="margin-top:4px;font-size:11px">+ カスタムメニュー追加</button>
    </div>
    <div class="dash-section" style="margin-bottom:0">
      <div class="dash-section-head"><span class="dash-section-title">📊 直近の記録</span></div>
      ${allEntries.sort((a,b)=>b.date>a.date?1:-1).slice(0,6).map(e=>{
        const exList=(e.exercises||[]);
        const partEmojis=[...new Set(exList.map(ex=>EXERCISE_DB[ex.part]?.emoji||'💪'))].join('');
        const vol=exList.reduce((s,ex)=>(ex.sets||[]).reduce((ss,set)=>ss+(set.weight||0)*(set.reps||0),s),0);
        return`<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--b1);cursor:pointer" onclick="openLogDetail('${e.date}')">
          <div style="width:44px;text-align:center;flex-shrink:0"><div style="font-size:11px;font-weight:700;color:var(--org)">${(e.date||'').slice(5,7)}/${(e.date||'').slice(8)}</div><div style="font-size:9px;color:var(--txt3)">${weekDays[new Date(e.date+'T12:00').getDay()]}</div></div>
          <div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${partEmojis} ${sanitize(e.memo||'トレーニング',20)}</div>
          <div style="font-size:10px;color:var(--txt3)">${exList.length}種目 · ${e.duration||e.time||0}分${vol>0?' · '+Math.round(vol/1000)+'k vol':''}</div></div>
          ${e.cond?`<span style="font-size:10px">${'⭐'.repeat(Math.min(e.cond,5))}</span>`:''}
          <i class="fa fa-chevron-right" style="color:var(--txt3);font-size:10px;opacity:.4"></i>
        </div>`;
      }).join('')||'<div class="text-muted text-sm text-center" style="padding:24px">記録がありません<br><button class="btn btn-primary btn-sm mt-12" onclick="startTrainingSession()">最初のトレーニングを記録 →</button></div>'}
    </div>
  </div>

  <div class="dash-section">
    <div class="dash-section-head"><span class="dash-section-title">🏋️ 種目から記録を始める</span></div>
    <div style="margin-bottom:12px"><input class="input" id="ex-search-input" type="text" placeholder="🔍 種目を検索（例：ベンチ、スクワット...）" style="font-size:13px" oninput="filterExercises(this.value)"></div>
    <div id="ex-search-results" style="display:none;margin-bottom:12px"></div>
    <div id="ex-part-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:6px">
      ${Object.entries(EXERCISE_DB).map(([k,v])=>`<div style="text-align:center;padding:12px 6px;background:var(--surf2);border-radius:12px;cursor:pointer;transition:all .15s;border:1px solid var(--b1)" onclick="startTrainingWithPart('${k}')" onmouseover="this.style.background='var(--surf3)';this.style.borderColor='var(--org)'" onmouseout="this.style.background='var(--surf2)';this.style.borderColor='var(--b1)'">
        <div style="font-size:20px;margin-bottom:2px">${v.emoji}</div>
        <div style="font-size:10px;font-weight:600">${v.name}</div>
        <div style="font-size:8px;color:var(--txt3)">${v.exercises.length}種目</div>
      </div>`).join('')}
    </div>
  </div>`;
}

function filterExercises(q){
  const resultsEl=document.getElementById('ex-search-results');
  const gridEl=document.getElementById('ex-part-grid');
  if(!resultsEl||!gridEl)return;
  if(!q||q.length<1){resultsEl.style.display='none';gridEl.style.display='';return;}
  const query=q.toLowerCase();const matches=[];
  Object.entries(EXERCISE_DB).forEach(([part,cat])=>{
    cat.exercises.forEach(ex=>{
      if(ex.name.toLowerCase().includes(query)||ex.id.toLowerCase().includes(query)||cat.name.includes(query)){
        matches.push({...ex,part,partName:cat.name,partEmoji:cat.emoji});
      }
    });
  });
  gridEl.style.display='none';
  if(!matches.length){resultsEl.innerHTML='<div style="text-align:center;padding:12px;color:var(--txt3);font-size:12px">該当する種目がありません</div>';resultsEl.style.display='';return;}
  resultsEl.innerHTML=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px">${matches.slice(0,12).map(ex=>{
    const safeName=ex.name.replace(/'/g,"\\'");
    return`<button onclick="startTrainingSession();setTimeout(()=>openSetInput('${ex.part}','${ex.id}','${safeName}'),100)" style="padding:8px 10px;background:var(--surf2);border:1px solid var(--b1);border-radius:8px;cursor:pointer;text-align:left;font-size:12px;display:flex;align-items:center;gap:6px;transition:all .15s" onmouseover="this.style.borderColor='var(--org)'" onmouseout="this.style.borderColor='var(--b1)'">
      <span style="font-size:14px">${ex.partEmoji}</span>
      <div><div style="font-weight:600">${sanitize(ex.name,20)}</div><div style="font-size:9px;color:var(--txt3)">${ex.partName}${ex.type?' · '+ex.type:''}</div></div>
    </button>`;
  }).join('')}</div>${matches.length>12?`<div style="text-align:center;font-size:10px;color:var(--txt3);margin-top:4px">+${matches.length-12}件</div>`:''}`;
  resultsEl.style.display='';
}

function openProgramTemplates(){
  let h='<div style="display:grid;gap:12px">';
  PROGRAM_TEMPLATES.forEach(p=>{
    h+=`<div style="padding:14px;background:var(--surf2);border-radius:14px;border-left:4px solid ${p.color}">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div><div style="font-size:14px;font-weight:800">${p.name}</div><div style="font-size:11px;color:var(--txt3)">${p.desc} · ${p.days.length}日構成</div></div>
        <button class="btn btn-primary btn-sm" onclick="adoptProgram('${p.id}')" style="font-size:11px;padding:6px 12px">採用する</button>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">${p.days.map(d=>`<div style="padding:6px 10px;background:var(--surf);border-radius:8px;border:1px solid var(--b1);font-size:10px;flex:1;min-width:100px">
        <div style="font-weight:700;margin-bottom:2px">${d.day}</div>
        ${d.exercises.slice(0,3).map(e=>{const info=Object.values(EXERCISE_DB).flatMap(c=>c.exercises).find(x=>x.id===e.exId);return`<div style="color:var(--txt3)">${info?.name||e.exId} ${e.sets}×${e.reps}</div>`;}).join('')}
        ${d.exercises.length>3?`<div style="color:var(--txt3)">+${d.exercises.length-3}種目</div>`:''}
      </div>`).join('')}</div>
    </div>`;
  });
  h+='</div>';openM('📋 プログラムテンプレート',h,true);
}

function adoptProgram(progId){
  const prog=PROGRAM_TEMPLATES.find(p=>p.id===progId);
  if(!prog){toast('プログラムが見つかりません','e');return;}
  if(!DB.customWorkouts)DB.customWorkouts=[];
  prog.days.forEach((d,i)=>{
    const w={id:'prog-'+progId+'-'+i,day:d.day,type:prog.name,intensity:75,color:prog.color,custom:true,
      exercises:d.exercises.map(e=>{const info=Object.values(EXERCISE_DB).flatMap(c=>c.exercises).find(x=>x.id===e.exId);return{name:info?.name||e.exId,sets:e.sets,reps:e.reps,unit:'回',rest:90};})};
    DB.customWorkouts=DB.customWorkouts.filter(x=>x.id!==w.id);
    _dbArr('customWorkouts').push(w);
  });
  saveDB();closeM();toast(prog.name+' を採用しました！','s');goTo('training');
}

function initTraining(){
  // トレーニングページ初期化（イベントリスナー設定）
  document.addEventListener('click',function(e){
    if(!e.target.closest('#training-search')&&!e.target.closest('#training-results')){
      var r=document.getElementById('training-results');if(r)r.style.display='none';
    }
  });
}

// ── トレーニングセッション ──
function startTrainingSession(part){
  const s=window._trSession;
  if(!s.active){s.active=true;s.exercises=[];s.startTime=Date.now();s.elapsed=0;}
  openTrainingSessionModal(part||null);
}
function startTrainingWithPart(part){startTrainingSession(part);}

function openTrainingSessionModal(focusPart){
  const s=window._trSession;
  const exList=s.exercises||[];
  const totalSets=exList.reduce((sum,e)=>sum+e.sets.length,0);
  const totalKcal=exList.reduce((sum,e)=>{
    const db=Object.values(EXERCISE_DB).flatMap(p=>p.exercises).find(x=>x.id===e.exId);
    return sum+(db?.kcalPerSet||5)*e.sets.length;
  },0);
  const totalVol=exList.reduce((sum,e)=>sum+e.sets.reduce((ss,set)=>ss+(set.weight||0)*(set.reps||0),0),0);
  const elapsed=s.startTime?Math.round((Date.now()-s.startTime)/60000):0;

  // 部位選択
  const partSelector=`<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:10px">
    ${Object.entries(EXERCISE_DB).map(([k,v])=>`<button onclick="document.getElementById('tr-part-select').value='${k}';updateExerciseList('${k}')" style="padding:4px 10px;border-radius:16px;border:1px solid ${focusPart===k?'var(--org)':'var(--b1)'};background:${focusPart===k?'var(--org)':'var(--surf2)'};color:${focusPart===k?'#fff':'var(--txt2)'};font-size:11px;font-weight:600;cursor:pointer;transition:all .15s">${v.emoji} ${v.name}</button>`).join('')}
    <input type="hidden" id="tr-part-select" value="${focusPart||''}">
  </div>`;

  // 記録済み種目 (enhanced with volume)
  const recordedHtml=exList.length?`<div style="margin-bottom:12px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
      <div style="font-size:11px;font-weight:700;color:var(--txt3)">✅ 記録済み (${exList.length}種目)</div>
      <div style="font-size:10px;color:var(--txt3)">${totalSets}set · ${Math.round(totalVol)}kg·vol · ~${totalKcal}kcal</div>
    </div>
    ${exList.map((ex,i)=>{
      const exVol=ex.sets.reduce((ss,set)=>ss+(set.weight||0)*(set.reps||0),0);
      const best1RM=Math.max(...ex.sets.map(set=>calc1RM(set.weight||0,set.reps||0)));
      return`<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:var(--surf2);border-radius:8px;margin-bottom:3px">
      <span style="font-size:13px">${EXERCISE_DB[ex.part]?.emoji||'💪'}</span>
      <div style="flex:1;min-width:0">
        <div style="font-size:12px;font-weight:600">${sanitize(ex.name,22)}</div>
        <div style="font-size:10px;color:var(--txt3)">${ex.sets.map(set=>(set.weight||0)+'kg×'+set.reps).join(' → ')}${best1RM>0?' · 1RM:'+best1RM+'kg':''}</div>
      </div>
      <button onclick="removeSessionExercise(${i})" style="background:none;border:none;cursor:pointer;color:var(--red);font-size:12px;padding:2px">&times;</button>
    </div>`}).join('')}
  </div>`:'';

  const html=`
    <!-- ヘッダーKPI -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:12px">
      <div style="text-align:center;padding:8px 4px;background:var(--surf2);border-radius:8px">
        <div style="font-size:16px;font-weight:800">${elapsed}<span style="font-size:10px">分</span></div>
        <div style="font-size:9px;color:var(--txt3)">経過</div>
      </div>
      <div style="text-align:center;padding:8px 4px;background:var(--surf2);border-radius:8px">
        <div style="font-size:16px;font-weight:800">${exList.length}<span style="font-size:10px">種目</span></div>
        <div style="font-size:9px;color:var(--txt3)">種目数</div>
      </div>
      <div style="text-align:center;padding:8px 4px;background:var(--surf2);border-radius:8px">
        <div style="font-size:16px;font-weight:800">${totalSets}<span style="font-size:10px">set</span></div>
        <div style="font-size:9px;color:var(--txt3)">合計</div>
      </div>
      <div style="text-align:center;padding:8px 4px;background:var(--surf2);border-radius:8px">
        <div style="font-size:16px;font-weight:800">${Math.round(totalVol/1000)}<span style="font-size:10px">k</span></div>
        <div style="font-size:9px;color:var(--txt3)">Volume</div>
      </div>
    </div>

    <!-- レストタイマー -->
    <div id="session-rest-timer" style="display:none;margin-bottom:12px;padding:10px;background:linear-gradient(135deg,rgba(249,115,22,.08),rgba(245,158,11,.08));border-radius:10px;text-align:center">
      <div style="font-size:10px;color:var(--org);font-weight:700;margin-bottom:4px">⏱ レスト</div>
      <div id="rest-timer-display" style="font-size:28px;font-weight:800;color:var(--org)">0:00</div>
      <div style="display:flex;gap:6px;justify-content:center;margin-top:6px">
        <button onclick="startRestCountdown(60)" style="padding:4px 10px;border-radius:12px;border:1px solid var(--b1);background:var(--surf2);font-size:10px;cursor:pointer">1分</button>
        <button onclick="startRestCountdown(90)" style="padding:4px 10px;border-radius:12px;border:1px solid var(--b1);background:var(--surf2);font-size:10px;cursor:pointer">1.5分</button>
        <button onclick="startRestCountdown(120)" style="padding:4px 10px;border-radius:12px;border:1px solid var(--b1);background:var(--surf2);font-size:10px;cursor:pointer">2分</button>
        <button onclick="startRestCountdown(180)" style="padding:4px 10px;border-radius:12px;border:1px solid var(--b1);background:var(--surf2);font-size:10px;cursor:pointer">3分</button>
        <button onclick="stopRestCountdown()" style="padding:4px 10px;border-radius:12px;border:1px solid var(--red);background:rgba(239,68,68,.05);font-size:10px;cursor:pointer;color:var(--red)">停止</button>
      </div>
    </div>

    ${recordedHtml}

    <div style="font-size:11px;font-weight:700;color:var(--txt3);margin-bottom:6px">➕ 種目を追加</div>
    <!-- インライン検索 -->
    <div style="margin-bottom:8px"><input class="input" type="text" placeholder="🔍 種目名で検索..." style="font-size:12px;height:34px" oninput="filterSessionExercises(this.value)"></div>
    <div id="session-search-results" style="display:none;margin-bottom:8px"></div>
    ${partSelector}
    <div id="tr-exercise-list">
      ${focusPart?renderExerciseButtons(focusPart):'<div style="text-align:center;padding:12px;color:var(--txt3);font-size:12px">↑ 部位を選択してください</div>'}
    </div>
    <div style="display:flex;gap:8px;margin-top:14px;padding-top:12px;border-top:1px solid var(--b1)">
      ${exList.length?`<button class="btn btn-primary" style="flex:1;padding:12px;font-size:13px" onclick="closeM();finishTrainingSession()">🎉 トレーニング完了</button>`:''}
      <button class="btn btn-ghost" style="${exList.length?'':'flex:1;'}" onclick="closeM()">閉じる</button>
    </div>
  `;
  openM('🏋️ トレーニング記録', html, true);
  // レストタイマー表示（セッションに1種目以上あれば）
  if(exList.length) setTimeout(()=>{const el=document.getElementById('session-rest-timer');if(el)el.style.display='block';},50);
}

// セッション内検索
function filterSessionExercises(q){
  const el=document.getElementById('session-search-results');
  if(!el)return;
  if(!q||q.length<1){el.style.display='none';return;}
  const query=q.toLowerCase();const matches=[];
  Object.entries(EXERCISE_DB).forEach(([part,cat])=>{
    cat.exercises.forEach(ex=>{
      if(ex.name.toLowerCase().includes(query)||cat.name.includes(query)){
        matches.push({...ex,part,partEmoji:cat.emoji});
      }
    });
  });
  if(!matches.length){el.innerHTML='<div style="font-size:11px;color:var(--txt3);text-align:center">見つかりません</div>';el.style.display='';return;}
  el.innerHTML=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:3px">${matches.slice(0,8).map(ex=>{
    const safeName=ex.name.replace(/'/g,"\\'");
    return`<button onclick="openSetInput('${ex.part}','${ex.id}','${safeName}')" style="padding:6px 8px;background:var(--surf2);border:1px solid var(--b1);border-radius:6px;cursor:pointer;text-align:left;font-size:11px;display:flex;align-items:center;gap:4px" onmouseover="this.style.borderColor='var(--org)'" onmouseout="this.style.borderColor='var(--b1)'">${ex.partEmoji} ${sanitize(ex.name,16)}</button>`;
  }).join('')}</div>`;
  el.style.display='';
}

// レストタイマー
var _restInterval=null;var _restSec=0;
function startRestCountdown(sec){
  stopRestCountdown();
  _restSec=sec;
  var disp=document.getElementById('rest-timer-display');
  _restInterval=setInterval(function(){
    _restSec--;
    if(disp){var m=Math.floor(_restSec/60);var s=_restSec%60;disp.textContent=m+':'+(s<10?'0':'')+s;}
    if(_restSec<=0){stopRestCountdown();toast('⏱ レスト完了！次のセットへ','s');}
  },1000);
  if(disp){var m=Math.floor(sec/60);var s=sec%60;disp.textContent=m+':'+(s<10?'0':'')+s;}
}
function stopRestCountdown(){if(_restInterval){clearInterval(_restInterval);_restInterval=null;}_restSec=0;var disp=document.getElementById('rest-timer-display');if(disp)disp.textContent='0:00';}

function renderExerciseButtons(part){
  const p=EXERCISE_DB[part];
  if(!p)return '';
  const typeColors={compound:'#3b82f6',isolation:'#a855f7',bodyweight:'#00cfaa',machine:'#64748b',explosive:'#ef4444',olympic:'#eab308',cardio:'#f97316',recovery:'#22c55e',mobility:'#06b6d4',cable:'#8b5cf6',skill:'#3b82f6',warmup:'#facc15'};
  return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;max-height:280px;overflow-y:auto">${p.exercises.map(ex=>{
    const safeName=ex.name.replace(/'/g,"\\'");
    const tc=typeColors[ex.type]||'var(--txt3)';
    return`<button onclick="openSetInput('${part}','${ex.id}','${safeName}')" style="padding:8px 10px;background:var(--surf2);border:1px solid var(--b1);border-radius:8px;cursor:pointer;text-align:left;transition:all .15s;font-size:12px;font-weight:600;color:var(--txt1)" onmouseover="this.style.borderColor='var(--org)'" onmouseout="this.style.borderColor='var(--b1)'">
      ${sanitize(ex.name,22)}
      ${ex.type?`<span style="font-size:8px;color:${tc};font-weight:400;display:block;margin-top:1px">${ex.type}</span>`:''}
    </button>`;
  }).join('')}</div>`;}


function updateExerciseList(part){
  const el=document.getElementById('tr-exercise-list');
  if(el) el.innerHTML=renderExerciseButtons(part);
  // Update part buttons
  document.querySelectorAll('#tr-part-select').forEach(inp=>inp.value=part);
}

function openSetInput(part,exId,exName){
  const lastEx=window._trSession.exercises.filter(e=>e.exId===exId).slice(-1)[0];
  const lastWeight=lastEx?.sets?.slice(-1)[0]?.weight||'';
  const lastReps=lastEx?.sets?.slice(-1)[0]?.reps||10;
  // PRデータ取得
  const player=DB.players.find(x=>x.id===DB.currentUser?.id);
  const prs=player?getAllPRs(player.id):{};
  const pr=prs[exId];
  // 前回の履歴
  const prevHistory=getExercisePrevSets(player?.id,exId);
  const html=`
    <div style="text-align:center;margin-bottom:12px">
      <div style="font-size:22px;margin-bottom:2px">${EXERCISE_DB[part]?.emoji||'💪'}</div>
      <div style="font-size:17px;font-weight:800">${exName}</div>
      <div style="font-size:11px;color:var(--txt3);margin-top:3px">${EXERCISE_DB[part]?.name||''}</div>
      ${pr?`<div style="margin-top:6px;padding:5px 10px;background:rgba(249,115,22,.06);border:1px solid rgba(249,115,22,.12);border-radius:8px;display:inline-block">
        <span style="font-size:10px;color:var(--org);font-weight:700">🏆 PR: ${pr.max1RM}kg (1RM) · ${pr.maxWeight}kg×${pr.reps}</span>
      </div>`:''}
    </div>
    ${prevHistory?`<div style="margin-bottom:10px;padding:6px 10px;background:var(--surf2);border-radius:8px">
      <div style="font-size:9px;color:var(--txt3);font-weight:700;margin-bottom:3px">📋 前回の記録 (${prevHistory.date})</div>
      <div style="font-size:11px;color:var(--txt2)">${prevHistory.sets.map((s,i)=>'<span style="margin-right:6px">'+(i+1)+'. '+(s.weight||0)+'kg×'+s.reps+(s.rpe?' RPE'+s.rpe:'')+'</span>').join('')}</div>
    </div>`:''}
    ${pr?`<div style="margin-bottom:10px;padding:6px 10px;background:rgba(59,130,246,.04);border-radius:8px;border:1px solid rgba(59,130,246,.08)">
      <div style="font-size:9px;color:var(--blue);font-weight:700;margin-bottom:3px">💡 強度ゾーンガイド (1RM: ${pr.max1RM}kg)</div>
      <div style="display:flex;gap:3px;flex-wrap:wrap">${[{l:'W-Up',p:50,c:'#22c55e'},{l:'持久',p:65,c:'#06b6d4'},{l:'肥大',p:75,c:'#3b82f6'},{l:'筋力',p:85,c:'#f59e0b'},{l:'MAX',p:95,c:'#ef4444'}].map(z=>'<span style="padding:2px 5px;border-radius:4px;font-size:8px;background:'+z.c+'10;border:1px solid '+z.c+'30;color:'+z.c+'"><b>'+z.l+'</b> '+Math.round(pr.max1RM*z.p/100)+'kg</span>').join('')}</div>
    </div>`:''}
    <div style="display:flex;gap:3px;margin-bottom:8px">
      <button onclick="setSetType('normal')" id="stype-normal" style="flex:1;padding:4px;border-radius:6px;border:1px solid var(--org);background:var(--org);color:#fff;font-size:9px;font-weight:700;cursor:pointer">通常</button>
      <button onclick="setSetType('warmup')" id="stype-warmup" style="flex:1;padding:4px;border-radius:6px;border:1px solid var(--b1);background:var(--surf2);color:var(--txt2);font-size:9px;font-weight:700;cursor:pointer">W-Up</button>
      <button onclick="setSetType('drop')" id="stype-drop" style="flex:1;padding:4px;border-radius:6px;border:1px solid var(--b1);background:var(--surf2);color:var(--txt2);font-size:9px;font-weight:700;cursor:pointer">ドロップ</button>
      <button onclick="setSetType('super')" id="stype-super" style="flex:1;padding:4px;border-radius:6px;border:1px solid var(--b1);background:var(--surf2);color:var(--txt2);font-size:9px;font-weight:700;cursor:pointer">S.Set</button>
    </div>
    <input type="hidden" id="current-set-type" value="normal">
    <div id="set-rows">
      <div class="set-input-row" style="display:flex;gap:6px;align-items:center;margin-bottom:8px">
        <span style="font-size:12px;color:var(--txt3);width:24px;text-align:center;font-weight:700">1</span>
        <input class="input set-weight" type="number" placeholder="kg" value="${lastWeight}" style="flex:2;height:40px;font-size:14px;text-align:center">
        <span style="color:var(--txt3)">×</span>
        <input class="input set-reps" type="number" placeholder="回" value="${lastReps}" style="flex:2;height:40px;font-size:14px;text-align:center">
        <select class="input set-rpe" style="flex:2;height:40px;font-size:11px;text-align:center;padding:4px">
          <option value="">RPE</option>
          <option value="6">6 余裕</option><option value="7">7 軽い</option>
          <option value="8">8 適度</option><option value="9">9 キツい</option>
          <option value="10">10 限界</option>
        </select>
      </div>
    </div>
    <div id="live-1rm" style="text-align:center;font-size:11px;color:var(--teal);margin-bottom:8px;min-height:16px"></div>
    <div style="display:flex;gap:8px;margin-bottom:16px">
      <button class="btn btn-ghost btn-sm" style="flex:1" onclick="addSetRow()">＋ セット追加</button>
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-primary" style="flex:1;padding:14px;font-size:14px" onclick="saveExerciseSets('${part}','${exId}','${exName}')" id="save-ex-btn">✓ 記録する</button>
      <button class="btn btn-ghost" onclick="startTrainingSession('${part}')">戻る</button>
    </div>
  `;
  openM('💪 '+exName, html);
  // ライブ1RM計算
  setTimeout(function(){
    var rows = document.querySelectorAll('#set-rows .set-input-row');
    rows.forEach(function(row){
      row.querySelector('.set-weight')?.addEventListener('input', updateLive1RM);
      row.querySelector('.set-reps')?.addEventListener('input', updateLive1RM);
    });
  }, 100);
}
function updateLive1RM(){
  var rows = document.querySelectorAll('#set-rows .set-input-row');
  var best1RM = 0;
  rows.forEach(function(row){
    var w = parseFloat(row.querySelector('.set-weight')?.value)||0;
    var r = parseInt(row.querySelector('.set-reps')?.value)||0;
    var est = calc1RM(w, r);
    if (est > best1RM) best1RM = est;
  });
  var el = document.getElementById('live-1rm');
  if (el) el.textContent = best1RM > 0 ? '推定1RM: ' + best1RM + 'kg' : '';
}

function addSetRow(){
  const container=document.getElementById('set-rows');
  if(!container)return;
  const rows=container.querySelectorAll('.set-input-row');
  const n=rows.length+1;
  const lastRow=rows[rows.length-1];
  const lastW=lastRow?.querySelector('.set-weight')?.value||'';
  const lastR=lastRow?.querySelector('.set-reps')?.value||'10';
  const row=document.createElement('div');
  row.className='set-input-row';
  row.style='display:flex;gap:6px;align-items:center;margin-bottom:8px';
  row.innerHTML=`<span style="font-size:12px;color:var(--txt3);width:24px;text-align:center;font-weight:700">${n}</span><input class="input set-weight" type="number" placeholder="kg" value="${lastW}" style="flex:2;height:40px;font-size:14px;text-align:center"><span style="color:var(--txt3)">×</span><input class="input set-reps" type="number" placeholder="回" value="${lastR}" style="flex:2;height:40px;font-size:14px;text-align:center"><select class="input set-rpe" style="flex:2;height:40px;font-size:11px;text-align:center;padding:4px"><option value="">RPE</option><option value="6">6 余裕</option><option value="7">7 軽い</option><option value="8">8 適度</option><option value="9">9 キツい</option><option value="10">10 限界</option></select>`;
  container.appendChild(row);
  row.querySelector('.set-weight')?.addEventListener('input', updateLive1RM);
  row.querySelector('.set-reps')?.addEventListener('input', updateLive1RM);
}

function saveExerciseSets(part,exId,exName){
  const rows=document.querySelectorAll('#set-rows .set-input-row');
  const setType=document.getElementById('current-set-type')?.value||'normal';
  const sets=[];
  rows.forEach(row=>{
    const w=parseFloat(row.querySelector('.set-weight')?.value)||0;
    const r=parseInt(row.querySelector('.set-reps')?.value)||0;
    const rpe=parseInt(row.querySelector('.set-rpe')?.value)||0;
    if(r>0) sets.push({weight:w,reps:r,rpe:rpe||null,est1RM:calc1RM(w,r),type:setType});
  });
  if(!sets.length){toast('回数を入力してください','e');return;}
  // PR判定
  const player=DB.players.find(x=>x.id===DB.currentUser?.id);
  const prs=player?getAllPRs(player.id):{};
  const oldPR=prs[exId]?.max1RM||0;
  const newBest=Math.max(...sets.filter(s=>s.type!=='warmup').map(s=>s.est1RM));
  window._trSession.exercises.push({part,exId,name:exName,sets,setType});
  if(newBest>oldPR && oldPR>0){toast('🏆 PR更新！ '+exName+' 推定1RM: '+newBest+'kg（+'+Math.round(newBest-oldPR)+'kg）','s');}
  else{toast(exName+' '+sets.length+'セット記録！','s');}
  startTrainingSession(part);
}

function removeSessionExercise(idx){
  window._trSession.exercises.splice(idx,1);
  startTrainingSession();
}

function finishTrainingSession(){
  const s=window._trSession;
  if(!s.exercises.length){toast('種目が記録されていません','e');return;}
  const player=DB.players.find(x=>x.id===DB.currentUser?.id);
  if(!player){toast('選手データが見つかりません','e');return;}
  const elapsed=s.startTime?Math.round((Date.now()-s.startTime)/60000):0;
  const totalKcal=s.exercises.reduce((sum,e)=>{
    const db=Object.values(EXERCISE_DB).flatMap(p=>p.exercises).find(x=>x.id===e.exId);
    return sum+(db?.kcalPerSet||5)*e.sets.length;
  },0);
  const today=new Date().toISOString().slice(0,10);
  if(!DB.trainingLog[player.id]) DB.trainingLog[player.id]={};
  DB.trainingLog[player.id][today]={
    date:today,
    memo:s.exercises.map(e=>e.name).join('・'),
    duration:elapsed, time:elapsed, kcal:totalKcal,
    cond:0, note:'',
    exercises:s.exercises.map(e=>({part:e.part,exId:e.exId,name:e.name,sets:e.sets})),
    updatedAt:new Date().toISOString()
  };
  // コンディション入力
  openM('🎉 トレーニング完了！',`
    <div style="text-align:center;margin-bottom:20px">
      <div style="font-size:48px;margin-bottom:8px">🎉</div>
      <div style="font-size:20px;font-weight:800;margin-bottom:4px">${s.exercises.length}種目完了！</div>
      <div style="font-size:14px;color:var(--txt3)">${elapsed}分 · 約${totalKcal}kcal消費</div>
    </div>
    <div style="display:flex;gap:10px;justify-content:center;margin-bottom:16px">
      ${s.exercises.map(e=>`<div style="text-align:center"><div style="font-size:20px">${EXERCISE_DB[e.part]?.emoji||'💪'}</div><div style="font-size:10px;color:var(--txt3)">${e.sets.length}set</div></div>`).join('')}
    </div>
    <div style="margin-bottom:16px">
      <div style="font-size:13px;font-weight:700;margin-bottom:8px">今日のコンディションは？</div>
      <div style="display:flex;gap:8px;justify-content:center" id="finish-cond-stars">
        ${[1,2,3,4,5].map(n=>`<button onclick="document.getElementById('finish-cond').value=${n};[1,2,3,4,5].forEach(i=>{document.getElementById('fc-'+i).style.opacity=i<=${n}?1:.3})" id="fc-${n}" style="font-size:28px;background:none;border:none;cursor:pointer;opacity:.3;transition:.15s">⭐</button>`).join('')}
      </div>
      <input type="hidden" id="finish-cond" value="0">
    </div>
    <div class="form-group"><label class="label">メモ（任意）</label>
      <textarea class="input" id="finish-note" rows="2" placeholder="気づいたこと・体の状態など"></textarea></div>
    <button class="btn btn-primary w-full" style="padding:14px;font-size:15px" onclick="completeSession()">💾 記録を保存する</button>
  `);
}

function completeSession(){
  const player=DB.players.find(x=>x.id===DB.currentUser?.id);
  const today=new Date().toISOString().slice(0,10);
  const cond=parseInt(document.getElementById('finish-cond')?.value)||0;
  const note=document.getElementById('finish-note')?.value?.trim()||'';
  if(DB.trainingLog[player.id]?.[today]){
    DB.trainingLog[player.id][today].cond=cond;
    DB.trainingLog[player.id][today].note=note;
  }
  saveDB();
  window._trSession={active:false,exercises:[],startTime:null,elapsed:0};
  closeM();
  toast('トレーニングを保存しました！','s');
  goTo('training');
}

// Legacy support
function toggleWD(id){const el=document.getElementById('wd-'+id);if(el){el.style.display=el.style.display==='none'?'block':'none';}}
function toggleExDone(wid,idx,color){const key=wid+'_'+idx;if(!DB.doneSets)DB.doneSets={};if(!DB.doneSets[key])DB.doneSets[key]=0;const w=getAllWorkouts().find(x=>x.id===wid);if(!w)return;const ex=w.exercises[idx];DB.doneSets[key]=DB.doneSets[key]>=ex.sets?0:ex.sets;saveDB();refreshPage();}
// changeSetDone v1 removed - v2 at bottom of file is used
function logSet(){
  // セット記録のフォールバック — メインのrecordSet()関数にリダイレクト
  if(typeof recordSet==='function') recordSet();
}
function startRestTimer(sec){resetTimer();timerSec=sec;activeRestSec=sec;toggleTimer();}
function toggleTimer(){
  const btn=document.getElementById('timer-btn');const wt=parseInt(document.getElementById('work-time')?.value)||45;
  if(!timerRunning){
    if(timerSec===0)timerSec=wt;
    timerRunning=true;if(btn)btn.innerHTML='• 一時停止';
    timerInterval=setInterval(()=>{
      timerSec--;updateTimerUI();
      if(timerSec<=0){clearInterval(timerInterval);timerRunning=false;if(btn)btn.innerHTML='• スタート';toast('タイマー完了！','s');}
    },1000);
  }else{clearInterval(timerInterval);timerRunning=false;if(btn)btn.innerHTML='• 再開';}
}
function resetTimer(){if(timerInterval)clearInterval(timerInterval);timerRunning=false;timerSec=0;const disp=document.getElementById('timer-disp');if(disp)disp.textContent='00:00';}
function updateTimerUI(){const wt=parseInt(document.getElementById('work-time')?.value)||45;const disp=document.getElementById('timer-disp');const rc=document.getElementById('timer-ring-circle');const m=Math.floor(timerSec/60),s=timerSec%60;if(disp)disp.textContent=`${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;if(rc){const total=activeRestSec||wt;const circ=2*Math.PI*68;rc.setAttribute('stroke-dashoffset',(circ*(1-timerSec/total)).toFixed(2));}}
// legacy saveTrainingLog removed — using parametrized version below


// ==================== 🏆 ELITE TRAINING ANALYTICS ====================

// 前回の記録取得
function getExercisePrevSets(playerId, exId) {
  if (!playerId) return null;
  var log = DB.trainingLog[playerId] || {};
  var entries = Object.values(log).filter(function(e){return e && e.date && e.exercises;});
  entries.sort(function(a,b){return a.date > b.date ? -1 : 1;});
  for (var i = 0; i < entries.length; i++) {
    for (var j = 0; j < entries[i].exercises.length; j++) {
      if (entries[i].exercises[j].exId === exId) {
        return { date: entries[i].date.slice(5), sets: entries[i].exercises[j].sets || [] };
      }
    }
  }
  return null;
}

// セットタイプ切替
function setSetType(type) {
  var el = document.getElementById('current-set-type');
  if (el) el.value = type;
  ['normal','warmup','drop','super'].forEach(function(t) {
    var btn = document.getElementById('stype-' + t);
    if (btn) {
      if (t === type) { btn.style.background = 'var(--org)'; btn.style.color = '#fff'; btn.style.borderColor = 'var(--org)'; }
      else { btn.style.background = 'var(--surf2)'; btn.style.color = 'var(--txt2)'; btn.style.borderColor = 'var(--b1)'; }
    }
  });
}

// 強度ゾーン判定
function getIntensityZone(weight, rm1) {
  if (!rm1 || !weight) return null;
  var pct = weight / rm1 * 100;
  if (pct >= 90) return { name: 'パワー', color: '#ef4444', pct: Math.round(pct) };
  if (pct >= 80) return { name: 'ストレングス', color: '#f59e0b', pct: Math.round(pct) };
  if (pct >= 65) return { name: '筋肥大', color: '#3b82f6', pct: Math.round(pct) };
  if (pct >= 50) return { name: '筋持久力', color: '#06b6d4', pct: Math.round(pct) };
  return { name: 'ウォームアップ', color: '#22c55e', pct: Math.round(pct) };
}

// トレーニング強度分析（セッション全体）
function analyzeSessionIntensity(exercises, playerId) {
  var prs = getAllPRs(playerId);
  var zones = { power: 0, strength: 0, hypertrophy: 0, endurance: 0, warmup: 0 };
  var totalSets = 0;
  for (var i = 0; i < exercises.length; i++) {
    var ex = exercises[i];
    var pr = prs[ex.exId];
    if (!pr) continue;
    for (var s = 0; s < (ex.sets || []).length; s++) {
      var set = ex.sets[s];
      var pct = (set.weight || 0) / pr.max1RM * 100;
      totalSets++;
      if (pct >= 90) zones.power++;
      else if (pct >= 80) zones.strength++;
      else if (pct >= 65) zones.hypertrophy++;
      else if (pct >= 50) zones.endurance++;
      else zones.warmup++;
    }
  }
  return { zones: zones, total: totalSets };
}

// 推奨ボリュームガイド（部位別・週間セット数）
const VOLUME_GUIDE = {
  chest: { min: 10, max: 20, label: '胸' },
  back: { min: 10, max: 20, label: '背中' },
  legs: { min: 10, max: 20, label: '脚' },
  shoulder: { min: 8, max: 16, label: '肩' },
  arms: { min: 6, max: 14, label: '腕' },
  core: { min: 6, max: 12, label: '体幹' },
  glutes: { min: 6, max: 16, label: '臀部' },
};

// 週間ボリュームガイド
function openVolumeGuide() {
  var player = DB.players.find(function(x){return x.id===(DB.currentUser||{}).id;});
  if (!player) { toast('選手データがありません','e'); return; }
  var wv = getWeeklyVolume(player.id);
  var prs = getAllPRs(player.id);

  var h = '<div style="display:grid;gap:12px">';

  // 部位別ボリュームvs推奨
  h += '<div><div style="font-size:13px;font-weight:700;margin-bottom:8px">📊 今週の部位別セット数 vs 推奨範囲</div>';
  Object.keys(VOLUME_GUIDE).forEach(function(part) {
    var guide = VOLUME_GUIDE[part];
    var sets = wv.sets[part] || 0;
    var vol = wv.volume[part] || 0;
    var pct = Math.min(100, sets / guide.max * 100);
    var status = sets < guide.min ? 'under' : (sets > guide.max ? 'over' : 'good');
    var statusColor = status === 'good' ? '#22c55e' : (status === 'under' ? '#3b82f6' : '#ef4444');
    var statusLabel = status === 'good' ? '✅ 適正' : (status === 'under' ? '📉 不足' : '⚠️ 過多');
    h += '<div style="margin-bottom:6px">';
    h += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">';
    h += '<span style="font-size:14px">' + (EXERCISE_DB[part]?.emoji || '💪') + '</span>';
    h += '<span style="font-size:12px;font-weight:600;flex:1">' + guide.label + '</span>';
    h += '<span style="font-size:11px;font-weight:800;color:' + statusColor + '">' + sets + ' set</span>';
    h += '<span style="font-size:9px;color:var(--txt3)">(推奨' + guide.min + '-' + guide.max + ')</span>';
    h += '<span style="font-size:9px;color:' + statusColor + '">' + statusLabel + '</span>';
    h += '</div>';
    h += '<div style="height:6px;background:var(--b2);border-radius:3px;position:relative">';
    h += '<div style="width:' + pct + '%;height:100%;background:' + statusColor + ';border-radius:3px"></div>';
    // 推奨範囲マーカー
    h += '<div style="position:absolute;left:' + (guide.min/guide.max*100) + '%;top:-1px;width:1px;height:8px;background:var(--txt3);opacity:.3"></div>';
    h += '</div></div>';
  });
  h += '</div>';

  // 分割法テンプレート
  h += '<div style="border-top:1px solid var(--b1);padding-top:12px">';
  h += '<div style="font-size:13px;font-weight:700;margin-bottom:8px">🗂️ 分割法テンプレート</div>';
  var splits = [
    { name: 'PPL (Push/Pull/Legs)', desc: '週6日・中〜上級者向け', ids: ['w1','w2','w3'] },
    { name: 'Upper/Lower', desc: '週4日・中級者向け', ids: ['w4','w5'] },
    { name: 'SAQ＋フィジカル', desc: 'スポーツパフォーマンス', ids: ['w6'] },
    { name: 'リカバリー', desc: 'アクティブレスト', ids: ['w7'] },
  ];
  splits.forEach(function(sp) {
    var wkouts = sp.ids.map(function(id){return WORKOUTS.find(function(w){return w.id===id;});}).filter(Boolean);
    var totalEx = wkouts.reduce(function(s,w){return s+w.exercises.length;},0);
    h += '<div style="padding:10px;background:var(--surf2);border-radius:10px;margin-bottom:4px;cursor:pointer;border:1px solid var(--b1)" onclick="var d=this.querySelector(\'.split-detail\');d.style.display=d.style.display===\'none\'?\'block\':\'none\'">';
    h += '<div style="display:flex;align-items:center;gap:8px"><div style="flex:1"><div style="font-size:12px;font-weight:700">' + sp.name + '</div>';
    h += '<div style="font-size:10px;color:var(--txt3)">' + sp.desc + ' · ' + totalEx + '種目</div></div>';
    h += '<i class="fa fa-chevron-down" style="font-size:10px;color:var(--txt3)"></i></div>';
    h += '<div class="split-detail" style="display:none;margin-top:8px;padding-top:8px;border-top:1px solid var(--b1)">';
    wkouts.forEach(function(w) {
      h += '<div style="margin-bottom:6px"><div style="font-size:11px;font-weight:700;color:var(--org)">' + w.day + ' — ' + w.type + '</div>';
      w.exercises.forEach(function(ex) {
        h += '<div style="font-size:10px;color:var(--txt2);padding:1px 0">• ' + ex.name + ' ' + ex.sets + '×' + ex.reps + (ex.unit||'回') + (ex.note?' <span style="color:var(--teal)">(' + ex.note + ')</span>':'') + '</div>';
      });
      h += '</div>';
    });
    h += '</div></div>';
  });
  h += '</div>';

  // BIG3 PR サマリー
  var big3 = [
    { id: 'bp', name: 'ベンチプレス', emoji: '🫁' },
    { id: 'squat', name: 'スクワット', emoji: '🦵' },
    { id: 'deadlift', name: 'デッドリフト', emoji: '🔙' },
  ];
  var big3Total = 0;
  h += '<div style="border-top:1px solid var(--b1);padding-top:12px"><div style="font-size:13px;font-weight:700;margin-bottom:8px">🏆 BIG3 合計</div>';
  h += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:8px">';
  big3.forEach(function(b) {
    var pr = prs[b.id];
    var val = pr ? pr.max1RM : 0;
    big3Total += val;
    h += '<div style="text-align:center;padding:10px;background:var(--surf2);border-radius:10px">';
    h += '<div style="font-size:16px">' + b.emoji + '</div>';
    h += '<div style="font-size:16px;font-weight:800;color:var(--org)">' + (val || '-') + '<span style="font-size:10px">kg</span></div>';
    h += '<div style="font-size:9px;color:var(--txt3)">' + b.name + '</div></div>';
  });
  h += '</div>';
  if (big3Total > 0) {
    var bw = player.weight || 70;
    h += '<div style="text-align:center;padding:10px;background:linear-gradient(135deg,rgba(249,115,22,.06),rgba(245,158,11,.06));border-radius:10px">';
    h += '<div style="font-size:24px;font-weight:800;color:var(--org)">' + big3Total + '<span style="font-size:12px">kg</span></div>';
    h += '<div style="font-size:11px;color:var(--txt3)">BIG3 合計 · 体重比 <b>' + (big3Total / bw).toFixed(1) + '</b>倍</div></div>';
  }
  h += '</div>';

  h += '</div>';
  openM('📊 ボリューム＆分割ガイド', h, true);
}

// 1RM推定（Epley式）
function calc1RM(weight, reps) {
  if (!weight || !reps || reps <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

// 全種目のPR（自己ベスト）データを取得
function getAllPRs(playerId) {
  var log = DB.trainingLog[playerId] || {};
  var prs = {}; // { exId: { maxWeight, max1RM, maxVol, date, reps } }
  var entries = Object.values(log).filter(function(e){return e && e.exercises;});
  for (var i = 0; i < entries.length; i++) {
    var exs = entries[i].exercises || [];
    for (var j = 0; j < exs.length; j++) {
      var ex = exs[j];
      if (!ex.sets) continue;
      for (var s = 0; s < ex.sets.length; s++) {
        var set = ex.sets[s];
        var w = set.weight || 0, r = set.reps || 0;
        if (!w || !r) continue;
        var est1RM = calc1RM(w, r);
        var vol = w * r;
        if (!prs[ex.exId]) prs[ex.exId] = { name: ex.name, part: ex.part, maxWeight: 0, max1RM: 0, maxVol: 0, date: '', reps: 0 };
        if (est1RM > prs[ex.exId].max1RM) {
          prs[ex.exId].max1RM = est1RM;
          prs[ex.exId].maxWeight = w;
          prs[ex.exId].reps = r;
          prs[ex.exId].date = entries[i].date;
        }
        if (vol > prs[ex.exId].maxVol) prs[ex.exId].maxVol = vol;
      }
    }
  }
  return prs;
}

// 部位別週間ボリューム（sets × weight × reps）
function getWeeklyVolume(playerId) {
  var log = DB.trainingLog[playerId] || {};
  var now = new Date();
  var weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay());
  var partVol = {};
  var partSets = {};
  for (var d = 0; d < 7; d++) {
    var dk = new Date(weekStart); dk.setDate(weekStart.getDate() + d);
    var dateStr = dk.toISOString().slice(0, 10);
    var entry = log[dateStr];
    if (!entry || !entry.exercises) continue;
    for (var i = 0; i < entry.exercises.length; i++) {
      var ex = entry.exercises[i];
      var part = ex.part || 'other';
      if (!partVol[part]) partVol[part] = 0;
      if (!partSets[part]) partSets[part] = 0;
      for (var s = 0; s < (ex.sets||[]).length; s++) {
        var set = ex.sets[s];
        partVol[part] += (set.weight || 0) * (set.reps || 0);
        partSets[part]++;
      }
    }
  }
  return { volume: partVol, sets: partSets };
}

// プログレッシブオーバーロード検知（直近4週で1RM↑の種目）
function detectProgressiveOverload(playerId) {
  var log = DB.trainingLog[playerId] || {};
  var entries = Object.values(log).filter(function(e){return e && e.date && e.exercises;});
  entries.sort(function(a,b){return a.date > b.date ? 1 : -1;});
  if (entries.length < 4) return [];

  // 直近2週 vs その前2週で比較
  var now = new Date();
  var twoWeeksAgo = new Date(now); twoWeeksAgo.setDate(now.getDate() - 14);
  var fourWeeksAgo = new Date(now); fourWeeksAgo.setDate(now.getDate() - 28);
  var recent = {}, older = {};

  for (var i = 0; i < entries.length; i++) {
    var d = new Date(entries[i].date + 'T12:00');
    var target = d >= twoWeeksAgo ? recent : (d >= fourWeeksAgo ? older : null);
    if (!target) continue;
    for (var j = 0; j < entries[i].exercises.length; j++) {
      var ex = entries[i].exercises[j];
      for (var s = 0; s < (ex.sets||[]).length; s++) {
        var set = ex.sets[s];
        var est = calc1RM(set.weight||0, set.reps||0);
        if (!target[ex.exId] || est > target[ex.exId].best) {
          target[ex.exId] = { name: ex.name, part: ex.part, best: est };
        }
      }
    }
  }

  var progress = [];
  for (var exId in recent) {
    if (older[exId] && recent[exId].best > older[exId].best) {
      var pct = Math.round((recent[exId].best - older[exId].best) / older[exId].best * 100);
      if (pct > 0) progress.push({ exId: exId, name: recent[exId].name, part: recent[exId].part, pct: pct, prev: older[exId].best, now: recent[exId].best });
    }
  }
  progress.sort(function(a,b){return b.pct - a.pct;});
  return progress.slice(0, 5);
}

// 種目別ボリューム推移（過去8週）
function getExerciseVolumeHistory(playerId, exId) {
  var log = DB.trainingLog[playerId] || {};
  var weeks = [];
  for (var w = 7; w >= 0; w--) {
    var weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay() - w * 7);
    var vol = 0, maxW = 0, totalSets = 0;
    for (var d = 0; d < 7; d++) {
      var dk = new Date(weekStart); dk.setDate(weekStart.getDate() + d);
      var dateStr = dk.toISOString().slice(0, 10);
      var entry = log[dateStr];
      if (!entry || !entry.exercises) continue;
      for (var i = 0; i < entry.exercises.length; i++) {
        if (entry.exercises[i].exId !== exId) continue;
        for (var s = 0; s < (entry.exercises[i].sets||[]).length; s++) {
          var set = entry.exercises[i].sets[s];
          vol += (set.weight||0) * (set.reps||0);
          if ((set.weight||0) > maxW) maxW = set.weight;
          totalSets++;
        }
      }
    }
    weeks.push({ vol: vol, maxWeight: maxW, sets: totalSets });
  }
  return weeks;
}

// PRダッシュボード
function openPRDashboard() {
  var player = DB.players.find(function(x){return x.id===(DB.currentUser||{}).id;});
  if (!player) { toast('選手データがありません','e'); return; }
  var prs = getAllPRs(player.id);
  var prList = Object.values(prs).filter(function(p){return p.max1RM > 0;}).sort(function(a,b){return b.max1RM - a.max1RM;});
  var overload = detectProgressiveOverload(player.id);
  var weekVol = getWeeklyVolume(player.id);

  var h = '<div style="display:grid;gap:14px">';

  // プログレッシブオーバーロード
  if (overload.length) {
    h += '<div style="padding:14px;background:linear-gradient(135deg,rgba(0,207,170,.08),rgba(59,130,246,.08));border-radius:14px">';
    h += '<div style="font-size:13px;font-weight:800;color:var(--teal);margin-bottom:8px">📈 成長している種目（2週前比）</div>';
    for (var oi = 0; oi < overload.length; oi++) {
      var o = overload[oi];
      h += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">';
      h += '<span style="font-size:14px">' + (EXERCISE_DB[o.part]?.emoji || '💪') + '</span>';
      h += '<span style="flex:1;font-size:12px;font-weight:600">' + o.name + '</span>';
      h += '<span style="font-size:12px;font-weight:800;color:var(--teal)">+' + o.pct + '%</span>';
      h += '<span style="font-size:10px;color:var(--txt3)">' + o.prev + '→' + o.now + 'kg(1RM)</span></div>';
    }
    h += '</div>';
  }

  // 部位別週間ボリューム
  var volParts = Object.keys(weekVol.volume);
  if (volParts.length) {
    var maxVol = Math.max.apply(null, volParts.map(function(p){return weekVol.volume[p];})) || 1;
    h += '<div><div style="font-size:13px;font-weight:700;margin-bottom:8px">🏋️ 今週の部位別ボリューム</div>';
    for (var vi = 0; vi < volParts.length; vi++) {
      var vp = volParts[vi];
      var vol = weekVol.volume[vp];
      var sets = weekVol.sets[vp];
      var barW = Math.max(8, vol / maxVol * 100);
      h += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">';
      h += '<span style="width:26px;font-size:16px">' + (EXERCISE_DB[vp]?.emoji || '💪') + '</span>';
      h += '<span style="width:36px;font-size:11px;color:var(--txt3)">' + (EXERCISE_DB[vp]?.name || vp) + '</span>';
      h += '<div style="flex:1;height:8px;background:var(--b2);border-radius:4px"><div style="width:' + barW + '%;height:100%;background:var(--org);border-radius:4px"></div></div>';
      h += '<span style="font-size:10px;color:var(--txt3);min-width:60px;text-align:right">' + Math.round(vol/1000) + 'k · ' + sets + 'set</span></div>';
    }
    h += '</div>';
  }

  // 自己ベスト一覧
  if (prList.length) {
    h += '<div><div style="font-size:13px;font-weight:700;margin-bottom:8px">🏆 自己ベスト (推定1RM)</div>';
    for (var pi = 0; pi < Math.min(15, prList.length); pi++) {
      var pr = prList[pi];
      h += '<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--surf2);border-radius:10px;margin-bottom:3px">';
      h += '<span style="font-size:16px">' + (EXERCISE_DB[pr.part]?.emoji || '💪') + '</span>';
      h += '<div style="flex:1"><div style="font-size:12px;font-weight:700">' + pr.name + '</div>';
      h += '<div style="font-size:10px;color:var(--txt3)">' + pr.maxWeight + 'kg × ' + pr.reps + '回 (' + pr.date + ')</div></div>';
      h += '<div style="text-align:right"><div style="font-size:16px;font-weight:800;color:var(--org)">' + pr.max1RM + '<span style="font-size:10px">kg</span></div>';
      h += '<div style="font-size:8px;color:var(--txt3)">est.1RM</div></div></div>';
    }
    h += '</div>';
  } else {
    h += '<div style="text-align:center;padding:24px;color:var(--txt3)"><div style="font-size:32px;margin-bottom:8px">🏋️</div><div>トレーニング記録を蓄積するとPRが表示されます</div></div>';
  }

  h += '</div>';
  openM('🏆 PRダッシュボード & 分析', h, true);
}

// ==================== AI ADVISOR ====================
const AI_DB={
'試合前の食事は？':'試合**3〜4時間前**はうどんやパスタなどの消化の良い炭水化物がベスト。脂質・食物繊維は控えめに。\n\n**1時間前**: バナナ、おにぎり（梅・昆布）、カステラ\n**直前**: スポーツドリンクで水分+電解質を補給\n\n⚠️ 普段食べ慣れないものは試合当日に試さないこと！',
'筋肉をつけたい':'筋肉増量の3原則:\n\n**1. タンパク質**: 体重×1.6〜2.0g/日（70kgなら112〜140g）\n**2. カロリー**: 維持量+300〜500kcal/日（少しずつ増やす）\n**3. タイミング**: 筋トレ後30分以内にP20〜30g（ゴールデンタイム）\n\nおすすめ食材: 鶏むね肉、ゆで卵、ギリシャヨーグルト、プロテイン',
'疲労が抜けない':'慢性疲労の3大原因と対策:\n\n**1. 睡眠不足** → 7〜9時間確保、就寝時間を一定に\n**2. 栄養不足** → 鉄分（レバー・ほうれん草）、ビタミンC（柑橘類）\n**3. オーバートレーニング** → 週1〜2日の完全休養日\n\n2週間以上続く場合は**医師への相談**を推奨します。',
'メンタルを整えたい':'試合前の緊張は**パフォーマンス向上のサイン**です。\n\n**即効性のあるテクニック:**\n- 腹式呼吸4-7-8（4秒吸う→7秒止める→8秒吐く）\n- イメージトレーニング（成功場面を5分間視覚化）\n- ポジティブセルフトーク（「できる」を3回唱える）\n\n**日常的な習慣:** ルーティン作り、マインドフルネス瞑想5分/日',
'睡眠の質を上げたい':'スポーツ選手の睡眠改善ガイド:\n\n**環境**: 室温18〜20℃、暗く静かな部屋\n**習慣**: 就寝2時間前スマホオフ、同じ時間に就寝\n**食事**: 就寝3時間前に夕食、トリプトファン食品（バナナ・牛乳）\n**NG**: カフェイン15時以降、激しい運動は就寝3時間前まで\n\n**成長ホルモンは22時〜2時に最大分泌**。この時間帯の深い睡眠が回復の鍵。',
'減量中のタンパク質量は？':'減量時は筋肉維持が最優先:\n\n**目安**: 体重×2.0〜2.5g/日（通常より多め）\n**理由**: カロリー不足時は筋分解が進みやすい\n\n**実践例（70kgの場合 P140〜175g）:**\n- 朝: ゆで卵2個+プロテイン（P35g）\n- 昼: 鶏むね肉150g定食（P35g）\n- 間食: ギリシャヨーグルト（P10g）\n- 夕: 鮭200g+納豆（P40g）\n- 就寝前: プロテイン（P25g）',
'プロテインのタイミングは？':'**最も効果的なタイミング:**\n\n**1. 筋トレ直後30分以内**（ゴールデンタイム）→ ホエイP 20〜30g\n**2. 就寝前** → カゼインP or ソイP（ゆっくり吸収で夜間の筋合成促進）\n**3. 朝食時**（寝ている間の筋分解を止める）\n\n⚠️ 1回30g以上は吸収効率が下がるので**分散摂取**がベスト',
'試合前の緊張を抑えるには？':'**即効テクニック:**\n- **バタフライハグ**: 両腕を交差して胸に当て、左右交互にタップ（1分）\n- **グラウンディング**: 足の裏の感覚に集中（30秒）\n- **パワーポーズ**: 胸を張り両手を腰に当てる（2分でコルチゾール低下）\n\n**準備段階:**\n- 試合と同じ流れのウォームアップルーティンを決めておく\n- 「結果」ではなく「プロセス」に集中する目標を設定',
'筋肉痛を早く治したい':'筋肉痛（DOMS）回復の科学的アプローチ:\n\n**やるべき:** アクティブリカバリー（軽いジョグ・ストレッチ）、十分な睡眠、タンパク質+炭水化物の摂取、入浴（38〜40℃ 15分）\n\n**効果あり:** フォームローラー、軽いマッサージ\n\n**NG:** 完全安静（血流低下で回復遅延）、痛い部位の強い刺激\n\n通常**48〜72時間**で回復。1週間以上続く場合は怪我の可能性。',
'週何回練習すべき？':'競技と目的別の目安:\n\n**筋力向上**: 週3〜4回（部位分割で同じ筋肉は中2日空ける）\n**持久力**: 週4〜5回（高強度2回+低強度2〜3回）\n**技術練習**: 週5〜6回（短時間高集中）\n\n**重要**: **週1〜2日の完全休養**が成長の鍵\n\n疲労サイン: 睡眠の質低下、食欲減退、モチベーション低下、コンディション⭐2以下が3日連続',
'オフ日の過ごし方は？':'**アクティブレスト（積極的休養）がおすすめ:**\n\n- 軽いウォーキング（20〜30分）\n- ストレッチ・ヨガ（15〜20分）\n- フォームローラーで筋膜リリース\n- 入浴（38〜40℃ 15分）\n\n**栄養**: 普段と同じタンパク質量を維持（筋肉は休んでいる時に成長）\n**睡眠**: 普段より少し多く（+30分〜1時間）',
'体重を減らすには？':'スポーツ選手の減量ガイド:\n\n**原則**: **月に体重の1%以下**のペースで（70kgなら月0.7kg以下）\n\n**カロリー**: 維持量から**300〜500kcal/日だけ減らす**（急激な制限はNG）\n**タンパク質**: 体重×2g以上を維持（筋肉を守る）\n**炭水化物**: 練習前後は確保、夜に少し減らす\n\n⚠️ 試合期の減量は避ける。体脂肪率が男子8%/女子15%以下はリスク。',
'集中力を高める方法は？':'**試合・練習中の集中力アップ:**\n\n**栄養面**: 血糖値を安定させる（低GI食品+こまめな補給）\n**水分**: 脱水2%で集中力20%低下。15分毎にコップ1杯\n**テクニック**: \n- 「キーワード」を決める（例:「速く」「強く」）\n- 1プレーずつリセット（過去のミスを引きずらない）\n- ルーティン動作で切り替え（深呼吸→動き出し）\n\n**日常**: マインドフルネス5分/日で注意力が向上',
'スプリント力を上げたい':'**スプリント力向上の3本柱:**\n\n**1. 筋力**: スクワット、デッドリフト、ランジ（週2回）\n**2. 爆発力**: ジャンプ系（ボックスジャンプ、バウンディング）\n**3. 技術**: 腕振り改善、接地時間短縮ドリル\n\n**栄養**: クレアチン5g/日（瞬発系に効果的）、十分な炭水化物\n\n**目安期間**: 4〜8週間の継続で効果を実感',
'持久力をつけたい':'**持久力向上プログラム:**\n\n**基礎**: 最大心拍数の60〜70%で30〜60分の有酸素（週2〜3回）\n**応用**: インターバル走（30秒全力→60秒ジョグ×8〜10本、週1回）\n**栄養**: 練習前に炭水化物、練習中にスポーツドリンク、練習後にP+C\n\n**鉄分**: 持久系選手は鉄不足になりやすい（レバー・ほうれん草・赤身肉）\n\n**期間**: 4週間で変化を感じ、12週間で大きな向上',
'怪我を予防するには？':'**怪我予防の5ステップ:**\n\n**1. ウォームアップ**: 動的ストレッチ10分（静的は練習後に）\n**2. クールダウン**: 軽いジョグ+静的ストレッチ15分\n**3. 睡眠**: 7〜9時間（回復と組織修復の時間）\n**4. 栄養**: コラーゲン+ビタミンC（腱・靭帯の強化）\n**5. 段階的負荷**: 練習量は週10%以内の増加\n\n⚠️ 痛みを感じたら「RICE処置」（Rest/Ice/Compression/Elevation）',
'ウォームアップの最適解は？':'**科学的ウォームアップ（10〜15分）:**\n\n**1. 軽い有酸素（3分）**: ジョグ or バイク（心拍数を上げる）\n**2. 動的ストレッチ（5分）**: レッグスイング、ヒップサークル、アームサークル\n**3. 競技動作（3分）**: 実際の動きを徐々にスピードアップ\n**4. 瞬発系（2分）**: ダッシュ3本（50%→70%→90%）\n\n⚠️ 練習前の**静的ストレッチはNG**（筋出力が低下する研究結果あり）',
'今日のトレーニングメニューを提案して':'あなたの最近のトレーニング記録をもとに提案します。\n\n**基本原則**: 前回鍛えた部位は**48時間以上空ける**\n\n**おすすめメニュー:**\n1. ウォームアップ（動的ストレッチ10分）\n2. メイン種目（コンパウンド→アイソレーション）\n3. 補助種目\n4. クールダウン（静的ストレッチ15分）\n\n💡 より具体的なメニューは「トレーニング」ページで確認できます！',
'体重を増やすには？':'**クリーンバルク（健康的な増量）:**\n\n**カロリー**: 維持量+**400〜600kcal/日**\n**PFCバランス**: P25% / C50% / F25%\n**タンパク質**: 体重×1.8〜2.2g（筋肉の材料）\n\n**実践**: 1日5〜6食に分けて食べる\n- 朝: オートミール+プロテイン+バナナ\n- 間食: 餅+ピーナッツバター\n- 寝る前: カゼインプロテイン+牛乳\n\n⚠️ 月1〜2kgペースが理想（脂肪ではなく筋肉で増やす）',
'コンディションが悪い':'**コンディション改善チェックリスト:**\n\n✅ 睡眠は7時間以上取れていますか？\n✅ 水分は1日8杯以上飲んでいますか？\n✅ 3食しっかり食べていますか？\n✅ 週1日以上の完全休養がありますか？\n✅ ストレスが溜まっていませんか？\n\n**即効対策**: 軽い散歩20分、入浴38℃15分、ビタミンC補給\n**2日以上⭐2以下**が続く場合は練習量を50%に落としましょう。',
'今週の栄養バランスはどう？':'**📊 週間栄養レビュー**\n\n過去7日間のデータを基に分析します。\n\n**チェックポイント:**\n1. カロリー: 目標の90〜110%が理想\n2. タンパク質: 体重×1.6〜2.0g/日\n3. 食事回数: 1日3食+間食1〜2回\n4. 水分: 1日8杯(2L)以上\n\n→ 「今日の食事を評価して」で今日のデータを詳しく分析できます！',
'疲労回復のアドバイスがほしい':'**🔋 疲労回復の5ステップ:**\n\n**1. 栄養**: 練習後30分以内にP20g+C40g（プロテイン+バナナ）\n**2. 水分**: 練習中の体重減少×1.5Lを補給\n**3. 睡眠**: **7〜9時間**が必須。成長ホルモンは深い睡眠で分泌\n**4. 入浴**: 38〜40℃で15分。交代浴も効果的\n**5. ストレッチ**: 静的ストレッチ15分（練習後・就寝前）\n\n⚠️ 3日以上回復しない場合はオーバートレーニングの可能性。完全休養を。',
'練習前に何を食べる？':'**練習前の食事タイミング別ガイド:**\n\n**3〜4時間前**: 通常の食事OK（ご飯+主菜+副菜）\n**1〜2時間前**: 消化の良い炭水化物中心\n→ おにぎり、うどん、バナナ、カステラ\n**30分前**: 少量の糖質\n→ ゼリー飲料、スポーツドリンク\n\n**避けるもの**: 脂質の多い食品（揚げ物）、食物繊維の多い生野菜、乳製品（人による）'
};
let aiHistory=[{role:'ai',text:'こんにちは！部勝 AI アドバイザーです 🏋️\n\nあなたの食事・トレーニング・コンディションデータをリアルタイムで分析し、パーソナルなアドバイスを提供します。\n\n**できること:**\n• 今日の食事・トレーニングメニューの提案\n• コンディション分析とリカバリーアドバイス\n• 試合準備・メンタルサポート\n• 体重管理・栄養バランスの相談\n\n何でも聞いてください！'}];
let aiLoading=false;
let calView='month'; // 'month' | 'week'
let calOffset=0;    // 月次: 月オフセット, 週次: 週オフセット
