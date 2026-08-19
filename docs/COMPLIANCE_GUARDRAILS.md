# Ohio / Professional Compliance Guardrails

**Verified baseline date: 2026-08-19.** This document is an internal product design checklist, not legal advice. Ohio law, MLS rules, brokerage policy and forms can change. Re-verify before production use.

## 1. Pre-license mode is the default

The software starts in `prelicense` mode. Any tool marked as licensed activity is labeled/blocked as a **training or research draft**.

Reason: Ohio Chapter 4735 regulates brokerage activity and generally prohibits acting/advertising as a real-estate broker or salesperson without the required license.

Primary source:
- https://codes.ohio.gov/ohio-revised-code/chapter-4735

Product behavior:
- Do not represent the user as licensed.
- Do not produce public copy that says or implies REALTOR®, agent, salesperson or brokerage authority when those facts are not true.
- Do not automatically send/publish regulated materials.

## 2. Advertising after licensure

Ohio OAC 1301:5-1-02 requires identity disclosure in licensed real-estate advertising and requires the brokerage name at least equal in prominence with the salesperson name on controlled advertising. ORC 4735.16 also addresses advertising identity and misleading advertising.

Sources:
- https://codes.ohio.gov/ohio-administrative-code/rule-1301%3A5-1-02
- https://codes.ohio.gov/ohio-revised-code/section-4735.16

Product behavior:
- Public-facing real-estate tools require a configured brokerage after license mode is enabled.
- Add brokerage-policy review status.
- Never invent listing facts, statistics, seller authority, claims, dimensions, upgrades or values.
- Flag guarantees and “standard commission” language.

## 3. Team/group branding

Ohio OAC 1301:5-1-21 governs team advertising. A team/group must satisfy naming and brokerage prominence rules; named unlicensed team members must be identified as unlicensed.

Source:
- https://codes.ohio.gov/ohio-administrative-code/rule-1301%3A5-1-21

Product behavior:
- Do not automatically classify “Holton Homes” as an Ohio real-estate team.
- When/if a team is formed, create a brokerage-reviewed brand profile and enforce the appropriate identity footer/template.

## 4. Written agency gate

Current ORC 4735.55 (effective 2025-09-30) requires a written agency agreement before specified residential activity, including advertising/showing for a seller and making an offer for a purchaser.

Source:
- https://codes.ohio.gov/ohio-revised-code/section-4735.55

Product behavior:
- `Agency Gate` does not decide legal status; it asks what is known and flags missing confirmation.
- Future transaction/workflow engine should store agency agreement status/date/type and prevent specific “ready” statuses when required facts are absent.

## 5. Accuracy, authority and recordkeeping

ORC 4735.18 includes disciplinary grounds such as misrepresentation, false promises, materially misleading advertising, offering property without authority, and failure to keep transaction records for the required period.

Source:
- https://codes.ohio.gov/ohio-revised-code/section-4735.18

Product behavior:
- Preserve source URL/note for material CMA and marketing facts.
- Never auto-delete transaction evidence based only on “cleanup.”
- Future transaction document module should have retention rules and immutable/auditable event history.

## 6. Fair housing / steering

Federal Fair Housing Act protected classes include race, color, national origin, religion, sex, familial status and disability. Ohio law adds protections including ancestry and military status.

Sources:
- https://www.hud.gov/program_offices/fair_housing_equal_opp/fair_housing_act_overview
- https://codes.ohio.gov/ohio-revised-code/section-4112.02

Product behavior:
- Scan public copy for preference/exclusion signals.
- Never rank areas using protected-class demographics.
- Prefer property/commute/price/features/objective user criteria.
- School/crime information should be objective, sourced, consistently handled and never used as a proxy for protected-class steering.

NAR reference guidance:
- https://www.nar.realtor/fair-housing/faqs-on-steering-crime-and-schools

## 7. NAR Code of Ethics

The NAR Code is binding on REALTOR® members, not everyone holding a real-estate license. Studio therefore treats it as a stricter professional baseline but does not call the user a REALTOR® unless membership is confirmed.

Relevant 2026 themes include equal professional service, competence, true-picture advertising, avoiding unauthorized practice of law and respecting exclusive representation.

Source:
- https://www.nar.realtor/about-nar/governing-documents/code-of-ethics/2026-code-of-ethics-standards-of-practice

## 8. Contracts / legal questions

AI must not:
- draft contractual language as legal advice
- interpret rights/remedies as definitive legal advice
- choose forms or alter legal clauses autonomously
- claim an agreement is enforceable/compliant

Instead it may:
- organize known facts
- produce a question list
- identify an issue requiring broker/attorney review
- create a clean Broker Review Packet

## 9. Commissions / compensation

Never assume a “standard” commission. Compensation terms must come from actual brokerage/client inputs. The system should present compensation as negotiable and treat fee estimates as user-entered assumptions.

## 10. Human control

No AI-generated client message, ad, listing description, offer strategy, CMA narrative or compliance scan auto-sends in v1. The human reviews and decides.
