import type { CityDeckConfig } from "../types";

export const houstonConfig: CityDeckConfig = {
  slug: "houston",
  cityName: "Houston",
  partnerLine: "City of Houston · 90-Day Pilot Proposal",
  heroSub:
    "A structured, measurable pilot to drive engagement, build life skills, and create real progress for Houstonians facing instability.",
  problemIntro:
    "Thousands of Houstonians are caught in survival mode — focused on making it through each day, not building toward tomorrow.",
  customPathsCopy: "We build city-specific learning paths tailored to your priorities. Examples for Houston:",
  customExamples: [
    "METRO Bus & Light Rail",
    "Workforce Solutions Gulf Coast",
    "Coalition for the Homeless Directory",
    "Hurricane & Heat Safety",
    "Tenant Rights in Texas",
    "Spanish-Language Tracks",
  ],
  ctaTitle: (
    <>
      Bring Learn to Earn<br />to Houston
    </>
  ),
  ctaSub: "Ready to explore a 90-day pilot? Let's connect.",
  emailSubjectPilotPlan: "Houston Pilot Plan Request",
  emailSubjectDemo: "Schedule Houston Demo",
  unlockBadge: "City of Houston · Invitation-Only Partnership Deck",
  unlockSub: "This pitch deck is shared with invited Houston partners. Please enter your PIN to continue.",
  stats: {
    homeless: {
      value: "3,280",
      label: "Harris/Fort Bend/Montgomery County Residents Experiencing Homelessness on a Single Night",
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
      <strong>3,280 residents across Harris, Fort Bend, and Montgomery Counties experiencing homelessness</strong> —{" "}
      Coalition for the Homeless of Houston/Harris County 2024 Point-in-Time Count,
      covering Harris, Fort Bend, and Montgomery Counties (single-night snapshot conducted January 2024).{" "}
      <a href="https://www.homelesshouston.org/pit-count" target="_blank" rel="noopener noreferrer">
        homelesshouston.org/pit-count
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
    // Deep space blue + warm amber (NASA / Houston nod)
    primary: "#1E3A8A",
    secondary: "#D97706",
    themeStyle: {
      "--cd-primary-rgb": "30, 58, 138",
      "--cd-secondary-rgb": "217, 119, 6",
      "--cd-primary-light": "#2563EB",
      "--cd-secondary-light": "#F59E0B",
      "--cd-secondary-bright": "#FBBF24",
    } as React.CSSProperties,
  },
  metadata: {
    title: "Houston Pilot – Workforce Readiness & Stability",
    description:
      "A 90-day Learn2Earn pilot for Houston — incentive-based learning to drive workforce readiness and stability for residents facing homelessness.",
    openGraphTitle: "Learn2Earn Houston Pilot – Workforce Readiness & Stability",
    openGraphDescription:
      "A structured, measurable 90-day pilot to drive engagement, build life skills, and create real progress for Houstonians facing instability.",
    path: "/houston",
  },
};
