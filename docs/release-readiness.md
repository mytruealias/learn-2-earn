# Release readiness — 2026-11-02

**NO-GO for a Replit deployment, live enrollment or incentive rollout.** Code review can proceed, but the required production build, authenticated integration/journeys, migration/restore rehearsal and operational approvals have not passed. This is a release preparation report, not a deployment approval, compliance certification or evidence of funds transferred.

Branch: `feat/release-readiness`, based on `edf3fa89032e35f4bbdc4d83e708280d95cda112` (`feat/accessibility-reliability`). GitHub main was verified at `4f59d419528ae5ff450b339ab1de512554a8094b`; previous upgrades are still on feature branches. The intended PR targets **main and includes the complete upgrade**, not only this final checkpoint. The immutable application candidate is `64c44367df821d01510b61a3cd04cd2cdd11898d`, pushed and confirmed with native Git; the actual PR outcome is recorded below. No Replit checkout, deployment, production database, live conversation or real payment was accessed.

[Every route/state](accessibility-reliability/routes.md) · [current architecture](current-architecture.md) · [stage status](upgrade-status.md) · [current evidence/index](release-evidence/README.md) · [exact changed files](release-evidence/files.md).

## What this pass changed

- Updated Next.js and its ESLint configuration from 15.5.15 to **15.5.28**, staying on the established framework release line. Targeted overrides select PostCSS 8.5.32, Nano ID 3.3.20, source-map-js 1.2.2 and sharp 0.35.5. The lockfile includes corresponding native image/SWC packages. No React, Prisma, Zod or provider major upgrade was attempted.
- Removed eager database initialization from pure staff authenticator/encryption utilities. The actual throttle still requires a supplied transaction or the real PostgreSQL client, with no memory fallback. All 76 existing unit tests can now execute, including RFC 6238, authenticated encryption/tamper detection, recovery-code hashing and CSV protection.
- After an inquiry receipt replaces its form, keyboard focus and scrolling move to the named receipt. Viewport inspection prompted a live visibility assertion; the retry uses the keyboard and requires the receipt in view before full-page capture can alter scrolling. The receipt still confirms storage only. The browser regression checks focus explicitly; no delivery or booking was added.
- Added `test:release:public` and a browser-selectable public release configuration. It covers the existing marketing suite plus keyboard/offline human help at four widths and the real Next image endpoint using the patched native dependency. Updated a stale test-serialization comment and the current staff-logout documentation.
- Non-JSON framework/proxy 5xx responses now remain failures but become generic JSON for JSON callers; raw HTML/parser exception text is not presented as support feedback. The failure status, correlation headers and retry policy remain intact. The final Help captures wait for the actual unavailable state.
- CI can run on this release branch or manual dispatch, adds the public release check and retains the high-advisory audit as a failing gate. It uses only disposable PostgreSQL/test bindings; remote execution is unverified.
- No schema, seed, financial entitlement, account/curriculum identifier or payout-method change was made in this checkpoint. The cumulative upgrade still requires its existing additive migrations and reviewed backfills.

## Executed checks

The frozen install used the final dependency lockfile and cleared application/database/provider/operator bindings. Test provisioning uses only the existing private loopback maintenance binding; the native client failed before the guarded integration/browser harness could provision its fresh databases. No reset was pointed at a development or production connection. [Command evidence](release-evidence/commands.json) distinguishes initial failures from final reruns.

