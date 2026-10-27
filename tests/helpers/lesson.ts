import { POST as start } from "@/app/api/lesson/attempt/route";
import { POST as answer } from "@/app/api/lesson/answer/route";
import { POST as next } from "@/app/api/lesson/next/route";
import { POST as complete } from "@/app/api/progress/complete/route";
import { makeRequest } from "./request";
import prisma from "@/lib/prisma";
import { assertTestDatabase } from "@/lib/test-database-safety";
export function lessonReq(path: string, token: string, body: unknown) {
  return makeRequest(`http://test/api/${path}`, {
    body,
    cookies: { l2e_user_session: token },
  });
}
export async function readyAttempt(
  token: string,
  lessonId: string,
  wrong = false,
  practice = false,
) {
  await assertTestDatabase(prisma);
  const initial = await start(
    lessonReq("lesson/attempt", token, { lessonId, practice }),
  );
  if (!initial.ok) throw new Error(`Attempt start failed: ${initial.status}`);
  let { attempt } = await initial.json();
  while (attempt.card) {
    const c = attempt.card;
    const raw = await prisma.card.findUniqueOrThrow({ where: { id: c.id } });
    const correct =
      "choices" in c ? c.choices.indexOf(JSON.parse(raw.answerJson!)) : null;
    const response = await answer(
      lessonReq("lesson/answer", token, {
        attemptId: attempt.id,
        cardId: c.id,
        answer:
          correct === null
            ? c.kind === "reflection"
              ? { kind: "reflect", skipped: true }
              : { kind: "acknowledge" }
            : {
                kind: "choice",
                choice: wrong ? (correct + 1) % c.choices.length : correct,
              },
      }),
    );
    if (!response.ok) throw new Error(`Answer failed: ${response.status}`);
    const advanced = await next(
      lessonReq("lesson/next", token, { attemptId: attempt.id, cardId: c.id }),
    );
    if (!advanced.ok) throw new Error(`Advance failed: ${advanced.status}`);
    attempt = (await advanced.json()).attempt;
  }
  return attempt.id as string;
}
export async function finishLesson(token: string, lessonId: string) {
  const attemptId = await readyAttempt(token, lessonId);
  return complete(lessonReq("progress/complete", token, { attemptId }));
}
