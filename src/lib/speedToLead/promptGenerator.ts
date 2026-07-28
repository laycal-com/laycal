import { complete, DEFAULT_PROMPT_MODEL } from '@/lib/openrouter';
import { getVertical, WEEKDAY_LABELS } from './verticals';

export interface SpeedToLeadConfig {
  agentName: string;
  clientCompany: string;
  vertical: string;
  serviceArea?: string;
  timezone: string;
  businessHours: Record<string, { open: string; close: string }>;
  appointmentDurationMins: number;
  diagnosticFee?: string;
  qualifyingQuestions: string[];
  objections: Array<{ objection: string; response: string }>;
  tone: 'warm' | 'direct' | 'professional';
  extraInstructions?: string;
}

export interface GeneratedPrompt {
  mainPrompt: string;
  firstMessage: string;
  model: string;
}

/**
 * The exemplar. This exact prompt is what worked in production, so it is shown
 * to the model as the structural target rather than described abstractly.
 */
const REFERENCE_PROMPT = `[Identity]
You are Sam, a friendly and efficient scheduling assistant for Ace Heating & Air, a local HVAC company. You are calling a homeowner who just submitted a request for service on Ace Heating & Air's website moments ago. Your job is to confirm their problem, qualify the urgency, and book a technician visit.

You are NOT a salesperson. You are the helpful first point of contact who gets them scheduled fast. Warm, competent, quick.

[Context - CRITICAL]
The homeowner JUST filled out a form seconds ago, so they are expecting contact and the issue is fresh in their mind. Reference that you're calling about the request they just submitted.

[Prospect Information Available]
- Name: {{customer.name}}
- Service requested: {{service_type}}
- Address on file: {{address}}

[Style]
- Warm, natural, efficient — like a great front-desk person at a busy shop
- Use light conversational fillers ('okay', 'got it', 'gotcha', 'no problem')
- Sound like you know the trade — confident with the terms, not robotic
- Keep it moving; homeowners with a broken AC want help, not chitchat

[Opening Greeting Protocol - CRITICAL]
- "Hi, is this {{customer.name}}? ... Hi! This is Sam calling from Ace Heating & Air — I'm reaching out about the request you just submitted on our site. Looks like you're having some trouble with your system?"
- WAIT for their confirmation and response before continuing.

[Conversation Flow]
STAGE 1 — Confirm & empathize
STAGE 2 — Qualify the problem (trade-specific — THIS is what matters)
STAGE 3 — Qualify urgency (household factors)
STAGE 4 — Confirm location
STAGE 5 — Book the visit

[Response Guidelines]
- ONE question at a time. PAUSE after each. Never stack questions.
- Give 2-3 seconds of silence before prompting "Are you still there?"
- Do NOT interrupt. Let them finish completely.
- Acknowledge each answer before the next question ("Okay", "Gotcha", "That makes sense").
- Keep the whole call under 3 minutes.

[Objection Handling]

[Data Collection - Required before ending]
A checklist of what should already be captured — not questions to ask now:
- Problem type and symptom
- System age if it came up
- Urgency and any household factors
- Confirmed service address
- The booked appointment slot

[Closing Protocol]
- Recap the booking out loud: day, time and address. "You're all set for Thursday at 10, at 1420 Pearl Street."
- Mention the technician will call when they're on the way.
- "Thanks, and we'll get that sorted for you. Take care!"

[Error Handling]`;

const SYSTEM_MESSAGE = `You are a prompt engineer who writes system prompts for real-time voice AI agents that call homeowners.

Rules you must follow:
- Output ONLY the finished system prompt. No preamble, no explanation, no markdown code fences.
- Keep the exact bracketed section structure of the reference: [Identity], [Context - CRITICAL], [Prospect Information Available], [Style], [Opening Greeting Protocol - CRITICAL], [Conversation Flow] with STAGE 1 through STAGE 5, [Response Guidelines], [Objection Handling], [Data Collection - Required before ending], [Closing Protocol], [Error Handling].
- Write the company name, trade, service area and fees as LITERAL TEXT. They never change for this agent, so they belong in the prompt itself — never as a placeholder or variable.
- The ONLY template variables allowed are these three, and they must be preserved character-for-character including the double braces: {{customer.name}}, {{service_type}}, {{address}}. They hold per-lead data supplied at call time. Never invent other variables and never rename these.
- The agent speaks out loud. Write words a person says, never markdown, bullets read aloud, emoji or stage directions.
- ONE question at a time is a hard rule. Never stack two questions in one line, and never write a line that asks something and then continues talking. Every question is the end of a turn.
- Do not invent prices, guarantees, warranties or timeframes that were not given to you.
- Write STAGE 2 questions in the vocabulary of the specific trade. This is the most important part of the prompt.
- NEVER instruct the agent to ask for, confirm or collect a phone number, anywhere in the prompt. The system already knows the number it is calling. A line like "confirm the best phone number" makes the agent waste the caller's time asking for something it already has.
- [Data Collection - Required before ending] is a CHECKLIST of what should already have been captured during the conversation. It is not a list of extra questions to ask at the end. Never write "confirm the specific nature of..." there — that was STAGE 2's job.
- [Closing Protocol] must recap the booked visit concretely: the day, the time and the address, spoken back to the homeowner. The appointment is already locked in at this point, so never say a technician will "be in touch to confirm the time" or "finalize the arrival time" — that contradicts what just happened and makes the booking sound uncertain. The technician calling when they are on their way is fine to mention.`;

