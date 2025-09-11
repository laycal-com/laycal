import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { paypalService } from '@/lib/paypal';
import { connectToDatabase } from '@/lib/mongodb';
import { logger } from '@/lib/logger';
import PendingTransaction from '@/models/PendingTransaction';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, description, planType } = await request.json();

    // Validate amount
    if (!amount || amount < 5) {
      return NextResponse.json({ 
        error: 'Minimum charge is $5' 
      }, { status: 400 });
    }

    await connectToDatabase();

    // Create PayPal order
    const order = await paypalService.createOneTimePayment(
      {
        amount: parseFloat(amount),
        description: description || `Credit top-up: $${amount}`,
        currency: 'USD'
      },
      userId
    );

    // Store pending transaction in database
    const pendingTransaction = PendingTransaction.createPending(
      userId,
      order.id,
      parseFloat(amount),
      planType || 'credit-topup',
      description || `Credit top-up: $${amount}`
    );
    await pendingTransaction.save();

    console.log('Pending transaction created:', {
      orderId: order.id,
      amount: parseFloat(amount),
      planType: planType || 'credit-topup'
    });

    logger.info('PAYPAL_ORDER_CREATED', 'PayPal order created for credit top-up', {
      userId,
      data: {
        orderId: order.id,
        amount,
        planType
      }
    });

    // Return order with approval URL
    const approvalUrl = order.links?.find((link: any) => link.rel === 'approve')?.href;
    
    return NextResponse.json({
      success: true,
      orderId: order.id,
      approvalUrl
    });

  } catch (error) {
    console.error('PayPal order creation error:', error);
    logger.error('PAYPAL_ORDER_ERROR', 'Failed to create PayPal order', { 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to create payment order' 
      },
      { status: 500 }
    );
  }
}