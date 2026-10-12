'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

type Rules = { retry: boolean; maxCalls: number; holdOutsideHours: boolean; callFrom: string; callUntil: string };

const zoneName = (timezone: string) => timezone.replace(/_/g, ' ');

/**
 * When and how often an assistant's leads are called. Saved on its own, apart
 * from the assistant's script: changing these never changes what is said on a call.
 */
export function CallingRules({ assistantId }: { assistantId: string }) {
  const [rules, setRules] = useState<Rules | null>(null);
  const [timezone, setTimezone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/assistants/${assistantId}/calling-rules`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d?.rules) return;
        setRules(d.rules);
        setTimezone(d.timezone || '');
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [assistantId]);

  if (!rules) return null;

  const set = (patch: Partial<Rules>) => {
    setRules({ ...rules, ...patch });
    setError('');
  };

  const save = async () => {
    if (rules.holdOutsideHours && rules.callUntil <= rules.callFrom) {
      setError('The end time must be after the start time.');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`/api/assistants/${assistantId}/calling-rules`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rules),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || 'Could not save the calling rules.');
        return;
      }
      toast.success('Calling rules saved');
    } catch {
      setError('Could not save the calling rules.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section aria-labelledby="calling-rules-title" className="mt-8 border-t border-border pt-6">
      <h3 id="calling-rules-title" className="text-base font-medium text-foreground">
        Calling rules
      </h3>

      <div className="mt-5 space-y-6">
        <div>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="rule-retry" className="text-sm font-normal text-foreground">
              Try again when nobody answers
            </Label>
            <Switch id="rule-retry" checked={rules.retry} onCheckedChange={(retry) => set({ retry })} />
          </div>
          {rules.retry && (
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <span>Up to</span>
              <div role="group" aria-label="Calls in total" className="flex gap-0.5 rounded-lg border border-border p-0.5">
                {[1, 2, 3].map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-pressed={rules.maxCalls === n}
                    onClick={() => set({ maxCalls: n })}
                    className={`h-7 w-8 rounded-md text-sm tabular-nums outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
                      rules.maxCalls === n ? 'bg-accent font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <span>{rules.maxCalls === 1 ? 'call in total' : 'calls in total'}</span>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="rule-hold" className="text-sm font-normal text-foreground">
              Hold leads that arrive outside calling hours
            </Label>
            <Switch id="rule-hold" checked={rules.holdOutsideHours} onCheckedChange={(holdOutsideHours) => set({ holdOutsideHours })} />
          </div>
          {rules.holdOutsideHours && (
            <div className="mt-3">
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>Call between</span>
                <Input
                  type="time"
                  aria-label="Calling hours start"
                  value={rules.callFrom}
                  onChange={(e) => set({ callFrom: e.target.value })}
                  className="h-9 w-32"
                />
                <span>and</span>
                <Input
                  type="time"
                  aria-label="Calling hours end"
                  value={rules.callUntil}
                  onChange={(e) => set({ callUntil: e.target.value })}
                  className="h-9 w-32"
                />
              </div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                In {zoneName(timezone)}. Leads that arrive outside these hours are called when they open. Calling hours are
                your responsibility under the rules where your leads live.
              </p>
            </div>
          )}
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-500">
            {error}
          </p>
        )}

        <Button type="button" onClick={save} disabled={saving} variant="outline" className="h-9 gap-2 border-input bg-transparent text-foreground hover:bg-accent">
          {saving && <Loader2 className="size-4 animate-spin" />}
          Save calling rules
        </Button>
      </div>
    </section>
  );
}
