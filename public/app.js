/* 财富智服 · 可运行原型。所有数据为演示数据，动作只更新当前页面状态。 */
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
// The C-class 14 work items (CONTEXT.md P0 #1) are real: each one calls the
// record_activity command and the result page renders the server-written
// activity_id / created_at / data_version. None of them is "not implemented".
// Only a landing id with no writer at all resolves to not-implemented, and such
// ids are detected below instead of being listed here as if they were work items.
const NOT_IMPLEMENTED_LANDINGS = [];
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

// ---------------------------------------------------------------------------
// 真实状态读取（P-01 / P-11）
// 只展示服务端真实返回的字段；接口不可达时整块显示未连接，不回落到任何默认数字。
// ---------------------------------------------------------------------------
// P-01 reads GET /api/health read-only from this page. The shared-session
// adapter (session-sync.js) is owned by the contract agent and is not touched by
// this work; the /ready 7 checks and real 503 handling belong to the contract
// area and are registered as a follow-up task in the PR description.
const SERVICE_HEALTH = { status: 'idle', promise: null, health: null, error: '' };
const asCount = (v) => (typeof v==='number' && Number.isFinite(v)) ? v.toLocaleString('zh-CN') : '—';

// Timestamps are shown from their literal wall clock (the fixture data calendar,
// +08:00) instead of the viewer's zone so a UTC-midnight DATE never shifts a day.
const literalTime = (value) => {
  const m=typeof value==='string' && value.match(/^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2}(?::\d{2})?))?/);
  return m?`${m[1]}${m[2]?` ${m[2]}`:''}`:'';
};
const formatTime = (iso) => iso ? (literalTime(iso) || '—') : '—';
// Fetches GET /api/health once and re-renders when the real payload arrives.
// The promise is de-duplicated so re-renders cannot flood the endpoint.
function ensureServiceHealth(){
  if(SERVICE_HEALTH.status==='pending') return SERVICE_HEALTH.promise;
  // 'ok' and 'error' are terminal for this page view: a satisfied signal on its
  // own can re-render the page, so only a page-level reload reads it again.
  if(SERVICE_HEALTH.status==='idle') startServiceHealth();
  return SERVICE_HEALTH.promise;
}
function startServiceHealth(){
  SERVICE_HEALTH.status='pending';
  SERVICE_HEALTH.error='';
  SERVICE_HEALTH.promise=(async()=>{
    try{
      // This is the same real endpoint the page contract already depends on;
      // no browser-side value ever substitutes for its answer.
      const response=await fetch('/api/health',{headers:{accept:'application/json'}});
      const body=await response.json().catch(()=>null);
      if(!response.ok){
        SERVICE_HEALTH.status='error';
        SERVICE_HEALTH.health=null;
        SERVICE_HEALTH.error=`GET /api/health → HTTP ${response.status}${body?.error?.message?`：${body.error.message}`:''}`;
      }else if(!body||typeof body!=='object'||!body.dependencies){
        SERVICE_HEALTH.status='error';
        SERVICE_HEALTH.health=null;
        SERVICE_HEALTH.error='GET /api/health 返回内容缺少 dependencies，无法确认服务状态';
      }else{
        SERVICE_HEALTH.status='ok';
        SERVICE_HEALTH.health=body;
      }
    }catch(error){
      SERVICE_HEALTH.status='error';
      SERVICE_HEALTH.health=null;
      SERVICE_HEALTH.error=`GET /api/health 请求失败：${error?.message||'网络错误'}`;
    }
    if(route()==='pc/architecture') render();
    return SERVICE_HEALTH;
  })();
  return SERVICE_HEALTH.promise;
}
function apiStamp(){
  const health=SERVICE_HEALTH.health||{};
  const model=health.dependencies?.model||{};
  const fixture=health.ai_mode==='fixture'||model.execution_mode==='fixture';
  const version=health.api_version?`api_version ${esc(health.api_version)}`:'api_version 未知';
  const mode=health.ai_mode?`AI_MODE=${esc(health.ai_mode)}`:'AI_MODE 未知';
  const contract=health.frontend_contract_version?`frontend_contract_version ${esc(health.frontend_contract_version)}`:'frontend_contract_version 未知';
  return `${version} · ${contract} · ${mode} · ${fixture?'演示桩 fixture':'真实模型服务'} · 数据版本 ${esc(String(session().dataVersion||'—'))}`;
}
function serviceSections(){
  const svc=SERVICE_HEALTH;
  if(svc.status==='pending'){
    return {ok:false,text:'正在读取 GET /api/health…',badge:'读取中',tone:'blue'};
  }
  if(!svc.health){
    return {ok:false,badge:'共享应用服务未连接',tone:'red',
      text:`服务健康度不可用：GET /api/health 未返回成功响应。服务端错误：${esc(svc.error||'无响应')}。本次不展示任何默认指标，请检查共享应用服务后刷新重试。`};
  }
  // `status` is the only overall health verdict the endpoint publishes; the
  // per-dependency `ready` flags below are shown separately and honestly.
  const overall=String(svc.health.status||'');
  const tone=overall==='ok'?'green':'orange';
  return {ok:true,badge:overall?overall:'未报告',tone,
    text:`GET /api/health 已返回：服务状态 ${esc(overall||'—')}，生成时间 ${formatTime(svc.health.generated_at)}。逐项就绪判定由 GET /ready 提供，属 contract 后续任务，本页暂不展示。`};
}
function serviceSummary(){
  const svc=SERVICE_HEALTH;
  if(!svc.health){ return `<div class="callout warn"><b>共享应用服务未连接</b><p>GET /api/health 尚未返回，能力与调用量没有服务端来源，本次不展示任何默认数字。</p><p class="muted">${esc(svc.error||'等待应用服务响应')}</p></div>`; }
  const h=svc.health;
  const deps=h.dependencies||{};
  const items=[
    ['api_version',h.api_version],
    ['frontend_contract_version',h.frontend_contract_version],
    ['AI_MODE',h.ai_mode],
    ['DATA_MODE',h.data_mode],
    ['运行环境',h.node_env],
    ['规则版本期望',deps.rules?.expected_version],
    ['模型',deps.model?.model],
    ['知识库版本',deps.knowledge?.knowledge_version]
  ].filter(x=>x[1]!=null&&x[1]!=='');
  const row=(k,v)=>`<div class="stat-row"><span>${esc(k)}</span><b>${esc(String(v))}</b></div>`;
  return `<div class="list-row"><h3>服务字段（GET /api/health）</h3>${items.map(x=>row(x[0],x[1])).join('')}${row('服务生成时间',formatTime(h.generated_at))}</div>${row('知识片段数',asCount(deps.knowledge?.chunk_count))}${row('知识向量数',asCount(deps.knowledge?.vector_count))}${row('规则条目',asCount(deps.rules?.count))}`;
}
function serviceHealthCard(){
  const svc=SERVICE_HEALTH;
  if(svc.status==='pending') return `<div class="callout">正在读取服务健康度（GET /api/health）…</div>`;
  if(!svc.health) return `<div class="callout warn"><b>共享应用服务未连接</b><p>服务健康度没有服务端来源，本次不展示任何默认数字或健康徽标。</p><p class="muted">${esc(svc.error||'')}</p></div>`;
  const deps=svc.health.dependencies||{};
  // Only fields this endpoint actually returns are rendered. `dependencies.ready`
  // is the per-dependency verdict published by /api/health (it does not publish
  // the /ready check set), so a missing flag is shown as 未报告 rather than
  // inferred as healthy.
  const flag=(name,{label,yes,no,source})=>{
    const target=source||{};
    const v=target.ready;
    return {label:label||name,text:v===true?yes:v===false?no:'未报告',tone:v===true?'green':v===false?'red':'blue'};
  };
  // Some dependencies report a boolean `ok` instead of `ready`; both are the
  // endpoint's own verdict, so each is read from the field it actually returns.
  const okFlag=(name,label,source)=>{
    const target=source||{};
    const v=target.ready!==undefined?target.ready:target.ok;
    return {label:label||name,text:v===true?'正常':v===false?'异常':'未报告',tone:v===true?'green':v===false?'red':'blue'};
  };
  const cells=[
    {label:'服务状态',text:String(svc.health.status||'未报告'),tone:svc.health.status==='ok'?'green':'orange'},
    okFlag('database','数据库',deps.database),
    okFlag('shared_document_store','共享文档存储',deps.shared_document_store),
    flag('knowledge',{label:'知识库',yes:'就绪',no:'未就绪',source:deps.knowledge}),
    flag('rules',{label:'规则目录',yes:'就绪',no:'未就绪',source:deps.rules}),
    flag('contract',{label:'前后端契约',yes:'一致',no:'不一致',source:deps.contract}),
    flag('data_mode',{label:'数据模式',yes:'满足',no:'不满足',source:deps.data_mode}),
    flag('model',{label:'AI 生成服务',yes:'已配置',no:'未配置',source:modelFlag(deps.model)})
  ];
  // A healthy cell renders no badge, so its value is never squeezed out by its
  // own label; only failing / unreported cells carry one.
  const cell=(c)=>`<div class="mini-stat"><small class="muted">${esc(c.label)}</small><h3>${esc(c.text)}</h3>${c.tone==='green'?'':statusBadge(c.text,c.tone==='red'?'red':'orange')}</div>`;
  return `<div class="grid two">${cells.map(cell).join('')}</div><p class="muted">dependencies 来自 GET /api/health；GET /ready 的 7 项 checks 与真实 503 处理属 contract 后续任务，本页不展示、也不推断未返回的就绪标记。未由服务端提供的指标（如调用量、专业评测通过率）一律不展示。</p>`;
}
// /api/health publishes the model dependency as `configured`, not `ready`, so it
// is mapped explicitly; anything else is reported as 未报告.
function modelFlag(model){
  if(!model||typeof model!=='object') return {};
  return {ready:typeof model.configured==='boolean'?model.configured:undefined};
}

// ---------------------------------------------------------------------------
// Read-only calculation endpoints (P-04 deposit / P-15 portfolio)
// The browser never computes business results and never invents a
// calculation_id: every number on these pages comes from the server answer.
// While the endpoint is not merged yet it answers 404/503, and the page shows
// an explicit "服务端计算暂不可用" block instead of falling back to any
// hardcoded amount or a default rate.
// ---------------------------------------------------------------------------
const DEPOSIT_ENDPOINT='/api/calculations/deposit';
const PORTFOLIO_ENDPOINT='/api/calculations/portfolio';
const CALC_ENDPOINTS={deposit:DEPOSIT_ENDPOINT,portfolio:PORTFOLIO_ENDPOINT};
const CALC_STORES={deposit:{kind:'deposit',status:'idle',promise:null,data:null,error:'',key:''},portfolio:{kind:'portfolio',status:'idle',promise:null,data:null,error:'',key:''}};
const CALC_ROUTES=new Set(['pc/product-deposit','m/deposit','m/holdings','m/companion']);
const calcEndpoint=(kind)=>CALC_ENDPOINTS[kind]||kind;
// Query string is built from explicit values only: a missing input stays absent
// so the server, not this page, decides whether it is valid.
function calcQuery(params){
  const q=new URLSearchParams();
  Object.entries(params||{}).forEach(([k,v])=>{
    if(v===undefined||v===null||v==='') return;
    q.set(k,String(v));
  });
  return q.toString();
}
function depositServerInput(){
  const p=productOf('deposit');
  if(!p) return null;
  // The contract accepts the rate as a percentage rate plus an explicit unit.
  // The server snapshot stores it as a decimal (0.0215 = 2.15%); multiplying by
  // 100 is unit bookkeeping for the request, not a business calculation, and
  // rate_unit travels with the value. A value the page cannot express in that
  // unit is NOT repaired here: the request is left to the server, whose own
  // validation decides (VALIDATION_ERROR), and the page shows that error.
  const raw=p.annual_rate;
  if(raw===null||raw===undefined||raw==='') return null;
  const rate=typeof raw==='number'&&Number.isFinite(raw)?raw*100:raw;
  return {principal:500000,annual_rate:rate,years:3,rate_unit:'percent',product_id:p.id};
}
function depositNumericProblem(){
  const p=productOf('deposit');
  if(!p||p.annual_rate===null||p.annual_rate===undefined||p.annual_rate==='') return '';
  if(typeof p.annual_rate!=='number') return '服务端产品快照以字符串（NUMERIC）返回挂牌年利率，服务端只读计算拒绝该输入，因此未返回本息。页面不会在浏览器把字符串转换成数字来计算。';
  return '';
}
// The endpoints read PostgreSQL data, where NUMERIC is returned as a string.
// The page never converts those values to compute anything: a string amount is
// rejected by the server's own calculation, so it is reported as the server's
// failure instead of being repaired in the browser.
function hasNumericAmount(holding){
  return typeof holding?.amount==='number'&&Number.isFinite(holding.amount);
}
function portfolioNumericProblem(){
  const rows=sessionApi()?.HOLDINGS||[];
  if(!rows.length) return '';
  const bad=rows.filter(row=>!hasNumericAmount(row));
  const count=bad.length;
  return `${count} 笔持仓的金额由数据库以字符串（NUMERIC）返回，服务端持仓计算拒绝该输入，因此未返回任何收益或集中度。页面不会在浏览器把它转换成数字来补算。`;
}
function ensureCalc(kind,params){
  const store=CALC_STORES[kind];
  if(!store) return null;
  // Both endpoints resolve the caller's authorization from the shared session
  // (session_id). Reading before the session adapter is connected would only
  // produce a 400 "生产数据查询必须携带有效 session_id" that this page cannot
  // fix, so the read waits for the session instead of inventing a result.
  const sessionId=sessionApi()?.sessionId?.();
  if(!sessionApi()?.isConnected?.()||!sessionId) return null;
  const endpoint=calcEndpoint(kind);
  const query=calcQuery({...params,session_id:sessionId});
  const key=`${endpoint}?${query}`;
  if(store.status==='pending'||store.status==='ok'||store.status==='unsupported') return store.promise;
  if(store.status==='error'&&store.key===key) return store.promise;
  store.status='pending'; store.key=key; store.error=''; store.data=null;
  store.promise=(async()=>{
    const suffix=query?`?${query}`:'';
    try{
      const response=await fetch(`${endpoint}${suffix}`,{headers:{accept:'application/json'}});
      const body=await response.json().catch(()=>null);
      if(response.ok&&body&&typeof body==='object'){
        store.status='ok'; store.data=body;
      }else if(response.status===404||response.status===501){
        // Not merged / not routed yet: an explicit unavailable state, never a
        // silent success and never a hardcoded fallback.
        store.status='unsupported';
        store.error=`GET ${endpoint} 返回 HTTP ${response.status}（接口尚未提供）`;
      }else{
        store.status='error'; store.data=body;
        store.error=`GET ${endpoint} → HTTP ${response.status}${body?.error?.code?` ${body.error.code}`:''}${body?.error?.message?`：${body.error.message}`:''}`;
      }
    }catch(error){
      store.status='error'; store.data=null;
      store.error=`GET ${endpoint} 请求失败：${error?.message||'网络错误'}`;
    }
    if(CALC_ROUTES.has(route())) render();
    return store;
  })();
  return store.promise;
}

// A calculation is only "successful" when the server answered 2xx with the
// result fields the page needs; everything else is shown as a real state.
// Returns null for the success state so each page renders the server fields.
function calcStateView(store,{what}){
  const endpoint=calcEndpoint(store.kind);
  if(store.status==='idle'||store.status==='pending'){
    return {tone:'blue',badge:'读取中',lead:'<b>读取中</b>',body:`<p>正在读取 GET ${esc(endpoint)}…</p>`};
  }
  if(store.status==='unsupported'){
    return {tone:'red',badge:'服务端计算暂不可用',lead:'<b>服务端计算暂不可用</b>',body:`<p>${esc(what)}尚未由服务端计算接口给出，系统不会在浏览器计算，也不会用任何硬编码金额或默认利率补位。</p><p class="muted">${esc(store.error||'')}</p>`};
  }
  if(store.status==='error'){
    // The contract may report the failure as a top-level `status`
    // (e.g. 422 UNSUPPORTED_RULE) or as `error{code,message}`.
    const code=store.data?.error?.code||(store.data?.status&&store.data.status!=='MATCHED'?String(store.data.status):'');
    const message=store.data?.error?.message||store.error||'';
    const numericNote=store.kind==='portfolio'?portfolioNumericProblem():'';
    return {tone:'red',badge:code?`服务端错误 ${esc(code)}`:'服务端错误',lead:`<b>服务端计算失败${code?`（${esc(code)}）`:''}</b>`,body:`<p>${esc(what)}未获得服务端结果，本次不展示任何金额。</p><p class="muted">${esc(message)}</p>${numericNote?`<p class="muted">${esc(numericNote)}</p>`:''}`};
  }
  return null;
}
const calcRow=(k,v)=>`<div class="stat-row"><span>${esc(k)}</span><b>${v==null||v===''?'—':esc(String(v))}</b></div>`;
// pg sends NUMERIC as strings; tolerate both when printing a server value.
const numOrNull=(v)=>{
  if(v===null||v===undefined||v==='') return null;
  const n=typeof v==='number'?v:Number(String(v).replace(/[¥￥,\s]/g,''));
  return Number.isFinite(n)?n:null;
};
const calcIdRow=(id)=>`<div class="stat-row"><span>calculation_id</span><b><code>${esc(String(id||'—'))}</code></b></div>`;
const ratioToPct=(v)=>{ const n=numOrNull(v); return n==null?'—':`${(n*100).toFixed(2)}%`; };
const cny=(v)=>v==null?'—':`¥${Number(v).toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2})}`;

