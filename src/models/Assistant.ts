import mongoose, { Schema, Document, ObjectId } from 'mongoose';

export interface IAssistant extends Document {
  _id: ObjectId;
  userId: string;
  name: string;
  vapiAssistantId: string;
  
  voice: {
    gender: 'male' | 'female';
    provider: string;
    voiceId: string;
  };
  
  mainPrompt: string;
  language: string;
  
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
  userId: {
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

AssistantSchema.index({ userId: 1, name: 1 }, { unique: true });
AssistantSchema.index({ userId: 1, isActive: 1 });
AssistantSchema.index({ 'phoneNumbers.phoneNumber': 1 });

AssistantSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.Assistant || mongoose.model<IAssistant>('Assistant', AssistantSchema);