import { useState, useEffect } from 'react';
import { promptsApi } from '../lib/api';
import type { PromptWithVersion } from '../types/prompt';

interface UsePromptResult {
  prompt: PromptWithVersion | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function usePrompt(id: string | undefined): UsePromptResult {
  const [prompt, setPrompt] = useState<PromptWithVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrompt = async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await promptsApi.get(id);
      setPrompt(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch prompt');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompt();
  }, [id]);

  return {
    prompt,
    loading,
    error,
    refresh: fetchPrompt,
  };
}
