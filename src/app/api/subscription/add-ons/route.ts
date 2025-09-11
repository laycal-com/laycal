import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongodb';
import Subscription from '@/models/Subscription';
import { logger } from '@/lib/logger';

// POST - Purchase additional minutes or assistants
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, quantity, paypalPaymentId } = await request.json();

    // Validate input
    if (!type || !['minutes', 'assistants'].includes(type)) {
      return NextResponse.json({
        error: 'Invalid add-on type',
        validTypes: ['minutes', 'assistants']
      }, { status: 400 });
    }

    if (!quantity || quantity < 1) {
      return NextResponse.json({
        error: 'Invalid quantity',
        details: 'Quantity must be a positive number'
      }, { status: 400 });
    }

    await connectToDatabase();

    const subscription = await Subscription.findOne({ userId, isActive: true });
    if (!subscription) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    // Calculate cost
    let cost: number;
    let description: string;

    if (type === 'minutes') {
      cost = quantity * 0.05; // $0.05 per minute
      description = `${quantity} extra calling minutes`;
      subscription.extraMinutes += quantity;
    } else { // assistants
      cost = quantity * 20; // $20 per assistant per month
      description = `${quantity} extra AI assistant${quantity > 1 ? 's' : ''}`;
      subscription.extraAssistants += quantity;
    }

    await subscription.save();

    logger.info('ADDON_PURCHASED', 'Add-on purchased successfully', {
      userId,
      type,
      quantity,
      cost,
      paypalPaymentId,
      totalExtraMinutes: subscription.extraMinutes,
      totalExtraAssistants: subscription.extraAssistants
    });

    return NextResponse.json({
      success: true,
      message: 'Add-on purchased successfully',
      purchase: {
        type,
        quantity,
        cost,
        description,
        paypalPaymentId
      },
      subscription: {
        planType: subscription.planType,
        totalMinuteLimit: subscription.getTotalMinuteLimit(),
        totalAssistantLimit: subscription.getTotalAssistantLimit(),
        extraMinutes: subscription.extraMinutes,
        extraAssistants: subscription.extraAssistants
      }
    });

  } catch (error) {
    logger.error('ADDON_PURCHASE_ERROR', 'Failed to purchase add-on', {
      error
    });
    return NextResponse.json({
      error: 'Failed to purchase add-on',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET - Get add-on pricing and options
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const subscription = await Subscription.findOne({ userId, isActive: true });
    if (!subscription) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    const addOnOptions = [
      {
        type: 'minutes',
        name: 'Extra Calling Minutes',
        price: 0.05,
        unit: 'per minute',
        description: 'Add more calling minutes to your plan',
        packages: [
          { quantity: 500, price: 25, savings: 0 },
          { quantity: 1000, price: 45, savings: 5 },
          { quantity: 2500, price: 100, savings: 25 },
          { quantity: 5000, price: 180, savings: 70 }
        ]
      },
      {
        type: 'assistants',
        name: 'Extra AI Assistants',
        price: 20,
        unit: 'per assistant per month',
        description: 'Create more AI assistants for different campaigns',
        packages: [
          { quantity: 1, price: 20, savings: 0 },
          { quantity: 3, price: 55, savings: 5 },
          { quantity: 5, price: 85, savings: 15 },
          { quantity: 10, price: 160, savings: 40 }
        ]
      }
    ];

    return NextResponse.json({
      success: true,
      currentSubscription: {
        planType: subscription.planType,
        planName: subscription.planName,
        minuteLimit: subscription.getTotalMinuteLimit(),
        assistantLimit: subscription.getTotalAssistantLimit(),
        extraMinutes: subscription.extraMinutes,
        extraAssistants: subscription.extraAssistants
      },
      addOnOptions
    });

  } catch (error) {
    logger.error('ADDON_OPTIONS_ERROR', 'Failed to get add-on options', {
      error
    });
    return NextResponse.json({
      error: 'Failed to get add-on options',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}