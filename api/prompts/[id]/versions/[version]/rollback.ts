import type { VercelRequest, VercelResponse } from '@vercel/node';
import { callConvexAction } from '../../../../lib/_convex.js';
import { corsHeaders, requireAdminKey, errorResponse } from '../../../../lib/_middleware.js';
import { RollbackRequestSchema } from '../../../../../src/lib/validators.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  Object.entries(corsHeaders()).forEach(([key, value]) => {
    res.setHeader(key, value as string);
  });

  // Handle OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id, version } = req.query as { id: string; version: string };

  if (!id || typeof id !== 'string' || !version || typeof version !== 'string') {
    return errorResponse(res, 'Invalid prompt ID or version', 400);
  }

  try {
    // POST /api/prompts/:id/versions/:version/rollback - Rollback to version
    if (req.method === 'POST') {
      if (!requireAdminKey(req)) {
        return errorResponse(res, 'Unauthorized', 401);
      }

      const validationResult = RollbackRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        return errorResponse(res, validationResult.error.errors[0].message, 400);
      }

      const { status, body } = await callConvexAction<unknown>(
        `/prompts/${id}/versions/${version}/rollback`,
        {
          method: 'POST',
          body: validationResult.data,
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
