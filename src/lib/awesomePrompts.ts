import { z } from 'zod';

// Schema for awesome-chatgpt-prompts CSV row
export const AwesomePromptRowSchema = z.object({
  act: z.string(),
  prompt: z.string(),
  for_devs: z.union([z.boolean(), z.string()]).optional(),
  contributor: z.string().optional(),
});

export type AwesomePromptRow = z.infer<typeof AwesomePromptRowSchema>;

// Schema for our prompt library format
export interface PromptLibraryInput {
  name: string;
  description?: string;
  purpose: string;
  tags: string[];
  content: string;
  author?: string;
}

/**
 * Parse CSV text into rows
 * Handles quoted fields with commas and newlines
 */
export function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.trim().split('\n');
  if (lines.length === 0) return [];

  // Parse header
  const header = parseCSVLine(lines[0]);
  
  const rows: Record<string, string>[] = [];
  let currentLine = '';
  let inQuotes = false;
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    currentLine += (currentLine ? '\n' : '') + line;
    
    // Count quotes to determine if we're inside a quoted field
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      }
    }
    
    // If we're not in quotes, we have a complete row
    if (!inQuotes) {
      const values = parseCSVLine(currentLine);
      if (values.length === header.length) {
        const row: Record<string, string> = {};
        header.forEach((key, index) => {
          row[key] = values[index] || '';
        });
        rows.push(row);
      }
      currentLine = '';
    }
  }
  
  return rows;
}

/**
 * Parse a single CSV line, handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add last field
  values.push(current.trim());
  
  return values;
}

/**
 * Validate and parse an awesome prompt row
 */
export function parseAwesomePromptRow(row: Record<string, string>): AwesomePromptRow | null {
  try {
    // Normalize for_devs field
    const normalized = {
      ...row,
      for_devs: row.for_devs === 'TRUE' || row.for_devs === 'true' || row.for_devs === '1',
    };
    
    return AwesomePromptRowSchema.parse(normalized);
  } catch {
    return null;
  }
}

/**
 * Map an awesome prompt to our prompt library format
 */
export function mapAwesomePromptToLibrary(
  awesomePrompt: AwesomePromptRow
): PromptLibraryInput {
  const tags = ['awesome-chatgpt-prompts', 'imported'];
  
  // Add for-devs tag if applicable
  if (awesomePrompt.for_devs === true || awesomePrompt.for_devs === 'TRUE') {
    tags.push('for-devs');
  }
  
  return {
    name: awesomePrompt.act,
    description: `Imported from awesome-chatgpt-prompts`,
    purpose: 'awesome-chatgpt-prompts',
    tags,
    content: awesomePrompt.prompt,
    author: awesomePrompt.contributor,
  };
}

/**
 * Parse CSV text and map all valid rows to prompt library format
 */
export function parseAndMapAwesomePrompts(csvText: string): PromptLibraryInput[] {
  const rows = parseCSV(csvText);
  const results: PromptLibraryInput[] = [];
  
  for (const row of rows) {
    const parsed = parseAwesomePromptRow(row);
    if (parsed && parsed.act && parsed.prompt) {
      results.push(mapAwesomePromptToLibrary(parsed));
    }
  }
  
  return results;
}
