import styles from "./learner/home.module.css";
export default function StatsBar({
  completed,
  totalXp,
}: {
  completed: number;
  totalXp: number;
}) {
  return (
    <dl className={styles.stats}>
      <div>
        <dt>Lessons completed</dt>
        <dd>{completed}</dd>
      </div>
      <div>
        <dt>XP earned</dt>
        <dd>{totalXp}</dd>
      </div>
    </dl>
  );
}
