'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, Bot, TrendingUp, AlertTriangle } from 'lucide-react';

interface UsageSummary {
  planType: string;
  planName: string;
  minutesUsed: number;
  minuteLimit: number;
  minutesRemaining: number;
  minutesOverage: number;
  assistantsCreated: number;
  assistantLimit: number;
  assistantsRemaining: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  isOverLimit: boolean;
  isPayAsYouGo: boolean;
  currentPeriodCost: number;
  overageCost: number;
  creditBalance?: number;
  needsTopup?: boolean;
  callsUsed?: number;
  callLimit?: number;
  callsRemaining?: number;
}

interface PricingData {
  assistant_base_cost: number;
  cost_per_minute_payg: number;
  cost_per_minute_overage: number;
  minimum_topup_amount: number;
  initial_payg_charge: number;
  payg_initial_credits: number;
}

interface UsageWidgetProps {
  onUpgrade?: () => void;
}

export function UsageWidget({ onUpgrade }: UsageWidgetProps) {
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsage();
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

  const fetchUsage = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/subscription');
      
      if (!response.ok) {
        throw new Error('Failed to fetch usage data');
      }
      
      const data = await response.json();
      setUsage(data.subscription);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load usage data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-white shadow-lg border border-[#e2e8f0]">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-[#e2e8f0] rounded w-1/4"></div>
            <div className="space-y-2">
              <div className="h-3 bg-[#e2e8f0] rounded"></div>
              <div className="h-3 bg-[#e2e8f0] rounded w-5/6"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white shadow-lg border border-[#e2e8f0]">
        <CardContent className="p-6">
          <div className="text-center text-[#ef4444]">
            <p>{error}</p>
            <Button onClick={fetchUsage} variant="outline" size="sm" className="mt-2 border-[#e2e8f0] hover:bg-[#f8fafc]">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!usage) return null;

  const minutePercentage = usage.minuteLimit === -1 ? 0 : (usage.minutesUsed / usage.minuteLimit) * 100;
  const assistantPercentage = usage.assistantLimit === -1 ? 0 : (usage.assistantsCreated / usage.assistantLimit) * 100;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      {/* Plan Overview */}
      <Card className="bg-white shadow-lg border border-[#e2e8f0]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-[#1f2937]">Current Plan</CardTitle>
            <Badge variant={usage.planType === 'trial' ? "outline" : usage.isPayAsYouGo ? "secondary" : "default"} 
                   className={usage.planType === 'trial' ? "border-green-500 text-green-700 bg-green-50" : ""}>
              {usage.planName}
              {usage.planType === 'trial' && ' 🎉'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Billing Period / Trial Info */}
          <div className="text-sm text-[#64748b]">
            {usage.planType === 'trial' ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="text-green-800 font-medium">Free Trial Active</div>
                <div className="text-green-700">Trial ends: {formatDate(usage.currentPeriodEnd)}</div>
              </div>
            ) : (
              <div>Billing period: {formatDate(usage.currentPeriodStart)} - {formatDate(usage.currentPeriodEnd)}</div>
            )}
          </div>

          {/* Calls/Minutes Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-[#3b82f6]" />
                <span className="font-medium text-[#1f2937]">
                  {usage.planType === 'trial' ? 'Calls Made' : 'Calling Minutes'}
                </span>
              </div>
              {usage.isOverLimit && usage.minutesOverage > 0 && (
                <AlertTriangle className="w-4 h-4 text-[#ef4444]" />
              )}
            </div>
            
            {usage.planType === 'trial' ? (
              <>
                <Progress value={Math.min(((usage.callsUsed || 0) / (usage.callLimit || 5)) * 100, 100)} className="h-2" />
                <div className="flex justify-between text-sm">
                  <span className="text-[#1f2937]">
                    {usage.callsUsed || 0} / {usage.callLimit || 5} calls
                  </span>
                  <span className={((usage.callsUsed || 0) >= (usage.callLimit || 5)) ? 'text-[#ef4444]' : 'text-[#64748b]'}>
                    {usage.callsRemaining || Math.max(0, (usage.callLimit || 5) - (usage.callsUsed || 0))} remaining
                  </span>
                </div>
                {(usage.callsUsed || 0) >= (usage.callLimit || 5) && (
                  <div className="text-sm text-[#ef4444] bg-[#fef2f2] p-2 rounded border border-[#fecaca]">
                    ⚠️ Call limit reached - upgrade to make more calls
                  </div>
                )}
              </>
            ) : usage.isPayAsYouGo ? (
              <div className="text-sm">
                <span className="font-semibold text-[#1f2937]">{usage.minutesUsed}</span> minutes used
                <span className="text-[#64748b] ml-2">(Pay-as-you-go: ${pricing?.cost_per_minute_payg || 0.07}/minute)</span>
              </div>
            ) : (
              <>
                <Progress value={Math.min(minutePercentage, 100)} className="h-2" />
                <div className="flex justify-between text-sm">
                  <span className="text-[#1f2937]">
                    {usage.minutesUsed} / {usage.minuteLimit === -1 ? '∞' : usage.minuteLimit} minutes
                  </span>
                  <span className={usage.minutesRemaining < 50 ? 'text-[#ef4444]' : 'text-[#64748b]'}>
                    {usage.minuteLimit === -1 ? 'Unlimited' : `${usage.minutesRemaining} remaining`}
                  </span>
                </div>
                {usage.minutesOverage > 0 && (
                  <div className="text-sm text-[#ef4444] bg-[#fef2f2] p-2 rounded border border-[#fecaca]">
                    ⚠️ Over limit by {usage.minutesOverage} minutes (${usage.overageCost.toFixed(2)} in overages)
                  </div>
                )}
              </>
            )}
          </div>

          {/* Assistants Usage */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Bot className="w-4 h-4 text-[#8b5cf6]" />
              <span className="font-medium text-[#1f2937]">AI Assistants</span>
            </div>
            
            {usage.assistantLimit === -1 ? (
              <div className="text-sm">
                <span className="font-semibold text-[#1f2937]">{usage.assistantsCreated}</span> assistants created
                <span className="text-[#64748b] ml-2">(Unlimited)</span>
              </div>
            ) : (
              <>
                <Progress value={Math.min(assistantPercentage, 100)} className="h-2" />
                <div className="flex justify-between text-sm">
                  <span className="text-[#1f2937]">{usage.assistantsCreated} / {usage.assistantLimit} assistants</span>
                  <span className={usage.assistantsRemaining === 0 ? 'text-[#ef4444]' : 'text-[#64748b]'}>
                    {usage.assistantsRemaining} remaining
                  </span>
                </div>
                {usage.assistantsRemaining === 0 && (
                  <div className="text-sm text-[#ef4444] bg-[#fef2f2] p-2 rounded border border-[#fecaca]">
                    ⚠️ Assistant limit reached - upgrade to create more
                  </div>
                )}
              </>
            )}
          </div>

          {/* Cost Summary */}
          {(usage.currentPeriodCost > 0 || usage.isPayAsYouGo) && (
            <div className="pt-2 border-t border-[#e2e8f0]">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-4 h-4 text-[#10b981]" />
                <span className="font-medium text-[#1f2937]">Current Period Cost</span>
              </div>
              <div className="text-lg font-semibold text-[#1f2937]">
                ${usage.currentPeriodCost.toFixed(2)}
                {usage.overageCost > 0 && (
                  <span className="text-sm text-[#ef4444] ml-2">
                    (+${usage.overageCost.toFixed(2)} overage)
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Upgrade Button */}
          {usage.planType === 'trial' && (usage.isOverLimit || (usage.callsUsed || 0) >= (usage.callLimit || 5) || usage.assistantsRemaining === 0) && (
            <Button onClick={onUpgrade} className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white">
              Upgrade to Continue
            </Button>
          )}
          {!usage.isPayAsYouGo && usage.planType !== 'trial' && (usage.isOverLimit || usage.minutesRemaining < 100 || usage.assistantsRemaining === 0) && (
            <Button onClick={onUpgrade} className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white">
              Upgrade Plan
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}