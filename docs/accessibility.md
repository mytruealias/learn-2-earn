# Accessibility (WCAG 2.2 AA) — Patterns & Conventions

The latest [learner journey verification](learner-journey/verification.md) covers shared navigation, entry/onboarding/home, named errors, keyboard/focus, target geometry and root-text reflow. The older route table below remains historical; the full legacy profile/lesson/help interface is not certified by the new shell.


This project targets **WCAG 2.2 AA**. Below are the conventions every contributor should follow. The shared primitives in `lib/use-modal-a11y.ts` and `app/globals.css` already cover the most common cases — when in doubt, copy from `HelpButton.tsx`, `FounderModal.tsx`, or the `login`/`signup` pages.

Current scoped design evidence and manual-test limits are in [the design-system guide](design-system/README.md). Older route checkmarks below are historical, not a fresh full-site audit.

## 1. Focus

- **Visible focus ring.** `app/globals.css` defines a global `:focus-visible` outline (2px solid `--accent-blue`). Do not set `outline: none` on interactive elements. If you must remove the default outline, you must replace it with another visible indicator that meets 3:1 contrast.
- **Logical tab order.** Render interactive elements in the order they appear visually. Avoid `tabindex` values greater than 0.
- **Skip-to-content:** the migrated learner path and staff directory provide explicit keyboard-visible skip links. Bottom navigation is not a skip link; other routes still need bypass review.

## 2. Modals & dialogs

Every modal must:
1. Use `useModalA11y(open, ref, onClose)` from `lib/use-modal-a11y.ts`. This hook provides:
   - Background scroll lock
   - Escape-to-close
   - Tab / Shift+Tab focus trap
   - Focus moved into the modal on open and restored to the previously-focused element on close
2. Set `role="dialog"`, `aria-modal="true"`, and either `aria-labelledby` (preferred) or `aria-label`.
3. Make the dialog container `tabIndex={-1}` so the hook can park focus on it as a fallback when no focusable child exists.
4. Provide a visible Close control (button or link) labelled with `aria-label="Close"` if the visible label is just an icon.

Reference implementations: `app/components/HelpButton.tsx`, `app/components/FounderModal.tsx`, `app/components/HubertChat.tsx`.

## 3. Forms

- **Every input has a `<label htmlFor="...">` paired with `id="..."`.** Visually-hidden labels use the `.sr-only` utility class.
- **Required fields** carry both the HTML `required` attribute and `aria-required="true"`.
- **Error containers** wrap a `role="alert" aria-live="assertive"` region so a screen-reader announces the error when it appears. Inputs related to the failure get `aria-invalid={true}` while the error is showing.
- **Help text** is referenced from the input via `aria-describedby="<helpId>"`.
- **Autocomplete tokens** match the HTML spec (`email`, `current-password`, `new-password`, `name`, `tel`, `address-level1`, `address-level2`, `postal-code`, `bday`).
- **Submission** uses a `<form onSubmit>` so Enter-to-submit and browser autofill both work. The submit button uses `type="submit"` and sets `aria-busy={loading}` while the request is in flight.

## 4. Icons & images

- All decorative SVG icons in `app/components/icons.tsx` and `app/components/LandingIcons.tsx` carry `aria-hidden="true"` and `focusable="false"`. They are always paired with adjacent text or a labelled button, so screen-readers ignore them.
- Icon-only buttons (e.g. SOS, close) carry an explicit `aria-label`.
- `<Image>` and `<img>` with semantic content get a meaningful `alt`. Decorative images get `alt=""`.

## 5. Navigation

- The bottom nav (`app/components/NavBar.tsx`) is a `<nav aria-label="Primary">`. The active link gets `aria-current="page"` so screen-readers announce location.
- Each nav link gets an `aria-label` because the visible label is small and may be hidden on very narrow viewports.

## 6. Motion

- `app/globals.css` honours `prefers-reduced-motion: reduce` by collapsing animation/transition durations to 0.01ms. New animations should not opt out of this rule.

## 7. Colour & contrast

- Body text against `--bg-primary` and `--bg-secondary` meets 4.5:1.
- Error text uses `--accent-red` on darker backgrounds where it meets 4.5:1; never put the red on the bright accent gradients.
- Do not rely on colour alone to convey state — pair colour with text or an icon (e.g. error rows include both the red border and the alert text).

