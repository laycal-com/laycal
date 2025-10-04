import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Lead from '@/models/Lead';
import Assistant from '@/models/Assistant';
import PendingAppointment from '@/models/PendingAppointment';
import CallSummary from '@/models/CallSummary';
import { usageValidator } from '@/lib/usageValidator';
import { logger } from '@/lib/logger';

// Official Vapi endedReason values that indicate the call was not answered
// Based on https://docs.vapi.ai/calls/call-ended-reason
const NOT_ANSWERED_REASONS = [
  'customer-busy',
  'customer-did-not-answer', 
  'voicemail',
  'twilio-failed-to-connect-call',
  'vonage-failed-to-connect-call',
  'manually-canceled',
  'customer-did-not-give-microphone-permission'
] as const;

export async function POST(request: NextRequest) {
  let payload: any = null;
  try {
    // Webhook received log is now handled by the logger below
    
    // Connect to database
    await connectToDatabase();

    // Get the webhook payload
    payload = await request.json();
    
    // Log the full webhook payload for debugging
    logger.info('WEBHOOK_PAYLOAD', 'Full webhook payload received', {
      data: { 
        fullPayload: payload,
        headers: Object.fromEntries(request.headers.entries()),
        timestamp: new Date().toISOString(),
        url: request.url
      }
    });
    
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
    // Try to find by metadata.leadId first, then by vapiCallId, then by phone number
    let lead;
    const leadId = payload.metadata?.leadId || call.metadata?.leadId;
    if (leadId) {
      lead = await Lead.findById(leadId).populate('assignedAssistantId');
    }
    
    if (!lead) {
      lead = await Lead.findOne({ vapiCallId: call.id }).populate('assignedAssistantId');
    }

    // If still no lead found, try to match by phone number for appointment processing
    if (!lead && call.phoneNumber) {
      lead = await Lead.findOne({ phoneNumber: call.phoneNumber }).populate('assignedAssistantId');
      if (lead) {
        logger.info('LEAD_MATCHED_BY_PHONE', 'Matched lead by phone number', {
          leadId: lead._id.toString(),
          phoneNumber: call.phoneNumber,
          vapiCallId: call.id
        });
      }
    }

    if (!lead) {
      logger.webhook.leadNotFound(call.id);
      
      // For appointment-only webhooks, we can still process if we have enough data
      // Check if this is an appointment webhook with appointment data
      if ((payload.appointment || message?.appointment) && eventType === 'end-of-call-report') {
        return await processStandaloneAppointment(payload, call, message);
      }
      
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
        // Call is answered only if it actually connected and had a conversation
        const reportResults = {
          answered: !NOT_ANSWERED_REASONS.includes(message.endedReason),
          duration: Math.round(message.durationSeconds || 0),
          summary: message.summary || message.analysis?.summary || null,
          transcript: message.transcript || null,
          evaluation: evaluation,
          endReason: message.endedReason || null,
          cost: message.cost || null,
        };

        // Determine final status based on the report
        let reportStatus = 'completed';
        if (NOT_ANSWERED_REASONS.includes(message.endedReason)) {
          reportStatus = 'failed';
        }

        lead.status = reportStatus;
        lead.callResults = {
          ...lead.callResults,
          ...reportResults
        };
        await lead.save();

        // CRITICAL: Track usage for billing
        await trackCallUsage(lead, message);

        // Update assistant lastUsed timestamp if assigned
        if (lead.assignedAssistantId) {
          await Assistant.findByIdAndUpdate(lead.assignedAssistantId, {
            lastUsed: new Date()
          });
        }

        logger.info('END_OF_CALL_REPORT_SAVED', `End-of-call report saved for lead: ${lead.name}`, {
          leadId: lead._id.toString(),
          vapiCallId: call.id,
          assistantId: lead.assignedAssistantId?.toString(),
          data: { 
            finalStatus: reportStatus,
            evaluation: evaluation,
            duration: reportResults.duration,
            endedReason: message.endedReason
          }
        });

        // Check for appointment confirmation in the call
        await processAppointmentFromCall(lead, call, message, payload);
        
        // Create call summary for data extraction and display
        await createCallSummary(call, message, lead, payload);
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
          answered: !NOT_ANSWERED_REASONS.includes(call.endedReason),
          duration: call.duration || 0,
          summary: call.summary || message?.summary || null,
          transcript: call.transcript || message?.transcript || null,
          endReason: call.endedReason || null,
          cost: call.cost || null,
        };

        // Determine final status
        let finalStatus = 'completed';
        if (NOT_ANSWERED_REASONS.includes(call.endedReason)) {
          finalStatus = 'failed';
        }

        // Update lead with call results
        lead.status = finalStatus;
        lead.callResults = callResults;
        await lead.save();

        // CRITICAL: Track usage for billing
        await trackCallUsage(lead, { durationSeconds: call.duration });

        logger.webhook.leadUpdate(lead._id.toString(), finalStatus, call.id);
        logger.info('CALL_RESULTS_SAVED', `Saved call results for lead: ${lead.name}`, {
          leadId: lead._id.toString(),
          vapiCallId: call.id,
          data: callResults
        });
        
        // Create call summary for data extraction and display
        await createCallSummary(call, message, lead, payload);
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

// Process appointment creation from call data
async function processAppointmentFromCall(lead: any, call: any, message: any, payload: any) {
  try {
    logger.info('APPOINTMENT_PROCESSING_START', 'Starting appointment processing', {
      leadId: lead._id.toString(),
      callId: call.id,
      data: {
        hasPayloadAppointment: !!payload.appointment,
        hasMessageAppointment: !!message?.appointment,
        hasMessage: !!message,
        messageKeys: message ? Object.keys(message) : [],
        payloadKeys: Object.keys(payload)
      }
    });

    // Check if the call was successful and contains appointment information
    let appointmentData = null;

    // Method 1: Check if appointment data is directly in the payload
    if (payload.appointment) {
      appointmentData = payload.appointment;
      logger.info('APPOINTMENT_DIRECT', 'Appointment data found directly in payload', {
        leadId: lead._id.toString(),
        data: { title: appointmentData.title }
      });
    }
    
    // Method 2: Check if appointment data is in the message
    else if (message.appointment) {
      appointmentData = message.appointment;
      logger.info('APPOINTMENT_MESSAGE', 'Appointment data found in message', {
        leadId: lead._id.toString(),
        data: { title: appointmentData.title }
      });
    }
    
    // Method 3: Check structured data for appointment information
    else if (message.analysis?.structuredData) {
      const structuredData = message.analysis.structuredData;
      logger.info('APPOINTMENT_STRUCTURED_DATA', 'Checking structured data for appointment', {
        leadId: lead._id.toString(),
        data: {
          structuredData: structuredData,
          hasEmail: !!structuredData.email,
          hasSlotBooked: !!structuredData.slot_booked
        }
      });

      // Check if structured data contains appointment time using slot_booked
      if (structuredData.slot_booked) {
        try {
          const appointmentTime = new Date(structuredData.slot_booked);
          if (!isNaN(appointmentTime.getTime())) {
            // Create appointment data from structured data
            appointmentData = {
              title: `Demo Appointment`,
              startTime: appointmentTime.toISOString(),
              endTime: new Date(appointmentTime.getTime() + 30 * 60 * 1000).toISOString(), // 30 minutes
              customer: {
                name: structuredData.name || lead.name,
                phone: structuredData.phoneNumber || lead.phoneNumber,
                email: structuredData.email || lead.email
              },
              notes: message.summary || 'Appointment scheduled during call'
            };

            logger.info('APPOINTMENT_FROM_STRUCTURED_DATA', 'Created appointment from structured data', {
              leadId: lead._id.toString(),
              data: {
                title: appointmentData.title,
                startTime: appointmentData.startTime,
                email: structuredData.email,
                slot_booked: structuredData.slot_booked
              }
            });
          }
        } catch (error) {
          logger.error('APPOINTMENT_STRUCTURED_DATA_ERROR', 'Failed to parse structured data slot_booked', {
            leadId: lead._id.toString(),
            error,
            data: { slot_booked: structuredData.slot_booked }
          });
        }
      }
    }

    // Method 4: Fallback to text extraction if no structured data
    if (!appointmentData && (message.summary || message.transcript)) {
      logger.info('APPOINTMENT_TEXT_EXTRACTION', 'Attempting to extract appointment from text as fallback', {
        leadId: lead._id.toString(),
        data: {
          hasSummary: !!message.summary,
          hasTranscript: !!message.transcript,
          summaryLength: message.summary ? message.summary.length : 0,
          transcriptLength: message.transcript ? message.transcript.length : 0,
          summaryPreview: message.summary ? message.summary.substring(0, 100) + '...' : null
        }
      });

      appointmentData = extractAppointmentFromText(
        message.summary || message.transcript,
        lead.name,
        lead.phoneNumber
      );
      
      if (appointmentData) {
        logger.info('APPOINTMENT_EXTRACTED', 'Appointment data extracted from call text', {
          leadId: lead._id.toString(),
          data: { title: appointmentData.title }
        });
      } else {
        logger.info('APPOINTMENT_NOT_EXTRACTED', 'No appointment data found in call text', {
          leadId: lead._id.toString()
        });
      }
    }

    // If we found appointment data, store it as pending confirmation
    if (appointmentData && appointmentData.startTime && appointmentData.endTime) {
      await storePendingAppointment(call, message, appointmentData, lead);

      // Update lead with appointment information
      if (lead.callResults) {
        lead.callResults.appointmentCreated = true;
        lead.callResults.appointmentTitle = appointmentData.title;
        lead.callResults.appointmentTime = appointmentData.startTime;
        await lead.save();
      }

      logger.info('APPOINTMENT_PROCESSING_SUCCESS', 'Appointment processing completed successfully', {
        leadId: lead._id.toString(),
        callId: call.id,
        data: { title: appointmentData.title }
      });
    } else {
      logger.info('APPOINTMENT_PROCESSING_NONE', 'No valid appointment data found - skipping appointment creation', {
        leadId: lead._id.toString(),
        callId: call.id,
        data: {
          hasAppointmentData: !!appointmentData,
          hasStartTime: appointmentData?.startTime,
          hasEndTime: appointmentData?.endTime
        }
      });
    }

  } catch (error) {
    logger.error('APPOINTMENT_PROCESSING_ERROR', 'Failed to process appointment from call', {
      leadId: lead._id.toString(),
      vapiCallId: call.id,
      error
    });
  }
}

// Extract appointment information from call text using simple pattern matching
function extractAppointmentFromText(text: string, customerName: string, customerPhone: string): any | null {
  try {
    const lowerText = text.toLowerCase();
    
    // Look for appointment-related keywords
    const appointmentKeywords = [
      'appointment', 'meeting', 'scheduled', 'booking', 'reserved',
      'visit', 'consultation', 'session', 'call back'
    ];
    
    const hasAppointmentKeyword = appointmentKeywords.some(keyword => 
      lowerText.includes(keyword)
    );
    
    if (!hasAppointmentKeyword) {
      return null;
    }

    // Try to extract date/time information
    // This is a simple implementation - you might want to use a more sophisticated
    // date/time parsing library like chrono-node for production use
    
    const dateTimePatterns = [
      // ISO format: 2025-08-15T14:00:00Z
      /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?)/gi,
      // Date and time: August 15, 2025 at 2:00 PM
      /((?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4})\s+(?:at\s+)?(\d{1,2}:\d{2}\s*(?:am|pm))/gi,
      // Simple format: 08/15/2025 14:00
      /(\d{1,2}\/\d{1,2}\/\d{4})\s+(\d{1,2}:\d{2})/gi
    ];

    let startTime = null;
    let endTime = null;

    for (const pattern of dateTimePatterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        try {
          // For ISO format, use directly
          if (matches[0].includes('T')) {
            startTime = matches[0];
            // Default to 30 minute appointment if no end time specified
            const start = new Date(startTime);
            const end = new Date(start.getTime() + 30 * 60 * 1000);
            endTime = end.toISOString();
            break;
          }
        } catch (e) {
          // Continue to next pattern if parsing fails
        }
      }
    }

    if (startTime && endTime) {
      return {
        title: `Appointment with ${customerName}`,
        startTime,
        endTime,
        customer: {
          name: customerName,
          phone: customerPhone
        },
        notes: text.substring(0, 200) + (text.length > 200 ? '...' : '')
      };
    }

    return null;
  } catch (error) {
    logger.error('APPOINTMENT_EXTRACTION_ERROR', 'Failed to extract appointment from text', {
      error,
      data: { textLength: text.length }
    });
    return null;
  }
}

