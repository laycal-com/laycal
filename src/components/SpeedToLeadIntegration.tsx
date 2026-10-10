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
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-muted/40 border-b border-border">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-sm text-brand-soft hover:text-brand-soft"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 bg-black text-neutral-300 text-xs overflow-x-auto">
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

  // Deliberately forgiving and noisy: the first version matched question titles
  // exactly ("Phone" but not "Phone number") and threw the response away, so a
  // form that did not line up failed without a trace.
  const appsScript = `function onFormSubmit(e) {
  // Works with a trigger on the spreadsheet (namedValues) or on the form itself (response).
  var answers = {};
  if (e && e.namedValues) {
    for (var k in e.namedValues) answers[k] = e.namedValues[k][0];
  } else if (e && e.response) {
    e.response.getItemResponses().forEach(function (r) {
      answers[r.getItem().getTitle()] = String(r.getResponse());
    });
  } else {
    Logger.log("No form data. Add an 'On form submit' trigger; do not run this from the editor.");
    return;
  }

  // Question titles are matched loosely: capitals, spaces and punctuation are
  // ignored, and a title only needs to contain the word ("Your phone number" works).
  var norm = function (s) { return String(s).toLowerCase().replace(/[^a-z0-9]/g, ""); };
  var find = function (words) {
    var keys = Object.keys(answers);
    for (var i = 0; i < words.length; i++) {
      for (var j = 0; j < keys.length; j++) {
        if (norm(keys[j]).indexOf(words[i]) !== -1 && answers[keys[j]]) return answers[keys[j]];
      }
    }
    return "";
  };

  var payload = {
    firstName:    find(["firstname", "first"]),
    lastName:     find(["lastname", "surname", "last"]),
    email:        find(["email"]),
    phone:        find(["phone", "mobile", "whatsapp", "tel", "number"]),
    address:      find(["address"]),
    details:      find(["details", "describe", "problem", "message", "issue"]),
    availability: find(["availability", "preferredtime", "besttime"])
  };
  // A single "Name" or "Full name" question.
  if (!payload.firstName) payload.firstName = find(["fullname", "name"]);

  var res = UrlFetchApp.fetch(${JSON.stringify(endpoint)}, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  // Shows under Executions in Apps Script. 200 means the call was started;
  // anything else says why it was not.
  Logger.log("Laycal replied " + res.getResponseCode() + ": " + res.getContentText());
  Logger.log("Sent: " + JSON.stringify(payload));
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
      <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
        <p className="text-sm text-brand-soft">
          Every submission to this endpoint creates a lead and calls it immediately with
          {assistantName ? <strong> {assistantName}</strong> : ' this assistant'}. There is no queue and no
          delay — that is the whole point.
        </p>
      </div>

      <div>
        <h4 className="font-semibold text-foreground mb-2">Your endpoint</h4>
        <div className="flex items-center gap-2">
          <code className="flex-1 px-3 py-2 bg-muted rounded font-mono text-sm break-all">
            {endpoint || 'Loading…'}
          </code>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Accepts <code className="font-mono">POST</code> with a JSON body. Field names are matched loosely,
          so <code className="font-mono">first_name</code>, <code className="font-mono">firstname</code> and{' '}
          <code className="font-mono">First Name</code> all work.
        </p>
      </div>

      <div>
        <h4 className="font-semibold text-foreground mb-3">Fields</h4>
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Field</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Required</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Used for</th>
              </tr>
            </thead>
            <tbody>
              {FIELDS.map((f) => (
                <tr key={f.key} className="border-t border-border">
                  <td className="px-4 py-2 font-mono text-xs">{f.key}</td>
                  <td className="px-4 py-2">
                    {f.required ? (
                      <span className="text-red-500 font-medium">Required</span>
                    ) : (
                      <span className="text-muted-foreground">Optional</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{f.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="font-semibold text-foreground mb-2">Option 1 — Google Forms</h4>
          <ol className="text-sm text-muted-foreground space-y-1 mb-3 list-decimal list-inside">
            <li>Open your form&apos;s linked spreadsheet → Extensions → Apps Script</li>
            <li>Paste the script below and save</li>
            <li>Triggers → Add Trigger → <code className="font-mono">onFormSubmit</code> → On form submit</li>
          </ol>
          <CodeBlock label="Apps Script" code={appsScript} />
        </div>

        <div>
          <h4 className="font-semibold text-foreground mb-2">Option 2 — your own website form</h4>
          <CodeBlock label="HTML / JavaScript" code={htmlSnippet} />
        </div>

        <div>
          <h4 className="font-semibold text-foreground mb-2">Test it</h4>
          <CodeBlock label="curl" code={curl} />
          <p className="mt-2 text-xs text-muted-foreground">
            Use a real number you can answer — this places an actual call and consumes credits.
          </p>
        </div>
      </div>

      <div className="p-4 border border-amber-500/30 bg-amber-500/10 rounded-lg">
        <p className="text-sm text-amber-500">
          <strong>Connect Google Calendar</strong> before going live, or the agent can qualify the lead but
          cannot check availability or book the visit.
        </p>
        <a
          href="/settings"
          className="mt-2 inline-flex items-center gap-1 text-sm text-amber-500 underline"
        >
          Open Settings <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
