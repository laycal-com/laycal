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
        // Banner only. The pop-up used to open by itself two seconds later on
        // every visit, which collided with the setup guide and nagged everyone else.
        setShowBanner(true);
      }
    } catch (error) {
      console.error('Failed to check phone provider:', error);
    }
  };

  const handleBannerDismiss = () => {
    setShowBanner(false);
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

  const benefits = [
    { icon: DollarSign, title: 'Better rates', copy: 'Pay only for what you use with your own Twilio or Plivo account.' },
    { icon: Shield, title: 'Full control', copy: 'Manage your own phone numbers and call settings.' },
    { icon: Zap, title: 'Reliability', copy: 'No shared capacity at peak hours, so your calls go through.' },
  ];

  return (
    <>
      <AnimatePresence initial={false}>
        {showBanner && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl border border-border bg-card px-4 py-3">
              <Phone className="h-4 w-4 flex-none text-muted-foreground" />
              <p className="min-w-0 flex-1 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">You are on the shared US number.</span> During high
                demand, calls may fail. Connect your own provider for dependable delivery.
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleSetupProvider}
                  className="flex h-8 items-center gap-1.5 rounded-full bg-foreground px-3.5 text-xs font-medium text-background outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Set up now
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={handleBannerDismiss}
                  aria-label="Dismiss"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="h-4 w-4" />
                </button>
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
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              onClick={handlePopupDismiss}
            />

            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 12 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="provider-prompt-title"
                className="pointer-events-auto relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-popover p-7 text-popover-foreground shadow-2xl"
              >
                <button
                  onClick={handlePopupDismiss}
                  aria-label="Close"
                  className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="h-4 w-4" />
                </button>

                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/40 bg-primary/10">
                  <Phone className="h-5 w-5 text-brand-soft" />
                </span>
                <h2 id="provider-prompt-title" className="mt-5 text-xl font-semibold tracking-[-0.02em] text-foreground">
                  Connect your own phone provider
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  The shared number is US-only and can run out of capacity at peak hours.
                </p>

                <ul className="mt-6 space-y-4">
                  {benefits.map((b) => (
                    <li key={b.title} className="flex items-start gap-3">
                      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
                        <b.icon className="h-4 w-4" />
                      </span>
                      <div>
                        <h3 className="text-sm font-medium text-foreground">{b.title}</h3>
                        <p className="text-sm leading-5 text-muted-foreground">{b.copy}</p>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="mt-7 flex gap-3">
                  <button
                    onClick={handleSetupProvider}
                    className="flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-primary-foreground outline-none transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    Set up provider
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handlePopupDismiss}
                    className="h-10 rounded-full border border-border px-5 text-sm font-medium text-foreground outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Later
                  </button>
                </div>

                <p className="mt-4 text-center text-xs text-muted-foreground">Supports Twilio, Plivo and Vonage.</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
