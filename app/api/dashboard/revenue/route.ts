import { auth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const revenuePeriod = searchParams.get('period') || 'month';

    // Get the authenticated user
    const { data: session } = await auth.getSession();
    
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Calculate revenue based on selected period
    let revenueStartDate: Date | undefined;
    
    if (revenuePeriod === 'month') {
      // Month to date (first day of current month)
      const now = new Date();
      revenueStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (revenuePeriod === 'year') {
      // Year to date (first day of current year)
      const now = new Date();
      revenueStartDate = new Date(now.getFullYear(), 0, 1);
    }
    // If 'total', revenueStartDate remains undefined (no date filter)
    
    const revenueOrders = await prisma.order.findMany({
      where: {
        ...(revenueStartDate && { createdAt: { gte: revenueStartDate } }),
        status: {
          notIn: ['CANCELLED', 'REFUNDED'],
        },
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
        },
      },
    });

    const revenue = revenueOrders.reduce((sum: number, order: any) => {
      const orderTotal = order.OrderItem.reduce((itemSum: number, item: any) => {
        return itemSum + (item.price * item.quantity);
      }, 0);
      return sum + orderTotal;
    }, 0);

    return Response.json({
      revenue: Math.round(revenue * 100) / 100,
    });

  } catch (error) {
    console.error('Revenue API error:', error);
    return Response.json(
      { error: 'Failed to fetch revenue data' },
      { status: 500 }
    );
  }
}
