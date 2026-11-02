import { HUMAN_RESOURCES } from "@/lib/support/resources";
import styles from "./support.module.css";
export default function HumanResources({
  compact = false,
  region = "US",
}: {
  compact?: boolean;
  region?: "US" | "other";
}) {
  return (
    <section
      className={compact ? styles.compact : styles.resources}
      aria-label="Human support options"
      data-design="support"
    >
      <h2>Human help</h2>
      <p>
        These options work independently of Hubert, account sign-in and lesson
        completion. This app does not call or text anyone for you.
      </p>
      {region === "US" ? (
        <>
          <p>
            U.S. national numbers. If you are elsewhere, use your local
            emergency number or official local health services.
          </p>
          <div className={styles.resourceGrid}>
            {HUMAN_RESOURCES.map((r) => (
              <article key={r.id}>
                <a className={styles.call} href={r.href}>
                  {r.title}
                </a>
                {"textHref" in r && (
                  <a className={styles.link} href={r.textHref}>
                    Text 988
                  </a>
                )}
                {!compact && (
                  <>
                    <p>{r.description}</p>
                    <a
                      className={styles.link}
                      href={r.source}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Official {r.id} information
                    </a>
                  </>
                )}
              </article>
            ))}
          </div>
        </>
      ) : (
        <p>
          U.S. short numbers may not connect where you are. For urgent danger,
          contact your local emergency service. Use official local health
          services or a trusted person near you for human support.
        </p>
      )}
      {!compact && (
        <p>
          <a
            className={styles.link}
            href="https://www.samhsa.gov/find-help/national-helpline"
            target="_blank"
            rel="noopener noreferrer"
          >
            SAMHSA’s official treatment and referral information
          </a>
          . Local availability, privacy practices and eligibility depend on the
          service; no blanket confidentiality guarantee is made here.
        </p>
      )}
    </section>
  );
}
