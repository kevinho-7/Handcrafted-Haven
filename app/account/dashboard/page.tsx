'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, ShoppingBag, DollarSign, TrendingUp, Plus, ArrowLeft, Eye, Edit, Trash2 } from 'lucide-react';
import { authClient } from '@/lib/auth/client';

interface DashboardStats {
  totalProducts: number;
  activeOrders: number;
  revenue: number;
  totalViews: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  views: number;
}

interface Order {
  id: string;
  customer: string;
  item: string;
  amount: number;
  status: string;
}

interface DashboardData {
  stats: DashboardStats;
  products: Product[];
  recentOrders: Order[];
}

export default function DashboardPage() {
  const router = useRouter();
  const { data } = authClient.useSession();
  const [checkComplete, setCheckComplete] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revenuePeriod, setRevenuePeriod] = useState<'month' | 'year' | 'total'>('month');
  const [revenue, setRevenue] = useState<number>(0);
  const [revenueLoading, setRevenueLoading] = useState(false);
  
  useEffect(() => {
    // Set a timeout to mark check as complete
    const timeout = setTimeout(() => {
      setCheckComplete(true);
    }, 1000);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    // Redirect if check is complete and no session
    if (checkComplete && !data?.session) {
      router.push('/auth/sign-in');
    }
  }, [checkComplete, data, router]);

  useEffect(() => {
    // Fetch dashboard data when session is available
    if (data?.session) {
      fetchDashboardData();
    }
  }, [data?.session]);

  useEffect(() => {
    // Fetch revenue when period changes
    if (data?.session) {
      fetchRevenue();
    }
  }, [data?.session, revenuePeriod]);

  const fetchRevenue = async () => {
    try {
      setRevenueLoading(true);
      const response = await fetch(`/api/dashboard/revenue?period=${revenuePeriod}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch revenue');
      }
      
      const data = await response.json();
      setRevenue(data.revenue);
    } catch (err) {
      console.error('Error fetching revenue:', err);
    } finally {
      setRevenueLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/dashboard');
      
      if (response.status === 403) {
        // User is not a seller, redirect to profile
        router.push('/account/profile');
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      
      const data = await response.json();
      setDashboardData(data);
      setRevenue(data.stats.revenue);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Don't show anything until we have a confirmed session
  if (!data?.session) {
    return null;
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--rust)] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="max-w-6xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Failed to load dashboard'}</p>
          <button
            onClick={fetchDashboardData}
            className="bg-[var(--rust)] text-white px-6 py-2 rounded-lg hover:bg-[#b84f2e] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { stats, products, recentOrders } = dashboardData;
  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link 
            href="/account/profile"
            className="flex items-center gap-2 text-black hover:underline mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Profile</span>
          </Link>
          <h1 className="text-3xl font-bold text-[var(--navy)]">Seller Dashboard</h1>
        </div>
        <Link
          href="/account/dashboard/products/add"
          className="flex items-center gap-2 bg-[var(--rust)] text-white px-6 py-3 rounded-lg hover:bg-[#b84f2e] transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span className="font-semibold">Add New Product</span>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 text-sm font-medium">Total Products</h3>
            <ShoppingBag className="h-5 w-5 text-[var(--rust)]" />
          </div>
          <p className="text-3xl font-bold text-[var(--navy)]">{stats.totalProducts}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 text-sm font-medium">Active Orders</h3>
            <Package className="h-5 w-5 text-[var(--rust)]" />
          </div>
          <p className="text-3xl font-bold text-[var(--navy)]">{stats.activeOrders}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <h3 className="text-gray-600 text-sm font-medium">Revenue</h3>
              <select
                value={revenuePeriod}
                onChange={(e) => setRevenuePeriod(e.target.value as 'month' | 'year' | 'total')}
                className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[var(--rust)]"
              >
                <option value="month">Month to Date</option>
                <option value="year">Year to Date</option>
                <option value="total">Total Revenue</option>
              </select>
            </div>
            <DollarSign className="h-5 w-5 text-[var(--rust)]" />
          </div>
          <p className="text-3xl font-bold text-[var(--navy)]">
            {revenueLoading ? (
              <span className="text-gray-400">Loading...</span>
            ) : (
              `$${revenue.toFixed(2)}`
            )}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 text-sm font-medium">Total Views</h3>
            <TrendingUp className="h-5 w-5 text-[var(--rust)]" />
          </div>
          <p className="text-3xl font-bold text-[var(--navy)]">{stats.totalViews}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-[var(--navy)] mb-4">Recent Orders</h2>
          <div className="space-y-4">
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                  <div className="flex-1">
                    <p className="font-medium text-[var(--navy)]">Order #{order.id}</p>
                    <p className="text-sm text-gray-600">{order.customer}</p>
                    <p className="text-sm text-gray-500">{order.item}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[var(--navy)]">${order.amount.toFixed(2)}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'Shipped' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No orders yet</p>
            )}
          </div>
          <Link 
            href="/account/dashboard/orders"
            className="block mt-4 text-center bg-[var(--rust)] text-white px-4 py-2 rounded-md hover:bg-[var(--rust)]/90 transition-colors text-sm font-bold cursor-pointer"
          >
            View All Orders
          </Link>
        </div>

        {/* Your Products */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-[var(--navy)] mb-4">Your Products</h2>
          <div className="space-y-4">
            {products.length > 0 ? (
              products.map((product) => (
                <div key={product.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                  <div className="flex-1">
                    <p className="font-medium text-[var(--navy)]">{product.name}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      <span>${product.price.toFixed(2)}</span>
                      <span>Stock: {product.stock}</span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {product.views}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link 
                      href={`/account/dashboard/products/edit/${product.id}`}
                      className="p-2 hover:bg-gray-100 rounded" 
                      title="Edit"
                    >
                      <Edit className="h-4 w-4 text-gray-600" />
                    </Link>
                    <Link 
                      href={`/product/${product.id}`}
                      className="p-2 hover:bg-gray-100 rounded" 
                      title="View Product"
                    >
                      <Eye className="h-4 w-4 text-gray-600" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No products yet. Add your first product!</p>
            )}
          </div>
          <Link 
            href="/account/dashboard/products"
            className="block mt-4 text-center bg-[var(--rust)] text-white px-4 py-2 rounded-md hover:bg-[var(--rust)]/90 transition-colors text-sm font-bold cursor-pointer"
          >
            Manage All Products
          </Link>
        </div>
      </div>
    </div>
  );
}