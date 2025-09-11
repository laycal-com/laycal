import mongoose, { Document, Schema } from 'mongoose';

export interface ILead extends Document {
  userId: string;
  name: string;
  phoneNumber: string;
  email?: string;
  company?: string;
  notes?: string;
  status: 'pending' | 'calling' | 'completed' | 'failed';
  vapiCallId?: string;
  assignedAssistantId?: mongoose.Types.ObjectId;
  assignedPhoneNumber?: string;
  callResults?: {
    answered: boolean;
    duration?: number;
    summary?: string;
    transcript?: string;
    endReason?: string;
    cost?: number;
    evaluation?: 'positive' | 'neutral' | 'negative';
    appointmentCreated?: boolean;
    appointmentTitle?: string;
    appointmentTime?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  calledAt?: Date;
}

const LeadSchema = new Schema<ILead>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  email: {
    type: String,
    default: null
  },
  company: {
    type: String,
    default: null
  },
  notes: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'calling', 'completed', 'failed'],
    default: 'pending'
  },
  vapiCallId: {
    type: String,
    default: null
  },
  assignedAssistantId: {
    type: Schema.Types.ObjectId,
    ref: 'Assistant',
    default: null
  },
  assignedPhoneNumber: {
    type: String,
    default: null
  },
  callResults: {
    answered: {
      type: Boolean,
      default: null
    },
    duration: {
      type: Number,
      default: null
    },
    summary: {
      type: String,
      default: null
    },
    transcript: {
      type: String,
      default: null
    },
    endReason: {
      type: String,
      default: null
    },
    cost: {
      type: Number,
      default: null
    },
    evaluation: {
      type: String,
      enum: ['positive', 'neutral', 'negative'],
      default: null
    },
    appointmentCreated: {
      type: Boolean,
      default: false
    },
    appointmentTitle: {
      type: String,
      default: null
    },
    appointmentTime: {
      type: String,
      default: null
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  calledAt: {
    type: Date,
    default: null
  }
});

LeadSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

LeadSchema.index({ userId: 1, createdAt: -1 });
LeadSchema.index({ status: 1 });
LeadSchema.index({ vapiCallId: 1 });
LeadSchema.index({ assignedAssistantId: 1 });
LeadSchema.index({ userId: 1, assignedAssistantId: 1 });

export default mongoose.models.Lead || mongoose.model<ILead>('Lead', LeadSchema);