function pageArchitecture(){
  const svc=serviceSections();
  // Kicking the read here (not at boot) keeps every other route free of an
  // extra request; a second render reuses the in-flight promise.
  ensureServiceHealth();
  const blocks=[
    {title:'服务健康度',head:serviceHealthCard()},
    {title:'服务字段',head:serviceSummary()}
  ];
  const main=svc.ok
    ? blocks.map(b=>`<div class="card"><div class="between"><h3>${b.title}</h3>${statusBadge(svc.badge,svc.tone)}</div>${b.head}</div>`).join('')
    : svc.badge==='读取中'
      ? `<div class="card"><div class="between"><h3>服务健康度与能力指标</h3>${statusBadge('读取中','blue')}</div><div class="callout">正在读取 GET /api/health…</div></div>`
      : `<div class="card"><div class="between"><h3>服务健康度与能力指标</h3>${statusBadge('共享应用服务未连接','red')}</div><div class="callout warn"><b>共享应用服务未连接</b><p>GET /api/health 未返回成功响应，能力指标与健康度没有服务端来源。本次不展示任何默认数字，也没有展示成功结果。</p><p class="muted">服务端错误：${esc(SERVICE_HEALTH.error||'—')}</p></div></div>`;
  return pageHeading('CONTROL TOWER','AI 财富管理智能服务中台','面向全集团统一运营的能力总览。本页指标只来自共享应用服务（GET /api/health），无服务端来源的指标不展示。',btn('需求清单','requirements','light')+btn('进入投研工作台','go-workspace','primary'))
    +`<div class="insight-banner"><span class="insight-kicker">实时态</span><div><b>${esc(apiStamp())}</b><p class="muted" style="margin:4px 0 0">${esc(svc.text)}</p></div></div>`
    +`<div class="grid main-aside"><div class="stack">${main}<div class="card"><div class="card-head"><div><h2>能力编排总览</h2><p class="muted">从数据、知识到可交付服务的受控链路</p></div></div><div class="flow"></div></div></div>`
    +`<aside class="stack"><div class="card"><div class="card-head"><h2>近期任务</h2><button class="link-btn" data-action="task-center">任务中心 ${icon('arrow')}</button></div><div class="task-line"><span class="task-dot">${icon('bell')}</span><div class="task-text"><b>当前无待处理事项</b><p>应用服务没有提供待处理事项，本页不展示默认条数。</p></div>${statusBadge('空态','blue')}</div></div>`
    +`<div class="card"><div class="card-head"><h2>运营提醒</h2>${statusBadge('空态','blue')}</div><div class="list-row"><h3>当前无运营提醒</h3><p class="muted">应用服务未提供提醒数据，演示数值已移除。</p></div></div>`
    +`<div class="card"><div class="card-head"><h2>调用趋势</h2>${statusBadge('未提供','blue')}</div><div class="callout">应用服务当前没有提供调用量时序数据，趋势图与峰值不展示。</div></div></aside></div>`;
}

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
    ? `<div class="card"><div class="card-head"><h2>本次研究回答</h2><span class="muted">数据时点 ${esc(s.asOfFull||'—')}</span></div><div class="chat-bubble"><div class="chat-name">${icon('spark')} 财富智服 · 研究回答</div><p><b>问题：</b>${esc(ans.question)}</p><p>${esc(ans.text)}</p><div class="chips">${(ans.sources||[]).map(x=>`<button class="source" data-action="source-detail">${esc(x)}</button>`).join('')}</div></div><div class="callout warn">研究参考，不构成投资建议。候选排序不替代适当性结论。</div>${btn('查看候选解释','go-pc-candidates','primary full')}</div>`
    : `<div class="card"><div class="card-head"><h2>最近使用</h2><button class="link-btn" data-action="go-research">打开研究台 ${icon('arrow')}</button></div><div class="task-line"><span class="task-dot">${icon('book')}</span><div class="task-text"><b>当前无最近使用记录</b><p>应用服务没有提供个人工作区条目，本页不展示演示草稿。</p></div>${statusBadge('空态','blue')}</div></div>`;
  // H-01：最近使用、推荐任务与消息提醒只显示服务端 activities[] 的真实记录
  // （activity_id / created_at / data_version）；服务端没有个人工作区存储，
  // 也就没有推荐任务来源，列表为空时给显式空态，不用演示待办或固定条数补齐。
  const activities=(s.activities||[]);
  const recent=activities.slice(-3).reverse();
  const activityRow=(a)=>`<div class="list-row"><h3>${esc(a.title||a.kind)}</h3><p class="muted">${esc(a.kind)} · ${esc(String(a.created_at||''))} · <code>${esc(String(a.activity_id||''))}</code> · 数据版本 ${esc(String(a.data_version||''))}</p></div>`;
  const alerts=recent;
  const alertCard=`<div class="card"><div class="card-head"><h2>消息提醒</h2>${statusBadge(alerts.length?`${alerts.length} 条`:'空态',alerts.length?'orange':'blue')}</div>${alerts.length?alerts.map(a=>`<div class="list-row"><h3>${esc(a.title||a.kind)}</h3><p class="muted">${esc(a.kind)} · ${esc(String(a.created_at||''))}</p></div>`).join(''):'<div class="list-row"><h3>当前无消息提醒</h3><p class="muted">应用服务没有写入提醒记录。</p></div>'}</div>`;
  const recentCard=recent.length
    ? `<div class="card"><div class="card-head"><h2>最近使用</h2>${statusBadge(`服务端记录 ${activities.length} 条`,'green')}</div>${recent.map(activityRow).join('')}${btn('查看全部服务端记录','workspace','primary full')}</div>`
    : `<div class="card"><div class="card-head"><h2>最近使用</h2>${statusBadge('空态','blue')}</div><div class="task-line"><span class="task-dot">${icon('book')}</span><div class="task-text"><b>当前无最近使用记录</b><p>应用服务没有写入个人工作区记录；系统不展示演示草稿或推荐任务。</p></div></div>${btn('查看服务端记录','workspace','full')}</div>`;
  const recommendCard=`<div class="card"><div class="card-head"><h2>推荐任务</h2>${statusBadge('未提供','blue')}</div><div class="callout">应用服务没有推荐任务的数据来源，本页不展示演示待办；可从上方输入问题，或在「按权限可用」选择本岗位的入口。</div></div>`;
  return pageHeading('ROLE WORKSPACE','投研工作台',`按岗位展示最近使用、推荐任务和授权成果。当前身份：${esc(role)}。`,btn('打开智能问答','go-research','primary'))+`<div class="grid main-aside"><div class="stack"><div class="card"><div class="card-head"><div><h2>今天从哪里开始？</h2><p class="muted">可以直接输入问题，也可以从本岗位的可用入口开始。</p></div>${SERVICE_HEALTH.health?'已连接共享应用服务':'共享应用服务未连接'}</div><div class="prompt-box"><textarea id="workspacePrompt" placeholder="例如：比较固收+产品近一年回撤，并给出客户经理可解释的话术">${esc((ans&&ans.question)||'')}</textarea><div class="prompt-footer"><span class="muted">${icon('shield')} 只使用当前岗位有权访问的资料</span>${btn('开始分析','ask','primary')}</div></div><div class="prompt-quick"><button data-action="quick-prompt">生成本周客户持仓复盘</button><button data-action="quick-prompt">解释最新宏观数据</button><button data-action="quick-prompt">找 3 只稳健型候选产品</button></div></div>${answerCard}${recentCard}</div><aside class="stack"><div class="card"><div class="card-head"><h2>按权限可用</h2>${statusBadge(role,'blue')}</div>${caps.map(x=>`<div class="list-row"><h3>${x[0]}</h3><p class="muted">${x[1]}</p></div>`).join('')}</div>${recommendCard}${alertCard}</aside></div>`;
}

const fmtPct = value => (value==null?'—':`${(Number(value)*100).toFixed(2)}%`);
// DemoSession.PRODUCTS is the live product map: demo-data.js seeds it and
// session-sync.js replaceData() swaps it for the server snapshot in place.
const productRows = () => Object.values(sessionApi()?.PRODUCTS || {});
// Server product facts (GET /api/demo-data). Each tab maps to real product
// types; a product that the service does not return is never filled in here.
const PANEL_SPECS={
  fund:{types:['基金'],ey:'FUND INTELLIGENCE',title:'基金产品洞察',sub:'按统一口径查看基金档案、业绩、风险、经理与持仓，并形成可解释候选。',tabs:['基金概览','基金通识'],color:'#4673da'},
  insurance:{types:['保险'],ey:'INSURANCE INTELLIGENCE',title:'保险产品洞察',sub:'从保障责任、除外责任、缴费安排到理赔服务，辅助投保前咨询与保单检视。',tabs:['保障比较','保险通识'],color:'#59a89a'},
  wealth:{types:['理财'],ey:'WEALTH PRODUCT',title:'理财产品洞察',sub:'区分业绩比较基准、历史收益和实际持有收益，清楚说明期限、流动性和费用。',tabs:['产品筛选','办理流程'],color:'#bc9148'},
  deposit:{types:['存款'],ey:'DEPOSIT INTELLIGENCE',title:'存款产品洞察',sub:'用相同金额、币种、期限和渠道比较利率，解释计息方式与提前支取影响。',tabs:['利率比较','产品通识'],color:'#5b83c9'}
};
const productMeta = (id) => ((sessionApi()?.HOLDING_BY_PRODUCT||{})[id] || null);

// ---------------------------------------------------------------------------
// Product facts shared by the product-insight pages (P-02 / P-03 / P-06 / P-08 / P-14)
// The browser keeps no business numbers: these helpers only read what
// GET /api/demo-data already published into the live session map, and every
// value the service did not return is shown as 未提供 / 空态 instead of a default.
// ---------------------------------------------------------------------------
const PRODUCT_CATALOG = { status: 'idle', promise: null, body: null, error: '' };
const PRODUCT_CATALOG_ROUTES = new Set(['pc/product-fund','pc/product-insurance','pc/product-wealth','m/wealth','pc/supply','pc/library']);
// Only the live session map (replaced in place by session-sync.js from
// /api/demo-data) is read here; the pre-sync DemoSession seed is not server data.
function serverProductRows(type){
  const connected=sessionApi()?.isConnected?.()===true;
  // productRows() reads the live map directly, so a concurrent replaceData()
  // can momentarily yield empty slots; those are skipped, never filled in.
  const rows=connected?productRows().filter(p=>p&&typeof p==='object'):[];
  return type?rows.filter(p=>p.type===type):rows;
}
// Monetary NUMERIC values arrive as strings from PostgreSQL; the page only
// formats them and never derives an amount of its own.
function amountText(value){
  const n=numOrNull(value);
  return n==null?'':`¥${n.toLocaleString('zh-CN',{maximumFractionDigits:0})}`;
}
// Sale status is printed only from the server field: an unknown value is shown
// verbatim rather than being upgraded to 可售.
const SALE_STATUS_LABEL={ON_SALE:'可售',OFF_SALE:'暂不可售',SUSPENDED:'暂停销售'};
function saleStatusOf(product){
  const raw=product?.sale_status;
  if(raw===null||raw===undefined||raw==='') return {known:false,raw:'',label:'未提供',onSale:false};
  return {known:true,raw:String(raw),label:SALE_STATUS_LABEL[String(raw)]||String(raw),onSale:String(raw)==='ON_SALE'};
}
// Server product facts are also published as one read-only snapshot so a page
// can show that the list was loaded (and say so), not as a business value.
function ensureProductCatalog(){
  if(PRODUCT_CATALOG.status==='pending') return PRODUCT_CATALOG.promise;
  if(PRODUCT_CATALOG.status==='ok'||PRODUCT_CATALOG.status==='error') return PRODUCT_CATALOG.promise;
  const sessionId=sessionApi()?.sessionId?.();
  if(!sessionApi()?.isConnected?.()||!sessionId) return null;
  PRODUCT_CATALOG.status='pending';
  PRODUCT_CATALOG.promise=(async()=>{
    try{
      const response=await fetch(`/api/demo-data?session_id=${encodeURIComponent(sessionId)}`,{headers:{accept:'application/json'}});
      const body=await response.json().catch(()=>null);
      if(!response.ok||!body){
        PRODUCT_CATALOG.status='error';
        PRODUCT_CATALOG.body=body;
        PRODUCT_CATALOG.error=`GET /api/demo-data → HTTP ${response.status}${body?.error?.code?` ${body.error.code}`:''}${body?.error?.message?`：${body.error.message}`:''}`;
      }else{
        PRODUCT_CATALOG.status='ok';
        PRODUCT_CATALOG.body=body;
        PRODUCT_CATALOG.error='';
      }
    }catch(error){
      PRODUCT_CATALOG.status='error';
      PRODUCT_CATALOG.body=null;
      PRODUCT_CATALOG.error=`GET /api/demo-data 请求失败：${error?.message||'网络错误'}`;
    }
    if(PRODUCT_CATALOG_ROUTES.has(route())) render();
    return PRODUCT_CATALOG;
  })();
  return PRODUCT_CATALOG.promise;
}
function productCatalogView(){
  if(PRODUCT_CATALOG.status==='error'){
    return {ok:false,tone:'red',badge:'共享数据加载失败',lead:'<b>共享数据加载失败</b>',body:`<p>产品事实未能从共享应用服务加载，本页不展示任何静态或演示行。</p><p class="muted">${esc(PRODUCT_CATALOG.error||'')}</p>`};
  }
  if(PRODUCT_CATALOG.status!=='ok'){
    return {ok:false,tone:'blue',badge:'读取中',lead:'<b>读取中</b>',body:`<p>正在读取 GET /api/demo-data…</p><p class="muted">${esc(PRODUCT_CATALOG.error||'第 1 次读取未能确认服务端状态，正在重试。')}</p>`};
  }
  return null;
}

// P-02: 观察区间. The service snapshot publishes ONE interval return per
// product (latest_return) together with its data time point; it does not
// publish 近三年 / 成立以来 series. Therefore only the interval that the
// server actually names can be shown, and any other choice is an explicit
// 该区间无数据 empty state that changes the data, never just a label.
const FUND_INTERVALS=['近一年','近三年','成立以来'];
const FUND_INTERVAL_DEFAULT='近一年';
function fundInterval(){
  const picked=uiOf('interval',FUND_INTERVAL_DEFAULT);
  return FUND_INTERVALS.includes(picked)?picked:FUND_INTERVAL_DEFAULT;
}
function fundIntervalFact(product,interval){
  const available=interval===FUND_INTERVAL_DEFAULT&&product?.latest_return!=null;
  return {
    interval,
    available,
    label:available?'近一年收益率':'该区间暂无数据',
    value:available?ratioToPct(numOrNull(product.latest_return)):'',
    as_of:available?(literalTime(product.source_timestamp)||product.source_timestamp||''):'',
    source_id:available?(product.source_id||''):'',
    reason:available?'':'GET /api/demo-data 只返回一个区间（近一年）的收益率，没有该区间的收益与回撤序列，系统不用其他区间或示意曲线补位'
  };
}
function panelProducts(type){
  const spec=PANEL_SPECS[type]||PANEL_SPECS.fund;
  return productRows().filter(p=>spec.types.includes(p.type));
}
function productFactsCard(p){
  const holding=productMeta(p.id);
  const rows=[
    ['产品类型',p.type],
    ['风险等级',p.risk],
    ['流动性',p.liquidity],
    ['组合角色',p.role],
    ['区间收益',p.ret],
    ['最大回撤',p.drawdown],
    ['费率',p.fee],
    // Only fields the service actually returns are rendered; a product type
    // without an annual rate (fund, wealth, insurance) must not show "—" rows.
    ['挂牌年利率',p.annual_rate==null?null:fmtPct(p.annual_rate)],
    ['保障额度',p.coverage==null?null:`¥${Number(p.coverage).toLocaleString('zh-CN')}`],
    ['年度保费',p.annual_premium==null?null:`¥${Number(p.annual_premium).toLocaleString('zh-CN')}`],
    ['可售状态',p.sale_status],
    ['数据来源',p.source_id],
    ['数据时点',literalTime(p.source_timestamp)||p.source_timestamp],
    ['当前持仓',holding?`¥${Number(holding.amount||0).toLocaleString('zh-CN')}`:null]
  ].filter(r=>r[1]!=null&&r[1]!=='');
  return rows.map(r=>`<div class="stat-row"><span>${esc(r[0])}</span><b>${esc(String(r[1]))}</b></div>`).join('');
}

// P-04: the deposit maturity amount comes only from the read-only deposit
// calculation endpoint. The input rate is the product's own annual_rate from
// the server snapshot (transmitted with an explicit rate_unit), so no page
// invents a default 2.15% and no amount is computed in the browser.
// Response shape published by the contract: { status:'MATCHED', rule_id,
// rule_version, calculation_id, result{ principal, annual_rate, years,
// interest, maturity_amount, formula }, source{...} }.
function depositResultBody(body){
  const result=body?.result||{};
  const source=body?.source||{};
  const lines=[
    calcRow('本金',cny(result.principal)),
    calcRow('年利率',ratioToPct(result.annual_rate)),
    calcRow('期限（年）',result.years),
    calcRow('利息',cny(result.interest)),
    calcRow('到期本息',cny(result.maturity_amount)),
    calcRow('公式',result.formula),
    calcRow('利率来源',source.source_id||source.description||source.name||'—'),
    calcRow('数据时点',formatTime(source.source_timestamp||source.data_as_of)||'—'),
    calcRow('规则版本',body?.rule_version)
  ];
  return `<div class="list-row">${lines.join('')}${calcIdRow(body?.calculation_id)}</div>`;
}
function depositCard(title,{emptyText,pendingText}){
  const dep=productOf('deposit');
  const input=depositServerInput();
  if(!dep||!input){
    return `<div class="card"><div class="card-head"><h2>${esc(title)}</h2>${statusBadge('空态','blue')}</div><div class="callout"><b>该期限暂无挂牌利率</b><p>GET /api/demo-data 没有返回可用的存款产品与挂牌年利率，本页不套用默认利率，也不展示任何本息金额。</p></div></div>`;
  }
  ensureCalc('deposit',input);
  const store=CALC_STORES.deposit;
  const view=calcStateView(store,{what:'存款到期本息'});
  if(view){
    const tone=view.tone==='red'?'red':'blue';
    if(view.badge==='读取中'){
      return `<div class="card"><div class="card-head"><h2>${esc(title)}</h2>${statusBadge('读取中',tone)}</div><div class="callout">${esc(pendingText||'正在读取服务端存款本息计算…')}</div></div>`;
    }
    return `<div class="card"><div class="card-head"><h2>${esc(title)}</h2>${statusBadge(view.badge,tone)}</div><div class="callout ${view.tone==='red'?'warn':''}">${view.lead}${view.body}</div></div>`;
  }
  const result=store.data?.result||{};
  if(!result||result.maturity_amount==null||result.interest==null){
    const note=depositNumericProblem();
    return `<div class="card"><div class="card-head"><h2>${esc(title)}</h2>${statusBadge('无挂牌利率','blue')}</div><div class="callout"><b>${esc(emptyText||'该期限暂无挂牌利率')}</b><p>服务端没有返回该期限的计息结果，本页不展示任何本息金额，也不套用默认利率。</p>${note?`<p class="muted">${esc(note)}</p>`:''}</div></div>`;
  }
  return `<div class="card"><div class="card-head"><h2>${esc(title)}</h2>${statusBadge('服务端计算结果','green')}</div>${depositResultBody(store.data)}<div class="callout warn">利率取自服务端产品快照（${esc(dep.name||'')} · 数据时点 ${esc(literalTime(dep.source_timestamp)||'—')}）；到期本息为单利测算，不构成收益承诺。</div></div>`;
}

