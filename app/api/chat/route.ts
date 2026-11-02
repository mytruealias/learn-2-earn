import { z } from "zod";
import { getUserIdFromRequest, sameOriginError } from "@/lib/user-session";
import { apiError } from "@/lib/api-helpers";
import { boundedJson } from "@/lib/support/bounded-json";
import { supportProvider, requestCancellation } from "@/lib/support/provider";
import { approvedSupportPolicy, HUBERT_POLICY } from "@/lib/support/policy";
import { reserveSupportUsage, SupportLimit } from "@/lib/support/usage";
const chatSchema = z
  .object({
    expectedAccountId: z.string().min(1).max(120),
    consent: z.literal(true),
    region: z.enum(["US", "other"]).default("US"),
    messages: z
      .array(
        z.discriminatedUnion("role", [
          z
            .object({
              role: z.literal("user"),
              content: z.string().trim().min(1).max(1000),
            })
            .strict(),
          z
            .object({
              role: z.literal("assistant"),
              content: z.string().trim().min(1).max(4000),
            })
            .strict(),
        ]),
      )
      .min(1)
      .max(12),
  })
  .strict()
  .superRefine((d, c) => {
    if (
      d.messages.at(-1)?.role !== "user" ||
      d.messages.reduce((n, m) => n + m.content.length, 0) > 12000
    )
      c.addIssue({
        code: "custom",
        message: "Use a shorter conversation ending with your message.",
      });
  });
export async function POST(req: Request) {
  let release: (() => Promise<void>) | undefined;
  let cancel: ReturnType<typeof requestCancellation> | undefined;
  try {
    const origin = sameOriginError(req);
    if (origin) return origin;
    const body = await boundedJson(req, 49152);
    if (!body.ok) return body.response;
    const parsed = chatSchema.safeParse(body.data);
    if (!parsed.success)
      return apiError(
        "validation_error",
        "Use only user/assistant messages, at most 12 messages and 1,000 characters in your new message. Confirm the privacy choice.",
        400,
      );
    const id = await getUserIdFromRequest(req);
    if (!id)
      return apiError(
        "unauthorized",
        "Sign in to use optional AI chat. Human help remains available without signing in.",
        401,
      );
    if (parsed.data.expectedAccountId !== id)
      return apiError(
        "account_changed",
        "Your signed-in account changed. Reload before sharing this conversation.",
        409,
      );
    if (!process.env.OPENAI_API_KEY || !approvedSupportPolicy())
      return apiError(
        "service_unavailable",
        "Hubert AI is unavailable. Use the human-help options; no program request or emergency alert was sent.",
        503,
      );
    release = await reserveSupportUsage(
      id,
      "chat",
      parsed.data.messages.reduce((n, m) => n + m.content.length, 0),
    );
    cancel = requestCancellation(req);
    const upstream = await supportProvider().chat.completions.create(
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              HUBERT_POLICY +
              `\nThe user selected region: ${parsed.data.region}.`,
          },
          ...parsed.data.messages,
        ],
        stream: true,
        store: false,
        max_tokens: 500,
        temperature: 0.5,
      },
      { signal: cancel.controller.signal },
    );
    const encoder = new TextEncoder(),
      resources = cancel,
      free = release;
    let stopped = false;
    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        let length = 0;
        try {
          for await (const chunk of upstream) {
            if (resources.controller.signal.aborted || stopped)
              throw new Error();
            const text = chunk.choices[0]?.delta?.content;
            if (text) {
              length += text.length;
              if (length > 6000) throw new Error();
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text })}\n\n`),
              );
            }
          }
          if (!stopped && !resources.controller.signal.aborted) {
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          }
        } catch {
          if (!stopped) {
            try {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ error: "This reply was interrupted. It may be incomplete. Human help remains available; no alert was sent." })}\n\n`,
                ),
              );
              controller.close();
            } catch {
              /* Consumer disconnected. */
            }
          }
        } finally {
          resources.controller.abort();
          resources.cleanup();
          await free();
        }
      },
      async cancel() {
        stopped = true;
        resources.controller.abort();
        resources.cleanup();
        await free();
      },
    });
    release = undefined;
    cancel = undefined;
    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "private, no-store, no-transform",
        "X-Accel-Buffering": "no",
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
      "Hubert could not reply. Human help remains available. No staff notification or emergency dispatch occurred.",
      503,
    );
  }
}
