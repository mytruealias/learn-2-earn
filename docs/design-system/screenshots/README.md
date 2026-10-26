# Design-system browser evidence

Actual Chromium captures using only disposable synthetic fixtures. The learner sees seeded curriculum and real server-derived progress. The staff entry is explicitly synthetic, with no real location, phone number or learner information. No credentials, real personal records, production database or external provider operations were used.

Each default capture uses a 1000px-high viewport; full-page PNG height varies with content. All pages request reduced motion. Native browser/development indicators and fixed navigation can appear inside stitched full-page captures; assess a real viewport when judging overlap. No images were generated or retouched.

| Screen | 360px | 768px | 1440px |
| --- | --- | --- | --- |
| Learner path | [PNG](learner-path-360.png) | [PNG](learner-path-768.png) | [PNG](learner-path-1440.png) |
| Staff directory | [PNG](staff-directory-360.png) | [PNG](staff-directory-768.png) | [PNG](staff-directory-1440.png) |
| Development showcase | [PNG](showcase-360.png) | [PNG](showcase-768.png) | [PNG](showcase-1440.png) |
| Staff add-service dialog | [PNG](staff-dialog-360.png) | [PNG](staff-dialog-768.png) | [PNG](staff-dialog-1440.png) |

Supplemental 360px viewport captures with doubled root text size: [learner](learner-path-360-text-200.png), [staff](staff-directory-360-text-200.png), [showcase](showcase-360-text-200.png). These simulate 200% text enlargement; they do not claim a manual browser-menu zoom or platform screen-reader session. The scrollable native dialog keeps long forms inside the viewport; its fields/actions can require vertical scrolling.

[Browser observations](browser-checks.json) record normal-layout checks and the doubled-text checks at all three widths. Each surface is audited with axe against WCAG 2 A/AA, 2.1 AA and 2.2 AA tags. Bounding-box tests verify 44px controls and horizontal layout; keyboard tests additionally exercise dialog and staff-drawer looping, Escape, focus return and live notifications. [Production-gate result](production-gate.json) confirms the workshop returns 404 with NODE_ENV=production and no available application database.

These files are review evidence, not full WCAG certification. Screen-reader speech, native browser-menu zoom, physical-device touch and OS contrast modes remain manual follow-ups. See [conventions and limits](../README.md) and [verification](../verification.md).

To refresh in a verified disposable environment:

```bash
DESIGN_EVIDENCE_DIR=/absolute/path/to/docs/design-system/screenshots npm run test:design
```

Only use synthetic fixtures. Screenshots and observation files are outputs of the current run, not test assertions by themselves.
