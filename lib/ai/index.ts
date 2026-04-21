import type { AIImageProvider, GenerateImageParams } from '@/lib/types';
import { MinimaxProvider } from './providers/minimax';

const providers: Record<string, AIImageProvider> = {
  minimax: new MinimaxProvider(),
};

export function getProvider(name: string = 'minimax'): AIImageProvider {
  const provider = providers[name];
  if (!provider) {
    throw new Error(`AI provider "${name}" not found`);
  }
  return provider;
}

export function listProviders(): string[] {
  return Object.keys(providers);
}

export type { AIImageProvider, GenerateImageParams };
