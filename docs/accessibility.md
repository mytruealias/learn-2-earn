# Accessibility conventions and verification limits

WCAG 2.2 AA is the engineering target, not a certification. Use the [current route/state inventory](accessibility-reliability/routes.md), [verification](accessibility-reliability/verification.md) and [design conventions](design-system/README.md). Historical route checkmarks and references to nonexistent routes have been removed; earlier evidence remains in Git history and the prior stage reports. No automated score proves conformance.

## Keyboard, focus and layout

- Use semantic links for destinations and buttons for actions, in reading order, with no positive tabindex. Every new control has visible focus: the adopted system uses a 3px high-contrast outline with offset. A target standard of at least 44 CSS px applies to controls and links; this is stronger than the minimum WCAG 2.2 target-size criterion.
- Marketing, learner and staff shells provide keyboard-visible skip links. Heading levels describe page/section hierarchy; loading and error states still need a meaningful page heading. A landmark or heading name is not proof of a complete keyboard journey.
- Measure sticky headers, bottom actions, safe areas and connection notices. Learner focus offsets use observed chrome size; the staff mobile menu moves below a visible connection notice. Test enlarged text, narrow viewports, validation focus and keyboard-open layouts. Never hide overflow just to pass a viewport check.
- Shared Dialog uses the native top layer and `useModalA11y` for trapping, Escape, scroll lock and focus restoration. It has a named title and 44px close control. A documented pending action may disable dismissal; the reason must be visible and a bounded request must eventually resolve. Backdrop and Escape honor the same disabled-close guard. The staff navigation drawer uses the existing hook and inert background. Do not add a new custom overlay implementation.

## Forms and feedback

- Give each input a visible associated label (htmlFor/id or an appropriate wrapping label). A placeholder is not a label. Preserve correct autocomplete/input types and native required behavior; redundant aria-required is not necessary for a native required input.
- Field hints/errors use stable describedby IDs; invalid fields use aria-invalid. Move focus to the first invalid control where appropriate without taking focus away during unrelated updates.
- Errors are alerts; confirmations are polite status regions. Do not add a redundant aria-live when the role already supplies it. Keep messages long enough to use; shared toasts persist until dismissed. Never announce saved/paid/sent based only on a click, timer or animation.
- The connection notice describes offline, slow and uncertain outcomes, with human-help access and no auto-replay. Client transport has a deadline covering response bodies and caller cancellation. Preserve the screen’s input after uncertain saves. The original intent key governs explicit financial/help retries; a generic network retry must not create a new payment/action.

## Meaning, contrast, motion and audio

- Pair color with meaningful text. Check contrast against the actual rendered background: 4.5:1 for normal text, 3:1 for large text and applicable component/focus boundaries. Token names or old screenshots do not prove every state passes.
- Use named native progress; derive counts from server records. Do not simulate awards, make essential learning depend on hearts, or label an approval as a transfer. Badge explanation in Profile refers to first-completion evidence rather than lost hearts.
- Decorative SVGs/images are hidden or have empty alt; informative images need meaningful alt. Icon-only controls need a name. New artwork must preserve the original Learn2Earn identity.
- Respect prefers-reduced-motion; use short optional transitions and no compulsory celebration or audio. Device/cloud speech starts only after an explicit choice, can be stopped, and needs accurate provider/privacy language. Public human-help contacts stay accessible when AI, sign-in or storage fail.

## What the current evidence means

The current Chromium suite checks selected WCAG tags with axe, inspects headings and accessibility-tree control names/roles, tests keyboard dialog/menu/skip behavior, offline/reconnect, text enlargement, and representative unavailable states. Public/city presentation uses no participant records. Staff client errors use explicit synthetic API interception and do not verify backend authorization. The nonce-attested full API/browser harness remains separately required.

Root font-size 200% is a text-reflow simulation, not native browser UI zoom. Chromium’s accessibility tree is a semantics spot check, not VoiceOver/NVDA/Orca speech. This Linux/headless environment has no platform screen reader; native zoom, physical devices, assistive-technology reading/announcements and the complete interruption matrix remain unresolved. Production-mode lab measurements are also blocked by the native Prisma download prerequisite. See the route inventory for exactly which routes/states are source-reviewed, browser checked or blocked; do not turn these limitations into compliance claims.
