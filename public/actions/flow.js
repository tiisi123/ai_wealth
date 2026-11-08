// W1 action domain: flow. Only this file may be edited by its owner.
// Branches are kept verbatim; dispatch preserves their original order.

// P-12：产品事实的服务端权威来源（products[] 与 holdings[] 同源自 GET /api/demo-data）。
// 该接口在 DATA_MODE=database 下不带 session_id 会直接 400，因此先确保共享会话已建立。
// 读取失败一律抛出，由调用方落到可见失败态——不得静默放行，也不得静默丢弃产品。
async function loadServerProductFacts(){
  await window.WealthApi.getSession();
  const sessionId=window.WealthApi.sessionId;
  if(!sessionId) throw new Error('共享会话未建立，无法读取产品数据');
  const response=await fetch(`/api/demo-data?session_id=${encodeURIComponent(sessionId)}`,{headers:{accept:'application/json'}});
  const body=await response.json().catch(()=>({}));
  if(!response.ok) throw new Error(body?.error?.message||`共享产品数据请求失败（${response.status}）`);
  if(!Array.isArray(body.products)) throw new Error('共享产品数据未返回产品清单');
  return { products: body.products, holdings: Array.isArray(body.holdings)?body.holdings:[] };
}

// P-12：加入比较共用链路。不可用产品不写入 compareSet，并给出可见说明；
// 服务端 PATCH 仍会复核产品存在性（sessionService 的 known 校验），这里是同口径前置拦截。
function addToCompare(id, label){
  if(!id){ showActionError('缺少真实产品 ID，未加入比较'); return; }
  void (async()=>{
    try{
      const facts=await loadServerProductFacts();
      const known=new Set(facts.products.map(product=>product.id));
      if(!known.has(id)){
        showActionError(`共享产品库中没有产品 ${id}，${label}未写入比较集`);
        return;
      }
      const added=sessionApi()?.addCompare(id);
      if(!Array.isArray(added) || !added.includes(id)) throw new Error('比较集未按预期更新为服务端状态');
      await window.WealthApi.whenSynced();
      closeDialog();
      go('m/compare');
    }catch(error){ showActionError(error); }
  })();
}

