import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    // If the search term is empty, return empty array
    if (!query.trim()) {
      return NextResponse.json({ products: [] });
    }

    // Search products by title (or you can add description, etc.)
    const products = await prisma.product.findMany({
      where: {
        title: {
          contains: query,
          mode: "insensitive", // case-insensitive
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
        category: true,
        ProductImage: {
          select: { url: true },
          take: 1,
        },
      },
    });

    return NextResponse.json({ products });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ products: [] }, { status: 500 });
  }
}