function productPage(type){
  const spec=PANEL_SPECS[type]||PANEL_SPECS.fund;
  const view=viewOf()||spec.tabs[0];
  ensureProductCatalog();
  const catalog=productCatalogView();
  if(catalog){
    return pageHeading(spec.ey,spec.title,spec.sub,btn('生成一页纸','onepager','primary'))+`<div class="card"><div class="card-head"><h2>产品事实</h2>${statusBadge(catalog.badge,catalog.tone)}</div><div class="callout ${catalog.tone==='red'?'warn':''}">${catalog.lead}${catalog.body}</div></div>`;
  }
  const products=panelProducts(type);
  // Only 基金 / 理财 surface an interval return; the other panels have no
  // interval dimension, so they show no interval control or empty interval card.
  const hasInterval=spec.types.some(t=>t==='基金'||t==='理财');
  const interval=hasInterval?fundInterval():'';
  if(!products.length){
    return pageHeading(spec.ey,spec.title,spec.sub,btn('保存到工作区','save',''))+`<div class="card"><div class="callout warn"><b>当前无可用产品数据</b><p>GET /api/demo-data 没有返回「${esc(spec.types.join(' · '))}」类产品，本页不展示任何演示产品。</p></div></div>`;
  }
  const pickId=uiOf('productId', products[0].id);
  const product=products.find(x=>x.id===pickId)||products[0];
  const current=product;
  // P-02: the interval is read as a server fact. Selecting an interval the
  // service does not publish changes the DATA (to an explicit empty state),
  // not just the label.
  const intervalFact=hasInterval?fundIntervalFact(current,interval):null;
  const intervalPick=p=>hasInterval?fundIntervalFact(p,interval):null;
  const dataAsOf=literalTime(current.source_timestamp)||'—';
  const picker=products.map(p=>{
    const f=intervalPick(p);
    return `<button type="button" class="catalog-item ${p.id===current.id?'active':''}" data-action="pick-ui" data-ui-key="productId" data-ui-value="${esc(p.id)}"><b>${esc(p.name)}</b><small>${esc(p.type||'')}${f?` · ${esc(f.available?f.value:'该区间暂无数据')}`:''}</small></button>`;
  }).join('');
  const intervalMetric=intervalFact.available&&hasInterval
    ? ['近一年收益率',intervalFact.value]
    : [hasInterval?`${interval}收益率`:'区间收益',hasInterval?'该区间暂无数据':'未提供'];
  const metrics=type==='fund'
    ? [intervalMetric,['最大回撤',current.drawdown||'未提供'],['组合角色',current.role||'未提供']]
    : type==='insurance'
      ? [['风险等级',current.risk],['组合角色',current.role],['流动性',current.liquidity]]
      : type==='wealth'
        ? [intervalMetric,['最大回撤',current.drawdown||'未提供'],['流动性',current.liquidity]]
        : [['挂牌年利率',current.annual_rate==null?'未提供':fmtPct(current.annual_rate)],['起售金额',current.min_amount==null?'未提供':amountText(current.min_amount)],['流动性',current.liquidity]];
  function overviewCard(){
    return `<div class="card"><div class="card-head"><div><h2>${esc(current.name)}</h2><p class="muted">当前板块：${esc(view)} · ${esc(current.type||'')} · ${hasInterval?`观察区间 ${esc(interval)} · `:''}数据时点 ${esc(dataAsOf)}</p></div></div><div class="grid three">${metrics.map(m=>`<div class="mini-stat"><div class="metric-label">${esc(m[0])}</div><div class="metric-value" style="font-size:21px">${esc(m[1]==null?'未提供':String(m[1]))}</div></div>`).join('')}</div><div class="legend"><span><i class="swatch" style="background:${spec.color}"></i>${esc(view)}</span><button class="source" data-action="source-detail">数据来源：${esc(current.source_id||'未提供')}</button></div></div>`;
  }
  function intervalCard(){
    if(intervalFact.available){
      return `<div class="card"><div class="card-head"><h2>观察区间：${esc(interval)}</h2>${statusBadge('服务端事实','green')}</div>${calcRow('区间',intervalFact.interval)}${calcRow('收益率',intervalFact.value)}${calcRow('口径字段','products[].latest_return')}${calcRow('数据时点',intervalFact.as_of||'未提供')}${calcRow('数据来源',intervalFact.source_id||'未提供')}<p class="muted">收益率取自 GET /api/demo-data 的产品快照；应用服务只发布一个区间（近一年）的收益率，选择其他区间会显示空态而不是沿用该值。</p></div>`;
    }
    return `<div class="card"><div class="card-head"><h2>观察区间：${esc(interval)}</h2>${statusBadge('空态 · 该区间无数据','blue')}</div><div class="callout warn"><b>该区间暂无数据</b><p>${esc(intervalFact.reason)}。</p><p class="muted">产品：${esc(current.name||current.id)} · 数据时点 ${esc(dataAsOf)}</p></div></div>`;
  }
  // P-02 / P-03: fields the specification asks for but the snapshot does not
  // carry are listed as 无真实来源 with an explicit empty state; they are never
  // back-filled by the page.
  function unsourcedFactsCard(){
    const wanted=type==='fund'
      ? [['净值序列','products[] 未返回净值或净值时序'],['费率结构','仅返回单一管理费字段'],['规模','products[] 未返回规模字段'],['持仓与行业分布','products[] 未返回持仓/行业分布'],['基金经理','products[] 未返回基金经理']]
      : [['保单（保单号 / 生效日 / 续保日）','products[] 只有产品事实，没有保单记录来源'],['理赔服务进度','没有理赔数据来源'],['管理人注册资本 / 在管规模','products[] 未返回管理人字段，原有静态数字已删除'],['审计信息','没有审计数据来源']];
    return `<div class="card"><div class="card-head"><h2>暂未由服务端提供的字段</h2>${statusBadge('空态','blue')}</div><p class="muted">以下字段在规格中出现，但共享应用服务的产品快照没有对应字段。本页如实列为空态，不用演示数值补齐。</p>${wanted.map(([k,v])=>`<div class="stat-row"><span>${esc(k)}</span><b class="muted">未提供 · ${esc(v)}</b></div>`).join('')}</div>`;
  }
  // P-03: 保险页的「我的保单 / 理赔 / 通识」板块没有服务端来源，不展示为事实。
  function insuranceBoardsCard(){
    return `<div class="card"><div class="card-head"><h2>我的保单与理赔服务</h2>${statusBadge('空态','blue')}</div><div class="callout warn"><b>未授权或暂无可展示保单</b><p>共享应用服务没有返回保单记录（保单号、生效日、续保日、理赔进度均无来源），本页不展示任何保单卡片、续保日期或理赔时间线。</p></div></div>`;
  }
  function factsCard(){
    return `<div class="card"><div class="card-head"><h2>产品事实</h2><span class="muted">GET /api/demo-data</span></div>${productFactsCard(current)}<div class="callout warn">以上字段均取自共享应用服务的产品快照；业绩比较基准不代表预期收益。</div></div>`;
  }
  let main='';
  if(type==='deposit'&&view==='利率比较'){
    main=`<div class="card"><div class="card-head"><h2>同金额利率比较</h2><span class="muted">服务端产品快照</span></div><div class="table-wrap"><table><thead><tr><th>产品</th><th>风险</th><th>挂牌年利率</th><th>起售金额</th><th>流动性</th></tr></thead><tbody>${products.map(p=>`<tr${p.id===current.id?' style="background:#ebf1ff"':''}><td><b>${esc(p.name)}</b></td><td>${esc(p.risk||'—')}</td><td>${p.annual_rate==null?'—':fmtPct(p.annual_rate)}</td><td>${p.min_amount==null?'—':`¥${Number(p.min_amount).toLocaleString('zh-CN')}`}</td><td>${esc(p.liquidity||'—')}</td></tr>`).join('')}</tbody></table></div></div>${depositCard('测算工具（服务端计算）',{emptyText:'该期限暂无挂牌利率'})}`+(hasInterval?intervalCard():'')+factsCard();
  }else if(view==='办理流程'){
    main=`<div class="card"><div class="card-head"><h2>办理流程</h2></div><div class="timeline"><div class="timeline-item"><span class="step-circle done">${icon('check')}</span><div class="step-copy"><b>适当性匹配</b><p>风险等级、投资期限与 ${esc(current.liquidity||'持有期')} 核对。</p></div></div><div class="timeline-item"><span class="step-circle current">2</span><div class="step-copy"><b>阅读材料</b><p>说明书、风险揭示书、业绩比较基准说明。</p></div></div><div class="timeline-item"><span class="step-circle">3</span><div class="step-copy"><b>下单与确认</b><p>以业务系统确认结果为准，原型不发起真实交易。</p></div></div></div></div>`+factsCard();
  }else if(view==='保障比较'){
    main=`<div class="card"><div class="card-head"><h2>保障责任比较</h2><span class="muted">当前选中：${esc(current.name)}</span></div><div class="table-wrap"><table><thead><tr><th>产品</th><th>风险</th><th>组合角色</th><th>流动性</th><th>费率</th><th>可售状态</th></tr></thead><tbody>${products.map(p=>{const sale=saleStatusOf(p); return `<tr${p.id===current.id?' style="background:#ebf1ff"':''}><td><b>${esc(p.name)}</b></td><td>${esc(p.risk||'—')}</td><td>${esc(p.role||'—')}</td><td>${esc(p.liquidity||'—')}</td><td>${esc(p.fee||'未提供')}</td><td>${esc(sale.label)}</td></tr>`;}).join('')}</tbody></table></div><div class="callout warn">保单、保障缺口与理赔进度没有服务端来源，本页不展示这些板块，也不替代核保与理赔审核。</div></div>`+insuranceBoardsCard()+unsourcedFactsCard()+factsCard();
  }else if(view==='产品通识'){
    main=`<div class="card"><div class="card-head"><h2>通识与口径</h2></div><div class="list-row"><h3>挂牌利率与到账利息</h3><p class="muted">挂牌利率不等于实际到账，需按计息规则折算；具体测算入口由服务端计算后开放。</p></div><div class="list-row"><h3>提前支取</h3><p class="muted">多数定期提前支取按活期，会显著降低收益。</p></div><div class="list-row"><h3>结构性存款</h3><p class="muted">保本不保证收益，观察期内市场波动会影响最终利率。</p></div></div>`+factsCard();
  }else if(view==='产品筛选'){
    main=`<div class="card"><div class="card-head"><h2>筛选结果</h2><span class="muted">${products.length} 只 · 来自 GET /api/demo-data</span></div><div class="table-wrap"><table><thead><tr><th>产品</th><th>风险</th><th>${esc(interval)}收益</th><th>回撤</th><th>流动性</th><th>可售状态</th></tr></thead><tbody>${products.map(p=>{const f=intervalPick(p); const sale=saleStatusOf(p); return `<tr${p.id===current.id?' style="background:#ebf1ff"':''}><td><b>${esc(p.name)}</b></td><td>${esc(p.risk||'—')}</td><td>${esc(f.available?f.value:'该区间无数据')}</td><td>${esc(p.drawdown||'未提供')}</td><td>${esc(p.liquidity||'—')}</td><td>${esc(sale.label)}</td></tr>`;}).join('')}</tbody></table></div><p class="muted">区间收益取自 products[].latest_return（近一年口径）；回撤为 products[].drawdown；未返回的字段显示「未提供」，不用演示数值补齐。</p></div>`+(hasInterval?intervalCard():'')+unsourcedFactsCard()+factsCard();
  }else if(view==='基金通识'||view==='保险通识'){
    main=`<div class="card"><div class="card-head"><h2>${esc(type==='fund'?'基金':'保险')}通识</h2></div><div class="list-row"><h3>看什么</h3><p class="muted">跟踪误差、回撤、费率与流动性；不把历史收益当成预期收益。</p></div><div class="list-row"><h3>口径说明</h3><p class="muted">回撤按统一复权口径；适当性由客户风险测评决定，系统排序不替代人工结论。</p></div></div>`+factsCard();
  }else{
    main=[overviewCard(),hasInterval?intervalCard():'',type==='insurance'?insuranceBoardsCard():'',type==='fund'||type==='wealth'?unsourcedFactsCard():'',factsCard()].join('');
  }
  const aside=`<aside class="stack"><div class="card"><div class="card-head"><h2>筛选条件</h2><button class="link-btn" data-action="reset-insight">重置</button></div>${hasInterval?`<label>观察区间<select data-ui-change="interval">${FUND_INTERVALS.map(k=>`<option${k===interval?' selected':''}>${esc(k)}</option>`).join('')}</select></label><p class="muted">区间取自服务端产品快照；应用服务没有该区间的收益序列时，切换为显式空态，而不是沿用近一年数值。</p>`:'<p class="muted">该板块没有观察区间维度。</p>'}</div><div class="card"><div class="card-head"><h2>当前可切换产品</h2><span class="muted">${products.length}</span></div><div class="catalog-grid" style="grid-template-columns:1fr">${picker}</div></div><div class="card"><div class="card-head"><h2>相关材料</h2></div><div class="list-row"><h3>${icon('file')} ${esc(view)}材料</h3><p class="muted">随板块切换 · 数据时点 ${esc(dataAsOf)}</p></div><div class="list-row"><h3>${icon('shield')} 风险揭示书</h3><p class="muted">强制阅读 · 内容以正式材料为准</p></div></div></aside>`;
  return pageHeading(spec.ey,spec.title,spec.sub,btn('保存到工作区','save','')+btn('生成一页纸','onepager','primary'))+`<div class="tabs" data-tabs="product">${spec.tabs.map(x=>`<button type="button" class="tab ${view===x?'active':''}" data-view="${esc(x)}">${esc(x)}</button>`).join('')}</div><div class="insight-banner"><span class="insight-kicker">${esc(view)}</span><div><b>${esc(current.name)}</b><p class="muted" style="margin:4px 0 0">当前板块是「${esc(view)}」，产品事实全部来自 GET /api/demo-data，演示数据不构成投资建议。</p></div></div><div class="grid main-aside"><div class="stack">${main}</div>${aside}</div>`;
}

function pageCandidates(){
  const s=session();
  const g=s.goal||sessionApi()?.DEFAULT_GOAL||{};
  const ids=candidateIds();
  // H-02：排序、理由与约束只取服务端 candidateCalculation.reasons[]（generate_candidates 写入）。
  // 页面不再用 p.match 当适配度（session-sync.js 已把它覆盖成「—」），也不在浏览器推导分数：
  // 顺序沿用服务端给出的顺序（风险档升序 + product_id），理由与 constraints / holding_months 逐条展示。
  const calc=s.candidateCalculation&&typeof s.candidateCalculation==='object'?s.candidateCalculation:null;
  const reasons=Array.isArray(calc?.reasons)?calc.reasons:[];
  const reasonOf=(id)=>reasons.find(r=>r&&r.product_id===id)||null;
  const REASON_LABEL={risk_term_liquidity_sale_checked:'风险、期限、流动性与可售状态均通过校验',holding_period_exceeds_liquidity_or_term:'持有期超过流动性需求或目标期限',risk_above_customer:'风险等级高于客户风险等级',risk_above_goal:'风险等级高于目标风险等级',not_on_sale:'产品不可售',risk_level_unknown:'风险等级缺失'};
  const monthsText=(months)=>{const n=numOrNull(months); return n==null||n<=0?'':`${Number.isInteger(n)?n:n.toFixed(1)} 个月`;};
  const constraintsText=(entry)=>{
    const c=entry?.constraints||{};
    const parts=[];
    const holdMonths=monthsText(entry?.holding_months);
    if(holdMonths) parts.push(`持有期 ${holdMonths}`);
    if(c.goal_term) parts.push(`目标期限 ${c.goal_term}`);
    if(c.goal_liquidity) parts.push(`流动性需求「${c.goal_liquidity}」`);
    if(c.customer_risk||c.goal_risk) parts.push(`风险 客户 ${c.customer_risk||'—'} / 目标 ${c.goal_risk||'—'}`);
    if(c.sale_status) parts.push(`可售状态 ${c.sale_status}`);
    return parts.join(' · ');
  };
  const rankText=(id,pos)=>{
    const entry=reasonOf(id);
    if(!entry) return '';
    return [`第 ${pos+1} 条（服务端 candidateCalculation 顺序：风险档由低到高、同档按 product_id）`,REASON_LABEL[entry.reason]||entry.reason||''].filter(Boolean).join(' · ');
  };
  const fallback='服务端未返回该候选的 candidateCalculation 理由';
  const rows=ids.map((id,pos)=>{
    const p=productOf(id)||{};
    const entry=reasonOf(id);
    const reasonText=rankText(id,pos);
    const constraint=constraintsText(entry);
    return `<tr><td><b>${esc(p.name||id)}</b><br><span class="muted">${esc(p.detail||p.type||'')}</span></td><td>${esc(p.role||'')}</td><td>${esc(p.ret||'—')}</td><td>${esc(p.drawdown||'—')}</td><td><small class="${entry?'':'muted'}">${esc(reasonText||fallback)}</small></td><td><small class="${constraint?'':'muted'}">${esc(constraint||fallback)}</small></td><td><button class="btn small" data-action="m-candidate-reason" data-product="${esc(id)}">解释</button></td></tr>`;
  }).join('');
  // H-02：无候选时给引导空态，不渲染只有表头的空表。候选为空是可达状态
  //（未生成方案就进入本页，或 generate_candidates 尚未调用）。
  const goals=[g.amount,g.term,g.risk,g.liquidity,g.purpose].filter(Boolean).map(x=>esc(x)).join(' · ');
  const emptyBody=s.plan
    ? `<div class="callout warn"><b>当前没有候选产品</b><p>已存在配置方案，但应用服务尚未写入候选。候选只由 generate_candidates 写入，系统不会补入默认产品，也不会展示空的候选表。</p><p class="muted">当前目标：${goals||'—'}</p></div><div class="path-next">${btn('生成候选池','generate-candidates','primary')}</div>`
    : `<div class="callout warn"><b>请先完成资产配置</b><p>候选产品由「资产配置 → 生成方案 → 生成候选」的服务端链路写入；当前会话没有配置方案，因此没有候选可展示。系统不会补入默认产品，也不会展示空的候选表。</p><p class="muted">当前目标：${goals||'—'}</p></div><div class="path-next"><a class="btn primary" href="#m/allocation" data-action="open-route" data-route="m/allocation">去做资产配置</a></div>`;
  const table=ids.length
    ? `<div class="table-wrap"><table><thead><tr><th>产品</th><th>组合作用</th><th>近一年</th><th>最大回撤</th><th>排序依据</th><th>约束（candidateCalculation.reasons[]）</th><th>动作</th></tr></thead><tbody>${rows}</tbody></table></div>`
    : emptyBody;
  return pageHeading('CANDIDATE POOL','候选产品池','把客户金额、期限、风险、流动性和资金用途转成结构化条件，再从我行可售范围内排序。',btn('打开比较','go-pc-compare','')+btn('生成候选池','generate-candidates','primary'))+`<div class="card"><div class="form-grid three"><label>资金金额<input value="${esc(g.amount||'—')}"/></label><label>投资期限<select><option>${esc(g.term||'—')}</option></select></label><label>风险等级<select><option>${esc(g.risk||'—')}</option></select></label><label>流动性需求<select><option>${esc(g.liquidity||'—')}</option></select></label><label>资金用途<select><option>${esc(g.purpose||'—')}</option></select></label><label>产品偏好<select><option>不限</option></select></label></div><div class="between section-space"><span class="muted">已校验：${esc(goalText())}</span>${btn('同步林女士方案','generate-candidates','primary')}</div></div><div class="grid main-aside section-space"><div class="card"><div class="card-head"><div><h2>${ids.length?`为林女士找到 ${ids.length} 个候选`:'当前没有候选产品'}</h2><p class="muted">${s.researchAnswer?'已关联投研问答来源 · ':''}排序值、理由与约束取自服务端 candidateCalculation${calc?.calculation_id?` · ${esc(calc.calculation_id)}`:''}</p></div><div class="segment">${['综合排序','收益优先','流动性优先'].map(x=>tabBtn(x,'综合排序')).join('')}</div></div>${table}</div><aside class="stack"><div class="card"><div class="card-head"><h2>筛选解释</h2>${statusBadge(ids.length?'可核验':'空态',ids.length?'green':'blue')}</div><div class="attention"><span class="attention-icon">${icon('check')}</span><div><h4>候选排序不替代适当性结论</h4><p>排序、理由与约束同源于服务端 candidateCalculation；页面不给出自己的适配度分数，最终由客户经理确认。</p></div></div>${s.researchAnswer?`<div class="callout">研究依据：${esc((s.researchAnswer.sources||[]).join(' · '))}</div>`:''}<div class="divider"></div><h3>替代方向</h3><p class="muted">无完全匹配产品时，可调整金额、期限或流动性条件重新生成候选；系统不会自动替换为其他产品。</p></div></aside></div>`;
}

