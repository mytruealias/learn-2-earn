# Human-help browser evidence

Actual Chromium renders, synthetic messages/accounts only; optional AI responses are explicitly mocked. No live personal conversation/provider invocation, real location or private learner data. Tests: `e2e/hubert-support.spec.ts`; [observations](browser-checks.json); [verification and limits](../verification.md).

| Scene                                                 | Captures                                                                                      |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Public human resources and program sign-in            | [360](human-help-360.png), [768](human-help-768.png), [1440](human-help-1440.png)             |
| AI unavailable, human choices remain                  | [360](ai-unavailable-360.png), [768](ai-unavailable-768.png), [1440](ai-unavailable-1440.png) |
| Confirmed program receipt, no invented acknowledgment | [360](request-saved-360.png)                                                                  |
| Mocked interrupted AI, no alert sent                  | [1280](mocked-ai-interrupted-1280.png)                                                        |
| Explicit administrator staffing review                | [1440](intake-settings-1440.png)                                                              |

The flow also verifies a server-saved request whose response is interrupted, unchanged retry producing one case, reload/status recovery, optional-location absence, and acknowledgment only after a separate staff action. Modal close restores keyboard focus; the scrollable transcript is keyboard reachable. Automated axe and viewport checks are not exhaustive accessibility or clinical-safety review. The first browser run found native-modal focus restoration and transcript keyboard defects; these were fixed and rechecked, not suppressed.

Service outage: [360 px](support-service-unavailable-360.png). Public contacts remain available, program status stops claiming loading, AI does not invent sign-in status, and outside-U.S. selection does not invent local numbers. Full pages use full-page captures; native dialogs use actual viewport captures.
