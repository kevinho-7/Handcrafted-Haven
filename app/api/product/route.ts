import { prisma } from "@/lib/prisma";

export async function GET() { // API route to fetch products 
  try {
    const products = await prisma.product.findMany({
      where: {
        User: {
          NOT: {
            name: 'Deleted User',
          },
          role: 'SELLER', // Only show products from active sellers
        },
      },
      include: {
        ProductImage: true,
        Review: true,
        OrderItem: true, // Include order items to calculate sales count
        User: { // Include seller information
          select: {
            id: true,
            name: true,
            shopName: true,
          },
        },
      },
      orderBy: { // Order products by creation date, newest first
        createdAt: "desc",
      },
    });

    // Calculate sales count for each product
    const productsWithSalesCount = products.map(product => {
      const salesCount = product.OrderItem.reduce((total, item) => total + item.quantity, 0);
      const { OrderItem, ...productWithoutOrderItems } = product;
      return {
        ...productWithoutOrderItems,
        salesCount,
      };
    });

    return new Response(JSON.stringify({ products: productsWithSalesCount }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Failed to fetch products" }), { status: 500 });
  }
}