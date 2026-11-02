# Every route: audit and verification state

2026-11-02 (America/Chicago), base `39c7e7c`. Counted actual checkout: **43 page routes, 60 API files, 39 models** after the three new operational APIs and counter model. [Machine inventory, methods and access notes](route-inventory.json) lists every source file. Existing routes/account/curriculum/history IDs are preserved. This table supersedes historical coverage checkmarks; source implementation is not a new functional/accessibility pass.

The current public/degraded browser run uses a deliberately unusable database and synthetic staff API interception. City presentation cookies are signed **synthetic test fixtures** restricted to the dedicated local test ports; they do not prove a successful PIN API/database operation. Source review covers existing permissions/loading/empty/error/success/recovery mechanisms; full current live-session checks remain blocked by pinned Prisma checksum HTTP 403. No actual participant records/providers are used.

| Page route | Source | Current observed states | Remaining verification |
| --- | --- | --- | --- |
| `/access` | [app/access/page.tsx](../../app/access/page.tsx) | Source review; current browser flow blocked | Real DB/auth/loaded/empty/denied/interruption matrix; native AT/zoom |
| `/admin/audit` | [app/admin/audit/page.tsx](../../app/admin/audit/page.tsx) | synthetic-api-error | Real DB/auth/loaded/empty/denied/interruption matrix; native AT/zoom |
| `/admin/cases/[id]` | [app/admin/cases/[id]/page.tsx](../../app/admin/cases/[id]/page.tsx) | synthetic-api-error | Real DB/auth/loaded/empty/denied/interruption matrix; native AT/zoom |
| `/admin/cases` | [app/admin/cases/page.tsx](../../app/admin/cases/page.tsx) | synthetic-api-error | Real DB/auth/loaded/empty/denied/interruption matrix; native AT/zoom |
| `/admin/directory` | [app/admin/directory/page.tsx](../../app/admin/directory/page.tsx) | synthetic-api-error | Real DB/auth/loaded/empty/denied/interruption matrix; native AT/zoom |
| `/admin/finance` | [app/admin/finance/page.tsx](../../app/admin/finance/page.tsx) | Source review; current browser flow blocked | Real DB/auth/loaded/empty/denied/interruption matrix; native AT/zoom |
| `/admin/inquiries` | [app/admin/inquiries/page.tsx](../../app/admin/inquiries/page.tsx) | synthetic-api-error | Real DB/auth/loaded/empty/denied/interruption matrix; native AT/zoom |
| `/admin/login` | [app/admin/login/page.tsx](../../app/admin/login/page.tsx) | sign-in | Real DB/auth/loaded/empty/denied/interruption matrix; native AT/zoom |
| `/admin` | [app/admin/page.tsx](../../app/admin/page.tsx) | synthetic-api-error | Real DB/auth/loaded/empty/denied/interruption matrix; native AT/zoom |
| `/admin/payouts` | [app/admin/payouts/page.tsx](../../app/admin/payouts/page.tsx) | synthetic-api-error | Real DB/auth/loaded/empty/denied/interruption matrix; native AT/zoom |
| `/admin/programs` | [app/admin/programs/page.tsx](../../app/admin/programs/page.tsx) | memberships-unavailable | Real DB/auth/loaded/empty/denied/interruption matrix; native AT/zoom |
| `/admin/reports` | [app/admin/reports/page.tsx](../../app/admin/reports/page.tsx) | synthetic-api-error | Real DB/auth/loaded/empty/denied/interruption matrix; native AT/zoom |
| `/admin/security` | [app/admin/security/page.tsx](../../app/admin/security/page.tsx) | synthetic-api-error | Real DB/auth/loaded/empty/denied/interruption matrix; native AT/zoom |
| `/admin/staff` | [app/admin/staff/page.tsx](../../app/admin/staff/page.tsx) | synthetic-api-error | Real DB/auth/loaded/empty/denied/interruption matrix; native AT/zoom |
| `/admin/users/[userId]` | [app/admin/users/[userId]/page.tsx](../../app/admin/users/[userId]/page.tsx) | synthetic-api-error | Real DB/auth/loaded/empty/denied/interruption matrix; native AT/zoom |
| `/admin/users` | [app/admin/users/page.tsx](../../app/admin/users/page.tsx) | session-unavailable; synthetic-api-error | Real DB/auth/loaded/empty/denied/interruption matrix; native AT/zoom |
| `/app` | [app/app/page.tsx](../../app/app/page.tsx) | Source review; current browser flow blocked | Real DB/auth/loaded/empty/denied/interruption matrix; native AT/zoom |
| `/austin` | [app/austin/page.tsx](../../app/austin/page.tsx) | synthetic-signed-presentation | Native AT/zoom/device; actual host; configured API/provider where applicable |
| `/austin/unlock` | [app/austin/unlock/page.tsx](../../app/austin/unlock/page.tsx) | gated; ready; store-unavailable | Native AT/zoom/device; actual host; configured API/provider where applicable |
| `/dallas` | [app/dallas/page.tsx](../../app/dallas/page.tsx) | synthetic-signed-presentation | Native AT/zoom/device; actual host; configured API/provider where applicable |
| `/dallas/unlock` | [app/dallas/unlock/page.tsx](../../app/dallas/unlock/page.tsx) | gated | Native AT/zoom/device; actual host; configured API/provider where applicable |
| `/demo` | [app/demo/page.tsx](../../app/demo/page.tsx) | rendered; text-200 | Native AT/zoom/device; actual host; configured API/provider where applicable |
| `/denver` | [app/denver/page.tsx](../../app/denver/page.tsx) | synthetic-signed-presentation | Native AT/zoom/device; actual host; configured API/provider where applicable |
| `/denver/unlock` | [app/denver/unlock/page.tsx](../../app/denver/unlock/page.tsx) | gated | Native AT/zoom/device; actual host; configured API/provider where applicable |
| `/dev/design-system` | [app/dev/design-system/page.tsx](../../app/dev/design-system/page.tsx) | component-states | Native AT/zoom/device; actual host; configured API/provider where applicable |
| `/houston` | [app/houston/page.tsx](../../app/houston/page.tsx) | synthetic-signed-presentation | Native AT/zoom/device; actual host; configured API/provider where applicable |
| `/houston/unlock` | [app/houston/unlock/page.tsx](../../app/houston/unlock/page.tsx) | gated | Native AT/zoom/device; actual host; configured API/provider where applicable |
| `/lesson/[lessonId]` | [app/lesson/[lessonId]/page.tsx](../../app/lesson/[lessonId]/page.tsx) | Source review; current browser flow blocked | Real DB/auth/loaded/empty/denied/interruption matrix; native AT/zoom |
| `/lifeline` | [app/lifeline/page.tsx](../../app/lifeline/page.tsx) | unavailable-account-service | Native AT/zoom/device; actual host; configured API/provider where applicable |
| `/login` | [app/login/page.tsx](../../app/login/page.tsx) | Source review; current browser flow blocked | Real DB/auth/loaded/empty/denied/interruption matrix; native AT/zoom |
| `/los-angeles` | [app/los-angeles/page.tsx](../../app/los-angeles/page.tsx) | synthetic-signed-presentation | Native AT/zoom/device; actual host; configured API/provider where applicable |
| `/los-angeles/unlock` | [app/los-angeles/unlock/page.tsx](../../app/los-angeles/unlock/page.tsx) | gated | Native AT/zoom/device; actual host; configured API/provider where applicable |
| `/onboarding` | [app/onboarding/page.tsx](../../app/onboarding/page.tsx) | Source review; current browser flow blocked | Real DB/auth/loaded/empty/denied/interruption matrix; native AT/zoom |
| `/` | [app/page.tsx](../../app/page.tsx) | rendered | Native AT/zoom/device; actual host; configured API/provider where applicable |
| `/paths/[pathSlug]` | [app/paths/[pathSlug]/page.tsx](../../app/paths/[pathSlug]/page.tsx) | Source review; current browser flow blocked | Real DB/auth/loaded/empty/denied/interruption matrix; native AT/zoom |
| `/practice` | [app/practice/page.tsx](../../app/practice/page.tsx) | Source review; current browser flow blocked | Real DB/auth/loaded/empty/denied/interruption matrix; native AT/zoom |
| `/privacy` | [app/privacy/page.tsx](../../app/privacy/page.tsx) | rendered | Native AT/zoom/device; actual host; configured API/provider where applicable |
| `/profile` | [app/profile/page.tsx](../../app/profile/page.tsx) | Source review; current browser flow blocked | Real DB/auth/loaded/empty/denied/interruption matrix; native AT/zoom |
| `/recover` | [app/recover/page.tsx](../../app/recover/page.tsx) | rendered | Native AT/zoom/device; actual host; configured API/provider where applicable |
| `/san-francisco` | [app/san-francisco/page.tsx](../../app/san-francisco/page.tsx) | synthetic-signed-presentation | Native AT/zoom/device; actual host; configured API/provider where applicable |
| `/san-francisco/unlock` | [app/san-francisco/unlock/page.tsx](../../app/san-francisco/unlock/page.tsx) | gated | Native AT/zoom/device; actual host; configured API/provider where applicable |
| `/signup` | [app/signup/page.tsx](../../app/signup/page.tsx) | Source review; current browser flow blocked | Real DB/auth/loaded/empty/denied/interruption matrix; native AT/zoom |
| `/terms` | [app/terms/page.tsx](../../app/terms/page.tsx) | rendered | Native AT/zoom/device; actual host; configured API/provider where applicable |

