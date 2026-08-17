
(() => {
"use strict";

/* Holton Homes OS v16 — Calm Workday
   Daily psychology: clear communication, follow-ups, promises, then prospect.
*/
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const TODAY=()=>new Date().toISOString().slice(0,10);
const route=()=> (location.hash||"#/today").replace("#/","").split("/")[0]||"today";

function state(){
  try{return JSON.parse(localStorage.getItem("holtonHomesOS_v13")||"{}")}catch{return {}}
}
function esc(v){
  return String(v??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[ch]));
}
function name(c){return [c?.firstName,c?.lastName].filter(Boolean).join(" ")||"Unnamed contact"}
function days(v){
  if(!v)return 9999;
  const d=new Date(v);
  return Number.isNaN(d.getTime())?9999:Math.max(0,Math.floor((Date.now()-d.getTime())/86400000));
}
function lastTouch(d,c){
  const m=(d.communications||[])
    .filter(x=>String(x.contactId)===String(c.id))
    .sort((a,b)=>String(b.date||"").localeCompare(String(a.date||"")))[0];
  return m?.date||c.lastCommunication||"";
}
function priority(d,c){
  if(["Closed","Lost"].includes(c.stage))return {score:-1,reasons:[]};
  let score=0,reasons=[];
  if(c.heat==="Hot"){score+=28;reasons.push("hot")}
  else if(c.heat==="Warm"){score+=13;reasons.push("warm")}
  if(c.type==="Seller"){score+=14;reasons.push("seller")}
  const tf=String(c.timeframe||"");
  if(/0.?3/.test(tf)){score+=22;reasons.push("0–3 month timing")}
  else if(/3.?6/.test(tf)){score+=11;reasons.push("3–6 month timing")}
  if(c.followUp&&c.followUp<=TODAY()){
    score+=26;reasons.push(c.followUp<TODAY()?"follow-up overdue":"follow-up due");
  }
  if(!c.followUp&&["Buyer","Seller"].includes(c.type)){score+=7;reasons.push("needs next step")}
  const a=days(lastTouch(d,c));
  if(a>=30&&a<9999){score+=14;reasons.push(`${a} days since contact`)}
  else if(a>=14&&a<9999){score+=8;reasons.push(`${a} days since contact`)}
  return {score,reasons};
}
function unreadContacts(d){
  const ids=new Set((d.communications||[])
    .filter(m=>m.unread&&m.direction==="inbound")
    .map(m=>String(m.contactId)));
  return (d.contacts||[]).filter(c=>ids.has(String(c.id)));
}
function dueContacts(d){
  return (d.contacts||[])
    .filter(c=>!["Closed","Lost"].includes(c.stage)&&c.followUp&&c.followUp<=TODAY())
    .sort((a,b)=>String(a.followUp).localeCompare(String(b.followUp)));
}
function dueTasks(d){
  return (d.tasks||[])
    .filter(t=>t.status!=="Done"&&t.due&&t.due<=TODAY())
    .sort((a,b)=>String(a.due).localeCompare(String(b.due)));
}
function prospects(d){
  return (d.contacts||[])
    .map(c=>({c,...priority(d,c)}))
    .filter(x=>x.score>=0)
    .sort((a,b)=>b.score-a.score);
}
function newLeads(d){
  return (d.leadInbox||[])
    .filter(l=>l.status==="New")
    .sort((a,b)=>String(b.receivedAt||"").localeCompare(String(a.receivedAt||"")));
}
function plan(d){
  const leads=newLeads(d);
  const replies=unreadContacts(d);
  const followups=dueContacts(d);
  const tasks=dueTasks(d);
  const ranked=prospects(d);
  const respond=leads.length+replies.length;
  let active="prospect";
  if(respond)active="respond";
  else if(followups.length)active="followup";
  else if(tasks.length)active="promises";

  let next;
  if(leads[0]){
    const l=leads[0];
    const who=[l.firstName,l.lastName].filter(Boolean).join(" ")||"new lead";
    next={label:"Respond first",title:`Respond to ${who}`,detail:[l.source,l.intent,l.timeframe].filter(Boolean).join(" · ")||"New inquiry",href:"#/inbox",cta:"Open Inbox"};
  }else if(replies[0]){
    const c=replies[0];
    next={label:"Reply first",title:`Reply to ${name(c)}`,detail:"There is an unread inbound conversation waiting.",href:"#/inbox",cta:"Open Inbox"};
  }else if(followups[0]){
    const c=followups[0];
    next={label:"Follow up",title:`Follow up with ${name(c)}`,detail:[c.type,c.stage,c.timeframe].filter(Boolean).join(" · "),href:`#/contact/${encodeURIComponent(c.id)}`,cta:"Open person"};
  }else if(tasks[0]){
    const t=tasks[0];
    next={label:"Keep your promise",title:t.title||"Complete due task",detail:t.type||"Due today",href:"#/calendar",cta:"Open Calendar"};
  }else if(ranked[0]){
    const x=ranked[0];
    next={label:"Create business",title:`Reach out to ${name(x.c)}`,detail:x.reasons.slice(0,2).join(" · ")||"Relationship worth working",href:`#/contact/${encodeURIComponent(x.c.id)}`,cta:"Open person"};
  }else{
    next={label:"Create business",title:"Start a 30-minute prospecting block",detail:"Your urgent lanes are clear.",href:"#/people",cta:"Open People"};
  }

  return {
    respond,followup:followups.length,promises:tasks.length,active,next,
    urgent:respond+followups.length+tasks.length
  };
}
function dayMarkup(p){
  const step=(id,num,title,meta,href)=>`
    <a href="${href}" class="${p.active===id?"active":""}">
      <span class="v16-step-num">${num}</span>
      <div><strong>${title}</strong><small>${meta}</small></div>
    </a>`;
  return `
    <section class="v16-day-plan">
      <header class="v16-plan-head">
        <div>
          <span>YOUR WORKDAY</span>
          <h2>Clear the important lanes, then prospect.</h2>
          <p>One sequence. No guessing what to do next.</p>
        </div>
        <b>${p.urgent ? `${p.urgent} urgent` : "Urgent work clear"}</b>
      </header>
      <nav class="v16-flow" aria-label="Today's workflow">
        ${step("respond","01","Respond",`${p.respond} waiting`,"#/inbox")}
        ${step("followup","02","Follow up",`${p.followup} due`,"#/people")}
        ${step("promises","03","Keep promises",`${p.promises} due`,"#/calendar")}
        ${step("prospect","04","Prospect","30-minute block","#/people")}
      </nav>
      <div class="v16-next">
        <div>
          <span class="v16-next-label">${esc(p.next.label)}</span>
          <h3>${esc(p.next.title)}</h3>
          <p>${esc(p.next.detail)}</p>
        </div>
        <a href="${p.next.href}">${esc(p.next.cta)}</a>
      </div>
    </section>`;
}
function cleanOldToday(root){
  $$(".v151-command-center,.v152-status-strip,.v152-focus-title,.v152-who-to-call,.v16-day-plan",root).forEach(el=>el.remove());
}
function labelQueue(root){
  const panels=$$(".v13-panel",root);
  const queuePanel=panels.find(p=>p.querySelector(".v13-queue")||/items need movement|next actions/i.test(p.textContent||""));
  if(!queuePanel)return;
  queuePanel.classList.add("v16-primary-queue");
  const eyebrow=queuePanel.querySelector(".v13-panel-head span");
  const h=queuePanel.querySelector(".v13-panel-head h2");
  const sub=queuePanel.querySelector(".v13-panel-head p,.v13-panel-head small");
  if(eyebrow)eyebrow.textContent="WORK QUEUE";
  if(h)h.textContent="Work top to bottom";
  if(sub)sub.textContent="When the queue is clear, move to prospecting.";
}
function renderToday(){
  if(route()!=="today")return;
  const root=$("#view");
  const header=root?.querySelector(".v13-today-header");
  if(!root||!header)return;
  root.classList.add("v16-today");
  cleanOldToday(root);

  const h1=header.querySelector("h1");
  const sub=header.querySelector("p");
  if(h1)h1.textContent="Today";
  if(sub)sub.textContent="Clear replies, due follow-ups, and promises before creating new business.";

  const p=plan(state());
  header.insertAdjacentHTML("afterend",dayMarkup(p));
  labelQueue(root);
}
function comfort(){
  document.documentElement.dataset.holtonTheme="comfort";
}
function run(){
  comfort();
  if(route()==="today")renderToday();
}
window.addEventListener("load",()=>setTimeout(run,160));
window.addEventListener("hashchange",()=>setTimeout(run,70));
window.addEventListener("resize",()=>setTimeout(run,80));
const root=$("#view");
if(root)new MutationObserver(()=>setTimeout(run,30)).observe(root,{childList:true,subtree:false});
setTimeout(run,120);
})();
