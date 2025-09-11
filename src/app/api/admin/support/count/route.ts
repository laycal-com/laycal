import { NextRequest, NextResponse } from 'next/server';
import { AdminAuthService } from '@/lib/adminAuth';
import { connectToDatabase } from '@/lib/mongodb';
import SupportTicket from '@/models/SupportTicket';

export async function GET(request: NextRequest) {
  try {
    const authResult = await AdminAuthService.requirePermission(request, 'view_support');
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    await connectToDatabase();

    // Count tickets by status
    const counts = await Promise.all([
      SupportTicket.countDocuments({ status: 'open' }),
      SupportTicket.countDocuments({ status: 'in_progress' }),
      SupportTicket.countDocuments({ status: { $in: ['open', 'in_progress'] } }), // Total active
      SupportTicket.countDocuments({ status: 'waiting_customer' }),
      SupportTicket.countDocuments({ priority: 'urgent', status: { $ne: 'closed' } })
    ]);

    const [openCount, inProgressCount, activeCount, waitingCount, urgentCount] = counts;

    return NextResponse.json({
      open: openCount,
      inProgress: inProgressCount,
      active: activeCount, // open + in_progress
      waiting: waitingCount,
      urgent: urgentCount
    });

  } catch (error) {
    console.error('Error getting admin support counts:', error);
    return NextResponse.json({ error: 'Failed to get ticket counts' }, { status: 500 });
  }
}