import { NextResponse } from "next/server";
import { sendBillingDocumentEmailAction } from "@/actions/booking";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const locale = typeof body?.locale === "string" && body.locale.trim() ? body.locale.trim() : "en";

    const result = await sendBillingDocumentEmailAction(id, locale);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to send billing document email" },
      { status: 500 }
    );
  }
}
