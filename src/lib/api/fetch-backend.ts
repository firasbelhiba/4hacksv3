/**
 * Backend API Fetch Utility
 * Wrapper around fetch to automatically use backend API URL
 * Use this for endpoints not yet covered by apiClient
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export interface FetchBackendOptions extends RequestInit {
  // Additional custom options can be added here
}

/**
 * Fetch wrapper that automatically prepends the backend API URL
 * @param endpoint - API endpoint (e.g., '/hackathons/123')
 * @param options - Fetch options
 * @returns Promise<Response>
 */
export async function fetchBackend(
  endpoint: string,
  options?: FetchBackendOptions
): Promise<Response> {
  // Ensure endpoint starts with /
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  const url = `${API_BASE_URL}${normalizedEndpoint}`;

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Get auth token from localStorage if available
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  const config: RequestInit = {
    ...options,
    credentials: 'include',
    headers: {
      ...defaultHeaders,
      ...options?.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    return response;
  } catch (error) {
    console.error(`Backend API Error [${endpoint}]:`, error);
    throw error;
  }
}

/**
 * Helper to fetch JSON data from backend API
 * @param endpoint - API endpoint
 * @param options - Fetch options
 * @returns Promise with parsed JSON response
 */
export async function fetchBackendJSON<T = any>(
  endpoint: string,
  options?: FetchBackendOptions
): Promise<T> {
  const response = await fetchBackend(endpoint, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Get the base URL for the backend API
 */
export function getBackendURL(): string {
  return API_BASE_URL;
}

/**
 * Check if a URL is a frontend API route (should be migrated)
 * @param url - URL to check
 * @returns true if it's a frontend API route
 */
export function isFrontendAPIRoute(url: string): boolean {
  return url.startsWith('/api/') && !url.startsWith(API_BASE_URL);
}
