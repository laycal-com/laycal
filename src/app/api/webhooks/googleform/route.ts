import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Lead from '@/models/Lead';
import Assistant from '@/models/Assistant';
import { TenantVapiService } from '@/lib/tenantVapi';
import { logger } from '@/lib/logger';
import { validatePhoneNumber, normalizePhoneNumber } from '@/lib/csvProcessor';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const { 
      email, 
      phone, 
      firstname, 
      lastname, 
      company,
      about,
      assistantId, 
      userId 
    } = body;

    logger.info('GOOGLEFORM_WEBHOOK_RECEIVED', 'Google Form webhook data received', {
      data: { userId, assistantId, phone, firstname, lastname }
    });

    if (!userId || !assistantId) {
      logger.error('GOOGLEFORM_WEBHOOK_ERROR', 'Missing userId or assistantId', {
        data: { userId, assistantId }
      });
      return NextResponse.json(
        { error: 'userId and assistantId are required' },
        { status: 400 }
      );
    }

    if (!firstname || !lastname || !phone) {
      logger.error('GOOGLEFORM_WEBHOOK_ERROR', 'Missing required fields', {
        data: { firstname, lastname, phone }
      });
      return NextResponse.json(
        { error: 'firstname, lastname, and phone are required' },
        { status: 400 }
      );
    }

    if (!validatePhoneNumber(phone)) {
      logger.error('GOOGLEFORM_WEBHOOK_ERROR', 'Invalid phone number format', {
        data: { phone }
      });
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const assistant = await Assistant.findOne({ 
      _id: assistantId, 
      userId: userId,
      isActive: true 
    });

    if (!assistant) {
      logger.error('GOOGLEFORM_WEBHOOK_ERROR', 'Assistant not found or inactive', {
        data: { assistantId, userId }
      });
      return NextResponse.json(
        { error: 'Assistant not found or inactive' },
        { status: 404 }
      );
    }

    const normalizedPhone = normalizePhoneNumber(phone);
    const fullName = `${firstname} ${lastname}`.trim();

    const lead = new Lead({
      ...{...body, userId: null, assistantId: null},
      status: 'calling',
      assignedAssistantId: assistantId
    });

    await lead.save();

    logger.info('GOOGLEFORM_LEAD_CREATED', 'Lead created from Google Form', {
      data: { 
        leadId: lead._id.toString(), 
        userId, 
        assistantId, 
        phone: normalizedPhone,
        name: fullName
      }
    });

    let vapiCallResponse;
    let retryCount = 0;
    const maxRetries = 3;
    let lastError: Error | null = null;

    while (retryCount < maxRetries) {
      try {
        const vapiService = new TenantVapiService();
        
        vapiCallResponse = await vapiService.initiateCall({
          userId,
          phoneNumber: normalizedPhone,
          assistantId: assistant.vapiAssistantId,
          customer: {
            ...{...body, userId: null, assistantId: null}
          },
          metadata: {
            leadId: lead._id.toString(),
            source: 'googleform',
            company: company || undefined,
            about: about || undefined,
            timestamp: new Date().toISOString()
          }
        });

        lead.vapiCallId = vapiCallResponse.id;
        lead.calledAt = new Date();
        await lead.save();

        assistant.lastUsed = new Date();
        await assistant.save();

        logger.info('GOOGLEFORM_CALL_INITIATED', 'Call initiated successfully', {
          data: { 
            leadId: lead._id.toString(),
            vapiCallId: vapiCallResponse.id,
            phone: normalizedPhone,
            retryCount
          }
        });

        return NextResponse.json({
          success: true,
          leadId: lead._id.toString(),
          callId: vapiCallResponse.id,
          message: 'Lead created and call initiated successfully'
        }, { status: 200 });

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        retryCount++;

        logger.error('GOOGLEFORM_CALL_ERROR', `Call initiation failed (attempt ${retryCount}/${maxRetries})`, {
          error: lastError,
          data: { 
            leadId: lead._id.toString(),
            phone: normalizedPhone,
            retryCount
          }
        });

        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
        }
      }
    }

    lead.status = 'failed';
    await lead.save();

    logger.error('GOOGLEFORM_CALL_FAILED', 'All retry attempts failed', {
      error: lastError,
      data: { 
        leadId: lead._id.toString(),
        phone: normalizedPhone,
        totalRetries: maxRetries
      }
    });

    return NextResponse.json({
      success: false,
      leadId: lead._id.toString(),
      error: 'Failed to initiate call after multiple retries',
      details: lastError?.message
    }, { status: 500 });

  } catch (error) {
    logger.error('GOOGLEFORM_WEBHOOK_ERROR', 'Webhook processing failed', {
      error: error instanceof Error ? error : new Error('Unknown error')
    });

    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
