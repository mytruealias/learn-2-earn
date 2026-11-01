"use client";
import { useState, type ComponentType } from "react";
import type { PublicCard } from "@/lib/lesson/cards";
import styles from "./lesson.module.css";
type Props = {
  card: PublicCard;
  headingLevel?: 1 | 2 | 3;
  selected: number | null;
  onSelect: (n: number) => void;
  disabled: boolean;
};
function Prompt({
  level = 1,
  children,
}: {
  level?: 1 | 2 | 3;
  children: React.ReactNode;
}) {
  const Tag = level === 3 ? "h3" : level === 2 ? "h2" : "h1";
  return (
    <Tag id="card-prompt" tabIndex={-1}>
      {children}
    </Tag>
  );
}
function Teaching({ card, headingLevel }: Props) {
  return (
    <>
      <p className={styles.label}>
        {card.kind === "teaching" && card.activity
          ? "Optional activity"
          : "Learn"}
      </p>
      <Prompt level={headingLevel}>{card.prompt}</Prompt>
      {card.body && <p className={styles.body}>{card.body}</p>}
      {card.kind === "teaching" && card.activity && (
        <p className={styles.note}>
          Try this when it feels useful. You do not need to share personal
          information or do the activity to continue.
        </p>
      )}
    </>
  );
}
function Reflection({ card, disabled, headingLevel }: Props) {
  const [text, setText] = useState("");
  return (
    <>
      <p className={styles.label}>Optional reflection</p>
      <Prompt level={headingLevel}>{card.prompt}</Prompt>
      {card.body && <p className={styles.body}>{card.body}</p>}
      <label className={styles.field}>
        A note for yourself (optional)
        <textarea
          value={text}
          disabled={disabled}
          onChange={(e) => setText(e.target.value)}
          maxLength={2000}
          autoComplete="off"
          aria-describedby="reflection-privacy"
        />
      </label>
      <p id="reflection-privacy" className={styles.note}>
        This note stays only on this screen. It is never sent or saved and
        disappears when you leave. You can skip without affecting completion or
        rewards.
      </p>
    </>
  );
}
function Question({ card, selected, onSelect, disabled, headingLevel }: Props) {
  if (!("choices" in card)) return null;
  return (
    <>
      <p className={styles.label}>
        {card.kind === "scenario"
          ? "A decision to consider"
          : "Check your understanding"}
      </p>
      <Prompt level={headingLevel}>{card.prompt}</Prompt>
      {card.body && <p className={styles.body}>{card.body}</p>}
      <fieldset className={styles.choices} disabled={disabled}>
        <legend>Choose one answer</legend>
        {card.choices.map((choice, i) => (
          <label
            key={i}
            className={styles.choice}
            data-selected={selected === i || undefined}
          >
            <input
              type="radio"
              name="lesson-choice"
              checked={selected === i}
              value={i}
              onChange={() => onSelect(i)}
            />
            <span>{choice}</span>
          </label>
        ))}
      </fieldset>
    </>
  );
}
const renderers: Record<PublicCard["kind"], ComponentType<Props>> = {
  teaching: Teaching,
  reflection: Reflection,
  question: Question,
  scenario: Question,
};
export default function CardRenderer(props: Props) {
  const Renderer = renderers[props.card.kind];
  return <Renderer {...props} />;
}
