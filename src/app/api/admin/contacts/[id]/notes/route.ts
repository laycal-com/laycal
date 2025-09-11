import { NextRequest, NextResponse } from 'next/server';
import { AdminAuthService } from '@/lib/adminAuth';
import { connectToDatabase } from '@/lib/mongodb';
import ContactSubmission from '@/models/ContactSubmission';
import { logger } from '@/lib/logger';

export async function POST(
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
    const { note } = await request.json();

    if (!note || !note.trim()) {
      return NextResponse.json({ error: 'Note content is required' }, { status: 400 });
    }

    await connectToDatabase();

    const contact = await ContactSubmission.findById(id);
    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    const newNote = {
      adminId: admin._id.toString(),
      adminName: admin.name,
      note: note.trim(),
      createdAt: new Date()
    };

    contact.notes.push(newNote);
    await contact.save();

    logger.info('ADMIN_ADD_CONTACT_NOTE', 'Note added to contact', {
      adminId: admin._id.toString(),
      contactId: id,
      noteLength: note.length
    });

    return NextResponse.json({
      success: true,
      note: newNote
    });

  } catch (error) {
    logger.error('ADMIN_ADD_CONTACT_NOTE_ERROR', 'Failed to add note to contact', { error });
    return NextResponse.json({ error: 'Failed to add note' }, { status: 500 });
  }
}