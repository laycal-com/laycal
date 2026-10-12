import { connectToDatabase } from '@/lib/mongodb';
import Account, { type IAccount } from '@/models/Account';
import CreditLedger, { type ICreditLedger } from '@/models/CreditLedger';
import { PricingService } from '@/lib/pricing';
import { logger } from '@/lib/logger';
import { notifyLowBalance } from '@/lib/notifications';

/**
 * All money movement goes through here.
 *
 * Pay-as-you-go only: an account holds prepaid credits, calls are charged per
 * second at the account's own rate, and each assistant after the first costs a
 * one-time fee. There are no plans, trials or monthly limits.
 */

const round = (n: number) => Math.round(n * 10000) / 10000;

/** The account's own rate, or the platform default when none has been set. */
export async function getRate(account: Pick<IAccount, 'ratePerMinute'>): Promise<number> {
  if (typeof account.ratePerMinute === 'number') return account.ratePerMinute;
  return PricingService.getPaygMinuteCost();
}

/** Free for the first assistant an account ever creates, the standard fee after that. */
export async function getAssistantFee(account: Pick<IAccount, 'assistantsCreatedTotal'>): Promise<number> {
  if ((account.assistantsCreatedTotal || 0) === 0) return 0;
  return PricingService.getAssistantCost();
}

interface Movement {
  accountId: string;
  type: ICreditLedger['type'];
  amount: number;
  description: string;
  /** Unique key for the thing being recorded. A repeat with the same ref is ignored. */
  ref?: string;
  meta?: ICreditLedger['meta'];
}

/**
 * Records a movement and applies it to the balance.
 *
 * The ledger row is written first: its unique `ref` is the lock, so a
 * duplicate webhook or a retried request stops here. The balance then moves
 * with a single atomic $inc rather than read-modify-write.
 */
export async function applyMovement(m: Movement): Promise<{ applied: boolean; balance: number | null }> {
  await connectToDatabase();
  const amount = round(m.amount);

  let entry;
  try {
    entry = await CreditLedger.create({ ...m, amount });
  } catch (error: any) {
    if (error?.code === 11000) return { applied: false, balance: null };
    throw error;
  }

  const account = await Account.findByIdAndUpdate(m.accountId, { $inc: { creditBalance: amount } }, { new: true });
  if (!account) {
    await CreditLedger.deleteOne({ _id: entry._id });
    throw new Error(`Account ${m.accountId} not found`);
  }

  const balance = round(account.creditBalance);
  await CreditLedger.updateOne({ _id: entry._id }, { $set: { balanceAfter: balance } });
  return { applied: true, balance };
}

/** A call may start only while the account has credit left. */
export async function canPlaceCall(accountId: string): Promise<{ ok: boolean; reason?: string; balance: number }> {
  await connectToDatabase();
  const account = await Account.findById(accountId).select('creditBalance status').lean<IAccount>();
  if (!account) return { ok: false, reason: 'Account not found', balance: 0 };
  if (account.status === 'suspended') return { ok: false, reason: 'Account is suspended', balance: account.creditBalance };
  if (account.creditBalance <= 0) {
    return { ok: false, reason: 'No credits left. Add credits to place calls.', balance: account.creditBalance };
  }
  return { ok: true, balance: account.creditBalance };
}

/** Charges a finished call, per second, once per Vapi call id. */
export async function chargeCall(input: {
  accountId: string;
  vapiCallId: string;
  seconds: number;
  assistantName?: string;
  assistantId?: string;
}): Promise<void> {
  const seconds = Math.max(0, Math.round(input.seconds || 0));
  if (seconds < 1) return;

  await connectToDatabase();
  const account = await Account.findById(input.accountId).select('ratePerMinute').lean<IAccount>();
  if (!account) return;

  const ratePerMinute = await getRate(account);
  const cost = round((seconds / 60) * ratePerMinute);
  if (cost <= 0) return;

  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  const result = await applyMovement({
    accountId: input.accountId,
    type: 'call',
    amount: -cost,
    description: `Call ${minutes}m ${rest}s${input.assistantName ? ` via ${input.assistantName}` : ''}`,
    ref: `call:${input.vapiCallId}`,
    meta: { seconds, ratePerMinute, vapiCallId: input.vapiCallId, assistantId: input.assistantId },
  });

  if (result.applied) {
    logger.info('CALL_CHARGED', 'Charged a call to the account', {
      vapiCallId: input.vapiCallId,
      data: { accountId: input.accountId, seconds, ratePerMinute, cost, balance: result.balance },
    });

    // Tell the business once when this charge takes the balance to the low
    // line: the same line that turns the balance amber in the portal. The
    // money has already moved; nothing the email does can undo or repeat it.
    if (result.balance !== null) {
      try {
        const line = await getLowBalanceLine();
        if (result.balance <= line && result.balance + cost > line) {
          await notifyLowBalance({ accountId: input.accountId, balance: result.balance });
        }
      } catch (error) {
        logger.error('LOW_BALANCE_CHECK_ERROR', 'Could not check the low balance line', { error });
      }
    }
  }
}

/** The balance at or below which the portal shows the balance as low. */
export async function getLowBalanceLine(): Promise<number> {
  const pricing = await PricingService.getPricing();
  return pricing.minimum_topup_amount || 5;
}

/** Whether the account can create another assistant, and what it will cost. */
export async function quoteAssistant(accountId: string): Promise<{ ok: boolean; fee: number; reason?: string; balance: number }> {
  await connectToDatabase();
  const account = await Account.findById(accountId).select('creditBalance assistantsCreatedTotal').lean<IAccount>();
  if (!account) return { ok: false, fee: 0, reason: 'Account not found', balance: 0 };

  const fee = await getAssistantFee(account);
  if (fee > 0 && account.creditBalance < fee) {
    return {
      ok: false,
      fee,
      balance: account.creditBalance,
      reason: `Each assistant after your first costs $${fee}. Add credits to create another.`,
    };
  }
  return { ok: true, fee, balance: account.creditBalance };
}

/** Counts the new assistant and charges its fee, if it has one. */
export async function chargeAssistant(input: { accountId: string; assistantId: string; name: string }): Promise<number> {
  await connectToDatabase();
  // Returns the document as it was, so the fee is decided from the count before this assistant.
  const before = await Account.findByIdAndUpdate(input.accountId, { $inc: { assistantsCreatedTotal: 1 } });
  if (!before) throw new Error(`Account ${input.accountId} not found`);

  const fee = await getAssistantFee(before);
  if (fee > 0) {
    await applyMovement({
      accountId: input.accountId,
      type: 'assistant',
      amount: -fee,
      description: `Assistant created: ${input.name}`,
      ref: `assistant:${input.assistantId}`,
      meta: { assistantId: input.assistantId },
    });
  }
  return fee;
}
