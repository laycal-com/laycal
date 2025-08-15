"use client";

import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

const plans = [
  {
    name: "Starter Plan",
    price: "$1.99",
    period: "/month",
    features: [
      "Unlimited API calls",
      "Basic support",
      "Standard features",
      "Email notifications",
      "14-day free trial",
    ],
    paypalPlanId: "P-21A352697T6893050NCPHS6I",
    popular: true,
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
        alert(`Subscription successful! Subscription ID: ${data.subscriptionID}`);
      }}
      onError={(err) => {
        console.error("PayPal error:", err);
        alert("Subscription failed. Please try again.");
      }}
    />
  );
};

export default function Pricing() {
  const paypalOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "",
    vault: true,
    intent: "subscription",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-gray-800">
            SaaS Template
          </Link>
          <div className="flex items-center gap-4">
            <SignedIn>
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
                Dashboard
              </Link>
            </SignedIn>
            <Link href="/" className="text-gray-600 hover:text-gray-800">
              Home
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start with our affordable monthly plan and scale as you grow.
          </p>
        </div>

        <div className="flex justify-center max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white rounded-lg shadow-lg p-8 max-w-md ${
                plan.popular ? "ring-2 ring-blue-500 relative" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <svg
                      className="w-5 h-5 text-green-500 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                <SignedOut>
                  <SignInButton>
                    <button className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                      Sign Up to Subscribe
                    </button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <PayPalScriptProvider options={paypalOptions}>
                    <PayPalButton planId={plan.paypalPlanId} planName={plan.name} />
                  </PayPalScriptProvider>
                </SignedIn>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <p className="text-gray-600 mb-4">
            Need a custom plan? <Link href="/contact" className="text-blue-600 hover:text-blue-800">Contact us</Link> for enterprise solutions.
          </p>
          <p className="text-sm text-gray-500">
            Cancel anytime. No setup fees or hidden charges.
          </p>
        </div>
      </main>
    </div>
  );
}