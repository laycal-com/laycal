import { NextRequest, NextResponse } from 'next/server';
import { AdminAuthService } from '@/lib/adminAuth';
import { connectToDatabase } from '@/lib/mongodb';
import ContactSubmission from '@/models/ContactSubmission';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const authResult = await AdminAuthService.requirePermission(request, 'view_contacts');
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const type = url.searchParams.get('type');
    const priority = url.searchParams.get('priority');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    await connectToDatabase();

    // Build filter query
    const filter: any = {};
    if (status && status !== 'all') filter.status = status;
    if (type && type !== 'all') filter.type = type;
    if (priority && priority !== 'all') filter.priority = priority;

    const skip = (page - 1) * limit;

    const contacts = await ContactSubmission.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await ContactSubmission.countDocuments(filter);

    return NextResponse.json({
      contacts,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    logger.error('ADMIN_GET_CONTACTS_ERROR', 'Failed to get contacts', { error });
    return NextResponse.json({ error: 'Failed to get contacts' }, { status: 500 });
  }
}