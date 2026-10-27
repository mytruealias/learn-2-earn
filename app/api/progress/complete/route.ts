import { z } from "zod";
import { completeAttempt, lessonEndpoint, opaqueId } from "@/lib/lesson/engine";
// Legacy claims (userId, lessonId, comboBonus, perfectRun, score, time) are rejected.
export async function POST(req: Request) {
  return lessonEndpoint(
    req,
    z.object({ attemptId: opaqueId }).strict(),
    (tx, id, data) => completeAttempt(tx, id, data.attemptId),
  );
}
