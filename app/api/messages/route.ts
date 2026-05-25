import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma';

// GET all messages for the current user (both sent and received)
export async function GET(req: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get all messages where user is either sender or receiver
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
      },
      include: {
        Sender: {
          select: {
            id: true,
            name: true,
            email: true,
            shopName: true,
          },
        },
        Receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            shopName: true,
          },
        },
        Product: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ messages, userId }, { status: 200 });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST - Create a new message
export async function POST(req: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized - You Must be logged in to send messages' }, { status: 401 });
    }

    const body = await req.json();
    const { subject, content, receiverId, productId, sendAsShop } = body;

    // Validate required fields
    if (!subject || !content || !receiverId) {
      return NextResponse.json(
        { error: 'Subject, content, and receiverId are required' },
        { status: 400 }
      );
    }

    // Prevent users from messaging themselves
    if (session.user.id === receiverId) {
      return NextResponse.json(
        { error: 'Cannot send message to yourself' },
        { status: 400 }
      );
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        subject,
        content,
        senderId: session.user.id,
        receiverId,
        productId: productId || null,
        sendAsShop: sendAsShop || false,
      },
      include: {
        Sender: {
          select: {
            id: true,
            name: true,
            email: true,
            shopName: true,
          },
        },
        Receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            shopName: true,
          },
        },
        Product: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Create notification for the receiver
    const senderName = sendAsShop && message.Sender.shopName 
      ? message.Sender.shopName 
      : message.Sender.name || 'Someone';
      
    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: 'MESSAGE',
        title: `New message from ${senderName}`,
        message: subject,
        link: `/account/messages`,
        messageId: message.id,
      },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
