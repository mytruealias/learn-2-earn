import type { ReactNode } from "react";
import Link from "next/link";
import { ButtonLink } from "../ui";
import styles from "./journey.module.css";
export default function AuthFrame({ children }: { children: ReactNode }) {
  return (
    <div
      data-design="learner-entry"
      data-ui-shell="learner"
      className={styles.page}
    >
      <a className="ds-skip-link" href="#journey-content">
        Skip to content
      </a>
      <header className={styles.header}>
        <Link
          href="/"
          className={styles.brand}
          aria-label="Learn2Earn public website"
        >
          Learn<span>2</span>Earn
        </Link>
        <ButtonLink href="/lifeline" variant="secondary">
          Help
        </ButtonLink>
      </header>
      <main id="journey-content" tabIndex={-1} className={styles.main}>
        <noscript>
          <p>
            Account forms need JavaScript to save securely. If this form stays
            unavailable, ask your program staff for help. The Help page’s phone
            links remain available.
          </p>
        </noscript>
        {children}
      </main>
    </div>
  );
}
