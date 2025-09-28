"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUser, SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import { toast } from 'sonner';
import { 
  MessageCircle, 
  Plus, 
  Clock, 
  AlertCircle, 
  CheckCircle,
  XCircle,
  ChevronRight,
  Mail,
  User
} from 'lucide-react';

interface SupportTicket {
  _id: string;
  ticketId: string;
  subject: string;
  status: 'open' | 'in-progress' | 'closed' | 'on-hold';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateTicketForm {
  subject: string;
  description: string;
  category: string;
}

export default function SupportPage() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [formData, setFormData] = useState<CreateTicketForm>({
    subject: '',
    description: '',
    category: 'general'
  });

  useEffect(() => {
    fetchTickets();
    
    // Mark support as visited when page loads
    localStorage.setItem('support-last-checked', new Date().toISOString());
    
    // Check for URL parameters
    const category = searchParams.get('category');
    if (category && category === 'custom_plan_request') {
      setFormData(prev => ({ 
        ...prev, 
        category: 'custom_plan_request',
        subject: 'Custom Plan Request',
        description: 'I am interested in setting up a custom enterprise plan. Please contact me to discuss pricing and requirements.\n\nBusiness requirements:\n- \n\nExpected volume:\n- \n\nSpecial features needed:\n- \n\nContact preference:\n- '
      }));
      setShowCreateForm(true);
    }
  }, [searchParams]);

