import { Schema, model, models, Document } from 'mongoose';

/**
 * Stops one form submission becoming two leads.
 *
 * A double click sends two requests milliseconds apart; both would look for an
 * existing lead and find none. The unique key lets exactly one of them through.
 * Rows remove themselves after ten minutes.
 */
export interface IIntakeGuard extends Document {
  /** `${assistantId}:${phoneNumber}` */
  key: string;
  leadId?: string;
  expireAt: Date;
}

const IntakeGuardSchema = new Schema<IIntakeGuard>({
  key: { type: String, required: true, unique: true },
  leadId: { type: String },
  expireAt: { type: Date, required: true },
});

IntakeGuardSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

export default models.IntakeGuard || model<IIntakeGuard>('IntakeGuard', IntakeGuardSchema);
