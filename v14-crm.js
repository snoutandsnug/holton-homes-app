(() => {
"use strict";

/*
  Holton Homes OS v14.4 — Agent Operating System
  Research model:
  - FUB: stage + last personal communication drives daily Smart List workflow.
  - Lofty: High Priority / AI Prospecting / AI Monitoring and goal-based lead qualification.
  - Holton: seller-first business creation, local/content attribution, human relationship control.

  This layer is intentionally non-destructive:
  it reads the existing CRM state, surfaces work, launches existing app actions,
  and uses Pip for context/advice. It does not silently send outreach or mutate CRM records.
*/

const STORAGE_KEYS = ["holtonHomesOS_v13","holtonHomesOS_v14"];
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => Array.from(root.querySelectorAll(s));
const TODAY = () => new Date().toISOString().slice(0,10);

function dbNow() {
  for (const key of STORAGE_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.contacts)) return parsed;
      if (Array.isArray(parsed?.state?.contacts)) return parsed.state;
      if (Array.isArray(parsed?.db?.contacts)) return parsed.db;
    } catch {}
  }
  return {};
}

function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[ch]));
}

function routeName() {
  return (location.hash || "#/today").replace("#/","").split("/")[0] || "today";
}
function routeContactId() {
  const p=(location.hash||"").replace("#/","").split("/");
  return p[0]==="contact" ? decodeURIComponent(p[1]||"") : "";
}
function nameOf(c) {
  return [c?.firstName,c?.lastName].filter(Boolean).join(" ") || "Unnamed contact";
}
function isOpen(c) {
  return !!c && !["Closed","Lost"].includes(c.stage);
}
function hasPhone(c) {
  return !!String(c?.phone || "").replace(/\D/g,"");
}
function hasEmail(c) {
  return /\S+@\S+\.\S+/.test(String(c?.email || ""));
}
function dateMs(v) {
  if (!v) return 0;
  const d=new Date(v);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}
function daysAgo(v) {
  const ms=dateMs(v);
  return ms ? Math.max(0, Math.floor((Date.now()-ms)/86400000)) : 9999;
}
function hoursAgo(v) {
  const ms=dateMs(v);
  return ms ? Math.max(0,(Date.now()-ms)/3600000) : 999999;
}
function newestDate(...values) {
  const best=values.filter(Boolean).sort((a,b)=>dateMs(b)-dateMs(a))[0];
  return best || "";
}
function commsFor(db,c) {
  return (db.communications||[]).filter(m=>String(m.contactId)===String(c.id));
}
function personalCommsFor(db,c) {
  return commsFor(db,c).filter(m=>["Call","Text","Email"].includes(m.channel));
}
function lastPersonal(db,c) {
  const comm=personalCommsFor(db,c).sort((a,b)=>dateMs(b.date)-dateMs(a.date))[0]?.date;
  return newestDate(c.lastCommunication,comm);
}
function behaviorsFor(c) {
  return Array.isArray(c?.behaviors) ? c.behaviors : [];
}
function latestBehavior(c) {
  return behaviorsFor(c).slice().sort((a,b)=>dateMs(b.date)-dateMs(a.date))[0] || null;
}
function latestActivity(db,c) {
  const behavior=latestBehavior(c)?.date;
  const comm=commsFor(db,c).sort((a,b)=>dateMs(b.date)-dateMs(a.date))[0]?.date;
  return newestDate(behavior,comm,c.lastCommunication,c.updatedAt,c.createdAt);
}
function timeframeBucket(c) {
  const t=String(c?.timeframe||"");
  if (t.includes("0–3") || t.includes("0-3")) return "now";
  if (t.includes("3–6") || t.includes("3-6")) return "3-6";
  if (t.includes("6–12") || t.includes("6-12")) return "6-12";
  if (t.includes("12+")) return "long";
  return "unknown";
}
function activePlanFor(db,c) {
  return (db.planRuns||[]).find(r=>String(r.contactId)===String(c.id) && r.status==="Active");
}
function contactProperty(db,c) {
  return (db.properties||[]).find(p=>String(p.contactId)===String(c.id) && p.primary)
    || (db.properties||[]).find(p=>String(p.contactId)===String(c.id))
    || null;
}
function recentBehavior(c, days=7) {
  return behaviorsFor(c).filter(b=>daysAgo(b.date)<=days);
}
function highIntentBehavior(c) {
  const weights = {
    "Home Valuation":45,
    "Requested Showing":38,
    "Repeated Property View":28,
    "Saved Property":18,
    "Viewed Property":9,
    "Clicked Property Alert":12,
    "Opened Email":5,
    "Searched Website":10
  };
  return recentBehavior(c,14)
    .map(b=>({b,weight:weights[b.type]||4}))
    .sort((a,b)=>b.weight-a.weight)[0] || null;
}
function unreadInbound(db,c) {
  return commsFor(db,c).some(m=>m.unread && m.direction==="inbound");
}

