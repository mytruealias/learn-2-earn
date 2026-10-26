# Learn2Earn staged upgrade checklist

This pack turns the product brief into small, reviewable changes against the [verified baseline](upgrade-baseline.md). [Status](upgrade-status.md) distinguishes completed work from pending implementation. The selected first product priority is **learner progression and feedback**. Only S0 documentation is implemented in this PR.

## Constraints for every stage

- Keep Next.js App Router, React, TypeScript, Prisma/PostgreSQL, Zod, CSS Modules/global CSS and existing integrations. Extend working components; no stack replacement, second styling system or broad rewrite.
- Use Learn2Earn's identity and Hubert. Adult, welcoming plain language; rounded tactile controls, clear hierarchy, generous spacing, visible progress and one primary action per decision. Do not copy Duolingo assets, branding or exact screens.
- No public learner rankings, forced competition, shame, lost-money penalties or hearts that block learning/support. Avoid adding streak pressure; keep celebration restrained and honor reduced motion.
- Signed server sessions determine identity/permissions; server records determine progress, awards and balances. Browser storage may support resumable drafts, never authorize or award. Do not persist sensitive answers/support messages in local storage.
- Preserve routes, accounts, curriculum IDs, balances and payment history. No silent payout/scoring economic change. Financial/history schema changes require additive migrations, explicit backfill and reconciliation specifications before implementation; migration names must be chosen from actual reviewed changes, not invented now.
- Use a feature branch; inspect diffs and applicable instructions again before each stage. Do not overwrite unrelated work. GitHub PRs feed the existing Replit workflow; no automatic merge, deploy, DNS change or production seed.
- Verify a dedicated disposable DB by parsed host/database identity before tests that reset it. A database name containing `test` alone does not prove safety. Never log secret values or learner records.
- For each stage update `upgrade-status.md` with behavior, exact changed files, command exit status/test counts, browser evidence, migration/environment needs, blockers and rollback. Future file lists below are bounded implementation targets, not claims they were changed. Reinspect before starting; record any evidence-based scope revision before adding files.

## S0 — Documentation and baseline (this change)

Files: `README.md` (pack entry link only), `docs/upgrade-plan.md` (new), `docs/upgrade-baseline.md` (new), `docs/upgrade-status.md` (new).

- [x] Inspect clean checkout, branch, guidance, installed versions and remote main SHA.
- [x] Record actual lint/type/build/API/HTTP results, source-confirmed defects and unverified risks.
- [x] Specify exact file targets, stage dependencies, acceptance checks and rollback.
- [x] Keep source, dependencies, lockfile, schema and application configuration unchanged.
- [ ] Publish PR when GitHub API access is available; no auto-merge/deploy.

Acceptance: all repository file links resolve; every existing target exists (new files labeled); defect statements have evidence and distinguish static from runtime findings; document test counts and browser limitations accurately. Diff contains only the four files above and passes `git diff --check`. No migration/environment change required. Rollback: revert the documentation commit.

## S0a — Small baseline repairs before product changes

Files: `app/components/LandingFooter.tsx`, `app/api/auth/session/route.ts`, `app/lesson/[lessonId]/page.tsx`, `app/admin/layout.tsx`, `app/admin/AdminContext.tsx` (new), `app/admin/payouts/page.tsx`, `app/admin/staff/page.tsx`, `app/admin/finance/FinanceClient.tsx`, `README.md`, `docs/accessibility.md`, `package.json`, `.env.example` (new), `.env.test.example` (new), `docs/upgrade-status.md`. No dependency/lockfile changes planned. `next.config.ts` remains unchanged until independent gates are reliable.

- [ ] Fix B07/B08 without suppressions; move the admin context/hook to a separate module and update its three consumers, leaving route exports valid. Add an explicit type-check script using the installed TypeScript.
- [ ] Correct B09 documentation and supply non-secret example variable names; match port 5000 and actual admin seed variable. State that payout rates are program-configured.
- [ ] Replace stale accessibility route/command/bypass claims with verified instructions.
- [ ] Explain B14 fresh disposable schema bootstrap separately from existing database migrations; do not “repair” production history or auto-run seeds as a check.

