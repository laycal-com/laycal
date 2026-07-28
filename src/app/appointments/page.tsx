'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Phone, User, CheckCircle, MapPin, CalendarClock, Trash2 } from 'lucide-react';
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
    if (!confirm(`Cancel the visit for ${a.appointmentData.customer.name}? This removes it from your calendar.`)) {
      return;
    }
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
    zone: zoneLabel(iso, tz),
    past: new Date(iso).getTime() < Date.now(),
  });

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
            <p>Loading appointments...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PaymentGateWrapper>
      <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', color: '#000000' }}>
        <div className="container mx-auto py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Appointments</h1>
            <p className="text-gray-600 mt-2">
              Visits booked by your agents during calls. Already on your calendar — reschedule or cancel here.
            </p>
          </div>

          {appointments.length === 0 ? (
            <Card style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
              <CardContent className="text-center py-12" style={{ backgroundColor: '#ffffff', color: '#000000' }}>
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments yet</h3>
                <p className="text-gray-500">
                  When an agent books a visit during a call, it appears here and on your Google Calendar.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {appointments.map((a) => {
                const start = fmt(a.appointmentData.startTime, a.timezone);
                const end = fmt(a.appointmentData.endTime, a.timezone);
                const busy = busyId === a._id;

                return (
                  <Card key={a._id} className="overflow-hidden" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
                    <CardHeader style={{ backgroundColor: '#ffffff', color: '#000000' }}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <CardTitle className="text-lg">{a.appointmentData.title}</CardTitle>
                          <CardDescription className="mt-1">
                            Booked {new Date(a.createdAt).toLocaleString()}
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className={start.past ? 'text-gray-500 border-gray-400' : 'text-green-600 border-green-600'}>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {start.past ? 'Past' : 'Booked'}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0" style={{ backgroundColor: '#ffffff', color: '#000000' }}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div className="flex items-center text-sm">
                            <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                            <span className="font-medium">{start.date}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <Clock className="w-4 h-4 mr-2 text-gray-500" />
                            <span>
                              {start.time} – {end.time}
                              {start.zone && <span className="ml-1.5 text-gray-400">{start.zone}</span>}
                            </span>
                          </div>
                          <div className="flex items-center text-sm">
                            <User className="w-4 h-4 mr-2 text-gray-500" />
                            <div>
                              <div>{a.appointmentData.customer.name}</div>
                              {a.appointmentData.customer.email && (
                                <div className="text-gray-500">{a.appointmentData.customer.email}</div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center text-sm">
                            <Phone className="w-4 h-4 mr-2 text-gray-500" />
                            <span className={a.appointmentData.customer.phone === 'unknown' ? 'text-gray-400' : ''}>
                              {a.appointmentData.customer.phone}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {a.callData.summary && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-1">Problem</h4>
                              <p className="text-sm text-gray-600">{a.callData.summary}</p>
                            </div>
                          )}
                          {a.appointmentData.notes && (
                            <div className="flex gap-2 text-sm text-gray-600">
                              <MapPin className="w-4 h-4 text-gray-500 flex-none mt-0.5" />
                              <p className="whitespace-pre-line">{a.appointmentData.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {editingId === a._id ? (
                        <div className="flex flex-wrap items-center gap-3 mt-5 pt-4 border-t border-gray-200">
                          <input
                            type="datetime-local"
                            value={newTime}
                            onChange={(e) => setNewTime(e.target.value)}
                            className="p-2 border border-gray-300 rounded-lg text-sm"
                          />
                          <Button onClick={() => reschedule(a._id)} disabled={busy || !newTime}>
                            {busy ? 'Saving…' : 'Save new time'}
                          </Button>
                          <Button variant="outline" onClick={() => setEditingId(null)} disabled={busy}>
                            Cancel
                          </Button>
                          <span className="text-xs text-gray-500">
                            Keeps the same duration and moves the calendar event.
                          </span>
                        </div>
                      ) : (
                        <div className="flex gap-3 mt-5 pt-4 border-t border-gray-200">
                          <Button variant="outline" onClick={() => startEdit(a)} disabled={busy}>
                            <CalendarClock className="w-4 h-4 mr-2" />
                            Reschedule
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => cancel(a)}
                            disabled={busy}
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {busy ? 'Cancelling…' : 'Cancel visit'}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PaymentGateWrapper>
  );
}
