import { ButtonLink, Card } from "./ui";
import styles from "./learner/home.module.css";
export default function ContinueLearningCard({
  next,
  returning,
}: {
  next: { href: string; title: string; pathTitle: string } | null;
  returning: boolean;
}) {
  if (!next)
    return (
      <Card>
        <h2>You’ve reached the end of the available lessons</h2>
        <p>
          Revisit a path below to practice. Your completed work stays saved.
        </p>
      </Card>
    );
  return (
    <Card className={styles.next}>
      <p className={styles.eyebrow}>Your next small step</p>
      <h2>{next.title}</h2>
      <p className={styles.muted}>{next.pathTitle}</p>
      <ButtonLink href={next.href}>
        {returning ? "Continue learning" : "Start learning"}
      </ButtonLink>
    </Card>
  );
}
