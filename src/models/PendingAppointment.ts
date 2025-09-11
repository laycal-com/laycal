import mongoose, { Schema, Document } from 'mongoose';

export interface IPendingAppointment extends Document {
  vapiCallId: string;
  phoneNumberId: string; // Vapi phone number ID for user association
  status: 'pending_confirmation' | 'confirmed' | 'rejected';
  appointmentData: {
    title: string;
    startTime: string; // ISO string
    endTime: string;   // ISO string
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
  confirmedBy?: string; // userId who confirmed
  confirmedAt?: Date;
  calendarEventId?: string; // Google Calendar event ID after confirmation
  createdAt: Date;
  updatedAt: Date;
}

const PendingAppointmentSchema = new Schema<IPendingAppointment>({
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
    enum: ['pending_confirmation', 'confirmed', 'rejected'],
    default: 'pending_confirmation',
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
  confirmedBy: { type: String }, // userId
  confirmedAt: { type: Date },
  calendarEventId: { type: String },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
PendingAppointmentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indexes for efficient queries
PendingAppointmentSchema.index({ phoneNumberId: 1, status: 1 });
PendingAppointmentSchema.index({ vapiCallId: 1 });
PendingAppointmentSchema.index({ createdAt: -1 });

const PendingAppointment = mongoose.models.PendingAppointment || 
  mongoose.model<IPendingAppointment>('PendingAppointment', PendingAppointmentSchema);

export default PendingAppointment;