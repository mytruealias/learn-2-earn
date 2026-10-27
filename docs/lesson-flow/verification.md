# Lesson engine and Practice verification

2026-10-27, base `bb6f1e0`, feature branch `feat/server-backed-lessons`. The engine prerequisite was interrupted before implementation in the previous turn; this branch completes it together with Practice. No production database or external delivery/payment service was used. Test suites use independently provisioned, nonce-attested loopback databases with restricted roles and cleanup; suites sharing resets remain sequential. Build replaces DATABASE_URL with an unreachable build-only target and removes external provider bindings.

## Baseline defects and acceptance checklist

| Area / baseline defect | Implemented acceptance criterion | Evidence |
| --- | --- | --- |
| Unvalidated card JSON, generic unknown-type branch, missing scenario context | Every one of 1,502 authored definitions validates; four stored types and all INFO subtypes render; malformed/unsupported/zero-card content cannot complete | `audit:cards`; unit adapter test; API content/active-parent tests; browser content issue |
| Browser answer keys and client-selected combo/perfect claims | Public initial assessment has no keys/explanations; strict completion accepts only an authenticated attempt ID; forged identity/bonus/score/time fields fail without an award | API initial-payload / forgery tests; server page passes metadata only |
| Reload loses position; duplicate taps and uncertain saves | Immutable saved answers and replay-safe Next; two sessions resume same attempt/feedback; repeated completion returns stored receipt; browser lost-response retry never adds credit | API concurrent/replay/resume tests; browser reload/reflection/complete retry sequence |
| Progress/XP/streak/badge writes separate; perfect response says +5 but credits +1 | Exactly one atomic credit, same single calculation in response and persistence; injected DB failure leaves all records unchanged; historical balances retained | API four-way completion, different-lesson completion, rollback trigger, additive SQL and legacy history tests |
| Hearts and disclosure compete with instructional completion | Zero-heart user completes; incorrect questions still allow instructional completion; optional reflection accepts skip/acknowledgement only, rejects text; no personal content in storage or requests | API zero-heart/reflection tests; real browser wrong-answer and skipped reflection flows |
| No persisted repeat evidence or Practice destination | Private `/practice` appears in real navigation; separate completed practice count and zero XP/cash credit; original first Progress/payout records unchanged | API repeated/prior-first practice, browser lesson → missed/due → topic → practice result at three widths |
| No explained review schedule / speculative mastery | Only completed evidence changes 1/3/7/14-day rule; missed questions and due reason/date shown; old records explicitly limited; inactive content excluded; successes labelled practice signal | Unit scheduling; API review/legacy isolation; browser due/missed/topic and empty/error views |
| Device-derived day boundaries; first-day/duplicate streak errors | Stored user/program/UTC fallback, explicit validated settings; local midnight/DST first/next-day transitions; same-day activity counted once per lesson and streak remains stable | Unit midnight/23-/25-hour tests; API real completion clock tests, deduplicated goal tests; browser timezone persistence |
| Stacked badge/modals and inaccessible legacy controls | One inline completion with next action; labelled radio/textarea/select/progress; keyboard and focus; reduced motion; 200% root text, no horizontal overflow and 44px targets | Browser axe, geometry, keyboard and full-page screenshots at 360/768/1440 |

## Executed checks and honest limits

- `npm run audit:cards`: passed, 1,502 authored definitions, all adapter types validated, no database.
- `npm run test:unit`: **67 passed**.
- `npm run test:api`: **78 passed**, including the two added actual local-midnight/DST and legacy-history cases.
- Regression HTTP flow: **6 passed**. Release browser smoke: **4 passed**. Design/browser regression: **8 passed**.
- Learner journey: **11 passed**. Learning progression: **9 passed**. Lesson/Practice: **7 passed**, including the lost-response receipt retry. The final seven-test screenshot rerun after the 200% header reflow correction also passed. The aggregate `npm test` stopped on three obsolete assertions that Practice was absent; those assertions were replaced with the implemented route target, and the affected suite passed on rerun. Progression regressions also required replacing the old FINISH label, the old all-complete goal text and device-zone query interception with the new explicit save steps, practice goal and stored-zone read. All nine progression checks then passed. The first focused browser run also found test selectors colliding with Next's hidden route-announcer alert; selectors now target the visible main content. No assertions or suites were disabled.
- `npm run lint`, safe `npm run build`, `npm run typecheck`: passed. Final reruns after the narrow large-text header correction also passed without lint warnings.
- Local production-mode checks: **16 passed** with unavailable application DB and no provider bindings, including public Help/recovery, protected Practice redirect, private API 401s and development workshop 404. [Evidence](screenshots/production-checks.json).
- Browser screenshots use synthetic accounts/content only. Initial renders, feedback, first completion, due review, practice completion, optional reflection at 200% root text, save failure and malformed content are covered. Final screenshot inventory is in [the evidence index](screenshots/README.md).

