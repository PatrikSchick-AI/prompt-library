# Deployment Guide

## Vercel Deployment

### Prerequisites

1. Supabase project set up with schema
2. Vercel account
3. Repository pushed to GitHub (optional but recommended)

### Step-by-Step Deployment

#### 1. Prepare Supabase

1. Create a new Supabase project at https://supabase.com
2. Go to SQL Editor and run the schema from `supabase/schema.sql`
3. Note down your credentials:
   - Project URL (from Settings → API)
   - Anon/Public key (from Settings → API)
   - Service Role key (from Settings → API - keep this secret!)

#### 2. Deploy to Vercel

**Option A: Via Vercel Dashboard (Recommended)**

1. Go to https://vercel.com/new
2. Import your repository (or upload the `prompt-library-app` folder)
3. Configure build settings:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. Add Environment Variables:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ADMIN_KEY=your_secure_admin_key_here
   ```

5. Click "Deploy"

**Option B: Via Vercel CLI**

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login:
   ```bash
   vercel login
   ```

3. Deploy from project directory:
   ```bash
   cd prompt-library-app
   vercel
   ```

4. Follow prompts, then add environment variables:
   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   vercel env add ADMIN_KEY
   ```

5. Deploy to production:
   ```bash
   vercel --prod
   ```

#### 3. Verify Deployment

1. Visit your deployed URL
2. Test API endpoints:
   - `GET /api/prompts` - should return empty array
   - Check browser console for errors

3. Test write operation with admin key:
   ```bash
   curl -X POST https://your-app.vercel.app/api/prompts \
     -H "Content-Type: application/json" \
     -H "X-Admin-Key: your_admin_key" \
     -d '{
       "name": "Test Prompt",
       "purpose": "Testing",
       "content": "This is a test prompt"
     }'
   ```

### Environment Variables Reference

| Variable | Required | Description | Where to Use |
|----------|----------|-------------|--------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL | Client & Server |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key (server-only) | Server only |
| `ADMIN_KEY` | Yes | Shared secret for write operations | Server only |
| `VITE_ADMIN_KEY` | Optional | Admin key for client (if needed) | Client only |

**Security Notes:**
- `SUPABASE_SERVICE_ROLE_KEY` should **never** be exposed to the client
- `ADMIN_KEY` protects all write operations (POST/PUT/DELETE)
- Use a strong, unique key for `ADMIN_KEY` (e.g., `openssl rand -base64 32`)
- For production, consider using Vercel's encrypted environment variables

### Post-Deployment

1. **Update DNS** (if using custom domain)
   - Add domain in Vercel dashboard
   - Update DNS records as instructed

2. **Monitor Logs**
   - Check Vercel function logs for errors
   - Monitor Supabase dashboard for query performance

3. **Test All Features**
   - Create prompt
   - Create version
   - Change status
   - Rollback
   - Search and filter

### Troubleshooting

**Issue: 404 on API routes**
- Check `vercel.json` is present in project root
- Verify API functions are in `api/` directory
- Check Vercel deployment logs

**Issue: CORS errors**
- Verify CORS headers in `api/lib/middleware.ts`
- Check browser console for specific CORS error

**Issue: Database connection errors**
- Verify `VITE_SUPABASE_URL` is correct
- Check `SUPABASE_SERVICE_ROLE_KEY` is valid
- Confirm Supabase project is active

**Issue: Unauthorized errors on write operations**
- Verify `X-Admin-Key` header is being sent
- Confirm `ADMIN_KEY` environment variable is set in Vercel
- Check key matches between client and server

### Continuous Deployment

Vercel automatically deploys on git push when connected to a repository:

1. Push changes to `main` branch → Production deployment
2. Push to other branches → Preview deployment
3. Pull requests → Automatic preview deployments

### Local Development with Production Data

If you want to test locally with production Supabase:

```bash
# .env.local
VITE_SUPABASE_URL=https://your-production.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_key
ADMIN_KEY=your_production_admin_key
VITE_ADMIN_KEY=your_production_admin_key
```

**Warning:** Be careful when testing with production data!

### Scaling Considerations

- Vercel Functions have a 10s timeout by default (configurable)
- Supabase free tier has usage limits
- Consider caching for high-traffic scenarios
- Monitor function execution time in Vercel dashboard

### Backup Strategy

1. **Database Backups**
   - Supabase Pro includes automated backups
   - For manual backups: use Supabase Studio → Database → Backups
   - Export data periodically: `pg_dump` via Supabase connection string

2. **Code Backups**
   - Use Git for version control
   - Tag releases: `git tag v1.0.0`
   - Keep deployment history in Vercel dashboard

### Next Steps

- Set up monitoring (e.g., Sentry)
- Configure custom domain
- Add analytics (e.g., Vercel Analytics)
- Set up CI/CD with tests
- Configure production-specific environment variables
