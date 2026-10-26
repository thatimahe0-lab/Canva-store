import Razorpay from "razorpay";
import { prisma } from "@/lib/prisma";
import { generateDownloadToken } from "@/lib/download-token";

export async function POST(req) {
  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const { productId, email } = await req.json();

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.published) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    // Order is created up front in "pending" state; the webhook flips it to
    // "paid" and triggers delivery. This avoids trusting anything from the client.
    const order = await prisma.order.create({
      data: {
        productId: product.id,
        customerEmail: email,
        amount: product.priceInr,
        currency: "inr",
        provider: "razorpay",
        providerRef: "",
        status: "pending",
        downloadToken: generateDownloadToken(),
      },
    });

    // Razorpay's Checkout automatically shows UPI apps (Google Pay, PhonePe,
    // Paytm), cards, netbanking and wallets - no extra config needed per app.
    const rpOrder = await razorpay.orders.create({
      amount: product.priceInr,
      currency: "INR",
      receipt: order.id,
      notes: { orderId: order.id, productId: product.id },
    });

    await prisma.order.update({ where: { id: order.id }, data: { providerRef: rpOrder.id } });

    return Response.json({
      orderId: rpOrder.id,
      amount: rpOrder.amount,
      keyId: process.env.RAZORPAY_KEY_ID,
      productTitle: product.title,
    });
  } catch (err) {
    // Razorpay's SDK often throws an object with .error.description holding
    // the real reason (bad key, amount too small, account not activated, etc).
    const detail = err?.error?.description || err.message || "unknown error";
    console.error("Razorpay checkout failed:", err);
    return Response.json({ error: `Could not start Razorpay checkout: ${detail}` }, { status: 500 });
  }
}
