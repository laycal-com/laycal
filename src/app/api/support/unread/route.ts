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

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { connectToDatabase, SupportTicket } = await getRequiredModules();
    await connectToDatabase();

    // Get the last time user checked support (from URL params or default to 24h ago)
    const url = new URL(request.url);
    const lastCheckedParam = url.searchParams.get('lastChecked');
    const lastChecked = lastCheckedParam 
      ? new Date(lastCheckedParam)
      : new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago as fallback

    // Find tickets with admin messages newer than last check
    const ticketsWithNewMessages = await SupportTicket.find({
      userId,
      status: { $ne: 'closed' }, // Only check non-closed tickets
      'messages': {
        $elemMatch: {
          from: 'admin',
          createdAt: { $gt: lastChecked }
        }
      }
    }).select('ticketId subject status messages').lean();

    // Count unread admin messages
    let unreadCount = 0;
    const ticketUpdates = [];

    for (const ticket of ticketsWithNewMessages) {
      const newAdminMessages = ticket.messages?.filter((msg: any) => 
        msg.from === 'admin' && new Date(msg.createdAt) > lastChecked
      ) || [];

      if (newAdminMessages.length > 0) {
        unreadCount += newAdminMessages.length;
        ticketUpdates.push({
          ticketId: ticket.ticketId,
          subject: ticket.subject,
          status: ticket.status,
          newMessagesCount: newAdminMessages.length,
          latestMessage: newAdminMessages[newAdminMessages.length - 1]
        });
      }
    }

    return NextResponse.json({
      hasUnread: unreadCount > 0,
      unreadCount,
      ticketUpdates
    });

  } catch (error) {
    console.error('Error checking unread support messages:', error);
    return NextResponse.json({ error: 'Failed to check messages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // This endpoint allows updating the "last checked" time
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In a full implementation, you'd store this in user preferences or session
    // For now, we'll just return success - the frontend will manage this in localStorage
    
    return NextResponse.json({ 
      success: true,
      lastChecked: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating last checked time:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}