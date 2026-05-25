import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return Response.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Increment the view count for the product
    const product = await prisma.product.update({
      where: { id },
      data: {
        views: {
          increment: 1,
        },
      },
      select: {
        id: true,
        views: true,
      },
    });

    return Response.json({ 
      success: true, 
      views: product.views 
    });

  } catch (error) {
    console.error('Error tracking product view:', error);
    return Response.json(
      { error: 'Failed to track view' },
      { status: 500 }
    );
  }
}
