import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { PromptListItem } from '../types/prompt';

interface UsePromptsOptions {
  search?: string;
  tags?: string[];
  purpose?: string;
  status?: string[];
  models?: string[];
  sort?: string;
  order?: string;
  limit?: number;
  offset?: number;
}

interface UsePromptsResult {
  prompts: PromptListItem[];
  loading: boolean;
  error: Error | null;
}

export function usePrompts(options: UsePromptsOptions = {}): UsePromptsResult {
  const prompts = useQuery(api.prompts.list, options);

  return {
    prompts: prompts || [],
    loading: prompts === undefined,
    error: null, // Convex handles errors differently
  };
}
