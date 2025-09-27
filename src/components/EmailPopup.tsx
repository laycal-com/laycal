'use client';

import { useState, useEffect } from 'react';
import { X, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface EmailPopupProps {
  postTitle: string;
}

export default function EmailPopup({ postTitle }: EmailPopupProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    // Check if popup was already shown/dismissed in this session
    const popupDismissed = sessionStorage.getItem('emailPopupDismissed');
    if (popupDismissed) return;

    const handleScroll = () => {
      if (hasShown) return;

      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercentage = (scrollTop / documentHeight) * 100;

      if (scrollPercentage >= 50) {
        setIsVisible(true);
        setHasShown(true);
        window.removeEventListener('scroll', handleScroll);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasShown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/email-collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          source: 'blog_popup',
          postTitle,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        toast.success('Thanks for subscribing! You\'ll receive our latest insights.');
        setIsVisible(false);
        sessionStorage.setItem('emailPopupDismissed', 'true');
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    sessionStorage.setItem('emailPopupDismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 relative overflow-hidden">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 pb-8">
          <div className="flex items-center mb-3">
            <Mail className="w-8 h-8 mr-3" />
            <h3 className="text-2xl font-bold">Get More Insights</h3>
          </div>
          <p className="text-blue-100">
            Since you're enjoying this article, get our latest AI sales insights delivered to your inbox.
          </p>
        </div>

        {/* Form */}
        <div className="p-6 -mt-4">
          <div className="bg-white rounded-xl shadow-lg p-6 border">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="popup-email" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Email Address
                </label>
                <input
                  id="popup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting || !email.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Subscribing...
                  </div>
                ) : (
                  'Get Free AI Sales Insights'
                )}
              </button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                ✅ No spam, ever ✅ Unsubscribe anytime ✅ Weekly insights
              </p>
            </div>
          </div>
        </div>

        {/* Bottom accent */}
        <div className="h-2 bg-gradient-to-r from-blue-600 to-purple-600"></div>
      </div>
    </div>
  );
}