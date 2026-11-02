import { DataTable } from "../admin/components/StaffTable";
import styles from "./marketing/marketing.module.css";
const rows = [
  {
    id: "illustration-01",
    task: "Review a reward request",
    status: "Awaiting staff review",
    meaning: "A request is not an approval or payment.",
  },
  {
    id: "illustration-02",
    task: "Check a program help request",
    status: "No acknowledgment recorded",
    meaning: "A saved case does not notify or dispatch anyone.",
  },
  {
    id: "illustration-03",
    task: "Review learning participation",
    status: "Defined reporting period",
    meaning: "Participation is separate from housing or recovery outcomes.",
  },
];
export default function AdminDemo() {
  return (
    <section
      className={styles.staffPreview}
      aria-label="Illustrative staff workspace"
    >
      <div className={styles.sampleHeader}>
        <span className={styles.eyebrow}>
          Staff workspace · illustrative records
        </span>
        <span>Program scope</span>
      </div>
      <h3>A queue with a clear next decision.</h3>
      <p>
        These fictional tasks illustrate the staff workflow. This is a read-only
        preview with no participant records or real decisions.
      </p>
      <DataTable
        caption="Illustrative staff tasks — no participant data"
        rows={rows}
        columns={[
          { key: "task", label: "Task" },
          { key: "status", label: "Recorded state" },
          { key: "meaning", label: "What it means" },
        ]}
      />
    </section>
  );
}
