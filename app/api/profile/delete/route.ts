import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth/server';

export async function POST(req: Request) {
  try {
    const sessionData = await auth.getSession();
    const userId = sessionData?.data?.session?.userId;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Anonymize user data instead of deleting to preserve order history
    await prisma.user.update({
      where: { id: userId },
      data: {
        name: 'Deleted User',
        email: `deleted_${userId}@deleted.com`,
        image: null,
        phone: null,
        address: null,
        shopName: null,
        bio: null,
        role: 'USER',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
