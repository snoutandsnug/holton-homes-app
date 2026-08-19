(() => {
  "use strict";
  const E = () => window.HoltonStudioEngine;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
  const money = (v) => Number(v || 0).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  const fmtDate = (v) => { if (!v) return "—"; const d = new Date(v); return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString(); };
  const routeParts = () => (location.hash || "#/today").replace(/^#\//, "").split("?")[0].split("/").filter(Boolean);
  const query = () => new URLSearchParams((location.hash.split("?")[1] || ""));
  const rootRoute = () => routeParts()[0] || "today";
  const subRoute = () => routeParts()[1] || "home";
  const currentContactId = () => routeParts()[0] === "contact" ? decodeURIComponent(routeParts()[1] || "") : "";
  const view = () => $("#view");

  let studioRenderQueued = false;
  let activeToolId = "";
  let toolPreset = {};
  let cmaDraft = loadCmaDraft();

  function loadCmaDraft() {
    try { return JSON.parse(localStorage.getItem("holtonCmaDraft_v1") || "null") || { subject: {}, comps: [], result: null }; }
    catch { return { subject: {}, comps: [], result: null }; }
  }
  function saveCmaDraft() { localStorage.setItem("holtonCmaDraft_v1", JSON.stringify(cmaDraft)); }

  function ensureNav() {
    const nav = $("#primaryNav");
    if (!nav || $("[data-route='studio']", nav)) return;
    const more = nav.querySelector("a[data-route='more']");
    const link = document.createElement("a");
    link.href = "#/studio";
    link.dataset.route = "studio";
    link.className = "hh-studio-nav";
    link.innerHTML = `<span class="nav-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v16H5zM8 8h8M8 12h5M8 16h8"/><path d="m17 11 1 1 2-2"/></svg></span><span>Studio</span>`;
    if (more) nav.insertBefore(link, more); else nav.appendChild(link);
  }

  function studioShell(body, active = "home") {
    const state = E().readStudio();
    const aiLabel = state.ai.model ? state.ai.model : "Choose model";
    return `<div class="hh-studio-page">
      <section class="hh-studio-hero">
        <div><span class="hh-kicker">HOLTON HOMES OS</span><h1>Studio</h1><p>Relationship intelligence, CMA, content production and compliance—inside the CRM.</p></div>
        <div class="hh-hero-status"><span class="${state.profile.licenseMode === "prelicense" ? "warn" : "ok"}">${state.profile.licenseMode === "prelicense" ? "Training / pre-license" : esc(state.profile.licenseMode)}</span><span>AI: ${esc(aiLabel)}</span></div>
      </section>
      <nav class="hh-studio-tabs">
        ${navTab("home", "Overview", active)}
        ${navTab("relationships", "Relationships", active)}
        ${navTab("sellers", "Sellers", active)}
        ${navTab("buyers", "Buyers", active)}
        ${navTab("cma", "CMA", active)}
        ${navTab("content", "Content", active)}
        ${navTab("compliance", "Compliance", active)}
        ${navTab("library", "Library", active)}
        ${navTab("settings", "Settings", active)}
      </nav>
      <div class="hh-studio-body">${body}</div>
    </div>`;
  }
  function navTab(id, label, active) { return `<a href="#/studio/${id}" class="${id === active ? "active" : ""}">${label}</a>`; }

  function renderStudio() {
    const v = view(); if (!v) return;
    const active = subRoute();
    if (active === "cma") v.innerHTML = studioShell(renderCma(), "cma");
    else if (active === "settings") v.innerHTML = studioShell(renderSettings(), "settings");
    else if (active === "compliance") v.innerHTML = studioShell(renderCompliance(), "compliance");
    else if (active === "library") v.innerHTML = studioShell(renderLibrary(), "library");
    else if (["relationships", "sellers", "buyers", "content"].includes(active)) v.innerHTML = studioShell(renderTools(active), active);
    else v.innerHTML = studioShell(renderOverview(), "home");
    bindStudio();
    const requested = query().get("tool");
    if (requested && E().toolById(requested)) setTimeout(() => openTool(requested), 10);
  }

  function renderOverview() {
    const health = E().pipelineHealth();
    const queue = E().dailyQueue(6);
    const studio = E().readStudio();
    const recent = studio.assets.slice(0, 4);
    return `<section class="hh-kpi-grid">
      ${kpi("Active opportunities", health.total, "Buyer + seller relationships")}
      ${kpi("Overdue follow-ups", health.overdue, health.overdue ? "Fix promises first" : "Clean")}
      ${kpi("Missing next step", health.missingFollowUp, "Active leads without a date")}
      ${kpi("Hot relationships", health.hot, "Highest intent in CRM")}
    </section>
    <div class="hh-two-col">
      <section class="hh-panel"><div class="hh-panel-head"><div><span class="hh-kicker">WORK THE DATABASE</span><h2>Who needs you now</h2></div><button class="hh-btn ghost" data-hh-tool="daily-business">Build my day with AI</button></div>
        <div class="hh-priority-list">${queue.length ? queue.map((x, i) => `<a href="#/contact/${encodeURIComponent(x.contact.id)}" class="hh-priority-row"><b>${i + 1}</b><div><strong>${esc(E().fullName(x.contact))}</strong><span>${esc(x.contact.type || "Contact")} · ${esc(x.contact.stage || "")}</span><small>${esc(x.next.action)} — ${esc(x.next.reason)}</small></div><em>${x.score}</em></a>`).join("") : `<div class="hh-empty">Add relationships to the CRM and Studio will prioritize them here.</div>`}</div>
      </section>
      <section class="hh-panel"><div class="hh-panel-head"><div><span class="hh-kicker">ONE WORKSPACE</span><h2>Producer shortcuts</h2></div></div>
        <div class="hh-shortcuts">
          ${shortcut("video-producer", "Video Producer", "Idea → hook → script → shots → clips")}
          ${shortcut("blog-producer", "Blog Producer", "Sources → article → SEO → derivatives")}
          <a href="#/studio/cma"><strong>CMA Producer</strong><span>Subject → comps → score → range → explanation</span></a>
          ${shortcut("local-story-campaign", "Local Story Campaign", "One local story → entire content system")}
        </div>
      </section>
    </div>
    <section class="hh-panel"><div class="hh-panel-head"><div><span class="hh-kicker">RECENT WORK</span><h2>Studio library</h2></div><a href="#/studio/library">See all</a></div>
      ${recent.length ? `<div class="hh-library-grid">${recent.map(assetCard).join("")}</div>` : `<div class="hh-empty">Nothing generated yet. Your saved Studio drafts will appear here.</div>`}
    </section>
    <section class="hh-panel"><div class="hh-panel-head"><div><span class="hh-kicker">SALES MANAGER</span><h2>Business coach</h2><p>Use AI after the deterministic CRM signals have already identified the work.</p></div></div>
      <div class="hh-tool-grid compact">${E().TOOL_CATALOG.filter(t => t.category === "Business").map(toolCard).join("")}</div>
    </section>`;
  }
  function kpi(label, value, sub) { return `<article class="hh-kpi"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(sub)}</small></article>`; }
  function shortcut(tool, label, sub) { return `<button data-hh-tool="${tool}"><strong>${label}</strong><span>${sub}</span></button>`; }

  const SECTION_MAP = { relationships: "Relationships", sellers: "Sellers", buyers: "Buyers", content: "Content" };
  function renderTools(section) {
    const category = SECTION_MAP[section];
    const tools = E().TOOL_CATALOG.filter(t => t.category === category);
    let intro = "";
    if (section === "content") intro = `<section class="hh-producer-banner"><div><span class="hh-kicker">CONTENT ENGINE</span><h2>One idea. Multiple assets. One business purpose.</h2><p>Every producer is grounded in the facts you supply. Local content can build trust without turning every post into a real-estate ad.</p></div><div class="hh-producer-flow"><span>Research</span><b>→</b><span>Produce</span><b>→</b><span>Repurpose</span><b>→</b><span>Track leads</span></div></section>`;
    return `${intro}<section class="hh-tool-grid">${tools.map(toolCard).join("")}</section>`;
  }
  function toolCard(t) {
    return `<button class="hh-tool-card" data-hh-tool="${t.id}"><span class="hh-tool-icon">${esc(t.icon || "✦")}</span><div><strong>${esc(t.label)}</strong><p>${esc(t.description)}</p></div><em>Open →</em></button>`;
  }

  function renderCompliance() {
    const rules = E().OFFICIAL_RULES;
    return `<div class="hh-two-col compliance">
      <section class="hh-panel"><div class="hh-panel-head"><div><span class="hh-kicker">DRAFT REVIEW</span><h2>Compliance scanners</h2></div></div>
        <div class="hh-tool-grid compact">${E().TOOL_CATALOG.filter(t => t.category === "Compliance").map(toolCard).join("")}</div>
      </section>
      <section class="hh-panel"><div class="hh-panel-head"><div><span class="hh-kicker">SOURCE-LOCKED</span><h2>Verified rule library</h2></div></div>
        <div class="hh-rules">${rules.map(r => `<article><div><strong>${esc(r.title)}</strong><span>${esc(r.source)} · verified ${esc(r.verified)}</span></div><p>${esc(r.summary)}</p><a href="${esc(r.url)}" target="_blank" rel="noopener">Official/reference source ↗</a></article>`).join("")}</div>
      </section>
    </div><section class="hh-callout warn"><strong>What this does not do</strong><p>Studio can flag risk and cite the rule area. It cannot certify that a communication, form or transaction is legally compliant. Brokerage policy, MLS rules, current forms and fact-specific legal questions still require the appropriate human review.</p></section>`;
  }

  function renderLibrary() {
    const state = E().readStudio();
    const assets = state.assets;
    return `<section class="hh-panel"><div class="hh-panel-head"><div><span class="hh-kicker">ASSET LIBRARY</span><h2>${assets.length} saved drafts</h2></div><button class="hh-btn ghost" data-hh-export>Export Studio backup</button></div>
      ${assets.length ? `<div class="hh-library-grid">${assets.map(assetCard).join("")}</div>` : `<div class="hh-empty">Generate a video, blog, seller draft, CMA narrative or relationship tool and it will appear here.</div>`}
    </section>`;
  }
  function assetCard(a) {
    const tool = E().toolById(a.toolId);
    return `<article class="hh-asset-card"><span>${esc(tool?.category || a.type || "Studio")}</span><strong>${esc(a.title || tool?.label || "Draft")}</strong><small>${fmtDate(a.createdAt)}</small><button data-hh-view-asset="${esc(a.id)}">Open</button></article>`;
  }

  function renderSettings() {
    const s = E().readStudio();
    return `<div class="hh-two-col settings">
      <section class="hh-panel"><div class="hh-panel-head"><div><span class="hh-kicker">AI ENGINE</span><h2>Local Ollama</h2></div><span id="hhAiStatus" class="hh-status">Not tested</span></div>
        <div class="hh-form-grid">
          <label class="wide"><span>Ollama endpoint</span><input id="hhAiEndpoint" value="${esc(s.ai.endpoint)}"></label>
          <label><span>Model</span><select id="hhAiModel"><option value="${esc(s.ai.model)}">${esc(s.ai.model || "Test connection first")}</option></select></label>
          <label><span>Unload after response</span><select id="hhAiKeepAlive"><option value="0" ${Number(s.ai.keepAlive) === 0 ? "selected" : ""}>Yes — free GPU/RAM</option><option value="300" ${Number(s.ai.keepAlive) !== 0 ? "selected" : ""}>Keep loaded ~5 min</option></select></label>
        </div>
        <div class="hh-actions"><button class="hh-btn primary" data-hh-test-ai>Test Ollama + find models</button><button class="hh-btn ghost" data-hh-save-settings>Save settings</button></div>
        <div class="hh-callout"><strong>Streaming-friendly</strong><p>Quit Ollama when streaming. The CRM and deterministic Studio tools still work; AI generation simply shows offline.</p></div>
      </section>
      <section class="hh-panel"><div class="hh-panel-head"><div><span class="hh-kicker">COMPLIANCE PROFILE</span><h2>Who the app thinks you are</h2></div></div>
        <div class="hh-form-grid">
          <label><span>License mode</span><select id="hhLicenseMode"><option value="prelicense" ${s.profile.licenseMode === "prelicense" ? "selected" : ""}>Pre-license / training</option><option value="salesperson" ${s.profile.licenseMode === "salesperson" ? "selected" : ""}>Ohio salesperson</option><option value="broker" ${s.profile.licenseMode === "broker" ? "selected" : ""}>Ohio broker</option></select></label>
          <label><span>License state</span><input id="hhLicenseState" value="${esc(s.profile.licenseState || "OH")}"></label>
          <label><span>Advertising name</span><input id="hhAdvertisingName" value="${esc(s.profile.advertisingName)}" placeholder="Name registered/approved for advertising"></label>
          <label><span>License number</span><input id="hhLicenseNumber" value="${esc(s.profile.licenseNumber)}"></label>
          <label class="wide"><span>Brokerage name</span><input id="hhBrokerageName" value="${esc(s.profile.brokerageName)}" placeholder="Leave blank until licensed/affiliated"></label>
          <label class="check"><input type="checkbox" id="hhBrokerageReviewed" ${s.profile.brokerageReviewed ? "checked" : ""}><span>Brokerage advertising profile/rules reviewed</span></label>
          <label class="check"><input type="checkbox" id="hhRealtorMember" ${s.profile.realtorMember ? "checked" : ""}><span>I am actually a REALTOR® member</span></label>
        </div>
        <button class="hh-btn primary" data-hh-save-profile>Save compliance profile</button>
        <div class="hh-callout warn"><strong>Do not flip this early</strong><p>Pre-license mode intentionally labels regulated tools as training/research drafts. Change it only when the real license/affiliation facts are true.</p></div>
      </section>
    </div>
    <section class="hh-panel hh-privacy-settings"><div class="hh-panel-head"><div><span class="hh-kicker">AI CONTEXT FIREWALL</span><h2>Client privacy controls</h2><p>Keep the local model useful without giving it the whole database.</p></div></div>
      <div class="hh-form-grid">
        <label class="check"><input type="checkbox" id="hhIncludeNames" ${s.preferences.includeNamesInLocalAi ? "checked" : ""}><span>Include contact names in local AI packets</span></label>
        <label class="check"><input type="checkbox" id="hhSaveAiDrafts" ${s.preferences.saveAiDrafts ? "checked" : ""}><span>Save generated drafts to this browser's Studio Library</span></label>
        <label><span>Recent communications sent to AI</span><select id="hhMaxComms">${[3,5,8].map(n => `<option value="${n}" ${Number(s.preferences.maxCommunicationItems)===n?"selected":""}>${n}</option>`).join("")}</select></label>
        <label><span>Open tasks sent to AI</span><select id="hhMaxTasks">${[3,5,8].map(n => `<option value="${n}" ${Number(s.preferences.maxTaskItems)===n?"selected":""}>${n}</option>`).join("")}</select></label>
      </div>
      <div class="hh-callout"><strong>Excluded by default</strong><p>Phone/email are not included in contact packets. Mortgage/loan balances and common SSN, bank/routing/account, wire, password/passcode/PIN, passport and driver-license values are removed/redacted. Every contact tool also has a “Privacy: see exactly what local AI will receive” preview.</p></div>
      <button class="hh-btn primary" data-hh-save-privacy>Save privacy settings</button>
    </section>`;
  }

  function renderCma() {
    const s = cmaDraft.subject || {};
    const result = cmaDraft.result;
    return `<section class="hh-cma-layout">
      <div class="hh-cma-main">
        <section class="hh-panel"><div class="hh-panel-head"><div><span class="hh-kicker">SUBJECT</span><h2>Property profile</h2></div><span class="hh-beta">Public-record beta</span></div>
          <div class="hh-form-grid cma-subject">
            ${input("hhCmaAddress", "Address", s.address, "text", true)}
            ${input("hhCmaType", "Property type", s.propertyType, "text")}
            ${input("hhCmaSqft", "Living area", s.sqft, "number")}
            ${input("hhCmaAcres", "Acres", s.acres, "number")}
            ${input("hhCmaBeds", "Beds", s.beds, "number")}
            ${input("hhCmaBaths", "Baths", s.baths, "number")}
            ${input("hhCmaYear", "Year built", s.yearBuilt, "number")}
          </div>
          <div class="hh-actions"><button class="hh-btn primary" data-hh-save-subject>Update subject</button><button class="hh-btn ghost" data-hh-add-comp>＋ Add comp</button><label class="hh-btn ghost file">Import CSV<input type="file" id="hhCompCsvInput" accept=".csv,text/csv"></label></div>
        </section>
        <section class="hh-panel"><div class="hh-panel-head"><div><span class="hh-kicker">COMPARABLES</span><h2>${cmaDraft.comps.length} candidate comps</h2></div><button class="hh-btn primary" data-hh-calc-cma>Calculate CMA</button></div>
          ${cmaDraft.comps.length ? `<div class="hh-comp-table"><div class="hh-comp-head"><span>Use</span><span>Property</span><span>Sale</span><span>Match</span><span>Adj.</span><span></span></div>${cmaDraft.comps.map((c, i) => compRow(c, i, s)).join("")}</div>` : `<div class="hh-empty">Add recent sales manually or import a CSV. The scoring/maths run locally and cost nothing.</div>`}
        </section>
        ${result ? renderCmaResult(result) : ""}
      </div>
      <aside class="hh-cma-side">
        <section class="hh-panel"><span class="hh-kicker">FREE DATA SOURCES</span><h3>Research comps</h3><p>Use county public records now. When your authorized MLS feed arrives, MLS becomes the primary adapter instead of rebuilding the CMA.</p><div class="hh-source-list">${E().SOURCE_CATALOG.map(src => `<a href="${esc(src.url)}" target="_blank" rel="noopener"><strong>${esc(src.label)}</strong><span>${esc(src.kind)}</span><small>${esc(src.notes)}</small></a>`).join("")}</div></section>
        <section class="hh-panel"><span class="hh-kicker">CMA HELPERS</span><h3>Review & explain</h3><div class="hh-tool-grid compact hh-cma-helper-grid">${E().TOOL_CATALOG.filter(t => t.category === "CMA" && t.id !== "cma-narrative").map(toolCard).join("")}</div></section>
        <section class="hh-callout warn"><strong>Portal policy</strong><p>Zillow/Redfin are useful manual cross-checks. This build intentionally does not scrape them automatically. Automated portal scraping is a brittle legal/terms-of-use foundation; public records + authorized MLS is the durable route.</p></section>
      </aside>
    </section>`;
  }
  function input(id, label, value, type = "text", wide = false) { return `<label class="${wide ? "wide" : ""}"><span>${label}</span><input id="${id}" type="${type}" step="any" value="${esc(value || "")}"></label>`; }
  function compRow(c, i, subject) {
    const score = E().compMatchScore(subject, c);
    return `<div class="hh-comp-row"><label><input type="checkbox" data-hh-comp-include="${i}" ${c.include !== false ? "checked" : ""}></label><div><strong>${esc(c.address || "Comp")}</strong><small>${esc(c.status || "Sold")} · ${fmtDate(c.saleDate)} · ${esc(c.source || "Manual")}</small></div><div><strong>${money(c.salePrice)}</strong><small>${c.sqft ? `${Number(c.sqft).toLocaleString()} sf` : ""}${c.distanceMiles ? ` · ${c.distanceMiles} mi` : ""}</small></div><div><strong>${score}%</strong><small>match</small></div><div><strong>${money(c.manualAdjustment || 0)}</strong><small>manual</small></div><button data-hh-edit-comp="${i}">Edit</button><button data-hh-delete-comp="${i}" class="danger">×</button></div>`;
  }
  function renderCmaResult(r) {
    const summary = cmaSummary(r);
    return `<section class="hh-panel hh-cma-result"><div class="hh-panel-head"><div><span class="hh-kicker">HOLTON CMA</span><h2>${money(r.rangeLow)} – ${money(r.rangeHigh)}</h2><p>Indicated center: <strong>${money(r.indicated)}</strong> · ${esc(r.confidence)} confidence (${r.confidenceScore}/100)</p></div><div class="hh-actions"><button class="hh-btn ghost" data-hh-save-cma>Save CMA</button><button class="hh-btn primary" data-hh-explain-cma>Explain with AI</button></div></div>
      <div class="hh-cma-metrics">${kpi("Usable sales", r.sampleSize, "core comp set")}${kpi("Median", money(r.median), "adjusted sale price")}${kpi("Weighted mean", money(r.weightedMean), "match/source weighted")}${kpi("Implied $/sf", r.subjectPpsf ? `$${r.subjectPpsf.toFixed(0)}` : "—", "subject implied")}</div>
      <div class="hh-cma-evidence"><h3>Closed-sale evidence ranking</h3>${r.rows.length ? r.rows.map(x => `<div><strong>${esc(x.address || "Comp")}</strong><span>${money(x.adjustedPrice)} adjusted</span><b>${x.matchScore}% match</b></div>`).join("") : `<div><strong>No closed sales in the current set</strong><span>Add sold/closed evidence before relying on a pricing range.</span><b>VERIFY</b></div>`}</div>
      ${r.contextRows?.length ? `<div class="hh-cma-evidence hh-market-context"><h3>Active / pending market context</h3><p>Shown for positioning context; not used in the indicated closed-sale center.</p>${r.contextRows.map(x => `<div><strong>${esc(x.address || "Listing")}</strong><span>${money(x.salePrice)} ${esc(String(x.status||"" ).toLowerCase())}</span><b>${x.matchScore}% match</b></div>`).join("")}</div>` : ""}
      <div class="hh-callout warn"><strong>CMA, not appraisal</strong><p>${esc(r.caveats.join(" "))}</p></div><textarea class="hh-hidden" id="hhCmaSummary">${esc(summary)}</textarea>
    </section>`;
  }
  function cmaSummary(r) {
    return `Subject: ${r.subject.address || "Not recorded"}\nRange: ${money(r.rangeLow)} to ${money(r.rangeHigh)}\nIndicated center: ${money(r.indicated)}\nConfidence: ${r.confidence} (${r.confidenceScore}/100)\nComps:\n${r.rows.map(x => `- ${x.address || "Comp"}: sold ${money(x.salePrice)}, adjustment ${money(x.manualAdjustment || 0)}, adjusted ${money(x.adjustedPrice)}, match ${x.matchScore}%, source ${x.source || "Manual"}`).join("\n")}\nCaveats: ${r.caveats.join(" ")}`;
  }

  function enhanceContent() {
    if (rootRoute() !== "content") return;
    const v = view(); if (!v || $("#holtonProducerDock", v)) return;
    const dock = document.createElement("section");
    dock.id = "holtonProducerDock";
    dock.className = "hh-content-dock";
    dock.innerHTML = `<div><span class="hh-kicker">HOLTON PRODUCER STUDIO</span><strong>Turn what you know into content that creates conversations.</strong></div><div><button data-hh-tool="video-producer">▶ Video</button><button data-hh-tool="blog-producer">▤ Blog</button><button data-hh-tool="local-story-campaign">⌖ Local story</button><button data-hh-tool="social-campaign"># Social</button><a href="#/studio/content">All tools →</a></div>`;
    v.insertAdjacentElement("afterbegin", dock);
    bindGlobalButtons(v);
  }

  function enhanceContact() {
    if (rootRoute() !== "contact") return;
    const id = currentContactId();
    const crm = E().readCRM();
    const c = E().contactById(crm, id);
    const v = view();
    if (!c || !v || $("#holtonContactAiStrip", v)) return;
    const score = E().relationshipScore(crm, c);
    const next = E().nextBestAction(crm, c);
    const strip = document.createElement("section");
    strip.id = "holtonContactAiStrip";
    strip.className = "hh-contact-intel";
    strip.innerHTML = `<div class="hh-contact-intel-score"><span>HOLTON INTELLIGENCE</span><b>${score.score}</b></div><div class="hh-contact-intel-main"><strong>${esc(next.action)}</strong><span>${esc(next.reason)}</span><small>${esc(score.reasons.join(" · "))}</small></div><div class="hh-contact-intel-actions"><button data-hh-tool="lead-brief" data-contact-id="${esc(id)}">AI Brief</button><button data-hh-tool="call-prep" data-contact-id="${esc(id)}">Call Prep</button><button data-hh-tool="follow-up-writer" data-contact-id="${esc(id)}">Write Follow-Up</button>${c.type === "Seller" ? `<button data-hh-tool="listing-appointment" data-contact-id="${esc(id)}">Seller Prep</button>` : c.type === "Buyer" ? `<button data-hh-tool="buyer-consult" data-contact-id="${esc(id)}">Buyer Prep</button>` : ""}</div>`;
    v.insertAdjacentElement("afterbegin", strip);
    bindGlobalButtons(v);
  }

  function enhanceMore() {
    if (rootRoute() !== "more") return;
    const v = view(); if (!v || $("#hhStudioMoreCard", v)) return;
    const target = v.querySelector(".mobile-tool-directory,.more-grid") || v.firstElementChild;
    if (!target) return;
    const card = document.createElement("a"); card.id = "hhStudioMoreCard"; card.href = "#/studio"; card.className = "hh-more-studio-card";
    card.innerHTML = `<span>✦</span><div><strong>Holton Studio</strong><small>CMA, AI, video, blog & compliance</small></div>`;
    target.insertAdjacentElement("afterbegin", card);
  }

  function queueEnhance() {
    if (studioRenderQueued) return;
    studioRenderQueued = true;
    setTimeout(() => {
      studioRenderQueued = false;
      ensureNav();
      if (rootRoute() === "studio") renderStudio(); else { enhanceContent(); enhanceContact(); enhanceMore(); }
    }, 35);
  }

  function ensureModal() {
    if ($("#hhStudioModal")) return;
    document.body.insertAdjacentHTML("beforeend", `<div class="hh-studio-modal-backdrop" id="hhStudioModal"><section class="hh-studio-modal"><header><div><span class="hh-kicker">HOLTON STUDIO</span><h2 id="hhStudioModalTitle">Tool</h2></div><button data-hh-close-modal>×</button></header><div id="hhStudioModalBody"></div></section></div>`);
    $("#hhStudioModal").addEventListener("click", (e) => { if (e.target.id === "hhStudioModal" || e.target.closest("[data-hh-close-modal]")) closeModal(); });
  }
  function openModal(title, html) { ensureModal(); $("#hhStudioModalTitle").textContent = title; $("#hhStudioModalBody").innerHTML = html; $("#hhStudioModal").classList.add("open"); }
  function closeModal() { $("#hhStudioModal")?.classList.remove("open"); }

  function openTool(id, opts = {}) {
    const tool = E().toolById(id); if (!tool) return;
    activeToolId = id; toolPreset = opts.preset || {};
    const crm = E().readCRM();
    const contacts = (crm.contacts || []).filter(c => !["Closed", "Lost"].includes(c.stage));
    const contactId = opts.contactId || currentContactId() || "";
    const warnings = E().profileWarnings(tool, E().readStudio().profile, {});
    openModal(tool.label, `<div class="hh-tool-runner"><div class="hh-tool-intro"><span>${esc(tool.category)}</span><p>${esc(tool.description)}</p></div>
      ${warnings.length ? `<div class="hh-preflight">${warnings.map(w => `<div class="${w.severity}"><strong>${w.severity === "block" ? "Training / review" : "Review"}</strong><span>${esc(w.text)}</span></div>`).join("")}</div>` : ""}
      <div class="hh-form-grid">
        ${tool.context ? `<label class="wide"><span>CRM relationship</span><select id="hhToolContact"><option value="">Choose a person</option>${contacts.map(c => `<option value="${esc(c.id)}" ${String(c.id) === String(contactId) ? "selected" : ""}>${esc(E().fullName(c))} — ${esc(c.type || "")}/${esc(c.stage || "")}</option>`).join("")}</select></label>` : ""}
        ${(tool.fields || []).map(f => fieldHtml(f, toolPreset[f.key])).join("")}
        <label class="wide"><span>Extra instructions (optional)</span><textarea id="hhToolExtra" placeholder="Anything else the producer should know. Do not put passwords, SSNs, banking or wire information here.">${esc(toolPreset.extra || "")}</textarea></label>
      </div>
      ${tool.context ? `<details class="hh-context-preview"><summary>Privacy: see exactly what local AI will receive</summary><p>Phone/email are not included by this context builder. Common SSN, banking, wire, password/passcode/PIN and ID patterns are redacted.</p><pre id="hhContextPreview">Choose a CRM relationship to preview the sanitized packet.</pre></details>` : `<div class="hh-context-note">This tool uses only the form content you enter here plus Holton's system guardrails.</div>`}
      <div class="hh-actions"><button class="hh-btn primary" id="hhRunTool">Generate with local AI</button><span class="hh-status" id="hhToolStatus"></span></div>
      <section class="hh-generated" id="hhToolResult"><div class="hh-empty">The result will appear here. Nothing sends to a client automatically.</div></section></div>`);
    $("#hhRunTool").addEventListener("click", runActiveTool);
    $("#hhToolContact")?.addEventListener("change", updateContextPreview);
    updateContextPreview();
  }
  function updateContextPreview() {
    const pre = $("#hhContextPreview"); if (!pre) return;
    const contactId = $("#hhToolContact")?.value || "";
    if (!contactId) { pre.textContent = "Choose a CRM relationship to preview the sanitized packet."; return; }
    const ctx = E().buildContactContext(contactId);
    pre.textContent = ctx ? JSON.stringify(ctx, null, 2) : "No context found for this relationship.";
  }
  function fieldHtml(f, preset) {
    const val = preset ?? "";
    if (f.type === "textarea") return `<label class="wide"><span>${esc(f.label)}${f.required ? " *" : ""}</span><textarea data-hh-field="${esc(f.key)}" placeholder="${esc(f.placeholder || "")}">${esc(val)}</textarea></label>`;
    if (f.type === "select") return `<label><span>${esc(f.label)}</span><select data-hh-field="${esc(f.key)}">${(f.options || []).map(o => `<option ${String(o) === String(val) ? "selected" : ""}>${esc(o)}</option>`).join("")}</select></label>`;
    return `<label class="${f.wide ? "wide" : ""}"><span>${esc(f.label)}${f.required ? " *" : ""}</span><input data-hh-field="${esc(f.key)}" type="${esc(f.type || "text")}" value="${esc(val)}" placeholder="${esc(f.placeholder || "")}"></label>`;
  }
  async function runActiveTool() {
    const tool = E().toolById(activeToolId); if (!tool) return;
    const form = {};
    $$('[data-hh-field]', $("#hhStudioModalBody")).forEach(el => form[el.dataset.hhField] = el.value);
    const missing = (tool.fields || []).filter(f => f.required && !String(form[f.key] || "").trim());
    if (missing.length) return setToolStatus(`Add ${missing.map(x => x.label).join(", ")}.`, "error");
    const contactId = $("#hhToolContact")?.value || "";
    if (tool.context && !contactId) return setToolStatus("Choose a CRM relationship first.", "error");
    const extra = $("#hhToolExtra")?.value || "";
    const btn = $("#hhRunTool"); btn.disabled = true; btn.textContent = "Generating…"; setToolStatus("Talking to Ollama on this computer…", "working");
    try {
      const result = await E().generate(tool.id, { contactId, form, extra });
      $("#hhToolResult").innerHTML = `<div class="hh-result-actions"><button class="hh-btn ghost" data-hh-copy-result>Copy</button><button class="hh-btn ghost" data-hh-save-result>Saved to library ✓</button></div><pre>${esc(result.text)}</pre>`;
      $("[data-hh-copy-result]")?.addEventListener("click", async () => { await navigator.clipboard.writeText(result.text); setToolStatus("Copied.", "ok"); });
      setToolStatus("Generated locally. Review before using.", "ok");
    } catch (err) {
      $("#hhToolResult").innerHTML = `<div class="hh-error"><strong>AI is offline</strong><p>${esc(err.message)}</p><a href="#/studio/settings" data-hh-close-modal>Open Studio Settings →</a></div>`;
      setToolStatus("Generation failed; CRM is unaffected.", "error");
    } finally { btn.disabled = false; btn.textContent = "Generate with local AI"; }
  }
  function setToolStatus(text, kind = "") { const el = $("#hhToolStatus"); if (el) { el.textContent = text; el.className = `hh-status ${kind}`; } }

  function openCompEditor(index = -1) {
    const c = index >= 0 ? cmaDraft.comps[index] : {};
    openModal(index >= 0 ? "Edit comparable" : "Add comparable", `<div class="hh-form-grid">
      ${inputModal("hhCompAddress", "Address", c.address, "text", true)}
      <label><span>Status</span><select id="hhCompStatus">${["Sold", "Pending", "Active"].map(x => `<option ${c.status === x ? "selected" : ""}>${x}</option>`).join("")}</select></label>
      ${inputModal("hhCompSalePrice", "Sale / list price", c.salePrice, "number")}
      ${inputModal("hhCompSaleDate", "Sale date", c.saleDate, "date")}
      ${inputModal("hhCompDistance", "Distance miles", c.distanceMiles, "number")}
      ${inputModal("hhCompSqft", "Living area", c.sqft, "number")}
      ${inputModal("hhCompAcres", "Acres", c.acres, "number")}
      ${inputModal("hhCompBeds", "Beds", c.beds, "number")}
      ${inputModal("hhCompBaths", "Baths", c.baths, "number")}
      ${inputModal("hhCompYear", "Year built", c.yearBuilt, "number")}
      ${inputModal("hhCompType", "Property type", c.propertyType, "text")}
      <label><span>Source</span><select id="hhCompSource">${["County Auditor / Public Record", "CincyMLS", "Manual Verified", "Zillow manual reference", "Redfin manual reference", "Other"].map(x => `<option ${c.source === x ? "selected" : ""}>${x}</option>`).join("")}</select></label>
      ${inputModal("hhCompAdjustment", "Manual adjustment (+/-)", c.manualAdjustment, "number")}
      ${inputModal("hhCompSourceUrl", "Source URL / note", c.sourceUrl, "text", true)}
      <label class="wide"><span>Condition / verification notes</span><textarea id="hhCompNotes">${esc(c.notes || "")}</textarea></label>
    </div><div class="hh-actions"><button class="hh-btn primary" id="hhSaveComp">${index >= 0 ? "Save changes" : "Add comp"}</button></div>`);
    $("#hhSaveComp").addEventListener("click", () => {
      const next = { id: c.id || E().uid(), include: c.include !== false, address: $("#hhCompAddress").value.trim(), status: $("#hhCompStatus").value, salePrice: Number($("#hhCompSalePrice").value || 0), saleDate: $("#hhCompSaleDate").value, distanceMiles: Number($("#hhCompDistance").value || 0), sqft: Number($("#hhCompSqft").value || 0), acres: Number($("#hhCompAcres").value || 0), beds: Number($("#hhCompBeds").value || 0), baths: Number($("#hhCompBaths").value || 0), yearBuilt: Number($("#hhCompYear").value || 0), propertyType: $("#hhCompType").value.trim(), source: $("#hhCompSource").value, manualAdjustment: Number($("#hhCompAdjustment").value || 0), sourceUrl: $("#hhCompSourceUrl").value.trim(), notes: $("#hhCompNotes").value.trim() };
      if (!next.address || !next.salePrice) return;
      if (index >= 0) cmaDraft.comps[index] = next; else cmaDraft.comps.push(next);
      cmaDraft.result = null; saveCmaDraft(); closeModal(); renderStudio();
    });
  }
  function inputModal(id, label, value, type = "text", wide = false) { return `<label class="${wide ? "wide" : ""}"><span>${label}</span><input id="${id}" type="${type}" step="any" value="${esc(value || "")}"></label>`; }

  function parseCsv(text) {
    const rows = [];
    let row = [], cell = "", quoted = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === '"') { if (quoted && text[i + 1] === '"') { cell += '"'; i++; } else quoted = !quoted; }
      else if (ch === "," && !quoted) { row.push(cell); cell = ""; }
      else if ((ch === "\n" || ch === "\r") && !quoted) { if (ch === "\r" && text[i + 1] === "\n") i++; row.push(cell); if (row.some(x => x.trim())) rows.push(row); row = []; cell = ""; }
      else cell += ch;
    }
    row.push(cell); if (row.some(x => x.trim())) rows.push(row);
    if (rows.length < 2) return [];
    const headers = rows[0].map(h => h.trim().toLowerCase().replace(/[^a-z0-9]+/g, ""));
    const find = (...names) => names.map(n => headers.findIndex(h => h.includes(n))).find(i => i >= 0) ?? -1;
    const idx = { address: find("address", "propertyaddress", "location"), price: find("saleamount", "saleprice", "price"), date: find("saledate", "transferdate", "date"), sqft: find("livingarea", "sqft", "squarefeet"), acres: find("acres", "acreage"), beds: find("bedrooms", "beds"), baths: find("bathrooms", "baths"), year: find("yearbuilt", "built"), parcel: find("parcel") };
    const cleanNum = v => Number(String(v || "").replace(/[$,]/g, "")) || 0;
    return rows.slice(1).map(r => ({ id: E().uid(), include: true, address: idx.address >= 0 ? r[idx.address]?.trim() : "", status: "Sold", salePrice: idx.price >= 0 ? cleanNum(r[idx.price]) : 0, saleDate: idx.date >= 0 ? normalizeDate(r[idx.date]) : "", sqft: idx.sqft >= 0 ? cleanNum(r[idx.sqft]) : 0, acres: idx.acres >= 0 ? cleanNum(r[idx.acres]) : 0, beds: idx.beds >= 0 ? cleanNum(r[idx.beds]) : 0, baths: idx.baths >= 0 ? cleanNum(r[idx.baths]) : 0, yearBuilt: idx.year >= 0 ? cleanNum(r[idx.year]) : 0, parcel: idx.parcel >= 0 ? r[idx.parcel]?.trim() : "", source: "County Auditor / Public Record", manualAdjustment: 0 })).filter(x => x.address && x.salePrice);
  }
  function normalizeDate(v) {
    const d = new Date(v); return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
  }

  function bindStudio() {
    bindGlobalButtons(view());
    $$('[data-hh-view-asset]', view()).forEach(btn => btn.addEventListener("click", () => {
      const a = E().readStudio().assets.find(x => x.id === btn.dataset.hhViewAsset); if (!a) return;
      openModal(a.title || "Studio draft", `<div class="hh-generated"><pre>${esc(a.body || "")}</pre></div>`);
    }));
    $("[data-hh-export]")?.addEventListener("click", exportBackup);
    $("[data-hh-test-ai]")?.addEventListener("click", testAi);
    $("[data-hh-save-settings]")?.addEventListener("click", saveAiSettings);
    $("[data-hh-save-profile]")?.addEventListener("click", saveProfile);
    $("[data-hh-save-privacy]")?.addEventListener("click", savePrivacy);
    $("[data-hh-save-subject]")?.addEventListener("click", saveSubject);
    $("[data-hh-add-comp]")?.addEventListener("click", () => openCompEditor(-1));
    $$('[data-hh-edit-comp]', view()).forEach(btn => btn.addEventListener("click", () => openCompEditor(Number(btn.dataset.hhEditComp))));
    $$('[data-hh-delete-comp]', view()).forEach(btn => btn.addEventListener("click", () => { cmaDraft.comps.splice(Number(btn.dataset.hhDeleteComp), 1); cmaDraft.result = null; saveCmaDraft(); renderStudio(); }));
    $$('[data-hh-comp-include]', view()).forEach(cb => cb.addEventListener("change", () => { cmaDraft.comps[Number(cb.dataset.hhCompInclude)].include = cb.checked; cmaDraft.result = null; saveCmaDraft(); }));
    $("[data-hh-calc-cma]")?.addEventListener("click", calculateCmaUi);
    $("[data-hh-save-cma]")?.addEventListener("click", saveCmaUi);
    $("[data-hh-explain-cma]")?.addEventListener("click", () => openTool("cma-narrative", { preset: { cmaSummary: cmaSummary(cmaDraft.result) } }));
    $("#hhCompCsvInput")?.addEventListener("change", importCsv);
  }
  function bindGlobalButtons(root = document) {
    $$('[data-hh-tool]', root).forEach(btn => {
      if (btn.dataset.hhBound) return; btn.dataset.hhBound = "1";
      btn.addEventListener("click", (e) => { e.preventDefault(); openTool(btn.dataset.hhTool, { contactId: btn.dataset.contactId || "" }); });
    });
  }

  function saveSubject() {
    cmaDraft.subject = { address: $("#hhCmaAddress").value.trim(), propertyType: $("#hhCmaType").value.trim(), sqft: Number($("#hhCmaSqft").value || 0), acres: Number($("#hhCmaAcres").value || 0), beds: Number($("#hhCmaBeds").value || 0), baths: Number($("#hhCmaBaths").value || 0), yearBuilt: Number($("#hhCmaYear").value || 0) };
    cmaDraft.result = null; saveCmaDraft(); renderStudio();
  }
  function calculateCmaUi() { saveSubjectValuesOnly(); cmaDraft.result = E().calculateCMA(cmaDraft.subject, cmaDraft.comps); saveCmaDraft(); renderStudio(); }
  function saveSubjectValuesOnly() {
    cmaDraft.subject = { address: $("#hhCmaAddress")?.value.trim() || cmaDraft.subject.address || "", propertyType: $("#hhCmaType")?.value.trim() || "", sqft: Number($("#hhCmaSqft")?.value || 0), acres: Number($("#hhCmaAcres")?.value || 0), beds: Number($("#hhCmaBeds")?.value || 0), baths: Number($("#hhCmaBaths")?.value || 0), yearBuilt: Number($("#hhCmaYear")?.value || 0) };
  }
  function saveCmaUi() {
    if (!cmaDraft.result) return;
    E().saveCMA({ title: cmaDraft.subject.address || `CMA ${new Date().toLocaleDateString()}`, subject: cmaDraft.subject, comps: cmaDraft.comps, result: cmaDraft.result, status: "research" });
    E().saveAsset({ type: "cma", title: `CMA — ${cmaDraft.subject.address || "Subject"}`, body: cmaSummary(cmaDraft.result), metadata: { cma: cmaDraft.result } });
    const btn = $("[data-hh-save-cma]"); if (btn) btn.textContent = "Saved ✓";
  }
  async function importCsv(e) {
    const file = e.target.files?.[0]; if (!file) return;
    const text = await file.text(); const rows = parseCsv(text);
    if (!rows.length) return alert("I could not find address + sale price columns in that CSV. For XLSX, export/save the file as CSV first in this baseline.");
    cmaDraft.comps.push(...rows.slice(0, 250)); cmaDraft.result = null; saveCmaDraft(); renderStudio();
  }

  async function testAi() {
    const status = $("#hhAiStatus"); const btn = $("[data-hh-test-ai]");
    const endpoint = $("#hhAiEndpoint")?.value.trim() || E().DEFAULT_OLLAMA;
    status.textContent = "Testing…"; status.className = "hh-status working"; btn.disabled = true;
    try {
      const models = await E().listOllamaModels(endpoint);
      const select = $("#hhAiModel");
      const current = E().readStudio().ai.model;
      select.innerHTML = models.length ? models.map(m => `<option value="${esc(m.name)}" ${m.name === current ? "selected" : ""}>${esc(m.name)}${m.size ? ` · ${(m.size / 1e9).toFixed(1)} GB` : ""}</option>`).join("") : `<option>No models installed</option>`;
      status.textContent = models.length ? `Online · ${models.length} model${models.length === 1 ? "" : "s"}` : "Online · no models"; status.className = "hh-status ok";
      E().updateStudio(s => { s.ai.endpoint = endpoint; s.ai.lastConnectedAt = new Date().toISOString(); if (!s.ai.model && models[0]) s.ai.model = models[0].name; return s; });
    } catch (err) {
      status.textContent = "Offline / blocked"; status.className = "hh-status error";
      openModal("Ollama connection", `<div class="hh-error"><strong>Studio could not reach Ollama.</strong><p>${esc(err.message)}</p><p>Make sure Ollama is running. If the CRM is on Vercel, the CRM origin may need to be added to OLLAMA_ORIGINS. Do not expose port 11434 to the public internet.</p></div>`);
    } finally { btn.disabled = false; }
  }
  function saveAiSettings() {
    E().updateStudio(s => { s.ai.endpoint = $("#hhAiEndpoint")?.value.trim() || E().DEFAULT_OLLAMA; s.ai.model = $("#hhAiModel")?.value || s.ai.model; s.ai.keepAlive = Number($("#hhAiKeepAlive")?.value || 0); return s; });
    queueEnhance();
  }
  function saveProfile() {
    E().updateStudio(s => { s.profile.licenseMode = $("#hhLicenseMode").value; s.profile.licenseState = $("#hhLicenseState").value.trim() || "OH"; s.profile.advertisingName = $("#hhAdvertisingName").value.trim(); s.profile.licenseNumber = $("#hhLicenseNumber").value.trim(); s.profile.brokerageName = $("#hhBrokerageName").value.trim(); s.profile.brokerageReviewed = $("#hhBrokerageReviewed").checked; s.profile.realtorMember = $("#hhRealtorMember").checked; return s; });
    renderStudio();
  }
  function savePrivacy() {
    E().updateStudio(s => {
      s.preferences.includeNamesInLocalAi = Boolean($("#hhIncludeNames")?.checked);
      s.preferences.saveAiDrafts = Boolean($("#hhSaveAiDrafts")?.checked);
      s.preferences.maxCommunicationItems = Number($("#hhMaxComms")?.value || 8);
      s.preferences.maxTaskItems = Number($("#hhMaxTasks")?.value || 8);
      return s;
    });
    renderStudio();
  }
  function exportBackup() {
    const blob = new Blob([JSON.stringify(E().exportAll(), null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `holton-studio-backup-${E().today()}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function attachObserver() {
    const v = view(); if (!v) return;
    const obs = new MutationObserver(() => {
      if (rootRoute() === "studio") {
        if (!v.querySelector(".hh-studio-page")) queueEnhance();
      } else {
        enhanceContent(); enhanceContact(); enhanceMore();
      }
      bindGlobalButtons(v);
    });
    obs.observe(v, { childList: true, subtree: false });
  }

  window.HoltonStudioUI = { openTool, renderStudio, queueEnhance, openModal, closeModal };

  window.addEventListener("hashchange", queueEnhance);
  window.addEventListener("load", () => { ensureNav(); attachObserver(); queueEnhance(); });
  document.addEventListener("DOMContentLoaded", () => { ensureNav(); ensureModal(); queueEnhance(); });
})();
