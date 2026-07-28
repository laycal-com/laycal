import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongodb';
import Assistant from '@/models/Assistant';
import Lead from '@/models/Lead';
import { logger } from '@/lib/logger';
import { buildCallVariables } from '@/lib/speedToLead/callVariables';

/**
 * Creates a throwaway lead for a browser test call.
 *
 * The Vapi webhook resolves a call to its lead via metadata.leadId, then
 * vapiCallId, then phone number. A browser call has no phone number, so without
 * a real lead to point at, the end-of-call report arrives and is discarded —
 * no call summary, no transcript, nothing to inspect.
 *
 * POST creates the lead before the call; PATCH stamps the Vapi call id on it
 * once `vapi.start` resolves. The PATCH is what actually makes the link work:
 * the web SDK takes metadata inside `assistantOverrides`, which has no such
 * field, so `metadata.leadId` never reaches the server on a browser call and
 * `vapiCallId` is the only handle left.
 */
export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));

    await connectToDatabase();
    const assistant = await Assistant.findOne({ _id: id, userId });
    if (!assistant) {
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
    }

    const lead = await Lead.create({
      userId,
      name: String(body.name || 'Browser Test').slice(0, 120),
      // Marks the row as non-dialable so it can never be picked up by a real
      // calling flow; browser calls have no phone number.
      phoneNumber: '+10000000000',
      email: body.email || null,
      address: body.address || null,
      details: body.details || null,
      availability: body.availability || null,
      serviceType: body.serviceType || null,
      notes: 'Created by a browser test call',
      status: 'calling',
      assignedAssistantId: assistant._id,
      calledAt: new Date(),
    });

    logger.info('WEB_TEST_LEAD_CREATED', 'Test lead created for browser call', {
      userId,
      leadId: lead._id.toString(),
      data: { assistantId: id },
    });

    // Built server-side so a browser test gets exactly the same variables as a
    // real call — including date_reference, which the client has no way to
    // compute (it needs the assistant's configured timezone).
    return NextResponse.json({
      leadId: lead._id.toString(),
      variableValues: buildCallVariables(assistant, lead),
    });
  } catch (error) {
    logger.error('WEB_TEST_LEAD_ERROR', 'Failed to create browser test lead', {
      error,
      data: { assistantId: id },
    });
    return NextResponse.json({ error: 'Failed to create test lead' }, { status: 500 });
  }
}

/** Attaches the Vapi call id to a test lead so in-call tools can find it. */
export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { leadId, vapiCallId } = await request.json().catch(() => ({}) as any);
    if (!leadId || !vapiCallId) {
      return NextResponse.json({ error: 'leadId and vapiCallId are required' }, { status: 400 });
    }

    await connectToDatabase();
    const result = await Lead.updateOne({ _id: leadId, userId }, { $set: { vapiCallId } });
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    logger.info('WEB_TEST_LEAD_LINKED', 'Test lead linked to Vapi call', {
      userId,
      leadId: String(leadId),
      vapiCallId: String(vapiCallId),
      data: { assistantId: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('WEB_TEST_LEAD_LINK_ERROR', 'Failed to link test lead to call', {
      error,
      data: { assistantId: id },
    });
    return NextResponse.json({ error: 'Failed to link test lead' }, { status: 500 });
  }
}
