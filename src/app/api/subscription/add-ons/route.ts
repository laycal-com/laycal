import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongodb';
import Subscription from '@/models/Subscription';
import { PricingService } from '@/lib/pricing';
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
      const overageRate = await PricingService.getOverageMinuteCost();
      cost = quantity * overageRate;
      description = `${quantity} extra calling minutes`;
      subscription.extraMinutes += quantity;
    } else { // assistants
      const assistantCost = await PricingService.getAssistantCost();
      cost = quantity * assistantCost;
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

    // Get dynamic pricing
    const overageRate = await PricingService.getOverageMinuteCost();
    const assistantCost = await PricingService.getAssistantCost();

    const addOnOptions = [
      {
        type: 'minutes',
        name: 'Extra Calling Minutes',
        price: overageRate,
        unit: 'per minute',
        description: 'Add more calling minutes to your plan',
        packages: [
          { quantity: 500, price: 500 * overageRate, savings: 0 },
          { quantity: 1000, price: Math.round(1000 * overageRate * 0.9), savings: Math.round(1000 * overageRate * 0.1) },
          { quantity: 2500, price: Math.round(2500 * overageRate * 0.8), savings: Math.round(2500 * overageRate * 0.2) },
          { quantity: 5000, price: Math.round(5000 * overageRate * 0.7), savings: Math.round(5000 * overageRate * 0.3) }
        ]
      },
      {
        type: 'assistants',
        name: 'Extra AI Assistants',
        price: assistantCost,
        unit: 'per assistant per month',
        description: 'Create more AI assistants for different campaigns',
        packages: [
          { quantity: 1, price: assistantCost, savings: 0 },
          { quantity: 3, price: Math.round(3 * assistantCost * 0.9), savings: Math.round(3 * assistantCost * 0.1) },
          { quantity: 5, price: Math.round(5 * assistantCost * 0.85), savings: Math.round(5 * assistantCost * 0.15) },
          { quantity: 10, price: Math.round(10 * assistantCost * 0.8), savings: Math.round(10 * assistantCost * 0.2) }
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