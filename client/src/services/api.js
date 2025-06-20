import axios from 'axios';

const API_URL = 'https://disaster-res-server.onrender.com/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const login = (username, password) => {
  return api.post('/auth/login', { username, password });
};

export const getProfile = () => {
  return api.get('/auth/profile');
};

// Disasters API
export const getDisasters = (params) => {
  return api.get('/disasters', { params });
};

export const getDisasterById = (id) => {
  return api.get(`/disasters/${id}`);
};

export const createDisaster = (disasterData) => {
  return api.post('/disasters', disasterData);
};

export const updateDisaster = (id, disasterData) => {
  return api.put(`/disasters/${id}`, disasterData);
};

export const deleteDisaster = (id) => {
  return api.delete(`/disasters/${id}`);
};

export const getSocialMediaPosts = (disasterId) => {
  return api.get(`/disasters/${disasterId}/social-media`);
};

export const getOfficialUpdates = (disasterId) => {
  return api.get(`/disasters/${disasterId}/official-updates`);
};

export const verifyImage = (disasterId, imageUrl, reportId) => {
  return api.post(`/disasters/${disasterId}/verify-image`, { 
    image_url: imageUrl, 
    report_id: reportId 
  });
};

export const geocodeLocation = (text) => {
  return api.post('/disasters/geocode', { text });
};

// Resources API
export const getResourcesForDisaster = (disasterId, params) => {
  return api.get(`/resources/disaster/${disasterId}`, { params });
};

export const createResource = (resourceData) => {
  return api.post('/resources', resourceData);
};

// Reports API
export const getReportsForDisaster = (disasterId) => {
  return api.get(`/reports/disaster/${disasterId}`);
};

export const createReport = (reportData) => {
  return api.post('/reports', reportData);
};

export default api;