import type { VercelRequest, VercelResponse } from '@vercel/node';
import { callConvexAction } from './lib/convex';
import { corsHeaders, errorResponse } from './lib/middleware';
import { createPromptSchema, SearchPromptsSchema } from '../src/lib/validators';

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
    // GET /api/prompts - List/search prompts
    if (req.method === 'GET') {
      return await handleGetPrompts(req, res);
    }

    // POST /api/prompts - Create prompt (PUBLIC - no admin key required)
    if (req.method === 'POST') {
      return await handleCreatePrompt(req, res);
    }

    return errorResponse(res, 'Method not allowed', 405);
  } catch (error) {
    console.error('API Error:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
}

async function handleGetPrompts(req: VercelRequest, res: VercelResponse) {
  const query = {
    search: req.query.search as string | undefined,
    tags: req.query.tags ? (Array.isArray(req.query.tags) ? req.query.tags : [req.query.tags]) : undefined,
    purpose: req.query.purpose as string | undefined,
    status: req.query.status ? (Array.isArray(req.query.status) ? req.query.status : [req.query.status]) : undefined,
    models: req.query.models ? (Array.isArray(req.query.models) ? req.query.models : [req.query.models]) : undefined,
    sort: (req.query.sort as string) || 'updated_at',
    order: (req.query.order as string) || 'desc',
    limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
    offset: req.query.offset ? parseInt(req.query.offset as string, 10) : 0,
  };

  // Validate query
  const validationResult = SearchPromptsSchema.safeParse(query);
  if (!validationResult.success) {
    return errorResponse(res, validationResult.error.errors[0].message, 400);
  }

  const convexQuery: VercelRequest['query'] = {
    search: query.search,
    tags: query.tags,
    purpose: query.purpose,
    status: query.status,
    models: query.models,
    sort: query.sort,
    order: query.order,
    limit: String(query.limit),
    offset: String(query.offset),
  };

  const { status, body } = await callConvexAction<unknown>('/prompts', {
    method: 'GET',
    query: convexQuery,
  });

  return res.status(status).json(body);
}

async function handleCreatePrompt(req: VercelRequest, res: VercelResponse) {
  // Validate request body
  const validationResult = createPromptSchema.safeParse(req.body);
  if (!validationResult.success) {
    return errorResponse(res, validationResult.error.errors[0].message, 400);
  }

  const data = validationResult.data;

  const { status, body } = await callConvexAction<unknown>('/prompts', {
    method: 'POST',
    body: data,
  });

  return res.status(status).json(body);
}
