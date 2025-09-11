import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// Import models and utilities only when needed to identify the failing import
async function getRequiredModules() {
  try {
    const { connectToDatabase } = await import('@/lib/mongodb');
    const SupportTicketModule = await import('@/models/SupportTicket');
    const SubscriptionModule = await import('@/models/Subscription');
    const { logger } = await import('@/lib/logger');
    
    return {
      connectToDatabase,
      SupportTicket: SupportTicketModule.default,
      Subscription: SubscriptionModule.default,
      logger
    };
  } catch (error) {
    console.error('Failed to import modules:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/support - Starting request');
    const { userId } = await auth();
    console.log('User ID from auth:', userId);
    
    const requestBody = await request.json();
    console.log('Request body:', requestBody);
    
    const { subject, description, category = 'general', userEmail, userName } = requestBody;

    // Validation
    if (!subject || !description) {
      console.log('Validation failed: missing subject or description');
      return NextResponse.json(
        { error: 'Subject and description are required' },
        { status: 400 }
      );
    }

    if (!userId && !userEmail) {
      console.log('Validation failed: no userId or userEmail');
      return NextResponse.json(
        { error: 'User authentication or email is required' },
        { status: 400 }
      );
    }

    console.log('Validation passed, importing modules...');

    // Import modules dynamically to catch import errors
    const { connectToDatabase, SupportTicket, Subscription, logger } = await getRequiredModules();
    console.log('Modules imported successfully, connecting to database...');

    await connectToDatabase();
    console.log('Database connected successfully');

    // Get user context if logged in
    let userSubscriptionType = undefined;
    let userCreditBalance = undefined;
    let finalUserEmail = userEmail;
    let finalUserName = userName;

    if (userId) {
      console.log('Looking up subscription for user:', userId);
      const subscription = await Subscription.findOne({ userId, isActive: true });
      console.log('Subscription found:', !!subscription);
      if (subscription) {
        userSubscriptionType = subscription.planType;
        userCreditBalance = subscription.creditBalance;
        if (subscription.metadata?.email) finalUserEmail = subscription.metadata.email;
        if (subscription.metadata?.name) finalUserName = subscription.metadata.name;
      }
    }

    // Determine priority
    let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
    if (category === 'billing' || userSubscriptionType === 'enterprise') {
      priority = 'high';
    }
    if (description.toLowerCase().includes('urgent') || description.toLowerCase().includes('critical')) {
      priority = 'urgent';
    }

    console.log('Creating ticket with priority:', priority, 'category:', category);

    // Generate ticket ID manually to avoid pre-save hook issues
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await SupportTicket.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });
    const ticketId = `SUP-${date}-${(count + 1).toString().padStart(4, '0')}`;
    
    console.log('Generated ticket ID:', ticketId);

    // Create support ticket
    const ticket = new SupportTicket({
      ticketId, // Set ticketId manually
      userId,
      userEmail: finalUserEmail,
      userName: finalUserName,
      subject: subject.trim(),
      description: description.trim(),
      category,
      priority,
      status: 'open',
      tags: [],
      messages: [{
        id: new Date().getTime().toString(),
        from: 'user',
        authorId: userId || 'anonymous',
        authorName: finalUserName || 'Anonymous User',
        message: description.trim(),
        isInternal: false,
        createdAt: new Date()
      }],
      userSubscriptionType,
      userCreditBalance
    });

    console.log('Attempting to save ticket...');
    await ticket.save();
    console.log('Ticket saved successfully with ID:', ticket.ticketId);

    logger.info('SUPPORT_TICKET_CREATED', 'New support ticket created', {
      ticketId: ticket.ticketId,
      userId,
      userEmail: finalUserEmail,
      category,
      priority,
      hasSubscription: !!userSubscriptionType
    });

    // TODO: Send notification email to support team
    // TODO: Send confirmation email to user

    return NextResponse.json({
      success: true,
      message: 'Support ticket created successfully. We\'ll get back to you soon!',
      ticketId: ticket.ticketId,
      ticket: {
        _id: ticket._id,
        ticketId: ticket.ticketId,
        subject: ticket.subject,
        status: ticket.status,
        priority: ticket.priority,
        createdAt: ticket.createdAt
      }
    });

  } catch (error) {
    console.error('Error in POST /api/support:', error);
    // logger might not be available if import failed, so make it optional
    try {
      const { logger } = await getRequiredModules();
      logger.error('SUPPORT_TICKET_ERROR', 'Failed to create support ticket', { error });
    } catch (logError) {
      console.error('Logger also failed:', logError);
    }
    
    return NextResponse.json(
      { error: 'Failed to create support ticket. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/support - Starting request');
    const { userId } = await auth();
    console.log('GET User ID from auth:', userId);
    
    if (!userId) {
      console.log('GET: No userId, returning unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('GET: Importing modules...');
    const { connectToDatabase, SupportTicket } = await getRequiredModules();
    console.log('GET: Connecting to database...');
    await connectToDatabase();

    console.log('GET: Finding tickets for user:', userId);
    const tickets = await SupportTicket.find({ userId })
      .sort({ createdAt: -1 })
      .select('ticketId subject status priority category createdAt updatedAt')
      .lean();

    console.log('GET: Found tickets:', tickets.length);
    console.log('GET: Tickets data:', tickets);

    return NextResponse.json({ tickets });

  } catch (error) {
    console.error('GET Error in /api/support:', error);
    return NextResponse.json({ error: 'Failed to get tickets' }, { status: 500 });
  }
}