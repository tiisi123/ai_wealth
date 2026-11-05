/* 财富智服 · 可运行原型。所有数据为演示数据，动作只更新当前页面状态。 */
// W1 AO canary drill (stage 2): harmless out-of-scope marker in public/app.js (owner: frontend-lead).
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const esc = (v='') => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon = (name, cls='icon') => { const paths={
  grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  search:'<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/>',spark:'<path d="m12 2 1.7 7.2L21 12l-7.3 2.8L12 22l-1.7-7.2L3 12l7.3-2.8L12 2Z"/>',
  chart:'<path d="M4 19V5M4 19h17"/><path d="m7 15 3-4 3 2 5-7"/>',book:'<path d="M4 5.2A2.2 2.2 0 0 1 6.2 3H20v16H6.2A2.2 2.2 0 0 0 4 21V5.2Z"/><path d="M4 19V5.2"/>',
  sliders:'<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="11" cy="18" r="2"/>',bolt:'<path d="m13 2-9 11h7l-1 9 9-12h-7l1-8Z"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',users:'<circle cx="9" cy="8" r="3.2"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 5.5a3 3 0 0 1 0 5.8M18 14a5.5 5.5 0 0 1 3.5 5"/>',
  bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',settings:'<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/><circle cx="12" cy="12" r="3.5"/>',
  help:'<circle cx="12" cy="12" r="9"/><path d="M9.6 9a2.6 2.6 0 0 1 5 .9c0 2-2.6 2.1-2.6 3.8M12 17h.01"/>',arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',chev:'<path d="m9 18 6-6-6-6"/>',check:'<path d="m5 12 4 4L19 6"/>',file:'<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
  shield:'<path d="M12 3 20 6v5c0 5-3.4 8.3-8 10-4.6-1.7-8-5-8-10V6l8-3Z"/><path d="m8.5 12 2.4 2.4 4.6-5"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',filter:'<path d="M4 5h16l-6 7v5l-4 2v-7L4 5Z"/>',download:'<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',external:'<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 13v6H4V5h6"/>',lock:'<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',send:'<path d="m21 3-7 18-4-8-8-4 19-6Z"/><path d="M21 3 10 13"/>',refresh:'<path d="M20 11a8 8 0 1 0 1 5"/><path d="M20 4v7h-7"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',close:'<path d="M5 5l14 14M19 5 5 19"/>',plus:'<path d="M12 5v14M5 12h14"/>',download2:'<path d="M12 4v10M8 11l4 4 4-4M5 20h14"/>',
 };
 return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.grid}</svg>`; };
const route = () => (location.hash||'#pc/architecture').slice(1).split('?')[0];
const isMobileRoute = r => String(r||'').startsWith('m/');
const go = (r) => {
  closeDialog();
  const target=String(r||'pc/architecture');
  if(!/\/result$/.test(target) && session().landing) patch({landing:null});
  if(route()===target){ window.scrollTo(0,0); render(); return; }
  location.hash=target;
  window.scrollTo(0,0);
};
const viewOf = () => (session().viewFilter||{})[route()] || '';
const setView = (label) => {
  const vf=Object.assign({}, session().viewFilter||{});
  if(label) vf[route()]=label; else delete vf[route()];
  patch({viewFilter:vf});
};
const uiOf = (key, fallback='') => {
  const page=(session().uiState||{})[route()]||{};
  const v=page[key];
  return (v==null||v==='')?fallback:v;
};
const setUi = (key, value) => {
  const all=Object.assign({}, session().uiState||{});
  const page=Object.assign({}, all[route()]||{});
  page[key]=value;
  all[route()]=page;
  patch({uiState:all});
};
const tabBtn = (label, fallback) => `<button type="button" data-view="${esc(label)}" class="${(viewOf()||fallback)===label?'active':''}">${esc(label)}</button>`;
function openLanding(id, extra){
  const cur=route();
  const prev=session().landing;
  const from=(extra&&extra.from)||((cur==='pc/result'||cur==='m/result')&&prev?.from)||cur;
  const mobile=isMobileRoute(from)||isMobileRoute(cur);
  patch({landing:Object.assign({id, from, asOf:session().asOf||'2026-09-28'}, extra||{})});
  closeDialog();
  const target=mobile?'m/result':'pc/result';
  if(route()===target){ window.scrollTo(0,0); render(); }
  else location.hash=target;
}
const sessionApi = () => window.DemoSession;
const session = () => (sessionApi()?.get() || {});
const patch = (p) => sessionApi()?.patch(p);
const productOf = (id) => sessionApi()?.product(id);
const closeDialog = () => { const d=$('#globalDialog'); if(d?.open) d.close(); };
const rerender = () => { closeDialog(); render(); };
const goalText = () => sessionApi()?.goalLabel?.() || 'R3 平衡型 · 3–5 年 · 教育金储备 · ¥500,000';
const candidateIds = () => (session().candidates || []).slice();
const compareIds = () => (session().compareSet || []).slice();
const planOf = () => session().plan || null;
const readAllocGoal = () => {
  const amount = ($('#allocAmount')?.value || '¥500,000').trim() || '¥500,000';
  const term = $('#allocTerm')?.value || '3–5 年';
  const risk = $('#allocRisk')?.value || 'R3 平衡型';
  const purpose = $('#allocPurpose')?.value || '教育金储备';
  const liquidity = $('#allocLiquidity')?.value || '大部分可长期投资';
  const authorized = $('#allocAuth') ? $('#allocAuth').checked : true;
  return {amount, term, risk, purpose, liquidity, authorized};
};
const moneyText = (value) => `¥${Number(value || 0).toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const holdingValue = (holding) => {
  if (typeof holding?.amount === 'number') return holding.amount;
  return Number(String(holding?.amount || '').replace(/[^0-9.-]/g,'')) || 0;
};
const holdingsSummary = () => {
  const rows=sessionApi()?.HOLDINGS || [];
  const total=rows.reduce((sum,row)=>sum+holdingValue(row),0);
  const byType={};
  rows.forEach(row=>{ byType[row.type||'其他']=(byType[row.type||'其他']||0)+holdingValue(row); });
  return {rows,total,byType};
};
const realProductIds = (ids) => [...new Set((ids || []).filter(id=>!!productOf(id)))];
const idList = (value) => Array.isArray(value)?value:(value?[value]:[]);
const availableSourceIds = () => [...new Set([
  ...idList(session().researchAnswer?.source_ids),
  ...idList(session().source_ids),
  ...idList(session().readerDocument?.source_ids),
  ...idList((session()._knowledgeChunks || []).map(chunk=>chunk.source_id))
].filter(Boolean))];
const currentProductId = () => {
  const defaults={'pc/product-fund':'A500','pc/product-insurance':'MED','pc/product-wealth':'W180','pc/product-deposit':'D3Y'};
  const selected=uiOf('productId',defaults[route()] || '');
  const mapped={A500:'fund',MED:'insurance',W180:'wealth',WCASH:'cash',WPLUS:'wealthplus',D3Y:'deposit'}[selected];
  return mapped && productOf(mapped) ? mapped : '';
};
const readerDocumentRef = () => {
  const documents=session()._knowledgeDocuments || session().knowledgeDocuments || session().documents || [];
  const doc=session().readerDocument || documents.find(item=>item.title==='中国权益市场月度策略') || documents[0] || {};
  return {
    documentId:doc.document_id || doc.id || session().readerDocumentId || '',
    sourceIds:idList(doc.source_ids || doc.source_id || session().readerSourceIds).filter(Boolean)
  };
};
function showActionError(error){
  if(error?.code==='STALE_REQUEST') return;
  patch({promptError:typeof error==='string'?error:(error?.message||'操作失败，未写入成功状态')});
  openLanding('action-error');
}
async function runBusinessCommand(command,input,landingId,extra={}){
  try{
    const body=await window.WealthApi.command(command,input);
    if(landingId) openLanding(landingId,extra);
    return body;
  }catch(error){
    showActionError(error);
    return null;
  }
}
const statusBadge = (text, tone='blue') => `<span class="badge ${tone}">${esc(text)}</span>`;
const btn = (text, action='', kind='', product='') => `<button class="btn ${kind}" data-action="${esc(action)}"${product?` data-product="${esc(product)}"`:''}>${text}</button>`;
const lineChart = (color='#4473da', points='0,76 60,64 120,69 180,43 240,51 300,31 360,37 420,18') => `<svg class="chart" viewBox="0 0 450 125" role="img" aria-label="趋势示意图"><path d="M0 105H450" stroke="#e9edf4"/><path d="M0 72H450M0 39H450" stroke="#eef1f6"/><polyline points="${points}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="420" cy="18" r="4" fill="${color}"/><text x="0" y="123">1月</text><text x="210" y="123">4月</text><text x="421" y="123">6月</text></svg>`;
const barChart = (items, colors=['#4673da','#6e93e9','#5eb0a8','#d9b967']) => `<div class="mini-bars">${items.map((x,i)=>`<div class="bar-row"><span>${esc(x[0])}</span><div class="bar-track"><span style="width:${x[1]}%;background:${colors[i%colors.length]}"></span></div><b>${esc(x[2]||x[1]+'%')}</b></div>`).join('')}</div>`;
const metric = (label, value, meta, ico='chart', tone='') => `<div class="card"><div class="metric-top"><div class="metric-label">${esc(label)}</div><div class="metric-icon">${icon(ico)}</div></div><div class="metric-value ${tone}">${value}</div><div class="metric-meta">${meta}</div></div>`;
const pageHeading = (eyebrow, title, sub, actions='') => `<div class="page-heading"><div><div class="eyebrow">${esc(eyebrow)}</div><h1>${title}</h1>${sub?`<p class="sub">${sub}</p>`:''}</div><div class="row wrap">${actions}</div></div>`;

// W1 work-item actions: these used to be static landing pages. Each now
// writes a server-authoritative activity via the record_activity command.
const WORK_ITEM_ACTIONS = new Set(['task-center','source-detail','new-supply','subscribe','brief','upload','extract','templates','review-writing','workspace','research-plan','save','mobile-search','filter-panel']);
const pcNav = [
 {label:'工作台',icon:'grid',items:[['pc/architecture','能力总览','grid'],['pc/workspace','投研工作台','users']]},
 {label:'财富产品洞察',icon:'chart',items:[['pc/product-fund','基金洞察','chart'],['pc/product-insurance','保险洞察','shield'],['pc/product-wealth','理财洞察','chart'],['pc/product-deposit','存款洞察','chart'],['pc/product-private','私行产品','lock'],['pc/candidates','候选产品池','filter'],['pc/compare','横向比较','grid']]},
 {label:'财富投研',icon:'book',items:[['pc/supply','投研与策略供给','book'],['pc/research','智能问答与研究','spark'],['pc/events','市场事件','bolt'],['pc/macro','宏观分析','chart'],['pc/industry','行业解读','grid'],['pc/library','产品智库','book'],['pc/reader','报告阅读','file'],['pc/writing','智能写作','file']]},
];
const mobileNav = [
 ['m/assistant','AI助手','spark'],['m/fund','基金诊断','chart'],['m/insurance','保险保障','shield'],['m/wealth','理财产品','chart'],['m/deposit','存款测算','chart'],['m/private','私行产品','lock'],['m/allocation','资产配置','sliders'],['m/holdings','持仓诊断','grid'],['m/candidates','候选推荐','filter'],['m/compare','产品比较','grid'],['m/companion','投后陪伴','clock']
];
const reqFor = r => (window.REQUIREMENTS||[]).find(x=>x.route===r);

function sidebar(active){
  return `<aside class="sidebar" id="pcSidebar"><div class="brand"><span class="mark">${icon('spark')}</span><div><strong>财富智服</strong><small>AI WEALTH SERVICE</small></div></div><div class="nav-scroll">${pcNav.map(g=>{
    const current=g.items.some(i=>i[0]===active);
    return `<details class="nav-group${current?' current':''}" name="pc-nav"${current?' open':''}><summary><span class="nav-group-title">${g.label}</span><span class="nav-count">${g.items.length}</span></summary><div class="nav-children">${g.items.map(i=>`<a class="nav-link ${active===i[0]?'active':''}" href="#${i[0]}" data-action="open-route" data-route="${i[0]}">${icon(i[2],'icon')}<span>${i[1]}</span></a>`).join('')}</div></details>`;
  }).join('')}</div><div class="nav-foot"><button data-action="requirements">${icon('file')}需求清单与原型索引</button><button data-action="help">${icon('help')}使用帮助</button></div></aside>`;
}
function topbar(r){ const req=reqFor(r); const role=session().role||'投顾 / 财富管理'; const roles=['投顾 / 财富管理','专业投研','产品管理','运营与验收']; return `<header class="topbar"><button class="btn small menu-toggle" type="button" data-action="pc-menu">${icon('grid')}菜单</button><div class="breadcrumb"><span>财富智服</span><b>/</b><span>${req?esc(req.title):'能力总览'}</span></div><div class="top-actions"><a class="btn small mobile-entry" href="#m/assistant" data-action="open-route" data-route="m/assistant">手机银行</a><select class="role-select" aria-label="当前角色" data-role-switch>${roles.map(x=>`<option${x===role?' selected':''}>${x}</option>`).join('')}</select><div class="avatar">林</div></div></header>`; }
function pcShell(r, inner){ document.body.className=''; document.body.classList.remove('nav-open'); $('#app').innerHTML=`<div class="shell">${sidebar(r)}<div class="sidebar-mask" data-action="pc-menu-close" hidden></div><div class="desktop-main">${topbar(r)}<section class="content">${inner}</section></div></div>`; bindCommon(); }

function bindDialog(d){ /* 弹窗内按钮由 document 事件委托处理，避免重复绑定 */ void d; }
const hasRuntimePage = r => !['delivery','model-delivery','rollout','acceptance','models','orchestration','standards','integration','select-fund','select-wealth','select-insurance','sources'].includes(String(r).split('/')[1]);
function reqModal(){ const d=$('#globalDialog'); d.className='wide'; d.innerHTML=`<div class="dialog-head"><div><div class="eyebrow">TRACEABILITY</div><h2>需求清单与原型索引</h2></div><button class="icon-btn" data-action="close-dialog">${icon('close')}</button></div><div class="dialog-body"><div class="callout">业务需求绑定原型入口；交付、模型与运营能力通过文档、接口或受控脚本提供，不单设运行页面。示例数据仅用于演示工作流。</div>${(window.REQUIREMENTS||[]).map(x=>`<details class="requirement-entry"><summary><span class="pill-number">${x.id.slice(1)}</span><span class="req-title"><b>${esc(x.title)}</b><br><span class="muted">${esc(x.group)}</span></span>${statusBadge(x.device,x.device==='手机网页'?'purple':'blue')}<span class="req-end">${esc(x.route)} ${icon('chev')}</span></summary><p>${esc(x.detail)}</p><div class="req-end"><span>交互重点：${x.device==='手机网页'?'适配单手操作、对话问答与结果卡片':'工作台、筛选、证据链与审核流程'}</span>${hasRuntimePage(x.route)?`<a class="link-btn" href="#${x.route}" data-action="open-route" data-route="${x.route}">打开原型 ${icon('arrow')}</a>`:'<span class="muted">无独立运行页面</span>'}</div></details>`).join('')}</div><div class="dialog-footer">${btn('关闭','close-dialog')}</div>`; bindDialog(d); d.showModal(); }
function genericModal(title, body, footer=''){ const d=$('#globalDialog'); d.className=''; d.innerHTML=`<div class="dialog-head"><h2>${title}</h2><button class="icon-btn" data-action="close-dialog">${icon('close')}</button></div><div class="dialog-body">${body}</div>${footer?`<div class="dialog-footer">${footer}</div>`:''}`; bindDialog(d); d.showModal(); }

function pageArchitecture(){return pageHeading('CONTROL TOWER','AI 财富管理智能服务中台','面向全集团统一运营的能力总览。今天有 6 个待处理任务，数据时点：2026-09-28 09:30。',btn('需求清单','requirements','light')+btn('进入投研工作台','go-workspace','primary'))+`<div class="grid four">${metric('已接入能力','28','模型 6 · 智能体 12 · 工具 10','bolt','text-blue')}${metric('今日调用量','18,426','较昨日 +12.8%','chart','text-blue')}${metric('专业评测通过率','94.6%','最近一轮回归评测','check','positive')}${metric('待处理事项','6','2 条需要业务确认','bell','text-blue')}</div><div class="grid main-aside section-space"><div class="stack"><div class="card"><div class="card-head"><div><h2>能力编排总览</h2><p class="muted">从数据、知识到可交付服务的受控链路</p></div>${''}</div><div class="flow"></div><div class="divider"></div><div class="between"><h3>服务健康度</h3>${statusBadge('运行正常','green')}</div><div class="grid three section-space"><div class="mini-stat"><small class="muted">接口可用性</small><h3>99.98%</h3><div class="progress"><span style="width:99.98%"></span></div></div><div class="mini-stat"><small class="muted">平均响应</small><h3>1.8s</h3><div class="progress"><span style="width:72%"></span></div></div><div class="mini-stat"><small class="muted">引用可追溯</small><h3>98.2%</h3><div class="progress"><span style="width:98.2%"></span></div></div></div></div><div class="card"><div class="card-head"><h2>近期任务</h2><button class="link-btn" data-action="task-center">任务中心 ${icon('arrow')}</button></div><div class="task-line clickable" data-action="go-route" data-route="pc/writing"><span class="task-dot">${icon('file')}</span><div class="task-text"><b>宏观周报 · 待确认关键观点</b><p>专业投研 · 10 分钟前 · 点击打开智能写作</p></div>${statusBadge('待确认','orange')}</div><div class="task-line clickable" data-action="go-route" data-route="pc/product-private"><span class="task-dot">${icon('shield')}</span><div class="task-text"><b>私行产品准入 · 待补充资质</b><p>产品管理 · 35 分钟前 · 点击打开私行准入</p></div>${statusBadge('待补充','red')}</div></div></div><aside class="stack"><div class="card"><div class="card-head"><h2>运营提醒</h2>${statusBadge('3 条','orange')}</div><div class="attention-list"></div></div><div class="card"><div class="card-head"><h2>调用趋势</h2><span class="muted">近 7 日</span></div>${lineChart('#4673da','0,88 60,76 120,80 180,61 240,66 300,42 360,45 420,19')}<div class="legend"><span><i class="swatch" style="background:#4673da"></i>调用量</span><span>峰值 3,904 次</span></div></div></aside></div>`;}

function pageWorkspace(){
  const s=session();
  const role=s.role||'投顾 / 财富管理';
  const caps={
    '投顾 / 财富管理':[['基础检索与问答','产品、政策、机构资料'],['客户配置分析','需客户授权，生成内部材料'],['候选解释','林女士教育金方案与比较']],
    '专业投研':[['深度研究写作','需专业投研角色'],['报告阅读','引用定位到页码'],['宏观/行业解读','事实与推断分开']],
    '产品管理':[['产品智库','说明书、净值与观点版本'],['选品池审核','权重调整进入待审版本'],['私行准入','合格投资者材料待办']],
    '运营与验收':[['能力总览','调用量与待处理事项'],['验收清单','功能/数据/专业检查'],['渠道可靠性','接口版本与故障隔离']]
  }[role]||[];
  const ans=s.researchAnswer;
  const answerCard=ans
    ? `<div class="card"><div class="card-head"><h2>本次研究回答</h2><span class="muted">数据时点 ${esc(s.asOfFull||'2026-09-28 09:30')}</span></div><div class="chat-bubble"><div class="chat-name">${icon('spark')} 财富智服 · 研究回答</div><p><b>问题：</b>${esc(ans.question)}</p><p>${esc(ans.text)}</p><div class="chips">${(ans.sources||[]).map(x=>`<button class="source" data-action="source-detail">${esc(x)}</button>`).join('')}</div></div><div class="callout warn">研究参考，不构成投资建议。候选排序不替代适当性结论。</div>${btn('查看候选解释','go-pc-candidates','primary full')}</div>`
    : `<div class="card"><div class="card-head"><h2>最近使用</h2><button class="link-btn" data-action="go-research">打开研究台 ${icon('arrow')}</button></div><div class="task-line"><span class="task-dot">${icon('file')}</span><div class="task-text"><b>固收+产品比较一页纸</b><p>昨天 17:42 · 已保存至个人工作区</p></div>${statusBadge('草稿','orange')}</div><div class="task-line"><span class="task-dot">${icon('spark')}</span><div class="task-text"><b>林女士组合复盘</b><p>周一 09:10 · 仅客户经理可见</p></div>${statusBadge('待确认','orange')}</div></div>`;
  return pageHeading('ROLE WORKSPACE','投研工作台',`按岗位展示最近使用、推荐任务和授权成果。当前身份：${esc(role)}。`,btn('打开智能问答','go-research','primary'))+`<div class="grid main-aside"><div class="stack"><div class="card"><div class="card-head"><div><h2>今天从哪里开始？</h2><p class="muted">可以直接输入问题，也可以从推荐任务开始。</p></div>${statusBadge('已连接行内知识库','green')}</div><div class="prompt-box"><textarea id="workspacePrompt" placeholder="例如：比较固收+产品近一年回撤，并给出客户经理可解释的话术">${esc(ans?.question||'')}</textarea><div class="prompt-footer"><span class="muted">${icon('shield')} 只使用当前岗位有权访问的资料</span>${btn('开始分析','ask','primary')}</div></div><div class="prompt-quick"><button data-action="quick-prompt">生成本周客户持仓复盘</button><button data-action="quick-prompt">解释最新宏观数据</button><button data-action="quick-prompt">找 3 只稳健型候选产品</button></div></div>${answerCard}</div><aside class="stack"><div class="card"><div class="card-head"><h2>按权限可用</h2>${statusBadge(role,'blue')}</div>${caps.map(x=>`<div class="list-row"><h3>${x[0]}</h3><p class="muted">${x[1]}</p></div>`).join('')}</div><div class="card"><div class="card-head"><h2>消息提醒</h2>${statusBadge('2','orange')}</div><div class="attention"><span class="attention-icon">${icon('bell')}</span><div><h4>有一份报告需要你确认</h4><p>宏观周报 · 关键观点第 3 条</p></div></div></div></aside></div>`;
}

function productPage(type){
  const catalog={
    fund:{
      ey:'FUND INTELLIGENCE',title:'基金产品洞察',sub:'按统一口径查看基金档案、业绩、风险、经理与持仓，并形成可解释候选。',
      tabs:['基金概览','基金经理','行业板块','基金通识'],color:'#4673da',
      products:[
        {id:'A500',name:'易方达中证A500ETF联接A',code:'017144',kind:'指数型',risk:'R3',ret:'18.42%',dd:'-9.8%',sharpe:'1.26',nav:'1.1842',manager:'王敏',company:'易方达基金',years:'8 年',aum:'186 亿',tenure:'+41.2%',style:'指数增强偏均衡',track:'0.32%',fee:'0.50%',spark:'0,62 60,54 120,50 180,44 240,38 300,28 360,22 420,18',holdings:[['宁德时代','6.2%'],['比亚迪','4.8%'],['隆基绿能','3.1%']],sectors:[['电力设备',22],['电子',18],['食品饮料',9]],insight:'以大盘宽基为核心，近一年跑赢同类中位数，但权益仓位带来明显波动。',knowledge:'ETF 联接通过投资目标 ETF 间接跟踪指数，适合银行渠道客户。跟踪误差与折溢价是主要观察点。'},
        {id:'HS300',name:'华夏沪深300ETF联接A',code:'000051',kind:'指数型',risk:'R3',ret:'11.20%',dd:'-13.2%',sharpe:'0.92',nav:'1.5620',manager:'李哲',company:'华夏基金',years:'12 年',aum:'420 亿',tenure:'+68.5%',style:'宽基指数复制',track:'0.18%',fee:'0.50%',spark:'0,58 60,60 120,52 180,55 240,48 300,46 360,40 420,36',holdings:[['贵州茅台','5.5%'],['宁德时代','4.1%'],['招商银行','3.8%']],sectors:[['食品饮料',16],['银行',14],['电力设备',12]],insight:'覆盖两市流动性较好的大盘股，风格偏蓝筹，波动通常低于中小盘指数。',knowledge:'沪深300 是常用的权益底仓工具。费率、跟踪误差和流动性比短期收益更关键。'},
        {id:'GROW',name:'景顺鑫选成长混合A',code:'260108',kind:'混合型',risk:'R4',ret:'8.60%',dd:'-21.4%',sharpe:'0.61',nav:'2.4310',manager:'赵宁',company:'景顺示例基金',years:'15 年',aum:'268 亿',tenure:'+112.4%',style:'成长价值均衡',track:'—',fee:'1.50%',spark:'0,48 60,30 120,62 180,40 240,70 300,36 360,28 420,44',holdings:[['贵州茅台','9.2%'],['五粮液','7.1%'],['美的集团','5.4%']],sectors:[['食品饮料',31],['家用电器',16],['医药',11]],insight:'主动权益业绩主要来自基金经理选股，回撤显著高于宽基指数，适合能承受波动的客户。',knowledge:'主动基金应同时看任期回报、回撤控制和风格稳定性，不能只看近一年排名。'}
      ]
    },
    insurance:{
      ey:'INSURANCE INTELLIGENCE',title:'保险产品洞察',sub:'从保障责任、除外责任、缴费安排到理赔服务，辅助投保前咨询与保单检视。',
      tabs:['保障比较','我的保单','理赔服务','保险通识'],color:'#59a89a',
      products:[
        {id:'MED',name:'安享长期医疗',kind:'医疗险',risk:'保障',premium:'¥3,280',cover:'¥4,000,000',wait:'30 天',company:'示例健康险',insight:'医疗保障额度充足，重点关注续保条件、免赔额和既往症除外责任。'},
        {id:'CI',name:'安康多次重疾',kind:'重疾险',risk:'R3',premium:'¥8,640',cover:'¥500,000',wait:'90 天',company:'示例健康险',insight:'重疾可赔 3 次，轻症和中症分组赔付，核保与健康告知决定能否承保。'},
        {id:'ANNU',name:'岁悦养老年金',kind:'年金险',risk:'R2',premium:'¥20,000',cover:'保证领取 20 年',wait:'30 天',company:'示例养老险',insight:'交费 10 年、60 岁起领，适合教育金或养老金规划，不替代流动性安排。'}
      ]
    },
    wealth:{
      ey:'WEALTH PRODUCT',title:'理财产品洞察',sub:'区分业绩比较基准、历史收益和实际持有收益，清楚说明期限、流动性和费用。',
      tabs:['产品筛选','系列视图','理财公司','办理流程'],color:'#bc9148',
      products:[
        {id:'W180',name:'稳盈固收180天',kind:'固收',risk:'R2',ret:'3.62%',dd:'-0.42%',bench:'2.80%–4.20%',lock:'180 天',company:'示例理财子公司',insight:'适合短期内无需动用资金的稳健配置，业绩比较基准不代表预期收益。'},
        {id:'WCASH',name:'天天利现金管理',kind:'现金管理',risk:'R1',ret:'1.82%',dd:'—',bench:'1.50%–2.10%',lock:'工作日快赎',company:'示例理财子公司',insight:'作为流动性口袋，不保证本金，适合短期备用金而不是长期增值。'},
        {id:'WPLUS',name:'安盈精选固收+',kind:'固收+',risk:'R3',ret:'5.18%',dd:'-2.40%',bench:'3.00%–5.50%',lock:'12 个月',company:'示例理财子公司',insight:'用有限权益仓位增强收益，回撤高于纯固收，需要匹配持有期。'}
      ]
    },
    deposit:{
      ey:'DEPOSIT INTELLIGENCE',title:'存款产品洞察',sub:'用相同金额、币种、期限和渠道比较利率，解释计息方式与提前支取影响。',
      tabs:['利率比较','产品规则','测算工具','存款通识'],color:'#5b83c9',
      products:[
        {id:'D3Y',name:'三年期整存整取',kind:'定期',rate:'2.15%',start:'¥50,000',early:'按活期',term:'3 年',insight:'确定性较高，适合三年内不计划使用的闲置资金，提前支取会影响收益。'},
        {id:'DCD',name:'大额存单 20 万起 1 年',kind:'大额存单',rate:'1.90%',start:'¥200,000',early:'可转让 / 提前按活期',term:'1 年',insight:'利率高于普通定期，可转让是流动性补偿，起存金额更高。'},
        {id:'DST',name:'结构性存款 3 个月',kind:'结构性存款',rate:'1.50%–2.80%',start:'¥50,000',early:'原则上不可提前支取',term:'90 天',insight:'保本但收益挂钩标的，实际到手利率取决于观察期内的市场表现。'}
      ]
    },
    private:{
      ey:'PRIVATE BANK',title:'私行产品洞察',sub:'面向完成合格投资者认定、具备相应准入资格的用户展示受限产品材料。',
      tabs:['产品总览','管理人评价','材料核验','存续跟踪'],color:'#8069c4',
      products:[
        {id:'PE6',name:'远景私募精选 6 号',kind:'私募基金',term:'24 个月',start:'¥1,000,000',liq:'封闭运作',manager:'远景资本',insight:'策略为多资产量化，封闭期内流动性有限，展示前置完成合格投资者认定。'}
      ]
    }
  }[type];
  const view=viewOf()||catalog.tabs[0];
  const products=catalog.products;
  const pickId=uiOf('productId', products[0].id);
  const product=products.find(x=>x.id===pickId)||products[0];
  const interval=uiOf('interval','近一年');
  const onlySellable=uiOf('sellable','1')!=='0';
  const shown=products.filter(p=>{
    const kindFilter=uiOf('kind','全部');
    if(kindFilter!=='全部' && p.kind!==kindFilter && p.risk!==kindFilter) return false;
    return true;
  });
  const current=shown.find(x=>x.id===product.id)||shown[0]||product;
  const kinds=['全部',...Array.from(new Set(products.map(p=>p.kind)))];
  const picker=shown.map(p=>`<button type="button" class="catalog-item ${p.id===current.id?'active':''}" data-action="pick-ui" data-ui-key="productId" data-ui-value="${esc(p.id)}"><b>${esc(p.name)}</b><small>${esc(p.kind||p.risk||'')} · ${esc(p.ret||p.rate||p.premium||p.term||'')}</small></button>`).join('');

  const metrics=type==='fund'
    ? [['近一年收益',current.ret],['最大回撤',current.dd],['夏普比率',current.sharpe]]
    : type==='insurance'
      ? [['年度保费',current.premium],['保障额度',current.cover],['等待期',current.wait]]
      : type==='wealth'
        ? [['近一年收益',current.ret],['回撤',current.dd],['基准',current.bench]]
        : type==='deposit'
          ? [['挂牌年利率',current.rate],['起存金额',current.start],['提前支取',current.early]]
          : [['产品期限',current.term],['起投金额',current.start],['流动性',current.liq]];

  function overviewCard(){
    return `<div class="card"><div class="card-head"><div><h2>${esc(current.name)}</h2><p class="muted">当前板块：${esc(view)} · ${esc(current.kind||current.risk||'示例产品')} · 观察区间 ${esc(interval)} · 数据更新于 2026-09-28</p></div><div class="stars">★★★★☆</div></div><div class="grid three">${metrics.map(m=>`<div class="mini-stat"><div class="metric-label">${esc(m[0])}</div><div class="metric-value" style="font-size:21px">${esc(m[1])}</div></div>`).join('')}</div><div class="section-space">${lineChart(catalog.color,current.spark||'0,86 60,76 120,70 180,61 240,57 300,41 360,49 420,25')}</div><div class="legend"><span><i class="swatch" style="background:${catalog.color}"></i>${esc(view)}</span><span>${onlySellable?'仅我行可售':''}</span><button class="source" data-action="source-detail">数据来源：产品资料库 · 可追溯</button></div></div>`;
  }
  function insightCard(text){
    return `<div class="card"><div class="card-head"><h2>${esc(view)}说明</h2>${statusBadge('已随板块切换','green')}</div><div class="callout"><b>当前看的是「${esc(view)}」：</b>${esc(text)}</div></div>`;
  }

  let main='';
  if(type==='fund'){
    if(view==='基金概览'){
      main=overviewCard()+insightCard(current.insight)+`<div class="card"><div class="card-head"><h2>基金档案</h2>${statusBadge(current.kind,'blue')}</div><div class="stat-row"><span>基金代码</span><b>${esc(current.code)}</b></div><div class="stat-row"><span>最新净值</span><b>${esc(current.nav)}</b></div><div class="stat-row"><span>管理费</span><b>${esc(current.fee)}</b></div><div class="stat-row"><span>跟踪误差</span><b>${esc(current.track)}</b></div><div class="stat-row"><span>前三大持仓</span><b>${current.holdings.map(h=>h[0]+' '+h[1]).join(' · ')}</b></div></div>`;
    }else if(view==='基金经理'){
      main=`<div class="card"><div class="card-head"><div><h2>${esc(current.manager)}</h2><p class="muted">${esc(current.company)} · 管理 ${esc(current.name)}</p></div>${statusBadge(current.style,'blue')}</div><div class="grid three"><div class="mini-stat"><div class="metric-label">任职年限</div><div class="metric-value" style="font-size:21px">${esc(current.years)}</div></div><div class="mini-stat"><div class="metric-label">管理规模</div><div class="metric-value" style="font-size:21px">${esc(current.aum)}</div></div><div class="mini-stat"><div class="metric-label">任期回报</div><div class="metric-value" style="font-size:21px">${esc(current.tenure)}</div></div></div><div class="callout">经理视图不看单日净值，而看任职期间的回撤控制和风格是否漂移。当前风格：${esc(current.style)}。</div></div><div class="card"><div class="card-head"><h2>任职表现对照</h2></div>${barChart([['任期回报',Math.min(100,Math.abs(parseFloat(current.tenure)||40)),current.tenure],['回撤控制',current.dd==='-9.8%'?72:current.dd==='-13.2%'?58:41,current.dd],['风格稳定',current.kind==='指数型'?88:63,current.kind==='指数型'?'高':'中']])}</div>`+insightCard('基金经理页展示任职年限、规模、任期回报和风格，而不是产品近一年收益。');
    }else if(view==='行业板块'){
      main=`<div class="card"><div class="card-head"><div><h2>${esc(current.name)} · 行业暴露</h2><p class="muted">持仓按申万一级行业归并 · ${esc(interval)}</p></div>${statusBadge('板块视图','blue')}</div>${barChart(current.sectors.map(s=>[s[0],s[1],s[1]+'%']))}<div class="callout">行业板块页回答的是“钱主要暴露在哪些行业”，与基金经理页的任职信息不是同一张图。</div></div><div class="card"><div class="card-head"><h2>持仓明细</h2></div>${current.holdings.map(h=>`<div class="stat-row"><span>${esc(h[0])}</span><b>${esc(h[1])}</b></div>`).join('')}</div>`+insightCard('若单行业超过 25%，需要在对客解释里单独说明集中度，而不是只报收益率。');
    }else{
      main=`<div class="card"><div class="card-head"><h2>基金通识 · ${esc(current.kind)}</h2>${statusBadge('概念解释','blue')}</div><p>${esc(current.knowledge)}</p><div class="grid two section-space"><div class="mini-stat"><h3>看什么</h3><p class="muted">${current.kind==='指数型'?'跟踪误差、折溢价、规模和费率。':'基金经理稳定性、回撤、风格是否漂移。'}</p></div><div class="mini-stat"><h3>不看什么</h3><p class="muted">不把近一周涨跌当成选择依据，也不把历史收益当成预期收益。</p></div></div></div><div class="card"><div class="card-head"><h2>口径说明</h2></div><div class="list-row"><h3>净值与估算</h3><p class="muted">日终净值来自行情库；盘中估算不作为交易依据。</p></div><div class="list-row"><h3>回撤</h3><p class="muted">区间最大回撤按统一复权口径，与宣传材料可能不同。</p></div><div class="list-row"><h3>适当性</h3><p class="muted">${esc(current.risk)} 产品需匹配客户风险测评，系统排序不替代人工结论。</p></div></div>`+insightCard('通识页解释规则和口径，不重复展示业绩曲线。');
    }
  }else if(type==='insurance'){
    if(view==='保障比较'){
      main=`<div class="card"><div class="card-head"><h2>保障责任比较</h2><span class="muted">当前选中：${esc(current.name)}</span></div><div class="table-wrap"><table><thead><tr><th>产品</th><th>类型</th><th>保费</th><th>保额 / 领取</th><th>等待期</th></tr></thead><tbody>${products.map(p=>`<tr${p.id===current.id?' style="background:#ebf1ff"':''}><td><b>${esc(p.name)}</b></td><td>${esc(p.kind)}</td><td>${esc(p.premium)}</td><td>${esc(p.cover)}</td><td>${esc(p.wait)}</td></tr>`).join('')}</tbody></table></div></div>`+insightCard(current.insight);
    }else if(view==='我的保单'){
      main=`<div class="card"><div class="card-head"><h2>已授权保单</h2>${statusBadge('3 张','blue')}</div><div class="task-line"><span class="task-dot">${icon('shield')}</span><div class="task-text"><b>安享长期医疗</b><p>保障中 · 续保日 2026-10-12 · 年缴 ¥3,280</p></div>${statusBadge('待续保','orange')}</div><div class="task-line"><span class="task-dot">${icon('file')}</span><div class="task-text"><b>安康多次重疾</b><p>保障中 · 下次缴费 2027-03-01</p></div>${statusBadge('正常','green')}</div><div class="task-line"><span class="task-dot">${icon('clock')}</span><div class="task-text"><b>岁悦养老年金</b><p>交费期第 4/10 年 · 领取未开始</p></div>${statusBadge('交费中','blue')}</div></div>`+insightCard('我的保单页展示客户已授权合同，而不是产品宣传比较。');
    }else if(view==='理赔服务'){
      main=`<div class="card"><div class="card-head"><h2>理赔服务路径</h2>${statusBadge('需人工确认','orange')}</div><div class="timeline"><div class="timeline-item"><span class="step-circle done">${icon('check')}</span><div class="step-copy"><b>报案</b><p>客户或家属提交出险信息，系统只记录不审核。</p></div></div><div class="timeline-item"><span class="step-circle current">2</span><div class="step-copy"><b>材料齐备</b><p>病历、发票、身份证明；缺失项由保司清单确认。</p></div></div><div class="timeline-item"><span class="step-circle">3</span><div class="step-copy"><b>核赔结论</b><p>是否赔付以保险合同和保司审核为准。</p></div></div></div></div>`+insightCard('理赔服务页只说明路径和待办，不展示收益率，也不替代保司核赔。');
    }else{
      main=`<div class="card"><div class="card-head"><h2>保险通识</h2></div><div class="list-row"><h3>等待期</h3><p class="muted">等待期内出险通常不赔，当前产品等待期 ${esc(current.wait)}。</p></div><div class="list-row"><h3>健康告知</h3><p class="muted">未如实告知可能导致拒赔，系统不能代替核保问卷。</p></div><div class="list-row"><h3>续保与减保</h3><p class="muted">长期医疗关注续保条件；增额寿和年金关注减保规则。</p></div></div>`+insightCard('通识页解释条款概念，便于客户经理用同一口径对客解释。');
    }
  }else if(type==='wealth'){
    if(view==='产品筛选'){
      main=overviewCard()+`<div class="card"><div class="card-head"><h2>筛选结果</h2><span class="muted">${shown.length} 只 · ${esc(interval)}</span></div><div class="table-wrap"><table><thead><tr><th>产品</th><th>类型</th><th>近一年</th><th>回撤</th><th>持有期</th></tr></thead><tbody>${shown.map(p=>`<tr${p.id===current.id?' style="background:#ebf1ff"':''}><td><b>${esc(p.name)}</b></td><td>${esc(p.kind)}</td><td>${esc(p.ret)}</td><td>${esc(p.dd)}</td><td>${esc(p.lock)}</td></tr>`).join('')}</tbody></table></div></div>`+insightCard(current.insight);
    }else if(view==='系列视图'){
      main=`<div class="card"><div class="card-head"><h2>产品系列</h2><p class="muted">按策略系列而不是单只产品看仓位与角色</p></div><div class="grid three"><div class="mini-stat"><h3>现金管理系列</h3><p class="muted">天天利 · T+0 / T+1 · 不保证本金</p></div><div class="mini-stat"><h3>固收系列</h3><p class="muted">稳盈 180 天 · 票息为主</p></div><div class="mini-stat"><h3>固收+系列</h3><p class="muted">安盈精选 · 0–15% 权益增强</p></div></div></div>`+insightCard('系列视图解释产品家族定位，避免把现金管理、固收和固收+混成同一张业绩图。');
    }else if(view==='理财公司'){
      main=`<div class="card"><div class="card-head"><h2>${esc(current.company||'示例理财子公司')}</h2>${statusBadge('管理人','blue')}</div><div class="stat-row"><span>注册资本</span><b>50 亿元</b></div><div class="stat-row"><span>在管规模</span><b>1,280 亿</b></div><div class="stat-row"><span>固收团队从业</span><b>平均 11 年</b></div><div class="stat-row"><span>最近一次审计</span><b>2026-06-30</b></div></div>`+insightCard('理财公司页看的是管理人能力和治理，而不是单只产品近一年收益。');
    }else{
      main=`<div class="card"><div class="card-head"><h2>办理流程</h2></div><div class="timeline"><div class="timeline-item"><span class="step-circle done">${icon('check')}</span><div class="step-copy"><b>适当性匹配</b><p>风险等级、投资期限与 ${esc(current.lock)} 持有期核对。</p></div></div><div class="timeline-item"><span class="step-circle current">2</span><div class="step-copy"><b>阅读材料</b><p>说明书、风险揭示书、业绩比较基准说明。</p></div></div><div class="timeline-item"><span class="step-circle">3</span><div class="step-copy"><b>下单与确认</b><p>以业务系统确认结果为准，原型不发起真实交易。</p></div></div></div></div>`+insightCard('办理流程页给出动作顺序，不重复展示净值曲线。');
    }
  }else if(type==='deposit'){
    if(view==='利率比较'){
      main=`<div class="card"><div class="card-head"><h2>同金额利率比较</h2><span class="muted">示例本金 ¥500,000 · ${esc(interval)}</span></div><div class="table-wrap"><table><thead><tr><th>产品</th><th>期限</th><th>年利率</th><th>起存</th><th>提前支取</th></tr></thead><tbody>${products.map(p=>`<tr${p.id===current.id?' style="background:#ebf1ff"':''}><td><b>${esc(p.name)}</b></td><td>${esc(p.term)}</td><td>${esc(p.rate)}</td><td>${esc(p.start)}</td><td>${esc(p.early)}</td></tr>`).join('')}</tbody></table></div></div>`+insightCard(current.insight);
    }else if(view==='产品规则'){
      main=`<div class="card"><div class="card-head"><h2>${esc(current.name)} · 规则</h2></div><div class="stat-row"><span>计息方式</span><b>${current.kind==='结构性存款'?'挂钩观察 + 保底':'单利 / 到期还本付息'}</b></div><div class="stat-row"><span>起存金额</span><b>${esc(current.start)}</b></div><div class="stat-row"><span>提前支取</span><b>${esc(current.early)}</b></div><div class="stat-row"><span>是否可转让</span><b>${current.kind==='大额存单'?'可转让':'一般不可转让'}</b></div></div>`+insightCard('产品规则页解释计息、支取和转让，而不是再画一条收益曲线。');
    }else if(view==='测算工具'){
      const principal=500000;
      const years=current.kind==='定期'?3:current.kind==='大额存单'?1:0.25;
      const rate=current.kind==='结构性存款'?0.021:parseFloat(current.rate)/100;
      const interest=Math.round(principal*rate*years);
      main=`<div class="card"><div class="card-head"><h2>到期本息测算</h2><span class="muted">${esc(current.name)}</span></div><div class="metric-label">示例本金 ¥500,000</div><div class="metric-value">¥${(principal+interest).toLocaleString('zh-CN')}</div><p class="muted">预计利息 ¥${interest.toLocaleString('zh-CN')} · 按演示利率 ${esc(current.rate)} 计算</p><div class="callout warn">结构性存款实际收益取决于挂钩标的；提前支取通常按活期。测算不构成要约。</div></div>`+insightCard('测算工具页给出本息示例，并随所选产品切换利率和期限。');
    }else{
      main=`<div class="card"><div class="card-head"><h2>存款通识</h2></div><div class="list-row"><h3>挂牌利率与到账利息</h3><p class="muted">挂牌利率不等于实际到账，需扣税或按计息规则折算。</p></div><div class="list-row"><h3>提前支取</h3><p class="muted">多数定期提前支取按活期，会显著降低收益。</p></div><div class="list-row"><h3>结构性存款</h3><p class="muted">保本不保证收益，观察期内市场波动会影响最终利率。</p></div></div>`+insightCard('通识页解释概念，避免把结构性存款和普通定期混为一谈。');
    }
  }else{
    if(view==='产品总览'){
      main=overviewCard()+insightCard(current.insight);
    }else if(view==='管理人评价'){
      main=`<div class="card"><div class="card-head"><h2>${esc(current.manager||'管理人')}</h2>${statusBadge('尽调摘要','orange')}</div><div class="stat-row"><span>策略类型</span><b>多资产量化</b></div><div class="stat-row"><span>核心人员稳定性</span><b>近 3 年无关键离职</b></div><div class="stat-row"><span>运营外包</span><b>托管行已披露</b></div></div>`+insightCard('管理人评价页展示尽调摘要，不展示对客营销话术。');
    }else if(view==='材料核验'){
      main=`<div class="card"><div class="card-head"><h2>材料核验清单</h2></div><div class="task-line"><span class="step-circle done">${icon('check')}</span><div class="task-text"><b>募集说明书</b><p>已审核 · 2026-08-31</p></div></div><div class="task-line"><span class="step-circle current">2</span><div class="task-text"><b>合格投资者证明</b><p>待客户补充资产证明</p></div></div><div class="task-line"><span class="step-circle">3</span><div class="task-text"><b>双录与揭示</b><p>未开始</p></div></div></div>`+insightCard('材料核验页跟踪准入文件，未完成认定前不展示完整底层资产。');
    }else{
      main=`<div class="card"><div class="card-head"><h2>存续跟踪</h2></div><div class="stat-row"><span>净值披露</span><b>每周</b></div><div class="stat-row"><span>最近一次披露</span><b>2026-09-26</b></div><div class="stat-row"><span>开放安排</span><b>封闭运作，到期一次性</b></div></div>`+insightCard('存续跟踪页关注披露和开放安排，而不是销售比较。');
    }
  }

  const aside=`<aside class="stack"><div class="card"><div class="card-head"><h2>筛选条件</h2><button class="link-btn" data-action="reset-insight">重置</button></div><label>产品类型<select data-ui-change="kind">${kinds.map(k=>`<option${k===uiOf('kind','全部')?' selected':''}>${esc(k)}</option>`).join('')}</select></label><label class="section-space">观察区间<select data-ui-change="interval">${['近一年','近三年','成立以来'].map(k=>`<option${k===interval?' selected':''}>${esc(k)}</option>`).join('')}</select></label><label class="check section-space"><input type="checkbox" data-ui-check="sellable" ${onlySellable?'checked':''}/>只看我行可售产品</label><p class="muted">筛选会立刻改写当前板块内容，不跳出页面。</p></div><div class="card"><div class="card-head"><h2>当前可切换产品</h2><span class="muted">${shown.length}</span></div><div class="catalog-grid" style="grid-template-columns:1fr">${picker||'<p class="muted">当前筛选无产品</p>'}</div></div><div class="card"><div class="card-head"><h2>相关材料</h2></div><div class="list-row"><h3>${icon('file')} ${esc(view)}材料</h3><p class="muted">随板块切换 · 2026-09-28</p></div><div class="list-row"><h3>${icon('shield')} 风险揭示书</h3><p class="muted">版本 3.2 · 强制阅读</p></div></div></aside>`;
  return pageHeading(catalog.ey,catalog.title,catalog.sub,btn('保存到工作区','save','')+btn('生成一页纸','onepager','primary'))+`<div class="tabs" data-tabs="product">${catalog.tabs.map(x=>`<button type="button" class="tab ${view===x?'active':''}" data-view="${esc(x)}">${x}</button>`).join('')}</div><div class="insight-banner"><span class="insight-kicker">${esc(view)}</span><div><b>${esc(current.name)}</b><p class="muted" style="margin:4px 0 0">当前板块是「${esc(view)}」，下方主体按该板块重新生成，不是同一张业绩图换标题。</p></div></div><div class="grid main-aside"><div class="stack">${main}</div>${aside}</div>`;
}

function pageCandidates(){
  const s=session();
  const g=s.goal||sessionApi()?.DEFAULT_GOAL||{};
  const ids=candidateIds();
  const view=viewOf()||'综合排序';
  const ordered=ids.slice().sort((a,b)=>{
    const pa=productOf(a)||{}, pb=productOf(b)||{};
    if(view==='收益优先') return (parseFloat(pb.ret)||0) - (parseFloat(pa.ret)||0);
    if(view==='流动性优先') return String(pa.liquidity||'').localeCompare(String(pb.liquidity||''));
    return (parseFloat(pb.match)||0) - (parseFloat(pa.match)||0);
  });
  const rows=ordered.map(id=>{
    const p=productOf(id)||{};
    return `<tr><td><b>${esc(p.name||id)}</b><br><span class="muted">${esc(p.detail||p.type||'')}</span></td><td>${esc(p.role||'')}</td><td>${esc(p.ret||'')}</td><td>${esc(p.drawdown||'—')}</td><td>${statusBadge(p.match||'—','green')}</td><td><button class="btn small" data-action="m-candidate-reason" data-product="${esc(id)}">解释</button></td></tr>`;
  }).join('');
  return pageHeading('CANDIDATE POOL','候选产品池','把客户金额、期限、风险、流动性和资金用途转成结构化条件，再从我行可售范围内排序。',btn('打开比较','go-pc-compare','')+btn('生成候选池','generate-candidates','primary'))+`<div class="card"><div class="form-grid three"><label>资金金额<input value="${esc(g.amount||'¥500,000')}"/></label><label>投资期限<select><option>${esc(g.term||'3–5 年')}</option></select></label><label>风险等级<select><option>${esc(g.risk||'R3 平衡型')}</option></select></label><label>流动性需求<select><option>${esc(g.liquidity||'大部分可长期投资')}</option></select></label><label>资金用途<select><option>${esc(g.purpose||'教育金储备')}</option></select></label><label>产品偏好<select><option>不限</option></select></label></div><div class="between section-space"><span class="muted">已校验：${esc(goalText())} · 区域：上海 · 渠道：手机银行</span>${btn('同步林女士方案','generate-candidates','primary')}</div></div><div class="grid main-aside section-space"><div class="card"><div class="card-head"><div><h2>为林女士找到 ${ids.length} 个候选</h2><p class="muted">${s.researchAnswer?'已关联投研问答来源 · ':''}按“组合角色 + 适配前提 + 风险”排序</p></div><div class="segment">${['综合排序','收益优先','流动性优先'].map(x=>tabBtn(x,'综合排序')).join('')}</div></div><div class="table-wrap"><table><thead><tr><th>产品</th><th>组合作用</th><th>近一年</th><th>最大回撤</th><th>适配度</th><th>动作</th></tr></thead><tbody>${rows||'<tr><td colspan="6">尚未生成候选。请先在资产配置页生成方案，再生成真实候选。</td></tr>'}</tbody></table></div></div><aside class="stack"><div class="card"><div class="card-head"><h2>筛选解释</h2>${statusBadge('可核验','green')}</div><div class="attention"><span class="attention-icon">${icon('check')}</span><div><h4>候选排序不替代适当性结论</h4><p>排序只代表模型对输入条件的匹配程度，最终由客户经理确认。</p></div></div>${s.researchAnswer?`<div class="callout">研究依据：${esc((s.researchAnswer.sources||[]).join(' · '))}</div>`:''}<div class="divider"></div><h3>替代方向</h3><p class="muted">如果客户需要 3 个月内可用资金，可将固收底仓切换为现金管理类产品。</p></div></aside></div>`;
}

function pageCompare(){
  const s=session();
  const ids=compareIds();
  const cols=ids.map(id=>productOf(id)).filter(Boolean);
  if(!cols.length){
    return pageHeading('COMPARISON','产品横向比较','比较集为空。请先在已生成的候选产品中加入 2–3 个真实产品。',btn('返回候选池','go-pc-candidates','primary'))+`<div class="card"><div class="callout warn">当前没有可比较的产品，系统不会自动补入默认候选。</div></div>`;
  }
  const head=`<tr><th>指标</th>${cols.map(p=>`<th>${esc(p.short||p.name)}</th>`).join('')}</tr>`;
  const row=(label,key)=>`<tr><td>${label}</td>${cols.map(p=>`<td>${esc(p[key]||'—')}</td>`).join('')}</tr>`;
  const view=viewOf()||'表现';
  const body={
    表现:[row('产品类型','detail'),row('区间收益','ret'),row('适合角色','role')],
    风险:[row('最大回撤','drawdown'),row('风险等级','risk')],
    流动性:[row('流动性','liquidity'),row('产品类型','type')],
    费用:[row('费用','fee'),row('适合角色','role')]
  }[view]||[];
  return pageHeading('COMPARISON','产品横向比较','在同一时间区间、同一指标口径下比较收益、回撤、波动、费用、期限和组合角色。',btn('同步林女士比较集','sync-compare','')+btn('保存比较','save-pc-compare','primary'))+`<div class="card"><div class="between"><div class="row wrap"><span class="badge blue">${cols.length} 个产品</span><span class="muted">观察区间：2025-09-28 至 ${esc(s.asOf||'2026-09-28')} · ${esc(goalText())}</span></div><div class="segment">${['表现','风险','流动性','费用'].map(x=>tabBtn(x,'表现')).join('')}</div></div><div class="table-wrap section-space"><table><thead>${head}</thead><tbody>${body.join('')}</tbody></table></div><div class="callout warn"><b>比较结论：</b>当前视图 ${esc(view)}。历史收益不能直接横向替代风险判断。收益更高的产品，回撤和波动通常也更高。业绩比较基准不代表预期收益。${s.compareSaved?' 比较结果已保存。':''}</div></div>`;
}

function pageResearch(){
  const s=session();
  const ans=s.researchAnswer || {question:'',text:'尚未发起真实研究任务。输入问题后，系统会先检索授权知识，再调用AI 生成。',sources:[]};
  const generated=!!s.researchAnswer;
  return pageHeading('RESEARCH DESK','智能问答与深度研究','支持问题澄清、知识库检索、复杂分析与多步骤研究；回答展示来源、数据时点和不确定事项。',btn('研究计划','research-plan','')+btn('查看候选解释','go-pc-candidates','primary'))+`<div class="grid main-aside"><div class="stack"><div class="card"><div class="card-head"><div><h2>问小财</h2><p class="muted">当前检索范围：行内知识库 · 市场数据 · 公开权威信息</p></div>${statusBadge(generated?'已生成':'待发起',generated?'blue':'orange')}</div><div class="prompt-box"><textarea id="researchPrompt" placeholder="例如：美联储降息对黄金和固收+产品可能有什么影响？">${esc(ans.question||'')}</textarea><div class="prompt-footer"><span class="muted">${icon('shield')} 复杂问题会先拆解研究步骤</span>${btn('开始研究','ask','primary')}</div></div><div class="prompt-quick"><button data-action="quick-prompt">解读今天的宏观重点</button><button data-action="quick-prompt">比较新能源和红利板块</button><button data-action="quick-prompt">阅读一份研报</button></div></div><div class="card"><div class="card-head"><h2>${generated?'本次回答':'等待AI 生成'}</h2><span class="muted">数据时点 ${esc(s.asOfFull||'2026-09-28 09:30')}</span></div>${generated?`<div class="chat-bubble"><div class="chat-name">${icon('spark')} 财富智服 · 研究回答</div><p><b>问题：</b>${esc(ans.question)}</p><p>${esc(ans.text)}</p><div class="chips">${(ans.sources||[]).map((x,i)=>`<button class="source" data-action="source-detail">[${i+1}] ${esc(x)}</button>`).join('')}</div></div><div class="callout warn">以下内容为研究参考，不构成投资建议。</div>`:`<div class="callout">${esc(ans.text)}</div>`}</div></div><aside class="stack"><div class="card"><div class="card-head"><h2>研究步骤</h2>${statusBadge(generated?'已完成':'待发起',generated?'green':'orange')}</div><div class="timeline"><div class="timeline-item"><span class="step-circle done">${icon('check')}</span><div class="step-copy"><b>问题理解</b><p>抽取关键词并澄清范围</p></div></div><div class="timeline-item"><span class="step-circle done">${icon('check')}</span><div class="step-copy"><b>证据检索</b><p>召回不少于 2 条授权资料</p></div></div><div class="timeline-item"><span class="step-circle current">3</span><div class="step-copy"><b>形成分析</b><p>事实、观点、推断分开表达</p></div></div></div></div><div class="card"><div class="card-head"><h2>研究设置</h2></div><label class="check"><input type="checkbox" data-ui-check="reviewed" ${uiOf('reviewed','1')!=='0'?'checked':''}/>只引用已审核资料</label><label class="check"><input type="checkbox" data-ui-check="uncertain" ${uiOf('uncertain','1')!=='0'?'checked':''}/>显示不确定事项</label><label class="check"><input type="checkbox" data-ui-check="public" ${uiOf('public','0')==='1'?'checked':''}/>交叉验证公开信息</label><p class="muted">当前：${uiOf('reviewed','1')!=='0'?'仅已审核资料':'含未审核草稿'} · ${uiOf('uncertain','1')!=='0'?'显示不确定事项':'隐藏不确定事项'} · ${uiOf('public','0')==='1'?'交叉验证公开信息':'不引用公开网页'}。</p></div></aside></div>`;
}

function researchPage(type){
  const data={events:['EVENT RADAR','市场事件解读','聚合跨行业、跨市场资讯，区分事实、机构观点和模型推断。'],macro:['MACRO DESK','宏观分析','观察增长、通胀、就业、货币、财政与房地产指标，并关联资产影响。'],industry:['INDUSTRY VIEW','行业解读','汇总行情、估值、景气度、政策事件和机构观点，生成可验证的行业视图。']}[type];
  const view=viewOf()||'今日';
  const packs={
    events:{
      '今日':[
        ['央行公开市场操作净投放 1,200 亿元','事实 · 影响短端利率、银行理财','高关注','orange','bolt'],
        ['新能源汽车 8 月出口数据发布','事件摘要、产业链传导与历史对照已生成','已解读','green','file'],
        ['美债收益率曲线出现阶段性陡峭化','模型推断 · 需要结合通胀数据进一步验证','待验证','red','chart']
      ],
      '本周':[
        ['PMI 重回扩张区间','事实 · 已发布 50.3，关注持续性','已解读','green','chart'],
        ['理财子公司披露季报','机构观点 · 固收+回撤中枢下移','观察','blue','file'],
        ['北向资金累计净流入放缓','待验证 · 与汇率和风险偏好对照','待验证','red','bolt']
      ],
      '自定义':[
        ['自选：降息交易是否拥挤','推断 · 需补充实际利率和黄金持仓','待验证','red','spark'],
        ['自选：银行理财破净比例','事实 · 演示数据截至 2026-09-21','观察','blue','chart']
      ]
    },
    macro:{
      '今日':[['CPI 同比','0.8%','前值 0.7% · 预期 0.9%'],['10Y 国债','2.18%','日变动 -3bp'],['PMI','50.3','前值 49.8 · 重回扩张']],
      '本周':[['社融存量同比','8.1%','前值 8.2%'],['MLF 利率','2.00%','持平'],['人民币中间价','7.12','波动收敛']],
      '自定义':[['实际利率','1.38%','10Y - CPI'],['财政进度','72%','预算内支出'],['地产销售','-6.4%','30 城周度']]
    },
    industry:{
      '今日':{title:'电力设备',ret:'+12.6%',bars:[['估值分位',68,'68%'],['景气度',74,'74%'],['资金流入',56,'+56亿'],['机构关注',82,'82%']],drive:'政策支持、海外需求、产业链库存周期。',risk:'盈利兑现、竞争格局和原材料价格。'},
      '本周':{title:'银行',ret:'+4.2%',bars:[['估值分位',32,'32%'],['景气度',61,'61%'],['资金流入',22,'+22亿'],['机构关注',70,'70%']],drive:'净息差企稳预期、分红稳定性。',risk:'资产质量与地产敞口仍需验证。'},
      '自定义':{title:'医药',ret:'-2.8%',bars:[['估值分位',44,'44%'],['景气度',48,'48%'],['资金流入',12,'-8亿'],['机构关注',55,'55%']],drive:'创新药催化与集采出清。',risk:'政策节奏和临床数据不确定性。'}
    }
  };
  let body='';
  if(type==='events'){
    const rows=packs.events[view]||packs.events['今日'];
    body=`<div class="attention-list">${rows.map(r=>`<div class="attention"><span class="attention-icon">${icon(r[4])}</span><div><h4>${esc(r[0])}</h4><p>${esc(r[1])}</p></div>${statusBadge(r[2],r[3])}</div>`).join('')}</div>`;
  }else if(type==='macro'){
    const rows=packs.macro[view]||packs.macro['今日'];
    body=`<div class="grid three">${rows.map(r=>metric(r[0],r[1],r[2],'chart','text-blue')).join('')}</div><div class="section-space">${lineChart('#5c84d8',view==='今日'?'0,88 60,80 120,82 180,62 240,68 300,51 360,48 420,29':view==='本周'?'0,70 60,66 120,60 180,58 240,55 300,50 360,46 420,40':'0,82 60,74 120,76 180,68 240,62 300,58 360,50 420,44')}</div><div class="callout">当前时间窗：${esc(view)}。结论随窗口切换，数据来源和发布时间已在每项指标中记录。</div>`;
  }else{
    const ind=packs.industry[view]||packs.industry['今日'];
    body=`<div class="grid two"><div><div class="metric-label">${esc(ind.title)}近一年表现</div><div class="metric-value ${ind.ret.startsWith('-')?'negative':'positive'}">${esc(ind.ret)}</div>${lineChart('#58a99d')}</div><div>${barChart(ind.bars)}</div></div><div class="divider"></div><div class="grid two"><div><h3>核心驱动因素</h3><p class="muted">${esc(ind.drive)}</p></div><div><h3>待验证事项</h3><p class="muted">${esc(ind.risk)}</p></div></div>`;
  }
  return pageHeading(data[0],data[1],data[2],btn('订阅提醒','subscribe','')+btn('生成简报','brief','primary'))+`<div class="grid main-aside"><div class="stack"><div class="card"><div class="card-head"><div><h2>${type==='events'?'重点事件':type==='macro'?'宏观指标看板':'行业研究视图'} · ${esc(view)}</h2><p class="muted">数据更新于 2026-09-28 09:00 · 切换时间窗会替换正文</p></div><div class="segment">${['今日','本周','自定义'].map(x=>tabBtn(x,'今日')).join('')}</div></div>${body}</div><div class="card"><div class="card-head"><h2>${type==='events'?'事件线索':'重点观察'}</h2>${statusBadge(view,'blue')}</div>${['政策与宏观','资产价格','行业景气','机构观点'].map((x,i)=>`<div class="list-row"><h3>${x}</h3><p class="muted">${(view==='今日'?['影响路径已关联 8 个产品','新增 2 条数据异动','3 个行业需要复核','已汇总 15 篇研报']:view==='本周'?['本周新增 3 条政策线索','波动率回落','景气分化加大','机构观点 22 篇']:['自选组合 4 条','待补充数据源','行业对照未完成','需人工确认'])[i]}</p></div>`).join('')}</div></div><aside class="stack"><div class="card"><div class="card-head"><h2>研究口径</h2>${statusBadge('透明','green')}</div><label>数据范围<select data-ui-change="scope"><option${uiOf('scope','行内授权 + 公开信息')==='行内授权 + 公开信息'?' selected':''}>行内授权 + 公开信息</option><option${uiOf('scope')==='仅行内授权'?' selected':''}>仅行内授权</option></select></label><label class="section-space">输出粒度<select data-ui-change="grain"><option${uiOf('grain','一页纸')==='一页纸'?' selected':''}>一页纸</option><option${uiOf('grain')==='深度报告'?' selected':''}>深度报告</option></select></label><label class="check section-space"><input type="checkbox" data-ui-check="infer" ${uiOf('infer','1')!=='0'?'checked':''}/>标出模型推断</label><p class="muted">当前口径：${esc(uiOf('scope','行内授权 + 公开信息'))} · ${esc(uiOf('grain','一页纸'))} · ${uiOf('infer','1')!=='0'?'已标出推断':'不展示推断'}。</p></div><div class="card"><div class="card-head"><h2>宏观日历</h2></div><div class="timeline"><div class="timeline-item"><span class="step-circle current">28</span><div class="step-copy"><b>中国 PMI</b><p>09:30 · 已发布 50.3</p></div></div><div class="timeline-item"><span class="step-circle">30</span><div class="step-copy"><b>美国 PCE</b><p>20:30 · 市场预期 2.6%</p></div></div></div></div></aside></div>`;
}

function pageSupply(){
  const view=viewOf()||'全部';
  const rows=[['宏观早报 2026-09-28','资讯研究','研究院·宏观组','当日','已审核','配置 / 问答'],['固收+策略月报','策略研究','资产配置组','2026-10-25','已审核','选品 / 复盘'],['新能源行业速报','行业研究','行业研究组','2026-10-02','待复核','行业解读'],['A500产品评述','产品研究','基金产品组','2026-12-31','已审核','诊基 / 投顾']].filter(r=>view==='全部'||r[1].includes(view));
  return pageHeading('RESEARCH SUPPLY','投研与策略供给','把财经早报、宏观简报、行业观点、策略研究和产品主体研究沉淀为可调用的已审核供给。',btn('新建研究供给','new-supply','primary'))+`<div class="grid four">${metric('今日资讯','286','去重后新增 42 条','bolt','text-blue')}${metric('已审核观点','1,248','本周新增 36 条','check','positive')}${metric('策略信号','18','8 条需要验证','chart','text-blue')}${metric('可调用供给','3,620','关联 428 个产品','book','text-blue')}</div><div class="grid main-aside section-space"><div class="card"><div class="card-head"><div><h2>供给目录</h2><p class="muted">当前视图：${esc(view)}</p></div><div class="segment">${['全部','资讯','策略','产品研究'].map(x=>tabBtn(x,'全部')).join('')}</div></div><div class="table-wrap"><table><thead><tr><th>供给名称</th><th>类型</th><th>来源</th><th>有效期</th><th>审核</th><th>可调用场景</th></tr></thead><tbody>${rows.map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${statusBadge(r[4],r[4]==='已审核'?'green':'orange')}</td><td>${r[5]}</td></tr>`).join('')||'<tr><td colspan="6">当前分类暂无供给</td></tr>'}</tbody></table></div></div><aside class="stack"><div class="card"><div class="card-head"><h2>观点调用规则</h2>${statusBadge('已启用','green')}</div><div class="stat-row"><span>适用角色</span><b>投研 · 投顾 · 产品</b></div><div class="stat-row"><span>必备字段</span><b>来源 · 时点 · 作者</b></div><div class="stat-row"><span>观点失效</span><b>到期自动下线</b></div><div class="callout">调用时会同时带出来源、适用范围和审核状态，避免只返回脱离上下文的结论。</div></div><div class="card"><div class="card-head"><h2>待处理</h2>${statusBadge('3 条','orange')}</div><div class="list-row"><h3>新能源速报待复核</h3><p class="muted">事实与机构观点需要拆分</p></div><div class="list-row"><h3>策略观点待验证</h3><p class="muted">等待 9 月数据发布</p></div></div></aside></div>`;
}

function pageLibrary(){
  const view=viewOf()||'全部产品';
  const all=[['易方达中证A500联接A','基金 · R3 · 权益','大盘宽基，适合长期增长配置','2026-09-26','v2.4','已发布','基金'],['稳盈固收180天','理财 · R2 · 固收','持有期明确，适合稳健底仓','2026-09-25','v1.8','已发布','理财'],['安享长期医疗','保险 · 保障','关注续保条件和既往症责任','2026-09-20','v1.2','待审核','保险'],['安心定期3年','存款 · R1 · 确定性','闲置资金的确定性收益工具','2026-09-18','v3.0','已发布','存款'],['A500 产品评述','观点资产 · 基金','宽基配置解释材料','2026-09-26','v1.0','已发布','观点资产']];
  const rows=all.filter(r=>view==='全部产品'||r[6]===view||r[1].includes(view.replace('产品','')));
  return pageHeading('PRODUCT KNOWLEDGE','产品智库','统一维护准入产品、说明书、净值数据和已审核观点，支持调用、失效和版本追溯。','')+`<div class="grid four">${metric('产品卡片','2,436','基金 1,280 · 理财 640','book','text-blue')}${metric('已审核观点','486','本月更新 42 条','check','positive')}${metric('待失效','18','需要产品经理处理','clock','text-blue')}${metric('调用次数','6,192','较上月 +8.4%','chart','text-blue')}</div><div class="card section-space"><div class="between"><div class="tabs" data-tabs="library">${['全部产品','基金','理财','保险','观点资产'].map(x=>`<button type="button" class="tab ${view===x?'active':''}" data-view="${x}">${x}</button>`).join('')}</div><div class="row"><input placeholder="搜索产品名称或代码"/><button class="icon-btn">${icon('filter')}</button></div></div><div class="insight-banner" style="margin:12px 0"><span class="insight-kicker">${esc(view)}</span><p class="muted" style="margin:0">当前分类「${esc(view)}」，下方产品清单已替换。</p></div><div class="table-wrap"><table><thead><tr><th>产品</th><th>产品特征</th><th>一句话评述</th><th>更新日期</th><th>版本</th><th>状态</th></tr></thead><tbody>${rows.map(r=>`<tr><td><b>${r[0]}</b><br><span class="muted">${r[1]}</span></td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td><td>${statusBadge(r[5],r[5]==='已发布'?'green':'orange')}</td></tr>`).join('')||'<tr><td colspan="6">当前分类暂无产品</td></tr>'}</tbody></table></div></div>`;
}

function pageReader(){
  const chapters=[
    {id:'结论摘要',pages:'3–5 页',title:'三季度权益市场：盈利修复与结构分化',body:'本报告从宏观环境、盈利预期和资金面三个维度，分析三季度权益市场的主要驱动因素。模型已提取 26 个关键观点、18 组数据和 7 张图表。',quote:'盈利预期边际改善，但行业间分化仍然显著。建议关注现金流和竞争格局，不以单一估值指标作出结论。',stats:[['盈利预期上调','+3.4%'],['北向资金','+126 亿'],['估值分位','58%']]},
    {id:'宏观环境',pages:'6–10 页',title:'宏观环境：政策预期与基本面验证',body:'增长动能温和修复，通胀整体温和。货币条件对权益的支持取决于实际利率，而不是单一降息交易。',quote:'宏观结论需要与高频数据和财政节奏交叉验证，避免把政策预期直接写成投资建议。',stats:[['CPI','0.8%'],['PMI','50.3'],['10Y','2.18%']]},
    {id:'盈利预期',pages:'11–16 页',title:'盈利预期：上修集中在龙头',body:'一致预期上修主要来自出口链和部分消费龙头，中小盘盈利仍不稳定。',quote:'盈利上修不等于指数上修，结构比总量更重要。',stats:[['上修行业','6 个'],['下修行业','4 个'],['中位数 ROE','11.2%']]},
    {id:'行业比较',pages:'17–24 页',title:'行业比较：景气与估值错位',body:'电力设备景气高但估值不便宜；银行估值低但对净息差更敏感。比较必须同时给出景气、估值和资金。',quote:'不要用单一近一年涨幅排序行业。',stats:[['景气领先','电力设备'],['估值低位','银行'],['分歧最大','医药']]},
    {id:'风险提示',pages:'25–28 页',title:'风险提示与待验证事项',body:'海外利率、汇率和国内地产销售仍是主要扰动。图表文字置信度不足的页面已标出。',quote:'第 19 页图表文字置信度 82%，引用前请打开原图确认。',stats:[['高风险项','1'],['待核验图','2'],['引用阈值','>=2']]}
  ];
  const currentId=uiOf('chapter', chapters[0].id);
  const ch=chapters.find(x=>x.id===currentId)||chapters[0];
  return pageHeading('DOCUMENT READER','研究报告智能阅读','全文检索、章节解读、观点与数据提取，引用可定位到页码和原文位置。',btn('上传文档','upload','primary')+btn('我的研究空间','workspace',''))+`<div class="grid main-aside"><div class="paper"><div class="doc-meta between"><span>《中国权益市场月度策略》 · ${esc(ch.id)} · 2026-09-25</span>${statusBadge('已解析 98%','green')}</div><h2>${esc(ch.title)}</h2><p>${esc(ch.body)}</p><blockquote><b>AI 摘要：</b>${esc(ch.quote)}</blockquote><h3>${esc(ch.id)}</h3><div class="grid three">${ch.stats.map(s=>`<div class="mini-stat"><small class="muted">${esc(s[0])}</small><h3>${esc(s[1])}</h3></div>`).join('')}</div><p class="page-no">${esc(ch.pages)} / 共 28 页 · <button class="link-btn" data-action="source-detail">查看原文定位</button></p></div><aside class="stack"><div class="card"><div class="card-head"><h2>文档操作</h2></div>${btn('生成摘要','summary','light full')}${btn('提取关键数据','extract','full')}${btn('加入研究空间','save','full')}</div><div class="card"><div class="card-head"><h2>章节导航</h2><span class="muted">点击切换正文</span></div><div class="chapter-nav">${chapters.map((x,i)=>`<button type="button" class="list-row ${x.id===ch.id?'active':''}" data-action="pick-ui" data-ui-key="chapter" data-ui-value="${esc(x.id)}"><h3>${i+1}. ${esc(x.id)}</h3><p class="muted">${esc(x.pages)}</p></button>`).join('')}</div></div><div class="card"><div class="card-head"><h2>识别提示</h2>${statusBadge(ch.id==='风险提示'?'需人工核验':'已定位','orange')}</div><p class="muted">当前章节：${esc(ch.id)}。引用前请核对原文页码。</p></div></aside></div>`;
}

function pageWriting(){
  const kinds={
    '定时写作':{task:'宏观周报',desc:'宏观日报 · 市场周报 · 固收日报',plan:'已确认 5 个研究问题',outline:'6 个章节 · 12 条引用',qc:[['数据','18/18','green'],['事实','26/28','orange'],['逻辑','已通过','green'],['风格','待终稿','blue'],['合规','待审核','orange']]},
    '结构化一页纸':{task:'行业一页纸 · 电力设备',desc:'公司 · 行业 · 政策稳定框架',plan:'对象 / 假设 / 结论 已填',outline:'4 段结构 · 6 条引用',qc:[['数据','8/8','green'],['事实','9/9','green'],['逻辑','待确认','orange'],['风格','已套用','blue'],['合规','待审核','orange']]},
    '深度研究':{task:'开放课题 · 降息交易拥挤度',desc:'开放问题 · 长任务 · 多章节协同',plan:'研究问题拆成 8 步',outline:'待生成 · 需要更多证据',qc:[['数据','4/12','orange'],['事实','6/20','orange'],['逻辑','未开始','blue'],['风格','未开始','blue'],['合规','未开始','blue']]}
  };
  const kind=uiOf('writingKind','定时写作');
  const cur=kinds[kind]||kinds['定时写作'];
  return pageHeading('AI WRITING','智能写作','从研究计划到证据检索、章节审阅和终稿审核，让写作过程可回看、可校验。',btn('模板管理','templates','')+btn('新建写作任务','new-writing','primary'))+`<div class="grid main-aside"><div class="stack"><div class="card"><div class="card-head"><div><h2>创建研究产物</h2><p class="muted">选择写作类型后，下方任务、质控和节点会一起切换。</p></div>${statusBadge('当前：'+kind,'blue')}</div><div class="grid three">${Object.keys(kinds).map(k=>`<button class="card" data-action="pick-ui" data-ui-key="writingKind" data-ui-value="${esc(k)}" style="text-align:left;${k===kind?'border-color:var(--blue);background:#ebf1ff':''}"><span class="metric-icon">${icon(k==='定时写作'?'clock':k==='结构化一页纸'?'file':'spark')}</span><h3 class="section-space">${esc(k)}</h3><p class="muted">${esc(kinds[k].desc)}</p></button>`).join('')}</div></div><div class="card"><div class="card-head"><h2>当前任务：${esc(cur.task)}</h2>${statusBadge(kind==='深度研究'?'研究计划中':'待确认关键观点','orange')}</div><div class="timeline"><div class="timeline-item"><span class="step-circle done">${icon('check')}</span><div class="step-copy"><b>研究计划</b><p>${esc(cur.plan)}</p></div></div><div class="timeline-item"><span class="step-circle ${kind==='深度研究'?'current':'done'}">${kind==='深度研究'?'2':icon('check')}</span><div class="step-copy"><b>大纲生成</b><p>${esc(cur.outline)}</p></div></div><div class="timeline-item"><span class="step-circle ${kind==='深度研究'?'':'current'}">${kind==='深度研究'?'3':'3'}</span><div class="step-copy"><b>关键观点确认</b><p>${kind==='深度研究'?'待大纲完成后再确认':'有 2 条观点需要研究员确认后继续'}</p>${kind==='深度研究'?'':btn('打开审阅','review-writing','small')}</div></div><div class="timeline-item"><span class="step-circle">4</span><div class="step-copy"><b>终稿与发布审核</b><p>待完成</p></div></div></div></div></div><aside class="stack"><div class="card"><div class="card-head"><h2>质量控制 · ${esc(kind)}</h2>${statusBadge('进行中','orange')}</div>${cur.qc.map(x=>`<div class="stat-row"><span>${x[0]}</span><b>${statusBadge(x[1],x[2])}</b></div>`).join('')}</div><div class="card"><div class="card-head"><h2>可复用资产</h2></div><div class="chips"><span class="chip">机构风格：稳健</span><span class="chip">${esc(kind)}模板</span><span class="chip">2026Q3 研究记忆</span></div></div></aside></div>`;
}

function pageProductPrivateRestricted(){
  return pageHeading('PRIVATE BANK','私行产品洞察','面向完成合格投资者认定、具备相应准入资格的用户展示受限产品材料。',btn('查看办理指引','m-qualification','primary'))+`<div class="restricted">${icon('lock')}<h2>请先完成合格投资者认定</h2><p>当前演示身份未完成认定。私募基金、信托和专户产品详情仅在准入完成且授权范围内展示。</p>${btn('查看办理指引','m-qualification','primary')}</div>`;
}

function landingSpec(id){
  const s=session();
  const g=s.goal||sessionApi()?.DEFAULT_GOAL||{};
  const p=productOf(s.landing?.productId)||{};
  const map={
    'not-implemented':{title:'W1 未实现',kicker:'操作未完成',summary:'该操作在当前 W1 范围尚未实现，系统没有写入任何状态，也没有展示成功结果。',facts:[['操作',s.landing?.attempted||'未知'],['处理','未写入成功状态']],next:['返回上一页'],nextActions:[['back-from','返回','primary']]},
    'task-center':{title:'任务中心',kicker:'运营待办',summary:'演示会话中的待处理事项。不写入真实工单。',facts:[['待确认','宏观周报关键观点'],['待补充','私行产品准入材料'],['已完成','基金选品池月度更新']],next:['返回能力总览','进入投研工作台'],nextActions:[['go-workspace','进入投研工作台','primary'],['back-from','返回','light']]},
    'source-detail':{title:'来源详情',kicker:'可追溯',summary:s.landing?.name||'全市场基金净值 · fund_nav_daily',facts:[['数据时点','2026-09-28 08:00'],['授权范围','投研 · 投顾'],['维护责任','市场数据组']],next:['返回来源页'],nextActions:[['back-from','返回','primary']]},
    'new-supply':{title:'研究供给草稿',kicker:'投研供给',summary:'宏观早报草稿已进入待复核状态，不写入真实知识库。',facts:[['供给名称','宏观早报草稿'],['类型','资讯研究'],['状态','待审核']],next:['返回供给目录'],nextActions:[['back-from','返回供给目录','primary']]},
    'subscribe':{title:'订阅已生效',kicker:'研究提醒',summary:'已按当前研究口径订阅提醒。演示会话仅存内存。',facts:[['范围','今日重点 · 本周观察 · 自定义日历'],['下次提醒','2026-09-30 美国 PCE'],['渠道','投研工作台消息']],next:['返回研究页'],nextActions:[['back-from','返回','primary']]},
    'brief':{title:'简报已生成',kicker:'研究产物',summary:'已用演示数据生成一页纸简报，可继续打开候选解释。',facts:[['标题','市场与宏观一页纸'],['数据时点',s.asOfFull||'2026-09-28 09:30'],['引用','不少于 2 条']],next:['查看候选解释'],nextActions:[['go-pc-candidates','打开候选产品池','primary'],['back-from','返回','light']]},
    'upload':{title:'文档已解析',kicker:'智能阅读',summary:'已载入演示研报《中国权益市场月度策略》，识别置信度 98%。',facts:[['页数','28'],['关键观点','26 条'],['待核验','第 19 页图表 82%']],next:['查看摘要'],nextActions:[['summary','打开摘要','primary'],['back-from','返回阅读器','light']]},
    'summary':{title:'报告摘要',kicker:'智能阅读',summary:s.landing?.aiResult?.text||'未收到AI 生成摘要。',facts:[['来源',(s.landing?.aiResult?.citations||[]).join(' · ')||'暂无'],['模型',s.landing?.aiResult?.model||'未知'],['时延',`${s.landing?.aiResult?.latency_ms??'—'} ms`]],next:['提取数据','返回原文'],nextActions:[['extract','提取关键数据','primary'],['back-from','返回原文','light']]},
    'extract':{title:'关键数据摘录',kicker:'智能阅读',summary:'已提取可定位到页码的演示数据，低置信度项需人工核验。',facts:[['第 3 页','结论摘要'],['第 11 页','盈利预期'],['第 19 页','图表待核验']],next:['加入研究空间'],nextActions:[['save','加入研究空间','primary'],['back-from','返回','light']]},
    'save':{title:'已保存到工作区',kicker:'演示会话',summary:'记录仅写入当前演示会话，刷新后可恢复。',facts:[['位置','个人工作区 / 草稿'],['时点',s.asOfFull||'2026-09-28 09:30']],next:['打开工作台'],nextActions:[['go-workspace','打开投研工作台','primary'],['back-from','返回','light']]},
    'onepager':{title:'产品解释已生成',kicker:'产品洞察',summary:s.landing?.aiResult?.text||'未收到AI 生成解释。',facts:[['产品',p.name||s.landing?.productId||'当前产品'],['来源',(s.landing?.aiResult?.citations||[]).join(' · ')||'暂无'],['模型 / 时延',`${s.landing?.aiResult?.model||'未知'} · ${s.landing?.aiResult?.latency_ms??'—'} ms`],['提示','不构成投资建议']],next:['打开比较'],nextActions:[['go-pc-compare','打开横向比较','primary'],['back-from','返回','light']]},
    'templates':{title:'写作模板',kicker:'智能写作',summary:'3 个演示模板可用：宏观日报、结构化一页纸、深度研究。',facts:[['机构风格','稳健'],['记忆','2026Q3 研究记忆'],['状态','可选用']],next:['新建写作任务'],nextActions:[['new-writing','新建写作任务','primary'],['back-from','返回','light']]},
    'new-writing':{title:'写作草稿已生成',kicker:'智能写作',summary:s.landing?.aiResult?.text||'未收到AI 生成草稿。',facts:[['主题',s.landing?.topic||'当前写作任务'],['来源',(s.landing?.aiResult?.citations||[]).join(' · ')||'暂无'],['模型 / 时延',`${s.landing?.aiResult?.model||'未知'} · ${s.landing?.aiResult?.latency_ms??'—'} ms`]],next:['打开审阅'],nextActions:[['review-writing','打开审阅','primary'],['back-from','返回写作台','light']]},
    'review-writing':{title:'章节审阅',kicker:'质量控制',summary:'有 2 条观点需要研究员确认后继续。演示不提交真实发布。',facts:[['数据','18/18 通过'],['事实','26/28 待核'],['合规','待审核']],next:['返回写作台'],nextActions:[['back-from','返回','primary']]},
    'workspace':{title:'我的研究空间',kicker:'投研工作台',summary:'最近草稿：固收+产品比较一页纸、林女士组合复盘。',facts:[['权限',s.role||'投顾 / 财富管理'],['提醒','2 条']],next:['打开智能问答'],nextActions:[['go-research','打开研究台','primary'],['back-from','返回','light']]},
    'research-plan':{title:'研究计划',kicker:'智能问答',summary:'已拆解 3 步：问题理解、证据检索、形成分析。',facts:[['检索范围','行内知识库 · 市场数据'],['最少引用','2 条'],['状态',s.researchAnswer?'已完成':'待发起']],next:['开始研究'],nextActions:[['ask','开始研究','primary'],['back-from','返回','light']]},
    'filter-panel':{title:'筛选条件',kicker:'列表过滤',summary:'可按类型、审核状态和关键词过滤当前演示列表。',facts:[['当前页',s.landing?.from||route()],['方式','会话内过滤，不请求真实接口']],next:['返回列表'],nextActions:[['back-from','返回','primary']]},
    'mobile-search':{title:'基金搜索结果',kicker:'诊基',summary:'已用演示数据匹配到持仓与热门基金。',facts:[['关键词',s.landing?.query||'A500'],['命中','易方达中证A500联接A'],['口径','近一年收益 / 回撤']],next:['打开诊断'],nextActions:[['m-diagnose','深度诊基','primary'],['back-from','返回','light']]},
    'auth-needed':{title:'需要授权',kicker:'资产配置',summary:'生成方案前需要勾选使用持仓和风险测评信息。',facts:[['用途','配置分析'],['范围','持仓 · 风险测评'],['提示','可随时取消']],next:['返回配置'],nextActions:[['back-from','返回配置页','primary']]},
    'rule-confirmation':{title:'需要确认配置条件',kicker:'RULE MATCH',summary:`规则匹配结果为 ${s.ruleMatch?.status||'NEED_CONFIRMATION'}，程序没有执行或覆盖旧方案。请补充缺失字段后重试。`,facts:[['规则',s.ruleMatch?.rule_id||'暂无'],['版本',s.ruleMatch?.rule_version||'暂无'],['缺失字段',(s.ruleMatch?.missing_fields||[]).join(' · ')||'需人工确认']],next:['返回配置'],nextActions:[['back-from','返回配置页','primary']]},
    'prompt-needed':{title:'请先输入问题',kicker:'问小财',summary:'用大白话描述你的理财问题后，系统会调用AI 生成并返回证据与风险提示。',facts:[['示例','最近的市场变化会影响我的组合吗？'],['范围','已授权资料']],next:['返回助手'],nextActions:[['back-from','返回','primary']]},
    'ai-error':{title:'AI 生成失败',kicker:'AI ERROR',summary:s.promptError||'生成或 Embedding 服务未就绪，系统没有使用预置答案推进流程。请检查会话状态、证据范围或生成服务配置。',facts:[['状态',s.aiStatus||'FAILED'],['请求',s.lastQuestion||s.landing?.query||'当前任务'],['处理','未写入成功结果']],next:['返回上一页'],nextActions:[['back-from','返回','primary']]},
    'action-error':{title:'操作未完成',kicker:'REQUEST ERROR',summary:s.promptError||'应用服务未确认本次操作，页面没有展示成功结果。',facts:[['处理','未展示成功结果'],['建议','检查服务状态后重试']],next:['返回上一页'],nextActions:[['back-from','返回','primary']]},
    'sync-error':{title:'共享数据加载失败',kicker:'SESSION ERROR',summary:s.promptError||'会话或业务数据未能从应用服务加载，演示常量不会作为真实加载结果。',facts:[['处理','真实数据未加载成功'],['建议','检查应用服务后刷新重试']],next:['返回上一页'],nextActions:[['back-from','返回','primary']]},
    'm-review-detail':{title:'本周组合复盘',kicker:'投后陪伴',summary:'A500 本周波动上升，但组合整体风险仍在 R3 范围。建议先解释波动来源，再决定是否调整。',facts:[['组合收益','+0.86%'],['区间','2026-09-21 至 '+(s.asOf||'2026-09-28')],['目标完成度','68%'],['提示','复盘材料仅供客户经理内部使用']],next:['返回陪伴页'],nextActions:[['go-companion','返回投后陪伴','primary']]},
    'ask':{title:'研究结果',kicker:'智能问答',summary:`已完成研究：${s.landing?.query||s.researchAnswer?.question||'当前问题'}。回答带来源与数据时点，不构成投资建议。`,facts:[['问题',s.landing?.query||s.researchAnswer?.question||'当前问题'],['结论',s.researchAnswer?.text||'未收到生成结果'],['引用',(s.researchAnswer?.sources||[]).slice(0,2).join(' · ')||'暂无']],next:['查看候选解释'],nextActions:[['go-pc-candidates','打开候选产品池','primary'],['back-from','返回','light']]},
    'm-send':{title:'问小财已回答',kicker:'AI 助手',summary:s.lastAnswer?.text||s.promptError||'未收到AI 生成结果。',facts:[['问题',s.lastQuestion||s.landing?.query||'当前问题'],['来源',(s.lastAnswer?.sources||[]).join(' · ')||'暂无'],['提示','信息辅助，不构成投资建议']],next:['查看持仓'],nextActions:[['m-holding','查看我的持仓','primary'],['back-from','返回助手','light']]},
    'generate-allocation':{title:'配置方案与候选已生成',kicker:'资产配置',summary:'规则结果、配置方案和真实候选均已由应用服务保存。',facts:[['目标',goalText()],['方案',s.plan?`现金 ${s.plan.cash}% · 固收 ${s.plan.bond}% · 权益 ${s.plan.equity}% · 保障 ${s.plan.protection}%`:'未生成'],['候选数',String(s.candidates?.length||0)]],next:['查看候选'],nextActions:[['go-candidates','查看候选推荐','primary'],['go-pc-candidates','打开 PC 候选池','light']]},
    'generate-candidates':{title:'候选池已生成',kicker:'产品筛选',summary:'已按当前配置方案从可售范围生成真实候选，排序不替代适当性结论。',facts:[['目标',goalText()],['候选数',String(s.candidates?.length||0)],['口径','组合角色 + 适配前提 + 风险']],next:['打开比较'],nextActions:[['go-pc-compare','打开横向比较','primary'],['back-from','返回候选池','light']]},
    'allocation-needed':{title:'请先生成配置方案',kicker:'资产配置',summary:'当前会话没有已保存的配置方案，不能生成候选或继续后续流程。',facts:[['处理','未自动补入默认方案或候选']],next:['返回配置'],nextActions:[['go-allocation','去做资产配置','primary'],['back-from','返回','light']]},
    'compare-needed':{title:'比较产品不足',kicker:'产品比较',summary:'保存比较前需要 2–3 个当前产品库中的真实产品。请先从已生成候选加入比较。',facts:[['当前有效产品数',String(realProductIds(s.compareSet).length)],['处理','未自动补入默认产品']],next:['返回候选'],nextActions:[['go-candidates','去候选推荐','primary'],['back-from','返回','light']]},
    'sync-compare':{title:'比较集已同步',kicker:'产品比较',summary:'已把林女士候选同步进比较集，使用近一年统一口径。',facts:[['产品数',String(s.compareSet?.length||0)],['观察区间','2025-09-28 至 '+(s.asOf||'2026-09-28')]],next:['返回比较'],nextActions:[['back-from','返回比较页','primary']]},
    'save-pc-compare':{title:'比较结果已保存',kicker:'产品比较',summary:'比较结论已写入演示会话，刷新后可恢复。历史收益不能替代风险判断。',facts:[['产品数',String(s.compareSet?.length||0)],['提示','业绩比较基准不代表预期收益']],next:['返回比较'],nextActions:[['back-from','返回比较','primary']]},
    'm-save-compare':{title:'比较结果已保存',kicker:'产品比较',summary:'已保存当前比较结果，可继续做投后陪伴。',facts:[['产品数',String(s.compareSet?.length||0)],['口径','近一年 · 统一回撤']],next:['投后陪伴'],nextActions:[['go-companion','进入投后陪伴','primary'],['back-from','返回','light']]},
    'm-holding-detail':{title:'持仓明细（全部）',kicker:'持仓诊断',summary:'以下金额来自当前会话持仓数据。',facts:holdingsSummary().rows.map(row=>[row.type||'产品',`${row.name} · ${row.amount}`]),next:['基金诊基'],nextActions:[['go-fund','去做基金诊基','primary'],['back-from','返回持仓','light']]},
    'm-remind':{title:'开放日提醒已创建',kicker:'投后陪伴',summary:'已为稳盈固收开放日创建演示待办，仅存当前会话。',facts:[['事项','稳盈固收开放日'],['剩余','12 天'],['状态','1 条待办已建']],next:['返回陪伴'],nextActions:[['go-companion','返回投后陪伴','primary']]},
    'm-submit-care':{title:'服务建议已提交',kicker:'投后陪伴',summary:'已提交给客户经理确认。客户经理决定是否触达客户。',facts:[['建议','发送一条波动解释给客户'],['状态','待客户经理确认'],['提示','不构成投资建议']],next:['返回陪伴'],nextActions:[['go-companion','返回投后陪伴','primary']]},
    'pref-updated':{title:'选项已更新',kicker:'演示设置',summary:`已更新「${s.landing?.name||'选项'}」为${s.landing?.on?'开启':'关闭'}。仅写入当前演示会话。`,facts:[['选项',s.landing?.name||'研究口径'],['状态',s.landing?.on?'已开启':'已关闭'],['数据时点',s.asOf||'2026-09-28']],next:['返回'],nextActions:[['back-from','返回','primary']]}
  };
  return map[id]||{title:'演示结果',kicker:'落地页',summary:'示例操作已用模拟数据完成，不连接真实账户或交易。',facts:[['数据时点',s.asOf||'2026-09-28']],next:['返回上一页'],nextActions:[['back-from','返回','primary']]};
}
function landingBody(){
  const L=session().landing||{id:'save'};
  const spec=landingSpec(L.id);
  const facts=(spec.facts||[]).map(x=>`<div class="stat-row"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('');
  const actions=(spec.nextActions||[['back-from','返回','primary']]).map(a=>btn(a[1],a[0],a[2])).join('');
  const syncText=window.WealthApi?.connected?'共享会话已同步':'共享会话未连接';
  const workItem=WORK_ITEM_ACTIONS.has(L.id);
  const activityList=session().activities||[];
  const last=activityList.at(-1);
  const summaryText=workItem?(last?`已由应用服务写入真实记录（${esc(last.kind)}），刷新后可恢复。`:'尚未写入服务端记录，请重试。'):esc(spec.summary);
  const stateCard=workItem&&last?`<div class="callout good session-flag">服务端状态：${esc(last.activity_id)} · ${esc(last.created_at)} · ${esc(last.data_version)}（累计 ${activityList.length} 条）</div>`:'';
  return `<div class="insight-header"><div class="badge blue">${esc(spec.kicker)}</div><h2 style="margin-top:10px">${esc(spec.title)}</h2><p class="muted">数据时点 ${esc(L.asOf||session().asOf||'2026-09-28')} · ${syncText}</p></div><p class="section-space">${summaryText}</p><div class="card section-space">${facts}${stateCard}<div class="callout">结果供流程验证，不构成投资建议；业务状态由共享应用服务校验。</div></div><div class="path-next">${actions}</div>`;
}
function pageResult(){
  const from=session().landing?.from||'pc/architecture';
  return pageHeading('RESULT','演示结果页','用模拟数据承接上一跳操作，不连接真实账户、行情或交易。',btn('返回上一页','back-from','primary'))+`<div class="grid main-aside"><div class="stack">${landingBody()}</div><aside class="stack"><div class="card"><div class="card-head"><h2>来源页</h2></div><p class="muted">#${esc(from)}</p>${btn('打开来源页','back-from','full')}</div></aside></div>`;
}
function mobileResult(){
  return `<div class="eyebrow">RESULT</div><h1>演示结果</h1><p class="sub">用模拟数据承接上一跳，不构成投资建议。</p>${landingBody()}`;
}

