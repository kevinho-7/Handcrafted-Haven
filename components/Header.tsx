'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Menu, Search, ShoppingCart, Bell, User, X } from 'lucide-react';
import { authClient } from '@/lib/auth/client';
import { useCart } from '../app/context/CartContext';


import { useRouter } from 'next/navigation';
import BottomBar from './BottomBar';

function toTitleCase(text: string) {
  return text
    .split(/[\s-]+/)       // split by spaces or hyphens
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

interface SearchResult {
  id: number;
  name: string;
}

export default function Header() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const { data } = authClient.useSession();
  const user = data?.user;
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { cartCount } = useCart();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        if (!res.ok) throw new Error("Failed to fetch categories");
        const data = await res.json();
        setCategories(data.categories || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        try {
          const res = await fetch("/api/profile");
          if (res.ok) {
            const data = await res.json();
            setUserName(data.user.name);
            setUserRole(data.user.role);
          }
        } catch (err) {
          console.error("Failed to fetch user profile:", err);
        }
      }
    };
    fetchUserProfile();
  }, [user]);

  // Fetch unread notification count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (user) {
        try {
          const res = await fetch("/api/notifications/unread-count", {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
            },
          });
          if (res.ok) {
            const data = await res.json();
            setUnreadCount(data.unreadCount || 0);
          }
        } catch (err) {
          console.error("Failed to fetch unread count:", err);
        }
      }
    };
    
    fetchUnreadCount();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    
    // Listen for custom event when notification is read
    const handleNotificationRead = () => fetchUnreadCount();
    window.addEventListener('notificationRead', handleNotificationRead);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('notificationRead', handleNotificationRead);
    };
  }, [user]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setSearchResults(data.products || []);
        setShowResults(true);
      } catch {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);  //debounce search input so it doesn't fire on every keystroke
  }, [searchTerm]);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      router.push(`/search?query=${encodeURIComponent(searchTerm.trim())}`);
      setShowResults(false);
    }
  };

  const handleLogout = async () => {
    await authClient.signOut();
    router.push('/');
  };

  return (
    <>
      <header>
        {/* Desktop Layout */}
        <div className="hidden md:block px-6 py-4">
          <div className="flex items-center justify-between gap-4 text-black">
            {/* Left */}
            <div className="flex items-center gap-4 shrink-0">
              <Link href="/" className="flex items-center">
                <Image
                  src="/Logo_5.png"
                  alt="Handcrafted Haven logo"
                  width={180}
                  height={60}
                  priority
                  style={{ width: 'auto', height: '60px' }}
                />
              </Link>

              <button
                aria-label="Open categories"
                onClick={() => setMenuOpen(true)}
                className="p-2 rounded hover:bg-gray-100 cursor-pointer"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>

            {/* Middle */}
            <div className="flex-1 max-w-xl relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearch}
                className="w-full border border-gray-300 rounded pl-10 pr-4 py-2 bg-white text-black focus:outline-none focus:ring-2 focus:ring-[#e76b4c]"
                onFocus={() => searchResults.length > 0 && setShowResults(true)}
                onBlur={() => setTimeout(() => setShowResults(false), 200)}
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-black" />

              {showResults && searchResults.length > 0 && (
                <ul className="absolute top-full left-0 w-full bg-white border mt-1 rounded shadow z-50 max-h-64 overflow-auto">
                  {searchResults.map((product: any) => (
                    <li
                      key={product.id}
                      className="px-4 py-2 hover:bg-gray-100 flex justify-between items-center"
                    >
                      <Link
                        href={`/product/${product.id}`}
                        onClick={() => setShowResults(false)}
                        className="flex-1"
                      >
                        <span className="font-medium">{product.title}</span>
                      </Link>
                      <span className="ml-2 text-gray-600">${product.price.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Right */}
            <div className="flex items-center gap-4 shrink-0">
              {user ? (
                <div 
                  className="relative"
                  onMouseEnter={() => setShowUserDropdown(true)}
                  onMouseLeave={() => setShowUserDropdown(false)}
                >
                  <Link 
                    href="/account/profile"
                    className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                  >
                    <User />
                    <span className="text-sm font-medium">
                      {userName || user.email?.split('@')[0]}
                    </span>
                  </Link>
                  
                  {showUserDropdown && (
                    <div className="absolute right-0 mt-0 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                      <Link
                        href="/account/profile"
                        className="block px-4 py-2 text-gray-800 hover:bg-gray-100 rounded-t-lg cursor-pointer"
                      >
                        Profile
                      </Link>
                      {userRole === 'SELLER' && (
                        <Link
                          href="/account/dashboard"
                          className="block px-4 py-2 text-gray-800 hover:bg-gray-100 cursor-pointer"
                        >
                          Dashboard
                        </Link>
                      )}
                      <Link
                        href="/account/messages"
                        className="block px-4 py-2 text-gray-800 hover:bg-gray-100 cursor-pointer"
                      >
                        Messages
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 rounded-b-lg cursor-pointer"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link 
                  href="/auth/sign-in" 
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                >
                  <User />
                </Link>
              )}
              <Link href="/cart" className="p-2 hover:bg-gray-100 rounded  relative cursor-pointer">
                <ShoppingCart />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>
              <Link href="/account/notifications" className="p-2 hover:bg-gray-100 rounded relative cursor-pointer">
                <Bell />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden">
          {/* Top Row - Logo (smaller) and Icons */}
          <div className="px-4 py-3 flex items-center justify-between border-b">
            <div className="flex items-center gap-3">
              <button
                aria-label="Open categories"
                onClick={() => setMenuOpen(true)}
                className="p-2 rounded hover:bg-gray-100 cursor-pointer"
              >
                <Menu className="h-6 w-6" />
              </button>
              
              <Link href="/" className="flex items-center">
                <Image
                  src="/Logo_5.png"
                  alt="Handcrafted Haven logo"
                  width={120}
                  height={40}
                  priority
                  style={{ width: 'auto', height: '32px' }}
                />
              </Link>
            </div>

            <div className="flex items-center gap-2">
              {user ? (
                <Link 
                  href="/account/profile"
                  className="p-2 hover:bg-gray-100 rounded cursor-pointer"
                >
                  <User className="h-5 w-5" />
                </Link>
              ) : (
                <Link 
                  href="/auth/sign-in" 
                  className="p-2 hover:bg-gray-100 rounded cursor-pointer"
                >
                  <User className="h-5 w-5" />
                </Link>
              )}
              <Link href="/cart" className="p-2 hover:bg-gray-100 rounded relative cursor-pointer">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>
              <Link href="/account/notifications" className="p-2 hover:bg-gray-100 rounded relative cursor-pointer">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* Bottom Row - Search Bar */}
          <div className="px-4 py-3 relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearch}
              className="w-full border border-gray-300 rounded pl-10 pr-4 py-2 bg-white text-black focus:outline-none focus:ring-2 focus:ring-[#e76b4c]"
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 200)}
            />
            <Search className="absolute left-7 top-6 h-5 w-5 text-black" />

            {showResults && searchResults.length > 0 && (
              <ul className="absolute top-full left-4 right-4 bg-white border mt-1 rounded shadow z-50 max-h-64 overflow-auto">
                {searchResults.map((product: any) => (
                  <li
                    key={product.id}
                    className="px-4 py-2 hover:bg-gray-100 flex justify-between items-center"
                  >
                    <Link
                      href={`/product/${product.id}`}
                      onClick={() => setShowResults(false)}
                      className="flex-1"
                    >
                      <span className="font-medium text-sm">{product.title}</span>
                    </Link>
                    <span className="ml-2 text-gray-600 text-sm">${product.price.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* BOTTOM BAR - hidden on mobile devices */}
        <BottomBar categories={categories}/>
      </header>

      {/* OVERLAY */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* SLIDE-OUT MENU */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-[var(--rust)] text-white z-50 transform transition-transform duration-300 overflow-y-auto ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-white bg-[var(--rust)]">
          <h2 className="text-lg font-semibold text-white">Menu</h2>
          <button aria-label="Close menu" onClick={() => setMenuOpen(false)} className="cursor-pointer">
            <X className="text-white" />
          </button>
        </div>

        {/* User Section - Mobile Only */}
        {user && (
          <div className="md:hidden border-b border-white/30 p-4">
            <p className="text-sm text-white mb-3">
              {userName || user.email?.split('@')[0]}
            </p>
            <div className="flex flex-col gap-2">
              <Link
                href="/account/profile"
                onClick={() => setMenuOpen(false)}
                className="text-white hover:underline cursor-pointer text-sm"
              >
                Profile
              </Link>
              {userRole === 'SELLER' && (
                <Link
                  href="/account/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="text-white hover:underline cursor-pointer text-sm"
                >
                  Dashboard
                </Link>
              )}
              <Link
                href="/account/messages"
                onClick={() => setMenuOpen(false)}
                className="text-white hover:underline cursor-pointer text-sm"
              >
                Messages
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setMenuOpen(false);
                }}
                className="text-left text-white hover:underline cursor-pointer text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        )}

        <div className="px-4 py-3">
          <Link
            href="/product-list"
            onClick={() => setMenuOpen(false)}
            className="block py-2 text-white font-semibold hover:underline cursor-pointer"
          >
            All Products
          </Link>
        </div>

        <div className="px-4 py-3 border-t border-white/30">
          <h3 className="text-sm font-semibold text-white mb-2">Categories</h3>
        </div>

        <nav className="flex flex-col px-4 pb-4 gap-3">
          {categories.map((category) => (
            <Link
              key={category}
              href={`/category/${category.toLowerCase()}`}
              onClick={() => setMenuOpen(false)}
              className="hover:underline text-white cursor-pointer"
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
