# Learning progression

Implemented on `feat/learning-progression`, stacked on the session/onboarding checkpoint `261d434`. The existing Next.js 15 / React / Prisma / CSS Modules stack and semantic design tokens are retained. The stage changes learner home, pathway views and their real data/state support. It does not replace the lesson player, payout rules or curriculum.

## Experience and conventions

Home has one primary learning action. It recommends an unfinished lesson actually opened most recently, then the next available lesson in the learner's most recently completed pathway, then a chosen pathway, then curriculum order. The explanation names why the lesson was chosen. A first-time learner gets a useful starting point; returning learners are welcomed with their progress intact, regardless of an old completion date. All-complete users get optional review. No available content produces an empty-program state rather than a false completion celebration.

The next lesson shows its actual Path → Module → Lesson context and stored estimated duration. Starting it takes one action from home, within the two-action requirement. Desktop uses a broad next-lesson column, a smaller goal/Hubert rail, a secondary progress/rewards strip and a two-column pathway grid. Narrow content and doubled text collapse the layout naturally. Rewards remain a real secondary destination without fabricated dollar balances or payout promises.

“My paths” is a server-persisted preference. Keeping/removing a pathway never grants or removes access, enrolls a person or changes incentives. Other published pathways remain available. Optional daily goals are one or two **newly completed** lessons, or none. Counts use server completion timestamps grouped into the device's validated IANA calendar day. The timezone is a presentation choice, not financial evidence. No streak penalty, required goal, navigation reward, goal-completion XP or automatic payment is introduced. Empty/all-complete programs explain the state instead of insisting on an impossible new lesson.

The original visual path is a quiet vertical timeline with numbered unit landmarks, short branch offsets and tactile lesson rows. **Learning path / Linear list** buttons switch the same semantic ordered list; both have identical links, state explanations and available actions. There is no inaccessible parallel canvas or duplicate hidden action tree. Keyboard focus, pressed states, text labels, minimum 44px controls, shared token contrast and reduced motion are retained.

The existing original `HubertIcon` is used consistently as a restrained purple guide on home/path pages. It is an installed local SVG, so no invented mascot artwork or external image delivery is needed. There is no looping animation, compulsory celebration or glowing-card grid.

## Actual lesson states

| State | Evidence and behavior |
| --- | --- |
| Ready | Published path/unit/lesson with at least one card, no saved completion or opened record; start in any order |
| In progress | An authenticated `LessonVisit` exists and no completion exists; clearly described as **opened, not completed** |
| Completed | Existing authoritative `Progress` row; review remains available |
| Review suggested | Completed progress contains actual nonempty saved `missedCardIds`; recommendation is optional |
| Unavailable | An otherwise published lesson has no learning cards; visible explanation and no false start link |

The schema has no prerequisite model. No new ordering lock is invented. Inactive paths/units/lessons are filtered from published navigation and guarded at direct lesson/page/API boundaries. Direct stale links receive a helpful unavailable page without unpublished titles. Empty published units/pathways explain that content is not ready. Completion and open APIs reject inactive/empty lesson content; existing historical progress/XP is kept.

`LessonVisit` stores only a last-opened timestamp, not a card index, answers, correctness or award evidence. Lessons honestly reopen at the beginning. Fine-grained card recovery and trustworthy bonus evidence remain the separate lesson stage. The current completion route does not populate `missedCardIds`; this stage uses that existing field only when real saved data is present, and does not invent age-based weaknesses or pretend to implement spaced repetition.

Current-path counts include only available published lessons. Historical completion/XP totals retain older or inactive curriculum work. Durations and counts come from executable curriculum records; no hardcoded production lesson totals or completion percentages are used. Preference/open requests never create `Progress`, change XP or write payout history.

## Data, routes and release

- Shared deterministic derivation: `lib/learning-progression.ts`; server curriculum filtering: `lib/learning-data.ts`.
- `POST /api/progress/open`: signed active session, strict lesson ID, active/content validation, idempotent visit upsert. No reward side effect.
- `GET /api/user/learning-plan?zone=...`: signed session, validated timezone, optional goal and real local-day count; private/no-store.
- `POST /api/user/learning-plan`: signed session and same-origin checks; strict explicit goal/path commands for the current user only. Writes are retry-safe. Failed/uncertain responses offer checking/retry without claiming a successful change.
- Existing progress-list responses add opened/review metadata. Existing clients keep completed IDs/history. Existing completion validation additionally respects active parents and real content.

Required additive migration: `20261027010000_learning_preferences_visits`, **after** the prior `20261027000000_learner_sessions_onboarding` migration. It adds nullable `User.dailyGoal`, `PathSelection` and `LessonVisit`, with ownership relations and indexes. No money/curriculum/progress backfill, reset, seed or historical attempt reconstruction is needed. Existing optional onboarding goals are retained. Proven guest account promotion keeps the same row, preferences and visits.

Use [DEPLOYMENT.md](../../DEPLOYMENT.md) and its verified target/baseline/backup/restore prerequisites before any separately authorized release. The known missing initial production migration is not repaired here. Builds still generate/compile without migrations/seeds. No new environment variable or provider is needed; Node 24, existing runtime/database settings and 0.0.0.0:5000 remain. Actual Replit settings and production data were not accessed or changed.

For rollback, revert this stage's UI/API support while retaining the additive nullable field/tables and the previous secure-session stage. Keep inactive-content guards where possible rather than reopening unpublished lessons. No XP, balances, payments, curriculum IDs or preferences need deletion/reversal. Do not roll back to arbitrary-ID identity claims or restore unsafe build side effects.

## Evidence and remaining work

[Verification and exact files](verification.md) · [actual browser screenshots](screenshots/README.md) · [overall stage status](../upgrade-status.md).

Fixtures use fresh restricted PostgreSQL databases and server-side isolation attestation. Tests cover new/returning/partial/all-complete/empty/inactive/network states, both list modes, actual selections/goals, long names, narrow phones, 200% root text, keyboard focus and no navigation XP. No production credential/provider action or deployment is involved.

Manual screen-reader speech, browser-menu zoom, physical notches/keyboards, real device/poor-network testing, production migration history and remote Replit/CI remain external verification. Automated checks target WCAG 2.2 AA and do not certify the complete legacy site. Existing completion/XP atomicity, client-supplied bonus authority, hearts, payout races/Zelle mismatch, staff revocation and partner membership boundaries remain tracked separately.
