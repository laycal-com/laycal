import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import PhoneProvider from '@/models/PhoneProvider';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Appointments are booked live during the call, so a row is either
    // 'booked' or 'cancelled'. Cancelled rows are kept for history and excluded
    // unless asked for by name.
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'booked';

    const phoneProviders = await PhoneProvider.find({ userId }).select('vapiPhoneNumberId');
    const phoneNumberIds = phoneProviders.map(provider => provider.vapiPhoneNumberId).filter(Boolean);

    // Ownership by userId OR phone number. Rows written by the in-call booking
    // tool carry userId directly; older rows predate that field and can only be
    // matched through the user's Vapi phone numbers. Requiring a phone provider
    // used to hide every appointment from anyone whose provider was unset.
    const ownership: any[] = [{ userId }];
    if (phoneNumberIds.length > 0) {
      ownership.push({ phoneNumberId: { $in: phoneNumberIds } });
    }

    const query: Record<string, any> = { $or: ownership };
    if (status !== 'all') query.status = status;

    logger.info('GET_APPOINTMENTS', 'Fetching appointments for user', {
      userId,
      data: { status: status || 'all', phoneProviderCount: phoneProviders.length }
    });

    const appointments = await Appointment.find(query).sort({
      'appointmentData.startTime': -1
    });

    logger.info('GET_APPOINTMENTS_RESULT', 'Found appointments', {
      userId,
      data: { appointmentCount: appointments.length, status }
    });

    return NextResponse.json({
      appointments,
      phoneProviders: phoneProviders.length
    });

  } catch (error) {
    logger.error('GET_APPOINTMENTS_ERROR', 'Failed to fetch appointments', {
      error
    });
    return NextResponse.json({
      error: 'Failed to fetch appointments',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}