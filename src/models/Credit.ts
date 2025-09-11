import { Schema, model, models, Document, ObjectId } from 'mongoose';

export interface ICredit extends Document {
  _id: ObjectId;
  userId: string;
  
  // Transaction details
  transactionType: 'topup' | 'usage' | 'assistant_purchase' | 'refund';
  amount: number;                    // Positive for topup/refund, negative for usage
  description: string;
  
  // Related data
  relatedAssistantId?: ObjectId;     // If purchasing assistant
  relatedCallId?: string;            // If call usage
  relatedOrderId?: string;           // PayPal order ID for topups
  
  // Balance tracking
  balanceBefore: number;
  balanceAfter: number;
  
  // Metadata
  createdAt: Date;
  metadata?: Record<string, any>;    // Additional transaction data
}

const CreditSchema = new Schema<ICredit>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  
  transactionType: {
    type: String,
    enum: ['topup', 'usage', 'assistant_purchase', 'refund'],
    required: true
  },
  
  amount: {
    type: Number,
    required: true
  },
  
  description: {
    type: String,
    required: true
  },
  
  // Related data (optional)
  relatedAssistantId: {
    type: Schema.Types.ObjectId,
    ref: 'Assistant'
  },
  relatedCallId: {
    type: String
  },
  relatedOrderId: {
    type: String
  },
  
  // Balance tracking
  balanceBefore: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  metadata: {
    type: Schema.Types.Mixed
  }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: false }
});

// Compound indexes for performance
CreditSchema.index({ userId: 1, createdAt: -1 });
CreditSchema.index({ userId: 1, transactionType: 1 });
CreditSchema.index({ relatedOrderId: 1 });

// Static methods for creating credit transactions
CreditSchema.statics.createTopup = async function(
  userId: string, 
  amount: number, 
  description: string, 
  orderId: string,
  currentBalance: number
) {
  const credit = new this({
    userId,
    transactionType: 'topup',
    amount,
    description,
    relatedOrderId: orderId,
    balanceBefore: currentBalance,
    balanceAfter: currentBalance + amount
  });
  
  return await credit.save();
};

CreditSchema.statics.createUsage = async function(
  userId: string,
  amount: number,
  description: string,
  callId: string,
  currentBalance: number
) {
  const credit = new this({
    userId,
    transactionType: 'usage',
    amount: -Math.abs(amount), // Ensure negative
    description,
    relatedCallId: callId,
    balanceBefore: currentBalance,
    balanceAfter: currentBalance - Math.abs(amount)
  });
  
  return await credit.save();
};

CreditSchema.statics.createAssistantPurchase = async function(
  userId: string,
  assistantId: ObjectId,
  assistantName: string,
  currentBalance: number
) {
  const amount = 20; // Fixed cost for assistant
  const credit = new this({
    userId,
    transactionType: 'assistant_purchase',
    amount: -amount,
    description: `Assistant purchase: ${assistantName}`,
    relatedAssistantId: assistantId,
    balanceBefore: currentBalance,
    balanceAfter: currentBalance - amount
  });
  
  return await credit.save();
};

const Credit = models.Credit || model<ICredit>('Credit', CreditSchema);
export default Credit;