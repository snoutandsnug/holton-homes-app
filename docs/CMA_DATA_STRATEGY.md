# Holton CMA — Data Strategy

## Goal

Build a defensible **research/CMA workflow**, not an automated appraisal. The software should make finding, comparing and explaining evidence faster while preserving human judgment.

## Data hierarchy

### Tier 1 — Authorized CincyMLS data (future primary)
CincyMLS currently publishes data-feed instructions, a Data Feed Agreement, Bridge management instructions and IDX rules. Once the user has the appropriate membership/authorization, add an MLS adapter and make it the highest-trust listing/status/detail source.

Source:
- https://www.cincymls.com/data-delivery-internet-data-exchange.html

Do not build against an unauthorized credential, shared login or scraped MLS interface.

### Tier 2 — County auditor/public records (available now)
Useful for parcel/property facts and recorded sales, subject to county disclaimers/lag.

**Brown County**
- Sales search: https://realestate.browncountyauditor.org/Search/Sales
- Data downloads: https://realestate.browncountyauditor.org/property-data-downloads
- Available search fields include sale amount/date, year built, living area, bedrooms, acres and valid sale.

**Clermont County**
- Recent sales: https://www.clermontauditor.org/real-estate/recent-sales/
- Downloads: https://www.clermontauditor.org/downloads/
- Current/prior sales spreadsheets are published.

**Hamilton County**
- Daily sales: https://www.hamiltoncountyauditor.org/hamilton/dailysales/dailysales.html
- Property sales/downloads: https://www.hamiltoncountyauditor.org/hamilton/textonly/transfer_downloads.asp
- Sales files include parcel/sale-date information and can be imported into spreadsheet/database software.

Public record data is not guaranteed to reflect current listing status, interior condition, concessions, renovations or every market nuance. Preserve source notes and verify material facts.

### Tier 3 — Manual portal cross-check
Zillow/Redfin can be useful for manual visual research: photos, history, presentation and cross-checking. They are not the automated data backbone.

Redfin current terms prohibit automated crawling/querying/scraping without express permission. Zillow API/data terms are also restrictive and product-specific.

Sources:
- https://www.redfin.com/about/terms-of-use
- https://www.zillowgroup.com/developers/terms/

Therefore v1 intentionally provides manual-source labels/URLs instead of a portal scraper.

## Normalized comp schema

Every comp should normalize to:
- address
- parcel ID if available
- status
- sale/list price
- sale/list date
- living area
- acres
- beds
- baths
- year built
- property type
- distance from subject (when known)
- source type
- source URL/note
- condition/verification notes
- explicit manual adjustment
- included/excluded state

Future MLS fields can add DOM/CDOM, concessions where permitted/available, remarks, garage, basement, lot/land details, style, school district (objective), taxes, list-to-sale ratio and status history.

## v1 comp scoring

The current local match score weighs available dimensions roughly around:
- living area
- acreage
- bed/bath count
- year built
- property type
- distance
- sale recency
- source quality

Missing fields are not automatically treated as a mismatch; they reduce the evidence available.

## v1 pricing math

1. Filter included candidates with a valid price.
2. Use **sold/closed sales only** for the indicated pricing center/range. Active/pending listings remain visible as positioning context but do not become closed-sale evidence.
3. If there are no usable closed sales, do not fabricate an indicated center from asking prices.
4. Apply only explicit/manual adjustments entered by the user.
5. Compute each comp's match score.
6. Weight adjusted closed-sale prices by match score, source quality and recency.
7. Blend weighted mean and median for an indicated center.
8. Use the closed-sale price distribution to create a range.
9. Calculate confidence from sample size, match quality and source quality.
10. Show caveats.

This is not a licensed appraisal and should never be represented as one.

## What to add when MLS arrives

1. Data-use authorization / agreement review.
2. MLS adapter interface.
3. Property lookup by address/parcel.
4. Subject-property detail merge.
5. Candidate-comp search with geography/property filters.
6. Active/pending/sold separation.
7. Exclusion reasons visible to user.
8. Manual include/exclude stays mandatory.
9. Saved comp set retains IDs/source snapshot/date.
10. Branded client report/PDF.
11. Seller net sheet with user/brokerage/title assumptions—not “standard commission.”

## What not to automate

- Do not let an LLM silently choose a final value.
- Do not let AI manufacture adjustments.
- Do not hide low confidence.
- Do not claim public-record values equal market value.
- Do not treat portal estimates as comps.
- Do not scrape prohibited sources just because it is technically possible.
