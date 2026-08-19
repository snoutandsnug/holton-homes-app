# Video + Content Producer Workflow

## Business purpose

Content is not a vanity feature. It should create familiarity, local trust, conversations and trackable lead sources.

## Video Producer v1

Input:
- topic/idea
- audience
- goal
- verified facts/source notes
- desired format/length
- optional CTA/business purpose

Output target:
1. thesis / viewer promise
2. 3–5 title options
3. hook variants
4. full script or detailed beat sheet
5. A-roll plan
6. B-roll/visual evidence plan
7. on-screen text
8. fact/source callouts
9. CTA
10. thumbnail concept
11. shorts/reels extraction plan
12. blog/newsletter/social derivatives
13. what to measure in CRM

The producer is explicitly told not to invent local news, market data, listing facts, prices or quotes.

## Clip Finder v1

Input a **timestamped transcript**. It returns actual start/end timestamps, hook, rationale, caption and edit notes. If timestamps are absent it must ask for transcription/timestamps instead of making them up.

This is the safe first step toward the prior “scrape my video for clips” workflow.

## Actual cutting/rendering

v1 browser Studio does not render or cut the video file itself. That belongs in an optional desktop media helper because:
- large local video files should not be uploaded unnecessarily
- browser transcoding can be slow/fragile
- FFmpeg is deterministic and free
- a local helper can run with hidden child processes so it does not spawn a command window for every clip

Included optional helper flow:
`video file → timestamped transcript/Studio clip plan → tools/HoltonClipCutter.pyw → FFmpeg clip extraction → CapCut/DaVinci/other editor.`

`HoltonClipCutter.pyw` is included in this ZIP. It accepts `START,END,TITLE` rows and can run FFmpeg child processes without opening a new console window for every clip on Windows. FFmpeg still needs to be installed and available on PATH. Automatic local transcription is a future step.

Do not make this media helper a dependency of the CRM.

## Blog Producer v1

Input:
- verified source notes/links
- angle
- audience
- geography
- goal

Output:
- headline/deck
- article outline
- publishable draft based only on supplied facts
- source/verification checklist
- SEO title/meta description
- internal-link ideas
- FAQ candidates
- social post
- video outline
- newsletter derivative
- CTA tied to conversation, not constant selling

## Local Story Campaign

One verified Greater Cincinnati story can become:
- Facebook-group post
- personal Facebook/Instagram/LinkedIn post as appropriate
- 60-second video
- 5-minute explainer
- blog outline
- newsletter item
- conversation question
- non-forced real-estate/business angle

The product should keep broad local news broad. It should not force every restaurant/opening/road story into a real-estate pitch.

## Future content research desk

The research layer can be separate from generation:
1. collect source URLs/headlines
2. verify event date vs publication date
3. extract facts/source notes
4. human selects story
5. Studio producers create assets from the verified research packet
6. campaign/source ID saved to CRM
7. inbound lead attributed to campaign

That architecture keeps web research and client/private CRM context separate.
