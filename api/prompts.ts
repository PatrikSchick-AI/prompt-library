import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './lib/supabase';
import { corsHeaders, requireAdminKey, errorResponse, successResponse } from './lib/middleware';
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

  // Build query
  let supabaseQuery = supabase
    .from('prompts')
    .select(`
      id,
      name,
      description,
      purpose,
      tags,
      status,
      owner,
      created_at,
      updated_at,
      current_version:prompt_versions!prompts_current_version_id_fkey(
        version_number,
        models
      )
    `);

  // Apply filters
  if (query.status && query.status.length > 0) {
    supabaseQuery = supabaseQuery.in('status', query.status);
  }

  if (query.purpose) {
    supabaseQuery = supabaseQuery.eq('purpose', query.purpose);
  }

  if (query.tags && query.tags.length > 0) {
    supabaseQuery = supabaseQuery.overlaps('tags', query.tags);
  }

  // Apply sorting
  const sortColumn = query.sort === 'rank' ? 'updated_at' : query.sort;
  supabaseQuery = supabaseQuery.order(sortColumn, { ascending: query.order === 'asc' });

  // Apply pagination
  supabaseQuery = supabaseQuery.range(query.offset, query.offset + query.limit - 1);

  const { data, error, count } = await supabaseQuery;

  if (error) {
    console.error('Supabase error:', error);
    return errorResponse(res, 'Failed to fetch prompts', 500);
  }

  return successResponse(res, {
    data: data || [],
    pagination: {
      limit: query.limit,
      offset: query.offset,
      total: count || 0,
    },
  });
}

async function handleCreatePrompt(req: VercelRequest, res: VercelResponse) {
  // Validate request body
  const validationResult = createPromptSchema.safeParse(req.body);
  if (!validationResult.success) {
    return errorResponse(res, validationResult.error.errors[0].message, 400);
  }

  const data = validationResult.data;

  try {
    // Start transaction: create prompt + initial version
    const { data: prompt, error: promptError } = await supabase
      .from('prompts')
      .insert({
        name: data.name,
        description: data.description,
        purpose: data.purpose,
        tags: data.tags,
        owner: data.owner,
        status: 'draft',
      })
      .select()
      .single();

    if (promptError || !prompt) {
      console.error('Create prompt error:', promptError);
      return errorResponse(res, 'Failed to create prompt', 500);
    }

    // Create initial version 1.0.0
    const { data: version, error: versionError } = await supabase
      .from('prompt_versions')
      .insert({
        prompt_id: prompt.id,
        version_number: '1.0.0',
        change_description: 'Initial version',
        content: data.content,
        system_prompt: data.system_prompt,
        models: data.models,
        model_config: data.model_config,
        author: data.author,
      })
      .select()
      .single();

    if (versionError || !version) {
      console.error('Create version error:', versionError);
      // Rollback: delete prompt
      await supabase.from('prompts').delete().eq('id', prompt.id);
      return errorResponse(res, 'Failed to create initial version', 500);
    }

    // Update prompt with current_version_id
    const { error: updateError } = await supabase
      .from('prompts')
      .update({ current_version_id: version.id })
      .eq('id', prompt.id);

    if (updateError) {
      console.error('Update prompt error:', updateError);
    }

    // Log event
    await supabase.from('prompt_events').insert({
      prompt_id: prompt.id,
      event_type: 'created',
      metadata: { initial_version: '1.0.0' },
      created_by: data.author,
    });

    // Fetch full prompt with version
    const { data: fullPrompt } = await supabase
      .from('prompts')
      .select(`
        *,
        current_version:prompt_versions!prompts_current_version_id_fkey(*)
      `)
      .eq('id', prompt.id)
      .single();

    return successResponse(res, fullPrompt, 201);
  } catch (error) {
    console.error('Transaction error:', error);
    return errorResponse(res, 'Failed to create prompt', 500);
  }
}
