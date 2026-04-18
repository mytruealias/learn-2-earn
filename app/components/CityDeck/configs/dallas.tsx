import type { CityDeckConfig } from "../types";

export const dallasConfig: CityDeckConfig = {
  slug: "dallas",
  cityName: "Dallas",
  partnerLine: "City of Dallas · 90-Day Pilot Proposal",
  heroSub:
    "A structured, measurable pilot to drive engagement, build life skills, and create real progress for Dallas residents facing instability.",
  problemIntro:
    "Thousands of Dallas residents are caught in survival mode — focused on making it through each day, not building toward tomorrow.",
  customPathsCopy: "We build city-specific learning paths tailored to your priorities. Examples for Dallas:",
  customExamples: [
    "DART & GoLink Navigation",
    "Workforce Solutions Greater Dallas",
    "MDHA Resource Directory",
    "Tenant Rights in Texas",
    "Spanish-Language Tracks",
    "Digital Access & Connectivity",
  ],
  ctaTitle: (
    <>
      Bring Learn to Earn<br />to Dallas
    </>
  ),
  ctaSub: "Ready to explore a 90-day pilot? Let's connect.",
  emailSubjectPilotPlan: "Dallas Pilot Plan Request",
  emailSubjectDemo: "Schedule Dallas Demo",
  unlockBadge: "City of Dallas · Invitation-Only Partnership Deck",
  unlockSub: "This pitch deck is shared with invited Dallas partners. Please enter your PIN to continue.",
  stats: {
    homeless: {
      value: "3,718",
      label: "Dallas & Collin County Residents Experiencing Homelessness on a Single Night",
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
      <strong>3,718 residents experiencing homelessness</strong> —{" "}
      Housing Forward 2024 Point-in-Time Count for Dallas and Collin Counties
      (single-night snapshot, conducted January 2024).{" "}
      <a href="https://housingforwardntx.org/point-in-time-count/" target="_blank" rel="noopener noreferrer">
        housingforwardntx.org/point-in-time-count
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
    // Texas burnt orange + dark navy
    primary: "#1E3A5F",
    secondary: "#BF5700",
    themeStyle: {
      "--cd-primary-rgb": "30, 58, 95",
      "--cd-secondary-rgb": "191, 87, 0",
      "--cd-primary-light": "#2C4A73",
      "--cd-secondary-light": "#D2691E",
      "--cd-secondary-bright": "#E8843D",
    } as React.CSSProperties,
  },
  metadata: {
    title: "Dallas Pilot – Workforce Readiness & Stability",
    description:
      "A 90-day Learn2Earn pilot for Dallas — incentive-based learning to drive workforce readiness and stability for residents facing homelessness.",
    openGraphTitle: "Learn2Earn Dallas Pilot – Workforce Readiness & Stability",
    openGraphDescription:
      "A structured, measurable 90-day pilot to drive engagement, build life skills, and create real progress for Dallas residents facing instability.",
    path: "/dallas",
  },
};
