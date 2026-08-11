import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const form = await req.formData();
  const password = String(form.get("password") || "");
  const ok = password === process.env.SITE_PASSWORD;
  const res = NextResponse.redirect(new URL(ok ? "/" : "/?error=1", req.url), { status: 303 });
  if (ok) {
    res.cookies.set("auth", password, {
      httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 8,
    });
  }
  return res;
}
