import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongodb';
import Assistant from '@/models/Assistant';
import PhoneProvider from '@/models/PhoneProvider';
import { tenantVapiService } from '@/lib/tenantVapi';
import { logger } from '@/lib/logger';
import { getPhoneProviderOrDefault, isUSPhoneNumber, getNoPhoneProviderErrorMessage } from '@/lib/defaultPhoneProvider';

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


    // Get phone provider (custom or default for US numbers)
    const providerResult = await getPhoneProviderOrDefault(userId, phoneNumber);
    
    if (!providerResult) {
      return NextResponse.json(
        { error: getNoPhoneProviderErrorMessage(phoneNumber) },
        { status: 400 }
      );
    }

    let logData = {
      assistantId: id,
      vapiAssistantId: assistant.vapiAssistantId,
      phoneNumber,
      isUsingDefaultProvider: providerResult.isDefault,
      vapiPhoneNumberId: providerResult.vapiPhoneNumberId
    };

    // Add custom provider info if not using default
    if (!providerResult.isDefault) {
      const customProvider = await PhoneProvider.findOne({ 
        userId, 
        vapiPhoneNumberId: providerResult.vapiPhoneNumberId 
      });
      if (customProvider) {
        logData = { 
          ...logData, 
          phoneProviderId: customProvider._id,
          phoneProviderName: customProvider.displayName 
        };
      }
    }

    logger.info('ASSISTANT_TEST_START', `Testing assistant: ${assistant.name}`, {
      userId,
      data: logData
    });

    // Validate that the Vapi assistant exists before making the call
    try {
      await tenantVapiService.getAssistant(assistant.vapiAssistantId);
    } catch (vapiError) {
      logger.error('ASSISTANT_TEST_VAPI_NOT_FOUND', `Vapi assistant not found: ${assistant.vapiAssistantId}`, {
        userId,
        data: { 
          assistantId: id,
          vapiAssistantId: assistant.vapiAssistantId,
          error: vapiError instanceof Error ? vapiError.message : 'Unknown error'
        }
      });
      
      return NextResponse.json(
        { 
          error: 'Assistant not found in Vapi',
          details: `The assistant "${assistant.name}" exists in your account but was not found in Vapi. This may happen if the assistant was deleted from Vapi or there was an error during creation. Please try recreating the assistant.`,
          vapiAssistantId: assistant.vapiAssistantId,
          needsRecreation: true
        },
        { status: 400 }
      );
    }

    // Make the test call using the new initiateCall method with better default provider support
    const callResult = await tenantVapiService.initiateCall({
      userId,
      phoneNumber,
      assistantId: assistant.vapiAssistantId,
      metadata: {
        isTest: true,
        assistantName: assistant.name,
        timestamp: new Date().toISOString()
      }
    });

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