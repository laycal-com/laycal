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
  /**
   * Anything the prompt references as {{key}} beyond Vapi's fixed customer
   * schema — service_type, address, client_company and so on.
   *
   * Vapi rejects unknown properties on `customer`, so custom values MUST travel
   * here (assistantOverrides.variableValues) or they silently render as empty
   * strings in the system prompt.
   */
  variableValues?: Record<string, string>;
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
    company?: string;
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
    /** Vapi's own voice provider is versioned; ignored by other providers. */
    version?: string;
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
  /**
   * Calendar tools the agent can call mid-conversation. Defined inline on the
   * assistant rather than as standalone Vapi tool objects because the endpoint
   * URLs embed this assistant's id — the tool has no life of its own and should
   * be created, updated and deleted with its assistant.
   */
  tools?: VapiTool[];
  /**
   * Schema for analysisPlan.structuredDataSchema. Speed-to-lead extracts a
   * different shape than the legacy cold-calling assistants.
   */
  structuredDataSchema?: Record<string, any>;
  /**
   * Overrides VAPI_WEBHOOK_URL for this push. Needed when the public hostname
   * is a tunnel discovered at request time rather than a value baked into env.
   */
  serverUrl?: string;
}

export interface VapiTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
  server: { url: string; timeoutSeconds?: number };
  messages?: Array<{ type: string; content: string }>;
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

/**
 * Vapi answers a deleted/unknown phone number with a 400 whose message names
 * the id, e.g. "`phoneNumber` `<uuid>` does not exist."
 */
function isStalePhoneNumberError(status: number, body: string): boolean {
  return status === 400 && /phoneNumber.*does not exist/i.test(body);
}

/**
 * Vapi's `voice` block. The `vapi` provider takes `version` and a bare language
 * code ("en"), unlike OpenAI/11Labs voices which take neither — so the extra
 * keys are only emitted for that provider.
 */
function buildVoice(voice: VapiAssistantConfig['voice'], language: string) {
  const base = { provider: voice.provider, voiceId: voice.voiceId };
  if (voice.provider !== 'vapi') return base;

  return {
    ...base,
    version: voice.version || '2',
    // "en-US" -> "en"
    language: (language || 'en-US').split('-')[0],
  };
}

/**
 * nova-2-phonecall is Deepgram's telephony-tuned model — noticeably better on
 * 8kHz phone audio than plain nova-2, which matters when the whole product is
 * understanding a homeowner on a mobile in a noisy house.
 */
function buildTranscriber(language: string) {
  return {
    provider: 'deepgram',
    model: 'nova-2-phonecall',
    language: language || 'en-US',
    endpointing: 300,
  };
}

/**
 * Vapi's own default user message for analysis passes — it feeds the transcript
 * and the ended reason. Matching it verbatim means our plans behave the same as
 * ones Vapi generates itself.
 */
const ANALYSIS_USER_MESSAGE =
  'Here is the transcript:\n\n{{transcript}}\n\n. Here is the ended reason of the call:\n\n{{endedReason}}\n\n';

/**
 * Vapi's post-call `analysisPlan`.
 *
 * Three things here were learned against the live API, each the hard way:
 *
 * 1. The flat `summaryPrompt` field is accepted and stored, but whether Vapi
 *    turns `summaryPlan.enabled` on is **inconsistent** — of two assistants
 *    created a day apart by the same code, one came out enabled and the other
 *    did not, and the disabled one produced no `analysis.summary` at all. Being
 *    explicit is the only way to get a predictable result.
 *
 * 2. `analysisPlan` is **replaced wholesale** on PATCH, not merged. Sending
 *    only `summaryPlan` silently drops the structured-data config, so this
 *    always returns the complete plan.
 *
 * 3. The structured-data system message must carry `{{schema}}`. Vapi injects
 *    it when it builds the plan from the legacy fields; hand-written messages
 *    that omit it leave the model without the schema it is meant to fill.
 */
