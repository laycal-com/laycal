import mongoose, { Document, Schema } from 'mongoose';

export interface ILead extends Document {
  accountId: string;
  name: string;
  phoneNumber: string;
  email?: string;
  company?: string;
  notes?: string;
  /** Service address the technician is dispatched to. */
  address?: string;
  /** Free text from the intake form describing the problem. */
  details?: string;
  /** Free text describing when the homeowner said they're available. */
  availability?: string;
  /** Trade/service the lead asked for, surfaced to the agent as customer.service_type. */
  serviceType?: string;
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
  /** Where the lead came from. Decides, for one, whether "couldn't reach" is emailed (forms only). */
  source?: 'form' | 'upload' | null;
  /** Why a lead that was not spoken to ended that way. Null while in progress or once answered. */
  outcome?: 'no_answer' | 'no_credits' | 'not_placed' | 'invalid_number' | 'stopped' | null;
  /** Calls placed in the current round. A manual Retry on a finished lead starts a new round. */
  tries?: number;
  /** One entry per call placed, oldest first. */
  attempts?: {
    vapiCallId: string;
    startedAt: Date;
    endedAt?: Date | null;
    result?: 'answered' | 'no_answer' | 'busy' | 'voicemail' | 'not_connected' | null;
    endReason?: string | null;
  }[];
  /** Set while the lead waits for a call: a held night-time lead or the next try. */
  nextCallAt?: Date | null;
  /** The phone provider an uploaded list was assigned, so later tries use the same number. */
  phoneProviderId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  calledAt?: Date;
}

const LeadSchema = new Schema<ILead>({
  accountId: {
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
  address: {
    type: String,
    default: null
  },
  details: {
    type: String,
    default: null
  },
  availability: {
    type: String,
    default: null
  },
  serviceType: {
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
  source: {
    type: String,
    enum: ['form', 'upload', null],
    default: null
  },
  outcome: {
    type: String,
    enum: ['no_answer', 'no_credits', 'not_placed', 'invalid_number', 'stopped', null],
    default: null
  },
  tries: {
    type: Number,
    default: 0
  },
  attempts: {
    type: [
      new Schema(
        {
          vapiCallId: { type: String, required: true },
          startedAt: { type: Date, required: true },
          endedAt: { type: Date, default: null },
          result: {
            type: String,
            enum: ['answered', 'no_answer', 'busy', 'voicemail', 'not_connected', null],
            default: null
          },
          endReason: { type: String, default: null }
        },
        { _id: false }
      )
    ],
    default: []
  },
  nextCallAt: {
    type: Date,
    default: null
  },
  phoneProviderId: {
    type: String,
    default: null
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

LeadSchema.index({ accountId: 1, createdAt: -1 });
LeadSchema.index({ status: 1 });
LeadSchema.index({ vapiCallId: 1 });
LeadSchema.index({ assignedAssistantId: 1 });
LeadSchema.index({ accountId: 1, assignedAssistantId: 1 });
// The wake-up looks for leads whose call is due, and for calls that never reported back.
LeadSchema.index({ status: 1, nextCallAt: 1 });
LeadSchema.index({ status: 1, calledAt: 1 });
LeadSchema.index({ assignedAssistantId: 1, phoneNumber: 1, createdAt: -1 });

export default mongoose.models.Lead || mongoose.model<ILead>('Lead', LeadSchema);