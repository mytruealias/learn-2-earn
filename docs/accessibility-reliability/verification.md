# Executed checks and remaining acceptance

2026-11-02 (America/Chicago), `feat/accessibility-reliability`, base `39c7e7c`. Read applicable guidance/current source before edits; no AGENTS.md or live Replit config was found. [Audit](audit.md), [full route/state inventory](routes.md), [implementation/operations/rollback](README.md), [exact files](files.md), [screenshots](screenshots/README.md) and [production lab status](lab/README.md) are complementary evidence. No production migration/seed/reset/provider call, private participant screenshot, payment, outreach, merge or deployment occurred.

## Results

Workspace-only diagnostic logs are under `/workspace/.onboarding/`; the checked-in evidence below is self-contained. Prior-stage results are not counted as current passes.

| Check | Result / evidence | Practical limit |
| --- | --- | --- |
| Lint with `--max-warnings=0` | Exit 0, zero warnings | Generated reliability output excluded; source rules retained. |
| Reliability contracts | 15 cases in five files passed | Real helper/query/transport behavior, mocked stores where labeled; not native Prisma integration. |
| Reliability Chromium | 11 cases passed (2.5 minutes); 59 selected axe/overflow observations, 60 PNGs; final focused back/reload recheck also passed (one case) | Public database binding is unusable; staff client data is explicit synthetic API interception. No backend authorization/persistence claim. |
| Current marketing regression | 13 contracts and 10 browser cases passed, one explicit missing-client sign-in skip | Four widths; current shared-store PIN success is not verified. Real store-unavailable UI plus synthetic signed presentation cookies replace old database-free PIN assumptions. Final browser regression repeated after responsive fixes: 10 passed, one explicit skip (1.5 minutes). |
| Existing `test:unit` | 72 cases passed in seven files; overall exit 1 because staff-security suite fails before collection at missing generated client | Not a full unit pass; four security cases never collected. |
| Exact SQL/service concurrency | Fresh database/restricted role, controlled loopback server/data directory and nonce/ownership verified; resources removed | Actual function uses a parameterized pg adapter in place of the blocked Prisma driver. [Evidence](rate-store-evidence.json) is not full migration/API verification. |
| SQL results | 24 concurrent admissions across two sessions/timezones: five admitted at cap five, 19 rejected; own/duplicate/old-window refunds, independent identity, expiry, positive count, preserved marker; lock failure around 1 second | No production target or participant/financial data. SQL hash identifies the exact additive migration. |
| Serialization measurement | Actual summarizer on synthetic 200-lesson input: 29,117 → 177 bytes, 99.39% reduction | [Evidence](payload-evidence.json); not route JS, LCP, INP, CLS or production curriculum size. |
| Normal Prisma generation | Exit 1, pinned native checksum fetch proxy HTTP 403 | No TLS/checksum-ignore/mirror/fake-client bypass. |
| Safe `npm run build` | Exit 1 at Prisma generation; Next production compilation unrun | No build-time DB seed/migration/account operation. |
| `npm run typecheck` | Exit 2: missing generated Prisma exports and dependent inference errors | Independent new fixture/HTTP-header type issues were corrected. Reassess all remaining diagnostics after normal generation; the type gate is still red and no pass is claimed. |
| Guarded API tests | Exit 1 before tests; harness cannot construct generated client | New rate-limit API test is authored; existing full auth/money/migration/attempt negatives must rerun. No production reset/fallback. |
| Guarded production lab | Exit 1 before measurements for the same client prerequisite | No current production LCP/INP/CLS/bundle bytes recorded. CI/lab configuration is implemented, not verified remote execution. |
| Official Prisma documentation retrieval | HTTP 403 | Installed Next instrumentation/font declarations/source were checked; no undocumented socket option or new provider added. |
| `git diff --check` | Exit 0 before commit | Documentation links and exact file index checked separately. |

The earlier clean dependency install succeeded before the native download block; dependencies/lockfile are unchanged in this stage. That is historical evidence, not a new clean-install/build pass. The environment is still **not ready** for complete application/release verification. Font retrieval was also restricted; system fallback rendering is usable, but actual production font delivery/performance needs verification.

## Browser and visual evidence

