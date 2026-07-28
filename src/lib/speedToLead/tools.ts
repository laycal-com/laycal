import type { VapiTool } from '@/lib/tenantVapi';

/**
 * Calendar tools bound to a single assistant.
 *
 * The endpoint URLs carry the assistant id, so these definitions are generated
 * per assistant and shipped inline on it (see VapiAssistantConfig.tools). The
 * agent calls checkAvailability when the homeowner names a time, then
 * bookAppointment once a slot is agreed.
 */
export function buildCalendarTools(assistantId: string, appUrl: string): VapiTool[] {
  const base = `${appUrl.replace(/\/$/, '')}/api/vapi/calendar`;

  return [
    {
      type: 'function',
      function: {
        name: 'checkAvailability',
        description:
          'Check whether a specific appointment slot is free on the technician calendar. ' +
          'Call this as soon as the homeowner suggests or agrees to a day and time, before promising anything. ' +
          'If the slot is taken, the response includes alternative slots you should offer instead.',
        parameters: {
          type: 'object',
          properties: {
            startTime: {
              type: 'string',
              description:
                'Requested appointment start as a full ISO 8601 datetime with timezone offset, e.g. 2026-07-28T14:00:00-04:00. ' +
                'Resolve relative phrases like "tomorrow afternoon" against the current date and time given in your instructions.',
            },
          },
          required: ['startTime'],
        },
      },
      server: { url: `${base}/${assistantId}`, timeoutSeconds: 20 },
      messages: [
        { type: 'request-start', content: 'Let me check the schedule.' },
        { type: 'request-failed', content: "I'm having trouble reaching the schedule right now." },
      ],
    },
    {
      type: 'function',
      function: {
        name: 'bookAppointment',
        description:
          'Book the technician visit. Only call this after checkAvailability confirmed the slot is free ' +
          'AND the homeowner verbally agreed to it. Do not call this speculatively.',
        parameters: {
          type: 'object',
          properties: {
            startTime: {
              type: 'string',
              description:
                'Confirmed appointment start as a full ISO 8601 datetime with timezone offset.',
            },
            customerName: { type: 'string', description: "Homeowner's full name." },
            address: { type: 'string', description: 'Service address confirmed on the call.' },
            problemSummary: {
              type: 'string',
              description: 'One sentence describing the problem, for the technician.',
            },
            // phoneNumber is deliberately NOT a parameter. The server already
            // knows the number it dialled; asking the model for it means that
            // when the homeowner says "use the number you're calling me on",
            // that sentence gets written into the field verbatim.
          },
          required: ['startTime', 'customerName', 'address'],
        },
      },
      server: { url: `${base}/create/${assistantId}`, timeoutSeconds: 20 },
      messages: [
        { type: 'request-start', content: 'Booking that in for you now.' },
        { type: 'request-failed', content: "I couldn't lock that in — let me take your details instead." },
      ],
    },
  ];
}

/**
 * What we extract from a speed-to-lead call. Templated rather than LLM-authored
 * so downstream reporting can rely on the field names being stable.
 */
export const SPEED_TO_LEAD_SCHEMA = {
  type: 'object',
  properties: {
    problem_type: {
      type: 'string',
      description: 'The category of problem reported, in the trade\'s own terms.',
    },
    problem_symptom: {
      type: 'string',
      description: 'What is actually happening — the specific symptom described.',
    },
    system_age: { type: 'string', description: 'Age of the system or equipment if mentioned.' },
    urgency: {
      type: 'string',
      description:
        'How urgent, including household factors such as elderly residents, young children or health concerns.',
    },
    confirmed_address: { type: 'string', description: 'Service address confirmed on the call.' },
    slot_booked: {
      type: 'string',
      description: 'Booked appointment start in ISO 8601 with timezone, or empty if nothing was booked.',
    },
    booking_status: {
      type: 'string',
      description: 'One of: booked, callback_requested, declined, no_answer, wrong_number.',
    },
    email: { type: 'string', description: "Homeowner's email if confirmed on the call." },
  },
  required: [],
} as const;

export const SPEED_TO_LEAD_SUMMARY_PROMPT =
  'In 2-3 sentences, summarise this service call: what the homeowner reported, how urgent it is, ' +
  'and whether a visit was booked (with the day and time). Write it for a dispatcher who did not hear the call.';
