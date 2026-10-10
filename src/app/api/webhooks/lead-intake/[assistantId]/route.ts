import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import Lead from '@/models/Lead';
import Assistant from '@/models/Assistant';
import { TenantVapiService } from '@/lib/tenantVapi';
import { logger } from '@/lib/logger';
import { validatePhoneNumber, normalizePhoneNumber } from '@/lib/csvProcessor';
import { getVertical } from '@/lib/speedToLead/verticals';
import { rateLimit } from '@/lib/speedToLead/vapiToolBridge';
import { buildCallVariables } from '@/lib/speedToLead/callVariables';

/**
 * Speed-to-lead intake.
 *
 * One endpoint per assistant, handed to the customer to wire into their Google
 * Form or their own website form. A submission creates the lead and dials
 * immediately — the whole product promise is the gap between this POST and the
 * phone ringing.
 *
 * Public by necessity (a website form posts here with no session), so it is
 * rate limited per assistant and validates the assistant id before doing work.
 */

const MAX_RETRIES = 3;
const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60_000;

/** Accepts several spellings so customers can map their own form fields loosely. */
function pick(body: Record<string, any>, ...keys: string[]): string {
  for (const key of keys) {
    const found = Object.keys(body).find((k) => k.toLowerCase().replace(/[\s_-]/g, '') === key);
    if (found && body[found] != null && String(body[found]).trim()) {
      return String(body[found]).trim();
    }
  }
  return '';
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ assistantId: string }> }) {
  const { assistantId } = await ctx.params;

  try {
    if (!rateLimit(`intake:${assistantId}`, RATE_LIMIT, RATE_WINDOW_MS)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    if (!mongoose.Types.ObjectId.isValid(assistantId)) {
      return NextResponse.json({ error: 'Unknown assistant' }, { status: 404 });
    }

    const body = await req.json();

    const firstName = pick(body, 'firstname', 'first');
    const lastName = pick(body, 'lastname', 'last');
    const email = pick(body, 'email', 'emailaddress');
    const phone = pick(body, 'phone', 'phonenumber', 'mobile', 'tel');
    const address = pick(body, 'address', 'serviceaddress', 'streetaddress');
    const details = pick(body, 'details', 'description', 'problem', 'message', 'about');
    const availability = pick(body, 'availability', 'preferredtime', 'besttime');
    const serviceType = pick(body, 'servicetype', 'service', 'jobtype');

    await connectToDatabase();
    const assistant = await Assistant.findOne({ _id: assistantId, isActive: true });

    if (!assistant) {
      logger.error('INTAKE_UNKNOWN_ASSISTANT', 'Intake for unknown assistant', { data: { assistantId } });
      return NextResponse.json({ error: 'Unknown assistant' }, { status: 404 });
    }

    if (!phone) {
      return NextResponse.json({ error: 'phone is required' }, { status: 400 });
    }
    if (!validatePhoneNumber(phone)) {
      logger.error('INTAKE_BAD_PHONE', 'Invalid phone on intake', {
        accountId: assistant.accountId,
        data: { assistantId, phone },
      });
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 });
    }

    const normalizedPhone = normalizePhoneNumber(phone);
    const fullName = `${firstName} ${lastName}`.trim() || 'there';
    const cfg = assistant.serviceConfig;
    const resolvedService =
      serviceType || (cfg?.vertical ? getVertical(cfg.vertical).label : '') || 'service';

    const lead = new Lead({
      accountId: assistant.accountId,
      name: fullName,
      phoneNumber: normalizedPhone,
      email: email || null,
      address: address || null,
      details: details || null,
      availability: availability || null,
      serviceType: resolvedService,
      notes: details || null,
      status: 'calling',
      assignedAssistantId: assistant._id,
    });
    await lead.save();

    logger.info('INTAKE_LEAD_CREATED', 'Speed-to-lead intake received', {
      accountId: assistant.accountId,
      leadId: lead._id.toString(),
      data: { assistantId, service: resolvedService, hasAddress: !!address },
    });

    // Everything the generated prompt interpolates. These MUST go through
    // variableValues — Vapi rejects unknown keys on the customer object.
    const variableValues = buildCallVariables(assistant, {
      address,
      details,
      availability,
      serviceType: resolvedService,
    });

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const vapi = new TenantVapiService();
        const call = await vapi.initiateCall({
          accountId: assistant.accountId,
          phoneNumber: normalizedPhone,
          assistantId: assistant.vapiAssistantId,
          customer: { name: fullName, ...(email && { email }) },
          variableValues,
          metadata: {
            leadId: lead._id.toString(),
            assistantId: assistant._id.toString(),
            source: 'speed_to_lead_intake',
            timestamp: new Date().toISOString(),
          },
        });

        lead.vapiCallId = call.id;
        lead.calledAt = new Date();
        await lead.save();

        assistant.lastUsed = new Date();
        await assistant.save();

        logger.info('INTAKE_CALL_STARTED', 'Speed-to-lead call initiated', {
          accountId: assistant.accountId,
          leadId: lead._id.toString(),
          vapiCallId: call.id,
          data: { attempt },
        });

        return NextResponse.json(
          { success: true, leadId: lead._id.toString(), callId: call.id },
          { status: 200 }
        );
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        logger.error('INTAKE_CALL_ERROR', `Call attempt ${attempt}/${MAX_RETRIES} failed`, {
          accountId: assistant.accountId,
          leadId: lead._id.toString(),
          error: lastError,
        });
        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, 1500 * attempt));
        }
      }
    }

    lead.status = 'failed';
    await lead.save();

    return NextResponse.json(
      {
        success: false,
        leadId: lead._id.toString(),
        error: 'Could not start the call',
        details: lastError?.message,
      },
      { status: 500 }
    );
  } catch (error) {
    logger.error('INTAKE_ERROR', 'Speed-to-lead intake failed', { error, data: { assistantId } });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
