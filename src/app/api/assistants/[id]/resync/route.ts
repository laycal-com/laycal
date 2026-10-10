import { NextRequest, NextResponse } from 'next/server';
import { getAccountAuth } from '@/lib/account';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongodb';
import Assistant from '@/models/Assistant';
import { tenantVapiService } from '@/lib/tenantVapi';
import { logger } from '@/lib/logger';
import { buildCalendarTools, SPEED_TO_LEAD_SCHEMA, SPEED_TO_LEAD_SUMMARY_PROMPT } from '@/lib/speedToLead/tools';

/**
 * Re-pushes the stored assistant to Vapi using the *current* environment.
 *
 * The calendar tool URLs and the end-of-call webhook URL are baked onto the Vapi
 * assistant when it is saved. Changing NEXT_PUBLIC_APP_URL or VAPI_WEBHOOK_URL
 * — which happens every time an ngrok tunnel restarts — has no effect on
 * assistants that already exist, and the failure is silent: the agent talks
 * normally but its tools quietly point at a dead host.
 *
 * This exists so that is a one-click fix rather than a re-save of the whole form.
 */
export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  try {
    const { accountId } = await getAccountAuth();
    if (!accountId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const assistant = await Assistant.findOne({ _id: id, accountId });

    if (!assistant) {
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({} as any));
    const isSpeedToLead = !!assistant.serviceConfig;

    // Resolution order matters. The request headers win because that is the
    // hostname the browser actually reached us on — if you loaded the app
    // through an ngrok tunnel, that tunnel is provably reachable from outside,
    // whereas NEXT_PUBLIC_APP_URL is a guess that goes stale every restart.
    const forwardedHost = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
    const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
    const detected = forwardedHost ? `${forwardedProto}://${forwardedHost}` : '';

    const isLocal = (u: string) => /localhost|127\.0\.0\.1|0\.0\.0\.0/.test(u);

    const candidates = [
      typeof body.baseUrl === 'string' ? body.baseUrl.trim() : '',
      detected,
      process.env.NEXT_PUBLIC_APP_URL || '',
    ].filter(Boolean);

    const appUrl = candidates.find((u) => !isLocal(u)) || '';

    if (isSpeedToLead && !appUrl) {
      return NextResponse.json(
        {
          error:
            'No publicly reachable URL found. Open this app through your tunnel URL and re-sync from there, or pass one explicitly.',
          needsBaseUrl: true,
          tried: candidates,
        },
        { status: 400 }
      );
    }

    // Point the end-of-call webhook at the same public host, so a tunnel
    // restart cannot leave tools and webhook disagreeing about where we live.
    const webhookUrl = appUrl
      ? `${appUrl.replace(/\/$/, '')}/api/webhooks/vapi`
      : process.env.VAPI_WEBHOOK_URL || '';

    await tenantVapiService.updateAssistant(assistant.vapiAssistantId, {
      name: assistant.name,
      voice: assistant.voice,
      mainPrompt: assistant.mainPrompt,
      language: assistant.language,
      firstMessage: 'Hi, is this {{customer.name}}?',
      ...(webhookUrl && { serverUrl: webhookUrl }),
      ...(isSpeedToLead && {
        tools: buildCalendarTools(String(assistant._id), appUrl),
        summaryPrompt: SPEED_TO_LEAD_SUMMARY_PROMPT,
        structuredDataPrompt: 'Extract the speed-to-lead service call fields from this conversation.',
        structuredDataSchema: SPEED_TO_LEAD_SCHEMA,
      }),
    });

    logger.info('ASSISTANT_RESYNC', 'Assistant re-pushed to Vapi', {
      accountId,
      data: { assistantId: id, appUrl, webhookUrl, tools: isSpeedToLead },
    });

    return NextResponse.json({
      success: true,
      toolsUrl: isSpeedToLead ? `${appUrl.replace(/\/$/, '')}/api/vapi/calendar/${assistant._id}` : null,
      webhookUrl: webhookUrl || null,
      warning: webhookUrl ? undefined : 'VAPI_WEBHOOK_URL is not set — end-of-call reports will not arrive.',
    });
  } catch (error) {
    logger.error('ASSISTANT_RESYNC_ERROR', 'Failed to re-sync assistant to Vapi', {
      error,
      data: { assistantId: id },
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Re-sync failed' },
      { status: 500 }
    );
  }
}
