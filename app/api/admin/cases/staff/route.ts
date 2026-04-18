import { getAdminFromRequest } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";
import { apiError, apiOk, apiServerError } from "@/lib/api-helpers";

export async function GET(req: Request) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) return apiError("unauthorized", "Not signed in", 401);

    const staff = await prisma.adminUser.findMany({
      where: { isActive: true },
      select: { id: true, fullName: true, role: true },
      orderBy: { fullName: "asc" },
    });

    return apiOk({ staff });
  } catch (error) {
    return apiServerError("admin/cases/staff", error);
  }
}
