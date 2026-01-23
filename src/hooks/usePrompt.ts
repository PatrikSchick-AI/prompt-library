import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { PromptWithVersion } from '../types/prompt';

interface UsePromptResult {
  prompt: PromptWithVersion | null;
  loading: boolean;
  error: Error | null;
}

export function usePrompt(id: string | undefined): UsePromptResult {
  const prompt = useQuery(api.prompts.get, id ? { id } : 'skip');

  return {
    prompt: prompt || null,
    loading: prompt === undefined,
    error: null, // Convex handles errors differently
  };
}
