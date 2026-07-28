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
import { UpgradeModal } from './UpgradeModal';
import PhoneProviderPrompt from './PhoneProviderPrompt';
import { BarList, DonutChart, TrendChart } from './dashboard/charts';
import { EmptyState, Panel, PanelHeader, Reveal, StatCard } from './dashboard/panels';
import {
  BalancePanel,
  NumbersPanel,
  PlanPanel,
  type CreditData,
  type PricingData,
  type ProviderData,
  type UsageData,
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

const COLORS = {
  leads: '#2563eb',
  calls: '#8b5cf6',
  booked: '#10b981',
  answered: '#f59e0b',
  failed: '#f43f5e',
  pending: '#94a3b8',
  calling: '#0ea5e9',
};

function formatDuration(seconds: number): string {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function DashboardClient() {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [activatingPayg, setActivatingPayg] = useState(false);

  const [days, setDays] = useState(30);
  const [stats, setStats] = useState<Stats | null>(null);
  const [credits, setCredits] = useState<CreditData | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
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
      const [statsRes, creditsRes, subRes, provRes, priceRes] = await Promise.allSettled([
        loadStats(range),
        fetch('/api/credits', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)),
        fetch('/api/subscription').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/phone-providers').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/pricing').then((r) => (r.ok ? r.json() : null)),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      else toast.error('Could not load your call stats');

      if (creditsRes.status === 'fulfilled' && creditsRes.value) setCredits(creditsRes.value);
      if (subRes.status === 'fulfilled' && subRes.value?.subscription) {
        setUsage(subRes.value.subscription);
      }
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
      { label: 'Reached', value: o.completed, color: COLORS.booked },
      { label: 'In progress', value: o.calling, color: COLORS.calling },
      { label: 'Queued', value: o.pending, color: COLORS.pending },
      { label: 'Failed', value: o.failed, color: COLORS.failed },
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
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-500" />
          <p className="text-lg font-medium text-slate-800">Setting up your Pay-as-you-go plan…</p>
          <p className="mt-2 text-sm text-slate-500">Redirecting to PayPal…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" style={{ paddingTop: '80px' }}>
      <PhoneProviderPrompt />

      <main className="container mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-500">
              How your agents are turning inbound leads into booked visits.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
              {RANGES.map((r) => (
                <button
                  key={r.days}
                  onClick={() => setDays(r.days)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    days === r.days
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <button
              onClick={refresh}
              disabled={refreshing}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-50"
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
                className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm transition-colors hover:bg-blue-100/70"
              >
                <Bot className="h-4 w-4 flex-none text-blue-600" />
                <span className="flex-1 text-blue-900">
                  <span className="font-medium">No assistant yet.</span> Create one and it starts
                  answering new leads within seconds.
                </span>
                <ArrowRight className="h-4 w-4 flex-none text-blue-600" />
              </Link>
            )}
            {lowBalance && (
              <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
                <AlertTriangle className="h-4 w-4 flex-none text-amber-600" />
                <span className="flex-1 text-amber-900">
                  <span className="font-medium">Credits are low.</span> Calls stop once the balance
                  runs out — top up below.
                </span>
              </div>
            )}
          </Reveal>
        )}

        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <Panel key={i} className="h-[122px] animate-pulse bg-slate-100/60" />
              ))}
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Panel className="h-[340px] animate-pulse bg-slate-100/60 lg:col-span-2" />
              <Panel className="h-[340px] animate-pulse bg-slate-100/60" />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                index={0}
                label="Leads in"
                value={stats?.totals.leads ?? 0}
                delta={stats?.deltas.leads}
                spark={sparks.leads}
                color={COLORS.leads}
                icon={Users}
              />
              <StatCard
                index={1}
                label="Calls placed"
                value={stats?.totals.calls ?? 0}
                delta={stats?.deltas.calls}
                spark={sparks.calls}
                color={COLORS.calls}
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
                color={COLORS.answered}
                icon={PhoneIncoming}
              />
              <StatCard
                index={3}
                label="Visits booked"
                value={stats?.totals.booked ?? 0}
                delta={stats?.deltas.booked}
                spark={sparks.booked}
                color={COLORS.booked}
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
                    action={
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        {[
                          { label: 'Leads', color: COLORS.leads },
                          { label: 'Calls', color: COLORS.calls },
                          { label: 'Booked', color: COLORS.booked },
                        ].map((l) => (
                          <span key={l.label} className="flex items-center gap-1.5">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: l.color }}
                            />
                            {l.label}
                          </span>
                        ))}
                      </div>
                    }
                  />
                  <div className="p-4">
                    {stats && stats.totals.leads > 0 ? (
                      <TrendChart
                        key={days}
                        data={stats.series}
                        height={272}
                        series={[
                          { key: 'leads', label: 'Leads', color: COLORS.leads },
                          { key: 'calls', label: 'Calls', color: COLORS.calls },
                          { key: 'booked', label: 'Booked', color: COLORS.booked },
                        ]}
                      />
                    ) : (
                      <EmptyState
                        icon={PhoneCall}
                        title="Nothing in this window"
                        body="Once leads start arriving, this chart fills in day by day."
                        action={
                          <Link
                            href="/integrations"
                            className="text-xs font-medium text-blue-600 hover:text-blue-700"
                          >
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
                      <DonutChart
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

            {/* Assistants + upcoming */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Reveal delay={0.05} className="lg:col-span-2">
                <Panel className="h-full">
                  <PanelHeader
                    title="Assistants"
                    subtitle={rankByBookings ? 'Visits booked per agent' : 'Calls placed per agent'}
                    action={
                      <Link
                        href="/assistants"
                        className="text-xs font-medium text-blue-600 hover:text-blue-700"
                      >
                        Manage
                      </Link>
                    }
                  />
                  <div className="p-5">
                    {stats && stats.assistants.length > 0 ? (
                      <BarList
                        key={days}
                        rows={stats.assistants.map((a) => ({
                          label: a.name,
                          value: rankByBookings ? a.booked : a.calls,
                          sublabel: rankByBookings
                            ? `${a.calls} call${a.calls === 1 ? '' : 's'} · ${a.bookRate}% booked`
                            : 'no bookings yet',
                          color: a.isActive
                            ? rankByBookings
                              ? COLORS.booked
                              : COLORS.calls
                            : COLORS.pending,
                        }))}
                      />
                    ) : (
                      <EmptyState
                        icon={Bot}
                        title="No assistants"
                        body="Create your first agent to start answering leads automatically."
                        action={
                          <Link
                            href="/assistants"
                            className="text-xs font-medium text-blue-600 hover:text-blue-700"
                          >
                            Create an assistant →
                          </Link>
                        }
                      />
                    )}
                  </div>
                </Panel>
              </Reveal>

              <Reveal delay={0.1}>
                <Panel className="h-full">
                  <PanelHeader
                    title="Upcoming visits"
                    action={
                      <Link
                        href="/appointments"
                        className="text-xs font-medium text-blue-600 hover:text-blue-700"
                      >
                        All
                      </Link>
                    }
                  />
                  <div className="p-5">
                    {stats && stats.upcoming.length > 0 ? (
                      <ul className="space-y-3">
                        {stats.upcoming.map((a) => {
                          const when = new Date(a.startTime);
                          const inZone = (o: Intl.DateTimeFormatOptions) =>
                            new Intl.DateTimeFormat(undefined, {
                              ...o,
                              ...(a.timezone ? { timeZone: a.timezone } : {}),
                            }).format(when);
                          return (
                            <li key={a.id} className="flex items-start gap-3">
                              <span className="mt-0.5 flex h-8 w-8 flex-none flex-col items-center justify-center rounded-lg bg-slate-100 text-[10px] font-semibold uppercase leading-none text-slate-600">
                                <span>{inZone({ month: 'short' })}</span>
                                <span className="text-xs text-slate-900">{inZone({ day: 'numeric' })}</span>
                              </span>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-slate-900">
                                  {a.customer}
                                </p>
                                <p className="truncate text-xs text-slate-500">
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

            {/* Recent calls */}
            <Reveal delay={0.05}>
              <Panel>
                <PanelHeader
                  title="Recent calls"
                  action={
                    <Link
                      href="/leads"
                      className="text-xs font-medium text-blue-600 hover:text-blue-700"
                    >
                      All leads
                    </Link>
                  }
                />
                {stats && stats.recent.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                          <th className="px-5 py-2.5">Lead</th>
                          <th className="px-5 py-2.5">Assistant</th>
                          <th className="px-5 py-2.5">When</th>
                          <th className="px-5 py-2.5">Duration</th>
                          <th className="px-5 py-2.5 text-right">Outcome</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recent.map((r) => (
                          <tr key={r.id} className="border-b border-slate-50 last:border-0">
                            <td className="px-5 py-3 font-medium text-slate-900">{r.name}</td>
                            <td className="px-5 py-3 text-slate-500">{r.assistant || '—'}</td>
                            <td className="px-5 py-3 text-slate-500">
                              {r.calledAt ? new Date(r.calledAt).toLocaleString() : '—'}
                            </td>
                            <td className="px-5 py-3 tabular-nums text-slate-500">
                              {formatDuration(r.duration)}
                            </td>
                            <td className="px-5 py-3 text-right">
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                  r.booked
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : r.status === 'failed'
                                      ? 'bg-rose-50 text-rose-700'
                                      : r.answered
                                        ? 'bg-slate-100 text-slate-600'
                                        : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                {r.booked
                                  ? 'Booked'
                                  : r.status === 'failed'
                                    ? 'Failed'
                                    : r.answered
                                      ? 'No booking'
                                      : 'No answer'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState
                    icon={PhoneCall}
                    title="No calls yet"
                    body="Every call your agents place shows up here with its outcome."
                  />
                )}
              </Panel>
            </Reveal>

            {/* Account */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Reveal delay={0.05}>
                <BalancePanel credits={credits} pricing={pricing} />
              </Reveal>
              <Reveal delay={0.1}>
                <PlanPanel
                  usage={usage}
                  pricing={pricing}
                  onUpgrade={() => setShowUpgradeModal(true)}
                />
              </Reveal>
              <Reveal delay={0.15}>
                <NumbersPanel providers={providers} />
              </Reveal>
            </div>
          </div>
        )}
      </main>

      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} />}
    </div>
  );
}
