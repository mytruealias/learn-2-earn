# Design foundation verification

Based on `b061656`, branch `feat/scoped-design-system`. This stage implements a semantic CSS foundation, reusable primitives and two representative screens, not a site-wide redesign.

## Implemented behavior

- New warm canvas, ink/teal typography and action hierarchy; success/milestone/Hubert roles remain distinct. CSS Module primitives and local opt-in scopes avoid broad presentation changes.
- Learner path: real server progress, visible start/continue/review action, grouped units, actual duration/base XP labels, semantic progress, loading/error/retry/empty states. Local-storage IDs no longer gate this screen's progress read. Other learner screens remain separate migration work.
- Staff directory: responsive search/filter/list, real create/edit/clear/remove, explicit pending/error/success, retained input on failure and an uncertain-save recovery instruction. Optional API fields accept null so empty service details can be saved/cleared. Required names/categories, permission checks and soft deletion are retained.
- Native add/edit/remove dialogs and scoped mobile staff navigation loop keyboard focus, handle Escape and restore focus. Hidden/disabled elements are filtered by the existing utility; callback changes no longer restart the trap.
- Development-only component workshop; the root viewport no longer blocks user zoom. The production route is guarded with notFound before rendering the workshop.

## Executed checks

| Check | Result |
| --- | --- |
| Clean `npm ci --include=dev` with frozen lockfile | Passed after adding the pinned development-only axe adapter |
| `npm run lint` | Passed; known generated test/report outputs excluded |
| `npm run typecheck` | Passed with generated route types |
| `npm run build` | Passed; existing database-free safe build retained |
| Full `npm test` | Passed: **77 tests** — 23 unit, 36 API/release, 6 HTTP, 4 existing browser smoke, 8 design browser tests |
| Final focused `test:design` | All 8 passed after stale-request handling refinement; no aborted-request/uncaughtException entries in the final run log |
| Automated contrast | Token tests cover normal and soft-surface text at 4.5:1 minimum; focus/control boundaries and progress fill at 3:1; disabled text also checked |
| Axe + geometry | Zero axe violations on showcase, learner path and staff directory at 360/768/1440px, normal and 200% root text; directory dialogs also audited; measured interactive boxes at least 44px with no horizontal element overflow |
| Keyboard and semantics | Dialog and mobile drawer loop/Shift+Tab/Escape/focus return, visible outline, field descriptions/errors, named native progress and dismissible status verified in Chromium |
| Functional UI | Actual progress completion/reload/retry; actual staff add/edit/clear/remove; held-request skeleton/error, empty search, retained failed form and retry tested against isolated services |
| Production guard | Actual built Next server returned **404** for `/dev/design-system` with NODE_ENV=production and unavailable app DB; [result](screenshots/production-gate.json) |
| Visual evidence | [15 unretouched browser PNGs](screenshots/README.md); normal screens/dialogs at three widths plus 360px doubled-text views |

Raw local logs are `/workspace/.onboarding/design-*.log`. Data-backed suites use the existing random-database/restricted-role/capability harness and drop their own resources afterward. No production/development database was reset, seeded or migrated by this stage; no external AI/payment operation was called. Screenshots contain only synthetic fixtures and curriculum. A one-off formatter was used for new/rewritten components without adding a formatting dependency.

Browser checks identified a 200% layout overflow and an unnamed progress control; both were fixed and the assertions retained. Visual review also caught cramped learner headings/navigation at doubled text size, so the header/title now wrap into separate rows and narrow lesson rows stack. A word-reflow assertion protects the heading/navigation regression. An initial directory check queried before the save response and another matched Next's route-announcer alert; those tests now wait for real completion and target the intended feedback region. Read-only request effects ignore stale responses rather than abort tiny POST reads during route teardown, avoiding Next 15's noisy aborted-request errors. No check was disabled to obtain a pass.

## Requirements, limits and rollback

