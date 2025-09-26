"use client";

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface SupportTicket {
  _id: string;
  ticketId: string;
  userId?: string;
  userEmail: string;
  userName?: string;
  subject: string;
  description: string;
  category: 'technical' | 'billing' | 'feature_request' | 'bug_report' | 'account' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_customer' | 'waiting_internal' | 'resolved' | 'closed';
  assignedTo?: string;
  tags: string[];
  messages: Array<{
    id: string;
    from: 'user' | 'admin';
    authorId: string;
    authorName: string;
    message: string;
    isInternal: boolean;
    createdAt: string;
  }>;
  userSubscriptionType?: string;
  userCreditBalance?: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminSupport() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [newMessage, setNewMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    loadTickets();
  }, [filterStatus, filterCategory, filterPriority]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterCategory !== 'all') params.append('category', filterCategory);
      if (filterPriority !== 'all') params.append('priority', filterPriority);

      console.log('Admin frontend: Loading tickets with params:', params.toString());
      
      const response = await fetch(`/api/admin/support?${params}`);
      console.log('Admin frontend: Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Admin frontend: Received data:', data);
        console.log('Admin frontend: Number of tickets:', data.tickets?.length || 0);
        setTickets(data.tickets || []);
      } else {
        const errorData = await response.json();
        console.error('Admin frontend: Error response:', errorData);
        toast.error('Failed to load support tickets: ' + (errorData.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Admin frontend: Failed to load tickets:', error);
      toast.error('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  const updateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/support/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        setTickets(tickets.map(ticket =>
          ticket._id === ticketId ? { ...ticket, status: status as any } : ticket
        ));
        if (selectedTicket?._id === ticketId) {
          setSelectedTicket({ ...selectedTicket, status: status as any });
        }
        toast.success('Status updated');
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const sendMessage = async () => {
    if (!selectedTicket || !newMessage.trim()) return;

    setSendingMessage(true);
    try {
      const response = await fetch(`/api/admin/support/${selectedTicket._id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: newMessage.trim(),
          isInternal
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedTicket({
          ...selectedTicket,
          messages: [...selectedTicket.messages, data.message]
        });
        setTickets(tickets.map(ticket =>
          ticket._id === selectedTicket._id
            ? { ...ticket, messages: [...ticket.messages, data.message] }
            : ticket
        ));
        setNewMessage('');
        setIsInternal(false);
        toast.success('Message sent');
      } else {
        toast.error('Failed to send message');
      }
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'waiting_customer': return 'bg-yellow-100 text-yellow-800';
      case 'waiting_internal': return 'bg-purple-100 text-purple-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'billing': return 'bg-purple-100 text-purple-800';
      case 'technical': return 'bg-blue-100 text-blue-800';
      case 'bug_report': return 'bg-red-100 text-red-800';
      case 'feature_request': return 'bg-green-100 text-green-800';
      case 'account': return 'bg-indigo-100 text-indigo-800';
      case 'phone_number_request': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Support Tickets</h1>
        <p className="text-gray-600">
          Manage and respond to customer support requests.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="waiting_customer">Waiting Customer</option>
              <option value="waiting_internal">Waiting Internal</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="general">General</option>
              <option value="technical">Technical</option>
              <option value="billing">Billing</option>
              <option value="feature_request">Feature Request</option>
              <option value="bug_report">Bug Report</option>
              <option value="account">Account</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={loadTickets}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ticket
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category & Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tickets.map((ticket) => (
                <tr key={ticket._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {ticket.ticketId}
                      </div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {ticket.subject}
                      </div>
                      <div className="text-xs text-gray-400">
                        {ticket.messages.length} message{ticket.messages.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {ticket.userName || 'Unknown'}
                      </div>
                      <div className="text-sm text-gray-500">{ticket.userEmail}</div>
                      {ticket.userSubscriptionType && (
                        <div className="text-xs text-gray-400">
                          {ticket.userSubscriptionType.toUpperCase()} plan
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(ticket.category)}`}>
                        {ticket.category.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority.toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={ticket.status}
                      onChange={(e) => updateTicketStatus(ticket._id, e.target.value)}
                      className={`text-xs font-semibold rounded-full px-2 py-1 border-0 ${getStatusColor(ticket.status)}`}
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="waiting_customer">Waiting Customer</option>
                      <option value="waiting_internal">Waiting Internal</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                    <div className="text-xs">
                      {new Date(ticket.createdAt).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedTicket(ticket);
                        setShowModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {tickets.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No support tickets found</p>
          </div>
        )}
      </div>

      {/* Ticket Details Modal */}
      {showModal && selectedTicket && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{selectedTicket.ticketId}</h3>
                <p className="text-gray-600">{selectedTicket.subject}</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Ticket Info */}
              <div className="lg:col-span-1">
                <h4 className="font-medium text-gray-900 mb-3">Ticket Information</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Status:</strong> {selectedTicket.status.replace('_', ' ')}</div>
                  <div><strong>Priority:</strong> {selectedTicket.priority}</div>
                  <div><strong>Category:</strong> {selectedTicket.category.replace('_', ' ')}</div>
                  <div><strong>Customer:</strong> {selectedTicket.userName || 'Unknown'}</div>
                  <div><strong>Email:</strong> {selectedTicket.userEmail}</div>
                  {selectedTicket.userSubscriptionType && (
                    <div><strong>Plan:</strong> {selectedTicket.userSubscriptionType}</div>
                  )}
                  {selectedTicket.userCreditBalance !== undefined && (
                    <div><strong>Credits:</strong> ${selectedTicket.userCreditBalance.toFixed(2)}</div>
                  )}
                  <div><strong>Created:</strong> {new Date(selectedTicket.createdAt).toLocaleString()}</div>
                </div>
              </div>

              {/* Messages */}
              <div className="lg:col-span-2">
                <h4 className="font-medium text-gray-900 mb-3">Conversation</h4>
                
                {/* Message Thread */}
                <div className="border rounded-lg p-4 mb-4 max-h-96 overflow-y-auto">
                  {selectedTicket.messages.map((message) => (
                    <div key={message.id} className={`mb-4 ${message.from === 'admin' ? 'ml-8' : 'mr-8'}`}>
                      <div className={`p-3 rounded-lg ${
                        message.from === 'admin'
                          ? message.isInternal
                            ? 'bg-yellow-50 border-l-4 border-yellow-400'
                            : 'bg-blue-50'
                          : 'bg-gray-50'
                      }`}>
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium text-sm">
                            {message.authorName}
                            {message.from === 'admin' && (
                              <span className="ml-2 text-xs text-blue-600">Admin</span>
                            )}
                            {message.isInternal && (
                              <span className="ml-2 text-xs text-yellow-600">Internal Note</span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(message.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{message.message}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply Form */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="internal"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="internal" className="text-sm text-gray-700">
                      Internal note (not visible to customer)
                    </label>
                  </div>
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={isInternal ? "Add an internal note..." : "Reply to customer..."}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sendingMessage || !newMessage.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingMessage ? 'Sending...' : isInternal ? 'Add Internal Note' : 'Send Reply'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}