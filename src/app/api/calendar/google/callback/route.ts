import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { calendarManager } from '@/lib/calendar/manager';
import * as Sentry from '@sentry/nextjs';

export async function GET(request: NextRequest) {
  let userId: string | null = null;
  
  try {
    // Track successful entry
    Sentry.addBreadcrumb({
      message: 'Google Calendar callback started',
      category: 'navigation',
      data: { url: request.url }
    });
    
    const authResult = await auth();
    userId = authResult.userId;
    
    Sentry.addBreadcrumb({
      message: 'User authenticated',
      category: 'auth',
      data: { userId: userId || 'none' }
    });

    if (!userId) {
      Sentry.captureMessage('Google callback: No user ID found', 'warning');
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    
    Sentry.addBreadcrumb({
      message: 'Search params parsed',
      category: 'http',
      data: {
        hasCode: !!code,
        error,
        allParams: Object.fromEntries(searchParams.entries())
      }
    });

    if (error) {
      const errorMsg = `Google Calendar authentication error: ${error}`;
      Sentry.captureException(new Error(errorMsg), {
        tags: { component: 'google-calendar-callback', step: 'oauth-error' },
        extra: { userId, error }
      });
      return NextResponse.redirect(
        new URL('/settings?calendar_error=authentication_failed', request.url)
      );
    }

    if (!code) {
      const errorMsg = 'No authorization code received from Google';
      Sentry.captureException(new Error(errorMsg), {
        tags: { component: 'google-calendar-callback', step: 'no-code' },
        extra: { userId, searchParams: Object.fromEntries(searchParams.entries()) }
      });
      return NextResponse.redirect(
        new URL('/settings?calendar_error=no_code', request.url)
      );
    }

    Sentry.addBreadcrumb({
      message: 'Getting Google provider',
      category: 'provider'
    });
    
    const googleProvider = calendarManager.getProvider('google');
    if (!googleProvider) {
      const errorMsg = 'Google Calendar provider not available';
      Sentry.captureException(new Error(errorMsg), {
        tags: { component: 'google-calendar-callback', step: 'provider-missing' },
        extra: { userId }
      });
      return NextResponse.redirect(
        new URL('/settings?calendar_error=provider_unavailable', request.url)
      );
    }

    Sentry.addBreadcrumb({
      message: 'Starting token exchange',
      category: 'oauth'
    });
    
    // Exchange code for tokens and save to database
    await googleProvider.authenticate(userId, { code });
    
    Sentry.addBreadcrumb({
      message: 'Token exchange completed',
      category: 'oauth'
    });

    // Success message to Sentry
    Sentry.captureMessage('Google Calendar authentication completed successfully', 'info');

    return NextResponse.redirect(
      new URL('/settings?calendar_success=google_connected', request.url)
    );

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error in Google Calendar callback';
    
    Sentry.captureException(error, {
      tags: { component: 'google-calendar-callback', step: 'critical-error' },
      extra: { 
        userId,
        url: request.url,
        searchParams: request.nextUrl.searchParams ? Object.fromEntries(request.nextUrl.searchParams.entries()) : null,
        errorMessage: errorMsg,
        errorStack: error instanceof Error ? error.stack : null
      }
    });

    return NextResponse.redirect(
      new URL('/settings?calendar_error=connection_failed', request.url)
    );
  }
}