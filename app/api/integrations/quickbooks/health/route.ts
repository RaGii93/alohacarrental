import { NextResponse } from "next/server";
import { requireOwnerOrRootApi } from "@/app/api/integrations/_lib";
import { QuickBooksConnectionHelper } from "@/lib/integrations/quickbooks-connection";

export async function GET() {
  const auth = await requireOwnerOrRootApi();
  if (!auth.ok) return auth.response;

  try {
    const health = await QuickBooksConnectionHelper.getHealth();
    return NextResponse.json({ success: true, ...health });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: String(error?.message || "QuickBooks health check failed") },
      { status: 500 }
    );
  }
}
