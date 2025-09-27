import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { logger } from '@/lib/logger';

// Create Email Collection Schema
const mongoose = require('mongoose');

const emailCollectionSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  source: {
    type: String,
    required: true,
    enum: ['blog_popup', 'footer', 'landing_page', 'other'],
    default: 'blog_popup'
  },
  postTitle: String, // For blog popup context
  ipAddress: String,
  userAgent: String,
  subscribedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  unsubscribedAt: Date,
}, {
  timestamps: true
});

// Create indexes for better performance
emailCollectionSchema.index({ email: 1 });
emailCollectionSchema.index({ subscribedAt: -1 });
emailCollectionSchema.index({ source: 1 });

// Prevent duplicate registrations
const EmailCollection = mongoose.models.EmailCollection || mongoose.model('EmailCollection', emailCollectionSchema);

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { email, source = 'blog_popup', postTitle } = body;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      );
    }

    // Get IP and User Agent for analytics
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Check if email already exists
    const existingEmail = await EmailCollection.findOne({ 
      email: email.toLowerCase().trim() 
    });

    if (existingEmail) {
      if (existingEmail.isActive) {
        logger.info('EMAIL_COLLECTION_DUPLICATE', 'Email already subscribed', {
          email: email.toLowerCase().trim(),
          source,
          postTitle
        });
        
        return NextResponse.json(
          { message: 'Email already subscribed', alreadySubscribed: true },
          { status: 200 }
        );
      } else {
        // Reactivate previously unsubscribed email
        existingEmail.isActive = true;
        existingEmail.unsubscribedAt = undefined;
        existingEmail.subscribedAt = new Date();
        existingEmail.source = source;
        if (postTitle) existingEmail.postTitle = postTitle;
        await existingEmail.save();

        logger.info('EMAIL_COLLECTION_REACTIVATED', 'Email reactivated', {
          email: email.toLowerCase().trim(),
          source,
          postTitle
        });

        return NextResponse.json({
          message: 'Successfully resubscribed!',
          id: existingEmail._id
        });
      }
    }

    // Create new email subscription
    const emailDoc = new EmailCollection({
      email: email.toLowerCase().trim(),
      source,
      postTitle,
      ipAddress,
      userAgent,
    });

    await emailDoc.save();

    logger.info('EMAIL_COLLECTION_SUCCESS', 'New email collected', {
      email: email.toLowerCase().trim(),
      source,
      postTitle,
      id: emailDoc._id
    });

    return NextResponse.json({
      message: 'Successfully subscribed!',
      id: emailDoc._id
    });

  } catch (error) {
    logger.error('EMAIL_COLLECTION_ERROR', 'Failed to collect email', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      { error: 'Failed to subscribe. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    // Basic stats endpoint for admin
    const searchParams = request.nextUrl.searchParams;
    const adminKey = searchParams.get('admin');
    
    // Simple admin authentication (you might want to enhance this)
    if (adminKey !== 'admin-stats-key') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const totalSubscribers = await EmailCollection.countDocuments({ isActive: true });
    const totalUnsubscribed = await EmailCollection.countDocuments({ isActive: false });
    const recentSubscribers = await EmailCollection.find({ isActive: true })
      .sort({ subscribedAt: -1 })
      .limit(10)
      .lean();

    const sourceStats = await EmailCollection.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$source', count: { $sum: 1 } } }
    ]);

    return NextResponse.json({
      totalSubscribers,
      totalUnsubscribed,
      recentSubscribers,
      sourceStats
    });

  } catch (error) {
    logger.error('EMAIL_COLLECTION_STATS_ERROR', 'Failed to get email stats', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      { error: 'Failed to get stats' },
      { status: 500 }
    );
  }
}