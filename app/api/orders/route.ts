import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth/server';

export async function GET() {
  try {
    const { data: session } = await auth.getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        OrderItem: {
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
    });

    // Transform the orders to include item count and total
    const formattedOrders = orders.map((order) => ({
      id: order.id,
      total: order.total,
      status: order.status,
      createdAt: order.createdAt,
      cancellationReason: order.cancellationReason,
      itemCount: order.OrderItem.reduce((sum, item) => sum + item.quantity, 0),
      OrderItem: order.OrderItem,
    }));

    return NextResponse.json(formattedOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, total, customer } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Cart is empty' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: customer.userId },
        data: {
          phone: customer.phone,
          address: customer.address,
        },
      });

      // Update inventory for each product
      for (const item of items) {
        await tx.product.update({
          where: { id: item.id },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      const newOrder = await tx.order.create({
        data: {
          userId: customer.userId,
          total: total,
          status: 'PENDING',
          OrderItem: {
            create: items.map((item: any) => ({
              productId: item.id,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
        include: {
          OrderItem: {
            include: {
              Product: {
                select: {
                  sellerId: true,
                  title: true,
                },
              },
            },
          },
        },
      });

      // Create notifications for sellers
      const sellerNotifications = new Map<string, { products: string[]; total: number }>();
      
      for (const orderItem of newOrder.OrderItem) {
        const sellerId = orderItem.Product.sellerId;
        const productTitle = orderItem.Product.title;
        const itemTotal = orderItem.price * orderItem.quantity;
        
        if (!sellerNotifications.has(sellerId)) {
          sellerNotifications.set(sellerId, { products: [], total: 0 });
        }
        
        const sellerData = sellerNotifications.get(sellerId)!;
        sellerData.products.push(`${productTitle} (x${orderItem.quantity})`);
        sellerData.total += itemTotal;
      }

      // Create notification for each seller
      for (const [sellerId, data] of sellerNotifications) {
        await tx.notification.create({
          data: {
            userId: sellerId,
            title: 'New Sale!',
            message: `You sold: ${data.products.join(', ')} - Total: $${data.total.toFixed(2)}`,
            type: 'ORDER',
            link: '/account/dashboard/orders',
          },
        });
      }

      return newOrder;
    });

    return NextResponse.json({ 
      success: true, 
      orderId: result.id 
    });

  } catch (err: any) {
    console.error('Error processing order:', err);
    
    if (err.code === 'P2003') {
      return NextResponse.json(
        { success: false, error: 'One of the products does not exist in the database' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal error processing the order' },
      { status: 500 }
    );
  }
}