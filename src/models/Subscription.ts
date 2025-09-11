import { Schema, model, models, Document, ObjectId } from 'mongoose';

export interface ISubscription extends Document {
  _id: ObjectId;
  userId: string;
  
  // Plan details
  planType: 'starter' | 'growth' | 'pro' | 'enterprise' | 'payg';
  planName: string;
  monthlyPrice: number;
  
  // Usage limits
  monthlyMinuteLimit: number;        // -1 for unlimited
  assistantLimit: number;            // -1 for unlimited
  
  // Current usage tracking
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  minutesUsed: number;
  assistantsCreated: number;
  
  // Add-ons
  extraMinutes: number;              // Purchased extra minutes
  extraAssistants: number;           // Purchased extra assistants
  
  // Credit-based billing (for hybrid model)
  creditBalance: number;             // Current account balance in USD
  autoTopupEnabled: boolean;         // Auto top-up when balance is low
  autoTopupAmount: number;           // Amount to auto top-up
  minimumBalance: number;            // Minimum balance threshold
  
  // Payment details
  paypalSubscriptionId?: string;     // PayPal subscription ID
  isActive: boolean;
  isTrial: boolean;
  trialEndsAt?: Date;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  cancelledAt?: Date;
}

const SubscriptionSchema = new Schema<ISubscription>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  
  // Plan details
  planType: {
    type: String,
    enum: ['starter', 'growth', 'pro', 'enterprise', 'payg'],
    required: true
  },
  planName: {
    type: String,
    required: true
  },
  monthlyPrice: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Usage limits
  monthlyMinuteLimit: {
    type: Number,
    required: true,
    min: -1 // -1 means unlimited
  },
  assistantLimit: {
    type: Number,
    required: true,
    min: -1 // -1 means unlimited
  },
  
  // Current usage tracking
  currentPeriodStart: {
    type: Date,
    required: true,
    default: Date.now
  },
  currentPeriodEnd: {
    type: Date,
    required: true,
    default: function() {
      const date = new Date();
      date.setMonth(date.getMonth() + 1);
      return date;
    }
  },
  minutesUsed: {
    type: Number,
    default: 0,
    min: 0
  },
  assistantsCreated: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Add-ons
  extraMinutes: {
    type: Number,
    default: 0,
    min: 0
  },
  extraAssistants: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Credit-based billing (for hybrid model)
  creditBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  autoTopupEnabled: {
    type: Boolean,
    default: false
  },
  autoTopupAmount: {
    type: Number,
    default: 5,
    min: 5
  },
  minimumBalance: {
    type: Number,
    default: 5,
    min: 0
  },
  
  // Payment details
  paypalSubscriptionId: {
    type: String,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isTrial: {
    type: Boolean,
    default: false
  },
  trialEndsAt: {
    type: Date
  },
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  cancelledAt: {
    type: Date
  }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

// Compound indexes for performance
SubscriptionSchema.index({ userId: 1, isActive: 1 });
SubscriptionSchema.index({ currentPeriodEnd: 1 });
SubscriptionSchema.index({ paypalSubscriptionId: 1 });

// Methods
SubscriptionSchema.methods.getTotalMinuteLimit = function(): number {
  if (this.monthlyMinuteLimit === -1) return -1; // Unlimited
  return this.monthlyMinuteLimit + this.extraMinutes;
};

SubscriptionSchema.methods.getTotalAssistantLimit = function(): number {
  if (this.assistantLimit === -1) return -1; // Unlimited
  return this.assistantLimit + this.extraAssistants;
};

SubscriptionSchema.methods.getMinutesRemaining = function(): number {
  const totalLimit = this.getTotalMinuteLimit();
  if (totalLimit === -1) return -1; // Unlimited
  return Math.max(0, totalLimit - this.minutesUsed);
};

SubscriptionSchema.methods.getAssistantsRemaining = function(): number {
  const totalLimit = this.getTotalAssistantLimit();
  if (totalLimit === -1) return -1; // Unlimited
  return Math.max(0, totalLimit - this.assistantsCreated);
};

// Credit-based methods
SubscriptionSchema.methods.deductCredits = function(amount: number): boolean {
  if (this.creditBalance >= amount) {
    this.creditBalance -= amount;
    return true;
  }
  return false;
};

SubscriptionSchema.methods.addCredits = function(amount: number): void {
  this.creditBalance += amount;
};

SubscriptionSchema.methods.needsTopup = function(): boolean {
  return this.creditBalance <= this.minimumBalance;
};

SubscriptionSchema.methods.canAffordCall = function(estimatedCost: number): boolean {
  // For subscription plans, check if they have quota or credits
  if (this.planType !== 'payg') {
    const minutesRemaining = this.getMinutesRemaining();
    if (minutesRemaining > 0) return true; // Has quota
    return this.creditBalance >= estimatedCost; // Fallback to credits
  }
  
  // For PAYG, only check credits
  return this.creditBalance >= estimatedCost;
};

SubscriptionSchema.methods.canAffordAssistant = function(): { canAfford: boolean; cost: number; useCredits: boolean } {
  // For subscription plans, check if they have quota or use credits
  if (this.planType !== 'payg') {
    const assistantsRemaining = this.getAssistantsRemaining();
    if (assistantsRemaining > 0) {
      return { canAfford: true, cost: 0, useCredits: false }; // Has quota
    }
    return { canAfford: this.creditBalance >= 20, cost: 20, useCredits: true }; // Use credits
  }
  
  // For PAYG, always use credits
  return { canAfford: this.creditBalance >= 20, cost: 20, useCredits: true };
};

SubscriptionSchema.methods.isInBillingPeriod = function(): boolean {
  const now = new Date();
  return now >= this.currentPeriodStart && now <= this.currentPeriodEnd;
};

SubscriptionSchema.methods.resetBillingPeriod = function(): void {
  const now = new Date();
  this.currentPeriodStart = now;
  this.currentPeriodEnd = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
  this.minutesUsed = 0;
  // Don't reset assistantsCreated - they persist across billing periods
};

// Static methods for plan definitions
SubscriptionSchema.statics.getPlanDetails = function(planType: string) {
  const plans = {
    starter: { minuteLimit: 500, assistantLimit: 1, price: 49 },
    growth: { minuteLimit: 2000, assistantLimit: 3, price: 149 },
    pro: { minuteLimit: 7000, assistantLimit: 10, price: 399 },
    enterprise: { minuteLimit: -1, assistantLimit: -1, price: 999 },
    payg: { minuteLimit: -1, assistantLimit: -1, price: 19 }
  };
  return plans[planType as keyof typeof plans];
};

const Subscription = models.Subscription || model<ISubscription>('Subscription', SubscriptionSchema);

export default Subscription;