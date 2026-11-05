// W1 action domain: navigation. Only this file may be edited by its owner.
// Branches are kept verbatim; dispatch preserves their original order.
window.WealthActions.registerDomain(["audit","back-from","close-dialog","go-allocation","go-candidates","go-companion","go-compare","go-fund","go-pc-candidates","go-pc-compare","go-research","go-workspace","help","mobile-help","open-route","pick-ui","requirements","reset-insight"], function actionsNavigation(action, el, productId, e){
  if(action==='requirements'){reqModal();return;}
  if(action==='close-dialog'){$('#globalDialog')?.close();return;}
  if(action==='open-route'){
    const href=el.getAttribute?.('href')||'';
    const r=el.dataset.route || (href.startsWith('#')?href.slice(1):'');
    $('#globalDialog')?.close();
    if(r) go(r);
    return;
  }
  if(action==='help'||action==='mobile-help'){
    genericModal('使用帮助',`<div class="callout">这是一个可点击的产品快速原型。示例数据用于说明流程，不连接真实账户、行情或交易系统。</div><h3>建议体验路径</h3><ol><li>客户：助手问答 → 持仓诊断 → 基金诊基 → 资产配置 → 候选推荐 → 产品比较 → 投后陪伴。</li><li>投顾：能力总览 → 投研工作台提问 → 研究回答（带来源）→ 候选解释 → 选品池 → 验收。</li><li>私行页在未完成合格投资者认定前不展示产品详情。</li></ol>`,btn('知道了','close-dialog','primary'));
    return;
  }
  if(action==='audit'){
    genericModal('运行日志',`<div class="audit-list">${['09:30 任务编排链路运行完成 · 1.8s','09:28 研究回答引用校验通过','09:25 基金选品池更新完成 · 128 个候选','09:18 知识源 KB-2026-0912 触发续期提醒','09:10 客户持仓诊断生成内部材料'].map(x=>`<div class="audit-line"><span class="muted">${x.slice(0,5)}</span><span>${x.slice(6)}</span></div>`).join('')}</div>`);
    return;
  }

  if(action==='pick-ui'){
    const key=el.getAttribute('data-ui-key');
    const value=el.getAttribute('data-ui-value');
    if(key) setUi(key, value);
    rerender();
    return;
  }
  if(action==='reset-insight'){
    const all=Object.assign({}, session().uiState||{});
    all[route()]={};
    patch({uiState:all, viewFilter:Object.assign({}, session().viewFilter||{}, {[route()]: undefined})});
    const vf=Object.assign({}, session().viewFilter||{});
    delete vf[route()];
    patch({viewFilter:vf, uiState:all});
    rerender();
    return;
  }
  if(action==='go-allocation'){go('m/allocation');return;}
  if(action==='go-candidates'){go('m/candidates');return;}
  if(action==='go-compare'){go('m/compare');return;}
  if(action==='go-companion'){go('m/companion');return;}
  if(action==='go-fund'){go('m/fund');return;}
  if(action==='go-workspace'){go('pc/workspace');return;}
  if(action==='go-research'){go('pc/research');return;}
  if(action==='go-pc-candidates'){go('pc/candidates');return;}
  if(action==='go-pc-compare'){go('pc/compare');return;}
  if(action==='back-from'){ go(session().landing?.from || (isMobileRoute(route())?'m/assistant':'pc/architecture')); return; }

});
