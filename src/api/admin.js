import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api/admin', // 确保指向 Flask 后端
  timeout: 5000
});

// --- 用户与教师管理 ---
export const getPendingUsers = () => api.get('/pending_users');
export const approveUser = (id) => api.post(`/approve_user/${id}`);
export const rejectUser = (id) => api.delete(`/reject_user/${id}`);
export const getTeachers = () => api.get('/teachers');
export const updateTeacher = (id, data) => api.put(`/teachers/${id}`, data);

// --- 班级管理 ---
export const getClasses = () => api.get('/classes');
export const addClass = (data) => api.post('/classes', data);

// --- 学生管理 ---
export const getStudents = (params) => api.get('/students', { params });
export const addStudent = (data) => api.post('/students', data);

// --- 成绩统计 ---
export const getClassReport = (params) => api.get('/stats/class_report', { params });

// --- 科目登记 ---
export const getAssignments = () => api.get('/assignments');
export const addAssignment = (data) => api.post('/assignments', data);
export const deleteAssignment = (id) => api.delete(`/assignments/${id}`);
export const getSubjects = () => api.get('/subjects');//科目下拉框选择