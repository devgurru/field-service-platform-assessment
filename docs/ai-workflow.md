# Proposed Claude Code / AI-assisted workflow

1. Read the accepted module spec, schema, interface contracts and relevant area status before
   planning a small vertical slice.
2. Ask AI for a plan and edge cases; the architect confirms invariants, data ownership and
   acceptance criteria.
3. Add a failing regression for a specified defect or business rule before generating its
   implementation.
4. Generate small diffs on a branch; keep credentials, production exports and unrelated proprietary
   code out of model context.
5. Review every generated line, especially SQL grants/RLS, authorization, monetary rules and
   cross-system side effects.
6. Run type checks, business-rule tests, real database policy tests and relevant UI/integration
   checks; retain exact reference-file comparisons.
7. The architect reviews every PR and its test evidence; AI suggestions never approve or merge their
   own changes.
8. Deploy only reviewed Git migrations/functions through staging and the agreed release process,
   with written acceptance before each paid milestone.
9. End each day in the shared Claude project with decided/done/open/affects-others; keep durable
   contracts in Git and send a weekly written status.

This describes the proposed project workflow. The sample repository demonstrates automated checks
and reviewable changes; it does not assert that named staff or past clients followed this process.
