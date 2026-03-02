import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getQuickBooksRuntimePreview } from "@/lib/quickbooks";

export async function GET() {
  const session = await getSession();
  if (!session || (session.role !== "ROOT" && session.role !== "OWNER")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    quickbooksRuntime: getQuickBooksRuntimePreview(),
  });
}
