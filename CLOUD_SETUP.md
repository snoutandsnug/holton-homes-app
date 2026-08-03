# Holton Homes CRM Cloud — Setup

## 1. Protect the current desktop data first

Open the current CRM on the computer that has the correct contacts:

1. Settings
2. Export JSON
3. Save the backup somewhere safe

## 2. Create the cloud table

In Supabase:

1. Open the project.
2. Click **SQL Editor**.
3. Click **New query**.
4. Open `SUPABASE_SETUP.sql` from this package.
5. Copy the entire file into the editor.
6. Click **Run**.

The SQL creates one private CRM row per authenticated user and enables Row Level Security.

## 3. Configure authentication URLs

In Supabase:

1. Open **Authentication → URL Configuration**.
2. Set **Site URL** to:

   `https://snoutandsnug.github.io/holton-homes-app/`

3. Add the same URL under **Redirect URLs**.

## 4. Deploy the v20 files

Upload everything in this folder to the root of:

`snoutandsnug/holton-homes-app`

Replace the older files. Keep these new files:

- `cloud-config.js`
- `SUPABASE_SETUP.sql`
- `CLOUD_SETUP.md`

The publishable browser key in `cloud-config.js` is intentionally public-safe. Never add a secret key or service-role key.

## 5. First login order matters

Use the computer containing the correct contacts first:

1. Open the deployed CRM.
2. Select **Create CRM login**.
3. Confirm the email if Supabase asks.
4. Return and sign in.
5. The existing computer contacts will upload to the cloud.

Then open the CRM on the phone and sign in with the same email and password. The phone should download the same contacts.

## 6. Conflict screen

When both the device and cloud already contain data, choose **Merge both**. The CRM preserves unique records and prefers the newer version when IDs match.

## What syncs

- Contacts
- Spouses and household members
- Properties
- Tasks
- Communication notes and call/text outcomes
- Pipelines
- Tags
- Action plans
- Automation rules and queue
- Settings and goals

## Cost

This build uses one small JSONB row per CRM user and is designed to fit comfortably within Supabase's free plan for a solo agent.
