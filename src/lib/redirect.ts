import { NextResponse } from "next/server";

/**
 * Same-site redirect with a relative Location header. On Netlify, request.url can carry the internal
 * deploy hostname (e.g. abc123--site.netlify.app); redirecting there would drop the login cookies.
 * A relative path keeps the student on whichever address they are actually using.
 */
export function redirectTo(path: string, status = 303) {
  const safe = path.startsWith("/") && !path.startsWith("//") ? path : "/";
  return new NextResponse(null, { status, headers: { Location: safe } });
}
