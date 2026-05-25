'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface CancelOrderModalProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isSeller?: boolean;
  isRefund?: boolean;
}

export default function CancelOrderModal({
  orderId,
  isOpen,
  onClose,
  onSuccess,
  isSeller = false,
  isRefund = false,
}: CancelOrderModalProps) {
  const [reason, setReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCancelling(true);

    try {
      const endpoint = isSeller 
        ? `/api/seller/orders/${orderId}/cancel`
        : `/api/orders/${orderId}/cancel`;
        
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to cancel order');
      }

      onSuccess();
      onClose();
      setReason('');
    } catch (err: any) {
      setError(err.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 cursor-pointer"
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Title */}
        <h2 className="text-2xl font-bold mb-4 text-red-600">
          {isRefund ? 'Refund Order' : 'Cancel Order'}
        </h2>

        <p className="text-gray-600 mb-4">
          {isRefund
            ? 'This will process a refund for the buyer. Please provide a reason for the refund.'
            : isSeller 
              ? 'This will refund the buyer and restore inventory. Please provide a reason for cancellation.'
              : 'Are you sure you want to cancel this order? This action cannot be undone.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cancellation Reason */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Reason for {isRefund ? 'Refund' : 'Cancellation'} {!isSeller && !isRefund && '(Optional)'}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{ border: '2px solid #6B7280' }}
              className="w-full rounded px-3 py-2 h-24 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white resize-none"
              placeholder={isRefund ? 'Please explain the reason for this refund...' : 'Please explain why you\'re cancelling this order...'}
              required={isSeller || isRefund}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition cursor-pointer"
            >
              {isRefund ? 'Keep' : 'Keep Order'}
            </button>
            <button
              type="submit"
              disabled={cancelling}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {cancelling ? (isRefund ? 'Processing...' : 'Cancelling...') : (isRefund ? 'Process Refund' : 'Cancel Order')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
