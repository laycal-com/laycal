/**
 * Migrates `pendingappointments` → `appointments`.
 *
 *   node scripts/migrate-appointments.mjs          # dry run, prints the plan
 *   node scripts/migrate-appointments.mjs --apply  # writes
 *
 * Beyond the rename it does three things the old shape could not express:
 *   - collapses the status enum to booked | cancelled
 *   - backfills userId on legacy rows (they resolved ownership via phoneNumberId)
 *   - backfills assistantId / leadId by joining on vapiCallId
 */

import mongoose from 'mongoose';
import fs from 'fs';

const APPLY = process.argv.includes('--apply');

const env = fs.readFileSync('.env.local', 'utf8');
const uri = env.match(/^MONGODB_URI=(.*)$/m)[1].trim().replace(/^["']|["']$/g, '');

await mongoose.connect(uri);
const db = mongoose.connection.db;

const names = (await db.listCollections().toArray()).map((c) => c.name);
if (!names.includes('pendingappointments')) {
  console.log('Nothing to do — pendingappointments does not exist.');
  await mongoose.disconnect();
  process.exit(0);
}

const source = await db.collection('pendingappointments').find({}).toArray();
const providers = await db.collection('phoneproviders').find({}).toArray();
const providerOwner = new Map(
  providers.filter((p) => p.vapiPhoneNumberId).map((p) => [p.vapiPhoneNumberId, p.userId])
);

const STATUS = {
  confirmed: 'booked',
  pending_confirmation: 'booked',
  rejected: 'cancelled',
};

const planned = [];
for (const doc of source) {
  const lead = doc.vapiCallId
    ? await db.collection('leads').findOne({ vapiCallId: doc.vapiCallId })
    : null;

  const { confirmedBy, confirmedAt, ...rest } = doc;

  planned.push({
    ...rest,
    status: STATUS[doc.status] || 'booked',
    userId: doc.userId || providerOwner.get(doc.phoneNumberId) || lead?.userId || undefined,
    assistantId: doc.assistantId || lead?.assignedAssistantId || null,
    leadId: doc.leadId || lead?._id || null,
    source: doc.source || 'vapi_webhook',
    ...(doc.status === 'rejected' ? { cancelledAt: confirmedAt || doc.updatedAt } : {}),
  });
}

console.log(`${source.length} row(s) to migrate\n`);
for (const p of planned) {
  console.log({
    id: String(p._id),
    status: p.status,
    userId: p.userId ?? '(none)',
    assistantId: p.assistantId ? String(p.assistantId) : '(none)',
    leadId: p.leadId ? String(p.leadId) : '(none)',
    start: p.appointmentData?.startTime,
  });
}

const unowned = planned.filter((p) => !p.userId);
if (unowned.length) console.log(`\nWARNING: ${unowned.length} row(s) still have no userId.`);

if (!APPLY) {
  console.log('\nDry run. Re-run with --apply to write.');
  await mongoose.disconnect();
  process.exit(0);
}

if (planned.length) {
  await db.collection('appointments').deleteMany({
    _id: { $in: planned.map((p) => p._id) },
  });
  await db.collection('appointments').insertMany(planned);
}

const written = await db.collection('appointments').countDocuments();
if (written < planned.length) {
  throw new Error(`Refusing to drop source: wrote ${written}, expected >= ${planned.length}`);
}

await db.collection('pendingappointments').drop();
console.log(`\nMigrated ${planned.length} row(s). Dropped pendingappointments.`);

await mongoose.disconnect();
