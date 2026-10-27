# Reward accounting verification and handoff

2026-10-27. Implementation starts at `329d7d7` on `feat/reward-accounting`. [Pre-edit source audit](audit.md), [accounting/contract conventions](README.md), [browser evidence](screenshots/README.md), [overall stages](../upgrade-plan.md).

## Staged checklist and measurable acceptance

| Stage | Baseline defect / priority | Implemented acceptance and evidence | Primary exact files |
| --- | --- | --- | --- |
| 1. Audit and terms | Critical: inconsistent copy, editable-city monetary selection, no accepted-term snapshot | One versioned contract retains 0.05/20/500 fallback and configured terms; new requests reject stale quotes, old requests retain accepted rate/methods. Staff assignment cannot be self-edited through city. Contract/rate-change/assignment tests pass. | `lib/payout-rules.ts`, `lib/rewards/money.ts`, `app/api/admin/finance/payout-config/route.ts`, `app/api/admin/rewards/program/route.ts`, `docs/reward-accounting/audit.md` |
| 2. Exact ledger and legacy reconciliation | Critical: Float money, balance/cap races, silent counter corrections | Integer-cent accepted amounts, exact rational rounding once per total, append-only entries, conservation, nonnegative accounts, transactional audit and learner locking. Parallel requests cannot overspend/circumvent cap. Legacy Float originals and XP history remain; hash-confirmed import refuses unknown/overspent/stale input. Actual additive SQL and CLI verified. | `prisma/schema.prisma`, `prisma/migrations/20261027030000_reward_accounting/migration.sql`, `lib/rewards/accounting.ts`, `lib/rewards/new-account.ts`, `lib/lesson/engine.ts`, `scripts/reconcile-rewards.ts`, auth/register and user/ensure routes |
| 3. Requests, decisions and manual payment | Critical: approval counted as paid, duplicate decisions, no payment evidence | Atomic reserve/request/ledger/audit; UUID intent replays return original receipt. Rejection/cancellation releases once. Documented role/state transitions and optional distinct approver. Completed records require authorized payer/reference/time; unique external reference and pool debit settle once. No transfer is sent. Zelle only explicitly enabled for attested manual workflow. | `lib/rewards/requests.ts`, `lib/rewards/http.ts`, payout request/cancel, admin payouts/payment-details/pool/user routes, `lib/admin-auth.ts` |
| 4. Learner/staff clarity and reporting | High: unmasked handles, misleading totals, hardcoded promises | Rewards distinguishes lifetime XP record, available estimate, holds and actual paid. Confirmation, methods/limits, masked timeline and honest uncertainty/retry states. Private reveal audited. Finance/stats use exact recorded amounts and actual paid dates; unknown historical dates remain explicit. Public/demo/legal copy no fixed reward promises. | `app/profile/Rewards.tsx`, `app/profile/rewards.module.css`, profile page/client, admin payout/finance/users/reports/dashboard, `lib/rewards/finance.ts`, session/stats APIs and marketing files listed below |
| 5. Verification and handoff | High: untested money races/history imports | 216 cases across suites, 22 screenshots/observations, 26 local built-server checks; lint/types/build pass. Disposable reconciliation has zero issues and preserves originals. Production gates remain explicitly pending. | `tests/api/payout.test.ts`, `tests/unit/reward-money.test.ts`, `e2e/rewards.spec.ts`, fixture helpers, scripts/package/docs listed below |

All implementation rows are complete locally. This does not close broader partner membership isolation, staff session revocation, full-profile migration, live payment operations or actual production reconciliation.

## Executed checks

