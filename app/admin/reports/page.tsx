"use client";
import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAdmin } from "../AdminContext";
import { staffFetch } from "@/lib/staff-fetch";
import { Alert, Button, Card, Skeleton } from "@/app/components/ui";
import { DataTable } from "../components/StaffTable";
import { usd } from "@/lib/rewards/money";
import type { programReport } from "@/lib/staff/reporting";
import styles from "../components/staff.module.css";
type Report = Awaited<ReturnType<typeof programReport>>;
export default function Page() {
  return (
    <Suspense fallback={<Skeleton label="Loading report filters…" />}>
      <Reports />
    </Suspense>
  );
}
function Reports() {
  const { admin } = useAdmin(),
    p = useSearchParams(),
    router = useRouter(),
    path = usePathname(),
    [report, setReport] = useState<Report | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [exporting, setExporting] = useState(false),
    [start, setStart] = useState(
      p.get("start") ||
        new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10),
    ),
    [end, setEnd] = useState(
      p.get("end") || new Date().toISOString().slice(0, 10),
    ),
    [timezone, setTimezone] = useState(p.get("timezone") || "UTC"),
    [retry, setRetry] = useState(0);
  const [initial] = useState({ start, end, timezone });
  const query = new URLSearchParams({
    start: p.get("start") || initial.start,
    end: p.get("end") || initial.end,
    timezone: p.get("timezone") || initial.timezone,
    programId: admin?.programId || "",
  }).toString();
  useEffect(() => {
    const controller = new AbortController();
    setBusy(true);
    setError("");
    staffFetch(`/api/admin/stats/reports?${query}`, {
      signal: controller.signal,
    })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error?.message || "Report unavailable.");
        setReport(d.report);
      })
      .catch((e) => {
        if (!controller.signal.aborted)
          setError(e instanceof Error ? e.message : "Report unavailable.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setBusy(false);
      });
    return () => controller.abort();
  }, [query, retry]);
  async function exportReport() {
    setExporting(true);
    setError("");
    try {
      const r = await staffFetch(
        `/api/admin/stats/reports?${query}&format=csv`,
      );
      if (!r.ok) {
        const d = await r.json();
        throw new Error(d.error?.message || "Export unavailable.");
      }
      const url = URL.createObjectURL(await r.blob()),
        a = document.createElement("a");
      a.href = url;
      a.download = "program-participation-report.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export unavailable.");
    } finally {
      setExporting(false);
    }
  }
  return (
    <section className={styles.page} data-design="staff">
      <header>
        <h1>Program reports</h1>
        <p>
          Learning participation, service activity and recorded payments remain
          separate. These records do not demonstrate causal impact.
        </p>
      </header>
      <form
        className={styles.toolbar}
        onSubmit={(e) => {
          e.preventDefault();
          router.replace(
            `${path}?${new URLSearchParams({ start, end, timezone })}`,
            { scroll: false },
          );
        }}
      >
        <label>
          Program
          <select
            value={admin?.programId || ""}
            disabled
            aria-describedby="program-scope-note"
          >
            <option value={admin?.programId}>{admin?.programName}</option>
          </select>
        </label>
        <label>
          Start date
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            required
          />
        </label>
        <label>
          End date, inclusive
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            required
          />
        </label>
        <label>
          IANA timezone
          <input
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            list="report-timezones"
            required
          />
        </label>
        <datalist id="report-timezones">
          <option value="UTC" />
          <option value="America/Chicago" />
          <option value="America/Denver" />
          <option value="America/Los_Angeles" />
          <option value="America/New_York" />
        </datalist>
        <Button type="submit" busy={busy}>
          Apply report filters
        </Button>
      </form>
      <p id="program-scope-note">
        Reports use your active program. To report on another authorized
        program, use Change program in navigation. Choose up to 366 local
        calendar days.
      </p>
      {error && (
        <Alert tone="error">
          {error}{" "}
          <Button variant="secondary" onClick={() => setRetry((v) => v + 1)}>
            Retry report
          </Button>
        </Alert>
      )}
      {!report ? (
        <Skeleton label="Calculating program metrics…" />
      ) : (
        <>
          <p role="status">
            {busy
              ? "Updating report… Previous results remain visible."
              : `${report.filters.start} through ${report.filters.end} in ${report.filters.timezone}.`}
          </p>
          <div className={styles.grid}>
            <Card>
              <h2>Learning participation</h2>
              <p className={styles.metric}>
                {report.summary.active} / {report.summary.enrolled}
              </p>
              <p>
                {report.summary.participationPercent === null
                  ? "No enrolled denominator"
                  : `${report.summary.participationPercent}% of currently enrolled accounts participated.`}
              </p>
              <p>
                {report.summary.first} first completions ·{" "}
                {report.summary.practice} completed practice sessions
              </p>
              <p>{report.definitions.denominator}</p>
              <p>{report.definitions.participation}</p>
            </Card>
            <Card>
              <h2>Service activity</h2>
              <p className={styles.metric}>{report.summary.services}</p>
              <p>
                {report.summary.quantity} allocated units.{" "}
                {report.summary.cases} support cases created in range.
              </p>
              <p>{report.definitions.service}</p>
            </Card>
            <Card>
              <h2>Recorded incentives paid</h2>
              <p className={styles.metric}>
                {report.summary.paidCents === null
                  ? "Needs reconciliation"
                  : usd(report.summary.paidCents)}
              </p>
              <p>
                {report.summary.paidCount} recorded payments ·{" "}
                {report.summary.paidParticipants} participants
              </p>
              <p>{report.definitions.paid}</p>
              <p>
                {report.summary.legacyPaid} undated completed legacy requests
                excluded (all time).
              </p>
            </Card>
          </div>
          <Card>
            <h2>Daily first completions</h2>
            {report.daily.length ? (
              <DataTable
                rows={report.daily.map((d) => ({ id: d.date, ...d }))}
                columns={[
                  {
                    key: "date",
                    label: `Local date (${report.filters.timezone})`,
                  },
                  { key: "completions", label: "First completions" },
                ]}
                caption="Only dates with recorded first completions appear. Missing dates have no recorded completions in this scope."
              />
            ) : (
              <p>
                No first completions in this range. Practice and service
                activity are reported separately.
              </p>
            )}
          </Card>
          <Card>
            <h2>Definitions and limits</h2>
            <p>{report.definitions.first}</p>
            <p>{report.definitions.practice}</p>
            <p>{report.definitions.outcomes}</p>
            <p>
              Exact query boundaries: {report.filters.startUtc} to{" "}
              {report.filters.endExclusiveUtc} (exclusive). Reports reflect
              records available when calculated.
            </p>
          </Card>
          <p>
            Export contains aggregate counts, exact paid cents, program/filter
            metadata and daily counts. It excludes names, contacts, notes,
            reflections and payment handles.
          </p>
          <Button
            busy={exporting}
            disabled={busy}
            disabledReason="Wait for the filtered report before exporting."
            onClick={exportReport}
          >
            Export authorized report
          </Button>
        </>
      )}
    </section>
  );
}
