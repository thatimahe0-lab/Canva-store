import { verifyAdminCredentials, createAdminSessionToken, ADMIN_COOKIE_NAME, ADMIN_COOKIE_MAX_AGE } from "@/lib/auth";

// Basic in-memory rate limiting per server instance. For production, use a
// durable store (Redis/Upstash) so limits survive restarts and work across
// multiple server instances.
const attempts = new Map();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

export async function POST(req) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const now = Date.now();
  const record = attempts.get(ip) || { count: 0, resetAt: now + WINDOW_MS };

  if (now > record.resetAt) {
    record.count = 0;
    record.resetAt = now + WINDOW_MS;
  }
  if (record.count >= MAX_ATTEMPTS) {
    return Response.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const { email, password } = await req.json();
  const valid = await verifyAdminCredentials(email, password);

  record.count += 1;
  attempts.set(ip, record);

  if (!valid) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }

  attempts.delete(ip);
  const token = createAdminSessionToken();

  const res = Response.json({ ok: true });
  res.headers.set(
    "Set-Cookie",
    `${ADMIN_COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${ADMIN_COOKIE_MAX_AGE}`
  );
  return res;
}
