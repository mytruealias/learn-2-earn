import type { CityDeckConfig } from "../types";

export const sanFranciscoConfig: CityDeckConfig = {
  slug: "san-francisco",
  cityName: "San Francisco",
  partnerLine: "City & County of San Francisco · 90-Day Pilot Proposal",
  heroSub:
    "A structured, measurable pilot to drive engagement, build life skills, and create real progress for San Franciscans facing instability.",
  problemIntro:
    "Thousands of San Franciscans are caught in survival mode — focused on making it through each day, not building toward tomorrow.",
  customPathsCopy: "We build city-specific learning paths tailored to your priorities. Examples for San Francisco:",
  customExamples: [
    "Muni & BART Navigation",
    "SF HSH Resource Directory",
    "OEWD WorkSource Centers",
    "Tenant Rights & Just Cause",
    "Spanish & Cantonese Tracks",
    "Tech Bootcamp Readiness",
  ],
  ctaTitle: (
    <>
      Bring Learn to Earn<br />to San Francisco
    </>
  ),
  ctaSub: "Ready to explore a 90-day pilot? Let's connect.",
  emailSubjectPilotPlan: "San Francisco Pilot Plan Request",
  emailSubjectDemo: "Schedule San Francisco Demo",
  unlockBadge: "City & County of San Francisco · Invitation-Only Partnership Deck",
  unlockSub: "This pitch deck is shared with invited San Francisco partners. Please enter your PIN to continue.",
  stats: {
    homeless: {
      value: "8,323",
      label: "San Franciscans Experiencing Homelessness on a Single Night",
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
      <strong>8,323 San Franciscans experiencing homelessness</strong> —{" "}
      San Francisco Department of Homelessness and Supportive Housing (HSH) 2024 Point-in-Time Count
      (City & County of San Francisco, single-night snapshot conducted January 2024).{" "}
      <a href="https://hsh.sfgov.org/about/research-and-reports/pit/" target="_blank" rel="noopener noreferrer">
        hsh.sfgov.org/about/research-and-reports/pit
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
    // Golden Gate International Orange + bay deep teal
    primary: "#C0362C",
    secondary: "#0F4C5C",
    themeStyle: {
      "--cd-primary-rgb": "192, 54, 44",
      "--cd-secondary-rgb": "15, 76, 92",
      "--cd-primary-light": "#D24F45",
      "--cd-secondary-light": "#1A6B82",
      "--cd-secondary-bright": "#2A8AA6",
    } as React.CSSProperties,
  },
  metadata: {
    title: "San Francisco Pilot – Workforce Readiness & Stability",
    description:
      "A 90-day Learn2Earn pilot for San Francisco — incentive-based learning to drive workforce readiness and stability for residents facing homelessness.",
    openGraphTitle: "Learn2Earn San Francisco Pilot – Workforce Readiness & Stability",
    openGraphDescription:
      "A structured, measurable 90-day pilot to drive engagement, build life skills, and create real progress for San Franciscans facing instability.",
    path: "/san-francisco",
  },
};
