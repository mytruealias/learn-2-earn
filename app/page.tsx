import { Suspense } from "react";
import MarketingShell from "./components/marketing/MarketingShell";
import styles from "./components/marketing/marketing.module.css";
import AppDemo from "./components/AppDemo";
import AdminDemo from "./components/AdminDemo";
import PartnerInquiryForm from "./components/marketing/PartnerInquiryForm";
import { ButtonLink } from "./components/ui";
import { HubertIcon } from "./components/icons";
import { marketingMetadata } from "@/lib/marketing/metadata";
import { publishedCatalog, authoredExamples } from "@/lib/marketing/catalog";
import { siteOrigin } from "@/lib/site-identity";
export const dynamic = "force-dynamic";
export const metadata = marketingMetadata(
  "Learn2Earn — supported learning for community programs",
  "/",
);
async function Pathways() {
  const c = await publishedCatalog();
  return (
    <>
      {c.available ? (
        <p>
          {c.lessonCount} active lessons across {c.pathCount} published pathways
          with available learning cards. This is a curriculum snapshot, not a
          participation or impact measure.
        </p>
      ) : (
        <p className={styles.notice}>
          The published curriculum is temporarily unavailable. These examples
          come from the authored curriculum; a program’s available selection
          must be confirmed before enrollment.
        </p>
      )}
      <ul className={styles.pathRows}>
        {(c.available ? c.paths : authoredExamples).map((p) => (
          <li key={p.title}>
            <div>
              <h3>{p.title}</h3>
              {"lessons" in p && <span>{p.lessons} active lessons</span>}
            </div>
            <p>{p.description}</p>
          </li>
        ))}
      </ul>
      {c.available && !c.paths.length && (
        <p>
          No published pathways are available right now. Agree a content-review
          and publication plan before inviting learners.
        </p>
      )}
    </>
  );
}
export default function HomePage() {
  const origin = siteOrigin();
  return (
    <MarketingShell>
      {origin && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Learn2Earn",
              url: origin,
              description: "Supported adult learning and program oversight.",
            }).replace(/</g, "\\u003c"),
          }}
        />
      )}
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>
            For cities, shelters and community partners
          </p>
          <h1>
            Learning with support.
            <br />
            Progress with purpose.
          </h1>
          <p className={styles.lead}>
            A clearer way to offer adult learning to people navigating housing
            instability or recovery—with manageable lessons, program-defined
            incentives and human oversight.
          </p>
          <div className={styles.actions}>
            <ButtonLink href="/#contact">Discuss a pilot</ButtonLink>
            <ButtonLink href="/demo" variant="secondary">
              Try a sample lesson
            </ButtonLink>
          </div>
          <p className={styles.heroNote}>
            Built to work alongside the people and services learners already
            rely on. Start with a sample, then discuss your setting.
          </p>
        </div>
        <div id="demo">
          <AppDemo />
        </div>
      </section>
      <section className={styles.section} id="how-it-works">
        <div className={styles.sectionHead}>
          <div>
            <p className={styles.eyebrow}>A clear program loop</p>
            <h2>
              Small steps for learners.
              <br />
              Clear decisions for staff.
            </h2>
          </div>
          <p>
            Keep enrollment, learning evidence, incentive decisions and
            follow-up connected—without treating them as the same thing.
          </p>
        </div>
        <ol className={styles.process}>
          {[
            [
              "Invite and enroll",
              "Staff invite learners into their program and explain access, privacy and available support.",
            ],
            [
              "Learn and return",
              "Short lessons, saved attempts and practice help people pick up where they left off.",
            ],
            [
              "Review incentives",
              "Eligible first completions follow the program’s saved terms. Approval and an actual payment record are separate steps.",
            ],
            [
              "Oversee and support",
              "Authorized staff review queues, record support activity and use defined participation reports.",
            ],
          ].map(([h, p]) => (
            <li key={h}>
              <h3>{h}</h3>
              <p>{p}</p>
            </li>
          ))}
        </ol>
      </section>
      <section className={styles.section} id="platform">
        <div className={styles.product}>
          <div className={styles.productCopy}>
            <p className={styles.eyebrow}>The learner experience</p>
            <h2>A next step that feels possible.</h2>
            <p>
              Clear pathways, readable choices and useful explanations keep
              attention on learning. People can return after an interruption,
              practice again and reach human-help resources without finishing a
              lesson.
            </p>
            <ul>
              <li>
                Visible progress, without public rankings or forced competition.
              </li>
              <li>
                Saved lesson attempts; optional reflections do not require
                disclosure.
              </li>
              <li>
                Rewards explained separately from lifetime learning progress.
              </li>
            </ul>
            <ButtonLink href="/demo" variant="secondary">
              Explore the learner sample
            </ButtonLink>
          </div>
          <div>
            <p className={styles.eyebrow}>What the sample shows</p>
            <h3>Teach. Try. Explain. Reflect if useful.</h3>
            <p className={styles.lead}>
              Try a teaching card, a question with an explanation and an optional
              reflection—the same interaction learners use, with fictional content.
            </p>
            <div className={styles.hubert}>
              <HubertIcon size={40} />
              <p>
                Hubert is an optional AI support tool with limits. It is not a
                clinician or monitored service. Availability depends on program
                setup and qualified review. Human-help resources remain separate.
              </p>
            </div>
          </div>
        </div>
        <div className={styles.product}>
          <div className={styles.productCopy}>
            <p className={styles.eyebrow}>The staff experience</p>
            <h2>Know what needs a person.</h2>
            <p>
              Program-scoped workspaces bring review queues, case follow-ups,
              participant progress and recorded payments into a readable
              workflow.
            </p>
            <ul>
              <li>Staff use two-factor sign-in and see their authorized program.</li>
              <li>
                Conflicting edits are flagged so staff can review the latest
                information before deciding.
              </li>
              <li>Recorded decisions and payment references support review.</li>
            </ul>
            <p className={styles.small}>
              Before launch, agree who reviews requests, how records are handled
              and how staff provide follow-up.
            </p>
          </div>
          <AdminDemo />
        </div>
      </section>
      <section className={styles.section} id="pathways">
        <div className={styles.sectionHead}>
          <div>
            <p className={styles.eyebrow}>Practical learning</p>
            <h2>Start with what matters to your program.</h2>
          </div>
          <p>
            Review content for your participants, region and delivery setting.
            Recovery-related information needs qualified human review; it is not
            clinical treatment.
          </p>
        </div>
        <Suspense
          fallback={
            <p role="status">
              Checking published curriculum… The sample lesson remains
              available.
            </p>
          }
        >
          <Pathways />
        </Suspense>
      </section>
      <section className={styles.section} id="accountability">
        <span id="impact" />
        <span id="compliance" />
        <div className={styles.sectionHead}>
          <div>
            <p className={styles.eyebrow}>Accountability, described plainly</p>
            <h2>
              Useful evidence.
              <br />
              Honest limits.
            </h2>
          </div>
          <p>
            Learning participation, service activity and paid incentives answer
            different questions. They should stay distinct in a partner’s
            evaluation.
          </p>
        </div>
        <div className={styles.accountability}>
          <div>
            <h3>Records that can be reviewed</h3>
            <p>
              The product records learning evidence and staff decisions. Payout
              requests retain accepted terms; staff record verified external
              payments separately. Scoped exports and date/timezone filters
              support defined participation reporting.
            </p>
            <p>
              Review your reporting obligations before a pilot. Learning records
              describe participation; they do not establish housing or recovery
              outcomes.
            </p>
          </div>
          <div>
            <h3>Privacy is an operating responsibility</h3>
            <p>
              Program membership controls access. Optional reflections stay on
              their screen. Separately submitted help requests become stored
              cases. AI processing and hosting retention require verification;
              there is no blanket confidentiality or zero-retention promise.
            </p>
            <a href="/privacy">Read the privacy summary</a>
          </div>
        </div>
      </section>
      <section className={styles.section} id="pilot">
        <span id="usecases" />
        <div className={styles.sectionHead}>
          <div>
            <p className={styles.eyebrow}>A considered pilot</p>
            <h2>Start focused. Agree the details.</h2>
          </div>
          <p>
            A conversation is the first step—not a signed partnership, funding
            commitment, price quote or booked meeting.
          </p>
        </div>
        <div className={styles.pilot}>
          <div>
            <h3>1. Understand the setting</h3>
            <p>
              Discuss who the program serves, existing support, access needs and
              the staff responsible for follow-up.
            </p>
          </div>
          <div>
            <h3>2. Agree readiness and scope</h3>
            <p>
              Review content, privacy, permissions, incentive funding and manual
              payment operations. Define timing, responsibilities and evaluation
              before launch.
            </p>
          </div>
          <div>
            <h3>3. Review what happened</h3>
            <p>
              Assess participation, recorded services, payment records and
              qualitative feedback separately. Decide together whether to adapt,
              continue or stop.
            </p>
          </div>
        </div>
      </section>
      <section className={`${styles.section} ${styles.faq}`} id="faq">
        <p className={styles.eyebrow}>Questions partners ask</p>
        <h2>Before you begin.</h2>
        {[
          [
            "Does Learn2Earn replace casework or treatment?",
            "No. It supports adult learning and program oversight alongside human services. It is not clinical care, crisis monitoring or emergency dispatch.",
          ],
          [
            "How are incentives calculated and paid?",
            "Each program has configured terms, limits and available manual payment methods. Learners see those terms in Rewards; accepted requests keep a snapshot. Approval is not payment, and the platform does not automatically transfer funds.",
          ],
          [
            "Can I use the sample without creating an account?",
            "Yes. The fictional sample uses the same lesson interaction as the learner app. It does not access participant records, save progress or award rewards.",
          ],
          [
            "Are cities or funders already partners?",
            "The site does not name confirmed partners. City-specific decks are private discussion outlines; an actual partnership requires a separate agreement.",
          ],
          [
            "What does an inquiry do?",
            "When a reviewed intake queue is configured, your inquiry is stored for its authorized program administrators. A server receipt confirms storage only. No email, calendar booking or response time is promised.",
          ],
          [
            "What must be ready before a pilot?",
            "Reviewed content and privacy practices, agreed program responsibilities, secure staff access, real monitoring arrangements, funded incentive procedures and a verified technical release plan.",
          ],
        ].map(([q, a]) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </section>
      <section className={styles.section} id="contact">
        <div className={styles.contact}>
          <div className={styles.contactCopy}>
            <p className={styles.eyebrow}>Let’s understand your program</p>
            <h2>
              Bring your questions.
              <br />
              Start a pilot conversation.
            </h2>
            <p>
              Tell the intake team about your organization and what you would
              like to explore. Please leave out participant names, health
              details, payment handles and other sensitive information.
            </p>
            <p className={styles.small}>
              This is a partner inquiry, not a request for urgent help or
              learner account recovery.
            </p>
            <a className={styles.textLink} href="/lifeline">
              Need human support instead?
            </a>
          </div>
          <PartnerInquiryForm />
        </div>
      </section>
    </MarketingShell>
  );
}
