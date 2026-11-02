"use client";
import {
  StaffCollection,
  rowObject,
  shortDate,
} from "../components/StaffTable";
export default function Page() {
  return (
    <StaffCollection
      endpoint="/api/admin/audit"
      title="Audit trail"
      description="Chronological actions in your active program. Global authentication events and unassigned legacy records remain restricted to verified platform operations. Free-text details and IP addresses are excluded from this list and exports."
      allowedRoles={["admin"]}
      columns={[
        {
          key: "createdAt",
          label: "Recorded time",
          sort: "createdAt",
          render: (r) => shortDate(r.createdAt),
        },
        { key: "action", label: "Action" },
        { key: "entity", label: "Record type" },
        { key: "entityId", label: "Record ID" },
        {
          key: "actor",
          label: "Staff",
          render: (r) =>
            String(rowObject(r.admin).fullName || "System / participant"),
        },
      ]}
    />
  );
}
