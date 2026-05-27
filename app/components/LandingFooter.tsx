import FounderModal from "./FounderModal";

const CITIES = [
  { href: "/austin", label: "Austin" },
  { href: "/dallas", label: "Dallas" },
  { href: "/houston", label: "Houston" },
  { href: "/denver", label: "Denver" },
  { href: "/los-angeles", label: "Los Angeles" },
  { href: "/san-francisco", label: "San Francisco" },
];

const PRODUCT = [
  { href: "/app", label: "Learner Experience" },
  { href: "/lifeline", label: "Lifeline & Hubert" },
  { href: "/#demo", label: "Live Demo" },
  { href: "/admin", label: "Admin Dashboard" },
];

export default function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="inv-footer" role="contentinfo">
      <div className="inv-container">
        <div className="inv-footer-grid">
          <div className="inv-footer-brand">
            <div className="inv-footer-logo">
              Learn<span>2</span>Earn
            </div>
            <p className="inv-footer-tagline">
              Measurable impact. Full transparency. Real outcomes.
            </p>
            <p className="inv-footer-nonprofit">
              A Texas nonprofit organization
            </p>
            <div className="inv-footer-about-wrap">
              <FounderModal />
            </div>
          </div>

          <nav className="inv-footer-col" aria-label="Product">
            <div className="inv-footer-col-title">Product</div>
            <ul>
              {PRODUCT.map((l) => (
                <li key={l.href}>
                  <a href={l.href}>{l.label}</a>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="inv-footer-col" aria-label="Cities">
            <div className="inv-footer-col-title">Cities</div>
            <ul>
              {CITIES.map((c) => (
                <li key={c.href}>
                  <a href={c.href}>{c.label}</a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="inv-footer-col">
            <div className="inv-footer-col-title">Contact</div>
            <ul>
              <li>
                <a href="mailto:partners@learn2earn.org">
                  partners@learn2earn.org
                </a>
              </li>
              <li>
                <a href="/#contact">Request a Pilot Plan</a>
              </li>
              <li>
                <a
                  href="mailto:partners@learn2earn.org?subject=Hiring%20inquiry"
                  className="inv-footer-hiring-link"
                >
                  We&apos;re hiring &rarr;
                </a>
              </li>
            </ul>
            <p className="inv-footer-address">
              Austin, Texas, USA
            </p>
          </div>

          <nav className="inv-footer-col" aria-label="Legal">
            <div className="inv-footer-col-title">Legal</div>
            <ul>
              <li>
                <a href="/privacy">Privacy Policy</a>
              </li>
              <li>
                <a href="/terms">Terms of Service</a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="inv-footer-bottom">
          <p className="inv-footer-copyright">
            &copy; {year} Learn2Earn. All rights reserved.
          </p>
          <p className="inv-footer-note">
            Built in Texas for partners serving people experiencing
            homelessness.
          </p>
        </div>
      </div>
    </footer>
  );
}
