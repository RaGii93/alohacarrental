import { NextResponse } from "next/server";
import { requireOwnerOrRootApi } from "@/app/api/integrations/_lib";
import { ZohoConnectionHelper } from "@/lib/integrations/zoho-connection";

export async function GET() {
  const auth = await requireOwnerOrRootApi();
  if (!auth.ok) return auth.response;

  try {
    const health = await ZohoConnectionHelper.getHealth();
    return NextResponse.json({ success: true, ...health });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: String(error?.message || "Zoho health check failed") },
      { status: 500 }
    );
  }
}
