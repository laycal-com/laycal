import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { calendarManager } from '@/lib/calendar/manager';

const logToService = async (level: 'info' | 'error' | 'debug', data: any) => {
  if (!process.env.LOGGING_APP_URL) return;
  try {
    await fetch(`${process.env.LOGGING_APP_URL}/${level}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  } catch (e) {
    // Silent fail for logging service
  }
};

export async function GET(request: NextRequest) {
  let userId: string | null = null;
  
  try {
    await logToService('info', { message: 'Google Calendar auth started' });
    
    const authResult = await auth();
    userId = authResult.userId;
    
    await logToService('info', { message: 'Google Calendar auth user authenticated', userId: userId || 'none' });

    if (!userId) {
      await logToService('error', { message: 'Google Calendar auth no user ID found' });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await logToService('info', { message: 'Getting Google Calendar provider from manager' });
    
    const googleProvider = calendarManager.getProvider('google') as any;
    if (!googleProvider) {
      await logToService('error', { message: 'Google Calendar provider not available', userId });
      return NextResponse.json({ error: 'Google Calendar provider not available' }, { status: 500 });
    }

    await logToService('info', { message: 'Generating Google Calendar auth URL', userId });
    
    const authUrl = googleProvider.getAuthUrl();
    
    await logToService('info', { message: 'Google Calendar auth URL generated successfully', userId, authUrl });

    return NextResponse.json({ authUrl });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error in Google auth';
    
    await logToService('error', {
      message: 'Google Calendar auth critical error',
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