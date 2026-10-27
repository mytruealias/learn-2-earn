# Learner journey verification

Base: `8e34d84`. Feature branch: `feat/learner-access-journey`. Installed Next **15.5.15**, React **19.0.0**, Prisma **6.1.0**; no framework, runtime dependency or styling-system replacement.

## Implemented and audited

The audit covered access/login/signup/home, NavBar, middleware, user-session, ensure/register/login/session APIs and their lesson/profile/support consumers. Arbitrary-ID bootstrap/guest claiming, age-unchecked tokens, localStorage login gates, cookie-only learner logout and misleading recovery assumptions were addressed. Existing credential accounts, guest IDs, progress/XP, payout history, curriculum IDs, routes, program rules and integrations remain authoritative.

The concrete journey is documented in [conventions and rollout](README.md). The shell supplies real Learn/Rewards/Profile/Help destinations, sidebar/bottom-bar layouts, visible active/focus states and persistent Help. Signup has three necessary fields; two welcome steps explain program approvals, privacy, optional non-sensitive goals and support. Recovery has no fabricated delivery action. Session or network errors never fabricate zero progress or confirmed success. Existing profile fields now have actual labels for keyboard entry; broader profile/lesson presentation is intentionally separate.

## Executed evidence

- Clean `npm ci --include=dev --cache /workspace/.npm` passed. No seed or migration ran as an install/build side effect; lockfile/dependency versions remain unchanged.
- Lint, safe production build and type checking passed. The safe build still injects an unreachable build-only DB binding and does not migrate, seed or repair history. No production credentials are required by tests/CI.
- Final complete `npm test` passed **131 tests**: 48 unit, 54 API/release, 6 HTTP, 4 browser smoke, 8 design and 11 journey; see [upgrade status](../upgrade-status.md). Suites run sequentially, each data-backed suite with its own fresh database/restricted role/capability marker. Logs are local `/workspace/.onboarding/learner-*.log`.
- Unit checks cover contrast, isolation guards, bounded session timestamps, redirect allowlists/control characters and middleware host/legal/private-cache behavior.
- API/release checks cover invitation requirements, server-issued guest identity, rejection of arbitrary account/guest claims, same-record guest promotion with preserved personal details/consent/progress/money history, concurrent signup, committed retries, current-device logout/replay, other-device continuity, inactive/expired/forged sessions, bounded legacy guest import and encoding-safe revocation, minimal identity reads, Origin/proxy handling and idempotent onboarding.
- The additive migration SQL is applied to the pre-change shape **inside an attested disposable transaction**. Account, progress and payment records compare equal before/after; the exercise is rolled back. This is not a production migration-history or provider-restoration test.
- Actual Chromium journeys cover access → signup/login → onboarding → home → Rewards → logout/re-entry at 360/768/1440px; real guest lesson completion and account association; invalid input, existing account, lost signup response after a committed account, expired session, retryable session read, failed logout and deliberate shared-device reset. A real profile input plus controlled VisualViewport resize verifies keyboard-open layout behavior.
- Axe WCAG 2 A/AA, 2.1 AA and 2.2 AA tags, target bounds ≥44px, visible keyboard outlines, first-error focus, next-step focus, dialog Escape/return, no horizontal control/heading overflow and root-text enlargement are checked on the adopted surfaces. Signup/home text is doubled at all three widths; no manual native zoom claim is made.
- [Screenshot index](screenshots/README.md) contains actual unretouched captures and a machine-readable observation file. Capture waits for the intended heading and fonts; a previous navigation race was fixed rather than retaining mislabeled evidence. Pictures contain synthetic fixtures and seeded curriculum only. There are 26 PNGs and 28 successful browser observations. Eight actual local production-server checks also passed with an unreachable app DB, including public Help/recovery rendering, production showcase 404, guarded private routes and honest unconfigured access.

