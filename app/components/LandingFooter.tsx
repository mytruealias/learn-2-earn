import Link from "next/link";
import styles from "./marketing/marketing.module.css";
export default function LandingFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerTop}>
        <div>
          <Link className={styles.brand} href="/">
            Learn2Earn
          </Link>
          <p>
            Learning with support.
            <br />
            Progress with oversight.
          </p>
        </div>
        <nav aria-label="Product and support">
          <h2>Explore</h2>
          <Link href="/demo">Sample lesson</Link>
          <Link href="/login">Learner sign in</Link>
          <Link href="/lifeline">Human help and support</Link>
        </nav>
        <nav aria-label="Partners">
          <h2>For partners</h2>
          <Link href="/#pilot">Pilot process</Link>
          <Link href="/#contact">Partner inquiry</Link>
          <Link href="/admin/login">Staff sign in</Link>
        </nav>
        <nav aria-label="Privacy and service information">
          <h2>Our responsibilities</h2>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Service information</Link>
          <Link href="/#accountability">Accountability</Link>
        </nav>
      </div>
      <div className={styles.footerBottom}>
        <p>© {new Date().getFullYear()} Learn2Earn</p>
        <p>
          Proposed programs require agreed scope, staffing and incentive terms.
          No city partnership or outcome is implied.
        </p>
      </div>
    </footer>
  );
}
