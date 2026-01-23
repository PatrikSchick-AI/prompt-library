import type { VercelRequest, VercelResponse } from '@vercel/node';
import { callConvexAction } from '../lib/convex';
import { corsHeaders, requireAdminKey, errorResponse } from '../lib/middleware';
import { UpdatePromptMetadataSchema, CreateVersionSchema } from '../../src/lib/validators';

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
    // GET /api/prompts/:id - Get prompt details
    if (req.method === 'GET') {
      return await handleGetPrompt(id, res);
    }

    // PUT /api/prompts/:id - Update prompt
    if (req.method === 'PUT') {
      if (!requireAdminKey(req)) {
        return errorResponse(res, 'Unauthorized', 401);
      }
      return await handleUpdatePrompt(id, req, res);
    }

    // DELETE /api/prompts/:id - Delete prompt
    if (req.method === 'DELETE') {
      if (!requireAdminKey(req)) {
        return errorResponse(res, 'Unauthorized', 401);
      }
      return await handleDeletePrompt(id, res);
    }

    return errorResponse(res, 'Method not allowed', 405);
  } catch (error) {
    console.error('API Error:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
}

async function handleGetPrompt(id: string, res: VercelResponse) {
  const { status, body } = await callConvexAction<unknown>(`/prompts/${id}`, {
    method: 'GET',
  });

  return res.status(status).json(body);
}

async function handleUpdatePrompt(id: string, req: VercelRequest, res: VercelResponse) {
  const body = req.body;

  // Check if this is a content update (creates new version) or metadata update
  if (body.content !== undefined || body.bump_type !== undefined) {
    return await handleCreateVersion(id, req, res);
  }

  // Metadata update
  const validationResult = UpdatePromptMetadataSchema.safeParse(body);
  if (!validationResult.success) {
    return errorResponse(res, validationResult.error.errors[0].message, 400);
  }

  const updates = validationResult.data;

  const { status, body } = await callConvexAction<unknown>(`/prompts/${id}`, {
    method: 'PUT',
    body: updates,
  });

  return res.status(status).json(body);
}

async function handleCreateVersion(id: string, req: VercelRequest, res: VercelResponse) {
  const validationResult = CreateVersionSchema.safeParse(req.body);
  if (!validationResult.success) {
    return errorResponse(res, validationResult.error.errors[0].message, 400);
  }

  const { status, body } = await callConvexAction<unknown>(`/prompts/${id}`, {
    method: 'PUT',
    body: validationResult.data,
  });

  return res.status(status).json(body);
}

async function handleDeletePrompt(id: string, res: VercelResponse) {
  const { status, body } = await callConvexAction<unknown>(`/prompts/${id}`, {
    method: 'DELETE',
  });

  return res.status(status).json(body);
}
