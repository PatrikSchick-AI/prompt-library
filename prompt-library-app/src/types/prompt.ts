// Prompt Library Types

export type PromptStatus = 
  | 'draft'
  | 'in_review'
  | 'testing'
  | 'active'
  | 'deprecated'
  | 'archived';

export type EventType = 
  | 'created'
  | 'version_created'
  | 'status_changed'
  | 'metadata_updated'
  | 'rollback';

export type VersionBumpType = 'major' | 'minor' | 'patch';

export interface Prompt {
  id: string;
  name: string;
  description: string | null;
  purpose: string;
  tags: string[];
  status: PromptStatus;
  owner: string | null;
  current_version_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PromptVersion {
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
}

export interface PromptEvent {
  id: string;
  prompt_id: string;
  event_type: EventType;
  comment: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  created_by: string | null;
}

export type PromptStatus = 
  | 'draft'
  | 'in_review'
  | 'testing'
  | 'active'
  | 'deprecated'
  | 'archived';

export type EventType = 
  | 'created'
  | 'version_created'
  | 'status_changed'
  | 'metadata_updated'
  | 'rollback';

export interface Prompt {
  id: string;
  name: string;
  description?: string;
  purpose: string;
  tags: string[];
  status: PromptStatus;
  owner?: string;
  current_version_id?: string;
  created_at: string;
  updated_at: string;
}

export interface PromptVersion {
  id: string;
  prompt_id: string;
  version_number: string;
  change_description: string;
  content: string;
  system_prompt?: string;
  models: string[];
  model_config: Record<string, unknown>;
  author?: string;
  created_at: string;
  previous_version_id?: string;
}

export interface PromptEvent {
  id: string;
  prompt_id: string;
  event_type: EventType;
  comment?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  created_by?: string;
}

export interface PromptWithVersion extends Prompt {
  current_version?: PromptVersion;
  version_count?: number;
}

export interface PromptListItem {
  id: string;
  name: string;
  description: string | null;
  purpose: string;
  tags: string[];
  status: PromptStatus;
  owner: string | null;
  created_at: string;
  updated_at: string;
  current_version?: {
    version_number: string;
    models: string[];
  };
}

export interface PromptSearchResult extends Prompt {
  rank?: number;
}

export interface Tag {
  name: string;
  usage_count: number;
}

export interface Purpose {
  name: string;
  description: string;
  usage_count: number;
}
