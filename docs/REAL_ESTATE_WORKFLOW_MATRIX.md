# Real-Estate Workflow Matrix — What the OS Should Know

This is the operational model behind the UI. It is deliberately relationship-first: every automation, AI tool and KPI should answer a real agent question rather than create busywork.

## Seller lifecycle

### 1. New / attempted contact
CRM should know:
- lead source/campaign
- valid contact method
- property address if known
- reason for inquiry
- first-response timestamp
- next follow-up date

System should do:
- deterministic speed-to-lead priority
- prevent an untouched seller lead from disappearing
- surface missing property/motivation/timing fields
- AI: Seller Lead Plan / Call Prep / Follow-Up Writer

Success event:
- two-way conversation + next date

### 2. Contacted / nurture
CRM should learn:
- why a move might happen
- ideal/realistic timing
- who else decides
- property condition/known updates
- next-home dependency
- price/equity questions
- objections/risks

System should do:
- stale-contact rescue
- useful nurture reasons instead of generic “checking in” spam
- public CMA research when appropriate
- relationship plan

Success event:
- valuation/strategy conversation or listing appointment

### 3. Valuation / listing appointment
CRM should know:
- verified subject facts
- comp evidence + source provenance
- seller priorities: price/timing/convenience/certainty
- decision makers
- representation/agency status when legally required
- meeting date

System should do:
- CMA evidence workflow
- appointment prep
- broker/agency gate
- seller net explanation only from user-entered assumptions

Success event:
- clear decision + next commitment; after licensure, signed listing agreement when appropriate

### 4. Coming soon / active listing
CRM should know:
- authority/representation status
- approved list price
- verified property facts
- launch date
- showing/activity/feedback facts
- seller communication cadence
- offer activity

System should do:
- Listing Launch Pack
- listing-description fact gate
- public advertising scan
- weekly seller update
- price-adjustment prep based on evidence, not pressure
- open-house lead capture/follow-up

Success event:
- qualified offer / under contract

### 5. Under contract / closing
CRM should know:
- actual contract milestone dates
- responsible parties
- inspection/appraisal/title/lender status as known
- client commitments
- closing/possession facts

System should do:
- deterministic deadline/task engine
- communication prep
- no autonomous legal interpretation
- broker/attorney escalation packet when needed

Success event:
- clean closing + post-close relationship plan

### 6. Past client
CRM should know:
- close date/property
- review/referral history
- home anniversary
- last personal contact
- future housing plans/referral signals

System should do:
- relationship—not drip-spam—touch plan
- useful homeowner/local content
- referral ask only when earned

Success event:
- repeat/referral conversation while protecting trust

---

## Buyer lifecycle

### 1. New / contacted
Know:
- source
- motivation/timing
- comfortable payment/budget
- financing/preapproval status
- areas/property type
- non-negotiables
- next date

Tools:
- Buyer Consultation Prep
- Call Prep
- Follow-Up Writer

### 2. Consultation / pre-approved / touring
Know:
- representation/agency status as required
- lender/preapproval facts
- search priorities
- showing history + explicit feedback
- property comparison facts

Tools:
- Property Comparison
- Showing Follow-Up
- Agency Gate

Do not:
- steer by protected-class demographics
- substitute subjective “safe/good schools” assertions for objective sourced information

### 3. Offer / contract
Know:
- supplied property facts
- financing facts
- known offer terms
- deadlines and contingencies from actual documents/data

Tools:
- Offer Conversation Prep (strategy checklist, not contract drafting)
- Inspection Conversation Prep
- broker/legal escalation

Success event:
- closing + past-client transition

---

## Sphere / local-network lifecycle

Not every person is a “lead.” The system should preserve:
- relationship strength/context
- neighborhood/community tie
- professional/vendor relationship
- referral history
- last human touch

Useful actions:
- personal check-in
- local information worth sharing
- collaboration/referral opportunity
- event/content conversation

Avoid turning the sphere into automated sales spam.

---

## Content lifecycle

1. Research/source packet
2. Fact verification
3. Produce asset
4. Compliance/public-copy review if real-estate advertising
5. Publish externally (human action in v1)
6. Assign campaign/source tag
7. Capture inquiries
8. Convert inquiry → CRM person
9. Measure conversation → appointment → client → close/GCI

The CRM should eventually answer: **which topics and channels create actual relationships, not merely views?**

---

## Data-quality principle

AI is downstream of CRM quality. Important structured facts should not remain trapped forever in random notes. Future extraction can suggest structured fields, but a human approves material changes.
