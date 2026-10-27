# Learning progression verification

Base: secure learner-entry checkpoint `261d434`. Branch: `feat/learning-progression`. Existing Next 15.5.15 / React 19 / Prisma 6.1 and CSS Modules retained; dependency versions and lockfile are unchanged. No deployment, production connection, payment/AI operation or curriculum seed change occurred.

## Implemented behavior

Home prioritizes a real recommended lesson, its stored duration and a plain explanation, followed by an optional local-day goal and selected pathways. Real available/historical progress and XP remain secondary to learning. Returning users retain useful progress; all-complete/empty-program states are distinct. Desktop uses a recommendation/goal rail and pathway grid; phones/text enlargement reflow.

Both original vertical timeline and linear list use one semantic ordered lesson tree. Five states derive from published content, actual completed rows, actual opened rows and saved review markers. No prerequisite schema exists, so no arbitrary sequence lock is introduced. Inactive paths/units/lessons are filtered/guarded; no-card content has an explained unavailable state. The existing Hubert SVG appears consistently with restrained purple styling and shared motion/focus tokens.

Server-owned `LessonVisit` and `PathSelection` plus nullable `User.dailyGoal` are the smallest persistence additions for opened state and learner choices. They never substitute for completion, award proof or membership. Opening/reopening, view switching and preference changes award no XP and do not alter payout history. Account creation keeps proven guest preferences/activity on the same user row. Lesson card-position recovery and bonus/financial integrity are separate tracked work.

## Executed checks

| Check | Evidence |
| --- | --- |
| Lint, safe build, types | Passed; build remains database-free and performs no migration/seed |
| Full `npm test` | **160 passed**: 58 unit, 64 API/release, 6 HTTP, 4 browser smoke, 8 design, 11 access/onboarding, 9 progression |
| Final focused browser check | All 9 passed after final wording refinements distinguishing available completion and earlier opened activity; lint/build/types also passed again |
| API safety | Signed ownership/Origin, strict preference bodies, inactive parents/content, empty cards, arbitrary-order access, current-user selection, optional goal, valid timezone and guest continuity verified |
| No navigation awards | Actual browser before/after user/progress/payout snapshots compare equal after opening and both view modes; API open/reopen and preference checks also confirm no XP/completion/payout side effects |
| Migration | Exact additive SQL exercised against the old shape inside an attested disposable transaction; account, progress and payout history compare equal; exercise rolled back |
| Browser state matrix | New, returning after old progress, partial, all five lesson states, all-complete, empty path/unit, empty program, inactive content, unavailable cards and retryable network failures |
| Accessibility/layout | Zero axe violations on captured surfaces at 360/768/1440; measured target sizes ≥44px, no horizontal control/heading overflow, keyboard Enter/focus/pressed states and equivalent links; doubled root text at all widths |
| Local production mode | Ten actual HTTP checks with an unreachable app DB, including public Help/recovery HTML, showcase 404, private page/API protection and honest unconfigured access |
| Visual review | [18 actual PNGs](screenshots/README.md), 20 browser observations and production-check JSON; synthetic data only |

Logs live locally at `/workspace/.onboarding/progression-*.log`. All data-backed suites create independent fresh databases/restricted roles and verify server capability/ownership before resets/fixtures; suites stay sequential. Fixture restart behavior is idempotent. A one-off pinned formatter was used without adding a dependency.

Verification corrected ambiguous accessible button-name whitespace, test-fixture restart uniqueness, misleading zero-of-zero empty copy and capture scroll position that could misrepresent fixed skip links. Error wording now distinguishes unconfirmed preference writes from confirmed failure; explicit retries remain idempotent. Assertions were retained. Historical award atomicity/bonus problems were not papered over by navigation tests.

## Migration, environment, limits and rollback

Apply `20261027010000_learning_preferences_visits` **after** the prior session/onboarding migration, following [DEPLOYMENT.md](../../DEPLOYMENT.md) target verification, existing-baseline inspection and backup/restore testing. No historical backfill, economic conversion, ID rewrite or content sync is needed. New opened records begin only on real authenticated lesson entry; existing completions remain authoritative. No new secret/provider/configuration or port change; runtime remains 0.0.0.0:5000. The previous clean install checkpoint uses the same dependency lockfile.

