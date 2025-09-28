'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Wallet, Plus, AlertTriangle, TrendingUp } from 'lucide-react';

interface CreditData {
  balance: number;
  planType: string;
  needsTopup: boolean;
  minimumBalance: number;
  recentTransactions: Array<{
    type: string;
    amount: number;
    description: string;
    date: string;
  }>;
}

interface PricingData {
  assistant_base_cost: number;
  cost_per_minute_payg: number;
  cost_per_minute_overage: number;
  minimum_topup_amount: number;
  initial_payg_charge: number;
  payg_initial_credits: number;
}

interface CreditWidgetProps {
  onTopup?: () => void;
}

export function CreditWidget({ onTopup }: CreditWidgetProps) {
  const [creditData, setCreditData] = useState<CreditData | null>(null);
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toppingUp, setToppingUp] = useState(false);
  const [customAmount, setCustomAmount] = useState(5);

  useEffect(() => {
    fetchCreditData();
    fetchPricing();
    
    // Refresh data every 10 seconds to catch updates
    const interval = setInterval(fetchCreditData, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Update custom amount when pricing loads
    if (pricing && customAmount === 5) {
      setCustomAmount(pricing.minimum_topup_amount);
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
    }
  };

  const fetchCreditData = async () => {
    try {
      const response = await fetch('/api/credits?t=' + Date.now(), {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCreditData(data);
      }
    } catch (error) {
      console.error('Failed to fetch credit data:', error);
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
          description: `Credit top-up: $${amount}`,
          planType: 'credit-topup'
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
      toast.error('Top-up failed', {
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
      <Card className="bg-white shadow-lg border border-[#e2e8f0]">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-[#e2e8f0] rounded w-1/4 mb-2"></div>
            <div className="h-8 bg-[#e2e8f0] rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!creditData) {
    return null;
  }

  const { balance, planType, needsTopup, minimumBalance, recentTransactions } = creditData;
  
  return (
    <Card className={`bg-white shadow-lg border-2 ${needsTopup ? 'border-[#f97316]' : 'border-[#e2e8f0]'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 text-[#1f2937]">
            <Wallet className="h-5 w-5 text-[#3b82f6]" />
            Account Credits
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchCreditData}
              className="h-6 w-6 p-0 ml-2 text-[#64748b] hover:text-[#1f2937]"
            >
              🔄
            </Button>
          </CardTitle>
          {needsTopup && (
            <div className="flex items-center text-[#f97316]">
              <AlertTriangle className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">Low Balance</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Current Balance */}
          <div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-bold text-[#1f2937]">
                ${(balance || 0).toFixed(2)}
              </span>
              <span className="text-sm text-[#64748b]">available</span>
            </div>
            
            {needsTopup && (
              <p className="text-sm text-[#f97316] font-medium">
                Balance is below ${(minimumBalance || 5).toFixed(2)} minimum. Consider adding credits.
              </p>
            )}
          </div>

          {/* Custom Top-up Amount */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-[#1f2937]">Add Credits</label>
            
            {/* Amount Input with Controls */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={decrementAmount}
                disabled={toppingUp || customAmount <= (pricing?.minimum_topup_amount || 5)}
                className="w-8 h-8 p-0 border-[#e2e8f0] hover:bg-[#f8fafc]"
              >
                -
              </Button>
              
              <input
                type="number"
                min={pricing?.minimum_topup_amount || 5}
                step={pricing?.minimum_topup_amount || 5}
                value={customAmount}
                onChange={(e) => handleCustomAmountChange(parseInt(e.target.value) || (pricing?.minimum_topup_amount || 5))}
                className="flex-1 px-3 py-2 border border-[#e2e8f0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] text-center text-xl font-bold text-[#1f2937] bg-white"
                disabled={toppingUp}
              />
              
              <Button
                variant="outline"
                size="sm"
                onClick={incrementAmount}
                disabled={toppingUp}
                className="w-8 h-8 p-0 border-[#e2e8f0] hover:bg-[#f8fafc]"
              >
                +
              </Button>
            </div>

            <p className="text-xs text-[#64748b] text-center">Minimum ${pricing?.minimum_topup_amount || 5}, in ${pricing?.minimum_topup_amount || 5} increments</p>

            {/* Top-up Button */}
            <Button
              onClick={() => handleTopup(customAmount)}
              disabled={toppingUp}
              className="w-full bg-[#10b981] hover:bg-[#059669] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              {toppingUp ? 'Processing...' : `Add $${customAmount} Credits`}
            </Button>
          </div>

          {/* Recent Transactions */}
          {recentTransactions.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-[#1f2937] mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#3b82f6]" />
                Recent Activity
              </h4>
              <div className="space-y-2">
                {recentTransactions.slice(0, 3).map((transaction, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center text-sm py-2 px-2 rounded bg-[#f8fafc] border border-[#e2e8f0]"
                  >
                    <div>
                      <span className="text-[#1f2937] font-medium">{transaction.description}</span>
                      <span className="text-[#64748b] text-xs block">
                        {new Date(transaction.date).toLocaleDateString()}
                      </span>
                    </div>
                    <span
                      className={`font-bold ${
                        transaction.amount > 0 ? 'text-[#10b981]' : 'text-[#ef4444]'
                      }`}
                    >
                      {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Plan Info */}
          <div className="text-xs text-[#64748b] pt-2 border-t border-[#e2e8f0]">
            {planType === 'trial' ? (
              <p className="font-medium">🎉 Free Trial: 1 assistant • 5 calls total</p>
            ) : planType === 'payg' ? (
              <p className="font-medium">💡 Pay-as-you-go: ${pricing?.cost_per_minute_payg || 0.07}/minute • ${pricing?.assistant_base_cost || 20}/assistant</p>
            ) : (
              <p className="font-medium">💡 Credits used when plan quota exceeded</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}