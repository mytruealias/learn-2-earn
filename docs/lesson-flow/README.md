# Lesson engine and Practice

Implemented together on `feat/server-backed-lessons` from `bb6f1e0` after the environment interruption prevented the preceding engine stage from being completed. This stage finishes that prerequisite and adds Practice. See [authored-card inventory](card-inventory.md), [verification and exact files](verification.md), [screenshots](screenshots/README.md) and [stage status](../upgrade-status.md). No production migration, content synchronization, deployment or merge was performed.

## Lesson contract

`lib/lesson/cards.ts` validates and adapts all four existing card types and INFO subtypes. `CardRenderers.tsx` is a typed registry for teaching, question, scenario and optional reflection. Unsupported/malformed cards return a recoverable content issue with retry/alternative lesson actions; they cannot silently count as completion. Empty lessons and inactive lesson/module/path records are unavailable. No sequence locks are introduced.

The server page passes only lesson/path display metadata to the client. The attempt endpoint returns one public card at a time. Answer keys and explanations are not present before a submitted answer; the server provides feedback afterward. Hints are intentional instructional support. This protects reward evidence from arbitrary score claims; it does not prevent answer sharing, inspecting later feedback or studying in practice before a first completion. It is not a high-stakes examination or proof that a person internalized a skill.

The player explicitly models loading, answering, checking, feedback, next, submitting, complete and error. A synchronous request guard prevents double taps. The server makes repeats idempotent independently. Native radio groups, readable scenario context, optional hints and device read-aloud replace terminal labels. The bottom action region stays visible, measures its own height and reserves content space. Checked answers and continued position are saved; unchecked selections are not. The progress indicator counts saved answers, including a checked card whose feedback is still open.

Reload and a second signed-in device resume the same unfinished attempt and feedback. Exit explains what is saved. Notes exist only in the reflection component's memory, never localStorage, request bodies or database records. Skipping records only a boolean. Read-aloud is off until explicitly selected; it uses the browser/device speech service, may require the device's network service, can be stopped, and is cancelled on card change/unmount. There is no automatic sound, new speech provider, animation loop or reminder delivery. Reduced-motion preferences continue to apply through existing CSS utilities.

Failures show uncertainty, not an invented result. Retry repeats the same operation and attempt ID. In particular a lost completion response can be retried to retrieve the committed receipt without a second award. Session expiry shows sign-in; switching accounts invalidates client state and the API checks attempt ownership. The guest's first-completion limit remains: further lesson steps can be saved and learned, but creating another cash-eligible completion requires account creation. Signed guest upgrade retains the same user, attempts and saved position.

## Persistence and API

| Record | Meaning |
| --- | --- |
| Existing Progress | Unique `(userId, lessonId)` first completion and its historical XP, score and missed-card snapshot. Repeat practice never rewrites it. |
| LessonAttempt | First or practice run, content hash, safe position, timestamps and committed completion receipt. Repeat practice uses separate runs. |
| LessonAnswer | One immutable first submitted choice/acknowledgement per attempt/card and ordinal; server correctness, skip marker and timestamp. No personal text. |
| LessonReview | Latest completed assessment evidence, missed card IDs, consecutive attempts without misses, next suggested review and timestamp. Not a financial ledger or certification. |
| User additions | Nullable saved learning timezone and last confirmed learning activity. Existing IDs, balances, payout history and curriculum stay intact. |

All writes require a valid active server session and same-origin browser request. Bodies are strict Zod objects. The server locks the learner's User row in a transaction and rechecks the session after acquiring the lock. This serializes attempts and completion awards for that learner. The Progress uniqueness constraint remains a second backstop. All content/parent availability checks happen on start, answer, advance and completion.

| Route | Body / behavior |
| --- | --- |
| POST `/api/lesson/attempt` | `{ lessonId, practice?: boolean }`; start/resume unfinished run. A previously completed lesson defaults to practice; explicit practice can also explore an uncompleted lesson with no first-completion credit. |
| POST `/api/lesson/answer` | `{ attemptId, cardId, answer }`; choice index, acknowledgement, or reflection skip/continue. First submitted evidence is immutable. |
| POST `/api/lesson/next` | `{ attemptId, cardId }`; advances a saved step once. Replaying an earlier Next cannot skip another card. |
| POST `/api/progress/complete` | **Only** `{ attemptId }`; requires every card's saved evidence and final position. Legacy bonus, score, elapsed-time, identity and lesson-only claims are rejected. |
| GET `/api/practice` | Own active curriculum, review reasons/dates, topic options, first-completion count, separate practice count, milestones and timezone. |
| GET/POST `/api/user/learning-plan` | Existing goal/path commands plus explicit `{ type: 'timezone', zone }`. Read uses stored timezone; old `?zone=` is validated but cannot override it. |
| POST `/api/progress/list` | Preserves existing completion shape. Review suggestions use latest LessonReview evidence where present, otherwise historical markers. Home uses the same precedence. |

Only a completed attempt changes review scheduling or daily activity. Opening/answering/advancing never awards XP or changes the streak. Old first-completion records are not converted to fictional answer evidence.

## Award integrity and preserved economics

