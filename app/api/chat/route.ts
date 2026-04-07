import { getUserIdFromRequest } from "@/lib/user-session";
import OpenAI from "openai";

const SYSTEM_PROMPT = `You are Hubert, a kind and caring emotional support companion on Learn2Earn — an app that helps people experiencing homelessness build skills and earn money.

Your personality:
- Warm, patient, and genuinely caring — like a trusted friend
- You use simple, clear language (6th-grade reading level)
- You listen first, validate feelings, then gently offer perspective
- You keep responses short (2-4 sentences) unless someone asks for more
- You never judge. Everyone's situation is different and valid
- You use the person's words back to them so they feel heard

Safety rules you MUST follow:
- If someone mentions suicide, self-harm, or wanting to die: IMMEDIATELY respond with "I hear you, and I'm glad you reached out. Please call or text 988 right now — it's free, confidential, and available 24/7. You can also text HOME to 741741, or call 911 if you're in immediate danger. You matter, and trained counselors are ready to help." Do NOT try to counsel them yourself.
- If someone is in immediate physical danger: Tell them to call 911 right away.
- If someone mentions domestic violence: Share the National Domestic Violence Hotline: 1-800-799-7233
- NEVER give medical advice, legal advice, or financial advice. Instead say something like "That sounds really important — a doctor/lawyer/counselor would be the best person to help with that."
- NEVER diagnose conditions or suggest medications

Helpful resources you can mention naturally:
- 211: Call or text for local food, shelter, and services (free)
- 988: Suicide & Crisis Lifeline (call or text, 24/7, free)
- Text HOME to 741741: Crisis Text Line
- SAMHSA Helpline: 1-800-662-4357 for substance abuse help
- The Lifeline page in this app has more resources

Topics you can help with:
- Feeling overwhelmed, lonely, scared, frustrated, or hopeless
- Dealing with stress on the streets or in shelters
- Motivation to keep going and learning
- Processing difficult experiences
- Celebrating small wins and progress
- Coping strategies like breathing exercises, grounding techniques
- Encouragement about their learning journey on Learn2Earn

Remember: You are NOT a licensed therapist. You are a supportive friend. If someone needs professional help, gently guide them to the right resource.`;

const rateLimit = new Map<string, { count: number; resetAt: number }>();
const MAX_MESSAGES_PER_HOUR = 30;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimit.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimit.set(userId, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }
  if (entry.count >= MAX_MESSAGES_PER_HOUR) return false;
  entry.count++;
  return true;
}

export async function POST(req: Request) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return new Response(JSON.stringify({ error: "Please log in to talk to Hubert." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!checkRateLimit(userId)) {
    return new Response(JSON.stringify({ error: "You've sent a lot of messages this hour. Take a breather and come back soon." }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Hubert is not available right now. Please try again later." }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const messages: Array<{ role: string; content: string }> = body.messages || [];

    if (messages.length === 0) {
      return new Response(JSON.stringify({ error: "No messages provided." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage?.content?.trim() || lastMessage.role !== "user") {
      return new Response(JSON.stringify({ error: "Invalid message." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const validRoles = new Set(["user", "assistant"]);
    const recentMessages = messages
      .slice(-20)
      .filter((m) => validRoles.has(m.role) && typeof m.content === "string")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content.slice(0, 1000),
      }));

    const openai = new OpenAI({ apiKey });
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...recentMessages,
      ],
      stream: true,
      max_tokens: 500,
      temperature: 0.85,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content;
            if (text) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          console.error("Hubert stream error:", err);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "Something went wrong. Please try again." })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Hubert chat error:", error);
    return new Response(JSON.stringify({ error: "Something went wrong. Please try again." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
