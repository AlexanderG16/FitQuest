import type { ApiResponse, ApiErrorResponse } from '@repo/shared';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000/api/v1';

class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_URL}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = (await res.json().catch(() => null)) as ApiErrorResponse | null;
    throw new ApiError(
      res.status,
      error?.error ?? `Request failed with status ${res.status}`,
      error?.details,
    );
  }

  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<ApiResponse<T>>(path),

  post: <T>(path: string, body: unknown) =>
    request<ApiResponse<T>>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  delete: (path: string) =>
    request(path, { method: 'DELETE' }),
};

export { ApiError };
