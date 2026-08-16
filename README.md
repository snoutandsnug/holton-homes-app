# Holton Homes OS v13

Holton Homes OS is a relationship-first real estate command center for daily production, lead protection, people, opportunities, transactions, content, and trusted local referrals.

## What is in this release

- A calmer desktop shell and five-item mobile navigation using the approved Holton Homes identity.
- A Today command center built around three wins: protect the lead, advance the opportunity, and create demand.
- Universal Lead Inbox with response timers, duplicate warnings, conversion paths, and consent/attribution capture.
- People, buyer/seller opportunities, transaction workflow, tasks, calendar, open-house intake, and automation tools.
- A seven-stage content newsroom with views, inquiry, appointment, and closed-GCI attribution.
- A verified Local Network for trusted providers and referral tracking.
- Commission waterfall reporting from gross GCI to estimated household take-home.
- Reliability Center, cloud-sync status, local recovery snapshots, and manual JSON backups.
- Vercel-ready static configuration with no build step.

## Vercel settings

- Framework Preset: `Other`
- Root Directory: `./`
- Build Command: leave empty
- Output Directory: leave empty
- Install Command: leave empty

Vercel will deploy the static files directly. The app uses hash routes, so refreshing any workspace remains safe.

## Data safety

The app keeps a local recovery copy and can sync one workspace document through the configured Supabase project. Keep Row Level Security enabled using `SUPABASE_SETUP.sql`, use a unique password, and download JSON backups regularly. Supabase publishable keys are intended for client applications; protection depends on authentication and correct RLS policies.

## Provider boundaries

Call, text, email, maps, and published links hand off to the device or provider. A live two-way communications inbox, MLS alerts, brokerage compliance workflows, and server-side background automation require their respective provider integrations.
