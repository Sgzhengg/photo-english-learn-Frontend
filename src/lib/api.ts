// =============================================================================
// PhotoEnglish - API Service Layer
// =============================================================================

// Use mock API only when explicitly enabled
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true';

const API_BASE_URL = 'https://photo-english-learn-api-gateway.zeabur.app';

// Import mock API functions (setMockUserId is no longer needed)
import { mockAuthApi, mockUserApi } from './mock-api';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

// -----------------------------------------------------------------------------
// API Client
// -----------------------------------------------------------------------------

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;

    // Get token from localStorage
    const token = localStorage.getItem('access_token');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 401 Unauthorized - try to refresh token
      if (response.status === 401) {
        const refreshSuccess = await this.refreshToken();
        if (refreshSuccess) {
          // Retry original request with new token
          const newToken = localStorage.getItem('access_token');
          if (newToken) {
            headers['Authorization'] = `Bearer ${newToken}`;
          }
          const retryResponse = await fetch(url, {
            ...options,
            headers,
          });
          return await this.handleResponse<T>(retryResponse);
        }
        // If refresh failed, clear tokens and redirect to login
        this.clearTokens();
        window.location.href = '/login';
        return { success: false, error: 'Session expired. Please login again.' };
      }

      return await this.handleResponse<T>(response);
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || 'Request failed',
      };
    }

    return {
      success: true,
      data: data as T,
      message: data.message,
    };
  }

  private async refreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('access_token', data.accessToken);
        localStorage.setItem('refresh_token', data.refreshToken);
        localStorage.setItem('expires_at', data.expiresAt.toString());
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    return false;
  }

  private clearTokens() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('expires_at');
  }

  // HTTP Methods
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// -----------------------------------------------------------------------------
// API Instance
// -----------------------------------------------------------------------------

export const api = new ApiClient(API_BASE_URL);

// -----------------------------------------------------------------------------
// Auth API
// ----------------------------------------------------------------------------//

export const authApi = {
  /**
   * User login
   * POST /auth/login
   */
  login: async (emailOrPhone: string, password: string, keepLoggedIn: boolean) => {
    if (USE_MOCK_API) {
      const result = await mockAuthApi.login(emailOrPhone, password);
      // User is saved automatically in mockApi.login()
      return { success: true, data: result };
    }
    return api.post<AuthTokens & { user: import('@/types').User }>('/auth/login', {
      emailOrPhone,
      password,
      keepLoggedIn,
    });
  },

  /**
   * User registration
   * POST /auth/register
   */
  register: async (data: {
    emailOrPhone: string;
    verificationCode: string;
    password: string;
  }) => {
    if (USE_MOCK_API) {
      const result = await mockAuthApi.register(data.emailOrPhone, data.verificationCode, data.password);
      // User is saved automatically in mockApi.register()
      return { success: true, data: result };
    }
    return api.post<AuthTokens & { user: import('@/types').User }>('/auth/register', data);
  },

  /**
   * Send verification code (development mode: accepts any 6-digit code)
   * POST /auth/send-code
   */
  sendVerificationCode: async (emailOrPhone: string) => {
    if (USE_MOCK_API) {
      const result = await mockAuthApi.sendVerificationCode(emailOrPhone);
      return { success: true, data: result };
    }
    return api.post<{ message: string }>('/auth/send-code', { emailOrPhone });
  },

  /**
   * Refresh access token
   * POST /auth/refresh
   */
  refreshToken: async (refreshToken: string) => {
    if (USE_MOCK_API) {
      const result = await mockAuthApi.refreshToken(refreshToken);
      return { success: true, data: result };
    }
    return api.post<AuthTokens>('/auth/refresh', { refreshToken });
  },

  /**
   * Get current user info
   * GET /auth/me
   */
  getCurrentUser: async () => {
    if (USE_MOCK_API) {
      const result = await mockAuthApi.getCurrentUser();
      return { success: true, data: result };
    }
    return api.get<import('@/types').User>('/auth/me');
  },

  /**
   * Reset password
   * POST /auth/reset-password
   */
  resetPassword: async (data: {
    emailOrPhone: string;
    verificationCode: string;
    newPassword: string;
  }) => {
    if (USE_MOCK_API) {
      const result = await mockAuthApi.resetPassword(data.emailOrPhone, data.verificationCode, data.newPassword);
      return { success: true, data: result };
    }
    return api.post<{ message: string }>('/auth/reset-password', data);
  },

  /**
   * Logout
   * POST /auth/logout
   */
  logout: async () => {
    if (USE_MOCK_API) {
      const result = await mockAuthApi.logout();
      return { success: true, data: result };
    }
    return api.post<{ message: string }>('/auth/logout');
  },
};

