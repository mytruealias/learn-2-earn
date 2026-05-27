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

const LAST_UPDATED = "May 27, 2026";

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
              practices in plain language and will be reviewed by counsel
              before any public launch with a new city or shelter partner.
            </p>
          </div>

          <article className="inv-legal-body">
            <h2>Who we are</h2>
            <p>
              Learn2Earn is a Texas nonprofit that partners with cities,
              shelters, and local service providers to help people experiencing
              homelessness build life skills and earn small, verified cash
              incentives. This policy explains what information we collect
              when you use our learning app, our case-worker tools, our Hubert
              support chat, and our public partner pages, and what we do with
              that information.
            </p>

            <h2>What we collect</h2>
            <p>We collect only what we need to run the program responsibly.</p>
            <h3>Account information</h3>
            <ul>
              <li>Your name, email, and password (passwords are stored hashed, never in plain text)</li>
              <li>Optional profile details you choose to share, such as date of birth, phone, city, state, ZIP, case number, and emergency contact</li>
            </ul>
            <h3>Learning activity</h3>
            <ul>
              <li>Which lessons you start and finish, and the XP you earn</li>
              <li>Streaks, hearts, checkpoint and capstone results</li>
              <li>Crash and error reports tied to your account so we can fix bugs</li>
            </ul>
            <h3>Payout information</h3>
            <ul>
              <li>The amount of XP you choose to redeem and the date you requested it</li>
              <li>Your payout method (Zelle, Venmo, PayPal, Cash App, or check) and the handle, account email, phone number, or mailing address required to send it</li>
              <li>The case worker or admin who reviewed and approved your request</li>
            </ul>
            <h3>Hubert chat</h3>
            <ul>
              <li>Each Hubert session is ephemeral, your messages are sent to our AI provider only to generate a reply and are not stored in your account history</li>
              <li>We keep short-lived rate-limit counters in memory so a single user cannot overwhelm the service</li>
            </ul>
            <h3>Technical information</h3>
            <ul>
              <li>Standard server logs, including IP address, browser type, and the pages you visit, kept for security and debugging</li>
              <li>Cookies that remember partner access codes and PINs you have unlocked, and local-browser storage that keeps your sign-in session and progress on your device</li>
            </ul>

            <h2>How we use your information</h2>
            <ul>
              <li>To deliver lessons, track your progress, and award XP</li>
              <li>To process payout requests, verify completion, and reach you about a request</li>
              <li>To keep accounts secure and to investigate fraud or abuse</li>
              <li>To produce aggregate, anonymized reporting for our city and shelter partners and our funders</li>
              <li>To improve the curriculum, the app, and the Hubert chat experience</li>
            </ul>

            <h2>Who we share it with</h2>
            <p>
              We do not sell your personal information. We share limited
              information only with the people and services that need it to
              run the program:
            </p>
            <ul>
              <li>
                Your city or shelter partner sees aggregate participation and
                outcome data for the program they fund. Individual case
                workers assigned to you see your name, lesson activity, and
                payout requests so they can support you.
              </li>
              <li>
                Payment processors and money-transfer services (for example
                Zelle, Venmo, PayPal, Cash App, or our check-issuing
                provider) receive only the information they need to send
                your payout.
              </li>
              <li>
                Our AI provider for Hubert receives the contents of your
                current chat message in order to generate a reply. We do not
                send them your name or contact details.
              </li>
              <li>
                Law enforcement or other authorities, but only when we
                reasonably believe disclosure is required by law or
                necessary to protect someone from imminent harm.
              </li>
            </ul>

            <h2>How long we keep it</h2>
            <ul>
              <li>Account, lesson, and payout records are kept while your account is active and for up to seven years afterward, which is the standard nonprofit and financial recordkeeping window</li>
              <li>Hubert chat content is not retained on your account; provider-side retention follows our AI vendor&apos;s policy</li>
              <li>Server logs are typically rotated within 90 days</li>
            </ul>

            <h2>Your rights</h2>
            <p>You can ask us at any time to:</p>
            <ul>
              <li>See a copy of the personal information we hold about you</li>
              <li>Correct anything that is wrong</li>
              <li>Delete your account and the personal data attached to it (we may need to keep limited payout records to satisfy financial and audit requirements)</li>
              <li>Export your learning history in a portable format</li>
            </ul>
            <p>
              To make any of these requests, email{" "}
              <a href="mailto:privacy@learn2earn.org">privacy@learn2earn.org</a>{" "}
              from the email on your account, or ask your case worker to
              submit the request on your behalf.
            </p>

            <h2>How we protect your information</h2>
            <ul>
              <li>Passwords are hashed with bcrypt</li>
              <li>Traffic to and from the site is encrypted in transit</li>
              <li>Access to admin tools is restricted by role and logged in an audit trail</li>
              <li>We try to collect only what we need, and we review our practices regularly</li>
            </ul>

            <h2>Children</h2>
            <p>
              Learn2Earn is built for adults working with case workers or
              other authorized partners. We do not knowingly collect
              information from anyone under 13. If you believe a child has
              created an account, please email us so we can remove it.
            </p>

            <h2>Changes to this policy</h2>
            <p>
              We may update this policy as the program evolves. Material
              changes will be posted here with a new &quot;last updated&quot;
              date, and we will notify active accounts by email when the
              update affects them.
            </p>

            <h2>Contact us</h2>
            <p>
              Questions about your privacy or this policy? Email{" "}
              <a href="mailto:privacy@learn2earn.org">privacy@learn2earn.org</a>{" "}
              or our general partner address at{" "}
              <a href="mailto:partners@learn2earn.org">partners@learn2earn.org</a>.
            </p>
          </article>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
