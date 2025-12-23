<template>
  <el-card>
    <template #header><h3>待审核用户</h3></template>
    <el-table :data="pendingUsers" style="width: 100%">
      <el-table-column prop="username" label="用户名/工号" />
      <el-table-column prop="name" label="姓名" />
      <el-table-column prop="role" label="申请角色">
        <template #default="scope">
          <el-tag :type="scope.row.role === 'admin' ? 'danger' : 'success'">
            {{ scope.row.role === 'admin' ? '管理员' : '老师' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作">
        <template #default="scope">
          <el-button type="success" size="small" @click="handleApprove(scope.row.id)">通过</el-button>
          <el-button type="danger" size="small" @click="handleReject(scope.row.id)">拒绝</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getPendingUsers, approveUser, rejectUser } from '../../api/admin';
import { ElMessage } from 'element-plus';

const pendingUsers = ref([]);

const fetchData = async () => {
  const res = await getPendingUsers();
  pendingUsers.value = res.data;
};

const handleApprove = async (id) => {
  await approveUser(id);
  ElMessage.success('审核已通过');
  fetchData();
};

const handleReject = async (id) => {
  await rejectUser(id);
  ElMessage.info('已拒绝该申请');
  fetchData();
};

onMounted(fetchData);
</script>