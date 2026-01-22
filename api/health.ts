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
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const adminKey = process.env.ADMIN_KEY;

  const missing: string[] = [];
  
  if (!supabaseUrl) {
    missing.push('SUPABASE_URL (or VITE_SUPABASE_URL)');
  }
  
  if (!supabaseServiceKey) {
    missing.push('SUPABASE_SERVICE_ROLE_KEY');
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
      supabaseUrl: supabaseUrl.substring(0, 20) + '...',
      hasServiceKey: !!supabaseServiceKey,
      hasAdminKey: !!adminKey,
    },
  });
}
