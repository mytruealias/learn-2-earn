import { requireLearner } from "@/lib/learner-server";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { activeLessonWhere } from "@/lib/learning-data";
import { ButtonLink, Card } from "@/app/components/ui";
import LessonPlayer from "./LessonPlayer";

export const dynamic = "force-dynamic";

export default async function LessonPage({
  params,
  searchParams,
}: {
  params: Promise<{ lessonId: string }>;
  searchParams: Promise<{ practice?: string }>;
}) {
  const { lessonId } = await params;
  const query = await searchParams;
  await requireLearner(`/lesson/${lessonId}`);

  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, ...activeLessonWhere },
    include: {
      cards: { select: { id: true } },
      module: { include: { path: { select: { slug: true, title: true } } } },
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
      lesson={{
        id: lesson.id,
        title: lesson.title,
        pathSlug: lesson.module.path.slug,
        pathTitle: lesson.module.path.title,
      }}
      practice={query.practice === "1"}
    />
  );
}
