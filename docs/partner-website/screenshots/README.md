# Partner website browser evidence

Captured in actual headless Chromium from local Next development servers on 2026-11-01. All sample names/messages/PINs are synthetic. No production participant, payment handle, credential or conversation is shown. Images are original browser captures, not edited mockups. The small Next development indicator is a development-server artifact.

Before: source `af9db34`, port 5065, an unusable database binding, synthetic signing key and city gate. This preserves old unsupported public claims as baseline evidence, not current assertions. Five templates × four widths = **20 PNGs**. After: source on `feat/partner-website`, `playwright.marketing.config.ts`, port 5055, explicitly unusable database, no live providers or participant records. Six templates × four widths plus three state/zoom captures = **27 PNGs**. [After observations](after/checks.json) record zero selected WCAG axe violations, no horizontal overflow and checked 44 px targets for all 27 scenes. This is not WCAG certification or a full screen-reader/device evaluation.

The after catalog is honestly unavailable and online intake is disabled by default. The two inquiry state images use explicit synthetic request interception, not a real database or delivery. The user-visible sample uses the real card renderer. All six PIN gates use real endpoints with synthetic local PINs. The 200% image changes root text size, not native browser zoom; native zoom/assistive-technology checks remain.

## Before and after

| Template | 360 | 390 | 768 | 1440 |
| --- | --- | --- | --- | --- |
| home | [before](before/home-360.png) · [after](after/home-360.png) | [before](before/home-390.png) · [after](after/home-390.png) | [before](before/home-768.png) · [after](after/home-768.png) | [before](before/home-1440.png) · [after](after/home-1440.png) |
| privacy | [before](before/privacy-360.png) · [after](after/privacy-360.png) | [before](before/privacy-390.png) · [after](after/privacy-390.png) | [before](before/privacy-768.png) · [after](after/privacy-768.png) | [before](before/privacy-1440.png) · [after](after/privacy-1440.png) |
| terms | [before](before/terms-360.png) · [after](after/terms-360.png) | [before](before/terms-390.png) · [after](after/terms-390.png) | [before](before/terms-768.png) · [after](after/terms-768.png) | [before](before/terms-1440.png) · [after](after/terms-1440.png) |
| city-unlock | [before](before/city-unlock-360.png) · [after](after/city-unlock-360.png) | [before](before/city-unlock-390.png) · [after](after/city-unlock-390.png) | [before](before/city-unlock-768.png) · [after](after/city-unlock-768.png) | [before](before/city-unlock-1440.png) · [after](after/city-unlock-1440.png) |
| city-deck | [before](before/city-deck-360.png) · [after](after/city-deck-360.png) | [before](before/city-deck-390.png) · [after](after/city-deck-390.png) | [before](before/city-deck-768.png) · [after](after/city-deck-768.png) | [before](before/city-deck-1440.png) · [after](after/city-deck-1440.png) |
| New shared lesson demo | [after](after/demo-360.png) | [after](after/demo-390.png) | [after](after/demo-768.png) | [after](after/demo-1440.png) |

Other actual captures: [uncertain inquiry, 390](after/inquiry-uncertain-390.png), [synthetic acknowledged receipt, 390](after/inquiry-saved-390.png), [200% text, 360](after/home-text-200-360.png).

## Gated print documents

Each file was produced by Chromium print emulation after a real local PIN request; the tests assert noindex, a visible primary heading and hidden navigation/skip controls. PDFs are tagged, A4, two pages; Austin was inspected visually and by text extraction to check the page break and removal of print controls. Tagging alone is not a complete accessible-PDF audit.

- [austin discussion outline](after/discussion-austin.pdf)
- [dallas discussion outline](after/discussion-dallas.pdf)
- [houston discussion outline](after/discussion-houston.pdf)
- [denver discussion outline](after/discussion-denver.pdf)
- [los-angeles discussion outline](after/discussion-los-angeles.pdf)
- [san-francisco discussion outline](after/discussion-san-francisco.pdf)

## Visual inspection

Inspected full-page desktop/mobile homepage and narrow city output, plus public template captures, generated social image and the Austin print page. The homepage moves from a concise program proposition into actual learner interaction, staff tasks and a pilot decision; the mobile layout keeps the same content in reading order. The print inspection caught a global skip link leaking into PDF, which was fixed and regenerated. Initial automated checks also caught narrow city button contrast, unstable error-label naming and an OG rendering error; all were fixed before these final captures.
