import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../lib/supabase';
import { corsHeaders, requireAdminKey, errorResponse, successResponse } from '../lib/middleware';
import { UpdatePromptMetadataSchema, CreateVersionSchema } from '../../src/lib/validators';
import { bumpVersion } from '../../src/lib/semver';

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
  const { data: prompt, error } = await supabase
    .from('prompts')
    .select(`
      *,
      current_version:prompt_versions!prompts_current_version_id_fkey(*),
      versions:prompt_versions(id, version_number, created_at, author),
      recent_events:prompt_events(
        id,
        event_type,
        comment,
        created_at,
        created_by
      )
    `)
    .eq('id', id)
    .order('created_at', { foreignTable: 'prompt_versions', ascending: false })
    .order('created_at', { foreignTable: 'prompt_events', ascending: false })
    .limit(10, { foreignTable: 'prompt_events' })
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return errorResponse(res, 'Prompt not found', 404);
    }
    console.error('Supabase error:', error);
    return errorResponse(res, 'Failed to fetch prompt', 500);
  }

  return successResponse(res, prompt);
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

  const { data: prompt, error } = await supabase
    .from('prompts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return errorResponse(res, 'Prompt not found', 404);
    }
    console.error('Update error:', error);
    return errorResponse(res, 'Failed to update prompt', 500);
  }

  // Log event
  await supabase.from('prompt_events').insert({
    prompt_id: id,
    event_type: 'metadata_updated',
    metadata: updates,
  });

  return successResponse(res, prompt);
}

async function handleCreateVersion(id: string, req: VercelRequest, res: VercelResponse) {
  const validationResult = CreateVersionSchema.safeParse(req.body);
  if (!validationResult.success) {
    return errorResponse(res, validationResult.error.errors[0].message, 400);
  }

  const data = validationResult.data;

  // Get current prompt and version
  const { data: prompt, error: promptError } = await supabase
    .from('prompts')
    .select(`
      *,
      current_version:prompt_versions!prompts_current_version_id_fkey(*)
    `)
    .eq('id', id)
    .single();

  if (promptError || !prompt) {
    return errorResponse(res, 'Prompt not found', 404);
  }

  if (!prompt.current_version) {
    return errorResponse(res, 'No current version found', 500);
  }

  // Calculate new version number
  const currentVersion = prompt.current_version.version_number;
  const newVersionNumber = bumpVersion(currentVersion, data.bump_type);

  if (!newVersionNumber) {
    return errorResponse(res, 'Invalid version number', 500);
  }

  // Create new version
  const { data: newVersion, error: versionError } = await supabase
    .from('prompt_versions')
    .insert({
      prompt_id: id,
      version_number: newVersionNumber,
      change_description: data.change_description,
      content: data.content,
      system_prompt: data.system_prompt,
      models: data.models || prompt.current_version.models,
      model_config: data.model_config || prompt.current_version.model_config,
      author: data.author,
      previous_version_id: prompt.current_version.id,
    })
    .select()
    .single();

  if (versionError || !newVersion) {
    console.error('Version creation error:', versionError);
    return errorResponse(res, 'Failed to create version', 500);
  }

  // Update prompt's current_version_id
  await supabase
    .from('prompts')
    .update({ current_version_id: newVersion.id })
    .eq('id', id);

  // Log event
  await supabase.from('prompt_events').insert({
    prompt_id: id,
    event_type: 'version_created',
    metadata: {
      version: newVersionNumber,
      bump_type: data.bump_type,
    },
    created_by: data.author,
  });

  return successResponse(res, newVersion, 201);
}

async function handleDeletePrompt(id: string, res: VercelResponse) {
  const { error } = await supabase
    .from('prompts')
    .delete()
    .eq('id', id);

  if (error) {
    if (error.code === 'PGRST116') {
      return errorResponse(res, 'Prompt not found', 404);
    }
    console.error('Delete error:', error);
    return errorResponse(res, 'Failed to delete prompt', 500);
  }

  return successResponse(res, { message: 'Prompt deleted successfully' });
}
