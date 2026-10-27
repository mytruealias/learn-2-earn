import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { financeData } from "@/lib/rewards/finance";
import { Card } from "@/app/components/ui";
import FinanceClient from "./FinanceClient";
export const dynamic = "force-dynamic";
export default async function Page() {
  const a = await getAdminSession();
  if (!a) redirect("/admin/login");
  if (!["admin", "finance"].includes(a.role))
    return (
      <Card>
        <h1>Finance access required</h1>
        <p>
          Your role can review requests in the payout queue. This finance view
          is limited to finance staff and administrators.
        </p>
      </Card>
    );
  return <FinanceClient initialData={await financeData()} />;
}
