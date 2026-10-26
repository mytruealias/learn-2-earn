# Upgrade status

Updated 2026-10-26 on `feat/scoped-design-system`, based on workflow commit `b061656`. Safe build/release tooling, design foundations and two representative screens are implemented; broader learner redesign, identity fixes and financial concurrency work remain pending. See [current workflow verification](release-workflow-verification.md).

[Current architecture / route inventory](current-architecture.md) · [Staged implementation checklist](upgrade-plan.md) · [Latest baseline evidence](upgrade-baseline.md#audit-pack-refresh) · [20 screenshots](baseline/2026-10-26/README.md)

| Stage | Status | Required next gate |
| --- | --- | --- |
| S0 — Documentation, architecture and baseline | Finished locally; external host settings unverified, PR blocked | GitHub API access for PR; actual read-only Replit configuration evidence before deployment work |
| S0a — Small baseline repairs | Tooling prerequisites implemented/verified | Historical accessibility guidance still needs its separate route/bypass review |
| S0b — Identity safety | Pending; critical prerequisite | Close B17 unauthenticated identity bootstrap/guest merge; token expiry and staff logout revocation |
| Design foundation | Implemented and locally verified on learner path/staff directory | Gradual route migration; manual platform AT/zoom checks |
| S1 — Learner progression | Partial: path progress/navigation migrated | Home/profile/lesson experience and remaining route close-out |
| S2 — Lesson feedback/recovery/awards | Pending | Honest XP breakdown, no hearts barrier, atomic writes, server-verifiable bonuses |
| S3 — Profile/payout/support | Pending | Program-accurate copy, Zelle agreement, resilient support |
| S4 — Public website/city decks | Pending | Claims/demo provenance, CTA and legal-route host behavior, route close-out |
| S5 — Staff operations | Pending | Money concurrency/audit integrity, role matrix, explicit partner-boundary decision |
| S6 — Release/Replit handoff | Safe workflow/CI authored and locally verified; broader handoff pending | Live Replit/remote Actions verification and full accessibility/low-bandwidth matrix |

## Design foundation report (current change)

- **Behavior:** semantic CSS tokens, scoped learner/staff/marketing boundaries, Inter typography and usable primitive states; migrated path and directory with real data. Dev workshop is production-404 gated. New native dialogs/drawer behavior and optional-field null clearing preserve practical directory use without changing permissions/incentives.
- **Files:** [exact scope, conventions and verification](design-system/verification.md), [15 browser screenshots](design-system/screenshots/README.md). Existing icons/Hubert and CSS Modules retained; only new dev tooling is the axe Playwright adapter. No schema/migration, account, balance or authored curriculum change.
- **Checks:** clean install, lint, types and safe build passed. All 77 tests passed (23 unit, 36 API/release, 6 HTTP, 4 smoke, 8 design). Final design rerun passed. Axe, accessible names, native progress, focus trap/return, 44px targets, long text, reduced motion and 200% root-text simulation verified at 360/768/1440px. Actual built production server returns 404 for the workshop.
- **Environment/migration:** none beyond existing Node 24 / disposable local PostgreSQL / Chromium. Test fixtures alone were created/changed. No production connection, deployment, provider call or merge.
- **Limits:** no manual screen-reader speech/native browser-menu zoom/OS contrast/physical-device test; no full-site AA certification. Unmigrated routes, B17/B18/B20, partner boundaries and monetary concurrency remain separate tasks. Screenshots use synthetic resources and real seeded curriculum.
- **Rollback:** compatible component/style revert; no data reversal. Keep safe workflow and coordinate null-clearing client/API compatibility. Live Replit/remote CI remain unverified; PR may remain blocked by the existing GitHub API restriction.

## Safe workflow report (previous stage)

- **Behavior:** build/start/post-merge no longer migrate, seed, repair history or provision staff. Named release operations confirm server identity/target; content imports preserve existing edits/rewards/IDs/history; first-admin command refuses any existing staff. Historic repair is read-only. Test harness creates fresh DBs/restricted roles and verifies a nonce/ownership/privilege boundary before resets or fixtures.
- **Files and evidence:** [exact file list and verification](release-workflow-verification.md); README/DEPLOYMENT and examples now match actual ports, names, sessions and commands. Dependencies/lockfile/schema/migration SQL and authored curriculum/economics remain unchanged.
- **Checks:** clean npm ci and safe build passed; populated local canary's 18 model snapshots unchanged by build. Lint/type checks passed with build suppressions removed. Unit 8, API/release 36, HTTP 6 and actual Chromium browser 4 tests passed. Remote GitHub Actions has not run here.
- **Browser:** responsive public page at 390/1440px, learner form login to profile then home/path/lesson, and staff form login/dashboard pass in real Chromium. These are smoke tests, not complete accessibility/security assertions. No visual redesign was performed.
- **Environment/migration:** no schema/data migration for this change, no production operation/deployment. Replit files/settings remain unavailable; repository binding stays 0.0.0.0:5000. Configure/test a local maintenance connection for disposable suites, install Chromium, and inspect actual Replit custom build/run settings before a separately authorized deploy.
- **Blockers:** missing original init migration still prevents claiming a fresh production baseline; verified recovery/backup/restore instructions are in DEPLOYMENT.md. GitHub API access/remote CI/PR remain unverified. Critical B17/B18/B20 and financial risks are explicitly unchanged.
- **Rollback:** retain removal of unsafe build side effects when correcting regressions; code rollback must remain schema-compatible. Do not delete curriculum/accounts/payments or reintroduce silent history repair. No database reversal is needed for this patch.

## S0 audit-pack report (historical baseline)

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
