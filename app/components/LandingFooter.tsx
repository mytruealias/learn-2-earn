import FounderModal from "./FounderModal";

export default function LandingFooter() {
  return (
    <footer className="inv-footer">
      <div className="inv-container">
        <div className="inv-footer-logo">
          Learn<span>2</span>Earn
        </div>
        <p className="inv-footer-tagline">
          Measurable impact. Full transparency. Real outcomes.
        </p>
        <p className="inv-footer-nonprofit">
          Learn2Earn is a Texas nonprofit organization.
        </p>
        <nav className="inv-footer-links" aria-label="Site links">
          <a href="/app">Learner Experience</a>
          <span className="inv-footer-sep">|</span>
          <a href="/admin">Admin Dashboard</a>
          <span className="inv-footer-sep">|</span>
          <a href="mailto:partners@learn2earn.org">partners@learn2earn.org</a>
          <span className="inv-footer-sep">|</span>
          <FounderModal />
        </nav>

        <nav className="inv-footer-legal" aria-label="Legal">
          <a href="/privacy">Privacy Policy</a>
          <span className="inv-footer-sep">|</span>
          <a href="/terms">Terms of Service</a>
        </nav>

        <div className="inv-footer-pilots">
          <div className="inv-footer-pilots-label">Pilot Requests</div>
          <div className="inv-footer-pilots-links">
            <a href="/austin">Austin</a>
            <a href="/dallas">Dallas</a>
            <a href="/houston">Houston</a>
            <a href="/denver">Denver</a>
            <a href="/los-angeles">Los Angeles</a>
            <a href="/san-francisco">San Francisco</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
