import { redirect } from "next/navigation";
import AuthFrame from "../components/learner/AuthFrame";
import Journey from "../components/learner/Journey";
import { serverLearner } from "@/lib/learner-server";
import { safeLearnerDestination } from "@/lib/learner-navigation";
export const dynamic = "force-dynamic";
export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = safeLearnerDestination((await searchParams).next);
  const { user } = await serverLearner();
  if (!user?.email)
    redirect(`/login?reason=expired&next=${encodeURIComponent(next)}`);
  if (user.onboardingState !== "pending-v1") redirect(next);
  return (
    <AuthFrame>
      <Journey mode="onboarding" next={next} />
    </AuthFrame>
  );
}
