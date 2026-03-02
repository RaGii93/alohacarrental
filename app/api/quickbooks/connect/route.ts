import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHash, randomBytes, randomUUID } from "crypto";
import { getSession } from "@/lib/session";

const QUICKBOOKS_AUTHORIZE_URL = "https://appcenter.intuit.com/connect/oauth2";
const QUICKBOOKS_SCOPE = "com.intuit.quickbooks.accounting";
const QUICKBOOKS_STATE_PREFIX = "edge-rent-qbo-oauth-state";
const QB_STATE_COOKIE = "qb_oauth_state";
const QB_PKCE_COOKIE = "qb_oauth_pkce";

function mask(value: string, visible = 6) {
  if (!value) return "";
  if (value.length <= visible * 2) return `${value.slice(0, 2)}...${value.slice(-2)}`;
  return `${value.slice(0, visible)}...${value.slice(-visible)}`;
}

function toBase64Url(buffer: Buffer) {
  return buffer
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "ROOT" && session.role !== "OWNER")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const clientId = process.env.QUICKBOOKS_CLIENT_ID || "";
  const redirectUri = process.env.QUICKBOOKS_REDIRECT_URI || "";

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      {
        success: false,
        error: "Missing QUICKBOOKS_CLIENT_ID or QUICKBOOKS_REDIRECT_URI",
      },
      { status: 500 }
    );
  }

  const nonce = randomUUID();
  const state = `${QUICKBOOKS_STATE_PREFIX}:${nonce}`;
  const codeVerifier = toBase64Url(randomBytes(64));
  const codeChallenge = toBase64Url(createHash("sha256").update(codeVerifier).digest());

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    scope: QUICKBOOKS_SCOPE,
    redirect_uri: redirectUri,
    state,
  });
  params.set("access_type", "offline");
  params.set("prompt", "consent");
  params.set("code_challenge", codeChallenge);
  params.set("code_challenge_method", "S256");

  const authorizeUrl = `${QUICKBOOKS_AUTHORIZE_URL}?${params.toString()}`;
  console.info("[QBO][connect] generated oauth params", {
    hasClientId: Boolean(clientId),
    redirectUri,
    stateMasked: mask(state),
    codeVerifierLength: codeVerifier.length,
    codeChallengeLength: codeChallenge.length,
    usesPkce: true,
  });
  const debugPayload = {
    success: true,
    quickbooks: {
      authorizeUrl,
      redirectUri,
      scope: QUICKBOOKS_SCOPE,
      hasClientId: Boolean(clientId),
      state: state || null,
      statePrefix: QUICKBOOKS_STATE_PREFIX,
      usesPkce: true,
    },
  };

  // Debug mode: /api/quickbooks/connect?debug=1
  // Returns the exact URL/redirect_uri used so app settings can be compared quickly.
  // Only available to authenticated ROOT/OWNER via the same session check above.
  const debug = new URL(request.url).searchParams.get("debug");
  if (debug === "1") {
    return NextResponse.json(debugPayload);
  }

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set(QB_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/quickbooks/callback",
    maxAge: 60 * 10,
  });
  response.cookies.set(QB_PKCE_COOKIE, codeVerifier, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/quickbooks/callback",
    maxAge: 60 * 10,
  });
  return response;
}
