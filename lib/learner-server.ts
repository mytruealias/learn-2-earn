import { headers } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "./prisma";
import { getUserIdFromRequest, readCookie } from "./user-session";
import { safeLearnerDestination } from "./learner-navigation";
export async function serverLearner() {
  const request = new Request("http://learner.internal", {
    headers: await headers(),
  });
  const id = await getUserIdFromRequest(request);
  const user = id
    ? await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          fullName: true,
          totalXp: true,
          onboardingState: true,
          learningGoal: true,
        },
      })
    : null;
  return { request, user };
}
export async function requireLearner(next: string) {
  const { request, user } = await serverLearner();
  const target = encodeURIComponent(safeLearnerDestination(next));
  if (!user)
    redirect(
      readCookie(request, "l2e_user_session")
        ? `/login?reason=expired&next=${target}`
        : `/access?next=${target}`,
    );
  if (user.onboardingState === "pending-v1")
    redirect(`/onboarding?next=${target}`);
  return user;
}
