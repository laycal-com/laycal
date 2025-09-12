'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import { UsageWidget } from './UsageWidget';
import { UpgradeModal } from './UpgradeModal';
import { CreditWidget } from './CreditWidget';
import { toast } from 'sonner';

export function DashboardClient() {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [activatingPayg, setActivatingPayg] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Check if user came from PAYG activation
    if (urlParams.get('setup') === 'payg') {
      handlePaygActivation();
    }
    
    // Check if user returned from PayPal payment
    const token = urlParams.get('token');
    const payerId = urlParams.get('PayerID');
    
    if (token && payerId && urlParams.get('payment') === 'success') {
      handlePaymentSuccess(token, payerId);
    }
  }, []);

  const handlePaymentSuccess = async (token: string, payerId: string) => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const chargeAmount = urlParams.get('charge') || '25';
      
      toast.success('Processing payment...', {
        description: 'Adding credits to your account'
      });

      // Capture the PayPal payment - the API will determine correct amount from PayPal
      const response = await fetch('/api/paypal/capture-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: token,
          planType: 'payg', // Default, will be corrected in API based on amount
          amount: parseFloat(chargeAmount), // Default, will be corrected from PayPal
          description: `Payment processing`
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Payment successful!', {
          description: result.message || `$${chargeAmount} credits added to your account`
        });
        
        // Clean up URL and refresh subscription status
        window.history.replaceState({}, '', '/dashboard');
        
        // Force refresh of the page to update all widgets
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Payment processing failed');
      }

    } catch (error) {
      console.error('Payment capture error:', error);
      toast.error('Payment processing failed', {
        description: error instanceof Error ? error.message : 'Please contact support.'
      });
    }
  };

  const handlePaygActivation = async () => {
    setActivatingPayg(true);
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const chargeAmount = urlParams.get('charge') || '25';
      
      // Step 1: Create PayPal order for initial charge
      const orderResponse = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(chargeAmount),
          description: `Pay-as-you-go Activation ($${chargeAmount} - includes first assistant + credits)`,
          planType: 'payg'
        })
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to create PayPal order');
      }

      const orderData = await orderResponse.json();
      
      // Step 2: Redirect to PayPal for payment
      if (orderData.approvalUrl) {
        window.location.href = orderData.approvalUrl;
      } else {
        throw new Error('PayPal approval URL not found');
      }

    } catch (error) {
      console.error('PAYG activation error:', error);
      toast.error('Payment required to activate Pay-as-you-go', {
        description: error instanceof Error ? error.message : 'Please try again or contact support.'
      });
      setActivatingPayg(false);
    }
  };


  // Show activating screen during PAYG setup
  if (activatingPayg) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#10b981] mx-auto mb-4"></div>
          <p className="text-[#1f2937] text-lg font-medium">Setting up your Pay-as-you-go plan...</p>
          <p className="text-[#64748b] text-sm mt-2">Redirecting to PayPal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]" style={{ paddingTop: '80px' }}>
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-[#1f2937] mb-2">AI Voice Assistant Dashboard</h2>
          <p className="text-[#64748b]">Monitor your usage, manage assistants, and track call performance.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Usage Widget */}
          <div>
            <UsageWidget onUpgrade={() => setShowUpgradeModal(true)} />
          </div>
          
          {/* Credit Widget */}
          <div>
            <CreditWidget />
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-lg shadow-lg border border-[#e2e8f0]">
              <h3 className="text-xl font-semibold mb-3 text-[#1f2937]">Quick Actions</h3>
              <div className="space-y-3">
                <Link 
                  href="/assistants" 
                  className="block bg-[#3b82f6] text-white px-4 py-2 rounded-lg hover:bg-[#2563eb] transition-colors text-center text-sm"
                >
                  Manage Assistants
                </Link>
                <Link 
                  href="/leads" 
                  className="block bg-[#10b981] text-white px-4 py-2 rounded-lg hover:bg-[#059669] transition-colors text-center text-sm"
                >
                  Upload Leads
                </Link>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg border border-[#e2e8f0]">
              <h3 className="text-xl font-semibold mb-3 text-[#1f2937]">Account</h3>
              <div className="space-y-3">
                <Link 
                  href="/settings" 
                  className="block bg-[#64748b] text-white px-4 py-2 rounded-lg hover:bg-[#475569] transition-colors text-center text-sm"
                >
                  Phone Settings
                </Link>
                <Link 
                  href="/appointments" 
                  className="block bg-[#f97316] text-white px-4 py-2 rounded-lg hover:bg-[#ea580c] transition-colors text-center text-sm"
                >
                  View Appointments
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow-lg border border-[#e2e8f0]">
          <h3 className="text-xl font-semibold mb-4 text-[#1f2937]">Getting Started</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 border border-[#e2e8f0] rounded-lg hover:border-[#3b82f6] hover:shadow-md transition-all">
              <h4 className="font-semibold text-[#1f2937] mb-2">1. Create an Assistant</h4>
              <p className="text-sm text-[#64748b] mb-3">Configure your AI voice assistant with custom prompts and voice settings.</p>
              <Link href="/assistants" className="text-[#3b82f6] hover:text-[#2563eb] text-sm font-medium">
                Create Assistant →
              </Link>
            </div>
            <div className="p-4 border border-[#e2e8f0] rounded-lg hover:border-[#3b82f6] hover:shadow-md transition-all">
              <h4 className="font-semibold text-[#1f2937] mb-2">2. Configure Phone Numbers</h4>
              <p className="text-sm text-[#64748b] mb-3">Set up your phone providers (Twilio, Plivo, etc.) for outbound calling.</p>
              <Link href="/settings" className="text-[#3b82f6] hover:text-[#2563eb] text-sm font-medium">
                Setup Phones →
              </Link>
            </div>
            <div className="p-4 border border-[#e2e8f0] rounded-lg hover:border-[#3b82f6] hover:shadow-md transition-all">
              <h4 className="font-semibold text-[#1f2937] mb-2">3. Upload Leads</h4>
              <p className="text-sm text-[#64748b] mb-3">Upload a CSV file with your leads and start your calling campaign.</p>
              <Link href="/leads" className="text-[#3b82f6] hover:text-[#2563eb] text-sm font-medium">
                Upload CSV →
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <UpgradeModal onClose={() => setShowUpgradeModal(false)} />
      )}
    </div>
  );
}