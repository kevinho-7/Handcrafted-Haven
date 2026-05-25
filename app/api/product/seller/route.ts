import { auth } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma';

// Get all products for the current seller
export async function GET() {
  try {
    const { data: session } = await auth.getSession();
    
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      where: {
        sellerId: session.user.id,
      },
      include: {
        ProductImage: true,
        Review: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return Response.json({ products });
  } catch (error) {
    console.error('Error fetching seller products:', error);
    return Response.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// Create a new product
export async function POST(request: Request) {
  try {
    const { data: session } = await auth.getSession();
    
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, price, category, stock, images } = body;

    // Validate required fields
    if (!title || !description || !price || !category) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        category,
        stock: stock ? parseInt(stock) : 1,
        sellerId: session.user.id,
        ProductImage: images && images.length > 0 ? {
          create: images.map((url: string) => ({ url })),
        } : undefined,
      },
      include: {
        ProductImage: true,
      },
    });

    return Response.json({ success: true, product });
  } catch (error) {
    console.error('Error creating product:', error);
    return Response.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

// Update a product
export async function PUT(request: Request) {
  try {
    const { data: session } = await auth.getSession();
    
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, description, price, category, stock, images } = body;

    if (!id) {
      return Response.json({ error: 'Product ID required' }, { status: 400 });
    }

    // Validate required fields
    if (!title || !description || !price || !category) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify product belongs to seller and get existing images
    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        sellerId: session.user.id,
      },
      include: {
        ProductImage: true,
      },
    });

    if (!existingProduct) {
      return Response.json(
        { error: 'Product not found or unauthorized' },
        { status: 404 }
      );
    }

    // Check if image URL has changed
    const existingImageUrl = existingProduct.ProductImage[0]?.url;
    const newImageUrl = images && images.length > 0 ? images[0] : null;
    const imageChanged = newImageUrl && newImageUrl !== existingImageUrl;

    // Only delete existing images from blob storage if the image URL has changed
    if (imageChanged && existingProduct.ProductImage.length > 0) {
      const { del } = await import('@vercel/blob');
      for (const image of existingProduct.ProductImage) {
        try {
          await del(image.url);
        } catch (err) {
          console.error('Failed to delete old image from blob:', err);
          // Continue even if blob deletion fails
        }
      }

      // Delete image records from database
      await prisma.productImage.deleteMany({
        where: { productId: id },
      });
    }

    // Update product
    const product = await prisma.product.update({
      where: { id },
      data: {
        title,
        description,
        price: parseFloat(price),
        category,
        stock: stock ? parseInt(stock) : 1,
        // Only create new image records if the image URL changed
        ProductImage: imageChanged ? {
          create: images.map((url: string) => ({ url })),
        } : undefined,
      },
      include: {
        ProductImage: true,
      },
    });

    return Response.json({ success: true, product });
  } catch (error) {
    console.error('Error updating product:', error);
    return Response.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// Delete a product
export async function DELETE(request: Request) {
  try {
    const { data: session } = await auth.getSession();
    
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('id');

    if (!productId) {
      return Response.json({ error: 'Product ID required' }, { status: 400 });
    }

    // Verify product belongs to seller and get images
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        sellerId: session.user.id,
      },
      include: {
        ProductImage: true,
      },
    });

    if (!product) {
      return Response.json(
        { error: 'Product not found or unauthorized' },
        { status: 404 }
      );
    }

    // Delete images from blob storage
    if (product.ProductImage && product.ProductImage.length > 0) {
      const { del } = await import('@vercel/blob');
      for (const image of product.ProductImage) {
        try {
          await del(image.url);
        } catch (err) {
          console.error('Failed to delete image from blob:', err);
          // Continue even if blob deletion fails
        }
      }
    }

    // Delete product
    await prisma.product.delete({
      where: { id: productId },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return Response.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
