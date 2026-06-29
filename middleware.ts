import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const publicRoutes = [
  "/login",
  "/signup",
  "/invite",
  "/api/auth",
  "/api/auth/signup",
  "/api/auth/signup/verify",
  "/api/stripe/webhook"
];

export default async function middleware(req: NextRequest) {
  if (
    process.env.NEXT_PUBLIC_DEMO_MODE === "true" &&
    process.env.NODE_ENV !== "production"
  ) {
    return NextResponse.next();
  }

  const { pathname } = req.nextUrl;
  const isPublic = publicRoutes.some((route) => pathname.startsWith(route));

  if (isPublic) return NextResponse.next();

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET
  });

  if (!token?.id) {
    return NextResponse.redirect(
      new URL("/login", req.nextUrl.origin)
    );
  }

  const role = token.role;

  if (pathname.startsWith("/portal") && role !== "CLIENT") {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  if (
    !pathname.startsWith("/portal") &&
    !pathname.startsWith("/api") &&
    role === "CLIENT"
  ) {
    return NextResponse.redirect(
      new URL("/portal", req.nextUrl.origin)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"]
};