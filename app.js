(() => {
"use strict";

const STORAGE_KEY = "holtonHomesCRM_v12";
const LEGACY_KEYS = ["holtonHomesCRM_v11","holtonHomesCRM_v10","holtonHomesBusinessBuilder_v7","holtonHomesCRM"];
const TODAY = () => new Date().toISOString().slice(0,10);
const NOW = () => new Date().toISOString();
const sellerStages = ["New","Attempted Contact","Contacted","Nurture","Listing Appointment","Listing Agreement Signed","Active Listing","Under Contract","Closed","Lost"];
const buyerStages = ["New","Attempted Contact","Contacted","Nurture","Buyer Consultation","Pre-Approved","Touring Homes","Offer Submitted","Under Contract","Closed","Lost"];
const sources = ["Sphere","Referral","Social Media","Website","Open House","Farm / Homestead Brand","Cold Outreach","Sign Call","Past Client","Other"];
const behaviorTypes = ["Viewed Property","Saved Property","Repeated Property View","Requested Showing","Home Valuation","Opened Email","Clicked Property Alert","Searched Website"];
const plans = [
  {id:"seller10",name:"New Seller — 10 Day",category:"Seller",description:"Fast personal follow-up for a new homeowner inquiry.",pauseOnReply:true,steps:[[0,"Call new seller lead","Call"],[0,"Send personal introduction","Text"],[1,"Second call attempt","Call"],[3,"Send seller roadmap","Email"],[7,"Market and motivation check-in","Call"],[10,"Book appointment or move to nurture","Follow Up"]]},
  {id:"futureSeller",name:"Future Seller — 90 Day",category:"Seller",description:"Consistent value without chasing.",pauseOnReply:true,steps:[[0,"Send seller planning guide","Email"],[14,"Check timing and motivation","Call"],[30,"Send market update","Email"],[60,"Personal seller check-in","Call"],[90,"Refresh value conversation","Follow Up"]]},
  {id:"buyer10",name:"New Buyer — 10 Day",category:"Buyer",description:"Move a buyer toward consultation and financing.",pauseOnReply:true,steps:[[0,"Call new buyer","Call"],[0,"Send introduction text","Text"],[2,"Send buyer roadmap","Email"],[5,"Book buyer consultation","Follow Up"],[10,"Move to nurture or active search","Follow Up"]]},
  {id:"openHouse",name:"Open House Follow-Up",category:"Buyer",description:"Immediate follow-up for visitors and neighbors.",pauseOnReply:true,steps:[[0,"Send open-house thank-you","Text"],[1,"Call about feedback","Call"],[3,"Send similar-home options","Email"],[7,"Consultation follow-up","Call"]]},
  {id:"pastClient",name:"Past Client Relationship",category:"Past Client",description:"Reviews, referrals, and long-term equity conversations.",pauseOnReply:false,steps:[[0,"Send closing thank-you","Text"],[14,"Check in after move","Call"],[30,"Request review","Follow Up"],[90,"Send equity update","Email"],[180,"Relationship check-in","Call"],[365,"Home anniversary","Call"]]}
];

let db = loadDatabase();
let state = {route:"today",smartList:"all",peopleQuery:"",peopleType:"",peopleStage:"",peopleHeat:"",inboxFolder:"open",activeThread:null,taskFilter:"open",pipelineType:"Seller",callIndex:0,pendingTaskId:""};

function uid(){return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`}
function esc(value){return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]))}
function fullName(c){return [c.firstName,c.lastName].filter(Boolean).join(" ").trim() || c.name || "Unnamed Contact"}
function initials(c){return `${(c.firstName||c.name||"?").trim()[0]||"?"}${(c.lastName||"").trim()[0]||""}`.toUpperCase()}
function money(value){return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(Number(value)||0)}
function dateLabel(value){if(!value)return "Not set";const d=new Date(`${value}T12:00:00`);return d.toLocaleDateString(undefined,{month:"short",day:"numeric",year:d.getFullYear()!==new Date().getFullYear()?"numeric":undefined})}
function dateTimeLabel(value){if(!value)return "";const d=new Date(value);return d.toLocaleString(undefined,{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}
function addDays(base,days){const d=new Date(`${base||TODAY()}T12:00:00`);d.setDate(d.getDate()+Number(days||0));return d.toISOString().slice(0,10)}
function daysSince(value){if(!value)return 999;return Math.max(0,Math.floor((new Date(`${TODAY()}T12:00:00`)-new Date(`${value.slice(0,10)}T12:00:00`))/86400000))}
function isOpen(c){return !["Closed","Lost"].includes(c.stage)}
function contact(id){return db.contacts.find(c=>c.id===id)}
function task(id){return db.tasks.find(t=>t.id===id)}
function hasPhone(c){return Boolean((c?.phone||"").replace(/\D/g,""))}
function hasEmail(c){return Boolean(c?.email && c.email.includes("@"))}
function save(){
  db.settings.lastSavedAt=NOW();
  const payload=JSON.stringify(db);
  localStorage.setItem(STORAGE_KEY,payload);
  mirrorToIndexedDb(payload);
  renderNav();
  renderPip();
}
function openBackupDb(){
  return new Promise((resolve,reject)=>{
    if(!("indexedDB" in window)){reject(new Error("IndexedDB unavailable"));return}
    const request=indexedDB.open("HoltonHomesCRMBackup",1);
    request.onupgradeneeded=()=>{
      const database=request.result;
      if(!database.objectStoreNames.contains("snapshots"))database.createObjectStore("snapshots")
    };
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error)
  })
}
async function mirrorToIndexedDb(payload){
  try{
    const database=await openBackupDb();
    const tx=database.transaction("snapshots","readwrite");
    tx.objectStore("snapshots").put(payload,"latest")
  }catch(error){console.warn("Browser backup mirror failed",error)}
}
async function restoreFromIndexedDbIfNeeded(){
  if(localStorage.getItem(STORAGE_KEY))return;
  try{
    const database=await openBackupDb();
    const tx=database.transaction("snapshots","readonly");
    const request=tx.objectStore("snapshots").get("latest");
    request.onsuccess=()=>{
      if(!request.result)return;
      try{
        db=normalize(JSON.parse(request.result));
        localStorage.setItem(STORAGE_KEY,JSON.stringify(db));
        toast("Emergency recovery","Recovered your CRM from its second browser copy.");
        route()
      }catch(error){console.warn("Emergency recovery failed",error)}
    }
  }catch(error){console.warn("No browser recovery copy found",error)}
}
function backupAgeDays(){
  return db.settings.lastManualBackupAt?daysSince(db.settings.lastManualBackupAt):999
}
function backupWarningHtml(){
  if(backupAgeDays()<=7)return "";
  return `<section class="backup-alert">
    <div><strong>Protect your client database.</strong><span>${db.settings.lastManualBackupAt?`Last downloaded backup: ${dateLabel(db.settings.lastManualBackupAt)}.`:"You have not downloaded a backup yet."} Clearing cookies or site data can erase browser-only records.</span></div>
    <button class="backup-button" data-action="export-json">Download backup</button>
  </section>`
}
function normalize(raw){
  const contacts=(raw.contacts||raw.people||[]).map(p=>{
    const parts=String(p.name||"").trim().split(/\s+/);
    const firstName=p.firstName||parts.shift()||"",lastName=p.lastName||parts.join(" ");
    return {
      id:p.id||uid(),firstName,lastName,name:[firstName,lastName].filter(Boolean).join(" "),
      phone:p.phone||"",email:p.email||"",type:p.type||"Seller",stage:p.stage||"New",heat:p.heat||"Warm",
      timeframe:p.timeframe||"Unknown",followUp:p.followUp||"",lastCommunication:p.lastCommunication||p.lastContact||"",
      source:p.source||"Sphere",gci:Number(p.gci||0),property:p.property||"",tags:Array.isArray(p.tags)?p.tags:[],
      notes:p.notes||"",createdAt:p.createdAt||TODAY(),updatedAt:p.updatedAt||TODAY(),
      household:Array.isArray(p.household)?p.household:[],
      preferences:p.preferences||{areas:"",minPrice:"",maxPrice:"",beds:"",baths:""},
      sellerDetails:p.sellerDetails||{motivation:"",estimatedValue:"",mortgageBalance:"",condition:"",decisionMakers:""},
      buyerDetails:p.buyerDetails||{preapproval:"Unknown",lender:"",budget:"",desiredPayment:"",areas:"",beds:"",baths:"",leaseExpiration:""},
      sphereDetails:p.sphereDetails||{relationship:"",birthday:"",neighborhood:"",homeowner:"Unknown",likelyOpportunity:""},
      alertSettings:p.alertSettings||{propertyAlert:false,marketSnapshot:false,criteria:"",frequency:"Weekly",lastSent:""},
      behaviors:Array.isArray(p.behaviors)?p.behaviors:[]
    }
  });
  const communications=(raw.communications||raw.activities||[]).map(a=>({
    id:a.id||uid(),contactId:a.contactId||a.personId||"",channel:a.channel||a.type||"Note",
    direction:a.direction||"outbound",outcome:a.outcome||"",body:a.body||a.summary||"",date:a.date?.includes("T")?a.date:`${a.date||TODAY()}T12:00:00`,
    unread:Boolean(a.unread),threadStatus:a.threadStatus||"open",createdAt:a.createdAt||NOW()
  }));
  const tasks=(raw.tasks||[]).map(t=>({id:t.id||uid(),contactId:t.contactId||t.personId||"",title:t.title||"Follow up",type:t.type||"Follow Up",due:t.due||TODAY(),status:t.status||"Open",priority:t.priority||"Normal",planRunId:t.planRunId||"",completedAt:t.completedAt||"",createdAt:t.createdAt||TODAY()}));
  return {contacts,communications,tasks,planRuns:raw.planRuns||[],settings:{agentName:"Jacob",agentEmail:"",agentPhone:"",commissionRate:3,lastManualBackupAt:"",lastSavedAt:"",annualGciTarget:100000,sellerShareGoal:60,dailyConversationTarget:5,coreMarkets:"Cincinnati, Brown County, Mt. Orab, Williamsburg, Hillsboro, Lebanon",...(raw.settings||{})}};
}
function loadDatabase(){
  try{
    const current=localStorage.getItem(STORAGE_KEY);
    if(current)return normalize(JSON.parse(current));
    for(const key of LEGACY_KEYS){
      const legacy=localStorage.getItem(key);
      if(legacy){
        const migrated=normalize(JSON.parse(legacy));
        localStorage.setItem(STORAGE_KEY,JSON.stringify(migrated));
        return migrated;
      }
    }
  }catch(error){console.warn("Database load failed",error)}
  return normalize({contacts:[],communications:[],tasks:[],planRuns:[],settings:{}});
}

function route(){
  const hash=(location.hash||"#/today").replace(/^#\//,"");
  const [name,id]=hash.split("/");
  state.route=name||"today";
  renderNav();
  if(name==="contact"&&id)return renderContact(id);
  const renderers={today:renderToday,inbox:renderInbox,people:renderPeople,"call-queue":renderCallQueue,pipeline:renderPipeline,tasks:renderTasks,automations:renderAutomations,activity:renderActivity,reports:renderReports,settings:renderSettings};
  (renderers[state.route]||renderToday)();
}
function renderNav(){
  document.querySelectorAll("[data-route]").forEach(a=>a.classList.toggle("active",a.dataset.route===state.route||(state.route==="contact"&&a.dataset.route==="people")));
  const due=dueContacts().length,unread=db.communications.filter(x=>x.unread).length,openTasks=db.tasks.filter(t=>t.status!=="Done"&&t.due<=TODAY()).length,calls=callQueue().length;
  setCount("navTodayCount",due+openTasks);setCount("navInboxCount",unread);setCount("navTaskCount",openTasks);setCount("navCallCount",calls);setCount("pipNavCount",pipNotices().length)
}
function setCount(id,n){const el=document.getElementById(id);if(!el)return;el.textContent=n||"";el.style.display=n?"grid":"none"}
function pageHead(eyebrow,title,description,actions=""){return `<div class="page-head"><div><div class="eyebrow">${esc(eyebrow)}</div><h1>${esc(title)}</h1><p>${esc(description)}</p></div><div class="actions">${actions}</div></div>`}
function avatar(c){return `<span class="avatar">${esc(initials(c))}</span>`}
function contactQuickActions(c,labels=false){return `<div class="row-actions">
<button class="quick call" data-action="communicate" data-channel="Call" data-id="${c.id}" ${hasPhone(c)?"":"disabled"}>☎${labels?" Call":""}</button>
<button class="quick text" data-action="communicate" data-channel="Text" data-id="${c.id}" ${hasPhone(c)?"":"disabled"}>✉${labels?" Text":""}</button>
<button class="quick email" data-action="communicate" data-channel="Email" data-id="${c.id}" ${hasEmail(c)?"":"disabled"}>@${labels?" Email":""}</button></div>`}
function scoreContact(c){
  let score=0,reasons=[];
  if(hasPhone(c)||hasEmail(c)){score+=10;reasons.push(["Valid contact info",10])}
  const tf={"Now — 0–3 months":22,"3–6 months":15,"6–12 months":8,"12+ months":3,"Unknown":0}[c.timeframe]||0;if(tf){score+=tf;reasons.push(["Timeframe",tf])}
  const heat={Hot:22,Warm:12,Cold:4}[c.heat]||0;score+=heat;reasons.push([`${c.heat} relationship`,heat]);
  const ds=daysSince(c.lastCommunication);const communication=ds<=3?18:ds<=7?12:ds<=14?5:0;if(communication){score+=communication;reasons.push(["Recent communication",communication])}
  const advanced=["Listing Appointment","Listing Agreement Signed","Active Listing","Buyer Consultation","Pre-Approved","Touring Homes","Offer Submitted","Under Contract"].includes(c.stage)?18:0;if(advanced){score+=advanced;reasons.push(["Pipeline progress",advanced])}
  const recentBehaviors=(c.behaviors||[]).filter(b=>daysSince(b.date)<=14);const high=recentBehaviors.filter(b=>["Saved Property","Repeated Property View","Requested Showing","Home Valuation","Clicked Property Alert"].includes(b.type)).length;const behavior=Math.min(20,high*7);if(behavior){score+=behavior;reasons.push(["High-intent behavior",behavior])}
  return {score:Math.min(100,score),reasons:reasons.sort((a,b)=>b[1]-a[1])}
}
function scoreClass(n){return n>=70?"high":n>=40?"mid":"low"}
function dueContacts(){return db.contacts.filter(c=>isOpen(c)&&c.followUp&&c.followUp<=TODAY())}
function overdueTasks(){return db.tasks.filter(t=>t.status!=="Done"&&t.due<TODAY())}
function callQueue(){
  const taskContacts=db.tasks.filter(t=>t.status!=="Done"&&t.type==="Call"&&t.due<=TODAY()).map(t=>({c:contact(t.contactId),task:t})).filter(x=>x.c&&hasPhone(x.c));
  const ids=new Set(taskContacts.map(x=>x.c.id));
  dueContacts().filter(c=>hasPhone(c)&&!ids.has(c.id)).forEach(c=>taskContacts.push({c,task:null}));
  return taskContacts.sort((a,b)=>{
    const w=x=>(x.c.type==="Seller"?20:0)+(x.c.heat==="Hot"?15:0)+scoreContact(x.c).score;
    return w(b)-w(a)
  })
}
function bestNext(){
  const hotSeller=dueContacts().filter(c=>c.type==="Seller"&&c.heat==="Hot").sort((a,b)=>scoreContact(b).score-scoreContact(a).score)[0];
  if(hotSeller)return {title:`Call ${fullName(hotSeller)}`,detail:"Your highest-value due seller relationship is waiting.",route:`#/contact/${hotSeller.id}`,action:"Open seller"};
  const unread=db.communications.find(x=>x.unread);
  if(unread){const c=contact(unread.contactId);return {title:`Reply to ${c?fullName(c):"an unread conversation"}`,detail:"Inbox zero protects response time and relationships.",route:"#/inbox",action:"Open inbox"}}
  const due=dueContacts()[0];if(due)return {title:`Follow up with ${fullName(due)}`,detail:"The next step already exists—complete it.",route:`#/contact/${due.id}`,action:"Open contact"};
  const over=overdueTasks()[0];if(over)return {title:over.title,detail:"Finish the overdue commitment before adding more work.",route:"#/tasks",action:"Open tasks"};
  if(!db.contacts.length)return {title:"Add the first 10 people you genuinely know",detail:"A useful CRM begins with real relationships, not empty dashboards.",route:"#/people",action:"Add people"};
  return {title:"Create one new seller conversation",detail:"Listings are the leverage engine. Start with a homeowner in your sphere.",route:"#/people",action:"Open people"}
}


function goalMetrics(){
  const closed=db.contacts.filter(c=>c.stage==="Closed");
  const closedGci=closed.reduce((sum,c)=>sum+c.gci,0);
  const target=Number(db.settings.annualGciTarget||100000);
  const sellers=db.contacts.filter(c=>c.type==="Seller").length;
  const leadTotal=db.contacts.filter(c=>["Seller","Buyer"].includes(c.type)).length;
  const sellerShare=leadTotal?Math.round(sellers/leadTotal*100):0;
  const communicationsToday=db.communications.filter(m=>String(m.date).slice(0,10)===TODAY()).length;
  return {closedGci,target,gciPct:Math.min(100,target?Math.round(closedGci/target*100):0),sellerShare,communicationsToday}
}
function holtonPlanHtml(){
  const g=goalMetrics(),target=Number(db.settings.dailyConversationTarget||5);
  const sellerCalls=db.communications.filter(m=>String(m.date).slice(0,10)===TODAY()&&contact(m.contactId)?.type==="Seller").length;
  const followUpsDone=db.tasks.filter(t=>t.completedAt===TODAY()&&["Follow Up","Call","Text","Email"].includes(t.type)).length;
  return `<section class="holton-plan card card-pad">
    <div class="card-head"><div><h2>Holton Homes daily scoreboard</h2><small>Seller-first, buyer-ready. Real conversations—not busywork.</small></div><span class="market-pill">${esc(db.settings.coreMarkets||"Your market")}</span></div>
    <div class="goal-grid">
      <div class="goal-box"><label>Conversations today</label><strong>${g.communicationsToday}/${target}</strong><div class="goal-track"><span style="width:${Math.min(100,g.communicationsToday/Math.max(1,target)*100)}%"></span></div></div>
      <div class="goal-box"><label>Seller conversations</label><strong>${sellerCalls}</strong><small>Listings create leverage</small></div>
      <div class="goal-box"><label>Follow-ups completed</label><strong>${followUpsDone}</strong><small>Protect the pipeline</small></div>
      <div class="goal-box"><label>Seller share</label><strong>${g.sellerShare}%</strong><small>Goal ${Number(db.settings.sellerShareGoal||60)}%</small></div>
      <div class="goal-box"><label>Closed GCI</label><strong>${money(g.closedGci)}</strong><div class="goal-track"><span style="width:${g.gciPct}%"></span></div><small>${g.gciPct}% of ${money(g.target)}</small></div>
    </div>
    <div class="personal-actions">
      <button class="quick seller-action" data-action="open-contact-type" data-id="Seller">＋ Add seller</button>
      <button class="quick buyer-action" data-action="open-contact-type" data-id="Buyer">＋ Add buyer</button>
      <button class="quick sphere-action" data-action="open-contact-type" data-id="Sphere">＋ Add sphere</button>
      <a class="quick" href="#/call-queue">Start call queue</a>
    </div>
  </section>`
}

function renderToday(){
  const open=db.contacts.filter(isOpen),sellers=open.filter(c=>c.type==="Seller"),buyers=open.filter(c=>c.type==="Buyer"),due=dueContacts(),unread=db.communications.filter(x=>x.unread),openTasks=db.tasks.filter(t=>t.status!=="Done"),gci=open.reduce((sum,c)=>sum+c.gci,0),next=bestNext();
  const queue=[...due].sort((a,b)=>(b.type==="Seller")-(a.type==="Seller")||scoreContact(b).score-scoreContact(a).score).slice(0,7);
  document.getElementById("view").innerHTML=
    backupWarningHtml() +
    pageHead("Daily operating system",`Good ${new Date().getHours()<12?"morning":new Date().getHours()<17?"afternoon":"evening"}, ${db.settings.agentName||"Jacob"}`,"Work the right relationships before marketing or admin.",`<button class="ghost-btn" data-action="seed-demo">Load sample data</button><button class="primary-btn" data-action="open-contact">＋ Add person</button>`) +
    `<section class="focus-card"><div><label>ONE THING NOW</label><h2>${esc(next.title)}</h2><p>${esc(next.detail)}</p></div><a class="primary-btn" href="${next.route}">${esc(next.action)} →</a></section>
    ${holtonPlanHtml()}
    <section class="metric-grid">
      <div class="metric"><label>Follow-ups due</label><strong>${due.length}</strong><small>Today and overdue</small></div>
      <div class="metric"><label>Unread messages</label><strong>${unread.length}</strong><small>Inbox conversations</small></div>
      <div class="metric"><label>Hot sellers</label><strong>${sellers.filter(c=>c.heat==="Hot").length}</strong><small>Listing opportunities</small></div>
      <div class="metric"><label>Active buyers</label><strong>${buyers.filter(c=>!["New","Attempted Contact","Contacted","Nurture"].includes(c.stage)).length}</strong><small>Consultation or beyond</small></div>
      <div class="metric"><label>Projected GCI</label><strong>${money(gci)}</strong><small>Open pipeline</small></div>
    </section>
    <div class="grid two">
      <section class="card"><div class="card-pad card-head"><div><h2>Who needs you today</h2><small>FUB-style relationship queue: stage + last communication + next follow-up.</small></div><a class="ghost-btn compact" href="#/people">All people</a></div>
        <div class="queue">${queue.length?queue.map(c=>queueRow(c)).join(""):`<div class="empty">Your follow-up list is clear. Create a seller conversation.</div>`}</div>
      </section>
      <section class="grid">
        <div class="card card-pad"><div class="card-head"><div><h2>Behavior alerts</h2><small>High-intent activity worth acting on.</small></div><a class="ghost-btn compact" href="#/activity">All activity</a></div>${behaviorAlertsHtml(5)}</div>
        <div class="card card-pad"><div class="card-head"><div><h2>Execution</h2><small>Today’s promises and call queue.</small></div></div>
          <div class="queue">
            <div class="queue-row"><span class="avatar">☎</span><div><strong>Call Queue</strong><small>${callQueue().length} due calls ready</small></div><a class="ghost-btn compact" href="#/call-queue">Start</a></div>
            <div class="queue-row"><span class="avatar">✓</span><div><strong>Open tasks</strong><small>${openTasks.length} actions waiting</small></div><a class="ghost-btn compact" href="#/tasks">Work</a></div>
          </div>
        </div>
      </section>
    </div>`;
}
function queueRow(c){
  const s=scoreContact(c);return `<div class="queue-row">${avatar(c)}<div><strong><a href="#/contact/${c.id}">${esc(fullName(c))}</a></strong><small>${esc(c.type)} • ${esc(c.stage)} • ${c.followUp?`Follow up ${dateLabel(c.followUp)}`:"No next step"} • Score ${s.score}</small></div>${contactQuickActions(c)}</div>`
}
function behaviorAlerts(){
  const alerts=[];
  db.contacts.forEach(c=>(c.behaviors||[]).forEach(b=>{
    const weight={"Requested Showing":100,"Home Valuation":95,"Repeated Property View":80,"Saved Property":70,"Clicked Property Alert":60}[b.type]||0;
    if(weight&&daysSince(b.date)<=30)alerts.push({c,b,weight})
  }));
  return alerts.sort((a,b)=>b.weight-a.weight||String(b.b.date).localeCompare(String(a.b.date)))
}
function behaviorAlertsHtml(limit=10){
  const alerts=behaviorAlerts().slice(0,limit);
  return alerts.length?`<div class="queue">${alerts.map(({c,b})=>`<div class="queue-row"><span class="avatar">◉</span><div><strong><a href="#/contact/${c.id}">${esc(fullName(c))}</a></strong><small>${esc(b.type)}${b.property?` • ${esc(b.property)}`:""} • ${dateLabel(b.date)}</small></div><button class="quick call" data-action="communicate" data-channel="Call" data-id="${c.id}">Call</button></div>`).join("")}</div>`:`<div class="empty">No high-intent website activity logged yet.</div>`
}

function smartLists(){
  const open=db.contacts.filter(isOpen);
  return [
    {id:"all",name:"All People",items:db.contacts},
    {id:"new",name:"New Leads",items:open.filter(c=>c.stage==="New"||c.stage==="Attempted Contact")},
    {id:"due",name:"Follow-Up Due",items:dueContacts()},
    {id:"hot-sellers",name:"Hot Sellers",items:open.filter(c=>c.type==="Seller"&&c.heat==="Hot")},
    {id:"active-buyers",name:"Active Buyers",items:open.filter(c=>c.type==="Buyer"&&!["New","Attempted Contact","Contacted","Nurture"].includes(c.stage))},
    {id:"stale",name:"No Contact 7+ Days",items:open.filter(c=>daysSince(c.lastCommunication)>=7)},
    {id:"cleanup",name:"Needs Cleanup",items:open.filter(c=>!c.followUp||(!hasPhone(c)&&!hasEmail(c))||c.timeframe==="Unknown")},
    {id:"high-intent",name:"High Intent",items:open.filter(c=>scoreContact(c).score>=70)}
  ];
}
function filteredPeople(){
  const list=smartLists().find(x=>x.id===state.smartList)?.items||db.contacts;
  const q=state.peopleQuery.toLowerCase();
  return list.filter(c=>{
    const blob=[fullName(c),c.phone,c.email,c.property,c.source,...c.tags].join(" ").toLowerCase();
    return (!q||blob.includes(q))&&(!state.peopleType||c.type===state.peopleType)&&(!state.peopleStage||c.stage===state.peopleStage)&&(!state.peopleHeat||c.heat===state.peopleHeat)
  }).sort((a,b)=>(a.followUp||"9999").localeCompare(b.followUp||"9999"))
}
function renderPeople(){
  const lists=smartLists(),people=filteredPeople();
  document.getElementById("view").innerHTML=
    pageHead("Relationship database","People","Smart Lists tell you who to call; the contact profile tells you what to say.",`<button class="primary-btn" data-action="open-contact">＋ Add person</button>`) +
    `<div class="people-layout">
      <aside class="smart-sidebar"><h3>Smart Lists</h3>${lists.map(x=>`<button class="smart-list-btn ${x.id===state.smartList?"active":""}" data-action="smart-list" data-id="${x.id}"><span>${esc(x.name)}</span><b>${x.items.length}</b></button>`).join("")}</aside>
      <section>
        <div class="toolbar">
          <input id="peopleSearch" value="${esc(state.peopleQuery)}" placeholder="Search name, phone, email, property, source, or tag">
          <select id="peopleType"><option value="">All types</option>${["Seller","Buyer","Sphere","Past Client"].map(x=>`<option ${state.peopleType===x?"selected":""}>${x}</option>`).join("")}</select>
          <select id="peopleStage"><option value="">All stages</option>${[...new Set([...sellerStages,...buyerStages])].map(x=>`<option ${state.peopleStage===x?"selected":""}>${x}</option>`).join("")}</select>
          <select id="peopleHeat"><option value="">All heat</option>${["Hot","Warm","Cold"].map(x=>`<option ${state.peopleHeat===x?"selected":""}>${x}</option>`).join("")}</select>
          <button class="ghost-btn compact" data-action="clear-people">Clear</button>
        </div>
        <div class="table-wrap"><table><thead><tr><th>Person</th><th>Type</th><th>Stage</th><th>Score</th><th>Last Communication</th><th>Next Follow-Up</th><th>Source</th><th>Projected GCI</th><th>Quick Actions</th></tr></thead>
        <tbody>${people.length?people.map(personRow).join(""):`<tr><td colspan="9"><div class="empty">No people match this list.</div></td></tr>`}</tbody></table></div>
      </section>
    </div>`;
}
function personRow(c){const s=scoreContact(c);return `<tr>
  <td><div class="contact-cell">${avatar(c)}<div><button data-action="open-profile" data-id="${c.id}">${esc(fullName(c))}</button><small>${esc(c.phone||"No phone")}${c.email?` • ${esc(c.email)}`:" • No email"}</small></div></div></td>
  <td><span class="badge ${c.type.toLowerCase().replace(" ","-")}">${esc(c.type)}</span></td><td>${esc(c.stage)}</td>
  <td><span class="score ${scoreClass(s.score)}">${s.score}</span></td><td>${c.lastCommunication?dateLabel(c.lastCommunication):"Never"}</td>
  <td class="${c.followUp&&c.followUp<TODAY()?"overdue":""}">${dateLabel(c.followUp)}</td><td>${esc(c.source)}</td><td>${money(c.gci)}</td><td>${contactQuickActions(c)}</td></tr>`}

function threads(){
  const map=new Map();
  db.communications.forEach(m=>{
    if(!map.has(m.contactId))map.set(m.contactId,[]);
    map.get(m.contactId).push(m)
  });
  return [...map.entries()].map(([contactId,messages])=>{
    messages.sort((a,b)=>String(a.date).localeCompare(String(b.date)));
    const last=messages.at(-1),c=contact(contactId);
    return {contact:c,messages,last,unread:messages.some(x=>x.unread),status:last?.threadStatus||"open"}
  }).filter(x=>x.contact).sort((a,b)=>String(b.last.date).localeCompare(String(a.last.date)))
}
function renderInbox(){
  let list=threads();
  if(state.inboxFolder==="unread")list=list.filter(t=>t.unread);
  if(state.inboxFolder==="open")list=list.filter(t=>t.status!=="closed");
  if(state.inboxFolder==="closed")list=list.filter(t=>t.status==="closed");
  if(!state.activeThread||!list.some(x=>x.contact.id===state.activeThread))state.activeThread=list[0]?.contact.id||null;
  const active=list.find(x=>x.contact.id===state.activeThread);
  document.getElementById("view").innerHTML=
    pageHead("Conversation command center","Inbox","Calls, texts, emails, and notes in one relationship-focused workflow.",`<button class="ghost-btn" data-action="inbox-zero">Mark all read</button>`) +
    `<div class="inbox-layout">
      <aside class="inbox-folders">${[["open","Open",threads().filter(t=>t.status!=="closed").length],["unread","Unread",threads().filter(t=>t.unread).length],["all","All",threads().length],["closed","Closed",threads().filter(t=>t.status==="closed").length]].map(([id,label,count])=>`<button class="folder-btn ${state.inboxFolder===id?"active":""}" data-action="inbox-folder" data-id="${id}"><span>${label}</span><b>${count}</b></button>`).join("")}</aside>
      <section class="thread-list">${list.length?list.map(t=>`<article class="thread ${t.unread?"unread":""} ${active?.contact.id===t.contact.id?"active":""}" data-action="open-thread" data-id="${t.contact.id}"><div class="thread-top"><strong>${esc(fullName(t.contact))}</strong><time>${dateTimeLabel(t.last.date)}</time></div><p>${esc(t.last.body||`${t.last.channel} • ${t.last.outcome}`)}</p></article>`).join(""):`<div class="empty">Inbox zero. No conversations here.</div>`}</section>
      ${active?conversationHtml(active):`<section class="conversation"><div class="empty">Select a conversation.</div></section>`}
    </div>`;
}
function conversationHtml(thread){
  thread.messages.forEach(m=>m.unread=false);save();
  return `<section class="conversation"><div class="conversation-head"><div><strong><a href="#/contact/${thread.contact.id}">${esc(fullName(thread.contact))}</a></strong><small style="display:block;color:var(--muted);font-size:8px">${esc(thread.contact.stage)} • ${esc(thread.contact.phone||thread.contact.email)}</small></div><div class="row-actions">${contactQuickActions(thread.contact)}<button class="quick" data-action="toggle-thread" data-id="${thread.contact.id}">${thread.status==="closed"?"Reopen":"Close"}</button></div></div>
  <div class="messages">${thread.messages.map(m=>`<div class="message ${m.direction==="outbound"?"outbound":""}"><b>${esc(m.channel)}${m.outcome?` • ${esc(m.outcome)}`:""}</b><div>${esc(m.body||"No details")}</div><small>${dateTimeLabel(m.date)}</small></div>`).join("")}</div>
  <div class="composer"><textarea id="inboxReply" placeholder="Write a text reply or relationship note..."></textarea><div class="composer-row"><select id="inboxChannel"><option>Text</option><option>Email</option><option>Note</option></select><button class="primary-btn compact" data-action="send-inbox-reply" data-id="${thread.contact.id}">Launch & log</button></div></div></section>`
}


function scoreLabel(score){return score>=70?"High":score>=40?"Medium":"Low"}
function scoreImprovement(c){
  const ideas=[];
  if(!c.lastCommunication)ideas.push("Log the first real conversation");
  else if(daysSince(c.lastCommunication)>=7)ideas.push("Reconnect after a week of silence");
  if(c.timeframe==="Unknown")ideas.push("Confirm timing");
  if(!c.followUp)ideas.push("Schedule the next follow-up");
  if(!c.property)ideas.push(c.type==="Buyer"?"Confirm target area and payment":"Confirm property or neighborhood");
  if((c.behaviors||[]).length===0&&["Buyer","Seller"].includes(c.type))ideas.push("Add property or market activity");
  return ideas.slice(0,3);
}
function nextActionFor(c,tasks){
  const nextTask=tasks.find(t=>t.status!=="Done");
  if(nextTask)return {title:nextTask.title,due:nextTask.due,channel:nextTask.type==="Follow Up"?(hasPhone(c)?"Call":"Email"):nextTask.type,taskId:nextTask.id};
  if(!c.lastCommunication){
    if(c.type==="Sphere"||c.type==="Past Client")return {title:"Send a personal introduction and ask about their real estate plans",due:c.followUp||TODAY(),channel:hasPhone(c)?"Text":"Email",taskId:""};
    if(c.type==="Seller")return {title:"Call to confirm motivation, property, and selling timeline",due:c.followUp||TODAY(),channel:"Call",taskId:""};
    if(c.type==="Buyer")return {title:"Call to confirm financing, payment goal, and target area",due:c.followUp||TODAY(),channel:"Call",taskId:""};
  }
  if(c.followUp)return {title:`Complete scheduled follow-up with ${fullName(c)}`,due:c.followUp,channel:hasPhone(c)?"Call":"Email",taskId:""};
  return {title:"Create the next meaningful touch",due:TODAY(),channel:hasPhone(c)?"Call":"Email",taskId:""};
}
function typeSpecificHtml(c){
  if(c.type==="Seller"){
    const d=c.sellerDetails||{};
    return `${detail("Property",c.property||"Not set")}${detail("Estimated value",d.estimatedValue?money(d.estimatedValue):"Unknown")}${detail("Motivation",d.motivation||"Unknown")}${detail("Mortgage balance",d.mortgageBalance?money(d.mortgageBalance):"Unknown")}${detail("Condition",d.condition||"Unknown")}${detail("Decision makers",d.decisionMakers||"Unknown")}`;
  }
  if(c.type==="Buyer"){
    const d=c.buyerDetails||{};
    return `${detail("Preapproval",d.preapproval||"Unknown")}${detail("Lender",d.lender||"Not set")}${detail("Budget",d.budget?money(d.budget):"Unknown")}${detail("Desired payment",d.desiredPayment?money(d.desiredPayment):"Unknown")}${detail("Areas",d.areas||c.property||"Not set")}${detail("Beds / baths",[d.beds,d.baths].filter(Boolean).join(" / ")||"Unknown")}${detail("Lease expiration",d.leaseExpiration?dateLabel(d.leaseExpiration):"Not set")}`;
  }
  const d=c.sphereDetails||{};
  return `${detail("Relationship",d.relationship||"Not set")}${detail("Homeowner",d.homeowner||"Unknown")}${detail("Neighborhood",d.neighborhood||c.property||"Not set")}${detail("Likely opportunity",d.likelyOpportunity||"Unknown")}${detail("Birthday",d.birthday?dateLabel(d.birthday):"Not set")}`;
}
function inlineSelect(field,value,options,id){
  return `<select class="inline-select" data-action="inline-contact-field" data-field="${field}" data-id="${id}">${options.map(x=>`<option ${x===value?"selected":""}>${esc(x)}</option>`).join("")}</select>`;
}
function activityComposer(c){
  return `<div class="activity-composer">
    <div class="composer-title"><div><strong>Log activity</strong><small>Record the touch and schedule the next step without leaving this page.</small></div></div>
    <div class="composer-tabs">${["Note","Call","Text","Email","Appointment"].map((x,i)=>`<button class="composer-tab ${i===0?"active":""}" data-action="composer-channel" data-id="${c.id}" data-channel="${x}">${x}</button>`).join("")}</div>
    <input type="hidden" id="profileComposerChannel" value="Note">
    <div class="composer-fields">
      <select id="profileComposerDirection"><option value="outbound">Outbound</option><option value="inbound">Inbound</option></select>
      <select id="profileComposerOutcome"><option>Connected</option><option>Replied</option><option>Left Voicemail</option><option>No Answer</option><option>Appointment Set</option><option>Follow-Up Needed</option><option>Completed</option></select>
      <input id="profileComposerFollowUp" type="date" value="${addDays(TODAY(),3)}" title="Next follow-up">
    </div>
    <textarea id="profileComposerBody" placeholder="Add context, what they said, motivation, objections, and the next step..."></textarea>
    <div class="composer-footer"><span>Next follow-up is required for open leads.</span><div><button class="ghost-btn compact" data-action="launch-inline-channel" data-id="${c.id}">Launch</button><button class="primary-btn compact" data-action="save-inline-activity" data-id="${c.id}">Save & log</button></div></div>
  </div>`;
}
function contactEmptyTimeline(c){
  const recommended=c.type==="Seller"?"Call to learn motivation and timeline":c.type==="Buyer"?"Call to learn financing and payment goal":"Send a personal introduction";
  return `<div class="actionable-empty"><strong>No communication logged yet.</strong><p>Start the relationship instead of leaving an empty timeline.</p><div class="row-actions">${contactQuickActions(c,true)}<button class="quick" data-action="open-note" data-id="${c.id}">＋ Note</button></div><small>Recommended: ${esc(recommended)}</small></div>`;
}

function renderContact(id){
  const c=contact(id);if(!c){location.hash="#/people";return}
  const s=scoreContact(c),
    comms=db.communications.filter(x=>x.contactId===id).sort((a,b)=>String(b.date).localeCompare(String(a.date))),
    tasks=db.tasks.filter(x=>x.contactId===id&&x.status!=="Done").sort((a,b)=>a.due.localeCompare(b.due)),
    runs=db.planRuns.filter(x=>x.contactId===id),
    next=nextActionFor(c,tasks),
    improvements=scoreImprovement(c),
    summary=contactSummary(c,s);
  const stages=c.type==="Buyer"?buyerStages:sellerStages;
  document.getElementById("view").innerHTML=
    backupWarningHtml() +
    `<section class="contact-hero">
      <div class="contact-identity">${avatar(c)}<div>
        <div class="eyebrow">${esc(c.type)} CONTACT</div>
        <h1>${esc(fullName(c))}</h1>
        <div class="contact-lines">
          ${hasPhone(c)?`<a href="tel:${esc(c.phone.replace(/[^\d+]/g,""))}">${esc(c.phone)}</a>`:`<span class="missing">No phone</span>`}
          <span>•</span>
          ${hasEmail(c)?`<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>`:`<span class="missing">No email</span>`}
        </div>
        <div class="inline-fields">
          <span class="field-label">Stage ${inlineSelect("stage",c.stage,stages,c.id)}</span>
          <span class="field-label">Heat ${inlineSelect("heat",c.heat,["Hot","Warm","Cold"],c.id)}</span>
          <span class="field-label">Source ${inlineSelect("source",c.source,sources,c.id)}</span>
          <span class="field-label">Timeframe ${inlineSelect("timeframe",c.timeframe,["Now — 0–3 months","3–6 months","6–12 months","12+ months","Unknown"],c.id)}</span>
        </div>
      </div></div>
      <div class="hero-actions">${contactQuickActions(c,true)}<button class="quick note-large" data-action="open-note" data-id="${c.id}">＋ Note</button><button class="ghost-btn compact" data-action="open-contact" data-id="${c.id}">Edit</button></div>
    </section>

    <section class="next-action-strip">
      <div class="next-action-copy"><span>NEXT ACTION</span><strong>${esc(next.title)}</strong><small class="${next.due<TODAY()?"overdue":""}">${next.due===TODAY()?"Due today":`Due ${dateLabel(next.due)}`}</small></div>
      <div class="next-action-buttons">
        <button class="primary-btn" data-action="complete-next-action" data-id="${c.id}" data-channel="${esc(next.channel)}" data-task="${esc(next.taskId)}">Complete & log</button>
        <button class="ghost-btn" data-action="reschedule-contact" data-id="${c.id}">Reschedule</button>
      </div>
    </section>

    <div class="contact-workspace">
      <main class="contact-main">
        <section class="what-matters">
          <div><div class="eyebrow">WHAT MATTERS</div><p>${esc(summary)}</p></div>
          <div class="score-block"><span class="score ${scoreClass(s.score)}">${s.score}</span><div><strong>${scoreLabel(s.score)} score</strong><small>${improvements.length?`Improve it: ${esc(improvements.join(" • "))}`:"Strong relationship data and activity."}</small></div></div>
        </section>

        ${activityComposer(c)}

        <section class="timeline-card">
          <div class="section-head"><div><h2>Communication timeline</h2><p>Calls, texts, emails, notes, appointments, tasks, and property activity.</p></div><button class="ghost-btn compact" data-action="open-communication" data-id="${c.id}" data-channel="Note">Open full logger</button></div>
          <div class="timeline">${timelineHtml(c,comms,tasks)}</div>
        </section>
      </main>

      <aside class="contact-sidebar">
        <details class="compact-panel" open><summary>Contact & lead details <span>Edit inline above</span></summary><div class="compact-body detail-grid">
          ${detail("Phone",c.phone||"Missing")}${detail("Email",c.email||"Missing")}${detail("Next follow-up",dateLabel(c.followUp))}${detail("Last communication",c.lastCommunication?dateLabel(c.lastCommunication):"Never")}${detail("Projected GCI",money(c.gci))}${detail("Tags",c.tags.length?c.tags.map(t=>`#${t}`).join(" "):"None")}
        </div></details>

        <details class="compact-panel" open><summary>${c.type==="Seller"?"Seller opportunity":c.type==="Buyer"?"Buyer criteria":"Sphere relationship"} <span>${esc(c.type)}</span></summary><div class="compact-body detail-grid">${typeSpecificHtml(c)}</div></details>

        <details class="compact-panel" open><summary>Upcoming tasks <span>${tasks.length}</span></summary><div class="compact-body">
          ${tasks.length?tasks.slice(0,5).map(t=>`<div class="sidebar-task"><input type="checkbox" data-action="complete-task" data-id="${t.id}"><div><strong>${esc(t.title)}</strong><small>${esc(t.type)} • ${dateLabel(t.due)}</small></div></div>`).join(""):`<div class="compact-empty"><span>No open tasks.</span><button class="ghost-btn compact" data-action="open-task" data-id="${c.id}">＋ Add task</button></div>`}
          ${tasks.length?`<button class="ghost-btn compact full-width" data-action="open-task" data-id="${c.id}">＋ Add another task</button>`:""}
        </div></details>

        <details class="compact-panel"><summary>Property activity & alerts <span>${(c.behaviors||[]).length}</span></summary><div class="compact-body">
          ${(c.behaviors||[]).length?(c.behaviors||[]).slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,4).map(b=>`<div class="side-activity"><div><strong>${esc(b.type)}</strong><small>${esc(b.property||b.details||"")}</small></div><span>${dateLabel(b.date)}</span></div>`).join(""):`<div class="compact-empty"><span>No property activity recorded.</span><button class="ghost-btn compact" data-action="open-behavior" data-id="${c.id}">＋ Add activity</button></div>`}
          <button class="ghost-btn compact full-width" data-action="open-alerts" data-id="${c.id}">${c.alertSettings.propertyAlert||c.alertSettings.marketSnapshot?"Manage alerts":"Set property / market alert"}</button>
        </div></details>

        <details class="compact-panel"><summary>Action plans <span>${runs.length}</span></summary><div class="compact-body">
          ${runs.length?runs.map(run=>{const p=plans.find(x=>x.id===run.planId);return `<div class="side-activity"><div><strong>${esc(p?.name||"Plan")}</strong><small>Started ${dateLabel(run.startedAt)}</small></div><span class="badge ${run.status==="Active"?"good":"warn"}">${esc(run.status)}</span></div>`}).join(""):`<div class="compact-empty"><span>No active action plan.</span><button class="ghost-btn compact" data-action="apply-plan" data-id="${c.id}">Apply plan</button></div>`}
        </div></details>

        <details class="compact-panel"><summary>Relationship notes <span>${c.notes?"Saved":"Empty"}</span></summary><div class="compact-body notes-copy">${esc(c.notes||"No relationship notes yet.")}</div></details>
      </aside>
    </div>`;
}
function detail(label,value){return `<div class="detail"><label>${esc(label)}</label><strong>${esc(value)}</strong></div>`}
function contactSummary(c,s){
  const first=c.firstName||fullName(c);
  const pieces=[];
  if(!c.lastCommunication)pieces.push(`${first} is a new ${c.type.toLowerCase()} contact with no communication history.`);
  else pieces.push(`${first} is a ${c.heat.toLowerCase()} ${c.type.toLowerCase()} contact currently in ${c.stage}.`);
  if(c.timeframe&&c.timeframe!=="Unknown")pieces.push(`Timing: ${c.timeframe.toLowerCase()}.`);
  else pieces.push("Timing is still unknown.");
  if(c.property)pieces.push(`${c.type==="Buyer"?"Target":"Property"}: ${c.property}.`);
  const high=(c.behaviors||[]).filter(b=>["Requested Showing","Home Valuation","Repeated Property View","Saved Property"].includes(b.type)).sort((a,b)=>String(b.date).localeCompare(String(a.date)))[0];
  if(high)pieces.push(`Recent signal: ${high.type.toLowerCase()}${high.property?` — ${high.property}`:""}.`);
  pieces.push(c.followUp?`Next follow-up: ${dateLabel(c.followUp)}.`:"No next follow-up is scheduled.");
  return pieces.join(" ")
}
function timelineHtml(c,comms,tasks=[]){
  const entries=[
    ...comms.map(m=>({type:m.channel,title:`${m.direction==="inbound"?"Inbound":"Outbound"} ${m.channel}`,body:[m.outcome,m.body].filter(Boolean).join(" • "),date:m.date,status:"activity"})),
    ...(c.behaviors||[]).map(b=>({type:"Behavior",title:b.type,body:b.property||b.details||"",date:`${b.date}T12:00:00`,status:"behavior"})),
    ...tasks.map(t=>({type:"Task",title:t.title,body:`${t.type} • Due ${dateLabel(t.due)}`,date:`${t.due}T08:00:00`,status:"task",taskId:t.id}))
  ].sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  if(!entries.length)return contactEmptyTimeline(c);
  return entries.map(e=>`<div class="timeline-item ${e.status}">
    <span class="timeline-icon">${e.type==="Call"?"☎":e.type==="Text"?"✉":e.type==="Email"?"@":e.type==="Behavior"?"◉":e.type==="Task"?"✓":e.type==="Appointment"?"◆":"✎"}</span>
    <div><strong>${esc(e.title)}</strong><p>${esc(e.body||"No details")}</p></div>
    <div class="timeline-right"><time>${dateTimeLabel(e.date)}</time>${e.taskId?`<button class="mini-complete" data-action="complete-task-button" data-id="${e.taskId}">Complete</button>`:""}</div>
  </div>`).join("")
}

function renderCallQueue(){
  const queue=callQueue();if(state.callIndex>=queue.length)state.callIndex=0;const active=queue[state.callIndex];
  document.getElementById("view").innerHTML=
    pageHead("Lofty-inspired dialing workflow","Call Queue","Work due calls, capture an outcome, and schedule the callback before moving on.",`<button class="ghost-btn" data-action="create-call-tasks">Create from follow-ups</button>`) +
    `<div class="grid two"><section class="card">${queue.length?queue.map((x,i)=>`<div class="queue-row ${i===state.callIndex?"active":""}">${avatar(x.c)}<div><strong><a href="#/contact/${x.c.id}">${esc(fullName(x.c))}</a></strong><small>${esc(x.c.type)} • ${esc(x.c.stage)} • ${x.task?esc(x.task.title):"Follow-up due"} • Score ${scoreContact(x.c).score}</small></div><button class="ghost-btn compact" data-action="select-call" data-index="${i}">Select</button></div>`).join(""):`<div class="empty">No calls due. Add a call task or follow-up date.</div>`}</section>
    <section class="card card-pad">${active?`<div class="card-head"><div><h2>Call ${esc(fullName(active.c))}</h2><small>${esc(active.c.phone)} • ${esc(active.c.stage)}</small></div><span class="score ${scoreClass(scoreContact(active.c).score)}">${scoreContact(active.c).score}</span></div>
      <div class="summary">${esc(contactSummary(active.c,scoreContact(active.c)))}</div>
      <div class="profile-actions" style="margin-top:10px"><button class="quick call" data-action="communicate" data-channel="Call" data-id="${active.c.id}">☎ Launch call</button><button class="quick text" data-action="communicate" data-channel="Text" data-id="${active.c.id}">✉ Text instead</button><a class="quick" href="#/contact/${active.c.id}">Open profile</a></div>
      <div class="warning" style="margin-top:10px">After the call, record Connected, Left Voicemail, No Answer, Appointment Set, or Follow-Up Needed. The CRM will update last communication and create the callback.</div>`:`<div class="empty">Queue complete.</div>`}</section></div>`;
}

function renderPipeline(){
  const stages=state.pipelineType==="Seller"?sellerStages:buyerStages;
  const contacts=db.contacts.filter(c=>c.type===state.pipelineType&&!["Lost"].includes(c.stage));
  document.getElementById("view").innerHTML=
    pageHead("Lead-to-close visibility","Pipeline","Drag cards between stages. Seller and buyer workflows stay separate.",`<button class="${state.pipelineType==="Seller"?"primary-btn":"ghost-btn"}" data-action="pipeline-type" data-id="Seller">Seller</button><button class="${state.pipelineType==="Buyer"?"primary-btn":"ghost-btn"}" data-action="pipeline-type" data-id="Buyer">Buyer</button>`) +
    `<div class="kanban-wrap"><div class="kanban">${stages.map(stage=>{const items=contacts.filter(c=>c.stage===stage);return `<section class="kanban-column" data-stage="${esc(stage)}"><div class="kanban-head"><span>${esc(stage)}</span><b>${items.length}</b></div>${items.map(c=>`<article class="deal-card" draggable="true" data-contact="${c.id}"><strong><a href="#/contact/${c.id}">${esc(fullName(c))}</a></strong><small>${esc(c.property||"No property")} • ${c.lastCommunication?`Last touch ${dateLabel(c.lastCommunication)}`:"Never contacted"}</small><div class="deal-meta"><span>${money(c.gci)}</span><span class="score ${scoreClass(scoreContact(c).score)}">${scoreContact(c).score}</span></div></article>`).join("")}</section>`}).join("")}</div></div>`;
}

function renderTasks(){
  let tasks=[...db.tasks];if(state.taskFilter==="open")tasks=tasks.filter(t=>t.status!=="Done");if(state.taskFilter==="overdue")tasks=tasks.filter(t=>t.status!=="Done"&&t.due<TODAY());if(state.taskFilter==="today")tasks=tasks.filter(t=>t.status!=="Done"&&t.due===TODAY());if(state.taskFilter==="upcoming")tasks=tasks.filter(t=>t.status!=="Done"&&t.due>TODAY());if(state.taskFilter==="done")tasks=tasks.filter(t=>t.status==="Done");tasks.sort((a,b)=>a.due.localeCompare(b.due));
  document.getElementById("view").innerHTML=
    pageHead("Specific commitments","Tasks","Use tasks for promises and transaction deadlines; use Smart Lists for general follow-up.",`<button class="primary-btn" data-action="open-task">＋ Add task</button>`) +
    `<div class="toolbar">${["open","overdue","today","upcoming","done"].map(x=>`<button class="${state.taskFilter===x?"primary-btn":"ghost-btn"} compact" data-action="task-filter" data-id="${x}">${x[0].toUpperCase()+x.slice(1)}</button>`).join("")}</div>
    <section class="card">${tasks.length?tasks.map(t=>{const c=contact(t.contactId);return `<div class="task-row ${t.status==="Done"?"done":""}"><input type="checkbox" ${t.status==="Done"?"checked":""} data-action="complete-task" data-id="${t.id}"><div><strong>${esc(t.title)}</strong><small>${esc(t.type)}${c?` • <a href="#/contact/${c.id}">${esc(fullName(c))}</a>`:""}</small></div><span class="task-date ${t.status!=="Done"&&t.due<TODAY()?"overdue":""}">${dateLabel(t.due)}</span><button class="quick" data-action="delete-task" data-id="${t.id}">×</button></div>`}).join(""):`<div class="empty">No tasks in this view.</div>`}</section>`;
}

function renderAutomations(){
  document.getElementById("view").innerHTML=
    pageHead("Consistent nurturing","Automations","Action plans create tasks and draft touches; reply-based plans pause when a lead responds.",`<button class="ghost-btn" data-action="apply-plan">Apply plan</button>`) +
    `<div class="plan-grid">${plans.map(p=>`<article class="plan-card"><span class="badge ${p.category==="Seller"?"seller":p.category==="Buyer"?"buyer":""}">${esc(p.category)}</span><h3>${esc(p.name)}</h3><p>${esc(p.description)}</p><ol>${p.steps.map(s=>`<li>Day ${s[0]} — ${esc(s[1])}</li>`).join("")}</ol><button class="primary-btn compact" data-action="apply-plan" data-plan="${p.id}">Apply to person</button></article>`).join("")}</div>
    <section class="card card-pad" style="margin-top:10px"><div class="card-head"><div><h2>Running plans</h2><small>Inbound replies automatically pause plans marked pause-on-reply.</small></div></div>${db.planRuns.length?db.planRuns.map(run=>{const c=contact(run.contactId),p=plans.find(x=>x.id===run.planId);return `<div class="run-row"><div><strong>${esc(p?.name||"Plan")} — ${c?`<a href="#/contact/${c.id}">${esc(fullName(c))}</a>`:"Deleted contact"}</strong><small>Started ${dateLabel(run.startedAt)}</small></div><span class="badge ${run.status==="Active"?"good":"warn"}">${esc(run.status)}</span><button class="quick" data-action="toggle-plan-run" data-id="${run.id}">${run.status==="Active"?"Pause":"Resume"}</button></div>`}).join(""):`<div class="empty">No plans are running.</div>`}</section>`;
}

function renderActivity(){
  const entries=[];
  db.communications.forEach(m=>entries.push({date:m.date,kind:m.channel,contact:contact(m.contactId),title:`${m.direction==="inbound"?"Inbound":"Outbound"} ${m.channel}`,detail:[m.outcome,m.body].filter(Boolean).join(" • ")}));
  db.contacts.forEach(c=>(c.behaviors||[]).forEach(b=>entries.push({date:`${b.date}T12:00:00`,kind:"Behavior",contact:c,title:b.type,detail:b.property||b.details||""})));
  entries.sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  document.getElementById("view").innerHTML=
    pageHead("Communication and intent","Activity","A single timeline across calls, texts, emails, notes, and website behavior.",`<button class="primary-btn" data-action="open-communication" data-channel="Note">＋ Log activity</button>`) +
    `<section class="card"><div class="timeline" style="padding:0 12px">${entries.length?entries.map(e=>`<div class="timeline-item"><span class="timeline-icon">${e.kind==="Call"?"☎":e.kind==="Text"?"✉":e.kind==="Email"?"@":e.kind==="Behavior"?"◉":"✎"}</span><div><strong>${e.contact?`<a href="#/contact/${e.contact.id}">${esc(fullName(e.contact))}</a> — `:""}${esc(e.title)}</strong><p>${esc(e.detail||"No details")}</p></div><time>${dateTimeLabel(e.date)}</time></div>`).join(""):`<div class="empty">No activity yet.</div>`}</div></section>`;
}

function renderReports(){
  const open=db.contacts.filter(isOpen),closed=db.contacts.filter(c=>c.stage==="Closed"),communications7=db.communications.filter(m=>daysSince(m.date)<=7),connected=db.communications.filter(m=>m.channel==="Call"&&["Connected","Appointment Set"].includes(m.outcome)).length,calls=db.communications.filter(m=>m.channel==="Call").length;
  const sourceMap={};db.contacts.forEach(c=>{sourceMap[c.source]??={count:0,gci:0};sourceMap[c.source].count++;sourceMap[c.source].gci+=c.gci});
  const stageMap={};db.contacts.forEach(c=>stageMap[c.stage]=(stageMap[c.stage]||0)+1);
  document.getElementById("view").innerHTML=
    pageHead("Business intelligence","Reports","Measure relationship work, pipeline, source performance, and listing focus.") +
    `<section class="metric-grid"><div class="metric"><label>Database</label><strong>${db.contacts.length}</strong><small>Total people</small></div><div class="metric"><label>Seller share</label><strong>${db.contacts.length?Math.round(db.contacts.filter(c=>c.type==="Seller").length/db.contacts.length*100):0}%</strong><small>Listing-focused mix</small></div><div class="metric"><label>Activity this week</label><strong>${communications7.length}</strong><small>Logged touches</small></div><div class="metric"><label>Call connect rate</label><strong>${calls?Math.round(connected/calls*100):0}%</strong><small>Connected or appointment</small></div><div class="metric"><label>Closed GCI</label><strong>${money(closed.reduce((s,c)=>s+c.gci,0))}</strong><small>Recorded closings</small></div></section>
    <div class="grid two"><section class="card card-pad"><div class="card-head"><div><h2>Lead sources</h2><small>People and projected GCI by source.</small></div></div>${barChart(Object.entries(sourceMap).map(([label,v])=>({label,value:v.count,display:`${v.count} • ${money(v.gci)}`})))}</section>
    <section class="card card-pad"><div class="card-head"><div><h2>Stage funnel</h2><small>Where relationships are sitting.</small></div></div>${barChart(Object.entries(stageMap).map(([label,value])=>({label,value,display:value})))}</section></div>
    <div class="grid two" style="margin-top:10px"><section class="card card-pad"><div class="card-head"><div><h2>Open pipeline GCI</h2><small>Seller vs. buyer opportunity.</small></div></div>${barChart(["Seller","Buyer"].map(type=>({label:type,value:open.filter(c=>c.type===type).reduce((s,c)=>s+c.gci,0),display:money(open.filter(c=>c.type===type).reduce((s,c)=>s+c.gci,0))})))}</section>
    <section class="card card-pad"><div class="card-head"><div><h2>Data health</h2><small>Missing information that weakens follow-up.</small></div></div>${barChart([{label:"No follow-up",value:open.filter(c=>!c.followUp).length},{label:"No phone/email",value:open.filter(c=>!hasPhone(c)&&!hasEmail(c)).length},{label:"Unknown timeframe",value:open.filter(c=>c.timeframe==="Unknown").length},{label:"Stale 14+ days",value:open.filter(c=>daysSince(c.lastCommunication)>=14).length}])}</section></div>`;
}
function barChart(data){const max=Math.max(1,...data.map(x=>Number(x.value)||0));return `<div class="chart">${data.length?data.sort((a,b)=>b.value-a.value).map(x=>`<div class="bar-row"><label>${esc(x.label)}</label><div class="track"><div class="fill" style="width:${Math.max(2,(Number(x.value)||0)/max*100)}%"></div></div><b>${esc(x.display??x.value)}</b></div>`).join(""):`<div class="empty">No data yet.</div>`}</div>`}

function renderSettings(){
  document.getElementById("view").innerHTML=
    pageHead("Data and preferences","Settings","Manage agent details, backups, and browser storage.") +
    `<div class="settings-grid">
      <section class="setting-card"><h3>Agent profile</h3><p>Used in the daily dashboard and future message templates.</p><div class="field"><label>Agent name</label><input id="settingAgentName" value="${esc(db.settings.agentName||"")}"></div><div class="field" style="margin-top:7px"><label>Email</label><input id="settingAgentEmail" value="${esc(db.settings.agentEmail||"")}"></div><div class="field" style="margin-top:7px"><label>Phone</label><input id="settingAgentPhone" value="${esc(db.settings.agentPhone||"")}"></div><button class="primary-btn compact" style="margin-top:9px" data-action="save-settings">Save</button></section>
      <section class="setting-card"><h3>Export backup</h3><p>Download all contacts, communications, tasks, behavior, and plans.</p><button class="primary-btn compact" data-action="export-json">Export JSON</button><button class="ghost-btn compact" data-action="export-csv">Export people CSV</button></section>
      <section class="setting-card"><h3>Import backup</h3><p>Restore a JSON backup created by this CRM.</p><input id="importFile" type="file" accept=".json"><button class="ghost-btn compact" style="margin-top:9px" data-action="import-json">Import</button></section>
      <section class="setting-card"><h3>Holton Homes goals</h3><p>These targets shape the Today dashboard and keep the CRM focused on production.</p>
        <div class="field"><label>Annual GCI target</label><input id="settingGciTarget" type="number" value="${esc(db.settings.annualGciTarget||100000)}"></div>
        <div class="field" style="margin-top:8px"><label>Seller share goal (%)</label><input id="settingSellerShare" type="number" min="0" max="100" value="${esc(db.settings.sellerShareGoal||60)}"></div>
        <div class="field" style="margin-top:8px"><label>Daily conversation target</label><input id="settingConversationTarget" type="number" min="1" value="${esc(db.settings.dailyConversationTarget||5)}"></div>
        <div class="field" style="margin-top:8px"><label>Core markets</label><textarea id="settingCoreMarkets">${esc(db.settings.coreMarkets||"")}</textarea></div>
        <button class="primary-btn compact" style="margin-top:9px" data-action="save-goals">Save goals</button>
      </section>
      <section class="setting-card"><h3>Data protection</h3><p>Your CRM is stored in this browser and mirrored into a second browser database.</p><div class="warning"><strong>Important:</strong> clearing all site data can still erase both copies. Download JSON backups weekly.</div><button class="ghost-btn compact" style="margin-top:9px" data-action="request-persistent-storage">Protect browser storage</button><div id="storageProtectionStatus" class="storage-status"></div></section>
      <section class="setting-card"><h3>Full-potential upgrade</h3><p>A secure login and cloud database are the next real upgrade—not another cosmetic dashboard.</p><div class="cloud-roadmap"><span>✓ Seller and buyer pipelines</span><span>✓ Communication workflow</span><span>✓ Browser recovery mirror</span><span>○ Secure login</span><span>○ Cloud database</span><span>○ Phone and email sync</span></div></section>
      <section class="setting-card"><h3>Reset</h3><p>Delete all CRM data stored in this browser.</p><button class="danger-btn compact" data-action="clear-data">Clear everything</button></section>
    </div>`;
}

function modal(title,body,footer){const backdrop=document.getElementById("modalBackdrop"),el=document.getElementById("modal");el.innerHTML=`<div class="modal-head"><h2>${esc(title)}</h2><button class="icon-btn" data-action="close-modal">×</button></div><div class="modal-body">${body}</div><div class="modal-foot">${footer||`<button class="ghost-btn" data-action="close-modal">Close</button>`}</div>`;backdrop.classList.add("open")}
function closeModal(){document.getElementById("modalBackdrop").classList.remove("open")}
function contactOptions(selected=""){return `<option value="">Choose person</option>${db.contacts.slice().sort((a,b)=>fullName(a).localeCompare(fullName(b))).map(c=>`<option value="${c.id}" ${c.id===selected?"selected":""}>${esc(fullName(c))}</option>`).join("")}`}


function contactSpecificForm(c,type){
  if(type==="Seller"){
    const d=c.sellerDetails||{};
    return `<div class="field full section-label">Seller opportunity</div>
      <div class="field"><label>Motivation</label><input id="sellerMotivation" value="${esc(d.motivation||"")}"></div>
      <div class="field"><label>Estimated value</label><input id="sellerEstimatedValue" type="number" value="${esc(d.estimatedValue||"")}"></div>
      <div class="field"><label>Mortgage balance</label><input id="sellerMortgageBalance" type="number" value="${esc(d.mortgageBalance||"")}"></div>
      <div class="field"><label>Condition</label><input id="sellerCondition" value="${esc(d.condition||"")}"></div>
      <div class="field full"><label>Decision makers</label><input id="sellerDecisionMakers" value="${esc(d.decisionMakers||"")}"></div>`;
  }
  if(type==="Buyer"){
    const d=c.buyerDetails||{};
    return `<div class="field full section-label">Buyer criteria</div>
      <div class="field"><label>Preapproval</label><select id="buyerPreapproval">${["Unknown","Not Started","In Progress","Pre-Approved","Cash"].map(x=>`<option ${d.preapproval===x?"selected":""}>${x}</option>`).join("")}</select></div>
      <div class="field"><label>Lender</label><input id="buyerLender" value="${esc(d.lender||"")}"></div>
      <div class="field"><label>Budget</label><input id="buyerBudget" type="number" value="${esc(d.budget||"")}"></div>
      <div class="field"><label>Desired monthly payment</label><input id="buyerDesiredPayment" type="number" value="${esc(d.desiredPayment||"")}"></div>
      <div class="field full"><label>Target areas</label><input id="buyerAreas" value="${esc(d.areas||"")}"></div>
      <div class="field"><label>Beds</label><input id="buyerBeds" value="${esc(d.beds||"")}"></div>
      <div class="field"><label>Baths</label><input id="buyerBaths" value="${esc(d.baths||"")}"></div>
      <div class="field"><label>Lease expiration</label><input id="buyerLeaseExpiration" type="date" value="${esc(d.leaseExpiration||"")}"></div>`;
  }
  const d=c.sphereDetails||{};
  return `<div class="field full section-label">Sphere relationship</div>
    <div class="field"><label>Relationship</label><input id="sphereRelationship" value="${esc(d.relationship||"")}" placeholder="Friend, family, neighbor, former coworker"></div>
    <div class="field"><label>Homeowner</label><select id="sphereHomeowner">${["Unknown","Yes","No"].map(x=>`<option ${d.homeowner===x?"selected":""}>${x}</option>`).join("")}</select></div>
    <div class="field"><label>Neighborhood</label><input id="sphereNeighborhood" value="${esc(d.neighborhood||"")}"></div>
    <div class="field"><label>Birthday</label><input id="sphereBirthday" type="date" value="${esc(d.birthday||"")}"></div>
    <div class="field full"><label>Likely opportunity</label><input id="sphereLikelyOpportunity" value="${esc(d.likelyOpportunity||"")}" placeholder="Future seller, buyer, referral source"></div>`;
}

function openContactModal(id=""){
  const c=contact(id)||{},type=c.type||"Seller";
  modal(c.id?"Edit person":"Add person",`<div class="form-grid">
    <input type="hidden" id="contactId" value="${esc(c.id||"")}">
    <div class="field"><label>First name</label><input id="contactFirst" value="${esc(c.firstName||"")}" autocomplete="given-name"></div>
    <div class="field"><label>Last name</label><input id="contactLast" value="${esc(c.lastName||"")}" autocomplete="family-name"></div>
    <div class="field"><label>Phone</label><input id="contactPhone" value="${esc(c.phone||"")}" type="tel"></div>
    <div class="field"><label>Email</label><input id="contactEmail" value="${esc(c.email||"")}" type="email"></div>
    <div class="field"><label>Type</label><select id="contactType">${["Seller","Buyer","Sphere","Past Client"].map(x=>`<option ${type===x?"selected":""}>${x}</option>`).join("")}</select></div>
    <div class="field"><label>Stage</label><select id="contactStage">${(type==="Buyer"?buyerStages:sellerStages).map(x=>`<option ${c.stage===x?"selected":""}>${x}</option>`).join("")}</select></div>
    <div class="field"><label>Heat</label><select id="contactHeat">${["Hot","Warm","Cold"].map(x=>`<option ${c.heat===x?"selected":""}>${x}</option>`).join("")}</select></div>
    <div class="field"><label>Timeframe</label><select id="contactTimeframe">${["Now — 0–3 months","3–6 months","6–12 months","12+ months","Unknown"].map(x=>`<option ${(c.timeframe||"Unknown")===x?"selected":""}>${x}</option>`).join("")}</select></div>
    <div class="field"><label>Next follow-up</label><input id="contactFollowUp" type="date" value="${esc(c.followUp||TODAY())}"></div>
    <div class="field"><label>Source</label><select id="contactSource">${sources.map(x=>`<option ${c.source===x?"selected":""}>${x}</option>`).join("")}</select></div>
    <div class="field"><label>Property / target area</label><input id="contactProperty" value="${esc(c.property||"")}"></div>
    <div class="field"><label>Projected GCI</label><input id="contactGci" type="number" min="0" value="${c.gci||""}"></div>
    <div class="field full"><label>Tags</label><input id="contactTags" value="${esc((c.tags||[]).join(", "))}" placeholder="farm, inherited home, first-time buyer"></div>
    <div id="contactSpecificFields" class="field full specific-fields-grid">${contactSpecificForm(c,type)}</div>
    <div class="field full"><label>Relationship notes</label><textarea id="contactNotes">${esc(c.notes||"")}</textarea></div>
  </div>`,`<button class="ghost-btn" data-action="close-modal">Cancel</button><button class="primary-btn" data-action="save-contact">Save person</button>`);
}
function saveContact(){
  const id=document.getElementById("contactId").value||uid(),firstName=document.getElementById("contactFirst").value.trim(),lastName=document.getElementById("contactLast").value.trim();
  if(!firstName||!lastName){alert("First and last name are required.");return}
  const old=contact(id),type=document.getElementById("contactType").value,stage=document.getElementById("contactStage").value,followUp=document.getElementById("contactFollowUp").value;
  if(["Seller","Buyer"].includes(type)&&!["Closed","Lost"].includes(stage)&&!followUp){alert("Every open seller or buyer needs a next follow-up date.");return}
  const c={id,firstName,lastName,name:`${firstName} ${lastName}`,phone:document.getElementById("contactPhone").value.trim(),email:document.getElementById("contactEmail").value.trim(),type,stage,heat:document.getElementById("contactHeat").value,timeframe:document.getElementById("contactTimeframe").value,followUp,lastCommunication:old?.lastCommunication||"",source:document.getElementById("contactSource").value,gci:Number(document.getElementById("contactGci").value||0),property:document.getElementById("contactProperty").value.trim(),tags:document.getElementById("contactTags").value.split(",").map(x=>x.trim()).filter(Boolean),notes:document.getElementById("contactNotes").value.trim(),createdAt:old?.createdAt||TODAY(),updatedAt:TODAY(),household:old?.household||[],preferences:old?.preferences||{areas:"",minPrice:"",maxPrice:"",beds:"",baths:""},
  sellerDetails:type==="Seller"?{motivation:document.getElementById("sellerMotivation")?.value.trim()||"",estimatedValue:document.getElementById("sellerEstimatedValue")?.value||"",mortgageBalance:document.getElementById("sellerMortgageBalance")?.value||"",condition:document.getElementById("sellerCondition")?.value.trim()||"",decisionMakers:document.getElementById("sellerDecisionMakers")?.value.trim()||""}:(old?.sellerDetails||{motivation:"",estimatedValue:"",mortgageBalance:"",condition:"",decisionMakers:""}),
  buyerDetails:type==="Buyer"?{preapproval:document.getElementById("buyerPreapproval")?.value||"Unknown",lender:document.getElementById("buyerLender")?.value.trim()||"",budget:document.getElementById("buyerBudget")?.value||"",desiredPayment:document.getElementById("buyerDesiredPayment")?.value||"",areas:document.getElementById("buyerAreas")?.value.trim()||"",beds:document.getElementById("buyerBeds")?.value||"",baths:document.getElementById("buyerBaths")?.value||"",leaseExpiration:document.getElementById("buyerLeaseExpiration")?.value||""}:(old?.buyerDetails||{preapproval:"Unknown",lender:"",budget:"",desiredPayment:"",areas:"",beds:"",baths:"",leaseExpiration:""}),
  sphereDetails:["Sphere","Past Client"].includes(type)?{relationship:document.getElementById("sphereRelationship")?.value.trim()||"",homeowner:document.getElementById("sphereHomeowner")?.value||"Unknown",neighborhood:document.getElementById("sphereNeighborhood")?.value.trim()||"",birthday:document.getElementById("sphereBirthday")?.value||"",likelyOpportunity:document.getElementById("sphereLikelyOpportunity")?.value.trim()||""}:(old?.sphereDetails||{relationship:"",birthday:"",neighborhood:"",homeowner:"Unknown",likelyOpportunity:""}),
  alertSettings:old?.alertSettings||{propertyAlert:false,marketSnapshot:false,criteria:"",frequency:"Weekly",lastSent:""},behaviors:old?.behaviors||[]};
  const i=db.contacts.findIndex(x=>x.id===id);if(i>=0)db.contacts[i]=c;else db.contacts.unshift(c);save();closeModal();toast("Person saved",fullName(c));location.hash=`#/contact/${c.id}`
}
function communicationModal(contactId="",channel="Call"){
  const c=contact(contactId);
  modal(`${channel} ${c?fullName(c):"activity"}`,`<div class="channel-tabs">${["Call","Text","Email","Note"].map(x=>`<button class="channel-tab ${channel===x?"active":""}" data-action="switch-channel" data-id="${x}" data-contact="${contactId}">${x}</button>`).join("")}</div>
  <div class="form-grid">
    <div class="field full"><label>Person</label><select id="commContact">${contactOptions(contactId)}</select></div>
    <input type="hidden" id="commChannel" value="${esc(channel)}">
    ${channel==="Call"?`<div class="field"><label>Call outcome</label><select id="commOutcome"><option>Connected</option><option>Left Voicemail</option><option>No Answer</option><option>Appointment Set</option><option>Follow-Up Needed</option></select></div>`:`<div class="field"><label>Direction</label><select id="commDirection"><option value="outbound">Outbound</option><option value="inbound">Inbound</option></select></div>`}
    ${channel==="Email"?`<div class="field"><label>Subject</label><input id="commSubject" placeholder="Follow-up"></div>`:""}
    <div class="field full"><label>${channel==="Note"?"Note":"Message / call notes"}</label><textarea id="commBody" placeholder="${channel==="Text"?"Write the text you want to send...":channel==="Email"?"Write the email body...":"What happened and what matters next?"}"></textarea></div>
    <div class="field"><label>Next follow-up</label><input id="commFollowUp" type="date" value="${addDays(TODAY(),channel==="Call"?2:3)}"></div>
    ${channel==="Call"?`<div class="field"><label>Launch</label><button class="quick call" type="button" data-action="launch-channel" data-channel="Call" data-id="${contactId}">☎ Open phone app</button></div>`:""}
  </div>
  ${["Call","Text","Email"].includes(channel)?`<div class="warning" style="margin-top:9px">This static CRM opens your device’s phone, text, or email app and then logs the activity here. Direct in-app sending requires a phone/email provider integration.</div>`:""}`,
  `<button class="ghost-btn" data-action="close-modal">Cancel</button>${channel!=="Note"?`<button class="ghost-btn" data-action="launch-channel" data-channel="${channel}" data-id="${contactId}">Launch ${channel}</button>`:""}<button class="primary-btn" data-action="save-communication">Save & log</button>`)
}
function saveCommunication(){
  const contactId=document.getElementById("commContact").value,c=contact(contactId),channel=document.getElementById("commChannel").value;if(!c){alert("Choose a person.");return}
  const direction=document.getElementById("commDirection")?.value||"outbound",outcome=document.getElementById("commOutcome")?.value||"",body=document.getElementById("commBody").value.trim(),followUp=document.getElementById("commFollowUp").value;
  db.communications.unshift({id:uid(),contactId,channel,direction,outcome,body,date:NOW(),unread:direction==="inbound",threadStatus:"open",createdAt:NOW()});
  c.lastCommunication=TODAY();if(followUp)c.followUp=followUp;c.updatedAt=TODAY();
  if(direction==="inbound")pauseReplyPlans(contactId);
  if(outcome==="Appointment Set")c.stage=c.type==="Buyer"?"Buyer Consultation":"Listing Appointment";
  if(["No Answer","Left Voicemail","Follow-Up Needed"].includes(outcome)&&followUp)db.tasks.unshift({id:uid(),contactId,title:`Callback: ${fullName(c)}`,type:"Call",due:followUp,status:"Open",priority:"High",planRunId:"",createdAt:TODAY()});
  if(state.pendingTaskId){const pending=task(state.pendingTaskId);if(pending){pending.status="Done";pending.completedAt=TODAY()}state.pendingTaskId=""}
  save();closeModal();toast("Activity logged",`${channel} with ${fullName(c)}`);route()
}
function launchChannel(channel,id){
  const c=contact(id||document.getElementById("commContact")?.value);if(!c)return;
  const body=document.getElementById("commBody")?.value||"",subject=document.getElementById("commSubject")?.value||"Holton Homes follow-up";
  if(channel==="Call"&&hasPhone(c))location.href=`tel:${c.phone.replace(/[^\d+]/g,"")}`;
  if(channel==="Text"&&hasPhone(c))location.href=`sms:${c.phone.replace(/[^\d+]/g,"")}?&body=${encodeURIComponent(body)}`;
  if(channel==="Email"&&hasEmail(c))location.href=`mailto:${c.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
function openTaskModal(contactId=""){
  modal("Add task",`<div class="form-grid"><div class="field full"><label>Task</label><input id="taskTitle"></div><div class="field"><label>Person</label><select id="taskContact">${contactOptions(contactId)}</select></div><div class="field"><label>Type</label><select id="taskType"><option>Follow Up</option><option>Call</option><option>Text</option><option>Email</option><option>Appointment</option><option>Transaction</option><option>Admin</option></select></div><div class="field"><label>Due date</label><input id="taskDue" type="date" value="${TODAY()}"></div><div class="field"><label>Priority</label><select id="taskPriority"><option>Normal</option><option>High</option><option>Low</option></select></div></div>`,`<button class="ghost-btn" data-action="close-modal">Cancel</button><button class="primary-btn" data-action="save-task">Save task</button>`)
}
function saveTask(){const title=document.getElementById("taskTitle").value.trim();if(!title){alert("Add a task title.");return}db.tasks.unshift({id:uid(),contactId:document.getElementById("taskContact").value,title,type:document.getElementById("taskType").value,due:document.getElementById("taskDue").value||TODAY(),status:"Open",priority:document.getElementById("taskPriority").value,planRunId:"",createdAt:TODAY()});save();closeModal();toast("Task created",title);route()}

function saveInlineActivity(id){
  const c=contact(id);if(!c)return;
  const channel=document.getElementById("profileComposerChannel").value,
    direction=document.getElementById("profileComposerDirection").value,
    outcome=document.getElementById("profileComposerOutcome").value,
    body=document.getElementById("profileComposerBody").value.trim(),
    followUp=document.getElementById("profileComposerFollowUp").value;
  if(!body&&channel==="Note"){alert("Add a note.");return}
  db.communications.unshift({id:uid(),contactId:id,channel,direction,outcome,body,date:NOW(),unread:direction==="inbound",threadStatus:"open",createdAt:NOW()});
  c.lastCommunication=TODAY();if(followUp)c.followUp=followUp;c.updatedAt=TODAY();
  if(direction==="inbound")pauseReplyPlans(id);
  if(outcome==="Appointment Set")c.stage=c.type==="Buyer"?"Buyer Consultation":"Listing Appointment";
  if(["No Answer","Left Voicemail","Follow-Up Needed"].includes(outcome)&&followUp&&!db.tasks.some(t=>t.contactId===id&&t.status!=="Done"&&t.due===followUp&&t.type==="Call"))db.tasks.unshift({id:uid(),contactId:id,title:`Callback: ${fullName(c)}`,type:"Call",due:followUp,status:"Open",priority:"High",planRunId:"",createdAt:TODAY()});
  save();toast("Activity logged",`${channel} with ${fullName(c)}`);renderContact(id);
}
function rescheduleModal(id){
  const c=contact(id);modal("Reschedule follow-up",`<div class="form-grid"><div class="field full"><label>Person</label><input value="${esc(fullName(c))}" disabled></div><div class="field"><label>New follow-up date</label><input id="rescheduleDate" type="date" value="${c.followUp||addDays(TODAY(),3)}"></div><div class="field"><label>Reason / next step</label><input id="rescheduleReason" placeholder="Call about timing, send market update..."></div></div>`,`<button class="ghost-btn" data-action="close-modal">Cancel</button><button class="primary-btn" data-action="save-reschedule" data-id="${id}">Reschedule</button>`)
}
function saveReschedule(id){
  const c=contact(id),date=document.getElementById("rescheduleDate").value,reason=document.getElementById("rescheduleReason").value.trim();
  if(!date){alert("Choose a follow-up date.");return}
  c.followUp=date;c.updatedAt=TODAY();
  if(reason)db.tasks.unshift({id:uid(),contactId:id,title:reason,type:"Follow Up",due:date,status:"Open",priority:"Normal",planRunId:"",createdAt:TODAY()});
  save();closeModal();toast("Follow-up rescheduled",`${fullName(c)} • ${dateLabel(date)}`);renderContact(id)
}
function completeNextAction(id,channel,taskId){
  state.pendingTaskId=taskId||"";
  communicationModal(id,channel||"Call");
}

function behaviorModal(id){
  modal("Log website / property activity",`<div class="form-grid"><div class="field full"><label>Person</label><select id="behaviorContact">${contactOptions(id)}</select></div><div class="field"><label>Activity</label><select id="behaviorType">${behaviorTypes.map(x=>`<option>${x}</option>`).join("")}</select></div><div class="field"><label>Date</label><input id="behaviorDate" type="date" value="${TODAY()}"></div><div class="field full"><label>Property / details</label><input id="behaviorProperty" placeholder="Address, search area, or behavior detail"></div></div>`,`<button class="ghost-btn" data-action="close-modal">Cancel</button><button class="primary-btn" data-action="save-behavior">Save activity</button>`)
}
function saveBehavior(){const c=contact(document.getElementById("behaviorContact").value);if(!c){alert("Choose a person.");return}const type=document.getElementById("behaviorType").value,date=document.getElementById("behaviorDate").value||TODAY(),property=document.getElementById("behaviorProperty").value.trim();c.behaviors.unshift({id:uid(),type,date,property,details:""});if(["Requested Showing","Home Valuation","Repeated Property View"].includes(type)){c.heat="Hot";c.followUp=TODAY();db.tasks.unshift({id:uid(),contactId:c.id,title:`Respond to ${type.toLowerCase()}`,type:"Call",due:TODAY(),status:"Open",priority:"High",planRunId:"",createdAt:TODAY()})}save();closeModal();toast("Behavior recorded",`${fullName(c)} • ${type}`);route()}
function alertsModal(id){
  const c=contact(id),a=c.alertSettings;
  modal("Property & market alerts",`<div class="warning">This static build tracks alert setup and engagement. Sending live MLS listings requires an IDX/MLS connection.</div><div class="form-grid" style="margin-top:10px"><div class="field"><label>Buyer property alert</label><select id="alertProperty"><option value="false">Off</option><option value="true" ${a.propertyAlert?"selected":""}>On</option></select></div><div class="field"><label>Seller market snapshot</label><select id="alertMarket"><option value="false">Off</option><option value="true" ${a.marketSnapshot?"selected":""}>On</option></select></div><div class="field"><label>Frequency</label><select id="alertFrequency">${["Daily","Twice Weekly","Weekly","Monthly"].map(x=>`<option ${a.frequency===x?"selected":""}>${x}</option>`).join("")}</select></div><div class="field full"><label>Criteria / area</label><textarea id="alertCriteria" placeholder="Price, area, beds, baths, property type, or seller neighborhood">${esc(a.criteria||"")}</textarea></div></div>`,`<button class="ghost-btn" data-action="close-modal">Cancel</button><button class="primary-btn" data-action="save-alerts" data-id="${id}">Save alerts</button>`)
}
function saveAlerts(id){const c=contact(id);c.alertSettings={...c.alertSettings,propertyAlert:document.getElementById("alertProperty").value==="true",marketSnapshot:document.getElementById("alertMarket").value==="true",frequency:document.getElementById("alertFrequency").value,criteria:document.getElementById("alertCriteria").value.trim()};save();closeModal();toast("Alert settings saved",fullName(c));route()}
function planModal(contactId="",planId=""){
  modal("Apply action plan",`<div class="form-grid"><div class="field"><label>Person</label><select id="planContact">${contactOptions(contactId)}</select></div><div class="field"><label>Plan</label><select id="planId">${plans.map(p=>`<option value="${p.id}" ${p.id===planId?"selected":""}>${esc(p.name)}</option>`).join("")}</select></div><div class="field"><label>Start date</label><input id="planStart" type="date" value="${TODAY()}"></div></div>`,`<button class="ghost-btn" data-action="close-modal">Cancel</button><button class="primary-btn" data-action="save-plan-run">Apply plan</button>`)
}
function savePlanRun(){const contactId=document.getElementById("planContact").value,planId=document.getElementById("planId").value,start=document.getElementById("planStart").value||TODAY(),p=plans.find(x=>x.id===planId),c=contact(contactId);if(!p||!c){alert("Choose a person and plan.");return}const runId=uid();db.planRuns.unshift({id:runId,contactId,planId,status:"Active",startedAt:start});p.steps.forEach(step=>db.tasks.push({id:uid(),contactId,title:step[1],type:step[2],due:addDays(start,step[0]),status:"Open",priority:"Normal",planRunId:runId,createdAt:TODAY()}));save();closeModal();toast("Plan applied",`${p.name} • ${fullName(c)}`);route()}
function pauseReplyPlans(contactId){db.planRuns.filter(r=>r.contactId===contactId&&r.status==="Active").forEach(r=>{const p=plans.find(x=>x.id===r.planId);if(p?.pauseOnReply)r.status="Paused — replied"})}

function pipNotices(){
  const items=[];const hot=dueContacts().filter(c=>c.type==="Seller"&&c.heat==="Hot")[0];if(hot)items.push({title:`Call ${fullName(hot)}`,detail:"Hot seller follow-up is due.",route:`#/contact/${hot.id}`});
  const unread=db.communications.filter(x=>x.unread).length;if(unread)items.push({title:`Clear ${unread} unread conversation${unread===1?"":"s"}`,detail:"Protect response time and inbox zero.",route:"#/inbox"});
  const cleanup=db.contacts.filter(c=>isOpen(c)&&(!c.followUp||c.timeframe==="Unknown")).length;if(cleanup)items.push({title:`Clean up ${cleanup} relationship record${cleanup===1?"":"s"}`,detail:"Every open lead needs timing and a next step.",route:"#/people"});
  const high=behaviorAlerts()[0];if(high)items.push({title:`High intent: ${fullName(high.c)}`,detail:`${high.b.type}${high.b.property?` at ${high.b.property}`:""}.`,route:`#/contact/${high.c.id}`});
  if(!items.length)items.push({title:"Create one seller conversation",detail:"The system is clean. Add opportunity.",route:"#/people"});
  return items.slice(0,4)
}
function renderPip(){
  const list=pipNotices(),focus=list[0];document.getElementById("pipFocus").innerHTML=`<strong>${esc(focus.title)}</strong><p>${esc(focus.detail)}</p><a class="primary-btn compact" style="display:inline-block;margin-top:8px" href="${focus.route}" data-action="close-pip">Do it now</a>`;
  document.getElementById("pipNotices").innerHTML=list.slice(1).map(x=>`<div class="pip-notice"><strong>${esc(x.title)}</strong><p>${esc(x.detail)}</p><a href="${x.route}" data-action="close-pip" style="font-size:8px;color:var(--pink-dark);font-weight:900">Open →</a></div>`).join("")
}
function openPip(){document.getElementById("pipDrawer").classList.add("open");document.getElementById("drawerBackdrop").classList.add("open");document.getElementById("pipDrawer").setAttribute("aria-hidden","false");renderPip()}
function closePip(){document.getElementById("pipDrawer").classList.remove("open");document.getElementById("drawerBackdrop").classList.remove("open");document.getElementById("pipDrawer").setAttribute("aria-hidden","true")}
function askPip(){
  const q=document.getElementById("pipAskInput").value.toLowerCase(),answer=document.getElementById("pipAnswer");let text=bestNext().title+". "+bestNext().detail;
  if(q.includes("seller"))text=dueContacts().filter(c=>c.type==="Seller").length?`You have ${dueContacts().filter(c=>c.type==="Seller").length} seller follow-ups due. Work hot sellers first.`:"No seller follow-up is due. Create a homeowner conversation.";
  else if(q.includes("buyer"))text=`You have ${db.contacts.filter(c=>c.type==="Buyer"&&isOpen(c)).length} open buyer relationships. Prioritize consultation, financing, and next steps.`;
  else if(q.includes("course")||q.includes("license"))text="Stop polishing the CRM and finish the next licensing lesson. The license unlocks the business.";
  else if(q.includes("call"))text=`Your call queue has ${callQueue().length} people. Start with sellers, then highest lead score.`;
  answer.textContent=text;answer.classList.add("open")
}

function toast(title,text){const el=document.getElementById("toast");document.getElementById("toastTitle").textContent=title;document.getElementById("toastText").textContent=text;el.classList.add("show");clearTimeout(window.__toast);window.__toast=setTimeout(()=>el.classList.remove("show"),2400)}
function download(name,type,text){const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),500)}
function exportCsv(){const rows=[["First Name","Last Name","Phone","Email","Type","Stage","Heat","Timeframe","Next Follow-Up","Last Communication","Source","Projected GCI","Property","Tags","Notes"],...db.contacts.map(c=>[c.firstName,c.lastName,c.phone,c.email,c.type,c.stage,c.heat,c.timeframe,c.followUp,c.lastCommunication,c.source,c.gci,c.property,c.tags.join("; "),c.notes])];download(`holton-homes-people-${TODAY()}.csv`,"text/csv",rows.map(r=>r.map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(",")).join("\n"))}
function seedDemo(){
  if(db.contacts.length&&!confirm("Add sample records to your current CRM?"))return;
  const seller={id:uid(),firstName:"Ashley",lastName:"Bennett",name:"Ashley Bennett",phone:"513-555-0134",email:"ashley@example.com",type:"Seller",stage:"Listing Appointment",heat:"Hot",timeframe:"Now — 0–3 months",followUp:TODAY(),lastCommunication:addDays(TODAY(),-2),source:"Referral",gci:16200,property:"Williamsburg, OH",tags:["pricing","seller"],notes:"Inherited the home and wants a clean timeline.",createdAt:addDays(TODAY(),-12),updatedAt:TODAY(),household:[],preferences:{},alertSettings:{propertyAlert:false,marketSnapshot:true,criteria:"Williamsburg competing listings",frequency:"Weekly",lastSent:""},behaviors:[{id:uid(),type:"Home Valuation",date:addDays(TODAY(),-1),property:"Williamsburg, OH"}]};
  const farm={id:uid(),firstName:"Michael",lastName:"Turner",name:"Michael Turner",phone:"937-555-0199",email:"michael@example.com",type:"Seller",stage:"Nurture",heat:"Warm",timeframe:"6–12 months",followUp:addDays(TODAY(),3),lastCommunication:addDays(TODAY(),-9),source:"Farm / Homestead Brand",gci:24000,property:"32-acre farm near Hillsboro",tags:["farm","downsizing"],notes:"Needs a plan before making a move.",createdAt:addDays(TODAY(),-30),updatedAt:TODAY(),household:[],preferences:{},alertSettings:{propertyAlert:false,marketSnapshot:true,criteria:"Farm and acreage comps",frequency:"Monthly",lastSent:""},behaviors:[]};
  const buyer={id:uid(),firstName:"Jordan",lastName:"Reed",name:"Jordan Reed",phone:"513-555-0177",email:"jordan@example.com",type:"Buyer",stage:"Pre-Approved",heat:"Warm",timeframe:"3–6 months",followUp:addDays(TODAY(),-1),lastCommunication:addDays(TODAY(),-5),source:"Social Media",gci:9200,property:"Lebanon / eastern Cincinnati",tags:["monthly-payment"],notes:"Wants payment under $2,100.",createdAt:addDays(TODAY(),-18),updatedAt:TODAY(),household:[],preferences:{areas:"Lebanon",minPrice:"250000",maxPrice:"330000",beds:"3",baths:"2"},alertSettings:{propertyAlert:true,marketSnapshot:false,criteria:"Lebanon; $250k–$330k; 3+ beds",frequency:"Daily",lastSent:""},behaviors:[{id:uid(),type:"Saved Property",date:TODAY(),property:"123 Sample Street"},{id:uid(),type:"Repeated Property View",date:TODAY(),property:"123 Sample Street"}]};
  db.contacts.unshift(seller,farm,buyer);db.tasks.unshift({id:uid(),contactId:seller.id,title:"Prepare listing consultation pricing",type:"Appointment",due:TODAY(),status:"Open",priority:"High",planRunId:"",createdAt:TODAY()},{id:uid(),contactId:buyer.id,title:"Buyer financing follow-up",type:"Call",due:TODAY(),status:"Open",priority:"High",planRunId:"",createdAt:TODAY()});db.communications.unshift({id:uid(),contactId:seller.id,channel:"Call",direction:"outbound",outcome:"Appointment Set",body:"Booked listing consultation.",date:`${addDays(TODAY(),-2)}T14:00:00`,unread:false,threadStatus:"open",createdAt:NOW()},{id:uid(),contactId:buyer.id,channel:"Text",direction:"inbound",outcome:"Replied",body:"Can we look at the one on Sample Street?",date:NOW(),unread:true,threadStatus:"open",createdAt:NOW()});save();toast("Sample data added","Explore the complete workflow.");route()
}

