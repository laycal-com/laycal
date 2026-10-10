import { Schema, model, models, Document } from 'mongoose';

/**
 * Every movement of an account's balance, one row each.
 *
 * `ref` is unique when present, which is what makes charging idempotent: a
 * second attempt to record the same call or the same PayPal order fails on the
 * index instead of moving money twice.
 */
export interface ICreditLedger extends Document {
  accountId: string;
  type: 'topup' | 'admin_grant' | 'admin_debit' | 'call' | 'assistant';
  /** Signed USD amount: positive adds credit, negative spends it. */
  amount: number;
  balanceAfter: number | null;
  description: string;
  ref?: string;
  meta?: {
    seconds?: number;
    ratePerMinute?: number;
    vapiCallId?: string;
    assistantId?: string;
    orderId?: string;
    adminId?: string;
  };
  createdAt: Date;
}

const CreditLedgerSchema = new Schema<ICreditLedger>(
  {
    accountId: { type: String, required: true, index: true },
    type: { type: String, enum: ['topup', 'admin_grant', 'admin_debit', 'call', 'assistant'], required: true },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, default: null },
    description: { type: String, required: true },
    ref: { type: String },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

CreditLedgerSchema.index({ ref: 1 }, { unique: true, sparse: true });
CreditLedgerSchema.index({ accountId: 1, createdAt: -1 });

export default models.CreditLedger || model<ICreditLedger>('CreditLedger', CreditLedgerSchema);
