# Running and reviewing the sample

## Credential-free fixture mode

Use Node.js 22+, npm and Deno 2. From this repository:

```sh
npm ci
npm run dev
```

Open `http://localhost:3000`. The default screen uses only invented records in
[lib/fixtures.ts](../lib/fixtures.ts). It makes no Supabase requests. Switch roles to preview the UI
restriction and download the original sample CSV. This role switch cannot grant access to a
database.

`npm run build` creates a static export in `out/`. GitHub Pages sets `GITHUB_PAGES=true` for the
repository's base path. The public demo has no configured Supabase URL, keys or accounts. The
optional connection tab requires your own separate local build and project configuration.

## Automated checks

```sh
npm run check
deno check supabase/functions/payroll-export/index.ts
npm run test:db
npm run build
npx playwright install chromium
npm run test:ui
```

- Payroll and HTTP tests run in Deno; their Auth/repository boundaries are injected test doubles.
  They do not prove a live hosted Supabase integration.
- Database checks start a disposable `postgres:17-alpine` Docker container with no published port,
  network, persistent volume or host mount. They apply the actual migration and run SQL under `anon`
  and `authenticated` roles. A small test bootstrap provides `auth.users` and `auth.uid()`; it does
  not emulate GoTrue, PostgREST or the hosted Edge runtime. The container is removed after the run.
- UI checks start a local Next development server on port 3127, verify navigation, permissions
  preview, download bytes and mobile overflow, then stop the server.
- The publication check scans Git's publishable file list for unexpected paths and common credential
  patterns. Manual source/provenance review is still required before publishing any future change.

The OpenAPI contract can also be syntax-checked with:

```sh
postman spec lint api/payroll-export.openapi.json --issueType syntax --no-report-events --output json
```

This uses a local spec, without publishing a Postman workspace or sending proprietary context. Local
artifacts are authoritative. The CLI available during preparation did not implement the skill's
`postman status` command; no workspace binding or account-dependent discovery was needed.

## Optional Supabase evaluation project

This section is a setup recipe for a **new, empty evaluation project**. It has not been executed
against a hosted Supabase project. Never apply this demonstration schema to an existing application
database.

1. Install a current Supabase CLI and Docker. In this repository run `supabase start`, then
   `supabase db reset`. The CLI applies the migration to its local evaluation stack. Alternatively,
   apply the migration through your own Git-based deployment process to a new evaluation project.
2. Create evaluation users through Supabase Auth/Studio. Use distinct payroll, technician and
   nonmember accounts if checking denials. Do not insert the test bootstrap or its stub `auth`
   schema into Supabase.
3. Provision the organization, memberships, employee and approved payroll row as a trusted
   administrator. Replace the user UUID placeholders below with the Auth user IDs from step 2.
   Browser accounts cannot provision themselves.

```sql
insert into public.organizations(id, name)
values ('20000000-0000-0000-0000-000000000001', 'Isolated evaluation');

insert into public.memberships(organization_id, user_id, role) values
('20000000-0000-0000-0000-000000000001', '<payroll-auth-user-uuid>'::uuid, 'payroll'),
('20000000-0000-0000-0000-000000000001', '<technician-auth-user-uuid>'::uuid, 'technician');

insert into public.employees(id, organization_id, user_id, employee_no, employment_type)
values ('30000000-0000-0000-0000-000000000001',
        '20000000-0000-0000-0000-000000000001',
        '<technician-auth-user-uuid>'::uuid, 'E-101', 'employee');

insert into public.payroll_entries(
  organization_id, employee_id, earning_month, booking_month,
  wage_cents, compensation_cents, net_deduction_cents, bonus_cents, approval_state
) values (
  '20000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000001', '2026-09', '2026-10',
  320000, 17500, 7500, -2500, 'approved'
);
```

4. Run `supabase functions serve payroll-export`. The function reads runtime-injected `SUPABASE_URL`
   and `SUPABASE_ANON_KEY`; its server-side client uses this public key with the caller's
   Authorization header. It does not use a service-role key. The config disables the legacy gateway
   JWT verifier because the handler independently calls Auth `getUser(token)` before data access.
   Never remove that verification step.
5. If needed, configure `ALLOWED_ORIGINS` in an ignored function environment file and pass it with
   the CLI's `--env-file` option. The default allows only `http://localhost:3000`. Origins are exact
   matches; `http://127.0.0.1:3000` is different. CLI requests without an Origin header still
   require a valid user token and database permission.
6. Copy `.env.example` to `.env.local` and configure only the new evaluation project's URL and
   public publishable/anon key. Never put a server secret in a `NEXT_PUBLIC_` variable. Restart Next
   (or rebuild the static export), open the connection tab and sign in with an evaluation Auth
   account.
7. Enter the organization UUID above and earning month `2026-09`. Payroll/admin membership permits
   export; technician/nonmember membership denies it in the RPC. Revoking a membership must deny the
   next request.

For a hosted evaluation, deploy migrations/functions to that explicitly selected new project and
configure its exact origin allowlist. This repository contains no deploy credentials and no workflow
that modifies a Supabase project. Hosting a static fixture demo does not deploy its Edge Function or
database.

## Deliberate scope limits

The sample is read-only. It does not implement user provisioning, payroll input, approval
transitions, immutable audit records, private photo Storage, dispatch, quotes, the operational
shared model, or CRM/n8n/ERPNext integrations. Those are assessed in the documentation and require
accepted specifications before implementation.

One source record per employee/earning month, the 1000-record bound, and the output columns are
evaluation design choices. They are not claims about the existing payroll application's data model
or importer.
