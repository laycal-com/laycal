import { Schema, model, models, Document } from 'mongoose';

export interface IPendingTransaction extends Document {
  userId: string;
  orderId: string;
  amount: number;
  planType: string;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
}

const PendingTransactionSchema = new Schema<IPendingTransaction>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  planType: {
    type: String,
    required: true,
    enum: ['payg', 'credit-topup']
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

// Compound indexes
PendingTransactionSchema.index({ userId: 1, status: 1 });
PendingTransactionSchema.index({ orderId: 1, status: 1 });

// Static methods
PendingTransactionSchema.statics.createPending = function(
  userId: string,
  orderId: string, 
  amount: number,
  planType: string,
  description: string
) {
  return new this({
    userId,
    orderId,
    amount,
    planType,
    description,
    status: 'pending'
  });
};

const PendingTransaction = models.PendingTransaction || model<IPendingTransaction>('PendingTransaction', PendingTransactionSchema);
export default PendingTransaction;