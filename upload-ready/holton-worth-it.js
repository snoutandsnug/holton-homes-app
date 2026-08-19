(() => {
  "use strict";

  const VERSION = "2.0.0";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
  const money = (v) => Number(v || 0).toLocaleString("en-US", { style:"currency", currency:"USD", maximumFractionDigits:0 });
  const E = () => window.HoltonStudioEngine;
  const UI = () => window.HoltonStudioUI;
  const view = () => $("#view");
  const parts = () => (location.hash || "#/today").replace(/^#\//, "").split("?")[0].split("/").filter(Boolean);
  const root = () => parts()[0] || "today";
  const sub = () => parts()[1] || "home";
  const query = () => new URLSearchParams((location.hash.split("?")[1] || ""));
  const contactIdFromRoute = () => root() === "contact" ? decodeURIComponent(parts()[1] || "") : "";
  const localDate = (v) => { if (!v) return "—"; const d = new Date(v); return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleDateString(); };

  let observer;
  let scheduled = false;

  function crm(){ return E()?.readCRM?.() || {}; }
  function studio(){ return E()?.readStudio?.() || {}; }
  function contacts(){ return crm().contacts || []; }
  function activeContacts(){ return contacts().filter(c => !["Closed","Lost"].includes(c.stage)); }
  function contactById(id){ return E()?.contactById?.(crm(), id) || null; }
  function propertiesFor(id){ return (crm().properties || []).filter(p => String(p.contactId) === String(id)); }
  function primaryProperty(id){ return propertiesFor(id).find(p => p.primary) || propertiesFor(id)[0] || null; }
  function fmtAddress(p){ return E()?.propertyAddress?.(p) || ""; }
  function fullName(c){ return E()?.fullName?.(c) || "Contact"; }

  function runTool(toolId, contactId = "", preset = {}){
    if (UI()?.openTool) return UI().openTool(toolId, { contactId, preset });
    location.hash = `#/studio?tool=${encodeURIComponent(toolId)}`;
  }

  function ensureOverlay(){
    if ($("#hhWiOverlay")) return;
    document.body.insertAdjacentHTML("beforeend", `<div class="wi-overlay" id="hhWiOverlay"><section class="wi-drawer"><header><div><span>HOLTON HOMES</span><h2 id="hhWiTitle">Copilot</h2></div><button type="button" data-wi-close>×</button></header><div class="wi-drawer-body" id="hhWiBody"></div></section></div>`);
    $("#hhWiOverlay").addEventListener("click", e => { if (e.target.id === "hhWiOverlay" || e.target.closest("[data-wi-close]")) closeOverlay(); });
  }
  function openOverlay(title, html){ ensureOverlay(); $("#hhWiTitle").textContent = title; $("#hhWiBody").innerHTML = html; $("#hhWiOverlay").classList.add("open"); }
  function closeOverlay(){ $("#hhWiOverlay")?.classList.remove("open"); }

  function topQueue(limit = 6){ return E()?.dailyQueue?.(limit) || []; }
  function health(){ return E()?.pipelineHealth?.() || { total:0, overdue:0, missingFollowUp:0, hot:0 }; }

  function enhanceToday(){
    if (root() !== "today") return;
    const v = view(); if (!v || $("#hhWorthCommand", v)) return;
    const h = health(); const q = topQueue(6); const first = q[0];
    const mainMessage = h.overdue ? `${h.overdue} promise${h.overdue===1?"":"s"} overdue. Fix those before chasing new work.` : q.length ? `${q.length} relationship${q.length===1?"":"s"} worth working now.` : "Your database is quiet. Add people and next steps so Holton can coach the day.";
    const panel = document.createElement("section"); panel.id = "hhWorthCommand"; panel.className = "wi-command";
    panel.innerHTML = `<div class="wi-command-top"><div><span class="wi-eyebrow">HOLTON COMMAND CENTER</span><h1>${esc(mainMessage)}</h1><p>Deterministic CRM signals first. AI only when writing or deeper reasoning helps.</p></div><div class="wi-command-actions">${first ? `<button class="wi-primary" data-wi-open-contact="${esc(first.contact.id)}">Start with ${esc(first.contact.firstName || "#1")}</button>` : ""}<button class="wi-secondary" data-wi-work-session>Open work session</button></div></div>
      <div class="wi-kpis"><article><span>Active</span><strong>${h.total}</strong></article><article class="${h.overdue?"danger":""}"><span>Overdue</span><strong>${h.overdue}</strong></article><article><span>No next date</span><strong>${h.missingFollowUp}</strong></article><article><span>Hot</span><strong>${h.hot}</strong></article></div>
      <div class="wi-command-grid"><div class="wi-command-list"><div class="wi-section-head"><div><span>PRIORITY QUEUE</span><h3>Who deserves attention</h3></div><small>${q.length ? "Score explains why" : "No active priorities"}</small></div>${q.length ? q.map((x,i)=>priorityRow(x,i)).join("") : `<div class="wi-empty">Add leads, follow-up dates and activity. This fills itself without AI.</div>`}</div>
      <aside class="wi-command-next"><span>THE OPERATING RULE</span><h3>Never wonder what to do next.</h3><p>Every live relationship should have a reason, an owner, and a next date. AI helps you prepare the conversation—not replace it.</p><div class="wi-mini-links"><a href="#/studio/seller-desk">Seller Desk →</a><a href="#/studio/cma">CMA Workbench →</a><a href="#/content">Content Factory →</a></div></aside></div>`;
    v.insertAdjacentElement("afterbegin", panel);
    bindWorthIt(panel);
  }

  function priorityRow(x, i){
    const c=x.contact, next=x.next || {};
    return `<article class="wi-priority"><b>${i+1}</b><div><strong>${esc(fullName(c))}</strong><span>${esc(c.type||"Contact")} · ${esc(c.stage||"No stage")} · ${esc(c.heat||"No heat")}</span><small>${esc(next.action||"Review relationship")} — ${esc(next.reason||x.reasons?.[0]||"CRM signal")}</small></div><em>${x.score}</em><div class="wi-row-actions"><button data-wi-open-contact="${esc(c.id)}">Open</button><button data-wi-quick-ai="lead-brief" data-contact-id="${esc(c.id)}">Brief</button></div></article>`;
  }

  function openWorkSession(){
    const q=topQueue(10);
    openOverlay("Today's Work Session", `<div class="wi-work-session"><div class="wi-drawer-intro"><span>BUSINESS FIRST</span><h3>Work the people most likely to matter.</h3><p>Open the relationship, make the contact, log what happened, and set the next date in the CRM.</p></div>${q.length?q.map((x,i)=>`<article><div class="wi-work-rank">${i+1}</div><div><strong>${esc(fullName(x.contact))}</strong><span>${esc(x.next?.action||"Review")}</span><small>${esc(x.next?.reason||"")}</small></div><button data-wi-open-contact="${esc(x.contact.id)}">Open</button><button data-wi-quick-ai="call-prep" data-contact-id="${esc(x.contact.id)}">Prep</button></article>`).join(""):`<div class="wi-empty">No queue yet.</div>`}</div>`);
    bindWorthIt($("#hhWiBody"));
  }

  function enhanceContact(){
    if (root() !== "contact") return;
    const id=contactIdFromRoute(), c=contactById(id), v=view(); if (!c || !v) return;
    const existing=$("#holtonContactAiStrip",v);
    if (!existing || existing.dataset.wiUpgraded) return;
    existing.dataset.wiUpgraded="1";
    const score=E().relationshipScore(crm(),c), next=E().nextBestAction(crm(),c), p=primaryProperty(id), reasons=(score.reasons||[]).slice(0,3);
    existing.className="wi-contact-copilot";
    existing.innerHTML=`<div class="wi-copilot-score"><span>HOLTON INTELLIGENCE</span><strong>${score.score}</strong><small>${score.score>=70?"Work now":score.score>=45?"Stay close":"Nurture"}</small></div><div class="wi-copilot-core"><span>NEXT BEST MOVE</span><h3>${esc(next.action||"Review relationship")}</h3><p>${esc(next.reason||"Use the CRM facts to decide the next human action.")}</p><small>${esc(reasons.join(" · ")||"Add more activity and a next date to improve the signal.")}</small>${p?`<a class="wi-property-chip" href="#/studio/seller-desk?contact=${encodeURIComponent(id)}">⌂ ${esc(fmtAddress(p)||"Property workspace")}</a>`:""}</div><div class="wi-copilot-actions"><button class="wi-primary" data-wi-copilot="${esc(id)}">Open Copilot</button><button data-wi-quick-ai="call-prep" data-contact-id="${esc(id)}">Call Prep</button><button data-wi-quick-ai="follow-up-writer" data-contact-id="${esc(id)}">Write Follow-Up</button>${c.type==="Seller"?`<a href="#/studio/seller-desk?contact=${encodeURIComponent(id)}">Seller Desk</a><button data-wi-cma="${esc(id)}">CMA</button>`:c.type==="Buyer"?`<button data-wi-quick-ai="buyer-consult" data-contact-id="${esc(id)}">Buyer Prep</button>`:""}</div>`;
    bindWorthIt(existing);
  }

  function openContactCopilot(id){
    const c=contactById(id); if(!c)return;
    const ctx=E().buildContactContext(id), score=E().relationshipScore(crm(),c), next=E().nextBestAction(crm(),c);
    openOverlay(`${fullName(c)} · Copilot`, `<div class="wi-copilot-drawer"><div class="wi-copilot-summary"><div><span>INTELLIGENCE ${score.score}</span><h3>${esc(next.action||"Review relationship")}</h3><p>${esc(next.reason||"")}</p></div><button data-wi-privacy="${esc(id)}">What AI sees</button></div><div class="wi-copilot-buttons"><button data-wi-generate="lead-brief" data-contact-id="${esc(id)}">AI Brief<span>Recap + next move</span></button><button data-wi-generate="call-prep" data-contact-id="${esc(id)}">Call Prep<span>Questions + goal</span></button><button data-wi-generate="follow-up-writer" data-contact-id="${esc(id)}">Follow-Up<span>Natural text/email</span></button>${c.type==="Seller"?`<button data-wi-generate="listing-appointment" data-contact-id="${esc(id)}">Listing Prep<span>Meeting strategy</span></button>`:""}</div><section class="wi-result" id="wiCopilotResult"><div class="wi-empty">Choose what you need. Nothing sends automatically.</div></section></div>`);
    $("[data-wi-privacy]",$("#hhWiBody"))?.addEventListener("click",()=>{ $("#wiCopilotResult").innerHTML=`<div class="wi-result-head"><strong>Sanitized local-AI packet</strong></div><pre>${esc(JSON.stringify(ctx,null,2))}</pre>`; });
    $$('[data-wi-generate]',$("#hhWiBody")).forEach(btn=>btn.addEventListener("click",()=>quickGenerate(btn.dataset.wiGenerate,id,btn)));
  }

  async function quickGenerate(toolId,id,button){
    const result=$("#wiCopilotResult"); if(!result)return runTool(toolId,id);
    const original=button?.innerHTML; if(button){button.disabled=true;button.innerHTML="Working…";}
    result.innerHTML=`<div class="wi-loading">Local AI is working…</div>`;
    try{
      const out=await E().generate(toolId,{contactId:id,form:{}});
      result.innerHTML=`<div class="wi-result-head"><strong>Draft · review before use</strong><button data-wi-copy-result>Copy</button></div><pre>${esc(out.text)}</pre>`;
      $("[data-wi-copy-result]",result)?.addEventListener("click",async()=>navigator.clipboard.writeText(out.text));
    }catch(err){
      result.innerHTML=`<div class="wi-error"><strong>Local AI is offline.</strong><p>${esc(err.message)}</p><button data-wi-open-studio-tool="${esc(toolId)}" data-contact-id="${esc(id)}">Open full tool</button></div>`;
      bindWorthIt(result);
    }finally{if(button){button.disabled=false;button.innerHTML=original;}}
  }

  function enhanceContent(){
    if(root()!=="content")return;
    const v=view(); if(!v)return;
    const old=$("#holtonProducerDock",v); if(old && !old.dataset.wiUpgraded){ old.dataset.wiUpgraded="1"; old.className="wi-content-factory"; old.innerHTML=contentFactoryHtml(); bindContentFactory(old); return; }
    if(!old && !$("#hhWorthContent",v)){ const s=document.createElement("section");s.id="hhWorthContent";s.className="wi-content-factory";s.innerHTML=contentFactoryHtml();v.insertAdjacentElement("afterbegin",s);bindContentFactory(s); }
  }

  function contentFactoryHtml(){
    const recent=(studio().assets||[]).filter(a=>{const t=E().toolById(a.toolId);return t?.category==="Content";}).slice(0,3);
    return `<div class="wi-content-head"><div><span class="wi-eyebrow">HOLTON CONTENT FACTORY</span><h2>One useful idea → an entire trust campaign.</h2><p>Start with something worth knowing. Build video, blog and social around the same factual source instead of creating random posts.</p></div><div class="wi-content-chain"><span>Source</span><b>→</b><span>Video</span><b>→</b><span>Blog</span><b>→</b><span>Social</span><b>→</b><span>Conversation</span></div></div><div class="wi-content-builder"><label><span>Topic / story</span><input id="wiContentTopic" placeholder="What changed around Cincinnati or what should a homeowner understand?"></label><label><span>Verified facts / source notes</span><textarea id="wiContentFacts" placeholder="Paste the facts, data points or your research notes. Studio must not invent missing facts."></textarea></label><div class="wi-content-buttons"><button class="wi-primary" data-wi-content="local-story-campaign">Build campaign pack</button><button data-wi-content="video-producer">Deep video</button><button data-wi-content="blog-producer">Write blog</button><button data-wi-content="social-campaign">Social pack</button></div></div><aside><span>RECENT OUTPUT</span>${recent.length?recent.map(a=>`<article><strong>${esc(a.title||"Content draft")}</strong><small>${localDate(a.createdAt)}</small></article>`).join(""):`<p>No content drafts yet.</p>`}<a href="#/studio/library">Open Studio Library →</a></aside>`;
  }
  function bindContentFactory(rootEl){
    $$('[data-wi-content]',rootEl).forEach(btn=>btn.addEventListener("click",()=>{
      const topic=$("#wiContentTopic",rootEl)?.value.trim()||""; const facts=$("#wiContentFacts",rootEl)?.value.trim()||"";
      if(!topic){$("#wiContentTopic",rootEl)?.focus();return;}
      const id=btn.dataset.wiContent;
      const preset = id==="video-producer" ? { topic, facts } : id==="blog-producer" ? { topic, facts } : id==="social-campaign" ? { topic, facts } : { story:[topic, facts ? `Verified facts / source notes:\n${facts}` : ""].filter(Boolean).join("\n\n") };
      runTool(id,"",preset);
    }));
  }

  function enhanceStudio(){
    if(root()!=="studio")return;
    const v=view();if(!v||!$(".hh-studio-page",v))return;
    if(sub()==="seller-desk") return renderSellerDesk();
    if(sub()==="home" || parts().length===1) return renderWorthStudioHome();
  }

  function renderWorthStudioHome(){
    const body=$(".hh-studio-body",view()); if(!body || body.dataset.wiHome)return; body.dataset.wiHome="1";
    const h=health(),q=topQueue(3),s=studio();
    body.innerHTML=`<section class="wi-studio-home"><div class="wi-studio-intro"><span class="wi-eyebrow">THE PART WORTH BUILDING</span><h2>Five workspaces. Complete jobs.</h2><p>Toolbox features still exist, but the primary experience is organized around the jobs that create and serve business.</p></div><div class="wi-workspace-grid"><a href="#/today"><span>01</span><strong>Command Center</strong><p>Who needs attention, overdue promises, missing next steps and the day's work queue.</p><em>${h.overdue?`${h.overdue} overdue`:"Queue clean"} →</em></a><a href="#/people"><span>02</span><strong>Relationship Copilot</strong><p>Open a person and get context-aware brief, call prep and follow-up without rewriting their history.</p><em>${q[0]?`${esc(fullName(q[0].contact))} is #1 today`:"Build your database"} →</em></a><a href="#/studio/seller-desk"><span>03</span><strong>Seller Desk</strong><p>Seller readiness, property, CMA, net sheet, listing prep, launch and compliance gates in one place.</p><em>Open seller workspace →</em></a><a href="#/studio/cma"><span>04</span><strong>CMA Workbench</strong><p>Evidence-first comps and local math. AI explains the result; it does not invent the price.</p><em>Build CMA →</em></a><a href="#/content"><span>05</span><strong>Content Factory</strong><p>Turn local knowledge into video, blog, social and measurable conversations.</p><em>Produce content →</em></a></div><section class="wi-toolbox"><div><span>POWER TOOLS</span><h3>Use the toolbox when the workflow needs something specific.</h3></div><nav><a href="#/studio/relationships">Relationship tools</a><a href="#/studio/sellers">Seller tools</a><a href="#/studio/buyers">Buyer tools</a><a href="#/studio/compliance">Compliance</a><a href="#/studio/library">Library</a><a href="#/studio/settings">AI + privacy</a></nav><small>${s.profile?.licenseMode==="prelicense"?"Pre-license mode is ON. Regulated workflows remain training/research drafts.":"Licensed mode configured—brokerage and current rules still govern client-facing use."}</small></section></section>`;
  }

  function sellerContacts(){ return activeContacts().filter(c=>c.type==="Seller"); }
  function sellerReadiness(c,p){
    const items=[
      ["Contact method",Boolean(c.phone||c.email)],
      ["Seller motivation",Boolean(p?.motivation||c.sellerDetails?.motivation)],
      ["Timeframe",Boolean(c.timeframe&&c.timeframe!=="Unknown")],
      ["Next follow-up",Boolean(c.followUp)],
      ["Property address",Boolean(p?.street&&p?.city)],
      ["Property facts",Boolean(p?.sqft||p?.beds||p?.yearBuilt)],
      ["Condition notes",Boolean(p?.condition||c.sellerDetails?.condition)],
      ["Decision makers",Boolean(c.sellerDetails?.decisionMakers||(c.household||[]).some(x=>x.decisionMaker))]
    ];
    return { items, score:Math.round(items.filter(x=>x[1]).length/items.length*100) };
  }

  function renderSellerDesk(){
    const body=$(".hh-studio-body",view()); if(!body)return;
    const sellers=sellerContacts(); const id=query().get("contact")||sellers[0]?.id||""; const c=contactById(id),p=c?primaryProperty(id):null;
    if(!c){ body.innerHTML=`<section class="wi-seller-empty"><span class="wi-eyebrow">SELLER DESK</span><h2>No active seller selected.</h2><p>Add a seller relationship in People first. Seller Desk is intentionally CRM-driven.</p><a class="wi-primary link" href="#/people">Open People</a></section>`;return; }
    const r=sellerReadiness(c,p), score=E().relationshipScore(crm(),c), next=E().nextBestAction(crm(),c);
    body.innerHTML=`<section class="wi-seller-desk"><header><div><span class="wi-eyebrow">SELLER COMMAND DESK</span><h2>${esc(fullName(c))}</h2><p>${esc(fmtAddress(p)||c.property||"No property address yet")}</p></div><label><span>Seller</span><select id="wiSellerSelect">${sellers.map(x=>`<option value="${esc(x.id)}" ${String(x.id)===String(id)?"selected":""}>${esc(fullName(x))} · ${esc(x.stage||"New")}</option>`).join("")}</select></label></header><div class="wi-seller-grid"><section class="wi-seller-main"><article class="wi-seller-hero"><div><span>READINESS</span><strong>${r.score}%</strong><small>${r.score>=75?"Enough context to prepare intelligently.":"Fill the missing facts before trusting automation."}</small></div><div><span>NEXT MOVE</span><h3>${esc(next.action||"Review")}</h3><p>${esc(next.reason||"")}</p><small>Relationship score ${score.score}</small></div></article><section class="wi-readiness"><div class="wi-section-head"><div><span>SELLER INTAKE</span><h3>What we know vs. what is missing</h3></div></div>${r.items.map(x=>`<div class="${x[1]?"done":"missing"}"><b>${x[1]?"✓":"!"}</b><span>${esc(x[0])}</span></div>`).join("")}</section><section class="wi-seller-actions"><div class="wi-section-head"><div><span>WIN / SERVE THE LISTING</span><h3>One-click seller workflow</h3></div></div><div><button class="wi-primary" data-wi-open-studio-tool="listing-appointment" data-contact-id="${esc(id)}">Listing Appointment Prep</button><button data-wi-open-studio-tool="seller-lead-plan" data-contact-id="${esc(id)}">Seller Plan</button><button data-wi-open-studio-tool="listing-launch" data-contact-id="${esc(id)}">Listing Launch Pack</button><button data-wi-open-studio-tool="agency-gate" data-contact-id="${esc(id)}">Agency Gate</button><button data-wi-open-studio-tool="seller-update" data-contact-id="${esc(id)}">Seller Update</button></div></section></section><aside class="wi-seller-side"><section class="wi-property-card"><span>PROPERTY</span><h3>${esc(fmtAddress(p)||"Add property facts")}</h3><dl><div><dt>Type</dt><dd>${esc(p?.propertyType||"—")}</dd></div><div><dt>Sq ft</dt><dd>${p?.sqft?Number(p.sqft).toLocaleString():"—"}</dd></div><div><dt>Acres</dt><dd>${esc(p?.acres||"—")}</dd></div><div><dt>Year</dt><dd>${esc(p?.yearBuilt||"—")}</dd></div><div><dt>Condition</dt><dd>${esc(p?.condition||"—")}</dd></div></dl><button class="wi-primary" data-wi-cma="${esc(id)}">Start / Continue CMA</button></section>${netSheetHtml(p)}${sourceLinksHtml(p)}</aside></div></section>`;
    $("#wiSellerSelect",body)?.addEventListener("change",e=>location.hash=`#/studio/seller-desk?contact=${encodeURIComponent(e.target.value)}`);
    bindWorthIt(body); bindNetSheet(body);
  }

  function netSheetHtml(p){
    const proposed=Number(p?.expectedSalePrice||p?.listPrice||p?.estimatedValue||0)||"";
    return `<section class="wi-net-sheet"><span>LOCAL CALCULATOR · $0 AI</span><h3>Seller Net Estimate</h3><p>Private math in your browser. No values below are sent to AI.</p><div class="wi-net-grid"><label>Sale price<input id="wiNetPrice" type="number" value="${esc(proposed)}"></label><label>Mortgage payoff<input id="wiNetPayoff" type="number" placeholder="Optional"></label><label>Broker compensation %<input id="wiNetComp" type="number" step=".01" placeholder="Enter actual agreed/estimated rate"></label><label>Seller closing costs<input id="wiNetClosing" type="number" placeholder="$ amount"></label><label>Concessions / credits<input id="wiNetCredits" type="number" placeholder="$ amount"></label><label>Taxes / prorations / other<input id="wiNetOther" type="number" placeholder="$ amount"></label></div><button data-wi-net-calc>Calculate estimate</button><div class="wi-net-result" id="wiNetResult">Enter your assumptions. Compensation is not assumed or preset.</div><small>Planning estimate only. Verify settlement figures, taxes, title charges, brokerage compensation and payoff with the appropriate sources.</small></section>`;
  }
  function bindNetSheet(rootEl){
    $("[data-wi-net-calc]",rootEl)?.addEventListener("click",()=>{
      const price=Number($("#wiNetPrice",rootEl)?.value||0),payoff=Number($("#wiNetPayoff",rootEl)?.value||0),pct=Number($("#wiNetComp",rootEl)?.value||0),closing=Number($("#wiNetClosing",rootEl)?.value||0),credits=Number($("#wiNetCredits",rootEl)?.value||0),other=Number($("#wiNetOther",rootEl)?.value||0);
      const comp=price*(pct/100),net=price-payoff-comp-closing-credits-other;
      $("#wiNetResult",rootEl).innerHTML=`<span>Estimated seller proceeds</span><strong>${money(net)}</strong><small>Sale ${money(price)} − payoff ${money(payoff)} − broker comp ${money(comp)} − other seller costs ${money(closing+credits+other)}</small>`;
    });
  }
  function sourceLinksHtml(p){
    const county=String(p?.county||"").toLowerCase(); const sources=(E().SOURCE_CATALOG||[]).filter(s=>!county||String(s.county||"").toLowerCase()===county).slice(0,3);
    return `<section class="wi-research-links"><span>PROPERTY RESEARCH</span><h3>Open trusted source</h3>${sources.length?sources.map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener"><strong>${esc(s.label)}</strong><small>${esc(s.kind)}</small></a>`).join(""):`<p>Add county to the property record to narrow public-record sources.</p><a href="#/studio/cma">Open CMA sources →</a>`}</section>`;
  }

  function startCma(id){
    const c=contactById(id),p=primaryProperty(id); if(!c)return;
    let draft={subject:{},comps:[],result:null}; try{draft=JSON.parse(localStorage.getItem("holtonCmaDraft_v1")||"null")||draft;}catch{}
    draft.subject={...(draft.subject||{}),address:fmtAddress(p)||c.property||"",propertyType:p?.propertyType||"",sqft:Number(p?.sqft||0),acres:Number(p?.acres||0),beds:Number(p?.beds||0),baths:Number(p?.baths||0),yearBuilt:Number(p?.yearBuilt||0),contactId:id};
    localStorage.setItem("holtonCmaDraft_v1",JSON.stringify(draft)); location.hash="#/studio/cma";
  }

  function bindWorthIt(rootEl=document){
    $$('[data-wi-open-contact]',rootEl).forEach(btn=>{if(btn.dataset.wiBound)return;btn.dataset.wiBound="1";btn.addEventListener("click",()=>{closeOverlay();location.hash=`#/contact/${encodeURIComponent(btn.dataset.wiOpenContact)}`;});});
    $$('[data-wi-quick-ai]',rootEl).forEach(btn=>{if(btn.dataset.wiBound)return;btn.dataset.wiBound="1";btn.addEventListener("click",()=>openContactCopilot(btn.dataset.contactId));});
    $$('[data-wi-copilot]',rootEl).forEach(btn=>{if(btn.dataset.wiBound)return;btn.dataset.wiBound="1";btn.addEventListener("click",()=>openContactCopilot(btn.dataset.wiCopilot));});
    $$('[data-wi-cma]',rootEl).forEach(btn=>{if(btn.dataset.wiBound)return;btn.dataset.wiBound="1";btn.addEventListener("click",()=>startCma(btn.dataset.wiCma));});
    $$('[data-wi-open-studio-tool]',rootEl).forEach(btn=>{if(btn.dataset.wiBound)return;btn.dataset.wiBound="1";btn.addEventListener("click",()=>runTool(btn.dataset.wiOpenStudioTool,btn.dataset.contactId||""));});
    $("[data-wi-work-session]",rootEl)?.addEventListener("click",openWorkSession);
  }

  function apply(){
    if(!E()||!view())return;
    enhanceToday(); enhanceContact(); enhanceContent(); enhanceStudio(); bindWorthIt(view());
  }
  function schedule(){ if(scheduled)return;scheduled=true;setTimeout(()=>{scheduled=false;apply();},70); }
  function observe(){
    if(observer||!view())return;
    observer=new MutationObserver(schedule); observer.observe(view(),{childList:true,subtree:false});
  }

  window.HoltonWorthIt={VERSION,sellerReadiness,startCma};
  window.addEventListener("hashchange",schedule);
  window.addEventListener("load",()=>{ensureOverlay();observe();schedule();});
  document.addEventListener("DOMContentLoaded",()=>{ensureOverlay();observe();schedule();});
})();
