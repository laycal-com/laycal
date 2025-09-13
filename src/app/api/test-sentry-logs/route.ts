import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export async function GET(request: NextRequest) {
  try {
    // Method 1: Console logging (captured by built-in Console integration)
    Sentry.logger.info('User triggered test log', { log_source: 'sentry_test' })
    
    return NextResponse.json({ 
      success: true
    });
    
  } catch (error) {
    console.error('Error in Sentry logging test:', error);
    
    Sentry.captureException(error, {
      tags: { 
        component: 'sentry-test', 
        test_type: 'error',
        log_source: 'sentry_test'
      },
      extra: { 
        error_location: 'test_endpoint',
        timestamp: new Date().toISOString()
      }
    });
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}