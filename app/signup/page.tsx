import { redirect } from "next/navigation";
import AuthFrame from "../components/learner/AuthFrame";
import Journey from "../components/learner/Journey";
import { serverLearner } from "@/lib/learner-server";
import { safeLearnerDestination } from "@/lib/learner-navigation";
export const dynamic = "force-dynamic";
export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = safeLearnerDestination((await searchParams).next);
  const { user } = await serverLearner();
  if (user?.email)
    redirect(
      user.onboardingState === "pending-v1"
        ? `/onboarding?next=${encodeURIComponent(next)}`
        : next,
    );
  return (
    <AuthFrame>
      <Journey mode="signup" next={next} guest={!!user} />
    </AuthFrame>
  );
}
