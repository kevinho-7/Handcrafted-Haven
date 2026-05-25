import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Helper to convert string to Title Case
function toTitleCase(text: string) {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export async function GET() {
  try {
    // Fetch all distinct categories from DB
    const categoriesRaw: { category: string }[] = await prisma.product.findMany({
      where: {
        User: {
          NOT: {
            name: 'Deleted User',
          },
          role: 'SELLER',
        },
      },
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    });

    // Merge duplicates by lowercase key
    const categoryMap = new Map<string, string>();
    for (const { category } of categoriesRaw) {
      const lower = category.toLowerCase();
      if (!categoryMap.has(lower)) {
        categoryMap.set(lower, toTitleCase(category));
      }
    }

    // Convert map to array
    const categories = Array.from(categoryMap.values());

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Category API error:", error);
    return NextResponse.json({ categories: [] }, { status: 500 });
  }
}
