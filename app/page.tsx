import "./invest/invest.css";
import "./invest/demo-phone.css";
import AppDemo from "./components/AppDemo";
import Link from "next/link";
import {
  TrendingUpIcon, HomeIcon, TrendingDownIcon, BarChartIcon,
  WalkingIcon, HeartPlusIcon, BriefcaseIcon,
  SmartphoneIcon, ClipboardIcon, CoinIcon,
  ShieldIcon, TargetIcon, DollarIcon, HeartIcon, HandshakeIcon,
  MessageIcon, UsersIcon, LockIcon, UserIcon, FileTextIcon,
  CheckCircleIcon, GlobeIcon, BuildingIcon,
} from "./components/Icons";

export default function HomePage() {
  return (
    <div className="inv-page">
      <nav className="inv-nav">
        <Link href="/" className="inv-nav-logo">
          <svg className="inv-nav-logo-mark" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="8" fill="url(#logoGrad)"/>
            <rect x="7" y="20" width="4" height="5" rx="1" fill="white" fillOpacity="0.9"/>
            <rect x="14" y="14" width="4" height="11" rx="1" fill="white" fillOpacity="0.9"/>
            <rect x="21" y="8" width="4" height="17" rx="1" fill="white" fillOpacity="0.9"/>
            <defs>
              <linearGradient id="logoGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#059669"/>
                <stop offset="100%" stopColor="#0ea5e9"/>
              </linearGradient>
            </defs>
          </svg>
          <span className="inv-nav-logo-text">Learn<span>2</span>Earn</span>
        </Link>
        <ul className="inv-nav-links">
          <li><a href="#platform">Platform</a></li>
          <li><a href="#impact">Impact</a></li>
          <li><a href="#usecases">Use Cases</a></li>
          <li><a href="#demo">Demo</a></li>
          <li><a href="#contact">Contact</a></li>
          <li>
            <a href="#demo" className="inv-btn inv-btn-glass" style={{ padding: "0.45rem 1.2rem", fontSize: "0.78rem" }}>
              Book a Demo
            </a>
          </li>
          <li>
            <a href="#contact" className="inv-btn inv-btn-primary" style={{ padding: "0.45rem 1.2rem", fontSize: "0.78rem" }}>
              Request a Pilot Plan
            </a>
          </li>
        </ul>
      </nav>

      <section className="inv-hero">
        <div className="inv-hero-glow inv-hero-glow-1"></div>
        <div className="inv-hero-glow inv-hero-glow-2"></div>
        <div className="inv-hero-glow inv-hero-glow-3"></div>

        <div className="inv-hero-badge">
          Deployable Workforce & Stabilization Tool
        </div>
        <h1>
          A Hand Up,<br />
          <em>Not a Handout.</em>
        </h1>
        <p>
          Micro-learning + verified incentives for measurable outcomes.
          Learn to Earn helps people experiencing homelessness build life skills,
          complete recovery-focused learning, and earn small cash incentives
          with case worker approval. Cities and funders get real-time reporting,
          compliance-ready oversight, and a scalable deployment model.
        </p>
        <div className="inv-hero-actions">
          <a href="#demo" className="inv-btn inv-btn-primary inv-btn-lg">
            Book a Demo
          </a>
          <a href="#contact" className="inv-btn inv-btn-outline inv-btn-lg">
            Request a Pilot Plan
          </a>
        </div>
        <div className="inv-hero-secondary">
          <a href="/app">View Learner Experience &rarr;</a>
        </div>

        <div className="inv-trust-bar">
          <div className="inv-trust-item">
            <div className="inv-trust-check">&#x2713;</div>
            139 micro-lessons across 11 pathways
          </div>
          <div className="inv-trust-item">
            <div className="inv-trust-check">&#x2713;</div>
            $1 per 3 lessons completed (configurable)
          </div>
          <div className="inv-trust-item">
            <div className="inv-trust-check">&#x2713;</div>
            Phone-first, no app required
          </div>
          <div className="inv-trust-item">
            <div className="inv-trust-check">&#x2713;</div>
            24/7 crisis resources built in
          </div>
          <div className="inv-trust-item">
            <div className="inv-trust-check">&#x2713;</div>
            Audit trail + role-based approvals
          </div>
        </div>

        <div className="inv-hero-scroll">
          <span>Scroll</span>
          <div className="inv-hero-scroll-line"></div>
        </div>
      </section>

      <div className="inv-section-divider"></div>

      <section className="inv-section" id="platform">
        <div className="inv-container">
          <div className="inv-section-header">
            <div className="inv-section-label">Platform</div>
            <h2 className="inv-section-title">
              What Learn to Earn Includes
            </h2>
            <p className="inv-section-subtitle">
              A complete system for deploying incentivized learning programs
              with oversight, reporting, and built-in safety features.
            </p>
          </div>
          <div className="inv-pillar-grid">
            <div className="inv-pillar-card">
              <h3><span>&#x1F4F1;</span> Learner Experience</h3>
              <ul className="inv-pillar-list">
                <li>Bite-sized lessons, low reading level, trauma-informed</li>
                <li>Works in browser, minimal friction — no app download needed</li>
                <li>Built-in safety net (988, 211, SAMHSA, DV hotline, text line)</li>
              </ul>
            </div>
            <div className="inv-pillar-card">
              <h3><span>&#x1F4CB;</span> Case Worker & Admin Tools</h3>
              <ul className="inv-pillar-list">
                <li>Participant view, progress tracking, payout review workflow</li>
                <li>Engagement and completion analytics for reporting</li>
                <li>Permissions, audit logs, and approval controls</li>
              </ul>
            </div>
            <div className="inv-pillar-card">
              <h3><span>&#x1F4B0;</span> Incentive System</h3>
              <ul className="inv-pillar-list">
                <li>Micro-incentives tied to verified completion</li>
                <li>Configurable payout rules per program</li>
                <li>Built for oversight, not automatic cash</li>
              </ul>
            </div>
          </div>
          <div className="inv-section-cta">
            <a href="/admin" className="inv-btn inv-btn-outline inv-btn-lg">
              See the Admin Dashboard Demo
            </a>
          </div>
        </div>
      </section>

      <section className="inv-section inv-section-alt" id="impact">
        <div className="inv-container">
          <div className="inv-section-header">
            <div className="inv-section-label">Impact</div>
            <h2 className="inv-section-title">
              Why This Works
            </h2>
            <p className="inv-section-subtitle">
              Real engagement, real skills, real accountability — designed to
              create measurable change for the people and programs that need it most.
            </p>
          </div>
          <div className="inv-stats">
            <div className="inv-stat-card">
              <div className="inv-stat-number"><TrendingUpIcon size={36} stroke="#34d399" /></div>
              <div className="inv-stat-label">Engagement</div>
              <p style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "0.5rem", lineHeight: 1.5 }}>
                Incentives increase follow-through on learning and routines
              </p>
            </div>
            <div className="inv-stat-card">
              <div className="inv-stat-number"><HomeIcon size={36} stroke="#60a5fa" /></div>
              <div className="inv-stat-label">Stability</div>
              <p style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "0.5rem", lineHeight: 1.5 }}>
                Skills pathways support housing, employment readiness, and recovery
              </p>
            </div>
            <div className="inv-stat-card">
              <div className="inv-stat-number"><TrendingDownIcon size={36} stroke="#f87171" /></div>
              <div className="inv-stat-label">Cost Reduction</div>
              <p style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "0.5rem", lineHeight: 1.5 }}>
                Better engagement can reduce avoidable emergency utilization over time
              </p>
            </div>
            <div className="inv-stat-card">
              <div className="inv-stat-number"><BarChartIcon size={36} stroke="#a78bfa" /></div>
              <div className="inv-stat-label">Measurable Outcomes</div>
              <p style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "0.5rem", lineHeight: 1.5 }}>
                Completions, time in program, milestones, referrals, payout activity
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="inv-section" id="usecases">
        <div className="inv-container">
          <div className="inv-section-header">
            <div className="inv-section-label">Use Cases</div>
            <h2 className="inv-section-title">
              Built for the Teams<br />on the Front Line
            </h2>
            <p className="inv-section-subtitle">
              Whether you operate a shelter, run street outreach, or manage
              a workforce readiness program — Learn to Earn adapts to your workflow.
            </p>
          </div>
          <div className="inv-usecase-grid">
            <div className="inv-usecase-card">
              <div className="inv-usecase-icon" style={{ background: "rgba(59,130,246,0.1)", color: "#60a5fa" }}>
                <HomeIcon size={26} stroke="#60a5fa" />
              </div>
              <h3>Shelter & Navigation Centers</h3>
              <p>
                Deploy on shared devices or personal phones. Track participation and progress across your facility.
              </p>
            </div>
            <div className="inv-usecase-card">
              <div className="inv-usecase-icon" style={{ background: "rgba(88,204,2,0.1)", color: "#6ee720" }}>
                <WalkingIcon size={26} stroke="#6ee720" />
              </div>
              <h3>Street Outreach Teams</h3>
              <p>
                Low barrier entry, quick lesson starts, connect to resources instantly — no signup required.
              </p>
            </div>
            <div className="inv-usecase-card">
              <div className="inv-usecase-icon" style={{ background: "rgba(139,92,246,0.1)", color: "#a78bfa" }}>
                <HeartPlusIcon size={26} stroke="#a78bfa" />
              </div>
              <h3>Recovery & Re-entry Programs</h3>
              <p>
                Structured learning tracks, routines, relapse prevention, and incentives with oversight.
              </p>
            </div>
            <div className="inv-usecase-card">
              <div className="inv-usecase-icon" style={{ background: "rgba(245,158,11,0.1)", color: "#fbbf24" }}>
                <BriefcaseIcon size={26} stroke="#fbbf24" />
              </div>
              <h3>Workforce Readiness</h3>
              <p>
                Financial literacy, document preparation, job readiness, and systems navigation.
              </p>
            </div>
          </div>
          <div className="inv-section-cta">
            <a href="#contact" className="inv-btn inv-btn-primary inv-btn-lg">
              Request a 90-Day Pilot Plan
            </a>
          </div>
        </div>
      </section>

      <section className="inv-section inv-section-alt" id="demo">
        <div className="inv-container">
          <div className="inv-section-header">
            <div className="inv-section-label">Demo</div>
            <h2 className="inv-section-title">
              See It in Action
            </h2>
            <p className="inv-section-subtitle">
              Watch a quick overview, explore the platform, and see exactly
              what a pilot deployment includes.
            </p>
          </div>

          <div style={{ marginBottom: "4rem" }}>
            <h3 style={{ fontFamily: "var(--cy-display)", fontSize: "1.2rem", fontWeight: 700, color: "#f1f5f9", marginBottom: "1.5rem", textAlign: "center" }}>
              The Learner Experience
            </h3>
            <AppDemo />
          </div>

          <div style={{ maxWidth: "800px", margin: "0 auto 3rem" }}>
            <h3 style={{ fontFamily: "var(--cy-display)", fontSize: "1.2rem", fontWeight: 700, color: "#f1f5f9", marginBottom: "1.25rem", textAlign: "center" }}>
              Watch the 2-Minute Overview
            </h3>
            <div className="inv-video-wrap">
              <video
                controls
                playsInline
                preload="metadata"
                poster="/images/invest/hero-community.jpg"
                x-webkit-airplay="allow"
              >
                <source src="/images/invest/presentation-web.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>

          <div style={{ marginBottom: "3rem" }}>
            <h3 style={{ fontFamily: "var(--cy-display)", fontSize: "1.2rem", fontWeight: 700, color: "#f1f5f9", marginBottom: "1.5rem", textAlign: "center" }}>
              Explore the Platform
            </h3>
            <div className="inv-steps">
              <div className="inv-step">
                <div className="inv-step-number"><SmartphoneIcon size={32} stroke="#34d399" /></div>
                <h3>Learner Experience</h3>
                <p>
                  Preview the learner-facing app — bite-sized lessons, progress tracking, and earning.
                </p>
                <div style={{ marginTop: "1rem" }}>
                  <a href="/app" className="inv-btn inv-btn-glass" style={{ fontSize: "0.78rem", padding: "0.5rem 1.2rem" }}>
                    Try It Live
                  </a>
                </div>
              </div>
              <div className="inv-step">
                <div className="inv-step-number"><ClipboardIcon size={32} stroke="#60a5fa" /></div>
                <h3>Admin Dashboard</h3>
                <p>
                  See the case worker and admin tools — participant management, analytics, and approvals.
                </p>
                <div style={{ marginTop: "1rem" }}>
                  <a href="/admin" className="inv-btn inv-btn-glass" style={{ fontSize: "0.78rem", padding: "0.5rem 1.2rem" }}>
                    View Dashboard
                  </a>
                </div>
              </div>
              <div className="inv-step">
                <div className="inv-step-number"><CoinIcon size={32} stroke="#fbbf24" /></div>
                <h3>Payout Workflow</h3>
                <p>
                  Multi-step payout approval with audit trail — review, approve, and disburse with full oversight.
                </p>
                <div style={{ marginTop: "1rem" }}>
                  <a href="/admin" className="inv-btn inv-btn-glass" style={{ fontSize: "0.78rem", padding: "0.5rem 1.2rem" }}>
                    See Workflow
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 style={{ fontFamily: "var(--cy-display)", fontSize: "1.2rem", fontWeight: 700, color: "#f1f5f9", marginBottom: "1.5rem", textAlign: "center" }}>
              What a Pilot Includes
            </h3>
            <div className="inv-pilot-grid">
              <div className="inv-pilot-item">
                <div className="inv-pilot-num">01</div>
                <h4>Onboarding & Training</h4>
                <p>Staff training on the platform and participant onboarding best practices</p>
              </div>
              <div className="inv-pilot-item">
                <div className="inv-pilot-num">02</div>
                <h4>Program Configuration</h4>
                <p>Custom lesson paths and configurable payout rules for your program</p>
              </div>
              <div className="inv-pilot-item">
                <div className="inv-pilot-num">03</div>
                <h4>Admin Setup & Reporting</h4>
                <p>Dashboard access, role configuration, and reporting templates</p>
              </div>
              <div className="inv-pilot-item">
                <div className="inv-pilot-num">04</div>
                <h4>Ongoing Support</h4>
                <p>Weekly check-ins, success support, and program optimization</p>
              </div>
            </div>
          </div>

          <div className="inv-section-cta">
            <a href="#contact" className="inv-btn inv-btn-primary inv-btn-lg">
              Book a Demo
            </a>
          </div>
        </div>
      </section>

      <section className="inv-section" id="curriculum">
        <div className="inv-container">
          <div className="inv-section-header">
            <div className="inv-section-label">Curriculum</div>
            <h2 className="inv-section-title">
              139 Lessons Across<br />11 Structured Paths
            </h2>
            <p className="inv-section-subtitle">
              Evidence-based, trauma-informed content covering the skills
              that most directly accelerate housing stability and self-sufficiency.
            </p>
          </div>
          <div className="inv-curriculum-grid">
            <div className="inv-curriculum-card">
              <div className="inv-curriculum-icon" style={{ background: "rgba(88,204,2,0.1)", color: "#6ee720" }}>
                <HomeIcon size={22} stroke="#6ee720" />
              </div>
              <div>
                <h4>Stability Basics</h4>
                <p>Daily routines, communication, document safety.</p>
              </div>
            </div>
            <div className="inv-curriculum-card">
              <div className="inv-curriculum-icon" style={{ background: "rgba(59,130,246,0.1)", color: "#60a5fa" }}>
                <ShieldIcon size={22} stroke="#60a5fa" />
              </div>
              <div>
                <h4>Survival & Systems</h4>
                <p>Housing navigation, benefits access, work readiness.</p>
              </div>
            </div>
            <div className="inv-curriculum-card">
              <div className="inv-curriculum-icon" style={{ background: "rgba(139,92,246,0.1)", color: "#a78bfa" }}>
                <TargetIcon size={22} stroke="#a78bfa" />
              </div>
              <div>
                <h4>Building Your Future</h4>
                <p>Goal-setting, values alignment, sustainable habits.</p>
              </div>
            </div>
            <div className="inv-curriculum-card">
              <div className="inv-curriculum-icon" style={{ background: "rgba(245,158,11,0.1)", color: "#fbbf24" }}>
                <DollarIcon size={22} stroke="#fbbf24" />
              </div>
              <div>
                <h4>Financial Literacy</h4>
                <p>Budgeting, banking basics, scam prevention.</p>
              </div>
            </div>
            <div className="inv-curriculum-card">
              <div className="inv-curriculum-icon" style={{ background: "rgba(239,68,68,0.1)", color: "#f87171" }}>
                <HeartIcon size={22} stroke="#f87171" />
              </div>
              <div>
                <h4>Addiction & Recovery</h4>
                <p>108 lessons from understanding addiction to sustained recovery.</p>
              </div>
            </div>
            <div className="inv-curriculum-card">
              <div className="inv-curriculum-icon" style={{ background: "rgba(6,182,212,0.1)", color: "#22d3ee" }}>
                <HandshakeIcon size={22} stroke="#22d3ee" />
              </div>
              <div>
                <h4>Harm Reduction</h4>
                <p>Naloxone training, overdose response, safety planning.</p>
              </div>
            </div>
            <div className="inv-curriculum-card">
              <div className="inv-curriculum-icon" style={{ background: "rgba(139,92,246,0.1)", color: "#a78bfa" }}>
                <MessageIcon size={22} stroke="#a78bfa" />
              </div>
              <div>
                <h4>Life & Communication</h4>
                <p>Conflict resolution, digital skills, self-advocacy.</p>
              </div>
            </div>
            <div className="inv-curriculum-card">
              <div className="inv-curriculum-icon" style={{ background: "rgba(88,204,2,0.1)", color: "#6ee720" }}>
                <UsersIcon size={22} stroke="#6ee720" />
              </div>
              <div>
                <h4>Family & Supporters</h4>
                <p>Boundary-setting, caregiver burnout, healthy support.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="inv-section inv-section-alt" id="compliance">
        <div className="inv-container">
          <div className="inv-section-header">
            <div className="inv-section-label">Compliance & Reporting</div>
            <h2 className="inv-section-title">
              ROI and Accountability
            </h2>
            <p className="inv-section-subtitle">
              Built from the ground up to meet the compliance, privacy, and
              audit requirements of government-funded social programs.
            </p>
          </div>
          <div className="inv-features-grid">
            <div className="inv-feature">
              <div className="inv-feature-icon"><LockIcon size={22} stroke="#34d399" /></div>
              <div>
                <h4>Full Audit Trail</h4>
                <p>Every action logged with timestamps, IP addresses, and user attribution.</p>
              </div>
            </div>
            <div className="inv-feature">
              <div className="inv-feature-icon"><UserIcon size={22} stroke="#60a5fa" /></div>
              <div>
                <h4>Role-Based Permissions</h4>
                <p>Admin, case worker, and finance roles with separation of duties.</p>
              </div>
            </div>
            <div className="inv-feature">
              <div className="inv-feature-icon"><FileTextIcon size={22} stroke="#a78bfa" /></div>
              <div>
                <h4>Data Privacy & Consent</h4>
                <p>Built-in consent management designed for serving vulnerable populations.</p>
              </div>
            </div>
            <div className="inv-feature">
              <div className="inv-feature-icon"><BarChartIcon size={22} stroke="#fbbf24" /></div>
              <div>
                <h4>Reporting Exports</h4>
                <p>Export engagement and outcome data for HUD, CDBG, and CoC requirements.</p>
              </div>
            </div>
            <div className="inv-feature">
              <div className="inv-feature-icon"><CheckCircleIcon size={22} stroke="#34d399" /></div>
              <div>
                <h4>Multi-Step Approvals</h4>
                <p>Multi-step payout approval prevents single points of failure.</p>
              </div>
            </div>
            <div className="inv-feature">
              <div className="inv-feature-icon"><GlobeIcon size={22} stroke="#22d3ee" /></div>
              <div>
                <h4>Scalable Infrastructure</h4>
                <p>Cloud-based platform deploys to one shelter or an entire city.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="inv-cta" id="contact">
        <div className="inv-cta-glow inv-cta-glow-1"></div>
        <div className="inv-cta-glow inv-cta-glow-2"></div>
        <div className="inv-container">
          <h2>Ready to Launch a Pilot?</h2>
          <p>
            Whether you represent a city, a shelter network, or a funding
            organization — we&apos;ll help you deploy Learn to Earn in your community.
          </p>
          <div className="inv-cta-actions">
            <a href="mailto:partners@learn2earn.org" className="inv-btn inv-btn-primary inv-btn-lg">
              Book a Demo
            </a>
            <a href="mailto:partners@learn2earn.org" className="inv-btn inv-btn-outline inv-btn-lg">
              Request a Pilot Plan
            </a>
          </div>
          <div style={{ marginTop: "2rem", display: "flex", gap: "2rem", justifyContent: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.82rem", color: "#64748b", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <BuildingIcon size={14} stroke="#64748b" /> City & Agency Partnerships
            </span>
            <span style={{ fontSize: "0.82rem", color: "#64748b", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <DollarIcon size={14} stroke="#64748b" /> Funders & Investors
            </span>
            <span style={{ fontSize: "0.82rem", color: "#64748b", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <HandshakeIcon size={14} stroke="#64748b" /> Implementation Partners
            </span>
          </div>
          <p style={{ fontSize: "0.78rem", color: "#475569", marginTop: "1.5rem" }}>
            Response within 1 business day
          </p>
        </div>
      </section>

      <footer className="inv-footer">
        <div className="inv-container">
          <div className="inv-footer-logo">
            Learn<span>2</span>Earn
          </div>
          <p style={{ marginBottom: "1.25rem", fontSize: "0.82rem" }}>
            Measurable impact. Full transparency. Real outcomes.
          </p>
          <p>
            <a href="/app">Learner Experience</a>
            <span style={{ margin: "0 1rem", opacity: 0.2 }}>|</span>
            <a href="/admin">Admin Dashboard</a>
            <span style={{ margin: "0 1rem", opacity: 0.2 }}>|</span>
            <a href="mailto:partners@learn2earn.org">partners@learn2earn.org</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
