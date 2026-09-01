/**
 * AI Provider Registry
 *
 * Single entry point for getting the configured LLM provider.
 * Set AI_PROVIDER=mock in .env for local development / testing.
 * Set AI_PROVIDER=groq (default) for production.
 */

import logger from '../../../utils/logger';
import type { LLMProvider } from './llm-provider.interface';
import { GroqLLMProvider } from './groq.provider';
import { MockLLMProvider } from './mock.provider';

let _provider: LLMProvider | null = null;

export function getAIProvider(): LLMProvider {
  if (_provider) return _provider;

  const providerName = process.env.AI_PROVIDER ?? 'groq';

  if (providerName === 'mock') {
    logger.info('🤖 AI Provider: mock (deterministic mode)');
    _provider = new MockLLMProvider();
  } else {
    const groq = new GroqLLMProvider();
    if (!groq.isAvailable()) {
      logger.warn('⚠️  Groq unavailable — falling back to mock provider');
      _provider = new MockLLMProvider();
    } else {
      logger.info('🤖 AI Provider: groq');
      _provider = groq;
    }
  }

  return _provider;
}

/** Reset provider (for testing) */
export function resetAIProvider(): void {
  _provider = null;
}
