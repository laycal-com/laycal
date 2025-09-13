import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { calendarManager } from '@/lib/calendar/manager';
import * as Sentry from '@sentry/nextjs';

export async function GET(request: NextRequest) {
  let userId: string | null = null;
  
  try {
    Sentry.logger.info('Google Calendar callback started', { url: request.url });
    
    const authResult = await auth();
    userId = authResult.userId;
    
    Sentry.logger.info('Google Calendar callback user authenticated', { userId: userId || 'none' });

    if (!userId) {
      Sentry.logger.warn('Google Calendar callback no user ID found', { redirect: 'sign-in' });
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    
    const paramsData = {
      hasCode: !!code,
      codePreview: code ? `${code.substring(0, 20)}...` : null,
      error,
      allParams: Object.fromEntries(searchParams.entries())
    };
    
    Sentry.logger.info('Google Calendar callback params parsed', paramsData);

    if (error) {
      Sentry.logger.error('Google Calendar authentication error', { userId, error });
      return NextResponse.redirect(
        new URL('/settings?calendar_error=authentication_failed', request.url)
      );
    }

    if (!code) {
      Sentry.logger.error('Google Calendar callback no authorization code', { userId, searchParams: Object.fromEntries(searchParams.entries()) });
      return NextResponse.redirect(
        new URL('/settings?calendar_error=no_code', request.url)
      );
    }

    Sentry.logger.info('Getting Google Calendar provider from manager');
    
    const googleProvider = calendarManager.getProvider('google');
    if (!googleProvider) {
      Sentry.logger.error('Google Calendar provider not available', { userId });
      return NextResponse.redirect(
        new URL('/settings?calendar_error=provider_unavailable', request.url)
      );
    }

    Sentry.logger.info('Starting Google Calendar token exchange', { userId });
    
    // Exchange code for tokens and save to database
    await googleProvider.authenticate(userId, { code });
    
    Sentry.logger.info('Google Calendar authentication completed successfully', { userId });

    return NextResponse.redirect(
      new URL('/settings?calendar_success=google_connected', request.url)
    );

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error in Google Calendar callback';
    const errorStack = error instanceof Error ? error.stack : null;
    
    // Detailed error logging
    Sentry.logger.error('Google Calendar callback error details', {
      errorMessage: errorMsg,
      errorStack: errorStack
    });
    
    Sentry.logger.error('Google Calendar callback critical error', {
      userId,
      url: request.url,
      searchParams: request.nextUrl.searchParams ? Object.fromEntries(request.nextUrl.searchParams.entries()) : null
    });

    return NextResponse.redirect(
      new URL('/settings?calendar_error=connection_failed', request.url)
    );
  }
}