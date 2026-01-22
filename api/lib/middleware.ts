import type { VercelRequest, VercelResponse } from '@vercel/node';

export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key',
  };
}

export function requireAdminKey(req: VercelRequest): boolean {
  const adminKey = process.env.ADMIN_KEY;
  
  if (!adminKey) {
    throw new Error('ADMIN_KEY not configured');
  }
  
  const providedKey = req.headers['x-admin-key'] as string | undefined;
  
  return providedKey === adminKey;
}

export function handleOptions(res: VercelResponse): void {
  res.status(200).json({});
}

export function errorResponse(res: VercelResponse, message: string, status: number = 400): void {
  res.status(status).json({ error: message });
}

export function successResponse<T>(res: VercelResponse, data: T, status: number = 200): void {
  res.status(status).json(data);
}

export async function withErrorHandling(
  handler: () => Promise<void>
): Promise<void> {
  try {
    await handler();
  } catch (error) {
    throw error;
  }
}
