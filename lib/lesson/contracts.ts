import type { PublicCard } from "./cards";
export type Completion = {
  xpAwarded: number;
  baseXp: number;
  comboMultiplier: number;
  perfectRunBonus: number;
  practice: boolean;
  alreadyCompleted: boolean;
  newBadges: { id: string; label: string }[];
  streak: number;
  welcomeBack: boolean;
  next: { id: string; title: string } | null;
};
export type AttemptView = {
  id: string;
  userId: string;
  mode: "first" | "practice";
  position: number;
  saved: number;
  total: number;
  card: PublicCard | null;
  feedback: {
    correct: boolean | null;
    explanation: string;
    suggestedAnswer: string | null;
    choice: number | null;
  } | null;
  result: Completion | null;
};
