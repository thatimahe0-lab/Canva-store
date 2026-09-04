import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { uploadPublicFile, uploadPrivateFile } from "@/lib/storage";
import slugify from "slugify";

export async function GET() {
  const unauthorized = requireAdmin();
  if (unauthorized) return unauthorized;

  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
  return Response.json(products);
}

// Accepts multipart/form-data: title, caption, description, priceInr, priceUsd,
// category, coverImage (image file), templateFile (the actual .zip/.canva/.pdf).
export async function POST(req) {
  const unauthorized = requireAdmin();
  if (unauthorized) return unauthorized;

  const form = await req.formData();
  const title = form.get("title");
  const caption = form.get("caption");
  const description = form.get("description");
  const priceInr = Math.round(parseFloat(form.get("priceInr")) * 100);
  const priceUsd = Math.round(parseFloat(form.get("priceUsd")) * 100);
  const category = form.get("category") || "General";
  const coverImage = form.get("coverImage");
  const templateFile = form.get("templateFile");

  if (!title || !coverImage || !templateFile) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const slug = slugify(title, { lower: true, strict: true }) + "-" + Date.now().toString(36);

  // Cover image -> public bucket (renders on the site + as the social share preview)
  const coverExt = coverImage.name.split(".").pop();
  const coverKey = `covers/${slug}-cover.${coverExt}`;
  const coverUrl = await uploadPublicFile(
    Buffer.from(await coverImage.arrayBuffer()),
    coverKey,
    coverImage.type
  );

  // Template file -> private bucket (NEVER public, only reachable via /api/download/:token)
  const fileKey = `templates/${slug}-${templateFile.name}`;
  await uploadPrivateFile(
    Buffer.from(await templateFile.arrayBuffer()),
    fileKey,
    templateFile.type
  );

  const product = await prisma.product.create({
    data: {
      slug,
      title,
      caption,
      description,
      priceInr,
      priceUsd,
      category,
      coverImage: coverUrl,
      fileKey,
    },
  });

  return Response.json(product, { status: 201 });
}

