# Safe build/release workflow — verification

Implemented on `fix/safe-build-release`, based on `f2e6677`. This completes the build/release tooling subset of S0a/S6, not the learner redesign, identity-safety stage or a production rollout.

## Resulting behavior

- `npm ci` retains the lockfile; `prisma:generate` produces the client without DB writes. `build` invokes generation then a build-only child environment with an unreachable DB and external provider/bootstrap bindings disabled. The normal Next lint/type checks are enabled again.
- `release:migrate`, `release:content`, `release:bootstrap-admin` and `db:prepare-dev` require explicit database-name confirmation and verify server identity. The release wrapper holds a database advisory lock on a dedicated single-connection client. No combined automatic release/deploy command exists.
- Content synchronization only adds missing curriculum entities/card slots. Existing IDs/content edits/order/activation/rewards and learner/payment history remain unchanged. Derived metadata initialization applies only to newly inserted lessons. Existing metadata/content corrections need a separate reviewed backfill.
- Bootstrap requires a supplied email/password and no existing staff of any status/role; it uses a serializable transaction/lock and has no upsert/default account. `fix-migration.ts` is read-only and exits nonzero on failure.
- Every DB-backed test suite creates its own random database and restricted role from a loopback maintenance connection. The guard verifies exact injected app/test bindings, a server-side nonce marker, current database/user ownership and absence of privileged role flags before resets/fixtures. No `.env.test` override/fallback to the app DB. The runner removes only created resources and preserves suite failure status. `npm test` runs unit/API/HTTP/browser sequentially; remote/pre-existing HTTP targets are refused.
- CI uses a disposable PostgreSQL 17 service and no production/repository secrets. Browser smoke coverage now launches actual Chromium and checks responsive landing, learner UI login/profile/home/path/lesson and staff login/dashboard. The legacy admin suite is separately named and retains its documented fixture/assertion limitations.
- Runtime binding remains **0.0.0.0:5000**. Actual Replit workspace/deploy settings are absent from this checkout and unavailable through connected tools; no host configuration is changed or claimed verified.

## Evidence

The ignored local `.env.test` received missing maintenance/browser harness bindings derived only from the verified loopback test setup; existing entries were preserved and no values were printed or committed.

Local raw logs are in `/workspace/.onboarding/release-*.log`; logs/credentials are not committed. All test writes use freshly created restricted databases. The populated local audit database was read only for before/after build checks, never reset/seeded by these validation commands. No production connection or deployment build wrapper from the old code was executed.

| Check | Result |
| --- | --- |
| Clean install, `npm ci --cache /workspace/.npm` | Passed; 402 packages installed; lockfile unchanged |
| `npm run build` after clean install | Passed, including default Next lint/type gates; no usable application DB in build environment |
| Prisma generation with empty application DB binding | Passed; client generation requires no live app database |
| Build canary | Snapshots of all 18 model tables in populated local audit DB identical before/after build |
| `npm run lint` | Passed; generated `.next-e2e` excluded, source rules retained |
| `npm run typecheck` after generated build/HTTP types | Passed; Promise params and supported admin route exports repaired |
| Unit guard tests | 8 passed; missing capability, dev/remote/privileged/malformed/mismatched bindings and server proof refusal |
| API/release integration tests | 36 passed across 7 files; includes content rerun preserving edits/rewards/history, wrong target/direct seed refusal, no bootstrap overwrite/recreation and read-only migration inspection |
| HTTP end-to-end suite | 6 passed on isolated DB/role; city gate, navigation, learner XP and payout review/approval |
| Actual browser suite | 4 passed in Chromium; mobile/desktop landing, learner UI path/lesson, staff dashboard; direct npm invocation also passed using local harness settings |
| Fixture cleanup | No generated test databases or roles remain after suite exit |
| Migration/host rollout | Not run; no migration/schema change in this patch, no production history repair, no Replit deployment |
| GitHub Actions/PR | Workflow authored; remote Actions execution and PR creation not verified. GitHub API was forbidden in the baseline. |

