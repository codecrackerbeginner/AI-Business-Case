import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };

export function middleware(req: NextRequest) {
  const unauthorized = new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="HQ Business Case"' },
  });
  try {
    const header = req.headers.get("authorization");
    if (!header) return unauthorized;
    const encoded = header.split(" ")[1];
    if (!encoded) return unauthorized;
    const decoded = atob(encoded);
    const pass = decoded.slice(decoded.indexOf(":") + 1);
    const expected = process.env.SITE_PASSWORD;
    if (expected && pass === expected) return NextResponse.next();
    return unauthorized;
  } catch {
    return unauthorized;
  }
}
