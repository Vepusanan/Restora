/**
 * Thin API client layer for non-Firebase HTTP endpoints.
 * Prefer Firebase services for auth/data; use this for third-party APIs.
 */
export async function apiGet<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }

  return (await response.json()) as T;
}
