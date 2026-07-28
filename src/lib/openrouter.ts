import { logger } from '@/lib/logger';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

/** Gemma 4 31B — 262k context, cheap, good enough for structured rewriting. */
export const DEFAULT_PROMPT_MODEL = 'google/gemma-4-31b-it';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

export class OpenRouterError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = 'OpenRouterError';
  }
}

/**
 * Chat completion with one retry.
 *
 * OpenRouter load-balances across providers for a given model and the slow tail
 * is real — the same payload measured 12s on one provider and blew a 90s
 * timeout on another. So we ask for throughput-sorted routing and retry once on
 * a timeout, which re-rolls the provider.
 */
export async function complete(
  messages: ChatMessage[],
  options: CompletionOptions = {}
): Promise<string> {
  try {
    return await attempt(messages, options);
  } catch (error) {
    const retriable =
      error instanceof OpenRouterError &&
      (/timed out/i.test(error.message) || (error.status ?? 0) >= 500);

    if (!retriable) throw error;

    logger.warn('OPENROUTER_RETRY', 'Retrying completion after transient failure', {
      data: { reason: (error as Error).message.slice(0, 120) },
    });
    return attempt(messages, options);
  }
}

async function attempt(messages: ChatMessage[], options: CompletionOptions): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new OpenRouterError('OPENROUTER_API_KEY is not configured');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 60_000);

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        // OpenRouter attributes usage to these; harmless if unset.
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://laycal.com',
        'X-Title': 'Laycal Prompt Generation',
      },
      body: JSON.stringify({
        model: options.model || DEFAULT_PROMPT_MODEL,
        messages,
        temperature: options.temperature ?? 0.4,
        max_tokens: options.maxTokens ?? 4000,
        // Steers away from the slow tail of providers serving this model.
        provider: { sort: 'throughput' },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new OpenRouterError(
        `OpenRouter returned ${response.status}: ${body.slice(0, 500)}`,
        response.status
      );
    }

    const data = await response.json();
    const content: string | undefined = data?.choices?.[0]?.message?.content;

    if (!content || !content.trim()) {
      throw new OpenRouterError('OpenRouter returned an empty completion');
    }

    logger.info('OPENROUTER_COMPLETION', 'Prompt generated', {
      data: {
        model: data?.model,
        promptTokens: data?.usage?.prompt_tokens,
        completionTokens: data?.usage?.completion_tokens,
      },
    });

    return content.trim();
  } catch (error) {
    if (error instanceof OpenRouterError) throw error;
    if ((error as Error)?.name === 'AbortError') {
      throw new OpenRouterError('OpenRouter request timed out');
    }
    throw new OpenRouterError((error as Error)?.message || 'OpenRouter request failed');
  } finally {
    clearTimeout(timeout);
  }
}