// ---------------------------------------------------------------------------
// H-03：比较口径（A07「统一口径」）
// 除了行标签，页面还必须说明「能不能排名」。排名资格只认服务端
// candidateCalculation.comparison（generate_candidates 调 compareBasis() 产出
// comparable / comparison_basis / incomparable_reason / missing_product_ids）。
// 服务端没有覆盖当前比较集时，页面只按同一口径并列事实并明示「不可排名」，
// 不陈述任何未经计算的因果关系。
// ---------------------------------------------------------------------------
const BASIS_LABEL={annual_rate:'annual_rate（挂牌年利率）',period_return:'period_return（区间收益率）',missing:'缺失'};
const INCOMPARABLE_LABEL={different_basis:'产品类型 / 风险等级 / 收益口径不同',missing_values:'比较集中有产品在当前数据版本里缺值',fewer_than_two_products:'少于 2 个产品'};
const basisText=(basis)=>{
  if(!basis||typeof basis!=='object') return '—';
  return `产品类型 ${basis.type||'—'} · 风险 ${basis.risk||'—'} · 收益口径 ${BASIS_LABEL[basis.benchmark]||basis.benchmark||'—'}`;
};
// 页面只从「服务端实际发布了哪个收益字段」来判断口径是否一致，
// 不在浏览器换算或推导任何收益数值。
const RETURN_FACT_KEYS=['latest_return','annual_rate'];
function returnFactOf(product){
  for(const key of RETURN_FACT_KEYS){
    const value=product?.[key];
    if(value!=null&&value!=='') return {key,value};
  }
  return null;
}
function comparisonReadout(ids){
  const s=session();
  const calc=s.candidateCalculation&&typeof s.candidateCalculation==='object'?s.candidateCalculation:null;
  const server=calc?.comparison&&typeof calc.comparison==='object'?calc.comparison:null;
  const products=ids.map(id=>productOf(id)).filter(Boolean);
  const facts=products.map(p=>returnFactOf(p));
  const missing=products.filter((p,i)=>!facts[i]||p.sale_status==null).map(p=>p.name||p.id);
  const lines=[];
  if(server){
    const covered=Array.isArray(server.items)?server.items.length:0;
    if(covered!==ids.length){
      lines.push(`服务端比较口径只覆盖 ${covered} 个产品（candidateCalculation 写入时的候选集），当前比较集 ${ids.length} 个产品，因此不做排名，只并列事实。`);
    }else if(server.comparable===true){
      lines.push(`排名资格：服务端判定 comparable=true，全部产品口径一致（${basisText(server.comparison_basis)}）。`);
      lines.push('区间收益与最大回撤可在同一口径下并列对照；收益与回撤之间的因果关系仍以客户约束和专业判断为准，页面不下结论。');
    }else{
      lines.push(`排名资格：服务端判定 comparable=false（incomparable_reason=${server.incomparable_reason||'未返回'}${INCOMPARABLE_LABEL[server.incomparable_reason]?` · ${INCOMPARABLE_LABEL[server.incomparable_reason]}`:''}），因此不可排名。`);
      if(Array.isArray(server.missing_product_ids)&&server.missing_product_ids.length) lines.push(`缺失产品：${server.missing_product_ids.join(' / ')}（missing_values，不参与任何比较）。`);
      lines.push('不同口径的产品只并列事实，任何一行都不构成优劣结论。');
    }
    lines.push(`比较口径 calculation_id：${calc.calculation_id||'—'}`);
  }else{
    lines.push('服务端尚未返回本比较集的比较口径（candidateCalculation.comparison，由 generate_candidates 写入），因此本页不做排名，也不给出结论性文案。');
    // 只标注页面可复算的事实：收益口径与风险档是否一致。
    const benchmarks=new Set(facts.filter(Boolean).map(f=>f.key));
    const risks=new Set(products.map(p=>String(p.risk||'缺失')));
    if(benchmarks.size>1) lines.push(`收益口径不一致：${[...benchmarks].map(k=>BASIS_LABEL[k]||k).join(' / ')}，不可直接排名。`);
    else if(risks.size>1) lines.push(`风险档不一致：${[...risks].join(' / ')}，不同风险档产品的区间收益与回撤口径不同，不可直接排名。`);
    else if(products.length>=2) lines.push('比较集内收益口径与风险档一致，可按同一口径逐项对照；排序资格仍以服务端比较口径为准。');
  }
  if(missing.length) lines.push(`无数据（不参与比较）：${missing.join(' / ')}。`);
  const rankable=server&&server.comparable===true&&(Array.isArray(server.items)?server.items.length:0)===ids.length;
  return {rankable,lines};
}
// PC 与手机共用同一比较结论，避免两页出现不同说法。
function comparisonConclusion(ids){
  const {rankable,lines}=comparisonReadout(ids);
  return {rankable,badge:rankable?'可排名（服务端口径一致）':'不可排名（口径不同或服务端未覆盖）',text:lines.join('')};
}

function pageCompare(){
  const s=session();
  const ids=compareIds();
  const cols=ids.map(id=>productOf(id)).filter(Boolean);
  if(!cols.length){
    return pageHeading('COMPARISON','产品横向比较','比较集为空。请先在已生成的候选产品中加入 2–3 个真实产品。',btn('返回候选池','go-pc-candidates','primary'))+`<div class="card"><div class="callout warn">当前没有可比较的产品，系统不会自动补入默认候选。</div></div>`;
  }
  const conclusion=comparisonConclusion(ids);
  const head=`<tr><th>指标</th>${cols.map(p=>`<th>${esc(p.short||p.name)}</th>`).join('')}</tr>`;
  const row=(label,key)=>`<tr><td>${label}</td>${cols.map(p=>`<td>${esc(p[key]||'—')}</td>`).join('')}</tr>`;
  const view=viewOf()||'表现';
  const body={
    表现:[row('产品类型','detail'),row('区间收益','ret'),row('适合角色','role')],
    风险:[row('最大回撤','drawdown'),row('风险等级','risk')],
    流动性:[row('流动性','liquidity'),row('产品类型','type')],
    费用:[row('费用','fee'),row('适合角色','role')]
  }[view]||[];
  return pageHeading('COMPARISON','产品横向比较','在同一时间区间、同一指标口径下比较收益、回撤、波动、费用、期限和组合角色。',btn('同步林女士比较集','sync-compare','')+btn('保存比较','save-pc-compare','primary'))+`<div class="card"><div class="between"><div class="row wrap"><span class="badge blue">${cols.length} 个产品</span><span class="muted">数据时点 ${esc(s.asOf||'—')} · ${esc(goalText())}</span></div><div class="segment">${['表现','风险','流动性','费用'].map(x=>tabBtn(x,'表现')).join('')}</div></div><div class="table-wrap section-space"><table><thead>${head}</thead><tbody>${body.join('')}</tbody></table></div><div class="callout ${conclusion.rankable?'':'warn'}"><b>${esc(conclusion.badge)}：</b>${conclusion.text}<br><span class="muted">业绩比较基准不代表预期收益。${s.compareSaved?' 比较结果已保存。':''}</span></div></div>`;
}

// A20：引用必须可回指。chunk_id 在 GET /api/knowledge 的片段里带有文档标题与页码，
// 因此每个引用都展示「标题 · 第 N 页」；查不到时如实标注，不猜测标题、不隐藏引用。
function citationDetail(citations,evidence){
  const ids=[...new Set([...(Array.isArray(citations)?citations:[]),...((evidence&&Array.isArray(evidence.chunk_ids))?evidence.chunk_ids:[])])].filter(x=>typeof x==='string'&&x);
  if(!ids.length) return '';
  const chunks=Array.isArray(session()._knowledgeChunks)?session()._knowledgeChunks:[];
  const rows=ids.map((id)=>{
    const hit=chunks.find(c=>c&&c.chunk_id===id)||null;
    const title=hit&&hit.title?String(hit.title):'';
    const page=hit&&hit.page!=null&&hit.page!==''?String(hit.page):'';
    const doc=hit&&hit.document_id?String(hit.document_id):'';
    const pageText=page?` · 第 ${page} 页`:'';
    const place=hit?(title?`${title}${pageText}`:'GET /api/knowledge 未返回该片段标题'):'当前知识投影中未找到（可能来自旧知识版本）';
    return `<div class="stat-row"><span><code>${esc(id)}</code>${doc?`<br><small class="muted">${esc(doc)}</small>`:''}</span><b>${esc(place)}</b></div>`;
  }).join('');
  return `<div class="list-row section-space"><h3>引用回指（chunk_id · 标题 · 页码）</h3>${rows}<p class="muted">标题与页码取自 GET /api/knowledge 的知识片段；引用只属于本次证据包。</p></div>`;
}
// ---------------------------------------------------------------------------
// H-04：重复提问与超范围问题（A14b）
// 服务端按 request_id 幂等，同一问题再次提交只会复用同一结果；页面因此必须先
// 说清「这个问题是否已有结果」（复用 + 可见 request_id）。超范围问题在服务端
// 以「没有返回任何引用或证据」失败收场时，页面明确拒答，而不是落到通用 ai-error。
// ---------------------------------------------------------------------------
const questionKey=(text)=>String(text||'').replace(/\s+/g,' ').trim();
function repeatedResearchAnswer(question){
  const s=session();
  const key=questionKey(question);
  const ans=s.researchAnswer||null;
  if(!key||!ans) return null;
  if(questionKey(ans.question)!==key) return null;
  const landing=s.landing||{};
  const fromResult=(landing.id==='ask'&&landing.query&&questionKey(landing.query)===key)?landing.requestId:null;
  return {requestId:fromResult||null};
}
function researchRefusal(error){
  if(!error||error.code==='STALE_REQUEST') return null;
  const body=error.body||{};
  const evidence=body.evidence||{};
  const citations=Array.isArray(body.citations)?body.citations:[];
  return {
    code:String(error.code||`HTTP_${error.status||'—'}`),
    status:error.status||null,
    message:String(error.message||'本次请求失败'),
    submitted:body.request_id||null,
    citations:citations.length,
    chunkIds:Array.isArray(evidence.chunk_ids)?evidence.chunk_ids.length:0
  };
}
function researchFlowState(s,ans){
  const repeated=repeatedResearchAnswer(s.researchAnswer?.question||ans.question);
  // 拒答原因只取 landing 上随跳转写入的那一份（landing 是 PATCH 白名单字段），
  // 这样离开结果页回到研究页时仍能看到本人本次的真实拒答原因；没有就什么都不显示。
  const refusal=(s.landing&&s.landing.id==='ai-error'&&s.landing.researchRefusal)||null;
  const repeatedBlock=repeated
    ? `<div class="callout"><b>该问题已存在结果</b><p>「${esc(questionKey(s.researchAnswer?.question||ans.question))}」已由服务端生成回答；本次提交复用同一结果，不会生成第二条回答。</p><p class="muted">服务端 request_id <code>${esc(repeated.requestId||'不在当前结果页上（已离开结果页或来自历史会话），以下为服务端已保存的回答')}</code> · 数据时点 ${esc(s.asOfFull||'—')}</p></div>`
    : '';
  const refusalBlock=refusal
    ? `<div class="card"><div class="card-head"><h2>本次问题未被回答</h2>${statusBadge(`明确拒答 · ${refusal.code}`,'red')}</div><div class="callout warn"><b>明确拒答：本次问题超出现有授权证据范围</b><p>${esc(refusal.message)}</p><p class="muted">服务端没有返回任何引用或证据，因此本次不作回答；这不是预置结论，也不代表问题已得到解决。</p></div><div class="list-row">${calcRow('错误码',refusal.code)}${calcRow('HTTP 状态',refusal.status)}${calcRow('本次 request_id',refusal.submitted||'未返回')}${calcRow('返回引用数',String(refusal.citations))}${calcRow('知识片段数',String(refusal.chunkIds))}</div><p class="muted">可以换成更聚焦的问题，或从下方推荐问题开始；系统不会用演示答案或通用失败文案替代拒答原因。</p></div>`
    : '';
  return repeatedBlock+refusalBlock;
}
function pageResearch(){
  const s=session();
  const ans=s.researchAnswer || {question:'',text:'尚未发起真实研究任务。输入问题后，系统会先检索授权知识，再调用 AI 生成。',sources:[]};
  const generated=!!s.researchAnswer;
  const fixture=(s.researchAnswer?.model||'').includes('fixture')||s.researchAnswer?.execution_mode==='fixture';
  return researchFlowState(s,ans)+pageHeading('RESEARCH DESK','智能问答与深度研究','支持问题澄清、知识库检索、复杂分析与多步骤研究；回答展示来源、数据时点和不确定事项。',btn('研究计划','research-plan','')+btn('查看候选解释','go-pc-candidates','primary'))+`<div class="grid main-aside"><div class="stack"><div class="card"><div class="card-head"><div><h2>问小财</h2><p class="muted">当前检索范围：行内知识库 · 市场数据 · 公开权威信息</p></div>${statusBadge(generated?'已生成':'待发起',generated?'blue':'orange')}</div><div class="prompt-box"><textarea id="researchPrompt" placeholder="例如：美联储降息对黄金和固收+产品可能有什么影响？">${esc(ans.question||'')}</textarea><div class="prompt-footer"><span class="muted">${icon('shield')} 复杂问题会先拆解研究步骤</span>${btn('开始研究','ask','primary')}</div></div><div class="prompt-quick"><button data-action="quick-prompt">解读今天的宏观重点</button><button data-action="quick-prompt">比较新能源和红利板块</button><button data-action="quick-prompt">阅读一份研报</button></div></div><div class="card"><div class="card-head"><h2>${generated?'本次回答':'等待 AI 生成'}</h2><span class="muted">数据时点 ${esc(s.asOfFull||'—')}</span></div>${generated?`<div class="chat-bubble"><div class="chat-name">${icon('spark')} 财富智服 · 研究回答</div><p><b>问题：</b>${esc(ans.question)}</p><p>${esc(ans.text)}</p><div class="chips">${(ans.sources||[]).map((x,i)=>`<button class="source" data-action="source-detail">[${i+1}] ${esc(x)}</button>`).join('')}</div>${citationDetail(ans.sources||[],ans.evidence)}</div><p class="muted">${fixture?'演示桩 fixture':'真实模型服务'} · 模型 ${esc(s.researchAnswer?.model||'—')} · ${esc(String(s.researchAnswer?.latency_ms??'—'))} ms</p><div class="callout warn">以下内容为研究参考，不构成投资建议。</div>`:`<div class="callout">${esc(ans.text)}</div>`}</div></div><aside class="stack"><div class="card"><div class="card-head"><h2>研究步骤</h2>${statusBadge(generated?'已完成':'待发起',generated?'green':'orange')}</div><div class="timeline"><div class="timeline-item"><span class="step-circle done">${icon('check')}</span><div class="step-copy"><b>问题理解</b><p>抽取关键词并澄清范围</p></div></div><div class="timeline-item"><span class="step-circle ${generated?'done':'current'}">${generated?icon('check'):'2'}</span><div class="step-copy"><b>证据检索</b><p>召回不少于 2 条授权资料</p></div></div><div class="timeline-item"><span class="step-circle ${generated?'done':'current'}">${generated?icon('check'):'3'}</span><div class="step-copy"><b>形成分析</b><p>事实、观点、推断分开表达</p></div></div></div></div><div class="card"><div class="card-head"><h2>研究设置</h2></div><label class="check"><input type="checkbox" data-ui-check="reviewed" ${uiOf('reviewed','1')!=='0'?'checked':''}/>只引用已审核资料</label><label class="check"><input type="checkbox" data-ui-check="uncertain" ${uiOf('uncertain','1')!=='0'?'checked':''}/>显示不确定事项</label><label class="check"><input type="checkbox" data-ui-check="public" ${uiOf('public','0')==='1'?'checked':''}/>交叉验证公开信息</label><p class="muted">当前：${uiOf('reviewed','1')!=='0'?'仅已审核资料':'含未审核草稿'} · ${uiOf('uncertain','1')!=='0'?'显示不确定事项':'隐藏不确定事项'} · ${uiOf('public','0')==='1'?'交叉验证公开信息':'不引用公开网页'}。</p></div><div class="card"><div class="card-head"><h2>本次请求状态</h2>${statusBadge(s.aiStatus==='FAILED'?'失败':'可核验',s.aiStatus==='FAILED'?'red':'green')}</div>${calcRow('researchAnswer','PATCH 白名单字段，来自 /api/ai/generate')}${calcRow('request_id','结果页展示最近一次服务端 request_id')}${calcRow('本次拒答','经 landing 字段带入，不改冻结集合')}</div></aside></div>`;
}

