import { NextRequest, NextResponse } from 'next/server';
import { AdminAuthService } from '@/lib/adminAuth';
import { connectToDatabase } from '@/lib/mongodb';
import SupportTicket from '@/models/SupportTicket';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/admin/support - Starting request');
    
    const authResult = await AdminAuthService.requirePermission(request, 'view_support');
    console.log('Admin auth result:', authResult);
    if ('error' in authResult) {
      console.log('Admin auth failed:', authResult);
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const category = url.searchParams.get('category');
    const priority = url.searchParams.get('priority');
    const assignedTo = url.searchParams.get('assignedTo');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    console.log('Admin support filters:', { status, category, priority, assignedTo, page, limit });

    await connectToDatabase();
    console.log('Database connected for admin support');

    // Build filter query
    const filter: any = {};
    if (status && status !== 'all') filter.status = status;
    if (category && category !== 'all') filter.category = category;
    if (priority && priority !== 'all') filter.priority = priority;
    if (assignedTo && assignedTo !== 'all') filter.assignedTo = assignedTo;

    const skip = (page - 1) * limit;

    console.log('Searching with filter:', filter);
    
    const tickets = await SupportTicket.find(filter)
      .sort({ priority: 1, createdAt: -1 }) // Urgent first, then by creation date
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await SupportTicket.countDocuments(filter);

    console.log('Found tickets:', tickets.length);
    console.log('Total tickets in DB:', total);
    console.log('Sample ticket:', tickets[0] || 'No tickets found');

    return NextResponse.json({
      tickets,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    logger.error('ADMIN_GET_SUPPORT_TICKETS_ERROR', 'Failed to get support tickets', { error });
    return NextResponse.json({ error: 'Failed to get support tickets' }, { status: 500 });
  }
}