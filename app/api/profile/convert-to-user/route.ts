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

    // Check if user is currently a seller
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role !== 'SELLER') {
      return NextResponse.json(
        { error: 'You are not a seller' },
        { status: 400 }
      );
    }

    // Convert seller back to regular user
    await prisma.user.update({
      where: { id: userId },
      data: { role: 'USER' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error converting to user:', error);
    return NextResponse.json(
      { error: 'Failed to convert account' },
      { status: 500 }
    );
  }
}