function researchPage(type){
  const data={events:['EVENT RADAR','市场事件解读','聚合跨行业、跨市场资讯，区分事实、机构观点和模型推断。'],macro:['MACRO DESK','宏观分析','观察增长、通胀、就业、货币、财政与房地产指标，并关联资产影响。'],industry:['INDUSTRY VIEW','行业解读','汇总行情、估值、景气度、政策事件和机构观点，生成可验证的行业视图。']}[type];
  const view=viewOf()||'今日';
  return pageHeading(data[0],data[1],data[2],btn('订阅提醒','subscribe','')+btn('生成简报','brief','primary'))+`<div class="grid main-aside"><div class="stack"><div class="card"><div class="card-head"><div><h2>${type==='events'?'重点事件':type==='macro'?'宏观指标看板':'行业研究视图'} · ${esc(view)}</h2><p class="muted">切换时间窗会重新取数</p></div><div class="segment">${['今日','本周','自定义'].map(x=>tabBtn(x,'今日')).join('')}</div></div><div class="callout warn"><b>暂无可引用材料</b><p>shared 知识库当前没有 ${type} 专属片段，应用服务也没有为「${esc(view)}」返回指标序列。系统不会补入默认观点或演示数值，可在智能问答中针对具体问题检索。</p></div>${btn('去智能问答提问','go-research','primary')}</div></div><aside class="stack"><div class="card"><div class="card-head"><h2>研究口径</h2>${statusBadge('透明','green')}</div><label>数据范围<select data-ui-change="scope"><option${uiOf('scope','行内授权 + 公开信息')==='行内授权 + 公开信息'?' selected':''}>行内授权 + 公开信息</option><option${uiOf('scope')==='仅行内授权'?' selected':''}>仅行内授权</option></select></label><label class="section-space">输出粒度<select data-ui-change="grain"><option${uiOf('grain','一页纸')==='一页纸'?' selected':''}>一页纸</option><option${uiOf('grain')==='深度报告'?' selected':''}>深度报告</option></select></label><label class="check section-space"><input type="checkbox" data-ui-check="infer" ${uiOf('infer','1')!=='0'?'checked':''}/>标出模型推断</label><p class="muted">当前口径：${esc(uiOf('scope','行内授权 + 公开信息'))} · ${esc(uiOf('grain','一页纸'))} · ${uiOf('infer','1')!=='0'?'已标出推断':'不展示推断'}。</p></div><div class="card"><div class="card-head"><h2>宏观日历</h2>${statusBadge('未提供','blue')}</div><div class="callout">应用服务没有提供日历数据，本页不展示演示日程。</div></div></aside></div>`;
}

// P-06: 供给目录的行与计数只来自共享应用服务。服务端没有「已审核供给」表，
// 但产品主体研究的供给单元就是 /api/demo-data 的产品行；其余三类供给
// （资讯 / 策略 / 行业观点）没有任何来源，一律显式空态，不再展示硬编码行。
const SUPPLY_VIEWS=['全部','资讯','策略','产品研究'];
function pageSupply(){
  const view=SUPPLY_VIEWS.includes(viewOf())?viewOf():'全部';
  ensureProductCatalog();
  const catalog=productCatalogView();
  const products=catalog?[]:serverProductRows('');
  const supplyRow=(p)=>{
    const sale=saleStatusOf(p);
    return {id:p.id,name:p.name||p.id,type:p.type||'未提供',source:p.source_id||'未提供',asOf:literalTime(p.source_timestamp)||'未提供',sale,scenes:`${p.role||'未提供'} · ${sale.label}`};
  };
  const productRowsForSupply=view==='全部'||view==='产品研究'?products.map(supplyRow):[];
  // 资讯 / 策略 / 行业观点没有服务端来源：即使在该视图下也不补行。
  const rows=productRowsForSupply;
  const emptyText=catalog?'供给目录加载失败，暂无可展示供给':(view==='资讯'||view==='策略'?'当前分类暂无已审核供给（共享应用服务没有该类供给的数据来源）':'暂无已审核供给');
  const head=`<div class="card"><div class="card-head"><div><h2>供给目录</h2><p class="muted">当前视图：${esc(view)}</p></div><div class="segment">${SUPPLY_VIEWS.map(x=>tabBtn(x,'全部')).join('')}</div></div>`;
  const body=catalog
    ? `<div class="callout ${catalog.tone==='red'?'warn':''}">${catalog.lead}${catalog.body}</div></div>`
    : `<div class="table-wrap"><table><thead><tr><th>供给名称</th><th>类型</th><th>来源</th><th>数据时点</th><th>可售状态</th><th>可调用场景</th></tr></thead><tbody>${rows.map(r=>`<tr><td><b>${esc(r.name)}</b><br><span class="muted">product:${esc(r.id)}</span></td><td>${esc(r.type)}</td><td>${esc(r.source)}</td><td>${esc(r.asOf)}</td><td>${statusBadge(r.sale.label,r.sale.onSale?'green':'blue')}</td><td>${esc(r.scenes)}</td></tr>`).join('')||`<tr><td colspan="6">${esc(emptyText)}</td></tr>`}</tbody></table></div><div class="callout">供给行与行数取自 GET /api/demo-data（产品主体研究单元）；资讯、策略与行业观点没有服务端来源，本页不展示这两类演示行，也不展示任何统计口径的默认计数。</div></div>`;
  return pageHeading('RESEARCH SUPPLY','投研与策略供给','把财经早报、宏观简报、行业观点、策略研究和产品主体研究沉淀为可调用的已审核供给。',btn('新建研究供给','new-supply','primary'))+`<div class="grid main-aside section-space">${head}${body}<aside class="stack"><div class="card"><div class="card-head"><h2>观点调用规则</h2>${statusBadge('已启用','green')}</div><div class="stat-row"><span>适用角色</span><b>投研 · 投顾 · 产品</b></div><div class="stat-row"><span>必备字段</span><b>来源 · 时点 · 作者</b></div><div class="stat-row"><span>观点失效</span><b>到期自动下线</b></div><div class="callout">调用时会同时带出来源、适用范围和审核状态，避免只返回脱离上下文的结论。</div></div><div class="card"><div class="card-head"><h2>待处理</h2>${statusBadge('空态','blue')}</div><div class="list-row"><h3>当前无待处理供给</h3><p class="muted">应用服务没有提供待处理记录。</p></div></div></aside></div>`;
}

// P-08: 产品智库里每张卡片都回指 /api/demo-data 的产品行与该产品的知识片段；
// 知识版本与片段数只取自 GET /api/knowledge 的只读投影。没有真实来源的
// 「观点资产」「审核状态」「更新日期」不再以演示行呈现。
const LIBRARY_VIEWS=['全部产品','基金','理财','保险','存款'];
function pageLibrary(){
  const view=LIBRARY_VIEWS.includes(viewOf())?viewOf():'全部产品';
  ensureProductCatalog();
  const catalog=productCatalogView();
  const products=catalog?[]:serverProductRows('');
  const visible=view==='全部产品'?products:products.filter(p=>p.type===view);
  // Knowledge comes from the shared session projection (_knowledge*): there is
  // no knowledge accessor on the adapter, and that file is not ours to change.
  const knowledge={version:session()._knowledgeStatus?.knowledge_version||null,documents:session()._knowledgeDocuments||[],chunks:session()._knowledgeChunks||[]};
  const chunks=knowledge.chunks||[];
  const meta=(knowledge.documents||[]).length
    ? `${(knowledge.documents||[]).length} 份文档 · ${chunks.length} 个片段 · 知识版本 ${knowledge.version||'—'}`
    : '暂无已发布产品知识';
  const knowledgeCell=(p)=>{
    if(!knowledge.version) return statusBadge('无知识版本','blue');
    const hits=chunks.filter(c=>c.product_id===p.id);
    if(!hits.length) return statusBadge('无知识片段','blue');
    return `<span class="badge green">${hits.length} 个片段</span><br><small class="muted">${esc(knowledge.version)} · ${esc(hits.map(c=>c.document_id).join(' · '))}</small>`;
  };
  const body=catalog
    ? `<div class="callout ${catalog.tone==='red'?'warn':''}">${catalog.lead}${catalog.body}</div></div>`
    : `<div class="table-wrap"><table><thead><tr><th>产品</th><th>产品特征</th><th>数据时点</th><th>可售状态</th><th>知识引用</th></tr></thead><tbody>${visible.map(p=>{const sale=saleStatusOf(p); return `<tr><td><b>${esc(p.name||p.id)}</b><br><span class="muted">product:${esc(p.id)} · ${esc(p.source_id||'来源未提供')}</span></td><td>${esc(p.type||'未提供')} · ${esc(p.risk||'未提供')} · ${esc(p.role||'未提供')}</td><td>${esc(literalTime(p.source_timestamp)||'未提供')}</td><td>${statusBadge(sale.label,sale.onSale?'green':'blue')}</td><td>${knowledgeCell(p)}</td></tr>`;}).join('')||'<tr><td colspan="5">暂无已发布产品知识</td></tr>'}</tbody></table></div><p class="muted">卡片与产品特征取自 GET /api/demo-data，知识版本与片段取自 GET /api/knowledge；「一句话评述」「审核状态」「更新日期」没有服务端字段，已从表格移除，不以演示行补齐。观点资产类条目没有服务端来源，因此不设该分类。</p></div>`;
  return pageHeading('PRODUCT KNOWLEDGE','产品智库','统一维护准入产品、说明书、净值数据和已审核观点，支持调用、失效和版本追溯。','')+`<div class="card"><div class="card-head"><h2>已发布知识</h2>${statusBadge(knowledge.version?'已加载':'空态',knowledge.version?'green':'blue')}</div><div class="stat-row"><span>知识版本</span><b>${esc(knowledge.version||'—')}</b></div><div class="stat-row"><span>文档 / 片段</span><b>${esc(meta)}</b></div><p class="muted">以上来自 GET /api/knowledge；产品卡片来自 GET /api/demo-data。调用次数没有服务端来源，不展示默认数值。</p></div><div class="card section-space"><div class="between"><div class="tabs" data-tabs="library">${LIBRARY_VIEWS.map(x=>`<button type="button" class="tab ${view===x?'active':''}" data-view="${x}">${x}</button>`).join('')}</div><div class="row"><input placeholder="搜索产品名称或代码"/><button class="icon-btn">${icon('filter')}</button></div></div><div class="insight-banner" style="margin:12px 0"><span class="insight-kicker">${esc(view)}</span><p class="muted" style="margin:0">当前分类「${esc(view)}」，清单与知识版本均取自服务端只读接口。</p></div>${body}</div>`;
}

function pageReader(){
  // Knowledge comes from the shared-session projection (_knowledge*): there is
  // no knowledge accessor on the adapter, and that file is not ours to change.
  const knowledge={version:session()._knowledgeStatus?.knowledge_version||null,documents:session()._knowledgeDocuments||[],chunks:session()._knowledgeChunks||[]};
  const docs=knowledge.documents||[];
  if(!docs.length){
    return pageHeading('DOCUMENT READER','研究报告智能阅读','全文检索、章节解读、观点与数据提取，引用可定位到页码和原文位置。',btn('上传文档','upload','primary'))+`<div class="card"><div class="callout warn"><b>暂无已发布报告</b><p>GET /api/knowledge 没有返回任何知识文档，本页不展示演示正文。</p></div></div>`;
  }
  const docId=uiOf('document',docs[0].document_id);
  // Documents come from the shared-session projection (_knowledgeDocuments);
  // the adapter has no knowledge accessor and that file is not ours to change.
  const doc=docs.find(d=>d.document_id===docId)||docs[0];
  const chunks=(knowledge.chunks||[]).filter(c=>c.document_id===doc.document_id).slice(0,3);
  const chunkList=chunks.map(c=>`<div class="list-row"><h3>片段 ${esc(c.chunk_id)}</h3><p class="muted">${esc(c.title||'')} · 第 ${esc(String(c.page??'—'))} 页 · 来源 ${esc(c.source_id||'—')}</p></div>`).join('');
  return pageHeading('DOCUMENT READER','研究报告智能阅读','全文检索、章节解读、观点与数据提取，引用可定位到页码和原文位置。',btn('上传文档','upload','primary')+btn('我的研究空间','workspace',''))+`<div class="grid main-aside"><div class="paper"><div class="doc-meta between"><span>《${esc(doc.title)}》 · 知识版本 ${esc(doc.knowledge_version||knowledge.version||'—')}</span>${statusBadge('服务端文档','blue')}</div><h2>${esc(doc.title)}</h2><p class="muted">数据来源 ${esc(doc.source_id||'—')} · 时点 ${esc(literalTime(doc.source_timestamp)||'—')}。章节正文与图表识别没有服务端来源，本页不展示演示正文。</p><div class="grid three">${chunks.map(c=>`<div class="mini-stat"><small class="muted">${esc(c.title||c.chunk_id)}</small><h3>第 ${esc(String(c.page??'—'))} 页</h3></div>`).join('')||'<p class="muted">该文档暂无片段</p>'}</div><p class="page-no"><button class="link-btn" data-action="source-detail">查看原文定位</button></p></div><aside class="stack"><div class="card"><div class="card-head"><h2>文档操作</h2></div>${btn('生成摘要','summary','light full')}${btn('提取关键数据','extract','full')}${btn('加入研究空间','save','full')}<div class="callout">摘要会以 read 的 document_id 与 source_ids 调用 report_summary。</div></div><div class="card"><div class="card-head"><h2>文档导航</h2><span class="muted">${docs.length} 份</span></div><div class="chapter-nav">${docs.map((d,i)=>`<button type="button" class="list-row ${d.document_id===doc.document_id?'active':''}" data-action="pick-ui" data-ui-key="document" data-ui-value="${esc(d.document_id)}"><h3>${i+1}. ${esc(d.title)}</h3><p class="muted">${esc(d.source_id||'')}</p></button>`).join('')}</div></div><div class="card"><div class="card-head"><h2>片段</h2></div>${chunkList||'<p class="muted">暂无片段</p>'}</div></aside></div>`.replace('read 的','服务端返回的');
}

