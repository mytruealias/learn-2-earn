# Learner journey browser evidence

Actual Chromium screenshots from the dedicated fresh-database harness, using synthetic learner accounts and curriculum only. No live private records, credentials, payment destinations or production actions appear. Default viewports are 1000px high; full-page captures can be taller. Development indicators and sticky/fixed chrome are genuine browser artifacts in stitched full-page images.

| State | 360px | 768px | 1440px |
| --- | --- | --- | --- |
| Invitation | [PNG](access-360.png) | [PNG](access-768.png) | [PNG](access-1440.png) |
| Minimal signup | [PNG](signup-360.png) | [PNG](signup-768.png) | [PNG](signup-1440.png) |
| Program welcome | [PNG](welcome-360.png) | [PNG](welcome-768.png) | [PNG](welcome-1440.png) |
| Privacy / optional goal | [PNG](privacy-pace-360.png) | [PNG](privacy-pace-768.png) | [PNG](privacy-pace-1440.png) |
| Learner home | [PNG](learner-home-360.png) | [PNG](learner-home-768.png) | [PNG](learner-home-1440.png) |
| Confirmed sign-out | [PNG](signed-out-360.png) | [PNG](signed-out-768.png) | [PNG](signed-out-1440.png) |

Additional 360px states: [guest home](guest-home-360.png), [expired session](expired-session-360.png), [uncertain signup](interrupted-signup-360.png), [supported recovery](account-recovery-360.png), [session-read error](session-read-error-360.png), [guest sign-out explanation](guest-signout-360.png), [home with doubled text](learner-home-360-text-200.png), [deliberate shared-device reset](shared-device-reset-360.png).

[Eight local production checks](production-checks.json) use an unreachable app DB to verify public Help/recovery HTML, production showcase gating, unconfigured access and anonymous session/page protection.

[Browser observations](browser-checks.json) record axe/geometry results for captured surfaces, plus the home at 200% root text. Signup is also checked with doubled root text at each width. This is text-enlargement simulation, not a manual native browser-menu zoom or screen-reader speech test. Keyboard-open behavior uses actual profile inputs plus a controlled VisualViewport resize; physical keyboards/notches remain manual follow-ups. The legacy profile/lesson/support presentation is outside the full automated axe claim.

Reproduce only in the verified disposable environment:

```bash
JOURNEY_EVIDENCE_DIR=/absolute/path/to/docs/learner-journey/screenshots npm run test:journey
```

Evidence files are outputs, not approval to deploy or a WCAG certification. See [journey conventions and limits](../README.md) and [verification](../verification.md).
