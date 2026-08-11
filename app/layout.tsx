import { cookies } from "next/headers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pw = process.env.SITE_PASSWORD;
  const authed = !!pw && cookies().get("auth")?.value === pw;
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "sans-serif" }}>
        {authed ? children : (
          <form action="/api/login" method="POST" style={{ maxWidth: 320, margin: "20vh auto" }}>
            <h2 style={{ color: "#0E3A2F" }}>HQ Business Case</h2>
            <input name="password" type="password" placeholder="Password"
              style={{ width: "100%", padding: 10, boxSizing: "border-box" }} />
            <button style={{ marginTop: 12, padding: "10px 16px", background: "#0E3A2F", color: "#fff", border: 0 }}>Enter</button>
          </form>
        )}
      </body>
    </html>
  );
}
