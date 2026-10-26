# Upgrade status

Updated 2026-10-26 on `docs/upgrade-baseline`. Documentation base: `01d39c2`; application baseline remains `4f59d419528ae5ff450b339ab1de512554a8094b`. Source and runtime findings are documented; no application redesign or security/financial fixes are implemented in this stage.

[Current architecture / route inventory](current-architecture.md) · [Staged implementation checklist](upgrade-plan.md) · [Latest baseline evidence](upgrade-baseline.md#audit-pack-refresh) · [20 screenshots](baseline/2026-10-26/README.md)

| Stage | Status | Required next gate |
| --- | --- | --- |
| S0 — Documentation, architecture and baseline | Finished locally; external host settings unverified, PR blocked | GitHub API access for PR; actual read-only Replit configuration evidence before deployment work |
| S0a — Small baseline repairs | Pending | Source lint/type defects, generated-output lint exclusion, setup/build docs |
| S0b — Identity safety | Pending; critical prerequisite | Close B17 unauthenticated identity bootstrap/guest merge; token expiry and staff logout revocation |
| S1 — Learner progression | Pending; first product priority after safety repairs | Session-based progress and browser regression coverage |
| S2 — Lesson feedback/recovery/awards | Pending | Honest XP breakdown, no hearts barrier, atomic writes, server-verifiable bonuses |
| S3 — Profile/payout/support | Pending | Program-accurate copy, Zelle agreement, resilient support |
| S4 — Public website/city decks | Pending | Claims/demo provenance, CTA and legal-route host behavior, route close-out |
| S5 — Staff operations | Pending | Money concurrency/audit integrity, role matrix, explicit partner-boundary decision |
| S6 — Release/Replit handoff | Pending | Deterministic independent checks, browser/accessibility matrix, verified deploy settings |

## S0 audit-pack report

- **Implemented behavior:** documentation of all 34 page routes, 36 API files, metadata/static routes, sessions, roles, 18 models, card/lesson modes, external services, environment names, payout transitions and observed setup mismatches. Implemented/partial/demo-only/absent classifications distinguish real code from claims and scripted examples. Each route inventory row is open and assigned to later close-out stages.
- **Exact files changed:** `README.md`, `docs/current-architecture.md`, `docs/upgrade-plan.md`, `docs/upgrade-baseline.md`, `docs/upgrade-status.md`; exact screenshot/JSON evidence filenames are linked in `docs/baseline/2026-10-26/README.md`. No application source, tests, schema, manifest, lockfile, runtime configuration or secrets changed.
- **Documentation checks:** relative links and every existing/new stage target validated; inventory covers all page/API sources and all models; exactly 20 indexed PNGs and 16 successful core browser observations; whitespace check passed.
- **Refreshed checks:** 32 API tests / 6 files passed; 6 HTTP e2e tests passed (19.9s); isolated Next compilation passed. Standard lint failed with 725 errors/994 warnings because it includes `.next-e2e` output; source-only diagnostic run failed with 1 error/1 warning. Type check failed with 3 diagnostics representing 2 source defects. Build suppresses lint/types; no false readiness claim.
- **Browser evidence:** system Chromium worked; 20 synthetic-data screenshots cover the requested eight screens at mobile and desktop plus profile-request/homepage-top supplements. Sixteen core state assertions returned 200, expected content, no uncaught page errors and no horizontal document overflow. Browser screenshots do not replace full user-flow, accessibility, offline or permissions testing. Earlier downloadable-browser failure is historical and no longer blocks capture.
- **Runtime findings:** anonymous bootstrap assumed a known synthetic registered account (critical B17); Zelle request returned 400; base 2 + actual perfect bonus 1 produced 3 XP while response bonus was 5; repeat returned alreadyCompleted with zero balance change. Race/partial-write risks are source-confirmed but not fault/concurrency reproduced. All named review findings are assessed in the baseline addendum.
- **Migration/environment:** none required for docs. All test/fixture writes used a parsed and verified local disposable DB. No production database, deployment build wrapper, migration repair, post-merge schema push or development seed was run. No external AI/payment operation invoked. Actual Replit build/start/port/modules/secrets remain unknown because no Replit configuration is present or accessible in this checkout.
- **Blockers/unrun:** GitHub API returns `Forbidden`, so no PR created; read-only Git works. Replit live settings and all production behavior unverified. Full route browser coverage, city decks, screen-reader/contrast/zoom, low bandwidth/recovery, role/tenant negative cases and financial concurrency checks remain pending.
- **Rollback:** revert the audit documentation/evidence commit; no application/database reversal needed. Later identity fixes must not roll back to impersonation behavior; money/history changes require additive compatibility and reconciliation rather than deletion/reset.

The initial S0 checklist/defect record was committed as `01d39c2`. This refresh expands it; the old browser blockage and incomplete map are superseded by the latest evidence. No merge, deployment, production data change or external message was performed.
