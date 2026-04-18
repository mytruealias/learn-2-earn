import type { CityDeckConfig } from "../types";

export const losAngelesConfig: CityDeckConfig = {
  slug: "los-angeles",
  cityName: "Los Angeles",
  partnerLine: "City of Los Angeles · 90-Day Pilot Proposal",
  heroSub:
    "A structured, measurable pilot to drive engagement, build life skills, and create real progress for Angelenos facing instability.",
  problemIntro:
    "Tens of thousands of Angelenos are caught in survival mode — focused on making it through each day, not building toward tomorrow.",
  customPathsCopy: "We build city-specific learning paths tailored to your priorities. Examples for Los Angeles:",
  customExamples: [
    "Metro & DASH Navigation",
    "WorkSource & America's Job Centers",
    "LAHSA Resource Directory",
    "Tenant Rights & Just Cause",
    "Spanish-Language Tracks",
    "Digital Access in Skid Row",
  ],
  ctaTitle: (
    <>
      Bring Learn to Earn<br />to Los Angeles
    </>
  ),
  ctaSub: "Ready to explore a 90-day pilot? Let's connect.",
  emailSubjectPilotPlan: "Los Angeles Pilot Plan Request",
  emailSubjectDemo: "Schedule Los Angeles Demo",
  unlockBadge: "City of Los Angeles · Invitation-Only Partnership Deck",
  unlockSub: "This pitch deck is shared with invited Los Angeles partners. Please enter your PIN to continue.",
  stats: {
    homeless: {
      value: "45,252",
      label: "Angelenos Experiencing Homelessness on a Single Night",
      cite: 1,
    },
    employed: {
      value: "Up to 60%",
      label: "Are Employed but Can't Afford Housing",
      cite: 2,
    },
  },
  sources: [
    <>
      <strong>45,252 Angelenos experiencing homelessness</strong> —{" "}
      Los Angeles Homeless Services Authority (LAHSA) 2024 Greater Los Angeles Homeless Count
      (City of Los Angeles total, single-night snapshot conducted January 2024).{" "}
      <a href="https://www.lahsa.org/news?article=988-2024-greater-los-angeles-homeless-count-results" target="_blank" rel="noopener noreferrer">
        lahsa.org/news (2024 Count Results)
      </a>
    </>,
    <>
      <strong>Up to 60% are employed but can&apos;t afford housing</strong> —{" "}
      U.S. Interagency Council on Homelessness (
      <a href="https://www.usich.gov/" target="_blank" rel="noopener noreferrer">usich.gov</a>
      ). Corroborated by Meyer, Wyse, et al., University of Chicago (2021),{" "}
      <em>&ldquo;Learning About Homelessness Using Linked Survey and Administrative Data&rdquo;</em> — 53% of sheltered and 40% of unsheltered adults experiencing homelessness were employed (
      <a href="https://bfi.uchicago.edu/working-paper/2021-65/" target="_blank" rel="noopener noreferrer">bfi.uchicago.edu/working-paper/2021-65</a>
      ).
    </>,
  ],
  theme: {
    // Pacific blue + sunset coral
    primary: "#0E7490",
    secondary: "#F97316",
    themeStyle: {
      "--cd-primary-rgb": "14, 116, 144",
      "--cd-secondary-rgb": "249, 115, 22",
      "--cd-primary-light": "#0891B2",
      "--cd-secondary-light": "#FB923C",
      "--cd-secondary-bright": "#FDBA74",
    } as React.CSSProperties,
  },
  metadata: {
    title: "Los Angeles Pilot – Workforce Readiness & Stability",
    description:
      "A 90-day Learn2Earn pilot for Los Angeles — incentive-based learning to drive workforce readiness and stability for Angelenos facing homelessness.",
    openGraphTitle: "Learn2Earn Los Angeles Pilot – Workforce Readiness & Stability",
    openGraphDescription:
      "A structured, measurable 90-day pilot to drive engagement, build life skills, and create real progress for Angelenos facing instability.",
    path: "/los-angeles",
  },
};
