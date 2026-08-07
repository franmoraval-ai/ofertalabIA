import { NextResponse, type NextRequest } from "next/server";

import { authenticateLegalRequest } from "@/lib/legal-auth";

const PUBLIC_LEGAL_PATHS = new Set(["/legal/login", "/legal/activate"]);
const LEGACY_PUBLIC_HOST = "ofertalab-ia.vercel.app";
const CANONICAL_PUBLIC_HOST = "ofertalabcr.com";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = (request.headers.get("host") || "").split(":")[0].toLowerCase();
  if (host === LEGACY_PUBLIC_HOST) {
    const destination = request.nextUrl.clone();
    destination.protocol = "https:";
    destination.hostname = CANONICAL_PUBLIC_HOST;
    destination.port = "";
    return NextResponse.redirect(destination, 308);
  }

  if (!pathname.startsWith("/legal")) {
    return NextResponse.next();
  }

  if (PUBLIC_LEGAL_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const auth = await authenticateLegalRequest(request);
  if (auth.ok) {
    const response = NextResponse.next();
    response.headers.set("x-ofertalab-legal-user", auth.user.email);
    response.headers.set("x-ofertalab-legal-role", auth.user.role);
    return response;
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/legal/login";
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};