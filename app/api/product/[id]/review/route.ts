import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth/server';

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await context.params;

    const sessionData = await auth.getSession();
    const userId = sessionData?.data?.session?.userId;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { rating, comment } = await req.json();

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Check if the product exists and get seller info
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { 
        sellerId: true,
        title: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Prevent users from reviewing their own products
    if (product.sellerId === userId) {
      return NextResponse.json(
        { error: 'You cannot review your own products' },
        { status: 403 }
      );
    }

    // Check if user has purchased this product
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId: productId,
        Order: {
          userId: userId,
        },
      },
    });

    if (!hasPurchased) {
      return NextResponse.json(
        { error: 'You can only review products you have purchased' },
        { status: 403 }
      );
    }

    // Check if user has already reviewed this product
    const existingReview = await prisma.review.findFirst({
      where: {
        userId: userId,
        productId: productId,
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this product. Please edit your existing review.' },
        { status: 400 }
      );
    }

    const newReview = await prisma.review.create({
      data: {
        rating,
        comment,
        userId,
        productId,
      },
      include: {
        User: {
          select: {
            name: true,
            shopName: true,
          },
        },
      },
    });

    // Create notification for the product seller
    const reviewerName = newReview.User.name || 'Someone';
    await prisma.notification.create({
      data: {
        userId: product.sellerId,
        type: 'REVIEW',
        title: 'New Product Review',
        message: `${reviewerName} left a ${newReview.rating}-star review on "${product.title}"`,
        link: `/product/${productId}#review-${newReview.id}`,
      },
    });

    return NextResponse.json({ success: true, review: newReview });
  } catch (error) {
    console.error('Error submitting review:', error);
    return NextResponse.json(
      { error: 'Failed to submit review' },
      { status: 500 }
    );
  }
}

// Edit review
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await context.params;

    const sessionData = await auth.getSession();
    const userId = sessionData?.data?.session?.userId;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reviewId, rating, comment } = await req.json();

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Verify the review exists and belongs to the user
    const existingReview = await prisma.review.findFirst({
      where: {
        id: reviewId,
        userId: userId,
        productId: productId,
      },
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: 'Review not found or you do not have permission to edit it' },
        { status: 404 }
      );
    }

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        rating,
        comment,
      },
      include: {
        User: {
          select: {
            name: true,
            shopName: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, review: updatedReview });
  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    );
  }
}

// Delete review
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await context.params;

    const sessionData = await auth.getSession();
    const userId = sessionData?.data?.session?.userId;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reviewId } = await req.json();

    // Verify the review exists and belongs to the user, can't delete reviews that aren't your own(yeah... let's not be like other stores. :P )
    const existingReview = await prisma.review.findFirst({
      where: {
        id: reviewId,
        userId: userId,
        productId: productId,
      },
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: 'Review not found or you do not have permission to delete it' },
        { status: 404 }
      );
    }

    await prisma.review.delete({
      where: { id: reviewId },
    });

    return NextResponse.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    );
  }
}
