import { requireLearner } from "@/lib/learner-server";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { activeLessonWhere } from "@/lib/learning-data";
import { ButtonLink, Card } from "@/app/components/ui";
import LessonPlayer from "./LessonPlayer";

export const dynamic = "force-dynamic";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  await requireLearner(`/lesson/${lessonId}`);

  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, ...activeLessonWhere },
    include: {
      cards: {
        orderBy: { order: "asc" },
      },
      module: {
        include: {
          path: {
            include: {
              modules: {
                where: { isActive: true },
                orderBy: { order: "asc" },
                include: {
                  lessons: {
                    where: { isActive: true },
                    orderBy: { order: "asc" },
                    select: { id: true, title: true, order: true },
                  },
                },
              },
            },
          },
          lessons: {
            where: { isActive: true },
            orderBy: { order: "asc" },
            select: { id: true, title: true, order: true },
          },
        },
      },
    },
  });

  if (!lesson) {
    notFound();
  }

  if (!lesson.cards.length)
    return (
      <main
        data-design="learner"
        style={{ maxWidth: "40rem", margin: "2rem auto", padding: "1rem" }}
      >
        <Card>
          <h1>This lesson is being prepared</h1>
          <p>
            The learning content is not ready yet. Choose another lesson. Your
            saved progress has not changed.
          </p>
          <ButtonLink href={`/paths/${lesson.module.path.slug}`}>
            Choose another lesson
          </ButtonLink>
          <ButtonLink href="/lifeline" variant="quiet">
            Help
          </ButtonLink>
        </Card>
      </main>
    );
  return (
    <LessonPlayer
      lesson={lesson as unknown as Parameters<typeof LessonPlayer>[0]["lesson"]}
    />
  );
}
