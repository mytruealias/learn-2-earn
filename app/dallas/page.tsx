import CityPilotPage, { CityPilotConfig } from "../components/CityPilotPage";
import {
  TrendingUpIcon, TargetIcon, BarChartIcon,
} from "../components/LandingIcons";

const dallasConfig: CityPilotConfig = {
  cityName: "Dallas",
  pilotDuration: "90 Days",
  heroBadge: "City of Dallas \u00b7 90-Day Pilot",
  heroTitle: <>A Low-Barrier Pilot for Workforce Readiness and <em>Stability in Dallas</em></>,
  heroDescription:
    "Deploy Learn to Earn as a 90-day pilot to drive engagement, build life skills, and create measurable progress for Dallas residents facing instability.",
  contactEmail: "partners@learn2earn.org",
  problemTitle: "Why Dallas Needs a New Approach",
  problemSubtitle:
    "Thousands of Dallas residents are caught in survival mode \u2014 focused on making it through each day, not building toward tomorrow.",
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

export default function DallasPage() {
  return <CityPilotPage config={dallasConfig} />;
}
