// 09 - 管理者ダッシュボード, FAQ, 設定, ヘルプ, データテーブル
  var team=teamId?DB.teams.find(function(t){return t.id===teamId;}):null;
  // コーチ: matched requests からもチーム検索
  if(!team&&DB.currentUser?.role==='coach'){
    var c=getMyCoach();
    if(c){
      var mReq=_dbArr('requests').find(function(r){return r.coachId===c.id&&r.status==='matched';});
      if(mReq){teamId=mReq.teamId;team=DB.teams.find(function(t){return t.id===teamId;});}
    }
  }
  if(!team) return emptyState('📁','所属チームがありません','チームに参加すると資料が閲覧できます');
  var files=_dbArr('teamFiles').filter(function(f){return f.teamId===team.id;});
  var cats=['練習資料','戦術ボード','試合映像','トレーニング動画','ミーティング','その他'];
  var curCat=window._sfCat||'all';
  var filtered=curCat==='all'?files:files.filter(function(f){return f.category===curCat;});
  filtered.sort(function(a,b){return(b.createdAt||'')>(a.createdAt||'')?1:-1;});

  var html='<div class="pg-head"><div class="pg-title">📂 '+sanitize(team.name,15)+' の資料</div><div class="pg-sub">チームから共有された資料・動画</div></div>';

  html+='<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px">'
    +'<button class="btn '+(curCat==='all'?'btn-primary':'btn-ghost')+' btn-sm" onclick="window._sfCat=\'all\';refreshPage()">全て <span style="font-size:10px;opacity:.7">'+files.length+'</span></button>';
  cats.forEach(function(c){
    var cnt=files.filter(function(f){return f.category===c;}).length;
    if(cnt>0) html+='<button class="btn '+(curCat===c?'btn-primary':'btn-ghost')+' btn-sm" onclick="window._sfCat=\''+c+'\';refreshPage()">'+c+' <span style="font-size:10px;opacity:.7">'+cnt+'</span></button>';
  });
  html+='</div>';

  if(filtered.length===0){
    html+=emptyState('📁','共有資料はまだありません','チーム管理者が資料を追加すると、ここに表示されます');
  } else {
    html+='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px">';
    filtered.forEach(function(f){
      var typeIcon=f.type==='video'?'🎬':f.type==='image'?'🖼️':f.type==='link'?'🔗':'📄';
      var thumb='';
      if(f.type==='video'&&f.url){
        var ytId=_extractYoutubeId(f.url);
        if(ytId) thumb='<div style="width:100%;aspect-ratio:16/9;background:url(https://img.youtube.com/vi/'+ytId+'/mqdefault.jpg) center/cover;border-radius:8px 8px 0 0"></div>';
        else thumb='<div style="width:100%;aspect-ratio:16/9;background:linear-gradient(135deg,#1e3a5f,#0ea5e9);border-radius:8px 8px 0 0;display:flex;align-items:center;justify-content:center;font-size:40px;color:#fff">🎬</div>';
      } else if(f.type==='image'&&f.data){
        thumb='<div style="width:100%;aspect-ratio:16/9;background:url('+f.data+') center/cover;border-radius:8px 8px 0 0"></div>';
      } else {
        thumb='<div style="width:100%;height:60px;background:var(--surf2);border-radius:8px 8px 0 0;display:flex;align-items:center;justify-content:center;font-size:28px">'+typeIcon+'</div>';
      }
      html+='<div class="card" style="padding:0;overflow:hidden;cursor:pointer" onclick="openTeamFileDetail(\''+f.id+'\')">'
        +thumb
        +'<div style="padding:12px 14px">'
        +'<div class="flex items-center gap-6 mb-4"><span style="font-size:14px">'+typeIcon+'</span><span class="fw7 text-sm" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+sanitize(f.title||'無題',30)+'</span></div>'
        +'<div class="text-xs text-muted mb-6">'+sanitize(f.category||'',10)+' · '+(f.createdAt||'').slice(0,10)+'</div>'
        +(f.description?'<div class="text-xs text-muted" style="line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">'+sanitize(f.description,80)+'</div>':'')
        +'</div></div>';
    });
    html+='</div>';
  }
  return html;
}

// ── Helper: YouTube ID抽出 ──
function _extractYoutubeId(url){
  if(!url)return null;
  var m=url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return m?m[1]:null;
}

// ── 資料追加モーダル ──
function openAddTeamFile(){
  var team=getMyTeam();if(!team)return;
  openM('📂 資料を追加',
    '<div class="form-group"><label class="label">タイトル <span style="color:var(--red)">*</span></label><input id="tf-title" class="input" placeholder="例: 第3節 戦術解説動画"></div>'
    +'<div class="form-group"><label class="label">種類</label><div style="display:flex;gap:6px;flex-wrap:wrap">'
    +'<label style="display:flex;align-items:center;gap:4px;font-size:13px;cursor:pointer"><input type="radio" name="tf-type" value="video" checked> 🎬 動画URL</label>'
    +'<label style="display:flex;align-items:center;gap:4px;font-size:13px;cursor:pointer"><input type="radio" name="tf-type" value="image"> 🖼️ 画像</label>'
    +'<label style="display:flex;align-items:center;gap:4px;font-size:13px;cursor:pointer"><input type="radio" name="tf-type" value="link"> 🔗 リンク</label>'
    +'<label style="display:flex;align-items:center;gap:4px;font-size:13px;cursor:pointer"><input type="radio" name="tf-type" value="note"> 📄 テキスト</label>'
    +'</div></div>'
    +'<div class="form-group"><label class="label">URL（動画/リンク）</label><input id="tf-url" class="input" placeholder="https://youtube.com/watch?v=... や Google Drive リンク"></div>'
    +'<div class="form-group"><label class="label">画像（任意）</label><input type="file" id="tf-img" accept="image/*" class="input" style="padding:8px" onchange="_previewTeamFileImg(this)"><div id="tf-img-preview" style="margin-top:8px"></div></div>'
    +'<div class="form-group"><label class="label">カテゴリ</label><select id="tf-cat" class="input"><option value="練習資料">練習資料</option><option value="戦術ボード">戦術ボード</option><option value="試合映像">試合映像</option><option value="トレーニング動画">トレーニング動画</option><option value="ミーティング">ミーティング</option><option value="その他">その他</option></select></div>'
    +'<div class="form-group"><label class="label">説明・メモ</label><textarea id="tf-desc" class="input" rows="3" placeholder="選手やコーチへの補足メモ…"></textarea></div>'
    +'<button class="btn btn-primary w-full mt-12" onclick="saveTeamFile()">📤 共有する</button>'
  );
}
function _previewTeamFileImg(input){
  var preview=document.getElementById('tf-img-preview');
  if(!preview)return;
  if(input.files&&input.files[0]){
    if(input.files[0].size>2*1024*1024){toast('画像は2MB以下にしてください','e');input.value='';return;}
    var reader=new FileReader();
    reader.onload=function(e){
      _compressPhoto(e.target.result,400).then(function(compressed){
        preview.innerHTML='<img src="'+compressed+'" style="max-width:100%;max-height:150px;border-radius:8px">';
        preview.dataset.data=compressed;
      });
    };
    reader.readAsDataURL(input.files[0]);
  }
}
function saveTeamFile(editId){
  var team=getMyTeam();if(!team)return;
  var title=sanitize(document.getElementById('tf-title')?.value||'',60);
  if(!title){toast('タイトルを入力してください','e');return;}
  var typeEl=document.querySelector('input[name="tf-type"]:checked');
  var type=typeEl?typeEl.value:'note';
  var url=sanitize(document.getElementById('tf-url')?.value||'',500);
  var category=document.getElementById('tf-cat')?.value||'その他';
  var description=sanitize(document.getElementById('tf-desc')?.value||'',300);
  var imgPreview=document.getElementById('tf-img-preview');
  var imgData=imgPreview?.dataset?.data||'';

  if(editId){
    var existing=_dbArr('teamFiles').find(function(f){return f.id===editId;});
    if(existing){
      existing.title=title;existing.type=type;existing.url=url;
      existing.category=category;existing.description=description;
      if(imgData)existing.data=imgData;
      existing.updatedAt=new Date().toISOString();
    }
  } else {
    _dbArr('teamFiles').push({
      id:genId('tf'),teamId:team.id,title:title,type:type,url:url,
      data:imgData,category:category,description:description,
      createdBy:DB.currentUser?.name||'',createdAt:new Date().toISOString()
    });
  }
  saveDB();closeM();toast(editId?'資料を更新しました':'資料を共有しました','s');refreshPage();
}
function editTeamFile(fid){
  if(DB.currentUser?.role!=='team'&&DB.currentUser?.role!=='admin'){toast('編集はチーム管理者のみ可能です','e');return;}
  var f=_dbArr('teamFiles').find(function(x){return x.id===fid;});
  if(!f)return;
  openM('✏️ 資料を編集',
    '<div class="form-group"><label class="label">タイトル</label><input id="tf-title" class="input" value="'+sanitize(f.title||'')+'"></div>'
    +'<div class="form-group"><label class="label">種類</label><div style="display:flex;gap:6px;flex-wrap:wrap">'
    +'<label style="display:flex;align-items:center;gap:4px;font-size:13px;cursor:pointer"><input type="radio" name="tf-type" value="video" '+(f.type==='video'?'checked':'')+'> 🎬 動画URL</label>'
    +'<label style="display:flex;align-items:center;gap:4px;font-size:13px;cursor:pointer"><input type="radio" name="tf-type" value="image" '+(f.type==='image'?'checked':'')+'> 🖼️ 画像</label>'
    +'<label style="display:flex;align-items:center;gap:4px;font-size:13px;cursor:pointer"><input type="radio" name="tf-type" value="link" '+(f.type==='link'?'checked':'')+'> 🔗 リンク</label>'
    +'<label style="display:flex;align-items:center;gap:4px;font-size:13px;cursor:pointer"><input type="radio" name="tf-type" value="note" '+(f.type==='note'?'checked':'')+'> 📄 テキスト</label>'
    +'</div></div>'
    +'<div class="form-group"><label class="label">URL</label><input id="tf-url" class="input" value="'+sanitize(f.url||'')+'"></div>'
    +'<div class="form-group"><label class="label">画像</label><input type="file" id="tf-img" accept="image/*" class="input" style="padding:8px" onchange="_previewTeamFileImg(this)"><div id="tf-img-preview" style="margin-top:8px">'+(f.data?'<img src="'+f.data+'" style="max-width:100%;max-height:150px;border-radius:8px">':'')+'</div></div>'
    +'<div class="form-group"><label class="label">カテゴリ</label><select id="tf-cat" class="input"><option value="練習資料" '+(f.category==='練習資料'?'selected':'')+'>練習資料</option><option value="戦術ボード" '+(f.category==='戦術ボード'?'selected':'')+'>戦術ボード</option><option value="試合映像" '+(f.category==='試合映像'?'selected':'')+'>試合映像</option><option value="トレーニング動画" '+(f.category==='トレーニング動画'?'selected':'')+'>トレーニング動画</option><option value="ミーティング" '+(f.category==='ミーティング'?'selected':'')+'>ミーティング</option><option value="その他" '+(f.category==='その他'?'selected':'')+'>その他</option></select></div>'
    +'<div class="form-group"><label class="label">説明</label><textarea id="tf-desc" class="input" rows="3">'+sanitize(f.description||'')+'</textarea></div>'
    +'<button class="btn btn-primary w-full mt-12" onclick="saveTeamFile(\''+f.id+'\')">💾 更新</button>'
  );
  if(f.data){var p=document.getElementById('tf-img-preview');if(p)p.dataset.data=f.data;}
}
function deleteTeamFile(fid){
  if(DB.currentUser?.role!=='team'&&DB.currentUser?.role!=='admin'){toast('削除はチーム管理者のみ可能です','e');return;}
  if(!confirm('この資料を削除しますか？'))return;
  DB.teamFiles=_dbArr('teamFiles').filter(function(x){return x.id!==fid;});
  saveDB();toast('削除しました','s');refreshPage();
}
function openTeamFileDetail(fid){
  var f=_dbArr('teamFiles').find(function(x){return x.id===fid;});
  if(!f)return;
  // Access check: only allow if user's team matches file's team
  var myTeamId=_getMyTeamId();
  if(DB.currentUser?.role!=='admin'){
    // Coach: also check matched requests
    if(DB.currentUser?.role==='coach'&&!myTeamId){
      var c=getMyCoach();
      if(c){var mR=_dbArr('requests').find(function(r){return r.coachId===c.id&&r.status==='matched';});if(mR)myTeamId=mR.teamId;}
    }
    if(myTeamId!==f.teamId){toast('この資料へのアクセス権がありません','e');return;}
  }
  var typeIcon=f.type==='video'?'🎬':f.type==='image'?'🖼️':f.type==='link'?'🔗':'📄';
  var h='<div style="max-height:70vh;overflow-y:auto">';

  // Video embed
  if(f.type==='video'&&f.url){
    var ytId=_extractYoutubeId(f.url);
    if(ytId){
      h+='<div style="width:100%;aspect-ratio:16/9;margin-bottom:16px;border-radius:10px;overflow:hidden"><iframe src="https://www.youtube.com/embed/'+ytId+'" style="width:100%;height:100%;border:none" allowfullscreen></iframe></div>';
    } else {
      h+='<div style="margin-bottom:16px"><a href="'+sanitize(f.url,200)+'" target="_blank" rel="noopener" class="btn btn-primary btn-sm">🎬 動画を開く</a></div>';
    }
  }

  // Image
  if(f.type==='image'&&f.data){
    h+='<div style="margin-bottom:16px;text-align:center"><img src="'+f.data+'" style="max-width:100%;max-height:400px;border-radius:10px;box-shadow:0 4px 20px rgba(0,0,0,.1)"></div>';
  }

  // Link
  if(f.type==='link'&&f.url){
    h+='<div style="margin-bottom:16px"><a href="'+sanitize(f.url,200)+'" target="_blank" rel="noopener" class="btn btn-primary btn-sm">🔗 リンクを開く</a></div>';
  }

  // Category badge
  h+='<div class="mb-8"><span class="badge b-blue" style="font-size:11px">'+sanitize(f.category||'',12)+'</span><span class="text-xs text-muted" style="margin-left:8px">'+(f.createdAt||'').slice(0,10)+'</span></div>';

  // Description
  if(f.description){
    h+='<div style="font-size:14px;line-height:1.8;color:var(--txt2);white-space:pre-wrap;margin-bottom:16px">'+sanitize(f.description,500)+'</div>';
  }

  h+='<div class="text-xs text-muted">投稿者: '+sanitize(f.createdBy||'',20)+'</div>';
  h+='</div>';

  openM(typeIcon+' '+sanitize(f.title||'資料',30), h);
}

// ==================== ADMIN PLAYERS/PARENTS MANAGEMENT ====================
function adminPlayersMgmt(){
  if(DB.currentUser?.role!=='admin') return '<div class="card text-center" style="padding:40px">🔒 管理者のみ</div>';
  const tab=window._apTab||'players';
  const q=(window._apQ||'').toLowerCase();
  const players=DB.players.filter(p=>!q||((p.name||'')+(p.team||'')).toLowerCase().includes(q));
  const users=_getUsers();
  const parents=users.filter(u=>u.role==='parent');
  
  let html=`<div class="pg-head flex justify-between items-center">
    <div><div class="pg-title">選手・保護者管理</div><div class="pg-sub">全${(DB.players||[]).length}選手 / ${parents.length}保護者</div></div>
    <div class="flex gap-8">
      <button class="btn btn-primary btn-sm" onclick="openM('👤 選手追加',addPlayerForm())">+ 選手追加</button>
      <button class="btn btn-secondary btn-sm" onclick="adminExportPlayersCSV()">⬇ CSV</button>
    </div>
  </div>
  <div class="flex gap-8 mb-16">
    <button class="btn ${tab==='players'?'btn-primary':'btn-ghost'} btn-sm" onclick="window._apTab='players';refreshPage()">👦 選手一覧</button>
    <button class="btn ${tab==='parents'?'btn-primary':'btn-ghost'} btn-sm" onclick="window._apTab='parents';refreshPage()">👨‍👩‍👧 保護者一覧</button>
  </div>
  <div style="margin-bottom:14px;position:relative">
    <i class="fa fa-search" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--txt3);font-size:12px"></i>
    <input class="input" placeholder="名前・チームで検索…" value="${sanitize(window._apQ||'')}" oninput="window._apQ=this.value;refreshPage()" style="padding-left:32px;height:36px;font-size:12px">
  </div>`;

  if(tab==='players'){
    html+=`<div class="card" style="padding:0;overflow:hidden">
    <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead><tr style="background:var(--surf2);color:var(--txt3)">
        <th style="padding:10px 12px;text-align:left">選手名</th>
        <th style="padding:10px 8px;text-align:left">チーム</th>
        <th style="padding:10px 8px;text-align:center">年齢</th>
        <th style="padding:10px 8px;text-align:left">保護者</th>
        <th style="padding:10px 8px;text-align:center">月謝</th>
        <th style="padding:10px 8px;text-align:center">コンディション</th>
        <th style="padding:10px 8px;text-align:center">操作</th>
      </tr></thead><tbody>`;
    players.forEach(p=>{
      const team=DB.teams.find(t=>t.id===p.team);
      const guardian=p.guardianId?users.find(u=>u.id===p.guardianId):null;
      const thisPay=_dbArr('payments').find(x=>x.player===p.id&&x.month===curMonth());
      const payStatus=thisPay?(thisPay.status==='paid'?'<span class="badge b-green" style="font-size:10px">済</span>':'<span class="badge b-org" style="font-size:10px">未</span>'):'<span class="badge b-gray" style="font-size:10px">--</span>';
      const cond=DB.conditionLog?.[p.id];
      const latestCond=cond?Object.values(cond).sort((a,b)=>(b.date||'')>(a.date||'')?1:-1)[0]:null;
      const condBadge=latestCond?'<span style="font-size:14px">'+['','😫','😟','😐','😊','🤩'][latestCond.mood||3]+'</span>':'--';
      html+=`<tr style="border-bottom:1px solid var(--bdr)">
        <td style="padding:10px 12px"><div class="fw7">${sanitize(p.name||'',20)}</div><div class="text-xs text-muted">${p.pos||''} / ${p.id}</div></td>
        <td style="padding:10px 8px">${team?sanitize(team.name,15):'<span class="text-muted">未所属</span>'}</td>
        <td style="padding:10px 8px;text-align:center">${p.age||'--'}</td>
        <td style="padding:10px 8px">${guardian?'<span class="badge b-green" style="font-size:10px">'+sanitize(guardian.name,8)+'</span>':'<span class="badge b-yel" style="font-size:10px">未紐付</span>'}</td>
        <td style="padding:10px 8px;text-align:center">${payStatus}</td>
        <td style="padding:10px 8px;text-align:center">${condBadge}</td>
        <td style="padding:10px 8px;text-align:center">
          <button class="btn btn-ghost btn-xs" onclick="adminViewPlayerDetail('${p.id}')" title="詳細">📋</button>
          <button class="btn btn-ghost btn-xs" onclick="adminEditPlayer('${p.id}')">✏️</button>
          <button class="btn btn-ghost btn-xs" style="color:var(--red)" onclick="adminDeletePlayer('${p.id}')">🗑️</button>
        </td></tr>`;
    });
    html+=`</tbody></table></div></div>`;
    // 集計
    const withGuardian=DB.players.filter(p=>p.guardianId).length;
    const avgAge=(DB.players||[]).length?Math.round(DB.players.reduce((s,p)=>s+(p.age||0),0)/(DB.players||[]).length):0;
    html+=`<div class="stat-row mt-16" style="grid-template-columns:repeat(4,1fr)">
      <div class="stat-box"><div class="stat-l">総選手数</div><div class="stat-n">${(DB.players||[]).length}</div></div>
      <div class="stat-box"><div class="stat-l">平均年齢</div><div class="stat-n">${avgAge}歳</div></div>
      <div class="stat-box"><div class="stat-l">保護者紐付済</div><div class="stat-n" style="color:var(--grn)">${withGuardian}</div></div>
      <div class="stat-box"><div class="stat-l">未紐付</div><div class="stat-n" style="color:var(--red)">${(DB.players||[]).length-withGuardian}</div></div>
    </div>`;
  } else {
    // 保護者一覧
    html+=`<div class="card" style="padding:0;overflow:hidden">
    <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead><tr style="background:var(--surf2);color:var(--txt3)">
        <th style="padding:10px 12px;text-align:left">保護者名</th>
        <th style="padding:10px 8px;text-align:left">メール</th>
        <th style="padding:10px 8px;text-align:left">紐付け子供</th>
        <th style="padding:10px 8px;text-align:center">カード登録</th>
        <th style="padding:10px 8px;text-align:center">未払い</th>
        <th style="padding:10px 8px;text-align:center">操作</th>
      </tr></thead><tbody>`;
    parents.filter(u=>!q||(u.name||'').toLowerCase().includes(q)).forEach(u=>{
      const children=DB.players.filter(p=>p.guardianId===u.id);
      const unpaid=_dbArr('payments').filter(p=>p.guardianId===u.id&&p.status!=='paid').length;
      html+=`<tr style="border-bottom:1px solid var(--bdr)">
        <td style="padding:10px 12px"><div class="fw7">${sanitize(u.name||'',20)}</div><div class="text-xs text-muted">${u.id}</div></td>
        <td style="padding:10px 8px;font-size:11px">${sanitize(u.email||'',25)}</td>
        <td style="padding:10px 8px">${children.length?children.map(c=>'<span class="badge b-blue" style="font-size:10px">'+sanitize(c.name,8)+'</span>').join(' '):'<span class="text-muted">なし</span>'}</td>
        <td style="padding:10px 8px;text-align:center">${u.paymentSetup?'<span class="badge b-green" style="font-size:10px">✅済</span>':'<span class="badge b-yel" style="font-size:10px">未</span>'}</td>
        <td style="padding:10px 8px;text-align:center">${unpaid?'<span class="badge b-org" style="font-size:10px">'+unpaid+'件</span>':'--'}</td>
        <td style="padding:10px 8px;text-align:center">
          <button class="btn btn-ghost btn-xs" onclick="adminEditUser('${u.id}')">✏️</button>
        </td></tr>`;
    });
    html+=`</tbody></table></div></div>`;
  }
  return html;
}

