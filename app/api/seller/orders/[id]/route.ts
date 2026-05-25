import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth/server';

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await context.params;
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

    const { status } = await req.json();

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Verify the order contains this seller's products
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        OrderItem: {
          some: {
            Product: {
              sellerId: userId,
            },
          },
        },
      },
      include: {
        OrderItem: {
          where: {
            Product: {
              sellerId: userId,
            },
          },
          include: {
            Product: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found or unauthorized' },
        { status: 404 }
      );
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    // Create notification for the buyer
    const productTitles = order.OrderItem.map(item => item.Product.title).join(', ');
    const statusMessages: Record<string, string> = {
      'PROCESSING': 'is being processed',
      'SHIPPED': 'has been shipped',
      'DELIVERED': 'has been delivered',
      'REFUNDED': 'has been refunded',
      'CANCELLED': 'has been cancelled',
    };

    await prisma.notification.create({
      data: {
        userId: order.userId,
        title: 'Order Status Update',
        message: `Your order #${orderId.slice(0, 8)} ${statusMessages[status] || `status updated to ${status}`}`,
        type: 'info',
        link: `/account/orders/${orderId}`,
      },
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}
