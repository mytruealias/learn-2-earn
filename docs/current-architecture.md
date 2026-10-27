# Current architecture and implementation baseline

Inspected 2026-10-26 on `docs/upgrade-baseline`, starting commit `01d39c2` (application code remains `4f59d419528ae5ff450b339ab1de512554a8094b`). This records the audit snapshot and a disposable local runtime, **not** Replit production state. The build/release sections were updated by the subsequent safe-workflow change; see [release verification](release-workflow-verification.md) for current command/test behavior. Read [baseline evidence](upgrade-baseline.md), [implementation checklist](upgrade-plan.md), [status](upgrade-status.md) and [screenshots](baseline/2026-10-26/README.md) together.

No applicable `AGENTS.md` was found in `/` or the workspace/repository. Read README, DEPLOYMENT.md, package scripts, middleware, test setup, accessibility guidance and both `.agents/memory` documents before edits. Preserve the existing stack, identity, integrations, curriculum keys and all money/history. The original audit changed documentation/evidence only; subsequent implemented stages are called out below.

## Classification and inventory contract

- **Implemented:** an executable route/component with real persistence or a concrete static function exists. This does not certify security, production configuration or complete accessibility.
- **Partial:** real implementation exists but an identified correctness, security, recovery or verification gap remains.
- **Demo-only:** scripted/sample illustration with no real user/payment operation.
- **Absent:** no corresponding model/route/capability found in this checkout; not a claim about uninspected external systems.

The original inventory below covers **34 page routes and 36 API route files**; the subsequent design phase adds the development-only page listed next (35 page sources total) plus generated metadata/static entry points. The learner-journey stage adds `/onboarding`, `/recover`, one API route and one model: that checkpoint totals **37 page routes, 37 API route files and 19 models**. The subsequent learning-progression stage adds two APIs/two models: that checkpoint totals **37 pages, 39 API route files and 21 models**. The lesson/Practice stage adds one page, four API routes and three models: that checkpoint totals **38 pages, 43 API route files and 24 models**. Reward accounting adds four APIs and two models, retaining page routes: current totals are **38 pages, 47 APIs and 26 models**. Every row is **open for later close-out**: its owner stage must record behavior, permissions, loading/empty/error/success, applicable browser checks and regression evidence before marking it verified in upgrade-status. A screenshot alone does not close a route. Source-reviewed routes without browser captures remain unverified visually. Dynamic route checks use synthetic IDs only.

## Reward accounting addition (2026-10-27)

[Financial contract, invariants and release gates](reward-accounting/README.md) supersede the original payout/copy findings below. RewardAccount and append-only RewardEntry separate lifetime XP, entitlement, available/reserved/spent XP and corrections. Existing Float amounts remain compatibility originals; exact cents and immutable request rule snapshots are authoritative after explicit reconciliation. A migration alone does not initialize legacy money. Production records/rounding/program assignments/pool funding still require reviewed reconciliation.

| Route | Current behavior / classification |
| --- | --- |
| GET `/api/rewards` (new) | Implemented private own-account quote, separated balances, masked history and state timeline |
| POST `/api/payout/cancel` (new) | Implemented owner-only pending cancellation with one reservation release |
| POST `/api/admin/payouts/[payoutId]/payment-details` (new) | Implemented audited reveal for admin/finance, approved requests only |
| POST `/api/admin/rewards/program` (new) | Implemented reasoned, idempotent verified financial assignment; self-edited city has no financial authority |
| Existing payout request/admin payouts | Strict quoted/idempotent request, transactional balance/cap/reservation/audit, documented state transitions, role checks, optional independent reviewer; manual payment evidence and one pool debit |
| Existing finance page/API/config/pool | Shared exact reads; approvals stay liability; actual paid timestamps drive windows; legacy unknown dates separate; versioned terms and safe reasoned pool entries |
| Existing admin user correction/detail | Private contacts masked; entitlement corrections ledgered without erasing lifetime learning/Progress; reason/idempotency/role enforcement |
| Existing session/profile/stats/reports/trends | Masked and separated paid/pending/available values from exact cents; Rewards UI at the preserved profile earnings route |

New signup/guest insertion creates an empty account/opening entry atomically, so first-use users do not get a false historical-reconciliation warning. Legacy accounts are imported only explicitly. New lesson credit joins the existing atomic attempt completion. Practice creates no new entitlement. Program configuration/financial decisions have mandatory transactional audit rather than the old best-effort logger. Typed rules/method instructions are shared; public copy removes fixed reward dollars and automatic transfer claims, and demos identify illustrative data.

No transfer provider is added. Stripe still reads balances only. Actual external bank proof/settlement, production migration/backfill/restore, full partner/staff tenant isolation and the separate staff logout defect remain unverified/pending. No new environment names or deployment-port change; TypeScript ES2020 permits exact BigInt arithmetic in the established Next.js browser baseline.

## Lesson engine and Practice addition (2026-10-27)

[Current contracts, evidence and rollout](lesson-flow/README.md) supersede the original lesson and reward-integrity findings below. `/lesson/[lessonId]` uses a typed card registry and persisted server attempts, immutable first answers, cross-device resume and atomic completion/reward/badge/streak/review writes. Only display metadata is passed through the server page; answer keys are not in initial assessment payloads. `/practice` is an implemented private destination, with active topic/missed review, explained review dates, separate practice totals, stored timezone and goals. Repeat practice does not create another Progress or award XP/cash credit. Reflection text stays only in component memory; hearts do not block learning.

