import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

const QUICKBOOKS_TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "ROOT" && session.role !== "OWNER")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const realmId = url.searchParams.get("realmId");
  const state = url.searchParams.get("state") || "";
  const oauthError = url.searchParams.get("error");
  const oauthErrorDescription = url.searchParams.get("error_description");

  if (oauthError) {
    return NextResponse.json(
      {
        success: false,
        error: oauthErrorDescription || oauthError,
      },
      { status: 400 }
    );
  }

  const clientId = process.env.QUICKBOOKS_CLIENT_ID || "";
  const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET || "";
  const redirectUri = process.env.QUICKBOOKS_REDIRECT_URI || "";
  const expectedState = process.env.QUICKBOOKS_OAUTH_STATE || "";

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json(
      {
        success: false,
        error: "Missing QUICKBOOKS_CLIENT_ID, QUICKBOOKS_CLIENT_SECRET, or QUICKBOOKS_REDIRECT_URI",
      },
      { status: 500 }
    );
  }

  if (expectedState && state !== expectedState) {
    return NextResponse.json({ success: false, error: "Invalid OAuth state" }, { status: 400 });
  }

  if (!code || !realmId) {
    return NextResponse.json(
      {
        success: false,
        error: "Missing code or realmId in callback",
      },
      { status: 400 }
    );
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });

  const response = await fetch(QUICKBOOKS_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    cache: "no-store",
  });

  const text = await response.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!response.ok || !json?.refresh_token) {
    return NextResponse.json(
      {
        success: false,
        error:
          json?.error_description ||
          json?.error ||
          text ||
          `QuickBooks OAuth token exchange failed (${response.status})`,
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    quickbooks: {
      realmId,
      refreshToken: json.refresh_token,
      accessToken: json.access_token,
      accessTokenExpiresIn: json.expires_in,
      refreshTokenExpiresIn: json.x_refresh_token_expires_in,
      tokenType: json.token_type,
    },
    env: {
      QUICKBOOKS_REALM_ID: realmId,
      QUICKBOOKS_REFRESH_TOKEN: json.refresh_token,
    },
    message:
      "OAuth connected. Save QUICKBOOKS_REALM_ID and QUICKBOOKS_REFRESH_TOKEN to your .env and restart the app.",
  });
}
