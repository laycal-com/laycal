import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">SaaS Template</h1>
        <div className="flex items-center gap-4">
          <SignedOut>
            <SignInButton>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
              Dashboard
            </Link>
            <Link href="/leads" className="text-green-600 hover:text-green-800">
              Leads
            </Link>
            <UserButton />
          </SignedIn>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-5xl font-bold text-gray-900 mb-6">
          Build Your SaaS Faster
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          A complete Next.js template with authentication, payments, and everything you need to launch your SaaS product.
        </p>
        
        <div className="flex gap-4 justify-center mb-16">
          <SignedOut>
            <SignInButton>
              <button className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors">
                Get Started
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard" className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors">
              Go to Dashboard
            </Link>
          </SignedIn>
          <Link href="/pricing" className="border border-blue-600 text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors">
            View Pricing
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3 text-gray-800">Authentication</h3>
            <p className="text-gray-600">Secure authentication with Clerk including social logins and user management.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3 text-gray-800">Subscriptions</h3>
            <p className="text-gray-600">Integrated PayPal subscription billing with automatic renewals and management.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3 text-gray-800">Modern Stack</h3>
            <p className="text-gray-600">Built with Next.js 15, TypeScript, and Tailwind CSS for optimal performance.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
