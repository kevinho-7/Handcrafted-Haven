import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  context: { params: Promise<{ category: string }> }
) {
  try {

    const { category } = await context.params;

    const products = await prisma.product.findMany({
      where: { 
        category: {
          equals: category,
          mode: 'insensitive', // Case-insensitive search
        },
        User: {
          NOT: {
            name: 'Deleted User',
          },
          role: 'SELLER',
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
      orderBy: {
        createdAt: 'desc',
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

    return NextResponse.json({ products: productsWithSalesCount }, { status: 200 });
  } catch (err) {
    console.error('Category API error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch products by category' },
      { status: 500 }
    );
  }
}
