import { NextRequest, NextResponse } from "next/server";
import { requireOwnerOrRootApi, setOAuthStateCookie } from "@/app/api/integrations/_lib";
import { QuickBooksConnectionHelper } from "@/lib/integrations/quickbooks-connection";

export async function GET(request: NextRequest) {
  const auth = await requireOwnerOrRootApi();
  if (!auth.ok) return auth.response;

  if (!(await QuickBooksConnectionHelper.getClientId()) || !(await QuickBooksConnectionHelper.getClientSecret())) {
    return NextResponse.json({ success: false, error: "QuickBooks OAuth environment is incomplete" }, { status: 400 });
  }

  const locale = request.nextUrl.searchParams.get("locale") || "en";
  const state = QuickBooksConnectionHelper.createState(locale);
  await setOAuthStateCookie(QuickBooksConnectionHelper.stateCookieName, state);
  return NextResponse.redirect(await QuickBooksConnectionHelper.buildAuthorizeUrl(state));
}
