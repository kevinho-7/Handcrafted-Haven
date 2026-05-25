'use client';

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { Package, ShoppingBag, Filter, SlidersHorizontal, X, ChevronDown, ChevronUp } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";

interface Product { //matches product model is prisma schema
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  sellerId: string;
  createdAt: string;
  salesCount?: number;
  ProductImage: { id: string; url: string }[];
  Review?: { rating: number }[];
  User?: {
    id: string;
    name: string | null;
    shopName: string | null;
  };
}

function ProductListContent() { //main product listing page component
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [sellers, setSellers] = useState<Array<{id: string, name: string}>>([]);
  
  // Filter states
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSellers, setSelectedSellers] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [sortBy, setSortBy] = useState<string>("none");
  const [inStockOnly, setInStockOnly] = useState(false);
  
  // Collapse states
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const [sellersExpanded, setSellersExpanded] = useState(false);
  
  // Pagination
  const [displayCount, setDisplayCount] = useState(12);
  const ITEMS_PER_PAGE = 12;
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const handleImageError = (productId: string) => {
    setImageErrors(prev => new Set(prev).add(productId));
  };

  // Infinite scroll handler
  const loadMore = useCallback(() => {
    if (displayCount < filteredProducts.length && !isLoadingMore) {
      setIsLoadingMore(true);
      setTimeout(() => {
        setDisplayCount(prev => prev + ITEMS_PER_PAGE);
        setIsLoadingMore(false);
      }, 300);
    }
  }, [displayCount, filteredProducts.length, isLoadingMore]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [loadMore]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || []);
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCategories();
  }, []);

  // Initialize filters from URL parameters
  useEffect(() => {
    const sort = searchParams.get('sort');
    const category = searchParams.get('category');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const inStock = searchParams.get('inStock');

    if (sort) setSortBy(sort);
    if (category) setSelectedCategories([category]);
    if (minPrice) setPriceRange(prev => [parseFloat(minPrice), prev[1]]);
    if (maxPrice) setPriceRange(prev => [prev[0], parseFloat(maxPrice)]);
    if (inStock === 'true') setInStockOnly(true);
  }, [searchParams]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/product', {
          cache: "no-store", // ensures fresh data
        });
        const data = await res.json();
        setProducts(data.products || []);
        
        // Extract unique sellers from products
        const uniqueSellers = new Map<string, {id: string, name: string}>();
        (data.products || []).forEach((product: Product) => {
          if (product.User && !uniqueSellers.has(product.User.id)) {
            uniqueSellers.set(product.User.id, {
              id: product.User.id,
              name: product.User.shopName || product.User.name || 'Unknown Seller'
            });
          }
        });
        setSellers(Array.from(uniqueSellers.values()).sort((a, b) => a.name.localeCompare(b.name)));
      } catch (error) {
        console.error('Failed to fetch products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    let result = [...products];

    // Filter by category
    if (selectedCategories.length > 0) {
      result = result.filter(p => selectedCategories.includes(p.category));
    }

    // Filter by seller
    if (selectedSellers.length > 0) {
      result = result.filter(p => p.User && selectedSellers.includes(p.User.id));
    }

    // Filter by price range
    result = result.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    // Filter by stock
    if (inStockOnly) {
      result = result.filter(p => p.stock > 0);
    }

    // Sort products
    switch (sortBy) {
      case 'latest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'bestsellers':
        result.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
        break;
      case 'highest-rated':
        result.sort((a, b) => {
          const avgA = a.Review && a.Review.length > 0 
            ? a.Review.reduce((sum, r) => sum + r.rating, 0) / a.Review.length 
            : 0;
          const avgB = b.Review && b.Review.length > 0 
            ? b.Review.reduce((sum, r) => sum + r.rating, 0) / b.Review.length 
            : 0;
          return avgB - avgA;
        });
        break;
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'name-asc':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'name-desc':
        result.sort((a, b) => b.title.localeCompare(a.title));
        break;
    }

    setFilteredProducts(result);
    setDisplayCount(ITEMS_PER_PAGE); // Reset pagination when filters change
  }, [products, selectedCategories, selectedSellers, priceRange, sortBy, inStockOnly]);

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleSeller = (sellerId: string) => {
    setSelectedSellers(prev => 
      prev.includes(sellerId) 
        ? prev.filter(s => s !== sellerId)
        : [...prev, sellerId]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedSellers([]);
    setPriceRange([0, 1000]);
    setSortBy("none");
    setInStockOnly(false);
    router.push('/product-list');
  };

  const activeFiltersCount = 
    selectedCategories.length + 
    selectedSellers.length +
    (priceRange[0] !== 0 || priceRange[1] !== 1000 ? 1 : 0) +
    (sortBy !== "none" ? 1 : 0) +
    (inStockOnly ? 1 : 0);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--rust)] mx-auto"></div>
          <p className="mt-4 text-black font-semibold">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-[var(--rust)] px-6 py-4 mb-6 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingBag className="h-8 w-8 text-white" />
          <h1 className="text-3xl font-bold text-white">All Products</h1>
        </div>
        
        {/* Mobile filter toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="md:hidden flex items-center gap-2 px-4 py-2 bg-white text-[var(--rust)] rounded-lg hover:bg-gray-100 transition-colors"
        >
          <SlidersHorizontal className="h-5 w-5" />
          Filters
          {activeFiltersCount > 0 && (
            <span className="bg-[var(--rust)] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Sort bar */}
      <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ border: '2px solid #6B7280' }}
            className="bg-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--rust)]"
          >
            <option value="none">None</option>
            <option value="latest">Newest First</option>
            <option value="bestsellers">Best Sellers</option>
            <option value="highest-rated">Highest Rated</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="name-asc">Name: A to Z</option>
            <option value="name-desc">Name: Z to A</option>
          </select>
        </div>
        <div className="text-sm text-gray-700 font-medium">
          {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
        </div>
      </div>

      <div className="flex gap-6">
        {/* Desktop Filter Sidebar */}
        <aside className="hidden md:block w-64 bg-white rounded-lg shadow-sm overflow-hidden h-fit sticky top-4">
          <div className="bg-[var(--rust)] text-white px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Filters
            </h2>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-xs text-white hover:underline font-medium"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            {/* Categories */}
            <div className="mb-4 bg-gray-50 rounded-lg">
              <button
                onClick={() => setCategoriesExpanded(!categoriesExpanded)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-100 rounded-lg transition-colors"
              >
                <h3 className="font-semibold text-gray-800">Categories</h3>
                {categoriesExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {categoriesExpanded && (
                <div className="px-4 pb-4 space-y-2">
                  {categories.map(category => (
                    <label key={category} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category)}
                        onChange={() => toggleCategory(category)}
                        className="rounded border-gray-300 text-[var(--rust)] focus:ring-[var(--rust)]"
                      />
                      <span className="text-sm capitalize">{category}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Sellers */}
            <div className="mb-4 bg-gray-50 rounded-lg">
              <button
                onClick={() => setSellersExpanded(!sellersExpanded)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-100 rounded-lg transition-colors"
              >
                <h3 className="font-semibold text-gray-800">Sellers</h3>
                {sellersExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {sellersExpanded && (
                <div className="px-4 pb-4 space-y-2">
                  {sellers.map(seller => (
                    <label key={seller.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSellers.includes(seller.id)}
                        onChange={() => toggleSeller(seller.id)}
                        className="rounded border-gray-300 text-[var(--rust)] focus:ring-[var(--rust)]"
                      />
                      <span className="text-sm">{seller.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Price Range */}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">Price Range</h3>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={priceRange[0]}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.]/g, '');
                    setPriceRange([parseFloat(val) || 0, priceRange[1]]);
                  }}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  placeholder="Min"
                />
                <span className="text-gray-700 font-medium">-</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={priceRange[1]}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.]/g, '');
                    setPriceRange([priceRange[0], parseFloat(val) || 1000]);
                  }}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  placeholder="Max"
                />
              </div>
            </div>

            {/* Stock Status */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">Availability</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="rounded border-gray-300 text-[var(--rust)] focus:ring-[var(--rust)]"
                />
                <span className="text-sm">In Stock Only</span>
              </label>
            </div>
          </div>
        </aside>

        {/* Mobile Filter Sidebar (Slide-out) */}
        {showFilters && (
          <>
            <div
              className="md:hidden fixed inset-0 bg-black/40 z-40"
              onClick={() => setShowFilters(false)}
            />
            <aside className="md:hidden fixed top-0 right-0 h-full w-80 bg-white z-50 overflow-y-auto shadow-2xl">
              <div className="bg-[var(--rust)] text-white px-6 py-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Filters
                </h2>
                <button onClick={() => setShowFilters(false)} className="p-2">
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>
              
              <div className="p-6">
                {activeFiltersCount > 0 && (
                  <button
                    onClick={() => {
                      clearFilters();
                      setShowFilters(false);
                    }}
                    className="w-full mb-4 px-4 py-2 bg-[var(--rust)] text-white rounded-lg hover:bg-[var(--navy)] text-sm font-medium"
                  >
                    Clear All Filters
                  </button>
                )}

                {/* Categories */}
                <div className="mb-4 bg-gray-50 rounded-lg">
                  <button
                    onClick={() => setCategoriesExpanded(!categoriesExpanded)}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <h3 className="font-semibold text-gray-800">Categories</h3>
                    {categoriesExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  {categoriesExpanded && (
                    <div className="px-4 pb-4 space-y-2">
                      {categories.map(category => (
                        <label key={category} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(category)}
                            onChange={() => toggleCategory(category)}
                            className="rounded border-gray-300 text-[var(--rust)] focus:ring-[var(--rust)]"
                          />
                          <span className="text-sm capitalize">{category}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sellers */}
                <div className="mb-4 bg-gray-50 rounded-lg">
                  <button
                    onClick={() => setSellersExpanded(!sellersExpanded)}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <h3 className="font-semibold text-gray-800">Sellers</h3>
                    {sellersExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  {sellersExpanded && (
                    <div className="px-4 pb-4 space-y-2">
                      {sellers.map(seller => (
                        <label key={seller.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedSellers.includes(seller.id)}
                            onChange={() => toggleSeller(seller.id)}
                            className="rounded border-gray-300 text-[var(--rust)] focus:ring-[var(--rust)]"
                          />
                          <span className="text-sm">{seller.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Price Range */}
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-3">Price Range</h3>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={priceRange[0]}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, '');
                        setPriceRange([parseFloat(val) || 0, priceRange[1]]);
                      }}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      placeholder="Min"
                    />
                    <span className="text-gray-700 font-medium">-</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={priceRange[1]}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, '');
                        setPriceRange([priceRange[0], parseFloat(val) || 1000]);
                      }}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      placeholder="Max"
                    />
                  </div>
                </div>

                {/* Stock Status */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-3">Availability</h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => setInStockOnly(e.target.checked)}
                      className="rounded border-gray-300 text-[var(--rust)] focus:ring-[var(--rust)]"
                    />
                    <span className="text-sm">In Stock Only</span>
                  </label>
                </div>

                <button
                  onClick={() => setShowFilters(false)}
                  className="w-full px-4 py-3 bg-[var(--rust)] text-white rounded-lg hover:bg-[var(--navy)] font-medium"
                >
                  Apply Filters
                </button>
              </div>
            </aside>
          </>
        )}

        {/* Products Grid */}
        <div className="flex-1">
          {filteredProducts.length === 0 ? (
            <div className="max-w-lg mx-auto bg-white rounded-lg shadow-md p-12 text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="h-12 w-12 text-gray-300" />
              </div>
              <h2 className="text-2xl font-semibold text-[var(--navy)] mb-3">
                No products found
              </h2>
              <p className="text-gray-700 mb-4">
                Try adjusting your filters or search criteria.
              </p>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="px-6 py-2 bg-[var(--rust)] text-white rounded-lg hover:bg-[var(--navy)] transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.slice(0, displayCount).map((product, index) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 group"
                >
                  {product.ProductImage.length > 0 && !imageErrors.has(product.id) ? (
                    <div className="relative h-56 bg-gray-100">
                      <Image
                        src={product.ProductImage[0].url}
                        alt={product.title}
                        width={300}
                        height={300}
                        style={{ width: '100%', height: '100%' }}
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        loading={index === 0 ? "eager" : "lazy"}
                        priority={index === 0}
                        onError={() => handleImageError(product.id)}
                      />
                    </div>
                  ) : (
                    <div className="h-56 bg-gray-100 flex items-center justify-center">
                      <Package className="h-16 w-16 text-gray-300" />
                    </div>
                  )}
                  <div className="p-4">
                    <h2 className="text-lg font-semibold text-[var(--navy)] mb-2 line-clamp-2 group-hover:text-[var(--rust)] transition-colors">
                      {product.title}
                    </h2>
                    <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-xl font-bold text-[var(--rust)]">
                        ${product.price.toFixed(2)}
                      </p>
                      {product.stock > 0 ? (
                        <span className="text-xs text-green-700 font-semibold">
                          In Stock
                        </span>
                      ) : (
                        <span className="text-xs text-red-700 font-semibold">
                          Out of Stock
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
              </div>
              
              {/* Infinite scroll trigger */}
              {displayCount < filteredProducts.length && (
                <div ref={loadMoreRef} className="mt-8 text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--rust)] mx-auto"></div>
                  <p className="mt-2 text-sm text-black font-semibold">Loading more products...</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductListPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--rust)] mx-auto"></div>
          <p className="mt-4 text-black font-semibold">Loading products...</p>
        </div>
      </div>
    }>
      <ProductListContent />
    </Suspense>
  );
}
