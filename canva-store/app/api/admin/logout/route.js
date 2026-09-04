import { ADMIN_COOKIE_NAME } from "@/lib/auth";

export async function POST() {
  const res = Response.json({ ok: true });
  res.headers.set("Set-Cookie", `${ADMIN_COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0`);
  return res;
}
