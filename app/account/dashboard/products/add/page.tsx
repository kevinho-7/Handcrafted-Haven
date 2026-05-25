'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Package, DollarSign } from 'lucide-react';
import FileUpload from '@/components/FileUpload';

export default function AddProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    stock: '1',
    imageUrl: '',
  });

  const [categories, setCategories] = useState<string[]>([]);

  // ----------------------
  // Helper: Title Case
  // ----------------------
  function toTitleCase(text: string) {
    return text
      .split(/[\s-]+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // ----------------------
  // Fetch categories from DB
  // ----------------------
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        if (!res.ok) throw new Error('Failed to fetch categories');
        const data = await res.json();
        setCategories(data.categories || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate
      if (!formData.title || !formData.description || !formData.price || !formData.category) {
        throw new Error('Please fill in all required fields');
      }

      if (parseFloat(formData.price) <= 0) {
        throw new Error('Price must be greater than 0');
      }

      if (parseInt(formData.stock) < 0) {
        throw new Error('Stock cannot be negative');
      }

      // Prepare product data with images array
      const productData = {
        ...formData,
        images: formData.imageUrl ? [formData.imageUrl] : [],
      };

      const response = await fetch('/api/product/seller', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create product');
      }

      // Success - redirect to products page
      router.push('/account/dashboard/products');
    } catch (err: any) {
      console.error('Error creating product:', err);
      setError(err.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/account/dashboard/products"
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <h1 className="text-3xl font-bold text-[var(--navy)]">Add New Product</h1>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-md p-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Product Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              style={{ border: '2px solid #6B7280' }}
              className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-[var(--rust)] outline-none bg-white"
              placeholder="Handcrafted Ceramic Mug"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={5}
              style={{ border: '2px solid #6B7280' }}
              className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-[var(--rust)] outline-none resize-none bg-white"
              placeholder="Describe your handcrafted product in detail..."
            />
          </div>

          {/* Price and Stock */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                Price (USD) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  step="0.01"
                  min="0"
                  style={{ border: '2px solid #6B7280' }}
                  className="w-full pl-10 pr-4 py-2 rounded-lg focus:ring-2 focus:ring-[var(--rust)] outline-none bg-white"
                  placeholder="29.99"
                />
              </div>
            </div>

            <div>
              <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-2">
                Stock Quantity <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  id="stock"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  required
                  min="0"
                  style={{ border: '2px solid #6B7280' }}
                  className="w-full pl-10 pr-4 py-2 rounded-lg focus:ring-2 focus:ring-[var(--rust)] outline-none bg-white"
                  placeholder="10"
                />
              </div>
            </div>
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              style={{ border: '2px solid #6B7280' }}
              className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-[var(--rust)] outline-none bg-white"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {toTitleCase(cat)}
                </option>
              ))}
            </select>
          </div>

          {/* Image Upload */}
          <FileUpload
            onUploadComplete={(url: string) => setFormData((prev) => ({ ...prev, imageUrl: url }))}
            currentImageUrl={formData.imageUrl}
            uploadPath="products"
            label="Product Image"
            maxSizeMB={4.5}
          />

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[var(--rust)] text-white px-6 py-3 rounded-lg hover:bg-[#b84f2e] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Product...' : 'Create Product'}
            </button>
            <Link
              href="/account/dashboard/products"
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-gray-700"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
