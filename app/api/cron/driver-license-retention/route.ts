import { NextResponse } from "next/server";
import { cleanupExpiredDriverLicenses } from "@/lib/driver-license-retention";

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
    const summary = await cleanupExpiredDriverLicenses();
    return NextResponse.json({ ok: true, ...summary });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Driver license cleanup failed" },
      { status: 500 }
    );
  }
}