function reasonSignals(db,c) {
  const reasons=[];
  const lp=lastPersonal(db,c);
  const age=daysAgo(lp);
  const high=highIntentBehavior(c);
  if (unreadInbound(db,c)) reasons.push("unread reply");
  if (c.followUp && c.followUp<TODAY()) reasons.push("follow-up overdue");
  else if (c.followUp===TODAY()) reasons.push("follow-up today");
  if (!c.followUp && ["Seller","Buyer"].includes(c.type) && isOpen(c)) reasons.push("no next step");
  if (!lp && ["Seller","Buyer"].includes(c.type)) reasons.push("never personally contacted");
  else if (age>=30 && age<9999) reasons.push(`${age}d since personal contact`);
  else if (age>=14 && age<9999) reasons.push(`${age}d since personal contact`);
  if (c.heat==="Hot") reasons.push("hot");
  if (timeframeBucket(c)==="now") reasons.push("0–3 month timing");
  if (high) reasons.push(high.b.type.toLowerCase());
  return reasons;
}

function leadPriority(db,c) {
  if (!isOpen(c)) return -999;
  let score=0;
  const lp=lastPersonal(db,c);
  const age=daysAgo(lp);
  const high=highIntentBehavior(c);

  if (unreadInbound(db,c)) score+=70;
  if (c.followUp && c.followUp<TODAY()) score+=42;
  else if (c.followUp===TODAY()) score+=34;
  if (!c.followUp && ["Seller","Buyer"].includes(c.type)) score+=18;
  if (!lp && ["Seller","Buyer"].includes(c.type)) score+=42;
  if (c.heat==="Hot") score+=28;
  else if (c.heat==="Warm") score+=12;
  if (timeframeBucket(c)==="now") score+=25;
  else if (timeframeBucket(c)==="3-6") score+=12;
  if (c.type==="Seller") score+=8;
  if (high) score+=high.weight;
  if (age>=30 && age<9999) score+=14;
  else if (age>=14 && age<9999) score+=8;

  return score;
}

function playbookGoal(db,c) {
  if (!hasPhone(c) && !hasEmail(c)) {
    return {id:1,label:"Capture contact",detail:"Get a usable phone or email before this record can be worked."};
  }

  const t=timeframeBucket(c);
  const buyerMissing=c.type==="Buyer" && !(c.buyerDetails?.areas || c.buyerDetails?.budget || c.buyerDetails?.desiredPayment);
  const sellerMissing=c.type==="Seller" && !(c.sellerDetails?.motivation || c.property || contactProperty(db,c));
  if (!c.type || c.type==="Unknown" || t==="unknown" || buyerMissing || sellerMissing) {
    return {id:2,label:"Clarify intent",detail:"Learn motivation, timing and the criteria that make the next action obvious."};
  }

  if (c.heat==="Hot" || t==="now" || highIntentBehavior(c) ||
      ["Valuation Requested","Valuation Delivered","Listing Appointment","Buyer Consultation"].includes(c.stage)) {
    return {id:3,label:"Win appointment",detail:"Move from digital activity/follow-up into a real conversation or appointment."};
  }

  return {id:4,label:"Grow trust",detail:"Stay useful and relevant until timing changes."};
}

function classifyLead(db,c,handoffIds) {
  if (handoffIds.has(String(c.id))) return "handoff";
  const active=daysAgo(latestActivity(db,c))<=30;
  if (active || c.heat==="Warm" || timeframeBucket(c)==="now" || timeframeBucket(c)==="3-6") return "prospecting";
  return "monitoring";
}

function humanHandoffContacts(db) {
  const contacts=(db.contacts||[]).filter(isOpen);
  return contacts.map(c=>{
    let score=leadPriority(db,c);
    const reasons=reasonSignals(db,c);
    const high=highIntentBehavior(c);
    const needs =
      unreadInbound(db,c) ||
      (c.followUp && c.followUp<=TODAY()) ||
      (c.heat==="Hot" && daysAgo(lastPersonal(db,c))>=3) ||
      (!lastPersonal(db,c) && ["Seller","Buyer"].includes(c.type)) ||
      (!!high && high.weight>=28 && daysAgo(lastPersonal(db,c))>=1);
    return {c,score,reasons,needs};
  }).filter(x=>x.needs).sort((a,b)=>b.score-a.score);
}

