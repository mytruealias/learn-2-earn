import "../invest/invest.css";
import "./austin.css";
import LandingNav from "../components/LandingNav";
import FounderModal from "../components/FounderModal";
import {
  UsersIcon, ClipboardIcon, CoinIcon, ShieldIcon, BarChartIcon,
  CheckCircleIcon, SmartphoneIcon, BriefcaseIcon, TargetIcon,
  DollarIcon, FileTextIcon, LockIcon, TrendingUpIcon, CalendarIcon,
} from "../components/LandingIcons";

export default function AustinPage() {
  return (
    <div className="inv-page">
      <LandingNav />

      <section className="inv-hero atx-hero">
        <div className="inv-hero-glow inv-hero-glow-1" />
        <div className="inv-hero-glow inv-hero-glow-2" />
        <div className="inv-hero-glow inv-hero-glow-3" />

        <div className="inv-hero-badge">City of Austin &middot; 90-Day Pilot</div>
        <h1>
          A Low-Barrier Pilot for Workforce Readiness and <em>Stability in Austin</em>
        </h1>
        <p>
          Deploy Learn to Earn as a 90-day pilot to drive engagement, build life
          skills, and create measurable progress for residents facing instability.
        </p>
        <div className="inv-hero-actions">
          <a href="#contact" className="inv-btn inv-btn-primary inv-btn-lg">Request Pilot Plan</a>
          <a href="#contact" className="inv-btn inv-btn-outline inv-btn-lg">Schedule Demo</a>
        </div>
      </section>

      <section className="inv-section inv-section-alt" id="problem">
        <div className="inv-container">
          <div className="inv-section-header">
            <div className="inv-section-label">The Challenge</div>
            <h2 className="inv-section-title">Why Austin Needs a New Approach</h2>
            <p className="inv-section-subtitle">
              Thousands of Austin residents are caught in survival mode &mdash; focused on
              making it through each day, not building toward tomorrow.
            </p>
          </div>
          <div className="atx-problem-grid">
            <div className="inv-glass-card">
              <div className="atx-problem-icon">
                <TrendingUpIcon size={28} stroke="#f87171" />
              </div>
              <h3>Survival Over Progress</h3>
              <p>
                Many residents lack the stability and structure to focus on skill-building
                or workforce readiness. Without consistent engagement tools, progress stalls.
              </p>
            </div>
            <div className="inv-glass-card">
              <div className="atx-problem-icon">
                <TargetIcon size={28} stroke="#fbbf24" />
              </div>
              <h3>Low Follow-Through</h3>
              <p>
                Existing programs struggle with consistent participation. Without clear
                incentives or structured milestones, learners disengage.
              </p>
            </div>
            <div className="inv-glass-card">
              <div className="atx-problem-icon">
                <BarChartIcon size={28} stroke="#60a5fa" />
              </div>
              <h3>Hard to Measure</h3>
              <p>
                Programs often lack real-time visibility into engagement and outcomes,
                making it difficult to demonstrate impact to funders and stakeholders.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="inv-section" id="solution">
        <div className="inv-container">
          <div className="inv-section-header">
            <div className="inv-section-label">The Solution</div>
            <h2 className="inv-section-title">Structured Learning, Real Incentives</h2>
            <p className="inv-section-subtitle">
              Learn to Earn is a structured, incentive-based learning platform designed for
              people experiencing homelessness and instability.
            </p>
          </div>
          <div className="atx-solution-grid">
            <div className="atx-solution-item">
              <div className="atx-solution-icon">
                <SmartphoneIcon size={24} stroke="#34d399" />
              </div>
              <div>
                <h4>Practical Content</h4>
                <p>Guides participants through life skills and job-readiness lessons built for real-world use.</p>
              </div>
            </div>
            <div className="atx-solution-item">
              <div className="atx-solution-icon">
                <CoinIcon size={24} stroke="#34d399" />
              </div>
              <div>
                <h4>Trackable Incentives</h4>
                <p>Rewards progress with controlled, trackable incentives tied to verified milestone completion.</p>
              </div>
            </div>
            <div className="atx-solution-item">
              <div className="atx-solution-icon">
                <BarChartIcon size={24} stroke="#34d399" />
              </div>
              <div>
                <h4>Real-Time Visibility</h4>
                <p>Provides real-time reporting into engagement, completion rates, and measurable outcomes.</p>
              </div>
            </div>
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
          <div className="atx-steps">
            <div className="atx-step">
              <div className="atx-step-num">1</div>
              <div className="atx-step-icon"><UsersIcon size={24} stroke="#34d399" /></div>
              <h4>Enroll</h4>
              <p>Participants enroll through partner organizations</p>
            </div>
            <div className="atx-step">
              <div className="atx-step-num">2</div>
              <div className="atx-step-icon"><ClipboardIcon size={24} stroke="#60a5fa" /></div>
              <h4>Learn</h4>
              <p>Complete short lessons and milestones at their own pace</p>
            </div>
            <div className="atx-step">
              <div className="atx-step-num">3</div>
              <div className="atx-step-icon"><CoinIcon size={24} stroke="#fbbf24" /></div>
              <h4>Earn</h4>
              <p>Earn rewards based on verified progress and completion</p>
            </div>
            <div className="atx-step">
              <div className="atx-step-num">4</div>
              <div className="atx-step-icon"><CheckCircleIcon size={24} stroke="#a78bfa" /></div>
              <h4>Approve</h4>
              <p>Admin team reviews and approves incentive payouts</p>
            </div>
            <div className="atx-step">
              <div className="atx-step-num">5</div>
              <div className="atx-step-icon"><BarChartIcon size={24} stroke="#f472b6" /></div>
              <h4>Track</h4>
              <p>City tracks engagement and outcomes in real time</p>
            </div>
          </div>
          <p className="atx-steps-note">
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
          <div className="atx-scope-grid">
            <div className="atx-scope-card">
              <CalendarIcon size={32} stroke="#60a5fa" />
              <div className="atx-scope-value">90 Days</div>
              <div className="atx-scope-label">Duration</div>
            </div>
            <div className="atx-scope-card">
              <UsersIcon size={32} stroke="#34d399" />
              <div className="atx-scope-value">Up to 500</div>
              <div className="atx-scope-label">Participants</div>
            </div>
            <div className="atx-scope-card">
              <BriefcaseIcon size={32} stroke="#fbbf24" />
              <div className="atx-scope-value">1 Pathway</div>
              <div className="atx-scope-label">Workforce Readiness or Life Stability</div>
            </div>
            <div className="atx-scope-card">
              <CheckCircleIcon size={32} stroke="#a78bfa" />
              <div className="atx-scope-value">Full Support</div>
              <div className="atx-scope-label">Onboarding, Admin Setup &amp; Reporting</div>
            </div>
          </div>
        </div>
      </section>

      <section className="inv-section inv-section-alt" id="deliverables">
        <div className="inv-container">
          <div className="inv-section-header">
            <div className="inv-section-label">What You Get</div>
            <h2 className="inv-section-title">What the City Receives</h2>
          </div>
          <div className="atx-deliver-grid">
            <div className="atx-deliver-item">
              <CheckCircleIcon size={20} stroke="#34d399" />
              <span>Full platform access for all pilot participants</span>
            </div>
            <div className="atx-deliver-item">
              <CheckCircleIcon size={20} stroke="#34d399" />
              <span>Admin dashboard with oversight and approval controls</span>
            </div>
            <div className="atx-deliver-item">
              <CheckCircleIcon size={20} stroke="#34d399" />
              <span>Incentive approval workflows with audit trail</span>
            </div>
            <div className="atx-deliver-item">
              <CheckCircleIcon size={20} stroke="#34d399" />
              <span>Real-time reporting and exportable data</span>
            </div>
            <div className="atx-deliver-item">
              <CheckCircleIcon size={20} stroke="#34d399" />
              <span>Staff onboarding and training</span>
            </div>
            <div className="atx-deliver-item">
              <CheckCircleIcon size={20} stroke="#34d399" />
              <span>Ongoing support and updates during the pilot</span>
            </div>
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
          <div className="atx-funding-grid">
            <div className="inv-glass-card atx-funding-card">
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
            <div className="inv-glass-card atx-funding-card">
              <div className="atx-funding-badge atx-funding-badge-green">Budget 2</div>
              <h3>Participant Incentive Pool</h3>
              <p className="atx-funding-desc">Funded and controlled by the city or partner:</p>
              <ul className="atx-funding-list">
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
          <div className="atx-metrics-grid">
            <div className="atx-metric">
              <UsersIcon size={22} stroke="#34d399" />
              <span>Total participants enrolled</span>
            </div>
            <div className="atx-metric">
              <TrendingUpIcon size={22} stroke="#60a5fa" />
              <span>Active users</span>
            </div>
            <div className="atx-metric">
              <ClipboardIcon size={22} stroke="#fbbf24" />
              <span>Lessons completed</span>
            </div>
            <div className="atx-metric">
              <TargetIcon size={22} stroke="#a78bfa" />
              <span>Milestones achieved</span>
            </div>
            <div className="atx-metric">
              <DollarIcon size={22} stroke="#34d399" />
              <span>Incentives earned and approved</span>
            </div>
            <div className="atx-metric">
              <BarChartIcon size={22} stroke="#60a5fa" />
              <span>Engagement over time</span>
            </div>
            <div className="atx-metric">
              <TrendingUpIcon size={22} stroke="#f87171" style={{ transform: "scaleY(-1)" }} />
              <span>Drop-off points</span>
            </div>
            <div className="atx-metric">
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
          <div className="atx-security-grid">
            <div className="atx-security-item">
              <LockIcon size={24} stroke="#34d399" />
              <div>
                <h4>Encryption</h4>
                <p>Data encrypted in transit and at rest</p>
              </div>
            </div>
            <div className="atx-security-item">
              <ShieldIcon size={24} stroke="#60a5fa" />
              <div>
                <h4>Role-Based Access</h4>
                <p>Staff access controlled by role and permissions</p>
              </div>
            </div>
            <div className="atx-security-item">
              <CheckCircleIcon size={24} stroke="#fbbf24" />
              <div>
                <h4>Approval Required</h4>
                <p>All incentive payouts require admin approval</p>
              </div>
            </div>
            <div className="atx-security-item">
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

      <section className="inv-section" id="expansion">
        <div className="inv-container">
          <div className="inv-section-header">
            <div className="inv-section-label">Growth</div>
            <h2 className="inv-section-title">Built to Scale</h2>
            <p className="inv-section-subtitle">
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

      <section className="inv-section inv-section-dark" id="contact">
        <div className="inv-container">
          <div className="inv-section-header" style={{ marginBottom: "2.5rem" }}>
            <h2 className="inv-section-title">
              Bring Learn to Earn<br />to Austin
            </h2>
            <p className="inv-section-subtitle">
              Ready to explore a 90-day pilot? Let&apos;s connect.
            </p>
          </div>
          <div className="inv-hero-actions">
            <a href="mailto:partners@learn2earn.org?subject=Austin%20Pilot%20Plan%20Request" className="inv-btn inv-btn-primary inv-btn-lg">Request Pilot Plan</a>
            <a href="mailto:partners@learn2earn.org?subject=Schedule%20Austin%20Demo" className="inv-btn inv-btn-outline inv-btn-lg">Schedule Demo</a>
          </div>
          <p className="atx-cta-note">Response within 1 business day</p>
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
            <a href="mailto:partners@learn2earn.org">partners@learn2earn.org</a>
            <span className="inv-footer-sep">|</span>
            <FounderModal />
          </nav>
        </div>
      </footer>
    </div>
  );
}
