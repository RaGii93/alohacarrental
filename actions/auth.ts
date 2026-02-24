"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { comparePassword } from "@/lib/password";
import { loginFormSchema } from "@/lib/validators";
import { createSession, setSessionCookie, destroySession, getSession } from "@/lib/session";
import { logAdminAction } from "@/lib/audit";

export async function loginAction(email: string, password: string, locale: string) {
  try {
    const validated = loginFormSchema.parse({ email, password });

    const user = await db.adminUser.findUnique({
      where: { email: validated.email },
    });

    if (!user) {
      return { success: false, error: "Invalid email or password" };
    }

    const passwordMatch = await comparePassword(validated.password, user.passwordHash);
    if (!passwordMatch) {
      return { success: false, error: "Invalid email or password" };
    }

    const sessionToken = await createSession({
      adminUserId: user.id,
      role: user.role,
    });

    await setSessionCookie(sessionToken);
    await logAdminAction({
      adminUserId: user.id,
      action: "ADMIN_LOGGED_IN",
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Login failed" };
  }
}

export async function logoutAction(locale: string) {
  const session = await getSession();
  if (session?.adminUserId) {
    await logAdminAction({
      adminUserId: session.adminUserId,
      action: "ADMIN_LOGGED_OUT",
    });
  }
  await destroySession();
  redirect(`/${locale}`);
}
