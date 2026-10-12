import { NextRequest, NextResponse } from 'next/server';
import { getAccountAuth } from '@/lib/account';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongodb';
import Lead from '@/models/Lead';
import Assistant from '@/models/Assistant';
import { processCsvBuffer } from '@/lib/csvProcessor';
import { vapiService } from '@/lib/vapi';
import { tenantVapiService } from '@/lib/tenantVapi';
import PhoneProvider from '@/models/PhoneProvider';
import { getPhoneProviderOrDefault, getNoPhoneProviderErrorMessage, isUSPhoneNumber } from '@/lib/defaultPhoneProvider';
import { usageValidator } from '@/lib/usageValidator';
import { logger } from '@/lib/logger';
import { callOrHold, queueLead } from '@/lib/leadCalls';

/** Leads from one upload that are called before the request returns. */
const INLINE_CALLS = 5;

export async function POST(request: NextRequest) {
  try {
    const { accountId } = await getAccountAuth();

    if (!accountId) {
      logger.warn('CSV_UPLOAD_UNAUTHORIZED', 'Unauthorized CSV upload attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to database
    await connectToDatabase();

    // Get the uploaded file and assistant selection
    const data = await request.formData();
    const file = data.get('file') as File;
    const assistantId = data.get('assistantId') as string;

    if (!file) {
      logger.warn('CSV_UPLOAD_NO_FILE', 'No file provided in upload request', { accountId });
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!assistantId) {
      logger.warn('CSV_UPLOAD_NO_ASSISTANT', 'No assistant selected for upload', { accountId });
      return NextResponse.json({ error: 'Assistant selection is required' }, { status: 400 });
    }

    // Validate assistant belongs to user and is active
    const assistant = await Assistant.findOne({ 
      _id: assistantId, 
      accountId, 
      isActive: true 
    }).populate('phoneNumbers.phoneProviderId');

    if (!assistant) {
      logger.warn('CSV_UPLOAD_INVALID_ASSISTANT', 'Invalid or inactive assistant selected', { 
        accountId, 
        assistantId 
      });
      return NextResponse.json({ error: 'Invalid assistant selected' }, { status: 400 });
    }

    // Assistants no longer need phone numbers - they use available phone providers

    // Log upload start
    logger.csvUpload.start(accountId, file.name, file.size);

    // Check file type
    if (!file.name.endsWith('.csv')) {
      logger.warn('CSV_UPLOAD_INVALID_TYPE', `Invalid file type: ${file.name}`, { accountId });
      return NextResponse.json({ error: 'Only CSV files are allowed' }, { status: 400 });
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      logger.warn('CSV_UPLOAD_FILE_TOO_LARGE', `File too large: ${file.size} bytes`, { accountId });
      return NextResponse.json({ error: 'File size too large. Maximum 5MB allowed.' }, { status: 400 });
    }

    // Convert file to buffer
    logger.debug('CSV_BUFFER_CONVERSION', 'Converting file to buffer', { accountId });
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Process CSV
    logger.csvUpload.processing(accountId, 0); // Will update with actual count
    const csvResult = await processCsvBuffer(buffer);
    
    logger.csvUpload.validation(accountId, csvResult.validRows, csvResult.totalRows, csvResult.errors);

    if (csvResult.leads.length === 0) {
      logger.csvUpload.error(accountId, new Error('No valid leads found'), file.name);
      return NextResponse.json({
        error: 'No valid leads found in CSV',
        details: csvResult.errors
      }, { status: 400 });
    }

    // Calls are prepaid: nothing is dialled without credit on the account.
    const canCall = await usageValidator.canMakeCall(accountId);
    if (!canCall.canCall) {
      return NextResponse.json({ error: canCall.reason, needsCredits: true }, { status: 402 });
    }

    // Save leads to database
    logger.info('LEAD_BATCH_START', `Starting to process ${csvResult.leads.length} leads with assistant ${assistant.name}`, { 
      accountId, 
      assistantId,
      totalLeads: csvResult.leads.length
    });
    const savedLeads = [];
    const vapiErrors = [];

    // Get user's available phone providers or use default for US numbers
    const availableProviders = await PhoneProvider.find({ accountId, isActive: true });
    
    // Check if we can process any calls (either user has providers or using default for US numbers)
    const hasUserProviders = availableProviders.length > 0;
    const canUseDefault = csvResult.leads.some(lead => isUSPhoneNumber(lead.phoneNumber));
    
    if (!hasUserProviders && !canUseDefault) {
      logger.error('CSV_UPLOAD_ERROR', 'No phone providers available for calls', { accountId, assistantId });
      return NextResponse.json({
        error: 'No phone providers available',
        details: 'Please configure at least one phone provider in Settings, or use US phone numbers (+1) which can use the default provider'
      }, { status: 400 });
    }
    
    // Round-robin through available providers if user has them
    let phoneIndex = 0;
    let calledInline = 0;

    for (const leadData of csvResult.leads) {
      try {
        // Determine phone provider for this lead
        let selectedProvider = null;
        let phoneProviderId = null;
        let assignedPhoneNumber = 'Default US Provider';
        
        if (hasUserProviders) {
          // Use user's providers in round-robin fashion
          selectedProvider = availableProviders[phoneIndex % availableProviders.length];
          phoneProviderId = selectedProvider._id.toString();
          assignedPhoneNumber = selectedProvider.phoneNumber;
          phoneIndex++;
        } else if (isUSPhoneNumber(leadData.phoneNumber)) {
          // Use default provider for US numbers
          const defaultProvider = await getPhoneProviderOrDefault(accountId, leadData.phoneNumber);
          if (!defaultProvider) {
            throw new Error('Default provider not available for US number');
          }
          phoneProviderId = null; // Special case for default provider
          assignedPhoneNumber = 'Default US Provider';
        } else {
          // Skip non-US numbers when no user providers available
          vapiErrors.push({
            leadName: leadData.name,
            error: `International number ${leadData.phoneNumber} requires custom phone provider setup`
          });
          continue;
        }

        // Create lead in database
        logger.leadCreation.start(accountId, leadData);
        
        const lead = new Lead({
          accountId,
          name: leadData.name,
          phoneNumber: leadData.phoneNumber,
          email: leadData.email,
          company: leadData.company,
          notes: leadData.notes,
          // The agent's script reads these, on the first call and on later tries.
          address: (leadData as any).address || null,
          details: leadData.notes || null,
          status: 'pending',
          source: 'upload',
          assignedAssistantId: assistant._id,
          assignedPhoneNumber: assignedPhoneNumber,
          // Later tries go out from the same number as the first.
          phoneProviderId: phoneProviderId
        });

        await lead.save();
        savedLeads.push(lead);
        
        logger.leadCreation.success(accountId, lead._id.toString(), leadData.name);

        // The first few are called now, so a small list starts ringing at once.
        // The rest wait for the wake-up, which works through them every minute:
        // dialling a long list inside this request would time out.
        try {
          const result =
            calledInline < INLINE_CALLS ? await callOrHold(lead, assistant) : await queueLead(lead, assistant);
          calledInline++;

          if (!result.ok) {
            vapiErrors.push({ leadName: leadData.name, error: result.message });
          }
          const fresh = await Lead.findById(lead._id).select('status vapiCallId').lean<any>();
          if (fresh) {
            lead.status = fresh.status;
            lead.vapiCallId = fresh.vapiCallId;
          }
        } catch (vapiError) {
          logger.vapiCall.error(accountId, lead._id.toString(), vapiError, leadData.phoneNumber);
          vapiErrors.push({
            leadName: leadData.name,
            error: vapiError instanceof Error ? vapiError.message : 'Unknown error'
          });
        }
      } catch (dbError) {
        logger.leadCreation.error(accountId, dbError, leadData.name);
        vapiErrors.push({
          leadName: leadData.name,
          error: dbError instanceof Error ? dbError.message : 'Database error'
        });
      }
    }

    // Update assistant's lastUsed timestamp if any leads were processed
    if (savedLeads.length > 0) {
      assistant.lastUsed = new Date();
      await assistant.save();
    }

    logger.csvUpload.complete(accountId, savedLeads.length, vapiErrors);

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${savedLeads.length} leads`,
      data: {
        totalProcessed: csvResult.totalRows,
        validLeads: csvResult.validRows,
        savedLeads: savedLeads.length,
        csvErrors: csvResult.errors,
        callErrors: vapiErrors,
        leads: savedLeads.map(lead => ({
          id: lead._id,
          name: lead.name,
          phoneNumber: lead.phoneNumber,
          status: lead.status,
          vapiCallId: lead.vapiCallId
        }))
      }
    });

  } catch (error) {
    const { accountId } = await getAccountAuth();
    logger.error('CSV_UPLOAD_CRITICAL_ERROR', 'Critical error in CSV upload process', {
      accountId: accountId || 'unknown',
      error
    });
    return NextResponse.json({
      error: 'Failed to process upload',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}