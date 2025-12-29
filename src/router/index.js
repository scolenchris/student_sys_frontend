import { createRouter, createWebHistory } from "vue-router";
import Login from "../views/Login.vue";
import AdminDashboard from "../views/admin/Dashboard.vue";
import TeacherDashboard from "../views/teacher/Dashboard.vue";
import ChangePassword from "../views/ChangePassword.vue";
import { ElMessage } from "element-plus";

const routes = [
  { path: "/", name: "Login", component: Login },
  {
    path: "/change-password",
    name: "ChangePassword",
    component: ChangePassword,
    meta: { requiresAuth: true }, // 标记需要登录
  },
  {
    path: "/admin",
    component: AdminDashboard,
    redirect: "/admin/approval",
    meta: { requiresAuth: true, role: "admin" }, // 标记需要管理员权限
    children: [
      {
        path: "approval",
        component: () => import("../views/admin/UserApproval.vue"),
      },
      {
        path: "teachers",
        component: () => import("../views/admin/TeacherList.vue"),
      },
      {
        path: "classes",
        component: () => import("../views/admin/ClassMgmt.vue"),
      },
      {
        path: "students",
        component: () => import("../views/admin/StudentMgmt.vue"),
      },
      {
        path: "stats",
        component: () => import("../views/admin/ScoreStats.vue"),
      },
      {
        path: "assignments",
        component: () => import("../views/admin/CourseAssignment.vue"),
      },
      {
        path: "exams",
        component: () => import("../views/admin/ExamPublish.vue"),
      },
    ],
  },
  {
    path: "/teacher",
    component: TeacherDashboard,
    redirect: "/teacher/scores",
    meta: { requiresAuth: true, role: "teacher" }, // 标记需要老师权限
    children: [
      {
        path: "scores",
        component: () => import("../views/teacher/ScoreEntry.vue"),
      },
    ],
  },
  // 捕获所有未定义路由，重定向到登录
  {
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

// --- 核心修复：全局路由守卫 ---
router.beforeEach((to, from, next) => {
  // 获取本地存储的用户信息
  const role = localStorage.getItem("user_role");
  const isAuthenticated = !!role; // 是否已登录

  // 1. 如果要去的是 登录页
  if (to.path === "/") {
    if (isAuthenticated) {
      // 如果已经登录了，根据角色自动跳转到对应首页，防止重复登录
      if (role === "admin") return next("/admin/approval");
      if (role === "teacher") return next("/teacher/scores");
    }
    return next(); // 没登录就正常去登录页
  }

  // 2. 检查该路由是否需要登录 (Matched 数组包含父级路由的 meta)
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);

  if (requiresAuth && !isAuthenticated) {
    ElMessage.warning("请先登录系统");
    return next("/"); // 没登录，踢回首页
  }

  // 3. 权限检查 (例如：老师不能访问 /admin)
  // 获取该路由要求的角色 (如果有的话)
  // 我们只看最顶层的父路由配置即可
  const requiredRole = to.matched.find((record) => record.meta.role)?.meta.role;

  if (requiredRole && requiredRole !== role) {
    ElMessage.error("无权访问该页面");
    return next("/"); // 角色不匹配，踢回首页
  }

  // 4. 一切正常，放行
  next();
});
