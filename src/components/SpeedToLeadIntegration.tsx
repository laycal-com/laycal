'use client';

import React, { useEffect, useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';

/**
 * Hands the customer the intake endpoint for one assistant.
 *
 * The URL carries the assistant id, so a submission knows which agent to use
 * without any auth handshake — that is what keeps time-to-dial low enough for
 * the product to mean anything.
 */

interface Props {
  assistantId: string;
  assistantName?: string;
}

const FIELDS: Array<{ key: string; required: boolean; note: string }> = [
  { key: 'phone', required: true, note: 'The number we dial. Nothing happens without it.' },
  { key: 'firstName', required: false, note: 'Used in the greeting.' },
  { key: 'lastName', required: false, note: 'Combined with first name.' },
  { key: 'email', required: false, note: 'Attached to the calendar invite.' },
  { key: 'address', required: false, note: 'Confirmed on the call, used as the job location.' },
  { key: 'details', required: false, note: 'What they typed about the problem.' },
  { key: 'availability', required: false, note: 'When they said they are free.' },
  { key: 'serviceType', required: false, note: 'Defaults to the assistant’s trade.' },
];

function CodeBlock({ label, code }: { label: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 bg-gray-900 text-gray-100 text-xs overflow-x-auto">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function SpeedToLeadIntegration({ assistantId, assistantName }: Props) {
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') setOrigin(window.location.origin);
  }, []);

  const endpoint = `${origin}/api/webhooks/lead-intake/${assistantId}`;

  const appsScript = `function onFormSubmit(e) {
  if (!e || !e.namedValues) {
    Logger.log("Run this from a form submit trigger, not the editor.");
    return;
  }

  var r = e.namedValues;
  var get = function (names) {
    for (var i = 0; i < names.length; i++) {
      if (r[names[i]] && r[names[i]][0]) return r[names[i]][0];
    }
    return "";
  };

  var payload = {
    firstName:    get(["First Name", "firstName", "First name"]),
    lastName:     get(["Last Name", "lastName", "Last name"]),
    email:        get(["Email", "Email Address"]),
    phone:        get(["Phone", "Phone Number", "Mobile"]),
    address:      get(["Address", "Service Address"]),
    details:      get(["Details", "Describe the problem", "Message"]),
    availability: get(["Availability", "Preferred time", "Best time to call"])
  };

  UrlFetchApp.fetch(${JSON.stringify(endpoint)}, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
}`;

  const htmlSnippet = `<script>
document.querySelector('#lead-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = new FormData(e.target);

  await fetch(${JSON.stringify(endpoint)}, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName:    f.get('firstName'),
      lastName:     f.get('lastName'),
      email:        f.get('email'),
      phone:        f.get('phone'),
      address:      f.get('address'),
      details:      f.get('details'),
      availability: f.get('availability')
    })
  });

  window.location.href = '/thank-you';
});
<\/script>`;

  const curl = `curl -X POST ${endpoint} \\
  -H 'Content-Type: application/json' \\
  -d '{
    "firstName": "Dana",
    "lastName": "Reyes",
    "phone": "+13035550142",
    "email": "dana@example.com",
    "address": "1420 Pearl St, Denver, CO",
    "details": "AC is running but not cooling",
    "availability": "Tomorrow morning"
  }'`;

  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          Every submission to this endpoint creates a lead and calls it immediately with
          {assistantName ? <strong> {assistantName}</strong> : ' this assistant'}. There is no queue and no
          delay — that is the whole point.
        </p>
      </div>

      <div>
        <h4 className="font-semibold text-gray-900 mb-2">Your endpoint</h4>
        <div className="flex items-center gap-2">
          <code className="flex-1 px-3 py-2 bg-gray-100 rounded font-mono text-sm break-all">
            {endpoint || 'Loading…'}
          </code>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Accepts <code className="font-mono">POST</code> with a JSON body. Field names are matched loosely,
          so <code className="font-mono">first_name</code>, <code className="font-mono">firstname</code> and{' '}
          <code className="font-mono">First Name</code> all work.
        </p>
      </div>

      <div>
        <h4 className="font-semibold text-gray-900 mb-3">Fields</h4>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-gray-700">Field</th>
                <th className="text-left px-4 py-2 font-medium text-gray-700">Required</th>
                <th className="text-left px-4 py-2 font-medium text-gray-700">Used for</th>
              </tr>
            </thead>
            <tbody>
              {FIELDS.map((f) => (
                <tr key={f.key} className="border-t border-gray-100">
                  <td className="px-4 py-2 font-mono text-xs">{f.key}</td>
                  <td className="px-4 py-2">
                    {f.required ? (
                      <span className="text-red-600 font-medium">Required</span>
                    ) : (
                      <span className="text-gray-400">Optional</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-gray-600">{f.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">Option 1 — Google Forms</h4>
          <ol className="text-sm text-gray-600 space-y-1 mb-3 list-decimal list-inside">
            <li>Open your form&apos;s linked spreadsheet → Extensions → Apps Script</li>
            <li>Paste the script below and save</li>
            <li>Triggers → Add Trigger → <code className="font-mono">onFormSubmit</code> → On form submit</li>
          </ol>
          <CodeBlock label="Apps Script" code={appsScript} />
        </div>

        <div>
          <h4 className="font-semibold text-gray-900 mb-2">Option 2 — your own website form</h4>
          <CodeBlock label="HTML / JavaScript" code={htmlSnippet} />
        </div>

        <div>
          <h4 className="font-semibold text-gray-900 mb-2">Test it</h4>
          <CodeBlock label="curl" code={curl} />
          <p className="mt-2 text-xs text-gray-500">
            Use a real number you can answer — this places an actual call and consumes credits.
          </p>
        </div>
      </div>

      <div className="p-4 border border-amber-200 bg-amber-50 rounded-lg">
        <p className="text-sm text-amber-900">
          <strong>Connect Google Calendar</strong> before going live, or the agent can qualify the lead but
          cannot check availability or book the visit.
        </p>
        <a
          href="/settings"
          className="mt-2 inline-flex items-center gap-1 text-sm text-amber-900 underline"
        >
          Open Settings <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
