import { cookies } from "next/headers";
import { verifyAdminSessionToken, ADMIN_COOKIE_NAME } from "@/lib/auth";

// Call at the top of every admin API route. Throws-by-return-value pattern:
// returns null if authorized, or a Response to send back immediately if not.
export function requireAdmin() {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  if (!token || !verifyAdminSessionToken(token)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
