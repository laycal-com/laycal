'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { GoogleFormIntegration } from '@/components/GoogleFormIntegration';
import CalendarSettings from '@/components/CalendarSettings';
import { useRouter } from 'next/navigation';

interface Assistant {
  _id: string;
  name: string;
  vapiAssistantId: string;
}

type TabType = 'google-forms' | 'google-calendar';

export default function IntegrationsPage() {
  const { userId, isLoaded } = useAuth();
  const router = useRouter();
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [selectedAssistantId, setSelectedAssistantId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('google-forms');

  useEffect(() => {
    if (isLoaded && !userId) {
      router.push('/sign-in');
    }
  }, [isLoaded, userId, router]);

  useEffect(() => {
    if (!userId) return;

    const fetchAssistants = async () => {
      try {
        const response = await fetch('/api/assistants');
        if (response.ok) {
          const data = await response.json();
          setAssistants(data.assistants || []);
          if (data.assistants && data.assistants.length > 0) {
            setSelectedAssistantId(data.assistants[0]._id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch assistants:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssistants();
  }, [userId]);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  const selectedAssistant = assistants.find(a => a._id === selectedAssistantId);

  const tabs = [
    { id: 'google-forms', label: 'Google Forms', icon: '📝' },
    { id: 'google-calendar', label: 'Google Calendar', icon: '📅' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
          <p className="mt-2 text-gray-600">
            Connect external platforms to automatically call your leads and manage appointments
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'google-forms' && (
              <>
                {assistants.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="max-w-md mx-auto">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Assistants Found</h3>
                      <p className="text-gray-600 mb-6">
                        You need to create an assistant first before setting up integrations.
                      </p>
                      <a
                        href="/dashboard"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Create Assistant
                      </a>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-6">
                      <label htmlFor="assistant-select" className="block text-sm font-medium text-gray-700 mb-2">
                        Select Assistant
                      </label>
                      <select
                        id="assistant-select"
                        value={selectedAssistantId}
                        onChange={(e) => setSelectedAssistantId(e.target.value)}
                        className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {assistants.map((assistant) => (
                          <option key={assistant._id} value={assistant._id}>
                            {assistant.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedAssistant && userId && (
                      <GoogleFormIntegration
                        userId={userId}
                        assistantId={selectedAssistant._id}
                        assistantName={selectedAssistant.name}
                      />
                    )}
                  </>
                )}
              </>
            )}

            {activeTab === 'google-calendar' && (
              <CalendarSettings />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
