# Upgrade baseline

Verified 2026-10-26 against `4f59d419528ae5ff450b339ab1de512554a8094b`.
This is evidence for the [staged checklist](upgrade-plan.md), not a production audit or WCAG certification.

## Checkout and guidance

- Checkout: `/workspace/learn-2-earn`; initial branch `work`, clean tracked/untracked status. Work moved to `docs/upgrade-baseline` before edits.
- Read-only `git ls-remote origin refs/heads/main` returned the same full SHA. No assumption that the brief supersedes existing code.
- No `AGENTS.md` found under `/workspace`, including repository subdirectories (dependency/build directories excluded). Read `README.md`, `DEPLOYMENT.md`, `docs/accessibility.md`, `.agents/memory/MEMORY.md`, package/configuration files, route handlers and existing tests. Memory directs curriculum counts to seed sources rather than the stale curriculum snapshot; no new counts are asserted here.
- GitHub is the collaboration point; Replit remains the application host. This cloud checkout is not evidence about the running Replit deployment or its database.
- Installed: Node 24.19.0, npm 11.9.0, Next 15.5.15, React/React DOM 19.0.0, TypeScript 5.9.3, Prisma/client 6.1.0, Zod 3.25.76, ESLint 9.39.2, Vitest 4.1.4, Playwright 1.58.2. Manifest ranges are not all exact pins; retain `package-lock.json` and use `npm ci` when installing.

## Checks executed in this task

All repository commands below ran from `/workspace/learn-2-earn`; exit statuses were retained. Raw logs are local artifacts in `/workspace/.onboarding/baseline/`, not committed or needed to understand these results.

| Check | Result | Meaning / limits |
| --- | --- | --- |
| `npx prisma generate` | PASS, exit 0 | Client 6.1.0 generated. Prior onboarding download 403 is no longer reproduced. No schema write. |
| `npm run lint` | FAIL, exit 1 | One error at `LandingFooter.tsx:72`; one unused-import warning at `app/api/auth/session/route.ts:5`. |
| `npx tsc --noEmit` | FAIL, exit 2 | Initial check: lesson route declares synchronous `params`. Recheck after build/HTTP tests: **two errors**, adding unsupported `useAdmin` layout export from `.next-e2e` generated types. Both output directories are included by `tsconfig.json`. The earlier missing-Prisma-type cascade is resolved by generation. |
| `npm run test:api` (via `npm test`) | PASS | 6 files, 32 tests passed; no failed/skipped tests reported. Includes session mismatch, XP award, sequential repeat completion, payout validation and access gates. |
| `npm run test:e2e` (via `npm test`) | PASS | 6 HTTP tests passed in 25.4s. Includes city PIN lockout, landing CTA/navigation reachability, learner completion/XP, payout review/approval. `npm test` exit 0. |
| `npx next build` | PASS, exit 0 | Compilation and route output succeeded. **Not** a lint/type gate: `next.config.ts` explicitly ignores both during builds. |
| Chromium launch | BLOCKED | No installed Playwright browser executable. |
| Browser installation with `PLAYWRIGHT_BROWSERS_PATH=/workspace/.playwright npx playwright install chromium` | BLOCKED, exit 1 | `cdn.playwright.dev` download returns HTTP 403, `Domain forbidden`. Default cache location was unusable; writable path fixed that separate issue. |
| `gh api repos/mytruealias/learn-2-earn` | BLOCKED, exit 1 | GitHub API returns `Forbidden`; successful Git reads do not prove API/write permission. PR not created. |

### Database safety and interpretation

Before running tests, parsed the ignored `.env.test` without printing its values and asserted the target was exactly loopback `127.0.0.1`, port 5432, database `learn2earn_test`, role `agent`. A local SQL query confirmed the database name. PostgreSQL 17 was already running from `/workspace/.postgres/data`. Existing test setup reset this disposable database and seeded synthetic curriculum fixtures. No production connection, development seed, deployment build script, or production migration was run.

`npm run build` was deliberately not used: it combines generation, migration repair/deployment and three seed commands. `npx next build` isolates compilation. API and HTTP suites ran sequentially; the HTTP server uses `.next-e2e`, separate from the compilation output.

These HTTP tests are labeled by Playwright's `chromium` project, but use `APIRequestContext`, not a browser. No visual, keyboard, screen-reader, responsive, contrast, reduced-motion or low-bandwidth browser check passed in this task. The legacy browser suite was not run. Its default credentials are not seeded by global setup, and some assertions permit vacuous success; see B12.

Generated `test-results/.last-run.json` was restored to its pre-run tracked contents. No account, curriculum identifier, earned balance, payout history, production service or integration configuration was changed.

## Baseline findings

“Source-confirmed” means the cited code establishes the behavior or inconsistency; it does not mean browser reproduction. Risks needing fault/concurrency tests are labeled explicitly.

