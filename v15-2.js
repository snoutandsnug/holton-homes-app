
(() => {
"use strict";

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const TODAY=()=>new Date().toISOString().slice(0,10);
const route=()=> (location.hash||"#/today").replace("#/","").split("/")[0]||"today";
const desktop=()=>window.innerWidth>900;

function state(){
  try{return JSON.parse(localStorage.getItem("holtonHomesOS_v13")||"{}")}catch{return {}}
}
function esc(v){
  return String(v??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[ch]));
}
function name(c){
  return [c?.firstName,c?.lastName].filter(Boolean).join(" ")||"Unnamed contact";
}
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
  if(c.heat==="Hot"){score+=28;reasons.push("Hot")}
  else if(c.heat==="Warm"){score+=13;reasons.push("Warm")}
  if(c.type==="Seller"){score+=16;reasons.push("Seller")}
  const tf=String(c.timeframe||"");
  if(/0.?3/.test(tf)){score+=24;reasons.push("0–3 month timing")}
  else if(/3.?6/.test(tf)){score+=12;reasons.push("3–6 month timing")}
  if(c.followUp&&c.followUp<=TODAY()){
    score+=26;
    reasons.push(c.followUp<TODAY()?"Follow-up overdue":"Follow-up due");
  }
  if(!c.followUp&&["Buyer","Seller"].includes(c.type)){
    score+=7;reasons.push("Needs next step");
  }
  const age=days(lastTouch(d,c));
  if(age>=30&&age<9999){score+=14;reasons.push(`${age}d since contact`)}
  else if(age>=14&&age<9999){score+=8;reasons.push(`${age}d since contact`)}
  return {score,reasons};
}
function topPeople(d,n=5){
  return (d.contacts||[])
    .map(c=>({c,...priority(d,c)}))
    .filter(x=>x.score>=0)
    .sort((a,b)=>b.score-a.score)
    .slice(0,n);
}
function unreadReplies(d){
  const ids=new Set((d.communications||[])
    .filter(m=>m.unread&&m.direction==="inbound")
    .map(m=>String(m.contactId)));
  return (d.contacts||[]).filter(c=>ids.has(String(c.id))).length;
}
function stats(d){
  const open=(d.contacts||[]).filter(c=>!["Closed","Lost"].includes(c.stage));
  return {
    newLeads:(d.leadInbox||[]).filter(x=>x.status==="New").length,
    replies:unreadReplies(d),
    due:open.filter(c=>c.followUp&&c.followUp<=TODAY()).length,
    active:open.filter(c=>["Buyer","Seller"].includes(c.type)).length
  };
}

function cleanNav(){
  if(!desktop())return;
  // Defensive cleanup in case an older cached HTML shell is still active.
  $$(".v14-primary-nav .v15-integrations-nav").forEach(el=>el.remove());
  $$('.v14-primary-nav a[href="#/network"]').forEach(el=>el.remove());
  $(".v14-primary-nav .mobile-more-route")?.style.setProperty("display","none","important");

  const desktopMore=$$(".v14-primary-nav .desktop-more-route");
  desktopMore.slice(1).forEach(el=>el.remove());
  const more=desktopMore[0];
  if(more&&!more.querySelector(".v152-more-dots")){
    more.insertAdjacentHTML("afterbegin",'<span class="v152-more-dots">•••</span>');
  }

  // For secondary settings pages, More is the active parent.
  if(["more","network","integrations"].includes(route())){
    $$(".v14-primary-nav>a").forEach(a=>a.classList.remove("active"));
    more?.classList.add("active");
  }
}

