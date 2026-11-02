import { getAdminFromRequest } from "@/lib/admin-auth";
import { apiError, apiOk, apiServerError, parseQuery } from "@/lib/api-helpers";
import { reportQuery, programReport } from "@/lib/staff/reporting";
import { scopedDb } from "@/lib/program-scope";
import { csvText } from "@/lib/staff/csv";
export async function GET(req: Request) {
  try {
    const a = await getAdminFromRequest(req);
    if (!a) return apiError("unauthorized", "Sign in as staff.", 401);
    const p = parseQuery(
      Object.fromEntries(new URL(req.url).searchParams),
      reportQuery,
    );
    if (!p.ok) return p.response;
    if (p.data.programId && p.data.programId !== a.programId)
      return apiError(
        "forbidden",
        "Select your active authorized program.",
        403,
      );
    const report = await programReport(a, p.data);
    if (p.data.format === "csv") {
      await scopedDb(a).auditLog.create({
        data: {
          adminId: a.id,
          action: "PROGRAM_REPORT_EXPORTED",
          entity: "Report",
          details: JSON.stringify(report.filters),
        },
      });
      const s = report.summary;
      return new Response(
        csvText([
          ["Program", a.programName],
          ["Local start", p.data.start],
          ["Local end inclusive", p.data.end],
          ["Timezone", p.data.timezone],
          ["Metric", "Value", "Definition"],
          [
            "Current enrolled denominator",
            s.enrolled,
            report.definitions.denominator,
          ],
          [
            "Participating accounts",
            s.active,
            report.definitions.participation,
          ],
          [
            "Participation percent",
            s.participationPercent,
            report.definitions.participation,
          ],
          ["First completions", s.first, report.definitions.first],
          ["Practice sessions", s.practice, report.definitions.practice],
          ["Service allocations", s.services, report.definitions.service],
          ["Allocated quantity", s.quantity, report.definitions.service],
          ["Cases created", s.cases, "Support cases created in range"],
          ["Paid exact cents", s.paidCents, report.definitions.paid],
          ["Recorded payments", s.paidCount, report.definitions.paid],
          ["Paid participants", s.paidParticipants, report.definitions.paid],
          [
            "Undated completed legacy requests",
            s.legacyPaid,
            "All time; excluded from dated payment metrics",
          ],
          [
            "Self-reported outcomes",
            "Not collected",
            report.definitions.outcomes,
          ],
          [],
          ["Local date", "First completions"],
          ...report.daily.map((d) => [d.date, d.completions]),
        ]),
        {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition":
              "attachment; filename=program-participation-report.csv",
            "Cache-Control": "private, no-store",
          },
        },
      );
    }
    return apiOk(
      { report },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return apiServerError("program/reports", e);
  }
}
