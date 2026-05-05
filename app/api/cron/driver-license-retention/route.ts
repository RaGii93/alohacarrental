import { NextResponse } from "next/server";
import { cleanupExpiredDriverLicenses } from "@/lib/driver-license-retention";

export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
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
