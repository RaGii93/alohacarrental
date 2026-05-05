import { NextResponse } from "next/server";
import { runScheduledAutomations } from "@/lib/automations";

function isAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return process.env.NODE_ENV !== "production";

  const authHeader = request.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const headerSecret = request.headers.get("x-cron-secret") || "";

  return bearer === cronSecret || headerSecret === cronSecret;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await runScheduledAutomations();
    return NextResponse.json({ ok: true, ...summary });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
