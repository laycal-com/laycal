'use client';

import { useState, useEffect } from 'react';
import { Phone, CheckCircle, AlertCircle, Settings } from 'lucide-react';
import Link from 'next/link';

interface PhoneProvider {
  id: string;
  displayName: string;
  phoneNumber: string;
  isActive: boolean;
  isDefault: boolean;
  vapiPhoneNumberId?: string;
}

export function PhoneProviderStatus() {
  const [providers, setProviders] = useState<PhoneProvider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/phone-providers');
      if (response.ok) {
        const data = await response.json();
        setProviders(data.providers || []);
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-2">
          <Phone className="w-5 h-5 text-gray-400" />
          <span className="text-gray-500">Loading phone provider status...</span>
        </div>
      </div>
    );
  }

  const activeProviders = providers.filter(p => p.isActive);
  const configuredProviders = activeProviders.filter(p => p.vapiPhoneNumberId);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Phone className="w-5 h-5 text-gray-700" />
          <h3 className="font-medium text-gray-900">Phone Provider Status</h3>
        </div>
        <Link 
          href="/settings" 
          className="text-blue-600 hover:text-blue-700 p-1 rounded-md hover:bg-blue-50 transition-colors"
          title="Manage phone providers"
        >
          <Settings className="w-4 h-4" />
        </Link>
      </div>

      <div className="space-y-3">
        {/* Default Provider Status */}
        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Default Provider</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
              US Numbers (+1)
            </span>
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
              Ready
            </span>
          </div>
        </div>

        {/* Custom Providers Status */}
        {activeProviders.length > 0 ? (
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-700 uppercase tracking-wide">
              Custom Providers
            </div>
            {activeProviders.map((provider) => (
              <div key={provider.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                <div className="flex items-center space-x-2">
                  {provider.vapiPhoneNumberId ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                  )}
                  <span className="text-sm text-gray-700">{provider.displayName}</span>
                  {provider.isDefault && (
                    <span className="bg-gray-200 text-gray-700 text-xs px-1.5 py-0.5 rounded">
                      Default
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {provider.phoneNumber}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-sm text-gray-500">No custom providers configured</p>
            <p className="text-xs text-gray-400">
              US calls will use default provider
            </p>
          </div>
        )}

        {/* Summary */}
        <div className="pt-2 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>
              Ready for calls: {configuredProviders.length + 1} provider{configuredProviders.length === 0 ? '' : 's'}
            </span>
            <span className="text-blue-600">
              US + {configuredProviders.length} custom
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}