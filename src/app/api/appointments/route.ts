import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongodb';
import PendingAppointment from '@/models/PendingAppointment';
import PhoneProvider from '@/models/PhoneProvider';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending_confirmation';

    // Find user's phone providers to get phoneNumberIds
    const phoneProviders = await PhoneProvider.find({ userId }).select('vapiPhoneNumberId');
    const phoneNumberIds = phoneProviders.map(provider => provider.vapiPhoneNumberId).filter(Boolean);

    if (phoneNumberIds.length === 0) {
      return NextResponse.json({
        appointments: [],
        message: 'No phone providers configured'
      });
    }

    logger.info('GET_PENDING_APPOINTMENTS', 'Fetching pending appointments for user', {
      userId,
      data: { 
        phoneNumberIds: phoneNumberIds,
        status: status,
        phoneProviderCount: phoneProviders.length
      }
    });

    // Get pending appointments for user's phone numbers
    const appointments = await PendingAppointment.find({
      phoneNumberId: { $in: phoneNumberIds },
      status: status
    }).sort({ createdAt: -1 });

    logger.info('GET_PENDING_APPOINTMENTS_RESULT', 'Found pending appointments', {
      userId,
      data: { 
        appointmentCount: appointments.length,
        status: status
      }
    });

    return NextResponse.json({
      appointments,
      phoneProviders: phoneProviders.length
    });

  } catch (error) {
    logger.error('GET_PENDING_APPOINTMENTS_ERROR', 'Failed to fetch pending appointments', {
      error
    });
    return NextResponse.json({
      error: 'Failed to fetch appointments',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}