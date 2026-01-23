import type { VercelRequest, VercelResponse } from '@vercel/node';
import { callConvexAction } from './lib/convex';
import { corsHeaders, errorResponse } from './lib/middleware';

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
      const { status, body } = await callConvexAction<unknown>('/tags', {
        method: 'GET',
      });

      return res.status(status).json(body);
    }

    return errorResponse(res, 'Method not allowed', 405);
  } catch (error) {
    console.error('API Error:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
}
