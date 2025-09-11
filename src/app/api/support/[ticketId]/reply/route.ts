import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// Import models and utilities dynamically to avoid import issues
async function getRequiredModules() {
  try {
    const { connectToDatabase } = await import('@/lib/mongodb');
    const SupportTicketModule = await import('@/models/SupportTicket');
    const { logger } = await import('@/lib/logger');
    
    return {
      connectToDatabase,
      SupportTicket: SupportTicketModule.default,
      logger
    };
  } catch (error) {
    console.error('Failed to import modules:', error);
    throw error;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  try {
    console.log('POST /api/support/[ticketId]/reply - Adding reply to ticket:', params.ticketId);
    const { userId } = await auth();
    console.log('User ID from auth:', userId);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requestBody = await request.json();
    console.log('Reply request body:', requestBody);
    
    const { message, userName, userEmail } = requestBody;

    // Validation
    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const { connectToDatabase, SupportTicket, logger } = await getRequiredModules();
    await connectToDatabase();

    // Find the ticket by ticketId and ensure it belongs to the current user
    const ticket = await SupportTicket.findOne({ 
      ticketId: params.ticketId,
      userId: userId 
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Check if ticket is closed - don't allow replies to closed tickets
    if (ticket.status === 'closed') {
      return NextResponse.json({ 
        error: 'Cannot reply to a closed ticket. Please create a new ticket if you need further assistance.' 
      }, { status: 400 });
    }

    console.log('Adding reply to ticket:', ticket.ticketId);

    // Create new message
    const newMessage = {
      id: new Date().getTime().toString(),
      from: 'user' as const,
      authorId: userId,
      authorName: userName || 'User',
      message: message.trim(),
      isInternal: false,
      createdAt: new Date()
    };

    // Add the message to the ticket
    ticket.messages.push(newMessage);

    // Update ticket status - if it was resolved, move it back to in-progress
    if (ticket.status === 'resolved') {
      ticket.status = 'in_progress';
      console.log('Ticket status changed from resolved to in_progress due to user reply');
    } else if (ticket.status === 'waiting_customer') {
      ticket.status = 'in_progress';
      console.log('Ticket status changed from waiting_customer to in_progress due to user reply');
    }

    // Update the updatedAt timestamp
    ticket.updatedAt = new Date();

    await ticket.save();

    logger.info('SUPPORT_TICKET_REPLY_ADDED', 'User added reply to support ticket', {
      ticketId: ticket.ticketId,
      userId,
      messageId: newMessage.id,
      newStatus: ticket.status
    });

    console.log('Reply added successfully to ticket:', ticket.ticketId);

    return NextResponse.json({
      success: true,
      message: 'Reply added successfully',
      newMessage,
      ticket: {
        _id: ticket._id,
        ticketId: ticket.ticketId,
        status: ticket.status,
        updatedAt: ticket.updatedAt,
        messages: ticket.messages
      }
    });

  } catch (error) {
    console.error('Error in POST /api/support/[ticketId]/reply:', error);
    return NextResponse.json(
      { error: 'Failed to add reply. Please try again.' },
      { status: 500 }
    );
  }
}