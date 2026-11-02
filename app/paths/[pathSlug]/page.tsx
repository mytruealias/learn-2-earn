import { notFound } from "next/navigation";
import { requireLearner } from "@/lib/learner-server";
import { publishedPaths } from "@/lib/learning-data";
import { availableLessons } from "@/lib/learning-progression";
import PathLearning from "../../components/PathLearning";
import { ButtonLink } from "../../components/ui";
import { HubertIcon } from "../../components/icons";
import styles from "./path.module.css";
export const dynamic = "force-dynamic";
export default async function PathPage({
  params,
}: {
  params: Promise<{ pathSlug: string }>;
}) {
  const { pathSlug } = await params;
  await requireLearner(`/paths/${pathSlug}`);
  const [path] = await publishedPaths(pathSlug);
  if (!path) notFound();
  const lessons = availableLessons(path),
    minutes = lessons.reduce(
      (sum, l) => sum + Math.max(0, l.estimatedMinutes),
      0,
    );
  return (
    <div data-design="learner" data-ui-shell="learner" className={styles.page}>
      <a className="ds-skip-link" href="#path-content">
        Skip to lessons
      </a>
      <div className={styles.topbar}>
        <ButtonLink href="/app" variant="quiet">
          Back to paths
        </ButtonLink>
      </div>
      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Your learning path</p>
          <h1>{path.title}</h1>
          <p className={styles.description}>{path.description}</p>
          <div className={styles.facts}>
            <span>
              {path.modules.length}{" "}
              {path.modules.length === 1 ? "unit" : "units"}
            </span>
            <span>{lessons.length} available lessons</span>
            {minutes > 0 && <span>About {minutes} minutes total</span>}
          </div>
        </div>
        <aside className={styles.companion} aria-label="A reminder from Hubert">
          <HubertIcon size={42} />
          <div>
            <strong>Small steps count.</strong>
            <p>
              Choose what helps you today. Your completed work stays saved when
              you take a break.
            </p>
          </div>
        </aside>
      </header>
      <main id="path-content" tabIndex={-1} className={styles.content}>
        <PathLearning modules={path.modules} />
      </main>
    </div>
  );
}
