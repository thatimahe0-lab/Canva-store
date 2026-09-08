"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProductForm() {
  const [status, setStatus] = useState("");
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("Uploading...");
    const form = new FormData(e.target);

    // Give up after 30s with a clear message instead of waiting forever if
    // the connection stalls or the server never responds.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        body: form,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        setStatus("Added!");
        e.target.reset();
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setStatus(`Error: ${data.error || `Server returned ${res.status}`}`);
      }
    } catch (err) {
      clearTimeout(timeout);
      if (err.name === "AbortError") {
        setStatus("Error: Upload timed out after 30s - the connection to storage may be failing.");
      } else {
        setStatus(`Error: ${err.message || "Network request failed"}`);
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10, maxWidth: 480 }}>
      <input name="title" placeholder="Title" required />
      <input name="caption" placeholder="Short caption (shown on card + when shared)" required />
      <textarea name="description" placeholder="Full description" rows={4} required />
      <input name="category" placeholder="Category (e.g. Instagram, Resume, Invitation)" />
      <div style={{ display: "flex", gap: 10 }}>
        <input name="priceInr" type="number" step="0.01" placeholder="Price in ₹ (e.g. 199)" required />
        <input name="priceUsd" type="number" step="0.01" placeholder="Price in $ (e.g. 4.99)" required />
      </div>
      <label>Cover image (used on the product card & social share preview)
        <input name="coverImage" type="file" accept="image/*" required />
      </label>
      <label>Template file (the actual Canva/PDF/zip customers receive)
        <input name="templateFile" type="file" required />
      </label>
      <button className="btn btn-primary" type="submit">Add template</button>
      {status && <p>{status}</p>}
    </form>
  );
}
