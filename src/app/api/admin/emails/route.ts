import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { logger } from '@/lib/logger';

const mongoose = require('mongoose');

// Use the same schema as in the email-collection route
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
  postTitle: String,
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

const EmailCollection = mongoose.models.EmailCollection || mongoose.model('EmailCollection', emailCollectionSchema);

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const source = searchParams.get('source');
    const search = searchParams.get('search');

    // Build query
    const query: any = {};
    
    if (source && source !== 'all') {
      query.source = source;
    }
    
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { postTitle: { $regex: search, $options: 'i' } }
      ];
    }

    // Get total count
    const totalCount = await EmailCollection.countDocuments(query);

    // Get emails with pagination
    const emails = await EmailCollection.find(query)
      .sort({ subscribedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Get summary stats
    const totalSubscribers = await EmailCollection.countDocuments({ isActive: true });
    const totalUnsubscribed = await EmailCollection.countDocuments({ isActive: false });
    
    const sourceStats = await EmailCollection.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$source', count: { $sum: 1 } } }
    ]);

    logger.info('ADMIN_EMAILS_FETCHED', 'Admin fetched email list', {
      page,
      limit,
      totalCount,
      totalSubscribers
    });

    return NextResponse.json({
      emails,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      },
      stats: {
        totalSubscribers,
        totalUnsubscribed,
        sourceStats
      }
    });

  } catch (error) {
    logger.error('ADMIN_EMAILS_ERROR', 'Failed to fetch emails for admin', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      { error: 'Failed to fetch emails' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { emailId } = body;

    if (!emailId) {
      return NextResponse.json(
        { error: 'Email ID is required' },
        { status: 400 }
      );
    }

    // Soft delete - mark as unsubscribed instead of deleting
    const result = await EmailCollection.findByIdAndUpdate(
      emailId,
      { 
        isActive: false,
        unsubscribedAt: new Date()
      },
      { new: true }
    );

    if (!result) {
      return NextResponse.json(
        { error: 'Email not found' },
        { status: 404 }
      );
    }

    logger.info('ADMIN_EMAIL_UNSUBSCRIBED', 'Admin unsubscribed email', {
      emailId,
      email: result.email
    });

    return NextResponse.json({
      message: 'Email unsubscribed successfully',
      email: result
    });

  } catch (error) {
    logger.error('ADMIN_EMAIL_DELETE_ERROR', 'Failed to unsubscribe email', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      { error: 'Failed to unsubscribe email' },
      { status: 500 }
    );
  }
}