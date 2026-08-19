# Holton Homes OS — Product Blueprint

## Product thesis

Holton Homes should not be a generic chatbot attached to a CRM. The CRM is the source of relationship truth. Deterministic software should handle facts, scoring, calculations, deadlines, source quality and workflow state. AI should handle language, synthesis, planning and explanation.

That structure borrows the strongest workflow ideas from current real-estate software without copying their product:

- **Follow Up Boss baseline:** AI is useful when it appears in the lead record and uses the lead's actual communications/notes/activity rather than asking the agent to rebuild context in a prompt.
- **Saleswise baseline:** specialized one-click real-estate tools are easier than a blank chat box; CMA, listing marketing and visual/content workflows belong in one workspace.
- **Lofty baseline:** CRM automation is strongest when behavior/stage triggers, lead prioritization and follow-up plans work together.

Sources reviewed 2026-08-19:
- https://www.followupboss.com/features/ai
- https://help.followupboss.com/hc/en-us/articles/32113758342167-Smart-Messages
- https://help.followupboss.com/hc/en-us/articles/360034301034-Working-Your-Smart-Lists
- https://www.saleswise.ai/
- https://www.saleswise.ai/cma
- https://lofty.com/feature/smart-plans

## The seven product layers

### 1. Holton CRM — system of record
People, properties, communications, tasks, pipeline, transactions, calendar, lead sources, content and local network remain the center.

### 2. Holton Intelligence — deterministic/free
This should answer without an LLM:
- who needs attention today
- overdue promises
- missing follow-up dates
- stale hot/warm relationships
- relationship score and reasons
- next-best-action class
- pipeline hygiene
- lead-source performance
- content-to-conversation attribution
- transaction/deadline alarms once structured transaction data is mature

### 3. Holton AI — language/reasoning layer
AI gets only an approved context packet. It does not get unrestricted database access.

Current v1 workflows (36 total):
- Relationships: Lead Brief, Call Prep, Follow-Up Writer, 90-Day Relationship Plan, Referral Ask, Cold Lead Revival
- Sellers: Seller Lead Plan, Listing Appointment Prep, Listing Description, Seller Update, Price Adjustment Prep, Open House Plan, Listing Launch Pack
- Buyers: Buyer Consultation Prep, Property Comparison, Showing Follow-Up, Offer Conversation Prep, Inspection Conversation Prep
- Content: Video Producer, Clip Finder, Blog Producer, Local Story Campaign, Market Update Producer, Social Campaign, Local Newsletter
- CMA: CMA Narrative, Comp Review, Seller Net Explanation
- Compliance: Fair Housing Scan, Advertising Risk Scan, Agency Gate, Broker Review Packet
- Business: Daily Business Plan, Pipeline Rescue, Content-to-Leads Plan, Weekly CEO Review

### 4. Holton CMA — evidence first
The CMA engine owns the math. AI explains the result, but cannot silently change the comp set or invent adjustments.

v1 flow:
1. enter subject facts
2. add/import candidate comps
3. verify source and basic fields
4. score similarity
5. include/exclude comps
6. enter explicit manual adjustments when justified
7. calculate weighted evidence range
8. display confidence/caveats
9. ask AI to explain the already-calculated result

Future MLS flow:
`Public record adapter + authorized CincyMLS adapter + manual verification → normalized property schema → comp candidate engine → human-selected comp set → calculation → presentation.`

### 5. Holton Content Studio — trust and lead generation
The goal is not “more content.” It is a measurable content-to-relationship loop.

One source idea can become:
- long video
- short video
- clips
- blog
- Facebook/local-group post
- personal social post
- newsletter item
- conversation starter
- landing-page/CTA idea
- CRM source/campaign ID

Measure:
`views → responses → captured contacts → conversations → appointments → signed clients → closings → GCI.`

### 6. Holton Compliance — deterministic guardrails + sourced explanation
Never let an LLM claim “this is compliant.”

Hard checks should flag:
- pre-license regulated activity
- missing brokerage identity after licensure
- REALTOR® claims without confirmed membership
- fair-housing preference/steering language
- subjective safety/school claims
- guarantees and misleading claims
- advertising another property without authority
- commission assumptions
- contract/legal drafting requests

Then AI may explain the risk and identify the source area.

### 7. Provider layer — replaceable AI
v1: Ollama local.
Future: optional cloud provider.

Nothing in the CRM should depend on one model vendor. All Studio tools call a provider interface so the backend can change without redesigning the product.

## Daily agent workflow the product should optimize

### Morning
1. Open Today.
2. See replies and overdue promises first.
3. See top 5 relationships by deterministic priority.
4. Open a contact.
5. Use AI Brief/Call Prep only if needed.
6. Make the call/send the reviewed draft.
7. Set the next date.

### Seller opportunity
1. Seller enters CRM.
2. Verify motivation/timing/property/decision makers.
3. Build Public CMA research.
4. Add MLS evidence later when authorized.
5. Prepare listing appointment.
6. Generate seller-facing explanation/launch assets only from verified facts.
7. Track follow-up until appointment/listing decision.

### Content day
1. Start with a real local question/story/market data point.
2. Add source facts.
3. Video Producer creates hook/script/shot list/CTA.
4. Blog Producer creates sourced article and SEO derivatives.
5. Social Producer repurposes.
6. Campaign is tagged in CRM.
7. Leads/DMs/calls are attributed back to the content source.

## Product rule

If a feature does not help the agent find people, understand people, contact people, earn trust, serve people, win/retain business, or measure what produces business, it should not be a primary UI element.
