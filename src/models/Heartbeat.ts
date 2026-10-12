import { Schema, model, models } from 'mongoose';

/**
 * When the wake-up last ran. Later calls (next tries, held leads) depend on
 * it, so a stale row means waiting leads are not being called.
 */
export interface IHeartbeat {
  _id: string;
  at: Date;
  /** Last time the owner was told it had stopped, so the alert is not repeated every minute. */
  alertedAt?: Date | null;
}

const HeartbeatSchema = new Schema<IHeartbeat>({
  _id: { type: String },
  at: { type: Date, required: true },
  alertedAt: { type: Date, default: null },
});

export default models.Heartbeat || model<IHeartbeat>('Heartbeat', HeartbeatSchema);
