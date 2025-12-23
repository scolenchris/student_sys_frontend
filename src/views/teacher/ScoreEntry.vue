<template>
  <el-card>
    <template #header>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: bold;">成绩录入工作台</span>
        <div style="display: flex; gap: 10px;">
          <el-select v-model="selectedKey" placeholder="请选择任教班级与科目" @change="handleCourseChange" style="width: 260px;">
            <el-option 
              v-for="item in myCourses" 
              :key="item.assignment_id" 
              :label="`${item.grade_class} - ${item.subject_name}`" 
              :value="item.assignment_id" />
          </el-select>
          <el-input v-model="term" placeholder="学期 e.g. 2024-1" style="width: 120px;" />
        </div>
      </div>
    </template>

    <el-table :data="students" border stripe v-loading="loading">
      <el-table-column prop="student_no" label="学号" width="140" />
      <el-table-column prop="name" label="姓名" width="120" />
      <el-table-column label="成绩 (0-100)">
        <template #default="scope">
          <el-input-number v-model="scope.row.score" :min="0" :max="100" :precision="1" />
        </template>
      </el-table-column>
    </el-table>

    <div style="margin-top: 20px; text-align: right;">
      <el-button type="primary" size="large" @click="saveAllScores" :disabled="!selectedKey">
        保存本页成绩
      </el-button>
    </div>
  </el-card>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router'; // 引入路由
import { ElMessage } from 'element-plus';
// 引入封装好的 API 接口
import { getMyCourses, getScoreList, saveScores } from '../../api/teacher';

const router = useRouter(); // 初始化路由
const myCourses = ref([]);
const selectedKey = ref(null); 
const selectedInfo = ref(null); 
const students = ref([]);
const term = ref('2024-2025-1');
const loading = ref(false);

// 获取老师的课程列表
const fetchMyCourses = async () => {
  const userId = localStorage.getItem('user_id');
  
  if (!userId || userId === 'undefined') {
    ElMessage.error('登录失效，请重新登录');
    router.push('/');
    return;
  }

  try {
    // 使用封装接口 getMyCourses
    const res = await getMyCourses(userId);
    myCourses.value = res.data;
  } catch (err) {
    console.error('获取课程失败', err);
  }
};

// 下拉框切换触发
const handleCourseChange = async (assignmentId) => {
  const info = myCourses.value.find(item => item.assignment_id === assignmentId);
  selectedInfo.value = info;
  
  loading.value = true;
  try {
    // 使用封装接口 getScoreList
    const res = await getScoreList({ 
      class_id: info.class_id, 
      subject_id: info.subject_id, 
      term: term.value 
    });
    students.value = res.data;
  } catch (err) {
    ElMessage.error('获取学生名单失败');
  } finally {
    loading.value = false;
  }
};

// 提交成绩
const saveAllScores = async () => {
  try {
    // 使用封装接口 saveScores
    await saveScores({
      subject_id: selectedInfo.value.subject_id,
      term: term.value,
      scores: students.value.map(s => ({
        student_id: s.student_id, 
        score: s.score
      }))
    });
    ElMessage.success('成绩已成功保存并同步');
  } catch (err) {
    ElMessage.error('保存失败');
  }
};

onMounted(fetchMyCourses);
</script>