const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const store = new Map();
global.window = global;
global.dispatchEvent = () => true;
global.CustomEvent = class CustomEvent { constructor(type, init={}) { this.type=type; this.detail=init.detail; } };
global.localStorage = {
  getItem: k => store.has(k) ? store.get(k) : null,
  setItem: (k,v) => store.set(k, String(v)),
  removeItem: k => store.delete(k)
};

const CRM_KEY = 'holtonHomesOS_v13';
const crm = {
  contacts: [{
    id:'c1', firstName:'Sarah', lastName:'Test', type:'Seller', stage:'Contacted', heat:'Hot',
    source:'Referral', timeframe:'0–3 months', followUp:'2026-08-19',
    phone:'555-555-5555', email:'sarah@example.com',
    notes:'Seller may move. routing number: 123456789 password: hunter2 SSN 123-45-6789 alternate sarah.private@example.com 513-555-1212'
  }],
  communications:[{id:'m1',contactId:'c1',date:'2026-08-18',channel:'Call',direction:'inbound',body:'Passport number ABCD1234. Wants to discuss timing.'}],
  tasks:[{id:'t1',contactId:'c1',title:'Call Sarah',due:'2026-08-19',status:'Open',type:'Call'}],
  properties:[{id:'p1',contactId:'c1',primary:true,street:'123 Test St',city:'Cincinnati',state:'OH',zip:'45202',propertyType:'Single Family',sqft:2000,acres:.25,beds:3,baths:2,yearBuilt:1995,mortgageBalance:987654321,notes:'PIN 4444'}],
  opportunities:[], transactions:[]
};
localStorage.setItem(CRM_KEY, JSON.stringify(crm));

let lastChatBody = null;
global.fetch = async (url, opts={}) => {
  if (String(url).endsWith('/api/tags')) return {ok:true,status:200,json:async()=>({models:[{name:'qwen3:8b'}]})};
  if (String(url).endsWith('/api/chat')) {
    lastChatBody = JSON.parse(opts.body);
    return {ok:true,status:200,json:async()=>({message:{content:'<think>hidden reasoning</think>FACTS\nDraft generated from provided context.'}})};
  }
  throw new Error('Unexpected URL '+url);
};

vm.runInThisContext(fs.readFileSync(require('path').join(__dirname,'..','holton-studio-engine.js'),'utf8'));
const E = global.HoltonStudioEngine;
assert(E, 'engine exported');
assert.strictEqual(E.TOOL_CATALOG.length,36,'36 tools');
assert(/^\d{4}-\d{2}-\d{2}$/.test(E.today()), 'local-date format');
assert(!('crmSnapshot' in E.exportAll()), 'Studio backup must not include CRM by default');
assert('crmSnapshot' in E.exportAll({includeCRM:true}), 'explicit CRM export option remains available for controlled use');

const hits=E.scanText('Perfect for families in a safe neighborhood with guaranteed appreciation. REALTOR®', {publicFacing:true,profile:E.readStudio().profile});
assert(hits.length>=4,'risk scanner');

const ctx=E.buildContactContext('c1');
const ctxText=JSON.stringify(ctx);
for (const secret of ['555-555-5555','sarah@example.com','sarah.private@example.com','513-555-1212','123456789','hunter2','123-45-6789','ABCD1234','987654321','4444']) {
  assert(!ctxText.includes(secret), 'secret leaked in context: '+secret);
}

const cma=E.calculateCMA(
  {address:'100 Subject Rd',propertyType:'Single Family',sqft:2000,acres:.3,beds:3,baths:2,yearBuilt:1995},
  [
    {address:'A',status:'Sold',salePrice:300000,saleDate:'2026-07-01',propertyType:'Single Family',sqft:1950,acres:.28,beds:3,baths:2,yearBuilt:1993,distanceMiles:.3,source:'Brown County Auditor',include:true},
    {address:'B',status:'Sold',salePrice:315000,saleDate:'2026-06-10',propertyType:'Single Family',sqft:2050,acres:.32,beds:3,baths:2,yearBuilt:1998,distanceMiles:.5,source:'Clermont County Auditor',include:true},
    {address:'C',status:'Sold',salePrice:305000,saleDate:'2026-05-20',propertyType:'Single Family',sqft:2010,acres:.3,beds:3,baths:2,yearBuilt:1996,distanceMiles:.8,source:'Hamilton County Auditor',include:true}
  ]
);
assert(cma.indicated>290000 && cma.indicated<325000,'CMA center plausible');
assert(cma.rangeLow<cma.indicated && cma.rangeHigh>cma.indicated,'CMA range surrounds center');
assert.strictEqual(cma.sampleSize,3,'CMA sample size');
const contextOnly=E.calculateCMA(
  {address:'100 Subject Rd',propertyType:'Single Family',sqft:2000},
  [{address:'Active 1',status:'Active',salePrice:399000,propertyType:'Single Family',sqft:2000,source:'Manual Verified',include:true}]
);
assert.strictEqual(contextOnly.sampleSize,0,'active listing must not become closed-sale evidence');
assert.strictEqual(contextOnly.indicated,0,'active-only set must not generate indicated center');
assert.strictEqual(contextOnly.contextRows.length,1,'active listing retained as context');

E.updateStudio(s => {s.ai.model='qwen3:8b'; s.ai.endpoint='http://127.0.0.1:11434'; s.ai.keepAlive=0; return s;});
(async()=>{
  const models=await E.listOllamaModels();
  assert.strictEqual(models[0].name,'qwen3:8b','model discovery');
  const out=await E.generate('lead-brief',{contactId:'c1',extra:'routing number: 123456789'});
  assert(!out.text.includes('<think>'),'thinking stripped');
  assert(lastChatBody,'chat called');
  assert.strictEqual(lastChatBody.keep_alive,0,'model unload configured');
  const wire=JSON.stringify(lastChatBody);
  for (const secret of ['555-555-5555','sarah@example.com','sarah.private@example.com','513-555-1212','123456789','hunter2','123-45-6789','ABCD1234','987654321','4444']) {
    assert(!wire.includes(secret), 'secret leaked to Ollama: '+secret);
  }
  console.log('PASS engine smoke: tools, privacy, compliance scan, CMA, Ollama protocol');
})().catch(err=>{console.error(err);process.exit(1)});
