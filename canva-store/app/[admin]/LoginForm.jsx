"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm({ slug }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      router.push(`/${slug}/dashboard`);
    } else {
      // Deliberately vague - never confirm whether the email exists.
      setError("Invalid credentials.");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email" placeholder="Email" value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ width: "100%", padding: 10, marginBottom: 10 }} required
      />
      <input
        type="password" placeholder="Password" value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: "100%", padding: 10, marginBottom: 10 }} required
      />
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <button className="btn btn-primary" type="submit" style={{ width: "100%" }}>
        Sign in
      </button>
    </form>
  );
}
