(() => {
  "use strict";

  const CRM_KEY = "holtonHomesOS_v13";
  const STUDIO_KEY = "holtonHomesStudio_v1";
  const VERSION = "1.0.0";
  const DEFAULT_OLLAMA = "http://127.0.0.1:11434";

  const nowIso = () => new Date().toISOString();
  const today = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const num = (v) => Number.isFinite(Number(v)) ? Number(v) : 0;
  const safeParse = (value, fallback = {}) => { try { return JSON.parse(value); } catch { return fallback; } };
  const stripHtml = (value) => String(value ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const daysBetween = (a, b = new Date()) => {
    if (!a) return 9999;
    const d = new Date(a);
    if (Number.isNaN(d.getTime())) return 9999;
    return Math.max(0, Math.floor((b.getTime() - d.getTime()) / 86400000));
  };
  const fullName = (c) => [c?.firstName, c?.lastName].filter(Boolean).join(" ").trim() || c?.name || "Unnamed contact";
  const propertyAddress = (p) => {
    if (!p) return "";
    const line = [p.street, p.unit].filter(Boolean).join(" ");
    const locality = [p.city, p.state, p.zip].filter(Boolean).join(" ");
    return [line, locality].filter(Boolean).join(", ");
  };

  const DEFAULT_STATE = {
    version: 1,
    profile: {
      licenseMode: "prelicense",
      licenseState: "OH",
      licenseNumber: "",
      advertisingName: "",
      brokerageName: "",
      brokerageReviewed: false,
      realtorMember: false,
      brandName: "Holton Homes",
      market: "Greater Cincinnati",
      timezone: "America/New_York"
    },
    ai: {
      provider: "ollama",
      endpoint: DEFAULT_OLLAMA,
      model: "",
      keepAlive: 0,
      temperature: 0.25,
      lastConnectedAt: ""
    },
    preferences: {
      saveAiDrafts: true,
      includeNamesInLocalAi: true,
      maxCommunicationItems: 8,
      maxTaskItems: 8,
      defaultCta: "Start a conversation with Holton Homes.",
      complianceMode: "strict"
    },
    cmas: [],
    assets: [],
    campaigns: [],
    generations: [],
    complianceChecks: [],
    sourceNotes: [],
    updatedAt: ""
  };

  function mergeDefaults(saved = {}) {
    return {
      ...DEFAULT_STATE,
      ...saved,
      profile: { ...DEFAULT_STATE.profile, ...(saved.profile || {}) },
      ai: { ...DEFAULT_STATE.ai, ...(saved.ai || {}) },
      preferences: { ...DEFAULT_STATE.preferences, ...(saved.preferences || {}) },
      cmas: Array.isArray(saved.cmas) ? saved.cmas : [],
      assets: Array.isArray(saved.assets) ? saved.assets : [],
      campaigns: Array.isArray(saved.campaigns) ? saved.campaigns : [],
      generations: Array.isArray(saved.generations) ? saved.generations : [],
      complianceChecks: Array.isArray(saved.complianceChecks) ? saved.complianceChecks : [],
      sourceNotes: Array.isArray(saved.sourceNotes) ? saved.sourceNotes : []
    };
  }

  function readCRM() {
    return safeParse(localStorage.getItem(CRM_KEY) || "{}", {});
  }
  function readStudio() {
    return mergeDefaults(safeParse(localStorage.getItem(STUDIO_KEY) || "{}", {}));
  }
  function writeStudio(next) {
    const value = mergeDefaults(next);
    value.updatedAt = nowIso();
    localStorage.setItem(STUDIO_KEY, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("holton-studio-state", { detail: value }));
    return value;
  }
  function updateStudio(mutator) {
    const state = readStudio();
    const result = mutator(state) || state;
    return writeStudio(result);
  }

  const OFFICIAL_RULES = [
    {
      id: "oh-license-required",
      jurisdiction: "Ohio",
      type: "law",
      title: "Ohio license required for brokerage activity",
      source: "Ohio Revised Code 4735.01 and 4735.02",
      url: "https://codes.ohio.gov/ohio-revised-code/chapter-4735",
      summary: "A person generally may not act or advertise as a real estate broker or salesperson without the required Ohio license. Brokerage activity includes negotiating, listing, advertising brokerage services, and procuring prospects for another for compensation.",
      verified: "2026-08-19"
    },
    {
      id: "oh-advertising",
      jurisdiction: "Ohio",
      type: "law",
      title: "Ohio real-estate advertising identity rules",
      source: "ORC 4735.16; OAC 1301:5-1-02",
      url: "https://codes.ohio.gov/ohio-administrative-code/rule-1301%3A5-1-02",
      summary: "Licensed advertising must identify the licensee and affiliated brokerage. On licensee-controlled internet pages the brokerage name must be disclosed, and Ohio requires the brokerage name to be displayed at least in equal prominence with the salesperson name. Advertising must not be materially misleading.",
      verified: "2026-08-19"
    },
    {
      id: "oh-team-advertising",
      jurisdiction: "Ohio",
      type: "law",
      title: "Ohio team advertising",
      source: "OAC 1301:5-1-21",
      url: "https://codes.ohio.gov/ohio-administrative-code/rule-1301%3A5-1-21",
      summary: "A real-estate team name must include team or group, must not use realty or associates, and advertising must include at least one licensee plus the brokerage with required prominence. Unlicensed team members named in advertising must be identified as unlicensed.",
      verified: "2026-08-19"
    },
    {
      id: "oh-written-agency",
      jurisdiction: "Ohio",
      type: "law",
      title: "Written agency agreement gate",
      source: "ORC 4735.55",
      url: "https://codes.ohio.gov/ohio-revised-code/section-4735.55",
      summary: "For covered residential activity, a licensee must enter into a written agency agreement before advertising or showing residential property on behalf of a seller, making an offer on behalf of a purchaser, or making a qualifying residential lease offer for a tenant.",
      verified: "2026-08-19"
    },
    {
      id: "oh-records-misrepresentation",
      jurisdiction: "Ohio",
      type: "law",
      title: "Accuracy, authority, and records",
      source: "ORC 4735.18",
      url: "https://codes.ohio.gov/ohio-revised-code/section-4735.18",
      summary: "Ohio disciplinary grounds include misrepresentation, false promises, materially misleading advertising, advertising property without authority, interference with exclusive representation, and failure to maintain complete transaction records for the required period.",
      verified: "2026-08-19"
    },
    {
      id: "fair-housing",
      jurisdiction: "Federal/Ohio",
      type: "law",
      title: "Fair housing",
      source: "Federal Fair Housing Act; Ohio fair housing law",
      url: "https://www.hud.gov/program_offices/fair_housing_equal_opp/fair_housing_act_overview",
      summary: "Housing services and housing advertising must not discriminate on protected characteristics. Federal classes include race, color, national origin, religion, sex, familial status, and disability. Ohio adds protections including ancestry and military status. Avoid discriminatory targeting or coded preference language.",
      verified: "2026-08-19"
    },
    {
      id: "schools-crime-objective",
      jurisdiction: "Federal/professional",
      type: "guidance",
      title: "Schools and crime information",
      source: "HUD 2026 Dear Colleague clarification; NAR 2026 guidance",
      url: "https://www.nar.realtor/fair-housing/faqs-on-steering-crime-and-schools",
      summary: "Objective school or crime information may be shared consistently and without discriminatory intent, but steering remains prohibited. Prefer reliable independent sources and factual presentation rather than subjective labels such as safe neighborhood or good schools.",
      verified: "2026-08-19"
    },
    {
      id: "nar-ethics",
      jurisdiction: "Professional",
      type: "ethics",
      title: "2026 NAR Code baseline",
      source: "2026 NAR Code of Ethics, especially Articles 10, 11, 12, 13, and 16",
      url: "https://www.nar.realtor/about-nar/governing-documents/code-of-ethics/2026-code-of-ethics-standards-of-practice",
      summary: "When applicable to a REALTOR member: provide equal professional service, stay within competence, present a true picture in advertising, avoid unauthorized practice of law, and respect exclusive representation. Never claim REALTOR status unless membership is actually held.",
      verified: "2026-08-19"
    }
  ];

  const SOURCE_CATALOG = [
    {
      id: "brown-auditor",
      label: "Brown County Auditor",
      kind: "public-record",
      county: "Brown",
      state: "OH",
      quality: 0.86,
      url: "https://realestate.browncountyauditor.org/Search/Sales",
      downloads: "https://realestate.browncountyauditor.org/property-data-downloads",
      notes: "Sales search supports sale date, amount, year built, living area, bedrooms, acres and valid-sale filtering. County data should be independently verified for transaction decisions."
    },
    {
      id: "clermont-auditor",
      label: "Clermont County Auditor",
      kind: "public-record",
      county: "Clermont",
      state: "OH",
      quality: 0.86,
      url: "https://www.clermontauditor.org/real-estate/recent-sales/",
      downloads: "https://www.clermontauditor.org/downloads/",
      notes: "Current and prior-year sales files are available for download."
    },
    {
      id: "hamilton-auditor",
      label: "Hamilton County Auditor",
      kind: "public-record",
      county: "Hamilton",
      state: "OH",
      quality: 0.86,
      url: "https://www.hamiltoncountyauditor.org/hamilton/dailysales/dailysales.html",
      downloads: "https://www.hamiltoncountyauditor.org/downloads.asp",
      notes: "Property sales files include parcel, sale date and appraisal-area information; public records are useful but not a substitute for MLS verification when available."
    },
    {
      id: "cincymls",
      label: "CincyMLS / authorized MLS feed",
      kind: "mls",
      county: "Greater Cincinnati",
      state: "OH",
      quality: 1,
      url: "https://www.cincymls.com/data-delivery-internet-data-exchange.html",
      notes: "Future primary comp/listing source after the appropriate MLS data-use agreement, permissions and feed credentials are in place."
    },
    {
      id: "manual-zillow",
      label: "Zillow manual research",
      kind: "portal-reference",
      county: "",
      state: "",
      quality: 0.62,
      url: "https://www.zillow.com/",
      notes: "Use only as a manual cross-check unless licensed/approved API rights are obtained. Do not build automated scraping into Holton Homes."
    },
    {
      id: "manual-redfin",
      label: "Redfin manual research",
      kind: "portal-reference",
      county: "",
      state: "",
      quality: 0.62,
      url: "https://www.redfin.com/",
      notes: "Use only as a manual cross-check. Redfin's terms prohibit automated crawling/scraping without permission."
    }
  ];

  const RISK_PHRASES = [
    { re: /\bperfect for (?:a |young |growing )?famil(?:y|ies)\b/ig, reason: "Familial-status preference language", severity: "high" },
    { re: /\b(?:no children|adults only|adult community)\b/ig, reason: "Potential familial-status restriction", severity: "high" },
    { re: /\b(?:christian|jewish|muslim|church-going|walking distance to church)\b/ig, reason: "Religion-related preference or targeting", severity: "high" },
    { re: /\b(?:young professionals?|mature couples?|singles only)\b/ig, reason: "Potential protected-class or demographic preference", severity: "medium" },
    { re: /\b(?:safe neighborhood|very safe|crime[- ]free)\b/ig, reason: "Subjective safety claim; use objective sourced information instead", severity: "medium" },
    { re: /\b(?:good schools|great schools|best schools|top schools)\b/ig, reason: "Subjective school-quality claim; prefer sourced objective data", severity: "medium" },
    { re: /\b(?:guaranteed appreciation|guaranteed profit|can't lose|will definitely increase in value)\b/ig, reason: "Unwarranted investment/value guarantee", severity: "high" },
    { re: /\b(?:free realtor|free agent|my services are free|no-cost agent)\b/ig, reason: "Potentially misleading compensation claim", severity: "high" },
    { re: /\bsold by me\b/ig, reason: "Verify participation before claiming a sale", severity: "medium" }
  ];

  function scanText(text, options = {}) {
    const value = String(text || "");
    const hits = [];
    for (const item of RISK_PHRASES) {
      item.re.lastIndex = 0;
      let match;
      while ((match = item.re.exec(value))) {
        hits.push({ phrase: match[0], reason: item.reason, severity: item.severity, index: match.index });
        if (hits.length > 50) break;
      }
    }
    const profile = options.profile || readStudio().profile;
    if (/\bREALTOR(?:®|\b)/i.test(value) && !profile.realtorMember) {
      hits.push({ phrase: "REALTOR®", reason: "Do not claim REALTOR® membership unless membership is actually held.", severity: "high" });
    }
    if (options.publicFacing && profile.licenseMode !== "prelicense" && !profile.brokerageName) {
      hits.push({ phrase: "Brokerage disclosure", reason: "Ohio public-facing real-estate advertising requires brokerage identification; brokerage name is missing in Studio Settings.", severity: "high" });
    }
    if (options.publicFacing && profile.licenseMode === "prelicense") {
      hits.push({ phrase: "Pre-license review", reason: "General local/educational content can still be published, but review the draft so it does not hold you out as a licensed real-estate professional or offer licensed brokerage services before licensure.", severity: "medium" });
    }
    return hits;
  }

  function redactSensitive(value) {
    let text = String(value ?? "");
    text = text.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/ig, "[REDACTED EMAIL]");
    text = text.replace(/(?:\+?1[ .-]?)?\(?\d{3}\)?[ .-]\d{3}[ .-]\d{4}\b/g, "[REDACTED PHONE]");
    text = text.replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[REDACTED SSN]");
    text = text.replace(/\b(?:ssn|social security(?: number)?)\s*(?:[:#=-]|is)?\s*\d{9}\b/ig, (m) => `${m.split(/\s*(?:[:#=-]|is)\s*/i)[0]} [REDACTED]`);
    text = text.replace(/\b(?:routing(?: number)?|account(?: number)?|bank account(?: number)?|wire(?: instructions?|details?|number)?|password|passcode|pin)\s*(?:[:#=-]|is)?\s*[A-Za-z0-9-]{4,}\b/ig, (m) => `${m.match(/^[A-Za-z ]+/)?.[0]?.trim() || "Sensitive value"} [REDACTED]`);
    text = text.replace(/\b(?:driver'?s? license(?: number)?|passport(?: number)?)\s*(?:[:#=-]|is)?\s*[A-Za-z0-9-]{5,}\b/ig, (m) => `${m.match(/^[A-Za-z' ]+/)?.[0]?.trim() || "ID"} [REDACTED]`);
    return text.slice(0, 12000);
  }

  function sanitizeForAi(value, depth = 0) {
    if (depth > 5) return "[TRUNCATED]";
    if (value === null || value === undefined) return value;
    if (typeof value === "string") return redactSensitive(value);
    if (typeof value === "number" || typeof value === "boolean") return value;
    if (Array.isArray(value)) return value.slice(0, 30).map((x) => sanitizeForAi(x, depth + 1));
    if (typeof value === "object") {
      const out = {};
      for (const [key, val] of Object.entries(value).slice(0, 60)) {
        if (/^(?:email|emailAddress|phone|phoneNumber|mobile|mobilePhone|ssn|socialSecurity|taxId|routingNumber|bankAccount|bankAccountNumber|accountNumber|mortgageBalance|loanBalance|wireInstructions|wireDetails|password|passcode|pin|passportNumber|driversLicense|driversLicenseNumber)$/i.test(key)) {
          out[key] = "[REDACTED]";
        } else {
          out[key] = sanitizeForAi(val, depth + 1);
        }
      }
      return out;
    }
    return redactSensitive(value);
  }

  function contactById(crm, id) {
    return (crm.contacts || []).find((c) => String(c.id) === String(id)) || null;
  }
  function propertiesForContact(crm, id) {
    return (crm.properties || []).filter((p) => String(p.contactId) === String(id));
  }
  function latestCommunication(crm, id) {
    return (crm.communications || []).filter((m) => String(m.contactId) === String(id)).sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))[0] || null;
  }
  function openTasksForContact(crm, id) {
    return (crm.tasks || []).filter((t) => String(t.contactId) === String(id) && t.status !== "Done");
  }

  function buildContactContext(contactId, options = {}) {
    const crm = options.crm || readCRM();
    const studio = options.studio || readStudio();
    const c = contactById(crm, contactId);
    if (!c) return null;
    const pref = studio.preferences;
    const communications = (crm.communications || [])
      .filter((m) => String(m.contactId) === String(c.id))
      .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))
      .slice(0, pref.maxCommunicationItems || 8)
      .map((m) => ({ date: m.date || "", direction: m.direction || "", channel: m.channel || "", body: redactSensitive(m.body || m.outcome || "") }));
    const tasks = openTasksForContact(crm, c.id)
      .sort((a, b) => String(a.due || "9999").localeCompare(String(b.due || "9999")))
      .slice(0, pref.maxTaskItems || 8)
      .map((t) => ({ title: redactSensitive(t.title || ""), type: t.type || "", due: t.due || "", priority: t.priority || "" }));
    const properties = propertiesForContact(crm, c.id).map((p) => ({
      id: p.id,
      role: p.role || "",
      status: p.status || "",
      primary: Boolean(p.primary),
      address: propertyAddress(p),
      propertyType: p.propertyType || "",
      beds: p.beds || "",
      baths: p.baths || "",
      sqft: p.sqft || "",
      acres: p.acres || "",
      yearBuilt: p.yearBuilt || "",
      condition: redactSensitive(p.condition || ""),
      motivation: redactSensitive(p.motivation || ""),
      estimatedValue: p.estimatedValue || 0,
      listPrice: p.listPrice || 0,
      expectedSalePrice: p.expectedSalePrice || 0,
      targetDate: p.targetDate || "",
      appointmentDate: p.appointmentDate || "",
      notes: redactSensitive(p.notes || "")
    }));
    const opportunities = (crm.opportunities || []).filter((x) => String(x.contactId) === String(c.id)).slice(0, 10);
    const transactions = (crm.transactions || []).filter((x) => String(x.contactId) === String(c.id)).slice(0, 10);
    return {
      id: c.id,
      name: studio.preferences.includeNamesInLocalAi ? fullName(c) : "Selected contact",
      firstName: studio.preferences.includeNamesInLocalAi ? (c.firstName || "") : "Client",
      type: c.type || "Unknown",
      stage: c.stage || "Unknown",
      heat: c.heat || "Unknown",
      source: c.source || "Unknown",
      timeframe: c.timeframe || "Unknown",
      followUp: c.followUp || "",
      lastCommunication: c.lastCommunication || latestCommunication(crm, c.id)?.date || "",
      tags: Array.isArray(c.tags) ? c.tags.slice(0, 20) : [],
      notes: redactSensitive(c.notes || ""),
      sellerDetails: c.sellerDetails ? sanitizeForAi(c.sellerDetails) : undefined,
      buyerDetails: c.buyerDetails ? sanitizeForAi(c.buyerDetails) : undefined,
      communications,
      tasks,
      properties,
      opportunities: sanitizeForAi(opportunities),
      transactions: sanitizeForAi(transactions)
    };
  }

  function latestTouchDate(crm, c) {
    const latest = latestCommunication(crm, c.id);
    return latest?.date || c.lastCommunication || c.updatedAt || c.createdAt || "";
  }

  function relationshipScore(crm, c) {
    if (!c || ["Closed", "Lost"].includes(c.stage)) return { score: 0, reasons: ["closed/lost"] };
    let score = 10;
    const reasons = [];
    if (c.heat === "Hot") { score += 24; reasons.push("Hot"); }
    else if (c.heat === "Warm") { score += 12; reasons.push("Warm"); }
    if (c.type === "Seller") { score += 16; reasons.push("Seller opportunity"); }
    if (c.type === "Buyer") { score += 10; reasons.push("Buyer opportunity"); }
    if (/0.?3/i.test(String(c.timeframe || ""))) { score += 18; reasons.push("0–3 month timing"); }
    else if (/3.?6/i.test(String(c.timeframe || ""))) { score += 10; reasons.push("3–6 month timing"); }
    if (c.followUp && c.followUp <= today()) { score += 20; reasons.push(c.followUp < today() ? "Follow-up overdue" : "Follow-up due"); }
    if (!c.followUp && ["Seller", "Buyer"].includes(c.type)) { score += 7; reasons.push("No next follow-up"); }
    const age = daysBetween(latestTouchDate(crm, c));
    if (age >= 30 && age < 9999) { score += 15; reasons.push(`${age} days since contact`); }
    else if (age >= 14 && age < 9999) { score += 9; reasons.push(`${age} days since contact`); }
    else if (age <= 2) { score += 5; reasons.push("Recent conversation"); }
    if (["Referral", "Past Client", "Sphere"].includes(c.source) || c.type === "Past Client") { score += 6; reasons.push("Relationship source"); }
    const comm = (crm.communications || []).filter((m) => String(m.contactId) === String(c.id));
    if (comm.some((m) => m.unread && m.direction === "inbound")) { score += 30; reasons.unshift("Unread inbound message"); }
    return { score: clamp(Math.round(score), 0, 100), reasons: reasons.slice(0, 5) };
  }

  function nextBestAction(crm, c) {
    const unread = (crm.communications || []).filter((m) => String(m.contactId) === String(c.id) && m.unread && m.direction === "inbound");
    if (unread.length) return { action: "Reply personally", reason: "There is an unread inbound message.", type: "reply" };
    if (c.followUp && c.followUp <= today()) return { action: "Make the promised follow-up", reason: c.followUp < today() ? "The follow-up is overdue." : "The follow-up is due today.", type: "followup" };
    const age = daysBetween(latestTouchDate(crm, c));
    if (c.heat === "Hot" && age >= 3) return { action: "Call today", reason: `Hot lead with ${age} days since the last recorded communication.`, type: "call" };
    if (c.type === "Seller" && ["New", "Attempted Contact", "Contacted", "Valuation Requested"].includes(c.stage)) return { action: "Advance the seller conversation", reason: "Clarify motivation, timeline, property facts and the next appointment.", type: "seller" };
    if (c.type === "Buyer" && ["New", "Attempted Contact", "Contacted"].includes(c.stage)) return { action: "Clarify the buyer plan", reason: "Confirm payment comfort, financing status, areas, timing and non-negotiables.", type: "buyer" };
    if (!c.followUp && ["Seller", "Buyer"].includes(c.type)) return { action: "Set the next date", reason: "Every active opportunity needs a documented next step.", type: "task" };
    if (age >= 30) return { action: "Relationship check-in", reason: `${age} days since the last recorded contact.`, type: "nurture" };
    return { action: "Keep relationship warm", reason: "No urgent CRM trigger is currently firing.", type: "nurture" };
  }

  function dailyQueue(limit = 12) {
    const crm = readCRM();
    return (crm.contacts || [])
      .filter((c) => !["Closed", "Lost"].includes(c.stage))
      .map((c) => ({ contact: c, ...relationshipScore(crm, c), next: nextBestAction(crm, c) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  function pipelineHealth() {
    const crm = readCRM();
    const open = (crm.contacts || []).filter((c) => ["Seller", "Buyer"].includes(c.type) && !["Closed", "Lost"].includes(c.stage));
    const missingFollowUp = open.filter((c) => !c.followUp);
    const overdue = open.filter((c) => c.followUp && c.followUp < today());
    const stale = open.filter((c) => daysBetween(latestTouchDate(crm, c)) >= 14);
    const hot = open.filter((c) => c.heat === "Hot");
    return { total: open.length, missingFollowUp: missingFollowUp.length, overdue: overdue.length, stale: stale.length, hot: hot.length };
  }

  function sourceQuality(source) {
    const s = String(source || "").toLowerCase();
    if (s.includes("mls")) return 1;
    if (s.includes("auditor") || s.includes("county") || s.includes("public record")) return 0.86;
    if (s.includes("manual verified")) return 0.82;
    if (s.includes("zillow") || s.includes("redfin") || s.includes("portal")) return 0.62;
    return 0.72;
  }

  function similarity(a, b, tolerance) {
    const x = num(a), y = num(b);
    if (!x || !y) return null;
    const diff = Math.abs(x - y);
    return clamp(1 - diff / Math.max(tolerance, x), 0, 1);
  }

  function compMatchScore(subject, comp) {
    const dimensions = [];
    const add = (weight, value, label) => { if (value !== null && value !== undefined && !Number.isNaN(value)) dimensions.push({ weight, value: clamp(value, 0, 1), label }); };
    add(24, similarity(subject.sqft, comp.sqft, Math.max(num(subject.sqft) * 0.35, 500)), "sqft");
    add(13, similarity(subject.acres, comp.acres, Math.max(num(subject.acres) * 0.6, 0.5)), "acres");
    add(6, similarity(subject.beds, comp.beds, 2), "beds");
    add(6, similarity(subject.baths, comp.baths, 1.5), "baths");
    add(8, similarity(subject.yearBuilt, comp.yearBuilt, 30), "year");
    if (subject.propertyType && comp.propertyType) add(10, String(subject.propertyType).toLowerCase() === String(comp.propertyType).toLowerCase() ? 1 : 0.35, "type");
    if (num(comp.distanceMiles) > 0) add(12, clamp(1 - num(comp.distanceMiles) / 5, 0, 1), "distance");
    if (comp.saleDate) {
      const ageDays = daysBetween(comp.saleDate);
      add(13, clamp(1 - ageDays / 730, 0.05, 1), "recency");
    }
    add(8, sourceQuality(comp.source), "source");
    if (!dimensions.length) return 50;
    const weight = dimensions.reduce((s, d) => s + d.weight, 0);
    return Math.round(dimensions.reduce((s, d) => s + d.value * d.weight, 0) / weight * 100);
  }

  function quantile(values, q) {
    const xs = values.filter(Number.isFinite).sort((a, b) => a - b);
    if (!xs.length) return 0;
    if (xs.length === 1) return xs[0];
    const pos = (xs.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    return xs[base + 1] !== undefined ? xs[base] + rest * (xs[base + 1] - xs[base]) : xs[base];
  }

  function calculateCMA(subject, comps = []) {
    const considered = comps.filter((c) => c.include !== false && num(c.salePrice) > 0);
    const sold = considered.filter((c) => !c.status || /sold|closed/i.test(c.status));
    const marketContext = considered.filter((c) => c.status && !/sold|closed/i.test(c.status));
    const core = sold;
    const rows = core.map((c) => {
      const score = compMatchScore(subject, c);
      const adjustedPrice = num(c.salePrice) + num(c.manualAdjustment);
      const ageFactor = c.saleDate ? clamp(1 - daysBetween(c.saleDate) / 900, 0.25, 1) : 0.65;
      const weight = Math.max(0.05, score / 100 * sourceQuality(c.source) * ageFactor);
      const ppsf = num(c.sqft) ? adjustedPrice / num(c.sqft) : 0;
      return { ...c, matchScore: score, adjustedPrice, weight, ppsf };
    });
    const weightTotal = rows.reduce((s, r) => s + r.weight, 0);
    const weightedMean = weightTotal ? rows.reduce((s, r) => s + r.adjustedPrice * r.weight, 0) / weightTotal : 0;
    const prices = rows.map((r) => r.adjustedPrice).filter((v) => v > 0);
    const median = quantile(prices, 0.5);
    let low = quantile(prices, 0.25);
    let high = quantile(prices, 0.75);
    const indicated = weightedMean && median ? weightedMean * 0.6 + median * 0.4 : (weightedMean || median || 0);
    if (prices.length < 3 && prices.length) {
      low = Math.min(...prices);
      high = Math.max(...prices);
    }
    if (indicated && (!low || !high || high - low < indicated * 0.03)) {
      low = indicated * 0.96;
      high = indicated * 1.04;
    }
    const avgScore = rows.length ? rows.reduce((s, r) => s + r.matchScore, 0) / rows.length : 0;
    const avgSource = rows.length ? rows.reduce((s, r) => s + sourceQuality(r.source), 0) / rows.length : 0;
    let confidenceScore = 0;
    confidenceScore += Math.min(rows.length / 5, 1) * 35;
    confidenceScore += avgScore * 0.4;
    confidenceScore += avgSource * 25;
    if (rows.some((r) => !r.saleDate)) confidenceScore -= 5;
    if (rows.length < 3) confidenceScore -= 12;
    confidenceScore = clamp(Math.round(confidenceScore), 0, 100);
    const confidence = confidenceScore >= 80 ? "High" : confidenceScore >= 62 ? "Moderate" : "Low";
    const subjectPpsf = num(subject.sqft) && indicated ? indicated / num(subject.sqft) : 0;
    const contextRows = marketContext.map((c) => ({ ...c, matchScore: compMatchScore(subject, c) })).sort((a, b) => b.matchScore - a.matchScore);
    return {
      subject,
      rows: rows.sort((a, b) => b.matchScore - a.matchScore),
      contextRows,
      sampleSize: rows.length,
      indicated: Math.round(indicated),
      rangeLow: Math.round(low),
      rangeHigh: Math.round(high),
      median: Math.round(median),
      weightedMean: Math.round(weightedMean),
      subjectPpsf,
      confidence,
      confidenceScore,
      caveats: [
        "This is a comparative market analysis/research estimate, not an appraisal.",
        "Public-record data may lag, omit condition/renovation details, or contain errors; verify material facts.",
        rows.some((r) => sourceQuality(r.source) < 0.8) ? "At least one comp uses a lower-confidence portal/manual source." : "",
        rows.length < 3 ? "Fewer than three usable closed sales materially reduces confidence." : "",
        !rows.length && marketContext.length ? "Active/pending listings are shown as market context but are not used to calculate the indicated center." : "",
        rows.length && marketContext.length ? "Active/pending listings are retained as market context and excluded from the closed-sale pricing center." : ""
      ].filter(Boolean)
    };
  }

  function saveCMA(cma) {
    const result = { id: cma.id || uid(), createdAt: cma.createdAt || nowIso(), updatedAt: nowIso(), ...cma };
    updateStudio((state) => {
      const i = state.cmas.findIndex((x) => x.id === result.id);
      if (i >= 0) state.cmas[i] = result; else state.cmas.unshift(result);
      state.cmas = state.cmas.slice(0, 100);
      return state;
    });
    return result;
  }

  function saveAsset(asset) {
    const result = { id: asset.id || uid(), createdAt: asset.createdAt || nowIso(), updatedAt: nowIso(), ...asset };
    updateStudio((state) => {
      const i = state.assets.findIndex((x) => x.id === result.id);
      if (i >= 0) state.assets[i] = result; else state.assets.unshift(result);
      state.assets = state.assets.slice(0, 300);
      return state;
    });
    return result;
  }

  function saveGeneration(generation) {
    const result = { id: uid(), createdAt: nowIso(), ...generation };
    updateStudio((state) => {
      state.generations.unshift(result);
      state.generations = state.generations.slice(0, 80);
      return state;
    });
    return result;
  }

  const TOOL_CATALOG = [
    { id: "lead-brief", category: "Relationships", label: "Lead Brief", icon: "◎", description: "Summarize the relationship and surface the best next move.", context: true, prompt: "Create a concise lead brief: what we know, what we do not know, strongest buying/selling signals, risks, and the single best next action. Do not invent facts." },
    { id: "call-prep", category: "Relationships", label: "Call Prep", icon: "☎", description: "Walk into a call knowing what to ask and why.", context: true, prompt: "Prepare a natural call plan. Include objective, 5 high-value questions, likely concerns based only on the CRM record, a respectful opener, and a clear next-step close." },
    { id: "follow-up-writer", category: "Relationships", label: "Follow-Up Writer", icon: "✎", description: "Draft a personal text or email grounded in the relationship history.", context: true, fields: [{ key: "channel", label: "Channel", type: "select", options: ["Text", "Email"] }, { key: "goal", label: "Goal", type: "text", placeholder: "What should this message accomplish?" }], prompt: "Draft one natural follow-up. It should sound human, use no pressure or fake urgency, and reference only facts actually present in the CRM/context. Include a clear but low-friction next step." },
    { id: "relationship-plan", category: "Relationships", label: "90-Day Relationship Plan", icon: "↻", description: "Build a human nurture plan with useful reasons to stay in touch.", context: true, prompt: "Build a 90-day relationship plan with specific touchpoints. Favor useful, personal contact over spam. Explain the purpose of each touch and what signal would change the plan." },
    { id: "referral-ask", category: "Relationships", label: "Referral Ask", icon: "↗", description: "Create a non-cringey referral conversation for a relationship that earned it.", context: true, prompt: "Assess whether a referral ask is appropriate from the available relationship history. If not, say so and recommend a value-first touch. If yes, draft a natural ask that does not sound transactional." },
    { id: "lead-revive", category: "Relationships", label: "Cold Lead Revival", icon: "◌", description: "Reopen a stale conversation without sounding automated.", context: true, prompt: "Create a cold-lead revival approach based on the last known context. Give one text, one call opener, and one useful value angle. Do not manufacture a market event or property fact." },

    { id: "seller-lead-plan", category: "Sellers", label: "Seller Lead Plan", icon: "⌂", description: "Turn a seller inquiry into a useful discovery path.", context: true, licensedActivity: true, prompt: "Create a seller-lead conversion plan focused on motivation, timing, decision-makers, property condition, next-home dependency, and the best next appointment. Do not pressure the seller." },
    { id: "listing-appointment", category: "Sellers", label: "Listing Appointment Prep", icon: "▣", description: "Prepare the questions, evidence, agenda and close for a listing appointment.", context: true, licensedActivity: true, prompt: "Prepare a listing-appointment brief: seller goals, unknowns to resolve, property/market evidence needed, meeting agenda, objection-prep, and a direct but respectful close. Do not state a value unless supplied by a CMA or verified data." },
    { id: "listing-description", category: "Sellers", label: "Listing Description", icon: "¶", description: "Write grounded listing copy from verified property facts.", context: true, publicFacing: true, licensedActivity: true, fields: [{ key: "verifiedFacts", label: "Verified property facts", type: "textarea", placeholder: "Updates, features, measurements, amenities, source notes..." }, { key: "tone", label: "Tone", type: "select", options: ["Warm and polished", "Modern and concise", "Luxury but factual", "Farm / acreage focused"] }], prompt: "Write a polished listing description using only verified facts supplied in the context and form. Never invent upgrades, measurements, views, schools, safety, commute times, or amenities. Avoid fair-housing preference language. End with a short FACTS TO VERIFY list if anything material is missing." },
    { id: "seller-update", category: "Sellers", label: "Seller Update", icon: "↺", description: "Translate activity and feedback into a calm weekly seller update.", context: true, licensedActivity: true, fields: [{ key: "activity", label: "Verified listing activity", type: "textarea", placeholder: "Showings, feedback, inquiries, competing listings, price changes..." }], prompt: "Write a seller update that separates verified activity from interpretation and recommendation. Do not invent showing counts, feedback, competing inventory, market statistics, or buyer sentiment." },
    { id: "price-adjustment", category: "Sellers", label: "Price Adjustment Prep", icon: "⇣", description: "Prepare a pricing conversation without bullying the seller.", context: true, licensedActivity: true, fields: [{ key: "evidence", label: "Pricing evidence", type: "textarea", placeholder: "Days on market, showings, comp changes, feedback..." }], prompt: "Prepare a price-adjustment conversation using only supplied evidence. Explain what the market response may indicate, alternative actions, tradeoffs, and questions to ask. Do not claim a reduction is mandatory or guarantee an outcome." },
    { id: "open-house-plan", category: "Sellers", label: "Open House Plan", icon: "⌂", description: "Create a lead-producing open house plan around a listing.", context: true, publicFacing: true, licensedActivity: true, fields: [{ key: "eventDetails", label: "Event details", type: "textarea", placeholder: "Date/time, verified features, parking/access notes, seller-approved details..." }], prompt: "Create an open-house plan with promotion timeline, on-site conversation goals, sign-in/lead capture, follow-up sequence, and compliant promotional copy. Do not advertise another broker's listing without confirmed permission." },
    { id: "listing-launch", category: "Sellers", label: "Listing Launch Pack", icon: "✦", description: "Turn one verified property brief into a complete launch package.", context: true, publicFacing: true, licensedActivity: true, fields: [{ key: "verifiedFacts", label: "Verified property / launch facts", type: "textarea" }], prompt: "Create a listing launch pack: MLS-description draft, Facebook/Instagram copy, email announcement, 30-second video script, open-house teaser, and seller-facing launch checklist. Use only verified facts and clearly mark required brokerage/advertising disclosures." },

    { id: "buyer-consult", category: "Buyers", label: "Buyer Consultation Prep", icon: "◇", description: "Structure a buyer consultation around goals, payment, financing and process.", context: true, licensedActivity: true, prompt: "Prepare a buyer consultation agenda and discovery questions covering motivation, comfortable payment, financing, areas, timing, property needs, representation, and decision process. Do not give legal or lending advice." },
    { id: "property-compare", category: "Buyers", label: "Property Comparison", icon: "⇄", description: "Compare homes against the buyer's actual priorities.", context: true, licensedActivity: true, fields: [{ key: "properties", label: "Verified property facts to compare", type: "textarea", placeholder: "Paste listing facts or notes for each property." }], prompt: "Compare the supplied properties only against the buyer priorities in context. Separate objective facts, buyer-fit observations, unknowns to verify, and questions for showings. Do not rank neighborhoods by protected-class demographics." },
    { id: "showing-followup", category: "Buyers", label: "Showing Follow-Up", icon: "✓", description: "Turn showing feedback into a clearer search strategy.", context: true, licensedActivity: true, fields: [{ key: "feedback", label: "Showing feedback", type: "textarea" }], prompt: "Summarize what the showing feedback teaches us about the buyer's priorities. Draft a follow-up message and update the search criteria. Do not invent listing facts." },
    { id: "offer-conversation", category: "Buyers", label: "Offer Conversation Prep", icon: "◆", description: "Prepare the client conversation; keep legal/contract decisions with the agent/broker.", context: true, licensedActivity: true, fields: [{ key: "knownTerms", label: "Known property / offer facts", type: "textarea" }], prompt: "Create an offer-conversation checklist, not legal language. Identify factual inputs needed, strategic tradeoffs to discuss, representation/agency checks, financing/inspection/appraisal questions, and items requiring broker or legal review. Never invent or recommend contractual language as if it were legal advice." },
    { id: "inspection-prep", category: "Buyers", label: "Inspection Conversation Prep", icon: "⌕", description: "Organize inspection issues without practicing law or construction engineering.", context: true, licensedActivity: true, fields: [{ key: "inspectionNotes", label: "Inspection findings / notes", type: "textarea" }], prompt: "Organize supplied inspection findings into safety/major-system/maintenance/cosmetic/unknown categories, questions for qualified professionals, and a client conversation checklist. Do not diagnose defects or draft legal repair demands." },

    { id: "video-producer", category: "Content", label: "Video Producer", icon: "▶", description: "Produce a real-estate/local video from idea through shot list, CTA and repurposing.", publicFacing: true, fields: [
      { key: "topic", label: "Topic", type: "text", required: true, placeholder: "What is the video about?" },
      { key: "audience", label: "Audience", type: "text", placeholder: "Local homeowners, first-time buyers, Williamsburg residents..." },
      { key: "platform", label: "Platform", type: "select", options: ["YouTube long-form", "YouTube Short", "Facebook", "Instagram / TikTok"] },
      { key: "duration", label: "Target length", type: "select", options: ["30–45 sec", "60–90 sec", "3–5 min", "8–12 min", "15+ min"] },
      { key: "objective", label: "Business objective", type: "select", options: ["Build local trust", "Generate seller conversations", "Generate buyer conversations", "Explain a real-estate topic", "Grow local audience"] },
      { key: "facts", label: "Verified facts / source notes", type: "textarea", placeholder: "Paste facts, quotes in your own words, dates and source notes. AI must stay inside these facts." },
      { key: "cta", label: "CTA", type: "text", placeholder: "What should the viewer do next?" }
    ], prompt: "Act as a real-estate video producer. Build: angle, hook options, title options, thumbnail concept, full beat sheet, natural spoken script, shot list, B-roll list, on-screen text, retention pattern interrupts, compliant CTA, filming checklist, and repurposing plan. Distinguish sourced facts from opinion. Never invent local news, property data, market stats, or legal claims." },
    { id: "clip-finder", category: "Content", label: "Clip Finder", icon: "✂", description: "Turn a timestamped transcript into short-form clip candidates.", fields: [{ key: "transcript", label: "Timestamped transcript", type: "textarea", required: true, placeholder: "00:00 ..." }, { key: "clipCount", label: "Number of clips", type: "select", options: ["3", "5", "8", "10"] }], prompt: "Find the strongest standalone short-form moments in the supplied timestamped transcript. Use only timestamps that actually exist. For each clip give start/end timestamps, hook, why it works, caption, and edit notes. If timestamps are missing, say timestamp extraction requires transcription rather than inventing them." },
    { id: "blog-producer", category: "Content", label: "Blog Producer", icon: "▤", description: "Create a sourced local/real-estate article plus derivatives.", publicFacing: true, fields: [
      { key: "topic", label: "Topic", type: "text", required: true },
      { key: "locality", label: "Locality", type: "text", placeholder: "Williamsburg, Clermont County, Cincinnati..." },
      { key: "keyword", label: "Primary search phrase", type: "text" },
      { key: "facts", label: "Verified facts / source notes", type: "textarea", required: true, placeholder: "Paste the facts and sources you want the article grounded in." },
      { key: "cta", label: "CTA", type: "text" }
    ], prompt: "Create a useful local/real-estate blog package grounded only in supplied facts: headline options, search intent, outline, full article, meta title, meta description, FAQ ideas, image/B-roll suggestions, internal-link ideas, Facebook post, email teaser, and a related video concept. Do not manufacture statistics or pretend unsourced statements are facts." },
    { id: "local-story-campaign", category: "Content", label: "Local Story → Campaign", icon: "⌖", description: "Turn one verified Cincinnati-area story into a trust-building content campaign.", publicFacing: true, fields: [{ key: "story", label: "Verified story notes", type: "textarea", required: true }, { key: "businessAngle", label: "Why locals should care", type: "textarea" }], prompt: "Turn the supplied local story into a useful content campaign: Facebook-group post, personal-page post, 60-second video, 5-minute explainer, blog outline, newsletter item, conversation starter, and a non-salesy real-estate/business angle only if genuinely relevant. Keep facts and opinion visibly separate." },
    { id: "market-update", category: "Content", label: "Market Update Producer", icon: "▥", description: "Turn actual market numbers into understandable content.", publicFacing: true, fields: [{ key: "marketData", label: "Verified market numbers", type: "textarea", required: true, placeholder: "Period, geography, inventory, price, DOM, sales, rates/source..." }], prompt: "Explain the supplied housing data in plain English. Give what changed, what it may mean for sellers, what it may mean for buyers, what we cannot infer, a video script, a social post, and a blog outline. Never invent trend data or overstate causation." },
    { id: "social-campaign", category: "Content", label: "Social Campaign", icon: "#", description: "Create a week of useful posts from one grounded topic.", publicFacing: true, fields: [{ key: "topic", label: "Topic", type: "text", required: true }, { key: "facts", label: "Verified facts / notes", type: "textarea" }], prompt: "Create a seven-post social campaign that builds expertise and conversation rather than constant selling. Include platform, post copy, visual idea, CTA, and what business signal each post is intended to generate." },
    { id: "newsletter", category: "Content", label: "Local Newsletter", icon: "✉", description: "Produce an email worth opening, not a generic market blast.", publicFacing: true, fields: [{ key: "items", label: "Verified newsletter items", type: "textarea", required: true }], prompt: "Create a concise local newsletter with useful sections, subject lines, preview text, scannable copy, source reminders, and a conversational CTA. Avoid turning every item into a sales pitch." },

    { id: "cma-narrative", category: "CMA", label: "CMA Narrative", icon: "$", description: "Explain a saved Holton CMA without changing its math.", licensedActivity: true, fields: [{ key: "cmaSummary", label: "CMA result / notes", type: "textarea", required: true }], prompt: "Explain the supplied CMA result to a homeowner. The calculation is authoritative for this draft; do not change the comp set or invent adjustments. Explain range, strongest comps, confidence, caveats, and what could move the range after property/MLS verification. State that a CMA is not an appraisal." },
    { id: "comp-review", category: "CMA", label: "Comp Review", icon: "≋", description: "Critique a proposed comp set and identify weak matches or missing verification.", licensedActivity: true, fields: [{ key: "compData", label: "Subject + comp data", type: "textarea", required: true }], prompt: "Critique the supplied comp set. Identify strongest/weakest comps, mismatches, stale data, condition unknowns, source-quality problems, and what MLS/property facts should be verified. Do not invent alternate comps." },
    { id: "seller-net-explain", category: "CMA", label: "Seller Net Explanation", icon: "=", description: "Explain a user-entered net sheet without assuming fees.", licensedActivity: true, fields: [{ key: "netSheet", label: "User-entered net sheet numbers", type: "textarea", required: true }], prompt: "Explain the supplied seller net estimate line by line. Never assume a standard commission or fee; broker compensation is negotiable. Identify estimates that need title, lender, tax, brokerage or attorney verification." },

    { id: "fair-housing-scan", category: "Compliance", label: "Fair Housing Scan", icon: "⚑", description: "Flag risky targeting or preference language before publishing.", fields: [{ key: "copy", label: "Copy to review", type: "textarea", required: true }], prompt: "Review the supplied copy for fair-housing and steering risk. Explain each issue conservatively and propose fact-focused alternatives. Do not certify the copy as legal or compliant; state what still requires human/broker review." },
    { id: "ad-risk-scan", category: "Compliance", label: "Advertising Risk Scan", icon: "!", description: "Check identity, authority, accuracy and disclosure risks.", fields: [{ key: "copy", label: "Advertising copy", type: "textarea", required: true }], prompt: "Review the supplied advertising copy for Ohio identity/brokerage disclosure, authority-to-advertise, misleading claims, fair-housing risk, REALTOR status claims, value guarantees, and missing fact verification. Do not issue a legal certification." },
    { id: "agency-gate", category: "Compliance", label: "Agency Gate", icon: "▰", description: "Check whether the next activity needs representation/agency confirmation.", context: true, licensedActivity: true, fields: [{ key: "plannedAction", label: "Planned action", type: "select", options: ["Show property for seller", "Make offer for buyer", "Advertise seller property", "Buyer consultation", "Listing appointment", "Other"] }], prompt: "Create a pre-action agency checklist using Ohio rules and the supplied CRM facts. Identify what must be confirmed before proceeding and what requires brokerage review. Do not decide legal status from missing facts." },
    { id: "broker-review", category: "Compliance", label: "Broker Review Packet", icon: "✓", description: "Turn uncertainty into a clean question for your broker.", context: true, fields: [{ key: "issue", label: "What needs review?", type: "textarea", required: true }], prompt: "Prepare a concise broker-review packet: known facts, unknowns, exact question, applicable rule areas to check, and why the issue matters. Do not answer the broker's legal/compliance question yourself when facts or authority are incomplete." },

    { id: "daily-business", category: "Business", label: "Daily Business Plan", icon: "☀", description: "Turn CRM priorities into a focused prospecting/service block.", prompt: "Using the supplied CRM priority list, build a practical day plan that prioritizes replies, overdue promises, hottest opportunities, relationship-building, content, and transaction service. Keep it realistic and focused on conversations that create trust and business." },
    { id: "pipeline-rescue", category: "Business", label: "Pipeline Rescue", icon: "△", description: "Find where active opportunities are leaking.", prompt: "Analyze the supplied pipeline signals and produce a rescue plan. Separate data-hygiene problems, stale relationships, missing next steps, and genuine low-intent leads. Do not suggest spammy mass outreach." },
    { id: "content-to-leads", category: "Business", label: "Content → Leads Plan", icon: "∞", description: "Connect local content to measurable conversations and appointments.", fields: [{ key: "contentPlan", label: "Current content idea / channel", type: "textarea", required: true }], prompt: "Design a content-to-lead system around the supplied idea: audience, useful promise, CTA, lead capture, CRM source tag, follow-up path, measurement from views to conversations to appointments, and what to change if it gets attention but no leads." },
    { id: "weekly-review", category: "Business", label: "Weekly CEO Review", icon: "▦", description: "Review prospecting, pipeline, content and follow-up like a sales manager.", prompt: "Run a weekly real-estate business review from the supplied CRM metrics. Identify wins, leaks, neglected relationships, seller opportunities, content that should be doubled down on, and the three highest-value commitments for next week." }
  ];

  function toolById(id) { return TOOL_CATALOG.find((t) => t.id === id) || null; }

  function profileWarnings(tool, profile = readStudio().profile, form = {}) {
    const warnings = [];
    if (tool?.licensedActivity && profile.licenseMode === "prelicense") warnings.push({ severity: "block", text: "Pre-license mode: this is a training/research draft only. Do not perform or advertise licensed brokerage services until properly licensed and affiliated." });
    if (tool?.publicFacing && profile.licenseMode !== "prelicense" && !profile.brokerageName) warnings.push({ severity: "block", text: "Brokerage name is missing. Ohio advertising rules require brokerage identification for licensed public-facing real-estate advertising." });
    if (tool?.publicFacing && profile.licenseMode !== "prelicense" && !profile.brokerageReviewed) warnings.push({ severity: "review", text: "Brokerage advertising profile has not been marked reviewed. Treat the output as a draft pending brokerage policy review." });
    if (/realtor/i.test(String(form?.extra || "")) && !profile.realtorMember) warnings.push({ severity: "block", text: "Do not claim REALTOR® status unless membership is actually held." });
    return warnings;
  }

  function systemPrompt(tool, profile, complianceWarnings = []) {
    const applicable = OFFICIAL_RULES.map((r) => `- ${r.source}: ${r.summary}`).join("\n");
    return `You are Holton Homes AI, an internal real-estate business copilot. You assist with relationship management, marketing drafts, research organization and business planning. You are not the source of truth for laws, MLS data, property facts, contracts, tax, lending, title, appraisal, inspection or brokerage policy.\n\nUSER STATUS\nLicense mode: ${profile.licenseMode}\nState: ${profile.licenseState}\nAdvertising name: ${profile.advertisingName || "not configured"}\nBrokerage: ${profile.brokerageName || "not configured"}\nREALTOR membership: ${profile.realtorMember ? "confirmed in settings" : "not confirmed"}\n\nNON-NEGOTIABLE RULES\n1. Use only facts supplied in CRM context, CMA calculations, or explicit form inputs. Never invent property facts, prices, dimensions, upgrades, communications, client intent, market statistics, deadlines, representation status, school/crime data or source citations.\n2. Clearly separate FACTS, INTERPRETATION, RECOMMENDATION and VERIFY when the distinction matters.\n3. Never state that an output is legal, compliant, broker-approved, an appraisal, or guaranteed accurate.\n4. Never draft legal contract language or interpret a contract as legal advice. Flag items for broker/attorney review when appropriate.\n5. Never assume a standard commission or broker fee. Compensation is negotiable and must come from user/brokerage inputs.\n6. Do not target, steer, prefer or exclude people based on protected characteristics. Avoid subjective demographic-coded neighborhood claims. Objective school/crime information must be sourced, consistently offered and handled carefully.\n7. Never claim REALTOR® status unless the profile confirms membership.\n8. If the user is pre-license, keep regulated real-estate-service outputs in training/research mode and do not write copy that holds the user out as licensed.\n9. For public advertising after licensure, include a reminder that Ohio brokerage identity/prominence and brokerage policy requirements must be satisfied.\n10. A human agent remains responsible for final review and every client-facing action.\n\nCURRENT VERIFIED RULE LIBRARY (summaries; re-check when rules change)\n${applicable}\n\nCURRENT PREFLIGHT WARNINGS\n${complianceWarnings.length ? complianceWarnings.map((w) => `- ${w.severity.toUpperCase()}: ${w.text}`).join("\n") : "- None from deterministic preflight."}\n\nTOOL\n${tool.label}: ${tool.description}`;
  }

  function contextText(tool, options = {}) {
    const crm = readCRM();
    const chunks = [];
    if (tool.context && options.contactId) {
      const ctx = buildContactContext(options.contactId, { crm });
      if (ctx) chunks.push(`CRM CONTACT CONTEXT\n${JSON.stringify(ctx, null, 2)}`);
    }
    if (["daily-business", "pipeline-rescue", "weekly-review"].includes(tool.id)) {
      const queue = dailyQueue(15).map((x) => ({ name: fullName(x.contact), type: x.contact.type, stage: x.contact.stage, heat: x.contact.heat, score: x.score, reasons: x.reasons, next: x.next }));
      chunks.push(`CRM BUSINESS SIGNALS\nPipeline health: ${JSON.stringify(pipelineHealth())}\nPriority relationships: ${JSON.stringify(queue, null, 2)}`);
    }
    return chunks.join("\n\n");
  }

  function formText(form = {}) {
    return Object.entries(form).filter(([, v]) => String(v ?? "").trim()).map(([k, v]) => `${k}: ${redactSensitive(v)}`).join("\n");
  }

  async function listOllamaModels(endpoint = readStudio().ai.endpoint) {
    const base = String(endpoint || DEFAULT_OLLAMA).replace(/\/$/, "");
    const res = await fetch(`${base}/api/tags`, { method: "GET" });
    if (!res.ok) throw new Error(`Ollama returned ${res.status}`);
    const data = await res.json();
    return Array.isArray(data.models) ? data.models : [];
  }

  function stripThinking(text) {
    return String(text || "").replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/^\s+|\s+$/g, "");
  }

  async function ollamaChat({ messages, endpoint, model, keepAlive, temperature }) {
    const base = String(endpoint || DEFAULT_OLLAMA).replace(/\/$/, "");
    if (!model) throw new Error("Choose a local Ollama model in Studio Settings first.");
    const res = await fetch(`${base}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        keep_alive: keepAlive ?? 0,
        options: { temperature: temperature ?? 0.25 }
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Ollama returned ${res.status}`);
    return stripThinking(data?.message?.content || "");
  }

  async function generate(toolId, options = {}) {
    const tool = toolById(toolId);
    if (!tool) throw new Error("Unknown Studio tool.");
    const studio = readStudio();
    const warnings = profileWarnings(tool, studio.profile, options.form || {});
    const deterministicScan = scanText([formText(options.form || {}), redactSensitive(options.extra || "")].filter(Boolean).join("\n"), { publicFacing: tool.publicFacing, profile: studio.profile });
    deterministicScan.forEach((hit) => warnings.push({ severity: hit.severity === "high" ? "review" : "note", text: `${hit.reason}: “${hit.phrase}”` }));
    const messages = [
      { role: "system", content: systemPrompt(tool, studio.profile, warnings) },
      { role: "user", content: [contextText(tool, options), `USER INPUT\n${formText(options.form || {}) || "No extra form input."}`, options.extra ? `EXTRA INSTRUCTIONS\n${redactSensitive(options.extra)}` : "", `TASK\n${tool.prompt}`].filter(Boolean).join("\n\n") }
    ];
    let text;
    if (studio.ai.provider === "ollama") {
      text = await ollamaChat({ messages, ...studio.ai });
    } else {
      throw new Error("Only the local Ollama provider is enabled in this baseline. The provider layer is intentionally replaceable later.");
    }
    if (warnings.length) {
      const heading = warnings.some((w) => w.severity === "block") ? "TRAINING / REVIEW STATUS" : "PREFLIGHT REVIEW";
      text = `${heading}\n${warnings.map((w) => `- ${w.text}`).join("\n")}\n\n${text}`;
    }
    const generation = saveGeneration({ toolId, contactId: options.contactId || "", form: options.form || {}, output: text, warnings });
    if (studio.preferences.saveAiDrafts) saveAsset({ type: "ai-draft", toolId, title: `${tool.label} — ${new Date().toLocaleString()}`, contactId: options.contactId || "", body: text, metadata: { warnings } });
    return { text, warnings, generation };
  }

  function exportAll(options = {}) {
    const out = {
      exportedAt: nowIso(),
      studioVersion: VERSION,
      studio: readStudio()
    };
    if (options.includeCRM === true) out.crmSnapshot = readCRM();
    return out;
  }

  window.HoltonStudioEngine = {
    VERSION,
    CRM_KEY,
    STUDIO_KEY,
    DEFAULT_OLLAMA,
    OFFICIAL_RULES,
    SOURCE_CATALOG,
    TOOL_CATALOG,
    readCRM,
    readStudio,
    writeStudio,
    updateStudio,
    fullName,
    propertyAddress,
    contactById,
    buildContactContext,
    relationshipScore,
    nextBestAction,
    dailyQueue,
    pipelineHealth,
    scanText,
    redactSensitive,
    sanitizeForAi,
    sourceQuality,
    compMatchScore,
    calculateCMA,
    saveCMA,
    saveAsset,
    saveGeneration,
    toolById,
    profileWarnings,
    listOllamaModels,
    generate,
    exportAll,
    uid,
    today
  };
})();