function pageWriting(){
  const kinds={
    '定时写作':{task:'宏观周报',desc:'宏观日报 · 市场周报 · 固收日报'},
    '结构化一页纸':{task:'行业一页纸 · 电力设备',desc:'公司 · 行业 · 政策稳定框架'},
    '深度研究':{task:'开放课题 · 降息交易拥挤度',desc:'开放问题 · 长任务 · 多章节协同'}
  };
  const kind=uiOf('writingKind','定时写作');
  const cur=kinds[kind]||kinds['定时写作'];
  return pageHeading('AI WRITING','智能写作','从研究计划到证据检索、章节审阅和终稿审核，让写作过程可回看、可校验。',btn('模板管理','templates','')+btn('新建写作任务','new-writing','primary'))+`<div class="grid main-aside"><div class="stack"><div class="card"><div class="card-head"><div><h2>创建研究产物</h2><p class="muted">选择写作类型后，下方任务会一起切换。</p></div>${statusBadge('当前：'+kind,'blue')}</div><div class="grid three">${Object.keys(kinds).map(k=>`<button class="card" data-action="pick-ui" data-ui-key="writingKind" data-ui-value="${esc(k)}" style="text-align:left;${k===kind?'border-color:var(--blue);background:#ebf1ff':''}"><span class="metric-icon">${icon(k==='定时写作'?'clock':k==='结构化一页纸'?'file':'spark')}</span><h3 class="section-space">${esc(k)}</h3><p class="muted">${esc(kinds[k].desc)}</p></button>`).join('')}</div></div><div class="card"><div class="card-head"><h2>当前任务：${esc(cur.task)}</h2>${statusBadge('待生成','orange')}</div><div class="timeline"><div class="timeline-item"><span class="step-circle current">1</span><div class="step-copy"><b>研究计划</b><p>点击「新建写作任务」后由应用服务生成草稿并写入本次结果页。</p></div></div><div class="timeline-item"><span class="step-circle">2</span><div class="step-copy"><b>大纲生成</b><p>由下一次写作调用产出，本页不展示预置大纲。</p></div></div><div class="timeline-item"><span class="step-circle">3</span><div class="step-copy"><b>关键观点确认</b><p>需研究员在草稿产出后确认。</p>${btn('打开审阅','review-writing','small')}</div></div><div class="timeline-item"><span class="step-circle">4</span><div class="step-copy"><b>终稿与发布审核</b><p>待完成</p></div></div></div></div></div><aside class="stack"><div class="card"><div class="card-head"><h2>质量控制</h2>${statusBadge('未生成','blue')}</div><div class="callout">质控计数没有服务端来源，本页不展示「18/18」「26/28」等演示徽章。</div></div><div class="card"><div class="card-head"><h2>可复用资产</h2></div><div class="chips"><span class="chip">${esc(kind)}模板</span></div><p class="muted">模板管理与章节审阅在当前 W1 范围尚未实现，点击会显示「W1 未实现」失败态。</p></div></aside></div>`;
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
    'task-center':{title:'任务中心',kicker:'运营待办',summary:'任务中心已写入服务端活动记录，待办事项本身没有独立的数据来源，本页不展示演示工单。',facts:[['待处理','当前无待处理事项'],['来源','record_activity · activities[]']],next:['返回能力总览','返回上一页'],nextActions:[['back-from','返回','primary']]},
    'source-detail':{title:'来源详情',kicker:'可追溯',summary:s.landing?.name||'来源详情',facts:[['数据时点',s.asOfFull||'—'],['授权范围','投研 · 投顾']],next:['返回来源页'],nextActions:[['back-from','返回','primary']]},
    'new-supply':{title:'研究供给草稿',kicker:'投研供给',summary:'研究供给已写入服务端活动记录，未写入知识库。',facts:[['记录','activities[]'],['处理','未写入知识库']],next:['返回供给目录'],nextActions:[['back-from','返回供给目录','primary']]},
    'brief':{title:'简报已生成',kicker:'研究产物',summary:'已用演示数据生成一页纸简报，可继续打开候选解释。',facts:[['标题','市场与宏观一页纸'],['数据时点',s.asOfFull||'—']],next:['查看候选解释'],nextActions:[['go-pc-candidates','打开候选产品池','primary'],['back-from','返回','light']]},
    'upload':{title:'文档已解析',kicker:'智能阅读',summary:'文档上传走服务端活动记录；解析结果与识别置信度没有服务端来源，本页不展示演示数值。',facts:[['处理','仅写入活动记录']],next:['查看摘要'],nextActions:[['summary','打开摘要','primary'],['back-from','返回阅读器','light']]},
    'summary':{title:'报告摘要',kicker:'智能阅读',summary:s.landing?.aiResult?.text||'未收到 AI 生成摘要。',facts:[['来源',(s.landing?.aiResult?.citations||[]).join(' · ')||'暂无'],['模型',s.landing?.aiResult?.model||'未知'],['时延',`${s.landing?.aiResult?.latency_ms??'—'} ms`]],next:['返回原文'],nextActions:[['back-from','返回原文','primary']]},
    'save':{title:'已保存到工作区',kicker:'演示会话',summary:'记录仅写入当前演示会话，刷新后可恢复。',facts:[['位置','个人工作区 / 草稿'],['时点',s.asOfFull||'—']],next:['打开工作台'],nextActions:[['go-workspace','打开投研工作台','primary'],['back-from','返回','light']]},
    'onepager':{title:'产品解释已生成',kicker:'产品洞察',summary:s.landing?.aiResult?.text||'未收到 AI 生成解释。',facts:[['产品',p.name||s.landing?.productId||'当前产品'],['来源',(s.landing?.aiResult?.citations||[]).join(' · ')||'暂无'],['模型 / 时延',`${s.landing?.aiResult?.model||'未知'} · ${s.landing?.aiResult?.latency_ms??'—'} ms`],['提示','不构成投资建议']].concat(s.landing?.aiResult?.execution_mode==='fixture'?[['执行模式','演示桩 fixture']]:[]),next:['打开比较'],nextActions:[['go-pc-compare','打开横向比较','primary'],['back-from','返回','light']]},
    'new-writing':{title:'写作草稿已生成',kicker:'智能写作',summary:s.landing?.aiResult?.text||'未收到 AI 生成草稿。',facts:[['主题',s.landing?.topic||'当前写作任务'],['来源',(s.landing?.aiResult?.citations||[]).join(' · ')||'暂无'],['模型 / 时延',`${s.landing?.aiResult?.model||'未知'} · ${s.landing?.aiResult?.latency_ms??'—'} ms`]].concat(s.landing?.aiResult?.execution_mode==='fixture'?[['执行模式','演示桩 fixture']]:[]),next:['返回写作台'],nextActions:[['back-from','返回写作台','primary']]},
    'mobile-search':{title:'基金搜索结果',kicker:'诊基',summary:'已用演示数据匹配到持仓与热门基金。',facts:[['关键词',s.landing?.query||'—'],['命中','易方达中证A500联接A'],['口径','近一年收益 / 回撤']],next:['打开诊断'],nextActions:[['m-diagnose','深度诊基','primary'],['back-from','返回','light']]},
    // The six C-class work items below also write record_activity (like the
    // entries above). Their result page shows only the server record; the old
    // hardcoded "演示会话仅存内存" style facts are gone.
    'subscribe':{title:'订阅已生效',kicker:'研究提醒',summary:'订阅已由应用服务写入真实活动记录，刷新后可恢复；提醒本身不写入真实推送系统。',facts:[['记录','record_activity · activities[]'],['范围','今日重点 · 本周观察'],['处理','未写入真实推送']],next:['返回研究页'],nextActions:[['back-from','返回','primary']]},
    'extract':{title:'关键数据摘录',kicker:'智能阅读',summary:'关键数据提取已由应用服务写入真实活动记录；页码级摘录没有服务端来源，本页不展示演示条目。',facts:[['记录','record_activity · activities[]'],['处理','未写入摘录内容']],next:['返回阅读器'],nextActions:[['back-from','返回','primary']]},
    'templates':{title:'写作模板',kicker:'智能写作',summary:'模板管理已由应用服务写入真实活动记录；模板库当前没有服务端来源，本页不展示演示模板。',facts:[['记录','record_activity · activities[]'],['处理','未写入模板']],next:['新建写作任务'],nextActions:[['new-writing','新建写作任务','primary'],['back-from','返回','light']]},
    'review-writing':{title:'章节审阅',kicker:'质量控制',summary:'章节审阅已由应用服务写入真实活动记录；质控计数没有服务端来源，本页不提交真实发布。',facts:[['记录','record_activity · activities[]'],['处理','未提交发布']],next:['返回写作台'],nextActions:[['back-from','返回','primary']]},
    'workspace':{title:'我的研究空间',kicker:'投研工作台',summary:'研究空间已由应用服务写入真实活动记录；个人工作区条目从服务端活动记录恢复。',facts:[['记录','record_activity · activities[]'],['权限',s.role||'投顾 / 财富管理']],next:['打开智能问答'],nextActions:[['go-research','打开研究台','primary'],['back-from','返回','light']]},
    // H-01：研究计划只是一条 record_activity 记录，服务端没有「已拆解 N 步」字段，
    // 因此不再展示固定步数；真实记录（activity_id / created_at / data_version）由结果页读取 activities[]。
    'research-plan':{title:'研究计划',kicker:'智能问答',summary:'研究计划已由应用服务写入活动记录；本次请求本身没有拆解步骤的数据来源，拆解步骤以智能问答的实际回答为准。',facts:[['记录','record_activity · activities[]'],['检索范围','行内知识库 · 市场数据'],['状态',s.researchAnswer?'已有研究回答':'尚未发起研究']],next:['开始研究'],nextActions:[['ask','开始研究','primary'],['back-from','返回','light']]},
    'filter-panel':{title:'筛选条件',kicker:'列表过滤',summary:'筛选操作已由应用服务写入真实活动记录；筛选本身在会话内生效，不改动服务端列表。',facts:[['记录','record_activity · activities[]'],['当前页',s.landing?.from||route()]],next:['返回列表'],nextActions:[['back-from','返回','primary']]},
    'auth-needed':{title:'需要授权',kicker:'资产配置',summary:'生成方案前需要勾选使用持仓和风险测评信息。',facts:[['用途','配置分析'],['范围','持仓 · 风险测评'],['提示','可随时取消']],next:['返回配置'],nextActions:[['back-from','返回配置页','primary']]},
    'rule-confirmation':{title:'需要确认配置条件',kicker:'RULE MATCH',summary:'规则匹配结果为 NEED_CONFIRMATION：本次缺少判定所需的输入字段，程序没有执行规则，也没有覆盖旧方案。请补充下方「缺失字段」后重新生成。',facts:[['规则',s.ruleMatch?.rule_id||'暂无'],['版本',s.ruleMatch?.rule_version||'暂无'],['缺失字段',(s.ruleMatch?.missing_fields||[]).join(' · ')||'需人工确认'],['处理','未执行规则，未覆盖旧方案']],next:['返回配置'],nextActions:[['back-from','返回配置页','primary']]},
    // H-06 / §8.1 #8：UNSUPPORTED_RULE 与 NEED_CONFIRMATION 语义不同，不得共用
    // 「需要确认配置条件」页。规则不匹配时程序不执行规则、不产生新方案（服务端 patch 为 {}），
    // 页面据此只说明「未匹配」，不提示补充字段。
    'rule-unsupported':{title:'没有匹配的配置规则',kicker:'RULE MATCH',summary:'规则匹配结果为 UNSUPPORTED_RULE：当前目标与规则目录中的条件不匹配，程序没有执行任何规则，也没有生成或覆盖配置方案。请调整风险等级、投资期限或流动性需求后重新生成。',facts:[['规则匹配结果','UNSUPPORTED_RULE'],['规则',s.ruleMatch?.rule_id||'未选择规则'],['版本',s.ruleMatch?.rule_version||'暂无'],['当前目标',goalText()],['处理','未执行规则，未覆盖旧方案']],next:['返回配置'],nextActions:[['back-from','返回配置页','primary']]},
    'prompt-needed':{title:'请先输入问题',kicker:'问小财',summary:'用大白话描述你的理财问题后，系统会调用 AI 生成并返回证据与风险提示。',facts:[['示例','最近的市场变化会影响我的组合吗？'],['范围','已授权资料']],next:['返回助手'],nextActions:[['back-from','返回','primary']]},
    'ai-error':{title:'AI 生成失败',kicker:'AI ERROR',summary:s.promptError||'生成或 Embedding 服务未就绪，系统没有使用预置答案推进流程。请检查会话状态、证据范围或生成服务配置。',facts:[['状态',s.aiStatus||'FAILED'],['请求',s.lastQuestion||s.landing?.query||'当前任务'],['处理','未写入成功结果']],next:['返回上一页'],nextActions:[['back-from','返回','primary']]},
    'action-error':{title:'操作未完成',kicker:'REQUEST ERROR',summary:s.promptError||'应用服务未确认本次操作，页面没有展示成功结果。',facts:[['处理','未展示成功结果'],['建议','检查服务状态后重试']],next:['返回上一页'],nextActions:[['back-from','返回','primary']]},
    'sync-error':{title:'共享数据加载失败',kicker:'SESSION ERROR',summary:s.promptError||'会话或业务数据未能从应用服务加载，演示常量不会作为真实加载结果。',facts:[['处理','真实数据未加载成功'],['建议','检查应用服务后刷新重试']],next:['返回上一页'],nextActions:[['back-from','返回','primary']]},
    'm-review-detail':{title:'本周组合复盘',kicker:'投后陪伴',summary:'复盘数字取自服务端只读计算（演示数据 · AI_MODE=fixture），不是真实账务收益。',facts:[['区间','至 '+(s.asOf||'—')],['提示','复盘材料仅供客户经理内部使用']],next:['返回陪伴页'],nextActions:[['go-companion','返回投后陪伴','primary']]},
    'ask':{title:'研究结果',kicker:'智能问答',summary:`已完成研究：${s.landing?.query||s.researchAnswer?.question||'当前问题'}。回答带来源与数据时点，不构成投资建议。`,facts:[['问题',s.landing?.query||s.researchAnswer?.question||'当前问题'],['结论',s.researchAnswer?.text||'未收到生成结果'],['引用',(s.researchAnswer?.sources||[]).slice(0,2).join(' · ')||'暂无']],next:['查看候选解释'],nextActions:[['go-pc-candidates','打开候选产品池','primary'],['back-from','返回','light']]},
    'm-send':{title:'问小财已回答',kicker:'AI 助手',summary:s.lastAnswer?.text||s.promptError||'未收到 AI 生成结果。',facts:[['问题',s.lastQuestion||s.landing?.query||'当前问题'],['来源',(s.lastAnswer?.sources||[]).join(' · ')||'暂无'],['提示','信息辅助，不构成投资建议']],next:['查看持仓'],nextActions:[['m-holding','查看我的持仓','primary'],['back-from','返回助手','light']]},
    'generate-allocation':{title:'配置方案与候选已生成',kicker:'资产配置',summary:'规则结果、配置方案和真实候选均已由应用服务保存。',facts:[['目标',goalText()],['方案',s.plan?`现金 ${s.plan.cash}% · 固收 ${s.plan.bond}% · 权益 ${s.plan.equity}% · 保障 ${s.plan.protection}%`:'未生成'],['候选数',String(s.candidates?.length||0)]],next:['查看候选'],nextActions:[['go-candidates','查看候选推荐','primary'],['go-pc-candidates','打开 PC 候选池','light']]},
    'generate-candidates':{title:'候选池已生成',kicker:'产品筛选',summary:'已按当前配置方案从可售范围生成真实候选，排序不替代适当性结论。',facts:[['目标',goalText()],['候选数',String(s.candidates?.length||0)],['口径','组合角色 + 适配前提 + 风险']],next:['打开比较'],nextActions:[['go-pc-compare','打开横向比较','primary'],['back-from','返回候选池','light']]},
    'allocation-needed':{title:'请先生成配置方案',kicker:'资产配置',summary:'当前会话没有已保存的配置方案，不能生成候选或继续后续流程。',facts:[['处理','未自动补入默认方案或候选']],next:['返回配置'],nextActions:[['go-allocation','去做资产配置','primary'],['back-from','返回','light']]},
    'compare-needed':{title:'比较产品不足',kicker:'产品比较',summary:'保存比较前需要 2–3 个当前产品库中的真实产品。请先从已生成候选加入比较。',facts:[['当前有效产品数',String(realProductIds(s.compareSet).length)],['处理','未自动补入默认产品']],next:['返回候选'],nextActions:[['go-candidates','去候选推荐','primary'],['back-from','返回','light']]},
    'sync-compare':{title:'比较集已同步',kicker:'产品比较',summary:'已把林女士候选同步进比较集，使用近一年统一口径。',facts:[['产品数',String(s.compareSet?.length||0)],['观察区间','近一年 · 数据时点 '+(s.asOf||'—')]],next:['返回比较'],nextActions:[['back-from','返回比较页','primary']]},
    'save-pc-compare':{title:'比较结果已保存',kicker:'产品比较',summary:'比较结论已写入演示会话，刷新后可恢复。历史收益不能替代风险判断。',facts:[['产品数',String(s.compareSet?.length||0)],['提示','业绩比较基准不代表预期收益']],next:['返回比较'],nextActions:[['back-from','返回比较','primary']]},
    'm-save-compare':{title:'比较结果已保存',kicker:'产品比较',summary:'已保存当前比较结果，可继续做投后陪伴。',facts:[['产品数',String(s.compareSet?.length||0)],['口径','近一年 · 统一回撤']],next:['投后陪伴'],nextActions:[['go-companion','进入投后陪伴','primary'],['back-from','返回','light']]},
    'm-holding-detail':{title:'持仓明细（全部）',kicker:'持仓诊断',summary:'以下金额来自当前会话持仓数据。',facts:holdingsSummary().rows.map(row=>[row.type||'产品',`${row.name} · ${row.amount}`]),next:['基金诊基'],nextActions:[['go-fund','去做基金诊基','primary'],['back-from','返回持仓','light']]},
    'm-remind':{title:'开放日提醒已创建',kicker:'投后陪伴',summary:'已由应用服务创建开放日提醒记录，仅存当前会话。',facts:[['事项','稳盈固收开放日'],['状态','已写入 create_reminder']],next:['返回陪伴'],nextActions:[['go-companion','返回投后陪伴','primary']]},
    'm-submit-care':{title:'服务建议已提交',kicker:'投后陪伴',summary:'已提交给客户经理确认。客户经理决定是否触达客户。',facts:[['建议','发送一条波动解释给客户'],['状态',s.careSubmitted?'WAITING_FOR_MANAGER':'待客户经理确认'],['提示','不构成投资建议']],next:['返回陪伴'],nextActions:[['go-companion','返回投后陪伴','primary']]},
    'pref-updated':{title:'选项已更新',kicker:'演示设置',summary:`已更新「${s.landing?.name||'选项'}」为${s.landing?.on?'开启':'关闭'}。仅写入当前演示会话。`,facts:[['选项',s.landing?.name||'研究口径'],['状态',s.landing?.on?'已开启':'已关闭'],['数据时点',s.asOf||'—']],next:['返回'],nextActions:[['back-from','返回','primary']]}
  };
  if(!map[id]) return {title:'W1 未实现',kicker:'操作未完成',summary:`该操作（${id||'未知'}）在当前 W1 范围尚未实现，系统没有写入任何状态，也没有展示成功结果。`,facts:[['操作',id||s.landing?.attempted||'未知'],['处理','未写入成功状态']],next:['返回上一页'],nextActions:[['back-from','返回','primary']]};
  return map[id];
}
function landingBody(){
  const L=session().landing||{id:'save'};
  const workItem=WORK_ITEM_ACTIONS.has(L.id);
  // Landing ids that used to show hardcoded facts but have no server writer
  // now resolve to the explicit not-implemented spec. Unknown ids already fall
  // through to not-implemented inside landingSpec().
  const specId=NOT_IMPLEMENTED_LANDINGS.includes(L.id)?'not-implemented':L.id;
  const spec=landingSpec(specId);
  const facts=(spec.facts||[]).map(x=>`<div class="stat-row"><span>${x[0]}</span><b>${Array.isArray(x[1])?esc(x[1].join(' · ')):x[1]}</b></div>`).join('');
  const actions=(spec.nextActions||[['back-from','返回','primary']]).map(a=>btn(a[1],a[0],a[2])).join('');
  const syncText=window.WealthApi?.connected?'共享会话已同步':'共享会话未连接';
  const activityList=session().activities||[];
  const last=activityList.at(-1);
  const summaryText=workItem?(last?`已由应用服务写入真实记录（${esc(last.kind)}），刷新后可恢复。`:'尚未写入服务端记录，请重试。'):esc(spec.summary);
  const stateCard=workItem&&last?`<div class="callout good session-flag">服务端状态：${esc(last.activity_id)} · ${esc(last.created_at)} · ${esc(last.data_version)}（累计 ${activityList.length} 条）</div>`:'';
  // Every real call carries the request_id it was issued with; repeating the
  // same request_id is answered by the service instead of producing a second
  // result, so the id stays visible on the result page (A11).
  const idCard=L.requestId?`<div class="callout request-flag"><b>请求标识 request_id</b>${icon('info')} ${esc(L.requestId)} · 同一 request_id 的重复提交不会生成重复结果；${workItem?'本页只显示最近一条服务端记录。':'本页显示该请求的生成结果。'}</div>`:'';
  return `<div class="insight-header"><div class="badge blue">${esc(spec.kicker)}</div><h2 style="margin-top:10px">${esc(spec.title)}</h2><p class="muted">数据时点 ${esc(L.asOf||session().asOf||'—')} · ${syncText}</p></div><p class="section-space">${summaryText}</p><div class="card section-space">${facts}${stateCard}${idCard}<div class="callout">结果供流程验证，不构成投资建议；业务状态由共享应用服务校验。</div></div><div class="path-next">${actions}</div>`;
}
function pageResult(){
  const from=session().landing?.from||'pc/architecture';
  return pageHeading('RESULT','结果页','承接上一跳操作；成功状态只来自共享应用服务写入的记录或真实生成结果。',btn('返回上一页','back-from','primary'))+`<div class="grid main-aside"><div class="stack">${landingBody()}</div><aside class="stack"><div class="card"><div class="card-head"><h2>来源页</h2></div><p class="muted">#${esc(from)}</p>${btn('打开来源页','back-from','full')}</div></aside></div>`;
}
function mobileResult(){
  return `<div class="eyebrow">RESULT</div><h1>执行结果</h1><p class="sub">成功状态只来自服务端记录或真实生成结果，不构成投资建议。</p>${landingBody()}`;
}

function desktopPage(r){ switch(r){case'pc/architecture':return pageArchitecture();case'pc/supply':return pageSupply();case'pc/workspace':return pageWorkspace();case'pc/research':return pageResearch();case'pc/events':return researchPage('events');case'pc/macro':return researchPage('macro');case'pc/industry':return researchPage('industry');case'pc/library':return pageLibrary();case'pc/reader':return pageReader();case'pc/writing':return pageWriting();case'pc/candidates':return pageCandidates();case'pc/compare':return pageCompare();case'pc/product-fund':return productPage('fund');case'pc/product-insurance':return productPage('insurance');case'pc/product-wealth':return productPage('wealth');case'pc/product-deposit':return productPage('deposit');case'pc/product-private':return pageProductPrivateRestricted();case'pc/result':return pageResult();default:return pageArchitecture();} }

