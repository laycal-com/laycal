import { auth, clerkClient, currentUser } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongodb';
import Account, { type IAccount } from '@/models/Account';
import Membership from '@/models/Membership';
import { logger } from '@/lib/logger';

export interface AccountAuth {
  /** The signed-in Clerk user, or null. */
  userId: string | null;
  /** The account that user works in. Null when signed out or suspended. */
  accountId: string | null;
  account: IAccount | null;
  reason?: 'unauthenticated' | 'suspended';
}

/**
 * Resolves the request to an account. This is the one place tenancy is
 * decided: routes query by `accountId`, never by the Clerk user id.
 *
 * A first sign-in has no membership yet. If an admin pre-created an account
 * for that email (the invite flow) it is claimed; otherwise a blank account is
 * created, which the onboarding form then fills in.
 */
export async function getAccountAuth(): Promise<AccountAuth> {
  const { userId } = await auth();
  if (!userId) return { userId: null, accountId: null, account: null, reason: 'unauthenticated' };

  await connectToDatabase();

  let membership = await Membership.findOne({ userId }).lean<{ accountId: string }>();
  if (!membership) membership = await provision(userId);
  if (!membership) return { userId, accountId: null, account: null, reason: 'unauthenticated' };

  const account = await Account.findById(membership.accountId);
  if (!account) return { userId, accountId: null, account: null, reason: 'unauthenticated' };
  if (account.status === 'suspended') return { userId, accountId: null, account, reason: 'suspended' };

  return { userId, accountId: String(account._id), account };
}

async function provision(userId: string): Promise<{ accountId: string } | null> {
  const user = await currentUser();
  if (!user) return null;

  const primary = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId) || user.emailAddresses[0];
  const email = (primary?.emailAddress || '').toLowerCase();
  const emailVerified = primary?.verification?.status === 'verified';

  // Claim the account an admin prepared for this email, if there is one.
  let account = email
    ? await Account.findOneAndUpdate(
        { email, status: 'invited' },
        { $set: { status: 'active', ownerUserId: userId } },
        { new: true }
      )
    : null;

  // Same person, new login: their Clerk user was deleted and the email was
  // added again, which gives them a new user id. Hand the existing account
  // back instead of starting an empty one. Only for a verified email, and only
  // once Clerk confirms the previous owner no longer exists, so nobody can take
  // over an account whose owner is still there.
  if (!account && email && emailVerified) {
    const previous = await Account.findOne({ email, status: { $ne: 'invited' }, ownerUserId: { $ne: userId } }).sort({
      createdAt: -1,
    });
    if (previous && (await ownerIsGone(previous.ownerUserId))) {
      if (previous.ownerUserId) await Membership.deleteMany({ userId: previous.ownerUserId });
      previous.ownerUserId = userId;
      await previous.save();
      account = previous;
      logger.info('ACCOUNT_RELINKED', 'Reconnected an existing account to a re-created login', {
        userId,
        data: { accountId: String(previous._id) },
      });
    }
  }

  if (!account) {
    // A page load fires several API calls at once, and each one lands here for
    // a brand-new user. The upsert on the unique owner id makes them converge
    // on one account instead of creating one each.
    try {
      account = await Account.findOneAndUpdate(
        { ownerUserId: userId },
        { $setOnInsert: { email: email || `${userId}@unknown.invalid`, ownerUserId: userId, createdBy: 'self' } },
        { upsert: true, new: true }
      );
    } catch (error: any) {
      if (error?.code !== 11000) throw error;
      account = await Account.findOne({ ownerUserId: userId });
    }
  }
  if (!account) return null;

  try {
    await Membership.create({ accountId: String(account._id), userId, role: 'owner', email });
  } catch (error: any) {
    // Another of those simultaneous requests created it first; that one stands.
    if (error?.code !== 11000) throw error;
    return Membership.findOne({ userId }).lean<{ accountId: string }>();
  }

  logger.info('ACCOUNT_PROVISIONED', 'Linked a new sign-in to an account', {
    userId,
    data: { accountId: String(account._id), claimedInvite: account.createdBy === 'admin' },
  });

  return { accountId: String(account._id) };
}

/** True only when Clerk positively reports the user as missing. Any other failure counts as "still there". */
async function ownerIsGone(ownerUserId?: string): Promise<boolean> {
  if (!ownerUserId) return true;
  try {
    const clerk = await clerkClient();
    await clerk.users.getUser(ownerUserId);
    return false;
  } catch (error: any) {
    return error?.status === 404;
  }
}
