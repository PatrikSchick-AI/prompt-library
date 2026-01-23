import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check required environment variables
  const convexActionsUrl =
    process.env.CONVEX_HTTP_ACTIONS_URL || process.env.CONVEX_SITE_URL;
  const convexActionsSecret = process.env.CONVEX_HTTP_ACTIONS_SECRET;
  const adminKey = process.env.ADMIN_KEY;

  const missing: string[] = [];
  
  if (!convexActionsUrl) {
    missing.push('CONVEX_HTTP_ACTIONS_URL (or CONVEX_SITE_URL)');
  }

  if (!adminKey) {
    missing.push('ADMIN_KEY');
  }

  if (missing.length > 0) {
    return res.status(500).json({
      ok: false,
      error: 'Missing required environment variables',
      missing,
      message: 'Configure these in Vercel Project Settings → Environment Variables',
    });
  }

  return res.status(200).json({
    ok: true,
    message: 'API is healthy',
    env: {
      convexActionsUrl: convexActionsUrl?.substring(0, 40) + '...',
      hasConvexActionsSecret: !!convexActionsSecret,
      hasAdminKey: !!adminKey,
    },
  });
}
