'use client';

import { useState, useEffect } from 'react';
import { CalendarDays, Zap } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { SpeedToLeadIntegration } from '@/components/SpeedToLeadIntegration';
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
      <div className="py-6 px-4 md:px-8 md:py-8">
        <div className="mx-auto w-full max-w-[1440px]">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  const selectedAssistant = assistants.find(a => a._id === selectedAssistantId);

  const tabs = [
    { id: 'google-forms', label: 'Lead Intake', icon: <Zap className="size-4" /> },
    { id: 'google-calendar', label: 'Google Calendar', icon: <CalendarDays className="size-4" /> },
  ];

  return (
    <div className="py-6 px-4 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-[1440px]">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-foreground">Integrations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect external platforms to automatically call your leads and manage appointments
          </p>
        </div>

        <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
          <div className="border-b border-border">
            <nav className="flex -mb-px">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  data-tour={`tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary text-brand-soft'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50'
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
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">No Assistants Found</h3>
                      <p className="text-muted-foreground mb-6">
                        You need to create an assistant first before setting up integrations.
                      </p>
                      <a
                        href="/dashboard"
                        className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        Create Assistant
                      </a>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-6">
                      <label htmlFor="assistant-select" className="block text-sm font-medium text-muted-foreground mb-2">
                        Select Assistant
                      </label>
                      <select
                        id="assistant-select"
                        value={selectedAssistantId}
                        onChange={(e) => setSelectedAssistantId(e.target.value)}
                        className="w-full max-w-md px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
                      >
                        {assistants.map((assistant) => (
                          <option key={assistant._id} value={assistant._id}>
                            {assistant.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedAssistant && userId && (
                      <SpeedToLeadIntegration
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
