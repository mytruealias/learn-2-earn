import prisma from "./prisma";
import type { LearningPath } from "./learning-progression";
export const activeLessonWhere = {
  isActive: true,
  module: { isActive: true, path: { isActive: true } },
};
export async function publishedPaths(slug?: string): Promise<LearningPath[]> {
  const paths = await prisma.path.findMany({
    where: { isActive: true, ...(slug ? { slug } : {}) },
    orderBy: [{ order: "asc" }, { id: "asc" }],
    include: {
      modules: {
        where: { isActive: true },
        orderBy: [{ order: "asc" }, { id: "asc" }],
        include: {
          lessons: {
            where: { isActive: true },
            orderBy: [{ order: "asc" }, { id: "asc" }],
            select: {
              id: true,
              title: true,
              order: true,
              xpReward: true,
              estimatedMinutes: true,
              lessonType: true,
              _count: { select: { cards: true } },
            },
          },
        },
      },
    },
  });
  return paths.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    description: p.description,
    icon: p.icon,
    modules: p.modules.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      order: m.order,
      lessons: m.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        order: l.order,
        xpReward: l.xpReward,
        estimatedMinutes: l.estimatedMinutes,
        lessonType: l.lessonType,
        available: l._count.cards > 0,
      })),
    })),
  }));
}
