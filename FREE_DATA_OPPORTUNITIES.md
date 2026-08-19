# Free / Low-Cost Data Opportunities

Use these to expand the OS without making paid data vendors the first dependency. Always re-check licenses/terms before automating redistribution or commercial use.

## Property / CMA research

### County auditor data — strongest free v1 foundation
- Brown County: public property downloads + detailed sales search
- Clermont County: current/prior sales spreadsheets
- Hamilton County: property-sales CSV/daily sales + file definitions

Use for parcel/property facts and recorded sales. Preserve source/date and verify condition/current listing status separately.

### CincyMLS — future primary after authorization
CincyMLS publishes formal data-feed agreements, Bridge instructions and IDX rules. Once access is authorized, this becomes the primary market/listing/status layer while county records remain useful verification/provenance.

## Market-content data

### Zillow Research metrics
Zillow Group publishes downloadable regional market metrics intended for public use with attribution. This is a much better future use of Zillow data than scraping individual property pages.

Potential Studio use:
- local trend research packet
- inventory/price/rent charts where the selected dataset supports the geography
- Market Update Producer inputs

### Freddie Mac PMMS
Freddie Mac publishes current/historical weekly mortgage-rate survey data and downloadable history. Use as a national benchmark, clearly dated and attributed—not as a quote for an individual borrower.

### FRED
The St. Louis Fed provides an API for economic series. Current API access requires an API key. Useful for macro context such as rates, labor, inflation and housing series where relevant.

### U.S. Census Data API
The Census Bureau offers API access and free API keys. This can support objective population/housing/economic context, but demographic data must **never** become a protected-class steering or neighborhood-ranking engine.

## Portal rule

Do not build a CMA around unauthorized page scraping. Redfin's current terms explicitly prohibit automated crawling/scraping without written permission. Zillow data/API access is product-specific and permission/terms constrained. Use approved data products, public metrics, authorized APIs/feeds, or manual references instead.

## Product consequence

Future `ResearchDesk` should produce a source packet:

`source → retrieved date → geography → period → raw fact → unit → attribution → caveat`

AI then explains that packet; it never invents the metric.
