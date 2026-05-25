'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Package, ArrowRight, ShoppingBag } from 'lucide-react';

export default function OrderSuccessPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${id}`);
        const data = await response.json();
        setOrder(data);
      } catch (err) {
        console.error('Error fetching order:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-[var(--rust)] font-medium">Loading details...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <h1 className="text-2xl font-bold text-[var(--navy)]">Order not found</h1>
        <Link href="/shop" className="text-[var(--rust)] hover:underline mt-4 inline-block">Back to the store</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        {/* Thanks for the Purchase */}
        <div className="bg-green-50 p-8 text-center border-b border-green-100">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">Thank you for your purchase!</h1>
          <p className="text-gray-600 mt-2">Order was placed successfully.</p>
          <div className="mt-4 inline-block bg-white px-4 py-2 rounded-full text-sm font-mono text-gray-500 border border-green-200">
            Order ID: {id}
          </div>
        </div>

        <div className="p-8">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Package className="h-5 w-5 text-[var(--rust)]" />
            Order Summary
          </h2>

          <div className="space-y-4 mb-8">
            {order.OrderItem?.map((item: any) => (
              <div key={item.id} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
                <div className="flex gap-4 items-center">
                  <div className="h-16 w-16 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                    {item.Product?.ProductImage?.[0]?.url ? (
                      <img 
                        src={item.Product.ProductImage[0].url} 
                        alt={item.Product.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-gray-400">No Image</span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{item.Product?.title || 'Product'}</p>
                    <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                  </div>
                </div>
                <span className="font-semibold text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 p-6 rounded-xl space-y-3">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>${order.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipment</span>
              <span className="text-green-600 font-medium">Free</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-[var(--navy)] pt-3 border-t">
              <span>Total paid</span>
              <span>${order.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link 
              href="/" 
              className="flex-1 bg-[var(--rust)] text-white text-center py-4 rounded-xl font-bold hover:bg-[#b84f2e] transition-all flex items-center justify-center gap-2"
            >
              <ShoppingBag className="h-5 w-5" />
              Back to Shopping...
            </Link>
            <Link 
              href="/account/profile" 
              className="flex-1 bg-white border-2 border-gray-200 text-gray-700 text-center py-4 rounded-xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
            >
              Manage Orders
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}