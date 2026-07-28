import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import PhoneProvider from '@/models/PhoneProvider';
import Lead from '@/models/Lead';
import { calendarManager } from '@/lib/calendar/manager';
import { logger } from '@/lib/logger';

/**
 * Reschedule and cancel for appointments booked live during a call.
 *
 * There is no approve/reject step any more — the agent books the visit while
 * the homeowner is on the phone, so by the time it appears here it is real and
 * already on the calendar. The only useful actions are moving it or calling it
 * off, and both must reach Google Calendar or the technician's day is wrong.
 *
 * Cancelling marks the row `cancelled` instead of deleting it. These rows are
 * the booking ledger — deleting one makes "visits booked" fall retroactively
 * for a period that has already closed.
 */

async function loadOwned(id: string, userId: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;

  const appointment = await Appointment.findById(id);
  if (!appointment) return null;

  if (appointment.userId && appointment.userId === userId) return appointment;

  // Rows created before userId existed are owned via the user's Vapi numbers.
  const providers = await PhoneProvider.find({ userId }).select('vapiPhoneNumberId');
  const ids = providers.map((p) => p.vapiPhoneNumberId).filter(Boolean);
  return ids.includes(appointment.phoneNumberId) ? appointment : null;
}

/** Reschedule. Moves the Google Calendar event, then the stored record. */
export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const appointment = await loadOwned(id, userId);
    if (!appointment) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });

    const body = await request.json();
    const startTime = String(body.startTime || '').trim();
    if (!startTime) {
      return NextResponse.json({ error: 'startTime is required' }, { status: 400 });
    }

    const start = new Date(startTime);
    if (Number.isNaN(start.getTime())) {
      return NextResponse.json({ error: 'Invalid startTime' }, { status: 400 });
    }

    // Preserve the original visit length rather than assuming a default.
    const prevStart = new Date(appointment.appointmentData.startTime);
    const prevEnd = new Date(appointment.appointmentData.endTime);
    const durationMs = Math.max(prevEnd.getTime() - prevStart.getTime(), 15 * 60_000);
    const end = new Date(start.getTime() + durationMs);

    if (appointment.calendarEventId) {
      const providers = await calendarManager.getUserActiveProviders(userId);
      const provider = providers[0] ? calendarManager.getProvider(providers[0]) : undefined;

      if (provider) {
        const res = await provider.updateEvent(userId, appointment.calendarEventId, {
          title: appointment.appointmentData.title,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          description: appointment.appointmentData.notes,
        });

        // Refuse to let the record drift away from the calendar — a row that
        // says 2pm while the tech's calendar says 10am is worse than an error.
        if (!res.success) {
          logger.error('APPOINTMENT_RESCHEDULE_CALENDAR_FAILED', 'Calendar update failed', {
            userId,
            data: { appointmentId: id, error: res.error },
          });
          return NextResponse.json(
            { error: `Calendar update failed: ${res.error || 'unknown error'}` },
            { status: 502 }
          );
        }
      }
    }

    appointment.appointmentData.startTime = start.toISOString();
    appointment.appointmentData.endTime = end.toISOString();
    appointment.status = 'booked';
    await appointment.save();

    await Lead.updateOne(
      { vapiCallId: appointment.vapiCallId },
      { $set: { 'callResults.appointmentTime': start.toISOString() } }
    ).catch(() => undefined);

    logger.info('APPOINTMENT_RESCHEDULED', 'Appointment rescheduled', {
      userId,
      data: { appointmentId: id, startTime: start.toISOString() },
    });

    return NextResponse.json({ success: true, appointment });
  } catch (error) {
    logger.error('APPOINTMENT_RESCHEDULE_ERROR', 'Failed to reschedule appointment', {
      error,
      data: { appointmentId: id },
    });
    return NextResponse.json({ error: 'Failed to reschedule' }, { status: 500 });
  }
}

/** Cancel. Removes the calendar event and marks the row cancelled. */
export async function DELETE(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const appointment = await loadOwned(id, userId);
    if (!appointment) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });

    if (appointment.calendarEventId) {
      const providers = await calendarManager.getUserActiveProviders(userId);
      const provider = providers[0] ? calendarManager.getProvider(providers[0]) : undefined;
      if (provider) {
        const res = await provider.deleteEvent(userId, appointment.calendarEventId);
        if (!res.success) {
          // Not fatal — the event may already be gone from the calendar.
          logger.warn('APPOINTMENT_CANCEL_CALENDAR_FAILED', 'Calendar delete failed', {
            userId,
            data: { appointmentId: id, error: res.error },
          });
        }
      }
    }

    await Lead.updateOne(
      { vapiCallId: appointment.vapiCallId },
      { $set: { 'callResults.appointmentCreated': false } }
    ).catch(() => undefined);

    appointment.status = 'cancelled';
    appointment.cancelledAt = new Date();
    await appointment.save();

    logger.info('APPOINTMENT_CANCELLED', 'Appointment cancelled', {
      userId,
      data: { appointmentId: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('APPOINTMENT_CANCEL_ERROR', 'Failed to cancel appointment', {
      error,
      data: { appointmentId: id },
    });
    return NextResponse.json({ error: 'Failed to cancel' }, { status: 500 });
  }
}
