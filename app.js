(() => {
"use strict";

const STORAGE_KEY = "holtonHomesCRM_v15";
const LEGACY_KEYS = ["holtonHomesCRM_v14","holtonHomesCRM_v13","holtonHomesCRM_v12","holtonHomesCRM_v11","holtonHomesCRM_v10","holtonHomesBusinessBuilder_v7","holtonHomesCRM"];
const TODAY = () => new Date().toISOString().slice(0,10);
const NOW = () => new Date().toISOString();
const sellerStages = ["New","Attempted Contact","Contacted","Nurture","Listing Appointment","Listing Agreement Signed","Active Listing","Under Contract","Closed","Lost"];
const buyerStages = ["New","Attempted Contact","Contacted","Nurture","Buyer Consultation","Pre-Approved","Touring Homes","Offer Submitted","Under Contract","Closed","Lost"];
const sources = ["Sphere","Referral","Social Media","Website","Open House","Farm / Homestead Brand","Cold Outreach","Sign Call","Past Client","Other"];
const behaviorTypes = ["Viewed Property","Saved Property","Repeated Property View","Requested Showing","Home Valuation","Opened Email","Clicked Property Alert","Searched Website"];
const defaultPlans = [
  {
    id:"seller-speed",name:"Seller Speed-to-Lead",category:"Seller",
    description:"A personal, appointment-focused sequence for a new homeowner inquiry.",
    pauseOnReply:true,goalStages:["Listing Appointment","Listing Agreement Signed","Active Listing","Under Contract","Closed"],
    steps:[
      {id:"ss1",day:0,type:"Call",title:"Call the new seller within five minutes",body:"Learn motivation, property, timing, decision makers, and what prompted the inquiry."},
      {id:"ss2",day:0,type:"Text",title:"Send a personal introduction",body:"Hi {{first_name}}, this is {{agent_name}} with Holton Homes. I saw your real estate inquiry and wanted to personally reach out. What has you thinking about a move?"},
      {id:"ss3",day:1,type:"Call",title:"Second seller call attempt",body:"Reference the first message and ask one simple timing question."},
      {id:"ss4",day:2,type:"Email",title:"Send the Holton Homes seller roadmap",subject:"A simple plan for selling {{property}}",body:"Hi {{first_name}},\n\nI put together a simple next-step plan for homeowners considering a sale. The first step is understanding your goals, timing, and the current market around {{property}}.\n\n— {{agent_name}}"},
      {id:"ss5",day:4,type:"Call",title:"Pricing and motivation check-in",body:"Ask what outcome would make selling worthwhile."},
      {id:"ss6",day:7,type:"Follow Up",title:"Book the listing consultation or move to nurture",body:"Confirm the next clear commitment."}
    ]
  },
  {
    id:"future-seller",name:"Future Seller — 90 Day",category:"Seller",
    description:"Useful seller touches for homeowners who are not ready yet.",
    pauseOnReply:true,goalStages:["Listing Appointment","Listing Agreement Signed","Active Listing","Under Contract","Closed"],
    steps:[
      {id:"fs1",day:0,type:"Email",title:"Send seller planning guide",subject:"Planning ahead for your future sale",body:"Hi {{first_name}},\n\nHere is a simple planning checklist so you can prepare without rushing. I’ll keep an eye on {{property}} and the surrounding market.\n\n— {{agent_name}}"},
      {id:"fs2",day:14,type:"Call",title:"Confirm timing and motivation",body:"Ask what would need to happen before a move becomes realistic."},
      {id:"fs3",day:30,type:"Email",title:"Send a useful market update",subject:"What is changing around {{property}}",body:"Hi {{first_name}},\n\nA quick update on the market around {{property}} and what it may mean for your plans."},
      {id:"fs4",day:60,type:"Call",title:"Personal seller check-in",body:"Reconnect personally before discussing real estate."},
      {id:"fs5",day:90,type:"Follow Up",title:"Refresh the value and timing conversation",body:"Decide whether to book, continue nurture, or close the loop."}
    ]
  },
  {
    id:"listing-prep",name:"Listing Appointment Prep",category:"Seller",
    description:"Everything Jacob needs before and after a listing appointment.",
    pauseOnReply:false,goalStages:["Listing Agreement Signed","Active Listing","Under Contract","Closed"],
    steps:[
      {id:"lp1",day:0,type:"Task",title:"Confirm appointment and all decision makers",body:"Verify address, time, attendees, motivation, and timing."},
      {id:"lp2",day:0,type:"Task",title:"Prepare CMA and pricing range",body:"Review active, pending, sold, and failed listings."},
      {id:"lp3",day:0,type:"Task",title:"Prepare seller net sheet and marketing plan",body:"Make the financial outcome simple and visual."},
      {id:"lp4",day:1,type:"Call",title:"Listing appointment follow-up",body:"Answer objections and ask directly for the listing."},
      {id:"lp5",day:2,type:"Email",title:"Send appointment recap",subject:"Your Holton Homes selling plan",body:"Hi {{first_name}},\n\nHere is the plan we discussed for {{property}}, including positioning, timing, and the next decision.\n\n— {{agent_name}}"}
    ]
  },
  {
    id:"active-listing",name:"Active Listing Care",category:"Seller",
    description:"A predictable seller communication rhythm from launch through contract.",
    pauseOnReply:false,goalStages:["Under Contract","Closed"],
    steps:[
      {id:"al1",day:0,type:"Task",title:"Verify listing launch checklist",body:"Photos, remarks, disclosures, showing instructions, signage, and syndication."},
      {id:"al2",day:2,type:"Call",title:"First seller activity update",body:"Share traffic, feedback, online attention, and next recommendation."},
      {id:"al3",day:7,type:"Email",title:"Weekly seller report",subject:"Weekly update for {{property}}",body:"Hi {{first_name}},\n\nHere is this week’s activity, buyer feedback, market competition, and my recommendation for {{property}}."},
      {id:"al4",day:8,type:"Task",title:"Review pricing and competition",body:"Compare new listings, pendings, reductions, and buyer feedback."},
      {id:"al5",day:14,type:"Call",title:"Seller strategy conversation",body:"Make a clear recommendation rather than only reporting statistics."}
    ]
  },
  {
    id:"buyer-speed",name:"Buyer Speed-to-Lead",category:"Buyer",
    description:"Move a new buyer toward financing and a consultation quickly.",
    pauseOnReply:true,goalStages:["Buyer Consultation","Pre-Approved","Touring Homes","Offer Submitted","Under Contract","Closed"],
    steps:[
      {id:"bs1",day:0,type:"Call",title:"Call the new buyer",body:"Learn desired payment, financing, area, timing, and decision makers."},
      {id:"bs2",day:0,type:"Text",title:"Send a personal buyer introduction",body:"Hi {{first_name}}, this is {{agent_name}} with Holton Homes. I saw your home-search inquiry. What monthly payment and area would feel comfortable for you?"},
      {id:"bs3",day:1,type:"Call",title:"Second buyer call attempt",body:"Lead with monthly payment and financing clarity."},
      {id:"bs4",day:2,type:"Email",title:"Send buyer roadmap",subject:"Your simple home-buying plan",body:"Hi {{first_name}},\n\nThe fastest way to make this simple is to confirm payment, financing, and your must-haves before we tour homes.\n\n— {{agent_name}}"},
      {id:"bs5",day:5,type:"Follow Up",title:"Book the buyer consultation",body:"Set a specific appointment or move to nurture."}
    ]
  },
  {
    id:"open-house",name:"Open House Conversion",category:"Buyer",
    description:"Separate serious buyers, future sellers, neighbors, and referral opportunities.",
    pauseOnReply:true,goalStages:["Buyer Consultation","Listing Appointment","Pre-Approved","Touring Homes","Under Contract","Closed"],
    steps:[
      {id:"oh1",day:0,type:"Text",title:"Send open-house thank-you",body:"Hi {{first_name}}, thanks for stopping by today. What did you like most—and what would you change? — {{agent_name}}"},
      {id:"oh2",day:1,type:"Call",title:"Call for honest property feedback",body:"Identify buyer status, representation, financing, and possible home to sell."},
      {id:"oh3",day:3,type:"Email",title:"Send useful next options",subject:"A few next options after the open house",body:"Hi {{first_name}},\n\nBased on what you shared, here are the next options I would consider."},
      {id:"oh4",day:7,type:"Follow Up",title:"Book consultation or classify relationship",body:"Buyer, seller, neighbor, nurture, referral partner, or close out."}
    ]
  },
  {
    id:"contract-close",name:"Contract-to-Close Command Plan",category:"Transaction",
    description:"Real transaction tasks instead of forcing a separate transaction system.",
    pauseOnReply:false,goalStages:["Closed"],
    steps:[
      {id:"cc1",day:0,type:"Task",title:"Verify signed contract and critical dates",body:"Earnest money, inspections, financing, appraisal, title, possession, and closing."},
      {id:"cc2",day:1,type:"Task",title:"Confirm lender, title, and cooperating agent contacts",body:"Make sure every party has the contract and timeline."},
      {id:"cc3",day:3,type:"Call",title:"Client expectations call",body:"Explain the next milestone, risks, and what you need from them."},
      {id:"cc4",day:7,type:"Task",title:"Inspection and due-diligence checkpoint",body:"Track reports, responses, repairs, and deadlines."},
      {id:"cc5",day:14,type:"Task",title:"Appraisal and financing checkpoint",body:"Confirm appraisal status, underwriting, conditions, and clear-to-close path."},
      {id:"cc6",day:21,type:"Task",title:"Title and closing preparation",body:"Review title, settlement figures, utilities, insurance, and possession."},
      {id:"cc7",day:27,type:"Task",title:"Schedule final walkthrough",body:"Confirm property condition and agreed repairs."},
      {id:"cc8",day:30,type:"Call",title:"Closing-day client call",body:"Confirm logistics and celebrate the milestone."},
      {id:"cc9",day:31,type:"Set Stage",title:"Closed",body:"Closed"}
    ]
  },
  {
    id:"past-client",name:"Past Client Relationship",category:"Past Client",
    description:"Reviews, referrals, equity conversations, and human check-ins.",
    pauseOnReply:false,goalStages:[],
    steps:[
      {id:"pc1",day:0,type:"Text",title:"Send personal closing thank-you",body:"Hi {{first_name}}, thank you for trusting me. I’m grateful I got to help, and I’m still here after closing. — {{agent_name}}"},
      {id:"pc2",day:14,type:"Call",title:"Two-week move-in check",body:"Ask how the move and home are going."},
      {id:"pc3",day:30,type:"Follow Up",title:"Request a review",body:"Make the request personal and easy."},
      {id:"pc4",day:90,type:"Email",title:"Send equity and market check-in",subject:"A quick check on your home and market",body:"Hi {{first_name}},\n\nI wanted to share a quick market and equity check-in and see how everything is going."},
      {id:"pc5",day:180,type:"Call",title:"Relationship check-in",body:"Call as a person, not a campaign."},
      {id:"pc6",day:365,type:"Call",title:"Home anniversary call",body:"Celebrate and ask how the home is serving them."}
    ]
  },
  {
    id:"partner-welcome",name:"Referral Partner Welcome",category:"Partner",
    description:"Build a useful working relationship with Realtors and lenders.",
    pauseOnReply:true,goalStages:[],
    steps:[
      {id:"rp1",day:0,type:"Call",title:"Partner introduction call",body:"Learn service area, specialties, communication standards, and ideal referrals."},
      {id:"rp2",day:0,type:"Email",title:"Send Holton Homes partner introduction",subject:"Holton Homes referral partnership",body:"Hi {{first_name}},\n\nI would like to learn how you work, who you serve best, and where we may be able to help each other.\n\n— {{agent_name}}"},
      {id:"rp3",day:7,type:"Follow Up",title:"Define a concrete partner next step",body:"Coffee, lender program review, co-marketing idea, open house, or referral process."},
      {id:"rp4",day:30,type:"Call",title:"Partner relationship check-in",body:"Share something useful before asking for anything."}
    ]
  }
];

const defaultAutomationRules = [
  {
    id:"rule-new-seller",name:"New seller → speed-to-lead",description:"Starts the seller plan for a new seller record.",
    trigger:"Contact Created",active:true,runMode:"once",
    filters:{type:"Seller",stage:"New",heat:"",source:"",tag:"",noContactDays:"",minScore:"",behaviorType:""},
    actions:[{type:"Start Plan",value:"seller-speed"}]
  },
  {
    id:"rule-new-buyer",name:"New buyer → speed-to-lead",description:"Starts the buyer plan for a new buyer record.",
    trigger:"Contact Created",active:true,runMode:"once",
    filters:{type:"Buyer",stage:"New",heat:"",source:"",tag:"",noContactDays:"",minScore:"",behaviorType:""},
    actions:[{type:"Start Plan",value:"buyer-speed"}]
  },
  {
    id:"rule-high-intent",name:"High-intent behavior → call today",description:"Turns valuation, showing, repeated-view, and saved-property activity into a same-day response.",
    trigger:"Behavior",active:true,runMode:"changed",
    filters:{type:"",stage:"",heat:"",source:"",tag:"",noContactDays:"",minScore:"",behaviorType:"High Intent"},
    actions:[
      {type:"Set Heat",value:"Hot"},
      {type:"Add Tag",value:"High Intent"},
      {type:"Create Task",value:"Call high-intent lead today",extra:"Call"}
    ]
  },
  {
    id:"rule-listing-appointment",name:"Listing appointment → prep plan",description:"Prepares the CMA, net sheet, and follow-up automatically.",
    trigger:"Stage Match",active:true,runMode:"once",
    filters:{type:"Seller",stage:"Listing Appointment",heat:"",source:"",tag:"",noContactDays:"",minScore:"",behaviorType:""},
    actions:[{type:"Start Plan",value:"listing-prep"}]
  },
  {
    id:"rule-active-listing",name:"Active listing → seller care",description:"Creates a predictable seller-update rhythm.",
    trigger:"Stage Match",active:true,runMode:"once",
    filters:{type:"Seller",stage:"Active Listing",heat:"",source:"",tag:"",noContactDays:"",minScore:"",behaviorType:""},
    actions:[{type:"Start Plan",value:"active-listing"}]
  },
  {
    id:"rule-under-contract",name:"Under contract → closing command plan",description:"Creates transaction milestones without another app.",
    trigger:"Stage Match",active:true,runMode:"once",
    filters:{type:"",stage:"Under Contract",heat:"",source:"",tag:"",noContactDays:"",minScore:"",behaviorType:""},
    actions:[{type:"Start Plan",value:"contract-close"}]
  },
  {
    id:"rule-stale-hot",name:"Hot lead silent 3 days → rescue",description:"Prevents a high-value relationship from disappearing.",
    trigger:"Stale",active:true,runMode:"daily",
    filters:{type:"",stage:"",heat:"Hot",source:"",tag:"",noContactDays:"3",minScore:"",behaviorType:""},
    actions:[
      {type:"Create Task",value:"Rescue hot lead: call today",extra:"Call"},
      {type:"Set Follow-Up",value:"0"}
    ]
  },
  {
    id:"rule-inbound-reply",name:"Inbound reply → stop automation and respond",description:"Pauses active plans and creates a human response task.",
    trigger:"Inbound Reply",active:true,runMode:"daily",
    filters:{type:"",stage:"",heat:"",source:"",tag:"",noContactDays:"",minScore:"",behaviorType:""},
    actions:[
      {type:"Pause Plans",value:""},
      {type:"Create Task",value:"Respond personally to inbound message",extra:"Follow Up"}
    ]
  },
  {
    id:"rule-partner",name:"New Realtor or lender → partner plan",description:"Builds a referral relationship without treating partners like leads.",
    trigger:"Contact Created",active:true,runMode:"once",
    filters:{types:["Realtor","Lender"],type:"",stage:"New",heat:"",source:"",tag:"",noContactDays:"",minScore:"",behaviorType:""},
    actions:[{type:"Start Plan",value:"partner-welcome"}]
  },
  {
    id:"rule-past-client",name:"Past client silent 90 days → relationship touch",description:"Protects referrals and repeat business.",
    trigger:"Stale",active:true,runMode:"monthly",
    filters:{type:"Past Client",stage:"",heat:"",source:"",tag:"",noContactDays:"90",minScore:"",behaviorType:""},
    actions:[{type:"Create Task",value:"Personal past-client check-in",extra:"Call"}]
  }
];

let db = loadDatabase();
let state = {route:"today",smartList:"all",peopleQuery:"",peopleType:"",peopleStage:"",peopleHeat:"",inboxFolder:"open",activeThread:null,taskFilter:"open",pipelineType:"Seller",callIndex:0,pendingTaskId:"",automationTab:"overview"};
let automationBusy=false,automationTimer=null;


function uid(){return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`}
function esc(value){return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]))}
function fullName(c){return [c.firstName,c.lastName].filter(Boolean).join(" ").trim() || c.name || "Unnamed Contact"}
function renderTagChips(tags=[],contactId=""){
  if(!tags.length)return `<span class="tag-empty">No tags</span>`;
  return `<div class="tag-chips">${tags.map(tag=>`<button class="tag-chip" data-action="filter-tag" data-tag="${esc(tag)}" title="Show everyone tagged ${esc(tag)}"><span>${esc(tag)}</span>${contactId?`<b data-action="remove-tag" data-id="${contactId}" data-tag="${esc(tag)}" title="Remove tag">×</b>`:""}</button>`).join("")}</div>`
}
function normalizeTag(value){return String(value||"").trim().replace(/^#+/,"").replace(/\s+/g," ")}
function addTagToContact(id,tag){
  const c=contact(id),clean=normalizeTag(tag);
  if(!c||!clean)return false;
  if(!c.tags.some(existing=>existing.toLowerCase()===clean.toLowerCase()))c.tags.push(clean);
  c.updatedAt=TODAY();save();return true
}

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
function save(evaluate=true){
  db.settings.lastSavedAt=NOW();
  const payload=JSON.stringify(db);
  localStorage.setItem(STORAGE_KEY,payload);
  mirrorToIndexedDb(payload);
  renderNav();
  renderPip();
  if(evaluate)scheduleAutomationEvaluation();
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
      professionalDetails:p.professionalDetails||{company:"",role:"",licenseNumber:"",serviceArea:"",specialties:"",referralNotes:""},
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
  const planRuns=(raw.planRuns||[]).map(r=>({...r,id:r.id||uid(),status:r.status||"Active",startedAt:r.startedAt||TODAY(),stepStates:r.stepStates||{},sourceRuleId:r.sourceRuleId||"",completedAt:r.completedAt||""}));
  const automationRules=Array.isArray(raw.automationRules)?raw.automationRules:defaultAutomationRules.map(rule=>JSON.parse(JSON.stringify(rule)));
  const actionPlans=Array.isArray(raw.actionPlans)?raw.actionPlans:[];
  const automationQueue=Array.isArray(raw.automationQueue)?raw.automationQueue:[];
  const automationLogs=Array.isArray(raw.automationLogs)?raw.automationLogs:[];
  const automationHistory=Array.isArray(raw.automationHistory)?raw.automationHistory:[];
  return {contacts,communications,tasks,planRuns,automationRules,actionPlans,automationQueue,automationLogs,automationHistory,settings:{agentName:"Jacob",agentEmail:"",agentPhone:"",commissionRate:3,lastManualBackupAt:"",lastSavedAt:"",annualGciTarget:100000,sellerShareGoal:60,dailyConversationTarget:5,coreMarkets:"Cincinnati, Brown County, Mt. Orab, Williamsburg, Hillsboro, Lebanon",...(raw.settings||{})}};
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
  return normalize({contacts:[],communications:[],tasks:[],planRuns:[],automationRules:defaultAutomationRules,actionPlans:[],automationQueue:[],automationLogs:[],automationHistory:[],settings:{}});
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
function avatar(c){return `<span class="avatar" aria-hidden="true">${esc(initials(c))}</span>`}
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
      <button class="quick sphere-action" data-action="open-contact-type" data-id="Sphere">＋ Add sphere</button><button class="quick partner-action" data-action="open-contact-type" data-id="Realtor">＋ Add Realtor</button><button class="quick partner-action" data-action="open-contact-type" data-id="Lender">＋ Add lender</button>
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
  const s=scoreContact(c);return `<div class="queue-row">${avatar(c)}<div><strong><a class="person-name-link" href="#/contact/${c.id}">${esc(fullName(c))}</a></strong><small>${esc(c.type)} • ${esc(c.stage)} • ${c.followUp?`Follow up ${dateLabel(c.followUp)}`:"No next step"} • Score ${s.score}</small></div>${contactQuickActions(c)}</div>`
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
  return alerts.length?`<div class="queue">${alerts.map(({c,b})=>`<div class="queue-row"><span class="avatar">◉</span><div><strong><a class="person-name-link" href="#/contact/${c.id}">${esc(fullName(c))}</a></strong><small>${esc(b.type)}${b.property?` • ${esc(b.property)}`:""} • ${dateLabel(b.date)}</small></div><button class="quick call" data-action="communicate" data-channel="Call" data-id="${c.id}">Call</button></div>`).join("")}</div>`:`<div class="empty">No high-intent website activity logged yet.</div>`
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
          <select id="peopleType"><option value="">All types</option>${["Seller","Buyer","Sphere","Past Client","Realtor","Lender"].map(x=>`<option ${state.peopleType===x?"selected":""}>${x}</option>`).join("")}</select>
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
  <td><div class="contact-cell">${avatar(c)}<div><a class="person-name-link" href="#/contact/${c.id}">${esc(fullName(c))}</a><small>${esc(c.phone||"No phone")}${c.email?` • ${esc(c.email)}`:" • No email"}</small>${renderTagChips(c.tags)}</div></div></td>
  <td><span class="badge type-${c.type.toLowerCase().replace(" ","-")}">${esc(c.type)}</span></td><td>${esc(c.stage)}</td>
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
      <section class="thread-list">${list.length?list.map(t=>`<article class="thread ${t.unread?"unread":""} ${active?.contact.id===t.contact.id?"active":""}" data-action="open-thread" data-id="${t.contact.id}"><div class="thread-top"><strong><a class="person-name-link" href="#/contact/${t.contact.id}" data-action="name-link">${esc(fullName(t.contact))}</a></strong><time>${dateTimeLabel(t.last.date)}</time></div><p>${esc(t.last.body||`${t.last.channel} • ${t.last.outcome}`)}</p></article>`).join(""):`<div class="empty">Inbox zero. No conversations here.</div>`}</section>
      ${active?conversationHtml(active):`<section class="conversation"><div class="empty">Select a conversation.</div></section>`}
    </div>`;
}
function conversationHtml(thread){
  thread.messages.forEach(m=>m.unread=false);save();
  return `<section class="conversation"><div class="conversation-head"><div><strong><a class="person-name-link" href="#/contact/${thread.contact.id}">${esc(fullName(thread.contact))}</a></strong><small style="display:block;color:var(--muted);font-size:8px">${esc(thread.contact.stage)} • ${esc(thread.contact.phone||thread.contact.email)}</small></div><div class="row-actions">${contactQuickActions(thread.contact)}<button class="quick" data-action="toggle-thread" data-id="${thread.contact.id}">${thread.status==="closed"?"Reopen":"Close"}</button></div></div>
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
    if(c.type==="Realtor")return {title:"Introduce Holton Homes and discuss referral opportunities",due:c.followUp||TODAY(),channel:hasPhone(c)?"Call":"Email",taskId:""};
    if(c.type==="Lender")return {title:"Discuss loan programs, response times, and referral fit",due:c.followUp||TODAY(),channel:hasPhone(c)?"Call":"Email",taskId:""};
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
  if(["Realtor","Lender"].includes(c.type)){
    const d=c.professionalDetails||{};
    return `${detail("Company",d.company||"Not set")}${detail("Role",d.role||c.type)}${detail("License / NMLS",d.licenseNumber||"Not set")}${detail("Service area",d.serviceArea||c.property||"Not set")}${detail("Specialties",d.specialties||"Not set")}${detail("Referral notes",d.referralNotes||"Not set")}`;
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
        <div class="eyebrow">${["Realtor","Lender"].includes(c.type)?"REFERRAL PARTNER":`${esc(c.type)} CONTACT`}</div>
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
          ${detail("Phone",c.phone||"Missing")}${detail("Email",c.email||"Missing")}${detail("Next follow-up",dateLabel(c.followUp))}${detail("Last communication",c.lastCommunication?dateLabel(c.lastCommunication):"Never")}${detail("Projected GCI",money(c.gci))}<div class="detail tag-detail"><label>Tags</label>${renderTagChips(c.tags,c.id)}<button class="add-tag-inline" data-action="open-tag" data-id="${c.id}">＋ Add tag</button></div>
        </div></details>

        <details class="compact-panel" open><summary>${c.type==="Seller"?"Seller opportunity":c.type==="Buyer"?"Buyer criteria":c.type==="Realtor"?"Realtor partner":c.type==="Lender"?"Lending partner":"Sphere relationship"} <span>${esc(c.type)}</span></summary><div class="compact-body detail-grid">${typeSpecificHtml(c)}</div></details>

        <details class="compact-panel" open><summary>Upcoming tasks <span>${tasks.length}</span></summary><div class="compact-body">
          ${tasks.length?tasks.slice(0,5).map(t=>`<div class="sidebar-task"><input type="checkbox" data-action="complete-task" data-id="${t.id}"><div><strong>${esc(t.title)}</strong><small>${esc(t.type)} • ${dateLabel(t.due)}</small></div></div>`).join(""):`<div class="compact-empty"><span>No open tasks.</span><button class="ghost-btn compact" data-action="open-task" data-id="${c.id}">＋ Add task</button></div>`}
          ${tasks.length?`<button class="ghost-btn compact full-width" data-action="open-task" data-id="${c.id}">＋ Add another task</button>`:""}
        </div></details>

        <details class="compact-panel"><summary>Property activity & alerts <span>${(c.behaviors||[]).length}</span></summary><div class="compact-body">
          ${(c.behaviors||[]).length?(c.behaviors||[]).slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,4).map(b=>`<div class="side-activity"><div><strong>${esc(b.type)}</strong><small>${esc(b.property||b.details||"")}</small></div><span>${dateLabel(b.date)}</span></div>`).join(""):`<div class="compact-empty"><span>No property activity recorded.</span><button class="ghost-btn compact" data-action="open-behavior" data-id="${c.id}">＋ Add activity</button></div>`}
          <button class="ghost-btn compact full-width" data-action="open-alerts" data-id="${c.id}">${c.alertSettings.propertyAlert||c.alertSettings.marketSnapshot?"Manage alerts":"Set property / market alert"}</button>
        </div></details>

        <details class="compact-panel"><summary>Action plans <span>${runs.length}</span></summary><div class="compact-body">
          ${runs.length?runs.map(run=>{const p=planById(run.planId);return `<div class="side-activity"><div><strong>${esc(p?.name||"Plan")}</strong><small>Started ${dateLabel(run.startedAt)}</small></div><span class="badge ${run.status==="Active"?"good":"warn"}">${esc(run.status)}</span></div>`}).join(""):`<div class="compact-empty"><span>No active action plan.</span><button class="ghost-btn compact" data-action="apply-plan" data-id="${c.id}">Apply plan</button></div>`}
        </div></details>

        <details class="compact-panel"><summary>Relationship notes <span>${c.notes?"Saved":"Empty"}</span></summary><div class="compact-body notes-copy">${esc(c.notes||"No relationship notes yet.")}</div></details>
      </aside>
    </div>`;
}
function detail(label,value){return `<div class="detail"><label>${esc(label)}</label><strong>${esc(value)}</strong></div>`}
function contactSummary(c,s){
  const first=c.firstName||fullName(c);
  const pieces=[];
  if(["Realtor","Lender"].includes(c.type)){
    const d=c.professionalDetails||{};
    pieces.push(`${first} is a ${c.type.toLowerCase()} referral partner${d.company?` with ${d.company}`:""}.`);
  }else if(!c.lastCommunication)pieces.push(`${first} is a new ${c.type.toLowerCase()} contact with no communication history.`);
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
    `<div class="grid two"><section class="card">${queue.length?queue.map((x,i)=>`<div class="queue-row ${i===state.callIndex?"active":""}">${avatar(x.c)}<div><strong><a class="person-name-link" href="#/contact/${x.c.id}">${esc(fullName(x.c))}</a></strong><small>${esc(x.c.type)} • ${esc(x.c.stage)} • ${x.task?esc(x.task.title):"Follow-up due"} • Score ${scoreContact(x.c).score}</small></div><button class="ghost-btn compact" data-action="select-call" data-index="${i}">Select</button></div>`).join(""):`<div class="empty">No calls due. Add a call task or follow-up date.</div>`}</section>
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
    `<div class="kanban-wrap"><div class="kanban">${stages.map(stage=>{const items=contacts.filter(c=>c.stage===stage);return `<section class="kanban-column" data-stage="${esc(stage)}"><div class="kanban-head"><span>${esc(stage)}</span><b>${items.length}</b></div>${items.map(c=>`<article class="deal-card" draggable="true" data-contact="${c.id}"><strong><a class="person-name-link" href="#/contact/${c.id}">${esc(fullName(c))}</a></strong><small>${esc(c.property||"No property")} • ${c.lastCommunication?`Last touch ${dateLabel(c.lastCommunication)}`:"Never contacted"}</small><div class="deal-meta"><span>${money(c.gci)}</span><span class="score ${scoreClass(scoreContact(c).score)}">${scoreContact(c).score}</span></div></article>`).join("")}</section>`}).join("")}</div></div>`;
}


function allPlans(){
  const map=new Map(defaultPlans.map(p=>[p.id,p]));
  (db.actionPlans||[]).forEach(p=>map.set(p.id,p));
  return [...map.values()]
}
function planById(id){return allPlans().find(p=>p.id===id)}
function personalizeTemplate(text,c){
  const values={
    first_name:c?.firstName||"",
    last_name:c?.lastName||"",
    full_name:c?fullName(c):"",
    property:c?.property||"your property",
    agent_name:db.settings.agentName||"Jacob",
    agent_email:db.settings.agentEmail||"",
    agent_phone:db.settings.agentPhone||"",
    company:"Holton Homes"
  };
  return String(text||"").replace(/\{\{(\w+)\}\}/g,(match,key)=>values[key]??match)
}
function automationLog({kind="Rule",name="",contactId="",status="Completed",detail="",sourceId=""}){
  db.automationLogs.unshift({id:uid(),kind,name,contactId,status,detail,sourceId,date:NOW()});
  db.automationLogs=db.automationLogs.slice(0,1000)
}
function scheduleAutomationEvaluation(){
  clearTimeout(automationTimer);
  automationTimer=setTimeout(()=>processAutomationEngine(),120)
}
function contactFingerprint(c){
  const lastBehavior=(c.behaviors||[]).slice().sort((a,b)=>String(b.date).localeCompare(String(a.date)))[0];
  const lastInbound=db.communications.filter(m=>m.contactId===c.id&&m.direction==="inbound").sort((a,b)=>String(b.date).localeCompare(String(a.date)))[0];
  return [c.stage,c.heat,c.followUp,c.lastCommunication,c.updatedAt,(c.tags||[]).slice().sort().join(","),lastBehavior?.type,lastBehavior?.date,lastInbound?.date].join("|")
}
function ruleHistoryKey(rule,c,manual=false){
  if(manual)return `${rule.id}:${c.id}:manual:${Date.now()}`;
  if(rule.runMode==="daily")return `${rule.id}:${c.id}:${TODAY()}`;
  if(rule.runMode==="monthly")return `${rule.id}:${c.id}:${TODAY().slice(0,7)}`;
  if(rule.runMode==="changed")return `${rule.id}:${c.id}:${contactFingerprint(c)}`;
  return `${rule.id}:${c.id}:once`
}
function recentBehavior(c,type,days=7){
  const high=["Saved Property","Repeated Property View","Requested Showing","Home Valuation","Clicked Property Alert"];
  return (c.behaviors||[]).some(b=>{
    const typeMatch=type==="High Intent"?high.includes(b.type):!type||b.type===type;
    return typeMatch&&daysSince(b.date)<=days
  })
}
function triggerMatches(rule,c){
  if(rule.trigger==="Manual")return false;
  if(rule.trigger==="Contact Created")return daysSince(c.createdAt)===0;
  if(rule.trigger==="Behavior")return recentBehavior(c,rule.filters?.behaviorType||"High Intent",7);
  if(rule.trigger==="Inbound Reply")return db.communications.some(m=>m.contactId===c.id&&m.direction==="inbound"&&String(m.date).slice(0,10)===TODAY());
  if(rule.trigger==="Task Completed")return db.tasks.some(t=>t.contactId===c.id&&t.completedAt===TODAY());
  if(rule.trigger==="Follow-Up Due")return Boolean(c.followUp&&c.followUp<=TODAY());
  if(rule.trigger==="Stale")return true;
  if(rule.trigger==="Stage Match")return true;
  if(rule.trigger==="Always")return true;
  return true
}
function matchesAutomationFilters(rule,c){
  const f=rule.filters||{};
  if(Array.isArray(f.types)&&f.types.length&&!f.types.includes(c.type))return false;
  if(f.type&&c.type!==f.type)return false;
  if(f.stage&&c.stage!==f.stage)return false;
  if(f.heat&&c.heat!==f.heat)return false;
  if(f.source&&c.source!==f.source)return false;
  if(f.tag&&!c.tags.some(t=>t.toLowerCase()===String(f.tag).toLowerCase()))return false;
  if(f.noContactDays!==""&&f.noContactDays!=null&&daysSince(c.lastCommunication)<Number(f.noContactDays))return false;
  if(f.minScore!==""&&f.minScore!=null&&scoreContact(c).score<Number(f.minScore))return false;
  if(f.behaviorType&&!recentBehavior(c,f.behaviorType,7))return false;
  return true
}
function matchingContactsForRule(rule,includeTrigger=true){
  return db.contacts.filter(c=>matchesAutomationFilters(rule,c)&&(!includeTrigger||triggerMatches(rule,c)))
}
function addTagDirect(c,value){
  const clean=normalizeTag(value);
  if(clean&&!c.tags.some(t=>t.toLowerCase()===clean.toLowerCase()))c.tags.push(clean)
}
function createAutomationTask(c,title,type="Follow Up",due=TODAY(),planRunId="",sourceKey=""){
  if(db.tasks.some(t=>t.contactId===c.id&&t.status!=="Done"&&t.title===title&&t.due===due))return null;
  const task={id:uid(),contactId:c.id,title,type,due,status:"Open",priority:type==="Call"||c.heat==="Hot"?"High":"Normal",planRunId,sourceKey,completedAt:"",createdAt:TODAY()};
  db.tasks.unshift(task);return task
}
function queueAutomationMessage(c,channel,title,body,subject="",source="",sourceId="",due=TODAY()){
  const key=`${source}:${sourceId}:${c.id}:${channel}`;
  const existing=db.automationQueue.find(q=>q.dedupeKey===key&&["Needs Review","Ready"].includes(q.status));
  if(existing)return existing;
  const item={id:uid(),contactId:c.id,channel,title:personalizeTemplate(title,c),subject:personalizeTemplate(subject,c),body:personalizeTemplate(body,c),status:"Needs Review",createdAt:NOW(),due,source,sourceId,dedupeKey:key,sentAt:"",skipReason:""};
  db.automationQueue.unshift(item);
  createAutomationTask(c,`Review & send ${channel.toLowerCase()}: ${item.title}`,channel,due,"",`queue:${item.id}`);
  return item
}
function startPlanForContact(contactId,planId,start=TODAY(),sourceRuleId=""){
  const c=contact(contactId),p=planById(planId);
  if(!c||!p)return {ok:false,reason:"Missing contact or plan"};
  const existing=db.planRuns.find(r=>r.contactId===contactId&&r.planId===planId&&r.status==="Active");
  if(existing)return {ok:false,reason:"Plan already active",run:existing};
  const run={id:uid(),contactId,planId,status:"Active",startedAt:start,stepStates:{},sourceRuleId,completedAt:"",pausedAt:"",pauseReason:""};
  db.planRuns.unshift(run);
  automationLog({kind:"Plan",name:p.name,contactId,status:"Started",detail:sourceRuleId?"Started by automation rule.":"Started manually.",sourceId:run.id});
  return {ok:true,run}
}
function executeAutomationAction(rule,c,action){
  const type=action.type,value=action.value||"",extra=action.extra||"";
  if(type==="Start Plan")return startPlanForContact(c.id,value,TODAY(),rule.id).ok?`Started ${planById(value)?.name||value}`:`Plan not started`;
  if(type==="Create Task"){createAutomationTask(c,personalizeTemplate(value,c),extra||"Follow Up",TODAY(),"",`rule:${rule.id}`);return `Created task: ${value}`}
  if(type==="Add Tag"){addTagDirect(c,value);return `Added tag ${value}`}
  if(type==="Remove Tag"){c.tags=c.tags.filter(t=>t.toLowerCase()!==String(value).toLowerCase());return `Removed tag ${value}`}
  if(type==="Set Heat"){c.heat=value;return `Set heat to ${value}`}
  if(type==="Set Stage"){c.stage=value;return `Set stage to ${value}`}
  if(type==="Set Follow-Up"){c.followUp=addDays(TODAY(),Number(value||0));return `Set follow-up ${dateLabel(c.followUp)}`}
  if(type==="Add Note"){db.communications.unshift({id:uid(),contactId:c.id,channel:"Note",direction:"outbound",outcome:"Automation",body:personalizeTemplate(value,c),date:NOW(),unread:false,threadStatus:"open",createdAt:NOW()});return "Added note"}
  if(type==="Pause Plans"){pauseReplyPlans(c.id,"Paused by automation");return "Paused active plans"}
  if(type==="Queue Text"){queueAutomationMessage(c,"Text",extra||"Automation text",value,"","Rule",rule.id,TODAY());return "Queued text for review"}
  if(type==="Queue Email"){queueAutomationMessage(c,"Email",extra||"Automation email",value,action.subject||extra,"Rule",rule.id,TODAY());return "Queued email for review"}
  return `Skipped unknown action ${type}`
}
function runAutomationRule(rule,c,{manual=false}={}){
  const key=ruleHistoryKey(rule,c,manual);
  if(!manual&&db.automationHistory.includes(key))return false;
  const details=[];
  (rule.actions||[]).forEach(action=>details.push(executeAutomationAction(rule,c,action)));
  db.automationHistory.push(key);
  db.automationHistory=db.automationHistory.slice(-5000);
  c.updatedAt=TODAY();
  automationLog({kind:"Rule",name:rule.name,contactId:c.id,status:"Completed",detail:details.join(" • "),sourceId:rule.id});
  return true
}
function executePlanStep(run,p,c,step){
  const stateForStep=run.stepStates[step.id];
  if(stateForStep?.status)return false;
  const due=addDays(run.startedAt,Number(step.day||0));
  if(due>TODAY())return false;
  let status="Completed",detail="";
  if(["Task","Call","Follow Up","Appointment"].includes(step.type)){
    const t=createAutomationTask(c,personalizeTemplate(step.title,c),step.type,due,run.id,`plan:${run.id}:${step.id}`);
    detail=t?`Created ${step.type.toLowerCase()} task`:"Task already exists"
  }else if(step.type==="Text"||step.type==="Email"){
    const item=queueAutomationMessage(c,step.type,step.title,step.body||"",step.subject||"",`Plan`,`${run.id}:${step.id}`,due);
    status="Queued";detail=`Queued ${step.type.toLowerCase()} for human review`;
    run.stepStates[step.id]={status,executedAt:NOW(),queueId:item.id,detail};return true
  }else if(step.type==="Add Tag"){addTagDirect(c,step.body||step.title);detail="Tag added"}
  else if(step.type==="Remove Tag"){c.tags=c.tags.filter(t=>t.toLowerCase()!==String(step.body||step.title).toLowerCase());detail="Tag removed"}
  else if(step.type==="Set Stage"){c.stage=step.body||step.title;detail=`Stage set to ${c.stage}`}
  else if(step.type==="Set Heat"){c.heat=step.body||step.title;detail=`Heat set to ${c.heat}`}
  else if(step.type==="Set Follow-Up"){c.followUp=addDays(TODAY(),Number(step.body||0));detail=`Follow-up set to ${dateLabel(c.followUp)}`}
  else if(step.type==="Note"){db.communications.unshift({id:uid(),contactId:c.id,channel:"Note",direction:"outbound",outcome:"Action Plan",body:personalizeTemplate(step.body||step.title,c),date:NOW(),unread:false,threadStatus:"open",createdAt:NOW()});detail="Note added"}
  else {status="Skipped";detail=`Unsupported step type: ${step.type}`}
  run.stepStates[step.id]={status,executedAt:NOW(),detail};
  automationLog({kind:"Plan Step",name:`${p.name}: ${step.title}`,contactId:c.id,status,detail,sourceId:run.id});
  return true
}
function processPlanRuns(){
  let changed=false;
  db.planRuns.forEach(run=>{
    if(run.status!=="Active")return;
    const c=contact(run.contactId),p=planById(run.planId);
    if(!c||!p){run.status="Failed";run.pauseReason="Missing contact or plan";changed=true;return}
    if((p.goalStages||[]).includes(c.stage)){
      run.status="Completed — goal reached";run.completedAt=NOW();
      automationLog({kind:"Plan",name:p.name,contactId:c.id,status:"Completed",detail:`Stopped because ${c.stage} reached the plan goal.`,sourceId:run.id});
      changed=true;return
    }
    (p.steps||[]).forEach(step=>{if(executePlanStep(run,p,c,step))changed=true});
    const finished=(p.steps||[]).every(step=>run.stepStates[step.id]?.status);
    if(finished){run.status="Completed";run.completedAt=NOW();automationLog({kind:"Plan",name:p.name,contactId:c.id,status:"Completed",detail:"All plan steps were created or queued.",sourceId:run.id});changed=true}
  });
  return changed
}
function processAutomationRules(){
  let changed=false,runs=0;
  (db.automationRules||[]).filter(rule=>rule.active).forEach(rule=>{
    matchingContactsForRule(rule,true).forEach(c=>{
      if(runs>=100)return;
      if(runAutomationRule(rule,c)){changed=true;runs++}
    })
  });
  return changed
}
function processAutomationEngine({manual=false}={}){
  if(automationBusy)return;
  automationBusy=true;
  try{
    const planChanged=processPlanRuns();
    const ruleChanged=processAutomationRules();
    if(planChanged||ruleChanged){
      save(false);
      if(state.route==="automations")renderAutomations()
    }else if(manual){
      automationLog({kind:"Engine",name:"Manual automation check",status:"Completed",detail:"No new matching actions were found."});
      save(false);
      if(state.route==="automations")renderAutomations()
    }
  }catch(error){
    console.error(error);
    automationLog({kind:"Engine",name:"Automation engine",status:"Failed",detail:error.message||String(error)});
    save(false)
  }finally{automationBusy=false}
}
function automationConditionSummary(rule){
  const f=rule.filters||{},parts=[];
  if(Array.isArray(f.types)&&f.types.length)parts.push(`type is ${f.types.join(" or ")}`);
  if(f.type)parts.push(`type is ${f.type}`);
  if(f.stage)parts.push(`stage is ${f.stage}`);
  if(f.heat)parts.push(`heat is ${f.heat}`);
  if(f.source)parts.push(`source is ${f.source}`);
  if(f.tag)parts.push(`tagged ${f.tag}`);
  if(f.noContactDays!=="")parts.push(`no communication for ${f.noContactDays}+ days`);
  if(f.minScore!=="")parts.push(`score ≥ ${f.minScore}`);
  if(f.behaviorType)parts.push(`${f.behaviorType} behavior`);
  return parts.length?parts.join(" AND "):"All contacts matching the trigger"
}
function automationActionSummary(rule){
  return (rule.actions||[]).map(a=>`${a.type}${a.value?`: ${planById(a.value)?.name||a.value}`:""}`).join(" → ")
}
function planProgress(run){
  const p=planById(run.planId);if(!p)return {done:0,total:0,pct:0};
  const done=(p.steps||[]).filter(s=>run.stepStates?.[s.id]?.status).length,total=(p.steps||[]).length;
  return {done,total,pct:total?Math.round(done/total*100):0}
}
function automationHealth(){
  const waiting=db.automationQueue.filter(q=>q.status==="Needs Review");
  return {
    missingChannels:waiting.filter(q=>{const c=contact(q.contactId);return q.channel==="Text"?!hasPhone(c):!hasEmail(c)}).length,
    failedLogs:db.automationLogs.filter(l=>l.status==="Failed"&&daysSince(l.date)<=30).length,
    duplicateRuns:db.planRuns.filter((run,i,arr)=>run.status==="Active"&&arr.findIndex(r=>r.contactId===run.contactId&&r.planId===run.planId&&r.status==="Active")!==i).length
  }
}
function automationOverviewHtml(){
  const rules=db.automationRules||[],activeRules=rules.filter(r=>r.active).length,activeRuns=db.planRuns.filter(r=>r.status==="Active").length,waiting=db.automationQueue.filter(q=>q.status==="Needs Review").length,completed30=db.automationLogs.filter(l=>l.status==="Completed"&&daysSince(l.date)<=30).length,health=automationHealth();
  const recent=db.automationLogs.slice(0,8);
  return `<section class="automation-metrics">
    <div class="automation-metric"><label>Active rules</label><strong>${activeRules}</strong><small>${rules.length-activeRules} disabled</small></div>
    <div class="automation-metric"><label>Running plans</label><strong>${activeRuns}</strong><small>${db.planRuns.filter(r=>String(r.status).startsWith("Paused")).length} paused</small></div>
    <div class="automation-metric"><label>Approval queue</label><strong>${waiting}</strong><small>Nothing sends blindly</small></div>
    <div class="automation-metric"><label>Completed in 30 days</label><strong>${completed30}</strong><small>Rules and plan steps</small></div>
  </section>
  <section class="automation-hero">
    <div><span>HOLTON AUTOMATION STANDARD</span><h2>Automate the reminder. Keep the relationship human.</h2><p>Every rule explains why it matched. Every message waits for review. Replies and real conversations pause nurture. Listing and contract workflows live beside lead follow-up.</p></div>
    <button class="primary-btn" data-action="run-engine">Run engine now</button>
  </section>
  <div class="grid two">
    <section class="card card-pad"><div class="card-head"><div><h2>What this fixes</h2><small>Built from common CRM friction—not feature collecting.</small></div></div>
      <div class="fix-grid">
        <div class="fix-card"><b>Preview first</b><span>See exactly who matches before a rule runs.</span></div>
        <div class="fix-card"><b>Explain every run</b><span>Logs show the rule, person, action, result, and reason.</span></div>
        <div class="fix-card"><b>Human approval queue</b><span>Batch texts and emails are personalized drafts, never blind blasts.</span></div>
        <div class="fix-card"><b>Notes count as work</b><span>Face-to-face and manual notes can pause plans and update the relationship.</span></div>
        <div class="fix-card"><b>Transaction plans</b><span>Inspection, appraisal, title, walkthrough, and closing live in the CRM.</span></div>
        <div class="fix-card"><b>Goal-aware plans</b><span>A plan stops when the contact reaches its actual conversion goal.</span></div>
      </div>
    </section>
    <section class="card card-pad"><div class="card-head"><div><h2>Automation health</h2><small>Problems are visible instead of silently failing.</small></div></div>
      <div class="health-list">
        <div><span>Missing phone/email for queued messages</span><b class="${health.missingChannels?"health-bad":"health-good"}">${health.missingChannels}</b></div>
        <div><span>Failed runs in the last 30 days</span><b class="${health.failedLogs?"health-bad":"health-good"}">${health.failedLogs}</b></div>
        <div><span>Duplicate active plans</span><b class="${health.duplicateRuns?"health-bad":"health-good"}">${health.duplicateRuns}</b></div>
        <div><span>Rules ready to run</span><b class="health-good">${activeRules}</b></div>
      </div>
    </section>
  </div>
  <section class="card card-pad" style="margin-top:12px"><div class="card-head"><div><h2>Recent automation activity</h2><small>A deterministic audit trail—not a mystery AI score.</small></div><button class="ghost-btn compact" data-action="automation-tab" data-id="logs">View all logs</button></div>${automationLogsTable(recent)}</section>`
}
function automationRulesHtml(){
  const rules=db.automationRules||[];
  return `<section class="automation-toolbar"><div><strong>${rules.length} rules</strong><span>Rules run on app open, data changes, or a manual engine check.</span></div><button class="primary-btn" data-action="open-rule-builder">＋ New rule</button></section>
  <section class="rule-list">${rules.map(rule=>{
    const matches=matchingContactsForRule(rule,true);
    return `<article class="rule-card ${rule.active?"active":"disabled"}">
      <div class="rule-status"><button class="automation-toggle ${rule.active?"on":""}" data-action="toggle-rule" data-id="${rule.id}" aria-label="Toggle ${esc(rule.name)}"><span></span></button></div>
      <div class="rule-main"><div class="rule-title"><span class="trigger-pill">${esc(rule.trigger)}</span><h3>${esc(rule.name)}</h3></div><p>${esc(rule.description||"")}</p>
        <div class="rule-flow"><div><label>WHEN</label><strong>${esc(rule.trigger)}</strong></div><i>→</i><div><label>IF</label><strong>${esc(automationConditionSummary(rule))}</strong></div><i>→</i><div><label>THEN</label><strong>${esc(automationActionSummary(rule))}</strong></div></div>
      </div>
      <div class="rule-side"><b>${matches.length}</b><span>match now</span><div class="rule-actions"><button class="quick" data-action="preview-rule" data-id="${rule.id}">Preview</button><button class="quick" data-action="run-rule" data-id="${rule.id}">Run</button><button class="quick" data-action="open-rule-builder" data-id="${rule.id}">Edit</button><button class="quick" data-action="duplicate-rule" data-id="${rule.id}">Duplicate</button></div></div>
    </article>`
  }).join("")}</section>`
}
function planStepLabel(step){return `Day ${step.day} • ${step.type}`}
function automationPlansHtml(){
  const plans=allPlans();
  return `<section class="automation-toolbar"><div><strong>${plans.length} action plans</strong><span>Tasks execute automatically; texts and emails enter the approval queue.</span></div><button class="primary-btn" data-action="open-plan-builder">＋ New action plan</button></section>
    <div class="advanced-plan-grid">${plans.map(p=>{
      const runs=db.planRuns.filter(r=>r.planId===p.id),active=runs.filter(r=>r.status==="Active").length;
      return `<article class="advanced-plan-card">
        <div class="advanced-plan-head"><span class="badge ${p.category==="Seller"?"seller":p.category==="Buyer"?"buyer":""}">${esc(p.category)}</span><span>${active} active</span></div>
        <h3>${esc(p.name)}</h3><p>${esc(p.description||"")}</p>
        <div class="plan-guardrails"><span>${p.pauseOnReply?"✓ Pauses on reply":"○ Continues after reply"}</span><span>${(p.goalStages||[]).length?`✓ Stops at ${esc(p.goalStages[0])}`:"○ No conversion stop"}</span></div>
        <div class="plan-sequence">${(p.steps||[]).slice(0,6).map(step=>`<div><b>${esc(planStepLabel(step))}</b><span>${esc(step.title)}</span></div>`).join("")}${(p.steps||[]).length>6?`<small>＋ ${(p.steps||[]).length-6} more steps</small>`:""}</div>
        <div class="plan-card-actions"><button class="primary-btn compact" data-action="apply-plan" data-plan="${p.id}">Apply</button><button class="ghost-btn compact" data-action="open-plan-builder" data-id="${p.id}">Edit</button><button class="ghost-btn compact" data-action="duplicate-plan" data-id="${p.id}">Duplicate</button></div>
      </article>`
    }).join("")}</div>
    <section class="card card-pad" style="margin-top:12px"><div class="card-head"><div><h2>Running plans</h2><small>Progress, pauses, and goals are visible.</small></div></div>${db.planRuns.length?db.planRuns.map(run=>{
      const c=contact(run.contactId),p=planById(run.planId),progress=planProgress(run);
      return `<div class="plan-run-row"><div><strong>${esc(p?.name||"Missing plan")} — ${c?`<a class="person-name-link" href="#/contact/${c.id}">${esc(fullName(c))}</a>`:"Deleted contact"}</strong><small>${esc(run.status)} • Started ${dateLabel(run.startedAt)}${run.pauseReason?` • ${esc(run.pauseReason)}`:""}</small></div><div class="run-progress"><span><i style="width:${progress.pct}%"></i></span><b>${progress.done}/${progress.total}</b></div><button class="quick" data-action="toggle-plan-run" data-id="${run.id}">${run.status==="Active"?"Pause":"Resume"}</button></div>`
    }).join(""):`<div class="empty">No plans have been applied yet.</div>`}</section>`
}
function automationQueueHtml(){
  const queue=[...db.automationQueue].sort((a,b)=>(a.status==="Needs Review"?0:1)-(b.status==="Needs Review"?0:1)||String(b.createdAt).localeCompare(String(a.createdAt)));
  return `<section class="automation-toolbar"><div><strong>${queue.filter(q=>q.status==="Needs Review").length} messages need review</strong><span>Personalized drafts solve batch-work pain without risking robotic spam.</span></div><div><button class="ghost-btn" data-action="build-batch-queue">Build batch queue</button><button class="primary-btn" data-action="process-next-queue">Process next</button></div></section>
    <section class="queue-board">${queue.length?queue.map(item=>{
      const c=contact(item.contactId),missing=item.channel==="Text"?!hasPhone(c):!hasEmail(c);
      return `<article class="approval-item ${item.status.toLowerCase().replaceAll(" ","-")}">
        <div class="approval-channel ${item.channel.toLowerCase()}">${item.channel==="Text"?"✉":"@"}</div>
        <div class="approval-copy"><div><strong>${c?`<a class="person-name-link" href="#/contact/${c.id}">${esc(fullName(c))}</a>`:"Deleted contact"} — ${esc(item.title)}</strong><span class="badge ${item.status==="Needs Review"?"warn":item.status==="Sent"?"good":""}">${esc(item.status)}</span></div><p>${esc(item.body)}</p><small>${esc(item.source)} • Due ${dateLabel(item.due)}${missing?" • Missing contact channel":""}</small></div>
        <div class="approval-actions"><button class="quick" data-action="open-queue-item" data-id="${item.id}">Review</button>${item.status==="Needs Review"?`<button class="quick" data-action="skip-queue-item" data-id="${item.id}">Skip</button>`:""}</div>
      </article>`
    }).join(""):`<div class="empty">The approval queue is clear.</div>`}</section>`
}
function automationLogsTable(logs=db.automationLogs){
  return logs.length?`<div class="automation-log-table"><div class="log-head"><span>Time</span><span>Automation</span><span>Person</span><span>Result</span><span>Details</span></div>${logs.map(log=>{
    const c=contact(log.contactId);
    return `<div class="log-row"><time>${dateTimeLabel(log.date)}</time><div><b>${esc(log.name)}</b><small>${esc(log.kind)}</small></div><span>${c?`<a class="person-name-link" href="#/contact/${c.id}">${esc(fullName(c))}</a>`:"—"}</span><span class="badge ${log.status==="Failed"?"hot":log.status==="Completed"||log.status==="Started"?"good":"warn"}">${esc(log.status)}</span><p>${esc(log.detail||"")}</p></div>`
  }).join("")}</div>`:`<div class="empty">No automation activity yet.</div>`
}
function automationLogsHtml(){
  return `<section class="automation-toolbar"><div><strong>Audit trail</strong><span>Every run is explainable and reversible through the contact record.</span></div><button class="ghost-btn" data-action="clear-automation-logs">Clear logs</button></section>${automationLogsTable(db.automationLogs)}`
}
function renderTasks(){
  let tasks=[...db.tasks];
  if(state.taskFilter==="open")tasks=tasks.filter(t=>t.status!=="Done");
  if(state.taskFilter==="overdue")tasks=tasks.filter(t=>t.status!=="Done"&&t.due<TODAY());
  if(state.taskFilter==="today")tasks=tasks.filter(t=>t.status!=="Done"&&t.due===TODAY());
  if(state.taskFilter==="upcoming")tasks=tasks.filter(t=>t.status!=="Done"&&t.due>TODAY());
  if(state.taskFilter==="done")tasks=tasks.filter(t=>t.status==="Done");
  tasks.sort((a,b)=>a.due.localeCompare(b.due));
  document.getElementById("view").innerHTML=
    pageHead("Specific commitments","Tasks","Use tasks for promises and transaction deadlines; use Smart Lists for general follow-up.",`<button class="primary-btn" data-action="open-task">＋ Add task</button>`) +
    `<div class="toolbar">${["open","overdue","today","upcoming","done"].map(x=>`<button class="${state.taskFilter===x?"primary-btn":"ghost-btn"} compact" data-action="task-filter" data-id="${x}">${x[0].toUpperCase()+x.slice(1)}</button>`).join("")}</div>
    <section class="card">${tasks.length?tasks.map(t=>{const c=contact(t.contactId);return `<div class="task-row ${t.status==="Done"?"done":""}"><input type="checkbox" ${t.status==="Done"?"checked":""} data-action="complete-task" data-id="${t.id}"><div><strong>${esc(t.title)}</strong><small>${esc(t.type)}${c?` • <a class="person-name-link" href="#/contact/${c.id}">${esc(fullName(c))}</a>`:""}${t.planRunId?" • Action plan":""}</small></div><span class="task-date ${t.status!=="Done"&&t.due<TODAY()?"overdue":""}">${dateLabel(t.due)}</span><button class="quick" data-action="delete-task" data-id="${t.id}">×</button></div>`}).join(""):`<div class="empty">No tasks in this view.</div>`}</section>`;
}

function renderAutomations(){
  const tabs=[["overview","Overview"],["rules","Rules"],["plans","Action Plans"],["queue","Approval Queue"],["logs","Logs"]];
  const body=
    state.automationTab==="rules"?automationRulesHtml():
    state.automationTab==="plans"?automationPlansHtml():
    state.automationTab==="queue"?automationQueueHtml():
    state.automationTab==="logs"?automationLogsHtml():
    automationOverviewHtml();
  document.getElementById("view").innerHTML=
    backupWarningHtml()+
    pageHead(
      "Holton operating system",
      "Automation Studio",
      "A transparent rule engine, action-plan builder, approval queue, and transaction workflow built for a solo listing-focused agent.",
      `<button class="ghost-btn" data-action="run-engine">Run engine</button><button class="primary-btn" data-action="open-rule-builder">＋ New rule</button>`
    )+
    `<nav class="automation-tabs">${tabs.map(([id,label])=>{
      const waiting=id==="queue"?db.automationQueue.filter(q=>q.status==="Needs Review").length:0;
      return `<button class="${state.automationTab===id?"active":""}" data-action="automation-tab" data-id="${id}">${label}${waiting?` <b>${waiting}</b>`:""}</button>`
    }).join("")}</nav>${body}`;
}

function renderActivity(){
  const entries=[];
  db.communications.forEach(m=>entries.push({date:m.date,kind:m.channel,contact:contact(m.contactId),title:`${m.direction==="inbound"?"Inbound":"Outbound"} ${m.channel}`,detail:[m.outcome,m.body].filter(Boolean).join(" • ")}));
  db.contacts.forEach(c=>(c.behaviors||[]).forEach(b=>entries.push({date:`${b.date}T12:00:00`,kind:"Behavior",contact:c,title:b.type,detail:b.property||b.details||""})));
  entries.sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  document.getElementById("view").innerHTML=
    pageHead("Communication and intent","Activity","A single timeline across calls, texts, emails, notes, and website behavior.",`<button class="primary-btn" data-action="open-communication" data-channel="Note">＋ Log activity</button>`) +
    `<section class="card"><div class="timeline" style="padding:0 12px">${entries.length?entries.map(e=>`<div class="timeline-item"><span class="timeline-icon">${e.kind==="Call"?"☎":e.kind==="Text"?"✉":e.kind==="Email"?"@":e.kind==="Behavior"?"◉":"✎"}</span><div><strong>${e.contact?`<a class="person-name-link" href="#/contact/${e.contact.id}">${esc(fullName(e.contact))}</a> — `:""}${esc(e.title)}</strong><p>${esc(e.detail||"No details")}</p></div><time>${dateTimeLabel(e.date)}</time></div>`).join(""):`<div class="empty">No activity yet.</div>`}</div></section>`;
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
  if(["Realtor","Lender"].includes(type)){
    const d=c.professionalDetails||{};
    return `<div class="field full section-label">${type==="Realtor"?"Realtor partner":"Lending partner"}</div>
      <div class="field"><label>Company</label><input id="professionalCompany" value="${esc(d.company||"")}"></div>
      <div class="field"><label>Role</label><input id="professionalRole" value="${esc(d.role||type)}"></div>
      <div class="field"><label>${type==="Lender"?"NMLS number":"License number"}</label><input id="professionalLicenseNumber" value="${esc(d.licenseNumber||"")}"></div>
      <div class="field"><label>Service area</label><input id="professionalServiceArea" value="${esc(d.serviceArea||"")}"></div>
      <div class="field full"><label>Specialties</label><input id="professionalSpecialties" value="${esc(d.specialties||"")}" placeholder="${type==="Realtor"?"Luxury, farms, relocation":"FHA, VA, USDA, first-time buyers"}"></div>
      <div class="field full"><label>Referral notes</label><textarea id="professionalReferralNotes">${esc(d.referralNotes||"")}</textarea></div>`;
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
    <div class="field"><label>Type</label><select id="contactType">${["Seller","Buyer","Sphere","Past Client","Realtor","Lender"].map(x=>`<option ${type===x?"selected":""}>${x}</option>`).join("")}</select></div>
    <div class="field"><label>Stage</label><select id="contactStage">${(type==="Buyer"?buyerStages:sellerStages).map(x=>`<option ${c.stage===x?"selected":""}>${x}</option>`).join("")}</select></div>
    <div class="field"><label>Heat</label><select id="contactHeat">${["Hot","Warm","Cold"].map(x=>`<option ${c.heat===x?"selected":""}>${x}</option>`).join("")}</select></div>
    <div class="field"><label>Timeframe</label><select id="contactTimeframe">${["Now — 0–3 months","3–6 months","6–12 months","12+ months","Unknown"].map(x=>`<option ${(c.timeframe||"Unknown")===x?"selected":""}>${x}</option>`).join("")}</select></div>
    <div class="field"><label>Next follow-up</label><input id="contactFollowUp" type="date" value="${esc(c.followUp||TODAY())}"></div>
    <div class="field"><label>Source</label><select id="contactSource">${sources.map(x=>`<option ${c.source===x?"selected":""}>${x}</option>`).join("")}</select></div>
    <div class="field"><label>Property / target area</label><input id="contactProperty" value="${esc(c.property||"")}"></div>
    <div class="field"><label>Projected GCI</label><input id="contactGci" type="number" min="0" value="${c.gci||""}"></div>
    <div class="field full"><label>Tags</label><input id="contactTags" value="${esc((c.tags||[]).join(", "))}" placeholder="Type tags separated by commas: farm, referral partner, hot lead"><small class="field-help">Tags appear as clickable bubbles throughout the CRM.</small></div>
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
  professionalDetails:["Realtor","Lender"].includes(type)?{company:document.getElementById("professionalCompany")?.value.trim()||"",role:document.getElementById("professionalRole")?.value.trim()||type,licenseNumber:document.getElementById("professionalLicenseNumber")?.value.trim()||"",serviceArea:document.getElementById("professionalServiceArea")?.value.trim()||"",specialties:document.getElementById("professionalSpecialties")?.value.trim()||"",referralNotes:document.getElementById("professionalReferralNotes")?.value.trim()||""}:(old?.professionalDetails||{company:"",role:"",licenseNumber:"",serviceArea:"",specialties:"",referralNotes:""}),
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
  if(direction==="inbound"||(channel==="Note"&&["Connected","Appointment Set","Completed"].includes(outcome)))pauseReplyPlans(contactId,"Paused — real conversation logged");
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
  if(direction==="inbound"||(channel==="Note"&&["Connected","Appointment Set","Completed"].includes(outcome)))pauseReplyPlans(id,"Paused — real conversation logged");
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

function openTagModal(id){
  const c=contact(id);
  modal(`Add tag to ${fullName(c)}`,`<div class="field"><label>Tag</label><input id="newTagValue" placeholder="Referral partner, farm seller, USDA lender..." autofocus></div><div class="suggested-tags"><span>Suggestions</span>${["Referral Partner","Farm","Past Client","VIP","Hot Lead","First-Time Buyer","USDA","FHA","VA","Investor"].map(tag=>`<button class="tag-chip suggestion" data-action="choose-tag" data-tag="${tag}">${tag}</button>`).join("")}</div>`,`<button class="ghost-btn" data-action="close-modal">Cancel</button><button class="primary-btn" data-action="save-tag" data-id="${id}">Add tag</button>`)
}
function removeTag(id,tag){
  const c=contact(id);if(!c)return;
  c.tags=c.tags.filter(existing=>existing.toLowerCase()!==String(tag).toLowerCase());
  c.updatedAt=TODAY();save();toast("Tag removed",tag);route()
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
  modal("Apply action plan",`<div class="form-grid"><div class="field"><label>Person</label><select id="planContact">${contactOptions(contactId)}</select></div><div class="field"><label>Plan</label><select id="planId">${allPlans().map(p=>`<option value="${p.id}" ${p.id===planId?"selected":""}>${esc(p.name)}</option>`).join("")}</select></div><div class="field"><label>Start date</label><input id="planStart" type="date" value="${TODAY()}"></div><div class="field full"><div class="warning">Tasks are created when due. Texts and emails enter the Approval Queue for review before launching.</div></div></div>`,`<button class="ghost-btn" data-action="close-modal">Cancel</button><button class="primary-btn" data-action="save-plan-run">Apply plan</button>`)
}
function savePlanRun(){
  const contactId=document.getElementById("planContact").value,planId=document.getElementById("planId").value,start=document.getElementById("planStart").value||TODAY(),p=planById(planId),c=contact(contactId);
  if(!p||!c){alert("Choose a person and plan.");return}
  const result=startPlanForContact(contactId,planId,start,"");
  if(!result.ok){alert(result.reason);return}
  processAutomationEngine();
  save(false);closeModal();toast("Plan applied",`${p.name} • ${fullName(c)}`);route()
}
function pauseReplyPlans(contactId,reason="Paused — replied"){
  db.planRuns.filter(r=>r.contactId===contactId&&r.status==="Active").forEach(r=>{
    const p=planById(r.planId);
    if(p?.pauseOnReply){r.status=reason;r.pausedAt=NOW();r.pauseReason=reason;automationLog({kind:"Plan",name:p.name,contactId,status:"Paused",detail:reason,sourceId:r.id})}
  })
}
function planBuilderModal(planId="",duplicate=false){
  const original=planById(planId),p=original?JSON.parse(JSON.stringify(original)):{id:"",name:"",category:"Seller",description:"",pauseOnReply:true,goalStages:[],steps:[]};
  if(duplicate){p.id="";p.name=`Copy of ${p.name}`}
  const lines=(p.steps||[]).map(s=>`${s.day} | ${s.type} | ${s.title} | ${s.subject||""} | ${(s.body||"").replaceAll("\n"," ↵ ")}`).join("\n");
  modal(p.id?"Edit action plan":"Create action plan",`<div class="form-grid">
    <input type="hidden" id="builderPlanOriginalId" value="${esc(p.id||"")}">
    <div class="field"><label>Plan name</label><input id="builderPlanName" value="${esc(p.name||"")}"></div>
    <div class="field"><label>Category</label><select id="builderPlanCategory">${["Seller","Buyer","Past Client","Partner","Transaction","Custom"].map(x=>`<option ${p.category===x?"selected":""}>${x}</option>`).join("")}</select></div>
    <div class="field full"><label>Description</label><input id="builderPlanDescription" value="${esc(p.description||"")}"></div>
    <div class="field"><label>Pause when a real reply is logged</label><select id="builderPlanPause"><option value="true" ${p.pauseOnReply?"selected":""}>Yes</option><option value="false" ${!p.pauseOnReply?"selected":""}>No</option></select></div>
    <div class="field"><label>Stop when stage reaches</label><input id="builderPlanGoals" value="${esc((p.goalStages||[]).join(", "))}" placeholder="Listing Appointment, Closed"></div>
    <div class="field full"><label>Plan steps</label><textarea id="builderPlanSteps" class="code-textarea" placeholder="0 | Call | Call the lead | | Learn motivation and timing">${esc(lines)}</textarea><small class="field-help">One step per line: day | type | title | email subject | message/value. Types: Task, Call, Text, Email, Follow Up, Appointment, Add Tag, Remove Tag, Set Stage, Set Heat, Set Follow-Up, Note.</small></div>
  </div>`,`<button class="ghost-btn" data-action="close-modal">Cancel</button><button class="primary-btn" data-action="save-plan-builder">Save action plan</button>`)
}
function parsePlanSteps(text){
  return String(text||"").split(/\n+/).map((line,index)=>{
    const parts=line.split("|").map(x=>x.trim());
    if(parts.length<3||!parts[2])return null;
    return {id:`step-${uid()}`,day:Math.max(0,Number(parts[0]||0)),type:parts[1]||"Task",title:parts[2],subject:parts[3]||"",body:(parts.slice(4).join(" | ")||"").replaceAll(" ↵ ","\n")}
  }).filter(Boolean).sort((a,b)=>a.day-b.day)
}
function savePlanBuilder(){
  const originalId=document.getElementById("builderPlanOriginalId").value,name=document.getElementById("builderPlanName").value.trim();
  if(!name){alert("Name the action plan.");return}
  const steps=parsePlanSteps(document.getElementById("builderPlanSteps").value);
  if(!steps.length){alert("Add at least one valid plan step.");return}
  const id=originalId||`custom-plan-${uid()}`,plan={id,name,category:document.getElementById("builderPlanCategory").value,description:document.getElementById("builderPlanDescription").value.trim(),pauseOnReply:document.getElementById("builderPlanPause").value==="true",goalStages:document.getElementById("builderPlanGoals").value.split(",").map(x=>x.trim()).filter(Boolean),steps};
  const i=db.actionPlans.findIndex(x=>x.id===id);if(i>=0)db.actionPlans[i]=plan;else db.actionPlans.push(plan);
  save();closeModal();state.automationTab="plans";renderAutomations();toast("Action plan saved",name)
}
function ruleBuilderModal(ruleId="",duplicate=false){
  const original=(db.automationRules||[]).find(r=>r.id===ruleId);
  const r=original?JSON.parse(JSON.stringify(original)):{id:"",name:"",description:"",trigger:"Contact Created",active:true,runMode:"once",filters:{type:"",stage:"",heat:"",source:"",tag:"",noContactDays:"",minScore:"",behaviorType:""},actions:[{type:"Create Task",value:"Follow up today",extra:"Follow Up"}]};
  if(duplicate){r.id="";r.name=`Copy of ${r.name}`}
  const actionLines=(r.actions||[]).map(a=>`${a.type} | ${a.value||""} | ${a.extra||""} | ${a.subject||""}`).join("\n");
  modal(r.id?"Edit automation rule":"Create automation rule",`<div class="form-grid">
    <input type="hidden" id="builderRuleId" value="${esc(r.id||"")}">
    <div class="field"><label>Rule name</label><input id="builderRuleName" value="${esc(r.name||"")}"></div>
    <div class="field"><label>Trigger</label><select id="builderRuleTrigger">${["Contact Created","Stage Match","Behavior","Follow-Up Due","Stale","Inbound Reply","Task Completed","Manual","Always"].map(x=>`<option ${r.trigger===x?"selected":""}>${x}</option>`).join("")}</select></div>
    <div class="field full"><label>Description</label><input id="builderRuleDescription" value="${esc(r.description||"")}"></div>
    <div class="field"><label>Contact type</label><select id="builderRuleType"><option value="">Any</option>${["Seller","Buyer","Sphere","Past Client","Realtor","Lender"].map(x=>`<option ${r.filters?.type===x?"selected":""}>${x}</option>`).join("")}</select></div>
    <div class="field"><label>Stage</label><select id="builderRuleStage"><option value="">Any</option>${[...new Set([...sellerStages,...buyerStages])].map(x=>`<option ${r.filters?.stage===x?"selected":""}>${x}</option>`).join("")}</select></div>
    <div class="field"><label>Heat</label><select id="builderRuleHeat"><option value="">Any</option>${["Hot","Warm","Cold"].map(x=>`<option ${r.filters?.heat===x?"selected":""}>${x}</option>`).join("")}</select></div>
    <div class="field"><label>Source</label><select id="builderRuleSource"><option value="">Any</option>${sources.map(x=>`<option ${r.filters?.source===x?"selected":""}>${x}</option>`).join("")}</select></div>
    <div class="field"><label>Required tag</label><input id="builderRuleTag" value="${esc(r.filters?.tag||"")}"></div>
    <div class="field"><label>No communication for days</label><input id="builderRuleNoContact" type="number" min="0" value="${esc(r.filters?.noContactDays??"")}"></div>
    <div class="field"><label>Minimum lead score</label><input id="builderRuleScore" type="number" min="0" max="100" value="${esc(r.filters?.minScore??"")}"></div>
    <div class="field"><label>Behavior signal</label><select id="builderRuleBehavior"><option value="">Any</option><option ${r.filters?.behaviorType==="High Intent"?"selected":""}>High Intent</option>${behaviorTypes.map(x=>`<option ${r.filters?.behaviorType===x?"selected":""}>${x}</option>`).join("")}</select></div>
    <div class="field"><label>Repeat behavior</label><select id="builderRuleRunMode">${[["once","Once per contact"],["changed","When matching data changes"],["daily","At most daily"],["monthly","At most monthly"]].map(([v,l])=>`<option value="${v}" ${r.runMode===v?"selected":""}>${l}</option>`).join("")}</select></div>
    <div class="field"><label>Status</label><select id="builderRuleActive"><option value="true" ${r.active?"selected":""}>Active</option><option value="false" ${!r.active?"selected":""}>Disabled</option></select></div>
    <div class="field full"><label>Actions</label><textarea id="builderRuleActions" class="code-textarea">${esc(actionLines)}</textarea><small class="field-help">One action per line: action | value | extra. Examples: Start Plan | seller-speed · Create Task | Call today | Call · Add Tag | High Intent · Set Follow-Up | 3 · Queue Text | Hi {{first_name}}... | Personal check-in</small></div>
  </div>`,`<button class="ghost-btn" data-action="close-modal">Cancel</button><button class="primary-btn" data-action="save-rule-builder">Save rule</button>`)
}
function parseRuleActions(text){
  const allowed=["Start Plan","Create Task","Add Tag","Remove Tag","Set Heat","Set Stage","Set Follow-Up","Add Note","Pause Plans","Queue Text","Queue Email"];
  return String(text||"").split(/\n+/).map(line=>{const p=line.split("|").map(x=>x.trim());if(!p[0]||!allowed.includes(p[0]))return null;return {type:p[0],value:p[1]||"",extra:p[2]||"",subject:p[3]||""}}).filter(Boolean)
}
function saveRuleBuilder(){
  const id=document.getElementById("builderRuleId").value||`custom-rule-${uid()}`,name=document.getElementById("builderRuleName").value.trim(),actions=parseRuleActions(document.getElementById("builderRuleActions").value);
  if(!name){alert("Name the automation rule.");return}
  if(!actions.length){alert("Add at least one valid action.");return}
  const rule={id,name,description:document.getElementById("builderRuleDescription").value.trim(),trigger:document.getElementById("builderRuleTrigger").value,active:document.getElementById("builderRuleActive").value==="true",runMode:document.getElementById("builderRuleRunMode").value,filters:{type:document.getElementById("builderRuleType").value,stage:document.getElementById("builderRuleStage").value,heat:document.getElementById("builderRuleHeat").value,source:document.getElementById("builderRuleSource").value,tag:document.getElementById("builderRuleTag").value.trim(),noContactDays:document.getElementById("builderRuleNoContact").value,minScore:document.getElementById("builderRuleScore").value,behaviorType:document.getElementById("builderRuleBehavior").value},actions};
  const i=db.automationRules.findIndex(x=>x.id===id);if(i>=0)db.automationRules[i]=rule;else db.automationRules.push(rule);
  save();closeModal();state.automationTab="rules";renderAutomations();toast("Automation saved",name)
}
function previewRuleModal(ruleId){
  const rule=db.automationRules.find(r=>r.id===ruleId),matches=matchingContactsForRule(rule,true);
  modal(`Preview: ${rule.name}`,`<div class="preview-summary"><strong>${matches.length} contacts match right now</strong><span>${esc(automationConditionSummary(rule))}</span></div><div class="preview-contact-list">${matches.length?matches.map(c=>`<div>${avatar(c)}<span><b>${esc(fullName(c))}</b><small>${esc(c.type)} • ${esc(c.stage)} • score ${scoreContact(c).score}</small></span></div>`).join(""):`<div class="empty">Nobody currently matches this trigger and its conditions.</div>`}</div>`,`<button class="ghost-btn" data-action="close-modal">Close</button>${matches.length?`<button class="primary-btn" data-action="run-rule" data-id="${ruleId}">Run for these contacts</button>`:""}`)
}
function runRuleNow(ruleId){
  const rule=db.automationRules.find(r=>r.id===ruleId);if(!rule)return;
  const matches=matchingContactsForRule(rule,false);
  if(!matches.length){toast("No matches",rule.name);return}
  if(!confirm(`Run "${rule.name}" for ${matches.length} matching contact(s)? Messages will be queued for review.`))return;
  let count=0;matches.forEach(c=>{if(runAutomationRule(rule,c,{manual:true}))count++});
  processPlanRuns();save(false);closeModal();renderAutomations();toast("Rule completed",`${count} contacts processed`)
}
function batchQueueModal(){
  const tags=[...new Set(db.contacts.flatMap(c=>c.tags))].sort();
  modal("Build personalized batch queue",`<div class="warning">This creates one personalized draft per person. It does not secretly blast messages. Review consent, relevance, and the final wording before launching each message.</div><div class="form-grid" style="margin-top:12px">
    <div class="field"><label>Contact type</label><select id="batchType"><option value="">Any</option>${["Seller","Buyer","Sphere","Past Client","Realtor","Lender"].map(x=>`<option>${x}</option>`).join("")}</select></div>
    <div class="field"><label>Required tag</label><select id="batchTag"><option value="">Any</option>${tags.map(x=>`<option>${esc(x)}</option>`).join("")}</select></div>
    <div class="field"><label>Channel</label><select id="batchChannel"><option>Text</option><option>Email</option></select></div>
    <div class="field"><label>Email subject</label><input id="batchSubject" value="A quick Holton Homes check-in"></div>
    <div class="field full"><label>Message template</label><textarea id="batchBody">Hi {{first_name}}, I wanted to personally check in and see what has changed with your real estate plans. — {{agent_name}}</textarea><small class="field-help">Available fields: {{first_name}}, {{last_name}}, {{full_name}}, {{property}}, {{agent_name}}, {{agent_email}}, {{agent_phone}}.</small></div>
  </div>`,`<button class="ghost-btn" data-action="close-modal">Cancel</button><button class="primary-btn" data-action="save-batch-queue">Create review queue</button>`)
}
function saveBatchQueue(){
  const type=document.getElementById("batchType").value,tag=document.getElementById("batchTag").value,channel=document.getElementById("batchChannel").value,subject=document.getElementById("batchSubject").value.trim(),body=document.getElementById("batchBody").value.trim();
  if(!body){alert("Write a message.");return}
  const contacts=db.contacts.filter(c=>(!type||c.type===type)&&(!tag||c.tags.some(t=>t.toLowerCase()===tag.toLowerCase())));
  let count=0;contacts.forEach(c=>{if(channel==="Text"&&!hasPhone(c))return;if(channel==="Email"&&!hasEmail(c))return;queueAutomationMessage(c,channel,"Personal batch follow-up",body,subject,"Batch",`${TODAY()}:${type}:${tag}:${channel}`,TODAY());count++});
  save(false);closeModal();state.automationTab="queue";renderAutomations();toast("Batch queue created",`${count} personalized drafts need review`)
}
function queueItemModal(id){
  const item=db.automationQueue.find(q=>q.id===id),c=contact(item?.contactId);if(!item||!c)return;
  modal(`Review ${item.channel} for ${fullName(c)}`,`<div class="form-grid">
    <div class="field"><label>Person</label><input value="${esc(fullName(c))}" disabled></div>
    <div class="field"><label>Destination</label><input value="${esc(item.channel==="Text"?c.phone:c.email)}" disabled></div>
    ${item.channel==="Email"?`<div class="field full"><label>Subject</label><input id="queueSubject" value="${esc(item.subject||"")}"></div>`:""}
    <div class="field full"><label>Message</label><textarea id="queueBody">${esc(item.body)}</textarea></div>
    <div class="field full"><div class="warning">Launching opens your device's ${item.channel.toLowerCase()} app. Mark it sent only after you actually send it.</div></div>
  </div>`,`<button class="ghost-btn" data-action="skip-queue-item" data-id="${id}">Skip</button><button class="ghost-btn" data-action="launch-queue-item" data-id="${id}">Launch ${item.channel}</button><button class="primary-btn" data-action="mark-queue-sent" data-id="${id}">Mark sent</button>`)
}
function updateQueueDraftFromModal(item){
  const body=document.getElementById("queueBody");if(body)item.body=body.value;
  const subject=document.getElementById("queueSubject");if(subject)item.subject=subject.value
}
function launchQueueItem(id){
  const item=db.automationQueue.find(q=>q.id===id),c=contact(item?.contactId);if(!item||!c)return;
  updateQueueDraftFromModal(item);save(false);
  if(item.channel==="Text"&&hasPhone(c))location.href=`sms:${c.phone.replace(/[^\d+]/g,"")}?&body=${encodeURIComponent(item.body)}`;
  if(item.channel==="Email"&&hasEmail(c))location.href=`mailto:${c.email}?subject=${encodeURIComponent(item.subject||"Holton Homes")}&body=${encodeURIComponent(item.body)}`
}
function markQueueSent(id){
  const item=db.automationQueue.find(q=>q.id===id),c=contact(item?.contactId);if(!item||!c)return;
  updateQueueDraftFromModal(item);item.status="Sent";item.sentAt=NOW();
  db.communications.unshift({id:uid(),contactId:c.id,channel:item.channel,direction:"outbound",outcome:"Sent from approval queue",body:item.body,date:NOW(),unread:false,threadStatus:"open",createdAt:NOW()});
  c.lastCommunication=TODAY();c.followUp=addDays(TODAY(),3);
  db.tasks.filter(t=>t.sourceKey===`queue:${item.id}`&&t.status!=="Done").forEach(t=>{t.status="Done";t.completedAt=TODAY()});
  automationLog({kind:"Approval Queue",name:item.title,contactId:c.id,status:"Completed",detail:`${item.channel} marked sent.`,sourceId:item.id});
  save();closeModal();renderAutomations();toast("Message logged",`${item.channel} to ${fullName(c)}`)
}
function skipQueueItem(id){
  const item=db.automationQueue.find(q=>q.id===id);if(!item)return;
  item.status="Skipped";item.skipReason="Skipped by user";db.tasks.filter(t=>t.sourceKey===`queue:${item.id}`&&t.status!=="Done").forEach(t=>{t.status="Done";t.completedAt=TODAY()});
  automationLog({kind:"Approval Queue",name:item.title,contactId:item.contactId,status:"Skipped",detail:"Skipped during human review.",sourceId:item.id});
  save(false);closeModal();renderAutomations();toast("Draft skipped",item.title)
}

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
  const directNameLink=event.target.closest("a.person-name-link");
  if(directNameLink){
    const actionNode=directNameLink.closest("[data-action]");
    if(actionNode&&actionNode!==directNameLink)event.stopPropagation();
  }
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
  if(action==="name-link")return;
  if(action==="open-tag")openTagModal(id);
  if(action==="choose-tag"){const input=document.getElementById("newTagValue");if(input)input.value=el.dataset.tag||""}
  if(action==="save-tag"){const input=document.getElementById("newTagValue");if(addTagToContact(id,input?.value||"")){closeModal();toast("Tag added",normalizeTag(input.value));route()}}
  if(action==="remove-tag"){event.preventDefault();event.stopPropagation();removeTag(id,el.dataset.tag||"")}
  if(action==="filter-tag"){state.peopleQuery=el.dataset.tag||"";state.smartList="all";location.hash="#/people";setTimeout(renderPeople,0)}
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
  if(action==="automation-tab"){state.automationTab=id;renderAutomations()}
  if(action==="run-engine"){processAutomationEngine({manual:true});toast("Automation check complete","Rules, plans, and due steps were evaluated.")}
  if(action==="open-rule-builder")ruleBuilderModal(id||"",false);
  if(action==="save-rule-builder")saveRuleBuilder();
  if(action==="toggle-rule"){const rule=db.automationRules.find(r=>r.id===id);if(rule){rule.active=!rule.active;save(false);renderAutomations()}}
  if(action==="preview-rule")previewRuleModal(id);
  if(action==="run-rule")runRuleNow(id);
  if(action==="duplicate-rule")ruleBuilderModal(id,true);
  if(action==="open-plan-builder")planBuilderModal(id||"",false);
  if(action==="save-plan-builder")savePlanBuilder();
  if(action==="duplicate-plan")planBuilderModal(id,true);
  if(action==="build-batch-queue")batchQueueModal();
  if(action==="save-batch-queue")saveBatchQueue();
  if(action==="process-next-queue"){const next=db.automationQueue.find(q=>q.status==="Needs Review");if(next)queueItemModal(next.id);else toast("Queue clear","No messages need review.")}
  if(action==="open-queue-item")queueItemModal(id);
  if(action==="launch-queue-item")launchQueueItem(id);
  if(action==="mark-queue-sent")markQueueSent(id);
  if(action==="skip-queue-item")skipQueueItem(id);
  if(action==="clear-automation-logs"&&confirm("Clear the automation audit log? Contacts and plan runs will remain.")){db.automationLogs=[];save(false);renderAutomations()}
  if(action==="apply-plan")planModal(id||"",el.dataset.plan||"");
  if(action==="save-plan-run")savePlanRun();
  if(action==="toggle-plan-run"){const run=db.planRuns.find(r=>r.id===id);if(run){run.status=run.status==="Active"?"Paused by user":"Active";run.pauseReason=run.status==="Active"?"":"Paused by user";save();renderAutomations()}}
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
    box.innerHTML=hits.length?hits.map(c=>`<a class="search-hit" href="#/contact/${c.id}"><div><strong class="person-name-link">${esc(fullName(c))}</strong><small>${esc(c.stage)} • ${esc(c.phone||c.email||"No contact info")}</small></div><span class="score ${scoreClass(scoreContact(c).score)}">${scoreContact(c).score}</span></a>`).join(""):`<div class="empty">No matches.</div>`;box.classList.add("open")
  }
});
document.addEventListener("keydown",event=>{
  if(event.key==="Enter"&&event.target.id==="newTagValue"){
    event.preventDefault();
    const saveButton=document.querySelector('[data-action="save-tag"]');
    if(saveButton)saveButton.click()
  }
});
document.addEventListener("dragstart",event=>{const card=event.target.closest(".deal-card");if(card)event.dataTransfer.setData("text/plain",card.dataset.contact)});
document.addEventListener("dragover",event=>{const col=event.target.closest(".kanban-column");if(col){event.preventDefault();col.classList.add("dragover")}});
document.addEventListener("dragleave",event=>event.target.closest(".kanban-column")?.classList.remove("dragover"));
document.addEventListener("drop",event=>{const col=event.target.closest(".kanban-column");if(!col)return;event.preventDefault();col.classList.remove("dragover");const c=contact(event.dataTransfer.getData("text/plain"));if(c){c.stage=col.dataset.stage;c.updatedAt=TODAY();if(c.stage==="Under Contract"&&!db.tasks.some(t=>t.contactId===c.id&&t.type==="Transaction"&&t.status!=="Done"))["Inspection / due diligence","Appraisal and financing","Title / closing preparation","Final walkthrough"].forEach((title,i)=>db.tasks.push({id:uid(),contactId:c.id,title,type:"Transaction",due:addDays(TODAY(),[7,14,21,28][i]),status:"Open",priority:"High",planRunId:"",createdAt:TODAY()}));save();renderPipeline();toast("Stage updated",`${fullName(c)} → ${c.stage}`)}})
document.getElementById("globalAddPerson")?.addEventListener("click",event=>{
  event.preventDefault();
  event.stopPropagation();
  openContactModal("");
});
document.getElementById("drawerBackdrop").addEventListener("click",closePip);
document.getElementById("modalBackdrop").addEventListener("click",event=>{if(event.target.id==="modalBackdrop")closeModal()});
window.addEventListener("hashchange",route);
renderPip();route();restoreFromIndexedDbIfNeeded();setTimeout(()=>processAutomationEngine(),250);
})();