  const fetchTicketDetails = async (ticketId: string) => {
    try {
      console.log('Fetching details for ticket:', ticketId);
      const response = await fetch(`/api/support/${ticketId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Ticket details:', data);
        setSelectedTicket(data.ticket);
      } else {
        toast.error('Failed to load ticket details');
      }
    } catch (error) {
      console.error('Failed to fetch ticket details:', error);
      toast.error('Failed to load ticket details');
    }
  };

  const fetchTickets = async () => {
    try {
      console.log('Frontend: Fetching tickets...');
      const response = await fetch('/api/support');
      console.log('Frontend: Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Frontend: Received data:', data);
        console.log('Frontend: Tickets array:', data.tickets);
        setTickets(data.tickets || []);
      } else {
        const errorData = await response.json();
        console.error('Frontend: Error response:', errorData);
        toast.error('Failed to load support tickets');
      }
    } catch (error) {
      console.error('Frontend: Failed to fetch tickets:', error);
      toast.error('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!replyMessage.trim() || !selectedTicket) {
      toast.error('Please enter a message');
      return;
    }

    setSendingReply(true);
    try {
      const response = await fetch(`/api/support/${selectedTicket.ticketId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: replyMessage,
          userName: user?.fullName || `${user?.firstName} ${user?.lastName}`.trim(),
          userEmail: user?.primaryEmailAddress?.emailAddress
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Reply sent successfully:', data);
        
        // Update the selected ticket with the new message
        setSelectedTicket(prev => prev ? {
          ...prev,
          messages: data.ticket.messages,
          status: data.ticket.status,
          updatedAt: data.ticket.updatedAt
        } : null);
        
        // Clear the reply form
        setReplyMessage('');
        
        // Refresh the tickets list to show updated status
        fetchTickets();
        
        toast.success('Reply sent successfully');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send reply');
      }
    } catch (error) {
      console.error('Failed to send reply:', error);
      toast.error('Failed to send reply', {
        description: error instanceof Error ? error.message : 'Please try again'
      });
    } finally {
      setSendingReply(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subject.trim() || !formData.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setCreating(true);
    try {
      const requestData = {
        subject: formData.subject,
        description: formData.description,
        category: formData.category,
        userEmail: user?.primaryEmailAddress?.emailAddress,
        userName: user?.fullName || `${user?.firstName} ${user?.lastName}`.trim()
      };
      
      console.log('Creating ticket with data:', requestData);
      
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Ticket created successfully:', data);
        toast.success('Support ticket created successfully', {
          description: `Ticket ID: ${data.ticketId}`
        });
        
        // Reset form and refresh tickets
        setFormData({ subject: '', description: '', category: 'general' });
        setShowCreateForm(false);
        fetchTickets();
      } else {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Failed to create ticket');
      }
    } catch (error) {
      console.error('Failed to create ticket:', error);
      toast.error('Failed to create support ticket', {
        description: error instanceof Error ? error.message : 'Please try again or contact us directly'
      });
    } finally {
      setCreating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      'open': <Clock className="h-4 w-4 text-blue-500" />,
      'in-progress': <AlertCircle className="h-4 w-4 text-yellow-500" />,
      'closed': <CheckCircle className="h-4 w-4 text-green-500" />,
      'on-hold': <XCircle className="h-4 w-4 text-gray-500" />
    };
    return icons[status as keyof typeof icons] || icons.open;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'open': 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      'closed': 'bg-green-100 text-green-800',
      'on-hold': 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || colors.open;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      'low': 'bg-gray-100 text-gray-800',
      'medium': 'bg-blue-100 text-blue-800',
      'high': 'bg-orange-100 text-orange-800',
      'urgent': 'bg-red-100 text-red-800'
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]" style={{ paddingTop: '80px' }}>
      <SignedOut>
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
          <Card className="max-w-md w-full mx-4 bg-white shadow-lg border border-[#e2e8f0]">
            <CardContent className="p-8 text-center">
              <MessageCircle className="h-12 w-12 text-[#64748b] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-[#1f2937] mb-4">Sign In Required</h2>
              <p className="text-[#64748b] mb-6">
                Please sign in to access the support center and create support tickets.
              </p>
              <SignInButton>
                <Button className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white">
                  Sign In to Continue
                </Button>
              </SignInButton>
            </CardContent>
          </Card>
        </div>
      </SignedOut>
      
      <SignedIn>
        <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-[#1f2937]">Support Center</h1>
              <p className="text-[#64748b] mt-2">
                Get help with your account, billing, or technical issues
              </p>
            </div>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-[#3b82f6] hover:bg-[#2563eb] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          </div>
        </div>

        {/* Create Ticket Modal/Form */}
        {showCreateForm && (
          <Card className="mb-8 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Create Support Ticket
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateTicket} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="general">General Question</option>
                      <option value="billing">Billing & Payments</option>
                      <option value="technical">Technical Issue</option>
                      <option value="feature_request">Feature Request</option>
                      <option value="bug_report">Bug Report</option>
                      <option value="account">Account Management</option>
                      <option value="custom_plan_request">Custom Plan Request</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {user?.primaryEmailAddress?.emailAddress}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Brief description of your issue"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Please provide detailed information about your issue, including any error messages or steps to reproduce the problem."
                    required
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                    disabled={creating}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={creating}
                  >
                    {creating ? 'Creating...' : 'Create Ticket'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Support Tickets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Your Support Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tickets.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Support Tickets
                </h3>
                <p className="text-gray-600 mb-6">
                  You haven't created any support tickets yet. Need help?
                </p>
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Ticket
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <div
                    key={ticket._id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors cursor-pointer"
                    onClick={() => fetchTicketDetails(ticket.ticketId)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono text-sm text-gray-500">
                            #{ticket.ticketId}
                          </span>
                          <Badge className={getStatusColor(ticket.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(ticket.status)}
                              {ticket.status.replace('-', ' ').toUpperCase()}
                            </div>
                          </Badge>
                          <Badge className={getPriorityColor(ticket.priority)}>
                            {ticket.priority.toUpperCase()}
                          </Badge>
                        </div>
                        
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {ticket.subject}
                        </h3>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>Category: {ticket.category}</span>
                          <span>Created: {formatDate(ticket.createdAt)}</span>
                          {ticket.updatedAt !== ticket.createdAt && (
                            <span>Updated: {formatDate(ticket.updatedAt)}</span>
                          )}
                        </div>
                      </div>
                      
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Contact Info */}
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Mail className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">Direct Contact</h3>
              </div>
              <p className="text-gray-600 text-sm mb-2">
                Need immediate assistance? You can also reach us directly:
              </p>
              <p className="text-sm">
                <strong>Email:</strong> contact@laycal.com<br />
                <strong>Response Time:</strong> Usually within 24 hours
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <h3 className="font-semibold">Before You Submit</h3>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Check your account settings first</li>
                <li>• Include error messages when possible</li>
                <li>• Billing questions get priority support</li>
                <li>• Technical issues: mention your browser/device</li>
              </ul>
            </CardContent>
          </Card>

          {/* Ticket Detail Modal */}
          {selectedTicket && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5" />
                        Ticket #{selectedTicket.ticketId}
                      </CardTitle>
                      <p className="text-gray-600 mt-1">{selectedTicket.subject}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        setSelectedTicket(null);
                        setReplyMessage('');
                      }}
                    >
                      ✕
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-6">
                    {/* Ticket Info */}
                    <div className="grid md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Status:</span>
                        <div className="mt-1">
                          <Badge className={getStatusColor(selectedTicket.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(selectedTicket.status)}
                              {selectedTicket.status.replace('-', ' ').toUpperCase()}
                            </div>
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Priority:</span>
                        <div className="mt-1">
                          <Badge className={getPriorityColor(selectedTicket.priority)}>
                            {selectedTicket.priority.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Category:</span>
                        <div className="mt-1 text-sm text-gray-900 capitalize">
                          {selectedTicket.category.replace('_', ' ')}
                        </div>
                      </div>
                    </div>

                    {/* Messages */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Conversation</h3>
                      <div className="space-y-4">
                        {selectedTicket.messages?.map((message, index) => (
                          <div
                            key={message.id || index}
                            className={`p-4 rounded-lg ${
                              message.from === 'user' 
                                ? 'bg-blue-50 ml-8' 
                                : 'bg-gray-50 mr-8'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">
                                  {message.from === 'user' ? 'You' : 'Support Team'}
                                </span>
                                {message.from === 'admin' && (
                                  <Badge variant="outline" className="text-xs">
                                    Staff
                                  </Badge>
                                )}
                              </div>
                              <span className="text-xs text-gray-500">
                                {formatDate(message.createdAt.toString())}
                              </span>
                            </div>
                            <p className="text-gray-800 whitespace-pre-wrap">
                              {message.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Reply Form - Only show if ticket is not closed */}
                    {selectedTicket.status !== 'closed' && (
                      <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold mb-4">Add Reply</h3>
                        <form onSubmit={handleSendReply} className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Your Message
                            </label>
                            <textarea
                              value={replyMessage}
                              onChange={(e) => setReplyMessage(e.target.value)}
                              rows={4}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Type your reply here..."
                              disabled={sendingReply}
                              required
                            />
                          </div>
                          <div className="flex justify-end">
                            <Button
                              type="submit"
                              className="bg-blue-600 hover:bg-blue-700"
                              disabled={sendingReply || !replyMessage.trim()}
                            >
                              {sendingReply ? 'Sending...' : 'Send Reply'}
                            </Button>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* Closed Ticket Notice */}
                    {selectedTicket.status === 'closed' && (
                      <div className="border-t pt-6">
                        <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 text-center">
                          <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                          <h3 className="font-semibold text-gray-900 mb-1">Ticket Closed</h3>
                          <p className="text-sm text-gray-600 mb-3">
                            This ticket has been closed by our support team.
                          </p>
                          <p className="text-xs text-gray-500">
                            Need more help? <button 
                              onClick={() => {
                                setSelectedTicket(null);
                                setShowCreateForm(true);
                              }}
                              className="text-blue-600 hover:text-blue-700 underline"
                            >
                              Create a new ticket
                            </button>
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Quick Info */}
                    <div className="text-xs text-gray-600 pt-4 border-t">
                      <p><strong>Created:</strong> {formatDate(selectedTicket.createdAt)}</p>
                      {selectedTicket.updatedAt !== selectedTicket.createdAt && (
                        <p><strong>Last Updated:</strong> {formatDate(selectedTicket.updatedAt)}</p>
                      )}
                      <p><strong>Status:</strong> 
                        <span className="capitalize ml-1">
                          {selectedTicket.status.replace('-', ' ')}
                        </span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
        </div>
      </SignedIn>
    </div>
  );
}