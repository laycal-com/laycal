import mongoose, { Schema, Document, ObjectId } from 'mongoose';

export interface IAssistant extends Document {
  _id: ObjectId;
  accountId: string;
  name: string;
  vapiAssistantId: string;
  
  voice: {
    gender: 'male' | 'female';
    provider: string;
    voiceId: string;
  };
  
  mainPrompt: string;
  language: string;

  /**
   * Speed-to-lead configuration. Optional so assistants created by the previous
   * prompt wizard keep working untouched — only the new flow populates these.
   */
  serviceConfig?: {
    vertical: string;
    /** Set when vertical is 'other': the customer's own description of their trade. */
    customTrade?: { label: string; description: string; booking: string };
    clientCompany: string;
    serviceArea?: string;
    timezone: string;
    businessHours: Record<string, { open: string; close: string }>;
    appointmentDurationMins: number;
    bookingHorizonDays: number;
    diagnosticFee?: string;
  };

  /**
   * When and how often leads are called. Optional: assistants created before
   * this existed read as the defaults (see `callingRulesOf`).
   */
  callingRules?: {
    retry?: boolean;
    maxCalls?: number;
    holdOutsideHours?: boolean;
    callFrom?: string;
    callUntil?: string;
  };

  phoneNumbers: Array<{
    phoneNumber: string;
    phoneProviderId: ObjectId;
    isPrimary: boolean;
  }>;
  
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastUsed?: Date;
}

const AssistantSchema = new Schema<IAssistant>({
  accountId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  vapiAssistantId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  voice: {
    gender: {
      type: String,
      enum: ['male', 'female'],
      required: true
    },
    provider: {
      type: String,
      required: true
    },
    voiceId: {
      type: String,
      required: true
    }
  },
  mainPrompt: {
    type: String,
    required: true,
    maxlength: 10000
  },
  language: {
    type: String,
    required: true,
    enum: ['en-US', 'es-ES', 'fr-FR', 'de-DE'],
    default: 'en-US'
  },
  serviceConfig: {
    type: {
      vertical: { type: String, trim: true },
      customTrade: {
        type: new Schema(
          {
            label: { type: String, trim: true, maxlength: 80 },
            description: { type: String, trim: true, maxlength: 400 },
            booking: { type: String, trim: true, maxlength: 120 },
          },
          { _id: false }
        ),
      },
      clientCompany: { type: String, trim: true, maxlength: 120 },
      serviceArea: { type: String, trim: true, maxlength: 200 },
      timezone: { type: String, default: 'America/New_York' },
      // Keyed '0'..'6' (Sunday..Saturday); absent day = closed.
      businessHours: { type: Map, of: new Schema({ open: String, close: String }, { _id: false }) },
      appointmentDurationMins: { type: Number, default: 90, min: 15, max: 480 },
      bookingHorizonDays: { type: Number, default: 14, min: 1, max: 90 },
      diagnosticFee: { type: String, trim: true, maxlength: 60 }
    },
    required: false,
    default: undefined
  },
  callingRules: {
    type: {
      retry: { type: Boolean, default: true },
      maxCalls: { type: Number, default: 3, min: 1, max: 3 },
      holdOutsideHours: { type: Boolean, default: false },
      // 24-hour "HH:MM" in the assistant's time zone.
      callFrom: { type: String, default: '08:00', match: /^([01]\d|2[0-3]):[0-5]\d$/ },
      callUntil: { type: String, default: '21:00', match: /^([01]\d|2[0-3]):[0-5]\d$/ }
    },
    required: false,
    default: undefined,
    _id: false
  },
  phoneNumbers: [{
    phoneNumber: {
      type: String,
      required: true,
      match: /^\+\d{1,15}$/
    },
    phoneProviderId: {
      type: Schema.Types.ObjectId,
      ref: 'PhoneProvider',
      required: true
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastUsed: {
    type: Date,
    default: null
  }
});

AssistantSchema.index({ accountId: 1, name: 1 }, { unique: true });
AssistantSchema.index({ accountId: 1, isActive: 1 });
AssistantSchema.index({ 'phoneNumbers.phoneNumber': 1 });

AssistantSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.Assistant || mongoose.model<IAssistant>('Assistant', AssistantSchema);