import { NextRequest, NextResponse } from 'next/server';
import { getAccountAuth } from '@/lib/account';
import { auth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import CallSummary from '@/models/CallSummary';
import { logger } from '@/lib/logger';

/**
 * Mints a playable URL for a call recording.
 *
 * Vapi's end-of-call report carries the recording twice:
 *
 *   artifact.stereoRecordingUrl  — raw bucket path, never publicly readable
 *                                  (`400 InvalidArgument: Authorization`)
 *   artifact.presignedStereoUrl  — signed, plays fine, expires ~30 min later
 *
 * We stored the first one, which is why every player showed 0:00 / 0:00. The
 * signed URL cannot simply be stored instead — it is dead half an hour after
 * the call — but `GET /call/{id}` re-issues a fresh one every time it is
 * called, so the right move is to mint one on demand at view time.
 *
 * The call id comes from the stored summary rather than the client, so this
 * can't be pointed at arbitrary hosts.
 */
export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  try {
    const { accountId } = await getAccountAuth();
    if (!accountId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await connectToDatabase();
    const summary = await CallSummary.findOne({ _id: id, accountId })
      .select('vapiCallId stereoRecordingUrl')
      .lean();

    if (!summary) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const { vapiCallId, stereoRecordingUrl } = summary as any;
    if (!vapiCallId && !stereoRecordingUrl) {
      return NextResponse.json({ playable: false, reason: 'none' });
    }

    const apiKey = process.env.VAPI_API_KEY;
    if (apiKey && vapiCallId) {
      try {
        const res = await fetch(`https://api.vapi.ai/call/${vapiCallId}`, {
          headers: { Authorization: `Bearer ${apiKey}` },
          signal: AbortSignal.timeout(8000),
        });

        if (res.ok) {
          const call = await res.json();
          const url = call?.artifact?.presignedStereoUrl || call?.artifact?.presignedMonoUrl;

          if (url) {
            return NextResponse.json({
              playable: true,
              reason: 'ok',
              url,
              expiresAt: call?.artifact?.presignedUrlsExpiresAt ?? null,
            });
          }
        } else if (res.status === 404) {
          // Vapi prunes calls after its retention window.
          return NextResponse.json({ playable: false, reason: 'missing', status: 404 });
        }
      } catch (vapiError) {
        logger.warn('RECORDING_PRESIGN_FAILED', 'Could not mint a presigned recording URL', {
          accountId,
          vapiCallId,
          data: { error: vapiError instanceof Error ? vapiError.message : String(vapiError) },
        });
      }
    }

    // No signed URL available. Report on the stored one so the UI can say
    // something specific rather than showing a player that never loads.
    if (!stereoRecordingUrl) {
      return NextResponse.json({ playable: false, reason: 'none' });
    }

    let status = 0;
    let reason: 'ok' | 'forbidden' | 'missing' | 'unreachable' = 'unreachable';
    try {
      const probe = await fetch(stereoRecordingUrl, {
        headers: { Range: 'bytes=0-0' },
        signal: AbortSignal.timeout(8000),
      });
      status = probe.status;
      if (probe.ok || status === 206) reason = 'ok';
      else if ([400, 401, 403].includes(status)) reason = 'forbidden';
      else if ([404, 410].includes(status)) reason = 'missing';
    } catch {
      reason = 'unreachable';
    }

    return NextResponse.json({
      playable: reason === 'ok',
      reason,
      status,
      ...(reason === 'ok' ? { url: stereoRecordingUrl } : {}),
    });
  } catch (error) {
    logger.error('RECORDING_STATUS_ERROR', 'Could not resolve recording', {
      error,
      data: { callSummaryId: id },
    });
    return NextResponse.json({ error: 'Failed to resolve recording' }, { status: 500 });
  }
}
