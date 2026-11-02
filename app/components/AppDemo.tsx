"use client";
import { useEffect, useRef, useState } from "react";
import CardRenderer from "../lesson/[lessonId]/CardRenderers";
import { adaptCard, evaluate, type AdaptedCard } from "@/lib/lesson/cards";
import { Alert, Button, ButtonLink } from "./ui";
import lessonStyles from "../lesson/[lessonId]/lesson.module.css";
import styles from "./marketing/marketing.module.css";
const source = [
  {
    id: "fictional-teach",
    type: "INFO",
    prompt: "Make room for one small step",
    body: "Alex has a busy afternoon. Rather than solve everything at once, Alex chooses one useful action that can fit into the day.",
  },
  {
    id: "fictional-question",
    type: "MULTIPLE_CHOICE",
    prompt: "What could Alex try next?",
    choicesJson: JSON.stringify([
      "Choose one manageable action and a time to try it",
      "Wait until every problem can be solved at once",
    ]),
    answerJson: JSON.stringify(
      "Choose one manageable action and a time to try it",
    ),
    explain:
      "A small, specific action can make a plan easier to begin. Alex can adjust it if the day changes.",
  },
  {
    id: "fictional-reflect",
    type: "INFO",
    subtype: "REFLECTION",
    prompt: "What might make a small step easier?",
    body: "You may think about this, write a note on this screen or skip. Please do not enter personal or participant information.",
  },
];
const cards = source
  .map((s) => adaptCard(s))
  .filter((r): r is { ok: true; card: AdaptedCard } => r.ok)
  .map((r) => r.card);
export default function AppDemo() {
  const [index, setIndex] = useState(0),
    [selected, setSelected] = useState<number | null>(null),
    [checked, setChecked] = useState(false),
    [done, setDone] = useState(false),
    focus = useRef<HTMLDivElement>(null),
    card = cards[index];
  useEffect(() => {
    if (index > 0)
      focus.current
        ?.querySelector<HTMLElement>("#card-prompt")
        ?.focus({ preventScroll: true });
  }, [index]);
  function next() {
    if (index + 1 === cards.length) setDone(true);
    else {
      setIndex((n) => n + 1);
      setSelected(null);
      setChecked(false);
    }
  }
  const result =
    card?.public.kind === "question" && selected !== null
      ? evaluate(card, { kind: "choice", choice: selected })
      : null;
  return (
    <section
      className={styles.sample}
      aria-label="Fictional sample lesson"
      data-marketing-preview
    >
      <div className={styles.sampleHeader}>
        <span className={styles.eyebrow}>Sample lesson · fictional Alex</span>
        <span>No account needed</span>
      </div>
      <h2 className={styles.previewTitle}>Try a small learning step</h2>
      <p className={styles.small}>
        Explore three fictional learning steps. Nothing is submitted or saved;
        this sample creates no real progress, XP or rewards.
      </p>
      {done ? (
        <div className={styles.sampleComplete} role="status">
          <h3>One small step, explored.</h3>
          <p>
            You have tried a teaching card, a question and an optional reflection.
            This fictional sample has not saved progress or earned a reward.
          </p>
          <div className={styles.actions}>
            <Button
              onClick={() => {
                setDone(false);
                setIndex(0);
                setSelected(null);
                setChecked(false);
              }}
            >
              Try the sample again
            </Button>
            <ButtonLink variant="secondary" href="/#contact">
              Discuss your program
            </ButtonLink>
          </div>
        </div>
      ) : (
        <>
          <div className={lessonStyles.progress}>
            <label htmlFor="sample-progress">
              Sample step {index + 1} of {cards.length}
            </label>
            <progress
              id="sample-progress"
              max={cards.length}
              value={index + 1}
            />
          </div>
          <div ref={focus} className={lessonStyles.card} data-sample-cards>
            <CardRenderer
              key={card.public.id}
              card={card.public}
              selected={selected}
              onSelect={setSelected}
              disabled={checked}
              headingLevel={3}
            />
          </div>
          {checked && (
            <Alert tone={result?.correct ? "success" : "info"}>
              {result?.correct
                ? "That is a manageable next step. "
                : "A different approach to consider: "}
              {card.explanation}
            </Alert>
          )}
          <div className={styles.sampleAction}>
            {card.public.kind === "question" && !checked ? (
              <Button
                disabled={selected === null}
                disabledReason="Choose an answer to see the explanation."
                onClick={() => setChecked(true)}
              >
                Check answer
              </Button>
            ) : (
              <Button onClick={next}>
                {card.public.kind === "reflection"
                  ? "Finish sample (reflection optional)"
                  : checked
                    ? "Next step"
                    : "Continue sample"}
              </Button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
