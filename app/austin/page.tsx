import type { Metadata } from "next";
import "./austin.css";
import AustinNav from "./AustinNav";
import {
  UsersIcon, ClipboardIcon, CoinIcon, ShieldIcon, BarChartIcon,
  CheckCircleIcon, SmartphoneIcon, BriefcaseIcon, TargetIcon,
  DollarIcon, FileTextIcon, LockIcon, TrendingUpIcon, CalendarIcon,
  HomeIcon, RocketIcon, SproutIcon, BrainIcon, LifebuoyIcon,
  StethoscopeIcon, AlertTriangleIcon, HeartHandIcon, BotIcon,
  HeartPlusIcon, RadioIcon, LayersIcon, MessageIcon, GlobeIcon,
} from "../components/LandingIcons";

export const metadata: Metadata = {
  title: "Austin Pilot – Workforce Readiness & Stability",
  description:
    "A 90-day Learn2Earn pilot for Austin — incentive-based learning to drive workforce readiness and stability for residents facing homelessness.",
  openGraph: {
    title: "Learn2Earn Austin Pilot – Workforce Readiness & Stability",
    description:
      "A structured, measurable 90-day pilot to drive engagement, build life skills, and create real progress for Austin residents facing instability.",
    url: "/austin",
    type: "website",
    siteName: "Learn 2 Earn",
  },
  twitter: {
    card: "summary_large_image",
    title: "Learn2Earn Austin Pilot – Workforce Readiness & Stability",
    description:
      "A structured, measurable 90-day pilot to drive engagement, build life skills, and create real progress for Austin residents facing instability.",
  },
};

