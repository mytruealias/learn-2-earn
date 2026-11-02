import Link from "next/link";
import SupportWorkspace from "../components/support/SupportWorkspace";
import styles from "../components/support/support.module.css";
export default function LifelinePage() {
  return (
    <main
      className={styles.workspace}
      data-design="support"
      data-ui-shell="learner"
    >
      <header>
        <Link className={styles.link} href="/app">
          Back to learning
        </Link>
        <h1>Help and human support</h1>
        <p>
          You do not need to finish a lesson or use AI to find human help.
          Program requests are separate from emergency and crisis services.
        </p>
      </header>
      <SupportWorkspace />
    </main>
  );
}
