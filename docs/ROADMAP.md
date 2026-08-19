# Roadmap — Build Order That Avoids a Money Pit

## Phase 0 — This ZIP: prove the product loop
Success criteria:
- existing CRM routes remain intact
- Studio feels native, not like another app
- contact AI uses actual CRM context
- Ollama works when running and fails gracefully when off
- pre-license mode blocks/labels regulated drafts
- CMA math works with real manually entered/imported public sales
- Video/Blog producers create outputs worth using
- no surprise cloud-model cost

Do not merge until the preview passes `TEST_PLAN.md`.

## Phase 1 — Data quality + “I open this every morning”
Build next:
1. strengthen People record completeness
2. stale/overdue/reply queue
3. source/campaign attribution
4. weekly business scorecard
5. contact notes → structured fields with human approval
6. seller/buyer checklists by stage
7. transaction milestone model

Reason: AI gets better when the CRM facts get better.

## Phase 2 — Public CMA Beta becomes practical
1. county import adapters for Brown, Clermont, Hamilton
2. address normalization / duplicate detection
3. map/geocoding for distance calculations
4. comp filters: radius, age, sqft band, acreage band, property type
5. active/pending manual inputs
6. saved CMA versions
7. branded PDF report
8. seller net sheet

No prohibited portal scraping.

## Phase 3 — Authorized MLS
After CincyMLS access/permissions are known:
1. review the data-use agreement/IDX rules
2. obtain authorized credentials/feed
3. implement `MLSAdapter`
4. merge MLS and public-record facts with provenance
5. candidate comp search
6. status/history/DOM fields
7. client-facing report requirements/disclosures
8. cache only what the agreement permits

The CMA core should not need to be rewritten.

## Phase 4 — Content factory
1. research packet inbox
2. free-data adapters where terms permit (for example Zillow Research market metrics, Freddie Mac PMMS, FRED/Census as appropriate)
3. source verification/status
4. one-click producer handoff
5. transcript ingestion
6. local Whisper helper
7. clip extraction via included FFmpeg helper / later deeper integration
8. design/flyer templates
9. campaign IDs/QR/UTM landing pages
10. content → contact → appointment attribution

## Phase 5 — Communication integrations
Only after privacy/compliance controls are ready:
- Gmail/Calendar sync
- calling/text provider
- message suggestions in compose window
- inbound reply detection
- human-approved Smart Plans
- automatic pause on reply

Do not begin with an autonomous “AI ISA” that sends uncontrolled client messages.

## Phase 6 — Brokerage knowledge
Once brokerage is chosen:
- brokerage advertising identity/profile
- brokerage policy on agency
- approved scripts/templates
- required disclosures
- local MLS forms/rules
- transaction checklist
- broker escalation channel

## Phase 7 — Commercial hardening
Only if the tool becomes something to sell:
- multi-tenant database
- role-based auth
- audit logs
- billing
- secure secrets
- backups/export/import
- privacy/terms
- E&O/legal review of product claims
- production hosting appropriate to commercial use
- monitoring/telemetry
- update/migration system
