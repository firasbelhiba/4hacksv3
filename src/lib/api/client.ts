/**
 * API Client for NestJS Backend
 * Typed API client with authentication support
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;

    // Try to get token from localStorage if in browser
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    // Refresh token from localStorage before each request
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // Auth endpoints
  auth = {
    register: (data: { name: string; email: string; password: string }) =>
      this.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    login: async (data: { email: string; password: string }) => {
      const response = await this.request<{ accessToken: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      // Store token
      if (response.accessToken) {
        this.setToken(response.accessToken);
      }

      // Return in format expected by useAuth hook
      return {
        token: response.accessToken,
        user: response.user,
      };
    },

    logout: () => {
      this.setToken(null);
    },

    me: () => this.request('/auth/me'),

    checkRegistrationStatus: () => this.request('/auth/register/status'),
  };

  // Hackathons endpoints
  hackathons = {
    list: async (params?: { status?: string; page?: number; limit?: number }) => {
      // Convert limit to pageSize for backend compatibility
      let endpoint = '/hackathons';
      if (params) {
        const { limit, ...rest } = params;
        const backendParams = limit ? { ...rest, pageSize: limit } : rest;
        const query = new URLSearchParams(backendParams as any).toString();
        endpoint = `/hackathons${query ? `?${query}` : ''}`;
      }
      const response = await this.request<{ success: boolean; data: any[]; pagination?: any }>(endpoint);
      // Backend returns { success: true, data: [...], pagination: {...} }
      return response.data || response;
    },

    create: async (data: any) => {
      const response = await this.request<{ success: boolean; data: any; message?: string }>('/hackathons', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.data || response;
    },

    get: async (id: string) => {
      const response = await this.request<{ success: boolean; data: any }>(`/hackathons/${id}`);
      return response.data || response;
    },

    update: async (id: string, data: any) => {
      const response = await this.request<{ success: boolean; data: any; message?: string }>(`/hackathons/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      return response.data || response;
    },

    delete: (id: string) =>
      this.request(`/hackathons/${id}`, {
        method: 'DELETE',
      }),

    // Tracks
    tracks: {
      list: async (hackathonId: string) => {
        const response = await this.request<{ success: boolean; data: any[] }>(`/hackathons/${hackathonId}/tracks`);
        return response.data || response;
      },

      create: async (hackathonId: string, data: any) => {
        const response = await this.request<{ success: boolean; data: any; message?: string }>(`/hackathons/${hackathonId}/tracks`, {
          method: 'POST',
          body: JSON.stringify(data),
        });
        return response.data || response;
      },

      update: async (hackathonId: string, trackId: string, data: any) => {
        const response = await this.request<{ success: boolean; data: any[]; message?: string }>(`/hackathons/${hackathonId}/tracks/${trackId}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        });
        return response.data || response;
      },

      delete: (hackathonId: string, trackId: string) =>
        this.request(`/hackathons/${hackathonId}/tracks/${trackId}`, {
          method: 'DELETE',
        }),
    },
  };

  // Projects endpoints
  projects = {
    list: async (params?: { hackathonId?: string; trackId?: string; page?: number; limit?: number }) => {
      const query = new URLSearchParams(params as any).toString();
      const response = await this.request<{ success: boolean; data: any[] }>(`/projects${query ? `?${query}` : ''}`);
      return response.data || response;
    },

    create: async (data: any) => {
      const response = await this.request<{ success: boolean; data: any; message?: string }>('/projects', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.data || response;
    },

    get: async (id: string) => {
      const response = await this.request<{ success: boolean; data: { project: any } }>(`/projects/${id}`);
      // Backend returns { success: true, data: { project: {...} } } - double nested
      return response.data?.project || response.data || response;
    },

    update: async (id: string, data: any) => {
      const response = await this.request<{ success: boolean; data: any; message?: string }>(`/projects/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      return response.data || response;
    },

    delete: (id: string) =>
      this.request(`/projects/${id}`, {
        method: 'DELETE',
      }),

    // Reviews
    reviews: {
      getStatus: async (projectId: string) => {
        const response = await this.request<{ success: boolean; data: any }>(`/projects/${projectId}/review/status`);
        // Backend returns { success: true, data: { codeQuality, coherence, innovation, hedera } }
        return response.data || response;
      },

      startInnovation: async (projectId: string) => {
        const response = await this.request<{ success: boolean; data: any }>(`/projects/${projectId}/review/innovation`, {
          method: 'POST',
        });
        return response.data || response;
      },

      getInnovation: async (projectId: string, reportId: string) => {
        const response = await this.request<{ success: boolean; data: any }>(`/projects/${projectId}/review/innovation/${reportId}`);
        return response.data || response;
      },

      startCoherence: async (projectId: string) => {
        const response = await this.request<{ success: boolean; data: any }>(`/projects/${projectId}/review/coherence`, {
          method: 'POST',
        });
        return response.data || response;
      },

      getCoherence: async (projectId: string, reportId: string) => {
        const response = await this.request<{ success: boolean; data: any }>(`/projects/${projectId}/review/coherence/${reportId}`);
        return response.data || response;
      },

      startHedera: async (projectId: string) => {
        const response = await this.request<{ success: boolean; data: any }>(`/projects/${projectId}/review/hedera`, {
          method: 'POST',
        });
        return response.data || response;
      },

      getHedera: async (projectId: string, reportId: string) => {
        const response = await this.request<{ success: boolean; data: any }>(`/projects/${projectId}/review/hedera/${reportId}`);
        return response.data || response;
      },
    },

    // Code Quality
    codeQuality: {
      start: async (projectId: string) => {
        const response = await this.request<{ success: boolean; data: any }>(`/projects/${projectId}/code-quality`, {
          method: 'POST',
        });
        return response.data || response;
      },

      get: async (projectId: string, reportId: string) => {
        const response = await this.request<{ success: boolean; data: any }>(`/projects/${projectId}/code-quality/${reportId}`);
        return response.data || response;
      },

      getProgress: async (projectId: string, reportId: string) => {
        const response = await this.request<{ success: boolean; data: any }>(`/projects/${projectId}/code-quality/${reportId}/progress`);
        return response.data || response;
      },
    },

    // Eligibility
    eligibility: {
      check: async (projectId: string) => {
        const response = await this.request<{ success: boolean; data: any }>(`/projects/${projectId}/eligibility`);
        return response.data || response;
      },

      validate: async (projectId: string, data: any) => {
        const response = await this.request<{ success: boolean; data: any }>(`/projects/${projectId}/eligibility/validate`, {
          method: 'POST',
          body: JSON.stringify(data),
        });
        return response.data || response;
      },
    },
  };

  // AI Jury endpoints
  // NOTE: AI Jury endpoints return raw data without { success, data } wrapper
  aiJury = {
    getSessions: (hackathonId: string) =>
      this.request(`/ai-jury/sessions?hackathonId=${hackathonId}`),

    createSession: (data: { hackathonId: string; eligibilityCriteria?: any }) =>
      this.request('/ai-jury/sessions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getProgress: (sessionId: string) =>
      this.request(`/ai-jury/sessions/${sessionId}/progress`),

    getLiveProgress: (sessionId: string) =>
      this.request(`/ai-jury/sessions/${sessionId}/live-progress`),

    getResults: (sessionId: string) =>
      this.request(`/ai-jury/sessions/${sessionId}/results`),

    executeLayer: (sessionId: string, layer: number) =>
      this.request(`/ai-jury/sessions/${sessionId}/execute-layer`, {
        method: 'POST',
        body: JSON.stringify({ layer }),
      }),

    reset: (sessionId: string) =>
      this.request(`/ai-jury/sessions/${sessionId}/reset`, {
        method: 'POST',
      }),
  };

  // Notifications endpoints
  // NOTE: Notifications endpoints return raw data without { success, data } wrapper
  notifications = {
    list: (params?: {
      type?: string;
      category?: string;
      priority?: string;
      read?: string;
      limit?: number;
    }) => {
      const query = new URLSearchParams(params as any).toString();
      return this.request(`/notifications${query ? `?${query}` : ''}`);
    },

    create: (data: {
      type: 'success' | 'warning' | 'error' | 'info';
      category: 'system' | 'evaluation' | 'hackathon' | 'project' | 'performance';
      title: string;
      message: string;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      actionable?: { label: string; href: string };
      metadata?: Record<string, any>;
    }) =>
      this.request('/notifications', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    markAsRead: (notificationId: string) =>
      this.request('/notifications/mark-read', {
        method: 'POST',
        body: JSON.stringify({ notificationId }),
      }),

    markAllAsRead: () =>
      this.request('/notifications/mark-all-read', {
        method: 'POST',
      }),

    delete: (id: string) =>
      this.request(`/notifications/${id}`, {
        method: 'DELETE',
      }),
  };
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for custom instances
export { ApiClient };

// Export types
export type { ApiResponse };
