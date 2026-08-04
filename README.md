# Holton Homes Relationship CRM v26

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


## v26 contact workspace
- Communication timeline is the primary workspace.
- Prominent next-action strip with complete/log and reschedule controls.
- Inline stage, heat, source, and timeframe editing.
- Compact lead score explanation and coaching.
- Seller, buyer, and sphere-specific information.
- Inline note/call/text/email/appointment composer.
- Collapsible right sidebar and actionable empty states.


## v26 — built for Holton Homes
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


## v26
- Fixed the global top-bar Add Person button with a dedicated direct event listener.
- Added Realtor and Lender relationship types.
- Added company, role, license/NMLS, service area, specialties, and referral-note fields.
- Added clickable tag bubbles throughout the People and Contact views.
- Added quick tag suggestions, inline tag removal, and tag filtering.
- Added Add Realtor and Add Lender shortcuts to the Holton Homes daily dashboard.


## v26
- Every visible contact name is now the direct profile link.
- Initials/avatar icons are decorative and no longer act as navigation controls.
- Name links are consistent across People, Today, Inbox, Pipeline, Tasks, Activity, and search.
- Added stronger hover and keyboard-focus styling so it is obvious that the real name is clickable.


## v26 — Holton Automation Studio

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


## v26 — Household and spouse relationships
- Dedicated Household & Decision Makers section on every contact profile.
- Add spouse, partner, co-owner, parent, adult child, sibling, or another household member.
- Store phone, email, anniversary, birthday, decision-maker status, and household notes.
- Call, text, or email a spouse directly while keeping the activity in the primary household timeline.
- Promote a household member into their own full CRM contact when they need independent tasks, automations, and communication history.
- Link promoted household members back to the original record.
- Contact summaries now mention spouses and decision makers.


## v26 — Realtor Daily OS and structured property records

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


## v26 — Holton Homes, not a CRM demo

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


## v26 — Mobile working build

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


## v26 — Cloud sync foundation

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


## v26 — Daily Operating CRM

### Work Today
- One priority queue combines replies, untouched leads, due tasks, follow-ups, appointments, transaction deadlines, active-listing updates, stale hot leads, and missing next steps.
- Queue items explain why they are present.
- Call, text, log, complete, or snooze without losing context.
- Snoozes and completed-work history sync through Supabase.

### Smart Lists
- Organized into Database, Work Now, Seller Growth, Buyer Growth, Relationships, and Protect the Database.
- Each list has live criteria and a visible reason on every contact.
- Added seller valuations, seller updates, future sellers, buyer stale, past-client, partner, duplicate, and deadline lists.

### Call Queue
- Remembers the current contact across refreshes and synced devices.
- Previous, skip, call, text, note, and profile actions.
- Returning from a call records the outcome, completes the related call task, and advances to the next person.

### Free productivity and safety
- Reusable personalized text and email templates.
- Custom template editor.
- Duplicate detection by phone or email.
- Safe duplicate merge.
- Recently Deleted with restore.
- Expanded seller pipeline stages.
- Stage changes automatically create useful valuation, listing-prep, launch, offer, and transaction tasks.

No paid phone provider is required for these features. Native phone, SMS, and email apps still perform the communication.


## v26 — Universal Conversation Mode

Conversation Mode has the same capabilities on desktop, iPad, and phone. Only the responsive layout changes.

### Universal Show Script
- Script button appears with contact actions, on Work Today, in the Call Queue, and on contact next actions.
- Keyboard shortcut `S` opens Conversation Mode from a contact profile or active call queue.
- Context-aware script recommendation based on contact type and seller stage.

### Call preparation
- Reason for the call.
- Property, motivation, timing, decision-maker, financing, payment, and area details when available.
- Most recent logged conversation.
- A visible goal for the call.

### During the conversation
- Natural opening.
- Tap-to-complete discovery questions.
- Close / next-step ask.
- Voicemail script.
- Prefilled text after voicemail.
- Objection buttons with concise responses.
- Live notes.
- Notes draft, selected script, outcome, and dates sync through the existing Supabase cloud state.

