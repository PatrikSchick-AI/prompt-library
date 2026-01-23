#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import { execSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_OUTPUT_DIR = 'scripts/convex-import';
const TABLES = ['prompts', 'prompt_versions', 'prompt_events'] as const;
const PAGE_SIZE = 1000;

type PromptRow = {
  id: string;
  name: string;
  description: string | null;
  purpose: string;
  tags: string[];
  status: string;
  owner: string | null;
  current_version_id: string | null;
  created_at: string;
  updated_at: string;
  search_tsv?: string | null;
};

type PromptVersionRow = {
  id: string;
  prompt_id: string;
  version_number: string;
  change_description: string;
  content: string;
  system_prompt: string | null;
  models: string[];
  model_config: Record<string, unknown>;
  author: string | null;
  created_at: string;
  previous_version_id: string | null;
};

type PromptEventRow = {
  id: string;
  prompt_id: string;
  event_type: string;
  comment: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  created_by: string | null;
};

type ExportBundle = {
  prompts: PromptRow[];
  prompt_versions: PromptVersionRow[];
  prompt_events: PromptEventRow[];
};

type VerificationReport = {
  counts: Record<string, { supabase: number; convex: number }>;
  spotChecks: Array<{ table: string; id: string; status: 'ok' | 'missing' | 'mismatch' }>; 
  relationshipIssues: string[];
};

function getArgValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) {
    return undefined;
  }
  return process.argv[index + 1];
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

async function fetchAllRows<T>(
  supabaseUrl: string,
  supabaseKey: string,
  table: string
): Promise<T[]> {
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  let offset = 0;
  const rows: T[] = [];

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      throw new Error(`Failed to fetch ${table}: ${error.message}`);
    }

    if (data) {
      rows.push(...data);
    }

    if (!data || data.length < PAGE_SIZE) {
      break;
    }

    offset += PAGE_SIZE;
  }

  return rows;
}

async function writeJsonLines(filePath: string, rows: unknown[]): Promise<void> {
  const contents = rows.map((row) => JSON.stringify(row)).join('\n');
  await writeFile(filePath, `${contents}\n`, 'utf8');
}

function validateRelationships(bundle: ExportBundle): string[] {
  const issues: string[] = [];
  const promptIds = new Set(bundle.prompts.map((prompt) => prompt.id));
  const versionIds = new Set(bundle.prompt_versions.map((version) => version.id));

  bundle.prompt_versions.forEach((version) => {
    if (!promptIds.has(version.prompt_id)) {
      issues.push(`prompt_versions.${version.id} references missing prompt_id ${version.prompt_id}`);
    }
    if (version.previous_version_id && !versionIds.has(version.previous_version_id)) {
      issues.push(
        `prompt_versions.${version.id} references missing previous_version_id ${version.previous_version_id}`
      );
    }
  });

  bundle.prompt_events.forEach((event) => {
    if (!promptIds.has(event.prompt_id)) {
      issues.push(`prompt_events.${event.id} references missing prompt_id ${event.prompt_id}`);
    }
  });

  bundle.prompts.forEach((prompt) => {
    if (prompt.current_version_id && !versionIds.has(prompt.current_version_id)) {
      issues.push(
        `prompts.${prompt.id} references missing current_version_id ${prompt.current_version_id}`
      );
    }
  });

  return issues;
}

function selectSpotCheckIds(prompts: PromptRow[]): string[] {
  if (prompts.length === 0) {
    return [];
  }

  const sorted = [...prompts].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const first = sorted[0]?.id;
  const last = sorted[sorted.length - 1]?.id;
  const middle = sorted[Math.floor(sorted.length / 2)]?.id;

  return Array.from(new Set([first, middle, last].filter(Boolean))) as string[];
}

async function exportFromSupabase(outputDir: string): Promise<ExportBundle> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) are required.');
  }

  await mkdir(outputDir, { recursive: true });

  const prompts = await fetchAllRows<PromptRow>(supabaseUrl, supabaseKey, 'prompts');
  const promptVersions = await fetchAllRows<PromptVersionRow>(supabaseUrl, supabaseKey, 'prompt_versions');
  const promptEvents = await fetchAllRows<PromptEventRow>(supabaseUrl, supabaseKey, 'prompt_events');

  await writeJsonLines(path.join(outputDir, 'prompts.jsonl'), prompts);
  await writeJsonLines(path.join(outputDir, 'prompt_versions.jsonl'), promptVersions);
  await writeJsonLines(path.join(outputDir, 'prompt_events.jsonl'), promptEvents);

  const summary = {
    exportedAt: new Date().toISOString(),
    counts: {
      prompts: prompts.length,
      prompt_versions: promptVersions.length,
      prompt_events: promptEvents.length,
    },
    spotCheckPromptIds: selectSpotCheckIds(prompts),
  };

  await writeFile(path.join(outputDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');

  return {
    prompts,
    prompt_versions: promptVersions,
    prompt_events: promptEvents,
  };
}

async function loadJsonLines<T>(filePath: string): Promise<T[]> {
  const contents = await readFile(filePath, 'utf8');
  return contents
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as T);
}

