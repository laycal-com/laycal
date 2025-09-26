import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongodb';
import CallSummary from '@/models/CallSummary';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const phoneNumberId = searchParams.get('phoneNumberId');
    const leadId = searchParams.get('leadId');
    const status = searchParams.get('status');

    // Build filter
    const filter: any = { userId };
    if (phoneNumberId) filter.phoneNumberId = phoneNumberId;
    if (leadId) filter.leadId = leadId;
    if (status) filter['callData.status'] = status;

    // Get total count
    const total = await CallSummary.countDocuments(filter);

    // Get summaries with pagination
    const summaries = await CallSummary.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      summaries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching call summaries:', error);
    return NextResponse.json({
      error: 'Failed to fetch call summaries',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}