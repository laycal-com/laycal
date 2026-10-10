// Clears all customer data ahead of the move from per-user plans to accounts.
//
// Dry run by default; pass --apply to write. Admin logins, platform settings,
// contact form submissions and collected emails are kept. Reads MONGODB_URI
// from the environment:
//
//   node --env-file=.env.local scripts/reset-accounts.mjs          # show what would go
//   node --env-file=.env.local scripts/reset-accounts.mjs --apply  # do it
//
// Assistants and phone numbers already created in Vapi are NOT touched; remove
// those from the Vapi dashboard if you no longer want them.

import mongoose from 'mongoose';

const APPLY = process.argv.includes('--apply');

const DROP = [
  // customer data
  'leads', 'assistants', 'appointments', 'callsummaries', 'phoneproviders',
  'calendarconnections', 'supporttickets', 'pendingtransactions',
  // the old plan-based model
  'subscriptions', 'usagetrackings', 'credits', 'admincredittransactions',
  // the new model, so a re-run starts clean
  'accounts', 'memberships', 'creditledgers',
];

const ASSISTANT_FEE = 10;

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is not set');
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;
console.log(`Database: ${db.databaseName}${APPLY ? '' : '  (dry run)'}\n`);

const existing = new Set((await db.listCollections().toArray()).map((c) => c.name));

for (const name of DROP) {
  if (!existing.has(name)) continue;
  const count = await db.collection(name).countDocuments();
  console.log(`${APPLY ? 'dropping' : 'would drop'} ${name.padEnd(26)} ${count} document(s)`);
  if (APPLY) await db.collection(name).drop();
}

const kept = [...existing].filter((n) => !DROP.includes(n));
console.log(`\nKept: ${kept.join(', ') || '(none)'}`);

const fee = await db.collection('systemsettings').findOne({ key: 'assistant_base_cost' });
console.log(`\nAssistant fee is ${fee?.value ?? '(unset)'}; ${APPLY ? 'setting' : 'would set'} it to ${ASSISTANT_FEE}.`);
if (APPLY) {
  await db.collection('systemsettings').updateOne(
    { key: 'assistant_base_cost' },
    { $set: { value: ASSISTANT_FEE, updatedAt: new Date() } }
  );
}

if (!APPLY) console.log('\nDry run. Re-run with --apply to write.');
await mongoose.disconnect();
