'use client';

import { useEffect, useState } from 'react';

import { Panel, PanelHeader } from '@/components/dashboard/panels';
import { attemptLabel, leadStatus, type LeadStatusInput } from '@/lib/leadStatus';
import { cn } from '@/lib/utils';

type LeadDetail = LeadStatusInput & {
  name: string;
  phoneNumber: string;
  attempts: { startedAt: string; endedAt: string | null; result: string | null }[];
};

const time = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
const day = (iso: string) => new Date(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

/**
 * Where a lead stands and each call placed to it, oldest first. Shown on the
 * lead's own page whether or not a call has produced a summary yet.
 */
export function LeadCallHistory({ leadId, className }: { leadId: string; className?: string }) {
  const [lead, setLead] = useState<LeadDetail | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/leads/${leadId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d?.lead) setLead(d.lead);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [leadId]);

  if (!lead) return null;

  const status = leadStatus(lead);
  const calls = lead.attempts.length;
  // Calls on different days need the day beside the time to make sense.
  const showDay = new Set(lead.attempts.map((a) => new Date(a.startedAt).toDateString())).size > 1;

  return (
    <Panel className={className}>
      <PanelHeader title={lead.name} subtitle={lead.phoneNumber} />
      <div className="p-5">
        <p className="flex items-start gap-2 text-sm leading-5 text-foreground">
          <span className="relative mt-[7px] flex size-1.5 shrink-0">
            {status.pulse && <span className={cn('absolute inline-flex size-full animate-ping rounded-full opacity-70', status.dot)} />}
            <span className={cn('relative inline-flex size-1.5 rounded-full', status.dot)} />
          </span>
          {status.label}
        </p>

        {calls > 0 && (
          <ol className="mt-4 space-y-2 border-t border-border pt-4">
            {lead.attempts.map((a) => (
              <li key={a.startedAt} className="flex items-baseline gap-2 text-[13px] text-muted-foreground">
                <span className="font-mono text-xs tabular-nums text-foreground">
                  {showDay && `${day(a.startedAt)}, `}
                  {time(a.startedAt)}
                </span>
                <span aria-hidden="true">·</span>
                <span>{attemptLabel(a.result)}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </Panel>
  );
}
