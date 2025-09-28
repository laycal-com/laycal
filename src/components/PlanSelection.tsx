'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Clock, Bot, Star, Crown, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface PricingData {
  assistant_base_cost: number;
  cost_per_minute_payg: number;
  cost_per_minute_overage: number;
  minimum_topup_amount: number;
  initial_payg_charge: number;
  payg_initial_credits: number;
}

interface PlanSelectionProps {
  onPlanSelected?: (planType: string) => void;
}

export function PlanSelection({ onPlanSelected }: PlanSelectionProps) {
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
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
      // Use default values if fetch fails
      setPricing({
        assistant_base_cost: 21,
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

  const handlePlanSelection = async (planType: string) => {
    setSelecting(planType);
    
    try {
      if (planType === 'trial') {
        // Create free trial subscription
        const response = await fetch('/api/user/select-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planType: 'trial' })
        });

        if (response.ok) {
          toast.success('Free trial activated!', {
            description: 'You now have 1 assistant and 5 calls to get started.'
          });
          onPlanSelected?.('trial');
          router.push('/dashboard');
        } else {
          throw new Error('Failed to activate free trial');
        }
      } else if (planType === 'payg') {
        // Create PAYG subscription and redirect to payment
        const response = await fetch('/api/user/select-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planType: 'payg' })
        });

        if (response.ok) {
          // Redirect to payment for initial PAYG charge
          const orderResponse = await fetch('/api/paypal/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: pricing?.initial_payg_charge || 25,
              description: `Pay-as-you-go Activation ($${pricing?.initial_payg_charge || 25} - includes first assistant + credits)`,
              planType: 'payg'
            })
          });

          if (orderResponse.ok) {
            const orderData = await orderResponse.json();
            if (orderData.approvalUrl) {
              window.location.href = orderData.approvalUrl;
            }
          } else {
            throw new Error('Failed to create payment order');
          }
        } else {
          throw new Error('Failed to setup PAYG plan');
        }
      } else if (planType === 'custom') {
        // For custom plans, first setup PAYG, then redirect to contact
        const response = await fetch('/api/user/select-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planType: 'payg' }) // Same backend setup as PAYG
        });

        if (response.ok) {
          toast.success('Redirecting to support...', {
            description: 'Please create a support ticket for your custom plan request.'
          });
          // Redirect to support page
          router.push('/support?category=custom_plan_request');
        } else {
          throw new Error('Failed to setup custom plan');
        }
      }
    } catch (error) {
      toast.error('Plan selection failed', {
        description: 'Please try again or contact support.'
      });
      console.error('Plan selection error:', error);
    } finally {
      setSelecting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading plan options...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600">
            Select the plan that best fits your calling needs
          </p>
        </div>

        {/* Plan Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Free Trial */}
          <Card className="relative border-2 border-blue-200 hover:border-blue-400 transition-colors">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Star className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-xl">Free Trial</CardTitle>
              <div className="text-3xl font-bold text-blue-600">
                $0
                <span className="text-sm text-gray-600 font-normal">/30 days</span>
              </div>
              <Badge variant="secondary" className="mx-auto">Perfect to Start</Badge>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm">1 AI assistant</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm">5 calls total</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm">All voice providers</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Call analytics</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm">30-day trial period</span>
                </div>
              </div>

              <Button
                onClick={() => handlePlanSelection('trial')}
                disabled={selecting !== null}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {selecting === 'trial' ? 'Starting Trial...' : 'Start Free Trial'}
              </Button>
            </CardContent>
          </Card>

          {/* PAYG */}
          <Card className="relative border-2 border-green-200 hover:border-green-400 transition-colors">
            <Badge className="absolute -top-2 left-4 bg-green-600 text-white">
              Recommended
            </Badge>
            
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Bot className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-xl">Pay-as-you-go</CardTitle>
              <div className="text-3xl font-bold text-green-600">
                ${pricing?.initial_payg_charge || 25}
                <span className="text-sm text-gray-600 font-normal"> to start</span>
              </div>
              <Badge variant="secondary" className="mx-auto">Most Popular</Badge>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Unlimited AI assistants</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm">${pricing?.cost_per_minute_payg || 0.07}/minute calling</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm">${pricing?.assistant_base_cost || 21}/assistant creation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm">All premium features</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm">No monthly commitments</span>
                </div>
              </div>

              <Button
                onClick={() => handlePlanSelection('payg')}
                disabled={selecting !== null}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {selecting === 'payg' ? 'Setting up...' : `Start with $${pricing?.initial_payg_charge || 25}`}
              </Button>
            </CardContent>
          </Card>

          {/* Custom Plans */}
          <Card className="relative border-2 border-purple-200 hover:border-purple-400 transition-colors">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Crown className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle className="text-xl">Custom Plans</CardTitle>
              <div className="text-3xl font-bold text-purple-600">
                Custom
                <span className="text-sm text-gray-600 font-normal"> pricing</span>
              </div>
              <Badge variant="secondary" className="mx-auto">Enterprise</Badge>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Volume discounts</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Dedicated support</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Custom integrations</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm">SLA guarantees</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-purple-500" />
                  <span className="text-sm">Direct account management</span>
                </div>
              </div>

              <Button
                onClick={() => handlePlanSelection('custom')}
                disabled={selecting !== null}
                variant="outline"
                className="w-full border-purple-600 text-purple-600 hover:bg-purple-50"
              >
                {selecting === 'custom' ? 'Redirecting...' : 'Contact Sales'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>All plans include call analytics, transcripts, and calendar integration.</p>
          <p>You can change or upgrade your plan at any time.</p>
        </div>
      </div>
    </div>
  );
}