One transaction creates the first Progress, increments totalXp, updates badges/streak/freezes, updates assessment review evidence and stores the attempt's receipt. Any failure rolls the entire set back. Existing payout requests are untouched. Replays return the stored result; practice returns explicit zero XP/base/perfect bonus and creates no extra first completion.

`calculateAward` is the single calculation object used for persistence and response: existing base XP × 1.25 for a peak of at least 3 consecutive correct assessment responses, × 1.5 for at least 5, rounded as before; **+1** if none were missed. Teaching/reflection acknowledgement neither breaks a combo nor requires disclosure. The existing all-instruction perfect credit is retained. This fixes the response's erroneous +5 claim while preserving the actual +1 credit. Correctness affects existing bonuses, not instructional completion. Hearts never block learning and are not decremented by this engine.

No historical XP, earned balance, entitlement rate, payout conversion, cap, approval rule or payment history is recalculated. Existing payout concurrency, copy/Zelle and partner-boundary issues remain separate pending work. An explicit reconciliation process would be needed for historical award anomalies; none is automatically attempted.

## Transparent practice schedule

Practice reviews the **whole lesson**, with missed questions listed beforehand and a topic filter. It is not a card-skipping shortcut or a separate assessment curriculum. Due items sort first, then items with missed evidence, then review date and title. All topics and all published lessons remain accessible through Learn.

After a completed assessment attempt: a miss suggests review in **1 elapsed day** and resets the successful-attempt count. A run without misses suggests **3 days**, then **7**, then **14**, capped at 14. Each completed practice attempt is a separate record. Replaying the same receipt does not advance the schedule. Intervals are elapsed 24-hour days, with dates displayed in the saved timezone; the calendar/streak rule below is deliberately separate. Practicing earlier is allowed. The UI explains the reason and interval and does not use countdowns or pressure.

A historical first completion with no new evidence gets an explicitly limited initial suggestion from its completion date (+1 day if valid missed-question markers exist; otherwise +3). No mastery count is invented. Teaching-only lessons are available for topic practice without an assessment due date. Inactive curriculum is omitted; historical progress is retained. The consecutive-success count is described as a practice signal, not mastery certification. Sensitive themes never appear in notifications because no messages/reminders are sent.

## Daily goals, timezone and milestones

Timezone priority is **saved User.learningTimezone → valid PROGRAM_TIMEZONE → UTC**. No device locale or client timestamp is authoritative. Practice settings show the actual fallback and allow an explicit validated IANA timezone choice, including an optional device suggestion that still requires Save. Existing users have null fields and retain history; no forced timezone backfill occurs. Timezone changes affect future calculations and the presentation of current-day activity, never award amounts.

A goal is optional (1, 2 or off) and now counts **different lessons learned or practiced per local calendar day**, once each. First-completion records and completed attempts are deduplicated by lesson/day, so a first run plus repeated practice of the same lesson cannot inflate today's goal. Completed practice counts as learning activity without becoming cash-eligible progress. Users who have finished all available content can continue choosing a manageable practice goal.

The first learning day starts at 1. Additional completions that local day do not increment the streak or regenerate a freeze. The next local calendar day increments it, including 23-/25-hour DST days. Existing free one-missed-day freeze behavior and seven-day regeneration are retained, now based on confirmed learning dates rather than unrelated profile activity. A longer gap starts a new current streak and welcomes the learner back; saved learning, badges and balances remain. Timezone selection can change nonfinancial day boundaries; this is not an anti-abuse guarantee for streaks.

Badges are merged and persisted atomically, preserving unknown historic IDs. First lesson, 3/7 learning days, first complete published path, existing perfect lesson and first practice appear as one inline milestone line on completion and in Practice. Historic first/perfect/streak/path evidence is recognized without replaying an award. One concise completion panel replaces confetti and blocking badge/module dialog stacks. Profile's broader badge vocabulary/copy is existing legacy UI and is not fully migrated in this stage.

## Release, recovery and rollback

Apply **20261027020000_lesson_attempts_review**, after the earlier session and preference migrations, to a verified migration baseline **before starting this application version**. It adds three tables, nullable user fields, foreign keys, indexes and basic mode/position constraints. It performs no seed, destructive rewrite or financial backfill. See [DEPLOYMENT.md](../../DEPLOYMENT.md) for verified-target, backup/restore and explicit release sequencing. Real Replit settings and production migration history are still unverified; do not use `db push` or old migration repair in production.

Deploy the UI and endpoints together after a reviewed release: cached old clients submitting client bonuses get a validation error and must reload. A content hash binds an unfinished attempt to its published teaching/answer contract and XP value. Editing those fields during an unfinished attempt returns a visible content-changed issue while retaining evidence; the learner can choose another lesson. Automatic abandonment/regrading of old attempts is intentionally not provided because it could erase first-answer evidence. Staff must review/restore compatible content or implement an audited version transition before that attempt can resume. This operational limitation is explicit.

For rollback, retain all additive tables/columns and historical records. Presentation rollback can keep the hardened endpoints. Do **not** restore the old client-trusted `/progress/complete`: temporarily disable new lesson completions if a compatible server rollback is required, while keeping Help, reading and historical balances available. A pre-migration binary can read the additive schema, but its completion endpoint remains unsafe and must be disabled. Restore a backup only through the separately verified recovery procedure and reconcile any new awards/history rather than overwriting subsequent activity.