function adminEditPlayer(pid){
  const p=DB.players.find(x=>x.id===pid);
  if(!p){toast('選手が見つかりません','e');return;}
  const teams=DB.teams;
  openM('✏️ 選手編集: '+sanitize(p.name,15),`
    <div class="form-group"><label class="label">氏名</label><input id="aep-name" class="input" value="${sanitize(p.name||'')}"></div>
    <div class="form-group"><label class="label">年齢</label><input id="aep-age" class="input" type="number" value="${p.age||''}"></div>
    <div class="form-group"><label class="label">ポジション</label><input id="aep-pos" class="input" value="${sanitize(p.pos||'')}"></div>
    <div class="form-group"><label class="label">所属チーム</label>
      <select id="aep-team" class="input">
        <option value="">未所属</option>
        ${teams.map(t=>'<option value="'+t.id+'" '+(p.team===t.id?'selected':'')+'>'+sanitize(t.name,20)+'</option>').join('')}
      </select>
    </div>
    <div class="form-group"><label class="label">保護者</label><select id="aep-guardian" class="input"><option value="">未紐付</option>${_getUsers().filter(function(u){return u.role==='parent';}).map(function(u){return '<option value="'+u.id+'"'+(p.guardianId===u.id?' selected':'')+'>'+sanitize(u.name,20)+' ('+sanitize(u.email,25)+')</option>';}).join('')}</select></div>
    <div class="flex gap-8 mt-16">
      <button class="btn btn-primary flex-1" onclick="adminSavePlayer('${p.id}')">💾 保存</button>
      <button class="btn btn-ghost flex-1" onclick="closeM()">キャンセル</button>
    </div>
  `);
}
function adminSavePlayer(pid){
  const p=DB.players.find(x=>x.id===pid);if(!p)return;
  const oldGuardianId=p.guardianId;
  p.name=sanitize(document.getElementById('aep-name')?.value||p.name,50);
  p.age=parseInt(document.getElementById('aep-age')?.value)||p.age;
  p.pos=sanitize(document.getElementById('aep-pos')?.value||'',20);
  p.team=document.getElementById('aep-team')?.value||'';
  p.guardianId=document.getElementById('aep-guardian')?.value||'';
  // 保護者紐づけが変更された場合、usersテーブルも更新
  if(p.guardianId!==oldGuardianId){
    const users=_getUsers();
    // 旧保護者のリンク解除
    if(oldGuardianId){
      const oldGu=users.find(u=>u.id===oldGuardianId);
      if(oldGu){
        if(oldGu.linkedPlayerId===pid)oldGu.linkedPlayerId=null;
        if(oldGu.linkedPlayers)oldGu.linkedPlayers=oldGu.linkedPlayers.filter(id=>id!==pid);
        oldGu.linkedTeamId=null;
      }
    }
    // 新保護者のリンク設定
    if(p.guardianId){
      const newGu=users.find(u=>u.id===p.guardianId);
      if(newGu){
        newGu.linkedPlayerId=pid;
        if(!newGu.linkedPlayers)newGu.linkedPlayers=[];
        if(!newGu.linkedPlayers.includes(pid))newGu.linkedPlayers.push(pid);
        newGu.linkedTeamId=p.team||null;
      }
      p.guardian=users.find(u=>u.id===p.guardianId)?.name||'';
    } else {
      p.guardian='';
    }
    _saveUsers(users);
    // 共有データ同期はsaveDB()経由で自動実行（管理者はparent UIDを持たないため直接更新不可）
  }
  saveDB();closeM();toast('選手情報を更新しました','s');refreshPage();
}
function adminDeletePlayer(pid){
  const p=DB.players.find(x=>x.id===pid);if(!p)return;
  if(!confirm(sanitize(p.name,15)+'を削除しますか？この操作は元に戻せません。'))return;
  DB.players=DB.players.filter(x=>x.id!==pid);
  saveDB();toast('選手を削除しました','s');refreshPage();
}
function adminEditUser(uid){
  const users=_getUsers();const u=users.find(x=>x.id===uid);if(!u)return;
  openM('✏️ ユーザー編集: '+sanitize(u.name,15),`
    <div class="form-group"><label class="label">氏名</label><input id="aeu-name" class="input" value="${sanitize(u.name||'')}"></div>
    <div class="form-group"><label class="label">メール</label><input id="aeu-email" class="input" value="${sanitize(u.email||'')}"></div>
    <div class="form-group"><label class="label">ロール</label>
      <select id="aeu-role" class="input">
        <option value="parent" ${u.role==='parent'?'selected':''}>保護者</option>
        <option value="player" ${u.role==='player'?'selected':''}>選手</option>
        <option value="coach" ${u.role==='coach'?'selected':''}>コーチ</option>
        <option value="team" ${u.role==='team'?'selected':''}>チーム管理者</option>
      </select>
    </div>
    <div class="flex gap-8 mt-16">
      <button class="btn btn-primary flex-1" onclick="adminSaveUser('${u.id}')">💾 保存</button>
      <button class="btn btn-ghost flex-1" onclick="closeM()">キャンセル</button>
    </div>
  `);
}
function adminSaveUser(uid){
  const users=_getUsers();const u=users.find(x=>x.id===uid);if(!u)return;
  u.name=sanitize(document.getElementById('aeu-name')?.value||u.name,50);
  u.email=(document.getElementById('aeu-email')?.value||u.email).trim().toLowerCase();
  u.role=document.getElementById('aeu-role')?.value||u.role;
  _saveUsers(users);closeM();toast('ユーザー情報を更新しました','s');refreshPage();
}
function adminExportPlayersCSV(){
  let csv='\uFEFF名前,年齢,ポジション,チーム,保護者,月謝状態\n';
  DB.players.forEach(p=>{
    const team=DB.teams.find(t=>t.id===p.team);
    const guardian=p.guardianId?_getUsers().find(u=>u.id===p.guardianId):null;
    const pay=_dbArr('payments').find(x=>x.player===p.id&&x.month===curMonth());
    csv+=[p.name,p.age||'',p.pos||'',team?.name||'未所属',guardian?.name||'未紐付',pay?.status||'未生成'].join(',')+' \n';
  });
  const blob=new Blob([csv],{type:'text/csv'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='players_'+curMonth()+'.csv';a.click();
}

// ==================== ADMIN DATA MANAGEMENT ====================
// ============================================================
// ★ 新機能: データ分析・外部連携・ヘルプ
// ============================================================

// ── 選手成長グラフ（体重/記録推移）──
function openGrowthChart(playerId){
  const pid=playerId||DB.currentUser?.id;
  const player=DB.players.find(p=>p.id===pid);
  if(!player){toast('選手データがありません','e');return;}
  const bLog=DB.bodyLog?.[pid]||{};
  const tLog=DB.trainingLog?.[pid]||{};
  const cLog=DB.conditionLog?.[pid]||{};
  const dates=Object.keys({...bLog,...tLog,...cLog}).sort().slice(-90);
  if(dates.length<2){toast('グラフ表示には2日以上のデータが必要です','i');return;}
  const weights=dates.map(d=>bLog[d]?.weight||null);
  const bodyFats=dates.map(d=>bLog[d]?.bodyFat||null);
  const conds=dates.map(d=>cLog[d]?.mood||cLog[d]?.cond||null);
  const kcals=dates.map(d=>{const e=tLog[d];return e?.kcal||null;});
  const labels=dates.map(d=>d.slice(5).replace('-','/'));

  openM('📈 '+sanitize(player.name,12)+' 成長グラフ（最大90日）',`
    <div style="margin-bottom:12px;display:flex;gap:6px;flex-wrap:wrap">
      <button class="btn btn-xs" onclick="switchGrowthTabSimple('weight')" id="gt-weight" style="background:var(--org);color:#fff">体重</button>
      <button class="btn btn-xs btn-ghost" onclick="switchGrowthTabSimple('fat')" id="gt-fat">体脂肪率</button>
      <button class="btn btn-xs btn-ghost" onclick="switchGrowthTabSimple('cond')" id="gt-cond">コンディション</button>
      <button class="btn btn-xs btn-ghost" onclick="switchGrowthTabSimple('kcal')" id="gt-kcal">消費カロリー</button>
    </div>
    <div style="position:relative;height:280px;max-width:100%">
      <canvas id="growth-chart-canvas"></canvas>
    </div>
    <div style="margin-top:12px;padding:12px;background:var(--surf2);border-radius:10px;font-size:12px" id="growth-summary"></div>
  `);
  setTimeout(()=>{
    window._growthData={labels,weights,bodyFats,conds,kcals,dates};
    switchGrowthTab('weight');
  },100);
}

function switchGrowthTabSimple(tab){
  const g=window._growthData;if(!g)return;
  ['weight','fat','cond','kcal'].forEach(t=>{
    const el=document.getElementById('gt-'+t);
    if(el){el.style.background=t===tab?'var(--org)':'transparent';el.style.color=t===tab?'#fff':'var(--txt2)';}
  });
  const map={weight:{data:g.weights,label:'体重(kg)',color:'#f97316',unit:'kg'},fat:{data:g.bodyFats,label:'体脂肪率(%)',color:'#0ea5e9',unit:'%'},cond:{data:g.conds,label:'コンディション',color:'#16a34a',unit:''},kcal:{data:g.kcals,label:'消費カロリー(kcal)',color:'#a855f7',unit:'kcal'}};
  const c=map[tab];
  const valid=c.data.filter(v=>v!==null);
  const avg=valid.length?Math.round(valid.reduce((s,v)=>s+v,0)/valid.length*10)/10:0;
  const min=valid.length?Math.min(...valid):0;
  const max=valid.length?Math.max(...valid):0;
  const trend=valid.length>=2?(valid[valid.length-1]-valid[0]).toFixed(1):'--';
  document.getElementById('growth-summary').innerHTML=`<div style="display:flex;gap:16px;flex-wrap:wrap"><div><span style="color:var(--txt3)">平均:</span> <b>${avg}${c.unit}</b></div><div><span style="color:var(--txt3)">最小:</span> ${min}${c.unit}</div><div><span style="color:var(--txt3)">最大:</span> ${max}${c.unit}</div><div><span style="color:var(--txt3)">変化:</span> <b style="color:${parseFloat(trend)>0?'var(--red)':'var(--teal)'}">${trend>0?'+':''}${trend}${c.unit}</b></div></div>`;
  renderChart('growth-chart-canvas',{type:'line',data:{labels:g.labels,datasets:[{label:c.label,data:c.data,borderColor:c.color,backgroundColor:c.color+'20',fill:true,tension:.3,spanGaps:true,pointRadius:2}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:tab==='cond',grid:{color:'rgba(0,0,0,.05)'}},x:{ticks:{maxTicksToLimit:10,font:{size:10}}}}}});
}

// ── チーム全体の傾向分析 ──
function openTeamTrendAnalysis(){
  const team=getMyTeam();
  if(!team){toast('チーム情報がありません','e');return;}
  const players=DB.players.filter(p=>p.team===team.id);
  if(!players.length){toast('選手がいません','i');return;}
  const today=new Date();const dates=[];
  for(let i=29;i>=0;i--){const d=new Date(today);d.setDate(d.getDate()-i);dates.push(d.toISOString().slice(0,10));}
  const labels=dates.map(d=>d.slice(5).replace('-','/'));
  // 日別の平均コンディション
  const avgConds=dates.map(d=>{const vals=players.map(p=>(DB.conditionLog?.[p.id]?.[d]?.mood||DB.conditionLog?.[p.id]?.[d]?.cond||null)).filter(v=>v!==null);return vals.length?Math.round(vals.reduce((s,v)=>s+v,0)/vals.length*10)/10:null;});
  // 日別の練習参加率
  const participationRate=dates.map(d=>{const total=players.length;const trained=players.filter(p=>DB.trainingLog?.[p.id]?.[d]).length;return total?Math.round(trained/total*100):null;});
  // 選手別コンディション一覧
  const playerConds=players.map(p=>{const todayC=DB.conditionLog?.[p.id]?.[dates[dates.length-1]];const mood=todayC?.mood||todayC?.cond||0;return{name:p.name,mood,stress:todayC?.stressLevel||0,motivation:todayC?.motivation||0};}).sort((a,b)=>a.mood-b.mood);
  const lowCond=playerConds.filter(p=>p.mood>0&&p.mood<=2);
  const highStress=playerConds.filter(p=>p.stress>=7);

  openM('📊 チーム傾向分析（30日間）',`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
      <div style="padding:12px;background:var(--surf2);border-radius:10px;text-align:center">
        <div style="font-size:22px;font-weight:800;color:var(--org)">${players.length}</div>
        <div style="font-size:10px;color:var(--txt3)">登録選手</div>
      </div>
      <div style="padding:12px;background:var(--surf2);border-radius:10px;text-align:center">
        <div style="font-size:22px;font-weight:800;color:${avgConds.filter(v=>v).slice(-1)[0]>=3.5?'var(--teal)':'var(--red)'}">${avgConds.filter(v=>v).slice(-1)[0]||'--'}</div>
        <div style="font-size:10px;color:var(--txt3)">今日の平均コンディション</div>
      </div>
    </div>
    <div class="fw7 text-sm mb-6">📈 コンディション推移</div>
    <div style="height:200px;margin-bottom:14px"><canvas id="team-cond-chart"></canvas></div>
    <div class="fw7 text-sm mb-6">🏃 練習参加率</div>
    <div style="height:180px;margin-bottom:14px"><canvas id="team-part-chart"></canvas></div>
    ${lowCond.length?`<div style="padding:12px;background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.15);border-radius:10px;margin-bottom:10px"><div class="fw7 text-sm" style="color:var(--red);margin-bottom:6px">⚠️ コンディション低下（${lowCond.length}名）</div>${lowCond.map(p=>`<div style="font-size:12px;padding:3px 0">${sanitize(p.name,15)} — 気分 ${p.mood}/5${p.stress>=7?' ストレス高':''}${p.motivation<=3?' モチベ低':''}</div>`).join('')}</div>`:''}
    ${highStress.length?`<div style="padding:12px;background:rgba(245,158,11,.06);border:1px solid rgba(245,158,11,.15);border-radius:10px;margin-bottom:10px"><div class="fw7 text-sm" style="color:#f59e0b;margin-bottom:6px">⚠️ ストレス高（${highStress.length}名）</div>${highStress.map(p=>`<div style="font-size:12px;padding:3px 0">${sanitize(p.name,15)} — ストレス ${p.stress}/10</div>`).join('')}</div>`:''}
    <div class="fw7 text-sm mb-6 mt-12">👤 選手別コンディション</div>
    <div style="max-height:200px;overflow-y:auto">
    ${playerConds.map(p=>`<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--b1)"><span style="font-size:13px">${p.mood>=4?'😊':p.mood>=3?'😐':p.mood>=1?'😟':'⬜'}</span><span style="font-size:12px;flex:1">${sanitize(p.name,15)}</span><span style="font-size:11px;color:var(--txt3)">気分${p.mood} ストレス${p.stress} モチベ${p.motivation}</span></div>`).join('')}
    </div>
  `);
  setTimeout(()=>{
    renderChart('team-cond-chart',{type:'line',data:{labels,datasets:[{label:'平均コンディション',data:avgConds,borderColor:'#16a34a',backgroundColor:'rgba(22,163,106,.1)',fill:true,tension:.3,spanGaps:true,pointRadius:1}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{min:0,max:5,grid:{color:'rgba(0,0,0,.05)'}},x:{ticks:{maxTicksToLimit:8,font:{size:9}}}}}});
    renderChart('team-part-chart',{type:'bar',data:{labels,datasets:[{label:'参加率(%)',data:participationRate,backgroundColor:'rgba(14,165,233,.5)',borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{min:0,max:100,grid:{color:'rgba(0,0,0,.05)'}},x:{ticks:{maxTicksToLimit:8,font:{size:9}}}}}});
  },150);
}

// ── CSV一括インポート（選手リスト）──
function openCSVImportModal(){
  openM('📥 CSV一括インポート（選手）',`
    <div style="padding:12px;background:var(--surf2);border-radius:10px;margin-bottom:14px;font-size:12px;line-height:1.7;color:var(--txt2)">
      <div class="fw7 mb-4">CSVフォーマット</div>
      1行目: ヘッダー（名前,年齢,ポジション,保護者メール）<br>
      2行目以降: データ<br>
      <code style="display:block;background:var(--surf);padding:8px;border-radius:6px;margin-top:6px;font-size:11px">名前,年齢,ポジション,保護者メール
田中太郎,12,FW,tanaka@example.com
鈴木花子,11,MF,suzuki@example.com</code>
    </div>
    <div class="form-group">
      <label class="label">CSVファイルを選択</label>
      <input type="file" id="csv-file" accept=".csv,.tsv,.txt" class="input" onchange="previewCSVImport(this)">
    </div>
    <div id="csv-preview" style="display:none;max-height:200px;overflow:auto;margin-bottom:14px"></div>
    <div id="csv-actions" style="display:none">
      <button class="btn btn-primary w-full" onclick="executeCSVImport()">📥 インポート実行（<span id="csv-count">0</span>名）</button>
    </div>
  `);
}

function previewCSVImport(input){
  const file=input.files[0];
  if(!file)return;
  const reader=new FileReader();
  reader.onload=function(e){
    const text=e.target.result;
    const lines=text.split(/\r?\n/).filter(l=>l.trim());
    if(lines.length<2){toast('データが見つかりません','e');return;}
    const headers=lines[0].split(',').map(h=>h.trim());
    const rows=lines.slice(1).map(l=>{
      const cols=l.split(',').map(c=>c.trim());
      return{name:cols[0]||'',age:parseInt(cols[1])||0,pos:cols[2]||'',guardianEmail:cols[3]||''};
    }).filter(r=>r.name);
    window._csvImportData=rows;
    document.getElementById('csv-count').textContent=rows.length;
    document.getElementById('csv-preview').style.display='block';
    document.getElementById('csv-preview').innerHTML=`<table style="width:100%;font-size:11px;border-collapse:collapse"><tr style="background:var(--surf2)"><th style="padding:6px;text-align:left;border-bottom:1px solid var(--b1)">名前</th><th style="padding:6px;border-bottom:1px solid var(--b1)">年齢</th><th style="padding:6px;border-bottom:1px solid var(--b1)">ポジション</th><th style="padding:6px;border-bottom:1px solid var(--b1)">保護者メール</th></tr>${rows.map(r=>`<tr><td style="padding:5px;border-bottom:1px solid var(--b1)">${sanitize(r.name,20)}</td><td style="padding:5px;border-bottom:1px solid var(--b1)">${r.age||''}</td><td style="padding:5px;border-bottom:1px solid var(--b1)">${sanitize(r.pos,10)}</td><td style="padding:5px;border-bottom:1px solid var(--b1)">${sanitize(r.guardianEmail,25)}</td></tr>`).join('')}</table>`;
    document.getElementById('csv-actions').style.display='block';
  };
  reader.readAsText(file,'UTF-8');
}

function executeCSVImport(){
  const rows=window._csvImportData;
  if(!rows||!rows.length){toast('インポートデータがありません','e');return;}
  const team=getMyTeam();
  if(!team){toast('チーム情報が必要です','e');return;}
  let added=0,skipped=0;
  rows.forEach(r=>{
    const existing=DB.players.find(p=>p.name===r.name&&p.team===team.id);
    if(existing){skipped++;return;}
    const id=genId('pl');
    DB.players.push({id,name:sanitize(r.name,30),age:r.age||0,pos:sanitize(r.pos,20),team:team.id,userId:id,createdAt:new Date().toISOString()});
    // 保護者メール紐づけ
    if(r.guardianEmail){
      const gu=_getUsers().find(u=>u.email===r.guardianEmail);
      if(gu){DB.players[(DB.players||[]).length-1].guardianId=gu.id;}
    }
    added++;
  });
  saveDB();closeM();
  toast(`✅ ${added}名インポート完了${skipped?' ('+skipped+'名スキップ)':''}`, 's');
  addAuditLog('csv_import',`CSV一括インポート: ${added}名追加`,{teamId:team.id,added,skipped});
  refreshPage();
}

// ── プッシュ通知設定 ──
function openPushNotifSettings(){
  const perm = typeof Notification !== 'undefined' ? Notification.permission : 'unsupported';
  const enabled = DB.settings?.pushEnabled !== false;
  openM('🔔 プッシュ通知設定',`
    <div style="padding:14px;background:${perm==='granted'?'rgba(0,207,170,.06)':'rgba(249,115,22,.06)'};border:1px solid ${perm==='granted'?'rgba(0,207,170,.15)':'rgba(249,115,22,.15)'};border-radius:12px;margin-bottom:16px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        <div style="width:36px;height:36px;background:${perm==='granted'?'var(--teal)':'var(--org)'};border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px"><i class="fas fa-bell"></i></div>
        <div><div class="fw7">ブラウザプッシュ通知</div>
        <div style="font-size:11px;color:var(--txt3)">現在の状態: <b style="color:${perm==='granted'?'var(--teal)':'var(--org)'}">${perm==='granted'?'✅ 許可済み':perm==='denied'?'❌ ブロック中':'⚠️ 未設定'}</b></div></div>
      </div>
      ${perm!=='granted'?`<div style="font-size:12px;color:var(--txt2);line-height:1.7;margin-bottom:12px">ブラウザの通知を許可すると、月謝請求・マッチング成立・お知らせなどの重要な通知をリアルタイムで受け取れます。</div>
      <button class="btn btn-primary btn-sm w-full" onclick="requestPushPermission()">🔔 通知を許可する</button>`:'<div style="font-size:12px;color:var(--teal)">プッシュ通知は有効です。重要な通知がリアルタイムで届きます。</div>'}
      ${perm==='denied'?'<div style="font-size:11px;color:var(--red);margin-top:8px">ブラウザの設定から通知の許可を変更してください。</div>':''}
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;padding:14px;background:var(--surf2);border-radius:10px;margin-bottom:14px">
      <div><div class="fw7 text-sm">アプリ内通知</div><div style="font-size:11px;color:var(--txt3)">ベルアイコンでの通知表示</div></div>
      <label class="toggle-switch"><input type="checkbox" id="push-enabled" ${enabled?'checked':''} onchange="togglePushNotif(this.checked)"><span class="toggle-slider"></span></label>
    </div>
    <div style="font-size:12px;color:var(--txt3);line-height:1.7;padding:10px 12px;background:var(--surf2);border-radius:8px">
      <b>通知が届くタイミング:</b><br>
      📄 月謝・請求書の発行<br>
      🤝 マッチング申請・成立<br>
      📢 チームからのお知らせ<br>
      💬 メッセージ受信<br>
      📅 イベントリマインダー
    </div>
  `);
}
function requestPushPermission(){
  if(typeof Notification==='undefined'){toast('このブラウザはプッシュ通知に対応していません','e');return;}
  Notification.requestPermission().then(function(p){
    if(p==='granted'){
      toast('✅ プッシュ通知を許可しました','s');
      if(!DB.settings)DB.settings={};
      DB.settings.pushEnabled=true;
      saveDB();closeM();
    } else {
      toast('通知が許可されませんでした。ブラウザの設定から変更できます。','w');
    }
  });
}
function togglePushNotif(on){
  if(!DB.settings)DB.settings={};
  DB.settings.pushEnabled=on;
  saveDB();
  toast(on?'✅ アプリ内通知を有効にしました':'アプリ内通知を無効にしました','s');
}
function _sendPushNotification(title, body){
  // ブラウザプッシュ通知
  if(typeof Notification!=='undefined' && Notification.permission==='granted' && DB.settings?.pushEnabled!==false){
    try {
      new Notification(title, {body, icon:'/favicon.ico', badge:'/favicon.ico', tag:'mycoach-'+Date.now()});
    } catch(e){}
  }
  // Webhook連携
  _sendWebhook('notification', {title, body});
}

// ── Webhook連携（汎用: Slack/Discord/Zapier/IFTTT等に対応） ──
function openWebhookSettings(){
  const url = DB.settings?.webhookUrl || '';
  openM('🔗 Webhook連携',`
    <div style="padding:14px;background:var(--surf2);border-radius:12px;margin-bottom:16px;font-size:12px;color:var(--txt2);line-height:1.7">
      <div class="fw7" style="color:var(--txt1);margin-bottom:6px">Webhook連携とは</div>
      外部サービス（Slack・Discord・Zapier・IFTTT・Google Chat等）にHTTPリクエストを送信し、重要なイベントを自動通知できます。<br>
      各サービスのWebhook URLを設定するだけで連携できます。
    </div>
    <div class="form-group">
      <label class="label">Webhook URL</label>
      <input class="input" id="webhook-url" type="url" value="${sanitize(url,200)}" placeholder="https://hooks.slack.com/services/...">
      <div style="font-size:10px;color:var(--txt3);margin-top:4px">Slack, Discord, Zapier, Google Chat等のWebhook URLを入力</div>
    </div>
    <div class="form-group">
      <label class="label">通知対象（複数選択可）</label>
      <div style="display:flex;flex-wrap:wrap;gap:6px">
        ${['月謝・請求','マッチング','お知らせ','メッセージ','イベント'].map(function(t){
          var key = t.replace(/[・]/g,'_');
          var checked = (DB.settings?.webhookEvents||['月謝_請求','マッチング','お知らせ']).includes(key);
          return '<label style="display:flex;align-items:center;gap:4px;padding:6px 10px;background:var(--surf);border:1px solid var(--b1);border-radius:8px;font-size:12px;cursor:pointer"><input type="checkbox" class="wh-evt" value="'+key+'" '+(checked?'checked':'')+'>'+t+'</label>';
        }).join('')}
      </div>
    </div>
    <div style="display:flex;gap:8px;margin-top:14px">
      <button class="btn btn-primary flex-1" onclick="saveWebhookSettings()">💾 保存</button>
      ${url?'<button class="btn btn-ghost flex-1" onclick="testWebhook()">📤 テスト送信</button>':''}
    </div>
  `);
}
function saveWebhookSettings(){
  if(!DB.settings)DB.settings={};
  DB.settings.webhookUrl=(document.getElementById('webhook-url')?.value||'').trim();
  DB.settings.webhookEvents=Array.from(document.querySelectorAll('.wh-evt:checked')).map(function(c){return c.value;});
  saveDB();closeM();
  toast(DB.settings.webhookUrl?'✅ Webhook設定を保存しました':'Webhook設定をクリアしました','s');
}
function testWebhook(){
  _sendWebhook('test',{title:'テスト通知',body:'Webhook連携のテストです。'});
  toast('📤 テスト通知を送信しました','s');
}
function _sendWebhook(eventType, data){
  var url = DB.settings?.webhookUrl;
  if(!url) return;
  var events = DB.settings?.webhookEvents || [];
  var typeMap = {announcement:'お知らせ',notification:'月謝_請求',match:'マッチング',message:'メッセージ',event:'イベント',test:'test'};
  if(eventType!=='test' && !events.includes(typeMap[eventType]||eventType)) return;
  try {
    fetch(url, {
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({text:'[MyCOACH] '+(data.title||'')+': '+(data.body||''), event:eventType, ...data, timestamp:new Date().toISOString()})
    }).catch(function(e){console.warn('[Webhook] send failed:', e.message);});
  } catch(e){}
}

// ── レガシー互換: 旧LINE/Slack関数をスタブ化 ──
function sendLINENotify(msg){ _sendPushNotification('MyCOACH通知', msg); }
function _triggerLINE(type, msg){ _sendPushNotification('MyCOACH', msg); }
function sendSlackWebhook(msg){ _sendWebhook('notification', {title:'MyCOACH', body:msg}); }

// ── ヘルプセンター・FAQ ──
// ── 事務局への問い合わせ ──
function openInquiry(){
  // 全体連絡チャットルーム(g1)を開く
  if(DB.chats&&DB.chats['g1']){
    window.activeRoom='g1';
    goTo('chat');
  } else {
    toast('メッセージ画面から事務局にお問い合わせください','i');
    goTo('chat');
  }
}

function openHelpCenter(){
  const faqs=[
    {q:'アプリの使い方がわかりません',a:'初回ログイン後、画面上部の「？」ボタンからチュートリアルを開始できます。各画面のアイコンをタップすると機能の説明が表示されます。'},
    {q:'月謝の支払い方法は？',a:'保護者アカウントでログイン → 月謝・支払いページ → 「💳 今すぐ支払う」をタップ。クレジットカード（Stripe）で安全に決済できます。定期課金にも対応しています。'},
    {q:'コーチを探すには？',a:'チーム管理者アカウント → 「コーチ検索」→ 条件を設定して検索 → 気になるコーチに「依頼する」で申請を送ります。'},
    {q:'練習試合の相手を探すには？',a:'チーム管理者 → 「チームマッチング」→ 地域・レベルで検索 → 「対戦申請」を送ります。相手チームが承認するとチャットで日程調整できます。'},
    {q:'選手のデータが見られません',a:'コーチの場合、チームとのマッチング成立後にチームとのマッチング成立後に「選手情報の同意確認」が必要です。確認後に選手データにアクセスできます。'},
    {q:'通知が届きません',a:'設定ページ → プッシュ通知設定を開き、ブラウザの通知を許可してください。重要な通知がリアルタイムで届くようになります。'},
    {q:'データのバックアップは？',a:'設定ページ → データエクスポートで全データをJSONファイルとしてダウンロードできます。'},
    {q:'退会したい',a:'設定ページ → 「アカウントを削除」→ 確認後に全データが削除されます。GDPR対応のデータ完全削除も可能です。'},
    {q:'複数の子供がいる場合は？',a:'保護者アカウントで複数の選手と紐づけ可能です。ダッシュボードで切り替えて確認できます。'},
    {q:'オフラインでも使えますか？',a:'はい。PWA対応のため、オフラインでもデータ入力が可能です。ネット復帰時に自動同期されます。'},
  ];
  openM('❓ ヘルプセンター',`
    <div style="margin-bottom:14px">
      <input class="input" id="help-search" placeholder="🔍 質問を検索..." oninput="filterFAQ(this.value)" style="font-size:14px">
    </div>
    <div id="faq-list">
    ${faqs.map((f,i)=>`<div class="faq-item" data-idx="${i}" style="margin-bottom:8px">
      <button onclick="toggleFAQ(${i})" style="width:100%;text-align:left;padding:12px 14px;background:var(--surf2);border:1px solid var(--b1);border-radius:10px;cursor:pointer;font-size:13px;font-weight:600;color:var(--txt1);display:flex;justify-content:space-between;align-items:center">
        <span>${f.q}</span><span id="faq-arrow-${i}" style="transition:transform .2s">▸</span>
      </button>
      <div id="faq-body-${i}" style="display:none;padding:10px 14px;font-size:12px;color:var(--txt2);line-height:1.7;border-left:3px solid var(--org);margin:4px 0 0 10px">${f.a}</div>
    </div>`).join('')}
    </div>
    <div style="margin-top:16px;padding:14px;background:rgba(14,165,233,.06);border-radius:10px;text-align:center">
      <div style="font-size:13px;font-weight:700;margin-bottom:6px">解決しない場合</div>
      <button class="btn btn-primary btn-sm" onclick="closeM();openInquiry()">💬 事務局に問い合わせる</button>
    </div>
  `);
}
function toggleFAQ(idx){
  const body=document.getElementById('faq-body-'+idx);
  const arrow=document.getElementById('faq-arrow-'+idx);
  if(!body)return;
  const show=body.style.display==='none';
  body.style.display=show?'block':'none';
  if(arrow)arrow.style.transform=show?'rotate(90deg)':'';
}
function filterFAQ(query){
  const q=query.toLowerCase();
  document.querySelectorAll('.faq-item').forEach(el=>{
    const text=el.textContent.toLowerCase();
    el.style.display=text.includes(q)?'block':'none';
  });
}

// ── 初回チュートリアル ──
function startTutorial(){
  const role=DB.currentUser?.role||'player';
  const steps={
    admin:[
      {title:'ダッシュボード',desc:'全体の状況をリアルタイムで確認できます。KPI・お支払い状況・最近のアクティビティが一目でわかります。',icon:'📊'},
      {title:'コーチ管理',desc:'コーチの承認・編集・削除を行います。未承認コーチは検索に表示されません。',icon:'🏋️'},
      {title:'月謝管理',desc:'全チームの月謝・支払い状況を管理します。一括請求やCSVエクスポートが可能です。',icon:'💰'},
      {title:'チャット',desc:'全ユーザーとのメッセージを管理。問い合わせ対応やモデレーションも可能です。',icon:'💬'},
    ],
    team:[
      {title:'選手管理',desc:'「マイチーム」で選手の一覧・追加・編集ができます。CSV一括インポートも対応！',icon:'👥'},
      {title:'コーチ検索',desc:'種目・地域・料金でコーチを検索。気になるコーチに依頼を送れます。',icon:'🔍'},
      {title:'月謝管理',desc:'月謝の一括請求・入金確認・領収書PDF出力が可能です。',icon:'💰'},
      {title:'チームマッチング',desc:'他チームと練習試合を組めます。出欠管理(RSVP)も搭載。',icon:'⚽'},
    ],
    coach:[
      {title:'チーム検索',desc:'自分のスキルに合ったチームを検索して応募できます。',icon:'🔍'},
      {title:'担当選手',desc:'マッチング成立後、選手のデータ閲覧・メニュー配信ができます。',icon:'🏃'},
      {title:'お支払い',desc:'指導料の料金確定→請求書発行→入金確認の一連のフローを管理。',icon:'💰'},
      {title:'ビデオ通話',desc:'チャットルームから「📹」でGoogle Meetを即座に開始できます。',icon:'📹'},
    ],
    player:[
      {title:'トレーニング記録',desc:'毎日のトレーニングを記録。カスタムメニューも作成できます。',icon:'🏋️'},
      {title:'食事管理',desc:'写真撮影でAIが栄養を自動解析。水分摂取もトラッキング。',icon:'🍽️'},
      {title:'コンディション',desc:'気分・疲労・睡眠を記録。コーチ・保護者にリアルタイム共有。',icon:'💪'},
      {title:'デイリーミッション',desc:'毎日のミッションをクリアしてXPを獲得、レベルアップ！',icon:'🏆'},
    ],
    parent:[
      {title:'ダッシュボード',desc:'お子様のコンディション・練習状況をリアルタイムで確認できます。',icon:'📊'},
      {title:'月謝支払い',desc:'クレジットカードで安全に月謝を支払えます。定期課金も設定可能。',icon:'💳'},
      {title:'食事レポート',desc:'お子様の食事内容・栄養バランスを確認できます。',icon:'🥗'},
    ],
  };
  const s=steps[role]||steps.player;
  let step=0;
  function renderStep(){
    const c=s[step];
    openM('📖 使い方ガイド',`
      <div style="text-align:center;padding:20px 0">
        <div style="font-size:48px;margin-bottom:12px">${c.icon}</div>
        <div style="font-size:18px;font-weight:800;margin-bottom:8px">${c.title}</div>
        <div style="font-size:13px;color:var(--txt2);line-height:1.8;max-width:320px;margin:0 auto">${c.desc}</div>
        <div style="margin-top:20px;display:flex;justify-content:center;gap:6px">
          ${s.map((_,i)=>`<div style="width:${i===step?'20px':'8px'};height:8px;border-radius:4px;background:${i===step?'var(--org)':'var(--b2)'};transition:all .2s"></div>`).join('')}
        </div>
        <div style="margin-top:20px;display:flex;gap:10px;justify-content:center">
          ${step>0?`<button class="btn btn-ghost" onclick="window._tutStep=${step-1};window._tutRender()">← 前へ</button>`:''}
          ${step<s.length-1?`<button class="btn btn-primary" onclick="window._tutStep=${step+1};window._tutRender()">次へ →</button>`:`<button class="btn btn-primary" onclick="closeM();toast('チュートリアル完了！','s')">✅ 始める！</button>`}
        </div>
        <button onclick="closeM()" style="margin-top:12px;background:none;border:none;color:var(--txt3);font-size:11px;cursor:pointer">スキップ</button>
      </div>
    `);
  }
  window._tutStep=0;
  window._tutRender=function(){step=window._tutStep;renderStep();};
  renderStep();
}

// ============================================================
// ★ OBOG（卒業生）連携機能
// ============================================================

function _getMyAlumni(){
  return _dbArr('alumni').find(a=>a.userId===DB.currentUser?.id||a.id===DB.currentUser?.id);
}

function alumniDash(){
  const me=_getMyAlumni();
  const u=DB.currentUser;
  if(!me) return `<div class="pg-head"><div class="pg-title">OBOGダッシュボード</div></div><div class="card text-center" style="padding:48px"><div style="font-size:48px">🎓</div><div class="fw7 mt-16">OBOG情報がありません</div><div class="text-sm text-muted mt-8">チームの招待コードで登録してください</div></div>`;
  const team=DB.teams.find(t=>t.id===me.teamId);
  const anns=(DB.announcements||[]).slice(0,5);
  const alumniAll=_dbArr('alumni').filter(a=>a.teamId===me.teamId);
  const alumniCount=alumniAll.length;
  const canVisitCount=alumniAll.filter(a=>a.canVisit).length;
  const profileComplete=!!(me.currentJob&&me.company&&me.gradYear);
  const today=new Date().toISOString().slice(0,10);
  const upcomingEvents=DB.events.filter(e=>{
    if(e.teamId!==me.teamId&&e.scope!=='team')return false;
    const eDate=`${e.year||2026}-${String((e.month||0)+1).padStart(2,'0')}-${String(e.date||1).padStart(2,'0')}`;
    return eDate>=today;
  }).slice(0,3);
  const myChats=Object.entries(DB.chats||{}).filter(([k,c])=>c.type==='alumni'&&c.alumniId===me.id);
  const unreadCount=myChats.reduce((s,[k,c])=>(c.msgs||[]).filter(m=>!m.read&&m.from!==me.id).length+s,0);

  return `
  <div class="dash-greeting" style="background:linear-gradient(135deg,#475569 0%,#1e293b 100%)">
    <div><div class="dash-greeting-sub">ようこそ 🎓</div>
    <div class="dash-greeting-name">${sanitize(u?.name||me.name,20)}</div>
    <div class="dash-greeting-sub" style="margin-top:4px">${team?sanitize(team.name,20)+' OBOG':'OBOG'}</div></div>
  </div>
  
  ${!profileComplete?`<div style="padding:16px;background:linear-gradient(135deg,rgba(100,116,139,.06),rgba(14,165,233,.04));border:2px dashed #64748b;border-radius:14px;margin-bottom:14px">
    <div style="font-size:14px;font-weight:800;color:#475569;margin-bottom:6px">📝 プロフィールを完成させましょう</div>
    <div style="font-size:12px;color:var(--txt3);margin-bottom:10px;line-height:1.6">現在のお仕事やOB訪問の可否を登録すると、チームからの連絡がスムーズになります。</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">
      <span style="padding:3px 8px;border-radius:6px;font-size:10px;font-weight:600;background:${me.gradYear?'rgba(0,207,170,.08)':'rgba(239,68,68,.06)'};color:${me.gradYear?'var(--teal)':'#ef4444'}">${me.gradYear?'✓':'✗'} 卒業年度</span>
      <span style="padding:3px 8px;border-radius:6px;font-size:10px;font-weight:600;background:${me.currentJob?'rgba(0,207,170,.08)':'rgba(239,68,68,.06)'};color:${me.currentJob?'var(--teal)':'#ef4444'}">${me.currentJob?'✓':'✗'} 職業</span>
      <span style="padding:3px 8px;border-radius:6px;font-size:10px;font-weight:600;background:${me.company?'rgba(0,207,170,.08)':'rgba(239,68,68,.06)'};color:${me.company?'var(--teal)':'#ef4444'}">${me.company?'✓':'✗'} 会社名</span>
    </div>
    <button class="btn btn-primary btn-sm" onclick="goTo('alumni-profile')">⚡ プロフィールを入力する</button>
  </div>`:''}
  
  <div class="stat-row">
    <div class="stat-box"><div class="stat-n">${alumniCount}</div><div class="stat-l">🎓 OBOG人数</div></div>
    <div class="stat-box"><div class="stat-n">${canVisitCount}</div><div class="stat-l">🤝 訪問OK</div></div>
    <div class="stat-box"><div class="stat-n">${anns.length}</div><div class="stat-l">📢 お知らせ</div></div>
    <div class="stat-box"><div class="stat-n" style="color:${unreadCount?'var(--org)':'inherit'}">${unreadCount}</div><div class="stat-l">💬 未読</div></div>
  </div>
  
  ${unreadCount?`<div class="card mb-16" style="border-left:3px solid var(--org);cursor:pointer" onclick="goTo('chat')">
    <div style="display:flex;align-items:center;gap:10px">
      <span style="font-size:24px">💬</span>
      <div><div class="fw7 text-sm" style="color:var(--org)">${unreadCount}件の未読メッセージ</div>
      <div style="font-size:11px;color:var(--txt3)">チーム管理者からの連絡があります</div></div>
    </div>
  </div>`:''}
  
  ${upcomingEvents.length?`<div class="card mb-16">
    <div class="fw7 mb-12" style="font-size:14px">📅 今後のチーム予定</div>
    ${upcomingEvents.map(e=>{
      const eDate=(e.month||0)+1+'/'+e.date;
      const icons={practice:'🏃',match:'⚽',event:'🎉',meeting:'📋',other:'📌'};
      return `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--b1)">
        <div style="text-align:center;min-width:40px;padding:6px;background:var(--surf2);border-radius:8px"><div style="font-size:12px;font-weight:800">${eDate}</div><div style="font-size:9px;color:var(--txt3)">${e.time||''}</div></div>
        <div><div style="font-size:12px;font-weight:700">${icons[e.type]||'📌'} ${sanitize(e.title||'予定',25)}</div>
        ${e.place?`<div style="font-size:10px;color:var(--txt3)">📍 ${sanitize(e.place,20)}</div>`:''}</div>
      </div>`;
    }).join('')}
  </div>`:''}
  
  ${anns.length?`<div class="card mb-16"><div class="fw7 mb-12" style="font-size:14px">📢 最新のお知らせ</div>
  ${anns.slice(0,3).map(a=>`<div style="padding:10px 0;border-bottom:1px solid var(--b1)">
    <div class="fw7 text-sm">${sanitize(a.title,40)}</div>
    <div style="font-size:11px;color:var(--txt3);margin-top:2px">${a.date||''}</div>
    ${a.body?`<div style="font-size:12px;color:var(--txt2);margin-top:4px;line-height:1.6">${sanitize(a.body,100)}</div>`:''}
  </div>`).join('')}
  <button class="btn btn-ghost btn-sm w-full mt-8" onclick="goTo('alumni-news')">すべて見る →</button>
  </div>`:''}
  
  ${alumniAll.length>1?`<div class="card mb-16"><div class="fw7 mb-12" style="font-size:14px">🎓 同じチームのOBOG</div>
  ${alumniAll.filter(a=>a.id!==me.id).slice(0,5).map(a=>`<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--b1)">
    <div class="avi" style="background:#475569;width:34px;height:34px;font-size:13px">${(a.name||'?')[0]}</div>
    <div style="flex:1;min-width:0"><div class="fw7" style="font-size:12px">${sanitize(a.name,18)}</div>
    <div style="font-size:10px;color:var(--txt3)">${sanitize(a.currentJob||'',12)}${a.company?' / '+sanitize(a.company,12):''}</div></div>
    ${a.canVisit?'<span class="badge b-teal" style="font-size:8px">訪問OK</span>':''}
  </div>`).join('')}
  </div>`:''}
  
  <div class="card"><div class="fw7 mb-12" style="font-size:14px">⚡ クイックアクション</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
    <button class="btn btn-secondary btn-sm" onclick="goTo('alumni-profile')">📝 プロフィール</button>
    <button class="btn btn-secondary btn-sm" onclick="goTo('alumni-team')">🏟️ チーム情報</button>
    <button class="btn btn-secondary btn-sm" onclick="goTo('chat')">💬 メッセージ</button>
    <button class="btn btn-secondary btn-sm" onclick="goTo('alumni-news')">📢 お知らせ</button>
  </div></div>`;
}

function alumniTeamPage(){
  const me=_getMyAlumni();
  if(!me||!me.teamId) return `<div class="pg-head"><div class="pg-title">チーム情報</div></div><div class="card text-center" style="padding:40px"><div style="font-size:40px">🏟️</div><div class="fw7 mt-12">チームと連携されていません</div></div>`;
  const team=DB.teams.find(t=>t.id===me.teamId);
  if(!team) return `<div class="pg-head"><div class="pg-title">チーム情報</div></div><div class="card text-center" style="padding:40px">チームが見つかりません</div>`;
  const players=DB.players.filter(p=>p.team===team.id);
  const coach=DB.coaches.find(c=>c.id===team.coach);
  const alumniList=_dbArr('alumni').filter(a=>a.teamId===team.id);
  
  return `<div class="pg-head"><div class="pg-title">${sanitize(team.name,25)}</div><div class="pg-sub">チーム情報</div></div>
  <div class="card mb-16">
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px">
      <div class="avi" style="width:56px;height:56px;font-size:22px;background:${team.color||'var(--org)'}">${(team.name||'?')[0]}</div>
      <div><div class="fw7" style="font-size:16px">${sanitize(team.name,25)}</div>
      <div class="text-xs text-muted">${sanitize(team.sport||'',15)} / ${sanitize(team.area||'',15)}</div>
      <div class="text-xs text-muted mt-2">選手${players.length}名 / OBOG${alumniList.length}名</div></div>
    </div>
    ${team.pr?`<div style="font-size:12px;color:var(--txt2);line-height:1.7;padding:12px;background:var(--surf2);border-radius:10px">${sanitize(team.pr,200)}</div>`:''}
  </div>
  
  ${coach?`<div class="card mb-16"><div class="fw7 mb-8">🏋️ 指導者</div>
    <div style="display:flex;align-items:center;gap:10px">
      <div class="avi" style="background:${coach.color||'var(--blue)'}">${(coach.name||'?')[0]}</div>
      <div><div class="fw7 text-sm">${sanitize(coach.name,20)}</div><div class="text-xs text-muted">${sanitize(coach.sport||'',15)}</div></div>
    </div></div>`:''}
  
  <div class="card"><div class="fw7 mb-12">🎓 OBOG一覧（${alumniList.length}名）</div>
  ${alumniList.length?alumniList.map(a=>`<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--b1)">
    <div class="avi" style="background:#64748b;width:36px;height:36px;font-size:13px">${(a.name||'?')[0]}</div>
    <div style="flex:1;min-width:0"><div class="fw7 text-sm">${sanitize(a.name,20)}</div>
    <div style="font-size:11px;color:var(--txt3)">${a.gradYear?a.gradYear+'年卒':''}${a.company?' / '+sanitize(a.company,15):''}</div></div>
    ${a.canVisit?'<span class="badge b-teal" style="font-size:9px">OB訪問OK</span>':''}
  </div>`).join(''):'<div class="text-sm text-muted text-center" style="padding:20px">まだOBOGメンバーがいません</div>'}
  </div>`;
}

function alumniNewsPage(){
  const me=_getMyAlumni();
  const anns=(DB.announcements||[]).slice(0,20);
  return `<div class="pg-head"><div class="pg-title">📢 お知らせ</div></div>
  ${anns.length?anns.map(a=>`<div class="card mb-12">
    <div class="fw7" style="font-size:14px">${sanitize(a.title,50)}</div>
    <div style="font-size:11px;color:var(--txt3);margin:4px 0 8px">${a.date||''} / ${sanitize(a.author||'事務局',15)}</div>
    ${a.body?`<div style="font-size:12px;color:var(--txt2);line-height:1.7">${sanitize(a.body,500)}</div>`:''}
  </div>`).join(''):'<div class="card text-center" style="padding:40px"><div style="font-size:40px">📭</div><div class="fw7 mt-12">お知らせはまだありません</div></div>'}`;
}

function alumniProfilePage(){
  const me=_getMyAlumni();
  if(!me) return `<div class="pg-head"><div class="pg-title">OBOGプロフィール</div></div><div class="card text-center" style="padding:40px">OBOG情報がありません</div>`;
  const industries=['IT・テクノロジー','金融・保険','メーカー','商社','コンサル','教育','医療・福祉','公務員','メディア','スポーツ関連','飲食・サービス','不動産','その他'];
  return `<div class="pg-head flex justify-between items-center">
    <div><div class="pg-title">OBOGプロフィール</div><div class="pg-sub">キャリア情報・OB訪問設定</div></div>
    <button class="btn btn-primary btn-sm" onclick="saveAlumniProfile()">💾 保存</button>
  </div>
  <div class="card mb-16">
    <div class="fw7 mb-16" style="font-size:15px">👤 基本情報</div>
    <div class="frow-2">
      <div class="form-group"><label class="label">氏名</label><input class="input" id="ap-name" value="${sanitize(me.name||'',30)}"></div>
      <div class="form-group"><label class="label">卒業年度</label><input class="input" id="ap-grad" type="number" min="1970" max="2030" value="${me.gradYear||''}" placeholder="2020"></div>
    </div>
    <div class="form-group"><label class="label">メールアドレス</label><input class="input" id="ap-email" type="email" value="${sanitize(me.email||'',50)}"></div>
  </div>
  
  <div class="card mb-16">
    <div class="fw7 mb-16" style="font-size:15px">💼 キャリア情報</div>
    <div class="frow-2">
      <div class="form-group"><label class="label">現在の職業</label><input class="input" id="ap-job" value="${sanitize(me.currentJob||'',30)}" placeholder="エンジニア、営業、教員 等"></div>
      <div class="form-group"><label class="label">会社・組織名</label><input class="input" id="ap-company" value="${sanitize(me.company||'',30)}" placeholder="株式会社〇〇"></div>
    </div>
    <div class="form-group"><label class="label">業界</label>
      <select class="input" id="ap-industry">
        <option value="">選択してください</option>
        ${industries.map(i=>`<option value="${i}" ${me.industry===i?'selected':''}>${i}</option>`).join('')}
      </select>
    </div>
    <div class="form-group"><label class="label">後輩へのメッセージ（任意）</label>
      <textarea class="input" id="ap-msg" rows="3" maxlength="300" placeholder="現役時代の経験が今の仕事に活きています...">${sanitize(me.message||'',300)}</textarea>
    </div>
  </div>
  
  <div class="card">
    <div class="fw7 mb-16" style="font-size:15px">🤝 OB・OG訪問</div>
    <div style="display:flex;justify-content:space-between;align-items:center;padding:14px;background:var(--surf2);border-radius:10px;margin-bottom:14px">
      <div><div class="fw7 text-sm">OB/OG訪問を受け入れる</div>
      <div style="font-size:11px;color:var(--txt3);margin-top:2px">チームの後輩からの訪問・相談を受け付けます</div></div>
      <label class="toggle-switch"><input type="checkbox" id="ap-visit" ${me.canVisit?'checked':''}><span class="toggle-slider"></span></label>
    </div>
    <div class="form-group"><label class="label">相談可能なテーマ（複数選択可）</label>
    <div style="display:flex;flex-wrap:wrap;gap:6px" id="ap-topics">
      ${['キャリア相談','就職活動','業界の話','現役時代の経験','トレーニング','メンタル','進路相談','その他'].map(t=>`<label style="display:flex;align-items:center;gap:4px;padding:6px 10px;background:var(--surf2);border:1px solid var(--b1);border-radius:8px;font-size:12px;cursor:pointer"><input type="checkbox" class="ap-topic" value="${t}" ${(me.visitTopics||[]).includes(t)?'checked':''}> ${t}</label>`).join('')}
    </div></div>
  </div>`;
}

function saveAlumniProfile(){
  const me=_getMyAlumni();
  if(!me){toast('OBOG情報がありません','e');return;}
  me.name=sanitize(document.getElementById('ap-name')?.value||me.name,30);
  me.gradYear=parseInt(document.getElementById('ap-grad')?.value)||0;
  me.email=(document.getElementById('ap-email')?.value||'').trim();
  me.currentJob=sanitize(document.getElementById('ap-job')?.value||'',30);
  me.company=sanitize(document.getElementById('ap-company')?.value||'',30);
  me.industry=document.getElementById('ap-industry')?.value||'';
  me.message=sanitize(document.getElementById('ap-msg')?.value||'',300);
  me.canVisit=document.getElementById('ap-visit')?.checked||false;
  me.visitTopics=Array.from(document.querySelectorAll('.ap-topic:checked')).map(c=>c.value);
  me.updatedAt=new Date().toISOString();
  // currentUser名も同期
  if(DB.currentUser) DB.currentUser.name=me.name;
  saveDB();
  toast('✅ プロフィールを保存しました','s');
  addAuditLog('alumni_profile_update',me.name+'がOBOGプロフィールを更新');
}

// ── チーム管理者: OBOG管理ページ ──
function alumniMgmtPage(){
  const team=getMyTeam();
  if(!team) return `<div class="pg-head"><div class="pg-title">OBOG管理</div></div><div class="card text-center" style="padding:40px"><div style="font-size:40px">🎓</div><div class="fw7 mt-12">チーム情報がありません</div></div>`;
  const list=_dbArr('alumni').filter(a=>a.teamId===team.id);
  const canVisit=list.filter(a=>a.canVisit);
  
  // 招待URL
  const inviteUrl=location.origin+'?join='+team.code;
  
  return `<div class="pg-head flex justify-between items-center">
    <div><div class="pg-title">🎓 OBOG管理</div><div class="pg-sub">${list.length}名のOBOGが登録</div></div>
    <button class="btn btn-primary btn-sm" onclick="openAlumniInviteModal()">📧 OBOGを招待</button>
  </div>
  
  <div class="stat-row">
    <div class="stat-box"><div class="stat-n">${list.length}</div><div class="stat-l">🎓 登録OBOG</div></div>
    <div class="stat-box"><div class="stat-n">${canVisit.length}</div><div class="stat-l">🤝 OB訪問OK</div></div>
  </div>
  
  <!-- 招待セクション -->
  <div class="card mb-16" style="background:linear-gradient(135deg,rgba(100,116,139,.04),rgba(14,165,233,.02))">
    <div class="fw7 mb-8" style="font-size:14px">🎓 OBOGを招待する</div>
    <div style="font-size:12px;color:var(--txt3);margin-bottom:14px;line-height:1.7">卒業生に以下の<b>招待コード</b>を伝えてください。<br>新規登録時に「OBOG」→ コード入力でチームと自動連携されます。</div>
    
    <div style="text-align:center;padding:20px;background:var(--surf);border:2px dashed var(--b2);border-radius:14px;margin-bottom:14px">
      <div style="font-size:10px;color:var(--txt3);margin-bottom:6px;font-weight:600">招待コード</div>
      <div style="font-size:32px;font-weight:900;letter-spacing:6px;color:var(--txt1);font-family:Montserrat,monospace">${team.code}</div>
      <button class="btn btn-primary btn-sm mt-12" onclick="navigator.clipboard.writeText('${team.code}');toast('✅ 招待コード「${team.code}」をコピーしました','s')">📋 コードをコピー</button>
    </div>
    
    <div style="font-size:11px;color:var(--txt3);line-height:1.7;padding:10px 12px;background:var(--surf2);border-radius:8px">
      <b>📝 招待手順:</b><br>
      ① 卒業生に招待コード <b>${team.code}</b> を伝える（メール・SNS等）<br>
      ② 卒業生がアプリにアクセスし「新規登録」<br>
      ③ ロール選択で「🎓 OBOG」を選択<br>
      ④ 招待コードを入力 → チームと自動連携！
    </div>
  </div>
  
  <!-- OB訪問可能メンバー -->
  ${canVisit.length?`<div class="card mb-16">
    <div class="fw7 mb-12" style="font-size:14px">🤝 OB/OG訪問が可能なメンバー</div>
    ${canVisit.map(a=>`<div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--b1)">
      <div class="avi" style="background:#475569;width:44px;height:44px;font-size:16px">${(a.name||'?')[0]}</div>
      <div style="flex:1;min-width:0">
        <div class="fw7 text-sm">${sanitize(a.name,20)} <span style="font-size:10px;color:var(--txt3)">${a.gradYear?a.gradYear+'年卒':''}</span></div>
        <div style="font-size:11px;color:var(--txt2)">${sanitize(a.currentJob||'',15)}${a.company?' / '+sanitize(a.company,15):''}</div>
        <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px">${(a.visitTopics||[]).slice(0,3).map(t=>`<span style="font-size:9px;padding:2px 6px;background:rgba(0,207,170,.08);color:var(--teal);border-radius:6px">${t}</span>`).join('')}</div>
      </div>
      <button class="btn btn-primary btn-xs" onclick="openVisitRequestModal('${a.id}')">📧 依頼</button>
    </div>`).join('')}
  </div>`:''}
  
  <!-- 全OBOG一覧 -->
  <div class="card">
    <div class="fw7 mb-12" style="font-size:14px">👥 OBOG一覧（${list.length}名）</div>
    ${list.length?`<div style="max-height:400px;overflow-y:auto">
    ${list.map(a=>`<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--b1)">
      <div class="avi" style="background:#64748b;width:36px;height:36px;font-size:13px">${(a.name||'?')[0]}</div>
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:6px">
          <span class="fw7 text-sm">${sanitize(a.name,20)}</span>
          ${a.canVisit?'<span class="badge b-teal" style="font-size:8px">訪問OK</span>':''}
        </div>
        <div style="font-size:11px;color:var(--txt3)">${a.gradYear?a.gradYear+'年卒':'未登録'}${a.industry?' / '+a.industry:''}</div>
        <div style="font-size:11px;color:var(--txt2)">${a.currentJob?sanitize(a.currentJob,15):'職業未登録'}${a.company?' ('+sanitize(a.company,15)+')':''}</div>
      </div>
      <div style="display:flex;gap:4px">
        <button class="btn btn-ghost btn-xs" onclick="openAlumniDetailModal('${a.id}')">📋</button>
        <button class="btn btn-ghost btn-xs" style="color:var(--red)" onclick="removeAlumni('${a.id}')">&times;</button>
      </div>
    </div>`).join('')}
    </div>`:'<div class="text-muted text-sm text-center" style="padding:24px">まだOBOGが登録されていません。上の招待URLを共有してください。</div>'}
  </div>`;
}

function openAlumniInviteModal(){
  const team=getMyTeam();
  if(!team)return;
  const url=location.origin+'?join='+team.code;
  openM('🎓 OBOGを招待',`
    <div style="text-align:center;padding:16px 0">
      <div style="font-size:48px;margin-bottom:12px">🎓</div>
      <div class="fw7" style="font-size:16px;margin-bottom:6px">卒業生をチームに招待</div>
      <div style="font-size:12px;color:var(--txt3);margin-bottom:20px;line-height:1.7">卒業生に招待コードを伝えてください。<br>登録時に「OBOG」→ コード入力で自動連携されます。</div>
      
      <div style="padding:24px;background:var(--surf2);border:2px dashed var(--b2);border-radius:14px;margin-bottom:16px">
        <div style="font-size:10px;color:var(--txt3);font-weight:600;margin-bottom:8px">招待コード</div>
        <div style="font-size:36px;font-weight:900;letter-spacing:8px;color:var(--txt1);font-family:Montserrat,monospace">${team.code}</div>
      </div>
      
      <div style="display:flex;gap:8px;margin-bottom:16px">
        <button class="btn btn-primary flex-1" onclick="navigator.clipboard.writeText('${team.code}');toast('✅ コードをコピーしました','s')">📋 コードをコピー</button>
        <button class="btn btn-secondary flex-1" onclick="shareAlumniInvite()">📤 共有する</button>
      </div>
      
      <div style="padding:14px;background:var(--surf2);border-radius:10px;text-align:left;font-size:11px;color:var(--txt3);line-height:1.8">
        <div class="fw7" style="color:var(--txt2);margin-bottom:6px">📝 卒業生への案内テンプレート</div>
        <div id="alumni-invite-text" style="background:var(--surf);padding:10px;border-radius:8px;font-size:12px;line-height:1.7;white-space:pre-line">${team.name}のOBOG連携に参加しませんか？

