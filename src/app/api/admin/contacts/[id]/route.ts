import { NextRequest, NextResponse } from 'next/server';
import { AdminAuthService } from '@/lib/adminAuth';
import { connectToDatabase } from '@/lib/mongodb';
import ContactSubmission from '@/models/ContactSubmission';
import { logger } from '@/lib/logger';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await AdminAuthService.requirePermission(request, 'manage_contacts');
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { admin } = authResult;
    const { id } = await params;
    const updates = await request.json();

    await connectToDatabase();

    const contact = await ContactSubmission.findById(id);
    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Update allowed fields
    if (updates.status) contact.status = updates.status;
    if (updates.priority) contact.priority = updates.priority;
    if (updates.assignedTo !== undefined) contact.assignedTo = updates.assignedTo;
    if (updates.followUpDate) contact.followUpDate = new Date(updates.followUpDate);
    if (updates.tags) contact.tags = updates.tags;

    await contact.save();

    logger.info('ADMIN_UPDATE_CONTACT', 'Contact updated', {
      adminId: admin._id.toString(),
      contactId: id,
      updates
    });

    return NextResponse.json({
      success: true,
      contact
    });

  } catch (error) {
    logger.error('ADMIN_UPDATE_CONTACT_ERROR', 'Failed to update contact', { error });
    return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 });
  }
}