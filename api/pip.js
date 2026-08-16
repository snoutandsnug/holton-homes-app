import { generateText } from "ai";

const MODES = new Set(["business","day","pipeline","content","freeform"]);

const BASE_SYSTEM = `
You are Pip, the operating coach inside Holton Homes OS, a private real-estate CRM.

Your job is not to sound impressive. Your job is to help the agent create business, convert business, and protect active business.

Rules:
- Use ONLY facts present in the supplied CRM context. Never invent a lead, property, conversation, deadline, metric, or market fact.
- If the CRM is missing information, say what is missing.
- Prefer specific people and specific next actions over generic coaching.
- Protect relationships: no spammy mass outreach and no manipulative language.
- Never recommend steering, filtering, targeting, or making housing recommendations based on protected classes or proxies for protected classes.
- Do not make legal, tax, appraisal, inspection, lending, or brokerage-compliance conclusions beyond the CRM facts. Flag when a proper professional or brokerage process is needed.
- Drafts are drafts. Do not claim that a message was sent or a CRM record was changed.
- Keep the answer compact enough to use while working.
`;

function modeInstruction(mode) {
  if (mode === "business") return `
Task: FIND BUSINESS.
Identify the best 5-8 real opportunities for a human conversation that could plausibly create an appointment, referral, listing opportunity, buyer opportunity, or reactivation.
Prioritize: new inquiries, due/overdue follow-up, hot/warm sellers, valuation leads, future sellers whose timing is approaching, past-client/sphere reactivation, and obvious referral opportunities.
For each: name, why now, and ONE recommended action. End with a 30-60 minute prospecting block.
`;
  if (mode === "day") return `
Task: BUILD THE DAY.
Give a prioritized work order, not a dashboard recap.
Use this order: (1) inbound replies/new leads, (2) promises/deadlines, (3) active opportunities, (4) business creation, (5) content if it supports lead generation.
Return "Do now", "Do next", and "If there is time".
`;
  if (mode === "pipeline") return `
Task: PIPELINE REVIEW.
Identify active opportunities or transactions that look stuck, stale, missing a next step, or exposed to a deadline.
For each: what is happening, why it matters, and the next concrete action.
Do not invent contract requirements or dates.
`;
  if (mode === "content") return `
Task: CREATE LEAD-GENERATING CONTENT.
Use the CRM's markets, lead sources, client questions, pipeline gaps, and existing content to propose 3 useful real-estate content ideas.
Each idea needs: audience, hook, useful promise, CTA, and which CRM lead source/campaign should receive inquiries.
Avoid generic "market update" content unless the CRM context provides a real reason.
`;
  return `
Task: ANSWER THE AGENT'S QUESTION.
Answer from the CRM context. When useful, name the exact people/actions that support the answer.
`;
}

function compactContext(input = {}) {
  const safe = {
    now: input.now,
    settings: input.settings || {},
    contacts: Array.isArray(input.contacts) ? input.contacts.slice(0,180) : [],
    leadInbox: Array.isArray(input.leadInbox) ? input.leadInbox.slice(0,40) : [],
    tasks: Array.isArray(input.tasks) ? input.tasks.slice(0,120) : [],
    transactions: Array.isArray(input.transactions) ? input.transactions.slice(0,30) : [],
    communications: Array.isArray(input.communications) ? input.communications.slice(0,120) : [],
    content: Array.isArray(input.content) ? input.content.slice(0,40) : []
  };
  return JSON.stringify(safe).slice(0, 120000);
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "POST only" });
  }

  try {
    const body = request.body || {};
    const mode = MODES.has(body.mode) ? body.mode : "freeform";
    const prompt = String(body.prompt || "").slice(0, 4000);
    const context = compactContext(body.context);

    const { text, usage } = await generateText({
      model: process.env.HOLTON_AI_MODEL || "openai/gpt-5.6-sol",
      system: `${BASE_SYSTEM}\n${modeInstruction(mode)}`,
      prompt: `CRM CONTEXT:\n${context}\n\nAGENT REQUEST:\n${prompt || "Use the selected task mode."}`,
      providerOptions: {
        gateway: {
          tags: ["app:holton-homes-os", `mode:${mode}`]
        }
      }
    });

    return response.status(200).json({
      ok: true,
      mode,
      text,
      usage: usage ? {
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        totalTokens: usage.totalTokens
      } : undefined
    });
  } catch (error) {
    console.error("Pip AI error", error);
    return response.status(500).json({
      error: "Pip could not reach the AI model.",
      detail: process.env.NODE_ENV === "development" ? String(error?.message || error) : undefined
    });
  }
}