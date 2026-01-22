// API client for Prompt Library

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { requiresAuth, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add admin key for write operations if required
  if (requiresAuth) {
    const adminKey = import.meta.env.VITE_ADMIN_KEY;
    if (adminKey) {
      headers['X-Admin-Key'] = adminKey;
    }
  }

  // Merge with any additional headers
  if (fetchOptions.headers) {
    Object.assign(headers, fetchOptions.headers);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Prompts API
export const promptsApi = {
  list: (params?: {
    search?: string;
    tags?: string[];
    purpose?: string;
    status?: string[];
    models?: string[];
    sort?: string;
    order?: string;
    limit?: number;
    offset?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach((v) => searchParams.append(key, v));
          } else {
            searchParams.append(key, String(value));
          }
        }
      });
    }
    return apiRequest(`/prompts?${searchParams.toString()}`);
  },

  get: (id: string) => apiRequest(`/prompts/${id}`),

  create: (data: {
    name: string;
    description?: string;
    purpose: string;
    tags?: string[];
    owner?: string;
    content: string;
    system_prompt?: string;
    models?: string[];
    model_config?: Record<string, unknown>;
    author?: string;
  }) =>
    apiRequest(`/prompts`, {
      method: 'POST',
      body: JSON.stringify(data),
      requiresAuth: false, // PUBLIC endpoint - no admin key required
    }),

  update: (
    id: string,
    data: {
      name?: string;
      description?: string;
      purpose?: string;
      tags?: string[];
      owner?: string;
    }
  ) =>
    apiRequest(`/prompts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      requiresAuth: true,
    }),

  createVersion: (
    id: string,
    data: {
      content: string;
      system_prompt?: string;
      change_description: string;
      bump_type: 'major' | 'minor' | 'patch';
      models?: string[];
      model_config?: Record<string, unknown>;
      author?: string;
    }
  ) =>
    apiRequest(`/prompts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      requiresAuth: true,
    }),

  delete: (id: string) =>
    apiRequest(`/prompts/${id}`, {
      method: 'DELETE',
      requiresAuth: true,
    }),

  changeStatus: (
    id: string,
    data: {
      status: string;
      comment: string;
      author?: string;
    }
  ) =>
    apiRequest(`/prompts/${id}/status`, {
      method: 'POST',
      body: JSON.stringify(data),
      requiresAuth: true,
    }),
};

// Versions API
export const versionsApi = {
  list: (promptId: string) => apiRequest(`/prompts/${promptId}/versions`),

  get: (promptId: string, version: string) =>
    apiRequest(`/prompts/${promptId}/versions/${version}`),

  rollback: (
    promptId: string,
    version: string,
    data: {
      comment: string;
      author?: string;
    }
  ) =>
    apiRequest(`/prompts/${promptId}/versions/${version}/rollback`, {
      method: 'POST',
      body: JSON.stringify(data),
      requiresAuth: true,
    }),
};

// Tags & Purposes API
export const metadataApi = {
  getTags: () => apiRequest<{ name: string; usage_count: number }[]>('/tags'),
  getPurposes: () =>
    apiRequest<{ name: string; usage_count: number }[]>('/purposes'),
};
