-- Prompt Library Database Schema

-- Create enum for prompt status
CREATE TYPE prompt_status AS ENUM (
  'draft',
  'in_review',
  'testing',
  'active',
  'deprecated',
  'archived'
);

-- Create enum for event types
CREATE TYPE event_type AS ENUM (
  'created',
  'version_created',
  'status_changed',
  'metadata_updated',
  'rollback'
);

-- Prompts table
CREATE TABLE prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  purpose TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  status prompt_status NOT NULL DEFAULT 'draft',
  owner TEXT,
  current_version_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  search_tsv TSVECTOR
);

-- Prompt versions table
CREATE TABLE prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  version_number TEXT NOT NULL,
  change_description TEXT NOT NULL,
  content TEXT NOT NULL,
  system_prompt TEXT,
  models TEXT[] DEFAULT '{}',
  model_config JSONB DEFAULT '{}',
  author TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  previous_version_id UUID REFERENCES prompt_versions(id),
  UNIQUE(prompt_id, version_number)
);

-- Prompt events table (audit log)
CREATE TABLE prompt_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  event_type event_type NOT NULL,
  comment TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT
);

-- Add foreign key constraint for current_version_id (after prompt_versions is created)
ALTER TABLE prompts
  ADD CONSTRAINT fk_current_version
  FOREIGN KEY (current_version_id)
  REFERENCES prompt_versions(id)
  ON DELETE SET NULL;

-- Indexes for performance

-- Search index (GIN for full-text search)
CREATE INDEX idx_prompts_search_tsv ON prompts USING GIN(search_tsv);

-- Filter indexes
CREATE INDEX idx_prompts_status ON prompts(status);
CREATE INDEX idx_prompts_purpose ON prompts(purpose);
CREATE INDEX idx_prompts_tags ON prompts USING GIN(tags);
CREATE INDEX idx_prompts_created_at ON prompts(created_at DESC);
CREATE INDEX idx_prompts_updated_at ON prompts(updated_at DESC);

-- Version indexes
CREATE INDEX idx_prompt_versions_prompt_id ON prompt_versions(prompt_id);
CREATE INDEX idx_prompt_versions_created_at ON prompt_versions(created_at DESC);

-- Event indexes
CREATE INDEX idx_prompt_events_prompt_id ON prompt_events(prompt_id);
CREATE INDEX idx_prompt_events_created_at ON prompt_events(created_at DESC);

-- Function to update search_tsv automatically
CREATE OR REPLACE FUNCTION update_prompt_search_tsv()
RETURNS TRIGGER AS $$
DECLARE
  current_content TEXT;
  current_system_prompt TEXT;
BEGIN
  -- Get current version content if exists
  IF NEW.current_version_id IS NOT NULL THEN
    SELECT content, system_prompt INTO current_content, current_system_prompt
    FROM prompt_versions
    WHERE id = NEW.current_version_id;
  ELSE
    current_content := '';
    current_system_prompt := '';
  END IF;

  -- Update search vector with weighted components
  NEW.search_tsv := 
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.purpose, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(current_content, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(current_system_prompt, '')), 'D');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update search_tsv on insert or update
CREATE TRIGGER trigger_update_prompt_search_tsv
  BEFORE INSERT OR UPDATE OF name, description, purpose, tags, current_version_id
  ON prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_prompt_search_tsv();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on prompts
CREATE TRIGGER trigger_update_prompts_updated_at
  BEFORE UPDATE ON prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Helper function to search prompts
CREATE OR REPLACE FUNCTION search_prompts(
  search_query TEXT DEFAULT NULL,
  filter_status prompt_status[] DEFAULT NULL,
  filter_purpose TEXT DEFAULT NULL,
  filter_tags TEXT[] DEFAULT NULL,
  filter_models TEXT[] DEFAULT NULL,
  sort_by TEXT DEFAULT 'updated_at',
  sort_order TEXT DEFAULT 'DESC',
  page_limit INT DEFAULT 50,
  page_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  purpose TEXT,
  tags TEXT[],
  status prompt_status,
  owner TEXT,
  current_version_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.description,
    p.purpose,
    p.tags,
    p.status,
    p.owner,
    p.current_version_id,
    p.created_at,
    p.updated_at,
    CASE 
      WHEN search_query IS NOT NULL THEN ts_rank(p.search_tsv, plainto_tsquery('english', search_query))
      ELSE 0
    END AS rank
  FROM prompts p
  LEFT JOIN prompt_versions pv ON p.current_version_id = pv.id
  WHERE 
    (search_query IS NULL OR p.search_tsv @@ plainto_tsquery('english', search_query))
    AND (filter_status IS NULL OR p.status = ANY(filter_status))
    AND (filter_purpose IS NULL OR p.purpose = filter_purpose)
    AND (filter_tags IS NULL OR p.tags && filter_tags)
    AND (filter_models IS NULL OR pv.models && filter_models)
  ORDER BY
    CASE WHEN sort_by = 'name' AND sort_order = 'ASC' THEN p.name END ASC,
    CASE WHEN sort_by = 'name' AND sort_order = 'DESC' THEN p.name END DESC,
    CASE WHEN sort_by = 'created_at' AND sort_order = 'ASC' THEN p.created_at END ASC,
    CASE WHEN sort_by = 'created_at' AND sort_order = 'DESC' THEN p.created_at END DESC,
    CASE WHEN sort_by = 'updated_at' AND sort_order = 'ASC' THEN p.updated_at END ASC,
    CASE WHEN sort_by = 'updated_at' AND sort_order = 'DESC' THEN p.updated_at END DESC,
    CASE WHEN sort_by = 'rank' THEN rank END DESC,
    p.updated_at DESC
  LIMIT page_limit
  OFFSET page_offset;
END;
$$ LANGUAGE plpgsql;
