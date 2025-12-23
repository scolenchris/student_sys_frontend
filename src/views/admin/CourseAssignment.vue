<template>
  <el-card>
    <template #header>
      <div class="header">
        <span>任课分配管理</span>
        <el-button type="primary" @click="openDialog">新增分配</el-button>
      </div>
    </template>

    <el-table :data="assignments" border stripe>
      <el-table-column prop="teacher_name" label="教师姓名" />
      <el-table-column prop="grade_class" label="任教班级" />
      <el-table-column prop="subject_name" label="教学科目" />
      <el-table-column label="操作">
        <template #default="scope">
          <el-button type="danger" size="small" @click="handleDelete(scope.row.id)">取消分配</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="visible" title="为教师分配班级和科目" width="400px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="选择教师">
          <el-select v-model="form.teacher_id" placeholder="请选择">
            <el-option v-for="t in teachers" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="选择班级">
          <el-select v-model="form.class_id" placeholder="请选择">
            <el-option v-for="c in classes" :key="c.id" :label="c.grade_name + '(' + c.class_num + ')班'" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="选择科目">
          <el-select v-model="form.subject_id" placeholder="请选择">
            <el-option v-for="s in subjects" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="submit">确定分配</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import * as adminApi from '../../api/admin';
import { ElMessage } from 'element-plus';

const assignments = ref([]);
const teachers = ref([]);
const classes = ref([]);
const subjects = ref([]);
const visible = ref(false);

const form = reactive({ teacher_id: '', class_id: '', subject_id: '' });

const fetchData = async () => {
  const res = await adminApi.getAssignments();
  assignments.value = res.data;
};

const openDialog = async () => {
  // 加载下拉框所需的数据
  const [tRes, cRes, sRes] = await Promise.all([
    adminApi.getTeachers(),
    adminApi.getClasses(),
    adminApi.getSubjects() // 注意：需确保后端有获取科目的接口
  ]);
  teachers.value = tRes.data;
  classes.value = cRes.data;
  subjects.value = sRes.data;
  visible.value = true;
};

const submit = async () => {
  try {
    await adminApi.addAssignment(form);
    ElMessage.success('分配成功');
    visible.value = false;
    fetchData();
  } catch (err) {
    ElMessage.error(err.response?.data?.msg || '分配失败');
  }
};

const handleDelete = async (id) => {
  await adminApi.deleteAssignment(id);
  fetchData();
};

onMounted(fetchData);
</script>