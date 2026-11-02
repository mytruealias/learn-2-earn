import { z } from "zod";
import { lessonEndpoint, opaqueId, startAttempt } from "@/lib/lesson/engine";
export async function POST(req: Request) {
  return lessonEndpoint(
    req,
    z.object({ lessonId: opaqueId, practice: z.boolean().optional() }).strict(),
    (tx, id, data) =>
      startAttempt(tx, id, data.lessonId, data.practice || false),
  );
}
