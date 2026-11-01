import Link from "next/link";
import MarketingShell from "../components/marketing/MarketingShell";
import AppDemo from "../components/AppDemo";
import styles from "../components/marketing/marketing.module.css";
import { marketingMetadata } from "@/lib/marketing/metadata";
export const metadata = marketingMetadata(
  "Try a sample lesson",
  "/demo",
  "A fictional, local-only sample using Learn2Earn’s learner card renderer. No account, participant records or rewards.",
);
export default function Page() {
  return (
    <MarketingShell>
      <div className={styles.demoPage}>
        <p className={styles.eyebrow}>See the learner interaction</p>
        <h1>A small step, tried together.</h1>
        <p>
          Explore a fictional lesson. In an enrolled program, authenticated
          attempts and rewards are managed by the server. This sample is local
          to this screen and uses no account or learner data.
        </p>
        <AppDemo />
        <Link className={styles.textLink} href="/#contact">
          Discuss a pilot for your program
        </Link>
      </div>
    </MarketingShell>
  );
}