| Added route | Source | Classification / close-out evidence |
| --- | --- | --- |
| `/practice` | `app/practice/page.tsx`, `Practice.tsx` | Implemented: real persisted learning evidence, empty/error/retry, topic/missed/due views, timezone settings; browser evidence in lesson-flow |
| POST `/api/lesson/attempt` | `app/api/lesson/attempt/route.ts` | Implemented: signed owner, strict body, active content/version guard, resume and first/practice mode |
| POST `/api/lesson/answer` | `app/api/lesson/answer/route.ts` | Implemented: immutable server grading/acknowledgement, no reflection text |
| POST `/api/lesson/next` | `app/api/lesson/next/route.ts` | Implemented: evidence-required, replay-safe advancement |
| GET `/api/practice` | `app/api/practice/route.ts` | Implemented: own review schedule and separate activity, no award writes |

Existing POST `/api/progress/complete` now requires only an attempt ID; old client bonus/identity/score/time claims are rejected. Home/progress-list use latest review evidence without modifying historical missed-card snapshots. Learning-plan adds explicit timezone storage. User additions are nullable; LessonAttempt/LessonAnswer/LessonReview are additive models. `PROGRAM_TIMEZONE` is the only new runtime variable name. Build/start/integrations are unchanged. Reminder delivery remains absent. Content version transition during an unfinished attempt is partial (visible safe refusal, preserved evidence, manual staff review); high-stakes anti-cheating assurance and comprehensive mastery measurement are absent. Broader profile badge vocabulary, payout races/Zelle/copy, staff logout and partner membership boundaries remain pending.

## Design foundation addition

`/dev/design-system` → [page](../app/dev/design-system/page.tsx): implemented local component workshop, dynamically guarded to return 404 in production; proof is in [design verification](design-system/verification.md). Learner `/paths/[pathSlug]` and staff `/admin/directory` now use scoped shared primitives and have tested loading/error/retry/CRUD/progress states. Their broader identity/permission/financial baseline limits remain. No new API endpoint/model was added; directory optional null validation was made compatible with clearing existing nullable fields.

## Learner access addition (2026-10-27)

[Current learner journey and rollout](learner-journey/README.md) supersedes the original identity/access findings below. Server-issued, database-revocable learner sessions replace arbitrary-ID bootstrap and localStorage login flags. Existing guest records are upgraded in place from signed ownership proof; registered legacy sessions require sign-in. New onboarding fields are nullable for old accounts. `/recover` is an honest staff-assisted path because no verified delivery/reset integration exists. Broader financial, lesson and staff risks remain open.

## Learning progression addition (2026-10-27)

[Current progression conventions/evidence](learning-progression/README.md) supersede the home/path presentation below. Real next-lesson recommendations, optional goals, persisted selected paths and opened-state metadata drive the visual/linear path. `LessonVisit` is not completion/XP or card-position storage. `PathSelection` is not membership or access control. No prerequisites exist in the current schema; all published lessons remain selectable in any order. Inactive parents/content are guarded and empty-card content is unavailable without losing history. A second additive migration is required, with no money/content backfill.

## Page routes

`app/.../page.tsx` defines each route. Gate abbreviations: public = no account gate; learner = signed age-valid middleware token plus a valid active DB session checked by server pages/APIs; staff = client admin layout checks session plus server API authorization; city = signed city PIN cookie. An admin page shell is not itself a data permission boundary.