### Outcome workflow
- Connected, voicemail, no answer, appointment set, follow-up needed, or not interested.
- Required appointment date when an appointment is set.
- Automatic appointment task and seller/buyer stage update.
- Automatic callback task when follow-up is required.
- Call Queue advances after saving.
- Timeline logs which script was used.

### Editable library
- Nine starter scripts:
  - New seller
  - Home valuation
  - Future seller
  - Listing appointment
  - Active listing update
  - Buyer discovery
  - Past client
  - Referral partner
  - General relationship
- Edit every section and objection in Settings.
- Add custom scripts.
- Restore the starter library at any time.

No new Supabase SQL is required for v26.


## v26 — Contact and Mailing Addresses

The CRM now treats a person's contact address and a real-estate property address as separate records.

### Contact address
- Home, mailing, work, or other address type.
- Street, unit, city, state, ZIP, and county.
- Available when creating or editing every contact type.
- Optional sync to the contact's primary property address.
- Existing sellers and past clients with a structured primary property are migrated automatically.

### Address visibility
- Contact profile header.
- Dedicated contact-address panel.
- Desktop contact table.
- Mobile contact cards.
- Global search and contact search.
- Conversation Mode preparation.
- CSV exports.
- Data-health reporting.

### Address tools
- Open in Google Maps.
- Copy the complete address.
- Use a primary property to fill the contact address.
- Missing Contact Address Smart List.
- Fix Records address fields.
- Address completeness added to lead intake.

Property addresses remain in Properties & Opportunities and are not overwritten by a mailing address.

No new Supabase SQL is required for v26.


## v26 — Buyer and Seller Transaction Center

Under Contract is now a full operational workflow instead of one pipeline stage.

### Transaction setup
- Buyer or seller representation side.
- Property under contract and linked property record.
- Purchase price, projected GCI, referral fee, and brokerage split.
- Contract, closing, possession, earnest money, inspection, financing, appraisal, title, repair, walkthrough, and Closing Disclosure dates.
- Lender, title, inspector, and cooperating-agent contacts.
- Internal transaction notes.

### Separate step-by-step workflows
Buyer and seller transactions receive different six-phase checklists:

1. Contract & Handoff
2. Inspection & Due Diligence
3. Financing & Appraisal
4. Title & Closing Prep
5. Final Walkthrough & Closing
6. Post-Closing

The checklists include more than twenty-five operational steps per side and preserve custom due dates, notes, owners, and completion status.

### Daily execution
- Transaction deadlines feed Work Today.
- Transaction deadlines receive first priority when overdue or marked Problem.
- Transaction Center navigation badge.
- At Risk, Problem, Setup Needed, On Track, Clear to Close, Closed, and Terminated health states.
- Closing countdown and checklist progress.
- Critical-date dashboard.
- Next-step display.

### Client communication
- Plain-language buyer or seller transaction update.
- Copy update or launch a prefilled text.
- Wire-fraud reminder.
- Transaction team phone and email links.

### Contact and pipeline integration
- Transaction panel on each buyer and seller contact.
- Pipeline cards show closing date, progress, and health.
- Moving a contact to Under Contract creates a transaction draft.
- Closing or terminating a transaction updates the contact and property.
- Transactions follow duplicate merge, contact deletion, restore, JSON backup, and Supabase cloud sync.

No new Supabase SQL is required. Deadlines must be entered from the actual signed contract and written amendments.


## v26 — Verified Transaction Flow

This version was audited against Ohio REALTORS consumer transaction guidance, CFPB closing guidance, and Ohio transaction-record requirements.

### Important correction
Contract deadlines and operational targets are now visibly different:

- Contract Deadline: entered from the signed purchase contract or amendment.
- Confirmed / Regulatory: a confirmed lender, title, or regulatory milestone.
- Suggested Target: an editable workflow goal that is not a contractual deadline.
- Custom Date: manually selected by the agent.
- Milestone: a step without a fixed date.

Only overdue contract, confirmed/regulatory, and custom dates trigger the red At Risk state. Overdue suggested targets create Needs Attention.

### Easy next-step control
- Pin any checklist item as the next step.
- Change Next from the transaction header.
- Complete the current step and advance automatically.
- Move the current next step to tomorrow.
- Clear the pin and return to automatic prioritization.
- Add a custom next step.
- Assign owner, date meaning, note, and related website to any step.

