"use client";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Button,
  ButtonLink,
  Card,
  Dialog,
  Skeleton,
} from "@/app/components/ui";
import { useLearnerSession } from "@/app/components/learner/LearnerSession";
import type { AttemptView } from "@/lib/lesson/contracts";
import type { CardAnswer } from "@/lib/lesson/cards";
import CardRenderer from "./CardRenderers";
import styles from "./lesson.module.css";
class SaveIssue extends Error {}
type Phase =
  | "loading"
  | "answering"
  | "checking"
  | "feedback"
  | "next"
  | "submitting"
  | "complete"
  | "error";
export type LessonHeader = {
  id: string;
  title: string;
  pathSlug: string;
  pathTitle: string;
};
export default function LessonPlayer({
  lesson,
  practice = false,
}: {
  lesson: LessonHeader;
  practice?: boolean;
}) {
  const { user, state: sessionState } = useLearnerSession();
  const [attempt, setAttempt] = useState<AttemptView | null>(null),
    [phase, setPhase] = useState<Phase>("loading"),
    [selected, setSelected] = useState<number | null>(null);
  const [error, setError] = useState(""),
    [code, setCode] = useState(""),
    [exit, setExit] = useState(false),
    [speech, setSpeech] = useState(false),
    [speaking, setSpeaking] = useState(false);
  const lock = useRef(false),
    generation = useRef(0),
    owner = useRef<string | null>(null);
  const pageRef = useRef<HTMLDivElement>(null),
    footerRef = useRef<HTMLElement>(null);
  const lastRequest = useRef<{
    path: string;
    body: object;
    pending: Phase;
  } | null>(null);
  const footerVisible = !!attempt && !attempt.result && phase !== "error";
  const busy = ["loading", "checking", "next", "submitting"].includes(phase);
  function accept(next: AttemptView) {
    setAttempt(next);
    setSelected(next.feedback?.choice ?? null);
    setPhase(
      next.result ? "complete" : next.feedback ? "feedback" : "answering",
    );
  }
  async function request(path: string, body: object, pending: Phase) {
    if (lock.current) return;
    lock.current = true;
    lastRequest.current = { path, body, pending };
    const current = generation.current;
    setPhase(pending);
    setError("");
    setCode("");
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
        signal: AbortSignal.timeout(20000),
      });
      const data = await response.json();
      if (current !== generation.current) return;
      if (!response.ok) {
        setCode(data.error?.code || "save_failed");
        throw new SaveIssue(
          data.error?.message || "Your save could not be confirmed. Try again.",
        );
      }
      if (data.attempt.userId !== owner.current)
        throw new SaveIssue(
          "Your account changed. Return to Learn to continue safely.",
        );
      accept(data.attempt);
    } catch (e) {
      if (current === generation.current) {
        setError(
          e instanceof SaveIssue
            ? e.message
            : "Your save could not be confirmed. Check your connection, then reload your saved place. Repeating a saved step or completion will not duplicate rewards.",
        );
        setPhase("error");
      }
    } finally {
      if (current === generation.current) lock.current = false;
    }
  }
  useEffect(() => {
    const counter = generation;
    counter.current++;
    owner.current = user?.id || null;
    lastRequest.current = null;
    lock.current = false;
    setAttempt(null);
    setSelected(null);
    setError("");
    setCode("");
    setPhase("loading");
    if (sessionState === "ready" && user)
      void request(
        "/api/lesson/attempt",
        { lessonId: lesson.id, practice },
        "loading",
      );
    else if (sessionState !== "loading") {
      setCode("unauthorized");
      setError("Sign in to return to your saved lesson.");
      setPhase("error");
    }
    return () => {
      counter.current++;
    };
    // Identity changes invalidate all pending UI updates. The server independently verifies ownership.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, sessionState, lesson.id, practice]);
  useEffect(() => {
    setSpeech("speechSynthesis" in window);
    return () => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);
  useEffect(() => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeaking(false);
    if (document.getElementById("card-prompt"))
      document.getElementById("card-prompt")?.focus();
  }, [attempt?.card?.id]);
  useEffect(() => {
    const footer = footerRef.current;
    if (!footer) return;
    const observer = new ResizeObserver(() =>
      pageRef.current?.style.setProperty(
        "--lesson-actions-height",
        `${footer.getBoundingClientRect().height}px`,
      ),
    );
    observer.observe(footer);
    return () => observer.disconnect();
  }, [footerVisible]);
  const card = attempt?.card;
  function answer(skipped = false) {
    if (!attempt || !card) return;
    let answer: CardAnswer;
    if (card.kind === "reflection") answer = { kind: "reflect", skipped };
    else if (card.kind === "teaching") answer = { kind: "acknowledge" };
    else {
      if (selected === null) return;
      answer = { kind: "choice", choice: selected };
    }
    void request(
      "/api/lesson/answer",
      { attemptId: attempt.id, cardId: card.id, answer },
      "checking",
    );
  }
  function readAloud() {
    if (!card) return;
    window.speechSynthesis.cancel();
    if (speaking) {
      setSpeaking(false);
      return;
    }
    const text = [
      card.prompt,
      card.body,
      ...("choices" in card ? card.choices : []),
    ]
      .filter(Boolean)
      .join(". ");
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = document.documentElement.lang || "en";
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => {
      setSpeaking(false);
      setError(
        "Read-aloud is unavailable on this device. You can continue using the text.",
      );
    };
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }
  const path = `/paths/${lesson.pathSlug}`;
  const result = attempt?.result;
  return (
    <div ref={pageRef} data-design="lesson" className={styles.page}>
      <header className={styles.header}>
        <Button variant="quiet" onClick={() => setExit(true)}>
          Exit lesson
        </Button>
        <p>{lesson.pathTitle}</p>
        <ButtonLink href="/lifeline" variant="quiet">
          Help
        </ButtonLink>
      </header>
      <main className={styles.main} id="lesson-content" aria-busy={busy}>
        <p className={styles.label}>
          {attempt?.mode === "practice"
            ? "Practice · no additional XP or cash credit"
            : "Your lesson"}
        </p>
        <p className={styles.title}>{lesson.title}</p>
        {attempt && !result && (
          <div className={styles.progress}>
            <label htmlFor="lesson-progress">
              {attempt.saved} of {attempt.total} steps saved
            </label>
            <progress
              id="lesson-progress"
              max={attempt.total || 1}
              value={attempt.saved}
            />
            <p>
              Answers save when you check or continue. Finish saves completion
              separately.
            </p>
          </div>
        )}
        {phase === "loading" && <Skeleton label="Loading your saved lesson" />}
        {error && <Alert tone="error">{error}</Alert>}
        {phase === "error" && (
          <div className={styles.actions}>
            {code === "unauthorized" && (
              <ButtonLink
                href={`/login?reason=expired&next=${encodeURIComponent(`/lesson/${lesson.id}`)}`}
              >
                Sign in
              </ButtonLink>
            )}
            {code === "signup_required" && (
              <ButtonLink
                href={`/signup?next=${encodeURIComponent(`/lesson/${lesson.id}`)}`}
              >
                Create an account
              </ButtonLink>
            )}
            {lastRequest.current &&
              ![
                "unauthorized",
                "signup_required",
                "content_issue",
                "content_changed",
                "not_found",
              ].includes(code) && (
                <Button
                  onClick={() => {
                    const retry = lastRequest.current;
                    if (retry)
                      void request(retry.path, retry.body, retry.pending);
                  }}
                >
                  Try saving again
                </Button>
              )}
            <Button
              variant="secondary"
              onClick={() =>
                void request(
                  "/api/lesson/attempt",
                  { lessonId: lesson.id, practice },
                  "loading",
                )
              }
            >
              Reload saved place
            </Button>
            <ButtonLink href={path} variant="secondary">
              Choose another lesson
            </ButtonLink>
          </div>
        )}
        {card && phase !== "error" && (
          <Card className={styles.card}>
            <CardRenderer
              key={card.id}
              card={card}
              selected={selected}
              onSelect={setSelected}
              disabled={busy || phase === "feedback"}
            />
            {card.hint && (
              <details className={styles.hint}>
                <summary>Show a hint</summary>
                <p>{card.hint}</p>
              </details>
            )}
            {speech && (
              <Button variant="quiet" onClick={readAloud}>
                {speaking ? "Stop reading" : "Read aloud"}
              </Button>
            )}
            {speech && (
              <p className={styles.note}>
                Read-aloud starts only when you choose it. It uses your device’s
                speech service; that service may use a network connection.
              </p>
            )}
          </Card>
        )}
        {attempt?.feedback && phase !== "error" && (
          <section className={styles.feedback} role="status">
            <h2>
              {attempt.feedback.correct === null
                ? "Step saved"
                : attempt.feedback.correct
                  ? "That’s right"
                  : "Let’s look at this together"}
            </h2>
            {attempt.feedback.correct === false && (
              <p>Suggested answer: {attempt.feedback.suggestedAnswer}</p>
            )}
            <p>{attempt.feedback.explanation}</p>
          </section>
        )}
        {!card && attempt && !result && phase !== "error" && (
          <Card>
            <h1>Ready to finish</h1>
            <p>
              All {attempt.total} steps are saved. Confirm completion to see
              your result.
            </p>
          </Card>
        )}
        {result && (
          <Card className={styles.complete}>
            <span aria-hidden="true" className={styles.check}>
              ✓
            </span>
            <h1>{result.practice ? "Practice complete" : "Lesson complete"}</h1>
            <p>
              {result.practice
                ? "Your practice activity is saved. Your first completion and earned balance stay unchanged."
                : `${result.xpAwarded} XP confirmed and saved. Incentive approvals still follow your program’s rules.`}
            </p>
            {!result.practice && (
              <p>
                {result.baseXp} base XP × {result.comboMultiplier} +{" "}
                {result.perfectRunBonus} perfect bonus = {result.xpAwarded} XP
              </p>
            )}
            {result.welcomeBack && (
              <p>Welcome back. Your earlier learning is still here.</p>
            )}
            <p>
              {result.streak} learning {result.streak === 1 ? "day" : "days"} in
              your current streak. Breaks are okay.
            </p>
            {!!result.newBadges.length && (
              <p>
                Milestones: {result.newBadges.map((b) => b.label).join(" · ")}
              </p>
            )}
            <div className={styles.actions}>
              {result.next ? (
                <ButtonLink href={`/lesson/${result.next.id}`}>
                  Next: {result.next.title}
                </ButtonLink>
              ) : (
                <ButtonLink href="/practice">Find practice</ButtonLink>
              )}
              <ButtonLink href={path} variant="secondary">
                Back to pathway
              </ButtonLink>
            </div>
          </Card>
        )}
      </main>
      {attempt && !result && phase !== "error" && (
        <footer ref={footerRef} className={styles.footer}>
          <div>
            {card ? (
              phase === "feedback" ? (
                <Button
                  busy={busy}
                  onClick={() =>
                    void request(
                      "/api/lesson/next",
                      { attemptId: attempt.id, cardId: card.id },
                      "next",
                    )
                  }
                >
                  Next step
                </Button>
              ) : (
                <>
                  <Button
                    busy={busy}
                    disabled={
                      (card.kind === "question" || card.kind === "scenario") &&
                      selected === null
                    }
                    disabledReason="Choose an answer before checking."
                    onClick={() => answer()}
                  >
                    {card.kind === "question" || card.kind === "scenario"
                      ? "Check answer"
                      : "Continue"}
                  </Button>
                  {card.kind === "reflection" && (
                    <Button
                      variant="quiet"
                      busy={busy}
                      onClick={() => answer(true)}
                    >
                      Skip reflection
                    </Button>
                  )}
                </>
              )
            ) : (
              <Button
                busy={busy}
                onClick={() =>
                  void request(
                    "/api/progress/complete",
                    { attemptId: attempt.id },
                    "submitting",
                  )
                }
              >
                Finish lesson
              </Button>
            )}
          </div>
        </footer>
      )}
      <Dialog open={exit} title="Take a break?" onClose={() => setExit(false)}>
        <p>
          Checked answers and continued steps are saved to your account.
          Unchecked selections and personal notes are not saved. You can return
          here on another device after signing in.
        </p>
        <div className={styles.actions}>
          <ButtonLink href={path}>Leave lesson</ButtonLink>
          <Button variant="secondary" onClick={() => setExit(false)}>
            Keep learning
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