| Route | Source | Gate / feature status | Close-out owner |
| --- | --- | --- | --- |
| `/access` | [app/access/page.tsx](../app/access/page.tsx) | Public; implemented reassuring entry/login with tested validation and continuity | S0b / S1 |
| `/admin/audit` | [app/admin/audit/page.tsx](../app/admin/audit/page.tsx) | Staff; partial: real staff workflow, global dataset and recovery/audit gaps | S0b / S5 |
| `/admin/cases/[id]` | [app/admin/cases/[id]/page.tsx](../app/admin/cases/[id]/page.tsx) | Staff; partial: real staff workflow, global dataset and recovery/audit gaps | S0b / S5 |
| `/admin/cases` | [app/admin/cases/page.tsx](../app/admin/cases/page.tsx) | Staff; partial: real staff workflow, global dataset and recovery/audit gaps | S0b / S5 |
| `/admin/directory` | [app/admin/directory/page.tsx](../app/admin/directory/page.tsx) | Staff; partial: real staff workflow, global dataset and recovery/audit gaps | S0b / S5 |
| `/admin/finance` | [app/admin/finance/page.tsx](../app/admin/finance/page.tsx) | Staff; partial: real staff workflow, global dataset and recovery/audit gaps | S0b / S5 |
| `/admin/login` | [app/admin/login/page.tsx](../app/admin/login/page.tsx) | Public login; implemented form | S0b / S5 |
| `/admin` | [app/admin/page.tsx](../app/admin/page.tsx) | Staff; partial: real staff workflow, global dataset and recovery/audit gaps | S0b / S5 |
| `/admin/payouts` | [app/admin/payouts/page.tsx](../app/admin/payouts/page.tsx) | Staff; partial: real staff workflow, global dataset and recovery/audit gaps | S0b / S5 |
| `/admin/reports` | [app/admin/reports/page.tsx](../app/admin/reports/page.tsx) | Staff; partial: real staff workflow, global dataset and recovery/audit gaps | S0b / S5 |
| `/admin/staff` | [app/admin/staff/page.tsx](../app/admin/staff/page.tsx) | Staff; partial: real staff workflow, global dataset and recovery/audit gaps | S0b / S5 |
| `/admin/users` | [app/admin/users/page.tsx](../app/admin/users/page.tsx) | Staff; partial: real staff workflow, global dataset and recovery/audit gaps | S0b / S5 |
| `/app` | [app/app/page.tsx](../app/app/page.tsx) | Learner; partial: real curriculum/progress/profile/support with baseline gaps | S1 / S2 / S3 |
| `/austin` | [app/austin/page.tsx](../app/austin/page.tsx) | City; implemented proposal deck, not partner account membership | S4 |
| `/austin/unlock` | [app/austin/unlock/page.tsx](../app/austin/unlock/page.tsx) | Public; implemented city PIN form | S4 |
| `/dallas` | [app/dallas/page.tsx](../app/dallas/page.tsx) | City; implemented proposal deck, not partner account membership | S4 |
| `/dallas/unlock` | [app/dallas/unlock/page.tsx](../app/dallas/unlock/page.tsx) | Public; implemented city PIN form | S4 |
| `/denver` | [app/denver/page.tsx](../app/denver/page.tsx) | City; implemented proposal deck, not partner account membership | S4 |
| `/denver/unlock` | [app/denver/unlock/page.tsx](../app/denver/unlock/page.tsx) | Public; implemented city PIN form | S4 |
| `/houston` | [app/houston/page.tsx](../app/houston/page.tsx) | City; implemented proposal deck, not partner account membership | S4 |
| `/houston/unlock` | [app/houston/unlock/page.tsx](../app/houston/unlock/page.tsx) | Public; implemented city PIN form | S4 |
| `/lesson/[lessonId]` | [app/lesson/[lessonId]/page.tsx](../app/lesson/[lessonId]/page.tsx) | Learner; partial: real curriculum/progress/profile/support with baseline gaps | S1 / S2 / S3 |
| `/lifeline` | [app/lifeline/page.tsx](../app/lifeline/page.tsx) | Public crisis resources; signed session for submissions; partial: real curriculum/progress/profile/support with baseline gaps | S1 / S2 / S3 |
| `/login` | [app/login/page.tsx](../app/login/page.tsx) | Public; implemented reassuring entry/login with tested validation and continuity | S0b / S1 |
| `/los-angeles` | [app/los-angeles/page.tsx](../app/los-angeles/page.tsx) | City; implemented proposal deck, not partner account membership | S4 |
| `/los-angeles/unlock` | [app/los-angeles/unlock/page.tsx](../app/los-angeles/unlock/page.tsx) | Public; implemented city PIN form | S4 |
| `/` | [app/page.tsx](../app/page.tsx) | Public; partial: real landing plus scripted demos/claims review | S4 |
| `/paths/[pathSlug]` | [app/paths/[pathSlug]/page.tsx](../app/paths/[pathSlug]/page.tsx) | Learner; partial: real curriculum/progress/profile/support with baseline gaps | S1 / S2 / S3 |
| `/privacy` | [app/privacy/page.tsx](../app/privacy/page.tsx) | Public; implemented static policy text; legal accuracy unverified | S4 |
| `/profile` | [app/profile/page.tsx](../app/profile/page.tsx) | Learner; partial: real curriculum/progress/profile/support with baseline gaps | S1 / S2 / S3 |
| `/san-francisco` | [app/san-francisco/page.tsx](../app/san-francisco/page.tsx) | City; implemented proposal deck, not partner account membership | S4 |
| `/san-francisco/unlock` | [app/san-francisco/unlock/page.tsx](../app/san-francisco/unlock/page.tsx) | Public; implemented city PIN form | S4 |
| `/signup` | [app/signup/page.tsx](../app/signup/page.tsx) | Invitation or current session; implemented minimal signup with server-proven guest promotion | S0b / S1 |
| `/onboarding` | [app/onboarding/page.tsx](../app/onboarding/page.tsx) | New signed account; implemented program/privacy/optional-goal steps and reload recovery | S1 |
| `/recover` | [app/recover/page.tsx](../app/recover/page.tsx) | Public; implemented honest staff-assisted instructions; automated delivery/reset absent | S0b / S1 |
| `/terms` | [app/terms/page.tsx](../app/terms/page.tsx) | Public; implemented static policy text; legal accuracy unverified | S4 |

## API endpoints

Each source link is the exact handler. L = signed, unexpired, active and unrevoked DB learner session (`l2e_user_session`); A = valid active staff DB session (`l2e_admin_session`); public routes have no such session requirement. Rate limiting is in-process, not a distributed identity or partner boundary. No API is scoped by host/subdomain in middleware.

