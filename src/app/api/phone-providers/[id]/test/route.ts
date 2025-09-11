import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongodb';
import PhoneProvider from '@/models/PhoneProvider';

// POST - Test a phone provider connection
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const provider = await PhoneProvider.findOne({
      _id: params.id,
      userId
    });

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    // Update test status to pending
    provider.testStatus = 'pending';
    provider.lastTestedAt = new Date();
    await provider.save();

    try {
      // Test the provider connection
      const testResult = await testProviderConnection(provider);
      
      // Update provider with test results
      provider.testStatus = testResult.success ? 'success' : 'failed';
      provider.testMessage = testResult.message;
      await provider.save();

      return NextResponse.json({
        success: testResult.success,
        message: testResult.message,
        testStatus: provider.testStatus,
        lastTestedAt: provider.lastTestedAt
      });

    } catch (testError) {
      // Update provider with failed test
      provider.testStatus = 'failed';
      provider.testMessage = testError instanceof Error ? testError.message : 'Test failed';
      await provider.save();

      return NextResponse.json({
        success: false,
        message: provider.testMessage,
        testStatus: provider.testStatus,
        lastTestedAt: provider.lastTestedAt
      });
    }

  } catch (error) {
    console.error('Failed to test phone provider:', error);
    return NextResponse.json({
      error: 'Failed to test phone provider',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function testProviderConnection(provider: any): Promise<{ success: boolean; message: string }> {
  const { providerName, credentials, phoneNumber } = provider;

  switch (providerName) {
    case 'twilio':
      return await testTwilioConnection(credentials, phoneNumber);
    case 'plivo':
      return await testPlivoConnection(credentials, phoneNumber);
    case 'nexmo':
      return await testNexmoConnection(credentials, phoneNumber);
    default:
      throw new Error(`Unsupported provider: ${providerName}`);
  }
}

async function testTwilioConnection(credentials: any, phoneNumber: string): Promise<{ success: boolean; message: string }> {
  try {
    // Test Twilio API by fetching account info
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${credentials.accountSid}.json`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${credentials.accountSid}:${credentials.authToken}`).toString('base64')}`
      }
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        message: `Twilio authentication failed: ${response.status} - ${error}`
      };
    }

    const account = await response.json();
    
    // Verify the phone number exists
    const phoneResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${credentials.accountSid}/IncomingPhoneNumbers.json`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${credentials.accountSid}:${credentials.authToken}`).toString('base64')}`
      }
    });

    if (phoneResponse.ok) {
      const phoneData = await phoneResponse.json();
      const hasPhoneNumber = phoneData.incoming_phone_numbers.some((phone: any) => phone.phone_number === phoneNumber);
      
      if (!hasPhoneNumber) {
        return {
          success: false,
          message: `Phone number ${phoneNumber} not found in your Twilio account`
        };
      }
    }

    return {
      success: true,
      message: `Successfully connected to Twilio account: ${account.friendly_name}`
    };

  } catch (error) {
    return {
      success: false,
      message: `Twilio connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

async function testPlivoConnection(credentials: any, phoneNumber: string): Promise<{ success: boolean; message: string }> {
  try {
    // Test Plivo API by fetching account info
    const response = await fetch(`https://api.plivo.com/v1/Account/${credentials.authId}/`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${credentials.authId}:${credentials.authToken}`).toString('base64')}`
      }
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        message: `Plivo authentication failed: ${response.status} - ${error}`
      };
    }

    const account = await response.json();

    return {
      success: true,
      message: `Successfully connected to Plivo account: ${account.name}`
    };

  } catch (error) {
    return {
      success: false,
      message: `Plivo connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

async function testNexmoConnection(credentials: any, phoneNumber: string): Promise<{ success: boolean; message: string }> {
  try {
    // Test Nexmo/Vonage API by fetching account balance
    const response = await fetch(`https://rest.nexmo.com/account/get-balance?api_key=${credentials.apiKey}&api_secret=${credentials.apiSecret}`);

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        message: `Nexmo authentication failed: ${response.status} - ${error}`
      };
    }

    const account = await response.json();

    return {
      success: true,
      message: `Successfully connected to Nexmo account. Balance: ${account.value} ${account.currency}`
    };

  } catch (error) {
    return {
      success: false,
      message: `Nexmo connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}