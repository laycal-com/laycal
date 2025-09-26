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
    console.log('POST /api/phone-number-request - Starting request');
    const { userId } = await auth();
    console.log('User ID from auth:', userId);
    
    const requestBody = await request.json();
    console.log('Request body:', requestBody);
    
    const { region = '', description = '' } = requestBody;

    // Build the simple request message
    let requestMessage = "I would like to request a new phone number.";
    
    if (region) {
      requestMessage += `\n\nPreferred Region: ${region}`;
    }
    
    if (description) {
      requestMessage += `\n\nAdditional Details: ${description}`;
    }

    // Use exact same validation and creation pattern as support tickets
    if (!requestMessage) {
      console.log('Validation failed: missing message');
      return NextResponse.json(
        { error: 'Request message is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      console.log('Validation failed: no userId');
      return NextResponse.json(
        { error: 'User authentication is required' },
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
    let finalUserEmail = undefined;
    let finalUserName = undefined;

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

    console.log('Creating phone number request ticket with priority: medium, category: phone_number_request');

    // Generate ticket ID manually to avoid pre-save hook issues
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await SupportTicket.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });
    const ticketId = `SUP-${date}-${(count + 1).toString().padStart(4, '0')}`;
    
    console.log('Generated ticket ID:', ticketId);

    // Create support ticket - exact same pattern as working support API
    const ticket = new SupportTicket({
      ticketId, // Set ticketId manually
      userId,
      userEmail: finalUserEmail || 'unknown@email.com',
      userName: finalUserName || 'Unknown User',
      subject: 'Phone Number Request',
      description: requestMessage.trim(),
      category: 'general',
      priority: 'medium',
      status: 'open',
      tags: ['phone-number-request', 'new-number', 'request'],
      messages: [{
        id: new Date().getTime().toString(),
        from: 'user',
        authorId: userId || 'anonymous',
        authorName: finalUserName || 'Anonymous User',
        message: requestMessage.trim(),
        isInternal: false,
        createdAt: new Date()
      }],
      userSubscriptionType,
      userCreditBalance
    });

    console.log('Attempting to save ticket...');
    await ticket.save();
    console.log('Ticket saved successfully with ID:', ticket.ticketId);

    logger.info('PHONE_NUMBER_REQUEST_CREATED', 'Phone number request ticket created', {
      ticketId: ticket.ticketId,
      userId,
      userEmail: finalUserEmail,
      category: 'general',
      priority: 'medium'
    });

    return NextResponse.json({
      success: true,
      message: 'Phone number request submitted successfully. We\'ll get back to you soon!',
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
    console.error('Error in POST /api/phone-number-request:', error);
    // logger might not be available if import failed, so make it optional
    try {
      const { logger } = await getRequiredModules();
      logger.error('PHONE_NUMBER_REQUEST_ERROR', 'Failed to create phone number request ticket', { error });
    } catch (logError) {
      console.error('Logger also failed:', logError);
    }
    
    return NextResponse.json(
      { error: 'Failed to create phone number request. Please try again.' },
      { status: 500 }
    );
  }
}