'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, Phone, PhoneOff, Loader2, Wrench, AlertTriangle } from 'lucide-react';
import { getVertical } from '@/lib/speedToLead/verticals';

/**
 * Browser-based test call.
 *
 * Vapi can run a call over WebRTC with no phone number and no telephony
 * provider, which is the only way to exercise the full flow while Twilio is
 * unavailable. It hits the same assistant, the same calendar tools and the same
 * end-of-call webhook as a real phone call — the only difference is transport.
 *
 * Sample lead values are passed as `variableValues` so the prompt's
 * {{customer.name}} / {{service_type}} / {{address}} resolve exactly as they
 * would for a real intake.
 */

interface Props {
  assistantId: string;
  vapiAssistantId: string;
  assistantName: string;
  /** The assistant's trade, so the test doesn't feed it a mismatched service. */
  vertical?: string;
  onClose: () => void;
}

type Entry =
  | { kind: 'speech'; role: 'user' | 'assistant'; text: string }
  | { kind: 'tool'; name: string; args: string }
  | { kind: 'system'; text: string };

export function AssistantWebTest({ assistantId, vapiAssistantId, assistantName, vertical, onClose }: Props) {
  const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;

  const [status, setStatus] = useState<'idle' | 'connecting' | 'live' | 'ended'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [callId, setCallId] = useState<string | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null);

  const [name, setName] = useState('Dana Reyes');
  const [address, setAddress] = useState('1420 Pearl St, Denver, CO');
  // Must follow the assistant's own trade. Hardcoding a value here feeds
  // {{service_type}} a mismatched service and the agent will faithfully repeat
  // it back — a plumbing agent asking about "the HVAC issue".
  const [serviceType, setServiceType] = useState(
    vertical ? getVertical(vertical).label : 'service'
  );
  const [details, setDetails] = useState('AC is running but not cooling');

  const vapiRef = useRef<any>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const push = (e: Entry) => setEntries((prev) => [...prev, e]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [entries]);

  useEffect(() => {
    return () => {
      try {
        vapiRef.current?.stop();
      } catch {
        /* already torn down */
      }
    };
  }, []);

  const start = async () => {
    if (!publicKey) {
      setError('NEXT_PUBLIC_VAPI_PUBLIC_KEY is not set. Add it from the Vapi dashboard (Account → Public Key) and restart the dev server.');
      return;
    }

    setError(null);
    setEntries([]);
    setStatus('connecting');

    try {
      // Create a real lead first. The Vapi webhook resolves calls by
      // metadata.leadId, so without one the end-of-call report is discarded and
      // there is no summary or transcript to inspect afterwards.
      const leadRes = await fetch(`/api/assistants/${assistantId}/web-test-lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, address, details, serviceType, availability: 'Tomorrow morning' }),
      });
      const leadData = await leadRes.json();
      if (!leadRes.ok) throw new Error(leadData.error || 'Could not create the test lead');
      setLeadId(leadData.leadId);

      const { default: Vapi } = await import('@vapi-ai/web');
      const vapi = new Vapi(publicKey);
      vapiRef.current = vapi;

      vapi.on('call-start', () => {
        setStatus('live');
        push({ kind: 'system', text: 'Call connected. Speak into your mic.' });
      });

      vapi.on('call-end', () => {
        setStatus('ended');
        push({
          kind: 'system',
          text: 'Call ended. The end-of-call webhook fires now — the summary and transcript land on the test lead.',
        });
      });

      vapi.on('error', (e: any) => {
        setError(e?.errorMsg || e?.message || JSON.stringify(e)?.slice(0, 300) || 'Unknown Vapi error');
        setStatus('ended');
      });

      vapi.on('message', (m: any) => {
        if (m?.type === 'transcript' && m.transcriptType === 'final') {
          push({ kind: 'speech', role: m.role === 'user' ? 'user' : 'assistant', text: m.transcript });
        }

        // Surfaced explicitly so you can watch checkAvailability / bookAppointment
        // fire without tailing server logs.
        const calls = m?.toolCalls || m?.toolCallList;
        if (Array.isArray(calls)) {
          calls.forEach((c: any) => {
            const fn = c.function || c;
            let args = fn?.arguments;
            if (typeof args !== 'string') args = JSON.stringify(args ?? {});
            push({ kind: 'tool', name: fn?.name || 'unknown', args });
          });
        }

        if (m?.type === 'status-update' && m.status === 'ended') {
          push({ kind: 'system', text: `Ended reason: ${m.endedReason ?? 'unknown'}` });
        }
      });

      const call = await vapi.start(vapiAssistantId, {
        variableValues: {
          // Server-built, so a browser test resolves the same variables a real
          // call does. Notably date_reference, which the prompt needs to turn
          // "Thursday" into an actual date and which the client cannot compute.
          ...(leadData.variableValues || {}),
          // `customer` is a Vapi reserved default inside variableValues, and
          // templating is LiquidJS — so a nested object here is what makes
          // {{customer.name}} resolve. It is NOT a top-level override key; Vapi
          // rejects the call outright with "property customer should not exist".
          customer: { name },
          // The form can override what the lead was created with.
          service_type: serviceType,
          address,
          details,
          stated_availability: 'Tomorrow morning',
        },
        // Belt-and-braces for the end-of-call webhook. Vapi drops unknown keys
        // from assistantOverrides silently, so this may not survive — the PATCH
        // below is the link that actually holds.
        metadata: { leadId: leadData.leadId, source: 'web_test' },
      });

      if (call?.id) {
        setCallId(call.id);
        // Stamp the call id on the lead so the in-call calendar tools and the
        // end-of-call report can find it. Without this the booking lands on the
        // calendar with no lead attached, and nothing attributes it.
        await fetch(`/api/assistants/${assistantId}/web-test-lead`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ leadId: leadData.leadId, vapiCallId: call.id }),
        }).catch(() => undefined);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start the call');
      setStatus('ended');
    }
  };

  const stop = async () => {
    try {
      await vapiRef.current?.stop();
    } catch {
      /* noop */
    }
    setStatus('ended');
  };

  const live = status === 'live' || status === 'connecting';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Browser test call</h2>
            <p className="text-sm text-gray-600">{assistantName} — no phone number needed</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {!publicKey && (
            <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-none mt-0.5" />
              <div className="text-sm text-amber-900">
                <p className="font-medium">Public key missing</p>
                <p className="mt-1">
                  Add <code className="font-mono">NEXT_PUBLIC_VAPI_PUBLIC_KEY</code> to{' '}
                  <code className="font-mono">.env.local</code> (Vapi dashboard → Account → Public Key),
                  then restart the dev server. This is the browser-safe key, not your API key.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 break-words">
              {error}
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">
              Simulated lead — these fill the prompt&apos;s variables
            </p>
            <div className="grid grid-cols-2 gap-3">
              <input
                className="p-2.5 border border-gray-300 rounded-lg text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Customer name"
                disabled={live}
              />
              <input
                className="p-2.5 border border-gray-300 rounded-lg text-sm"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                placeholder="Service type"
                disabled={live}
              />
              <input
                className="col-span-2 p-2.5 border border-gray-300 rounded-lg text-sm"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Service address"
                disabled={live}
              />
              <input
                className="col-span-2 p-2.5 border border-gray-300 rounded-lg text-sm"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Problem details"
                disabled={live}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {status !== 'live' ? (
              <button
                onClick={start}
                disabled={status === 'connecting' || !publicKey}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {status === 'connecting' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Phone className="w-4 h-4" />
                )}
                {status === 'connecting' ? 'Connecting…' : status === 'ended' ? 'Call again' : 'Start call'}
              </button>
            ) : (
              <button
                onClick={stop}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <PhoneOff className="w-4 h-4" /> End call
              </button>
            )}

            {status === 'live' && (
              <span className="flex items-center gap-2 text-sm text-green-700">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Live
              </span>
            )}
            {callId && (
              <span className="text-xs font-mono text-gray-500 truncate">call {callId.slice(0, 8)}…</span>
            )}
            {status === 'ended' && leadId && (
              <a
                href={`/call-summary/${leadId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                View call summary →
              </a>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Transcript &amp; tool calls</p>
            <div
              ref={logRef}
              className="h-72 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-2 text-sm"
            >
              {entries.length === 0 && (
                <p className="text-gray-400">
                  Nothing yet. Start the call, then say you need service and give a day and time —
                  that&apos;s what triggers the calendar tools.
                </p>
              )}
              {entries.map((e, i) =>
                e.kind === 'tool' ? (
                  <div key={i} className="p-2.5 bg-blue-50 border border-blue-200 rounded">
                    <div className="flex items-center gap-2 text-blue-900 font-medium">
                      <Wrench className="w-3.5 h-3.5" /> {e.name}
                    </div>
                    <pre className="mt-1 text-xs text-blue-800 whitespace-pre-wrap break-all">{e.args}</pre>
                  </div>
                ) : e.kind === 'system' ? (
                  <div key={i} className="text-xs text-gray-500 italic">{e.text}</div>
                ) : (
                  <div key={i}>
                    <span
                      className={
                        e.role === 'assistant' ? 'font-medium text-blue-700' : 'font-medium text-gray-900'
                      }
                    >
                      {e.role === 'assistant' ? 'Agent' : 'You'}
                    </span>
                    <span className="text-gray-700"> — {e.text}</span>
                  </div>
                )
              )}
            </div>
          </div>

          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600">
            Calendar tools and the end-of-call webhook call <em>your</em> server, so the assistant must be
            saved while <code className="font-mono">NEXT_PUBLIC_APP_URL</code> and{' '}
            <code className="font-mono">VAPI_WEBHOOK_URL</code> point at your public tunnel — not
            localhost.
          </div>
        </div>
      </div>
    </div>
  );
}
