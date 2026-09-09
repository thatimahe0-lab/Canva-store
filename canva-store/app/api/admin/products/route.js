import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import slugify from "slugify";

export async function GET() {
  const unauthorized = requireAdmin();
  if (unauthorized) return unauthorized;

  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
  return Response.json(products);
}

// The files are already uploaded directly to storage by this point (see
// /api/admin/uploads/presign) - this route only ever receives small JSON
// text, so it finishes in milliseconds regardless of file size or connection speed.
export async function POST(req) {
  const unauthorized = requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await req.json();
    const { title, caption, description, priceInr, priceUsd, category, coverImage, fileKey } = body;

    if (!title || !coverImage || !fileKey) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const slug = slugify(title, { lower: true, strict: true }) + "-" + Date.now().toString(36);

    const product = await prisma.product.create({
      data: {
        slug,
        title,
        caption,
        description,
        priceInr: Math.round(parseFloat(priceInr) * 100),
        priceUsd: Math.round(parseFloat(priceUsd) * 100),
        category: category || "General",
        coverImage,
        fileKey,
      },
    });

    return Response.json(product, { status: 201 });
  } catch (err) {
    console.error("Product create failed:", err);
    return Response.json(
      { error: `Save failed: ${err.message || "unknown error"}` },
      { status: 500 }
    );
  }
}