| Command / check | Result | Local evidence |
| --- | --- | --- |
| `npm run test:unit` | 72 passed | `/workspace/.onboarding/rewards-unit-final.log` and aggregate log |
| `npm run test:api` | 94 passed in 9 files, including real migration SQL and operator CLI | `/workspace/.onboarding/rewards-api-reviewed.log` |
| `npm run test:e2e` | 6 HTTP passed | `/workspace/.onboarding/rewards-all-final.log` |
| `npm run test:browser` | 4 smoke passed | same aggregate log |
| `npm run test:design` | 8 passed | same aggregate log |
| `npm run test:journey` | 11 passed | same aggregate log |
| `npm run test:progression` | 9 passed | same aggregate log |
| `npm run test:lesson` | 7 passed on final stable source | `/workspace/.onboarding/rewards-lesson-final.log` |
| `npm run test:rewards` | 5 passed on final stable source | `/workspace/.onboarding/rewards-browser-final.log` |
| `npm run lint` | Passed, zero warnings | `/workspace/.onboarding/rewards-lint-delivery.log` |
| `npm run build` | Safe client generation and Next build passed; no seed/migration/backfill | `/workspace/.onboarding/rewards-build-delivery.log` |
| `npm run typecheck` | Passed | `/workspace/.onboarding/rewards-types-delivery.log` |
| Local built-server HTTP guards/help | 26 passed, no application DB/provider connection | [JSON](screenshots/production-checks.json), `/workspace/.onboarding/rewards-production.log` |

**216 unique cases passed across suites, not one green aggregate run.** The first aggregate stopped because a synthetic HTTP fixture changed the legacy XP counter without updating its new account; the fixture now changes matching account/ledger evidence atomically. The subsequent aggregate passed through progression, then one lesson recovery assertion encountered an access form during a source-edit/HMR reload. With source stable, all seven lesson tests and all five rewards tests passed in independent final runs. No assertions were disabled. Earlier browser checks exposed an obsolete compact profile header, an unlabelled selector and a stale staff-filter response race; the actual UI/response sequencing was corrected and the final browser suite passed.

Test isolation uses the existing harness: fresh loopback databases and restricted randomized roles, explicit server/ownership/privilege checks and a nonce attestation before fixtures/resets. Database name alone is not trusted. Suites are sequential and use separate disposable databases. No production credentials/funds/provider calls were used. This stage changes no dependencies or lockfile; the earlier clean install remains recorded in the workflow baseline.

The financial tests cover parallel balance/cap enforcement, precise window boundaries, request replays and altered-key conflicts, rate changes, insufficient entitlement, duplicate decisions/references, concurrent pool spending, rejected/cancelled release, role violations and distinct approver, private reveal, disabled Zelle, city/program separation, correction bounds, mandatory-audit failure rollback, unknown legacy status/overspend and stale import hashes.

[Executed reconciliation evidence](reconciliation-evidence.json) comes from the exact additive SQL applied to an old-shaped disposable schema inside a rolled-back transaction: original 100 XP becomes 80 available + 20 spent; recorded Float 1.005 stays intact and imports to 101 cents. No payment timestamp is inferred. Zero uninitialized accounts, zero incomplete legacy requests and zero issues remain. Append-only, balanced-entry, conservation, immutable accepted terms/payment evidence and state-transition checks were actually exercised. This is **not production reconciliation**.

## Environment, rollout and remaining limits

