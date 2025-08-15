import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongodb';
import Lead from '@/models/Lead';
import { processCsvBuffer } from '@/lib/csvProcessor';
import { vapiService } from '@/lib/vapi';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      logger.warn('CSV_UPLOAD_UNAUTHORIZED', 'Unauthorized CSV upload attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to database
    await connectToDatabase();

    // Get the uploaded file
    const data = await request.formData();
    const file = data.get('file') as File;

    if (!file) {
      logger.warn('CSV_UPLOAD_NO_FILE', 'No file provided in upload request', { userId });
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Log upload start
    logger.csvUpload.start(userId, file.name, file.size);

    // Check file type
    if (!file.name.endsWith('.csv')) {
      logger.warn('CSV_UPLOAD_INVALID_TYPE', `Invalid file type: ${file.name}`, { userId });
      return NextResponse.json({ error: 'Only CSV files are allowed' }, { status: 400 });
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      logger.warn('CSV_UPLOAD_FILE_TOO_LARGE', `File too large: ${file.size} bytes`, { userId });
      return NextResponse.json({ error: 'File size too large. Maximum 5MB allowed.' }, { status: 400 });
    }

    // Convert file to buffer
    logger.debug('CSV_BUFFER_CONVERSION', 'Converting file to buffer', { userId });
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Process CSV
    logger.csvUpload.processing(userId, 0); // Will update with actual count
    const csvResult = await processCsvBuffer(buffer);
    
    logger.csvUpload.validation(userId, csvResult.validRows, csvResult.totalRows, csvResult.errors);

    if (csvResult.leads.length === 0) {
      logger.csvUpload.error(userId, new Error('No valid leads found'), file.name);
      return NextResponse.json({
        error: 'No valid leads found in CSV',
        details: csvResult.errors
      }, { status: 400 });
    }

    // Save leads to database
    logger.info('LEAD_BATCH_START', `Starting to process ${csvResult.leads.length} leads`, { userId });
    const savedLeads = [];
    const vapiErrors = [];

    for (const leadData of csvResult.leads) {
      try {
        // Create lead in database
        logger.leadCreation.start(userId, leadData);
        
        const lead = new Lead({
          userId,
          name: leadData.name,
          phoneNumber: leadData.phoneNumber,
          email: leadData.email,
          company: leadData.company,
          notes: leadData.notes,
          status: 'pending'
        });

        await lead.save();
        savedLeads.push(lead);
        
        logger.leadCreation.success(userId, lead._id.toString(), leadData.name);

        // Initiate Vapi call
        try {
          logger.vapiCall.initiate(userId, lead._id.toString(), leadData.phoneNumber);
          
          const vapiResponse = await vapiService.initiateCall({
            phoneNumber: leadData.phoneNumber,
            customer: {
              name: leadData.name,
              email: leadData.email,
            },
            metadata: {
              leadId: lead._id.toString(),
              userId: userId,
              company: leadData.company, // Move company to metadata
            }
          });

          // Update lead with Vapi call ID
          lead.vapiCallId = vapiResponse.id;
          lead.status = 'calling';
          lead.calledAt = new Date();
          await lead.save();

          logger.vapiCall.success(userId, lead._id.toString(), vapiResponse.id, leadData.phoneNumber);

        } catch (vapiError) {
          logger.vapiCall.error(userId, lead._id.toString(), vapiError, leadData.phoneNumber);
          vapiErrors.push({
            leadName: leadData.name,
            error: vapiError instanceof Error ? vapiError.message : 'Unknown Vapi error'
          });
          
          // Keep lead as pending if Vapi call fails
          lead.status = 'failed';
          await lead.save();
        }
      } catch (dbError) {
        logger.leadCreation.error(userId, dbError, leadData.name);
        vapiErrors.push({
          leadName: leadData.name,
          error: dbError instanceof Error ? dbError.message : 'Database error'
        });
      }
    }

    logger.csvUpload.complete(userId, savedLeads.length, vapiErrors);

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${savedLeads.length} leads`,
      data: {
        totalProcessed: csvResult.totalRows,
        validLeads: csvResult.validRows,
        savedLeads: savedLeads.length,
        csvErrors: csvResult.errors,
        vapiErrors: vapiErrors,
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
    const { userId } = await auth();
    logger.error('CSV_UPLOAD_CRITICAL_ERROR', 'Critical error in CSV upload process', {
      userId: userId || 'unknown',
      error
    });
    return NextResponse.json({
      error: 'Failed to process upload',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}