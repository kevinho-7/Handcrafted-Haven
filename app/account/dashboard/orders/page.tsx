'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authClient } from '@/lib/auth/client';
import { Package, ArrowLeft, MessageSquare } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import MessageBuyerModal from '@/components/MessageBuyerModal';
import CancelOrderModal from '@/components/CancelOrderModal';

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
  sellerTotal: number;
  status: string;
  createdAt: string;
  cancellationReason: string | null;
  User: {
    id: string;
    name: string | null;
    email: string;
  };
  OrderItem: OrderItem[];
}

export default function ManageOrdersPage() {
  const router = useRouter();
  const { data } = authClient.useSession();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [selectedBuyer, setSelectedBuyer] = useState<{ id: string; name: string | null; orderId: string } | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isRefundMode, setIsRefundMode] = useState(false);

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
      const response = await fetch('/api/seller/orders');
      
      if (response.status === 403) {
        // If user is not a seller, redirect to profile
        router.push('/account/profile');
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      
      const result = await response.json();
      setOrders(result.orders || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    try {
      const response = await fetch(`/api/seller/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      showToast('Order status updated successfully', 'success');
      // Refresh orders
      fetchOrders();
    } catch (err) {
      console.error('Error updating order:', err);
      showToast('Failed to update order status', 'error');
    } finally {
      setUpdating(null);
    }
  };

  const getNextStatus = (currentStatus: string): string | null => {
    const statusFlow: Record<string, string> = {
      'PENDING': 'PROCESSING',
      'PROCESSING': 'SHIPPED',
      'SHIPPED': 'DELIVERED',
    };
    return statusFlow[currentStatus] || null;
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'PROCESSING': 'bg-blue-100 text-blue-800',
      'SHIPPED': 'bg-purple-100 text-purple-800',
      'DELIVERED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800',
      'REFUNDED': 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (!data?.session) {
    return null;
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--rust)] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <Link 
          href="/account/dashboard"
          className="inline-flex items-center gap-2 text-black hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[var(--navy)] mb-2">
              Manage Orders
            </h1>
            <p className="text-gray-600">
              View and update your customer orders
            </p>
          </div>
          <Package className="h-12 w-12 text-[var(--rust)]" />
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No orders yet</p>
            <p className="text-gray-500 text-sm mt-2">
              Orders from customers will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-gray-50 border-2 border-gray-300 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-[var(--navy)]">
                      Order #{order.id.slice(0, 8)}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Customer: {order.User.name || order.User.email}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    <p className="text-lg font-bold text-[var(--navy)] mt-2">
                      ${order.sellerTotal.toFixed(2)}
                    </p>
                  </div>
                </div>

                {(order.status === 'CANCELLED' || order.status === 'REFUNDED') && order.cancellationReason && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded p-3">
                    <p className="text-xs font-medium text-red-800 mb-1">
                      {order.status === 'REFUNDED' ? 'Cancellation & Refund Reason:' : 'Cancellation Reason:'}
                    </p>
                    <p className="text-xs text-red-700">{order.cancellationReason}</p>
                  </div>
                )}

                <div className="border-t pt-4 mb-4">
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Items:</h4>
                  <ul className="space-y-1">
                    {order.OrderItem.map((item) => (
                      <li key={item.id} className="text-sm text-gray-600">
                        {item.Product.title} x{item.quantity} - ${(item.price * item.quantity).toFixed(2)}
                      </li>
                    ))}
                  </ul>
                </div>

                {getNextStatus(order.status) && (
                  <button
                    onClick={() => updateOrderStatus(order.id, getNextStatus(order.status)!)}
                    disabled={updating === order.id}
                    className="bg-[var(--rust)] text-white px-4 py-2 rounded hover:bg-[#b84f2e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm font-medium"
                  >
                    {updating === order.id
                      ? 'Updating...'
                      : `Mark as ${getNextStatus(order.status)}`}
                  </button>
                )}
                
                {order.status !== 'REFUNDED' && order.status !== 'CANCELLED' && (
                  <button
                    onClick={() => {
                      setSelectedOrderId(order.id);
                      setIsRefundMode(order.status === 'DELIVERED' || order.status === 'SHIPPED');
                      setCancelModalOpen(true);
                    }}
                    disabled={updating === order.id}
                    className="ml-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm font-medium"
                  >
                    {order.status === 'DELIVERED' || order.status === 'SHIPPED' ? 'Refund' : 'Cancel & Refund'}
                  </button>
                )}
                
                <button
                  onClick={() => {
                    setSelectedBuyer({ id: order.User.id, name: order.User.name, orderId: order.id });
                    setMessageModalOpen(true);
                  }}
                  className="ml-2 inline-flex items-center gap-2 text-[var(--rust)] border border-[var(--rust)] px-4 py-2 rounded hover:bg-[var(--rust)] hover:text-white transition text-sm font-medium cursor-pointer"
                >
                  <MessageSquare className="h-4 w-4" />
                  Message Buyer
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {selectedBuyer && (
        <MessageBuyerModal
          buyerId={selectedBuyer.id}
          buyerName={selectedBuyer.name || 'Customer'}
          orderId={selectedBuyer.orderId}
          isOpen={messageModalOpen}
          onClose={() => {
            setMessageModalOpen(false);
            setSelectedBuyer(null);
          }}
        />
      )}
      
      {selectedOrderId && (
        <CancelOrderModal
          orderId={selectedOrderId}
          isOpen={cancelModalOpen}
          onClose={() => {
            setCancelModalOpen(false);
            setSelectedOrderId(null);
            setIsRefundMode(false);
          }}
          onSuccess={() => {
            showToast(isRefundMode ? 'Order refunded successfully' : 'Order cancelled and refunded successfully', 'success');
            fetchOrders();
          }}
          isSeller={true}
          isRefund={isRefundMode}
        />
      )}
    </div>
  );
}
