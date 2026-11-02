# Learning progression browser evidence

Actual, unretouched Chromium captures from synthetic accounts/curriculum in the dedicated attested disposable database. No live private records, credentials, payment details or provider operations are used. Source fixture names explicitly identify synthetic curriculum.

| Screen | 360px | 768px | 1440px |
| --- | --- | --- | --- |
| New learner home | [PNG](new-home-360.png) | [PNG](new-home-768.png) | [PNG](new-home-1440.png) |
| Vertical learning path | [PNG](vertical-path-360.png) | [PNG](vertical-path-768.png) | [PNG](vertical-path-1440.png) |
| Equivalent linear list | [PNG](linear-list-360.png) | [PNG](linear-list-768.png) | [PNG](linear-list-1440.png) |

Other actual states: [returning home](returning-home-360.png), [all five lesson states](all-lesson-states-360.png), [all complete](all-complete-1440.png), [empty pathway](empty-path-1440.png), [empty program](empty-program-360.png), [content not ready](content-being-prepared-360.png), [goal read failure](goal-network-error-360.png), [progress read failure](path-network-error-360.png), [360px doubled text](linear-list-360-text-200.png).

Default viewports are 1000px high; full-page images vary in height. Captures wait for actual screen state and fonts, then start at scroll top. Fixed navigation, sticky chrome and development indicators remain genuine capture artifacts inside stitched full-page output. Keyboard focus is retained where intentionally tested; images are not generated or retouched.

[Ten local production checks](production-checks.json) verify public Help/recovery, production workshop gating, private routes/APIs and unconfigured access without an application database.

[Browser observations](browser-checks.json) record zero axe violations and measured bounds/targets for captured surfaces. Text enlargement doubles root text size at all three widths; native browser-menu zoom and platform screen-reader speech were not manually run. Controls are measured at least 44px; new/review/selection navigation is verified separately against before/after server snapshots to ensure it awards no XP.

Refresh only in the verified disposable environment:

```bash
PROGRESSION_EVIDENCE_DIR=/absolute/path/to/docs/learning-progression/screenshots npm run test:progression
```

See [verification/limits](../verification.md) and [data/state conventions](../README.md). Screenshots are evidence, not full-site accessibility certification or deployment approval.
