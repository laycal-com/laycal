'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const EMPTY = { name: '', email: '', company: '', message: '', type: 'general' };
const field = 'h-11 rounded-lg';

export function ContactForm() {
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);

  const set =
    (key: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send your message');
      toast.success(data.message || 'Message sent');
      setForm(EMPTY);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send your message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex h-full flex-col gap-6">
      <div className="space-y-2">
        <Label htmlFor="contact-name">Full name</Label>
        <Input id="contact-name" required value={form.name} onChange={set('name')} placeholder="Maria Reyes" className={field} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-email">Email address</Label>
        <Input id="contact-email" type="email" required value={form.email} onChange={set('email')} placeholder="maria@company.com" className={field} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-company">Company</Label>
        <Input id="contact-company" value={form.company} onChange={set('company')} placeholder="Ace Heating & Air" className={field} />
      </div>

      {/* Takes whatever height is left, so the card ends level with the map beside it. */}
      <div className="flex min-h-[9rem] flex-1 flex-col space-y-2">
        <Label htmlFor="contact-message">Message</Label>
        <Textarea
          id="contact-message"
          required
          value={form.message}
          onChange={set('message')}
          placeholder="Tell us what you are trying to do."
          className="flex-1 resize-none rounded-lg"
        />
      </div>

      <div>
        <Button
          type="submit"
          disabled={submitting}
          className="h-10 gap-2 rounded-lg bg-white px-5 text-sm font-medium text-black shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition-[transform,background-color] hover:bg-neutral-200 active:scale-[0.98]"
        >
          {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
          {submitting ? 'Sending…' : 'Submit'}
        </Button>
      </div>
    </form>
  );
}
