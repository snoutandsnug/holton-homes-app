# Holton Homes Relationship CRM v15

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


## v15 contact workspace
- Communication timeline is the primary workspace.
- Prominent next-action strip with complete/log and reschedule controls.
- Inline stage, heat, source, and timeframe editing.
- Compact lead score explanation and coaching.
- Seller, buyer, and sphere-specific information.
- Inline note/call/text/email/appointment composer.
- Collapsible right sidebar and actionable empty states.


## v15 — built for Holton Homes
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


## v15
- Fixed the global top-bar Add Person button with a dedicated direct event listener.
- Added Realtor and Lender relationship types.
- Added company, role, license/NMLS, service area, specialties, and referral-note fields.
- Added clickable tag bubbles throughout the People and Contact views.
- Added quick tag suggestions, inline tag removal, and tag filtering.
- Added Add Realtor and Add Lender shortcuts to the Holton Homes daily dashboard.


## v15
- Every visible contact name is now the direct profile link.
- Initials/avatar icons are decorative and no longer act as navigation controls.
- Name links are consistent across People, Today, Inbox, Pipeline, Tasks, Activity, and search.
- Added stronger hover and keyboard-focus styling so it is obvious that the real name is clickable.


## v15 — Holton Automation Studio

### Automation engine
- Deterministic rule engine with active/disabled controls.
- Contact-created, stage, behavior, stale, follow-up, inbound-reply, task-completed, manual, and always triggers.
- Contact type, stage, heat, source, tag, no-contact-days, score, and behavior conditions.
- Preview matching contacts before a rule runs.
- Run once, when data changes, daily, or monthly.
- Complete audit logs that explain each action and failure.
- Rules evaluate when the app opens and whenever CRM data changes.

### Action plans
- Rich seller, buyer, listing, active-listing, transaction, past-client, and referral-partner plans.
- Custom plan builder using readable step lines.
- Goal-aware plans stop after actual conversion stages.
- Reply-aware plans pause after inbound or real conversations.
- Due steps are created only when needed rather than dumping every task at once.
- Transaction milestones are included inside the CRM.

### Human approval queue
- Text and email plan steps never send blindly.
- Personalized batch queues support merge fields.
- Review, edit, launch, mark sent, or skip each message.
- Marking sent logs the communication and completes its review task.

### Static-app limitation
Scheduled rules and plan steps process when the CRM is open, reopened, or its data changes. True server-side execution while every device is offline requires the future secure cloud backend.
