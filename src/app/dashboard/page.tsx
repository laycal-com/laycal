import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Dashboard() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-blue-600 hover:text-blue-800">
              Home
            </Link>
            <UserButton />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to your dashboard!</h2>
          <p className="text-gray-600">Manage your subscription and track your API usage.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3 text-gray-800">Current Plan</h3>
            <p className="text-gray-600 mb-4">Your active subscription.</p>
            <div className="text-2xl font-bold text-blue-600 mb-1">Starter Plan</div>
            <p className="text-sm text-gray-500 mb-4">$1.99/month</p>
            <div className="space-x-2">
              <Link href="/pricing" className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-block text-sm">
                Manage Plan
              </Link>
              <Link href="/leads" className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors inline-block text-sm">
                View Leads
              </Link>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3 text-gray-800">Usage This Month</h3>
            <p className="text-gray-600 mb-4">Track your API usage.</p>
            <div className="text-2xl font-bold text-green-600">1,247</div>
            <p className="text-sm text-gray-500">API calls made</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3 text-gray-800">Account Settings</h3>
            <p className="text-gray-600 mb-4">Manage your profile and API keys.</p>
            <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
              View Settings
            </button>
          </div>
        </div>

        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-900">Subscription Started</p>
                <p className="text-sm text-gray-500">Starter Plan - $1.99/month</p>
              </div>
              <div className="text-sm text-gray-500">3 days ago</div>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-900">API Usage</p>
                <p className="text-sm text-gray-500">1,247 API calls made</p>
              </div>
              <div className="text-sm text-gray-500">Today</div>
            </div>
            <div className="text-center py-4">
              <p className="text-gray-500 text-sm">
                Your subscription renews on the 15th of each month.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}