import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const SECRET = process.env.ADMIN_SESSION_SECRET;
const COOKIE_NAME = "admin_session";
const SESSION_HOURS = 12;

/**
 * Verifies the submitted email/password against the single admin
 * account defined in environment variables (no admin DB table on
 * purpose - one owner, one account, nothing for an attacker to enumerate).
 */
export async function verifyAdminCredentials(email, password) {
  if (email !== process.env.ADMIN_EMAIL) return false;
  return bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
}

export function createAdminSessionToken() {
  return jwt.sign({ role: "admin" }, SECRET, { expiresIn: `${SESSION_HOURS}h` });
}

export function verifyAdminSessionToken(token) {
  try {
    const payload = jwt.verify(token, SECRET);
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;
export const ADMIN_COOKIE_MAX_AGE = SESSION_HOURS * 60 * 60; // seconds
