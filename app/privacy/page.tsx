import MarketingShell from "../components/marketing/MarketingShell";
import styles from "../components/marketing/marketing.module.css";
import { marketingMetadata } from "@/lib/marketing/metadata";
export const metadata = marketingMetadata(
  "Privacy summary",
  "/privacy",
  "How Learn2Earn handles learning records, program requests, partner inquiries and optional AI processing, including verification limits.",
);
export default function Page() {
  return (
    <MarketingShell>
      <article className={styles.legal}>
        <p className={styles.eyebrow}>Privacy and accountability</p>
        <h1>
          What is recorded.
          <br />
          Who can see it.
        </h1>
        <p className={styles.notice}>
          Draft operational summary, updated November 1, 2026. Deployment
          practices, organizational identity, lawful retention and privacy
          contacts require operator and qualified legal review before launch.
          This page is not proof of a certification or zero-retention agreement.
        </p>
        <section>
          <h2>Accounts and learning</h2>
          <p>
            Account information, password hashes, server sessions, lesson
            attempts, answers, completion, progress and reward records support
            the program. Optional profile fields may contain sensitive
            information; share only what your program needs. Optional lesson
            reflections stay in component memory and are not submitted or saved.
          </p>
          <p>
            Staff access depends on active program membership, role and
            MFA-verified sessions. Authorized program caseworkers and
            administrators can see program participant/support records; finance
            access is limited to reward-related work. A case does not need to be
            assigned to a particular staff member for an authorized program role
            to access it.
          </p>
        </section>
        <section>
          <h2>Program help is a stored request</h2>
          <p>
            Submitting program help stores a private case and the location you
            explicitly choose to share. No device location is collected. The
            page identifies the configured team and monitoring notice. A receipt
            confirms storage, not notification or staff acknowledgment. Staff
            acknowledgment appears only when actually recorded; it does not
            establish completed follow-up.
          </p>
          <p>
            The app sends no automatic support email, text or emergency
            dispatch. <a href="/lifeline">Public human-help resources</a> are
            available without a lesson or AI chat.
          </p>
        </section>
        <section>
          <h2>Partner inquiries</h2>
          <p>
            The partner form collects a contact name, organization, email,
            interest, optional region and optional message, with explicit
            consent. It routes the stored inquiry to authorized administrators
            of one reviewed intake program; it is not visible to every
            organization using the platform. The form states the responsible
            team and its actual monitoring notice when configured.
          </p>
          <p>
            No automatic email or calendar booking is sent. A server receipt
            confirms storage only. The browser may retain an opaque retry key in
            sessionStorage; names, email and inquiry text are not stored there.
            Do not include participant names, health details, case files or
            payment handles.
          </p>
        </section>
        <section>
          <h2>Optional AI and voice</h2>
          <p>
            Hubert is an AI support tool, not a clinician or monitored crisis
            service. Chat/cloud voice are disabled until provider configuration
            and a qualified response-policy review are recorded. When you
            explicitly choose processing, conversation history is sent to
            OpenAI; cloud voice separately sends selected reply text. The app
            does not attach account profiles, case files or payment records, but
            identifying details you type can be included.
          </p>
          <p>
            Application source does not save chat transcripts to account tables
            or browser storage. It stores account-linked usage counters, windows
            and short concurrency leases. This does not establish provider or
            hosting zero retention. Provider contracts, account settings,
            logging and subprocessors must be verified. Local device voice and
            keyboard dictation have their own device/provider behavior.
          </p>
        </section>
        <section>
          <h2>Payments and reporting</h2>
          <p>
            Program-defined terms, request snapshots, reservations, staff
            decisions and recorded external payment evidence support audit and
            reconciliation. Approval is not a transfer; this app does not
            automatically send these manual payments. Payment details are masked
            in ordinary history and revealed to authorized staff through an
            audited workflow.
          </p>
          <p>
            Program reports distinguish participation, practice, recorded
            services and paid incentives. Aggregates do not guarantee anonymity,
            especially in small groups, and do not establish housing or recovery
            outcomes.
          </p>
        </section>
        <section>
          <h2>Logs, retention and requests</h2>
          <p>
            Application support and inquiry endpoints do not log message bodies
            or raw provider errors. Hosting/proxy/APM services may record
            request metadata or bodies depending on their configuration; those
            settings have not been verified here. There is no verified 90-day
            log period, automatic account/case/inquiry deletion schedule or
            blanket confidentiality guarantee.
          </p>
          <p>
            Account, learning, payment, case and inquiry records remain until a
            reviewed retention/deletion process is applied. Security/abuse
            counters include HMAC-derived identifiers and time windows.
            Operators must establish lawful retention, access, redaction and
            financial-record preservation before enabling intake.
          </p>
          <p>
            Use the verified privacy contact supplied by your program to request
            access, correction, export or deletion review. This page does not
            send a privacy request, promise automatic deletion or provide an
            unverified mailbox. A partner inquiry is not the right place for
            sensitive privacy or learner account-recovery details.
          </p>
        </section>
        <section>
          <h2>Fictional public previews</h2>
          <p>
            The public sample lesson runs locally without an account or API
            submissions. Staff preview tasks are illustrative. Neither preview
            reads participant records or creates real learning progress, rewards
            or staff decisions.
          </p>
          <a href="/terms">Read the service information</a>
        </section>
      </article>
    </MarketingShell>
  );
}
