(() => {
"use strict";

/* Holton Homes OS v14.5 — Pip Coach
   Core CRM coaching runs locally for $0.
   ChatGPT is an optional clipboard handoff for deeper/open-ended reasoning.
*/

const STORAGE_KEYS = ["holtonHomesOS_v13","holtonHomesOS_v14"];
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => Array.from(root.querySelectorAll(s));
const TODAY = () => new Date().toISOString().slice(0,10);

const PIP_ART = {
  default:"./pip-default.webp",
  thinking:"./pip-thinking.webp",
  celebrate:"./pip-celebrate.webp",
  work:"./pip-work.webp",
  concerned:"./pip-concerned.webp"
};
let pipMoodTimer = null;

function parseDb() {
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
function esc(v){return String(v??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[ch]))}
function fullName(c){return [c?.firstName,c?.lastName].filter(Boolean).join(" ")||"Unnamed contact"}
function routeName(){return (location.hash||"#/today").replace("#/","").split("/")[0]||"today"}
function dayDiff(v){
  if(!v)return 9999;
  const d=new Date(v);
  return Number.isNaN(d.getTime())?9999:Math.max(0,Math.floor((Date.now()-d.getTime())/86400000));
}
function isOpen(c){return c&&!["Closed","Lost"].includes(c.stage)}
function hasPhone(c){return !!String(c?.phone||"").replace(/\D/g,"")}
function hasEmail(c){return /\S+@\S+\.\S+/.test(String(c?.email||""))}
function latestComm(db,c){
  const comm=(db.communications||[]).filter(m=>String(m.contactId)===String(c.id)).sort((a,b)=>String(b.date||"").localeCompare(String(a.date||"")))[0];
  return comm?.date||c.lastCommunication||"";
}
function recentBehavior(c,days=14){
  return (c.behaviors||[]).filter(b=>dayDiff(b.date)<=days);
}
function topBehavior(c){
  const weight={"Home Valuation":45,"Requested Showing":38,"Repeated Property View":28,"Saved Property":18,"Clicked Property Alert":12,"Searched Website":10,"Viewed Property":8,"Opened Email":4};
  return recentBehavior(c).map(b=>({b,w:weight[b.type]||3})).sort((a,b)=>b.w-a.w)[0]||null;
}
function businessScore(c,db){
  if(!isOpen(c))return {score:-1,why:[]};
  let score=0,why=[];
  const today=TODAY(), stale=dayDiff(latestComm(db,c)), behavior=topBehavior(c);
  if(c.type==="Seller"){score+=22;why.push("seller opportunity")}
  if(c.heat==="Hot"){score+=25;why.push("hot")}
  else if(c.heat==="Warm"){score+=12;why.push("warm")}
  const tf=String(c.timeframe||"");
  if(tf.includes("0–3")||tf.includes("0-3")){score+=22;why.push("0–3 month timing")}
  else if(tf.includes("3–6")||tf.includes("3-6")){score+=12;why.push("3–6 month timing")}
  if(c.followUp&&c.followUp<=today){score+=24;why.push(c.followUp<today?"follow-up overdue":"follow-up due")}
  if(!c.followUp&&["Seller","Buyer"].includes(c.type)){score+=8;why.push("missing next step")}
  if(stale>=30&&stale<9999){score+=16;why.push(`${stale}d since contact`)}
  else if(stale>=14&&stale<9999){score+=10;why.push(`${stale}d since contact`)}
  if(["Valuation Requested","Valuation Delivered","Listing Appointment","Follow-Up"].includes(c.stage)){score+=20;why.push(c.stage.toLowerCase())}
  if(c.source==="Referral"||c.source==="Sphere"||c.type==="Past Client"){score+=7;why.push("relationship business")}
  if(behavior){score+=behavior.w;why.push(behavior.b.type.toLowerCase())}
  return {score,why};
}
function topBusiness(db,n=6){
  return (db.contacts||[]).map(c=>({c,...businessScore(c,db)})).filter(x=>x.score>=0).sort((a,b)=>b.score-a.score).slice(0,n);
}
function openLeads(db){
  return (db.leadInbox||[]).filter(x=>!["Converted","Archived"].includes(x.status)).sort((a,b)=>String(b.receivedAt||"").localeCompare(String(a.receivedAt||"")));
}
function unreadReplies(db){
  const ids=new Set((db.communications||[]).filter(m=>m.unread&&m.direction==="inbound").map(m=>String(m.contactId)));
  return (db.contacts||[]).filter(c=>ids.has(String(c.id)));
}
function dueTasks(db){
  return (db.tasks||[]).filter(t=>t.status!=="Done"&&t.due&&t.due<=TODAY()).sort((a,b)=>String(a.due).localeCompare(String(b.due)));
}
function pipelineRisks(db){
  return (db.contacts||[]).filter(c=>isOpen(c)&&["Seller","Buyer"].includes(c.type)).map(c=>{
    let risk=0,why=[];
    const stale=dayDiff(latestComm(db,c));
    if(c.followUp&&c.followUp<TODAY()){risk+=6;why.push("follow-up overdue")}
    if(!c.followUp){risk+=4;why.push("no next step")}
    if(stale>=30&&stale<9999){risk+=5;why.push(`${stale}d stale`)}
    else if(stale>=14&&stale<9999){risk+=3;why.push(`${stale}d stale`)}
    if(!latestComm(db,c)){risk+=5;why.push("never contacted")}
    if(c.heat==="Hot"){risk+=3;why.push("hot")}
    return {c,risk,why};
  }).filter(x=>x.risk>0).sort((a,b)=>b.risk-a.risk).slice(0,8);
}
function sellerRadar(db){
  return (db.contacts||[]).filter(c=>isOpen(c)&&(c.type==="Seller"||(c.behaviors||[]).some(b=>b.type==="Home Valuation"))).map(c=>{
    let score=businessScore(c,db).score,why=businessScore(c,db).why;
    if((c.behaviors||[]).some(b=>b.type==="Home Valuation"&&dayDiff(b.date)<=14)){score+=25;why=[...why,"recent valuation signal"]}
    return {c,score,why};
  }).sort((a,b)=>b.score-a.score).slice(0,8);
}

function contactAction(c){
  if(hasPhone(c))return "Call";
  if(hasEmail(c))return "Email";
  return "Open record";
}
function formatList(items){
  return items.map((x,i)=>`${i+1}. ${fullName(x.c)} — ${x.why.slice(0,3).join(" · ") || "relationship worth reviewing"}\n   Next: ${contactAction(x.c)} and set the next follow-up.`).join("\n\n");
}

function localBusiness(db){
  const list=topBusiness(db);
  if(!list.length)return "No active contacts are ready to score yet. Add leads, timing, heat, follow-up dates, and communication history and Pip will start surfacing business automatically.";
  return `FIND BUSINESS — ${list.length} best conversations right now\n\n${formatList(list)}\n\n30-minute block: work these in order. Log the result and give every open opportunity a next date before moving on.`;
}
function localDay(db){
  const leads=openLeads(db), replies=unreadReplies(db), tasks=dueTasks(db), business=topBusiness(db,4);
  const lines=[];
  if(leads.length)lines.push(`1. NEW LEADS — respond to ${leads.length}. Start with ${[leads[0].firstName,leads[0].lastName].filter(Boolean).join(" ")||"the newest inquiry"}.`);
  if(replies.length)lines.push(`${lines.length+1}. REPLIES — ${replies.length} inbound conversation${replies.length===1?"":"s"} waiting.`);
  if(tasks.length)lines.push(`${lines.length+1}. PROMISES — ${tasks.length} task${tasks.length===1?"":"s"} due/overdue. Oldest: ${tasks[0].title}.`);
  if(business.length)lines.push(`${lines.length+1}. CREATE BUSINESS — call ${business.slice(0,3).map(x=>fullName(x.c)).join(", ")}.`);
  if(!lines.length)lines.push("1. Your urgent queue is clear. Use the next 30 minutes for seller/sphere prospecting.");
  return `BUILD MY DAY\n\n${lines.join("\n")}\n\nRule: replies and promises first, active clients second, prospecting third, admin last.`;
}
function localPipeline(db){
  const risks=pipelineRisks(db);
  if(!risks.length)return "PIPELINE CHECK\n\nNo obvious hygiene risks are showing in the CRM right now. Keep every active buyer/seller attached to a next follow-up date.";
  return `PIPELINE CHECK — ${risks.length} relationships need attention\n\n${risks.map((x,i)=>`${i+1}. ${fullName(x.c)} — ${x.c.type} · ${x.c.stage}\n   Risk: ${x.why.slice(0,3).join(" · ")}\n   Next: ${contactAction(x.c)} and create a dated next step.`).join("\n\n")}`;
}
function localSeller(db){
  const sellers=sellerRadar(db);
  if(!sellers.length)return "SELLER RADAR\n\nNo seller signals are strong enough yet. Add seller contacts, home-valuation activity, timing, heat, and follow-up dates and Pip will rank them.";
  return `SELLER RADAR — best listing conversations\n\n${sellers.map((x,i)=>`${i+1}. ${fullName(x.c)} — ${x.why.slice(0,3).join(" · ")}\n   Goal: learn what would have to happen for a move to become real.`).join("\n\n")}`;
}
function localHealth(db){
  const open=(db.contacts||[]).filter(c=>isOpen(c)&&["Seller","Buyer"].includes(c.type));
  const noNext=open.filter(c=>!c.followUp), unknown=open.filter(c=>!c.timeframe||c.timeframe==="Unknown"), never=open.filter(c=>!latestComm(db,c));
  return `DATABASE HEALTH\n\n• ${noNext.length} open leads have no next follow-up.\n• ${unknown.length} have unknown timing.\n• ${never.length} have no personal communication logged.\n\nFix order: hot/warm leads first → near-term timing → everyone else. Every active lead should leave your hands with a dated next step.`;
}
function localSources(db){
  const map=new Map();
  (db.contacts||[]).forEach(c=>{
    const s=c.source||"Unknown"; const r=map.get(s)||{n:0,gci:0,closed:0};
    r.n++; r.gci+=Number(c.gci||0); if(c.stage==="Closed"||c.type==="Past Client")r.closed++; map.set(s,r);
  });
  const rows=[...map.entries()].sort((a,b)=>(b[1].gci-a[1].gci)||(b[1].n-a[1].n)).slice(0,6);
  if(!rows.length)return "LEAD SOURCES\n\nNo source data yet.";
  return `LEAD SOURCES\n\n${rows.map(([s,r],i)=>`${i+1}. ${s} — ${r.n} contacts · ${r.closed} closed/past · $${Math.round(r.gci).toLocaleString()} projected GCI`).join("\n")}\n\nKeep investing where conversations and appointments actually appear—not just where views appear.`;
}
function localContent(db){
  const markets=db.settings?.coreMarkets||"Greater Cincinnati";
  const sources=[...new Set((db.contacts||[]).map(c=>c.source).filter(Boolean))].slice(0,4).join(", ");
  return `CONTENT THAT CAN CREATE LEADS\n\n1. SELLER: “What would actually make me tell a ${markets} homeowner to wait instead of sell?”\n   CTA: Ask for a real value/timing conversation.\n\n2. BUYER: “What a monthly payment really buys around ${markets} right now.”\n   CTA: Send your payment comfort + area.\n\n3. LOCAL: Turn one useful local change into “what this means if you live here.”\n   CTA: Join/follow the local conversation, not a hard sell.\n\nCurrent CRM sources include: ${sources||"none recorded yet"}.\n\nFor hooks/scripts, use Ask ChatGPT below.`;
}
function findContactByPrompt(db,prompt){
  const low=String(prompt||"").toLowerCase();
  return (db.contacts||[]).find(c=>low.includes(fullName(c).toLowerCase()));
}
function localContactBrief(db,c){
  if(!c)return null;
  const score=businessScore(c,db);
  const comm=latestComm(db,c);
  const next=c.followUp||"missing";
  const behavior=topBehavior(c)?.b;
  return `CONTACT BRIEF — ${fullName(c)}\n\nRemember:\n• ${c.type||"Contact"} · ${c.stage||"No stage"} · ${c.heat||"No heat"}\n• Timing: ${c.timeframe||"Unknown"} · Source: ${c.source||"Unknown"}\n• Last communication: ${comm?`${dayDiff(comm)} days ago`:"none logged"} · Next follow-up: ${next}\n${behavior?`• Recent intent signal: ${behavior.type}${behavior.property?` — ${behavior.property}`:""}`:""}\n\nWhy now: ${score.why.slice(0,3).join(" · ")||"relationship review"}.\n\nQuestions:\n1. What has changed since we last talked?\n2. What would need to happen for the move to become real?\n3. What is the biggest thing still unclear or holding the decision back?\n\nBest next step: have the conversation, log what changed, and leave the CRM with a specific next date.`;
}
function inferMode(prompt){
  const p=String(prompt||"").toLowerCase();
  if(p.includes("seller")||p.includes("listing conversation")||p.includes("homeowner"))return "seller";
  if(p.includes("pipeline")||p.includes("stall")||p.includes("risk"))return "pipeline";
  if(p.includes("database")||p.includes("cleanup")||p.includes("health"))return "health";
  if(p.includes("lead source")||p.includes("sources")||p.includes("attribution"))return "sources";
  if(p.includes("content")||p.includes("video")||p.includes("post"))return "content";
  if(p.includes("day")||p.includes("what should i do next"))return "day";
  if(p.includes("priority")||p.includes("contact first")||p.includes("find business")||p.includes("people to call"))return "business";
  return "freeform";
}

function setPipMood(mood="default",ms=0){
  if(!PIP_ART[mood])mood="default";
  if(pipMoodTimer){clearTimeout(pipMoodTimer);pipMoodTimer=null}
  const img=$("#pipMascotImage");
  if(img){img.src=PIP_ART[mood];img.dataset.mood=mood}
  const mini=$(".pip-mini");
  if(mini){mini.style.backgroundImage=`url("${PIP_ART[mood]}")`;mini.dataset.mood=mood}
  const coach=$("#pipCoachArt");
  if(coach){coach.src=PIP_ART[mood];coach.dataset.mood=mood}
  const stage=$("#pipStageArt");
  if(stage){stage.src=PIP_ART[mood];stage.dataset.mood=mood}
  if(ms>0)pipMoodTimer=setTimeout(()=>setPipMood(contextMood()),ms);
}
function contextMood(){
  const db=parseDb();
  if(dueTasks(db).length || (db.contacts||[]).some(c=>c.followUp&&c.followUp<TODAY()&&isOpen(c)))return "concerned";
  if(["growth","focus","call-queue","pipeline"].includes(routeName()))return "work";
  return "default";
}
function installPipArt(){
  const holder=$(".pip-avatar-large");
  if(holder && !$("#pipMascotImage",holder)){
    holder.innerHTML=`<img id="pipMascotImage" src="${PIP_ART.default}" alt="Pip the coach">`;
  }
  const title=$(".v146-pip-title");
  if(title){
    const small=title.querySelector("small");
    if(small)small.textContent="Your CRM brain for what deserves attention next.";
  }
  const mini=$(".pip-mini");
  if(mini)mini.style.backgroundImage=`url("${PIP_ART.default}")`;
  const stage=$("#pipStageArt");
  if(stage && !stage.src)stage.src=PIP_ART.default;
  setPipMood(contextMood());
}
function setAnswer(text,mood="thinking",prompt=""){
  const answer=$("#pipAnswer");
  if(answer){
    answer.classList.remove("v14-ai-loading");
    answer.classList.add("v14-ai-answer","v145-local-answer","v146-answer-open");
    answer.innerHTML=`
      <div class="v146-answer-head">
        <span>PIP'S READ</span>
        <strong>${mood==="concerned"?"Something needs attention":mood==="work"?"Here’s the move":mood==="celebrate"?"Nice. Keep going.":"Here’s what I see"}</strong>
      </div>
      <div class="v145-answer-copy">${esc(text).replace(/\n/g,"<br>")}</div>
      <div class="v145-chatgpt-row">
        <button class="ghost-btn compact" data-v145-copy-chatgpt data-prompt="${esc(prompt)}">Copy for ChatGPT</button>
        <button class="ghost-btn compact" data-v145-open-chatgpt>Open ChatGPT</button>
      </div>`;
  }
  setPipMood(mood);
}
function runLocal(mode="freeform",prompt=""){
  const db=parseDb();
  let text="", mood="thinking";
  if(mode==="freeform"){
    const contact=findContactByPrompt(db,prompt);
    if(contact){text=localContactBrief(db,contact);mood="work"}
    else {
      const inferred=inferMode(prompt);
      if(inferred!=="freeform")return runLocal(inferred,prompt);
      text=`PIP LOCAL\n\nI can run CRM operations for free: Find Business, Build My Day, Seller Radar, Pipeline Check, Database Health, and Lead Sources.\n\nFor an open-ended question like “${prompt||"help me think this through"},” use Copy for ChatGPT. I’ll package the useful CRM context so you can ask ChatGPT without paying for an API.`;
      mood="thinking";
    }
  } else if(mode==="business"){text=localBusiness(db);mood="work"}
  else if(mode==="day"){text=localDay(db);mood="work"}
  else if(mode==="pipeline"){text=localPipeline(db);mood=pipelineRisks(db).length?"concerned":"work"}
  else if(mode==="content"){text=localContent(db);mood="thinking"}
  else if(mode==="seller"){text=localSeller(db);mood="thinking"}
  else if(mode==="health"){text=localHealth(db);mood="concerned"}
  else if(mode==="sources"){text=localSources(db);mood="thinking"}
  setAnswer(text,mood,prompt||mode);
  return {text,mode,local:true};
}
function openPipThen(mode,prompt=""){
  $('[data-action="open-pip"]')?.click();
  setTimeout(()=>runLocal(mode,prompt),80);
}
function contextPacket(prompt=""){
  const db=parseDb();
  const contact=findContactByPrompt(db,prompt);
  const pack={
    request:prompt||"Help me think through the best next action.",
    date:new Date().toISOString(),
    selectedContact:contact?{
      name:fullName(contact),type:contact.type,stage:contact.stage,heat:contact.heat,timeframe:contact.timeframe,
      source:contact.source,property:contact.property,followUp:contact.followUp,lastCommunication:contact.lastCommunication,
      notes:String(contact.notes||"").slice(0,1200),behaviors:(contact.behaviors||[]).slice(-6)
    }:undefined,
    priorityContacts:topBusiness(db,8).map(x=>({
      name:fullName(x.c),type:x.c.type,stage:x.c.stage,heat:x.c.heat,timeframe:x.c.timeframe,
      followUp:x.c.followUp,source:x.c.source,reasons:x.why.slice(0,4)
    })),
    openInquiries:openLeads(db).slice(0,6).map(x=>({
      name:[x.firstName,x.lastName].filter(Boolean).join(" "),source:x.source,intent:x.intent,timeframe:x.timeframe,message:String(x.message||"").slice(0,500)
    })),
    dueWork:dueTasks(db).slice(0,12).map(t=>({title:t.title,type:t.type,due:t.due,priority:t.priority})),
    pipelineRisks:pipelineRisks(db).slice(0,8).map(x=>({name:fullName(x.c),type:x.c.type,stage:x.c.stage,reasons:x.why}))
  };
  return `You are helping me operate my Holton Homes real-estate CRM.\nUse only the CRM context below. Do not invent facts. Give practical, relationship-first next actions.\n\nMY REQUEST:\n${prompt||"What should I do next?"}\n\nCRM CONTEXT:\n${JSON.stringify(pack,null,2)}`;
}
async function copyForChatGPT(prompt=""){
  const text=contextPacket(prompt);
  try{
    await navigator.clipboard.writeText(text);
    setAnswer("Copied a CRM context packet for ChatGPT.\n\nOpen ChatGPT, paste it, and ask away. Your paid API is not involved.", "celebrate", prompt);
  }catch{
    const area=document.createElement("textarea");area.value=text;document.body.appendChild(area);area.select();document.execCommand("copy");area.remove();
    setAnswer("Copied a CRM context packet for ChatGPT.\n\nOpen ChatGPT and paste it.", "celebrate", prompt);
  }
  setPipMood("celebrate",3500);
}
function injectPipPrompts(){
  const mount=$(".v146-prompt-mount");
  if(!mount||$(".v146-tool-grid",mount))return;
  mount.innerHTML=`
    <div class="v146-tool-grid">
      <button class="v146-tool-card business" data-v14-ai="business">
        <span class="v146-tool-icon">↗</span>
        <span><strong>Find business</strong><small>Best conversations right now</small></span>
      </button>
      <button class="v146-tool-card day" data-v14-ai="day">
        <span class="v146-tool-icon">✓</span>
        <span><strong>Build my day</strong><small>Put the work in order</small></span>
      </button>
      <button class="v146-tool-card seller" data-v145-mode="seller">
        <span class="v146-tool-icon">⌂</span>
        <span><strong>Seller radar</strong><small>Surface listing opportunities</small></span>
      </button>
      <button class="v146-tool-card pipeline" data-v14-ai="pipeline">
        <span class="v146-tool-icon">◆</span>
        <span><strong>Pipeline check</strong><small>Find stalled relationships</small></span>
      </button>
    </div>
    <button class="v146-chatgpt-card" data-v145-copy-chatgpt data-prompt="Review my CRM and help me decide the best next moves.">
      <span class="v146-chatgpt-mark">✦</span>
      <span><strong>Take this to ChatGPT</strong><small>Copy the useful CRM context for deeper strategy or writing.</small></span>
      <b>Copy context</b>
    </button>`;
}
function builderHtml(){
  const db=parseDb(),list=topBusiness(db,5);
  const rows=list.length?list.map(({c,why,score})=>`<a class="v14-opportunity" href="#/contact/${encodeURIComponent(c.id)}">
    <b>${esc(fullName(c))}</b><span>${esc(why.slice(0,2).join(" • ")||"relationship worth reviewing")}</span>
    <em>${esc(c.type||"Contact")} · priority ${Math.max(0,score)}</em></a>`).join(""):`<div class="v14-builder-empty">Add contacts and follow-up dates and Pip will start surfacing business automatically.</div>`;
  return `<section class="v14-business-builder">
    <div class="v14-builder-head"><div><span class="v14-builder-kicker">CREATE BUSINESS</span><h2>Where can the next client come from?</h2><p>Pip scores this locally. No paid AI required.</p></div>
    <div class="v14-builder-actions"><button class="v14-ai-button" data-v14-ai="business">Find business</button><button class="v14-ai-button secondary" data-v14-ai="day">Build my day</button></div></div>
    <div class="v14-opportunity-list">${rows}</div></section>`;
}
function enhanceToday(){
  const view=$("#view");
  if(!view||$(".v14-business-builder",view))return;
  const header=$(".v13-today-header",view);
  if(header)header.insertAdjacentHTML("afterend",builderHtml());
}
function contextButton(){
  const view=$("#view"); if(!view)return;
  $(".v14-context-ai",view)?.remove();
  const config={
    people:["business","Pip: who to call"],
    pipeline:["pipeline","Pip: pipeline check"],
    content:["content","Pip: content ideas"],
    inbox:["day","Pip: prioritize"],
    transactions:["pipeline","Pip: risk check"],
    reports:["sources","Pip: source review"]
  }[routeName()];
  if(!config)return;
  const target=$(".page-head .actions",view)||$(".fub-database-header",view);if(!target)return;
  const btn=document.createElement("button");btn.className="ghost-btn compact v14-context-ai";btn.dataset.v145Mode=config[0];btn.textContent=config[1];target.appendChild(btn);
}
function celebrateOnCompletion(event){
  const el=event.target.closest('[data-action="complete-task"],[data-action="complete-task-button"],[data-action="complete-next-action"],[data-action="work-primary"]');
  if(el)setTimeout(()=>setPipMood("celebrate",4000),250);
}
function syncPipStage(){
  const focus=$("#pipFocus");
  const stage=$("#pipStageArt");
  if(!focus||!stage)return;
  const text=focus.textContent.toLowerCase();
  let mood=contextMood();
  if(/overdue|clean up|missing|risk|stale|reply/.test(text))mood="concerned";
  else if(/seller|listing|value/.test(text))mood="thinking";
  else if(/create|call|follow up|appointment|pipeline/.test(text))mood="work";
  setPipMood(mood);
}
function polishPipNotices(){
  $$("#pipNotices .pip-notice").forEach((item,index)=>{
    if(item.dataset.v146==="1")return;
    item.dataset.v146="1";
    item.insertAdjacentHTML("afterbegin",`<span class="v146-notice-index">0${index+1}</span>`);
  });
}
function runEnhancements(){
  installPipArt();injectPipPrompts();enhanceToday();contextButton();syncPipStage();polishPipNotices();
  if(routeName()==="growth")setPipMood("work");
}

document.addEventListener("click",event=>{
  celebrateOnCompletion(event);

  const ai=event.target.closest("[data-v14-ai]");
  if(ai){
    event.preventDefault();event.stopImmediatePropagation();
    openPipThen(ai.dataset.v14Ai||"freeform");return;
  }
  const local=event.target.closest("[data-v145-mode]");
  if(local){
    event.preventDefault();event.stopImmediatePropagation();
    openPipThen(local.dataset.v145Mode||"freeform",local.dataset.prompt||"");return;
  }
  const copy=event.target.closest("[data-v145-copy-chatgpt]");
  if(copy){
    event.preventDefault();event.stopImmediatePropagation();
    $('[data-action="open-pip"]')?.click();
    setTimeout(()=>copyForChatGPT(copy.dataset.prompt||$("#pipAskInput")?.value||""),50);return;
  }
  const open=event.target.closest("[data-v145-open-chatgpt]");
  if(open){
    event.preventDefault();
    window.open("https://chatgpt.com/","_blank","noopener,noreferrer");return;
  }
  const ask=event.target.closest('[data-action="ask-pip"]');
  if(ask){
    event.preventDefault();event.stopImmediatePropagation();
    const prompt=$("#pipAskInput")?.value?.trim()||"What should I do next?";
    runLocal("freeform",prompt);
  }
},true);

document.addEventListener("keydown",event=>{
  if(event.key==="Enter"&&event.target?.id==="pipAskInput"){
    event.preventDefault();event.stopImmediatePropagation();
    runLocal("freeform",event.target.value.trim()||"What should I do next?");
  }
},true);

window.PipLocal={run:runLocal,open:openPipThen,setMood:setPipMood,copyForChatGPT,contextPacket};

window.addEventListener("hashchange",()=>setTimeout(runEnhancements,50));
window.addEventListener("load",()=>setTimeout(runEnhancements,140));
const view=$("#view");
if(view)new MutationObserver(()=>setTimeout(runEnhancements,10)).observe(view,{childList:true,subtree:false});
setTimeout(runEnhancements,90);
})();
;(() => {
  const drawer=document.getElementById("pipDrawer");
  if(!drawer)return;
  const observer=new MutationObserver(()=>setTimeout(()=>{
    try{
      window.PipLocal?.setMood?.(
        /overdue|clean up|missing|risk|stale|reply/i.test(document.getElementById("pipFocus")?.textContent||"")
          ?"concerned"
          :(["growth","pipeline","focus","call-queue"].includes((location.hash||"#/today").replace("#/","").split("/")[0])?"work":"default")
      );
      document.querySelectorAll("#pipNotices .pip-notice").forEach((item,index)=>{
        if(item.dataset.v146==="1")return;
        item.dataset.v146="1";
        item.insertAdjacentHTML("afterbegin",`<span class="v146-notice-index">0${index+1}</span>`);
      });
    }catch{}
  },20));
  observer.observe(drawer,{childList:true,subtree:true});
})();




