# Anonymized private-project reference

The assessment used a private multi-application business platform as architectural background. The
review was read-only. Its source, history, credentials, schema dumps, assets and customer records
were not imported into this repository.

| Reviewed surface           | Observed technical patterns                                                                                                       | Relevance to this evaluation                                                 |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Business application       | React/Next.js, TypeScript, Supabase browser/server clients, authenticated routes, business dashboards and SQL reporting functions | Typed operational workflows and clear data-access boundaries                 |
| Administrative application | A separate Next.js/React application with Supabase authentication/session clients                                                 | A distinct administrative interface over a shared backend                    |
| Participant portal         | A separate React/Next.js/TypeScript application with Supabase-backed workflows and API routes                                     | Multiple user-facing application surfaces integrating with the same platform |

These are surfaces of one private platform. They should not be represented as two independent live
business-app references. A repository review establishes the technology present in the code; it does
not independently establish production status, historical ownership, RLS deployment or who built
each feature. Approved live links and named builder attribution belong in the agency's private
proposal.

The public payroll migration, policies, Edge Function, React interface and tests were written anew
specifically for this evaluation. Their behavior is supported by the checks recorded in
[verification](verification.md).
