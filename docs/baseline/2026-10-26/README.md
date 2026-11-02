# Browser baseline — 2026-10-26

All accounts, names, emails, balances, cases and payout destinations shown in these images are **synthetic disposable local test fixtures**. No real learner records, credential values or production connections were used. Visible fixture emails use the reserved `.test` domain; no usable payment destination was created. Passwords/cookies were never logged, exported or included in screenshots. Public demo names/counters are the application's existing illustrative content, not customer evidence.

Chromium 154.0.8037.57 ran from `/usr/bin/chromium` against a local Next dev server using only the verified `learn2earn_test` database. External OpenAI/Stripe bindings were disabled; ROOT_DOMAIN was unset. Full-page capture, reduced-motion preference, animations disabled for screenshots. Core state assertions and page-error/overflow observations are in [browser-results.json](browser-results.json). Supplemental request/top images were captured separately and are not counted as additional tests in that JSON. Total: **20 PNGs**, 16 core captures and four supplements.

Mobile viewport: **390×844**. Desktop viewport: **1440×1000**. Long pages produce taller images. Help is the SOS dialog on learner home (there is no `/help` page). Profile payout history/rates is the Earnings tab; the supplemental request image shows the Overview tab's redemption controls. Payout review shows the confirmation panel open without submitting a decision. No payment was sent.

| Screen / state | Mobile | Desktop |
| --- | --- | --- |
| Homepage, full page | [PNG](homepage-mobile.png) | [PNG](homepage-desktop.png) |
| Homepage, readable first viewport | [PNG](homepage-top-mobile.png) | [PNG](homepage-top-desktop.png) |
| Learner home, signed-in fresh fixture | [PNG](learner-home-mobile.png) | [PNG](learner-home-desktop.png) |
| Path, first active fixture path | [PNG](path-mobile.png) | [PNG](path-desktop.png) |
| Lesson, INFO card | [PNG](lesson-mobile.png) | [PNG](lesson-desktop.png) |
| Profile, rates / payout history | [PNG](profile-payout-mobile.png) | [PNG](profile-payout-desktop.png) |
| Profile, payout request controls | [PNG](profile-request-mobile.png) | [PNG](profile-request-desktop.png) |
| Help, SOS dialog open | [PNG](help-mobile.png) | [PNG](help-desktop.png) |
| Admin dashboard | [PNG](admin-dashboard-mobile.png) | [PNG](admin-dashboard-desktop.png) |
| Admin payout review confirmation | [PNG](payout-review-mobile.png) | [PNG](payout-review-desktop.png) |

[Source-finding results](source-finding-results.json) contain only boolean/status/numeric observations from synthetic requests: existing-account bootstrap vulnerability, Zelle rejection, perfect-run discrepancy and zero replay balance delta. They contain no account IDs, cookies, credentials or environment values. These checks ran after screenshots so the captured fixture remained stable. Initial fixtures have a synthetic balance for demonstrating redemption; that number is not claimed to result from a complete historical lesson ledger.

These captures are baseline evidence, not WCAG certification, clinical review, full UI regression coverage or production screenshots. Next's development indicator and fixed-position controls can appear within a stitched full-page image. Public timers/counters may advance between images; do not interpret them as impact measurements. No external payment/AI/phone/SMS action was invoked. Replit host routing, city-deck browser screens and all loading/empty/error/offline variants remain unverified here.

This directory's exact tracked evidence set is the 20 filenames linked above, this README, `browser-results.json` and `source-finding-results.json`. Stage S0 also changes `docs/current-architecture.md`, `docs/upgrade-plan.md`, `docs/upgrade-baseline.md`, `docs/upgrade-status.md` and the root README entry link. Rollback is a documentation/evidence commit revert; no schema/data rollback is needed.
