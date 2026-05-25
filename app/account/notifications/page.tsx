'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bell, MessageSquare, Package, Trash2, ArrowLeft, Star } from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  messageId?: string;
  isRead: boolean;
  createdAt: string;
  Message?: {
    id: string;
    subject: string;
    Sender: {
      id: string;
      name?: string;
      email: string;
      shopName?: string;
    };
    Product?: {
      id: string;
      title: string;
    };
  };
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();

      if (res.ok) {
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const res = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
      });

      if (res.ok) {
        setNotifications(notifications.map(notif =>
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        ));
        // Trigger custom event to update header unread count
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('notificationRead'));
        }, 50);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const res = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setNotifications(notifications.filter(notif => notif.id !== notificationId));
        // Trigger custom event to update header unread count
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('notificationRead'));
        }, 50);
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'MESSAGE':
        return <MessageSquare className="h-5 w-5" />;
      case 'ORDER':
        return <Package className="h-5 w-5" />;
      case 'REVIEW':
        return <Star className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-6">
        <p>Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-6">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/account/profile"
          className="p-2 hover:bg-gray-100 rounded cursor-pointer"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-3xl font-bold">Notifications</h1>
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white border rounded-lg p-8 text-center">
          <Bell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">No notifications yet</p>
        </div>
      ) : (
        <div className="bg-white border rounded-lg divide-y">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 hover:bg-gray-50 transition relative ${
                !notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-full relative ${
                  !notification.isRead ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {getIcon(notification.type)}
                  {!notification.isRead && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-blue-500 rounded-full border-2 border-white"></span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {notification.link ? (
                    <Link
                      href={notification.link}
                      onClick={() => handleNotificationClick(notification)}
                      className="block cursor-pointer"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-semibold text-gray-900 ${
                          !notification.isRead ? 'font-bold' : ''
                        }`}>
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full font-semibold">NEW</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(notification.createdAt)}
                      </p>
                    </Link>
                  ) : (
                    <div onClick={() => handleNotificationClick(notification)} className="cursor-pointer">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-semibold text-gray-900 ${
                          !notification.isRead ? 'font-bold' : ''
                        }`}>
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full font-semibold">NEW</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(notification.createdAt)}
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notification.id);
                  }}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                  aria-label="Delete notification"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
