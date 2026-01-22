# Supabase Setup

## Instructions

1. Create a new project in Supabase
2. Run the SQL in `schema.sql` in the Supabase SQL Editor
3. Copy your project URL and service role key to `.env.local`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ADMIN_KEY=your_admin_key_for_write_operations
```

## Tables Created

- `prompts` - Main prompt metadata
- `prompt_versions` - Version history with semver
- `prompt_events` - Audit log for all changes

## Features

- Full-text search with GIN indexes
- Automatic search vector updates
- Weighted search ranking (name > description/purpose > tags > content)
- Filter by status, purpose, tags, models
- Efficient pagination and sorting