document.addEventListener("click",event=>{
  const el=event.target.closest("[data-action]");if(!el)return;
  const action=el.dataset.action,id=el.dataset.id,channel=el.dataset.channel;
  if(action==="open-contact")openContactModal(id||"");
  if(action==="open-contact-type"){
    openContactModal("");
    const type=document.getElementById("contactType");
    if(type){
      type.value=id;
      type.dispatchEvent(new Event("change",{bubbles:true}))
    }
  }
  if(action==="save-contact")saveContact();
  if(action==="composer-channel"){document.getElementById("profileComposerChannel").value=channel;document.querySelectorAll(".composer-tab").forEach(b=>b.classList.toggle("active",b.dataset.channel===channel));const launch=document.querySelector('[data-action="launch-inline-channel"]');if(launch)launch.textContent=["Call","Text","Email"].includes(channel)?`Launch ${channel}`:"No launch needed"}
  if(action==="launch-inline-channel"){const ch=document.getElementById("profileComposerChannel").value;if(["Call","Text","Email"].includes(ch))launchChannel(ch,id)}
  if(action==="save-inline-activity")saveInlineActivity(id);
  if(action==="complete-next-action")completeNextAction(id,channel,el.dataset.task||"");
  if(action==="reschedule-contact")rescheduleModal(id);
  if(action==="save-reschedule")saveReschedule(id);
  if(action==="complete-task-button"){const t=task(id);if(t){t.status="Done";t.completedAt=TODAY();save();route();toast("Task completed",t.title)}}
  if(action==="close-modal")closeModal();
  if(action==="communicate"||action==="open-communication")communicationModal(id||"",channel||"Note");
  if(action==="switch-channel")communicationModal(el.dataset.contact||"",id);
  if(action==="save-communication")saveCommunication();
  if(action==="launch-channel")launchChannel(channel,id);
  if(action==="open-profile")location.hash=`#/contact/${id}`;
  if(action==="smart-list"){state.smartList=id;renderPeople()}
  if(action==="clear-people"){state.peopleQuery=state.peopleType=state.peopleStage=state.peopleHeat="";renderPeople()}
  if(action==="inbox-folder"){state.inboxFolder=id;state.activeThread=null;renderInbox()}
  if(action==="open-thread"){state.activeThread=id;renderInbox()}
  if(action==="toggle-thread"){const ms=db.communications.filter(m=>m.contactId===id);const close=ms.at(-1)?.threadStatus!=="closed";ms.forEach(m=>m.threadStatus=close?"closed":"open");save();renderInbox()}
  if(action==="send-inbox-reply"){const body=document.getElementById("inboxReply").value.trim(),ch=document.getElementById("inboxChannel").value;if(body){communicationModal(id,ch);setTimeout(()=>{const b=document.getElementById("commBody");if(b)b.value=body},0)}}
  if(action==="inbox-zero"){db.communications.forEach(m=>m.unread=false);save();renderInbox()}
  if(action==="open-task")openTaskModal(id||"");
  if(action==="save-task")saveTask();
  if(action==="complete-task"){const t=task(id);if(t){t.status=el.checked?"Done":"Open";t.completedAt=el.checked?TODAY():"";save();route()}}
  if(action==="delete-task"){db.tasks=db.tasks.filter(t=>t.id!==id);save();route()}
  if(action==="task-filter"){state.taskFilter=id;renderTasks()}
  if(action==="open-behavior")behaviorModal(id);
  if(action==="save-behavior")saveBehavior();
  if(action==="open-alerts")alertsModal(id);
  if(action==="save-alerts")saveAlerts(id);
  if(action==="apply-plan")planModal(id||"",el.dataset.plan||"");
  if(action==="save-plan-run")savePlanRun();
  if(action==="toggle-plan-run"){const run=db.planRuns.find(r=>r.id===id);if(run){run.status=run.status==="Active"?"Paused":"Active";save();renderAutomations()}}
  if(action==="pipeline-type"){state.pipelineType=id;renderPipeline()}
  if(action==="select-call"){state.callIndex=Number(el.dataset.index||0);renderCallQueue()}
  if(action==="create-call-tasks"){dueContacts().filter(hasPhone).forEach(c=>{if(!db.tasks.some(t=>t.contactId===c.id&&t.type==="Call"&&t.status!=="Done"))db.tasks.push({id:uid(),contactId:c.id,title:`Follow up with ${fullName(c)}`,type:"Call",due:c.followUp||TODAY(),status:"Open",priority:c.heat==="Hot"?"High":"Normal",planRunId:"",createdAt:TODAY()})});save();renderCallQueue();toast("Call queue updated","Due follow-ups were added.")}
  if(action==="open-note")communicationModal(id,"Note");
  if(action==="open-pip")openPip();
  if(action==="close-pip")closePip();
  if(action==="ask-pip")askPip();
  if(action==="seed-demo")seedDemo();
  if(action==="save-settings"){db.settings.agentName=document.getElementById("settingAgentName").value.trim()||"Jacob";db.settings.agentEmail=document.getElementById("settingAgentEmail").value.trim();db.settings.agentPhone=document.getElementById("settingAgentPhone").value.trim();save();toast("Settings saved","Agent profile updated.")}
  if(action==="save-goals"){
    db.settings.annualGciTarget=Number(document.getElementById("settingGciTarget").value||100000);
    db.settings.sellerShareGoal=Number(document.getElementById("settingSellerShare").value||60);
    db.settings.dailyConversationTarget=Number(document.getElementById("settingConversationTarget").value||5);
    db.settings.coreMarkets=document.getElementById("settingCoreMarkets").value.trim();
    save();toast("Goals saved","Your dashboard now reflects how Holton Homes should operate.")
  }
  if(action==="export-json"){db.settings.lastManualBackupAt=TODAY();save();download(`holton-homes-backup-${TODAY()}.json`,"application/json",JSON.stringify(db,null,2));toast("Backup downloaded","Keep this file in Google Drive, iCloud, or Dropbox.")}
  if(action==="export-csv")exportCsv();
  if(action==="import-json"){const f=document.getElementById("importFile").files[0];if(!f){alert("Choose a JSON backup.");return}const reader=new FileReader();reader.onload=()=>{try{db=normalize(JSON.parse(reader.result));save();toast("Backup imported","CRM data restored.");route()}catch{alert("That backup could not be read.")}};reader.readAsText(f)}
  if(action==="request-persistent-storage"){
    if(navigator.storage?.persist){
      navigator.storage.persist().then(granted=>{
        const status=document.getElementById("storageProtectionStatus");
        if(status)status.textContent=granted?"Protection enabled. The browser is less likely to remove CRM data automatically. Manual deletion can still erase it.":"Protection was not granted. Weekly downloaded backups remain essential.";
        toast(granted?"Browser protection enabled":"Protection unavailable",granted?"Automatic browser cleanup is less likely to remove this CRM.":"Keep downloading backups.")
      })
    }else toast("Not supported","This browser does not support persistent-storage requests.")
  }
  if(action==="clear-data"&&confirm("Delete ALL clients, tasks, activity, and browser recovery copies from this device? Download a backup first. This cannot be undone.")){
    db=normalize({});
    localStorage.removeItem(STORAGE_KEY);
    try{indexedDB.deleteDatabase("HoltonHomesCRMBackup")}catch(error){}
    localStorage.setItem(STORAGE_KEY,JSON.stringify(db));
    route();toast("CRM cleared","All browser data and the recovery copy were removed.")
  }
});
document.addEventListener("change",event=>{
  const inline=event.target.closest('[data-action="inline-contact-field"]');
  if(inline){const c=contact(inline.dataset.id);if(c){c[inline.dataset.field]=inline.value;c.updatedAt=TODAY();save();renderContact(c.id);toast("Contact updated",`${inline.dataset.field} → ${inline.value}`)}return}
  if(event.target.id==="contactType"){const type=event.target.value,stage=document.getElementById("contactStage");stage.innerHTML=(type==="Buyer"?buyerStages:sellerStages).map(x=>`<option>${x}</option>`).join("");const holder=document.getElementById("contactSpecificFields");if(holder)holder.innerHTML=contactSpecificForm({},type)}
  if(event.target.id==="peopleType"){state.peopleType=event.target.value;renderPeople()}
  if(event.target.id==="peopleStage"){state.peopleStage=event.target.value;renderPeople()}
  if(event.target.id==="peopleHeat"){state.peopleHeat=event.target.value;renderPeople()}
});
document.addEventListener("input",event=>{
  if(event.target.id==="peopleSearch"){state.peopleQuery=event.target.value;renderPeople()}
  if(event.target.id==="globalSearch"){
    const q=event.target.value.toLowerCase().trim(),box=document.getElementById("globalSearchResults");
    if(!q){box.classList.remove("open");box.innerHTML="";return}
    const hits=db.contacts.filter(c=>[fullName(c),c.phone,c.email,c.property,...c.tags].join(" ").toLowerCase().includes(q)).slice(0,8);
    box.innerHTML=hits.length?hits.map(c=>`<a class="search-hit" href="#/contact/${c.id}"><div><strong>${esc(fullName(c))}</strong><small>${esc(c.stage)} • ${esc(c.phone||c.email||"No contact info")}</small></div><span class="score ${scoreClass(scoreContact(c).score)}">${scoreContact(c).score}</span></a>`).join(""):`<div class="empty">No matches.</div>`;box.classList.add("open")
  }
});
document.addEventListener("dragstart",event=>{const card=event.target.closest(".deal-card");if(card)event.dataTransfer.setData("text/plain",card.dataset.contact)});
document.addEventListener("dragover",event=>{const col=event.target.closest(".kanban-column");if(col){event.preventDefault();col.classList.add("dragover")}});
document.addEventListener("dragleave",event=>event.target.closest(".kanban-column")?.classList.remove("dragover"));
document.addEventListener("drop",event=>{const col=event.target.closest(".kanban-column");if(!col)return;event.preventDefault();col.classList.remove("dragover");const c=contact(event.dataTransfer.getData("text/plain"));if(c){c.stage=col.dataset.stage;c.updatedAt=TODAY();if(c.stage==="Under Contract"&&!db.tasks.some(t=>t.contactId===c.id&&t.type==="Transaction"&&t.status!=="Done"))["Inspection / due diligence","Appraisal and financing","Title / closing preparation","Final walkthrough"].forEach((title,i)=>db.tasks.push({id:uid(),contactId:c.id,title,type:"Transaction",due:addDays(TODAY(),[7,14,21,28][i]),status:"Open",priority:"High",planRunId:"",createdAt:TODAY()}));save();renderPipeline();toast("Stage updated",`${fullName(c)} → ${c.stage}`)}})
document.getElementById("drawerBackdrop").addEventListener("click",closePip);
document.getElementById("modalBackdrop").addEventListener("click",event=>{if(event.target.id==="modalBackdrop")closeModal()});
window.addEventListener("hashchange",route);
renderPip();route();restoreFromIndexedDbIfNeeded();
})();