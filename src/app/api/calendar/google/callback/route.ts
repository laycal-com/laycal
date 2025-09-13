import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { calendarManager } from '@/lib/calendar/manager';
import * as Sentry from '@sentry/nextjs';

export async function GET(request: NextRequest) {
  let userId: string | null = null;
  
  try {
    console.log('[GOOGLE_CALLBACK] Starting Google Calendar callback handler');
    console.log('[GOOGLE_CALLBACK] Request URL:', request.url);
    
    const authResult = await auth();
    userId = authResult.userId;
    console.log('[GOOGLE_CALLBACK] User ID:', userId);

    if (!userId) {
      console.log('[GOOGLE_CALLBACK] No user ID found, redirecting to sign-in');
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    
    console.log('[GOOGLE_CALLBACK] Search params:', {
      code: code ? `${code.substring(0, 20)}...` : null,
      error,
      allParams: Object.fromEntries(searchParams.entries())
    });

    if (error) {
      const errorMsg = `Google Calendar authentication error: ${error}`;
      console.error('[GOOGLE_CALLBACK] Authentication error:', errorMsg);
      Sentry.captureException(new Error(errorMsg), {
        tags: { component: 'google-calendar-callback' },
        extra: { userId, error }
      });
      return NextResponse.redirect(
        new URL('/settings?calendar_error=authentication_failed', request.url)
      );
    }

    if (!code) {
      const errorMsg = 'No authorization code received from Google';
      console.error('[GOOGLE_CALLBACK] No code error:', errorMsg);
      Sentry.captureException(new Error(errorMsg), {
        tags: { component: 'google-calendar-callback' },
        extra: { userId, searchParams: Object.fromEntries(searchParams.entries()) }
      });
      return NextResponse.redirect(
        new URL('/settings?calendar_error=no_code', request.url)
      );
    }

    console.log('[GOOGLE_CALLBACK] Getting Google provider from calendar manager');
    const googleProvider = calendarManager.getProvider('google');
    if (!googleProvider) {
      const errorMsg = 'Google Calendar provider not available';
      console.error('[GOOGLE_CALLBACK] Provider error:', errorMsg);
      Sentry.captureException(new Error(errorMsg), {
        tags: { component: 'google-calendar-callback' },
        extra: { userId }
      });
      return NextResponse.redirect(
        new URL('/settings?calendar_error=provider_unavailable', request.url)
      );
    }

    console.log('[GOOGLE_CALLBACK] Starting token exchange with Google');
    // Exchange code for tokens and save to database
    await googleProvider.authenticate(userId, { code });
    console.log('[GOOGLE_CALLBACK] Token exchange completed successfully');

    console.log('[GOOGLE_CALLBACK] Google Calendar authentication completed successfully for user:', userId);

    return NextResponse.redirect(
      new URL('/settings?calendar_success=google_connected', request.url)
    );

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error in Google Calendar callback';
    console.error('[GOOGLE_CALLBACK] Critical error:', errorMsg);
    console.error('[GOOGLE_CALLBACK] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    Sentry.captureException(error, {
      tags: { component: 'google-calendar-callback' },
      extra: { 
        userId,
        url: request.url,
        searchParams: request.nextUrl.searchParams ? Object.fromEntries(request.nextUrl.searchParams.entries()) : null
      }
    });

    return NextResponse.redirect(
      new URL('/settings?calendar_error=connection_failed', request.url)
    );
  }
}