/** Liquid, evaluated by Vapi at call time — not by us. */
/**
 * The fallback date line, used when {{date_reference}} is empty.
 *
 * %A matters: without the weekday the model has to derive it from the date
 * before it can resolve "Thursday", and it gets that wrong. {{date_reference}}
 * (built in callVariables.ts) is the real fix and supersedes this whenever the
 * call was placed through one of our own paths.
 */
function buildDateTimeLine(timezone: string): string {
  return (
    `Current date: {{ "now" | date: "%A, %B %d, %Y", "${timezone}" }} | ` +
    `Current time: {{ "now" | date: "%I:%M %p", "${timezone}" }} | ` +
    `Timezone: ${timezone}`
  );
}

function formatHours(hours: Record<string, { open: string; close: string }>): string {
  const open = Object.entries(hours)
    .filter(([, v]) => v?.open && v?.close)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([day, v]) => `${WEEKDAY_LABELS[day] ?? day} ${v.open}–${v.close}`);
  return open.length ? open.join(', ') : 'Not specified';
}

/**
 * Deterministic block appended after generation.
 *
 * Tool names, argument names and the Liquid syntax must survive byte-exact for
 * the call to work, so they are never left to the model to reproduce.
 */
/**
 * Turn-taking rules, appended verbatim to every prompt.
 *
 * The model writing the prompt puts "one question at a time" in its own
 * [Response Guidelines], but that phrasing is soft and the agent still stacks a
 * question onto a question onto the closing and hangs up without ever pausing.
 * The rule is the difference between a conversation and a monologue, so it is
 * stated last, concretely, and is never the generator's to word.
 */
const TURN_TAKING_BLOCK = `[Turn Taking - THE MOST IMPORTANT RULE]
You are on a live phone call. The person needs silence in order to answer you.

- Say ONE thing, then STOP TALKING. Do not continue until they reply.
- NEVER put two questions in one turn. Not "and also", not "as well as", not a question followed by another question.
- NEVER ask a question and then keep talking. The question is the END of your turn.
- NEVER ask a question in the same turn as the closing. If you are saying goodbye, you are done asking things.
- NEVER read a list of items out loud. Ask about one, wait, then decide what to ask next.
- After they answer, acknowledge it briefly ("Okay", "Got it", "Gotcha") before your next single question.
- If they go quiet, wait a full two to three seconds before saying "Are you still there?"
- Do not end the call in the same breath as a question. Only close once every question has been answered.

If you notice yourself about to say "Also," or "And one more thing," or "Before we finish," — stop. Ask it as its own turn, or do not ask it at all.`;

function buildToolBlock(cfg: SpeedToLeadConfig): string {
  return `[Scheduling Tools - CRITICAL]
[Today's Calendar - use these exact dates, never work them out yourself]
{{date_reference}}

If the block above is empty, fall back to: ${buildDateTimeLine(cfg.timezone)}

When the homeowner names a weekday ("Thursday"), find that weekday in the calendar above and use ITS date. Do not count days yourself. "Tomorrow" means the TOMORROW line. Never guess a date.

You have two tools:
1. checkAvailability — call this the moment the homeowner suggests or agrees to a day and time. Pass startTime as a full ISO 8601 datetime with timezone offset. Never promise a slot before this returns.
   - It replies with the weekday and date it understood. If that is not the day the homeowner asked for, you resolved it wrong — correct yourself and call it again.
   - If it returns free, say the day and date back to the homeowner before booking: "Great — that's Thursday the 30th of July at 2 PM, does that work?" WAIT for them to agree.
   - If it returns not free, it includes alternative slots. Offer the two closest ones in plain language ("I've got Thursday at 10, or Friday at 2 — which works?"). Never read an ISO timestamp out loud.
2. bookAppointment — call this only after checkAvailability said the slot was free AND the homeowner agreed to the day and date out loud. Pass startTime, customerName, address, and a one-sentence problemSummary.

If the homeowner changes their mind after you have booked, that is fine — check the new slot and call bookAppointment again with the new time. It moves the existing visit rather than creating a second one. Never tell them you cannot change it.

Never ask for a callback number and never pass one — the system already has the number it is calling. If the homeowner offers a different number, acknowledge it and mention it in problemSummary instead.

After bookAppointment succeeds, recap the booking clearly: weekday, date, time and address. If either tool fails, do not invent a booking — tell them someone will call right back to confirm the time, and end politely.

Appointment length is ${cfg.appointmentDurationMins} minutes. Business hours are: ${formatHours(cfg.businessHours)}. Never offer a time outside those hours.`;
}