Verification found and corrected cookie percent-encoding handling, equivalent legacy token representations that must share a revocation tombstone, a proxy-Origin mismatch, pre-hydration form clicks, focus/step resets, an unlabelled legacy profile input, overly broad navigation suspense that hid Help until JavaScript, and a test navigation race where the home and path share a Start learning label. Assertions remain in place; no failing check was disabled to obtain a pass.

Official bundled Next 15 declarations were inspected (`server/request/headers.d.ts`, `client/components/navigation.d.ts`): request headers are awaited and the navigation query hook has a small local Suspense boundary, so public Help phone resources are present in production HTML before JavaScript. Attempts to retrieve the versioned upstream web documentation failed with a network `URLError`; production build and actual browser behavior were verified locally. No unsupported version upgrade was substituted.

## Release requirements, limits and rollback

Apply `20261027000000_learner_sessions_onboarding` before this artifact only after the [existing migration-baseline and backup/restore review](../../DEPLOYMENT.md). New nullable onboarding fields need no backfill; session digests/expiry/revocation need the new table. Set a reviewed private `SESSION_SECRET`; do not substitute a shared invitation code or silently rotate a legitimate guest's secret. Registered legacy sessions reauthenticate; valid legacy guests retain the original age/row. No balances, rewards, payments, curriculum keys or consent histories are rewritten.

Recovery delivery/reset, live Replit settings, production migration history, backup restoration, remote GitHub Actions, manual VoiceOver/NVDA speech, browser-menu zoom, physical-device safe areas/keyboards and a full legacy-route AA/low-bandwidth audit are **not verified here**. Automated checks are engineering evidence, not WCAG certification. Original staff revocation/partner-boundary/financial-concurrency/lesson award-and-heart risks remain tracked separately. No provider payment/AI/delivery operation, deployment or merge occurred.

