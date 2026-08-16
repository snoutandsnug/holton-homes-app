HOLTON HOMES OS v14.2 — FUB SHELL + TRANSPARENT LOGO

Use THIS package instead of the earlier FUB header / hotfix packages.

Stay on:
v14-ai-rebuild

Replace ONLY:
- index.html
- 404.html
- v14.css

Do not merge main yet.

Key change:
This restores the repo's proven pre-v13 FUB-style shell DOM instead of trying to
bend the v13 sidebar into a top bar.

Logo:
- uses the approved existing SVG
- transparent background
- no cream/white card
- no shadow
- no rounded box
- no fake backing rectangle
- compact 116px desktop width

Desktop:
- one 64px white top bar
- logo + horizontal nav + search + Pip + health + bell + New
- workspace immediately below
- lower priority nav collapses before wrapping

Mobile:
- compact top utility bar
- five-item bottom nav: Today / Inbox / People / Pipeline / More

Keep all other v14 files already on the branch:
- v14-agent.js
- api/pip.js
- package.json
- vercel.json
- service-worker.js
