import { describe, it, expect } from 'vitest';
import {
  promptStatusSchema,
  createPromptSchema,
  createVersionSchema,
  statusTransitionSchema,
  rollbackVersionSchema,
} from './validators';

describe('validators', () => {
  describe('promptStatusSchema', () => {
    it('should validate valid statuses', () => {
      expect(promptStatusSchema.parse('draft')).toBe('draft');
      expect(promptStatusSchema.parse('active')).toBe('active');
      expect(promptStatusSchema.parse('archived')).toBe('archived');
    });

    it('should reject invalid statuses', () => {
      expect(() => promptStatusSchema.parse('invalid')).toThrow();
      expect(() => promptStatusSchema.parse('')).toThrow();
    });
  });

  describe('createPromptSchema', () => {
    it('should validate valid prompt data', () => {
      const validData = {
        name: 'Test Prompt',
        purpose: 'Testing',
        content: 'Prompt content here',
      };
      expect(createPromptSchema.parse(validData)).toBeDefined();
    });

    it('should apply default values', () => {
      const data = {
        name: 'Test',
        purpose: 'Test',
        content: 'Content',
      };
      const result = createPromptSchema.parse(data);
      expect(result.tags).toEqual([]);
      expect(result.models).toEqual([]);
      expect(result.model_config).toEqual({});
    });

    it('should reject missing required fields', () => {
      expect(() => createPromptSchema.parse({ name: 'Test' })).toThrow();
      expect(() => createPromptSchema.parse({ purpose: 'Test' })).toThrow();
      expect(() => createPromptSchema.parse({ content: 'Test' })).toThrow();
    });

    it('should reject empty name', () => {
      expect(() =>
        createPromptSchema.parse({
          name: '',
          purpose: 'Test',
          content: 'Test',
        })
      ).toThrow();
    });

    it('should enforce max length on name', () => {
      expect(() =>
        createPromptSchema.parse({
          name: 'a'.repeat(256),
          purpose: 'Test',
          content: 'Test',
        })
      ).toThrow();
    });

    it('should enforce max length on description', () => {
      expect(() =>
        createPromptSchema.parse({
          name: 'Test',
          description: 'a'.repeat(2001),
          purpose: 'Test',
          content: 'Test',
        })
      ).toThrow();
    });

    it('should enforce max length on purpose', () => {
      expect(() =>
        createPromptSchema.parse({
          name: 'Test',
          purpose: 'a'.repeat(501),
          content: 'Test',
        })
      ).toThrow();
    });

    it('should enforce max length on content', () => {
      expect(() =>
        createPromptSchema.parse({
          name: 'Test',
          purpose: 'Test',
          content: 'a'.repeat(50001),
        })
      ).toThrow();
    });

    it('should enforce max array length on tags', () => {
      expect(() =>
        createPromptSchema.parse({
          name: 'Test',
          purpose: 'Test',
          content: 'Test',
          tags: Array(21).fill('tag'),
        })
      ).toThrow();
    });

    it('should enforce max string length on individual tags', () => {
      expect(() =>
        createPromptSchema.parse({
          name: 'Test',
          purpose: 'Test',
          content: 'Test',
          tags: ['a'.repeat(101)],
        })
      ).toThrow();
    });

    it('should accept valid data within limits', () => {
      const validData = {
        name: 'a'.repeat(255),
        description: 'a'.repeat(2000),
        purpose: 'a'.repeat(500),
        content: 'a'.repeat(50000),
        system_prompt: 'a'.repeat(10000),
        tags: Array(20).fill('tag'),
        models: Array(20).fill('model'),
        author: 'a'.repeat(255),
        owner: 'a'.repeat(255),
      };
      expect(createPromptSchema.parse(validData)).toBeDefined();
    });
  });

  describe('createVersionSchema', () => {
    it('should validate valid version data', () => {
      const validData = {
        bumpType: 'patch' as const,
        change_description: 'Fixed typo',
        content: 'Updated content',
      };
      expect(createVersionSchema.parse(validData)).toBeDefined();
    });

    it('should require change description', () => {
      expect(() =>
        createVersionSchema.parse({
          bumpType: 'patch',
          change_description: '',
          content: 'Content',
        })
      ).toThrow();
    });

    it('should validate bump type', () => {
      expect(() =>
        createVersionSchema.parse({
          bumpType: 'invalid',
          change_description: 'Test',
          content: 'Content',
        })
      ).toThrow();
    });
  });

  describe('statusTransitionSchema', () => {
    it('should validate status transitions', () => {
      const validData = {
        status: 'active' as const,
        comment: 'Approving for production',
      };
      expect(statusTransitionSchema.parse(validData)).toBeDefined();
    });

    it('should require comment', () => {
      expect(() =>
        statusTransitionSchema.parse({
          status: 'active',
          comment: '',
        })
      ).toThrow();
    });
  });

  describe('rollbackVersionSchema', () => {
    it('should validate rollback data', () => {
      const validData = {
        comment: 'Reverting due to bug',
      };
      expect(rollbackVersionSchema.parse(validData)).toBeDefined();
    });

    it('should require comment', () => {
      expect(() =>
        rollbackVersionSchema.parse({
          comment: '',
        })
      ).toThrow();
    });
  });
});
