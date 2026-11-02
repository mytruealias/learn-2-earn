import MarketingShell from "../components/marketing/MarketingShell";
import styles from "../components/marketing/marketing.module.css";
import { marketingMetadata } from "@/lib/marketing/metadata";
export const metadata = marketingMetadata(
  "Service information",
  "/terms",
  "A factual draft summary of Learn2Earn learning, program-defined incentives, staff responsibilities and service limitations.",
);
export default function Page() {
  return (
    <MarketingShell>
      <article className={styles.legal}>
        <p className={styles.eyebrow}>Service information</p>
        <h1>
          Clear expectations.
          <br />
          Agreed responsibilities.
        </h1>
        <p className={styles.notice}>
          Draft for partner and qualified legal review, updated November 1,
          2026. This summary does not supply an approved contract, legal
          opinion, certification, funding determination or a new financial
          entitlement rule. Agree the applicable program terms before enrollment
          or launch.
        </p>
        <section>
          <h2>Learning alongside human services</h2>
          <p>
            Learn2Earn supports adult learning and staff program oversight. It
            does not replace casework, treatment, legal advice, crisis
            monitoring or emergency services. Program staff must determine
            eligibility, access requirements, content suitability and consent
            through a reviewed process; this page does not claim automated age
            or eligibility verification.
          </p>
        </section>
        <section>
          <h2>Progress and incentives</h2>
          <p>
            Authenticated lesson attempts provide server-owned evidence for
            first completion. Practice is tracked separately and does not create
            duplicate monetary credit. A sample lesson on the public website
            creates no progress or reward.
          </p>
          <p>
            Incentive rates, minimums, limits and available manual payment
            methods come from the program’s configured contract and are shown in
            Rewards. Accepted requests retain their terms. There is no universal
            dollar amount, method or payment date promised here.
          </p>
          <p>
            Request, review, approval and actual payment recording are separate
            states. Authorized staff record verified external payment references
            and timestamps; the app does not automatically transfer money.
            Corrections, disputes, historical reconciliation and any policy
            change require authorized review and preserved evidence, rather than
            arbitrary erasure of learning or payment history.
          </p>
        </section>
        <section>
          <h2>Accounts and program oversight</h2>
          <p>
            Keep account credentials private. Program membership and role
            determine staff access, not a profile city, public demo or hostname.
            Staff must complete MFA and follow program-specific consent,
            funding, privacy and record-handling procedures. A software
            permission is not proof of professional qualification or an
            agreement between organizations.
          </p>
        </section>
        <section>
          <h2>Hubert and human help</h2>
          <p>
            Optional AI support can be wrong. It is not a person, clinician,
            emergency dispatcher or continuously monitored service. AI requires
            a qualified response-policy review and configured provider; it has
            no case-file, financial-action or staff-notification tools.
          </p>
          <p>
            Use <a href="/lifeline">human-help resources</a> independently of AI
            and lessons. U.S. resources are explicitly labeled; outside the
            U.S., use verified local emergency/health services. The app does not
            automatically detect all distress or contact anyone.
          </p>
        </section>
        <section>
          <h2>Partner inquiries and pilot proposals</h2>
          <p>
            A configured inquiry form stores contact details with consent in a
            scoped intake queue. A receipt does not confirm an email, booked
            meeting, response time, price, funding, partnership or contract.
            City decks are private discussion material. Any pilot timing,
            participant scope, staffing, funding, data sharing and evaluation
            must be agreed separately.
          </p>
        </section>
        <section>
          <h2>Availability and privacy</h2>
          <p>
            Network or service failures may interrupt use. The interface
            distinguishes confirmed saves from unknown or failed outcomes;
            follow its retry guidance rather than assuming a payment, message or
            enrollment occurred.
          </p>
          <p>
            Read the <a href="/privacy">privacy summary</a> for application
            storage and the provider/host/retention practices that still require
            verification. Use your program’s verified support/privacy contact
            for individual account or data requests. No unverified mailbox,
            automated recovery delivery or guaranteed retention period is
            offered here.
          </p>
        </section>
      </article>
    </MarketingShell>
  );
}
