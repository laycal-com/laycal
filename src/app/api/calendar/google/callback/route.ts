import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { calendarManager } from '@/lib/calendar/manager';
import * as Sentry from '@sentry/nextjs';

export async function GET(request: NextRequest) {
  let userId: string | null = null;
  
  try {
    console.log('Google Calendar callback started', { url: request.url });
    
    const authResult = await auth();
    userId = authResult.userId;
    
    console.log('Google Calendar callback user authenticated', { userId: userId || 'none' });

    if (!userId) {
      console.error('Google Calendar callback no user ID found');
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
    
    console.log('Google Calendar callback params parsed', paramsData);

    if (error) {
      console.error('Google Calendar authentication error', { userId, error });
      return NextResponse.redirect(
        new URL('/settings?calendar_error=authentication_failed', request.url)
      );
    }

    if (!code) {
      console.error('Google Calendar callback no authorization code', { 
        userId, 
        searchParams: Object.fromEntries(searchParams.entries()) 
      });
      return NextResponse.redirect(
        new URL('/settings?calendar_error=no_code', request.url)
      );
    }

    console.log('Getting Google Calendar provider from manager');
    
    const googleProvider = calendarManager.getProvider('google');
    if (!googleProvider) {
      console.error('Google Calendar provider not available', { userId });
      return NextResponse.redirect(
        new URL('/settings?calendar_error=provider_unavailable', request.url)
      );
    }

    console.log('Starting Google Calendar token exchange', { userId });
    
    // Exchange code for tokens and save to database
    await googleProvider.authenticate(userId, { code });
    
    console.log('Google Calendar authentication completed successfully', { userId });

    return NextResponse.redirect(
      new URL('/settings?calendar_success=google_connected', request.url)
    );

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error in Google Calendar callback';
    
    console.error('Google Calendar callback critical error', {
      errorMessage: errorMsg,
      userId,
      url: request.url,
      searchParams: request.nextUrl.searchParams ? Object.fromEntries(request.nextUrl.searchParams.entries()) : null
    });

    Sentry.captureException(error, {
      tags: {
        component: 'google-calendar-callback'
      },
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