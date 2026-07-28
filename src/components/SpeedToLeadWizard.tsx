'use client';

import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Plus, X, Sparkles } from 'lucide-react';
import {
  VERTICALS,
  DEFAULT_VERTICAL_ID,
  getVertical,
  DEFAULT_BUSINESS_HOURS,
  WEEKDAY_LABELS,
} from '@/lib/speedToLead/verticals';

/**
 * Speed-to-lead assistant setup.
 *
 * Replaces the old 12-step generic cold-calling wizard. This form no longer
 * builds the prompt itself — it collects structured answers and hands them to
 * the generator endpoint, which is what makes trade-specific qualification
 * possible without hardcoding every vertical.
 */

export interface SpeedToLeadResult {
  mainPrompt: string;
  firstMessage: string;
  serviceConfig: {
    vertical: string;
    clientCompany: string;
    serviceArea?: string;
    timezone: string;
    businessHours: Record<string, { open: string; close: string }>;
    appointmentDurationMins: number;
    bookingHorizonDays: number;
    diagnosticFee?: string;
  };
  suggestedName: string;
}

interface Props {
  onComplete: (result: SpeedToLeadResult) => void;
  onCancel: () => void;
}

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Phoenix',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
];

const TOTAL_STEPS = 6;

const labelCls = 'block text-sm font-medium text-gray-700 mb-2';
const inputCls =
  'w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

