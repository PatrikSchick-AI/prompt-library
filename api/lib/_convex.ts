import type { VercelRequest } from '@vercel/node';

interface ConvexRequestOptions {
  method?: string;
  query?: VercelRequest['query'];
  body?: unknown;
}

interface ConvexResponse<T> {
  status: number;
  body: T;
}

const convexBaseUrl =
  process.env.CONVEX_HTTP_ACTIONS_URL || process.env.CONVEX_SITE_URL;

function getConvexBaseUrl(): string {
  if (!convexBaseUrl) {
    throw new Error(
      'Missing Convex base URL. Set CONVEX_HTTP_ACTIONS_URL or CONVEX_SITE_URL in the environment.'
    );
  }

  return convexBaseUrl.endsWith('/') ? convexBaseUrl : `${convexBaseUrl}/`;
}

function appendQueryParams(url: URL, query: VercelRequest['query'] = {}) {
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined) {
      return;
    }
    const values = Array.isArray(value) ? value : [value];
    values.forEach((entry) => {
      if (entry !== undefined) {
        url.searchParams.append(key, String(entry));
      }
    });
  });
}

function shouldIncludeBody(method: string, body: unknown) {
  if (body === undefined) {
    return false;
  }

  return !['GET', 'HEAD'].includes(method.toUpperCase());
}

function parseResponseBody<T>(rawBody: string): T {
  if (!rawBody) {
    return {} as T;
  }

  try {
    return JSON.parse(rawBody) as T;
  } catch {
    return { message: rawBody } as T;
  }
}

export async function callConvexAction<T>(
  path: string,
  options: ConvexRequestOptions = {}
): Promise<ConvexResponse<T>> {
  const baseUrl = getConvexBaseUrl();
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  const url = new URL(normalizedPath, baseUrl);

  appendQueryParams(url, options.query);

  const method = options.method ?? 'GET';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const authToken = process.env.CONVEX_HTTP_ACTIONS_SECRET;
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: shouldIncludeBody(method, options.body)
      ? JSON.stringify(options.body)
      : undefined,
  });

  const rawBody = await response.text();
  const body = parseResponseBody<T>(rawBody);

  return { status: response.status, body };
}
