import { NextRequest, NextResponse } from "next/server";
export function middleware(req: NextRequest) {
  const header = req.headers.get("authorization") || "";
  const encoded = header.split(" ")[1];
  let password = "";
  if (encoded) { try { password = atob(encoded).split(":")[1] || ""; } catch {} }
  if (password !== process.env.SITE_PASSWORD) {
    return new NextResponse("Authentication required", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="HQ Business Case"' },
    });
  }
  return NextResponse.next();
}
export const config = { matcher: ["/((?!_next|favicon.ico).*)"] };
