import { NextRequest, NextResponse } from "next/server";
import { requireOwnerOrRootApi, setOAuthStateCookie } from "@/app/api/integrations/_lib";
import { ZohoConnectionHelper } from "@/lib/integrations/zoho-connection";

export async function GET(request: NextRequest) {
  const auth = await requireOwnerOrRootApi();
  if (!auth.ok) return auth.response;

  if (!(await ZohoConnectionHelper.getClientId()) || !(await ZohoConnectionHelper.getClientSecret())) {
    return NextResponse.json({ success: false, error: "Zoho OAuth environment is incomplete" }, { status: 400 });
  }

  const locale = request.nextUrl.searchParams.get("locale") || "en";
  const state = ZohoConnectionHelper.createState(locale);
  await setOAuthStateCookie(ZohoConnectionHelper.stateCookieName, state);
  return NextResponse.redirect(await ZohoConnectionHelper.buildAuthorizeUrl(state));
}
