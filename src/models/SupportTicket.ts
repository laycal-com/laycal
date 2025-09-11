import mongoose, { Document, Schema } from 'mongoose';

export interface ISupportTicket extends Document {
  ticketId: string; // Human-readable ticket ID (e.g., SUP-001234)
  userId?: string; // Clerk user ID if submitted by logged-in user
  userEmail: string;
  userName?: string;
  subject: string;
  description: string;
  category: 'technical' | 'billing' | 'feature_request' | 'bug_report' | 'account' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_customer' | 'waiting_internal' | 'resolved' | 'closed';
  assignedTo?: string; // Admin ID
  tags: string[];
  
  // Conversation thread
  messages: Array<{
    id: string;
    from: 'user' | 'admin';
    authorId: string; // userId or adminId
    authorName: string;
    message: string;
    attachments?: Array<{
      filename: string;
      url: string;
      size: number;
      type: string;
    }>;
    isInternal: boolean; // Internal notes visible only to admins
    createdAt: Date;
  }>;
  
  // Metadata
  userSubscriptionType?: string;
  userCreditBalance?: number;
  relatedAssistantId?: string;
  relatedLeadId?: string;
  
  // Tracking
  firstResponseTime?: number; // Minutes
  resolutionTime?: number; // Minutes
  customerSatisfactionRating?: number; // 1-5
  customerFeedback?: string;
  
  resolvedAt?: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const supportTicketSchema = new Schema<ISupportTicket>({
  ticketId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: String // Clerk user ID
  },
  userEmail: {
    type: String,
    required: true,
    lowercase: true
  },
  userName: {
    type: String
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['technical', 'billing', 'feature_request', 'bug_report', 'account', 'general'],
    default: 'general'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'waiting_customer', 'waiting_internal', 'resolved', 'closed'],
    default: 'open'
  },
  assignedTo: {
    type: String // Admin ID
  },
  tags: [String],
  
  messages: [{
    id: { type: String, required: true },
    from: { 
      type: String, 
      enum: ['user', 'admin'], 
      required: true 
    },
    authorId: { type: String, required: true },
    authorName: { type: String, required: true },
    message: { type: String, required: true },
    attachments: [{
      filename: String,
      url: String,
      size: Number,
      type: String
    }],
    isInternal: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  
  // User context
  userSubscriptionType: String,
  userCreditBalance: Number,
  relatedAssistantId: String,
  relatedLeadId: String,
  
  // Performance tracking
  firstResponseTime: Number, // Minutes
  resolutionTime: Number, // Minutes
  customerSatisfactionRating: {
    type: Number,
    min: 1,
    max: 5
  },
  customerFeedback: String,
  
  resolvedAt: Date,
  closedAt: Date
}, {
  timestamps: true
});

// Add indexes
supportTicketSchema.index({ ticketId: 1 });
supportTicketSchema.index({ userId: 1, createdAt: -1 });
supportTicketSchema.index({ userEmail: 1, createdAt: -1 });
supportTicketSchema.index({ status: 1, priority: 1, createdAt: -1 });
supportTicketSchema.index({ assignedTo: 1, status: 1 });
supportTicketSchema.index({ category: 1 });
supportTicketSchema.index({ createdAt: -1 });

// Pre-save hook to generate ticket ID
supportTicketSchema.pre('save', async function(next) {
  if (!this.ticketId) {
    // Generate ticket ID: SUP-YYYYMMDD-XXXX
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await mongoose.model('SupportTicket').countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });
    this.ticketId = `SUP-${date}-${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

// Method to add message
supportTicketSchema.methods.addMessage = function(messageData: {
  from: 'user' | 'admin';
  authorId: string;
  authorName: string;
  message: string;
  attachments?: any[];
  isInternal?: boolean;
}) {
  const message = {
    id: new mongoose.Types.ObjectId().toString(),
    ...messageData,
    isInternal: messageData.isInternal || false,
    createdAt: new Date()
  };
  
  this.messages.push(message);
  
  // Update first response time if this is the first admin response
  if (messageData.from === 'admin' && !this.firstResponseTime) {
    const createdTime = new Date(this.createdAt).getTime();
    const responseTime = new Date().getTime();
    this.firstResponseTime = Math.round((responseTime - createdTime) / (1000 * 60)); // Minutes
  }
  
  return message;
};

export default mongoose.models.SupportTicket || mongoose.model<ISupportTicket>('SupportTicket', supportTicketSchema);