①下記URLにアクセス
${url}
②「新規登録」→「🎓 OBOG」を選択
③招待コード: ${team.code} を入力
→チームと自動連携されます！</div>
        <button class="btn btn-ghost btn-xs w-full mt-8" onclick="navigator.clipboard.writeText(document.getElementById('alumni-invite-text').textContent);toast('✅ 案内文をコピーしました','s')">📋 案内文をまるごとコピー</button>
      </div>
    </div>
  `);
}

function shareAlumniInvite(){
  const team=getMyTeam();
  if(!team)return;
  const url=location.origin+'?join='+team.code;
  const text=`【${team.name} OBOG連携のご案内】\n\n下記URLからアカウント登録できます:\n${url}\n\n登録時に「🎓 OBOG」を選択し、\n招待コード: ${team.code}\nを入力してください。`;
  if(navigator.share){navigator.share({title:team.name+' OBOG招待',text,url});}
  else{navigator.clipboard.writeText(text);toast('✅ 招待文をコピーしました','s');}
}

function openVisitRequestModal(alumniId){
  const a=_dbArr('alumni').find(x=>x.id===alumniId);
  if(!a){toast('OBOGが見つかりません','e');return;}
  openM('🤝 OB/OG訪問を依頼',`
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;padding:14px;background:var(--surf2);border-radius:10px">
      <div class="avi" style="background:#475569;width:44px;height:44px;font-size:16px">${(a.name||'?')[0]}</div>
      <div><div class="fw7">${sanitize(a.name,20)}</div>
      <div style="font-size:11px;color:var(--txt3)">${sanitize(a.currentJob||'',15)} / ${sanitize(a.company||'',15)}</div></div>
    </div>
    ${(a.visitTopics||[]).length?`<div style="margin-bottom:14px"><div class="label">相談可能テーマ</div><div style="display:flex;flex-wrap:wrap;gap:4px">${a.visitTopics.map(t=>`<span style="font-size:10px;padding:3px 8px;background:rgba(0,207,170,.08);color:var(--teal);border-radius:6px">${t}</span>`).join('')}</div></div>`:''}
    <div class="form-group"><label class="label">依頼内容・メッセージ</label>
      <textarea class="input" id="vr-msg" rows="3" maxlength="300" placeholder="OB訪問のお願い、相談したい内容等..."></textarea>
    </div>
    <div class="form-group"><label class="label">希望日時（任意）</label>
      <input class="input" id="vr-date" type="date" min="${new Date().toISOString().slice(0,10)}">
    </div>
    <div class="flex gap-10 mt-8">
      <button class="btn btn-primary flex-1" onclick="sendVisitRequest('${a.id}')">📧 依頼を送る</button>
      <button class="btn btn-ghost flex-1" onclick="closeM()">キャンセル</button>
    </div>
  `);
}

function sendVisitRequest(alumniId){
  const a=_dbArr('alumni').find(x=>x.id===alumniId);
  if(!a)return;
  const msg=sanitize(document.getElementById('vr-msg')?.value||'OB/OG訪問をお願いしたいです',300);
  const date=document.getElementById('vr-date')?.value||'';
  const team=getMyTeam();
  
  // チャットルームにメッセージ送信
  const ck='alumni_'+alumniId;
  if(!DB.chats[ck]){
    DB.chats[ck]={name:a.name+'（OBOG）',sub:team?.name||'チーム',avi:'🎓',type:'alumni',alumniId,teamId:team?.id||'',msgs:[],unread:0};
  }
  DB.chats[ck].msgs.push({mid:_genMsgId(),from:DB.currentUser?.id,name:team?.name||'チーム',
    text:`🤝 OB/OG訪問のご依頼\n\n${msg}${date?'\n\n📅 希望日: '+date:''}`,
    time:now_time(),date:new Date().toISOString().slice(0,10),read:false});
  DB.chats[ck].unread=(DB.chats[ck].unread||0)+1;
  
  // OBOG本人に通知
  addNotif(`🤝 ${team?.name||'チーム'}からOB/OG訪問の依頼が届きました`,'fa-handshake','chat',alumniId);
  
  saveDB();closeM();
  toast('✅ OB/OG訪問の依頼を送りました','s');
  addAuditLog('visit_request',`${team?.name||'チーム'}→${a.name}にOB訪問依頼`,{alumniId,date});
}

function openAlumniDetailModal(alumniId){
  const a=_dbArr('alumni').find(x=>x.id===alumniId);
  if(!a)return;
  openM('🎓 '+sanitize(a.name,20)+' — OBOG詳細',`
    <div style="text-align:center;padding:12px 0;margin-bottom:16px">
      <div class="avi" style="background:#475569;width:64px;height:64px;font-size:24px;margin:0 auto">${(a.name||'?')[0]}</div>
      <div class="fw7 mt-8" style="font-size:16px">${sanitize(a.name,25)}</div>
      <div style="font-size:12px;color:var(--txt3)">${a.gradYear?a.gradYear+'年卒':''}</div>
    </div>
    <div style="display:grid;gap:10px">
      <div style="padding:12px;background:var(--surf2);border-radius:10px">
        <div style="font-size:10px;color:var(--txt3);margin-bottom:4px">💼 職業</div>
        <div style="font-size:13px;font-weight:700">${sanitize(a.currentJob||'未登録',25)}</div>
      </div>
      <div style="padding:12px;background:var(--surf2);border-radius:10px">
        <div style="font-size:10px;color:var(--txt3);margin-bottom:4px">🏢 会社・組織</div>
        <div style="font-size:13px;font-weight:700">${sanitize(a.company||'未登録',25)}</div>
      </div>
      <div style="padding:12px;background:var(--surf2);border-radius:10px">
        <div style="font-size:10px;color:var(--txt3);margin-bottom:4px">🏭 業界</div>
        <div style="font-size:13px;font-weight:700">${a.industry||'未登録'}</div>
      </div>
      ${a.message?`<div style="padding:12px;background:var(--surf2);border-radius:10px">
        <div style="font-size:10px;color:var(--txt3);margin-bottom:4px">💬 メッセージ</div>
        <div style="font-size:12px;line-height:1.6">${sanitize(a.message,300)}</div>
      </div>`:''}
      <div style="padding:12px;background:${a.canVisit?'rgba(0,207,170,.06)':'var(--surf2)'};border-radius:10px;border:1px solid ${a.canVisit?'rgba(0,207,170,.15)':'var(--b1)'}">
        <div style="font-size:13px;font-weight:700;color:${a.canVisit?'var(--teal)':'var(--txt3)'}">${a.canVisit?'✅ OB/OG訪問OK':'❌ OB/OG訪問 受付なし'}</div>
        ${a.canVisit&&(a.visitTopics||[]).length?`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px">${a.visitTopics.map(t=>`<span style="font-size:9px;padding:2px 6px;background:rgba(0,207,170,.08);color:var(--teal);border-radius:6px">${t}</span>`).join('')}</div>`:''}
      </div>
    </div>
    ${a.canVisit?`<button class="btn btn-primary w-full mt-16" onclick="closeM();openVisitRequestModal('${a.id}')">🤝 OB/OG訪問を依頼する</button>`:''}
  `);
}

function removeAlumni(id){
  if(!confirm('このOBOGをリストから削除しますか？'))return;
  DB.alumni=_dbArr('alumni').filter(a=>a.id!==id);
  saveDB();toast('OBOGを削除しました','s');refreshPage();
}

function adminDataMgmt(){
  if(DB.currentUser?.role!=='admin') return '<div class="card text-center" style="padding:40px">🔒 管理者のみ</div>';
  const tab=window._admDataTab||'adhoc';

  const tabs=[
    {k:'adhoc',l:'都度請求',icon:'📩',count:_dbArr('adhocInvoices').length},
    {k:'coachpay',l:'コーチ代',icon:'💰',count:_dbArr('coachPay').length},
    {k:'announce',l:'お知らせ',icon:'📢',count:(DB.announcements||[]).length},
    {k:'events',l:'イベント',icon:'📅',count:_dbArr('events').length+_dbArr('teamEvents').length},
    {k:'inventory',l:'在庫',icon:'📦',count:_dbArr('inventory').length},
    {k:'matches',l:'チーム間マッチ',icon:'⚽',count:_dbArr('teamMatches').length},
    {k:'reviews',l:'レビュー',icon:'⭐',count:_dbArr('teamReviews').length},
    {k:'disclosures',l:'情報開示',icon:'🔓',count:_dbArr('disclosures').length},
    {k:'notifs',l:'通知',icon:'🔔',count:_myNotifs().length},
    {k:'teamfiles',l:'共有資料',icon:'📂',count:_dbArr('teamFiles').length},
    {k:'logs',l:'監査ログ',icon:'📋',count:_dbArr('moderationLog').length+_dbArr('emailLog').length},
  ];

  let html=`<div class="pg-head"><div class="pg-title">データ管理</div><div class="pg-sub">全データの確認・編集・削除</div></div>
  <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px">
    ${tabs.map(t=>`<button class="btn ${tab===t.k?'btn-primary':'btn-ghost'} btn-sm" onclick="window._admDataTab='${t.k}';refreshPage()">${t.icon} ${t.l}<span style="font-size:10px;margin-left:4px;opacity:.7">${t.count}</span></button>`).join('')}
  </div>`;

  if(tab==='adhoc'){
    const invoices=_dbArr('adhocInvoices');
    html+=`<div class="card" style="padding:0;overflow:hidden">
      <div style="padding:14px 16px;border-bottom:1px solid var(--bdr);font-weight:700">📩 都度請求一覧 (${invoices.length}件)</div>
      ${invoices.length?`<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px">
        <thead><tr style="background:var(--surf2)"><th style="padding:8px 12px;text-align:left">タイトル</th><th style="padding:8px">金額</th><th style="padding:8px">対象</th><th style="padding:8px">状態</th><th style="padding:8px">操作</th></tr></thead><tbody>
        ${invoices.map(i=>{
          const pl=DB.players.find(p=>p.id===i.playerId);
          return '<tr style="border-bottom:1px solid var(--bdr)"><td style="padding:8px 12px">'+sanitize(i.title||'',20)+'</td><td style="padding:8px;text-align:center">¥'+fmtNum(i.amount||0)+'</td><td style="padding:8px">'+sanitize(pl?.name||'',15)+'</td><td style="padding:8px;text-align:center"><span class="badge '+(i.status==='paid'?'b-green':'b-org')+'" style="font-size:10px">'+(i.status==='paid'?'済':'未')+'</span></td><td style="padding:8px;text-align:center"><button class="btn btn-ghost btn-xs" style="color:var(--red)" onclick="adminDeleteRecord(\'adhocInvoices\',\''+i.id+'\')">🗑️</button>'+(i.status!=='paid'?'<button class="btn btn-ghost btn-xs" onclick="adminMarkPaidAdhoc(\''+i.id+'\')">✅</button>':'')+'</td></tr>';
        }).join('')}
        </tbody></table></div>`:'<div class="text-center text-muted" style="padding:40px">データなし</div>'}
    </div>`;
  }

  if(tab==='announce'){
    const anns=DB.announcements||[];
    html+=`<div class="card" style="padding:0;overflow:hidden">
      <div style="padding:14px 16px;border-bottom:1px solid var(--bdr);display:flex;justify-content:space-between;align-items:center">
        <span class="fw7">📢 お知らせ一覧 (${anns.length}件)</span>
        <button class="btn btn-primary btn-xs" onclick="adminNewAnnouncement()">+ 新規</button>
      </div>
      ${anns.length?anns.slice().reverse().map(a=>`<div style="padding:12px 16px;border-bottom:1px solid var(--bdr);font-size:13px">
        <div class="flex justify-between items-center mb-4"><span class="fw7">${sanitize(a.title||'お知らせ',30)}</span><span class="text-xs text-muted">${a.date||''}</span></div>
        <div class="text-sm text-muted mb-8" style="line-height:1.6">${sanitize(a.body||'',100)}</div>
        <button class="btn btn-ghost btn-xs" style="color:var(--red)" onclick="adminDeleteAnnounce('${a.id}')">🗑️ 削除</button>
      </div>`).join(''):'<div class="text-center text-muted" style="padding:40px">お知らせなし</div>'}
    </div>`;
  }

  if(tab==='matches'){
    const matches=_dbArr('teamMatches');
    html+=`<div class="card" style="padding:0;overflow:hidden">
      <div style="padding:14px 16px;border-bottom:1px solid var(--bdr);font-weight:700">⚽ チーム間マッチング (${matches.length}件)</div>
      ${matches.length?`<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px">
        <thead><tr style="background:var(--surf2)"><th style="padding:8px 12px;text-align:left">チームA</th><th style="padding:8px;text-align:left">チームB</th><th style="padding:8px">状態</th><th style="padding:8px">日程</th><th style="padding:8px">操作</th></tr></thead><tbody>
        ${matches.map(m=>{
          const tA=DB.teams.find(t=>t.id===m.teamA);
          const tB=DB.teams.find(t=>t.id===m.teamB);
          return '<tr style="border-bottom:1px solid var(--bdr)"><td style="padding:8px 12px">'+sanitize(tA?.name||'',15)+'</td><td style="padding:8px">'+sanitize(tB?.name||'',15)+'</td><td style="padding:8px;text-align:center"><span class="badge '+(m.status==='confirmed'?'b-green':m.status==='pending'?'b-yel':'b-gray')+'" style="font-size:10px">'+(m.status||'pending')+'</span></td><td style="padding:8px;text-align:center;font-size:11px">'+(m.date||'未定')+'</td><td style="padding:8px;text-align:center"><button class="btn btn-ghost btn-xs" style="color:var(--red)" onclick="adminDeleteRecord(\'teamMatches\',\''+m.id+'\')">🗑️</button></td></tr>';
        }).join('')}
        </tbody></table></div>`:'<div class="text-center text-muted" style="padding:40px">マッチングなし</div>'}
    </div>`;
  }

  if(tab==='reviews'){
    const reviews=_dbArr('teamReviews');
    html+=`<div class="card" style="padding:0;overflow:hidden">
      <div style="padding:14px 16px;border-bottom:1px solid var(--bdr);font-weight:700">⭐ レビュー一覧 (${reviews.length}件)</div>
      ${reviews.length?reviews.map(r=>{
        const from=DB.teams.find(t=>t.id===r.from);
        const to=DB.teams.find(t=>t.id===r.to);
        return '<div style="padding:12px 16px;border-bottom:1px solid var(--bdr);font-size:13px"><div class="flex justify-between"><span>'+sanitize(from?.name||'',12)+' → '+sanitize(to?.name||'',12)+'</span><span>'+'★'.repeat(r.rating||0)+'</span></div><div class="text-sm text-muted mt-4">'+sanitize(r.comment||'',80)+'</div><button class="btn btn-ghost btn-xs mt-4" style="color:var(--red)" onclick="adminDeleteRecord(\'teamReviews\',\''+r.id+'\')">🗑️</button></div>';
      }).join(''):'<div class="text-center text-muted" style="padding:40px">レビューなし</div>'}
    </div>`;
  }

  if(tab==='disclosures'){
    const discs=_dbArr('disclosures');
    html+=`<div class="card" style="padding:0;overflow:hidden">
      <div style="padding:14px 16px;border-bottom:1px solid var(--bdr);font-weight:700">🔓 情報開示一覧 (${discs.length}件)</div>
      ${discs.length?`<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px">
        <thead><tr style="background:var(--surf2)"><th style="padding:8px 12px;text-align:left">コーチ</th><th style="padding:8px;text-align:left">チーム</th><th style="padding:8px">同意日</th><th style="padding:8px">操作</th></tr></thead><tbody>
        ${discs.map(d=>{
          const coach=DB.coaches.find(c=>c.id===d.coachId);
          const team=DB.teams.find(t=>t.id===d.teamId);
          return '<tr style="border-bottom:1px solid var(--bdr)"><td style="padding:8px 12px">'+sanitize(coach?.name||'',15)+'</td><td style="padding:8px">'+sanitize(team?.name||'',15)+'</td><td style="padding:8px;text-align:center;font-size:11px">'+(d.agreedAt||'')+'</td><td style="padding:8px;text-align:center"><button class="btn btn-ghost btn-xs" style="color:var(--red)" onclick="adminDeleteRecord(\'disclosures\',\''+d.id+'\')">🗑️</button></td></tr>';
        }).join('')}
        </tbody></table></div>`:'<div class="text-center text-muted" style="padding:40px">開示データなし</div>'}
    </div>`;
  }


  if(tab==='coachpay'){
    const cpays=_dbArr('coachPay');
    const totalPaid=cpays.filter(function(p){return p.status==='paid';}).reduce(function(s,p){return s+(p.coachReceives||0);},0);
    const totalFee=cpays.filter(function(p){return p.status==='paid';}).reduce(function(s,p){return s+(p.platformTotal||0);},0);
    html+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><span class="fw7" style="font-size:14px">💰 コーチ代管理</span><button class="btn btn-primary btn-xs" onclick="adminAddCoachPay()">+ 手動追加</button></div>';
    html+='<div class="stat-row mb-16" style="grid-template-columns:repeat(3,1fr)"><div class="stat-box"><div class="stat-l">総件数</div><div class="stat-n">'+cpays.length+'</div></div><div class="stat-box"><div class="stat-l">コーチ受取合計</div><div class="stat-n">¥'+fmtNum(totalPaid)+'</div></div><div class="stat-box"><div class="stat-l">手数料合計</div><div class="stat-n" style="color:var(--org)">¥'+fmtNum(totalFee)+'</div></div></div>';
    html+='<div class="card" style="padding:0;overflow:hidden"><div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr style="background:var(--surf2)"><th style="padding:8px 12px;text-align:left">コーチ</th><th style="padding:8px">チーム</th><th style="padding:8px">月</th><th style="padding:8px">金額</th><th style="padding:8px">受取</th><th style="padding:8px">手数料</th><th style="padding:8px">状態</th><th style="padding:8px">操作</th></tr></thead><tbody>';
    cpays.slice().reverse().forEach(function(p){
      var coach=DB.coaches.find(function(c){return c.id===p.coach;});
      var team=DB.teams.find(function(t){return t.id===p.team||t.id===p.teamId;});
      html+='<tr style="border-bottom:1px solid var(--bdr)"><td style="padding:8px 12px">'+sanitize(coach?.name||p.coachName||'',15)+'</td><td style="padding:8px">'+sanitize(team?.name||'',15)+'</td><td style="padding:8px;text-align:center;font-size:11px">'+(p.month||'')+'</td><td style="padding:8px;text-align:right">¥'+fmtNum(p.amount||0)+'</td><td style="padding:8px;text-align:right;color:var(--grn)">¥'+fmtNum(p.coachReceives||0)+'</td><td style="padding:8px;text-align:right;color:var(--org)">¥'+fmtNum(p.platformTotal||0)+'</td><td style="padding:8px;text-align:center"><span class="badge '+(p.status==='paid'?'b-green':'b-yel')+'" style="font-size:10px">'+(p.status==='paid'?'済':'未')+'</span></td><td style="padding:8px;text-align:center"><button class="btn btn-ghost btn-xs" style="color:var(--red);font-size:10px" onclick="adminDeleteRecord(\'coachPay\',\''+p.id+'\')">🗑</button>'+(p.status!=='paid'?'<button class="btn btn-ghost btn-xs" style="color:var(--grn);font-size:10px" onclick="adminMarkCoachPaid(\''+p.id+'\')">✅</button>':'<button class="btn btn-ghost btn-xs" style="color:var(--yel);font-size:10px" onclick="adminRevertCoachPay(\''+p.id+'\')">↩</button>')+'</td></tr>';
    });
    html+='</tbody></table></div></div>';
  }

  if(tab==='events'){
    var allEvts=_dbArr('events');
    var tEvts=_dbArr('teamEvents');
    html+='<div class="stat-row mb-16" style="grid-template-columns:repeat(3,1fr)"><div class="stat-box"><div class="stat-l">練習・試合</div><div class="stat-n">'+allEvts.length+'</div></div><div class="stat-box"><div class="stat-l">チーム間イベント</div><div class="stat-n">'+tEvts.length+'</div></div><div class="stat-box"><div class="stat-l">合計</div><div class="stat-n">'+(allEvts.length+tEvts.length)+'</div></div></div>';
    html+='<div class="card" style="padding:0;overflow:hidden"><div style="padding:14px 16px;border-bottom:1px solid var(--bdr);font-weight:700">📅 イベント一覧</div>';
    if(allEvts.length){
      html+='<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr style="background:var(--surf2)"><th style="padding:8px 12px;text-align:left">タイトル</th><th style="padding:8px">種別</th><th style="padding:8px">日付</th><th style="padding:8px">時間</th><th style="padding:8px">操作</th></tr></thead><tbody>';
      allEvts.forEach(function(e){
        html+='<tr style="border-bottom:1px solid var(--bdr)"><td style="padding:8px 12px">'+sanitize(e.title||'',25)+'</td><td style="padding:8px;text-align:center"><span class="badge '+(e.type==='match'?'b-org':'b-blue')+'" style="font-size:10px">'+(e.type==='match'?'試合':'練習')+'</span></td><td style="padding:8px;text-align:center;font-size:11px">'+(e.year||'')+'-'+(e.month||'')+'-'+(e.date||'')+'</td><td style="padding:8px;text-align:center;font-size:11px">'+(e.time||'')+'</td><td style="padding:8px;text-align:center"><button class="btn btn-ghost btn-xs" style="color:var(--blue);font-size:10px" onclick="adminEditEvent(\''+e.id+'\')">✏️</button><button class="btn btn-ghost btn-xs" style="color:var(--red);font-size:10px" onclick="adminDeleteEvent(\''+e.id+'\')">🗑</button></td></tr>';
      });
      html+='</tbody></table></div>';
    } else { html+='<div class="text-center text-muted" style="padding:30px">イベントなし</div>'; }
    if(tEvts.length){
      html+='<div style="padding:14px 16px;border-bottom:1px solid var(--bdr);border-top:1px solid var(--bdr);font-weight:700;margin-top:0">⚽ チーム間イベント</div>';
      tEvts.forEach(function(te){
        var tA=DB.teams.find(function(t){return t.id===te.teamA;});
        var tB=DB.teams.find(function(t){return t.id===te.teamB;});
        html+='<div style="padding:10px 16px;border-bottom:1px solid var(--bdr);font-size:12px;display:flex;justify-content:space-between;align-items:center"><span>'+sanitize(tA?.name||'',12)+' vs '+sanitize(tB?.name||'',12)+' ('+(te.date||'未定')+')</span><span class="badge '+(te.status==='confirmed'?'b-green':'b-yel')+'" style="font-size:10px">'+(te.status||'pending')+'</span><button class="btn btn-ghost btn-xs" style="color:var(--red);font-size:10px" onclick="adminDeleteRecord(\'teamEvents\',\''+te.id+'\')">🗑</button></div>';
      });
    }
    html+='</div>';
  }

  if(tab==='inventory'){
    var allInv=_dbArr('inventory');
    var totalVal=allInv.reduce(function(s,i){return s+((i.price||0)*(i.qty||0));},0);
    html+='<div class="stat-row mb-16" style="grid-template-columns:repeat(3,1fr)"><div class="stat-box"><div class="stat-l">物品種類</div><div class="stat-n">'+allInv.length+'</div></div><div class="stat-box"><div class="stat-l">総在庫数</div><div class="stat-n">'+allInv.reduce(function(s,i){return s+(i.qty||0);},0)+'</div></div><div class="stat-box"><div class="stat-l">総在庫金額</div><div class="stat-n">¥'+fmtNum(totalVal)+'</div></div></div>';
    html+='<div class="card" style="padding:0;overflow:hidden"><div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr style="background:var(--surf2)"><th style="padding:8px 12px;text-align:left">品名</th><th style="padding:8px">カテゴリ</th><th style="padding:8px">数量</th><th style="padding:8px">単価</th><th style="padding:8px">小計</th><th style="padding:8px">操作</th></tr></thead><tbody>';
    if(allInv.length){
      allInv.forEach(function(i){
        html+='<tr style="border-bottom:1px solid var(--bdr)"><td style="padding:8px 12px">'+sanitize(i.name||'',20)+'</td><td style="padding:8px;text-align:center"><span class="badge b-gray" style="font-size:10px">'+sanitize(i.cat||'',10)+'</span></td><td style="padding:8px;text-align:center">'+(i.qty||0)+'</td><td style="padding:8px;text-align:right">¥'+fmtNum(i.price||0)+'</td><td style="padding:8px;text-align:right">¥'+fmtNum((i.price||0)*(i.qty||0))+'</td><td style="padding:8px;text-align:center"><button class="btn btn-ghost btn-xs" style="color:var(--red);font-size:10px" onclick="adminDeleteRecord(\'inventory\',\''+i.id+'\')">🗑</button></td></tr>';
      });
    } else { html+='<tr><td colspan="6" class="text-center text-muted" style="padding:30px">在庫データなし</td></tr>'; }
    html+='</tbody></table></div></div>';
  }

  if(tab==='notifs'){
    var allN=_dbArr('notifs').slice().reverse();
    html+='<div class="card mb-16" style="padding:0;overflow:hidden"><div style="padding:14px 16px;border-bottom:1px solid var(--bdr);display:flex;justify-content:space-between;align-items:center"><span class="fw7">🔔 通知一覧 ('+allN.length+'件)</span><button class="btn btn-ghost btn-xs" style="color:var(--red)" onclick="if(confirm(\'全通知を削除しますか？\')){DB.notifs=[];saveDB();toast(\'通知を全削除しました\',\'s\');refreshPage();}">🗑 全削除</button></div>';
    if(allN.length){
      allN.slice(0,50).forEach(function(n){
        html+='<div style="padding:8px 16px;border-bottom:1px solid var(--bdr);font-size:12px;display:flex;justify-content:space-between;align-items:center"><div><i class="fa '+(n.icon||'fa-bell')+'" style="margin-right:6px;color:var(--org);font-size:10px"></i>'+sanitize(n.text||'',50)+'</div><span class="text-muted" style="font-size:10px;white-space:nowrap">'+(n.date||'')+'</span></div>';
      });
      if(allN.length>50) html+='<div class="text-center text-muted" style="padding:8px;font-size:11px">他 '+(allN.length-50)+'件…</div>';
    } else { html+='<div class="text-center text-muted" style="padding:30px">通知なし</div>'; }
    html+='</div>';
    html+='<div class="card"><div class="fw7 mb-12">📣 一括通知送信</div><div class="form-group"><label class="label">通知テキスト</label><input id="adm-notif-text" class="input" placeholder="全ユーザーに送信する通知…"></div><button class="btn btn-primary btn-sm" onclick="adminBroadcastNotif()">📣 全員に送信</button></div>';
  }

    if(tab==='teamfiles'){
    var tFiles=_dbArr('teamFiles');
    html+='<div class="card" style="padding:0;overflow:hidden"><div style="padding:14px 16px;border-bottom:1px solid var(--bdr);font-weight:700">📂 チーム共有資料 ('+tFiles.length+'件)</div>';
    if(tFiles.length){
      html+='<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr style="background:var(--surf2)"><th style="padding:8px 12px;text-align:left">タイトル</th><th style="padding:8px">チーム</th><th style="padding:8px">種類</th><th style="padding:8px">カテゴリ</th><th style="padding:8px">日付</th><th style="padding:8px">操作</th></tr></thead><tbody>';
      tFiles.slice().reverse().forEach(function(f){
        var team=DB.teams.find(function(t){return t.id===f.teamId;});
        var typeLabel={video:'🎬',image:'🖼️',link:'🔗',note:'📄'}[f.type]||'📄';
        html+='<tr style="border-bottom:1px solid var(--bdr)"><td style="padding:8px 12px">'+sanitize(f.title||'',25)+'</td><td style="padding:8px">'+sanitize(team?.name||'',12)+'</td><td style="padding:8px;text-align:center">'+typeLabel+'</td><td style="padding:8px">'+sanitize(f.category||'',10)+'</td><td style="padding:8px;font-size:11px">'+(f.createdAt||'').slice(0,10)+'</td><td style="padding:8px;text-align:center"><button class="btn btn-ghost btn-xs" style="color:var(--red);font-size:10px" onclick="adminDeleteRecord(\'teamFiles\',\''+f.id+'\')">🗑</button></td></tr>';
      });
      html+='</tbody></table></div>';
    } else { html+='<div class="text-center text-muted" style="padding:30px">共有資料なし</div>'; }
    html+='</div>';
  }

    if(tab==='logs'){
    const modLogs=_dbArr('moderationLog').slice(-30).reverse();
    const emailLogs=_dbArr('emailLog').slice(-30).reverse();
    html+=`<div class="card mb-16" style="padding:0;overflow:hidden">
      <div style="padding:14px 16px;border-bottom:1px solid var(--bdr);font-weight:700">🛡️ モデレーションログ (直近30件)</div>
      ${modLogs.length?modLogs.map(l=>`<div style="padding:8px 16px;border-bottom:1px solid var(--bdr);font-size:12px;display:flex;justify-content:space-between">
        <span>${sanitize(l.action||'',30)} - ${sanitize(l.target||'',15)}</span>
        <span class="text-muted">${l.date||''}</span>
      </div>`).join(''):'<div class="text-center text-muted" style="padding:30px">ログなし</div>'}
    </div>
    <div class="card" style="padding:0;overflow:hidden">
      <div style="padding:14px 16px;border-bottom:1px solid var(--bdr);font-weight:700">📧 メール送信ログ (直近30件)</div>
      ${emailLogs.length?emailLogs.map(l=>`<div style="padding:8px 16px;border-bottom:1px solid var(--bdr);font-size:12px;display:flex;justify-content:space-between">
        <span>${sanitize(l.subject||'',30)} → ${sanitize(l.to||'',20)}</span>
        <span class="text-muted">${l.date||''}</span>
      </div>`).join(''):'<div class="text-center text-muted" style="padding:30px">ログなし</div>'}
    </div>
    <button class="btn btn-ghost btn-sm mt-16" style="color:var(--red)" onclick="if(confirm('全ログを削除しますか？')){DB.moderationLog=[];DB.emailLog=[];saveDB();toast('ログを削除しました','s');refreshPage()}">🗑️ ログ全削除</button>`;
  }

  return html;
}

function adminDeleteRecord(arrayKey, id){
  if(!confirm('このレコードを削除しますか？'))return;
  if(!DB[arrayKey]||!Array.isArray(DB[arrayKey]))return;
  DB[arrayKey]=DB[arrayKey].filter(x=>x.id!==id);
  addAuditLog('admin_delete','レコード削除: '+arrayKey+'/'+id,{arrayKey,id});
  saveDB();toast('削除しました','s');refreshPage();
}
function adminMarkPaidAdhoc(id){
  const inv=_dbArr('adhocInvoices').find(x=>x.id===id);
  if(inv){inv.status='paid';inv.paidAt=new Date().toLocaleDateString('ja-JP');addAuditLog('adhoc_paid','都度請求入金確認',{id});saveDB();toast('入金確認','s');refreshPage();}
}
// ── コーチ代ステータス変更 ──
function adminMarkCoachPaid(id){
  const cp=_dbArr('coachPay').find(x=>x.id===id);
  if(!cp)return;
  cp.status='paid';cp.paidAt=new Date().toISOString();
  addAuditLog('coachpay_paid','コーチ代入金確認: ¥'+(cp.amount||0).toLocaleString(),{id,coach:cp.coach});
  saveDB();toast('コーチ代の入金を確認しました','s');refreshPage();
}
function adminRevertCoachPay(id){
  const cp=_dbArr('coachPay').find(x=>x.id===id);
  if(!cp||cp.status!=='paid')return;
  if(!confirm('この入金確認を取り消しますか？'))return;
  cp.status='unpaid';delete cp.paidAt;
  addAuditLog('coachpay_revert','コーチ代入金取消',{id});
  saveDB();toast('入金確認を取り消しました','s');refreshPage();
}
// ── 月謝の手動追加 ──
function adminAddPayment(){
  const teams=DB.teams||[];
  const playersAll=DB.players||[];
  openM('📝 月謝レコード追加',`
    <div class="form-group"><label class="label">チーム</label><select id="ap-team" class="input" onchange="adminPayTeamChange()">
      <option value="">選択…</option>${teams.map(t=>'<option value="'+t.id+'">'+sanitize(t.name||'',20)+'</option>').join('')}
    </select></div>
    <div class="form-group"><label class="label">選手</label><select id="ap-player" class="input"><option value="">先にチームを選択</option></select></div>
    <div class="form-group"><label class="label">月 (YYYY-MM)</label><input id="ap-month" class="input" type="month" value="${new Date().toISOString().slice(0,7)}"></div>
    <div class="form-group"><label class="label">金額 (円)</label><input id="ap-amount" class="input" type="number" placeholder="5000"></div>
    <div class="form-group"><label class="label">ステータス</label><select id="ap-status" class="input"><option value="unpaid">未払い</option><option value="paid">支払い済み</option></select></div>
    <button class="btn btn-primary w-full mt-12" onclick="adminSavePayment()">保存</button>
  `);
}
function adminPayTeamChange(){
  const tid=document.getElementById('ap-team')?.value;
  const players=(DB.players||[]).filter(p=>p.team===tid);
  const sel=document.getElementById('ap-player');
  if(sel) sel.innerHTML=players.length
    ? players.map(p=>'<option value="'+p.id+'">'+sanitize(p.name||'',20)+'</option>').join('')
    : '<option value="">選手なし</option>';
}
function adminSavePayment(){
  const tid=document.getElementById('ap-team')?.value;
  const pid=document.getElementById('ap-player')?.value;
  const month=document.getElementById('ap-month')?.value;
  const amount=parseInt(document.getElementById('ap-amount')?.value);
  const status=document.getElementById('ap-status')?.value||'unpaid';
  if(!tid||!pid){toast('チームと選手を選択してください','e');return;}
  if(!amount||amount<0){toast('金額を入力してください','e');return;}
  const fee=getFeeAmount(amount,tid,'monthlyFee');
  const pay={id:genId('pay'),team:tid,player:pid,month:month||'',amount,fee,status,method:'manual',createdAt:new Date().toISOString()};
  if(status==='paid')pay.paidAt=new Date().toISOString();
  if(!DB.payments)DB.payments=[];
  DB.payments.push(pay);
  addAuditLog('payment_add','月謝手動追加: ¥'+amount.toLocaleString(),{payId:pay.id,player:pid,team:tid});
  saveDB();closeM();toast('月謝レコードを追加しました','s');refreshPage();
}
// ── コーチ代の手動追加 ──
function adminAddCoachPay(){
  const coaches=DB.coaches||[];
  const teams=DB.teams||[];
  openM('💰 コーチ代レコード追加',`
    <div class="form-group"><label class="label">コーチ</label><select id="acp-coach" class="input">
      <option value="">選択…</option>${coaches.map(c=>'<option value="'+c.id+'">'+sanitize(c.name||'',20)+'</option>').join('')}
    </select></div>
    <div class="form-group"><label class="label">チーム</label><select id="acp-team" class="input">
      <option value="">選択…</option>${teams.map(t=>'<option value="'+t.id+'">'+sanitize(t.name||'',20)+'</option>').join('')}
    </select></div>
    <div class="form-group"><label class="label">月 (YYYY-MM)</label><input id="acp-month" class="input" type="month" value="${new Date().toISOString().slice(0,7)}"></div>
    <div class="form-group"><label class="label">金額 (円)</label><input id="acp-amount" class="input" type="number" placeholder="30000"></div>
    <div class="form-group"><label class="label">ステータス</label><select id="acp-status" class="input"><option value="unpaid">未払い</option><option value="paid">支払い済み</option></select></div>
    <button class="btn btn-primary w-full mt-12" onclick="adminSaveCoachPay()">保存</button>
  `);
}
function adminSaveCoachPay(){
  const coachId=document.getElementById('acp-coach')?.value;
  const teamId=document.getElementById('acp-team')?.value;
  const month=document.getElementById('acp-month')?.value;
  const amount=parseInt(document.getElementById('acp-amount')?.value);
  const status=document.getElementById('acp-status')?.value||'unpaid';
  if(!coachId||!teamId){toast('コーチとチームを選択してください','e');return;}
  if(!amount||amount<0){toast('金額を入力してください','e');return;}
  const feeRate=getFeeRate(teamId,'coachFee');
  const platformTotal=Math.round(amount*feeRate/100);
  const coachReceives=amount-platformTotal;
  const coach=DB.coaches.find(c=>c.id===coachId);
  const cp={id:genId('cpay'),coach:coachId,coachName:coach?.name||'',team:teamId,teamId,month:month||'',amount,coachReceives,platformTotal,feeRate,status,method:'manual',createdAt:new Date().toISOString()};
  if(status==='paid')cp.paidAt=new Date().toISOString();
  if(!DB.coachPay)DB.coachPay=[];
  DB.coachPay.push(cp);
  addAuditLog('coachpay_add','コーチ代手動追加: ¥'+amount.toLocaleString(),{cpId:cp.id,coach:coachId,team:teamId});
  saveDB();closeM();toast('コーチ代レコードを追加しました','s');refreshPage();
}
// ── イベント編集 ──
function adminEditEvent(eid){
  const ev=_dbArr('events').find(e=>e.id===eid);
  if(!ev)return;
  openM('📅 イベント編集',`
    <div class="form-group"><label class="label">タイトル</label><input id="aev-title" class="input" value="${sanitize(ev.title||'',40)}"></div>
    <div class="form-group"><label class="label">種別</label><select id="aev-type" class="input"><option value="practice" ${ev.type==='practice'?'selected':''}>練習</option><option value="match" ${ev.type==='match'?'selected':''}>試合</option></select></div>
    <div class="form-group"><label class="label">日付</label><input id="aev-date" class="input" type="date" value="${ev.year?ev.year+'-'+String(ev.month).padStart(2,'0')+'-'+String(ev.date).padStart(2,'0'):''}"></div>
    <div class="form-group"><label class="label">時間</label><input id="aev-time" class="input" type="time" value="${ev.time||''}"></div>
    <div class="form-group"><label class="label">場所</label><input id="aev-place" class="input" value="${sanitize(ev.place||'',40)}"></div>
    <div class="form-group"><label class="label">メモ</label><textarea id="aev-memo" class="input" rows="2">${sanitize(ev.memo||'',200)}</textarea></div>
    <button class="btn btn-primary w-full mt-12" onclick="adminSaveEvent('${eid}')">保存</button>
  `);
}
function adminSaveEvent(eid){
  const ev=_dbArr('events').find(e=>e.id===eid);
  if(!ev)return;
  ev.title=sanitize(document.getElementById('aev-title')?.value||'',40);
  ev.type=document.getElementById('aev-type')?.value||'practice';
  const d=document.getElementById('aev-date')?.value;
  if(d){const parts=d.split('-');ev.year=parseInt(parts[0]);ev.month=parseInt(parts[1]);ev.date=parseInt(parts[2]);}
  ev.time=document.getElementById('aev-time')?.value||'';
  ev.place=sanitize(document.getElementById('aev-place')?.value||'',40);
  ev.memo=sanitize(document.getElementById('aev-memo')?.value||'',200);
  addAuditLog('event_edit','イベント編集: '+ev.title,{eventId:eid});
  saveDB();closeM();toast('イベントを更新しました','s');refreshPage();
}
function adminNewAnnouncement(){
  openM('📢 新規お知らせ',`
    <div class="form-group"><label class="label">タイトル</label><input id="ann-title" class="input" placeholder="お知らせタイトル"></div>
    <div class="form-group"><label class="label">本文</label><textarea id="ann-body" class="input" rows="4" placeholder="お知らせ内容…"></textarea></div>
    <button class="btn btn-primary w-full mt-12" onclick="adminPostAnnouncement()">📢 投稿する</button>
  `);
}
function adminPostAnnouncement(){
  const title=sanitize(document.getElementById('ann-title')?.value||'',50);
  const body=sanitize(document.getElementById('ann-body')?.value||'',500);
  if(!title){toast('タイトルを入力してください','e');return;}
  if(!DB.announcements)DB.announcements=[];
  DB.announcements.push({id:genId('ann'),title,body,date:new Date().toLocaleDateString('ja-JP'),author:DB.currentUser?.name||'事務局'});
  // 全ユーザーに通知
  const users = _getUsers();
  users.forEach(u => {
    if(u.id !== DB.currentUser?.id){
      addNotif(`📢 お知らせ: ${title}`, 'fa-bullhorn', 'dashboard', u.id);
    }
  });
  saveDB();closeM();toast('お知らせを投稿しました','s');
  _sendPushNotification('📢 お知らせ', title);
  _sendWebhook('announcement', {title, body: sanitize(body,100)});
  refreshPage();
}
function adminDeleteAnnounce(id){
  if(!confirm('このお知らせを削除しますか？'))return;
  DB.announcements=(DB.announcements||[]).filter(a=>a.id!==id);
  saveDB();toast('削除しました','s');refreshPage();
}

// ==================== ADMIN DASHBOARD ====================
function adminDash(){
  const adhocFeeTotal=(!DB.adhocInvoices?[]:DB.adhocInvoices).filter(i=>i.status==='paid').reduce((s,i)=>s+(i.fee||0),0);
  const tf=_dbArr('payments').filter(p=>p.status==='paid').reduce((s,p)=>s+(p.fee||getFeeAmount(p.amount,p.team||p.teamId||'','monthlyFee')),0)
    +_dbArr('coachPay').filter(p=>p.status==='paid').reduce((s,p)=>s+(p.platformTotal||getFeeAmount(p.amount,p.teamId||'','coachFee')),0)
    +adhocFeeTotal;
  const unp=_dbArr('payments').filter(p=>p.status==='unpaid').length;
  const pendCoaches=DB.coaches.filter(c=>!c.verified).length;
  const thisM=curMonth();
  const thisMonthFee=_dbArr('payments').filter(p=>p.status==='paid'&&(p.paidAt||'').slice(0,7)===thisM.replace('-','/')).reduce((s,p)=>s+(p.fee||getFeeAmount(p.amount,p.team||p.teamId||'','monthlyFee')),0);
  const totalUsers=(DB.coaches||[]).length+(DB.teams||[]).length+(DB.players||[]).length;
  const parentCount=_getUsers().filter(u=>u.role==='parent').length;
  const totalAllUsers=totalUsers+parentCount;
  const matchedCount=_dbArr('requests').filter(r=>r.status==='matched').length;
  const pendReqs=_dbArr('requests').filter(r=>r.status==='pending').length;
  const verifiedCoaches=DB.coaches.filter(c=>c.verified).length;
  const totalMonthlyRevenue=_dbArr('payments').filter(p=>p.status==='paid').reduce((s,p)=>s+(p.amount||0),0);
  const coachPayTotal=_dbArr('coachPay').filter(p=>p.status==='paid').reduce((s,p)=>s+(p.amount||0),0);
  const matchRate=_dbArr('requests').length?(matchedCount/_dbArr('requests').length*100).toFixed(0):0;
  const avgCoachPrice=(DB.coaches||[]).length?Math.round(DB.coaches.reduce((s,c)=>s+(c.price||0),0)/(DB.coaches||[]).length):0;
  const coachApprovalRate=(DB.coaches||[]).length?Math.round(verifiedCoaches/(DB.coaches||[]).length*100):0;
  const payCollectionRate=(DB.payments||[]).length?Math.round(_dbArr('payments').filter(p=>p.status==='paid').length/(DB.payments||[]).length*100):0;
  const coachPayRate=(DB.coachPay||[]).length?Math.round(_dbArr('coachPay').filter(p=>p.status==='paid').length/(DB.coachPay||[]).length*100):0;

  // 前月比較
  const prevM=(()=>{const d=new Date();d.setMonth(d.getMonth()-1);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');})();
  const prevMonthFee=_dbArr('payments').filter(p=>p.status==='paid'&&(p.paidAt||'').slice(0,7)===prevM.replace('-','/')).reduce((s,p)=>s+(p.fee||getFeeAmount(p.amount,p.team||p.teamId||'','monthlyFee')),0);
  const feeGrowth=prevMonthFee>0?Math.round((thisMonthFee-prevMonthFee)/prevMonthFee*100):0;

  // アラート
  const alerts=[];
  if(pendCoaches>=1) alerts.push({cls:'dash-alert-warn',icon:'fa-clock',msg:`${pendCoaches}件のコーチ承認が保留中`,btn:'確認する',action:`onclick="goTo('coaches')"`});
  if(unp>=2) alerts.push({cls:'dash-alert-error',icon:'fa-exclamation-circle',msg:`${unp}件の月謝が未払い`,btn:'確認する',action:`onclick="goTo('payments')"`});
  if(pendReqs>0) alerts.push({cls:'dash-alert-info',icon:'fa-handshake',msg:`${pendReqs}件のマッチング申請あり`,btn:'対応する',action:`onclick="goTo('coaches')"`});
  const noCoachTeams=DB.teams.filter(t=>!t.coach).length;
  if(noCoachTeams>0) alerts.push({cls:'dash-alert-info',icon:'fa-user-slash',msg:`${noCoachTeams}チームがコーチ未配置`,btn:'確認',action:`onclick="goTo('teams')"`});
  if(DB._emailNotVerified) alerts.push({cls:'dash-alert-warn',icon:'fa-envelope',msg:'メールアドレスが未確認です。受信箱の確認メールをクリックしてください。',btn:'再送信',action:`onclick="resendVerificationEmail()"`});

  // 直近アクティビティ（タイムライン形式）
  const activities=[];
  _dbArr('requests').forEach(r=>{activities.push({date:r.createdAt||'',icon:'🤝',text:(r.teamName||'?')+'→'+(r.coachName||'?'),type:r.status,cat:'match',color:'#a855f7'});});
  _dbArr('coachPay').filter(p=>p.status==='paid').forEach(p=>{activities.push({date:p.paidAt||'',icon:'💰',text:(p.coachName||'コーチ')+'へ ¥'+(p.amount||0).toLocaleString(),type:'paid',cat:'pay',color:'var(--teal)'});});
  _dbArr('payments').filter(p=>p.status==='paid').slice(-5).forEach(p=>{const pl=DB.players.find(x=>x.id===p.player);activities.push({date:p.paidAt||'',icon:'💴',text:(pl?.name||'選手')+'月謝 ¥'+(p.amount||0).toLocaleString(),type:'paid',cat:'fee',color:'var(--org)'});});
  DB.coaches.filter(c=>!c.verified).forEach(c=>{activities.push({date:c.createdAt||'',icon:'🏅',text:sanitize(c.name,10)+'（新規申請）',type:'pending',cat:'coach',color:'var(--yel)'});});
  activities.sort((a,b)=>(b.date||'')>(a.date||'')?1:-1);

  // タブ状態
  const tab=window._adminDashTab||'overview';

  // ── SVGリングヘルパー ──
  function svgRing(pct,color,size){
    size=size||64;const r=size/2-5;const circ=2*Math.PI*r;const off=circ*(1-Math.min(pct,100)/100);
    return`<div class="admin-stat-ring" style="width:${size}px;height:${size}px"><svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="var(--b1)" stroke-width="4"/><circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${off}" style="transition:stroke-dashoffset .8s ease"/></svg><div class="admin-stat-ring-val" style="color:${color}">${pct}%</div></div>`;
  }

  return`
  <!-- ヘッダー -->
  <div class="dash-greeting" style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 50%,#0f2847 100%)">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">
      <div>
        <div class="dash-greeting-sub" style="display:flex;align-items:center;gap:6px"><i class="fa fa-shield-alt" style="font-size:10px"></i> 管理コンソール v3.2</div>
        <div class="dash-greeting-name">MyCOACH-MyTEAM 事務局</div>
        <div class="dash-greeting-sub" style="margin-top:4px">${new Date().toLocaleDateString('ja-JP',{year:'numeric',month:'long',day:'numeric',weekday:'short'})} · <span style="color:rgba(0,207,170,.8)">全${totalAllUsers}名稼働中</span></div>
      </div>
      <div class="dash-greeting-actions" style="display:flex;gap:6px;flex-wrap:wrap">
        <button class="btn btn-sm" onclick="openAdminMsgMonitor()"><i class="fa fa-shield-alt" style="margin-right:4px"></i>監視</button>
        <button class="btn btn-sm" onclick="openAdminUserMgmt()"><i class="fa fa-users" style="margin-right:4px"></i>ユーザー</button>
        <div class="relative">
          <button class="btn btn-sm" onclick="toggleAdminExportMenu()" id="admin-export-btn"><i class="fa fa-download" style="margin-right:4px"></i>エクスポート ▾</button>
          <div class="admin-export-menu" id="admin-export-menu">
            <div class="admin-export-item" onclick="exportAdminReport();toggleAdminExportMenu()"><i class="fa fa-file-csv"></i> 全データCSV</div>
            <div class="admin-export-item" onclick="exportAdminCoachCSV();toggleAdminExportMenu()"><i class="fa fa-user-tie"></i> コーチ一覧CSV</div>
            <div class="admin-export-item" onclick="exportAdminTeamCSV();toggleAdminExportMenu()"><i class="fa fa-users"></i> チーム一覧CSV</div>
            <div class="admin-export-item" onclick="exportAdminPayCSV();toggleAdminExportMenu()"><i class="fa fa-yen-sign"></i> 支払いデータCSV</div>
            <div class="admin-export-item" onclick="exportAdminMatchCSV();toggleAdminExportMenu()"><i class="fa fa-handshake"></i> マッチング履歴CSV</div>
            <div class="admin-export-item" onclick="exportAdminSummaryPDF();toggleAdminExportMenu()"><i class="fa fa-file-pdf" style="color:var(--red)"></i> サマリーPDF</div>
            <div style="border-top:1px solid var(--b1);margin:4px 0"></div>
            <div class="admin-export-item" onclick="adminFullBackup();toggleAdminExportMenu()"><i class="fa fa-database" style="color:var(--teal)"></i> フルバックアップ</div>
          </div>
        </div>
        <button class="btn btn-primary btn-sm" onclick="openM('コーチ追加',coachAddForm())"><i class="fa fa-plus" style="margin-right:4px"></i>コーチ追加</button>
        <button class="btn btn-sm" style="background:rgba(16,185,129,.1);color:var(--grn);border:1px solid rgba(16,185,129,.2)" onclick="openAdminHealthCheck()"><i class="fa fa-heartbeat" style="margin-right:4px"></i>ヘルス</button>
      </div>
    </div>
  </div>

  <!-- アラート -->
  ${alerts.map(a=>`<div class="dash-alert ${a.cls}" ${a.action} style="cursor:pointer"><i class="fa ${a.icon}"></i><div style="flex:1"><span>${a.msg}</span></div><span style="font-size:11px;font-weight:700;opacity:.7">${a.btn} →</span></div>`).join('')}

  <!-- ダッシュボードタブ -->
  <div class="admin-dash-tabs">
    <button class="admin-dash-tab ${tab==='overview'?'active':''}" onclick="window._adminDashTab='overview';refreshPage()">📊 概要</button>
    <button class="admin-dash-tab ${tab==='coaches'?'active':''}" onclick="window._adminDashTab='coaches';refreshPage()">🏅 コーチ</button>
    <button class="admin-dash-tab ${tab==='teams'?'active':''}" onclick="window._adminDashTab='teams';refreshPage()">🏟️ チーム</button>
    <button class="admin-dash-tab ${tab==='finance'?'active':''}" onclick="window._adminDashTab='finance';refreshPage()">💴 収益</button>
    <button class="admin-dash-tab ${tab==='activity'?'active':''}" onclick="window._adminDashTab='activity';refreshPage()">📜 ログ</button>
    <button class="admin-dash-tab ${tab==='system'?'active':''}" onclick="window._adminDashTab='system';refreshPage();_fetchSystemData()">🖥️ システム</button>
  </div>

  ${tab==='overview'?`
  <!-- ===== 概要タブ ===== -->
  <!-- メインKPI -->
  <div class="hero-kpi" style="grid-template-columns:repeat(auto-fit,minmax(155px,1fr))">
    <div class="hero-kpi-card" style="border-left:3px solid var(--org)">
      <div class="kpi-label">💴 総手数料収入</div>
      <div class="kpi-value" style="color:var(--org)">¥${tf.toLocaleString()}</div>
      <div class="kpi-sub" style="color:${feeGrowth>=0?'var(--grn)':'var(--red)'}"><i class="fa fa-arrow-${feeGrowth>=0?'up':'down'}" style="font-size:10px"></i> 今月 ¥${thisMonthFee.toLocaleString()} (${feeGrowth>=0?'+':''}${feeGrowth}%)</div>
    </div>
    <div class="hero-kpi-card" style="border-left:3px solid var(--blue)">
      <div class="kpi-label">👥 登録ユーザー</div>
      <div class="kpi-value" style="color:var(--blue)">${totalAllUsers}</div>
      <div class="kpi-sub">コーチ${(DB.coaches||[]).length} チーム${(DB.teams||[]).length} 選手${(DB.players||[]).length} 保護者${parentCount}</div>
    </div>
    <div class="hero-kpi-card" style="border-left:3px solid var(--teal)">
      <div class="kpi-label">🤝 マッチング</div>
      <div class="kpi-value" style="color:var(--teal)">${matchedCount}<span style="font-size:14px">件</span></div>
      <div class="kpi-sub" style="color:var(--teal)">成立率 ${matchRate}% · ${pendReqs}件保留</div>
    </div>
    <div class="hero-kpi-card" style="border-left:3px solid ${unp?'var(--red)':'var(--grn)'}">
      <div class="kpi-label">${unp?'⚠️':'✅'} 未払い月謝</div>
      <div class="kpi-value" style="color:${unp?'var(--red)':'var(--grn)'}">${unp}件</div>
      <div class="kpi-sub">総月謝 ¥${totalMonthlyRevenue.toLocaleString()}</div>
    </div>
    <div class="hero-kpi-card" style="border-left:3px solid #a855f7">
      <div class="kpi-label">🏅 コーチ承認</div>
      <div class="kpi-value" style="color:#a855f7">${verifiedCoaches}/${(DB.coaches||[]).length}</div>
      <div class="kpi-sub" style="color:${pendCoaches?'var(--yel)':'var(--grn)'}">${pendCoaches?pendCoaches+'件 審査待ち':'全員承認済'}</div>
    </div>
    <div class="hero-kpi-card" style="border-left:3px solid #f59e0b">
      <div class="kpi-label">💰 コーチ平均料金</div>
      <div class="kpi-value" style="color:#f59e0b">¥${avgCoachPrice?Math.round(avgCoachPrice/10000)+'万':'--'}</div>
      <div class="kpi-sub">報酬総額 ¥${coachPayTotal.toLocaleString()}</div>
    </div>
  </div>

  <!-- チャート + 健全性 -->
  <div class="dash-grid dash-grid-2" style="margin-bottom:16px">
    <div class="dash-section" style="margin-bottom:0">
      <div class="dash-section-head"><span class="dash-section-title">📊 手数料収入推移</span></div>
      <div style="height:200px"><canvas id="admin-fee-chart"></canvas></div>
    </div>
    <div class="dash-section" style="margin-bottom:0">
      <div class="dash-section-head"><span class="dash-section-title">🩺 プラットフォーム健全性</span></div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px;padding:8px 0">
        <div style="display:flex;align-items:center;gap:12px">${svgRing(coachApprovalRate,'var(--teal)')}<div><div style="font-size:11px;font-weight:700">コーチ承認率</div><div style="font-size:10px;color:var(--txt3)">${verifiedCoaches}/${(DB.coaches||[]).length}名</div></div></div>
        <div style="display:flex;align-items:center;gap:12px">${svgRing(parseInt(matchRate)||0,'var(--blue)')}<div><div style="font-size:11px;font-weight:700">マッチング成立率</div><div style="font-size:10px;color:var(--txt3)">${matchedCount}件成立</div></div></div>
        <div style="display:flex;align-items:center;gap:12px">${svgRing(payCollectionRate,'var(--org)')}<div><div style="font-size:11px;font-weight:700">月謝回収率</div><div style="font-size:10px;color:var(--txt3)">${unp}件未回収</div></div></div>
        <div style="display:flex;align-items:center;gap:12px">${svgRing(coachPayRate,'#a855f7')}<div><div style="font-size:11px;font-weight:700">報酬支払率</div><div style="font-size:10px;color:var(--txt3)">¥${coachPayTotal.toLocaleString()}</div></div></div>
      </div>
    </div>
  </div>

  <!-- ユーザー内訳 + クイックアクション -->
  <div class="dash-grid dash-grid-2" style="margin-bottom:16px">
    <div class="dash-section" style="margin-bottom:0">
      <div class="dash-section-head"><span class="dash-section-title">👥 ユーザー内訳</span></div>
      <div style="height:200px"><canvas id="admin-users-chart"></canvas></div>
    </div>
    <div class="dash-section" style="margin-bottom:0">
      <div class="dash-section-head"><span class="dash-section-title">⚡ クイックアクション</span></div>
      <div class="admin-quick-grid">
        ${[
          {icon:'🏅',label:'コーチ承認',sub:pendCoaches+'件待ち',action:"goTo('coaches')",bg:'rgba(249,115,22,.08)'},
          {icon:'💴',label:'収益管理',sub:'月謝・支払確認',action:"goTo('payments')",bg:'rgba(37,99,235,.08)'},
          {icon:'📢',label:'全体連絡',sub:'通知配信',action:"document.getElementById('broadcast-msg')?.focus()",bg:'rgba(0,207,170,.08)'},
          {icon:'🤝',label:'マッチング',sub:pendReqs+'件保留',action:"goTo('threads')",bg:'rgba(168,85,247,.08)'},
          {icon:'👦',label:'選手管理',sub:(DB.players||[]).length+'名',action:"goTo('admin-players')",bg:'rgba(236,72,153,.08)'},
          {icon:'⚙️',label:'設定',sub:'手数料率・規約',action:"goTo('settings')",bg:'rgba(100,116,139,.08)'},
        ].map(q=>`<div class="admin-quick-btn" onclick="${q.action}">
          <div class="q-icon" style="background:${q.bg}">${q.icon}</div>
          <div class="q-label">${q.label}</div>
          <div class="q-sub">${q.sub}</div>
        </div>`).join('')}
      </div>
    </div>
  </div>

  <!-- マッチング + アクティビティタイムライン -->
  <div class="dash-grid dash-grid-2" style="margin-bottom:16px">
    <div class="dash-section" style="margin-bottom:0">
      <div class="dash-section-head">
        <span class="dash-section-title">🤝 マッチング状況</span>
        <span class="badge b-blue">${pendReqs}件保留</span>
      </div>
      ${(()=>{
        const reqs=[...DB.requests].sort((a,b)=>b.createdAt>a.createdAt?1:-1).slice(0,5);
        if(!reqs.length) return '<div class="text-muted text-sm text-center" style="padding:24px">申請なし</div>';
        return reqs.map(r=>{
          const stBadge=r.status==='pending'?'<span class="badge b-yel">保留</span>':r.status==='matched'?'<span class="badge b-green">成立</span>':'<span class="badge b-org">却下</span>';
          return`<div class="dash-list-item">
            <div style="flex:1;min-width:0"><div class="fw7 text-sm">${sanitize(r.coachName||'--',14)} × ${sanitize(r.teamName||'--',14)}</div><div class="text-xs text-muted">${r.type==='team_to_coach'?'チーム→コーチ':'コーチ→チーム'}</div></div>
            ${stBadge}
            ${r.status==='pending'?`<div class="flex gap-4"><button class="btn btn-primary btn-xs" onclick="adminAcceptMatch('${r.id}')">承認</button><button class="btn btn-ghost btn-xs" onclick="rejectRequest('${r.id}')">却下</button></div>`:''}
          </div>`;
        }).join('');
      })()}
    </div>
    <div class="dash-section" style="margin-bottom:0">
      <div class="dash-section-head"><span class="dash-section-title">📜 最新アクティビティ</span></div>
      <div class="admin-timeline">
      ${activities.length?activities.slice(0,8).map(a=>`<div class="admin-timeline-item">
        <div class="admin-timeline-dot" style="background:${a.color}"></div>
        <div style="flex:1;min-width:0">
          <div style="font-size:11px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${a.icon} ${sanitize(a.text,40)}</div>
          <div style="font-size:9px;color:var(--txt3)">${a.date?(a.date).slice(0,10):''}</div>
        </div>
        <span class="badge ${a.type==='pending'?'b-yel':a.type==='matched'?'b-green':'b-blue'}" style="font-size:9px;flex-shrink:0">${a.type==='pending'?'保留':a.type==='matched'?'成立':'完了'}</span>
      </div>`).join(''):'<div class="text-muted text-sm text-center" style="padding:24px">アクティビティなし</div>'}
      </div>
    </div>
  </div>

  <!-- 全体連絡 -->
  <div class="dash-section">
    <div class="dash-section-head">
      <span class="dash-section-title">📢 全体連絡を送信</span>
      <span class="text-xs text-muted">全ユーザーに通知</span>
    </div>
    <div style="display:flex;gap:10px">
      <input id="broadcast-msg" class="input" placeholder="全体連絡メッセージを入力…" style="flex:1">
      <button class="btn btn-primary btn-sm" onclick="sendBroadcastMsg()">📢 送信</button>
    </div>
  </div>
  `:''}

  ${tab==='coaches'?`
  <!-- ===== コーチタブ ===== -->
  <div class="dash-section">
    <div class="dash-section-head">
      <span class="dash-section-title">🏅 コーチ一覧 (${(DB.coaches||[]).length}名)</span>
      <div class="flex gap-6">
        <button class="btn btn-ghost btn-xs" onclick="exportAdminCoachCSV()"><i class="fa fa-download" style="margin-right:3px"></i>CSV</button>
        <button class="btn btn-primary btn-xs" onclick="openM('コーチ追加',coachAddForm())">+ 追加</button>
      </div>
    </div>
    <div style="margin-bottom:12px"><input class="input" placeholder="🔍 名前・種目・エリアで検索…" oninput="adminFilterCoachTable(this.value)" style="font-size:12px;height:36px"></div>
    <div style="overflow-x:auto;max-height:480px;overflow-y:auto">
    <table class="admin-data-table" id="admin-coach-table">
      <thead><tr><th>コーチ名</th><th>種目</th><th>エリア</th><th>指導歴</th><th>料金</th><th>評価</th><th>ステータス</th><th style="text-align:center">操作</th></tr></thead>
      <tbody>
      ${(DB.coaches||[]).map(c=>{
        const teamCount=DB.teams.filter(t=>t.coach===c.id).length;
        return`<tr class="admin-coach-row" data-search="${(c.name||'').toLowerCase()} ${(c.sport||'').toLowerCase()} ${(c.area||'').toLowerCase()}">
          <td><div style="display:flex;align-items:center;gap:8px"><div class="avi" style="background:${c.color||'var(--org)'};${c.photo?'background-image:url('+c.photo+');background-size:cover;background-position:center':''};width:32px;height:32px;font-size:12px;flex-shrink:0">${c.photo?'':(c.name||'?')[0]}</div><div><div class="fw7">${sanitize(c.name||'',20)}</div><div class="text-xs text-muted">${teamCount}チーム担当</div></div></div></td>
          <td><span class="badge b-org" style="font-size:10px">${sanitize(c.sport||'--',12)}</span></td>
          <td style="font-size:11px">${sanitize(c.area||'--',15)}</td>
          <td style="font-weight:700">${c.exp||'--'}年</td>
          <td><div class="fw7" style="color:var(--org)">¥${(c.price||0).toLocaleString()}</div><div class="text-xs text-muted">都度: ¥${(c.priceOnetime||0).toLocaleString()}</div></td>
          <td style="color:#f59e0b;font-weight:700">${'★'.repeat(Math.round(c.rating||0))} ${c.rating||'--'}</td>
          <td>${c.verified?'<span class="badge b-green">承認済</span>':'<span class="badge b-yel">審査中</span>'} ${c.avail?'<span class="badge b-blue" style="font-size:9px">募集中</span>':''}</td>
          <td style="text-align:center"><div class="flex gap-4 justify-center">
            <button class="btn btn-ghost btn-xs" onclick="openCoachDetail('${c.id}')" title="詳細">📋</button>
            <button class="btn btn-ghost btn-xs" onclick="adminEditCoach('${c.id}')" title="編集">✏️</button>
            ${!c.verified?`<button class="btn btn-primary btn-xs" onclick="approveCoach('${c.id}')">承認</button>`:''}
          </div></td>
        </tr>`;
      }).join('')}
      </tbody>
    </table></div>
    ${!(DB.coaches||[]).length?'<div class="text-muted text-sm text-center" style="padding:32px">コーチ未登録</div>':''}
    <!-- コーチ集計 -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin-top:16px;padding-top:16px;border-top:1px solid var(--b1)">
      <div style="text-align:center"><div style="font-size:20px;font-weight:800;color:var(--org)">${(DB.coaches||[]).length}</div><div style="font-size:10px;color:var(--txt3)">総コーチ数</div></div>
      <div style="text-align:center"><div style="font-size:20px;font-weight:800;color:var(--grn)">${verifiedCoaches}</div><div style="font-size:10px;color:var(--txt3)">承認済</div></div>
      <div style="text-align:center"><div style="font-size:20px;font-weight:800;color:var(--yel)">${pendCoaches}</div><div style="font-size:10px;color:var(--txt3)">審査中</div></div>
      <div style="text-align:center"><div style="font-size:20px;font-weight:800;color:var(--blue)">¥${avgCoachPrice?Math.round(avgCoachPrice/1000)+'K':'--'}</div><div style="font-size:10px;color:var(--txt3)">平均月額</div></div>
    </div>
  </div>
  `:''}

  ${tab==='teams'?`
  <!-- ===== チームタブ ===== -->
  <div class="dash-section">
    <div class="dash-section-head">
      <span class="dash-section-title">🏟️ チーム一覧 (${(DB.teams||[]).length}チーム)</span>
      <div class="flex gap-6">
        <button class="btn btn-ghost btn-xs" onclick="exportAdminTeamCSV()"><i class="fa fa-download" style="margin-right:3px"></i>CSV</button>
      </div>
    </div>
    <div style="margin-bottom:12px"><input class="input" placeholder="🔍 チーム名・種目で検索…" oninput="adminFilterTeamTable(this.value)" style="font-size:12px;height:36px"></div>
    <div style="overflow-x:auto;max-height:480px;overflow-y:auto">
    <table class="admin-data-table" id="admin-team-table">
      <thead><tr><th>チーム名</th><th>種目</th><th>エリア</th><th>選手数</th><th>コーチ</th><th>月謝</th><th>回収状況</th></tr></thead>
      <tbody>
      ${(DB.teams||[]).map(t=>{
        const playerCount=DB.players.filter(p=>p.team===t.id).length;
        const coach=DB.coaches.find(c=>c.id===t.coach);
        const teamPay=_dbArr('payments').filter(p=>(p.team===t.id||p.teamId===t.id));
        const teamPaid=teamPay.filter(p=>p.status==='paid').length;
        const teamTotal=teamPay.length;
        const collectRate=teamTotal?Math.round(teamPaid/teamTotal*100):0;
        return`<tr class="admin-team-row" data-search="${(t.name||'').toLowerCase()} ${(t.sport||'').toLowerCase()}">
          <td><div style="display:flex;align-items:center;gap:8px"><div class="avi" style="background:var(--blue);width:32px;height:32px;font-size:12px">${(t.name||'?')[0]}</div><div><div class="fw7">${sanitize(t.name||'',20)}</div><div class="text-xs text-muted">${t.id}</div></div></div></td>
          <td><span class="badge b-blue" style="font-size:10px">${sanitize(t.sport||'--',12)}</span></td>
          <td style="font-size:11px">${sanitize(t.area||'--',15)}</td>
          <td style="font-weight:700;text-align:center">${playerCount}名</td>
          <td>${coach?'<span class="badge b-green" style="font-size:10px">'+sanitize(coach.name,10)+'</span>':'<span class="badge b-yel" style="font-size:10px">未配置</span>'}</td>
          <td style="font-weight:700">¥${(t.fee||0).toLocaleString()}</td>
          <td><div style="display:flex;align-items:center;gap:6px"><div class="admin-progress" style="width:60px"><div class="admin-progress-bar" style="width:${collectRate}%;background:${collectRate>=80?'var(--grn)':collectRate>=50?'var(--yel)':'var(--red)'}"></div></div><span style="font-size:11px;font-weight:700">${collectRate}%</span></div></td>
        </tr>`;
      }).join('')}
      </tbody>
    </table></div>
    ${!(DB.teams||[]).length?'<div class="text-muted text-sm text-center" style="padding:32px">チーム未登録</div>':''}
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin-top:16px;padding-top:16px;border-top:1px solid var(--b1)">
      <div style="text-align:center"><div style="font-size:20px;font-weight:800;color:var(--blue)">${(DB.teams||[]).length}</div><div style="font-size:10px;color:var(--txt3)">総チーム数</div></div>
      <div style="text-align:center"><div style="font-size:20px;font-weight:800;color:var(--teal)">${(DB.players||[]).length}</div><div style="font-size:10px;color:var(--txt3)">総選手数</div></div>
      <div style="text-align:center"><div style="font-size:20px;font-weight:800;color:${noCoachTeams?'var(--red)':'var(--grn)'}">${noCoachTeams}</div><div style="font-size:10px;color:var(--txt3)">コーチ未配置</div></div>
      <div style="text-align:center"><div style="font-size:20px;font-weight:800;color:var(--org)">${(DB.players||[]).length&&(DB.teams||[]).length?Math.round((DB.players||[]).length/(DB.teams||[]).length):0}</div><div style="font-size:10px;color:var(--txt3)">平均選手数</div></div>
    </div>
  </div>
  `:''}

  ${tab==='finance'?`
  <!-- ===== 収益タブ ===== -->
  <div class="hero-kpi" style="grid-template-columns:repeat(auto-fit,minmax(155px,1fr))">
    <div class="hero-kpi-card" style="border-left:3px solid var(--org)">
      <div class="kpi-label">💴 総手数料収入</div>
      <div class="kpi-value" style="color:var(--org)">¥${tf.toLocaleString()}</div>
      <div class="kpi-sub" style="color:${feeGrowth>=0?'var(--grn)':'var(--red)'}"><i class="fa fa-arrow-${feeGrowth>=0?'up':'down'}" style="font-size:10px"></i> 前月比 ${feeGrowth>=0?'+':''}${feeGrowth}%</div>
    </div>
    <div class="hero-kpi-card" style="border-left:3px solid var(--blue)">
      <div class="kpi-label">📥 月謝収入（総額）</div>
      <div class="kpi-value" style="color:var(--blue)">¥${totalMonthlyRevenue.toLocaleString()}</div>
      <div class="kpi-sub">回収率 ${payCollectionRate}%</div>
    </div>
    <div class="hero-kpi-card" style="border-left:3px solid var(--teal)">
      <div class="kpi-label">💸 コーチ報酬総額</div>
      <div class="kpi-value" style="color:var(--teal)">¥${coachPayTotal.toLocaleString()}</div>
      <div class="kpi-sub">支払率 ${coachPayRate}%</div>
    </div>
    <div class="hero-kpi-card" style="border-left:3px solid ${unp?'var(--red)':'var(--grn)'}">
      <div class="kpi-label">⚠️ 未回収</div>
      <div class="kpi-value" style="color:${unp?'var(--red)':'var(--grn)'}">${unp}件</div>
      <div class="kpi-sub">¥${_dbArr('payments').filter(p=>p.status==='unpaid').reduce((s,p)=>s+(p.amount||0),0).toLocaleString()} 未回収</div>
    </div>
  </div>
  <div class="dash-section">
    <div class="dash-section-head"><span class="dash-section-title">📊 手数料収入推移（6ヶ月）</span></div>
    <div style="height:260px"><canvas id="admin-fee-chart"></canvas></div>
  </div>
  <div class="dash-grid dash-grid-2" style="margin-bottom:16px">
    <div class="dash-section" style="margin-bottom:0">
      <div class="dash-section-head">
        <span class="dash-section-title">💴 未払い月謝</span>
        <button class="btn btn-ghost btn-xs" onclick="goTo('payments')">全件 →</button>
      </div>
      ${_dbArr('payments').filter(p=>p.status==='unpaid').slice(0,8).map(p=>{
        const pl=DB.players.find(x=>x.id===p.player);
        const tm=DB.teams.find(x=>x.id===p.team);
        return`<div class="dash-list-item">
          <div style="flex:1;min-width:0"><div class="fw7 text-sm">${sanitize(pl?.name||'--',20)}</div><div class="text-xs text-muted">${sanitize(tm?.name||'--',16)} / ¥${(p.amount||0).toLocaleString()}</div></div>
          <button class="btn btn-secondary btn-xs" onclick="markPaid('${p.id}')">入金確認</button>
        </div>`;
      }).join('') || '<div class="text-muted text-sm text-center" style="padding:24px">未払いなし ✅</div>'}
    </div>
    <div class="dash-section" style="margin-bottom:0">
      <div class="dash-section-head"><span class="dash-section-title">💰 コーチ報酬履歴</span></div>
      ${_dbArr('coachPay').slice(-8).reverse().map(p=>{
        return`<div class="dash-list-item">
          <div style="flex:1;min-width:0"><div class="fw7 text-sm">${sanitize(p.coachName||'コーチ',16)}</div><div class="text-xs text-muted">¥${(p.amount||0).toLocaleString()} · ${(p.paidAt||'').slice(0,10)}</div></div>
          <span class="badge ${p.status==='paid'?'b-green':'b-yel'}" style="font-size:9px">${p.status==='paid'?'支払済':'未払い'}</span>
        </div>`;
      }).join('') || '<div class="text-muted text-sm text-center" style="padding:24px">支払い履歴なし</div>'}
    </div>
  </div>
  <div class="flex gap-8 justify-center" style="padding:8px 0">
    <button class="btn btn-ghost btn-sm" onclick="exportAdminPayCSV()"><i class="fa fa-download" style="margin-right:4px"></i>支払いCSV</button>
    <button class="btn btn-ghost btn-sm" onclick="exportAdminSummaryPDF()"><i class="fa fa-file-pdf" style="margin-right:4px;color:var(--red)"></i>収益レポートPDF</button>
  </div>
  `:''}

  ${tab==='activity'?`
  <!-- ===== アクティビティログタブ ===== -->
  <div class="dash-section">
    <div class="dash-section-head">
      <span class="dash-section-title">📜 操作・イベントログ</span>
      <span class="text-xs text-muted">${activities.length}件のイベント</span>
    </div>
    <div style="display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap">
      <button class="btn btn-xs ${!window._adminLogFilter?'btn-primary':'btn-ghost'}" onclick="window._adminLogFilter='';refreshPage()">全て</button>
      <button class="btn btn-xs ${window._adminLogFilter==='match'?'btn-primary':'btn-ghost'}" onclick="window._adminLogFilter='match';refreshPage()">🤝 マッチング</button>
      <button class="btn btn-xs ${window._adminLogFilter==='fee'?'btn-primary':'btn-ghost'}" onclick="window._adminLogFilter='fee';refreshPage()">💴 月謝</button>
      <button class="btn btn-xs ${window._adminLogFilter==='pay'?'btn-primary':'btn-ghost'}" onclick="window._adminLogFilter='pay';refreshPage()">💰 報酬</button>
      <button class="btn btn-xs ${window._adminLogFilter==='coach'?'btn-primary':'btn-ghost'}" onclick="window._adminLogFilter='coach';refreshPage()">🏅 コーチ</button>
    </div>
    <div class="admin-timeline" style="max-height:500px;overflow-y:auto">
    ${(()=>{
      const filtered=window._adminLogFilter?activities.filter(a=>a.cat===window._adminLogFilter):activities;
      if(!filtered.length) return '<div class="text-muted text-sm text-center" style="padding:32px">該当するログがありません</div>';
      return filtered.slice(0,30).map(a=>`<div class="admin-timeline-item">
        <div class="admin-timeline-dot" style="background:${a.color}"></div>
        <div style="flex:1;min-width:0">
          <div style="font-size:12px;font-weight:600">${a.icon} ${sanitize(a.text,50)}</div>
          <div style="font-size:10px;color:var(--txt3);margin-top:2px">${a.date?(a.date).slice(0,16).replace('T',' '):''} · ${a.cat==='match'?'マッチング':a.cat==='fee'?'月謝':a.cat==='pay'?'報酬':'コーチ'}</div>
        </div>
        <span class="badge ${a.type==='pending'?'b-yel':a.type==='matched'?'b-green':'b-blue'}" style="font-size:9px;flex-shrink:0">${a.type==='pending'?'保留':a.type==='matched'?'成立':'完了'}</span>
      </div>`).join('');
    })()}
    </div>
  </div>
  <!-- モデレーション履歴 -->
  <div class="dash-section">
    <div class="dash-section-head"><span class="dash-section-title">🛡️ モデレーション履歴</span></div>
    ${(()=>{
      const modLog=DB.moderationLog||[];
      if(!modLog.length) return '<div class="text-muted text-sm text-center" style="padding:20px">モデレーション記録なし</div>';
      return modLog.slice(-15).reverse().map(l=>{
        const icon=l.type==='delete'?'🗑️':l.type==='warn'?'⚠️':l.type==='suspend'?'🚫':'🧹';
        const label=l.type==='delete'?'削除':l.type==='warn'?'忠告':l.type==='suspend'?'停止':'全削除';
        const color=l.type==='delete'?'var(--red)':l.type==='warn'?'var(--yel)':l.type==='suspend'?'var(--red)':'var(--txt3)';
        return`<div class="dash-list-item">
          <span style="font-size:16px">${icon}</span>
          <div style="flex:1;min-width:0"><div class="fw7 text-sm" style="color:${color}">${label}</div><div class="text-xs text-muted">${sanitize(l.userName||'',15)} ${l.originalText?'「'+sanitize(l.originalText,25)+'…」':''}</div></div>
          <span style="font-size:10px;color:var(--txt3)">${(l.date||'').slice(0,10)}</span>
        </div>`;
      }).join('');
    })()}
  </div>
  <!-- 監査ログ -->
  <div class="dash-section">
    <div class="dash-section-head">
      <span class="dash-section-title">📋 監査ログ (Audit Trail)</span>
      <div class="flex gap-4">
        <span class="text-xs text-muted">${(DB.auditLog||[]).length}件</span>
        <button class="btn btn-ghost btn-xs" onclick="exportAuditLogCSV()"><i class="fa fa-download" style="margin-right:3px"></i>CSV</button>
      </div>
    </div>
    <div style="display:flex;gap:4px;margin-bottom:10px;flex-wrap:wrap">
      ${['','login','logout','user_register','coach_approve','payment_confirm','gdpr_delete','error','data_export'].map(f=>{
        const labels={'':'全て',login:'ログイン',logout:'ログアウト',user_register:'登録',coach_approve:'承認',payment_confirm:'入金',gdpr_delete:'削除',error:'エラー',data_export:'エクスポート'};
        return`<button class="btn btn-xs ${(window._auditFilter||'')===f?'btn-primary':'btn-ghost'}" onclick="window._auditFilter='${f}';refreshPage()">${labels[f]}</button>`;
      }).join('')}
    </div>
    <div style="max-height:400px;overflow-y:auto">
    ${(()=>{
      const logs=(DB.auditLog||[]).slice(-100).reverse();
      const filtered=window._auditFilter?logs.filter(l=>l.action===window._auditFilter):logs;
      if(!filtered.length) return '<div class="text-muted text-sm text-center" style="padding:20px">監査ログなし</div>';
      const actionIcons={login:'🔓',logout:'🔒',user_register:'👤',coach_approve:'✅',payment_confirm:'💰',gdpr_delete:'🗑️',error:'❌',data_export:'📤',settings_change:'⚙️'};
      const actionColors={login:'var(--blue)',logout:'var(--txt3)',user_register:'var(--teal)',coach_approve:'var(--grn)',payment_confirm:'var(--org)',gdpr_delete:'var(--red)',error:'var(--red)',data_export:'var(--blue)',settings_change:'var(--yel)'};
      return filtered.slice(0,40).map(l=>`<div class="dash-list-item" style="padding:8px 0">
        <span style="font-size:14px">${actionIcons[l.action]||'📋'}</span>
        <div style="flex:1;min-width:0">
          <div style="font-size:11px;font-weight:600">${sanitize(l.detail||l.action,50)}</div>
          <div style="font-size:9px;color:var(--txt3)">${l.user?sanitize(l.user.name||'',12)+' ('+l.user.role+')':'system'} · ${(l.timestamp||'').slice(0,16).replace('T',' ')}</div>
        </div>
        <span class="badge" style="background:${actionColors[l.action]||'var(--txt3)'}18;color:${actionColors[l.action]||'var(--txt3)'};font-size:9px">${l.action||'--'}</span>
      </div>`).join('');
    })()}
    </div>
  </div>
  `:''}
  ${tab==='system'? adminSystemTab() :''}
  `;
}

