'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface MessageSellerModalProps {
  sellerId: string;
  sellerName?: string;
  productId?: string;
  productTitle?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function MessageSellerModal({
  sellerId,
  sellerName,
  productId,
  productTitle,
  isOpen,
  onClose,
}: MessageSellerModalProps) {
  const [subject, setSubject] = useState(
    productTitle ? `Inquiry about: ${productTitle}` : ''
  );
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [shopName, setShopName] = useState('');
  const [userName, setUserName] = useState('');
  const [sendAsShop, setSendAsShop] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          setIsSeller(data.user.isSeller || false);
          setShopName(data.user.shopName || '');
          setUserName(data.user.name || '');
        }
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
      }
    };
    
    if (isOpen) {
      fetchUserProfile();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSending(true);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          content,
          receiverId: sellerId,
          productId: productId || null,
          sendAsShop: sendAsShop,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setSuccess(true);
      setContent('');
      
      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setSubject(productTitle ? `Inquiry about: ${productTitle}` : '');
        setSendAsShop(false);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
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
        <h2 className="text-2xl font-bold mb-4">
          Message {sellerName || 'Seller'}
        </h2>

        {success ? (
          <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded">
            Message sent successfully!
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Send As (only for sellers) */}
            {isSeller && shopName && (
              <div>
                <label className="block text-sm font-medium mb-2">Send as:</label>
                <div className="flex gap-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      checked={!sendAsShop}
                      onChange={() => setSendAsShop(false)}
                      className="mr-2"
                    />
                    <span>{userName || 'Myself'}</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      checked={sendAsShop}
                      onChange={() => setSendAsShop(true)}
                      className="mr-2"
                    />
                    <span>{shopName}</span>
                  </label>
                </div>
              </div>
            )}

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium mb-1">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                style={{ border: '2px solid #6B7280' }}
                className="w-full rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--rust)] bg-white"
                required
              />
            </div>

            {/* Message Content */}
            <div>
              <label className="block text-sm font-medium mb-1">Message</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                style={{ border: '2px solid #6B7280' }}
                className="w-full rounded px-3 py-2 h-32 focus:outline-none focus:ring-2 focus:ring-[var(--rust)] bg-white resize-none"
                required
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
                Cancel
              </button>
              <button
                type="submit"
                disabled={sending}
                className="px-4 py-2 bg-[var(--rust)] text-white rounded hover:bg-[#b84f2f] transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                {sending ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
