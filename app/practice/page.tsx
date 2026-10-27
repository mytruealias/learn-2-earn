import { requireLearner } from "@/lib/learner-server";
import Practice from "./Practice";
export const dynamic = "force-dynamic";
export default async function PracticePage() {
  await requireLearner("/practice");
  return <Practice />;
}