| Gate | Current result | Limit |
| --- | --- | --- |
| Clean install | Passed: `npm ci --include=dev`, 14.71 seconds after the targeted updates | Installation is not successful code generation. Earlier pre-update clean install also passed. |
| Prisma generation | Failed, exit 1: pinned native engine checksum download returns HTTP 403 | No TLS/checksum bypass, mirror or replacement client. |
| Lint | Passed with `--max-warnings=0` | Includes the release browser/configuration and staff/inquiry changes. |
| Type check | Failed, exit 2 | Generated Prisma exports are missing and cause dependent inference failures. Remaining diagnostics must be reassessed after generation; no type pass claimed. |
| Safe production build | Failed, exit 1 at Prisma generation | Next production compilation/start and production route measurements are unrun. Build does not migrate, seed, repair history or provision staff. |
| Unit | Final: **76 passed in eight files** | Initial 72-pass/one-import-failure result was diagnosed and fixed without mocking the database client. These are logic/security tests, not DB integration. |
| API integration | Failed before tests, exit 1 | All current identity/lesson/reward/program/support/migration tests remain a release gate. |
| Guarded HTTP/browser/journey/progression/lesson/rewards/staff/support suites | Each attempted; each failed before tests, exit 1 | No current successful real signup, completion, payment-recording, acknowledgment or cross-program browser proof. |
| Authored card audit | Passed: 1,502 definitions; teaching/question/scenario/reflection adapters preserved | Includes expansion slots; not a deployed lesson/card count or clinical approval. |
| Public release browser | **15 passed, one explicit missing-client skip**; [captures](release-evidence/README.md) | Uses an unusable DB; configured receipt UI uses explicit synthetic interception. It does not prove receipt persistence. |
| Reliability contracts/browser | 16 contracts and 11 Chromium cases passed | Mocked/unavailable client states and public routes; native authorization/DB/provider paths remain blocked. |
| Runtime dependency audit | Seven affected packages before → **one high, zero critical** after | Zod remains unresolved; not a clean security audit. |
| Full dependency audit | **22 findings: four high, 18 moderate** after updates | Includes tooling chains and the runtime Zod finding. Do not use `audit fix --force` suggestions that downgrade/change major tools. |
| Second browser | Firefox installation attempted in a writable browser cache; download HTTP 403 | No second-browser execution or cross-engine pass claimed. |
| Backup/restore | **Not executed** | `pg_dump`/`pg_restore` absent. Local test server is PostgreSQL 18.4; client-18 package unavailable in configured apt metadata, official source download blocked. A version-compatible verified client is required. |
| Migration/balance/membership reconciliation | **Blocked**, not complete | Existing exact migration/backfill tests could not run without Prisma. Historical SQL/service evidence is not a new full rehearsal. |
| Production performance/remote CI/live Replit | Unverified | No field telemetry, production Web Vitals, actual host commands, remote workflow result or deployed commit is asserted. |

Public rendering was checked at **360, 390, 768 and 1440 px** in Chromium 154.0.8037.57 with reduced motion. Current screenshots cover public templates, fictional sample, illustrative staff preview, synthetic receipt/error UI, deterministic human help, city gates/presentations and staff client error states. Actual images were inspected, not only axe scores. Missing-client server errors and deliberately unavailable API responses remain visible in development logs; they are not reported as a console-clean production pass. Four human-help cases assert zero unhandled page errors.

One focused Help run reusing the marketing output hit a Next development JSON error; its failure is retained. The release configuration now isolates `.next-release-tests`; a fresh full run and a warm focused repeat pass. The exact cause of the earlier development error is not conclusively established, and this is not a production stability claim. Full-page fixed-layer artifacts are checked against actual viewport screenshots/live focus geometry.

The loaded learner home/path/lesson/practice/profile/rewards, finance, real staff records, long participant/program names and high-volume datasets require the blocked isolated suites. Their prior-stage screenshots are historical; they do not substitute for current rendering after the dependency update. Current mocked errors, empty/demo data and selected automated accessibility checks do not establish full route coverage. Native screen-reader speech, browser UI zoom, physical-device safe areas/keyboard and positive audio playback remain open. Root text enlargement and accessibility-tree inspection are separate, narrower checks.

## Required journey close-out

| Journey | Current evidence | Exact next gate |
| --- | --- | --- |
| Public CTA → inquiry receipt | CTA/validation/retry/named receipt focus tested in browser with synthetic response | `tests/api/partner-inquiry.test.ts` plus a real browser submission into a synthetic configured program; verify one stored inquiry/audit and no claimed email/booking. |
| Access → signup/login → home → lesson → progress | Source and existing guarded tests; current execution blocked | `test:journey`, `test:browser`, `test:lesson`; real UI, persisted account/attempt/completion and authoritative XP. |
| Interrupted lesson → resume | Existing lesson suite; current execution blocked | Reload/back/account-switch and lost-response cases in `test:lesson`; position and answers must match the authenticated server attempt. |
| Practice without duplicate reward credit | Existing lesson/reward tests; current execution blocked | Compare unique Progress, RewardAccount and RewardEntry before/after practice and replay; no new cash entitlement. |
| Request → review → approval → recorded payment | Existing reward UI/API suites; current execution blocked | `test:rewards`, payout API concurrency/role/migration cases. Supported disbursement is **manual**; marking a verified synthetic payment sends no funds. Approval alone must not appear paid. |
| Help request → authorized acknowledgment | Public human help works with unavailable account service; stored intake blocked | `test:support`, staff/API cases: one idempotent case, actual authorized staff acknowledgment, no notification/dispatch claim. |
| Logout/session expiry/re-entry | Current synthetic staff back/reload/failed-sign-out checks pass | Real learner/staff expiry/revocation/guest-association cases via `test:journey`, API and staff suites. |
| Cross-program denial | Existing scoped API/staff negatives; current execution blocked | Direct IDs, exports, aggregates, changed city, revoked membership, wrong roles and public/demo isolation on two synthetic programs. |

