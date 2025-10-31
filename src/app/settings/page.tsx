"use client";

import { useState, useEffect } from "react";
import { toast } from 'sonner';
import { PaymentGateWrapper } from '@/components/PaymentGateWrapper';

interface PhoneProvider {
  id: string;
  providerName: 'twilio' | 'plivo' | 'nexmo';
  displayName: string;
  phoneNumber: string;
  isActive: boolean;
  isDefault: boolean;
  vapiPhoneNumberId?: string;
  lastTestedAt?: string;
  testStatus?: 'success' | 'failed' | 'pending';
  testMessage?: string;
  createdAt: string;
}

interface ProviderFormData {
  providerName: 'twilio' | 'plivo' | 'nexmo';
  displayName: string;
  phoneNumber: string;
  credentials: {
    accountSid?: string;
    authToken?: string;
    authId?: string;
    apiKey?: string;
    apiSecret?: string;
  };
  isDefault: boolean;
}

export default function SettingsPage() {
  const [providers, setProviders] = useState<PhoneProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProvider, setEditingProvider] = useState<PhoneProvider | null>(null);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [showPhoneRequestForm, setShowPhoneRequestForm] = useState(false);
  const [phoneRequestData, setPhoneRequestData] = useState({
    region: '',
    description: ''
  });
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [formData, setFormData] = useState<ProviderFormData>({
    providerName: 'twilio',
    displayName: '',
    phoneNumber: '',
    credentials: {},
    isDefault: false
  });

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/phone-providers');
      if (!response.ok) throw new Error('Failed to fetch providers');
      
      const data = await response.json();
      setProviders(data.providers || []);
    } catch (error) {
      console.error('Error fetching providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingProvider 
        ? `/api/phone-providers/${editingProvider.id}`
        : '/api/phone-providers';
      
      const method = editingProvider ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error || 'Failed to save provider');
      }

      const result = await response.json();
      
      // Show success message with phone number status
      if (result.vapiPhoneNumberId) {
        toast.success('Provider Created Successfully', {
          description: `Phone number configured: ${result.vapiPhoneNumberId}`
        });
      } else if (result.vapiError) {
        toast.warning('Provider Created with Warning', {
          description: `Phone number setup failed: ${result.vapiError}. You can retry using the "Setup Phone #" button.`
        });
      } else {
        toast.success('Provider Updated Successfully');
      }

      // Reset form and refresh list
      setFormData({
        providerName: 'twilio',
        displayName: '',
        phoneNumber: '',
        credentials: {},
        isDefault: false
      });
      setShowAddForm(false);
      setEditingProvider(null);
      fetchProviders();

    } catch (error) {
      console.error('Error saving provider:', error);
      toast.error('Failed to Save Provider', {
        description: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    }
  };

  const handleEdit = async (provider: PhoneProvider) => {
    try {
      // Fetch full provider details including credentials
      const response = await fetch(`/api/phone-providers/${provider.id}`);
      if (!response.ok) throw new Error('Failed to fetch provider details');
      
      const data = await response.json();
      const fullProvider = data.provider;
      
      setFormData({
        providerName: fullProvider.providerName,
        displayName: fullProvider.displayName,
        phoneNumber: fullProvider.phoneNumber,
        credentials: fullProvider.credentials || {},
        isDefault: fullProvider.isDefault
      });
      setEditingProvider(provider);
      setShowAddForm(true);
    } catch (error) {
      console.error('Error loading provider for edit:', error);
      toast.error('Failed to Load Provider', {
        description: 'Unable to fetch provider details for editing'
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this phone provider?')) return;
    
    try {
      const response = await fetch(`/api/phone-providers/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error || 'Failed to delete provider');
      }

      fetchProviders();
    } catch (error) {
      console.error('Error deleting provider:', error);
      toast.error('Failed to Delete Provider', {
        description: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    }
  };

  const handleTest = async (id: string) => {
    setTestingProvider(id);
    
    try {
      const response = await fetch(`/api/phone-providers/${id}/test`, {
        method: 'POST',
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Test Successful', {
          description: result.message
        });
      } else {
        toast.error('Test Failed', {
          description: result.message
        });
      }

      // Refresh providers to get updated test status
      fetchProviders();
    } catch (error) {
      console.error('Error testing provider:', error);
      toast.error('Test Failed', {
        description: 'Failed to test provider connection'
      });
    } finally {
      setTestingProvider(null);
    }
  };

  const handleCreateVapiNumber = async (id: string) => {
    if (!confirm('This will configure a new phone number using your provider credentials. Continue?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/phone-providers/${id}/create-vapi-number`, {
        method: 'POST',
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Phone Number Configured Successfully', {
          description: `ID: ${result.vapiPhoneNumberId}`
        });
        fetchProviders(); // Refresh to show updated info
      } else {
        toast.error('Failed to Configure Phone Number', {
          description: result.details || result.error
        });
      }
    } catch (error) {
      console.error('Error configuring phone number:', error);
      toast.error('Failed to Configure Phone Number', {
        description: 'An unknown error occurred'
      });
    }
  };

  const handlePhoneNumberRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingRequest(true);
    
    try {
      const response = await fetch('/api/phone-number-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(phoneRequestData),
      });

      let result;
      try {
        const text = await response.text();
        result = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        toast.error('Failed to Submit Request', {
          description: 'Server returned invalid response'
        });
        return;
      }

      if (response.ok && result.success) {
        toast.success('Phone Number Request Submitted', {
          description: `Ticket ID: ${result.ticketId || result.ticket?.ticketId || 'N/A'}. We'll get back to you soon!`
        });
        setShowPhoneRequestForm(false);
        setPhoneRequestData({ region: '', description: '' });
      } else {
        toast.error('Failed to Submit Request', {
          description: result.error || result.details || `Server error: ${response.status}`
        });
      }
    } catch (error) {
      console.error('Error submitting phone number request:', error);
      toast.error('Failed to Submit Request', {
        description: 'An unknown error occurred'
      });
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const renderCredentialFields = () => {
    switch (formData.providerName) {
      case 'twilio':
        return (
          <>
            <div className="">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account SID
              </label>
              <input
                type="text"
                value={formData.credentials.accountSid || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  credentials: { ...formData.credentials, accountSid: e.target.value }
                })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-600" autoComplete="off"
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Auth Token
              </label>
              <input
                type="text"
                value={formData.credentials.authToken || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  credentials: { ...formData.credentials, authToken: e.target.value }
                })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-600" autoComplete="off"
                placeholder="Your Twilio Auth Token"
                required
              />
            </div>
          </>
        );
      case 'plivo':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Auth ID
              </label>
              <input
                type="text"
                value={formData.credentials.authId || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  credentials: { ...formData.credentials, authId: e.target.value }
                })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-600" autoComplete="off"
                placeholder="Your Plivo Auth ID"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Auth Token
              </label>
              <input
                type="text"
                value={formData.credentials.authToken || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  credentials: { ...formData.credentials, authToken: e.target.value }
                })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-600" autoComplete="off"
                placeholder="Your Plivo Auth Token"
                required
              />
            </div>
          </>
        );
      case 'nexmo':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Key
              </label>
              <input
                type="text"
                value={formData.credentials.apiKey || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  credentials: { ...formData.credentials, apiKey: e.target.value }
                })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-600" autoComplete="off"
                placeholder="Your Nexmo API Key"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Secret
              </label>
              <input
                type="text"
                value={formData.credentials.apiSecret || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  credentials: { ...formData.credentials, apiSecret: e.target.value }
                })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-600" autoComplete="off"
                placeholder="Your Nexmo API Secret"
                required
              />
            </div>
          </>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading settings...</div>
      </div>
    );
  }

  return (
    <PaymentGateWrapper>
      <div className="min-h-screen bg-gray-50">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your phone number providers and call settings</p>
        </div>

        {/* Phone Providers Section */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Phone Number Providers</h2>
                <p className="text-gray-600 mt-1">Configure your phone number providers for making calls</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPhoneRequestForm(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  Request a New Phone Number
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(true);
                    setEditingProvider(null);
                    setFormData({
                      providerName: 'twilio',
                      displayName: '',
                      phoneNumber: '',
                      credentials: {},
                      isDefault: providers.length === 0
                    });
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Add Provider
                </button>
              </div>
            </div>
          </div>

          {/* Provider List */}
          <div className="p-6">
            {providers.length === 0 ? (
              <div className="space-y-6">
                {/* Default Provider Notice */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-blue-900 mb-1">
                        Default Phone Provider Available
                      </h3>
                      <p className="text-blue-700 text-sm">
                        You can make calls to <strong>US phone numbers (+1)</strong> using our default provider without setting up your own provider. 
                        For international calls, you'll need to add your own phone provider below.
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                          US Numbers Only (+1)
                        </span>
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                          No Setup Required
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center py-4">
                  <div className="text-gray-400 text-lg mb-2">📞</div>
                  <p className="text-gray-500">No custom phone providers configured</p>
                  <p className="text-gray-400 text-sm">Add a provider for international calls or custom phone numbers</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Default Provider Notice for users with providers */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-gray-700 text-sm">
                      <strong>Note:</strong> US phone numbers (+1) can also use our default provider if your custom providers are unavailable.
                    </p>
                  </div>
                </div>
                
                {providers.map((provider) => (
                  <div key={provider.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-gray-900">{provider.displayName}</h3>
                          {provider.isDefault && (
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                              Default
                            </span>
                          )}
                          {!provider.isActive && (
                            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm">
                          {provider.providerName.charAt(0).toUpperCase() + provider.providerName.slice(1)} • {provider.phoneNumber}
                        </p>
                        
                        {/* Phone Status */}
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`w-2 h-2 rounded-full ${
                            provider.vapiPhoneNumberId ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                          <span className="text-xs text-gray-500">
                            Status: {provider.vapiPhoneNumberId 
                              ? `Connected (${provider.vapiPhoneNumberId.slice(-8)})` 
                              : 'Not configured'}
                          </span>
                        </div>

                        {provider.lastTestedAt && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`w-2 h-2 rounded-full ${
                              provider.testStatus === 'success' ? 'bg-green-500' :
                              provider.testStatus === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                            }`} />
                            <span className="text-xs text-gray-500">
                              Last tested: {new Date(provider.lastTestedAt).toLocaleString()}
                              {provider.testMessage && ` - ${provider.testMessage}`}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleTest(provider.id)}
                          disabled={testingProvider === provider.id}
                          className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {testingProvider === provider.id ? 'Testing...' : 'Test'}
                        </button>
                        <button
                          onClick={() => handleEdit(provider)}
                          className="bg-gray-600 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-gray-700 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(provider.id)}
                          className="bg-red-600 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-red-700 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add/Edit Provider Form */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingProvider ? 'Edit Provider' : 'Add Phone Provider'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingProvider(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Provider
                    </label>
                    <select
                      value={formData.providerName}
                      onChange={(e) => setFormData({
                        ...formData,
                        providerName: e.target.value as 'twilio' | 'plivo' | 'nexmo',
                        credentials: {} // Reset credentials when changing provider
                      })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-600" autoComplete="off"
                      disabled={!!editingProvider} // Don't allow changing provider when editing
                    >
                      <option value="twilio">Twilio</option>
                      <option value="plivo">Plivo</option>
                      <option value="nexmo">Nexmo/Vonage</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-600" autoComplete="off"
                      placeholder="My Twilio Account"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-600" autoComplete="off"
                      placeholder="+1234567890"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Phone number in E.164 format (e.g., +1234567890). This number will be automatically configured using your provider credentials.
                    </p>
                  </div>

                  {renderCredentialFields()}

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isDefault"
                      checked={formData.isDefault}
                      onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-700">
                      Set as default provider
                    </label>
                  </div>

                  {/* Phone Integration Section */}
                  {editingProvider && (
                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Phone Integration</h4>
                      {editingProvider.vapiPhoneNumberId ? (
                        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          <span className="text-sm text-green-700">
                            Phone number configured (ID: {editingProvider.vapiPhoneNumberId.slice(-8)})
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
                            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                            <span className="text-sm text-yellow-700">
                              Phone number not configured
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCreateVapiNumber(editingProvider.id)}
                            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
                          >
                            Configure Phone Number
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      {editingProvider ? 'Update Provider' : 'Add Provider'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setEditingProvider(null);
                      }}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Phone Number Request Form */}
        {showPhoneRequestForm && (
          <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Request a New Phone Number
                  </h3>
                  <button
                    onClick={() => {
                      setShowPhoneRequestForm(false);
                      setPhoneRequestData({ region: '', description: '' });
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <p className="text-gray-600 text-sm mb-6">
                  Submit a request for a new phone number. Our team will review your request and get back to you soon.
                </p>

                <form onSubmit={handlePhoneNumberRequest} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preferred Region (Optional)
                    </label>
                    <input
                      type="text"
                      value={phoneRequestData.region}
                      onChange={(e) => setPhoneRequestData({ 
                        ...phoneRequestData, 
                        region: e.target.value 
                      })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-600"
                      placeholder="e.g., United States, California, Area Code 415"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Specify your preferred region, country, or area code
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Additional Details (Optional)
                    </label>
                    <textarea
                      value={phoneRequestData.description}
                      onChange={(e) => setPhoneRequestData({ 
                        ...phoneRequestData, 
                        description: e.target.value 
                      })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-600"
                      placeholder="Any specific requirements or preferences..."
                      rows={3}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Let us know if you have any specific requirements
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={isSubmittingRequest}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmittingRequest ? 'Submitting...' : 'Submit Request'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPhoneRequestForm(false);
                        setPhoneRequestData({ region: '', description: '' });
                      }}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

      </div>
      </div>
    </PaymentGateWrapper>
  );
}