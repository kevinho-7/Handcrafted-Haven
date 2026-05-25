'use client';

import Link from 'next/link';
import { Store, Package, BarChart3, Settings } from 'lucide-react';

export default function SellerWelcomePage() {
  return (
    <div className="max-w-4xl mx-auto py-12">
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        {/* Success Icon */}
        <div className="mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <Store className="h-10 w-10 text-green-600" />
          </div>
        </div>

        {/* Congratulations Message */}
        <h1 className="text-3xl font-bold text-[var(--navy)] mb-4">
          Congratulations!
        </h1>
        <p className="text-xl text-gray-700 mb-8">
          You are now a seller on Handcrafted Haven!
        </p>

        {/* Quick Info */}
        <div className="bg-[var(--beige)] rounded-lg p-6 mb-8">
          <p className="text-gray-700 mb-4">
            You now have access to your seller dashboard where you can:
          </p>
          <div className="grid md:grid-cols-2 gap-4 text-left">
            <div className="flex items-start gap-3">
              <Package className="h-5 w-5 text-[var(--rust)] mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-[var(--navy)]">List Products</p>
                <p className="text-sm text-gray-600">Add and manage your handcrafted items</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <BarChart3 className="h-5 w-5 text-[var(--rust)] mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-[var(--navy)]">Track Sales</p>
                <p className="text-sm text-gray-600">Monitor your orders and revenue</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Settings className="h-5 w-5 text-[var(--rust)] mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-[var(--navy)]">Manage Shop</p>
                <p className="text-sm text-gray-600">Customize your shop details</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Store className="h-5 w-5 text-[var(--rust)] mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-[var(--navy)]">Build Your Brand</p>
                <p className="text-sm text-gray-600">Create your unique seller profile</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/account/dashboard"
            className="bg-[var(--rust)] text-white px-8 py-3 rounded-lg hover:bg-[#b84f2e] transition-colors font-semibold"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/account/profile"
            className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
          >
            Back to Profile
          </Link>
        </div>

        {/* Future Tutorial Note */}
        <div className="mt-8 pt-6 border-t text-sm text-gray-600">
          <p>
            More features and tutorials coming soon to help you get started!
          </p>
        </div>
      </div>
    </div>
  );
}
