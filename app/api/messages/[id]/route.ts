import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma';

// PATCH - Mark message as read
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: messageId } = await params;
    const userId = session.user.id;

    // Check if message exists and user is the receiver
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (message.receiverId !== userId) {
      return NextResponse.json(
        { error: 'You can only mark your own messages as read' },
        { status: 403 }
      );
    }

    // Update message to mark as read
    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: { isRead: true },
    });

    return NextResponse.json({ message: updatedMessage }, { status: 200 });
  } catch (error) {
    console.error('Error marking message as read:', error);
    return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
  }
}
