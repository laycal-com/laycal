import mongoose, { Document, Schema } from 'mongoose';

export interface IAdminCreditTransaction extends Document {
  userId: string; // Target user's Clerk ID
  adminId: string; // Admin who made the change
  adminName: string;
  type: 'admin_add' | 'admin_remove' | 'admin_adjustment';
  amount: number; // Positive for add, negative for remove
  reason: string;
  previousBalance: number;
  newBalance: number;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const adminCreditTransactionSchema = new Schema<IAdminCreditTransaction>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  adminId: {
    type: String,
    required: true,
    index: true
  },
  adminName: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['admin_add', 'admin_remove', 'admin_adjustment'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  previousBalance: {
    type: Number,
    required: true
  },
  newBalance: {
    type: Number,
    required: true
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Add indexes
adminCreditTransactionSchema.index({ userId: 1, createdAt: -1 });
adminCreditTransactionSchema.index({ adminId: 1, createdAt: -1 });
adminCreditTransactionSchema.index({ type: 1, createdAt: -1 });

// Static method to create admin credit transaction
adminCreditTransactionSchema.statics.createAdminTransaction = async function(
  userId: string,
  adminId: string,
  adminName: string,
  type: 'admin_add' | 'admin_remove' | 'admin_adjustment',
  amount: number,
  reason: string,
  previousBalance: number,
  newBalance: number,
  metadata?: Record<string, any>
) {
  return this.create({
    userId,
    adminId,
    adminName,
    type,
    amount,
    reason,
    previousBalance,
    newBalance,
    metadata: metadata || {}
  });
};

export default mongoose.models.AdminCreditTransaction || mongoose.model<IAdminCreditTransaction>('AdminCreditTransaction', adminCreditTransactionSchema);