// ── システム監視タブ（バックエンドAPI接続）──
function adminSystemTab(){
  const sd = window._sysData || {};
  const h = sd.health || {};
  const st = sd.stats || {};
  const srv = h.services || {};
  const aiP = st.ai?.providers || h.stats?.aiProviderStats || {};
  const logs = (sd.logs?.logs || []).slice(-50).reverse();
  const eps = (sd.endpoints?.endpoints || []).slice(0, 10);
  const blocked = sd.blocked?.blocked || [];
  const loading = !sd._loaded;
  const sysTab = window._sysSubTab || 'overview';

  function svcBadge(name, on, emoji){
    const c = on ? 'var(--grn)' : 'var(--red)';
    const bg = on ? 'rgba(22,163,74,.08)' : 'rgba(220,38,38,.08)';
    const bdr = on ? 'rgba(22,163,74,.15)' : 'rgba(220,38,38,.15)';
    return '<div style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:8px;background:'+bg+';border:1px solid '+bdr+'"><span>'+emoji+'</span><span style="font-size:12px;font-weight:600;color:'+c+'">'+name+'</span><span class="badge" style="background:'+bg+';color:'+c+';border:1px solid '+bdr+';font-size:9px">'+(on?'ON':'OFF')+'</span></div>';
  }

  if(loading) return '<div class="card text-center" style="padding:40px"><div style="font-size:36px;margin-bottom:12px">\u23F3</div><div class="fw7">バックエンドに接続中...</div><div class="text-xs text-muted mt-8">初回読み込みに数秒かかります</div></div>';

  if(sd._error) return '<div class="card text-center" style="padding:40px"><div style="font-size:36px;margin-bottom:12px">\u26A0\uFE0F</div><div class="fw7" style="color:var(--red)">接続エラー</div><div class="text-xs text-muted mt-8">'+sanitize(sd._error,100)+'</div><button class="btn btn-primary btn-sm mt-16" onclick="_fetchSystemData()">\uD83D\uDD04 再試行</button></div>';

  let out = '';

  // サブタブ
  out += '<div style="display:flex;gap:4px;margin-bottom:14px;flex-wrap:wrap">';
  ['overview','ai','logs','security'].forEach(function(t){
    const labels = {overview:'📊 概要',ai:'🤖 AI分析',logs:'📋 リクエストログ',security:'🛡️ セキュリティ'};
    out += '<button class="btn btn-xs '+(sysTab===t?'btn-primary':'btn-ghost')+'" onclick="window._sysSubTab=\''+t+'\';refreshPage()">'+labels[t]+'</button>';
  });
  out += '<button class="btn btn-xs btn-ghost" onclick="_fetchSystemData()" style="margin-left:auto">🔄 更新</button>';
  out += '</div>';

  if(sysTab==='overview'){
    out += '<div class="dash-section"><div class="dash-section-head"><span class="dash-section-title">🖥️ サービス状態</span><span class="badge b-blue">'+(h.version||'?')+'</span></div>';
    out += '<div style="display:flex;gap:8px;flex-wrap:wrap">';
    out += svcBadge('Gemini',srv.gemini,'🧠')+svcBadge('Groq',srv.groq,'⚡')+svcBadge('OpenRouter',srv.openrouter,'🌐');
    out += svcBadge('Stripe',srv.stripe,'💳')+svcBadge('Firestore',srv.firestore,'🗄️')+svcBadge('SendGrid',srv.sendgrid,'📧');
    out += '</div></div>';

    var errRate = st.totalRequests ? ((st.errors||0)/st.totalRequests*100).toFixed(1) : '0';
    var aiRate = st.ai?.total ? ((st.ai.success||0)/st.ai.total*100).toFixed(0) : '--';
    out += '<div class="hero-kpi" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">';
    out += '<div class="hero-kpi-card" style="border-left:3px solid var(--org)"><div class="kpi-label">📡 総リクエスト</div><div class="kpi-value" style="color:var(--org)">'+(st.totalRequests||0).toLocaleString()+'</div><div class="kpi-sub">uptime '+(h.uptimeFormatted||'--')+'</div></div>';
    out += '<div class="hero-kpi-card" style="border-left:3px solid '+(parseFloat(errRate)>10?'var(--red)':'var(--grn)')+'"><div class="kpi-label">⚠️ エラー率</div><div class="kpi-value" style="color:'+(parseFloat(errRate)>10?'var(--red)':'var(--grn)')+'">'+errRate+'%</div><div class="kpi-sub">'+(st.errors||0)+' errors</div></div>';
    out += '<div class="hero-kpi-card" style="border-left:3px solid #a855f7"><div class="kpi-label">🤖 AI成功率</div><div class="kpi-value" style="color:#a855f7">'+aiRate+'%</div><div class="kpi-sub">'+(st.ai?.success||0)+'/'+(st.ai?.total||0)+' requests</div></div>';
    out += '<div class="hero-kpi-card" style="border-left:3px solid var(--blue)"><div class="kpi-label">💾 メモリ</div><div class="kpi-value" style="color:var(--blue)">'+(h.memory?.heapUsed||'--')+'</div><div class="kpi-sub">/ '+(h.memory?.heapTotal||'--')+'</div></div>';
    out += '</div>';

    if(eps.length){
      out += '<div class="dash-section"><div class="dash-section-head"><span class="dash-section-title">🏆 エンドポイント ランキング</span></div>';
      var maxCount = Math.max(...eps.map(function(e){return e.count;}));
      eps.forEach(function(e){
        var pct = maxCount ? Math.round(e.count/maxCount*100) : 0;
        out += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">';
        out += '<div style="width:160px;font-size:11px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-family:monospace">'+sanitize(e.path,30)+'</div>';
        out += '<div style="flex:1;height:8px;background:var(--b1);border-radius:4px;overflow:hidden"><div style="height:100%;width:'+pct+'%;background:linear-gradient(90deg,var(--org),var(--org2));border-radius:4px"></div></div>';
        out += '<div style="font-size:11px;font-weight:700;color:var(--org);min-width:40px;text-align:right">'+e.count+'</div>';
        out += '</div>';
      });
      out += '</div>';
    }
  }

  if(sysTab==='ai'){
    out += '<div class="hero-kpi" style="grid-template-columns:repeat(3,1fr)">';
    out += '<div class="hero-kpi-card" style="border-left:3px solid #a855f7"><div class="kpi-label">📊 AI総数</div><div class="kpi-value" style="color:#a855f7">'+(st.ai?.total||0)+'</div></div>';
    out += '<div class="hero-kpi-card" style="border-left:3px solid var(--grn)"><div class="kpi-label">✅ 成功</div><div class="kpi-value" style="color:var(--grn)">'+(st.ai?.success||0)+'</div></div>';
    out += '<div class="hero-kpi-card" style="border-left:3px solid var(--red)"><div class="kpi-label">❌ 失敗</div><div class="kpi-value" style="color:var(--red)">'+(st.ai?.failed||0)+'</div></div>';
    out += '</div>';

    out += '<div class="dash-section"><div class="dash-section-head"><span class="dash-section-title">⚡ プロバイダー別使用状況</span></div>';
    out += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">';
    [{k:'gemini',l:'Gemini',e:'🧠',c:'var(--blue)',m:'gemini-2.0-flash'},{k:'groq',l:'Groq',e:'⚡',c:'var(--grn)',m:'llama-3.3-70b'},{k:'openrouter',l:'OpenRouter',e:'🌐',c:'var(--org)',m:'llama-3.1-8b:free'}].forEach(function(p){
      var active = srv[p.k];
      out += '<div style="padding:16px;border-radius:14px;background:'+(active?'rgba(37,99,235,.04)':'rgba(220,38,38,.04)')+';border:1px solid '+(active?'var(--b2)':'rgba(220,38,38,.12)')+';text-align:center">';
      out += '<div style="font-size:28px;margin-bottom:4px">'+p.e+'</div>';
      out += '<div style="font-size:14px;font-weight:700;color:'+p.c+'">'+p.l+'</div>';
      out += '<div style="font-size:28px;font-weight:800;margin:6px 0;font-family:Montserrat,sans-serif">'+(aiP[p.k]||0)+'</div>';
      out += '<div style="font-size:10px;color:var(--txt3)">'+p.m+'</div>';
      out += '<div style="margin-top:6px"><span class="badge '+(active?'b-green':'b-org')+'" style="font-size:9px">'+(active?'Active':'Off')+'</span></div>';
      out += '</div>';
    });
    out += '</div></div>';

    out += '<div class="dash-section"><div class="dash-section-head"><span class="dash-section-title">🔄 フォールバック順序</span></div>';
    out += '<div style="display:flex;align-items:center;gap:8px;justify-content:center;flex-wrap:wrap">';
    ['Gemini 🧠','Groq ⚡','OpenRouter 🌐'].forEach(function(p,i){
      out += '<div style="padding:10px 18px;border-radius:10px;background:var(--surf2);border:1px solid var(--b2);font-weight:700;font-size:13px">';
      out += '<span style="color:var(--org);font-size:11px;margin-right:4px">'+(i+1)+'.</span>'+p+'</div>';
      if(i<2) out += '<span style="font-size:14px;color:var(--txt3)">→</span>';
    });
    out += '</div>';
    out += '<div style="margin-top:12px;padding:10px;border-radius:8px;background:rgba(22,163,74,.05);border:1px solid rgba(22,163,74,.1);font-size:11px;color:var(--txt2);text-align:center">1つのAPIが失敗しても次のプロバイダーに自動で切り替わります</div>';
    out += '</div>';
  }

  if(sysTab==='logs'){
    out += '<div class="dash-section"><div class="dash-section-head"><span class="dash-section-title">📋 リクエストログ（直近'+logs.length+'件）</span></div>';
    if(logs.length){
      out += '<div style="overflow-x:auto;max-height:500px;overflow-y:auto"><table class="admin-data-table"><thead><tr><th>時刻</th><th>メソッド</th><th>パス</th><th>ステータス</th><th>応答時間</th><th>UID</th></tr></thead><tbody>';
      logs.forEach(function(l){
        var sc = l.s<300?'var(--grn)':l.s<400?'var(--blue)':l.s<500?'var(--yel)':'var(--red)';
        var time = l.t ? new Date(l.t).toLocaleTimeString('ja-JP') : '--';
        out += '<tr>';
        out += '<td style="font-family:monospace;font-size:11px">'+time+'</td>';
        out += '<td><span class="badge '+(l.m==='POST'?'b-org':'b-blue')+'" style="font-size:10px">'+(l.m||'')+'</span></td>';
        out += '<td style="font-family:monospace;font-size:11px">'+sanitize(l.p||'',40)+'</td>';
        out += '<td><span class="badge" style="background:transparent;color:'+sc+';border:1px solid '+sc+';font-size:10px">'+l.s+'</span></td>';
        out += '<td style="font-family:monospace;font-size:11px">'+(l.d||0)+'ms</td>';
        out += '<td style="font-size:10px;color:var(--txt3)">'+sanitize(l.uid||'--',12)+'</td>';
        out += '</tr>';
      });
      out += '</tbody></table></div>';
    } else {
      out += '<div class="text-muted text-sm text-center" style="padding:32px">ログデータなし</div>';
    }
    out += '</div>';
  }

  if(sysTab==='security'){
    out += '<div class="hero-kpi" style="grid-template-columns:repeat(3,1fr)">';
    out += '<div class="hero-kpi-card" style="border-left:3px solid var(--yel)"><div class="kpi-label">🔒 レート制限</div><div class="kpi-value" style="color:var(--yel)">'+(st.activeRateLimits||0)+'</div><div class="kpi-sub">active keys</div></div>';
    out += '<div class="hero-kpi-card" style="border-left:3px solid var(--red)"><div class="kpi-label">🚫 ブロック中IP</div><div class="kpi-value" style="color:var(--red)">'+blocked.length+'</div></div>';
    out += '<div class="hero-kpi-card" style="border-left:3px solid var(--blue)"><div class="kpi-label">🌐 環境</div><div class="kpi-value" style="color:var(--blue);font-size:18px">'+(h.env||'--')+'</div><div class="kpi-sub">'+(h.version||'')+'</div></div>';
    out += '</div>';

    out += '<div class="dash-section"><div class="dash-section-head"><span class="dash-section-title">🚫 ブロック中IPアドレス</span></div>';
    if(blocked.length){
      out += '<table class="admin-data-table"><thead><tr><th>IP</th><th>試行回数</th><th>最終試行</th><th>解除予定</th><th>操作</th></tr></thead><tbody>';
      blocked.forEach(function(b){
        out += '<tr><td style="font-family:monospace">'+sanitize(b.ip,20)+'</td><td style="font-weight:700">'+b.attempts+'</td>';
        out += '<td style="font-size:11px">'+(b.lastAttempt?new Date(b.lastAttempt).toLocaleString('ja-JP'):'--')+'</td>';
        out += '<td style="font-size:11px">'+(b.unblockAt?new Date(b.unblockAt).toLocaleString('ja-JP'):'--')+'</td>';
        out += '<td><button class="btn btn-danger btn-xs" onclick="_unblockIP(\''+b.ip+'\')">解除</button></td></tr>';
      });
      out += '</tbody></table>';
    } else {
      out += '<div class="text-center" style="padding:30px"><div style="font-size:32px;margin-bottom:8px">✅</div><div class="text-sm text-muted">ブロック中のIPはありません</div></div>';
    }
    out += '</div>';
  }

  return out;
}

