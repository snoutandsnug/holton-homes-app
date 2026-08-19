# Technical Architecture

## Why additive instead of rewrite

The existing CRM has a large mature `app.js`. Replacing it to add AI/CMA/content would create unnecessary regression risk.

Studio v1 therefore adds:
- `holton-studio-engine.js` — pure-ish data/AI/compliance/CMA layer
- `holton-studio.js` — route/UI integration
- `holton-studio.css` — isolated styling

The installer modifies only `index.html` and `service-worker.js` references. It never rewrites `app.js`.

## Runtime order

1. cloud config / Supabase
2. existing `app.js`
3. existing `holton-ai.js`
4. `holton-studio-engine.js`
5. `holton-studio.js`

The existing router still owns normal routes. The Studio layer observes `#/studio/*`, then renders its own view after the existing unknown-route fallback. Contact/Content enhancements are injected after the existing page renders.

## Local state

Existing CRM:
- `holtonHomesOS_v13`

Studio:
- `holtonHomesStudio_v1`

CMA working draft:
- `holtonCmaDraft_v1`

v1 Studio-only state is local. Existing CRM cloud sync remains unchanged.

## Engine boundary

`window.HoltonStudioEngine` exposes:
- CRM/Studio readers
- relationship scoring/queue
- context builder + redaction
- compliance scan/preflight
- comp score/CMA calculator
- source/rule catalog
- AI tool catalog
- Ollama model discovery + chat generation
- draft/CMA asset persistence

## AI request flow

`Tool button → deterministic preflight → selected CRM context packet → sensitive-pattern redaction → system guardrails + tool instructions → Ollama /api/chat → local result → save optional draft.`

No AI result writes directly into CRM fields or sends communications in v1.

## CMA request flow

`subject + comps → normalize numbers → deterministic match score → source/recency weights → explicit adjustments → range/confidence → render → optional AI explanation.`

AI does not own the price calculation.

## Future adapter interfaces

Keep these abstractions separate:
- `AIProvider` — Ollama/cloud
- `PropertyDataAdapter` — county/MLS/manual
- `Geocoder` — address → coordinates/distance
- `MediaProcessor` — transcript/FFmpeg
- `Publisher` — blog/social/email later
- `ComplianceKnowledgeProvider` — versioned source documents

This lets the product evolve without tying the entire CRM to one vendor.
