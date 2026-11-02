import { requireLearner } from "@/lib/learner-server";
import prisma from "@/lib/prisma";
import ProfileClient from "./ProfileClient";
import Rewards from "./Rewards";
import { ButtonLink, Card } from "../components/ui";
export const dynamic = "force-dynamic";
export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const user = await requireLearner(
    params.tab === "earnings" ? "/profile?tab=earnings" : "/profile",
  );
  if (!user.email) {
    const count = await prisma.progress.count({ where: { userId: user.id } });
    return (
      <main style={{ maxWidth: "40rem", margin: "auto", padding: "2rem 1rem" }}>
        <Card>
          <h1>Your guest progress</h1>
          <p>
            {count} lessons completed · {user.totalXp} XP earned
          </p>
          <p>
            Create an account in this browser to keep this progress across
            devices. Your program will explain incentive eligibility and
            approval.
          </p>
          <ButtonLink href="/signup">Save my progress</ButtonLink>
        </Card>
      </main>
    );
  }
  if (params.tab === "earnings") return <main><Rewards /></main>;
  const tab =
    params.tab === "earnings" ||
    params.tab === "achievements" ||
    params.tab === "info"
      ? params.tab
      : "overview";
  return <ProfileClient initialTab={tab} />;
}
