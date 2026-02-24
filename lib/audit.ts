import { db } from "@/lib/db";

type AuditClient = {
  auditLog: {
    create: (args: {
      data: {
        adminUserId: string;
        action: string;
        bookingId?: string;
      };
    }) => Promise<unknown>;
  };
};

export async function logAdminAction({
  adminUserId,
  action,
  bookingId,
  client,
}: {
  adminUserId: string;
  action: string;
  bookingId?: string;
  client?: AuditClient;
}) {
  try {
    const auditClient = client ?? (db as unknown as AuditClient);
    await auditClient.auditLog.create({
      data: {
        adminUserId,
        action,
        ...(bookingId ? { bookingId } : {}),
      },
    });
  } catch {
    // Audit log writes must not block primary admin actions.
  }
}
