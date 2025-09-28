import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Subscription from '@/models/Subscription';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    // Check if this is a middleware request
    const isMiddlewareCheck = request.headers.get('X-Middleware-Check') === 'true';
    
    if (isMiddlewareCheck) {
      // For middleware checks, get userId from Authorization header
      const authHeader = request.headers.get('Authorization');
      const userId = authHeader?.replace('Bearer ', '');
      
      if (!userId) {
        return NextResponse.json({ hasValidPlan: false });
      }
      
      await connectToDatabase();
      const subscription = await Subscription.findOne({ userId }).lean();
      
      const hasValidPlan = subscription && subscription.planType !== 'none';
      
      return NextResponse.json({ hasValidPlan });
    } else {
      // For regular API calls, use Clerk auth
      const { userId } = await auth();
      
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      await connectToDatabase();
      const subscription = await Subscription.findOne({ userId }).lean();
      
      const hasValidPlan = subscription && subscription.planType !== 'none';
      
      return NextResponse.json({ 
        hasValidPlan,
        subscription: subscription ? {
          planType: subscription.planType,
          planName: subscription.planName,
          isActive: subscription.isActive
        } : null
      });
    }
  } catch (error) {
    console.error('Subscription check error:', error);
    return NextResponse.json({ hasValidPlan: false });
  }
}