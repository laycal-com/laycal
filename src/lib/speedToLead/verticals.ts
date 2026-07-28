/**
 * Home-service verticals.
 *
 * Each preset seeds the qualification questions and objection responses that
 * make STAGE 2 of the call worth anything — a generic "tell me about your
 * problem" wastes the 30-second head start. The wizard shows these as editable
 * defaults and passes whatever the user ends up with to the prompt generator.
 */

export interface Vertical {
  id: string;
  label: string;
  /** Fills "a local ___" in the Identity block. */
  descriptor: string;
  /** Trade-specific STAGE 2 questions, asked one at a time. */
  qualifyingQuestions: string[];
  /** Objection → suggested response. */
  objections: Array<{ objection: string; response: string }>;
  /** Typical on-site visit length, minutes. */
  defaultDurationMins: number;
}

const SHARED_OBJECTIONS = [
  {
    objection: 'How much will it cost?',
    response:
      'The diagnostic visit is {{diagnostic_fee}}, and the technician gives you an exact quote before doing any work — no surprises.',
  },
  {
    objection: 'I need to check my schedule',
    response:
      "No problem — what day generally works best and I'll pencil it in, you can confirm the time when the tech calls.",
  },
  {
    objection: "I filled out other companies' forms too",
    response:
      "Totally understand — that's actually why I'm calling so fast. We can have someone out to you tomorrow, want me to lock that in?",
  },
];

export const VERTICALS: Vertical[] = [
  {
    id: 'hvac',
    label: 'HVAC',
    descriptor: 'HVAC company',
    defaultDurationMins: 90,
    qualifyingQuestions: [
      'Is it your air conditioning or your heating that&apos;s giving you trouble?',
      'Is the system not turning on at all, or is it running but not cooling/heating properly?',
      'Is this the only unit, or do you have more than one system in the home?',
      'About how old is the system, if you know?',
      'Any strange noises, leaks, or smells, or is it just not doing its job?',
    ],
    objections: SHARED_OBJECTIONS,
  },
  {
    id: 'plumbing',
    label: 'Plumbing',
    descriptor: 'plumbing company',
    defaultDurationMins: 60,
    qualifyingQuestions: [
      'Is there any active water leaking right now, or has it stopped?',
      'Do you know where it&apos;s coming from — a sink, toilet, water heater, or somewhere in the wall?',
      'Have you been able to shut the water off to that area?',
      'Is it affecting one fixture or the whole house?',
      'How long has this been going on?',
    ],
    objections: [
      {
        objection: 'How much will it cost?',
        response:
          'The service call is {{diagnostic_fee}}, and the plumber quotes the repair before starting — you approve it first.',
      },
      ...SHARED_OBJECTIONS.slice(1),
    ],
  },
  {
    id: 'electrical',
    label: 'Electrical',
    descriptor: 'electrical company',
    defaultDurationMins: 60,
    qualifyingQuestions: [
      'Is the power out to the whole house, or just part of it?',
      'Have you checked whether a breaker has tripped?',
      'Are you seeing or smelling anything unusual — sparking, burning, or scorch marks?',
      'Is this something that started suddenly, or has it been intermittent?',
      'Do you know roughly how old the panel is?',
    ],
    objections: SHARED_OBJECTIONS,
  },
  {
    id: 'roofing',
    label: 'Roofing',
    descriptor: 'roofing company',
    defaultDurationMins: 60,
    qualifyingQuestions: [
      'Is there active water coming into the home right now?',
      'Do you know roughly where the leak is showing up — a ceiling, a wall, the attic?',
      'Was there recent weather — storm, hail, high wind — that might have caused it?',
      'About how old is the roof, if you know?',
      'Have you had any repairs done on it before?',
    ],
    objections: [
      {
        objection: 'How much will it cost?',
        response:
          'The inspection is {{diagnostic_fee}}, and you get a written estimate before any work happens.',
      },
      ...SHARED_OBJECTIONS.slice(1),
    ],
  },
  {
    id: 'garage_door',
    label: 'Garage Door',
    descriptor: 'garage door company',
    defaultDurationMins: 60,
    qualifyingQuestions: [
      'Is the door stuck open, stuck closed, or moving but not right?',
      'Did you hear a loud bang at any point — that usually means a spring?',
      'Is the opener running but the door isn&apos;t moving?',
      'Is it a single door or a double?',
      'Roughly how old is the door or the opener?',
    ],
    objections: SHARED_OBJECTIONS,
  },
  {
    id: 'pest_control',
    label: 'Pest Control',
    descriptor: 'pest control company',
    defaultDurationMins: 45,
    qualifyingQuestions: [
      'What kind of pest are you seeing?',
      'Where in the home are you noticing them most?',
      'About how long has this been going on?',
      'Roughly how many are you seeing — occasional, or constant?',
      'Do you have pets or young children in the home?',
    ],
    objections: SHARED_OBJECTIONS,
  },
  {
    id: 'appliance_repair',
    label: 'Appliance Repair',
    descriptor: 'appliance repair company',
    defaultDurationMins: 60,
    qualifyingQuestions: [
      'Which appliance is giving you trouble?',
      'What&apos;s it doing — not turning on, running but not working, or making noise?',
      'Do you know the brand?',
      'Roughly how old is it?',
      'Has it been repaired before?',
    ],
    objections: SHARED_OBJECTIONS,
  },
];

export const DEFAULT_VERTICAL_ID = 'hvac';

export function getVertical(id: string): Vertical {
  return VERTICALS.find((v) => v.id === id) ?? VERTICALS[0];
}

/** Weekday-keyed business hours; Mon–Fri 8–6, Sat 9–2, closed Sunday. */
export const DEFAULT_BUSINESS_HOURS: Record<string, { open: string; close: string }> = {
  '1': { open: '08:00', close: '18:00' },
  '2': { open: '08:00', close: '18:00' },
  '3': { open: '08:00', close: '18:00' },
  '4': { open: '08:00', close: '18:00' },
  '5': { open: '08:00', close: '18:00' },
  '6': { open: '09:00', close: '14:00' },
};

export const WEEKDAY_LABELS: Record<string, string> = {
  '0': 'Sunday',
  '1': 'Monday',
  '2': 'Tuesday',
  '3': 'Wednesday',
  '4': 'Thursday',
  '5': 'Friday',
  '6': 'Saturday',
};
