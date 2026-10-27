import { z } from "zod";
import { answerSchema } from "@/lib/lesson/cards";
import { lessonEndpoint, opaqueId, saveAnswer } from "@/lib/lesson/engine";
export async function POST(req: Request) {
  return lessonEndpoint(
    req,
    z
      .object({ attemptId: opaqueId, cardId: opaqueId, answer: answerSchema })
      .strict(),
    (tx, id, data) =>
      saveAnswer(tx, id, data.attemptId, data.cardId, data.answer),
  );
}