function installToday(){
  if(!desktop()||route()!=="today")return;
  const root=$("#view");
  if(!root)return;
  root.classList.add("v152-today");

  const d=state();
  const s=stats(d);
  const header=$(".v13-today-header",root);
  const wins=$(".v13-three-wins",root);
  const grid=$(".v13-today-grid",root);

  if(header){
    const sub=header.querySelector("p");
    if(sub)sub.textContent="Respond. Follow up. Create business. Protect the pipeline.";
    if(!$(".v152-status-strip",root)){
      header.insertAdjacentHTML("afterend",`
        <section class="v152-status-strip">
          <a href="#/inbox"><span>New leads</span><strong>${s.newLeads}</strong><small>Respond now</small></a>
          <a href="#/inbox"><span>Replies</span><strong>${s.replies}</strong><small>Inbox zero</small></a>
          <a href="#/people"><span>Follow-up due</span><strong>${s.due}</strong><small>Work your list</small></a>
          <a href="#/pipeline"><span>Open clients</span><strong>${s.active}</strong><small>Protect pipeline</small></a>
        </section>`);
    }
  }

  if(wins){
    wins.classList.add("v152-focus-board");
    if(!wins.previousElementSibling?.classList?.contains("v152-focus-title")){
      wins.insertAdjacentHTML("beforebegin",`
        <div class="v152-focus-title">
          <div><span>TODAY'S FOCUS</span><strong>Three moves that matter</strong></div>
          <small>Respond → follow up → create business.</small>
        </div>`);
    }
  }

  if(grid){
    const aside=grid.querySelector(":scope > aside");
    if(aside&&!$(".v152-who-to-call",aside)){
      const people=topPeople(d,5);
      aside.insertAdjacentHTML("afterbegin",`
        <section class="v152-who-to-call v13-panel">
          <header class="v152-rail-head">
            <div><span>WHO TO CALL</span><h2>Best conversations now</h2></div>
            <button data-v15-pip="business">Ask Pip</button>
          </header>
          <div class="v152-call-list">
            ${people.length?people.map((x,i)=>`
              <a href="#/contact/${encodeURIComponent(x.c.id)}">
                <span class="v152-person-rank">${i+1}</span>
                <div>
                  <strong>${esc(name(x.c))}</strong>
                  <small>${esc(x.reasons.slice(0,2).join(" · ")||"Worth a conversation")}</small>
                </div>
                <b>→</b>
              </a>`).join(""):`
              <div class="v152-rail-empty">
                <strong>No ranked contacts yet.</strong>
                <small>Add timing and next follow-up dates to your relationships.</small>
              </div>`}
          </div>
          <a class="v152-view-people" href="#/people">Open People & Smart Lists →</a>
        </section>`);
    }
  }
}

function addMoreTools(){
  if(route()!=="more")return;
  const root=$("#view");
  if(!root)return;
  const target=root.querySelector(".mobile-tool-directory,.more-grid")||root.firstElementChild;
  if(!target)return;

  if(!root.querySelector(".v152-network-tool")){
    target.insertAdjacentHTML("afterbegin",`
      <a class="v152-network-tool v152-more-tool" href="#/network">
        <span>◎</span>
        <div><strong>Local Network</strong><small>Vendors, lenders and referral partners</small></div>
        <b>›</b>
      </a>`);
  }
  if(!root.querySelector(".v15-more-integrations")&&!root.querySelector(".v152-integrations-tool")){
    target.insertAdjacentHTML("afterbegin",`
      <a class="v152-integrations-tool v152-more-tool" href="#/integrations">
        <span>↔</span>
        <div><strong>Integrations & API</strong><small>Email, calendar, calling, lead sources and API keys</small></div>
        <b>›</b>
      </a>`);
  }
}

function authToken(){
  try{
    for(const k of Object.keys(localStorage).filter(k=>k.includes("auth-token"))){
      const v=JSON.parse(localStorage.getItem(k)||"{}");
      const t=v?.access_token||v?.currentSession?.access_token||v?.session?.access_token;
      if(t)return t;
    }
  }catch{}
  return "";
}
const SUPABASE_URL=(window.HOLTON_CLOUD_CONFIG||{}).url||"https://tffqvksihwvhypjnfzih.supabase.co";
async function integrationApi(action,payload={}){
  const token=authToken();
  if(!token)throw new Error("Sign in to the CRM first.");
  const res=await fetch(`${SUPABASE_URL}/functions/v1/crm-integrations`,{
    method:action==="load"?"GET":"POST",
    headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},
    body:action==="load"?undefined:JSON.stringify({action,...payload})
  });
  const data=await res.json().catch(()=>({}));
  if(!res.ok)throw new Error(data.error||"Connection request failed");
  return data;
}
const providers=[
  ["gmail","Gmail","Email sync"],
  ["google_calendar","Google Calendar","Calendar sync"],
  ["twilio","Twilio","Calling & texting"],
  ["facebook","Facebook Lead Ads","Lead capture"],
  ["zapier_make","Zapier / Make","Automation"],
  ["website","Website / Forms","Lead capture"]
];

