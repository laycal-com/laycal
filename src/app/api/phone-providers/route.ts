import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongodb';
import PhoneProvider from '@/models/PhoneProvider';
import { tenantVapiService } from '@/lib/tenantVapi';
import { logger } from '@/lib/logger';

// GET - List all phone providers for the current user
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const providers = await PhoneProvider.find({ userId })
      .sort({ isDefault: -1, createdAt: -1 });

    return NextResponse.json({
      success: true,
      providers: providers.map(provider => ({
        id: provider._id,
        providerName: provider.providerName,
        displayName: provider.displayName,
        phoneNumber: provider.phoneNumber,
        isActive: provider.isActive,
        isDefault: provider.isDefault,
        vapiPhoneNumberId: provider.vapiPhoneNumberId,
        lastTestedAt: provider.lastTestedAt,
        testStatus: provider.testStatus,
        testMessage: provider.testMessage,
        createdAt: provider.createdAt,
        // Don't include credentials in the list response
      }))
    });

  } catch (error) {
    logger.error('PHONE_PROVIDERS_FETCH', 'Failed to fetch phone providers', {
      userId,
      error
    });
    return NextResponse.json({
      error: 'Failed to fetch phone providers',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Create a new phone provider
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      providerName,
      displayName,
      phoneNumber,
      credentials,
      isDefault = false
    } = body;

    // Validate required fields
    if (!providerName || !displayName || !phoneNumber || !credentials) {
      return NextResponse.json({
        error: 'Missing required fields',
        required: ['providerName', 'displayName', 'phoneNumber', 'credentials']
      }, { status: 400 });
    }

    // Validate provider-specific credentials
    const validationError = validateProviderCredentials(providerName, credentials);
    if (validationError) {
      return NextResponse.json({
        error: 'Invalid credentials',
        details: validationError
      }, { status: 400 });
    }

    await connectToDatabase();

    // Check if this is the first provider for this user
    const existingProviders = await PhoneProvider.countDocuments({ userId });
    const shouldBeDefault = existingProviders === 0 || isDefault;

    const provider = new PhoneProvider({
      userId,
      providerName,
      displayName,
      phoneNumber,
      credentials,
      isDefault: shouldBeDefault,
      isActive: true
    });

    await provider.save();

    // Automatically create Vapi phone number
    let vapiPhoneNumberId = null;
    let vapiError = null;
    
    try {
      logger.info('VAPI_PHONE_CREATE', 'Creating Vapi phone number automatically', {
        userId,
        data: { providerName, phoneNumber, displayName }
      });
      
      vapiPhoneNumberId = await tenantVapiService.createVapiPhoneNumber(provider);
      
      // Update provider with Vapi phone number ID
      provider.vapiPhoneNumberId = vapiPhoneNumberId;
      await provider.save();
      
      logger.info('VAPI_PHONE_CREATE_SUCCESS', 'Vapi phone number created successfully', {
        userId,
        data: { vapiPhoneNumberId, providerName, phoneNumber }
      });
    } catch (error) {
      logger.error('VAPI_PHONE_CREATE_FAILED', 'Failed to create Vapi phone number', {
        userId,
        error,
        data: { providerName, phoneNumber }
      });
      vapiError = error instanceof Error ? error.message : 'Unknown error';
      
      // Don't fail the entire operation - provider is still saved
      // User can manually retry later
    }

    return NextResponse.json({
      success: true,
      message: vapiPhoneNumberId 
        ? 'Phone provider and Vapi phone number created successfully'
        : 'Phone provider created (Vapi phone number creation failed)',
      provider: {
        id: provider._id,
        providerName: provider.providerName,
        displayName: provider.displayName,
        phoneNumber: provider.phoneNumber,
        isActive: provider.isActive,
        isDefault: provider.isDefault,
        vapiPhoneNumberId: vapiPhoneNumberId,
        createdAt: provider.createdAt
      },
      vapiPhoneNumberId: vapiPhoneNumberId,
      vapiError: vapiError
    });

  } catch (error) {
    logger.error('PHONE_PROVIDER_CREATE', 'Failed to create phone provider', {
      userId,
      error,
      data: { providerName, displayName, phoneNumber }
    });
    return NextResponse.json({
      error: 'Failed to create phone provider',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function validateProviderCredentials(providerName: string, credentials: any): string | null {
  switch (providerName) {
    case 'twilio':
      if (!credentials.accountSid || !credentials.authToken) {
        return 'Twilio requires accountSid and authToken';
      }
      break;
    case 'plivo':
      if (!credentials.authId || !credentials.authToken) {
        return 'Plivo requires authId and authToken';
      }
      break;
    case 'nexmo':
      if (!credentials.apiKey || !credentials.apiSecret) {
        return 'Nexmo requires apiKey and apiSecret';
      }
      break;
    default:
      return `Unsupported provider: ${providerName}`;
  }
  return null;
}