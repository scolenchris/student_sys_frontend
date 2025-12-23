import { createRouter, createWebHistory } from 'vue-router';
import Login from '../views/Login.vue';
import AdminDashboard from '../views/admin/Dashboard.vue';
import TeacherDashboard from '../views/teacher/Dashboard.vue';

const routes = [
  { path: '/', component: Login },
  { 
    path: '/admin', 
    component: AdminDashboard,
    redirect: '/admin/approval', // 新增：访问 /admin 时自动跳到审核页
    children: [
      { path: 'approval', component: () => import('../views/admin/UserApproval.vue') },
      { path: 'teachers', component: () => import('../views/admin/TeacherList.vue') },
      { path: 'classes', component: () => import('../views/admin/ClassMgmt.vue') },
      { path: 'students', component: () => import('../views/admin/StudentMgmt.vue') },
      { path: 'stats', component: () => import('../views/admin/ScoreStats.vue') },
      { path: 'assignments', component: () => import('../views/admin/CourseAssignment.vue') },
    ]
  },
  { 
    path: '/teacher', 
    component: TeacherDashboard,
    redirect: '/teacher/scores', // 新增：访问 /teacher 时自动跳到成绩录入
    children: [
      { path: 'scores', component: () => import('../views/teacher/ScoreEntry.vue') }
    ]
  }
];

export const router = createRouter({
  history: createWebHistory(),
  routes
});