Acceptance: `npm run lint` and `npx tsc --noEmit` exit 0 after fresh Next build and HTTP-server type generation; same 32 API and 6 HTTP baseline tests pass; example files have no credentials and docs commands match scripts. Browser-check footer hash navigation when available. No schema/economic changes. Rollback: revert repair commit; keep local ignored secrets intact.

## S1 — Learner progression and clear next action (first product stage)

Files: `app/app/page.tsx`, `app/paths/[pathSlug]/page.tsx`, `app/components/ContinueLearningCard.tsx`, `app/components/StatsBar.tsx`, `app/components/PathProgressBar.tsx`, `app/components/LessonList.tsx`, `app/components/NavBar.tsx`, `app/api/progress/list/route.ts`, `lib/use-learner-progress.ts` (new), `app/components/learner-progress.module.css` (new), `tests/api/progress.test.ts`, `e2e/learner-progression.spec.ts` (new browser tests), `docs/upgrade-status.md`.

- [ ] Use one shared session-based progress load per learner view; remove local-storage identity gating without weakening API identity checks (B01).
- [ ] Show a clear next lesson in curriculum order; distinguish new learner, continuing path, completed path and empty curriculum. Keep other paths available rather than compulsory locks.
- [ ] Add explicit loading, retryable error, unavailable/disabled and success states. On read failure, do not replace confirmed progress with zero or invent balances.
- [ ] Use semantic links/buttons for XP navigation; label progress accessibly. Keep the existing palette/icons and use CSS Modules for new styles.

Acceptance: test valid session with missing/stale browser ID, wrong-ID body (403), no session, empty list, completed path, inactive lesson, network failure and successful retry. In a fixture with 2 of 5 active lessons completed, text and accessible progress report 2/5 and 40%; next action points at the first eligible incomplete lesson. Mobile 320/390px and desktop 1280px have no horizontal overflow; keyboard reaches every action with visible focus; controls meet 24px minimum target or WCAG spacing exception (aim for 44px). Capture actual browser screenshots and assertions; do not call HTTP tests visual evidence. API/HTTP regressions pass. No migrations or new credentials. Rollback: revert S1; existing records remain authoritative.

## S2 — Lesson feedback, interruption recovery and trustworthy awards

Files: `app/lesson/[lessonId]/LessonPlayer.tsx`, `app/lesson/[lessonId]/page.tsx`, `app/api/progress/complete/route.ts`, `lib/lesson-resume.ts` (new), `app/lesson/[lessonId]/lesson-player.module.css` (new), `tests/api/progress.test.ts`, `e2e/learner-flow.spec.ts`, `e2e/lesson-recovery.spec.ts` (new browser tests), `docs/upgrade-status.md`.

- [ ] Fix B02/B03 response/display inconsistencies using the authoritative award; show zero newly earned XP for repeats.
- [ ] Replace B04 heart exhaustion barrier with supportive feedback and continued access. Preserve accounts/earned balances; do not introduce an unreviewed replacement scoring model.
- [ ] Provide retry/sign-in/recovery for B05; celebrate only after confirmation. Disable duplicate submit while pending; explain uncertainty when a request may have committed.
- [ ] Resume a safe lesson/card position after refresh/network interruption. Scope drafts to account and lesson, validate card existence/version, clear on logout/account switch/completion; tolerate storage denial. Never trust draft values for awards.
- [ ] Make creation and XP update atomic/idempotent and verify concurrent retries (B06). Reduce/disable canvas celebration for reduced motion (B10).
- [ ] Resolve client-supplied bonus authority explicitly. First preserve observed award economics in tests; specify server-verifiable evidence before changing eligibility. If durable attempt data requires a schema addition, stop that subtask for a focused additive design, reviewed file list/backfill/reconciliation and migration PR; do not invent eligibility or rewrite history.

Acceptance: replay and simultaneous duplicate completions increase total XP exactly once; injected write failure produces no partial progress/XP. For every supported bonus, displayed breakdown sums to the stored increment; tampered bonus inputs cannot mint additional XP. Five wrong answers never block lesson/support. Offline/401/403/500 states expose recovery without false success; refresh resumes safely; switching accounts reveals no prior draft. Reduced-motion browser test observes no confetti animation. Baseline suites plus new recovery/concurrency tests pass. No migration assumed; server attempt persistence is a separately reviewed prerequisite if needed. Rollback: revert code; never subtract previously awarded XP; forward-compatible additive schema is retained if introduced separately.