function mobileHeader(r,title){ return `<header class="phone-header"><button class="icon-btn" data-action="mobile-menu" aria-label="打开导航">${icon('grid')}</button><div><h3>${title}</h3><small>财富智服 · 演示桩 fixture</small></div><button class="icon-btn" data-action="mobile-help" aria-label="帮助">${icon('help')}</button></header>`; }
function mobileBottom(r){ return `<nav class="phone-bottom"><a href="#m/assistant" data-action="open-route" data-route="m/assistant" class="${r==='m/assistant'?'active':''}">${icon('spark')}助手</a><a href="#m/fund" data-action="open-route" data-route="m/fund" class="${r==='m/fund'?'active':''}">${icon('chart')}诊断</a><a href="#m/allocation" data-action="open-route" data-route="m/allocation" class="${r==='m/allocation'?'active':''}">${icon('sliders')}配置</a><a href="#m/holdings" data-action="open-route" data-route="m/holdings" class="${r==='m/holdings'?'active':''}">${icon('grid')}我的</a></nav>`; }
function mobileStage(r, title, inner){return `<div class="mobile-stage"><aside class="mobile-nav"><div class="brand"><span class="mark">${icon('spark')}</span><div><strong>财富智服</strong><small>PHONE WEB PROTOTYPE</small></div></div><h4>手机网页原型</h4>${mobileNav.map(x=>`<a class="nav-link ${x[0]===r?'active':''}" href="#${x[0]}" data-action="open-route" data-route="${x[0]}">${icon(x[2])}<span>${x[1]}</span></a>`).join('')}<div class="callout" style="margin-top:22px;font-size:12px">此侧栏用于原型演示，实际交互入口由手机银行 / 客户经理工作台承载。</div></aside><div class="phone">${mobileHeader(r,title)}<section class="phone-body">${inner}</section>${mobileBottom(r)}</div><aside class="mobile-notes"><h3>原型说明</h3><p>该功能按需求表选择为<strong>手机网页</strong>，模拟手机银行内嵌页。W1 固定 <strong>AI_MODE=fixture</strong>（演示桩 fixture），结果不构成真实模型或生产验收结论。</p><ol><li>点击快捷入口体验流程</li><li>输入问题可触发示例回答</li><li>结果卡片展示依据与风险提示</li></ol><button class="btn light full" data-action="requirements">查看 33 项需求映射</button><p class="mobile-footer-note">演示数据仅供产品原型使用，不构成投资建议或交易指令。</p></aside></div>`; }
function mobileAssistant(){
  const s=session();
  const answer=s.lastAnswer;
  // H-05：多轮追问不串档。lastAnswer / lastQuestion 是冻结契约里的单槽（同为 1 个 PATCH 字段），
  // 本页按「本次回答所属的问题」只渲染这一轮：上一轮追问不会被当成新问题的答案，
  // 输入框也不会把上一轮问题填回成新问题的草稿。历史轮次条数只读 aiRequests（服务端 request_id 列表）。
  const currentQuestion=String(s.lastQuestion||'').trim();
  const roundCount=Array.isArray(s.aiRequests)?s.aiRequests.length:0;
  const bubble=answer
    ? `<div class="chat-bubble"><div class="chat-name">${icon('spark')} 财富智服</div><p>${esc(currentQuestion||'（本轮问题未记录）')}</p><p>${esc(answer.text)}</p><div class="chips">${(answer.sources||[]).map(x=>`<button class="source" data-action="source-detail">${esc(x)}</button>`).join('')}</div>${String(answer.model||'').includes('fixture')?'<p class="muted">演示桩 fixture</p>':''}</div><div class="callout warn">以上为信息辅助，不构成投资建议或交易指令。</div>`
    : `<div class="chat-bubble"><div class="chat-name">${icon('spark')} 财富智服</div>你可以直接问我：最近的市场变化会影响我的组合吗？</div>`;
  // H-05：删除硬编码「2 条持仓提醒」。提醒条数只取服务端 activities[]，没有记录就明说没有。
  const activities=(s.activities||[]);
  const alerts=activities.length;
  const reminderLine=alerts
    ? `<div class="metric-value">${alerts} 条服务端活动</div><p class="dim">来自服务端 activities[]，最近一条 ${esc(String(activities.at(-1)?.created_at||'—'))}</p>`
    : `<div class="metric-value">暂无持仓提醒</div><p class="dim">服务端没有写入提醒记录；本页不展示演示提醒条数。</p>`;
  return `<div class="mobile-welcome"><span class="badge blue">${icon('spark')} AI 理财助手</span><h1>你好，${esc(s.customerName||'客户')}</h1><p>我会把复杂的市场和产品讲清楚，也会标出需要你确认的地方。</p></div><div class="mobile-highlight"><div class="dim">数据时点 · ${esc(s.asOfFull||'—')}</div>${reminderLine}<button class="btn" data-action="m-holding">查看我的持仓</button></div><div class="mobile-feature-grid"><a class="mobile-feature" href="#m/fund">${icon('chart')}诊基</a><a class="mobile-feature" href="#m/allocation">${icon('sliders')}做配置</a><a class="mobile-feature" href="#m/candidates">${icon('filter')}找产品</a></div><div class="card" style="margin-top:15px"><div class="card-head"><h2>问小财</h2>${statusBadge(answer?'已回答':'已连接',answer?'blue':'green')}</div>${bubble}<div class="prompt-quick"><button data-action="m-quick">为什么今天基金涨跌不一？</button><button data-action="m-quick">帮我看一下我的组合</button></div><div class="chat-compose"><input id="mobilePrompt" placeholder="用大白话问理财问题" value=""/><button class="btn primary" data-action="m-send">${icon('send')}</button></div><p class="muted">追问会覆盖上一轮回答（服务端助手状态只有一个 lastAnswer 槽位），不会把旧回答当成新问题的答案；累计 ${roundCount} 次服务端请求${roundCount?'（aiRequests）':''}。</p></div>${answer?`<div class="path-next">${btn('去看持仓诊断','m-holding','primary full')}</div>`:''}<p class="mobile-footer-note">回答由演示桩 fixture 生成，会展示数据时点、来源和不确定事项，不构成投资建议。</p>`;
}
function fundCard(item, saved){
  return `<div class="mobile-product"><div class="between"><div><span class="badge ${item.badge||''}">${esc(item.tag)}</span><h3>${esc(item.name)}</h3></div><div class="rate">${esc(item.ret)}<small>近一年</small></div></div><div class="product-meta">${esc(item.meta)}</div><div class="between"><span class="muted">${esc(item.note)}</span>${item.action==='diagnose'?btn(saved?'查看诊断':'深度诊基','m-diagnose','small primary',item.product):`<button class="btn small" data-action="m-product-detail" data-product="${esc(item.product)}">查看详情</button>`}</div></div>`;
}
function mobileFund(){
  const s=session();
  const saved=s.diagnosis;
  const view=viewOf()||'我的持仓';
  const held=(sessionApi()?.HOLDINGS||[]).map(h=>h.id);
  const all=productRows().filter(p=>p.type==='基金').map((p)=>{
    const isHeld=held.includes(p.id);
    const cats=['热门基金'].concat(isHeld?['我的持仓']:[]);
    return {tag:`${p.type} · ${p.risk}`,name:p.name,ret:p.ret||'—',meta:`最大回撤 ${p.drawdown||'—'}　费率 ${p.fee||'—'}　流动性 ${p.liquidity||'—'}`,note:isHeld?'当前客户持有，可生成诊断':'无持仓不可诊断',product:p.id,cats,action:isHeld?'diagnose':undefined,badge:'blue'};
  }).filter(x=>x.cats.includes(view));
  const empty=view==='我的持仓'?'当前客户没有基金持仓，暂无可诊断基金。':'该分类暂无产品';
  return `<div class="between"><div><div class="eyebrow">AI DIAGNOSIS</div><h1>基金诊断</h1></div><button class="icon-btn" data-action="mobile-search">${icon('search')}</button></div><p class="sub">产品来自 GET /api/demo-data；只有当前客户持有的产品才可生成诊断。</p>${saved?`<div class="callout good session-flag">已保存诊断：${esc(saved.name)} · 数据时点 ${esc(saved.asOf)} · 回撤 ${esc(saved.drawdown)}</div>`:''}<div class="mobile-tags">${['我的持仓','热门基金'].map(x=>tabBtn(x,'我的持仓')).join('')}</div>${all.map(x=>fundCard(x,saved)).join('')||`<div class="card"><p>${esc(empty)}</p></div>`}<div class="callout good">${icon('info')} 当前视图：${esc(view)}。诊断会同时检查产品表现、行业暴露和你的持仓集中度。</div>${saved?`<div class="path-next">${btn('去做资产配置','go-allocation','primary full')}</div>`:''}`;
}
function mobileInsurance(){
  const products=panelProducts('insurance');
  if(!products.length){
    return `<div class="eyebrow">INSURANCE</div><h1>保险保障检视</h1><p class="sub">把保障责任、缴费和待确认事项放在一处。</p><div class="card"><div class="callout warn"><b>未授权或暂无可展示保单</b><p>应用服务没有返回保单数据；保障缺口与待办没有服务端来源，本页不展示演示数值。</p></div></div>`;
  }
  return `<div class="eyebrow">INSURANCE</div><h1>保险保障检视</h1><p class="sub">把保障责任、缴费和待确认事项放在一处。系统不替代健康告知、核保和理赔审核。</p><div class="card"><div class="card-head"><h2>我的保障</h2><p class="muted">来自 GET /api/demo-data</p></div><div class="callout warn"><b>暂未发现缺口</b><p>保障缺口与覆盖度没有服务端计算来源，本页不展示演示百分比。</p></div></div>${products.map(p=>`<div class="card"><div class="card-head"><h2>${esc(p.name)}</h2>${statusBadge('产品事实','blue')}</div>${productFactsCard(p)}${btn('查看保障详情','m-coverage','light full',p.id)}</div>`).join('')}`;
}
// P-14: 可售徽章只读服务端 sale_status。原来的徽章不看该字段，任何产品都显示「我行可售」；
// 现在既没有该字段也不得显示可售，且明确给出「未提供」，不以默认值补齐。
function saleBadgeChip(sale){
  if(!sale.known) return `<span class="chip muted">可售状态未提供</span>`;
  return `<span class="chip ${sale.onSale?'good':'warn'}">${sale.onSale?'我行可售':'暂不可售'} · ${esc(sale.raw)}</span>`;
}
function wealthCard(id){
  const p=productOf(id)||{};
  const sale=saleStatusOf(p);
  // The only return the snapshot publishes is the 近一年 interval return; a
  // product without it shows 未提供 instead of an empty rate block.
  const rate=p.latest_return==null?`<div class="rate"><small>近一年收益未提供</small></div>`:`<div class="rate">${esc(p.ret||'')}<small>近一年</small></div>`;
  return `<div class="mobile-product"><div class="between"><div><span class="badge ${id==='wealth'?'blue':''}">${esc(p.risk||'')} · ${esc(p.role||'')}</span><h3>${esc(p.name||id)}</h3></div>${rate}</div><div class="product-meta">${esc(p.detail||'')}　${esc(p.liquidity||'')}</div><div class="chips"><span class="chip">${esc(p.role||'')}</span>${saleBadgeChip(sale)}</div><div class="between" style="margin-top:12px">${btn('看懂产品','m-wealth-detail','small',id)}<button class="link-btn" data-action="m-save" data-product="${esc(id)}">加入比较 ${icon('plus')}</button></div></div>`;
}
function mobileWealth(){
  const view=['全部','现金管理','固收','固收+'].includes(viewOf())?viewOf():'全部';
  const products=serverProductRows('理财');
  const ids=products.map(p=>p.id);
  const byId=new Map(products.map(p=>[p.id,p]));
  const map={全部:ids,现金管理:ids.filter(id=>String(byId.get(id)?.role||'').includes('现金')),固收:ids.filter(id=>String(byId.get(id)?.role||'').includes('底仓')),'固收+':ids.filter(id=>String(byId.get(id)?.role||'').includes('增强'))};
  const list=map[view]||map['全部'];
  if(!list.length){
    const body=ids.length
      ? `<div class="card"><p>当前视图暂无产品</p><p class="muted">服务端只返回 ${ids.length} 只理财产品，没有「${esc(view)}」分类下的产品；系统不补入默认产品。</p></div>`
      : `<div class="card"><p>当前视图暂无产品</p><p class="muted">GET /api/demo-data 没有返回「理财」类产品（或共享会话尚未就绪），本页不展示任何演示产品。</p></div>`;
    return `<div class="eyebrow">WEALTH PRODUCT</div><h1>理财产品</h1><p class="sub">按风险、期限和流动性找到适合的产品。</p><div class="mobile-tags">${['全部','现金管理','固收','固收+'].map(x=>tabBtn(x,'全部')).join('')}</div>${body}<p class="mobile-footer-note">当前视图：${esc(view)}。业绩比较基准不代表预期收益；可售状态取自服务端 sale_status。</p>`;
  }
  return `<div class="eyebrow">WEALTH PRODUCT</div><h1>理财产品</h1><p class="sub">按风险、期限和流动性找到适合的产品。</p><div class="mobile-tags">${['全部','现金管理','固收','固收+'].map(x=>tabBtn(x,'全部')).join('')}</div>${list.map(wealthCard).join('')}<p class="mobile-footer-note">当前视图：${esc(view)}，共 ${list.length} 只，来自 GET /api/demo-data。业绩比较基准不代表预期收益；可售徽章只读服务端 sale_status。</p>`;
}
function mobileDeposit(){
  const dep=productOf('deposit')||{};
  return `<div class="eyebrow">DEPOSIT</div><h1>存款产品</h1><p class="sub">利率与期限来自服务端产品事实；到期本息由服务端只读计算接口给出。</p><div class="card"><div class="card-head"><h2>${esc(dep.name||'存款产品')}</h2>${statusBadge('演示桩 fixture','blue')}</div>${productFactsCard(dep)}</div>${depositCard('到期本息测算',{emptyText:'该期限暂无挂牌利率',pendingText:'正在读取服务端存款本息计算…'})}<p class="mobile-footer-note">本息为单利测算，按服务端返回的挂牌利率计算；提前支取与期限比较同样只使用服务端计算结果，浏览器不计算金额。</p>`;
}
function mobilePrivate(){const s=session(); return `<div class="eyebrow">PRIVATE BANK</div><h1>私行产品</h1><p class="sub">受限内容需要先完成资格确认和适当性校验。</p><div class="restricted">${icon('lock')}<h2>请先完成合格投资者认定</h2><p>当前账户未展示私募基金、信托和专户产品详情。完成认定后，产品说明书和募集材料才会在授权范围内展示。</p>${btn('查看办理指引','m-qualification','primary full')}${s.contactTodo?`<div class="callout good">已创建联系客户经理待办。</div>`:`<button class="link-btn" data-action="m-contact">联系客户经理</button>`}</div><div class="card"><div class="card-head"><h2>办理进度</h2>${statusBadge('空态','blue')}</div><div class="callout">合格投资者认定没有服务端可写状态，本页不展示演示办理进度。</div></div>`;}
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
  // A04：撤销授权入口。复用现有 set_authorization 命令（不新增命令、不改冻结集合）。
  // 反向勾选检查框与点击「撤销授权」都走同一条 set_authorization 路径；下游状态
  //（方案 / 候选 / 比较 / 陪伴 / 活动记录）由服务端 downstreamReset() 级联清空，页面只读服务端结果。
  const authBox=s.authorized===false
    ? `<div class="callout warn"><b>当前未授权使用持仓和风险测评信息</b><p>生成方案、生成候选、保存比较与投后陪伴命令都会被服务端拒绝（INSUFFICIENT_EVIDENCE）。重新勾选授权后可以继续。</p></div>`
    : `<div class="between"><span class="muted">可随时撤销；撤销后服务端会清空方案、候选、比较与陪伴状态。</span>${btn('撤销授权','m-revoke-auth','light')}</div>`;
  return `<div class="eyebrow">ASSET ALLOCATION</div><h1>做一份资产配置</h1><p class="sub">先说清楚目标和约束，方案才有意义。</p>${s.authNotice?`<div class="callout ${s.authorized?'good':'warn'}">${esc(s.authNotice)}</div>`:''}<div class="card"><div class="card-head"><h2>${plan?'2 / 3 方案已生成':'1 / 3 客户目标'}</h2>${statusBadge(plan?'已保存':'约 1 分钟',plan?'green':'blue')}</div><div class="form-grid"><label>投资金额<input id="allocAmount" value="${esc(g.amount||'¥500,000')}"/></label><label>投资期限<select id="allocTerm">${termOpts}</select></label><label>风险等级<select id="allocRisk">${riskOpts}</select></label><label>资金用途<select id="allocPurpose">${purposeOpts}</select></label></div><label class="section-space">多久可能需要用到这笔钱？<select id="allocLiquidity">${liqOpts}</select></label><label class="check section-space"><input id="allocAuth" type="checkbox"${s.authorized!==false?' checked':''}/>我已授权使用持仓和风险测评信息</label>${btn(plan?'重新生成方案':'生成配置方案','m-generate-allocation','primary full')}<div class="divider"></div>${authBox}</div>${planCard}`;
}
// P-15: 持有收益 / 收益贡献 / 集中度 only come from the read-only portfolio
// calculation endpoint. Two denominators are shown side by side and are never
// mixed: all_assets (全部持仓市值) and equity_assets (权益类持仓市值).
// 保险保费 (annual_premium) is not a holdings row and never enters any sum.
// GET /api/demo-data sends amounts/rates as strings (pg NUMERIC); they are
// converted to numbers here only so the server's ratio can be printed.
const PORTFOLIO_BASIS_LABEL={all_assets:'全资产口径',equity_assets:'权益资产口径'};
const holdingIdOf=(holding)=>holding?.id;
const holdingNameOf=(id)=>(sessionApi()?.HOLDINGS||[]).find(h=>holdingIdOf(h)===id)?.name||'';
function portfolioConcentrationRow(calc){
  const allBasis=calc.max_concentration_basis||'all_assets';
  const eq=calc.equity||{};
  const eqBasis=eq.max_concentration_basis||'equity_assets';
  const row=(basis,fraction,name,unavailableText)=>{
    const label=PORTFOLIO_BASIS_LABEL[basis]||basis;
    const n=numOrNull(fraction);
    const value=n==null?unavailableText:`${(n*100).toFixed(2)}%`;
    return `<div class="stat-row"><span>最大单产品权重 · <b>${esc(label)}</b><br><small class="muted">basis=${esc(basis)}${name?` · ${esc(name)}`:''}</small></span><b>${esc(value)}</b></div>`;
  };
  const eqAvailable=eq.available===true&&numOrNull(eq.max_concentration)!=null;
  return `<div class="list-row"><h3>集中度（两种分母口径，不可混用）</h3>${row(allBasis,calc.max_concentration,holdingNameOf(calc.max_concentration_holding_id),'服务端未返回')}${eqAvailable?row(eqBasis,eq.max_concentration,holdingNameOf(eq.max_concentration_holding_id)):row(eqBasis,null,'','该口径不可用（无权益持仓）')}<p class="muted">全资产口径的分母是全部持仓市值（保险保费不在持仓内，不参与合计）；权益资产口径的分母只是权益类持仓市值，仅在该口径可用时展示。</p></div>`;
}
function portfolioReturnRow(calc){
  const hr=calc.holding_return||{};
  const amount=numOrNull(hr.amount);
  if(hr.available!==true||amount==null){
    return `<div class="list-row"><h3>持有收益</h3><p class="muted">服务端未返回可用收益：${esc(hr.unavailable_reason||'缺少收益基准')}。本页不展示估算金额。</p></div>`;
  }
  return `<div class="list-row"><h3>持有收益（服务端估算）</h3>${calcRow('收益金额',cny(amount))}${calcRow('收益率',ratioToPct(numOrNull(hr.rate)))}${calcRow('口径',`${hr.basis||'—'} · level=${hr.level||'—'}`)}<p class="muted">${esc(hr.note||'由持仓累计收益率按成本还原估算，不视为账务级收益。')}</p></div>`;
}
function mobileHoldings(){
  const s=session();
  const {rows,total,byType}=holdingsSummary();
  const colors=['#386bda','#769df0','#59b4b2','#dbc58d','#8069c4'];
  const legend=Object.entries(byType).map(([type,amount],i)=>`<span><i class="swatch" style="background:${colors[i%colors.length]}"></i>${esc(type)} ${total?((amount/total)*100).toFixed(1):'0.0'}%</span>`).join('');
  ensureCalc('portfolio',{});
  const store=CALC_STORES.portfolio;
  const view=calcStateView(store,{what:'持仓收益、收益贡献与集中度'});
  const calc=store.data?.calculation||null;
  const unavailable=store.status==='ok'&&store.data?.available!==true;
  let calcCard;
  if(unavailable){
    const reason=store.data?.unavailable_reason;
    const title=reason==='no_holdings'?'暂无持仓':reason==='unauthorized'?'未授权查看持仓计算':'服务端未返回持仓计算';
    calcCard=`<div class="card"><div class="card-head"><h2>收益与集中度</h2>${statusBadge('空态','blue')}</div><div class="callout"><b>${esc(title)}</b><p>服务端未给出可计算的持仓，本页不展示 0 元，也不展示任何估算收益或集中度。</p><p class="muted">${esc(reason?`unavailable_reason=${reason}`:'')}</p></div></div>`;
  }else if(view){
    calcCard=`<div class="card"><div class="card-head"><h2>收益与集中度</h2>${statusBadge(view.badge,view.tone==='red'?'red':'blue')}</div><div class="callout ${view.tone==='red'?'warn':''}">${view.lead}${view.body}</div></div>`;
  }else{
    calcCard=`<div class="card"><div class="card-head"><h2>收益与集中度</h2>${statusBadge('服务端计算结果','green')}</div>${portfolioReturnRow(calc)}${portfolioConcentrationRow(calc)}<div class="list-row"><h3>计算来源</h3>${calcIdRow(calc.calculation_id)}${calcRow('计算版本',calc.calculation_version)}${calcRow('数据时点',formatTime(store.data?.data_as_of||calc.data_as_of)||'—')}${calcRow('合计（全资产口径）',cny(calc.total_amount))}</div><p class="muted">以上收益、贡献与集中度均取自服务端只读计算接口；保险保费不计入持仓金额合计。排序与结论不替代适当性判断。</p></div>`;
  }
  // Contributions are matched by holding_id (the server's key) and only shown
  // when the server actually published a contribution for that position.
  const positions=Array.isArray(calc?.positions)?calc.positions:[];
  const contributionOf=(holdingId)=>{
    const pos=positions.find(p=>p.holding_id===holdingId)||null;
    const value=numOrNull(pos?.contribution_to_total_return);
    return value==null?null:`${(value*100).toFixed(2)}%`;
  };
  const detailRows=rows.map(x=>{
    const contribution=contributionOf(holdingIdOf(x));
    return `<div class="stat-row"><span><b>${esc(x.name)}</b><br><small class="muted">${esc(x.type)}</small></span><b>${esc(x.amount)}<br><small class="positive">${esc(x.ret)}</small>${contribution?`<br><small class="muted">收益贡献 ${esc(contribution)}</small>`:''}</b></div>`;
  }).join('');
  const count=(rows.length>0&&total===0)?'×':String(Object.keys(byType).length);
  return `<div class="eyebrow">MY HOLDINGS</div><h1>持仓诊断</h1><p class="sub">收益、风险和集中度放在同一张图里。</p><div class="mobile-highlight"><div class="dim">总资产 · 截至 ${esc(s.asOf||'—')}</div><div class="metric-value">${moneyText(total)}</div><div class="between"><span class="dim">持有收益</span><b>${numOrNull(calc?.holding_return?.amount)!=null&&calc.holding_return.available===true?`${cny(numOrNull(calc.holding_return.amount))}（估算）`:'服务端未提供组合收益'}</b></div></div><div class="card"><div class="card-head"><h2>资产分布</h2><span class="muted">按市值</span></div><div class="mobile-diagnostic"><div class="donut"><div class="donut-center"><b>${esc(count)} 类</b>资产</div></div><div class="legend">${legend||'<span>暂无持仓</span>'}</div></div>${btn('去做基金诊基','go-fund','primary full')}</div>${calcCard}<div class="card"><div class="card-head"><h2>持仓明细</h2></div>${detailRows}${btn('查看全部','m-holding-detail','primary full')}</div>${s.reviewReady||s.plan?`<div class="path-next">${btn('查看投后陪伴','go-companion','full')}</div>`:''}`;
}
function mobileCandidates(){
  const s=session();
  const ids=candidateIds();
  const compared=s.compareSet||[];
  const calc=s.candidateCalculation||null;
  const reasons=Array.isArray(calc?.reasons)?calc.reasons:[];
  // P-16: the constraint line is read from candidateCalculation.reasons[].constraints
  // and holding_months; the old fixed copy「适配你的资金期限」is gone. The same
  // reason table also drives the ranking, so order and copy share one source.
  const orderedReasons=reasons.filter(r=>ids.includes(r?.product_id));
  const rankedIds=orderedReasons.length?orderedReasons.map(r=>r.product_id):ids;
  const reasonOf=(id)=>reasons.find(r=>r?.product_id===id)||null;
  const monthsText=(months)=>{const n=numOrNull(months); return n==null||n<=0?'':`${Number.isInteger(n)?n:n.toFixed(1)} 个月`;};
  const constraintsText=(entry)=>{
    const c=entry?.constraints||{};
    const parts=[];
    const holdMonths=monthsText(entry?.holding_months);
    if(holdMonths) parts.push(`持有期 ${holdMonths}`);
    if(c.goal_term) parts.push(`目标期限 ${c.goal_term}`);
    if(c.goal_liquidity) parts.push(`流动性需求「${c.goal_liquidity}」`);
    if(c.customer_risk||c.goal_risk) parts.push(`风险 客户 ${c.customer_risk||'—'} / 目标 ${c.goal_risk||'—'}`);
    if(c.sale_status) parts.push(`可售状态 ${c.sale_status}`);
    return parts.join(' · ');
  };
  const REASON_LABEL={risk_term_liquidity_sale_checked:'风险、期限、流动性与可售状态均通过校验',holding_period_exceeds_liquidity_or_term:'持有期超过流动性需求或目标期限',risk_above_customer:'风险等级高于客户风险等级',risk_above_goal:'风险等级高于目标风险等级',not_on_sale:'产品不可售',risk_level_unknown:'风险等级缺失'};
  const rankText=(id)=>{
    const entry=reasonOf(id);
    if(!entry) return '';
    const pos=rankedIds.indexOf(id);
    const holdMonths=numOrNull(entry.holding_months);
    const rankPart=pos>=0?`第 ${pos+1} 条（风险档由低到高、同档按 product_id）`:'';
    return [rankPart,holdMonths!=null&&holdMonths>0?`持有期 ${monthsText(entry.holding_months)}`:'',REASON_LABEL[entry.reason]||entry.reason||''].filter(Boolean).join(' · ');
  };
  const list=rankedIds.map((id,i)=>{
    const p=productOf(id)||{};
    const inSet=compared.includes(id);
    const entry=reasonOf(id);
    const constraints=constraintsText(entry);
    const fallback=calc?'服务端 candidateCalculation 未返回该候选的约束':'服务端尚未返回 candidateCalculation（候选需由 generate_candidates 写入），本页不展示固定口径的适配理由';
    return `<div class="mobile-product"><div class="between"><div><span class="badge ${i===1?'blue':''}">${esc(p.risk||'')} · ${esc(p.role||'')}</span><h3>${esc(p.name||id)}</h3></div>${p.latest_return==null?'':`<b class="text-blue" style="font-size:20px">${esc(p.ret||'')}</b>`}</div><div class="product-meta">${esc(p.drawdown?`${p.drawdown} 近一年最大回撤`:'近一年最大回撤未提供')}</div><p class="muted">排序依据：${esc(rankText(id)||fallback)}</p><p class="muted">约束：${esc(constraints||fallback)}</p><div class="between"><button class="btn small" data-action="m-candidate-reason" data-product="${esc(id)}">查看理由</button><button class="link-btn" data-action="m-compare-add" data-product="${esc(id)}">${inSet?'已加入比较':'加入比较'}</button></div></div>`;
  }).join('');
  return `<div class="eyebrow">PRODUCT MATCH</div><h1>候选推荐</h1><p class="sub">根据你的目标，给出候选方向，再由你确认。</p><div class="callout">已使用：${esc(goalText())}${s.plan?' · 已关联配置方案':''}${calc?.calculation_id?` · candidateCalculation ${esc(calc.calculation_id)}`:''}</div>${s.plan?`<div class="callout good">方案占比：现金 ${s.plan.cash}% · 固收 ${s.plan.bond}% · 权益 ${s.plan.equity}% · 保障 ${s.plan.protection}%</div>`:''}${list||`<div class="card"><p>尚未生成真实候选。请先完成资产配置并生成候选，系统不会补入默认产品。</p>${btn('去做资产配置','go-allocation','primary full')}</div>`}<p class="mobile-footer-note">候选排序、排序依据与约束均取自服务端 candidateCalculation.reasons[]（constraints / holding_months）；未返回的字段显示「未提供」，不使用固定口径文案。排序不替代适当性结论和客户经理判断。</p>${compared.length?`<div class="path-next">${btn(`查看比较（${compared.length}）`,'go-compare','primary full')}</div>`:''}`;
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
  // H-03：删除「历史收益更高的产品，回撤和波动通常也更高」这类未经计算的固定结论；
  // 结论只来自 comparisonReadout()：服务端 comparable / incomparable_reason 决定能不能排名。
  const conclusion=comparisonConclusion(ids);
  return `<div class="eyebrow">COMPARE</div><h1>产品比较</h1><p class="sub">用相同的时间和指标口径，看清差异。当前 ${cols.length} 个产品。</p><div class="mobile-tags">${['表现','风险','流动性','费用'].map(x=>tabBtn(x,'表现')).join('')}</div><div class="card"><div class="table-wrap"><table><thead>${head}</thead><tbody>${rows.join('')}</tbody></table></div><div class="callout ${conclusion.rankable?'':'warn'}"><b>${esc(conclusion.badge)}：</b>${conclusion.text}<br><span class="muted">业绩比较基准不代表预期收益。${s.compareSaved?' 比较结果已保存。':''}</span></div>${btn('保存比较结果','m-save-compare','primary full')}</div><div class="path-next">${btn('进入投后陪伴','go-companion','primary full')}</div>`;
}
function mobileCompanion(){
  const s=session();
  // P-17: review figures come from the same read-only portfolio endpoint as
  // P-15; no +0.86% / 68% / R3 copy is hardcoded. W1 runs AI_MODE=fixture, so
  // the block is explicitly marked as 演示数据 rather than a real review.
  ensureCalc('portfolio',{});
  const store=CALC_STORES.portfolio;
  const view=calcStateView(store,{what:'本周组合复盘数字'});
  const calc=store.status==='ok'&&store.data?.available===true?(store.data.calculation||null):null;
  const hr=calc?.holding_return||{};
  let reviewBody;
  if(view){
    reviewBody=`<div class="callout ${view.tone==='red'?'warn':''}">${view.lead}${view.body}</div>`;
  }else if(!calc){
    reviewBody=`<div class="callout"><b>${esc(store.data?.unavailable_reason==='no_holdings'?'暂无持仓':'未授权查看持仓计算')}</b><p>服务端未给出可计算的持仓，本页不展示复盘收益与目标完成度。</p></div>`;
  }else{
    const hrAmount=numOrNull(hr.amount);
    const rows=[
      hr.available===true&&hrAmount!=null?calcRow('持有收益（服务端估算）',cny(hrAmount)):`<div class="stat-row"><span>持有收益</span><b>服务端未提供</b></div>`,
      hr.available===true&&hrAmount!=null?calcRow('收益率（估算）',ratioToPct(numOrNull(hr.rate))):'',
      calcRow('最大单产品权重 · 全资产口径',ratioToPct(numOrNull(calc.max_concentration))),
      calc.equity?.available===true?calcRow('最大单产品权重 · 权益资产口径',ratioToPct(numOrNull(calc.equity.max_concentration))):'',
      calcRow('风险等级',s.risk||s.goal?.risk||'—')
    ].filter(Boolean).join('');
    reviewBody=`<div class="list-row">${rows}${calcIdRow(calc.calculation_id)}</div><p class="muted">以上数字来自服务端只读计算（演示数据 · AI_MODE=fixture），不是真实账务收益，也不构成对客户的历史业绩陈述。权益口径与全资产口径不同，不可混用。</p>`;
  }
  return `<div class="eyebrow">PORTFOLIO CARE</div><h1>投后陪伴</h1><p class="sub">跟踪产品和组合变化，决定要不要联系客户。</p>${s.plan?`<div class="callout session-flag">关联方案：${esc(goalText())} · 现金 ${s.plan.cash}% / 固收 ${s.plan.bond}% / 权益 ${s.plan.equity}%</div>`:`<div class="callout warn">尚未关联配置方案</div>`}<div class="card"><div class="card-head"><div><h2>本周组合复盘</h2><p class="muted">至 ${esc(s.asOf||'—')}</p></div>${statusBadge(s.careSubmitted?'已提交':'待确认',s.careSubmitted?'green':'orange')}</div>${reviewBody}${btn('查看复盘详情','m-review-detail','primary full')}</div><div class="card"><div class="card-head"><h2>重要事件</h2>${statusBadge(s.remindCreated?'1 条待办已建':'空态',s.remindCreated?'orange':'blue')}</div><div class="task-line"><span class="task-dot">${icon('clock')}</span><div class="task-text"><b>稳盈固收开放日</b><p>${s.remindCreated?'已创建开放日提醒':'尚未创建提醒'}</p></div>${btn('提醒','m-remind','small')}</div></div><div class="card"><div class="card-head"><h2>服务建议</h2>${s.careSubmitted?statusBadge('已提交','green'):''}</div><label class="check"><input type="checkbox" checked/>发送一条波动解释给客户</label>${s.careSubmitted?`<div class="callout good">已提交给客户经理确认（WAITING_FOR_MANAGER）。客户经理决定是否触达客户。</div>`:btn('提交给客户经理确认','m-submit-care','primary full')}</div>`;
}
function mobilePage(r){const x={
 'm/assistant':['AI 助手',mobileAssistant], 'm/fund':['基金诊断',mobileFund], 'm/insurance':['保险保障',mobileInsurance], 'm/wealth':['理财产品',mobileWealth], 'm/deposit':['存款测算',mobileDeposit], 'm/private':['私行产品',mobilePrivate], 'm/allocation':['资产配置',mobileAllocation], 'm/holdings':['持仓诊断',mobileHoldings], 'm/candidates':['候选推荐',mobileCandidates], 'm/compare':['产品比较',mobileCompare], 'm/companion':['投后陪伴',mobileCompanion], 'm/result':['执行结果',mobileResult]
 }[r]||['AI 助手',mobileAssistant]; return mobileStage(r,x[0],x[1]()); }

