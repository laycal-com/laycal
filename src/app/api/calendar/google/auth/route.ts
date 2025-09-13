import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { calendarManager } from '@/lib/calendar/manager';
import * as Sentry from '@sentry/nextjs';

export async function GET(request: NextRequest) {
  let userId: string | null = null;
  
  try {
    Sentry.logger.info('Google Calendar auth started');
    
    const authResult = await auth();
    userId = authResult.userId;
    
    Sentry.logger.info('Google Calendar auth user authenticated', { userId: userId || 'none' });

    if (!userId) {
      Sentry.logger.warn('Google Calendar auth no user ID found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    Sentry.logger.info('Getting Google Calendar provider from manager');
    
    const googleProvider = calendarManager.getProvider('google') as any;
    if (!googleProvider) {
      Sentry.logger.error('Google Calendar provider not available', { userId });
      return NextResponse.json({ error: 'Google Calendar provider not available' }, { status: 500 });
    }

    Sentry.logger.info('Generating Google Calendar auth URL', { userId });
    
    const authUrl = googleProvider.getAuthUrl();
    
    Sentry.logger.info('Google Calendar auth URL generated successfully', { userId, authUrl });

    return NextResponse.json({ authUrl });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error in Google auth';
    
    Sentry.logger.error('Google Calendar auth critical error', {
      userId, 
      url: request.url,
      errorMessage: errorMsg,
      errorStack: error instanceof Error ? error.stack : null
    });

    return NextResponse.json({
      error: 'Failed to generate authentication URL',
      details: errorMsg
    }, { status: 500 });
  }
}