function desktopPage(r){ switch(r){case'pc/architecture':return pageArchitecture();case'pc/supply':return pageSupply();case'pc/workspace':return pageWorkspace();case'pc/research':return pageResearch();case'pc/events':return researchPage('events');case'pc/macro':return researchPage('macro');case'pc/industry':return researchPage('industry');case'pc/library':return pageLibrary();case'pc/reader':return pageReader();case'pc/writing':return pageWriting();case'pc/candidates':return pageCandidates();case'pc/compare':return pageCompare();case'pc/product-fund':return productPage('fund');case'pc/product-insurance':return productPage('insurance');case'pc/product-wealth':return productPage('wealth');case'pc/product-deposit':return productPage('deposit');case'pc/product-private':return pageProductPrivateRestricted();case'pc/result':return pageResult();default:return pageArchitecture();} }

function mobileHeader(r,title){ return `<header class="phone-header"><button class="icon-btn" data-action="mobile-menu" aria-label="打开导航">${icon('grid')}</button><div><h3>${title}</h3><small>财富智服 · 示例数据</small></div><button class="icon-btn" data-action="mobile-help" aria-label="帮助">${icon('help')}</button></header>`; }
function mobileBottom(r){ return `<nav class="phone-bottom"><a href="#m/assistant" data-action="open-route" data-route="m/assistant" class="${r==='m/assistant'?'active':''}">${icon('spark')}助手</a><a href="#m/fund" data-action="open-route" data-route="m/fund" class="${r==='m/fund'?'active':''}">${icon('chart')}诊断</a><a href="#m/allocation" data-action="open-route" data-route="m/allocation" class="${r==='m/allocation'?'active':''}">${icon('sliders')}配置</a><a href="#m/holdings" data-action="open-route" data-route="m/holdings" class="${r==='m/holdings'?'active':''}">${icon('grid')}我的</a></nav>`; }
function mobileStage(r, title, inner){return `<div class="mobile-stage"><aside class="mobile-nav"><div class="brand"><span class="mark">${icon('spark')}</span><div><strong>财富智服</strong><small>PHONE WEB PROTOTYPE</small></div></div><h4>手机网页原型</h4>${mobileNav.map(x=>`<a class="nav-link ${x[0]===r?'active':''}" href="#${x[0]}" data-action="open-route" data-route="${x[0]}">${icon(x[2])}<span>${x[1]}</span></a>`).join('')}<div class="callout" style="margin-top:22px;font-size:12px">此侧栏用于原型演示，实际交互入口由手机银行 / 客户经理工作台承载。</div></aside><div class="phone">${mobileHeader(r,title)}<section class="phone-body">${inner}</section>${mobileBottom(r)}</div><aside class="mobile-notes"><h3>原型说明</h3><p>该功能按需求表选择为<strong>手机网页</strong>，模拟手机银行内嵌页，示例数据用于演示。</p><ol><li>点击快捷入口体验流程</li><li>输入问题可触发示例回答</li><li>结果卡片展示依据与风险提示</li></ol><button class="btn light full" data-action="requirements">查看 33 项需求映射</button><p class="mobile-footer-note">数据仅供产品原型演示，不构成投资建议或交易指令。</p></aside></div>`; }
function mobileAssistant(){
  const s=session();
  const answer=s.lastAnswer;
  const bubble=answer
    ? `<div class="chat-bubble"><div class="chat-name">${icon('spark')} 财富智服</div><p>${esc(s.lastQuestion||'最近的市场变化会影响我的组合吗？')}</p><p>${esc(answer.text)}</p><div class="chips">${(answer.sources||[]).map(x=>`<button class="source" data-action="source-detail">${esc(x)}</button>`).join('')}</div></div><div class="callout warn">以上为信息辅助，不构成投资建议或交易指令。</div>`
    : `<div class="chat-bubble"><div class="chat-name">${icon('spark')} 财富智服</div>你可以直接问我：最近的市场变化会影响我的组合吗？</div>`;
  return `<div class="mobile-welcome"><span class="badge blue">${icon('spark')} AI 理财助手</span><h1>你好，${esc(s.customerName||'林女士')}</h1><p>我会把复杂的市场和产品讲清楚，也会标出需要你确认的地方。</p></div><div class="mobile-highlight"><div class="dim">今日关注 · ${esc(s.asOfFull||'2026-09-28 09:30')} 更新</div><div class="metric-value">2 条持仓提醒</div><p class="dim">A500 波动扩大，固收+产品净值稳定。</p><button class="btn" data-action="m-holding">查看我的持仓</button></div><div class="mobile-feature-grid"><a class="mobile-feature" href="#m/fund">${icon('chart')}诊基</a><a class="mobile-feature" href="#m/allocation">${icon('sliders')}做配置</a><a class="mobile-feature" href="#m/candidates">${icon('filter')}找产品</a></div><div class="card" style="margin-top:15px"><div class="card-head"><h2>问小财</h2>${statusBadge(answer?'已回答':'已连接',answer?'blue':'green')}</div>${bubble}<div class="prompt-quick"><button data-action="m-quick">为什么今天基金涨跌不一？</button><button data-action="m-quick">帮我看一下我的组合</button></div><div class="chat-compose"><input id="mobilePrompt" placeholder="用大白话问理财问题" value="${esc(s.lastQuestion||'')}"/><button class="btn primary" data-action="m-send">${icon('send')}</button></div></div>${answer?`<div class="path-next">${btn('去看持仓诊断','m-holding','primary full')}</div>`:''}<p class="mobile-footer-note">回答会展示数据时点、来源和不确定事项。产品推荐需完成风险匹配与客户授权。不构成投资建议。</p>`;
}
function fundCard(item, saved){
  return `<div class="mobile-product"><div class="between"><div><span class="badge ${item.badge||''}">${esc(item.tag)}</span><h3>${esc(item.name)}</h3></div><div class="rate">${esc(item.ret)}<small>近一年</small></div></div><div class="product-meta">${esc(item.meta)}</div><div class="between"><span class="muted">${esc(item.note)}</span>${item.action==='diagnose'?btn(saved?'查看诊断':'深度诊基','m-diagnose','small primary'):`<button class="btn small" data-action="m-product-detail" data-product="${esc(item.product)}">查看详情</button>`}</div></div>`;
}
function mobileFund(){
  const s=session();
  const saved=s.diagnosis;
  const view=viewOf()||'我的持仓';
  const all=[
    {tag:'A500 · 宽基指数',name:'易方达中证A500联接A',ret:'+18.42%',meta:'最大回撤 -9.80%　波动率 18.6%　夏普 1.26',note:'今日净值估算 +0.38%',action:'diagnose',cats:['我的持仓','热门基金','指数基金'],badge:'blue'},
    {tag:'固收+ · R2',name:'华安稳健增利 12 个月',ret:'+4.08%',meta:'最大回撤 -1.12%　持有期 12 个月　管理费 0.45%',note:'适合稳健底仓',product:'bondfund',cats:['我的持仓','热门基金','主动基金']},
    {tag:'指数 · R3',name:'沪深300ETF 联接',ret:'+12.10%',meta:'最大回撤 -11.20%　跟踪误差 0.28%',note:'宽基配置工具',product:'fund',cats:['热门基金','指数基金']},
    {tag:'主动 · R3',name:'均衡配置混合',ret:'+9.40%',meta:'最大回撤 -8.60%　持股集中度中等',note:'主动管理样本',product:'fund',cats:['热门基金','主动基金']}
  ].filter(x=>x.cats.includes(view));
  return `<div class="between"><div><div class="eyebrow">AI DIAGNOSIS</div><h1>基金诊断</h1></div><button class="icon-btn" data-action="mobile-search">${icon('search')}</button></div><p class="sub">输入基金名称，看看产品表现、行业特点和持仓影响。</p>${saved?`<div class="callout good session-flag">已保存诊断：${esc(saved.name)} · 数据时点 ${esc(saved.asOf)} · 回撤 ${esc(saved.drawdown)}</div>`:''}<div class="mobile-tags">${['我的持仓','热门基金','指数基金','主动基金'].map(x=>tabBtn(x,'我的持仓')).join('')}</div>${all.map(x=>fundCard(x,saved)).join('')||`<div class="card"><p>当前分类暂无演示基金。</p></div>`}<div class="callout good">${icon('info')} 当前视图：${esc(view)}。诊断会同时检查产品表现、行业暴露和你的持仓集中度。</div>${saved?`<div class="path-next">${btn('去做资产配置','go-allocation','primary full')}</div>`:''}`;
}
function mobileInsurance(){return `<div class="eyebrow">INSURANCE</div><h1>保险保障检视</h1><p class="sub">把保障责任、缴费和待确认事项放在一处。系统不替代健康告知、核保和理赔审核。</p><div class="card"><div class="card-head"><div><h2>我的家庭保障</h2><p class="muted">已授权 3 张保单</p></div>${statusBadge('保障缺口 1 项','orange')}</div><div class="mobile-diagnostic"><div class="donut"><div class="donut-center"><b>72%</b>覆盖度</div></div><div class="legend"><span><i class="swatch" style="background:#386bda"></i>医疗 45%</span><span><i class="swatch" style="background:#769df0"></i>重疾 20%</span><span><i class="swatch" style="background:#59b4b2"></i>寿险 22%</span><span><i class="swatch" style="background:#dbc58d"></i>意外 13%</span></div></div><div class="callout warn">建议补充：家庭主要收入来源人的定期寿险保额偏低。需结合收入、负债和家庭责任进一步确认。</div>${btn('查看保障缺口','m-coverage','primary full')}</div><div class="card"><div class="card-head"><h2>保单待办</h2>${statusBadge('2 项','orange')}</div><div class="task-line"><span class="task-dot">${icon('clock')}</span><div class="task-text"><b>安享长期医疗</b><p>续保日期 2026-10-12 · 查看续保条件</p></div>${btn('查看','m-policy','small')}</div><div class="task-line"><span class="task-dot">${icon('file')}</span><div class="task-text"><b>受益人信息</b><p>上次确认 2024-09-30 · 建议复核</p></div>${btn('复核','m-policy','small')}</div></div>`;}
function wealthCard(id){
  const p=productOf(id)||{};
  return `<div class="mobile-product"><div class="between"><div><span class="badge ${id==='wealth'?'blue':''}">${esc(p.risk||'')} · ${esc(p.role||'')}</span><h3>${esc(p.name||id)}</h3></div><div class="rate">${esc(p.ret||'')}<small>近一年</small></div></div><div class="product-meta">${esc(p.detail||'')}　${esc(p.liquidity||'')}　起购按说明书</div><div class="chips"><span class="chip">${esc(p.role||'')}</span><span class="chip">我行可售</span></div><div class="between" style="margin-top:12px">${btn('看懂产品','m-wealth-detail','small',id)}<button class="link-btn" data-action="m-save" data-product="${esc(id)}">加入比较 ${icon('plus')}</button></div></div>`;
}
function mobileWealth(){
  const view=viewOf()||'全部';
  const map={全部:['wealth','wealthplus','cash'],现金管理:['cash'],固收:['wealth'],'固收+':['wealthplus']};
  const ids=map[view]||map['全部'];
  return `<div class="eyebrow">WEALTH PRODUCT</div><h1>理财产品</h1><p class="sub">按风险、期限和流动性找到适合的产品。</p><div class="mobile-tags">${['全部','现金管理','固收','固收+'].map(x=>tabBtn(x,'全部')).join('')}</div>${ids.map(wealthCard).join('')}<p class="mobile-footer-note">当前视图：${esc(view)}。业绩比较基准不代表预期收益；申购、赎回与可售状态以业务系统为准。</p>`;
}
function mobileDeposit(){return `<div class="eyebrow">DEPOSIT CALCULATOR</div><h1>存款测算</h1><p class="sub">按金额和期限测算到期本息，并比较提前支取影响。</p><div class="card"><div class="form-grid"><label>存入金额<input id="depositAmount" type="number" value="500000" min="1000" step="1000"/></label><label>期限<select id="depositTerm"><option value="1">1 年 · 1.55%</option><option value="3" selected>3 年 · 2.15%</option><option value="5">5 年 · 2.35%</option></select></label></div><div class="divider"></div><div class="metric-label">到期本息（单利示例）</div><div class="result-money" id="depositResult">¥532,250</div><p class="muted">预计利息 <b id="depositInterest">¥32,250</b> · 年利率按演示数据计算</p>${btn('比较提前支取','m-deposit-compare','light full')}</div><div class="card"><div class="card-head"><h2>同口径比较</h2><span class="muted">¥500,000 · 3 年</span></div><div class="stat-row"><span>整存整取</span><b>2.15% · ¥532,250</b></div><div class="stat-row"><span>大额存单</span><b>2.30% · ¥534,500</b></div><div class="stat-row"><span>特色存款</span><b>2.05% · ¥530,750</b></div><div class="callout warn">提前支取通常按活期利率计息，实际利息和额度以办理渠道实时结果为准。</div></div>`;}
function mobilePrivate(){const s=session(); return `<div class="eyebrow">PRIVATE BANK</div><h1>私行产品</h1><p class="sub">受限内容需要先完成资格确认和适当性校验。</p><div class="restricted">${icon('lock')}<h2>请先完成合格投资者认定</h2><p>当前账户未展示私募基金、信托和专户产品详情。完成认定后，产品说明书和募集材料才会在授权范围内展示。</p>${btn('查看办理指引','m-qualification','primary full')}${s.contactTodo?`<div class="callout good">已创建联系客户经理待办。</div>`:`<button class="link-btn" data-action="m-contact">联系客户经理</button>`}</div><div class="card"><div class="card-head"><h2>办理进度</h2>${statusBadge('待补充 1 项','orange')}</div><div class="timeline"><div class="timeline-item"><span class="step-circle done">${icon('check')}</span><div class="step-copy"><b>身份核验</b><p>已完成 · 2026-09-20</p></div></div><div class="timeline-item"><span class="step-circle current">2</span><div class="step-copy"><b>风险测评</b><p>请补充职业与资产证明</p></div></div><div class="timeline-item"><span class="step-circle">3</span><div class="step-copy"><b>合格投资者认定</b><p>等待审核</p></div></div></div></div>`;}
function mobileAllocation(){
  const s=session();
  const g=s.goal||sessionApi()?.DEFAULT_GOAL||{};
  const plan=s.plan;
  const termOpts=['1–3 年','3–5 年','5 年以上'].map(x=>`<option${g.term===x?' selected':''}>${x}</option>`).join('');
  const riskOpts=['R2 稳健型','R3 平衡型','R4 进取型'].map(x=>`<option${g.risk===x?' selected':''}>${x}</option>`).join('');
  const purposeOpts=['教育金储备','养老储备','闲置资金增值'].map(x=>`<option${g.purpose===x?' selected':''}>${x}</option>`).join('');
  const liqOpts=['大部分可长期投资','一年内可能使用'].map(x=>`<option${(g.liquidity||'大部分可长期投资')===x?' selected':''}>${x}</option>`).join('');
  const planCard=plan
    ? `<div class="card"><div class="card-head"><h2>已生成方案</h2>${statusBadge('可回看','green')}</div><div class="grid four"><div class="mini-stat"><span class="muted">现金管理</span><h3>${plan.cash}%</h3></div><div class="mini-stat"><span class="muted">固收</span><h3>${plan.bond}%</h3></div><div class="mini-stat"><span class="muted">权益</span><h3>${plan.equity}%</h3></div><div class="mini-stat"><span class="muted">保障</span><h3>${plan.protection}%</h3></div></div><p class="muted">目标：${esc(goalText())}</p>${btn('查看候选推荐','go-candidates','primary full')}</div>`
    : `<div class="card"><div class="card-head"><h2>配置逻辑</h2>${statusBadge('待输入完成','orange')}</div><p class="muted">系统会说明现金、固收、权益和保障在组合中的作用，并显示关键假设与风险提示。</p></div>`;
  return `<div class="eyebrow">ASSET ALLOCATION</div><h1>做一份资产配置</h1><p class="sub">先说清楚目标和约束，方案才有意义。</p>${s.authNotice?`<div class="callout ${s.authorized?'good':'warn'}">${esc(s.authNotice)}</div>`:''}<div class="card"><div class="card-head"><h2>${plan?'2 / 3 方案已生成':'1 / 3 客户目标'}</h2>${statusBadge(plan?'已保存':'约 1 分钟',plan?'green':'blue')}</div><div class="form-grid"><label>投资金额<input id="allocAmount" value="${esc(g.amount||'¥500,000')}"/></label><label>投资期限<select id="allocTerm">${termOpts}</select></label><label>风险等级<select id="allocRisk">${riskOpts}</select></label><label>资金用途<select id="allocPurpose">${purposeOpts}</select></label></div><label class="section-space">多久可能需要用到这笔钱？<select id="allocLiquidity">${liqOpts}</select></label><label class="check section-space"><input id="allocAuth" type="checkbox"${s.authorized!==false?' checked':''}/>我已授权使用持仓和风险测评信息</label>${btn(plan?'重新生成方案':'生成配置方案','m-generate-allocation','primary full')}</div>${planCard}`;
}
function mobileHoldings(){
  const s=session();
  const {rows,total,byType}=holdingsSummary();
  const colors=['#386bda','#769df0','#59b4b2','#dbc58d','#8069c4'];
  const legend=Object.entries(byType).map(([type,amount],i)=>`<span><i class="swatch" style="background:${colors[i%colors.length]}"></i>${esc(type)} ${total?((amount/total)*100).toFixed(1):'0.0'}%</span>`).join('');
  const extra=s.holdingsExpanded?`<div class="stat-row"><span><b>安享长期医疗</b><br><small class="muted">保险</small></span><b>年缴 ¥3,280<br><small class="muted">保障型</small></b></div>`:'';
  return `<div class="eyebrow">MY HOLDINGS</div><h1>持仓诊断</h1><p class="sub">收益、风险和集中度放在同一张图里。</p><div class="mobile-highlight"><div class="dim">总资产 · 截至 ${esc(s.asOf||'2026-09-28')}</div><div class="metric-value">${moneyText(total)}</div><div class="between"><span class="dim">持有收益</span><b>+¥42,860.18　<span style="color:#c8e8d8">+5.40%</span></b></div></div><div class="card"><div class="card-head"><h2>资产分布</h2><span class="muted">按市值</span></div><div class="mobile-diagnostic"><div class="donut"><div class="donut-center"><b>${Object.keys(byType).length} 类</b>资产</div></div><div class="legend">${legend||'<span>暂无持仓</span>'}</div></div><div class="callout warn">集中度提醒：单只宽基基金占权益资产 68%，建议关注回撤和流动性。</div>${btn('去做基金诊基','go-fund','primary full')}</div><div class="card"><div class="card-head"><h2>持仓明细</h2></div>${rows.map(x=>`<div class="stat-row"><span><b>${esc(x.name)}</b><br><small class="muted">${esc(x.type)}</small></span><b>${esc(x.amount)}<br><small class="positive">${esc(x.ret)}</small></b></div>`).join('')}${extra}${btn('查看全部','m-holding-detail','primary full')}</div>${s.reviewReady||s.plan?`<div class="path-next">${btn('查看投后陪伴','go-companion','full')}</div>`:''}`;
}
function mobileCandidates(){
  const s=session();
  const ids=candidateIds();
  const compared=s.compareSet||[];
  const list=ids.map((id,i)=>{
    const p=productOf(id)||{};
    const inSet=compared.includes(id);
    return `<div class="mobile-product"><div class="between"><div><span class="badge ${i===1?'blue':''}">${esc(p.risk||'')} · ${esc(p.role||'')}</span><h3>${esc(p.name||id)}</h3></div><b class="text-blue" style="font-size:20px">${esc(p.match||'')}</b></div><div class="product-meta">${esc(p.ret||'')} 近一年 · ${esc(p.drawdown||'低波动')} 最大回撤 · 适配你的资金期限</div><div class="between"><button class="btn small" data-action="m-candidate-reason" data-product="${esc(id)}">查看理由</button><button class="link-btn" data-action="m-compare-add" data-product="${esc(id)}">${inSet?'已加入比较':'加入比较'}</button></div></div>`;
  }).join('');
  return `<div class="eyebrow">PRODUCT MATCH</div><h1>候选推荐</h1><p class="sub">根据你的目标，先给出 3 个方向，再由你确认。</p><div class="callout">已使用：${esc(goalText())}${s.plan?' · 已关联配置方案':''}</div>${s.plan?`<div class="callout good">方案占比：现金 ${s.plan.cash}% · 固收 ${s.plan.bond}% · 权益 ${s.plan.equity}% · 保障 ${s.plan.protection}%</div>`:''}${list||`<div class="card"><p>尚未生成真实候选。请先完成资产配置并生成候选，系统不会补入默认产品。</p>${btn('去做资产配置','go-allocation','primary full')}</div>`}<p class="mobile-footer-note">候选排序不替代适当性结论和客户经理判断。</p>${compared.length?`<div class="path-next">${btn(`查看比较（${compared.length}）`,'go-compare','primary full')}</div>`:''}`;
}
function mobileCompare(){
  const s=session();
  const ids=compareIds();
  const cols=ids.map(id=>productOf(id)).filter(Boolean);
  if(!cols.length){
    return `<div class="eyebrow">COMPARE</div><h1>产品比较</h1><p class="sub">用相同的时间和指标口径，看清差异。</p><div class="card compare-empty"><p>比较集为空。请先在真实候选中加入 2–3 个产品，系统不会自动补入默认产品。</p>${btn('去候选推荐','go-candidates','primary full')}</div>`;
  }
  const head=`<tr><th>指标</th>${cols.map(p=>`<th>${esc(p.short||p.name)}</th>`).join('')}</tr>`;
  const row=(label,key,cls)=>`<tr><td>${label}</td>${cols.map(p=>`<td class="${cls||''}">${esc(p[key]||'—')}</td>`).join('')}</tr>`;
  const view=viewOf()||'表现';
  const rows={
    表现:[row('区间收益','ret','positive'),row('组合角色','role')],
    风险:[row('最大回撤','drawdown'),row('风险等级','risk')],
    流动性:[row('流动性','liquidity'),row('产品类型','type')],
    费用:[row('费用','fee'),row('组合角色','role')]
  }[view]||[];
  return `<div class="eyebrow">COMPARE</div><h1>产品比较</h1><p class="sub">用相同的时间和指标口径，看清差异。当前 ${cols.length} 个产品。</p><div class="mobile-tags">${['表现','风险','流动性','费用'].map(x=>tabBtn(x,'表现')).join('')}</div><div class="card"><div class="table-wrap"><table><thead>${head}</thead><tbody>${rows.join('')}</tbody></table></div><div class="callout warn">当前视图：${esc(view)}。历史收益更高的产品，回撤和波动通常也更高。不要只看单一收益指标。业绩比较基准不代表预期收益。${s.compareSaved?' 比较结果已保存。':''}</div>${btn('保存比较结果','m-save-compare','primary full')}</div><div class="path-next">${btn('进入投后陪伴','go-companion','primary full')}</div>`;
}
function mobileCompanion(){
  const s=session();
  return `<div class="eyebrow">PORTFOLIO CARE</div><h1>投后陪伴</h1><p class="sub">跟踪产品和组合变化，决定要不要联系客户。</p>${s.plan?`<div class="callout session-flag">关联方案：${esc(goalText())} · 现金 ${s.plan.cash}% / 固收 ${s.plan.bond}% / 权益 ${s.plan.equity}%</div>`:''}<div class="card"><div class="card-head"><div><h2>本周组合复盘</h2><p class="muted">2026-09-21 至 ${esc(s.asOf||'2026-09-28')}</p></div>${statusBadge(s.careSubmitted?'已提交':'待确认',s.careSubmitted?'green':'orange')}</div><div class="grid two"><div class="mini-stat"><div class="metric-label">组合收益</div><div class="metric-value" style="font-size:21px">+0.86%</div></div><div class="mini-stat"><div class="metric-label">目标完成度</div><div class="metric-value" style="font-size:21px">68%</div></div></div><div class="callout">A500 本周波动上升，但组合整体风险仍在 R3 范围。建议先解释波动来源，再决定是否调整。</div>${btn('查看复盘详情','m-review-detail','primary full')}</div><div class="card"><div class="card-head"><h2>重要事件</h2>${statusBadge(s.remindCreated?'1 条待办已建':'2 条','orange')}</div><div class="task-line"><span class="task-dot">${icon('bolt')}</span><div class="task-text"><b>易方达中证A500净值波动</b><p>关联客户持仓 · 已生成解释材料</p></div>${btn('查看','m-event','small')}</div><div class="task-line"><span class="task-dot">${icon('clock')}</span><div class="task-text"><b>稳盈固收开放日</b><p>${s.remindCreated?'已创建开放日提醒':'还有 12 天 · 客户可申请赎回'}</p></div>${btn('提醒','m-remind','small')}</div></div><div class="card"><div class="card-head"><h2>服务建议</h2>${s.careSubmitted?statusBadge('已提交','green'):''}</div><label class="check"><input type="checkbox" checked/>发送一条波动解释给客户</label><label class="check"><input type="checkbox"/>创建电话回访任务</label>${s.careSubmitted?`<div class="callout good">已提交给客户经理确认。客户经理决定是否触达客户。</div>`:btn('提交给客户经理确认','m-submit-care','primary full')}</div>`;
}
function mobilePage(r){const x={
 'm/assistant':['AI 助手',mobileAssistant], 'm/fund':['基金诊断',mobileFund], 'm/insurance':['保险保障',mobileInsurance], 'm/wealth':['理财产品',mobileWealth], 'm/deposit':['存款测算',mobileDeposit], 'm/private':['私行产品',mobilePrivate], 'm/allocation':['资产配置',mobileAllocation], 'm/holdings':['持仓诊断',mobileHoldings], 'm/candidates':['候选推荐',mobileCandidates], 'm/compare':['产品比较',mobileCompare], 'm/companion':['投后陪伴',mobileCompanion], 'm/result':['演示结果',mobileResult]
 }[r]||['AI 助手',mobileAssistant]; return mobileStage(r,x[0],x[1]()); }

