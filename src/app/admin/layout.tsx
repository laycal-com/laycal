"use client";

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

interface AdminUser {
  _id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [ticketCounts, setTicketCounts] = useState({ active: 0, urgent: 0 });

  useEffect(() => {
    // Skip auth check on login page
    if (pathname === '/admin/login') {
      setLoading(false);
      return;
    }
    checkAuth();
  }, [pathname]);

  // Refresh ticket counts periodically and when visiting support page
  useEffect(() => {
    if (admin && pathname !== '/admin/login') {
      // Refresh counts when visiting support page
      if (pathname === '/admin/support') {
        loadTicketCounts();
      }

      // Set up periodic refresh every 2 minutes
      const interval = setInterval(loadTicketCounts, 2 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [admin, pathname]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/auth/me');
      if (response.ok) {
        const data = await response.json();
        setAdmin(data.admin);
        // Load ticket counts after successful auth
        loadTicketCounts();
      } else {
        router.push('/admin/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const loadTicketCounts = async () => {
    try {
      const response = await fetch('/api/admin/support/count');
      if (response.ok) {
        const data = await response.json();
        setTicketCounts({
          active: data.active || 0,
          urgent: data.urgent || 0
        });
      }
    } catch (error) {
      console.error('Failed to load ticket counts:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
      router.push('/admin/login');
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const navigation = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: '📊',
      permission: null
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: '👥',
      permission: 'view_users'
    },
    {
      name: 'Pricing Settings',
      href: '/admin/pricing',
      icon: '💰',
      permission: 'view_pricing'
    },
    {
      name: 'Contact Forms',
      href: '/admin/contacts',
      icon: '📝',
      permission: 'view_contacts'
    },
    {
      name: 'Support Tickets',
      href: '/admin/support',
      icon: '🎫',
      permission: 'view_support'
    },
    {
      name: 'Analytics',
      href: '/admin/analytics',
      icon: '📈',
      permission: 'view_analytics'
    },
    {
      name: 'Admin Management',
      href: '/admin/admins',
      icon: '👑',
      permission: 'manage_admins'
    }
  ];

  // Skip loading state and admin check for login page
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!admin) {
    return null;
  }

  const hasPermission = (permission: string | null) => {
    if (!permission) return true;
    return admin.permissions.includes(permission);
  };

  const filteredNavigation = navigation.filter(item => hasPermission(item.permission));

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white shadow-lg transition-all duration-300 flex flex-col`}>
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b">
          {sidebarOpen && (
            <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md hover:bg-gray-100"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            const isSupportTickets = item.name === 'Support Tickets';
            const showBadge = isSupportTickets && ticketCounts.active > 0;
            
            return (
              <div key={item.name} className="relative">
                <Link
                  href={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-lg mr-3">{item.icon}</span>
                  {sidebarOpen && <span>{item.name}</span>}
                </Link>
                
                {/* Notification Badge for Support Tickets */}
                {showBadge && (
                  <div
                    className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 shadow-md"
                    style={{ fontSize: '10px' }}
                  >
                    {ticketCounts.active > 99 ? '99+' : ticketCounts.active}
                  </div>
                )}
                
                {/* Urgent Indicator - Small dot if there are urgent tickets */}
                {isSupportTickets && ticketCounts.urgent > 0 && !showBadge && (
                  <div
                    className="absolute -top-1 -right-1 bg-red-500 rounded-full w-3 h-3 shadow-md"
                    title={`${ticketCounts.urgent} urgent ticket(s)`}
                  />
                )}
              </div>
            );
          })}
        </nav>

        {/* User info */}
        <div className="p-4 border-t">
          {sidebarOpen ? (
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-800">{admin.name}</div>
              <div className="text-xs text-gray-500">{admin.email}</div>
              <div className="text-xs font-medium text-blue-600 capitalize">{admin.role.replace('_', ' ')}</div>
              <button
                onClick={handleLogout}
                className="w-full text-left text-sm text-red-600 hover:text-red-800 mt-2"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="p-2 text-red-600 hover:text-red-800"
              title="Logout"
            >
              🚪
            </button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-800">
              {navigation.find(nav => pathname === nav.href || (nav.href !== '/admin' && pathname.startsWith(nav.href)))?.name || 'Dashboard'}
            </h2>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Welcome back, <span className="font-medium">{admin.name}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}