// API Configuration
const API_BASE_URL = '/api';

// Helper to get auth token
const getToken = () => localStorage.getItem('token');

// Custom error class for API errors
export class APIError extends Error {
  status?: number;
  
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'APIError';
    this.status = status;
  }
}

// Helper for API requests
async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...options.headers as Record<string, string>,
  };

  // Only set Content-Type for JSON requests (not FormData)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      // Got HTML instead of JSON - likely a routing issue
      const text = await response.text();
      console.error('Non-JSON response:', text.substring(0, 200));
      throw new APIError('Server returned invalid response. Please try again later.', response.status);
    }

    const data = await response.json();

    if (!response.ok) {
      throw new APIError(data.message || 'API request failed', response.status);
    }

    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    // Network or parsing error
    console.error('Fetch error:', error);
    throw new APIError('Network error. Please check your connection and try again.');
  }
}

// Auth API
export const authAPI = {
  register: async (name: string, email: string, password: string) => {
    return fetchAPI('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  },

  login: async (email: string, password: string) => {
    return fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  logout: async () => {
    return fetchAPI('/auth/logout', {
      method: 'POST',
    });
  },

  getCurrentUser: async () => {
    return fetchAPI('/auth/me');
  },
};

// Profile API
export const profileAPI = {
  getProfile: async () => {
    return fetchAPI('/profile');
  },

  updateProfile: async (updates: {
    name?: string;
    phone?: string;
    education?: string;
    experience?: string;
    skills?: string[];
  }) => {
    return fetchAPI('/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  addSkill: async (skill: string) => {
    return fetchAPI('/profile/skills', {
      method: 'POST',
      body: JSON.stringify({ skill }),
    });
  },

  removeSkill: async (skill: string) => {
    return fetchAPI(`/profile/skills/${encodeURIComponent(skill)}`, {
      method: 'DELETE',
    });
  },

  getCompleteness: async () => {
    return fetchAPI('/profile/completeness');
  },
};

// Upload API
export const uploadAPI = {
  uploadResume: async (file: File) => {
    const formData = new FormData();
    formData.append('resume', file);

    const url = `${API_BASE_URL}/upload`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${getToken()}`,
        },
        body: formData,
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 200));
        throw new APIError('Server returned invalid response. Please try again later.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new APIError(data.message || 'Upload failed');
      }

      return data;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      console.error('Upload error:', error);
      throw new APIError('Network error. Please check your connection and try again.');
    }
  },

  getUploadStatus: async () => {
    return fetchAPI('/upload/status');
  },

  deleteResume: async () => {
    return fetchAPI('/upload', {
      method: 'DELETE',
    });
  },
};

// Jobs API
export const jobsAPI = {
  getJobs: async (filters?: {
    search?: string;
    type?: string;
    skills?: string[];
  }) => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.skills) params.append('skills', filters.skills.join(','));

    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchAPI(`/jobs${query}`);
  },

  getJob: async (id: string) => {
    return fetchAPI(`/jobs/${id}`);
  },

  applyForJob: async (id: string) => {
    return fetchAPI(`/jobs/${id}/apply`, {
      method: 'POST',
    });
  },
};

// Skill Gap API
export const skillGapAPI = {
  getAnalysis: async () => {
    return fetchAPI('/skill-gap');
  },

  getInDemandSkills: async () => {
    return fetchAPI('/skill-gap/in-demand');
  },

  getTrainingRecommendations: async (skill: string) => {
    return fetchAPI(`/skill-gap/training/${encodeURIComponent(skill)}`);
  },

  getStats: async () => {
    return fetchAPI('/skill-gap/stats');
  },
};