function sellerRadar(db) {
  const contacts=(db.contacts||[]).filter(c=>{
    const p=contactProperty(db,c);
    return c.type==="Seller" || (c.type==="Past Client" && !!p) ||
      behaviorsFor(c).some(b=>b.type==="Home Valuation") ||
      ["Valuation Requested","Valuation Delivered","Listing Appointment","Follow-Up","Active Listing"].includes(c.stage);
  });

  return contacts.map(c=>{
    let score=0;
    const why=[];
    const high=highIntentBehavior(c);
    const t=timeframeBucket(c);

    if (c.type==="Seller") {score+=18;why.push("seller relationship");}
    if (c.heat==="Hot") {score+=22;why.push("hot");}
    else if (c.heat==="Warm") {score+=10;why.push("warm");}
    if (t==="now") {score+=24;why.push("0–3 month timing");}
    else if (t==="3-6") {score+=12;why.push("3–6 month timing");}
    if (["Valuation Requested","Valuation Delivered"].includes(c.stage)) {score+=28;why.push(c.stage.toLowerCase());}
    if (c.stage==="Listing Appointment") {score+=35;why.push("listing appointment");}
    if (high?.b.type==="Home Valuation") {score+=45;why.push("recent valuation signal");}
    else if (high) {score+=Math.min(20,high.weight);why.push(high.b.type.toLowerCase());}
    if (c.followUp && c.followUp<=TODAY()) {score+=12;why.push("follow-up due");}

    const status=score>=60 ? "Handoff" : score>=32 ? "Warming" : "Nurture";
    return {c,score,status,why};
  }).sort((a,b)=>b.score-a.score);
}

function fubCadence(db) {
  const contacts=(db.contacts||[]).filter(isOpen);
  const stage=(c,names)=>names.includes(c.stage);
  const createdAge=c=>daysAgo(c.createdAt);
  const personalAge=c=>daysAgo(lastPersonal(db,c));
  const activityAge=c=>daysAgo(latestActivity(db,c));

  const lists=[
    {
      name:"Priority activity",
      cadence:"Daily",
      desc:"Recent high-intent activity that has not received a personal follow-up.",
      items:contacts.filter(c=>highIntentBehavior(c) && personalAge(c)>=1)
    },
    {
      name:"Qualify new leads",
      cadence:"Daily",
      desc:"Brand-new leads still needing a real conversation and a timeframe.",
      items:contacts.filter(c=>createdAge(c)<=10 && hoursAgo(lastPersonal(db,c))>=18 &&
        stage(c,["New","Attempted Contact","Contacted"]))
    },
    {
      name:"Revived prospects",
      cadence:"Daily",
      desc:"Older leads active again recently but not personally contacted in a week.",
      items:contacts.filter(c=>createdAge(c)>10 && activityAge(c)<=7 && personalAge(c)>=7 &&
        stage(c,["New","Attempted Contact","Contacted","Nurture"]))
    },
    {
      name:"Appointments / active clients",
      cadence:"Weekly",
      desc:"People already in motion who need a consistent client touch.",
      items:contacts.filter(c=>personalAge(c)>=6 &&
        stage(c,["Listing Appointment","Listing Agreement Signed","Coming Soon","Active Listing","Buyer Consultation","Pre-Approved","Touring Homes","Offer Submitted","Under Contract"]))
    },
    {
      name:"Nurture — now",
      cadence:"Weekly",
      desc:"0–3 month nurture leads should not disappear into a generic drip.",
      items:contacts.filter(c=>c.stage==="Nurture" && timeframeBucket(c)==="now" && personalAge(c)>=7)
    },
    {
      name:"Nurture — 3–12 months",
      cadence:"Monthly",
      desc:"Longer-timeline leads get a useful monthly human check-in.",
      items:contacts.filter(c=>c.stage==="Nurture" && ["3-6","6-12"].includes(timeframeBucket(c)) && personalAge(c)>=28)
    },
    {
      name:"Long nurture / unknown",
      cadence:"Monthly",
      desc:"Keep the relationship alive and periodically re-confirm timing.",
      items:contacts.filter(c=>c.stage==="Nurture" && ["long","unknown"].includes(timeframeBucket(c)) && personalAge(c)>=28)
    },
    {
      name:"Past clients / sphere",
      cadence:"Relationship",
      desc:"Protect referrals and repeat business with deliberate personal touches.",
      items:(db.contacts||[]).filter(c=>(c.type==="Past Client" || c.source==="Sphere") && daysAgo(lastPersonal(db,c))>=90)
    }
  ];
  return lists.map(x=>({...x,items:x.items.sort((a,b)=>leadPriority(db,b)-leadPriority(db,a))}));
}

