"use client";
import Link from "next/link";
import {
  StaffCollection,
  rowObject,
  shortDate,
} from "../components/StaffTable";
import { useAdmin } from "../AdminContext";
export default function Page() {
  const { admin } = useAdmin();
  return (
    <StaffCollection
      endpoint="/api/admin/users"
      title="Participants"
      description="Find a participant, review learning and consent, or open their authorized support and reward history."
      statuses={[
        { value: "all", label: "All accounts" },
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ]}
      columns={[
        {
          key: "fullName",
          label: "Participant",
          sort: "name",
          render: (r) => (
            <Link href={`/admin/users/${r.id}`}>
              {String(r.fullName || "Guest learner")}
            </Link>
          ),
        },
        { key: "caseNumber", label: "Case number" },
        {
          key: "isActive",
          label: "Account",
          render: (r) => (r.isActive ? "Active" : "Inactive"),
        },
        {
          key: "lessons",
          label: "First completions",
          render: (r) => String(rowObject(r._count).progress ?? 0),
        },
        { key: "totalXp", label: "Lifetime XP record" },
        {
          key: "consentGiven",
          label: "Consent",
          render: (r) =>
            admin?.role === "finance"
              ? "Restricted to support staff"
              : r.consentGiven
                ? "Recorded; review detail"
                : "No general consent recorded",
        },
        {
          key: "createdAt",
          label: "Joined",
          sort: "createdAt",
          render: (r) => shortDate(r.createdAt),
        },
      ]}
    />
  );
}
