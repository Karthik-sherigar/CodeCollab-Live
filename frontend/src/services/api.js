import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to requests if available
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Auth API methods
export const authAPI = {
    // Manual registration
    register: async (name, email, password) => {
        const response = await api.post('/auth/register', { name, email, password });
        return response.data;
    },

    // Manual login
    login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        if (response.data.success && response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    // Google OAuth login/register
    googleAuth: async (credential) => {
        const response = await api.post('/auth/google', { credential });
        if (response.data.success && response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    // Logout
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    // Get current user from localStorage
    getCurrentUser: () => {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    // Check if user is authenticated
    isAuthenticated: () => {
        return !!localStorage.getItem('token');
    }
};

// Workspace API methods
export const workspaceAPI = {
    // Get all user's workspaces
    getAll: async () => {
        const response = await api.get('/workspaces');
        return response.data;
    },

    // Create new workspace
    create: async (name) => {
        const response = await api.post('/workspaces', { name });
        return response.data;
    },

    // Get workspace by ID
    getById: async (id) => {
        const response = await api.get(`/workspaces/${id}`);
        return response.data;
    },

    // Delete workspace
    delete: async (id) => {
        const response = await api.delete(`/workspaces/${id}`);
        return response.data;
    },

    // Invite member to workspace
    inviteMember: async (id, email, role) => {
        const response = await api.post(`/workspaces/${id}/invite`, { email, role });
        return response.data;
    },

    // Create session in workspace
    createSession: async (id, title, language) => {
        const response = await api.post(`/workspaces/${id}/sessions`, { title, language });
        return response.data;
    }
};

export default api;
