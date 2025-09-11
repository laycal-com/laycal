import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongodb';
import Assistant from '@/models/Assistant';
import PhoneProvider from '@/models/PhoneProvider';
import Lead from '@/models/Lead';
import { tenantVapiService } from '@/lib/tenantVapi';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();

    const assistant = await Assistant.findOne({ _id: id, userId })
      .populate('phoneNumbers.phoneProviderId', 'displayName phoneNumber');

    if (!assistant) {
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
    }

    return NextResponse.json({ assistant });
  } catch (error) {
    const { id } = await params;
    logger.error('GET_ASSISTANT_ERROR', 'Failed to fetch assistant', {
      error,
      data: { assistantId: id }
    });
    return NextResponse.json(
      { error: 'Failed to fetch assistant' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();
    const { name, voice, mainPrompt, language, phoneNumbers, firstMessage } = data;

    await connectToDatabase();

    const assistant = await Assistant.findOne({ _id: id, userId });
    if (!assistant) {
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
    }

    // Validate phone providers if they changed
    if (phoneNumbers && phoneNumbers.length > 0) {
      const phoneProviderIds = phoneNumbers.map((pn: any) => pn.phoneProviderId);
      const providers = await PhoneProvider.find({
        _id: { $in: phoneProviderIds },
        userId
      });

      if (providers.length !== phoneProviderIds.length) {
        return NextResponse.json(
          { error: 'One or more phone providers not found or unauthorized' },
          { status: 400 }
        );
      }
    }

    // Check for duplicate name (excluding current assistant)
    if (name && name !== assistant.name) {
      const existingAssistant = await Assistant.findOne({ 
        userId, 
        name, 
        _id: { $ne: id } 
      });
      if (existingAssistant) {
        return NextResponse.json(
          { error: 'Assistant name already exists' },
          { status: 400 }
        );
      }
    }

    logger.info('ASSISTANT_UPDATE_START', `Updating assistant: ${assistant.name}`, {
      userId,
      data: { assistantId: id, name }
    });

    // Update assistant on Vapi
    const vapiConfig = {
      name: name || assistant.name,
      voice: voice || assistant.voice,
      mainPrompt: mainPrompt || assistant.mainPrompt,
      language: language || assistant.language,
      firstMessage: firstMessage || "Hello! How can I help you today?"
    };

    await tenantVapiService.updateAssistant(assistant.vapiAssistantId, vapiConfig);

    // Update local assistant record
    const updateData: any = {};
    if (name) updateData.name = name;
    if (voice) updateData.voice = voice;
    if (mainPrompt) updateData.mainPrompt = mainPrompt;
    if (language) updateData.language = language;
    if (phoneNumbers && phoneNumbers.length > 0) {
      updateData.phoneNumbers = phoneNumbers.map((pn: any, index: number) => ({
        phoneNumber: pn.phoneNumber,
        phoneProviderId: pn.phoneProviderId,
        isPrimary: index === 0
      }));
    }

    const updatedAssistant = await Assistant.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('phoneNumbers.phoneProviderId', 'displayName phoneNumber');

    logger.info('ASSISTANT_UPDATE_SUCCESS', `Assistant updated successfully: ${updatedAssistant?.name}`, {
      userId,
      data: { assistantId: id, name: updatedAssistant?.name }
    });

    return NextResponse.json({
      success: true,
      assistant: updatedAssistant
    });

  } catch (error) {
    const { id } = await params;
    logger.error('ASSISTANT_UPDATE_ERROR', 'Failed to update assistant', {
      error,
      data: { assistantId: id }
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to update assistant',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();

    const assistant = await Assistant.findOne({ _id: id, userId });
    if (!assistant) {
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
    }

    // Check if assistant is being used by any leads
    const leadsCount = await Lead.countDocuments({ 
      userId, 
      assignedAssistantId: id,
      status: { $in: ['pending', 'calling'] }
    });

    if (leadsCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete assistant. ${leadsCount} leads are currently using this assistant.` },
        { status: 400 }
      );
    }

    logger.info('ASSISTANT_DELETE_START', `Deleting assistant: ${assistant.name}`, {
      userId,
      data: { assistantId: id, vapiAssistantId: assistant.vapiAssistantId }
    });

    // Delete assistant from Vapi
    await tenantVapiService.deleteAssistant(assistant.vapiAssistantId);

    // Delete local assistant record
    await Assistant.findByIdAndDelete(id);

    logger.info('ASSISTANT_DELETE_SUCCESS', `Assistant deleted successfully: ${assistant.name}`, {
      userId,
      data: { assistantId: id }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    const { id } = await params;
    logger.error('ASSISTANT_DELETE_ERROR', 'Failed to delete assistant', {
      error,
      data: { assistantId: id }
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to delete assistant',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}