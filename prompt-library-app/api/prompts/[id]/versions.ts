import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../lib/supabase';
import { corsHeaders, errorResponse, successResponse } from '../../lib/middleware';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  Object.entries(corsHeaders()).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Handle OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return errorResponse(res, 'Invalid prompt ID', 400);
  }

  try {
    // GET /api/prompts/:id/versions - List all versions
    if (req.method === 'GET') {
      const { data: versions, error } = await supabase
        .from('prompt_versions')
        .select('*')
        .eq('prompt_id', id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        return errorResponse(res, 'Failed to fetch versions', 500);
      }

      return successResponse(res, versions || []);
    }

    return errorResponse(res, 'Method not allowed', 405);
  } catch (error) {
    console.error('API Error:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
}
