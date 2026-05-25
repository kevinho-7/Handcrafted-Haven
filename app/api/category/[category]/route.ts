import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


type ProductWithImage = {
  id: string;
  title: string;
  price: number;
  sellerId: string;
  stock: number;
  User: {
    shopName: string | null;
  } | null;
  ProductImage: { url: string }[];
};

export async function GET(
  req: Request,
  context: { params: Promise<{ category: string }> }
) {
  try {
    const { category } = await context.params; // Extract category from URL params
    const categorySlug = category.toLowerCase();

    const products: ProductWithImage[] = await prisma.product.findMany({
      where: { 
        category: { 
          equals: categorySlug, 
          mode: "insensitive" // <- THIS makes it ignore case
        },
        User: {
          NOT: {
            name: 'Deleted User',
          },
          role: 'SELLER',
        },
      },
      select: {
        id: true,
        title: true,
        price: true,
        sellerId: true,
        stock: true,
        User: {
          select: {
            shopName: true
          }
        },
        ProductImage: {
          select: { url: true },
          take: 1
        }
      }
    });


    return NextResponse.json({ // Map products to include imageUrl field
      products: products.map((product1) => ({
        id: product1.id,
        title: product1.title,
        price: product1.price,
        sellerId: product1.sellerId,
        shopName: product1.User?.shopName ?? null,
        imageUrl: product1.ProductImage[0]?.url ?? null,
        stock: product1.stock
      }))
    });
  } catch (error) {
    console.error("Category API error:", error);
    return NextResponse.json({ products: [] }, { status: 500 });
  }
}
