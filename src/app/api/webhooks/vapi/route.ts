import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Lead from '@/models/Lead';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  let payload: any = null;
  
  try {
    console.log('🔔 Webhook received at:', new Date().toISOString());
    
    // Connect to database
    await connectToDatabase();

    // Get the webhook payload
    payload = await request.json();
    
    // Extract call information from webhook
    // Support both new format and Vapi's actual format
    const eventType = payload.event || payload.type || payload.message?.type;
    const call = payload.call || payload.message?.call || { id: payload.callId };
    const message = payload.message;

    logger.webhook.received(eventType, call?.id);

    if (!call || !call.id) {
      logger.webhook.error(new Error('Missing call information'), eventType);
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Find the lead associated with this call
    // Try to find by metadata.leadId first, then by vapiCallId
    let lead;
    const leadId = payload.metadata?.leadId || call.metadata?.leadId;
    if (leadId) {
      lead = await Lead.findById(leadId);
    }
    
    if (!lead) {
      lead = await Lead.findOne({ vapiCallId: call.id });
    }

    if (!lead) {
      logger.webhook.leadNotFound(call.id);
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    logger.webhook.processing(eventType, call.id, lead._id.toString());

    // Handle different webhook types
    switch (eventType) {
      case 'end-of-call-report':
        logger.info('END_OF_CALL_REPORT', `End-of-call report received for lead: ${lead.name}`, {
          leadId: lead._id.toString(),
          vapiCallId: call.id,
          data: { 
            endedReason: message.endedReason,
            duration: message.durationSeconds,
            successEvaluation: message.analysis?.successEvaluation,
            hasSummary: !!message.summary
          }
        });

        // Convert successEvaluation to our evaluation format
        let evaluation = null;
        if (message.analysis?.successEvaluation === 'true') {
          evaluation = 'positive';
        } else if (message.analysis?.successEvaluation === 'false') {
          evaluation = 'negative';
        } else {
          evaluation = 'neutral';
        }

        // Update lead with end-of-call report data
        const reportResults = {
          answered: message.endedReason !== 'no-answer' && message.endedReason !== 'busy',
          duration: Math.round(message.durationSeconds || 0),
          summary: message.summary || message.analysis?.summary || null,
          transcript: message.transcript || null,
          evaluation: evaluation,
          endReason: message.endedReason || null,
          cost: message.cost || null,
        };

        // Determine final status based on the report
        let reportStatus = 'completed';
        if (message.endedReason === 'no-answer' || message.endedReason === 'busy' || message.endedReason === 'failed') {
          reportStatus = 'failed';
        }

        lead.status = reportStatus;
        lead.callResults = {
          ...lead.callResults,
          ...reportResults
        };
        await lead.save();

        logger.info('END_OF_CALL_REPORT_SAVED', `End-of-call report saved for lead: ${lead.name}`, {
          leadId: lead._id.toString(),
          vapiCallId: call.id,
          data: { 
            finalStatus: reportStatus,
            evaluation: evaluation,
            duration: reportResults.duration,
            endedReason: message.endedReason
          }
        });
        break;

      case 'status-update':
        logger.info('STATUS_UPDATE', `Status update received for lead: ${lead.name}`, {
          leadId: lead._id.toString(),
          vapiCallId: call.id,
          data: { 
            status: message.status,
            endedReason: message.endedReason
          }
        });

        // Update lead status based on the status update
        if (message.status === 'ended') {
          // Don't change to completed here, wait for end-of-call-report
          // Just log that the call ended
          lead.status = message.endedReason === 'assistant-ended-call' ? 'calling' : 'failed';
          await lead.save();
          
          logger.info('STATUS_UPDATE_PROCESSED', `Call ended for lead: ${lead.name}`, {
            leadId: lead._id.toString(),
            vapiCallId: call.id,
            data: { endedReason: message.endedReason }
          });
        }
        break;

      case 'call-start':
        logger.info('CALL_START', `Call started for lead: ${lead.name}`, {
          leadId: lead._id.toString(),
          vapiCallId: call.id,
          data: { leadName: lead.name, phoneNumber: lead.phoneNumber }
        });
        lead.status = 'calling';
        await lead.save();
        logger.webhook.leadUpdate(lead._id.toString(), 'calling', call.id);
        break;

      case 'call-end':
        logger.info('CALL_END', `Call ended for lead: ${lead.name}`, {
          leadId: lead._id.toString(),
          vapiCallId: call.id,
          data: { 
            leadName: lead.name, 
            endReason: call.endedReason, 
            duration: call.duration,
            status: call.status 
          }
        });
        
        // Extract call results
        const callResults = {
          answered: call.status === 'completed' || call.endedReason !== 'no-answer',
          duration: call.duration || 0,
          summary: call.summary || message?.summary || null,
          transcript: call.transcript || message?.transcript || null,
          endReason: call.endedReason || null,
          cost: call.cost || null,
        };

        // Determine final status
        let finalStatus = 'completed';
        if (call.endedReason === 'no-answer' || call.endedReason === 'busy' || call.endedReason === 'failed') {
          finalStatus = 'failed';
        }

        // Update lead with call results
        lead.status = finalStatus;
        lead.callResults = callResults;
        await lead.save();

        logger.webhook.leadUpdate(lead._id.toString(), finalStatus, call.id);
        logger.info('CALL_RESULTS_SAVED', `Saved call results for lead: ${lead.name}`, {
          leadId: lead._id.toString(),
          vapiCallId: call.id,
          data: callResults
        });
        break;

      case 'call-analysis':
        logger.info('CALL_ANALYSIS', `Call analysis received for lead: ${lead.name}`, {
          leadId: lead._id.toString(),
          vapiCallId: call.id,
          data: { hasAnalysis: !!(message?.analysis || call.analysis) }
        });
        
        // Update with analysis data if available
        if (message?.analysis || call.analysis) {
          const analysis = message?.analysis || call.analysis;
          
          if (lead.callResults) {
            lead.callResults.summary = analysis.summary || lead.callResults.summary;
            lead.callResults.transcript = analysis.transcript || lead.callResults.transcript;
          } else {
            lead.callResults = {
              answered: true,
              summary: analysis.summary || null,
              transcript: analysis.transcript || null,
            };
          }
          
          await lead.save();
          logger.info('ANALYSIS_UPDATED', `Updated analysis for lead: ${lead.name}`, {
            leadId: lead._id.toString(),
            vapiCallId: call.id,
            data: { hasSummary: !!analysis.summary, hasTranscript: !!analysis.transcript }
          });
        }
        break;

      case 'message':
        // Handle real-time messages during the call
        logger.debug('CALL_MESSAGE', `Message received during call`, {
          leadId: lead._id.toString(),
          vapiCallId: call.id,
          data: { messageType: message?.type, hasContent: !!message?.content }
        });
        break;

      default:
        logger.warn('UNKNOWN_WEBHOOK_TYPE', `Unknown webhook type: ${eventType}`, {
          leadId: lead._id.toString(),
          vapiCallId: call.id,
          data: { type: eventType, callStatus: call.status }
        });
    }

    return NextResponse.json({ success: true, message: 'Webhook processed successfully' });

  } catch (error) {
    logger.error('WEBHOOK_CRITICAL_ERROR', 'Critical error in webhook processing', {
      error,
      data: { hasPayload: !!payload }
    });
    return NextResponse.json({
      error: 'Failed to process webhook',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Handle GET requests for webhook verification
export async function GET(request: NextRequest) {
  // Some webhook services send verification requests
  const searchParams = request.nextUrl.searchParams;
  const challenge = searchParams.get('challenge');
  
  if (challenge) {
    return new Response(challenge, { status: 200 });
  }
  
  return NextResponse.json({ message: 'Vapi webhook endpoint is active' });
}