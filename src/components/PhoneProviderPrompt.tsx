'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, ArrowRight, Zap, Shield, DollarSign } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PhoneProviderPrompt() {
  const [showBanner, setShowBanner] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [hasOwnProvider, setHasOwnProvider] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkPhoneProvider();
  }, []);

  const checkPhoneProvider = async () => {
    try {
      const response = await fetch('/api/phone-providers');
      const data = await response.json();
      
      const hasProvider = data.providers && data.providers.length > 0;
      setHasOwnProvider(hasProvider);
      
      if (!hasProvider) {
        setShowBanner(true);
        setTimeout(() => setShowPopup(true), 2000);
      }
    } catch (error) {
      console.error('Failed to check phone provider:', error);
    }
  };

  const handleBannerDismiss = () => {
    setShowBanner(false);
    if (!showPopup) {
      setTimeout(() => setShowPopup(true), 500);
    }
  };

  const handlePopupDismiss = () => {
    setShowPopup(false);
  };

  const handleSetupProvider = () => {
    router.push('/settings?tab=phone');
    setShowBanner(false);
    setShowPopup(false);
  };

  if (hasOwnProvider) return null;

  return (
    <>
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5" />
                  <p className="text-sm font-medium">
                    <span className="font-bold">Default provider: US numbers only!</span> During high demand, calls may fail. Connect your own provider for 100% reliability.
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleSetupProvider}
                    className="px-4 py-1.5 bg-white text-blue-600 rounded-full text-sm font-semibold hover:bg-blue-50 transition-colors flex items-center space-x-1"
                  >
                    <span>Set Up Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleBannerDismiss}
                    className="p-1 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPopup && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={handlePopupDismiss}
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full pointer-events-auto overflow-hidden">
                <div className="relative bg-gradient-to-br from-blue-600 to-purple-600 p-8 text-white">
                  <button
                    onClick={handlePopupDismiss}
                    className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  
                  <div className="flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                    <Phone className="w-8 h-8" />
                  </div>
                  
                  <h2 className="text-2xl font-bold mb-2">Upgrade Your Phone Provider</h2>
                  <p className="text-blue-100">
                    Default provider is US-only and may experience downtime during peak hours. Get guaranteed reliability with your own provider!
                  </p>
                </div>

                <div className="p-8">
                  <div className="space-y-4 mb-6">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Better Rates</h3>
                        <p className="text-sm text-gray-600">Pay only for what you use with your own Twilio/Plivo account</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Shield className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Full Control</h3>
                        <p className="text-sm text-gray-600">Manage your own phone numbers and call settings</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Zap className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">100% Reliability</h3>
                        <p className="text-sm text-gray-600">No downtime during peak hours - your calls always go through</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={handleSetupProvider}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center space-x-2"
                    >
                      <span>Set Up Provider</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handlePopupDismiss}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                    >
                      Later
                    </button>
                  </div>

                  <p className="text-xs text-gray-500 text-center mt-4">
                    Supports Twilio, Plivo, and Vonage/Nexmo
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
