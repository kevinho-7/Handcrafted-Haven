'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import MessageSellerModal from '@/components/MessageSellerModal';
import ReviewModal from '@/components/ReviewModal';
import ConfirmModal from '@/components/ConfirmModal';
import { authClient } from '@/lib/auth/client';

interface ProductImage {
  id: string;
  url: string;
}

interface Review {
  id: string;
  rating: number;
  comment?: string;
  userId?: string;
  User?: {
    name?: string;
    shopName?: string;
  };
}

interface Seller {
  id: string;
  name?: string;
  email: string;
  shopName?: string;
}

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  sellerId: string;
  salesCount?: number;
  ProductImage: ProductImage[];
  Review: Review[];
  User: Seller;
}

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const { addToCart, cart } = useCart();
  const { data: session } = authClient.useSession();
  const { showToast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [showingCategoryProducts, setShowingCategoryProducts] = useState(true);

  const handleImageError = (imageId: string) => {
    setImageErrors(prev => new Set(prev).add(imageId));
  };

  // NEW: Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);
  const [deletingReview, setDeletingReview] = useState(false);

  const [quantity, setQuantity] = useState(1);

  // Review form states
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const viewTracked = useRef<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/product/${encodeURIComponent(id)}`);
        const data = await res.json();
        setProduct(data.product ?? null);

        if (data.product && viewTracked.current !== id) {
          viewTracked.current = id;
          fetch(`/api/product/${encodeURIComponent(id)}/view`, { method: 'POST' })
            .catch(err => console.error('Failed to track view:', err));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Scroll to review if hash is present in URL
  useEffect(() => {
    if (product && window.location.hash) {
      const hash = window.location.hash.substring(1); // Remove the #
      const element = document.getElementById(hash);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Add a subtle highlight effect
          element.classList.add('bg-yellow-100');
          setTimeout(() => {
            element.classList.remove('bg-yellow-100');
          }, 2000);
        }, 100);
      }
    }
  }, [product]);

  // Fetch related products from the same category
  useEffect(() => {
    if (!product) return;

    const fetchRelatedProducts = async () => {
      try {
        const res = await fetch(`/api/product/category/${encodeURIComponent(product.category)}`);
        const data = await res.json();
        
        if (data.products) {
          // Filter out current product and sort by popularity
          const filtered = data.products
            .filter((p: Product) => p.id !== product.id)
            .sort((a: Product, b: Product) => (b.salesCount || 0) - (a.salesCount || 0))
            .slice(0, 6); // Limit to 6 products
          
          // If no products in same category, fetch popular products as fallback
          if (filtered.length === 0) {
            const popularRes = await fetch('/api/product');
            const popularData = await popularRes.json();
            
            if (popularData.products) {
              const popularFiltered = popularData.products
                .filter((p: Product) => p.id !== product.id)
                .sort((a: Product, b: Product) => (b.salesCount || 0) - (a.salesCount || 0))
                .slice(0, 6);
              
              setRelatedProducts(popularFiltered);
              setShowingCategoryProducts(false);
            }
          } else {
            setRelatedProducts(filtered);
            setShowingCategoryProducts(true);
          }
        }
      } catch (error) {
        console.error('Failed to fetch related products:', error);
      }
    };

    fetchRelatedProducts();
  }, [product]);

  if (loading) return <p className="p-6">Loading...</p>;
  if (!product) return <p className="p-6">Product not found.</p>;

  const currentCartItem = cart.find(item => item.id === product.id);
  const alreadyInCart = currentCartItem ? currentCartItem.quantity : 0;

  const handleAddToCart = () => {
    if (!product) return;
    const totalRequested = alreadyInCart + quantity;
    if (totalRequested > product.stock) {
      showToast(`You can only add ${product.stock - alreadyInCart} more of this item.`, 'error');
      return;
    }

    addToCart({
      id: product.id,
      title: product.title,
      price: product.price,
      quantity,
      stock: product.stock,
      imageUrl: product.ProductImage?.[0]?.url,
    });

    showToast('Added to cart!', 'success');
  };

  const handleSubmitReview = async () => {
    if (!product || !session?.user?.id) {
      showToast('You must be logged in to submit a review.', 'error');
      return;
    }

    setSubmittingReview(true);
    try {
      const isEditing = !!editingReviewId;
      const method = isEditing ? 'PUT' : 'POST';
      const body = isEditing 
        ? { reviewId: editingReviewId, rating: newRating, comment: newComment }
        : { rating: newRating, comment: newComment };

      const res = await fetch(`/api/product/${product.id}/review`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      if (isEditing) {
        // Update existing review in the list
        setProduct(prev =>
          prev ? {
            ...prev,
            Review: prev.Review.map(r => r.id === editingReviewId ? data.review : r)
          } : prev
        );
        showToast('Review updated successfully!', 'success');
      } else {
        // Add new review to the list
        setProduct(prev =>
          prev ? { ...prev, Review: [...prev.Review, data.review] } : prev
        );
        showToast('Review submitted successfully!', 'success');
      }

      setNewRating(5);
      setNewComment('');
      setEditingReviewId(null);
      setShowReviewModal(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to submit review', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleEditReview = (review: Review) => {
    setEditingReviewId(review.id);
    setNewRating(review.rating);
    setNewComment(review.comment || '');
    setShowReviewModal(true);
  };

  const handleDeleteReview = async (reviewId: string) => {
    setReviewToDelete(reviewId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteReview = async () => {
    if (!reviewToDelete) return;

    setDeletingReview(true);
    try {
      const res = await fetch(`/api/product/${product?.id}/review`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId: reviewToDelete }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete review');
      }

      setProduct(prev =>
        prev ? {
          ...prev,
          Review: prev.Review.filter(r => r.id !== reviewToDelete)
        } : prev
      );

      showToast('Review deleted successfully!', 'success');
      setShowDeleteConfirm(false);
      setReviewToDelete(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete review', 'error');
    } finally {
      setDeletingReview(false);
    }
  };

  const openNewReviewModal = () => {
    setEditingReviewId(null);
    setNewRating(5);
    setNewComment('');
    setShowReviewModal(true);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-6">

      {/* Top Section */}
      <div className="md:flex md:gap-10 items-center">

        {/* LEFT SIDE */}
        <div className="md:w-1/2">
          <h1 className="text-3xl font-bold mb-4">{product.title}</h1>

          <div className="space-y-4 mb-6">
            {product.ProductImage.length > 0 ? (
              product.ProductImage.filter(img => !imageErrors.has(img.id)).length > 0 ? (
                product.ProductImage.map((img, index) => 
                  !imageErrors.has(img.id) ? (
                    <Image
                      key={img.id}
                      src={img.url}
                      alt={product.title}
                      width={600}
                      height={600}
                      style={{ width: '100%', height: '450px' }}
                      className="object-cover rounded"
                      loading={index === 0 ? "eager" : "lazy"}
                      priority={index === 0}
                      onError={() => handleImageError(img.id)}
                    />
                  ) : null
                )
              ) : (
                <div className="w-full h-[450px] bg-gray-200 rounded flex items-center justify-center">
                  <div className="text-center">
                    <svg className="h-24 w-24 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-500">Image unavailable</p>
                  </div>
                </div>
              )
            ) : (
              <div className="w-full h-[450px] bg-gray-200 rounded flex items-center justify-center">
                <div className="text-center">
                  <svg className="h-24 w-24 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-500">No images available</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="md:w-1/2 flex flex-col justify-center border rounded-lg p-6 h-fit shadow-sm bg-white">

          <p className="text-gray-700 mb-4">{product.description}</p>
          <p className="text-2xl font-bold mb-2">${product.price.toFixed(2)}</p>
          <p className={`mb-4 text-sm font-semibold ${product.stock === 0 ? 'text-red-600' : 'text-gray-600'}`}>
            {product.stock === 0 ? 'Out of Stock' : `${product.stock} available`}
          </p>

          {/* Seller Info */}
          <div className="mb-4 p-3 bg-white border rounded shadow-sm flex items-center justify-between text-sm">
            <div>
              <span className="text-gray-500">Sold by </span>
              <Link
                href={`/seller/${product.User.id}`}
                className="font-semibold text-[var(--rust)] hover:underline"
              >
                {product.User.shopName || product.User.name || 'Seller'}
              </Link>
            </div>

            <button 
              onClick={() => setShowMessageModal(true)}
              className="text-[var(--rust)] border border-[var(--rust)] px-3 py-1 rounded hover:bg-[var(--rust)] hover:text-white transition text-xs cursor-pointer"
            >
              Message Seller
            </button>
          </div>

          {/* Add to Cart */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm font-medium">Quantity:</span>
            <input
              type="number"
              min={1}
              max={product.stock}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              disabled={product.stock === 0}
              style={{ border: '2px solid #6B7280' }}
              className="w-20 rounded px-2 py-1 focus:ring-2 focus:ring-[var(--rust)] outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0 || alreadyInCart >= product.stock}
            className={`w-full py-3 rounded transition ${
              product.stock === 0
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-[var(--rust)] text-white hover:bg-[#b84f2f] cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed'
            }`}
          >
            {product.stock === 0 
              ? "Sold Out" 
              : alreadyInCart >= product.stock 
                ? "Max In Cart" 
                : "Add to Cart"}
          </button>
        </div>

      </div>

      {/* Reviews Section */}
      <div className="mt-12 p-6 border rounded bg-gray-50">
        <h2 className="text-2xl font-bold mb-6 px-2 py-1 ">Reviews</h2>

        {session?.user?.id && product.sellerId !== session.user.id && (
          <button
            onClick={openNewReviewModal}
            className="bg-[var(--rust)] text-white px-4 py-2 rounded hover:bg-[#b84f2f] mb-6"
          >
            Leave a Review
          </button>
        )}

        {product.Review.length === 0 ? (
          <p>No reviews yet.</p>
        ) : (
          product.Review.map(r => {
            const reviewerName = r.User?.name || 'Anonymous';
            const isVerified = true; // All reviews are verified purchases now
            const isOwnReview = session?.user?.id === r.userId;
            
            return (
              <div key={r.id} id={`review-${r.id}`} className="mb-4 border-b pb-3 scroll-mt-24">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium">{'⭐'.repeat(r.rating)} ({r.rating}/5)</p>
                  {isVerified && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Verified Purchase</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-1">By: {reviewerName}</p>
                {r.comment && <p className="text-gray-700 mb-2">{r.comment}</p>}
                {isOwnReview && (
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleEditReview(r)}
                      className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteReview(r.id)}
                      className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="mt-12 p-6 border rounded bg-gray-50">
          <h2 className="text-2xl font-bold mb-6 px-2 py-1 text-[var(--navy)]">
            {showingCategoryProducts ? 'Related Products' : 'You May Also Like'}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {relatedProducts.map((relatedProduct) => {
              const avgRating = relatedProduct.Review && relatedProduct.Review.length > 0
                ? relatedProduct.Review.reduce((sum, r) => sum + r.rating, 0) / relatedProduct.Review.length
                : 0;

              return (
                <Link
                  key={relatedProduct.id}
                  href={`/product/${relatedProduct.id}`}
                  className="border rounded-lg p-3 hover:shadow-lg transition cursor-pointer"
                >
                  {relatedProduct.ProductImage?.[0]?.url && (
                    <img
                      src={relatedProduct.ProductImage[0].url}
                      alt={relatedProduct.title}
                      className="w-full h-40 object-cover rounded mb-2"
                    />
                  )}
                  <h3 className="font-semibold text-sm line-clamp-2 mb-1">{relatedProduct.title}</h3>
                  <p className="text-[var(--rust)] font-bold text-lg">${relatedProduct.price.toFixed(2)}</p>
                  {avgRating > 0 && (
                    <p className="text-xs text-gray-600">
                      {'⭐'.repeat(Math.round(avgRating))} ({relatedProduct.Review?.length || 0})
                    </p>
                  )}
                  {relatedProduct.User && (
                    <p className="text-xs text-gray-500 mt-1">
                      by {relatedProduct.User.shopName || relatedProduct.User.name}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Message Seller Modal */}
      <MessageSellerModal
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        sellerId={product.User.id}
        sellerName={product.User.shopName || product.User.name}
        productId={product.id}
        productTitle={product.title}
      />

      {/* NEW: Review Modal */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => {
          setShowReviewModal(false);
          setEditingReviewId(null);
          setNewRating(5);
          setNewComment('');
        }}
        rating={newRating}
        setRating={setNewRating}
        comment={newComment}
        setComment={setNewComment}
        submitting={submittingReview}
        onSubmit={handleSubmitReview}
        editMode={!!editingReviewId}
      />

      {/* Delete Review Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setReviewToDelete(null);
        }}
        onConfirm={confirmDeleteReview}
        title="Delete Review"
        message="Are you sure you want to delete this review? This action cannot be undone."
        confirmText="Delete"
        isLoading={deletingReview}
      />
    </div>
  );
}
