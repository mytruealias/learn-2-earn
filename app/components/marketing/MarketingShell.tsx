import type { ReactNode } from "react";
import LandingNav from "../LandingNav";
import LandingFooter from "../LandingFooter";
import styles from "./marketing.module.css";
export default function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div
      className={styles.shell}
      data-design="marketing"
      data-ui-shell="marketing"
    >
      <a className={`ds-skip-link ${styles.noPrint}`} href="#public-content">
        Skip to content
      </a>
      <LandingNav />
      <main id="public-content" tabIndex={-1}>
        {children}
      </main>
      <LandingFooter />
    </div>
  );
}
