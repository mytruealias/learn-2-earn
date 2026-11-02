import { apiOk } from "@/lib/api-helpers";
export const dynamic = "force-dynamic";
export function GET() { return apiOk({ status: "live" }, { headers: { "Cache-Control": "private, no-store" } }); }
