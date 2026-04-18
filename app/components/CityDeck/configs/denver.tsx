import type { CityDeckConfig } from "../types";

export const denverConfig: CityDeckConfig = {
  slug: "denver",
  cityName: "Denver",
  partnerLine: "City & County of Denver · 90-Day Pilot Proposal",
  heroSub:
    "A structured, measurable pilot to drive engagement, build life skills, and create real progress for Denver residents facing instability.",
  problemIntro:
    "Thousands of Denver residents are caught in survival mode — focused on making it through each day, not building toward tomorrow.",
  customPathsCopy: "We build city-specific learning paths tailored to your priorities. Examples for Denver:",
  customExamples: [
    "RTD Light Rail & Bus Navigation",
    "Denver Workforce Services",
    "MDHI Resource Directory",
    "Cold-Weather Safety",
    "Tenant Rights in Colorado",
    "Recovery & Substance-Use Tracks",
  ],
  ctaTitle: (
    <>
      Bring Learn to Earn<br />to Denver
    </>
  ),
  ctaSub: "Ready to explore a 90-day pilot? Let's connect.",
  emailSubjectPilotPlan: "Denver Pilot Plan Request",
  emailSubjectDemo: "Schedule Denver Demo",
  unlockBadge: "City & County of Denver · Invitation-Only Partnership Deck",
  unlockSub: "This pitch deck is shared with invited Denver partners. Please enter your PIN to continue.",
  stats: {
    homeless: {
      value: "6,539",
      label: "City & County of Denver Residents Experiencing Homelessness on a Single Night",
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
      <strong>6,539 City &amp; County of Denver residents experiencing homelessness</strong> —{" "}
      Metro Denver Homeless Initiative (MDHI) 2024 Point-in-Time Count,
      City &amp; County of Denver jurisdiction (single-night snapshot conducted January 2024).{" "}
      <a href="https://www.mdhi.org/pit" target="_blank" rel="noopener noreferrer">
        mdhi.org/pit
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
    // Mountain teal + sunset orange
    primary: "#0F766E",
    secondary: "#EA580C",
    themeStyle: {
      "--cd-primary-rgb": "15, 118, 110",
      "--cd-secondary-rgb": "234, 88, 12",
      "--cd-primary-light": "#14B8A6",
      "--cd-secondary-light": "#F97316",
      "--cd-secondary-bright": "#FB923C",
    } as React.CSSProperties,
  },
  metadata: {
    title: "Denver Pilot – Workforce Readiness & Stability",
    description:
      "A 90-day Learn2Earn pilot for Denver — incentive-based learning to drive workforce readiness and stability for residents facing homelessness.",
    openGraphTitle: "Learn2Earn Denver Pilot – Workforce Readiness & Stability",
    openGraphDescription:
      "A structured, measurable 90-day pilot to drive engagement, build life skills, and create real progress for Denver residents facing instability.",
    path: "/denver",
  },
};
