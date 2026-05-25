'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Phone, MapPin, Package, Heart, Settings, Store, MessageSquare, LogOut } from 'lucide-react';
import { authClient } from '@/lib/auth/client';
import { useToast } from '@/context/ToastContext';

interface UserProfile {
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  shopName: string | null;
  bio: string | null;
  image: string | null;
  role: string;
  memberSince: string;
  profileComplete: boolean;
}

interface Order {
  id: string;
  displayId: string;
  total: number;
  status: string;
  timeAgo: string;
  itemCount: number;
}

interface ProfileData {
  user: UserProfile;
  recentOrders: Order[];
  stats: {
    totalOrders: number;
    totalProducts: number;
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const { data } = authClient.useSession();
  const { showToast } = useToast();
  const [checkComplete, setCheckComplete] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [becomingSellerLoading, setBecomingSellerLoading] = useState(false);
  
  useEffect(() => {
    // Set a timeout to mark check as complete
    const timeout = setTimeout(() => {
      setCheckComplete(true);
    }, 500);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    // Redirect if check is complete and no session
    if (checkComplete && !data?.session) {
      router.push('/auth/sign-in');
    }
  }, [checkComplete, data, router]);

  useEffect(() => {
    // Fetch profile data when session is available
    if (data?.session) {
      fetchProfileData();
    }
  }, [data?.session]);

  useEffect(() => {
    // Redirect to profile completion if profile is not complete
    if (profileData && !profileData.user.profileComplete) {
      router.push('/account/profile/complete');
    }
  }, [profileData, router]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/profile');
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile data');
      }
      
      const data = await response.json();
      setProfileData(data);
    } catch (err) {
      console.error('Error fetching profile data:', err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleBecomeSeller = async () => {
    setBecomingSellerLoading(true);
    try {
      const response = await fetch('/api/profile/become-seller', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to become seller');
      }

      const data = await response.json();
      if (data.success) {
        // Redirect to congratulations page
        router.push('/account/profile/seller-welcome');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to become a seller. Please try again.', 'error');
    } finally {
      setBecomingSellerLoading(false);
    }
  };

  // Don't show anything until we have a confirmed session
  if (!data?.session) {
    return null;
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--rust)] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Failed to load profile'}</p>
          <button
            onClick={fetchProfileData}
            className="bg-[var(--rust)] text-white px-6 py-2 rounded-lg hover:bg-[#b84f2e] transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { user, recentOrders } = profileData;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-[var(--navy)]">My Profile</h1>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile Info Card */}
        <div className="md:col-span-2 bg-white rounded-lg shadow-md p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-[var(--rust)] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {user.name && user.name.trim() ? user.name.split(' ').filter(n => n).map(n => n[0]).join('').toUpperCase() : 'U'}
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-[var(--navy)] px-2 py-1">{user.name}</h2>
                <p className="text-gray-600">Member since {user.memberSince}</p>
              </div>
            </div>
            <Link
              href="/account/profile/edit"
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <Settings className="h-5 w-5 text-gray-600" />
            </Link>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-gray-700">
              <Mail className="h-5 w-5 text-[var(--rust)]" />
              <span>{user.email}</span>
            </div>
            {user.phone && (
              <div className="flex items-center gap-3 text-gray-700">
                <Phone className="h-5 w-5 text-[var(--rust)]" />
                <span>{user.phone}</span>
              </div>
            )}
            {user.address && (
              <div className="flex items-center gap-3 text-gray-700">
                <MapPin className="h-5 w-5 text-[var(--rust)]" />
                <span>{user.address}</span>
              </div>
            )}
            {user.shopName && user.role === 'SELLER' && (
              <div className="flex items-center gap-3 text-gray-700">
                <Store className="h-5 w-5 text-[var(--rust)]" />
                <span className="font-medium">{user.shopName}</span>
              </div>
            )}
            {user.bio && user.role === 'SELLER' && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-700">{user.bio}</p>
              </div>
            )}
          </div>

          {user.role === 'SELLER' && (
            <div className="mt-6 pt-6 border-t">
              <Link 
                href="/account/dashboard"
                className="flex items-center gap-3 bg-[var(--rust)] text-white px-6 py-3 rounded-lg hover:bg-[#b84f2e] transition-colors cursor-pointer"
              >
                <Store className="h-5 w-5" />
                <span className="font-semibold">Go to Seller Dashboard</span>
              </Link>
            </div>
          )}
        </div>

        {/* Quick Actions Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="font-semibold text-[var(--navy)] mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link 
                href="/account/messages"
                className="flex items-center gap-3 text-gray-700 hover:text-[var(--rust)] transition-colors"
              >
                <MessageSquare className="h-5 w-5" />
                <span>Messages</span>
              </Link>
              <Link 
                href="/account/orders"
                className="flex items-center gap-3 text-gray-700 hover:text-[var(--rust)] transition-colors"
              >
                <Package className="h-5 w-5" />
                <span>My Orders</span>
              </Link>
              <Link 
                href="/account/profile/edit"
                className="flex items-center gap-3 text-gray-700 hover:text-[var(--rust)] transition-colors"
              >
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </Link>
              <button
                onClick={async () => {
                  await authClient.signOut();
                  router.push('/');
                }}
                className="flex items-center gap-3 text-gray-700 hover:text-[var(--rust)] transition-colors w-full cursor-pointer"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>

          {user.role !== 'SELLER' && (
            <div className="bg-[var(--beige)] rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-[var(--navy)] mb-2">Become a Seller</h3>
              <p className="text-sm text-gray-700 mb-4">
                Start selling your handcrafted items on Handcrafted Haven!
              </p>
              <button 
                onClick={handleBecomeSeller}
                disabled={becomingSellerLoading}
                className="w-full bg-[var(--rust)] text-white px-4 py-2 rounded hover:bg-[#b84f2e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {becomingSellerLoading ? 'Processing...' : 'Apply Now'}
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-[var(--navy)] mb-4">Recent Orders</h3>
        <div className="space-y-4">
          {recentOrders.length > 0 ? (
            recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                <div>
                  <p className="font-medium text-[var(--navy)]">Order #{order.displayId}</p>
                  <p className="text-sm text-gray-900">{order.timeAgo} • {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}</p>
                  <p className="text-sm text-gray-900">${order.total.toFixed(2)} • {order.status}</p>
                </div>
                <Link 
                  href={`/account/orders/${order.id}`} 
                  className="bg-[var(--rust)] text-white px-4 py-2 rounded-md hover:bg-[var(--rust)]/90 transition-colors text-sm font-bold cursor-pointer"
                >
                  View Order
                </Link>
              </div>
            ))
          ) : (
            <p className="text-gray-900 text-center py-8">No orders yet</p>
          )}
        </div>
      </div>
    </div>
  );
}