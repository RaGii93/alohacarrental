import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

const QUICKBOOKS_AUTHORIZE_URL = "https://appcenter.intuit.com/connect/oauth2";
const QUICKBOOKS_SCOPE = "com.intuit.quickbooks.accounting";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "ROOT" && session.role !== "OWNER")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const clientId = process.env.QUICKBOOKS_CLIENT_ID || "";
  const redirectUri = process.env.QUICKBOOKS_REDIRECT_URI || "";
  const state = process.env.QUICKBOOKS_OAUTH_STATE || "";

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      {
        success: false,
        error: "Missing QUICKBOOKS_CLIENT_ID or QUICKBOOKS_REDIRECT_URI",
      },
      { status: 500 }
    );
  }

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    scope: QUICKBOOKS_SCOPE,
    redirect_uri: redirectUri,
    state,
  });
  params.set("access_type", "offline");
  params.set("prompt", "consent");

  const authorizeUrl = `${QUICKBOOKS_AUTHORIZE_URL}?${params.toString()}`;
  const debugPayload = {
    success: true,
    quickbooks: {
      authorizeUrl,
      redirectUri,
      scope: QUICKBOOKS_SCOPE,
      hasClientId: Boolean(clientId),
      state: state || null,
    },
  };

  // Debug mode: /api/quickbooks/connect?debug=1
  // Returns the exact URL/redirect_uri used so app settings can be compared quickly.
  // Only available to authenticated ROOT/OWNER via the same session check above.
  const debug = new URL(request.url).searchParams.get("debug");
  if (debug === "1") {
    return NextResponse.json(debugPayload);
  }

  return NextResponse.redirect(authorizeUrl);
}
