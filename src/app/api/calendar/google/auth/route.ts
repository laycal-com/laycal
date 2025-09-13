import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { calendarManager } from '@/lib/calendar/manager';
import * as Sentry from '@sentry/nextjs';

export async function GET(request: NextRequest) {
  let userId: string | null = null;
  
  try {
    Sentry.addBreadcrumb({
      message: 'Google Calendar auth started',
      category: 'navigation'
    });
    
    const authResult = await auth();
    userId = authResult.userId;
    
    Sentry.addBreadcrumb({
      message: 'User authenticated',
      category: 'auth',
      data: { userId: userId || 'none' }
    });

    if (!userId) {
      Sentry.captureMessage('Google auth: No user ID found', 'warning');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    Sentry.addBreadcrumb({
      message: 'Getting Google provider',
      category: 'provider'
    });
    
    const googleProvider = calendarManager.getProvider('google') as any;
    if (!googleProvider) {
      const errorMsg = 'Google Calendar provider not available';
      Sentry.captureException(new Error(errorMsg), {
        tags: { component: 'google-calendar-auth', step: 'provider-missing' },
        extra: { userId }
      });
      return NextResponse.json({ error: 'Google Calendar provider not available' }, { status: 500 });
    }

    Sentry.addBreadcrumb({
      message: 'Generating auth URL',
      category: 'oauth'
    });
    
    const authUrl = googleProvider.getAuthUrl();
    
    Sentry.addBreadcrumb({
      message: 'Auth URL generated',
      category: 'oauth',
      data: { authUrl }
    });

    Sentry.captureMessage('Google Calendar authentication initiated successfully', 'info');

    return NextResponse.json({ authUrl });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error in Google auth';
    
    Sentry.captureException(error, {
      tags: { component: 'google-calendar-auth', step: 'critical-error' },
      extra: { 
        userId, 
        url: request.url,
        errorMessage: errorMsg,
        errorStack: error instanceof Error ? error.stack : null
      }
    });

    return NextResponse.json({
      error: 'Failed to generate authentication URL',
      details: errorMsg
    }, { status: 500 });
  }
}