/* ============================================================
   v14.8 — HOLTON HOMES PRODUCT PASS
   FUB-inspired mobile operating patterns + Holton business engine
   ============================================================ */
const V148 = (() => {
  let navHome = null;
  let navNext = null;
  let inboxDetailMode = sessionStorage.getItem("hh-mobile-inbox-detail") || "";
  let leadDetailMode = sessionStorage.getItem("hh-mobile-lead-detail") || "";

  const isMobile = () => window.matchMedia("(max-width: 900px)").matches;
  const view = () => document.getElementById("view");

  function relocatePrimaryNav() {
    const nav = document.getElementById("primaryNav");
    const topbar = document.querySelector(".v14-topbar");
    if (!nav || !topbar) return;

    if (!navHome) {
      navHome = nav.parentNode;
      navNext = nav.nextSibling;
    }

    if (isMobile()) {
      if (nav.parentNode !== document.body) document.body.appendChild(nav);
      document.documentElement.classList.add("v148-mobile-shell");
    } else {
      if (nav.parentNode === document.body && navHome) {
        if (navNext && navNext.parentNode === navHome) navHome.insertBefore(nav, navNext);
        else navHome.appendChild(nav);
      }
      document.documentElement.classList.remove("v148-mobile-shell");
    }
  }

  function currentDb() {
    try { return parseDb(); } catch { return {}; }
  }

  function countTodayData(db) {
    const inquiries = openLeads(db).length;
    const due = (db.tasks || []).filter(t => t.status !== "Done" && t.due && t.due <= TODAY()).length;
    const handoffs = topBusiness(db, 20).filter(x => x.score >= 24).length;
    const risks = pipelineRisks(db).length;
    return { inquiries, due, handoffs, risks };
  }

  function priorityItems(db) {
    const items = [];
    const leads = openLeads(db);
    const tasks = dueTasks(db);
    const business = topBusiness(db, 5);
    const risks = pipelineRisks(db);

    if (leads[0]) {
      const lead = leads[0];
      const name = [lead.firstName, lead.lastName].filter(Boolean).join(" ") || "New inquiry";
      items.push({
        type:"New lead",
        title:name,
        detail:[lead.source, lead.intent, lead.timeframe].filter(Boolean).join(" · "),
        action:"Open inbox",
        route:"#/inbox",
        tone:"urgent"
      });
    }

    if (tasks[0]) {
      items.push({
        type:tasks[0].due < TODAY() ? "Overdue" : "Due today",
        title:tasks[0].title || "Task",
        detail:tasks[0].type || "Commitment",
        action:"Open calendar",
        route:"#/calendar",
        tone:tasks[0].due < TODAY() ? "urgent" : "due"
      });
    }

    const best = business.find(x => !items.some(i => i.title === fullName(x.c)));
    if (best) {
      items.push({
        type:"Create business",
        title:fullName(best.c),
        detail:best.why.slice(0,2).join(" · ") || "Relationship worth working",
        action:hasPhone(best.c) ? "Call" : "Open",
        route:`#/contact/${encodeURIComponent(best.c.id)}`,
        contact:best.c,
        tone:"business"
      });
    }

    const risk = risks.find(x => !items.some(i => i.title === fullName(x.c)));
    if (risk) {
      items.push({
        type:"Pipeline risk",
        title:fullName(risk.c),
        detail:risk.why.slice(0,2).join(" · "),
        action:"Open",
        route:`#/contact/${encodeURIComponent(risk.c.id)}`,
        tone:"risk"
      });
    }

    return items.slice(0,4);
  }

  function mobileTodayCockpit() {
    if (!isMobile() || routeName() !== "today") return;
    const root = view();
    if (!root || root.querySelector(".v148-mobile-cockpit")) return;

    const header = root.querySelector(".v13-today-header");
    if (!header) return;

    const db = currentDb();
    const counts = countTodayData(db);
    const items = priorityItems(db);

    const html = `
      <section class="v148-mobile-cockpit">
        <div class="v148-mobile-kpis">
          <a href="#/inbox"><strong>${counts.inquiries}</strong><span>New leads</span></a>
          <a href="#/calendar"><strong>${counts.due}</strong><span>Due</span></a>
          <a href="#/growth"><strong>${counts.handoffs}</strong><span>Priority</span></a>
          <a href="#/pipeline"><strong>${counts.risks}</strong><span>At risk</span></a>
        </div>
        <div class="v148-mobile-upnext">
          <header>
            <div><span>UP NEXT</span><strong>Work the next conversation, not the whole database.</strong></div>
            <a href="#/growth">See all</a>
          </header>
          <div class="v148-mobile-priority-list">
            ${items.length ? items.map((item,index) => `
              <article class="${item.tone}">
                <span class="v148-priority-num">${String(index+1).padStart(2,"0")}</span>
                <div>
                  <em>${esc(item.type)}</em>
                  <strong>${esc(item.title)}</strong>
                  <small>${esc(item.detail)}</small>
                </div>
                ${item.contact && hasPhone(item.contact)
                  ? `<button data-v148-contact-call="${esc(item.contact.id)}">Call</button>`
                  : `<a href="${item.route}">${esc(item.action)}</a>`}
              </article>`).join("")
              : `<div class="v148-mobile-clear"><strong>You’re clear.</strong><span>Use the next block for seller and sphere prospecting.</span></div>`}
          </div>
        </div>
      </section>`;

    header.insertAdjacentHTML("afterend", html);
  }

  function compactBackupBanner() {
    if (!isMobile()) return;
    const root = view();
    if (!root) return;

    const candidates = Array.from(root.querySelectorAll("section,article,.card,.v13-signal-strip,div"));
    const banner = candidates.find(el => {
      const txt = (el.textContent || "").toLowerCase();
      return txt.includes("download a safety backup") && txt.includes("not cloud-synced");
    });
    if (!banner) return;

    banner.classList.add("v148-backup-banner");
    const button = Array.from(banner.querySelectorAll("button,a"))
      .find(el => /download backup/i.test(el.textContent || ""));
    if (button) button.textContent = "Backup";
  }

  function routeHook() {
    const root = view();
    if (!root) return;

    Array.from(root.classList)
      .filter(c => c.startsWith("v148-route-"))
      .forEach(c => root.classList.remove(c));

    root.classList.add(`v148-route-${routeName()}`);
  }

  function injectMobilePageTitleTools() {
    if (!isMobile()) return;
    const root = view();
    if (!root) return;
    const head = root.querySelector(".page-head");
    if (!head || head.querySelector(".v148-mobile-page-tools")) return;

    const route = routeName();
    const labels = {
      inbox:["Inbox","Respond first"],
      people:["People","Work your lists"],
      pipeline:["Pipeline","Move opportunities"],
      transactions:["Transactions","Protect the deal"],
      calendar:["Calendar","Keep promises"],
      content:["Content","Create demand"],
      network:["Network","Referral partners"],
      reports:["Reports","Know what works"],
      more:["More","Everything else"],
      growth:["Growth","Create business"]
    };
    if (!labels[route]) return;

    head.classList.add("v148-page-head");
    head.insertAdjacentHTML("afterbegin", `
      <div class="v148-mobile-page-tools">
        <span>${labels[route][0]}</span>
        <small>${labels[route][1]}</small>
      </div>`);
  }

  function polishPeopleMobile() {
    if (!isMobile() || routeName() !== "people") return;
    const root = view();
    if (!root) return;

    root.querySelectorAll(".fub-mobile-person").forEach(card => {
      if (card.dataset.v148 === "1") return;
      card.dataset.v148 = "1";
      const main = card.querySelector(".fub-mobile-main");
      const next = card.querySelector(".fub-mobile-next");
      const actions = card.querySelector(".fub-mobile-actions");
      if (main && next && actions) {
        const shell = document.createElement("div");
        shell.className = "v148-person-card-shell";
        card.insertBefore(shell, main);
        shell.appendChild(main);
        shell.appendChild(next);
        shell.appendChild(actions);
      }
    });
  }

  function mobileInboxState() {
    if (!isMobile() || routeName() !== "inbox") return;
    const root = view();
    if (!root) return;

    const conversation = root.querySelector(".pro-conversation,.conversation");
    const threadList = root.querySelector(".thread-list");
    const folders = root.querySelector(".inbox-folders");
    const leadPreview = root.querySelector(".v13-lead-preview");
    const leadList = root.querySelector(".v13-lead-list");

    root.classList.toggle("v148-show-conversation", !!conversation && inboxDetailMode === "conversation");
    root.classList.toggle("v148-show-lead-detail", !!leadPreview && leadDetailMode === "lead");

    if (conversation && inboxDetailMode === "conversation" && !conversation.querySelector(".v148-mobile-back")) {
      conversation.insertAdjacentHTML("afterbegin", `
        <button class="v148-mobile-back" data-v148-inbox-back>‹ Inbox</button>`);
    }

    if (leadPreview && leadDetailMode === "lead" && !leadPreview.querySelector(".v148-mobile-back")) {
      leadPreview.insertAdjacentHTML("afterbegin", `
        <button class="v148-mobile-back" data-v148-lead-back>‹ Inquiries</button>`);
    }

    if (!conversation && !leadPreview) {
      inboxDetailMode = "";
      leadDetailMode = "";
    }
  }

  function mobilePipelineAssist() {
    if (!isMobile() || routeName() !== "pipeline") return;
    const root = view();
    if (!root || root.querySelector(".v148-pipeline-guide")) return;
    const wrap = root.querySelector(".kanban-wrap");
    if (!wrap) return;

    wrap.insertAdjacentHTML("beforebegin", `
      <div class="v148-pipeline-guide">
        <span>Swipe stages →</span>
        <small>Tap a name to open the relationship. Use Pip when something feels stuck.</small>
      </div>`);
  }

  function mobileContentAssist() {
    if (!isMobile() || routeName() !== "content") return;
    const root = view();
    if (!root) return;
    const board = root.querySelector(".v13-stage-board");
    if (board) board.setAttribute("aria-label","Swipe content stages horizontally");
  }

  function decorateMore() {
    if (routeName() !== "more") return;
    const root = view();
    if (!root) return;
    root.querySelectorAll(".mobile-tool-directory a,.more-grid a,.more-grid button").forEach(item => {
      if (item.dataset.v148 === "1") return;
      item.dataset.v148 = "1";
    });
  }

  function polishContactMobile() {
    if (!isMobile() || routeName() !== "contact") return;
    const root = view();
    if (!root) return;
    const hero = root.querySelector(".contact-hero");
    if (!hero || hero.querySelector(".v148-contact-label")) return;

    hero.insertAdjacentHTML("afterbegin", `<span class="v148-contact-label">RELATIONSHIP</span>`);
  }

  function run() {
    relocatePrimaryNav();
    routeHook();
    compactBackupBanner();
    mobileTodayCockpit();
    injectMobilePageTitleTools();
    polishPeopleMobile();
    mobileInboxState();
    mobilePipelineAssist();
    mobileContentAssist();
    decorateMore();
    polishContactMobile();
  }

  document.addEventListener("click", event => {
    const thread = event.target.closest('[data-action="open-thread"]');
    if (isMobile() && thread) {
      inboxDetailMode = "conversation";
      sessionStorage.setItem("hh-mobile-inbox-detail","conversation");
    }

    const lead = event.target.closest('[data-action="select-lead-intake"]');
    if (isMobile() && lead) {
      leadDetailMode = "lead";
      sessionStorage.setItem("hh-mobile-lead-detail","lead");
    }

    const inboxBack = event.target.closest("[data-v148-inbox-back]");
    if (inboxBack) {
      event.preventDefault();
      inboxDetailMode = "";
      sessionStorage.removeItem("hh-mobile-inbox-detail");
      const root = view();
      root?.classList.remove("v148-show-conversation");
      return;
    }

    const leadBack = event.target.closest("[data-v148-lead-back]");
    if (leadBack) {
      event.preventDefault();
      leadDetailMode = "";
      sessionStorage.removeItem("hh-mobile-lead-detail");
      const root = view();
      root?.classList.remove("v148-show-lead-detail");
      return;
    }

    const call = event.target.closest("[data-v148-contact-call]");
    if (call) {
      event.preventDefault();
      const db = currentDb();
      const c = (db.contacts || []).find(x => String(x.id) === String(call.dataset.v148ContactCall));
      if (c?.phone) window.location.href = `tel:${String(c.phone).replace(/[^\d+]/g,"")}`;
      return;
    }
  }, true);

  window.addEventListener("hashchange", () => {
    if (routeName() !== "inbox") {
      inboxDetailMode = "";
      leadDetailMode = "";
      sessionStorage.removeItem("hh-mobile-inbox-detail");
      sessionStorage.removeItem("hh-mobile-lead-detail");
    }
    setTimeout(run, 55);
  });

  window.addEventListener("resize", () => setTimeout(run, 45));
  window.addEventListener("orientationchange", () => setTimeout(run, 70));
  window.addEventListener("load", () => setTimeout(run, 150));

  const root = view();
  if (root) new MutationObserver(() => setTimeout(run, 25))
    .observe(root, {childList:true, subtree:false});

  setTimeout(run, 100);
  return { run };
})();
