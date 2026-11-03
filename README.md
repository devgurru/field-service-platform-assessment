# Field Service Platform — Technical Assessment

**React / Next.js · TypeScript · Supabase · PostgreSQL RLS · Edge Functions**

An original engineering evaluation for a modular field-service business platform. The working slice
is a role-restricted payroll export, backed by a versioned migration, explicit database permissions
and regression tests. All identifiers, organizations, employees and amounts are invented.

**[Open the interactive evaluation](https://devgurru.github.io/field-service-platform-assessment/)**
· **[Read the technical assessment](docs/assessment.md)** ·
**[See module estimates](docs/estimates.md)**

This is newly written sample code, not an extract from a production application. Existing client
repositories, source history, credentials, schemas, business data and proprietary assets are not
part of this repository. The demo CSV illustrates an acceptance-testing approach; the actual payroll
format and rules must come from the client's detailed specification.

## A five-minute review

| Requested evidence          | Review here                                                                                                                                                                                    |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| React / Next.js application | [Interactive page](app/page.tsx), [optional authenticated Supabase adapter](app/supabase-export.tsx)                                                                                           |
| One database migration      | [Payroll evaluation migration](supabase/migrations/202611030001_payroll_evaluation.sql)                                                                                                        |
| RLS and permissions         | Policies in the migration; [executable PostgreSQL checks](tests/database/policies.sql)                                                                                                         |
| One Edge Function           | [Deployment entry point](supabase/functions/payroll-export/index.ts), [HTTP handler](supabase/functions/payroll-export/handler.ts)                                                             |
| Business logic and tests    | [Pure exporter](supabase/functions/_shared/payroll.ts), [reference fixture](tests/fixtures/reference-2026-09.csv), [payroll tests](tests/payroll.test.ts), [HTTP tests](tests/handler.test.ts) |
| API contract                | [OpenAPI definition](api/payroll-export.openapi.json)                                                                                                                                          |
| Architecture and delivery   | [Assessment](docs/assessment.md), [module estimates](docs/estimates.md), [AI-assisted workflow](docs/ai-workflow.md)                                                                           |
| Verification and limits     | [Verification record](docs/verification.md)                                                                                                                                                    |

The [anonymized private-project reference](docs/reference-architecture.md) describes the
architectural background without exposing its implementation or claiming unverified deployment or
authorship.

## Run the evaluation

Requires Node.js 22+, npm and Deno 2. Database checks also require Docker.

```sh
npm ci
npm run dev
# Open http://localhost:3000 — fixture mode needs no credentials.

npm run check
npm run test:db
npm run build
npx playwright install chromium
npm run test:ui
```

The fixture role switch simulates UI access. It is not authentication. The optional connection tab
signs into a separately configured evaluation Supabase project and calls the actual Edge Function
with the user's token; the database decides access. [Setup instructions](docs/running.md) explain
the difference.

## What the sample demonstrates

- Deterministic CSV output compared with an independently written reference file, including
  encoding, ordering, delimiters and line endings.
- Compensation, net-deduction signs, negative bonuses, source mini-job amounts, separate
  earning/booking months, and explicit exclusions.
- Organization isolation, current membership checks, no self-promotion and no browser write
  privileges.
- A caller-scoped, read-only RPC. The exporter never uses a service-role key.
- Input validation, bounded export size, controlled errors and private download responses.
- A proposed delivery model with an architect and two parallel developer lanes.

This repository addresses the anonymized code-sample requirement. Approved production-app access,
attribution to the people who built each app, named staffing, Upwork profiles, references and
current availability must be provided separately. A sample is not a substitute for those facts.

Public access permits review and cloning; it grants no collaborator write access.
[Evaluation terms](LICENSE) apply.