export function SpeedToLeadWizard({ onComplete, onCancel }: Props) {
  const [step, setStep] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<{ mainPrompt: string; firstMessage: string } | null>(null);

  const [vertical, setVertical] = useState(DEFAULT_VERTICAL_ID);
  const [clientCompany, setClientCompany] = useState('');
  const [serviceArea, setServiceArea] = useState('');
  const [agentName, setAgentName] = useState('Sam');
  const [tone, setTone] = useState<'warm' | 'direct' | 'professional'>('warm');
  const [timezone, setTimezone] = useState('America/New_York');
  const [businessHours, setBusinessHours] =
    useState<Record<string, { open: string; close: string }>>({ ...DEFAULT_BUSINESS_HOURS });
  const [durationMins, setDurationMins] = useState(90);
  const [horizonDays, setHorizonDays] = useState(14);
  const [diagnosticFee, setDiagnosticFee] = useState('');
  const [questions, setQuestions] = useState<string[]>(getVertical(DEFAULT_VERTICAL_ID).qualifyingQuestions);
  const [objections, setObjections] = useState(getVertical(DEFAULT_VERTICAL_ID).objections);
  const [extraInstructions, setExtraInstructions] = useState('');

  const current = useMemo(() => getVertical(vertical), [vertical]);

  // Switching trade replaces the defaults — the previous trade's questions are
  // meaningless for the new one.
  const changeVertical = (id: string) => {
    const v = getVertical(id);
    setVertical(id);
    setQuestions(v.qualifyingQuestions);
    setObjections(v.objections);
    setDurationMins(v.defaultDurationMins);
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return !!clientCompany.trim();
      case 2:
        return !!agentName.trim();
      case 3:
        return Object.keys(businessHours).length > 0 && durationMins >= 15;
      case 4:
        return questions.filter((q) => q.trim()).length > 0;
      default:
        return true;
    }
  };

  const generate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/assistants/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentName,
          clientCompany,
          vertical,
          serviceArea,
          timezone,
          businessHours,
          appointmentDurationMins: durationMins,
          diagnosticFee,
          qualifyingQuestions: questions.filter((q) => q.trim()),
          objections: objections.filter((o) => o.objection.trim() && o.response.trim()),
          tone,
          extraInstructions,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');

      setGenerated({ mainPrompt: data.mainPrompt, firstMessage: data.firstMessage });
      setStep(6);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const finish = () => {
    if (!generated) return;
    onComplete({
      mainPrompt: generated.mainPrompt,
      firstMessage: generated.firstMessage,
      suggestedName: `${clientCompany} — ${current.label} Intake`.slice(0, 100),
      serviceConfig: {
        vertical,
        clientCompany,
        serviceArea: serviceArea || undefined,
        timezone,
        businessHours,
        appointmentDurationMins: durationMins,
        bookingHorizonDays: horizonDays,
        diagnosticFee: diagnosticFee || undefined,
      },
    });
  };

  const next = () => (step === 5 ? generate() : setStep((s) => Math.min(s + 1, TOTAL_STEPS)));

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Speed-to-Lead Setup</h1>
            <p className="text-sm text-gray-600">Step {step} of {TOTAL_STEPS}</p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600" aria-label="Cancel">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center space-x-2 mb-8">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded ${i < step ? 'bg-blue-600' : 'bg-gray-200'}`}
            />
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* 1 — business */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">The business</h2>
              <p className="text-gray-600">Who is the agent calling on behalf of?</p>
            </div>
            <div>
              <label className={labelCls}>Company name *</label>
              <input
                className={inputCls}
                value={clientCompany}
                onChange={(e) => setClientCompany(e.target.value)}
                placeholder="e.g. Ace Heating &amp; Air"
              />
            </div>
            <div>
              <label className={labelCls}>Trade *</label>
              <div className="grid grid-cols-2 gap-2">
                {VERTICALS.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => changeVertical(v.id)}
                    className={`p-3 border rounded-lg text-left text-sm transition-colors ${
                      vertical === v.id
                        ? 'border-blue-500 bg-blue-50 text-blue-900 font-medium'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Sets the qualifying questions the agent asks. You can edit them in step 4.
              </p>
            </div>
            <div>
              <label className={labelCls}>Service area</label>
              <input
                className={inputCls}
                value={serviceArea}
                onChange={(e) => setServiceArea(e.target.value)}
                placeholder="e.g. Denver metro, within 25 miles"
              />
            </div>
          </div>
        )}

        {/* 2 — agent */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">The agent</h2>
              <p className="text-gray-600">How they introduce themselves and sound.</p>
            </div>
            <div>
              <label className={labelCls}>Agent name *</label>
              <input className={inputCls} value={agentName} onChange={(e) => setAgentName(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Tone</label>
              <div className="space-y-2">
                {([
                  ['warm', 'Warm', 'Friendly, light conversational fillers. Best default.'],
                  ['direct', 'Direct', 'Efficient, minimal filler. Good for urgent trades.'],
                  ['professional', 'Professional', 'Polished and businesslike.'],
                ] as const).map(([id, title, desc]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTone(id)}
                    className={`w-full p-3 border rounded-lg text-left transition-colors ${
                      tone === id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium text-gray-900">{title}</div>
                    <div className="text-sm text-gray-600">{desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3 — scheduling */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Scheduling</h2>
              <p className="text-gray-600">
                The agent checks your calendar live and will never offer a time outside these hours.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Timezone</label>
                <select className={inputCls} value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Visit length (minutes)</label>
                <input
                  type="number"
                  min={15}
                  max={480}
                  step={15}
                  className={inputCls}
                  value={durationMins}
                  onChange={(e) => setDurationMins(Number(e.target.value))}
                />
              </div>
              <div>
                <label className={labelCls}>Book up to (days ahead)</label>
                <input
                  type="number"
                  min={1}
                  max={90}
                  className={inputCls}
                  value={horizonDays}
                  onChange={(e) => setHorizonDays(Number(e.target.value))}
                />
              </div>
              <div>
                <label className={labelCls}>Diagnostic / visit fee</label>
                <input
                  className={inputCls}
                  value={diagnosticFee}
                  onChange={(e) => setDiagnosticFee(e.target.value)}
                  placeholder="e.g. $89, or free"
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Business hours</label>
              <div className="space-y-2">
                {Object.keys(WEEKDAY_LABELS).map((day) => {
                  const open = businessHours[day];
                  return (
                    <div key={day} className="flex items-center gap-3">
                      <label className="flex items-center gap-2 w-32">
                        <input
                          type="checkbox"
                          checked={!!open}
                          onChange={(e) =>
                            setBusinessHours((prev) => {
                              const nextHours = { ...prev };
                              if (e.target.checked) nextHours[day] = { open: '08:00', close: '18:00' };
                              else delete nextHours[day];
                              return nextHours;
                            })
                          }
                        />
                        <span className="text-sm text-gray-700">{WEEKDAY_LABELS[day]}</span>
                      </label>
                      {open ? (
                        <>
                          <input
                            type="time"
                            className="p-2 border border-gray-300 rounded"
                            value={open.open}
                            onChange={(e) =>
                              setBusinessHours((prev) => ({
                                ...prev,
                                [day]: { ...prev[day]!, open: e.target.value },
                              }))
                            }
                          />
                          <span className="text-gray-400">to</span>
                          <input
                            type="time"
                            className="p-2 border border-gray-300 rounded"
                            value={open.close}
                            onChange={(e) =>
                              setBusinessHours((prev) => ({
                                ...prev,
                                [day]: { ...prev[day]!, close: e.target.value },
                              }))
                            }
                          />
                        </>
                      ) : (
                        <span className="text-sm text-gray-400">Closed</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 4 — qualification */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Qualifying questions</h2>
              <p className="text-gray-600">
                Asked one at a time after the greeting. These are what turn a lead into a useful dispatch —
                edit them to match how your techs triage.
              </p>
            </div>
            <div className="space-y-2">
              {questions.map((q, i) => (
                <div key={i} className="flex gap-2">
                  <span className="mt-3 text-sm text-gray-400 w-5">{i + 1}.</span>
                  <textarea
                    className={inputCls}
                    rows={2}
                    value={q}
                    onChange={(e) =>
                      setQuestions((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setQuestions((prev) => prev.filter((_, idx) => idx !== i))}
                    className="px-3 text-red-600 hover:bg-red-50 rounded"
                    aria-label="Remove question"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setQuestions((prev) => [...prev, ''])}
              className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
            >
              <Plus className="w-4 h-4" /> Add question
            </button>
          </div>
        )}

        {/* 5 — objections */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Objections</h2>
              <p className="text-gray-600">What the agent says when the homeowner pushes back.</p>
            </div>
            <div className="space-y-4">
              {objections.map((o, i) => (
                <div key={i} className="p-4 border border-gray-200 rounded-lg space-y-2">
                  <div className="flex items-start gap-2">
                    <input
                      className={inputCls}
                      value={o.objection}
                      placeholder="Objection"
                      onChange={(e) =>
                        setObjections((prev) =>
                          prev.map((v, idx) => (idx === i ? { ...v, objection: e.target.value } : v))
                        )
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setObjections((prev) => prev.filter((_, idx) => idx !== i))}
                      className="px-3 py-3 text-red-600 hover:bg-red-50 rounded"
                      aria-label="Remove objection"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <textarea
                    className={inputCls}
                    rows={2}
                    value={o.response}
                    placeholder="How the agent responds"
                    onChange={(e) =>
                      setObjections((prev) =>
                        prev.map((v, idx) => (idx === i ? { ...v, response: e.target.value } : v))
                      )
                    }
                  />
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setObjections((prev) => [...prev, { objection: '', response: '' }])}
              className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
            >
              <Plus className="w-4 h-4" /> Add objection
            </button>
            <div>
              <label className={labelCls}>Anything else the agent should know</label>
              <textarea
                className={inputCls}
                rows={3}
                value={extraInstructions}
                onChange={(e) => setExtraInstructions(e.target.value)}
                placeholder="e.g. We don't service mobile homes. Always mention we're family-owned."
              />
            </div>
          </div>
        )}

        {/* 6 — review */}
        {step === 6 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Review the prompt</h2>
              <p className="text-gray-600">
                Generated for {clientCompany}. Read it before saving — edit anything that does not sound
                like your business.
              </p>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              The scheduling section at the bottom is added automatically. Keep the{' '}
              <code className="font-mono">{'{{ }}'}</code> variables and the tool instructions intact — the
              live calendar booking depends on them.
            </div>
            <textarea
              className="w-full p-4 border border-gray-300 rounded-lg font-mono text-xs"
              rows={22}
              value={generated?.mainPrompt ?? ''}
              onChange={(e) => setGenerated((g) => (g ? { ...g, mainPrompt: e.target.value } : g))}
            />
            <button
              type="button"
              onClick={generate}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Regenerate
            </button>
          </div>
        )}

        <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-200">
          <button
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1 || generating}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          {step === TOTAL_STEPS ? (
            <button
              onClick={finish}
              disabled={!generated?.mainPrompt?.trim()}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              Use this prompt
            </button>
          ) : (
            <button
              onClick={next}
              disabled={!canProceed() || generating}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Writing the prompt…
                </>
              ) : step === 5 ? (
                <>
                  <Sparkles className="w-4 h-4" /> Generate prompt
                </>
              ) : (
                <>
                  Next <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
