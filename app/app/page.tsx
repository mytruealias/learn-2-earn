import prisma from "@/lib/prisma";
import { requireLearner } from "@/lib/learner-server";
import { publishedPaths } from "@/lib/learning-data";
import { availableLessons, recommendLesson } from "@/lib/learning-progression";
import { LEARNING_GOALS } from "@/lib/learner-navigation";
import { HubertIcon } from "../components/icons";
import ContinueLearningCard from "../components/ContinueLearningCard";
import StatsBar from "../components/StatsBar";
import DailyGoal from "../components/learner/DailyGoal";
import PathExplorer from "../components/learner/PathExplorer";
import { ButtonLink, EmptyState } from "../components/ui";
import styles from "../components/learner/home.module.css";
export const dynamic = "force-dynamic";
export default async function AppHome() {
  const user = await requireLearner("/app");
  const [paths, progress, visits, selections, reviews] = await Promise.all([
    publishedPaths(),
    prisma.progress.findMany({
      where: { userId: user.id },
      select: { lessonId: true, completedAt: true, missedCardIds: true },
      orderBy: { completedAt: "desc" },
    }),
    prisma.lessonVisit.findMany({
      where: { userId: user.id },
      select: { lessonId: true, openedAt: true },
      orderBy: { openedAt: "desc" },
    }),
    prisma.pathSelection.findMany({
      where: { userId: user.id },
      select: { pathId: true },
    }),
    prisma.lessonReview.findMany({
      where: { userId: user.id },
      select: { lessonId: true, missedCardIds: true },
    }),
  ]);
  const currentReview = new Map(
    reviews.map((r) => [r.lessonId, r.missedCardIds]),
  );
  const effectiveProgress = progress.map((p) => ({
    ...p,
    missedCardIds: currentReview.get(p.lessonId) ?? p.missedCardIds,
  }));
  const selected = selections.map((s) => s.pathId),
    done = new Set(progress.map((p) => p.lessonId)),
    available = paths.flatMap(availableLessons),
    count = available.filter((l) => done.has(l.id)).length;
  const recommendation = recommendLesson(
      paths,
      effectiveProgress,
      visits,
      selected,
    ),
    allComplete = available.length > 0 && count === available.length;
  const goal =
    user.learningGoal &&
    LEARNING_GOALS[user.learningGoal as keyof typeof LEARNING_GOALS];
  return (
    <main className={styles.page}>
      <header className={styles.intro}>
        <p className={styles.eyebrow}>
          {user.email ? "Your learning space" : "Exploring as a guest"}
        </p>
        <h1>Learn at your pace</h1>
        <p className={styles.muted}>
          A useful next lesson, or a pathway you choose. There is no deadline to
          come back.
        </p>
      </header>
      <div className={styles.heroGrid}>
        <ContinueLearningCard
          recommendation={recommendation}
          returning={progress.length > 0 || visits.length > 0}
        />
        <aside className={styles.rail}>
          <DailyGoal
            allComplete={allComplete}
            hasAvailable={available.length > 0}
          />
          <div className={styles.guide}>
            <HubertIcon size={42} />
            <div>
              <strong>Small steps count.</strong>
              <p>
                You can take a break and return when you’re ready. Your
                completed learning stays saved.
              </p>
              {goal && <p>Your optional goal: {goal}.</p>}
            </div>
          </div>
        </aside>
      </div>
      <StatsBar
        completed={progress.length}
        totalXp={user.totalXp}
        availableCompleted={count}
        availableTotal={available.length}
        account={!!user.email}
      />
      {!user.email && (
        <aside className={styles.accountNote} aria-label="Keep guest progress">
          <h2>Keep your progress</h2>
          <p>
            Create an account in this browser before switching devices or
            signing out.
          </p>
          <ButtonLink href="/signup" variant="secondary">
            Save my progress
          </ButtonLink>
        </aside>
      )}
      {paths.length ? (
        <PathExplorer
          paths={paths}
          completedIds={[...done]}
          initialSelected={selected}
        />
      ) : (
        <EmptyState
          title="No learning paths are available yet"
          action={
            <ButtonLink href="/lifeline" variant="secondary">
              Find help
            </ButtonLink>
          }
        >
          Your program staff can help you choose a next step. Your saved
          learning history has not been removed.
        </EmptyState>
      )}
    </main>
  );
}
