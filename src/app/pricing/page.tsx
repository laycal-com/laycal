"use client";

import { useState, useEffect } from 'react';
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { toast } from 'sonner';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

interface PricingData {
  assistant_base_cost: number;
  cost_per_minute_payg: number;
  cost_per_minute_overage: number;
  minimum_topup_amount: number;
  initial_payg_charge: number;
  payg_initial_credits: number;
}

const getPlans = (pricing: PricingData) => [
  // Subscription plans - hidden for now but kept for future use
  // {
  //   name: "Starter Plan",
  //   price: "$49",
  //   period: "/month",
  //   features: [
  //     "500 calling minutes/month",
  //     "1 AI assistant",
  //     "All voice providers (OpenAI)",
  //     "Call transcripts & analytics",
  //     "Calendar integration",
  //     "Credit top-up when quota ends",
  //     "Email support",
  //   ],
  //   paypalPlanId: "P-STARTER-PLAN-ID",
  //   planType: "starter",
  //   popular: false,
  // },
  // {
  //   name: "Growth Plan",
  //   price: "$149",
  //   period: "/month",
  //   features: [
  //     "2,000 calling minutes/month",
  //     "3 AI assistants",
  //     "All voice providers (OpenAI)",
  //     "Advanced call analytics",
  //     "Calendar integration",
  //     "Priority email support",
  //   ],
  //   paypalPlanId: "P-GROWTH-PLAN-ID",
  //   planType: "growth",
  //   popular: true,
  // },
  // {
  //   name: "Pro Plan",
  //   price: "$399",
  //   period: "/month",
  //   features: [
  //     "7,000 calling minutes/month",
  //     "10 AI assistants",
  //     "All voice providers (OpenAI)",
  //     "Advanced analytics & reporting",
  //     "Custom integrations",
  //     "Priority phone support",
  //   ],
  //   paypalPlanId: "P-PRO-PLAN-ID",
  //   planType: "pro",
  //   popular: false,
  // },
  {
    name: "Pay-as-you-go",
    price: `$${pricing.initial_payg_charge}`,
    period: "initial charge",
    features: [
      `$${pricing.initial_payg_charge} initial charge ($${pricing.assistant_base_cost} assistant + $${pricing.payg_initial_credits} credits)`,
      `$${pricing.cost_per_minute_payg} per calling minute`,
      `$${pricing.assistant_base_cost} per additional assistant`, 
      `Minimum $${pricing.minimum_topup_amount} top-ups when balance low`,
      "All voice providers (OpenAI)",
      "Call transcripts & analytics",
      "Email support",
      "No monthly commitments",
    ],
    paypalPlanId: "PAYG-CREDITS",
    planType: "payg",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    features: [
      "Unlimited calling minutes",
      "Unlimited AI assistants",
      "All voice providers",
      "Custom integrations",
      "Dedicated account manager",
      "24/7 phone support",
      "SLA guarantees",
    ],
    paypalPlanId: "CONTACT",
    planType: "enterprise",
    popular: false,
  },
];

const PayPalButton = ({ planId, planName }: { planId: string; planName: string }) => {
  return (
    <PayPalButtons
      style={{
        shape: "pill",
        color: "gold",
        layout: "vertical",
        label: "subscribe",
      }}
      createSubscription={(data, actions) => {
        return actions.subscription.create({
          plan_id: planId,
        });
      }}
      onApprove={async (data) => {
        console.log("Subscription successful:", data);
        toast.success('Subscription Successful', {
          description: `Subscription ID: ${data.subscriptionID}`
        });
      }}
      onError={(err) => {
        console.error("PayPal error:", err);
        toast.error('Subscription Failed', {
          description: 'Please try again or contact support if the issue persists'
        });
      }}
    />
  );
};

