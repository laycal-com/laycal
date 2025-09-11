import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongodb';
import Subscription from '@/models/Subscription';
import Credit from '@/models/Credit';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Get subscription with credit balance
    const subscription = await Subscription.findOne({ userId, isActive: true }).lean();
    
    if (!subscription) {
      return NextResponse.json({
        balance: 0,
        planType: 'starter',
        needsTopup: false,
        minimumBalance: 5,
        recentTransactions: []
      });
    }

    // Get recent credit transactions
    const recentTransactions = await Credit.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('transactionType amount description createdAt');

    const formattedTransactions = recentTransactions.map(tx => ({
      type: tx.transactionType,
      amount: tx.amount,
      description: tx.description,
      date: tx.createdAt.toISOString()
    }));

    const response = {
      balance: subscription.creditBalance || 0,
      planType: subscription.planType,
      needsTopup: (subscription.creditBalance || 0) <= (subscription.minimumBalance || 5),
      minimumBalance: subscription.minimumBalance || 5,
      recentTransactions: formattedTransactions
    };
    
    return NextResponse.json(response);

  } catch (error) {
    console.error('Credits API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credit data' },
      { status: 500 }
    );
  }
}