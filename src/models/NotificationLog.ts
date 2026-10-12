import { Schema, model, models, Document } from 'mongoose';

/**
 * One row per notification email, sent or not.
 *
 * The unique `key` is what makes "one event, one email" hold: the row is
 * written before the send, so a call reported twice finds the key taken and
 * sends nothing. It is also where a failed or skipped send can be looked up.
 */
export interface INotificationLog extends Document {
  key: string;
  accountId: string;
  kind: 'booked' | 'unreached' | 'stopped' | 'low';
  to: string;
  subject: string;
  /** skipped: the mail details are not configured on this machine. */
  status: 'pending' | 'sent' | 'failed' | 'skipped';
  error?: string;
  leadId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationLogSchema = new Schema<INotificationLog>(
  {
    key: { type: String, required: true, unique: true },
    accountId: { type: String, required: true, index: true },
    kind: { type: String, enum: ['booked', 'unreached', 'stopped', 'low'], required: true },
    to: { type: String, required: true },
    subject: { type: String, required: true },
    status: { type: String, enum: ['pending', 'sent', 'failed', 'skipped'], default: 'pending' },
    error: { type: String },
    leadId: { type: String },
  },
  { timestamps: true }
);

export default models.NotificationLog || model<INotificationLog>('NotificationLog', NotificationLogSchema);
