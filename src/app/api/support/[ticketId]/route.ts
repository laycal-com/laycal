import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// Import models and utilities dynamically to avoid import issues
async function getRequiredModules() {
  try {
    const { connectToDatabase } = await import('@/lib/mongodb');
    const SupportTicketModule = await import('@/models/SupportTicket');
    
    return {
      connectToDatabase,
      SupportTicket: SupportTicketModule.default
    };
  } catch (error) {
    console.error('Failed to import modules:', error);
    throw error;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  try {
    console.log('GET /api/support/[ticketId] - Starting request for ticket:', params.ticketId);
    const { userId } = await auth();
    console.log('User ID from auth:', userId);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { connectToDatabase, SupportTicket } = await getRequiredModules();
    await connectToDatabase();

    // Find the ticket by ticketId and ensure it belongs to the current user
    const ticket = await SupportTicket.findOne({ 
      ticketId: params.ticketId,
      userId: userId 
    }).lean();

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    console.log('Found ticket:', ticket.ticketId);

    return NextResponse.json({ ticket });

  } catch (error) {
    console.error('Error in GET /api/support/[ticketId]:', error);
    return NextResponse.json(
      { error: 'Failed to get ticket details' },
      { status: 500 }
    );
  }
}