function databaseHealth(db) {
  const open=(db.contacts||[]).filter(c=>isOpen(c) && ["Seller","Buyer"].includes(c.type));
  const activePlans=new Set((db.planRuns||[]).filter(r=>r.status==="Active").map(r=>String(r.contactId)));

  const checks=[
    {label:"Missing next step",items:open.filter(c=>!c.followUp),why:"No follow-up date means the CRM cannot protect the relationship."},
    {label:"No active nurture plan",items:open.filter(c=>!activePlans.has(String(c.id)) && ["New","Attempted Contact","Contacted","Nurture"].includes(c.stage)),why:"These leads depend entirely on memory unless a plan or deliberate cadence exists."},
    {label:"Timing unknown",items:open.filter(c=>timeframeBucket(c)==="unknown"),why:"Timeframe is one of the strongest inputs for deciding who deserves attention."},
    {label:"Never personally contacted",items:open.filter(c=>!lastPersonal(db,c)),why:"A lead is not being worked until a real personal touch happens."},
    {label:"Missing usable contact",items:open.filter(c=>!hasPhone(c)&&!hasEmail(c)),why:"These records cannot be converted without usable contact information."}
  ];
  return checks;
}

function sourcePerformance(db) {
  const map=new Map();
  for (const c of (db.contacts||[])) {
    const key=c.source||"Unknown";
    if (!map.has(key)) map.set(key,{source:key,contacts:0,open:0,closed:0,gci:0,appointments:0});
    const row=map.get(key);
    row.contacts++;
    if (isOpen(c)) row.open++;
    if (c.stage==="Closed" || c.type==="Past Client") row.closed++;
    row.gci+=Number(c.gci||0);
    row.appointments+=(db.tasks||[]).filter(t=>String(t.contactId)===String(c.id) && t.type==="Appointment").length;
  }
  return [...map.values()].sort((a,b)=>(b.gci-b.gci)||(b.closed-a.closed)||(b.contacts-a.contacts)).slice(0,8);
}

function directActions(c) {
  return `<div class="v144-row-actions">
    ${hasPhone(c)?`<button class="quick call" data-action="quick-launch" data-channel="Call" data-id="${esc(c.id)}" title="Call">☎</button>`:""}
    ${hasPhone(c)?`<button class="quick text" data-action="quick-launch" data-channel="Text" data-id="${esc(c.id)}" title="Text">✉</button>`:""}
    ${hasEmail(c)?`<button class="quick email" data-action="quick-launch" data-channel="Email" data-id="${esc(c.id)}" title="Email">@</button>`:""}
    <button class="quick script" data-action="show-script" data-id="${esc(c.id)}" title="Script">▤</button>
    <a class="v144-open" href="#/contact/${encodeURIComponent(c.id)}">Open</a>
  </div>`;
}

function contactRow(db,c,extra="") {
  const goal=playbookGoal(db,c);
  const reasons=reasonSignals(db,c).slice(0,3);
  return `<article class="v144-person-row">
    <div class="v144-person-main">
      <strong>${esc(nameOf(c))}</strong>
      <span>${esc(c.type||"Contact")} · ${esc(c.stage||"No stage")} · ${esc(c.heat||"No heat")}</span>
      <small>${esc(extra || reasons.join(" · ") || goal.detail)}</small>
    </div>
    <div class="v144-goal-chip"><b>Goal ${goal.id}</b><span>${esc(goal.label)}</span></div>
    ${directActions(c)}
  </article>`;
}

function leadInboxRows(db) {
  return (db.leadInbox||[]).filter(x=>!["Converted","Archived"].includes(x.status))
    .sort((a,b)=>dateMs(b.receivedAt)-dateMs(a.receivedAt))
    .slice(0,5)
    .map(item=>`<article class="v144-person-row v144-inquiry-row">
      <div class="v144-person-main">
        <strong>${esc([item.firstName,item.lastName].filter(Boolean).join(" ")||"Unnamed inquiry")}</strong>
        <span>${esc(item.source||"Unknown")} · ${esc(item.intent||"Unknown intent")} · ${Math.round(hoursAgo(item.receivedAt)*10)/10}h old</span>
        <small>${esc(item.message||item.property||item.area||"No inquiry detail")}</small>
      </div>
      <div class="v144-goal-chip"><b>NEW</b><span>${item.responseStartedAt?"Response started":"Needs response"}</span></div>
      <div class="v144-row-actions">
        <button class="v144-open" data-v144-open-inquiry="${esc(item.id)}">Open Inbox</button>
      </div>
    </article>`).join("");
}

