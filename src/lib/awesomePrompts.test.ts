import { describe, it, expect } from 'vitest';
import {
  parseCSV,
  parseAwesomePromptRow,
  mapAwesomePromptToLibrary,
  parseAndMapAwesomePrompts,
  type AwesomePromptRow,
} from './awesomePrompts';

describe('awesomePrompts', () => {
  describe('parseCSV', () => {
    it('should parse simple CSV', () => {
      const csv = `act,prompt,for_devs
Linux Terminal,I want you to act as a linux terminal,FALSE
JavaScript Console,I want you to act as a javascript console,TRUE`;

      const result = parseCSV(csv);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        act: 'Linux Terminal',
        prompt: 'I want you to act as a linux terminal',
        for_devs: 'FALSE',
      });
      expect(result[1]).toEqual({
        act: 'JavaScript Console',
        prompt: 'I want you to act as a javascript console',
        for_devs: 'TRUE',
      });
    });

    it('should handle quoted fields with commas', () => {
      const csv = `act,prompt
"Act, with comma","Prompt, with, commas"`;

      const result = parseCSV(csv);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        act: 'Act, with comma',
        prompt: 'Prompt, with, commas',
      });
    });

    it('should handle quoted fields with newlines', () => {
      const csv = `act,prompt
"Multi
line
act","Multi
line
prompt"`;

      const result = parseCSV(csv);
      
      expect(result).toHaveLength(1);
      expect(result[0].act).toBe('Multi\nline\nact');
      expect(result[0].prompt).toBe('Multi\nline\nprompt');
    });

    it('should handle escaped quotes', () => {
      const csv = `act,prompt
"Act with ""quotes""","Prompt with ""quotes"""`;

      const result = parseCSV(csv);
      
      expect(result).toHaveLength(1);
      expect(result[0].act).toBe('Act with "quotes"');
      expect(result[0].prompt).toBe('Prompt with "quotes"');
    });

    it('should handle empty CSV', () => {
      const result = parseCSV('');
      expect(result).toEqual([]);
    });

    it('should handle CSV with only header', () => {
      const csv = 'act,prompt,for_devs';
      const result = parseCSV(csv);
      expect(result).toEqual([]);
    });
  });

  describe('parseAwesomePromptRow', () => {
    it('should parse valid row', () => {
      const row = {
        act: 'Linux Terminal',
        prompt: 'I want you to act as a linux terminal',
        for_devs: 'FALSE',
        contributor: 'john',
      };

      const result = parseAwesomePromptRow(row);
      
      expect(result).toEqual({
        act: 'Linux Terminal',
        prompt: 'I want you to act as a linux terminal',
        for_devs: false,
        contributor: 'john',
      });
    });

    it('should normalize for_devs TRUE string to boolean', () => {
      const row = {
        act: 'Test',
        prompt: 'Test prompt',
        for_devs: 'TRUE',
      };

      const result = parseAwesomePromptRow(row);
      
      expect(result?.for_devs).toBe(true);
    });

    it('should normalize for_devs true string to boolean', () => {
      const row = {
        act: 'Test',
        prompt: 'Test prompt',
        for_devs: 'true',
      };

      const result = parseAwesomePromptRow(row);
      
      expect(result?.for_devs).toBe(true);
    });

    it('should normalize for_devs 1 to boolean', () => {
      const row = {
        act: 'Test',
        prompt: 'Test prompt',
        for_devs: '1',
      };

      const result = parseAwesomePromptRow(row);
      
      expect(result?.for_devs).toBe(true);
    });

    it('should handle missing optional fields', () => {
      const row = {
        act: 'Test',
        prompt: 'Test prompt',
      };

      const result = parseAwesomePromptRow(row);
      
      expect(result).toEqual({
        act: 'Test',
        prompt: 'Test prompt',
        for_devs: false,
      });
    });

    it('should return null for invalid row', () => {
      const row = {
        // Missing required fields
        invalid: 'data',
      };

      const result = parseAwesomePromptRow(row);
      
      expect(result).toBeNull();
    });
  });

  describe('mapAwesomePromptToLibrary', () => {
    it('should map basic prompt', () => {
      const awesomePrompt: AwesomePromptRow = {
        act: 'Linux Terminal',
        prompt: 'I want you to act as a linux terminal',
        for_devs: false,
      };

      const result = mapAwesomePromptToLibrary(awesomePrompt);
      
      expect(result).toEqual({
        name: 'Linux Terminal',
        description: 'Imported from awesome-chatgpt-prompts',
        purpose: 'awesome-chatgpt-prompts',
        tags: ['awesome-chatgpt-prompts', 'imported'],
        content: 'I want you to act as a linux terminal',
        author: undefined,
      });
    });

    it('should add for-devs tag when applicable', () => {
      const awesomePrompt: AwesomePromptRow = {
        act: 'JavaScript Console',
        prompt: 'I want you to act as a javascript console',
        for_devs: true,
      };

      const result = mapAwesomePromptToLibrary(awesomePrompt);
      
      expect(result.tags).toContain('for-devs');
      expect(result.tags).toEqual(['awesome-chatgpt-prompts', 'imported', 'for-devs']);
    });

    it('should add for-devs tag for TRUE string', () => {
      const awesomePrompt: AwesomePromptRow = {
        act: 'Test',
        prompt: 'Test prompt',
        for_devs: 'TRUE',
      };

      const result = mapAwesomePromptToLibrary(awesomePrompt);
      
      expect(result.tags).toContain('for-devs');
    });

    it('should include contributor as author', () => {
      const awesomePrompt: AwesomePromptRow = {
        act: 'Test',
        prompt: 'Test prompt',
        contributor: 'john-doe',
      };

      const result = mapAwesomePromptToLibrary(awesomePrompt);
      
      expect(result.author).toBe('john-doe');
    });
  });

  describe('parseAndMapAwesomePrompts', () => {
    it('should parse and map complete CSV', () => {
      const csv = `act,prompt,for_devs,contributor
Linux Terminal,I want you to act as a linux terminal,FALSE,user1
JavaScript Console,I want you to act as a javascript console,TRUE,user2`;

      const result = parseAndMapAwesomePrompts(csv);
      
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Linux Terminal');
      expect(result[0].tags).toEqual(['awesome-chatgpt-prompts', 'imported']);
      expect(result[1].name).toBe('JavaScript Console');
      expect(result[1].tags).toContain('for-devs');
    });

    it('should skip invalid rows', () => {
      const csv = `act,prompt,for_devs
Valid Act,Valid prompt,FALSE
,Missing act,FALSE
Valid Act 2,Valid prompt 2,TRUE`;

      const result = parseAndMapAwesomePrompts(csv);
      
      // Should only include rows with both act and prompt
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Valid Act');
      expect(result[1].name).toBe('Valid Act 2');
    });

    it('should handle empty CSV', () => {
      const result = parseAndMapAwesomePrompts('');
      expect(result).toEqual([]);
    });

    it('should handle CSV with complex content', () => {
      const csv = `act,prompt
"Act with, comma","Prompt with ""quotes"" and
newlines"`;

      const result = parseAndMapAwesomePrompts(csv);
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Act with, comma');
      expect(result[0].content).toContain('quotes');
      expect(result[0].content).toContain('\n');
    });
  });
});
