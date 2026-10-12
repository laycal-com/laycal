'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

type Settings = { email: string; booked: boolean; unreached: boolean; stopped: boolean; low: boolean };

const SWITCHES: [keyof Omit<Settings, 'email'>, string][] = [
  ['booked', 'A meeting is booked'],
  ['unreached', 'A new lead could not be reached'],
  ['stopped', 'Calls have stopped because the balance is empty'],
  ['low', 'The balance is running low'],
];

/** Settings → Notifications: one address and a switch per email. */
export function NotificationSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/account/notifications')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d?.email !== undefined) setSettings(d);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  if (!settings) return null;

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/account/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || 'Could not save notifications.');
        return;
      }
      toast.success('Notifications saved');
    } catch {
      setError('Could not save notifications.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section id="notifications" aria-labelledby="notifications-title" className="mt-6 scroll-mt-24 rounded-lg border border-border bg-card shadow-sm">
      <div className="border-b border-border p-6">
        <h2 id="notifications-title" className="text-base font-medium text-foreground">
          Notifications
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Emails about your leads and your balance.</p>
      </div>

      <form onSubmit={save} noValidate className="space-y-6 p-6">
        <div className="max-w-md">
          <Label htmlFor="notify-email" className="text-sm text-foreground">
            Send notifications to
          </Label>
          <Input
            id="notify-email"
            type="email"
            autoComplete="email"
            value={settings.email}
            onChange={(e) => {
              setSettings({ ...settings, email: e.target.value });
              setError('');
            }}
            aria-invalid={!!error}
            aria-describedby={error ? 'notify-email-error' : 'notify-email-help'}
            className="mt-2"
          />
          {error ? (
            <p id="notify-email-error" role="alert" className="mt-2 text-sm text-red-500">
              {error}
            </p>
          ) : (
            <p id="notify-email-help" className="mt-2 text-xs text-muted-foreground">
              One address. Use a shared inbox if several people need them.
            </p>
          )}
        </div>

        <ul className="max-w-md divide-y divide-border border-y border-border">
          {SWITCHES.map(([key, label]) => (
            <li key={key} className="flex items-center justify-between gap-4 py-3.5">
              <Label htmlFor={`notify-${key}`} className="text-sm font-normal text-foreground">
                {label}
              </Label>
              <Switch
                id={`notify-${key}`}
                checked={settings[key]}
                onCheckedChange={(on) => setSettings({ ...settings, [key]: on })}
              />
            </li>
          ))}
        </ul>

        <Button type="submit" disabled={saving} className="h-9 gap-2 rounded-lg px-4">
          {saving && <Loader2 className="size-4 animate-spin" />}
          Save
        </Button>
      </form>
    </section>
  );
}