// -----------------------------------------------------------------------------
// User API
// -----------------------------------------------------------------------------

export const userApi = {
  /**
   * Update user preferences (after onboarding)
   * PATCH /user/preferences
   */
  updatePreferences: async (preferences: {
    englishLevel: 'beginner' | 'intermediate' | 'advanced';
    dailyGoal: '10' | '20' | '30' | '50';
  }) => {
    if (USE_MOCK_API) {
      const result = await mockUserApi.updatePreferences(preferences);
      return { success: true, data: result };
    }
    return api.patch<import('@/types').User>('/user/preferences', preferences);
  },

  /**
   * Update user profile
   * PATCH /user/profile
   */
  updateProfile: async (data: {
    nickname?: string;
    avatar?: string;
  }) => {
    if (USE_MOCK_API) {
      const result = await mockUserApi.updateProfile(data);
      return { success: true, data: result };
    }
    return api.patch<import('@/types').User>('/user/profile', data);
  },

  /**
   * Change password
   * POST /user/change-password
   */
  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }) => {
    if (USE_MOCK_API) {
      const result = await mockUserApi.changePassword(data.currentPassword, data.newPassword);
      return { success: true, data: result };
    }
    return api.post<{ message: string }>('/user/change-password', data);
  },
};

// -----------------------------------------------------------------------------
// Photo API (for later milestones)
// -----------------------------------------------------------------------------

export const photoApi = {
  /**
   * Upload photo for OCR recognition
   * POST /photo/recognize
   */
  recognize: (formData: FormData) =>
    api.post<{
      photo: import('@/types').Photo;
      words: import('@/types').RecognizedWord[];
      sceneDescription: string;
      sceneTranslation: string;
    }>('/photo/recognize', formData),

  /**
   * Get user's photos
   * GET /photos
   */
  getPhotos: () =>
    api.get<import('@/types').Photo[]>('/photos'),

  /**
   * Save words from photo to vocabulary library
   * POST /photo/:photoId/save-words
   */
  saveWords: (photoId: string, wordIds: string[]) =>
    api.post<import('@/types').Word[]>(`/photo/${photoId}/save-words`, { wordIds }),
};

// -----------------------------------------------------------------------------
// Vocabulary API (for later milestones)
// -----------------------------------------------------------------------------

export const vocabularyApi = {
  /**
   * Get user's vocabulary library
   * GET /vocabulary
   */
  getWords: (_params?: {
    search?: string;
    tags?: string[];
    masteryLevel?: string;
    page?: number;
    limit?: number;
  }) =>
    api.get<{ words: import('@/types').Word[]; total: number }>('/vocabulary'),

  /**
   * Get word details
   * GET /vocabulary/:wordId
   */
  getWord: (wordId: string) =>
    api.get<import('@/types').Word>(`/vocabulary/${wordId}`),

  /**
   * Create tag
   * POST /vocabulary/tags
   */
  createTag: (name: string, color?: string) =>
    api.post<import('@/types').Tag>('/vocabulary/tags', { name, color }),

  /**
   * Get user's tags
   * GET /vocabulary/tags
   */
  getTags: () =>
    api.get<import('@/types').Tag[]>('/vocabulary/tags'),

  /**
   * Update word tags
   * PATCH /vocabulary/:wordId/tags
   */
  updateWordTags: (wordId: string, tags: string[]) =>
    api.patch<import('@/types').Word>(`/vocabulary/${wordId}/tags`, { tags }),

  /**
   * Delete word
   * DELETE /vocabulary/:wordId
   */
  deleteWord: (wordId: string) =>
    api.delete<{ message: string }>(`/vocabulary/${wordId}`),
};

// -----------------------------------------------------------------------------
// Practice API (for later milestones)
// -----------------------------------------------------------------------------