| Endpoint | Methods | Source | Access / behavior / status | Owner |
| --- | --- | --- | --- | --- |
| `/api/access` | POST | [handler](../app/api/access/route.ts) | Public code validation; sets demo-access cookie; implemented | S4 |
| `/api/admin/audit` | GET | [handler](../app/api/admin/audit/route.ts) | A + admin only; audit query, partial durability | S5 |
| `/api/admin/cases/[id]/allocate` | POST | [handler](../app/api/admin/cases/[id]/allocate/route.ts) | A (any active staff role), no partner filter; real query/CRUD, partial isolation | S5 |
| `/api/admin/cases/[id]/dispatch` | POST | [handler](../app/api/admin/cases/[id]/dispatch/route.ts) | A (any active staff role), no partner filter; real query/CRUD, partial isolation | S5 |
| `/api/admin/cases/[id]/notes` | POST | [handler](../app/api/admin/cases/[id]/notes/route.ts) | A (any active staff role), no partner filter; real query/CRUD, partial isolation | S5 |
| `/api/admin/cases/[id]` | GET, PATCH | [handler](../app/api/admin/cases/[id]/route.ts) | A (any active staff role), no partner filter; real query/CRUD, partial isolation | S5 |
| `/api/admin/cases` | GET, POST | [handler](../app/api/admin/cases/route.ts) | A (any active staff role), no partner filter; real query/CRUD, partial isolation | S5 |
| `/api/admin/cases/staff` | GET | [handler](../app/api/admin/cases/staff/route.ts) | A (any active staff role), no partner filter; real query/CRUD, partial isolation | S5 |
| `/api/admin/directory/[id]` | PATCH, DELETE | [handler](../app/api/admin/directory/[id]/route.ts) | A (any active staff role), no partner filter; real query/CRUD, partial isolation | S5 |
| `/api/admin/directory` | GET, POST | [handler](../app/api/admin/directory/route.ts) | A (any active staff role), no partner filter; real query/CRUD, partial isolation | S5 |
| `/api/admin/finance/payout-config` | GET, POST, PUT | [handler](../app/api/admin/finance/payout-config/route.ts) | A + admin/finance; real aggregates/config/pool; optional Stripe reads; partial audit/reporting | S5 |
| `/api/admin/finance/pool` | GET, POST | [handler](../app/api/admin/finance/pool/route.ts) | A + admin/finance; real aggregates/config/pool; optional Stripe reads; partial audit/reporting | S5 |
| `/api/admin/finance` | GET | [handler](../app/api/admin/finance/route.ts) | A + admin/finance; real aggregates/config/pool; optional Stripe reads; partial audit/reporting | S5 |
| `/api/admin/login` | POST | [handler](../app/api/admin/login/route.ts) | Public credential login; implemented, rate/lockout controls | S0b |
| `/api/admin/payouts` | GET, PATCH | [handler](../app/api/admin/payouts/route.ts) | GET: A; PATCH: transition-specific roles below; partial concurrency/audit | S5 |
| `/api/admin/session` | GET, DELETE | [handler](../app/api/admin/session/route.ts) | GET: A identity; DELETE: cookie clear, partial DB revocation | S0b |
| `/api/admin/staff/[staffId]` | PATCH | [handler](../app/api/admin/staff/[staffId]/route.ts) | A + admin only; staff list/create/update, implemented | S5 |
| `/api/admin/staff` | GET, POST | [handler](../app/api/admin/staff/route.ts) | A + admin only; staff list/create/update, implemented | S5 |
| `/api/admin/stats/activity` | GET | [handler](../app/api/admin/stats/activity/route.ts) | A (any active staff role), no partner filter; real query/CRUD, partial isolation | S5 |
| `/api/admin/stats/reports` | GET | [handler](../app/api/admin/stats/reports/route.ts) | A (any active staff role), no partner filter; real query/CRUD, partial isolation | S5 |
| `/api/admin/stats` | GET | [handler](../app/api/admin/stats/route.ts) | A (any active staff role), no partner filter; real query/CRUD, partial isolation | S5 |
| `/api/admin/stats/trends` | GET | [handler](../app/api/admin/stats/trends/route.ts) | A (any active staff role), no partner filter; real query/CRUD, partial isolation | S5 |
| `/api/admin/users/[userId]` | GET, PATCH | [handler](../app/api/admin/users/[userId]/route.ts) | A (any active staff role), no partner filter; real query/CRUD, partial isolation | S5 |
| `/api/admin/users` | GET | [handler](../app/api/admin/users/route.ts) | A (any active staff role), no partner filter; real query/CRUD, partial isolation | S5 |
| `/api/auth/login` | POST | [handler](../app/api/auth/login/route.ts) | Public email/password; learner + demo cookies; implemented, lifecycle partial | S0b |
| `/api/auth/register` | POST | [handler](../app/api/auth/register/route.ts) | Invitation or proven session; minimal credentials; guest upgrade/session rotation/audit atomic; implemented | S0b |
| `/api/auth/session` | GET, POST, DELETE | [handler](../app/api/auth/session/route.ts) | GET: minimal no-store identity/null; DELETE: current-session revocation; POST: L profile/progress/payout rules, legacy badge-copy gaps | S3 / S5 |
| `/api/chat` | POST | [handler](../app/api/chat/route.ts) | L + OpenAI binding; Hubert SSE; implemented integration, external operation unverified | S3 / S5 |
| `/api/city-access/[slug]` | POST | [handler](../app/api/city-access/[slug]/route.ts) | Public PIN validation; city-specific cookie and lockout; implemented | S4 |
| `/api/payout/request` | POST | [handler](../app/api/payout/request/route.ts) | L; rules/balance checks then insert; partial race and Zelle mismatch | S3 / S5 |
| `/api/progress/complete` | POST | [handler](../app/api/progress/complete/route.ts) | L + optional matching body ID; XP/progress; partial bonus authority/atomicity | S2 |
| `/api/progress/list` | POST | [handler](../app/api/progress/list/route.ts) | L; optional matching body ID; missing/expired session returns 401, never false zero progress; implemented | S2 |
| `/api/stress-signal` | POST | [handler](../app/api/stress-signal/route.ts) | L; creates high-priority case + best-effort audit; partial, no external dispatch | S3 / S5 |
| `/api/tts` | POST | [handler](../app/api/tts/route.ts) | L + OpenAI binding; MP3 stream + quota; implemented integration, external operation unverified | S3 / S5 |
| `/api/user/ensure` | POST | [handler](../app/api/user/ensure/route.ts) | Invitation for fresh server guest; current signed session resumes; caller IDs rejected; implemented | S0b |
| `/api/progress/open` | POST | [handler](../app/api/progress/open/route.ts) | L; published/content checks, last-opened upsert only; no XP | S1 |
| `/api/user/learning-plan` | GET, POST | [handler](../app/api/user/learning-plan/route.ts) | L; private local-day count, optional goal and own pathway preferences; no permission/award changes | S1 |
| `/api/user/onboarding` | POST | [handler](../app/api/user/onboarding/route.ts) | L account; idempotent completion and fixed optional goal; implemented | S1 |
| `/api/user/profile` | POST | [handler](../app/api/user/profile/route.ts) | L; profile update; implemented, no partner membership | S3 / S5 |