async function renderIntegrations(){
  if(route()!=="integrations")return;
  const root=$("#view");
  if(!root)return;

  // Do not let app.js's fallback Today screen sit under an Integrations URL.
  if(root.dataset.v152IntegrationLoading==="1")return;
  root.dataset.v152IntegrationLoading="1";
  root.className="view fub-view v152-integrations-view";
  root.innerHTML=`
    <section class="v15-integrations">
      <div class="v15-integrations-head">
        <div><span>MORE · CONNECTIONS</span><h1>Integrations</h1><p>Connect lead sources and communication tools without exposing private keys in your browser.</p></div>
        <div class="v15-integration-status"><b>Supabase backend connected</b><b id="v152IntegrationCount">Loading…</b></div>
      </div>
      <div id="v152IntegrationBody"><div class="v15-panel">Loading connections…</div></div>
    </section>`;

  try{
    const data=await integrationApi("load");
    const connections=new Map((data.connections||[]).map(x=>[x.provider,x]));
    $("#v152IntegrationCount").textContent=`${(data.connections||[]).filter(x=>x.status==="connected").length} connected`;
    $("#v152IntegrationBody").innerHTML=`
      <section class="v15-connection-grid">
        ${providers.map(([id,title,kind])=>{
          const c=connections.get(id);
          const status=c?.status||"not_connected";
          return `<article class="v15-connection-card">
            <header><div><small>${kind}</small><h3>${title}</h3></div><span class="status ${status}">${status.replace("_"," ")}</span></header>
            <p>${status==="connected"?"Connected to Holton Homes OS.":"Secure provider setup available from this connection."}</p>
            <footer><button class="ghost-btn" data-v152-connection="${id}" data-name="${title}">${status==="connected"?"Manage":"Set up"}</button></footer>
          </article>`;
        }).join("")}
      </section>
      <section class="v15-panel">
        <div class="v15-panel-head"><div><h2>API keys</h2><p>Website, Zapier, Make, forms and custom lead sources.</p></div><button data-v152-create-key>Create API key</button></div>
        <div class="v15-endpoint">POST ${SUPABASE_URL}/functions/v1/crm-lead-ingest<br>x-api-key: hh_live_…</div>
        <div id="v152KeyReveal"></div>
        <div class="v15-api-list">
          ${(data.keys||[]).length?(data.keys||[]).map(k=>`
            <div class="v15-api-row">
              <div><strong>${esc(k.name)}</strong><small>${esc(k.key_prefix)}•••• · ${k.revoked_at?"Revoked":k.last_used_at?"Used":"Never used"}</small></div>
              ${k.revoked_at?"":`<button data-v152-revoke-key="${k.id}">Revoke</button>`}
            </div>`).join(""):`<div class="v15-api-row"><div><strong>No API keys yet</strong><small>Create one to receive external leads.</small></div></div>`}
        </div>
      </section>
      <section class="v15-panel">
        <div class="v15-panel-head"><div><h2>Recent activity</h2><p>Integration successes and failures.</p></div></div>
        <div class="v15-event-list">
          ${(data.events||[]).length?(data.events||[]).slice(0,12).map(e=>`
            <div class="v15-event-row"><div><strong>${esc(e.message)}</strong><small>${esc(e.provider)} · ${new Date(e.created_at).toLocaleString()}</small></div><span>${esc(e.level)}</span></div>`).join(""):`<div class="v15-event-row"><div><strong>No integration activity yet</strong></div></div>`}
        </div>
      </section>`;
  }catch(err){
    $("#v152IntegrationBody").innerHTML=`<div class="v15-panel"><strong>Couldn’t load integrations.</strong><p>${esc(err.message)}</p><button class="primary-btn" data-v152-retry-integrations>Retry</button></div>`;
  }finally{
    root.dataset.v152IntegrationLoading="0";
  }
}

function run(){
  cleanNav();
  if(route()==="today")installToday();
  if(route()==="more")addMoreTools();
  if(route()==="integrations")renderIntegrations();
}

document.addEventListener("click",async e=>{
  const create=e.target.closest("[data-v152-create-key]");
  if(create){
    e.preventDefault();
    const keyName=prompt("Name this API key","Website / Automation");
    if(!keyName)return;
    try{
      const d=await integrationApi("create_key",{name:keyName});
      const reveal=$("#v152KeyReveal");
      if(reveal)reveal.innerHTML=`<div class="v15-key-reveal"><strong>Copy this key now. It is only shown once.</strong><code>${esc(d.key)}</code><button data-v152-copy-key="${esc(d.key)}">Copy key</button></div>`;
    }catch(err){alert(err.message)}
    return;
  }
  const copy=e.target.closest("[data-v152-copy-key]");
  if(copy){
    e.preventDefault();
    await navigator.clipboard.writeText(copy.dataset.v152CopyKey);
    copy.textContent="Copied";
    return;
  }
  const revoke=e.target.closest("[data-v152-revoke-key]");
  if(revoke){
    e.preventDefault();
    if(!confirm("Revoke this API key?"))return;
    await integrationApi("revoke_key",{id:revoke.dataset.v152RevokeKey});
    renderIntegrations();
    return;
  }
  const connection=e.target.closest("[data-v152-connection]");
  if(connection){
    e.preventDefault();
    await integrationApi("save_connection",{
      provider:connection.dataset.v152Connection,
      display_name:connection.dataset.name,
      status:"needs_attention",
      config:{setup_started:true}
    });
    renderIntegrations();
    return;
  }
  if(e.target.closest("[data-v152-retry-integrations]")){
    e.preventDefault();
    renderIntegrations();
  }
},true);

window.addEventListener("load",()=>setTimeout(run,180));
window.addEventListener("hashchange",()=>setTimeout(run,80));
window.addEventListener("resize",()=>setTimeout(run,80));

const view=$("#view");
if(view)new MutationObserver(()=>setTimeout(run,35)).observe(view,{childList:true,subtree:false});
setTimeout(run,140);
})();