## APIs and authoritative data

All 60 methods/route files appear in [the JSON inventory](route-inventory.json). New endpoints are `/api/health/live` GET, `/api/health/ready` GET and `/api/telemetry` POST. Existing learner sessions/attempt evidence/reward ledger and membership/MFA/program scopes remain authoritative. Raw-body parsing gaps in profile-session/MFA were bounded; shared ordinary JSON parsing now has a byte/time ceiling. Internal auth/PIN/guest admission uses the new shared PostgreSQL counter; existing support/staff/inquiry stores remain. Operational counters contain no participant payloads and have no staff/global record-view endpoint.

Current tests cover pure/mocked error/channel/query/transport contracts, exact SQL and distributed service behavior through a parameterized pg adapter, actual liveness/default-off/store-unavailable HTTP, and synthetic client recovery. These do not replace native Prisma API authorization, concurrent money/attempt, full migration or provider workflow reruns. The guarded API harness failed before tests; no full API pass is claimed. Failed requests cannot create a true saved/paid/sent state merely through this transport.

## States that must not disappear from close-out

- Entry/onboarding: invitation acceptance/denial, guest association, existing account, invalid fields, expired/revoked session, interruption/reload, optional goal/privacy, real supported recovery. Journey’s existing server/session contracts remain; current full browser flow is blocked.
- Home/path: new/returning/partial/all-complete/empty/inactive and unavailable progress; both visual and linear lists; long labels; two-action next lesson and no navigation XP. Home summary has measured synthetic serialization evidence; actual route performance is not measured.
- Lesson/Practice: loading/answering/checking/feedback/saved-next/submitting/complete/error, resume/account switch, zero-card/malformed/inactive content, repeat practice without cash, timezone/DST goals. Initial/error lesson headings and bounded transport changed; real attempts/speech playback need rerun.
- Profile/Rewards: guest and registered views, overview/info/achievements/earnings variants, profile validation/load/save failure, terms/rate/method snapshots, insufficient/unreconciled balance, request confirmation, uncertain retry/cancel and timeline. Persistent feedback/heading/target fixes are source-reviewed; full real data/dialog flows remain blocked.
- Help: deterministic contacts without AI/account, optional processing/location, no autoplay, provider availability/error/disconnect, idempotent saved receipt and genuine staff acknowledgment. New run checks public help during unavailable services and absence of automatic audio/provider POSTs; positive voice playback/provider scenarios remain separate mocked/real-device checks.
- Staff: every original workspace plus detail/program/security/inquiry routes; role-denied states, loading/error/empty/large pages, stale/conflicting decisions, paged filters/export, session return/back/revocation and failed sign-out. New client error-state checks cover all client workspaces; server-rendered finance and real authorized datasets/money/export workflows still need the guarded suite.
- Marketing/city: all public templates and 12 city/deck unlock routes; unconfigured intake/catalog, sample/retry, PIN-store failure and private print/noindex. No city agreement, certification, outcome or financial transfer is invented. The current marketing regression separately passes with one explicit learner-sign-in infrastructure skip.
- Framework: generic segment/admin/root/missing-page recovery is implemented. Root-layout failure and production dev-route 404 remain source-reviewed until a fresh production artifact can be built.

## Manual and assistive-technology limits

Actual Chromium checks inspect keyboard focus/loop/restoration, status/alert roles, headings and named controls using the accessibility tree, plus screenshots and root-text enlargement. This is not platform screen-reader speech. No Orca/VoiceOver/NVDA session or native browser UI zoom was available in this Linux/headless environment. Physical-device keyboard/safe-area/high-contrast, actual speech/reading order and the remaining route/state matrix are explicitly open; no compliance declaration is made.