export const practiceApi = {
  /**
   * Generate practice exercises
   * POST /practice/generate
   */
  generate: (type: 'fill-blank' | 'translation' | 'scene-sentence', count: number = 10) =>
    api.post<import('@/types').Practice[]>('/practice/generate', { type, count }),

  /**
   * Submit practice answer
   * POST /practice/:practiceId/submit
   */
  submit: (practiceId: string, userAnswer: string, timeSpent?: number) =>
    api.post<import('@/types').Practice>(`/practice/${practiceId}/submit`, {
      userAnswer,
      timeSpent,
    }),

  /**
   * Get practice history
   * GET /practice/history
   */
  getHistory: (_params?: { limit?: number }) =>
    api.get<import('@/types').Practice[]>('/practice/history'),
};

// -----------------------------------------------------------------------------
// Review API (for later milestones)
// -----------------------------------------------------------------------------

export const reviewApi = {
  /**
   * Get words due for review
   * GET /review/due
   */
  getDueReviews: () =>
    api.get<{ word: import('@/types').Word; nextReviewAt: string }[]>('/review/due'),

  /**
   * Submit review answer
   * POST /review/:wordId/submit
   */
  submit: (wordId: string, userAnswer: string) =>
    api.post<import('@/types').Review>(`/review/${wordId}/submit`, { userAnswer }),
};

// -----------------------------------------------------------------------------
// Progress API (for later milestones)
// -----------------------------------------------------------------------------

export const progressApi = {
  /**
   * Get user's learning progress
   * GET /progress
   */
  get: () =>
    api.get<import('@/types').Progress>('/progress'),
};

// -----------------------------------------------------------------------------
// ASR API (Automatic Speech Recognition)
// -----------------------------------------------------------------------------

export interface AsrRecognitionResult {
  text: string;
  confidence: number;
  engine: string;
  language: string;
  duration?: number;
}

export interface PronunciationScore {
  overall: number; // 总分 0-100
  accuracy: number; // 准确度 0-100
  fluency: number; // 流利度 0-100
  completeness: number; // 完整度 0-100
  feedback: string;
}

export interface AsrEvaluateResult {
  recorded_text: string;
  target_text: string;
  score: PronunciationScore;
}

export const asrApi = {
  /**
   * Recognize audio from file
   * POST /asr/recognize
   */
  recognize: async (audioFile: File, language: string = 'en-US', engine: string = 'groq-whisper') => {
    const formData = new FormData();
    formData.append('audio_file', audioFile);
    formData.append('language', language);
    formData.append('engine', engine);

    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/asr/recognize`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Recognition failed' }));
      return { success: false, error: error.message || error.detail || 'Recognition failed' };
    }

    const data = await response.json();
    return { success: true, data: data.data as AsrRecognitionResult };
  },

  /**
   * Recognize audio from URL
   * POST /asr/recognize-url
   */
  recognizeFromUrl: async (audioUrl: string, language: string = 'en-US', engine: string = 'groq-whisper') => {
    const formData = new FormData();
    formData.append('audio_url', audioUrl);
    formData.append('language', language);
    formData.append('engine', engine);

    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/asr/recognize-url`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Recognition failed' }));
      return { success: false, error: error.message || error.detail || 'Recognition failed' };
    }

    const data = await response.json();
    return { success: true, data: data.data as AsrRecognitionResult };
  },

  /**
   * Evaluate pronunciation against target text
   * POST /asr/evaluate-pronunciation
   */
  evaluatePronunciation: async (audioFile: File, targetText: string, language: string = 'en-US') => {
    const formData = new FormData();
    formData.append('audio_file', audioFile);
    formData.append('target_text', targetText);
    formData.append('language', language);

    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/asr/evaluate-pronunciation`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Evaluation failed' }));
      return { success: false, error: error.message || error.detail || 'Evaluation failed' };
    }

    const data = await response.json();
    return { success: true, data: data.data as AsrEvaluateResult };
  },

  /**
   * Get available recognition engines
   * GET /asr/engines
   */
  getEngines: async () => {
    return api.get<{ engines: Array<{ id: string; name: string; description: string; available: boolean }> }>('/asr/engines');
  },

  /**
   * Get ASR service configuration
   * GET /asr/config
   */
  getConfig: async () => {
    return api.get<{
      supported_languages: string[];
      supported_engines: string[];
      default_engine: string;
      default_language: string;
      max_audio_size: number;
      supported_formats: string[];
    }>('/asr/config');
  },
};
