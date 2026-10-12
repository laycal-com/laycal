import { Schema, model, models, Document } from 'mongoose';

/**
 * The customer: a business, not a person or a plan.
 *
 * Everything a customer owns (leads, assistants, appointments, phone
 * providers, calendar connections, credits) hangs off the account id. People
 * reach an account through a Membership, so a second login for the same
 * business later needs no data migration.
 */
export interface IAccount extends Document {
  name: string;
  /** invited: created by an admin, nobody has signed in yet. */
  status: 'invited' | 'active' | 'suspended';
  /** Owner's email, lower-cased. Used to link an invited account on first sign-in. */
  email: string;
  ownerUserId?: string;

  industry?: string;
  phone?: string;
  timezone?: string;
  website?: string;

  /** Price per calling minute in USD. Null means "use the platform default". */
  ratePerMinute: number | null;
  /** Prepaid balance in USD. Only ever changed through lib/billing. */
  creditBalance: number;
  /** Lifetime count, never decremented, so deleting an assistant cannot earn another free one. */
  assistantsCreatedTotal: number;

  /** Email notifications. Absent means: all on, sent to `email`. */
  notifications?: {
    email?: string;
    booked?: boolean;
    unreached?: boolean;
    stopped?: boolean;
    low?: boolean;
  };

  onboardedAt?: Date;
  tourDismissedAt?: Date;
  createdBy: 'admin' | 'self';
  createdAt: Date;
  updatedAt: Date;
}

const AccountSchema = new Schema<IAccount>(
  {
    name: { type: String, default: '', trim: true },
    status: { type: String, enum: ['invited', 'active', 'suspended'], default: 'active', index: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    // Unique (when set) so two simultaneous first requests cannot each create an account for one person.
    ownerUserId: { type: String, unique: true, sparse: true },
    industry: { type: String, trim: true },
    phone: { type: String, trim: true },
    timezone: { type: String, trim: true },
    website: { type: String, trim: true },
    ratePerMinute: { type: Number, default: null, min: 0 },
    creditBalance: { type: Number, default: 0 },
    assistantsCreatedTotal: { type: Number, default: 0 },
    notifications: {
      type: {
        email: { type: String, lowercase: true, trim: true },
        booked: { type: Boolean, default: true },
        unreached: { type: Boolean, default: true },
        stopped: { type: Boolean, default: true },
        low: { type: Boolean, default: true },
      },
      default: undefined,
      _id: false,
    },
    onboardedAt: { type: Date },
    tourDismissedAt: { type: Date },
    createdBy: { type: String, enum: ['admin', 'self'], default: 'self' },
  },
  { timestamps: true }
);

export default models.Account || model<IAccount>('Account', AccountSchema);
