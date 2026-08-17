(() => {
"use strict";

/* Holton Homes OS v15.3 — modal/workspace detection
   This intentionally enhances the existing app instead of replacing its forms. */

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));

function visible(el){
  if(!el)return false;
  const r=el.getBoundingClientRect();
  const st=getComputedStyle(el);
  return r.width>0&&r.height>0&&st.display!=="none"&&st.visibility!=="hidden";
}

function likelyEditorAncestor(node){
  let el=node;
  let best=null;
  for(let i=0;i<9&&el&&el!==document.body;i++,el=el.parentElement){
    if(!visible(el))continue;
    const r=el.getBoundingClientRect();
    const cs=getComputedStyle(el);
    const cls=String(el.className||"").toLowerCase();
    if(
      cls.includes("modal")||
      cls.includes("dialog")||
      cls.includes("drawer")||
      el.getAttribute("role")==="dialog"||
      ((cs.position==="fixed"||cs.position==="absolute")&&r.width>480&&r.height>300)
    ){
      best=el;
      break;
    }
    if(r.width>520&&r.height>420&&r.width<window.innerWidth*.92){
      best=el;
    }
  }
  return best;
}

function markBackdrop(editor){
  let p=editor?.parentElement;
  for(let i=0;i<4&&p&&p!==document.body;i++,p=p.parentElement){
    const r=p.getBoundingClientRect();
    if(r.width>=window.innerWidth*.92&&r.height>=window.innerHeight*.88){
      p.classList.add("v153-modal-layer");
      return;
    }
  }
}

function addKicker(editor,label,detail){
  if(!editor||$(".v153-editor-kicker",editor))return;
  const bar=document.createElement("div");
  bar.className="v153-editor-kicker";
  bar.innerHTML=`<span>${label}</span><small>${detail}</small>`;
  editor.prepend(bar);
}

function enhanceStoryEditor(){
  const headings=$$("h1,h2,h3,strong").filter(el=>visible(el));
  const title=headings.find(el=>/save content story|edit content story|content story/i.test((el.textContent||"").trim()));
  if(!title)return;

  const editor=likelyEditorAncestor(title);
  if(!editor)return;

  editor.classList.add("v153-editor","v153-story-editor");
  markBackdrop(editor);
  addKicker(editor,"CONTENT WORKSPACE","Build the story once. Move it through the pipeline.");

  if(!$(".v153-story-progress",editor)){
    const progress=document.createElement("div");
    progress.className="v153-story-progress";
    progress.innerHTML=[
      "Story","Verify","Learn","Teach Back","Script","Film","Published"
    ].map(x=>`<span>${x}</span>`).join("");
    const kicker=$(".v153-editor-kicker",editor);
    kicker?.insertAdjacentElement("afterend",progress);
  }

  // Make labels containing textareas span full width even if the original app has no class.
  $$("label",editor).forEach(label=>{
    if(label.querySelector("textarea"))label.classList.add("full-width");
  });
}

function enhanceOtherEditors(){
  const patterns=[
    ["New contact","CONTACT WORKSPACE","Add the relationship and set the next step."],
    ["Edit contact","CONTACT WORKSPACE","Update the relationship without losing context."],
    ["Add task","COMMITMENT","Create a clear promise with a due date."],
    ["New task","COMMITMENT","Create a clear promise with a due date."],
    ["Add transaction","TRANSACTION","Protect dates, money and next actions."],
    ["Edit transaction","TRANSACTION","Protect dates, money and next actions."],
    ["Add appointment","APPOINTMENT","Put the commitment on the calendar."],
    ["New appointment","APPOINTMENT","Put the commitment on the calendar."],
    ["Add vendor","LOCAL NETWORK","Save a partner you would actually refer."],
    ["Edit vendor","LOCAL NETWORK","Keep partner details current."]
  ];
  const heads=$$("h1,h2,h3,strong").filter(el=>visible(el));
  for(const [match,kicker,detail] of patterns){
    const title=heads.find(el=>(el.textContent||"").trim().toLowerCase().includes(match.toLowerCase()));
    if(!title)continue;
    const editor=likelyEditorAncestor(title);
    if(!editor||editor.classList.contains("v153-editor"))continue;
    editor.classList.add("v153-editor");
    markBackdrop(editor);
    addKicker(editor,kicker,detail);
  }
}

function improveContentPage(){
  if(!location.hash.startsWith("#/content"))return;
  const view=$("#view");
  if(!view)return;
  view.classList.add("v153-content-page");

  const head=$(".page-head",view);
  if(head){
    const h=head.querySelector("h1");
    const p=head.querySelector("p");
    if(h&&h.textContent.trim()==="Content")h.textContent="Content";
    if(p)p.textContent="Turn useful local information into conversations, leads, and trust.";
  }
}

function run(){
  enhanceStoryEditor();
  enhanceOtherEditors();
  improveContentPage();
}

window.addEventListener("load",()=>setTimeout(run,120));
window.addEventListener("hashchange",()=>setTimeout(run,60));
new MutationObserver(()=>setTimeout(run,20)).observe(document.body,{childList:true,subtree:true});
setTimeout(run,100);
})();

/* Restore original Today DOM if a stale soft-navigation left Calm Workday markup behind. */
(() => {
  function cleanup(){
    if(!(location.hash||"#/today").startsWith("#/today")) return;
    document.querySelectorAll(".v16-day-plan,.v151-command-center,.v152-status-strip,.v152-focus-title,.v152-who-to-call")
      .forEach(el=>el.remove());
    const root=document.getElementById("view");
    root?.classList.remove("v16-today","v152-today","v151-desktop-today");
  }
  window.addEventListener("load",()=>setTimeout(cleanup,100));
  window.addEventListener("hashchange",()=>setTimeout(cleanup,60));
  setTimeout(cleanup,80);
})();
