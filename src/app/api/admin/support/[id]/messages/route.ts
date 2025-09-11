import { NextRequest, NextResponse } from 'next/server';
import { AdminAuthService } from '@/lib/adminAuth';
import { connectToDatabase } from '@/lib/mongodb';
import SupportTicket from '@/models/SupportTicket';
import { logger } from '@/lib/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await AdminAuthService.requirePermission(request, 'manage_support');
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { admin } = authResult;
    const { id } = await params;
    const { message, isInternal = false } = await request.json();

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    await connectToDatabase();

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const newMessage = ticket.addMessage({
      from: 'admin',
      authorId: admin._id.toString(),
      authorName: admin.name,
      message: message.trim(),
      isInternal
    });

    // If this is the first admin response, calculate first response time
    if (!ticket.firstResponseTime && !isInternal) {
      const createdTime = new Date(ticket.createdAt).getTime();
      const responseTime = new Date().getTime();
      ticket.firstResponseTime = Math.round((responseTime - createdTime) / (1000 * 60)); // Minutes
    }

    // Update status if it's still open
    if (ticket.status === 'open' && !isInternal) {
      ticket.status = 'in_progress';
    } else if (ticket.status === 'waiting_internal' && !isInternal) {
      ticket.status = 'waiting_customer';
    }

    await ticket.save();

    logger.info('ADMIN_ADD_SUPPORT_MESSAGE', 'Admin message added to support ticket', {
      adminId: admin._id.toString(),
      ticketId: ticket.ticketId,
      messageLength: message.length,
      isInternal,
      newStatus: ticket.status
    });

    // TODO: Send email notification to customer if not internal

    return NextResponse.json({
      success: true,
      message: newMessage
    });

  } catch (error) {
    logger.error('ADMIN_ADD_SUPPORT_MESSAGE_ERROR', 'Failed to add message to support ticket', { error });
    return NextResponse.json({ error: 'Failed to add message' }, { status: 500 });
  }
}