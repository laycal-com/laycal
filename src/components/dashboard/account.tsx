'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Bot, Minus, Phone, Plus, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Panel, PanelHeader } from './panels';
import { CountUp } from './charts';

/**
 * Account state: credits, plan usage, and outbound numbers.
 *
 * These replace CreditWidget / UsageWidget / PhoneProviderStatus, which were
 * dashboard-only and each invented their own card treatment. Data is fetched
 * once by the parent and passed down so the three panels can't disagree about
 * the plan.
 */

export interface CreditData {
  balance: number;
  planType: string;
  needsTopup: boolean;
  minimumBalance: number;
  recentTransactions: Array<{ type: string; amount: number; description: string; date: string }>;
}

export interface UsageData {
  planType: string;
  planName: string;
  minutesUsed: number;
  minuteLimit: number;
  minutesRemaining: number;
  minutesOverage: number;
  assistantsCreated: number;
  assistantLimit: number;
  assistantsRemaining: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  isOverLimit: boolean;
  isPayAsYouGo: boolean;
  currentPeriodCost: number;
  overageCost: number;
  callsUsed?: number;
  callLimit?: number;
  callsRemaining?: number;
}

export interface ProviderData {
  id: string;
  displayName: string;
  phoneNumber: string;
  isActive: boolean;
  isDefault: boolean;
  vapiPhoneNumberId?: string;
}

export interface PricingData {
  assistant_base_cost: number;
  cost_per_minute_payg: number;
  minimum_topup_amount: number;
}

