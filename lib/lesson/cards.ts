import { z } from "zod";
const source = z.object({
  id: z.string().min(1),
  type: z.string(),
  subtype: z.string().default(""),
  prompt: z.string().trim().min(1),
  body: z.string().nullable().optional(),
  choicesJson: z.string().nullable().optional(),
  answerJson: z.string().nullable().optional(),
  explain: z.string().nullable().optional(),
  hint: z.string().nullable().optional(),
});
type Common = {
  id: string;
  prompt: string;
  body: string | null;
  hint: string | null;
};
export type PublicCard = Common &
  (
    | { kind: "teaching"; activity: boolean }
    | { kind: "reflection" }
    | { kind: "question" | "scenario"; choices: string[] }
  );
export type AdaptedCard = {
  public: PublicCard;
  answerIndex: number | null;
  explanation: string | null;
};
export function adaptCard(
  input: unknown,
): { ok: true; card: AdaptedCard } | { ok: false; message: string } {
  const parsed = source.safeParse(input);
  const issue = {
    ok: false as const,
    message:
      "This card needs a content check. Your saved answers are safe. Try again later or choose another lesson.",
  };
  if (!parsed.success) return issue;
  const c = parsed.data;
  if (!["", "MISSION", "REFLECTION"].includes(c.subtype)) return issue;
  const common: Common = {
    id: c.id,
    prompt: c.prompt,
    body: c.body || null,
    hint: c.hint || null,
  };
  if (c.type === "INFO") {
    if (c.choicesJson || c.answerJson) return issue;
    const reflection =
      c.subtype === "REFLECTION" ||
      (!c.subtype && c.prompt.startsWith("Reflect:"));
    return {
      ok: true,
      card: {
        public: reflection
          ? { ...common, kind: "reflection" }
          : {
              ...common,
              kind: "teaching",
              activity:
                c.subtype === "MISSION" || c.prompt.startsWith("Mission:"),
            },
        answerIndex: null,
        explanation: null,
      },
    };
  }
  if (!["MULTIPLE_CHOICE", "TRUE_FALSE", "SCENARIO"].includes(c.type))
    return issue;
  try {
    const choices = z
      .array(z.string().min(1))
      .min(2)
      .max(20)
      .parse(JSON.parse(c.choicesJson || "null"));
    const answer = z.string().parse(JSON.parse(c.answerJson || "null"));
    if (
      new Set(choices).size !== choices.length ||
      !choices.includes(answer) ||
      choices.some((s) => !s.trim())
    )
      return issue;
    if (
      c.type === "TRUE_FALSE" &&
      (choices.length !== 2 ||
        !choices.includes("True") ||
        !choices.includes("False"))
    )
      return issue;
    return {
      ok: true,
      card: {
        public: {
          ...common,
          kind: c.type === "SCENARIO" ? "scenario" : "question",
          choices,
        },
        answerIndex: choices.indexOf(answer),
        explanation:
          c.explain?.trim() ||
          "Look at the suggested answer and the teaching cards. You can keep learning and practice again.",
      },
    };
  } catch {
    return issue;
  }
}
export const answerSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("choice"),
      choice: z.number().int().min(0).max(19),
    })
    .strict(),
  z.object({ kind: z.literal("acknowledge") }).strict(),
  z.object({ kind: z.literal("reflect"), skipped: z.boolean() }).strict(),
]);
export type CardAnswer = z.infer<typeof answerSchema>;
export function evaluate(card: AdaptedCard, answer: CardAnswer) {
  if (card.public.kind === "question" || card.public.kind === "scenario") {
    if (answer.kind !== "choice" || answer.choice >= card.public.choices.length)
      return null;
    return {
      correct: answer.choice === card.answerIndex,
      choice: answer.choice,
      skipped: false,
    };
  }
  if (card.public.kind === "reflection" && answer.kind === "reflect")
    return { correct: null, choice: null, skipped: answer.skipped };
  if (card.public.kind === "teaching" && answer.kind === "acknowledge")
    return { correct: null, choice: null, skipped: false };
  return null;
}
