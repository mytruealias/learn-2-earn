import { redirect } from "next/navigation";
import AuthFrame from "../components/learner/AuthFrame";
import Journey from "../components/learner/Journey";
import { serverLearner } from "@/lib/learner-server";
import { hasProgramAccess } from "@/lib/access-token";
import { safeLearnerDestination } from "@/lib/learner-navigation";
export const dynamic = "force-dynamic";
export default async function AccessPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = safeLearnerDestination((await searchParams).next);
  const { request, user } = await serverLearner();
  if (user?.email)
    redirect(
      user.onboardingState === "pending-v1"
        ? `/onboarding?next=${encodeURIComponent(next)}`
        : next,
    );
  return (
    <AuthFrame>
      <Journey
        mode="access"
        next={next}
        unlocked={hasProgramAccess(request)}
        guest={!!user}
      />
    </AuthFrame>
  );
}