function updateDeposit(){
  const depAmount=$('#depositAmount'); const depTerm=$('#depositTerm');
  if(!depAmount||!depTerm) return;
  const rates={1:.0155,3:.0215,5:.0235};
  const principal=Number(depAmount.value)||0;
  const years=Number(depTerm.value)||1;
  const interest=Math.round(principal*(rates[years]||0)*years);
  const result=$('#depositResult'); const int=$('#depositInterest');
  if(result) result.textContent='¥'+(principal+interest).toLocaleString('zh-CN');
  if(int) int.textContent='¥'+interest.toLocaleString('zh-CN');
}
function activateSegment(btn){
  if(!btn || btn.dataset.action) return false;
  const box=btn.closest('.mobile-tags, .segment, [data-tabs], .tabs');
  if(!box) return false;
  const label=(btn.dataset.view||btn.textContent||'').trim();
  setView(label);
  rerender();
  return true;
}
let __uiBound=false;
function bindCommon(){
  if(__uiBound) return;
  __uiBound=true;
  document.addEventListener('click',e=>{
    if(e.target=== $('#globalDialog')){ $('#globalDialog').close(); return; }
    const t = e.target instanceof Element ? e.target : e.target?.parentElement;
    if(!t || typeof t.closest !== 'function') return;
    if(t.closest('.sidebar a, .nav-foot button')){
      document.body.classList.remove('nav-open');
      const mask=$('.sidebar-mask');
      if(mask) mask.hidden=true;
    }
    const actionEl=t.closest('[data-action]');
    if(actionEl){
      const href=actionEl.getAttribute('href')||'';
      const hashRoute=href.startsWith('#')?href.slice(1):'';
      if(actionEl.tagName==='A') e.preventDefault();
      if(actionEl.dataset.action==='close-dialog' && hashRoute){
        closeDialog();
        go(hashRoute);
        return;
      }
      handleAction({currentTarget:actionEl});
      return;
    }
    const hashLink=t.closest('a[href^="#"]');
    if(hashLink){
      e.preventDefault();
      const r=(hashLink.getAttribute('href')||'').slice(1);
      if(r) go(r);
      return;
    }
    const tabBtn=t.closest('.mobile-tags button, .segment button, [data-tabs] button, .tabs button.tab, .tabs > button');
    if(tabBtn && activateSegment(tabBtn)) return;
    const iconBtn=t.closest('.icon-btn');
    if(iconBtn && !iconBtn.dataset.action){
      if(!iconBtn.getAttribute('aria-label')) iconBtn.setAttribute('aria-label','筛选');
      void runBusinessCommand('record_activity',{kind:'filter-panel',title:'筛选条件'},'filter-panel',{from:route()});
    }
  });
  document.addEventListener('change',e=>{
    const el=e.target;
    if(el.hasAttribute && el.hasAttribute('data-role-switch')){ patch({role:el.value}); rerender(); return; }
    if(el.id==='allocAuth'){
      const on=!!el.checked;
      el.disabled=true;
      void (async()=>{
        try{
          await window.WealthApi.command('set_authorization',{authorized:on});
          patch({authNotice:on?'已授权使用持仓和风险测评信息':'已取消授权，生成方案前需要重新勾选'});
          openLanding('pref-updated',{name:'使用持仓和风险测评信息',on});
        }catch(error){
          showActionError(error);
        }
      })();
      return;
    }
    if(el.id==='depositTerm') updateDeposit();
    if(el.hasAttribute && el.hasAttribute('data-ui-change')){
      setUi(el.getAttribute('data-ui-change'), el.value);
      rerender();
      return;
    }
    if(el.hasAttribute && el.hasAttribute('data-ui-check')){
      setUi(el.getAttribute('data-ui-check'), el.checked?'1':'0');
      rerender();
      return;
    }
    if(el.type==='checkbox' && el.id!=='allocAuth'){
      const name=(el.closest('label')?.textContent||'选项').replace(/\s+/g,' ').trim();
      openLanding('pref-updated',{name,on:!!el.checked});
    }
  });
  document.addEventListener('input',e=>{
    const el=e.target;
    if(el.id==='depositAmount') updateDeposit();
    if(el.matches && el.matches('.table-filter, input[placeholder*="搜索"]')){
      const q=el.value.trim().toLowerCase();
      const table=el.closest('.card')?.querySelector('tbody') || $('tbody');
      if(!table) return;
      $$('tr',table).forEach(row=>row.style.display=!q||row.textContent.toLowerCase().includes(q)?'':'none');
    }
  });
  document.addEventListener('keydown',e=>{
    if(!((e.metaKey||e.ctrlKey)&&e.key==='Enter')) return;
    if(!e.target.matches || !e.target.matches('.prompt-box textarea, #mobilePrompt')) return;
    e.preventDefault();
    handleAction({currentTarget:{dataset:{action: e.target.id==='mobilePrompt'?'m-send':'ask'}}});
  });
}
let activeAiRequestToken=0;
async function runRealAiTask(taskType, input, onSuccess, landingId='ask', context={}){
  const requestToken=++activeAiRequestToken;
  const isCurrent=()=>requestToken===activeAiRequestToken;
  if(!window.WealthApi?.generate){
    patch({promptError:'共享应用服务未连接，无法执行AI 生成调用。'});
    openLanding('ai-error');
    return;
  }
  const requestId=window.WealthApi.createRequestId();
  patch({aiStatus:'RUNNING', promptError:''});
  try{
    const result=await window.WealthApi.generate({
      task_type:taskType,
      input,
      product_ids:context.product_ids||[],
      source_ids:context.source_ids||[],
      request_id:requestId
    });
    if(!isCurrent()) return;
    if(result.request_id!==requestId) throw new Error('模型响应 request_id 与请求不匹配');
    if(result.execution_mode==='fixture') result.model=`演示桩 fixture · ${result.model||'unknown'}`;
    const accepted=await onSuccess(result,isCurrent);
    if(!isCurrent()) return;
    await window.WealthApi.whenSynced();
    if(!isCurrent()) return;
    patch({aiStatus:'SUCCEEDED', promptError:''});
    await window.WealthApi.whenSynced();
    if(!isCurrent()) return;
    if(accepted===false) return;
    openLanding(landingId,{
      query:input.question||input.prompt||input.topic||'',
      topic:input.topic||'',
      ...(context.landingExtra||{}),
      aiResult:{text:result.text,citations:result.citations||[],evidence:result.evidence,execution_mode:result.execution_mode||'real',model:result.model,latency_ms:result.latency_ms}
    });
  }catch(error){
    if(!isCurrent()||error?.code==='STALE_REQUEST') return;
    patch({aiStatus:'FAILED',promptError:error?.message||'AI 生成失败'});
    openLanding('ai-error',{query:input.question||input.prompt||input.topic||''});
  }
}