Node 24 and the existing PostgreSQL test harness/Chromium setup remain the development/CI prerequisites. New dev dependency: `@axe-core/playwright` 4.14.0, with its required axe-core version; no runtime styling dependency. Run `npm run dev` for the workshop. Set `DESIGN_EVIDENCE_DIR` only when deliberately refreshing synthetic screenshots.

200% testing doubles root text size at a fixed viewport; native browser-menu zoom, VoiceOver/NVDA speech, OS high-contrast modes and physical touch were not manually exercised. Axe/accessible-role assertions establish automated semantic evidence, not full WCAG certification. Legacy routes and the baseline's identity, partner-isolation and financial-integrity risks remain pending. No claim is made about live Replit settings or production validation.

No schema migration or secret change is needed. Rolling back this stage requires a compatible code/component revert, not data reversal. Keep safe build/release changes and avoid removing null-clearing API compatibility while newer clients depend on it. No deployment or merge was performed. A GitHub PR is attempted only after the reviewed commit; prior API restrictions may still prevent creation.

## Exact changed files

The 15 PNGs and both JSON results are enumerated by the [screenshot index](screenshots/README.md). Source/config/documentation changes:

- [README.md](../../README.md)
- [app/admin/directory/directory.module.css](../../app/admin/directory/directory.module.css)
- [app/admin/directory/page.tsx](../../app/admin/directory/page.tsx)
- [app/admin/layout.module.css](../../app/admin/layout.module.css)
- [app/admin/layout.tsx](../../app/admin/layout.tsx)
- [app/api/admin/directory/[id]/route.ts](../../app/api/admin/directory/[id]/route.ts)
- [app/api/admin/directory/route.ts](../../app/api/admin/directory/route.ts)
- [app/components/CityDeck/city-deck.css](../../app/components/CityDeck/city-deck.css)
- [app/components/LessonList.tsx](../../app/components/LessonList.tsx)
- [app/components/NavBar.module.css](../../app/components/NavBar.module.css)
- [app/components/NavBar.tsx](../../app/components/NavBar.tsx)
- [app/components/PathLearning.tsx](../../app/components/PathLearning.tsx)
- [app/components/PathProgressBar.tsx](../../app/components/PathProgressBar.tsx)
- [app/components/ui/index.tsx](../../app/components/ui/index.tsx)
- [app/components/ui/ui.module.css](../../app/components/ui/ui.module.css)
- [app/dev/design-system/Showcase.tsx](../../app/dev/design-system/Showcase.tsx)
- [app/dev/design-system/page.tsx](../../app/dev/design-system/page.tsx)
- [app/dev/design-system/showcase.module.css](../../app/dev/design-system/showcase.module.css)
- [app/globals.css](../../app/globals.css)
- [app/invest/invest.css](../../app/invest/invest.css)
- [app/layout.tsx](../../app/layout.tsx)
- [app/page.tsx](../../app/page.tsx)
- [app/paths/[pathSlug]/page.tsx](../../app/paths/[pathSlug]/page.tsx)
- [app/paths/[pathSlug]/path.module.css](../../app/paths/[pathSlug]/path.module.css)
- [docs/accessibility.md](../../docs/accessibility.md)
- [docs/current-architecture.md](../../docs/current-architecture.md)
- [docs/design-system/README.md](../../docs/design-system/README.md)
- [docs/design-system/verification.md](../../docs/design-system/verification.md)
- [docs/upgrade-plan.md](../../docs/upgrade-plan.md)
- [docs/upgrade-status.md](../../docs/upgrade-status.md)
- [e2e/design-system.spec.ts](../../e2e/design-system.spec.ts)
- [eslint.config.mjs](../../eslint.config.mjs)
- [lib/use-modal-a11y.ts](../../lib/use-modal-a11y.ts)
- [package-lock.json](../../package-lock.json)
- [package.json](../../package.json)
- [scripts/run-tests.ts](../../scripts/run-tests.ts)
- [tests/unit/design-contrast.test.ts](../../tests/unit/design-contrast.test.ts)
