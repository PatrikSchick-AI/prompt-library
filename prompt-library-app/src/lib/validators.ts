import { z } from 'zod';

// Status enum
export const PromptStatusSchema = z.enum([
  'draft',
  'in_review',
  'testing',
  'active',
  'deprecated',
  'archived',
]);

export const EventTypeSchema = z.enum([
  'created',
  'version_created',
  'status_changed',
  'metadata_updated',
  'rollback',
]);

// Semver validation
export const semverRegex = /^\d+\.\d+\.\d+$/;

export const semverSchema = z.string().regex(/^\d+\.\d+\.\d+$/, 'Must be valid semver (X.Y.Z)');

// Core schemas
export const promptStatusSchema = z.enum([
  'draft',
  'in_review',
  'testing',
  'active',
  'deprecated',
  'archived'
]);

export const createPromptSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  purpose: z.string().min(1),
  tags: z.array(z.string()).default([]),
  owner: z.string().optional(),
  content: z.string().min(1),
  system_prompt: z.string().optional(),
  models: z.array(z.string()).default([]),
  model_config: z.record(z.unknown()).optional().default({}),
  author: z.string().optional(),
});

export const UpdatePromptMetadataSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  purpose: z.string().optional(),
  tags: z.array(z.string()).optional(),
  owner: z.string().optional(),
});

export const CreateVersionSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  system_prompt: z.string().optional(),
  change_description: z.string().min(1, 'Change description is required'),
  bump_type: z.enum(['major', 'minor', 'patch']),
  models: z.array(z.string()).optional(),
  model_config: z.record(z.unknown()).optional(),
  author: z.string().optional(),
});

export const StatusChangeRequestSchema = z.object({
  status: z.enum(['draft', 'in_review', 'testing', 'active', 'deprecated', 'archived']),
  comment: z.string().min(1, 'Comment is required for status changes'),
});

export const RollbackRequestSchema = z.object({
  comment: z.string().min(1, 'Comment is required for rollback'),
});

export const SearchPromptsSchema = z.object({
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
  purpose: z.string().optional(),
  status: z.array(z.enum(['draft', 'in_review', 'testing', 'active', 'deprecated', 'archived'])).optional(),
  models: z.array(z.string()).optional(),
  sort: z.enum(['name', 'created_at', 'updated_at', 'rank']).optional().default('updated_at'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

export type SearchPromptsQuery = z.infer<typeof searchPromptsSchema>;

// Version schemas
export const createVersionSchema = z.object({
  bumpType: z.enum(['major', 'minor', 'patch']),
  change_description: z.string().min(1, 'Change description is required'),
  content: z.string().min(1, 'Content is required'),
  system_prompt: z.string().optional(),
  models: z.array(z.string()).default([]),
  model_config: z.record(z.unknown()).default({}),
  author: z.string().optional(),
});

export type CreateVersionInput = z.infer<typeof createVersionSchema>;

export const rollbackVersionSchema = z.object({
  comment: z.string().min(1, 'Rollback comment is required'),
  author: z.string().optional(),
});

export type RollbackVersionInput = z.infer<typeof rollbackVersionSchema>;

// Status transition
export const statusTransitionSchema = z.object({
  status: promptStatusSchema,
  comment: z.string().min(1, 'Comment is required for status changes'),
  author: z.string().optional(),
});

export type StatusTransitionInput = z.infer<typeof statusTransitionSchema>;
