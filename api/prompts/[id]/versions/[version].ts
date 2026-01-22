import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../../lib/supabase';
import { corsHeaders, errorResponse, successResponse } from '../../../lib/middleware';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  Object.entries(corsHeaders()).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Handle OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id, version } = req.query;

  if (!id || typeof id !== 'string' || !version || typeof version !== 'string') {
    return errorResponse(res, 'Invalid prompt ID or version', 400);
  }

  try {
    // GET /api/prompts/:id/versions/:version - Get specific version
    if (req.method === 'GET') {
      const { data: versionData, error } = await supabase
        .from('prompt_versions')
        .select('*')
        .eq('prompt_id', id)
        .eq('version_number', version)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return errorResponse(res, 'Version not found', 404);
        }
        console.error('Supabase error:', error);
        return errorResponse(res, 'Failed to fetch version', 500);
      }

      return successResponse(res, versionData);
    }

    return errorResponse(res, 'Method not allowed', 405);
  } catch (error) {
    console.error('API Error:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
}
