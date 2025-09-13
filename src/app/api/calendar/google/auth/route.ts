import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { calendarManager } from '@/lib/calendar/manager';
import * as Sentry from '@sentry/nextjs';

export async function GET(request: NextRequest) {
  let userId: string | null = null;
  
  try {
    console.log('[GOOGLE_AUTH] Starting Google Calendar authentication');
    
    const authResult = await auth();
    userId = authResult.userId;
    console.log('[GOOGLE_AUTH] User ID:', userId);

    if (!userId) {
      console.log('[GOOGLE_AUTH] Unauthorized - no user ID');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[GOOGLE_AUTH] Getting Google provider from calendar manager');
    const googleProvider = calendarManager.getProvider('google') as any;
    if (!googleProvider) {
      const errorMsg = 'Google Calendar provider not available';
      console.error('[GOOGLE_AUTH] Provider error:', errorMsg);
      Sentry.captureException(new Error(errorMsg), {
        tags: { component: 'google-calendar-auth' },
        extra: { userId }
      });
      return NextResponse.json({ error: 'Google Calendar provider not available' }, { status: 500 });
    }

    console.log('[GOOGLE_AUTH] Generating auth URL');
    const authUrl = googleProvider.getAuthUrl();
    console.log('[GOOGLE_AUTH] Auth URL generated:', authUrl);

    console.log('[GOOGLE_AUTH] Google Calendar authentication initiated for user:', userId);

    return NextResponse.json({ authUrl });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error in Google auth';
    console.error('[GOOGLE_AUTH] Failed to generate Google auth URL:', errorMsg);
    console.error('[GOOGLE_AUTH] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    Sentry.captureException(error, {
      tags: { component: 'google-calendar-auth' },
      extra: { userId, url: request.url }
    });

    return NextResponse.json({
      error: 'Failed to generate authentication URL',
      details: errorMsg
    }, { status: 500 });
  }
}