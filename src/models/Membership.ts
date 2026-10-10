import { Schema, model, models, Document } from 'mongoose';

/** Links a Clerk user to the account they work in. One account per person for now. */
export interface IMembership extends Document {
  accountId: string;
  userId: string;
  role: 'owner' | 'member';
  email?: string;
  createdAt: Date;
}

const MembershipSchema = new Schema<IMembership>(
  {
    accountId: { type: String, required: true, index: true },
    userId: { type: String, required: true, unique: true },
    role: { type: String, enum: ['owner', 'member'], default: 'owner' },
    email: { type: String, lowercase: true, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default models.Membership || model<IMembership>('Membership', MembershipSchema);
