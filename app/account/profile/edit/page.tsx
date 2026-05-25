'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authClient } from '@/lib/auth/client';
import { User, Phone, MapPin, Store, FileText, ArrowLeft, Trash2, UserMinus } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

interface FormData {
  name: string;
  phone: string;
  address: string;
  shopName: string;
  bio: string;
}

export default function EditProfilePage() {
  const router = useRouter();
  const { data } = authClient.useSession();
  const { showToast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    address: '',
    shopName: '',
    bio: '',
  });
  const [isSeller, setIsSeller] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [showConvertConfirm, setShowConvertConfirm] = useState(false);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    // Redirect if not authenticated
    if (data && !data.session) {
      router.push('/auth/sign-in');
    }
  }, [data, router]);

  useEffect(() => {
    // Fetch current profile data
    if (data?.session) {
      fetchProfile();
    }
  }, [data?.session]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/profile');
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile data');
      }
      
      const profileData = await response.json();
      const user = profileData.user;
      
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
        shopName: user.shopName || '',
        bio: user.bio || '',
      });
      setIsSeller(user.role === 'SELLER');
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

    // Validate form
    if (!formData.name.trim()) {
      setError('Name is required');
      setSaving(false);
      return;
    }

    if (!formData.phone.trim()) {
      setError('Phone number is required');
      setSaving(false);
      return;
    }

    if (!formData.address.trim()) {
      setError('Address is required');
      setSaving(false);
      return;
    }

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update profile');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/account/profile');
      }, 1500);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      const response = await fetch('/api/profile/delete', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to delete account');
      }

      await authClient.signOut();
      router.push('/');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete account. Please try again.', 'error');
    } finally {
      setDeletingAccount(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleConvertToUser = async () => {
    setConverting(true);
    try {
      const response = await fetch('/api/profile/convert-to-user', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to convert account');
      }

      showToast('Account converted to regular user. Your products are now hidden but can be restored if you become a seller again.', 'success');
      router.push('/account/profile');
    } catch (err) {
      console.error(err);
      showToast('Failed to convert account. Please try again.', 'error');
    } finally {
      setConverting(false);
      setShowConvertConfirm(false);
    }
  };

  if (!data?.session) {
    return null;
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--rust)] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--navy)] mb-2">
            Edit Profile
          </h1>
          <p className="text-gray-600">
            Update your personal information
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600 text-sm">Profile updated successfully! Redirecting...</p>
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
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              style={{ border: '2px solid #6B7280' }}
              className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-[var(--rust)] outline-none bg-white"
              placeholder="123 Main St, City, State ZIP"
              required
            />
          </div>

          {isSeller && (
            <div className="pt-4 border-t">
              <h3 className="text-lg font-semibold text-[var(--navy)] mb-4">
                Store Information
              </h3>

              <div className="space-y-6">
                <div>
                  <label htmlFor="shopName" className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4 text-[var(--rust)]" />
                      Shop Name
                    </div>
                  </label>
                  <input
                    type="text"
                    id="shopName"
                    name="shopName"
                    value={formData.shopName}
                    onChange={handleChange}
                    style={{ border: '2px solid #6B7280' }}
                    className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-[var(--rust)] outline-none bg-white"
                    placeholder="Your shop name"
                  />
                </div>

                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[var(--rust)]" />
                      Store Bio
                    </div>
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={4}
                    style={{ border: '2px solid #6B7280' }}
                    className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-[var(--rust)] outline-none resize-none bg-white"
                    placeholder="Tell us about your shop..."
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-[var(--rust)] text-white px-6 py-3 rounded-lg hover:bg-[#b84f2e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <Link
              href="/account/profile"
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-center font-semibold"
            >
              Cancel
            </Link>
          </div>
        </form>

        <p className="text-xs text-gray-500 text-center mt-6">
          * Required fields
        </p>

        {/* Danger Zone */}
        <div className="mt-8 pt-8 border-t border-red-200">
          <h3 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h3>
          
          {isSeller && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">Convert to Regular User</h4>
                  <p className="text-sm text-gray-600">
                    This will hide all your products from the marketplace. You can become a seller again later to restore them.
                  </p>
                </div>
                <button
                  onClick={() => setShowConvertConfirm(true)}
                  className="ml-4 flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <UserMinus className="h-4 w-4" />
                  Convert to User
                </button>
              </div>
            </div>
          )}

          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-1">Delete Account</h4>
                <p className="text-sm text-gray-600">
                  Permanently delete your account and all personal data. Your order history will be preserved but anonymized.
                </p>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="ml-4 flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors whitespace-nowrap cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-[var(--navy)] mb-4">Delete Account</h2>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete your account? Your products will be removed and your order history will be anonymized. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {deletingAccount ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Convert to User Confirmation Modal */}
      {showConvertConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-[var(--navy)] mb-4">Convert to Regular User</h2>
            <p className="text-gray-700 mb-6">
              Are you sure you want to convert your seller account to a regular user account? Your products will be hidden from the marketplace but can be restored if you become a seller again.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConvertConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConvertToUser}
                disabled={converting}
                className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {converting ? 'Converting...' : 'Convert to User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
