import { NextRequest, NextResponse } from 'next/server';

/**
 * Glue between Vapi's tool-call webhook shape and plain HTTP.
 *
 * Vapi always POSTs tool invocations wrapped in a `message.toolCalls` envelope
 * and expects `{ results: [{ toolCallId, result }] }` back, where `result` is a
 * string that gets fed to the model. These helpers keep that protocol in one
 * place so the route handlers stay readable, and also accept a flat body/query
 * so the endpoints can be exercised by hand.
 */

export interface ParsedToolCall {
  toolCallId: string | null;
  name: string | null;
  args: Record<string, any>;
  /** Vapi call id, carried through so audit rows can be joined to the call. */
  callId: string | null;
  phoneNumberId: string | null;
  /**
   * The number actually on the call, straight from Vapi.
   *
   * Never ask the model for this. When a homeowner says "use the number you're
   * calling me on", an LLM will faithfully write that sentence into the field.
   */
  customerNumber: string | null;
  /** metadata.leadId set when the call was placed, used to recover the lead. */
  leadId: string | null;
}

export async function parseToolCall(req: NextRequest): Promise<ParsedToolCall> {
  const empty = {
    toolCallId: null,
    name: null,
    callId: null,
    phoneNumberId: null,
    customerNumber: null,
    leadId: null,
  };

  if (req.method === 'GET') {
    const args: Record<string, any> = {};
    req.nextUrl.searchParams.forEach((value, key) => {
      args[key] = value;
    });
    return { ...empty, args };
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return { ...empty, args: {} };
  }

  const msgCall = body?.message?.call ?? body?.call ?? {};
  const callId = msgCall?.id ?? null;
  const phoneNumberId = msgCall?.phoneNumberId ?? body?.message?.phoneNumber?.id ?? null;
  const customerNumber = msgCall?.customer?.number ?? body?.message?.customer?.number ?? null;
  const leadId = msgCall?.metadata?.leadId ?? body?.message?.metadata?.leadId ?? null;

  const call = body?.message?.toolCalls?.[0] ?? body?.message?.toolCallList?.[0];

  if (call) {
    let args = call.function?.arguments ?? call.arguments ?? {};
    // Vapi sometimes delivers arguments as a JSON string.
    if (typeof args === 'string') {
      try {
        args = JSON.parse(args);
      } catch {
        args = {};
      }
    }
    return {
      toolCallId: call.id ?? null,
      name: call.function?.name ?? call.name ?? null,
      args: args ?? {},
      callId,
      phoneNumberId,
      customerNumber,
      leadId,
    };
  }

  // Flat body — manual testing.
  return {
    toolCallId: null,
    name: null,
    args: body ?? {},
    callId,
    phoneNumberId,
    customerNumber,
    leadId,
  };
}

/**
 * Vapi reads `result` as text, so payloads are stringified. Always HTTP 200:
 * a non-2xx makes Vapi surface a generic tool failure to the model instead of
 * our message, which produces worse behaviour on the call.
 */
export function toolResult(toolCallId: string | null, payload: unknown) {
  const result = typeof payload === 'string' ? payload : JSON.stringify(payload);

  if (!toolCallId) {
    return NextResponse.json(payload as any, { status: 200 });
  }

  return NextResponse.json({ results: [{ toolCallId, result }] }, { status: 200 });
}

/**
 * Best-effort in-memory rate limit.
 *
 * These endpoints are unauthenticated by design, so this caps trivial abuse of
 * a leaked assistant id. It is per-instance state — on serverless the real
 * ceiling is (limit x warm instances), which is fine for the threat model but
 * is not a security boundary.
 */
const HITS = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (HITS.get(key) ?? []).filter((t) => now - t < windowMs);

  if (recent.length >= limit) {
    HITS.set(key, recent);
    return false;
  }

  recent.push(now);
  HITS.set(key, recent);

  // Bound memory if many distinct ids are probed.
  if (HITS.size > 5000) {
    for (const [k, v] of HITS) {
      if (!v.some((t) => now - t < windowMs)) HITS.delete(k);
    }
  }

  return true;
}
