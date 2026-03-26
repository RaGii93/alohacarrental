import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function requireOwnerOrRootApi() {
  const session = await getSession();
  if (!session) {
    return { ok: false as const, response: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }) };
  }
  if (session.role !== "ROOT" && session.role !== "OWNER") {
    return { ok: false as const, response: NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true as const, session };
}

export async function setOAuthStateCookie(name: string, state: string) {
  const store = await cookies();
  store.set(name, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });
}

export async function consumeOAuthStateCookie(name: string) {
  const store = await cookies();
  const value = store.get(name)?.value || "";
  store.delete(name);
  return value;
}

export function buildSettingsRedirect(locale: string, provider: string, status: string, message?: string) {
  const qp = new URLSearchParams({
    integration: provider,
    status,
  });
  if (message) qp.set("message", message);
  return `/${locale}/admin/settings?${qp.toString()}`;
}