## 8. Testing checklist (manual)

Before shipping a UI change, verify with the keyboard only:

1. Tab through the page — every interactive element receives a visible focus ring and the order is logical.
2. Open every modal — Escape closes it, focus is trapped inside, and focus returns to the trigger on close.
3. Submit the form with bad data — the error appears and is announced (use VoiceOver / NVDA).
4. Re-test with `prefers-reduced-motion` enabled.
5. Run an automated audit (Lighthouse > Accessibility) and resolve any new violations.

## 9. Route-by-route status

This is the audit baseline as of the WCAG 2.2 AA pass. Each route was walked
keyboard-only with focus-visible enabled.

### Public / marketing
| Route | Forms labelled | Modals trapped | Focus ring | Notes |
|---|---|---|---|---|
| `/` (B2B landing) | n/a | `FounderModal` ✅ | ✅ | Icons hidden via `aria-hidden`. |
| `/access` | ✅ (`access-code` + `aria-live` error) | n/a | ✅ | PIN gate. |
| `/login` | ✅ (htmlFor + autoComplete + alert) | n/a | ✅ | Real `<form onSubmit>`. |
| `/signup` | ✅ (3-step form, single submit, alert) | n/a | ✅ | Step Back is `type="button"`. |
| `/austin`, `/la`, `/dallas`, `/denver`, `/houston` (CityDeck) | ✅ unlock form labelled | n/a | ✅ | All decorative SVGs hidden. |
| `/invest` | n/a | n/a | ✅ | Static marketing. |

### Learner app
| Route | Forms labelled | Modals trapped | Focus ring | Notes |
|---|---|---|---|---|
| `/app` | n/a | `HelpButton` ✅ | ✅ | Bottom nav `aria-label="Primary"` + `aria-current`. |
| `/profile` | ✅ (payout: handle input + radiogroup + status region) | n/a (inline panel, not a dialog) | ✅ | Submit is `type="button"` w/ `aria-busy`. |
| `/lifeline` | ✅ (sr-only label on textarea + location input) | `HubertChat` ✅ | ✅ | SOS button has explicit `aria-label`. |
| `/lesson/[lessonId]` | n/a | Celebration screens are full-page early returns, not modals | ✅ | Quiz buttons are real `<button>` with text. |

### Admin
| Route | Forms labelled | Modals trapped | Focus ring | Notes |
|---|---|---|---|---|
| `/admin/login` | ✅ (htmlFor + autoComplete) | n/a | ✅ | Pre-existing. |
| `/admin/payouts` | ✅ (decision note + checkbox aria-label) | Inline panel | ✅ | Counter linked via `aria-describedby`. |
| `/admin/users` | ✅ (search + edit modal labelled) | Edit modal uses overlay (see follow-up #57) | ✅ | All inputs have htmlFor/id. |
| `/admin/staff` | ✅ (full name, email, role) | Create modal (see follow-up #57) | ✅ | autoComplete on name/email. |
| `/admin/cases` | ✅ (search + status + priority filters labelled) | n/a | ✅ | |
| `/admin/cases/[id]` | ✅ (note textarea + 3 modals: editMeta / dispatch / allocate) | Modals (see follow-up #57) | ✅ | All `<label>` now carry `htmlFor`. |
| `/admin/directory` | ✅ shared fields and native validation | Native shared dialog + keyboard/focus tests | ✅ | New scoped design audited at 360/768/1440 and 200% root text. |
| `/admin/finance` | ✅ (adjustment + payout config forms) | n/a | ✅ | |

### Known follow-ups
- **#57 — admin/lifeline modal hardening.** The remaining admin overlays
  (`users` edit, `staff` create, `cases/[id]` editMeta/dispatch/allocate) close on overlay click but do not yet share
  `useModalA11y` for focus trap / Escape / focus restore. The user-facing
  `HelpButton`, `FounderModal`, `HubertChat` are all wrapped. Tracked.
- **#58 — Automated axe scan in CI.** Implemented for the design showcase, learner path and staff directory through the default test suite; remaining routes still need coverage.

Run `npm run typecheck` and Lighthouse → Accessibility against `/login`,
`/signup`, `/access`, `/profile`, `/lifeline`, and `/admin/payouts` before
merging UI changes.