## S3 — Profile, payout clarity and support continuity

Files: `app/profile/page.tsx`, `app/lifeline/page.tsx`, `app/components/HelpButton.tsx`, `app/components/HubertChat.tsx`, `app/api/auth/session/route.ts`, `app/api/user/profile/route.ts`, `lib/payout-rules.ts`, `tests/api/payout.test.ts`, `tests/api/auth.test.ts`, `e2e/profile-support.spec.ts` (new browser tests), `docs/upgrade-status.md`.

- [ ] Load profile from signed session even when browser identity hints are absent; retain actual configured minimum, cap, conversion and eligibility.
- [ ] Distinguish XP earned, redeemable XP, payout requested, approved and paid. Remove fixed-dollar badge claims where program rates differ; never promise immediate payment.
- [ ] Keep Lifeline and crisis contact actions usable when chat/TTS is slow, unavailable or unconfigured. Preserve Hubert and existing OpenAI integrations; no diagnosis or guaranteed availability claims.
- [ ] Add accessible field-level failures, submit/pending/empty/success states and account-safe retry; do not store sensitive support conversations as resume drafts.

Acceptance: two synthetic program rate configurations produce exact corresponding copy/amounts without a hard-coded exchange rate; request does not imply payment sent; unauthed/wrong-account writes rejected; error states preserve non-sensitive form input appropriately. Browser offline/slow API checks leave support phone/text links usable, no trapped focus, and retry works. Verify configured chat/TTS with sandbox bindings only when available; otherwise state unverified integration behavior. API tests pass. No financial rule, schema or credential change required for core UI. Rollback: revert S3 without altering payout records.

## S4 — Credible public website and partner actions

Files: `app/page.tsx`, `app/components/LandingNav.tsx`, `app/components/LandingFooter.tsx`, `app/components/FounderModal.tsx`, `app/components/AppDemo.tsx`, `app/components/AdminDemo.tsx`, `app/components/CityDeck/CityDeckPage.tsx`, `app/invest/invest.css`, `app/invest/demo-phone.css`, `app/layout.tsx`, `app/globals.css`, `e2e/city-pin.spec.ts`, `e2e/public-site.spec.ts` (new browser tests), `docs/public-claims.md` (new), `docs/accessibility.md`, `docs/upgrade-status.md`.

- [ ] Inventory public claims with source/owner/verification status; remove or qualify unsupported statistics, organizational assertions and availability promises. No fabricated impact metrics.
- [ ] Resolve B13: label illustrative sample data and timed demos persistently; avoid simulated production controls or approval/payment success claims. Keep real staff actions in authenticated routes.
- [ ] Make one obvious primary partner action per section, with working links and honest mailto/contact expectations; preserve existing routes and city unlock behavior.
- [ ] Retain existing identity and illustrations; improve hierarchy, spacing, responsive controls, skip-to-main navigation and semantic landmarks. Keep media from blocking primary text/actions on slow connections.

Acceptance: every primary CTA has a destination assertion; hash links target real IDs, no empty links/dead controls, and contact action is honestly described. Each quantitative impact claim has documented evidence or is removed; demo metrics are unmistakably illustrative at all times. At 320/390/1280px and 200% text zoom, text/actions remain usable; keyboard/modal focus and reduced-motion checks pass; blocking media/fonts still leave usable content. Automated accessibility scan reports no serious/critical findings on changed routes, plus manual checks; this alone is not full WCAG certification. No new contact backend, analytics integration or credentials assumed. Rollback: revert S4; no DNS/deployment/integration changes.

## S5 — Staff efficiency, permissions and financial auditability

Files: `app/admin/users/page.tsx`, `app/admin/staff/page.tsx`, `app/admin/cases/[id]/page.tsx`, `app/admin/directory/page.tsx`, `app/admin/payouts/page.tsx`, `app/admin/finance/page.tsx`, `app/admin/finance/FinanceClient.tsx`, `app/api/admin/payouts/route.ts`, `app/api/payout/request/route.ts`, `app/api/admin/finance/route.ts`, `app/api/admin/finance/pool/route.ts`, `app/api/admin/finance/payout-config/route.ts`, `lib/audit.ts`, `lib/use-modal-a11y.ts`, `tests/api/payout.test.ts`, `tests/api/admin-payouts.test.ts` (new), `tests/api/admin-finance.test.ts` (new), `e2e/admin.spec.ts`, `e2e/helpers/seed.ts`, `e2e/payout-approval.spec.ts`, `docs/upgrade-status.md`.