| ID / priority | Evidence and finding | Stage / measurable closure |
| --- | --- | --- |
| B01 / high | Source-confirmed: [ContinueLearningCard](../app/components/ContinueLearningCard.tsx), [LessonList](../app/components/LessonList.tsx), [PathProgressBar](../app/components/PathProgressBar.tsx), [StatsBar](../app/components/StatsBar.tsx) gate fetches on `localStorage.l2e_user_id`; failures disappear or look like zero progress. [progress/list](../app/api/progress/list/route.ts) already derives identity from the session and accepts an omitted body ID. This is a client continuity defect, not evidence the API trusts arbitrary identity. | S1: valid session plus empty/stale local storage loads correct progress; 500/offline shows retry rather than zero; no-session has a distinct state. |
| B02 / high | Source-confirmed: [LessonPlayer](../app/lesson/[lessonId]/LessonPlayer.tsx#L315) falls back to `lesson.xpReward` when `xpAwarded` is absent. The [repeat-completion response](../app/api/progress/complete/route.ts#L110) returns `alreadyCompleted` without an award. Existing API repeat test confirms total XP stays unchanged. | S2: replay shows 0 new XP and the balance remains unchanged. |
| B03 / high | Source-confirmed: [completion handler](../app/api/progress/complete/route.ts#L157) adds 1 for `perfectRun`, but response `perfectRunBonus` is 5. Client combo/perfect flags also affect money-convertible XP without server answer verification. | S2: breakdown equals actual increment; tampered client claims cannot increase award. Preserve current economics pending an explicit scoring decision; do not retroactively alter balances. |
| B04 / high | Source-confirmed: [LessonPlayer](../app/lesson/[lessonId]/LessonPlayer.tsx#L925) replaces lesson content at zero hearts; retry resets card index to 0. Interruptions also lose the in-memory card index. | S2: five mistakes do not block content/support; refresh resumes safe lesson position without awarding unconfirmed XP. |
| B05 / high | Source-confirmed: [LessonPlayer completion](../app/lesson/[lessonId]/LessonPlayer.tsx#L273) ignores ensure-user status, silently catches failures, handles only one 403 explicitly and adds the current lesson to local completed IDs before checking success. | S2: 401/403/500/offline each yields explicit recovery; no completion/award celebration before server confirmation; retry awards at most once. |
| B06 / high risk | Source-confirmed non-atomic writes: [progress creation](../app/api/progress/complete/route.ts#L180) and user XP update are separate; [payout request](../app/api/payout/request/route.ts) checks aggregate balance then inserts separately. Unique progress key exists. **Actual partial-write/concurrent overspend not reproduced.** | S2/S5: fault injection leaves neither partial progress nor XP; concurrent same-lesson requests award once; concurrent payout requests cannot exceed available XP/cap. |
| B07 / medium | Reproduced lint error: [LandingFooter](../app/components/LandingFooter.tsx#L72) uses an anchor to `/#contact`; unused `parseJson` import in session handler. | S0a: lint exit 0 without disabling rules. |
| B08 / medium | Reproduced type error: [lesson page](../app/lesson/[lessonId]/page.tsx#L10) declares `params: { lessonId: string }` despite awaiting it. Next-generated types require a Promise. After build and HTTP tests, type checking also rejects the named `useAdmin` export in [admin layout](../app/admin/layout.tsx#L20). Build ignores lint/type errors in [next config](../next.config.ts). | S0a: fresh build and HTTP-server types plus `npx tsc --noEmit` exit 0; independent lint/type gates remain visible. |
| B09 / medium | Source-confirmed docs drift: README points to absent `.env.example` / `.env.test.example`, port 3000 vs script port 5000, `ADMIN_PASSWORD` vs seed's `ADMIN_DEFAULT_PASSWORD`, and default $1/3 XP vs fallback $0.05/XP in [payout rules](../lib/payout-rules.ts). Actual program-configured rates may override fallback. | S0a/S3: documented names/port match scripts; no universal exchange-rate claim; examples contain no secrets. |
| B10 / medium | Source-confirmed accessibility gaps: StatsBar XP action is a clickable `div`, canvas confetti uses animation frames without checking reduced motion, and admin overlays lack the shared modal hook. [Accessibility guidance](accessibility.md) acknowledges modal follow-ups but also suggests nonexistent `npm run typecheck`, treats bottom navigation as an implicit skip link, and lists `/la` and `/invest` without corresponding page files in this checkout. | S1/S2/S4/S5: semantic keyboard actions, reduced-motion suppression, real bypass mechanism and verified route list; keyboard and accessibility evidence required. |
| B11 / medium risk | Source-confirmed: [admin payouts](../app/api/admin/payouts/route.ts#L139) updates after a separate state read and logs afterward; [audit helper](../lib/audit.ts) catches write errors. A financial action can succeed without an audit record. Finance aggregates group approved with completed payouts. **No lost-audit incident or misleading rendered chart reproduced.** | S5: fail audit write/competing transition tests; one valid transition and durable audit; approved liability distinguished from completed disbursement in figures and labels. |
| B12 / medium | Source-confirmed test weakness: [legacy admin browser suite](../e2e/admin.spec.ts) allows `rowCount >= 0`, conditionally skips payout interaction and catches failed expectations. | S5/S6: seeded role fixtures, mandatory state assertions and deliberately broken behavior must fail the suite. |
| B13 / review item | [Public admin demo](../app/components/AdminDemo.tsx) contains hard-coded participants/metrics and timed approval scenes; parent labels it a demo, but captions include “Real-time overview”. This is **not** evidence production charts are fabricated. Partner copy and all claims need a provenance review. | S4: clearly labeled illustration throughout; no simulated production action or unsupported impact claim; every primary CTA resolves to its stated destination. |
| B14 / setup risk | Source-confirmed: earliest tracked migration alters existing tables rather than creating initial schema; README/build deployment assumptions do not describe fresh bootstrap. No production migration history inspected. | S0a: document separate disposable bootstrap and existing-database deployment paths; validate migration baseline on an isolated copy before any migration proposal. |

## Remaining verification and outside requirements

- Permit the browser download destination `cdn.playwright.dev` (and review any redirect destination actually reported), then install Chromium in the writable location and run the planned browser checks. No TLS/checksum bypass.
- GitHub API access is needed for PR creation; no token values requested or printed. Keep local reviewable commits until access works. Do not infer push rights from Git reads.
- Replit secrets, deploy settings, production data health and external OpenAI/Stripe operations are unverified. Preserve integrations; use test/sandbox bindings for later verification. No credentials are needed for this documentation stage.
- WCAG 2.2 AA remains a target. Existing checklist claims are historical guidance, not fresh browser evidence.
