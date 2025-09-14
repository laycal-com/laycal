import mongoose, { Document, Schema } from 'mongoose';
import crypto from 'crypto';

export interface IPhoneProvider extends Document {
  userId: string;
  providerName: 'twilio' | 'plivo' | 'nexmo';
  displayName: string;
  phoneNumber: string;
  credentials: {
    accountSid?: string;
    authToken?: string;
    apiKey?: string;
    apiSecret?: string;
    [key: string]: any;
  };
  isActive: boolean;
  isDefault: boolean;
  vapiPhoneNumberId?: string; // Stores the Vapi phone number ID created via API
  lastTestedAt?: Date;
  testStatus?: 'success' | 'failed' | 'pending';
  testMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PhoneProviderSchema = new Schema<IPhoneProvider>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  providerName: {
    type: String,
    enum: ['twilio', 'plivo', 'nexmo'],
    required: true
  },
  displayName: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true,
    validate: {
      validator: function(v: string) {
        return /^\+[1-9]\d{1,14}$/.test(v); // E.164 format
      },
      message: 'Phone number must be in E.164 format (e.g., +1234567890)'
    }
  },
  credentials: {
    type: Schema.Types.Mixed,
    required: true,
    set: function(credentials: any) {
      // Encrypt sensitive credentials before storing
      if (!credentials) return credentials;
      
      const encrypted = { ...credentials };
      const sensitiveFields = ['authToken', 'apiSecret', 'apiKey'];
      
      sensitiveFields.forEach(field => {
        if (encrypted[field]) {
          encrypted[field] = encrypt(encrypted[field]);
        }
      });
      
      return encrypted;
    },
    get: function(credentials: any) {
      // Decrypt sensitive credentials when retrieving
      if (!credentials) return credentials;
      
      const decrypted = { ...credentials };
      const sensitiveFields = ['authToken', 'apiSecret', 'apiKey'];
      
      sensitiveFields.forEach(field => {
        if (decrypted[field]) {
          try {
            decrypted[field] = decrypt(decrypted[field]);
          } catch (error) {
            console.error(`Failed to decrypt ${field}:`, error);
            decrypted[field] = null;
          }
        }
      });
      
      return decrypted;
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  vapiPhoneNumberId: {
    type: String,
    default: null
  },
  lastTestedAt: {
    type: Date,
    default: null
  },
  testStatus: {
    type: String,
    enum: ['success', 'failed', 'pending'],
    default: null
  },
  testMessage: {
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
  }
});

// Encryption helpers - using modern Node.js crypto methods that work on Vercel
const algorithm = 'aes-256-cbc';
const secretKey = process.env.PHONE_PROVIDER_ENCRYPTION_KEY || 'default-32-char-secret-key-change-me!';

// Ensure key is exactly 32 bytes for AES-256
const key = crypto.scryptSync(secretKey, 'salt', 32);

// Temporary fix: Disable encryption due to Vercel crypto compatibility issues
// TODO: Implement proper encryption using crypto.createCipher alternatives
function encrypt(text: string): string {
  // Simple base64 encoding for now (NOT SECURE - temporary fix)
  return Buffer.from(text).toString('base64');
}

function decrypt(encryptedData: string): string {
  try {
    // Simple base64 decoding
    return Buffer.from(encryptedData, 'base64').toString('utf8');
  } catch (error) {
    // If decoding fails, return original data
    return encryptedData;
  }
}

// Middleware
PhoneProviderSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Ensure only one default provider per user
PhoneProviderSchema.pre('save', async function(next) {
  if (this.isDefault && this.isModified('isDefault')) {
    await mongoose.model('PhoneProvider').updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

// Indexes
PhoneProviderSchema.index({ userId: 1, isDefault: 1 });
PhoneProviderSchema.index({ userId: 1, isActive: 1 });
PhoneProviderSchema.index({ userId: 1, providerName: 1 });

// Ensure toJSON includes getters (for decryption)
PhoneProviderSchema.set('toJSON', { getters: true });
PhoneProviderSchema.set('toObject', { getters: true });

// Export encryption functions for reuse in other models
export { encrypt, decrypt };

export default mongoose.models.PhoneProvider || mongoose.model<IPhoneProvider>('PhoneProvider', PhoneProviderSchema);