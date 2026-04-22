import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5902/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getSubjects = () => api.get('/subjects').then(res => res.data);
export const getCourses = (params) => api.get('/courses', { params }).then(res => res.data);
export const getCourse = (id) => api.get(`/courses/${id}`).then(res => res.data);
export const getCourseGrades = (id) => api.get(`/courses/${id}/grades`).then(res => res.data);

export default api;