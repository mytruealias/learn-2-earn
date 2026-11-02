import { availableLessons, pathProgress, type LearningPath } from "./learning-progression";
export type PathSummary = {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    units: number;
    minutes: number;
    progress: ReturnType<typeof pathProgress>;
};
/** Server-side summary: no lesson IDs, curriculum tree, answers or participant completion IDs cross this boundary. */
export function summarizePath(path: LearningPath, completed: Set<string>): PathSummary {
    return { id: path.id, slug: path.slug, title: path.title, description: path.description, units: path.modules.length, minutes: availableLessons(path).reduce((n, lesson) => n + Math.max(0, lesson.estimatedMinutes), 0), progress: pathProgress(path, completed) };
}
