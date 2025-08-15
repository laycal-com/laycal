require('dotenv').config({ path: '.env.local' });

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const VAPI_ASSISTANT_ID = process.env.VAPI_ASSISTANT_ID;
const VAPI_WEBHOOK_URL = process.env.VAPI_WEBHOOK_URL;

async function updateVapiAssistant() {
  if (!VAPI_API_KEY || !VAPI_ASSISTANT_ID || !VAPI_WEBHOOK_URL) {
    console.error('❌ Missing required environment variables');
    console.log('Required: VAPI_API_KEY, VAPI_ASSISTANT_ID, VAPI_WEBHOOK_URL');
    process.exit(1);
  }

  console.log('🔧 Updating Vapi assistant configuration...');
  console.log('Assistant ID:', VAPI_ASSISTANT_ID);
  console.log('Webhook URL:', VAPI_WEBHOOK_URL);

  try {
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
      console.error(`❌ Failed to update assistant: ${response.status} - ${error}`);
      process.exit(1);
    }

    const result = await response.json();
    console.log('✅ Vapi assistant updated successfully!');
    console.log('📋 Configuration:', JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('❌ Error updating assistant:', error.message);
    process.exit(1);
  }
}

updateVapiAssistant();