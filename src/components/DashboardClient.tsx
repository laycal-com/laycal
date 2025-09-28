'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import { UsageWidget } from './UsageWidget';
import { UpgradeModal } from './UpgradeModal';
import { CreditWidget } from './CreditWidget';
import { PhoneProviderStatus } from './PhoneProviderStatus';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50" style={{ paddingTop: '80px' }}>
      <main className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                Dashboard
              </h1>
              <p className="text-lg text-slate-600">Monitor your AI voice assistant performance and manage your campaigns</p>
            </div>
            <div className="hidden lg:flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-sm border">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-slate-700">System Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Account Overview */}
          <div className="lg:col-span-1">
            <CreditWidget />
          </div>
          
          {/* Usage Stats */}
          <div className="lg:col-span-1">
            <UsageWidget onUpgrade={() => setShowUpgradeModal(true)} />
          </div>

          {/* Phone Provider Status */}
          <div className="lg:col-span-1">
            <PhoneProviderStatus />
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link 
            href="/assistants" 
            className="group bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-lg hover:border-blue-300 transition-all duration-300"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Assistants</h3>
                <p className="text-sm text-slate-500">Manage AI voices</p>
              </div>
            </div>
            <div className="text-xs text-blue-600 font-medium">Configure →</div>
          </Link>

          <Link 
            href="/leads" 
            className="group bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-lg hover:border-green-300 transition-all duration-300"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Leads</h3>
                <p className="text-sm text-slate-500">Upload & manage</p>
              </div>
            </div>
            <div className="text-xs text-green-600 font-medium">Upload →</div>
          </Link>

          <Link 
            href="/settings" 
            className="group bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-lg hover:border-slate-400 transition-all duration-300"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Settings</h3>
                <p className="text-sm text-slate-500">Phone providers</p>
              </div>
            </div>
            <div className="text-xs text-slate-600 font-medium">Configure →</div>
          </Link>

          <Link 
            href="/appointments" 
            className="group bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-lg hover:border-orange-300 transition-all duration-300"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Appointments</h3>
                <p className="text-sm text-slate-500">Calendar & bookings</p>
              </div>
            </div>
            <div className="text-xs text-orange-600 font-medium">View →</div>
          </Link>
        </div>

        {/* Getting Started Guide */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold mb-2">Getting Started</h3>
              <p className="text-blue-100">Set up your AI voice assistant in 3 simple steps</p>
            </div>
            <div className="hidden md:block">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-white text-blue-600 rounded-full flex items-center justify-center font-bold text-sm mr-3">
                  1
                </div>
                <h4 className="font-semibold text-lg">Phone Setup</h4>
              </div>
              <p className="text-blue-100 text-sm mb-4">Ready to call US numbers (+1) with default provider. Set up custom providers for international calls.</p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-green-500/20 text-green-100 text-xs px-3 py-1 rounded-full font-medium border border-green-400/30">
                  ✓ US Ready
                </span>
                <span className="bg-blue-500/20 text-blue-100 text-xs px-3 py-1 rounded-full font-medium border border-blue-400/30">
                  No Setup Required
                </span>
              </div>
              <Link href="/settings" className="text-white hover:text-blue-100 text-sm font-medium inline-flex items-center">
                Manage Providers 
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-white text-blue-600 rounded-full flex items-center justify-center font-bold text-sm mr-3">
                  2
                </div>
                <h4 className="font-semibold text-lg">Create Assistant</h4>
              </div>
              <p className="text-blue-100 text-sm mb-6">Configure your AI voice assistant with custom prompts, voice settings, and conversation flow.</p>
              <Link href="/assistants" className="text-white hover:text-blue-100 text-sm font-medium inline-flex items-center">
                Create Assistant 
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-white text-blue-600 rounded-full flex items-center justify-center font-bold text-sm mr-3">
                  3
                </div>
                <h4 className="font-semibold text-lg">Upload Leads</h4>
              </div>
              <p className="text-blue-100 text-sm mb-6">Upload a CSV file with your leads and start your automated calling campaign immediately.</p>
              <Link href="/leads" className="text-white hover:text-blue-100 text-sm font-medium inline-flex items-center">
                Upload CSV 
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
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