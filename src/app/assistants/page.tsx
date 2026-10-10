'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Bot, Phone, Edit, Trash2, TestTube, Languages, Mic, RefreshCw } from 'lucide-react';
import { AssistantForm } from '@/components/AssistantForm';
import { AssistantWebTest } from '@/components/AssistantWebTest';
import { PaymentGateWrapper } from '@/components/PaymentGateWrapper';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useAccount } from '@/components/portal/account-context';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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
  serviceConfig?: {
    vertical?: string;
    clientCompany?: string;
  };
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
  const router = useRouter();
  const { data: accountData, refresh: refreshAccount } = useAccount();

  // The first assistant is free. Each one after it is paid from credits, so
  // without enough balance the wizard would only fail at its last step.
  const billing = accountData?.billing;
  const createBlocked = !!billing && billing.nextAssistantFee > 0 && billing.balance < billing.nextAssistantFee;
  const blockedReason = billing
    ? `Your first assistant was free. Each additional one costs $${billing.nextAssistantFee}, and your balance is $${billing.balance.toFixed(2)}. Add credits to create another.`
    : '';

  const openCreate = () => {
    if (createBlocked) {
      toast.error('Add credits to create another assistant', {
        description: blockedReason,
        action: { label: 'Add credits', onClick: () => router.push('/dashboard#credits') },
      });
      return;
    }
    setShowForm(true);
  };
  const [editingAssistant, setEditingAssistant] = useState<Assistant | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [showTestModal, setShowTestModal] = useState(false);
  const [selectedAssistantForTest, setSelectedAssistantForTest] = useState<Assistant | null>(null);
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [webTestAssistant, setWebTestAssistant] = useState<Assistant | null>(null);
  const [resyncingId, setResyncingId] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && user) {
      fetchAssistants();
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

  const handleResync = async (assistant: Assistant, baseUrl?: string) => {
    setResyncingId(assistant._id);
    try {
      const res = await fetch(`/api/assistants/${assistant._id}/resync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(baseUrl ? { baseUrl } : {}),
      });
      const data = await res.json();

      // Browsing on localhost gives no publicly reachable host to infer, so ask
      // for the tunnel URL rather than failing with advice to edit .env.
      if (!res.ok && data.needsBaseUrl) {
        const entered = window.prompt(
          'Vapi cannot reach localhost. Paste your public tunnel URL (e.g. https://abc123.ngrok-free.app):',
          ''
        );
        if (entered && entered.trim()) {
          setResyncingId(null);
          return handleResync(assistant, entered.trim().replace(/\/$/, ''));
        }
        throw new Error('A public URL is required for the calendar tools to work.');
      }

      if (!res.ok) throw new Error(data.error || 'Re-sync failed');

      toast.success('Re-synced to Vapi', {
        description: data.toolsUrl ? `Tools now point at ${data.toolsUrl}` : 'Assistant updated',
      });
      if (data.warning) toast.warning(data.warning);
    } catch (e) {
      toast.error('Re-sync failed', {
        description: e instanceof Error ? e.message : 'Unknown error',
      });
    } finally {
      setResyncingId(null);
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
    refreshAccount();
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
      <div>
        <div className="mx-auto w-full max-w-[1440px] px-4 py-6 md:px-8 md:py-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-[-0.02em] text-foreground">Assistants</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                The AI voice agents that call your leads and book visits
              </p>
            </div>
            {/* Not `disabled`: a disabled button swallows hover and click, and the
                reason it is unavailable is the whole point. */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  data-tour="new-assistant"
                  onClick={openCreate}
                  aria-disabled={createBlocked}
                  className={`bg-primary hover:bg-primary/90 text-white ${createBlocked ? 'cursor-not-allowed opacity-50 hover:bg-primary' : ''}`}
                >
              <Plus className="w-4 h-4 mr-2" />
              New assistant
            </Button>
              </TooltipTrigger>
              {createBlocked && (
                <TooltipContent side="bottom" align="end" className="max-w-xs text-left leading-5">
                  {blockedReason}
                </TooltipContent>
              )}
            </Tooltip>
          </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="text-muted-foreground">Loading assistants...</div>
        </div>
      ) : assistants.length === 0 ? (
        <Card className="text-center p-8">
          <CardContent className="pt-6">
            <Bot className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Assistants Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first AI assistant to start making outbound calls
            </p>
            <Button 
              onClick={openCreate}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Assistant
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assistants.map((assistant) => (
            <Card key={assistant._id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{assistant.name}</CardTitle>
                  <div className="flex items-center space-x-1">
                    <Badge variant="outline" className="gap-1.5 border-border font-normal text-foreground">
                      <span className={`size-1.5 rounded-full ${assistant.isActive ? 'bg-green-500' : 'bg-muted-foreground/50'}`} />
                      {assistant.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                <CardDescription className="flex items-center space-x-2">
                  <Bot className="w-4 h-4" />
                  <span>AI Voice Assistant</span>
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <Mic className="w-4 h-4 text-muted-foreground" />
                    <span className="capitalize">{assistant.voice.gender}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">{assistant.voice.provider}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm">
                    <Languages className="w-4 h-4 text-muted-foreground" />
                    <span>{formatLanguage(assistant.language)}</span>
                  </div>

                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>US numbers: Default provider</span>
                  </div>
                  <div className="text-xs text-muted-foreground pl-6">
                    International: Custom providers required
                  </div>
                </div>

                <div className="border rounded p-2">
                  <p className="text-xs text-muted-foreground mb-1">Main Prompt:</p>
                  <p className="text-sm text-foreground line-clamp-3">
                    {assistant.mainPrompt}
                  </p>
                </div>


                {assistant.lastUsed && (
                  <p className="text-xs text-muted-foreground">
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
                    className="flex-1 bg-card border-input text-muted-foreground hover:bg-accent border border-border"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  
                  {(
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTest(assistant)}
                      disabled={testingId === assistant._id || !assistant.isActive}
                      className="flex-1 bg-card border-input text-muted-foreground hover:bg-accent disabled:bg-muted disabled:text-muted-foreground border border-border"
                    >
                      <TestTube className="w-4 h-4 mr-1" />
                      {testingId === assistant._id ? 'Testing...' : 'Test'}
                    </Button>
                  )}
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(assistant)}
                    className="border border-input bg-transparent text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Browser call — exercises prompt, calendar tools and the
                    end-of-call webhook without any telephony provider. */}
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setWebTestAssistant(assistant)}
                    disabled={!assistant.isActive}
                    className="flex-1 bg-card border-input text-muted-foreground hover:bg-accent border border-border"
                  >
                    <Mic className="w-4 h-4 mr-1" />
                    Talk in browser
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResync(assistant)}
                    disabled={resyncingId === assistant._id}
                    title="Re-push tool and webhook URLs to Vapi (needed after an ngrok restart)"
                    className="bg-card border-input text-muted-foreground hover:bg-accent border border-border"
                  >
                    <RefreshCw className={`w-4 h-4 ${resyncingId === assistant._id ? 'animate-spin' : ''}`} />
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

      {webTestAssistant && (
        <AssistantWebTest
          assistantId={webTestAssistant._id}
          vapiAssistantId={webTestAssistant.vapiAssistantId}
          assistantName={webTestAssistant.name}
          vertical={webTestAssistant.serviceConfig?.vertical}
          onClose={() => setWebTestAssistant(null)}
        />
      )}

      {/* Test Assistant Modal */}
      {showTestModal && selectedAssistantForTest && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-lg shadow-xl max-w-md w-full border border-border">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Test Assistant: {selectedAssistantForTest.name}
                </h3>
                <button
                  onClick={() => {
                    setShowTestModal(false);
                    setSelectedAssistantForTest(null);
                    setTestPhoneNumber('');
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Phone Provider Info */}
                <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-brand-soft mb-2">Phone Provider Information</h4>
                  <div className="space-y-2 text-xs text-brand-soft">
                    <div className="flex items-center space-x-2">
                      <span className="bg-green-500/10 text-green-500 px-2 py-1 rounded-full font-medium">
                        US Numbers (+1)
                      </span>
                      <span>Default provider (no setup required)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="bg-amber-500/10 text-amber-500 px-2 py-1 rounded-full font-medium">
                        International
                      </span>
                      <span>Requires custom phone provider in Settings</span>
                    </div>
                  </div>
                </div>

                {/* Phone Number Input */}
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Test Phone Number
                  </label>
                  <input
                    type="tel"
                    value={testPhoneNumber}
                    onChange={(e) => setTestPhoneNumber(e.target.value)}
                    placeholder="+1234567890"
                    className="w-full p-3 border border-input rounded-lg focus:ring-ring focus:border-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter phone number in E.164 format (e.g., +1234567890)
                  </p>
                  
                  {/* Real-time validation feedback */}
                  {testPhoneNumber && (
                    <div className="mt-2">
                      {isUSPhoneNumber(testPhoneNumber) ? (
                        <div className="flex items-center space-x-2 text-green-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-sm">US number - will use default provider</span>
                        </div>
                      ) : testPhoneNumber.startsWith('+') ? (
                        <div className="flex items-center space-x-2 text-amber-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <span className="text-sm">International number - requires custom provider</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 text-red-500">
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
                    className="flex-1 bg-primary text-white py-2 px-4 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {testingId === selectedAssistantForTest._id ? 'Testing...' : 'Start Test Call'}
                  </button>
                  <button
                    onClick={() => {
                      setShowTestModal(false);
                      setSelectedAssistantForTest(null);
                      setTestPhoneNumber('');
                    }}
                    className="flex-1 bg-muted text-muted-foreground py-2 px-4 rounded-lg font-medium hover:bg-muted transition-colors"
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