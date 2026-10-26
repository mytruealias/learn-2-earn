# Learn2Earn design system

This is a scoped foundation and two working screen migrations, built on the existing global CSS, CSS Modules, Inter and SVG icons. It adds no styling framework, runtime component library or borrowed mascot/artwork. Representative routes: `/paths/[pathSlug]` and `/admin/directory`. Other routes retain their existing presentation until deliberately migrated.

## Design decisions

Warm off-white makes room for content, deep ink carries the hierarchy, and the brand's blue becomes a calm deep teal primary action. Green means success/completion; amber marks checkpoints; purple belongs to Hubert. The learner path groups lessons into quiet bordered units, with a single start/continue action and actual progress. The directory prioritizes finding/updating resources, with visible labels and feedback after real server responses. Cards use borders rather than glows. Elevation is reserved for tactile buttons, dialogs and notifications.

Inter is the body and heading face in adopted scopes; there are no terminal labels, condensed display headings or all-caps microcopy. Legacy fonts remain available to unmigrated routes. No reward, incentive, account, permission, payment-history or curriculum-key change is included.

## Tokens and boundaries

[globals.css](../../app/globals.css) owns the `--l2e-*` tokens. Semantic tokens are globally available, but new visual rules require **`[data-design]`**. Do not change generic element rules to migrate a single page.

| Category | Conventions |
| --- | --- |
| Color | `canvas`, `surface`, `surface-muted`, `ink`, `muted`, `primary`/`primary-hover`/`primary-soft`, `success`, `milestone`, `hubert`, `danger` and their soft surfaces, `border`, `control-border`, `on-color`, `focus`, `overlay` |
| Type | `font-body` (Inter + system fallback); `text-xs` 13px, `text-sm` 14px, body 16px, lead 18px, h3 20px, h2 24px, fluid h1 32–44px at the default root size; body leading 1.6 |
| Space | `space-1..8`: .25, .5, .75, 1, 1.5, 2, 3, 4rem; use these values/tokens rather than inventing a second scale |
| Radius | Control 12px, card 20px, dialog 24px; pill only for small non-interactive badges |
| Elevation | `shadow-button`, `shadow-raised` and `shadow-dialog`; ordinary cards have no shadow |
| Focus | 3px high-contrast blue outline with 3px offset. Lesson rows draw it inside their clipped unit boundary. Never remove focus without an equivalent visible replacement. |
| Motion | 150/220ms, shared easing; effectively instant under reduced motion. Skeletons are static; no new confetti or looping animation. |
| Targets | At least `target` = 2.75rem / 44 CSS px for links, buttons, inputs and selects. Text can wrap; never use fixed text heights. |
| Responsive layout | Compact 40rem, reading 52rem, wide 64rem. The inherited staff drawer switches at 768px/48rem. CSS variables cannot be substituted into media queries: keep literal queries and documented token values aligned. The learner content container query responds to enlarged text as well as available width. |

- **Marketing:** `.inv-page` owns its `--cy-*` variables, not `:root`. City decks own their legacy font aliases inside `.cd-page`; no city artwork/copy changed.
- **Learner:** the adopted path root and its bottom navigation opt into `[data-design]`, with `data-ui-shell="learner"`. Existing utility aliases are mapped locally to the new tokens, including the existing help controls.
- **Staff:** `data-ui-shell="staff"` identifies the staff wrapper. Only the directory route currently opts its shell/sidebar into the new presentation. Other staff modules retain their existing styling.
- **Dialogs/notifications:** carry their own opt-in marker and CSS Module classes, so they remain correct in the native top layer. Do not rely on marketing or staff variable names in primitives.
- **Shared behavior:** old components outside the adopted scopes are not automatically migrated. Reuse new primitives deliberately, and audit the actual route before broadening a scope.

## Reusable primitives and real consumers

Imports come from [app/components/ui](../../app/components/ui/index.tsx); implementation styles are in [ui.module.css](../../app/components/ui/ui.module.css).

