# Holton Homes Studio v1 — Preview Test Plan

Run on a **fresh branch + Vercel preview**, never directly on main.

## A. Regression: existing CRM
- [ ] Today opens normally
- [ ] Inbox opens normally
- [ ] People table opens normally
- [ ] Contact record opens normally
- [ ] Business/Pipeline opens normally
- [ ] Transactions opens normally
- [ ] Calendar opens normally
- [ ] Content opens normally
- [ ] Local Network / Reports / More still work
- [ ] global search works
- [ ] New button works
- [ ] existing Pip drawer still works
- [ ] leave Studio → open Today → return to Studio; Studio re-renders correctly

## B. Studio shell
- [ ] Studio nav item appears without breaking top-nav layout
- [ ] Overview loads
- [ ] all Studio tabs load
- [ ] mobile Studio link reachable via More
- [ ] Content page shows Producer Studio dock
- [ ] contact page shows Holton Intelligence strip

## C. Relationship intelligence
Create/use one real test contact with communications/tasks.
- [ ] priority score displays
- [ ] reasons match actual CRM data
- [ ] next action makes sense
- [ ] Lead Brief uses correct contact
- [ ] Call Prep uses correct communication/task context
- [ ] Follow-Up does not invent facts
- [ ] sensitive-looking test data is redacted from AI context

## D. Ollama
- [ ] with Ollama OFF, CRM works normally
- [ ] Studio shows useful error rather than crashing
- [ ] start Ollama
- [ ] Settings → Test Ollama reports Online
- [ ] installed model appears in selector
- [ ] generate Lead Brief
- [ ] generate Video Producer output
- [ ] after generation, model unload behavior matches setting
- [ ] quitting Ollama again does not damage CRM

## E. Pre-license guardrail
With license mode = Pre-license:
- [ ] Listing Appointment Prep shows training/research block/warning
- [ ] Listing Description does not hold user out as licensed
- [ ] public content warns appropriately
- [ ] REALTOR® claim scanner flags a REALTOR claim when membership setting is false

Do not change license mode to salesperson/broker unless those facts are actually true.

## F. CMA
- [ ] enter subject property
- [ ] add 3+ real recent sales from a county source
- [ ] source/date/price/sqft fields save
- [ ] match scores update
- [ ] include/exclude works
- [ ] manual adjustment affects adjusted price
- [ ] Calculate CMA shows range + indicated center + confidence
- [ ] weak/incomplete data lowers confidence/caveats
- [ ] save CMA adds it to Library
- [ ] Explain with AI does not change the calculated numbers
- [ ] CSV import works on a saved-as-CSV auditor file

## G. Content
- [ ] Video Producer returns hook/script/shot list/CTA/repurposing
- [ ] Clip Finder refuses to fabricate timestamps when transcript has none
- [ ] Blog Producer distinguishes supplied facts/source notes
- [ ] Local Story Campaign does not force a real-estate angle where none exists
- [ ] Market Update refuses to invent missing stats
- [ ] saved output appears in Library

## H. Compliance
- [ ] “perfect for families” flags fair-housing risk
- [ ] “safe neighborhood” flags subjective steering/safety language
- [ ] “guaranteed appreciation” flags misleading/guarantee risk
- [ ] public licensed ad with missing brokerage triggers warning/block
- [ ] Broker Review Packet organizes uncertainty rather than pretending to decide law

## I. Final merge gate
Merge only if:
- no existing route is broken
- data is preserved
- no console-breaking exception during normal route changes
- Ollama offline failure is graceful
- at least one real relationship AI workflow is useful
- at least one real CMA can be built from verified comps
- mobile layout is usable
