import { ButtonLink, Card } from "./ui";
import type { recommendLesson } from "@/lib/learning-progression";
import styles from "./learner/home.module.css";
export default function ContinueLearningCard({
  recommendation,
  returning,
}: {
  recommendation: ReturnType<typeof recommendLesson>;
  returning: boolean;
}) {
  if (!recommendation)
    return (
      <Card className={styles.next}>
        <p className={styles.eyebrow}>Your next small step</p>
        <h2>Lessons are on their way</h2>
        <p>
          No lessons are available to start right now. Your saved work stays
          with you.
        </p>
        <ButtonLink href="/lifeline" variant="secondary">
          Find help
        </ButtonLink>
      </Card>
    );
  const { lesson, path, unit, intent, reason } = recommendation;
  return (
    <Card className={styles.next}>
      <p className={styles.eyebrow}>
        {intent === "review"
          ? "Your learning is saved"
          : returning
            ? "Welcome back. Your progress is still here."
            : "Your next small step"}
      </p>
      <h2>{lesson.title}</h2>
      <p className={styles.muted}>
        {path.title} · {unit.title}
      </p>
      <p>
        {lesson.estimatedMinutes > 0
          ? `About ${lesson.estimatedMinutes} minutes`
          : "At your own pace"}
      </p>
      <p className={styles.reason}>{reason}</p>
      <ButtonLink href={`/lesson/${lesson.id}`}>
        {intent === "review"
          ? "Review a lesson"
          : intent === "continue"
            ? "Continue learning"
            : "Start learning"}
      </ButtonLink>
    </Card>
  );
}
