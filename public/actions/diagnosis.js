// W1 action domain: diagnosis. Only this file may be edited by its owner.
// Branches are kept verbatim; dispatch preserves their original order.

// P-13 / P-12 support. These helpers only READ service data and FORMAT it for
// display; they never invent a number. GET /api/demo-data (through the shared
// session adapter) is the single source: the server sends coverage /
// annual_premium as either numbers or pg NUMERIC strings ("4000000").
const INSURANCE_TYPE = '保险';
// pg NUMERIC strings are shown as text, never coerced through Number(): that
// would drop precision or silently turn "12.5" into money rounded in the browser.
const factValueText = (value) => {
  if (value == null) return '';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';
  return String(value).trim();
};
const factMoneyText = (value) => {
  const raw = factValueText(value);
  if (!raw) return null;
  return /^-?\d+(\.\d+)?$/.test(raw) ? `¥${raw}` : raw;
};
const saleStatusText = (status) => {
  const raw = factValueText(status);
  if (!raw) return null;
  const labels = {ON_SALE: '在售', OFF_SALE: '停售', SUSPENDED: '暂停销售', SOLD_OUT: '额度售罄'};
  return labels[raw] ? `${labels[raw]} · ${raw}` : raw;
};
// The clicked element's data-product is the only acceptable target. Falling back
// to any other product would show facts for something the user did not click.
const insuranceTargetOf = (el, productId) => {
  const id = factValueText(productId || el?.dataset?.product);
  if (!id) return {reason: 'missing_product_id'};
  const product = productOf(id);
  if (!product) return {id, reason: 'unknown_product'};
  if (product.type !== INSURANCE_TYPE) return {id, product, reason: 'not_insurance'};
  return {id, product};
};
// A diagnosis failure is NOT rendered here. runRealAiTask (app.js,
// frontend-lead) catches every failure itself and shows the generic 'ai-error'
// landing, so an action-layer error renderer could never run; none is left as
// dead code. The failure states this branch does own — the click carries no
// product id, or a non-insurance/missing id — are rendered explicitly instead.

