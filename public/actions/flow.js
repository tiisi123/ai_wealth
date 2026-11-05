// W1 action domain: flow. Only this file may be edited by its owner.
// Branches are kept verbatim; dispatch preserves their original order.
window.WealthActions.registerDomain(["go-route","m-candidate-reason","m-compare-add","m-contact","m-event","m-generate-allocation","m-holding-detail","m-qualification","m-quick","m-remind","m-save","m-save-compare","m-send","m-submit-care","mobile-menu","mobile-search","pc-menu","pc-menu-close"], function actionsFlow(action, el, productId, e){
  if(action==='m-generate-allocation'){
    activeAiRequestToken+=1;
    const g=readAllocGoal();
    if(!g.authorized){ openLanding('auth-needed'); return; }
    const goal={amount:g.amount,term:g.term,risk:g.risk,purpose:g.purpose,liquidity:g.liquidity};
    void runRealAiTask('rule_match',{question:`请为${g.amount}、${g.term}、${g.risk}、${g.purpose}、${g.liquidity}选择配置规则。`,...goal},async(result,isCurrent)=>{
      const ruleMatch={status:result.status,rule_id:result.rule_id,rule_version:result.rule_version,confidence:result.confidence,missing_fields:result.missing_fields};
      patch({ruleMatch,aiRequests:[...(session().aiRequests||[]),result.request_id]});
      if(result.status!=='MATCHED'){
        openLanding('rule-confirmation');
        return false;
      }
      const allocation=await window.WealthApi.command('generate_allocation',{rule_id:result.rule_id,rule_version:result.rule_version,goal});
      if(!isCurrent()) return false;
      if(!allocation.result?.result || !session().plan) throw new Error('应用服务未保存有效配置方案');
      await window.WealthApi.command('generate_candidates',{});
      if(!isCurrent()) return false;
      if(!candidateIds().length) throw new Error('应用服务未返回候选产品');
    },'generate-allocation');
    return;
  }
  if(action==='m-candidate-reason'){
    const id=productId||'wealth';
    window.__pendingProduct=id;
    const p=productOf(id)||sessionApi()?.PRODUCTS?.wealth||{};
    void runRealAiTask('candidate_explain',{question:`请解释${p.name||id}为什么符合当前目标，并只使用已生成的候选事实。`},(result)=>{
      genericModal('为什么推荐它',`<h2>${esc(p.name||id)}</h2><p>${esc(result.text)}</p><div class="callout">候选资格和风险等级由确定性规则决定，模型只解释已生成结果。</div><p class="muted">引用：${esc((result.citations||[]).join('、')||'暂无')} · 模型：${esc(result.model||'未知')}</p>`,btn('加入比较','m-compare-add','primary',id));
      patch({aiRequests:[...(session().aiRequests||[]),result.request_id]});
      return false;
    },'m-candidate-reason',{product_ids:[id]});
    return;
  }
  if(action==='m-compare-add'){
    const id=productId||window.__pendingProduct||'';
    if(!id){ showActionError('缺少真实产品 ID，未加入比较'); return; }
    void (async()=>{
      try{
        await window.WealthApi.getSession();
        sessionApi()?.addCompare(id);
        await window.WealthApi.whenSynced();
        closeDialog();
        go('m/compare');
      }catch(error){ showActionError(error); }
    })();
    return;
  }
  if(action==='m-save'){
    const id=productId||window.__pendingProduct||'';
    if(!id){ showActionError('缺少真实产品 ID，未加入比较'); return; }
    void (async()=>{
      try{
        await window.WealthApi.getSession();
        sessionApi()?.addCompare(id);
        await window.WealthApi.whenSynced();
        closeDialog();
        go('m/compare');
      }catch(error){ showActionError(error); }
    })();
    return;
  }
  if(action==='m-save-compare'){
    const ids=realProductIds(session().compareSet);
    if(ids.length<2||ids.length>3){ openLanding('compare-needed'); return; }
    void runBusinessCommand('save_comparison',{product_ids:ids},'m-save-compare');
    return;
  }
  if(action==='m-holding-detail'){
    patch({holdingsExpanded:true});
    openLanding('m-holding-detail');
    return;
  }
  if(action==='m-qualification'){
    genericModal('资格办理指引',`<ol><li>确认身份与资产信息</li><li>完成风险测评和投资经验问卷</li><li>提交合格投资者证明材料</li><li>等待客户经理和系统双重审核</li></ol><div class="callout warn">受限产品仅在准入完成且授权范围内展示。当前演示客户未完成认定，不展示私募/信托/专户详情。</div>`,btn('联系客户经理','m-contact','primary'));
    return;
  }
  if(action==='m-contact'){patch({contactTodo:true}); closeDialog(); go('m/private'); return;}
  if(action==='m-event'){
    genericModal('事件解读',`<h2>A500 本周波动上升</h2><p>事实：行业权重调整与市场风险偏好变化使净值波动扩大。</p><p>对持仓：客户组合权益暴露 20%，影响可控。</p><div class="callout">建议先解释波动来源和数据区间，再由客户经理决定是否触达。不构成投资建议。</div>`);
    return;
  }
  if(action==='m-remind'){void runBusinessCommand('create_reminder',{},'m-remind');return;}
  if(action==='m-submit-care'){void runBusinessCommand('submit_care',{},'m-submit-care');return;}
  if(action==='m-quick'){
    const q=(el.textContent||'').trim();
    const input=$('#mobilePrompt');
    if(input) input.value=q;
    void runRealAiTask('assistant_qa',{question:q},(result)=>patch({lastQuestion:q,lastAnswer:{text:result.text,sources:result.citations||[],evidence:result.evidence,model:result.model,latency_ms:result.latency_ms},aiRequests:[...(session().aiRequests||[]),result.request_id]}),'m-send');
    return;
  }
  if(action==='m-send'){
    const input=$('#mobilePrompt');
    const q=(input?.value||'').trim();
    if(!q){ openLanding('prompt-needed'); return; }
    void runRealAiTask('assistant_qa',{question:q},(result)=>patch({lastQuestion:q,lastAnswer:{text:result.text,sources:result.citations||[],evidence:result.evidence,model:result.model,latency_ms:result.latency_ms},aiRequests:[...(session().aiRequests||[]),result.request_id]}),'m-send');
    return;
  }
  if(action==='pc-menu'){
    if(window.matchMedia && window.matchMedia('(max-width:900px)').matches){
      genericModal('功能导航', pcNav.map(g=>`<h4 class="nav-picker-title">${esc(g.label)}</h4><div class="nav-picker">${g.items.map(i=>`<button type="button" class="nav-link" data-action="open-route" data-route="${i[0]}">${icon(i[2])}<span>${i[1]}</span></button>`).join('')}</div>`).join('')+`<div class="nav-picker" style="margin-top:12px"><button type="button" class="nav-link" data-action="open-route" data-route="m/assistant">${icon('spark')}<span>切换到手机银行</span></button></div>`);
      return;
    }
    document.body.classList.toggle('nav-open');
    const mask=$('.sidebar-mask');
    if(mask) mask.hidden=!document.body.classList.contains('nav-open');
    return;
  }
  if(action==='pc-menu-close'){
    document.body.classList.remove('nav-open');
    const mask=$('.sidebar-mask');
    if(mask) mask.hidden=true;
    return;
  }
  if(action==='mobile-menu'){
    genericModal('手机网页原型入口',`<div class="nav-picker">${mobileNav.map(x=>`<button type="button" class="nav-link" data-action="open-route" data-route="${x[0]}">${icon(x[2])}<span>${x[1]}</span></button>`).join('')}</div>`);
    return;
  }
  if(action==='mobile-search'){ void runBusinessCommand('record_activity',{kind:'mobile-search',title:'A500'},'mobile-search',{query:'A500'}); return; }
  if(action==='go-route'){
    const r=el.getAttribute('data-route')||el.dataset.route;
    if(r) go(r);
    return;
  }
});
