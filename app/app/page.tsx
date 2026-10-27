import Link from "next/link";
import prisma from "@/lib/prisma";
import { requireLearner } from "@/lib/learner-server";
import { LEARNING_GOALS } from "@/lib/learner-navigation";
import { BookIcon } from "../components/icons";
import StatsBar from "../components/StatsBar";
import ContinueLearningCard from "../components/ContinueLearningCard";
import { ButtonLink, EmptyState } from "../components/ui";
import styles from "../components/learner/home.module.css";
export const dynamic = "force-dynamic";
export default async function AppHome() {
  const user = await requireLearner("/app");
  const [paths, progress] = await Promise.all([
    prisma.path.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      include: {
        modules: {
          where: { isActive: true },
          orderBy: { order: "asc" },
          include: {
            lessons: {
              where: { isActive: true },
              orderBy: { order: "asc" },
              select: { id: true, title: true },
            },
          },
        },
      },
    }),
    prisma.progress.findMany({
      where: { userId: user.id },
      select: { lessonId: true },
      orderBy: { completedAt: "desc" },
    }),
  ]);
  const completed = new Set(progress.map((p) => p.lessonId));
  const mostRecent = progress
    .map((p) =>
      paths.find((path) =>
        path.modules.some((m) => m.lessons.some((l) => l.id === p.lessonId)),
      ),
    )
    .find(Boolean);
  const ordered = mostRecent
    ? [mostRecent, ...paths.filter((p) => p.id !== mostRecent.id)]
    : paths;
  const next = ordered
    .flatMap((path) =>
      path.modules.flatMap((m) =>
        m.lessons.map((l) => ({ ...l, pathTitle: path.title })),
      ),
    )
    .find((l) => !completed.has(l.id));
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
          Choose a useful skill. Take one short lesson, or pick up where you
          left off.
        </p>
        {goal && <p>Your optional goal: {goal}.</p>}
      </header>
      <div className={styles.summary}>
        <ContinueLearningCard
          next={
            next
              ? {
                  href: `/lesson/${next.id}`,
                  title: next.title,
                  pathTitle: next.pathTitle,
                }
              : null
          }
          returning={progress.length > 0}
        />
        <StatsBar completed={progress.length} totalXp={user.totalXp} />
      </div>
      {!user.email && (
        <aside className={styles.accountNote} aria-label="Keep guest progress">
          <h2>Keep your progress</h2>
          <p>
            Guest work is linked to this browser session. Create an account here
            before switching devices or signing out.
          </p>
          <ButtonLink href="/signup" variant="secondary">
            Save my progress
          </ButtonLink>
        </aside>
      )}
      <section aria-labelledby="paths-title">
        <h2 id="paths-title">Choose a learning path</h2>
        {paths.length ? (
          <ul className={styles.paths}>
            {paths.map((path) => {
              const lessons = path.modules.flatMap((m) => m.lessons),
                done = lessons.filter((l) => completed.has(l.id)).length;
              return (
                <li key={path.id}>
                  <Link href={`/paths/${path.slug}`} className={styles.path}>
                    <span className={styles.icon} aria-hidden="true">
                      <BookIcon size={24} />
                    </span>
                    <div className={styles.pathText}>
                      <h3>{path.title}</h3>
                      <p>{path.description}</p>
                      <div className={styles.counts}>
                        <span>{path.modules.length} units</span>
                        <span>
                          {done} of {lessons.length} lessons complete
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            title="Lessons are on their way"
            action={
              <ButtonLink href="/lifeline" variant="secondary">
                Find help
              </ButtonLink>
            }
          >
            No learning paths are available yet. Your program staff can help you
            choose a next step.
          </EmptyState>
        )}
      </section>
    </main>
  );
}
