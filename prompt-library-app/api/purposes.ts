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
    // GET /api/purposes - Get all distinct purposes with usage counts
    if (req.method === 'GET') {
      const { data: purposes, error } = await supabase
        .from('prompts')
        .select('purpose')
        .not('purpose', 'is', null);

      if (error) {
        console.error('Supabase error:', error);
        return errorResponse(res, 'Failed to fetch purposes', 500);
      }

      // Aggregate purposes and count usage
      const purposeCounts = new Map<string, number>();

      purposes?.forEach((p) => {
        if (p.purpose) {
          purposeCounts.set(p.purpose, (purposeCounts.get(p.purpose) || 0) + 1);
        }
      });

      // Convert to array and sort alphabetically
      const result = Array.from(purposeCounts.entries())
        .map(([name, usage_count]) => ({ name, usage_count }))
        .sort((a, b) => a.name.localeCompare(b.name));

      return successResponse(res, result);
    }

    return errorResponse(res, 'Method not allowed', 405);
  } catch (error) {
    console.error('API Error:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
}
