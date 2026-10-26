import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { generateDownloadToken } from "@/lib/download-token";

export async function POST(req) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
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
        amount: product.priceUsd,
        currency: "usd",
        provider: "stripe",
        providerRef: "",
        status: "pending",
        downloadToken: generateDownloadToken(),
      },
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      payment_method_types: ["card", "paypal"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: product.title, description: product.caption },
            unit_amount: product.priceUsd,
          },
          quantity: 1,
        },
      ],
      metadata: { orderId: order.id, productId: product.id },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/order-confirmation?ref=${order.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/products/${product.slug}`,
    });

    await prisma.order.update({ where: { id: order.id }, data: { providerRef: session.id } });

    return Response.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout failed:", err);
    return Response.json(
      { error: `Could not start Stripe checkout: ${err.message || "unknown error"}` },
      { status: 500 }
    );
  }
}
