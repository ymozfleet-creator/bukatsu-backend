// 11-payments.js — Payments
function payMgmt(){
  if(DB.currentUser?.role!=='admin'){toast('このページは事務局のみ利用できます','e');return '<div class="pg-head"><div class="pg-title">アクセス拒否</div></div><div class="card text-center" style="padding:40px"><div style="font-size:40px;margin-bottom:12px">🔒</div></div>';}

  // ── ローカルDB集計 ──
  const allPay=_dbArr('payments');
  const allCoach=_dbArr('coachPay');
  const allAdhoc=_dbArr('adhocInvoices')||[];
  const paidPay=allPay.filter(p=>p.status==='paid');
  const unpaidPay=allPay.filter(p=>p.status!=='paid');
  const paidCoach=allCoach.filter(p=>p.status==='paid');
  const paidAdhoc=allAdhoc.filter(i=>i.status==='paid');

  const totalMonthlyAmt=paidPay.reduce((s,p)=>s+(p.amount||0),0);
  const totalMonthlyFee=paidPay.reduce((s,p)=>s+(p.fee||getFeeAmount(p.amount||0,p.team||p.teamId||'','monthlyFee')),0);
  const totalCoachAmt=paidCoach.reduce((s,p)=>s+(p.amount||0),0);
  const totalCoachFee=paidCoach.reduce((s,p)=>s+(p.platformTotal||getFeeAmount(p.amount||0,p.teamId||'','coachFee')),0);
  const totalCoachPayout=paidCoach.reduce((s,p)=>s+(p.coachReceives||0),0);
  const totalAdhocAmt=paidAdhoc.reduce((s,i)=>s+(i.amount||0),0);
  const totalAdhocFee=paidAdhoc.reduce((s,i)=>s+(i.fee||0),0);
  const totalPlatformFee=totalMonthlyFee+totalCoachFee+totalAdhocFee;
  const totalGross=totalMonthlyAmt+totalCoachAmt+totalAdhocAmt+totalPlatformFee;

  const thisM=curMonth();
  const thisMonthPay=paidPay.filter(p=>(p.month||p.paidAt||'').slice(0,7)===thisM||((p.paidAt||'').replace(/\//g,'-').slice(0,7)===thisM));
  const thisMonthAmt=thisMonthPay.reduce((s,p)=>s+(p.amount||0),0);
  const thisMonthFee=thisMonthPay.reduce((s,p)=>s+(p.fee||getFeeAmount(p.amount||0,p.team||p.teamId||'','monthlyFee')),0);

  // タブ状態
  if(!window._payTab) window._payTab='overview';
  const tab=window._payTab;
  const tabBtn=(k,ico,label)=>`<button class="btn ${tab===k?'btn-primary':'btn-ghost'} btn-sm" onclick="window._payTab='${k}';goTo('payments')" style="font-size:12px">${ico} ${label}</button>`;

  let html=`<div class="pg-head flex justify-between items-center">
    <div><div class="pg-title">💰 決済管理ダッシュボード</div><div class="pg-sub">Stripe決済・手数料・送金を一元管理</div></div>
    <div class="flex gap-8">
      <button class="btn btn-secondary btn-sm" onclick="loadStripeDashboard()" id="stripe-sync-btn">🔄 Stripe同期</button>
      <button class="btn btn-secondary btn-sm" onclick="exportPaymentsCSV()">⬇ CSV</button>
    </div>
  </div>

  <!-- タブナビ -->
  <div class="flex gap-6" style="margin-bottom:16px;flex-wrap:wrap">
    ${tabBtn('overview','📊','概要')}
    ${tabBtn('monthly','💴','月謝 (${allPay.length})')}
    ${tabBtn('coach','🤝','コーチ代 (${allCoach.length})')}
    ${tabBtn('adhoc','🧾','都度請求 (${allAdhoc.length})')}
    ${tabBtn('stripe','💳','Stripe明細')}
    ${tabBtn('transfers','🏦','送金/返金')}
  </div>`;

  // ════════════ タブ: 概要 ════════════
  if(tab==='overview'){
    html+=`
    <!-- KPIサマリ -->
    <div class="stat-row" style="grid-template-columns:repeat(auto-fit,minmax(140px,1fr));margin-bottom:16px">
      <div class="stat-box"><div class="stat-ico" style="color:var(--org)">💰</div><div class="stat-n">¥${totalPlatformFee.toLocaleString()}</div><div class="stat-l">プラットフォーム手数料累計</div></div>
      <div class="stat-box"><div class="stat-ico" style="color:var(--teal)">💵</div><div class="stat-n">¥${totalGross.toLocaleString()}</div><div class="stat-l">総取扱高</div></div>
      <div class="stat-box"><div class="stat-ico" style="color:${unpaidPay.length?'var(--red)':'var(--green)'}">📋</div><div class="stat-n" style="color:${unpaidPay.length?'var(--red)':'var(--green)'}">${unpaidPay.length}件</div><div class="stat-l">未払い月謝</div></div>
      <div class="stat-box"><div class="stat-ico" style="color:var(--blue)">📅</div><div class="stat-n">¥${thisMonthAmt.toLocaleString()}</div><div class="stat-l">今月入金額</div></div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
      <!-- 収益内訳 -->
      <div class="card">
        <div class="fw7 mb-14" style="font-size:14px">📊 収益内訳</div>
        <div style="display:flex;flex-direction:column;gap:10px">
          <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:var(--surf2);border-radius:8px">
            <div><span style="font-size:11px;color:var(--txt3)">月謝</span><div class="fw7">¥${totalMonthlyAmt.toLocaleString()}</div></div>
            <div style="text-align:right"><span style="font-size:10px;color:var(--txt3)">手数料</span><div style="color:var(--org);font-weight:700">+¥${totalMonthlyFee.toLocaleString()}</div></div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:var(--surf2);border-radius:8px">
            <div><span style="font-size:11px;color:var(--txt3)">コーチ代</span><div class="fw7">¥${totalCoachAmt.toLocaleString()}</div></div>
            <div style="text-align:right"><span style="font-size:10px;color:var(--txt3)">手数料</span><div style="color:var(--org);font-weight:700">+¥${totalCoachFee.toLocaleString()}</div></div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:var(--surf2);border-radius:8px">
            <div><span style="font-size:11px;color:var(--txt3)">都度請求</span><div class="fw7">¥${totalAdhocAmt.toLocaleString()}</div></div>
            <div style="text-align:right"><span style="font-size:10px;color:var(--txt3)">手数料</span><div style="color:var(--org);font-weight:700">+¥${totalAdhocFee.toLocaleString()}</div></div>
          </div>
          <div style="border-top:2px solid var(--bdr);padding-top:10px;display:flex;justify-content:space-between">
            <div class="fw7" style="font-size:15px">合計手数料</div>
            <div class="fw7" style="font-size:18px;color:var(--org)">¥${totalPlatformFee.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <!-- Stripe手数料シミュレーション -->
      <div class="card">
        <div class="fw7 mb-14" style="font-size:14px">💳 Stripe手数料概算</div>
        <div id="stripe-fee-section" style="display:flex;flex-direction:column;gap:10px">
          ${_renderStripeFeeEstimate(totalGross, paidPay.length+paidCoach.length+paidAdhoc.length)}
        </div>
      </div>
    </div>

    <!-- 月次推移グラフ -->
    <div class="card" style="margin-bottom:16px">
      <div class="fw7 mb-14" style="font-size:14px">📈 月次収入推移（過去6ヶ月）</div>
      <div style="height:180px"><canvas id="paymgmt-chart"></canvas></div>
    </div>

    <!-- Stripe同期データ -->
    <div class="card" id="stripe-live-data">
      <div class="fw7 mb-14" style="font-size:14px">🔗 Stripe連携ステータス</div>
      <div style="padding:16px;text-align:center;color:var(--txt3);font-size:13px">
        「🔄 Stripe同期」ボタンを押すとFirestoreからStripe決済データを取得します
      </div>
    </div>`;
  }

  // ════════════ タブ: 月謝 ════════════
  else if(tab==='monthly'){
    html+=`<div class="flex gap-8" style="margin-bottom:12px">
      <button class="btn btn-primary btn-sm" onclick="adminAddPayment()">+ 月謝追加</button>
    </div>`;

    if(unpaidPay.length){
      html+=`<div class="card" style="margin-bottom:16px;border:1px solid rgba(239,68,68,.3)">
        <div class="fw7 mb-14" style="font-size:14px;color:var(--red)">⚠️ 未払い月謝（${unpaidPay.length}件 / 合計 ¥${unpaidPay.reduce((s,p)=>s+(p.amount||0),0).toLocaleString()}）</div>
        <div style="overflow-x:auto"><table class="admin-data-table"><thead><tr><th>選手名</th><th>チーム</th><th>月</th><th style="text-align:right">金額</th><th style="text-align:right">手数料</th><th style="text-align:right">請求合計</th><th style="text-align:center">操作</th></tr></thead><tbody>
        ${unpaidPay.map(p=>{const pl=DB.players.find(x=>x.id===p.player);const t=DB.teams.find(x=>x.id===p.team);const fee=p.fee||getFeeAmount(p.amount||0,p.team||'','monthlyFee');
        return`<tr><td>${sanitize(pl?.name||'--',20)}</td><td>${sanitize(t?.name||'--',20)}</td><td>${p.month||'--'}</td><td style="text-align:right">¥${(p.amount||0).toLocaleString()}</td><td style="text-align:right;color:var(--org)">+¥${fee.toLocaleString()}</td><td style="text-align:right;font-weight:700">¥${((p.amount||0)+fee).toLocaleString()}</td><td style="text-align:center"><button class="btn btn-primary btn-xs" onclick="markPaid('${p.id}');goTo('payments')">✓ 入金確認</button> <button class="btn btn-ghost btn-xs" style="color:var(--red)" onclick="adminDeletePayment('${p.id}')">🗑</button></td></tr>`;}).join('')}
        </tbody></table></div></div>`;
    }

    html+=`<div class="card">
      <div class="fw7 mb-14" style="font-size:14px">✅ 入金済み（${paidPay.length}件 / 合計 ¥${totalMonthlyAmt.toLocaleString()}）</div>
      ${paidPay.length?`<div style="overflow-x:auto"><table class="admin-data-table"><thead><tr><th>選手名</th><th>チーム</th><th>月</th><th style="text-align:right">元金額</th><th style="text-align:right">手数料</th><th style="text-align:right">請求合計</th><th>決済方法</th><th>日時</th><th style="text-align:center">操作</th></tr></thead><tbody>
      ${paidPay.slice().reverse().map(p=>{const pl=DB.players.find(x=>x.id===p.player);const t=DB.teams.find(x=>x.id===p.team);const fee=p.fee||getFeeAmount(p.amount||0,p.team||'','monthlyFee');const mLabel={'card':'💳カード','konbini':'🏪コンビニ','bank_transfer':'🏦銀行'}[p.method]||'💳';
      return`<tr><td>${sanitize(pl?.name||'--',20)}</td><td>${sanitize(t?.name||'--',20)}</td><td style="font-size:11px">${p.month||'--'}</td><td style="text-align:right">¥${(p.amount||0).toLocaleString()}</td><td style="text-align:right;color:var(--org)">+¥${fee.toLocaleString()}</td><td style="text-align:right;font-weight:700">¥${((p.amount||0)+fee).toLocaleString()}</td><td style="font-size:11px">${mLabel}</td><td style="font-size:11px;color:var(--txt3)">${(p.paidAt||'').slice(0,10)}</td><td style="text-align:center"><button class="btn btn-ghost btn-xs" onclick="adminTogglePayStatus('${p.id}')">↩未払</button> <button class="btn btn-ghost btn-xs" style="color:var(--red)" onclick="adminDeletePayment('${p.id}')">🗑</button></td></tr>`;}).join('')}
      </tbody></table></div>`:'<div class="text-muted text-sm text-center py-16">入金記録なし</div>'}
    </div>`;
  }

  // ════════════ タブ: コーチ代 ════════════
  else if(tab==='coach'){
    html+=`<div class="flex gap-8" style="margin-bottom:12px">
      <button class="btn btn-primary btn-sm" onclick="adminAddCoachPay()">+ 手動追加</button>
    </div>

    <div class="stat-row" style="grid-template-columns:repeat(3,1fr);margin-bottom:16px">
      <div class="stat-box"><div class="stat-n">¥${totalCoachAmt.toLocaleString()}</div><div class="stat-l">コーチ代総額</div></div>
      <div class="stat-box"><div class="stat-n" style="color:var(--green)">¥${totalCoachPayout.toLocaleString()}</div><div class="stat-l">コーチ受取済</div></div>
      <div class="stat-box"><div class="stat-n" style="color:var(--org)">¥${totalCoachFee.toLocaleString()}</div><div class="stat-l">プラットフォーム手数料</div></div>
    </div>

    <div class="card">
    ${allCoach.length?`<div style="overflow-x:auto"><table class="admin-data-table"><thead><tr><th>コーチ</th><th>チーム</th><th>月</th><th style="text-align:right">総額</th><th style="text-align:right">コーチ受取</th><th style="text-align:right">手数料</th><th style="text-align:center">状態</th><th style="text-align:center">操作</th></tr></thead><tbody>
    ${allCoach.slice().reverse().map(cp=>{const co=DB.coaches.find(x=>x.id===cp.coach);const tm=DB.teams.find(x=>x.id===(cp.team||cp.teamId));
    return`<tr><td>${sanitize(co?.name||cp.coachName||'',15)}</td><td>${sanitize(tm?.name||'',15)}</td><td style="font-size:11px">${cp.month||''}</td><td style="text-align:right">¥${(cp.amount||0).toLocaleString()}</td><td style="text-align:right;color:var(--green)">¥${(cp.coachReceives||0).toLocaleString()}</td><td style="text-align:right;color:var(--org)">¥${(cp.platformTotal||0).toLocaleString()}</td><td style="text-align:center"><span class="badge ${cp.status==='paid'?'b-green':'b-yel'}" style="font-size:10px">${cp.status==='paid'?'済':'未'}</span></td><td style="text-align:center"><button class="btn btn-ghost btn-xs" style="color:var(--red)" onclick="adminDeleteRecord('coachPay','${cp.id}')">🗑</button>${cp.status!=='paid'?`<button class="btn btn-ghost btn-xs" style="color:var(--green)" onclick="adminMarkCoachPaid('${cp.id}')">✅</button>`:`<button class="btn btn-ghost btn-xs" onclick="adminRevertCoachPay('${cp.id}')">↩</button>`}</td></tr>`;}).join('')}
    </tbody></table></div>`:'<div class="text-muted text-sm text-center py-16">コーチ代支払い記録なし</div>'}
    </div>`;
  }

  // ════════════ タブ: 都度請求 ════════════
  else if(tab==='adhoc'){
    const unpaidAdhoc=allAdhoc.filter(i=>i.status!=='paid');
    html+=`
    <div class="stat-row" style="grid-template-columns:repeat(3,1fr);margin-bottom:16px">
      <div class="stat-box"><div class="stat-n">${allAdhoc.length}件</div><div class="stat-l">請求総数</div></div>
      <div class="stat-box"><div class="stat-n" style="color:var(--green)">¥${totalAdhocAmt.toLocaleString()}</div><div class="stat-l">入金済み</div></div>
      <div class="stat-box"><div class="stat-n" style="color:${unpaidAdhoc.length?'var(--red)':'var(--green)'}">${unpaidAdhoc.length}件</div><div class="stat-l">未払い</div></div>
    </div>
    <div class="card">
    ${allAdhoc.length?`<div style="overflow-x:auto"><table class="admin-data-table"><thead><tr><th>件名</th><th>選手</th><th>チーム</th><th style="text-align:right">金額</th><th style="text-align:right">手数料</th><th style="text-align:right">合計</th><th style="text-align:center">状態</th><th style="font-size:11px">日付</th><th style="text-align:center">操作</th></tr></thead><tbody>
    ${allAdhoc.slice().reverse().map(i=>{
    return`<tr><td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${sanitize(i.title||'',25)}</td><td>${sanitize(i.playerName||'',15)}</td><td>${sanitize(i.teamName||'',15)}</td><td style="text-align:right">¥${(i.amount||0).toLocaleString()}</td><td style="text-align:right;color:var(--org)">+¥${(i.fee||0).toLocaleString()}</td><td style="text-align:right;font-weight:700">¥${(i.total||0).toLocaleString()}</td><td style="text-align:center"><span class="badge ${i.status==='paid'?'b-green':'b-org'}" style="font-size:10px">${i.status==='paid'?'済':'未'}</span></td><td style="font-size:11px;color:var(--txt3)">${(i.paidAt||i.createdAt||'').slice(0,10)}</td><td style="text-align:center"><button class="btn btn-ghost btn-xs" style="color:var(--red)" onclick="adminDeleteRecord('adhocInvoices','${i.id}')">🗑</button>${i.status!=='paid'?`<button class="btn btn-ghost btn-xs" onclick="adminMarkPaidAdhoc('${i.id}')">✅</button>`:''}</td></tr>`;}).join('')}
    </tbody></table></div>`:'<div class="text-muted text-sm text-center py-16">都度請求なし</div>'}
    </div>`;
  }

  // ════════════ タブ: Stripe明細 ════════════
  else if(tab==='stripe'){
    html+=`<div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <div class="fw7" style="font-size:14px">💳 Stripe決済記録（Firestore連携）</div>
        <button class="btn btn-primary btn-sm" onclick="loadStripeDashboard()">🔄 データ取得</button>
      </div>
      <div id="stripe-records-table" style="color:var(--txt3);text-align:center;padding:24px;font-size:13px">
        ${window._stripeDashData?_renderStripeRecordsTable(window._stripeDashData):'「🔄 データ取得」を押してStripeの決済記録を表示'}
      </div>
    </div>

    <div class="card mt-16">
      <div class="fw7 mb-14" style="font-size:14px">🔢 Stripe手数料計算ツール</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:12px">
        <div class="form-group"><label class="label">金額（円）</label><input id="calc-amount" class="input" type="number" value="10000" oninput="calcStripeFee()"></div>
        <div class="form-group"><label class="label">決済方法</label><select id="calc-method" class="input" onchange="calcStripeFee()"><option value="card">クレジットカード</option><option value="konbini">コンビニ払い</option><option value="bank_transfer">銀行振込</option></select></div>
        <div class="form-group"><label class="label">手数料率（%）</label><input id="calc-rate" class="input" type="number" value="10" min="5" max="50" oninput="calcStripeFee()"></div>
      </div>
      <div id="calc-result" style="background:var(--surf2);border-radius:10px;padding:14px">
        ${_calcStripeFeeHTML(10000,'card',10)}
      </div>
    </div>`;
  }

  // ════════════ タブ: 送金/返金 ════════════
  else if(tab==='transfers'){
    html+=`<div class="card" style="margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <div class="fw7" style="font-size:14px">🏦 Stripe送金記録（Connect）</div>
        <button class="btn btn-primary btn-sm" onclick="loadStripeDashboard()">🔄 データ取得</button>
      </div>
      <div id="stripe-transfers-table">
        ${window._stripeDashData?_renderTransfersTable(window._stripeDashData.transfers):'「🔄 データ取得」を押してStripeの送金記録を表示'}
      </div>
    </div>
    <div class="card">
      <div class="fw7 mb-14" style="font-size:14px">↩️ 返金記録</div>
      <div id="stripe-refunds-table">
        ${window._stripeDashData?_renderRefundsTable(window._stripeDashData.refunds):'「🔄 データ取得」を押してStripeの返金記録を表示'}
      </div>
    </div>`;
  }

  return html;
}

// ── Stripe手数料概算レンダ ──
function _renderStripeFeeEstimate(totalGross, txCount){
  // 日本市場: カード3.6%、コンビニ¥120/件
  const estStripeFee=Math.round(totalGross*3.6/100);
  const netAfterStripe=totalGross-estStripeFee;
  return`
    <div style="display:flex;justify-content:space-between;padding:8px 12px;background:var(--surf2);border-radius:8px">
      <span style="font-size:12px;color:var(--txt3)">総取扱高</span><b>¥${totalGross.toLocaleString()}</b>
    </div>
    <div style="display:flex;justify-content:space-between;padding:8px 12px;background:var(--surf2);border-radius:8px">
      <span style="font-size:12px;color:var(--txt3)">Stripe手数料概算（3.6%）</span><b style="color:var(--red)">-¥${estStripeFee.toLocaleString()}</b>
    </div>
    <div style="display:flex;justify-content:space-between;padding:8px 12px;background:var(--surf2);border-radius:8px">
      <span style="font-size:12px;color:var(--txt3)">取引件数</span><b>${txCount}件</b>
    </div>
    <div style="border-top:2px solid var(--bdr);padding-top:8px;display:flex;justify-content:space-between">
      <span class="fw7">Stripe手数料控除後</span><span class="fw7" style="color:var(--green)">¥${netAfterStripe.toLocaleString()}</span>
    </div>
    <div style="font-size:10px;color:var(--txt3);margin-top:4px">※ 概算値。実際の手数料はStripe Dashboardで確認してください。<br>カード: 3.6% / コンビニ: ¥120/件 / 銀行振込: ¥0</div>`;
}

// ── Stripe手数料計算ツール ──
function _calcStripeFeeHTML(amount,method,platformRate){
  const platformFee=Math.round(amount*platformRate/100);
  const totalCharged=amount+platformFee;
  const stripeFees={card:{rate:3.6,fixed:0},konbini:{rate:0,fixed:120},bank_transfer:{rate:0,fixed:0}};
  const sf=stripeFees[method]||stripeFees.card;
  const stripeFee=Math.round(totalCharged*sf.rate/100)+sf.fixed;
  const netRevenue=totalCharged-stripeFee;
  const methodLabel={card:'💳 クレジットカード',konbini:'🏪 コンビニ払い',bank_transfer:'🏦 銀行振込'}[method]||method;
  return`
    <div style="font-size:13px;display:grid;gap:6px">
      <div style="display:flex;justify-content:space-between"><span>元金額</span><span>¥${amount.toLocaleString()}</span></div>
      <div style="display:flex;justify-content:space-between;color:var(--org)"><span>プラットフォーム手数料（${platformRate}%）</span><span>+¥${platformFee.toLocaleString()}</span></div>
      <div style="display:flex;justify-content:space-between;font-weight:700;border-top:1px solid var(--bdr);padding-top:6px"><span>保護者請求額</span><span>¥${totalCharged.toLocaleString()}</span></div>
      <div style="display:flex;justify-content:space-between;color:var(--red)"><span>Stripe手数料（${methodLabel}${sf.rate?sf.rate+'%':''}${sf.fixed?'¥'+sf.fixed:''}）</span><span>-¥${stripeFee.toLocaleString()}</span></div>
      <div style="display:flex;justify-content:space-between;font-weight:700;font-size:15px;border-top:2px solid var(--bdr);padding-top:8px;color:var(--green)"><span>実質入金額</span><span>¥${netRevenue.toLocaleString()}</span></div>
      <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--txt3)"><span>うちプラットフォーム手数料</span><span>¥${platformFee.toLocaleString()}</span></div>
      <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--txt3)"><span>うちチーム・コーチ受取分</span><span>¥${(netRevenue-platformFee).toLocaleString()}</span></div>
    </div>`;
}
function calcStripeFee(){
  const a=parseInt(document.getElementById('calc-amount')?.value)||0;
  const m=document.getElementById('calc-method')?.value||'card';
  const r=parseInt(document.getElementById('calc-rate')?.value)||10;
  const el=document.getElementById('calc-result');
  if(el)el.innerHTML=_calcStripeFeeHTML(a,m,r);
}

// ── Stripe決済記録テーブル ──
function _renderStripeRecordsTable(data){
  if(!data||!data.payments||!data.payments.length) return '<div style="color:var(--txt3);text-align:center;padding:16px">Stripe決済記録なし</div>';
  const sfRates=data.stripeFeeRates||{card:{rate:3.6,fixed:0},konbini:{rate:0,fixed:120},bank_transfer:{rate:0,fixed:0}};
  let totalStripe=0,totalPlatform=0,totalCharged=0;
  const rows=data.payments.map(p=>{
    const sf=sfRates[p.method]||sfRates.card;
    const stripeFee=Math.round((p.totalCharged||0)*sf.rate/100)+sf.fixed;
    if(p.status==='paid'){totalStripe+=stripeFee;totalPlatform+=p.platformFee;totalCharged+=p.totalCharged;}
    const typeLabel={monthly_fee:'月謝',coach_fee:'コーチ代',adhoc:'都度'}[p.type]||p.type;
    const methodIco={card:'💳',konbini:'🏪',bank_transfer:'🏦',customer_balance:'🏦'}[p.method]||'💳';
    const statusBadge=p.status==='paid'?'<span class="badge b-green" style="font-size:10px">完了</span>':p.status==='pending'?'<span class="badge b-yel" style="font-size:10px">入金待</span>':'<span class="badge b-red" style="font-size:10px">'+p.status+'</span>';
    return`<tr>
      <td style="font-size:11px;max-width:80px;overflow:hidden;text-overflow:ellipsis">${p.stripeSessionId.slice(0,12)}...</td>
      <td>${typeLabel}</td>
      <td style="text-align:right">¥${(p.amount||0).toLocaleString()}</td>
      <td style="text-align:right;color:var(--org)">¥${(p.platformFee||0).toLocaleString()}</td>
      <td style="text-align:right;font-weight:700">¥${(p.totalCharged||0).toLocaleString()}</td>
      <td style="text-align:right;color:var(--red)">-¥${stripeFee.toLocaleString()}</td>
      <td>${methodIco}</td>
      <td style="text-align:center">${statusBadge}</td>
      <td style="font-size:10px;color:var(--txt3)">${(p.createdAt||'').slice(0,16).replace('T',' ')}</td>
    </tr>`;
  }).join('');

  return`
    <div style="background:var(--surf2);border-radius:10px;padding:12px;margin-bottom:14px;display:grid;grid-template-columns:repeat(4,1fr);gap:10px;font-size:13px">
      <div><span style="color:var(--txt3);font-size:11px">取引件数</span><div class="fw7">${data.payments.length}件</div></div>
      <div><span style="color:var(--txt3);font-size:11px">総取扱高</span><div class="fw7">¥${totalCharged.toLocaleString()}</div></div>
      <div><span style="color:var(--txt3);font-size:11px">Stripe手数料合計</span><div class="fw7" style="color:var(--red)">-¥${totalStripe.toLocaleString()}</div></div>
      <div><span style="color:var(--txt3);font-size:11px">PF手数料合計</span><div class="fw7" style="color:var(--org)">¥${totalPlatform.toLocaleString()}</div></div>
    </div>
    <div style="overflow-x:auto"><table class="admin-data-table"><thead><tr>
      <th>Session ID</th><th>種別</th><th style="text-align:right">元金額</th><th style="text-align:right">PF手数料</th><th style="text-align:right">請求額</th><th style="text-align:right">Stripe手数料</th><th>方法</th><th style="text-align:center">状態</th><th>日時</th>
    </tr></thead><tbody>${rows}</tbody></table></div>
    <div style="font-size:10px;color:var(--txt3);margin-top:8px;text-align:right">取得: ${(data.fetchedAt||'').slice(0,19).replace('T',' ')}</div>`;
}

// ── 送金テーブル ──
function _renderTransfersTable(transfers){
  if(!transfers||!transfers.length) return '<div style="color:var(--txt3);text-align:center;padding:16px">送金記録なし</div>';
  return`<div style="overflow-x:auto"><table class="admin-data-table"><thead><tr><th>Transfer ID</th><th>コーチ</th><th>チーム</th><th>月</th><th style="text-align:right">金額</th><th>Connect口座</th><th style="text-align:center">状態</th><th>日時</th></tr></thead><tbody>
  ${transfers.map(t=>{const co=DB.coaches.find(x=>x.id===t.coachId);const tm=DB.teams.find(x=>x.id===t.teamId);
  return`<tr><td style="font-size:11px">${(t.transferId||'').slice(0,14)}...</td><td>${sanitize(co?.name||'',15)}</td><td>${sanitize(tm?.name||'',15)}</td><td>${t.month||''}</td><td style="text-align:right;font-weight:700">¥${(t.amount||0).toLocaleString()}</td><td style="font-size:10px">${(t.connectedAccountId||'').slice(0,15)}</td><td style="text-align:center"><span class="badge b-green" style="font-size:10px">${t.status||'completed'}</span></td><td style="font-size:10px;color:var(--txt3)">${(t.createdAt||'').slice(0,16).replace('T',' ')}</td></tr>`;}).join('')}
  </tbody></table></div>`;
}

// ── 返金テーブル ──
function _renderRefundsTable(refunds){
  if(!refunds||!refunds.length) return '<div style="color:var(--txt3);text-align:center;padding:16px">返金記録なし</div>';
  return`<div style="overflow-x:auto"><table class="admin-data-table"><thead><tr><th>Refund ID</th><th>対象Session</th><th style="text-align:right">金額</th><th>理由</th><th style="text-align:center">状態</th><th>日時</th></tr></thead><tbody>
  ${refunds.map(r=>{const reasonLabel={'requested_by_customer':'お客様要望','duplicate':'重複','fraudulent':'不正'}[r.reason]||r.reason||'--';
  return`<tr><td style="font-size:11px">${(r.refundId||'').slice(0,14)}...</td><td style="font-size:10px">${(r.sessionId||'').slice(0,14)}...</td><td style="text-align:right;font-weight:700;color:var(--red)">-¥${(r.amount||0).toLocaleString()}</td><td style="font-size:12px">${reasonLabel}</td><td style="text-align:center"><span class="badge ${r.status==='succeeded'?'b-green':'b-yel'}" style="font-size:10px">${r.status||'--'}</span></td><td style="font-size:10px;color:var(--txt3)">${(r.createdAt||'').slice(0,16).replace('T',' ')}</td></tr>`;}).join('')}
  </tbody></table></div>`;
}

// ── Stripe Dashboard API呼出し ──
async function loadStripeDashboard(){
  const btn=document.getElementById('stripe-sync-btn');
  if(btn){btn.disabled=true;btn.innerHTML='⏳ 取得中...';}
  try{
    const res=await fetch(`${API_BASE}/api/admin/stripe-dashboard`,{headers:await _apiHeaders()});
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const data=await res.json();
    window._stripeDashData=data;

    // Stripe明細タブのテーブルを更新
    const el=document.getElementById('stripe-records-table');
    if(el) el.innerHTML=_renderStripeRecordsTable(data);
    const el2=document.getElementById('stripe-transfers-table');
    if(el2) el2.innerHTML=_renderTransfersTable(data.transfers);
    const el3=document.getElementById('stripe-refunds-table');
    if(el3) el3.innerHTML=_renderRefundsTable(data.refunds);

    // 概要タブのライブデータ欄
    const el4=document.getElementById('stripe-live-data');
    if(el4){
      const pc=data.payments||[];
      const paidC=pc.filter(p=>p.status==='paid');
      const pendC=pc.filter(p=>p.status==='pending');
      el4.innerHTML=`<div class="fw7 mb-14" style="font-size:14px">🔗 Stripe連携ステータス</div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:12px">
          <div style="padding:10px;background:var(--surf2);border-radius:8px;text-align:center"><div class="fw7" style="font-size:20px;color:var(--green)">${paidC.length}</div><div style="font-size:11px;color:var(--txt3)">完了</div></div>
          <div style="padding:10px;background:var(--surf2);border-radius:8px;text-align:center"><div class="fw7" style="font-size:20px;color:var(--yel)">${pendC.length}</div><div style="font-size:11px;color:var(--txt3)">入金待ち</div></div>
          <div style="padding:10px;background:var(--surf2);border-radius:8px;text-align:center"><div class="fw7" style="font-size:20px">${(data.transfers||[]).length}</div><div style="font-size:11px;color:var(--txt3)">送金</div></div>
          <div style="padding:10px;background:var(--surf2);border-radius:8px;text-align:center"><div class="fw7" style="font-size:20px;color:var(--red)">${(data.refunds||[]).length}</div><div style="font-size:11px;color:var(--txt3)">返金</div></div>
        </div>
        <div style="font-size:11px;color:var(--txt3);text-align:right">Firestore接続: ${data.firestoreConnected?'✅ 正常':'❌ 未接続'} / サーバー: 成功${data.serverStats?.success||0}件・失敗${data.serverStats?.failed||0}件 / 取得: ${(data.fetchedAt||'').slice(11,19)}</div>`;
    }

    toast(`Stripe: ${(data.payments||[]).length}件の決済、${(data.transfers||[]).length}件の送金、${(data.refunds||[]).length}件の返金を取得`,'s');
  }catch(err){
    toast('Stripeデータの取得に失敗しました','e');
  }finally{
    if(btn){btn.disabled=false;btn.innerHTML='🔄 Stripe同期';}
  }
}


// ── コーチ代支払い管理セクション（payMgmt内の下部に追加表示） ──

function adminDeletePayment(payId){
  if(!confirm('この支払いレコードを削除しますか？'))return;
  DB.payments=_dbArr('payments').filter(function(x){return x.id!==payId;});
  saveDB();toast('削除しました','s');refreshPage();
}

function exportPaymentsCSV(){
  if(DB.currentUser?.role!=='admin'){toast('管理者のみ利用できます','e');return;}
  const rows=[['種別','選手/コーチ名','チーム名','月','元金額','PF手数料','請求合計','決済方法','状態','日付']];
  _dbArr('payments').forEach(p=>{
    const pl=DB.players.find(x=>x.id===p.player);
    const t=DB.teams.find(x=>x.id===p.team);
    const fee=p.fee||getFeeAmount(p.amount||0,p.team||p.teamId||'','monthlyFee');
    rows.push(['月謝',pl?.name||'--',t?.name||'--',p.month||'',p.amount||0,fee,(p.amount||0)+fee,p.method||'--',p.status==='paid'?'入金済':'未払い',p.paidAt||'']);
  });
  _dbArr('coachPay').forEach(cp=>{
    const co=DB.coaches.find(x=>x.id===cp.coach);
    const tm=DB.teams.find(x=>x.id===(cp.team||cp.teamId));
    rows.push(['コーチ代',co?.name||cp.coachName||'--',tm?.name||'--',cp.month||'',cp.amount||0,cp.platformTotal||0,(cp.amount||0)+(cp.platformTotal||0),'--',cp.status==='paid'?'済':'未',cp.paidAt||'']);
  });
  (_dbArr('adhocInvoices')||[]).forEach(i=>{
    rows.push(['都度請求',i.playerName||'--',i.teamName||'--','',i.amount||0,i.fee||0,i.total||0,'--',i.status==='paid'?'済':'未',i.paidAt||i.createdAt||'']);
  });
  const csv=rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n');
  const a=document.createElement('a');
  a.href='data:text/csv;charset=utf-8,\uFEFF'+encodeURIComponent(csv);
  a.download='payments_all_'+curMonth()+'.csv';
  a.click();
  toast('CSVをダウンロードしました（月謝+コーチ代+都度請求）','s');
}

function settingsPage(){
  const isDark=document.documentElement.getAttribute('data-theme')==='dark';
  const user=DB.currentUser||{};
  const isAdmin=user.role==='admin';
  const notifPrefs=DB.settings?.notif||{fee:true,match:true,coach:true,payment:true};
  const feeRate=DB.settings?.feeRate||10;
  const coachRate=DB.settings?.coachRate||10;

  return`<div class="pg-head"><div class="pg-title">設定</div><div class="pg-sub">アカウント・プラットフォーム設定</div></div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">

    <!-- 外観 -->
    <div class="card" style="padding:18px">
      <div class="fw7 mb-14" style="font-size:15px">🎨 外観</div>
      <div class="payment-method-row">
        <div><div class="fw7 text-sm">ダークモード</div><div class="text-xs text-muted">画面の表示スタイル</div></div>
        <label class="toggle-switch">
          <input type="checkbox" ${isDark?'checked':''} onchange="toggleTheme(this.checked)">
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div class="payment-method-row" style="margin-top:10px">
        <div><div class="fw7 text-sm">アクセントカラー</div></div>
        <div class="flex gap-6">
          ${['#ff6b2b','#00cfaa','#3b82f6','#a855f7','#f59e0b'].map(c=>`<div onclick="setAccentColor('${c}')" style="width:22px;height:22px;border-radius:50%;background:${c};cursor:pointer;border:2px solid ${(DB.settings?.accent||'#ff6b2b')===c?'#fff':'transparent'};transition:border .2s"></div>`).join('')}
        </div>
      </div>
      <div class="payment-method-row" style="margin-top:10px">
        <div><div class="fw7 text-sm">アプリツアー</div><div class="text-xs text-muted">機能の使い方を確認</div></div>
        <button class="btn btn-secondary btn-xs" onclick="startAppTour()">🎓 ツアー開始</button>
      </div>
      <div class="payment-method-row" style="margin-top:10px">
        <div><div class="fw7 text-sm">ブックマーク</div><div class="text-xs text-muted">お気に入りの管理</div></div>
        <button class="btn btn-ghost btn-xs" onclick="goTo('bookmarks')">⭐ 表示</button>
      </div>
      <div class="payment-method-row" style="margin-top:10px">
        <div><div class="fw7 text-sm">🌐 言語 / Language</div><div class="text-xs text-muted">表示言語を切り替え</div></div>
        ${langToggleHTML()}
      </div>
      ${calendarSyncStatus()}
    </div>

    <!-- 通知設定 -->
    <div class="card" style="padding:18px">
      <div class="fw7 mb-14" style="font-size:15px">🔔 通知設定</div>
      <div class="payment-method-row" style="margin-bottom:10px">
        <div><span class="text-sm fw7">プッシュ通知</span>
          <div class="text-xs text-muted">${('Notification' in window)&&Notification.permission==='granted'?'✅ 有効':Notification.permission==='denied'?'🚫 ブロック中':'未設定'}</div></div>
        ${('Notification' in window)&&Notification.permission!=='granted'&&Notification.permission!=='denied'
          ?`<button class="btn btn-primary btn-xs" onclick="requestPushPermission().then(()=>goTo('settings'))">有効にする</button>`
          :`<label class="toggle-switch"><input type="checkbox" ${(DB.settings||{}).pushEnabled!==false&&Notification.permission==='granted'?'checked':''} onchange="DB.settings=DB.settings||{};DB.settings.pushEnabled=this.checked;saveDB()"><span class="toggle-slider"></span></label>`}
      </div>
      <div class="payment-method-row" style="margin-bottom:10px">
        <div><span class="text-sm fw7">メール通知</span>
          <div class="text-xs text-muted">マッチング・試合・チャット通知</div></div>
        <label class="toggle-switch">
          <input type="checkbox" ${(DB.settings||{}).emailEnabled!==false?'checked':''} onchange="DB.settings=DB.settings||{};DB.settings.emailEnabled=this.checked;saveDB()">
          <span class="toggle-slider"></span>
        </label>
      </div>
      ${[
        {key:'fee',l:'月謝リマインド'},
        {key:'match',l:'マッチング通知'},
        {key:'coach',l:'コーチ承認通知'},
        {key:'payment',l:'決済完了通知'},
      ].map(s=>`<div class="payment-method-row" style="margin-bottom:10px">
        <span class="text-sm">${s.l}</span>
        <label class="toggle-switch">
          <input type="checkbox" ${notifPrefs[s.key]!==false?'checked':''} onchange="saveNotifPref('${s.key}',this.checked)">
          <span class="toggle-slider"></span>
        </label>
      </div>`).join('')}
      ${isAdmin?`<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--b1)">
        <div class="text-xs fw7 text-muted mb-4">メール送信ログ（最新5件）</div>
        ${(DB.emailLog||[]).slice(-5).reverse().map(e=>`<div class="text-xs text-muted" style="padding:3px 0">${e.sentAt?.slice(5,16)||''} → ${sanitize(e.toName||e.to,15)} : ${sanitize(e.subject,30)}</div>`).join('')||'<div class="text-xs text-muted">ログなし</div>'}
      </div>`:''}
    </div>

    <!-- 手数料設定（管理者のみ） -->
    ${isAdmin?`<div class="card" style="padding:18px">
      <div class="fw7 mb-14" style="font-size:15px">💴 手数料設定</div>
      ${[{l:'月謝手数料率',k:'feeRate',v:feeRate},{l:'コーチ代手数料率',k:'coachRate',v:coachRate}].map(s=>`<div class="payment-method-row mb-10">
        <div class="fw7 text-sm">${s.l}</div>
        <div class="flex items-center gap-8">
          <input class="input" type="number" id="set-${s.k}" value="${s.v}" min="0" max="100" style="width:60px;text-align:center;padding:6px">
          <span class="text-muted text-sm">%</span>
          <button class="btn btn-primary btn-xs" onclick="saveRateSetting('${s.k}')">保存</button>
        </div>
      </div>`).join('')}
    </div>`:''}

    <!-- ユーザー管理（管理者のみ） -->
    ${isAdmin?`<div class="card" style="padding:18px">
      <div class="flex justify-between items-center mb-14">
        <div class="fw7" style="font-size:15px">👥 登録ユーザー管理</div>
        <button class="btn btn-secondary btn-xs" onclick="exportAllUsersCSV()">⬇ CSV</button>
      </div>
      ${(()=>{
        const users=_getUsers();
        if(!users.length) return '<div class="text-muted text-sm text-center py-12">ユーザー未登録</div>';
        return users.map(u=>{
          const roleLabel={admin:'事務局',team:'チーム',coach:'コーチ',player:'選手',parent:'保護者'}[u.role]||u.role;
          const roleColor={admin:'var(--red)',team:'var(--blue)',coach:'var(--org)',player:'var(--teal)',parent:'#8b5cf6'}[u.role]||'var(--txt3)';
          return`<div class="payment-method-row">
            <div class="flex items-center gap-8">
              <div class="avi" style="background:${roleColor};width:30px;height:30px;font-size:12px">${(u.name||'?')[0]}</div>
              <div>
                <div class="fw7 text-sm">${sanitize(u.name||'--',20)}</div>
                <div class="text-xs text-muted">${sanitize(u.email||'',28)}</div>
              </div>
            </div>
            <div class="flex items-center gap-6">
              <span class="badge" style="background:${roleColor}20;color:${roleColor};border:1px solid ${roleColor}30;font-size:10px">${roleLabel}</span>
              ${u.role!=='admin'?`<button class="btn btn-ghost btn-xs" style="color:var(--red)" onclick="if(confirm('${sanitize(u.name||'',15)}を削除しますか？')){_deleteUser('${u.id}');goTo('settings')}">削除</button>`:''}
            </div>
          </div>`;
        }).join('');
      })()}
    </div>`:''}

    <!-- 決済設定 -->
    <div class="card" style="padding:18px">
      <div class="fw7 mb-14" style="font-size:15px">⚡ 決済設定</div>
      <div class="flex items-center gap-10 mb-12">
        <span style="font-size:20px">⚡</span>
        <div class="fw7">Stripe</div>
        <span class="badge b-green" style="margin-left:auto">連携済み</span>
      </div>
      <div class="text-xs text-muted mb-12">秘密鍵: バックエンド .env に設定済み</div>
      <button class="btn btn-secondary btn-xs">🔄 キーを更新</button>
    </div>

    <!-- Claude AI設定 -->
    <div class="card" style="padding:18px">
      <div class="fw7 mb-14" style="font-size:15px">🤖 Claude AI設定</div>
      <div class="form-group mb-10">
        <label class="label">APIキー</label>
        <div class="flex gap-6">
          <div style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.25);border-radius:8px;flex:1">
            <i class="fa fa-shield-alt" style="color:var(--grn)"></i>
            <span style="font-size:12px;color:var(--grn)">サーバー側で安全に管理中 ✓</span>
          </div>
        </div>
        <div class="text-xs text-muted mt-4">本番環境ではサーバーサイドで管理してください</div>
      </div>
      <div class="payment-method-row">
        <div><div class="text-sm fw7">AI機能</div></div>
        <label class="toggle-switch">
          <input type="checkbox" ${DB.settings?.aiEnabled!==false?'checked':''} onchange="saveToggleSetting('aiEnabled',this.checked)">
          <span class="toggle-slider"></span>
        </label>
      </div>
    </div>

    <!-- セキュリティ -->
    <div class="card" style="padding:18px">
      <div class="fw7 mb-14" style="font-size:15px">🔑 セキュリティ</div>
      <button class="btn btn-secondary btn-sm w-full mb-8" onclick="openChangePasswordModal()">🔑 パスワードを変更</button>
      <button class="btn btn-secondary btn-sm w-full mb-8" onclick="exportData()">📥 データをエクスポート (JSON)</button>
      ${isAdmin?`<button class="btn btn-secondary btn-sm w-full mb-8" onclick="exportUsersCSV()">📊 ユーザーリスト (CSV)</button>`:''}
      <button class="btn btn-ghost btn-sm w-full" style="color:var(--red);border-color:var(--red)" onclick="confirmDeleteAccount()">🗑️ アカウントを削除</button>
    </div>

    <!-- 通知・連携 -->
    ${(user.role==='admin'||user.role==='team')?`
    <div class="card mb-16">
      <div class="fw7 mb-14" style="font-size:15px">🔔 通知・連携</div>
      <div style="display:grid;gap:10px">
        <button class="btn btn-secondary btn-sm w-full" onclick="openPushNotifSettings()" style="display:flex;align-items:center;gap:8px;justify-content:flex-start">
          <span style="font-size:16px"><i class="fas fa-bell"></i></span> プッシュ通知設定
        </button>
        <button class="btn btn-secondary btn-sm w-full" onclick="openWebhookSettings()" style="display:flex;align-items:center;gap:8px;justify-content:flex-start">
          <span style="font-size:16px">🔗</span> Webhook連携（Slack/Discord/Zapier等）
        </button>
        <button class="btn btn-secondary btn-sm w-full" onclick="openCSVImportModal()" style="display:flex;align-items:center;gap:8px;justify-content:flex-start">
          <span style="font-size:16px">📥</span> CSV一括インポート（選手リスト）
        </button>
        <button class="btn btn-ghost btn-xs" onclick="downloadCSVTemplate()" style="font-size:11px;color:var(--txt3)">CSVテンプレートをダウンロード</button>
        <button class="btn btn-secondary btn-sm w-full" onclick="openContractTemplate()" style="display:flex;align-items:center;gap:8px;justify-content:flex-start">
          <span style="font-size:16px"><i class="fas fa-file-contract"></i></span> 業務委託契約書の雛形
        </button>
      </div>
    </div>`:``}
    <div class="card" style="padding:18px">
      <div class="fw7 mb-14" style="font-size:15px">🛡️ プライバシー・データ管理</div>
      <div style="font-size:11px;color:var(--txt3);line-height:1.6;margin-bottom:14px">
        お客様のデータに関する権利を保障します。個人データのエクスポート・削除が可能です。
      </div>
      <div style="display:grid;gap:8px">
        <button class="btn btn-secondary btn-sm w-full" onclick="exportMyData()">
          <i class="fa fa-download" style="margin-right:6px"></i>個人データをダウンロード (JSON)
        </button>
        <button class="btn btn-ghost btn-sm w-full" onclick="showMyConsentLog()">
          <i class="fa fa-history" style="margin-right:6px"></i>同意・データ処理履歴
        </button>
        ${isAdmin?`
        <div style="border-top:1px solid var(--b1);margin-top:8px;padding-top:12px">
          <div class="fw7 text-sm mb-8" style="color:var(--red)">管理者用</div>
          <button class="btn btn-ghost btn-sm w-full mb-6" style="color:var(--red);border-color:rgba(239,68,68,.3)" onclick="openAdminGDPRPanel()">
            <i class="fa fa-user-slash" style="margin-right:6px"></i>ユーザーデータ完全削除 (GDPR)
          </button>
          <button class="btn btn-ghost btn-sm w-full" onclick="showConsentLogAdmin()">
            <i class="fa fa-clipboard-list" style="margin-right:6px"></i>全ユーザー同意ログ
          </button>
          <div style="border-top:1px solid var(--b1);margin-top:8px;padding-top:12px">
            <div class="fw7 text-sm mb-8">📦 バックアップ・復元</div>
            <button class="btn btn-secondary btn-sm w-full mb-6" onclick="adminFullBackup()">
              <i class="fa fa-download" style="margin-right:6px"></i>フルバックアップ
            </button>
            <button class="btn btn-ghost btn-sm w-full" onclick="adminRestoreBackup()">
              <i class="fa fa-upload" style="margin-right:6px"></i>バックアップから復元
            </button>
          </div>
        </div>
        `:''}
      </div>
    </div>

    <!-- PWAインストール -->
    <div class="card" style="padding:18px">
      <div class="fw7 mb-14" style="font-size:15px">📱 アプリ</div>
      <div style="font-size:11px;color:var(--txt3);line-height:1.6;margin-bottom:12px">
        ホーム画面に追加すると、ネイティブアプリのように使えます
      </div>
      <button id="pwa-install-btn" class="btn btn-secondary btn-sm w-full mb-8" onclick="installPWA()" style="display:${typeof _deferredInstallPrompt!=='undefined'&&_deferredInstallPrompt?'inline-flex':'none'}">
        <i class="fa fa-download" style="margin-right:6px"></i>ホーム画面に追加
      </button>
      <div style="display:flex;gap:8px;align-items:center;font-size:11px">
        <span style="width:8px;height:8px;border-radius:50%;background:${navigator.onLine?'var(--grn)':'var(--red)'};flex-shrink:0"></span>
        <span class="text-muted">${navigator.onLine?'オンライン':'オフライン'} · SW ${navigator.serviceWorker?.controller?'有効':'未登録'}</span>
      </div>
    </div>

    <!-- 法的 -->
    <div class="card" style="padding:18px">
      <div class="fw7 mb-14" style="font-size:15px">📄 法的情報</div>
      <div style="display:grid;gap:8px">
        <button class="btn btn-ghost btn-sm w-full" onclick="openM('📄 利用規約',legalText('terms'))">📄 利用規約</button>
        <button class="btn btn-ghost btn-sm w-full" onclick="openM('🛡️ プライバシーポリシー',legalText('privacy'))">🛡️ プライバシーポリシー</button>
        <div class="text-xs text-muted text-center mt-8">部勝 v3.4.0 (Build 20260306)</div>
      </div>
    </div>

    ${demoModeWidget()}

    ${isAdmin?adminAdvancedSettings():''}

    <!-- ヘルプ・サポート -->
    <div class="card" style="padding:18px">
      <div class="fw7 mb-14" style="font-size:15px">❓ サポート</div>
      <div style="display:grid;gap:8px">
        <button class="btn btn-primary btn-sm w-full" onclick="openHelpCenter()">❓ ヘルプセンター・FAQ</button>
        <button class="btn btn-secondary btn-sm w-full" onclick="startTutorial()">📖 使い方ガイド（チュートリアル）</button>
        <button class="btn btn-ghost btn-sm w-full" onclick="openPushNotifSettings()">🔔 プッシュ通知設定</button>
      </div>
    </div>

  </div>`;
}

function toggleTheme(isDark){
  document.documentElement.setAttribute('data-theme',isDark?'dark':'light');
  if(!DB.settings)DB.settings={};
  DB.settings.theme=isDark?'dark':'light';
  // body背景を即時適用
  if(isDark){
    document.body.style.background='var(--bg)';
  } else {
    document.body.style.background='linear-gradient(160deg,#eef5ff 0%,#f0f6ff 60%,#f5f9ff 100%)';
  }
  saveDB();
  toast(`${isDark?'🌙 ダーク':'☀️ ライト'}モードに切り替えました`,'s');
  setTimeout(()=>goTo(curPage), 300);
}
function setAccentColor(color){
  document.documentElement.style.setProperty('--org',color);
  if(!DB.settings)DB.settings={};
  DB.settings.accent=color;
  saveDB();goTo('settings');
}
function saveNotifPref(key,val){
  if(!DB.settings)DB.settings={};
  if(!DB.settings.notif)DB.settings.notif={};
  DB.settings.notif[key]=val;
  saveDB();toast('通知設定を保存しました','s');
}
function saveRateSetting(key){
  const val=parseInt(document.getElementById(`set-${key}`)?.value||'10');
  if(!DB.settings)DB.settings={};
  const oldVal=DB.settings[key]||10;
  DB.settings[key]=Math.min(100,Math.max(0,val));
  addAuditLog('settings_change','手数料率変更: '+key+' '+oldVal+'% → '+val+'%',{key,oldVal,newVal:val});
  saveDB();toast('手数料率を保存しました','s');
}
function saveApiKey(){
  // セキュリティ: APIキーはバックエンドサーバーの環境変数でのみ管理
  toast('APIキーはサーバー側で安全に管理されています。設定変更はサーバー管理者にお問い合わせください。','i');
}
function saveToggleSetting(key,val){
  if(!DB.settings)DB.settings={};
  DB.settings[key]=val;
  saveDB();toast('設定を保存しました','s');
}
function confirmDeleteAccount(){
  openM('⚠️ アカウント削除',`<div style="text-align:center;padding:16px">
    <div style="font-size:48px;margin-bottom:12px">⚠️</div>
    <div class="fw7 mb-8" style="color:var(--red)">本当に削除しますか？</div>
    <div class="text-sm text-muted mb-12" style="line-height:1.7">この操作は取り消せません。<br>Firebase認証・Firestoreの全データが完全に削除されます。</div>
    <div style="text-align:left;padding:12px;background:var(--surf2);border-radius:10px;margin-bottom:16px;font-size:12px;color:var(--txt3);line-height:1.6">
      <b>削除されるデータ:</b><br>
      ・アカウント情報・プロフィール<br>
      ・トレーニング・食事・コンディション記録<br>
      ・チャット履歴・通知<br>
      ・月謝・決済関連データ
    </div>
    <input id="del-confirm" class="input mb-12" placeholder="「削除する」と入力してください">
    <div class="flex gap-10">
      <button class="btn btn-ghost flex-1" onclick="closeM()">キャンセル</button>
      <button id="del-exec-btn" class="btn btn-primary flex-1" style="background:var(--red)" onclick="_doDeleteAccountFull()">🗑️ 削除する</button>
    </div>
  </div>`);
}
function pinChangeForm(){
  return`<div style="display:grid;gap:10px">
    <div class="form-group"><label class="label">現在のパスワード</label><input type="password" id="pin-old" class="input" placeholder="現在のパスワード"></div>
    <div class="form-group"><label class="label">新しいパスワード</label><input type="password" id="pin-new" class="input" placeholder="8文字以上"></div>
    <div class="form-group"><label class="label">確認</label><input type="password" id="pin-confirm" class="input" placeholder="もう一度入力"></div>
    <button class="btn btn-primary w-full" onclick="_changePIN()">🔑 変更する</button>
  </div>`;
}
function _changePIN(){
  const o=document.getElementById('pin-old')?.value||'';
  const n=document.getElementById('pin-new')?.value||'';
  const c=document.getElementById('pin-confirm')?.value||'';
  if(n!==c){toast('新しいパスワードが一致しません','e');return;}
  if(n.length<8){toast('パスワードは8文字以上にしてください','e');return;}
  // 旧パスワードを確認
  const users=_getUsers();
  const me=users.find(u=>u.id===DB.currentUser?.id);
  if(!me){toast('ユーザー情報が見つかりません','e');return;}
  const email=me.email||DB.currentUser?.email||'';
  _verifyPassword(o, email, me.pwHash).then(ok=>{
    if(me.pwHash && !ok){
      toast('現在のパスワードが間違っています','e');return;
    }
    _hashPassword(n, email).then(newHash=>{
      me.pwHash=newHash;
      _saveUsers(users);
      closeM();
      toast('パスワードを変更しました','s');
    });
  });
}

function saveSettings(){
  if(DB.currentUser?.role!=='admin'){toast('設定変更は事務局のみ実行できます','e');return;}
  // 手数料設定を保存（将来的にDB連携）
  toast('設定を保存しました','s');
  saveDB();
}


function _deleteUser(userId){
  if(DB.currentUser?.role!=='admin'){toast('権限がありません','e');return;}
  if(!userId){toast('ユーザーIDが無効です','e');return;}
  const users=_getUsers();
  const targetUser=users.find(u=>u.id===userId);
  if(!targetUser){toast('ユーザーが見つかりません','e');return;}
  const filtered=users.filter(u=>u.id!==userId);
  _saveUsers(filtered);
  // DB内の関連データも削除
  DB.coaches=DB.coaches.filter(c=>c.id!==userId);
  DB.teams=DB.teams.filter(t=>t.id!==userId);
  const _dp=DB.players.find(p=>p.id===userId);
  if(_dp&&_dp.team){const _dt=DB.teams.find(t=>t.id===_dp.team);if(_dt&&_dt.members>0)_dt.members--;}
  DB.players=DB.players.filter(p=>p.id!==userId);
  saveDB();
  toast(sanitize(targetUser.name||'ユーザー',20)+'を削除しました','s');
}

