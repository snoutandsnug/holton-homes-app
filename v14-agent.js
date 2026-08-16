(() => {
  "use strict";

  const STORAGE_KEYS = ["holtonHomesOS_v13","holtonHomesOS_v14"];
  const $ = (s, root=document) => root.querySelector(s);

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

  function dayDiff(value) {
    if (!value) return 999;
    const d = new Date(String(value).slice(0,10) + "T12:00:00");
    return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
  }

  function businessScore(c) {
    let score = 0;
    const why = [];
    if (!c || ["Closed","Lost"].includes(c.stage)) return {score:-1, why:[]};

    if (c.type === "Seller") { score += 24; why.push("seller opportunity"); }
    if (c.heat === "Hot") { score += 25; why.push("hot"); }
    else if (c.heat === "Warm") { score += 12; why.push("warm"); }

    const tf = c.timeframe || "";
    if (tf.includes("0–3") || tf.includes("0-3")) { score += 22; why.push("near-term move"); }
    else if (tf.includes("3–6") || tf.includes("3-6")) { score += 12; why.push("3–6 month timing"); }

    const today = new Date().toISOString().slice(0,10);
    if (c.followUp && c.followUp <= today) { score += 24; why.push(c.followUp < today ? "follow-up overdue" : "follow-up due"); }
    if (!c.followUp && ["Seller","Buyer"].includes(c.type)) { score += 8; why.push("missing next step"); }

    const stale = dayDiff(c.lastCommunication);
    if (stale >= 30 && stale < 999) { score += 16; why.push(`${stale} days since contact`); }
    else if (stale >= 14 && stale < 999) { score += 10; why.push(`${stale} days since contact`); }

    if (["Valuation Requested","Valuation Delivered","Listing Appointment","Follow-Up"].includes(c.stage)) {
      score += 20; why.push(c.stage.toLowerCase());
    }
    if (c.source === "Referral" || c.source === "Sphere" || c.type === "Past Client") {
      score += 7; why.push("relationship business");
    }
    if ((c.behaviors || []).some(b => dayDiff(b.date) <= 14 && ["Home Valuation","Requested Showing","Repeated Property View"].includes(b.type))) {
      score += 18; why.push("recent intent signal");
    }
    return {score, why};
  }

  function topBusiness(db, n=5) {
    return (db.contacts || [])
      .map(c => ({c, ...businessScore(c)}))
      .filter(x => x.score >= 0)
      .sort((a,b) => b.score - a.score)
      .slice(0,n);
  }

  function minimalContext(db) {
    const contacts = (db.contacts || []).slice(0,180).map(c => ({
      id:c.id, firstName:c.firstName, lastName:c.lastName, type:c.type, stage:c.stage, heat:c.heat,
      timeframe:c.timeframe, followUp:c.followUp, lastCommunication:c.lastCommunication, source:c.source,
      sourceDetail:c.sourceDetail, property:c.property, tags:(c.tags||[]).slice(0,12),
      notes:String(c.notes||"").slice(0,700),
      sellerDetails:c.sellerDetails ? {
        motivation:c.sellerDetails.motivation, timing:c.sellerDetails.timing
      } : undefined,
      buyerDetails:c.buyerDetails ? {
        areas:c.buyerDetails.areas, budget:c.buyerDetails.budget, desiredPayment:c.buyerDetails.desiredPayment
      } : undefined,
      behaviors:(c.behaviors||[]).slice(-8)
    }));

    return {
      now:new Date().toISOString(),
      settings:{
        agentName:db.settings?.agentName,
        coreMarkets:db.settings?.coreMarkets,
        annualGciTarget:db.settings?.annualGciTarget,
        dailyConversationTarget:db.settings?.dailyConversationTarget
      },
      contacts,
      leadInbox:(db.leadInbox||[]).filter(x => !["Converted","Archived"].includes(x.status)).slice(0,40).map(x => ({
        id:x.id, firstName:x.firstName, lastName:x.lastName, source:x.source, sourceDetail:x.sourceDetail,
        intent:x.intent, property:x.property, area:x.area, message:String(x.message||"").slice(0,500),
        status:x.status, receivedAt:x.receivedAt, responseStartedAt:x.responseStartedAt
      })),
      tasks:(db.tasks||[]).filter(t => t.status !== "Done").slice(0,120).map(t => ({
        id:t.id, contactId:t.contactId, title:t.title, type:t.type, due:t.due, priority:t.priority, status:t.status
      })),
      transactions:(db.transactions||[]).filter(t => t.status !== "Closed").slice(0,30),
      communications:(db.communications||[]).slice(0,120).map(m => ({
        contactId:m.contactId, channel:m.channel, direction:m.direction, outcome:m.outcome,
        date:m.date, unread:m.unread, body:String(m.body||"").slice(0,500)
      })),
      content:(db.contentItems||[]).slice(0,40).map(x => ({
        id:x.id, title:x.title, stage:x.stage, area:x.area, topic:x.topic, publishedAt:x.publishedAt,
        views:x.views, inquiries:x.inquiries, appointments:x.appointments, gci:x.gci
      }))
    };
  }

  async function askAI(mode, prompt="") {
    const answer = $("#pipAnswer");
    if (answer) {
      answer.classList.add("v14-ai-loading");
      answer.classList.remove("v14-ai-answer");
      answer.textContent = "Pip is reading the CRM and building the next move…";
    }

    try {
      const db = parseDb();
      const response = await fetch("/api/pip", {
        method:"POST",
        headers:{"content-type":"application/json"},
        body:JSON.stringify({mode, prompt, context:minimalContext(db)})
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || `AI request failed (${response.status})`);
      if (answer) {
        answer.classList.remove("v14-ai-loading");
        answer.classList.add("v14-ai-answer");
        answer.textContent = payload.text || "No answer returned.";
      }
      return payload;
    } catch (error) {
      if (answer) {
        answer.classList.remove("v14-ai-loading");
        answer.classList.add("v14-ai-answer");
        answer.textContent =
          "Pip AI is not connected yet.\n\n" +
          (error.message || "Unknown error") +
          "\n\nThe CRM itself still works normally.";
      }
      return null;
    }
  }

  function openPipThen(mode, prompt="") {
    const pipButton = $('[data-action="open-pip"]');
    if (pipButton) pipButton.click();
    setTimeout(() => askAI(mode, prompt), 80);
  }

  function builderHtml() {
    const db = parseDb();
    const list = topBusiness(db);
    const rows = list.length
      ? list.map(({c,why,score}) => {
          const name = [c.firstName,c.lastName].filter(Boolean).join(" ") || "Unnamed contact";
          const reason = why.slice(0,2).join(" • ") || "relationship worth reviewing";
          return `<a class="v14-opportunity" href="#/contact/${encodeURIComponent(c.id)}">
            <b>${escapeHtml(name)}</b>
            <span>${escapeHtml(reason)}</span>
            <em>${escapeHtml(c.type || "Contact")} · priority ${Math.max(0,score)}</em>
          </a>`;
        }).join("")
      : `<div class="v14-builder-empty">Add real contacts and follow-up dates, and Business Builder will start surfacing who is worth talking to.</div>`;

    return `<section class="v14-business-builder">
      <div class="v14-builder-head">
        <div>
          <span class="v14-builder-kicker">CREATE BUSINESS</span>
          <h2>Where can the next client come from?</h2>
          <p>Fast local scoring now. Pip can do the deeper CRM review.</p>
        </div>
        <div class="v14-builder-actions">
          <button class="v14-ai-button" data-v14-ai="business">AI prioritize</button>
          <button class="v14-ai-button secondary" data-v14-ai="day">Build my day</button>
        </div>
      </div>
      <div class="v14-opportunity-list">${rows}</div>
    </section>`;
  }

  function escapeHtml(v) {
    return String(v ?? "").replace(/[&<>"']/g, ch => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[ch]));
  }

  function enhanceToday() {
    const view = $("#view");
    if (!view || $(".v14-business-builder", view)) return;
    const header = $(".v13-today-header", view);
    if (!header) return;
    header.insertAdjacentHTML("afterend", builderHtml());
  }

  function injectPipPrompts() {
    const ask = $(".pip-ask");
    if (!ask || $(".v14-pip-quick-prompts")) return;
    ask.insertAdjacentHTML("beforebegin", `
      <div class="v14-pip-quick-prompts">
        <button data-v14-ai="business">Find business</button>
        <button data-v14-ai="day">Build my day</button>
        <button data-v14-ai="pipeline">Review pipeline</button>
        <button data-v14-ai="content">Create lead content</button>
      </div>`);
    const title = $(".pip-drawer-head strong");
    if (title && !$(".v14-ai-status", title.parentElement)) {
      title.insertAdjacentHTML("afterend", `<span class="v14-ai-status">AI CRM coach</span>`);
    }
  }

  function contextButton() {
    const view = $("#view");
    if (!view) return;
    $(".v14-context-ai", view)?.remove();

    const route = (location.hash || "#/today").replace("#/","").split("/")[0];
    const config = {
      people:["business","Find business"],
      pipeline:["pipeline","AI pipeline review"],
      content:["content","AI lead idea"],
      inbox:["day","AI prioritize inbox"],
      transactions:["pipeline","AI risk review"],
      reports:["business","AI business review"]
    }[route];
    if (!config) return;

    const target = $(".page-head .actions", view) || $(".fub-database-header", view);
    if (!target) return;
    const btn = document.createElement("button");
    btn.className = "ghost-btn compact v14-context-ai";
    btn.dataset.v14Ai = config[0];
    btn.textContent = config[1];
    target.appendChild(btn);
  }

  function relabelNav() {
    document.querySelectorAll('[data-route="pipeline"] span:last-of-type').forEach(el => {
      if (el.textContent.trim() === "Opportunities") el.textContent = "Pipeline";
    });
    document.querySelectorAll('[data-route="more"] span:last-of-type').forEach(el => {
      if (el.textContent.trim() === "Launchpad") el.textContent = "More";
    });
  }

  function runEnhancements() {
    injectPipPrompts();
    relabelNav();
    enhanceToday();
    contextButton();
  }

  document.addEventListener("click", (event) => {
    const ai = event.target.closest("[data-v14-ai]");
    if (ai) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openPipThen(ai.dataset.v14Ai || "freeform");
      return;
    }

    const ask = event.target.closest('[data-action="ask-pip"]');
    if (ask) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const input = $("#pipAskInput");
      const prompt = input?.value?.trim() || "What should I do next?";
      askAI("freeform", prompt);
    }
  }, true);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && event.target?.id === "pipAskInput") {
      event.preventDefault();
      event.stopImmediatePropagation();
      askAI("freeform", event.target.value.trim() || "What should I do next?");
    }
  }, true);

  window.addEventListener("hashchange", () => setTimeout(runEnhancements, 40));
  window.addEventListener("load", () => setTimeout(runEnhancements, 120));

  const view = $("#view");
  if (view) new MutationObserver(() => setTimeout(runEnhancements, 0))
    .observe(view, {childList:true, subtree:false});

  setTimeout(runEnhancements, 80);
})();