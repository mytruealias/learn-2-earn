import "../invest/invest.css";
import "./city-pilot.css";
import LandingNav from "./LandingNav";
import FounderModal from "./FounderModal";
import {
  UsersIcon, ClipboardIcon, CoinIcon, ShieldIcon, BarChartIcon,
  CheckCircleIcon, SmartphoneIcon, BriefcaseIcon, TargetIcon,
  DollarIcon, FileTextIcon, LockIcon, TrendingUpIcon, CalendarIcon,
} from "./LandingIcons";
import { ReactNode } from "react";

interface ProblemCard {
  icon: ReactNode;
  title: string;
  description: string;
}

interface SolutionItem {
  icon: ReactNode;
  title: string;
  description: string;
}

interface ScopeCard {
  icon: ReactNode;
  value: string;
  label: string;
}

interface TimelineItem {
  color: "green" | "blue" | "gold" | "purple";
  period: string;
  title: string;
  description: string;
}

export interface CityPilotConfig {
  cityName: string;
  pilotDuration: string;
  heroBadge: string;
  heroTitle: ReactNode;
  heroDescription: string;
  contactEmail: string;
  problemTitle: string;
  problemSubtitle: string;
  problemCards: ProblemCard[];
  solutionTitle?: string;
  solutionSubtitle?: string;
  solutionItems?: SolutionItem[];
  scopeCards?: ScopeCard[];
  deliverables?: string[];
  timelineItems?: TimelineItem[];
  ctaTitle?: ReactNode;
  ctaSubtitle?: string;
}

const defaultSolutionItems: SolutionItem[] = [
  {
    icon: <SmartphoneIcon size={24} stroke="#34d399" />,
    title: "Practical Content",
    description: "Guides participants through life skills and job-readiness lessons built for real-world use.",
  },
  {
    icon: <CoinIcon size={24} stroke="#34d399" />,
    title: "Trackable Incentives",
    description: "Rewards progress with controlled, trackable incentives tied to verified milestone completion.",
  },
  {
    icon: <BarChartIcon size={24} stroke="#34d399" />,
    title: "Real-Time Visibility",
    description: "Provides real-time reporting into engagement, completion rates, and measurable outcomes.",
  },
];

const defaultDeliverables = [
  "Full platform access for all pilot participants",
  "Admin dashboard with oversight and approval controls",
  "Incentive approval workflows with audit trail",
  "Real-time reporting and exportable data",
  "Staff onboarding and training",
  "Ongoing support and updates during the pilot",
];

const defaultTimelineItems: TimelineItem[] = [
  { color: "green", period: "Week 1\u20132", title: "Setup & Onboarding", description: "Platform configuration, admin training, and staff onboarding" },
  { color: "blue", period: "Week 3\u20134", title: "Enrollment & Launch", description: "Participant enrollment through partner organizations and program kickoff" },
  { color: "gold", period: "Month 2", title: "Engagement & Optimization", description: "Active learning, milestone tracking, incentive distribution, and process refinement" },
  { color: "purple", period: "Month 3", title: "Reporting & Outcome Review", description: "Comprehensive outcome analysis, stakeholder reporting, and expansion planning" },
];

