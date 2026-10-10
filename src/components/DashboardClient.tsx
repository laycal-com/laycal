'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CalendarCheck,
  CalendarClock,
  PhoneCall,
  PhoneIncoming,
  RefreshCw,
  Users,
} from 'lucide-react';
import { useAccount } from './portal/account-context';
import PhoneProviderPrompt from './PhoneProviderPrompt';
import { ActivityChart, ActivityLegend, AssistantBars, OutcomesDonut } from './dashboard/portal-charts';
import { EmptyState, Panel, PanelHeader, Reveal, StatCard } from './dashboard/panels';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { cn } from '@/lib/utils';
import {
  BalancePanel,
  NumbersPanel,
  RatePanel,
  type CreditData,
  type PricingData,
  type ProviderData,
} from './dashboard/account';

/**
 * Dashboard.
 *
 * Rebuilt around what the account is actually doing — leads in, calls placed,
 * visits booked — instead of the three-step "Getting Started" block, which
 * never went away once completed and pushed the real numbers below the fold.
 * Anything still worth nudging about (no assistant, empty balance) now shows up
 * as a conditional strip that disappears on its own.
 */

interface Stats {
  range: { days: number; timeZone: string; from: string };
  series: Array<{ date: string; leads: number; calls: number; answered: number; booked: number }>;
  totals: {
    leads: number;
    calls: number;
    answered: number;
    booked: number;
    talkMinutes: number;
    spend: number;
    answerRate: number;
    bookRate: number;
  };
  deltas: {
    leads: number | null;
    calls: number | null;
    booked: number | null;
    answerRate: number | null;
  };
  outcomes: { completed: number; failed: number; pending: number; calling: number };
  assistants: Array<{
    id: string;
    name: string;
    vertical: string | null;
    isActive: boolean;
    calls: number;
    booked: number;
    bookRate: number;
  }>;
  upcoming: Array<{ id: string; title: string; startTime: string; timezone: string | null; customer: string }>;
  recent: Array<{
    id: string;
    name: string;
    status: string;
    calledAt: string | null;
    duration: number;
    booked: boolean;
    answered: boolean;
    assistant: string | null;
  }>;
  hasAnyData: boolean;
}

const RANGES = [
  { days: 7, label: '7d' },
  { days: 30, label: '30d' },
  { days: 90, label: '90d' },
];

/* One accent, the rest neutral. Sparklines and status segments share these. */
const TONE = {
  accent: 'var(--brand)',
  strong: '#fafafa',
  mid: '#737373',
  dim: '#404040',
  muted: 'var(--muted-foreground)',
};

