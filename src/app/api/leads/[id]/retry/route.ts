import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongodb';
import Lead from '@/models/Lead';
import { vapiService } from '@/lib/vapi';

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
      
      // Initiate new Vapi call
      const vapiResponse = await vapiService.initiateCall({
        phoneNumber: lead.phoneNumber,
        customer: {
          name: lead.name,
          email: lead.email,
        },
        metadata: {
          leadId: lead._id.toString(),
          userId: userId,
          company: lead.company, // Move company to metadata
          retry: true,
        }
      });

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