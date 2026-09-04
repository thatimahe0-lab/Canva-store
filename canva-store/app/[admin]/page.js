import { notFound } from "next/navigation";
import LoginForm from "./LoginForm";

// This route matches ANY single top-level path segment (e.g. /whatever).
// We only render the real login form if it matches your secret ADMIN_SLUG;
// every other value 404s exactly like a normal unknown URL, so this page
// can't be discovered by guessing common admin paths like /admin or /login.
export default function MaybeAdminLogin({ params }) {
  if (params.admin !== process.env.ADMIN_SLUG) {
    notFound();
  }

  return (
    <main style={{ maxWidth: 360, margin: "80px auto", padding: 20 }}>
      <h2>Admin sign in</h2>
      <LoginForm slug={params.admin} />
    </main>
  );
}
