import { staffList } from "@/lib/staff/lists";
export const GET = (req: Request) => staffList(req, "audit");
