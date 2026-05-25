'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authClient } from '@/lib/auth/client';
import { User, Phone, MapPin, CreditCard, ArrowLeft } from 'lucide-react';
import { useCart } from '@/context/CartContext';

interface CheckoutFormData {
  name: string;
  phone: string;
  address: string;
  payment: string;
}

interface OrderItemPayload {
  id: string;
  quantity: number;
  price: number;
}

interface CustomerPayload {
  userId: string;
  name: string;
  phone: string;
  address: string;
  payment: string;
}

interface OrderPayload {
  items: OrderItemPayload[];
  total: number;
  customer: CustomerPayload;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { data: sessionData } = authClient.useSession(); 
  const { cart, clearCart } = useCart();

  const [formData, setFormData] = useState<CheckoutFormData>({
    name: '',
    phone: '',
    address: '',
    payment: 'card',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  useEffect(() => {
    if (sessionData && !sessionData.session) {
      router.push('/auth/sign-in');
    }
  }, [sessionData, router]);

  useEffect(() => {
    if (sessionData?.session) {
      fetchProfile();
    }
  }, [sessionData?.session]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/profile');
      if (!response.ok) throw new Error('Failed to fetch profile data');

      const profileData = await response.json();
      const user = profileData.user;

      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
        payment: 'card',
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    if (!formData.name.trim() || !formData.phone.trim() || !formData.address.trim()) {
      setError('Please fill in all required fields');
      setSaving(false);
      return;
    }

    const userId = sessionData?.session?.userId;

    if (!userId) {
      setError('User ID not found. Please sign in again.');
      setSaving(false);
      return;
    }

    try {
      const orderData: OrderPayload = {
        items: cart.map(item => ({
          id: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
        total,
        customer: {
          ...formData,
          userId: userId,
        }
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to place order');
      }

      setSuccess(true);
      clearCart();
      setTimeout(() => {
        router.push(`/order-success/${result.orderId}`);
      }, 1500);
    } catch (err) {
      console.error('Error placing order:', err);
      setError(err instanceof Error ? err.message : 'Failed to place order');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!sessionData?.session) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/cart" className="inline-flex items-center gap-2 text-[var(--rust)] hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Back to Cart
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--navy)] mb-2">Checkout</h1>
          <p className="text-gray-600">Review your information and place your order</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600 text-sm">Order placed successfully! Redirecting...</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-[var(--rust)]" />
                Full Name *
              </div>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              style={{ border: '2px solid #6B7280' }}
              className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-[var(--rust)] outline-none bg-white"
              placeholder="Enter your full name"
              required
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-[var(--rust)]" />
                Phone Number *
              </div>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              style={{ border: '2px solid #6B7280' }}
              className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-[var(--rust)] outline-none bg-white"
              placeholder="(555) 123-4567"
              required
            />
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[var(--rust)]" />
                Address *
              </div>
            </label>
            <input
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              style={{ border: '2px solid #6B7280' }}
              className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-[var(--rust)] outline-none resize-none bg-white"
              placeholder="123 Main St, City, State ZIP"
              required
            />
          </div>

          <div>
            <label htmlFor="payment" className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-[var(--rust)]" />
                Payment Method
              </div>
            </label>
            <select
              id="payment"
              name="payment"
              value={formData.payment}
              onChange={handleChange}
              style={{ border: '2px solid #6B7280' }}
              className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-[var(--rust)] outline-none bg-white"
            >
              <option value="card">Credit/Debit Card</option>
              <option value="paypal">PayPal</option>
            </select>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <span className="text-xl font-bold">Total: ${total.toFixed(2)}</span>
            <button
              type="submit"
              disabled={saving}
              className="bg-[var(--rust)] text-white px-6 py-3 rounded-lg hover:bg-[#b84f2e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {saving ? 'Processing...' : 'Place Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
             
// 'use client';

// import { useCart } from '@/context/CartContext';
// import { useState } from 'react';

// export default function CheckoutPage() {
//     const { cart, clearCart } = useCart();
//     const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

//     const [form, setForm] = useState({
//         name: '',
//         email: '',
//         address: '',
//         payment: 'card',
//     });

//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();

//         // Example: send order to backend
//         const order = { items: cart, total, customer: form };
//         await fetch('/api/orders', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify(order),
//         });

//         clearCart();
//         alert('Order placed successfully!');
//     };

//     return (
//         <main className="max-w-2xl mx-auto px-6 py-8">
//             <div className="bg-white rounded-lg shadow-md p-3">
//                 <h1 className="text-3xl font-bold text-[var(--navy)] mb-5">
//                     Checkout
//                 </h1>
//             </div>
//             <form onSubmit={handleSubmit} className="grid gap-4">
//                 <label>Full Name:
//                     <input
//                     type="text"
//                     placeholder="Full Name"
//                     value={form.name}
//                     onChange={e => setForm({ ...form, name: e.target.value })}
//                     className="border p-2 rounded"
//                     required
//                 />
//                 </label>
                
//                 <input
//                     type="email"
//                     placeholder="Email"
//                     value={form.email}
//                     onChange={e => setForm({ ...form, email: e.target.value })}
//                     className="border p-2 rounded"
//                     required
//                 />
//                 <textarea
//                     placeholder="Shipping Address"
//                     value={form.address}
//                     onChange={e => setForm({ ...form, address: e.target.value })}
//                     className="border p-2 rounded"
//                     required
//                 />
//                 <select
//                     value={form.payment}
//                     onChange={e => setForm({ ...form, payment: e.target.value })}
//                     className="border p-2 rounded"
//                 >
//                     <option value="card">Credit/Debit Card</option>
//                     <option value="paypal">PayPal</option>
//                 </select>

//                 <div className="flex justify-between items-center mt-4">
//                     <span className="text-xl font-bold">Total: ${total.toFixed(2)}</span>
//                     <button
//                         type="submit"
//                         className="bg-[var(--rust)] text-white px-6 py-3 rounded-lg hover:bg-[#b84f2e]"
//                     >
//                         Place Order
//                     </button>
//                 </div>
//             </form>
//         </main>
//     );
// }