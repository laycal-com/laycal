import mongoose from 'mongoose';

export interface ICallSummary {
  _id: string;
  userId: string;
  vapiCallId: string;
  phoneNumberId: string; // Vapi phone number ID as identifier
  leadId?: string; // Optional - might not have lead for standalone calls
  
  // Call information
  callData: {
    duration?: number;
    endReason?: string;
    status: 'completed' | 'failed' | 'no-answer' | 'busy';
    cost?: number;
    startTime?: Date;
    endTime?: Date;
  };
  
  // Call content
  transcript?: string;
  summary?: string;
  evaluation?: 'positive' | 'negative' | 'neutral';
  stereoRecordingUrl?: string;
  
  // Structured data extracted from call
  structuredData?: {
    [key: string]: any; // Flexible structure for custom data fields
  };
  
  // Standard extracted fields
  extractedInfo: {
    name?: string;
    email?: string;
    phoneNumber?: string;
    appointmentTime?: string; // ISO string for slot_booked
    [key: string]: any; // Additional custom fields
  };
  
  // Appointment information if applicable
  appointmentCreated?: boolean;
  appointmentData?: {
    title?: string;
    startTime?: string;
    endTime?: string;
    confirmed?: boolean;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

const CallSummarySchema = new mongoose.Schema<ICallSummary>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  vapiCallId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  phoneNumberId: {
    type: String,
    required: true,
    index: true
  },
  leadId: {
    type: String,
    index: true
  },
  
  callData: {
    duration: Number,
    endReason: String,
    status: {
      type: String,
      enum: ['completed', 'failed', 'no-answer', 'busy'],
      required: true
    },
    cost: Number,
    startTime: Date,
    endTime: Date
  },
  
  transcript: String,
  summary: String,
  evaluation: {
    type: String,
    enum: ['positive', 'negative', 'neutral']
  },
  stereoRecordingUrl: String,
  
  structuredData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  extractedInfo: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
    required: true
  },
  
  appointmentCreated: {
    type: Boolean,
    default: false
  },
  appointmentData: {
    title: String,
    startTime: String,
    endTime: String,
    confirmed: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true,
  collection: 'callsummaries'
});

// Indexes for efficient queries
CallSummarySchema.index({ userId: 1, createdAt: -1 });
CallSummarySchema.index({ phoneNumberId: 1, createdAt: -1 });
CallSummarySchema.index({ leadId: 1 }, { sparse: true });
CallSummarySchema.index({ vapiCallId: 1 });
CallSummarySchema.index({ 'callData.status': 1 });

// Pre-save hook for updatedAt
CallSummarySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const CallSummary = mongoose.models.CallSummary || mongoose.model<ICallSummary>('CallSummary', CallSummarySchema);

export default CallSummary;