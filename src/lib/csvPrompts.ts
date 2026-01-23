export interface CSVPromptInput {
  name: string;
  description?: string;
  purpose: string;
  tags: string[];
  content: string;
  system_prompt?: string;
  models?: string[];
  author?: string;
  owner?: string;
}

interface CSVParseOptions {
  defaultPurpose: string;
  defaultTags?: string[];
}

export function parseAndMapCSVPrompts(
  csvText: string,
  options: CSVParseOptions
): CSVPromptInput[] {
  const lines = csvText.trim().split('\n');
  const results: CSVPromptInput[] = [];

  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse CSV line (basic parsing, assuming no escaped commas in content)
    const parts = line.split(',');
    if (parts.length < 2) continue;

    const act = parts[0]?.replace(/^"|"$/g, '').trim();
    const prompt = parts.slice(1, -1).join(',').replace(/^"|"$/g, '').trim();
    const forDevs = parts[parts.length - 1]?.replace(/^"|"$/g, '').trim().toLowerCase() === 'true';

    if (!act || !prompt) continue;

    // Create tags based on whether it's for developers
    const tags = [...(options.defaultTags || [])];
    if (forDevs) {
      tags.push('developer', 'technical');
    } else {
      tags.push('general');
    }

    const promptInput: CSVPromptInput = {
      name: act,
      description: `${act} - ChatGPT prompt`,
      purpose: options.defaultPurpose,
      tags: [...new Set(tags)], // Remove duplicates
      content: prompt,
      system_prompt: undefined,
      models: ['gpt-3.5-turbo', 'gpt-4'],
      author: 'Awesome ChatGPT Prompts',
      owner: 'awesome-chatgpt-prompts',
    };

    results.push(promptInput);
  }

  return results;
}