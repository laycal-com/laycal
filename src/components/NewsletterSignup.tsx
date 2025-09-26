'use client';

import { useState } from 'react';
import { toast } from 'sonner';

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Here you would typically send the email to your newsletter service
      // For now, we'll just show a success message
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast.success('Thanks for subscribing! You\'ll receive our latest insights soon.');
      setEmail('');
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="bg-gradient-to-r from-blue-900 via-blue-800 to-purple-900 text-white py-20">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <div className="mb-8">
          <svg
            className="w-16 h-16 mx-auto mb-6 text-yellow-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
          </svg>
          
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Monthly insights, delivered to your inbox
          </h2>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Get the latest AI calling trends, sales automation tips, and industry insights 
            delivered straight to your inbox every month.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-md mx-auto">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="bg-yellow-400 text-blue-900 px-6 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isLoading ? 'Subscribing...' : 'Subscribe'}
            </button>
          </div>
        </form>

        <p className="text-sm opacity-75 mt-4">
          ✅ No spam, ever. ✅ Unsubscribe anytime. ✅ 5,000+ subscribers trust us.
        </p>
        
        <div className="flex justify-center items-center space-x-8 mt-8 opacity-60">
          <span className="text-sm">As featured in:</span>
          <div className="flex space-x-6">
            <span className="text-sm font-medium">TechCrunch</span>
            <span className="text-sm font-medium">Forbes</span>
            <span className="text-sm font-medium">VentureBeat</span>
          </div>
        </div>
      </div>
    </section>
  );
}