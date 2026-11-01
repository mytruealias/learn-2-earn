import { staffList } from "@/lib/staff/lists";
import { directoryMutation } from "@/lib/staff/directory";
export const GET = (req: Request) => staffList(req, "directory");
export const POST = (req: Request) => directoryMutation(req);
