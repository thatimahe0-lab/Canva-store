import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import BackButton from "@/app/components/BackButton";
import BackToTopButton from "@/app/components/BackToTopButton";
import ShareButton from "@/app/components/ShareButton";
import BuyButtons from "./BuyButtons";

async function getProduct(slug) {
  return prisma.product.findUnique({ where: { slug } });
}

// This is what makes WhatsApp/Facebook/Twitter/iMessage show a rich
// preview card (image + title + description) when a product link is shared.
export async function generateMetadata({ params }) {
  const product = await getProduct(params.slug);
  if (!product) return {};

  const url = `${process.env.NEXT_PUBLIC_SITE_URL}/products/${product.slug}`;

  return {
    title: `${product.title} | TemplateTreasury`,
    description: product.caption,
    openGraph: {
      title: product.title,
      description: product.caption,
      url,
      images: [{ url: product.coverImage, width: 1200, height: 900 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: product.title,
      description: product.caption,
      images: [product.coverImage],
    },
  };
}

export default async function ProductPage({ params }) {
  const product = await getProduct(params.slug);
  if (!product || !product.published) notFound();

  const url = `${process.env.NEXT_PUBLIC_SITE_URL}/products/${product.slug}`;

  return (
    <main className="container" style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <BackButton />
        <ShareButton url={url} title={product.title} text={product.caption} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
        <img src={product.coverImage} alt={product.title} style={{ width: "100%", borderRadius: 12 }} />
        <div>
          <h1>{product.title}</h1>
          <p style={{ color: "#555" }}>{product.caption}</p>
          <p>{product.description}</p>
          <div style={{ margin: "20px 0", fontSize: 20 }}>
            <span className="price">₹{(product.priceInr / 100).toFixed(0)}</span>
            <span style={{ color: "#999" }}> &nbsp;/&nbsp; ${(product.priceUsd / 100).toFixed(2)}</span>
          </div>
          <BuyButtons productId={product.id} />
        </div>
      </div>

      <BackToTopButton />
    </main>
  );
}
