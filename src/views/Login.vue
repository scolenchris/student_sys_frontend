<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <h2 style="text-align: center;">{{ isRegister ? '新用户注册' : '学生管理系统登录' }}</h2>
      </template>

      <el-form :model="form" label-width="80px">
        <el-form-item v-if="isRegister" label="真实姓名">
          <el-input v-model="form.name" placeholder="请输入真实姓名" />
        </el-form-item>

        <el-form-item label="用户名">
          <el-input v-model="form.username" placeholder="建议使用工号" />
        </el-form-item>

        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" show-password />
        </el-form-item>

        <el-form-item v-if="isRegister" label="申请身份">
          <el-radio-group v-model="form.role">
            <el-radio label="teacher">任课教师</el-radio>
            <el-radio label="admin">系统管理员</el-radio>
          </el-radio-group>
        </el-form-item>

        <div class="btn-group">
          <el-button type="primary" @click="handleSubmit" :loading="loading" style="width: 100%;">
            {{ isRegister ? '提交申请' : '立即登录' }}
          </el-button>
          <el-link @click="isRegister = !isRegister" style="margin-top: 15px;">
            {{ isRegister ? '已有账号？去登录' : '没有账号？去注册申请' }}
          </el-link>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { loginApi, registerApi } from '../api/auth';
import { ElMessage } from 'element-plus';

const router = useRouter();
const isRegister = ref(false);
const loading = ref(false);

const form = reactive({
  username: '',
  password: '',
  name: '',
  role: 'teacher'
});

const handleSubmit = async () => {
  if (!form.username || !form.password) {
    return ElMessage.warning('请填写完整信息');
  }
  
  loading.value = true;
  try {
    if (isRegister.value) {
      const res = await registerApi(form);
      ElMessage.success(res.data.msg);
      isRegister.value = false; // 注册后切换到登录
    } else {
      const res = await loginApi({ username: form.username, password: form.password });
      localStorage.setItem('user_id', res.data.user_id);
      localStorage.setItem('user_role', res.data.role);
      localStorage.setItem('username', res.data.username);
      ElMessage.success('登录成功');
      // 存储用户信息并跳转
      localStorage.setItem('user_role', res.data.role);
      // router.push(res.data.role === 'admin' ? '/admin/dashboard' : '/teacher/dashboard');
      // router.push(res.data.role === 'admin' ? '/admin' : '/teacher');
      setTimeout(() => {
        if (res.data.role === 'admin') {
          router.push('/admin/approval');
        } else {
          router.push('/teacher/scores'); // 直接跳转到子路由，不要只跳到 /teacher
        }
      }, 100);
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.msg || '操作失败');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f7fa; /* 浅色背景对旧显示器更友好 */
}
.login-card {
  width: 400px;
}
.btn-group {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>