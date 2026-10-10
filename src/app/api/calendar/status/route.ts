import { NextRequest, NextResponse } from 'next/server';
import { getAccountAuth } from '@/lib/account';
import { auth } from '@clerk/nextjs/server';
import { calendarManager } from '@/lib/calendar/manager';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { accountId } = await getAccountAuth();

    if (!accountId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const activeProviders = await calendarManager.getUserActiveProviders(accountId);
    const availableProviders = calendarManager.getAvailableProviders();

    // Check authentication status for each provider
    const providerStatus = await Promise.all(
      availableProviders.map(async (providerName) => {
        const provider = calendarManager.getProvider(providerName);
        if (!provider) {
          return { name: providerName, connected: false, authenticated: false };
        }

        const connected = activeProviders.includes(providerName);
        const authenticated = connected ? await provider.isAuthenticated(accountId) : false;

        // A connection made before the freebusy scopes were added still books
        // fine but cannot answer availability. Probe it here so the user is
        // told to reconnect in Settings rather than discovering it mid-call.
        let canCheckAvailability = false;
        let needsReconnect = false;

        if (authenticated) {
          const probeStart = new Date(Date.now() + 3_600_000);
          const probe = await calendarManager.findAvailability(accountId, {
            start: probeStart.toISOString(),
            end: new Date(probeStart.getTime() + 1_800_000).toISOString(),
            durationMins: 30,
            timezone: 'UTC',
            maxAlternatives: 0,
          });
          needsReconnect = !!probe.needsReconnect;
          canCheckAvailability = !probe.error;
        }

        return {
          name: providerName,
          connected,
          authenticated,
          canCheckAvailability,
          needsReconnect
        };
      })
    );

    return NextResponse.json({
      success: true,
      providers: providerStatus
    });

  } catch (error) {
    logger.error('CALENDAR_STATUS_ERROR', 'Failed to get calendar status', {
      error
    });

    return NextResponse.json({
      error: 'Failed to get calendar status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { accountId } = await getAccountAuth();

    if (!accountId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { provider } = await request.json();

    if (!provider) {
      return NextResponse.json({ error: 'Provider name is required' }, { status: 400 });
    }

    await calendarManager.disconnectProvider(accountId, provider);

    logger.info('CALENDAR_DISCONNECTED', 'Calendar provider disconnected via API', {
      accountId,
      data: { provider }
    });

    return NextResponse.json({
      success: true,
      message: `${provider} calendar disconnected successfully`
    });

  } catch (error) {
    logger.error('CALENDAR_DISCONNECT_ERROR', 'Failed to disconnect calendar provider', {
      error
    });

    return NextResponse.json({
      error: 'Failed to disconnect calendar provider',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}