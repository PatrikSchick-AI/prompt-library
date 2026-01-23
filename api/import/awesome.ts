import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../lib/_supabase.js';
import { corsHeaders, requireAdminKey, errorResponse, successResponse } from '../lib/_middleware.js';
import { createPromptSchema } from '../../src/lib/validators.js';
import { parseAndMapMarkdownPrompts, type MarkdownPromptInput } from '../../src/lib/markdownPrompts.js';

const PROMPTS_MD_URL =
  process.env.AWESOME_PROMPTS_MD_URL ||
  'https://raw.githubusercontent.com/openai/prompt-library/main/PROMPTS.md';
const PURPOSE_FILTER = process.env.AWESOME_PROMPTS_PURPOSE || 'awesome-chatgpt-prompts';
const DEFAULT_TAGS = ['awesome-chatgpt-prompts', 'imported'];
const PAGE_SIZE = 100;

interface ImportSummary {
  sourceUrl: string;
  totalParsed: number;
  existing: number;
  imported: number;
  failed: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  Object.entries(corsHeaders()).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return errorResponse(res, 'Method not allowed', 405);
  }

  try {
    if (!requireAdminKey(req)) {
      return errorResponse(res, 'Unauthorized', 401);
    }

    const summary = await importAwesomePrompts();
    return successResponse(res, summary, 201);
  } catch (error) {
    console.error('Import error:', error);
    return errorResponse(res, error instanceof Error ? error.message : 'Import failed', 500);
  }
}

async function importAwesomePrompts(): Promise<ImportSummary> {
  const markdown = await fetchMarkdown();
  const prompts = parseAndMapMarkdownPrompts(markdown, {
    defaultPurpose: PURPOSE_FILTER,
    defaultTags: DEFAULT_TAGS,
  });

  if (prompts.length === 0) {
    return {
      sourceUrl: PROMPTS_MD_URL,
      totalParsed: 0,
      existing: 0,
      imported: 0,
      failed: 0,
    };
  }

  const existingNames = await fetchExistingPromptNames(PURPOSE_FILTER);
  const newPrompts = dedupeByName(
    prompts.filter((prompt) => !existingNames.has(prompt.name))
  );

  let imported = 0;
  let failed = 0;

  for (const prompt of newPrompts) {
    const result = await createPrompt(prompt);
    if (result) {
      imported += 1;
    } else {
      failed += 1;
    }
  }

  return {
    sourceUrl: PROMPTS_MD_URL,
    totalParsed: prompts.length,
    existing: prompts.length - newPrompts.length,
    imported,
    failed,
  };
}

async function fetchMarkdown(): Promise<string> {
  const response = await fetch(PROMPTS_MD_URL, {
    headers: {
      'User-Agent': 'prompt-library-importer',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch PROMPTS.md: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

async function fetchExistingPromptNames(purpose: string): Promise<Set<string>> {
  const existingNames = new Set<string>();
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from('prompts')
      .select('name')
      .eq('purpose', purpose)
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      throw new Error(`Failed to fetch existing prompts: ${error.message}`);
    }

    data?.forEach((prompt) => {
      existingNames.add(prompt.name);
    });

    if (!data || data.length < PAGE_SIZE) {
      break;
    }

    offset += PAGE_SIZE;
  }

  return existingNames;
}

function dedupeByName(prompts: MarkdownPromptInput[]): MarkdownPromptInput[] {
  const seen = new Set<string>();
  return prompts.filter((prompt) => {
    const normalized = prompt.name.trim().toLowerCase();
    if (seen.has(normalized)) {
      return false;
    }
    seen.add(normalized);
    return true;
  });
}

async function createPrompt(prompt: MarkdownPromptInput): Promise<boolean> {
  const validationResult = createPromptSchema.safeParse({
    name: prompt.name,
    description: prompt.description,
    purpose: prompt.purpose,
    tags: prompt.tags,
    content: prompt.content,
    system_prompt: prompt.system_prompt,
    models: prompt.models ?? [],
    model_config: {},
    author: prompt.author,
    owner: prompt.owner,
  });

  if (!validationResult.success) {
    console.error('Prompt validation failed:', validationResult.error.errors[0]?.message);
    return false;
  }

  const data = validationResult.data;

  const { data: createdPrompt, error: promptError } = await supabase
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

  if (promptError || !createdPrompt) {
    console.error('Create prompt error:', promptError);
    return false;
  }

  const { data: version, error: versionError } = await supabase
    .from('prompt_versions')
    .insert({
      prompt_id: createdPrompt.id,
      version_number: '1.0.0',
      change_description: 'Imported from PROMPTS.md',
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
    await supabase.from('prompts').delete().eq('id', createdPrompt.id);
    return false;
  }

  const { error: updateError } = await supabase
    .from('prompts')
    .update({ current_version_id: version.id })
    .eq('id', createdPrompt.id);

  if (updateError) {
    console.error('Update prompt error:', updateError);
  }

  await supabase.from('prompt_events').insert({
    prompt_id: createdPrompt.id,
    event_type: 'created',
    metadata: { initial_version: '1.0.0', source: 'PROMPTS.md' },
    created_by: data.author,
  });

  return true;
}
