import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendDownloadEmail } from "@/lib/email";

export async function POST(req) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  if (expected !== signature) {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody);

  if (event.event === "payment.captured") {
    const payment = event.payload.payment.entity;
    const orderId = payment.notes.orderId;

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: "paid", providerRef: payment.id },
      include: { product: true },
    });

    await sendDownloadEmail({
      to: order.customerEmail,
      productTitle: order.product.title,
      downloadToken: order.downloadToken,
    });
  }

  return Response.json({ received: true });
}
