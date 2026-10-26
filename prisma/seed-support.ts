import type { PrismaClient } from '@prisma/client';

export type AuthoredCard = {
  type: string; order: number; prompt: string; body?: string;
  choicesJson?: string; answerJson?: string; explain?: string; subtype?: string;
};

/** Fill missing slots only. Never delete, replace, reorder or rewrite an existing card. */
export async function addMissingCards(prisma: PrismaClient, lessonId: string, cards: AuthoredCard[]) {
  const existing = await prisma.card.findMany({ where: { lessonId }, select: { order: true } });
  const occupied = new Set(existing.map(c => c.order));
  const additions = cards.filter(c => {
    if (occupied.has(c.order)) return false;
    occupied.add(c.order);
    return true;
  });
  if (additions.length) {
    await prisma.card.createMany({ data: additions.map(c => ({
      ...c, lessonId,
      subtype: c.subtype ?? (c.type === 'INFO' && c.prompt.startsWith('Mission:') ? 'MISSION' :
        c.type === 'INFO' && c.prompt.startsWith('Reflect:') ? 'REFLECTION' : ''),
    })) });
  }
  return additions.length;
}
