import { learnerWrite } from "@/lib/rewards/http";
import { requestReward, requestSchema } from "@/lib/rewards/requests";
export async function POST(req: Request) {
  return learnerWrite(req, requestSchema, requestReward);
}