function buildUserMessage(cfg: SpeedToLeadConfig): string {
  const vertical = getVertical(cfg.vertical);
  const toneNote = {
    warm: 'Warm and friendly, with light conversational fillers.',
    direct: 'Direct and efficient. Minimal filler, no chitchat.',
    professional: 'Polished and professional, courteous but businesslike.',
  }[cfg.tone];

  return `Write the system prompt for a speed-to-lead voice agent.

BUSINESS
- Company name: ${cfg.clientCompany}
- Trade: ${vertical.label} (${vertical.descriptor})
${cfg.serviceArea ? `- Service area: ${cfg.serviceArea}` : ''}
- Agent's name: ${cfg.agentName}
- Diagnostic/visit fee to quote: ${cfg.diagnosticFee || 'not specified — say the technician will confirm pricing, do not invent a number'}

TONE
${toneNote}

STAGE 2 QUALIFYING QUESTIONS — use these, in this order, one at a time. Rephrase for natural speech but keep the intent:
${cfg.qualifyingQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

OBJECTION HANDLING — cover each of these:
${cfg.objections.map((o) => `- "${o.objection}" → ${o.response}`).join('\n')}

${cfg.extraInstructions ? `ADDITIONAL INSTRUCTIONS FROM THE BUSINESS\n${cfg.extraInstructions}\n` : ''}
Write "${cfg.clientCompany}" as literal text everywhere the company is named — the agent must know who it works for without anything being injected at call time.

IMPORTANT: do NOT write a [Scheduling Tools] section and do NOT mention checking a calendar, tools, functions or current date/time. That section is appended separately. End your output after [Error Handling].

Here is the reference prompt whose structure and voice you must match:

${REFERENCE_PROMPT}`;
}

/** Strips fences and any chat-model preamble before the first bracketed section. */
function sanitize(raw: string): string {
  let text = raw.trim();

  text = text.replace(/^```[a-zA-Z]*\s*\n?/, '').replace(/\n?```\s*$/, '');

  const start = text.indexOf('[Identity]');
  if (start > 0) text = text.slice(start);

  return text.trim();
}

export async function generateSpeedToLeadPrompt(
  cfg: SpeedToLeadConfig,
  model: string = DEFAULT_PROMPT_MODEL
): Promise<GeneratedPrompt> {
  const raw = await complete(
    [
      { role: 'system', content: SYSTEM_MESSAGE },
      { role: 'user', content: buildUserMessage(cfg) },
    ],
    { model, temperature: 0.4, maxTokens: 4000 }
  );

  let body = sanitize(raw);

  // The model occasionally writes a tools section despite being told not to;
  // drop it so ours is the only one.
  body = body.replace(/\n\[Scheduling Tools[\s\S]*$/i, '').trim();

  // Backstop: the company name is a constant for this assistant and must be in
  // the prompt itself. If the model reached for a placeholder anyway, resolve it
  // here — otherwise the agent's identity would depend on every call path
  // remembering to inject it, and it would introduce itself as "calling from ,".
  body = body.replace(/\{\{\s*client_company\s*\}\}/g, cfg.clientCompany);

  // Backstop: strip any instruction to collect a phone number. The system
  // already has it, the booking tool no longer accepts one, and asking makes
  // the agent burn the caller's patience on a question with no purpose.
  body = body
    .split('\n')
    .filter((line) => {
      const asksForPhone =
        /(phone\s*number|callback\s*number|contact\s*number|best\s*number)/i.test(line) &&
        /(confirm|collect|ask|get|obtain|verify|capture|record)/i.test(line);
      return !asksForPhone;
    })
    .join('\n');

  // Collapse blank runs left behind by removed lines.
  body = body.replace(/\n{3,}/g, '\n\n').trim();

  // Turn-taking goes last so it is the freshest instruction in context.
  const mainPrompt = `${body}\n\n${buildToolBlock(cfg)}\n\n${TURN_TAKING_BLOCK}`;

  return {
    mainPrompt,
    firstMessage: `Hi, is this {{customer.name}}?`,
    model,
  };
}