### Metadata, assets and absent route aliases

| Entry | Source / meaning | Close-out |
| --- | --- | --- |
| `/robots.txt`, `/sitemap.xml` | [robots](../app/robots.ts), [sitemap](../app/sitemap.ts), `NEXT_PUBLIC_SITE_URL`; implemented metadata | S4 |
| `/opengraph-image` | [generated OG image](../app/opengraph-image.tsx); implemented | S4 |
| `/favicon.ico`, `/icon.png`, `/apple-icon.png` | Files in `app`; implemented asset endpoints | S4 |
| `/images/...` | `public/images`, landing media/city images; implemented static assets | S4 |
| `/invest`, `/la`, `/help` | **Absent page routes**. `app/invest` contains CSS, Los Angeles is `/los-angeles`, help is the SOS dialog plus `/lifeline`. Do not infer aliases from old prose. | S4 / S3 |

City deck rendering is shared through [CityDeckPage](../app/components/CityDeck/CityDeckPage.tsx), unlock through [CityDeckUnlock](../app/components/CityDeck/CityDeckUnlock.tsx), with [city-deck CSS](../app/components/CityDeck/city-deck.css) and six configs: [Austin](../app/components/CityDeck/configs/austin.tsx), [Dallas](../app/components/CityDeck/configs/dallas.tsx), [Houston](../app/components/CityDeck/configs/houston.tsx), [Denver](../app/components/CityDeck/configs/denver.tsx), [Los Angeles](../app/components/CityDeck/configs/los-angeles.tsx), [San Francisco](../app/components/CityDeck/configs/san-francisco.tsx). These are proposals behind PINs, not evidence that those cities are customers or isolated tenants. Print behavior is in [CityDeckPrintButton](../app/components/CityDeck/CityDeckPrintButton.tsx).

## Runtime, hosts, sessions and roles

[Middleware](../middleware.ts) uses optional `ROOT_DOMAIN`: www → apex; apex sends learner/admin paths to app/admin hosts; app/admin roots route to `/app`/`/admin`; city decks remain on apex. Redirects use 301 for host routing. API paths bypass host restrictions. Without the variable, host splitting is a no-op. Legal `/privacy` and `/terms` now remain reachable on each recognized host for the account journey. Unknown non-city/non-learner/non-admin paths still follow the existing host policy. Actual host/DNS settings remain unverified.

| Mechanism | Actual behavior / source | Status |
| --- | --- | --- |
| Learner credentials | bcrypt register/login; [login](../app/api/auth/login/route.ts), [register](../app/api/auth/register/route.ts) | Implemented credentials and signed guest continuity; automated recovery delivery absent |
| Learner identity | [user-session](../lib/user-session.ts): HMAC of user ID + timestamp + random nonce; `l2e_user_session`, HttpOnly, SameSite Lax, Secure in production, cookie max-age 30 days. Verifier enforces age and checks the new hashed `LearnerSession` row, active account, DB expiry and revocation. Legacy guest compatibility is bounded; registered legacy cookies require sign-in. | Implemented |
| Learner page gate | Middleware verifies age/signature; private server pages require DB session and resume pending onboarding. APIs independently authorize the session. Help remains public. | Implemented |
| Demo access | [access token](../lib/access-token.ts), [access API](../app/api/access/route.ts): code gate, signed timestamp with 30-day validation; `l2e_demo_access`, optional app-host domain. Private SESSION_SECRET is required; unconfigured program access fails honestly. | Implemented |
| City access | [city-access](../lib/city-access.ts): six `l2e_<slug>_access` cookies, HMAC with 30-day verification; Austin PIN separate, five other cities share PIN variable. | Implemented proposal gate; no membership |
| Staff identity | [admin-auth](../lib/admin-auth.ts): bcrypt, five failed attempts → 15-minute account lock, random token in `AdminSession`, eight-hour DB expiry, inactive accounts rejected. Cookie is **`l2e_admin_session`**, not documentation's `admin_session`; opaque session, not JWT. | Implemented |
| Staff logout | [session DELETE](../app/api/admin/session/route.ts) clears cookie, but does not call the available `adminLogout` helper to delete its DB session. | Partial |
| Client hints | Legacy identity flags are never read as proof; only removed on logout. Small private session GET and server queries drive navigation/progress. | Implemented |
| Partner/organization membership | No Partner, Organization, ProgramMembership or staff-to-partner relation in schema. `User.city` is free text, `PayoutConfig.programSlug` is rate selection, case assignment is workflow assignment. No scoped partner filter on staff queries. | Absent |

