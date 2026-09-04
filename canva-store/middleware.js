import { NextResponse } from "next/server";

// The admin UI lives at /<ADMIN_SLUG> (login) and /<ADMIN_SLUG>/dashboard (panel).
// Anyone hitting /<ADMIN_SLUG>/dashboard without a valid session cookie is
// bounced to the normal homepage - it looks like a random 404/redirect,
// it does NOT reveal that an admin area exists.
export function middleware(request) {
  const { pathname } = request.nextUrl;
  const slug = process.env.ADMIN_SLUG;
  const dashboardPrefix = `/${slug}/dashboard`;

  if (pathname.startsWith(dashboardPrefix)) {
    const cookie = request.cookies.get("admin_session");
    if (!cookie) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    // Full JWT verification happens again server-side in the page/API route
    // (middleware runs on the edge and we keep it light here).
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*/dashboard/:path*"],
};