// Tab / segment switching is UI-only state (viewFilter), shared by every page
// including 手机 tags and PC tabs.
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
    patch({promptError:'共享应用服务未连接，无法执行 AI 生成调用。'});
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
      requestId,
      ...(context.landingExtra||{}),
      aiResult:{text:result.text,citations:result.citations||[],evidence:result.evidence,execution_mode:result.execution_mode||'real',model:result.model,latency_ms:result.latency_ms}
    });
  }catch(error){
    if(!isCurrent()||error?.code==='STALE_REQUEST') return;
    patch({aiStatus:'FAILED', promptError:error?.message||'AI 生成失败'});
    // 拒答原因只随 landing 一起写入（landing 是 PATCH 白名单字段）：跳转到结果页后，
    // 研究页仍能读到本次失败的真实原因，而不是只能看到通用 ai-error。
    // 不新增会话状态 key——冻结的 36 key 契约不变。
    openLanding('ai-error',{query:input.question||input.prompt||input.topic||'',researchRefusal:researchRefusal(error)});
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
window.addEventListener('wealth-data-ready',()=>{
  // Server products (carrying the authoritative annual_rate) arrive here, so a
  // calculation attempted before that handshake is retried from scratch.
  ['deposit','portfolio'].forEach(kind=>{ const store=CALC_STORES[kind]; if(store.status!=='pending'){ store.status='idle'; store.promise=null; store.key=''; } });
  render();
});
window.addEventListener('wealth-session-sync-error',(event)=>{
  // A failed initial read (session, shared data or /api/health) is deliberately
  // NOT routed to a landing page: a result screen would hide the source page's
  // own real-state failure block, and P-01 requires that block to show the real
  // server error in place. Only write-path and reload errors open sync-error.
  if(event.detail?.kind==='initialization') return;
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
