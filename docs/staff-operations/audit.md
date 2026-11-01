# Staff workflow baseline

2026-10-29, extending the in-progress program-authorization stage on `feat/program-boundaries` from `4e979ba`. Existing routes/source inspected before replacement. No production/host configuration is assumed verified.

| Impact | Source-confirmed baseline                                                                                              | Acceptance                                                                                                                                                     |
| ------ | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| High   | Case GET loads and sorts every matching record in JavaScript before pagination. Directory/staff lists are unbounded.   | Database-side filtering, stable sort/tie-breaker, 20-row pages, URL-preserved list state and bounded exports.                                                  |
| High   | Case notes, assignment, dispatch and allocations write independently, with no version or replay receipt.               | One transaction for case/version/note/allocation/audit/receipt; stale simultaneous writes return conflict, retries do not duplicate notes/resources.           |
| High   | Participant edits and staff disable actions have no visible impact confirmation or stale-version check.                | Confirm actual participant/membership/program impact, revoke relevant sessions, preserve money/history and reject stale versions.                              |
| High   | Reports use global raw SQL/nested Progress, do not accept timezone/range, and mix approval/payment in inherited views. | Authorized active-program aggregates with defined denominators, local calendar boundaries, exact paidAt money and safe aggregate exports.                      |
| Medium | Overview mixes global totals and charts rather than role-specific work queues; client errors can resemble empty data.  | Bounded real queues, due follow-ups, visible role/scope and honest loading/empty/error states; no fabricated outcomes.                                         |
| Medium | Staff/account/case forms use custom overlays and inconsistent legacy styling.                                          | Adopt existing scoped design tokens, native dialogs/fields/buttons and reusable responsive table, with actual browser coverage for every baseline admin route. |

Bulk mutations are not introduced. Filtered exports disclose program scope, total match count and the 5,000-record limit; individual case and money actions remain reviewable with server-side permissions.
