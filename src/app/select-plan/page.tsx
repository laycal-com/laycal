import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { connectToDatabase } from '@/lib/mongodb';
import Subscription from '@/models/Subscription';
import { PlanSelection } from '@/components/PlanSelection';

export default async function SelectPlanPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  await connectToDatabase();
  
  // Check if user already has an active plan
  const subscription = await Subscription.findOne({ userId }).lean();
  
  if (subscription && subscription.planType !== 'none') {
    // User already has a plan, redirect to dashboard
    redirect('/dashboard');
  }

  return <PlanSelection />;
}