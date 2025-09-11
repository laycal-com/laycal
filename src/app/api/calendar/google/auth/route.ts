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

    const googleProvider = calendarManager.getProvider('google') as any;
    if (!googleProvider) {
      return NextResponse.json({ error: 'Google Calendar provider not available' }, { status: 500 });
    }

    const authUrl = googleProvider.getAuthUrl();

    logger.info('GOOGLE_AUTH_INITIATED', 'Google Calendar authentication initiated', {
      userId
    });

    return NextResponse.json({ authUrl });

  } catch (error) {
    logger.error('GOOGLE_AUTH_URL_ERROR', 'Failed to generate Google auth URL', {
      error
    });

    return NextResponse.json({
      error: 'Failed to generate authentication URL',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}