function buildLookupById<T extends { id: string }>(rows: T[]): Map<string, T> {
  return new Map(rows.map((row) => [row.id, row]));
}

function compareSpotChecks(
  supabasePrompts: PromptRow[],
  convexPrompts: PromptRow[],
  spotCheckIds: string[]
): Array<{ table: string; id: string; status: 'ok' | 'missing' | 'mismatch' }> {
  const convexLookup = buildLookupById(convexPrompts);

  return spotCheckIds.map((id) => {
    const convexRecord = convexLookup.get(id);
    const supabaseRecord = supabasePrompts.find((prompt) => prompt.id === id);

    if (!supabaseRecord || !convexRecord) {
      return { table: 'prompts', id, status: 'missing' };
    }

    const matches = JSON.stringify(supabaseRecord) === JSON.stringify(convexRecord);
    return { table: 'prompts', id, status: matches ? 'ok' : 'mismatch' };
  });
}

async function verifyImport(
  outputDir: string,
  convexExportDir: string,
  spotCheckIds: string[]
): Promise<VerificationReport> {
  const supabasePrompts = await loadJsonLines<PromptRow>(path.join(outputDir, 'prompts.jsonl'));
  const supabaseVersions = await loadJsonLines<PromptVersionRow>(
    path.join(outputDir, 'prompt_versions.jsonl')
  );
  const supabaseEvents = await loadJsonLines<PromptEventRow>(
    path.join(outputDir, 'prompt_events.jsonl')
  );

  const convexPrompts = await loadJsonLines<PromptRow>(path.join(convexExportDir, 'prompts.jsonl'));
  const convexVersions = await loadJsonLines<PromptVersionRow>(
    path.join(convexExportDir, 'prompt_versions.jsonl')
  );
  const convexEvents = await loadJsonLines<PromptEventRow>(
    path.join(convexExportDir, 'prompt_events.jsonl')
  );

  const counts = {
    prompts: { supabase: supabasePrompts.length, convex: convexPrompts.length },
    prompt_versions: { supabase: supabaseVersions.length, convex: convexVersions.length },
    prompt_events: { supabase: supabaseEvents.length, convex: convexEvents.length },
  };

  const spotChecks = compareSpotChecks(supabasePrompts, convexPrompts, spotCheckIds);

  const relationshipIssues = [
    ...validateRelationships({
      prompts: convexPrompts,
      prompt_versions: convexVersions,
      prompt_events: convexEvents,
    }),
  ];

  return { counts, spotChecks, relationshipIssues };
}

async function main(): Promise<void> {
  const outputDir = getArgValue('--output-dir') || DEFAULT_OUTPUT_DIR;
  const convexExportDir = getArgValue('--convex-export-dir');
  const importTemplate = getArgValue('--import-template') || process.env.CONVEX_IMPORT_TEMPLATE;
  const shouldVerify = hasFlag('--verify');

  console.log('=== Supabase → Convex Migration ===');
  console.log(`Output directory: ${outputDir}`);

  const bundle = await exportFromSupabase(outputDir);
  console.log('Export complete.');
  console.log(`  prompts: ${bundle.prompts.length}`);
  console.log(`  prompt_versions: ${bundle.prompt_versions.length}`);
  console.log(`  prompt_events: ${bundle.prompt_events.length}`);

  const relationshipIssues = validateRelationships(bundle);
  if (relationshipIssues.length > 0) {
    console.log('\nRelationship issues detected in Supabase data:');
    relationshipIssues.forEach((issue) => console.log(`  - ${issue}`));
  } else {
    console.log('\n✓ Supabase relationships verified.');
  }

  if (importTemplate) {
    console.log('\n=== Running Convex import commands ===');
    TABLES.forEach((table) => {
      const filePath = path.join(outputDir, `${table}.jsonl`);
      const command = importTemplate.replace('{table}', table).replace('{file}', filePath);
      console.log(`\n$ ${command}`);
      execSync(command, { stdio: 'inherit' });
    });
  }

  if (shouldVerify) {
    if (!convexExportDir) {
      throw new Error('Use --convex-export-dir <path> when running --verify.');
    }

    const spotCheckIds = selectSpotCheckIds(bundle.prompts);
    const report = await verifyImport(outputDir, convexExportDir, spotCheckIds);

    console.log('\n=== Convex Import Verification ===');
    TABLES.forEach((table) => {
      const count = report.counts[table];
      console.log(`  ${table}: Supabase=${count.supabase} Convex=${count.convex}`);
    });

    console.log('\nSpot checks (prompt records):');
    report.spotChecks.forEach((check) => {
      console.log(`  ${check.id}: ${check.status}`);
    });

    if (report.relationshipIssues.length > 0) {
      console.log('\nRelationship issues detected in Convex export:');
      report.relationshipIssues.forEach((issue) => console.log(`  - ${issue}`));
    } else {
      console.log('\n✓ Convex relationships verified.');
    }
  } else {
    console.log(
      '\nNext steps: import the JSONL files into Convex, then rerun with --verify and --convex-export-dir.'
    );
    console.log(
      'Tip: pass --import-template "convex import --table {table} {file}" to automate imports if you have the CLI.'
    );
  }
}

main().catch((error) => {
  console.error(`\n✗ Migration failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
