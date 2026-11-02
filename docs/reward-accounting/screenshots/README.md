# Reward browser evidence

Captured in actual Chromium against synthetic fixtures in nonce-attested disposable PostgreSQL. No live learner, bank or provider records are shown. All flows use the existing CSS system. These are local browser observations, not a WCAG certification or proof of real payment delivery.

| Screen/state | 360 px | 768 px | 1440 px |
| --- | --- | --- | --- |
| Learner balances and current program terms | [360 px](learner-rewards-360.png) | [768 px](learner-rewards-768.png) | [1440 px](learner-rewards-1440.png) |
| Accessible request confirmation | [360 px](request-confirmation-360.png) | [768 px](request-confirmation-768.png) | [1440 px](request-confirmation-1440.png) |
| Held XP and request timeline | [360 px](reserved-request-360.png) | [768 px](reserved-request-768.png) | [1440 px](reserved-request-1440.png) |
| Masked staff queue and decisions | [360 px](staff-review-360.png) | [768 px](staff-review-768.png) | [1440 px](staff-review-1440.png) |
| External payment reference/time form | [360 px](manual-payment-record-360.png) | [768 px](manual-payment-record-768.png) | [1440 px](manual-payment-record-1440.png) |
| Exact finance totals, rules and manual pool | [360 px](finance-360.png) | [768 px](finance-768.png) | [1440 px](finance-1440.png) |
| Recorded payment separated from approval | [360 px](learner-paid-history-360.png) | [768 px](learner-paid-history-768.png) | [1440 px](learner-paid-history-1440.png) |

Additional capture: [200% root text at 360 px](rewards-text-200-360.png). This simulates larger text; native browser-menu zoom and physical-device testing remain unverified.

[Browser observations](browser-checks.json): 22 captures, each with zero axe violations, no horizontal document overflow, and checked interactive targets at least 44 px. Tests also exercise keyboard confirmation/focus, reduced motion, request retry, cancellation, manual-payment entry, role handling and visible network failure. Screenshots do not test screen-reader speech.

[Production-mode checks](production-checks.json): 26 local HTTP observations from a built server without an application database/provider connection. They verify public recovery/help, production-only workshop exclusion and unauthorized guards; they do not verify production infrastructure or authenticated bank/payment workflows.

See [verification](../verification.md) for executed commands and remaining release gates.
