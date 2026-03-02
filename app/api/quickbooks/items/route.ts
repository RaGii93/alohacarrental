import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { listQuickBooksItems } from "@/lib/quickbooks";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "ROOT" && session.role !== "OWNER")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") || 100);
  const activeOnly = url.searchParams.get("active_only") !== "0";
  const result = await listQuickBooksItems({ limit, activeOnly });

  if (!result.success) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}
