import { apiError, apiOk, apiServerError } from "@/lib/api-helpers";
export const dynamic = "force-dynamic";
export async function GET() {
    try {
        if (!process.env.SESSION_SECRET || !/^[a-fA-F0-9]{64}$/.test(process.env.STAFF_MFA_ENCRYPTION_KEY || ""))
            return apiError("service_unavailable", "Not ready.", 503, { headers: { "Cache-Control": "private, no-store", "Retry-After": "30" } });
        const { default: db } = await import("@/lib/prisma");
        const result = await db.$transaction(async (tx) => {
            await tx.$executeRaw `SET LOCAL statement_timeout = '1500ms'`;
            return tx.$queryRaw<{
                ready: boolean;
            }[]> `SELECT (to_regclass('public."HttpRateLimit"') IS NOT NULL AND to_regclass('public."PartnerInquiry"') IS NOT NULL AND to_regclass('public."LearnerSession"') IS NOT NULL AND to_regclass('public."StaffMembership"') IS NOT NULL AND to_regclass('public."RewardEntry"') IS NOT NULL AND to_regclass('public."LessonAttempt"') IS NOT NULL AND to_regclass('public."SupportUsage"') IS NOT NULL) AS ready`;
        }, { maxWait: 1000, timeout: 2000 });
        if (!result[0]?.ready)
            return apiError("service_unavailable", "Not ready.", 503, { headers: { "Cache-Control": "private, no-store", "Retry-After": "30" } });
        return apiOk({ status: "ready" }, { headers: { "Cache-Control": "private, no-store" } });
    }
    catch (error) {
        const response = await apiServerError("readiness", error);
        return new Response(JSON.stringify({ error: { code: "service_unavailable", message: "Not ready." } }), { status: 503, headers: { "Cache-Control": "private, no-store", "Content-Type": "application/json", "Retry-After": "30", "x-l2e-request-id": response.headers.get("x-l2e-request-id") || "" } });
    }
}
