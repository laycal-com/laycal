'use client';

import { useState, useEffect } from 'react';
import { Mail, Users, TrendingUp, Download, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface EmailSubscriber {
  _id: string;
  email: string;
  source: string;
  postTitle?: string;
  subscribedAt: string;
  isActive: boolean;
  ipAddress?: string;
}

interface EmailStats {
  totalSubscribers: number;
  totalUnsubscribed: number;
  recentSubscribers: EmailSubscriber[];
  sourceStats: { _id: string; count: number }[];
}

export default function AdminEmailsPage() {
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [allEmails, setAllEmails] = useState<EmailSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchEmailData();
  }, []);

  const fetchEmailData = async () => {
    try {
      setLoading(true);

      // Fetch stats
      const statsResponse = await fetch('/api/email-collection?admin=admin-stats-key');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Fetch all emails (you might want to implement pagination on the backend)
      const emailsResponse = await fetch('/api/admin/emails');
      if (emailsResponse.ok) {
        const emailsData = await emailsResponse.json();
        setAllEmails(emailsData.emails || []);
      }
    } catch (error) {
      toast.error('Failed to load email data');
      console.error('Error fetching email data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportEmails = () => {
    const filteredEmails = getFilteredEmails();
    const csvContent = [
      ['Email', 'Source', 'Post Title', 'Subscribed Date', 'Status'].join(','),
      ...filteredEmails.map(email => [
        email.email,
        email.source,
        email.postTitle || '',
        new Date(email.subscribedAt).toLocaleDateString(),
        email.isActive ? 'Active' : 'Unsubscribed'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `email-subscribers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getFilteredEmails = () => {
    return allEmails.filter(email => {
      const matchesSearch = email.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (email.postTitle && email.postTitle.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesSource = sourceFilter === 'all' || email.source === sourceFilter;
      return matchesSearch && matchesSource;
    });
  };

  const filteredEmails = getFilteredEmails();
  const totalPages = Math.ceil(filteredEmails.length / itemsPerPage);
  const paginatedEmails = filteredEmails.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading email data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Subscribers</h1>
          <p className="text-gray-600">Manage and monitor email subscriptions from blog popups</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
                <Users className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.totalSubscribers}</div>
                <p className="text-xs text-gray-600">Active subscriptions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unsubscribed</CardTitle>
                <TrendingUp className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.totalUnsubscribed}</div>
                <p className="text-xs text-gray-600">Former subscribers</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <Mail className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {((stats.totalSubscribers / (stats.totalSubscribers + stats.totalUnsubscribed)) * 100).toFixed(1)}%
                </div>
                <p className="text-xs text-gray-600">Active vs total</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Source Stats */}
        {stats && stats.sourceStats.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Subscription Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                {stats.sourceStats.map((source) => (
                  <div key={source._id} className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{source.count}</div>
                    <div className="text-sm text-gray-600 capitalize">{source._id.replace('_', ' ')}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters and Actions */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col md:flex-row gap-4 flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search emails or post titles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-80"
                  />
                </div>
                
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                    className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                  >
                    <option value="all">All Sources</option>
                    <option value="blog_popup">Blog Popup</option>
                    <option value="footer">Footer</option>
                    <option value="landing_page">Landing Page</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <Button onClick={exportEmails} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Email List */}
        <Card>
          <CardHeader>
            <CardTitle>All Subscribers ({filteredEmails.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Source</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Post Title</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedEmails.map((email) => (
                    <tr key={email._id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{email.email}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {email.source.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">
                        {email.postTitle || '—'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(email.subscribedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          email.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {email.isActive ? 'Active' : 'Unsubscribed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredEmails.length)} of {filteredEmails.length} results
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}