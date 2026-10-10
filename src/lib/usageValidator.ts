import { canPlaceCall, chargeCall, quoteAssistant } from '@/lib/billing';

/**
 * Thin compatibility layer over lib/billing.
 *
 * The plan-based validator this replaces (trials, monthly minute limits,
 * upgrade tiers) is gone. These method names are kept only so existing callers
 * read the same way; new code should import from lib/billing directly.
 */

export interface ValidationResult {
  canCreate: boolean;
  canCall: boolean;
  reason?: string;
  /** One-time fee for the assistant about to be created. 0 for the first. */
  fee?: number;
}

export class UsageValidator {
  async canCreateAssistant(accountId: string): Promise<ValidationResult> {
    const quote = await quoteAssistant(accountId);
    return { canCreate: quote.ok, canCall: true, reason: quote.reason, fee: quote.fee };
  }

  async canMakeCall(accountId: string, _estimatedMinutes?: number): Promise<ValidationResult> {
    const check = await canPlaceCall(accountId);
    return { canCreate: true, canCall: check.ok, reason: check.reason };
  }

  async trackCallUsage(
    accountId: string,
    assistantId: string,
    assistantName: string,
    durationSeconds: number,
    vapiCallId?: string
  ): Promise<void> {
    await chargeCall({
      accountId,
      assistantId,
      assistantName,
      seconds: durationSeconds,
      // Without a call id there is nothing to de-duplicate on, so fall back to a one-off key.
      vapiCallId: vapiCallId || `unknown-${assistantId}-${Date.now()}`,
    });
  }
}

export const usageValidator = new UsageValidator();
