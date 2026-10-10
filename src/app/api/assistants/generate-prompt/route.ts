import { NextRequest, NextResponse } from 'next/server';
import { getAccountAuth } from '@/lib/account';
import { auth } from '@clerk/nextjs/server';
import { logger } from '@/lib/logger';
import { generateSpeedToLeadPrompt, type SpeedToLeadConfig } from '@/lib/speedToLead/promptGenerator';
import { getVertical, DEFAULT_BUSINESS_HOURS, OTHER_VERTICAL_ID } from '@/lib/speedToLead/verticals';
import { OpenRouterError } from '@/lib/openrouter';

/** Generates a speed-to-lead system prompt from the wizard's answers. */
export async function POST(req: NextRequest) {
  try {
    const { accountId } = await getAccountAuth();
    if (!accountId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    const clientCompany = String(body.clientCompany || '').trim();
    const agentName = String(body.agentName || '').trim();
    if (!clientCompany || !agentName) {
      return NextResponse.json(
        { error: 'Company name and agent name are required' },
        { status: 400 }
      );
    }

    const vertical = getVertical(String(body.vertical || ''));

    // A custom trade has no preset behind it, so its three answers are required.
    const cut = (v: unknown, max: number) => String(v || '').trim().slice(0, max);
    const customTrade =
      vertical.id === OTHER_VERTICAL_ID
        ? {
            label: cut(body.customTrade?.label, 80),
            description: cut(body.customTrade?.description, 400),
            booking: cut(body.customTrade?.booking, 120),
          }
        : undefined;
    if (customTrade && (!customTrade.label || !customTrade.description || !customTrade.booking)) {
      return NextResponse.json(
        { error: 'Tell us your industry, what you do and what the call should book' },
        { status: 400 }
      );
    }

    const questions: string[] = Array.isArray(body.qualifyingQuestions)
      ? body.qualifyingQuestions.map((q: unknown) => String(q).trim()).filter(Boolean)
      : [];

    const objections = Array.isArray(body.objections)
      ? body.objections
          .map((o: any) => ({
            objection: String(o?.objection || '').trim(),
            response: String(o?.response || '').trim(),
          }))
          .filter((o: any) => o.objection && o.response)
      : [];

    const config: SpeedToLeadConfig = {
      agentName,
      clientCompany,
      vertical: vertical.id,
      customTrade,
      serviceArea: body.serviceArea ? String(body.serviceArea).trim() : undefined,
      timezone: String(body.timezone || 'America/New_York'),
      businessHours: body.businessHours || DEFAULT_BUSINESS_HOURS,
      appointmentDurationMins: Number(body.appointmentDurationMins) || vertical.defaultDurationMins,
      diagnosticFee: body.diagnosticFee ? String(body.diagnosticFee).trim() : undefined,
      qualifyingQuestions: questions.length ? questions : vertical.qualifyingQuestions,
      objections: objections.length ? objections : vertical.objections,
      tone: ['warm', 'direct', 'professional'].includes(body.tone) ? body.tone : 'warm',
      extraInstructions: body.extraInstructions ? String(body.extraInstructions).trim() : undefined,
    };

    logger.info('PROMPT_GEN_START', 'Generating speed-to-lead prompt', {
      accountId,
      data: { vertical: config.vertical, company: config.clientCompany },
    });

    const generated = await generateSpeedToLeadPrompt(config);

    logger.info('PROMPT_GEN_SUCCESS', 'Speed-to-lead prompt generated', {
      accountId,
      data: { vertical: config.vertical, length: generated.mainPrompt.length, model: generated.model },
    });

    return NextResponse.json({
      mainPrompt: generated.mainPrompt,
      firstMessage: generated.firstMessage,
      model: generated.model,
    });
  } catch (error) {
    if (error instanceof OpenRouterError) {
      logger.error('PROMPT_GEN_LLM_ERROR', 'OpenRouter failed during prompt generation', { error });
      return NextResponse.json(
        { error: 'Prompt generation is unavailable right now. Please try again.' },
        { status: 502 }
      );
    }

    logger.error('PROMPT_GEN_ERROR', 'Prompt generation failed', { error });
    return NextResponse.json({ error: 'Failed to generate prompt' }, { status: 500 });
  }
}