function handleAction(e){
  const el=e.currentTarget;
  const action=el?.dataset?.action;
  if(!action) return;
  window.WealthActions.dispatch({action, el, productId:el?.dataset?.product, event:e});
}
function render(){
  try{
    const r=route();
    if(isMobileRoute(r)){document.body.className='is-mobile';$('#app').innerHTML=mobilePage(r);bindCommon();}
    else{document.body.className='';pcShell(r,desktopPage(r));}
  }catch(err){
    const app=$('#app');
    if(app) app.innerHTML=`<div class="restricted" style="margin:48px auto;max-width:520px"><h2>页面未能加载</h2><p>渲染过程出错，请刷新后重试。</p><p class="muted">${esc(err && err.message)}</p></div>`;
  }
}
function boot(){ if(!location.hash) location.hash='#pc/architecture'; render(); }
window.addEventListener('hashchange',render);
window.addEventListener('wealth-session-ready',(event)=>{
  if(event.detail?.newSession) activeAiRequestToken+=1;
  render();
});
window.addEventListener('wealth-data-ready',render);
window.addEventListener('wealth-session-sync-error',(event)=>{
  if(event.detail?.kind==='patch'||event.detail?.error?.code==='STALE_REQUEST') return;
  patch({promptError:event.detail?.error?.message||'共享会话同步失败'});
  openLanding('sync-error');
});
if(document.readyState==='loading') window.addEventListener('DOMContentLoaded',boot);
else boot();

