# Holton Homes Worth-It v2 — workflow spec

## 1. Command Center (Today)

**Free / deterministic:** pipeline health, overdue follow-ups, missing next dates, hot relationships, priority queue, next-best-action reason.

**AI only when requested:** Brief or Call Prep.

Success condition: open the CRM and know what to do in under 30 seconds.

## 2. Relationship Copilot (Person record)

Visible in the existing person screen. Shows score, next best move, reasons, property link and quick actions.

Copilot drawer actions:
- AI Brief
- Call Prep
- Follow-Up
- Listing Prep for sellers
- exact sanitized-context preview

Nothing sends automatically.

## 3. Seller Desk

One seller selector drives:
- readiness score/checklist
- property summary
- relationship score and next move
- listing appointment prep
- seller plan
- listing launch pack
- seller update
- agency gate
- CMA launch prefilled from CRM property
- seller net estimate calculated locally
- public-record research links

Net sheet has **no default compensation rate**. All assumptions are user-entered and remain local.

## 4. CMA Workbench

Existing v1 CMA remains because its core architecture is right:
- subject
- candidate comps
- CSV import
- include/exclude
- source quality
- match score
- manual adjustment
- sold/closed evidence drives indicated value
- active/pending are context only
- AI narrative after the math

Next data phase: county public-data adapters, then authorized CincyMLS adapter.

## 5. Content Factory

Lives inside the existing Content section.

Input once:
- topic/story
- verified/source notes

Then choose:
- Campaign Pack
- Deep Video
- Blog
- Social Pack

The source notes are passed into the actual producer fields (`facts`/`story`) so the producer is grounded in what the user supplied.

## Toolbox

The 36 v1 tools remain reachable for edge cases. They are not the first screen anymore.
