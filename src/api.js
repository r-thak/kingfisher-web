import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/v1' : 'https://kingfisherapi.rthak.com/v1'),
  headers: {
    'Content-Type': 'application/json',
  },
});


export const getSubjects = () => api.get('/subjects').then(res => res.data);
export const getCourses = (params) => api.get('/courses', { params }).then(res => res.data);
export const getCourse = (id) => api.get(`/courses/${id}`).then(res => res.data);
export const getCourseGrades = (id) => api.get(`/courses/${id}/grades`).then(res => res.data);
export const getTerms = () => api.get('/terms').then(res => res.data);
export const getSectionTypes = () => api.get('/sections/types').then(res => res.data);
export const getScheduledSections = (id, term) =>
  api.get(`/courses/${id}/scheduled-sections`, { params: { term } }).then(res => res.data);
export const refreshCourseSections = (id, term) =>
  api.post(`/courses/${id}/sections/refresh`, null, { params: { term } }).then(res => res.data);
export const getCourseRefreshStatus = (id, term) =>
  api.get(`/courses/${id}/sections/refresh-status`, { params: { term } }).then(res => res.data);
export const getInstructors = (params) => api.get('/instructors', { params }).then(res => res.data);
export const exploreSubjects = (params) => api.get('/explore/subjects', { params }).then(res => res.data);
export const exploreCourses = (params) => api.get('/explore/courses', { params }).then(res => res.data);
export const exploreInstructors = (params) => api.get('/explore/instructors', { params }).then(res => res.data);

export default api;