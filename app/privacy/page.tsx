import type { Metadata } from "next";
import "../invest/invest.css";
import LandingNav from "../components/LandingNav";
import LandingFooter from "../components/LandingFooter";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Learn2Earn collects, uses, and protects your personal information, lesson activity, payout details, and Hubert chat content.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/privacy" },
};

const LAST_UPDATED = "October 31, 2026";

export default function PrivacyPage() {
  return (
    <div className="inv-page">
      <LandingNav />

      <section className="inv-legal">
        <div className="inv-legal-container">
          <div className="inv-legal-header">
            <div className="inv-legal-eyebrow">Legal</div>
            <h1>Privacy Policy</h1>
            <p className="inv-legal-updated">Last updated {LAST_UPDATED}</p>
            <p className="inv-legal-draft" role="note">
              Draft for partner review. This policy describes our current
              practices in plain language and will be reviewed by counsel before
              any public launch with a new city or shelter partner.
            </p>
          </div>

          <article className="inv-legal-body">
            <h2>Who we are</h2>
            <p>
              Learn2Earn is a Texas nonprofit that partners with cities,
              shelters, and local service providers to help people experiencing
              homelessness build life skills and earn small, verified cash
              incentives. This policy explains what information we collect when
              you use our learning app, our case-worker tools, our Hubert
              support chat, and our public partner pages, and what we do with
              that information.
            </p>

            <h2>What we collect</h2>
            <p>We collect only what we need to run the program responsibly.</p>
            <h3>Account information</h3>
            <ul>
              <li>
                Your name, email, and password (passwords are stored hashed,
                never in plain text)
              </li>
              <li>
                Optional profile details you choose to share, such as date of
                birth, phone, city, state, ZIP, case number, and emergency
                contact
              </li>
            </ul>
            <h3>Learning activity</h3>
            <ul>
              <li>Which lessons you start and finish, and the XP you earn</li>
              <li>Streaks, hearts, checkpoint and capstone results</li>
              <li>
                Recorded lesson attempts and answers used for progress and
                review (optional reflection text is not saved)
              </li>
            </ul>
            <h3>Payout information</h3>
            <ul>
              <li>
                The amount of XP you choose to redeem and the date you requested
                it
              </li>
              <li>
                Your program-enabled manual payout method and the handle,
                account email, phone number, or mailing address required to send
                it
              </li>
              <li>
                The case worker or admin who reviewed and approved your request
              </li>
            </ul>
            <h3>Hubert chat</h3>
            <ul>
              <li>
                When enabled and you choose to use it, Hubert sends conversation
                text to OpenAI to generate a reply. Application code does not
                save chat transcripts in account tables or browser storage.
                Provider processing and retention depend on the provider
                agreement and account settings; closing chat does not guarantee
                provider deletion.
              </li>
              <li>
                We store usage counters, request sizes, time windows and short
                concurrency leases linked to your account. These controls
                contain no conversation text. Automatic expiry/deletion of all
                metadata is not configured; application and hosting retention
                still require operational review.
              </li>
            </ul>
            <h3>Program help requests and voice</h3>
            <ul>
              <li>
                A separately submitted program help request is stored as a
                private case for authorized caseworkers and program
                administrators in your enrolled program. Optional location is
                stored only when you choose to share it. A saved request is not
                an emergency alert or proof that staff has read it.
              </li>
              <li>
                Staff acknowledgment is shown only after a staff member records
                it. Monitoring is limited to the program’s stated schedule; the
                app does not send automatic help notifications or dispatch
                services.
              </li>
              <li>
                Cloud read-aloud sends the selected reply text to OpenAI only
                after a separate choice. Local device voices depend on your
                browser/device. Custom microphone capture is not used; keyboard
                dictation may use your device provider.
              </li>
              <li>
                Program case retention and deletion/redaction procedures depend
                on verified program operations. No automatic case-retention
                period or blanket confidentiality guarantee is asserted here.
              </li>
            </ul>
            <h3>Technical information</h3>
            <ul>
              <li>
                Hosting and proxy services may keep request metadata, such as IP
                addresses and visited routes. Application support endpoints do
                not log conversation content or raw provider exceptions. Hosting
                body capture, provider retention and deletion settings must be
                verified by the operator; they are not established by this
                policy text.
              </li>
              <li>
                HttpOnly session/access cookies support sign-in. Identity,
                learning progress and permissions are checked on the server. A
                browser tab may keep an opaque support-request key for
                retry/status recovery; the request text and location are not
                kept in browser storage.
              </li>
            </ul>

            <h2>How we use your information</h2>
            <ul>
              <li>To deliver lessons, track your progress, and award XP</li>
              <li>
                To process payout requests, verify completion, and reach you
                about a request
              </li>
              <li>To keep accounts secure and to investigate fraud or abuse</li>
              <li>
                To provide scoped participant and aggregate reports to
                authorized program staff. Aggregation alone does not guarantee
                anonymity, particularly for small groups.
              </li>
              <li>
                To improve the curriculum, the app, and the Hubert chat
                experience
              </li>
            </ul>

            <h2>Who we share it with</h2>
            <p>
              We do not sell your personal information. We share limited
              information only with the people and services that need it to run
              the program:
            </p>
            <ul>
              <li>
                Authorized caseworkers and administrators in your enrolled
                program can see participant learning and support records,
                whether or not a particular case is assigned to them. Finance
                staff have limited reward-related access. Reports describe
                participation and recorded services; they do not establish
                housing or recovery outcomes.
              </li>
              <li>
                Authorized staff use the payment details required for your
                selected, program-enabled manual payment workflow. This app
                records approvals and verified payments; it does not
                automatically transfer money. Staff must verify the actual
                external service and its privacy practices.
              </li>
              <li>
                OpenAI receives the conversation history sent for a reply, or
                reply text selected for cloud voice. Application code does not
                attach account profile or case records, but anything you type,
                including a name or contact detail, can be sent. Avoid including
                sensitive identifying information.
              </li>
              <li>
                Law enforcement or other authorities, but only when we
                reasonably believe disclosure is required by law or necessary to
                protect someone from imminent harm.
              </li>
            </ul>

            <h2>How long we keep it</h2>
            <ul>
              <li>
                Account, learning, payment and program-case records remain in
                application storage. Automatic deletion after a fixed period is
                not implemented. The operator must establish a lawful retention
                and reviewed deletion/redaction process, including required
                financial evidence.
              </li>
              <li>
                Application code does not retain Hubert chat transcripts on your
                account; provider/hosting processing and retention must be
                verified against actual contracts and settings.
              </li>
              <li>
                No hosting log rotation or deletion period has been verified for
                this deployment. We do not claim a 90-day or zero-retention
                guarantee.
              </li>
            </ul>

            <h2>Your rights</h2>
            <p>You can ask us at any time to:</p>
            <ul>
              <li>See a copy of the personal information we hold about you</li>
              <li>Correct anything that is wrong</li>
              <li>
                Delete your account and the personal data attached to it (we may
                need to keep limited payout records to satisfy financial and
                audit requirements)
              </li>
              <li>Export your learning history in a portable format</li>
            </ul>
            <p>
              Ask your trusted program staff for their verified privacy-request
              contact and identity-check process. This app does not provide
              automatic delivery, export or deletion from this page.
            </p>

            <h2>How we protect your information</h2>
            <ul>
              <li>Passwords are hashed with bcrypt</li>
              <li>Traffic to and from the site is encrypted in transit</li>
              <li>
                Access to admin tools is restricted by role and logged in an
                audit trail
              </li>
              <li>
                We try to collect only what we need, and we review our practices
                regularly
              </li>
            </ul>

            <h2>Children</h2>
            <p>
              Learn2Earn is built for adults working with case workers or other
              authorized partners. We do not knowingly collect information from
              anyone under 13. If you believe a child has created an account,
              please email us so we can remove it.
            </p>

            <h2>Changes to this policy</h2>
            <p>
              We may update this policy as the program evolves. Material changes
              will be posted here with a new &quot;last updated&quot; date,
              including the effective date and practical effects.
            </p>

            <h2>Contact us</h2>
            <p>
              Contact your program through its verified direct contact. An
              operational privacy owner, retention policy and monitored request
              channel must be confirmed before launch. Do not send personal
              information to an unverified address.
            </p>
          </article>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
