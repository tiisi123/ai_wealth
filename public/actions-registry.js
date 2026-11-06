// W1 action registry. Action domains self-register from public/actions/*.js.
// New buttons belong in their owner's domain file, never in app.js.
window.WealthActions = (function () {
  const handlers = new Map();
  return {
    registerDomain(names, fn) {
      // First registration wins, matching the original single-function semantics
      // where the first matching branch returned from handleAction entirely.
      names.forEach((name) => { if (!handlers.has(name)) handlers.set(name, fn); });
    },
    dispatch(ctx) {
      const fn = handlers.get(ctx.action);
      if (!fn) {
        openLanding('not-implemented', { attempted: ctx.action || '' });
        return;
      }
      fn(ctx.action, ctx.el, ctx.productId, ctx.event);
    },
    knownActions() {
      return [...handlers.keys()].sort();
    }
  };
})();

// A04 撤销授权入口（frontend-lead 归属）。页面上的「撤销授权」与配置页的授权勾选
// 必须走同一条服务端命令 set_authorization：不新增命令、不改 PATCH 白名单。
// 授权状态与下游级联清理（plan / candidates / compareSet / compareSaved / careSubmitted …）
// 全部以服务端 downstreamReset() 的返回为准，页面不自行伪造清理结果。
window.WealthActions.registerDomain(['m-revoke-auth'], function actionsAuthorization(action, el, productId, e){
  if(action!=='m-revoke-auth') return;
  const button=el instanceof Element?el:null;
  if(button){ button.disabled=true; }
  void (async()=>{
    try{
      const body=await window.WealthApi.command('set_authorization',{authorized:false});
      if(body?.result?.status!=='APPLIED'||body?.result?.authorized!==false) throw new Error('应用服务未确认撤销授权，未展示成功状态');
      patch({authNotice:'已撤销使用持仓和风险测评信息的授权；生成方案、候选、比较与投后陪伴需要重新授权。'});
      openLanding('pref-updated',{name:'使用持仓和风险测评信息',on:false});
    }catch(error){
      if(button){ button.disabled=false; }
      showActionError(error);
    }
  })();
});

