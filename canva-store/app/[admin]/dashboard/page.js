import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { verifyAdminSessionToken, ADMIN_COOKIE_NAME } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProductForm from "./ProductForm";
import ProductRow from "./ProductRow";

export default async function Dashboard({ params }) {
  // Belt-and-suspenders: check both the slug AND the session server-side,
  // on top of the edge middleware check.
  if (params.admin !== process.env.ADMIN_SLUG) notFound();

  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  if (!token || !verifyAdminSessionToken(token)) notFound();

  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <main className="container" style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Admin dashboard</h1>
        <form action="/api/admin/logout" method="post">
          <button className="btn btn-secondary" formAction="/api/admin/logout">Log out</button>
        </form>
      </div>

      <h2>Add new template</h2>
      <ProductForm />

      <h2 style={{ marginTop: 40 }}>Existing templates ({products.length})</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th>Title</th><th>Price (₹ / $)</th><th>Published</th><th></th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => <ProductRow key={p.id} product={p} />)}
        </tbody>
      </table>
    </main>
  );
}
