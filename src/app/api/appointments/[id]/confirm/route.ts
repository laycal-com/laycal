import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongodb';
import PendingAppointment from '@/models/PendingAppointment';
import PhoneProvider from '@/models/PhoneProvider';
import { calendarManager } from '@/lib/calendar/manager';
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

    logger.info('CONFIRM_APPOINTMENT_START', 'Starting appointment confirmation', {
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
      logger.error('CONFIRM_APPOINTMENT_UNAUTHORIZED', 'User does not own this phone number', {
        userId,
        appointmentId,
        phoneNumberId: appointment.phoneNumberId
      });
      return NextResponse.json({ error: 'Unauthorized access to this appointment' }, { status: 403 });
    }

    logger.info('CONFIRM_APPOINTMENT_VERIFIED', 'User verified for appointment confirmation', {
      userId,
      appointmentId,
      phoneProvider: phoneProvider._id.toString()
    });

    // Create calendar event using the calendar manager
    const appointmentData = {
      callId: appointment.vapiCallId,
      status: 'completed' as const,
      appointment: {
        title: appointment.appointmentData.title,
        startTime: appointment.appointmentData.startTime,
        endTime: appointment.appointmentData.endTime,
        customer: {
          name: appointment.appointmentData.customer.name,
          phone: appointment.appointmentData.customer.phone
        },
        notes: appointment.appointmentData.notes || ''
      }
    };

    // Create the calendar event
    await calendarManager.createAppointmentFromWebhook(userId, appointmentData);

    // Update appointment status
    appointment.status = 'confirmed';
    appointment.confirmedBy = userId;
    appointment.confirmedAt = new Date();
    await appointment.save();

    logger.info('CONFIRM_APPOINTMENT_SUCCESS', 'Appointment confirmed and calendar event created', {
      userId,
      appointmentId,
      data: {
        title: appointment.appointmentData.title,
        customerName: appointment.appointmentData.customer.name,
        startTime: appointment.appointmentData.startTime
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Appointment confirmed and added to calendar',
      appointment: {
        id: appointment._id,
        title: appointment.appointmentData.title,
        status: appointment.status,
        confirmedAt: appointment.confirmedAt
      }
    });

  } catch (error) {
    logger.error('CONFIRM_APPOINTMENT_ERROR', 'Failed to confirm appointment', {
      userId: (await auth()).userId,
      appointmentId: params.id,
      error
    });

    return NextResponse.json({
      error: 'Failed to confirm appointment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}