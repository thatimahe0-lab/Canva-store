import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function PATCH(req, { params }) {
  const unauthorized = requireAdmin();
  if (unauthorized) return unauthorized;

  const body = await req.json(); // e.g. { published: false } or field edits
  const product = await prisma.product.update({ where: { id: params.id }, data: body });
  return Response.json(product);
}

export async function DELETE(req, { params }) {
  const unauthorized = requireAdmin();
  if (unauthorized) return unauthorized;

  await prisma.product.delete({ where: { id: params.id } });
  return Response.json({ ok: true });
}
