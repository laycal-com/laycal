import { connectToDatabase } from '@/lib/mongodb';
import PhoneProvider from '@/models/PhoneProvider';
import { logger } from './logger';
import { getPhoneProviderOrDefault, getNoPhoneProviderErrorMessage } from './defaultPhoneProvider';

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const VAPI_ASSISTANT_ID = process.env.VAPI_ASSISTANT_ID;
const VAPI_WEBHOOK_URL = process.env.VAPI_WEBHOOK_URL;

export interface TenantVapiCallRequest {
  userId: string;
  phoneNumber: string;
  assistantId?: string;
  phoneProviderId?: string;
  customer?: {
    name?: string;
    email?: string;
  };
  metadata?: Record<string, any>;
}

export interface TenantVapiCallResponse {
  id: string;
  status: string;
  phoneNumber: string;
  assistantId: string;
  customer?: {
    name?: string;
    email?: string;
  };
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface VapiAssistantConfig {
  name: string;
  voice: {
    gender: 'male' | 'female';
    provider: string;
    voiceId: string;
  };
  mainPrompt: string;
  language: string;
  firstMessage?: string;
  summaryPrompt?: string;
  structuredDataPrompt?: string;
  model?: {
    provider: string;
    model: string;
  };
}

export interface VapiAssistantResponse {
  id: string;
  name: string;
  voice: {
    provider: string;
    voiceId: string;
  };
  model: {
    provider: string;
    model: string;
  };
  firstMessage?: string;
  systemPrompt?: string;
  createdAt: string;
  updatedAt: string;
}

export class TenantVapiService {
  private apiKey: string;
  private baseUrl = 'https://api.vapi.ai';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || VAPI_API_KEY || '';
  }

