"use client";
import Link from "next/link";
import {
  StaffCollection,
  rowObject,
  shortDate,
} from "../components/StaffTable";
export default function Page() {
  return (
    <StaffCollection
      endpoint="/api/admin/cases"
      title="Support cases"
      priorities
      description="Work from unassigned cases and scheduled follow-ups. Dispatch and allocations record staff activity; they do not contact emergency services."
      allowedRoles={["admin", "caseworker"]}
      statuses={[
        { value: "all", label: "All cases" },
        {
          value: "unacknowledged",
          label: "Support requests awaiting staff acknowledgment",
        },
        { value: "unassigned", label: "Unassigned open cases" },
        { value: "follow-up", label: "Follow-ups due" },
        ...["new", "open", "dispatched", "resolved", "closed"].map((value) => ({
          value,
          label: value[0].toUpperCase() + value.slice(1),
        })),
      ]}
      columns={[
        {
          key: "title",
          label: "Case",
          sort: "name",
          render: (r) => (
            <Link href={`/admin/cases/${r.id}`}>{String(r.title)}</Link>
          ),
        },
        {
          key: "participant",
          label: "Participant",
          render: (r) => (
            <Link href={`/admin/users/${rowObject(r.user).id}`}>
              {String(rowObject(r.user).fullName || "Guest learner")}
            </Link>
          ),
        },
        { key: "status", label: "Status", sort: "status" },
        { key: "priority", label: "Priority" },
        {
          key: "assignee",
          label: "Assigned to",
          render: (r) =>
            String(rowObject(r.assignedTo).fullName || "Unassigned"),
        },
        {
          key: "followUpAt",
          label: "Follow-up",
          render: (r) => shortDate(r.followUpAt),
        },
        {
          key: "updatedAt",
          label: "Last updated",
          sort: "updatedAt",
          render: (r) => shortDate(r.updatedAt),
        },
      ]}
    />
  );
}
