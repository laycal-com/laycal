'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CalendarCheck, CalendarClock, Mail, MapPin, Phone, X } from 'lucide-react';
import { PageHeader, PortalPage } from '@/components/portal/page';
import { cn } from '@/lib/utils';
import { PaymentGateWrapper } from '@/components/PaymentGateWrapper';
import { toast } from 'sonner';
import { formatVisit, zoneLabel } from '@/lib/formatAppointment';

/**
 * Booked visits.
 *
 * There is no approve/reject queue any more — the agent books the slot live
 * while the homeowner is on the phone, so every row here is already on the
 * calendar. The only useful actions are moving it or calling it off, and both
 * write through to Google Calendar.
 */

interface Appointment {
  _id: string;
  vapiCallId: string;
  status: string;
  appointmentData: {
    title: string;
    startTime: string;
    endTime: string;
    customer: { name: string; phone: string; email?: string };
    notes?: string;
  };
  callData: { duration?: number; summary?: string };
  /** Business timezone captured at booking; absent on pre-2026-07-28 rows. */
  timezone?: string;
  createdAt: string;
}

/** Formats an ISO string for a datetime-local input in the viewer's zone. */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTime, setNewTime] = useState('');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  const fetchAppointments = async () => {
    try {
      const res = await fetch('/api/appointments?status=booked');
      const data = await res.json();
      if (res.ok) setAppointments(data.appointments || []);
      else toast.error(data.error || 'Failed to load appointments');
    } catch {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const startEdit = (a: Appointment) => {
    setEditingId(a._id);
    setNewTime(toLocalInput(a.appointmentData.startTime));
  };

  const reschedule = async (id: string) => {
    if (!newTime) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        // datetime-local has no zone; toISOString applies the viewer's offset.
        body: JSON.stringify({ startTime: new Date(newTime).toISOString() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reschedule');
      toast.success('Rescheduled', { description: 'The calendar event was moved too.' });
      setEditingId(null);
      fetchAppointments();
    } catch (e) {
      toast.error('Could not reschedule', {
        description: e instanceof Error ? e.message : 'Unknown error',
      });
    } finally {
      setBusyId(null);
    }
  };

  const cancel = async (a: Appointment) => {
    setConfirmingId(null);
    setBusyId(a._id);
    try {
      const res = await fetch(`/api/appointments/${a._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel');
      toast.success('Appointment cancelled', {
        description: 'Removed from your calendar. Kept in your booking history.',
      });
      fetchAppointments();
    } catch (e) {
      toast.error('Could not cancel', {
        description: e instanceof Error ? e.message : 'Unknown error',
      });
    } finally {
      setBusyId(null);
    }
  };

  // Rendered in the business's zone, not the viewer's — the technician's day
  // happens where the customer lives, and that is the time the agent promised.
  const fmt = (iso: string, tz?: string) => ({
    date: formatVisit(iso, tz, { weekday: 'short', month: 'short', day: 'numeric', hour: undefined, minute: undefined }),
    time: formatVisit(iso, tz, { weekday: undefined, month: undefined, day: undefined, hour: '2-digit', minute: '2-digit' }),
    // Asked for one part at a time so the layout never depends on how a locale orders them.
    weekday: formatVisit(iso, tz, { weekday: 'long', month: undefined, day: undefined, hour: undefined, minute: undefined }),
    month: formatVisit(iso, tz, { weekday: undefined, month: 'short', day: undefined, hour: undefined, minute: undefined }),
    day: formatVisit(iso, tz, { weekday: undefined, month: undefined, day: 'numeric', hour: undefined, minute: undefined }),
    zone: zoneLabel(iso, tz),
    past: new Date(iso).getTime() < Date.now(),
  });

  const now = Date.now();
  const isPast = (a: Appointment) => new Date(a.appointmentData.startTime).getTime() < now;
  const byStart = (dir: 1 | -1) => (x: Appointment, y: Appointment) =>
    dir * (new Date(x.appointmentData.startTime).getTime() - new Date(y.appointmentData.startTime).getTime());
  const upcoming = appointments.filter((a) => !isPast(a)).sort(byStart(1));
  const past = appointments.filter(isPast).sort(byStart(-1));
  const shown = tab === 'upcoming' ? upcoming : past;

  const outline = 'h-8 gap-1.5 rounded-lg border-input bg-transparent px-3 text-foreground hover:bg-accent';

  return (
    <PaymentGateWrapper>
      <PortalPage>
        <PageHeader
          title="Appointments"
          description="Visits your agents booked during calls. They are already on your calendar."
        />

        <div role="group" aria-label="Show" className="mb-4 inline-flex gap-0.5 rounded-lg border border-border bg-card p-0.5">
          {(
            [
              ['upcoming', 'Upcoming', upcoming.length],
              ['past', 'Past', past.length],
            ] as const
          ).map(([value, label, count]) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              aria-pressed={tab === value}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                tab === value ? 'bg-accent font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {label}
              <span className="font-mono text-xs tabular-nums text-muted-foreground">{loading ? '–' : count}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3" aria-busy="true" aria-label="Loading appointments">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[132px] animate-pulse rounded-xl border border-border bg-muted/40" />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-border bg-card px-6 py-16 text-center">
            <CalendarCheck className="size-8 text-muted-foreground/50" />
            <p className="mt-3 text-sm font-medium text-foreground">
              {tab === 'upcoming' ? 'Nothing scheduled' : 'No past visits'}
            </p>
            <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">
              When an agent books a visit during a call, it appears here and on your Google Calendar.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {shown.map((a) => {
              const start = fmt(a.appointmentData.startTime, a.timezone);
              const end = fmt(a.appointmentData.endTime, a.timezone);
              const busy = busyId === a._id;
              const phone = a.appointmentData.customer.phone;

              return (
                <li
                  key={a._id}
                  className="rounded-xl border border-border bg-card shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                >
                  <div className="flex flex-col gap-5 p-5 md:flex-row md:items-start">
                    <div className="flex items-center gap-4 md:w-64 md:shrink-0">
                      <span
                        className={cn(
                          'flex size-14 shrink-0 flex-col items-center justify-center rounded-xl border leading-none',
                          start.past ? 'border-border bg-muted/40' : 'border-primary/40 bg-primary/10'
                        )}
                      >
                        <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          {start.month}
                        </span>
                        <span className="mt-1 font-mono text-xl font-medium text-foreground">{start.day}</span>
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground">{start.weekday}</div>
                        <div className="mt-0.5 font-mono text-xs tabular-nums text-muted-foreground">
                          {start.time} – {end.time}
                          {start.zone && <span className="ml-1.5">{start.zone}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <h2 className="text-[15px] font-medium text-foreground">{a.appointmentData.title}</h2>
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className={cn('size-1.5 rounded-full', start.past ? 'bg-muted-foreground/50' : 'bg-green-500')} />
                          {start.past ? 'Past' : 'Booked'}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
                        <span className="text-foreground">{a.appointmentData.customer.name}</span>
                        <span className="flex items-center gap-1.5">
                          <Phone className="size-3.5" />
                          <span className={cn('font-mono text-xs', phone === 'unknown' && 'opacity-60')}>{phone}</span>
                        </span>
                        {a.appointmentData.customer.email && (
                          <span className="flex items-center gap-1.5">
                            <Mail className="size-3.5" />
                            {a.appointmentData.customer.email}
                          </span>
                        )}
                      </div>
                      {a.callData.summary && (
                        <p className="mt-3 max-w-[70ch] text-sm leading-6 text-muted-foreground">{a.callData.summary}</p>
                      )}
                      {a.appointmentData.notes && (
                        <p className="mt-2 flex gap-2 text-sm leading-6 text-muted-foreground">
                          <MapPin className="mt-1 size-3.5 flex-none" />
                          <span className="whitespace-pre-line">{a.appointmentData.notes}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 border-t border-border px-5 py-3">
                    {editingId === a._id ? (
                      <>
                        <Input
                          type="datetime-local"
                          aria-label="New start time"
                          value={newTime}
                          onChange={(e) => setNewTime(e.target.value)}
                          className="h-8 w-auto rounded-lg [color-scheme:dark]"
                        />
                        <Button size="sm" onClick={() => reschedule(a._id)} disabled={busy || !newTime} className="h-8 rounded-lg px-3">
                          {busy ? 'Saving…' : 'Save new time'}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)} disabled={busy} className={outline}>
                          Keep current time
                        </Button>
                        <span className="text-xs text-muted-foreground">Keeps the same duration and moves the calendar event.</span>
                      </>
                    ) : confirmingId === a._id ? (
                      <>
                        <span className="text-sm text-foreground">
                          Cancel the visit for {a.appointmentData.customer.name}? It is removed from your calendar.
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => cancel(a)}
                          className="h-8 rounded-lg border-red-500/40 bg-red-500/10 px-3 text-red-500 hover:bg-red-500/20 hover:text-red-400"
                        >
                          Yes, cancel visit
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setConfirmingId(null)} className={outline}>
                          Keep it
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" onClick={() => startEdit(a)} disabled={busy} className={outline}>
                          <CalendarClock className="size-3.5" />
                          Reschedule
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setConfirmingId(a._id)}
                          disabled={busy}
                          className="h-8 gap-1.5 rounded-lg px-3 text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
                        >
                          <X className="size-3.5" />
                          {busy ? 'Cancelling…' : 'Cancel visit'}
                        </Button>
                        <span className="ml-auto text-xs text-muted-foreground">
                          Booked {new Date(a.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </PortalPage>
    </PaymentGateWrapper>
  );
}