export default function Pricing() {
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const response = await fetch('/api/pricing');
        if (response.ok) {
          const data = await response.json();
          setPricing(data);
        } else {
          // Use default values if API fails
          setPricing({
            assistant_base_cost: 20,
            cost_per_minute_payg: 0.07,
            cost_per_minute_overage: 0.05,
            minimum_topup_amount: 5,
            initial_payg_charge: 25,
            payg_initial_credits: 5
          });
        }
      } catch (error) {
        console.error('Failed to fetch pricing:', error);
        // Use default values if fetch fails
        setPricing({
          assistant_base_cost: 20,
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

    fetchPricing();
  }, []);

  const paypalOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "",
    vault: true,
    intent: "subscription",
  };

  if (loading || !pricing) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#3b82f6]"></div>
      </div>
    );
  }

  const plans = getPlans(pricing);

  return (
    <div className="min-h-screen bg-[#f8fafc]" style={{ paddingTop: '80px' }}>
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-[#1f2937] mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-[#64748b] max-w-3xl mx-auto">
            Start small with pay-as-you-go pricing, or go big with our enterprise solution. No hidden fees.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white rounded-lg shadow-lg border-2 p-8 ${
                plan.popular ? "border-[#10b981] relative" : "border-[#e2e8f0]"
              } flex flex-col h-full`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-[#10b981] text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-[#1f2937] mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-[#1f2937]">{plan.price}</span>
                  {plan.period && <span className="text-[#64748b]"> {plan.period}</span>}
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-[#10b981] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-[#64748b] text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                <SignedOut>
                  <SignInButton>
                    <button className="w-full bg-[#3b82f6] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#2563eb] transition-colors">
                      Sign Up to Get Started
                    </button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  {plan.planType === 'enterprise' ? (
                    <Link href="/contact">
                      <button className="w-full bg-[#1e40af] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#1d4ed8] transition-colors">
                        Contact Sales
                      </button>
                    </Link>
                  ) : (
                    <div className="w-full">
                      {plan.planType === 'payg' ? (
                        <button 
                          className="w-full bg-[#10b981] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#059669] transition-colors"
                          onClick={async () => {
                            // For PAYG, create PayPal order for initial charge
                            window.location.href = `/dashboard?setup=payg&charge=${pricing.initial_payg_charge}`;
                          }}
                        >
                          Pay ${pricing.initial_payg_charge} to Activate
                        </button>
                      ) : plan.paypalPlanId.startsWith('P-') && !plan.paypalPlanId.includes('PLAN-ID') ? (
                        <PayPalScriptProvider options={paypalOptions}>
                          <PayPalButton planId={plan.paypalPlanId} planName={plan.name} />
                        </PayPalScriptProvider>
                      ) : (
                        <button 
                          className="w-full bg-[#3b82f6] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#2563eb] transition-colors"
                          onClick={() => {
                            // TODO: Replace with actual PayPal plan creation
                            alert(`${plan.name} subscription coming soon! Please contact support to set up your plan.`);
                          }}
                        >
                          Subscribe to {plan.name}
                        </button>
                      )}
                    </div>
                  )}
                </SignedIn>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <div className="bg-white rounded-lg shadow-lg border border-[#e2e8f0] p-8 max-w-4xl mx-auto mb-8">
            <h3 className="text-2xl font-bold text-[#1f2937] mb-4">How It Works</h3>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="bg-[#dbeafe] rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-[#3b82f6]">1</span>
                </div>
                <h4 className="text-lg font-semibold text-[#1f2937] mb-2">Start with ${pricing.initial_payg_charge}</h4>
                <p className="text-[#64748b] text-sm">${pricing.assistant_base_cost} for your first assistant + ${pricing.payg_initial_credits} in calling credits</p>
              </div>
              <div>
                <div className="bg-[#dcfce7] rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-[#10b981]">2</span>
                </div>
                <h4 className="text-lg font-semibold text-[#1f2937] mb-2">Make Calls</h4>
                <p className="text-[#64748b] text-sm">Pay ${pricing.cost_per_minute_payg} per minute as you call your leads</p>
              </div>
              <div>
                <div className="bg-[#f3e8ff] rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-[#8b5cf6]">3</span>
                </div>
                <h4 className="text-lg font-semibold text-[#1f2937] mb-2">Scale Up</h4>
                <p className="text-[#64748b] text-sm">Add more assistants (${pricing.assistant_base_cost} each) and top-up credits as needed</p>
              </div>
            </div>
          </div>
          
          <p className="text-[#64748b] mb-4">
            Need enterprise solutions? <Link href="/contact" className="text-[#3b82f6] hover:text-[#2563eb]">Contact us</Link> for custom pricing and features.
          </p>
          <p className="text-sm text-[#64748b]">
            No monthly fees. No contracts. No hidden charges. Pay only for what you use.
          </p>
        </div>
      </main>
    </div>
  );
}