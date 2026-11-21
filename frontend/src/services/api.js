import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ibh_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Unwrap standard response structure
api.interceptors.response.use(
  (response) => {
    // Return standard response structure
    return response.data;
  },
  (error) => {
    const errorData = error.response ? error.response.data : {
      success: false,
      message: error.message || 'Network connection failed',
      error: error.message
    };
    return Promise.reject(errorData);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  me: () => api.get('/auth/me')
};

export const mastersAPI = {
  getAll: () => api.get('/masters/all'),
  // Item Types
  getItemTypes: () => api.get('/masters/item-types'),
  createItemType: (data) => api.post('/masters/item-types', data),
  updateItemType: (id, data) => api.put(`/masters/item-types/${id}`, data),
  deleteItemType: (id) => api.delete(`/masters/item-types/${id}`),
  // Classes
  getClasses: () => api.get('/masters/classes'),
  createClass: (data) => api.post('/masters/classes', data),
  updateClass: (id, data) => api.put(`/masters/classes/${id}`, data),
  deleteClass: (id) => api.delete(`/masters/classes/${id}`),
  // Subjects
  getSubjects: () => api.get('/masters/subjects'),
  createSubject: (data) => api.post('/masters/subjects', data),
  updateSubject: (id, data) => api.put(`/masters/subjects/${id}`, data),
  deleteSubject: (id) => api.delete(`/masters/subjects/${id}`),
  // Publishers
  getPublishers: () => api.get('/masters/publishers'),
  createPublisher: (data) => api.post('/masters/publishers', data),
  updatePublisher: (id, data) => api.put(`/masters/publishers/${id}`, data),
  deletePublisher: (id) => api.delete(`/masters/publishers/${id}`),
  // Boards
  getBoards: () => api.get('/masters/boards'),
  createBoard: (data) => api.post('/masters/boards', data),
  updateBoard: (id, data) => api.put(`/masters/boards/${id}`, data),
  deleteBoard: (id) => api.delete(`/masters/boards/${id}`),
  // Curriculums
  getCurriculums: () => api.get('/masters/curriculums'),
  createCurriculum: (data) => api.post('/masters/curriculums', data),
  updateCurriculum: (id, data) => api.put(`/masters/curriculums/${id}`, data),
  deleteCurriculum: (id) => api.delete(`/masters/curriculums/${id}`),
  // Roles
  getRoles: () => api.get('/masters/roles'),
  createRole: (data) => api.post('/masters/roles', data),
  updateRole: (id, data) => api.put(`/masters/roles/${id}`, data),
  deleteRole: (id) => api.delete(`/masters/roles/${id}`)
};

export const schoolsAPI = {
  getAll: () => api.get('/schools'),
  getById: (id) => api.get(`/schools/${id}`),
  create: (data) => api.post('/schools', data),
  update: (id, data) => api.put(`/schools/${id}`, data),
  delete: (id) => api.delete(`/schools/${id}`)
};

export const itemsAPI = {
  getAll: (params) => api.get('/items', { params }),
  getById: (id) => api.get(`/items/${id}`),
  create: (data) => api.post('/items', data),
  update: (id, data) => api.put(`/items/${id}`, data),
  delete: (id) => api.delete(`/items/${id}`),
  downloadTemplate: () => `${API_BASE_URL}/items/template`,
  uploadExcel: (formData) => api.post('/items/upload-excel', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};

export const studentsAPI = {
  getRoster: (params) => api.get('/students', { params }),
  getById: (id) => api.get(`/students/${id}`),
  register: (data) => api.post('/students', data),
  updateChecklist: (id, data) => api.patch(`/students/${id}/checklist`, data),
  delete: (id) => api.delete(`/students/${id}`),
  downloadTemplate: () => `${API_BASE_URL}/students/template`,
  uploadExcel: (formData) => api.post('/students/upload-excel', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};

export default api;
