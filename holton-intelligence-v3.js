(() => {
  "use strict";

  const VERSION = "3.0.0";
  const CACHE_KEY = "holtonHomesIntelligence_v3";
  const CRM_KEY = "holtonHomesOS_v13";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
  const E = () => window.HoltonStudioEngine;
  const view = () => $("#view");
  const parts = () => (location.hash || "#/today").replace(/^#\//, "").split("?")[0].split("/").filter(Boolean);
  const root = () => parts()[0] || "today";
  const contactIdFromRoute = () => root() === "contact" ? decodeURIComponent(parts()[1] || "") : "";
  const clamp = (n, min = 0, max = 1) => Math.max(min, Math.min(max, Number(n) || 0));
  const sigmoid = (x) => 1 / (1 + Math.exp(-x));
  const now = () => new Date();
  const todayStr = () => E()?.today?.() || new Date().toISOString().slice(0,10);
  const DAY = 86400000;

  let observer = null;
  let applyTimer = null;
  let pollTimer = null;
  let currentRequest = null;
  let aiState = "idle";
  let foregroundQueued = null;
  let autoQueue = [];
  let autoBriefsThisSession = 0;
  let lastCrmFingerprint = "";
  let lastContactSnapshots = {};

  const DEFAULT_PREFS = {
    autoInsights: true,
    backgroundNewLeads: true,
    maxAutoBriefsPerSession: 3,
    autoDelayMs: 1200
  };

  function readStore(){
    try {
      const raw = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
      return {
        version: 3,
        prefs: { ...DEFAULT_PREFS, ...(raw.prefs || {}) },
        contacts: raw.contacts || {},
        snapshots: raw.snapshots || {},
        updatedAt: raw.updatedAt || ""
      };
    } catch {
      return { version:3, prefs:{...DEFAULT_PREFS}, contacts:{}, snapshots:{}, updatedAt:"" };
    }
  }

  function writeStore(next){
    next.updatedAt = new Date().toISOString();
    localStorage.setItem(CACHE_KEY, JSON.stringify(next));
    return next;
  }

  function updateStore(mutator){
    const s = readStore();
    const n = mutator(s) || s;
    return writeStore(n);
  }

  function crm(){ return E()?.readCRM?.() || {}; }
  function studio(){ return E()?.readStudio?.() || {}; }
  function contactById(id){ return E()?.contactById?.(crm(), id) || null; }
  function fullName(c){ return E()?.fullName?.(c) || "Contact"; }
  function propertiesFor(id){ return (crm().properties || []).filter(p => String(p.contactId) === String(id)); }
  function primaryProperty(id){ return propertiesFor(id).find(p => p.primary) || propertiesFor(id)[0] || null; }
  function fmtAddress(p){ return E()?.propertyAddress?.(p) || ""; }
  function communicationsFor(id){ return (crm().communications || []).filter(m => String(m.contactId) === String(id)); }
  function tasksFor(id){ return (crm().tasks || []).filter(t => String(t.contactId) === String(id)); }

  function parseDate(value){
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  function daysSince(value){
    const d = parseDate(value);
    if (!d) return null;
    return Math.max(0, Math.floor((now().getTime() - d.getTime()) / DAY));
  }
  function dateDeltaDays(value){
    const d = parseDate(value);
    if (!d) return null;
    const t = parseDate(todayStr());
    return Math.round((d.getTime() - t.getTime()) / DAY);
  }
  function formatDate(value){
    const d = parseDate(value);
    if (!d) return "—";
    return d.toLocaleDateString(undefined, { month:"short", day:"numeric", year: d.getFullYear() !== now().getFullYear() ? "numeric" : undefined });
  }
  function relativeDate(value){
    const delta = dateDeltaDays(value);
    if (delta === null) return "No date";
    if (delta === 0) return "today";
    if (delta === 1) return "tomorrow";
    if (delta > 1) return `in ${delta} days`;
    if (delta === -1) return "1 day overdue";
    return `${Math.abs(delta)} days overdue`;
  }

  function stableHash(input){
    const str = typeof input === "string" ? input : JSON.stringify(input);
    let h = 2166136261;
    for (let i=0; i<str.length; i++){
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(16);
  }

  function latestCommunicationDate(id, c){
    const latest = communicationsFor(id)
      .slice()
      .sort((a,b) => String(b.date || "").localeCompare(String(a.date || "")))[0];
    return latest?.date || c?.lastCommunication || c?.updatedAt || c?.createdAt || "";
  }

  function unreadInbound(id){
    return communicationsFor(id).filter(m => m.unread && m.direction === "inbound").length;
  }

  function stageIntent(stage){
    const s = String(stage || "").toLowerCase();
    if (/appointment|consult|showing|offer|under contract|active|listing/.test(s)) return .92;
    if (/valuation|qualified|nurture|warm/.test(s)) return .68;
    if (/contacted|attempted/.test(s)) return .5;
    if (/new/.test(s)) return .55;
    return .36;
  }

  function timeframeIntent(value){
    const s = String(value || "").toLowerCase();
    if (/0.?3|now|immediate|30 day|60 day|90 day|asap/.test(s)) return .95;
    if (/3.?6|this year|6 month/.test(s)) return .72;
    if (/6.?12|next year/.test(s)) return .48;
    if (/not moving|none|unknown|unsure/.test(s)) return .2;
    return value ? .45 : .3;
  }

  function relationshipStrength(c){
    const source = String(c?.source || "").toLowerCase();
    let r = .25;
    if (/past client/.test(source) || c?.type === "Past Client") r = .88;
    else if (/referral/.test(source)) r = .78;
    else if (/sphere/.test(source)) r = .7;
    const history = communicationsFor(c?.id).length;
    r += Math.min(history, 8) * .025;
    return clamp(r);
  }

  function relevantMissing(c, p){
    const miss = [];
    const type = String(c?.type || "").toLowerCase();
    const seller = c?.sellerDetails || {};
    const buyer = c?.buyerDetails || {};
    if (!c?.followUp) miss.push("next follow-up");
    if (!latestCommunicationDate(c?.id, c)) miss.push("last contact");
    if (!c?.timeframe || String(c.timeframe).toLowerCase() === "unknown") miss.push("timeframe");

    if (type === "seller"){
      if (!(p?.motivation || seller.motivation)) miss.push("seller motivation");
      if (!(p?.condition || seller.condition)) miss.push("condition");
      if (!(seller.decisionMakers || (c.household || []).some?.(x => x.decisionMaker))) miss.push("decision makers");
      if (!(p?.street || p?.address)) miss.push("property address");
    } else if (type === "buyer"){
      if (!(buyer.budget || buyer.maxPrice || buyer.desiredPayment)) miss.push("budget / payment");
      if (!(buyer.preapproval || buyer.preapproved || buyer.financingStatus || buyer.lender)) miss.push("financing");
      if (!(buyer.areas || buyer.locations || buyer.preferredAreas)) miss.push("areas");
    } else {
      if (!c?.type || /contact|unknown/i.test(c.type)) miss.push("buyer / seller intent");
    }
    return [...new Set(miss)].slice(0, 6);
  }

  function completeness(c, p){
    const type = String(c?.type || "").toLowerCase();
    const base = [
      Boolean(c?.stage),
      Boolean(c?.source),
      Boolean(c?.heat),
      Boolean(c?.followUp),
      Boolean(latestCommunicationDate(c?.id, c)),
      Boolean(c?.timeframe && String(c.timeframe).toLowerCase() !== "unknown")
    ];
    if (type === "seller"){
      base.push(Boolean(p?.street || p?.address));
      base.push(Boolean(p?.motivation || c?.sellerDetails?.motivation));
      base.push(Boolean(p?.condition || c?.sellerDetails?.condition));
      base.push(Boolean(c?.sellerDetails?.decisionMakers || (c.household || []).some?.(x => x.decisionMaker)));
    } else if (type === "buyer"){
      const b = c?.buyerDetails || {};
      base.push(Boolean(b.budget || b.maxPrice || b.desiredPayment));
      base.push(Boolean(b.preapproval || b.preapproved || b.financingStatus || b.lender));
      base.push(Boolean(b.areas || b.locations || b.preferredAreas));
    }
    return base.filter(Boolean).length / Math.max(base.length, 1);
  }

  function metricsFor(c){
    const p = primaryProperty(c.id);
    const age = daysSince(latestCommunicationDate(c.id, c));
    const delta = dateDeltaDays(c.followUp);
    const unread = unreadInbound(c.id);

    const heat = c.heat === "Hot" ? .95 : c.heat === "Warm" ? .66 : c.heat === "Cold" ? .22 : .36;
    const tf = timeframeIntent(c.timeframe);
    const stage = stageIntent(c.stage);
    const intent = clamp(.44 * heat + .34 * tf + .22 * stage);

    const rel = relationshipStrength(c);
    let urgency = 0;
    if (unread) urgency = 1;
    else if (delta !== null && delta < 0) urgency = .64 + .30 * (1 - Math.exp(-Math.abs(delta) / 7));
    else if (delta === 0) urgency = .78;
    else if (delta !== null && delta <= 2) urgency = .56;
    else {
      const stale = age === null ? 0 : sigmoid((age - 18) / 8);
      const stalePressure = stale * (.18 + .52 * Math.max(intent, rel));
      const noNext = !c.followUp ? .22 : 0;
      urgency = clamp(stalePressure + noNext);
    }

    const complete = completeness(c, p);
    const freshness = age === null ? .35 : Math.exp(-Math.min(age, 180) / 100);
    const confidence = clamp(.18 + .64 * complete + .18 * freshness);

    const priorityRaw = .58 * urgency + .30 * intent + .12 * rel;
    const priority = Math.round(clamp(priorityRaw) * 100);
    return {
      priority,
      urgency: Math.round(urgency * 100),
      intent: Math.round(intent * 100),
      confidence: Math.round(confidence * 100),
      relationship: Math.round(rel * 100),
      age,
      followUpDelta: delta,
      unread,
      missing: relevantMissing(c, p),
      property: p
    };
  }

  function nextAction(c, m){
    if (m.unread) return {
      label: "Reply personally",
      reason: `${m.unread} unread inbound message${m.unread === 1 ? "" : "s"} should beat prospecting.`,
      kind: "reply"
    };
    if (m.followUpDelta !== null && m.followUpDelta < 0) return {
      label: "Make the promised follow-up",
      reason: `The CRM follow-up is ${Math.abs(m.followUpDelta)} day${Math.abs(m.followUpDelta) === 1 ? "" : "s"} overdue.`,
      kind: "followup"
    };
    if (m.followUpDelta === 0) return { label:"Follow up today", reason:"A documented follow-up is due today.", kind:"followup" };
    const comms = communicationsFor(c.id);
    const createdAge = daysSince(c.createdAt);
    if ((createdAge === null || createdAge <= 1) && comms.length === 0) return {
      label:"Make first human contact",
      reason:"This looks like a new relationship with no recorded conversation yet.",
      kind:"new"
    };
    if (!c.followUp && (m.intent >= 55 || ["Seller","Buyer"].includes(c.type))) return {
      label:"Set the next date",
      reason:"There is enough potential here that the relationship should not be left without a next step.",
      kind:"date"
    };
    if (c.type === "Seller" && m.missing.some(x => ["seller motivation","timeframe","decision makers"].includes(x))) return {
      label:"Clarify seller intent",
      reason:"The next conversation should fill the seller facts that actually change strategy.",
      kind:"seller"
    };
    if (c.type === "Buyer" && m.missing.some(x => ["budget / payment","financing","timeframe"].includes(x))) return {
      label:"Clarify the buyer plan",
      reason:"Financing, payment comfort and timing are still too incomplete to act intelligently.",
      kind:"buyer"
    };
    if ((m.age || 0) >= 30 && m.relationship >= 60) return {
      label:"Relationship check-in",
      reason:`This is a relationship-source contact and it has been ${m.age} days since the last recorded touch.`,
      kind:"nurture"
    };
    return { label:"Keep warm", reason:"No urgent trigger is firing. Preserve the relationship and keep a real next date.", kind:"nurture" };
  }

  function contactSnapshot(c){
    const p = primaryProperty(c.id);
    const comms = communicationsFor(c.id);
    const tasks = tasksFor(c.id);
    return {
      contact: {
        id:c.id, type:c.type, stage:c.stage, heat:c.heat, source:c.source,
        timeframe:c.timeframe, followUp:c.followUp, lastCommunication:c.lastCommunication,
        notes:c.notes, tags:c.tags, sellerDetails:c.sellerDetails, buyerDetails:c.buyerDetails,
        updatedAt:c.updatedAt
      },
      property: p ? {
        id:p.id, status:p.status, street:p.street, city:p.city, state:p.state, zip:p.zip,
        propertyType:p.propertyType, beds:p.beds, baths:p.baths, sqft:p.sqft, acres:p.acres,
        yearBuilt:p.yearBuilt, condition:p.condition, motivation:p.motivation,
        estimatedValue:p.estimatedValue, listPrice:p.listPrice, targetDate:p.targetDate,
        appointmentDate:p.appointmentDate, notes:p.notes
      } : null,
      communications: comms.slice().sort((a,b)=>String(b.date||"").localeCompare(String(a.date||""))).slice(0,5)
        .map(x=>({date:x.date,direction:x.direction,channel:x.channel,body:x.body||x.outcome||"",unread:x.unread})),
      tasks: tasks.filter(t=>t.status!=="Done").slice(0,5).map(t=>({title:t.title,due:t.due,type:t.type,priority:t.priority}))
    };
  }

  function changedFields(oldSnap, newSnap){
    if (!oldSnap) return [];
    const labels = [];
    const pairs = [
      ["stage", oldSnap.contact?.stage, newSnap.contact?.stage],
      ["heat", oldSnap.contact?.heat, newSnap.contact?.heat],
      ["follow-up", oldSnap.contact?.followUp, newSnap.contact?.followUp],
      ["timeframe", oldSnap.contact?.timeframe, newSnap.contact?.timeframe],
      ["notes", oldSnap.contact?.notes, newSnap.contact?.notes],
      ["property status", oldSnap.property?.status, newSnap.property?.status],
      ["property value", oldSnap.property?.estimatedValue, newSnap.property?.estimatedValue],
      ["motivation", oldSnap.property?.motivation || oldSnap.contact?.sellerDetails?.motivation, newSnap.property?.motivation || newSnap.contact?.sellerDetails?.motivation]
    ];
    for (const [label,a,b] of pairs) if (String(a ?? "") !== String(b ?? "")) labels.push(label);
    if ((oldSnap.communications || []).length !== (newSnap.communications || []).length) labels.push("communications");
    if ((oldSnap.tasks || []).length !== (newSnap.tasks || []).length) labels.push("tasks");
    return labels.slice(0,4);
  }

  function instantRead(c, m, action){
    const p = m.property;
    const facts = [];
    if (c.stage) facts.push(c.stage);
    if (c.heat) facts.push(`${c.heat} heat`);
    if (m.age !== null) facts.push(`last touch ${m.age === 0 ? "today" : `${m.age}d ago`}`);
    if (p && fmtAddress(p)) facts.push(fmtAddress(p));
    const follow = c.followUp ? `${formatDate(c.followUp)} · ${relativeDate(c.followUp)}` : "No follow-up date";
    return {
      headline: action.label,
      reason: action.reason,
      facts: facts.slice(0,4),
      follow,
      missing: m.missing
    };
  }

  function queueRanked(limit=8){
    const items = (crm().contacts || [])
      .filter(c => !["Closed","Lost"].includes(c.stage))
      .map(c => {
        const metrics = metricsFor(c);
        return { c, metrics, action: nextAction(c, metrics) };
      })
      .sort((a,b) => {
        if (b.metrics.priority !== a.metrics.priority) return b.metrics.priority - a.metrics.priority;
        return (b.metrics.confidence || 0) - (a.metrics.confidence || 0);
      });
    return items.slice(0,limit);
  }

  function renderToday(){
    if (root() !== "today") return;
    const v = view(); if (!v) return;
    const q = queueRanked(7);
    const existing = $("#hhWorthCommand", v);
    if (!existing) return;
    const overdue = q.filter(x => x.metrics.followUpDelta !== null && x.metrics.followUpDelta < 0).length;
    const unread = q.reduce((n,x)=>n+x.metrics.unread,0);
    const noNext = (crm().contacts || []).filter(c => !["Closed","Lost"].includes(c.stage) && !c.followUp).length;
    const headline = unread
      ? `${unread} inbound message${unread===1?"":"s"} should come first.`
      : overdue
      ? `${overdue} overdue promise${overdue===1?"":"s"} need${overdue===1?"s":""} attention.`
      : q.length
      ? `${q.length} relationships are worth working today.`
      : "Your database is quiet.";

    existing.className = "hv3-command";
    existing.dataset.hv3 = "1";
    existing.innerHTML = `
      <header class="hv3-command-head">
        <div>
          <span class="hv3-eyebrow">HOLTON INTELLIGENCE · TODAY</span>
          <h1>${esc(headline)}</h1>
          <p>Priority is calculated from urgency, intent and relationship strength. Confidence tells you how complete the CRM evidence is.</p>
        </div>
        <div class="hv3-statline">
          <div><strong>${overdue}</strong><span>overdue</span></div>
          <div><strong>${noNext}</strong><span>no next date</span></div>
          <div><strong>${unread}</strong><span>inbound</span></div>
        </div>
      </header>
      <div class="hv3-queue">
        ${q.length ? q.map((x,i)=>`
          <button class="hv3-queue-row" data-hv3-open-contact="${esc(x.c.id)}">
            <span class="hv3-rank">${i+1}</span>
            <span class="hv3-person">
              <strong>${esc(fullName(x.c))}</strong>
              <small>${esc([x.c.type, x.c.stage, x.c.heat].filter(Boolean).join(" · "))}</small>
            </span>
            <span class="hv3-next">
              <strong>${esc(x.action.label)}</strong>
              <small>${esc(x.action.reason)}</small>
            </span>
            <span class="hv3-meter"><b>${x.metrics.priority}</b><small>priority</small></span>
            <span class="hv3-confidence">${x.metrics.confidence}% conf.</span>
            <span class="hv3-arrow">→</span>
          </button>`).join("") : `<div class="hv3-empty">Add a person, a next date, or activity and this queue will build itself.</div>`}
      </div>`;
    $$("[data-hv3-open-contact]", existing).forEach(btn => btn.addEventListener("click", () => {
      location.hash = `#/contact/${encodeURIComponent(btn.dataset.hv3OpenContact)}`;
    }));
  }

  function contactKnownFacts(c, m){
    const p = m.property;
    const items = [];
    if (c.source) items.push(`Source: ${c.source}`);
    if (c.stage) items.push(`Stage: ${c.stage}`);
    if (c.timeframe && String(c.timeframe).toLowerCase() !== "unknown") items.push(`Timing: ${c.timeframe}`);
    if (m.age !== null) items.push(`Last contact: ${m.age === 0 ? "today" : `${m.age} days ago`}`);
    if (p?.propertyType) items.push(`Property: ${p.propertyType}`);
    if (p?.beds || p?.baths) items.push(`${p.beds || "—"} bd · ${p.baths || "—"} ba`);
    if (p?.sqft) items.push(`${Number(p.sqft).toLocaleString()} sq ft`);
    return items.slice(0,6);
  }

  function openerFor(c, m, action){
    const first = c.firstName || fullName(c).split(" ")[0] || "there";
    if (action.kind === "followup"){
      return `Hey ${first}, I was going through my notes and realized I was due to check back in with you. How have things been?`;
    }
    if (action.kind === "reply"){
      return `Hey ${first} — I saw your message. I wanted to get back to you personally.`;
    }
    if (action.kind === "new"){
      return `Hey ${first}, it’s Jacob. I wanted to introduce myself and learn a little more about what brought you in.`;
    }
    if (c.source === "Sphere"){
      return `Hey ${first}, it’s been a little bit. How have things been with you?`;
    }
    return `Hey ${first}, I wanted to check in and see what’s changed since we last talked.`;
  }

  function getCacheEntry(id){
    return readStore().contacts?.[id] || {};
  }

  function renderContact(){
    if (root() !== "contact") return;
    const id = contactIdFromRoute();
    const c = contactById(id);
    const v = view();
    if (!id || !c || !v) return;
    const host = $("#holtonContactAiStrip", v);
    if (!host) return;

    const m = metricsFor(c);
    const action = nextAction(c,m);
    const instant = instantRead(c,m,action);
    const snap = contactSnapshot(c);
    const hash = stableHash(snap);
    const cache = getCacheEntry(id);
    const cachedFresh = cache.hash === hash && cache.ambient?.text;
    const previousSnap = readStore().snapshots?.[id];
    const changed = changedFields(previousSnap, snap);

    host.dataset.wiUpgraded = "1";
    host.dataset.hv3 = "1";
    host.className = "hv3-intelligence";
    host.innerHTML = `
      <div class="hv3-intel-head">
        <div class="hv3-intel-title">
          <div class="hv3-live"><i></i><span>Holton Intelligence</span>${cachedFresh ? `<em>AI ready</em>` : `<em>live CRM</em>`}</div>
          <h2>${esc(action.label)}</h2>
          <p>${esc(action.reason)}</p>
          ${changed.length ? `<small class="hv3-changed">Changed: ${esc(changed.join(" · "))}</small>` : ""}
        </div>
        <div class="hv3-metrics">
          <div class="hv3-metric primary"><strong>${m.priority}</strong><span>Priority</span></div>
          <div class="hv3-metric"><strong>${m.intent}</strong><span>Intent</span></div>
          <div class="hv3-metric"><strong>${m.confidence}%</strong><span>Confidence</span></div>
        </div>
      </div>

      <div class="hv3-intel-body">
        <section class="hv3-brief-column">
          <div class="hv3-section-label">RIGHT NOW</div>
          <div class="hv3-follow-line">
            <strong>${esc(instant.follow)}</strong>
            <span>${c.followUp ? "documented next date" : "set a real next step before this relationship disappears"}</span>
          </div>
          <div class="hv3-opener">
            <span>Natural opener</span>
            <p>“${esc(openerFor(c,m,action))}”</p>
          </div>
          <div class="hv3-quick-actions">
            <button class="primary" data-hv3-tool="call-prep" data-contact-id="${esc(id)}">Call plan</button>
            <button data-hv3-tool="follow-up-writer" data-contact-id="${esc(id)}">Draft follow-up</button>
            <button data-hv3-tool="lead-brief" data-contact-id="${esc(id)}">Deep brief</button>
          </div>
        </section>

        <section class="hv3-context-column">
          <div class="hv3-context-block">
            <div class="hv3-section-label">KNOWN</div>
            <ul>${contactKnownFacts(c,m).map(x=>`<li>${esc(x)}</li>`).join("") || "<li>CRM context is thin.</li>"}</ul>
          </div>
          <div class="hv3-context-block missing">
            <div class="hv3-section-label">MISSING</div>
            <div class="hv3-chips">${m.missing.length ? m.missing.map(x=>`<span>${esc(x)}</span>`).join("") : `<span class="good">Core context filled</span>`}</div>
          </div>
        </section>

        <section class="hv3-ai-column">
          <header>
            <div><div class="hv3-section-label">AI READ</div><small id="hv3AiFreshness">${cachedFresh ? `cached ${formatTimestamp(cache.ambient.at)}` : "preparing in background"}</small></div>
            <button data-hv3-refresh="${esc(id)}" title="Refresh AI insight">↻</button>
          </header>
          <div id="hv3AmbientInsight" class="hv3-ambient">
            ${cachedFresh ? renderStructuredText(cache.ambient.text) : renderDeterministicAmbient(c,m,action)}
          </div>
        </section>
      </div>`;

    bindContact(host, id);
    updateStore(s => {
      s.snapshots[id] = snap;
      return s;
    });

    if (!cachedFresh && readStore().prefs.autoInsights){
      scheduleAmbient(id, hash, false);
    }
  }

  function renderDeterministicAmbient(c,m,action){
    const missing = m.missing.slice(0,2);
    return `
      <div class="hv3-ambient-row"><b>Signal</b><span>${esc(action.reason)}</span></div>
      <div class="hv3-ambient-row"><b>Watch</b><span>${esc(missing.length ? `CRM is missing ${missing.join(" and ")}.` : "No major context gap is obvious from the current record.")}</span></div>
      <div class="hv3-ambient-row"><b>Question</b><span>${esc(c.type === "Seller" ? "What has changed about timing or motivation since the last conversation?" : c.type === "Buyer" ? "What changed about timing, financing, or the kind of home they want?" : "What role does real estate actually play for this relationship right now?")}</span></div>`;
  }

  function formatTimestamp(value){
    const d = parseDate(value);
    if (!d) return "";
    return d.toLocaleTimeString([], {hour:"numeric",minute:"2-digit"});
  }

  function renderStructuredText(text){
    const lines = String(text || "").split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
    if (!lines.length) return `<div class="hv3-empty">No AI insight yet.</div>`;
    const rows = [];
    for (const line of lines){
      const m = line.match(/^(SIGNAL|WATCH|QUESTION|NEXT|WHY NOW|GOAL|OPENER|ASK|CLOSE|FACTS|GAPS|TEXT|WHY)\s*:\s*(.*)$/i);
      if (m) rows.push(`<div class="hv3-ambient-row"><b>${esc(m[1])}</b><span>${esc(m[2])}</span></div>`);
      else if (/^[-•]\s+/.test(line)) rows.push(`<div class="hv3-bullet">${esc(line.replace(/^[-•]\s+/, ""))}</div>`);
      else rows.push(`<p>${esc(line.replace(/\*\*/g,""))}</p>`);
    }
    return rows.join("");
  }

  function bindContact(host,id){
    $$("[data-hv3-tool]",host).forEach(btn=>btn.addEventListener("click",()=>openSmartDrawer(btn.dataset.hv3Tool,id)));
    $("[data-hv3-refresh]",host)?.addEventListener("click",()=>{
      const c=contactById(id); if(!c)return;
      const hash=stableHash(contactSnapshot(c));
      scheduleAmbient(id,hash,true);
    });
  }

  function ensureDrawer(){
    if ($("#hv3Drawer")) return;
    document.body.insertAdjacentHTML("beforeend", `
      <div class="hv3-drawer-backdrop" id="hv3Drawer">
        <aside class="hv3-drawer">
          <header>
            <div><span>HOLTON INTELLIGENCE</span><h2 id="hv3DrawerTitle">AI</h2></div>
            <button data-hv3-close>×</button>
          </header>
          <div class="hv3-drawer-body" id="hv3DrawerBody"></div>
        </aside>
      </div>`);
    $("#hv3Drawer").addEventListener("click",e=>{
      if(e.target.id==="hv3Drawer" || e.target.closest("[data-hv3-close]")) $("#hv3Drawer").classList.remove("open");
    });
  }

  function openSmartDrawer(toolId,id){
    ensureDrawer();
    const c=contactById(id); if(!c)return;
    const labels = { "call-prep":"Call Plan", "follow-up-writer":"Follow-Up", "lead-brief":"Deep Brief" };
    $("#hv3DrawerTitle").textContent = `${fullName(c)} · ${labels[toolId] || "AI"}`;
    const body=$("#hv3DrawerBody");
    const cache=getCacheEntry(id);
    const hash=stableHash(contactSnapshot(c));
    const cached=cache[toolId];
    body.innerHTML=`
      <div class="hv3-drawer-summary">${drawerSummary(c,metricsFor(c))}</div>
      <div class="hv3-drawer-toolbar">
        <span>${cached?.hash===hash ? `Last generated ${formatTimestamp(cached.at)}` : "Grounded in the current CRM record"}</span>
        <button data-hv3-run-now>Generate</button>
      </div>
      <section class="hv3-ai-result" id="hv3DrawerResult">${cached?.hash===hash ? renderStructuredText(cached.text) : `<div class="hv3-smart-empty"><strong>Ready when you are.</strong><span>Holton already loaded this contact’s context. Generate only when deeper reasoning is worth the ~10 seconds.</span></div>`}</section>`;
    $("#hv3Drawer").classList.add("open");
    $("[data-hv3-run-now]",body)?.addEventListener("click",()=>runForeground(toolId,id,hash));
  }

  function drawerSummary(c,m){
    return `<div><span>PRIORITY</span><strong>${m.priority}</strong></div><div><span>NEXT</span><strong>${esc(nextAction(c,m).label)}</strong></div><div><span>CONFIDENCE</span><strong>${m.confidence}%</strong></div>`;
  }

  function conciseContext(id){
    const ctx=E()?.buildContactContext?.(id);
    if (!ctx) return null;
    return ctx;
  }

  function taskPrompt(toolId,c,m){
    const action=nextAction(c,m);
    const common = `
TODAY: ${todayStr()}
ROLE: Internal CRM copilot for Jacob. Never introduce yourself as an AI assistant. Never tell the client you are an AI.
USER STATUS: ${studio()?.profile?.licenseMode || "prelicense"} in ${studio()?.profile?.licenseState || "OH"}.
PRELICENSE GATE: If USER STATUS is prelicense, outbound wording must remain general relationship/training language. Do not present Jacob as licensed, offer brokerage services, solicit a listing as an agent, negotiate, or imply representation.
GROUNDING: Use only the supplied CRM context. Unknown or custom tags are opaque labels; NEVER infer what a tag means.
DATES: Any date before TODAY is past. If a follow-up date is past, call it overdue; never suggest scheduling that past date.
STYLE: Natural, concise, practical, not corporate. Do not repeat compliance rules unless a real risk is present. Do not invent intent, property facts, listing status, representation, or transaction activity.
CURRENT DETERMINISTIC READ: Priority ${m.priority}; Intent ${m.intent}; Confidence ${m.confidence}; Next action: ${action.label} because ${action.reason}
`;
    if(toolId==="call-prep") return `${common}
Return ONLY this compact structure, maximum 180 words:
WHY NOW: one sentence
GOAL: one sentence
OPENER: one natural sentence Jacob can actually say
ASK:
- 3 to 5 high-value questions
WATCH: one or two assumptions/risks to avoid
CLOSE: one natural next-step close
Do not add a compliance table, meta-explanation, or "why this meets the rules."`;
    if(toolId==="follow-up-writer") return `${common}
Write a short follow-up Jacob could actually send. Maximum 80 words.
Return ONLY:
TEXT: the message
WHY: one sentence explaining the strategy
Do not sound like a data broker. Do not mention that a property was "noticed" in a database.`;
    if(toolId==="lead-brief") return `${common}
Return ONLY this compact structure, maximum 150 words:
FACTS: 3-5 verified facts
GAPS: 2-4 missing facts that matter
SIGNAL: strongest evidence-based business signal
WATCH: biggest assumption to avoid
NEXT: single best human action
No tables. No compliance dissertation. Do not decode custom tags.`;
    return common;
  }

  function ambientPrompt(c,m){
    const action=nextAction(c,m);
    return `
TODAY: ${todayStr()}
You are the silent internal reasoning layer inside a real-estate CRM. Analyze the supplied CRM record for Jacob.
Return EXACTLY four short lines and nothing else:
SIGNAL: the most important evidence-based signal
WATCH: the most important missing fact or assumption to avoid
QUESTION: the single best question for the next conversation
NEXT: the best next human action

Rules:
- Maximum 90 words total.
- Use only supplied CRM facts.
- Unknown/custom tags are opaque labels; never infer their meaning.
- Any date before TODAY is past/overdue.
- Do not introduce yourself, do not mention "AI assistant," and do not write a compliance explanation.
- Do not invent seller/buyer intent, listing status, representation, or property condition.
- The deterministic next action is "${action.label}" because "${action.reason}". You may refine wording, but contradict it only if the CRM evidence clearly supports a better action.
`;
  }

  async function ollamaStream({messages,numPredict=220,onText,signal}){
    const s=studio();
    const ai=s.ai || {};
    const endpoint=String(ai.endpoint || "http://127.0.0.1:11434").replace(/\/$/,"");
    const model=ai.model;
    if(!model) throw new Error("Choose a local model in Studio Settings.");
    const body={
      model,
      messages,
      stream:true,
      keep_alive: Number(ai.keepAlive) || 300,
      options:{temperature:0.18,num_predict:numPredict}
    };
    if(!/instruct/i.test(model)) body.think=false;
    const res=await fetch(`${endpoint}/api/chat`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(body),
      signal
    });
    if(!res.ok){
      const err=await res.json().catch(()=>({}));
      throw new Error(err.error || `Ollama returned ${res.status}`);
    }
    if(!res.body){
      const data=await res.json();
      return String(data?.message?.content||"").replace(/<think>[\s\S]*?<\/think>/gi,"").trim();
    }
    const reader=res.body.getReader();
    const decoder=new TextDecoder();
    let buffer="",text="";
    while(true){
      const {value,done}=await reader.read();
      if(done)break;
      buffer+=decoder.decode(value,{stream:true});
      const lines=buffer.split("\n");
      buffer=lines.pop()||"";
      for(const line of lines){
        if(!line.trim())continue;
        let item;
        try{item=JSON.parse(line);}catch{continue;}
        if(item?.message?.content){
          text+=item.message.content;
          const clean=text.replace(/<think>[\s\S]*?<\/think>/gi,"");
          onText?.(clean);
        }
      }
    }
    return text.replace(/<think>[\s\S]*?<\/think>/gi,"").trim();
  }

  function canAutoRun(){
    const s=studio();
    return Boolean(s?.ai?.provider==="ollama" && s?.ai?.model && readStore().prefs.autoInsights);
  }

  function scheduleAmbient(id,hash,force){
    if(!canAutoRun()) return;
    const cache=getCacheEntry(id);
    if(!force && cache.hash===hash && cache.ambient?.text)return;
    const key=`ambient:${id}:${hash}`;
    if(autoQueue.some(x=>x.key===key))return;
    autoQueue=autoQueue.filter(x=>x.id!==id);
    autoQueue.push({key,id,hash,force});
    setTimeout(processAiQueue, readStore().prefs.autoDelayMs);
  }

  function scheduleNewLead(id){
    if(!readStore().prefs.backgroundNewLeads || !canAutoRun())return;
    if(autoBriefsThisSession>=readStore().prefs.maxAutoBriefsPerSession)return;
    const c=contactById(id); if(!c)return;
    const hash=stableHash(contactSnapshot(c));
    scheduleAmbient(id,hash,false);
  }

  async function processAiQueue(){
    if(aiState!=="idle")return;
    if(foregroundQueued){
      const job=foregroundQueued; foregroundQueued=null;
      return executeForeground(job);
    }
    const job=autoQueue.shift();
    if(!job)return;
    if(autoBriefsThisSession>=readStore().prefs.maxAutoBriefsPerSession)return;
    return executeAmbient(job);
  }

  async function executeAmbient(job){
    const c=contactById(job.id); if(!c)return;
    const currentHash=stableHash(contactSnapshot(c));
    if(currentHash!==job.hash && !job.force)return;
    aiState="ambient";
    autoBriefsThisSession++;
    const controller=new AbortController();
    currentRequest=controller;
    try{
      const ctx=conciseContext(job.id);
      const m=metricsFor(c);
      const text=await ollamaStream({
        messages:[
          {role:"system",content:ambientPrompt(c,m)},
          {role:"user",content:`CRM CONTEXT\n${JSON.stringify(ctx,null,2)}`}
        ],
        numPredict:150,
        signal:controller.signal,
        onText:(partial)=>{
          if(contactIdFromRoute()===job.id){
            const el=$("#hv3AmbientInsight");
            if(el)el.innerHTML=renderStructuredText(partial);
            const f=$("#hv3AiFreshness"); if(f)f.textContent="AI refining…";
          }
        }
      });
      updateStore(s=>{
        s.contacts[job.id]={...(s.contacts[job.id]||{}),hash:job.hash,ambient:{text,at:new Date().toISOString()}};
        return s;
      });
      if(contactIdFromRoute()===job.id){
        const el=$("#hv3AmbientInsight"); if(el)el.innerHTML=renderStructuredText(text);
        const f=$("#hv3AiFreshness"); if(f)f.textContent=`fresh ${formatTimestamp(new Date().toISOString())}`;
      }
    }catch(err){
      if(err.name!=="AbortError" && contactIdFromRoute()===job.id){
        const f=$("#hv3AiFreshness"); if(f)f.textContent="instant CRM read · AI unavailable";
      }
    }finally{
      currentRequest=null; aiState="idle"; setTimeout(processAiQueue,100);
    }
  }

  function runForeground(toolId,id,hash){
    const body=$("#hv3DrawerBody");
    const result=$("#hv3DrawerResult",body);
    const button=$("[data-hv3-run-now]",body);
    if(button){button.disabled=true;button.textContent="Thinking…";}
    if(result)result.innerHTML=`<div class="hv3-streaming"><i></i><span>Building a concise answer from this contact’s current CRM context…</span></div>`;
    if(aiState==="ambient" && currentRequest){
      currentRequest.abort();
      currentRequest=null;
      aiState="idle";
    }
    foregroundQueued={toolId,id,hash,button,result};
    processAiQueue();
  }

  async function executeForeground(job){
    const c=contactById(job.id); if(!c)return;
    aiState="foreground";
    const controller=new AbortController(); currentRequest=controller;
    const m=metricsFor(c);
    try{
      const ctx=conciseContext(job.id);
      const text=await ollamaStream({
        messages:[
          {role:"system",content:taskPrompt(job.toolId,c,m)},
          {role:"user",content:`CRM CONTEXT\n${JSON.stringify(ctx,null,2)}`}
        ],
        numPredict: job.toolId==="follow-up-writer" ? 120 : 260,
        signal:controller.signal,
        onText:(partial)=>{
          if(job.result)job.result.innerHTML=renderStructuredText(partial);
          if(job.button){job.button.textContent="Generating…";}
        }
      });
      updateStore(s=>{
        s.contacts[job.id]={...(s.contacts[job.id]||{}),hash:job.hash,[job.toolId]:{text,hash:job.hash,at:new Date().toISOString()}};
        return s;
      });
      if(job.result){
        job.result.innerHTML=`<div class="hv3-result-tools"><span>Grounded in current CRM context</span><button data-hv3-copy>Copy</button></div>${renderStructuredText(text)}`;
        $("[data-hv3-copy]",job.result)?.addEventListener("click",()=>navigator.clipboard.writeText(text));
      }
    }catch(err){
      if(job.result && err.name!=="AbortError")job.result.innerHTML=`<div class="hv3-ai-error"><strong>Local AI didn’t finish.</strong><span>${esc(err.message)}</span></div>`;
    }finally{
      if(job.button){job.button.disabled=false;job.button.textContent="Regenerate";}
      currentRequest=null; aiState="idle"; setTimeout(processAiQueue,100);
    }
  }

  function patchToolPrompts(){
    const patches={
      "lead-brief":"Create a concise CRM lead brief. Facts only. Never infer the meaning of custom tags. Treat past dates as past/overdue. Maximum 150 words. Use FACTS, GAPS, SIGNAL, WATCH, NEXT. No compliance table or meta explanation.",
      "call-prep":"Create a concise call plan for the human user. Never introduce yourself as AI. Treat past follow-up dates as overdue. Use WHY NOW, GOAL, OPENER, 3-5 QUESTIONS, WATCH, CLOSE. Maximum 180 words. Do not invent intent or decode custom tags.",
      "follow-up-writer":"Write one natural follow-up a human can actually send, grounded in CRM facts. Do not sound like a data broker, do not say you noticed a property in a database, do not mention being an AI assistant, and do not decode custom tags. Maximum 80 words plus one short strategy note."
    };
    for(const [id,prompt] of Object.entries(patches)){
      const tool=E()?.toolById?.(id);
      if(tool)tool.prompt=prompt;
    }
  }

  function renderSettingsEnhancement(){
    if(root()!=="studio" || parts()[1]!=="settings")return;
    const body=$(".hh-studio-body",view()); if(!body || $("#hv3Settings",body))return;
    const prefs=readStore().prefs;
    const panel=document.createElement("section");
    panel.id="hv3Settings";
    panel.className="hv3-settings";
    panel.innerHTML=`
      <div>
        <span class="hv3-eyebrow">INTELLIGENCE BEHAVIOR</span>
        <h3>Make AI ambient, not blocking.</h3>
        <p>Instant CRM math appears first. Local AI quietly refreshes deeper insight only when the record changes.</p>
      </div>
      <label><input type="checkbox" id="hv3AutoInsights" ${prefs.autoInsights?"checked":""}><span><strong>Auto-refresh current contact</strong><small>Generate a short cached AI read after CRM changes.</small></span></label>
      <label><input type="checkbox" id="hv3BackgroundLeads" ${prefs.backgroundNewLeads?"checked":""}><span><strong>Prepare new leads in background</strong><small>Up to ${prefs.maxAutoBriefsPerSession} per app session so Ollama is not hammered.</small></span></label>`;
    body.insertAdjacentElement("afterbegin",panel);
    $("#hv3AutoInsights",panel).addEventListener("change",e=>updateStore(s=>{s.prefs.autoInsights=e.target.checked;return s;}));
    $("#hv3BackgroundLeads",panel).addEventListener("change",e=>updateStore(s=>{s.prefs.backgroundNewLeads=e.target.checked;return s;}));
  }

  function improveStudioVisuals(){
    if(root()!=="studio")return;
    const page=$(".hh-studio-page",view());
    if(page)page.classList.add("hv3-studio");
  }

  function crmFingerprint(){
    const data=crm();
    return stableHash({
      contacts:(data.contacts||[]).map(c=>[c.id,c.updatedAt,c.stage,c.heat,c.followUp,c.lastCommunication,c.type,c.timeframe]),
      properties:(data.properties||[]).map(p=>[p.id,p.contactId,p.updatedAt,p.status,p.estimatedValue,p.motivation,p.condition]),
      communications:(data.communications||[]).map(m=>[m.id,m.contactId,m.date,m.unread,m.direction]),
      tasks:(data.tasks||[]).map(t=>[t.id,t.contactId,t.due,t.status])
    });
  }

  function detectCrmChanges(){
    const fp=crmFingerprint();
    if(!lastCrmFingerprint){
      lastCrmFingerprint=fp;
      lastContactSnapshots=Object.fromEntries((crm().contacts||[]).map(c=>[c.id,stableHash(contactSnapshot(c))]));
      return;
    }
    if(fp===lastCrmFingerprint)return;
    const current=(crm().contacts||[]);
    const nextMap={};
    const newIds=[];
    const changedIds=[];
    for(const c of current){
      const h=stableHash(contactSnapshot(c));
      nextMap[c.id]=h;
      if(!(c.id in lastContactSnapshots))newIds.push(c.id);
      else if(lastContactSnapshots[c.id]!==h)changedIds.push(c.id);
    }
    lastContactSnapshots=nextMap;
    lastCrmFingerprint=fp;

    const active=contactIdFromRoute();
    if(active && (newIds.includes(active)||changedIds.includes(active))){
      renderContact();
    }
    for(const id of newIds.slice(0,2))scheduleNewLead(id);
    if(active && changedIds.includes(active)){
      const c=contactById(active);
      if(c)scheduleAmbient(active,stableHash(contactSnapshot(c)),false);
    }
    if(root()==="today")renderToday();
  }

  function apply(){
    if(!E()||!view())return;
    patchToolPrompts();
    if(root()==="today")renderToday();
    if(root()==="contact")renderContact();
    improveStudioVisuals();
    renderSettingsEnhancement();
  }

  function scheduleApply(){
    clearTimeout(applyTimer);
    applyTimer=setTimeout(apply,90);
  }

  function start(){
    ensureDrawer();
    patchToolPrompts();
    scheduleApply();
    if(view() && !observer){
      observer=new MutationObserver(scheduleApply);
      observer.observe(view(),{childList:true,subtree:true});
    }
    if(!pollTimer){
      detectCrmChanges();
      pollTimer=setInterval(detectCrmChanges,1600);
    }
  }

  window.HoltonIntelligenceV3={VERSION,metricsFor,nextAction,queueRanked,renderContact,renderToday};

  window.addEventListener("hashchange",scheduleApply);
  window.addEventListener("load",start);
  document.addEventListener("DOMContentLoaded",start);
})();