import { NextRequest, NextResponse } from 'next/server';
import { getAccountAuth } from '@/lib/account';
import { auth } from '@clerk/nextjs/server';
import { calendarManager } from '@/lib/calendar/manager';
import * as Sentry from '@sentry/nextjs';

export async function GET(request: NextRequest) {
  let accountId: string | null = null;
  
  try {
    console.log('Google Calendar callback started', { url: request.url });
    
    const authResult = await getAccountAuth();
    accountId = authResult.accountId;
    
    console.log('Google Calendar callback user authenticated', { accountId: accountId || 'none' });

    if (!accountId) {
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
      console.error('Google Calendar authentication error', { accountId, error });
      return NextResponse.redirect(
        new URL('/settings?calendar_error=authentication_failed', request.url)
      );
    }

    if (!code) {
      console.error('Google Calendar callback no authorization code', { 
        accountId, 
        searchParams: Object.fromEntries(searchParams.entries()) 
      });
      return NextResponse.redirect(
        new URL('/settings?calendar_error=no_code', request.url)
      );
    }

    console.log('Getting Google Calendar provider from manager');
    
    const googleProvider = calendarManager.getProvider('google');
    if (!googleProvider) {
      console.error('Google Calendar provider not available', { accountId });
      return NextResponse.redirect(
        new URL('/settings?calendar_error=provider_unavailable', request.url)
      );
    }

    console.log('Starting Google Calendar token exchange', { accountId });
    
    // Exchange code for tokens and save to database
    await googleProvider.authenticate(accountId, { code });
    
    console.log('Google Calendar authentication completed successfully', { accountId });

    return NextResponse.redirect(
      new URL('/settings?calendar_success=google_connected', request.url)
    );

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error in Google Calendar callback';
    
    console.error('Google Calendar callback critical error', {
      errorMessage: errorMsg,
      accountId,
      url: request.url,
      searchParams: request.nextUrl.searchParams ? Object.fromEntries(request.nextUrl.searchParams.entries()) : null
    });

    Sentry.captureException(error, {
      tags: {
        component: 'google-calendar-callback'
      },
      extra: {
        accountId,
        url: request.url,
        searchParams: request.nextUrl.searchParams ? Object.fromEntries(request.nextUrl.searchParams.entries()) : null
      }
    });

    return NextResponse.redirect(
      new URL('/settings?calendar_error=connection_failed', request.url)
    );
  }
}