import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import LessonPlayer from "./LessonPlayer";

export const dynamic = "force-dynamic";

export default async function LessonPage({
  params,
}: {
  params: { lessonId: string };
}) {
  const { lessonId } = await params;

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
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

  return <LessonPlayer lesson={lesson as unknown as Parameters<typeof LessonPlayer>[0]["lesson"]} />;
}