// ── バックエンドデータ取得 ──
async function _fetchSystemData(){
  if(!window._sysData) window._sysData = {};
  window._sysData._loaded = true;
  window._sysData._error = null;
  if(!API_BASE){ window._sysData._error = 'バックエンドサーバー未設定'; if(curPage==='dashboard' && window._adminDashTab==='system') refreshPage(); return; }
  const headers = {'Content-Type':'application/json'};
  try {
    const hRes = await fetch(API_BASE+'/health');
    window._sysData.health = await hRes.json();

    if(!window._fbToken && typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser){
      window._fbToken = await firebase.auth().currentUser.getIdToken();
    }
    if(window._fbToken){
      headers.Authorization = 'Bearer ' + window._fbToken;
      const [stRes, lgRes, epRes, blRes] = await Promise.all([
        fetch(API+'/api/admin/stats', {headers}).catch(()=>null),
        fetch(API+'/api/admin/logs?limit=100', {headers}).catch(()=>null),
        fetch(API+'/api/admin/endpoints', {headers}).catch(()=>null),
        fetch(API+'/api/admin/blocked', {headers}).catch(()=>null),
      ]);
      if(stRes?.ok) window._sysData.stats = await stRes.json();
      if(lgRes?.ok) window._sysData.logs = await lgRes.json();
      if(epRes?.ok) window._sysData.endpoints = await epRes.json();
      if(blRes?.ok) window._sysData.blocked = await blRes.json();
    }
    window._sysData._loaded = true;
  } catch(e) {
    window._sysData._error = e.message;
    window._sysData._loaded = true;
  }
  if(curPage==='dashboard' && window._adminDashTab==='system') refreshPage();
}

