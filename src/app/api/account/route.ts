import { NextRequest, NextResponse } from 'next/server';
import { getAccountAuth } from '@/lib/account';
import { getAssistantFee, getRate } from '@/lib/billing';
import { PricingService } from '@/lib/pricing';
import Assistant from '@/models/Assistant';
import CalendarConnection from '@/models/CalendarConnection';
import { logger } from '@/lib/logger';

/**
 * The signed-in person's account: who they are to Laycal, what they pay, and
 * how far through setup they are. The portal reads this once per page load to
 * decide between onboarding, the suspended screen and the app itself.
 */
export async function GET() {
  try {
    const { userId, accountId, account, reason } = await getAccountAuth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (reason === 'suspended') {
      return NextResponse.json({ error: 'Account suspended', suspended: true }, { status: 403 });
    }
    if (!accountId || !account) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [ratePerMinute, nextAssistantFee, pricing, assistants, calendars] = await Promise.all([
      getRate(account),
      getAssistantFee(account),
      PricingService.getPricing(),
      Assistant.countDocuments({ accountId }),
      CalendarConnection.countDocuments({ accountId, isActive: true }),
    ]);

    return NextResponse.json({
      account: {
        id: accountId,
        name: account.name,
        email: account.email,
        industry: account.industry || '',
        phone: account.phone || '',
        timezone: account.timezone || '',
        website: account.website || '',
        onboarded: !!account.onboardedAt,
      },
      billing: {
        balance: account.creditBalance,
        ratePerMinute,
        nextAssistantFee,
        assistantFee: pricing.assistant_base_cost,
        minimumTopup: pricing.minimum_topup_amount,
      },
      // Derived from real data, so a step is "done" because the thing exists, not because a box was ticked.
      setup: {
        assistant: assistants > 0,
        credits: account.creditBalance > 0,
        calendar: calendars > 0,
        dismissed: !!account.tourDismissedAt,
      },
    });
  } catch (error) {
    logger.error('ACCOUNT_GET_ERROR', 'Failed to load account', { error });
    return NextResponse.json({ error: 'Failed to load account' }, { status: 500 });
  }
}

const clean = (v: unknown, max = 120) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Saves the onboarding form, or dismisses the setup tour. */
export async function PATCH(request: NextRequest) {
  try {
    const { accountId, account } = await getAccountAuth();
    if (!accountId || !account) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();

    if (body.dismissTour === true) {
      account.tourDismissedAt = new Date();
      await account.save();
      return NextResponse.json({ success: true });
    }

    const name = clean(body.name);
    if (!name) return NextResponse.json({ error: 'Company name is required' }, { status: 400 });

    const timezone = clean(body.timezone, 64);
    if (timezone) {
      try {
        new Intl.DateTimeFormat('en-US', { timeZone: timezone });
      } catch {
        return NextResponse.json({ error: 'Unknown timezone' }, { status: 400 });
      }
    }

    account.name = name;
    account.industry = clean(body.industry, 60);
    account.phone = clean(body.phone, 32);
    account.timezone = timezone;
    account.website = clean(body.website, 200);
    if (!account.onboardedAt) account.onboardedAt = new Date();
    await account.save();

    logger.info('ACCOUNT_ONBOARDED', 'Account details saved', { accountId });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('ACCOUNT_UPDATE_ERROR', 'Failed to update account', { error });
    return NextResponse.json({ error: 'Failed to update account' }, { status: 500 });
  }
}
