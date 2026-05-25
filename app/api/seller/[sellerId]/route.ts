import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET( //API route to get seller info/products 
  req: Request,
  context: { params: Promise<{ sellerId: string }> }
) {
  const { sellerId } = await context.params;

  console.log("API sellerId:", sellerId);

  try {
    const seller = await prisma.user.findUnique({ // get seller info and their products
      where: { 
        id: sellerId,
        role: 'SELLER', // Only show if user is an active seller
      },
      select: {
        id: true,
        name: true,
        shopName: true,
        bio: true,
        Product: {
          select: {
            id: true,
            title: true,
            price: true,
            ProductImage: { select: { url: true }, take: 1 },
          },
        },
      },
    });

    if (!seller) {
      return NextResponse.json({ seller: null }, { status: 404 });
    }

    const products = seller.Product.map((product) => ({
      id: product.id,
      title: product.title,
      price: product.price,
      imageUrl: product.ProductImage[0]?.url ?? null,
    }));

    return NextResponse.json({ // return seller info and products
      seller: {
        id: seller.id,
        name: seller.name,
        shopName: seller.shopName,
        bio: seller.bio,
        products,
      },
    });
  } catch (error) {
    console.error("Seller API error:", error);
    return NextResponse.json({ seller: null }, { status: 500 });
  }
}
