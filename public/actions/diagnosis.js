// W1 action domain: diagnosis. Only this file may be edited by its owner.
// Branches are kept verbatim; dispatch preserves their original order.
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
    const id=productId||'fund';
    const p=productOf(id)||{};
    void runRealAiTask('diagnosis_explain',{question:`请基于${p.name||id}的真实产品事实和授权持仓给出诊断解释。`},(result)=>{
      const diagnosis={name:p.name||id,asOf:session().asOf||'2026-09-28',drawdown:p.drawdown||'—',rank:'以本次证据为准',exposure:'以本次证据为准',text:result.text,sources:result.citations||[],evidence:result.evidence,executionMode:result.execution_mode||'real',model:result.model,latency_ms:result.latency_ms};
      window.__pendingDiagnosis=diagnosis;
      patch({diagnosis,aiRequests:[...(session().aiRequests||[]),result.request_id]});
      genericModal('基金深度诊断',`<div class="insight-header"><h2>${esc(diagnosis.name)}</h2><p class="muted">${diagnosis.executionMode==="fixture"?"演示桩 fixture 诊断":"AI 生成诊断"} · 数据截至 ${esc(diagnosis.asOf)}</p></div><p>${esc(diagnosis.text)}</p><div class="callout warn">风险提示：产品事实和风险字段来自本次证据包，解释不构成投资建议。</div><p class="muted">引用：${esc(diagnosis.sources.join('、')||'暂无')}。模型：${esc(diagnosis.model||'未知')} · ${esc(String(diagnosis.latency_ms||0))} ms。</p>`,btn('保存诊断','save-diagnosis','primary'));
      return false;
    },'m-diagnose',{product_ids:[id]});
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
    genericModal('保障详情',`<h2>安享长期医疗</h2><p class="muted">保障额度 ¥4,000,000 · 等待期 30 天 · 年度保费 ¥3,280</p><div class="callout warn">请重点确认：既往症除外责任、续保条件和免赔额。系统不替代健康告知、核保和理赔审核。</div>`,btn('返回保障检视','close-dialog','primary'));
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