async function _unblockIP(ip){
  if(!API_BASE){ toast('バックエンドサーバー未設定','e'); return; }
  if(!window._fbToken){ toast('認証トークンが必要です','e'); return; }
  try {
    await fetch(API_BASE+'/api/admin/unblock',{
      method:'POST', headers:{Authorization:'Bearer '+window._fbToken,'Content-Type':'application/json'},
      body:JSON.stringify({ip})
    });
    toast('IP '+ip+' のブロックを解除しました','s');
    _fetchSystemData();
  } catch(e){ toast('解除に失敗しました','e'); }
}

// 監査ログCSVエクスポート
function exportAuditLogCSV(){
  if(DB.currentUser?.role!=='admin'){toast('権限がありません','e');return;}
  const rows=[['日時','操作','詳細','ユーザー名','ロール','UA']];
  (DB.auditLog||[]).forEach(l=>{
    rows.push([l.timestamp||'',l.action||'',l.detail||'',l.user?.name||'system',l.user?.role||'',l.ua||'']);
  });
  _downloadCSV(rows,'audit_log_'+curMonth()+'.csv');
  toast('監査ログをエクスポートしました','s');
}

function openAdminMsgMonitor(){
  var allRooms=Object.entries(DB.chats);
  var totalMsgs=allRooms.reduce(function(s,e){return s+(e[1].msgs||[]).length;},0);
  var modLog=DB.moderationLog||[];
  var suspUsers=Object.keys(DB.suspendedUsers||{}).filter(function(k){return (DB.suspendedUsers||{})[k]?.suspended;});
  var warnedUsers=Object.keys(DB.userWarnings||{}).filter(function(k){return (DB.userWarnings||{})[k]?.count>0;});
  // 最近のメッセージ（全ルーム横断）
  var recentMsgs=[];
  allRooms.forEach(function(e){
    var rk=e[0],ch=e[1];
    (ch.msgs||[]).forEach(function(m,i){
      if(m.from==='system')return;
      recentMsgs.push({roomKey:rk,roomName:ch.name||rk,idx:i,msg:m});
    });
  });
  recentMsgs.sort(function(a,b){return (b.msg.time||'')>(a.msg.time||'')?1:-1;});

  var h='<div style="display:grid;gap:12px">';
  // KPI
  h+='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">';
  h+='<div style="text-align:center;padding:10px;background:var(--surf2);border-radius:8px"><div style="font-size:18px;font-weight:800">'+totalMsgs+'</div><div style="font-size:9px;color:var(--txt3)">総メッセージ</div></div>';
  h+='<div style="text-align:center;padding:10px;background:var(--surf2);border-radius:8px"><div style="font-size:18px;font-weight:800">'+allRooms.length+'</div><div style="font-size:9px;color:var(--txt3)">会話数</div></div>';
  h+='<div style="text-align:center;padding:10px;background:var(--surf2);border-radius:8px"><div style="font-size:18px;font-weight:800;color:'+(warnedUsers.length?'var(--yel)':'var(--grn)')+'">'+warnedUsers.length+'</div><div style="font-size:9px;color:var(--txt3)">忠告済み</div></div>';
  h+='<div style="text-align:center;padding:10px;background:var(--surf2);border-radius:8px"><div style="font-size:18px;font-weight:800;color:'+(suspUsers.length?'var(--red)':'var(--grn)')+'">'+suspUsers.length+'</div><div style="font-size:9px;color:var(--txt3)">停止中</div></div>';
  h+='</div>';

  // 停止中ユーザー
  if(suspUsers.length){
    h+='<div style="padding:10px;background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.12);border-radius:10px">';
    h+='<div style="font-size:12px;font-weight:700;color:var(--red);margin-bottom:6px">🚫 停止中のアカウント</div>';
    suspUsers.forEach(function(uid){
      var info=(DB.suspendedUsers||{})[uid]||{};
      var name=uid;
      // ユーザー名検索
      var u=_getUsers().find(function(x){return x.id===uid;});
      if(u)name=u.name;
      h+='<div style="display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid rgba(239,68,68,.08)">';
      h+='<span style="font-size:12px;font-weight:600;flex:1">'+name+'</span>';
      h+='<span style="font-size:9px;color:var(--txt3)">'+info.reason+'</span>';
      h+='<span style="font-size:9px;color:var(--red)">'+(info.until==='permanent'?'永久':'〜'+(info.until||'').slice(0,10))+'</span>';
      h+='<button class="btn btn-ghost btn-xs" style="font-size:9px" onclick="adminUnsuspendUser(\''+uid+'\');closeM();">解除</button>';
      h+='</div>';
    });
    h+='</div>';
  }

  // 全会話一覧
  h+='<div><div style="font-size:12px;font-weight:700;margin-bottom:6px">💬 全会話一覧</div>';
  h+='<div style="max-height:180px;overflow-y:auto">';
  allRooms.sort(function(a,b){return (b[1].msgs||[]).length-(a[1].msgs||[]).length;}).forEach(function(e){
    var rk=e[0],ch=e[1];
    var mc=(ch.msgs||[]).length;
    var lastMsg=(ch.msgs||[]).slice(-1)[0];
    h+='<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--b1);cursor:pointer" onclick="closeM();activeRoom=\''+rk+'\';goTo(\'chat\')">';
    h+='<span style="font-size:16px">'+ch.avi+'</span>';
    h+='<div style="flex:1"><div style="font-size:11px;font-weight:600">'+(ch.name||rk)+'</div>';
    h+='<div style="font-size:9px;color:var(--txt3)">'+mc+'件 · 最終: '+(lastMsg?.name||'')+'</div></div>';
    h+='<i class="fa fa-chevron-right" style="font-size:9px;color:var(--txt3)"></i>';
    h+='</div>';
  });
  h+='</div></div>';

  // 最近のメッセージ
  h+='<div><div style="font-size:12px;font-weight:700;margin-bottom:6px">📋 最新メッセージ（全ルーム）</div>';
  h+='<div style="max-height:200px;overflow-y:auto">';
  recentMsgs.slice(0,20).forEach(function(r){
    var m=r.msg;
    var isSusp=(DB.suspendedUsers||{})[m.from]?.suspended;
    h+='<div style="display:flex;align-items:flex-start;gap:6px;padding:5px 0;border-bottom:1px solid var(--b1)'+(m.adminDeleted?';opacity:.4':'')+'">';
    h+='<div style="flex:1;min-width:0">';
    h+='<div style="font-size:9px;color:var(--txt3)"><b>'+(m.name||'?')+'</b>'+(isSusp?' <span style="color:var(--red)">[停止中]</span>':'')+' in '+r.roomName+' · '+m.time+'</div>';
    h+='<div style="font-size:11px;color:var(--txt1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+sanitize(m.text||'',60)+'</div>';
    h+='</div>';
    if(!m.deleted&&!m.adminDeleted){
      h+='<button class="btn btn-ghost btn-xs" style="font-size:9px;color:var(--red);flex-shrink:0" onclick="closeM();adminDeleteMsg(\''+r.roomKey+'\','+r.idx+')">削除</button>';
      h+='<button class="btn btn-ghost btn-xs" style="font-size:9px;color:#f59e0b;flex-shrink:0" onclick="closeM();adminWarnUser(\''+r.roomKey+'\','+r.idx+')">忠告</button>';
    }
    h+='</div>';
  });
  h+='</div></div>';

  // モデレーション履歴
  if(modLog.length){
    h+='<div><div style="font-size:12px;font-weight:700;margin-bottom:6px">📜 モデレーション履歴</div>';
    modLog.slice(-10).reverse().forEach(function(l){
      var icon=l.type==='delete'?'🗑️':l.type==='warn'?'⚠️':l.type==='suspend'?'🚫':'🧹';
      var label=l.type==='delete'?'削除':l.type==='warn'?'忠告':l.type==='suspend'?'停止':'全削除';
      h+='<div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:10px;border-bottom:1px solid var(--b1)">';
      h+='<span>'+icon+'</span><span style="font-weight:700">'+label+'</span>';
      h+='<span style="flex:1;color:var(--txt3)">'+(l.userName||'')+(l.originalText?' 「'+l.originalText.slice(0,20)+'…」':'')+'</span>';
      h+='<span style="color:var(--txt3)">'+(l.date||'').slice(0,10)+'</span>';
      h+='</div>';
    });
    h+='</div>';
  }

  h+='</div>';
  openM('🛡️ メッセージ監視ダッシュボード', h, true);
}

