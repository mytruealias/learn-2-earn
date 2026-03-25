import prisma from "@/lib/prisma";

export async function logAudit({
  adminId,
  action,
  entity,
  entityId,
  details,
  ipAddress,
}: {
  adminId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: string | null;
  ipAddress?: string | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        adminId: adminId || null,
        action,
        entity,
        entityId: entityId || null,
        details: details || null,
        ipAddress: ipAddress || null,
      },
    });
  } catch (e) {
    console.error("Audit log error:", e);
  }
}
