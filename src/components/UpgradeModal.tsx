'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Check, Clock, Bot, TrendingUp } from 'lucide-react';

interface UpgradeOption {
  planType: string;
  planName: string;
  monthlyPrice: number;
  minuteLimit: number;
  assistantLimit: number;
  savings?: number;
}

interface PricingData {
  assistant_base_cost: number;
  cost_per_minute_payg: number;
  cost_per_minute_overage: number;
  minimum_topup_amount: number;
  initial_payg_charge: number;
  payg_initial_credits: number;
}

interface UpgradeModalProps {
  onClose: () => void;
}

export function UpgradeModal({ onClose }: UpgradeModalProps) {
  const [upgradeOptions, setUpgradeOptions] = useState<UpgradeOption[]>([]);
  const [currentUsage, setCurrentUsage] = useState<any>(null);
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => {
    fetchUpgradeOptions();
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    try {
      const response = await fetch('/api/pricing');
      if (response.ok) {
        const data = await response.json();
        setPricing(data);
      }
    } catch (error) {
      console.error('Failed to fetch pricing:', error);
    }
  };

  const fetchUpgradeOptions = async () => {
    try {
      const response = await fetch('/api/subscription');
      
      if (!response.ok) {
        throw new Error('Failed to fetch upgrade options');
      }
      
      const data = await response.json();
      setUpgradeOptions(data.upgradeOptions || []);
      setCurrentUsage(data.subscription);
    } catch (error) {
      console.error('Error fetching upgrade options:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planType: string) => {
    setUpgrading(planType);
    
    // In a real implementation, this would redirect to PayPal
    // For now, just show a message
    alert(`Redirecting to PayPal to upgrade to ${planType} plan...`);
    
    setUpgrading(null);
  };

  const formatLimit = (limit: number) => {
    return limit === -1 ? 'Unlimited' : limit.toLocaleString();
  };

  const getPlanColor = (planType: string) => {
    const colors = {
      starter: 'border-gray-200',
      growth: 'border-blue-200 bg-blue-50',
      pro: 'border-purple-200 bg-purple-50',
      enterprise: 'border-yellow-200 bg-yellow-50',
      payg: 'border-green-200 bg-green-50'
    };
    return colors[planType as keyof typeof colors] || 'border-gray-200';
  };

  const isRecommended = (planType: string) => {
    if (!currentUsage) return false;
    
    // Recommend Growth if user is hitting assistant limits
    if (currentUsage.assistantsRemaining <= 0 && planType === 'growth') return true;
    
    // Recommend Pro if user needs more minutes
    if (currentUsage.minutesRemaining < 500 && planType === 'pro') return true;
    
    return false;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading upgrade options...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">Upgrade Your Plan</CardTitle>
              <p className="text-gray-600 mt-2">Choose a plan that fits your calling needs</p>
            </div>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Current Usage Summary */}
          {currentUsage && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Current Usage</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Plan:</span>
                  <div className="font-medium">{currentUsage.planName}</div>
                </div>
                <div>
                  <span className="text-gray-600">Minutes Used:</span>
                  <div className="font-medium">{currentUsage.minutesUsed} / {formatLimit(currentUsage.minuteLimit)}</div>
                </div>
                <div>
                  <span className="text-gray-600">Assistants:</span>
                  <div className="font-medium">{currentUsage.assistantsCreated} / {formatLimit(currentUsage.assistantLimit)}</div>
                </div>
                <div>
                  <span className="text-gray-600">This Month:</span>
                  <div className="font-medium">${currentUsage.currentPeriodCost.toFixed(2)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Upgrade Options */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upgradeOptions.map((option) => (
              <div
                key={option.planType}
                className={`relative border-2 rounded-lg p-6 ${getPlanColor(option.planType)}`}
              >
                {isRecommended(option.planType) && (
                  <Badge className="absolute -top-2 left-4 bg-blue-600 text-white">
                    Recommended
                  </Badge>
                )}

                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold">{option.planName}</h3>
                  <div className="text-3xl font-bold text-blue-600 mt-2">
                    ${option.monthlyPrice}
                    <span className="text-sm text-gray-600 font-normal">
                      {option.planType === 'payg' ? '/month + usage' : '/month'}
                    </span>
                  </div>
                  {option.savings && option.savings > 0 && (
                    <div className="text-sm text-green-600 font-medium">
                      Save ${option.savings}/month
                    </div>
                  )}
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">
                      {option.planType === 'payg' 
                        ? `Pay per minute ($${pricing?.cost_per_minute_payg || 0.07}/min)` 
                        : `${formatLimit(option.minuteLimit)} minutes/month`
                      }
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Bot className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">
                      {formatLimit(option.assistantLimit)} AI assistants
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm">All voice providers included</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Calendar integration</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Call analytics & transcripts</span>
                  </div>
                  {(option.planType === 'pro' || option.planType === 'enterprise') && (
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Priority support</span>
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => handleUpgrade(option.planType)}
                  disabled={upgrading === option.planType}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {upgrading === option.planType ? 'Processing...' : 'Upgrade Now'}
                </Button>
              </div>
            ))}
          </div>

          {/* Add-ons Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Need More? Add Individual Items</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Extra Minutes</h4>
                <p className="text-sm text-gray-600 mb-3">Add calling minutes to your current plan</p>
                <div className="text-lg font-semibold mb-2">$0.05 per minute</div>
                <Button variant="outline" className="w-full">
                  Buy Minutes
                </Button>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Extra Assistants</h4>
                <p className="text-sm text-gray-600 mb-3">Create more AI assistants</p>
                <div className="text-lg font-semibold mb-2">${pricing?.assistant_base_cost || 20} per assistant/month</div>
                <Button variant="outline" className="w-full">
                  Add Assistants
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}