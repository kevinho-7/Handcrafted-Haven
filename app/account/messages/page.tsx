'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Mail, MailOpen, ArrowLeft, Reply, X } from 'lucide-react';

interface Message {
  id: string;
  subject: string;
  content: string;
  senderId: string;
  receiverId: string;
  productId?: string;
  sendAsShop: boolean;
  isRead: boolean;
  createdAt: string;
  Sender: {
    id: string;
    name?: string;
    email: string;
    shopName?: string;
  };
  Receiver: {
    id: string;
    name?: string;
    email: string;
    shopName?: string;
  };
  Product?: {
    id: string;
    title: string;
  };
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [replyError, setReplyError] = useState('');
  const [isSeller, setIsSeller] = useState(false);
  const [shopName, setShopName] = useState('');
  const [userName, setUserName] = useState('');
  const [sendAsShop, setSendAsShop] = useState(false);
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent'>('inbox');

  useEffect(() => {
    fetchMessages();
    fetchUserProfile();
  }, []);

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

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/messages');
      const data = await res.json();
      
      if (res.ok) {
        setMessages(data.messages || []);
        setCurrentUserId(data.userId || '');
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: 'PATCH',
      });

      if (res.ok) {
        setMessages(messages.map(msg => 
          msg.id === messageId ? { ...msg, isRead: true } : msg
        ));
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const handleMessageClick = async (message: Message) => {
    setSelectedMessage(message);
    setIsReplying(false);
    setReplyContent('');
    setReplyError('');
    
    // Set default reply sender based on who the message was sent to
    const shouldDefaultToShop = message.receiverId === currentUserId && !!message.productId && isSeller && !!shopName;
    setSendAsShop(shouldDefaultToShop);
    
    // Mark as read if user is the receiver and message is unread
    if (message.receiverId === currentUserId && !message.isRead) {
      await markAsRead(message.id);
    }
  };

  const handleBackToList = () => {
    setSelectedMessage(null);
    setIsReplying(false);
    setReplyContent('');
    setReplyError('');
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMessage || !replyContent.trim()) return;

    setSendingReply(true);
    setReplyError('');

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: `Re: ${selectedMessage.subject}`,
          content: replyContent,
          receiverId: selectedMessage.senderId,
          productId: selectedMessage.productId || null,
          sendAsShop: sendAsShop,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send reply');
      }

      // Refresh messages and reset reply form
      await fetchMessages();
      setReplyContent('');
      setIsReplying(false);
      setSendAsShop(false);
    } catch (err: any) {
      setReplyError(err.message || 'Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <p>Loading messages...</p>
      </div>
    );
  }

  // Filter messages based on active tab
  const filteredMessages = messages.filter(message => {
    if (activeTab === 'inbox') {
      return message.receiverId === currentUserId;
    } else {
      return message.senderId === currentUserId;
    }
  });

  // Count unread messages in inbox
  const unreadCount = messages.filter(msg => 
    msg.receiverId === currentUserId && !msg.isRead
  ).length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
      <div className="flex items-center gap-4 mb-4 sm:mb-6">
        <Link
          href="/account/profile"
          className="p-2 hover:bg-gray-100 rounded cursor-pointer"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold">Messages</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b">
        <button
          onClick={() => {
            setActiveTab('inbox');
            setSelectedMessage(null);
          }}
          className={`px-4 py-2 font-medium transition cursor-pointer ${
            activeTab === 'inbox'
              ? 'text-[var(--rust)] border-b-2 border-[var(--rust)]'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Inbox
          {unreadCount > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => {
            setActiveTab('sent');
            setSelectedMessage(null);
          }}
          className={`px-4 py-2 font-medium transition cursor-pointer ${
            activeTab === 'sent'
              ? 'text-[var(--rust)] border-b-2 border-[var(--rust)]'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Sent
        </button>
      </div>

      {filteredMessages.length === 0 ? (
        <div className="bg-white border rounded-lg p-6 sm:p-8 text-center">
          <Mail className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">
            {activeTab === 'inbox' ? 'No messages in your inbox' : 'No sent messages'}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {/* Messages List - Hidden on mobile when message is selected */}
          <div className={`md:col-span-1 space-y-2 ${
            selectedMessage ? 'hidden md:block' : 'block'
          }`}>
            <div className="space-y-2 max-h-[70vh] md:max-h-[600px] overflow-y-auto">
              {filteredMessages.map((message) => {
                const isReceiver = message.receiverId === currentUserId;
                const otherUser = isReceiver ? message.Sender : message.Receiver;
                const isUnread = isReceiver && !message.isRead;

                return (
                  <div
                    key={message.id}
                    onClick={() => handleMessageClick(message)}
                    className={`p-3 sm:p-4 border rounded-lg cursor-pointer transition ${
                      selectedMessage?.id === message.id
                        ? 'bg-[var(--rust)] text-white'
                        : isUnread
                        ? 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                        : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {isUnread ? (
                          <Mail className="h-4 w-4 flex-shrink-0" />
                        ) : (
                          <MailOpen className="h-4 w-4 flex-shrink-0" />
                        )}
                        <span className="font-medium text-sm truncate">
                          {isReceiver ? 'From' : 'To'}: {
                            isReceiver 
                              ? (message.sendAsShop && message.Sender.shopName) ? message.Sender.shopName : (message.Sender.name || message.Sender.email)
                              : (otherUser.shopName || otherUser.name || otherUser.email)
                          }
                        </span>
                      </div>
                    </div>
                    <h3 className="font-semibold text-sm mb-1 truncate">
                      {message.subject}
                    </h3>
                    <p className="text-xs opacity-75">
                      {formatDate(message.createdAt)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Message Details - Shown on mobile when message is selected */}
          <div className={`md:col-span-2 ${
            selectedMessage ? 'block' : 'hidden md:block'
          }`}>
            {selectedMessage ? (
              <div className="bg-white border rounded-lg p-4 sm:p-6">
                {/* Mobile back button */}
                <button
                  onClick={handleBackToList}
                  className="md:hidden flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to messages</span>
                </button>

                <div className="mb-4 pb-4 border-b">
                  <h2 className="text-xl sm:text-2xl font-bold mb-2 break-words">
                    {selectedMessage.subject}
                  </h2>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-2 text-sm text-gray-600">
                    <div className="break-words">
                      <strong>From:</strong> {
                        selectedMessage.sendAsShop && selectedMessage.Sender.shopName
                          ? selectedMessage.Sender.shopName
                          : (selectedMessage.Sender.name || selectedMessage.Sender.email)
                      }
                      {selectedMessage.sendAsShop && selectedMessage.Sender.shopName && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Shop
                        </span>
                      )}
                    </div>
                    <div className="text-xs sm:text-sm whitespace-nowrap">
                      {formatDate(selectedMessage.createdAt)}
                    </div>
                  </div>
                  {selectedMessage.receiverId === currentUserId && (
                    <div className="mt-2 text-sm text-gray-600">
                      <strong>To:</strong> {
                        selectedMessage.productId && isSeller && shopName
                          ? shopName
                          : (userName || 'You')
                      }
                      {selectedMessage.productId && isSeller && shopName && (
                        <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          Your Shop
                        </span>
                      )}
                    </div>
                  )}
                  {selectedMessage.senderId === currentUserId && (
                    <div className="mt-2 text-sm text-gray-600">
                      <strong>To:</strong> {
                        selectedMessage.Receiver.shopName || selectedMessage.Receiver.name || selectedMessage.Receiver.email
                      }
                    </div>
                  )}
                  {selectedMessage.Product && (
                    <div className="mt-2">
                      <Link
                        href={`/product/${selectedMessage.Product.id}`}
                        className="text-[var(--rust)] hover:underline text-sm cursor-pointer break-words"
                      >
                        Related Product: {selectedMessage.Product.title}
                      </Link>
                    </div>
                  )}
                </div>
                <div className="whitespace-pre-wrap mb-6 break-words text-sm sm:text-base">
                  {selectedMessage.content}
                </div>

                {/* Reply Section */}
                {!isReplying ? (
                  <button
                    onClick={() => setIsReplying(true)}
                    className="flex items-center gap-2 text-[var(--rust)] hover:text-[#b84f2f] transition cursor-pointer"
                  >
                    <Reply className="h-4 w-4" />
                    <span>Reply</span>
                  </button>
                ) : (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3 text-base sm:text-lg">Reply to this message</h3>
                    <form onSubmit={handleReply} className="space-y-3">
                      {/* Send As (only for sellers) */}
                      {isSeller && shopName && (
                        <div>
                          <label className="block text-sm font-medium mb-2">Send as:</label>
                          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                            <label className={`flex items-center cursor-pointer px-3 py-2 rounded-lg border-2 transition ${
                              selectedMessage.receiverId === currentUserId && !selectedMessage.productId
                                ? 'bg-green-50 border-green-300'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}>
                              <input
                                type="radio"
                                checked={!sendAsShop}
                                onChange={() => setSendAsShop(false)}
                                className="mr-2 cursor-pointer"
                              />
                              <span className="text-sm sm:text-base">{userName || 'Myself'}</span>
                              {selectedMessage.receiverId === currentUserId && !selectedMessage.productId && (
                                <span className="ml-2 text-xs bg-green-600 text-white px-2 py-1 rounded font-semibold">
                                  Original recipient
                                </span>
                              )}
                            </label>
                            <label className={`flex items-center cursor-pointer px-3 py-2 rounded-lg border-2 transition ${
                              selectedMessage.receiverId === currentUserId && selectedMessage.productId
                                ? 'bg-green-50 border-green-300'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}>
                              <input
                                type="radio"
                                checked={sendAsShop}
                                onChange={() => setSendAsShop(true)}
                                className="mr-2 cursor-pointer"
                              />
                              <span className="text-sm sm:text-base">{shopName}</span>
                              {selectedMessage.receiverId === currentUserId && selectedMessage.productId && (
                                <span className="ml-2 text-xs bg-green-600 text-white px-2 py-1 rounded font-semibold">
                                  Original recipient
                                </span>
                              )}
                            </label>
                          </div>
                        </div>
                      )}
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        style={{ border: '2px solid #6B7280' }}
                        className="w-full rounded px-3 py-2 h-32 sm:h-40 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[var(--rust)] bg-white resize-none"
                        placeholder="Type your reply..."
                        required
                      />
                      {replyError && (
                        <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded text-sm">
                          {replyError}
                        </div>
                      )}
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setIsReplying(false);
                            setReplyContent('');
                            setReplyError('');
                            setSendAsShop(false);
                          }}
                          className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition cursor-pointer text-sm sm:text-base"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={sendingReply || !replyContent.trim()}
                          className="w-full sm:w-auto px-4 py-2 bg-[var(--rust)] text-white rounded hover:bg-[#b84f2f] transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed text-sm sm:text-base"
                        >
                          {sendingReply ? 'Sending...' : 'Send Reply'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex bg-white border rounded-lg p-8 text-center h-full items-center justify-center">
                <p className="text-gray-600">Select a message to view</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
