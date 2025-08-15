const VAPI_API_KEY = process.env.VAPI_API_KEY;
const VAPI_ASSISTANT_ID = process.env.VAPI_ASSISTANT_ID;
const VAPI_WEBHOOK_URL = process.env.VAPI_WEBHOOK_URL;

export async function updateVapiAssistantConfig() {
  if (!VAPI_API_KEY || !VAPI_ASSISTANT_ID || !VAPI_WEBHOOK_URL) {
    throw new Error('Missing required Vapi environment variables');
  }

  const response = await fetch(`https://api.vapi.ai/assistant/${VAPI_ASSISTANT_ID}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${VAPI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      server: {
        url: VAPI_WEBHOOK_URL
      },
      serverMessages: ["end-of-call-report", "status-update"]
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update Vapi assistant: ${response.status} - ${error}`);
  }

  return response.json();
}