import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import ContactSubmission from '@/models/ContactSubmission';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { name, email, company, phone, message, type = 'general' } = await request.json();

    // Validation
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Get client info
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     request.ip || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Determine priority based on type and content
    let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
    if (type === 'enterprise' || type === 'demo') {
      priority = 'high';
    } else if (message.toLowerCase().includes('urgent') || message.toLowerCase().includes('asap')) {
      priority = 'high';
    }

    // Create contact submission
    const contactSubmission = new ContactSubmission({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      company: company?.trim(),
      phone: phone?.trim(),
      message: message.trim(),
      type,
      status: 'new',
      priority,
      tags: [],
      notes: [],
      ipAddress,
      userAgent,
      source: 'website'
    });

    await contactSubmission.save();

    logger.info('CONTACT_FORM_SUBMITTED', 'New contact form submission received', {
      submissionId: contactSubmission._id.toString(),
      email: contactSubmission.email,
      type: contactSubmission.type,
      priority: contactSubmission.priority,
      hasCompany: !!company,
      hasPhone: !!phone,
      ipAddress
    });

    // TODO: Send notification email to admins
    // TODO: Send auto-reply email to user

    return NextResponse.json({
      success: true,
      message: 'Thank you for your inquiry! We\'ll get back to you within 24 hours.',
      submissionId: contactSubmission._id
    });

  } catch (error) {
    logger.error('CONTACT_FORM_ERROR', 'Failed to process contact form submission', { error });
    return NextResponse.json(
      { error: 'Failed to submit contact form. Please try again.' },
      { status: 500 }
    );
  }
}