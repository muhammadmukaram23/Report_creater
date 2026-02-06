import axios from 'axios';

const API_BASE_URL = '/api';
const UPLOADS_BASE_URL = '/uploads';

const api = axios.create({
    baseURL: API_BASE_URL,
});

export const schemeService = {
    getAll: (params = {}) => api.get('/scheme', { params }),
    getOne: (id) => api.get(`/scheme/${id}`),
    create: (data) => api.post('/scheme', data),
    update: (id, data) => api.put(`/scheme/${id}`, data),
    delete: (id) => api.delete(`/scheme/${id}`),
};

export const componentService = {
    getAll: (gs_no) => api.get('/component', { params: { gs_no } }),
    getOne: (id) => api.get(`/component/${id}`),
    create: (data) => api.post('/component', data),
    update: (id, data) => api.put(`/component/${id}`, data),
    delete: (id) => api.delete(`/component/${id}`),
    getImages: (id) => api.get(`/component/${id}/images`),
};

export const uploadService = {
    uploadBefore: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/upload/before', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    uploadAfter: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/upload/after', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
};

export const getImageUrl = (path, type) => {
    if (!path) return null;
    return `${UPLOADS_BASE_URL}/${type}/${path}`;
};

export default api;
