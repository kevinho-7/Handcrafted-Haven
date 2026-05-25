import { prisma } from "@/lib/prisma";

export async function GET( // API route to fetch product details by ID, including images and reviews
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        ProductImage: true,
        Review: {
          include: {
            User: {
              select: {
                name: true,
                shopName: true,
              },
            },
          },
        },
        User: true,
      },
    });

    if (!product) {
      return new Response(JSON.stringify({ error: "Product not found" }), { status: 404 });
    }

    return new Response(JSON.stringify({ product }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Failed to fetch product" }), { status: 500 });
  }
}