window.WealthActions.registerDomain(["go-route","m-candidate-reason","m-compare-add","m-contact","m-deposit-compare","m-event","m-generate-allocation","m-holding-detail","m-qualification","m-quick","m-remind","m-save","m-save-compare","m-send","m-submit-care","mobile-menu","mobile-search","pc-menu","pc-menu-close"], function actionsFlow(action, el, productId, e){
  if(action==='m-generate-allocation'){
    activeAiRequestToken+=1;
    const g=readAllocGoal();
    if(!g.authorized){ openLanding('auth-needed'); return; }
    const goal={amount:g.amount,term:g.term,risk:g.risk,purpose:g.purpose,liquidity:g.liquidity};
    void runRealAiTask('rule_match',{question:`请为${g.amount}、${g.term}、${g.risk}、${g.purpose}、${g.liquidity}选择配置规则。`,...goal},async(result,isCurrent)=>{
      const ruleMatch={status:result.status,rule_id:result.rule_id,rule_version:result.rule_version,confidence:result.confidence,missing_fields:result.missing_fields};
      patch({ruleMatch,aiRequests:[...(session().aiRequests||[]),result.request_id]});
      if(result.status!=='MATCHED'){
        // F-01：非 MATCHED 必须按规则匹配语义分流，不能一律落到「需要确认配置条件」。
        // NEED_CONFIRMATION：缺字段/置信度不足，需补充输入 → rule-confirmation；
        // UNSUPPORTED_RULE 及其它非 MATCHED（规则不支持 / 当前目标无法适用）→ 既有 rule-unsupported。
        // 两类都在此 return false：不执行 generate_allocation / generate_candidates，
        // 不生成或覆盖配置方案，也不打开成功结果页。
        openLanding(result.status==='NEED_CONFIRMATION'?'rule-confirmation':'rule-unsupported');
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
  if(action==='m-compare-add'){ addToCompare(productId||window.__pendingProduct||'', '该产品'); return; }
  if(action==='m-save'){ addToCompare(productId||window.__pendingProduct||'', '该产品'); return; }
  // P-04：到期本息必须由服务端确定性计算给出。deposit-interest-simple 已有实现，但
  // businessRulesService.executeDeterministic() 没有任何调用方，也没有 2/3/5 年挂牌利率
  // 与活期利率的服务端来源；m/deposit 的 1/3/5 年常量与 pc/product-deposit 的 DCD 挂牌
  // 利率 1.90% 互相矛盾，同一产品利率没有唯一真值。因此浏览器不再自算本息、也不套用
  // 默认利率，而是落到显式的「需服务端权威结果」失败态；服务端计算入口就绪后在此接线。
  if(action==='m-deposit-compare'){
    showActionError('存款到期本息需由服务端权威结果给出（复用 deposit-interest-simple，统一百分数/小数单位）。当前服务端计算入口尚未接入，系统没有在浏览器计算或展示到期本息与提前支取金额。');
    return;
  }
  if(action==='m-save-compare'){
    const ids=realProductIds(session().compareSet);
    if(ids.length<2||ids.length>3){ openLanding('compare-needed'); return; }
    void (async()=>{
      let body;
      try{
        body=await window.WealthApi.command('save_comparison',{product_ids:ids});
      }catch(error){ showActionError(error); return; }
      const saved=Array.isArray(body?.result?.product_ids)?body.result.product_ids:[];
      if(body?.result?.status!=='APPLIED' || saved.length!==ids.length || saved.some(id=>!ids.includes(id))){
        showActionError('应用服务未确认保存的比较结果，未展示成功状态');
        return;
      }
      // H-03：比较结论改为可由「服务端已保存的比较集 + 当前产品事实」复算的表述，
      // 不再陈述未经计算的因果关系。任何一行缺值都显式标为无数据，不参与结论推导。
      const products=saved.map(id=>productOf(id)||{});
      const missing=products.flatMap(p=>['ret','drawdown']
        .filter(key=>p[key]==null || p[key]==='' || p[key]==='—')
        .map(key=>`${p.name||p.id}·${key==='ret'?'区间收益':'最大回撤'}`));
      const order={R1:1,R2:2,R3:3,R4:4,R5:5};
      const tiers=[...new Set(products.map(p=>p.risk).filter(r=>order[r]))];
      const lines=[
        '口径说明（可由上方表格逐项复算，不构成排名或推荐）：',
        `· 比较集：${saved.join(' / ')}，已由应用服务保存，数据版本 ${body.result.data_version||'未返回'}。`,
        missing.length
          ? `· 缺失值（无数据，不参与任何比较）：${missing.join('、')}。`
          : '· 区间收益与最大回撤均已取到，可与上方表格逐项对照。',
        tiers.length===1
          ? `· 风险等级：全部为 ${tiers[0]} 同档，区间收益与最大回撤可直接并列对照。`
          : (tiers.length>1
            ? `· 风险等级：${tiers.join(' / ')} 跨档，区间收益与最大回撤属于不同风险档产品，口径不同不可直接排名。`
            : '· 风险等级：未返回可比较的风险等级，区间收益与最大回撤不参与横向排名。')
      ];
      openLanding('m-save-compare',{summary:lines.join('')});
    })();
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
  // C-01 前置兼容：优先用真实命令 record_activity(kind='contact-request') 写入服务端活动记录。
  // window.WealthApi.command() 自动携带 expected_version + request_id（幂等、乐观锁），此处沿用。
  // 旧服务端尚未收录该 kind 时，会以 400 VALIDATION_ERROR 拒绝；仅此一种错误允许临时回退到
  // 旧的 PATCH contactTodo 行为（后续清理 PR 会删除该回退）。其它错误（409/422/5xx/网络/其它 400）
  // 一律走 showActionError 显示真实错误，不回退、不伪造成功。
  if(action==='m-contact'){
    void (async()=>{
      let body;
      try{
        body=await window.WealthApi.command('record_activity',{kind:'contact-request',title:'联系客户经理'});
      }catch(error){
        const info=error?.body?.error||{};
        const details=info.details||{};
        const code=String(error?.code||info.code||'');
        const message=String(info.message||error?.message||'');
        const unknownKind400=error?.status===400 && code==='VALIDATION_ERROR'
          && (String(details.kind||'')==='contact-request' || /kind|白名单/i.test(message));
        if(unknownKind400){
          // 临时回退：旧服务端没有 contact-request kind，保留原 PATCH contactTodo 行为；
          // 不声称任何服务端记录，不展示虚构 activity_id/时间。
          patch({contactTodo:true}); closeDialog(); go('m/private'); return;
        }
        showActionError(error); return;
      }
      const record=body?.result;
      if(record?.status!=='APPLIED' || !record.activity_id || !record.created_at){
        showActionError('应用服务未确认联系请求活动记录，未展示成功状态'); return;
      }
      // 新 kind 路径：只展示服务端真实生成的 activity_id / created_at / data_version。
      const rows=[
        ['活动类型','contact-request（record_activity）'],
        ['activity_id',String(record.activity_id)],
        ['created_at（服务端时间）',String(record.created_at)],
        ['data_version',String(record.data_version||'—')]
      ].map(([k,v])=>`<div class="stat-row"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('');
      closeDialog();
      genericModal('联系客户经理已记录',
        `<p class="section-space">该联系请求已由应用服务写入真实活动记录，服务端生成 activity_id / created_at / data_version，刷新后可从会话恢复；本次调用沿用 expected_version + request_id（幂等），没有写入浏览器本地待办，也不展示任何虚构记录。</p><div class="list-row">${rows}</div><div class="callout">记录仅供流程验证，不构成业务受理结论。</div>`,
        btn('知道了','close-dialog','primary'));
    })();
    return;
  }
  // F-09：移除固定的事件解读演示文本与虚构持仓暴露比例，不再保留任何写死的波动/比例数值。
  // 只消费 GET /api/knowledge 落到会话里的真实知识片段；片段须带服务端来源 source_id、
  // 时点 source_timestamp 与正文 text 才算可靠来源。没有任何可靠来源时显式空态，
  // 不补入默认观点、不保留任何虚构数值。
  if(action==='m-event'){
    const chunks=Array.isArray(session()._knowledgeChunks)?session()._knowledgeChunks:[];
    const reliable=c=>c && typeof c.source_id==='string' && c.source_id.trim()
      && typeof c.source_timestamp==='string' && c.source_timestamp.trim()
      && typeof c.text==='string' && c.text.trim();
    const sources=chunks.filter(reliable);
    if(!sources.length){
      closeDialog();
      genericModal('事件解读',
        `<div class="callout warn"><b>暂无可靠事件来源</b><p>共享应用服务没有返回带来源与时点的事件知识片段（GET /api/knowledge）。本页不展示演示事件、波动幅度或持仓暴露比例，也不补入默认观点。可先在智能问答中针对具体问题检索。</p></div>`,
        btn('知道了','close-dialog','primary'));
      return;
    }
    const shownTime=v=>typeof literalTime==='function'?(literalTime(v)||String(v||'—')):String(v||'—');
    const version=session()._knowledgeStatus?.knowledge_version||'—';
    const rows=sources.map(c=>`<div class="list-row"><h3>${esc(c.title||c.chunk_id||'知识片段')}</h3><p>${esc(c.text)}</p><p class="muted">数据来源 ${esc(c.source_id)} · 时点 ${esc(shownTime(c.source_timestamp))} · 片段 ${esc(c.chunk_id||'—')}${c.page!=null?` · 第 ${esc(String(c.page))} 页`:''} · 知识版本 ${esc(c.knowledge_version||version)}</p></div>`).join('');
    closeDialog();
    genericModal('事件解读',
      `<p class="muted">以下内容只取自 GET /api/knowledge 的真实知识片段，逐条标注服务端来源与时点；共享知识库没有专属事件序列时只列出可用的已发布片段，系统不补入默认观点，不展示未经服务端给出的波动幅度、持仓暴露或任何演示数值。</p>${rows}<div class="callout">片段为服务端已发布材料，不构成投资建议；是否触达客户由客户经理决定。</div>`,
      btn('知道了','close-dialog','primary'));
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
