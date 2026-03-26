import { NextRequest, NextResponse } from "next/server";
import { buildSettingsRedirect, consumeOAuthStateCookie, requireOwnerOrRootApi } from "@/app/api/integrations/_lib";
import { QuickBooksConnectionHelper } from "@/lib/integrations/quickbooks-connection";

export async function GET(request: NextRequest) {
  const auth = await requireOwnerOrRootApi();
  if (!auth.ok) return auth.response;

  const storedState = await consumeOAuthStateCookie(QuickBooksConnectionHelper.stateCookieName);
  const incomingState = request.nextUrl.searchParams.get("state") || "";
  const locale = (() => {
    try {
      return JSON.parse(storedState || "{}")?.locale || "en";
    } catch {
      return "en";
    }
  })();

  if (!storedState || !incomingState || storedState !== incomingState) {
    return NextResponse.redirect(new URL(buildSettingsRedirect(locale, "quickbooks", "error", "Invalid QuickBooks OAuth state"), request.url));
  }

  const error = request.nextUrl.searchParams.get("error");
  if (error) {
    return NextResponse.redirect(
      new URL(buildSettingsRedirect(locale, "quickbooks", "error", request.nextUrl.searchParams.get("error_description") || error), request.url)
    );
  }

  const code = request.nextUrl.searchParams.get("code") || "";
  const realmId = request.nextUrl.searchParams.get("realmId") || "";
  if (!code) {
    return NextResponse.redirect(new URL(buildSettingsRedirect(locale, "quickbooks", "error", "Missing QuickBooks authorization code"), request.url));
  }

  try {
    const token = await QuickBooksConnectionHelper.exchangeCode({ code });
    await QuickBooksConnectionHelper.persistConnection({
      refreshToken: String(token.refresh_token || ""),
      realmId,
    });
    return NextResponse.redirect(new URL(buildSettingsRedirect(locale, "quickbooks", "connected"), request.url));
  } catch (oauthError: any) {
    return NextResponse.redirect(
      new URL(buildSettingsRedirect(locale, "quickbooks", "error", String(oauthError?.message || "QuickBooks connection failed")), request.url)
    );
  }
}
