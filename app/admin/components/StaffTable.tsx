"use client";
import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { staffFetch } from "@/lib/staff-fetch";
import { Alert, Button, ErrorState, Skeleton } from "@/app/components/ui";
import { useAdmin } from "../AdminContext";
import styles from "./staff.module.css";
export type StaffRow = Record<string, unknown> & { id: string };
export interface StaffColumn {
  key: string;
  label: string;
  sort?: "name" | "status" | "createdAt" | "updatedAt";
  render?: (row: StaffRow) => ReactNode;
}
export function DataTable({
  rows,
  columns,
  caption,
  busy = false,
}: {
  rows: StaffRow[];
  columns: StaffColumn[];
  caption: string;
  busy?: boolean;
}) {
  return (
    <table className={styles.table} aria-busy={busy} role="table">
      <caption>{caption}</caption>
      <thead role="rowgroup">
        <tr role="row">
          {columns.map((c) => (
            <th scope="col" role="columnheader" key={c.key}>
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody role="rowgroup">
        {rows.map((r) => (
          <tr role="row" key={r.id}>
            {columns.map((c) => (
              <td role="cell" data-label={c.label} key={c.key}>
                {c.render ? c.render(r) : String(r[c.key] ?? "—")}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
type Props = {
  endpoint: string;
  title: string;
  description: string;
  columns: StaffColumn[];
  statuses?: { value: string; label: string }[];
  categories?: { value: string; label: string }[];
  priorities?: boolean;
  allowedRoles?: string[];
  children?: ReactNode;
  refresh?: number;
};
export function StaffCollection(props: Props) {
  return (
    <Suspense
      fallback={<Skeleton label={`Loading ${props.title.toLowerCase()}…`} />}
    >
      <Collection {...props} />
    </Suspense>
  );
}
function Collection({
  endpoint,
  title,
  description,
  columns,
  statuses,
  categories,
  priorities,
  allowedRoles,
  children,
  refresh = 0,
}: Props) {
  const { admin } = useAdmin(),
    params = useSearchParams(),
    router = useRouter(),
    pathname = usePathname();
  const [rows, setRows] = useState<StaffRow[] | null>(null),
    [total, setTotal] = useState(0),
    [pages, setPages] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0),
    [search, setSearch] = useState(params.get("search") || ""),
    [exporting, setExporting] = useState(false);
  const sequence = useRef(0),
    q = params.toString(),
    page = Math.max(1, Number(params.get("page")) || 1),
    permitted = !!admin && (!allowedRoles || allowedRoles.includes(admin.role));
  function change(values: Record<string, string>) {
    const next = new URLSearchParams(q);
    for (const [k, v] of Object.entries(values)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    router.replace(`${pathname}?${next}`, { scroll: false });
  }
  useEffect(() => {
    setSearch(params.get("search") || "");
  }, [params]);
  useEffect(() => {
    if (!permitted) return;
    const id = ++sequence.current,
      controller = new AbortController();
    setBusy(true);
    setError("");
    staffFetch(`${endpoint}?${q}`, { signal: controller.signal })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok)
          throw new Error(d.error?.message || "Records could not be loaded.");
        if (id === sequence.current) {
          setRows(d.rows);
          setTotal(d.pagination.total);
          setPages(d.pagination.totalPages);
        }
      })
      .catch((e) => {
        if (!controller.signal.aborted && id === sequence.current)
          setError(
            e instanceof Error ? e.message : "Records could not be loaded.",
          );
      })
      .finally(() => {
        if (id === sequence.current) setBusy(false);
      });
    return () => controller.abort();
  }, [endpoint, q, retry, permitted, refresh]);
  async function exportRows() {
    setExporting(true);
    setError("");
    try {
      const p = new URLSearchParams(q);
      p.set("format", "csv");
      const r = await staffFetch(`${endpoint}?${p}`);
      if (!r.ok) {
        const d = await r.json();
        throw new Error(d.error?.message || "Export failed.");
      }
      const url = URL.createObjectURL(await r.blob()),
        a = document.createElement("a");
      a.href = url;
      a.download = `${title.toLowerCase().replaceAll(" ", "-")}-program.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed.");
    } finally {
      setExporting(false);
    }
  }
  if (!permitted)
    return (
      <ErrorState onRetry={() => window.location.reload()}>
        Your role cannot open this program workspace. Ask your program
        administrator to review your membership.
      </ErrorState>
    );
  return (
    <section className={styles.page} data-design="staff">
      <header>
        <p className={styles.eyebrow}>
          {admin?.programName} · {admin?.organizationName}
        </p>
        <h1>{title}</h1>
        <p>{description}</p>
      </header>
      {children}
      <form
        className={styles.toolbar}
        onSubmit={(e) => {
          e.preventDefault();
          change({ search, page: "1" });
        }}
      >
        <label>
          Search
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            maxLength={200}
          />
        </label>
        {statuses && (
          <label>
            Status
            <select
              value={params.get("status") || "all"}
              onChange={(e) => change({ status: e.target.value, page: "1" })}
            >
              {statuses.map((s) => (
                <option value={s.value} key={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        )}
        {categories && (
          <label>
            Category
            <select
              value={params.get("category") || "all"}
              onChange={(e) => change({ category: e.target.value, page: "1" })}
            >
              {categories.map((c) => (
                <option value={c.value} key={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
        )}
        {priorities && (
          <label>
            Priority
            <select
              value={params.get("priority") || "all"}
              onChange={(e) => change({ priority: e.target.value, page: "1" })}
            >
              <option value="all">All priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </label>
        )}
        <label>
          Sort by
          <select
            value={params.get("sort") || "createdAt"}
            onChange={(e) => change({ sort: e.target.value, page: "1" })}
          >
            <option value="createdAt">Created date</option>
            {[...new Set(columns.map((c) => c.sort).filter(Boolean))]
              .filter((s) => s !== "createdAt")
              .map((s) => (
                <option value={s} key={s}>
                  {s === "name"
                    ? "Name / title"
                    : s === "status"
                      ? "Status"
                      : "Last updated"}
                </option>
              ))}
          </select>
        </label>
        <label>
          Order
          <select
            value={params.get("direction") || "desc"}
            onChange={(e) => change({ direction: e.target.value, page: "1" })}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </label>
        <Button type="submit" variant="secondary">
          Search
        </Button>
        <Button
          variant="quiet"
          onClick={() => router.replace(pathname, { scroll: false })}
        >
          Clear filters
        </Button>
      </form>
      {error && (
        <Alert tone="error">
          {error}{" "}
          <Button variant="quiet" onClick={() => setRetry((v) => v + 1)}>
            Retry
          </Button>
        </Alert>
      )}
      {rows === null ? (
        error ? (
          <p>No records were loaded. Retry when the connection is ready.</p>
        ) : (
          <Skeleton label={`Loading ${title.toLowerCase()}…`} />
        )
      ) : (
        <>
          <p role="status">
            {busy
              ? "Updating records… Previous results stay visible."
              : `${total} matching records in this program.`}
          </p>
          {rows.length ? (
            <DataTable
              rows={rows}
              columns={columns}
              busy={busy}
              caption={`${title}: page ${page}. ${params.get("sort") || "created date"}, ${params.get("direction") || "descending"}.`}
            />
          ) : (
            <div className={styles.empty}>
              <h2>No matching records</h2>
              <p>
                Try a different search or clear filters. No records were
                changed.
              </p>
            </div>
          )}
          <nav className={styles.pager} aria-label={`${title} pages`}>
            <Button
              variant="secondary"
              disabled={busy || page <= 1}
              disabledReason="This is the first page, or records are updating."
              onClick={() => change({ page: String(page - 1) })}
            >
              Previous
            </Button>
            <span>
              Page {page} of {Math.max(1, pages)}
            </span>
            <Button
              variant="secondary"
              disabled={busy || page >= pages}
              disabledReason="There are no more pages, or records are updating."
              onClick={() => change({ page: String(page + 1) })}
            >
              Next
            </Button>
          </nav>
          <p>
            Export includes all matching records in{" "}
            <strong>{admin?.programName}</strong>, up to 5,000, with private
            contact and free-text fields excluded.
          </p>
          <Button
            variant="quiet"
            busy={exporting}
            disabled={busy || total === 0}
            disabledReason="Load matching records before exporting."
            onClick={exportRows}
          >
            Export filtered records
          </Button>
        </>
      )}
    </section>
  );
}
export const shortDate = (value: unknown) =>
  typeof value === "string" ? new Date(value).toLocaleString() : "—";
export const rowObject = (value: unknown) =>
  (value && typeof value === "object"
    ? value
    : ({} as Record<string, unknown>)) as Record<string, unknown>;
