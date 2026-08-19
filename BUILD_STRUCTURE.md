# Build Structure — How This Becomes a Serious Product

## Why v1 is additive

The existing CRM core is a large single-file app. Rewriting it while simultaneously adding AI/CMA/content would multiply regression risk. Studio v1 therefore loads after the current CRM and adds capability around stable routes/data.

Current runtime:

`app.js (existing CRM)`
→ `holton-ai.js (existing Pip/integrations)`
→ `holton-studio-engine.js (new logic/provider/CMA/privacy/compliance)`
→ `holton-studio.js (new UI/router enhancers)`
→ `holton-studio.css (isolated presentation)`

## What should remain deterministic

- due/overdue calculations
- relationship scores/reasons
- stage/workflow gates
- CMA calculations
- source quality/provenance
- campaign attribution
- transaction deadlines once structured
- permission/auth decisions
- compliance phrase/rule preflight

These are cheaper and more reliable as software rules.

## What AI should do

- summarize relationship context
- prepare conversations
- draft/transform language
- synthesize supplied evidence
- content ideation/production
- explain CMA results
- identify questions/unknowns
- coach the business based on already-calculated signals

AI should not become the database, MLS, legal source, appraiser, lender or broker.

## Adapter interfaces to build next

### AIProvider
v1: Ollama.
Later: cloud fallback without changing tool UI.

### PropertySource
- BrownCountyPublicAdapter
- ClermontCountyPublicAdapter
- HamiltonCountyPublicAdapter
- ManualPortalReferenceAdapter
- CincyMLSAdapter (authorized future)

All normalize into one property/comp schema with source provenance.

### CommunicationProvider
Future Gmail/SMS/calling adapters. AI suggests; human approval is the default until specific automations are proven safe.

### PublishingProvider
Future website/blog/social/Canva export. Keep research, drafting and publishing as separate states.

## Database evolution

The current `crm_state` JSON document is practical for one-user prototyping. Before multi-user/commercial scale, normalize high-value entities:

- users / teams / memberships
- contacts / households
- contact_methods
- properties
- opportunities
- activities / communications
- tasks
- transactions / milestones
- content_items / campaigns / attribution_events
- cmas / cma_comps / source_snapshots
- studio_assets / generations
- compliance_reviews
- audit_events

Every tenant-scoped table needs explicit ownership/authorization and RLS. Do not migrate merely for architectural fashion; migrate when queryability, concurrency, auditability or team access requires it.

## Product invariants

1. Existing CRM works when AI is offline.
2. No public/client action auto-sends from an LLM in v1.
3. Material property/CMA facts retain provenance.
4. Low-confidence CMA stays visibly low-confidence.
5. Pre-license status is never silently upgraded.
6. REALTOR® is never inferred from licensure.
7. Client privacy packet is inspectable before AI use.
8. A source/rule can expire and be re-verified without rewriting prompts.
9. Provider can change without redesigning workflows.
10. A future commercial version must be tenant-safe by design, not by convention.
