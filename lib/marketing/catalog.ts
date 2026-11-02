export type PublishedCatalog = {
  available: boolean;
  paths: {
    slug: string;
    title: string;
    description: string;
    lessons: number;
  }[];
  pathCount?: number;
  lessonCount?: number;
};
/** Public curriculum only. Never join participants, attempts, answers, cases or rewards. */
export async function publishedCatalog(): Promise<PublishedCatalog> {
  try {
    const { default: db } = await import("../prisma");
    const lessonWhere = {
      isActive: true,
      cards: { some: {} },
      module: { isActive: true, path: { isActive: true } },
    };
    const [pathCount, lessonCount, paths] = await db.$transaction(
      [
        db.path.count({
          where: {
            isActive: true,
            modules: {
              some: {
                isActive: true,
                lessons: { some: { isActive: true, cards: { some: {} } } },
              },
            },
          },
        }),
        db.lesson.count({ where: lessonWhere }),
        db.path.findMany({
          where: {
            isActive: true,
            modules: {
              some: {
                isActive: true,
                lessons: { some: { isActive: true, cards: { some: {} } } },
              },
            },
          },
          orderBy: [{ order: "asc" }, { id: "asc" }],
          take: 6,
          select: {
            slug: true,
            title: true,
            description: true,
            modules: {
              where: { isActive: true },
              select: {
                _count: {
                  select: {
                    lessons: { where: { isActive: true, cards: { some: {} } } },
                  },
                },
              },
            },
          },
        }),
      ],
      { isolationLevel: "RepeatableRead" },
    );
    return {
      available: true,
      pathCount,
      lessonCount,
      paths: paths.map((p) => ({
        slug: p.slug,
        title: p.title,
        description: p.description || "",
        lessons: p.modules.reduce((n, m) => n + m._count.lessons, 0),
      })),
    };
  } catch {
    return { available: false, paths: [] };
  }
}
export const authoredExamples = [
  {
    title: "Stability Basics",
    source: "prisma/seed.ts",
    description: "Planning a day, keeping documents safe and asking for help.",
  },
  {
    title: "Financial Literacy",
    source: "prisma/seed.ts",
    description:
      "Understanding a budget, spending choices and everyday money skills.",
  },
  {
    title: "Addiction & Recovery Foundations",
    source: "prisma/seed-recovery.ts",
    description:
      "Learning about support and recovery. Sensitive content needs qualified review before launch.",
  },
];