// 可选的 WebMCP 入口：与页面导航共用同一状态，仅在运行环境支持时注册。
if (typeof document !== 'undefined' && document.modelContext?.registerTool) {
  const controller = new AbortController();
  Promise.resolve(document.modelContext.registerTool({name:'open_prototype_view',title:'打开原型页面',description:'打开一个财富智服原型页面。',inputSchema:{type:'object',properties:{route:{type:'string'}},required:['route'],additionalProperties:false},annotations:{readOnlyHint:false},execute(input){const target=String(input.route||'pc/architecture');const ok=(window.REQUIREMENTS||[]).some(x=>x.route===target)||target==='pc/architecture';if(!ok)throw new Error('未知原型路由');go(target);return {route:target,status:'opened'};}},{signal:controller.signal})).catch(()=>{});
  Promise.resolve(document.modelContext.registerTool({name:'read_requirement',title:'读取需求映射',description:'读取需求编号对应的原型设备和入口。',inputSchema:{type:'object',properties:{id:{type:'string'}},required:['id'],additionalProperties:false},annotations:{readOnlyHint:true},execute(input){const item=(window.REQUIREMENTS||[]).find(x=>x.id===input.id);return item?{id:item.id,title:item.title,device:item.device,route:item.route}:{error:'未找到需求'};}},{signal:controller.signal})).catch(()=>{});
}