function renderGrowth() {
  if (routeName()!=="growth") return;
  const view=$("#view");
  if (!view) return;
  if (view.dataset.v144Growth==="1") {
    highlightGrowthNav();
    return;
  }

  const db=dbNow();
  const handoffs=humanHandoffContacts(db);
  const handoffIds=new Set(handoffs.map(x=>String(x.c.id)));
  const open=(db.contacts||[]).filter(isOpen);
  const prospecting=open.filter(c=>classifyLead(db,c,handoffIds)==="prospecting")
    .sort((a,b)=>leadPriority(db,b)-leadPriority(db,a));
  const monitoring=open.filter(c=>classifyLead(db,c,handoffIds)==="monitoring")
    .sort((a,b)=>leadPriority(db,b)-leadPriority(db,a));
  const sellers=sellerRadar(db);
  const cadence=fubCadence(db);
  const health=databaseHealth(db);
  const sources=sourcePerformance(db);
  const openGci=open.reduce((n,c)=>n+Number(c.gci||0),0);
  const newInquiries=(db.leadInbox||[]).filter(x=>!["Converted","Archived"].includes(x.status)).length;
  const unread=(db.communications||[]).filter(m=>m.unread&&m.direction==="inbound").length;
  const todayTouches=(db.communications||[]).filter(m=>String(m.date||"").slice(0,10)===TODAY() && ["Call","Text","Email"].includes(m.channel)).length;
  const conversationTarget=Number(db.settings?.dailyConversationTarget||10);

  view.dataset.v144Growth="1";
  view.innerHTML=`
    <section class="v144-growth-page">
      <header class="v144-growth-head">
        <div>
          <span>HOLTON HOMES GROWTH OS</span>
          <h1>Run the business from one place.</h1>
          <p>Respond fast, work the right people, surface seller opportunities, and let long-term nurture stay out of your head.</p>
        </div>
        <div class="v144-growth-head-actions">
          <button class="ghost-btn" data-v144-ai="Build my real estate workday from the CRM. Put immediate replies and promises first, then active pipeline, then business creation. Give me a short ordered list I can execute.">Pip: build my day</button>
          <a class="primary-btn" href="#/call-queue">Start calls</a>
        </div>
      </header>

      <section class="v144-scoreboard">
        <div><span>Human handoffs</span><strong>${handoffs.length+newInquiries}</strong><small>Needs you, not automation</small></div>
        <div><span>Unread replies</span><strong>${unread}</strong><small>Conversation already open</small></div>
        <div><span>Touches today</span><strong>${todayTouches}<i> / ${conversationTarget}</i></strong><small>Calls, texts, emails logged</small></div>
        <div><span>Seller radar</span><strong>${sellers.filter(x=>x.status==="Handoff").length}</strong><small>Highest seller intent</small></div>
        <div><span>Open pipeline GCI</span><strong>$${Math.round(openGci).toLocaleString()}</strong><small>Projected, from CRM</small></div>
      </section>

      <nav class="v144-growth-tabs" aria-label="Growth OS sections">
        <button class="active" data-v144-tab="priority">Priority Leads</button>
        <button data-v144-tab="seller">Seller Radar</button>
        <button data-v144-tab="cadence">Call Cadence</button>
        <button data-v144-tab="health">Database Health</button>
        <button data-v144-tab="sources">Lead Sources</button>
      </nav>

      <div class="v144-growth-body">
        <section class="v144-tab-panel active" data-v144-panel="priority">
          <div class="v144-section-head">
            <div><span>HUMAN HANDOFF</span><h2>These people need you now</h2><p>Pip can prepare you, but these are relationship moments that should not disappear into nurture.</p></div>
            <button class="ghost-btn compact" data-v144-ai="Review my high priority leads and tell me who I should personally contact first. For each, explain why now and the first question I should ask.">Prioritize with Pip</button>
          </div>
          <div class="v144-list">
            ${leadInboxRows(db)}
            ${handoffs.slice(0,8).map(x=>contactRow(db,x.c,x.reasons.slice(0,3).join(" · "))).join("")}
            ${!newInquiries&&!handoffs.length?`<div class="v144-empty">Human handoff is clear. Move to prospecting.</div>`:""}
          </div>

          <div class="v144-three-column">
            <section>
              <header><span>HIGH PRIORITY</span><b>${handoffs.length}</b></header>
              <p>Replies, overdue commitments, hot stale leads, and high-intent activity.</p>
              ${handoffs.slice(0,4).map(x=>`<a href="#/contact/${encodeURIComponent(x.c.id)}"><strong>${esc(nameOf(x.c))}</strong><small>${esc(x.reasons.slice(0,2).join(" · "))}</small></a>`).join("")||`<em>Clear</em>`}
            </section>
            <section>
              <header><span>PROSPECTING</span><b>${prospecting.length}</b></header>
              <p>Active or warming relationships worth working after urgent handoffs.</p>
              ${prospecting.slice(0,4).map(c=>`<a href="#/contact/${encodeURIComponent(c.id)}"><strong>${esc(nameOf(c))}</strong><small>${esc(playbookGoal(db,c).label)} · priority ${leadPriority(db,c)}</small></a>`).join("")||`<em>Nothing queued</em>`}
            </section>
            <section>
              <header><span>MONITORING</span><b>${monitoring.length}</b></header>
              <p>Longer-term contacts that should stay nurtured without stealing today.</p>
              ${monitoring.slice(0,4).map(c=>`<a href="#/contact/${encodeURIComponent(c.id)}"><strong>${esc(nameOf(c))}</strong><small>${esc(playbookGoal(db,c).label)} · ${daysAgo(latestActivity(db,c))}d activity age</small></a>`).join("")||`<em>Nothing queued</em>`}
            </section>
          </div>
        </section>

        <section class="v144-tab-panel" data-v144-panel="seller">
          <div class="v144-section-head">
            <div><span>SELLER RADAR</span><h2>Mine the database for the next listing</h2><p>Uses only CRM intent, timing, stage, follow-up and recorded behavior. It does not target protected classes or invent property facts.</p></div>
            <button class="ghost-btn compact" data-v144-ai="Act as my seller opportunity analyst. Review homeowners and seller contacts in the CRM. Identify the best listing conversations using only recorded intent, timing, behavior and relationship history. Give me the top five with a call angle.">Ask Pip</button>
          </div>
          <div class="v144-seller-summary">
            ${["Handoff","Warming","Nurture"].map(status=>`<div><b>${sellers.filter(x=>x.status===status).length}</b><span>${status}</span></div>`).join("")}
          </div>
          <div class="v144-list">
            ${sellers.slice(0,12).map(x=>contactRow(db,x.c,`${x.status} · ${x.why.slice(0,3).join(" · ")}`)).join("")||`<div class="v144-empty">Add seller/homeowner relationships and recorded intent signals to build the radar.</div>`}
          </div>
        </section>

        <section class="v144-tab-panel" data-v144-panel="cadence">
          <div class="v144-section-head">
            <div><span>CALL CADENCE</span><h2>Your “who do I call?” system</h2><p>Modeled on current FUB best-practice cadence: urgent and active relationships get worked frequently; longer nurture gets deliberate but less intrusive touches.</p></div>
            <a class="primary-btn compact" href="#/call-queue">Open call queue</a>
          </div>
          <div class="v144-cadence-grid">
            ${cadence.map(list=>`<article>
              <header><span>${esc(list.cadence)}</span><b>${list.items.length}</b></header>
              <h3>${esc(list.name)}</h3>
              <p>${esc(list.desc)}</p>
              <div>${list.items.slice(0,4).map(c=>`<a href="#/contact/${encodeURIComponent(c.id)}">${esc(nameOf(c))}<small>${esc(reasonSignals(db,c).slice(0,2).join(" · ")||playbookGoal(db,c).label)}</small></a>`).join("")||`<em>Clear</em>`}</div>
            </article>`).join("")}
          </div>
        </section>

        <section class="v144-tab-panel" data-v144-panel="health">
          <div class="v144-section-head">
            <div><span>DATABASE HEALTH</span><h2>Fix the holes that kill follow-up</h2><p>A smarter CRM is useless if it does not know timing, next step, contactability, and whether someone is actually being nurtured.</p></div>
            <button class="ghost-btn compact" data-v144-ai="Audit my CRM database for conversion risk. Focus on missing next steps, missing timing, lack of personal contact, and nurture coverage. Give me the highest-value cleanup actions first.">AI health check</button>
          </div>
          <div class="v144-health-grid">
            ${health.map(check=>`<article>
              <div><b>${check.items.length}</b><span>${esc(check.label)}</span></div>
              <p>${esc(check.why)}</p>
              ${check.items.slice(0,5).map(c=>`<a href="#/contact/${encodeURIComponent(c.id)}">${esc(nameOf(c))}</a>`).join("")}
            </article>`).join("")}
          </div>
          <section class="v144-plan-audit">
            <div>
              <span>SMART PLAN COVERAGE</span>
              <h3>Automation should create consistency, not robotic relationships.</h3>
              <p>Best next plans for this CRM: New Lead 10-Day, Seller Valuation, Future Seller, Buyer Nurture, Open House, Past Client, and Post-Close Referral.</p>
            </div>
            <button class="primary-btn compact" data-v144-ai="Design the Smart Plan coverage my CRM should have. Use these buckets: new lead 10-day, seller valuation, future seller, buyer nurture, open house, past client, and post-close referral. For each, give triggers, human tasks, draft messages, pause conditions, and the goal stage. Keep outbound AI drafts subject to human approval.">Build plan coverage</button>
          </section>
        </section>

        <section class="v144-tab-panel" data-v144-panel="sources">
          <div class="v144-section-head">
            <div><span>LEAD ENGINE</span><h2>Know what actually creates business</h2><p>Track source → relationship → appointment → pipeline → GCI so content and community work can earn its place.</p></div>
            <button class="ghost-btn compact" data-v144-ai="Analyze my lead sources. Tell me which sources deserve more effort, which need better conversion follow-up, and what business-generating content or outreach I should do next. Do not invent performance that is not in the CRM.">Analyze sources</button>
          </div>
          <div class="v144-source-table">
            <header><span>Source</span><span>Contacts</span><span>Open</span><span>Appts</span><span>Closed/Past</span><span>Projected GCI</span></header>
            ${sources.map(s=>`<div><strong>${esc(s.source)}</strong><span>${s.contacts}</span><span>${s.open}</span><span>${s.appointments}</span><span>${s.closed}</span><span>$${Math.round(s.gci).toLocaleString()}</span></div>`).join("")||`<div class="v144-empty">No source data yet.</div>`}
          </div>
          <section class="v144-lead-engine">
            <article><span>CAPTURE</span><h3>Website / open house / referral / content</h3><p>Every inquiry should arrive with source, campaign, intent and response timer.</p></article>
            <article><span>QUALIFY</span><h3>Motivation + timing + criteria</h3><p>The CRM should know enough to decide whether you or nurture acts next.</p></article>
            <article><span>APPOINTMENT</span><h3>AI prepares; you take over</h3><p>High-intent behavior becomes a call task, context brief and appointment ask.</p></article>
            <article><span>ATTRIBUTION</span><h3>Closing flows back to source</h3><p>Stop guessing whether YouTube, local content, sphere or open houses are creating clients.</p></article>
          </section>
        </section>
      </div>
    </section>`;
  highlightGrowthNav();
}

