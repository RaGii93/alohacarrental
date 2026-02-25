"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { hashPassword } from "@/lib/password";
import { logAdminAction } from "@/lib/audit";

const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["OWNER", "STAFF"]),
});

const updateUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().optional(),
  role: z.enum(["OWNER", "STAFF"]),
});

async function requireUserManagementSession() {
  const session = await getSession();
  if (!session) return { ok: false as const, error: "Unauthorized" };
  if (session.role !== "ROOT" && session.role !== "OWNER") {
    return { ok: false as const, error: "Forbidden" };
  }
  return { ok: true as const, session };
}

export async function createAdminUserAction(formData: any, _locale: string) {
  try {
    const auth = await requireUserManagementSession();
    if (!auth.ok) return { success: false as const, error: auth.error };

    const validated = createUserSchema.parse({
      email: String(formData?.email || "").trim().toLowerCase(),
      password: String(formData?.password || ""),
      role: formData?.role,
    });

    const existing = await db.adminUser.findUnique({ where: { email: validated.email } });
    if (existing) return { success: false as const, error: "Email already exists" };

    const passwordHash = await hashPassword(validated.password);
    const user = await db.adminUser.create({
      data: {
        email: validated.email,
        passwordHash,
        role: validated.role,
      },
      select: { id: true, email: true, role: true, createdAt: true },
    });

    await logAdminAction({
      adminUserId: auth.session.adminUserId,
      action: "ADMIN_USER_CREATED",
    });

    return { success: true as const, user };
  } catch (error: any) {
    return { success: false as const, error: error?.message || "Failed to create user" };
  }
}

export async function updateAdminUserAction(userId: string, formData: any, _locale: string) {
  try {
    const auth = await requireUserManagementSession();
    if (!auth.ok) return { success: false as const, error: auth.error };

    const target = await db.adminUser.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });
    if (!target) return { success: false as const, error: "User not found" };
    if (target.role === "ROOT") return { success: false as const, error: "ROOT_PROTECTED" };

    const validated = updateUserSchema.parse({
      email: String(formData?.email || "").trim().toLowerCase(),
      password: String(formData?.password || "").trim() || undefined,
      role: formData?.role,
    });

    const existing = await db.adminUser.findUnique({ where: { email: validated.email } });
    if (existing && existing.id !== userId) {
      return { success: false as const, error: "Email already exists" };
    }

    const data: { email: string; role: "OWNER" | "STAFF"; passwordHash?: string } = {
      email: validated.email,
      role: validated.role,
    };

    if (validated.password) {
      if (validated.password.length < 8) {
        return { success: false as const, error: "Password must be at least 8 characters" };
      }
      data.passwordHash = await hashPassword(validated.password);
    }

    const user = await db.adminUser.update({
      where: { id: userId },
      data,
      select: { id: true, email: true, role: true, createdAt: true },
    });

    await logAdminAction({
      adminUserId: auth.session.adminUserId,
      action: "ADMIN_USER_UPDATED",
    });

    return { success: true as const, user };
  } catch (error: any) {
    return { success: false as const, error: error?.message || "Failed to update user" };
  }
}

export async function deleteAdminUserAction(userId: string, _locale: string) {
  try {
    const auth = await requireUserManagementSession();
    if (!auth.ok) return { success: false as const, error: auth.error };

    const target = await db.adminUser.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });
    if (!target) return { success: false as const, error: "User not found" };
    if (target.role === "ROOT") return { success: false as const, error: "ROOT_PROTECTED" };

    const user = await db.adminUser.delete({
      where: { id: userId },
      select: { id: true, email: true, role: true, createdAt: true },
    });

    await logAdminAction({
      adminUserId: auth.session.adminUserId,
      action: "ADMIN_USER_DELETED",
    });

    return { success: true as const, user };
  } catch (error: any) {
    return { success: false as const, error: error?.message || "Failed to delete user" };
  }
}