Staff `role` is a string defaulting to `caseworker`; staff creation accepts `admin`, `caseworker`, `finance`. `requireRole` is exact membership, not hierarchical. Audit/staff management is admin-only; finance/config/pool accepts admin/finance; other user/case/directory/stats APIs generally accept any active staff. Navigation hides some actions, but the API rules above are the actual boundary. No assumption that hidden navigation supplies missing isolation.

## Data and curriculum model

All models below come from [schema.prisma](../prisma/schema.prisma). PostgreSQL is the only application database; Prisma client is reused through [lib/prisma](../lib/prisma.ts). JSON-like metadata is frequently serialized text, not a separate CMS. IDs and scoped slugs must be retained.

| Model | Purpose / important relations and constraints | Status |
| --- | --- | --- |
| Path | Active ordered journey; unique slug, metadata; has modules | Implemented |
| Module | Path FK; unique `(pathId, slug)`; ordered lessons | Implemented |
| Lesson | Module FK; unique `(moduleId, slug)`; reward, active flag, type/lessonType, minutes/objectives | Implemented |
| Card | Lesson FK; prompt/body/media/choices/answer/explain, ordered type/subtype/difficulty/tags/hint | Implemented; specialized interaction depth partial |
| User | Optional unique email/guestId, bcrypt password, profile/consent, XP/hearts/streak and badges; no partner FK | Partial identity/tenancy |
| Progress | User+lesson FK, unique `(userId, lessonId)`, XP/crown/completedAt plus score/time/reflection/missed-card fields | Partial; not a durable attempt/checkpoint system |
| PayoutRequest | User FK; XP/dollar snapshot, nullable method/handle, string status; staff reviewer/approver and timestamps/decision note | Partial money/audit concurrency |
| PathSelection | Composite user/path preference and selection timestamp | Implemented My paths; no enrollment/access boundary |
| LessonVisit | Composite user/lesson last-opened timestamp | Implemented opened state; no answer/card-position/XP evidence |
| LearnerSession | Hashed nonce-bearing cookie, user relation, original expiry/revocation, user/expiry indexes | Implemented learner identity; additive migration required |
| AdminUser | Unique email, password, role, active/lockout fields; sessions/cases/audit relations | Implemented staff identity |
| AdminSession | Unique opaque token, admin FK, expiresAt | Partial logout revocation |
| Case | User FK, optional staff assignee; status/priority/message/location | Implemented shared case queue |
| CaseNote | Case+staff FKs, type/text/time | Implemented |
| ResourceAllocation | Case+staff FKs, resource type/quantity/notes | Implemented record, not external fulfillment |
| ServiceDirectory | Shared service/category/contact/hours/site, active flag | Implemented shared directory |
| AuditLog | Optional staff FK, action/entity/id/details/IP/time; helper catches failures | Partial; application convention, not DB-enforced immutability |
| ConsentRecord | User FK, type/version/granted/IP/time | Implemented capture |
| PayoutConfig | Unique programSlug, active rate/minimum/weekly cap; not membership | Implemented rate config |
| PoolBalance | Singleton integer cents balance, updater ID string | Implemented manual accounting |
| PoolAdjustment | Staff FK, signed integer cents, reason/time | Implemented manual accounting; audit durability partial |

The `PaymentMethod` enum includes `zelle`, `venmo`, `paypal`, `cashapp`, `check`. Neither payout statuses nor staff roles are Prisma enums. Many user/curriculum relations use cascade deletion: preserve historical identity and do not use deleting/reseeding as an upgrade strategy.

Curriculum is source-seeded by [seed.ts](../prisma/seed.ts), [seed-recovery.ts](../prisma/seed-recovery.ts) and [recovery expansion types](../prisma/recovery-expansions/types.ts). Per [.agents guidance](../.agents/memory/curriculum-content-audits.md), do not use `curriculum-full.md` or README's old counts as current evidence. No new production curriculum count is asserted here.

- Lesson modes: `learn`, `checkpoint`, `capstone` in seed metadata; `type` and `lessonType` coexist as strings. Existing guidance targets 5–7, 8–12 and 10–15 cards respectively; these are authoring targets, not verified totals.
- Card types in seeds/expansions: `INFO`, `MULTIPLE_CHOICE`, `TRUE_FALSE`, `SCENARIO`. INFO subtypes `MISSION` and `REFLECTION` derive from prompt prefixes; **REFLECTION is not a distinct card type** here.
- [LessonPlayer](../app/lesson/[lessonId]/LessonPlayer.tsx) renders INFO as content and other types with choice/check/feedback behavior. Answer keys arrive with the lesson client payload; client evaluates answers and sends completion/bonus claims. No server-side attempt/answer verification or durable in-progress resume model exists.
- XP/progress, module completion, badges and streak/freezes are implemented but partial because award authority, atomicity, duplicate feedback and interruption handling remain defective. Five wrong answers produce the hearts-depleted barrier. No competitive ranking or separate LMS service was found.

