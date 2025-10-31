'use client';

import React, { useState, useEffect } from 'react';
import { Copy, Check, ExternalLink, Play } from 'lucide-react';

interface GoogleFormIntegrationProps {
  userId: string;
  assistantId: string;
  assistantName?: string;
}

export function GoogleFormIntegration({ userId, assistantId, assistantName }: GoogleFormIntegrationProps) {
  const [copied, setCopied] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWebhookUrl(`${window.location.origin}/api/webhooks/googleform`);
    }
  }, []);

  const generateScript = () => {
    return `function onFormSubmit(e) {
  if (!e || !e.namedValues) {
    Logger.log("⚠️ This function must be triggered by a form submission.");
    return;
  }

  const webhookUrl = '${webhookUrl}';
  const responses = e.namedValues;

  // Extract form fields (adjust field names to match your Google Form)
  const payload = {
    firstname: (responses["First Name"] || responses["firstname"] || [""])[0],
    lastname: (responses["Last Name"] || responses["lastname"] || [""])[0],
    phone: (responses["Phone"] || responses["phone"] || responses["Phone Number"] || [""])[0],
    email: (responses["Email"] || responses["email"] || responses["Email Address"] || [""])[0],
    company: (responses["Company"] || responses["company"] || responses["Company Name"] || [""])[0],
    about: (responses["About"] || responses["about"] || responses["Tell us about your business"] || [""])[0],
    assistantId: '${assistantId}',
    userId: '${userId}'
  };

  // Send to webhook
  try {
    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(webhookUrl, options);
    const responseCode = response.getResponseCode();
    
    if (responseCode === 200) {
      Logger.log('✅ Webhook sent successfully: ' + response.getContentText());
    } else {
      Logger.log('❌ Webhook failed with status ' + responseCode + ': ' + response.getContentText());
    }
  } catch (error) {
    Logger.log('❌ Error sending webhook: ' + error.toString());
  }
}`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateScript());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">Setup Instructions</h4>
        
        <div className="space-y-3">
          <div className="flex items-start space-x-3 p-4 bg-white border rounded-lg">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
              1
            </div>
            <div className="flex-1">
              <h5 className="font-medium text-gray-900 mb-1">Create your Google Form</h5>
              <p className="text-sm text-gray-600">
                Create a Google Form with fields: <span className="font-mono bg-gray-100 px-1">First Name</span>, <span className="font-mono bg-gray-100 px-1">Last Name</span>, <span className="font-mono bg-gray-100 px-1">Phone</span> (required), and optionally <span className="font-mono bg-gray-100 px-1">Email</span>
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-4 bg-white border rounded-lg">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
              2
            </div>
            <div className="flex-1">
              <h5 className="font-medium text-gray-900 mb-1">On Your Google Sheet</h5>
              <p className="text-sm text-gray-600 mb-2">
                under Extensions → <strong>Apps Script</strong>
              </p>
              <a 
                href="https://www.youtube.com/results?search_query=google+forms+apps+script+tutorial" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
              >
                <Play className="w-4 h-4" />
                <span>Watch tutorial</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-4 bg-white border rounded-lg">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
              3
            </div>
            <div className="flex-1">
              <h5 className="font-medium text-gray-900 mb-2">Copy and paste this script</h5>
              <div className="relative">
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto max-h-96">
                  <code>{generateScript()}</code>
                </pre>
                <button
                  onClick={copyToClipboard}
                  className="absolute top-2 right-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs flex items-center space-x-1 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Script</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-4 bg-white border rounded-lg">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
              4
            </div>
            <div className="flex-1">
              <h5 className="font-medium text-gray-900 mb-1">Set up the trigger</h5>
              <div className="text-sm text-gray-600 space-y-1">
                <p>1. In Apps Script editor, click the <strong>clock icon</strong> (Triggers)</p>
                <p>2. Click <strong>+ Add Trigger</strong></p>
                <p>3. Configure:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Function: <span className="font-mono bg-gray-100 px-1">onFormSubmit</span></li>
                  {/* <li>Event source: <strong>From form</strong></li> */}
                  {/* <li>Event type: <strong>On form submit</strong></li> */}
                </ul>
                <p>4. Click <strong>Save</strong></p>
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-4 bg-white border rounded-lg">
            <div className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
              ✓
            </div>
            <div className="flex-1">
              <h5 className="font-medium text-gray-900 mb-1">Test your integration</h5>
              <p className="text-sm text-gray-600">
                Submit a test response to your Google Form. The lead will be created and called automatically!
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>Important:</strong> Make sure your form field names match the script (First Name, Last Name, Phone, Email, Company, About). You can adjust the field mapping in the script if needed.
        </p>
      </div>
    </div>
  );
}
