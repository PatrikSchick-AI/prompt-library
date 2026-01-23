import type { VercelRequest, VercelResponse } from '@vercel/node';
import { callConvexAction } from '../../lib/_convex';
import { corsHeaders, errorResponse } from '../../lib/_middleware';

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
      const { status, body } = await callConvexAction<unknown>(
        `/prompts/${id}/versions`,
        {
          method: 'GET',
        }
      );

      return res.status(status).json(body);
    }

    return errorResponse(res, 'Method not allowed', 405);
  } catch (error) {
    console.error('API Error:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
}
