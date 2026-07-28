/**
 * Repairs hallucinated appointment times on existing call summaries.
 *
 *   node scripts/repair-call-summaries.mjs          # dry run
 *   node scripts/repair-call-summaries.mjs --apply
 *
 * `extractedInfo.appointmentTime` was copied straight from the analysis
 * model's `slot_booked`. That pass never sees the current date, so when it
 * doesn't know the year it invents one — "2024-01-04T16:00:00-07:00" for a
 * call made in 2026. Going forward the webhook prefers the real appointment
 * and rejects anything more than a year out; this applies the same rules to
 * rows already written.
 */

import mongoose from 'mongoose';
import fs from 'fs';

const APPLY = process.argv.includes('--apply');
const YEAR_MS = 365 * 86_400_000;

const env = fs.readFileSync('.env.local', 'utf8');
const uri = env.match(/^MONGODB_URI=(.*)$/m)[1].trim().replace(/^["']|["']$/g, '');

await mongoose.connect(uri);
const db = mongoose.connection.db;

const summaries = await db.collection('callsummaries').find({}).toArray();
const bookings = await db.collection('appointments').find({ status: 'booked' }).toArray();
const byCall = new Map(bookings.map((b) => [b.vapiCallId, b]));

const changes = [];

for (const cs of summaries) {
  const anchor = new Date(cs.createdAt || Date.now()).getTime();
  const booking = byCall.get(cs.vapiCallId);
  const current = cs.extractedInfo?.appointmentTime;

  let next; // undefined = remove
  if (booking?.appointmentData?.startTime) {
    next = booking.appointmentData.startTime;
  } else if (typeof current === 'string' && current) {
    const t = new Date(current).getTime();
    next = !Number.isNaN(t) && Math.abs(t - anchor) <= YEAR_MS ? new Date(t).toISOString() : undefined;
  }

  const removing = current && next === undefined;
  const rewriting = next && current !== next;
  if (!removing && !rewriting) continue;

  changes.push({
    id: cs._id,
    vapiCallId: cs.vapiCallId,
    from: current || '(none)',
    to: next || '(removed — implausible)',
    source: booking ? 'appointment ledger' : 'sanitised',
    booking,
  });
}

console.log(`${summaries.length} summaries scanned, ${changes.length} need repair\n`);
for (const c of changes) {
  console.log(`${String(c.id).slice(-6)}  ${c.from}  ->  ${c.to}   [${c.source}]`);
}

if (!APPLY) {
  console.log('\nDry run. Re-run with --apply to write.');
  await mongoose.disconnect();
  process.exit(0);
}

for (const c of changes) {
  const set = {};
  const unset = {};

  if (c.to === '(removed — implausible)') {
    unset['extractedInfo.appointmentTime'] = '';
    set.appointmentCreated = !!c.booking;
  } else {
    set['extractedInfo.appointmentTime'] = c.to;
    set.appointmentCreated = true;
  }

  if (c.booking) {
    set.appointmentData = {
      title: c.booking.appointmentData?.title,
      startTime: c.booking.appointmentData?.startTime,
      endTime: c.booking.appointmentData?.endTime,
      confirmed: true,
    };
  }

  await db.collection('callsummaries').updateOne(
    { _id: c.id },
    {
      ...(Object.keys(set).length ? { $set: set } : {}),
      ...(Object.keys(unset).length ? { $unset: unset } : {}),
    }
  );
}

console.log(`\nRepaired ${changes.length} summaries.`);
await mongoose.disconnect();