function highlightGrowthNav() {
  const active=routeName()==="growth";
  $$(".v144-growth-nav").forEach(a=>a.classList.toggle("active",active));
}

function enhanceToday() {
  if (routeName()!=="today") return;
  const view=$("#view");
  if (!view || $(".v144-today-flow",view)) return;
  const header=$(".v13-today-header",view);
  if (!header) return;
  const db=dbNow();
  const handoffs=humanHandoffContacts(db).length;
  const newInquiries=(db.leadInbox||[]).filter(x=>!["Converted","Archived"].includes(x.status)).length;
  const sellers=sellerRadar(db).filter(x=>x.status==="Handoff").length;
  header.insertAdjacentHTML("afterend",`
    <section class="v144-today-flow">
      <div><span>RUN THE BUSINESS</span><strong>${handoffs+newInquiries} human handoffs · ${sellers} seller signals</strong><small>Clear conversations first, then prospect, then protect active clients.</small></div>
      <div>
        <a class="primary-btn compact" href="#/growth">Open Growth OS</a>
        <a class="ghost-btn compact" href="#/call-queue">Start calls</a>
      </div>
    </section>`);
}

function enhancePeople() {
  if (routeName()!=="people") return;
  const view=$("#view");
  if (!view || $(".v144-people-strip",view)) return;
  const db=dbNow();
  const open=(db.contacts||[]).filter(isOpen);
  const due=open.filter(c=>c.followUp&&c.followUp<=TODAY()).length;
  const priority=open.filter(c=>highIntentBehavior(c)&&daysAgo(lastPersonal(db,c))>=1).length;
  const missing=open.filter(c=>["Seller","Buyer"].includes(c.type)&&!c.followUp).length;
  const target=$(".fub-database-header",view)||$(".page-head",view);
  if (!target) return;
  target.insertAdjacentHTML("afterend",`
    <section class="v144-today-flow v144-people-strip">
      <div><span>WHO TO CALL</span><strong>${priority} activity priority · ${due} due · ${missing} missing next step</strong><small>Stage + last personal communication + behavior should drive the list, not memory.</small></div>
      <div><a class="primary-btn compact" href="#/growth">Priority Leads</a><a class="ghost-btn compact" href="#/call-queue">Call sprint</a></div>
    </section>`);
}

