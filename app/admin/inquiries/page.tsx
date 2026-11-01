"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { staffFetch } from "@/lib/staff-fetch";
import { useAdmin } from "../AdminContext";
import { DataTable, type StaffRow } from "../components/StaffTable";
import { Button, ErrorState, Skeleton } from "@/app/components/ui";
import styles from "../components/staff.module.css";
export default function Page() {
  const { admin } = useAdmin();
  return (
    <Suspense fallback={<Skeleton label="Loading inquiry queue" />}>
      <Queue key={admin?.programId || "unselected"} />
    </Suspense>
  );
}
function Queue() {
  const { admin } = useAdmin(),
    params = useSearchParams(),
    router = useRouter(),
    page = Math.max(1, Number(params.get("page")) || 1),
    [data, setData] = useState<{
      items: StaffRow[];
      total: number;
      pages: number;
    } | null>(null),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    const c = new AbortController();
    if (admin?.role !== "admin") return;
    staffFetch(`/api/admin/inquiries?page=${page}`, { signal: c.signal })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error?.message || "Queue unavailable.");
        setData(d);
        setError("");
      })
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      });
    return () => c.abort();
  }, [page, retry, admin?.role, admin?.programId]);
  if (admin?.role !== "admin")
    return (
      <ErrorState onRetry={() => window.location.reload()}>
        Program administrator access is required.
      </ErrorState>
    );
  return (
    <section className={styles.page} data-design="staff">
      <h1>Partner inquiries</h1>
      <p>
        Only inquiries routed to your active program appear here. A stored
        receipt is not notification, acknowledgment, a booked meeting or an
        agreement. Follow your team’s actual monitoring and contact-consent
        procedures.
      </p>
      {error && (
        <ErrorState onRetry={() => setRetry((n) => n + 1)}>{error}</ErrorState>
      )}
      {!data && !error ? (
        <Skeleton label="Loading scoped inquiries" />
      ) : (
        data && (
          <>
            <p>
              {data.total} inquiries in this program. Page {page} of{" "}
              {data.pages}.
            </p>
            {data.items.length ? (
              <DataTable
                caption="Private partner inquiries in the active program"
                rows={data.items}
                columns={[
                  { key: "id", label: "Receipt reference" },
                  { key: "organization", label: "Organization" },
                  { key: "fullName", label: "Contact" },
                  { key: "email", label: "Provided email" },
                  { key: "interest", label: "Interest" },
                  {
                    key: "message",
                    label: "Optional context",
                    render: (r) => (
                      <details>
                        <summary>Read submitted context</summary>
                        <p>{String(r.region || "Region not provided")}</p>
                        <p>{String(r.message || "No message provided")}</p>
                        <p>
                          Saved {new Date(String(r.createdAt)).toLocaleString()}
                        </p>
                      </details>
                    ),
                  },
                ]}
              />
            ) : (
              <p>No partner inquiries are stored in this program.</p>
            )}
            <div className={styles.actions}>
              <Button
                variant="secondary"
                disabled={page <= 1}
                disabledReason="This is the first page."
                onClick={() =>
                  router.replace(`/admin/inquiries?page=${page - 1}`)
                }
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                disabled={page >= data.pages}
                disabledReason="There are no more pages."
                onClick={() =>
                  router.replace(`/admin/inquiries?page=${page + 1}`)
                }
              >
                Next
              </Button>
            </div>
          </>
        )
      )}
    </section>
  );
}
