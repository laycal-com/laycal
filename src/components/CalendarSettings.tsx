"use client";

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface CalendarProvider {
  name: string;
  connected: boolean;
  authenticated: boolean;
}

export default function CalendarSettings() {
  const [providers, setProviders] = useState<CalendarProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    fetchCalendarStatus();
  }, []);

  const fetchCalendarStatus = async () => {
    try {
      const response = await fetch('/api/calendar/status');
      if (!response.ok) throw new Error('Failed to fetch calendar status');
      
      const data = await response.json();
      setProviders(data.providers || []);
    } catch (error) {
      console.error('Error fetching calendar status:', error);
      toast.error('Failed to Load Calendar Status', {
        description: 'Unable to fetch calendar integration status'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (providerName: string) => {
    if (connecting) return;

    setConnecting(providerName);

    try {
      if (providerName === 'google') {
        // Get Google auth URL
        const response = await fetch('/api/calendar/google/auth');
        if (!response.ok) throw new Error('Failed to get Google auth URL');
        
        const data = await response.json();
        
        // Redirect to Google OAuth
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Error connecting calendar:', error);
      toast.error('Failed to Connect Calendar', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      setConnecting(null);
    }
  };

  const handleDisconnect = async (providerName: string) => {
    if (!confirm(`Are you sure you want to disconnect ${providerName} calendar?`)) {
      return;
    }

    try {
      const response = await fetch('/api/calendar/status', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider: providerName }),
      });

      if (!response.ok) throw new Error('Failed to disconnect calendar');

      toast.success('Calendar Disconnected', {
        description: `${providerName} calendar has been disconnected successfully`
      });

      await fetchCalendarStatus();
    } catch (error) {
      console.error('Error disconnecting calendar:', error);
      toast.error('Failed to Disconnect Calendar', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  };

  const getProviderDisplayName = (name: string) => {
    switch (name) {
      case 'google':
        return 'Google Calendar';
      case 'outlook':
        return 'Microsoft Outlook';
      case 'ical':
        return 'iCal';
      default:
        return name;
    }
  };

  const getProviderIcon = (name: string) => {
    switch (name) {
      case 'google':
        return '📅'; // Google Calendar icon
      case 'outlook':
        return '📧'; // Outlook icon
      case 'ical':
        return '🗓️'; // Generic calendar icon
      default:
        return '📅';
    }
  };

  const getStatusColor = (provider: CalendarProvider) => {
    if (provider.connected && provider.authenticated) {
      return 'text-green-600 bg-green-100';
    } else if (provider.connected && !provider.authenticated) {
      return 'text-yellow-600 bg-yellow-100';
    } else {
      return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (provider: CalendarProvider) => {
    if (provider.connected && provider.authenticated) {
      return 'Connected';
    } else if (provider.connected && !provider.authenticated) {
      return 'Authentication Expired';
    } else {
      return 'Not Connected';
    }
  };

  if (loading) {
    return (
      <div>
        <div className="animate-pulse">
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-gray-600">
          Connect your calendar to automatically create appointments when calls confirm bookings
        </p>
      </div>

      <div className="space-y-4">
        {providers.map((provider) => (
          <div key={provider.name} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getProviderIcon(provider.name)}</span>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {getProviderDisplayName(provider.name)}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(provider)}`}
                    >
                      {getStatusText(provider)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {!provider.connected || !provider.authenticated ? (
                  <button
                    onClick={() => handleConnect(provider.name)}
                    disabled={connecting === provider.name}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {connecting === provider.name ? 'Connecting...' : 'Connect'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleDisconnect(provider.name)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                  >
                    Disconnect
                  </button>
                )}
              </div>
            </div>

            {provider.name === 'google' && (
              <div className="mt-3 text-sm text-gray-600">
                <p>• Automatically creates calendar events for confirmed appointments</p>
                <p>• Includes customer details and call notes</p>
                <p>• Sets up email and popup reminders</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">How it works:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>1. Connect your preferred calendar provider above</li>
          <li>2. When a call successfully confirms an appointment, we'll automatically create a calendar event</li>
          <li>3. The event will include customer details, appointment time, and any notes from the call</li>
          <li>4. You'll receive email and popup reminders before the appointment</li>
        </ul>
      </div>
    </div>
  );
}