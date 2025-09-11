import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { calendarManager } from '@/lib/calendar/manager';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const activeProviders = await calendarManager.getUserActiveProviders(userId);
    const availableProviders = calendarManager.getAvailableProviders();

    // Check authentication status for each provider
    const providerStatus = await Promise.all(
      availableProviders.map(async (providerName) => {
        const provider = calendarManager.getProvider(providerName);
        if (!provider) {
          return { name: providerName, connected: false, authenticated: false };
        }

        const connected = activeProviders.includes(providerName);
        const authenticated = connected ? await provider.isAuthenticated(userId) : false;

        return {
          name: providerName,
          connected,
          authenticated
        };
      })
    );

    return NextResponse.json({
      success: true,
      providers: providerStatus
    });

  } catch (error) {
    logger.error('CALENDAR_STATUS_ERROR', 'Failed to get calendar status', {
      userId: await auth().then(a => a.userId),
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
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { provider } = await request.json();

    if (!provider) {
      return NextResponse.json({ error: 'Provider name is required' }, { status: 400 });
    }

    await calendarManager.disconnectProvider(userId, provider);

    logger.info('CALENDAR_DISCONNECTED', 'Calendar provider disconnected via API', {
      userId,
      data: { provider }
    });

    return NextResponse.json({
      success: true,
      message: `${provider} calendar disconnected successfully`
    });

  } catch (error) {
    logger.error('CALENDAR_DISCONNECT_ERROR', 'Failed to disconnect calendar provider', {
      userId: await auth().then(a => a.userId),
      error
    });

    return NextResponse.json({
      error: 'Failed to disconnect calendar provider',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}