# Deployment Guide

## Vercel Deployment

### Prerequisites

1. Convex project with HTTP actions enabled
2. Vercel account
3. Repository pushed to GitHub (optional but recommended)

### Step-by-Step Deployment

#### 1. Prepare Convex

1. Create a new Convex project at https://convex.dev
2. Implement HTTP actions that mirror the Vercel API routes (e.g. `/api/prompts`, `/api/prompts/:id`)
3. Note down your Convex deployment site URL (e.g. `https://your-deployment.convex.site/api`)
4. (Optional) Create a shared secret for Vercel → Convex requests

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
   CONVEX_HTTP_ACTIONS_URL=https://your-deployment.convex.site/api
   CONVEX_HTTP_ACTIONS_SECRET=your_optional_shared_secret
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
   vercel env add CONVEX_HTTP_ACTIONS_URL
   vercel env add CONVEX_HTTP_ACTIONS_SECRET
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
| `CONVEX_HTTP_ACTIONS_URL` | Yes | Convex HTTP actions base URL | Server only |
| `CONVEX_HTTP_ACTIONS_SECRET` | Optional | Shared secret for Convex HTTP actions | Server only |
| `ADMIN_KEY` | Yes | Shared secret for write operations | Server only |
| `VITE_ADMIN_KEY` | Optional | Admin key for client (if needed) | Client only |

**Security Notes:**
- `CONVEX_HTTP_ACTIONS_SECRET` should **never** be exposed to the client
- `ADMIN_KEY` protects all write operations (POST/PUT/DELETE)
- Use a strong, unique key for `ADMIN_KEY` (e.g., `openssl rand -base64 32`)
- For production, consider using Vercel's encrypted environment variables

### Post-Deployment

1. **Update DNS** (if using custom domain)
   - Add domain in Vercel dashboard
   - Update DNS records as instructed

2. **Monitor Logs**
   - Check Vercel function logs for errors
   - Monitor Convex dashboard for query performance

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

**Issue: Convex proxy errors**
- Verify `CONVEX_HTTP_ACTIONS_URL` points to your Convex deployment
- Ensure your Convex HTTP actions are deployed and reachable
- Confirm the optional `CONVEX_HTTP_ACTIONS_SECRET` matches on both sides

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

If you want to test locally with production Convex:

```bash
# .env.local
CONVEX_HTTP_ACTIONS_URL=https://your-production.convex.site/api
CONVEX_HTTP_ACTIONS_SECRET=your_production_shared_secret
ADMIN_KEY=your_production_admin_key
VITE_ADMIN_KEY=your_production_admin_key
```

**Warning:** Be careful when testing with production data!

### Scaling Considerations

- Vercel Functions have a 10s timeout by default (configurable)
- Convex free tier has usage limits
- Consider caching for high-traffic scenarios
- Monitor function execution time in Vercel dashboard

### Backup Strategy

1. **Database Backups**
   - Use Convex exports or snapshot tools as needed

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
