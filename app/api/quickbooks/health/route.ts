import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getQuickBooksHealth } from "@/lib/quickbooks";

export async function GET() {
  const session = await getSession();
  if (!session || (session.role !== "ROOT" && session.role !== "OWNER")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const result = await getQuickBooksHealth();
  if (!result.success) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}
