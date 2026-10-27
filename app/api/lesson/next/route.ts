import { z } from "zod";
import { advance, lessonEndpoint, opaqueId } from "@/lib/lesson/engine";
export async function POST(req: Request) {
  return lessonEndpoint(
    req,
    z.object({ attemptId: opaqueId, cardId: opaqueId }).strict(),
    (tx, id, data) => advance(tx, id, data.attemptId, data.cardId),
  );
}
