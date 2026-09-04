import Link from "next/link";
import { prisma } from "@/lib/prisma";
import BackToTopButton from "./components/BackToTopButton";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const products = await prisma.product.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <header className="top-bar">
        <div className="container" style={{ padding: "16px 20px" }}>
          <h1 style={{ margin: 0, fontSize: 22 }}>TemplateHaus</h1>
          <p style={{ margin: "4px 0 0", color: "#666" }}>
            Editable Canva templates, delivered instantly.
          </p>
        </div>
      </header>

      <main className="container" style={{ padding: "28px 20px" }}>
        <div className="grid">
          {products.map((p) => (
            <Link key={p.id} href={`/products/${p.slug}`} className="card" style={{ textDecoration: "none", color: "inherit" }}>
              <img src={p.coverImage} alt={p.title} />
              <div className="body">
                <h3 style={{ margin: "0 0 6px", fontSize: 16 }}>{p.title}</h3>
                <p style={{ margin: "0 0 8px", fontSize: 13, color: "#666" }}>{p.caption}</p>
                <span className="price">₹{(p.priceInr / 100).toFixed(0)}</span>
                <span style={{ color: "#999" }}> / ${(p.priceUsd / 100).toFixed(2)}</span>
              </div>
            </Link>
          ))}
        </div>
        {products.length === 0 && <p>No templates published yet.</p>}
      </main>

      <BackToTopButton />
    </>
  );
}
