# Module estimates

These are planning ranges based on the job brief, before access to the client's code or detailed
acceptance specifications. They are not fixed-price offers. Hours include the architect's allocated
effort, implementation by the developers, tests, review, integration coordination, documentation and
acceptance support; do not add architect hours again.

Price examples use an **illustrative blended rate of €50/hour** for the whole team. This is a
modeling assumption, not an approved agency rate. Final per-module fixed prices follow written
specifications and agreed acceptance criteria. Taxes and third-party service costs are excluded.

| Module    | Scope                                                                                                     |      Team hours | Illustrative price at €50/h |
| --------- | --------------------------------------------------------------------------------------------------------- | --------------: | --------------------------: |
| 1         | Existing payroll exporter: approximately 11 specified defects, golden-file regression and release support |          80–120 |               €4,000–€6,000 |
| 2         | Shared model, ownership contracts, migrations, legacy mappings and access model                           |         200–300 |             €10,000–€15,000 |
| 3         | Quote/order lifecycle, positions, revisions, conversion and agreed documents                              |         260–400 |             €13,000–€20,000 |
| 4         | Dispatch/planning, tours, assignment conflicts, job completion, extra work and photos                     |         360–520 |             €18,000–€26,000 |
| 5         | Tour billing preparation, invoice review, dunning proposals, payment clarification and ERPNext handoff    |         400–560 |             €20,000–€28,000 |
| **Total** | **Modules 1–5**                                                                                           | **1,300–1,900** |         **€65,000–€95,000** |

For another agreed blended rate `R`, multiply each hour bound by `R`. For example, the total is
€52,000–€76,000 at €40/h and €78,000–€114,000 at €60/h. These are price scenarios, not alternative
agency offers.

## Six-month capacity and parallel work

Proposed capacity: architect 10–12 h/week + two developers 32–36 h/week each = **74–84 team
h/week**. Over 26 weeks that is **1,924–2,184 gross hours**, before holidays or absence. At the low
capacity, 1,900 hours leaves only 24 hours of gross slack; staffing and scope must be confirmed
before promising a date. Module 1 starting this week also depends on actual availability and
immediate access to the specified acceptance material.

| Stage       | Primary work                                                | Parallel lane / dependency                                                |
| ----------- | ----------------------------------------------------------- | ------------------------------------------------------------------------- |
| Initial     | Developer A: payroll correction with architect review       | Developer B: shared-model inventory and contract preparation              |
| Foundation  | Architect + both developers: accepted shared-model baseline | Coordinate with CRM, n8n and ERPNext owners                               |
| Main build  | Developer A: quotes/orders                                  | Developer B: dispatch and technician completion against stable interfaces |
| Convergence | Office workplaces and billing preparation                   | Test completed-work and order interfaces; prove ERPNext handoff           |
| Acceptance  | Module-specific acceptance and release checks               | Written acceptance controls each milestone, not the calendar alone        |

## Assumptions behind the ranges

- Existing React/TypeScript application is retained; no full frontend rewrite or historical data
  cleanup program.
- Module 1 has reproducible defects and one agreed reference file. Additional undocumented payroll
  behavior changes its scope.
- Module 2 changes ownership and relationships deliberately rather than replacing roughly 100 tables
  at once.
- Quotes/orders use an agreed set of templates and lifecycle states; complex procurement, inventory
  and tax engines are excluded.
- Dispatch includes an agreed board and tours, not a custom route-optimization engine. Offline-first
  mobile sync is excluded unless specified.
- Module 5 consumes an available ERPNext interface; ERPNext installation/accounting customization
  and n8n redevelopment are separate owners' work.
- Expected integrations, exception paths, review rounds and acceptance turnaround are defined before
  each fixed quote.
- The later CRM merge, multilingual expansion, historical bulk backfills and ongoing operational
  support are separately priced.

## What changes an estimate

The main uncertainties are undocumented database coupling, missing regression fixtures, data
quality, quote/order lifecycle detail, offline technician requirements, scheduling constraints and
ERPNext integration readiness. Discovery should resolve these before a fixed-price milestone, with
changed requirements handled as explicit scope changes.
