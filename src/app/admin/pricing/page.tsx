"use client";

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface PricingSettings {
  assistant_base_cost: number;
  cost_per_minute_payg: number;
  cost_per_minute_overage: number;
  minimum_topup_amount: number;
  initial_payg_charge: number;
  payg_initial_credits: number;
}

export default function AdminPricing() {
  const [settings, setSettings] = useState<PricingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedSettings, setEditedSettings] = useState<PricingSettings | null>(null);

  useEffect(() => {
    loadPricingSettings();
  }, []);

  const loadPricingSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings/pricing');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        setEditedSettings(data);
      } else {
        toast.error('Failed to load pricing settings');
      }
    } catch (error) {
      toast.error('Failed to load pricing settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editedSettings) return;

    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings/pricing', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedSettings),
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
        toast.success('Pricing settings updated successfully');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to update pricing settings');
      }
    } catch (error) {
      toast.error('Failed to update pricing settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setEditedSettings(settings);
  };

  const handleChange = (key: keyof PricingSettings, value: number) => {
    if (!editedSettings) return;
    
    setEditedSettings({
      ...editedSettings,
      [key]: value
    });
  };

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(editedSettings);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!settings || !editedSettings) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Failed to load pricing settings</p>
        <button
          onClick={loadPricingSettings}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const PricingInput = ({ 
    label, 
    value, 
    onChange, 
    description, 
    prefix = '$',
    step = 0.01,
    min = 0 
  }: {
    label: string;
    value: number;
    onChange: (value: number) => void;
    description?: string;
    prefix?: string;
    step?: number;
    min?: number;
  }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">{prefix}</span>
          </div>
        )}
        <input
          type="number"
          step={step}
          min={min}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className={`block w-full ${prefix ? 'pl-7' : 'pl-3'} pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
        />
      </div>
      {description && (
        <p className="text-sm text-gray-500">{description}</p>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pricing Settings</h1>
        <p className="text-gray-600">
          Control the pricing structure for your platform. Changes will take effect immediately for new transactions.
        </p>
      </div>

      {/* Settings Form */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="space-y-8">
          {/* Assistant Pricing */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Assistant Pricing</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PricingInput
                label="Base Assistant Cost"
                value={editedSettings.assistant_base_cost}
                onChange={(value) => handleChange('assistant_base_cost', value)}
                description="Cost charged when users create a new assistant"
                step={1}
              />
            </div>
          </div>

          {/* Call Pricing */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Call Pricing</h2>
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
              <PricingInput
                label="Pay-as-you-go Rate"
                value={editedSettings.cost_per_minute_payg}
                onChange={(value) => handleChange('cost_per_minute_payg', value)}
                description="Cost per minute for PAYG users"
              />
            </div>
          </div>

          {/* Payment Settings */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PricingInput
                label="Initial PAYG Charge"
                value={editedSettings.initial_payg_charge}
                onChange={(value) => handleChange('initial_payg_charge', value)}
                description="One-time charge to activate pay-as-you-go"
                step={1}
              />
              <PricingInput
                label="Minimum Top-up Amount"
                value={editedSettings.minimum_topup_amount}
                onChange={(value) => handleChange('minimum_topup_amount', value)}
                description="Minimum amount for credit top-ups - users can add credits in multiples of this amount"
                step={1}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {hasChanges && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-yellow-600">
                ⚠️ You have unsaved changes
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Reset
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preview Impact */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing Preview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Pay-as-you-go Example</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Initial activation:</span>
                <span className="font-medium">${editedSettings.initial_payg_charge}</span>
              </div>
              <div className="flex justify-between">
                <span>• First assistant:</span>
                <span>${editedSettings.assistant_base_cost}</span>
              </div>
              <div className="flex justify-between">
                <span>• Initial credits:</span>
                <span>${editedSettings.payg_initial_credits}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span>10-minute call cost:</span>
                <span className="font-medium">${(editedSettings.cost_per_minute_payg * 10).toFixed(2)}</span>
              </div>
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Additional Costs</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Extra assistant:</span>
                <span className="font-medium">${editedSettings.assistant_base_cost}</span>
              </div>
              <div className="flex justify-between">
                <span>Minimum top-up:</span>
                <span className="font-medium">${editedSettings.minimum_topup_amount}</span>
              </div>
              <div className="flex justify-between">
                <span>Overage rate:</span>
                <span className="font-medium">${editedSettings.cost_per_minute_overage}/min</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}