No new runtime provider/environment names, port/binding changes, seeds or earlier migration edits. BigInt exact math requires the focused ES2020 TypeScript target. Runtime remains `0.0.0.0:5000`. Apply additive migration only after earlier session/progression/attempt migrations and verified target, backups and restore prerequisites. Explicit read-only/hash-reviewed reconciliation is separate from migration/build/start; do not enable financial writers before its zero-discrepancy and independently checked pool/program/rounding gates. See [release and reconciliation gates](README.md#release-and-reconciliation-gates) and [DEPLOYMENT](../../DEPLOYMENT.md).

Actual Replit settings, remote Actions, production baseline/backup/restore/import, historical financial program verification, original pool/bank reconciliation, real manual method delivery, manual screen-reader speech/native browser zoom and physical devices remain unverified. Full partner membership boundaries and staff logout revocation remain pending stages. No deploy, merge, real funds movement or production database operation occurred.

[Rollback requirements](README.md#rollback): preserve additive schema, immutable evidence, snapshots and historical Float originals. Keep compatible hardened financial/credit writers, or disable them during rollback. Never re-enable pre-ledger writers or erase later payments/awards.

## Collaboration result

Implementation commit `40467a8` is pushed on `feat/reward-accounting`, stacked on `feat/server-backed-lessons`. Draft PR creation was attempted with the prepared review description; GitHub GraphQL returned `Forbidden`, so no PR was created. Git push succeeded; remote Actions remains unverified. No merge/deployment. The prepared PR body remains at `/workspace/.onboarding/rewards-pr-body.md`.

## Exact changed files

The list below includes this stage only, relative to the repository root. Screenshot PNGs and browser JSON are indexed separately in [screenshots](screenshots/README.md). No authored curriculum, dependency lockfile or previous migration changed.

- `DEPLOYMENT.md`
- `README.md`
- `app/admin/finance/FinanceClient.tsx`
- `app/admin/finance/page.tsx`
- `app/admin/page.tsx`
- `app/admin/payouts/page.tsx`
- `app/admin/reports/page.tsx`
- `app/admin/users/page.tsx`
- `app/api/admin/finance/payout-config/route.ts`
- `app/api/admin/finance/pool/route.ts`
- `app/api/admin/finance/route.ts`
- `app/api/admin/payouts/[payoutId]/payment-details/route.ts`
- `app/api/admin/payouts/route.ts`
- `app/api/admin/rewards/program/route.ts`
- `app/api/admin/stats/activity/route.ts`
- `app/api/admin/stats/reports/route.ts`
- `app/api/admin/stats/route.ts`
- `app/api/admin/stats/trends/route.ts`
- `app/api/admin/users/[userId]/route.ts`
- `app/api/auth/register/route.ts`
- `app/api/auth/session/route.ts`
- `app/api/payout/cancel/route.ts`
- `app/api/payout/request/route.ts`
- `app/api/rewards/route.ts`
- `app/api/user/ensure/route.ts`
- `app/components/AdminDemo.tsx`
- `app/components/AppDemo.tsx`
- `app/components/CityDeck/CityDeckPage.tsx`
- `app/page.tsx`
- `app/privacy/page.tsx`
- `app/profile/ProfileClient.tsx`
- `app/profile/Rewards.tsx`
- `app/profile/page.tsx`
- `app/profile/rewards.module.css`
- `app/terms/page.tsx`
- `docs/current-architecture.md`
- `docs/reward-accounting/README.md`
- `docs/reward-accounting/audit.md`
- `docs/reward-accounting/reconciliation-evidence.json`
- `docs/reward-accounting/verification.md`
- `docs/upgrade-plan.md`
- `docs/upgrade-status.md`
- `e2e/global-teardown.ts`
- `e2e/helpers/rewards.ts`
- `e2e/helpers/seed.ts`
- `e2e/learner-journey.spec.ts`
- `e2e/payout-approval.spec.ts`
- `e2e/rewards.spec.ts`
- `lib/admin-auth.ts`
- `lib/lesson/engine.ts`
- `lib/payout-rules.ts`
- `lib/rewards/accounting.ts`
- `lib/rewards/finance.ts`
- `lib/rewards/http.ts`
- `lib/rewards/money.ts`
- `lib/rewards/new-account.ts`
- `lib/rewards/requests.ts`
- `package.json`
- `prisma/migrations/20261027030000_reward_accounting/migration.sql`
- `prisma/schema.prisma`
- `scripts/reconcile-rewards.ts`
- `scripts/run-tests.ts`
- `tests/api/payout.test.ts`
- `tests/helpers/factories.ts`
- `tests/helpers/rewards.ts`
- `tests/unit/reward-money.test.ts`
- `tsconfig.json`
