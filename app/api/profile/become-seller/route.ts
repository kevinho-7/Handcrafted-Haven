import { auth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const { data: session } = await auth.getSession();
    
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Update user role to SELLER
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        role: 'SELLER',
      },
    });

    return Response.json({
      success: true,
      user: {
        id: updatedUser.id,
        role: updatedUser.role,
      },
    });

  } catch (error) {
    console.error('Become seller error:', error);
    return Response.json(
      { error: 'Failed to update user role' },
      { status: 500 }
    );
  }
}
