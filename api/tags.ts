import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './lib/supabase';
import { corsHeaders, errorResponse, successResponse } from './lib/middleware';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  Object.entries(corsHeaders()).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Handle OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET /api/tags - Get all distinct tags with usage counts
    if (req.method === 'GET') {
      // Query all prompts and aggregate tags
      const { data: prompts, error } = await supabase
        .from('prompts')
        .select('tags');

      if (error) {
        console.error('Supabase error:', error);
        return errorResponse(res, 'Failed to fetch tags', 500);
      }

      // Aggregate tags and count usage
      const tagCounts = new Map<string, number>();

      prompts?.forEach((prompt) => {
        prompt.tags?.forEach((tag: string) => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      });

      // Convert to array and sort by usage count (descending)
      const tags = Array.from(tagCounts.entries())
        .map(([name, usage_count]) => ({ name, usage_count }))
        .sort((a, b) => b.usage_count - a.usage_count);

      return successResponse(res, tags);
    }

    return errorResponse(res, 'Method not allowed', 405);
  } catch (error) {
    console.error('API Error:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
}