Rollback retains the additive schema and fixed identity boundary. Revert presentation independently, forward-fix a server issue or disable unsafe entry temporarily; never restore arbitrary-ID bootstrap/merge or delete account/guest/payment history. See [detailed compatibility](README.md#migration-release-and-rollback). PR creation is attempted after a reviewed commit; existing GitHub API restrictions may still block it.

## Exact changed files

All screenshot filenames are enumerated by the [evidence index](screenshots/README.md). Source, configuration and documentation files follow.
- [DEPLOYMENT.md](../../DEPLOYMENT.md)
- [README.md](../../README.md)
- [app/access/page.tsx](../../app/access/page.tsx)
- [app/api/access/route.ts](../../app/api/access/route.ts)
- [app/api/auth/login/route.ts](../../app/api/auth/login/route.ts)
- [app/api/auth/register/route.ts](../../app/api/auth/register/route.ts)
- [app/api/auth/session/route.ts](../../app/api/auth/session/route.ts)
- [app/api/chat/route.ts](../../app/api/chat/route.ts)
- [app/api/payout/request/route.ts](../../app/api/payout/request/route.ts)
- [app/api/progress/complete/route.ts](../../app/api/progress/complete/route.ts)
- [app/api/progress/list/route.ts](../../app/api/progress/list/route.ts)
- [app/api/stress-signal/route.ts](../../app/api/stress-signal/route.ts)
- [app/api/tts/route.ts](../../app/api/tts/route.ts)
- [app/api/user/ensure/route.ts](../../app/api/user/ensure/route.ts)
- [app/api/user/onboarding/route.ts](../../app/api/user/onboarding/route.ts)
- [app/api/user/profile/route.ts](../../app/api/user/profile/route.ts)
- [app/app/error.tsx](../../app/app/error.tsx)
- [app/app/loading.tsx](../../app/app/loading.tsx)
- [app/app/page.tsx](../../app/app/page.tsx)
- [app/components/ContinueLearningCard.tsx](../../app/components/ContinueLearningCard.tsx)
- [app/components/NavBar.module.css](../../app/components/NavBar.module.css)
- [app/components/NavBar.tsx](../../app/components/NavBar.tsx)
- [app/components/StatsBar.tsx](../../app/components/StatsBar.tsx)
- [app/components/learner/AuthFrame.tsx](../../app/components/learner/AuthFrame.tsx)
- [app/components/learner/Journey.tsx](../../app/components/learner/Journey.tsx)
- [app/components/learner/LearnerSession.tsx](../../app/components/learner/LearnerSession.tsx)
- [app/components/learner/LearnerShell.tsx](../../app/components/learner/LearnerShell.tsx)
- [app/components/learner/home.module.css](../../app/components/learner/home.module.css)
- [app/components/learner/journey.module.css](../../app/components/learner/journey.module.css)
- [app/components/learner/shell.module.css](../../app/components/learner/shell.module.css)
- [app/layout.tsx](../../app/layout.tsx)
- [app/lesson/[lessonId]/LessonPlayer.tsx](../../app/lesson/[lessonId]/LessonPlayer.tsx)
- [app/lesson/[lessonId]/page.tsx](../../app/lesson/[lessonId]/page.tsx)
- [app/login/page.tsx](../../app/login/page.tsx)
- [app/onboarding/page.tsx](../../app/onboarding/page.tsx)
- [app/paths/[pathSlug]/page.tsx](../../app/paths/[pathSlug]/page.tsx)
- [app/profile/ProfileClient.tsx](../../app/profile/ProfileClient.tsx)
- [app/profile/page.tsx](../../app/profile/page.tsx)
- [app/recover/page.tsx](../../app/recover/page.tsx)
- [app/signup/page.tsx](../../app/signup/page.tsx)
- [docs/accessibility.md](../../docs/accessibility.md)
- [docs/current-architecture.md](../../docs/current-architecture.md)
- [docs/learner-journey/README.md](../../docs/learner-journey/README.md)
- [docs/learner-journey/verification.md](../../docs/learner-journey/verification.md)
- [docs/upgrade-baseline.md](../../docs/upgrade-baseline.md)
- [docs/upgrade-plan.md](../../docs/upgrade-plan.md)
- [docs/upgrade-status.md](../../docs/upgrade-status.md)
- [e2e/design-system.spec.ts](../../e2e/design-system.spec.ts)
- [e2e/helpers/seed.ts](../../e2e/helpers/seed.ts)
- [e2e/learner-journey.spec.ts](../../e2e/learner-journey.spec.ts)
- [e2e/release-smoke.spec.ts](../../e2e/release-smoke.spec.ts)
- [lib/access-token.ts](../../lib/access-token.ts)
- [lib/learner-auth-schema.ts](../../lib/learner-auth-schema.ts)
- [lib/learner-navigation.ts](../../lib/learner-navigation.ts)
- [lib/learner-server.ts](../../lib/learner-server.ts)
- [lib/request-cookie.ts](../../lib/request-cookie.ts)
- [lib/session-policy.ts](../../lib/session-policy.ts)
- [lib/user-session.ts](../../lib/user-session.ts)
- [middleware.ts](../../middleware.ts)
- [package.json](../../package.json)
- [prisma/migrations/20261027000000_learner_sessions_onboarding/migration.sql](../../prisma/migrations/20261027000000_learner_sessions_onboarding/migration.sql)
- [prisma/schema.prisma](../../prisma/schema.prisma)
- [scripts/run-tests.ts](../../scripts/run-tests.ts)
- [tests/api/auth.test.ts](../../tests/api/auth.test.ts)
- [tests/api/learner-identity.test.ts](../../tests/api/learner-identity.test.ts)
- [tests/api/payout.test.ts](../../tests/api/payout.test.ts)
- [tests/api/progress.test.ts](../../tests/api/progress.test.ts)
- [tests/helpers/request.ts](../../tests/helpers/request.ts)
- [tests/unit/learner-middleware.test.ts](../../tests/unit/learner-middleware.test.ts)
- [tests/unit/learner-policy.test.ts](../../tests/unit/learner-policy.test.ts)
