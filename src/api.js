import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getSubjects = () => api.get('/subjects').then(res => res.data);
export const getCourses = (params) => api.get('/courses', { params }).then(res => res.data);
export const getCourse = (id) => api.get(`/courses/${id}`).then(res => res.data);
export const getCourseGrades = (id) => api.get(`/courses/${id}/grades`).then(res => res.data);

export default api;
