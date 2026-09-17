import "./city-deck.css";
import Link from "next/link";
import CityDeckNav from "./CityDeckNav";
import CityDeckPrintButton from "./CityDeckPrintButton";
import {
  UsersIcon, ClipboardIcon, CoinIcon, ShieldIcon, BarChartIcon,
  CheckCircleIcon, SmartphoneIcon, BriefcaseIcon, TargetIcon,
  DollarIcon, FileTextIcon, LockIcon, TrendingUpIcon, CalendarIcon,
  HomeIcon, RocketIcon, SproutIcon, BrainIcon, LifebuoyIcon,
  StethoscopeIcon, AlertTriangleIcon, HeartHandIcon, BotIcon,
  HeartPlusIcon, RadioIcon, LayersIcon, MessageIcon,
} from "../LandingIcons";
import type { CityDeckConfig } from "./types";

interface Props {
  config: CityDeckConfig;
}

export default function CityDeckPage({ config }: Props) {
  const { cityName, partnerLine, heroSub, problemIntro, customPathsCopy, customExamples,
    ctaTitle, ctaSub, emailSubjectPilotPlan, emailSubjectDemo, stats, sources, theme } = config;
  const primary = theme.primary;
  const secondary = theme.secondary;
  const SKY = "#0288D1";
  const GOLD = "#F9A825";
  const RED = "#E53935";

  const mailto = (subject: string) => `mailto:partners@learn2earn.org?subject=${encodeURIComponent(subject)}`;

  return (
    <div className="cd-page" style={theme.themeStyle}>
      <CityDeckNav primary={primary} />

      <main>
      <section className="cd-hero" aria-labelledby="hero-heading">
        <div className="cd-hero-badge">{partnerLine}</div>
        <div className="cd-hero-nonprofit-tag">A Texas Nonprofit · 4 Years in the Community</div>
        <h1 id="hero-heading">
          Workforce Readiness &amp; Stability
          <em>Through Incentive-Based Learning</em>
        </h1>
        <p className="cd-hero-sub">{heroSub}</p>
        <div className="cd-hero-actions">
          <a href="#contact" className="cd-btn-primary">Request Pilot Plan</a>
          <a href="#contact" className="cd-btn-outline">Schedule Demo</a>
          <CityDeckPrintButton />
        </div>
      </section>

      <section className="cd-stat-highlight" aria-label="Key impact statistics">
        <ul className="cd-stat-grid" role="list">
          <li className="cd-stat-item">
            <div className="cd-stat-value">{stats.homeless.value}</div>
            <div className="cd-stat-label">
              {stats.homeless.label}
              {stats.homeless.cite && <sup className="cd-stat-cite">{stats.homeless.cite}</sup>}
            </div>
          </li>
          <li className="cd-stat-item">
            <div className="cd-stat-value">{stats.employed.value}</div>
            <div className="cd-stat-label">
              {stats.employed.label}
              {stats.employed.cite && <sup className="cd-stat-cite">{stats.employed.cite}</sup>}
            </div>
          </li>
          <li className="cd-stat-item">
            <div className="cd-stat-value">$0</div>
            <div className="cd-stat-label">Participant Cost to Join</div>
          </li>
        </ul>
      </section>

      <section className="cd-section" id="problem" aria-labelledby="problem-heading">
        <div className="cd-container">
          <div className="cd-section-header">
            <div className="cd-slide-number">01. The Challenge</div>
            <div className="cd-section-label">Why This Matters</div>
            <h2 className="cd-section-title" id="problem-heading">{cityName} Needs a <em>New Approach</em></h2>
            <p className="cd-section-subtitle">{problemIntro}</p>
          </div>
          <ul className="cd-problem-grid" role="list">
            <li className="cd-problem-card">
              <div className="cd-problem-icon cd-pi-red">
                <TrendingUpIcon size={28} stroke={RED} />
              </div>
              <h3>Survival Over Progress</h3>
              <p>
                Many residents lack the stability and structure to focus on skill-building
                or workforce readiness. Without consistent engagement, progress stalls.
              </p>
            </li>
            <li className="cd-problem-card">
              <div className="cd-problem-icon cd-pi-amber">
                <TargetIcon size={28} stroke={GOLD} />
              </div>
              <h3>Low Follow-Through</h3>
              <p>
                Existing programs struggle with consistent participation. Without clear
                incentives or structured milestones, learners disengage.
              </p>
            </li>
            <li className="cd-problem-card">
              <div className="cd-problem-icon cd-pi-blue">
                <BarChartIcon size={28} stroke={SKY} />
              </div>
              <h3>Hard to Measure</h3>
              <p>
                Programs often lack real-time visibility into engagement and outcomes,
                making it difficult to demonstrate impact to stakeholders.
              </p>
            </li>
          </ul>
        </div>
      </section>

      <hr className="cd-divider" aria-hidden="true" />

      <section className="cd-section cd-section-alt" id="solution" aria-labelledby="solution-heading">
        <div className="cd-container">
          <div className="cd-section-header">
            <div className="cd-slide-number">02. The Solution</div>
            <div className="cd-section-label">Learn to Earn</div>
            <h2 className="cd-section-title" id="solution-heading">Structured Learning, <em>Real Incentives</em></h2>
            <p className="cd-section-subtitle">
              A mobile-first platform that rewards progress with trackable incentives,
              designed for people experiencing homelessness and instability.
            </p>
          </div>
          <ul className="cd-solution-grid" role="list">
            <li className="cd-solution-item">
              <div className="cd-solution-icon"><SmartphoneIcon size={24} stroke={primary} /></div>
              <div>
                <h3>Phone-First Micro-Learning</h3>
                <p>248+ bite-sized lessons at a 6th-grade reading level, no app download needed. Works in any browser, on any device.</p>
              </div>
            </li>
            <li className="cd-solution-item">
              <div className="cd-solution-icon"><CoinIcon size={24} stroke={primary} /></div>
              <div>
                <h3>Flexible Cash Incentives</h3>
                <p>Participants earn XP for completing lessons and redeem via Zelle, Venmo, PayPal, Cash App, or check, with multi-stage admin approval.</p>
              </div>
            </li>
            <li className="cd-solution-item">
              <div className="cd-solution-icon"><BotIcon size={24} stroke={primary} /></div>
              <div>
                <h3>AI Support Companion</h3>
                <p>Hubert, a 24/7 AI companion providing trauma-informed emotional support, goal coaching, and automatic crisis escalation.</p>
              </div>
            </li>
            <li className="cd-solution-item">
              <div className="cd-solution-icon"><BarChartIcon size={24} stroke={primary} /></div>
              <div>
                <h3>Real-Time Reporting</h3>
                <p>Live dashboards showing enrollment, engagement, completion rates, and outcomes, exportable for grant and compliance reporting.</p>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <section className="cd-section" id="platform" aria-labelledby="platform-heading">
        <div className="cd-container">
          <div className="cd-section-header">
            <div className="cd-slide-number">03. Platform</div>
            <div className="cd-section-label">What&apos;s Built</div>
            <h2 className="cd-section-title" id="platform-heading">A Complete System, <em>Ready to Deploy</em></h2>
            <p className="cd-section-subtitle">
              Not a concept, a working platform with 248+ lessons, an AI companion,
              built-in safety tools, and a full admin layer.
            </p>
          </div>

          <ul className="cd-platform-grid" role="list">
            <li className="cd-platform-card">
              <div className="cd-platform-card-icon cd-pci-navy"><BotIcon size={24} stroke={primary} /></div>
              <h3>Hubert AI Companion</h3>
              <p>24/7 emotional support at a 6th-grade reading level. Trauma-informed conversations, goal coaching, and automatic crisis detection that surfaces 988 and emergency resources instantly.</p>
            </li>

            <li className="cd-platform-card">
              <div className="cd-platform-card-icon cd-pci-red"><HeartPlusIcon size={24} stroke={RED} /></div>
              <h3>Safety Net &amp; Lifeline</h3>
              <p>One-tap access to 988 Suicide &amp; Crisis Lifeline, 211, SAMHSA, and domestic violence hotlines. A &ldquo;Stress Signal&rdquo; button lets learners send urgent help requests directly to caseworkers.</p>
            </li>

            <li className="cd-platform-card">
              <div className="cd-platform-card-icon cd-pci-gold"><RadioIcon size={24} stroke={GOLD} /></div>
              <h3>Gamification Engine</h3>
              <p>Streaks, hearts, badges, and streak freezes drive daily engagement, modeled on the same mechanics that keep users coming back to top learning apps.</p>
            </li>

            <li className="cd-platform-card">
              <div className="cd-platform-card-icon cd-pci-green"><LayersIcon size={24} stroke={secondary} /></div>
              <h3>Structured Content</h3>
              <p>11 learning paths &rarr; modules &rarr; 248+ lessons &rarr; interactive cards (learn, quiz, reflection). All trauma-informed and written at a 6th-grade reading level.</p>
            </li>

            <li className="cd-platform-card">
              <div className="cd-platform-card-icon cd-pci-sky"><DollarIcon size={24} stroke={SKY} /></div>
              <h3>Managed Payouts</h3>
              <p>Three-stage approval workflow: caseworker review &rarr; finance approval &rarr; disbursement via Zelle, Venmo, PayPal, Cash App, or check. Full audit trail on every transaction.</p>
            </li>

            <li className="cd-platform-card">
              <div className="cd-platform-card-icon cd-pci-navy"><MessageIcon size={24} stroke={primary} /></div>
              <h3>Casework Hub</h3>
              <p>Staff dashboard for managing stress signals, assigning cases, adding notes, and tracking participant progress, with role-based access and compliance logging.</p>
            </li>
          </ul>
        </div>
      </section>

      <hr className="cd-divider" aria-hidden="true" />

      <section className="cd-section cd-section-alt" id="how-it-works" aria-labelledby="how-it-works-heading">
        <div className="cd-container">
          <div className="cd-section-header">
            <div className="cd-slide-number">04. Process</div>
            <div className="cd-section-label">How It Works</div>
            <h2 className="cd-section-title" id="how-it-works-heading">Five Steps to <em>Measurable Impact</em></h2>
            <p className="cd-section-subtitle">
              From enrollment to outcome tracking, a clear, repeatable process.
            </p>
          </div>
          <ol className="cd-steps" role="list">
            <li className="cd-step">
              <div className="cd-step-num" aria-hidden="true">1</div>
              <div className="cd-step-icon"><UsersIcon size={24} stroke={secondary} /></div>
              <h3>Enroll</h3>
              <p>Participants enroll through partner organizations</p>
            </li>
            <li className="cd-step">
              <div className="cd-step-num" aria-hidden="true">2</div>
              <div className="cd-step-icon"><ClipboardIcon size={24} stroke={primary} /></div>
              <h3>Learn</h3>
              <p>Complete short lessons and milestones at their own pace</p>
            </li>
            <li className="cd-step">
              <div className="cd-step-num" aria-hidden="true">3</div>
              <div className="cd-step-icon"><CoinIcon size={24} stroke={GOLD} /></div>
              <h3>Earn</h3>
              <p>Earn rewards based on verified progress and completion</p>
            </li>
            <li className="cd-step">
              <div className="cd-step-num" aria-hidden="true">4</div>
              <div className="cd-step-icon"><CheckCircleIcon size={24} stroke={SKY} /></div>
              <h3>Approve</h3>
              <p>Admin team reviews and approves incentive payouts</p>
            </li>
            <li className="cd-step">
              <div className="cd-step-num" aria-hidden="true">5</div>
              <div className="cd-step-icon"><BarChartIcon size={24} stroke={RED} /></div>
              <h3>Track</h3>
              <p>City tracks engagement and outcomes in real time</p>
            </li>
          </ol>
          <p className="cd-steps-note">
            No re-enrollment needed when expanding. New learning paths added instantly.
          </p>
        </div>
      </section>

      <hr className="cd-divider" aria-hidden="true" />

      <section className="cd-section cd-section-alt" id="scope" aria-labelledby="scope-heading">
        <div className="cd-container">
          <div className="cd-section-header">
            <div className="cd-slide-number">05. Pilot Scope</div>
            <div className="cd-section-label">Scope</div>
            <h2 className="cd-section-title" id="scope-heading">Defined, Manageable, <em>Measurable</em></h2>
          </div>
          <ul className="cd-scope-grid" role="list">
            <li className="cd-scope-card">
              <div className="cd-scope-icon"><CalendarIcon size={32} stroke={primary} /></div>
              <div className="cd-scope-value">90 Days</div>
              <div className="cd-scope-label">Duration</div>
            </li>
            <li className="cd-scope-card">
              <div className="cd-scope-icon"><UsersIcon size={32} stroke={secondary} /></div>
              <div className="cd-scope-value">Up to 500</div>
              <div className="cd-scope-label">Participants</div>
            </li>
            <li className="cd-scope-card">
              <div className="cd-scope-icon"><BriefcaseIcon size={32} stroke={GOLD} /></div>
              <div className="cd-scope-value">1 Pathway</div>
              <div className="cd-scope-label">Workforce Readiness or Life Stability</div>
            </li>
            <li className="cd-scope-card">
              <div className="cd-scope-icon"><CheckCircleIcon size={32} stroke={SKY} /></div>
              <div className="cd-scope-value">Full Support</div>
              <div className="cd-scope-label">Onboarding, Admin &amp; Reporting</div>
            </li>
          </ul>
        </div>
      </section>

      <section className="cd-section" id="deliverables" aria-labelledby="deliverables-heading">
        <div className="cd-container">
          <div className="cd-section-header">
            <div className="cd-slide-number">06. Deliverables</div>
            <div className="cd-section-label">What You Receive</div>
            <h2 className="cd-section-title" id="deliverables-heading">Everything Included in the <em>Pilot</em></h2>
          </div>
          <ul className="cd-deliver-grid" role="list">
            {[
              "Full platform access for all pilot participants",
              "Hubert AI companion with 24/7 crisis detection",
              "Admin dashboard with oversight and approval controls",
              "Casework hub with stress signal dispatch",
              "Three-stage payout approval workflow with audit trail",
              "Real-time reporting and exportable compliance data",
              "Built-in lifeline resources (988, 211, SAMHSA)",
              "Gamification engine (streaks, hearts, badges)",
              "Staff onboarding, training, and ongoing support",
            ].map((item) => (
              <li className="cd-deliver-item" key={item}>
                <CheckCircleIcon size={20} stroke={secondary} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <hr className="cd-divider" aria-hidden="true" />

      <section className="cd-section cd-section-alt" id="funding" aria-labelledby="funding-heading">
        <div className="cd-container">
          <div className="cd-section-header">
            <div className="cd-slide-number">07. Investment</div>
            <div className="cd-section-label">Funding</div>
            <h2 className="cd-section-title" id="funding-heading">Simple, <em>Transparent</em> Funding</h2>
            <p className="cd-section-subtitle">
              Two separate, clearly defined budgets, no hidden costs.
            </p>
          </div>
          <ul className="cd-funding-grid" role="list">
            <li className="cd-funding-card">
              <div className="cd-funding-badge cd-funding-badge-blue">Budget 1</div>
              <h3>Platform &amp; Support</h3>
              <p className="cd-funding-desc">Fixed monthly fee covering:</p>
              <ul className="cd-funding-list" role="list">
                <li>Software access and hosting</li>
                <li>Real-time reporting and dashboards</li>
                <li>Onboarding and staff training</li>
                <li>Ongoing technical support</li>
              </ul>
            </li>
            <li className="cd-funding-card">
              <div className="cd-funding-badge cd-funding-badge-green">Budget 2</div>
              <h3>Participant Incentive Pool</h3>
              <p className="cd-funding-desc">Funded and controlled by the city or partner:</p>
              <ul className="cd-funding-list" role="list">
                <li>Distributed based on milestone completion</li>
                <li>Fully trackable with approval rules</li>
                <li>City retains full control over disbursement</li>
                <li>Transparent audit trail for every payout</li>
              </ul>
            </li>
          </ul>
        </div>
      </section>

      <section className="cd-section" id="reporting" aria-labelledby="reporting-heading">
        <div className="cd-container">
          <div className="cd-section-header">
            <div className="cd-slide-number">08. Outcomes</div>
            <div className="cd-section-label">Reporting</div>
            <h2 className="cd-section-title" id="reporting-heading">Measurable <em>Outcomes</em></h2>
            <p className="cd-section-subtitle">
              Data available in real time and exportable for grant or compliance reporting.
            </p>
          </div>
          <ul className="cd-metrics-grid" role="list">
            <li className="cd-metric"><UsersIcon size={22} stroke={secondary} /><span>Total participants enrolled</span></li>
            <li className="cd-metric"><TrendingUpIcon size={22} stroke={primary} /><span>Active users</span></li>
            <li className="cd-metric"><ClipboardIcon size={22} stroke={GOLD} /><span>Lessons completed</span></li>
            <li className="cd-metric"><TargetIcon size={22} stroke={SKY} /><span>Milestones achieved</span></li>
            <li className="cd-metric"><DollarIcon size={22} stroke={secondary} /><span>Incentives earned &amp; approved</span></li>
            <li className="cd-metric"><BarChartIcon size={22} stroke={primary} /><span>Engagement over time</span></li>
            <li className="cd-metric"><TrendingUpIcon size={22} stroke={RED} style={{ transform: "scaleY(-1)" }} /><span>Drop-off analysis</span></li>
            <li className="cd-metric"><FileTextIcon size={22} stroke={GOLD} /><span>Exportable compliance reports</span></li>
          </ul>
        </div>
      </section>

      <hr className="cd-divider" aria-hidden="true" />

      <section className="cd-section cd-section-alt" id="security" aria-labelledby="security-heading">
        <div className="cd-container">
          <div className="cd-section-header">
            <div className="cd-slide-number">09. Compliance</div>
            <div className="cd-section-label">Security</div>
            <h2 className="cd-section-title" id="security-heading">Security &amp; <em>Oversight</em></h2>
          </div>
          <ul className="cd-security-grid" role="list">
            <li className="cd-security-item">
              <LockIcon size={24} stroke={primary} />
              <div><h3>Encryption</h3><p>Data encrypted in transit and at rest</p></div>
            </li>
            <li className="cd-security-item">
              <ShieldIcon size={24} stroke={secondary} />
              <div><h3>Role-Based Access</h3><p>Staff access controlled by role and permissions</p></div>
            </li>
            <li className="cd-security-item">
              <CheckCircleIcon size={24} stroke={GOLD} />
              <div><h3>Approval Required</h3><p>All incentive payouts require admin approval</p></div>
            </li>
            <li className="cd-security-item">
              <FileTextIcon size={24} stroke={SKY} />
              <div><h3>Full Audit Trail</h3><p>Complete log of participant activity and payouts</p></div>
            </li>
          </ul>
        </div>
      </section>

      <section className="cd-section" id="timeline" aria-labelledby="timeline-heading">
        <div className="cd-container">
          <div className="cd-section-header">
            <div className="cd-slide-number">10. Timeline</div>
            <div className="cd-section-label">Timeline</div>
            <h2 className="cd-section-title" id="timeline-heading">Pilot <em>Timeline</em></h2>
          </div>
          <ol className="cd-timeline" role="list">
            <li className="cd-timeline-item">
              <div className="cd-timeline-marker cd-tl-green" aria-hidden="true" />
              <div className="cd-timeline-content">
                <div className="cd-timeline-period">Week 1&ndash;2</div>
                <h3>Setup &amp; Onboarding</h3>
                <p>Platform configuration, admin training, and staff onboarding</p>
              </div>
            </li>
            <li className="cd-timeline-item">
              <div className="cd-timeline-marker cd-tl-blue" aria-hidden="true" />
              <div className="cd-timeline-content">
                <div className="cd-timeline-period">Week 3&ndash;4</div>
                <h3>Enrollment &amp; Launch</h3>
                <p>Participant enrollment through partner organizations and program kickoff</p>
              </div>
            </li>
            <li className="cd-timeline-item">
              <div className="cd-timeline-marker cd-tl-gold" aria-hidden="true" />
              <div className="cd-timeline-content">
                <div className="cd-timeline-period">Month 2</div>
                <h3>Engagement &amp; Optimization</h3>
                <p>Active learning, milestone tracking, incentive distribution, and process refinement</p>
              </div>
            </li>
            <li className="cd-timeline-item">
              <div className="cd-timeline-marker cd-tl-purple" aria-hidden="true" />
              <div className="cd-timeline-content">
                <div className="cd-timeline-period">Month 3</div>
                <h3>Reporting &amp; Outcome Review</h3>
                <p>Comprehensive outcome analysis, stakeholder reporting, and expansion planning</p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <hr className="cd-divider" aria-hidden="true" />

      <section className="cd-section cd-section-alt" id="learning-paths" aria-labelledby="learning-paths-heading">
        <div className="cd-container">
          <div className="cd-section-header">
            <div className="cd-slide-number">11. Content Library</div>
            <div className="cd-section-label">Learning Paths</div>
            <h2 className="cd-section-title" id="learning-paths-heading">11 Paths Ready to <em>Deploy</em></h2>
            <p className="cd-section-subtitle">
              Start with one pathway during the pilot, then layer in additional tracks
              as outcomes grow. No re-enrollment required.
            </p>
          </div>

          <div className="cd-paths-group">
            <h3 className="cd-paths-group-title">Foundational</h3>
            <ul className="cd-paths-grid" role="list">
              <li className="cd-path-card">
                <div className="cd-path-icon cd-path-icon-navy" aria-hidden="true"><HomeIcon size={20} stroke={primary} /></div>
                <div><h4>Stability Basics</h4><p>Daily routines, communication, documents, health access, and boundaries</p></div>
              </li>
              <li className="cd-path-card">
                <div className="cd-path-icon cd-path-icon-green" aria-hidden="true"><ShieldIcon size={20} stroke={secondary} /></div>
                <div><h4>Survival &amp; Systems</h4><p>Navigate housing, benefits, crisis moments, and work readiness</p></div>
              </li>
              <li className="cd-path-card">
                <div className="cd-path-icon cd-path-icon-sky" aria-hidden="true"><RocketIcon size={20} stroke={SKY} /></div>
                <div><h4>Building Your Future</h4><p>Goals, identity, education, habits, and long-term growth</p></div>
              </li>
              <li className="cd-path-card">
                <div className="cd-path-icon cd-path-icon-gold" aria-hidden="true"><DollarIcon size={20} stroke={GOLD} /></div>
                <div><h4>Financial Literacy</h4><p>Budgeting, banking, credit, and protecting yourself from scams</p></div>
              </li>
              <li className="cd-path-card">
                <div className="cd-path-icon cd-path-icon-green" aria-hidden="true"><SproutIcon size={20} stroke={secondary} /></div>
                <div><h4>Life Skills</h4><p>Communication, relationships, digital literacy, and community connection</p></div>
              </li>
            </ul>
          </div>

          <div className="cd-paths-group">
            <h3 className="cd-paths-group-title">Recovery &amp; Support</h3>
            <ul className="cd-paths-grid" role="list">
              <li className="cd-path-card">
                <div className="cd-path-icon cd-path-icon-navy" aria-hidden="true"><BrainIcon size={20} stroke={primary} /></div>
                <div><h4>Addiction &amp; Recovery Foundations</h4><p>Self-awareness, craving tools, and personal recovery planning</p></div>
              </li>
              <li className="cd-path-card">
                <div className="cd-path-icon cd-path-icon-sky" aria-hidden="true"><LifebuoyIcon size={20} stroke={SKY} /></div>
                <div><h4>Harm Reduction &amp; Safety</h4><p>Stay safer, prevent overdose, and connect to help</p></div>
              </li>
              <li className="cd-path-card">
                <div className="cd-path-icon cd-path-icon-green" aria-hidden="true"><StethoscopeIcon size={20} stroke={secondary} /></div>
                <div><h4>Treatment &amp; Recovery Navigation</h4><p>Access care, stay engaged, and navigate the treatment system</p></div>
              </li>
              <li className="cd-path-card">
                <div className="cd-path-icon cd-path-icon-navy" aria-hidden="true"><LockIcon size={20} stroke={primary} /></div>
                <div><h4>Relapse Prevention Mastery</h4><p>Warning signs, boundaries, emotional resilience, and maintenance</p></div>
              </li>
              <li className="cd-path-card">
                <div className="cd-path-icon cd-path-icon-gold" aria-hidden="true"><AlertTriangleIcon size={20} stroke={GOLD} /></div>
                <div><h4>Substance-Specific Safety</h4><p>Targeted safety for alcohol, opioids, and stimulants</p></div>
              </li>
              <li className="cd-path-card">
                <div className="cd-path-icon cd-path-icon-green" aria-hidden="true"><HeartHandIcon size={20} stroke={secondary} /></div>
                <div><h4>Supporter &amp; Family Skills</h4><p>Help a loved one without enabling, protect your own wellbeing</p></div>
              </li>
            </ul>
          </div>

          <div className="cd-custom-paths">
            <div className="cd-custom-paths-badge">+ Custom</div>
            <h3>Custom Paths for {cityName}</h3>
            <p>{customPathsCopy}</p>
            <ul className="cd-custom-examples" role="list" aria-label={`Example custom paths for ${cityName}`}>
              {customExamples.map((ex) => (<li key={ex}>{ex}</li>))}
            </ul>
            <p className="cd-custom-note">
              Custom paths are built collaboratively with city staff and deployed without additional enrollment.
            </p>
          </div>
        </div>
      </section>

      <section className="cd-section" id="expansion" aria-labelledby="expansion-heading">
        <div className="cd-container">
          <div className="cd-section-header">
            <div className="cd-slide-number">12. Growth</div>
            <div className="cd-section-label">Expansion</div>
            <h2 className="cd-section-title" id="expansion-heading">Built to <em>Scale</em></h2>
            <p className="cd-section-subtitle">
              Start focused, then expand as outcomes prove out.
            </p>
          </div>
          <ol className="cd-expand-grid" role="list">
            <li className="cd-expand-item"><div className="cd-expand-num" aria-hidden="true">1</div><h3>Start Focused</h3><p>Begin with one targeted learning pathway</p></li>
            <li className="cd-expand-item"><div className="cd-expand-num" aria-hidden="true">2</div><h3>Add Tracks</h3><p>Add more learning paths without re-enrollment</p></li>
            <li className="cd-expand-item"><div className="cd-expand-num" aria-hidden="true">3</div><h3>Extend Reach</h3><p>Expand to additional organizations or city programs</p></li>
            <li className="cd-expand-item"><div className="cd-expand-num" aria-hidden="true">4</div><h3>Scale Up</h3><p>Increase participant count in managed tiers</p></li>
          </ol>
        </div>
      </section>

      <section className="cd-cta-section" id="contact" aria-labelledby="contact-heading">
        <div className="cd-container">
          <h2 id="contact-heading">{ctaTitle}</h2>
          <p>{ctaSub}</p>
          <div className="cd-cta-actions">
            <a href={mailto(emailSubjectPilotPlan)} className="cd-btn-primary">Request Pilot Plan</a>
            <a href={mailto(emailSubjectDemo)} className="cd-btn-outline">Schedule Demo</a>
          </div>
          <p className="cd-cta-note">Response within 1 business day</p>

          <div className="cd-cta-print" aria-hidden="true">
            <div className="cd-cta-print-contact">
              <div className="cd-cta-print-label">Contact</div>
              <div className="cd-cta-print-email">partners@learn2earn.org</div>
              <div className="cd-cta-print-sub">Response within 1 business day</div>
            </div>

            <div className="cd-cta-print-next">
              <div className="cd-cta-print-label">What happens next</div>
              <ol className="cd-cta-print-steps" role="list">
                <li>
                  <span className="cd-cta-print-step-num">1</span>
                  <div>
                    <strong>Intro call (week 1)</strong>
                    <p>30-minute scoping call to align on goals, partner orgs, and the {cityName} learning paths that matter most.</p>
                  </div>
                </li>
                <li>
                  <span className="cd-cta-print-step-num">2</span>
                  <div>
                    <strong>Pilot plan (week 2)</strong>
                    <p>We deliver a tailored 90-day plan: scope, success metrics, partner roles, and a fixed budget.</p>
                  </div>
                </li>
                <li>
                  <span className="cd-cta-print-step-num">3</span>
                  <div>
                    <strong>Launch (week 3-4)</strong>
                    <p>Onboard partner orgs and case workers, distribute access PINs, and begin enrolling participants.</p>
                  </div>
                </li>
                <li>
                  <span className="cd-cta-print-step-num">4</span>
                  <div>
                    <strong>Measure &amp; report (day 90)</strong>
                    <p>Shared dashboard throughout, plus a written outcomes report covering engagement, completion, and incentive payouts.</p>
                  </div>
                </li>
              </ol>
            </div>

            <p className="cd-cta-print-foot">
              Prepared for {cityName} · {new Date().getFullYear()} · learn2earn.org
            </p>
          </div>
        </div>
      </section>

      <section className="cd-sources" aria-label="Sources">
        <div className="cd-container">
          <div className="cd-sources-label">Sources</div>
           <ol className="cd-sources-list" role="list">
            {sources.map((src, i) => (
              <li key={i}>
                <span className="cd-sources-num">{i + 1}.</span>
                <span className="cd-sources-text">{src}</span>
              </li>
            ))}
          </ol>
          <p className="cd-sources-note">
            Figures reflect the most recent publicly reported data at time of publication. Additional citations available on request.
          </p>
        </div>
      </section>
      </main>

      <footer className="cd-footer">
        <div className="cd-container">
          <div className="cd-footer-logo">Learn<span>2</span>Earn</div>
          <p className="cd-footer-tagline">
            Measurable impact. Full transparency. Real outcomes.
          </p>
          <p className="cd-footer-nonprofit">
            Learn2Earn is a Texas nonprofit organization.
          </p>
          <nav className="cd-footer-links">
            <Link href="/">Home</Link>
            <span className="cd-footer-sep">|</span>
            <a href="mailto:partners@learn2earn.org">partners@learn2earn.org</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
