import { z } from "zod";
import { adminLogin, writeStaffCookie } from "@/lib/admin-auth";
import { sameOriginError } from "@/lib/user-session";
import { staffThrottle } from "@/lib/staff-security";
import {
  apiError,
  apiOk,
  apiServerError,
  parseJson,
  getClientIp,
} from "@/lib/api-helpers";
const schema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(255),
    password: z.string().min(1).max(200),
  })
  .strict();
export async function POST(req: Request) {
  try {
    const origin = sameOriginError(req);
    if (origin) return origin;
    if (!(await staffThrottle(`password-ip:${getClientIp(req)}`, 20)))
      return apiError(
        "rate_limited",
        "Please wait 15 minutes before trying again.",
        429,
      );
    const p = await parseJson(req, schema);
    if (!p.ok) return p.response;
    const result = await adminLogin(p.data.email, p.data.password);
    if (!result.success) return apiError("unauthorized", result.error, 401);
    const res = apiOk({ nextStep: result.nextStep });
    writeStaffCookie(res, result.token);
    return res;
  } catch {
    return apiServerError(
      "admin/login",
      new Error("Staff sign-in could not be confirmed."),
    );
  }
}
