import { z } from "zod";
import OpenAI from "openai";
import { getUserIdFromRequest } from "@/lib/user-session";
import { apiError, apiServerError, parseJson, createRateLimiter } from "@/lib/api-helpers";

const ttsLimiter = createRateLimiter({ max: 120, windowMs: 60 * 60 * 1000 });

const Schema = z.object({
  text: z.string().trim().min(1, "Text is required.").max(2000, "Text is too long."),
});

export async function POST(req: Request) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return apiError("unauthorized", "Please log in to use Hubert's voice.", 401);
  }

  const gate = ttsLimiter.check(userId);
  if (!gate.allowed) {
    return apiError(
      "rate_limited",
      "You've used Hubert's voice a lot this hour. Take a break and come back soon.",
      429,
      { headers: { "Retry-After": String(gate.retryAfterSec) } },
    );
  }
  ttsLimiter.record(userId);

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return apiError("service_unavailable", "Hubert's voice is not available right now.", 503);
  }

  const parsed = await parseJson(req, Schema);
  if (!parsed.ok) return parsed.response;
  const { text } = parsed.data;

  try {
    const openai = new OpenAI({ apiKey });
    const speech = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "alloy",
      input: text,
      response_format: "mp3",
    });

    const body = speech.body;
    if (!body) {
      return apiError("service_unavailable", "Hubert's voice is not available right now.", 503);
    }

    return new Response(body, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return apiServerError("tts", error);
  }
}
