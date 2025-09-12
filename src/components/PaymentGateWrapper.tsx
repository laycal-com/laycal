'use client';

import { useState, useEffect } from 'react';
import { PaymentRequired } from './PaymentRequired';

interface PaymentGateWrapperProps {
  children: React.ReactNode;
}

export function PaymentGateWrapper({ children }: PaymentGateWrapperProps) {
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPaymentReturn, setIsPaymentReturn] = useState(false);

  useEffect(() => {
    // Check if this is a payment return from PayPal
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const payerId = urlParams.get('PayerID');
    const paymentStatus = urlParams.get('payment');
    
    if (token && payerId && paymentStatus === 'success') {
      setIsPaymentReturn(true);
    }
    
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async (retryCount = 0) => {
    try {
      const response = await fetch('/api/subscription');
      if (response.ok) {
        const data = await response.json();
        const hasValidSubscription = data.subscription.planType !== 'none';
        setHasSubscription(hasValidSubscription);
        
        // If this is a payment return and still no subscription, retry a few times
        if (isPaymentReturn && !hasValidSubscription && retryCount < 3) {
          setTimeout(() => checkSubscriptionStatus(retryCount + 1), 1000);
          return;
        }
      } else {
        setHasSubscription(false);
      }
    } catch (error) {
      console.log('Subscription check error:', error);
      setHasSubscription(false);
    } finally {
      if (retryCount === 0 || retryCount >= 3) {
        setLoading(false);
      }
    }
  };

  // Show loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3b82f6] mx-auto mb-4"></div>
          <p className="text-[#64748b]">Loading...</p>
        </div>
      </div>
    );
  }

  // Show payment required screen for users without subscription
  // BUT allow payment return to process even without subscription
  if (hasSubscription === false && !isPaymentReturn) {
    return <PaymentRequired />;
  }

  // Show the protected content (including payment return processing)
  return <>{children}</>;
}