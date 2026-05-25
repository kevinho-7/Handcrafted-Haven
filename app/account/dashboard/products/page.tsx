'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Edit, Trash2, Package, DollarSign, ArrowLeft } from 'lucide-react';
import { authClient } from '@/lib/auth/client';
import { useToast } from '@/context/ToastContext';
import ConfirmModal from '@/components/ConfirmModal';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  createdAt: string;
  ProductImage: { url: string }[];
}

export default function ManageProductsPage() {
  const router = useRouter();
  const { data } = authClient.useSession();  const { showToast } = useToast();  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (data?.session) {
      fetchProducts();
    }
  }, [data?.session]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/product/seller');

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      setProducts(data.products);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    setProductToDelete(productId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;

    setDeletingId(productToDelete);
    try {
      const response = await fetch(`/api/product/seller?id=${productToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete product');
      }

      // Remove from local state
      setProducts(products.filter((p) => p.id !== productToDelete));
      showToast('Product deleted successfully', 'success');
      setShowDeleteConfirm(false);
      setProductToDelete(null);
    } catch (err) {
      console.error('Error deleting product:', err);
      showToast('Failed to delete product', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  if (!data?.session) {
    return null;
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--rust)] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/account/dashboard"
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <h1 className="text-3xl font-bold text-[var(--navy)]">Manage Products</h1>
        </div>
        <Link
          href="/account/dashboard/products/add"
          className="flex items-center gap-2 bg-[var(--rust)] text-white px-6 py-3 rounded-lg hover:bg-[#b84f2e] transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span className="font-semibold">Add New Product</span>
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Products List */}
      {products.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Products Yet</h3>
          <p className="text-gray-600 mb-6">Start by adding your first product</p>
          <Link
            href="/account/dashboard/products/add"
            className="inline-flex items-center gap-2 bg-[var(--rust)] text-white px-6 py-3 rounded-lg hover:bg-[#b84f2e] transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span className="font-semibold">Add Your First Product</span>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-md p-6 flex gap-6 hover:shadow-lg transition-shadow"
            >
              {/* Product Image */}
              <div className="w-32 h-32 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                {product.ProductImage && product.ProductImage.length > 0 ? (
                  <img
                    src={product.ProductImage[0].url}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-12 w-12 text-gray-300" />
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-xl font-semibold text-[var(--navy)] mb-1">
                      {product.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">{product.category}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/account/dashboard/products/edit/${product.id}`}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit className="h-5 w-5" />
                    </Link>
                    <button
                      onClick={() => handleDelete(product.id)}
                      disabled={deletingId === product.id}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <p className="text-gray-700 mb-4 line-clamp-2">{product.description}</p>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2 text-[var(--rust)]">
                    <DollarSign className="h-4 w-4" />
                    <span className="font-semibold">${product.price.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Package className="h-4 w-4" />
                    <span>{product.stock} in stock</span>
                  </div>
                  <span className="text-gray-500">
                    Added {new Date(product.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Product Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setProductToDelete(null);
        }}
        onConfirm={confirmDeleteProduct}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        confirmText="Delete"
        isLoading={!!deletingId}
      />
    </div>
  );
}
