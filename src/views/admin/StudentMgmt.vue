<template>
  <el-card>
    <div style="margin-bottom: 20px; display: flex; gap: 10px;">
      <el-select v-model="filterClassId" placeholder="按班级筛选" clearable @change="fetchStudents">
        <el-option v-for="c in classes" :key="c.id" 
                   :label="`${c.grade_name}(${c.class_num})班`" :value="c.id" />
      </el-select>
      <el-button type="primary" @click="openAddDialog">添加学生</el-button>
    </div>

    <el-table :data="studentData" v-loading="loading">
      <el-table-column prop="student_id" label="学号" />
      <el-table-column prop="name" label="姓名" />
      <el-table-column prop="gender" label="性别" />
      <el-table-column prop="grade_class" label="所属班级" />
    </el-table>

    <el-dialog v-model="addVisible" title="录入新学生学籍" width="400px">
      <el-form :model="newStudent" label-width="80px">
        <el-form-item label="学号">
          <el-input v-model="newStudent.student_id" placeholder="请输入唯一学号" />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="newStudent.name" placeholder="学生姓名" />
        </el-form-item>
        <el-form-item label="性别">
          <el-radio-group v-model="newStudent.gender">
            <el-radio label="男">男</el-radio>
            <el-radio label="女">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="分配班级">
          <el-select v-model="newStudent.class_id" placeholder="请选择班级">
            <el-option v-for="c in classes" :key="c.id" 
                       :label="`${c.grade_name}(${c.class_num})班`" :value="c.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addVisible = false">取消</el-button>
        <el-button type="primary" @click="submitStudent" :loading="submitLoading">提交保存</el-button>
      </template>
    </el-dialog>

    <el-pagination layout="prev, pager, next" :total="total" @current-change="handlePageChange" />
  </el-card>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { getStudents, addStudent, getClasses } from '../../api/admin'; // 确保 api/admin.js 已更新
import { ElMessage } from 'element-plus';

const studentData = ref([]);
const classes = ref([]);
const filterClassId = ref(null);
const total = ref(0);
const addVisible = ref(false);
const submitLoading = ref(false);

// 新学生表单数据
const newStudent = reactive({
  student_id: '',
  name: '',
  gender: '男',
  class_id: null
});

const openAddDialog = () => {
  addVisible.value = true;
};

// 【关键逻辑】提交学生信息到后端
const submitStudent = async () => {
  if (!newStudent.student_id || !newStudent.name || !newStudent.class_id) {
    return ElMessage.warning('请填写完整的学生信息');
  }
  
  submitLoading.value = true;
  try {
    const res = await addStudent(newStudent);
    ElMessage.success('学生添加成功');
    addVisible.value = false;
    // 重置表单
    Object.assign(newStudent, { student_id: '', name: '', gender: '男', class_id: null });
    fetchStudents(); // 刷新列表
  } catch (error) {
    ElMessage.error(error.response?.data?.msg || '保存失败');
  } finally {
    submitLoading.value = false;
  }
};

const fetchStudents = async () => {
  const res = await getStudents({ page: 1, class_id: filterClassId.value });
  studentData.value = res.data.data;
  total.value = res.data.total;
};

const fetchClasses = async () => {
  const res = await getClasses();
  classes.value = res.data;
};

onMounted(() => {
  fetchClasses();
  fetchStudents();
});
</script>