'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Upload, Copy, Download, RotateCcw } from 'lucide-react';

interface WizardData {
  // Step 1
  hasExistingPrompt: boolean;
  existingPrompt: string;
  
  // Step 2
  assistantName: string;
  tone: string;
  style: string;
  
  // Step 3
  businessName: string;
  businessDescription: string;
  
  // Step 4
  hasScript: boolean;
  script: string;
  
  // Step 5
  objective: string;
  customObjective: string;
  
  // Step 6
  targetAudience: string;
  audienceNotes: string;
  
  // Step 7
  objectionHandling: string;
  objections: Array<{ objection: string; response: string }>;
  
  // Step 8
  closingStyle: string;
  requireEmailSpelling: boolean;
  userTimezone: string;
  
  // Step 9
  callDuration: string;
  formalityLevel: string;
  language: string;
  specialInstructions: string;
  
  // Step 10 - Data Collection
  dataCollectionEnabled: boolean;
  dataFields: Array<{ field: string; isRequired: boolean; isCustom: boolean }>;
}

interface PromptWizardProps {
  onComplete: (prompt: string, summary: string, structuredData?: string) => void;
  onCancel: () => void;
}

const toneOptions = [
  { value: 'friendly', label: 'Friendly', description: 'Warm and approachable' },
  { value: 'professional', label: 'Professional', description: 'Business-focused and polished' },
  { value: 'energetic', label: 'Energetic', description: 'Enthusiastic and dynamic' },
  { value: 'neutral', label: 'Neutral', description: 'Balanced and measured' },
  { value: 'authoritative', label: 'Authoritative', description: 'Confident and commanding' },
  { value: 'casual', label: 'Casual', description: 'Relaxed and informal' }
];

const objectiveOptions = [
  { value: 'appointment', label: 'Book an appointment', description: 'Schedule a consultation or meeting', special: true },
  { value: 'lead', label: 'Generate/qualify a lead', description: 'Collect prospect information' },
  { value: 'info', label: 'Share product/service information', description: 'Educate about offerings' },
  { value: 'callback', label: 'Schedule a callback', description: 'Set up future conversation' },
  { value: 'custom', label: 'Custom objective', description: 'Define your own goal' }
];

const commonObjections = [
  "I'm not interested",
  "I'm too busy",
  "I already have a provider",
  "It's too expensive",
  "Send me information by email",
  "I need to think about it",
  "I don't have time right now",
  "Custom..."
];

const timezones = [
  'America/New_York',
  'America/Chicago', 
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Australia/Sydney'
];

const predefinedDataFields = [
  'First Name',
  'Last Name', 
  'Email Address',
  'Phone Number',
  'Date of Birth',
  'Nationality',
  'Location/Address',
  'Social Security Number',
  'Company Name',
  'Job Title',
  'Industry',
  'Company Size',
  'Annual Revenue',
  'Current Provider/Solution',
  'Budget Range',
  'Decision Timeline',
  'Pain Points/Challenges'
];

