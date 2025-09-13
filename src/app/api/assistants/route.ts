import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongodb';
import Assistant from '@/models/Assistant';
import PhoneProvider from '@/models/PhoneProvider';
import { tenantVapiService } from '@/lib/tenantVapi';
import { usageValidator } from '@/lib/usageValidator';
import { logger } from '@/lib/logger';
import { ensureUserExists } from '@/lib/userRegistration';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    // Ensure user exists in database (fallback mechanism)
    await ensureUserExists(userId);

    const assistants = await Assistant.find({ userId })
      .populate('phoneNumbers.phoneProviderId', 'displayName phoneNumber')
      .sort({ createdAt: -1 });

    return NextResponse.json({ assistants });
  } catch (error) {
    logger.error('GET_ASSISTANTS_ERROR', 'Failed to fetch assistants', {
      error
    });
    return NextResponse.json(
      { error: 'Failed to fetch assistants' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { name, voice, mainPrompt, language, phoneNumbers, firstMessage } = data;

    if (!name || !voice || !mainPrompt || !language) {
      return NextResponse.json(
        { error: 'Missing required fields: name, voice, mainPrompt, language' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    
    // Ensure user exists in database (fallback mechanism)
    await ensureUserExists(userId);

    // CRITICAL: Check assistant limits before creation
    const canCreate = await usageValidator.canCreateAssistant(userId);
    if (!canCreate.canCreate) {
      const upgradeOptions = await usageValidator.getUpgradeOptions(userId);
      return NextResponse.json({
        error: canCreate.reason,
        upgradeRequired: true,
        upgradeOptions
      }, { status: 403 });
    }

    // Check for duplicate assistant name
    const existingAssistant = await Assistant.findOne({ userId, name });
    if (existingAssistant) {
      return NextResponse.json(
        { error: 'Assistant name already exists' },
        { status: 400 }
      );
    }

    logger.info('ASSISTANT_CREATE_START', `Creating assistant: ${name}`, {
      userId,
      data: { name, language, voice: voice.gender }
    });

    // Create assistant on Vapi first
    const vapiConfig = {
      name,
      voice,
      mainPrompt,
      language,
      firstMessage: firstMessage || "Hello! How can I help you today?"
    };

    const vapiAssistant = await tenantVapiService.createAssistant(vapiConfig);

    // Create local assistant record (no phone numbers - they're handled separately)
    const assistant = new Assistant({
      userId,
      name,
      vapiAssistantId: vapiAssistant.id,
      voice,
      mainPrompt,
      language,
      phoneNumbers: [], // Always empty - assistants are independent of phone numbers
      isActive: true
    });

    await assistant.save();

    // Deduct credits/update usage after successful creation
    const Subscription = require('@/models/Subscription').default;
    const subscription = await Subscription.findOne({ userId, isActive: true });
    if (subscription) {
      const affordability = subscription.canAffordAssistant();
      if (affordability.useCredits && subscription.creditBalance >= 20) {
        // Deduct credits
        const oldBalance = subscription.creditBalance;
        subscription.creditBalance -= 20;
        
        // Create credit transaction record for Recent Activity
        try {
          const Credit = require('@/models/Credit').default;
          await Credit.createAssistantPurchase(
            userId,
            assistant._id,
            name,
            oldBalance
          );
        } catch (creditError) {
          logger.error('CREDIT_LOG_ERROR', 'Failed to log assistant purchase transaction', { creditError });
        }
        
        logger.info('ASSISTANT_PAYMENT_DEDUCTED', 'Credits deducted for assistant creation', {
          userId,
          assistantId: assistant._id.toString(),
          amountDeducted: 20,
          remainingBalance: subscription.creditBalance
        });
      }
      // Always increment assistant count
      subscription.assistantsCreated = (subscription.assistantsCreated || 0) + 1;
      await subscription.save();
    }

    logger.info('ASSISTANT_CREATE_SUCCESS', `Assistant created successfully: ${name}`, {
      userId,
      data: { 
        assistantId: assistant._id.toString(),
        vapiAssistantId: vapiAssistant.id,
        name 
      }
    });

    return NextResponse.json({
      success: true,
      assistant: await assistant.populate('phoneNumbers.phoneProviderId', 'displayName phoneNumber')
    });

  } catch (error) {
    logger.error('ASSISTANT_CREATE_ERROR', 'Failed to create assistant', {
      error,
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to create assistant',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}