### Conditional workflows
The checklist changes according to:
- cash or financed purchase
- inspection / due diligence
- appraisal
- repair agreement
- HOA / condominium
- well and septic
- buyer home-sale contingency
- post-closing occupancy
- home warranty

### Flow audit
The CRM flags:
- missing contract, closing, possession, earnest, inspection, financing, title, walkthrough, or Closing Disclosure dates
- impossible or suspicious date sequences
- missing lender or title contacts
- financed transactions without lender milestones
- occupancy transactions without possession dates

### Sites and portals
Global defaults and per-transaction overrides are available for:
- brokerage compliance
- forms and e-signature
- MLS
- showing / lockbox
- lender
- title / escrow
- inspection reports
- county auditor
- county recorder
- HOA / condominium
- utilities

Official Ohio REALTORS, CFPB, and Ohio law reference guides are included in the resource hub.

### Reload safety
Database initialization now occurs after transaction templates are available. Stored transactions can be normalized safely on refresh and legacy-version migration.

No new Supabase SQL is required.


## v26 — Maps, Calendar, and Mail Choices

### Maps
- Apple Maps is the default.
- Google Maps and Ask Every Time remain available.
- Map and Directions buttons use the selected provider throughout contacts, properties, tasks, and transactions.

### Calendar
- Apple Calendar / standard `.ics` event files.
- Google Calendar prefilled event handoff.
- Ask Every Time option.
- Calendar buttons on tasks, property appointments, transaction critical dates, transaction steps, and closing.
- Event title, date, time, duration, address, client, and relevant details are prefilled.
- Configurable default event time, duration, reminder, and time zone.

### Mail
- Default Mail App uses the device's configured mail client.
- Gmail opens a prefilled Gmail compose window.
- Ask Every Time option.
- Existing contact email actions and transaction-team email actions follow the selected preference.
- Transaction client updates can be emailed directly.

### Task improvements
- Start time, duration, location, and details.
- Add to calendar immediately after saving.
- Edit task and open directions from the task list.

These are secure app handoffs and require no API key. The CRM does not read Gmail or Google Calendar data. Full two-way Google sync requires Google OAuth and a secure backend connection.

No new Supabase SQL is required.


# Holton Homes Agent OS

This release consolidates the daily-use features into one product rather than artificially spacing them across incremental versions.

## Daily Agent Home
- One dominant next action.
- Daily production score and finish line.
- Seller Opportunity Radar.
- Today’s appointments.
- Work Today priorities without the old duplicate sections.
- Business pulse, relationship moments, and fast workspaces.

## Prospecting Sprint
- Seller, follow-up, new-lead, buyer, sphere, past-client, and open-house queues.
- One contact at a time.
- Timer, attempts, conversations, appointments, and remaining count.
- Call, text, script, profile, relationship memory, voice update, and quick outcomes.
- Outcome logging and automatic next follow-up.

## Quick Capture
- Ten-second lead entry.
- Full contact intake.
- Voice / field update.
- Task or appointment.
- Communication note.
- Transaction.
- Open house.
- Market insight.

## Relationship Memory
- Preferred name and communication method.
- Occupation, birthday, and home anniversary.
- Family, pets, interests, communication style, what to ask about, and what was promised.
- Shown on contact profiles, scripts, seller radar, and focused call preparation.

## Field Mode
- Next appointment.
- Directions through the selected Apple or Google Maps preference.
- Call, text, script, calendar, and field update.
- Seven-day route view.

## Open House Mode
- Event setup.
- iPad visitor sign-in.
- Buyer timeline, representation, lender status, homeowner, and possible-seller capture.
- Automatic CRM contact creation.
- Visitor follow-up sprint.

## Market Study
- Daily local-market practice.
- Actives, reductions, pendings, sales, days on market, list-to-sale relationship, payment example, listing links, and one useful observation.
- Daily production target integration.

## Cleaner Product
- Five primary navigation choices: Home, People, Pipeline, Transactions, and More.
- Stronger visual meaning for sellers, buyers, transactions, relationships, urgency, waiting, and completion.
- Persistent Quick Capture button.

No new Supabase SQL is required. New datasets continue to sync inside the existing protected JSON state.
