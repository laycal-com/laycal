import mongoose, { Schema, Document } from 'mongoose';

/**
 * A booked technician visit.
 *
 * Replaces the old `PendingAppointment`. There is no approval queue any more —
 * the agent books the slot live while the homeowner is on the phone, so a row
 * existing here means the visit is on the calendar. The only states left are
 * `booked` and `cancelled`.
 *
 * Cancelling marks the row rather than deleting it. Deleting made "visits
 * booked" drop retroactively for a period that had already closed, which
 * silently rewrites history in every report that counts these.
 *
 * This is the source of truth for bookings. `Lead.callResults.appointmentCreated`
 * is a denormalized convenience that can drift, and has.
 */

export interface IAppointment extends Document {
  vapiCallId: string;
  /** Vapi phone number id — how legacy webhook rows resolve their owner. */
  phoneNumberId: string;
  status: 'booked' | 'cancelled';
  /** Owning user. Always set on new rows; backfilled on legacy ones. */
  accountId?: string;
  /** Which agent booked it, for per-assistant reporting. */
  assistantId?: mongoose.Types.ObjectId;
  /** The lead this visit came from, when the call could be attributed to one. */
  leadId?: mongoose.Types.ObjectId;
  appointmentData: {
    title: string;
    startTime: string; // ISO string
    endTime: string; // ISO string
    customer: {
      name: string;
      phone: string;
      email?: string;
    };
    notes?: string;
  };
  callData: {
    duration?: number;
    summary?: string;
    transcript?: string;
    endReason?: string;
  };
  calendarEventId?: string;
  /**
   * IANA zone of the *business*, captured at booking time.
   *
   * Times are stored as UTC instants, so rendering them in the viewer's local
   * zone shows a dispatcher abroad "9:00 PM" for a visit the agent promised at
   * 4 PM. The technician's day happens in the business's zone, so that is the
   * one worth displaying.
   */
  timezone?: string;
  /** 'speed_to_lead_in_call' | 'vapi_webhook' (legacy end-of-call extraction). */
  source?: string;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointment>({
  vapiCallId: {
    type: String,
    required: true,
    index: true
  },
  phoneNumberId: {
    type: String,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['booked', 'cancelled'],
    default: 'booked',
    index: true
  },
  accountId: { type: String, index: true },
  assistantId: {
    type: Schema.Types.ObjectId,
    ref: 'Assistant',
    default: null,
    index: true
  },
  leadId: {
    type: Schema.Types.ObjectId,
    ref: 'Lead',
    default: null,
    index: true
  },
  appointmentData: {
    title: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    customer: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String }
    },
    notes: { type: String }
  },
  callData: {
    duration: { type: Number },
    summary: { type: String },
    transcript: { type: String },
    endReason: { type: String }
  },
  calendarEventId: { type: String },
  timezone: { type: String },
  source: { type: String, default: 'speed_to_lead_in_call' },
  cancelledAt: { type: Date },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { collection: 'appointments' });

AppointmentSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

AppointmentSchema.index({ accountId: 1, status: 1 });
AppointmentSchema.index({ phoneNumberId: 1, status: 1 });
AppointmentSchema.index({ createdAt: -1 });

const Appointment =
  mongoose.models.Appointment || mongoose.model<IAppointment>('Appointment', AppointmentSchema);

export default Appointment;
