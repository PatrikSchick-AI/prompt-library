# Prompt Library

A centralized, versioned prompt management system for AI applications.

## Features

- ✅ Full CRUD operations for prompts
- ✅ Semantic versioning with automatic bumping
- ✅ Status lifecycle management (draft → testing → active)
- ✅ Full-text search with PostgreSQL GIN indexes
- ✅ Tag and purpose-based filtering
- ✅ Version history and rollback
- ✅ Activity logging and audit trail
- ✅ Admin key protection for write operations

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4
- **Backend**: Vercel Serverless Functions (TypeScript)
- **Database**: Supabase (PostgreSQL)
- **Validation**: Zod
- **Testing**: Vitest + React Testing Library

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- Vercel account (for deployment)

### Local Development

1. **Clone and install dependencies**

```bash
cd prompt-library-app
npm install
```

2. **Set up Supabase**

- Create a new Supabase project
- Run the SQL schema from `supabase/schema.sql` in the SQL Editor
- Copy your project URL and keys

3. **Configure environment variables**

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your values:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ADMIN_KEY=your_secure_admin_key
VITE_ADMIN_KEY=your_secure_admin_key
```

4. **Run development server**

```bash
npm run dev
```

Visit `http://localhost:5173`

### Testing

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui
```

### Building for Production

```bash
npm run build
npm run preview
```

## Deployment

### Vercel Deployment

1. **Install Vercel CLI**

```bash
npm i -g vercel
```

2. **Deploy**

```bash
vercel
```

3. **Set environment variables in Vercel**

Go to your project settings and add:

- `VITE_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_KEY`

4. **Deploy to production**

```bash
vercel --prod
```

## API Endpoints

### Prompts

- `GET /api/prompts` - List/search prompts
- `POST /api/prompts` - Create prompt (requires admin key)
- `GET /api/prompts/:id` - Get prompt details
- `PUT /api/prompts/:id` - Update prompt (requires admin key)
- `DELETE /api/prompts/:id` - Delete prompt (requires admin key)

### Versions

- `GET /api/prompts/:id/versions` - List all versions
- `GET /api/prompts/:id/versions/:version` - Get specific version
- `POST /api/prompts/:id/versions/:version/rollback` - Rollback (requires admin key)

### Status

- `POST /api/prompts/:id/status` - Change status (requires admin key)

### Metadata

- `GET /api/tags` - Get all tags with usage counts
- `GET /api/purposes` - Get all purposes with usage counts

## Security

- **Read operations**: Public (anyone can read prompts)
- **Write operations**: Protected by `X-Admin-Key` header
- Set a strong `ADMIN_KEY` in your environment variables
- Keep `SUPABASE_SERVICE_ROLE_KEY` secret (server-side only)

## Architecture

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       ├─────────────► React UI (public read)
       │
       └─────────────► Vercel API (X-Admin-Key for writes)
                               │
                               ▼
                        Supabase Postgres
```

## Project Structure

```
prompt-library-app/
├── api/                    # Vercel serverless functions
│   ├── lib/               # Shared API utilities
│   ├── prompts.ts         # Main prompts CRUD
│   ├── prompts/[id].ts    # Single prompt operations
│   └── ...                # Version, status, tags endpoints
├── src/
│   ├── components/        # React components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities (API client, validators, semver)
│   ├── pages/            # Page components
│   ├── types/            # TypeScript types
│   └── test/             # Test setup
├── supabase/
│   └── schema.sql        # Database schema
└── vercel.json           # Vercel configuration
```

## Development Workflow

1. Create/update prompts via UI
2. All changes are versioned
3. Test prompts before activating
4. Change status to `active` for production use
5. Rollback if needed

## Roadmap

- [ ] MCP server integration
- [ ] Bulk operations
- [ ] Export/import functionality
- [ ] Advanced version diff view
- [ ] Prompt templates
- [ ] Collaboration features

## License

MIT