export function PromptWizard({ onComplete, onCancel }: PromptWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<WizardData>({
    hasExistingPrompt: false,
    existingPrompt: '',
    assistantName: '',
    tone: '',
    style: '',
    businessName: '',
    businessDescription: '',
    hasScript: false,
    script: '',
    objective: '',
    customObjective: '',
    targetAudience: '',
    audienceNotes: '',
    objectionHandling: '',
    objections: [],
    closingStyle: '',
    requireEmailSpelling: true,
    userTimezone: 'America/New_York',
    callDuration: '',
    formalityLevel: '',
    language: 'English',
    specialInstructions: '',
    dataCollectionEnabled: false,
    dataFields: []
  });

  const [generatedPrompt, setGeneratedPrompt] = useState('');

  const updateData = (field: keyof WizardData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const generatePrompt = () => {
    if (data.hasExistingPrompt) {
      return data.existingPrompt;
    }

    const styleInstructions = data.style === 'natural' 
      ? "Use conversational fillers like 'um,' 'I see,' and 'you know' to sound human and relatable"
      : "Be direct and concise without fillers or hesitations";

    const objectiveInstructions = {
      appointment: "Primary goal is to schedule a consultation/meeting. YOU MUST collect the prospect's email address before ending the call. When collecting email addresses, ask the prospect to spell it out letter by letter for accuracy. Do not hang up or end the call until you have successfully collected: prospect's name, email address (spelled letter-by-letter), and preferred appointment time.",
      lead: "Focus on qualifying the prospect and gathering contact information",
      info: "Provide valuable information about our services and benefits", 
      callback: "Determine best time for a follow-up conversation",
      custom: data.customObjective
    };

    const durationGuidelines = {
      short: "Keep calls brief and focused (2-5 minutes)",
      normal: "Allow natural conversation flow (5-10 minutes)",
      detailed: "Take time for thorough discussions (10+ minutes)"
    };

    let prompt = `[Identity]
You are ${data.assistantName}, a ${data.tone} and professional AI Cold Caller for ${data.businessName}.

[Style]
- Use a ${data.tone}, persuasive, and engaging tone
- ${styleInstructions}
- Speak naturally and ensure the prospect feels valued and understood

[Business Context]
${data.businessDescription || `${data.businessName} provides valuable services to help businesses grow`}

[Response Guidelines]
- Ask ONE question at a time and WAIT for the prospect's complete response before speaking again
- Use polite and engaging language to maintain interest
- After asking a question, PAUSE and give the prospect 2-3 seconds to start responding
- Do NOT interrupt or speak over the prospect - let them finish their thoughts completely
- Listen actively and acknowledge their responses before moving to the next question
- Maintain conversation flow - do not end calls abruptly
- Keep the prospect engaged throughout the entire conversation
${data.objective === 'appointment' ? '- For appointment booking: Stay on the call until ALL information is collected\n- If prospect seems ready to hang up, redirect: "Just one more quick thing before we wrap up..."' : ''}
- If there's silence, wait 2-3 seconds before gently prompting: "Are you there?" or "What do you think?"
${data.callDuration ? `- ${durationGuidelines[data.callDuration as keyof typeof durationGuidelines]}` : ''}

[Task & Goals]
${objectiveInstructions[data.objective as keyof typeof objectiveInstructions] || objectiveInstructions.custom}
${data.targetAudience ? `\nTarget Audience: ${data.targetAudience}` : ''}
${data.audienceNotes ? `\nAudience Notes: ${data.audienceNotes}` : ''}
${data.hasScript ? `\nScript to Follow:\n${data.script}` : ''}

[Conversation Pacing - CRITICAL]
- Speak at a natural, conversational pace - not too fast or too slow
- After each question, STOP talking and wait for the prospect to respond
- Do NOT continue speaking or add more questions while waiting for a response
- Let natural pauses happen in conversation - they are normal and expected
- Only speak again after the prospect has finished their response or after 2-3 seconds of silence
- If the prospect is thinking, give them time - don't rush them
- Acknowledge their response before asking the next question (e.g., "I see", "That makes sense", "Understood")

[Objection Handling]
${data.objectionHandling === 'natural' ? 'Handle objections naturally with empathy and understanding.' :
  data.objectionHandling === 'custom' ? data.objections.map(obj => `If prospect says "${obj.objection}": ${obj.response}`).join('\n') :
  'Focus on presenting value rather than handling objections directly.'}

[Closing Protocol]
- Use a ${data.closingStyle || 'warm and appreciative'} closing approach
${data.objective === 'appointment' ? `- CRITICAL: Do NOT end the call until you have collected ALL required information:
  * Prospect's full name
  * Email address (spelled letter-by-letter and confirmed)
  * Preferred appointment date/time
- If the prospect tries to hang up before providing email, politely insist: "Before we finish, I just need your email address to send you the appointment confirmation"
- Email collection is MANDATORY - ask: "Could you spell that email address for me letter by letter? I want to make sure I get it exactly right"
- Confirm by repeating each character: "So that's J-O-H-N at G-M-A-I-L dot com, is that correct?"
- Only say goodbye AFTER confirming all information is collected` : data.requireEmailSpelling ? '- When collecting email addresses, ask the prospect to spell it out letter by letter\n- Confirm the email by repeating each character for accuracy\n- Example: "Could you spell that for me? J-O-H-N... got it, and what comes after john?"' : ''}

${data.objective === 'appointment' ? `\n[Email Collection Protocol - CRITICAL]
- Email collection is the TOP PRIORITY before ending any call
- Use this conversational flow for email collection:
  1. "I'll need your email address to send you the appointment confirmation" - WAIT for response
  2. "Could you spell that email address for me letter by letter? I want to make sure I get it exactly right"
  3. As they spell, repeat EACH character back slowly: "J... (pause) ...O... (pause) ...H... (pause) ...N... (pause) at G... (pause) ...M... (pause) ...A... (pause) ...I... (pause) ...L... (pause) dot com"
  4. Wait for them to confirm each character before moving to the next
  5. Confirm the complete email: "Perfect, so that's john@gmail.com, is that correct?" - WAIT for confirmation
  6. Only proceed to goodbye after email confirmation
- PACING: Give prospect time to think and spell - don't rush this process
- If prospect resists giving email: "I completely understand your privacy concerns. The email is just for your appointment confirmation and calendar invite. Could you spell it out for me?"
- NEVER end the call without attempting email collection multiple times
- If prospect absolutely refuses email, ask: "Would you prefer I call you back to confirm the appointment instead?"` : ''}

${data.dataCollectionEnabled && data.dataFields.length > 0 ? `\n[Data Collection Protocol]
During the conversation, naturally collect the following information from the prospect:
${data.dataFields.map(field => `- ${field.field}${field.isRequired ? ' (Required)' : ' (Optional)'}`).join('\n')}

IMPORTANT: Collect this information naturally throughout the conversation - don't make it feel like an interrogation.
- Ask for required fields before ending the call
- For optional fields, collect them when relevant to the conversation
- If the prospect volunteers information about these fields, acknowledge and note it
- Use conversational transitions like "That's helpful to know" or "I'd like to understand a bit more about..."
${data.dataFields.filter(f => f.isRequired).length > 0 ? `\nREQUIRED FIELDS - Must be collected before ending the call:
${data.dataFields.filter(f => f.isRequired).map(f => `- ${f.field}`).join('\n')}` : ''}` : ''}

[Error Handling]
- If responses are unclear, ask clarifying questions politely
- If prospect declines, thank them and offer future assistance
- For system errors, apologize and offer to call back

${data.specialInstructions ? `\n[Special Instructions]\n${data.specialInstructions}` : ''}`;

    return prompt.trim();
  };

  const generateSummaryPrompt = () => {
    return "You are an expert note-taker. You will be given a transcript of a call. Summarize the call in 2-3 sentences, highlighting key points and outcomes.";
  };

  const generateStructuredDataPrompt = () => {
    // Generate structured data prompt for all calls, not just appointments
    const baseFields = data.objective === 'appointment' ? {
      "email": "prospect's email address (REQUIRED - should be spelled out letter-by-letter in transcript)",
      "name": "prospect's full name",
      "phoneNumber": "prospect's phone number", 
      "slot_booked": "appointment date/time in ISO format with timezone " + (data.userTimezone || 'UTC')
    } : {
      "name": "prospect's full name",
      "phoneNumber": "prospect's phone number"
    };

    // Add custom data fields if data collection is enabled
    const customFields: {[key: string]: string} = {};
    if (data.dataCollectionEnabled && data.dataFields.length > 0) {
      data.dataFields.forEach(field => {
        if (field.field) {
          const fieldKey = field.field.toLowerCase().replace(/[^a-z0-9]/g, '_');
          customFields[fieldKey] = `${field.field}${field.isRequired ? ' (Required)' : ' (Optional)'}`;
        }
      });
    }

    const allFields = { ...baseFields, ...customFields };

    return `You are a data extraction specialist. Extract the following information from the call transcript and return it as valid JSON:

${data.objective === 'appointment' ? `Current date: {{ "now" | date: "%B %d, %Y", "${data.userTimezone || 'UTC'}" }} | Current time: {{ "now" | date: "%I:%M %p", "${data.userTimezone || 'UTC'}" }} | Timezone: ${data.userTimezone || 'UTC'}

IMPORTANT: The call should contain all required appointment booking information. If email is missing, this indicates the call was incomplete.` : ''}

Extract and return JSON with these fields:
${JSON.stringify(allFields, null, 2)}

${data.objective === 'appointment' ? `For slot_booked, convert any mentioned dates/times to ISO format in the ${data.userTimezone || 'UTC'} timezone. Email field is CRITICAL for appointment confirmation - if not found, the agent did not complete the call properly.` : ''}

${data.dataCollectionEnabled && data.dataFields.length > 0 ? `
Data Collection Notes:
${data.dataFields.map(field => `- ${field.field}: ${field.isRequired ? 'Required field - must be present' : 'Optional field - extract if mentioned'}`).join('\n')}

If any required data fields are missing from the conversation, note this in the extraction result.` : ''}

Return only valid JSON. If information is not available, use null as the value.`;
  };

  const nextStep = () => {
    if (currentStep === 1 && data.hasExistingPrompt) {
      setCurrentStep(11); // Skip to review if using existing prompt
    } else if (currentStep < 11) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep === 11 && data.hasExistingPrompt) {
      setCurrentStep(1); // Go back to prompt choice
    } else if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return data.hasExistingPrompt !== undefined;
      case 2: return data.assistantName && data.tone && data.style;
      case 3: return data.businessName;
      case 4: return true; // Optional
      case 5: return data.objective && (data.objective !== 'custom' || data.customObjective);
      case 6: return data.targetAudience;
      case 7: return data.objectionHandling;
      case 8: return data.closingStyle && (data.objective !== 'appointment' || data.userTimezone);
      case 9: return true; // All optional
      case 10: return true; // Data collection is optional
      case 11: return true;
      default: return false;
    }
  };

  const handleComplete = () => {
    const prompt = generatePrompt();
    const summary = generateSummaryPrompt();
    const structuredData = generateStructuredDataPrompt();
    
    onComplete(prompt, summary, structuredData);
  };

  useEffect(() => {
    if (currentStep === 11) {
      setGeneratedPrompt(generatePrompt());
    }
  }, [currentStep, data]);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Do you have an existing prompt?</h2>
              <p className="text-gray-600">Choose whether to use your own prompt or build one from scratch.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => updateData('hasExistingPrompt', true)}
                className={`p-6 border-2 rounded-lg text-left transition-all ${
                  data.hasExistingPrompt === true
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Upload className="w-8 h-8 text-blue-500 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">I have an existing prompt</h3>
                <p className="text-sm text-gray-600">Paste or upload your custom prompt</p>
              </button>
              
              <button
                onClick={() => updateData('hasExistingPrompt', false)}
                className={`p-6 border-2 rounded-lg text-left transition-all ${
                  data.hasExistingPrompt === false
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mb-3">
                  <span className="text-white font-bold">+</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Build from scratch</h3>
                <p className="text-sm text-gray-600">Use our guided wizard</p>
              </button>
            </div>

            {data.hasExistingPrompt === true && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-6"
              >
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paste your existing prompt
                </label>
                <textarea
                  value={data.existingPrompt}
                  onChange={(e) => updateData('existingPrompt', e.target.value)}
                  className="w-full h-48 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Paste your existing prompt here..."
                />
              </motion.div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Assistant Details</h2>
              <p className="text-gray-600">Configure your AI assistant's personality and communication style.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assistant Name *
              </label>
              <input
                type="text"
                value={data.assistantName}
                onChange={(e) => updateData('assistantName', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Layla, Sarah, Marcus"
                maxLength={50}
              />
              <p className="text-xs text-gray-500 mt-1">{data.assistantName.length}/50 characters</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tone *
                </label>
                <select
                  value={data.tone}
                  onChange={(e) => updateData('tone', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select tone...</option>
                  {toneOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label} - {option.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Communication Style *
                </label>
                <div className="space-y-3">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="style"
                      value="natural"
                      checked={data.style === 'natural'}
                      onChange={(e) => updateData('style', e.target.value)}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium">Natural</div>
                      <div className="text-sm text-gray-600">Uses conversational fillers like 'um, hmm, I see'</div>
                    </div>
                  </label>
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="style"
                      value="sharp"
                      checked={data.style === 'sharp'}
                      onChange={(e) => updateData('style', e.target.value)}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium">Sharp</div>
                      <div className="text-sm text-gray-600">Direct and concise, no fillers or hesitations</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Business Information</h2>
              <p className="text-gray-600">Tell us about your business to personalize the calling experience.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Name *
              </label>
              <input
                type="text"
                value={data.businessName}
                onChange={(e) => updateData('businessName', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Your business name"
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-1">This will be used throughout the call</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Description (Optional)
              </label>
              <textarea
                value={data.businessDescription}
                onChange={(e) => updateData('businessDescription', e.target.value)}
                className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Brief description of services, key benefits, unique selling points..."
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                What makes your business special? What problems do you solve? ({data.businessDescription.length}/500)
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Script Integration</h2>
              <p className="text-gray-600">Do you have a specific script you'd like the assistant to follow?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => updateData('hasScript', true)}
                className={`p-6 border-2 rounded-lg text-left transition-all ${
                  data.hasScript === true
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Upload className="w-8 h-8 text-blue-500 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Yes, I have a script</h3>
                <p className="text-sm text-gray-600">Upload or paste your calling script</p>
              </button>
              
              <button
                onClick={() => updateData('hasScript', false)}
                className={`p-6 border-2 rounded-lg text-left transition-all ${
                  data.hasScript === false
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mb-3">
                  <span className="text-white">✓</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">No script needed</h3>
                <p className="text-sm text-gray-600">The assistant will build naturally from your inputs</p>
              </button>
            </div>

            {data.hasScript === true && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-6"
              >
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Calling Script
                </label>
                <textarea
                  value={data.script}
                  onChange={(e) => updateData('script', e.target.value)}
                  className="w-full h-48 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Paste your calling script here..."
                />
              </motion.div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Call Objective</h2>
              <p className="text-gray-600">What's the main goal of these calls?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {objectiveOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => updateData('objective', option.value)}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    data.objective === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${option.special ? 'ring-2 ring-orange-200' : ''}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{option.label}</h3>
                    {option.special && (
                      <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">
                        Email Collection
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{option.description}</p>
                </button>
              ))}
            </div>

            {data.objective === 'custom' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-6"
              >
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Describe your custom objective
                </label>
                <textarea
                  value={data.customObjective}
                  onChange={(e) => updateData('customObjective', e.target.value)}
                  className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="What do you want to achieve with these calls?"
                />
              </motion.div>
            )}

            {data.objective === 'appointment' && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm text-orange-800">
                  <strong>Note:</strong> The assistant will ask for email confirmation letter-by-letter for accuracy when booking appointments.
                </p>
              </div>
            )}
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Target Audience</h2>
              <p className="text-gray-600">Who will you be calling?</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Who are you calling? *
              </label>
              <input
                type="text"
                value={data.targetAudience}
                onChange={(e) => updateData('targetAudience', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., salon owners, spa managers, small business owners, real estate agents"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {['salon owners', 'spa managers', 'small business owners', 'real estate agents', 'restaurant owners'].map(suggestion => (
                  <button
                    key={suggestion}
                    onClick={() => updateData('targetAudience', suggestion)}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={data.audienceNotes}
                onChange={(e) => updateData('audienceNotes', e.target.value)}
                className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Any specific details about your target audience (demographics, pain points, industry specifics)..."
                maxLength={300}
              />
              <p className="text-xs text-gray-500 mt-1">{data.audienceNotes.length}/300 characters</p>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Objection Handling</h2>
              <p className="text-gray-600">How should the assistant handle objections?</p>
            </div>

            <div className="space-y-4">
              <label className="flex items-start space-x-3 cursor-pointer p-4 border rounded-lg hover:bg-gray-50">
                <input
                  type="radio"
                  name="objectionHandling"
                  value="natural"
                  checked={data.objectionHandling === 'natural'}
                  onChange={(e) => updateData('objectionHandling', e.target.value)}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium">Handle naturally</div>
                  <div className="text-sm text-gray-600">AI will respond to objections with empathy and understanding</div>
                </div>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer p-4 border rounded-lg hover:bg-gray-50">
                <input
                  type="radio"
                  name="objectionHandling"
                  value="custom"
                  checked={data.objectionHandling === 'custom'}
                  onChange={(e) => updateData('objectionHandling', e.target.value)}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium">Use my custom responses</div>
                  <div className="text-sm text-gray-600">Define specific responses to common objections</div>
                </div>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer p-4 border rounded-lg hover:bg-gray-50">
                <input
                  type="radio"
                  name="objectionHandling"
                  value="none"
                  checked={data.objectionHandling === 'none'}
                  onChange={(e) => updateData('objectionHandling', e.target.value)}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium">No objection handling</div>
                  <div className="text-sm text-gray-600">Focus on presenting value, move to closing</div>
                </div>
              </label>
            </div>

            {data.objectionHandling === 'custom' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Custom Objection Responses</h4>
                    <button
                      onClick={() => {
                        const newObjections = [...data.objections, { objection: '', response: '' }];
                        updateData('objections', newObjections);
                      }}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      Add Objection
                    </button>
                  </div>
                  
                  {data.objections.map((obj, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Common Objection
                        </label>
                        <select
                          value={obj.objection}
                          onChange={(e) => {
                            const newObjections = [...data.objections];
                            newObjections[index].objection = e.target.value;
                            updateData('objections', newObjections);
                          }}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select objection...</option>
                          {commonObjections.map(objection => (
                            <option key={objection} value={objection}>{objection}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Your Response
                        </label>
                        <textarea
                          value={obj.response}
                          onChange={(e) => {
                            const newObjections = [...data.objections];
                            newObjections[index].response = e.target.value;
                            updateData('objections', newObjections);
                          }}
                          className="w-full h-20 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          placeholder="How should the assistant respond to this objection?"
                        />
                      </div>
                      
                      <button
                        onClick={() => {
                          const newObjections = data.objections.filter((_, i) => i !== index);
                          updateData('objections', newObjections);
                        }}
                        className="text-red-600 text-sm hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        );

      case 8:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Call Closing</h2>
              <p className="text-gray-600">Configure how calls should end.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Closing Style *
              </label>
              <select
                value={data.closingStyle}
                onChange={(e) => updateData('closingStyle', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select closing style...</option>
                <option value="warm and appreciative">Warm and appreciative</option>
                <option value="professional and brief">Professional and brief</option>
                <option value="enthusiastic and encouraging">Enthusiastic and encouraging</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {data.objective === 'appointment' && (
              <div className="space-y-4">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="font-medium text-orange-900 mb-2">Appointment Booking Settings</h4>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={data.requireEmailSpelling}
                      onChange={(e) => updateData('requireEmailSpelling', e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm text-orange-800">
                      Require email collection letter-by-letter
                    </span>
                  </label>
                  <p className="text-xs text-orange-700 mt-2">
                    Assistant will spell out email character by character for accuracy
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Timezone *
                  </label>
                  <select
                    value={data.userTimezone}
                    onChange={(e) => updateData('userTimezone', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {timezones.map(tz => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Used for appointment scheduling and data extraction
                  </p>
                </div>
              </div>
            )}
          </div>
        );

      case 9:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Advanced Settings</h2>
              <p className="text-gray-600">Optional settings to fine-tune your assistant.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Call Duration Preference
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'short', label: 'Short (2-5 minutes)', desc: 'Brief and focused' },
                    { value: 'normal', label: 'Normal (5-10 minutes)', desc: 'Natural conversation' },
                    { value: 'detailed', label: 'Detailed (10+ minutes)', desc: 'Thorough discussions' }
                  ].map(option => (
                    <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="callDuration"
                        value={option.value}
                        checked={data.callDuration === option.value}
                        onChange={(e) => updateData('callDuration', e.target.value)}
                      />
                      <div>
                        <div className="font-medium text-sm">{option.label}</div>
                        <div className="text-xs text-gray-600">{option.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Formality Level
                </label>
                <select
                  value={data.formalityLevel}
                  onChange={(e) => updateData('formalityLevel', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select formality...</option>
                  <option value="casual">Casual</option>
                  <option value="semi-formal">Semi-formal</option>
                  <option value="professional">Professional</option>
                  <option value="very formal">Very formal</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <select
                value={data.language}
                onChange={(e) => updateData('language', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
                <option value="Italian">Italian</option>
                <option value="Portuguese">Portuguese</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Instructions
              </label>
              <textarea
                value={data.specialInstructions}
                onChange={(e) => updateData('specialInstructions', e.target.value)}
                className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Any additional requirements or special instructions for the assistant..."
              />
            </div>
          </div>
        );

      case 10:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Data Collection</h2>
              <p className="text-gray-600">Configure what information the assistant should collect from prospects.</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="font-medium text-blue-900">Data Collection Benefits</span>
              </div>
              <p className="text-sm text-blue-800">
                Enable data collection to gather valuable prospect information during calls. 
                This data will be extracted and displayed in call summaries.
              </p>
            </div>

            <div className="space-y-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.dataCollectionEnabled}
                  onChange={(e) => updateData('dataCollectionEnabled', e.target.checked)}
                  className="rounded"
                />
                <span className="font-medium">Enable data collection during calls</span>
              </label>
            </div>

            {data.dataCollectionEnabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-6"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">Select Information to Collect</h4>
                    <button
                      onClick={() => {
                        const newFields = [...data.dataFields, { field: '', isRequired: false, isCustom: true }];
                        updateData('dataFields', newFields);
                      }}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      Add Custom Field
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {predefinedDataFields.map(field => {
                      const isSelected = data.dataFields.some(df => df.field === field && !df.isCustom);
                      const selectedField = data.dataFields.find(df => df.field === field && !df.isCustom);
                      
                      return (
                        <label key={field} className="flex items-center space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                const newFields = [...data.dataFields, { field, isRequired: false, isCustom: false }];
                                updateData('dataFields', newFields);
                              } else {
                                const newFields = data.dataFields.filter(df => !(df.field === field && !df.isCustom));
                                updateData('dataFields', newFields);
                              }
                            }}
                            className="rounded"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-sm">{field}</div>
                            {isSelected && (
                              <label className="flex items-center space-x-2 mt-1">
                                <input
                                  type="checkbox"
                                  checked={selectedField?.isRequired || false}
                                  onChange={(e) => {
                                    const newFields = data.dataFields.map(df => 
                                      df.field === field && !df.isCustom 
                                        ? { ...df, isRequired: e.target.checked }
                                        : df
                                    );
                                    updateData('dataFields', newFields);
                                  }}
                                  className="rounded text-xs"
                                />
                                <span className="text-xs text-gray-600">Required</span>
                              </label>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  {/* Custom Fields */}
                  {data.dataFields.filter(df => df.isCustom).length > 0 && (
                    <div className="space-y-3">
                      <h5 className="font-medium text-gray-900">Custom Fields</h5>
                      {data.dataFields.filter(df => df.isCustom).map((field, index) => (
                        <div key={index} className="p-4 border rounded-lg space-y-3">
                          <div className="flex items-center space-x-3">
                            <input
                              type="text"
                              value={field.field}
                              onChange={(e) => {
                                const customFields = data.dataFields.filter(df => df.isCustom);
                                customFields[index].field = e.target.value;
                                const newFields = [
                                  ...data.dataFields.filter(df => !df.isCustom),
                                  ...customFields
                                ];
                                updateData('dataFields', newFields);
                              }}
                              placeholder="Enter field name (e.g., Company Size, Budget Range)"
                              className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={field.isRequired}
                                onChange={(e) => {
                                  const customFields = data.dataFields.filter(df => df.isCustom);
                                  customFields[index].isRequired = e.target.checked;
                                  const newFields = [
                                    ...data.dataFields.filter(df => !df.isCustom),
                                    ...customFields
                                  ];
                                  updateData('dataFields', newFields);
                                }}
                                className="rounded"
                              />
                              <span className="text-sm text-gray-600">Required</span>
                            </label>
                            <button
                              onClick={() => {
                                const newFields = data.dataFields.filter((_, i) => {
                                  const customIndex = data.dataFields.filter(df => df.isCustom).indexOf(field);
                                  return !(data.dataFields[i].isCustom && customIndex === index);
                                });
                                updateData('dataFields', newFields);
                              }}
                              className="text-red-600 text-sm hover:text-red-800"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {data.dataFields.length > 0 && (
                  <div className="bg-gray-50 border rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-2">Selected Fields Summary</h5>
                    <div className="text-sm text-gray-700">
                      <strong>Will collect:</strong> {data.dataFields.map(df => df.field).filter(Boolean).join(', ')}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      <strong>Required fields:</strong> {data.dataFields.filter(df => df.isRequired).map(df => df.field).join(', ') || 'None'}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        );

      case 11:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Review & Generate</h2>
              <p className="text-gray-600">Review your settings and generate the final prompt.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Settings Summary */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Settings Summary</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Assistant:</strong> {data.assistantName} ({data.tone}, {data.style})</div>
                  <div><strong>Business:</strong> {data.businessName}</div>
                  <div><strong>Objective:</strong> {data.objective === 'custom' ? data.customObjective : objectiveOptions.find(o => o.value === data.objective)?.label}</div>
                  <div><strong>Target:</strong> {data.targetAudience}</div>
                  <div><strong>Objections:</strong> {data.objectionHandling}</div>
                  <div><strong>Closing:</strong> {data.closingStyle}</div>
                  {data.objective === 'appointment' && (
                    <div><strong>Timezone:</strong> {data.userTimezone}</div>
                  )}
                  {data.dataCollectionEnabled && data.dataFields.length > 0 && (
                    <div>
                      <strong>Data Collection:</strong> {data.dataFields.map(f => f.field).filter(Boolean).join(', ')}
                      {data.dataFields.filter(f => f.isRequired).length > 0 && (
                        <div className="text-xs text-gray-600 mt-1">
                          Required: {data.dataFields.filter(f => f.isRequired).map(f => f.field).join(', ')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Generated Prompt Preview */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Generated Prompt</h3>
                <div className="bg-gray-50 border rounded-lg p-4 h-80 overflow-y-auto">
                  <pre className="text-xs text-gray-800 whitespace-pre-wrap">{generatedPrompt}</pre>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(generatedPrompt)}
                    className="flex items-center space-x-2 px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </button>
                  <button
                    onClick={() => {
                      const blob = new Blob([generatedPrompt], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${data.assistantName || 'assistant'}-prompt.txt`;
                      a.click();
                    }}
                    className="flex items-center space-x-2 px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Ready to create your assistant!</strong> The generated prompt will be used to configure your AI assistant.
              </p>
            </div>
          </div>
        );

      default:
        return <div>Step {currentStep} - Coming soon...</div>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">AI Prompt Wizard</h1>
              <p className="text-sm text-gray-600">Step {currentStep} of 11</p>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center space-x-2">
              {Array.from({ length: 10 }, (_, i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded ${
                    i + 1 <= currentStep ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="text-sm text-gray-500">
            Step {currentStep} of 11
          </div>

          {currentStep === 11 ? (
            <button
              onClick={handleComplete}
              className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <span>Complete Setup</span>
            </button>
          ) : (
            <button
              onClick={nextStep}
              disabled={!canProceed()}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}