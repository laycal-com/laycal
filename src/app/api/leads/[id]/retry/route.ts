import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongodb';
import Lead from '@/models/Lead';
import { vapiService } from '@/lib/vapi';
import { tenantVapiService } from '@/lib/tenantVapi';
import PhoneProvider from '@/models/PhoneProvider';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const leadId = params.id;

    // Connect to database
    await connectToDatabase();

    // Find the lead
    const lead = await Lead.findOne({ _id: leadId, userId });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Check if lead can be retried
    if (lead.status === 'calling') {
      return NextResponse.json({ 
        error: 'Cannot retry while call is in progress' 
      }, { status: 400 });
    }

    try {
      // Reset call results
      lead.callResults = undefined;
      lead.vapiCallId = undefined;
      lead.status = 'pending';
      
      // Check if user has a configured phone provider
      const phoneProvider = await PhoneProvider.findOne({
        userId,
        isActive: true,
        isDefault: true
      });

      // Initiate new Vapi call - use tenant service if provider is configured, fallback to system default
      let vapiResponse;
      
      if (phoneProvider) {
        // Use tenant-specific provider
        vapiResponse = await tenantVapiService.initiateCall({
          userId,
          phoneNumber: lead.phoneNumber,
          customer: {
            name: lead.name,
            email: lead.email,
            company: lead.company,
          },
          metadata: {
            leadId: lead._id.toString(),
            userId: userId,
            company: lead.company,
            retry: true,
          }
        });
      } else {
        // Fallback to system default (existing behavior)
        vapiResponse = await vapiService.initiateCall({
          phoneNumber: lead.phoneNumber,
          customer: {
            name: lead.name,
            email: lead.email,
          },
          metadata: {
            leadId: lead._id.toString(),
            userId: userId,
            company: lead.company,
            retry: true,
          }
        });
      }

      // Update lead with new Vapi call ID
      lead.vapiCallId = vapiResponse.id;
      lead.status = 'calling';
      lead.calledAt = new Date();
      await lead.save();

      return NextResponse.json({
        success: true,
        message: 'Call retry initiated successfully',
        data: {
          leadId: lead._id,
          vapiCallId: vapiResponse.id,
          status: lead.status,
        }
      });

    } catch (vapiError) {
      console.error('Vapi call retry failed:', vapiError);
      
      // Update lead status to failed
      lead.status = 'failed';
      await lead.save();

      return NextResponse.json({
        error: 'Failed to initiate retry call',
        details: vapiError instanceof Error ? vapiError.message : 'Vapi error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Retry request error:', error);
    return NextResponse.json({
      error: 'Failed to process retry request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}