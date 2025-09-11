import mongoose, { Schema, Document } from 'mongoose';
import { encrypt, decrypt } from '@/models/PhoneProvider';

export interface ICalendarConnection extends Document {
  userId: string;
  provider: 'google' | 'outlook' | 'ical';
  isActive: boolean;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  calendarId?: string;
  lastSync?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CalendarConnectionSchema = new Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  provider: {
    type: String,
    enum: ['google', 'outlook', 'ical'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  accessToken: {
    type: String,
    set: function(token: string) {
      return token ? encrypt(token) : token;
    },
    get: function(encryptedToken: string) {
      return encryptedToken ? decrypt(encryptedToken) : encryptedToken;
    }
  },
  refreshToken: {
    type: String,
    set: function(token: string) {
      return token ? encrypt(token) : token;
    },
    get: function(encryptedToken: string) {
      return encryptedToken ? decrypt(encryptedToken) : encryptedToken;
    }
  },
  tokenExpiry: {
    type: Date
  },
  calendarId: {
    type: String
  },
  lastSync: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Ensure only one active connection per provider per user
CalendarConnectionSchema.index({ userId: 1, provider: 1 }, { unique: true });

export default mongoose.models.CalendarConnection || mongoose.model<ICalendarConnection>('CalendarConnection', CalendarConnectionSchema);