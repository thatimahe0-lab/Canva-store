import { prisma } from "@/lib/prisma";
import { getPrivateFileBuffer } from "@/lib/storage";

export async function GET(req, { params }) {
  const order = await prisma.order.findUnique({
    where: { downloadToken: params.token },
    include: { product: true },
  });

  if (!order || order.status !== "paid") {
    return new Response("Invalid or expired download link.", { status: 404 });
  }

  let fileBuffer;
  try {
    fileBuffer = await getPrivateFileBuffer(order.product.fileKey);
  } catch {
    return new Response("File not found - contact support.", { status: 404 });
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { downloadCount: { increment: 1 } },
  });

  const filename = order.product.fileKey.split("/").pop();
  return new Response(fileBuffer, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
