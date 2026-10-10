import { NextRequest, NextResponse } from 'next/server';
import { getAccountAuth } from '@/lib/account';
import { auth } from '@clerk/nextjs/server';
import { calendarManager } from '@/lib/calendar/manager';
import * as Sentry from '@sentry/nextjs';

export async function GET(request: NextRequest) {
  let accountId: string | null = null;
  
  try {
    console.log('Google Calendar auth started');
    
    const authResult = await getAccountAuth();
    accountId = authResult.accountId;
    
    console.log('Google Calendar auth user authenticated', { accountId: accountId || 'none' });

    if (!accountId) {
      console.error('Google Calendar auth no user ID found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Getting Google Calendar provider from manager');
    
    const googleProvider = calendarManager.getProvider('google') as any;
    if (!googleProvider) {
      console.error('Google Calendar provider not available', { accountId });
      return NextResponse.json({ error: 'Google Calendar provider not available' }, { status: 500 });
    }

    console.log('Generating Google Calendar auth URL', { accountId });
    
    const authUrl = googleProvider.getAuthUrl();
    
    console.log('Google Calendar auth URL generated successfully', { accountId, authUrl });

    return NextResponse.json({ authUrl });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error in Google auth';
    
    console.error('Google Calendar auth critical error', {
      accountId, 
      url: request.url,
      errorMessage: errorMsg
    });

    Sentry.captureException(error, {
      tags: {
        component: 'google-calendar-auth'
      },
      extra: {
        accountId,
        url: request.url
      }
    });

    return NextResponse.json({
      error: 'Failed to generate authentication URL',
      details: errorMsg
    }, { status: 500 });
  }
}