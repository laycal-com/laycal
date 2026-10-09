'use client';

import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarCheck,
  Clock,
  DollarSign,
  FileText,
  ListTree,
  Mic,
  MessageSquare,
  PhoneOff,
} from 'lucide-react';
import { Panel, PanelHeader, EmptyState, Reveal } from '@/components/dashboard/panels';
import { formatVisit, zoneLabel } from '@/lib/formatAppointment';

/**
 * One call, in full: transcript, recording, what the agent extracted, and the
 * visit it booked.
 *
 * Styled to match the dashboard — same Panel primitives, same palette — rather
 * than the ad-hoc cards this page used to carry.
 */

interface CallSummary {
  _id: string;
  vapiCallId: string;
  leadId?: string;
  callData: {
    duration?: number;
    endReason?: string;
    status: 'completed' | 'failed' | 'no-answer' | 'busy';
    cost?: number;
    startTime?: string;
    endTime?: string;
  };
  transcript?: string;
  summary?: string;
  evaluation?: 'positive' | 'negative' | 'neutral';
  stereoRecordingUrl?: string;
  structuredData?: Record<string, any>;
  extractedInfo?: Record<string, any>;
  appointmentCreated?: boolean;
  appointmentData?: {
    title?: string;
    startTime?: string;
    endTime?: string;
    confirmed?: boolean;
    timezone?: string;
  };
  createdAt: string;
}

interface Line {
  id: string;
  speaker: 'Agent' | 'Customer';
  text: string;
}

/**
 * Vapi transcripts are newline-separated `AI: ...` / `User: ...` turns.
 *
 * The previous parser split each line on every ':' and rejoined, and decided
 * the speaker by testing whether the whole first segment contained "user" —
 * so "User: call me at 5:30" survived but any line whose text mentioned a
 * speaker word was mislabelled. This only splits on the FIRST colon and only
 * when what precedes it actually looks like a speaker tag.
 */
function parseTranscript(transcript: string): Line[] {
  return transcript
    .split('\n')
    .map((raw, i) => {
      const line = raw.trim();
      if (!line) return null;

      const match = line.match(/^(AI|Assistant|Bot|User|Customer|Human)\s*:\s*(.*)$/i);
      if (!match) {
        return { id: `l-${i}`, speaker: 'Agent' as const, text: line };
      }

      const isCustomer = /^(user|customer|human)$/i.test(match[1]);
      return {
        id: `l-${i}`,
        speaker: isCustomer ? ('Customer' as const) : ('Agent' as const),
        text: match[2],
      };
    })
    .filter((l): l is Line => l !== null && l.text.length > 0);
}

