const API_BASE_URL = "http://localhost:8000/api/schema";

// Token management
export const tokenManager = {
  getAccessToken: () => localStorage.getItem("access_token"),
  getRefreshToken: () => localStorage.getItem("refresh_token"),
  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("refresh_token", refreshToken);
  },
  clearTokens: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
  },
  getUser: () => {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  },
  setUser: (user) => {
    localStorage.setItem("user", JSON.stringify(user));
  },
};

// API utilities
const createAuthHeaders = () => {
  const token = tokenManager.getAccessToken();
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

const handleResponse = async (response) => {
  if (!response.ok) {
    if (response.status === 401) {
      // Token expired, try to refresh
      const refreshSuccess = await refreshToken();
      if (!refreshSuccess) {
        logout();
        throw new Error("Authentication failed");
      }
      // Retry the original request
      throw new Error("RETRY_WITH_NEW_TOKEN");
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}`);
  }
  return response.json();
};

// Authentication API calls
export const authAPI = {
  register: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/auth/register/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    const data = await handleResponse(response);

    if (data.tokens) {
      tokenManager.setTokens(data.tokens.access, data.tokens.refresh);
      tokenManager.setUser(data.user);
    }

    return data;
  },

  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await handleResponse(response);

    if (data.tokens) {
      tokenManager.setTokens(data.tokens.access, data.tokens.refresh);
      tokenManager.setUser(data.user);
    }

    return data;
  },

  logout: () => {
    tokenManager.clearTokens();
    window.location.href = "/";
  },

  refreshToken: async () => {
    const refreshToken = tokenManager.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        tokenManager.setTokens(data.access, refreshToken);
        return true;
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
    }

    return false;
  },

  getProfile: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/profile/`, {
      method: "GET",
      headers: createAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// Protected API calls
export const protectedAPI = {
  generateSchema: async (formData) => {
    const token = tokenManager.getAccessToken();
    const response = await fetch(`${API_BASE_URL}/auth/generate-schema/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        // Don't set Content-Type for FormData
      },
      body: formData,
    });
    return handleResponse(response);
  },

  getDashboard: async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard/`, {
      method: "GET",
      headers: createAuthHeaders(),
    });
    return handleResponse(response);
  },

  getUserSchemas: async (page = 1, domain = "") => {
    const params = new URLSearchParams({ page, page_size: 10 });
    if (domain) params.append("domain", domain);

    const response = await fetch(
      `${API_BASE_URL}/dashboard/schemas/?${params}`,
      {
        method: "GET",
        headers: createAuthHeaders(),
      }
    );
    return handleResponse(response);
  },

  getSchemaDetail: async (schemaId) => {
    const response = await fetch(
      `${API_BASE_URL}/dashboard/schemas/${schemaId}/`,
      {
        method: "GET",
        headers: createAuthHeaders(),
      }
    );
    return handleResponse(response);
  },

  deleteSchema: async (schemaId) => {
    const response = await fetch(
      `${API_BASE_URL}/dashboard/schemas/${schemaId}/`,
      {
        method: "DELETE",
        headers: createAuthHeaders(),
      }
    );
    if (response.ok) return true;
    throw new Error("Failed to delete schema");
  },
};

// Utility functions
export const isAuthenticated = () => {
  return !!tokenManager.getAccessToken() && !!tokenManager.getUser();
};

export const getCurrentUser = () => {
  return tokenManager.getUser();
};

export const logout = () => {
  authAPI.logout();
};

export const refreshToken = () => {
  return authAPI.refreshToken();
};
