# Holton Homes Relationship CRM v12

A static, mobile-responsive CRM built around the strongest workflow ideas from Follow Up Boss, kvCORE, and Lofty.

## Major changes
- Pip is a compact business coach, not a separate room or game.
- Separate first and last name fields.
- One-click call, text, and email launchers with activity logging.
- Unified inbox with unread/open/closed conversation states.
- FUB-style Smart Lists and dense People view.
- Full contact profile with relationship summary, timeline, tasks, behaviors, alerts, and automations.
- Lofty-style call queue with outcomes and automatic callbacks.
- kvCORE/Lofty-inspired lead scoring and behavior alerts.
- Drag-and-drop seller and buyer pipelines.
- Action plans that pause when an inbound reply is logged.
- Browser backup export/import and CSV export.

## Upload to GitHub
Upload every file and folder in this package to the root of the `holton-homes-app` repository, replacing older files.

For GitHub Pages, use either:
- Settings → Pages → Source: GitHub Actions, or
- Deploy from branch `main` and `/root`.

## Important limitation
This is still a static browser application:
- GitHub hosts the app code.
- Contact data is stored in the current browser's localStorage.
- Call/text/email buttons launch the device's native apps and then log activity.
- Live in-app communication, MLS property alerts, authentication, and cross-device sync require a secure backend and provider integrations.


## v12 contact workspace
- Communication timeline is the primary workspace.
- Prominent next-action strip with complete/log and reschedule controls.
- Inline stage, heat, source, and timeframe editing.
- Compact lead score explanation and coaching.
- Seller, buyer, and sphere-specific information.
- Inline note/call/text/email/appointment composer.
- Collapsible right sidebar and actionable empty states.


## v12 — built for Holton Homes
- Readable typography and larger controls across the entire CRM.
- Seller-first daily scoreboard tied to Jacob's $100,000 GCI target.
- Seller share, daily conversation, and market-area goals.
- Quick Add Seller, Buyer, and Sphere buttons.
- Weekly backup warning and top-bar backup button.
- Second browser-database recovery mirror using IndexedDB.
- Persistent storage request in Settings.
- Safer deletion confirmation.

## Data safety
Clearing ordinary cached images/files normally does not erase CRM data. Clearing cookies/site data or all storage for the site can erase browser data. Keep downloaded JSON backups. A secure cloud database remains the next major upgrade.
