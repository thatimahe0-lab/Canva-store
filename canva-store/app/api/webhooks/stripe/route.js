import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { sendDownloadEmail } from "@/lib/email";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Stripe requires the raw body to verify the webhook signature.
export const config = { api: { bodyParser: false } };

export async function POST(req) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return Response.json({ error: `Webhook signature invalid: ${err.message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata.orderId;

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: "paid", providerRef: session.payment_intent || session.id },
      include: { product: true },
    });

    // Auto-delivery: email the personal download link the instant payment clears.
    await sendDownloadEmail({
      to: order.customerEmail,
      productTitle: order.product.title,
      downloadToken: order.downloadToken,
    });
  }

  return Response.json({ received: true });
}
