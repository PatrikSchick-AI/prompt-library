import { useState, useEffect } from 'react';
import { promptsApi } from '../lib/api';
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
  error: string | null;
  refresh: () => void;
}

export function usePrompts(options: UsePromptsOptions = {}): UsePromptsResult {
  const [prompts, setPrompts] = useState<PromptListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrompts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await promptsApi.list(options) as { data: PromptListItem[] };
      setPrompts(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch prompts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, [
    options.search,
    options.tags?.join(','),
    options.purpose,
    options.status?.join(','),
    options.models?.join(','),
    options.sort,
    options.order,
    options.limit,
    options.offset,
  ]);

  return {
    prompts,
    loading,
    error,
    refresh: fetchPrompts,
  };
}