## Incentives and payout lifecycle

[getPayoutRules](../lib/payout-rules.ts) chooses active config by normalized learner city slug, then active `default`, then constants (20 XP minimum, $0.05/XP, rolling weekly cap 500 XP). Actual stored program configuration can override those numbers. Do not change economics or backfill balances based on copy. [Request handler](../app/api/payout/request/route.ts) reserves XP logically by summing every non-rejected request; cap uses requests created within seven days, not a calendar-week reset. It snapshots `dollarAmount` at request time. Separate aggregate reads followed by insert provide no serialized reservation.

| From → to | Action | Allowed actor | Meaning |
| --- | --- | --- | --- |
| No request → pending | learner request | Signed learner, eligible balance/config/profile | Request/reservation only; no transfer |
| pending → reviewed | review | admin / caseworker | Reviewed by staff |
| pending or reviewed → rejected | reject | admin / finance / caseworker | Excluded from XP reservation/cap sums |
| reviewed → approved | approve | admin / finance | Approval, **not payment sent** |
| approved → completed | complete | admin / finance | Staff marks complete, no payment provider confirmation enforced |
| completed/rejected → other | none | No allowed transition | Terminal in handler |

[Admin payout handler](../app/api/admin/payouts/route.ts) implements the transition table using read-then-update, followed by best-effort audit; no compare-and-set/transaction protects concurrent transitions. [Admin payout UI](../app/admin/payouts/page.tsx) creates payment deep links for PayPal/Venmo/Cash App, supports manual Zelle display, CSV export and clipboard. These links do not prove a transfer. Stripe balance/account reads in [finance API](../app/api/admin/finance/route.ts) and [finance page](../app/admin/finance/page.tsx) are separate from actual disbursement. Pool adjustments are manual records, not deposits to a bank. Approved and completed statuses are mixed in some finance totals; payout-volume trends select completed only. Preserve these distinctions in later changes.

## External services and environment names

No private environment values, auth tokens, cookie contents, private connection URLs or learner records are included here. Presence/configuration in Replit is unknown. The audit server explicitly disabled external AI/payment bindings.

| Service | Source and actual usage | Classification |
| --- | --- | --- |
| PostgreSQL | Prisma datasource and all persistent models | Implemented; local test verified, production uninspected |
| OpenAI | [chat](../app/api/chat/route.ts): streaming `gpt-4o-mini`; [tts](../app/api/tts/route.ts): `gpt-4o-mini-tts`, MP3, per-user process quotas | Implemented integration; external response unverified |
| Stripe | Finance balance/account retrieval in API/server page; optional binding | Partial finance integration; no payment dispatch here |
| GitHub | [Octokit helper](../lib/github.ts) exists; no app caller found. Git origin supports reads; API access currently forbidden | Partial helper / collaboration separate from app runtime |
| Google Fonts | [layout](../app/layout.tsx) Next font imports for Inter, Share Tech Mono, Rajdhani | Implemented build-time network requirement |
| Payment apps | Payout UI deep links; manual staff complete action | Partial/manual workflow, not automatic settlement |
| Crisis/support contacts | [HelpButton](../app/components/HelpButton.tsx), [Lifeline](../app/lifeline/page.tsx), Hubert prompt: tel/SMS links | Implemented links; contact currency/clinical content need review |
| Staff dispatch | Case dispatch/allocate endpoints write DB notes/assignments; no outbound dispatch service | Implemented records; external dispatch absent |
| Public demos | [AppDemo](../app/components/AppDemo.tsx), [AdminDemo](../app/components/AdminDemo.tsx) use timers/sample balances/users | Demo-only; never count as impact or real transactions |
| Partner intake | Existing mailto/hash navigation in landing/footer; no persisted partner application endpoint | Partial contact journey; intake backend absent |
| Offline learning/sync, partner membership, verified provider settlement | No corresponding implementation found | Absent |

