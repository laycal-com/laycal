"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalCalls: number;
  monthlyCallsToday: number;
  assistantsCreated: number;
  pendingContacts: number;
  openTickets: number;
  systemHealth: {
    status: 'healthy' | 'warning' | 'critical';
    uptime: string;
    lastUpdate: string;
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'pricing':
        router.push('/admin/pricing');
        break;
      case 'users':
        router.push('/admin/users');
        break;
      case 'contacts':
        router.push('/admin/contacts');
        break;
      case 'support':
        router.push('/admin/support');
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const StatCard = ({ title, value, subtitle, icon, color = 'blue' }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: string;
    color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  }) => {
    const colorClasses = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      yellow: 'bg-yellow-500',
      red: 'bg-red-500',
      purple: 'bg-purple-500'
    };

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className={`${colorClasses[color]} rounded-md p-3 mr-4`}>
            <span className="text-white text-xl">{icon}</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            {subtitle && (
              <p className="text-sm text-gray-500">{subtitle}</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Welcome to your admin control center. Monitor your platform's performance and manage settings.</p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          subtitle={`${stats?.activeUsers || 0} active this month`}
          icon="👥"
          color="blue"
        />
        <StatCard
          title="Monthly Revenue"
          value={`$${stats?.monthlyRevenue?.toFixed(2) || '0.00'}`}
          subtitle={`Total: $${stats?.totalRevenue?.toFixed(2) || '0.00'}`}
          icon="💰"
          color="green"
        />
        <StatCard
          title="Total Calls"
          value={stats?.totalCalls || 0}
          subtitle={`${stats?.monthlyCallsToday || 0} today`}
          icon="📞"
          color="purple"
        />
        <StatCard
          title="Assistants Created"
          value={stats?.assistantsCreated || 0}
          subtitle="All time"
          icon="🤖"
          color="yellow"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Pending Contacts"
          value={stats?.pendingContacts || 0}
          subtitle="New inquiries"
          icon="📝"
          color="yellow"
        />
        <StatCard
          title="Open Support Tickets"
          value={stats?.openTickets || 0}
          subtitle="Require attention"
          icon="🎫"
          color="red"
        />
        <StatCard
          title="System Status"
          value={stats?.systemHealth?.status === 'healthy' ? 'Healthy' : 
                stats?.systemHealth?.status === 'warning' ? 'Warning' : 'Critical'}
          subtitle={`Uptime: ${stats?.systemHealth?.uptime || 'N/A'}`}
          icon={stats?.systemHealth?.status === 'healthy' ? '✅' : 
                stats?.systemHealth?.status === 'warning' ? '⚠️' : '❌'}
          color={stats?.systemHealth?.status === 'healthy' ? 'green' : 
                 stats?.systemHealth?.status === 'warning' ? 'yellow' : 'red'}
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <div className="p-6">
          <div className="text-center text-gray-500 py-8">
            <span className="text-4xl mb-4 block">📊</span>
            <p>Activity tracking will be implemented here</p>
            <p className="text-sm">Recent user actions, system events, and important notifications</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button 
              onClick={() => handleQuickAction('pricing')}
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center cursor-pointer"
            >
              <span className="text-2xl block mb-2">⚙️</span>
              <span className="font-medium text-gray-700">Update Pricing</span>
              <p className="text-sm text-gray-500 mt-1">Modify system pricing settings</p>
            </button>
            <button 
              onClick={() => handleQuickAction('users')}
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-center cursor-pointer"
            >
              <span className="text-2xl block mb-2">💳</span>
              <span className="font-medium text-gray-700">Manage Users</span>
              <p className="text-sm text-gray-500 mt-1">Add credits & manage accounts</p>
            </button>
            <button 
              onClick={() => handleQuickAction('contacts')}
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors text-center cursor-pointer"
            >
              <span className="text-2xl block mb-2">📧</span>
              <span className="font-medium text-gray-700">Review Contacts</span>
              <p className="text-sm text-gray-500 mt-1">Process new inquiries</p>
            </button>
            <button 
              onClick={() => handleQuickAction('support')}
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors text-center cursor-pointer"
            >
              <span className="text-2xl block mb-2">🎫</span>
              <span className="font-medium text-gray-700">Support Tickets</span>
              <p className="text-sm text-gray-500 mt-1">Handle customer support requests</p>
            </button>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">System Information</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Platform Status</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Database</span>
                  <span className="text-green-600 font-medium">Connected</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">API Status</span>
                  <span className="text-green-600 font-medium">Operational</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Vapi Integration</span>
                  <span className="text-green-600 font-medium">Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">PayPal Integration</span>
                  <span className="text-green-600 font-medium">Active</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Recent Updates</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• Admin dashboard launched</p>
                <p>• Webhook billing system updated</p>
                <p>• PayPal integration improved</p>
                <p>• Credit management system added</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}