function Meter({ value, tone = 'blue' }: { value: number; tone?: 'blue' | 'amber' | 'rose' }) {
  const bar = { blue: 'bg-primary', amber: 'bg-amber-500', rose: 'bg-red-500' }[tone];
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
      <div
        className={`h-full rounded-full transition-[width] duration-700 ease-out ${bar}`}
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export function BalancePanel({
  credits,
  pricing,
}: {
  credits: CreditData | null;
  pricing: PricingData | null;
}) {
  const step = pricing?.minimum_topup_amount || 5;
  const [amount, setAmount] = useState(step);
  const [busy, setBusy] = useState(false);

  const topUp = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          description: `Credit top-up: $${amount}`,
          planType: 'credit-topup',
        }),
      });
      if (!res.ok) throw new Error('Failed to create payment order');
      const order = await res.json();
      if (!order.approvalUrl) throw new Error('PayPal did not return an approval URL');
      window.location.href = order.approvalUrl;
    } catch (e) {
      toast.error('Top-up failed', {
        description: e instanceof Error ? e.message : 'Please try again or contact support.',
      });
      setBusy(false);
    }
  };

  return (
    <Panel id="credits" className="flex h-full scroll-mt-20 flex-col">
      <PanelHeader
        title="Credits"
        subtitle={credits?.needsTopup ? 'Below your minimum balance' : 'Spent as your agents talk'}
      />
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <p className="font-mono text-[2rem] font-medium leading-none tracking-[-0.02em] text-foreground">
            <CountUp value={credits?.balance ?? 0} decimals={2} prefix="$" />
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {credits?.needsTopup
              ? `Minimum is $${(credits.minimumBalance || 5).toFixed(2)} — calls stop below zero.`
              : 'Available balance'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAmount((a) => Math.max(step, a - step))}
            disabled={busy || amount <= step}
            className="flex h-9 w-9 flex-none items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
            aria-label="Decrease amount"
          >
            <Minus className="h-4 w-4" />
          </button>
          <div className="flex h-9 flex-1 items-center justify-center rounded-lg border border-border font-mono text-base font-medium tabular-nums text-foreground">
            ${amount}
          </div>
          <button
            type="button"
            onClick={() => setAmount((a) => a + step)}
            disabled={busy}
            className="flex h-9 w-9 flex-none items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
            aria-label="Increase amount"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <Button onClick={topUp} disabled={busy} className="w-full">
          <Wallet className="mr-2 h-4 w-4" />
          {busy ? 'Redirecting…' : `Add $${amount} in credits`}
        </Button>

        {credits && credits.recentTransactions.length > 0 && (
          <div className="mt-auto border-t border-border pt-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Recent
            </p>
            <ul className="space-y-1.5">
              {credits.recentTransactions.slice(0, 3).map((t, i) => (
                <li key={i} className="flex items-center justify-between gap-3 text-xs">
                  <span className="min-w-0 truncate text-muted-foreground">{t.description}</span>
                  <span
                    className={`flex-none font-medium tabular-nums ${
                      t.amount > 0 ? 'text-green-600 dark:text-green-500' : 'text-muted-foreground'
                    }`}
                  >
                    {t.amount > 0 ? '+' : '−'}${Math.abs(t.amount).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Panel>
  );
}

/* -------------------------------------------------------------------------- */

export function PlanPanel({
  usage,
  pricing,
  onUpgrade,
}: {
  usage: UsageData | null;
  pricing: PricingData | null;
  onUpgrade: () => void;
}) {
  if (!usage) {
    return (
      <Panel className="h-full">
        <PanelHeader title="Plan" />
        <div className="p-5 text-sm text-muted-foreground">Plan details are unavailable right now.</div>
      </Panel>
    );
  }

  const isTrial = usage.planType === 'trial';
  const callsUsed = usage.callsUsed || 0;
  const callLimit = usage.callLimit || 5;
  const unlimitedAssistants = usage.assistantLimit === -1;
  const assistantPct = unlimitedAssistants
    ? 0
    : (usage.assistantsCreated / Math.max(usage.assistantLimit, 1)) * 100;

  const showUpgrade = isTrial
    ? usage.isOverLimit || callsUsed >= callLimit || usage.assistantsRemaining === 0
    : !usage.isPayAsYouGo && (usage.isOverLimit || usage.minutesRemaining < 100);

  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader
        title="Plan"
        subtitle={
          isTrial
            ? `Trial ends ${new Date(usage.currentPeriodEnd).toLocaleDateString()}`
            : `${new Date(usage.currentPeriodStart).toLocaleDateString()} – ${new Date(
                usage.currentPeriodEnd
              ).toLocaleDateString()}`
        }
        action={
          <span className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-foreground">
            {usage.planName}
          </span>
        }
      />
      <div className="flex flex-1 flex-col gap-5 p-5">
        {isTrial ? (
          <div>
            <div className="mb-1.5 flex items-baseline justify-between text-sm">
              <span className="font-medium text-foreground">Trial calls</span>
              <span className="tabular-nums text-muted-foreground">
                {callsUsed} / {callLimit}
              </span>
            </div>
            <Meter
              value={(callsUsed / callLimit) * 100}
              tone={callsUsed >= callLimit ? 'rose' : 'blue'}
            />
          </div>
        ) : (
          <div>
            <div className="mb-1.5 flex items-baseline justify-between text-sm">
              <span className="font-medium text-foreground">Calling minutes</span>
              <span className="tabular-nums text-muted-foreground">
                {usage.minutesUsed}
                {usage.minuteLimit === -1 ? '' : ` / ${usage.minuteLimit}`}
              </span>
            </div>
            {usage.minuteLimit === -1 ? (
              <p className="text-xs text-muted-foreground">
                Pay-as-you-go — ${pricing?.cost_per_minute_payg ?? 0.07} per minute
              </p>
            ) : (
              <Meter
                value={(usage.minutesUsed / Math.max(usage.minuteLimit, 1)) * 100}
                tone={usage.isOverLimit ? 'rose' : usage.minutesRemaining < 100 ? 'amber' : 'blue'}
              />
            )}
          </div>
        )}

        <div>
          <div className="mb-1.5 flex items-baseline justify-between text-sm">
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <Bot className="h-3.5 w-3.5 text-muted-foreground" />
              Assistants
            </span>
            <span className="tabular-nums text-muted-foreground">
              {usage.assistantsCreated}
              {unlimitedAssistants ? '' : ` / ${usage.assistantLimit}`}
            </span>
          </div>
          {unlimitedAssistants ? (
            <p className="text-xs text-muted-foreground">Unlimited on your plan</p>
          ) : (
            <Meter value={assistantPct} tone={usage.assistantsRemaining === 0 ? 'amber' : 'blue'} />
          )}
        </div>

        <div className="mt-auto flex items-end justify-between border-t border-border pt-4">
          <div>
            <p className="text-xs text-muted-foreground">This period</p>
            <p className="font-mono text-lg font-medium tabular-nums text-foreground">
              ${usage.currentPeriodCost.toFixed(2)}
            </p>
          </div>
          {showUpgrade ? (
            <Button size="sm" onClick={onUpgrade}>
              Upgrade
            </Button>
          ) : (
            <Link
              href="/#pricing"
              className="text-xs font-medium text-foreground underline-offset-4 transition-colors hover:underline"
            >
              View plans →
            </Link>
          )}
        </div>
      </div>
    </Panel>
  );
}

/* -------------------------------------------------------------------------- */

export function NumbersPanel({ providers }: { providers: ProviderData[] }) {
  const active = providers.filter((p) => p.isActive);

  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader
        title="Outbound numbers"
        subtitle={`${active.filter((p) => p.vapiPhoneNumberId).length + 1} ready to call`}
        action={
          <Link
            href="/settings"
            className="text-xs font-medium text-foreground underline-offset-4 transition-colors hover:underline"
          >
            Manage
          </Link>
        }
      />
      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/50 px-3 py-2.5">
          <span className="flex items-center gap-2 text-sm text-foreground">
            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
            Shared US number
          </span>
          <span className="flex items-center gap-1.5 text-xs text-foreground">
            <span className="size-1.5 rounded-full bg-green-500" />
            Ready
          </span>
        </div>

        {active.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5"
          >
            <span className="flex min-w-0 items-center gap-2 text-sm text-foreground">
              <Phone className="h-3.5 w-3.5 flex-none text-muted-foreground" />
              <span className="truncate">{p.displayName}</span>
              {p.isDefault && (
                <span className="flex-none rounded border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  Default
                </span>
              )}
            </span>
            <span className="flex-none text-xs tabular-nums text-muted-foreground">
              {p.vapiPhoneNumberId ? p.phoneNumber : 'Not provisioned'}
            </span>
          </div>
        ))}

        {active.length === 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            No custom providers. US calls go out on the shared number — add your own Twilio, Plivo
            or Vonage number to call internationally.
          </p>
        )}
      </div>
    </Panel>
  );
}
