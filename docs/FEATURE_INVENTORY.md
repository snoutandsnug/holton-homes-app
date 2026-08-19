# Feature Inventory — What Exists vs What Comes Next

Legend:
- **WORKING BASELINE** = implemented in this ZIP
- **SCAFFOLD / HUMAN INPUT** = works with manual data, designed for later automation
- **FUTURE INTEGRATION** = deliberately not faked

## Relationship / lead management
- WORKING BASELINE — deterministic relationship score + reasons
- WORKING BASELINE — next-best-action
- WORKING BASELINE — priority queue
- WORKING BASELINE — pipeline health counters
- WORKING BASELINE — contact-level AI Brief
- WORKING BASELINE — Call Prep
- WORKING BASELINE — Follow-Up Writer
- WORKING BASELINE — 90-Day Relationship Plan
- WORKING BASELINE — Referral Ask
- WORKING BASELINE — Cold Lead Revival
- FUTURE — call transcript ingestion
- FUTURE — AI field extraction from calls/messages with approval
- FUTURE — lead-source ROI dashboard from appointment/closing outcomes

## Seller
- WORKING BASELINE — Seller Lead Plan
- WORKING BASELINE — Listing Appointment Prep
- WORKING BASELINE — fact-grounded Listing Description
- WORKING BASELINE — Seller Update
- WORKING BASELINE — Price Adjustment Prep
- WORKING BASELINE — Open House Plan
- WORKING BASELINE — Listing Launch Pack
- SCAFFOLD — Public CMA
- FUTURE — MLS CMA adapter
- FUTURE — branded client CMA PDF
- FUTURE — seller net-sheet calculator with brokerage/title inputs
- FUTURE — listing photo/staging module with approved image model/provider
- FUTURE — seller report/dashboard link

## Buyer
- WORKING BASELINE — Buyer Consultation Prep
- WORKING BASELINE — Property Comparison
- WORKING BASELINE — Showing Follow-Up
- WORKING BASELINE — Offer Conversation Prep (not contract language)
- WORKING BASELINE — Inspection Conversation Prep
- FUTURE — authorized listing/MLS saved-search data
- FUTURE — tour itinerary / map helper
- FUTURE — lender/payment comparison integration
- FUTURE — agency-status workflow gates

## CMA
- WORKING BASELINE — subject form
- WORKING BASELINE — manual comp entry
- WORKING BASELINE — generic CSV comp import
- WORKING BASELINE — source quality
- WORKING BASELINE — comp similarity score
- WORKING BASELINE — include/exclude
- WORKING BASELINE — manual adjustment field
- WORKING BASELINE — weighted pricing center/range
- WORKING BASELINE — confidence score + caveats
- WORKING BASELINE — save CMA locally
- WORKING BASELINE — AI CMA narrative using calculated result
- SCAFFOLD — Brown/Clermont/Hamilton public-record research links/data import path
- FUTURE — county-specific automatic normalization/import
- FUTURE — authorized CincyMLS candidate comp search
- FUTURE — map visualization
- FUTURE — PDF presentation

## Content / marketing
- WORKING BASELINE — Video Producer
- WORKING BASELINE — Clip Finder from timestamped transcript
- WORKING BASELINE — Blog Producer
- WORKING BASELINE — Local Story Campaign
- WORKING BASELINE — Market Update Producer
- WORKING BASELINE — Social Campaign
- WORKING BASELINE — Local Newsletter
- WORKING BASELINE — Producer dock inside existing Content section
- FUTURE — automatic research packet ingestion
- FUTURE — local Whisper transcript helper
- WORKING OPTIONAL HELPER — local FFmpeg clip cutter GUI (`tools/HoltonClipCutter.pyw`); requires FFmpeg and a Studio/timestamp clip plan
- FUTURE — Canva/design export/templates
- FUTURE — scheduled publishing integrations
- FUTURE — campaign landing pages/QR tracking

## Compliance
- WORKING BASELINE — pre-license/training mode
- WORKING BASELINE — Ohio source-locked rule summaries
- WORKING BASELINE — deterministic fair-housing phrase risk scan
- WORKING BASELINE — advertising-risk scan
- WORKING BASELINE — Agency Gate
- WORKING BASELINE — Broker Review Packet
- WORKING BASELINE — REALTOR® claim gate based on profile
- WORKING BASELINE — brokerage identity warning after license mode enabled
- FUTURE — brokerage-specific policy library
- FUTURE — CincyMLS rules/forms integration after authorization
- FUTURE — versioned source refresh service

## AI provider
- WORKING BASELINE — Ollama local endpoint
- WORKING BASELINE — model discovery
- WORKING BASELINE — provider offline gracefully; CRM still works
- WORKING BASELINE — `keep_alive: 0` option to unload after response
- WORKING BASELINE — privacy context packet + redaction
- FUTURE — optional cloud fallback/provider
- FUTURE — model routing by task
- FUTURE — server-side provider secrets

## Studio platform
- WORKING BASELINE — additive Studio nav route
- WORKING BASELINE — Overview/Relationships/Sellers/Buyers/CMA/Content/Compliance/Library/Settings
- WORKING BASELINE — native Holton v14 styling
- WORKING BASELINE — mobile-responsive Studio
- WORKING BASELINE — local draft library/export
- FUTURE — Studio cloud sync
- FUTURE — shared/team workspace
- FUTURE — role-based permissions
- FUTURE — admin/broker dashboard
