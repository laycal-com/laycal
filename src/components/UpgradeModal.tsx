'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Plus } from 'lucide-react';
import { toast } from 'sonner';

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
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toppingUp, setToppingUp] = useState(false);
  const [customAmount, setCustomAmount] = useState(25); // Default to initial PAYG amount

  useEffect(() => {
    fetchPricing();
  }, []);

  useEffect(() => {
    // Set default amount to initial PAYG charge when pricing loads
    if (pricing && customAmount === 25) {
      setCustomAmount(pricing.initial_payg_charge);
    }
  }, [pricing]);

  const fetchPricing = async () => {
    try {
      const response = await fetch('/api/pricing');
      if (response.ok) {
        const data = await response.json();
        setPricing(data);
      }
    } catch (error) {
      console.error('Failed to fetch pricing:', error);
      // Use default values if fetch fails
      setPricing({
        assistant_base_cost: 20,
        cost_per_minute_payg: 0.07,
        cost_per_minute_overage: 0.05,
        minimum_topup_amount: 5,
        initial_payg_charge: 25,
        payg_initial_credits: 5
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTopup = async (amount: number) => {
    setToppingUp(true);
    try {
      const response = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          description: `Upgrade to Pay-as-you-go: $${amount}`,
          planType: 'payg'
        })
      });

      if (response.ok) {
        const orderData = await response.json();
        if (orderData.approvalUrl) {
          window.location.href = orderData.approvalUrl;
        }
      } else {
        throw new Error('Failed to create payment order');
      }
    } catch (error) {
      toast.error('Payment failed', {
        description: 'Please try again or contact support.'
      });
    } finally {
      setToppingUp(false);
    }
  };

  const handleCustomAmountChange = (amount: number) => {
    // Use dynamic minimum amount from pricing
    const minAmount = pricing?.minimum_topup_amount || 5;
    const adjustedAmount = Math.max(minAmount, Math.round(amount / minAmount) * minAmount);
    setCustomAmount(adjustedAmount);
  };

  const incrementAmount = () => {
    const minAmount = pricing?.minimum_topup_amount || 5;
    setCustomAmount(prev => prev + minAmount);
  };

  const decrementAmount = () => {
    const minAmount = pricing?.minimum_topup_amount || 5;
    setCustomAmount(prev => Math.max(minAmount, prev - minAmount));
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl">Add Credits</CardTitle>
              <p className="text-gray-600 mt-1">Top up your account to continue making calls</p>
            </div>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Amount</span>
              <span className="text-xs text-gray-500">
                Min: ${pricing?.minimum_topup_amount || 5}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={decrementAmount}
                disabled={customAmount <= (pricing?.minimum_topup_amount || 5)}
                className="w-8 h-8 p-0"
              >
                -
              </Button>
              
              <div className="flex-1">
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(Number(e.target.value))}
                  min={pricing?.minimum_topup_amount || 5}
                  step={pricing?.minimum_topup_amount || 5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-center font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={incrementAmount}
                className="w-8 h-8 p-0"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-sm text-blue-800">
              <strong>What you'll get:</strong>
            </div>
            <div className="text-sm text-blue-700 mt-1">
              • Unlimited AI assistants
            </div>
            <div className="text-sm text-blue-700">
              • Pay-per-minute calling (${pricing?.cost_per_minute_payg || 0.07}/min)
            </div>
            <div className="text-sm text-blue-700">
              • All premium features included
            </div>
          </div>

          <Button
            onClick={() => handleTopup(customAmount)}
            disabled={toppingUp}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11"
          >
            {toppingUp ? 'Processing...' : `Add $${customAmount} Credits`}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            Secure payment processed by PayPal
          </p>
        </CardContent>
      </Card>
    </div>
  );
}