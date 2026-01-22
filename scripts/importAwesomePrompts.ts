#!/usr/bin/env tsx

import { parseAndMapAwesomePrompts } from '../src/lib/awesomePrompts';

const AWESOME_PROMPTS_CSV_URL = 'https://raw.githubusercontent.com/f/awesome-chatgpt-prompts/main/prompts.csv';
const API_BASE_URL = process.env.PROMPT_LIBRARY_API_BASE_URL || 'http://localhost:3000/api';
const CONCURRENCY_LIMIT = 5;
const PURPOSE_FILTER = 'awesome-chatgpt-prompts';

interface PromptListItem {
  id: string;
  name: string;
  purpose: string;
}

interface PaginatedResponse {
  data: PromptListItem[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

/**
 * Fetch CSV from GitHub
 */
async function fetchCSV(): Promise<string> {
  console.log(`Fetching CSV from ${AWESOME_PROMPTS_CSV_URL}...`);
  const response = await fetch(AWESOME_PROMPTS_CSV_URL);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch CSV: ${response.statusText}`);
  }
  
  const text = await response.text();
  console.log(`✓ Fetched CSV (${text.length} bytes)`);
  return text;
}

/**
 * Fetch all existing prompts with the given purpose
 */
async function fetchExistingPrompts(): Promise<Set<string>> {
  console.log(`\nFetching existing prompts with purpose="${PURPOSE_FILTER}"...`);
  const existingNames = new Set<string>();
  let offset = 0;
  const limit = 100;
  
  while (true) {
    const url = `${API_BASE_URL}/prompts?purpose=${encodeURIComponent(PURPOSE_FILTER)}&limit=${limit}&offset=${offset}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch existing prompts: ${response.statusText}`);
    }
    
    const result = await response.json() as PaginatedResponse;
    
    result.data.forEach((prompt) => {
      existingNames.add(prompt.name);
    });
    
    console.log(`  Fetched ${result.data.length} prompts (offset ${offset})`);
    
    if (result.data.length < limit) {
      break;
    }
    
    offset += limit;
  }
  
  console.log(`✓ Found ${existingNames.size} existing prompts`);
  return existingNames;
}

/**
 * Create a single prompt
 */
async function createPrompt(prompt: ReturnType<typeof parseAndMapAwesomePrompts>[0]): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/prompts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(prompt),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' })) as { error?: string };
      console.error(`  ✗ Failed to create "${prompt.name}": ${error.error || response.statusText}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`  ✗ Failed to create "${prompt.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

/**
 * Create prompts with limited concurrency
 */
async function createPromptsWithConcurrency(
  prompts: ReturnType<typeof parseAndMapAwesomePrompts>,
  concurrency: number
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;
  let index = 0;
  
  const workers = Array(concurrency).fill(null).map(async () => {
    while (index < prompts.length) {
      const currentIndex = index++;
      const prompt = prompts[currentIndex];
      
      console.log(`[${currentIndex + 1}/${prompts.length}] Creating "${prompt.name}"...`);
      const result = await createPrompt(prompt);
      
      if (result) {
        success++;
        console.log(`  ✓ Created "${prompt.name}"`);
      } else {
        failed++;
      }
    }
  });
  
  await Promise.all(workers);
  
  return { success, failed };
}

/**
 * Main import function
 */
async function main() {
  console.log('=== Awesome ChatGPT Prompts Importer ===\n');
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Concurrency: ${CONCURRENCY_LIMIT}`);
  console.log(`Purpose filter: ${PURPOSE_FILTER}\n`);
  
  try {
    // Step 1: Fetch CSV
    const csvText = await fetchCSV();
    
    // Step 2: Parse and map prompts
    console.log('\nParsing CSV...');
    const allPrompts = parseAndMapAwesomePrompts(csvText);
    console.log(`✓ Parsed ${allPrompts.length} prompts`);
    
    if (allPrompts.length === 0) {
      console.log('\n⚠ No prompts found in CSV');
      return;
    }
    
    // Step 3: Fetch existing prompts
    const existingNames = await fetchExistingPrompts();
    
    // Step 4: Filter out existing prompts
    const newPrompts = allPrompts.filter((prompt) => !existingNames.has(prompt.name));
    console.log(`\n${newPrompts.length} new prompts to import (${allPrompts.length - newPrompts.length} already exist)`);
    
    if (newPrompts.length === 0) {
      console.log('\n✓ All prompts already imported!');
      return;
    }
    
    // Step 5: Create new prompts
    console.log(`\nCreating ${newPrompts.length} prompts with concurrency ${CONCURRENCY_LIMIT}...\n`);
    const { success, failed } = await createPromptsWithConcurrency(newPrompts, CONCURRENCY_LIMIT);
    
    // Step 6: Summary
    console.log('\n=== Import Summary ===');
    console.log(`Total prompts in CSV: ${allPrompts.length}`);
    console.log(`Already existed: ${allPrompts.length - newPrompts.length}`);
    console.log(`Successfully created: ${success}`);
    console.log(`Failed: ${failed}`);
    console.log('\n✓ Import complete!');
    
    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('\n✗ Import failed:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
