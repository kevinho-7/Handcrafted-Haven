'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Product {
  id: string;
  title: string;
  price: number;
  ProductImage?: { url: string }[];
}

export default function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('query')?.trim() || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) return;

    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(query)}`)
      .then((res) => res.json())
      .then((data) => setProducts(data.products || []))
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <div className="px-6 py-6">
      <h1 className="text-2xl font-semibold mb-4">
        Search results for "{query}"
      </h1>

      {loading ? (
        <p>Loading...</p>
      ) : products.length === 0 ? (
        <p>No products found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/product/${product.id}`}
              className="border p-4 rounded hover:shadow"
            >
              {product.ProductImage && product.ProductImage[0]?.url && (
                <img
                  src={product.ProductImage[0].url}
                  alt={product.title}
                  className="w-full h-40 object-cover mb-2 rounded"
                />
              )}
              <h2 className="font-medium">{product.title}</h2>
              <p className="text-sm text-gray-700">${product.price.toFixed(2)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
