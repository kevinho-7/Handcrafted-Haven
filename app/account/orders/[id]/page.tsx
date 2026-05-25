'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, ArrowLeft, MessageSquare, XCircle } from 'lucide-react';
import { authClient } from '@/lib/auth/client';
import MessageSellerModal from '@/components/MessageSellerModal';
import CancelOrderModal from '@/components/CancelOrderModal';
import { useToast } from '@/context/ToastContext';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  Product: {
    id: string;
    title: string;
    User: {
      id: string;
      name: string | null;
      email: string;
      shopName: string | null;
    };
  };
}

interface Order {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  cancellationReason: string | null;
  OrderItem: OrderItem[];
}

export default function ViewOrderPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data } = authClient.useSession();
  const { showToast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<{ id: string; name: string | null; shopName: string | null } | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  useEffect(() => {
    if (data && !data.session) {
      router.push('/auth/sign-in');
    }
  }, [data, router]);

  useEffect(() => {
    if (data?.session && id) {
      fetchOrder();
    }
  }, [data?.session, id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch order');
      }
      
      const data = await response.json();
      setOrder(data);
    } catch (err) {
      console.error('Error fetching order:', err);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800';
      case 'SHIPPED':
        return 'bg-purple-100 text-purple-800';
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'REFUNDED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!data?.session) {
    return null;
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--rust)] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-red-600 mb-4">{error || 'Order not found'}</p>
          <Link
            href="/account/profile"
            className="text-[var(--rust)] hover:underline"
          >
            Back to Profile
          </Link>
        </div>
      </div>
    );
  }

  // Group items by seller
  const itemsBySeller = order.OrderItem.reduce((acc, item) => {
    const sellerId = item.Product.User.id;
    if (!acc[sellerId]) {
      acc[sellerId] = {
        seller: item.Product.User,
        items: [],
        total: 0,
      };
    }
    acc[sellerId].items.push(item);
    acc[sellerId].total += item.price * item.quantity;
    return acc;
  }, {} as Record<string, { seller: any; items: OrderItem[]; total: number }>);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-2 text-black hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[var(--navy)] mb-2">Order Details</h1>
            <p className="text-sm text-gray-600">Order ID: {id}</p>
            <p className="text-sm text-gray-600">{formatDate(order.createdAt)}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
              {order.status}
            </span>
            {order.status === 'PENDING' && (
              <button
                onClick={() => setCancelModalOpen(true)}
                className="flex items-center gap-2 text-red-600 border border-red-600 px-3 py-1.5 rounded hover:bg-red-50 transition text-sm cursor-pointer"
              >
                <XCircle className="h-4 w-4" />
                Cancel Order
              </button>
            )}
          </div>
        </div>

        {(order.status === 'CANCELLED' || order.status === 'REFUNDED') && order.cancellationReason && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm font-medium text-red-800 mb-1">
              {order.status === 'REFUNDED' ? 'Cancellation & Refund Reason:' : 'Cancellation Reason:'}
            </p>
            <p className="text-sm text-red-700">{order.cancellationReason}</p>
          </div>
        )}

        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold text-[var(--navy)] mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-[var(--rust)]" />
            Order Items
          </h2>

          <div className="space-y-6">
            {Object.values(itemsBySeller).map(({ seller, items, total }) => (
              <div key={seller.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4 pb-3 border-b">
                  <div>
                    <p className="text-sm text-gray-600">Sold by</p>
                    <p className="font-semibold text-[var(--navy)]">
                      {seller.shopName || seller.name || 'Seller'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedSeller(seller);
                      setMessageModalOpen(true);
                    }}
                    className="flex items-center gap-2 text-[var(--rust)] border border-[var(--rust)] px-3 py-1.5 rounded hover:bg-[var(--rust)] hover:text-white transition text-sm cursor-pointer"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Message Seller
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-2">
                      <div className="flex-1">
                        <Link
                          href={`/product/${item.Product.id}`}
                          className="font-medium text-gray-900 hover:text-[var(--rust)] cursor-pointer"
                        >
                          {item.Product.title}
                        </Link>
                        <p className="text-sm text-gray-600">
                          Quantity: {item.quantity} × ${item.price.toFixed(2)}
                        </p>
                      </div>
                      <span className="font-semibold text-[var(--navy)]">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 pt-3 border-t flex justify-between">
                  <span className="font-medium text-gray-700">Seller Subtotal</span>
                  <span className="font-semibold text-[var(--navy)]">${total.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t">
          <div className="bg-gray-50 p-6 rounded-xl">
            <div className="flex justify-between text-gray-600 mb-2">
              <span>Subtotal</span>
              <span>${order.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600 mb-2">
              <span>Shipping</span>
              <span className="text-green-600 font-medium">Free</span>
            </div>
            <div className="flex justify-between text-2xl font-bold text-[var(--navy)] pt-3 border-t">
              <span>Total</span>
              <span>${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
      
      {selectedSeller && (
        <MessageSellerModal
          sellerId={selectedSeller.id}
          sellerName={selectedSeller.shopName || selectedSeller.name || 'Seller'}
          isOpen={messageModalOpen}
          onClose={() => {
            setMessageModalOpen(false);
            setSelectedSeller(null);
          }}
        />
      )}
      
      <CancelOrderModal
        orderId={id as string}
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onSuccess={() => {
          showToast('Order cancelled successfully', 'success');
          fetchOrder();
        }}
      />
    </div>
  );
}
