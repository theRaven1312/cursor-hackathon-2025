const API_URL = 'http://localhost:3001/api';

// Get stored token
const getToken = () => localStorage.getItem('geosnap_token');

// Set stored token
const setToken = (token) => {
  if (token) {
    localStorage.setItem('geosnap_token', token);
  } else {
    localStorage.removeItem('geosnap_token');
  }
};

// Get stored user
const getStoredUser = () => {
  const user = localStorage.getItem('geosnap_user');
  return user ? JSON.parse(user) : null;
};

// Set stored user
const setStoredUser = (user) => {
  if (user) {
    localStorage.setItem('geosnap_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('geosnap_user');
  }
};

// API request helper
const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
};

// Auth API
export const authAPI = {
  register: async (username, email, password) => {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
    setToken(data.token);
    setStoredUser(data.user);
    return data;
  },

  login: async (email, password) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    setStoredUser(data.user);
    return data;
  },

  logout: () => {
    setToken(null);
    setStoredUser(null);
  },

  getProfile: async () => {
    return apiRequest('/auth/me');
  },

  updateProfile: async (updates) => {
    return apiRequest('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  isLoggedIn: () => !!getToken(),
  
  getUser: getStoredUser,
  getToken,
};

// Photos API
export const photosAPI = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/photos${query ? `?${query}` : ''}`);
  },

  getById: async (id) => {
    return apiRequest(`/photos/${id}`);
  },

  create: async (photoData) => {
    return apiRequest('/photos', {
      method: 'POST',
      body: JSON.stringify({
        image: photoData.image,
        latitude: photoData.location.lat,
        longitude: photoData.location.lng,
        address: photoData.address,
        rating: photoData.rating,
        caption: photoData.caption,
      }),
    });
  },

  update: async (id, updates) => {
    return apiRequest(`/photos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  delete: async (id) => {
    return apiRequest(`/photos/${id}`, {
      method: 'DELETE',
    });
  },

  toggleLike: async (id) => {
    return apiRequest(`/photos/${id}/like`, {
      method: 'POST',
    });
  },
};

// Comments API
export const commentsAPI = {
  getByPhoto: async (photoId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/comments/photo/${photoId}${query ? `?${query}` : ''}`);
  },

  create: async (photoId, text) => {
    return apiRequest(`/comments/photo/${photoId}`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },

  update: async (id, text) => {
    return apiRequest(`/comments/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ text }),
    });
  },

  delete: async (id) => {
    return apiRequest(`/comments/${id}`, {
      method: 'DELETE',
    });
  },
};

// AI API
export const aiAPI = {
  suggest: async (query, latitude, longitude) => {
    return apiRequest('/ai/suggest', {
      method: 'POST',
      body: JSON.stringify({ query, latitude, longitude }),
    });
  },

  getCategories: async () => {
    return apiRequest('/ai/categories');
  },
};

export default {
  auth: authAPI,
  photos: photosAPI,
  comments: commentsAPI,
  ai: aiAPI,
};