function adminUnsuspendUser(uid){
  if(DB.currentUser?.role!=='admin'){toast('管理者権限が必要です','e');return;}
  if(DB.suspendedUsers&&DB.suspendedUsers[uid]){
    DB.suspendedUsers[uid].suspended=false;
    if(!DB.moderationLog)DB.moderationLog=[];
    _dbArr('moderationLog').push({type:'unsuspend',userId:uid,date:new Date().toISOString()});
    saveDB();
    toast('アカウント停止を解除しました','s');
  }
}

function openAdminUserMgmt(){
  const allUsers=_getUsers();
  const roleLabels={admin:'事務局',team:'チーム',coach:'コーチ',player:'選手',parent:'保護者'};
  const roleColors={admin:'#ef4444',team:'#3b82f6',coach:'#f97316',player:'#00cfaa',parent:'#a855f7'};
  let h='<div style="margin-bottom:12px"><input class="input" placeholder="🔍 名前・メールで検索..." oninput="filterAdminUsers(this.value)" style="font-size:12px;height:36px"></div>';
  h+='<div id="admin-user-list" style="max-height:500px;overflow-y:auto">';
  const roleCounts={};
  allUsers.forEach(u=>{roleCounts[u.role]=(roleCounts[u.role]||0)+1;});
  h+='<div style="display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap">';
  Object.entries(roleCounts).forEach(([r,c])=>{
    h+='<span style="padding:3px 10px;border-radius:12px;background:'+(roleColors[r]||'#888')+'18;color:'+(roleColors[r]||'#888')+';font-size:11px;font-weight:700">'+(roleLabels[r]||r)+' '+c+'</span>';
  });
  h+='</div>';
  allUsers.forEach(u=>{
    const rc=roleColors[u.role]||'#888';
    h+='<div class="admin-user-row" data-name="'+(u.name||'').toLowerCase()+'" data-email="'+(u.email||'').toLowerCase()+'" style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--b1)">';
    h+='<div class="avi" style="background:'+rc+';width:30px;height:30px;font-size:11px;flex-shrink:0">'+((u.name||'?')[0])+'</div>';
    h+='<div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:700">'+sanitize(u.name||'--',20)+'</div><div style="font-size:10px;color:var(--txt3)">'+sanitize(u.email||'',24)+'</div></div>';
    h+='<span class="badge" style="background:'+rc+'18;color:'+rc+';font-size:9px">'+(roleLabels[u.role]||u.role)+'</span>';
    h+='</div>';
  });
  h+='</div>';
  openM('👥 ユーザー管理 ('+allUsers.length+'名)', h, true);
}
function filterAdminUsers(q){
  const rows=document.querySelectorAll('.admin-user-row');
  const query=q.toLowerCase();
  rows.forEach(r=>{
    const name=r.getAttribute('data-name')||'';
    const email=r.getAttribute('data-email')||'';
    r.style.display=(name.includes(query)||email.includes(query))?'flex':'none';
  });
}

function sendBroadcastMsg(){
  if(DB.currentUser?.role!=='admin'){toast('権限がありません','e');return;}
  const inp=document.getElementById('broadcast-msg');
  const msg=(inp?.value||'').trim();
  if(!msg){toast('メッセージを入力してください','e');return;}
  // g1チャットに追加
  const ch=DB.chats['g1'];
  if(ch){
    const now=new Date();
    const time=now.getHours().toString().padStart(2,'0')+':'+now.getMinutes().toString().padStart(2,'0');
    ch.msgs.push({mid:_genMsgId(),from:'admin',name:'事務局',text:msg,time,date:new Date().toISOString().slice(0,10),read:false});
  }
  // 全ユーザーにnotif
  addNotif('📢 事務局より: '+msg.slice(0,40)+(msg.length>40?'…':''),'fa-bullhorn','chat');
  saveDB();
  if(inp) inp.value='';
  toast('全体連絡を送信しました','s');
}