The mobile landing and synthetic staff dashboard screenshots from the current browser run were visually inspected; they preserve the existing layouts. Generated screenshots are ignored test artifacts, not production evidence. GitHub Actions YAML parses locally; remote execution remains unverified.

The initial browser test incorrectly expected login to route to `/app`; current code intentionally routes to `/profile`. The assertion was corrected to verify profile, then follow the actual Back to Home link before path/lesson checks. No product navigation was changed to make the test pass.

## Remaining limits and rollback

Production migration history is incomplete in Git: the original init artifact is missing. Follow DEPLOYMENT.md's backup/restore-test/baseline recovery prerequisites; do not mark a failed migration applied without verified original effects. Source-reviewed identity/financial issues B17/B18/B20 and money/concurrency risks remain pending; these tooling checks do not establish production security readiness.

No data migration is required for this code change. Roll back a faulty tooling change by correcting/reverting its focused code while retaining the removal of hidden build mutations. Do not restore the previous build chain that repaired history/seeded accounts on deploy. Never delete inserted curriculum, staff or financial history to undo a code change; use compatible forward fixes/reconciliation.

## Exact changed files

- [.env.example](../.env.example)
- [.env.test.example](../.env.test.example)
- [.github/workflows/checks.yml](../.github/workflows/checks.yml)
- [.gitignore](../.gitignore)
- [DEPLOYMENT.md](../DEPLOYMENT.md)
- [README.md](../README.md)
- [app/admin/AdminContext.tsx](../app/admin/AdminContext.tsx)
- [app/admin/finance/FinanceClient.tsx](../app/admin/finance/FinanceClient.tsx)
- [app/admin/layout.tsx](../app/admin/layout.tsx)
- [app/admin/payouts/page.tsx](../app/admin/payouts/page.tsx)
- [app/admin/staff/page.tsx](../app/admin/staff/page.tsx)
- [app/api/auth/session/route.ts](../app/api/auth/session/route.ts)
- [app/components/LandingFooter.tsx](../app/components/LandingFooter.tsx)
- [app/lesson/[lessonId]/page.tsx](../app/lesson/[lessonId]/page.tsx)
- [docs/current-architecture.md](../docs/current-architecture.md)
- [docs/release-workflow-verification.md](../docs/release-workflow-verification.md)
- [docs/upgrade-plan.md](../docs/upgrade-plan.md)
- [docs/upgrade-status.md](../docs/upgrade-status.md)
- [e2e/global-setup.ts](../e2e/global-setup.ts)
- [e2e/global-teardown.ts](../e2e/global-teardown.ts)
- [e2e/helpers/seed.ts](../e2e/helpers/seed.ts)
- [e2e/release-smoke.spec.ts](../e2e/release-smoke.spec.ts)
- [eslint.config.mjs](../eslint.config.mjs)
- [lib/test-database-safety.ts](../lib/test-database-safety.ts)
- [next.config.ts](../next.config.ts)
- [package.json](../package.json)
- [playwright.config.ts](../playwright.config.ts)
- [prisma/fix-migration.ts](../prisma/fix-migration.ts)
- [prisma/seed-admin.ts](../prisma/seed-admin.ts)
- [prisma/seed-recovery.ts](../prisma/seed-recovery.ts)
- [prisma/seed-support.ts](../prisma/seed-support.ts)
- [prisma/seed.ts](../prisma/seed.ts)
- [scripts/build.ts](../scripts/build.ts)
- [scripts/database-operation.ts](../scripts/database-operation.ts)
- [scripts/post-merge.sh](../scripts/post-merge.sh)
- [scripts/release.ts](../scripts/release.ts)
- [scripts/run-tests.ts](../scripts/run-tests.ts)
- [tests/api/release-safety.test.ts](../tests/api/release-safety.test.ts)
- [tests/global-setup.ts](../tests/global-setup.ts)
- [tests/helpers/factories.ts](../tests/helpers/factories.ts)
- [tests/setup-env.ts](../tests/setup-env.ts)
- [tests/unit/test-database-safety.test.ts](../tests/unit/test-database-safety.test.ts)
- [vitest.config.ts](../vitest.config.ts)
- [vitest.unit.config.ts](../vitest.unit.config.ts)