Manual screen-reader speech, native browser-menu zoom, physical notches/keyboards, real poor-network hardware, live Replit settings, production migration history/restore and remote GitHub CI remain unverified. Axe/text/geometry/keyboard evidence is not full-site WCAG certification. Current review suggestions use actual existing missed-card markers only; the existing completion writer does not yet produce them. Opened lessons restart at the beginning; there is no fabricated card-resume claim. Existing hearts/award/payout/staff/partner risks remain separately tracked.

Retain additive nullable fields/tables and the secure-session checkpoint on rollback. Revert presentation/support compatibly while retaining active-content protections; forward-fix or pause affected entry points rather than deleting history or restoring arbitrary-ID identity. No balance, earned XP, payment or curriculum reversal is required. No merge/deploy. Draft PR creation is attempted after the reviewed commit; GitHub API access has previously returned Forbidden.

## Exact changed files

All PNG/JSON filenames are indexed by [browser evidence](screenshots/README.md). Source/configuration/documentation changes:
- [DEPLOYMENT.md](../../DEPLOYMENT.md)
- [README.md](../../README.md)
- [app/api/progress/complete/route.ts](../../app/api/progress/complete/route.ts)
- [app/api/progress/list/route.ts](../../app/api/progress/list/route.ts)
- [app/api/progress/open/route.ts](../../app/api/progress/open/route.ts)
- [app/api/user/learning-plan/route.ts](../../app/api/user/learning-plan/route.ts)
- [app/app/page.tsx](../../app/app/page.tsx)
- [app/components/ContinueLearningCard.tsx](../../app/components/ContinueLearningCard.tsx)
- [app/components/LessonList.tsx](../../app/components/LessonList.tsx)
- [app/components/PathLearning.tsx](../../app/components/PathLearning.tsx)
- [app/components/PathProgressBar.tsx](../../app/components/PathProgressBar.tsx)
- [app/components/StatsBar.tsx](../../app/components/StatsBar.tsx)
- [app/components/learner/DailyGoal.tsx](../../app/components/learner/DailyGoal.tsx)
- [app/components/learner/PathExplorer.tsx](../../app/components/learner/PathExplorer.tsx)
- [app/components/learner/home.module.css](../../app/components/learner/home.module.css)
- [app/lesson/[lessonId]/LessonPlayer.tsx](../../app/lesson/[lessonId]/LessonPlayer.tsx)
- [app/lesson/[lessonId]/not-found.tsx](../../app/lesson/[lessonId]/not-found.tsx)
- [app/lesson/[lessonId]/page.tsx](../../app/lesson/[lessonId]/page.tsx)
- [app/paths/[pathSlug]/not-found.tsx](../../app/paths/[pathSlug]/not-found.tsx)
- [app/paths/[pathSlug]/page.tsx](../../app/paths/[pathSlug]/page.tsx)
- [app/paths/[pathSlug]/path.module.css](../../app/paths/[pathSlug]/path.module.css)
- [docs/current-architecture.md](../../docs/current-architecture.md)
- [docs/learning-progression/README.md](../../docs/learning-progression/README.md)
- [docs/learning-progression/verification.md](../../docs/learning-progression/verification.md)
- [docs/upgrade-plan.md](../../docs/upgrade-plan.md)
- [docs/upgrade-status.md](../../docs/upgrade-status.md)
- [e2e/helpers/learning.ts](../../e2e/helpers/learning.ts)
- [e2e/learning-progression.spec.ts](../../e2e/learning-progression.spec.ts)
- [lib/learning-data.ts](../../lib/learning-data.ts)
- [lib/learning-progression.ts](../../lib/learning-progression.ts)
- [package.json](../../package.json)
- [prisma/migrations/20261027010000_learning_preferences_visits/migration.sql](../../prisma/migrations/20261027010000_learning_preferences_visits/migration.sql)
- [prisma/schema.prisma](../../prisma/schema.prisma)
- [scripts/run-tests.ts](../../scripts/run-tests.ts)
- [tests/api/learning-plan.test.ts](../../tests/api/learning-plan.test.ts)
- [tests/helpers/factories.ts](../../tests/helpers/factories.ts)
- [tests/unit/learning-progression.test.ts](../../tests/unit/learning-progression.test.ts)
