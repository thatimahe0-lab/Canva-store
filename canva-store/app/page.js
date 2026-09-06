import { prisma } from "@/lib/prisma";
import StoreFront from "./components/StoreFront";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const products = await prisma.product.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      caption: true,
      priceInr: true,
      priceUsd: true,
      category: true,
      coverImage: true,
    },
  });

  return <StoreFront products={products} />;
}
