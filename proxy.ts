import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);
const NOINDEX_HEADER = "noindex, nofollow, noarchive, nosnippet";

function toLocalePath(locale: string, path: string) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const normalizedPath = cleanPath === "/" ? "" : cleanPath;
  return locale === routing.defaultLocale ? normalizedPath || "/" : `/${locale}${normalizedPath}`;
}

function getLocaleFromPathname(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const maybeLocale = segments[0];
  return routing.locales.includes(maybeLocale as (typeof routing.locales)[number])
    ? maybeLocale
    : routing.defaultLocale;
}

function stripLocalePrefix(pathname: string) {
  const locale = getLocaleFromPathname(pathname);
  const localePrefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  if (!localePrefix || !pathname.startsWith(localePrefix)) {
    return pathname || "/";
  }
  return pathname.slice(localePrefix.length) || "/";
}

export default function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const locale = getLocaleFromPathname(pathname);
  const localizedPathname = stripLocalePrefix(pathname);
  const hasSession = Boolean(request.cookies.get("session")?.value);

  if (localizedPathname === "/admin/login" && hasSession) {
    return NextResponse.redirect(new URL(toLocalePath(locale, "/admin"), request.url));
  }

  if (localizedPathname.startsWith("/admin") && localizedPathname !== "/admin/login" && !hasSession) {
    return NextResponse.redirect(new URL(toLocalePath(locale, "/admin/login"), request.url));
  }

  const response = intlMiddleware(request);

  if (
    localizedPathname.startsWith("/admin") ||
    localizedPathname === "/book/review" ||
    localizedPathname.startsWith("/book/success")
  ) {
    response.headers.set("X-Robots-Tag", NOINDEX_HEADER);
  }

  return response;
}

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
