// Authoring types for recovery curriculum expansion cards.
//
// Each path file exports a map keyed by "moduleSlug/lessonSlug" so cards are
// attached to the right lesson even when two modules reuse a lesson slug.
//
// Authors write plain `choices`/`answer` values; the seeder serializes them to
// the `choicesJson`/`answerJson` columns. Existing cards are never modified or
// deleted, so learner progress and card IDs are preserved.

export type ExpansionCardType = "INFO" | "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SCENARIO";

export type ExpansionCard = {
  type: ExpansionCardType;
  /** Must be unique within the lesson and must not collide with existing card orders. */
  order: number;
  prompt: string;
  body?: string;
  /** Required for MULTIPLE_CHOICE, TRUE_FALSE, and SCENARIO cards. */
  choices?: string[];
  /** Required for MULTIPLE_CHOICE, TRUE_FALSE, and SCENARIO cards. Must be one of `choices`. */
  answer?: string;
  /** Required for every non-INFO card: the supportive "here's why" shown after answering. */
  explain?: string;
};

/** Keyed by `${moduleSlug}/${lessonSlug}`. */
export type PathExpansion = Record<string, ExpansionCard[]>;
