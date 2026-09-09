"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

function sanitize(name) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

// Asks the server for a temporary upload URL, then sends the file straight
// to storage from the browser - the file bytes never pass through our
// Netlify function, so large files or slow connections can't time it out.
async function uploadDirect(file, target, onStatus) {
  const key = `${target === "public" ? "covers" : "templates"}/${Date.now()}-${sanitize(file.name)}`;

  onStatus(`Requesting upload URL for ${file.name}...`);
  const presignRes = await fetch("/api/admin/uploads/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, contentType: file.type || "application/octet-stream", target }),
  });
  if (!presignRes.ok) {
    const data = await presignRes.json().catch(() => ({}));
    throw new Error(data.error || `Could not get upload URL (status ${presignRes.status})`);
  }
  const { uploadUrl, publicUrl } = await presignRes.json();

  onStatus(`Uploading ${file.name}...`);
  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  if (!putRes.ok) {
    throw new Error(`Direct upload of ${file.name} to storage failed (status ${putRes.status})`);
  }

  return { key, publicUrl };
}

export default function ProductForm() {
  const [status, setStatus] = useState("");
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    const formEl = e.target;
    const fd = new FormData(formEl);
    const coverFile = fd.get("coverImage");
    const templateFile = fd.get("templateFile");

    if (!coverFile || !coverFile.name || !templateFile || !templateFile.name) {
      setStatus("Error: please choose both a cover image and a template file.");
      return;
    }

    try {
      const cover = await uploadDirect(coverFile, "public", setStatus);
      const template = await uploadDirect(templateFile, "private", setStatus);

      setStatus("Saving product details...");
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: fd.get("title"),
          caption: fd.get("caption"),
          description: fd.get("description"),
          category: fd.get("category"),
          priceInr: fd.get("priceInr"),
          priceUsd: fd.get("priceUsd"),
          coverImage: cover.publicUrl,
          fileKey: template.key,
        }),
      });

      if (res.ok) {
        setStatus("Added!");
        formEl.reset();
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setStatus(`Error: ${data.error || `Server returned ${res.status}`}`);
      }
    } catch (err) {
      setStatus(`Error: ${err.message || "Upload failed"}`);
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
