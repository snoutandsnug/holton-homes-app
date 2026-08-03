# Holton Homes Relationship CRM v20

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


## v20 contact workspace
- Communication timeline is the primary workspace.
- Prominent next-action strip with complete/log and reschedule controls.
- Inline stage, heat, source, and timeframe editing.
- Compact lead score explanation and coaching.
- Seller, buyer, and sphere-specific information.
- Inline note/call/text/email/appointment composer.
- Collapsible right sidebar and actionable empty states.


## v20 — built for Holton Homes
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


## v20
- Fixed the global top-bar Add Person button with a dedicated direct event listener.
- Added Realtor and Lender relationship types.
- Added company, role, license/NMLS, service area, specialties, and referral-note fields.
- Added clickable tag bubbles throughout the People and Contact views.
- Added quick tag suggestions, inline tag removal, and tag filtering.
- Added Add Realtor and Add Lender shortcuts to the Holton Homes daily dashboard.


## v20
- Every visible contact name is now the direct profile link.
- Initials/avatar icons are decorative and no longer act as navigation controls.
- Name links are consistent across People, Today, Inbox, Pipeline, Tasks, Activity, and search.
- Added stronger hover and keyboard-focus styling so it is obvious that the real name is clickable.


## v20 — Holton Automation Studio

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


## v20 — Household and spouse relationships
- Dedicated Household & Decision Makers section on every contact profile.
- Add spouse, partner, co-owner, parent, adult child, sibling, or another household member.
- Store phone, email, anniversary, birthday, decision-maker status, and household notes.
- Call, text, or email a spouse directly while keeping the activity in the primary household timeline.
- Promote a household member into their own full CRM contact when they need independent tasks, automations, and communication history.
- Link promoted household members back to the original record.
- Contact summaries now mention spouses and decision makers.


## v20 — Realtor Daily OS and structured property records

### Daily lead command center
- New and untouched leads
- Follow-ups due now
- Appointments in the next seven days
- Transaction deadlines in the next seven days
- Direct call, text, profile, and task actions

### Property and opportunity records
- Multiple properties per contact
- Primary property designation
- Full street, unit, city, state, ZIP, and county
- Property type, beds, baths, square feet, acreage, year built
- Occupancy and ownership
- Estimated value, mortgage balance, equity, list price, and expected sale price
- Motivation, condition, target date, appointment date, and notes
- Map access, editing, removal, and primary-property switching
- Seller intake creates or updates the primary property automatically

### Lead protection
- Lead intake completeness checklist
- Seller, buyer, sphere, and partner-specific completeness criteria
- Untouched Lead and Appointments This Week Smart Lists
- Property data included in search and CSV exports
- Listing appointments automatically create CRM appointment tasks

The spouse/household features and Automation Studio remain included.


## v20 — Holton Homes, not a CRM demo

- Removed "What a Realtor actually needs today" and similar explanatory copy.
- Renamed People to Leads & Contacts.
- Renamed Add Person to New Contact.
- Removed sample-data controls from the live interface.
- Removed the duplicate New Contact button from the Today page.
- Simplified Today into Next Up, This Week, Leads and Deadlines, and priority metrics.
- Rewrote empty states and section labels in plain agent language.
- Removed FUB/kvCORE/Lofty name-dropping from the interface.
- Reduced dashboard shadows, gradients, badges, and motivational filler.
- Kept households, properties, automations, pipelines, backups, and all v17 data.


## v20 — Mobile working build

### Phone usability
- Desktop sidebar becomes a fixed, horizontally scrollable bottom navigation.
- Desktop contact table becomes touch-friendly contact cards.
- Contact avatar, name, and identity area all open the contact profile.
- Buttons and form controls meet a larger phone touch target.
- Contact, inbox, modal, automation, and timeline layouts collapse into one-column phone views.
- Forms use 16px fields to avoid mobile browser zooming.
- Added standalone/mobile app metadata.

### Calling and texting bridge
- Call, Text, and Email buttons launch the phone's native apps directly.
- Returning to the CRM opens a result prompt.
- Outcome, notes, and next follow-up are recorded.
- No-answer and follow-up outcomes create the next task.
- Appointment-set outcomes update the pipeline stage.

### Fix Records
- Replaces the vague Needs Cleanup list.
- Shows exact reasons each record appears.
- Fix button opens only the missing fields.
- The contact disappears automatically when fixed.
- Cleanup can be snoozed for 30 days.
- Added Replies Needed, Stale Hot Leads, and Missing Next Step lists.

This remains a browser-based bridge. The native phone/SMS apps perform communication; true two-way in-app communication requires the cloud and phone-provider phase.


## v20 — Cloud sync foundation

- Supabase email/password authentication.
- One private cloud CRM state per authenticated user.
- Row Level Security setup SQL.
- Automatic local caching plus debounced cloud saving.
- Same contacts on phone and computer.
- Initial migration from the existing browser database.
- Conflict screen with cloud, device, or merge choices.
- Near-real-time updates while multiple devices are open.
- Focus and reconnect synchronization.
- Cloud status in the top bar and Settings.
- Local cache remains available for temporary offline work.
- Clear Device Cache no longer deletes cloud records.

Run `SUPABASE_SETUP.sql` before trying to sign in.
