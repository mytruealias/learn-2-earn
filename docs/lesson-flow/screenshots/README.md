# Lesson and Practice browser evidence

Captured from the actual Next development server with Chromium and synthetic accounts/curriculum in a fresh nonce-attested PostgreSQL database. Screens are full-page, unretouched and have no live learner information. Each capture checks axe WCAG 2 A/AA, 2.1 AA and 2.2 AA rules, horizontal overflow and 44px control hit areas (native radio inputs use their large associated choice labels). The player footer remains fixed at the viewport bottom; full-page captures can therefore show that bar within the long document. Its measured height reserves scrolling space so underlying content can be reached.

| Screen | 360 px | 768 px | 1440 px |
| --- | --- | --- | --- |
| Teaching / initial lesson | [Phone](teaching-360.png) | [Tablet](teaching-768.png) | [Desktop](teaching-1440.png) |
| Helpful wrong-answer feedback | [Phone](helpful-feedback-360.png) | [Tablet](helpful-feedback-768.png) | [Desktop](helpful-feedback-1440.png) |
| First completion and confirmed XP | [Phone](first-completion-360.png) | [Tablet](first-completion-768.png) | [Desktop](first-completion-1440.png) |
| Due review and Practice | [Phone](practice-due-360.png) | [Tablet](practice-due-768.png) | [Desktop](practice-due-1440.png) |
| Practice completion / no extra credit | [Phone](practice-completion-360.png) | [Tablet](practice-completion-768.png) | [Desktop](practice-completion-1440.png) |

Additional captures: [reflection with 200% root text at 360 px](reflection-text-200-360.png), [failed save at 1440 px](failed-save-1440.png), [malformed content at 1440 px](content-issue-1440.png). Total: **18 PNGs**. No screenshot is a substitute for functional assertions.

[Browser observations](browser-checks.json) · [16 production-mode checks with unreachable application database](production-checks.json) · [Verification and limits](../verification.md).

The complete browser suite also exercises native radio keyboard selection, persisted feedback/position across reload, optional notes cleared on reload, exit explanation and focus, zero-heart completion, topic filtering, missed-question correction, unchanged first Progress and payout history during practice, separate activity count, expired/replaced sessions, retry after a lost committed response, empty/error Practice views and timezone persistence. Speech output, native browser menu zoom and real device keyboards/safe areas still require platform checks. The 200% capture is root text resizing, not a claim of testing the browser's native zoom menu. Reduced motion is requested during the three-width flows; the new UI has no celebration animation.
