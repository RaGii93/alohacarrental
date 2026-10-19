import { NextResponse } from "next/server";
import { getTermsPdfUrl } from "@/lib/terms";

// Keep links in previously sent customer emails working.
export async function GET(request: Request) {
  return NextResponse.redirect(new URL(await getTermsPdfUrl(), request.url));
}
