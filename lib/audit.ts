import prisma from "@/lib/prisma";

export async function logAudit({
  programId,
  adminId,
  action,
  entity,
  entityId,
  details,
  ipAddress,
}: {
  programId?: string | null;
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
        programId: programId ?? null,
        adminId: adminId || null,
        action,
        entity,
        entityId: entityId || null,
        details: details || null,
        ipAddress: ipAddress || null,
      },
    });
  } catch {
    console.error("Audit log could not be saved.");
  }
}
