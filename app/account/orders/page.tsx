'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, ArrowLeft, Eye } from 'lucide-react';
import { authClient } from '@/lib/auth/client';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  Product: {
    id: string;
    title: string;
  };
}

interface Order {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  cancellationReason: string | null;
  itemCount: number;
  OrderItem: OrderItem[];
}

export default function MyOrdersPage() {
  const router = useRouter();
  const { data } = authClient.useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (data && !data.session) {
      router.push('/auth/sign-in');
    }
  }, [data, router]);

  useEffect(() => {
    if (data?.session) {
      fetchOrders();
    }
  }, [data?.session]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/orders');
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders');
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
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'REFUNDED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!data?.session) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <Link
          href="/account/profile"
          className="inline-flex items-center gap-2 text-black hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Profile
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center gap-3 mb-6">
          <Package className="h-8 w-8 text-[var(--rust)]" />
          <h1 className="text-3xl font-bold text-[var(--navy)]">My Orders</h1>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--rust)]"></div>
            <p className="mt-4 text-gray-900">Loading orders...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-900 text-lg">No orders yet</p>
            <Link
              href="/product-list"
              className="inline-block mt-4 bg-[var(--rust)] text-white px-6 py-2 rounded-md hover:bg-[var(--rust)]/90 transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-gray-50 border-2 border-gray-300 rounded-lg p-6"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-[var(--navy)]">
                        Order #{order.id.slice(0, 8)}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900">{formatDate(order.createdAt)}</p>
                    <p className="text-sm text-gray-900">
                      {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-900">Total</p>
                      <p className="text-2xl font-bold text-[var(--navy)]">
                        ${order.total.toFixed(2)}
                      </p>
                    </div>
                    <Link
                      href={`/account/orders/${order.id}`}
                      className="flex items-center gap-2 bg-[var(--rust)] text-white px-4 py-2 rounded-md hover:bg-[var(--rust)]/90 transition-colors cursor-pointer"
                    >
                      <Eye className="h-4 w-4" />
                      View Order
                    </Link>
                  </div>
                </div>

                {order.cancellationReason && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                    <p className="font-semibold mb-1">
                      {order.status === 'CANCELLED' ? 'Cancellation Reason:' : 'Refund Reason:'}
                    </p>
                    <p>{order.cancellationReason}</p>
                  </div>
                )}

                <div className="border-t border-gray-300 pt-4 mt-4">
                  <p className="text-sm font-semibold text-gray-900 mb-2">Items:</p>
                  <div className="space-y-1">
                    {order.OrderItem.map((item) => (
                      <div key={item.id} className="text-sm text-gray-900 flex justify-between">
                        <span>
                          {item.Product.title} × {item.quantity}
                        </span>
                        <span className="font-medium">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
