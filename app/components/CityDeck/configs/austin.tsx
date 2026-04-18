import type { CityDeckConfig } from "../types";

export const austinConfig: CityDeckConfig = {
  slug: "austin",
  cityName: "Austin",
  partnerLine: "City of Austin · 90-Day Pilot Proposal",
  heroSub:
    "A structured, measurable pilot to drive engagement, build life skills, and create real progress for Austin residents facing instability.",
  problemIntro:
    "Thousands of Austin residents are caught in survival mode — focused on making it through each day, not building toward tomorrow.",
  customPathsCopy: "We build city-specific learning paths tailored to your priorities. Examples for Austin:",
  customExamples: [
    "Local Workforce Programs",
    "Public Transit Navigation",
    "City Resource Directory",
    "Cultural Orientation",
    "Tenant Rights & Housing",
    "Digital Access & Connectivity",
  ],
  ctaTitle: (
    <>
      Bring Learn to Earn<br />to Austin
    </>
  ),
  ctaSub: "Ready to explore a 90-day pilot? Let's connect.",
  emailSubjectPilotPlan: "Austin Pilot Plan Request",
  emailSubjectDemo: "Schedule Austin Demo",
  unlockBadge: "City of Austin · Invitation-Only Partnership Deck",
  unlockSub: "This pitch deck is shared with invited Austin partners. Please enter your PIN to continue.",
  stats: {
    homeless: {
      value: "3,000+",
      label: "Austinites Experiencing Homelessness on a Single Night",
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
      <strong>3,000+ Austinites experiencing homelessness</strong> —{" "}
      ECHO Austin/Travis County 2025 Point-in-Time Count (single-night snapshot, conducted January 2025).{" "}
      <a href="https://www.austinecho.org/leading-system-change/data-and-reports/" target="_blank" rel="noopener noreferrer">
        austinecho.org/leading-system-change/data-and-reports
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
    primary: "#00467F",
    secondary: "#2E7D32",
    themeStyle: {
      // Austin defaults — no overrides needed; explicit for parity.
      "--cd-primary-rgb": "0, 70, 127",
      "--cd-secondary-rgb": "46, 125, 50",
      "--cd-primary-light": "#0C5DA5",
      "--cd-secondary-light": "#43A047",
      "--cd-secondary-bright": "#66BB6A",
    } as React.CSSProperties,
  },
  metadata: {
    title: "Austin Pilot – Workforce Readiness & Stability",
    description:
      "A 90-day Learn2Earn pilot for Austin — incentive-based learning to drive workforce readiness and stability for residents facing homelessness.",
    openGraphTitle: "Learn2Earn Austin Pilot – Workforce Readiness & Stability",
    openGraphDescription:
      "A structured, measurable 90-day pilot to drive engagement, build life skills, and create real progress for Austin residents facing instability.",
    path: "/austin",
  },
};
