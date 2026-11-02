import { directoryMutation } from "@/lib/staff/directory";
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return directoryMutation(req, (await params).id);
}
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return directoryMutation(req, (await params).id, true);
}
