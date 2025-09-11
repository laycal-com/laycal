import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongodb';
import PendingAppointment from '@/models/PendingAppointment';
import PhoneProvider from '@/models/PhoneProvider';
import { logger } from '@/lib/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const appointmentId = params.id;

    logger.info('REJECT_APPOINTMENT_START', 'Starting appointment rejection', {
      userId,
      appointmentId
    });

    // Find the pending appointment
    const appointment = await PendingAppointment.findById(appointmentId);

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    if (appointment.status !== 'pending_confirmation') {
      return NextResponse.json({ 
        error: 'Appointment already processed',
        status: appointment.status 
      }, { status: 400 });
    }

    // Verify user owns this appointment's phone number
    const phoneProvider = await PhoneProvider.findOne({
      userId,
      vapiPhoneNumberId: appointment.phoneNumberId
    });

    if (!phoneProvider) {
      logger.error('REJECT_APPOINTMENT_UNAUTHORIZED', 'User does not own this phone number', {
        userId,
        appointmentId,
        phoneNumberId: appointment.phoneNumberId
      });
      return NextResponse.json({ error: 'Unauthorized access to this appointment' }, { status: 403 });
    }

    // Update appointment status
    appointment.status = 'rejected';
    appointment.confirmedBy = userId;
    appointment.confirmedAt = new Date();
    await appointment.save();

    logger.info('REJECT_APPOINTMENT_SUCCESS', 'Appointment rejected', {
      userId,
      appointmentId,
      data: {
        title: appointment.appointmentData.title,
        customerName: appointment.appointmentData.customer.name
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Appointment rejected',
      appointment: {
        id: appointment._id,
        title: appointment.appointmentData.title,
        status: appointment.status,
        confirmedAt: appointment.confirmedAt
      }
    });

  } catch (error) {
    logger.error('REJECT_APPOINTMENT_ERROR', 'Failed to reject appointment', {
      userId: (await auth()).userId,
      appointmentId: params.id,
      error
    });

    return NextResponse.json({
      error: 'Failed to reject appointment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}