export default function AustinPage() {
  return (
    <div className="atx-page">
      <AustinNav />

      <section className="atx-hero">
        <div className="atx-hero-badge">City of Austin &middot; 90-Day Pilot Proposal</div>
        <h1>
          Workforce Readiness &amp; Stability
          <em>Through Incentive-Based Learning</em>
        </h1>
        <p className="atx-hero-sub">
          A structured, measurable pilot to drive engagement, build life skills, and
          create real progress for Austin residents facing instability.
        </p>
        <div className="atx-hero-actions">
          <a href="#contact" className="atx-btn-primary">Request Pilot Plan</a>
          <a href="#contact" className="atx-btn-outline">Schedule Demo</a>
        </div>
      </section>

      <div className="atx-stat-highlight">
        <div className="atx-stat-grid">
          <div className="atx-stat-item">
            <div className="atx-stat-value">3,000+</div>
            <div className="atx-stat-label">
              Austinites Experiencing Homelessness on a Single Night
              <sup className="atx-stat-cite">1</sup>
            </div>
          </div>
          <div className="atx-stat-item">
            <div className="atx-stat-value">Up to 60%</div>
            <div className="atx-stat-label">
              Are Employed but Can&apos;t Afford Housing
              <sup className="atx-stat-cite">2</sup>
            </div>
          </div>
          <div className="atx-stat-item">
            <div className="atx-stat-value">$0</div>
            <div className="atx-stat-label">Participant Cost to Join</div>
          </div>
        </div>
      </div>

      <section className="atx-section" id="problem">
        <div className="atx-container">
          <div className="atx-section-header">
            <div className="atx-slide-number">01 &mdash; The Challenge</div>
            <div className="atx-section-label">Why This Matters</div>
            <h2 className="atx-section-title">Austin Needs a <em>New Approach</em></h2>
            <p className="atx-section-subtitle">
              Thousands of Austin residents are caught in survival mode &mdash; focused on
              making it through each day, not building toward tomorrow.
            </p>
          </div>
          <div className="atx-problem-grid">
            <div className="atx-problem-card">
              <div className="atx-problem-icon atx-pi-red">
                <TrendingUpIcon size={28} stroke="#E53935" />
              </div>
              <h3>Survival Over Progress</h3>
              <p>
                Many residents lack the stability and structure to focus on skill-building
                or workforce readiness. Without consistent engagement, progress stalls.
              </p>
            </div>
            <div className="atx-problem-card">
              <div className="atx-problem-icon atx-pi-amber">
                <TargetIcon size={28} stroke="#F9A825" />
              </div>
              <h3>Low Follow-Through</h3>
              <p>
                Existing programs struggle with consistent participation. Without clear
                incentives or structured milestones, learners disengage.
              </p>
            </div>
            <div className="atx-problem-card">
              <div className="atx-problem-icon atx-pi-blue">
                <BarChartIcon size={28} stroke="#0288D1" />
              </div>
              <h3>Hard to Measure</h3>
              <p>
                Programs often lack real-time visibility into engagement and outcomes,
                making it difficult to demonstrate impact to stakeholders.
              </p>
            </div>
          </div>
        </div>
      </section>

      <hr className="atx-divider" />

      <section className="atx-section atx-section-alt" id="solution">
        <div className="atx-container">
          <div className="atx-section-header">
            <div className="atx-slide-number">02 &mdash; The Solution</div>
            <div className="atx-section-label">Learn to Earn</div>
            <h2 className="atx-section-title">Structured Learning, <em>Real Incentives</em></h2>
            <p className="atx-section-subtitle">
              A mobile-first platform that rewards progress with trackable incentives &mdash;
              designed for people experiencing homelessness and instability.
            </p>
          </div>
          <div className="atx-solution-grid">
            <div className="atx-solution-item">
              <div className="atx-solution-icon">
                <SmartphoneIcon size={24} stroke="#00467F" />
              </div>
              <div>
                <h4>Phone-First Micro-Learning</h4>
                <p>248+ bite-sized lessons at a 6th-grade reading level &mdash; no app download needed. Works in any browser, on any device.</p>
              </div>
            </div>
            <div className="atx-solution-item">
              <div className="atx-solution-icon">
                <CoinIcon size={24} stroke="#00467F" />
              </div>
              <div>
                <h4>Flexible Cash Incentives</h4>
                <p>Participants earn XP for completing lessons and redeem via Zelle, Venmo, PayPal, Cash App, or check &mdash; with multi-stage admin approval.</p>
              </div>
            </div>
            <div className="atx-solution-item">
              <div className="atx-solution-icon">
                <BotIcon size={24} stroke="#00467F" />
              </div>
              <div>
                <h4>AI Support Companion</h4>
                <p>Hubert &mdash; a 24/7 AI companion providing trauma-informed emotional support, goal coaching, and automatic crisis escalation.</p>
              </div>
            </div>
            <div className="atx-solution-item">
              <div className="atx-solution-icon">
                <BarChartIcon size={24} stroke="#00467F" />
              </div>
              <div>
                <h4>Real-Time Reporting</h4>
                <p>Live dashboards showing enrollment, engagement, completion rates, and outcomes &mdash; exportable for grant and compliance reporting.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="atx-section" id="platform">
        <div className="atx-container">
          <div className="atx-section-header">
            <div className="atx-slide-number">03 &mdash; Platform</div>
            <div className="atx-section-label">What&apos;s Built</div>
            <h2 className="atx-section-title">A Complete System, <em>Ready to Deploy</em></h2>
            <p className="atx-section-subtitle">
              Not a concept &mdash; a working platform with 248+ lessons, an AI companion,
              built-in safety tools, and a full admin layer.
            </p>
          </div>

          <div className="atx-platform-grid">
            <div className="atx-platform-card">
              <div className="atx-platform-card-icon atx-pci-navy">
                <BotIcon size={24} stroke="#00467F" />
              </div>
              <h4>Hubert AI Companion</h4>
              <p>24/7 emotional support at a 6th-grade reading level. Trauma-informed conversations, goal coaching, and automatic crisis detection that surfaces 988 and emergency resources instantly.</p>
            </div>

            <div className="atx-platform-card">
              <div className="atx-platform-card-icon atx-pci-red">
                <HeartPlusIcon size={24} stroke="#E53935" />
              </div>
              <h4>Safety Net &amp; Lifeline</h4>
              <p>One-tap access to 988 Suicide &amp; Crisis Lifeline, 211, SAMHSA, and domestic violence hotlines. A &ldquo;Stress Signal&rdquo; button lets learners send urgent help requests directly to caseworkers.</p>
            </div>

            <div className="atx-platform-card">
              <div className="atx-platform-card-icon atx-pci-gold">
                <RadioIcon size={24} stroke="#F9A825" />
              </div>
              <h4>Gamification Engine</h4>
              <p>Streaks, hearts, badges, and streak freezes drive daily engagement &mdash; modeled on the same mechanics that keep users coming back to top learning apps.</p>
            </div>

            <div className="atx-platform-card">
              <div className="atx-platform-card-icon atx-pci-green">
                <LayersIcon size={24} stroke="#2E7D32" />
              </div>
              <h4>Structured Content</h4>
              <p>11 learning paths &rarr; modules &rarr; 248+ lessons &rarr; interactive cards (learn, quiz, reflection). All trauma-informed and written at a 6th-grade reading level.</p>
            </div>

            <div className="atx-platform-card">
              <div className="atx-platform-card-icon atx-pci-sky">
                <DollarIcon size={24} stroke="#0288D1" />
              </div>
              <h4>Managed Payouts</h4>
              <p>Three-stage approval workflow: caseworker review &rarr; finance approval &rarr; disbursement via Zelle, Venmo, PayPal, Cash App, or check. Full audit trail on every transaction.</p>
            </div>

            <div className="atx-platform-card">
              <div className="atx-platform-card-icon atx-pci-navy">
                <MessageIcon size={24} stroke="#00467F" />
              </div>
              <h4>Casework Hub</h4>
              <p>Staff dashboard for managing stress signals, assigning cases, adding notes, and tracking participant progress &mdash; with role-based access and compliance logging.</p>
            </div>
          </div>
        </div>
      </section>

      <hr className="atx-divider" />

      <section className="atx-section atx-section-alt" id="how-it-works">
        <div className="atx-container">
          <div className="atx-section-header">
            <div className="atx-slide-number">04 &mdash; Process</div>
            <div className="atx-section-label">How It Works</div>
            <h2 className="atx-section-title">Five Steps to <em>Measurable Impact</em></h2>
            <p className="atx-section-subtitle">
              From enrollment to outcome tracking &mdash; a clear, repeatable process.
            </p>
          </div>
          <div className="atx-steps">
            <div className="atx-step">
              <div className="atx-step-num">1</div>
              <div className="atx-step-icon"><UsersIcon size={24} stroke="#2E7D32" /></div>
              <h4>Enroll</h4>
              <p>Participants enroll through partner organizations</p>
            </div>
            <div className="atx-step">
              <div className="atx-step-num">2</div>
              <div className="atx-step-icon"><ClipboardIcon size={24} stroke="#00467F" /></div>
              <h4>Learn</h4>
              <p>Complete short lessons and milestones at their own pace</p>
            </div>
            <div className="atx-step">
              <div className="atx-step-num">3</div>
              <div className="atx-step-icon"><CoinIcon size={24} stroke="#F9A825" /></div>
              <h4>Earn</h4>
              <p>Earn rewards based on verified progress and completion</p>
            </div>
            <div className="atx-step">
              <div className="atx-step-num">4</div>
              <div className="atx-step-icon"><CheckCircleIcon size={24} stroke="#0288D1" /></div>
              <h4>Approve</h4>
              <p>Admin team reviews and approves incentive payouts</p>
            </div>
            <div className="atx-step">
              <div className="atx-step-num">5</div>
              <div className="atx-step-icon"><BarChartIcon size={24} stroke="#E53935" /></div>
              <h4>Track</h4>
              <p>City tracks engagement and outcomes in real time</p>
            </div>
          </div>
          <p className="atx-steps-note">
            No re-enrollment needed when expanding. New learning paths added instantly.
          </p>
        </div>
      </section>

      <hr className="atx-divider" />

      <section className="atx-section atx-section-alt" id="scope">
        <div className="atx-container">
          <div className="atx-section-header">
            <div className="atx-slide-number">05 &mdash; Pilot Scope</div>
            <div className="atx-section-label">Scope</div>
            <h2 className="atx-section-title">Defined, Manageable, <em>Measurable</em></h2>
          </div>
          <div className="atx-scope-grid">
            <div className="atx-scope-card">
              <div className="atx-scope-icon"><CalendarIcon size={32} stroke="#00467F" /></div>
              <div className="atx-scope-value">90 Days</div>
              <div className="atx-scope-label">Duration</div>
            </div>
            <div className="atx-scope-card">
              <div className="atx-scope-icon"><UsersIcon size={32} stroke="#2E7D32" /></div>
              <div className="atx-scope-value">Up to 500</div>
              <div className="atx-scope-label">Participants</div>
            </div>
            <div className="atx-scope-card">
              <div className="atx-scope-icon"><BriefcaseIcon size={32} stroke="#F9A825" /></div>
              <div className="atx-scope-value">1 Pathway</div>
              <div className="atx-scope-label">Workforce Readiness or Life Stability</div>
            </div>
            <div className="atx-scope-card">
              <div className="atx-scope-icon"><CheckCircleIcon size={32} stroke="#0288D1" /></div>
              <div className="atx-scope-value">Full Support</div>
              <div className="atx-scope-label">Onboarding, Admin &amp; Reporting</div>
            </div>
          </div>
        </div>
      </section>

      <section className="atx-section" id="deliverables">
        <div className="atx-container">
          <div className="atx-section-header">
            <div className="atx-slide-number">06 &mdash; Deliverables</div>
            <div className="atx-section-label">What You Receive</div>
            <h2 className="atx-section-title">Everything Included in the <em>Pilot</em></h2>
          </div>
          <div className="atx-deliver-grid">
            <div className="atx-deliver-item">
              <CheckCircleIcon size={20} stroke="#2E7D32" />
              <span>Full platform access for all pilot participants</span>
            </div>
            <div className="atx-deliver-item">
              <CheckCircleIcon size={20} stroke="#2E7D32" />
              <span>Hubert AI companion with 24/7 crisis detection</span>
            </div>
            <div className="atx-deliver-item">
              <CheckCircleIcon size={20} stroke="#2E7D32" />
              <span>Admin dashboard with oversight and approval controls</span>
            </div>
            <div className="atx-deliver-item">
              <CheckCircleIcon size={20} stroke="#2E7D32" />
              <span>Casework hub with stress signal dispatch</span>
            </div>
            <div className="atx-deliver-item">
              <CheckCircleIcon size={20} stroke="#2E7D32" />
              <span>Three-stage payout approval workflow with audit trail</span>
            </div>
            <div className="atx-deliver-item">
              <CheckCircleIcon size={20} stroke="#2E7D32" />
              <span>Real-time reporting and exportable compliance data</span>
            </div>
            <div className="atx-deliver-item">
              <CheckCircleIcon size={20} stroke="#2E7D32" />
              <span>Built-in lifeline resources (988, 211, SAMHSA)</span>
            </div>
            <div className="atx-deliver-item">
              <CheckCircleIcon size={20} stroke="#2E7D32" />
              <span>Gamification engine (streaks, hearts, badges)</span>
            </div>
            <div className="atx-deliver-item">
              <CheckCircleIcon size={20} stroke="#2E7D32" />
              <span>Staff onboarding, training, and ongoing support</span>
            </div>
          </div>
        </div>
      </section>

      <hr className="atx-divider" />

      <section className="atx-section atx-section-alt" id="funding">
        <div className="atx-container">
          <div className="atx-section-header">
            <div className="atx-slide-number">07 &mdash; Investment</div>
            <div className="atx-section-label">Funding</div>
            <h2 className="atx-section-title">Simple, <em>Transparent</em> Funding</h2>
            <p className="atx-section-subtitle">
              Two separate, clearly defined budgets &mdash; no hidden costs.
            </p>
          </div>
          <div className="atx-funding-grid">
            <div className="atx-funding-card">
              <div className="atx-funding-badge atx-funding-badge-blue">Budget 1</div>
              <h3>Platform &amp; Support</h3>
              <p className="atx-funding-desc">Fixed monthly fee covering:</p>
              <ul className="atx-funding-list">
                <li>Software access and hosting</li>
                <li>Real-time reporting and dashboards</li>
                <li>Onboarding and staff training</li>
                <li>Ongoing technical support</li>
              </ul>
            </div>
            <div className="atx-funding-card">
              <div className="atx-funding-badge atx-funding-badge-green">Budget 2</div>
              <h3>Participant Incentive Pool</h3>
              <p className="atx-funding-desc">Funded and controlled by the city or partner:</p>
              <ul className="atx-funding-list">
                <li>Distributed based on milestone completion</li>
                <li>Fully trackable with approval rules</li>
                <li>City retains full control over disbursement</li>
                <li>Transparent audit trail for every payout</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="atx-section" id="reporting">
        <div className="atx-container">
          <div className="atx-section-header">
            <div className="atx-slide-number">08 &mdash; Outcomes</div>
            <div className="atx-section-label">Reporting</div>
            <h2 className="atx-section-title">Measurable <em>Outcomes</em></h2>
            <p className="atx-section-subtitle">
              Data available in real time and exportable for grant or compliance reporting.
            </p>
          </div>
          <div className="atx-metrics-grid">
            <div className="atx-metric">
              <UsersIcon size={22} stroke="#2E7D32" />
              <span>Total participants enrolled</span>
            </div>
            <div className="atx-metric">
              <TrendingUpIcon size={22} stroke="#00467F" />
              <span>Active users</span>
            </div>
            <div className="atx-metric">
              <ClipboardIcon size={22} stroke="#F9A825" />
              <span>Lessons completed</span>
            </div>
            <div className="atx-metric">
              <TargetIcon size={22} stroke="#0288D1" />
              <span>Milestones achieved</span>
            </div>
            <div className="atx-metric">
              <DollarIcon size={22} stroke="#2E7D32" />
              <span>Incentives earned &amp; approved</span>
            </div>
            <div className="atx-metric">
              <BarChartIcon size={22} stroke="#00467F" />
              <span>Engagement over time</span>
            </div>
            <div className="atx-metric">
              <TrendingUpIcon size={22} stroke="#E53935" style={{ transform: "scaleY(-1)" }} />
              <span>Drop-off analysis</span>
            </div>
            <div className="atx-metric">
              <FileTextIcon size={22} stroke="#F9A825" />
              <span>Exportable compliance reports</span>
            </div>
          </div>
        </div>
      </section>

      <hr className="atx-divider" />

      <section className="atx-section atx-section-alt" id="security">
        <div className="atx-container">
          <div className="atx-section-header">
            <div className="atx-slide-number">09 &mdash; Compliance</div>
            <div className="atx-section-label">Security</div>
            <h2 className="atx-section-title">Security &amp; <em>Oversight</em></h2>
          </div>
          <div className="atx-security-grid">
            <div className="atx-security-item">
              <LockIcon size={24} stroke="#00467F" />
              <div>
                <h4>Encryption</h4>
                <p>Data encrypted in transit and at rest</p>
              </div>
            </div>
            <div className="atx-security-item">
              <ShieldIcon size={24} stroke="#2E7D32" />
              <div>
                <h4>Role-Based Access</h4>
                <p>Staff access controlled by role and permissions</p>
              </div>
            </div>
            <div className="atx-security-item">
              <CheckCircleIcon size={24} stroke="#F9A825" />
              <div>
                <h4>Approval Required</h4>
                <p>All incentive payouts require admin approval</p>
              </div>
            </div>
            <div className="atx-security-item">
              <FileTextIcon size={24} stroke="#0288D1" />
              <div>
                <h4>Full Audit Trail</h4>
                <p>Complete log of participant activity and payouts</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="atx-section" id="timeline">
        <div className="atx-container">
          <div className="atx-section-header">
            <div className="atx-slide-number">10 &mdash; Timeline</div>
            <div className="atx-section-label">Timeline</div>
            <h2 className="atx-section-title">Pilot <em>Timeline</em></h2>
          </div>
          <div className="atx-timeline">
            <div className="atx-timeline-item">
              <div className="atx-timeline-marker atx-tl-green" />
              <div className="atx-timeline-content">
                <div className="atx-timeline-period">Week 1&ndash;2</div>
                <h4>Setup &amp; Onboarding</h4>
                <p>Platform configuration, admin training, and staff onboarding</p>
              </div>
            </div>
            <div className="atx-timeline-item">
              <div className="atx-timeline-marker atx-tl-blue" />
              <div className="atx-timeline-content">
                <div className="atx-timeline-period">Week 3&ndash;4</div>
                <h4>Enrollment &amp; Launch</h4>
                <p>Participant enrollment through partner organizations and program kickoff</p>
              </div>
            </div>
            <div className="atx-timeline-item">
              <div className="atx-timeline-marker atx-tl-gold" />
              <div className="atx-timeline-content">
                <div className="atx-timeline-period">Month 2</div>
                <h4>Engagement &amp; Optimization</h4>
                <p>Active learning, milestone tracking, incentive distribution, and process refinement</p>
              </div>
            </div>
            <div className="atx-timeline-item">
              <div className="atx-timeline-marker atx-tl-purple" />
              <div className="atx-timeline-content">
                <div className="atx-timeline-period">Month 3</div>
                <h4>Reporting &amp; Outcome Review</h4>
                <p>Comprehensive outcome analysis, stakeholder reporting, and expansion planning</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr className="atx-divider" />

      <section className="atx-section atx-section-alt" id="learning-paths">
        <div className="atx-container">
          <div className="atx-section-header">
            <div className="atx-slide-number">11 &mdash; Content Library</div>
            <div className="atx-section-label">Learning Paths</div>
            <h2 className="atx-section-title">11 Paths Ready to <em>Deploy</em></h2>
            <p className="atx-section-subtitle">
              Start with one pathway during the pilot &mdash; then layer in additional tracks
              as outcomes grow. No re-enrollment required.
            </p>
          </div>

          <div className="atx-paths-group">
            <h3 className="atx-paths-group-title">Foundational</h3>
            <ul className="atx-paths-grid">
              <li className="atx-path-card">
                <div className="atx-path-icon atx-path-icon-navy" aria-hidden="true">
                  <HomeIcon size={20} stroke="#00467F" />
                </div>
                <div>
                  <h4>Stability Basics</h4>
                  <p>Daily routines, communication, documents, health access, and boundaries</p>
                </div>
              </li>
              <li className="atx-path-card">
                <div className="atx-path-icon atx-path-icon-green" aria-hidden="true">
                  <ShieldIcon size={20} stroke="#2E7D32" />
                </div>
                <div>
                  <h4>Survival &amp; Systems</h4>
                  <p>Navigate housing, benefits, crisis moments, and work readiness</p>
                </div>
              </li>
              <li className="atx-path-card">
                <div className="atx-path-icon atx-path-icon-sky" aria-hidden="true">
                  <RocketIcon size={20} stroke="#0288D1" />
                </div>
                <div>
                  <h4>Building Your Future</h4>
                  <p>Goals, identity, education, habits, and long-term growth</p>
                </div>
              </li>
              <li className="atx-path-card">
                <div className="atx-path-icon atx-path-icon-gold" aria-hidden="true">
                  <DollarIcon size={20} stroke="#F9A825" />
                </div>
                <div>
                  <h4>Financial Literacy</h4>
                  <p>Budgeting, banking, credit, and protecting yourself from scams</p>
                </div>
              </li>
              <li className="atx-path-card">
                <div className="atx-path-icon atx-path-icon-green" aria-hidden="true">
                  <SproutIcon size={20} stroke="#2E7D32" />
                </div>
                <div>
                  <h4>Life Skills</h4>
                  <p>Communication, relationships, digital literacy, and community connection</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="atx-paths-group">
            <h3 className="atx-paths-group-title">Recovery &amp; Support</h3>
            <ul className="atx-paths-grid">
              <li className="atx-path-card">
                <div className="atx-path-icon atx-path-icon-navy" aria-hidden="true">
                  <BrainIcon size={20} stroke="#00467F" />
                </div>
                <div>
                  <h4>Addiction &amp; Recovery Foundations</h4>
                  <p>Self-awareness, craving tools, and personal recovery planning</p>
                </div>
              </li>
              <li className="atx-path-card">
                <div className="atx-path-icon atx-path-icon-sky" aria-hidden="true">
                  <LifebuoyIcon size={20} stroke="#0288D1" />
                </div>
                <div>
                  <h4>Harm Reduction &amp; Safety</h4>
                  <p>Stay safer, prevent overdose, and connect to help</p>
                </div>
              </li>
              <li className="atx-path-card">
                <div className="atx-path-icon atx-path-icon-green" aria-hidden="true">
                  <StethoscopeIcon size={20} stroke="#2E7D32" />
                </div>
                <div>
                  <h4>Treatment &amp; Recovery Navigation</h4>
                  <p>Access care, stay engaged, and navigate the treatment system</p>
                </div>
              </li>
              <li className="atx-path-card">
                <div className="atx-path-icon atx-path-icon-navy" aria-hidden="true">
                  <LockIcon size={20} stroke="#00467F" />
                </div>
                <div>
                  <h4>Relapse Prevention Mastery</h4>
                  <p>Warning signs, boundaries, emotional resilience, and maintenance</p>
                </div>
              </li>
              <li className="atx-path-card">
                <div className="atx-path-icon atx-path-icon-gold" aria-hidden="true">
                  <AlertTriangleIcon size={20} stroke="#F9A825" />
                </div>
                <div>
                  <h4>Substance-Specific Safety</h4>
                  <p>Targeted safety for alcohol, opioids, and stimulants</p>
                </div>
              </li>
              <li className="atx-path-card">
                <div className="atx-path-icon atx-path-icon-green" aria-hidden="true">
                  <HeartHandIcon size={20} stroke="#2E7D32" />
                </div>
                <div>
                  <h4>Supporter &amp; Family Skills</h4>
                  <p>Help a loved one without enabling &mdash; protect your own wellbeing</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="atx-custom-paths">
            <div className="atx-custom-paths-badge">+ Custom</div>
            <h3>Custom Paths for Austin</h3>
            <p>
              We build city-specific learning paths tailored to your priorities.
              Examples for Austin:
            </p>
            <div className="atx-custom-examples">
              <span>Local Workforce Programs</span>
              <span>Public Transit Navigation</span>
              <span>City Resource Directory</span>
              <span>Cultural Orientation</span>
              <span>Tenant Rights &amp; Housing</span>
              <span>Digital Access &amp; Connectivity</span>
            </div>
            <p className="atx-custom-note">
              Custom paths are built collaboratively with city staff and deployed without additional enrollment.
            </p>
          </div>
        </div>
      </section>

      <section className="atx-section" id="expansion">
        <div className="atx-container">
          <div className="atx-section-header">
            <div className="atx-slide-number">12 &mdash; Growth</div>
            <div className="atx-section-label">Expansion</div>
            <h2 className="atx-section-title">Built to <em>Scale</em></h2>
            <p className="atx-section-subtitle">
              Start focused, then expand as outcomes prove out.
            </p>
          </div>
          <div className="atx-expand-grid">
            <div className="atx-expand-item">
              <div className="atx-expand-num">1</div>
              <h4>Start Focused</h4>
              <p>Begin with one targeted learning pathway</p>
            </div>
            <div className="atx-expand-item">
              <div className="atx-expand-num">2</div>
              <h4>Add Tracks</h4>
              <p>Add more learning paths without re-enrollment</p>
            </div>
            <div className="atx-expand-item">
              <div className="atx-expand-num">3</div>
              <h4>Extend Reach</h4>
              <p>Expand to additional organizations or city programs</p>
            </div>
            <div className="atx-expand-item">
              <div className="atx-expand-num">4</div>
              <h4>Scale Up</h4>
              <p>Increase participant count in managed tiers</p>
            </div>
          </div>
        </div>
      </section>

      <section className="atx-cta-section" id="contact">
        <div className="atx-container">
          <h2>Bring Learn to Earn<br />to Austin</h2>
          <p>Ready to explore a 90-day pilot? Let&apos;s connect.</p>
          <div className="atx-cta-actions">
            <a href="mailto:partners@learn2earn.org?subject=Austin%20Pilot%20Plan%20Request" className="atx-btn-primary">Request Pilot Plan</a>
            <a href="mailto:partners@learn2earn.org?subject=Schedule%20Austin%20Demo" className="atx-btn-outline">Schedule Demo</a>
          </div>
          <p className="atx-cta-note">Response within 1 business day</p>
        </div>
      </section>

      <section className="atx-sources" aria-label="Sources">
        <div className="atx-container">
          <div className="atx-sources-label">Sources</div>
          <ol className="atx-sources-list">
            <li>
              <span className="atx-sources-num">1.</span>
              <span className="atx-sources-text">
                <strong>3,000+ Austinites experiencing homelessness</strong> &mdash;{" "}
                ECHO Austin/Travis County 2025 Point-in-Time Count (single-night snapshot, conducted January 2025).{" "}
                <a
                  href="https://www.austinecho.org/leading-system-change/data-and-reports/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  austinecho.org/leading-system-change/data-and-reports
                </a>
              </span>
            </li>
            <li>
              <span className="atx-sources-num">2.</span>
              <span className="atx-sources-text">
                <strong>Up to 60% are employed but can&apos;t afford housing</strong> &mdash;{" "}
                U.S. Interagency Council on Homelessness; corroborated by University of Chicago (2021), which found 53% of sheltered and 40% of unsheltered adults experiencing homelessness were employed.{" "}
                <a
                  href="https://www.usich.gov/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  usich.gov
                </a>
              </span>
            </li>
          </ol>
          <p className="atx-sources-note">
            Figures reflect the most recent publicly reported data at time of publication. Additional citations available on request.
          </p>
        </div>
      </section>

      <footer className="atx-footer">
        <div className="atx-container">
          <div className="atx-footer-logo">
            Learn<span>2</span>Earn
          </div>
          <p className="atx-footer-tagline">
            Measurable impact. Full transparency. Real outcomes.
          </p>
          <nav className="atx-footer-links">
            <a href="/">Home</a>
            <span className="atx-footer-sep">|</span>
            <a href="mailto:partners@learn2earn.org">partners@learn2earn.org</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
