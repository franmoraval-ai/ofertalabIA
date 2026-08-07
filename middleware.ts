import { NextResponse, type NextRequest } from "next/server";

import { authenticateLegalRequest } from "@/lib/legal-auth";

const PUBLIC_LEGAL_PATHS = new Set(["/legal/login", "/legal/activate"]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
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
  matcher: ["/legal/:path*"],
};