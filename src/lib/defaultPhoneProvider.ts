import { connectToDatabase } from '@/lib/mongodb';
import PhoneProvider from '@/models/PhoneProvider';
import { logger } from './logger';

// Default Vapi phone number ID for US numbers only
const DEFAULT_US_VAPI_PHONE_NUMBER_ID = 'c55b06b7-d11b-45f4-8c5c-ed25b3f5fe56';

/**
 * Checks if a phone number is a US phone number
 * @param phoneNumber Phone number in E.164 format (e.g., +12345678901)
 * @returns true if the phone number is a US number, false otherwise
 */
export function isUSPhoneNumber(phoneNumber: string): boolean {
  // US phone numbers start with +1 and have exactly 10 digits after the country code
  return /^\+1\d{10}$/.test(phoneNumber);
}

/**
 * Gets a phone provider for a user, falling back to default US provider if none exists
 * IMPORTANT: Default provider is only available for US phone numbers
 * @param userId User ID to find phone provider for
 * @param targetPhoneNumber The phone number being called (used to determine if US default should be used)
 * @returns Phone provider object with vapiPhoneNumberId, or null if no provider available
 */
export async function getPhoneProviderOrDefault(
  userId: string, 
  targetPhoneNumber?: string
): Promise<{ vapiPhoneNumberId: string; isDefault: boolean } | null> {
  await connectToDatabase();

  // First, try to find user's own phone provider
  const userPhoneProvider = await PhoneProvider.findOne({
    userId: userId,
    isActive: true,
    isDefault: true
  });

  if (userPhoneProvider && userPhoneProvider.vapiPhoneNumberId) {
    logger.info('PHONE_PROVIDER_FOUND', 'Using user phone provider', {
      userId,
      phoneProviderId: userPhoneProvider._id,
      targetPhoneNumber
    });
    
    return {
      vapiPhoneNumberId: userPhoneProvider.vapiPhoneNumberId,
      isDefault: false
    };
  }

  // If no user provider and we have a target phone number, check if it's US
  if (targetPhoneNumber && isUSPhoneNumber(targetPhoneNumber)) {
    logger.info('DEFAULT_US_PROVIDER_USED', 'Using default US phone provider (no user provider found)', {
      userId,
      targetPhoneNumber,
      defaultVapiPhoneNumberId: DEFAULT_US_VAPI_PHONE_NUMBER_ID
    });
    
    return {
      vapiPhoneNumberId: DEFAULT_US_VAPI_PHONE_NUMBER_ID,
      isDefault: true
    };
  }

  // If target phone number is not US, cannot use default provider
  if (targetPhoneNumber && !isUSPhoneNumber(targetPhoneNumber)) {
    logger.warn('NON_US_NUMBER_NO_PROVIDER', 'Cannot use default provider for non-US number', {
      userId,
      targetPhoneNumber
    });
    
    return null;
  }

  // No target phone number provided and no user provider
  logger.warn('NO_PHONE_PROVIDER_AVAILABLE', 'No phone provider configured and no target number to check', {
    userId
  });
  
  return null;
}

/**
 * Gets an error message when no phone provider is available
 * @param targetPhoneNumber The phone number being called
 * @returns Appropriate error message
 */
export function getNoPhoneProviderErrorMessage(targetPhoneNumber?: string): string {
  if (targetPhoneNumber && !isUSPhoneNumber(targetPhoneNumber)) {
    return 'No phone provider configured. International calls require setting up your own phone provider in Settings. Default provider is only available for US phone numbers (+1).';
  }
  
  return 'No phone provider configured. Please add a phone provider in your settings or use a US phone number (+1) to use the default provider.';
}