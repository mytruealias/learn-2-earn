import { apiError, apiOk } from "@/lib/api-helpers";
import { supportIntakeMetadata } from "@/lib/support/intake";
import {
  approvedSupportPolicy,
  SUPPORT_POLICY_VERSION,
} from "@/lib/support/policy";
export async function GET(req: Request) {
  try {
    return apiOk(
      {
        ...(await supportIntakeMetadata(req)),
        aiAvailable: !!process.env.OPENAI_API_KEY && approvedSupportPolicy(),
        policyVersion: SUPPORT_POLICY_VERSION,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return apiError(
      "service_unavailable",
      "Program support status could not be checked. Public human-help resources remain available.",
      503,
    );
  }
}
