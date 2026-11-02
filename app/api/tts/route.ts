import { z } from "zod";
import { getUserIdFromRequest, sameOriginError } from "@/lib/user-session";
import { apiError } from "@/lib/api-helpers";
import { boundedJson } from "@/lib/support/bounded-json";
import { supportProvider, requestCancellation } from "@/lib/support/provider";
import { approvedSupportPolicy } from "@/lib/support/policy";
import { reserveSupportUsage, SupportLimit } from "@/lib/support/usage";
export async function POST(req: Request) {
  let release: (() => Promise<void>) | undefined,
    cancel: ReturnType<typeof requestCancellation> | undefined;
  try {
    const origin = sameOriginError(req);
    if (origin) return origin;
    const raw = await boundedJson(req, 12288);
    if (!raw.ok) return raw.response;
    const p = z
      .object({
        expectedAccountId: z.string().min(1).max(120),
        text: z.string().trim().min(1).max(2000),
        consent: z.literal(true),
      })
      .strict()
      .safeParse(raw.data);
    if (!p.success)
      return apiError(
        "validation_error",
        "Use up to 2,000 characters and confirm cloud voice processing.",
        400,
      );
    const id = await getUserIdFromRequest(req);
    if (!id)
      return apiError(
        "unauthorized",
        "Sign in for optional cloud voice. Human help and text remain available.",
        401,
      );
    if (p.data.expectedAccountId !== id)
      return apiError(
        "account_changed",
        "Your signed-in account changed. Reload before using cloud voice.",
        409,
      );
    if (!process.env.OPENAI_API_KEY || !approvedSupportPolicy())
      return apiError(
        "service_unavailable",
        "Cloud voice is unavailable. You can keep reading or use human help.",
        503,
      );
    release = await reserveSupportUsage(id, "tts", p.data.text.length);
    cancel = requestCancellation(req, 20000);
    const speech = await supportProvider().audio.speech.create(
      {
        model: "gpt-4o-mini-tts",
        voice: "alloy",
        input: p.data.text,
        response_format: "mp3",
      },
      { signal: cancel.controller.signal },
    );
    if (!speech.body) throw new Error();
    const reader = speech.body.getReader(),
      free = release,
      resources = cancel;
    let finished = false,
      total = 0;
    async function finish() {
      if (finished) return;
      finished = true;
      resources.controller.abort();
      resources.cleanup();
      await reader.cancel().catch(() => {});
      await free();
    }
    const stream = new ReadableStream<Uint8Array>({
      async pull(controller) {
        try {
          const { done, value } = await reader.read();
          if (resources.controller.signal.aborted) throw new Error();
          if (done) {
            await finish();
            controller.close();
            return;
          }
          total += value.byteLength;
          if (total > 4 * 1024 * 1024) throw new Error();
          controller.enqueue(value);
        } catch {
          controller.error(new Error("Audio interrupted."));
          await finish();
        }
      },
      async cancel() {
        await finish();
      },
    });
    release = undefined;
    cancel = undefined;
    return new Response(stream, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    cancel?.controller.abort();
    cancel?.cleanup();
    await release?.();
    if (e instanceof SupportLimit)
      return apiError("rate_limited", e.message, 429, {
        headers: { "Retry-After": String(e.retryAfter) },
      });
    return apiError(
      "service_unavailable",
      "Audio could not be generated. Text and human-help resources remain available.",
      503,
    );
  }
}