function buildAnalysisPlan(config: VapiAssistantConfig): Record<string, any> | undefined {
  const plan: Record<string, any> = {};

  if (config.summaryPrompt) {
    plan.summaryPlan = {
      enabled: true,
      messages: [
        { role: 'system', content: config.summaryPrompt },
        { role: 'user', content: ANALYSIS_USER_MESSAGE },
      ],
    };
  }

  if (config.structuredDataPrompt || config.structuredDataSchema) {
    const instruction =
      config.structuredDataPrompt || 'Extract the structured fields from this conversation.';

    plan.structuredDataPlan = {
      enabled: true,
      ...(config.structuredDataSchema && { schema: config.structuredDataSchema }),
      messages: [
        {
          role: 'system',
          content:
            `${instruction} Use only what was actually said; leave a field empty rather than ` +
            'guessing.\n\nJson Schema:\n{{schema}}\n\nOnly respond with the JSON.',
        },
        { role: 'user', content: ANALYSIS_USER_MESSAGE },
      ],
    };
  }

  return Object.keys(plan).length > 0 ? plan : undefined;
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
    /** Set when the number came from a user PhoneProvider we can re-provision. */
    let healableProviderId: string | undefined;

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

      isUsingDefaultProvider = providerResult.isDefault;
      healableProviderId = providerResult.providerId;

      if (providerResult.vapiPhoneNumberId) {
        vapiPhoneNumberId = providerResult.vapiPhoneNumberId;
      } else if (providerResult.providerId) {
        // Configured but not yet provisioned on Vapi — do it now, and let any
        // credential error surface verbatim instead of becoming a misleading
        // "no phone provider configured".
        const provider = await PhoneProvider.findById(providerResult.providerId);
        if (!provider) {
          throw new Error(getNoPhoneProviderErrorMessage(callData.phoneNumber));
        }
        vapiPhoneNumberId = await this.ensureVapiPhoneNumber(provider);
      } else {
        throw new Error(getNoPhoneProviderErrorMessage(callData.phoneNumber));
      }

      // Log when using default provider for US numbers
      if (isUsingDefaultProvider) {
        logger.info('USING_DEFAULT_US_PROVIDER', 'Using default phone provider for US number', {
          userId: callData.userId,
          data: { targetPhoneNumber: callData.phoneNumber, vapiPhoneNumberId }
        });
      }
    }

    const postCall = (phoneNumberId: string) =>
      fetch(`${this.baseUrl}/call`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assistantId: assistantId,
          phoneNumberId,
          // Only Vapi's own customer fields go here — it rejects extras.
          customer: {
            number: callData.phoneNumber,
            ...(callData.customer?.name && { name: callData.customer.name }),
            ...(callData.customer?.email && { email: callData.customer.email }),
          },
          // Everything the prompt interpolates rides in variableValues instead.
          ...(callData.variableValues &&
            Object.keys(callData.variableValues).length > 0 && {
              assistantOverrides: { variableValues: callData.variableValues },
            }),
          ...(callData.metadata && { metadata: callData.metadata }),
        }),
      });

    let response = await postCall(vapiPhoneNumberId);

    if (!response.ok) {
      const error = await response.text();

      // The stored vapiPhoneNumberId is a cache. If the number was deleted on
      // Vapi (or created under a different API key/account) every future call
      // fails identically forever, because nothing revalidates it. Drop the
      // stale id, re-provision from the provider's credentials, and retry once.
      if (isStalePhoneNumberError(response.status, error) && healableProviderId) {
        logger.warn('VAPI_PHONE_NUMBER_STALE', 'Cached Vapi phone number no longer exists — re-provisioning', {
          userId: callData.userId,
          data: { staleVapiPhoneNumberId: vapiPhoneNumberId, phoneProviderId: healableProviderId },
        });

        const provider = await PhoneProvider.findById(healableProviderId);
        if (provider) {
          provider.vapiPhoneNumberId = undefined;
          await provider.save();

          const freshId = await this.ensureVapiPhoneNumber(provider);
          logger.info('VAPI_PHONE_NUMBER_REPROVISIONED', 'Re-created Vapi phone number', {
            userId: callData.userId,
            data: { phoneProviderId: healableProviderId, vapiPhoneNumberId: freshId },
          });

          response = await postCall(freshId);
          if (response.ok) return response.json();

          const retryError = await response.text();
          throw new Error(`Vapi API error after re-provisioning: ${response.status} - ${retryError}`);
        }
      }

      if (isStalePhoneNumberError(response.status, error)) {
        throw new Error(
          'The phone number configured for this account no longer exists in Vapi. ' +
            'Reconnect your phone provider in Settings.'
        );
      }

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

    const analysisPlan = buildAnalysisPlan(config);

    const requestBody = {
      name: config.name,
      voice: buildVoice(config.voice, config.language),
      model: {
        model: config.model?.model || defaultModel.model,
        provider: config.model?.provider || defaultModel.provider,
        messages: [
          {
            role: 'system',
            content: config.mainPrompt
          }
        ],
        ...(config.tools?.length && { tools: config.tools })
      },
      firstMessage: config.firstMessage || "Hi!",
      voicemailMessage: "Please call back when you're available.",
      endCallFunctionEnabled: false,
      endCallMessage: "Goodbye.",
      transcriber: buildTranscriber(config.language),
      serverMessages: [
        "end-of-call-report",
        "status-update"
      ],
      backgroundSound: "off",
      interruptionsEnabled: true,
      ...((config.serverUrl || VAPI_WEBHOOK_URL) && {
        server: {
          url: config.serverUrl || VAPI_WEBHOOK_URL,
          timeoutSeconds: 20
        }
      }),
      ...(analysisPlan && { analysisPlan }),
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
      voice: buildVoice(config.voice, config.language),
      model: {
        ...(config.model || { provider: 'openai', model: 'gpt-4o-mini' }),
        messages: [
          {
            role: 'system',
            content: config.mainPrompt
          }
        ],
        ...(config.tools?.length && { tools: config.tools })
      },
      firstMessage: config.firstMessage || "Hi!",
      transcriber: buildTranscriber(config.language),
      ...((config.serverUrl || VAPI_WEBHOOK_URL) && {
        server: { url: config.serverUrl || VAPI_WEBHOOK_URL, timeoutSeconds: 20 }
      }),
      endCallFunctionEnabled: false,
      recordingEnabled: true,
      interruptionsEnabled: true,
      // Was previously omitted here, which meant a resync pushed a new prompt
      // and new tools but left the analysis plan untouched — so summaries
      // stayed off no matter how many times you resynced.
      ...(buildAnalysisPlan(config) && { analysisPlan: buildAnalysisPlan(config) }),
      // The `server` block above is the current field; the legacy top-level
      // `serverUrl` is intentionally not sent so the two can never disagree.
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

  /**
   * Releases a phone number registration on Vapi.
   *
   * Best-effort: a 404 means it is already gone, which is the desired end
   * state. Callers should not fail a local delete because of this — an
   * orphaned Vapi registration is untidy, a provider you cannot remove is
   * worse.
   */
  async deletePhoneNumber(vapiPhoneNumberId: string): Promise<boolean> {
    if (!this.apiKey) {
      throw new Error('Vapi API key is required');
    }

    const response = await fetch(`${this.baseUrl}/phone-number/${vapiPhoneNumberId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok && response.status !== 404) {
      const error = await response.text();
      logger.warn('VAPI_DELETE_PHONE_NUMBER_FAILED', 'Could not release Vapi phone number', {
        data: { vapiPhoneNumberId, status: response.status, error: error.slice(0, 300) }
      });
      return false;
    }

    logger.info('VAPI_DELETE_PHONE_NUMBER', 'Vapi phone number released', {
      data: { vapiPhoneNumberId, alreadyGone: response.status === 404 }
    });
    return true;
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