function enhancePipeline() {
  if (routeName()!=="pipeline") return;
  const view=$("#view");
  if (!view) return;
  const db=dbNow();

  $$(".deal-card",view).forEach(card=>{
    if ($(".v144-card-intel",card)) return;
    const c=(db.contacts||[]).find(x=>String(x.id)===String(card.dataset.contact));
    if (!c) return;
    const goal=playbookGoal(db,c);
    const reasons=reasonSignals(db,c).slice(0,2);
    const html=`<div class="v144-card-intel">
      <span>${esc(goal.label)}</span>
      <small>${esc(reasons.join(" · ") || (c.followUp?`Next ${c.followUp}`:"Next step missing"))}</small>
      <div>${directActions(c)}</div>
    </div>`;
    const meta=$(".deal-meta",card);
    if (meta) meta.insertAdjacentHTML("beforebegin",html);
    else card.insertAdjacentHTML("beforeend",html);
  });
}

function enhanceContact() {
  if (routeName()!=="contact") return;
  const view=$("#view");
  if (!view) return;
  const db=dbNow();
  const c=(db.contacts||[]).find(x=>String(x.id)===String(routeContactId()));
  if (!c) return;
  const actions=$(".contact-hero .hero-actions",view);
  if (actions && !$(".v144-pip-brief",actions)) {
    const b=document.createElement("button");
    b.className="ghost-btn compact v144-pip-brief";
    b.dataset.v144Ai=`Brief me before I contact ${nameOf(c)}. Use only CRM data. Give me: what I should remember, why now, three questions to ask, likely objection or uncertainty, and the single best next step.`;
    b.textContent="Pip brief";
    actions.appendChild(b);
  }
  const next=$(".pro-next-work",view);
  if (next && !$(".v144-playbook-goal",next)) {
    const g=playbookGoal(db,c);
    next.insertAdjacentHTML("beforeend",`<aside class="v144-playbook-goal"><b>PLAYBOOK GOAL ${g.id}</b><strong>${esc(g.label)}</strong><span>${esc(g.detail)}</span></aside>`);
  }
}