Public/city templates are rendered at 360 and 1440; the separate marketing regression covers 360/390/768/1440. The current browser suite checks selected WCAG axe tags, one meaningful page heading, landmarks/control semantics, no horizontal overflow and keyboard/focus behavior. Actual test captures and observations are in [screenshots](screenshots/README.md); sensitive data/providers are excluded.

Visual inspection found a real issue despite zero automated findings: at 200% root text the sample answer text collapsed to almost one character per line, Menu split and footer words broke badly. The nested sample padding now contracts, narrow shared choice cards stack radio/text, and navigation/footer wrap readably. The regression asserts exactly two answer text columns at least five font-em wide. Original 360 px capture: 9,470 px tall; final: 6,246 px tall, with readable answer labels. [Before](before/demo-text-200-360.png) is an original browser capture within this task before the zoom fix, not a reconstructed mockup; the final after capture replaces it. An accidental stylesheet edit during this fix was restored, and a rendered navigation-layout assertion now guards that failure. Only final regenerated observations are acceptance evidence.

Staff error-only views retain meaningful headers, actionable retry and explicit unavailable records; the mobile menu is measured below the visible connection notice. Public Help remains usable with account/program services unavailable. A focus geometry check keeps its crisis contact between the sticky header and bottom navigation. Mobile dialog keyboard loop/Escape/restoration, root text enlargement, reduced-motion preference, no default audio/AI POST, failed sign-out, and back/reload with mocked revoked session are checked. These are real client behaviors with explicitly synthetic/unavailable services, not a claim about real current identity/permissions or receipt persistence.

Shared pending-dialog dismissal, profile/lesson loading/error heading and feedback fixes are source-reviewed. Current real authenticated learner/finance/private-data dialog workflows, positive speech playback, full role-denied/empty/many-record/export/parallel-decision states and provider streaming/disconnect scenarios remain blocked or require their existing guarded/mocked suites. No offline answer queue or financial auto-replay was added; contract tests confirm one mutation attempt and complete-body timeout/cancellation.

## Accessibility limits

Chromium accessibility-tree names, headings, roles and live-region properties were inspected as semantics spot checks. There is no installed platform screen reader in this Linux/headless environment; VoiceOver/NVDA/Orca speech/reading/announcement testing is unrun. Root font-size enlargement is **not native browser UI zoom**. Physical device/safe-area/keyboard, OS high contrast and the full current route/state matrix remain open. Zero selected automated violations is not WCAG conformance.

## Exact next verification

1. Restore approved pinned Prisma binary/checksum downloads. Run normal generation; do not bypass verification. Then rerun lint/types/safe build, complete unit/API and all existing guarded learner/progression/lesson/rewards/staff/support browser suites sequentially.
2. Verify the additive limit SQL after the current migration baseline, mandatory money/attempt/case evidence guards and rollback compatibility in the disposable harness. Test direct API successes/denials across actual sessions, independent clients, quotas/refunds, degraded store/provider behavior and unchanged reward/reservation idempotency.
3. Run the current production artifact lab with its attested realistic synthetic fixtures and throttled mobile conditions. Check intended loaded states and query plans; add indexes only if measured evidence supports them. Field goals remain p75 LCP ≤2.5 s, INP ≤200 ms, CLS ≤0.1; lab samples/proxies are separate and no field result exists.
4. Complete native screen-reader/browser zoom/device checks for every remaining inventory row, including positive audio, profile/rewards/dialogs, sticky keyboard navigation and full-page rendering with real synthetic sessions.
5. Verify actual Replit port/build/start, trusted ingress IP headers, liveness/readiness monitoring, host/APM/log retention, backups/restore/domain/remote CI and operational/legal review before deployment or enabling optional reports. No operational approval is fabricated.

Rollback retains additive counters/shared admission and previous session/program/financial/attempt/evidence protections. Optional diagnostics can be disabled at build/runtime; presentation and transport can revert compatibly. Do not erase history or restore process-local security bypass, false notifications or automatic financial replay. [Detailed rollout/rollback](README.md#migration-release-and-rollback).

## Collaboration handoff

This checkpoint is stacked on `feat/partner-website` (`39c7e7c`), not on an assumed merged main. Final commit/push/PR outcome is recorded below after the actual operation. No merge or deployment is authorized by this report.
