'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CreditCard, Zap, Shield, Users } from 'lucide-react';
import { toast } from 'sonner';

interface PricingData {
  assistant_base_cost: number;
  cost_per_minute_payg: number;
  cost_per_minute_overage: number;
  minimum_topup_amount: number;
  initial_payg_charge: number;
  payg_initial_credits: number;
}

export function PaymentRequired() {
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const response = await fetch('/api/pricing');
        if (response.ok) {
          const data = await response.json();
          setPricing(data);
        }
      } catch (error) {
        console.error('Failed to fetch pricing:', error);
        // Use default values
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
    
    fetchPricing();
  }, []);

  const handlePaymentStart = async () => {
    setLoading(true);
    try {
      const chargeAmount = pricing?.initial_payg_charge || 25;
      
      // Create PayPal order for initial charge
      const orderResponse = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: chargeAmount,
          description: `Pay-as-you-go Activation ($${chargeAmount} - includes first assistant + credits)`,
          planType: 'payg'
        })
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to create PayPal order');
      }

      const orderData = await orderResponse.json();
      
      // Redirect to PayPal for payment
      if (orderData.approvalUrl) {
        window.location.href = orderData.approvalUrl;
      } else {
        throw new Error('PayPal approval URL not found');
      }

    } catch (error) {
      console.error('Payment initiation error:', error);
      toast.error('Failed to start payment process. Please try again.');
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4" style={{ paddingTop: '80px' }}>
      <div className="max-w-4xl w-full">
        {/* Welcome Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#1f2937] mb-4">
            Welcome to Laycal! 🚀
          </h1>
          <p className="text-xl text-[#64748b] max-w-2xl mx-auto">
            Get started with pay-as-you-go pricing to begin making AI-powered calls to your leads.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow-lg border border-[#e2e8f0] text-center">
            <div className="text-2xl font-bold text-[#3b82f6]">AI-Powered</div>
            <div className="text-sm text-[#64748b]">Voice Assistants</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-lg border border-[#e2e8f0] text-center">
            <div className="text-2xl font-bold text-[#10b981]">Automated</div>
            <div className="text-sm text-[#64748b]">Lead Calling</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-lg border border-[#e2e8f0] text-center">
            <div className="text-2xl font-bold text-[#8b5cf6]">Real-time</div>
            <div className="text-sm text-[#64748b]">Analytics</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-lg border border-[#e2e8f0] text-center">
            <div className="text-2xl font-bold text-[#f97316]">Calendar</div>
            <div className="text-sm text-[#64748b]">Integration</div>
          </div>
        </div>

        {/* Payment Options */}
        <div className="flex justify-center mb-8">
          {/* Pay-as-you-go Card */}
          <Card className="border-2 border-[#10b981] bg-white relative max-w-lg w-full shadow-xl">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-[#10b981] text-white px-4 py-1 rounded-full text-sm font-semibold">
                🚀 Get Started Now
              </span>
            </div>
            
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-center gap-2 text-[#1f2937] text-xl">
                <Zap className="h-6 w-6 text-[#10b981]" />
                Pay-as-you-go
              </CardTitle>
              <div className="text-center">
                <div className="text-4xl font-bold text-[#10b981] mb-2">
                  ${pricing?.initial_payg_charge || 25}
                </div>
                <div className="text-[#64748b]">initial charge to start</div>
              </div>
            </CardHeader>
            
            <CardContent>
              <ul className="space-y-3 mb-8 text-sm">
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-[#10b981] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-[#1f2937] font-medium">Get started immediately</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-[#10b981] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-[#1f2937] font-medium">${pricing?.assistant_base_cost || 20} for your first assistant</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-[#10b981] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-[#1f2937] font-medium">${pricing?.payg_initial_credits || 5} in calling credits</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-[#10b981] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-[#1f2937] font-medium">${pricing?.cost_per_minute_payg || 0.07}/minute for calls</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-[#10b981] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-[#1f2937] font-medium">No monthly commitments</span>
                </li>
              </ul>
              
              <Button 
                className="w-full bg-[#10b981] hover:bg-[#059669] text-white py-4 text-lg font-semibold"
                onClick={handlePaymentStart}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    🚀 Dial Into Success
                  </>
                )}
              </Button>
              
              <div className="mt-4 text-center">
                <p className="text-sm text-[#64748b]">
                  Need enterprise solutions? <Link href="/#pricing" className="text-[#3b82f6] hover:text-[#2563eb] font-medium">View enterprise options</Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Info */}
        <div className="text-center">
          <p className="text-sm text-[#64748b] mb-2">
            ✅ No setup fees • ✅ Cancel anytime • ✅ Secure PayPal payments
          </p>
          <p className="text-xs text-[#64748b]">
            Need help choosing? <Link href="/contact" className="text-[#3b82f6] hover:text-[#2563eb]">Contact our sales team</Link>
          </p>
        </div>
      </div>
    </div>
  );
}