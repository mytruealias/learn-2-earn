import type { Metadata } from "next";
import "../invest/invest.css";
import LandingNav from "../components/LandingNav";
import LandingFooter from "../components/LandingFooter";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Learn2Earn's rules of the road: account responsibilities, XP-to-cash payouts, prohibited conduct, and the limits of what our app can do for you.",
  robots: { index: true, follow: true },
};

const LAST_UPDATED = "May 27, 2026";

export default function TermsPage() {
  return (
    <div className="inv-page">
      <LandingNav />

      <section className="inv-legal">
        <div className="inv-legal-container">
          <div className="inv-legal-header">
            <div className="inv-legal-eyebrow">Legal</div>
            <h1>Terms of Service</h1>
            <p className="inv-legal-updated">Last updated {LAST_UPDATED}</p>
            <p className="inv-legal-draft" role="note">
              Draft for partner review. These terms describe how the
              Learn2Earn program currently works in plain language and will
              be reviewed by counsel before any public launch with a new
              city or shelter partner.
            </p>
          </div>

          <article className="inv-legal-body">
            <h2>Welcome</h2>
            <p>
              Thanks for using Learn2Earn. By creating an account or using
              our app, our Hubert support chat, or our partner pages, you
              agree to these Terms of Service and to our{" "}
              <a href="/privacy">Privacy Policy</a>. If you do not agree,
              please do not use the service.
            </p>

            <h2>Who can use Learn2Earn</h2>
            <ul>
              <li>You must be at least 18 years old, or be enrolled through a partner program with appropriate authorization</li>
              <li>You are responsible for the activity that happens under your account, including keeping your password safe</li>
              <li>One account per person, please. Creating multiple accounts to multiply payouts is not allowed.</li>
            </ul>

            <h2>How earning works</h2>
            <p>
              You earn XP by completing lessons. Lessons award different
              amounts: learn cards are worth 2 XP, checkpoints are worth
              15 XP, and capstones are worth 25 XP.
            </p>
            <ul>
              <li>The default conversion rate is 5 cents per XP, which works out to $1 for every 20 XP redeemed. Your city or shelter partner may configure a different rate.</li>
              <li>There is a minimum balance to request a payout (currently 20 XP, or $1.00) and a weekly cap on how much XP can be redeemed (currently 500 XP, or $25.00). These can be adjusted per program.</li>
              <li>XP must be earned by you, by actually completing the lessons. Sharing accounts, scripting answers, or any other attempt to fake completion will result in cancellation of XP and the account.</li>
              <li>Earned XP has no cash value until it is approved for payout by a case worker or admin. We may reverse XP awards if we discover an error or abuse.</li>
            </ul>

            <h2>How payouts work</h2>
            <ul>
              <li>You request a payout from your profile, choose a method (Zelle, Venmo, PayPal, Cash App, or check), and provide the handle, account email, phone number, or mailing address we need to send it</li>
              <li>A case worker or admin reviews each request before it is approved</li>
              <li>Approved payouts are sent through the method you selected. Delivery times depend on that service.</li>
              <li>We are not responsible for delays, fees, or errors caused by third-party payment services, or for payouts sent to an incorrect handle that you provided</li>
              <li>If a payout is reversed by a payment processor, we may reverse the corresponding XP redemption</li>
            </ul>

            <h2>Hubert is supportive, not a professional</h2>
            <p>
              Hubert is an AI emotional support companion. He is warm and he
              tries to listen, but he is not a therapist, doctor, lawyer, or
              financial advisor. Anything Hubert says is for general support
              and information only and is not a substitute for professional
              advice.
            </p>
            <p>
              If you are in immediate danger or in a mental health crisis,
              please call or text 988 (Suicide &amp; Crisis Lifeline) or
              call 911. Hubert will also surface these resources if a
              conversation suggests you may need them.
            </p>

            <h2>What you may not do</h2>
            <ul>
              <li>Use the service for anything illegal, abusive, harassing, hateful, or harmful to others</li>
              <li>Try to break, scrape, overload, reverse-engineer, or interfere with the service</li>
              <li>Impersonate another person, including a case worker or partner staff member</li>
              <li>Create accounts on someone else&apos;s behalf without their consent</li>
              <li>Game the XP or payout system through fake completions, multiple accounts, or shared answers</li>
              <li>Upload, post, or send anything that violates someone else&apos;s rights</li>
            </ul>
            <p>
              We may suspend or close any account that we reasonably believe
              has done any of the above. Where balances are forfeit for
              abuse, we will note that in your account audit log.
            </p>

            <h2>Content you provide</h2>
            <p>
              You keep any rights you already have in the content you
              provide (for example, messages you send to Hubert or notes
              you give your case worker). You grant Learn2Earn permission
              to use that content only to operate, support, and improve
              the service, and to comply with the law.
            </p>

            <h2>Service availability</h2>
            <p>
              We work hard to keep the service up, but we cannot promise it
              will always be available, error-free, or able to reach every
              third-party service we depend on. We may change, suspend, or
              discontinue features at any time, and we will try to give
              notice when we do.
            </p>

            <h2>No medical, legal, or financial advice</h2>
            <p>
              Our lessons, Hubert chat, and any other content on Learn2Earn
              are educational and supportive in nature. They are not a
              substitute for medical, mental health, legal, or financial
              advice from a licensed professional. Always seek qualified
              help for those situations.
            </p>

            <h2>Disclaimers and limitation of liability</h2>
            <p>
              To the maximum extent allowed by law, the service is provided
              &quot;as is&quot; and &quot;as available,&quot; without
              warranties of any kind. Learn2Earn is not liable for indirect,
              incidental, special, consequential, or punitive damages, or
              for any loss of profits, revenues, data, or goodwill arising
              out of your use of the service. Our total liability to you
              for any claim related to the service will not exceed the
              total amount of payouts paid to you in the 12 months before
              the claim, or $100, whichever is greater.
            </p>

            <h2>Ending your use</h2>
            <ul>
              <li>You may stop using Learn2Earn at any time and ask us to delete your account through your case worker or by emailing <a href="mailto:privacy@learn2earn.org">privacy@learn2earn.org</a></li>
              <li>We may suspend or terminate access for any account that violates these terms or that we reasonably believe is being used in bad faith</li>
              <li>Sections about earning, payouts, abuse, disclaimers, and limitation of liability survive termination</li>
            </ul>

            <h2>Changes to these terms</h2>
            <p>
              We may update these terms as the program evolves. When we
              make material changes we will post the new version here with
              an updated date and notify active accounts by email. Your
              continued use after that date means you accept the changes.
            </p>

            <h2>Governing law</h2>
            <p>
              These terms are governed by the laws of the State of Texas,
              without regard to its conflict of laws rules. Any dispute
              that we cannot resolve informally will be brought in the
              state or federal courts located in Travis County, Texas.
            </p>

            <h2>Contact us</h2>
            <p>
              Questions about these terms? Email{" "}
              <a href="mailto:partners@learn2earn.org">partners@learn2earn.org</a>.
              For privacy questions, email{" "}
              <a href="mailto:privacy@learn2earn.org">privacy@learn2earn.org</a>.
            </p>
          </article>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
