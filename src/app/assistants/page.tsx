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

  const handleTest = async (assistant: Assistant) => {
    const phoneNumber = prompt('Enter phone number to test (with country code, e.g., +1234567890):');
    if (!phoneNumber) return;

    setTestingId(assistant._id);
    try {
      const response = await fetch(`/api/assistants/${assistant._id}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to test assistant');
      }

      const data = await response.json();
      toast.success(`Test call initiated! Call ID: ${data.call.id}`);
    } catch (error) {
      console.error('Error testing assistant:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to test assistant');
    } finally {
      setTestingId(null);
    }
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
                    <span>Uses your phone providers</span>
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
      </div>
    </PaymentGateWrapper>
  );
}