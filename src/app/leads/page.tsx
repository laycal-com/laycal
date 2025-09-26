"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from 'sonner';
import CsvUpload from "@/components/CsvUpload";
import { PaymentGateWrapper } from "@/components/PaymentGateWrapper";

interface Lead {
  _id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  company?: string;
  notes?: string;
  status: 'pending' | 'calling' | 'completed' | 'failed';
  vapiCallId?: string;
  callResults?: {
    answered: boolean;
    duration?: number;
    summary?: string;
    transcript?: string;
    endReason?: string;
    cost?: number;
    evaluation?: 'positive' | 'neutral' | 'negative';
  };
  createdAt: string;
  calledAt?: string;
}

interface CallSummary {
  _id: string;
  vapiCallId: string;
  phoneNumberId: string;
  leadId?: string;
  callData: {
    duration?: number;
    endReason?: string;
    status: 'completed' | 'failed' | 'no-answer' | 'busy';
    cost?: number;
    startTime?: string;
    endTime?: string;
  };
  transcript?: string;
  summary?: string;
  evaluation?: 'positive' | 'negative' | 'neutral';
  structuredData?: {[key: string]: any};
  extractedInfo: {[key: string]: any};
  appointmentCreated?: boolean;
  appointmentData?: {
    title?: string;
    startTime?: string;
    endTime?: string;
    confirmed?: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

interface StatusCounts {
  pending: number;
  calling: number;
  completed: number;
  failed: number;
  total: number;
}

interface LeadsResponse {
  leads: Lead[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  statusCounts: StatusCounts;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    pending: 0,
    calling: 0,
    completed: 0,
    failed: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [retryingLeads, setRetryingLeads] = useState<Set<string>>(new Set());
  const [leadCallSummary, setLeadCallSummary] = useState<CallSummary | null>(null);
  const [loadingCallSummary, setLoadingCallSummary] = useState(false);

  const fetchLeads = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(`/api/leads?${params}`);
      if (!response.ok) throw new Error('Failed to fetch leads');

      const data: LeadsResponse = await response.json();
      setLeads(data.leads);
      setStatusCounts(data.statusCounts);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [currentPage, statusFilter, searchQuery]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'calling': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const fetchCallSummary = async (leadId: string) => {
    setLoadingCallSummary(true);
    try {
      const response = await fetch(`/api/call-summaries?leadId=${leadId}&limit=1`);
      if (!response.ok) throw new Error('Failed to fetch call summary');
      
      const data = await response.json();
      if (data.success && data.summaries && data.summaries.length > 0) {
        setLeadCallSummary(data.summaries[0]);
      } else {
        setLeadCallSummary(null);
      }
    } catch (error) {
      console.error('Error fetching call summary:', error);
      setLeadCallSummary(null);
    } finally {
      setLoadingCallSummary(false);
    }
  };

  // Fetch call summary when a lead is selected
  useEffect(() => {
    if (selectedLead) {
      fetchCallSummary(selectedLead._id);
    } else {
      setLeadCallSummary(null);
    }
  }, [selectedLead]);

  const handleRetryCall = async (leadId: string) => {
    if (retryingLeads.has(leadId)) return;

    setRetryingLeads(prev => new Set(prev).add(leadId));

    try {
      const response = await fetch(`/api/leads/${leadId}/retry`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Retry failed');
      }

      const result = await response.json();
      console.log('Retry successful:', result);

      // Refresh leads to show updated status
      await fetchLeads();

      // Show success notification
      toast.success('Call Retry Initiated', {
        description: 'The call retry has been started successfully'
      });

    } catch (error) {
      console.error('Retry error:', error);
      toast.error('Retry Failed', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setRetryingLeads(prev => {
        const newSet = new Set(prev);
        newSet.delete(leadId);
        return newSet;
      });
    }
  };

  const canRetry = (lead: Lead) => {
    return lead.status === 'failed' || lead.status === 'completed' || lead.status === 'pending';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <PaymentGateWrapper>
      <div className="min-h-screen bg-gray-50">

      <div className="container mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Leads Management</h1>
          <p className="text-gray-600 mt-2">Manage and track your leads</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-gray-900">{statusCounts.total}</div>
            <div className="text-sm text-gray-600">Total Leads</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{statusCounts.calling}</div>
            <div className="text-sm text-gray-600">Calling</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-green-600">{statusCounts.completed}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-red-600">{statusCounts.failed}</div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>
        </div>

        {/* Upload Section */}
        {showUpload ? (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Upload CSV</h2>
              <button
                onClick={() => setShowUpload(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <CsvUpload />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Your Leads</h2>
                <p className="text-gray-600">Manage and track your lead calls</p>
              </div>
              <button
                onClick={() => setShowUpload(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Upload CSV
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="calling">Calling</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Leads Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {leads.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No leads found. Upload a CSV to get started!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Phone</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Call Results</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Created</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {leads.map((lead) => (
                    <tr key={lead._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-gray-900">{lead.name}</div>
                          {lead.email && (
                            <div className="text-sm text-gray-500">{lead.email}</div>
                          )}
                          {lead.company && (
                            <div className="text-sm text-gray-500">{lead.company}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{lead.phoneNumber}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(lead.status)}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {lead.callResults ? (
                          <div>
                            <div>
                              {lead.callResults.answered ? '✅ Answered' : '❌ No Answer'}
                            </div>
                            {lead.callResults.duration && (
                              <div className="text-gray-500">
                                Duration: {formatDuration(lead.callResults.duration)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(lead.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedLead(lead)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
                          >
                            View Details
                          </button>
                          {canRetry(lead) && (
                            <button
                              onClick={() => handleRetryCall(lead._id)}
                              disabled={retryingLeads.has(lead._id) || lead.status === 'calling'}
                              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                retryingLeads.has(lead._id) || lead.status === 'calling'
                                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                  : 'bg-green-600 text-white hover:bg-green-700'
                              }`}
                            >
                              {retryingLeads.has(lead._id) ? (
                                <div className="flex items-center">
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                  Retrying...
                                </div>
                              ) : (
                                'Retry Call'
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Lead Details Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/75 bg-opacity-50 flex items-center justify-center p-4 z-50 text-gray-800">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Lead Details</h3>
                <div className="flex items-center space-x-2">
                  {canRetry(selectedLead) && (
                    <button
                      onClick={() => {
                        handleRetryCall(selectedLead._id);
                        setSelectedLead(null);
                      }}
                      disabled={retryingLeads.has(selectedLead._id) || selectedLead.status === 'calling'}
                      className={`px-3 py-1 text-sm font-medium rounded ${
                        retryingLeads.has(selectedLead._id) || selectedLead.status === 'calling'
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {retryingLeads.has(selectedLead._id) ? 'Retrying...' : 'Retry Call'}
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedLead(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-700">Contact Information</h4>
                  <div className="mt-2 space-y-2">
                    <p><strong>Name:</strong> {selectedLead.name}</p>
                    <p><strong>Phone:</strong> {selectedLead.phoneNumber}</p>
                    {selectedLead.email && <p><strong>Email:</strong> {selectedLead.email}</p>}
                    {selectedLead.company && <p><strong>Company:</strong> {selectedLead.company}</p>}
                    {selectedLead.notes && <p><strong>Notes:</strong> {selectedLead.notes}</p>}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700">Call Status</h4>
                  <div className="mt-2">
                    <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(selectedLead.status)}`}>
                      {selectedLead.status}
                    </span>
                  </div>
                </div>

                {selectedLead.callResults && (
                  <div>
                    <h4 className="font-medium text-gray-700">Call Results</h4>
                    <div className="mt-2 space-y-2">
                      <p><strong>Answered:</strong> {selectedLead.callResults.answered ? 'Yes' : 'No'}</p>
                      {selectedLead.callResults.duration && (
                        <p><strong>Duration:</strong> {formatDuration(selectedLead.callResults.duration)}</p>
                      )}
                      {selectedLead.callResults.endReason && (
                        <p><strong>End Reason:</strong> {selectedLead.callResults.endReason}</p>
                      )}
                      {selectedLead.callResults.cost && (
                        <p><strong>Cost:</strong> ${selectedLead.callResults.cost.toFixed(2)}</p>
                      )}
                      {selectedLead.callResults.evaluation && (
                        <p><strong>Evaluation:</strong> 
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                            selectedLead.callResults.evaluation === 'positive' 
                              ? 'bg-green-100 text-green-800' 
                              : selectedLead.callResults.evaluation === 'negative'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {selectedLead.callResults.evaluation}
                          </span>
                        </p>
                      )}
                      {selectedLead.callResults.summary && (
                        <div>
                          <strong>Summary:</strong>
                          <p className="mt-1 p-3 bg-gray-50 rounded text-sm">{selectedLead.callResults.summary}</p>
                        </div>
                      )}
                      {selectedLead.callResults.transcript && (
                        <div>
                          <strong>Transcript:</strong>
                          <p className="mt-1 p-3 bg-gray-50 rounded text-sm max-h-40 overflow-y-auto">{selectedLead.callResults.transcript}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Call Summary Section */}
                <div>
                  <h4 className="font-medium text-gray-700">Call Data Analysis</h4>
                  {loadingCallSummary ? (
                    <div className="mt-2 flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm text-gray-600">Loading call analysis...</span>
                    </div>
                  ) : leadCallSummary ? (
                    <div className="mt-2 space-y-3">
                      {/* Extracted Information */}
                      {Object.keys(leadCallSummary.extractedInfo).length > 0 && (
                        <div>
                          <strong className="text-sm">Extracted Information:</strong>
                          <div className="mt-1 p-3 bg-blue-50 rounded text-sm space-y-1">
                            {Object.entries(leadCallSummary.extractedInfo).map(([key, value]) => (
                              value && (
                                <div key={key} className="flex justify-between">
                                  <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>
                                  <span>{typeof value === 'string' ? value : JSON.stringify(value)}</span>
                                </div>
                              )
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Appointment Information */}
                      {leadCallSummary.appointmentCreated && leadCallSummary.appointmentData && (
                        <div>
                          <strong className="text-sm">Appointment:</strong>
                          <div className="mt-1 p-3 bg-green-50 rounded text-sm space-y-1">
                            {leadCallSummary.appointmentData.title && (
                              <p><strong>Title:</strong> {leadCallSummary.appointmentData.title}</p>
                            )}
                            {leadCallSummary.appointmentData.startTime && (
                              <p><strong>Start:</strong> {formatDate(leadCallSummary.appointmentData.startTime)}</p>
                            )}
                            {leadCallSummary.appointmentData.endTime && (
                              <p><strong>End:</strong> {formatDate(leadCallSummary.appointmentData.endTime)}</p>
                            )}
                            <p><strong>Status:</strong> 
                              <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                                leadCallSummary.appointmentData.confirmed 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {leadCallSummary.appointmentData.confirmed ? 'Confirmed' : 'Pending'}
                              </span>
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Structured Data */}
                      {leadCallSummary.structuredData && Object.keys(leadCallSummary.structuredData).length > 0 && (
                        <div>
                          <strong className="text-sm">Additional Data:</strong>
                          <div className="mt-1 p-3 bg-gray-50 rounded text-sm space-y-1">
                            {Object.entries(leadCallSummary.structuredData).map(([key, value]) => (
                              value && !['name', 'email', 'phoneNumber', 'slot_booked'].includes(key) && (
                                <div key={key} className="flex justify-between">
                                  <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>
                                  <span>{typeof value === 'string' ? value : JSON.stringify(value)}</span>
                                </div>
                              )
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Call Summary Technical Details */}
                      <div>
                        <strong className="text-sm">Technical Details:</strong>
                        <div className="mt-1 p-3 bg-gray-50 rounded text-sm space-y-1">
                          <p><strong>Call ID:</strong> {leadCallSummary.vapiCallId}</p>
                          <p><strong>Phone Number ID:</strong> {leadCallSummary.phoneNumberId}</p>
                          {leadCallSummary.callData.startTime && (
                            <p><strong>Call Start:</strong> {formatDate(leadCallSummary.callData.startTime)}</p>
                          )}
                          {leadCallSummary.callData.endTime && (
                            <p><strong>Call End:</strong> {formatDate(leadCallSummary.callData.endTime)}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-gray-500">No call analysis data available</p>
                  )}
                </div>

                <div>
                  <h4 className="font-medium text-gray-700">Timestamps</h4>
                  <div className="mt-2 space-y-2">
                    <p><strong>Created:</strong> {formatDate(selectedLead.createdAt)}</p>
                    {selectedLead.calledAt && (
                      <p><strong>Called:</strong> {formatDate(selectedLead.calledAt)}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </PaymentGateWrapper>
  );
}