- [ ] Use shared modal behavior with stable handlers for staff overlays; preserve role-specific workflows, filters and selection; show explicit failure/empty/loading states.
- [ ] Close B06/B11 with atomic balance reservation/transition checks and durable audit writes. Preserve payment history and existing economics. Do not label approved requests as completed disbursements.
- [ ] Reconcile finance totals against synthetic payout statuses, actual pool adjustments and optional Stripe sandbox data; no fake fallback charts.
- [ ] Replace B12 weak assertions with seeded admin/caseworker/finance fixtures and mandatory state/permission assertions. Split this stage into UI and financial PRs using subsets of the listed files.

Acceptance: direct API requests obey role matrix (review: admin/caseworker; approve/complete: admin/finance; reject: existing permitted roles); forbidden actions cause no state change. Two competing transitions produce one valid transition/audit; forced audit failure rolls back financial mutation. Concurrent requests cannot over-reserve balance/cap. Fixture totals match status-specific liabilities/disbursements exactly; approval alone sends no payment. Keyboard focus remains trapped/restored and Escape closes overlays. Regression and mandatory browser assertions pass. Schema/history changes, if required, need separate additive migration/backfill/reconciliation design before expanding file scope; no production execution. Rollback: revert code with compatible schema retained; reconcile anomalies rather than delete payment/audit history.

## S6 — Release verification and Replit handoff

Files: `package.json`, `next.config.ts`, `playwright.config.ts`, `tests/global-setup.ts`, `e2e/global-setup.ts`, `e2e/global-teardown.ts`, `e2e/helpers/seed.ts`, `lib/test-database-safety.ts` (new), `tests/unit/test-database-safety.test.ts` (new), `vitest.config.ts`, `.github/workflows/checks.yml` (new; no workflow directory currently tracked), `e2e/accessibility.spec.ts` (new), `README.md`, `DEPLOYMENT.md`, `docs/accessibility.md`, `docs/upgrade-status.md`.

- [ ] Consolidate test DB guards: require explicit disposable target, reject fallback to an arbitrary development connection and avoid logging URLs in parse errors. Unit-test malformed/remote/non-test/production-like targets without connecting.
- [ ] Establish independent lint/type/compilation/test gates. After baseline defects are fixed, remove build suppression deliberately; keep validation builds separate from deployment migrations/seeds.
- [ ] Add meaningful browser/accessibility coverage using the existing Playwright stack; inspect dependency needs before adding an axe integration (any manifest/lockfile change requires an explicit justified scope update).
- [ ] Document Replit runtime names, port, protected deployment steps, verified migration prerequisites, external-service sandbox requirements, rollback and smoke-test ownership. Never copy secrets or publish automatically.

Acceptance: CI fails for a deliberate type error, broken CTA or missing fixture; runs nonzero test counts and publishes non-sensitive results. Confirm API/HTTP/browser suites on a verified disposable DB; run responsive, keyboard, reduced-motion, contrast and interruption matrix on changed routes. Test low-bandwidth with 400kbps down/100kbps up and 400ms latency; loading state appears before response, no false awards, and retry succeeds after reconnect. No unexpected asset-size growth without recorded justification (baseline build shared first-load JS: 102kB; route-specific limits need measured browser baseline). Replit smoke validation and PR review remain pending until actually performed; merge/deploy require separate authorization. Rollback: revert CI/config changes; application rollback follows reviewed compatible schema/data rules, never database reset.

## Completion report template

For each stage record: implemented behavior; exact changed files and commit; tests passed/failed/skipped/unrun with counts; browser route/viewports/artifacts and limitations; migration/environment requirements; unresolved baseline IDs; rollback commands/constraints; PR link or exact API blocker. A stage with a blocked mandatory acceptance check is implemented but not verified; do not mark it released.
