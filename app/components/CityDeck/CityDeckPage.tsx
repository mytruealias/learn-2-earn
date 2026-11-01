import MarketingShell from "../marketing/MarketingShell";
import styles from "../marketing/marketing.module.css";
import { ButtonLink } from "../ui";
import CityDeckPrintButton from "./CityDeckPrintButton";
import type { CityDeckConfig } from "./types";
export default function CityDeckPage({ config }: { config: CityDeckConfig }) {
  return (
    <MarketingShell>
      <article className={`${styles.legal} ${styles.deck}`}>
        <header>
          <p className={styles.eyebrow}>
            Private discussion material · {config.cityName}
          </p>
          <h1>
            A supported-learning pilot.
            <br />A scope to agree together.
          </h1>
          <p className={styles.lead}>
            A starting point for a proposed community program in{" "}
            {config.cityName}. This document does not assert an existing city
            partnership, approved funding, fixed price or measured outcome.
          </p>
          <div className={`${styles.actions} ${styles.noPrint}`}>
            <ButtonLink href={`/?city=${config.slug}#contact`}>
              Discuss this proposal
            </ButtonLink>
            <CityDeckPrintButton
              label="Print discussion outline"
            />
          </div>
          <p className={styles.printOnly}>
            Learn2Earn · Private pilot discussion for {config.cityName}. Contact
            through the configured partner inquiry form on the public website;
            no meeting or agreement is confirmed by this document.
          </p>
        </header>
        <section>
          <h2>1. Define the setting</h2>
          <p>
            Agree who the program would serve, where learning would take place,
            access/device needs, existing support and a named operational owner.
            Local needs and current resources should be verified with the
            partner, rather than inferred from unverified statistics.
          </p>
        </section>
        <section>
          <h2>2. Review the product</h2>
          <p>
            Learn2Earn combines adult learning pathways, saved lesson attempts,
            practice and program-scoped staff workspaces. First-completion
            evidence and repeated practice remain distinct. The public fictional
            sample uses the same lesson-card renderer without participant
            records or rewards.
          </p>
          <a href="/demo">Explore the sample lesson</a>
        </section>
        <section>
          <h2>3. Agree content and incentive operations</h2>
          <p>
            Confirm the actual published curriculum, content suitability and
            qualified review of sensitive information. Set program terms,
            available manual payment methods, limits, funding and review duties.
            Approval is not payment; authorized staff record external payment
            evidence separately.
          </p>
          <p>
            No price, participant volume, deployment date, grant eligibility,
            statutory-report compatibility or financial return is promised here.
          </p>
        </section>
        <section>
          <h2>4. Establish privacy, staff access and support</h2>
          <p>
            Review explicit organization/program ownership, staff memberships,
            MFA, consent, retention and backup/restore. Define who checks
            support requests, during which hours and with what absence coverage.
            Saved cases do not notify or dispatch anyone. Optional AI remains
            gated by qualified review and provider/privacy configuration.
          </p>
        </section>
        <section>
          <h2>5. Define an honest evaluation</h2>
          <p>
            Choose the pilot period and review checkpoints together. Define
            denominators and date/timezone windows. Report learning
            participation, practice, recorded service activity and paid
            incentives separately. Do not infer housing stability, clinical
            recovery or causation from lesson completion.
          </p>
        </section>
        <section>
          <h2>6. Decide the next step</h2>
          <p>
            Use a scoped conversation to decide readiness, responsibilities,
            agreements and whether a pilot is appropriate. Any expansion depends
            on a separate review; access to this deck is not approval.
          </p>
          <a href={`/?city=${config.slug}#contact`}>
            Open the partner inquiry form
          </a>
        </section>
      </article>
    </MarketingShell>
  );
}
