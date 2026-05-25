import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth/server';

export async function GET() {
  try {
    const sessionData = await auth.getSession();
    const userId = sessionData?.data?.session?.userId;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a seller
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role !== 'SELLER') {
      return NextResponse.json({ error: 'Access denied. Seller account required.' }, { status: 403 });
    }

    // Get all orders that contain products from this seller
    const orders = await prisma.order.findMany({
      where: {
        OrderItem: {
          some: {
            Product: {
              sellerId: userId,
            },
          },
        },
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        OrderItem: {
          where: {
            Product: {
              sellerId: userId,
            },
          },
          include: {
            Product: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate seller's portion of each order
    const ordersWithSellerTotal = orders.map(order => ({
      ...order,
      sellerTotal: order.OrderItem.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    }));

    return NextResponse.json({ orders: ordersWithSellerTotal });
  } catch (error) {
    console.error('Error fetching seller orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
