import mongoose, { Document, Schema } from 'mongoose';

export interface IContactSubmission extends Document {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  message: string;
  type: 'general' | 'enterprise' | 'support' | 'partnership' | 'demo';
  status: 'new' | 'contacted' | 'qualified' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string; // Admin ID
  tags: string[];
  notes: Array<{
    adminId: string;
    adminName: string;
    note: string;
    createdAt: Date;
  }>;
  followUpDate?: Date;
  source?: string; // Where the form was submitted from
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const contactSubmissionSchema = new Schema<IContactSubmission>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  company: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['general', 'enterprise', 'support', 'partnership', 'demo'],
    default: 'general'
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'closed'],
    default: 'new'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  assignedTo: {
    type: String // Admin ID
  },
  tags: [String],
  notes: [{
    adminId: { type: String, required: true },
    adminName: { type: String, required: true },
    note: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  followUpDate: {
    type: Date
  },
  source: {
    type: String,
    default: 'website'
  },
  ipAddress: String,
  userAgent: String
}, {
  timestamps: true
});

// Add indexes
contactSubmissionSchema.index({ status: 1, createdAt: -1 });
contactSubmissionSchema.index({ assignedTo: 1 });
contactSubmissionSchema.index({ type: 1 });
contactSubmissionSchema.index({ priority: 1, createdAt: -1 });
contactSubmissionSchema.index({ email: 1 });

export default mongoose.models.ContactSubmission || mongoose.model<IContactSubmission>('ContactSubmission', contactSubmissionSchema);