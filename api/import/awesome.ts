import type { VercelRequest, VercelResponse } from '@vercel/node';
import { callConvexAction } from '../lib/_convex.js';
import { corsHeaders, requireAdminKey, errorResponse, successResponse } from '../lib/_middleware.js';
import { createPromptSchema } from '../../src/lib/validators.js';
import { parseAndMapCSVPrompts, type CSVPromptInput } from '../../src/lib/csvPrompts.js';

const PROMPTS_CSV_URL =
  process.env.AWESOME_PROMPTS_CSV_URL ||
  'https://raw.githubusercontent.com/f/awesome-chatgpt-prompts/main/prompts.csv';
const PURPOSE_FILTER = process.env.AWESOME_PROMPTS_PURPOSE || 'awesome-chatgpt-prompts';
const DEFAULT_TAGS = ['awesome-chatgpt-prompts', 'imported'];

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
  const csv = await fetchCSV();
  const prompts = parseAndMapCSVPrompts(csv, {
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
    sourceUrl: PROMPTS_CSV_URL,
    totalParsed: prompts.length,
    existing: prompts.length - newPrompts.length,
    imported,
    failed,
  };
}

async function fetchCSV(): Promise<string> {
  const response = await fetch(PROMPTS_CSV_URL, {
    headers: {
      'User-Agent': 'prompt-library-importer',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch prompts.csv: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

async function fetchExistingPromptNames(purpose: string): Promise<Set<string>> {
  const existingNames = new Set<string>();

  // Use Convex search API to get prompts by purpose
  const convexQuery: VercelRequest['query'] = {
    purpose: purpose,
    limit: '1000', // Get all prompts for this purpose
  };

  const { status, body } = await callConvexAction<unknown>('/prompts', {
    method: 'GET',
    query: convexQuery,
  });

  if (status !== 200) {
    throw new Error(`Failed to fetch existing prompts: HTTP ${status}`);
  }

  // Assume body is an array of prompts with 'name' property
  const prompts = body as any[];
  if (Array.isArray(prompts)) {
    prompts.forEach((prompt) => {
      if (prompt.name) {
        existingNames.add(prompt.name);
      }
    });
  }

  return existingNames;
}

function dedupeByName(prompts: CSVPromptInput[]): CSVPromptInput[] {
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

async function createPrompt(prompt: CSVPromptInput): Promise<boolean> {
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

  // Use Convex API to create the prompt
  const { status, body } = await callConvexAction<unknown>('/prompts', {
    method: 'POST',
    body: data,
  });

  if (status !== 201 && status !== 200) {
    console.error('Create prompt error:', status, body);
    return false;
  }

  // Assume the response contains the created prompt
  const createdPrompt = body as any;
  if (!createdPrompt || !createdPrompt.id) {
    console.error('Invalid response from Convex API:', body);
    return false;
  }

  return true;
}
