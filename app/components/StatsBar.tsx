import Link from "next/link";
import styles from "./learner/home.module.css";
export default function StatsBar({
  completed,
  totalXp,
  availableCompleted,
  availableTotal,
  account,
}: {
  completed: number;
  totalXp: number;
  availableCompleted: number;
  availableTotal: number;
  account: boolean;
}) {
  return (
    <section aria-label="Saved learning and rewards" className={styles.stats}>
      <div>
        <p className={styles.eyebrow}>Your learning stays saved</p>
        <p>
          {availableTotal ? (
            <>
              <strong>
                {availableCompleted} of {availableTotal}
              </strong>{" "}
              available lessons complete
            </>
          ) : (
            "No lessons are ready to start right now."
          )}
        </p>
        <p className={styles.fine}>
          {completed} lessons saved across your learning history.
        </p>
      </div>
      <div>
        <p>
          <strong>{totalXp} XP</strong> earned
        </p>
        <Link href={account ? "/profile?tab=earnings" : "/signup"}>
          {account
            ? "View rewards and payout information"
            : "Keep guest progress in an account"}
        </Link>
        <p className={styles.fine}>
          Incentives depend on program rules and approval.
        </p>
      </div>
    </section>
  );
}
