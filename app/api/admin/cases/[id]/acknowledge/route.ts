import { caseMutation } from "@/lib/staff/cases";
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return caseMutation(req, (await params).id, "acknowledge");
}
