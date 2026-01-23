export interface MarkdownPromptInput {
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

interface MarkdownParseOptions {
  defaultPurpose: string;
  defaultTags?: string[];
}

interface MarkdownPromptMetadata {
  description?: string;
  purpose?: string;
  tags?: string[];
  author?: string;
  systemPrompt?: string;
  models?: string[];
}

const FIELD_LABELS = {
  description: ['Description', 'Summary'],
  purpose: ['Purpose'],
  tags: ['Tags', 'Tag'],
  author: ['Author', 'Contributor'],
  systemPrompt: ['System Prompt', 'System'],
  models: ['Models', 'Model'],
  content: ['Prompt', 'Content'],
};

export function parseAndMapMarkdownPrompts(
  markdownText: string,
  options: MarkdownParseOptions
): MarkdownPromptInput[] {
  const sections = splitMarkdownSections(markdownText);
  const results: MarkdownPromptInput[] = [];

  for (const section of sections) {
    const metadata = extractMetadata(section.body);
    const content = extractContent(section.body, metadata);

    if (!section.title || !content) {
      continue;
    }

    const tags = mergeTags(options.defaultTags ?? [], metadata.tags ?? []);

    results.push({
      name: section.title,
      description: metadata.description,
      purpose: metadata.purpose || options.defaultPurpose,
      tags,
      content,
      system_prompt: metadata.systemPrompt,
      models: metadata.models,
      author: metadata.author,
    });
  }

  return results;
}

function splitMarkdownSections(markdownText: string): Array<{ title: string; body: string }> {
  const headingRegex = /^#{2,3}\s+(.+)$/gm;
  const matches = Array.from(markdownText.matchAll(headingRegex));

  if (matches.length === 0) {
    return [];
  }

  const sections: Array<{ title: string; body: string }> = [];

  matches.forEach((match, index) => {
    const title = match[1]?.trim();
    const startIndex = (match.index ?? 0) + match[0].length;
    const endIndex = matches[index + 1]?.index ?? markdownText.length;
    const body = markdownText.slice(startIndex, endIndex).trim();

    if (title) {
      sections.push({ title, body });
    }
  });

  return sections;
}

function extractMetadata(body: string): MarkdownPromptMetadata {
  const description = extractField(body, FIELD_LABELS.description);
  const purpose = extractField(body, FIELD_LABELS.purpose);
  const tagsValue = extractField(body, FIELD_LABELS.tags);
  const author = extractField(body, FIELD_LABELS.author);
  const systemPrompt = extractField(body, FIELD_LABELS.systemPrompt);
  const modelsValue = extractField(body, FIELD_LABELS.models);

  return {
    description,
    purpose,
    tags: tagsValue ? parseList(tagsValue) : undefined,
    author,
    systemPrompt,
    models: modelsValue ? parseList(modelsValue) : undefined,
  };
}

function extractContent(body: string, metadata: MarkdownPromptMetadata): string | undefined {
  const codeBlockMatch = body.match(/```[^\n]*\n([\s\S]*?)\n```/);
  if (codeBlockMatch?.[1]) {
    return codeBlockMatch[1].trim();
  }

  const inlineContent = extractField(body, FIELD_LABELS.content);
  if (inlineContent) {
    return inlineContent.trim();
  }

  const strippedBody = stripMetadataLines(body, metadata);
  return strippedBody.trim() || undefined;
}

function extractField(body: string, labels: string[]): string | undefined {
  const labelPattern = labels.map(escapeRegex).join('|');
  const regex = new RegExp(
    `^\\s*(?:[-*]\\s*)?(?:\\*\\*|__)?(?:${labelPattern})(?:\\*\\*|__)?\\s*:\\s*(.+)$`,
    'im'
  );
  const match = body.match(regex);
  return match?.[1]?.trim();
}

function stripMetadataLines(body: string, metadata: MarkdownPromptMetadata): string {
  const ignoredLabels = new Set(
    Object.values(FIELD_LABELS)
      .flat()
      .map((label) => label.toLowerCase())
  );

  return body
    .split('\n')
    .filter((line) => {
      const normalized = line.replace(/\*|_/g, '').trim().toLowerCase();
      if (!normalized) {
        return false;
      }

      const labelMatch = normalized.match(/^[-*]?\s*([^:]+):/);
      if (labelMatch) {
        const label = labelMatch[1]?.trim();
        if (label && ignoredLabels.has(label)) {
          return false;
        }
      }

      if (metadata.systemPrompt && normalized.includes(metadata.systemPrompt.toLowerCase())) {
        return false;
      }

      return true;
    })
    .join('\n');
}

function parseList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function mergeTags(defaultTags: string[], extraTags: string[]): string[] {
  const tags = new Set<string>();

  defaultTags.forEach((tag) => {
    if (tag) {
      tags.add(tag);
    }
  });

  extraTags.forEach((tag) => {
    if (tag) {
      tags.add(tag);
    }
  });

  return Array.from(tags);
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
