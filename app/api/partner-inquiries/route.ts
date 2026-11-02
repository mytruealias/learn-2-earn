import { apiError, apiOk, getClientIp } from "@/lib/api-helpers";
import { sameOriginError } from "@/lib/request-origin";
import { boundedJson } from "@/lib/support/bounded-json";
import {
  inquiryConfiguration,
  inquirySchema,
  inquiryDatabase,
  saveInquiry,
  InquiryIssue,
} from "@/lib/marketing/inquiries";
export async function GET() {
  const c = inquiryConfiguration();
  return apiOk(
    {
      configured: !!c,
      team: c?.team || null,
      monitoring: c?.monitoring || null,
      delivery: "Stored queue only; no automatic email or calendar booking.",
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
export async function POST(req: Request) {
  try {
    const origin = sameOriginError(req);
    if (origin) return origin;
    const raw = await boundedJson(req, 8192);
    if (!raw.ok) return raw.response;
    const p = inquirySchema.safeParse(raw.data);
    if (!p.success)
      return apiError(
        "validation_error",
        "Check your name, organization, email and consent. Keep the optional message to 1,000 characters.",
        400,
        { fields: p.error.flatten().fieldErrors },
      );
    const c = inquiryConfiguration();
    if (!c)
      return apiError(
        "service_unavailable",
        "Online partner intake is not configured. Nothing has been confirmed saved, emailed or booked.",
        503,
      );
    const data = await saveInquiry(
      await inquiryDatabase(),
      p.data,
      c,
      getClientIp(req),
    );
    return apiOk(data, { headers: { "Cache-Control": "private, no-store" } });
  } catch (e) {
    if (e instanceof InquiryIssue)
      return apiError(e.code, e.message, e.status, {
        headers: e.status === 429 ? { "Retry-After": "3600" } : {},
      });
    return apiError(
      "service_unavailable",
      "We could not confirm saving your inquiry. Retry unchanged details with the same request key. No email or booking is confirmed.",
      503,
    );
  }
}
