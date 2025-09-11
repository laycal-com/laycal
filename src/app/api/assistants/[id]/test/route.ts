import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongodb';
import Assistant from '@/models/Assistant';
import PhoneProvider from '@/models/PhoneProvider';
import { tenantVapiService } from '@/lib/tenantVapi';
import { logger } from '@/lib/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { phoneNumber } = await request.json();
    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required for testing' },
        { status: 400 }
      );
    }

    const { id } = await params;

    await connectToDatabase();

    const assistant = await Assistant.findOne({ _id: id, userId });
    if (!assistant) {
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
    }

    if (!assistant.isActive) {
      return NextResponse.json(
        { error: 'Assistant is not active' },
        { status: 400 }
      );
    }

    // Find available phone providers for this user (assistants are independent of phone numbers)
    const availableProviders = await PhoneProvider.find({ userId, isActive: true });
    if (availableProviders.length === 0) {
      return NextResponse.json(
        { error: 'No phone providers available for testing' },
        { status: 400 }
      );
    }

    // Use the first available phone provider for testing
    const selectedProvider = availableProviders[0];

    logger.info('ASSISTANT_TEST_START', `Testing assistant: ${assistant.name}`, {
      userId,
      data: { 
        assistantId: id,
        vapiAssistantId: assistant.vapiAssistantId,
        phoneNumber,
        phoneProviderId: selectedProvider._id,
        phoneProviderName: selectedProvider.displayName
      }
    });

    // Test the assistant with a call
    const callResult = await tenantVapiService.testAssistant(
      assistant.vapiAssistantId,
      phoneNumber,
      selectedProvider._id.toString()
    );

    // Update lastUsed timestamp
    assistant.lastUsed = new Date();
    await assistant.save();

    logger.info('ASSISTANT_TEST_SUCCESS', `Assistant test call initiated: ${assistant.name}`, {
      userId,
      data: { 
        assistantId: id,
        callId: callResult.id,
        phoneNumber
      }
    });

    return NextResponse.json({
      success: true,
      call: callResult,
      message: 'Test call initiated successfully'
    });

  } catch (error) {
    const { id: assistantId } = await params;
    logger.error('ASSISTANT_TEST_ERROR', 'Failed to test assistant', {
      error,
      data: { assistantId }
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to test assistant',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}