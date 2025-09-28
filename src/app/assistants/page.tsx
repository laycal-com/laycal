'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Bot, Phone, Edit, Trash2, TestTube, Languages, Mic } from 'lucide-react';
import { AssistantForm } from '@/components/AssistantForm';
import { PaymentGateWrapper } from '@/components/PaymentGateWrapper';
import { toast } from 'sonner';

interface Assistant {
  _id: string;
  name: string;
  vapiAssistantId: string;
  voice: {
    gender: 'male' | 'female';
    provider: string;
    voiceId: string;
  };
  mainPrompt: string;
  language: string;
  phoneNumbers: Array<{
    phoneNumber: string;
    phoneProviderId: {
      _id: string;
      displayName: string;
      phoneNumber: string;
    };
    isPrimary: boolean;
  }>;
  isActive: boolean;
  lastUsed?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AssistantsPage() {
  const { user, isLoaded } = useUser();
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAssistant, setEditingAssistant] = useState<Assistant | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [showTestModal, setShowTestModal] = useState(false);
  const [selectedAssistantForTest, setSelectedAssistantForTest] = useState<Assistant | null>(null);
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    if (isLoaded && user) {
      fetchAssistants();
      fetchSubscription();
    }
  }, [isLoaded, user]);

  const fetchAssistants = async () => {
    try {
      const response = await fetch('/api/assistants');
      if (!response.ok) throw new Error('Failed to fetch assistants');
      
      const data = await response.json();
      setAssistants(data.assistants);
    } catch (error) {
      console.error('Error fetching assistants:', error);
      toast.error('Failed to load assistants');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/subscription');
      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const handleDelete = async (assistant: Assistant) => {
    if (!confirm(`Are you sure you want to delete "${assistant.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/assistants/${assistant._id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to delete assistant');
      }

      toast.success('Assistant deleted successfully');
      fetchAssistants();
    } catch (error) {
      console.error('Error deleting assistant:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete assistant');
    }
  };

  const handleTest = (assistant: Assistant) => {
    setSelectedAssistantForTest(assistant);
    setTestPhoneNumber('');
    setShowTestModal(true);
  };

  const handleTestSubmit = async () => {
    if (!selectedAssistantForTest || !testPhoneNumber.trim()) {
      toast.error('Please enter a phone number');
      return;
    }

    const phoneNumber = testPhoneNumber.trim();
    setTestingId(selectedAssistantForTest._id);
    
    try {
      const response = await fetch(`/api/assistants/${selectedAssistantForTest._id}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber })
      });

      if (!response.ok) {
        const error = await response.json();
        
        // Handle the case where Vapi assistant doesn't exist
        if (error.needsRecreation) {
          const recreateConfirm = confirm(
            `${error.details}\n\nWould you like to recreate this assistant in Vapi now? This will create a new assistant with the same settings.`
          );
          
          if (recreateConfirm) {
            await handleRecreateVapiAssistant(selectedAssistantForTest._id);
            return;
          }
        }
        
        throw new Error(error.details || error.error || 'Failed to test assistant');
      }

      const data = await response.json();
      toast.success(`Test call initiated! Call ID: ${data.call.id}`);
      setShowTestModal(false);
      setTestPhoneNumber('');
      setSelectedAssistantForTest(null);
    } catch (error) {
      console.error('Error testing assistant:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to test assistant');
    } finally {
      setTestingId(null);
    }
  };

  const handleRecreateVapiAssistant = async (assistantId: string) => {
    try {
      toast.info('Recreating assistant in Vapi...', {
        description: 'This may take a few seconds'
      });

      const response = await fetch(`/api/assistants/${assistantId}/recreate-vapi`, {
        method: 'POST'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to recreate assistant');
      }

      const data = await response.json();
      if (data.wasExisting) {
        toast.success('Assistant reconnected!', {
          description: `Found existing assistant in Vapi and reconnected it`
        });
      } else {
        toast.success('Assistant recreated successfully!', {
          description: `New Vapi ID: ${data.newVapiAssistantId.slice(-8)}`
        });
      }

      // Refresh the assistants list to get updated info
      fetchAssistants();
      
      // Close modal and reset state
      setShowTestModal(false);
      setTestPhoneNumber('');
      setSelectedAssistantForTest(null);
    } catch (error) {
      console.error('Error recreating assistant:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to recreate assistant');
    }
  };

  const isUSPhoneNumber = (phoneNumber: string) => {
    return /^\+1\d{10}$/.test(phoneNumber);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingAssistant(null);
    fetchAssistants();
  };

  const formatLanguage = (lang: string) => {
    const languages = {
      'en-US': 'English (US)',
      'es-ES': 'Spanish (ES)',
      'fr-FR': 'French (FR)',
      'de-DE': 'German (DE)'
    };
    return languages[lang as keyof typeof languages] || lang;
  };

  if (!isLoaded) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  if (!user) {
    return <div className="flex justify-center p-8">Please sign in to manage assistants.</div>;
  }

  return (
    <PaymentGateWrapper>
      <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', color: '#000000', paddingTop: '80px' }}>
        <div className="container mx-auto py-8 px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: '#000000' }}>AI Assistants</h1>
              <p className="text-gray-600 mt-2">
                Manage your AI voice assistants for outbound calling campaigns
              </p>
            </div>
            <Button 
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Assistant
            </Button>
          </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="text-gray-500">Loading assistants...</div>
        </div>
      ) : assistants.length === 0 ? (
        <Card className="text-center p-8" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
          <CardContent className="pt-6" style={{ backgroundColor: '#ffffff', color: '#000000' }}>
            <Bot className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2" style={{ color: '#000000' }}>No Assistants Yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first AI assistant to start making outbound calls
            </p>
            <Button 
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Assistant
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assistants.map((assistant) => (
            <Card key={assistant._id} className="relative" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
              <CardHeader className="pb-3" style={{ backgroundColor: '#ffffff' }}>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg" style={{ color: '#000000' }}>{assistant.name}</CardTitle>
                  <div className="flex items-center space-x-1">
                    <Badge variant={assistant.isActive ? "default" : "secondary"}>
                      {assistant.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                <CardDescription className="flex items-center space-x-2">
                  <Bot className="w-4 h-4" />
                  <span>AI Voice Assistant</span>
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4" style={{ backgroundColor: '#ffffff', color: '#000000' }}>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <Mic className="w-4 h-4 text-gray-500" />
                    <span className="capitalize">{assistant.voice.gender}</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-500">{assistant.voice.provider}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm">
                    <Languages className="w-4 h-4 text-gray-500" />
                    <span>{formatLanguage(assistant.language)}</span>
                  </div>

                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span>US numbers: Default provider</span>
                  </div>
                  <div className="text-xs text-gray-500 pl-6">
                    International: Custom providers required
                  </div>
                </div>

                <div className="border rounded p-2">
                  <p className="text-xs text-gray-600 mb-1">Main Prompt:</p>
                  <p className="text-sm text-gray-800 line-clamp-3">
                    {assistant.mainPrompt}
                  </p>
                </div>


                {assistant.lastUsed && (
                  <p className="text-xs text-gray-500">
                    Last used: {new Date(assistant.lastUsed).toLocaleDateString()}
                  </p>
                )}

                <div className="flex space-x-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingAssistant(assistant);
                      setShowForm(true);
                    }}
                    className="flex-1 bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  
                  {/* Hide test button for trial users */}
                  {subscription?.planType !== 'trial' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTest(assistant)}
                      disabled={testingId === assistant._id || !assistant.isActive}
                      className="flex-1 bg-white border-gray-300 text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      <TestTube className="w-4 h-4 mr-1" />
                      {testingId === assistant._id ? 'Testing...' : 'Test'}
                    </Button>
                  )}
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(assistant)}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>

      {/* Assistant Form Modal */}
      {showForm && (
        <AssistantForm
          assistant={editingAssistant}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowForm(false);
            setEditingAssistant(null);
          }}
        />
      )}

      {/* Test Assistant Modal */}
      {showTestModal && selectedAssistantForTest && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Test Assistant: {selectedAssistantForTest.name}
                </h3>
                <button
                  onClick={() => {
                    setShowTestModal(false);
                    setSelectedAssistantForTest(null);
                    setTestPhoneNumber('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Phone Provider Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Phone Provider Information</h4>
                  <div className="space-y-2 text-xs text-blue-800">
                    <div className="flex items-center space-x-2">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                        US Numbers (+1)
                      </span>
                      <span>Default provider (no setup required)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">
                        International
                      </span>
                      <span>Requires custom phone provider in Settings</span>
                    </div>
                  </div>
                </div>

                {/* Phone Number Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Phone Number
                  </label>
                  <input
                    type="tel"
                    value={testPhoneNumber}
                    onChange={(e) => setTestPhoneNumber(e.target.value)}
                    placeholder="+1234567890"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter phone number in E.164 format (e.g., +1234567890)
                  </p>
                  
                  {/* Real-time validation feedback */}
                  {testPhoneNumber && (
                    <div className="mt-2">
                      {isUSPhoneNumber(testPhoneNumber) ? (
                        <div className="flex items-center space-x-2 text-green-700">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-sm">US number - will use default provider</span>
                        </div>
                      ) : testPhoneNumber.startsWith('+') ? (
                        <div className="flex items-center space-x-2 text-yellow-700">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <span className="text-sm">International number - requires custom provider</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 text-red-700">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span className="text-sm">Invalid format - must start with + and country code</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleTestSubmit}
                    disabled={!testPhoneNumber.trim() || testingId === selectedAssistantForTest._id}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {testingId === selectedAssistantForTest._id ? 'Testing...' : 'Start Test Call'}
                  </button>
                  <button
                    onClick={() => {
                      setShowTestModal(false);
                      setSelectedAssistantForTest(null);
                      setTestPhoneNumber('');
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
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