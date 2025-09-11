import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { calendarManager } from '@/lib/calendar/manager';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      logger.error('GOOGLE_AUTH_CALLBACK_ERROR', 'Google Calendar authentication error', {
        userId,
        data: { error }
      });
      return NextResponse.redirect(
        new URL('/settings?calendar_error=authentication_failed', request.url)
      );
    }

    if (!code) {
      logger.error('GOOGLE_AUTH_NO_CODE', 'No authorization code received from Google', {
        userId
      });
      return NextResponse.redirect(
        new URL('/settings?calendar_error=no_code', request.url)
      );
    }

    const googleProvider = calendarManager.getProvider('google');
    if (!googleProvider) {
      logger.error('GOOGLE_PROVIDER_NOT_FOUND', 'Google Calendar provider not available', {
        userId
      });
      return NextResponse.redirect(
        new URL('/settings?calendar_error=provider_unavailable', request.url)
      );
    }

    // Exchange code for tokens and save to database
    await googleProvider.authenticate(userId, { code });

    logger.info('GOOGLE_AUTH_COMPLETE', 'Google Calendar authentication completed', {
      userId
    });

    return NextResponse.redirect(
      new URL('/settings?calendar_success=google_connected', request.url)
    );

  } catch (error) {
    logger.error('GOOGLE_AUTH_CALLBACK_CRITICAL', 'Critical error in Google Calendar callback', {
      userId: await auth().then(a => a.userId),
      error
    });

    return NextResponse.redirect(
      new URL('/settings?calendar_error=connection_failed', request.url)
    );
  }
}