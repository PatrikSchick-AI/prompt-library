import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../lib/supabase';
import { corsHeaders, requireAdminKey, errorResponse, successResponse } from '../../lib/middleware';
import { StatusChangeRequestSchema } from '../../../src/lib/validators';

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
    // POST /api/prompts/:id/status - Change status
    if (req.method === 'POST') {
      if (!requireAdminKey(req)) {
        return errorResponse(res, 'Unauthorized', 401);
      }

      const validationResult = StatusChangeRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        return errorResponse(res, validationResult.error.errors[0].message, 400);
      }

      const { status, comment } = validationResult.data;

      // Get current prompt
      const { data: prompt, error: fetchError } = await supabase
        .from('prompts')
        .select('status')
        .eq('id', id)
        .single();

      if (fetchError || !prompt) {
        return errorResponse(res, 'Prompt not found', 404);
      }

      const oldStatus = prompt.status;

      // Update status
      const { data: updatedPrompt, error: updateError } = await supabase
        .from('prompts')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (updateError || !updatedPrompt) {
        console.error('Status update error:', updateError);
        return errorResponse(res, 'Failed to update status', 500);
      }

      // Log event
      await supabase.from('prompt_events').insert({
        prompt_id: id,
        event_type: 'status_changed',
        comment,
        metadata: {
          from_status: oldStatus,
          to_status: status,
        },
        created_by: req.body.author,
      });

      return successResponse(res, updatedPrompt);
    }

    return errorResponse(res, 'Method not allowed', 405);
  } catch (error) {
    console.error('API Error:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
}
