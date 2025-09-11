import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { accountSid, authToken } = await request.json();

    if (!accountSid || !authToken) {
      return NextResponse.json({ 
        error: 'Missing credentials',
        details: 'Please provide accountSid and authToken'
      }, { status: 400 });
    }

    // Test Twilio authentication
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`
      }
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({
        success: false,
        error: `Authentication failed (${response.status})`,
        details: error,
        debug: {
          accountSid: accountSid,
          authTokenLength: authToken.length,
          authTokenStart: authToken.substring(0, 4) + '...',
        }
      });
    }

    const account = await response.json();
    
    return NextResponse.json({
      success: true,
      message: 'Twilio authentication successful!',
      account: {
        friendlyName: account.friendly_name,
        accountSid: account.sid,
        status: account.status,
        type: account.type
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to test credentials',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}