function formatDuration(seconds?: number): string {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

const STATUS_STYLES: Record<string, string> = {
  completed: 'bg-green-500/10 text-green-500 border-green-500/30',
  failed: 'bg-red-500/10 text-red-500 border-red-500/30',
  'no-answer': 'bg-muted text-muted-foreground border-border',
  busy: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
};

/** Turns `problem_symptom` into `Problem symptom`. */
function humanise(key: string): string {
  const spaced = key.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

/** ISO strings get formatted; everything else is shown as written. */
function renderValue(key: string, value: unknown, timezone?: string): string {
  if (value == null || value === '') return '—';
  if (typeof value !== 'string') return JSON.stringify(value);

  if (/time|date|slot|booked/i.test(key) && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) {
      // Business zone, to agree with the "Visit booked" panel above rather than
      // quietly showing the same instant as a different hour.
      const at = formatVisit(value, timezone, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
      const zone = zoneLabel(value, timezone);
      return zone ? `${at} ${zone}` : at;
    }
  }
  return value;
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="h-4 w-4 flex-none text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

export default function CallSummaryPage({ params }: { params: Promise<{ leadId: string }> }) {
  // Next 15 hands params in as a promise; `use` unwraps it in a client component.
  const { leadId } = use(params);
  const router = useRouter();

  const [summary, setSummary] = useState<CallSummary | null>(null);
  const [loading, setLoading] = useState(true);
  // Whether the recording URL actually resolves. Checked server-side: Chrome
  // never raises a media error for the 400 that a private bucket returns, it
  // just sits in NETWORK_LOADING forever showing 0:00 / 0:00.
  const [recording, setRecording] = useState<
    { playable: boolean; reason: string; status?: number; url?: string } | null
  >(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/call-summaries?leadId=${leadId}`);
        const data = res.ok ? await res.json() : null;
        if (!cancelled) setSummary(data?.summaries?.[0] ?? null);
      } catch {
        if (!cancelled) setSummary(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [leadId]);

  useEffect(() => {
    if (!summary?._id || !summary.stereoRecordingUrl) return;
    let cancelled = false;

    fetch(`/api/call-summaries/${summary._id}/recording`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d) setRecording(d);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [summary?._id, summary?.stereoRecordingUrl]);

  const lines = useMemo(
    () => (summary?.transcript ? parseTranscript(summary.transcript) : []),
    [summary?.transcript]
  );

  const facts = useMemo(() => {
    const src = summary?.extractedInfo ?? summary?.structuredData ?? {};
    return Object.entries(src).filter(([, v]) => v != null && v !== '');
  }, [summary]);

  if (loading) {
    return (
      <div>
        <div className="mx-auto w-full max-w-[1440px] px-4 py-6 md:px-8 md:py-8">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Panel className="h-[520px] animate-pulse bg-muted/40 lg:col-span-2" />
            <Panel className="h-[520px] animate-pulse bg-muted/40" />
          </div>
        </div>
      </div>
    );
  }

  // A lead that simply hasn't been called yet is a normal state, not a 404 —
  // this page used to call notFound() and dead-end the user.
  if (!summary) {
    return (
      <div>
        <div className="mx-auto w-full max-w-[1440px] px-4 py-6 md:px-8 md:py-8">
          <button
            onClick={() => router.back()}
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <Panel>
            <EmptyState
              icon={PhoneOff}
              title="No call recorded yet"
              body="Once this lead has been called, the transcript, recording and everything the agent captured will appear here."
              action={
                <Link href="/leads" className="text-xs font-medium text-foreground underline-offset-4 hover:underline">
                  Back to leads →
                </Link>
              }
            />
          </Panel>
        </div>
      </div>
    );
  }

  const { callData } = summary;
  const statusClass = STATUS_STYLES[callData.status] ?? STATUS_STYLES['no-answer'];

  return (
    <div>
      <div className="mx-auto w-full max-w-[1440px] px-4 py-6 md:px-8 md:py-8">
        <button
          onClick={() => router.back()}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Call summary</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {callData.startTime
                ? new Date(callData.startTime).toLocaleString()
                : new Date(summary.createdAt).toLocaleString()}
            </p>
          </div>
          <span className={`rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${statusClass}`}>
            {callData.status.replace('-', ' ')}
          </span>
        </div>

        {/* Call metadata — already on the model, never previously shown. */}
        <Reveal>
          <Panel className="mb-4 grid grid-cols-2 gap-5 p-5 sm:grid-cols-4">
            <Stat icon={Clock} label="Duration" value={formatDuration(callData.duration)} />
            <Stat
              icon={DollarSign}
              label="Cost"
              value={callData.cost != null ? `$${callData.cost.toFixed(3)}` : '—'}
            />
            <Stat icon={PhoneOff} label="Ended" value={callData.endReason || '—'} />
            <Stat
              icon={MessageSquare}
              label="Turns"
              value={lines.length ? String(lines.length) : '—'}
            />
          </Panel>
        </Reveal>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Reveal delay={0.05} className="lg:col-span-2">
            <Panel className="h-full">
              <PanelHeader title="Transcript" subtitle={`${lines.length} turns`} />
              <div className="max-h-[60vh] space-y-3 overflow-y-auto p-5">
                {lines.length === 0 && (
                  <EmptyState
                    icon={MessageSquare}
                    title="No transcript"
                    body="Nothing was transcribed for this call."
                  />
                )}
                {lines.map((line) => {
                  const isCustomer = line.speaker === 'Customer';
                  return (
                    <div
                      key={line.id}
                      className={`flex items-start gap-2.5 ${isCustomer ? 'flex-row-reverse' : ''}`}
                    >
                      <span
                        className={`mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full text-[10px] font-semibold ${
                          isCustomer ? 'bg-muted text-muted-foreground' : 'bg-primary text-white'
                        }`}
                      >
                        {isCustomer ? 'C' : 'AI'}
                      </span>
                      <div
                        className={`max-w-[75%] rounded-xl px-3.5 py-2.5 text-sm ${
                          isCustomer
                            ? 'bg-muted text-foreground'
                            : 'bg-primary/15 text-foreground'
                        }`}
                      >
                        {line.text}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>
          </Reveal>

          <div className="space-y-4">
            <Reveal delay={0.1}>
              <Panel>
                <PanelHeader title="Summary" />
                <div className="p-5">
                  {summary.summary ? (
                    <p className="text-sm leading-relaxed text-muted-foreground">{summary.summary}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No summary for this call. Calls made before the analysis plan was enabled
                      don&apos;t have one, and it can&apos;t be generated after the fact.
                    </p>
                  )}
                </div>
              </Panel>
            </Reveal>

            {summary.appointmentCreated && summary.appointmentData?.startTime && (
              <Reveal delay={0.15}>
                <Panel>
                  <PanelHeader title="Visit booked" />
                  <div className="space-y-2 p-5">
                    <div className="flex items-start gap-2.5">
                      <CalendarCheck className="mt-0.5 h-4 w-4 flex-none text-green-500" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {formatVisit(summary.appointmentData.startTime, summary.appointmentData.timezone, {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                          {zoneLabel(summary.appointmentData.startTime, summary.appointmentData.timezone) && (
                            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                              {zoneLabel(summary.appointmentData.startTime, summary.appointmentData.timezone)}
                            </span>
                          )}
                        </p>
                        {summary.appointmentData.title && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {summary.appointmentData.title}
                          </p>
                        )}
                      </div>
                    </div>
                    <Link
                      href="/appointments"
                      className="inline-block text-xs font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      Manage this visit →
                    </Link>
                  </div>
                </Panel>
              </Reveal>
            )}

            <Reveal delay={0.2}>
              <Panel>
                <PanelHeader title="Recording" />
                <div className="p-5">
                  {!summary.stereoRecordingUrl ? (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mic className="h-4 w-4 text-muted-foreground/50" /> No recording available.
                    </p>
                  ) : recording === null ? (
                    <p className="text-sm text-muted-foreground">Checking recording…</p>
                  ) : recording.playable && recording.url ? (
                    <>
                      {/* Signed URL minted per view — the stored one is a raw
                          bucket path and never plays. */}
                      <audio controls src={recording.url} className="w-full [color-scheme:dark]" />
                      <p className="mt-2 text-xs text-muted-foreground">
                        Vapi keeps recordings for 15 days.
                      </p>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <p className="flex items-start gap-2 text-sm text-muted-foreground">
                        <AlertTriangle className="mt-0.5 h-4 w-4 flex-none text-amber-500" />
                        <span>
                          {recording.reason === 'missing'
                            ? 'Vapi no longer has this recording — it is past the 15-day retention window.'
                            : recording.reason === 'forbidden'
                              ? "The recording link can't be authorised."
                              : "The recording couldn't be reached."}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </Panel>
            </Reveal>

            <Reveal delay={0.25}>
              <Panel>
                <PanelHeader title="What the agent captured" />
                <div className="p-5">
                  {facts.length > 0 ? (
                    <dl className="space-y-3">
                      {facts.map(([key, value]) => (
                        <div key={key}>
                          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            {humanise(key)}
                          </dt>
                          <dd className="mt-0.5 text-sm text-foreground">
                            {renderValue(key, value, summary.appointmentData?.timezone)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <EmptyState
                      icon={ListTree}
                      title="Nothing extracted"
                      body="No structured fields were captured from this conversation."
                    />
                  )}
                </div>
              </Panel>
            </Reveal>

            {summary.transcript && (
              <Reveal delay={0.3}>
                <Panel className="p-5">
                  <a
                    href={`data:text/plain;charset=utf-8,${encodeURIComponent(summary.transcript)}`}
                    download={`call-${summary.vapiCallId.slice(0, 8)}.txt`}
                    className="inline-flex items-center gap-2 text-sm font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    <FileText className="h-4 w-4" /> Download transcript
                  </a>
                </Panel>
              </Reveal>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
