import { prisma } from "@/lib/prisma";
import { getPresignedDownloadUrl } from "@/lib/signed-download";

export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  try {
    const order = await prisma.order.findUnique({
      where: { downloadToken: params.token },
      include: { product: true },
    });

    if (!order || order.status !== "paid") {
      return new Response("Invalid or expired download link.", { status: 404 });
    }

    const url = await getPresignedDownloadUrl(order.product.fileKey);

    await prisma.order.update({
      where: { id: order.id },
      data: { downloadCount: { increment: 1 } },
    });

    return Response.redirect(url, 302);
  } catch (err) {
    console.error("Download failed:", err);
    return new Response(`Could not prepare your download: ${err.message || "unknown error"}`, { status: 500 });
  }
}
