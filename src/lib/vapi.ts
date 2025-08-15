const VAPI_API_KEY = process.env.VAPI_API_KEY;
const VAPI_ASSISTANT_ID = process.env.VAPI_ASSISTANT_ID;
const VAPI_PHONE_NUMBER_ID = process.env.VAPI_PHONE_NUMBER_ID;
const VAPI_WEBHOOK_URL = process.env.VAPI_WEBHOOK_URL;

if (!VAPI_API_KEY) {
  console.warn('VAPI_API_KEY not found in environment variables');
}

if (!VAPI_ASSISTANT_ID) {
  console.warn('VAPI_ASSISTANT_ID not found in environment variables');
}

if (!VAPI_PHONE_NUMBER_ID) {
  console.warn('VAPI_PHONE_NUMBER_ID not found in environment variables');
}

if (!VAPI_WEBHOOK_URL) {
  console.warn('VAPI_WEBHOOK_URL not found in environment variables');
}

export interface VapiCallRequest {
  phoneNumber: string;
  assistantId?: string;
  customer?: {
    name?: string;
    email?: string;
    company?: string;
  };
  metadata?: Record<string, any>;
  serverUrl?: string;
}

export interface VapiCallResponse {
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

export class VapiService {
  private apiKey: string;
  private baseUrl = 'https://api.vapi.ai';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || VAPI_API_KEY || '';
  }

  async initiateCall(callData: VapiCallRequest): Promise<VapiCallResponse> {
    if (!this.apiKey) {
      throw new Error('Vapi API key is required');
    }

    const response = await fetch(`${this.baseUrl}/call`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assistantId: callData.assistantId || VAPI_ASSISTANT_ID,
        phoneNumberId: VAPI_PHONE_NUMBER_ID,
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
}

export const vapiService = new VapiService();