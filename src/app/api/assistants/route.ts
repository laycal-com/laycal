import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongodb';
import Assistant from '@/models/Assistant';
import { buildCalendarTools } from '@/lib/speedToLead/tools';
import { SPEED_TO_LEAD_SCHEMA, SPEED_TO_LEAD_SUMMARY_PROMPT } from '@/lib/speedToLead/tools';
import PhoneProvider from '@/models/PhoneProvider';
import { tenantVapiService } from '@/lib/tenantVapi';
import { usageValidator } from '@/lib/usageValidator';
import { logger } from '@/lib/logger';
import { chargeAssistant } from '@/lib/billing';
import { getAccountAuth } from '@/lib/account';
import { PricingService } from '@/lib/pricing';

export async function GET() {
  try {
    const { accountId } = await getAccountAuth();
    if (!accountId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const assistants = await Assistant.find({ accountId })
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
    const { accountId } = await getAccountAuth();
    if (!accountId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { name, voice, mainPrompt, language, phoneNumbers, firstMessage, summary, structuredData, serviceConfig } = data;

    if (!name || !voice || !mainPrompt || !language) {
      return NextResponse.json(
        { error: 'Missing required fields: name, voice, mainPrompt, language' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // The first assistant is free; each one after it has a one-time fee paid from credits.
    const canCreate = await usageValidator.canCreateAssistant(accountId);
    if (!canCreate.canCreate) {
      return NextResponse.json({ error: canCreate.reason, fee: canCreate.fee, needsCredits: true }, { status: 402 });
    }

    // Check for duplicate assistant name
    const existingAssistant = await Assistant.findOne({ accountId, name });
    if (existingAssistant) {
      return NextResponse.json(
        { error: 'Assistant name already exists' },
        { status: 400 }
      );
    }

    logger.info('ASSISTANT_CREATE_START', `Creating assistant: ${name}`, {
      accountId,
      data: { name, language, voice: voice.gender }
    });

    // The calendar tool URLs embed this assistant's Mongo id, but Vapi is
    // created before the local record exists — so mint the id up front and use
    // the same one for both.
    const assistantObjectId = new mongoose.Types.ObjectId();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.laycal.com';

    // Speed-to-lead assistants get live calendar tools; assistants created the
    // old way keep exactly the shape they had.
    const tools = serviceConfig
      ? buildCalendarTools(assistantObjectId.toString(), appUrl)
      : undefined;

    // Create assistant on Vapi first
    const vapiConfig = {
      name,
      voice,
      mainPrompt,
      language,
      firstMessage: firstMessage || "Hello",
      // A speed-to-lead assistant gets the dispatcher-oriented summary; only
      // legacy cold-calling assistants fall back to the generic note-taker.
      summaryPrompt:
        summary ||
        (serviceConfig
          ? SPEED_TO_LEAD_SUMMARY_PROMPT
          : 'You are an expert note-taker. You will be given a transcript of a call. Summarize the call in 2-3 sentences, highlighting key points and outcomes.'),
      structuredDataPrompt:
        structuredData ||
        (serviceConfig
          ? 'Extract the speed-to-lead service call fields from this conversation.'
          : undefined),
      ...(serviceConfig && { structuredDataSchema: SPEED_TO_LEAD_SCHEMA }),
      ...(tools && { tools })
    };

    const vapiAssistant = await tenantVapiService.createAssistant(vapiConfig);

    // Create local assistant record (no phone numbers - they're handled separately)
    const assistant = new Assistant({
      _id: assistantObjectId,
      accountId,
      name,
      vapiAssistantId: vapiAssistant.id,
      voice,
      mainPrompt,
      language,
      ...(serviceConfig && { serviceConfig }),
      phoneNumbers: [], // Always empty - assistants are independent of phone numbers
      isActive: true
    });

    await assistant.save();

    // Count it and charge the fee, if any. A failure here must not undo a working assistant.
    try {
      await chargeAssistant({ accountId, assistantId: assistant._id.toString(), name });
    } catch (billingError) {
      logger.error('ASSISTANT_FEE_ERROR', 'Failed to charge the assistant fee', {
        accountId,
        data: { assistantId: assistant._id.toString() },
        error: billingError,
      });
    }

    logger.info('ASSISTANT_CREATE_SUCCESS', `Assistant created successfully: ${name}`, {
      accountId,
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