// 20-misc-export.js — Export, settings
function inventoryPage(){
  const team=getMyTeam();
  if(!team) return '<div class="pg-head"><div class="pg-title">物品管理</div></div>'+emptyState('📦','チーム情報が未設定です','プロフィール設定からチーム情報を登録してください','プロフィールを設定する',"goTo('profile-settings')");
  if(!DB.inventory)DB.inventory=[];
  const items=_dbArr('inventory').filter(x=>x.teamId===team.id&&!x.deleted);

  // カテゴリ集計
  const catF=window._invCat||'all';
  const q=(window._invQ||'').toLowerCase().trim();
  const catMap={};
  items.forEach(x=>{const c=x.category||'未分類';if(!catMap[c])catMap[c]={count:0,qty:0,val:0};catMap[c].count++;catMap[c].qty+=(x.qty||0);catMap[c].val+=(x.qty||0)*(x.price||0);});
  const catEntries=Object.entries(catMap);

  // フィルタ
  let filtered=[...items];
  if(catF!=='all') filtered=filtered.filter(x=>(x.category||'未分類')===catF);
  if(q) filtered=filtered.filter(x=>(x.name||'').toLowerCase().includes(q)||(x.note||'').toLowerCase().includes(q));
  filtered.sort((a,b)=>(a.category||'').localeCompare(b.category||'')||(a.name||'').localeCompare(b.name||''));

  // 集計
  const totalItems=items.length;
  const totalValue=items.reduce((s,x)=>s+(x.qty||0)*(x.price||0),0);
  const lowStock=items.filter(x=>x.minQty&&x.qty<=x.minQty);

  // カテゴリチップカラー
  const catColors={'ボール':'#3b82f6','ウェア':'#a855f7','シューズ':'#f59e0b','用具':'#10b981','設備':'#6366f1','医療品':'#ef4444','飲食':'#0891b2','その他':'var(--txt3)','未分類':'var(--txt3)'};
  const getCatCol=(c)=>catColors[c]||'var(--org)';

  // サマリー（3カラム・コンパクト）
  const summaryHTML=`<div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap">
    <div style="flex:1;min-width:90px;background:var(--surf);border:1px solid var(--b1);border-radius:12px;padding:12px 14px;text-align:center">
      <div style="font-size:22px;font-weight:800;font-family:Montserrat,sans-serif;color:var(--org)">${totalItems}</div>
      <div style="font-size:11px;color:var(--txt2);font-weight:600">品目</div>
    </div>
    <div style="flex:1;min-width:90px;background:var(--surf);border:1px solid var(--b1);border-radius:12px;padding:12px 14px;text-align:center">
      <div style="font-size:22px;font-weight:800;font-family:Montserrat,sans-serif;color:var(--teal)">¥${fmtNum(totalValue)}</div>
      <div style="font-size:11px;color:var(--txt2);font-weight:600">総額</div>
    </div>
    <div style="flex:1;min-width:90px;background:${lowStock.length?'rgba(239,68,68,.05)':'var(--surf)'};border:1px solid ${lowStock.length?'rgba(239,68,68,.2)':'var(--b1)'};border-radius:12px;padding:12px 14px;text-align:center">
      <div style="font-size:22px;font-weight:800;font-family:Montserrat,sans-serif;color:${lowStock.length?'#ef4444':'var(--grn)'}">${lowStock.length||'✓'}</div>
      <div style="font-size:11px;color:var(--txt2);font-weight:600">${lowStock.length?'在庫少':'在庫OK'}</div>
    </div>
  </div>`;

  // 在庫少アラート
  const alertHTML=lowStock.length?`<div style="background:rgba(239,68,68,.06);border:1.5px solid rgba(239,68,68,.2);border-radius:12px;padding:12px 16px;margin-bottom:14px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">
    <span style="font-size:13px;font-weight:700;color:#ef4444">⚠️ 在庫少:</span>
    ${lowStock.map(x=>`<span style="font-size:12px;padding:3px 10px;border-radius:6px;background:rgba(239,68,68,.08);color:#ef4444;cursor:pointer;font-weight:600" onclick="openInvDetail('${sanitize(x.id,50)}')">${sanitize(x.name,20)}(残${parseInt(x.qty)||0})</span>`).join('')}
  </div>`:'';

  // カテゴリフィルタチップ
  const catChipsHTML=catEntries.length?`<div style="display:flex;gap:6px;margin-bottom:14px;overflow-x:auto;padding-bottom:4px">
    <button onclick="window._invCat='all';refreshPage()" style="padding:5px 14px;border-radius:20px;border:1.5px solid ${catF==='all'?'var(--org)':'var(--bdr)'};background:${catF==='all'?'var(--org)':'var(--surf2)'};color:${catF==='all'?'#fff':'var(--txt2)'};font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap">すべて <span style="opacity:.7">${totalItems}</span></button>
    ${catEntries.map(([c,st])=>{
      const col=getCatCol(c);
      const active=catF===c;
      return `<button onclick="window._invCat='${c}';refreshPage()" style="padding:5px 14px;border-radius:20px;border:1.5px solid ${active?col:'var(--bdr)'};background:${active?col:'var(--surf2)'};color:${active?'#fff':'var(--txt2)'};font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap">${c} <span style="opacity:.7">${st.count}</span></button>`;
    }).join('')}
  </div>`:'';

  // 検索＋追加ボタン（1行）
  const searchHTML=`<div style="display:flex;gap:8px;margin-bottom:14px">
    <div style="flex:1;position:relative">
      <i class="fa fa-search" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--txt3);font-size:11px"></i>
      <input class="input" placeholder="検索…" value="${(window._invQ||'').replace(/"/g,'&quot;')}" oninput="window._invQ=this.value;refreshPage()" style="padding-left:32px;height:40px;font-size:14px">
    </div>
    <button class="btn btn-primary btn-sm" onclick="openInvAdd()" style="height:40px;white-space:nowrap;padding:0 18px;font-size:13px">＋ 追加</button>
  </div>`;

  // アイテムリスト（カテゴリ見出し付き）
  function listView(){
    if(!filtered.length) return `<div style="text-align:center;padding:40px">
      <div style="font-size:44px;margin-bottom:10px;opacity:.5">📦</div>
      <div class="fw7 mb-8" style="font-size:14px">${q||catF!=='all'?'該当する物品がありません':'物品をまだ登録していません'}</div>
      <div class="text-sm text-muted mb-16">「＋ 追加」ボタンから登録しましょう</div>
          </div>`;

    // カテゴリ別グループ化
    const groups={};
    filtered.forEach(x=>{const c=x.category||'未分類';if(!groups[c])groups[c]=[];groups[c].push(x);});

    return Object.entries(groups).map(([cat,list])=>{
      const col=getCatCol(cat);
      return `<div style="margin-bottom:16px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;padding:0 2px">
          <div style="width:6px;height:6px;border-radius:50%;background:${col}"></div>
          <span style="font-size:13px;font-weight:700;color:var(--txt2)">${cat}</span>
          <span style="font-size:11px;color:var(--txt3);opacity:.6">${list.length}件</span>
          <div style="flex:1;border-bottom:1px solid var(--b1)"></div>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px">${list.map(x=>{
          const val=(x.qty||0)*(x.price||0);
          const isLow=x.minQty&&x.qty<=x.minQty;
          return `<div style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:var(--surf);border:1px solid ${isLow?'rgba(239,68,68,.2)':'var(--b1)'};border-radius:10px;cursor:pointer" onclick="openInvDetail('${x.id}')">
            <div style="font-size:22px;flex-shrink:0">${x.icon||'📦'}</div>
            <div style="flex:1;min-width:0">
              <div style="font-size:14px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${sanitize(x.name,30)}${isLow?' <span style="color:#ef4444;font-size:11px">⚠</span>':''}</div>
              ${x.note?`<div style="font-size:12px;color:var(--txt2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px">${sanitize(x.note,35)}</div>`:''}
            </div>
            <div style="text-align:right;flex-shrink:0">
              <div style="font-size:17px;font-weight:800;font-family:Montserrat,sans-serif;color:${isLow?'#ef4444':'var(--txt1)'}">${x.qty||0}<span style="font-size:11px;color:var(--txt3);font-weight:400">${x.unit||'個'}</span></div>
              ${x.price?`<div style="font-size:11px;color:var(--org);font-weight:600">¥${fmtNum(val)}</div>`:''}
            </div>
          </div>`;
        }).join('')}</div>
      </div>`;
    }).join('');
  }

  return `<div class="pg-head"><div class="pg-title">📦 物品管理</div><div class="pg-sub">${team.name}の備品・グッズ</div></div>
  ${summaryHTML}${alertHTML}${catChipsHTML}${searchHTML}${listView()}`;
}
// 物品追加モーダル
function openInvAdd(editId){
  const team=getMyTeam();if(!team)return;
  const existing=editId?_dbArr('inventory').find(x=>x.id===editId):null;
  const title=existing?'物品を編集':'新規物品登録';
  // プリセットカテゴリ（アイコン自動割当）
  const presetCats=[
    {l:'ボール',ic:'⚽'},{l:'ウェア',ic:'🎽'},{l:'シューズ',ic:'👟'},{l:'用具',ic:'🔧'},
    {l:'設備',ic:'🥅'},{l:'医療品',ic:'🩹'},{l:'飲食',ic:'🧊'},{l:'その他',ic:'📦'}
  ];
  const curCat=existing?.category||'';
  openM(title,`<div>
    <div class="form-group"><label class="label">品名 *</label><input id="inv-name" class="input" value="${sanitize(existing?.name||'')}" placeholder="例: 練習用ボール" maxlength="50"></div>
    <div style="margin-bottom:14px">
      <div style="font-size:11px;font-weight:700;color:var(--txt3);margin-bottom:8px">カテゴリ</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px" id="inv-cat-chips">
        ${presetCats.map(c=>`<button type="button" onclick="document.querySelectorAll('#inv-cat-chips>button').forEach(b=>{b.style.background='var(--surf2)';b.style.color='var(--txt2)';b.style.borderColor='var(--bdr)'});this.style.background='var(--org)';this.style.color='#fff';this.style.borderColor='var(--org)';document.getElementById('inv-cat').value='${c.l}';document.getElementById('inv-icon').value='${c.ic}'" style="padding:6px 14px;border-radius:20px;border:1.5px solid ${curCat===c.l?'var(--org)':'var(--bdr)'};background:${curCat===c.l?'var(--org)':'var(--surf2)'};color:${curCat===c.l?'#fff':'var(--txt2)'};font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:5px;transition:all .15s">${c.ic} ${c.l}</button>`).join('')}
      </div>
      <input type="hidden" id="inv-cat" value="${sanitize(curCat)}">
      <input type="hidden" id="inv-icon" value="${existing?.icon||'📦'}">
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div class="form-group"><label class="label">数量 *</label><input id="inv-qty" class="input" type="number" min="0" max="99999" value="${existing?.qty||0}"></div>
      <div class="form-group"><label class="label">単位</label><input id="inv-unit" class="input" value="${sanitize(existing?.unit||'個')}" placeholder="個/本/セット" maxlength="6"></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div class="form-group"><label class="label">単価（円）</label><input id="inv-price" class="input" type="number" min="0" max="9999999" value="${existing?.price||0}" placeholder="0"></div>
      <div class="form-group"><label class="label">最小在庫アラート</label><input id="inv-min" class="input" type="number" min="0" max="99999" value="${existing?.minQty||0}" placeholder="0=なし"></div>
    </div>
    <div class="form-group"><label class="label">メモ</label><input id="inv-note" class="input" value="${sanitize(existing?.note||'')}" placeholder="保管場所・購入先など" maxlength="200"></div>
    <div style="display:flex;gap:10px;margin-top:14px">
      <button class="btn btn-primary" style="flex:1" onclick="saveInvItem('${editId||''}')">${existing?'✓ 更新':'＋ 登録'}</button>
      <button class="btn btn-ghost" onclick="closeM()">キャンセル</button>
    </div>
  </div>`);
}

function saveInvItem(editId){
  const team=getMyTeam();if(!team)return;
  const name=(document.getElementById('inv-name')?.value||'').trim();
  if(!name){toast('品名を入力してください','e');return;}
  const icon=document.getElementById('inv-icon')?.value||'📦';
  const cat=(document.getElementById('inv-cat')?.value||'').trim();
  const unit=(document.getElementById('inv-unit')?.value||'個').trim();
  const qty=Math.max(0,parseInt(document.getElementById('inv-qty')?.value)||0);
  const price=Math.max(0,parseInt(document.getElementById('inv-price')?.value)||0);
  const minQty=Math.max(0,parseInt(document.getElementById('inv-min')?.value)||0);
  const note=(document.getElementById('inv-note')?.value||'').trim();
  const now=new Date().toISOString();

  if(editId){
    const item=_dbArr('inventory').find(x=>x.id===editId);
    if(!item){toast('物品が見つかりません','e');return;}
    const oldQty=item.qty;
    Object.assign(item,{name:sanitize(name,50),icon,category:sanitize(cat,20),unit:sanitize(unit,6),qty,price,minQty,note:sanitize(note,200),updatedAt:now});
    if(oldQty!==qty){
      if(!item.history)item.history=[];
      item.history.push({date:now.slice(0,10),from:oldQty,to:qty,by:DB.currentUser?.name||'管理者'});
    }
    toast(name+'を更新しました','s');
  } else {
    _dbArr('inventory').push({
      id:'inv'+Date.now(),teamId:team.id,name:sanitize(name,50),icon,category:sanitize(cat,20),unit:sanitize(unit,6),qty,price,minQty,note:sanitize(note,200),
      createdAt:now,updatedAt:now,deleted:false,history:[{date:now.slice(0,10),from:0,to:qty,by:DB.currentUser?.name||'管理者'}]
    });
    toast(name+'を登録しました','s');
  }
  saveDB();closeM();refreshPage();
}

// 物品詳細モーダル
function openInvDetail(id){
  const x=_dbArr('inventory').find(i=>i.id===id);
  if(!x){toast('物品が見つかりません','e');return;}
  const val=(x.qty||0)*(x.price||0);
  const isLow=x.minQty&&x.qty<=x.minQty;
  const hist=(x.history||[]).slice(-8).reverse();
  openM(x.icon+' '+x.name,`<div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1px;background:var(--b1);border-radius:12px;overflow:hidden;margin-bottom:16px">
      <div style="background:var(--surf);padding:14px;text-align:center">
        <div style="font-size:24px;font-weight:800;color:${isLow?'#ef4444':'var(--txt1)'};font-family:Montserrat,sans-serif">${x.qty||0}<span style="font-size:12px;color:var(--txt3);font-weight:400">${x.unit||'個'}</span></div>
        <div style="font-size:10px;color:var(--txt3);margin-top:2px">${isLow?'⚠️ 在庫少':'在庫数'}</div>
      </div>
      <div style="background:var(--surf);padding:14px;text-align:center">
        <div style="font-size:24px;font-weight:800;color:var(--org);font-family:Montserrat,sans-serif">${x.price?'¥'+fmtNum(x.price):'--'}</div>
        <div style="font-size:10px;color:var(--txt3);margin-top:2px">単価</div>
      </div>
      <div style="background:var(--surf);padding:14px;text-align:center">
        <div style="font-size:24px;font-weight:800;color:var(--teal);font-family:Montserrat,sans-serif">${val?'¥'+fmtNum(val):'--'}</div>
        <div style="font-size:10px;color:var(--txt3);margin-top:2px">資産額</div>
      </div>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px">
      ${x.category?`<span style="font-size:11px;padding:3px 10px;border-radius:8px;background:var(--org)10;color:var(--org)">📂 ${x.category}</span>`:''}
      ${x.minQty?`<span style="font-size:11px;padding:3px 10px;border-radius:8px;background:var(--surf2);color:var(--txt3)">最小在庫: ${x.minQty}${x.unit||'個'}</span>`:''}
    </div>
    ${x.note?`<div style="font-size:13px;color:var(--txt2);line-height:1.7;padding:12px 14px;background:var(--surf2);border-radius:10px;margin-bottom:14px">${sanitize(x.note,200)}</div>`:''}

    <!-- 数量クイック変更 -->
    <div style="background:var(--surf2);border-radius:12px;padding:14px;margin-bottom:14px">
      <div style="font-size:12px;font-weight:700;color:var(--txt3);margin-bottom:10px">📊 数量を変更</div>
      <div style="display:flex;align-items:center;gap:8px;justify-content:center">
        <button class="btn btn-ghost btn-sm" onclick="invAdjustQty('${x.id}',-10)" style="min-width:40px">-10</button>
        <button class="btn btn-ghost btn-sm" onclick="invAdjustQty('${x.id}',-1)" style="min-width:40px;font-size:18px">−</button>
        <div style="font-size:28px;font-weight:900;min-width:60px;text-align:center;font-family:Montserrat,sans-serif" id="inv-qty-display-${x.id}">${x.qty||0}</div>
        <button class="btn btn-ghost btn-sm" onclick="invAdjustQty('${x.id}',1)" style="min-width:40px;font-size:18px">＋</button>
        <button class="btn btn-ghost btn-sm" onclick="invAdjustQty('${x.id}',10)" style="min-width:40px">+10</button>
      </div>
    </div>

    <!-- 変更履歴 -->
    ${hist.length?`<div style="margin-bottom:14px">
      <div style="font-size:12px;font-weight:700;color:var(--txt3);margin-bottom:8px">📋 変更履歴</div>
      <div style="max-height:140px;overflow-y:auto">${hist.map(h=>`<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--b1);font-size:12px">
        <span style="color:var(--txt3);min-width:70px">${h.date?.slice(5)||''}</span>
        <span style="color:var(--txt3)">${h.from}</span>
        <span style="color:var(--org)">→</span>
        <span class="fw7">${h.to}</span>
        <span style="color:var(--txt3);margin-left:auto;font-size:11px">${h.by||''}</span>
      </div>`).join('')}</div>
    </div>`:''}

    <div style="display:flex;gap:8px;margin-top:14px">
      <button class="btn btn-ghost" style="flex:1" onclick="closeM();openInvAdd('${x.id}')"><i class="fa fa-edit"></i> 編集</button>
      <button class="btn btn-ghost" style="color:#ef4444;border-color:rgba(239,68,68,.3)" onclick="invDelete('${x.id}')"><i class="fa fa-trash"></i> 削除</button>
      <button class="btn btn-ghost" onclick="closeM()">閉じる</button>
    </div>
  </div>`);
}

function invAdjustQty(id,delta){
  const item=_dbArr('inventory').find(x=>x.id===id);
  if(!item)return;
  const oldQty=item.qty||0;
  item.qty=Math.max(0,oldQty+delta);
  item.updatedAt=new Date().toISOString();
  if(!item.history)item.history=[];
  item.history.push({date:new Date().toISOString().slice(0,10),from:oldQty,to:item.qty,by:DB.currentUser?.name||'管理者'});
  saveDB();
  const el=document.getElementById('inv-qty-display-'+id);
  if(el){
    el.textContent=item.qty;
    el.style.color=item.minQty&&item.qty<=item.minQty?'#ef4444':'var(--txt1)';
    el.style.transition='transform .15s';el.style.transform='scale(1.2)';
    setTimeout(()=>{el.style.transform='scale(1)';},150);
  }
}

function invDelete(id){
  const item=_dbArr('inventory').find(x=>x.id===id);
  if(!item)return;
  item.deleted=true;item.updatedAt=new Date().toISOString();
  saveDB();closeM();toast(item.name+'を削除しました','s');refreshPage();
}

