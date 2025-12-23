<template>
  <el-card>
    <template #header><h3>教师管理</h3></template>
    <el-table :data="teachers">
      <el-table-column prop="name" label="姓名" />
      <el-table-column prop="username" label="工号" />
      <el-table-column prop="subject_name" label="负责科目" />
      <el-table-column prop="phone" label="手机号" />
      <el-table-column label="操作">
        <template #default="scope">
          <el-button size="small" @click="editTeacher(scope.row)">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="editVisible" title="修改教师信息" width="30%">
      <el-form :model="currentTeacher" label-width="80px">
        <el-form-item label="姓名">
          <el-input v-model="currentTeacher.name" />
        </el-form-item>
        <el-form-item label="手机">
          <el-input v-model="currentTeacher.phone" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="saveTeacher">保存</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getTeachers, updateTeacher } from '../../api/admin';
import { ElMessage } from 'element-plus';

const teachers = ref([]);
const editVisible = ref(false);
const currentTeacher = ref({});

const fetchData = async () => {
  const res = await getTeachers();
  teachers.value = res.data;
};

const editTeacher = (row) => {
  currentTeacher.value = { ...row };
  editVisible.value = true;
};

const saveTeacher = async () => {
  await updateTeacher(currentTeacher.value.id, currentTeacher.value);
  ElMessage.success('更新成功');
  editVisible.value = false;
  fetchData();
};

onMounted(fetchData);
</script>