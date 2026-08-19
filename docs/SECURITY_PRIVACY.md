# Security + Client Privacy Design

## Principle

A useful relationship AI does **not** need unrestricted access to the CRM. Holton Studio uses a context firewall.

## Context firewall

When a contact-level tool runs, Studio creates a narrow packet containing only relevant fields such as:
- name
- relationship type/stage/heat/timeframe/source
- relevant notes
- recent communications (limited count)
- open tasks (limited count)
- related property facts
- related opportunity/transaction context when present

It does not intentionally send the entire CRM.

## Redaction before model call

The v1 engine removes common patterns/labels for highly sensitive data including:
- Social Security numbers
- bank/routing/account numbers when labeled
- wire information when labeled
- passwords/passcodes/PINs
- passport/driver-license labels

Do not store those categories in ordinary free-text CRM notes in the first place. Pattern redaction is defense-in-depth, not a substitute for proper data handling.

## Ollama privacy model

When Ollama is used at `127.0.0.1`, the generation request is sent to the local model service on that PC. The CRM database still exists in Supabase; only the selected context packet is sent to the local model for that action.

Do not expose Ollama's port to the public internet.

## Supabase

The existing CRM stores its cloud state under the authenticated user's row and uses Row Level Security. Keep these rules:
- RLS enabled on every exposed table
- ownership predicate based on authenticated user ID
- never expose service-role/secret keys in browser code
- use publishable client key only with RLS
- future shared/team CRM requires explicit tenant/team ownership design, not simply `TO authenticated`

## AI drafts

v1 Studio assets/CMAs live in browser localStorage. This means:
- they are not automatically synced across devices in v1
- they should not be treated as the transaction's official document record
- export backup is available

The default **Studio backup export does not include the CRM database**; it exports Studio state only. CRM backup should remain a separate, explicit action.

Future cloud Studio state should use a separate authenticated/RLS-protected table or structured entities with audit history.

## Before selling the software

Commercial/multi-user release requires additional work:
- multi-tenant authorization model
- per-user/team RLS policies
- encrypted secrets/server-side integrations
- audit/event logs
- data retention/deletion policy
- consent/privacy policy
- vendor/subprocessor review
- incident response/backups
- broker/admin roles
- rate limiting
- security testing
- production-appropriate hosting plan
