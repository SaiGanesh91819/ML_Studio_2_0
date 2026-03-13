import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/';

// Create axios instance with default config
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add interceptor to attach JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export const authService = {
    async login(username, password) {
        const response = await api.post('auth/login/', { username, password });
        if (response.data.access) {
            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);
            localStorage.setItem('user', JSON.stringify({ username }));
        }
        return response.data;
    },

    async sendOTP(email) {
        return api.post('auth/send-otp/', { email });
    },

    async register(username, email, password, otp) {
        return api.post('auth/register/', { username, email, password, otp });
    },

    async checkUsername(username) {
        const response = await api.get(`auth/check-username/?username=${username}`);
        return response.data;
    },

    logout() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
    },

    getCurrentUser() {
        return JSON.parse(localStorage.getItem('user'));
    },

    async getProfile() {
        return api.get('auth/me/');
    },

    isAuthenticated() {
        return !!localStorage.getItem('access_token');
    }
};

export const projectService = {
    async createProject(formData) {
        // FormData is required for file uploads
        return api.post('projects/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    async getProjects() {
        return api.get('projects/');
    },

    async deleteProject(id) {
        return api.delete(`projects/${id}/`);
    },

    async updateProject(id, data) {
        return api.patch(`projects/${id}/`, data);
    }
};

export const datasetService = {
    async list(projectId) {
        return api.get(`datasets/?project_id=${projectId}`);
    },
    async upload(projectId, file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('project', projectId);
        formData.append('name', file.name);

        return api.post('datasets/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    async preview(datasetId, page = 1, pageSize = 50) {
        return api.get(`datasets/${datasetId}/preview/?page=${page}&page_size=${pageSize}`);
    },
    async delete(datasetId) {
        return api.delete(`datasets/${datasetId}/`);
    },
    async getStats(datasetId) {
        return api.get(`datasets/${datasetId}/stats/`);
    },
    async refreshStats(datasetId) {
        return api.post(`datasets/${datasetId}/refresh_stats/`);
    },
    async preprocess(datasetId, steps) {
        return api.post(`datasets/${datasetId}/preprocess/`, { steps });
    },
    async getCorrelation(datasetId) {
        return api.get(`datasets/${datasetId}/correlation/`);
    },
    async updateContent(datasetId, data) {
        return api.post(`datasets/${datasetId}/update_content/`, { data });
    },
};

export const experimentService = {
    async list(projectId) {
        return api.get(`experiments/?project_id=${projectId}`);
    },
    async create(data) {
        return api.post('experiments/', data);
    },
    async update(id, data) {
        return api.patch(`experiments/${id}/`, data);
    }
};

export const trainingService = {
    async createRun(experimentId) {
        return api.post('runs/', { experiment: experimentId });
    },
    async startRun(runId, data) {
        return api.post(`runs/${runId}/start/`, data);
    },
    async getRun(runId) {
        return api.get(`runs/${runId}/`);
    },
    async getRunStatus(runId) {
        return api.get(`runs/${runId}/`);
    },
    async listRuns(experimentId) {
        return api.get(`runs/?experiment_id=${experimentId}`);
    }
};

export default api;
