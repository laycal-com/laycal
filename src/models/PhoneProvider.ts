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

// Encryption helpers
const algorithm = 'aes-256-gcm';
const secretKey = process.env.PHONE_PROVIDER_ENCRYPTION_KEY || 'default-32-char-secret-key-change-me!';

// Ensure key is exactly 32 bytes
const key = crypto.scryptSync(secretKey, 'salt', 32);

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipherGCM(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

function decrypt(encryptedData: string): string {
  const parts = encryptedData.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format');
  }
  
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  
  const decipher = crypto.createDecipherGCM(algorithm, key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
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