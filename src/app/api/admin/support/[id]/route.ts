import { NextRequest, NextResponse } from 'next/server';
import { AdminAuthService } from '@/lib/adminAuth';
import { connectToDatabase } from '@/lib/mongodb';
import SupportTicket from '@/models/SupportTicket';
import { logger } from '@/lib/logger';

export async function PATCH(
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
    const updates = await request.json();

    await connectToDatabase();

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Update allowed fields
    const oldStatus = ticket.status;
    if (updates.status) ticket.status = updates.status;
    if (updates.priority) ticket.priority = updates.priority;
    if (updates.assignedTo !== undefined) ticket.assignedTo = updates.assignedTo;
    if (updates.tags) ticket.tags = updates.tags;

    // Track resolution time
    if (updates.status === 'resolved' && oldStatus !== 'resolved') {
      ticket.resolvedAt = new Date();
      const resolutionTime = Math.round((new Date().getTime() - new Date(ticket.createdAt).getTime()) / (1000 * 60));
      ticket.resolutionTime = resolutionTime;
    }

    // Track closure time
    if (updates.status === 'closed' && oldStatus !== 'closed') {
      ticket.closedAt = new Date();
    }

    await ticket.save();

    logger.info('ADMIN_UPDATE_SUPPORT_TICKET', 'Support ticket updated', {
      adminId: admin._id.toString(),
      ticketId: ticket.ticketId,
      updates,
      oldStatus,
      newStatus: ticket.status
    });

    return NextResponse.json({
      success: true,
      ticket
    });

  } catch (error) {
    logger.error('ADMIN_UPDATE_SUPPORT_TICKET_ERROR', 'Failed to update support ticket', { error });
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 });
  }
}