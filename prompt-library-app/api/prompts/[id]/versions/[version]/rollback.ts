import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../../../lib/supabase';
import { corsHeaders, requireAdminKey, errorResponse, successResponse } from '../../../../lib/middleware';
import { RollbackRequestSchema } from '../../../../../src/lib/validators';
import { bumpVersion } from '../../../../../src/lib/semver';

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
    // POST /api/prompts/:id/versions/:version/rollback - Rollback to version
    if (req.method === 'POST') {
      if (!requireAdminKey(req)) {
        return errorResponse(res, 'Unauthorized', 401);
      }

      const validationResult = RollbackRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        return errorResponse(res, validationResult.error.errors[0].message, 400);
      }

      const { comment } = validationResult.data;

      // Get target version to rollback to
      const { data: targetVersion, error: targetError } = await supabase
        .from('prompt_versions')
        .select('*')
        .eq('prompt_id', id)
        .eq('version_number', version)
        .single();

      if (targetError || !targetVersion) {
        return errorResponse(res, 'Target version not found', 404);
      }

      // Get current prompt and version
      const { data: prompt, error: promptError } = await supabase
        .from('prompts')
        .select(`
          *,
          current_version:prompt_versions!prompts_current_version_id_fkey(*)
        `)
        .eq('id', id)
        .single();

      if (promptError || !prompt || !prompt.current_version) {
        return errorResponse(res, 'Prompt not found', 404);
      }

      // Calculate new version number (patch bump)
      const currentVersion = prompt.current_version.version_number;
      const newVersionNumber = bumpVersion(currentVersion, 'patch');

      if (!newVersionNumber) {
        return errorResponse(res, 'Failed to calculate new version', 500);
      }

      // Create new version with content from target version
      const { data: newVersion, error: versionError } = await supabase
        .from('prompt_versions')
        .insert({
          prompt_id: id,
          version_number: newVersionNumber,
          change_description: `Rollback to version ${version}: ${comment}`,
          content: targetVersion.content,
          system_prompt: targetVersion.system_prompt,
          models: targetVersion.models,
          model_config: targetVersion.model_config,
          author: req.body.author,
          previous_version_id: prompt.current_version.id,
        })
        .select()
        .single();

      if (versionError || !newVersion) {
        console.error('Version creation error:', versionError);
        return errorResponse(res, 'Failed to create rollback version', 500);
      }

      // Update prompt's current_version_id
      await supabase
        .from('prompts')
        .update({ current_version_id: newVersion.id })
        .eq('id', id);

      // Log event
      await supabase.from('prompt_events').insert({
        prompt_id: id,
        event_type: 'rollback',
        comment,
        metadata: {
          from_version: currentVersion,
          to_version: version,
          new_version: newVersionNumber,
        },
        created_by: req.body.author,
      });

      return successResponse(res, newVersion, 201);
    }

    return errorResponse(res, 'Method not allowed', 405);
  } catch (error) {
    console.error('API Error:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
}