export default function CityPilotPage({ config }: { config: CityPilotConfig }) {
  const {
    cityName,
    pilotDuration,
    heroBadge,
    heroTitle,
    heroDescription,
    contactEmail,
    problemTitle,
    problemSubtitle,
    problemCards,
    solutionTitle = "Structured Learning, Real Incentives",
    solutionSubtitle = "Learn to Earn is a structured, incentive-based learning platform designed for people experiencing homelessness and instability.",
    solutionItems = defaultSolutionItems,
    scopeCards,
    deliverables = defaultDeliverables,
    timelineItems = defaultTimelineItems,
    ctaTitle,
    ctaSubtitle,
  } = config;

  const encodedCity = encodeURIComponent(cityName);
  const emailSubjectPlan = `${encodedCity}%20Pilot%20Plan%20Request`;
  const emailSubjectDemo = `Schedule%20${encodedCity}%20Demo`;

  const resolvedCtaTitle = ctaTitle ?? <>Bring Learn to Earn<br />to {cityName}</>;
  const durationSlug = pilotDuration.toLowerCase().replace(/\s+days?$/i, "-day");
  const resolvedCtaSubtitle = ctaSubtitle ?? `Ready to explore a ${durationSlug} pilot? Let\u2019s connect.`;

  const resolvedScopeCards: ScopeCard[] = scopeCards ?? [
    { icon: <CalendarIcon size={32} stroke="#60a5fa" />, value: pilotDuration, label: "Duration" },
    { icon: <UsersIcon size={32} stroke="#34d399" />, value: "Up to 500", label: "Participants" },
    { icon: <BriefcaseIcon size={32} stroke="#fbbf24" />, value: "1 Pathway", label: "Workforce Readiness or Life Stability" },
    { icon: <CheckCircleIcon size={32} stroke="#a78bfa" />, value: "Full Support", label: "Onboarding, Admin Setup & Reporting" },
  ];

  return (
    <div className="inv-page">
      <LandingNav />

      <section className="inv-hero city-hero">
        <div className="inv-hero-glow inv-hero-glow-1" />
        <div className="inv-hero-glow inv-hero-glow-2" />
        <div className="inv-hero-glow inv-hero-glow-3" />

        <div className="inv-hero-badge">{heroBadge}</div>
        <h1>{heroTitle}</h1>
        <p>{heroDescription}</p>
        <div className="inv-hero-actions">
          <a href="#contact" className="inv-btn inv-btn-primary inv-btn-lg">Request Pilot Plan</a>
          <a href="#contact" className="inv-btn inv-btn-outline inv-btn-lg">Schedule Demo</a>
        </div>
      </section>

      <section className="inv-section inv-section-alt" id="problem">
        <div className="inv-container">
          <div className="inv-section-header">
            <div className="inv-section-label">The Challenge</div>
            <h2 className="inv-section-title">{problemTitle}</h2>
            <p className="inv-section-subtitle">{problemSubtitle}</p>
          </div>
          <div className="city-problem-grid">
            {problemCards.map((card, i) => (
              <div className="inv-glass-card" key={i}>
                <div className="city-problem-icon">{card.icon}</div>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="inv-section" id="solution">
        <div className="inv-container">
          <div className="inv-section-header">
            <div className="inv-section-label">The Solution</div>
            <h2 className="inv-section-title">{solutionTitle}</h2>
            <p className="inv-section-subtitle">{solutionSubtitle}</p>
          </div>
          <div className="city-solution-grid">
            {solutionItems.map((item, i) => (
              <div className="city-solution-item" key={i}>
                <div className="city-solution-icon">{item.icon}</div>
                <div>
                  <h4>{item.title}</h4>
                  <p>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="inv-section inv-section-alt" id="how-it-works">
        <div className="inv-container">
          <div className="inv-section-header">
            <div className="inv-section-label">How It Works</div>
            <h2 className="inv-section-title">Five Steps to Measurable Impact</h2>
            <p className="inv-section-subtitle">
              From enrollment to outcome tracking &mdash; a clear, repeatable process.
            </p>
          </div>
          <div className="city-steps">
            <div className="city-step">
              <div className="city-step-num">1</div>
              <div className="city-step-icon"><UsersIcon size={24} stroke="#34d399" /></div>
              <h4>Enroll</h4>
              <p>Participants enroll through partner organizations</p>
            </div>
            <div className="city-step">
              <div className="city-step-num">2</div>
              <div className="city-step-icon"><ClipboardIcon size={24} stroke="#60a5fa" /></div>
              <h4>Learn</h4>
              <p>Complete short lessons and milestones at their own pace</p>
            </div>
            <div className="city-step">
              <div className="city-step-num">3</div>
              <div className="city-step-icon"><CoinIcon size={24} stroke="#fbbf24" /></div>
              <h4>Earn</h4>
              <p>Earn rewards based on verified progress and completion</p>
            </div>
            <div className="city-step">
              <div className="city-step-num">4</div>
              <div className="city-step-icon"><CheckCircleIcon size={24} stroke="#a78bfa" /></div>
              <h4>Approve</h4>
              <p>Admin team reviews and approves incentive payouts</p>
            </div>
            <div className="city-step">
              <div className="city-step-num">5</div>
              <div className="city-step-icon"><BarChartIcon size={24} stroke="#f472b6" /></div>
              <h4>Track</h4>
              <p>City tracks engagement and outcomes in real time</p>
            </div>
          </div>
          <p className="city-steps-note">
            No need for re-enrollment when expanding. New learning paths can be added instantly.
          </p>
        </div>
      </section>

      <section className="inv-section" id="scope">
        <div className="inv-container">
          <div className="inv-section-header">
            <div className="inv-section-label">Pilot Scope</div>
            <h2 className="inv-section-title">Defined, Manageable, Measurable</h2>
          </div>
          <div className="city-scope-grid">
            {resolvedScopeCards.map((card, i) => (
              <div className="city-scope-card" key={i}>
                {card.icon}
                <div className="city-scope-value">{card.value}</div>
                <div className="city-scope-label">{card.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="inv-section inv-section-alt" id="deliverables">
        <div className="inv-container">
          <div className="inv-section-header">
            <div className="inv-section-label">What You Get</div>
            <h2 className="inv-section-title">What the City Receives</h2>
          </div>
          <div className="city-deliver-grid">
            {deliverables.map((item, i) => (
              <div className="city-deliver-item" key={i}>
                <CheckCircleIcon size={20} stroke="#34d399" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="inv-section" id="funding">
        <div className="inv-container">
          <div className="inv-section-header">
            <div className="inv-section-label">Funding</div>
            <h2 className="inv-section-title">Simple, Transparent Funding Structure</h2>
            <p className="inv-section-subtitle">
              Two separate, clearly defined budgets &mdash; no hidden costs.
            </p>
          </div>
          <div className="city-funding-grid">
            <div className="inv-glass-card city-funding-card">
              <div className="city-funding-badge city-funding-badge-blue">Budget 1</div>
              <h3>Platform &amp; Support</h3>
              <p className="city-funding-desc">Fixed monthly fee covering:</p>
              <ul className="city-funding-list">
                <li>Software access and hosting</li>
                <li>Real-time reporting and dashboards</li>
                <li>Onboarding and staff training</li>
                <li>Ongoing technical support</li>
              </ul>
            </div>
            <div className="inv-glass-card city-funding-card">
              <div className="city-funding-badge city-funding-badge-green">Budget 2</div>
              <h3>Participant Incentive Pool</h3>
              <p className="city-funding-desc">Funded and controlled by the city or partner:</p>
              <ul className="city-funding-list">
                <li>Distributed based on milestone completion</li>
                <li>Fully trackable and governed by approval rules</li>
                <li>City retains full control over disbursement</li>
                <li>Transparent audit trail for every payout</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="inv-section inv-section-alt" id="reporting">
        <div className="inv-container">
          <div className="inv-section-header">
            <div className="inv-section-label">Outcomes</div>
            <h2 className="inv-section-title">Reporting &amp; Measurable Outcomes</h2>
            <p className="inv-section-subtitle">
              Data is available in real time and exportable for grant or compliance reporting.
            </p>
          </div>
          <div className="city-metrics-grid">
            <div className="city-metric">
              <UsersIcon size={22} stroke="#34d399" />
              <span>Total participants enrolled</span>
            </div>
            <div className="city-metric">
              <TrendingUpIcon size={22} stroke="#60a5fa" />
              <span>Active users</span>
            </div>
            <div className="city-metric">
              <ClipboardIcon size={22} stroke="#fbbf24" />
              <span>Lessons completed</span>
            </div>
            <div className="city-metric">
              <TargetIcon size={22} stroke="#a78bfa" />
              <span>Milestones achieved</span>
            </div>
            <div className="city-metric">
              <DollarIcon size={22} stroke="#34d399" />
              <span>Incentives earned and approved</span>
            </div>
            <div className="city-metric">
              <BarChartIcon size={22} stroke="#60a5fa" />
              <span>Engagement over time</span>
            </div>
            <div className="city-metric">
              <TrendingUpIcon size={22} stroke="#f87171" style={{ transform: "scaleY(-1)" }} />
              <span>Drop-off points</span>
            </div>
            <div className="city-metric">
              <FileTextIcon size={22} stroke="#fbbf24" />
              <span>Exportable reports for internal and external use</span>
            </div>
          </div>
        </div>
      </section>

      <section className="inv-section" id="security">
        <div className="inv-container">
          <div className="inv-section-header">
            <div className="inv-section-label">Security</div>
            <h2 className="inv-section-title">Security &amp; Oversight</h2>
          </div>
          <div className="city-security-grid">
            <div className="city-security-item">
              <LockIcon size={24} stroke="#34d399" />
              <div>
                <h4>Encryption</h4>
                <p>Data encrypted in transit and at rest</p>
              </div>
            </div>
            <div className="city-security-item">
              <ShieldIcon size={24} stroke="#60a5fa" />
              <div>
                <h4>Role-Based Access</h4>
                <p>Staff access controlled by role and permissions</p>
              </div>
            </div>
            <div className="city-security-item">
              <CheckCircleIcon size={24} stroke="#fbbf24" />
              <div>
                <h4>Approval Required</h4>
                <p>All incentive payouts require admin approval</p>
              </div>
            </div>
            <div className="city-security-item">
              <FileTextIcon size={24} stroke="#a78bfa" />
              <div>
                <h4>Full Audit Trail</h4>
                <p>Complete log of participant activity and payouts</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="inv-section inv-section-alt" id="timeline">
        <div className="inv-container">
          <div className="inv-section-header">
            <div className="inv-section-label">Timeline</div>
            <h2 className="inv-section-title">Pilot Timeline</h2>
          </div>
          <div className="city-timeline">
            {timelineItems.map((item, i) => (
              <div className="city-timeline-item" key={i}>
                <div className={`city-timeline-marker city-tl-${item.color}`} />
                <div className="city-timeline-content">
                  <div className="city-timeline-period">{item.period}</div>
                  <h4>{item.title}</h4>
                  <p>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="inv-section" id="expansion">
        <div className="inv-container">
          <div className="inv-section-header">
            <div className="inv-section-label">Growth</div>
            <h2 className="inv-section-title">Built to Scale</h2>
            <p className="inv-section-subtitle">
              Start focused, then expand as outcomes prove out.
            </p>
          </div>
          <div className="city-expand-grid">
            <div className="city-expand-item">
              <div className="city-expand-num">1</div>
              <h4>Start Focused</h4>
              <p>Begin with one targeted learning pathway</p>
            </div>
            <div className="city-expand-item">
              <div className="city-expand-num">2</div>
              <h4>Add Tracks</h4>
              <p>Add more learning paths without re-enrollment</p>
            </div>
            <div className="city-expand-item">
              <div className="city-expand-num">3</div>
              <h4>Extend Reach</h4>
              <p>Expand to additional organizations or city programs</p>
            </div>
            <div className="city-expand-item">
              <div className="city-expand-num">4</div>
              <h4>Scale Up</h4>
              <p>Increase participant count in managed tiers</p>
            </div>
          </div>
        </div>
      </section>

      <section className="inv-section inv-section-dark" id="contact">
        <div className="inv-container">
          <div className="inv-section-header" style={{ marginBottom: "2.5rem" }}>
            <h2 className="inv-section-title">{resolvedCtaTitle}</h2>
            <p className="inv-section-subtitle">{resolvedCtaSubtitle}</p>
          </div>
          <div className="inv-hero-actions">
            <a href={`mailto:${contactEmail}?subject=${emailSubjectPlan}`} className="inv-btn inv-btn-primary inv-btn-lg">Request Pilot Plan</a>
            <a href={`mailto:${contactEmail}?subject=${emailSubjectDemo}`} className="inv-btn inv-btn-outline inv-btn-lg">Schedule Demo</a>
          </div>
          <p className="city-cta-note">Response within 1 business day</p>
        </div>
      </section>

      <footer className="inv-footer">
        <div className="inv-container">
          <div className="inv-footer-logo">
            Learn<span>2</span>Earn
          </div>
          <p className="inv-footer-tagline">
            Measurable impact. Full transparency. Real outcomes.
          </p>
          <nav className="inv-footer-links">
            <a href="/">Home</a>
            <span className="inv-footer-sep">|</span>
            <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
            <span className="inv-footer-sep">|</span>
            <FounderModal />
          </nav>
        </div>
      </footer>
    </div>
  );
}