After restoring downloads, run the documented suites sequentially, then repeat major loaded surfaces at all four widths in Chromium and installed supported Firefox. Capture every major surface with synthetic names/handles only. Include empty/error/long-name/many-record states, keyboard-only controls, optional audio off and reduced motion. A failed, skipped or zero-test suite never closes a row.

## Dependency advisory decision

On 2026-11-02 the npm registry audit and the linked GitHub advisory/release pages were retrieved successfully. `nextjs.org` was inaccessible; this report uses retrieved primary project releases and GitHub Reviewed advisory data, not an unavailable blog. [Snapshot and exact lockfile differences](release-evidence/dependencies.json).

| Package / decision | Source and applicability |
| --- | --- |
| Next 15.5.28 | [Official release](https://github.com/vercel/next.js/releases/tag/v15.5.28); [App Router DoS](https://github.com/advisories/GHSA-p3m5-59mp-jv5r). Audit also identified middleware bypass, image, cache and other issues in the prior release. Conditions differ; not every finding is exploitable here. Keeping an affected framework was unwarranted. |
| PostCSS 8.5.32 | [Source-map disclosure fix](https://github.com/advisories/GHSA-fxqj-rqcc-2cmp). No public CSS-import feature was found; build inputs still deserve patched parsing. Override remains within major 8. Full production CSS compilation still needs the build gate. |
| Nano ID 3.3.20 / source-map-js 1.2.2 | [Generator issue](https://github.com/advisories/GHSA-2v37-7h3g-55p8), [source-map DoS](https://github.com/advisories/GHSA-68fv-2mgg-jv7q). Targeted same-major fixes, not a replacement ID scheme. |
| sharp 0.35.5 | [Maintainer advisory](https://github.com/advisories/GHSA-wq5f-xc86-pv6w), [official release](https://github.com/lovell/sharp/releases/tag/v0.35.5). This is an intentional pre-1.0 minor change for patched image libraries. The actual Next optimizer returns an image and rejects invalid sizing in the current browser suite; a production image/build check remains required. |
| Zod 3.25.76 retained — **blocker** | [Advisory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) lists affected versions below 4.6.6; the registry exposes no 3.x backport. Ordinary JSON already has a 64 KiB/5-second bound, with smaller chat/intake caps and bounded array schemas. This narrows exposure but is not a waiver. A reviewed supported backport or tested Zod 4 migration plus every API/schema contract is required. A blind major override would change validation semantics while integration verification is unavailable. |

Full-audit tooling findings, Node/OS/native-library patching and host inventory need release-owner review. Re-run audits close to release; snapshots are time-bound. No security certification or exhaustive exploit assessment is implied.

## Environment contract and Replit commands

No values are included. Configure only reviewed private bindings; distinguish build, runtime, operator and disposable tests.

Infrastructure work: restore approved access to `binaries.prisma.sh` for the pinned engine/checksum and the official Playwright download destinations (the failed artifact used `playwright.download.prss.microsoft.com`); allow supported GitHub PR API access to `api.github.com` for this repository. Preserve existing network rules rather than replacing an unknown allowlist. Provide verified PostgreSQL backup clients matching the source server. No new secret value or TLS/checksum bypass is requested.

| Exact names | Scope / requirement |
| --- | --- |
| `DATABASE_URL`, `SESSION_SECRET`, `STAFF_MFA_ENCRYPTION_KEY` | Required runtime DB, stable shared signing secret and 64-hex staff MFA encryption key. Verify target/secure storage privately; preserve recovery access and encrypted key backups. |
| `DEMO_ACCESS_CODE`, `AUSTIN_ACCESS_PIN`, `CITY_ACCESS_PIN` | Reviewed program/demo and presentation gates. Not identity, staff authorization or tenant boundaries. |
| `ROOT_DOMAIN`, `NEXT_PUBLIC_SITE_URL` | Optional host/canonical contract. Verify actual owned HTTPS origin and apex/app/admin routing; unset ROOT_DOMAIN for local preview. |
| `PROGRAM_TIMEZONE` | Optional IANA fallback; stored learner timezone takes priority, otherwise UTC. |
| `OPENAI_API_KEY`, `HUBERT_APPROVED_POLICY_VERSION`, `HUBERT_REVIEW_REFERENCE`, `TTS_DAILY_CHAR_CAP` | Optional AI/cloud voice; leave approval/provider configuration off until genuine qualified review and privacy/region verification. |
| `STRIPE_SECRET_KEY` | Optional existing read-only finance integration. It does not implement automated Zelle, Venmo or other payout transfers. |
| `PARTNER_INQUIRY_PROGRAM_ID`, `PARTNER_INQUIRY_TEAM_NAME`, `PARTNER_INQUIRY_MONITORING_NOTICE`, `PARTNER_INQUIRY_REVIEW_REFERENCE` | Optional inquiry queue; off until an active configured program, MFA-enrolled administrators, real monitoring and reviewed privacy/retention exist. No email/calendar delivery. |
| `OPERATIONAL_TELEMETRY_ENABLED` | Optional default-off first-party technical reports. Reviewed setting must agree at build/runtime; no chat, answers, financial details, exception text or offline report queue. |
| `ALLOWED_DEV_ORIGINS`, `NEXT_DIST_DIR`, `NEXT_TELEMETRY_DISABLED`, `NODE_ENV` | Development/build/framework controls. Do not point deployment at a test output directory. Runtime NODE_ENV is production. |
| `ADMIN_BOOTSTRAP_EMAIL`, `ADMIN_DEFAULT_PASSWORD`, `ADMIN_BOOTSTRAP_ORGANIZATION_NAME`, `ADMIN_BOOTSTRAP_PROGRAM_NAME` | Temporary deliberate first installation only; refuses any existing staff. Never configure routine deployment to recreate/reset an admin. |
| `STAFF_PROVISION_PASSWORD`, `STAFF_RECOVERY_PASSWORD` | Temporary verified operator provisioning/recovery only; remove afterward. |
| `RELEASE_OPERATION`, `RELEASE_DATABASE_NAME` | Set internally by explicit target-confirmed release CLIs, not routine runtime bindings. |
| `GITHUB_TOKEN` | Optional application Octokit helper; not required for builds or existing native platform Git access. No new token requested. |
| `TEST_DATABASE_ADMIN_URL`, `PLAYWRIGHT_CHROMIUM_EXECUTABLE`, `E2E_PORT`, `PLAYWRIGHT_BASE_URL` | Local disposable provisioning/browser controls only. Remote/pre-existing application servers are refused by the guarded harness. |
| `DATABASE_URL_TEST`, `TEST_DATABASE_NONCE` | Generated per-run capabilities; matching URLs, loopback, ownership and restricted-role checks are mandatory before fixtures/reset. Never persist a production binding here. |
| `PGSERVICE`, `PGSERVICEFILE`, `PGPASSFILE`, `PGSSLMODE` | Operator backup/restore connection settings only. Use verified source/destination services, restricted password files and provider-approved TLS; never copy filled files here. |
| `RELEASE_BROWSER`, `PLAYWRIGHT_BROWSERS_PATH`, `MARKETING_EVIDENCE_DIR`, `RELEASE_EVIDENCE_DIR`, `RELIABILITY_EVIDENCE_DIR` | Release browser choice/cache and output paths. Firefox requires the Playwright-supported binary; stock Firefox is not claimed equivalent. |
| `DESIGN_EVIDENCE_DIR`, `JOURNEY_EVIDENCE_DIR`, `PROGRESSION_EVIDENCE_DIR`, `LESSON_EVIDENCE_DIR`, `REWARDS_EVIDENCE_DIR`, `STAFF_EVIDENCE_DIR`, `SUPPORT_EVIDENCE_DIR`, `PROGRAM_EVIDENCE_DIR` | Optional synthetic evidence directories for existing guarded suites; no production information. |

Verified **repository command definitions**, not live Replit configuration:

| Setting | Command / binding | Current verification |
| --- | --- | --- |
| Install | `npm ci --include=dev` | Fresh install passed with integrity verification and no DB mutation. |
| Development | `npm run dev` → `next dev -p 5000 -H 0.0.0.0` | Source verified; current tests start their own isolated development servers. |
| Deployment build | `npm run build` → Prisma generation then `tsx scripts/build.ts` | Safe binding/provider suppression reviewed; actual command stops at pinned checksum HTTP 403. |
| Deployment start | `npm start` → `next start -p 5000 -H 0.0.0.0` | Source verified; current production artifact/start unavailable. |

There is no inspectable `.replit`/`replit.nix`. Actual Replit Node version, selected development/deployment commands, port forwarding, Secrets, domain, ingress headers, logging and existing workspace edits are **release blockers**. Do not call them verified from package.json. No generated replacement Replit configuration was committed.

## Migration, reconciliation and restore order

This checkpoint adds no migration. The cumulative upgrade includes the following actual directories, in order:

1. `20250406000000_curriculum_schema_upgrade`
2. `20260411000000_add_zelle_payment_method`
3. `20260416000000_add_payout_config`
4. `20261027000000_learner_sessions_onboarding`
5. `20261027010000_learning_preferences_visits`
6. `20261027020000_lesson_attempts_review`
7. `20261027030000_reward_accounting`
8. `20261027040000_program_boundaries`
9. `20261029000000_staff_workflows`
10. `20261101000000_support_integrity`
11. `20261101010000_partner_inquiries`
12. `20261102000000_http_rate_limits`

**The original initial schema is missing from tracked history.** The first migration alters existing tables. `release:migrate` cannot safely initialize an empty production database from this history. Recover and verify the real existing baseline; do not invent an init checksum, silently repair `_prisma_migrations`, seed a replacement database or use db push as a production baseline. [Baseline/recovery runbook](../DEPLOYMENT.md#migration-baseline-and-verified-recovery).

Required rehearsal and release sequence, all still gated by actual verification/authorization:

1. Quiesce legacy XP/financial/private writers and inventory actual source schema/history/ownership/configuration. Preserve stable IDs, row counts, original Float amounts, statuses, progress, User.totalXp, pool opening, sessions/consents/audit and all curriculum keys in a restricted manifest. Do not put participant-level manifests in this repository.
2. Use supported version-compatible PostgreSQL backup tools with secure service/password files. Take a consistent custom-format backup plus separately protected roles/extensions/key material. Restore into a **new isolated destination** with provider-approved tooling, for example `pg_dump --format=custom --file=PRIVATE_BACKUP` and `pg_restore --exit-on-error --no-owner --no-privileges --dbname='service=VERIFIED_RESTORE_SERVICE' PRIVATE_BACKUP`. Supply connection settings securely, not embedded credentials. The destination/service must be independently verified, not a name-only safety assertion. Never use `--clean` against an existing application database.
3. Prove the restored pre-upgrade manifest matches before migrating. Apply the real existing migration baseline and pending migrations on that restored copy. Generated test `db push` alone does not exercise triggers/history. Use the current exact reward/program migration tests as additional evidence, not as the backup itself.
4. Run `release:migrate -- --confirm-database VERIFIED_DATABASE` only on the reviewed target/baseline. Build/start do not perform this. A diagnosed historic repair is a separately verified recovery operation; `recovery:inspect` is read-only.
5. Review `programs:reconcile -- --confirm-database VERIFIED_DATABASE --mapping PRIVATE_MAPPING`. Reconcile original configurations/defaults/pool and explicit legacy memberships/enrollments. Apply only the fresh reviewed hash with `--apply --expected-hash REVIEWED_HASH`. Leave ambiguous records quarantined; never infer authorization from city or subdomain. Existing staff grants are explicit, and staff must re-enter and complete MFA.
6. Run `rewards:reconcile -- --confirm-database VERIFIED_DATABASE`. Review all original monetary amounts, half-up cent rounding, exact snapshots, XP differences and pool opening. Apply only with `--apply --expected-hash REVIEWED_HASH`; use `--accept-legacy-xp-differences` only after an explicit reviewed explanation of each opening adjustment. Preserve Float originals/lifetime XP and historical unknown terms; do not reprice history or debit historic payments twice.
7. Re-run both read-only reports. Require no ownership/financial issues, zero uninitialized reward accounts and zero requests without required exact snapshots. Count quarantined records separately. Independently compare stable IDs/counts, unique Progress, program assignments, paid cents/statuses, available/reserved/spent/credited conservation and ledger totals to the pre-upgrade manifest and explicit reviewed adjustments. Test refused illegal transitions and immutable evidence. No cumulative migration is complete until these reconcile.
8. Content synchronization is a separate optional `release:content` operation only if missing authored curriculum is intended. It inserts missing slots and must preserve existing content, identifiers, activation/history. First-admin bootstrap is only for a genuinely empty staff installation; existing staff use reviewed mapping/provisioning/recovery. No ordinary deploy runs either.
9. Take and restore a post-upgrade synthetic backup, prove the same manifests and SQL guards survive, exercise the compatible application, and record measured restore duration plus approved recovery objectives. Backfill replays must be idempotent. This current environment has not completed either restore or reconciliation; those are **hard blockers**, not checked boxes.

## Smoke tests and observability before opening a pilot

- Public root/demo/help/legal/navigation, owned canonical/robots/city-gate behavior and print output; real configured inquiry saves exactly once, appears only in its authorized queue and claims no email/booking.
- `/api/health/live` returns 200; `/api/health/ready` returns 200 only with actual schema and required signing/MFA configuration. Current unavailable-service 503 is expected here, not readiness. Bound polling at ingress and verify no private response caching.
- Sign in, enroll/onboard, answer/save/reload/finish one synthetic lesson, inspect server progress/award receipt, then practice and confirm no duplicate cash credit. Exercise expiry/logout/back navigation and cross-program negative calls.
- Synthetic reward workflow: reserve once, review/approve under actual program duties, record a **fictional test-only manual payment reference**, check paid timestamp/ledger/pool and repeat safely. No live transfer, real handle or live provider during tests. Stripe is not a general payout transport.
- Save a synthetic consentful non-location help request, check recipient/monitoring notice and one case, then authorized staff acknowledgment. Receipt is not notification or dispatch; verify manual staff queue checks and absence cover.
- Confirm opaque correlation references across response/logs; fail a synthetic save/database/provider call and inspect sanitized operational events. Application telemetry is optional/default off; host/proxy/APM body capture, secret/PII redaction and retention require separate inspection. Do not put chat or financial handles in logs.
- Verify shared rate storage and trusted proxy client-IP behavior across instances, fail-closed store errors, finite waits, backup alarms and an approved expired-counter retention job. No process-memory fallback or blind financial retry. No authenticated HTML/finance/chat/case service-worker cache or offline money queue.
- Run `test:performance` only after a fresh production build and attested disposable fixtures. Field goals remain p75 LCP ≤2.5 s, INP ≤200 ms, CLS ≤0.1; local samples/proxies and actual field telemetry must remain separate. Neither production lab nor field metrics are available now.

## Proposed small pilot and operational ownership

Proposal, **not scheduled or authorized**: one explicitly mapped program, five consenting adult learners, two weeks. Expand to at most ten only after the first cohort's completion, help and reward records reconcile. Use existing configured entitlement rules and a separately approved incentive budget/workflow; do not change economics for the pilot. AI remains disabled until genuine qualified review. Staff-assisted recovery remains the honest current path; automated recovery delivery is absent.

Every role below requires a named primary, backup, agreed working hours/timezone and escalation contact in the controlled release record. **No people or coverage have been assigned in this task.** Missing assignments/monitoring coverage block launch. The learner-facing notice must match the real rota and never imply overnight/emergency monitoring.

| Accountable role | Manual monitoring / response | Stop or escalate |
| --- | --- | --- |
| Technical release owner/on-call | Health, sanitized failure references, save errors, provider/store availability; check at opening/closing and during staffed pilot sessions | Three consecutive confirmed completion-save failures or >5% failures in at least 20 distinct submission intents: pause new enrollment, investigate without deleting evidence or rewards. Any outage follows the named incident rota. |
| Finance owner and authorized reviewer/approver | Reconcile available/held/spent/paid cents, requests, ledger and bookkeeping pool each staffed day and before/after every manual batch | Any unexplained discrepancy, duplicate reference or incorrect state: stop new payout actions, preserve receipts/history, reconcile with the authorized payer; never resend to fix an unknown result. |
| Program administrator/privacy owner | Scope/membership/revocation logs, access-denial reports, consent/privacy requests and inquiry queue | Any suspected cross-program disclosure: contain private access/writes, revoke affected access through supported procedures, preserve minimal evidence and follow the actual incident/privacy policy. |
| Casework/help queue owner | Open the authorized help queue at agreed staffed intervals; verify saved receipts, assignment, follow-up and explicit acknowledgments | Any request exceeding the actual posted monitoring window: escalate to the assigned backup. No automatic dispatch or constant monitoring is promised. Public emergency resources remain independent. |
| Partner inquiry owner (program admin) | Review scoped inquiries during the actual published monitoring schedule | A test receipt missing from the queue or unknown owner: keep intake disabled; stored receipt is not delivery. |

Review aggregate denominators at least daily: distinct first-completion submissions versus confirmed saved receipts; distinct payout requests versus conserved/reserved/paid amounts; saved help cases versus recorded acknowledgments within the **actual posted** window; access-denial events versus confirmed unauthorized successes. Replays are not new completions/requests. Do not collect sensitive reflections, chat or homelessness/recovery labels for monitoring. Record owner, disposition and evidence reference for every incident; do not invent email/SMS alarms or a contractual SLA.

## Compatible rollback

1. Release owner declares the incident and pauses affected enrollment/private/financial writers through the reviewed host operational procedure. No kill switch or automatic notification provider is fabricated. Keep public human-help resources available.
2. Disable optional inquiry/AI/technical reports as appropriate using reviewed configuration and a compatible build. Preserve saved receipts, cases and original monitoring notices; arrange the real manual follow-up process.
3. Retain the dependency security fixes. Prefer a verified compatible forward fix or presentation rollback that retains server sessions, program ownership/MFA, attempt evidence, ledger/reservations, immutable money/payment history and shared limits. **Do not redeploy main `4f59d41` or another pre-guard binary against the upgraded database.** A git revert is not a database rollback plan.
4. Keep additive tables/columns/triggers and keys. Never delete ledger/evidence, reprice requests, grant quarantine broadly, reset an admin or restore client-supplied bonuses/approval-as-payment behavior.
5. If database recovery is required, use the previously rehearsed provider restore/PITR procedure under an approved outage plan. Preserve post-backup awards, cases, enrollments, requests and external payment evidence; reconcile them before reopening. Never blindly restore a snapshot that erases activity or risks sending a payment twice. Preserve matching MFA/signing keys securely.
6. Re-run exact manifests, conservation/ownership/history checks, readiness and critical synthetic smoke tests on the recovered compatible stack. Finance and program/help owners sign off separately. Recovery duration/objectives remain unknown until the actual restore rehearsal passes.

## Procurement and policy work outside this software release

SSO, SCIM, contractual SLAs, enterprise procurement commitments, independent penetration/security/accessibility assessments, contractual provider/data-processing and retention agreements, policy/legal review and qualified clinical/crisis-support content review are not established by this implementation. Authenticator MFA and scoped roles do not imply enterprise certification, full compliance or a guarantee of clinical safety. Evaluate these separately for the actual buyer/region; do not create fake enterprise settings or claim supported integrations that do not exist.

## GitHub and Replit handoff

**Candidate for later comparison with Replit:** `64c44367df821d01510b61a3cd04cd2cdd11898d`. This is the immutable application/test/dependency/report snapshot checked here. Documentation-only handoff updates follow it on `feat/release-readiness`; they do not change the application candidate. A future fix to any blocker requires a new candidate SHA and rerun gates. This current candidate is **not approved for deployment or live sync**.

The branch was pushed and `git ls-remote` confirmed the candidate. GitHub main remained `4f59d419528ae5ff450b339ab1de512554a8094b`. Draft PR creation with base main/head feat/release-readiness was attempted through the existing platform authentication; GitHub GraphQL POST returned **Forbidden**, exit 1. The earlier REST repository check was also forbidden. **No PR was created.** Native Git read/push works; no replacement token was requested/extracted. CI is configured for this branch/manual dispatch, but actual remote execution/results remain unverified.

[Open the full-upgrade PR form](https://github.com/mytruealias/learn-2-earn/compare/main...feat%2Frelease-readiness?expand=1) · [prepared PR description](release-evidence/pull-request.md). The PR should target main and include the complete upgrade; do not silently drop prerequisites by cherry-picking only UI commits.

Before any later Replit sync, the operator must read its `git status`, branch and HEAD; compare with the exact approved GitHub SHA and preserve any unpushed/newer edits in a reviewed commit/patch. Do not force reset, overwrite workspace files or replace Secrets. Resolve divergence through review/PR, verify whether main sync triggers deployment, verify the final artifact SHA, then repeat release gates on that exact candidate. There is currently **no authorized deploy/sync and no go decision**.
