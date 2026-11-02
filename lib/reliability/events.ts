import { routeTemplate } from "./route-template";
import { requestIdFrom } from "./correlation";
export const eventCodes = ["api_failure", "render_failure", "client_error", "client_rejection", "readiness_failure"] as const;
export type EventCode = (typeof eventCodes)[number];
const operations = new Set(["access", "admin/cases/get", "admin/inquiries", "admin/login", "admin/stats", "admin/stats/activity", "admin/stats/trends", "admin/users/get", "api", "application", "audit", "auth/login", "auth/logout", "auth/register", "auth/session", "auth/session-read", "cases/staff", "city-access", "learning-plan/read", "learning-plan/save", "lesson", "program/invitations", "program/reports", "progress/list", "progress/open", "readiness", "rewards", "staff/audit", "staff/cases", "staff/create", "staff/directory", "staff/identity", "staff/membership", "staff/overview", "staff/payouts", "staff/staff", "staff/users", "support/settings", "user/ensure", "user/onboarding", "user/profile"]);
/** Fixed operation/template strings; never log exception, URL, body, user, email, IP or headers. */
export function operationalEvent(code: EventCode, requestId: unknown, operation = "application") {
    const template = routeTemplate(operation);
    const safeOperation = operations.has(operation) ? operation : operation.startsWith("/api/") ? "api" : template !== "/other" ? template : "application";
    const event = { event: code, requestId: requestIdFrom(requestId), operation: safeOperation };
    console.error(JSON.stringify(event));
    return event.requestId;
}
