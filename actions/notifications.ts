"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { deleteNotification, listNotifications } from "@/lib/notifications";

async function requireNotificationAdmin() {
  const session = await getSession();
  if (!session) return { ok: false as const, error: "Unauthorized" };
  if (session.role !== "ROOT" && session.role !== "OWNER" && session.role !== "STAFF") {
    return { ok: false as const, error: "Forbidden" };
  }
  return { ok: true as const, session };
}

export async function getNotificationsAction(limit?: number) {
  const auth = await requireNotificationAdmin();
  if (!auth.ok) {
    return { success: false as const, error: auth.error, notifications: [] as any[] };
  }
  const notifications = await listNotifications({ limit });
  return { success: true as const, notifications };
}

export async function dismissNotificationAction(notificationId: string, locale: string) {
  try {
    const auth = await requireNotificationAdmin();
    if (!auth.ok) return { success: false as const, error: auth.error };
    await deleteNotification(notificationId);
    revalidatePath(`/${locale}/admin`);
    revalidatePath(`/${locale}/admin/notifications`);
    return { success: true as const };
  } catch (error: any) {
    return { success: false as const, error: error?.message || "Failed to dismiss notification" };
  }
}
