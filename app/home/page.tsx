// 'use client'

import Image from 'next/image';
import { fetchCategories, fetchLatestProducts, fetchTopSellingProducts } from '../lib/data';
import Link from 'next/link';
import { TrendingUp } from 'lucide-react';


export default async function Front() {

  const categories = await fetchCategories();
  const latestProducts = await fetchLatestProducts();
  const topProducts = await fetchTopSellingProducts();
  if (topProducts.length === 0) return null;

  return (
    <>
      {/* Hero Section */}
      <section className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden">
        {/* Background Image */}
        <Image
          src="/handcrafted.png"
          alt="Handcrafted Haven"
          fill
          className="object-cover"
          priority
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent"></div>
        
        {/* Hero Content */}
        <div className="absolute inset-0 flex items-center">
          <div className="container mx-auto px-6 md:px-12 lg:px-20 max-w-7xl">
            <div className="max-w-2xl space-y-6 animate-fade-in">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                Discover Unique
                <span className="block text-[var(--beige)]">Handcrafted Treasures</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-200 leading-relaxed">
                Support local sellers and find unique items made with passion and craftsmanship. List your handcrafted item with us!
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Link 
                  href="/product-list"
                  className="bg-[var(--rust)] hover:bg-[#b54e2e] text-white font-semibold px-8 py-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                >
                  Shop Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
       {/* Latest product section */}
      <section>
        <div className="bg-[var(--rust)] text-white px-6 py-3 flex items-center justify-between">
          <h2 className="text-2xl font-bold">LATEST PRODUCTS</h2>
          <Link 
            href="/product-list?sort=latest"
            className="text-white hover:underline font-semibold text-sm flex items-center gap-1"
          >
            View All →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 px-6 py-6 justify-items-center">
          {latestProducts.map((product) => (
            <article
              key={product.id}
              className="group bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden w-[280px] md:w-[280px] lg:w-[340px]"
            >
              <Link href={`/product/${product.id}`}>
                <div className="p-2">
                  <div className="relative h-64 rounded-md overflow-hidden">
                    <Image
                      src={product.ProductImage?.[0]?.url || '/categories/default.png'}
                      alt={product.title}
                      fill
                      sizes="280px"
                      className="object-cover rounded-md transition-transform duration-300 group-hover:scale-105"
                      priority
                    />
                    <h3 className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center font-bold uppercase text-white bg-[var(--rust)] px-4 py-2 w-3/4 transition-colors duration-300 group-hover:bg-white group-hover:text-[var(--rust)]">
                      {product.title}
                    </h3>
                  </div>
                </div>
              </Link>

              <div className="p-4 text-center space-y-1">
                <p className="text-gray-600">
                  <span className="capitalize">{product.category}</span> — ${product.price.toFixed(2)}
                </p>
                <p className="text-xs text-gray-400">
                  Added {new Date(product.createdAt).toLocaleDateString()}
                </p>
              </div>
            </article>

          ))}
        </div>
      </section>
          {/* Best seller section */}
      <section>
        <div className="bg-[var(--rust)] text-white px-6 py-3 flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            BEST SELLERS
          </h2>
          <Link 
            href="/product-list?sort=bestsellers"
            className="text-white hover:underline font-semibold text-sm flex items-center gap-1"
          >
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 px-6 py-6 justify-items-center">
          {topProducts.map((product) => (
            <article
              key={product.id}
              className="group bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden w-[280px] md:w-[280px] lg:w-[340px] relative"
            >
              {/* Popular badge */}
              <div className="absolute top-2 right-2 z-20 bg-amber-400 text-xs font-bold px-2 py-1 rounded shadow-sm">
                POPULAR
              </div>

              <Link href={`/product/${product.id}`}>
                <div className="p-2">
                  <div className="relative h-64 rounded-md overflow-hidden">
                    <Image
                      src={product.ProductImage?.[0]?.url || '/categories/default.png'}
                      alt={product.title}
                      fill
                      sizes="280px"
                      className="object-cover rounded-md transition-transform duration-300 group-hover:scale-105"
                    />
                    <h3 className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center font-bold uppercase text-white bg-[var(--rust)] px-4 py-2 w-3/4 transition-colors duration-300 group-hover:bg-white group-hover:text-[var(--rust)]">
                      {product.title}
                    </h3>
                  </div>
                </div>
              </Link>

              <div className="p-4 text-center space-y-1">
                <p className="text-gray-600 font-medium">
                  ${product.price.toFixed(2)}
                </p>
                <p className="text-xs text-[var(--rust)] font-semibold">
                  {product.salesCount} units sold
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

             {/* Category section */}
      <section>
        <div className="bg-[var(--rust)] text-white px-6 py-3 flex items-center justify-between">
          <h2 className="text-2xl font-bold">CATEGORIES</h2>
          <Link 
            href="/product-list"
            className="text-white hover:underline font-semibold text-sm flex items-center gap-1"
          >
            View All Products →
          </Link>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-8 px-6 py-6 justify-items-center justify-center">
          {categories.map((item, index) => (
            <Product
              key={index}
              value={item.category}
              count={item.product_count}
            />
          ))}
        </div>
      </section>
    </>
  );
}



export function Product({ value, count }: { value: string; count: number; }) {
  const source = `/categories/${value.toLowerCase()}.png`;

  return (
    <article className="group border rounded-lg bg-white p-4 w-[280px] lg:w-[340px] md:w-[280px] sm:p-2 shadow-md hover:shadow-xl transition-all duration-300">
      <Link key={value} href={`/category/${value.toLowerCase()}`}>
        <div className='relative h-64 w-full overflow-hidden'>
          <Image
            src={source}
            alt={value}
            width={300}
            height={300}
            className="object-cover rounded-md w-full h-full transition-transform duration-300 group-hover:scale-105"
          />
          <h3 className='absolute bottom-4 left-1/2 -translate-x-1/2 text-center font-bold uppercase text-white bg-[var(--rust)] px-4 py-2 w-3/4 transition-colors duration-300 group-hover:bg-white group-hover:text-[var(--rust)]'>
            {value}
          </h3>
        </div>
      </Link>
      <h3 className='text-center font-bold mt-2'>
        Items by Category: <br />{count}
      </h3>
    </article>
  )
}