// デモデータ
function invLoadDemo(){
  // 本番環境: サンプルデータ機能は無効
  toast('物品は「＋追加」ボタンから登録してください','i');
}

function teamMatchPage(){
  // マッチングデータをFirestoreから最新化
  _pollFirestoreUpdates();
  const my=getMyTeam();
  if(!my) return '<div class="pg-head"><div class="pg-title">チームマッチング</div></div>'+emptyState('🏟️','チーム情報が未設定です','プロフィール設定でチーム情報を登録してください','設定する',"goTo('profile-settings')");
  if(!DB.teamMatches)DB.teamMatches=[];
  if(!DB.teamEvents)DB.teamEvents=[];
  const others=DB.teams.filter(t=>t.id!==my.id&&t.matchAvailable!==false);
  const allM=_dbArr('teamMatches').filter(m=>m.teamAId===my.id||m.teamBId===my.id);
  const inbox=allM.filter(m=>m.status==='pending'&&m.teamBId===my.id);
  const sent=allM.filter(m=>m.status==='pending'&&m.teamAId===my.id);
  const matched=allM.filter(m=>m.status==='matched');
  const myEvents=_dbArr('teamEvents').filter(e=>e.teamAId===my.id||e.teamBId===my.id);
  const activeEv=myEvents.filter(e=>e.status==='confirmed'||e.status==='pending');
  const doneEv=myEvents.filter(e=>e.status==='completed'||e.status==='cancelled');
  const tab=window._tmTab||'teams';
  const q=(window._tmQ||'').toLowerCase();
  const sf=window._tmSport||'all';
  const sports=[...new Set(others.map(t=>t.sport).filter(Boolean))];

  // ── 相性スコア計算 ──
  function compat(t){
    let s=0;var reasons=[];
    if((t.sport||'')===(my.sport||'')){s+=35;reasons.push('同じ種目');}
    if(t.area&&my.area){
      if(t.area.includes(my.area.slice(0,3))){s+=20;reasons.push('近いエリア');}
      else if(t.area.slice(0,3)===my.area.slice(0,3)){s+=10;reasons.push('同じ都道府県');}
    }
    if(t.ageGroup&&my.ageGroup){
      const a1=t.ageGroup.match(/U-(\d+)/g)||[],a2=my.ageGroup.match(/U-(\d+)/g)||[];
      if(a1.some(a=>a2.includes(a))){s+=25;reasons.push('同カテゴリ');}
    }
    const pc=DB.players.filter(p=>p.team===t.id).length||t.memberCount||0;
    const myPc=DB.players.filter(p=>p.team===my.id).length||my.memberCount||0;
    if(myPc>0&&pc>0&&Math.abs(pc-myPc)<=5){s+=10;reasons.push('人数が近い');}
    // Level match bonus
    if(t.teamLevel&&my.teamLevel){
      var lvls=['初級','中級','上級'];
      var ti=lvls.indexOf(t.teamLevel),mi=lvls.indexOf(my.teamLevel);
      if(ti>=0&&mi>=0&&Math.abs(ti-mi)<=1){s+=10;reasons.push('レベルが近い');}
    }
    // Available days overlap
    if(t.matchDays&&my.matchDays){
      var daySet=['月','火','水','木','金','土','日','祝'];
      var td=daySet.filter(d=>(t.matchDays||'').includes(d));
      var md=daySet.filter(d=>(my.matchDays||my.practiceDays||'').includes(d));
      var overlap=td.filter(d=>md.includes(d));
      if(overlap.length>=2){s+=10;reasons.push('対戦可能日が合う');}
      else if(overlap.length>=1){s+=5;reasons.push('日程1日重複');}
    }
    t._compatReasons=reasons;
    t._compatScore=Math.min(100,s);
    return Math.min(100,s);
  }

  let list=[...others];
  if(q) list=list.filter(t=>(t.name||'').toLowerCase().includes(q)||(t.sport||'').toLowerCase().includes(q)||(t.area||'').toLowerCase().includes(q));
  if(sf!=='all') list=list.filter(t=>(t.sport||'').includes(sf));
  // Smart filter chips
  const flv=window._tmLevel||'';const far=window._tmArea||'';const fag=window._tmAge||'';
  if(flv) list=list.filter(t=>(t.teamLevel||'').includes(flv));
  if(far) list=list.filter(t=>(t.area||'').includes(far));
  if(fag) list=list.filter(t=>(t.ageGroup||'').includes(fag));
  var sortMode=window._tmSort||'compat';
  if(sortMode==='new') list.sort((a,b)=>_tmDaysAgo(a)-_tmDaysAgo(b));
  else if(sortMode==='members') list.sort((a,b)=>(DB.players.filter(p=>p.team===b.id).length||b.memberCount||0)-(DB.players.filter(p=>p.team===a.id).length||a.memberCount||0));
  else list.sort((a,b)=>compat(b)-compat(a));

  // ── おすすめチーム（上位3件） ──
  const recommended=list.filter(t=>{
    const ex=allM.find(m=>(m.teamAId===t.id||m.teamBId===t.id)&&(m.status==='pending'||m.status==='matched'));
    return !ex && compat(t)>=40;
  }).slice(0,3);

  // ── チームカード（v2） ──
  const teamCards=list.map(t=>{
    const ex=allM.find(m=>(m.teamAId===t.id||m.teamBId===t.id)&&(m.status==='pending'||m.status==='matched'));
    const cp=compat(t);
    const pc=DB.players.filter(p=>p.team===t.id).length||t.memberCount||0;
    const winRate=0; // unused
    const reviews=[];
    const avg=t.rating||0;
    let badge='';
    if(ex?.status==='matched') badge=`<div class="tm-badge" style="background:rgba(0,212,170,.12);color:var(--teal)">✓ マッチ済</div>`;
    else if(ex?.status==='pending'&&ex.teamAId===my.id) badge=`<div class="tm-badge" style="background:rgba(249,115,22,.12);color:var(--org)">申請中</div>`;
    else if(ex?.status==='pending'&&ex.teamBId===my.id) badge=`<div class="tm-badge" style="background:var(--org);color:#fff">📩 受信</div>`;
    const cpColor=cp>=60?'#10b981':cp>=30?'#f59e0b':'#94a3b8';
    const cpBg=cp>=60?'rgba(16,185,129,.12)':cp>=30?'rgba(245,158,11,.12)':'rgba(148,163,184,.12)';

    return `<div class="tm-card" onclick="openTeamProfile('${t.id}')">
      ${badge}
      <div class="tm-card-head">
        <div class="tm-card-avi" style="background:${t.color||'#2563eb'}">
          ${(t.name||'?')[0]}
          <div class="tm-compat" style="background:${cpBg};color:${cpColor}">${cp}</div>
        </div>
        <div class="tm-card-info">
          <div class="tm-card-name">${sanitize(t.name,22)}</div>
          <div class="tm-card-meta">
            <span style="color:${t.color||'var(--blue)'};font-weight:700">${sanitize(t.sport||'',12)}</span>
            <span>📍 ${sanitize(t.area||'未設定',14)}</span>
            ${t.teamLevel?`<span style="color:var(--teal);font-weight:600">${t.teamLevel}</span>`:''}
          </div>
        </div>
      </div>
      ${t.matchMessage?`<div class="tm-card-desc" style="color:var(--org);font-weight:600;font-style:italic">"${sanitize(t.matchMessage,80)}"</div>`:''}
      <div class="tm-card-tags">
        ${t.ageGroup?`<span class="tm-tag">🎯 ${sanitize(t.ageGroup,12)}</span>`:''}
        ${t.teamLevel?`<span class="tm-tag">📊 ${sanitize(t.teamLevel,8)}</span>`:''}
        ${t.practiceDays?`<span class="tm-tag">📅 ${sanitize(t.practiceDays,10)}</span>`:''}
        ${t.matchDays?`<span class="tm-tag" style="background:rgba(249,115,22,.08);color:var(--org)">⚡ ${sanitize(t.matchDays,10)}対戦可</span>`:''}
      </div>
      ${(t._compatReasons||[]).length?`<div style="padding:0 16px 10px;display:flex;gap:4px;flex-wrap:wrap">${(t._compatReasons||[]).map(r=>`<span style="font-size:9px;padding:2px 6px;border-radius:4px;background:rgba(0,207,170,.06);color:var(--teal);font-weight:600">✓ ${r}</span>`).join('')}</div>`:``}
      <div class="tm-card-stats" style="grid-template-columns:repeat(4,1fr)">
        <div><div class="tm-cs-n">${pc}</div><div class="tm-cs-l">部員数</div></div>
        <div><div class="tm-cs-n">${t.teamLevel||'−'}</div><div class="tm-cs-l">レベル</div></div>
        <div><div class="tm-cs-n">${t.matchDays||t.practiceDays||'−'}</div><div class="tm-cs-l">対戦可能日</div></div>
        <div><div class="tm-cs-n" style="font-size:10px;color:${_tmDaysAgo(t)<=7?'var(--teal)':_tmDaysAgo(t)<=30?'var(--org)':'var(--txt3)'}">${_tmActiveLabel(t)}</div><div class="tm-cs-l">最終活動</div></div>
      </div>
      <div class="tm-card-action">
        ${ex?.status==='matched'
          ?`<button class="btn btn-primary btn-sm" style="flex:1" onclick="event.stopPropagation();openNewEventForm('${t.id}')">🏟️ 試合・練習を依頼</button>
             <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();const ck=Object.keys(DB.chats).find(k=>DB.chats[k].type==='team_match'&&(DB.chats[k].teamAId==='${t.id}'||DB.chats[k].teamBId==='${t.id}'));if(ck){activeRoom=ck;goTo('chat')}">💬</button>`
          :ex?.status==='pending'
            ?`<button class="btn btn-ghost btn-sm w-full" disabled style="opacity:.6">⏳ 承認待ち</button>`
            :`<button class="btn btn-primary btn-sm" style="flex:1" onclick="event.stopPropagation();openTeamProfile('${t.id}')">詳しく見る →</button>
               <button class="btn btn-ghost btn-sm" style="color:var(--org)" onclick="event.stopPropagation();_quickMatch('${t.id}')" title="ワンタップ申請">⚡</button>`}
      </div>
    </div>`;
  }).join('');

  // ── 受信カード ──
  const inboxCards=inbox.map(m=>{
    const ot=_tmOtherT(m);if(!ot)return '';
    const cp=compat(ot);
    const pc=DB.players.filter(p=>p.team===ot.id).length||ot.memberCount||0;
    return `<div class="tm-inbox-card">
      <div style="display:flex;gap:14px;align-items:flex-start;margin-bottom:14px">
        <div class="tm-card-avi" style="background:${ot.color||'var(--org)'};width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;color:#fff;flex-shrink:0">${(ot.name||'?')[0]}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:16px;font-weight:800;margin-bottom:3px">${sanitize(ot.name,22)}</div>
          <div style="font-size:12px;color:var(--txt3);display:flex;gap:8px;flex-wrap:wrap">
            <span style="color:${ot.color||'var(--org)'};font-weight:700">${sanitize(ot.sport||'',10)}</span>
            <span>📍 ${sanitize(ot.area||'',14)}</span>
            <span>👥 ${pc}名</span>
            ${ot.teamLevel?`<span style="color:var(--teal);font-weight:600">${ot.teamLevel}</span>`:''}
          </div>
        </div>
        <div style="text-align:center;min-width:44px">
          <div style="width:44px;height:44px;border-radius:50%;background:${cp>=60?'rgba(16,185,129,.1)':'rgba(245,158,11,.1)'};display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;color:${cp>=60?'#10b981':'#f59e0b'};font-family:'Montserrat',sans-serif">${cp}</div>
          <div style="font-size:8px;color:var(--txt3);margin-top:2px">相性</div>
        </div>
      </div>
      ${ot.description?`<div style="font-size:12px;color:var(--txt2);line-height:1.6;margin-bottom:12px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${sanitize(ot.description,120)}</div>`:''}
      ${m.msg?`<div style="font-size:12px;color:var(--txt3);background:var(--surf2);border-radius:10px;padding:10px 12px;margin-bottom:14px;border-left:3px solid var(--org)">💬 ${sanitize(m.msg,200)}</div>`:''}
      <div style="display:flex;gap:8px">
        <button class="btn btn-primary btn-sm" style="flex:1" onclick="acceptTeamMatch('${m.id}')">✓ 承認してつながる</button>
        <button class="btn btn-ghost btn-sm" onclick="openTeamProfile('${ot.id}')">詳細</button>
        <button class="btn btn-ghost btn-sm" style="color:var(--txt3)" onclick="rejectTeamMatch('${m.id}')">辞退</button>
      </div>
    </div>`;
  }).join('');

  // ── マッチ済み ──
  const matchedCards=matched.map(m=>{
    const ot=_tmOtherT(m);if(!ot)return '';
    const evCount=_dbArr('teamEvents').filter(e=>(e.matchId===m.id)&&(e.status==='confirmed'||e.status==='pending')).length;
    return `<div style="display:flex;align-items:center;gap:14px;padding:16px;border-bottom:1px solid var(--b1);cursor:pointer" onclick="openTeamProfile('${ot.id}')">
      <div style="width:44px;height:44px;border-radius:12px;background:${ot.color||'var(--teal)'};display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;color:#fff;flex-shrink:0">${(ot.name||'?')[0]}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:14px;font-weight:700">${sanitize(ot.name,20)}</div>
        <div style="font-size:11px;color:var(--txt3)">${sanitize(ot.sport||'',8)} · ${sanitize(ot.area||'',10)}${ot.teamLevel?' · '+ot.teamLevel:''}</div>
      </div>
      <div style="display:flex;gap:6px;flex-shrink:0">
        ${evCount?`<span style="font-size:10px;padding:3px 8px;border-radius:6px;background:var(--org)12;color:var(--org);font-weight:700">予定${evCount}件</span>`:''}
        <button class="btn btn-primary btn-xs" onclick="event.stopPropagation();openNewEventForm('${ot.id}')">🏟️ 依頼</button>
        <button class="btn btn-ghost btn-xs" onclick="event.stopPropagation();const ck=Object.keys(DB.chats).find(k=>DB.chats[k].matchId==='${m.id}')||'tm_${m.id}';activeRoom=ck;goTo('chat')">💬</button>
      </div>
    </div>`;
  }).join('');

  // ── イベント ──
  const evRows=activeEv.sort((a,b)=>(a.date||'')>(b.date||'')?1:-1).map(e=>{
    const ot=DB.teams.find(t=>t.id===(e.teamAId===my.id?e.teamBId:e.teamAId));
    const d=e.date?Math.round((new Date(e.date)-new Date())/864e5):null;
    const past=d!==null&&d<0;
    const isUrgent=d!==null&&d>=0&&d<=3;
    const statusIcon=e.status==='confirmed'?'✅':e.status==='pending'?'⏳':'📋';
    return `<div style="padding:14px;border-bottom:1px solid var(--b1);${past?'opacity:.5':''}${isUrgent?'background:rgba(249,115,22,.02)':''}">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
        ${d!==null&&d>=0?`<div style="text-align:center;min-width:44px;padding:8px 4px;background:${isUrgent?'var(--org)':'var(--surf2)'};border-radius:10px"><div style="font-size:18px;font-weight:800;color:${isUrgent?'#fff':'var(--txt1)'};font-family:'Montserrat',sans-serif">${d}</div><div style="font-size:8px;color:${isUrgent?'rgba(255,255,255,.7)':'var(--txt3)'}">日後</div></div>`
        :`<div style="min-width:44px;text-align:center;font-size:10px;color:var(--txt3)">終了</div>`}
        <div style="flex:1;min-width:0">
          <div style="font-size:14px;font-weight:700">${statusIcon} ${sanitize(e.purpose||'',12)} vs ${sanitize(ot?.name||'?',15)}</div>
          <div style="font-size:11px;color:var(--txt3);margin-top:2px">
            📅 ${e.date||'日程未定'}${e.time?' · '+e.time:''}
            ${e.place?'<br>📍 '+sanitize(e.place,20):''}
            ${e.headcount?' · 👥 '+e.headcount+'名':''}
            ${e.category?' · 🎯 '+e.category:''}
          </div>
        </div>
      </div>
      <div style="display:flex;gap:6px;margin-left:54px">
        <button class="btn btn-ghost btn-xs" onclick="openEventDetail('${e.id}')">📋 詳細</button>
        ${e.status==='pending'&&e.teamBId===my.id?`<button class="btn btn-primary btn-xs" onclick="confirmTeamEvent('${e.id}')">承認</button><button class="btn btn-ghost btn-xs" style="color:var(--txt3)" onclick="cancelTeamEvent('${e.id}')">辞退</button>`:''}
        ${!past&&e.status==='confirmed'?`<button class="btn btn-primary btn-xs" onclick="completeTeamEvent('${e.id}')">✅ 完了</button>`:''}
        ${e.status==='confirmed'||e.status==='pending'?`<button class="btn btn-ghost btn-xs" onclick="const mk=_dbArr('teamMatches').find(m=>m.id==='${e.matchId}');if(mk){const ck=Object.keys(DB.chats).find(k=>DB.chats[k].matchId==='${e.matchId}')||'tm_${e.matchId}';activeRoom=ck;goTo('chat');}">💬 調整</button>`:''}
      </div>
    </div>`;
  }).join('');

  // ── タブ ──
  const tabs=[
    {k:'teams',l:'チーム探す',i:'fa-search',c:list.length},
    {k:'inbox',l:'受信',i:'fa-inbox',c:inbox.length,alert:true},
    {k:'matched',l:'つながり',i:'fa-handshake',c:matched.length},
    {k:'events',l:'予定',i:'fa-calendar',c:activeEv.length},
    {k:'history',l:'履歴',i:'fa-history',c:doneEv.length},
  ];

  return `
  ${_tmOnboardingNeeded(my)?`<div style="padding:18px;background:linear-gradient(135deg,rgba(249,115,22,.06),rgba(37,99,235,.04));border:2px dashed var(--org);border-radius:14px;margin-bottom:14px;position:relative">
    <button onclick="dismissTmOnboard()" style="position:absolute;top:8px;right:10px;background:none;border:none;color:var(--txt3);font-size:16px;cursor:pointer;padding:4px" title="閉じる">&times;</button>
    <div style="font-size:15px;font-weight:800;color:var(--org);margin-bottom:6px">🚀 マッチングプロフィールを完成させよう！</div>
    <div style="font-size:12px;color:var(--txt2);margin-bottom:10px;line-height:1.6">募集メッセージや対戦可能日を設定すると、他チームからの申請が<b style="color:var(--org)">3倍</b>増えます。</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">${_tmOnboardingChecklist(my)}</div>
    <button class="btn btn-primary btn-sm" onclick="goTo('team-profile-edit')">⚡ プロフィールを設定する</button>
  </div>`:``}
  <div class="tm-hero">
    <div class="tm-hero-title">チームマッチング</div>
    <div class="tm-hero-sub">${sanitize(my.name,20)} · ${sanitize(my.sport||'',10)} · ${sanitize(my.area||'',12)}</div>
    <div class="tm-hero-stats">
      <div><div class="tm-stat-n">${matched.length}</div><div class="tm-stat-l">つながり</div></div>
      <div><div class="tm-stat-n">${activeEv.length}</div><div class="tm-stat-l">予定</div></div>
      <div><div class="tm-stat-n" style="color:${inbox.length?'#fbbf24':'inherit'}">${inbox.length}</div><div class="tm-stat-l">${inbox.length?'📩 受信':'受信'}</div></div>
      <div onclick="window._tmTab='teams';goTo('team-match')" style="cursor:pointer"><div class="tm-stat-n">${others.length}</div><div class="tm-stat-l">チーム探す</div></div>
    </div>
    <div style="margin-top:12px;display:flex;gap:6px;position:relative">
      <button onclick="window._tmTab='teams';goTo('team-match')" style="padding:6px 14px;border-radius:20px;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.25);color:#fff;font-size:11px;font-weight:600;cursor:pointer;backdrop-filter:blur(4px)">🔍 チームを探す</button>
      ${my.matchMessage?'':`<button onclick="goTo('team-profile-edit')" style="padding:6px 14px;border-radius:20px;background:rgba(249,115,22,.2);border:1px solid rgba(249,115,22,.3);color:#fbbf24;font-size:11px;font-weight:600;cursor:pointer">⚡ 募集メッセージを設定</button>`}
    </div>
  </div>

  ${inbox.length?`<div class="tm-rec-banner" onclick="window._tmTab='inbox';goTo('team-match')" style="cursor:pointer;border-color:var(--org)">
    <div style="width:40px;height:40px;border-radius:12px;background:var(--org);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">📩</div>
    <div style="flex:1"><div style="font-weight:700;font-size:14px;color:var(--org)">${inbox.length}件のマッチング申請</div><div style="font-size:11px;color:var(--txt3)">相手チームがあなたとの対戦を希望しています</div></div>
    <span style="color:var(--org);font-size:13px;font-weight:700">確認 →</span>
  </div>`:''}

  <div style="display:flex;gap:0;border-bottom:2px solid var(--b1);margin-bottom:16px;overflow-x:auto">
    ${tabs.map(t=>`<button onclick="window._tmTab='${t.k}';goTo('team-match')" style="padding:11px 14px;background:none;border:none;cursor:pointer;font-size:12px;font-weight:${tab===t.k?'700':'500'};color:${tab===t.k?'var(--org)':'var(--txt3)'};border-bottom:2px solid ${tab===t.k?'var(--org)':'transparent'};margin-bottom:-2px;display:flex;align-items:center;gap:5px;white-space:nowrap">
      <i class="fa ${t.i}" style="font-size:11px"></i>${t.l}${t.c?`<span style="font-size:10px;min-width:18px;height:18px;display:inline-flex;align-items:center;justify-content:center;border-radius:9px;background:${t.alert&&t.c?'var(--org)':'var(--surf3)'};color:${t.alert&&t.c?'#fff':'var(--txt3)'};font-weight:700">${t.c}</span>`:''}
    </button>`).join('')}
  </div>

  ${tab==='teams'?`
    <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap">
      <div style="flex:1;min-width:200px;position:relative">
        <input type="text" placeholder="チーム名・種目・地域で検索" value="${sanitize(window._tmQ||'',30)}" oninput="window._tmQ=this.value;goTo('team-match')" style="width:100%;padding:10px 14px 10px 34px;background:var(--surf2);border:1px solid var(--bdr);border-radius:10px;color:var(--txt1);font-size:13px;outline:none;box-sizing:border-box" onfocus="this.style.borderColor='var(--org)'" onblur="this.style.borderColor='var(--bdr)'">
        <i class="fa fa-search" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--txt3);font-size:12px"></i>
      </div>
      <select onchange="window._tmSport=this.value;goTo('team-match')" style="padding:10px 14px;background:var(--surf2);border:1px solid var(--bdr);border-radius:10px;color:var(--txt1);font-size:13px;outline:none">
        <option value="all">全種目</option>
        ${sports.map(s=>`<option value="${s}" ${sf===s?'selected':''}>${s}</option>`).join('')}
      </select>
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">
      ${_tmFilterChips(others, my)}
    </div>
    ${window._tmLevel||window._tmArea||window._tmAge?`<div style="font-size:10px;color:var(--org);margin-bottom:8px;cursor:pointer" onclick="window._tmLevel='';window._tmArea='';window._tmAge='';goTo('team-match')">&times; フィルターをクリア</div>`:''}

    ${!q&&!flv&&!far&&!fag?`
      ${_tmNewTeams(list,allM).length?`<div style="margin-bottom:14px">
        <div style="font-size:13px;font-weight:700;margin-bottom:8px;display:flex;align-items:center;gap:6px"><span style="font-size:14px">🆕</span>新着チーム</div>
        <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:4px">${_tmNewTeams(list,allM).map(t=>`<div onclick="openTeamProfile('${t.id}')" style="min-width:140px;padding:10px;border:1px solid var(--b1);border-radius:12px;cursor:pointer;flex-shrink:0;background:var(--surf);transition:all .15s" onmouseover="this.style.borderColor='var(--org)'" onmouseout="this.style.borderColor='var(--b1)'">
          <div style="width:32px;height:32px;border-radius:8px;background:${t.color||'var(--blue)'};display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;color:#fff;margin-bottom:6px">${(t.name||'?')[0]}</div>
          <div style="font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${sanitize(t.name,14)}</div>
          <div style="font-size:10px;color:var(--txt3)">${sanitize(t.sport||'',8)} · ${sanitize(t.area||'',8)}</div>
          <div style="font-size:9px;color:var(--teal);margin-top:2px">🆕 登録${_tmDaysAgo(t)}日</div></div>`).join('')}</div>
      </div>`:``}
      ${_tmLookingForMatch(list,allM).length?`<div style="margin-bottom:14px">
        <div style="font-size:13px;font-weight:700;margin-bottom:8px;display:flex;align-items:center;gap:6px"><span style="font-size:14px">🔥</span>対戦相手募集中</div>
        <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:4px">${_tmLookingForMatch(list,allM).map(t=>{var cp=compat(t);return`<div onclick="openTeamProfile('${t.id}')" style="min-width:160px;padding:10px;border:1px solid rgba(249,115,22,.2);border-radius:12px;cursor:pointer;flex-shrink:0;background:rgba(249,115,22,.02);transition:all .15s" onmouseover="this.style.borderColor='var(--org)'" onmouseout="this.style.borderColor='rgba(249,115,22,.2)'">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px"><div style="width:28px;height:28px;border-radius:7px;background:${t.color||'var(--org)'};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#fff">${(t.name||'?')[0]}</div><span style="font-size:11px;font-weight:700">${sanitize(t.name,12)}</span><span style="font-size:9px;padding:1px 5px;border-radius:8px;background:${cp>=60?'rgba(0,207,170,.1)':'rgba(245,158,11,.1)'};color:${cp>=60?'var(--teal)':'var(--org)'};font-weight:700;margin-left:auto">${cp}</span></div>
          <div style="font-size:10px;color:var(--org);font-weight:600;margin-bottom:4px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">"${sanitize(t.matchMessage||'',40)}"</div>
          <div style="font-size:9px;color:var(--txt3)">${sanitize(t.sport||'',6)} · ${t.teamLevel||''} · ${sanitize(t.matchDays||'',8)}</div></div>`}).join('')}</div>
      </div>`:``}
    `:``}
    ${!q&&recommended.length?`
      <div style="margin-bottom:18px">
        <div style="font-size:13px;font-weight:700;margin-bottom:10px;display:flex;align-items:center;gap:6px"><span style="font-size:16px">🎯</span>おすすめチーム<span style="font-size:10px;color:var(--txt3);font-weight:400">相性スコアが高いチーム</span></div>
        <div style="display:flex;gap:12px;overflow-x:auto;padding-bottom:4px">
          ${recommended.map(t=>{
            const cp=compat(t);
            const pc=DB.players.filter(p=>p.team===t.id).length||t.memberCount||0;
            return `<div style="min-width:220px;background:linear-gradient(135deg,${t.color||'#2563eb'}08,${t.color||'#2563eb'}03);border:1px solid ${t.color||'#2563eb'}20;border-radius:14px;padding:16px;cursor:pointer;flex-shrink:0" onclick="openTeamProfile('${t.id}')">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
                <div style="width:40px;height:40px;border-radius:10px;background:${t.color||'#2563eb'};display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:800;color:#fff">${(t.name||'?')[0]}</div>
                <div style="flex:1;min-width:0">
                  <div style="font-size:14px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${sanitize(t.name,18)}</div>
                  <div style="font-size:11px;color:var(--txt3)">${sanitize(t.sport||'',8)} · ${sanitize(t.area||'',10)}</div>
                </div>
                <div style="width:36px;height:36px;border-radius:50%;background:${cp>=60?'rgba(16,185,129,.12)':'rgba(245,158,11,.12)'};display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:${cp>=60?'#10b981':'#f59e0b'};font-family:'Montserrat',sans-serif">${cp}</div>
              </div>
              <div style="font-size:11px;color:var(--txt2);line-height:1.5;margin-bottom:8px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${sanitize(t.matchMessage||t.description||'',80)}</div>
              <div style="display:flex;gap:8px;font-size:10px;color:var(--txt3)">
                <span>👥 ${pc}名</span>
                ${t.ageGroup?`<span>🎯 ${sanitize(t.ageGroup,10)}</span>`:''}
                ${t.teamLevel?`<span>📊 ${t.teamLevel}</span>`:''}
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>
    `:''}

    ${list.length?`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
      <span style="font-size:12px;color:var(--txt3)">${list.length}チーム${q?' (検索結果)':''}</span>
      <div style="display:flex;gap:4px">
        <button onclick="window._tmSort='compat';goTo('team-match')" style="padding:3px 8px;border-radius:6px;font-size:10px;border:1px solid ${(window._tmSort||'compat')==='compat'?'var(--org)':'var(--b1)'};background:${(window._tmSort||'compat')==='compat'?'rgba(249,115,22,.08)':'var(--surf)'};color:${(window._tmSort||'compat')==='compat'?'var(--org)':'var(--txt3)'};cursor:pointer;font-weight:600">相性順</button>
        <button onclick="window._tmSort='new';goTo('team-match')" style="padding:3px 8px;border-radius:6px;font-size:10px;border:1px solid ${window._tmSort==='new'?'var(--org)':'var(--b1)'};background:${window._tmSort==='new'?'rgba(249,115,22,.08)':'var(--surf)'};color:${window._tmSort==='new'?'var(--org)':'var(--txt3)'};cursor:pointer;font-weight:600">新着順</button>
        <button onclick="window._tmSort='members';goTo('team-match')" style="padding:3px 8px;border-radius:6px;font-size:10px;border:1px solid ${window._tmSort==='members'?'var(--org)':'var(--b1)'};background:${window._tmSort==='members'?'rgba(249,115,22,.08)':'var(--surf)'};color:${window._tmSort==='members'?'var(--org)':'var(--txt3)'};cursor:pointer;font-weight:600">部員数順</button>
      </div>
    </div><div class="pcard-grid" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr))">${teamCards}</div>`
    :`<div class="card text-center" style="padding:40px"><div style="font-size:40px;margin-bottom:12px">${q?'🔍':'🏟️'}</div><div style="font-size:14px;font-weight:700;margin-bottom:6px;color:var(--txt2)">${q?'「'+sanitize(q,10)+'」に該当するチームがありません':'まだチームが登録されていません'}</div><div style="font-size:12px;color:var(--txt3);margin-bottom:14px">${q?'検索条件を変更するか、フィルターを確認してください':'チームが登録されると、ここに表示されます'}</div>${q?`<button class="btn btn-ghost btn-sm" onclick="window._tmQ='';window._tmLevel='';window._tmArea='';window._tmAge='';goTo('team-match')">🔄 フィルターをクリア</button>`:''}</div>`}
  `:''}

  ${tab==='inbox'?`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <span style="font-size:13px;color:var(--txt2)">あなたとの対戦・練習を希望しているチームです</span>
      ${inbox.length>=2?`<div style="display:flex;gap:6px">
        <button class="btn btn-ghost btn-xs" style="color:var(--teal);font-weight:700" onclick="_tmBatchAction('approve')">✓ すべて承認</button>
        <button class="btn btn-ghost btn-xs" style="color:var(--txt3)" onclick="_tmBatchAction('reject')">すべて辞退</button>
      </div>`:''}
    </div>
    ${inbox.length?inboxCards:`<div class="card text-center text-muted" style="padding:40px"><div style="font-size:36px;margin-bottom:12px">📭</div>受信した申請はありません<div class="text-xs text-muted mt-8">チーム一覧から気になるチームに申請を送ってみましょう</div></div>`}
  `:''}

  ${tab==='matched'?`
    ${matched.length?`<div class="card" style="padding:0;overflow:hidden;border-radius:14px">${matchedCards}</div>
    <div style="font-size:11px;color:var(--txt3);margin-top:10px;text-align:center">マッチ済みのチームに練習試合・合同練習を依頼できます 🏟️</div>
    ${_tmUpcomingWithMatched(matched,my)?`<div style="margin-top:14px;padding:14px;background:linear-gradient(135deg,rgba(0,207,170,.04),rgba(37,99,235,.04));border:1px solid var(--b1);border-radius:12px">
      <div style="font-size:12px;font-weight:700;margin-bottom:8px">📅 直近の予定</div>
      ${_tmUpcomingWithMatched(matched,my)}
    </div>`:``}`
    :`<div class="card text-center" style="padding:40px"><div style="font-size:44px;margin-bottom:12px">🤝</div><div style="font-size:15px;font-weight:700;margin-bottom:6px">まだつながりがありません</div><div style="font-size:12px;color:var(--txt3);margin-bottom:8px;line-height:1.6">チーム一覧から気になるチームにマッチング申請を送ると、<br>ここでやり取りや試合依頼ができるようになります</div><div style="display:flex;gap:8px;justify-content:center"><button class="btn btn-primary" onclick="window._tmTab='teams';goTo('team-match')">🔍 チームを探す</button>${!my.matchMessage?`<button class="btn btn-ghost" onclick="goTo('team-profile-edit')">⚡ プロフィール設定</button>`:''}</div></div>`}
  `:''}

  ${tab==='events'?`<div class="card" style="padding:0;overflow:hidden;border-radius:14px">
    ${activeEv.length?evRows:`<div class="text-center text-muted" style="padding:40px"><div style="font-size:36px;margin-bottom:12px">📅</div>予定はありません<div class="text-xs mt-8">マッチ済みチームに試合・練習を依頼しましょう</div></div>`}
  </div>`:''}

  ${tab==='history'?`<div class="card" style="padding:0;overflow:hidden;border-radius:14px">
    ${doneEv.length?doneEv.sort((a,b)=>(b.date||'')>(a.date||'')?1:-1).map(e=>{
      const ot=DB.teams.find(t=>t.id===(e.teamAId===my.id?e.teamBId:e.teamAId));
      const rev=(DB.teamReviews||[]).find(r=>r.eventId===e.id&&r.fromTeamId===my.id);
      return `<div style="display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid var(--b1)">
        <span style="font-size:14px">${e.status==='completed'?'✅':'−'}</span>
        <div style="flex:1"><div class="text-sm fw7">${sanitize(ot?.name||'?',18)} · ${sanitize(e.purpose||'',10)}</div>
          <div class="text-xs text-muted">${e.date||''}</div></div>
        ${e.status==='completed'&&!rev?`<button class="btn btn-primary btn-xs" onclick="openTeamReviewModal('${e.id}')">⭐ 評価</button>`:''}\
        ${rev?`<span class="text-xs" style="color:var(--yel)">${'★'.repeat(rev.rating)}</span>`:''}
        ${e.status==='completed'?`<button class="btn btn-ghost btn-xs" onclick="openNewEventForm('${ot?.id||''}')">再依頼</button>`:''}
      </div>`;
    }).join(''):`<div class="text-center text-muted" style="padding:40px"><div style="font-size:36px;margin-bottom:12px">📋</div>対戦履歴はありません</div>`}
  </div>`:''}`

  +leagueListSection();
}

function openTeamMatchPage(){goTo('team-match');}

// ═══════════════════════════════════════
// STEP 1: マッチング（チーム同士を繋ぐ）
// ═══════════════════════════════════════

function openTeamProfile(teamId){
  const t=DB.teams.find(x=>x.id===teamId);if(!t)return;
  const my=getMyTeam();
  const pc=DB.players.filter(p=>p.team===teamId).length||t.memberCount||0;
  const ex=my?(DB.teamMatches||[]).find(m=>(m.teamAId===teamId||m.teamBId===teamId)&&(m.teamAId===my.id||m.teamBId===my.id)&&(m.status==='pending'||m.status==='matched')):null;
  // Reviews for this team
  var reviews=(DB.teamReviews||[]).filter(r=>r.toTeamId===teamId);
  var avgRating=reviews.length?Math.round(reviews.reduce((s,r)=>s+r.rating,0)/reviews.length*10)/10:0;
  // Match history between us and them
  var sharedEvents=(DB.teamEvents||[]).filter(e=>((e.teamAId===teamId&&e.teamBId===my?.id)||(e.teamAId===my?.id&&e.teamBId===teamId))&&e.status==='completed');

  let actionBtn='';
  if(ex?.status==='matched'){
    actionBtn=`<div style="display:grid;gap:8px">
      <button class="btn btn-primary w-full" onclick="closeM();openNewEventForm('${teamId}')">🏟️ 練習試合・合同練習を依頼</button>
      <button class="btn btn-ghost w-full btn-sm" onclick="closeM();activeRoom='tm_${ex.id}';goTo('chat')">💬 チャット</button>
    </div>`;
  } else if(ex?.status==='pending'&&ex.teamAId===my?.id){
    actionBtn='<button class="btn btn-ghost w-full" disabled>申請中 — 相手の返答をお待ちください</button>';
  } else if(ex?.status==='pending'&&ex.teamBId===my?.id){
    actionBtn=`<div style="display:flex;gap:8px"><button class="btn btn-primary" style="flex:1" onclick="acceptTeamMatch('${ex.id}')">承認する</button><button class="btn btn-ghost" onclick="rejectTeamMatch('${ex.id}')">辞退</button></div>`;
  } else {
    actionBtn=`<div>
      <div class="form-group" style="margin-bottom:10px"><label class="label">メッセージ（任意）</label><textarea id="tm-req-msg" class="input" rows="2" maxlength="200" placeholder="例: 練習試合をお願いしたいです！"></textarea></div>
      <button class="btn btn-primary w-full" onclick="closeM();sendTeamMatchRequest('${teamId}',document.getElementById('tm-req-msg')?.value||'')">🤝 マッチングを申請する</button>
    </div>`;
  }

  openM('',`<div>
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px">
      <div style="width:56px;height:56px;border-radius:14px;background:${t.color||'var(--blue)'};display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:800;color:#fff;flex-shrink:0">${(t.name||'?')[0]}</div>
      <div>
        <div style="font-size:18px;font-weight:800">${sanitize(t.name,22)}</div>
        <div style="font-size:13px;color:var(--txt3)">${sanitize(t.sport||'',12)} · ${sanitize(t.area||'',15)}</div>
        ${t.teamLevel?`<span style="font-size:11px;padding:2px 8px;border-radius:6px;background:rgba(0,212,170,.1);color:var(--teal);font-weight:700">${t.teamLevel}</span>`:''}
      </div>
    </div>
    ${t.matchMessage?`<div style="font-size:13px;color:var(--org);font-weight:600;line-height:1.7;margin-bottom:14px;padding:12px 14px;background:rgba(249,115,22,.04);border-radius:10px;border-left:3px solid var(--org)">"${sanitize(t.matchMessage,300)}"</div>`:''}
    ${t.description?`<div style="font-size:13px;color:var(--txt2);line-height:1.7;margin-bottom:14px">${sanitize(t.description,300)}</div>`:''}
    <div style="background:var(--surf2);border-radius:10px;padding:14px;margin-bottom:14px">
      <table style="width:100%;font-size:12px;border-collapse:collapse">
        <tr><td style="padding:6px 0;color:var(--txt3);width:110px">部員数</td><td style="padding:6px 0" class="fw7">${pc}名</td></tr>
        ${t.ageGroup?`<tr><td style="padding:6px 0;color:var(--txt3)">カテゴリ</td><td style="padding:6px 0" class="fw7">${sanitize(t.ageGroup,20)}</td></tr>`:''}
        ${t.teamLevel?`<tr><td style="padding:6px 0;color:var(--txt3)">チームレベル</td><td style="padding:6px 0" class="fw7">${sanitize(t.teamLevel,10)}</td></tr>`:''}
        ${t.practiceDays?`<tr><td style="padding:6px 0;color:var(--txt3)">活動日</td><td style="padding:6px 0" class="fw7">${sanitize(t.practiceDays,20)}</td></tr>`:''}
        ${t.homeGround?`<tr><td style="padding:6px 0;color:var(--txt3)">練習場所</td><td style="padding:6px 0" class="fw7">${sanitize(t.homeGround,30)}</td></tr>`:''}
        ${t.lookingFor?`<tr><td style="padding:6px 0;color:var(--txt3)">求める相手</td><td style="padding:6px 0 fw7" style="color:var(--org)">${sanitize(t.lookingFor,40)}</td></tr>`:''}
        ${t.matchDays?`<tr><td style="padding:6px 0;color:var(--txt3)">対戦可能日</td><td style="padding:6px 0" class="fw7">${sanitize(t.matchDays,20)}</td></tr>`:''}
        ${t.matchLocation?`<tr><td style="padding:6px 0;color:var(--txt3)">対戦可能場所</td><td style="padding:6px 0" class="fw7">${sanitize(t.matchLocation,30)}</td></tr>`:''}
      </table>
    </div>
    ${reviews.length?`<div style="margin-bottom:14px"><div style="font-size:12px;font-weight:700;margin-bottom:8px">⭐ レビュー (${reviews.length}件・平均${avgRating})</div>
      <div style="display:flex;gap:4px;margin-bottom:6px">${[1,2,3,4,5].map(n=>`<span style="color:${n<=Math.round(avgRating)?'#eab308':'var(--b2)'}">★</span>`).join('')}</div>
      ${reviews.slice(-3).reverse().map(r=>{var from=DB.teams.find(x=>x.id===r.fromTeamId);return`<div style="padding:6px 10px;background:var(--surf2);border-radius:8px;margin-bottom:4px;font-size:11px"><span style="font-weight:700">${sanitize(from?.name||'',12)}</span> <span style="color:#eab308">${'★'.repeat(r.rating)}</span>${r.comment?` — ${sanitize(r.comment,60)}`:''}</div>`;}).join('')}
    </div>`:''}
    ${sharedEvents.length?`<div style="margin-bottom:14px"><div style="font-size:12px;font-weight:700;margin-bottom:6px">📋 対戦履歴 (${sharedEvents.length}回)</div>
      ${sharedEvents.slice(-3).map(e=>`<div style="font-size:11px;padding:4px 0;border-bottom:1px solid var(--b1)">${e.date||''} · ${sanitize(e.purpose||'',12)}</div>`).join('')}
    </div>`:''}
    ${actionBtn}
  </div>`);
}
// マッチング申請を送る（目的なし。チーム同士の繋がりだけ）
function sendTeamMatchRequest(targetTeamId, reqMsg){
  if(window._sendingTM){return;}window._sendingTM=true;setTimeout(()=>{window._sendingTM=false;},3000);
  const my=getMyTeam();if(!my)return;
  if(!DB.teamMatches)DB.teamMatches=[];
  const target=DB.teams.find(t=>t.id===targetTeamId);if(!target)return;
  const already=_dbArr('teamMatches').find(m=>(m.teamAId===targetTeamId||m.teamBId===targetTeamId)&&(m.teamAId===my.id||m.teamBId===my.id)&&(m.status==='pending'||m.status==='matched'));
  if(already){toast('すでに申請済みまたはマッチ済みです','w');return;}

  const mid='tm'+Date.now();
  const _msg=reqMsg?sanitize(reqMsg,200):'';
  _dbArr('teamMatches').push({
    id:mid,teamAId:my.id,teamAName:my.name,teamBId:targetTeamId,teamBName:target.name,
    status:'pending',msg:_msg,createdAt:new Date().toISOString()
  });
  // 同じチーム間の既存チャットを探す（統合表示）
  let ck=Object.keys(DB.chats).find(k=>{
    const c=DB.chats[k];
    return c.type==='team_match'&&
      ((c.teamAId===my.id&&c.teamBId===targetTeamId)||(c.teamAId===targetTeamId&&c.teamBId===my.id));
  });
  if(ck){
    const ec=DB.chats[ck];
    ec.matchId=mid;
    ec.sub='マッチング申請中';
    ec.msgs.push({mid:_genMsgId(),from:'system',name:'システム',text:'── 新しいマッチング申請 ──',time:now_time(),date:new Date().toISOString().slice(0,10),read:false});
    ec.msgs.push({mid:_genMsgId(),from:'system',name:'システム',text:my.name+'から'+target.name+'へマッチング申請が届きました。\n承認するとチャット・試合依頼が可能になります。',time:now_time(),date:new Date().toISOString().slice(0,10),read:false});
    ec.unread=(ec.unread||0)+2;
  } else {
    ck='tm_'+mid;
    DB.chats[ck]={
      name:my.name+' ↔ '+target.name,
      sub:'マッチング申請中',avi:'🏟️',
      teamAId:my.id,teamBId:targetTeamId,matchId:mid,type:'team_match',
      msgs:[{mid:_genMsgId(),from:'system',name:'システム',text:my.name+'から'+target.name+'へマッチング申請が届きました。\n承認するとチャット・試合依頼が可能になります。',time:now_time(),read:false},
        ...(_msg?[{from:my.id,name:my.name,text:_msg,time:now_time(),read:false}]:[])
      ],
      unread:1
    };
  }
  saveDB();
  toast(target.name+'にマッチング申請を送りました','s');
  addNotif(target.name+'へマッチング申請','fa-futbol','chat');
  // メール通知
  const _tu=_getUsers().find(u=>u.id===targetTeamId||u.email===target.email);
  notifyByEmail('match_request',{email:target.email,name:target.name},{fromName:my.name});
  goTo('team-match');
}

function _tmUpcomingWithMatched(matched,my){
  if(!my) return '';
  var matchIds=matched.map(function(m){return m.id;});
  var upcoming=(DB.teamEvents||[]).filter(function(e){
    return matchIds.includes(e.matchId)&&(e.status==='confirmed'||e.status==='pending');
  }).sort(function(a,b){return (a.date||'')>(b.date||'')?1:-1;}).slice(0,3);
  if(!upcoming.length) return '';
  return upcoming.map(function(e){
    var ot=DB.teams.find(function(t){return t.id===(e.teamAId===my.id?e.teamBId:e.teamAId);});
    var d=e.date?Math.round((new Date(e.date)-new Date())/86400000):null;
    return '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--b1);font-size:12px">'
      +'<span style="font-weight:800;color:'+(d!==null&&d<=3?'var(--org)':'var(--txt1)')+';min-width:40px;text-align:center;font-family:Montserrat,sans-serif">'+(d!==null?d+'日後':'?')+'</span>'
      +'<span style="flex:1">'+sanitize(e.purpose||'',10)+' vs '+sanitize(ot?.name||'?',12)+'</span>'
      +'<span style="color:var(--txt3);font-size:10px">'+(e.date||'')+'</span></div>';
  }).join('');
}
function _tmBatchAction(action){
  var my=getMyTeam();if(!my) return;
  var allM=(DB.teamMatches||[]).filter(m=>m.status==='pending'&&m.teamBId===my.id);
  if(!allM.length){toast('処理する申請がありません','w');return;}
  var label=action==='approve'?'すべて承認':'すべて辞退';
  if(!confirm(allM.length+'件の申請を'+label+'しますか？'))return;
  allM.forEach(function(m){
    if(action==='approve') acceptTeamMatch(m.id);
    else rejectTeamMatch(m.id);
  });
  toast(allM.length+'件を'+label+'しました','s');
  goTo('team-match');
}
function acceptTeamMatch(matchId){
  if(!DB.teamMatches)return;
  const m=_dbArr('teamMatches').find(x=>x.id===matchId);if(!m)return;
  m.status='matched';
  // matchIdフィールドで検索（キーが変わっていても見つかる）
  const ck=Object.keys(DB.chats).find(k=>DB.chats[k].matchId===matchId)||('tm_'+matchId);
  const ch=DB.chats[ck];
  if(ch){
    ch.sub='✅ マッチ済み';
    ch.msgs.push({mid:_genMsgId(),from:'system',name:'システム',text:'マッチングが成立しました！\nチャットで連絡を取り合い、練習試合や合同練習を依頼できます。',time:now_time(),date:new Date().toISOString().slice(0,10),read:false});
  }
  saveDB();closeM();
  toast('マッチング成立','s');
  addNotif(m.teamAName+'とマッチング成立','fa-check-circle','chat');
  const _atm=DB.teams.find(t=>t.id===m.teamAId);
  notifyByEmail('match_accepted',{email:_atm?.email,name:_atm?.name},{teamName:getMyTeam()?.name});
  activeRoom=ck;goTo('chat');
}

function rejectTeamMatch(matchId){
  if(!DB.teamMatches)return;
  const m=_dbArr('teamMatches').find(x=>x.id===matchId);if(!m)return;
  m.status='rejected';
  const ck=Object.keys(DB.chats).find(k=>DB.chats[k].matchId===matchId)||('tm_'+matchId);const ch=DB.chats[ck];
  if(ch){
    ch.msgs.push({mid:_genMsgId(),from:'system',name:'システム',text:'マッチング申請がお断りされました。',time:now_time(),date:new Date().toISOString().slice(0,10),read:false});
    ch.unread=(ch.unread||0)+1;
  }
  // 申請元チームに通知
  const myTeamId=_getMyTeamId();
  const otherTeamId=(m.teamAId===myTeamId)?m.teamBId:m.teamAId;
  const otherTeam=DB.teams.find(t=>t.id===otherTeamId);
  const myTeam=DB.teams.find(t=>t.id===myTeamId);
  addNotif(`練習試合の申請が見送られました（${myTeam?.name||'チーム'}）`,'fa-times-circle','team-match',otherTeamId);
  addAuditLog('team_match_reject','練習試合辞退: '+(otherTeam?.name||'')+'→'+(myTeam?.name||''),{matchId});
  saveDB();closeM();toast('辞退しました','s');goTo('team-match');
}

// ═══════════════════════════════════════
// STEP 2: イベント（練習試合・合同練習）
// ═══════════════════════════════════════

function openNewEventForm(targetTeamId){
  const target=DB.teams.find(t=>t.id===targetTeamId);if(!target)return;
  const my=getMyTeam();if(!my)return;
  closeM();
  setTimeout(()=>{
    openM('試合・練習を依頼',`<div style="display:grid;gap:12px">
      <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--surf2);border-radius:8px">
        <div class="avi" style="width:32px;height:32px;font-size:13px;background:${target.color||'var(--blue)'}15;color:${target.color||'var(--blue)'}">${(target.name||'?')[0]}</div>
        <div><div class="fw7 text-sm">${sanitize(target.name,20)}</div>
          <div class="text-xs text-muted">${sanitize(target.sport||'',10)} · ${sanitize(target.area||'',12)}</div></div>
      </div>
      <div class="form-group"><label class="label">種別</label>
        <select id="te-purpose" class="input">
          <option value="練習試合">練習試合</option>
          <option value="合同練習">合同練習</option>
          <option value="交流戦">交流戦</option>
          <option value="紅白戦">紅白戦（合同）</option>
          <option value="その他">その他</option>
        </select>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div class="form-group"><label class="label">第1希望日</label>
          <input id="te-date" class="input" type="date" value="${new Date(Date.now()+14*864e5).toISOString().slice(0,10)}">
        </div>
        <div class="form-group"><label class="label">第2希望日</label>
          <input id="te-date2" class="input" type="date">
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div class="form-group"><label class="label">時間帯</label>
          <select id="te-time" class="input">
            <option value="">未定</option>
            <option value="午前（9:00-12:00）">午前</option>
            <option value="午後（13:00-17:00）">午後</option>
            <option value="終日">終日</option>
          </select>
        </div>
        <div class="form-group"><label class="label">参加人数</label>
          <input id="te-headcount" class="input" type="number" min="1" max="50" placeholder="人数" value="${DB.players.filter(p=>p.team===my.id).length||''}">
        </div>
      </div>
      <div class="form-group"><label class="label">カテゴリ</label>
        <select id="te-category" class="input">
          <option value="">指定なし</option>
          <option value="U-10">U-10</option><option value="U-12">U-12</option>
          <option value="U-15">U-15</option><option value="U-18">U-18</option>
          <option value="一般">一般</option>
        </select>
      </div>
      <div class="form-group"><label class="label">場所</label>
        <input id="te-place" class="input" placeholder="会場名・住所" maxlength="60">
      </div>
      <div class="form-group"><label class="label">備考</label>
        <textarea id="te-msg" class="input" rows="2" placeholder="試合形式・集合時間等" maxlength="300"></textarea>
      </div>
      <button class="btn btn-primary w-full" onclick="sendTeamEvent('${targetTeamId}')">依頼を送信</button>
    </div>`);
  },200);
}

function sendTeamEvent(targetTeamId){
  const my=getMyTeam();if(!my)return;
  if(!DB.teamEvents)DB.teamEvents=[];
  const purpose=document.getElementById('te-purpose')?.value||'練習試合';
  const date=document.getElementById('te-date')?.value||'';
  const date2=document.getElementById('te-date2')?.value||'';
  const time=document.getElementById('te-time')?.value||'';
  const headcount=parseInt(document.getElementById('te-headcount')?.value)||0;
  const category=document.getElementById('te-category')?.value||'';
  const place=(document.getElementById('te-place')?.value||'').trim();
  const msg=(document.getElementById('te-msg')?.value||'').trim();
  const target=DB.teams.find(t=>t.id===targetTeamId);if(!target)return;
  if(!date){toast('第1希望日を入力してください','e');return;}

  // 対応するマッチを探す
  const match=_dbArr('teamMatches').find(m=>(m.teamAId===targetTeamId||m.teamBId===targetTeamId)&&(m.teamAId===my.id||m.teamBId===my.id)&&m.status==='matched');

  const eid='te'+Date.now();
  _dbArr('teamEvents').push({
    id:eid,matchId:match?.id||'',teamAId:my.id,teamBId:targetTeamId,
    purpose,date,date2,time,headcount,category,
    place:sanitize(place,60),msg:sanitize(msg,300),
    status:'pending',createdAt:new Date().toISOString()
  });

  // チャットに通知
  const ck=match?Object.keys(DB.chats).find(k=>DB.chats[k].matchId===match.id)||('tm_'+match.id):null;
  if(ck&&DB.chats[ck]){
    const lines=[purpose,'📅 '+date+(date2?' / '+date2:''),time||'',headcount?headcount+'名':'',category||'',place?'📍 '+place:''].filter(Boolean).join('\n');
    DB.chats[ck].msgs.push({mid:_genMsgId(),from:'system',name:'システム',text:my.name+'が試合・練習を依頼しました。\n\n'+lines,time:now_time(),date:new Date().toISOString().slice(0,10),read:false});
    DB.chats[ck].sub=purpose+(date?' · '+date:'');
  }
  if(msg&&ck&&DB.chats[ck]){
    DB.chats[ck].msgs.push({mid:_genMsgId(),from:my.id,name:my.name,text:msg,time:now_time(),date:new Date().toISOString().slice(0,10),read:false});
  }

  saveDB();closeM();
  toast(target.name+'に'+purpose+'を依頼しました','s');
  addNotif(target.name+'へ「'+purpose+'」依頼','fa-futbol','chat');
  notifyByEmail('event_request',{email:target.email,name:target.name},{fromName:my.name,purpose,date});
  if(ck){activeRoom=ck;goTo('chat');}else{goTo('team-match');}
}

function openEventDetail(eventId){
  const e=(DB.teamEvents||[]).find(x=>x.id===eventId);if(!e)return;
  const my=getMyTeam();if(!my)return;
  const ot=DB.teams.find(t=>t.id===(e.teamAId===my.id?e.teamBId:e.teamAId));
  const match=_dbArr('teamMatches').find(m=>m.id===e.matchId);
  const isReceiver=e.teamBId===my.id;
  const d=e.date?Math.round((new Date(e.date)-new Date())/864e5):null;

  let actions='';
  if(e.status==='pending'&&isReceiver){
    actions=`<div style="display:flex;gap:8px;margin-bottom:8px">
      <button class="btn btn-primary btn-sm" style="flex:1" onclick="confirmTeamEvent('${e.id}')">承認する</button>
      <button class="btn btn-ghost btn-sm" onclick="cancelTeamEvent('${e.id}')">辞退</button>
    </div>`;
  }

  openM('イベント詳細',`<div>
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
      <div class="avi" style="width:36px;height:36px;font-size:14px;background:${ot?.color||'var(--blue)'}15;color:${ot?.color||'var(--blue)'}">${(ot?.name||'?')[0]}</div>
      <div style="flex:1">
        <div class="fw7 text-sm">${sanitize(e.purpose||'',15)} vs ${sanitize(ot?.name||'?',18)}</div>
        <div class="text-xs text-muted">ステータス: ${e.status==='confirmed'?'✅ 確定':e.status==='pending'?'⏳ 承認待ち':'終了'}${d!==null&&d>=0?' · あと'+d+'日':''}</div>
      </div>
    </div>
    <div style="background:var(--surf2);border-radius:10px;padding:14px;margin-bottom:14px">
      <table style="width:100%;font-size:12px;border-collapse:collapse">
        <tr><td style="padding:5px 0;color:var(--txt3);width:80px">種別</td><td style="padding:5px 0" class="fw7">${sanitize(e.purpose||'',20)}</td></tr>
        <tr><td style="padding:5px 0;color:var(--txt3)">日程</td><td style="padding:5px 0" class="fw7">${e.date||'未定'}${e.date2?' (第2: '+e.date2+')':''}</td></tr>
        ${e.time?`<tr><td style="padding:5px 0;color:var(--txt3)">時間</td><td style="padding:5px 0" class="fw7">${e.time}</td></tr>`:''}
        ${e.headcount?`<tr><td style="padding:5px 0;color:var(--txt3)">人数</td><td style="padding:5px 0" class="fw7">${e.headcount}名</td></tr>`:''}
        ${e.category?`<tr><td style="padding:5px 0;color:var(--txt3)">カテゴリ</td><td style="padding:5px 0" class="fw7">${e.category}</td></tr>`:''}
        <tr><td style="padding:5px 0;color:var(--txt3)">場所</td><td style="padding:5px 0" class="fw7">${e.place?sanitize(e.place,30):'未定'}</td></tr>
      </table>
    </div>
    ${actions}
    <div style="display:grid;gap:8px">
      ${match?`<button class="btn btn-primary w-full btn-sm" onclick="closeM();activeRoom='tm_${match.id}';goTo('chat')">💬 チャットで調整</button>`:''}
      ${e.status==='confirmed'?`<button class="btn btn-ghost w-full btn-sm" onclick="completeTeamEvent('${e.id}')">実施済みにする</button>`:''}
    </div>
  </div>`);
}

function confirmTeamEvent(eventId){
  const e=(DB.teamEvents||[]).find(x=>x.id===eventId);if(!e)return;
  e.status='confirmed';
  const match=_dbArr('teamMatches').find(m=>m.id===e.matchId);
  const my=getMyTeam();
  const ot=DB.teams.find(t=>t.id===(e.teamAId===my?.id?e.teamBId:e.teamAId));
  if(match){
    const ck=Object.keys(DB.chats).find(k=>DB.chats[k].matchId===match.id)||('tm_'+match.id);const ch=DB.chats[ck];
    if(ch) ch.msgs.push({mid:_genMsgId(),from:'system',name:'システム',text:'✅ 「'+e.purpose+'」('+e.date+') が承認されました。',time:now_time(),date:new Date().toISOString().slice(0,10),read:false});
  }
  // カレンダーにイベント追加
  if(e.date){
    const d=new Date(e.date);
    if(!isNaN(d)){
      DB.events.push({id:genId('ev'),title:(e.purpose||'試合')+' vs '+(ot?.name||''),date:d.getDate(),month:d.getMonth(),year:d.getFullYear(),time:e.time||'',type:'match',status:'confirmed',teamEventId:e.id});
    }
  }
  // メール通知
  const _cot=DB.teams.find(t=>t.id===e.teamAId);
  notifyByEmail('event_confirmed',{email:_cot?.email,name:_cot?.name},{purpose:e.purpose,date:e.date});
  saveDB();closeM();toast('承認しました','s');goTo('team-match');
}

function cancelTeamEvent(eventId){
  const e=(DB.teamEvents||[]).find(x=>x.id===eventId);if(!e)return;
  e.status='cancelled';
  const match=_dbArr('teamMatches').find(m=>m.id===e.matchId);
  if(match){
    const ck=Object.keys(DB.chats).find(k=>DB.chats[k].matchId===match.id)||('tm_'+match.id);const ch=DB.chats[ck];
    if(ch) ch.msgs.push({mid:_genMsgId(),from:'system',name:'システム',text:'「'+e.purpose+'」('+e.date+') が辞退されました。',time:now_time(),date:new Date().toISOString().slice(0,10),read:false});
  }
  saveDB();closeM();toast('辞退しました','s');goTo('team-match');
}

function completeTeamEvent(eventId){
  const e=(DB.teamEvents||[]).find(x=>x.id===eventId);if(!e)return;
  e.status='completed';e.completedAt=new Date().toISOString();
  saveDB();closeM();toast('完了しました','s');
  setTimeout(()=>openTeamReviewModal(eventId),300);
}

// ─── レビュー（イベント単位） ───
function openTeamReviewModal(eventId){
  const e=(DB.teamEvents||[]).find(x=>x.id===eventId);if(!e){goTo('team-match');return;}
  const my=getMyTeam();if(!my)return;
  const oid=e.teamAId===my.id?e.teamBId:e.teamAId;
  const ot=DB.teams.find(t=>t.id===oid);
  if(!DB.teamReviews)DB.teamReviews=[];
  if(_dbArr('teamReviews').find(r=>r.eventId===eventId&&r.fromTeamId===my.id)){toast('評価済みです','e');goTo('team-match');return;}
  window._tmRev=0;
  openM(sanitize(ot?.name||'',15)+' の評価',`<div style="text-align:center;padding:10px 0">
    <div class="text-xs text-muted mb-8">${sanitize(e.purpose||'',15)} · ${e.date||''}</div>
    <div id="tm-stars" style="font-size:28px;display:flex;justify-content:center;gap:6px">
      ${[1,2,3,4,5].map(n=>`<span style="cursor:pointer;color:var(--bdr)" onclick="window._tmRev=${n};[...document.getElementById('tm-stars').children].forEach((s,i)=>s.style.color=i<${n}?'var(--yel)':'var(--bdr)')">★</span>`).join('')}
    </div>
  </div>
  <div class="form-group"><label class="label">コメント（任意）</label>
    <textarea id="tm-rev-comment" class="input" rows="2" placeholder="対戦の感想" maxlength="200"></textarea>
  </div>
  <div style="display:flex;gap:8px">
    <button class="btn btn-primary" style="flex:1" onclick="submitTeamReview('${eventId}')">送信</button>
    <button class="btn btn-ghost" onclick="closeM();goTo('team-match')">スキップ</button>
  </div>`);
}

function submitTeamReview(eventId){
  const r=window._tmRev;
  if(!r){toast('評価を選択してください','e');return;}
  const e=(DB.teamEvents||[]).find(x=>x.id===eventId);if(!e)return;
  const my=getMyTeam();if(!my)return;
  const oid=e.teamAId===my.id?e.teamBId:e.teamAId;
  const comment=(document.getElementById('tm-rev-comment')?.value||'').trim();
  if(!DB.teamReviews)DB.teamReviews=[];
  _dbArr('teamReviews').push({id:'tr'+Date.now(),eventId,matchId:e.matchId,fromTeamId:my.id,toTeamId:oid,rating:r,comment:sanitize(comment,200),createdAt:new Date().toISOString()});
  const ot=DB.teams.find(t=>t.id===oid);
  if(ot){
    const all=_dbArr('teamReviews').filter(x=>x.toTeamId===oid);
    ot.rating=Math.round(all.reduce((s,x)=>s+x.rating,0)/all.length*10)/10;
    ot.reviewCount=all.length;
  }
  saveDB();closeM();toast('評価を送信しました','s');goTo('team-match');
}

function rematchTeam(matchId){
  const m=(DB.teamMatches||[]).find(x=>x.id===matchId);if(!m)return;
  const my=getMyTeam();if(!my)return;
  const oid=m.teamAId===my.id?m.teamBId:m.teamAId;
  closeM();openNewEventForm(oid);
}

// 互換
function openTeamDetail(tid){openTeamProfile(tid);}
function openTeamMatchForm(tid){openTeamProfile(tid);}
function sendTeamMatch(tid){sendTeamMatchRequest(tid);}
function matchCntGlobal(tid){return _tmCnt(tid);}
function openMatchDetail(mid){
  const m=(DB.teamMatches||[]).find(x=>x.id===mid);
  if(m){const ot=_tmOtherT(m);if(ot)openNewEventForm(ot.id);}
}

// 承認待ち申請パネル（ダッシュボードに表示）
function requestsPanel(role){
  if(!DB.requests)DB.requests=[];
  const team=role==='team'?getMyTeam():null;
  const coach=role==='coach'?getMyCoach():null;
  let pending=[];
  if(role==='team'){
    // チームが受け取ったコーチからの応募 + チームが送ったがまだ自分側で管理するもの
    pending=_dbArr('requests').filter(r=>r.status==='pending'&&(
      (r.type==='coach_to_team'&&r.teamId===team?.id)||
      (r.type==='team_to_coach'&&r.teamId===team?.id)
    ));
  } else if(role==='coach'){
    pending=_dbArr('requests').filter(r=>r.status==='pending'&&(
      (r.type==='team_to_coach'&&r.coachId===coach?.id)||
      (r.type==='coach_to_team'&&r.coachId===coach?.id)
    ));
  } else if(role==='admin'){
    pending=_dbArr('requests').filter(r=>r.status==='pending');
  }
  if(!pending.length) return '';
  
  return`<div class="card mb-20" style="border-left:3px solid var(--org)">
    <div class="flex justify-between items-center mb-14">
      <div class="fw7" style="font-size:15px"><i class="fa fa-bell" style="color:var(--org)"></i> 承認待ちの申請 <span class="badge b-org">${pending.length}</span></div>
    </div>
    ${pending.map(r=>{
      const isSent=(role==='team'&&r.type==='team_to_coach')||(role==='coach'&&r.type==='coach_to_team');
      const otherName=role==='coach'?r.teamName:role==='admin'?(r.teamName+'→'+r.coachName):r.coachName;
      const chatKey=Object.keys(DB.chats).find(k=>DB.chats[k].reqId===r.id)||'';
      return`<div class="request-row" id="req-${r.id}">
        <div class="flex items-center gap-12 flex-1">
          <div class="avi" style="background:var(--org);width:38px;height:38px;font-size:15px">${(otherName||'?')[0]}</div>
          <div>
            <div class="fw7 text-sm">${sanitize(otherName,50)} <span class="text-xs text-muted">${r.type==='team_to_coach'?'（チームから依頼）':'（コーチから応募）'}</span></div>
            <div class="text-xs text-muted">${r.createdAt} 申請</div>
            ${r.msg?`<div class="text-xs text-muted mt-4" style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">"${sanitize(r.msg,200)}"</div>`:''}
          </div>
        </div>
        <div class="flex gap-8 flex-wrap">
          ${isSent
            ?`<span class="badge b-yel">🕐 承認待ち</span>
              ${chatKey?`<button class="btn btn-ghost btn-sm" onclick="openMatchChatByKey('${chatKey}')">💬 チャット</button>`:''}
              <button class="btn btn-ghost btn-sm" onclick="cancelRequest('${r.id}')">&times; 取消</button>`
            :`<button class="btn btn-primary btn-sm" onclick="approveRequest('${r.id}')">✓ マッチングを承認</button>
              <button class="btn btn-ghost btn-sm" onclick="rejectRequest('${r.id}')">&times; 断る</button>
              ${chatKey?`<button class="btn btn-secondary btn-sm" onclick="openMatchChatByKey('${chatKey}')">💬 交渉する</button>`:''}`
          }
        </div>
      </div>`;
    }).join('<hr style="border:none;border-top:1px solid var(--b1);margin:10px 0">')}
  </div>`;
}

// 申請を承認 → マッチング実行
function approveRequest(reqId){
  const _role=DB.currentUser?.role;
  if(!['admin','team','coach'].includes(_role)){toast('権限がありません','e');return;}
  const req=_dbArr('requests').find(r=>r.id===reqId);
  if(!req){toast('申請が見つかりません','e');return;}
  req.status='matched';
  const _c=DB.coaches.find(c=>c.id===req.coachId);
  const _t=DB.teams.find(t=>t.id===req.teamId);
  _sendPushNotification('🤝 マッチング成立', sanitize(_rc?.name||'',15)+' × '+sanitize(_rt?.name||'',15));
  addAuditLog('match_approve','マッチング承認: '+sanitize(_c?.name||'',15)+' ↔ '+sanitize(_t?.name||'',15),{reqId,coachId:req.coachId,teamId:req.teamId,type:req.contractType||'monthly'});

  if(req.contractType==='onetime'){
    // 臨時コーチ: チーム・コーチの永続紐付けはしない。単発スレッドを作成
    const price=req.onetimePrice||0;
    const isOtNeg=price===0;
    const coachFee=isOtNeg?0:getFeeAmount(price,req.teamId||'','coachFee');
    const threadId='pt'+Date.now();
    const _otCk=Object.keys(DB.chats).find(k=>DB.chats[k].reqId===reqId)||'';
    _dbArr('payThreads').push({
      id:threadId, teamId:req.teamId, coachId:req.coachId,
      chatKey:_otCk,
      status:isOtNeg?'pending_negotiation':'payment_requested',
      negotiable:isOtNeg,
      contractAmount:price,
      teamPays:price, coachReceives:price-coachFee,
      month:req.onetimeDate||new Date().toISOString().slice(0,7),
      contractType:'onetime', onetimeTitle:req.onetimeTitle||'臨時コーチ',
      online:req.online||false,
      createdAt:new Date().toISOString().slice(0,10),
      invoices:isOtNeg?[]:[{id:'inv'+Date.now(),month:req.onetimeDate||curMonth(),status:'unpaid',
        teamPays:price,coachReceives:price-coachFee,paidAt:null,note:req.onetimeTitle||'臨時コーチ報酬'}],
      messages:[{from:'system',text:isOtNeg
        ?`臨時コーチが承認されました！\n📋 ${req.onetimeTitle||''}\n💬 報酬は要相談。チャットで金額を確認してください。${req.online?'\n💻 オンライン対応':''}`
        :`臨時コーチが承認されました！\n📋 ${req.onetimeTitle||''}\n💰 報酬: ¥${price.toLocaleString()}${req.online?'\n💻 オンライン対応':''}`,
        time:new Date().toLocaleString('ja-JP')}]
    });
  } else {
    // 通常月額: マッチング成立（まだ本契約ではない。チャットで相談後、チームから本契約申請）
    // doMatch は本契約成立時に呼ぶ
    addNotif(sanitize(_c?.name||'コーチ',15)+'とのマッチングが成立しました。チャットで指導内容を相談し、本契約を進めてください。','fa-handshake','chat',req.teamId);
    addNotif(sanitize(_t?.name||'チーム',15)+'とのマッチングが成立しました。チャットで詳細を相談してください。','fa-handshake','chat',req.coachId);
  }

  const chatKey=Object.keys(DB.chats).find(k=>DB.chats[k].reqId===reqId);
  // payThreadにchatKeyを紐づけ
  const _latestPt=_dbArr('payThreads').filter(pt=>pt.teamId===req.teamId&&pt.coachId===req.coachId).slice(-1)[0];
  if(_latestPt&&chatKey&&!_latestPt.chatKey)_latestPt.chatKey=chatKey;
  if(chatKey){
    const ch=DB.chats[chatKey];
    ch.sub=req.contractType==='onetime'?'臨時コーチ承認 ✓':'💬 チャットで相談中';
    if(req.online) ch.online=true;
    ch.msgs.push({mid:_genMsgId(),from:'system',name:'システム',
      text:req.contractType==='onetime'
        ?'🎉 臨時コーチが承認されました！お支払いページをご確認ください。'+(req.online?'\n💻 「Meet開始」ボタンでオンライン指導を開始できます。':'')
        :'🎉 マッチングが成立しました！\n\n📋 次のステップ:\n1. チャットで指導内容・スケジュール・料金を相談\n2. 合意できたらチームが「本契約」を申請\n3. コーチが承諾すると契約成立\n\nまずはチャットでお互いの条件を確認しましょう💬',
      time:now_time(),date:new Date().toISOString().slice(0,10),read:false});
  }
  saveDB();
  addNotif('マッチングが成立しました！'+req.coachName+' × '+req.teamName,'fa-handshake','threads');
  // メール通知: チーム・コーチ双方に
  const _mTeam=DB.teams.find(t=>t.id===req.teamId);
  const _mCoach=DB.coaches.find(c=>c.id===req.coachId);
  notifyByEmail('coach_matched',{email:_mTeam?.email,name:_mTeam?.name},{coachName:req.coachName});
  notifyByEmail('coach_matched',{email:_mCoach?.email,name:_mCoach?.name},{coachName:req.teamName});
  toast('マッチングを承認しました！','s');
  refreshPage();
}

// 申請を断る
function rejectRequest(reqId){
  const _role=DB.currentUser?.role;
  if(!['admin','team','coach'].includes(_role)){toast('権限がありません','e');return;}
  const req=_dbArr('requests').find(r=>r.id===reqId);
  if(!req){toast('申請が見つかりません','e');return;}
  req.status='rejected';
  const _rc=DB.coaches.find(c=>c.id===req.coachId);
  const _rt=DB.teams.find(t=>t.id===req.teamId);
  addAuditLog('match_reject','マッチング却下: '+sanitize(_rc?.name||'',15)+' ↔ '+sanitize(_rt?.name||'',15),{reqId,coachId:req.coachId,teamId:req.teamId});
  const chatKey=Object.keys(DB.chats).find(k=>DB.chats[k].reqId===reqId);
  if(chatKey){
    DB.chats[chatKey].sub='申請却下';
    DB.chats[chatKey].msgs.push({mid:_genMsgId(),from:'system',name:'システム',
      text:'今回は見送りとなりました。またいつでもご連絡ください。',
      time:now_time(),date:new Date().toISOString().slice(0,10),read:false});
    DB.chats[chatKey].unread=(DB.chats[chatKey].unread||0)+1;
  }
  // 申請元に拒否通知
  if(req.type==='team_to_coach'){
    // チーム→コーチ依頼を拒否 → チームに通知
    addNotif(`マッチング申請が見送られました（${_rc?.name||'コーチ'}）`,'fa-times-circle','threads',req.teamId);
  } else {
    // コーチ→チーム応募を拒否 → コーチに通知
    addNotif(`チームへの応募が見送られました（${_rt?.name||'チーム'}）`,'fa-times-circle','threads',req.coachId);
  }
  saveDB();
  toast('申請をお断りしました。','i');
  refreshPage();
}

// 自分の申請を取消
function cancelRequest(reqId){
  const req=_dbArr('requests').find(r=>r.id===reqId);
  if(!req) return;
  req.status='cancelled';
  saveDB();
  toast('申請を取り消しました。','i');
  refreshPage();
}

// チャットルームへジャンプ
function openMatchChatByKey(chatKey){
  if(!DB.chats[chatKey]){toast('チャットルームが見つかりません','e');return;}
  goTo('chat');
  setTimeout(()=>switchRoom(chatKey,getMyKey()),350);
}

// req_XXX キーからchatKeyを探してjump
function openMatchChat(reqId){
  const chatKey=Object.keys(DB.chats).find(k=>DB.chats[k].reqId===reqId||(()=>{
    const r=_dbArr('requests').find(x=>x.id===reqId);
    return r&&DB.chats[k].coachId===r.coachId&&DB.chats[k].teamId===r.teamId;
  })());
  if(chatKey) openMatchChatByKey(chatKey);
  else toast('チャットルームがまだ作成されていません','i');
}

// 旧互換ラッパー（チャット内の承認ボタン用）
function acceptMatchRequest(reqId,chatKey){
  approveRequest(reqId);
}
function rejectMatchRequest(reqId,chatKey){
  rejectRequest(reqId);
}
function adminAcceptMatch(reqId){
  approveRequest(reqId);
}
function quickAcceptMatch(reqId){ approveRequest(reqId); }
function quickRejectMatch(reqId){ rejectRequest(reqId); }
function openRequestChat(reqId){ openMatchChat(reqId); }

function feeBadge(s){if(!s)return'<span class="badge b-gray">未請求</span>';if(s==='paid')return'<span class="fee-badge f-paid">✓ 支払済</span>';if(s==='pending')return'<span class="fee-badge f-pending">🕐 確認中</span>';return'<span class="fee-badge f-unpaid">&times; 未払い</span>'}
function markPaid(id){if(DB.currentUser?.role!=='admin'){toast('この操作は事務局のみ実行できます','e');return;}const p=_dbArr('payments').find(x=>x.id===id);if(p){p.status='paid';p.paidAt=new Date().toISOString();const pl=DB.players.find(x=>x.id===p.player);addAuditLog('payment_confirm','入金確認: '+(pl?.name||'選手')+' ¥'+(p.amount||0).toLocaleString(),{payId:id,player:p.player});}saveDB();toast('入金を確認しました','s');addNotif('月謝の入金を確認しました','fa-check-circle','fee');goTo(curPage)}
function markPaidPl(pid){if(DB.currentUser?.role!=='admin'&&DB.currentUser?.role!=='team'){toast('この操作は事務局またはチーム管理者のみ実行できます','e');return;}const p=DB.players.find(x=>x.id===pid);if(p)p.status='paid';const pay=_dbArr('payments').find(x=>x.player===pid&&x.month===curMonth());if(pay){pay.status='paid';pay.paidAt=new Date().toISOString();}saveDB();toast('入金を確認しました','s');addNotif('月謝の入金を確認しました','fa-check-circle','fee');goTo(curPage)}
function showDayEvt(d,y,m){
  y=y||new Date().getFullYear();m=m!=null?m:new Date().getMonth();
  const evs=_getVisibleEvents().filter(e=>{
    const ey=e.year||new Date().getFullYear(),em=e.month!==undefined?e.month:new Date().getMonth();
    return ey===y&&em===m&&e.date===d;
  });
  if(!evs.length){
    const ds=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    openEventModal(ds);
    return;
  }
  const icons={practice:'🏃',match:'⚽',payment:'💰',event:'🎉',meeting:'📋',other:'📌'};
  const myId=DB.currentUser?.id;
  const role=DB.currentUser?.role;
  openM(`${m+1}月${d}日のイベント`,evs.map(e=>{
    const canDelete=e.createdBy===myId||role==='admin'||role==='team';
    const isTeamEv=e.scope==='team';
    const teamName=isTeamEv?DB.teams.find(t=>t.id===e.teamId)?.name||'チーム':'';
    // RSVP集計
    const att=e.attendees||[];
    const going=att.filter(a=>a.status==='going');
    const notGoing=att.filter(a=>a.status==='not_going');
    const maybe=att.filter(a=>a.status==='maybe');
    const myRsvp=att.find(a=>a.uid===myId);
    const rsvpBtnStyle=(s,active)=>`padding:6px 12px;border-radius:8px;border:1px solid ${active?'var(--org)':'var(--b1)'};background:${active?'rgba(255,107,43,.1)':'var(--surf)'};color:${active?'var(--org)':'var(--txt2)'};font-size:11px;font-weight:${active?'700':'500'};cursor:pointer`;
    return `<div style="padding:14px;background:var(--surf2);border-radius:10px;margin-bottom:10px">
      <div class="flex justify-between items-start">
        <div><div class="fw7 text-sm">${icons[e.type]||'📌'} ${sanitize(e.title,40)}</div>
        <div class="text-xs text-muted mt-4">${e.time||''} ${e.place?'📍 '+sanitize(e.place,30):''} ${e.repeat?`🔁 ${{'weekly':'毎週','monthly':'毎月','daily':'毎日'}[e.repeat]||''}`:''}</div>
        ${e.note?`<div class="text-xs text-muted mt-4">📝 ${sanitize(e.note,60)}</div>`:''}
        ${isTeamEv?`<div class="text-xs mt-4" style="color:var(--blue)">🏟️ ${sanitize(teamName,20)} のチーム予定</div>`:''}
        </div>
        ${canDelete?`<button onclick="deleteEvent('${e.id}');closeM()" style="background:none;border:none;color:var(--red);cursor:pointer;font-size:16px" title="削除">&times;</button>`:''}
      </div>
      ${isTeamEv?`
      <div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--b1)">
        <div style="display:flex;gap:6px;margin-bottom:8px">
          <button onclick="rsvpEvent('${e.id}','going')" style="${rsvpBtnStyle('going',myRsvp?.status==='going')}">✅ 参加${going.length?' ('+going.length+')':''}</button>
          <button onclick="rsvpEvent('${e.id}','not_going')" style="${rsvpBtnStyle('not_going',myRsvp?.status==='not_going')}">❌ 欠席${notGoing.length?' ('+notGoing.length+')':''}</button>
          <button onclick="rsvpEvent('${e.id}','maybe')" style="${rsvpBtnStyle('maybe',myRsvp?.status==='maybe')}">🤔 未定${maybe.length?' ('+maybe.length+')':''}</button>
        </div>
        ${(role==='admin'||role==='team')?`<button class="btn btn-ghost btn-xs" onclick="showAttendanceDetail('${e.id}')">📊 出欠一覧</button>`:
          (att.length?`<div class="text-xs text-muted">参加${going.length} / 欠席${notGoing.length} / 未定${maybe.length}</div>`:'')}
      </div>`:''
      }
    </div>`;
  }).join('')+'<div class="flex gap-8 mt-12"><button class="btn btn-primary btn-sm" onclick="closeM();openEventModal(`'+y+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0')+'`)">+ イベントを追加</button><button class="btn btn-ghost btn-sm" onclick="closeM()">閉じる</button></div>'+
  (evs.length===1?'<div style="display:flex;gap:6px;margin-top:10px"><button class="btn btn-ghost btn-xs" onclick="addToGoogleCalendar(\''+evs[0].id+'\')">📅 Googleカレンダーに追加</button><button class="btn btn-ghost btn-xs" onclick="exportEventToICS(\''+evs[0].id+'\')">⬇️ .icsダウンロード</button></div>':''));
}

// ── 出欠管理（RSVP）──────────────────────
function rsvpEvent(eventId, status){
  const ev = DB.events.find(e => e.id === eventId);
  if(!ev){ toast('イベントが見つかりません','e'); return; }
  if(!ev.attendees) ev.attendees = [];
  const myId = DB.currentUser?.id;
  const myName = DB.currentUser?.name || '';
  // 既存回答を更新 or 新規追加
  const existing = ev.attendees.find(a => a.uid === myId);
  if(existing){
    existing.status = status;
    existing.updatedAt = new Date().toISOString();
  } else {
    ev.attendees.push({ uid:myId, name:myName, status, updatedAt:new Date().toISOString() });
  }
  saveDB();
  toast(status==='going'?'✅ 参加で回答しました':status==='not_going'?'❌ 欠席で回答しました':'🤔 未定で回答しました','s');
  // モーダルを更新
  closeM();
  const d = ev.date, m = ev.month, y = ev.year;
  setTimeout(() => showDayEvt(d, y, m), 100);
}

function showAttendanceDetail(eventId){
  const ev = DB.events.find(e => e.id === eventId);
  if(!ev) return;
  const att = ev.attendees || [];
  const going = att.filter(a => a.status === 'going');
  const notGoing = att.filter(a => a.status === 'not_going');
  const maybe = att.filter(a => a.status === 'maybe');
  // チームの全選手を取得して未回答者を計算
  const teamPlayers = DB.players.filter(p => p.team === ev.teamId);
  const respondedIds = new Set(att.map(a => a.uid));
  const noResponse = teamPlayers.filter(p => !respondedIds.has(p.id));
  
  const renderList = (list, icon) => list.length ? list.map(a => {
    const player = DB.players.find(p => p.id === a.uid);
    return `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--b1)">
      <span style="font-size:14px">${icon}</span>
      <span class="text-sm">${sanitize(a.name || player?.name || '不明', 20)}</span>
      <span class="text-xs text-muted" style="margin-left:auto">${a.updatedAt ? new Date(a.updatedAt).toLocaleString('ja-JP',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}) : ''}</span>
    </div>`;
  }).join('') : '<div class="text-xs text-muted" style="padding:8px 0">なし</div>';

  openM(`📊 出欠一覧 — ${sanitize(ev.title,30)}`, `
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px;text-align:center">
      <div style="padding:10px;background:#ecfdf5;border-radius:10px"><div style="font-size:20px;font-weight:800;color:#16a34a">${going.length}</div><div style="font-size:10px;color:#16a34a">参加</div></div>
      <div style="padding:10px;background:#fef2f2;border-radius:10px"><div style="font-size:20px;font-weight:800;color:#ef4444">${notGoing.length}</div><div style="font-size:10px;color:#ef4444">欠席</div></div>
      <div style="padding:10px;background:#fffbeb;border-radius:10px"><div style="font-size:20px;font-weight:800;color:#f59e0b">${maybe.length}</div><div style="font-size:10px;color:#f59e0b">未定</div></div>
      <div style="padding:10px;background:#f1f5f9;border-radius:10px"><div style="font-size:20px;font-weight:800;color:#64748b">${noResponse.length}</div><div style="font-size:10px;color:#64748b">未回答</div></div>
    </div>
    <div style="max-height:350px;overflow-y:auto">
      <div class="fw7 text-sm mb-4" style="color:#16a34a">✅ 参加 (${going.length})</div>
      ${renderList(going, '✅')}
      <div class="fw7 text-sm mb-4 mt-12" style="color:#ef4444">❌ 欠席 (${notGoing.length})</div>
      ${renderList(notGoing, '❌')}
      <div class="fw7 text-sm mb-4 mt-12" style="color:#f59e0b">🤔 未定 (${maybe.length})</div>
      ${renderList(maybe, '🤔')}
      ${noResponse.length ? `<div class="fw7 text-sm mb-4 mt-12" style="color:#64748b">📭 未回答 (${noResponse.length})</div>
      ${noResponse.map(p => `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--b1)">
        <span style="font-size:14px">📭</span>
        <span class="text-sm">${sanitize(p.name,20)}</span>
        <button class="btn btn-ghost btn-xs" style="margin-left:auto" onclick="sendRsvpReminder('${ev.id}','${p.id}')">📧 リマインド</button>
      </div>`).join('')}` : ''}
    </div>
    <div class="flex gap-10 mt-16">
      <button class="btn btn-primary flex-1" onclick="sendRsvpReminderAll('${ev.id}')">📧 未回答者に一斉リマインド</button>
      <button class="btn btn-ghost flex-1" onclick="closeM()">閉じる</button>
    </div>
  `);
}

function sendRsvpReminder(eventId, playerId){
  const ev = DB.events.find(e => e.id === eventId);
  const player = DB.players.find(p => p.id === playerId);
  if(!ev || !player) return;
  const targetId = player.guardianId || player.id;
  addNotif(`📅 ${ev.title}（${ev.month+1}/${ev.date}）の出欠を回答してください`, 'fa-calendar-check', 'calendar', targetId);
  toast(player.name + 'にリマインドを送りました','s');
}

function sendRsvpReminderAll(eventId){
  const ev = DB.events.find(e => e.id === eventId);
  if(!ev) return;
  const att = ev.attendees || [];
  const respondedIds = new Set(att.map(a => a.uid));
  const teamPlayers = DB.players.filter(p => p.team === ev.teamId);
  const noResponse = teamPlayers.filter(p => !respondedIds.has(p.id));
  noResponse.forEach(p => sendRsvpReminder(eventId, p.id));
  closeM();
  toast(`${noResponse.length}名にリマインドを送りました`,'s');
}

// ── 練習メニュー配信（コーチ→選手）──────────────────
function openShareWorkoutModal(){
  const me = getMyCoach();
  if(!me){ toast('コーチ情報が見つかりません','e'); return; }
  const team = DB.teams.find(t => t.id === me.team);
  if(!team){ toast('チームに未所属です','e'); return; }
  const allWorkouts = getAllWorkouts();
  const players = DB.players.filter(p => p.team === me.team);
  
  openM('📋 練習メニューを配信', `
    <div style="margin-bottom:16px;padding:12px;background:var(--surf2);border-radius:10px;font-size:12px;color:var(--txt3);line-height:1.7">
      作成済みのトレーニングメニューを選手に配信します。選手のダッシュボードに「今日のおすすめメニュー」として表示されます。
    </div>
    
    <div class="form-group">
      <label class="label">配信するメニュー</label>
      <select id="sw-workout" class="input">
        ${allWorkouts.map(w => `<option value="${w.id}">${sanitize(w.type||w.day||'メニュー',30)} (${w.exercises?.length||0}種目)</option>`).join('')}
      </select>
    </div>
    
    <div class="form-group">
      <label class="label">対象選手</label>
      <div style="max-height:200px;overflow-y:auto;border:1px solid var(--b1);border-radius:10px;padding:8px">
        <label style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--b1);cursor:pointer;font-size:13px;font-weight:700">
          <input type="checkbox" id="sw-all" checked onchange="document.querySelectorAll('.sw-player').forEach(c=>c.checked=this.checked)"> 全員に配信
        </label>
        ${players.map(p => `
          <label style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--b1);cursor:pointer;font-size:13px">
            <input type="checkbox" class="sw-player" value="${p.id}" checked> ${sanitize(p.name,20)} <span class="text-xs text-muted">${p.pos||''}</span>
          </label>
        `).join('')}
      </div>
    </div>
    
    <div class="form-group">
      <label class="label">コーチからのメッセージ（任意）</label>
      <textarea id="sw-msg" class="input" rows="2" placeholder="今日は上半身を重点的にやりましょう！" maxlength="200"></textarea>
    </div>
    
    <div class="form-group">
      <label class="label">実施日</label>
      <input id="sw-date" class="input" type="date" value="${new Date().toISOString().slice(0,10)}">
    </div>
    
    <div class="flex gap-10 mt-8">
      <button class="btn btn-primary flex-1" onclick="sendWorkoutToPlayers()">📤 配信する</button>
      <button class="btn btn-ghost flex-1" onclick="closeM()">キャンセル</button>
    </div>
  `);
}

function sendWorkoutToPlayers(){
  const workoutId = document.getElementById('sw-workout')?.value;
  const msg = sanitize(document.getElementById('sw-msg')?.value || '', 200);
  const date = document.getElementById('sw-date')?.value || new Date().toISOString().slice(0,10);
  const selectedPlayers = Array.from(document.querySelectorAll('.sw-player:checked')).map(c => c.value);
  
  if(!workoutId){ toast('メニューを選択してください','e'); return; }
  if(!selectedPlayers.length){ toast('対象選手を選択してください','e'); return; }
  
  const workout = getAllWorkouts().find(w => w.id === workoutId);
  if(!workout){ toast('メニューが見つかりません','e'); return; }
  
  const me = getMyCoach();
  const distributionId = 'wd_' + Date.now();
  
  // 各選手のtrainingLogに配信メニューを記録
  selectedPlayers.forEach(pid => {
    if(!DB.trainingLog) DB.trainingLog = {};
    if(!DB.trainingLog[pid]) DB.trainingLog[pid] = {};
    
    // 既存の記録がある場合はassignedWorkoutのみ追加
    if(!DB.trainingLog[pid][date]) DB.trainingLog[pid][date] = { date, updatedAt: new Date().toISOString() };
    DB.trainingLog[pid][date].assignedWorkout = {
      id: distributionId,
      workoutId: workout.id,
      workoutName: workout.type || workout.day || 'メニュー',
      exercises: workout.exercises || [],
      intensity: workout.intensity || 70,
      coachId: me?.id,
      coachName: me?.name || 'コーチ',
      coachMsg: msg,
      assignedAt: new Date().toISOString()
    };
    DB.trainingLog[pid][date].updatedAt = new Date().toISOString();
    
    // 選手に通知
    const player = DB.players.find(p => p.id === pid);
    addNotif(`🏋️ ${me?.name||'コーチ'}から練習メニューが届きました: ${sanitize(workout.type||workout.day||'',20)}`, 'fa-dumbbell', 'training', pid);
    
    // 保護者にも通知
    if(player?.guardianId){
      addNotif(`📋 ${player.name}に練習メニューが配信されました`, 'fa-clipboard-list', 'parent-report', player.guardianId);
    }
  });
  
  saveDB();
  closeM();
  toast(`📤 ${selectedPlayers.length}名にメニューを配信しました！`,'s');
  addAuditLog('workout_distribute', `${me?.name||'コーチ'}が${selectedPlayers.length}名にメニュー配信: ${workout.type||workout.day}`, {workoutId, players:selectedPlayers.length});
}

// 選手ダッシュボードで配信メニューを表示するヘルパー
function _getAssignedWorkout(playerId){
  const today = new Date().toISOString().slice(0,10);
  const log = DB.trainingLog?.[playerId]?.[today];
  return log?.assignedWorkout || null;
}

function _renderAssignedWorkout(playerId){
  const aw = _getAssignedWorkout(playerId);
  if(!aw) return '';
  return `<div style="margin-bottom:16px;padding:16px;background:linear-gradient(135deg,rgba(255,107,43,.06),rgba(245,158,11,.04));border:1px solid rgba(255,107,43,.15);border-radius:14px">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
      <div style="width:28px;height:28px;background:var(--org);border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px">🏋️</div>
      <div>
        <div style="font-size:13px;font-weight:700">今日のおすすめメニュー</div>
        <div style="font-size:11px;color:var(--txt3)">${sanitize(aw.coachName,15)} コーチから</div>
      </div>
    </div>
    ${aw.coachMsg?`<div style="font-size:12px;color:var(--txt2);margin-bottom:10px;padding:8px;background:rgba(255,255,255,.6);border-radius:8px;line-height:1.6">💬 ${sanitize(aw.coachMsg,150)}</div>`:''}
    <div style="font-size:13px;font-weight:700;margin-bottom:6px">${sanitize(aw.workoutName,30)}</div>
    <div style="display:flex;flex-wrap:wrap;gap:4px">
      ${(aw.exercises||[]).slice(0,6).map(ex => `<span style="font-size:10px;padding:3px 8px;background:var(--surf);border:1px solid var(--b1);border-radius:6px">${sanitize(ex.name||'',15)} ${ex.sets||3}×${ex.reps||10}</span>`).join('')}
      ${(aw.exercises||[]).length>6?`<span style="font-size:10px;padding:3px 8px;color:var(--txt3)">+${(aw.exercises||[]).length-6}種目</span>`:''}
    </div>
    <button class="btn btn-primary btn-sm w-full mt-10" onclick="goTo('training')">📝 トレーニングを記録する</button>
  </div>`;
}

function _setupAdminAccount(){
  openM('管理者アカウント初回設定',`
    <div style="margin-bottom:16px;font-size:13px;color:var(--txt3)">
      管理者アカウントを作成します。このアカウントはPINコード+パスワードでのみアクセスできます。
    </div>
    <div class="form-group">
      <label class="label">管理者メールアドレス</label>
      <input class="input" id="admin-setup-email" type="email" placeholder="管理者メールアドレス">
    </div>
    <div class="form-group">
      <label class="label">パスワード（8文字以上）</label>
      <input class="input" id="admin-setup-pw" type="password" placeholder="••••••••">
    </div>
    <div class="form-group">
      <label class="label">管理者名</label>
      <input class="input" id="admin-setup-name" placeholder="事務局 管理者">
    </div>
    <div class="flex gap-10 mt-20">
      <button class="btn btn-primary" onclick="_createAdminAccount()">✅ 作成する</button>
      <button class="btn btn-ghost" onclick="closeM()">キャンセル</button>
    </div>
  `);
}

async function _createAdminAccount(){
  const email = (document.getElementById('admin-setup-email')?.value||'').trim().toLowerCase();
  const pw    = document.getElementById('admin-setup-pw')?.value||'';
  const name  = (document.getElementById('admin-setup-name')?.value||'事務局 管理者').trim();
  if(!email||!email.includes('@')){ toast('メールアドレスを入力してください','e'); return; }
  if(pw.length<8){ toast('パスワードは8文字以上で入力してください','e'); return; }
  if(_getUsers().some(u=>u.email===email)){ toast('このメールアドレスはすでに使われています','e'); return; }

  const pwHash = await _hashPassword(pw, email);
  const uid    = genId('admin');
  const now    = new Date().toLocaleString('ja-JP');
  const users  = _getUsers();
  users.push({ id:uid, role:'admin', name, email, pwHash, createdAt:now });
  _saveUsers(users);
  saveDB();
  closeM();
  toast('管理者アカウントを作成しました。ログインしてください。','s');
  const emailEl = document.getElementById('l-email');
  if(emailEl) emailEl.value = email;
  switchAuth('login');
}

// Stripe Connect 口座登録開始
async function startStripeConnect(){
  const user = DB.currentUser;
  if(!user){ toast('ログインが必要です','e'); return; }
  try {
    const res = await fetch(API_BASE+'/create-connect-account', {
      method:'POST',
      headers: await _apiHeaders(),
      body: JSON.stringify({userId:user.id, email:user.email, name:user.name, role:user.role})
    });
    const data = await res.json();
    if(data.url && (data.url.startsWith('https://connect.stripe.com') || data.url.startsWith('https://dashboard.stripe.com'))){ window.open(data.url,'_blank'); }
    else { toast('口座登録URLの取得に失敗しました','e'); }
  } catch(e){
    toast('決済サーバーに接続できませんでした。管理者にお問い合わせください。','e');
  }
}


// ──────────────────────────────────────
// 月謝一括請求（未払い選手に請求記録追加）
// ──────────────────────────────────────
function doBulkInvoice(){
  if(window._sendingBulk){return;}window._sendingBulk=true;setTimeout(()=>{window._sendingBulk=false;},3000);
  const team = getMyTeam();
  if(!team){ toast('チーム情報が見つかりません','e'); return; }
  if(team.fee <= 0){ toast('チームの月謝金額を先に設定してください','w'); return; }
  const month = curMonth();
  const unpaidPlayers = DB.players.filter(p => {
    if(p.team !== team.id) return false;
    const pay = _dbArr('payments').find(x => x.player === p.id && x.month === month);
    return !pay || pay.status !== 'paid';
  });
  if(unpaidPlayers.length === 0){
    toast('未払いの選手はいません','i'); return;
  }
  unpaidPlayers.forEach(p => {
    const existing = _dbArr('payments').find(x => x.player === p.id && x.month === month);
    if(!existing){
      _dbArr('payments').push({
        id: genId('pay'), player: p.id, team: team.id,
        amount: team.fee, month, status: 'unpaid', at: null,
        fee: getFeeAmount(team.fee, team.id, 'monthlyFee'),
      });
    }
  });
  saveDB();
  toast(`${unpaidPlayers.length}名に月謝請求を送付しました`, 's');
  addNotif(`${month}分の月謝を${unpaidPlayers.length}名に一括請求しました`, 'fa-file-invoice', 'fee');
  // 各選手/保護者に通知
  unpaidPlayers.forEach(p => {
    const targetId = p.guardianId || p.id;
    addNotif(`📄 ${month}分の月謝請求が届きました（¥${fmtNum(team.fee)}）`, 'fa-yen-sign', 'parent-fee', targetId);
  });
  refreshPage();
}

// ──────────────────────────────────────
// 月謝CSVエクスポート
// ──────────────────────────────────────

// ============================================================
// PDF出力機能
// ============================================================
async function exportReportPDF(pid) {
  if(!pid){toast('選手を選択してください','e');return;}
  const p = DB.players.find(x=>x.id===pid);
  if(!p){toast('選手が見つかりません','e');return;}
  const coach = getMyCoach();
  const team = DB.teams.find(t=>t.id===p.team);
  const log = DB.trainingLog[p.id]||{};
  const logEntries = Object.values(log).sort((a,b)=>a.date>b.date?-1:1).slice(0,10);

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });

  // フォント設定（日本語はゴシック系のhelvética代替）
  const W=210, M=18;

  // ─── ヘッダー ───────────────────────────────────────
  doc.setFillColor(14,30,50);
  doc.rect(0,0,W,28,'F');
  doc.setTextColor(255,107,43);
  doc.setFontSize(16);doc.setFont('helvetica','bold');
  doc.text('MyCOACH-MyTEAM', M, 12);
  doc.setTextColor(255,255,255);
  doc.setFontSize(11);doc.setFont('helvetica','normal');
  doc.text('Coaching Report', M, 20);
  doc.setFontSize(9);
  doc.text(new Date().toLocaleDateString('ja-JP'), W-M, 20, {align:'right'});

  // ─── 選手情報 ─────────────────────────────────────
  doc.setTextColor(30,30,30);
  doc.setFontSize(13);doc.setFont('helvetica','bold');
  doc.text('Player Information', M, 38);
  doc.setDrawColor(255,107,43);doc.setLineWidth(0.8);
  doc.line(M, 40, W-M, 40);

  doc.setFont('helvetica','normal');doc.setFontSize(10);
  const info = [
    ['Name', p.name||'-'], ['Team', team?.name||'-'], ['Coach', coach?.name||'-'],
    ['Age', p.age?p.age+'y':'-'], ['Position', p.pos||'-'],
    ['Weight', p.weight?p.weight+'kg':'-'], ['Height', p.height?p.height+'cm':'-'],
  ];
  let y=48;
  info.forEach(([k,v],i)=>{
    const col = i%2===0 ? M : W/2;
    if(i%2===0&&i>0) y+=8;
    doc.setTextColor(100,100,100);doc.text(k+':', col, y);
    doc.setTextColor(30,30,30);doc.text(String(v), col+28, y);
  });
  y+=12;

  // ─── トレーニング実績 ─────────────────────────────
  doc.setFontSize(13);doc.setFont('helvetica','bold');doc.setTextColor(30,30,30);
  doc.text('Training Log (Recent 10)', M, y);
  doc.setDrawColor(255,107,43);doc.line(M, y+2, W-M, y+2);
  y+=8;

  if(logEntries.length){
    doc.setFont('helvetica','bold');doc.setFontSize(9);doc.setTextColor(255,255,255);
    doc.setFillColor(14,30,50);
    doc.rect(M,y-4,W-M*2,6,'F');
    doc.text('Date',M+2,y);doc.text('Duration',M+50,y);doc.text('kcal',M+90,y);doc.text('Note',M+115,y);
    y+=4;
    logEntries.forEach((l,i)=>{
      if(i%2===0){doc.setFillColor(245,248,252);doc.rect(M,y-3,W-M*2,6,'F');}
      doc.setFont('helvetica','normal');doc.setFontSize(9);doc.setTextColor(30,30,30);
      doc.text(String(l.date||'-'),M+2,y);
      doc.text(l.time?l.time+'min':'-',M+50,y);
      doc.text(l.kcal?String(l.kcal):'- ',M+90,y);
      doc.text(l.note?String(l.note).slice(0,20):'-',M+115,y);
      y+=6;
    });
  } else {
    doc.setFont('helvetica','normal');doc.setFontSize(10);doc.setTextColor(150,150,150);
    doc.text('No training records found.', M, y+4);
    y+=10;
  }
  y+=6;

  // ─── コーチコメント ───────────────────────────────
  const coachComment = p.coachComment || '';
  if(coachComment){
    doc.setFontSize(13);doc.setFont('helvetica','bold');doc.setTextColor(30,30,30);
    doc.text('Coach Comment', M, y);
    doc.setDrawColor(255,107,43);doc.line(M,y+2,W-M,y+2);
    y+=8;
    doc.setFont('helvetica','normal');doc.setFontSize(10);
    doc.setFillColor(248,249,250);doc.rect(M,y-4,W-M*2,20,'F');
    const lines = doc.splitTextToSize(coachComment, W-M*2-4);
    doc.text(lines, M+2, y);
    y+=Math.max(16, lines.length*5+4);
  }

  // ─── フッター ─────────────────────────────────────
  doc.setFillColor(240,244,248);
  doc.rect(0, 277, W, 20, 'F');
  doc.setFontSize(8);doc.setTextColor(100,100,100);
  doc.text('Confidential - MyCOACH-MyTEAM Coaching Report', M, 285);
  doc.text(`Page 1 / 1`, W-M, 285, {align:'right'});

  doc.save(`coaching_report_${p.name||pid}_${new Date().toISOString().slice(0,10)}.pdf`);
  toast('PDFを出力しました','s');
}

async function exportReceiptPDF() {
  const team = getMyTeam();
  if(!team){toast('チーム情報が見つかりません','e');return;}
  const paid = _dbArr('payments').filter(x=>x.team===team.id&&x.status==='paid');
  if(!paid.length){toast('支払い済みデータがありません','e');return;}

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
  const W=210, M=20;
  let pageY = 20;

  paid.forEach((pay, pi) => {
    if(pi>0){doc.addPage();pageY=20;}
    const player = DB.players.find(x=>x.id===pay.player);

    doc.setFillColor(14,30,50);doc.rect(0,0,W,22,'F');
    doc.setTextColor(255,107,43);doc.setFontSize(18);doc.setFont('helvetica','bold');
    doc.text('RECEIPT', M, 14);
    doc.setTextColor(255,255,255);doc.setFontSize(9);doc.setFont('helvetica','normal');
    doc.text('MyCOACH-MyTEAM', W-M, 14, {align:'right'});

    pageY=36;
    doc.setFillColor(248,249,250);doc.rect(M,pageY-6,W-M*2,40,'F');
    doc.setTextColor(30,30,30);doc.setFontSize(11);doc.setFont('helvetica','bold');
    doc.text('Receipt Details', M+4, pageY+2);
    doc.setFont('helvetica','normal');doc.setFontSize(10);
    const items=[
      ['Receipt No.', `RCP-${pay.id.slice(-8).toUpperCase()}`],
      ['Date', pay.paidAt||new Date().toLocaleDateString('ja-JP')],
      ['Player', player?.name||pay.player],
      ['Team', team.name],
      ['Month', pay.month||'-'],
    ];
    items.forEach(([k,v],i)=>{
      doc.setTextColor(120,120,120);doc.text(k, M+4, pageY+10+i*7);
      doc.setTextColor(30,30,30);doc.text(String(v), M+50, pageY+10+i*7);
    });
    pageY+=50;

    // 金額
    doc.setFillColor(255,107,43);doc.rect(M,pageY,W-M*2,18,'F');
    doc.setTextColor(255,255,255);doc.setFontSize(10);doc.setFont('helvetica','bold');
    doc.text('Amount Paid', M+4, pageY+7);
    doc.setFontSize(16);
    doc.text('¥'+Number(pay.amount||0).toLocaleString(), W-M-4, pageY+12, {align:'right'});
    pageY+=26;

    doc.setFont('helvetica','normal');doc.setFontSize(9);doc.setTextColor(150,150,150);
    doc.text('Thank you for your payment.', M, pageY+6);
    doc.text('Payment confirmation issued by MyCOACH-MyTEAM platform.', M, pageY+12);
    doc.setFontSize(7);doc.setTextColor(180,180,180);
    doc.text('* This is a payment confirmation, not a qualified invoice under Japanese tax law.', M, pageY+18);
    doc.text('* For tax filing purposes, please use Stripe payment receipts or consult your tax advisor.', M, pageY+22);
  });

  doc.save(`receipt_${team.name}_${new Date().toISOString().slice(0,10)}.pdf`);
  toast(`${paid.length}件の領収書PDFを出力しました`,'s');
}
// ─── コーチ向けAI週次サマリー ────────────────────────────────
async function generateWeeklyAISummary(){
  const me=getMyCoach();if(!me||!me.team)return toast('チーム情報が見つかりません','e');
  const players=DB.players.filter(p=>p.team===me.team);
  if(!players.length)return toast('選手データがありません','e');

  const summaryData=players.map(p=>{
    const log=DB.trainingLog[p.id]||{};
    const entries=Object.values(log).sort((a,b)=>a.date>b.date?-1:1).slice(0,7);
    const avgCond=entries.length?(entries.reduce((s,e)=>s+(e.cond||0),0)/entries.length).toFixed(1):'データなし';
    return `${p.name}（${p.pos||'--'}）: コンディション平均${avgCond}, トレーニング${entries.length}回`;
  }).join('\n');

  const prompt=`あなたはスポーツチームの専任AIアシスタントです。以下の選手データをもとに、コーチ向けの週次指導サマリーを日本語で作成してください。

チーム: ${me.team?DB.teams.find(t=>t.id===me.team)?.name||'不明':'未所属'}
コーチ: ${me.name}

【今週の選手データ】
${summaryData}

以下の形式で300文字以内でまとめてください：
1. 今週の総評（1〜2文）
2. 注意が必要な選手（コンディション低下など）
3. 来週の重点指導ポイント（具体的に2点）`;

  openM('🤖 AI週次サマリー生成中...',`<div style="text-align:center;padding:30px"><div style="font-size:32px;margin-bottom:12px">🤖</div><div class="text-sm text-muted">Claudeが選手データを分析中...</div></div>`);

  try{
    // セキュリティ: AI呼び出しは必ずバックエンドプロキシ経由
    if(typeof API_BASE === 'undefined' || !API_BASE){
      throw new Error('AI機能はバックエンドサーバーが必要です');
    }
    var _fbToken3='';
    try { _fbToken3=await window._fbAuth?.currentUser?.getIdToken()||''; } catch(e){}
    var res3,data3,summary;
    res3=await fetch(API_BASE+'/api/ai/chat',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+_fbToken3},
      body:JSON.stringify({messages:[{role:'user',content:prompt}]})
    });
    data3=await res3.json();
    summary=data3.text||'サマリーを取得できませんでした。';
    openM('🤖 AI週次サマリー',`<div>
      <div style="padding:16px;background:rgba(0,207,170,.06);border:1px solid rgba(0,207,170,.2);border-radius:12px;margin-bottom:14px">
        <div class="text-xs fw7 mb-8" style="color:var(--teal)">📊 AIによる分析 · ${new Date().toLocaleDateString('ja-JP')}</div>
        <div class="text-sm" style="line-height:1.9;white-space:pre-wrap">${summary.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\*\*(.*?)\*\*/g,'<b>$1</b>')}</div>
      </div>
      <div class="flex gap-8">
        <button class="btn btn-secondary btn-sm flex-1" onclick="copyToClipboard('${summary.replace(/'/g,"\\'").replace(/\n/g,'\\n')}')">📋 コピー</button>
        <button class="btn btn-ghost btn-sm flex-1" onclick="closeM()">閉じる</button>
      </div>
    </div>`);
  }catch(e){
    // フォールバック
    const fallback=`【AI週次サマリー（フォールバック）】\n\n今週は${players.length}名の選手データを確認しました。\n\n各選手のコンディション推移を継続的に記録し、コーチとの定期的なフィードバックセッションを設けることをお勧めします。\n\n来週の重点ポイント:\n1. コンディション低下選手の個別ヒアリング\n2. 練習強度のバランス調整`;
    openM('🤖 AI週次サマリー',`<div style="padding:16px;background:rgba(0,207,170,.06);border-radius:12px"><div class="text-sm" style="line-height:1.9;white-space:pre-wrap">${fallback}</div><button class="btn btn-ghost btn-sm w-full mt-12" onclick="closeM()">閉じる</button></div>`);
  }
}
function copyToClipboard(text){
  navigator.clipboard?.writeText(text).then(()=>toast('クリップボードにコピーしました','s')).catch(()=>toast('コピーに失敗しました','e'));
}

function exportEarningsCSV(){
  const me=getMyCoach();if(!me)return;
  const paid=_dbArr('coachPay').filter(p=>p.coach===me.id&&p.status==='paid');
  if(!paid.length){toast('支払い済みデータがありません','e');return;}
  const header=['月','チーム名','金額(手数料前)','コーチ受取額','支払日'];
  const rows=paid.map(p=>{
    const t=DB.teams.find(x=>x.id===p.teamId)||{name:'-'};
    return [p.month||'-',t.name,p.amount||0,p.coachReceives||0,p.paidAt||'-'];
  });
  const csv=[header,...rows].map(r=>r.join(',')).join('\n');
  const a=document.createElement('a');
  a.href='data:text/csv;charset=utf-8,'+encodeURIComponent('\uFEFF'+csv);
  a.download=`earnings_${me.name}_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();toast('CSVを出力しました','s');
}
function earningsSimModal(){
  const me=getMyCoach();
  const contractTeams=me?.team?1:0;
  const monthlyBase=_dbArr('coachPay').filter(p=>p.coach===me?.id&&p.status==='paid'&&p.month===curMonth()).reduce((s,p)=>s+(p.coachReceives||0),0);
  const projected=monthlyBase*12;
  return`<div style="display:grid;gap:14px">
    <div style="padding:16px;background:var(--surf2);border-radius:10px;text-align:center">
      <div class="text-xs text-muted">今月の収益</div>
      <div style="font-size:28px;font-weight:700;color:var(--org);margin:6px 0">¥${monthlyBase.toLocaleString()}</div>
      <div class="text-xs text-muted">契約チーム数: ${contractTeams}チーム</div>
    </div>
    <div style="padding:16px;background:rgba(255,107,43,.06);border-radius:10px;text-align:center;border:1px solid rgba(255,107,43,.2)">
      <div class="text-xs text-muted">現在ペース継続 → 年間予想収益</div>
      <div style="font-size:32px;font-weight:700;color:var(--org);margin:8px 0">¥${projected.toLocaleString()}</div>
    </div>
    <div style="padding:12px;background:rgba(0,207,170,.06);border-radius:8px;font-size:12px;color:var(--teal)">
      <i class="fa fa-circle-info"></i> 複数チームとの契約でさらに収益を伸ばせます。チーム検索でマッチングを増やしましょう。
    </div>
    <button class="btn btn-primary w-full" onclick="goTo('team-search');closeM()">🔍 チームを探す</button>
  </div>`;
}
function exportFeeCSV(){
  const team = getMyTeam();
  if(!team){ toast('チーム情報が見つかりません','e'); return; }
  const month = curMonth();
  const rows = [['選手名','保護者名','月謝金額','支払状況','支払日','月']];
  DB.players
    .filter(p => p.team === team.id)
    .forEach(p => {
      const pay = _dbArr('payments').find(x => x.player === p.id && x.month === month);
      rows.push([
        p.name,
        p.guardian || '',
        pay ? pay.amount : team.fee,
        pay ? (pay.status === 'paid' ? '支払済' : '未払い') : '未払い',
        pay?.at || '',
        month,
      ]);
    });
  const csv = rows.map(r =>
    r.map(v => '"' + String(v).replace(/"/g,'""') + '"').join(',')
  ).join('\n');
  const bom  = '\uFEFF'; // Excel BOM
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `月謝管理_${team.name}_${month}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast('CSVをダウンロードしました','s');
}

// ──────────────────────────────────────
// 管理者PINコード変更
// ──────────────────────────────────────
function showChangePinModal(){
  openM('PINコードを変更', `
    <div style="margin-bottom:16px;font-size:13px;color:var(--txt3)">
      管理者ログインに使用するPINコード（4桁）を変更します。
    </div>
    <div class="form-group">
      <label class="label">新しいPINコード（4桁の数字）</label>
      <input class="input" id="new-pin" min="1000" max="9999" type="number" placeholder="1234" maxlength="4"
        oninput="this.value=this.value.replace(/[^0-9]/g,'').slice(0,4)">
    </div>
    <div class="form-group">
      <label class="label">確認（もう一度入力）</label>
      <input class="input" id="new-pin2" min="1000" max="9999" type="number" placeholder="1234" maxlength="4"
        oninput="this.value=this.value.replace(/[^0-9]/g,'').slice(0,4)">
    </div>
    <button class="btn btn-primary w-full mt-8" onclick="doChangePin()">PINを変更する</button>
  `);
}

async function doChangePin(){
  const pin  = (document.getElementById('new-pin')?.value||'').trim();
  const pin2 = (document.getElementById('new-pin2')?.value||'').trim();
  if(pin.length !== 4 || !/^[0-9]{4}$/.test(pin)){
    toast('PINコードは6〜8桁の数字で入力してください','e'); return;
  }
  if(pin !== pin2){
    toast('PINコードが一致しません','e'); return;
  }
  const hash = await _hashPin(pin);
  localStorage.setItem('mc_admin_pin_hash', hash);
  closeM();
  toast('PINコードを変更しました','s');
}

// ──────────────────────────────────────
// 全登録ユーザーCSVエクスポート（管理者用）
// ──────────────────────────────────────
function exportAllUsersCSV(){
  if(DB.currentUser?.role !== 'admin'){ toast('管理者のみ利用できます','e'); return; }
  const users = _getUsers();
  const rows  = [['ID','ロール','氏名','メールアドレス','登録日時']];
  users.forEach(u => {
    rows.push([u.id, u.role, u.name, u.email, u.createdAt||'']);
  });
  const csv  = rows.map(r =>
    r.map(v => '"' + String(v||'').replace(/"/g,'""') + '"').join(',')
  ).join('\n');
  const bom  = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `登録ユーザー_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast(`${users.length}件のユーザーをCSV出力しました`,'s');
}

// データエクスポート（JSON）
function exportDBData(){
  const data = {};
  PERSIST_FIELDS.forEach(k => { data[k] = DB[k]; });
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], {type:'application/json'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `mycoach_data_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('データをエクスポートしました','s');
}


// ═══════════════════════════════════════════════
// プッシュ通知 + メール通知 + マルチタブ同期
// ═══════════════════════════════════════════════

// ── ブラウザプッシュ通知 ──
let _pushPermission = 'default';
function sendPushNotif(title, body, icon){
  if(!('Notification' in window)||Notification.permission!=='granted')return;
  try{
    const n=new Notification(title,{body,icon:icon||'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="%230ea5e9"/><path d="M16 4L6 10v6c0 7 4.5 13.5 10 15 5.5-1.5 10-8 10-15v-6L16 4z" fill="white" opacity=".9"/></svg>',tag:'mc-'+Date.now(),requireInteraction:false});
    n.onclick=function(){window.focus();n.close();};
    setTimeout(()=>{try{n.close();}catch(e){}},8000);
  }catch(e){}
}

// ── メール通知（シミュレーション + ログ記録） ──
if(!DB.emailLog) DB.emailLog=[];
function sendEmailNotif(toEmail, toName, subject, body){
  if(!toEmail)return;
  const entry={id:'em'+Date.now(),to:toEmail,toName:toName||'',subject,body,sentAt:new Date().toISOString(),status:'pending'};
  if(!DB.emailLog)DB.emailLog=[];
  _dbArr('emailLog').push(entry);
  if((DB.emailLog||[]).length>200)DB.emailLog=DB.emailLog.slice(-200);
  saveDB();
  // バックエンド経由で実際にメール送信
  if(typeof API_BASE!=='undefined'&&API_BASE){
    _apiHeaders().then(function(hdrs){
      return fetch(API_BASE+'/api/email/send',{
        method:'POST',
        headers:hdrs,
        body:JSON.stringify({to:toEmail,toName:toName||'',subject,body})
      });
    }).then(function(r){
      if(r.ok){entry.status='sent';}else{entry.status='failed';}
      saveDB();
    }).catch(function(){entry.status='failed';saveDB();});
  }
  return entry;
}

function _previewCSV(input){
  const file = input.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(e){
    const text = e.target.result;
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if(lines.length < 2){ toast('データが2行以上必要です（ヘッダー+データ）','e'); return; }
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g,''));
    const nameIdx = headers.findIndex(h => h.includes('名前') || h.toLowerCase() === 'name');
    if(nameIdx < 0){ toast('「名前」列が見つかりません','e'); return; }
    
    const rows = [];
    for(var i = 1; i < lines.length; i++){
      const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g,''));
      if(!cols[nameIdx]) continue;
      rows.push({
        name: cols[nameIdx],
        age: cols[headers.findIndex(h => h.includes('年齢') || h.toLowerCase() === 'age')] || '',
        pos: cols[headers.findIndex(h => h.includes('ポジション') || h.toLowerCase() === 'position')] || '',
        guardian: cols[headers.findIndex(h => h.includes('保護者'))] || '',
        guardianEmail: cols[headers.findIndex(h => h.includes('メール') || h.includes('email'))] || '',
      });
    }
    
    _csvData = rows;
    const preview = document.getElementById('csv-preview');
    const body = document.getElementById('csv-preview-body');
    if(preview) preview.style.display = 'block';
    if(body){
      body.innerHTML = `<div class="fw7 mb-4">${rows.length}名の選手データ</div>` +
        rows.slice(0,10).map(r => `<div style="padding:6px 0;border-bottom:1px solid var(--b1);display:flex;gap:8px">
          <span class="fw7">${sanitize(r.name,15)}</span>
          <span class="text-muted">${r.age?r.age+'歳':''} ${sanitize(r.pos,10)} ${r.guardian?'保護者:'+sanitize(r.guardian,10):''}</span>
        </div>`).join('') + (rows.length > 10 ? `<div class="text-muted text-sm" style="padding:8px 0">...他${rows.length-10}名</div>` : '');
    }
    document.getElementById('csv-import-btn').disabled = false;
  };
  reader.readAsText(file, 'UTF-8');
}

function downloadCSVTemplate(){
  const csv = '\uFEFF名前,年齢,ポジション,保護者名,保護者メール\n山田太郎,12,FW,山田花子,hanako@example.com\n佐藤次郎,11,MF,,\n';
  const blob = new Blob([csv], {type:'text/csv'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'mycoach_import_template.csv';
  a.click();
  toast('📥 テンプレートをダウンロードしました','s');
}

function notifyByEmail(eventType, targetUser, data){
  if(!targetUser?.email)return;
  const settings=DB.settings||{};
  if(settings.emailEnabled===false)return;

  const templates={
    'match_request':{sub:'マッチング申請が届きました',body:`${data.fromName||'チーム'}からマッチング申請が届いています。\nアプリにログインして確認してください。`},
    'match_accepted':{sub:'マッチングが成立しました',body:`${data.teamName||'チーム'}とのマッチングが成立しました。\nチャットで連絡を取り合いましょう。`},
    'event_request':{sub:'試合・練習の依頼が届きました',body:`${data.fromName||'チーム'}から「${data.purpose||''}」の依頼が届きました。\n日程: ${data.date||'未定'}\nアプリにログインして確認してください。`},
    'event_confirmed':{sub:'試合・練習が承認されました',body:`「${data.purpose||''}」(${data.date||''}) が承認されました。\n詳細はチャットで調整してください。`},
    'coach_request':{sub:'コーチ依頼が届きました',body:`${data.teamName||'チーム'}からコーチ依頼が届きました。\nアプリにログインして確認してください。`},
    'coach_matched':{sub:'コーチマッチングが成立しました',body:`${data.coachName||'コーチ'}とのマッチングが成立しました。`},
    'payment_reminder':{sub:'月謝のお支払い期限のお知らせ',body:`${data.month||''}分の月謝 ¥${(data.amount||0).toLocaleString()} のお支払い期限が近づいています。`},
    'chat_message':{sub:'新しいメッセージが届きました',body:`${data.fromName||''}からメッセージが届きました。\n\n「${(data.text||'').slice(0,100)}」`},
  };
  const tmpl=templates[eventType];
  if(!tmpl)return;
  sendEmailNotif(targetUser.email,targetUser.name,`【MyCOACH-MyTEAM】${tmpl.sub}`,tmpl.body);
}

// ── マルチタブ同期（BroadcastChannel） ──
let _syncChannel=null;
function initMultiTabSync(){
  if(!('BroadcastChannel' in window))return;
  try{
    _syncChannel=new BroadcastChannel('mycoach_sync');
    _syncChannel.onmessage=function(e){
      if(e.data&&typeof e.data==='object'&&typeof e.data.from==='string'&&e.data.from!==_tabId){
        if(e.data.type==='db_update'){
          loadDB();
          _refreshCurrentPage();
        }
        if(e.data.type==='logout'){
          // Other tab logged out -> clear this tab too
          DB.currentUser=null;
          show('landing');
        }
      }
    };
  }catch(ex){}
}
const _tabId='tab_'+Date.now()+'_'+Math.random().toString(36).slice(2,5);
function broadcastDBUpdate(){
  if(_syncChannel){
    try{_syncChannel.postMessage({type:'db_update',from:_tabId,ts:Date.now()});}catch(e){}
  }
}

// saveDBを拡張: 保存時にマルチタブ同期通知
const _origSaveDB=saveDB;
saveDB=function(){
  _origSaveDB();
  broadcastDBUpdate();
};

// 初期化
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',initMultiTabSync);}
else{initMultiTabSync();}

// ── 通知設定UI（設定画面に追加） ──
function notifSettingsHTML(){
  const s=DB.settings||{};
  const pushOk=('Notification' in window)&&Notification.permission==='granted';
  const pushBlocked=('Notification' in window)&&Notification.permission==='denied';
  return `<div class="card" style="margin-bottom:14px">
    <div class="fw7 mb-8" style="font-size:14px">🔔 通知設定</div>
    <div style="display:grid;gap:10px">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--surf2);border-radius:8px">
        <div><div class="text-sm fw7">プッシュ通知</div>
          <div class="text-xs text-muted">${pushOk?'✅ 有効':pushBlocked?'🚫 ブラウザでブロック中':'未設定'}</div></div>
        ${pushOk?`<button class="btn btn-ghost btn-xs" onclick="DB.settings=DB.settings||{};DB.settings.pushEnabled=!DB.settings.pushEnabled;saveDB();goTo(curPage);">${s.pushEnabled!==false?'ON':'OFF'}</button>`
          :pushBlocked?`<span class="text-xs text-muted">ブラウザ設定から許可</span>`
          :`<button class="btn btn-primary btn-xs" onclick="requestPushPermission().then(()=>goTo(curPage))">有効にする</button>`}
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--surf2);border-radius:8px">
        <div><div class="text-sm fw7">メール通知</div>
          <div class="text-xs text-muted">マッチング・試合依頼・チャットの通知</div></div>
        <button class="btn btn-ghost btn-xs" onclick="DB.settings=DB.settings||{};DB.settings.emailEnabled=!(DB.settings.emailEnabled!==false);saveDB();goTo(curPage);">${s.emailEnabled!==false?'ON':'OFF'}</button>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--surf2);border-radius:8px">
        <div><div class="text-sm fw7">チャット通知</div>
          <div class="text-xs text-muted">新着メッセージをプッシュ通知</div></div>
        <button class="btn btn-ghost btn-xs" onclick="DB.settings=DB.settings||{};DB.settings.chatNotif=!s.chatNotif;saveDB();goTo(curPage);">${s.chatNotif?'ON':'OFF'}</button>
      </div>
    </div>
  </div>`;
}
// ── 初回セットアップガイド ──
function _showSetupGuideIfNeeded(){
  const r = DB.currentUser?.role;
  if(!r) return;
  const steps = [];
  
  if(r === 'team'){
    if(!DB.players.filter(p=>p.team===DB.currentUser.id).length)
      steps.push({icon:'👥',label:'選手を招待する',action:"goTo('my-team')",desc:'招待コードを共有して選手を追加'});
    if(DB.stripeSetupNeeded)
      steps.push({icon:'💳',label:'決済設定を完了する',action:"goTo('settings')",desc:'Stripe連携で月謝管理を開始'});
    if(!DB.coaches.filter(c=>c.team===DB.currentUser.id).length)
      steps.push({icon:'🏋️',label:'コーチを探す',action:"goTo('coaches')",desc:'チームに合ったコーチをマッチング'});
  }
  if(r === 'coach'){
    if(DB.stripeSetupNeeded)
      steps.push({icon:'💳',label:'決済設定を完了する',action:"goTo('settings')",desc:'Stripe連携で報酬受取を開始'});
    if(!DB.currentUser.verified)
      steps.push({icon:'✅',label:'プロフィールを充実させる',action:"goTo('profile')",desc:'承認率がアップします'});
  }
  if(r === 'player'){
    const p = DB.players.find(x=>x.id===DB.currentUser.id);
    if(!p?.weight)
      steps.push({icon:'⚖️',label:'体重・身長を登録',action:"goTo('profile')",desc:'栄養管理の目標値を自動計算'});
    const goals = (DB.nutriGoals||{})[DB.currentUser.id];
    if(!goals?.targetKcal)
      steps.push({icon:'🎯',label:'PFC目標を設定',action:"goTo('nutrition')",desc:'食事管理をもっと効果的に'});
  }
  
  if(!steps.length) return;
  
  // ダッシュボード表示後にガイドカードを挿入
  setTimeout(()=>{
    const page = document.getElementById('page-content');
    if(!page) return;
    const existing = document.getElementById('setup-guide');
    if(existing) existing.remove();
    let h = '<div id="setup-guide" style="background:linear-gradient(135deg,rgba(14,165,233,.06),rgba(0,207,170,.06));border:1.5px solid rgba(14,165,233,.2);border-radius:14px;padding:16px;margin-bottom:12px">';
    h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">';
    h += '<div style="font-size:14px;font-weight:700">🚀 スタートガイド</div>';
    h += '<button onclick="document.getElementById(\'setup-guide\').remove()" style="background:none;border:none;color:var(--txt3);cursor:pointer;font-size:16px">&times;</button></div>';
    steps.forEach(s=>{
      h += '<div style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:var(--surf);border:1px solid var(--b1);border-radius:10px;margin-bottom:6px;cursor:pointer" onclick="'+s.action+'">';
      h += '<div style="font-size:22px;flex-shrink:0">'+s.icon+'</div>';
      h += '<div style="flex:1"><div style="font-size:13px;font-weight:700">'+s.label+'</div>';
      h += '<div style="font-size:11px;color:var(--txt3)">'+s.desc+'</div></div>';
      h += '<div style="color:var(--org);font-weight:700">→</div></div>';
    });
    h += '</div>';
    page.insertAdjacentHTML('afterbegin', h);
  }, 500);
}
function addNotif(text, icon, link, targetUserId){
  const uid = targetUserId || DB.currentUser?.id || '';
  // 重複チェック: 同じユーザーの直近5件に同じテキストがあればスキップ
  const myNotifs = DB.notifs.filter(n => n.uid === uid);
  if(myNotifs.slice(0,5).some(n => n.text === text)) return;
  DB.notifs.unshift({id:'n'+Date.now(), text:text, time:'たった今', read:false, icon:icon||'fa-bell', link:link||'', uid:uid});
  saveDB();
  updateNotifBadge();
  // プッシュ通知を送信
  const _s=DB.settings||{};
  if(_s.pushEnabled!==false){
    sendPushNotif('MyCOACH-MyTEAM',text);
  }
}
function _deduplicateNotifs(){
  if(!DB.notifs || !(DB.notifs||[]).length) return;
  const seen = new Set();
  DB.notifs = DB.notifs.filter(n => {
    const key = (n.uid||'') + ':' + n.text;
    if(seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
// 現在のユーザーの通知のみ取得
function _myNotifs(){
  const uid = DB.currentUser?.id || '';
  return (DB.notifs||[]).filter(n => !n.uid || n.uid === uid);
}
function updateNotifBadge(){
  const nd=document.getElementById('notif-dot');
  const nb=document.getElementById('notif-count');
  // 自分の通知のみカウント
  const myN = _myNotifs();
  const unread=myN.filter(n=>!n.read).length;
  if(nd) nd.style.display=unread>0?'block':'none';
  if(nb){nb.textContent=unread>9?'9+':String(unread); nb.style.display=unread>0?'flex':'none';}
  // チャット未読バッジを動的更新（自分に関連するルームのみ）
  const myKey = getMyKey();
  const myId = DB.currentUser?.id;
  const myRole = DB.currentUser?.role;
  let chatUnread = 0;
  Object.entries(DB.chats||{}).forEach(([k,r])=>{
    if(!r.msgs) return;
    // admin以外: 自分に関連するルームのみカウント
    if(myRole!=='admin'){
      if(k==='g1') return;
      if(r.isInquiry && r.userId!==myId) return;
      if(r.type==='match'){
        if(myRole==='team'){const mt=getMyTeam();if(!mt||r.teamId!==mt.id)return;}
        else if(myRole==='coach'){const mc=getMyCoach();if(!mc||r.coachId!==mc.id)return;}
        else return;
      }
      if(r.type==='team_match'){
        if(myRole==='team'){const mt=getMyTeam();if(!mt||(r.teamAId!==mt.id&&r.teamBId!==mt.id))return;}
        else return;
      }
      if(k.startsWith('dm_')&&!k.includes(myId)) return;
      if(!r.type&&!r.isInquiry&&!k.startsWith('dm_')){
        if(!r.msgs.some(m=>m.from===myId||m.from===myKey)) return;
      }
    }
    chatUnread += r.msgs.filter(m=>m.from!==myKey&&!m.read).length;
  });
  // nav-chat のバッジ
  const navChat = document.querySelector('#nav-chat .nav-badge');
  const bnavChat = document.querySelector('#bnav-chat .bnav-badge');
  if(chatUnread > 0){
    const txt = chatUnread > 9 ? '9+' : String(chatUnread);
    if(navChat){ navChat.textContent = txt; navChat.style.display = 'inline'; }
    else {
      const nc = document.getElementById('nav-chat');
      if(nc && !nc.querySelector('.nav-badge')){ const b=document.createElement('span'); b.className='nav-badge'; b.textContent=txt; nc.appendChild(b); }
    }
    if(bnavChat){ bnavChat.textContent = txt; bnavChat.style.display = 'inline'; }
    else {
      const bc = document.getElementById('bnav-chat');
      if(bc && !bc.querySelector('.bnav-badge')){ const b=document.createElement('span'); b.className='bnav-badge'; b.textContent=txt; bc.appendChild(b); }
    }
  } else {
    const nc = document.getElementById('nav-chat');
    const bc = document.getElementById('bnav-chat');
    nc?.querySelector('.nav-badge')?.remove();
    bc?.querySelector('.bnav-badge')?.remove();
  }
}
function showNotifs(){
  const _mn = _myNotifs();
  const unread = _mn.filter(n=>!n.read);
  const items = _mn.length === 0
    ? `<div style="text-align:center;padding:32px 16px">
        <div style="font-size:40px;margin-bottom:12px"><i class="fas fa-bell"></i></div>
        <div style="font-weight:700;margin-bottom:4px">通知はありません</div>
        <div style="font-size:12px;color:var(--txt3)">マッチングや月謝の更新があると<br>ここに通知が届きます</div>
      </div>`
    : _mn.slice(0,20).map(n=>`
      <div style="display:flex;gap:10px;padding:12px;border-radius:10px;margin-bottom:6px;background:${n.read?'transparent':'rgba(249,115,22,.06)'};border:1px solid ${n.read?'transparent':'rgba(249,115,22,.15)'}">
        <div style="width:34px;height:34px;border-radius:10px;background:${n.read?'var(--surf2)':'rgba(249,115,22,.15)'};display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <i class="fa ${n.icon||'fa-bell'}" style="font-size:14px;color:${n.read?'var(--txt3)':'var(--org)'}"></i>
        </div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:${n.read?'400':'700'};color:${n.read?'var(--txt2)':'var(--txt1)'};margin-bottom:2px">${n.text}</div>
          <div style="font-size:11px;color:var(--txt3)">${n.time}</div>
        </div>
        ${n.link?`<button class="btn btn-ghost btn-xs" onclick="closeM();goTo('${n.link}')" style="flex-shrink:0;font-size:11px">確認 →</button>`:''}
      </div>`).join('');
  const header = unread.length > 0
    ? `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <span class="text-sm text-muted">未読 <b style="color:var(--org)">${unread.length}</b> 件</span>
        <button class="btn btn-ghost btn-xs" onclick="{const uid=DB.currentUser?.id||'';DB.notifs.forEach(n=>{if(!n.uid||n.uid===uid)n.read=true;})};saveDB();updateNotifBadge();closeM()">すべて既読</button>
      </div>` : '';
  openM('🔔 通知', header + items + `<div style="display:flex;gap:8px;margin-top:12px"><button class="btn btn-primary w-full btn-sm" onclick="closeM();goTo('notifications')">📋 通知センターを開く</button><button class="btn btn-ghost btn-sm" onclick="closeM()" style="flex-shrink:0">閉じる</button></div>`);
  {const uid=DB.currentUser?.id||'';DB.notifs.forEach(n=>{if(!n.uid||n.uid===uid)n.read=true;});}
  saveDB();
  updateNotifBadge();
}
function toggleFaq(el){el.classList.toggle('open');el.nextElementSibling.classList.toggle('open')}

// ==================== LEGAL ====================
