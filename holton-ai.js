(() => {
"use strict";
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const KEY="holtonHomesOS_v13";
const SUPABASE_URL=(window.HOLTON_CLOUD_CONFIG||{}).url||"https://tffqvksihwvhypjnfzih.supabase.co";
const FN=`${SUPABASE_URL}/functions/v1`;
const today=()=>new Date().toISOString().slice(0,10);
function db(){try{return JSON.parse(localStorage.getItem(KEY)||"{}")}catch{return {}}}
function route(){return (location.hash||"#/today").replace("#/","").split("/")[0]||"today"}
function fullName(c){return [c?.firstName,c?.lastName].filter(Boolean).join(" ")||"Unnamed contact"}
function esc(v){return String(v??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[ch]))}
function age(v){if(!v)return 9999;const d=new Date(v);return Number.isNaN(d.getTime())?9999:Math.max(0,Math.floor((Date.now()-d.getTime())/86400000))}
function latestTouch(d,c){const m=(d.communications||[]).filter(x=>String(x.contactId)===String(c.id)).sort((a,b)=>String(b.date||"").localeCompare(String(a.date||"")))[0];return m?.date||c.lastCommunication||""}
function rank(d,c){if(["Closed","Lost"].includes(c.stage))return {score:-1,why:[]};let score=0,why=[];if(c.heat==="Hot"){score+=25;why.push("hot")}else if(c.heat==="Warm"){score+=12;why.push("warm")}if(c.type==="Seller"){score+=20;why.push("seller opportunity")}const tf=String(c.timeframe||"");if(/0.?3/.test(tf)){score+=22;why.push("0–3 month timing")}else if(/3.?6/.test(tf)){score+=12;why.push("3–6 month timing")}if(c.followUp&&c.followUp<=today()){score+=24;why.push(c.followUp<today()?"follow-up overdue":"follow-up due")}if(!c.followUp&&["Seller","Buyer"].includes(c.type)){score+=8;why.push("needs next step")}const a=age(latestTouch(d,c));if(a>=30&&a<9999){score+=15;why.push(`${a} days since contact`)}else if(a>=14&&a<9999){score+=9;why.push(`${a} days since contact`)}if(["Sphere","Referral","Past Client"].includes(c.source)||c.type==="Past Client"){score+=7;why.push("relationship business")}return {score,why}}
function ranked(d,n=6){return (d.contacts||[]).map(c=>({c,...rank(d,c)})).filter(x=>x.score>=0).sort((a,b)=>b.score-a.score).slice(0,n)}
function pipelineRisks(d){return (d.contacts||[]).filter(c=>["Seller","Buyer"].includes(c.type)&&!["Closed","Lost"].includes(c.stage)).map(c=>{let why=[];if(!c.followUp)why.push("no next follow-up");if(c.followUp&&c.followUp<today())why.push("follow-up overdue");const a=age(latestTouch(d,c));if(a>=14&&a<9999)why.push(`${a} days since contact`);return {c,why}}).filter(x=>x.why.length).slice(0,7)}
function sellerRadar(d){return ranked(d,20).filter(x=>x.c.type==="Seller").slice(0,6)}
function dueTasks(d){return (d.tasks||[]).filter(t=>t.status!=="Done"&&t.due&&t.due<=today()).sort((a,b)=>String(a.due).localeCompare(String(b.due)))}
function setMood(mood){const file={default:"pip-default.webp",thinking:"pip-thinking.webp",work:"pip-work.webp",concerned:"pip-concerned.webp",celebrate:"pip-celebrate.webp"}[mood]||"pip-default.webp";$$('.pip-mini,.pip-avatar-large').forEach(el=>{el.style.backgroundImage=`url('./${file}')`});const fab=$("#hhPipFab img");if(fab)fab.src=`./${file}`}
function result(text,mood="thinking"){const el=$("#hhAiResult");if(el){el.textContent=text;el.classList.add("open")}setMood(mood)}
function pipAction(kind){const d=db();if(kind==="business"){const list=ranked(d,5);return result(list.length?`CALL THESE FIRST\n\n${list.map((x,i)=>`${i+1}. ${fullName(x.c)} — ${x.why.slice(0,2).join(" · ")||"relationship worth working"}`).join("\n")}\n\nGoal: make contact, learn what changed, and set the next follow-up date.`:"No active contacts are ready to rank yet.","work")}if(kind==="day"){const tasks=dueTasks(d),list=ranked(d,3);return result(`TODAY\n\n1. ${tasks.length?`Finish ${tasks.length} due/overdue commitment${tasks.length===1?"":"s"}.`:"No overdue commitments."}\n2. ${list.length?`Contact ${list.map(x=>fullName(x.c)).join(", ")}.`:"Prospect your sphere or seller database."}\n3. Give every live relationship a clear next step and date.`,tasks.length?"concerned":"work")}if(kind==="seller"){const list=sellerRadar(d);return result(list.length?`SELLER RADAR\n\n${list.map((x,i)=>`${i+1}. ${fullName(x.c)} — ${x.why.slice(0,2).join(" · ")}`).join("\n")}\n\nUse the call to understand motivation, timing, property, and what would have to change for a move to make sense.`:"No seller relationships are strong enough to surface yet.","thinking")}if(kind==="pipeline"){const list=pipelineRisks(d);return result(list.length?`PIPELINE CHECK\n\n${list.map((x,i)=>`${i+1}. ${fullName(x.c)} — ${x.why.join(" · ")}`).join("\n")}\n\nFix the oldest promises and missing next steps first.`:"Pipeline hygiene looks clean right now.",list.length?"concerned":"celebrate")}if(kind==="chatgpt")return askChatGPT()}
function selectedContact(d){const m=location.hash.match(/^#\/contact\/([^/?]+)/);if(!m)return null;return (d.contacts||[]).find(c=>String(c.id)===decodeURIComponent(m[1]))||null}
function chatPrompt(){const d=db(),c=selectedContact(d);if(c){const comm=(d.communications||[]).filter(x=>String(x.contactId)===String(c.id)).sort((a,b)=>String(b.date||"").localeCompare(String(a.date||""))).slice(0,3);const tasks=(d.tasks||[]).filter(x=>String(x.contactId)===String(c.id)&&x.status!=="Done").slice(0,4);return `You are helping me work a real-estate CRM relationship. Use only the CRM facts below; do not invent property facts.\n\nCONTACT\nName: ${fullName(c)}\nType: ${c.type||"Unknown"}\nStage: ${c.stage||"Unknown"}\nHeat: ${c.heat||"Unknown"}\nTimeframe: ${c.timeframe||"Unknown"}\nFollow-up: ${c.followUp||"Not set"}\nSource: ${c.source||"Unknown"}\nProperty: ${c.property||"Not recorded"}\nNotes: ${c.notes||"None"}\n\nRECENT COMMUNICATION\n${comm.length?comm.map(x=>`- ${x.date||""} ${x.channel||""}: ${x.body||x.outcome||""}`).join("\n"):"None logged"}\n\nOPEN TASKS\n${tasks.length?tasks.map(x=>`- ${x.title} (${x.due||"no date"})`).join("\n"):"None"}\n\nTell me: 1) the best next action, 2) what I should ask, 3) the goal of the conversation, and 4) draft a natural follow-up text. Keep it concise.`}const top=ranked(d,5);return `Help me plan my next real-estate business-development block using only these CRM facts.\n\n${top.map((x,i)=>`${i+1}. ${fullName(x.c)} — ${x.c.type||""} / ${x.c.stage||""} / ${x.why.slice(0,3).join(" · ")}`).join("\n")}\n\nPrioritize who I should contact, why, and what the goal of each conversation should be. Do not invent facts.`}
async function askChatGPT(){const prompt=chatPrompt();try{await navigator.clipboard.writeText(prompt);result("Copied CRM context for ChatGPT. A new ChatGPT tab is opening — paste the prompt there.","thinking");window.open("https://chatgpt.com/","_blank","noopener")}catch{showPrompt(prompt)}}
function showPrompt(prompt){openModal(`<div class="hh-chatgpt-fallback"><h3>Copy for ChatGPT</h3><p>Your browser blocked automatic clipboard access. Copy this prompt:</p><textarea readonly>${esc(prompt)}</textarea><button class="primary-btn" data-hh-copy-prompt>Copy prompt</button></div>`);setTimeout(()=>{$("[data-hh-copy-prompt]")?.addEventListener("click",async()=>{await navigator.clipboard.writeText(prompt);closeModal()})},20)}
function enhancePip(){const drawer=$("#pipDrawer");if(!drawer||$("#hhAiTools",drawer))return;const close=$("[data-action='close-pip']",drawer);if(close){close.textContent="⌄";close.classList.add("hh-pip-close")}const focus=$("#pipFocus",drawer);if(!focus)return;focus.insertAdjacentHTML("afterend",`<section class="hh-ai-tools" id="hhAiTools"><button data-hh-ai="business"><b>Find business</b><span>Rank the relationships worth working now.</span></button><button data-hh-ai="day"><b>Build my day</b><span>Due work first, then best conversations.</span></button><button data-hh-ai="seller"><b>Seller radar</b><span>Surface listing conversations from your CRM.</span></button><button data-hh-ai="pipeline"><b>Pipeline check</b><span>Find missing follow-ups and stale clients.</span></button><button data-hh-ai="chatgpt"><b>Ask ChatGPT</b><span>Copy selected CRM context for deeper reasoning or writing.</span></button></section><div class="hh-ai-result" id="hhAiResult"></div>`);setMood("default")}
function addIntegrationCard(){if(route()!=="settings"&&route()!=="more")return;const view=$("#view");if(!view||$(".hh-integrations-card",view))return;const card=`<section class="setting-card hh-integrations-card"><div class="setting-card-head"><div><h3>AI & Integrations</h3><p>Pip coaching, ChatGPT handoff, API keys, lead ingest, and connection health — without changing your CRM layout.</p></div></div><div class="hh-integrations-actions"><button class="primary-btn compact" data-hh-open-integrations>Open integrations</button><button class="ghost-btn compact" data-hh-ai="chatgpt">Ask ChatGPT</button></div></section>`;const target=view.querySelector(".settings-grid,.more-grid,.mobile-tool-directory")||view.firstElementChild;if(target)target.insertAdjacentHTML("afterbegin",card);else view.insertAdjacentHTML("afterbegin",card)}
function authToken(){try{for(const k of Object.keys(localStorage).filter(k=>k.includes("auth-token"))){const v=JSON.parse(localStorage.getItem(k)||"{}");const t=v?.access_token||v?.currentSession?.access_token||v?.session?.access_token;if(t)return t}}catch{}return ""}
async function api(action,payload={}){const token=authToken();if(!token)throw new Error("Sign in to the CRM first.");const res=await fetch(`${FN}/crm-integrations`,{method:action==="load"?"GET":"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:action==="load"?undefined:JSON.stringify({action,...payload})});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.error||"Integration request failed");return data}
function ensureModal(){if($("#hhAddonBackdrop"))return;document.body.insertAdjacentHTML("beforeend",`<div class="hh-addon-backdrop" id="hhAddonBackdrop"><section class="hh-addon-modal"><header class="hh-addon-head"><div><span>HOLTON HOMES</span><h2 id="hhAddonTitle">AI & Integrations</h2></div><button data-hh-close-modal aria-label="Close">×</button></header><div class="hh-addon-body" id="hhAddonBody"></div></section></div>`)}
function closeModal(){$("#hhAddonBackdrop")?.classList.remove("open")}
function openModal(html,title="AI & Integrations"){ensureModal();$("#hhAddonTitle").textContent=title;$("#hhAddonBody").innerHTML=html;$("#hhAddonBackdrop").classList.add("open")}
async function integrations(){openModal(`<p>Loading your integration backend…</p>`);try{const data=await api("load");const keys=data.keys||[],events=data.events||[];openModal(`<div class="hh-addon-grid"><article class="hh-addon-panel ready"><h3>Lead API & webhooks</h3><p><b>Ready now.</b> Website forms, Zapier, Make, or custom tools can send leads directly to the existing Lead Inbox.</p></article><article class="hh-addon-panel ready"><h3>ChatGPT handoff</h3><p><b>Ready now.</b> Pip creates a CRM context packet, copies it, and opens ChatGPT. No paid CRM AI gateway required.</p></article><article class="hh-addon-panel next"><h3>Gmail + Google Calendar</h3><p>Backend slot is ready; real Google OAuth still needs to be wired before this should say connected.</p></article><article class="hh-addon-panel next"><h3>Calling + texting</h3><p>Provider layer is ready for Twilio or another phone/SMS provider once credentials and a number are chosen.</p></article></div><section class="hh-addon-section"><div class="hh-addon-section-head"><div><h3>API keys</h3><small>For website / Zapier / Make / custom lead sources.</small></div><button class="primary-btn compact" data-hh-create-key>Create key</button></div><div class="hh-endpoint">POST ${FN}/crm-lead-ingest<br>x-api-key: hh_live_…<br>JSON: firstName, lastName, phone, email, source, intent, timeframe, property, area, message</div><div id="hhKeyReveal"></div><div>${keys.length?keys.map(k=>`<div class="hh-key-row"><div><strong>${esc(k.name)}</strong><small>${esc(k.key_prefix)}•••• · ${k.revoked_at?"Revoked":k.last_used_at?`Last used ${new Date(k.last_used_at).toLocaleString()}`:"Never used"}</small></div>${k.revoked_at?"":`<button class="ghost-btn compact" data-hh-revoke-key="${k.id}">Revoke</button>`}</div>`).join(""):`<div class="hh-key-row"><div><strong>No API keys yet</strong><small>Create one when you are ready to connect a lead source.</small></div></div>`}</div></section><section class="hh-addon-section"><div class="hh-addon-section-head"><div><h3>Recent integration activity</h3><small>Successes and errors from the real backend.</small></div></div>${events.length?events.slice(0,10).map(e=>`<div class="hh-event-row"><div><strong>${esc(e.message)}</strong><small>${esc(e.provider)} · ${new Date(e.created_at).toLocaleString()}</small></div><span>${esc(e.level)}</span></div>`).join(""):`<div class="hh-event-row"><div><strong>No activity yet</strong><small>Incoming lead and connection events will appear here.</small></div></div>`}</section>`)}catch(e){openModal(`<h3>Couldn’t load integrations</h3><p>${esc(e.message)}</p><p>The CRM itself is unaffected.</p>`)}}

function ensurePipFab(){
  if($("#hhPipFab"))return;
  document.body.insertAdjacentHTML("beforeend",`<button class="hh-pip-fab" id="hhPipFab" type="button" aria-label="Ask Pip" title="Ask Pip"><img src="./pip-default.webp" alt="Pip"></button>`);
}
function openPipAddon(){
  ensurePipFab();
  enhancePip();
  const drawer=$("#pipDrawer"),backdrop=$("#drawerBackdrop");
  if(!drawer)return;
  drawer.classList.add("hh-open");
  drawer.setAttribute("aria-hidden","false");
  backdrop?.classList.add("hh-pip-open");
  document.body.classList.add("hh-pip-is-open");
  setMood("default");
}
function closePipAddon(){
  const drawer=$("#pipDrawer"),backdrop=$("#drawerBackdrop");
  drawer?.classList.remove("hh-open");
  drawer?.setAttribute("aria-hidden","true");
  backdrop?.classList.remove("hh-pip-open");
  document.body.classList.remove("hh-pip-is-open");
}
function closeContactPeek(){
  const drawer=$("#contactPeekDrawer"),backdrop=$("#contactPeekBackdrop");
  drawer?.classList.remove("open","active","show");
  drawer?.setAttribute("aria-hidden","true");
  backdrop?.classList.remove("open","active","show");
}
function contactIdFromNode(node){
  let el=node;
  for(let i=0;el&&i<5;i++,el=el.parentElement){
    const id=el.dataset?.contactId||el.dataset?.contact||el.dataset?.id||"";
    if(id)return id;
    const href=el.getAttribute?.("href")||"";
    const match=href.match(/^#\/contact\/([^/?#]+)/);
    if(match)return decodeURIComponent(match[1]);
  }
  return "";
}
function fullContactFromPeopleClick(e){
  if(route()!=="people")return false;
  const explicit=e.target.closest("[data-action*='contact-peek'],[data-action*='open-contact'],[data-action*='peek-contact']");
  const person=e.target.closest(".fub-person-button");
  const card=e.target.closest(".fub-mobile-person");
  const trigger=explicit||person||card;
  if(!trigger)return false;

  // Preserve direct communication/action controls inside a person row.
  if(e.target.closest("a[href^='tel:'],a[href^='mailto:'],[data-action*='call'],[data-action*='text'],[data-action*='email'],button.quick"))return false;

  const id=contactIdFromNode(trigger);
  if(!id)return false;
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  closeContactPeek();
  location.hash=`#/contact/${encodeURIComponent(id)}`;
  return true;
}
function refineTopNav(){
  const pipeline=$(".v13-primary-nav a[data-route='pipeline'] span:nth-child(2)");
  if(pipeline)pipeline.textContent="Business";
  const more=$(".v13-primary-nav a[data-route='more']:not(.mobile-more-route) span:nth-child(2)");
  if(more)more.textContent="More";

  // Hidden business-support modules live under More.
  if(["transactions","network","reports"].includes(route())){
    $$(".v13-primary-nav a").forEach(a=>a.classList.remove("active"));
    $(".v13-primary-nav a[data-route='more']:not(.mobile-more-route)")?.classList.add("active");
  }
}
function refinePeople(){
  if(route()!=="people")return;
  const railTitle=$(".fub-rail-title strong");
  if(railTitle)railTitle.textContent="Smart Lists";
  $$(".fub-list-rail b").forEach(b=>{
    b.classList.toggle("hh-zero-count",b.textContent.trim()==="0");
  });
}
function refineBusiness(){
  if(route()!=="pipeline")return;
  const head=$(".page-head");
  if(!head)return;
  const h=head.querySelector("h1");
  const eyebrow=head.querySelector(".eyebrow");
  const desc=head.querySelector("p");
  if(h)h.textContent="Business";
  if(eyebrow)eyebrow.textContent="OPPORTUNITIES → ACTIVE DEALS";
  if(desc)desc.textContent="Work seller and buyer opportunities here. Active transaction progress stays attached to the relationship.";
}
function refineMore(){
  if(route()!=="more")return;
  const grid=$(".more-grid");
  if(!grid||grid.querySelector('a[href="#/transactions"]'))return;
  const reports=grid.querySelector('a[href="#/reports"]');
  const tile=document.createElement("a");
  tile.className="more-tile hh-transactions-more";
  tile.href="#/transactions";
  tile.innerHTML='<span>⌂</span><div><strong>Transactions</strong><small>Contract-to-close files, deadlines, and deal health.</small></div>';
  if(reports)grid.insertBefore(tile,reports);else grid.appendChild(tile);
}
function run(){ensurePipFab();enhancePip();refineTopNav();refinePeople();refineBusiness();refineMore();addIntegrationCard()}
document.addEventListener("click",e=>{
  if(fullContactFromPeopleClick(e))return;
  if(e.target.closest("#hhPipFab")||e.target.closest("[data-action='open-pip']")){
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    openPipAddon();
    return;
  }
  if(e.target.closest("[data-action='close-pip']")||e.target.id==="drawerBackdrop"){
    if($("#pipDrawer")?.classList.contains("hh-open")){
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      closePipAddon();
    }
  }
},true);
document.addEventListener("click",async e=>{const a=e.target.closest("[data-hh-ai]");if(a){e.preventDefault();pipAction(a.dataset.hhAi);return}if(e.target.closest("[data-hh-open-integrations]")){e.preventDefault();integrations();return}if(e.target.closest("[data-hh-close-modal]")){closeModal();return}if(e.target.id==="hhAddonBackdrop"){closeModal();return}const create=e.target.closest("[data-hh-create-key]");if(create){const name=prompt("Name this API key","Website / Automation");if(!name)return;try{const data=await api("create_key",{name});const el=$("#hhKeyReveal");if(el)el.innerHTML=`<div class="hh-key-reveal"><strong>Copy this now. It is only shown once.</strong><code>${esc(data.key)}</code><button class="ghost-btn compact" data-hh-copy-key="${esc(data.key)}">Copy key</button></div>`}catch(err){alert(err.message)}return}const copy=e.target.closest("[data-hh-copy-key]");if(copy){await navigator.clipboard.writeText(copy.dataset.hhCopyKey);copy.textContent="Copied";return}const rev=e.target.closest("[data-hh-revoke-key]");if(rev){if(!confirm("Revoke this API key?"))return;await api("revoke_key",{id:rev.dataset.hhRevokeKey});integrations();return}},true)
window.addEventListener("hashchange",()=>setTimeout(run,60));window.addEventListener("load",()=>setTimeout(run,140));const view=$("#view");if(view)new MutationObserver(()=>setTimeout(run,25)).observe(view,{childList:true,subtree:false});setTimeout(run,100)
})();