Automated axe checks are not an accessibility certification. Actual VoiceOver/NVDA speech, native browser menu zoom, device speech/offline voices, physical soft keyboards/safe areas, real low-resource hardware and live Replit remain unverified. Browser read-aloud is opt-in and requires no application provider; no reminder or notification flow exists. Production migration status/backup/restore, live financial reconciliation and remote CI are unverified. Content-version changes during unfinished attempts retain evidence but need staff review rather than automatic regrading/reset. These are explicit limits, not simulated successes.

## Staged close-out

1. [x] Inventory and preserve authored card formats; add adapters and renderer registry (`cards.ts`, `CardRenderers.tsx`, audit script, inventory and unit tests).
2. [x] Persist owned attempt/answer evidence and position; strict API protocol and atomic first-credit receipt (`engine.ts`, `contracts.ts`, route handlers, schema/additive SQL, API tests).
3. [x] Replace player layout/states; opt-in device speech, optional private reflection, guarded retry and concise result (player/module CSS/page, browser sequence).
4. [x] Add persisted review scheduling and Practice filters/reasons/separate counts; integrate nav and latest-evidence recommendations (`practice.ts`, `rules.ts`, Practice page/client/CSS/API, NavBar/shell/middleware/home/progress-list).
5. [x] Store timezone and improve distinct daily goal/streak/milestones without new financial rewards (learning-plan API, DailyGoal, rules/engine, env documentation and clock tests).
6. [ ] Final verification evidence and branch/PR handoff (final results below); deploy/production migrations/merge are outside this task.

## Exact changed files

The source/config/test/documentation list below is generated from this branch's diff against `bb6f1e0`; screenshot/evidence files are indexed separately. No seed source, curriculum identifier, package-lock or previous migration is modified.

- `.env.example`
- `DEPLOYMENT.md`
- `README.md`
- `app/api/lesson/answer/route.ts`
- `app/api/lesson/attempt/route.ts`
- `app/api/lesson/next/route.ts`
- `app/api/practice/route.ts`
- `app/api/progress/complete/route.ts`
- `app/api/progress/list/route.ts`
- `app/api/user/learning-plan/route.ts`
- `app/app/page.tsx`
- `app/components/NavBar.tsx`
- `app/components/learner/DailyGoal.tsx`
- `app/components/learner/LearnerShell.tsx`
- `app/lesson/[lessonId]/CardRenderers.tsx`
- `app/lesson/[lessonId]/LessonPlayer.tsx`
- `app/lesson/[lessonId]/lesson.module.css`
- `app/lesson/[lessonId]/page.tsx`
- `app/practice/Practice.tsx`
- `app/practice/page.tsx`
- `app/practice/practice.module.css`
- `docs/current-architecture.md`
- `docs/lesson-flow/README.md`
- `docs/lesson-flow/card-inventory.md`
- `docs/lesson-flow/verification.md`
- `docs/upgrade-plan.md`
- `docs/upgrade-status.md`
- `e2e/design-system.spec.ts`
- `e2e/helpers/lesson.ts`
- `e2e/learner-flow.spec.ts`
- `e2e/learner-journey.spec.ts`
- `e2e/learning-progression.spec.ts`
- `e2e/lesson-practice.spec.ts`
- `lib/learner-navigation.ts`
- `lib/lesson/cards.ts`
- `lib/lesson/contracts.ts`
- `lib/lesson/engine.ts`
- `lib/lesson/practice.ts`
- `lib/lesson/rules.ts`
- `middleware.ts`
- `package.json`
- `prisma/migrations/20261027020000_lesson_attempts_review/migration.sql`
- `prisma/schema.prisma`
- `scripts/audit-lesson-cards.ts`
- `scripts/run-tests.ts`
- `tests/api/learner-identity.test.ts`
- `tests/api/learning-plan.test.ts`
- `tests/api/progress.test.ts`
- `tests/helpers/lesson.ts`
- `tests/unit/lesson-rules.test.ts`


## Final local results

All **190 test cases** passed across the independently executed suites: 67 unit, 78 API/release, 6 HTTP, 4 release smoke, 8 design, 11 learner journey, 9 learning progression and 7 lesson/Practice. This is the unique suite total, not a claim that the earlier interrupted aggregate `npm test` invocation passed. Affected and remaining suites were run separately after correcting obsolete expectations. Final lesson/Practice rerun passed all seven after the large-text header fix and refreshed all 18 screenshots/observations. Final lint, safe build, type check and 16 local production-mode checks passed. Final source formatting uses the existing approach; no dependency or lockfile changed.

Screenshot review included desktop Practice, phone feedback and phone reflection at 200% text. The last review caught and fixed header label wrapping with flex reflow; fixed-action scroll margins and measured content clearance preserve reachable controls. Automated checks do not replace the manual/platform limits listed above.

The stage is complete locally. Branch push / draft PR outcome is recorded in the status report and final handoff; no production migration, seed, deployment or merge was run. [Release and rollback compatibility](README.md#release-recovery-and-rollback) is required for any later operator release.
