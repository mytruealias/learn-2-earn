import type { Metadata } from "next";
import CityPilotPage, { CityPilotConfig } from "../components/CityPilotPage";
import {
  TrendingUpIcon, TargetIcon, BarChartIcon,
} from "../components/LandingIcons";

export const metadata: Metadata = {
  title: "Denver Pilot – Workforce Readiness & Stability",
  description:
    "A 90-day Learn2Earn pilot for Denver — incentive-based learning to drive workforce readiness and stability for residents facing instability.",
  openGraph: {
    title: "Learn2Earn Denver Pilot – Workforce Readiness & Stability",
    description:
      "Deploy Learn to Earn as a 90-day pilot to drive engagement, build life skills, and create measurable progress for Denver residents facing instability.",
    url: "/denver",
    type: "website",
    siteName: "Learn 2 Earn",
  },
  twitter: {
    card: "summary_large_image",
    title: "Learn2Earn Denver Pilot – Workforce Readiness & Stability",
    description:
      "Deploy Learn to Earn as a 90-day pilot to drive engagement, build life skills, and create measurable progress for Denver residents facing instability.",
  },
};

const denverConfig: CityPilotConfig = {
  cityName: "Denver",
  pilotDuration: "90 Days",
  heroBadge: "City of Denver \u00b7 90-Day Pilot",
  heroTitle: <>A Low-Barrier Pilot for Workforce Readiness and <em>Stability in Denver</em></>,
  heroDescription:
    "Deploy Learn to Earn as a 90-day pilot to drive engagement, build life skills, and create measurable progress for Denver residents facing instability.",
  contactEmail: "partners@learn2earn.org",
  problemTitle: "Why Denver Needs a New Approach",
  problemSubtitle:
    "Thousands of Denver residents are caught in survival mode \u2014 focused on making it through each day, not building toward tomorrow.",
  problemCards: [
    {
      icon: <TrendingUpIcon size={28} stroke="#f87171" />,
      title: "Survival Over Progress",
      description:
        "Many residents lack the stability and structure to focus on skill-building or workforce readiness. Without consistent engagement tools, progress stalls.",
    },
    {
      icon: <TargetIcon size={28} stroke="#fbbf24" />,
      title: "Low Follow-Through",
      description:
        "Existing programs struggle with consistent participation. Without clear incentives or structured milestones, learners disengage.",
    },
    {
      icon: <BarChartIcon size={28} stroke="#60a5fa" />,
      title: "Hard to Measure",
      description:
        "Programs often lack real-time visibility into engagement and outcomes, making it difficult to demonstrate impact to funders and stakeholders.",
    },
  ],
};

export default function DenverPage() {
  return <CityPilotPage config={denverConfig} />;
}