function formatDuration(seconds: number): string {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function DashboardClient() {
  const { data: accountData, refresh: refreshAccount } = useAccount();
  const [activatingPayg, setActivatingPayg] = useState(false);

  const [days, setDays] = useState(30);
  const [stats, setStats] = useState<Stats | null>(null);
  const [credits, setCredits] = useState<CreditData | null>(null);
  const [providers, setProviders] = useState<ProviderData[]>([]);
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* ---------------------------------------------------------------- billing */

  const handlePaymentSuccess = useCallback(async (token: string, payerId: string) => {
    try {
      const chargeAmount = new URLSearchParams(window.location.search).get('charge') || '25';

      toast.success('Processing payment...', { description: 'Adding credits to your account' });

      // The API re-reads the real amount from PayPal; these are only defaults.
      const response = await fetch('/api/paypal/capture-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: token,
          planType: 'payg',
          amount: parseFloat(chargeAmount),
          description: 'Payment processing',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Payment processing failed');
      }

      const result = await response.json();
      toast.success('Payment successful!', {
        description: result.message || `$${chargeAmount} credits added to your account`,
      });

      window.history.replaceState({}, '', '/dashboard');
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Payment capture error:', error);
      toast.error('Payment processing failed', {
        description: error instanceof Error ? error.message : 'Please contact support.',
      });
    }
  }, []);

  const handlePaygActivation = useCallback(async () => {
    setActivatingPayg(true);
    try {
      const chargeAmount = new URLSearchParams(window.location.search).get('charge') || '25';

      const orderResponse = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(chargeAmount),
          description: `Pay-as-you-go Activation ($${chargeAmount} - includes first assistant + credits)`,
          planType: 'payg',
        }),
      });

      if (!orderResponse.ok) throw new Error('Failed to create PayPal order');

      const orderData = await orderResponse.json();
      if (!orderData.approvalUrl) throw new Error('PayPal approval URL not found');
      window.location.href = orderData.approvalUrl;
    } catch (error) {
      console.error('PAYG activation error:', error);
      toast.error('Payment required to activate Pay-as-you-go', {
        description: error instanceof Error ? error.message : 'Please try again or contact support.',
      });
      setActivatingPayg(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get('setup') === 'payg') {
      handlePaygActivation();
      return;
    }

    const token = params.get('token');
    const payerId = params.get('PayerID');
    if (token && payerId && params.get('payment') === 'success') {
      handlePaymentSuccess(token, payerId);
    }
  }, [handlePaygActivation, handlePaymentSuccess]);

  /* ------------------------------------------------------------------ data */

  const loadStats = useCallback(async (range: number) => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const res = await fetch(`/api/dashboard/stats?days=${range}&tz=${encodeURIComponent(tz)}`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Failed to load dashboard stats');
    return (await res.json()) as Stats;
  }, []);

  const loadAll = useCallback(
    async (range: number) => {
      // One failure shouldn't blank the page, so each source settles on its own.
      const [statsRes, creditsRes, provRes, priceRes] = await Promise.allSettled([
        loadStats(range),
        fetch('/api/credits', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)),
        fetch('/api/phone-providers').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/pricing').then((r) => (r.ok ? r.json() : null)),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      else toast.error('Could not load your call stats');

      if (creditsRes.status === 'fulfilled' && creditsRes.value) setCredits(creditsRes.value);
      refreshAccount();
      if (provRes.status === 'fulfilled' && provRes.value) {
        setProviders(provRes.value.providers || []);
      }
      if (priceRes.status === 'fulfilled' && priceRes.value) setPricing(priceRes.value);
    },
    [loadStats]
  );

  useEffect(() => {
    if (activatingPayg) return;
    let cancelled = false;

    (async () => {
      setRefreshing(true);
      await loadAll(days);
      if (!cancelled) {
        setLoading(false);
        setRefreshing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [days, activatingPayg, loadAll]);

  const refresh = async () => {
    setRefreshing(true);
    await loadAll(days);
    setRefreshing(false);
  };

  /* --------------------------------------------------------------- derived */

  const sparks = useMemo(() => {
    const s = stats?.series ?? [];
    return {
      leads: s.map((d) => d.leads),
      calls: s.map((d) => d.calls),
      answered: s.map((d) => d.answered),
      booked: s.map((d) => d.booked),
    };
  }, [stats]);

  const outcomeSegments = useMemo(() => {
    const o = stats?.outcomes;
    if (!o) return [];
    return [
      { key: 'completed', label: 'Reached', value: o.completed, color: TONE.strong },
      { key: 'calling', label: 'In progress', value: o.calling, color: TONE.accent },
      { key: 'pending', label: 'Queued', value: o.pending, color: TONE.mid },
      { key: 'failed', label: 'Failed', value: o.failed, color: TONE.dim },
    ].filter((s) => s.value > 0);
  }, [stats]);

  const noAssistants = stats !== null && stats.assistants.length === 0;
  const lowBalance = !!credits?.needsTopup;

  // Before the first booking every bar would be zero-width, which reads as a
  // broken chart rather than an honest zero. Rank by calls until there's
  // something to rank by.
  const rankByBookings = !!stats?.assistants.some((a) => a.booked > 0);

  /* --------------------------------------------------------------- render */

  if (activatingPayg) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary" />
          <p className="text-lg font-medium text-foreground">Setting up your Pay-as-you-go plan…</p>
          <p className="mt-2 text-sm text-muted-foreground">Redirecting to PayPal…</p>
        </div>
      </div>
    );
  }

  const link =
    'rounded-sm text-xs font-medium text-muted-foreground underline-offset-4 outline-none transition-colors hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring';

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-6 md:px-8 md:py-8">
      <PhoneProviderPrompt />

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            How your agents are turning inbound leads into booked visits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div role="group" aria-label="Date range" className="flex rounded-lg border border-border bg-card p-0.5">
            {RANGES.map((r) => (
              <button
                key={r.days}
                onClick={() => setDays(r.days)}
                aria-pressed={days === r.days}
                className={cn(
                  'rounded-md px-3 py-1.5 font-mono text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                  days === r.days ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            onClick={refresh}
            disabled={refreshing}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            aria-label="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Only-when-actionable nudges, in place of the old permanent onboarding */}
      {!loading && (noAssistants || lowBalance) && (
        <Reveal className="mb-6 space-y-2">
          {noAssistants && (
            <Link
              href="/assistants"
              className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm outline-none transition-colors hover:bg-primary/15 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Bot className="h-4 w-4 flex-none text-brand-soft" />
              <span className="flex-1 text-muted-foreground">
                <span className="font-medium text-foreground">No assistant yet.</span> Create one and it starts
                answering new leads within seconds.
              </span>
              <ArrowRight className="h-4 w-4 flex-none text-brand-soft" />
            </Link>
          )}
          {lowBalance && (
            <a
              href="#credits"
              className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm outline-none transition-colors hover:bg-amber-500/15 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <AlertTriangle className="h-4 w-4 flex-none text-amber-500" />
              <span className="flex-1 text-muted-foreground">
                <span className="font-medium text-foreground">Credits are low.</span> Calls stop once the balance
                runs out. Top up below.
              </span>
            </a>
          )}
        </Reveal>
      )}

      {loading ? (
        <div className="space-y-4" aria-busy="true" aria-label="Loading dashboard">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Panel key={i} className="h-[138px] animate-pulse bg-muted/40" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Panel className="h-[380px] animate-pulse bg-muted/40 lg:col-span-2" />
            <Panel className="h-[380px] animate-pulse bg-muted/40" />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              index={0}
              label="Leads in"
              value={stats?.totals.leads ?? 0}
              delta={stats?.deltas.leads}
              spark={sparks.leads}
              color={TONE.muted}
              icon={Users}
            />
            <StatCard
              index={1}
              label="Calls placed"
              value={stats?.totals.calls ?? 0}
              delta={stats?.deltas.calls}
              spark={sparks.calls}
              color={TONE.muted}
              icon={PhoneCall}
            />
            <StatCard
              index={2}
              label="Answer rate"
              value={stats?.totals.answerRate ?? 0}
              decimals={1}
              suffix="%"
              delta={stats?.deltas.answerRate}
              spark={sparks.answered}
              color={TONE.muted}
              icon={PhoneIncoming}
            />
            <StatCard
              index={3}
              label="Visits booked"
              value={stats?.totals.booked ?? 0}
              delta={stats?.deltas.booked}
              spark={sparks.booked}
              color={TONE.accent}
              icon={CalendarCheck}
            />
          </div>

          {/* Trend + status mix */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Reveal delay={0.05} className="lg:col-span-2">
              <Panel className="h-full">
                <PanelHeader
                  title="Activity"
                  subtitle={`Last ${days} days · ${stats?.totals.talkMinutes ?? 0} minutes of talk time`}
                  action={<ActivityLegend />}
                />
                <div className="p-4 pt-5">
                  {stats && stats.totals.leads > 0 ? (
                    <ActivityChart key={days} data={stats.series} />
                  ) : (
                    <EmptyState
                      icon={PhoneCall}
                      title="Nothing in this window"
                      body="Once leads start arriving, this chart fills in day by day."
                      action={
                        <Link href="/integrations" className={link}>
                          Connect a lead source →
                        </Link>
                      }
                    />
                  )}
                </div>
              </Panel>
            </Reveal>

            <Reveal delay={0.1}>
              <Panel className="h-full">
                <PanelHeader title="Lead status" subtitle={`${stats?.totals.leads ?? 0} in range`} />
                <div className="p-5">
                  {outcomeSegments.length > 0 ? (
                    <OutcomesDonut
                      key={days}
                      segments={outcomeSegments}
                      centerValue={`${stats?.totals.bookRate ?? 0}%`}
                      centerLabel="booked"
                    />
                  ) : (
                    <EmptyState
                      icon={Users}
                      title="No leads yet"
                      body="Statuses appear here as leads move from queued to reached."
                    />
                  )}
                </div>
              </Panel>
            </Reveal>
          </div>

          {/* Recent calls + upcoming */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Reveal delay={0.05} className="lg:col-span-2">
              <Panel className="h-full overflow-hidden">
                <PanelHeader
                  title="Recent calls"
                  action={
                    <Link href="/leads" className={link}>
                      All leads
                    </Link>
                  }
                />
                {stats && stats.recent.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        {['Lead', 'Assistant', 'When', 'Duration'].map((h) => (
                          <TableHead key={h} className="h-10 px-5 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                            {h}
                          </TableHead>
                        ))}
                        <TableHead className="h-10 px-5 text-right font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                          Outcome
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.recent.map((r) => {
                        const outcome = r.booked
                          ? { label: 'Booked', dot: 'bg-green-500', text: 'text-foreground' }
                          : r.status === 'failed'
                            ? { label: 'Failed', dot: 'bg-red-500', text: 'text-foreground' }
                            : r.answered
                              ? { label: 'No booking', dot: 'bg-muted-foreground', text: 'text-muted-foreground' }
                              : { label: 'No answer', dot: 'bg-muted-foreground/40', text: 'text-muted-foreground' };
                        return (
                          <TableRow key={r.id} className="border-border hover:bg-muted/40">
                            <TableCell className="px-5 py-3.5 font-medium text-foreground">{r.name}</TableCell>
                            <TableCell className="px-5 py-3.5 text-muted-foreground">{r.assistant || '—'}</TableCell>
                            <TableCell className="px-5 py-3.5 text-muted-foreground">
                              {r.calledAt
                                ? new Date(r.calledAt).toLocaleString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit',
                                  })
                                : '—'}
                            </TableCell>
                            <TableCell className="px-5 py-3.5 font-mono text-xs tabular-nums text-muted-foreground">
                              {formatDuration(r.duration)}
                            </TableCell>
                            <TableCell className="px-5 py-3.5">
                              <span className={cn('flex items-center justify-end gap-2 text-[13px]', outcome.text)}>
                                <span className={cn('size-1.5 rounded-full', outcome.dot)} />
                                {outcome.label}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <EmptyState
                    icon={PhoneCall}
                    title="No calls yet"
                    body="Every call your agents place shows up here with its outcome."
                  />
                )}
              </Panel>
            </Reveal>

            <Reveal delay={0.1}>
              <Panel className="h-full">
                <PanelHeader
                  title="Upcoming visits"
                  action={
                    <Link href="/appointments" className={link}>
                      All
                    </Link>
                  }
                />
                <div className="p-5">
                  {stats && stats.upcoming.length > 0 ? (
                    <ul className="space-y-4">
                      {stats.upcoming.map((a) => {
                        const when = new Date(a.startTime);
                        const inZone = (o: Intl.DateTimeFormatOptions) =>
                          new Intl.DateTimeFormat(undefined, {
                            ...o,
                            ...(a.timezone ? { timeZone: a.timezone } : {}),
                          }).format(when);
                        return (
                          <li key={a.id} className="flex items-center gap-3">
                            <span className="flex h-10 w-10 flex-none flex-col items-center justify-center rounded-lg border border-border bg-muted/50 leading-none">
                              <span className="font-mono text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
                                {inZone({ month: 'short' })}
                              </span>
                              <span className="mt-0.5 font-mono text-sm font-medium text-foreground">
                                {inZone({ day: 'numeric' })}
                              </span>
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-foreground">{a.customer}</p>
                              <p className="truncate text-xs text-muted-foreground">
                                {inZone({ hour: '2-digit', minute: '2-digit' })} · {a.title}
                              </p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <EmptyState
                      icon={CalendarClock}
                      title="Nothing scheduled"
                      body="Visits your agents book during calls land here and on your calendar."
                    />
                  )}
                </div>
              </Panel>
            </Reveal>
          </div>

          {/* Assistants + numbers */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Reveal delay={0.05} className="lg:col-span-2">
              <Panel className="h-full">
                <PanelHeader
                  title="Assistants"
                  subtitle={rankByBookings ? 'Visits booked per agent' : 'Calls placed per agent'}
                  action={
                    <Link href="/assistants" className={link}>
                      Manage
                    </Link>
                  }
                />
                <div className="p-5">
                  {stats && stats.assistants.length > 0 ? (
                    <AssistantBars
                      key={days}
                      rows={stats.assistants.map((a) => ({
                        id: a.id,
                        label: a.name,
                        value: rankByBookings ? a.booked : a.calls,
                        sublabel: rankByBookings
                          ? `${a.calls} call${a.calls === 1 ? '' : 's'} · ${a.bookRate}% booked`
                          : 'no bookings yet',
                        active: a.isActive,
                      }))}
                    />
                  ) : (
                    <EmptyState
                      icon={Bot}
                      title="No assistants"
                      body="Create your first agent to start answering leads automatically."
                      action={
                        <Link href="/assistants" className={link}>
                          Create an assistant →
                        </Link>
                      }
                    />
                  )}
                </div>
              </Panel>
            </Reveal>

            <Reveal delay={0.1}>
              <NumbersPanel providers={providers} />
            </Reveal>
          </div>

          {/* Account */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Reveal delay={0.05}>
              <BalancePanel credits={credits} pricing={pricing} />
            </Reveal>
            <Reveal delay={0.1}>
              <RatePanel billing={accountData?.billing ?? null} assistants={stats?.assistants.length ?? 0} />
            </Reveal>
          </div>
        </div>
      )}

    </div>
  );
}