// Store pending appointment for manual confirmation
async function storePendingAppointment(call: any, message: any, appointmentData: any, lead?: any) {
  try {
    // Extract customer information
    let customerName = appointmentData.customer?.name;
    let customerPhone = call.phoneNumber;
    let customerEmail = null;

    // PRIORITY 1: Extract email from call structured data (actual conversation)
    if (message?.analysis?.structuredData?.email) {
      customerEmail = message.analysis.structuredData.email;
    }

    // PRIORITY 2: Extract name from call structured data (actual conversation)
    if (message?.analysis?.structuredData?.name) {
      customerName = customerName || message.analysis.structuredData.name;
    }

    // Fallback to lead information from CSV if not captured during call
    if (lead) {
      customerName = customerName || lead.name;
      customerPhone = customerPhone || lead.phoneNumber;
      customerEmail = customerEmail || lead.email; // Only use CSV email as fallback
    }

    // Create pending appointment record
    const pendingAppointment = new PendingAppointment({
      vapiCallId: call.id,
      phoneNumberId: call.phoneNumberId || 'unknown', // Vapi phone number ID
      appointmentData: {
        title: appointmentData.title || `Appointment with ${customerName || 'Customer'}`,
        startTime: appointmentData.startTime,
        endTime: appointmentData.endTime,
        customer: {
          name: customerName || 'Customer',
          phone: customerPhone,
          email: customerEmail
        },
        notes: appointmentData.notes || message?.summary || ''
      },
      callData: {
        duration: message?.durationSeconds,
        summary: message?.summary,
        transcript: message?.transcript,
        endReason: message?.endedReason
      }
    });

    await pendingAppointment.save();

    logger.info('PENDING_APPOINTMENT_STORED', 'Stored pending appointment for confirmation', {
      callId: call.id,
      phoneNumberId: call.phoneNumberId,
      data: {
        title: pendingAppointment.appointmentData.title,
        customerName: customerName,
        customerEmail: customerEmail,
        customerPhone: customerPhone,
        startTime: appointmentData.startTime
      }
    });

    return pendingAppointment;

  } catch (error) {
    logger.error('STORE_PENDING_APPOINTMENT_ERROR', 'Failed to store pending appointment', {
      callId: call.id,
      error
    });
    throw error;
  }
}