| Primitive | Actual use / convention |
| --- | --- |
| Button / ButtonLink | Directory save/search/remove/retry; learner next lesson/back navigation. Native buttons for actions, Next links for destinations. One primary action per decision; secondary/quiet variants for alternatives; danger for confirmed removal. |
| IconButton | Directory copy controls and dialog/notification close. Required accessible label; existing SVGs are decorative. Same 44px minimum as text buttons. |
| Field | Directory inputs/select/textarea. Explicit stable ID, visible label, linked hint/error, `aria-invalid` on error. Native input types/required/maxLength remain active. Provide a visible reason for a disabled field. |
| Alert | Save/load error feedback. Error uses `role=alert`; other feedback uses polite status. Pair color with text, never color alone. |
| Dialog | Staff add/edit/remove. Native `dialog.showModal()` makes the background inert. The existing `useModalA11y` handles keyboard looping, Escape, scroll lock and focus restoration; it now filters hidden/disabled controls and does not restart on callback identity changes. Avoid nested dialogs. |
| Toast | Actual successful save/removal/copy or clipboard failure. Live status/alert, explicit dismiss, no automatic timeout. Do not announce success before a confirmed response. |
| ProgressIndicator | Labelled native progress with visible numeric counts and `aria-valuetext`. Derive counts from the server's completed lesson IDs; never infer awards from browser hints. |
| StatusBadge | Up next, complete, checkpoint, category count and Hubert label. Text states remain understandable without color. |
| Skeleton | Real path/directory loading. Decorative bars are hidden from assistive technology; loading text is a status. |
| EmptyState / ErrorState | No available lessons, no matching services, failed progress/directory reads. Explain what happened and provide a real destination/retry where useful. An error must not look like zero progress. |
| Card | Progress summary, resource entries and showcase composition. A quiet surface with a crisp border; group related rows instead of boxing every item separately. |

For Button, supply a meaningful `disabledReason` whenever unavailable; busy actions explain why the user must wait. This explanation is visible and associated with `aria-describedby`. Icon-only actions also require a meaningful `label`. Do not use a disabled-looking anchor with a live destination. Keep notifications/errors visible until the user can act on them.

Directory optional fields now accept explicit null on the existing POST/PATCH endpoints so adding sparse resources and clearing old details work. Required names/categories are not made nullable. Remove remains the existing server soft-delete. Request failures retain the form; an uncertain network save asks the user to check the directory before repeating it. API permissions and audit behavior are unchanged.

## Development workshop

Run `npm run dev`, then open `/dev/design-system` in the development environment. The page demonstrates normal/secondary/icon/disabled/busy/long-label buttons, field hints/errors/disabled controls, all semantic status colors, empty/error/retry/loading states, 0/partial/complete progress, a keyboard-operated dialog and persistent notifications. Demonstrations are labelled local examples and do not call production actions or save accounts/data.

The route returns **404 when NODE_ENV is production**. It has no production navigation link. It is intentionally dynamic so build-time evaluation cannot expose a development-only page in a production artifact.

## Verification and limitations

Run `npm run lint`, `npm run typecheck`, `npm run build`, and `npm test`. `test:design` uses the existing isolated-database harness, installs no production credentials and launches actual Chromium. The only new development dependency is pinned `@axe-core/playwright` for automated accessibility checks; CI already uses Node 24 and installs Chromium. The full default suite includes the design checks.

[Evidence index](screenshots/README.md) contains actual screenshots at **360, 768 and 1440px** plus 200% text and dialog states. All accounts/resources are synthetic test fixtures. No real learner data, secrets, private payment destinations or provider calls appear in evidence.

Verified by the browser suite: labels/accessible descriptions, named native progress, keyboard dialog and staff-drawer loop/Escape/focus restoration, visible focus, persistent/dismissible status, explicit loading/error/empty states, real directory create/edit/clear/remove, and real lesson completion reflected in progress without a local-storage ID. Axe checks the three representative surfaces and open directory dialogs. Bounding-box assertions measure target sizes and content overflow rather than trusting legacy overflow-x hiding. Reduced-motion preferences and near-zero transitions are checked.

Text-enlargement checks double the root font size to 200% while holding the viewport at each requested width. This is an automated text-zoom/reflow simulation; native browser UI zoom, platform screen-reader speech, OS high-contrast modes and physical-device touch were not manually tested. Automated accessible names/roles and axe are evidence for screen-reader semantics, not a claim that VoiceOver/NVDA was run. Full WCAG 2.2 AA compliance remains an engineering target, not a certification from this change.

No migration, runtime secret, provider or payout-rule change is required. The baseline's identity/financial integrity risks and remaining route migrations are separate work. For rollback, revert the scoped component/page changes while retaining the safe build/release workflow; there is no data reversal. Keep null-clearing API compatibility if a newer client already depends on it.

## Next-screen migration checklist

1. Audit source/routes and actual states; preserve permissions, data IDs and working destinations.
2. Opt in one shell/screen. Prefer tokens and existing SVGs; use purple only for Hubert and green only for success.
3. Reuse a primitive for a real workflow; do not add unused API variants or another styling system.
4. Include loading/empty/error/busy/disabled/success paths and a concrete recovery action. Avoid false balances or simulated production success.
5. Recheck named roles/labels, live feedback, keyboard/focus, 44px targets, contrast, long text, 200% text size and reduced motion at narrow/tablet/desktop widths.
6. Capture real screenshots with synthetic data, report exact tests/limits, and update `docs/upgrade-status.md` before review.