| Variable names (names only) | Read by / purpose |
| --- | --- |
| `DATABASE_URL` | Prisma datasource; require verified disposable connection for reset/seeding/tests |
| `TEST_DATABASE_ADMIN_URL` | Local maintenance binding for creating/dropping fresh test databases/roles |
| `DATABASE_URL_TEST`, `TEST_DATABASE_NONCE` | Transient harness bindings; reset/fixtures verify ownership and server marker |
| `RELEASE_OPERATION`, `RELEASE_DATABASE_NAME` | Internal transient release-child intent, derived from explicit command/confirmation |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE` | Optional local system Chromium executable |
| `SESSION_SECRET`, `DEMO_ACCESS_CODE` | Private learner/demo signing key (required) and program invitation code (not a signing key) |
| `AUSTIN_ACCESS_PIN`, `CITY_ACCESS_PIN` | Dynamic city PIN lookups in city-access and middleware; shared PIN for non-Austin cities |
| `ADMIN_BOOTSTRAP_EMAIL`, `ADMIN_DEFAULT_PASSWORD` | Explicit first-admin command only; neither is consumed by ordinary builds/start |
| `ROOT_DOMAIN`, `ALLOWED_DEV_ORIGINS` | Host/cookie routing and Next allowed origins |
| `NEXT_PUBLIC_SITE_URL` | Metadata/layout/page/robots/sitemap |
| `OPENAI_API_KEY`, `TTS_DAILY_CHAR_CAP` | Chat/TTS binding and daily character quota |
| `STRIPE_SECRET_KEY` | Optional finance account/balance reads |
| `GITHUB_TOKEN` | Octokit helper only; native Git proxy auth need not use this variable |
| `NEXT_DIST_DIR`, `NODE_ENV` | Build output separation, runtime/cookie behavior |
| `E2E_PORT`, `PLAYWRIGHT_BASE_URL`, `E2E_SESSION_SECRET` | Playwright server/base URL/session settings |
| `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`, `E2E_CITY_PIN`, `E2E_CITY_SLUG` | HTTP fixture selectors/credentials; use only synthetic accounts |
| `TEST_ADMIN_EMAIL`, `TEST_ADMIN_PASSWORD`, `TEST_CASEWORKER_EMAIL`, `TEST_CASEWORKER_PASSWORD` | Legacy browser fixture credentials |

## Replit, scripts and documentation mismatches

No `.replit` or `replit.nix` is tracked or present in this checkout; [.gitignore](../.gitignore) excludes `.replit` and `replit.md`. Therefore **actual Replit run/build/deployment commands, Secrets, machine modules and configured external port remain unknown**. Git history saying “Published your App” is not live configuration evidence. Do not claim the repository package scripts are definitely selected in Replit. A read-only review of the current Replit configuration is still required before deployment changes.

| Source | Executable behavior / mismatch | Impact and next action |
| --- | --- | --- |
| [package scripts](../package.json) | `dev`: Next dev; `start`: Next start; both bind 0.0.0.0:5000. README says 3000. | Fix docs; verify Replit selected scripts/port separately |
| `build` | Prisma generation → isolated Next build; unusable build-only DB binding; default lint/types enabled | Fixed repository workflow; `release:migrate`, `release:content` and `release:bootstrap-admin` are separate confirmed operations |
| [historic migration script](../prisma/fix-migration.ts) | Now read-only count/state inspection; no history mutation; failure exits nonzero | Exact original artifacts/effects and restore verification required before any separate migrate resolve operation |
| [post-merge helper](../scripts/post-merge.sh) | Now `npm ci` and Prisma generation only | No schema/content/account writes |
| Tracked migrations | Earliest migration ALTERs tables; initial schema creation missing; later Zelle and config migrations are additive | Fresh DB baseline differs from deployed history; no repair/seed against production |
| README/admin seed | Examples now tracked; deliberate bootstrap requires ADMIN_BOOTSTRAP_EMAIL / ADMIN_DEFAULT_PASSWORD and empty staff table | No implicit admin creation/reset; existing staff require authenticated management/reviewed recovery |
| Payout copy | README now describes configured conversion/fallback; public page/badges/demos still embed fixed-dollar claims | Remaining S3/S4 work; economics unchanged |
| [DEPLOYMENT](../DEPLOYMENT.md) | Now documents DB-backed `l2e_admin_session` and HMAC learner tokens, actual names/ports and release sequence | Live Replit setting verification still external |
| [Next config](../next.config.ts) | Build suppressions removed; type and lint defects repaired | Build + independent lint/type gates now required |
| [ESLint config](../eslint.config.mjs) | Ignores both `.next` and `.next-e2e` output | Source lint remains enforced, generated-output false positives fixed |
| Test setup | Harness creates a random DB/restricted role and nonce marker; helpers/reset require matching bindings + server ownership/capability checks | No application URL fallback, remote targets refused, per-suite cleanup; no production credentials in CI |
| [accessibility doc](accessibility.md) | Typecheck script now exists; historical route aliases/implicit bypass claims still need correction | Full WCAG/browser audit remains separate; old checkmarks are not new evidence |

## Risk priority before redesign

Prioritize identity and money correctness, then truthful feedback/resilience, then visual polish. The baseline's B01–B14 remain open. Newly verified items and source-review details are tracked in [baseline audit addendum](upgrade-baseline.md#audit-pack-refresh).

1. **Learner identity fixes implemented locally:** B17 arbitrary-ID bootstrap/merge and B20 age/revocation are addressed by the learner-journey stage. Rollout still needs the additive migration and legacy registered re-entry. B18 staff logout revocation remains open.
2. **High financial integrity:** client claims change XP, progress/XP writes are separate, balance reservation/approval transitions can race, audit write can fail independently. These are not cosmetic tasks. Fault/concurrency reproduction remains required; do not claim observed production loss.
3. **High trust/recovery:** perfect-run breakdown disagreement, replay award fallback, heart barrier and silent failures; Zelle offered but rejected; rates vary by configured program.
4. **High boundary decision:** no explicit partner membership isolation. Appropriate for a single shared program only if that is intentional; must be designed before promising isolated partner portals. No speculative tenancy migration in this stage.
5. **Medium engineering/operations:** repository type/lint gates, generated-output exclusion and build-time mutation issues are fixed in the workflow stage. Production host legal-route behavior and broader coverage remain pending. New Chromium smoke tests cover learner login/path/lesson and staff login/dashboard, not a complete UX/security/accessibility suite.

Current safety/quality work does not change balances, rewrite curriculum, replace styling, fabricate impact or ship simulated actions. New schemas and historical reconciliations require focused, additive designs after the baseline.
