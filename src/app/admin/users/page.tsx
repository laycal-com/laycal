'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

/**
 * Admin: accounts.
 *
 * An account is a customer business. From here an admin invites one (which
 * prepares its rate and starting credits and sends the Clerk invitation), tops
 * its balance up or down, sets its per-minute rate, and suspends it.
 */

interface AccountRow {
  id: string;
  name: string;
  email: string;
  status: 'invited' | 'active' | 'suspended';
  industry: string;
  ratePerMinute: number | null;
  creditBalance: number;
  assistants: number;
  onboarded: boolean;
  createdAt: string;
}

const input = 'w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';
const btn = 'rounded-md px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50';
const STATUS: Record<AccountRow['status'], string> = {
  invited: 'bg-amber-100 text-amber-800',
  active: 'bg-green-100 text-green-800',
  suspended: 'bg-red-100 text-red-800',
};

export default function AdminAccountsPage() {
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [defaultRate, setDefaultRate] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const [invite, setInvite] = useState({ email: '', name: '', ratePerMinute: '', credits: '' });
  const [inviting, setInviting] = useState(false);

  const [editing, setEditing] = useState<AccountRow | null>(null);
  const [edit, setEdit] = useState({ ratePerMinute: '', credits: '', reason: '' });

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/accounts?search=${encodeURIComponent(search)}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAccounts(data.accounts);
      setDefaultRate(data.defaultRate);
    } catch {
      toast.error('Could not load accounts');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    try {
      const res = await fetch('/api/admin/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invite),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invite failed');
      if (data.invitation === 'failed') {
        toast.warning('Account created, but the invitation email failed', { description: data.invitationError });
      } else {
        toast.success('Invitation sent', { description: invite.email });
      }
      setInvite({ email: '', name: '', ratePerMinute: '', credits: '' });
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Invite failed');
    } finally {
      setInviting(false);
    }
  };

  const patch = async (id: string, body: Record<string, unknown>, done: string) => {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/accounts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      toast.success(done);
      await load();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Update failed');
      return false;
    } finally {
      setBusy(null);
    }
  };

  const openEdit = (a: AccountRow) => {
    setEditing(a);
    setEdit({ ratePerMinute: a.ratePerMinute === null ? '' : String(a.ratePerMinute), credits: '', reason: '' });
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const body: Record<string, unknown> = { ratePerMinute: edit.ratePerMinute };
    if (edit.credits.trim() !== '') {
      body.credits = Number(edit.credits);
      body.reason = edit.reason;
    }
    if (await patch(editing.id, body, 'Account updated')) setEditing(null);
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
        <p className="mt-1 text-sm text-gray-600">
          Invite customers, set their per-minute rate and manage their credits. Default rate: ${defaultRate.toFixed(2)} / min.
        </p>
      </div>

      <form onSubmit={sendInvite} className="rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="text-base font-semibold text-gray-900">Invite a customer</h2>
        <p className="mt-1 text-sm text-gray-600">
          Creates the account with these terms and emails a Clerk invitation. Leave the rate empty to use the default.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-5">
          <input className={input} type="email" required placeholder="Email" aria-label="Email" value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} />
          <input className={input} placeholder="Company (optional)" aria-label="Company" value={invite.name} onChange={(e) => setInvite({ ...invite, name: e.target.value })} />
          <input className={input} type="number" min="0" step="0.01" placeholder={`Rate $/min (${defaultRate.toFixed(2)})`} aria-label="Rate per minute" value={invite.ratePerMinute} onChange={(e) => setInvite({ ...invite, ratePerMinute: e.target.value })} />
          <input className={input} type="number" min="0" step="1" placeholder="Starting credits $" aria-label="Starting credits" value={invite.credits} onChange={(e) => setInvite({ ...invite, credits: e.target.value })} />
          <button type="submit" disabled={inviting} className={`${btn} bg-blue-600 text-white hover:bg-blue-700`}>
            {inviting ? 'Sending…' : 'Send invite'}
          </button>
        </div>
      </form>

      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-4">
          <input className={`${input} max-w-sm`} placeholder="Search by company or email" aria-label="Search accounts" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {loading ? (
          <p className="p-6 text-sm text-gray-500">Loading accounts…</p>
        ) : accounts.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">No accounts yet. Invite your first customer above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Account</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Rate</th>
                  <th className="px-4 py-3">Balance</th>
                  <th className="px-4 py-3">Assistants</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {accounts.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{a.name || 'Not set yet'}</div>
                      <div className="text-xs text-gray-500">{a.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS[a.status]}`}>{a.status}</span>
                      {a.status === 'active' && !a.onboarded && <div className="mt-1 text-xs text-gray-500">onboarding not finished</div>}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-gray-900">
                      ${(a.ratePerMinute ?? defaultRate).toFixed(2)}
                      {a.ratePerMinute === null && <span className="ml-1 text-xs text-gray-500">default</span>}
                    </td>
                    <td className={`px-4 py-3 tabular-nums ${a.creditBalance <= 0 ? 'text-red-600' : 'text-gray-900'}`}>${a.creditBalance.toFixed(2)}</td>
                    <td className="px-4 py-3 tabular-nums text-gray-900">{a.assistants}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(a.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(a)} className={`${btn} border border-gray-300 text-gray-700 hover:bg-gray-50`}>
                          Rate and credits
                        </button>
                        {a.status !== 'invited' && (
                          <button
                            disabled={busy === a.id}
                            onClick={() => patch(a.id, { status: a.status === 'suspended' ? 'active' : 'suspended' }, a.status === 'suspended' ? 'Account reactivated' : 'Account suspended')}
                            className={`${btn} ${a.status === 'suspended' ? 'border border-gray-300 text-gray-700 hover:bg-gray-50' : 'text-red-600 hover:bg-red-50'}`}
                          >
                            {a.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEditing(null)}>
          <form onSubmit={saveEdit} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900">{editing.name || editing.email}</h2>
            <p className="mt-1 text-sm text-gray-600">Current balance ${editing.creditBalance.toFixed(2)}</p>

            <label className="mt-5 block text-sm font-medium text-gray-700" htmlFor="edit-rate">Rate per minute ($)</label>
            <input id="edit-rate" className={`${input} mt-1`} type="number" min="0" step="0.01" placeholder={`Default (${defaultRate.toFixed(2)})`} value={edit.ratePerMinute} onChange={(e) => setEdit({ ...edit, ratePerMinute: e.target.value })} />
            <p className="mt-1 text-xs text-gray-500">Applies to calls from now on. Leave empty to use the platform default.</p>

            <label className="mt-5 block text-sm font-medium text-gray-700" htmlFor="edit-credits">Adjust credits ($)</label>
            <input id="edit-credits" className={`${input} mt-1`} type="number" step="0.01" placeholder="e.g. 50 to add, -10 to remove" value={edit.credits} onChange={(e) => setEdit({ ...edit, credits: e.target.value })} />
            <input className={`${input} mt-2`} placeholder="Reason (shown in the customer's history)" aria-label="Reason" value={edit.reason} onChange={(e) => setEdit({ ...edit, reason: e.target.value })} />

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} className={`${btn} border border-gray-300 text-gray-700 hover:bg-gray-50`}>Close</button>
              <button type="submit" disabled={busy === editing.id} className={`${btn} bg-blue-600 text-white hover:bg-blue-700`}>
                {busy === editing.id ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
