import Razorpay from "razorpay";
import { prisma } from "@/lib/prisma";
import { generateDownloadToken } from "@/lib/download-token";



export async function POST(req) {const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  const { productId, email } = await req.json();

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.published) {
    return Response.json({ error: "Product not found" }, { status: 404 });
  }

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
}
