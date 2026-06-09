import { type NextRequest, NextResponse } from "next/server";
import { AUTH_PATHS, TOKEN_COOKIE } from "@/shared/config";

export function proxy(request: NextRequest) {
  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  const { pathname } = request.nextUrl;
  const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p));

  if (!token && !isAuthPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (token && isAuthPath) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
