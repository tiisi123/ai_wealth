// W1 action domain: research. Only this file may be edited by its owner.
// Branches are kept verbatim; dispatch preserves their original order.
window.WealthActions.registerDomain(["ask","brief","extract","filter-panel","generate-candidates","mobile-search","new-research","new-supply","new-writing","onepager","quick-prompt","research-plan","review-writing","save","save-pc-compare","source-detail","subscribe","summary","sync-compare","task-center","templates","upload","workspace"], function actionsResearch(action, el, productId, e){
  if(action==='ask'){
    const q=($('#workspacePrompt')?.value||$('#researchPrompt')?.value||'').trim()||'美联储降息对黄金和固收+产品可能有什么影响？';
    void runRealAiTask('research_qa',{question:q},(result)=>{
      patch({researchAnswer:{question:q,text:result.text,sources:result.citations||[],source_ids:result.source_ids||[],evidence:result.evidence,model:result.model,latency_ms:result.latency_ms},researchUsedInCandidates:true,lastQuestion:q,aiRequests:[...(session().aiRequests||[]),result.request_id]});
    });
    return;
  }
  if(action==='quick-prompt'){
    const q=(el.textContent||'').trim();
    const box=$('#workspacePrompt')||$('#researchPrompt');
    if(box) box.value=q;
    void runRealAiTask('research_qa',{question:q},(result)=>{
      patch({researchAnswer:{question:q,text:result.text,sources:result.citations||[],source_ids:result.source_ids||[],evidence:result.evidence,model:result.model,latency_ms:result.latency_ms},researchUsedInCandidates:true,lastQuestion:q,aiRequests:[...(session().aiRequests||[]),result.request_id]});
    });
    return;
  }
  if(action==='generate-candidates'){
    if(!session().plan){ openLanding('allocation-needed'); return; }
    void (async()=>{
      try{
        await window.WealthApi.command('generate_candidates',{});
        if(!candidateIds().length) throw new Error('应用服务未返回候选产品');
        patch({researchUsedInCandidates:true});
        openLanding('generate-candidates');
      }catch(error){ showActionError(error); }
    })();
    return;
  }
  if(action==='sync-compare'){
    const source=session().compareSet?.length?session().compareSet:candidateIds();
    const ids=realProductIds(source);
    if(ids.length<2||ids.length>3){ openLanding('compare-needed'); return; }
    void (async()=>{
      try{
        await window.WealthApi.patch({compareSet:ids});
        openLanding('sync-compare');
      }catch(error){ showActionError(error); }
    })();
    return;
  }
  if(action==='save-pc-compare'||(action==='save'&&route()==='pc/compare')){
    const ids=realProductIds(session().compareSet);
    if(ids.length<2||ids.length>3){ openLanding('compare-needed'); return; }
    void runBusinessCommand('save_comparison',{product_ids:ids},'save-pc-compare');
    return;
  }
  if(action==='new-research'){ go('pc/research'); return; }
  if(action==='onepager'){
    const id=currentProductId();
    if(!id){ showActionError('当前页面产品无法映射到真实 product_id，未发起产品解释。'); return; }
    const p=productOf(id);
    void runRealAiTask('product_explain',{question:`请解释${p.name}的产品特征、风险和适用边界。`},(result)=>{
      patch({aiRequests:[...(session().aiRequests||[]),result.request_id]});
    },'onepager',{product_ids:[id],landingExtra:{productId:id}});
    return;
  }
  if(action==='summary'){
    const ref=readerDocumentRef();
    if(!ref.documentId){ showActionError('当前报告缺少真实 document_id，未发起报告摘要。'); return; }
    if(!ref.sourceIds.length){ showActionError('当前报告缺少真实 source_ids，未发起报告摘要。'); return; }
    void runRealAiTask('report_summary',{document_id:ref.documentId},(result)=>{
      patch({aiRequests:[...(session().aiRequests||[]),result.request_id]});
    },'summary',{source_ids:ref.sourceIds});
    return;
  }
  if(action==='new-writing'){
    const kind=uiOf('writingKind','定时写作');
    const topics={'定时写作':'宏观周报','结构化一页纸':'行业一页纸 · 电力设备','深度研究':'降息交易拥挤度'};
    const topic=topics[kind]||kind;
    void runRealAiTask('writing_draft',{topic},(result)=>{
      patch({aiRequests:[...(session().aiRequests||[]),result.request_id]});
    },'new-writing',{source_ids:availableSourceIds()});
    return;
  }
  if(WORK_ITEM_ACTIONS.has(action)){
    const extra={};
    if(action==='source-detail') extra.name=el.closest?.('.list-row')?.querySelector('h3')?.textContent||'来源详情';
    const title=extra.name||String(el.textContent||'').trim().slice(0,60)||action;
    void runBusinessCommand('record_activity',{kind:action,title},action,extra);
    return;
  }
  if(action==='save'){
    void runBusinessCommand('record_activity',{kind:'save',title:'保存到工作区'},'save');
    return;
  }
});
