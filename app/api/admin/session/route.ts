import { apiServerError } from "@/lib/api-helpers";
import {
  getAdminFromRequest,
  staffSession,
  adminLogout,
  writeStaffCookie,
  SESSION_COOKIE,
} from "@/lib/admin-auth";
import { readCookie, sameOriginError } from "@/lib/user-session";
import { apiError, apiOk } from "@/lib/api-helpers";
export async function GET(req: Request) {
  try {
    const token = readCookie(req, SESSION_COOKIE),
      s = token ? await staffSession(token) : null;
    if (!s) return apiError("unauthorized", "Sign in again.", 401);
    const admin = await getAdminFromRequest(req);
    if (admin) {
      const { sessionId: _sessionId, ...safe } = admin;
      void _sessionId;
      return apiOk({ authenticated: true, admin: safe });
    }
    return apiOk({
      authenticated: false,
      nextStep: s.admin.mustChangePassword
        ? "password"
        : !s.mfaVerifiedAt
          ? s.admin.mfaConfirmedAt
            ? "verify"
            : "enroll"
          : "program",
    });
  } catch {
    return apiServerError(
      "staff/identity",
      new Error("Staff identity service unavailable."),
    );
  }
}
export async function DELETE(req: Request) {
  try {
    const origin = sameOriginError(req);
    if (origin) return origin;
    const token = readCookie(req, SESSION_COOKIE);
    if (token) await adminLogout(token);
    const res = apiOk();
    writeStaffCookie(res, "");
    return res;
  } catch {
    return apiServerError(
      "staff/identity",
      new Error("Staff identity service unavailable."),
    );
  }
}
