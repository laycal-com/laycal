import { Schema, model, models, Document, ObjectId } from 'mongoose';

export interface IUsageTracking extends Document {
  _id: ObjectId;
  userId: string;
  month: string;                     // Format: "2025-01"
  year: number;
  
  // Detailed usage breakdown
  totalMinutesUsed: number;
  totalCalls: number;
  assistantUsage: Array<{
    assistantId: ObjectId;
    assistantName: string;
    minutesUsed: number;
    callsMade: number;
    lastUsedAt: Date;
  }>;
  
  // Daily breakdown for analytics
  dailyUsage: Array<{
    date: Date;
    minutes: number;
    calls: number;
    costs: number;
  }>;
  
  // Cost tracking
  totalCost: number;
  overageCost: number;
  
  createdAt: Date;
  updatedAt: Date;
}

const UsageTrackingSchema = new Schema<IUsageTracking>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  month: {
    type: String,
    required: true,
    match: /^\d{4}-\d{2}$/ // YYYY-MM format
  },
  year: {
    type: Number,
    required: true,
    min: 2020,
    max: 2050
  },
  
  // Detailed usage breakdown
  totalMinutesUsed: {
    type: Number,
    default: 0,
    min: 0
  },
  totalCalls: {
    type: Number,
    default: 0,
    min: 0
  },
  assistantUsage: [{
    assistantId: {
      type: Schema.Types.ObjectId,
      ref: 'Assistant',
      required: true
    },
    assistantName: {
      type: String,
      required: true
    },
    minutesUsed: {
      type: Number,
      default: 0,
      min: 0
    },
    callsMade: {
      type: Number,
      default: 0,
      min: 0
    },
    lastUsedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Daily breakdown for analytics
  dailyUsage: [{
    date: {
      type: Date,
      required: true
    },
    minutes: {
      type: Number,
      default: 0,
      min: 0
    },
    calls: {
      type: Number,
      default: 0,
      min: 0
    },
    costs: {
      type: Number,
      default: 0,
      min: 0
    }
  }],
  
  // Cost tracking
  totalCost: {
    type: Number,
    default: 0,
    min: 0
  },
  overageCost: {
    type: Number,
    default: 0,
    min: 0
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

// Compound indexes for performance
UsageTrackingSchema.index({ userId: 1, month: 1 }, { unique: true });
UsageTrackingSchema.index({ userId: 1, year: 1 });
UsageTrackingSchema.index({ year: 1, month: 1 });

// Methods
UsageTrackingSchema.methods.addCallUsage = function(assistantId: ObjectId, assistantName: string, minutes: number, cost: number): void {
  // Update total usage
  this.totalMinutesUsed += minutes;
  this.totalCalls += 1;
  this.totalCost += cost;
  
  // Update assistant-specific usage
  const assistantUsage = this.assistantUsage.find(
    (usage: any) => usage.assistantId.toString() === assistantId.toString()
  );
  
  if (assistantUsage) {
    assistantUsage.minutesUsed += minutes;
    assistantUsage.callsMade += 1;
    assistantUsage.lastUsedAt = new Date();
  } else {
    this.assistantUsage.push({
      assistantId,
      assistantName,
      minutesUsed: minutes,
      callsMade: 1,
      lastUsedAt: new Date()
    });
  }
  
  // Update daily usage
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dailyUsage = this.dailyUsage.find(
    (usage: any) => usage.date.getTime() === today.getTime()
  );
  
  if (dailyUsage) {
    dailyUsage.minutes += minutes;
    dailyUsage.calls += 1;
    dailyUsage.costs += cost;
  } else {
    this.dailyUsage.push({
      date: today,
      minutes,
      calls: 1,
      costs: cost
    });
  }
};

UsageTrackingSchema.methods.getTopAssistants = function(limit: number = 5) {
  return this.assistantUsage
    .sort((a: any, b: any) => b.minutesUsed - a.minutesUsed)
    .slice(0, limit);
};

UsageTrackingSchema.methods.getDailyAverage = function(): number {
  const daysWithUsage = this.dailyUsage.length;
  if (daysWithUsage === 0) return 0;
  return this.totalMinutesUsed / daysWithUsage;
};

// Static methods
UsageTrackingSchema.statics.findOrCreateForMonth = async function(userId: string, date?: Date) {
  const targetDate = date || new Date();
  const month = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
  const year = targetDate.getFullYear();
  
  let usage = await this.findOne({ userId, month });
  
  if (!usage) {
    usage = new this({
      userId,
      month,
      year,
      totalMinutesUsed: 0,
      totalCalls: 0,
      assistantUsage: [],
      dailyUsage: [],
      totalCost: 0,
      overageCost: 0
    });
    await usage.save();
  }
  
  return usage;
};

const UsageTracking = models.UsageTracking || model<IUsageTracking>('UsageTracking', UsageTrackingSchema);

export default UsageTracking;