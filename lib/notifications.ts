import { db } from "@/lib/db";

export const NOTIFICATION_RETENTION_DAYS = 30;

export async function cleanupOldNotifications() {
  const cutoff = new Date(Date.now() - NOTIFICATION_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  await db.notification.deleteMany({
    where: {
      createdAt: { lt: cutoff },
    },
  });
}

export async function listNotifications(options?: { limit?: number }) {
  await cleanupOldNotifications();
  return db.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: options?.limit,
  });
}

export async function getNotificationCount() {
  await cleanupOldNotifications();
  return db.notification.count();
}

export async function createNotification(input: {
  type: string;
  title: string;
  message: string;
  href?: string | null;
  severity?: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  createdByUserId?: string | null;
}) {
  await cleanupOldNotifications();
  return db.notification.create({
    data: {
      type: input.type,
      title: input.title,
      message: input.message,
      href: input.href ?? null,
      severity: input.severity ?? "INFO",
      createdByUserId: input.createdByUserId ?? null,
    },
  });
}

export async function deleteNotification(notificationId: string) {
  return db.notification.delete({
    where: { id: notificationId },
  });
}
