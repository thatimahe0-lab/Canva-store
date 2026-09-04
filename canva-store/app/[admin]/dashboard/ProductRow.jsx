"use client";
import { useRouter } from "next/navigation";

export default function ProductRow({ product }) {
  const router = useRouter();

  async function togglePublish() {
    await fetch(`/api/admin/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !product.published }),
    });
    router.refresh();
  }

  async function remove() {
    if (!confirm(`Delete "${product.title}"? This can't be undone.`)) return;
    await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <tr style={{ borderBottom: "1px solid #eee" }}>
      <td>{product.title}</td>
      <td>₹{(product.priceInr / 100).toFixed(0)} / ${(product.priceUsd / 100).toFixed(2)}</td>
      <td>{product.published ? "Yes" : "No"}</td>
      <td style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-secondary" onClick={togglePublish}>
          {product.published ? "Unpublish" : "Publish"}
        </button>
        <button className="btn btn-secondary" onClick={remove}>Delete</button>
      </td>
    </tr>
  );
}