window.WealthActions.registerDomain(["add-compare","m-coverage","m-deposit-compare","m-diagnose","m-holding","m-policy","m-product-detail","m-review","m-review-detail","m-wealth-detail","new-screen","product-deposit","product-fund","product-insurance","product-wealth","save-diagnosis","switch-role"], function actionsDiagnosis(action, el, productId, e){
  if(action==='switch-role'){
    const next=session().role==='产品专家'?'投顾 / 财富管理':'产品专家';
    patch({role:next});
    rerender();
    return;
  }
  if(action==='new-screen'||action==='add-compare'){
    const ids=realProductIds(session().compareSet?.length?session().compareSet:candidateIds());
    if(ids.length<2||ids.length>3){ openLanding('compare-needed'); return; }
    void (async()=>{
      try{
        await window.WealthApi.patch({compareSet:ids});
        go('pc/compare');
      }catch(error){ showActionError(error); }
    })();
    return;
  }
  if(action==='product-wealth'){go('pc/product-wealth');return;}
  if(action==='product-fund'){go('pc/product-fund');return;}
  if(action==='product-deposit'){go('pc/product-deposit');return;}
  if(action==='product-insurance'){go('pc/product-insurance');return;}

  if(action==='m-holding'){go('m/holdings');return;}
  if(action==='m-review'){patch({reviewReady:true});go('m/companion');return;}
  if(action==='m-review-detail'){
    patch({reviewReady:true});
    openLanding('m-review-detail');
    return;
  }
  if(action==='m-diagnose'){
    // P-12: the diagnostic runs for the product the user actually clicked. It is
    // never silently redirected to another product: no id or an id the service
    // snapshot does not know stays an explicit empty state.
    const id=factValueText(productId||el?.dataset?.product);
    const p=id?productOf(id):null;
    if(!id||!p){
      genericModal('基金深度诊断',`<div class="callout warn"><b>无法生成诊断</b><p>${id?`服务端产品快照中没有 ${esc(id)}，可能未授权或已下架。`:'本次点击没有携带产品标识。'}</p></div><p class="muted">本页不会改用其它产品代替诊断。</p>`,btn('知道了','close-dialog','primary'));
      return;
    }
    const run=runRealAiTask('diagnosis_explain',{question:`请基于${p.name||id}的真实产品事实和授权持仓给出诊断解释。`},(result)=>{
      const diagnosis={name:p.name||id,asOf:session().asOf||'2026-09-28',drawdown:p.drawdown||'—',rank:'以本次证据为准',exposure:'以本次证据为准',text:result.text,sources:result.citations||[],evidence:result.evidence,executionMode:result.execution_mode||'real',model:result.model,latency_ms:result.latency_ms};
      window.__pendingDiagnosis=diagnosis;
      patch({diagnosis,aiRequests:[...(session().aiRequests||[]),result.request_id]});
      genericModal('基金深度诊断',`<div class="insight-header"><h2>${esc(diagnosis.name)}</h2><p class="muted">${diagnosis.executionMode==="fixture"?"演示桩 fixture 诊断":"AI 生成诊断"} · 数据截至 ${esc(diagnosis.asOf)}</p></div><p>${esc(diagnosis.text)}</p><div class="callout warn">风险提示：产品事实和风险字段来自本次证据包，解释不构成投资建议。</div><p class="muted">引用：${esc(diagnosis.sources.join('、')||'暂无')}。模型：${esc(diagnosis.model||'未知')} · ${esc(String(diagnosis.latency_ms||0))} ms。</p>`,btn('保存诊断','save-diagnosis','primary'));
      return false;
    },'m-diagnose',{product_ids:[id]});
    // runRealAiTask catches its own failures (see the note above the helpers), so
    // this handler never fires today. It only keeps a future rejection from
    // becoming an unhandled promise rejection; it shows no success state.
    if(run?.catch) run.catch(()=>{
      openLanding('action-error');
    });
    return;
  }
  if(action==='save-diagnosis'){
    patch({diagnosis:window.__pendingDiagnosis||{name:'易方达中证A500联接A', asOf:session().asOf||'2026-09-28', drawdown:'-9.80%'}});
    closeDialog();
    go('m/fund');
    return;
  }
  if(action==='m-product-detail'||action==='m-wealth-detail'){
    const id=productId||window.__pendingProduct||'wealth';
    window.__pendingProduct=id;
    const p=productOf(id)||sessionApi()?.PRODUCTS?.wealth||{};
    genericModal('产品详情',`<h2>${esc(p.name||'产品详情')}</h2><p class="muted">${esc(p.detail||'')}</p><div class="callout">组合作用：${esc(p.role||'稳健底仓')}。流动性：${esc(p.liquidity||'以产品规则为准')}。</div><h3>办理前确认</h3><ul><li>持有期、赎回规则以产品说明书为准</li><li>业绩比较基准不代表预期收益</li><li>可售状态与额度以业务系统为准</li></ul><p class="muted">不构成投资建议，不替代适当性结论。</p>`,btn('加入比较','m-compare-add','primary',id));
    return;
  }
  if(action==='m-coverage'||action==='m-policy'){
    // P-13: the dialog describes the insurance product the user clicked. It reads
    // the product facts that GET /api/demo-data already handed to the shared
    // session and prints only the fields the service actually returned. The old
    // fixed 「安享长期医疗 ¥4,000,000」 dialog is gone: no target id, unknown id
    // or a non-insurance product all render the explicit empty state, never a
    // default policy and never an invented amount.
    const footer=btn('返回保障检视','close-dialog','primary');
    if(!sessionApi()?.product){
      genericModal('保障详情',`<div class="callout warn"><b>未授权或暂无可展示保单</b><p>共享应用服务未连接，无法读取 GET /api/demo-data 的保险产品事实。</p></div>`,footer);
      return;
    }
    const target=insuranceTargetOf(el,productId);
    if(target.reason){
      const detail={
        missing_product_id:'本次点击没有携带保险产品标识。',
        unknown_product:'未在当前服务端产品快照中找到该产品，可能未授权或已下架。',
        not_insurance:'所点击的对象不是保险产品，本页不展示任何保障事实。'
      }[target.reason];
      genericModal('保障详情',`<div class="callout warn"><b>未授权或暂无可展示保单</b><p>${esc(detail)}</p></div><p class="muted">本页不套用默认保障额度或保费，也不展示固定的演示保单。</p>`,footer);
      return;
    }
    const p=target.product;
    const rows=[
      ['保障额度',factMoneyText(p.coverage)],
      ['年度保费',factMoneyText(p.annual_premium)],
      ['可售状态',saleStatusText(p.sale_status)],
      ['数据来源',factValueText(p.source_id)||null],
      ['数据时点',typeof formatTime==='function'?formatTime(p.source_timestamp):(factValueText(p.source_timestamp)||null)]
    ].filter(r=>r[1]!=null&&r[1]!=='');
    // Every field is optional in the projection: if the product fact carries
    // none of them, say so instead of showing an empty table as if it were data.
    const body=rows.length
      ? rows.map(r=>`<div class="stat-row"><span>${esc(r[0])}</span><b>${esc(r[1])}</b></div>`).join('')
      : '<p class="muted">服务端未返回该保险产品的保障额度、保费或可售状态。</p>';
    genericModal('保障详情',`<h2>${esc(factValueText(p.name)||target.id)}</h2><p class="muted">保险产品事实 · 产品 ID ${esc(target.id)} · 来自 GET /api/demo-data</p>${body}<div class="callout warn">请重点确认：既往症除外责任、续保条件和免赔额。以上是保险产品事实，不是保单记录；本系统不替代健康告知、核保和理赔审核。</div>`,footer);
    return;
  }
  if(action==='m-deposit-compare'){
    const principal=Number($('#depositAmount')?.value||0);
    const years=Number($('#depositTerm')?.value||3);
    const rates={1:.0155,3:.0215,5:.0235};
    if(!(principal>0)){ showActionError('请输入有效的存入金额'); return; }
    const maturity=principal*(1+(rates[years]||0)*years);
    const early=principal*(1+0.002);
    genericModal('提前支取影响',`<div class="grid two"><div class="mini-stat"><span class="muted">按 ${years} 年定期到期</span><h3>${moneyText(maturity)}</h3></div><div class="mini-stat"><span class="muted">第 12 个月提前支取</span><h3 class="positive">约 ${moneyText(early)}</h3></div></div><div class="callout warn">按当前输入本金 ${moneyText(principal)} 和活期 0.20% 计算，实际利息以办理渠道和产品规则为准。</div>`,btn('知道了','close-dialog','primary'));
    return;
  }
});
