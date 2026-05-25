'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Store, Package, ShoppingBag } from 'lucide-react';

interface Product { //matches product model in prisma schema
  id: string;
  title: string;
  price: number;
  imageUrl?: string;
}

interface Seller { // matches seller model in prisma schema
  id: string;
  name?: string;
  shopName?: string;
  bio?: string;
  products: Product[];
}

export default function SellerPage() { //seller page component - fetches seller data and products and displays them in a grid
  const params = useParams(); //  get full params object
  const sellerId = params?.sellerId as string; //  cast to string

  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const handleImageError = (productId: string) => {
    setImageErrors(prev => new Set(prev).add(productId));
  };

  useEffect(() => { // fetch seller data when sellerId changes
    console.log("sellerId:", sellerId);
    if (!sellerId) return;
    
    const fetchSeller = async () => { //fetches seller info and products from API route
      try {
        const res = await fetch(`/api/seller/${sellerId}`);
        const data = await res.json();
        setSeller(data.seller ?? null);
      } catch (err) {
        console.error("Failed to fetch seller:", err);
        setSeller(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSeller();
  }, [sellerId]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--rust)] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading seller information...</p>
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="max-w-6xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Store className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Seller not found.</p>
        </div>
      </div>
    );
  }

  const displayName = seller.shopName || seller.name || "Seller";

  return ( // main seller page content - seller name, bio, products
    <div className="max-w-6xl mx-auto">
      {/* Seller Header Card */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-8">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 bg-[var(--rust)] rounded-full flex items-center justify-center text-white flex-shrink-0">
            <Store className="h-10 w-10" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2 text-[var(--navy)]">{displayName}</h1>
            {seller.bio && (
              <p className="text-gray-700 leading-relaxed">{seller.bio}</p>
            )}
            <div className="mt-4 flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-[var(--rust)]" />
                <span>{seller.products.length} {seller.products.length === 1 ? 'Product' : 'Products'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="rounded-lg p-8">
        <h2 className="text-2xl font-semibold mb-6 text-[var(--navy)] flex items-center gap-2">
          <ShoppingBag className="h-6 w-6 text-[var(--rust)]" />
          Products
        </h2>
        
        {seller.products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No products available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {seller.products.map((product, index) => ( //maps over products and displays them in a grid with links to product pages
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                className="bg-white border border-gray-300 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 group"
              >
                {product.imageUrl && !imageErrors.has(product.id) ? (
                  <div className="relative h-48 bg-gray-100">
                    <Image
                      src={product.imageUrl}
                      alt={product.title}
                      width={400}
                      height={250}
                      style={{ width: '100%', height: '100%' }}
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      loading={index === 0 ? "eager" : "lazy"}
                      priority={index === 0}
                      onError={() => handleImageError(product.id)}
                    />
                  </div>
                ) : (
                  <div className="h-48 bg-gray-100 flex items-center justify-center">
                    <Package className="h-12 w-12 text-gray-300" />
                  </div>
                )}
                <div className="p-4 text-center space-y-3">
                  <h3 className="font-bold uppercase text-white bg-[var(--rust)] px-4 py-2 rounded-md transition-colors duration-300 group-hover:bg-white group-hover:text-[var(--rust)]">
                    {product.title}
                  </h3>

                  <p className="text-lg font-bold text-[var(--rust)]">
                    ${product.price.toFixed(2)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
