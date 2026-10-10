'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowRight, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogoMark } from '@/components/brand/logo-mark';

const INDUSTRIES = [
  'Home services',
  'E-commerce',
  'B2B / SaaS',
  'Real estate',
  'Insurance',
  'Solar',
  'Automotive',
  'Education',
  'Legal',
  'Other',
];

const field = 'h-11 rounded-lg';

/**
 * First screen after accepting an invitation: the details Clerk does not give
 * us. Saving it marks the account as onboarded and opens the portal.
 */
function OnboardingForm() {
  const router = useRouter();
  // Reopened from settings to change details after the first run.
  const editing = useSearchParams().get('edit') === '1';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', industry: '', phone: '', website: '', timezone: '' });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/account', { cache: 'no-store' });
        if (!res.ok) throw new Error();
        const { account } = await res.json();
        if (account.onboarded && !editing) return router.replace('/dashboard');
        setForm({
          name: account.name || '',
          industry: account.industry || '',
          phone: account.phone || '',
          website: account.website || '',
          timezone: account.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || '',
        });
      } catch {
        toast.error('Could not load your account');
      } finally {
        setLoading(false);
      }
    })();
  }, [router, editing]);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save your details');
      router.replace(editing ? '/settings' : '/dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save your details');
      setSaving(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-16">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_30%,black_20%,transparent_100%)]" />
        <div className="absolute left-1/2 top-0 size-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[130px]" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="flex items-center gap-2.5">
          <LogoMark />
          <span className="text-[17px] font-semibold tracking-tight">Laycal</span>
        </div>

        <div className="mt-10 font-mono text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">{editing ? 'Account' : 'Welcome'}</div>
        <h1 className="mt-4 text-3xl font-semibold leading-[1.1] tracking-[-0.03em] text-neutral-50">
          {editing ? 'Your business details.' : 'Tell us about your business.'}
        </h1>
        <p className="mt-3 text-[15px] leading-6 text-muted-foreground">
          This sets up your account. It takes a minute, and you can change any of it later.
        </p>

        {loading ? (
          <div className="mt-10 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading your account…
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Company name</Label>
              <Input id="name" required autoFocus value={form.name} onChange={set('name')} placeholder="Ace Heating & Air" className={field} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <select
                id="industry"
                required
                value={form.industry}
                onChange={set('industry')}
                className="h-11 w-full rounded-lg border border-input bg-white/[0.04] px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring [color-scheme:dark]"
              >
                <option value="" disabled>
                  Choose one
                </option>
                {INDUSTRIES.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Business phone</Label>
                <Input id="phone" type="tel" value={form.phone} onChange={set('phone')} placeholder="+1 303 555 0142" className={field} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input id="website" value={form.website} onChange={set('website')} placeholder="aceheating.com" className={field} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input id="timezone" value={form.timezone} onChange={set('timezone')} placeholder="America/Denver" className={field} />
              <p className="text-xs text-muted-foreground">Detected from your browser. Appointment times are shown in this zone.</p>
            </div>

            <Button type="submit" disabled={saving} className="group h-11 w-full gap-2 rounded-full text-[15px]">
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Continue to your dashboard'}
              {!saving && <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingForm />
    </Suspense>
  );
}