function enhanceInbox() {
  if (routeName()!=="inbox") return;
  const view=$("#view");
  const preview=$(".v13-lead-preview",view);
  if (!preview || $(".v144-inbox-ai",preview)) return;
  const db=dbNow();
  const active=$(".v13-lead-card.active",view);
  const item=(db.leadInbox||[]).find(x=>String(x.id)===String(active?.dataset.id));
  if (!item) return;
  const target=$(".v13-lead-note",preview);
  if (!target) return;
  const name=[item.firstName,item.lastName].filter(Boolean).join(" ")||"this lead";
  target.insertAdjacentHTML("afterend",`
    <section class="v144-inbox-ai">
      <div><span>QUALIFY, DON'T JUST CLASSIFY</span><strong>Goal: ${!item.phone&&!item.email?"capture contact":item.intent==="Unknown"||!item.timeframe||item.timeframe==="Unknown"?"clarify intent":"win the next conversation"}</strong></div>
      <button class="ghost-btn compact" data-v144-ai="Prepare me to respond to ${esc(name)} using this CRM inquiry. Tell me what we know, what we still need to learn, the best first question, and draft a short natural response. Do not claim anything was sent.">Pip response brief</button>
    </section>`);
}

function openPip(prompt) {
  const open=$('[data-action="open-pip"]');
  if (open) open.click();
  setTimeout(()=>{
    const input=$("#pipAskInput");
    if (!input) return;
    input.value=prompt;
    $('[data-action="ask-pip"]')?.click();
  },100);
}

function activateGrowthTab(id) {
  $$(".v144-growth-tabs button").forEach(b=>b.classList.toggle("active",b.dataset.v144Tab===id));
  $$(".v144-tab-panel").forEach(p=>p.classList.toggle("active",p.dataset.v144Panel===id));
}

function run() {
  if (routeName()==="growth") renderGrowth();
  else highlightGrowthNav();
  enhanceToday();
  enhancePeople();
  enhancePipeline();
  enhanceContact();
  enhanceInbox();
}

document.addEventListener("click",event=>{
  const ai=event.target.closest("[data-v144-ai]");
  if (ai) {
    event.preventDefault();
    event.stopImmediatePropagation();
    openPip(ai.dataset.v144Ai||"What should I do next?");
    return;
  }

  const tab=event.target.closest("[data-v144-tab]");
  if (tab) {
    event.preventDefault();
    activateGrowthTab(tab.dataset.v144Tab);
    return;
  }

  const inquiry=event.target.closest("[data-v144-open-inquiry]");
  if (inquiry) {
    event.preventDefault();
    const id=inquiry.dataset.v144OpenInquiry;
    const proxy=document.createElement("button");
    proxy.dataset.action="select-lead-intake";
    proxy.dataset.id=id;
    proxy.style.display="none";
    document.body.appendChild(proxy);
    proxy.click();
    proxy.remove();
    setTimeout(()=>{ location.hash="#/inbox"; },20);
  }
},true);

window.addEventListener("hashchange",()=>setTimeout(run,70));
window.addEventListener("load",()=>setTimeout(run,180));

const view=$("#view");
if (view) {
  new MutationObserver(()=>setTimeout(run,30)).observe(view,{childList:true,subtree:false});
}
setTimeout(run,120);
})();