  async initiateCall(callData: TenantVapiCallRequest): Promise<TenantVapiCallResponse> {
    if (!this.apiKey) {
      throw new Error('Vapi API key is required');
    }

    await connectToDatabase();
    
    let vapiPhoneNumberId: string;
    let assistantId: string;
    let isUsingDefaultProvider = false;

    // If specific phoneProviderId and assistantId are provided, use them
    if (callData.phoneProviderId && callData.assistantId) {
      const phoneProvider = await PhoneProvider.findById(callData.phoneProviderId);
      assistantId = callData.assistantId;
      
      if (!phoneProvider) {
        throw new Error('Specified phone provider not found');
      }

      // Create or get the Vapi phone number for this specific provider
      try {
        vapiPhoneNumberId = await this.ensureVapiPhoneNumber(phoneProvider);
      } catch (error) {
        throw new Error(`Failed to configure phone number in Vapi: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      // Use new default provider logic with US phone number support
      // Use the provided assistantId if available, otherwise fall back to environment variable
      assistantId = callData.assistantId || VAPI_ASSISTANT_ID || '';
      
      const providerResult = await getPhoneProviderOrDefault(callData.userId, callData.phoneNumber);
      
      if (!providerResult) {
        throw new Error(getNoPhoneProviderErrorMessage(callData.phoneNumber));
      }

      vapiPhoneNumberId = providerResult.vapiPhoneNumberId;
      isUsingDefaultProvider = providerResult.isDefault;

      // Log when using default provider for US numbers
      if (isUsingDefaultProvider) {
        logger.info('USING_DEFAULT_US_PROVIDER', 'Using default phone provider for US number', {
          userId: callData.userId,
          targetPhoneNumber: callData.phoneNumber,
          vapiPhoneNumberId
        });
      }
    }

    // Make the call using the specified or default assistant
    const response = await fetch(`${this.baseUrl}/call`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assistantId: assistantId,
        phoneNumberId: vapiPhoneNumberId,
        customer: {
          number: callData.phoneNumber,
          name: callData.customer?.name,
          email: callData.customer?.email,
        },
        ...(callData.metadata && { metadata: callData.metadata }),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Vapi API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  private async ensureVapiPhoneNumber(phoneProvider: any): Promise<string> {
    // Check if we already have a Vapi phone number for this provider
    if (phoneProvider.vapiPhoneNumberId) {
      return phoneProvider.vapiPhoneNumberId;
    }

    // Create a new Vapi phone number using the provider's credentials
    const vapiPhoneNumberId = await this.createVapiPhoneNumber(phoneProvider);
    
    // Save the Vapi phone number ID to the provider
    phoneProvider.vapiPhoneNumberId = vapiPhoneNumberId;
    await phoneProvider.save();

    return vapiPhoneNumberId;
  }

  async createVapiPhoneNumber(phoneProvider: any): Promise<string> {
    const { providerName, phoneNumber, credentials } = phoneProvider;

    // Pre-validate the phone number exists in the provider account
    await this.validatePhoneNumberInProvider(providerName, phoneNumber, credentials);

    let requestBody: any = {
      number: phoneNumber,
      name: `${phoneProvider.displayName} - ${phoneNumber}`,
    };

    // Configure provider-specific settings for Vapi API
    switch (providerName) {
      case 'twilio':
        if (!credentials.accountSid || !credentials.authToken) {
          throw new Error('Twilio credentials missing: accountSid and authToken are required');
        }
        requestBody = {
          ...requestBody,
          provider: 'twilio',
          twilioAccountSid: credentials.accountSid,
          twilioAuthToken: credentials.authToken,
        };
        break;
      case 'plivo':
        requestBody = {
          ...requestBody,
          provider: 'plivo',
          plivoAuthId: credentials.authId,
          plivoAuthToken: credentials.authToken,
        };
        break;
      case 'nexmo':
        requestBody = {
          ...requestBody,
          provider: 'vonage', // Nexmo is now Vonage in Vapi
          vonageApiKey: credentials.apiKey,
          vonageApiSecret: credentials.apiSecret,
        };
        break;
      default:
        throw new Error(`Unsupported provider: ${providerName}`);
    }

    logger.info('VAPI_API_REQUEST', 'Creating Vapi phone number', {
      data: { requestBody, phoneNumber, providerName: phoneProvider.providerName }
    });

    const response = await fetch(`${this.baseUrl}/phone-number`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('VAPI_API_ERROR', 'Vapi phone number creation failed', {
        error: new Error(`Failed to create Vapi phone number: ${response.status} - ${error}`),
        data: { status: response.status, responseError: error }
      });
      throw new Error(`Failed to create Vapi phone number: ${response.status} - ${error}`);
    }

    const result = await response.json();
    logger.info('VAPI_PHONE_CREATED', 'Vapi phone number created successfully', {
      data: { result, phoneNumber }
    });
    return result.id;
  }

  private async validatePhoneNumberInProvider(providerName: string, phoneNumber: string, credentials: any): Promise<void> {
    switch (providerName) {
      case 'twilio':
        await this.validateTwilioPhoneNumber(phoneNumber, credentials);
        break;
      case 'plivo':
        await this.validatePlivoPhoneNumber(phoneNumber, credentials);
        break;
      case 'nexmo':
        await this.validateNexmoPhoneNumber(phoneNumber, credentials);
        break;
      default:
        throw new Error(`Unsupported provider: ${providerName}`);
    }
  }

  private async validateTwilioPhoneNumber(phoneNumber: string, credentials: any): Promise<void> {
    try {
      // First verify credentials work
      const accountResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${credentials.accountSid}.json`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${credentials.accountSid}:${credentials.authToken}`).toString('base64')}`
        }
      });

      if (!accountResponse.ok) {
        const error = await accountResponse.text();
        throw new Error(`Twilio authentication failed: ${accountResponse.status} - ${error}`);
      }

      // Then check if phone number exists in account
      const phoneResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${credentials.accountSid}/IncomingPhoneNumbers.json?PhoneNumber=${encodeURIComponent(phoneNumber)}`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${credentials.accountSid}:${credentials.authToken}`).toString('base64')}`
        }
      });

      if (!phoneResponse.ok) {
        const error = await phoneResponse.text();
        throw new Error(`Failed to verify phone number: ${phoneResponse.status} - ${error}`);
      }

      const phoneData = await phoneResponse.json();
      if (!phoneData.incoming_phone_numbers || phoneData.incoming_phone_numbers.length === 0) {
        throw new Error(`Phone number ${phoneNumber} not found in your Twilio account. Please add it to Twilio first.`);
      }

      logger.info('TWILIO_VERIFY_SUCCESS', 'Phone number verified in Twilio account', {
        data: { phoneNumber }
      });
    } catch (error) {
      throw new Error(`Twilio validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async validatePlivoPhoneNumber(phoneNumber: string, credentials: any): Promise<void> {
    try {
      const response = await fetch(`https://api.plivo.com/v1/Account/${credentials.authId}/Number/`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${credentials.authId}:${credentials.authToken}`).toString('base64')}`
        }
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Plivo authentication failed: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const hasPhoneNumber = data.objects?.some((phone: any) => phone.number === phoneNumber);
      
      if (!hasPhoneNumber) {
        throw new Error(`Phone number ${phoneNumber} not found in your Plivo account`);
      }
    } catch (error) {
      throw new Error(`Plivo validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async validateNexmoPhoneNumber(phoneNumber: string, credentials: any): Promise<void> {
    try {
      const response = await fetch(`https://rest.nexmo.com/account/numbers?api_key=${credentials.apiKey}&api_secret=${credentials.apiSecret}`);

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Nexmo authentication failed: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const hasPhoneNumber = data.numbers?.some((phone: any) => phone.msisdn === phoneNumber.replace('+', ''));
      
      if (!hasPhoneNumber) {
        throw new Error(`Phone number ${phoneNumber} not found in your Nexmo account`);
      }
    } catch (error) {
      throw new Error(`Nexmo validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getCallStatus(callId: string): Promise<any> {
    if (!this.apiKey) {
      throw new Error('Vapi API key is required');
    }

    const response = await fetch(`${this.baseUrl}/call/${callId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Vapi API error: ${response.status} - ${error}`);
    }

    return response.json();
  }


  async createAssistant(config: VapiAssistantConfig): Promise<VapiAssistantResponse> {
    if (!this.apiKey) {
      throw new Error('Vapi API key is required');
    }

    const defaultModel = {
      provider: 'openai',
      model: 'gpt-4o-mini'
    };

    // Analysis plan will be added to the request body below

    const requestBody = {
      name: config.name,
      voice: {
        voiceId: config.voice.voiceId,
        provider: config.voice.provider
      },
      model: {
        model: config.model?.model || defaultModel.model,
        provider: config.model?.provider || defaultModel.provider,
        messages: [
          {
            role: 'system',
            content: config.mainPrompt
          }
        ]
      },
      firstMessage: config.firstMessage || "Hi!",
      voicemailMessage: "Please call back when you're available.",
      endCallFunctionEnabled: false,
      endCallMessage: "Goodbye.",
      transcriber: {
        model: 'nova-2',
        language: config.language || 'en',
        provider: 'deepgram',
        endpointing: 300
      },
      serverMessages: [
        "end-of-call-report",
        "status-update"
      ],
      backgroundSound: "off",
      interruptionsEnabled: true,
      ...(VAPI_WEBHOOK_URL && { 
        server: {
          url: VAPI_WEBHOOK_URL,
          timeoutSeconds: 20
        }
      }),
      ...((config.summaryPrompt || config.structuredDataPrompt) && {
        analysisPlan: {
          ...(config.summaryPrompt && {
            summaryPrompt: config.summaryPrompt
          }),
          ...(config.structuredDataPrompt && {
            structuredDataPrompt: config.structuredDataPrompt,
            structuredDataSchema: {
              type: 'object',
              properties: {
                email: {
                  type: 'string',
                  description: 'prospect\'s email address'
                },
                name: {
                  type: 'string', 
                  description: 'prospect\'s name if mentioned'
                },
                phoneNumber: {
                  type: 'string',
                  description: 'prospect\'s phone number'
                },
                slot_booked: {
                  type: 'string',
                  description: 'appointment date/time in ISO format with timezone'
                }
              },
              required: []
            }
          })
        }
      })
    };

    logger.info('VAPI_CREATE_ASSISTANT', 'Creating assistant on Vapi', {
      data: { name: config.name, language: config.language, voice: config.voice }
    });

    const response = await fetch(`${this.baseUrl}/assistant`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('VAPI_CREATE_ASSISTANT_ERROR', 'Failed to create assistant on Vapi', {
        error: new Error(`${response.status} - ${error}`),
        data: { config }
      });
      throw new Error(`Failed to create assistant: ${response.status} - ${error}`);
    }

    const result = await response.json();
    logger.info('VAPI_CREATE_ASSISTANT_SUCCESS', 'Assistant created successfully on Vapi', {
      data: { 
        assistantId: result.id, 
        name: config.name,
        hasSummary: !!config.summaryPrompt,
        hasStructuredData: !!config.structuredDataPrompt
      }
    });

    return result;
  }


  async updateAssistant(assistantId: string, config: VapiAssistantConfig): Promise<VapiAssistantResponse> {
    if (!this.apiKey) {
      throw new Error('Vapi API key is required');
    }

    const requestBody = {
      name: config.name,
      voice: {
        provider: config.voice.provider,
        voiceId: config.voice.voiceId
      },
      model: {
        ...(config.model || { provider: 'openai', model: 'gpt-4o-mini' }),
        messages: [
          {
            role: 'system',
            content: config.mainPrompt
          }
        ]
      },
      firstMessage: config.firstMessage || "Hi!",
      transcriber: {
        provider: 'deepgram',
        model: 'nova-2',
        language: config.language,
        endpointing: 300
      },
      endCallFunctionEnabled: false,
      recordingEnabled: true,
      interruptionsEnabled: true,
      ...(VAPI_WEBHOOK_URL && { serverUrl: VAPI_WEBHOOK_URL })
    };

    logger.info('VAPI_UPDATE_ASSISTANT', 'Updating assistant on Vapi', {
      data: { assistantId, name: config.name }
    });

    const response = await fetch(`${this.baseUrl}/assistant/${assistantId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('VAPI_UPDATE_ASSISTANT_ERROR', 'Failed to update assistant on Vapi', {
        error: new Error(`${response.status} - ${error}`),
        data: { assistantId, config }
      });
      throw new Error(`Failed to update assistant: ${response.status} - ${error}`);
    }

    const result = await response.json();
    logger.info('VAPI_UPDATE_ASSISTANT_SUCCESS', 'Assistant updated successfully on Vapi', {
      data: { assistantId, name: config.name }
    });

    return result;
  }

  async deleteAssistant(assistantId: string): Promise<void> {
    if (!this.apiKey) {
      throw new Error('Vapi API key is required');
    }

    logger.info('VAPI_DELETE_ASSISTANT', 'Deleting assistant on Vapi', {
      data: { assistantId }
    });

    const response = await fetch(`${this.baseUrl}/assistant/${assistantId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('VAPI_DELETE_ASSISTANT_ERROR', 'Failed to delete assistant on Vapi', {
        error: new Error(`${response.status} - ${error}`),
        data: { assistantId }
      });
      throw new Error(`Failed to delete assistant: ${response.status} - ${error}`);
    }

    logger.info('VAPI_DELETE_ASSISTANT_SUCCESS', 'Assistant deleted successfully on Vapi', {
      data: { assistantId }
    });
  }

  async getAssistant(assistantId: string): Promise<VapiAssistantResponse> {
    if (!this.apiKey) {
      throw new Error('Vapi API key is required');
    }

    const response = await fetch(`${this.baseUrl}/assistant/${assistantId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get assistant: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async getAllAssistants(): Promise<VapiAssistantResponse[]> {
    if (!this.apiKey) {
      throw new Error('Vapi API key is required');
    }

    const response = await fetch(`${this.baseUrl}/assistant`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get assistants: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async findAssistantByName(name: string): Promise<VapiAssistantResponse | null> {
    try {
      const assistants = await this.getAllAssistants();
      return assistants.find(assistant => assistant.name === name) || null;
    } catch (error) {
      logger.error('VAPI_FIND_ASSISTANT_ERROR', 'Failed to find assistant by name', {
        error,
        data: { name }
      });
      return null;
    }
  }

  async testAssistant(assistantId: string, phoneNumber: string, phoneProviderId: string): Promise<TenantVapiCallResponse> {
    if (!this.apiKey) {
      throw new Error('Vapi API key is required');
    }

    await connectToDatabase();
    const phoneProvider = await PhoneProvider.findById(phoneProviderId);
    if (!phoneProvider) {
      throw new Error('Phone provider not found');
    }

    const vapiPhoneNumberId = await this.ensureVapiPhoneNumber(phoneProvider);

    logger.info('VAPI_TEST_ASSISTANT', 'Testing assistant with call', {
      data: { assistantId, phoneNumber }
    });

    const response = await fetch(`${this.baseUrl}/call`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assistantId,
        phoneNumberId: vapiPhoneNumberId,
        customer: {
          number: phoneNumber,
          name: 'Test Call'
        },
        metadata: {
          isTest: true,
          timestamp: new Date().toISOString()
        }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('VAPI_TEST_ASSISTANT_ERROR', 'Failed to test assistant', {
        error: new Error(`${response.status} - ${error}`),
        data: { assistantId, phoneNumber }
      });
      throw new Error(`Failed to test assistant: ${response.status} - ${error}`);
    }

    const result = await response.json();
    logger.info('VAPI_TEST_ASSISTANT_SUCCESS', 'Assistant test call initiated', {
      data: { assistantId, callId: result.id }
    });

    return result;
  }
}

export const tenantVapiService = new TenantVapiService();