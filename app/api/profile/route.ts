import { auth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const { data: session } = await auth.getSession();
    
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const sessionUser = session.user;

    // Try to find user in custom User table
    let user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        Product: {
          select: { id: true },
        },
        Order: {
          orderBy: { createdAt: 'desc' },
          take: 3,
          include: {
            OrderItem: {
              include: {
                Product: true,
              },
            },
          },
        },
      },
    });

    // If user doesn't exist in custom table, create them from Neon Auth session data
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: userId,
          email: sessionUser.email,
          name: sessionUser.name || null,
          image: sessionUser.image || null,
          role: 'USER',
        },
        include: {
          Product: {
            select: { id: true },
          },
          Order: {
            orderBy: { createdAt: 'desc' },
            take: 3,
            include: {
              OrderItem: {
                include: {
                  Product: true,
                },
              },
            },
          },
        },
      });
    }

    const isSeller = user.role === 'SELLER' || user.Product.length > 0;

    const memberSince = new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric',
    }).format(new Date(user.createdAt));

    const recentOrders = user.Order.map((order: any) => {
      const orderTotal = order.OrderItem.reduce((sum: number, item: any) => {
        return sum + (item.price * item.quantity);
      }, 0);

      const daysAgo = Math.floor(
        (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      const timeAgo = 
        daysAgo === 0 ? 'Today' :
        daysAgo === 1 ? 'Yesterday' :
        daysAgo < 7 ? `${daysAgo} days ago` :
        daysAgo < 30 ? `${Math.floor(daysAgo / 7)} weeks ago` :
        `${Math.floor(daysAgo / 30)} months ago`;

      return {
        id: order.id,
        displayId: order.id.slice(0, 8),
        total: orderTotal,
        status: order.status,
        timeAgo,
        itemCount: order.OrderItem.reduce((sum: number, item: any) => sum + item.quantity, 0),
      };
    });

    return Response.json({
      user: {
        name: user.name || 'User',
        email: user.email,
        phone: user.phone,
        address: user.address,
        shopName: user.shopName,
        bio: user.bio,
        image: user.image,
        isSeller,
        memberSince,
        role: user.role,
        profileComplete: user.profileComplete,
      },
      recentOrders,
      stats: {
        totalOrders: user.Order.length,
        totalProducts: user.Product.length,
      },
    });

  } catch (error) {
    console.error('Profile API error:', error);
    return Response.json(
      { error: 'Failed to fetch profile data' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { data: session } = await auth.getSession();
    
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: body.name,
        phone: body.phone,
        address: body.address,
        shopName: body.shopName,
        bio: body.bio,
      },
    });

    return Response.json({
      success: true,
      user: {
        name: updatedUser.name,
        phone: updatedUser.phone,
        address: updatedUser.address,
        shopName: updatedUser.shopName,
        bio: updatedUser.bio,
      },
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return Response.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { data: session } = await auth.getSession();
    
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();

    // Validate required fields for profile completion
    if (!body.name || !body.phone || !body.address) {
      return Response.json(
        { error: 'Name, phone, and address are required' },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: body.name,
        phone: body.phone,
        address: body.address,
        profileComplete: body.profileComplete !== undefined ? body.profileComplete : true,
      },
    });

    return Response.json({
      success: true,
      user: {
        name: updatedUser.name,
        phone: updatedUser.phone,
        address: updatedUser.address,
        profileComplete: updatedUser.profileComplete,
      },
    });

  } catch (error) {
    console.error('Profile completion error:', error);
    return Response.json(
      { error: 'Failed to complete profile' },
      { status: 500 }
    );
  }
}
