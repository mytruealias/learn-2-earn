import { staffList } from "@/lib/staff/lists";
import { staffWrite } from "@/lib/rewards/http";
import { decisionSchema, decideReward } from "@/lib/rewards/requests";
export const GET = (req: Request) => staffList(req, "payouts");
export async function PATCH(req: Request) {
  return staffWrite(
    req,
    decisionSchema,
    ["admin", "caseworker", "finance"],
    decideReward,
  );
}
