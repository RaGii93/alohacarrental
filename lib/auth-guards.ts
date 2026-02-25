import { redirect } from "next/navigation";
import { getSession } from "./session";

export async function requireAdmin(locale: string): Promise<{ userId: string; email: string; role: string }> {
  const session = await getSession();

  if (!session) {
    redirect(`/${locale}/admin/login`);
  }

  return {
    userId: session.adminUserId,
    email: session.email,
    role: session.role,
  };
}

export async function requireRoot(locale: string): Promise<string> {
  const session = await getSession();

  if (!session || session.role !== "ROOT") {
    redirect(`/${locale}/admin/login`);
  }

  return session.adminUserId;
}

export async function checkAdminAccess(locale: string): Promise<boolean> {
  const session = await getSession();
  return !!session;
}