// Process standalone appointment without a lead record
async function processStandaloneAppointment(payload: any, call: any, message: any) {
  try {
    logger.info('STANDALONE_APPOINTMENT_START', 'Starting standalone appointment processing', {
      callId: call.id,
      data: { 
        hasPayloadAppointment: !!payload.appointment,
        hasMessageAppointment: !!message?.appointment,
        hasStructuredData: !!message?.analysis?.structuredData,
        phoneNumberId: call.phoneNumberId
      }
    });

    let appointmentData = null;

    // PRIORITY 1: Extract from structured data (slot_booked field)
    const structuredData = message?.analysis?.structuredData;
    if (structuredData?.slot_booked) {
      try {
        const appointmentTime = new Date(structuredData.slot_booked);
        if (!isNaN(appointmentTime.getTime())) {
          appointmentData = {
            title: `Appointment`,
            startTime: appointmentTime.toISOString(),
            endTime: new Date(appointmentTime.getTime() + 30 * 60 * 1000).toISOString(), // 30 minutes
            customer: {
              name: structuredData.name || 'Customer',
              phone: call.phoneNumber,
              email: structuredData.email
            },
            notes: message.summary || 'Appointment scheduled during call'
          };

          logger.info('STANDALONE_APPOINTMENT_FROM_STRUCTURED_DATA', 'Created standalone appointment from structured data', {
            callId: call.id,
            data: {
              slot_booked: structuredData.slot_booked,
              email: structuredData.email,
              name: structuredData.name
            }
          });
        }
      } catch (error) {
        logger.error('STANDALONE_STRUCTURED_DATA_ERROR', 'Failed to parse structured data', {
          callId: call.id,
          error,
          data: { slot_booked: structuredData.slot_booked }
        });
      }
    }

    // PRIORITY 2: Fallback to payload.appointment or message.appointment
    if (!appointmentData) {
      appointmentData = payload.appointment || message?.appointment;
    }

    if (!appointmentData || !appointmentData.startTime || !appointmentData.endTime) {
      logger.error('STANDALONE_APPOINTMENT_ERROR', 'Invalid appointment data', {
        callId: call.id,
        data: { 
          hasAppointmentData: !!appointmentData,
          hasStartTime: appointmentData?.startTime,
          hasEndTime: appointmentData?.endTime
        }
      });
      return NextResponse.json({ error: 'Invalid appointment data' }, { status: 400 });
    }

    // Store as pending appointment (no lead association)
    await storePendingAppointment(call, message, appointmentData);

    logger.info('STANDALONE_APPOINTMENT_STORED', 'Standalone appointment stored for confirmation', {
      callId: call.id,
      phoneNumberId: call.phoneNumberId,
      data: { title: appointmentData.title }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Appointment stored for confirmation'
    });

  } catch (error) {
    logger.error('STANDALONE_APPOINTMENT_ERROR', 'Failed to process standalone appointment', {
      callId: call.id,
      error
    });
    return NextResponse.json({
      error: 'Failed to process standalone appointment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Handle GET requests for webhook verification
// Track call usage for billing purposes
async function trackCallUsage(lead: any, message: any) {
  try {
    if (!lead.assignedAssistantId || !lead.userId) return;
    
    const durationSeconds = message.durationSeconds || 0;
    if (durationSeconds < 1) return; // Skip very short calls
    
    // Get assistant name
    const assistant = await Assistant.findById(lead.assignedAssistantId);
    const assistantName = assistant?.name || 'Unknown Assistant';
    
    // Track usage
    await usageValidator.trackCallUsage(
      lead.userId,
      lead.assignedAssistantId.toString(),
      assistantName,
      durationSeconds
    );
    
    logger.info('USAGE_TRACKED', 'Call usage tracked for billing', {
      userId: lead.userId,
      assistantId: lead.assignedAssistantId.toString(),
      assistantName,
      durationSeconds,
      leadId: lead._id.toString()
    });
    
  } catch (error) {
    logger.error('USAGE_TRACKING_ERROR', 'Failed to track call usage', {
      error,
      leadId: lead._id?.toString(),
      assignedAssistantId: lead.assignedAssistantId?.toString()
    });
  }
}

// Create or update call summary for data extraction and display
async function createCallSummary(call: any, message: any, lead?: any, payload?: any) {
  try {
    // Extract basic call information
    const phoneNumberId = call.phoneNumberId || payload.phoneNumberId || 'unknown';
    const userId = lead?.userId;
    
    if (!userId) {
      logger.warn('CALL_SUMMARY_NO_USER', 'Cannot create call summary without userId', {
        vapiCallId: call.id,
        phoneNumberId
      });
      return;
    }

    // Extract structured data from message.analysis.structuredData
    const structuredData = message?.analysis?.structuredData || {};
    
    // Build extractedInfo from structured data
    const extractedInfo: any = {};
    if (structuredData.name) extractedInfo.name = structuredData.name;
    if (structuredData.email) extractedInfo.email = structuredData.email;
    if (structuredData.phoneNumber) extractedInfo.phoneNumber = structuredData.phoneNumber;
    if (structuredData.slot_booked) extractedInfo.appointmentTime = structuredData.slot_booked;
    
    // Add any other custom fields from structured data
    Object.keys(structuredData).forEach(key => {
      if (!['name', 'email', 'phoneNumber', 'slot_booked'].includes(key)) {
        extractedInfo[key] = structuredData[key];
      }
    });

    // Determine call status based on official Vapi endedReason values
    let callStatus: 'completed' | 'failed' | 'no-answer' | 'busy' = 'completed';
    if (message?.endedReason === 'customer-did-not-answer') callStatus = 'no-answer';
    else if (message?.endedReason === 'customer-busy') callStatus = 'busy';
    else if (NOT_ANSWERED_REASONS.includes(message?.endedReason)) callStatus = 'failed';

    // Convert evaluation
    let evaluation = null;
    if (message?.analysis?.successEvaluation === 'true') {
      evaluation = 'positive';
    } else if (message?.analysis?.successEvaluation === 'false') {
      evaluation = 'negative';
    } else {
      evaluation = 'neutral';
    }

    // Extract stereo recording URL from artifact
    const stereoRecordingUrl = message?.artifact?.stereoRecordingUrl || payload?.artifact?.stereoRecordingUrl;

    const callSummaryData = {
      userId,
      vapiCallId: call.id,
      phoneNumberId,
      leadId: lead?._id?.toString(),
      
      callData: {
        duration: Math.round(message?.durationSeconds || 0),
        endReason: message?.endedReason,
        status: callStatus,
        cost: message?.cost,
        startTime: call.startTime ? new Date(call.startTime) : undefined,
        endTime: call.endTime ? new Date(call.endTime) : new Date()
      },
      
      transcript: message?.transcript,
      summary: message?.summary || message?.analysis?.summary,
      evaluation,
      stereoRecordingUrl,
      
      structuredData,
      extractedInfo,
      
      appointmentCreated: !!(structuredData.slot_booked || payload?.appointment),
      appointmentData: payload?.appointment ? {
        title: payload.appointment.title,
        startTime: payload.appointment.startTime,
        endTime: payload.appointment.endTime,
        confirmed: false
      } : undefined
    };

    // Create or update call summary
    const callSummary = await CallSummary.findOneAndUpdate(
      { vapiCallId: call.id },
      callSummaryData,
      { upsert: true, new: true }
    );

    logger.info('CALL_SUMMARY_CREATED', 'Call summary created/updated', {
      callSummaryId: callSummary._id.toString(),
      vapiCallId: call.id,
      phoneNumberId,
      userId,
      leadId: lead?._id?.toString(),
      data: {
        hasStructuredData: Object.keys(structuredData).length > 0,
        extractedFields: Object.keys(extractedInfo),
        appointmentCreated: callSummaryData.appointmentCreated,
        evaluation
      }
    });

    return callSummary;

  } catch (error) {
    logger.error('CALL_SUMMARY_ERROR', 'Failed to create call summary', {
      vapiCallId: call.id,
      error,
      userId: lead?.userId
    });
  }
}

export async function GET(request: NextRequest) {
  // Some webhook services send verification requests
  const searchParams = request.nextUrl.searchParams;
  const challenge = searchParams.get('challenge');
  
  if (challenge) {
    return new Response(challenge, { status: 200 });
  }
  
  return NextResponse.json({ message: 'Vapi webhook endpoint is active' });
}