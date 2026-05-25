import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth/server';

export async function POST(
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

    const { reason } = await req.json();

    if (!reason) {
      return NextResponse.json(
        { error: 'Cancellation reason is required' },
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
          include: {
            Product: {
              select: {
                id: true,
                title: true,
                sellerId: true,
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

    // Update order status, cancellation reason, and conditionally increment inventory
    await prisma.$transaction(async (tx) => {
      // Update order to REFUNDED status
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'REFUNDED',
          cancellationReason: reason,
        },
      });

      // Only increment inventory if order was not yet shipped (PENDING or PROCESSING)
      // For SHIPPED/DELIVERED, customer has the item so don't add the item back into the inventory
      const shouldRestoreInventory = order.status === 'PENDING' || order.status === 'PROCESSING';
      
      if (shouldRestoreInventory) {
        for (const item of order.OrderItem) {
          if (item.Product.sellerId === userId) {
            await tx.product.update({
              where: { id: item.Product.id },
              data: {
                stock: {
                  increment: item.quantity,
                },
              },
            });
          }
        }
      }

      // Create notification for the buyer
      await tx.notification.create({
        data: {
          userId: order.userId,
          title: 'Order Cancelled & Refunded',
          message: `Your order #${orderId.slice(0, 8)} has been ${shouldRestoreInventory ? 'cancelled' : 'refunded'} by the seller. Reason: ${reason}`,
          type: 'info',
          link: `/account/orders/${orderId}`,
        },
      });
    });

    return NextResponse.json({ success: true, message: 'Order cancelled and refunded successfully' });
  } catch (error) {
    console.error('Error cancelling order:', error);
    return NextResponse.json(
      { error: 'Failed to cancel order' },
      { status: 500 }
    );
  }
}
